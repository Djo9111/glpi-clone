// app/api/admin/tickets/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, Statut } from "@prisma/client";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

function getUser(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as { id: number; role: string }; }
  catch { return null; }
}

// GET /api/admin/tickets/[id]
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const payload = getUser(_req);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "CHEF_DSI") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await ctx.params;
  const ticketId = Number(id);
  if (!Number.isFinite(ticketId)) {
    return NextResponse.json({ error: "Paramètre invalide" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      createdBy: { select: { id: true, prenom: true, nom: true } },
      assignedTo: { select: { id: true, prenom: true, nom: true } },
      departement: { select: { id: true, nom: true } },
      application: { select: { id: true, nom: true } },
      materiel: { select: { id: true, nom: true } },
    },
  });
  if (!ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

  return NextResponse.json(ticket);
}

// PATCH /api/admin/tickets/[id]
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const payload = getUser(req);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "CHEF_DSI") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await ctx.params;
  const ticketId = Number(id);
  if (!Number.isFinite(ticketId)) {
    return NextResponse.json({ error: "Paramètre invalide" }, { status: 400 });
  }

  const body = await req.json() as {
    assignedToId?: number | null;
    statut?: "OPEN" | "IN_PROGRESS" | "A_CLOTURER" | "REJETE" | "TRANSFERE_MANTICE" | "CLOSED";
  };

  try {
    // Lire l'état actuel pour calculs
    const current = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!current) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

    const data: any = {};
    const now = new Date();

    // Gestion assignation/désassignation
    if (typeof body.assignedToId !== "undefined") {
      data.assignedTo = body.assignedToId
        ? { connect: { id: body.assignedToId } }
        : { disconnect: true };
    }

    // Transitions de statut
    if (body.statut) {
      data.statut = body.statut as Statut;

      // (1) Passage à IN_PROGRESS → initialiser prisEnChargeAt si manquant
      if (body.statut === "IN_PROGRESS" && !current.prisEnChargeAt) {
        data.prisEnChargeAt = now;
      }

      // (2) Passage à CLOSED → enregistrer clotureAt + durée
      if (body.statut === "CLOSED" && current.statut !== Statut.CLOSED) {
        const start = current.prisEnChargeAt ?? current.dateCreation;
        const dureeTraitementMinutes = Math.max(
          0,
          Math.round((now.getTime() - new Date(start).getTime()) / 60000)
        );
        data.clotureAt = now;
        data.dureeTraitementMinutes = dureeTraitementMinutes;
      }
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data,
      include: {
        createdBy: { select: { id: true, prenom: true, nom: true } },
        assignedTo: { select: { id: true, prenom: true, nom: true } },
        departement: { select: { id: true, nom: true } },
        application: { select: { id: true, nom: true } },
        materiel: { select: { id: true, nom: true } },
      },
    });

    // Notification d’assignation si besoin
    if (body.assignedToId) {
      await prisma.notification.create({
        data: {
          userId: body.assignedToId,
          ticketId: updated.id,
          message: `Ticket #${updated.id} vous a été assigné.`,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/admin/tickets/[id] error:", e);
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
  }
}
