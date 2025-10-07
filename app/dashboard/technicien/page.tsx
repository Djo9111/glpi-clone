// app/dashboard/technicien/page.tsx  (ou le fichier que tu as montré)
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // 👈 ajouter
import NotificationBell from "@/app/components/NotificationBell";

type Ticket = {
  id: number;
  description: string;
  type: string;
  statut: string;
  dateCreation: string;
  createdBy: { id: number; prenom: string; nom: string; email?: string };
  assignedTo?: { id: number; prenom: string; nom: string } | null;
};

export default function TechnicianDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; prenom: string; nom: string; role: string } | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

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
    } catch (err) {
      console.error("Erreur JWT :", err);
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
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Erreur récupération tickets");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error(err);
      alert("Erreur récupération tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchTickets();
  }, [user]);

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`/api/technicien/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statut: newStatus }),
      });

      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Erreur mise à jour statut");
        return;
      }

      const updated = await res.json();
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

  if (!user) return <p className="text-center mt-10 text-neutral-600">Chargement...</p>;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-amber-50/40">
      <header className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-amber-100">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold tracking-tight">
              Espace Technicien — {user.prenom} {user.nom}
            </h1>
            <p className="text-xs text-neutral-500">Tickets qui vous sont assignés</p>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={fetchTickets}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-amber-200 hover:border-amber-300 hover:bg-amber-50 transition"
            >
              Rafraîchir
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-amber-500 text-white hover:bg-amber-600 active:scale-[.99] shadow-sm transition"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl w-full px-4 py-8">
        {loading && (
          <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm text-sm text-neutral-600">
            Chargement des tickets...
          </div>
        )}
        {!loading && tickets.length === 0 && (
          <div className="rounded-2xl border border-dashed border-amber-100 bg-white p-6 shadow-sm text-neutral-500 text-sm text-center">
            Aucun ticket assigné pour le moment.
          </div>
        )}

        <div className="grid gap-4">
          {tickets.map(ticket => (
            <div
              key={ticket.id}
              className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-neutral-500">
                    # {ticket.id} • {new Date(ticket.dateCreation).toLocaleString()}
                  </div>
                  <p className="mt-1 font-semibold text-neutral-800">{ticket.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
                    <span className="rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5">
                      Type: {ticket.type}
                    </span>
                    <span className="rounded-full bg-white border border-amber-100 px-2 py-0.5">
                      Créé par {ticket.createdBy.prenom} {ticket.createdBy.nom}
                    </span>
                  </div>

                  {/* 👇 Nouveau : lien direct vers les détails complets */}
                  <div className="mt-3">
                    <Link
                      href={`/dashboard/technicien/${ticket.id}`}
                      className="text-sm text-amber-700 hover:underline"
                    >
                      Voir détails & pièces jointes →
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 min-w-[220px]">
                  <label className="text-xs text-neutral-500">Statut</label>
                  <select
                    value={ticket.statut}
                    onChange={e => handleStatusChange(ticket.id, e.target.value)}
                    className="border border-amber-200 rounded-xl px-2 py-2 text-sm bg-white"
                  >
                    <option value="OPEN">Ouvert</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="CLOSED">Clôturé</option>
                  </select>

                  {/* Raccourcis d'action si tu veux */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(ticket.id, "IN_PROGRESS")}
                      className="text-xs px-2 py-1 rounded-lg border border-amber-200 hover:bg-amber-50"
                    >
                      Marquer en cours
                    </button>
                    <button
                      onClick={() => handleStatusChange(ticket.id, "CLOSED")}
                      className="text-xs px-2 py-1 rounded-lg border border-amber-200 hover:bg-amber-50"
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
