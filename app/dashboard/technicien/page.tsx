"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  // Vérifier le JWT et le rôle
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

  // Charger les tickets assignés
  const fetchTickets = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/technicien/tickets", {
        headers: { Authorization: `Bearer ${token}` },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Mettre à jour localement l'item
      const updated = await res.json();
      setTickets(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    } catch (err) {
      console.error(err);
      alert("Erreur mise à jour statut");
    }
  };

  if (!user) return <p>Chargement...</p>;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Espace Technicien — {user.prenom} {user.nom}</h1>

      {loading && <p>Chargement des tickets...</p>}
      {!loading && tickets.length === 0 && <p className="text-gray-600">Aucun ticket assigné pour le moment.</p>}

      <div className="grid gap-4">
        {tickets.map(ticket => (
          <div key={ticket.id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">#{ticket.id} • {new Date(ticket.dateCreation).toLocaleString()}</p>
                <p className="font-semibold">{ticket.description}</p>
                <p className="text-sm text-gray-600">Type: {ticket.type}</p>
                <p className="text-sm text-gray-600">Créé par: {ticket.createdBy.prenom} {ticket.createdBy.nom}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <select
                  value={ticket.statut}
                  onChange={e => handleStatusChange(ticket.id, e.target.value)}
                  className="border p-1 rounded"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
