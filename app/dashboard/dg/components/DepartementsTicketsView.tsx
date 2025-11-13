// app/dashboard/dg/components/DepartementsTicketsView.tsx
"use client";

import { useEffect, useState } from "react";

type Departement = {
    id: number;
    nom: string;
    responsableId: number | null;
    responsable: {
        id: number;
        prenom: string;
        nom: string;
        email: string;
    } | null;
    _count?: {
        utilisateurs: number;
    };
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

export default function DepartementsTicketsView() {
    const [departements, setDepartements] = useState<Departement[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDepartement, setSelectedDepartement] = useState<Departement | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [departementTickets, setDepartementTickets] = useState<Ticket[]>([]);
    const [ticketsLoading, setTicketsLoading] = useState(false);

    // États pour la pagination des départements
    const [departementsPage, setDepartementsPage] = useState(1);
    const [departementsPerPage, setDepartementsPerPage] = useState(6);
    const [departementsTotalPages, setDepartementsTotalPages] = useState(1);

    // États pour la pagination des tickets
    const [ticketsPage, setTicketsPage] = useState(1);
    const [ticketsPerPage, setTicketsPerPage] = useState(6);
    const [ticketsTotalPages, setTicketsTotalPages] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const [departementsRes, ticketsRes] = await Promise.all([
                    fetch("/api/departements", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch("/api/tickets", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                if (departementsRes.ok) {
                    const departementsData = await departementsRes.json();
                    setDepartements(Array.isArray(departementsData) ? departementsData : []);
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

    // Calcul de la pagination pour les départements
    useEffect(() => {
        const totalPages = Math.ceil(departements.length / departementsPerPage);
        setDepartementsTotalPages(totalPages);
        // Si la page actuelle est supérieure au nombre total de pages, on revient à la première page
        if (departementsPage > totalPages && totalPages > 0) {
            setDepartementsPage(1);
        }
    }, [departements, departementsPerPage, departementsPage]);

    // Calcul de la pagination pour les tickets
    useEffect(() => {
        const totalPages = Math.ceil(departementTickets.length / ticketsPerPage);
        setTicketsTotalPages(totalPages);
        // Si la page actuelle est supérieure au nombre total de pages, on revient à la première page
        if (ticketsPage > totalPages && totalPages > 0) {
            setTicketsPage(1);
        }
    }, [departementTickets, ticketsPerPage, ticketsPage]);

    // Départements paginés
    const paginatedDepartements = departements.slice(
        (departementsPage - 1) * departementsPerPage,
        departementsPage * departementsPerPage
    );

    // Tickets paginés
    const paginatedTickets = departementTickets.slice(
        (ticketsPage - 1) * ticketsPerPage,
        ticketsPage * ticketsPerPage
    );

    const handleDepartementClick = async (departement: Departement) => {
        setSelectedDepartement(departement);
        setTicketsLoading(true);

        // Filtrer les tickets pour ce département
        const filteredTickets = tickets.filter(ticket =>
            ticket.departement?.id === departement.id ||
            ticket.createdBy.departement?.id === departement.id
        );

        setDepartementTickets(filteredTickets);
        setViewMode("detail");
        setTicketsPage(1); // Reset à la première page quand on change de département
        setTicketsLoading(false);
    };

    const handleBackToList = () => {
        setViewMode("list");
        setSelectedDepartement(null);
        setDepartementTickets([]);
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

    // Compter les tickets par département
    const getTicketCountForDepartement = (departementId: number) => {
        return tickets.filter(ticket =>
            ticket.departement?.id === departementId ||
            ticket.createdBy.departement?.id === departementId
        ).length;
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

    if (viewMode === "detail" && selectedDepartement) {
        return (
            <div className="space-y-6">
                {/* En-tête du département */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={handleBackToList}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Retour aux départements
                        </button>
                    </div>

                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{selectedDepartement.nom}</h1>
                            {selectedDepartement.responsable && (
                                <p className="text-gray-600 mt-1">
                                    Responsable: {selectedDepartement.responsable.prenom} {selectedDepartement.responsable.nom}
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-blue-600">{departementTickets.length}</div>
                            <div className="text-sm text-gray-500">tickets</div>
                        </div>
                    </div>
                </div>

                {/* Liste des tickets du département en grille */}
                {ticketsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg shadow border border-gray-200 p-6 animate-pulse">
                                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : departementTickets.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500">Aucun ticket pour ce département</p>
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
                                            <span className="font-medium text-gray-500 block mb-1">Créé par:</span>
                                            <span className="text-gray-900">
                                                {ticket.createdBy.prenom} {ticket.createdBy.nom}
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
                                totalItems={departementTickets.length}
                            />
                        )}
                    </>
                )}
            </div>
        );
    }

    // Vue liste des départements
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Tickets par Départements</h2>
                    <p className="text-gray-600 mt-1">
                        Cliquez sur un département pour voir ses tickets
                    </p>
                </div>
                <span className="text-sm text-gray-500">
                    {departements.length} département{departements.length > 1 ? 's' : ''}
                </span>
            </div>

            {departements.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-500">Aucun département trouvé</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedDepartements.map((departement) => {
                            const ticketCount = getTicketCountForDepartement(departement.id);

                            return (
                                <div
                                    key={departement.id}
                                    onClick={() => handleDepartementClick(departement)}
                                    className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300 group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700">
                                            {departement.nom}
                                        </h3>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-blue-600">{ticketCount}</div>
                                            <div className="text-xs text-gray-500">tickets</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        {departement.responsable ? (
                                            <p>
                                                <span className="font-medium">Responsable:</span><br />
                                                {departement.responsable.prenom} {departement.responsable.nom}
                                            </p>
                                        ) : (
                                            <p className="text-gray-400">Aucun responsable</p>
                                        )}

                                        {departement._count && (
                                            <p>
                                                <span className="font-medium">Employés:</span> {departement._count.utilisateurs || 0}
                                            </p>
                                        )}
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

                    {/* Pagination pour les départements */}
                    {departementsTotalPages > 1 && (
                        <Pagination
                            currentPage={departementsPage}
                            totalPages={departementsTotalPages}
                            onPageChange={setDepartementsPage}
                            itemsPerPage={departementsPerPage}
                            onItemsPerPageChange={setDepartementsPerPage}
                            totalItems={departements.length}
                        />
                    )}
                </>
            )}
        </div>
    );
}