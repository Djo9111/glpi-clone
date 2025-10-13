"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/app/components/NotificationBell";

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
  application?: { id: number; nom: string } | null; // NEW
  materiel?: { id: number; nom: string } | null;    // NEW
};

type PieceJointe = { id: number; nomFichier: string; url: string };

export default function TechnicianTicketsDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; prenom: string; nom: string; role: string } | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const StatusPill = ({ statut }: { statut: Ticket["statut"] }) => {
    const map = {
      OPEN: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", label: "Ouvert" },
      IN_PROGRESS: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", label: "En cours" },
      A_CLOTURER: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", label: "À clôturer" },
      REJETE: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", label: "Rejeté" },
      TRANSFERE_MANTICE: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", label: "Transféré MANTICE" },
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

  const SubTag = ({ t }: { t: Ticket }) => {
    const isApp = t.type === "ASSISTANCE" && t.application?.nom;
    const isMat = t.type === "INTERVENTION" && t.materiel?.nom;
    if (!isApp && !isMat) return null;
    const label = isApp ? `App : ${t.application!.nom}` : `Mat. : ${t.materiel!.nom}`;
    return (
      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200">
        {label}
      </span>
    );
  };

  // Auth guard
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

  // Data
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
      setTickets(Array.isArray(data) ? data : []);
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

  const handleStatusChange = async (ticketId: number, newStatus: Ticket["statut"]) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/technicien/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statut: newStatus }),
      });
      const updated = await res.json();
      if (!res.ok) {
        alert(updated?.error || "Erreur mise à jour du statut");
        return;
      }
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (e) {
      console.error(e);
      alert("Erreur mise à jour du statut");
    }
  };

  const groups = useMemo(
    () => ({
      OPEN: tickets.filter((t) => t.statut === "OPEN"),
      IN_PROGRESS: tickets.filter((t) => t.statut === "IN_PROGRESS"),
      A_CLOTURER: tickets.filter((t) => t.statut === "A_CLOTURER"),
      REJETE: tickets.filter((t) => t.statut === "REJETE"),
      TRANSFERE_MANTICE: tickets.filter((t) => t.statut === "TRANSFERE_MANTICE"),
      CLOSED: tickets.filter((t) => t.statut === "CLOSED"),
    }),
    [tickets]
  );

  const StatusOptions: Ticket["statut"][] = [
    "OPEN",
    "IN_PROGRESS",
    "A_CLOTURER",
    "REJETE",
    "TRANSFERE_MANTICE",
    "CLOSED",
  ];

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/60 shadow-sm">
        <div className="mx-auto max-w-[1600px] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/cds.png" alt="CDS Logo" className="h-10 w-auto" />
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">Gestion des tickets</h1>
              <p className="text-xs text-slate-500">
                Tableau de bord technicien — {user.prenom} {user.nom}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={fetchTickets}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              Rafraîchir
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[.98] shadow-sm transition-all"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="mx-auto max-w-[1600px] w-full px-6 pt-6 grid gap-4 grid-cols-3 xl:grid-cols-6">
        {(
          Object.keys(groups) as (keyof typeof groups)[]
        ).map((k) => {
          const color: Record<string, string> = {
            OPEN: "bg-yellow-50",
            IN_PROGRESS: "bg-blue-50",
            A_CLOTURER: "bg-amber-50",
            REJETE: "bg-rose-50",
            TRANSFERE_MANTICE: "bg-violet-50",
            CLOSED: "bg-emerald-50",
          };
          const label: Record<string, string> = {
            OPEN: "Ouverts",
            IN_PROGRESS: "En cours",
            A_CLOTURER: "À clôturer",
            REJETE: "Rejetés",
            TRANSFERE_MANTICE: "Transférés MANTICE",
            CLOSED: "Clôturés",
          };
          return (
            <div key={k} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">{label[k]}</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">{groups[k].length}</div>
                </div>
                <div className={`p-2 rounded-lg ${color[k]}`} />
              </div>
            </div>
          );
        })}
      </section>

      {/* Kanban */}
      <main className="mx-auto max-w-[1600px] w-full px-6 pb-10 pt-6 grid gap-4 grid-cols-1 md:grid-cols-3 xl:grid-cols-6">
        {(Object.keys(groups) as (keyof typeof groups)[]).map((column) => {
          const meta: Record<string, { label: string; bg: string; border: string; text: string }> = {
            OPEN: { label: "Ouverts", bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
            IN_PROGRESS: { label: "En cours", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
            A_CLOTURER: { label: "À clôturer", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
            REJETE: { label: "Rejetés", bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700" },
            TRANSFERE_MANTICE: { label: "Transférés MANTICE", bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700" },
            CLOSED: { label: "Clôturés", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
          };
          const config = meta[column];
          const list = groups[column];

          return (
            <div key={column} className="rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col">
              <div className={`flex items-center justify-between px-4 py-3 border-b ${config.border} ${config.bg} rounded-t-lg`}>
                <h2 className={`text-sm font-bold ${config.text}`}>{config.label}</h2>
                <span className={`text-xs font-semibold ${config.text} px-2 py-0.5 rounded-full ${config.bg} border ${config.border}`}>
                  {list.length}
                </span>
              </div>

              <div className="flex-1 p-3 overflow-y-auto max-h-[calc(100vh-280px)]">
                {list.length === 0 ? (
                  <div className="text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                    Aucun ticket
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {list.map((ticket) => (
                      <li
                        key={ticket.id}
                        className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition-all hover:border-slate-300"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <TypeTag type={ticket.type} />
                          <span className="text-xs text-slate-500 font-mono">#{ticket.id}</span>
                        </div>

                        <Link
                          href={`/dashboard/technicien/${ticket.id}`}
                          className="block text-sm font-medium text-slate-800 hover:text-blue-600 transition-colors line-clamp-2 mb-2"
                        >
                          {ticket.description}
                        </Link>

                        {/* Sous-catégorie */}
                        <div className="mb-2">
                          <SubTag t={ticket} />
                        </div>

                        <div className="flex flex-col gap-1.5 text-xs mb-3">
                          <div className="flex items-center gap-1 text-slate-600 truncate">
                            <span className="text-slate-400">Par :</span>
                            <span className="truncate">{ticket.createdBy.prenom} {ticket.createdBy.nom}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600 truncate">
                            <span className="text-slate-400">Statut :</span>
                            <StatusPill statut={ticket.statut} />
                          </div>
                        </div>

                        <AttachmentList ticketId={ticket.id} />

                        <div className="mt-3 grid gap-2">
                          <select
                            onChange={(e) => handleStatusChange(ticket.id, e.target.value as Ticket["statut"])}
                            value={ticket.statut}
                            className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                          >
                            {StatusOptions.map((s) => (
                              <option key={s} value={s}>{s.replace("_", " ")}</option>
                            ))}
                          </select>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatusChange(ticket.id, "IN_PROGRESS")}
                              className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition"
                            >
                              Marquer en cours
                            </button>
                            <button
                              onClick={() => handleStatusChange(ticket.id, "A_CLOTURER")}
                              className="text-xs px-3 py-1.5 rounded-md border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 transition"
                            >
                              À clôturer
                            </button>
                            <button
                              onClick={() => handleStatusChange(ticket.id, "TRANSFERE_MANTICE")}
                              className="text-xs px-3 py-1.5 rounded-md border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 transition"
                            >
                              Transférer MANTICE
                            </button>
                            <button
                              onClick={() => handleStatusChange(ticket.id, "CLOSED")}
                              className="text-xs px-3 py-1.5 rounded-md bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-sm transition"
                            >
                              Clôturer
                            </button>
                          </div>

                          <Link
                            href={`/dashboard/technicien/${ticket.id}`}
                            className="text-center px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-slate-200 hover:bg-slate-50 transition"
                          >
                            Détails →
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}

/** Liste des pièces jointes — réutilisable (identique admin) */
function AttachmentList({ ticketId }: { ticketId: number }) {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<PieceJointe[]>([]);

  const toggle = async () => {
    if (!opened) {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/tickets/${ticketId}/pieces-jointes`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json();
        setList(Array.isArray(data) ? data : []);
      } catch {
        setList([]);
      } finally {
        setLoading(false);
      }
    }
    setOpened((o) => !o);
  };

  return (
    <div className="border border-slate-200 rounded-md p-2 bg-slate-50">
      <button
        onClick={toggle}
        className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
      >
        <span>{opened ? "−" : "+"}</span>
        {opened ? "Masquer PJ" : "Voir PJ"}
      </button>
      {opened && (
        <div className="mt-2">
          {loading && <div className="text-xs text-slate-500">Chargement…</div>}
          {!loading && list.length === 0 && <div className="text-xs text-slate-500">Aucune PJ</div>}
          {!loading && list.length > 0 && (
            <ul className="space-y-1">
              {list.map((f) => (
                <li key={f.id}>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline break-all line-clamp-1"
                    title={f.nomFichier}
                  >
                    {f.nomFichier}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
