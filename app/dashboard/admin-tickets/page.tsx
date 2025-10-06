"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const [ticketsRes, techsRes] = await Promise.all([
          fetch("/api/admin/tickets", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/admin/techniciens", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const [ticketsData, techsData] = await Promise.all([ticketsRes.json(), techsRes.json()]);
        setTickets(ticketsData);
        setTechniciens(techsData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

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
      setTickets(prev =>
        prev.map(t => (t.id === ticketId ? updatedTicket : t))
      );
      alert("Technicien assigné !");
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
      setTickets(prev =>
        prev.map(t => (t.id === ticketId ? updatedTicket : t))
      );
      alert("Statut mis à jour !");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  if (!user) return <p>Chargement...</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">
        Tableau de bord — Chef DSI
      </h1>

      {tickets.length === 0 && (
        <p className="text-gray-500">Aucun ticket pour le moment.</p>
      )}

      {tickets.map(ticket => (
        <div
          key={ticket.id}
          className="bg-white p-4 rounded-lg shadow-md mb-4 border-l-4 border-blue-800"
        >
          <p><strong>ID :</strong> {ticket.id}</p>
          <p><strong>Description :</strong> {ticket.description}</p>
          <p><strong>Type :</strong> {ticket.type}</p>
          <p><strong>Statut :</strong> {ticket.statut}</p>
          <p><strong>Créé par :</strong> {ticket.createdBy.prenom} {ticket.createdBy.nom}</p>
          <p><strong>Assigné à :</strong> {ticket.assignedTo ? `${ticket.assignedTo.prenom} ${ticket.assignedTo.nom}` : "— Non assigné —"}</p>

          <div className="flex gap-4 mt-3">
            <select
              onChange={e => handleAssign(ticket.id, parseInt(e.target.value))}
              value={ticket.assignedTo?.id || ""}
              className="border p-1 rounded"
            >
              <option value="">Assigner un technicien</option>
              {techniciens.map(t => (
                <option key={t.id} value={t.id}>
                  {t.prenom} {t.nom}
                </option>
              ))}
            </select>

            <select
              onChange={e => handleStatusChange(ticket.id, e.target.value)}
              value={ticket.statut}
              className="border p-1 rounded"
            >
              <option value="OPEN">Ouvert</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="CLOSED">Clôturé</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
