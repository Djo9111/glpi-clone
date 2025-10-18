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

  const body = (await req.json().catch(() => ({}))) as {
    statut?: "OPEN" | "IN_PROGRESS" | "A_CLOTURER" | "REJETE" | "TRANSFERE_MANTICE" | "CLOSED";
    manticeNumero?: string;
  };

  // Ticket bien assigné à ce technicien ?
  const current = await prisma.ticket.findFirst({
    where: { id: ticketId, assignedToId: payload.id },
  });
  if (!current) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

  const data: Record<string, any> = {};
  const now = new Date();

  // --- logique statut générique (prise en charge / clôture) ---
  if (body.statut === "IN_PROGRESS" && !current.prisEnChargeAt) {
    data.prisEnChargeAt = now;
  }

  if (body.statut === "CLOSED" && current.statut !== Statut.CLOSED) {
    const start = current.prisEnChargeAt ?? current.dateCreation;
    const dureeTraitementMinutes = Math.max(
      0,
      Math.round((now.getTime() - new Date(start).getTime()) / 60000)
    );
    data.clotureAt = now;
    data.dureeTraitementMinutes = dureeTraitementMinutes;
  }

  // --- logique Mantice ---
  const manticeNumeroFromBody = typeof body.manticeNumero === "string"
    ? body.manticeNumero.trim()
    : undefined;

  // 1) Transition vers TRANSFERE_MANTICE : exiger un numéro (soit fourni maintenant, soit déjà existant)
  if (body.statut === "TRANSFERE_MANTICE" && current.statut !== Statut.TRANSFERE_MANTICE) {
    const numeroEffectif = manticeNumeroFromBody ?? current.manticeNumero ?? null;
    if (!numeroEffectif) {
      return NextResponse.json(
        { error: "Le numéro Mantice est requis lors du passage à TRANSFERE_MANTICE." },
        { status: 400 }
      );
    }
    data.statut = "TRANSFERE_MANTICE" as Statut;
    data.manticeNumero = numeroEffectif;

    // Poser manticeAt si absent
    if (!current.manticeAt) {
      data.manticeAt = now;
    }
  }

  // 2) Mise à jour du numéro Mantice seule (sans changer de statut)
  if (
    manticeNumeroFromBody &&
    manticeNumeroFromBody !== current.manticeNumero
  ) {
    data.manticeNumero = manticeNumeroFromBody;

    // Si le ticket est (ou devient) TRANSFERE_MANTICE et qu'on n'a pas de date → poser manticeAt
    const statutFinal = (data.statut as Statut) ?? current.statut;
    if (statutFinal === Statut.TRANSFERE_MANTICE && !current.manticeAt) {
      data.manticeAt = now;
    }
  }

  // 3) Autre changement de statut (ni CLOSED, ni IN_PROGRESS, ni TRANSFERE_MANTICE)
  if (
    body.statut &&
    body.statut !== "CLOSED" &&
    body.statut !== "IN_PROGRESS" &&
    body.statut !== "TRANSFERE_MANTICE"
  ) {
    data.statut = body.statut as Statut;
  }

  if (Object.keys(data).length === 0) {
    // rien à modifier
    return NextResponse.json({ message: "Aucune modification" });
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
