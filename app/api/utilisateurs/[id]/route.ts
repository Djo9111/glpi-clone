import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

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
  const userId = Number(id);

  const payload = getUser(request);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "CHEF_DSI") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    if (!Number.isFinite(userId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

    const body = await request.json();
    const data: any = {};

    if (typeof body.nom === "string") data.nom = body.nom.trim();
    if (typeof body.prenom === "string") data.prenom = body.prenom.trim();
    if (typeof body.role === "string") data.role = body.role as Role;
    if ("departementId" in body) data.departementId = body.departementId ?? null;
    if ("matricule" in body) data.matricule = body.matricule ?? null;
    if (typeof body.motDePasse === "string" && body.motDePasse.trim().length > 0) {
      data.motDePasse = await bcrypt.hash(body.motDePasse, 10);
    }

    if (!data.nom || !data.prenom) {
      return NextResponse.json({ error: "Nom et prénom requis" }, { status: 400 });
    }

    const updated = await prisma.utilisateur.update({
      where: { id: userId },
      data,
      include: {
        departement: { select: { id: true, nom: true } },
      },
    });

    // ne jamais retourner le hash
    const { motDePasse, ...safe } = updated as any;
    return NextResponse.json(safe);
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Conflit de contrainte unique (email ou matricule)" }, { status: 409 });
    }
    console.error("PATCH /api/utilisateurs/[id]:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const userId = Number(id);

  const payload = getUser(request);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "CHEF_DSI") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    if (!Number.isFinite(userId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

    // Optionnel: empêcher l’auto-suppression du CHEF_DSI connecté
    if (payload.id === userId) {
      return NextResponse.json({ error: "Impossible de supprimer votre propre compte" }, { status: 400 });
    }

    await prisma.utilisateur.delete({ where: { id: userId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.code === "P2003") {
      return NextResponse.json({ error: "Utilisateur référencé (tickets, etc.)" }, { status: 409 });
    }
    console.error("DELETE /api/utilisateurs/[id]:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
