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
    return jwt.verify(token, JWT_SECRET) as {
      id: number;
      role: string;
      codeHierarchique: number;
      departementId: number | null;
    };
  } catch {
    return null;
  }
}

/**
 * Vérifier si l'utilisateur peut voir ce ticket
 * - CHEF_DSI : voit tout
 * - TECHNICIEN : ses tickets assignés + ses propres tickets
 * - EMPLOYE : ses tickets + tickets de ses subordonnés (même département, code inférieur)
 */
async function canAccessTicket(
  userId: number,
  userRole: string,
  userCode: number,
  userDept: number | null,
  ticketId: number
) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      assignedToId: true,
      createdById: true,
      createdBy: {
        select: {
          departementId: true,
          codeHierarchique: true,
        },
      },
    },
  });

  if (!ticket) return false;

  // CHEF_DSI voit tout
  if (userRole === "CHEF_DSI") return true;

  // TECHNICIEN : tickets assignés ou créés par lui
  if (userRole === "TECHNICIEN") {
    return userId === ticket.assignedToId || userId === ticket.createdById;
  }

  // EMPLOYE : ses tickets
  if (userId === ticket.createdById) return true;

  // Vérifier si c'est un subordonné (même département + code inférieur)
  if (
    userCode > 0 &&
    userDept &&
    ticket.createdBy.departementId === userDept &&
    ticket.createdBy.codeHierarchique < userCode
  ) {
    return true;
  }

  return false;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const ticketId = Number(id);
    if (!Number.isFinite(ticketId)) {
      return NextResponse.json({ error: "Paramètre invalide" }, { status: 400 });
    }

    // Vérifier l'accès avec la logique hiérarchique
    const allowed = await canAccessTicket(
      auth.id,
      auth.role,
      auth.codeHierarchique,
      auth.departementId,
      ticketId
    );

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
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}