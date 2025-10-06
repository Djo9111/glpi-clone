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

      alert("Votre demande a été envoyée avec succès !");
      setTicketForm({ description: "", typeTicket: "ASSISTANCE" });
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l’envoi de la demande");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (!user) return <p className="text-center mt-10 text-neutral-600">Chargement...</p>;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-amber-50/40">
      {/* Header avec déconnexion */}
      <header className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-amber-100 px-6 py-3 flex justify-between items-center">
        <div>
          <h1 className="font-semibold text-lg text-neutral-800">Bienvenue, {user.prenom} {user.nom}</h1>
          <p className="text-sm text-neutral-500">Espace employé</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-amber-50 active:scale-[.98] transition"
        >
          Déconnexion
        </button>
      </header>

      {/* Contenu principal */}
      <main className="flex flex-col items-center justify-start px-4 py-10">
        <div className="w-full max-w-2xl bg-white border border-amber-100 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6 text-neutral-800">Faire une nouvelle demande</h2>

          {/* Choix du type sous forme de cartes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div
              onClick={() => setTicketForm({ ...ticketForm, typeTicket: "ASSISTANCE" })}
              className={`cursor-pointer border rounded-xl p-4 transition shadow-sm hover:shadow-md ${
                ticketForm.typeTicket === "ASSISTANCE"
                  ? "border-amber-400 bg-amber-50"
                  : "border-amber-100 bg-white hover:bg-amber-50/40"
              }`}
            >
              <h3 className="text-lg font-semibold text-amber-700 mb-1">Assistance</h3>
              <p className="text-sm text-neutral-600">
                Pour un besoin logiciel ou bureautique (Word, Excel, accès réseau, etc.).
              </p>
            </div>
            <div
              onClick={() => setTicketForm({ ...ticketForm, typeTicket: "INTERVENTION" })}
              className={`cursor-pointer border rounded-xl p-4 transition shadow-sm hover:shadow-md ${
                ticketForm.typeTicket === "INTERVENTION"
                  ? "border-amber-400 bg-amber-50"
                  : "border-amber-100 bg-white hover:bg-amber-50/40"
              }`}
            >
              <h3 className="text-lg font-semibold text-amber-700 mb-1">Intervention</h3>
              <p className="text-sm text-neutral-600">
                Pour une panne matérielle ou un problème nécessitant un déplacement technique.
              </p>
            </div>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <label htmlFor="description" className="text-sm font-medium">Décrivez votre besoin</label>
              <textarea
                id="description"
                name="description"
                placeholder="Ex. : Mon imprimante ne répond plus malgré le redémarrage."
                value={ticketForm.description}
                onChange={handleChange}
                className="border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 outline-none rounded-xl px-3 py-2 min-h-[100px]"
                required
              />
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-amber-600 active:scale-[.99]"
            >
              Envoyer la demande
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
