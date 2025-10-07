import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import path from "node:path";
import fs from "node:fs/promises";
import nodemailer from "nodemailer";

export const runtime = "nodejs";        // important pour avoir les APIs Node
export const dynamic = "force-dynamic"; // utile si besoin de désactiver le cache route

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// ——— SMTP transporter ———
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE !== "false",
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMMP_PASS ?? process.env.SMTP_PASS!, // compat
  },
});

const FROM = process.env.EMAIL_FROM || `Assistance DSI <${process.env.SMTP_USER}>`;
const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL || "https://ton-domaine/admin"; // ajuste si besoin

// ——— réglages upload (peux ajuster) ———
const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
const ALLOWED_EXT = new Set(["pdf","png","jpg","jpeg","txt","log","doc","docx","xlsx","csv"]);

// Limite prudente pour pièces jointes Gmail (~25 Mo)
const MAX_ATTACH_TOTAL = 25 * 1024 * 1024; // 25 Mo

// ——— helpers ———
function getUserFromRequest(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; role: string };
  } catch {
    return null;
  }
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9_.-]+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m] as string)
  );
}

function ticketHtml(params: {
  id: number;
  type: "ASSISTANCE" | "INTERVENTION";
  description: string;
  dateCreation: Date | string;
  createdBy: { prenom: string; nom: string; email?: string | null };
  pieceUrls?: string[];
}) {
  const desc = escapeHtml(params.description);
  const date = new Date(params.dateCreation).toLocaleString();
  const pj = (params.pieceUrls && params.pieceUrls.length)
    ? `<ul>${params.pieceUrls.map(u => `<li><a href="${u}">${u}</a></li>`).join("")}</ul>`
    : "<i>Aucune</i>";
  const auteur = `${escapeHtml(params.createdBy.prenom)} ${escapeHtml(params.createdBy.nom)}${params.createdBy.email ? " ("+escapeHtml(params.createdBy.email)+")" : ""}`;

  return `
    <div style="font-family:system-ui,Segoe UI,Arial;line-height:1.5">
      <h2 style="margin:0 0 8px">Nouveau ticket #${params.id}</h2>
      <p><b>Type :</b> ${params.type}</p>
      <p><b>Créé par :</b> ${auteur}</p>
      <p><b>Créé le :</b> ${date}</p>
      <p><b>Description :</b><br/>${desc}</p>
      <p><b>Pièces jointes :</b><br/>${pj}</p>
      <p style="margin-top:12px">
        Ouvrir dans le back-office :
        <a href="${ADMIN_BASE_URL}/tickets/${params.id}">Ticket #${params.id}</a>
      </p>
    </div>
  `;
}

/**
 * Construit les attachments Nodemailer à partir des chemins publics ("/uploads/...").
 * - Sanitize le chemin (doit commencer par "/uploads/")
 * - Respecte la limite MAX_ATTACH_TOTAL (25 Mo)
 */
async function buildAttachmentsFromPublic(pieceUrls: string[]) {
  const attachments: { filename: string; path: string }[] = [];
  let total = 0;

  for (const url of pieceUrls) {
    if (!url || typeof url !== "string") continue;

    // Sanitize: on n'accepte que le répertoire public des uploads
    if (!url.startsWith("/uploads/")) {
      console.warn("URL PJ non autorisée (ignore) :", url);
      continue;
    }

    const absPath = path.join(process.cwd(), "public", url);
    try {
      const st = await fs.stat(absPath);
      // On ne dépasse pas ~25 Mo pour l'ensemble des attachments
      if (total + st.size > MAX_ATTACH_TOTAL) {
        console.warn("Limite 25 Mo atteinte, attachment ignoré:", url);
        continue;
      }
      attachments.push({
        filename: path.basename(url),
        path: absPath, // Nodemailer streame depuis le fichier
      });
      total += st.size;
    } catch (e) {
      console.warn("Pièce jointe introuvable, ignorée:", url);
    }
  }

  return attachments;
}

async function sendNewTicketEmails(ticket: any, pieceUrls: string[] = []) {
  // 1) Récupérer les emails des CHEF_DSI
  const chefs = await prisma.utilisateur.findMany({
    where: { role: "CHEF_DSI" },
    select: { email: true },
  });
  const toList = chefs.map(c => c.email).filter(Boolean) as string[];
  if (!toList.length) return;

  // 2) Eviter les doublons : si mail déjà envoyé on sort
  if (ticket.mailSentAt) return;

  // 3) Construire le HTML + attachments
  const html = ticketHtml({
    id: ticket.id,
    type: ticket.type,
    description: ticket.description,
    dateCreation: ticket.dateCreation,
    createdBy: { prenom: ticket.createdBy.prenom, nom: ticket.createdBy.nom, email: ticket.createdBy.email },
    pieceUrls,
  });

  const attachments = await buildAttachmentsFromPublic(pieceUrls);

  // 4) Envoi (un mail avec BCC)
  await transporter.sendMail({
    from: FROM,
    to: toList[0],
    bcc: toList.slice(1),
    subject: `Nouveau ticket #${ticket.id} (${ticket.type})`,
    html,
    attachments, // 👈 pièces jointes réelles
  });

  // 5) Marquer comme envoyé
  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { mailSentAt: new Date() },
  });
}

export async function POST(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (payload.role !== "EMPLOYE") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // On détecte le content-type pour garder la compat JSON existante
    const ct = request.headers.get("content-type") || "";

    // =========================
    // CAS 1 : JSON (compat)
    // =========================
    if (ct.includes("application/json")) {
      const { description, typeTicket } = await request.json();

      // 1) ticket
      const ticket = await prisma.ticket.create({
        data: {
          description,
          type: typeTicket,
          statut: "OPEN",
          createdBy: { connect: { id: payload.id } },
        },
        include: { createdBy: true },
      });

      // 2) notifs chefs DSI
      const admins = await prisma.utilisateur.findMany({
        where: { role: "CHEF_DSI" },
        select: { id: true },
      });
      if (admins.length > 0) {
        const message = `Nouveau ticket #${ticket.id} (${ticket.type}) créé par ${ticket.createdBy.prenom} ${ticket.createdBy.nom}`;
        await prisma.notification.createMany({
          data: admins.map((a) => ({ message, ticketId: ticket.id, userId: a.id })),
        });
      }

      // 3) envoi email (non bloquant pour la création)
      sendNewTicketEmails(ticket).catch((e) => {
        console.error("Email CHEF_DSI non envoyé:", e);
      });

      return NextResponse.json({ message: "Ticket créé", ticket });
    }

    // =========================
    // CAS 2 : multipart/form-data (avec fichiers)
    // =========================
    if (ct.includes("multipart/form-data")) {
      const form = await request.formData();
      const description = String(form.get("description") || "").trim();
      const typeTicket = form.get("typeTicket") as "ASSISTANCE" | "INTERVENTION" | null;

      if (!description || !typeTicket) {
        return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
      }

      // 1) créer le ticket (d’abord, pour connaître l’ID de dossier)
      const ticket = await prisma.ticket.create({
        data: {
          description,
          type: typeTicket,
          statut: "OPEN",
          createdBy: { connect: { id: payload.id } },
        },
        include: { createdBy: true },
      });

      // 2) gérer les fichiers (champ "files")
      const files = form.getAll("files") as unknown as File[];
      let createdCount = 0;
      let pieceUrls: string[] = [];

      if (files && files.length) {
        if (files.length > MAX_FILES) {
          return NextResponse.json({ error: `Maximum ${MAX_FILES} fichiers autorisés` }, { status: 400 });
        }

        const baseDir = path.join(process.cwd(), "public", "uploads", "tickets", String(ticket.id));
        await fs.mkdir(baseDir, { recursive: true });

        const pjRows: { nomFichier: string; chemin: string; ticketId: number }[] = [];

        for (const f of files) {
          const ab = await f.arrayBuffer();
          const buf = Buffer.from(ab);

          if (buf.length > MAX_SIZE) {
            return NextResponse.json({ error: `Fichier trop volumineux (> 10 Mo): ${f.name}` }, { status: 400 });
          }

          const original = f.name || "fichier";
          const ext = (path.extname(original).replace(".", "").toLowerCase()) || "";
          if (!ALLOWED_EXT.has(ext)) {
            return NextResponse.json({ error: `Extension non autorisée: ${original}` }, { status: 400 });
          }

          const filename = `${Date.now()}_${slugify(original)}`;
          const fullPath = path.join(baseDir, filename);
          await fs.writeFile(fullPath, buf);

          const publicPath = `/uploads/tickets/${ticket.id}/${filename}`;
          pjRows.push({
            nomFichier: original,
            chemin: publicPath, // exposé statiquement par Next (public/)
            ticketId: ticket.id,
          });
          pieceUrls.push(publicPath);
        }

        if (pjRows.length) {
          await prisma.pieceJointe.createMany({ data: pjRows });
          createdCount = pjRows.length;
        }
      }

      // 3) notifs chefs DSI (comme avant)
      const admins = await prisma.utilisateur.findMany({
        where: { role: "CHEF_DSI" },
        select: { id: true },
      });
      if (admins.length > 0) {
        const message = `Nouveau ticket #${ticket.id} (${ticket.type}) créé par ${ticket.createdBy.prenom} ${ticket.createdBy.nom}`;
        await prisma.notification.createMany({
          data: admins.map((a) => ({ message, ticketId: ticket.id, userId: a.id })),
        });
      }

      // 4) envoi email (non bloquant pour la création) — avec attachments
      sendNewTicketEmails(ticket, pieceUrls).catch((e) => {
        console.error("Email CHEF_DSI non envoyé:", e);
      });

      return NextResponse.json({
        message: "Ticket créé",
        ticketId: ticket.id,
        piecesJointes: createdCount,
      });
    }

    // Content-Type non géré
    return NextResponse.json({ error: "Format non supporté" }, { status: 415 });
  } catch (error) {
    console.error("Erreur création ticket :", error);
    return NextResponse.json({ error: "Impossible de créer le ticket" }, { status: 500 });
  }
}
