// app/dashboard/technicien/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/app/components/NotificationBell";

type Ticket = {
  id: number;
  description: string;
  type: "ASSISTANCE" | "INTERVENTION";
  statut: "OPEN" | "IN_PROGRESS" | "CLOSED";
  dateCreation: string;
  createdBy: { id: number; prenom: string; nom: string; email?: string };
  assignedTo?: { id: number; prenom: string; nom: string } | null;
};

export default function TechnicianDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; prenom: string; nom: string; role: string } | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

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

  const fetchTickets = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/technicien/tickets", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Erreur récupération tickets"); return; }
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert("Erreur récupération tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchTickets(); }, [user]);

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
      if (!res.ok) { alert(updated.error || "Erreur mise à jour statut"); return; }
      setTickets(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    } catch (err) {
      console.error(err);
      alert("Erreur mise à jour statut");
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header aligné */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/60 shadow-sm">
        <div className="mx-auto max-w-[1600px] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/cds.png" alt="CDS Logo" className="h-10 w-auto" />
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                Espace Technicien — {user.prenom} {user.nom}
              </h1>
              <p className="text-xs text-slate-500">Tickets qui vous sont assignés</p>
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

      <main className="mx-auto max-w-[1600px] w-full px-6 pt-6 pb-10">
        {loading && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm text-sm text-slate-600">
            Chargement des tickets…
          </div>
        )}

        {!loading && tickets.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-6 shadow-sm text-slate-500 text-sm text-center">
            Aucun ticket assigné pour le moment.
          </div>
        )}

        <div className="grid gap-4">
          {tickets.map(ticket => (
            <div
              key={ticket.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-slate-500">
                    <span className="font-mono">#{ticket.id}</span> • {new Date(ticket.dateCreation).toLocaleString()}
                  </div>
                  <p className="mt-1 font-medium text-slate-800">{ticket.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <TypeTag type={ticket.type as Ticket["type"]} />
                    <StatusPill statut={ticket.statut as Ticket["statut"]} />
                    <span className="rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5">
                      Créé par {ticket.createdBy.prenom} {ticket.createdBy.nom}
                    </span>
                  </div>

                  <div className="mt-3">
                    <Link
                      href={`/dashboard/technicien/${ticket.id}`}
                      className="text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline"
                    >
                      Voir détails & pièces jointes →
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 min-w-[240px]">
                  <label className="text-xs text-slate-500">Mettre à jour le statut</label>
                  <select
                    value={ticket.statut}
                    onChange={e => handleStatusChange(ticket.id, e.target.value as Ticket["statut"])}
                    className="border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  >
                    <option value="OPEN">Ouvert</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="CLOSED">Clôturé</option>
                  </select>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(ticket.id, "IN_PROGRESS")}
                      className="text-xs px-2 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition"
                    >
                      Marquer en cours
                    </button>
                    <button
                      onClick={() => handleStatusChange(ticket.id, "CLOSED")}
                      className="text-xs px-2 py-1.5 rounded-md bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-sm transition"
                    >
                      Clôturer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
