// app/dashboard/technicien/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/app/components/NotificationBell";
import { Eye, X, Clock, CheckCircle2, AlertCircle, XCircle, Send, Archive, PlayCircle, CheckCheck } from "lucide-react";

/* ==========================================
   Types
   ========================================== */
type Ticket = {
  id: number;
  description: string;
  type: "ASSISTANCE" | "INTERVENTION";
  statut:
    | "OPEN"
    | "IN_PROGRESS"
    | "A_CLOTURER"
    | "REJETE"
    | "TRANSFERE_MANTICE"
    | "CLOSED";
  dateCreation?: string;
  createdBy: { id: number; prenom: string; nom: string };
  assignedTo?: { id: number; prenom: string; nom: string } | null;
  application?: { id: number; nom: string } | null;
  materiel?: { id: number; nom: string } | null;
  manticeNumero?: string | null;  // ✅ ajouté
};

type PieceJointe = { id: number; nomFichier: string; url: string };

/* ==========================================
   Helpers statuts
   ========================================== */
function statusLabel(s: Ticket["statut"]): string {
  switch (s) {
    case "OPEN": return "Ouvert";
    case "IN_PROGRESS": return "En cours";
    case "A_CLOTURER": return "À clôturer";
    case "REJETE": return "Rejeté";
    case "TRANSFERE_MANTICE": return "Transféré MANTICE";
    case "CLOSED": return "Clôturé";
    default: return String(s);
  }
}

function normalizeStatus(s: unknown): Ticket["statut"] {
  if (typeof s !== "string") return "OPEN";
  const k = s.trim().toLowerCase();

  if (k === "open") return "OPEN";
  if (k === "in_progress" || k === "in-progress") return "IN_PROGRESS";
  if (k === "a_cloturer" || k === "a-cloturer" || k === "à_clôturer" || k === "à-cloturer") return "A_CLOTURER";
  if (k === "rejete" || k === "rejeté") return "REJETE";
  if (k === "transfere_mantice" || k === "transfère_mantice" || k === "transfere-mantice") return "TRANSFERE_MANTICE";
  if (k === "closed" || k === "close") return "CLOSED";

  if (k === "en_attente" || k === "en-attente" || k === "attente" || k === "nouveau") return "OPEN";
  if (k === "en_cours" || k === "en-cours" || k === "traitement") return "IN_PROGRESS";
  if (k === "resolu" || k === "résolu" || k === "cloture" || k === "clôturé") return "CLOSED";

  return "OPEN";
}

function normalizeTicket(raw: any): Ticket {
  return {
    id: Number(raw.id),
    description: String(raw.description ?? ""),
    type: (raw.type === "INTERVENTION" ? "INTERVENTION" : "ASSISTANCE"),
    statut: normalizeStatus(raw.statut ?? raw.status),
    dateCreation: String(raw.dateCreation ?? raw.createdAt ?? new Date().toISOString()),
    createdBy: {
      id: Number(raw.createdBy?.id ?? 0),
      prenom: String(raw.createdBy?.prenom ?? ""),
      nom: String(raw.createdBy?.nom ?? ""),
    },
    assignedTo: raw.assignedTo
      ? { id: Number(raw.assignedTo.id), prenom: String(raw.assignedTo.prenom ?? ""), nom: String(raw.assignedTo.nom ?? "") }
      : null,
    application: raw.application ? { id: Number(raw.application.id), nom: String(raw.application.nom ?? "") } : null,
    materiel: raw.materiel ? { id: Number(raw.materiel.id), nom: String(raw.materiel.nom ?? "") } : null,
    manticeNumero: raw.manticeNumero ?? null, // ✅ ajouté
  };
}

/* ==========================================
   Composant principal
   ========================================== */
export default function TechnicianTicketsDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; prenom: string; nom: string; role: string } | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [manticeNumeroInput, setManticeNumeroInput] = useState<string>("");   // ✅ input modal
  const [showManticeInput, setShowManticeInput] = useState<boolean>(false);   // ✅ affichage conditionnel

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "TECHNICIEN") {
        alert("Accès refusé !");
        router.push("/login");
        return;
      }
      setUser(payload);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const fetchTickets = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/technicien/tickets", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Erreur récupération des tickets");
        return;
      }
      const list = Array.isArray(data) ? data.map(normalizeTicket) : [];
      setTickets(list);
    } catch (e) {
      console.error(e);
      alert("Erreur récupération des tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchTickets();
  }, [user, fetchTickets]);

  // ✅ centralise la MAJ locale après un update
  const applyUpdatedTicket = (updated: any) => {
    const normalized = normalizeTicket(updated);
    setTickets((prev) => prev.map((t) => (t.id === normalized.id ? normalized : t)));
    setActiveTicket((prev) => (prev && prev.id === normalized.id ? normalized : prev));
  };

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

  const handleStatusChange = async (ticketId: number, newStatus: Ticket["statut"]) => {
    // Cas spécifique Mantice : si aucun numéro connu, on affiche l'input et on ne PATCH que quand l’utilisateur valide
    if (newStatus === "TRANSFERE_MANTICE") {
      setShowManticeInput(true);
      if (activeTicket?.manticeNumero) {
        // S'il y a déjà un numéro, on tente directement
        const { ok, data } = await patchTicket(ticketId, { statut: "TRANSFERE_MANTICE", manticeNumero: activeTicket.manticeNumero });
        if (!ok) {
          alert(data?.error || "Erreur mise à jour du statut");
          return;
        }
        applyUpdatedTicket(data);
        alert("Ticket transféré à MANTICE !");
      } else {
        // Laisse l’utilisateur saisir puis cliquer sur “Valider Mantice”
        alert("Veuillez renseigner le numéro Mantice puis valider.");
      }
      return;
    }

    const { ok, data } = await patchTicket(ticketId, { statut: newStatus });
    if (!ok) {
      alert(data?.error || "Erreur mise à jour du statut");
      return;
    }
    applyUpdatedTicket(data);
    alert("Statut mis à jour !");
  };

  // ✅ enregistrer / modifier le numéro Mantice (avec transfert si nécessaire)
  const handleSaveMantice = async () => {
    if (!activeTicket) return;
    const numero = manticeNumeroInput.trim();
    if (!numero) {
      alert("Veuillez saisir un numéro Mantice.");
      return;
    }
    // Si pas encore transféré → on transfère + pose le numéro
    const payload =
      activeTicket.statut === "TRANSFERE_MANTICE"
        ? { manticeNumero: numero }
        : { statut: "TRANSFERE_MANTICE", manticeNumero: numero };

    const { ok, data } = await patchTicket(activeTicket.id, payload);
    if (!ok) {
      alert(data?.error || "Impossible d’enregistrer le numéro Mantice");
      return;
    }
    applyUpdatedTicket(data);
    alert("Numéro Mantice enregistré !");
    setShowManticeInput(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const stats = useMemo(() => ({
    OPEN: tickets.filter((t) => t.statut === "OPEN").length,
    IN_PROGRESS: tickets.filter((t) => t.statut === "IN_PROGRESS").length,
    A_CLOTURER: tickets.filter((t) => t.statut === "A_CLOTURER").length,
    REJETE: tickets.filter((t) => t.statut === "REJETE").length,
    TRANSFERE_MANTICE: tickets.filter((t) => t.statut === "TRANSFERE_MANTICE").length,
    CLOSED: tickets.filter((t) => t.statut === "CLOSED").length,
  }), [tickets]);

  const openModal = (t: Ticket) => {
    setActiveTicket(t);
    setManticeNumeroInput(t.manticeNumero ?? "");           // ✅ init input
    setShowManticeInput(t.statut === "TRANSFERE_MANTICE");  // ✅ si déjà transféré → montrer l’input
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveTicket(null);
    setManticeNumeroInput("");
    setShowManticeInput(false);
  };

  const StatusOptions: Ticket["statut"][] = [
    "OPEN",
    "IN_PROGRESS",
    "A_CLOTURER",
    "REJETE",
    "TRANSFERE_MANTICE",
    "CLOSED",
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Chargement…</p>
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
              <h1 className="text-lg font-semibold text-slate-900">Mes Tickets</h1>
              <p className="text-sm text-slate-500">{user.prenom} {user.nom}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              onClick={fetchTickets}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {loading ? "Chargement..." : "Rafraîchir"}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl w-full px-6 py-6 space-y-6">
        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Ouverts"
            count={stats.OPEN}
            icon={<Clock className="h-5 w-5" />}
            color="bg-amber-500"
            bgColor="bg-amber-50"
            textColor="text-amber-700"
          />
          <StatCard
            label="En cours"
            count={stats.IN_PROGRESS}
            icon={<PlayCircle className="h-5 w-5" />}
            color="bg-blue-500"
            bgColor="bg-blue-50"
            textColor="text-blue-700"
          />
          <StatCard
            label="À clôturer"
            count={stats.A_CLOTURER}
            icon={<CheckCircle2 className="h-5 w-5" />}
            color="bg-violet-500"
            bgColor="bg-violet-50"
            textColor="text-violet-700"
          />
          <StatCard
            label="Rejetés"
            count={stats.REJETE}
            icon={<XCircle className="h-5 w-5" />}
            color="bg-rose-500"
            bgColor="bg-rose-50"
            textColor="text-rose-700"
          />
          <StatCard
            label="Transférés"
            count={stats.TRANSFERE_MANTICE}
            icon={<Send className="h-5 w-5" />}
            color="bg-indigo-500"
            bgColor="bg-indigo-50"
            textColor="text-indigo-700"
          />
          <StatCard
            label="Clôturés"
            count={stats.CLOSED}
            icon={<Archive className="h-5 w-5" />}
            color="bg-emerald-500"
            bgColor="bg-emerald-50"
            textColor="text-emerald-700"
          />
        </div>

        {/* Liste des tickets */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Tous mes tickets</h2>
            <p className="text-sm text-slate-500 mt-1">
              {tickets.length} ticket{tickets.length > 1 ? 's' : ''} assigné{tickets.length > 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
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
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                      Aucun ticket assigné
                    </td>
                  </tr>
                )}
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-medium text-slate-900">
                        #{ticket.id}
                      </span>
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
                        {ticket.manticeNumero && ( // ✅ affichage rapide
                          <p className="text-xs text-indigo-700 mt-1">MANTICE: {ticket.manticeNumero}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ticket.type === "ASSISTANCE"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
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
                        onClick={() => openModal(ticket)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal */}
      {modalOpen && activeTicket && (
        <Modal onClose={closeModal} title={`Ticket #${activeTicket.id}`}>
          <div className="space-y-6">
            {/* En-tête ticket */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-slate-900">
                {activeTicket.description || "(Sans titre)"}
              </h3>
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  activeTicket.type === "ASSISTANCE"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-purple-100 text-purple-800"
                }`}>
                  {activeTicket.type === "ASSISTANCE" ? "Assistance" : "Intervention"}
                </span>
                {activeTicket.application?.nom && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    App: {activeTicket.application.nom}
                  </span>
                )}
                {activeTicket.materiel?.nom && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    Matériel: {activeTicket.materiel.nom}
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-600">
                <p>Créé par: <span className="font-medium">{activeTicket.createdBy.prenom} {activeTicket.createdBy.nom}</span></p>
                {activeTicket.assignedTo && (
                  <p>Assigné à: <span className="font-medium">{activeTicket.assignedTo.prenom} {activeTicket.assignedTo.nom}</span></p>
                )}
                {activeTicket.manticeNumero && (
                  <p className="mt-1 text-indigo-700">MANTICE: <span className="font-mono">{activeTicket.manticeNumero}</span></p>
                )}
              </div>
            </div>

            {/* Changement de statut */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Changer le statut
              </label>
              <select
                onChange={(e) =>
                  handleStatusChange(
                    activeTicket.id,
                    e.target.value as Ticket["statut"]
                  )
                }
                value={activeTicket.statut}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                {StatusOptions.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Mantice (affichée si transféré ou si l’utilisateur a choisi ce statut) */}
            {(showManticeInput || activeTicket.statut === "TRANSFERE_MANTICE") && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 space-y-3">
                <p className="text-sm font-medium text-indigo-800">
                  Numéro MANTICE (obligatoire si “Transféré MANTICE”)
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
                  {activeTicket.manticeNumero && (
                    <span className="text-xs text-indigo-700">
                      Actuel: <span className="font-mono">{activeTicket.manticeNumero}</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Actions rapides */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Actions rapides</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleStatusChange(activeTicket.id, "IN_PROGRESS")}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <PlayCircle className="h-4 w-4" />
                  Marquer en cours
                </button>
                <button
                  onClick={() => handleStatusChange(activeTicket.id, "A_CLOTURER")}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  À clôturer
                </button>
                <button
                  onClick={() => {
                    setShowManticeInput(true);
                    if (!activeTicket.manticeNumero) {
                      alert("Saisissez le numéro Mantice puis cliquez sur “Valider Mantice”.");
                    } else {
                      handleStatusChange(activeTicket.id, "TRANSFERE_MANTICE");
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Transférer MANTICE
                </button>
                <button
                  onClick={() => handleStatusChange(activeTicket.id, "CLOSED")}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  <CheckCheck className="h-4 w-4" />
                  Clôturer
                </button>
              </div>
            </div>

            {/* Pièces jointes */}
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-3">Pièces jointes</h4>
              <AttachmentList ticketId={activeTicket.id} />
            </div>

            {/* Lien page complète */}
            <div className="pt-4 border-t border-slate-200">
              <Link
                href={`/dashboard/technicien/${activeTicket.id}`}
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Ouvrir la page complète
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ==========================================
   Composants auxiliaires
   ========================================== */
function StatCard({
  label,
  count,
  icon,
  color,
  bgColor,
  textColor,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  textColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-xl p-4 border border-slate-200`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`${color} text-white p-2 rounded-lg`}>
          {icon}
        </div>
      </div>
      <div className="mt-2">
        <p className={`text-2xl font-bold ${textColor}`}>{count}</p>
        <p className="text-sm text-slate-600 mt-1">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Ticket["statut"] }) {
  const config = {
    OPEN: { label: "Ouvert", className: "bg-amber-100 text-amber-800" },
    IN_PROGRESS: { label: "En cours", className: "bg-blue-100 text-blue-800" },
    A_CLOTURER: { label: "À clôturer", className: "bg-violet-100 text-violet-800" },
    REJETE: { label: "Rejeté", className: "bg-rose-100 text-rose-800" },
    TRANSFERE_MANTICE: { label: "Transféré", className: "bg-indigo-100 text-indigo-800" },
    CLOSED: { label: "Clôturé", className: "bg-emerald-100 text-emerald-800" },
  };

  const { label, className } = (config as any)[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function AttachmentList({ ticketId }: { ticketId: number }) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<PieceJointe[]>([]);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/tickets/${ticketId}/pieces-jointes`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
      setLoadedOnce(true);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (!loadedOnce) load();
  }, [loadedOnce, load]);

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
      {loading && <div className="text-sm text-slate-500">Chargement…</div>}
      {!loading && list.length === 0 && (
        <div className="text-sm text-slate-500">Aucune pièce jointe</div>
      )}
      {!loading && list.length > 0 && (
        <ul className="space-y-2">
          {list.map((f) => (
            <li key={f.id}>
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline break-all"
                title={f.nomFichier}
              >
                📎 {f.nomFichier}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
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
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="px-6 py-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
