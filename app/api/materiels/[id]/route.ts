import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

function getUser(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as { id: number; role: string }; }
  catch { return null; }
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const itemId = Number(id);

  const payload = getUser(request);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "CHEF_DSI") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    if (!Number.isFinite(itemId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }
    const body = await request.json();
    const nom = body?.nom ? String(body.nom).trim() : undefined;
    if (!nom) return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });

    const updated = await prisma.materiel.update({
      where: { id: itemId },
      data: { nom },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Un matériel avec ce nom existe déjà" }, { status: 409 });
    }
    console.error("PATCH /api/materiels/[id]:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const itemId = Number(id);

  const payload = getUser(request);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "CHEF_DSI") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    if (!Number.isFinite(itemId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }
    await prisma.materiel.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.code === "P2003") {
      return NextResponse.json({ error: "Ce matériel est référencé par des tickets" }, { status: 409 });
    }
    console.error("DELETE /api/materiels/[id]:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
