import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom, prenom, email, motDePasse, departementId, matricule } = body;

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.utilisateur.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email déjà utilisé" }, { status: 400 });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // Créer l'utilisateur avec rôle EMPLOYE
    const newUser = await prisma.utilisateur.create({
      data: {
        nom,
        prenom,
        email,
        motDePasse: hashedPassword,
        role: "EMPLOYE",
        matricule: matricule || null,
        departementId: departementId ? parseInt(departementId) : null
      }
    });

    return NextResponse.json({ message: "Utilisateur créé avec succès", userId: newUser.id });
  } catch (error) {
    console.error("Erreur /api/auth/signup :", error);
    return NextResponse.json({ error: "Impossible de créer l'utilisateur" }, { status: 500 });
  }
}
