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
  return jwt.verify(token, JWT_SECRET) as {
    id: number;
    role: string;
    codeHierarchique: number;
    departementId: number | null;
  };
}

/**
 * Vérifier si l'utilisateur peut voir ce ticket
 * - CHEF_DSI : voit tout
 * - TECHNICIEN : ses tickets assignés + ses propres tickets
 * - EMPLOYE : ses tickets + tickets de ses subordonnés (même département, code inférieur)
 */
async function canAccessTicket(userId: number, userRole: string, userCode: number, userDept: number | null, ticketId: number) {
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

  if (!ticket) return { allowed: false, ticket: null };

  // CHEF_DSI voit tout
  if (userRole === "CHEF_DSI") return { allowed: true, ticket };

  // TECHNICIEN : tickets assignés ou créés par lui
  if (userRole === "TECHNICIEN") {
    const allowed = userId === ticket.assignedToId || userId === ticket.createdById;
    return { allowed, ticket };
  }

  // EMPLOYE : ses tickets OU tickets de ses subordonnés
  if (userId === ticket.createdById) return { allowed: true, ticket };

  // Vérifier si c'est un subordonné (même département + code inférieur)
  if (
    userCode > 0 &&
    userDept &&
    ticket.createdBy.departementId === userDept &&
    ticket.createdBy.codeHierarchique < userCode
  ) {
    return { allowed: true, ticket };
  }

  return { allowed: false, ticket };
}

// GET /api/tickets/:id/comments
export async function GET(
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

    // Vérifier l'accès avec la logique hiérarchique
    const { allowed } = await canAccessTicket(
      me.id,
      me.role,
      me.codeHierarchique,
      me.departementId,
      ticketId
    );

    if (!allowed) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

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
    console.error("GET comments error:", e);
    const code = e?.name === "JsonWebTokenError" || e?.message === "NO_TOKEN" ? 401 : 500;
    return NextResponse.json({ error: "Erreur d'authentification" }, { status: code });
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

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { assignedToId: true, createdById: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
    }

    // Pour COMMENTER : seulement le technicien assigné, chef DSI ou créateur du ticket
    // Les supérieurs hiérarchiques peuvent VOIR mais pas COMMENTER (logique métier)
    const allowed =
      me.role === "CHEF_DSI" ||
      me.id === ticket.assignedToId ||
      me.id === ticket.createdById;

    if (!allowed) {
      return NextResponse.json(
        { error: "Seuls le technicien assigné, l'admin ou le créateur peuvent commenter" },
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

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("POST comment error:", e);
    const code = e?.name === "JsonWebTokenError" || e?.message === "NO_TOKEN" ? 401 : 500;
    return NextResponse.json({ error: "Erreur serveur ou authentification" }, { status: code });
  }
}