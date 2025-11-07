import { Ticket, TicketStatut } from "../../utils/ticketHelpers";
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
    pageSize: 5 | 10 | 20 | 50;
    setPageSize: (size: 5 | 10 | 20 | 50) => void;
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
        <div className="flex flex-col gap-3">
            <div className="sticky top-[81px] z-40 bg-white/95 backdrop-blur border border-slate-200 rounded-md p-2">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm md:text-base font-semibold text-slate-800">Suivi de mes demandes</h2>
                        <span className="hidden md:inline text-xs text-slate-500">({tickets.length})</span>
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                        <input
                            type="search"
                            placeholder="Rechercher..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="h-9 w-[160px] md:w-[220px] rounded-md border border-slate-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as "ALL" | TicketStatut)}
                            className="h-9 rounded-md border border-slate-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="ALL">Tous</option>
                            <option value="OPEN">Ouverts</option>
                            <option value="IN_PROGRESS">En cours</option>
                            <option value="A_CLOTURER">À clôturer</option>
                            <option value="CLOSED">Clôturés</option>
                        </select>

                        <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-500">Afficher</span>
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value) as 5 | 10 | 20 | 50)}
                                className="h-9 rounded-md border border-slate-300 px-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="text-[11px] text-slate-500">par page</span>
                        </div>

                        <button
                            onClick={onRefresh}
                            className="h-9 text-sm rounded-md border border-slate-300 px-3 hover:bg-slate-50 bg-white transition-colors"
                            title="Actualiser"
                        >
                            ⟳
                        </button>
                    </div>
                </div>
            </div>

            {!user && (
                <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-600">
                    Chargement de votre session…
                </div>
            )}

            {user && loading && (
                <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-600">
                    Chargement…
                </div>
            )}

            {user && !loading && paginated.length === 0 && (
                <div className="rounded-md border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500 text-sm text-center">
                    Aucune demande pour le moment
                </div>
            )}

            {user && !loading && paginated.length > 0 && (
                <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <ul className="max-h-[520px] overflow-y-auto divide-y divide-slate-100">
                        {paginated.map((t) => (
                            <li
                                key={t.id}
                                onClick={() => onSelectTicket(t)}
                                className="cursor-pointer px-4 py-3 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-0.5">
                                            <span className="font-mono">#{t.id}</span>
                                            <span>•</span>
                                            <span>{new Date(t.dateCreation).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-800 truncate">
                                            {t.description || "(Sans titre)"}
                                        </p>
                                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                            <span
                                                className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${t.type === "ASSISTANCE"
                                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                        : "bg-purple-50 text-purple-700 border border-purple-200"
                                                    }`}
                                            >
                                                {t.type === "ASSISTANCE" ? "Assistance" : "Intervention"}
                                            </span>
                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                                                {t.assignedTo ? `${t.assignedTo.prenom} ${t.assignedTo.nom}` : "Non assigné"}
                                            </span>
                                        </div>
                                    </div>
                                    <StatusChip statut={t.statut} />
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-sm">
                        <span className="text-slate-600">
                            Page {page} / {totalPages} • {filtered.length} demande{filtered.length > 1 ? "s" : ""} • {pageSize}/page
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(Math.max(1, page - 1))}
                                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                                ← Précédent
                            </button>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                                Suivant →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}