import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const payload = jwt.verify(token, JWT_SECRET) as { role: string };
    if (payload.role !== "CHEF_DSI") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const techniciens = await prisma.utilisateur.findMany({
      where: { role: "TECHNICIEN" },
      select: { id: true, prenom: true, nom: true }
    });

    return NextResponse.json(techniciens);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Impossible de récupérer les techniciens" }, { status: 500 });
  }
}
