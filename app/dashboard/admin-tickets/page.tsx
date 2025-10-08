// app/dashboard/admin-tickets/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/app/components/NotificationBell";

type Ticket = {
  id: number;
  description: string;
  type: string;
  statut: string;
  createdBy: { id: number; prenom: string; nom: string };
  assignedTo?: { id: number; prenom: string; nom: string } | null;
};

type Technicien = {
  id: number;
  prenom: string;
  nom: string;
};

type PieceJointe = { id: number; nomFichier: string; url: string };

export default function AdminTicketsDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; role: string } | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);

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
        fetch("/api/admin/tickets", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        fetch("/api/admin/techniciens", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
      ]);
      const [ticketsData, techsData] = await Promise.all([ticketsRes.json(), techsRes.json()]);
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
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

      const updatedTicket = await res.json();
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updatedTicket : t)));
      alert("Technicien assigné !");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'assignation");
    }
  };

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
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

      const updatedTicket = await res.json();
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updatedTicket : t)));
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

  const groups = useMemo(
    () => ({
      OPEN: tickets.filter((t) => t.statut === "OPEN"),
      IN_PROGRESS: tickets.filter((t) => t.statut === "IN_PROGRESS"),
      CLOSED: tickets.filter((t) => t.statut === "CLOSED"),
    }),
    [tickets]
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-600">Chargement...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header moderne avec logo */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/60 shadow-sm">
        <div className="mx-auto max-w-[1600px] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/cds.png" 
              alt="CDS Logo" 
              className="h-10 w-auto"
            />
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">Gestion des tickets</h1>
              <p className="text-xs text-slate-500">Tableau de bord administrateur</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link
              href="/dashboard/admin"
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              Créer utilisateur
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

      {/* Statistiques compactes */}
      <section className="mx-auto max-w-[1600px] w-full px-6 pt-6 grid gap-4 grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Ouverts</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{groups.OPEN.length}</div>
            </div>
            <div className="p-2 rounded-lg bg-yellow-50">
              <span className="text-xl"></span>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase">En cours</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{groups.IN_PROGRESS.length}</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50">
              <span className="text-xl"></span>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Clôturés</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{groups.CLOSED.length}</div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50">
              <span className="text-xl"></span>
            </div>
          </div>
        </div>
      </section>

      {/* Kanban Board - Layout optimisé */}
      <main className="mx-auto max-w-[1600px] w-full px-6 pb-10 pt-6 grid gap-4 grid-cols-3">
        {(["OPEN", "IN_PROGRESS", "CLOSED"] as const).map((column) => {
          const columnConfig = {
            OPEN: { 
              label: "Ouverts", 
              icon: "",
              bgClass: "bg-yellow-50",
              borderClass: "border-yellow-200",
              textClass: "text-yellow-700"
            },
            IN_PROGRESS: { 
              label: "En cours", 
              icon: "",
              bgClass: "bg-blue-50",
              borderClass: "border-blue-200",
              textClass: "text-blue-700"
            },
            CLOSED: { 
              label: "Clôturés", 
              icon: "",
              bgClass: "bg-emerald-50",
              borderClass: "border-emerald-200",
              textClass: "text-emerald-700"
            },
          };
          
          const config = columnConfig[column];

          return (
            <div key={column} className="rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col">
              <div className={`flex items-center justify-between px-4 py-3 border-b ${config.borderClass} ${config.bgClass} rounded-t-lg`}>
                <h2 className={`text-sm font-bold ${config.textClass} flex items-center gap-2`}>
                  <span>{config.icon}</span>
                  {config.label}
                </h2>
                <span className={`text-xs font-semibold ${config.textClass} px-2 py-0.5 rounded-full ${config.bgClass} border ${config.borderClass}`}>
                  {groups[column].length}
                </span>
              </div>

              <div className="flex-1 p-3 overflow-y-auto max-h-[calc(100vh-280px)]">
                {groups[column].length === 0 ? (
                  <div className="text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                    Aucun ticket
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {groups[column].map((ticket) => (
                      <li
                        key={ticket.id}
                        className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition-all hover:border-slate-300"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                            ticket.type === "ASSISTANCE" 
                              ? "bg-blue-50 text-blue-700" 
                              : "bg-purple-50 text-purple-700"
                          }`}>
                            {ticket.type === "ASSISTANCE" ? "Assistance" : "Intervention"}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">#{ticket.id}</span>
                        </div>

                        <Link
                          href={`/dashboard/admin-tickets/${ticket.id}`}
                          className="block text-sm font-medium text-slate-800 hover:text-blue-600 transition-colors line-clamp-2 mb-3"
                        >
                          {ticket.description}
                        </Link>

                        <div className="flex flex-col gap-1.5 text-xs mb-3">
                          <div className="flex items-center gap-1 text-slate-600 truncate">
                            <span className="text-slate-400">Par:</span>
                            <span className="truncate">{ticket.createdBy.prenom} {ticket.createdBy.nom}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600 truncate">
                            <span className="text-slate-400">Tech:</span>
                            <span className="truncate">
                              {ticket.assignedTo ? `${ticket.assignedTo.prenom} ${ticket.assignedTo.nom}` : "Non assigné"}
                            </span>
                          </div>
                        </div>

                        <AttachmentList ticketId={ticket.id} />

                        <div className="mt-3 grid gap-2">
                          <select
                            onChange={(e) => handleAssign(ticket.id, parseInt(e.target.value))}
                            value={ticket.assignedTo?.id || ""}
                            className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                          >
                            <option value="">Assigner</option>
                            {techniciens.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.prenom} {t.nom}
                              </option>
                            ))}
                          </select>

                          <select
                            onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                            value={ticket.statut}
                            className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                          >
                            <option value="OPEN">Ouvert</option>
                            <option value="IN_PROGRESS"> En cours</option>
                            <option value="CLOSED">Clôturé</option>
                          </select>

                          <Link
                            href={`/dashboard/admin-tickets/${ticket.id}`}
                            className="text-center px-3 py-1.5 text-xs font-medium rounded-md bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm"
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
          {!loading && list.length === 0 && (
            <div className="text-xs text-slate-500">Aucune PJ</div>
          )}
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