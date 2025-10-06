"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type TicketForm = {
  description: string;
  typeTicket: "ASSISTANCE" | "INTERVENTION";
};

export default function EmployeeDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; nom: string; prenom: string; role: string } | null>(null);
  const [ticketForm, setTicketForm] = useState<TicketForm>({ description: "", typeTicket: "ASSISTANCE" });

  // Vérification JWT et rôle
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "EMPLOYE") {
        alert("Accès refusé !");
        router.push("/login");
        return;
      }
      setUser(payload);
    } catch (error) {
      console.error("Erreur JWT :", error);
      router.push("/login");
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setTicketForm({ ...ticketForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ticketForm),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(`Erreur : ${data.error}`);
        return;
      }

      alert("Ticket créé avec succès !");
      setTicketForm({ description: "", typeTicket: "ASSISTANCE" });
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création du ticket");
    }
  };

  if (!user) return <p>Chargement...</p>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Bienvenue {user.prenom} {user.nom}</h1>

      <div className="bg-white p-6 rounded shadow w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-4">Nouvelle demande</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <select
            name="typeTicket"
            value={ticketForm.typeTicket}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="ASSISTANCE">Assistance</option>
            <option value="INTERVENTION">Intervention</option>
          </select>
          <textarea
            name="description"
            placeholder="Décrivez votre besoin"
            value={ticketForm.description}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <button
            type="submit"
            className="bg-blue-900 text-white p-2 rounded hover:bg-blue-800"
          >
            Créer le ticket
          </button>
        </form>
      </div>
    </div>
  );
}
