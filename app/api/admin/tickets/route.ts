import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// Type string union pour le statut
type Statut = "OPEN" | "IN_PROGRESS" | "CLOSED";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const payload = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    if (payload.role !== "CHEF_DSI") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const tickets = await prisma.ticket.findMany({
      orderBy: { dateCreation: "desc" },
      include: {
        createdBy: { select: { id: true, prenom: true, nom: true } },
        assignedTo: { select: { id: true, prenom: true, nom: true } },
        application: true,
        materiel: true
      }
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Erreur GET tickets :", error);
    return NextResponse.json({ error: "Impossible de récupérer les tickets" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const payload = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    if (payload.role !== "CHEF_DSI") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    // Récupération du ticketId depuis l'URL
    const url = new URL(request.url);
    const ticketId = parseInt(url.pathname.split("/").pop() || "0");

    const { assignedToId, statut } = await request.json();

    const updateData: any = {};
    if (assignedToId) updateData.assignedToId = assignedToId;
    if (statut && ["OPEN", "IN_PROGRESS", "CLOSED"].includes(statut)) updateData.statut = statut as Statut;

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error("Erreur PATCH ticket :", error);
    return NextResponse.json({ error: "Impossible de mettre à jour le ticket" }, { status: 500 });
  }
}
