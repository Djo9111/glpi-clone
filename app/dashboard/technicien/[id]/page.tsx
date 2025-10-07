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

export default function TechTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; role: string } | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth + rôle TECHNICIEN
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "TECHNICIEN") { alert("Accès refusé !"); router.push("/login"); return; }
      setUser(payload);
    } catch { router.push("/login"); }
  }, [router]);

  const fetchTicket = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/technicien/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Ticket introuvable"); router.push("/dashboard/technicien"); return; }
      setTicket(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id, router]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

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
    } catch (e) { console.error(e); alert("Erreur lors de la mise à jour du statut"); }
  };

  if (!user) return <p className="text-center mt-10 text-neutral-600">Chargement…</p>;
  if (loading) return <p className="text-center mt-10 text-neutral-600">Chargement du ticket…</p>;
  if (!ticket) return <p className="text-center mt-10 text-red-600">Ticket introuvable.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50/40">
      <header className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-amber-100">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Ticket #{ticket.id}</h1>
            <p className="text-xs text-neutral-500">
              Créé le {new Date(ticket.dateCreation).toLocaleString()} • {ticket.type}
            </p>
          </div>
          <Link href="/dashboard/technicien" className="px-3 py-2 text-sm rounded-xl border border-amber-200 hover:bg-amber-50">
            ← Retour
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 grid gap-4 md:grid-cols-3">
        <section className="md:col-span-2 space-y-4">
          <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700">{ticket.type}</span>
              <span className="text-xs text-neutral-500">Statut: {ticket.statut}</span>
            </div>
            <p className="mt-2 text-neutral-800">{ticket.description}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600">
              <span className="rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5">
                Créé par {ticket.createdBy.prenom} {ticket.createdBy.nom}
              </span>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-700">Actions</h3>
            <div className="mt-3 grid gap-2">
              <label className="text-xs mt-3">Changer le statut</label>
              <select
                value={ticket.statut}
                onChange={(e) => handleStatusChange(e.target.value as Ticket["statut"])}
                className="border border-amber-200 rounded-xl px-2 py-1 text-sm bg-white"
              >
                <option value="OPEN">Ouvert</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="CLOSED">Clôturé</option>
              </select>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
