// app/dashboard/dg/components/StatsOverview.tsx
"use client";

import { useEffect, useState } from "react";

interface StatsOverviewProps {
    onNavigate: (view: "departements" | "utilisateurs" | "all-tickets") => void;
}

type StatsData = {
    totalEmployes: number;
    totalDepartements: number;
    totalTickets: number;
    ticketsOpen: number;
    ticketsInProgress: number;
    ticketsClosed: number;
    ticketsACloturer: number;
    ticketsRejete: number;
    ticketsMantis: number;
};

type Ticket = {
    id: number;
    statut: "OPEN" | "IN_PROGRESS" | "CLOSED" | "A_CLOTURER" | "REJETE" | "TRANSFERE_MANTIS";
};

type Employe = {
    id: number;
};

type Departement = {
    id: number;
};

export default function StatsOverview({ onNavigate }: StatsOverviewProps) {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                // Récupérer tous les tickets (le DG a accès à tout via /api/tickets)
                const ticketsRes = await fetch("/api/tickets", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // Récupérer employés et départements
                const [employesRes, departementsRes] = await Promise.all([
                    fetch("/api/utilisateurs", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch("/api/departements", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                const [ticketsData, employesData, departementsData] = await Promise.all([
                    ticketsRes.json(),
                    employesRes.json(),
                    departementsRes.json(),
                ]);

                const tickets: Ticket[] = Array.isArray(ticketsData) ? ticketsData : [];
                const employes: Employe[] = Array.isArray(employesData) ? employesData : [];
                const departements: Departement[] = Array.isArray(departementsData) ? departementsData : [];

                // Calcul des statistiques avec les bons statuts
                const ticketsOpen = tickets.filter(t => t.statut === "OPEN").length;
                const ticketsInProgress = tickets.filter(t => t.statut === "IN_PROGRESS").length;
                const ticketsClosed = tickets.filter(t => t.statut === "CLOSED").length;
                const ticketsACloturer = tickets.filter(t => t.statut === "A_CLOTURER").length;
                const ticketsRejete = tickets.filter(t => t.statut === "REJETE").length;
                const ticketsMantis = tickets.filter(t => t.statut === "TRANSFERE_MANTIS").length;

                setStats({
                    totalEmployes: employes.length,
                    totalDepartements: departements.length,
                    totalTickets: tickets.length,
                    ticketsOpen,
                    ticketsInProgress,
                    ticketsClosed,
                    ticketsACloturer,
                    ticketsRejete,
                    ticketsMantis,
                });
            } catch (error) {
                console.error("Erreur lors du chargement des statistiques:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Cartes de statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        </div>
                    ))}
                </div>

                {/* Graphiques */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                            <div className="h-48 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">Impossible de charger les statistiques</p>
            </div>
        );
    }

    const ticketsResolus = stats.ticketsClosed + stats.ticketsACloturer;
    const tauxResolution = stats.totalTickets > 0
        ? Math.round((ticketsResolus / stats.totalTickets) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Cartes de statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Employés</h3>
                            <p className="text-3xl font-bold text-gray-900">{stats.totalEmployes}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-full">
                            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Départements</h3>
                            <p className="text-3xl font-bold text-gray-900">{stats.totalDepartements}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-full">
                            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Tickets</h3>
                            <p className="text-3xl font-bold text-gray-900">{stats.totalTickets}</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-full">
                            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Taux Résolution</h3>
                            <p className="text-3xl font-bold text-gray-900">{tauxResolution}%</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-full">
                            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistiques détaillées des tickets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des Tickets</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">Ouverts</span>
                                <span className="text-sm font-semibold text-red-600">{stats.ticketsOpen}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-red-500 h-2 rounded-full"
                                    style={{ width: `${(stats.ticketsOpen / stats.totalTickets) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">En cours</span>
                                <span className="text-sm font-semibold text-yellow-600">{stats.ticketsInProgress}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-yellow-500 h-2 rounded-full"
                                    style={{ width: `${(stats.ticketsInProgress / stats.totalTickets) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">Fermés</span>
                                <span className="text-sm font-semibold text-green-600">{stats.ticketsClosed}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${(stats.ticketsClosed / stats.totalTickets) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">À clôturer</span>
                                <span className="text-sm font-semibold text-orange-600">{stats.ticketsACloturer}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-orange-500 h-2 rounded-full"
                                    style={{ width: `${(stats.ticketsACloturer / stats.totalTickets) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">Transférés Mantis</span>
                                <span className="text-sm font-semibold text-purple-600">{stats.ticketsMantis}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-purple-500 h-2 rounded-full"
                                    style={{ width: `${(stats.ticketsMantis / stats.totalTickets) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
                    <div className="space-y-4">
                        <button
                            onClick={() => onNavigate("departements")}
                            className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900 group-hover:text-blue-700">Voir par départements</h4>
                                    <p className="text-sm text-gray-600 mt-1">Explorez les tickets organisés par département</p>
                                </div>
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>

                        <button
                            onClick={() => onNavigate("utilisateurs")}
                            className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900 group-hover:text-green-700">Voir par utilisateurs</h4>
                                    <p className="text-sm text-gray-600 mt-1">Consultez les tickets regroupés par employé</p>
                                </div>
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>

                        <button
                            onClick={() => onNavigate("all-tickets")}
                            className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors group"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900 group-hover:text-orange-700">Voir tous les tickets</h4>
                                    <p className="text-sm text-gray-600 mt-1">Accéder à la liste complète des tickets</p>
                                </div>
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                                <div className="text-2xl font-bold text-red-600">{stats.ticketsOpen}</div>
                                <div className="text-sm text-red-700 mt-1">Ouverts</div>
                            </div>
                            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="text-2xl font-bold text-yellow-600">{stats.ticketsInProgress}</div>
                                <div className="text-sm text-yellow-700 mt-1">En cours</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="text-2xl font-bold text-green-600">{stats.ticketsClosed}</div>
                                <div className="text-sm text-green-700 mt-1">Fermés</div>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="text-2xl font-bold text-purple-600">{stats.ticketsMantis}</div>
                                <div className="text-sm text-purple-700 mt-1">Mantis</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}