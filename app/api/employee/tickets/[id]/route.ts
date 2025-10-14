// app/api/employee/tickets/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, Statut } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

function getUser(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; role: string };
  } catch {
    return null;
  }
}

// Note: avec Next 15+, `params` doit être *await*.
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const payload = getUser(request);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "EMPLOYE") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id: idStr } = await context.params;          // 👈 IMPORTANT
  const id = Number(idStr);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // PATCH sans body: ok
  }

  const demandStatus = String(body?.statut || "").toUpperCase();
  if (demandStatus !== "CLOSED") {
    return NextResponse.json({ error: "Seule la clôture est autorisée pour l'employé" }, { status: 400 });
  }

  // Vérifier que l'utilisateur courant est bien le créateur du ticket
  const ticket = await prisma.ticket.findFirst({
    where: { id, createdById: payload.id },
    include: {
      assignedTo: { select: { id: true, prenom: true, nom: true } },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket introuvable ou non autorisé" }, { status: 404 });
  }

  if (ticket.statut !== Statut.A_CLOTURER) {
    return NextResponse.json(
      { error: `Transition refusée: statut actuel = ${ticket.statut}, attendu = A_CLOTURER` },
      { status: 409 }
    );
  }

  const now = new Date();
  const start = ticket.prisEnChargeAt ?? ticket.dateCreation;
  const dureeTraitementMinutes = Math.max(
    0,
    Math.round((now.getTime() - new Date(start).getTime()) / 60000)
  );

  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      statut: Statut.CLOSED,
      clotureAt: now,
      dureeTraitementMinutes,
    },
    include: {
      assignedTo: { select: { id: true, prenom: true, nom: true } },
    },
  });

  return NextResponse.json(updated);
}
