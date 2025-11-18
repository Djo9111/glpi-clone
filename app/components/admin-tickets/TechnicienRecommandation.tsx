// app/components/TechnicienRecommandation.tsx
"use client";

import { useState, useEffect } from "react";

interface TechnicienRecommandation {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    chargeTravail: number;
    ticketsActifs: number;
}

interface TechnicienRecommandationProps {
    ticketId: number;
    onSelectTechnicien: (technicienId: number) => void;
    technicienActuel?: number; // ID du technicien actuellement assigné
}

export default function TechnicienRecommandation({
    ticketId,
    onSelectTechnicien,
    technicienActuel,
}: TechnicienRecommandationProps) {
    const [recommandations, setRecommandations] = useState<TechnicienRecommandation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRecommandations = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `/api/technicien/recommandation?ticketId=${ticketId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Erreur lors du chargement des recommandations");
                }

                const data = await response.json();
                setRecommandations(data.recommandations || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erreur inconnue");
                console.error("Erreur recommandations:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommandations();
    }, [ticketId]);

    if (loading) {
        return (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="text-sm font-medium text-slate-900 mb-2">
                    Recherche des techniciens disponibles...
                </h4>
                <div className="text-sm text-slate-500">Chargement des recommandations...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="text-sm font-medium text-red-900 mb-2">
                    Erreur de recommandation
                </h4>
                <div className="text-sm text-red-700">{error}</div>
            </div>
        );
    }

    if (recommandations.length === 0) {
        return (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="text-sm font-medium text-slate-900 mb-2">
                    Aucun technicien disponible
                </h4>
                <div className="text-sm text-slate-500">
                    Aucun technicien trouvé pour le moment.
                </div>
            </div>
        );
    }

    return (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-3">
                Techniciens recommandés (par charge de travail)
            </h4>

            <div className="space-y-2">
                {recommandations.slice(0, 3).map((tech, index) => {
                    const isActuel = technicienActuel === tech.id;
                    const isRecommandationTop = index === 0;

                    return (
                        <div
                            key={tech.id}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${isActuel
                                ? "bg-green-100 border-green-300"
                                : isRecommandationTop
                                    ? "bg-white border-blue-300 shadow-sm"
                                    : "bg-white border-slate-200"
                                }`}
                            onClick={() => onSelectTechnicien(tech.id)}
                        >
                            <div className="flex items-center space-x-3">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isRecommandationTop
                                    ? "bg-green-500 text-white"
                                    : "bg-slate-200 text-slate-700"
                                    }`}>
                                    {index + 1}
                                </div>

                                <div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-slate-900">
                                            {tech.prenom} {tech.nom}
                                        </span>
                                        {isActuel && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Actuel
                                            </span>
                                        )}
                                        {isRecommandationTop && !isActuel && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Recommandé
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {tech.chargeTravail} ticket{tech.chargeTravail > 1 ? "s" : ""} actif
                                        {tech.chargeTravail > 1 ? "s" : ""}
                                    </div>
                                </div>
                            </div>

                            <button
                                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${isActuel
                                    ? "bg-green-600 text-white hover:bg-green-700"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectTechnicien(tech.id);
                                }}
                            >
                                {isActuel ? "✓ Assigné" : "Assigner"}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 text-xs text-blue-700">
                Les techniciens sont classés par charge de travail (du moins au plus chargé)
            </div>
        </div>
    );
}