import { Ticket, TicketStatut, SubordinateUser } from "../../utils/ticketHelpers";
import StatusChip from "./StatusChip";

interface TeamSectionProps {
    subordinates: SubordinateUser[];
    loadingSubordinates: boolean;
    selectedSubordinate: SubordinateUser | null;
    setSelectedSubordinate: (subordinate: SubordinateUser | null) => void;
    subordinateTickets: Ticket[];
    loadingSubTickets: boolean;
    subQuery: string;
    setSubQuery: (query: string) => void;
    subStatusFilter: "ALL" | TicketStatut;
    setSubStatusFilter: (filter: "ALL" | TicketStatut) => void;
    subPage: number;
    setSubPage: (page: number) => void;
    subPageSize: 5 | 10 | 20 | 50;
    setSubPageSize: (size: 5 | 10 | 20 | 50) => void;
    filteredSubTickets: Ticket[];
    paginatedSubTickets: Ticket[];
    subTotalPages: number;
    onFetchSubordinateTickets: (userId: number) => void;
    onSelectTicket: (ticket: Ticket) => void;
}

export default function TeamSection({
    subordinates,
    loadingSubordinates,
    selectedSubordinate,
    setSelectedSubordinate,
    subordinateTickets,
    loadingSubTickets,
    subQuery,
    setSubQuery,
    subStatusFilter,
    setSubStatusFilter,
    subPage,
    setSubPage,
    subPageSize,
    setSubPageSize,
    filteredSubTickets,
    paginatedSubTickets,
    subTotalPages,
    onFetchSubordinateTickets,
    onSelectTicket,
}: TeamSectionProps) {
    return (
        <div className="flex flex-col gap-3">
            {!selectedSubordinate ? (
                <>
                    <div className="bg-white border border-slate-200 rounded-md p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h2 className="text-base font-semibold text-slate-800">
                                Mon équipe ({subordinates.length})
                            </h2>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            Vous pouvez consulter les tickets des personnes de votre équipe. Cliquez sur un membre pour voir ses tickets.
                        </p>

                        {loadingSubordinates && (
                            <div className="text-sm text-slate-500 p-4 text-center">Chargement...</div>
                        )}

                        {!loadingSubordinates && subordinates.length === 0 && (
                            <div className="text-sm text-slate-500 p-4 text-center border-2 border-dashed border-slate-200 rounded-md">
                                Aucun membre d'équipe sous votre supervision
                            </div>
                        )}

                        {!loadingSubordinates && subordinates.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {subordinates.map((sub) => (
                                    <button
                                        key={sub.id}
                                        onClick={() => {
                                            setSelectedSubordinate(sub);
                                            onFetchSubordinateTickets(sub.id);
                                        }}
                                        className="text-left border border-slate-200 rounded-lg p-4 hover:border-green-400 hover:bg-green-50/30 transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-slate-800 group-hover:text-green-700">
                                                    {sub.prenom} {sub.nom}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5 truncate">{sub.email}</div>
                                                {sub.departement && (
                                                    <div className="text-xs text-slate-500 mt-1">
                                                        📁 {sub.departement.nom}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                                                    Code {sub.codeHierarchique}
                                                </span>
                                                <svg className="w-5 h-5 text-slate-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Vue des tickets du subordonné */}
                    <div className="bg-white border border-slate-200 rounded-md p-3">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedSubordinate(null);
                                        setSubQuery("");
                                        setSubStatusFilter("ALL");
                                        setSubPage(1);
                                    }}
                                    className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-50"
                                    title="Retour à la liste"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <div>
                                    <h3 className="text-base font-semibold text-slate-800">
                                        Tickets de {selectedSubordinate.prenom} {selectedSubordinate.nom}
                                    </h3>
                                    <p className="text-xs text-slate-500">{selectedSubordinate.email}</p>
                                </div>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                                Code {selectedSubordinate.codeHierarchique}
                            </span>
                        </div>
                    </div>

                    <div className="sticky top-[81px] z-40 bg-white/95 backdrop-blur border border-slate-200 rounded-md p-2">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-700">
                                    {subordinateTickets.length} ticket{subordinateTickets.length > 1 ? "s" : ""}
                                </span>
                            </div>
                            <div className="flex-1" />
                            <div className="flex items-center gap-2">
                                <input
                                    type="search"
                                    placeholder="Rechercher..."
                                    value={subQuery}
                                    onChange={(e) => setSubQuery(e.target.value)}
                                    className="h-9 w-[160px] md:w-[220px] rounded-md border border-slate-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500"
                                />
                                <select
                                    value={subStatusFilter}
                                    onChange={(e) => setSubStatusFilter(e.target.value as "ALL" | TicketStatut)}
                                    className="h-9 rounded-md border border-slate-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-100"
                                >
                                    <option value="ALL">Tous</option>
                                    <option value="OPEN">Ouverts</option>
                                    <option value="IN_PROGRESS">En cours</option>
                                    <option value="A_CLOTURER">À clôturer</option>
                                    <option value="CLOSED">Clôturés</option>
                                </select>

                                <button
                                    onClick={() => selectedSubordinate && onFetchSubordinateTickets(selectedSubordinate.id)}
                                    className="h-9 text-sm rounded-md border border-slate-300 px-3 hover:bg-slate-50 bg-white transition-colors"
                                    title="Actualiser"
                                >
                                    ⟳
                                </button>
                            </div>
                        </div>
                    </div>

                    {loadingSubTickets && (
                        <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-600">
                            Chargement des tickets...
                        </div>
                    )}

                    {!loadingSubTickets && paginatedSubTickets.length === 0 && (
                        <div className="rounded-md border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500 text-sm text-center">
                            Aucun ticket trouvé
                        </div>
                    )}

                    {!loadingSubTickets && paginatedSubTickets.length > 0 && (
                        <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <ul className="max-h-[520px] overflow-y-auto divide-y divide-slate-100">
                                {paginatedSubTickets.map((t) => (
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
                                    Page {subPage} / {subTotalPages} • {filteredSubTickets.length} ticket{filteredSubTickets.length > 1 ? "s" : ""} • {subPageSize}/page
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={subPage === 1}
                                        onClick={() => setSubPage(Math.max(1, subPage - 1))}
                                        className="px-3 py-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                                    >
                                        ← Précédent
                                    </button>
                                    <button
                                        disabled={subPage === subTotalPages}
                                        onClick={() => setSubPage(Math.min(subTotalPages, subPage + 1))}
                                        className="px-3 py-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                                    >
                                        Suivant →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}