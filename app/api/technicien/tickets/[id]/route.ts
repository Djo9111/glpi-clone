// app/api/technicien/tickets/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, Statut } from "@prisma/client";
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
  ctx: { params: Promise<{ id: string }> }
) {
  const payload = getTech(req);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "TECHNICIEN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await ctx.params;
  const ticketId = Number(id);
  if (!Number.isFinite(ticketId)) {
    return NextResponse.json({ error: "Paramètre invalide" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, assignedToId: payload.id },
    include: {
      createdBy: { select: { id: true, prenom: true, nom: true } },
      assignedTo: { select: { id: true, prenom: true, nom: true } },
      application: { select: { id: true, nom: true } },
      materiel: { select: { id: true, nom: true } },
      departement: { select: { id: true, nom: true } },
    },
  });

  if (!ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
  return NextResponse.json(ticket);
}

// PATCH /api/technicien/tickets/[id]
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const payload = getTech(req);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "TECHNICIEN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await ctx.params;
  const ticketId = Number(id);
  if (!Number.isFinite(ticketId)) {
    return NextResponse.json({ error: "Paramètre invalide" }, { status: 400 });
  }

  const body = await req.json() as { 
    statut?: "OPEN" | "IN_PROGRESS" | "A_CLOTURER" | "REJETE" | "TRANSFERE_MANTICE" | "CLOSED" 
  };

  // Vérifier que le ticket est bien assigné à ce technicien
  const current = await prisma.ticket.findFirst({ where: { id: ticketId, assignedToId: payload.id } });
  if (!current) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

  // Préparer les champs calculés selon la transition
  const data: any = {};
  const now = new Date();

  // Si on passe en IN_PROGRESS et qu'on n'a pas encore pris en charge
  if (body.statut === "IN_PROGRESS" && !current.prisEnChargeAt) {
    data.prisEnChargeAt = now;
  }

  // Si on passe en CLOSED → écrire clotureAt + durée
  if (body.statut === "CLOSED" && current.statut !== Statut.CLOSED) {
    const start = current.prisEnChargeAt ?? current.dateCreation;
    const dureeTraitementMinutes = Math.max(
      0,
      Math.round((now.getTime() - new Date(start).getTime()) / 60000)
    );
    data.clotureAt = now;
    data.dureeTraitementMinutes = dureeTraitementMinutes;
  }

  // Appliquer le statut demandé (si fourni)
  if (body.statut) {
    data.statut = body.statut as Statut;
  }

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data,
    include: {
      createdBy: { select: { id: true, prenom: true, nom: true } },
      assignedTo: { select: { id: true, prenom: true, nom: true } },
      application: { select: { id: true, nom: true } },
      materiel: { select: { id: true, nom: true } },
      departement: { select: { id: true, nom: true } },
    },
  });

  return NextResponse.json(updated);
}
