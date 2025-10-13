// app/dashboard/admin-tickets/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/app/components/NotificationBell";
import { Eye, X, Clock, CheckCircle2, AlertCircle, XCircle, Send, Archive } from "lucide-react";

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
  createdBy: { id: number; prenom: string; nom: string };
  assignedTo?: { id: number; prenom: string; nom: string } | null;
  application?: { id: number; nom: string } | null;
  materiel?: { id: number; nom: string } | null;
};

type Technicien = { id: number; prenom: string; nom: string };
type PieceJointe = { id: number; nomFichier: string; url: string };

/* ==========================================
   Helpers statut
   ========================================== */
function statusLabel(s: Ticket["statut"]): string {
  switch (s) {
    case "OPEN":
      return "Ouvert";
    case "IN_PROGRESS":
      return "En cours";
    case "A_CLOTURER":
      return "À clôturer";
    case "REJETE":
      return "Rejeté";
    case "TRANSFERE_MANTICE":
      return "Transféré MANTICE";
    case "CLOSED":
      return "Clôturé";
    default:
      return String(s);
  }
}

function normalizeStatus(s: unknown): Ticket["statut"] {
  if (typeof s !== "string") return "OPEN";
  const k = s.trim().toLowerCase();

  if (k === "open") return "OPEN";
  if (k === "in_progress" || k === "in-progress") return "IN_PROGRESS";
  if (
    k === "a_cloturer" ||
    k === "a-cloturer" ||
    k === "à_clôturer" ||
    k === "à-clôturer"
  )
    return "A_CLOTURER";
  if (k === "rejete" || k === "rejeté") return "REJETE";
  if (
    k === "transfere_mantice" ||
    k === "transfère_mantice" ||
    k === "transfere-mantice"
  )
    return "TRANSFERE_MANTICE";
  if (k === "closed" || k === "close") return "CLOSED";

  if (
    k === "en_attente" ||
    k === "en-attente" ||
    k === "attente" ||
    k === "nouveau"
  )
    return "OPEN";
  if (k === "en_cours" || k === "en-cours" || k === "traitement")
    return "IN_PROGRESS";
  if (k === "a_cloturer" || k === "à_clôturer") return "A_CLOTURER";
  if (k === "rejete" || k === "rejeté") return "REJETE";
  if (k === "transfere_mantice" || k === "transféré_mantice")
    return "TRANSFERE_MANTICE";
  if (
    k === "resolu" ||
    k === "résolu" ||
    k === "cloture" ||
    k === "clôturé"
  )
    return "CLOSED";

  return "OPEN";
}

function normalizeTicket(raw: any): Ticket {
  return {
    id: Number(raw.id),
    description: String(raw.description ?? ""),
    type: raw.type === "INTERVENTION" ? "INTERVENTION" : "ASSISTANCE",
    statut: normalizeStatus(raw.statut ?? raw.status),
    createdBy: {
      id: Number(raw.createdBy?.id ?? 0),
      prenom: String(raw.createdBy?.prenom ?? ""),
      nom: String(raw.createdBy?.nom ?? ""),
    },
    assignedTo: raw.assignedTo
      ? {
          id: Number(raw.assignedTo.id),
          prenom: String(raw.assignedTo.prenom ?? ""),
          nom: String(raw.assignedTo.nom ?? ""),
        }
      : null,
    application: raw.application
      ? { id: Number(raw.application.id), nom: String(raw.application.nom ?? "") }
      : null,
    materiel: raw.materiel
      ? { id: Number(raw.materiel.id), nom: String(raw.materiel.nom ?? "") }
      : null,
  };
}

/* ==========================================
   Composant principal
   ========================================== */
export default function AdminTicketsDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; role: string } | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "CHEF_DSI") {
        alert("Accès refusé !");
        router.push("/login");
        return;
      }
      setUser(payload);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const [ticketsRes, techsRes] = await Promise.all([
        fetch("/api/admin/tickets", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
        fetch("/api/admin/techniciens", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
      ]);
      const [ticketsData, techsData] = await Promise.all([
        ticketsRes.json(),
        techsRes.json(),
      ]);
      const list = Array.isArray(ticketsData)
        ? ticketsData.map(normalizeTicket)
        : [];
      setTickets(list);
      setTechniciens(Array.isArray(techsData) ? techsData : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssign = async (ticketId: number, technicienId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assignedToId: technicienId }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(`Erreur : ${data.error}`);
        return;
      }

      const updatedTicket = normalizeTicket(await res.json());
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updatedTicket : t)));
      setActiveTicket((prev) => (prev && prev.id === ticketId ? updatedTicket : prev));
      alert("Technicien assigné !");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'assignation");
    }
  };

  const handleStatusChange = async (
    ticketId: number,
    newStatus: Ticket["statut"]
  ) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statut: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(`Erreur : ${data.error}`);
        return;
      }

      const updatedTicket = normalizeTicket(await res.json());
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updatedTicket : t)));
      setActiveTicket((prev) => (prev && prev.id === ticketId ? updatedTicket : prev));
      alert("Statut mis à jour !");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la mise à jour du statut");
    }
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
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveTicket(null);
  };

  const StatusOptions: Ticket["statut"][] = [
    "OPEN",
    "IN_PROGRESS",
    "A_CLOTURER",
    "REJETE",
    "TRANSFERE_MANTICE",
    "CLOSED",
  ];

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/cds.png" alt="CDS" className="h-8 w-auto" />
            <div className="h-6 w-px bg-slate-200" />
            <h1 className="text-lg font-semibold text-slate-900">Gestion des Tickets</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link
              href="/dashboard/admin"
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Créer utilisateur
            </Link>
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
            icon={<AlertCircle className="h-5 w-5" />}
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
            <h2 className="text-base font-semibold text-slate-900">Tous les tickets</h2>
            <p className="text-sm text-slate-500 mt-1">
              {tickets.length} ticket{tickets.length > 1 ? 's' : ''} au total
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
                    Assigné à
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
                      Aucun ticket disponible
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
                      {ticket.assignedTo ? (
                        <span className="text-sm text-slate-700">
                          {ticket.assignedTo.prenom} {ticket.assignedTo.nom}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Non assigné</span>
                      )}
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
            </div>

            {/* Gestion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assigner un technicien
                </label>
                <select
                  onChange={(e) => handleAssign(activeTicket.id, parseInt(e.target.value))}
                  value={activeTicket.assignedTo?.id || ""}
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
            </div>

            {/* Pièces jointes */}
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-3">Pièces jointes</h4>
              <AttachmentList ticketId={activeTicket.id} />
            </div>

            {/* Lien page complète */}
            <div className="pt-4 border-t border-slate-200">
              <Link
                href={`/dashboard/admin-tickets/${activeTicket.id}`}
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

  const { label, className } = config[status];
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