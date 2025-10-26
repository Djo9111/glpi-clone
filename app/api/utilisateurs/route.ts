import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

function getUser(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try { 
    return jwt.verify(token, JWT_SECRET) as { 
      id: number; 
      role: "EMPLOYE"|"TECHNICIEN"|"CHEF_DSI";
      codeHierarchique: number;
      departementId: number | null;
    }; 
  }
  catch { return null; }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const roleParam = url.searchParams.get("role") as Role | null;
    const where = roleParam ? { role: roleParam } : {};

    const users = await prisma.utilisateur.findMany({
      where,
      orderBy: [{ role: "asc" }, { nom: "asc" }, { prenom: "asc" }],
      select: {
        id: true, 
        nom: true, 
        prenom: true, 
        email: true, 
        role: true, 
        matricule: true,
        codeHierarchique: true,
        departement: { select: { id: true, nom: true } }, 
        departementId: true,
      },
    });
    return NextResponse.json(users);
  } catch (e) {
    console.error("GET /api/utilisateurs:", e);
    return NextResponse.json({ error: "Impossible de récupérer les utilisateurs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const payload = getUser(request);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "CHEF_DSI") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    const body = await request.json();
    const nom = String(body?.nom ?? "").trim();
    const prenom = String(body?.prenom ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const motDePasse = String(body?.motDePasse ?? "").trim();
    const role: Role = (body?.role as Role) ?? "EMPLOYE";
    const departementId = body?.departementId != null ? Number(body.departementId) : undefined;
    const matricule = body?.matricule ? String(body.matricule).trim() : undefined;
    const codeHierarchique = body?.codeHierarchique != null ? Number(body.codeHierarchique) : 0;

    if (!nom || !prenom || !email || !motDePasse) {
      return NextResponse.json({ error: "Champs requis: nom, prenom, email, motDePasse." }, { status: 400 });
    }
    if (!Object.values(Role).includes(role)) {
      return NextResponse.json({ error: "Role invalide." }, { status: 400 });
    }
    if (!Number.isInteger(codeHierarchique) || codeHierarchique < 0) {
      return NextResponse.json({ error: "codeHierarchique doit être un entier >= 0." }, { status: 400 });
    }

    if (departementId) {
      const dep = await prisma.departement.findUnique({ where: { id: departementId } });
      if (!dep) return NextResponse.json({ error: "Département introuvable." }, { status: 400 });
    }

    // Idempotence légère: si email déjà présent (insensible à la casse), renvoyer l'existant 200
    const existingByEmail = await prisma.utilisateur.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { 
        id: true, nom: true, prenom: true, email: true, role: true, 
        matricule: true, departementId: true, codeHierarchique: true 
      },
    });
    if (existingByEmail) return NextResponse.json(existingByEmail, { status: 200 });

    if (matricule) {
      const existingByMatricule = await prisma.utilisateur.findFirst({
        where: { matricule: { equals: matricule, mode: "insensitive" } as any },
        select: { id: true },
      });
      if (existingByMatricule) return NextResponse.json({ error: "Matricule déjà utilisé." }, { status: 409 });
    }

    const hash = await bcrypt.hash(motDePasse, 10);

    const created = await prisma.utilisateur.create({
      data: {
        nom, prenom, email, motDePasse: hash, role,
        codeHierarchique,
        ...(departementId ? { departementId } : {}),
        ...(matricule ? { matricule } : {}),
      },
      select: { 
        id: true, nom: true, prenom: true, email: true, role: true, 
        matricule: true, departementId: true, codeHierarchique: true 
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/utilisateurs:", e);
    return NextResponse.json({ error: "Création impossible." }, { status: 500 });
  }
}