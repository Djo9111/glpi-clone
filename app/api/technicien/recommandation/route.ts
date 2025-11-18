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
        if (!payload) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        // Seuls les admins (CHEF_DSI) peuvent voir les recommandations
        if (payload.role !== "CHEF_DSI") {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        const url = new URL(request.url);
        const ticketId = url.searchParams.get("ticketId");

        // Récupérer tous les techniciens avec leur charge de travail
        const techniciensAvecCharge = await prisma.utilisateur.findMany({
            where: {
                role: "TECHNICIEN",
            },
            include: {
                ticketsAssignes: {
                    where: {
                        statut: {
                            in: ["OPEN", "IN_PROGRESS"],
                        },
                    },
                    select: {
                        id: true,
                    },
                },
                _count: {
                    select: {
                        ticketsAssignes: {
                            where: {
                                statut: {
                                    in: ["OPEN", "IN_PROGRESS"],
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                ticketsAssignes: {
                    _count: "asc", // Priorité aux techniciens avec moins de tickets actifs
                },
            },
        });

        // Formater la réponse avec les données de charge
        const recommandations = techniciensAvecCharge.map((tech) => ({
            id: tech.id,
            nom: tech.nom,
            prenom: tech.prenom,
            email: tech.email,
            chargeTravail: tech._count.ticketsAssignes,
            ticketsActifs: tech.ticketsAssignes.length,
        }));

        // Si un ticketId est fourni, on peut logger la recommandation (optionnel)
        if (ticketId) {
            console.log(`Recommandation générée pour le ticket ${ticketId}:`,
                recommandations.slice(0, 3).map(t => `${t.prenom} ${t.nom} (${t.chargeTravail} tickets)`).join(', ')
            );
        }

        return NextResponse.json({
            recommandations: recommandations.slice(0, 5), // Retourne les 5 premiers
            totalTechniciens: techniciensAvecCharge.length,
        });

    } catch (error) {
        console.error("Erreur recommandation techniciens:", error);
        return NextResponse.json(
            { error: "Impossible de générer les recommandations" },
            { status: 500 }
        );
    }
}