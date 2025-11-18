// app/api/techniciens/recommandation/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

function getUserFromRequest(request: Request) {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET) as {
            id: number;
            role: string;
            codeHierarchique: number;
            departementId: number | null;
        };
    } catch {
        return null;
    }
}

export async function GET(request: Request) {
    try {
        const payload = getUserFromRequest(request);
        if (!payload || payload.role !== "CHEF_DSI") {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        // Récupérer tous les techniciens
        const techniciens = await prisma.utilisateur.findMany({
            where: { role: "TECHNICIEN" },
            select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
            },
        });

        // Pour chaque technicien, compter les tickets actifs
        const techniciensAvecCharge = await Promise.all(
            techniciens.map(async (tech) => {
                const ticketsActifs = await prisma.ticket.count({
                    where: {
                        assignedToId: tech.id,
                        statut: { in: ["OPEN", "IN_PROGRESS"] },
                    },
                });

                return {
                    ...tech,
                    chargeTravail: ticketsActifs,
                    ticketsActifs: ticketsActifs,
                };
            })
        );

        // Trier par charge de travail (croissant)
        const techniciensTries = techniciensAvecCharge.sort(
            (a, b) => a.chargeTravail - b.chargeTravail
        );

        const url = new URL(request.url);
        const ticketId = url.searchParams.get("ticketId");

        if (ticketId) {
            console.log(`✅ Recommandations CORRIGÉES pour le ticket #${ticketId}:`,
                techniciensTries.slice(0, 3).map(t =>
                    `${t.prenom} ${t.nom} (${t.chargeTravail} tickets)`
                ).join(', ')
            );
        }

        return NextResponse.json({
            recommandations: techniciensTries.slice(0, 5),
            totalTechniciens: techniciensTries.length,
        });

    } catch (error) {
        console.error("Erreur recommandation techniciens:", error);
        return NextResponse.json(
            { error: "Impossible de générer les recommandations" },
            { status: 500 }
        );
    }
}