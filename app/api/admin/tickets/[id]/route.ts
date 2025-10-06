import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const ticketId = parseInt(id);

    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const payload = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    if (payload.role !== "CHEF_DSI")
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const body = await request.json();

    const updateData: any = {};
    if (body.assignedToId) updateData.assignedToId = body.assignedToId;
    if (body.statut) updateData.statut = body.statut;

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        createdBy: true,
        assignedTo: true,
      },
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error("Erreur PATCH ticket admin:", error);
    return NextResponse.json(
      { error: "Impossible de mettre à jour le ticket" },
      { status: 500 }
    );
  }
}
