"use client";

import { useEffect, useMemo, useState } from "react";
import { statusLabel, type Ticket } from "@/app/dashboard/technicien/utils/ticketHelpers";
import { StatusBadge } from "./StatusBadge";
import { Eye } from "lucide-react";

interface TicketsTableProps {
    tickets: Ticket[];
    loading: boolean;
    statusFilter: Ticket["statut"] | "ALL";
    pageSize: number;
    page: number;
    totalTickets: number;
    onPageSizeChange: (size: number) => void;
    onPageChange: (page: number) => void;
    onTicketClick: (ticket: Ticket) => void;
}

function formatDate(dateString?: string): string {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export default function TicketsTable({
    tickets,
    loading,
    statusFilter,
    pageSize,
    page,
    totalTickets,
    onPageSizeChange,
    onPageChange,
    onTicketClick,
}: TicketsTableProps) {
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const filteredTickets = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return tickets.filter((ticket) => {
            // ---- Recherche globale ----
            if (normalizedSearch) {
                const idStr = String(ticket.id);
                const creatorIdStr = String(ticket.createdBy?.id ?? "");
                const description = (ticket.description ?? "").toLowerCase();
                const creatorName = `${ticket.createdBy?.prenom ?? ""} ${ticket.createdBy?.nom ?? ""}`.toLowerCase();
                const mantis = (ticket.mantisNumero ?? "").toLowerCase();
                const dateStr = ticket.dateCreation
                    ? new Date(ticket.dateCreation).toLocaleDateString("fr-FR").toLowerCase()
                    : "";
                const dateRaw = (ticket.dateCreation ?? "").toLowerCase();

                const matchesSearch =
                    idStr.includes(normalizedSearch) ||
                    creatorIdStr.includes(normalizedSearch) ||
                    description.includes(normalizedSearch) ||
                    creatorName.includes(normalizedSearch) ||
                    mantis.includes(normalizedSearch) ||
                    dateStr.includes(normalizedSearch) ||
                    dateRaw.includes(normalizedSearch);

                if (!matchesSearch) return false;
            }

            // ---- Filtre de dates ----
            if (!dateFrom && !dateTo) return true;

            if (!ticket.dateCreation) return false;
            const d = new Date(ticket.dateCreation);
            if (Number.isNaN(d.getTime())) return false;

            if (dateFrom) {
                const from = new Date(dateFrom + "T00:00:00");
                if (d < from) return false;
            }
            if (dateTo) {
                const to = new Date(dateTo + "T23:59:59");
                if (d > to) return false;
            }

            return true;
        });
    }, [tickets, search, dateFrom, dateTo]);

    // Reset page quand on change les filtres
    useEffect(() => {
        onPageChange(1);
    }, [search, dateFrom, dateTo, onPageChange]);

    const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
    const paginatedTickets = filteredTickets.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Header avec recherche & filtres */}
            <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex flex-col gap-4">
                    {/* Titre et compteur */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Tous mes tickets</h2>
                            <p className="text-sm text-slate-500 mt-1">
                                {filteredTickets.length} ticket
                                {filteredTickets.length > 1 ? "s" : ""} trouvé
                                {filteredTickets.length > 1 ? "s" : ""}{" "}
                                {statusFilter !== "ALL" ? `(${statusLabel(statusFilter)})` : ""}
                                {statusFilter === "ALL" && (
                                    <> • {totalTickets} assigné(s) au total</>
                                )}
                            </p>
                        </div>

                        {/* Bouton reset des filtres */}
                        {(search || dateFrom || dateTo) && (
                            <button
                                onClick={() => {
                                    setSearch("");
                                    setDateFrom("");
                                    setDateTo("");
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            >
                                Réinitialiser
                            </button>
                        )}
                    </div>

                    {/* Barre de recherche et filtres */}
                    <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                        {/* Recherche globale */}
                        <div className="relative flex-1 max-w-md">
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <input
                                type="search"
                                placeholder="Rechercher par ID, créateur, mantis..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Filtres date et pagination */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                            {/* Filtre date (du / au) */}
                            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    placeholder="Du"
                                    className="px-2 py-1 rounded border-0 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
                                />
                                <span className="text-xs text-slate-500">→</span>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    placeholder="Au"
                                    className="px-2 py-1 rounded border-0 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
                                />
                            </div>

                            {/* Sélecteur pageSize */}
                            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                                <span className="text-sm text-slate-600 whitespace-nowrap">Afficher</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        onPageSizeChange(Number(e.target.value));
                                        onPageChange(1);
                                    }}
                                    className="border-0 rounded bg-white px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <span className="text-sm text-slate-600">/page</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-x-auto relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <div className="h-4 w-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                            Chargement de vos tickets...
                        </div>
                    </div>
                )}

                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Créé le
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Statut
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Créé par
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredTickets.length === 0 && !loading && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-6 py-8 text-center text-sm text-slate-500"
                                >
                                    {statusFilter === "ALL"
                                        ? "Aucun ticket assigné ne correspond à vos critères."
                                        : `Aucun ticket ${statusLabel(statusFilter).toLowerCase()} ne correspond à vos critères.`}
                                </td>
                            </tr>
                        )}
                        {paginatedTickets.map((ticket) => (
                            <TicketRow key={ticket.id} ticket={ticket} onTicketClick={onTicketClick} />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {filteredTickets.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                        Page {page} / {totalPages} • {filteredTickets.length} ticket
                        {filteredTickets.length > 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => onPageChange(Math.max(1, page - 1))}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors text-sm font-medium"
                        >
                            ← Précédent
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors text-sm font-medium"
                        >
                            Suivant →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function TicketRow({ ticket, onTicketClick }: { ticket: Ticket; onTicketClick: (ticket: Ticket) => void }) {
    return (
        <tr className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-mono font-medium text-slate-900">#{ticket.id}</span>
            </td>
            <td className="px-6 py-4">
                <div className="max-w-md">
                    <p className="text-sm font-medium text-slate-900 truncate">
                        {ticket.description || "(Sans titre)"}
                    </p>
                    {(ticket.application?.nom || ticket.materiel?.nom) && (
                        <p className="text-xs text-slate-500 mt-1">
                            {ticket.application?.nom && `App: ${ticket.application.nom}`}
                            {ticket.application?.nom && ticket.materiel?.nom && " • "}
                            {ticket.materiel?.nom && `Mat: ${ticket.materiel.nom}`}
                        </p>
                    )}
                    {ticket.mantisNumero && (
                        <p className="text-xs text-indigo-700 mt-1">MANTIS : {ticket.mantisNumero}</p>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticket.type === "ASSISTANCE"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                        }`}
                >
                    {ticket.type === "ASSISTANCE" ? "Assistance" : "Intervention"}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {ticket.dateCreation ? (
                    formatDate(ticket.dateCreation)
                ) : (
                    <span className="text-slate-400 italic">—</span>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={ticket.statut} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-slate-700">
                    {ticket.createdBy.prenom} {ticket.createdBy.nom}{" "}
                    {/*<span className="text-xs text-slate-400">({ticket.createdBy.id})</span>*/}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
                <button
                    onClick={() => onTicketClick(ticket)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                    <Eye className="h-4 w-4" />
                    Détails
                </button>
            </td>
        </tr>
    );
}