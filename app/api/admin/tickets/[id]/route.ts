// app/api/admin/tickets/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, Statut } from "@prisma/client";
import jwt from "jsonwebtoken";
import { transporter, escapeHtml } from "@/lib/mailer"; // Importer depuis lib/mailer

export const runtime = "nodejs";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const FROM = process.env.EMAIL_FROM || `Assistance DSI <${process.env.SMTP_USER}>`;
const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL || "https://ton-domaine/admin";

function getUser(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as { id: number; role: string }; }
  catch { return null; }
}

function getStatusLabel(statut: Statut): string {
  switch (statut) {
    case "OPEN": return "Ouvert";
    case "IN_PROGRESS": return "En cours";
    case "A_CLOTURER": return "À clôturer";
    case "REJETE": return "Rejeté";
    case "TRANSFERE_MANTIS": return "Transféré mantis";
    case "CLOSED": return "Clôturé";
    default: return String(statut);
  }
}

// Fonction pour générer l'email d'assignation au technicien
function ticketAssignmentHtml(params: {
  id: number;
  type: "ASSISTANCE" | "INTERVENTION";
  description: string;
  dateCreation: Date | string;
  createdBy: { prenom: string; nom: string; email?: string | null };
  technicien: { prenom: string; nom: string };
  appName?: string | null;
  matName?: string | null;
}) {
  const desc = escapeHtml(params.description);
  const date = new Date(params.dateCreation).toLocaleString();
  const auteur = `${escapeHtml(params.createdBy.prenom)} ${escapeHtml(params.createdBy.nom)}${params.createdBy.email ? " (" + escapeHtml(params.createdBy.email) + ")" : ""}`;
  const tech = `${escapeHtml(params.technicien.prenom)} ${escapeHtml(params.technicien.nom)}`;

  const extra =
    params.type === "ASSISTANCE" && params.appName
      ? `<p><b>Application :</b> ${escapeHtml(params.appName)}</p>`
      : params.type === "INTERVENTION" && params.matName
        ? `<p><b>Matériel :</b> ${escapeHtml(params.matName)}</p>`
        : "";

  return `
    <div style="font-family:system-ui,Segoe UI,Arial;line-height:1.5">
      <h2 style="margin:0 0 8px">Ticket #${params.id} vous a été assigné</h2>
      <p>Bonjour ${tech},</p>
      <p>Un ticket vous a été assigné et nécessite votre attention.</p>
      <hr style="margin:16px 0;border:none;border-top:1px solid #ddd">
      <p><b>Type :</b> ${params.type}</p>
      ${extra}
      <p><b>Créé par :</b> ${auteur}</p>
      <p><b>Créé le :</b> ${date}</p>
      <p><b>Description :</b><br/>${desc}</p>
      <p style="margin-top:20px">
        <a href="${ADMIN_BASE_URL}/tickets/${params.id}" 
           style="display:inline-block;padding:10px 20px;background-color:#0066cc;color:#fff;text-decoration:none;border-radius:5px">
          Consulter le ticket
        </a>
      </p>
    </div>
  `;
}

// Fonction pour envoyer l'email au technicien assigné
async function sendAssignmentEmail(ticket: any, technicien: any) {
  if (!technicien.email) {
    console.warn(`Technicien ${technicien.id} n'a pas d'email configuré`);
    return;
  }

  const html = ticketAssignmentHtml({
    id: ticket.id,
    type: ticket.type,
    description: ticket.description,
    dateCreation: ticket.dateCreation,
    createdBy: {
      prenom: ticket.createdBy.prenom,
      nom: ticket.createdBy.nom,
      email: ticket.createdBy.email
    },
    technicien: {
      prenom: technicien.prenom,
      nom: technicien.nom
    },
    appName: ticket.application?.nom ?? null,
    matName: ticket.materiel?.nom ?? null,
  });

  try {
    await transporter.sendMail({
      from: FROM,
      to: technicien.email,
      subject: `Ticket #${ticket.id} vous a été assigné`,
      html,
    });
    console.log(`Email d'assignation envoyé au technicien ${technicien.email} pour ticket #${ticket.id}`);
  } catch (error) {
    console.error(`Erreur lors de l'envoi de l'email au technicien:`, error);
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
    statut?: "OPEN" | "IN_PROGRESS" | "A_CLOTURER" | "REJETE" | "TRANSFERE_MANTIS" | "CLOSED";
    mantisNumero?: string;
  };

  try {
    // Lire l'état actuel pour calculs et notifications
    const current = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: { select: { id: true, prenom: true, nom: true } },
        assignedTo: { select: { id: true, prenom: true, nom: true } },
        application: { select: { id: true, nom: true } },
        materiel: { select: { id: true, nom: true } },
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

        // Récupérer les infos complètes du technicien pour l'email
        const technicien = await prisma.utilisateur.findUnique({
          where: { id: body.assignedToId },
          select: { id: true, prenom: true, nom: true, email: true }
        });

        // Notification à l'employé créateur
        if (technicien && current.createdBy.id !== body.assignedToId) {
          notifications.push({
            userId: current.createdBy.id,
            message: `Votre ticket #${ticketId} a été assigné à ${technicien.prenom} ${technicien.nom}.`,
          });
        }

        // ✨ ENVOI DE L'EMAIL AU TECHNICIEN (non bloquant)
        if (technicien) {
          const ticketWithDetails = {
            ...current,
            id: ticketId,
          };
          sendAssignmentEmail(ticketWithDetails, technicien).catch(e =>
            console.error(`Erreur email technicien #${body.assignedToId}:`, e)
          );
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

      // (3) Passage à TRANSFERE_mantis → enregistrer mantisAt et numéro si fourni
      if (body.statut === "TRANSFERE_MANTIS" && current.statut !== Statut.TRANSFERE_MANTIS) {
        if (!current.mantisAt) {
          data.mantisAt = now;
        }
        if (body.mantisNumero) {
          data.mantisNumero = body.mantisNumero.trim();
        }
      }

      // Notification de changement de statut à l'employé créateur
      const statusLabel = getStatusLabel(body.statut as Statut);

      if (body.statut === "CLOSED") {
        notifications.push({
          userId: current.createdBy.id,
          message: `Votre ticket #${ticketId} a été clôturé.`,
        });
      }
      else if (body.statut === "TRANSFERE_MANTIS") {
        const mantisNum = body.mantisNumero?.trim() || current.mantisNumero;
        if (mantisNum) {
          notifications.push({
            userId: current.createdBy.id,
            message: `Votre ticket #${ticketId} a été transféré à mantis (N° ${mantisNum}).`,
          });
        } else {
          notifications.push({
            userId: current.createdBy.id,
            message: `Votre ticket #${ticketId} a été transféré à mantis.`,
          });
        }
      }
      else {
        notifications.push({
          userId: current.createdBy.id,
          message: `Le statut de votre ticket #${ticketId} est passé à "${statusLabel}".`,
        });
      }
    }

    // Mise à jour du numéro mantis seul (sans changement de statut)
    if (body.mantisNumero && body.mantisNumero.trim() !== current.mantisNumero && !body.statut) {
      data.mantisNumero = body.mantisNumero.trim();

      if (current.statut === Statut.TRANSFERE_MANTIS) {
        notifications.push({
          userId: current.createdBy.id,
          message: `Le numéro mantis de votre ticket #${ticketId} est : ${data.mantisNumero}.`,
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