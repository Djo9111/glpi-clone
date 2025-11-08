"use client";

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
    const totalPages = Math.max(1, Math.ceil(tickets.length / pageSize));
    const paginatedTickets = tickets.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">Tous mes tickets</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {statusFilter === "ALL" ? totalTickets : tickets.length} ticket{
                            (statusFilter === "ALL" ? totalTickets : tickets.length) > 1 ? "s" : ""
                        } {statusFilter !== "ALL" ? `(${statusLabel(statusFilter)})` : ""}
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-600">Afficher</span>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            onPageSizeChange(Number(e.target.value));
                            onPageChange(1);
                        }}
                        className="border border-slate-300 rounded-lg px-2 py-1 bg-white"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                    <span className="text-slate-600">par page</span>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Créé par</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {tickets.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                                    {statusFilter === "ALL"
                                        ? "Aucun ticket assigné"
                                        : `Aucun ticket ${statusLabel(statusFilter).toLowerCase()}`}
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
            {tickets.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                        Page {page} / {totalPages} • {tickets.length} ticket{tickets.length > 1 ? "s" : ""}
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
        <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
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
                    {ticket.manticeNumero && (
                        <p className="text-xs text-indigo-700 mt-1">MANTICE: {ticket.manticeNumero}</p>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticket.type === "ASSISTANCE" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                    }`}>
                    {ticket.type === "ASSISTANCE" ? "Assistance" : "Intervention"}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={ticket.statut} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-slate-700">
                    {ticket.createdBy.prenom} {ticket.createdBy.nom}
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