import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

function isAdmin(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return false;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return payload?.role === "CHEF_DSI";
  } catch {
    return false;
  }
}

// Admin: lister les applications
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  try {
    const apps = await prisma.application.findMany({ orderBy: { nom: "asc" } });
    return NextResponse.json(apps);
  } catch (e) {
    console.error("GET /api/admin/applications:", e);
    return NextResponse.json({ error: "Impossible de récupérer les applications" }, { status: 500 });
  }
}

// Admin: créer une application
export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  try {
    const { nom } = await req.json();
    const name = (nom || "").toString().trim();
    if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

    const created = await prisma.application.create({ data: { nom: name } });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    // gestion unique constraint
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Cette application existe déjà" }, { status: 409 });
    }
    console.error("POST /api/admin/applications:", e);
    return NextResponse.json({ error: "Création impossible" }, { status: 500 });
  }
}
