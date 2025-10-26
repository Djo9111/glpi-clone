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
      role: "EMPLOYE" | "TECHNICIEN" | "CHEF_DSI";
      codeHierarchique: number;
      departementId: number | null;
    };
  } catch {
    return null;
  }
}

/**
 * PATCH /api/utilisateurs/[id]
 * Modifier un utilisateur existant
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const userId = parseInt(id, 10);

  const payload = getUser(request);
  if (!payload) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (payload.role !== "CHEF_DSI") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const existingUser = await prisma.utilisateur.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    // Nom
    if (body.nom !== undefined) {
      const nom = String(body.nom).trim();
      if (!nom) {
        return NextResponse.json(
          { error: "Le nom ne peut pas être vide" },
          { status: 400 }
        );
      }
      updateData.nom = nom;
    }

    // Prénom
    if (body.prenom !== undefined) {
      const prenom = String(body.prenom).trim();
      if (!prenom) {
        return NextResponse.json(
          { error: "Le prénom ne peut pas être vide" },
          { status: 400 }
        );
      }
      updateData.prenom = prenom;
    }

    // Rôle
    if (body.role !== undefined) {
      const role = body.role as Role;
      if (!Object.values(Role).includes(role)) {
        return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
      }
      updateData.role = role;
    }

    // Code hiérarchique
    if (body.codeHierarchique !== undefined) {
      const codeHierarchique = Number(body.codeHierarchique);
      if (!Number.isInteger(codeHierarchique) || codeHierarchique < 0) {
        return NextResponse.json(
          { error: "codeHierarchique doit être un entier >= 0" },
          { status: 400 }
        );
      }
      updateData.codeHierarchique = codeHierarchique;
    }

    // Département
    if (body.departementId !== undefined) {
      if (body.departementId === null || body.departementId === "") {
        updateData.departementId = null;
      } else {
        const departementId = Number(body.departementId);
        const dep = await prisma.departement.findUnique({
          where: { id: departementId },
        });
        if (!dep) {
          return NextResponse.json(
            { error: "Département introuvable" },
            { status: 400 }
          );
        }
        updateData.departementId = departementId;
      }
    }

    // Matricule
    if (body.matricule !== undefined) {
      const matricule = body.matricule
        ? String(body.matricule).trim()
        : null;

      if (matricule) {
        const existingMatricule = await prisma.utilisateur.findFirst({
          where: {
            matricule: { equals: matricule, mode: "insensitive" } as any,
            NOT: { id: userId },
          },
        });

        if (existingMatricule) {
          return NextResponse.json(
            { error: "Ce matricule est déjà utilisé par un autre utilisateur" },
            { status: 409 }
          );
        }
      }

      updateData.matricule = matricule;
    }

    // Mot de passe
    if (body.motDePasse && String(body.motDePasse).trim().length > 0) {
      const hash = await bcrypt.hash(String(body.motDePasse), 10);
      updateData.motDePasse = hash;
    }

    // Mettre à jour l'utilisateur
    const updated = await prisma.utilisateur.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        matricule: true,
        departementId: true,
        codeHierarchique: true,
        departement: {
          select: { id: true, nom: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH /api/utilisateurs/[id]:", e);
    return NextResponse.json(
      { error: "Mise à jour impossible" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/utilisateurs/[id]
 * Supprimer un utilisateur
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const userId = parseInt(id, 10);

  const payload = getUser(request);
  if (!payload) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (payload.role !== "CHEF_DSI") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const existingUser = await prisma.utilisateur.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    if (userId === payload.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte" },
        { status: 400 }
      );
    }

    await prisma.utilisateur.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "Utilisateur supprimé",
    });
  } catch (e: any) {
    console.error("DELETE /api/utilisateurs/[id]:", e);

    if (e.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer cet utilisateur car il est référencé par d'autres données (tickets, etc.)",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Suppression impossible" },
      { status: 500 }
    );
  }
}
