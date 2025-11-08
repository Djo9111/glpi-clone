"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { X, Send, PlayCircle, CheckCircle2, CheckCheck } from "lucide-react";
import { statusLabel, type Ticket } from "@/app/dashboard/technicien/utils/ticketHelpers";
import { StatusBadge } from "./StatusBadge";
import { AttachmentList } from "./AttachmentList";

interface TicketModalProps {
    ticket: Ticket;
    onClose: () => void;
    onTicketUpdate: (updatedTicket: any) => void;
}

export default function TicketModal({ ticket, onClose, onTicketUpdate }: TicketModalProps) {
    const [manticeNumeroInput, setManticeNumeroInput] = useState<string>(ticket.manticeNumero ?? "");
    const [showManticeInput, setShowManticeInput] = useState<boolean>(ticket.statut === "TRANSFERE_MANTICE");

    const patchTicket = async (ticketId: number, payload: Record<string, any>) => {
        const token = localStorage.getItem("token");
        if (!token) return { ok: false, data: null };
        const res = await fetch(`/api/technicien/tickets/${ticketId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        return { ok: res.ok, data };
    };

    const handleStatusChange = async (newStatus: Ticket["statut"]) => {
        if (newStatus === "TRANSFERE_MANTICE") {
            setShowManticeInput(true);
            if (ticket.manticeNumero) {
                const { ok, data } = await patchTicket(ticket.id, {
                    statut: "TRANSFERE_MANTICE",
                    manticeNumero: ticket.manticeNumero
                });
                if (!ok) {
                    alert(data?.error || "Erreur mise à jour du statut");
                    return;
                }
                onTicketUpdate(data);
                alert("Ticket transféré à MANTICE !");
            } else {
                alert("Veuillez renseigner le numéro Mantice puis valider.");
            }
            return;
        }

        const { ok, data } = await patchTicket(ticket.id, { statut: newStatus });
        if (!ok) {
            alert(data?.error || "Erreur mise à jour du statut");
            return;
        }
        onTicketUpdate(data);
        alert("Statut mis à jour !");
    };

    const handleSaveMantice = async () => {
        const numero = manticeNumeroInput.trim();
        if (!numero) {
            alert("Veuillez saisir un numéro Mantice.");
            return;
        }
        const payload = ticket.statut === "TRANSFERE_MANTICE"
            ? { manticeNumero: numero }
            : { statut: "TRANSFERE_MANTICE", manticeNumero: numero };

        const { ok, data } = await patchTicket(ticket.id, payload);
        if (!ok) {
            alert(data?.error || "Impossible d'enregistrer le numéro Mantice");
            return;
        }
        onTicketUpdate(data);
        alert("Numéro Mantice enregistré !");
        setShowManticeInput(false);
    };

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
                            <div className="text-sm text-slate-600">
                                <p>Créé par: <span className="font-medium">{ticket.createdBy.prenom} {ticket.createdBy.nom}</span></p>
                                {ticket.assignedTo && (
                                    <p>Assigné à: <span className="font-medium">{ticket.assignedTo.prenom} {ticket.assignedTo.nom}</span></p>
                                )}
                                {ticket.manticeNumero && (
                                    <p className="mt-1 text-indigo-700">MANTICE: <span className="font-mono">{ticket.manticeNumero}</span></p>
                                )}
                            </div>
                        </div>

                        {/* Status change */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Changer le statut
                            </label>
                            <select
                                onChange={(e) => handleStatusChange(e.target.value as Ticket["statut"])}
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

                        {/* Mantice input */}
                        {(showManticeInput || ticket.statut === "TRANSFERE_MANTICE") && (
                            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 space-y-3">
                                <p className="text-sm font-medium text-indigo-800">
                                    Numéro MANTICE (obligatoire si "Transféré MANTICE")
                                </p>
                                <input
                                    value={manticeNumeroInput}
                                    onChange={(e) => setManticeNumeroInput(e.target.value)}
                                    placeholder="Ex: MNT-2025-000123"
                                    className="w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleSaveMantice}
                                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                                    >
                                        <Send className="h-4 w-4" />
                                        Valider Mantice
                                    </button>
                                    {ticket.manticeNumero && (
                                        <span className="text-xs text-indigo-700">
                                            Actuel: <span className="font-mono">{ticket.manticeNumero}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Quick actions */}
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-3">Actions rapides</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleStatusChange("IN_PROGRESS")}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                >
                                    <PlayCircle className="h-4 w-4" />
                                    Marquer en cours
                                </button>
                                <button
                                    onClick={() => handleStatusChange("A_CLOTURER")}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    À clôturer
                                </button>
                                <button
                                    onClick={() => {
                                        setShowManticeInput(true);
                                        if (!ticket.manticeNumero) {
                                            alert("Saisissez le numéro Mantice puis cliquez sur 'Valider Mantice'.");
                                        } else {
                                            handleStatusChange("TRANSFERE_MANTICE");
                                        }
                                    }}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                                >
                                    <Send className="h-4 w-4" />
                                    Transférer MANTICE
                                </button>
                                <button
                                    onClick={() => handleStatusChange("CLOSED")}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                >
                                    <CheckCheck className="h-4 w-4" />
                                    Clôturer
                                </button>
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
                                href={`/dashboard/technicien/${ticket.id}`}
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