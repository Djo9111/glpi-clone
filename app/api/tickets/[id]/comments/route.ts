// app/api/tickets/[id]/comments/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// ——— helper auth ———
function getUser(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "");
  if (!token) throw new Error("NO_TOKEN");
  return jwt.verify(token, JWT_SECRET) as any; // { id, role, ... }
}

// GET /api/tickets/:id/comments
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> } // params est un Promise
) {
  const { id } = await ctx.params; // on attend params
  const ticketId = Number(id);
  if (Number.isNaN(ticketId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  try {
    const me = getUser(req);

    // Accès : technicien assigné, chef DSI ou créateur du ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { assignedToId: true, createdById: true },
    });
    if (!ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

    const canSee =
      me.role === "CHEF_DSI" || me.id === ticket.assignedToId || me.id === ticket.createdById;
    if (!canSee) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const comments = await prisma.commentaire.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        contenu: true,
        createdAt: true,
        auteur: { select: { id: true, prenom: true, nom: true } },
      },
    });

    return NextResponse.json(comments);
  } catch (e: any) {
    const code = e?.name === "JsonWebTokenError" ? 401 : 500;
    return NextResponse.json({ error: "Erreur d’authentification" }, { status: code });
  }
}

// POST /api/tickets/:id/comments
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const ticketId = Number(id);
  if (Number.isNaN(ticketId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  try {
    const me = getUser(req);
    const body = await req.json().catch(() => ({}));
    const contenu = (body?.contenu ?? "").toString().trim();

    if (contenu.length < 2) {
      return NextResponse.json({ error: "Commentaire trop court" }, { status: 400 });
    }
    if (contenu.length > 4000) {
      return NextResponse.json({ error: "Commentaire trop long (max 4000)" }, { status: 400 });
    }

    // Autorisation : technicien assigné, chef DSI **ou créateur du ticket (employé)**
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { assignedToId: true, createdById: true },
    });
    if (!ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

    const allowed =
      me.role === "CHEF_DSI" || me.id === ticket.assignedToId || me.id === ticket.createdById;
    if (!allowed) {
      return NextResponse.json(
        { error: "Seuls le technicien assigné, le chef DSI ou le créateur peuvent commenter" },
        { status: 403 }
      );
    }

    const created = await prisma.commentaire.create({
      data: {
        contenu,
        ticketId,
        auteurId: me.id,
      },
      select: {
        id: true,
        contenu: true,
        createdAt: true,
        auteur: { select: { id: true, prenom: true, nom: true } },
      },
    });

    // (optionnel) créer une Notification ici…

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    const code = e?.name === "JsonWebTokenError" ? 401 : 500;
    return NextResponse.json({ error: "Erreur serveur ou authentification" }, { status: code });
  }
}
