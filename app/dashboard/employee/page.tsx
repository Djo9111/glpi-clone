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

  // 🔎 états UI pour la liste compacte
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "IN_PROGRESS" | "CLOSED">("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [selected, setSelected] = useState<Ticket | null>(null);

  // Vérification JWT et rôle (ne pas retourner avant la fin des hooks)
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
      setQuery("");
      setStatusFilter("ALL");
      setPage(1);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l’envoi de la demande");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  // —— Dérivés liste : filtre + recherche + pagination ——
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((t) => {
      const okStatus = statusFilter === "ALL" ? true : t.statut === statusFilter;
      const okQuery =
        !q ||
        t.description.toLowerCase().includes(q) ||
        String(t.id).includes(q) ||
        (t.assignedTo && `${t.assignedTo.prenom} ${t.assignedTo.nom}`.toLowerCase().includes(q));
      return okStatus && okQuery;
    });
  }, [tickets, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  // On peut rendre l'UI même si user == null (squelette/placeholder)
  const displayName = user ? `${user.prenom} ${user.nom}` : "…";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-amber-50/40">
      {/* Header avec déconnexion */}
      <header className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-amber-100 px-6 py-3 flex justify-between items-center">
        <div>
          <h1 className="font-semibold text-lg text-neutral-800">
            Bienvenue, {displayName}
          </h1>
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
              <label htmlFor="description" className="text-sm font-medium">
                Décrivez votre besoin
              </label>
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

        {/* —— Suivi de mes demandes —— */}
        <div className="w-full max-w-3xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-neutral-800">Suivi de mes demandes</h2>
            <div className="flex items-center gap-2">
              <input
                type="search"
                placeholder="Rechercher..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 rounded-xl border border-amber-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200/60"
              />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "ALL" | "OPEN" | "IN_PROGRESS" | "CLOSED")
                }
                className="h-9 rounded-xl border border-amber-200 px-2 text-sm bg-white"
              >
                <option value="ALL">Tous</option>
                <option value="OPEN">Ouverts</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="CLOSED">Clôturés</option>
              </select>
              <button
                onClick={fetchMyTickets}
                className="h-9 text-sm rounded-xl border border-amber-200 px-3 hover:bg-amber-50"
              >
                Rafraîchir
              </button>
            </div>
          </div>

          {/* Etat de chargement/connexion */}
          {!user && (
            <div className="rounded-2xl border border-amber-100 bg-white p-4 text-sm text-neutral-600">
              Chargement de votre session…
            </div>
          )}

          {user && loading && (
            <div className="rounded-2xl border border-amber-100 bg-white p-4 text-sm text-neutral-600">
              Chargement…
            </div>
          )}

          {user && !loading && paginated.length === 0 && (
            <div className="rounded-2xl border border-dashed border-amber-100 bg-white p-6 shadow-sm text-neutral-500 text-sm text-center">
              Aucune demande pour le moment.
            </div>
          )}

          {/* Liste compacte avec scroll interne */}
          {user && !loading && paginated.length > 0 && (
            <div className="rounded-2xl border border-amber-100 bg-white shadow-sm">
              <ul className="max-h-[520px] overflow-y-auto divide-y divide-amber-100">
                {paginated.map((t) => (
                  <li
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="cursor-pointer px-4 py-3 hover:bg-amber-50/50 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-neutral-500 truncate">
                          #{t.id} • {new Date(t.dateCreation).toLocaleString()}
                        </div>
                        <p className="mt-0.5 text-sm font-medium text-neutral-800 truncate">
                          {t.description}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-neutral-600">
                          <span className="rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5">
                            {t.type}
                          </span>
                          <span className="rounded-full bg-white border border-amber-100 px-2 py-0.5">
                            Tech : {t.assignedTo ? `${t.assignedTo.prenom} ${t.assignedTo.nom}` : "—"}
                          </span>
                        </div>
                      </div>
                      <StatusChip statut={t.statut} />
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-amber-100 text-sm">
                <span className="text-neutral-500">
                  Page {page} / {totalPages} • {filtered.length} élément(s)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg border border-amber-200 disabled:opacity-50 hover:bg-amber-50"
                  >
                    Précédent
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 rounded-lg border border-amber-200 disabled:opacity-50 hover:bg-amber-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer (panneau latéral) : détail minimal + mini-timeline, ouvert au clic */}
        <TicketDrawer ticket={selected} onClose={() => setSelected(null)} />
      </main>
    </div>
  );
}

/* —————————————————————— */
/*   Petits composants UI   */
/* —————————————————————— */

function StatusChip({ statut }: { statut: "OPEN" | "IN_PROGRESS" | "CLOSED" }) {
  const map = {
    OPEN: { label: "Ouvert", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    IN_PROGRESS: { label: "En cours", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    CLOSED: { label: "Clôturé", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  } as const;
  const s = map[statut];
  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function TicketDrawer({ ticket, onClose }: { ticket: Ticket | null; onClose: () => void }) {
  if (!ticket) return null;
  const step = ticket.statut === "CLOSED" ? 3 : ticket.statut === "IN_PROGRESS" ? 2 : ticket.assignedTo ? 1 : 0;
  const steps = ["Créé", "Assigné", "En cours", "Clôturé"];

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl border-l border-amber-100 p-5 flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-800">Ticket #{ticket.id}</h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-amber-200 px-2 py-1 text-sm hover:bg-amber-50"
          >
            Fermer
          </button>
        </div>

        <div className="mt-2 text-xs text-neutral-500">
          Créé le {new Date(ticket.dateCreation).toLocaleString()} • {ticket.type}
        </div>

        <div className="mt-4 text-sm text-neutral-800">{ticket.description}</div>

        {/* Mini-timeline ultra concise */}
        <div className="mt-5">
          <div className="flex items-center gap-2 text-[11px] text-neutral-500">
            {steps.map((lbl, i) => (
              <div key={lbl} className="flex items-center">
                <span
                  className={[
                    "h-2 w-2 rounded-full",
                    i < step ? "bg-amber-500" : i === step ? "bg-amber-400" : "bg-amber-200",
                  ].join(" ")}
                />
                <span className={["ml-1", i <= step ? "text-neutral-700" : ""].join(" ")}>{lbl}</span>
                {i !== steps.length - 1 && <span className="mx-2 h-px w-6 bg-amber-100" />}
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-neutral-600">
            Technicien : {ticket.assignedTo ? `${ticket.assignedTo.prenom} ${ticket.assignedTo.nom}` : "—"}
          </div>
        </div>
      </aside>
    </div>
  );
}
