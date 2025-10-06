import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const departements = await prisma.departement.findMany({
    //sert à spécifier exactement quelles colonnes (ou champs) tu veux récupérer depuis la base de données.
      select: { id: true, nom: true }
    });
    return NextResponse.json(departements);
  } catch (error) {
    console.error("Erreur GET /api/departements :", error);
    return NextResponse.json({ error: "Impossible de récupérer les départements" }, { status: 500 });
  }
}
