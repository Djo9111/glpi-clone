// app/api/tickets/[id]/pieces-jointes/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

function getUserFromRequest(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; role: string };
  } catch {
    return null;
  }
}

// ⬇️ NOTE: params is async; await it before use
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> } // 👈 make params a Promise
) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await ctx.params; // 👈 await here
    const ticketId = Number(id);
    if (!Number.isFinite(ticketId)) {
      return NextResponse.json({ error: "Paramètre invalide" }, { status: 400 });
    }

    const t = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { createdById: true, assignedToId: true },
    });

    if (!t) {
      return NextResponse.json([]); // ticket inexistant -> pas d'erreur UI
    }

    const allowed =
      auth.role === "CHEF_DSI" ||
      auth.id === t.createdById ||
      (t.assignedToId != null && auth.id === t.assignedToId);

    if (!allowed) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const pjs = await prisma.pieceJointe.findMany({
      where: { ticketId },
      orderBy: { dateAjout: "asc" },
      select: { id: true, nomFichier: true, chemin: true },
    });

    return NextResponse.json(
      pjs.map((p) => ({ id: p.id, nomFichier: p.nomFichier, url: p.chemin }))
    );
  } catch (e) {
    console.error("Erreur GET pièces jointes:", e);
    return NextResponse.json([]);
  }
}
