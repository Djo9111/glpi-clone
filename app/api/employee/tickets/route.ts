import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

function getUser(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as { id: number; role: string }; }
  catch { return null; }
}

export async function GET(request: Request) {
  const payload = getUser(request);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "EMPLOYE") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const tickets = await prisma.ticket.findMany({
    where: { createdById: payload.id },
    orderBy: { dateCreation: "desc" },
    include: {
      assignedTo: { select: { id: true, prenom: true, nom: true } },
    },
  });

  return NextResponse.json(tickets);
}
