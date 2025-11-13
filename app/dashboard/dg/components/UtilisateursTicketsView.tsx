// app/dashboard/dg/components/UtilisateursTicketsView.tsx
"use client";

import { useEffect, useState, useMemo } from "react";

type Utilisateur = {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    matricule: string | null;
    codeHierarchique: number;
    departement: {
        id: number;
        nom: string;
    } | null;
    departementId: number | null;
};

type Ticket = {
    id: number;
    description: string;
    statut: "OPEN" | "IN_PROGRESS" | "CLOSED" | "A_CLOTURER" | "REJETE" | "TRANSFERE_MANTIS";
    type: "ASSISTANCE" | "INTERVENTION";
    dateCreation: string;
    createdBy: {
        id: number;
        nom: string;
        prenom: string;
        email: string;
        departement?: {
            id: number;
            nom: string;
        } | null;
    };
    assignedTo: {
        id: number;
        nom: string;
        prenom: string;
    } | null;
    application: {
        id: number;
        nom: string;
    } | null;
    materiel: {
        id: number;
        nom: string;
    } | null;
    departement: {
        id: number;
        nom: string;
    } | null;
};

type ViewMode = "list" | "detail";

export default function UtilisateursTicketsView() {
    const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUtilisateur, setSelectedUtilisateur] = useState<Utilisateur | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [utilisateurTickets, setUtilisateurTickets] = useState<Ticket[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [departementFilter, setDepartementFilter] = useState<string>("all");

    // États pour la pagination des utilisateurs
    const [utilisateursPage, setUtilisateursPage] = useState(1);
    const [utilisateursPerPage, setUtilisateursPerPage] = useState(6);
    const [utilisateursTotalPages, setUtilisateursTotalPages] = useState(1);

    // États pour la pagination des tickets
    const [ticketsPage, setTicketsPage] = useState(1);
    const [ticketsPerPage, setTicketsPerPage] = useState(6);
    const [ticketsTotalPages, setTicketsTotalPages] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const [utilisateursRes, ticketsRes] = await Promise.all([
                    fetch("/api/utilisateurs", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch("/api/tickets", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                if (utilisateursRes.ok) {
                    const utilisateursData = await utilisateursRes.json();
                    setUtilisateurs(Array.isArray(utilisateursData) ? utilisateursData : []);
                }

                if (ticketsRes.ok) {
                    const ticketsData = await ticketsRes.json();
                    setTickets(Array.isArray(ticketsData) ? ticketsData : []);
                }
            } catch (error) {
                console.error("Erreur lors du chargement des données:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filtrage des utilisateurs
    const filteredUtilisateurs = useMemo(() => {
        return utilisateurs.filter(utilisateur => {
            const matchesSearch =
                utilisateur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                utilisateur.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                utilisateur.email.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDepartement = departementFilter === "all" ||
                utilisateur.departement?.nom === departementFilter;

            return matchesSearch && matchesDepartement;
        });
    }, [utilisateurs, searchTerm, departementFilter]);

    // Départements uniques pour le filtre
    const departements = useMemo(() => {
        const depts = utilisateurs
            .map(u => u.departement?.nom)
            .filter(Boolean) as string[];
        return [...new Set(depts)].sort();
    }, [utilisateurs]);

    // Calcul de la pagination pour les utilisateurs
    useEffect(() => {
        const totalPages = Math.ceil(filteredUtilisateurs.length / utilisateursPerPage);
        setUtilisateursTotalPages(totalPages);
        // Si la page actuelle est supérieure au nombre total de pages, on revient à la première page
        if (utilisateursPage > totalPages && totalPages > 0) {
            setUtilisateursPage(1);
        }
    }, [filteredUtilisateurs, utilisateursPerPage, utilisateursPage]);

    // Calcul de la pagination pour les tickets
    useEffect(() => {
        const totalPages = Math.ceil(utilisateurTickets.length / ticketsPerPage);
        setTicketsTotalPages(totalPages);
        // Si la page actuelle est supérieure au nombre total de pages, on revient à la première page
        if (ticketsPage > totalPages && totalPages > 0) {
            setTicketsPage(1);
        }
    }, [utilisateurTickets, ticketsPerPage, ticketsPage]);

    // Utilisateurs paginés
    const paginatedUtilisateurs = filteredUtilisateurs.slice(
        (utilisateursPage - 1) * utilisateursPerPage,
        utilisateursPage * utilisateursPerPage
    );

    // Tickets paginés
    const paginatedTickets = utilisateurTickets.slice(
        (ticketsPage - 1) * ticketsPerPage,
        ticketsPage * ticketsPerPage
    );

    const handleUtilisateurClick = (utilisateur: Utilisateur) => {
        setSelectedUtilisateur(utilisateur);

        // Filtrer les tickets créés par cet utilisateur
        const userTickets = tickets.filter(ticket => ticket.createdBy.id === utilisateur.id);
        setUtilisateurTickets(userTickets);
        setViewMode("detail");
        setTicketsPage(1); // Reset à la première page quand on change d'utilisateur
    };

    const handleBackToList = () => {
        setViewMode("list");
        setSelectedUtilisateur(null);
        setUtilisateurTickets([]);
        setTicketsPage(1);
    };

    const getStatusColor = (statut: string) => {
        switch (statut) {
            case "OPEN": return "bg-red-100 text-red-800 border-red-200";
            case "IN_PROGRESS": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "CLOSED": return "bg-green-100 text-green-800 border-green-200";
            case "A_CLOTURER": return "bg-orange-100 text-orange-800 border-orange-200";
            case "REJETE": return "bg-gray-100 text-gray-800 border-gray-200";
            case "TRANSFERE_MANTIS": return "bg-purple-100 text-purple-800 border-purple-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getStatusLabel = (statut: string) => {
        switch (statut) {
            case "OPEN": return "OUVERT";
            case "IN_PROGRESS": return "EN COURS";
            case "CLOSED": return "FERMÉ";
            case "A_CLOTURER": return "À CLÔTURER";
            case "REJETE": return "REJETÉ";
            case "TRANSFERE_MANTIS": return "TRANSFÉRÉ MANTIS";
            default: return statut;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "ASSISTANCE": return "bg-blue-100 text-blue-800";
            case "INTERVENTION": return "bg-purple-100 text-purple-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Compter les tickets par utilisateur
    const getTicketCountForUtilisateur = (utilisateurId: number) => {
        return tickets.filter(ticket => ticket.createdBy.id === utilisateurId).length;
    };

    // Composant de pagination réutilisable
    const Pagination = ({
        currentPage,
        totalPages,
        onPageChange,
        itemsPerPage,
        onItemsPerPageChange,
        totalItems
    }: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
        itemsPerPage: number;
        onItemsPerPageChange: (perPage: number) => void;
        totalItems: number;
    }) => (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Éléments par page:</span>
                <select
                    value={itemsPerPage}
                    onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                    <option value={3}>3</option>
                    <option value={6}>6</option>
                    <option value={9}>9</option>
                    <option value={12}>12</option>
                    <option value={15}>15</option>
                </select>
                <span>
                    {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                    Précédent
                </button>

                <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`w-8 h-8 rounded text-sm ${page === currentPage
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                    Suivant
                </button>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (viewMode === "detail" && selectedUtilisateur) {
        return (
            <div className="space-y-6">
                {/* En-tête de l'utilisateur */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={handleBackToList}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Retour aux utilisateurs
                        </button>
                    </div>

                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {selectedUtilisateur.prenom} {selectedUtilisateur.nom}
                            </h1>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span>{selectedUtilisateur.email}</span>
                                {selectedUtilisateur.departement && (
                                    <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700">
                                        {selectedUtilisateur.departement.nom}
                                    </span>
                                )}
                                <span className={`inline-flex items-center px-2 py-1 rounded ${selectedUtilisateur.codeHierarchique === 99
                                    ? 'bg-purple-100 text-purple-800'
                                    : selectedUtilisateur.codeHierarchique > 0
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    Niveau {selectedUtilisateur.codeHierarchique}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-blue-600">{utilisateurTickets.length}</div>
                            <div className="text-sm text-gray-500">tickets créés</div>
                        </div>
                    </div>
                </div>

                {/* Liste des tickets de l'utilisateur en grille */}
                {utilisateurTickets.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500">Aucun ticket créé par cet utilisateur</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedTickets.map((ticket) => (
                                <div key={ticket.id} className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Ticket #{ticket.id}
                                                </h3>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(ticket.statut)}`}>
                                                    {getStatusLabel(ticket.statut)}
                                                </span>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(ticket.type)}`}>
                                                    {ticket.type}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm line-clamp-3 mb-4">{ticket.description}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-500 block mb-1">Statut:</span>
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.statut)}`}>
                                                {getStatusLabel(ticket.statut)}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="font-medium text-gray-500 block mb-1">Assigné à:</span>
                                            <p className="text-gray-900">
                                                {ticket.assignedTo
                                                    ? `${ticket.assignedTo.prenom} ${ticket.assignedTo.nom}`
                                                    : <span className="text-gray-400">Non assigné</span>
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <span className="font-medium text-gray-500 block mb-1">Catégorie:</span>
                                            <p className="text-gray-900">
                                                {ticket.type === "ASSISTANCE"
                                                    ? ticket.application?.nom || 'Application non spécifiée'
                                                    : ticket.materiel?.nom || 'Matériel non spécifié'
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <span className="font-medium text-gray-500 block mb-1">Créé le:</span>
                                            <p className="text-gray-900">{formatDate(ticket.dateCreation)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination pour les tickets */}
                        {ticketsTotalPages > 1 && (
                            <Pagination
                                currentPage={ticketsPage}
                                totalPages={ticketsTotalPages}
                                onPageChange={setTicketsPage}
                                itemsPerPage={ticketsPerPage}
                                onItemsPerPageChange={setTicketsPerPage}
                                totalItems={utilisateurTickets.length}
                            />
                        )}
                    </>
                )}
            </div>
        );
    }

    // Vue liste des utilisateurs
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Tickets par Utilisateurs</h2>
                    <p className="text-gray-600 mt-1">
                        Cliquez sur un utilisateur pour voir ses tickets
                    </p>
                </div>
                <span className="text-sm text-gray-500">
                    {filteredUtilisateurs.length} utilisateur{filteredUtilisateurs.length > 1 ? 's' : ''}
                </span>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                            Rechercher un utilisateur
                        </label>
                        <input
                            type="text"
                            id="search"
                            placeholder="Nom, prénom, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="departement" className="block text-sm font-medium text-gray-700 mb-1">
                            Département
                        </label>
                        <select
                            id="departement"
                            value={departementFilter}
                            onChange={(e) => setDepartementFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Tous les départements</option>
                            {departements.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {filteredUtilisateurs.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-500">Aucun utilisateur trouvé</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedUtilisateurs.map((utilisateur) => {
                            const ticketCount = getTicketCountForUtilisateur(utilisateur.id);

                            return (
                                <div
                                    key={utilisateur.id}
                                    onClick={() => handleUtilisateurClick(utilisateur)}
                                    className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300 group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700">
                                                {utilisateur.prenom} {utilisateur.nom}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">{utilisateur.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-blue-600">{ticketCount}</div>
                                            <div className="text-xs text-gray-500">tickets</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        {utilisateur.departement && (
                                            <p>
                                                <span className="font-medium">Département:</span> {utilisateur.departement.nom}
                                            </p>
                                        )}

                                        <p>
                                            <span className="font-medium">Rôle:</span> {utilisateur.role.toLowerCase()}
                                        </p>

                                        <p>
                                            <span className="font-medium">Niveau hiérarchique:</span> {utilisateur.codeHierarchique}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-blue-600 font-medium group-hover:text-blue-700">
                                                Voir les tickets
                                            </span>
                                            <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination pour les utilisateurs */}
                    {utilisateursTotalPages > 1 && (
                        <Pagination
                            currentPage={utilisateursPage}
                            totalPages={utilisateursTotalPages}
                            onPageChange={setUtilisateursPage}
                            itemsPerPage={utilisateursPerPage}
                            onItemsPerPageChange={setUtilisateursPerPage}
                            totalItems={filteredUtilisateurs.length}
                        />
                    )}
                </>
            )}
        </div>
    );
}