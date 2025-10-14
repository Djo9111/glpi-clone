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
    const departements = await prisma.departement.findMany({
      select: {
        id: true, nom: true, responsableId: true,
        responsable: { select: { id: true, prenom: true, nom: true, email: true } },
      },
      orderBy: { nom: "asc" },
    });
    return NextResponse.json(departements);
  } catch (error) {
    console.error("Erreur GET /api/departements :", error);
    return NextResponse.json({ error: "Impossible de récupérer les départements" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const payload = getUser(request);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "CHEF_DSI") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    const body = await request.json();
    const nom = String(body?.nom ?? "").trim();
    const responsableId = body?.responsableId != null ? Number(body.responsableId) : undefined;

    if (!nom) return NextResponse.json({ error: "Le champ 'nom' est requis." }, { status: 400 });

    if (responsableId) {
      const existsResp = await prisma.utilisateur.findUnique({ where: { id: responsableId } });
      if (!existsResp) return NextResponse.json({ error: "Le responsable spécifié n'existe pas." }, { status: 400 });
    }

    // Idempotence + insensibilité à la casse
    const existing = await prisma.departement.findFirst({
      where: { nom: { equals: nom, mode: "insensitive" } },
      select: {
        id: true, nom: true, responsableId: true,
        responsable: { select: { id: true, prenom: true, nom: true, email: true } },
      },
    });
    if (existing) return NextResponse.json(existing, { status: 200 });

    const created = await prisma.departement.create({
      data: { nom, ...(responsableId ? { responsableId } : {}) },
      select: {
        id: true, nom: true, responsableId: true,
        responsable: { select: { id: true, prenom: true, nom: true, email: true } },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/departements:", e);
    return NextResponse.json({ error: "Création impossible." }, { status: 500 });
  }
}
