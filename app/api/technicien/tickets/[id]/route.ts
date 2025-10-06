import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

type Statut = "OPEN" | "IN_PROGRESS" | "CLOSED";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const ticketId = parseInt(id, 10);

    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const payload = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    if (payload.role !== "TECHNICIEN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    // Vérifier que le ticket est bien assigné au technicien
    const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!existing) return NextResponse.json({ error: "Ticket non trouvé" }, { status: 404 });
    if (existing.assignedToId !== payload.id) {
      return NextResponse.json({ error: "Ce ticket ne vous est pas assigné" }, { status: 403 });
    }

    const body = await request.json();
    const { statut } = body as { statut?: Statut };

    const updateData: any = {};
    if (statut && ["OPEN", "IN_PROGRESS", "CLOSED"].includes(statut)) updateData.statut = statut;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Aucune donnée de mise à jour fournie" }, { status: 400 });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        createdBy: { select: { id: true, prenom: true, nom: true } },
        assignedTo: { select: { id: true, prenom: true, nom: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH ticket technicien:", error);
    return NextResponse.json({ error: "Impossible de mettre à jour le ticket" }, { status: 500 });
  }
}
