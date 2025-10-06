import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const payload = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    if (payload.role !== "CHEF_DSI") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const { nom, prenom, email, motDePasse, role, departementId } = await request.json();

    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    const newUser = await prisma.utilisateur.create({
      data: {
        nom,
        prenom,
        email,
        motDePasse: hashedPassword,
        role,
        departementId: parseInt(departementId),
      }
    });

    return NextResponse.json({ message: "Utilisateur créé", user: { id: newUser.id, nom, prenom, email, role } });
  } catch (error) {
    console.error("Erreur création utilisateur :", error);
    return NextResponse.json({ error: "Impossible de créer l'utilisateur" }, { status: 500 });
  }
}
