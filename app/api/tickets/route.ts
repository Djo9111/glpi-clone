import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function POST(request: Request) {
  try {
    // Récupération du token JWT
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    // Vérification et décodage du token
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; role: string };

    // Vérification du rôle
    if (payload.role !== "EMPLOYE") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupération des données du formulaire
    const { description, typeTicket } = await request.json();

    // Création du ticket
    const newTicket = await prisma.ticket.create({
      data: {
        description,
        type: typeTicket,
        statut: "OPEN", // correspond à Statut.OPEN
        createdBy: { connect: { id: payload.id } } // <-- relie le ticket à l'employé existant
      }
    });

    return NextResponse.json({ message: "Ticket créé", ticket: newTicket });
  } catch (error) {
    console.error("Erreur création ticket :", error);
    return NextResponse.json({ error: "Impossible de créer le ticket" }, { status: 500 });
  }
}