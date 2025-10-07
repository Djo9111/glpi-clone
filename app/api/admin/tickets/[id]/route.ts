import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

function getUser(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as { id: number; role: string }; }
  catch { return null; }
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const payload = getUser(_req);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "CHEF_DSI") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const id = parseInt(params.id);
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, prenom: true, nom: true } },
      assignedTo: { select: { id: true, prenom: true, nom: true } },
      departement: { select: { id: true, nom: true } },
    },
  });
  if (!ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

  return NextResponse.json(ticket);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const payload = getUser(req);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "CHEF_DSI") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const id = parseInt(params.id);
  const body = await req.json() as { assignedToId?: number; statut?: "OPEN"|"IN_PROGRESS"|"CLOSED" };

  // MAJ ticket
  const updated = await prisma.ticket.update({
    where: { id },
    data: {
      ...(body.assignedToId !== undefined ? { assignedTo: body.assignedToId ? { connect: { id: body.assignedToId } } : { disconnect: true } } : {}),
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
}
