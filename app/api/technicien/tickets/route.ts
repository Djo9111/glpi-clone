import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const payload = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    if (payload.role !== "TECHNICIEN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    // Récupère tous les tickets assignés au technicien connecté
    const tickets = await prisma.ticket.findMany({
      where: { assignedToId: payload.id },
      include: {
        createdBy: { select: { id: true, prenom: true, nom: true, email: true } },
        assignedTo: { select: { id: true, prenom: true, nom: true } },
      },
      orderBy: { dateCreation: "desc" },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Erreur GET tickets technicien:", error);
    return NextResponse.json({ error: "Impossible de récupérer les tickets" }, { status: 500 });
  }
}
