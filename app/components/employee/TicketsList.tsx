import { Ticket, TicketStatut } from "../../dashboard/employee/utils/ticketHelpers";
import StatusChip from "./StatusChip";

interface TicketsListProps {
    tickets: Ticket[];
    loading: boolean;
    user: { id: number; nom: string; prenom: string; role: string } | null;
    query: string;
    setQuery: (query: string) => void;
    statusFilter: "ALL" | TicketStatut;
    setStatusFilter: (filter: "ALL" | TicketStatut) => void;
    page: number;
    setPage: (page: number) => void;
    pageSize: 6 | 12 | 18 | 24;
    setPageSize: (size: 6 | 12 | 18 | 24) => void;
    filtered: Ticket[];
    paginated: Ticket[];
    totalPages: number;
    onRefresh: () => void;
    onSelectTicket: (ticket: Ticket) => void;
}

export default function TicketsList({
    tickets,
    loading,
    user,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    filtered,
    paginated,
    totalPages,
    onRefresh,
    onSelectTicket,
}: TicketsListProps) {
    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            {/* Header fixe */}
            <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border border-slate-200 rounded-lg p-4 mb-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h2 className="text-lg font-semibold text-slate-800">Mes demandes</h2>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                {tickets.length} ticket{tickets.length > 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Recherche */}
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="search"
                                placeholder="Rechercher un ticket..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full sm:w-64 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm bg-white"
                            />
                        </div>

                        {/* Filtres */}
                        <div className="flex gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as "ALL" | TicketStatut)}
                                className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm bg-white min-w-[140px]"
                            >
                                <option value="ALL">Tous les statuts</option>
                                <option value="OPEN">Ouverts</option>
                                <option value="IN_PROGRESS">En cours</option>
                                <option value="A_CLOTURER">À clôturer</option>
                                <option value="TRANSFERE_MANTIS">Transféré à Mantis</option>
                                <option value="REJETE">Rejetés</option>
                                <option value="CLOSED">Clôturés</option>
                            </select>

                            <button
                                onClick={onRefresh}
                                className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 bg-white transition-colors flex items-center gap-2"
                                title="Actualiser"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="hidden sm:inline">Actualiser</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu principal avec hauteur fixe */}
            <div className="flex-1 flex flex-col min-h-0">
                {!user && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-slate-600">Chargement de votre session...</p>
                        </div>
                    </div>
                )}

                {user && loading && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-slate-600">Chargement de vos tickets...</p>
                        </div>
                    </div>
                )}

                {user && !loading && paginated.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">Aucun ticket trouvé</h3>
                        <p className="text-slate-500 max-w-md">
                            {filtered.length === 0 && tickets.length > 0
                                ? "Aucun ticket ne correspond à vos critères de recherche."
                                : "Vous n'avez pas encore créé de ticket. Créez votre première demande !"
                            }
                        </p>
                    </div>
                )}

                {user && !loading && paginated.length > 0 && (
                    <>
                        {/* Grille des tickets */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 flex-1 overflow-y-auto pb-4">
                            {paginated.map((ticket) => (
                                <TicketCard
                                    key={ticket.id}
                                    ticket={ticket}
                                    onSelect={onSelectTicket}
                                />
                            ))}
                        </div>

                        {/* Pagination fixe en bas */}
                        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3 mt-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                    <span>
                                        Affichage de {(page - 1) * pageSize + 1} à {Math.min(page * pageSize, filtered.length)} sur {filtered.length} ticket{filtered.length > 1 ? 's' : ''}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span>Afficher</span>
                                        <select
                                            value={pageSize}
                                            onChange={(e) => setPageSize(Number(e.target.value) as 6 | 12 | 18 | 24)}
                                            className="px-2 py-1 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-100 text-sm"
                                        >
                                            <option value={6}>6</option>
                                            <option value={12}>12</option>
                                            <option value={18}>18</option>
                                            <option value={24}>24</option>
                                        </select>
                                        <span>par page</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={page === 1}
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                        className="px-4 py-2 rounded-lg border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Précédent
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const pageNumber = i + 1;
                                            return (
                                                <button
                                                    key={pageNumber}
                                                    onClick={() => setPage(pageNumber)}
                                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === pageNumber
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-slate-600 hover:bg-slate-100'
                                                        }`}
                                                >
                                                    {pageNumber}
                                                </button>
                                            );
                                        })}
                                        {totalPages > 5 && (
                                            <span className="px-2 text-slate-400">...</span>
                                        )}
                                    </div>

                                    <button
                                        disabled={page === totalPages}
                                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                                        className="px-4 py-2 rounded-lg border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors flex items-center gap-2"
                                    >
                                        Suivant
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// Composant Carte de Ticket
function TicketCard({ ticket, onSelect }: { ticket: Ticket; onSelect: (ticket: Ticket) => void }) {
    const getTypeIcon = (type: string) => {
        if (type === "ASSISTANCE") {
            return (
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            );
        }
        return (
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Hier';
        if (diffDays < 7) return `Il y a ${diffDays} jours`;
        if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;

        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div
            onClick={() => onSelect(ticket)}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg hover:border-slate-300 transition-all duration-200 cursor-pointer group"
        >
            {/* En-tête de la carte */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    {getTypeIcon(ticket.type)}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${ticket.type === "ASSISTANCE"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-purple-50 text-purple-700"
                        }`}>
                        {ticket.type === "ASSISTANCE" ? "Assistance" : "Intervention"}
                    </span>
                </div>
                <StatusChip statut={ticket.statut} />
            </div>

            {/* ID et Date */}
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-mono bg-slate-100 px-2 py-1 rounded">#{ticket.id}</span>
                <span>{formatDate(ticket.dateCreation)}</span>
            </div>

            {/* Description */}
            <div className="text-sm text-slate-800 mb-3 leading-relaxed line-clamp-3">
                {ticket.description || "Aucune description fournie"}
            </div>

            {/* Assignation */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs text-slate-600">
                        {ticket.assignedTo
                            ? `${ticket.assignedTo.prenom} ${ticket.assignedTo.nom}`
                            : "Non assigné"
                        }
                    </span>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </div>
            </div>
        </div>
    );
}