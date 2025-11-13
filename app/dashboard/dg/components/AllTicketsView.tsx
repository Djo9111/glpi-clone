// app/dashboard/dg/components/AllTicketsView.tsx
"use client";

import { useEffect, useState, useMemo } from "react";

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

export default function AllTicketsView() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [departementFilter, setDepartementFilter] = useState<string>("all");
    const [departements, setDepartements] = useState<{ id: number; nom: string }[]>([]);

    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const [ticketsRes, departementsRes] = await Promise.all([
                    fetch("/api/tickets", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch("/api/departements", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                if (ticketsRes.ok) {
                    const ticketsData = await ticketsRes.json();
                    setTickets(Array.isArray(ticketsData) ? ticketsData : []);
                }

                if (departementsRes.ok) {
                    const departementsData = await departementsRes.json();
                    setDepartements(Array.isArray(departementsData) ? departementsData : []);
                }
            } catch (error) {
                console.error("Erreur lors du chargement des données:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filtrage des tickets
    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            const matchesSearch =
                ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.createdBy.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.createdBy.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(ticket.id).includes(searchTerm) ||
                (ticket.assignedTo &&
                    `${ticket.assignedTo.prenom} ${ticket.assignedTo.nom}`.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === "all" || ticket.statut === statusFilter;
            const matchesType = typeFilter === "all" || ticket.type === typeFilter;
            const matchesDepartement = departementFilter === "all" ||
                ticket.departement?.nom === departementFilter ||
                ticket.createdBy.departement?.nom === departementFilter;

            return matchesSearch && matchesStatus && matchesType && matchesDepartement;
        });
    }, [tickets, searchTerm, statusFilter, typeFilter, departementFilter]);

    // Calcul de la pagination
    useEffect(() => {
        const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
        setTotalPages(totalPages);
        // Si la page actuelle est supérieure au nombre total de pages, on revient à la première page
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [filteredTickets, itemsPerPage, currentPage]);

    // Tickets paginés
    const paginatedTickets = filteredTickets.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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

    // Composant de pagination
    const Pagination = () => (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Éléments par page:</span>
                <select
                    value={itemsPerPage}
                    onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1); // Reset à la première page quand on change le nombre d'éléments par page
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                    <option value={3}>3</option>
                    <option value={6}>6</option>
                    <option value={9}>9</option>
                    <option value={12}>12</option>
                    <option value={15}>15</option>
                </select>
                <span>
                    {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredTickets.length)} sur {filteredTickets.length}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                    Précédent
                </button>

                <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
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
                    onClick={() => setCurrentPage(currentPage + 1)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow border border-gray-200 p-6 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Tous les Tickets</h2>
                <span className="text-sm text-gray-500">
                    {filteredTickets.length} ticket{filteredTickets.length > 1 ? 's' : ''} sur {tickets.length}
                </span>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                            Recherche
                        </label>
                        <input
                            type="text"
                            id="search"
                            placeholder="ID, description, créateur..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset à la première page quand on recherche
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                            Statut
                        </label>
                        <select
                            id="status"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="OPEN">Ouvert</option>
                            <option value="IN_PROGRESS">En cours</option>
                            <option value="CLOSED">Fermé</option>
                            <option value="A_CLOTURER">À clôturer</option>
                            <option value="REJETE">Rejeté</option>
                            <option value="TRANSFERE_MANTIS">Transféré Mantis</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                        </label>
                        <select
                            id="type"
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Tous les types</option>
                            <option value="ASSISTANCE">Assistance</option>
                            <option value="INTERVENTION">Intervention</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="departement" className="block text-sm font-medium text-gray-700 mb-1">
                            Département
                        </label>
                        <select
                            id="departement"
                            value={departementFilter}
                            onChange={(e) => {
                                setDepartementFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Tous les départements</option>
                            {departements.map(dept => (
                                <option key={dept.id} value={dept.nom}>{dept.nom}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Liste des tickets en grille */}
            {filteredTickets.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500">Aucun ticket trouvé</p>
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
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-gray-900">
                                                {ticket.createdBy.prenom} {ticket.createdBy.nom}
                                            </span>
                                            {ticket.departement && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                                                    {ticket.departement.nom}
                                                </span>
                                            )}
                                        </div>
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

                    {/* Pagination */}
                    {totalPages > 1 && <Pagination />}
                </>
            )}
        </div>
    );
}