import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

function getUserFromRequest(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as {
      id: number;
      role: string;
      codeHierarchique: number;
      departementId: number | null;
    };
  } catch {
    return null;
  }
}

/**
 * GET /api/employee/subordinates
 * Retourne la liste des employés que l'utilisateur connecté peut superviser
 * (même département, code hiérarchique inférieur)
 */
export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Seuls les employés peuvent utiliser cette route
    if (payload.role !== "EMPLOYE") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Si l'utilisateur n'a pas de code > 0 ou pas de département, pas de subordonnés
    if (payload.codeHierarchique === 0 || !payload.departementId) {
      return NextResponse.json([]);
    }

    // Récupérer tous les utilisateurs du même département avec un code inférieur
    const subordinates = await prisma.utilisateur.findMany({
      where: {
        departementId: payload.departementId,
        codeHierarchique: { lt: payload.codeHierarchique },
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        codeHierarchique: true,
        departement: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: [
        { codeHierarchique: "desc" }, // Du plus haut au plus bas
        { nom: "asc" },
        { prenom: "asc" },
      ],
    });

    return NextResponse.json(subordinates);
  } catch (error) {
    console.error("Erreur GET /api/employee/subordinates:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les subordonnés" },
      { status: 500 }
    );
  }
}