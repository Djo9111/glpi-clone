import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function POST(request: Request) {
  try {
    const { email, motDePasse } = await request.json();

    if (!email || !motDePasse) {
      return NextResponse.json(
        { error: "Champs manquants" },
        { status: 400 }
      );
    }

    const user = await prisma.utilisateur.findUnique({
      where: { email },
      include: {
        departement: { select: { id: true, nom: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur inconnu" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(motDePasse, user.motDePasse);

    if (!isValid) {
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        nom: user.nom,
        prenom: user.prenom,
        codeHierarchique: user.codeHierarchique,
        departementId: user.departementId,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        codeHierarchique: user.codeHierarchique,
        departementId: user.departementId,
        departement: user.departement,
      },
    });
  }
  catch (error) {
    console.error("Erreur lors du login:", error);

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
