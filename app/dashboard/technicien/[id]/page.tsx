// app/dashboard/technicien/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type UserMin = { id: number; prenom: string; nom: string };
type Ticket = {
  id: number;
  description: string;
  type: "ASSISTANCE" | "INTERVENTION";
  statut: "OPEN" | "IN_PROGRESS" | "CLOSED";
  dateCreation: string;
  createdBy: UserMin;
  assignedTo?: UserMin | null;
};
type PieceJointe = { id: number; nomFichier: string; url: string };

type CommentItem = {
  id: number;
  contenu: string;
  createdAt: string;
  auteur: { id: number; prenom: string; nom: string };
};

export default function TechTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; role: string } | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [pjs, setPjs] = useState<PieceJointe[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingPj, setLoadingPj] = useState(false);

  // Helpers UI (pas de hooks)
  const StatusPill = ({ statut }: { statut: Ticket["statut"] }) => {
    const map = {
      OPEN: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", label: "Ouvert" },
      IN_PROGRESS: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", label: "En cours" },
      CLOSED: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", label: "Clôturé" },
    }[statut];
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${map.bg} ${map.text} border ${map.border}`}>
        {map.label}
      </span>
    );
  };
  const TypeTag = ({ type }: { type: Ticket["type"] }) => {
    const map = {
      ASSISTANCE: { bg: "bg-blue-50", text: "text-blue-700", label: "Assistance" },
      INTERVENTION: { bg: "bg-purple-50", text: "text-purple-700", label: "Intervention" },
    }[type];
    return <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${map.bg} ${map.text}`}>{map.label}</span>;
  };

  // Auth + rôle TECHNICIEN
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "TECHNICIEN") { alert("Accès refusé !"); router.push("/login"); return; }
      setUser(payload);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const fetchTicketAndPj = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/technicien/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Ticket introuvable");
        router.push("/dashboard/technicien");
        return;
      }
      setTicket(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }

    try {
      setLoadingPj(true);
      const pjRes = await fetch(`/api/tickets/${id}/pieces-jointes`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const pjData = await pjRes.json();
      setPjs(Array.isArray(pjData) ? pjData : []);
    } catch (e) {
      console.error(e);
      setPjs([]);
    } finally {
      setLoadingPj(false);
    }

    try {
      const cRes = await fetch(`/api/tickets/${id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const cData = await cRes.json();
      setComments(Array.isArray(cData) ? cData : []);
    } catch (e) {
      console.error(e);
      setComments([]);
    }
  }, [id, router]);

  useEffect(() => { fetchTicketAndPj(); }, [fetchTicketAndPj]);

  const handleStatusChange = async (newStatus: Ticket["statut"]) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/technicien/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statut: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Erreur statut"); return; }
      setTicket(data);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  const handleAddComment = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const contenu = commentInput.trim();
    if (contenu.length < 2) return alert("Commentaire trop court");

    setSending(true);
    const tempId = -Math.floor(Math.random() * 1e9);
    const optimistic: CommentItem = {
      id: tempId,
      contenu,
      createdAt: new Date().toISOString(),
      auteur: { id: user!.id, prenom: "Vous", nom: "" },
    };
    setComments(prev => [...prev, optimistic]);
    setCommentInput("");

    try {
      const res = await fetch(`/api/tickets/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contenu }),
      });
      const data = await res.json();
      if (!res.ok) {
        setComments(prev => prev.filter(c => c.id !== tempId));
        alert(data.error || "Erreur lors de l’ajout du commentaire");
        return;
      }
      setComments(prev => prev.map(c => (c.id === tempId ? data : c)));
    } catch (e) {
      console.error(e);
      setComments(prev => prev.filter(c => c.id !== tempId));
      alert("Erreur réseau");
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Chargement…</p>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Chargement du ticket…</p>
        </div>
      </div>
    );
  }
  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <p className="text-center text-red-600">Ticket introuvable.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header aligné */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/60 shadow-sm">
        <div className="mx-auto max-w-[1600px] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/cds.png" alt="CDS Logo" className="h-10 w-auto" />
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">Ticket #{ticket.id}</h1>
              <p className="text-xs text-slate-500">
                Créé le {new Date(ticket.dateCreation).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/technicien"
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              ← Retour
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[.98] shadow-sm transition-all"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] w-full px-6 pt-6 pb-10 grid gap-4 md:grid-cols-3">
        {/* Colonne gauche : détails + PJ + commentaires */}
        <section className="md:col-span-2 space-y-4">
          {/* Détails */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TypeTag type={ticket.type} />
                <StatusPill statut={ticket.statut} />
              </div>
              <span className="text-xs text-slate-500 font-mono">#{ticket.id}</span>
            </div>
            <p className="mt-3 text-slate-800 whitespace-pre-wrap">{ticket.description}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5">
                Créé par {ticket.createdBy.prenom} {ticket.createdBy.nom}
              </span>
              {ticket.assignedTo && (
                <span className="rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5">
                  Assigné à {ticket.assignedTo.prenom} {ticket.assignedTo.nom}
                </span>
              )}
            </div>
          </div>

          {/* Pièces jointes */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Pièces jointes</h3>
              <button
                onClick={fetchTicketAndPj}
                className="text-xs rounded-md border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50 transition-colors"
              >
                Rafraîchir
              </button>
            </div>

            {loadingPj && <div className="mt-2 text-xs text-slate-500">Chargement…</div>}

            {!loadingPj && pjs.length === 0 && (
              <div className="mt-2 text-sm text-slate-500 border-2 border-dashed border-slate-200 rounded-lg p-4">
                Aucune pièce jointe.
              </div>
            )}

            {!loadingPj && pjs.length > 0 && (
              <ul className="mt-3 space-y-1">
                {pjs.map((f) => (
                  <li key={f.id}>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-700 hover:text-blue-800 hover:underline break-all"
                      title={f.nomFichier}
                    >
                       {f.nomFichier}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Commentaires */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Commentaires</h3>
              <button
                onClick={fetchTicketAndPj}
                className="text-xs rounded-md border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50 transition-colors"
              >
                Rafraîchir
              </button>
            </div>

            {comments.length === 0 ? (
              <div className="mt-2 text-sm text-slate-500">Aucun commentaire.</div>
            ) : (
              <ul className="mt-3 space-y-2">
                {comments.map((c) => (
                  <li key={c.id} className="rounded-md border border-slate-200 px-3 py-2">
                    <div className="text-xs text-slate-500">
                      {new Date(c.createdAt).toLocaleString()} — {c.auteur.prenom} {c.auteur.nom}
                    </div>
                    <div className="text-sm whitespace-pre-wrap text-slate-800">{c.contenu}</div>
                  </li>
                ))}
              </ul>
            )}

            {/* Formulaire */}
            <div className="mt-3">
              <label className="text-xs text-slate-600">Ajouter un commentaire</label>
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="mt-1 w-full min-h-[90px] border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                placeholder="Ex.: Diagnostic, étapes réalisées, suites prévues…"
                maxLength={4000}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">{commentInput.length} / 4000</span>
                <button
                  onClick={handleAddComment}
                  disabled={sending || commentInput.trim().length < 2}
                  className="px-3 py-2 text-sm font-medium rounded-md bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 shadow-sm transition-all"
                >
                  {sending ? "Envoi…" : "Publier"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Colonne droite : actions */}
        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">Actions</h3>
            <div className="mt-3 grid gap-2">
              <label className="text-xs text-slate-600">Changer le statut</label>
              <select
                value={ticket.statut}
                onChange={(e) => handleStatusChange(e.target.value as Ticket["statut"])}
                className="border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              >
                <option value="OPEN">Ouvert</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="CLOSED">Clôturé</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">Navigation</h3>
            <div className="mt-3 grid gap-2">
              <Link
                href={`/dashboard/technicien/${ticket.id}`}
                className="text-center px-3 py-2 text-sm font-medium rounded-md bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm"
              >
                Actualiser la page
              </Link>
              <Link
                href="/dashboard/technicien"
                className="text-center px-3 py-2 text-sm font-medium rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm"
              >
                Retour à la liste →
              </Link>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
