// app/api/admin/tickets/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
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
  ctx: { params: Promise<{ id: string }> } // ⬅️ params est async
) {
  const payload = getUser(_req);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "CHEF_DSI") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await ctx.params;          // ⬅️ on attend params
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
    },
  });
  if (!ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

  return NextResponse.json(ticket);
}

// PATCH /api/admin/tickets/[id]
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }  // ⬅️ idem
) {
  const payload = getUser(req);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "CHEF_DSI") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await ctx.params;          // ⬅️ on attend params
  const ticketId = Number(id);
  if (!Number.isFinite(ticketId)) {
    return NextResponse.json({ error: "Paramètre invalide" }, { status: 400 });
  }

  const body = await req.json() as {
    assignedToId?: number | null;
    statut?: "OPEN" | "IN_PROGRESS" | "CLOSED";
  };

  try {
    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ...(typeof body.assignedToId !== "undefined"
          ? (body.assignedToId
              ? { assignedTo: { connect: { id: body.assignedToId } } }
              : { assignedTo: { disconnect: true } })
          : {}),
        ...(body.statut ? { statut: body.statut } : {}),
      },
      include: {
        createdBy: { select: { id: true, prenom: true, nom: true } },
        assignedTo: { select: { id: true, prenom: true, nom: true } },
        departement: { select: { id: true, nom: true } },
      },
    });

    // Notifier le technicien en cas d’assignation
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
