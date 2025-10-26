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
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; role: string };
  } catch {
    return null;
  }
}

// Fonction helper pour les labels de statut
function getStatusLabel(statut: Statut): string {
  switch (statut) {
    case "OPEN": return "Ouvert";
    case "IN_PROGRESS": return "En cours";
    case "A_CLOTURER": return "À clôturer";
    case "REJETE": return "Rejeté";
    case "TRANSFERE_MANTICE": return "Transféré MANTICE";
    case "CLOSED": return "Clôturé";
    default: return String(statut);
  }
}

// GET /api/technicien/tickets/[id]
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const payload = getTech(req);
  if (!payload) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (payload.role !== "TECHNICIEN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

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

  if (!ticket) {
    return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
  }
  return NextResponse.json(ticket);
}

// PATCH /api/technicien/tickets/[id]
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const payload = getTech(req);
  if (!payload) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (payload.role !== "TECHNICIEN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const ticketId = Number(id);
  if (!Number.isFinite(ticketId)) {
    return NextResponse.json({ error: "Paramètre invalide" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    statut?: "OPEN" | "IN_PROGRESS" | "A_CLOTURER" | "REJETE" | "TRANSFERE_MANTICE" | "CLOSED";
    manticeNumero?: string;
  };

  // Ticket bien assigné à ce technicien ? Avec les infos du créateur
  const current = await prisma.ticket.findFirst({
    where: { id: ticketId, assignedToId: payload.id },
    include: {
      createdBy: { select: { id: true, prenom: true, nom: true } },
    },
  });
  if (!current) {
    return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
  }

  const data: Record<string, any> = {};
  const now = new Date();
  const notifications: Array<{ userId: number; message: string }> = [];

  // --- logique statut générique ---
  if (body.statut === "IN_PROGRESS") {
    // poser le statut et init prisEnChargeAt si manquant
    data.statut = Statut.IN_PROGRESS;
    if (!current.prisEnChargeAt) {
      data.prisEnChargeAt = now;
    }
  }

  if (body.statut === "CLOSED" && current.statut !== Statut.CLOSED) {
    // poser le statut et les métriques de clôture
    data.statut = Statut.CLOSED;
    const start = current.prisEnChargeAt ?? current.dateCreation;
    const dureeTraitementMinutes = Math.max(
      0,
      Math.round((now.getTime() - new Date(start).getTime()) / 60000)
    );
    data.clotureAt = now;
    data.dureeTraitementMinutes = dureeTraitementMinutes;
  }

  // --- logique Mantice ---
  const manticeNumeroFromBody =
    typeof body.manticeNumero === "string"
      ? body.manticeNumero.trim()
      : undefined;

  // 1) Transition vers TRANSFERE_MANTICE : exiger un numéro
  if (
    body.statut === "TRANSFERE_MANTICE" &&
    current.statut !== Statut.TRANSFERE_MANTICE
  ) {
    const numeroEffectif = manticeNumeroFromBody ?? current.manticeNumero ?? null;
    if (!numeroEffectif) {
      return NextResponse.json(
        { error: "Le numéro Mantice est requis lors du passage à TRANSFERE_MANTICE." },
        { status: 400 }
      );
    }
    data.statut = Statut.TRANSFERE_MANTICE;
    data.manticeNumero = numeroEffectif;

    if (!current.manticeAt) {
      data.manticeAt = now;
    }
  }

  // 2) Mise à jour du numéro Mantice seule (sans changer de statut)
  if (manticeNumeroFromBody && manticeNumeroFromBody !== current.manticeNumero) {
    data.manticeNumero = manticeNumeroFromBody;

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

  // --- filet de sécurité : si un statut a été demandé mais pas encore appliqué ---
  if (body.statut && !data.statut) {
    data.statut = body.statut as Statut;
  }

  // Notification de changement de statut à l'employé créateur
  if (body.statut && body.statut !== current.statut) {
    const statusLabel = getStatusLabel(body.statut as Statut);
    
    // Message spécial pour la clôture
    if (body.statut === "CLOSED") {
      notifications.push({
        userId: current.createdBy.id,
        message: `Votre ticket #${ticketId} a été clôturé.`,
      });
    } else {
      notifications.push({
        userId: current.createdBy.id,
        message: `Le statut de votre ticket #${ticketId} est passé à "${statusLabel}".`,
      });
    }
  }

  if (Object.keys(data).length === 0) {
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

  // Créer toutes les notifications en batch
  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications.map(n => ({
        userId: n.userId,
        ticketId: updated.id,
        message: n.message,
      })),
    });
  }

  return NextResponse.json(updated);
}