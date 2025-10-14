import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

function getUser(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as { id: number; role: "EMPLOYE"|"TECHNICIEN"|"CHEF_DSI" }; }
  catch { return null; }
}

export async function GET() {
  try {
    const apps = await prisma.application.findMany({ orderBy: { nom: "asc" } });
    return NextResponse.json(apps);
  } catch (e) {
    console.error("GET /api/applications:", e);
    return NextResponse.json({ error: "Impossible de récupérer les applications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const payload = getUser(request);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "CHEF_DSI") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    const body = await request.json();
    const nom = String(body?.nom ?? "").trim();
    if (!nom) return NextResponse.json({ error: "Le champ 'nom' est requis." }, { status: 400 });

    // Idempotence + insensibilité à la casse
    const existing = await prisma.application.findFirst({
      where: { nom: { equals: nom, mode: "insensitive" } },
    });
    if (existing) return NextResponse.json(existing, { status: 200 });

    const created = await prisma.application.create({ data: { nom } });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/applications:", e);
    return NextResponse.json({ error: "Création impossible." }, { status: 500 });
  }
}
