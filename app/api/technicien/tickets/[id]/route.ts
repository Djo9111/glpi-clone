// app/api/technicien/tickets/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, Statut } from "@prisma/client";
import jwt from "jsonwebtoken";
import { transporter, escapeHtml } from "@/lib/mailer";

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
    case "TRANSFERE_MANTIS": return "Transféré mantis";
    case "CLOSED": return "Clôturé";
    default: return String(statut);
  }
}

// Fonction pour envoyer un email au créateur du ticket
async function sendEmailToCreator(
  ticketId: number,
  creatorEmail: string,
  creatorName: string,
  subject: string,
  message: string
) {
  try {
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${escapeHtml(subject)}</h2>
        <p>Bonjour ${escapeHtml(creatorName)},</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          ${message}
        </div>
        <p><strong>Référence du ticket :</strong> #${ticketId}</p>
        <p style="color: #666; font-size: 0.9em;">
          Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Support" <${process.env.SMTP_USER}>`,
      to: creatorEmail,
      subject: `[Ticket #${ticketId}] ${subject}`,
      html: htmlMessage,
    });

    console.log(`Email envoyé à ${creatorEmail} pour le ticket #${ticketId}`);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    // Ne pas bloquer la requête en cas d'erreur d'email
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
      createdBy: { select: { id: true, prenom: true, nom: true, email: true } },
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
    statut?: "OPEN" | "IN_PROGRESS" | "A_CLOTURER" | "REJETE" | "TRANSFERE_MANTIS" | "CLOSED";
    mantisNumero?: string;
  };

  // Ticket bien assigné à ce technicien ? Avec les infos du créateur
  const current = await prisma.ticket.findFirst({
    where: { id: ticketId, assignedToId: payload.id },
    include: {
      createdBy: { select: { id: true, prenom: true, nom: true, email: true } },
    },
  });
  if (!current) {
    return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
  }

  const data: Record<string, any> = {};
  const now = new Date();
  const notifications: Array<{ userId: number; message: string }> = [];
  const emails: Array<{
    email: string;
    name: string;
    subject: string;
    message: string;
  }> = [];

  // --- logique statut générique ---
  if (body.statut === "IN_PROGRESS") {
    // poser le statut et init prisEnChargeAt si manquant
    data.statut = Statut.IN_PROGRESS;
    if (!current.prisEnChargeAt) {
      data.prisEnChargeAt = now;
    }
    // PAS d'email pour IN_PROGRESS - trop de bruit
  }

  // CORRECTION : Ajout de la logique pour REJETE et TRANSFERE_MANTIS avec clotureAt
  if (body.statut === "REJETE" && current.statut !== Statut.REJETE) {
    data.statut = Statut.REJETE;
    // Mettre à jour clotureAt pour les tickets rejetés
    if (!current.clotureAt) {
      data.clotureAt = now;
    }
    // Calculer la durée de traitement si prisEnChargeAt existe
    if (current.prisEnChargeAt) {
      const dureeTraitementMinutes = Math.max(
        0,
        Math.round((now.getTime() - new Date(current.prisEnChargeAt).getTime()) / 60000)
      );
      data.dureeTraitementMinutes = dureeTraitementMinutes;
    }

    // EMAIL OBLIGATOIRE pour REJETE
    emails.push({
      email: current.createdBy.email!,
      name: `${current.createdBy.prenom} ${current.createdBy.nom}`,
      subject: "Ticket rejeté",
      message: `Votre ticket a été rejeté. Pour plus d'informations, consultez la plateforme de gestion des tickets.`
    });
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

    // PAS d'email pour CLOSED - notification dans l'app suffit
  }

  // --- logique mantis ---
  const mantisNumeroFromBody =
    typeof body.mantisNumero === "string"
      ? body.mantisNumero.trim()
      : undefined;

  // 1) Transition vers TRANSFERE_MANTIS : exiger un numéro
  if (
    body.statut === "TRANSFERE_MANTIS" &&
    current.statut !== Statut.TRANSFERE_MANTIS
  ) {
    const numeroEffectif = mantisNumeroFromBody ?? current.mantisNumero ?? null;
    if (!numeroEffectif) {
      return NextResponse.json(
        { error: "Le numéro mantis est requis lors du passage à TRANSFERE_MANTIS." },
        { status: 400 }
      );
    }
    data.statut = Statut.TRANSFERE_MANTIS;
    data.mantisNumero = numeroEffectif;

    if (!current.mantisAt) {
      data.mantisAt = now;
    }

    // CORRECTION : Mettre à jour clotureAt pour les tickets transférés à MANTIS
    if (!current.clotureAt) {
      data.clotureAt = now;
    }

    // Calculer la durée de traitement si prisEnChargeAt existe
    if (current.prisEnChargeAt) {
      const dureeTraitementMinutes = Math.max(
        0,
        Math.round((now.getTime() - new Date(current.prisEnChargeAt).getTime()) / 60000)
      );
      data.dureeTraitementMinutes = dureeTraitementMinutes;
    }

    // EMAIL OBLIGATOIRE pour TRANSFERE_MANTIS
    emails.push({
      email: current.createdBy.email!,
      name: `${current.createdBy.prenom} ${current.createdBy.nom}`,
      subject: "Ticket transféré à l'équipe de développement",
      message: `Votre ticket a été transféré à l'équipe de développement pour correction. Numéro de suivi MANTIS : <strong>${numeroEffectif}</strong>.`
    });
  }

  // 2) Mise à jour du numéro mantis seule (sans changer de statut)
  if (mantisNumeroFromBody && mantisNumeroFromBody !== current.mantisNumero) {
    data.mantisNumero = mantisNumeroFromBody;

    const statutFinal = (data.statut as Statut) ?? current.statut;
    if (statutFinal === Statut.TRANSFERE_MANTIS && !current.mantisAt) {
      data.mantisAt = now;
    }

    // Si le ticket est déjà en TRANSFERE_MANTIS et qu'on met à jour juste le numéro
    if (current.statut === Statut.TRANSFERE_MANTIS && !body.statut) {
      notifications.push({
        userId: current.createdBy.id,
        message: `Le numéro mantis de votre ticket #${ticketId} est : ${mantisNumeroFromBody}.`,
      });

      // EMAIL pour mise à jour de numéro MANTIS sur ticket déjà transféré
      emails.push({
        email: current.createdBy.email!,
        name: `${current.createdBy.prenom} ${current.createdBy.nom}`,
        subject: "Numéro MANTIS mis à jour",
        message: `Le numéro de suivi MANTIS de votre ticket a été mis à jour : <strong>${mantisNumeroFromBody}</strong>.`
      });
    }
  }

  // 3) Autre changement de statut (ni CLOSED, ni IN_PROGRESS, ni TRANSFERE_MANTIS, ni REJETE)
  if (
    body.statut &&
    body.statut !== "CLOSED" &&
    body.statut !== "IN_PROGRESS" &&
    body.statut !== "TRANSFERE_MANTIS" &&
    body.statut !== "REJETE"
  ) {
    data.statut = body.statut as Statut;
  }

  // --- filet de sécurité : si un statut a été demandé mais pas encore appliqué ---
  if (body.statut && !data.statut) {
    data.statut = body.statut as Statut;
  }

  // Notification de changement de statut à l'employé créateur (dans l'app)
  if (body.statut && body.statut !== current.statut) {
    const statusLabel = getStatusLabel(body.statut as Statut);

    // Message spécial pour la clôture
    if (body.statut === "CLOSED") {
      notifications.push({
        userId: current.createdBy.id,
        message: `Votre ticket #${ticketId} a été clôturé.`,
      });
    }
    // Message spécial si rejeté (déjà géré par email plus haut)
    else if (body.statut === "REJETE") {
      notifications.push({
        userId: current.createdBy.id,
        message: `Votre ticket #${ticketId} a été rejeté.`,
      });
    }
    // Message spécial si transféré à mantis avec numéro (déjà géré par email plus haut)
    else if (body.statut === "TRANSFERE_MANTIS") {
      const mantisNum = data.mantisNumero || current.mantisNumero;
      if (mantisNum) {
        notifications.push({
          userId: current.createdBy.id,
          message: `Votre ticket #${ticketId} a été transféré à MANTIS (N° ${mantisNum}).`,
        });
      } else {
        notifications.push({
          userId: current.createdBy.id,
          message: `Votre ticket #${ticketId} a été transféré à MANTIS.`,
        });
      }
    }
    // Message générique pour les autres changements (A_CLOTURER, etc.)
    else {
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
      createdBy: { select: { id: true, prenom: true, nom: true, email: true } },
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

  // Envoyer les emails (non bloquant)
  if (emails.length > 0) {
    // Ne pas attendre les emails pour répondre à la requête
    Promise.all(
      emails.map(email =>
        sendEmailToCreator(
          ticketId,
          email.email,
          email.name,
          email.subject,
          email.message
        )
      )
    ).catch(error => {
      console.error("Erreur lors de l'envoi des emails:", error);
    });
  }

  return NextResponse.json(updated);
}