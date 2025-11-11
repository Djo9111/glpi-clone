// app/dashboard/technicien/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Send, FileText, MessageSquare, Settings, PlayCircle, CheckCircle2, XCircle } from "lucide-react";

type UserMin = { id: number; prenom: string; nom: string };
type Ticket = {
  id: number;
  description: string;
  type: "ASSISTANCE" | "INTERVENTION";
  statut: "OPEN" | "IN_PROGRESS" | "A_CLOTURER" | "REJETE" | "TRANSFERE_MANTIS" | "CLOSED";
  dateCreation: string;
  createdBy: UserMin;
  assignedTo?: UserMin | null;
  application?: { id: number; nom: string } | null;
  materiel?: { id: number; nom: string } | null;
  departement?: { id: number; nom: string } | null;
  mantisNumero?: string | null; // ✅ ajouté
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

  // ✅ champs mantis
  const [mantisNumeroInput, setMantisNumeroInput] = useState<string>("");
  // logout
  const [loggingOut, setLoggingOut] = useState(false);

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
      setMantisNumeroInput(data?.mantisNumero ?? ""); // ✅ init input
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

  const patchTicket = async (payload: Record<string, any>) => {
    const token = localStorage.getItem("token");
    if (!token) return { ok: false, data: null };
    const res = await fetch(`/api/technicien/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  };

  const handleStatusChange = async (newStatus: Ticket["statut"]) => {
    if (newStatus === "TRANSFERE_MANTIS") {
      // ✅ demander le numéro si manquant
      let numero = mantisNumeroInput.trim();
      if (!numero) {
        numero = window.prompt("Numéro mantis requis :", "")?.trim() || "";
      }
      if (!numero) {
        alert("Numéro mantis requis pour transférer.");
        return;
      }
      const { ok, data } = await patchTicket({ statut: "TRANSFER_MANTIS", mantisNumero: numero });
      if (!ok) { alert(data?.error || "Erreur statut"); return; }
      setTicket(data);
      setMantisNumeroInput(data?.mantisNumero ?? numero);
      alert("Ticket transféré à mantis !");
      return;
    }

    const { ok, data } = await patchTicket({ statut: newStatus });
    if (!ok) { alert(data?.error || "Erreur statut"); return; }
    setTicket(data);
    alert("Statut mis à jour !");
  };

  const handleSavemantis = async () => {
    const numero = mantisNumeroInput.trim();
    if (!numero) { alert("Veuillez saisir un numéro mantis."); return; }
    // Si le ticket n'est pas transféré, on transfère en même temps
    const payload =
      ticket?.statut === "TRANSFERE_MANTIS"
        ? { mantisNumero: numero }
        : { statut: "TRANSFERE_MANTIS", mantisNumero: numero };

    const { ok, data } = await patchTicket(payload);
    if (!ok) { alert(data?.error || "Impossible d’enregistrer le numéro mantis"); return; }
    setTicket(data);
    setMantisNumeroInput(data?.mantisNumero ?? numero);
    alert("Numéro mantis enregistré !");
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
        alert(data.error || "Erreur lors de l'ajout du commentaire");
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

  const handleLogout = async () => {
    setLoggingOut(true);

    // Petit délai pour montrer le feedback visuel
    await new Promise(resolve => setTimeout(resolve, 500));

    localStorage.removeItem("token");
    router.push("/login");
  };

  const StatusBadge = ({ status }: { status: Ticket["statut"] }) => {
    const config = {
      OPEN: { label: "Ouvert", className: "bg-amber-100 text-amber-800 border-amber-200" },
      IN_PROGRESS: { label: "En cours", className: "bg-blue-100 text-blue-800 border-blue-200" },
      A_CLOTURER: { label: "À clôturer", className: "bg-violet-100 text-violet-800 border-violet-200" },
      REJETE: { label: "Rejeté", className: "bg-rose-100 text-rose-800 border-rose-200" },
      TRANSFERE_MANTIS: { label: "Transféré", className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
      CLOSED: { label: "Clôturé", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    };

    const { label, className } = (config as any)[status];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${className}`}>
        {label}
      </span>
    );
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 font-medium">Ticket introuvable</p>
          <Link href="/dashboard/technicien" className="text-blue-600 hover:underline mt-2 inline-block">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/cds.png" alt="CDS" className="h-8 w-auto" />
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Détail du Ticket</h1>
              <p className="text-sm text-slate-500">Ticket #{ticket.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/technicien"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs md:text-sm font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loggingOut ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-600"></div>
                  Déconnexion...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Déconnexion
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="mx-auto max-w-7xl w-full px-6 py-6 grid gap-6 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carte principale du ticket */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticket.type === "ASSISTANCE"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                      }`}>
                      {ticket.type === "ASSISTANCE" ? "Assistance" : "Intervention"}
                    </span>
                    <StatusBadge status={ticket.statut} />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    {ticket.description}
                  </h2>
                </div>
              </div>

              {/* Métadonnées */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Créé par: {ticket.createdBy.prenom} {ticket.createdBy.nom}
                </span>
                {ticket.assignedTo && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    Assigné à: {ticket.assignedTo.prenom} {ticket.assignedTo.nom}
                  </span>
                )}
                {ticket.application?.nom && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    App: {ticket.application.nom}
                  </span>
                )}
                {ticket.materiel?.nom && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                    Matériel: {ticket.materiel.nom}
                  </span>
                )}
                {ticket.departement?.nom && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    Dépt: {ticket.departement.nom}
                  </span>
                )}
                {ticket.mantisNumero && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                    mantis: <span className="ml-1 font-mono">{ticket.mantisNumero}</span>
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500">
                Créé le {new Date(ticket.dateCreation).toLocaleString("fr-FR")}
              </div>
            </div>
          </div>

          {/* Pièces jointes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-600" />
                <h3 className="text-base font-semibold text-slate-900">Pièces jointes</h3>
              </div>
              <button
                onClick={fetchTicketAndPj}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Rafraîchir
              </button>
            </div>

            <div className="p-6">
              {loadingPj && <div className="text-sm text-slate-500">Chargement…</div>}

              {!loadingPj && pjs.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Aucune pièce jointe</p>
                </div>
              )}

              {!loadingPj && pjs.length > 0 && (
                <ul className="space-y-2">
                  {pjs.map((f) => (
                    <li key={f.id} className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                      <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline truncate flex-1"
                        title={f.nomFichier}
                      >
                        {f.nomFichier}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Commentaires */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-slate-600" />
                <h3 className="text-base font-semibold text-slate-900">Commentaires</h3>
                <span className="text-xs text-slate-500">({comments.length})</span>
              </div>
              <button
                onClick={fetchTicketAndPj}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Rafraîchir
              </button>
            </div>

            <div className="p-6">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Aucun commentaire</p>
                </div>
              ) : (
                <ul className="space-y-3 mb-6">
                  {comments.map((c) => (
                    <li key={c.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-900">
                          {c.auteur.prenom} {c.auteur.nom}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(c.createdAt).toLocaleString("fr-FR")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.contenu}</p>
                    </li>
                  ))}
                </ul>
              )}

              {/* Formulaire d'ajout */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Ajouter un commentaire
                </label>
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="w-full min-h-[120px] border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Ex: Diagnostic, étapes réalisées, suites prévues…"
                  maxLength={4000}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{commentInput.length} / 4000</span>
                  <button
                    onClick={handleAddComment}
                    disabled={sending || commentInput.trim().length < 2}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    {sending ? "Envoi…" : "Publier"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne latérale - Actions */}
        <aside className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-slate-600" />
                <h3 className="text-base font-semibold text-slate-900">Gestion</h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Changer le statut
                </label>
                <select
                  value={ticket.statut}
                  onChange={(e) => handleStatusChange(e.target.value as Ticket["statut"])}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="OPEN">Ouvert</option>
                  <option value="IN_PROGRESS">En cours</option>
                  <option value="A_CLOTURER">À clôturer</option>
                  <option value="REJETE">Rejeté</option>
                  <option value="TRANSFERE_mantis">Transféré mantis</option>
                  <option value="CLOSED">Clôturé</option>
                </select>
              </div>

              {/* Section mantis dans la sidebar */}
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 space-y-3">
                <p className="text-sm font-medium text-indigo-800">
                  Numéro mantis {ticket.statut === "TRANSFERE_MANTIS" ? "(obligatoire)" : "(optionnel)"}
                </p>
                <input
                  value={mantisNumeroInput}
                  onChange={(e) => setMantisNumeroInput(e.target.value)}
                  placeholder="Ex: MNT-2025-000123"
                  className="w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSavemantis}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    {ticket.statut === "TRANSFERE_MANTIS" ? "Mettre à jour" : "Transférer + Enregistrer"}
                  </button>
                </div>
              </div>

              {/* Actions rapides */}
              <div className="pt-2">
                <p className="text-sm font-medium text-slate-700 mb-3">Actions rapides</p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleStatusChange("IN_PROGRESS")}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Marquer en cours
                  </button>
                  <button
                    onClick={() => handleStatusChange("A_CLOTURER")}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    À clôturer
                  </button>
                  <button
                    onClick={() => handleStatusChange("CLOSED")}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Clôturer
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Raccourcis */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Raccourcis</h3>
            <div className="space-y-2">
              <button
                onClick={fetchTicketAndPj}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </button>
              <Link
                href="/dashboard/technicien"
                className="block text-center px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
              >
                Liste des tickets
              </Link>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
