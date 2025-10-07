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

export default function AdminTicketsDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; role: string } | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);

  // ✅ Vérification JWT et rôle
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

  // ✅ Récupération tickets et techniciens
  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const [ticketsRes, techsRes] = await Promise.all([
        fetch("/api/admin/tickets", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        fetch("/api/admin/techniciens", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
      ]);
      const [ticketsData, techsData] = await Promise.all([ticketsRes.json(), techsRes.json()]);
      setTickets(ticketsData);
      setTechniciens(techsData);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ Assigner un technicien
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
      // Optionnel : refetch pour rester parfaitement en phase avec le backend
      // await fetchData();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l’assignation");
    }
  };

  // ✅ Changer le statut
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
      // Optionnel : refetch
      // await fetchData();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  // Découpage Kanban (UI only)
  const groups = useMemo(
    () => ({
      OPEN: tickets.filter((t) => t.statut === "OPEN"),
      IN_PROGRESS: tickets.filter((t) => t.statut === "IN_PROGRESS"),
      CLOSED: tickets.filter((t) => t.statut === "CLOSED"),
    }),
    [tickets]
  );

  if (!user) return <p className="text-center mt-10 text-neutral-600">Chargement...</p>;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-amber-50/40">
      {/* Header avec actions */}
      <header className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-amber-100">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold tracking-tight">Tableau de bord — Admin</h1>
            <p className="text-xs text-neutral-500">Gestion des tickets et délégations</p>
          </div>
          <div className="flex items-center gap-2">
            {/* 🔔 Cloche de notifications */}
            <NotificationBell />
            <Link
              href="/dashboard/admin"
              className="px-4 py-2 text-sm font-medium rounded-xl border border-amber-200 hover:border-amber-300 hover:bg-amber-50 transition"
            >
              Aller au tableau admin
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-amber-500 text-white hover:bg-amber-600 active:scale-[.99] shadow-sm transition"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Résumé */}
      <section className="mx-auto max-w-7xl px-4 pt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold text-amber-700">Ouverts</div>
          <div className="mt-1 text-3xl font-bold">{groups.OPEN.length}</div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold text-amber-700">En cours</div>
          <div className="mt-1 text-3xl font-bold">{groups.IN_PROGRESS.length}</div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold text-amber-700">Clôturés</div>
          <div className="mt-1 text-3xl font-bold">{groups.CLOSED.length}</div>
        </div>
      </section>

      {/* Kanban */}
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-4 grid gap-4 md:grid-cols-3">
        {(["OPEN", "IN_PROGRESS", "CLOSED"] as const).map((column) => (
          <div key={column} className="rounded-2xl border border-amber-100 bg-white p-3 shadow-sm min-h-[300px]">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-neutral-700">
                {column === "OPEN" && "Ouverts"}
                {column === "IN_PROGRESS" && "En cours"}
                {column === "CLOSED" && "Clôturés"}
              </h2>
              <span className="text-xs text-neutral-500">{groups[column].length}</span>
            </div>

            {groups[column].length === 0 ? (
              <div className="text-xs text-neutral-400 border border-dashed border-amber-100 rounded-xl p-4 text-center">
                Aucun ticket
              </div>
            ) : (
              <ul className="space-y-3">
                {groups[column].map((ticket) => (
                  <li
                    key={ticket.id}
                    className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-amber-700">{ticket.type}</div>
                      <div className="text-xs text-neutral-500"># {ticket.id}</div>
                    </div>
                    <p className="mt-1 text-sm text-neutral-800">{ticket.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
                      <span className="rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5">
                        Créé par {ticket.createdBy.prenom} {ticket.createdBy.nom}
                      </span>
                      <span className="rounded-full bg-white border border-amber-100 px-2 py-0.5">
                        Assigné à {ticket.assignedTo ? `${ticket.assignedTo.prenom} ${ticket.assignedTo.nom}` : "—"}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        onChange={(e) => handleAssign(ticket.id, parseInt(e.target.value))}
                        value={ticket.assignedTo?.id || ""}
                        className="border border-amber-200 rounded-xl px-2 py-1 text-sm bg-white"
                      >
                        <option value="">Assigner un technicien</option>
                        {techniciens.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.prenom} {t.nom}
                          </option>
                        ))}
                      </select>

                      <select
                        onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                        value={ticket.statut}
                        className="border border-amber-200 rounded-xl px-2 py-1 text-sm bg-white"
                      >
                        <option value="OPEN">Ouvert</option>
                        <option value="IN_PROGRESS">En cours</option>
                        <option value="CLOSED">Clôturé</option>
                      </select>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
