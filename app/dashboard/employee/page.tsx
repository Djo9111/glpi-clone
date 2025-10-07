"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type TicketForm = {
  description: string;
  typeTicket: "ASSISTANCE" | "INTERVENTION";
};

type Ticket = {
  id: number;
  description: string;
  type: "ASSISTANCE" | "INTERVENTION";
  statut: "OPEN" | "IN_PROGRESS" | "CLOSED";
  dateCreation: string;
  assignedTo?: { id: number; prenom: string; nom: string } | null;
};

export default function EmployeeDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; nom: string; prenom: string; role: string } | null>(null);
  const [ticketForm, setTicketForm] = useState<TicketForm>({ description: "", typeTicket: "ASSISTANCE" });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Fetch des tickets de l'employé
  const fetchMyTickets = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/employee/tickets", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur récupération de vos demandes");
        return;
      }
      setTickets(data);
    } catch (e) {
      console.error(e);
      alert("Erreur récupération de vos demandes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchMyTickets();
  }, [user, fetchMyTickets]);

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
      fetchMyTickets(); // refresh la liste
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

  // ——— Helpers Timeline ———
  const computeStepIndex = (t: Ticket) => {
    // Steps: 0: Créé, 1: Assigné, 2: En cours, 3: Clôturé
    if (t.statut === "CLOSED") return 3;
    if (t.statut === "IN_PROGRESS") return 2;
    if (t.assignedTo) return 1;
    return 0; // OPEN sans assignation
  };

  const StepIcon = ({ active, done }: { active: boolean; done: boolean }) => (
    <span
      className={[
        "flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
        done ? "bg-amber-500 border-amber-500 text-white" :
        active ? "bg-white border-amber-500 text-amber-700" :
        "bg-white border-amber-200 text-neutral-400"
      ].join(" ")}
      aria-hidden
    >
      {done ? "✓" : ""}
    </span>
  );

  const Timeline = ({ ticket }: { ticket: Ticket }) => {
    const idx = computeStepIndex(ticket);
    const steps = [
      { key: "CREATED", label: "Créé", desc: `Créé le ${new Date(ticket.dateCreation).toLocaleString()}` },
      { key: "ASSIGNED", label: "Assigné", desc: ticket.assignedTo ? `À ${ticket.assignedTo.prenom} ${ticket.assignedTo.nom}` : "En attente d’un technicien" },
      { key: "IN_PROGRESS", label: "En cours", desc: "Prise en charge par le technicien" },
      { key: "CLOSED", label: "Clôturé", desc: "Résolu et fermé" },
    ];

    return (
      <ol className="relative ml-3 pl-4">
        {steps.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <li key={s.key} className="mb-5 last:mb-0">
              {/* ligne verticale */}
              {i !== steps.length - 1 && (
                <span
                  className={[
                    "absolute left-0 top-2 h-full w-px",
                    i < idx ? "bg-amber-400" : "bg-amber-100"
                  ].join(" ")}
                  aria-hidden
                />
              )}
              <div className="flex items-start gap-3">
                <StepIcon active={active} done={done} />
                <div>
                  <div className="text-sm font-semibold">
                    <span className={active || done ? "text-amber-700" : "text-neutral-500"}>{s.label}</span>
                    {active && <span className="ml-2 text-[10px] rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">étape actuelle</span>}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    );
  };

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
      <main className="flex flex-col items-center justify-start px-4 py-10 gap-8">
        {/* Formulaire nouvelle demande */}
        <div className="w-full max-w-2xl bg-white border border-amber-100 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6 text-neutral-800">Faire une nouvelle demande</h2>

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

        {/* —— Suivi des demandes —— */}
        <div className="w-full max-w-3xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-neutral-800">Suivi de mes demandes</h2>
            <button
              onClick={fetchMyTickets}
              className="text-sm rounded-xl border border-amber-200 px-3 py-1.5 hover:bg-amber-50"
            >
              Rafraîchir
            </button>
          </div>

          {loading && <div className="rounded-2xl border border-amber-100 bg-white p-4 text-sm text-neutral-600">Chargement…</div>}

          {!loading && tickets.length === 0 && (
            <div className="rounded-2xl border border-dashed border-amber-100 bg-white p-6 shadow-sm text-neutral-500 text-sm text-center">
              Aucune demande pour le moment.
            </div>
          )}

          <div className="grid gap-4">
            {tickets.map((t) => (
              <div key={t.id} className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-neutral-500">
                      #{t.id} • {new Date(t.dateCreation).toLocaleString()}
                    </div>
                    <p className="mt-1 font-semibold text-neutral-800">{t.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
                      <span className="rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5">Type : {t.type}</span>
                      <span className="rounded-full bg-white border border-amber-100 px-2 py-0.5">
                        Statut : {t.statut === "OPEN" ? "Ouvert" : t.statut === "IN_PROGRESS" ? "En cours" : "Clôturé"}
                      </span>
                      <span className="rounded-full bg-white border border-amber-100 px-2 py-0.5">
                        Technicien : {t.assignedTo ? `${t.assignedTo.prenom} ${t.assignedTo.nom}` : "—"}
                      </span>
                    </div>
                  </div>
                  {/* Stepper compact résumé */}
                  <div className="hidden sm:flex items-center gap-2 text-[11px] text-neutral-500">
                    {["Créé", "Assigné", "En cours", "Clôturé"].map((lbl, i) => {
                      const idx = computeStepIndex(t);
                      const active = i === idx;
                      const done = i < idx;
                      return (
                        <div key={lbl} className="flex items-center">
                          <span className={[
                            "h-2 w-2 rounded-full",
                            done ? "bg-amber-500" : active ? "bg-amber-400" : "bg-amber-200"
                          ].join(" ")} />
                          <span className={["ml-1", done || active ? "text-neutral-700" : ""].join(" ")}>{lbl}</span>
                          {i !== 3 && <span className="mx-2 h-px w-6 bg-amber-100" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Timeline détaillée */}
                <div className="mt-4">
                  <Timeline ticket={t} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
