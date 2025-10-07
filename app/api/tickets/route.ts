import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

function getUserFromRequest(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; role: string };
  } catch {
    return null;
  }
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

    const { description, typeTicket } = await request.json();

    // 1) Création du ticket
    const ticket = await prisma.ticket.create({
      data: {
        description,
        type: typeTicket,
        statut: "OPEN",
        createdBy: { connect: { id: payload.id } },
      },
      include: { createdBy: true },
    });

    // 2) Trouver les admins (CHEF_DSI) à notifier
    const admins = await prisma.utilisateur.findMany({
      where: { role: "CHEF_DSI" },
      select: { id: true },
    });

    // 3) Créer les notifications pour chaque admin
    if (admins.length > 0) {
      const message = `Nouveau ticket #${ticket.id} (${ticket.type}) créé par ${ticket.createdBy.prenom} ${ticket.createdBy.nom}`;
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          message,
          ticketId: ticket.id,
          userId: a.id,
        })),
      });
    }

    return NextResponse.json({ message: "Ticket créé", ticket });
  } catch (error) {
    console.error("Erreur création ticket :", error);
    return NextResponse.json({ error: "Impossible de créer le ticket" }, { status: 500 });
  }
}
