// app/api/tickets/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import path from "node:path";
import fs from "node:fs/promises";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// ——— SMTP transporter ———
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE !== "false",
  auth: {
    user: process.env.SMTP_USER!,
    pass: (process.env as any).SMMP_PASS ?? process.env.SMTP_PASS!,
  },
});

const FROM = process.env.EMAIL_FROM || `Assistance DSI <${process.env.SMTP_USER}>`;
const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL || "https://ton-domaine/admin";

// ——— réglages upload ———
const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
const ALLOWED_EXT = new Set(["pdf", "png", "jpg", "jpeg", "txt", "log", "doc", "docx", "xlsx", "csv"]);

// Limite prudente pour pièces jointes Gmail (~25 Mo)
const MAX_ATTACH_TOTAL = 25 * 1024 * 1024;

// ——— helpers ———
function getUserFromRequest(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as {
      id: number;
      role: string;
      codeHierarchique: number;
      departementId: number | null;
    };
  }
  catch { return null; }
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
  appName?: string | null;
  matName?: string | null;
  pieceUrls?: string[];
}) {
  const desc = escapeHtml(params.description);
  const date = new Date(params.dateCreation).toLocaleString();
  const pj = (params.pieceUrls && params.pieceUrls.length)
    ? `<ul>${params.pieceUrls.map(u => `<li><a href="${u}">${u}</a></li>`).join("")}</ul>`
    : "<i>Aucune</i>";
  const auteur = `${escapeHtml(params.createdBy.prenom)} ${escapeHtml(params.createdBy.nom)}${params.createdBy.email ? " (" + escapeHtml(params.createdBy.email) + ")" : ""}`;

  const extra =
    params.type === "ASSISTANCE" && params.appName
      ? `<p><b>Application :</b> ${escapeHtml(params.appName)}</p>`
      : params.type === "INTERVENTION" && params.matName
        ? `<p><b>Matériel :</b> ${escapeHtml(params.matName)}</p>`
        : "";

  return `
    <div style="font-family:system-ui,Segoe UI,Arial;line-height:1.5">
      <h2 style="margin:0 0 8px">Nouveau ticket #${params.id}</h2>
      <p><b>Type :</b> ${params.type}</p>
      ${extra}
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

/** Construit les attachments Nodemailer depuis les chemins publics "/uploads/...". */
async function buildAttachmentsFromPublic(pieceUrls: string[]) {
  const attachments: { filename: string; path: string }[] = [];
  let total = 0;

  for (const url of pieceUrls) {
    if (!url || typeof url !== "string") continue;
    if (!url.startsWith("/uploads/")) {
      console.warn("URL PJ non autorisée (ignore) :", url);
      continue;
    }
    const absPath = path.join(process.cwd(), "public", url);
    try {
      const st = await fs.stat(absPath);
      if (total + st.size > MAX_ATTACH_TOTAL) {
        console.warn("Limite 25 Mo atteinte, attachment ignoré:", url);
        continue;
      }
      attachments.push({ filename: path.basename(url), path: absPath });
      total += st.size;
    } catch {
      console.warn("Pièce jointe introuvable, ignorée:", url);
    }
  }
  return attachments;
}

async function sendNewTicketEmails(ticket: any, pieceUrls: string[] = []) {
  // destinataires (chefs DSI)
  const chefs = await prisma.utilisateur.findMany({ where: { role: "CHEF_DSI" }, select: { email: true } });
  const toList = chefs.map(c => c.email).filter(Boolean) as string[];
  if (!toList.length) return;

  if (ticket.mailSentAt) return;

  const html = ticketHtml({
    id: ticket.id,
    type: ticket.type,
    description: ticket.description,
    dateCreation: ticket.dateCreation,
    createdBy: { prenom: ticket.createdBy.prenom, nom: ticket.createdBy.nom, email: ticket.createdBy.email },
    appName: ticket.application?.nom ?? null,
    matName: ticket.materiel?.nom ?? null,
    pieceUrls,
  });

  const attachments = await buildAttachmentsFromPublic(pieceUrls);

  await transporter.sendMail({
    from: FROM,
    to: toList[0],
    bcc: toList.slice(1),
    subject: `Nouveau ticket #${ticket.id} (${ticket.type})`,
    html,
    attachments,
  });

  await prisma.ticket.update({ where: { id: ticket.id }, data: { mailSentAt: new Date() } });
}

/* ---------------------------------------------------------------------------------- */
/* GET: récupérer les tickets visibles selon le cloisonnement hiérarchique            */
/* ---------------------------------------------------------------------------------- */
// Dans la fonction GET, modifiez cette partie :
export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    let tickets;

    // CHEF_DSI ou DG (code 99) voit TOUS les tickets
    if (payload.role === "CHEF_DSI" || payload.codeHierarchique === 99) {
      const whereClause = userId ? { createdById: Number(userId) } : {};
      tickets = await prisma.ticket.findMany({
        where: whereClause,
        include: {
          createdBy: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              departement: { select: { id: true, nom: true } }
            }
          },
          assignedTo: { select: { id: true, nom: true, prenom: true } },
          departement: { select: { id: true, nom: true } },
          application: { select: { id: true, nom: true } },
          materiel: { select: { id: true, nom: true } },
        },
        orderBy: { dateCreation: "desc" },
      });
    }
    // TECHNICIEN voit ses tickets assignés + ses propres tickets
    else if (payload.role === "TECHNICIEN") {
      tickets = await prisma.ticket.findMany({
        where: {
          OR: [
            { assignedToId: payload.id },
            { createdById: payload.id },
          ],
        },
        include: {
          createdBy: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              departement: { select: { id: true, nom: true } }
            }
          },
          assignedTo: { select: { id: true, nom: true, prenom: true } },
          departement: { select: { id: true, nom: true } },
          application: { select: { id: true, nom: true } },
          materiel: { select: { id: true, nom: true } },
        },
        orderBy: { dateCreation: "desc" },
      });
    }
    // EMPLOYE : voit ses tickets + tickets des subordonnés (même département, code < le sien)
    else {
      const conditions: any[] = [{ createdById: payload.id }];

      // Subordonnés visibles
      if (payload.codeHierarchique > 0 && payload.departementId) {
        const subordonnés = await prisma.utilisateur.findMany({
          where: {
            departementId: payload.departementId,
            codeHierarchique: { lt: payload.codeHierarchique },
          },
          select: { id: true },
        });

        if (subordonnés.length > 0) {
          conditions.push({
            createdById: { in: subordonnés.map(s => s.id) },
          });
        }
      }

      if (userId) {
        const targetUserId = Number(userId);
        const targetUser = await prisma.utilisateur.findUnique({
          where: { id: targetUserId },
          select: { departementId: true, codeHierarchique: true },
        });

        // droits de visibilité
        if (targetUserId !== payload.id) {
          if (!targetUser ||
            targetUser.departementId !== payload.departementId ||
            targetUser.codeHierarchique >= payload.codeHierarchique) {
            return NextResponse.json({ error: "Accès refusé à ces tickets" }, { status: 403 });
          }
        }

        tickets = await prisma.ticket.findMany({
          where: { createdById: targetUserId },
          include: {
            createdBy: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                departement: { select: { id: true, nom: true } }
              }
            },
            assignedTo: { select: { id: true, nom: true, prenom: true } },
            departement: { select: { id: true, nom: true } },
            application: { select: { id: true, nom: true } },
            materiel: { select: { id: true, nom: true } },
          },
          orderBy: { dateCreation: "desc" },
        });
      } else {
        tickets = await prisma.ticket.findMany({
          where: { OR: conditions },
          include: {
            createdBy: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                departement: { select: { id: true, nom: true } }
              }
            },
            assignedTo: { select: { id: true, nom: true, prenom: true } },
            departement: { select: { id: true, nom: true } },
            application: { select: { id: true, nom: true } },
            materiel: { select: { id: true, nom: true } },
          },
          orderBy: { dateCreation: "desc" },
        });
      }
    }

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Erreur GET tickets:", error);
    return NextResponse.json({ error: "Impossible de récupérer les tickets" }, { status: 500 });
  }
}

/* ---------------------------------------------------------------------------------- */
/* POST: création ticket (JSON ou multipart), avec applicationId / materielId         */
/* ---------------------------------------------------------------------------------- */
export async function POST(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (payload.role !== "EMPLOYE") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const ct = request.headers.get("content-type") || "";

    // ------- CAS 1 : JSON (sans PJ) -------
    if (ct.includes("application/json")) {
      const body = await request.json();
      const description = (body?.description ?? "").toString().trim();
      const typeTicket = body?.typeTicket as "ASSISTANCE" | "INTERVENTION" | undefined;
      const applicationId = body?.applicationId as number | undefined;
      const materielId = body?.materielId as number | undefined;

      if (!description || !typeTicket) {
        return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
      }

      let appConnect: { application: { connect: { id: number } } } | {} = {};
      let matConnect: { materiel: { connect: { id: number } } } | {} = {};

      if (typeTicket === "ASSISTANCE" && applicationId) {
        const app = await prisma.application.findUnique({ where: { id: Number(applicationId) } });
        if (!app) return NextResponse.json({ error: "Application introuvable" }, { status: 400 });
        appConnect = { application: { connect: { id: app.id } } };
      }
      if (typeTicket === "INTERVENTION" && materielId) {
        const mat = await prisma.materiel.findUnique({ where: { id: Number(materielId) } });
        if (!mat) return NextResponse.json({ error: "Matériel introuvable" }, { status: 400 });
        matConnect = { materiel: { connect: { id: mat.id } } };
      }

      const ticket = await prisma.ticket.create({
        data: {
          description,
          type: typeTicket,
          statut: "OPEN",
          createdBy: { connect: { id: payload.id } },
          ...appConnect,
          ...matConnect,
        },
        include: {
          createdBy: true,
          application: true,
          materiel: true,
        },
      });

      const admins = await prisma.utilisateur.findMany({ where: { role: "CHEF_DSI" }, select: { id: true } });
      if (admins.length) {
        const message =
          `Nouveau ticket #${ticket.id} (${ticket.type})` +
          (ticket.application ? ` • App: ${ticket.application.nom}` : "") +
          (ticket.materiel ? ` • Matériel: ${ticket.materiel.nom}` : "") +
          ` — ${ticket.createdBy.prenom} ${ticket.createdBy.nom}`;
        await prisma.notification.createMany({
          data: admins.map(a => ({ message, ticketId: ticket.id, userId: a.id })),
        });
      }

      // email (non bloquant)
      sendNewTicketEmails(ticket).catch(e => console.error("Email CHEF_DSI non envoyé:", e));

      return NextResponse.json({ message: "Ticket créé", ticket }, { status: 201 });
    }

    // ------- CAS 2 : multipart/form-data (avec PJ) -------
    if (ct.includes("multipart/form-data")) {
      const form = await request.formData();
      const description = String(form.get("description") || "").trim();
      const typeTicket = form.get("typeTicket") as "ASSISTANCE" | "INTERVENTION" | null;

      const applicationIdRaw = form.get("applicationId");
      const materielIdRaw = form.get("materielId");
      const applicationId = applicationIdRaw != null ? Number(applicationIdRaw) : undefined;
      const materielId = materielIdRaw != null ? Number(materielIdRaw) : undefined;

      if (!description || !typeTicket) {
        return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
      }

      // ——— VALIDATIONS AVANT CREATION DU TICKET ———
      const files = form.getAll("files") as unknown as File[];
      if (files && files.length > MAX_FILES) {
        return NextResponse.json(
          { error: `Vous avez joint ${files.length} fichiers : maximum ${MAX_FILES} autorisés.` },
          { status: 400 }
        );
      }

      // Valider existence des entités si fournis
      let appConnect: { application: { connect: { id: number } } } | {} = {};
      let matConnect: { materiel: { connect: { id: number } } } | {} = {};

      if (typeTicket === "ASSISTANCE" && Number.isFinite(applicationId)) {
        const app = await prisma.application.findUnique({ where: { id: applicationId! } });
        if (!app) return NextResponse.json({ error: "Application introuvable" }, { status: 400 });
        appConnect = { application: { connect: { id: app.id } } };
      }
      if (typeTicket === "INTERVENTION" && Number.isFinite(materielId)) {
        const mat = await prisma.materiel.findUnique({ where: { id: materielId! } });
        if (!mat) return NextResponse.json({ error: "Matériel introuvable" }, { status: 400 });
        matConnect = { materiel: { connect: { id: mat.id } } };
      }

      // Valider chaque fichier (taille + extension) avant création
      if (files && files.length) {
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
        }
      }

      // ——— CREATION DU TICKET APRES VALIDATION ———
      const ticket = await prisma.ticket.create({
        data: {
          description,
          type: typeTicket,
          statut: "OPEN",
          createdBy: { connect: { id: payload.id } },
          ...appConnect,
          ...matConnect,
        },
        include: {
          createdBy: true,
          application: true,
          materiel: true,
        },
      });

      // ——— ECRITURE PHYSIQUE DES FICHIERS + LIGNES BDD ———
      let createdCount = 0;
      let pieceUrls: string[] = [];

      if (files && files.length) {
        const baseDir = path.join(process.cwd(), "public", "uploads", "tickets", String(ticket.id));
        await fs.mkdir(baseDir, { recursive: true });

        const pjRows: { nomFichier: string; chemin: string; ticketId: number }[] = [];

        for (const f of files) {
          const ab = await f.arrayBuffer();
          const buf = Buffer.from(ab);

          const original = f.name || "fichier";
          const filename = `${Date.now()}_${slugify(original)}`;
          const fullPath = path.join(baseDir, filename);
          await fs.writeFile(fullPath, buf);

          const publicPath = `/uploads/tickets/${ticket.id}/${filename}`;
          pjRows.push({ nomFichier: original, chemin: publicPath, ticketId: ticket.id });
          pieceUrls.push(publicPath);
        }

        if (pjRows.length) {
          await prisma.pieceJointe.createMany({ data: pjRows });
          createdCount = pjRows.length;
        }
      }

      // ——— Notifs + Email ———
      const admins = await prisma.utilisateur.findMany({ where: { role: "CHEF_DSI" }, select: { id: true } });
      if (admins.length) {
        const message =
          `Nouveau ticket #${ticket.id} (${ticket.type})` +
          (ticket.application ? ` • App: ${ticket.application.nom}` : "") +
          (ticket.materiel ? ` • Matériel: ${ticket.materiel.nom}` : "") +
          ` — ${ticket.createdBy.prenom} ${ticket.createdBy.nom}`;
        await prisma.notification.createMany({
          data: admins.map(a => ({ message, ticketId: ticket.id, userId: a.id })),
        });
      }

      sendNewTicketEmails(ticket, pieceUrls).catch(e => console.error("Email CHEF_DSI non envoyé:", e));

      return NextResponse.json({
        message: "Ticket créé",
        ticketId: ticket.id,
        piecesJointes: createdCount,
      }, { status: 201 });
    }

    // Content-Type non géré
    return NextResponse.json({ error: "Format non supporté" }, { status: 415 });
  } catch (error) {
    console.error("Erreur création ticket :", error);
    return NextResponse.json({ error: "Impossible de créer le ticket" }, { status: 500 });
  }
}
