// app/dashboard/dg/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatsOverview from "./components/StatsOverview";
import DepartementsTicketsView from "./components/DepartementsTicketsView";
import UtilisateursTicketsView from "./components/UtilisateursTicketsView";
import AllTicketsView from "./components/AllTicketsView";
import Link from "next/link";

// Fonction pour décoder le JWT
function decodeJWT(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error("Erreur lors du décodage du JWT:", error);
        throw error;
    }
}

type User = {
    id: number;
    nom: string;
    prenom: string;
    role: string;
    codeHierarchique: number;
    departementId: number | null;
};

type ActiveView = "overview" | "departements" | "utilisateurs" | "all-tickets";

export default function DGDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [activeView, setActiveView] = useState<ActiveView>("overview");
    const [loggingOut, setLoggingOut] = useState(false);

    // Vérification de l'authentification et des droits DG
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        try {
            const payload = decodeJWT(token);

            // Vérifier si l'utilisateur a le code hiérarchique 99
            if (payload.codeHierarchique !== 99) {
                router.push("/dashboard/employee");
                return;
            }

            setUser({
                id: payload.id,
                nom: payload.nom,
                prenom: payload.prenom,
                role: payload.role,
                codeHierarchique: payload.codeHierarchique,
                departementId: payload.departementId || null,
            });
        } catch (error) {
            console.error("Erreur JWT :", error);
            router.push("/login");
        }
    }, [router]);

    const handleLogout = async () => {
        setLoggingOut(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        localStorage.removeItem("token");
        router.push("/login");
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Vérification des accès...</p>
                </div>
            </div>
        );
    }

    const displayName = `${user.prenom} ${user.nom}`;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
                <div className="px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <img src="/cds.png" alt="CDS Logo" className="h-10 w-auto" />
                        <div className="h-8 w-px bg-gray-200" />
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Tableau de Bord - Direction Générale</h1>
                            <p className="text-sm text-gray-600">Bienvenue, {displayName}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium">
                            DG - Niveau 99
                        </span>
                        <Link
                            href="/dashboard/reporting"
                            className="px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Reporting
                        </Link>

                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {loggingOut ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                    Déconnexion...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Déconnexion
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Navigation améliorée */}
                <nav className="px-6 border-t border-gray-200">
                    <div className="flex space-x-8">
                        <button
                            onClick={() => setActiveView("overview")}
                            className={`py-3 border-b-2 font-medium text-sm transition-colors ${activeView === "overview"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Vue d'ensemble
                        </button>
                        <button
                            onClick={() => setActiveView("departements")}
                            className={`py-3 border-b-2 font-medium text-sm transition-colors ${activeView === "departements"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Par Départements
                        </button>
                        <button
                            onClick={() => setActiveView("utilisateurs")}
                            className={`py-3 border-b-2 font-medium text-sm transition-colors ${activeView === "utilisateurs"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Par Utilisateurs
                        </button>
                        <button
                            onClick={() => setActiveView("all-tickets")}
                            className={`py-3 border-b-2 font-medium text-sm transition-colors ${activeView === "all-tickets"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Tous les tickets
                        </button>
                    </div>
                </nav>
            </header>

            {/* Main Content */}
            <main className="p-6">
                <div className="max-w-7xl mx-auto">
                    {activeView === "overview" && <StatsOverview onNavigate={setActiveView} />}
                    {activeView === "departements" && <DepartementsTicketsView />}
                    {activeView === "utilisateurs" && <UtilisateursTicketsView />}
                    {activeView === "all-tickets" && <AllTicketsView />}
                </div>
            </main>
        </div>
    );
}