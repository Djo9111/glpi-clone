"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { statusLabel, type Ticket, type Technicien } from "@/app/dashboard/admin-tickets/utils/ticketHelpers";
import { StatusBadge } from "./StatusBadge";
import { AttachmentList } from "./AttachmentList";

interface AdminTicketModalProps {
    ticket: Ticket;
    techniciens: Technicien[];
    onClose: () => void;
    onAssign: (ticketId: number, technicienId: number) => void;
    onStatusChange: (ticketId: number, newStatus: Ticket["statut"]) => void;
    onTicketUpdate: (updatedTicket: any) => void;
}

export default function AdminTicketModal({
    ticket,
    techniciens,
    onClose,
    onAssign,
    onStatusChange,
    onTicketUpdate,
}: AdminTicketModalProps) {
    const StatusOptions: Ticket["statut"][] = [
        "OPEN", "IN_PROGRESS", "A_CLOTURER", "REJETE", "TRANSFERE_MANTICE", "CLOSED"
    ];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                    aria-hidden
                />

                <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900">Ticket #{ticket.id}</h3>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            aria-label="Fermer"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="px-6 py-6 max-h-[calc(100vh-200px)] overflow-y-auto space-y-6">
                        {/* Ticket details */}
                        <div className="space-y-3">
                            <h3 className="text-base font-semibold text-slate-900">
                                {ticket.description || "(Sans titre)"}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticket.type === "ASSISTANCE" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                                    }`}>
                                    {ticket.type === "ASSISTANCE" ? "Assistance" : "Intervention"}
                                </span>
                                {ticket.application?.nom && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                        App: {ticket.application.nom}
                                    </span>
                                )}
                                {ticket.materiel?.nom && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                        Matériel: {ticket.materiel.nom}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Assignment and Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Assigner un technicien
                                </label>
                                <select
                                    onChange={(e) => onAssign(ticket.id, parseInt(e.target.value))}
                                    value={ticket.assignedTo?.id || ""}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                >
                                    <option value="">Non assigné</option>
                                    {techniciens.map((tec) => (
                                        <option key={tec.id} value={tec.id}>
                                            {tec.prenom} {tec.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Changer le statut
                                </label>
                                <select
                                    onChange={(e) => onStatusChange(ticket.id, e.target.value as Ticket["statut"])}
                                    value={ticket.statut}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                >
                                    {StatusOptions.map((s) => (
                                        <option key={s} value={s}>
                                            {statusLabel(s)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Attachments */}
                        <div>
                            <h4 className="text-sm font-medium text-slate-900 mb-3">Pièces jointes</h4>
                            <AttachmentList ticketId={ticket.id} />
                        </div>

                        {/* Full page link */}
                        <div className="pt-4 border-t border-slate-200">
                            <Link
                                href={`/dashboard/admin-tickets/${ticket.id}`}
                                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Ouvrir la page complète
                                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}