// app/dashboard/employee/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type TicketForm = {
  description: string;
  typeTicket: "ASSISTANCE" | "INTERVENTION";
  applicationId?: number | ""; // nouveau
  materielId?: number | "";    // nouveau
};

type Ticket = {
  id: number;
  description: string;
  type: "ASSISTANCE" | "INTERVENTION";
  statut: "OPEN" | "IN_PROGRESS" | "CLOSED";
  dateCreation: string;
  assignedTo?: { id: number; prenom: string; nom: string } | null;
};

type PieceJointe = { id: number; nomFichier: string; url: string };
type CommentItem = {
  id: number;
  contenu: string;
  createdAt: string;
  auteur: { id: number; prenom: string; nom: string };
};

// nouveaux types
type Application = { id: number; nom: string };
type Materiel = { id: number; nom: string };

export default function EmployeeDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; nom: string; prenom: string; role: string } | null>(null);
  const [ticketForm, setTicketForm] = useState<TicketForm>({
    description: "",
    typeTicket: "ASSISTANCE",
    applicationId: "",
    materielId: "",
  });

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  // nouvelles listes
  const [applications, setApplications] = useState<Application[]>([]);
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "IN_PROGRESS" | "CLOSED">("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [selected, setSelected] = useState<Ticket | null>(null);

  const [files, setFiles] = useState<File[]>([]);

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

  // charger applications & matériels
  const fetchCategories = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoadingCats(true);
    try {
      const [appsRes, matsRes] = await Promise.all([
        fetch("/api/applications", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        fetch("/api/materiels", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
      ]);
      const [apps, mats] = await Promise.all([appsRes.json(), matsRes.json()]);
      setApplications(Array.isArray(apps) ? apps : []);
      setMateriels(Array.isArray(mats) ? mats : []);
    } catch (e) {
      console.error(e);
      setApplications([]);
      setMateriels([]);
    } finally {
      setLoadingCats(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchMyTickets();
    fetchCategories();
  }, [user, fetchMyTickets, fetchCategories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // caster proprement pour les ids
    if (name === "applicationId" || name === "materielId") {
      setTicketForm((f) => ({ ...f, [name]: value === "" ? "" : Number(value) }));
      return;
    }
    if (name === "typeTicket") {
      const nextType = value as "ASSISTANCE" | "INTERVENTION";
      setTicketForm((f) => ({
        ...f,
        typeTicket: nextType,
        // reset la sous-catégorie quand on change de type
        applicationId: nextType === "ASSISTANCE" ? f.applicationId : "",
        materielId: nextType === "INTERVENTION" ? f.materielId : "",
      }));
      return;
    }
    setTicketForm({ ...ticketForm, [name]: value });
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    setFiles(list.slice(0, 5));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const fd = new FormData();
      fd.append("description", ticketForm.description);
      fd.append("typeTicket", ticketForm.typeTicket);
      // envoyer l'id si présent et cohérent avec le type
      if (ticketForm.typeTicket === "ASSISTANCE" && ticketForm.applicationId) {
        fd.append("applicationId", String(ticketForm.applicationId));
      }
      if (ticketForm.typeTicket === "INTERVENTION" && ticketForm.materielId) {
        fd.append("materielId", String(ticketForm.materielId));
      }
      if (files.length) {
        files.forEach((f) => fd.append("files", f));
      }

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(`Erreur : ${data.error}`);
        return;
      }

      alert("Votre demande a été envoyée avec succès !");
      setTicketForm({ description: "", typeTicket: "ASSISTANCE", applicationId: "", materielId: "" });
      setFiles([]);
      const fi = document.getElementById("fileInput") as HTMLInputElement | null;
      if (fi) fi.value = "";

      fetchMyTickets();
      setQuery("");
      setStatusFilter("ALL");
      setPage(1);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'envoi de la demande");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

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

  const displayName = user ? `${user.prenom} ${user.nom}` : "…";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header moderne avec logo */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/60 shadow-sm">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/cds.png" alt="CDS Logo" className="h-10 w-auto" />
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <h1 className="font-semibold text-lg text-slate-800">
                Bienvenue, {displayName}
              </h1>
              <p className="text-xs text-slate-500">Portail de support technique</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[.98] transition-all shadow-sm"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex flex-col items-center justify-start px-4 py-10 gap-8">
        {/* Formulaire nouvelle demande */}
        <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-1 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
            <h2 className="text-xl font-bold text-slate-800">Nouvelle demande</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div
              onClick={() =>
                setTicketForm((f) => ({
                  ...f,
                  typeTicket: "ASSISTANCE",
                  // reset l’autre sous-catégorie
                  materielId: "",
                }))
              }
              className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                ticketForm.typeTicket === "ASSISTANCE"
                  ? "border-blue-500 bg-blue-50/50 shadow-md"
                  : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 p-2 rounded-lg ${
                    ticketForm.typeTicket === "ASSISTANCE" ? "bg-blue-100" : "bg-slate-100"
                  }`}
                >
                  <svg
                    className={`w-5 h-5 ${
                      ticketForm.typeTicket === "ASSISTANCE" ? "text-blue-600" : "text-slate-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-800 mb-1">Assistance</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Besoin logiciel ou bureautique (Word, Lotus, Delta, etc.)
                  </p>
                </div>
              </div>
            </div>

            <div
              onClick={() =>
                setTicketForm((f) => ({
                  ...f,
                  typeTicket: "INTERVENTION",
                  // reset l’autre sous-catégorie
                  applicationId: "",
                }))
              }
              className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                ticketForm.typeTicket === "INTERVENTION"
                  ? "border-purple-500 bg-purple-50/50 shadow-md"
                  : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 p-2 rounded-lg ${
                    ticketForm.typeTicket === "INTERVENTION" ? "bg-purple-100" : "bg-slate-100"
                  }`}
                >
                  <svg
                    className={`w-5 h-5 ${
                      ticketForm.typeTicket === "INTERVENTION" ? "text-purple-600" : "text-slate-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-800 mb-1">Intervention</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">Panne matérielle nécessitant un déplacement</p>
                </div>
              </div>
            </div>
          </div>

          {/* Select conditionnel Application / Matériel */}
          <div className="grid gap-2 mb-4">
            {ticketForm.typeTicket === "ASSISTANCE" && (
              <>
                <label className="text-sm font-medium text-slate-700">
                  Application (optionnel)
                </label>
                <select
                  name="applicationId"
                  value={ticketForm.applicationId ?? ""}
                  onChange={handleChange}
                  className="border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm bg-white"
                  disabled={loadingCats}
                >
                  <option value="">— Sélectionner une application —</option>
                  {applications.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nom}
                    </option>
                  ))}
                </select>
              </>
            )}
            {ticketForm.typeTicket === "INTERVENTION" && (
              <>
                <label className="text-sm font-medium text-slate-700">
                  Matériel (optionnel)
                </label>
                <select
                  name="materielId"
                  value={ticketForm.materielId ?? ""}
                  onChange={handleChange}
                  className="border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none rounded-lg px-3 py-2.5 text-sm bg-white"
                  disabled={loadingCats}
                >
                  <option value="">— Sélectionner un matériel —</option>
                  {materiels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nom}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium text-slate-700">
                Décrivez votre besoin
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Ex. : Mon imprimante ne répond plus malgré le redémarrage."
                value={ticketForm.description}
                onChange={handleChange}
                className="border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 min-h-[110px] text-slate-800 placeholder:text-slate-400"
                required
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="fileInput" className="text-sm font-medium text-slate-700">
                Joindre des fichiers
              </label>
              <input
                id="fileInput"
                name="files"
                type="file"
                multiple
                onChange={handleFiles}
                className="border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm bg-white"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.log,.doc,.docx,.xlsx,.csv"
              />
              {files.length > 0 && (
                <ul className="mt-1 text-xs text-slate-600 space-y-1 bg-slate-50 rounded-md p-2">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {f.name} — {(f.size / 1024 / 1024).toFixed(2)} Mo
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-slate-500">
                Formats : PDF, images, Office, TXT/LOG • Max 10 Mo par fichier, 5 fichiers
              </p>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-orange-600 hover:to-orange-700 active:scale-[.98]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Envoyer la demande
            </button>
          </div>
        </div>

        {/* Suivi des demandes */}
        <div className="w-full max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-slate-800">Suivi de mes demandes</h2>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="search"
                placeholder="Rechercher..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "ALL" | "OPEN" | "IN_PROGRESS" | "CLOSED")
                }
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">Tous</option>
                <option value="OPEN">Ouverts</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="CLOSED">Clôturés</option>
              </select>
              <button
                onClick={fetchMyTickets}
                className="h-10 text-sm rounded-lg border border-slate-300 px-3 hover:bg-slate-50 bg-white transition-colors"
              >
                ⟳
              </button>
            </div>
          </div>

          {!user && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              Chargement de votre session…
            </div>
          )}

          {user && loading && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              Chargement…
            </div>
          )}

          {user && !loading && paginated.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-slate-500 text-sm text-center">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              Aucune demande pour le moment
            </div>
          )}

          {user && !loading && paginated.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <ul className="max-h-[520px] overflow-y-auto divide-y divide-slate-100">
                {paginated.map((t) => (
                  <li
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="cursor-pointer px-5 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                          <span className="font-mono">#{t.id}</span>
                          <span>•</span>
                          <span>{new Date(t.dateCreation).toLocaleString()}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 truncate mb-2">
                          {t.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              t.type === "ASSISTANCE"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {t.type === "ASSISTANCE" ? "Assistance" : "Intervention"}
                          </span>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                            {t.assignedTo ? `${t.assignedTo.prenom} ${t.assignedTo.nom}` : "Non assigné"}
                          </span>
                        </div>
                      </div>
                      <StatusChip statut={t.statut} />
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50 text-sm">
                <span className="text-slate-600">
                  Page {page} / {totalPages} • {filtered.length} demande(s)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                  >
                    ← Précédent
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                  >
                    Suivant →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <TicketDrawer ticket={selected} onClose={() => setSelected(null)} user={user} />
      </main>
    </div>
  );
}

function StatusChip({ statut }: { statut: "OPEN" | "IN_PROGRESS" | "CLOSED" }) {
  const map = {
    OPEN: { label: "Ouvert", cls: "bg-yellow-50 text-yellow-700 border-yellow-300", icon: "" },
    IN_PROGRESS: { label: "En cours", cls: "bg-blue-50 text-blue-700 border-blue-300", icon: "" },
    CLOSED: { label: "Clôturé", cls: "bg-emerald-50 text-emerald-700 border-emerald-300", icon: "" },
  } as const;
  const s = map[statut];
  return (
    <span className={`shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-semibold ${s.cls} flex items-center gap-1.5`}>
      <span>{s.icon}</span>
      {s.label}
    </span>
  );
}

function TicketDrawer({
  ticket,
  onClose,
  user,
}: {
  ticket: Ticket | null;
  onClose: () => void;
  user: { id: number; prenom: string; nom: string; role: string } | null;
}) {
  const [pj, setPj] = useState<PieceJointe[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    let abort = false;
    async function run() {
      if (!ticket) return;

      const token = localStorage.getItem("token");
      if (!token) return;

      setLoading(true);
      try {
        const [pjRes, cRes] = await Promise.all([
          fetch(`/api/tickets/${ticket.id}/pieces-jointes`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetch(`/api/tickets/${ticket.id}/comments`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
        ]);
        const [pjData, cData] = await Promise.all([pjRes.json(), cRes.json()]);
        if (!abort) {
          setPj(Array.isArray(pjData) ? pjData : []);
          setComments(Array.isArray(cData) ? cData : []);
        }
      } catch {
        if (!abort) {
          setPj([]);
          setComments([]);
        }
      } finally {
        if (!abort) setLoading(false);
      }
    }

    run();
    return () => {
      abort = true;
      setPj([]);
      setComments([]);
      setCommentInput("");
    };
  }, [ticket]);

  if (!ticket) return null;
  const step = ticket.statut === "CLOSED" ? 3 : ticket.statut === "IN_PROGRESS" ? 2 : ticket.assignedTo ? 1 : 0;
  const steps = ["Créé", "Assigné", "En cours", "Clôturé"];

  const handleAddComment = async () => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;

    const contenu = commentInput.trim();
    if (contenu.length < 2) {
      alert("Commentaire trop court");
      return;
    }

    setSending(true);

    const tempId = -Math.floor(Math.random() * 1e9);
    const optimistic: CommentItem = {
      id: tempId,
      contenu,
      createdAt: new Date().toISOString(),
      auteur: { id: user.id, prenom: user.prenom || "Vous", nom: user.nom || "" },
    };
    setComments((prev) => [...prev, optimistic]);
    setCommentInput("");

    try {
      const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contenu }),
      });
      const data = await res.json();

      if (!res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        alert(data.error || "Erreur lors de l'ajout du commentaire");
        return;
      }

      setComments((prev) => prev.map((c) => (c.id === tempId ? data : c)));
    } catch (e) {
      console.error(e);
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      alert("Erreur réseau");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl border-l border-slate-200 p-6 flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
            <h3 className="text-lg font-semibold text-slate-800">Ticket #{ticket.id}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors"
          >
            ✕ Fermer
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 pb-4 border-b border-slate-100">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(ticket.dateCreation).toLocaleString()}
          </span>
          <span>•</span>
          <span
            className={`px-2 py-0.5 rounded-md text-xs font-medium ${
              ticket.type === "ASSISTANCE" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
            }`}
          >
            {ticket.type}
          </span>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
        </div>

        {/* Timeline de progression */}
        <div className="mb-6 bg-white border border-slate-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-800 mb-3">Progression</h4>
          <div className="flex items-center justify-between">
            {steps.map((lbl, i) => (
              <div key={lbl} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    i < (ticket.statut === "CLOSED" ? 3 : ticket.statut === "IN_PROGRESS" ? 2 : ticket.assignedTo ? 1 : 0)
                      ? "bg-blue-500 scale-110"
                      : i === (ticket.statut === "CLOSED" ? 3 : ticket.statut === "IN_PROGRESS" ? 2 : ticket.assignedTo ? 1 : 0)
                      ? "bg-blue-400 ring-4 ring-blue-100"
                      : "bg-slate-200"
                  }`}
                />
                <span className={`text-[10px] font-medium ${
                  i <= (ticket.statut === "CLOSED" ? 3 : ticket.statut === "IN_PROGRESS" ? 2 : ticket.assignedTo ? 1 : 0)
                    ? "text-slate-700"
                    : "text-slate-400"
                }`}>
                  {lbl}
                </span>
                {i !== steps.length - 1 && (
                  <div
                    className={`absolute h-0.5 w-full mt-1 ${
                      i < (ticket.statut === "CLOSED" ? 3 : ticket.statut === "IN_PROGRESS" ? 2 : ticket.assignedTo ? 1 : 0)
                        ? "bg-blue-400"
                        : "bg-slate-200"
                    }`}
                    style={{ left: `${(i + 0.5) * 25}%`, width: "25%", top: "9px" }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>
              Technicien assigné :{" "}
              {ticket.assignedTo ? `${ticket.assignedTo.prenom} ${ticket.assignedTo.nom}` : "En attente d'attribution"}
            </span>
          </div>
        </div>

        {/* Pièces jointes */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <h4 className="text-sm font-semibold text-slate-800">Pièces jointes</h4>
          </div>
          {loading && <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">Chargement…</div>}
          {!loading && pj.length === 0 && (
            <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 text-center">Aucune pièce jointe</div>
          )}
          {!loading && pj.length > 0 && (
            <ul className="space-y-2">
              {pj.map((f) => (
                <li key={f.id}>
                  <a
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg p-2 transition-colors border border-slate-200"
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="break-all">{f.nomFichier}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Commentaires */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h4 className="text-sm font-semibold text-slate-800">Commentaires</h4>
            </div>
            <button
              onClick={async () => {
                if (!ticket) return;
                setLoadingComments(true);
                try {
                  const token = localStorage.getItem("token");
                  const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                  });
                  const data = await res.json();
                  setComments(Array.isArray(data) ? data : []);
                } catch {
                  setComments([]);
                } finally {
                  setLoadingComments(false);
                }
              }}
              className="text-xs rounded-lg border border-slate-300 px-2.5 py-1 hover:bg-slate-50 transition-colors"
            >
              ⟳
            </button>
          </div>

          {loadingComments && <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">Chargement…</div>}

          {comments.length === 0 && !loadingComments ? (
            <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-4 text-center mb-4">
              Aucun commentaire pour le moment
            </div>
          ) : (
            <ul className="space-y-3 mb-4 flex-1 overflow-y-auto">
              {comments.map((c) => (
                <li key={c.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span className="font-medium text-slate-700">
                      {c.auteur.prenom} {c.auteur.nom}
                    </span>
                    <span>{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{c.contenu}</div>
                </li>
              ))}
            </ul>
          )}

          {/* Formulaire d'ajout de commentaire */}
          <div className="border-t border-slate-200 pt-4 mt-auto">
            <label className="text-xs font-medium text-slate-700 mb-2 block">Ajouter un commentaire</label>
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="w-full min-h-[90px] border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 mb-2"
              placeholder="Précisions, compléments, captures envoyées, etc."
              maxLength={4000}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{commentInput.length} / 4000</span>
              <button
                onClick={handleAddComment}
                disabled={sending || commentInput.trim().length < 2}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
              >
                {sending ? "Envoi…" : "Publier"}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
