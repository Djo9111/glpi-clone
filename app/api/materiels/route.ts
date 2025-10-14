//app/api/materiels/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Liste des matériels (ex: PC, Imprimante, Scanner, UC, ...)
export async function GET() {
  try {
    const items = await prisma.materiel.findMany({
      orderBy: { nom: "asc" },
    });
    return NextResponse.json(items);
  } catch (e) {
    console.error("GET /api/materiels:", e);
    return NextResponse.json({ error: "Impossible de récupérer les matériels" }, { status: 500 });
  }
}
