// app/api/technicien/tickets/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

function getTech(req: Request) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as { id: number; role: string }; }
  catch { return null; }
}

// GET /api/technicien/tickets/[id]
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> } // 👈 params est async
) {
  const payload = getTech(req);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "TECHNICIEN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await ctx.params;          // 👈 on attend params
  const ticketId = Number(id);
  if (!Number.isFinite(ticketId)) {
    return NextResponse.json({ error: "Paramètre invalide" }, { status: 400 });
  }

  // Le technicien ne peut lire que les tickets qui lui sont assignés
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, assignedToId: payload.id },
    include: {
      createdBy: { select: { id: true, prenom: true, nom: true } },
      assignedTo: { select: { id: true, prenom: true, nom: true } },
    },
  });

  if (!ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
  return NextResponse.json(ticket);
}

// PATCH /api/technicien/tickets/[id]
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> } // 👈 idem
) {
  const payload = getTech(req);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "TECHNICIEN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await ctx.params;          // 👈 on attend params
  const ticketId = Number(id);
  if (!Number.isFinite(ticketId)) {
    return NextResponse.json({ error: "Paramètre invalide" }, { status: 400 });
  }

  const body = await req.json() as { statut?: "OPEN" | "IN_PROGRESS" | "CLOSED" };

  // Le technicien peut modifier uniquement un ticket qui lui est assigné
  const exists = await prisma.ticket.findFirst({ where: { id: ticketId, assignedToId: payload.id } });
  if (!exists) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { ...(body.statut ? { statut: body.statut } : {}) },
    include: {
      createdBy: { select: { id: true, prenom: true, nom: true } },
      assignedTo: { select: { id: true, prenom: true, nom: true } },
    },
  });

  return NextResponse.json(updated);
}
