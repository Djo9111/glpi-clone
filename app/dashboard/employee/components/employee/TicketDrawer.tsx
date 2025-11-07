import { useEffect, useState } from "react";
import { normalizeTicket } from "../../utils/ticketHelpers";
import type { Ticket, TicketStatut, PieceJointe, CommentItem } from "../../utils/ticketHelpers";

interface TicketDrawerProps {
    ticket: Ticket | null;
    onClose: () => void;
    user: { id: number; prenom: string; nom: string; role: string } | null;
    onStatusUpdated: (id: number, newStatut: TicketStatut) => void;
}

export default function TicketDrawer({
    ticket,
    onClose,
    user,
    onStatusUpdated,
}: TicketDrawerProps) {
    const [pj, setPj] = useState<PieceJointe[]>([]);
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [commentInput, setCommentInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        let abort = false;
        async function run() {
            if (!ticket) return;

            const token = localStorage.getItem("token");
            if (!token) return;

            setLoading(true);
            try {
                const [pjRes, cRes] = await Promise.all([
                    fetch(`/api/tickets/${ticket.id}/pieces-jointes`, {
                        headers: { Authorization: `Bearer ${token}` },
                        cache: "no-store",
                    }),
                    fetch(`/api/tickets/${ticket.id}/comments`, {
                        headers: { Authorization: `Bearer ${token}` },
                        cache: "no-store",
                    }),
                ]);
                const [pjData, cData] = await Promise.all([pjRes.json(), cRes.json()]);
                if (!abort) {
                    setPj(Array.isArray(pjData) ? pjData : []);
                    setComments(Array.isArray(cData) ? cData : []);
                }
            } catch {
                if (!abort) {
                    setPj([]);
                    setComments([]);
                }
            } finally {
                if (!abort) setLoading(false);
            }
        }

        run();
        return () => {
            abort = true;
            setPj([]);
            setComments([]);
            setCommentInput("");
        };
    }, [ticket]);

    if (!ticket) return null;

    const stepIndex =
        ticket.statut === "CLOSED" ? 4 :
            ticket.statut === "A_CLOTURER" ? 3 :
                ticket.statut === "IN_PROGRESS" ? 2 :
                    ticket.statut === "TRANSFERE_MANTICE" ? 2 :
                        ticket.assignedTo ? 1 : 0;

    const canClose = ticket.statut === "A_CLOTURER";

    const handleAddComment = async () => {
        const token = localStorage.getItem("token");
        if (!token || !user) return;

        const contenu = commentInput.trim();
        if (contenu.length < 2) {
            alert("Commentaire trop court");
            return;
        }

        setSending(true);

        const tempId = -Math.floor(Math.random() * 1e9);
        const optimistic: CommentItem = {
            id: tempId,
            contenu,
            createdAt: new Date().toISOString(),
            auteur: { id: user.id, prenom: (user as any).prenom || "Vous", nom: (user as any).nom || "" },
        };
        setComments((prev) => [...prev, optimistic]);
        setCommentInput("");

        try {
            const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ contenu }),
            });
            const data = await res.json();

            if (!res.ok) {
                setComments((prev) => prev.filter((c) => c.id !== tempId));
                alert(data.error || "Erreur lors de l'ajout du commentaire");
                return;
            }

            setComments((prev) => prev.map((c) => (c.id === tempId ? data : c)));
        } catch (e) {
            console.error(e);
            setComments((prev) => prev.filter((c) => c.id !== tempId));
            alert("Erreur réseau");
        } finally {
            setSending(false);
        }
    };

    const handleCloseTicket = async () => {
        if (!canClose) return;
        const token = localStorage.getItem("token");
        if (!token) return;

        setClosing(true);
        try {
            const res = await fetch(`/api/employee/tickets/${ticket.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ statut: "CLOSED" }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data?.error || "Impossible de clôturer ce ticket");
                return;
            }

            const normalized = normalizeTicket(data);
            onStatusUpdated(normalized.id, normalized.statut);
            alert("Ticket clôturé avec succès !");
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la clôture du ticket");
        } finally {
            setClosing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <aside className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl border-l border-slate-200 p-4 md:p-5 flex flex-col overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                        <h3 className="text-base font-semibold text-slate-800">Ticket #{ticket.id}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                        {canClose && (
                            <button
                                onClick={handleCloseTicket}
                                disabled={closing}
                                className="rounded-md bg-emerald-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                title="Clôturer ce ticket"
                            >
                                {closing ? "Clôture…" : "Clôturer"}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors"
                        >
                            ✕ Fermer
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 pb-3 border-b border-slate-100">
                    <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(ticket.dateCreation).toLocaleString()}
                    </span>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${ticket.type === "ASSISTANCE" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                        {ticket.type}
                    </span>
                    {ticket.createdBy && (
                        <>
                            <span>•</span>
                            <span className="truncate">Par: {ticket.createdBy.prenom} {ticket.createdBy.nom}</span>
                        </>
                    )}
                </div>

                <div className="bg-slate-50 rounded-md p-3 mb-4">
                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                </div>

                <div className="mb-4 bg-white border border-slate-200 rounded-md p-3">
                    <h4 className="text-sm font-semibold text-slate-800 mb-2.5">Progression</h4>

                    <div className="relative flex items-center">
                        <div className="absolute left-4 right-4 h-1 bg-slate-200 rounded-full" />
                        <div
                            className="absolute left-4 h-1 bg-blue-500 rounded-full transition-all"
                            style={{ width: `calc(${(stepIndex / (4)) * 100}% - 1rem)` }}
                        />
                        <div className="w-full flex justify-between">
                            {["Créé", "Assigné", "En cours", "À clôturer", "Clôturé"].map((lbl, i) => {
                                const active = i <= stepIndex;
                                const current = i === stepIndex;
                                return (
                                    <div key={lbl} className="flex flex-col items-center gap-1" style={{ minWidth: 0 }}>
                                        <div
                                            className={`h-3.5 w-3.5 rounded-full border ${active ? "bg-blue-500 border-blue-600" : "bg-white border-slate-300"
                                                } ${current ? "ring-4 ring-blue-100" : ""}`}
                                        />
                                        <span className={`text-[10px] text-center truncate ${active ? "text-slate-700" : "text-slate-400"}`} title={lbl}>
                                            {lbl}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>
                            Technicien assigné : {ticket.assignedTo ? `${ticket.assignedTo.prenom} ${ticket.assignedTo.nom}` : "En attente d'attribution"}
                        </span>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <h4 className="text-sm font-semibold text-slate-800">Pièces jointes</h4>
                    </div>
                    {loading && <div className="text-xs text-slate-500 bg-slate-50 rounded-md p-2">Chargement…</div>}
                    {!loading && pj.length === 0 && (
                        <div className="text-xs text-slate-500 bg-slate-50 rounded-md p-2 text-center">Aucune pièce jointe</div>
                    )}
                    {!loading && pj.length > 0 && (
                        <ul className="space-y-2">
                            {pj.map((f) => (
                                <li key={f.id}>
                                    <a
                                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md p-2 transition-colors border border-slate-200"
                                        href={f.url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="break-all">{f.nomFichier}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <h4 className="text-sm font-semibold text-slate-800">Commentaires</h4>
                        </div>
                        <button
                            onClick={async () => {
                                if (!ticket) return;
                                setLoadingComments(true);
                                try {
                                    const token = localStorage.getItem("token");
                                    const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
                                        headers: { Authorization: `Bearer ${token}` },
                                        cache: "no-store",
                                    });
                                    const data = await res.json();
                                    setComments(Array.isArray(data) ? data : []);
                                } catch {
                                    setComments([]);
                                } finally {
                                    setLoadingComments(false);
                                }
                            }}
                            className="text-xs rounded-md border border-slate-300 px-2.5 py-1 hover:bg-slate-50 transition-colors"
                            title="Actualiser les commentaires"
                        >
                            ⟳
                        </button>
                    </div>

                    {loadingComments && <div className="text-xs text-slate-500 bg-slate-50 rounded-md p-2">Chargement…</div>}

                    {comments.length === 0 && !loadingComments ? (
                        <div className="text-xs text-slate-500 bg-slate-50 rounded-md p-3 text-center mb-3">
                            Aucun commentaire pour le moment
                        </div>
                    ) : (
                        <ul className="space-y-2 mb-3 flex-1 overflow-y-auto">
                            {comments.map((c) => (
                                <li key={c.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                                        <span className="font-medium text-slate-700">
                                            {c.auteur.prenom} {c.auteur.nom}
                                        </span>
                                        <span>{new Date(c.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{c.contenu}</div>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="border-t border-slate-200 pt-3 mt-auto">
                        <label className="text-[11px] font-medium text-slate-700 mb-1.5 block">Ajouter un commentaire</label>
                        <textarea
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            className="w-full min-h-[84px] border border-slate-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 mb-2"
                            placeholder="Précisions, compléments, captures envoyées, etc."
                            maxLength={4000}
                        />
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">{commentInput.length} / 4000</span>
                            <button
                                onClick={handleAddComment}
                                disabled={sending || commentInput.trim().length < 2}
                                className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                            >
                                {sending ? "Envoi…" : "Publier"}
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}