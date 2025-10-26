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
    manticeNumero?: string;
  };

  try {
    // Lire l'état actuel pour calculs et notifications
    const current = await prisma.ticket.findUnique({ 
      where: { id: ticketId },
      include: {
        createdBy: { select: { id: true, prenom: true, nom: true } },
        assignedTo: { select: { id: true, prenom: true, nom: true } },
      }
    });
    if (!current) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

    const data: any = {};
    const now = new Date();
    const notifications: Array<{ userId: number; message: string }> = [];

    // Gestion assignation/désassignation
    if (typeof body.assignedToId !== "undefined") {
      data.assignedTo = body.assignedToId
        ? { connect: { id: body.assignedToId } }
        : { disconnect: true };

      // Notification au technicien assigné
      if (body.assignedToId) {
        notifications.push({
          userId: body.assignedToId,
          message: `Ticket #${ticketId} vous a été assigné.`,
        });

        // Notification à l'employé créateur
        const technicien = await prisma.utilisateur.findUnique({
          where: { id: body.assignedToId },
          select: { prenom: true, nom: true }
        });
        
        if (technicien && current.createdBy.id !== body.assignedToId) {
          notifications.push({
            userId: current.createdBy.id,
            message: `Votre ticket #${ticketId} a été assigné à ${technicien.prenom} ${technicien.nom}.`,
          });
        }
      }
    }

    // Transitions de statut
    if (body.statut && body.statut !== current.statut) {
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

      // (3) Passage à TRANSFERE_MANTICE → enregistrer manticeAt et numéro si fourni
      if (body.statut === "TRANSFERE_MANTICE" && current.statut !== Statut.TRANSFERE_MANTICE) {
        if (!current.manticeAt) {
          data.manticeAt = now;
        }
        // Si un numéro MANTICE est fourni, l'enregistrer
        if (body.manticeNumero) {
          data.manticeNumero = body.manticeNumero.trim();
        }
      }

      // Notification de changement de statut à l'employé créateur
      const statusLabel = getStatusLabel(body.statut as Statut);
      
      // Message spécial si le ticket est clôturé
      if (body.statut === "CLOSED") {
        notifications.push({
          userId: current.createdBy.id,
          message: `Votre ticket #${ticketId} a été clôturé.`,
        });
      } 
      // Message spécial si transféré à MANTICE avec numéro
      else if (body.statut === "TRANSFERE_MANTICE") {
        const manticeNum = body.manticeNumero?.trim() || current.manticeNumero;
        if (manticeNum) {
          notifications.push({
            userId: current.createdBy.id,
            message: `Votre ticket #${ticketId} a été transféré à MANTICE (N° ${manticeNum}).`,
          });
        } else {
          notifications.push({
            userId: current.createdBy.id,
            message: `Votre ticket #${ticketId} a été transféré à MANTICE.`,
          });
        }
      } 
      // Message générique pour les autres changements
      else {
        notifications.push({
          userId: current.createdBy.id,
          message: `Le statut de votre ticket #${ticketId} est passé à "${statusLabel}".`,
        });
      }
    }

    // Mise à jour du numéro MANTICE seul (sans changement de statut)
    if (body.manticeNumero && body.manticeNumero.trim() !== current.manticeNumero && !body.statut) {
      data.manticeNumero = body.manticeNumero.trim();
      
      // Si le ticket est déjà en TRANSFERE_MANTICE, notifier l'employé du numéro
      if (current.statut === Statut.TRANSFERE_MANTICE) {
        notifications.push({
          userId: current.createdBy.id,
          message: `Le numéro MANTICE de votre ticket #${ticketId} est : ${data.manticeNumero}.`,
        });
      }
    }

    // Mise à jour du ticket
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
  } catch (e) {
    console.error("PATCH /api/admin/tickets/[id] error:", e);
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
  }
}