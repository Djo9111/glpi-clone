//app/api/applications/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Liste des applications (ex: Word, Lotus, Delta, Kaspersky, ...)
export async function GET() {
  try {
    const apps = await prisma.application.findMany({
      orderBy: { nom: "asc" },
    });
    return NextResponse.json(apps);
  } catch (e) {
    console.error("GET /api/applications:", e);
    return NextResponse.json({ error: "Impossible de récupérer les applications" }, { status: 500 });
  }
}
