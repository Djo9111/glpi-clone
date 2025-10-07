import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import path from "node:path";
import fs from "node:fs/promises";

export const runtime = "nodejs";        // important pour avoir les APIs Node
export const dynamic = "force-dynamic"; // utile si besoin de désactiver le cache route

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// ——— réglages upload (peux ajuster) ———
const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
const ALLOWED_EXT = new Set(["pdf","png","jpg","jpeg","txt","log","doc","docx","xlsx","csv"]);

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

      if (files && files.length) {
        if (files.length > MAX_FILES) {
          return NextResponse.json({ error: `Maximum ${MAX_FILES} fichiers autorisés` }, { status: 400 });
        }

        const baseDir = path.join(process.cwd(), "public", "uploads", "tickets", String(ticket.id));
        await fs.mkdir(baseDir, { recursive: true });

        const pjRows: { nomFichier: string; chemin: string; ticketId: number }[] = [];

        for (const f of files) {
          // TS lib DOM File
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

          pjRows.push({
            nomFichier: original,
            chemin: `/uploads/tickets/${ticket.id}/${filename}`, // exposé statiquement par Next (public/)
            ticketId: ticket.id,
          });
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
