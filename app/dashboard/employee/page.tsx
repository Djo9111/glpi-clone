// app/dashboard/employee/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import NotificationBell from "@/app/components/NotificationBell";

type TicketForm = {
  description: string;
  typeTicket: "ASSISTANCE" | "INTERVENTION";
  applicationId?: number | "";
  materielId?: number | "";
};

type TicketStatut = "OPEN" | "IN_PROGRESS" | "A_CLOTURER" | "CLOSED" | "TRANSFERE_MANTICE";
type Ticket = {
  id: number;
  description: string;
  type: "ASSISTANCE" | "INTERVENTION";
  statut: TicketStatut;
  dateCreation: string;
  assignedTo?: { id: number; prenom: string; nom: string } | null;
  createdBy?: { id: number; prenom: string; nom: string } | null;
};

type SubordinateUser = {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  codeHierarchique: number;
  departement?: { id: number; nom: string } | null;
};

type PieceJointe = { id: number; nomFichier: string; url: string };
type CommentItem = {
  id: number;
  contenu: string;
  createdAt: string;
  auteur: { id: number; prenom: string; nom: string };
};

type Application = { id: number; nom: string };
type Materiel = { id: number; nom: string };

const MAX_FILES = 5;

function normalizeStatus(s: unknown): TicketStatut {
  if (typeof s !== "string") return "OPEN";
  const k = s.trim().toLowerCase();

  if (k === "open") return "OPEN";
  if (k === "in_progress" || k === "in-progress") return "IN_PROGRESS";
  if (k === "a_cloturer" || k === "a-cloturer" || k === "à_clôturer" || k === "à-clôturer") return "A_CLOTURER";
  if (k === "closed" || k === "close") return "CLOSED";
  
  // AJOUT : Gestion du statut TRANSFERE_MANTICE
  if (k === "transfere_mantice" || k === "transfere" || k === "transféré" || k === "transféré_mantice") return "TRANSFERE_MANTICE";

  // Traitement des autres formats
  if (k === "en_attente" || k === "en-attente" || k === "attente" || k === "nouveau") return "OPEN";
  if (k === "en_cours" || k === "en-cours" || k === "traitement") return "IN_PROGRESS";
  if (k === "resolu" || k === "résolu") return "A_CLOTURER";
  if (k === "cloture" || k === "clôturé" || k === "cloturé") return "CLOSED";

  return "OPEN";
}

function normalizeTicket(raw: any): Ticket {
  return {
    id: Number(raw.id),
    description: String(raw.description ?? ""),
    type: (raw.type === "INTERVENTION" ? "INTERVENTION" : "ASSISTANCE") as "ASSISTANCE" | "INTERVENTION",
    statut: normalizeStatus(raw.statut ?? raw.status),
    dateCreation: String(raw.dateCreation ?? raw.createdAt ?? new Date().toISOString()),
    assignedTo: raw.assignedTo
      ? {
          id: Number(raw.assignedTo.id),
          prenom: String(raw.assignedTo.prenom ?? ""),
          nom: String(raw.assignedTo.nom ?? ""),
        }
      : null,
    createdBy: raw.createdBy
      ? {
          id: Number(raw.createdBy.id),
          prenom: String(raw.createdBy.prenom ?? ""),
          nom: String(raw.createdBy.nom ?? ""),
        }
      : null,
  };
}

export default function EmployeeDashboard() {
  const router = useRouter();

  // —— Session / onglet ——
  const [user, setUser] = useState<{
    id: number;
    nom: string;
    prenom: string;
    role: string;
    codeHierarchique: number;
    departementId: number | null;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"form" | "tickets" | "subordinates">("form");

  // —— Formulaire ——
  const [ticketForm, setTicketForm] = useState<TicketForm>({
    description: "",
    typeTicket: "ASSISTANCE",
    applicationId: "",
    materielId: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [filesError, setFilesError] = useState<string>("");

  // —— Données ——
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  // —— Subordonnés ——
  const [subordinates, setSubordinates] = useState<SubordinateUser[]>([]);
  const [loadingSubordinates, setLoadingSubordinates] = useState(false);
  const [selectedSubordinate, setSelectedSubordinate] = useState<SubordinateUser | null>(null);
  const [subordinateTickets, setSubordinateTickets] = useState<Ticket[]>([]);
  const [loadingSubTickets, setLoadingSubTickets] = useState(false);

  // —— Filtres / pagination ——
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TicketStatut>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<5 | 10 | 20 | 50>(10);

  // —— Sélection ——
  const [selected, setSelected] = useState<Ticket | null>(null);

  // ————————————————————————————————————————
  // Auth
  // ————————————————————————————————————————
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
      setUser({
        id: payload.id,
        nom: payload.nom,
        prenom: payload.prenom,
        role: payload.role,
        codeHierarchique: payload.codeHierarchique || 0,
        departementId: payload.departementId || null,
      });
    } catch (error) {
      console.error("Erreur JWT :", error);
      router.push("/login");
    }
  }, [router]);

  // ————————————————————————————————————————
  // Fetch
  // ————————————————————————————————————————
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
      const list = Array.isArray(data) ? data : [];
      const normalized: Ticket[] = list.map(normalizeTicket);
      setTickets(normalized);
    } catch (e) {
      console.error(e);
      alert("Erreur récupération de vos demandes");
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Récupérer la liste des subordonnés visibles
  const fetchSubordinates = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;

    // Si l'utilisateur n'a pas de code hiérarchique > 0, pas de subordonnés
    if (user.codeHierarchique === 0 || !user.departementId) {
      setSubordinates([]);
      return;
    }

    setLoadingSubordinates(true);
    try {
      const res = await fetch("/api/employee/subordinates", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Erreur récupération subordonnés:", data.error);
        setSubordinates([]);
        return;
      }
      setSubordinates(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setSubordinates([]);
    } finally {
      setLoadingSubordinates(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchMyTickets();
    fetchCategories();
    fetchSubordinates();
  }, [user, fetchMyTickets, fetchCategories, fetchSubordinates]);

  // Récupérer les tickets d'un subordonné
  const fetchSubordinateTickets = useCallback(async (userId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoadingSubTickets(true);
    try {
      const res = await fetch(`/api/tickets?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur récupération des tickets");
        setSubordinateTickets([]);
        return;
      }
      const list = Array.isArray(data) ? data : [];
      const normalized: Ticket[] = list.map(normalizeTicket);
      setSubordinateTickets(normalized);
    } catch (e) {
      console.error(e);
      alert("Erreur récupération des tickets");
      setSubordinateTickets([]);
    } finally {
      setLoadingSubTickets(false);
    }
  }, []);

  // ————————————————————————————————————————
  // Form handlers
  // ————————————————————————————————————————
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "applicationId" || name === "materielId") {
      setTicketForm((f) => ({ ...f, [name]: value === "" ? "" : Number(value) }));
      return;
    }
    if (name === "typeTicket") {
      const nextType = value as "ASSISTANCE" | "INTERVENTION";
      setTicketForm((f) => ({
        ...f,
        typeTicket: nextType,
        applicationId: nextType === "ASSISTANCE" ? f.applicationId : "",
        materielId: nextType === "INTERVENTION" ? f.materielId : "",
      }));
      return;
    }
    setTicketForm({ ...ticketForm, [name]: value });
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (list.length > MAX_FILES) {
      setFiles([]);
      setFilesError(`Vous avez sélectionné ${list.length} fichiers : maximum ${MAX_FILES} autorisés.`);
    } else {
      setFiles(list);
      setFilesError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    // Double garde côté client
    if (files.length > MAX_FILES) {
      setFilesError(`Vous avez sélectionné ${files.length} fichiers : maximum ${MAX_FILES} autorisés.`);
      alert(`Erreur : maximum ${MAX_FILES} fichiers autorisés`);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("description", ticketForm.description);
      fd.append("typeTicket", ticketForm.typeTicket);
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
      setFilesError("");
      const fi = document.getElementById("fileInput") as HTMLInputElement | null;
      if (fi) fi.value = "";

      fetchMyTickets();
      setActiveTab("tickets");
      setQuery("");
      setStatusFilter("ALL");
      setPage(1);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'envoi de la demande");
    }
  };

  // ————————————————————————————————————————
  // Logout
  // ————————————————————————————————————————
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  // ————————————————————————————————————————
  // Filtres + pagination (tickets personnels)
  // ————————————————————————————————————————
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
  }, [query, statusFilter, pageSize]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // ————————————————————————————————————————
  // Filtres pour tickets des subordonnés
  // ————————————————————————————————————————
  const [subQuery, setSubQuery] = useState("");
  const [subStatusFilter, setSubStatusFilter] = useState<"ALL" | TicketStatut>("ALL");
  const [subPage, setSubPage] = useState(1);
  const [subPageSize, setSubPageSize] = useState<5 | 10 | 20 | 50>(10);

  const filteredSubTickets = useMemo(() => {
    const q = subQuery.trim().toLowerCase();
    return subordinateTickets.filter((t) => {
      const okStatus = subStatusFilter === "ALL" ? true : t.statut === subStatusFilter;
      const okQuery =
        !q ||
        t.description.toLowerCase().includes(q) ||
        String(t.id).includes(q) ||
        (t.assignedTo && `${t.assignedTo.prenom} ${t.assignedTo.nom}`.toLowerCase().includes(q));
      return okStatus && okQuery;
    });
  }, [subordinateTickets, subQuery, subStatusFilter]);

  const subTotalPages = Math.max(1, Math.ceil(filteredSubTickets.length / subPageSize));

  useEffect(() => {
    setSubPage(1);
  }, [subQuery, subStatusFilter, subPageSize]);

  const paginatedSubTickets = useMemo(() => {
    const start = (subPage - 1) * subPageSize;
    return filteredSubTickets.slice(start, start + subPageSize);
  }, [filteredSubTickets, subPage, subPageSize]);

  const displayName = user ? `${user.prenom} ${user.nom}` : "…";

  const handleLocalStatusUpdated = (id: number, newStatut: TicketStatut) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, statut: newStatut } : t)));
    setSubordinateTickets((prev) => prev.map((t) => (t.id === id ? { ...t, statut: newStatut } : t)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, statut: newStatut } : prev));
  };

  const showSubordinatesTab = user && user.codeHierarchique > 0 && user.departementId && subordinates.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header compact */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-slate-200">
        <div className="px-4 md:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/cds.png" alt="CDS Logo" className="h-8 w-auto" />
            <div className="h-6 w-px bg-slate-200" />
            <div className="leading-tight">
              <h1 className="font-semibold text-slate-800 text-sm md:text-base">Bienvenue, {displayName}</h1>
              <p className="text-[11px] text-slate-500">
                Portail de support technique
                {user && user.codeHierarchique > 0 && ` • Niveau hiérarchique: ${user.codeHierarchique}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs md:text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Onglets compacts */}
        <div className="px-4 md:px-6 border-t border-slate-200">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("form")}
              className={`px-3 md:px-4 py-2 text-sm border-b-2 ${
                activeTab === "form"
                  ? "border-orange-500 text-orange-700"
                  : "border-transparent text-slate-600 hover:text-slate-800"
              }`}
            >
              Faire une demande
            </button>
            <button
              onClick={() => setActiveTab("tickets")}
              className={`px-3 md:px-4 py-2 text-sm border-b-2 ${
                activeTab === "tickets"
                  ? "border-blue-500 text-blue-700"
                  : "border-transparent text-slate-600 hover:text-slate-800"
              }`}
            >
              Mes tickets
            </button>
            {showSubordinatesTab && (
              <button
                onClick={() => {
                  setActiveTab("subordinates");
                  setSelectedSubordinate(null);
                  setSubordinateTickets([]);
                }}
                className={`px-3 md:px-4 py-2 text-sm border-b-2 ${
                  activeTab === "subordinates"
                    ? "border-green-500 text-green-700"
                    : "border-transparent text-slate-600 hover:text-slate-800"
                }`}
              >
                Mon équipe ({subordinates.length})
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main plus dense et plus large */}
      <main className="px-4 md:px-6 py-4">
        <div className="w-full max-w-6xl mx-auto">
          {/* —— Form —— */}
          {activeTab === "form" && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 md:p-5">
              <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-3">Nouvelle demande</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() =>
                    setTicketForm((f) => ({
                      ...f,
                      typeTicket: "ASSISTANCE",
                      materielId: "",
                    }))
                  }
                  className={`text-left border rounded-md p-3 transition ${
                    ticketForm.typeTicket === "ASSISTANCE"
                      ? "border-blue-500 bg-blue-50/50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-medium text-slate-800">Assistance</div>
                  <div className="text-xs text-slate-600">Besoin logiciel / bureautique</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setTicketForm((f) => ({
                      ...f,
                      typeTicket: "INTERVENTION",
                      applicationId: "",
                    }))
                  }
                  className={`text-left border rounded-md p-3 transition ${
                    ticketForm.typeTicket === "INTERVENTION"
                      ? "border-purple-500 bg-purple-50/50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-medium text-slate-800">Intervention</div>
                  <div className="text-xs text-slate-600">Panne matérielle avec déplacement</div>
                </button>
              </div>

              <div className="grid gap-2 mb-3">
                {ticketForm.typeTicket === "ASSISTANCE" && (
                  <>
                    <label className="text-xs font-medium text-slate-700">Application (optionnel)</label>
                    <select
                      name="applicationId"
                      value={ticketForm.applicationId ?? ""}
                      onChange={handleChange}
                      className="border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none rounded-md px-3 py-2 text-sm bg-white"
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
                    <label className="text-xs font-medium text-slate-700">Matériel (optionnel)</label>
                    <select
                      name="materielId"
                      value={ticketForm.materielId ?? ""}
                      onChange={handleChange}
                      className="border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none rounded-md px-3 py-2 text-sm bg-white"
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

              <div className="grid gap-2">
                <label htmlFor="description" className="text-xs font-medium text-slate-700">
                  Décrivez votre besoin
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Ex. : Mon imprimante ne répond plus malgré le redémarrage."
                  value={ticketForm.description}
                  onChange={handleChange}
                  className="border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none rounded-md px-3 py-2 min-h-[96px] text-sm text-slate-800 placeholder:text-slate-400"
                  required
                />
              </div>

              <div className="grid gap-2 mt-3">
                <label htmlFor="fileInput" className="text-xs font-medium text-slate-700">Joindre des fichiers</label>
                <input
                  id="fileInput"
                  name="files"
                  type="file"
                  multiple
                  onChange={handleFiles}
                  className="border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none rounded-md px-3 py-2 text-sm bg-white"
                  accept=".pdf,.png,.jpg,.jpeg,.txt,.log,.doc,.docx,.xlsx,.csv"
                />

                {filesError && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                    {filesError}
                  </div>
                )}

                {files.length > 0 && !filesError && (
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
                <p className="text-[11px] text-slate-500">Formats : PDF, images, Office, TXT/LOG • Max 10 Mo par fichier, {MAX_FILES} fichiers</p>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
                  disabled={!!filesError}
                >
                  Envoyer la demande
                </button>
              </div>
            </div>
          )}

          {/* —— Mes Tickets —— */}
          {activeTab === "tickets" && (
            <div className="flex flex-col gap-3">
              <div className="sticky top-[81px] z-40 bg-white/95 backdrop-blur border border-slate-200 rounded-md p-2">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm md:text-base font-semibold text-slate-800">Suivi de mes demandes</h2>
                    <span className="hidden md:inline text-xs text-slate-500">({tickets.length})</span>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-2">
                    <input
                      type="search"
                      placeholder="Rechercher..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="h-9 w-[160px] md:w-[220px] rounded-md border border-slate-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as "ALL" | TicketStatut)}
                      className="h-9 rounded-md border border-slate-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="ALL">Tous</option>
                      <option value="OPEN">Ouverts</option>
                      <option value="IN_PROGRESS">En cours</option>
                      <option value="A_CLOTURER">À clôturer</option>
                      <option value="CLOSED">Clôturés</option>
                    </select>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-500">Afficher</span>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value) as 5 | 10 | 20 | 50)}
                        className="h-9 rounded-md border border-slate-300 px-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                      <span className="text-[11px] text-slate-500">par page</span>
                    </div>

                    <button
                      onClick={fetchMyTickets}
                      className="h-9 text-sm rounded-md border border-slate-300 px-3 hover:bg-slate-50 bg-white transition-colors"
                      title="Actualiser"
                    >
                      ⟳
                    </button>
                  </div>
                </div>
              </div>

              {!user && (
                <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-600">
                  Chargement de votre session…
                </div>
              )}

              {user && loading && (
                <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-600">
                  Chargement…
                </div>
              )}

              {user && !loading && paginated.length === 0 && (
                <div className="rounded-md border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500 text-sm text-center">
                  Aucune demande pour le moment
                </div>
              )}

              {user && !loading && paginated.length > 0 && (
                <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <ul className="max-h-[520px] overflow-y-auto divide-y divide-slate-100">
                    {paginated.map((t) => (
                      <li
                        key={t.id}
                        onClick={() => setSelected(t)}
                        className="cursor-pointer px-4 py-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-0.5">
                              <span className="font-mono">#{t.id}</span>
                              <span>•</span>
                              <span>{new Date(t.dateCreation).toLocaleString()}</span>
                            </div>
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {t.description || "(Sans titre)"}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span
                                className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                  t.type === "ASSISTANCE"
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "bg-purple-50 text-purple-700 border border-purple-200"
                                }`}
                              >
                                {t.type === "ASSISTANCE" ? "Assistance" : "Intervention"}
                              </span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                                {t.assignedTo ? `${t.assignedTo.prenom} ${t.assignedTo.nom}` : "Non assigné"}
                              </span>
                            </div>
                          </div>
                          <StatusChip statut={t.statut} />
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-sm">
                    <span className="text-slate-600">
                      Page {page} / {totalPages} • {filtered.length} demande{filtered.length > 1 ? "s" : ""} • {pageSize}/page
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                      >
                        ← Précédent
                      </button>
                      <button
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="px-3 py-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                      >
                        Suivant →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* —— Mon équipe (subordonnés) —— */}
          {activeTab === "subordinates" && (
            <div className="flex flex-col gap-3">
              {!selectedSubordinate ? (
                <>
                  <div className="bg-white border border-slate-200 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <h2 className="text-base font-semibold text-slate-800">
                        Mon équipe ({subordinates.length})
                      </h2>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      Vous pouvez consulter les tickets des personnes de votre équipe. Cliquez sur un membre pour voir ses tickets.
                    </p>

                    {loadingSubordinates && (
                      <div className="text-sm text-slate-500 p-4 text-center">Chargement...</div>
                    )}

                    {!loadingSubordinates && subordinates.length === 0 && (
                      <div className="text-sm text-slate-500 p-4 text-center border-2 border-dashed border-slate-200 rounded-md">
                        Aucun membre d'équipe sous votre supervision
                      </div>
                    )}

                    {!loadingSubordinates && subordinates.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {subordinates.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setSelectedSubordinate(sub);
                              fetchSubordinateTickets(sub.id);
                            }}
                            className="text-left border border-slate-200 rounded-lg p-4 hover:border-green-400 hover:bg-green-50/30 transition-all group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-slate-800 group-hover:text-green-700">
                                  {sub.prenom} {sub.nom}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5 truncate">{sub.email}</div>
                                {sub.departement && (
                                  <div className="text-xs text-slate-500 mt-1">
                                    📁 {sub.departement.nom}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                                  Code {sub.codeHierarchique}
                                </span>
                                <svg className="w-5 h-5 text-slate-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Vue des tickets du subordonné */}
                  <div className="bg-white border border-slate-200 rounded-md p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedSubordinate(null);
                            setSubordinateTickets([]);
                            setSubQuery("");
                            setSubStatusFilter("ALL");
                            setSubPage(1);
                          }}
                          className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-50"
                          title="Retour à la liste"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <div>
                          <h3 className="text-base font-semibold text-slate-800">
                            Tickets de {selectedSubordinate.prenom} {selectedSubordinate.nom}
                          </h3>
                          <p className="text-xs text-slate-500">{selectedSubordinate.email}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                        Code {selectedSubordinate.codeHierarchique}
                      </span>
                    </div>
                  </div>

                  <div className="sticky top-[81px] z-40 bg-white/95 backdrop-blur border border-slate-200 rounded-md p-2">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">
                          {subordinateTickets.length} ticket{subordinateTickets.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex-1" />
                      <div className="flex items-center gap-2">
                        <input
                          type="search"
                          placeholder="Rechercher..."
                          value={subQuery}
                          onChange={(e) => setSubQuery(e.target.value)}
                          className="h-9 w-[160px] md:w-[220px] rounded-md border border-slate-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500"
                        />
                        <select
                          value={subStatusFilter}
                          onChange={(e) => setSubStatusFilter(e.target.value as "ALL" | TicketStatut)}
                          className="h-9 rounded-md border border-slate-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-100"
                        >
                          <option value="ALL">Tous</option>
                          <option value="OPEN">Ouverts</option>
                          <option value="IN_PROGRESS">En cours</option>
                          <option value="A_CLOTURER">À clôturer</option>
                          <option value="CLOSED">Clôturés</option>
                        </select>

                        <button
                          onClick={() => selectedSubordinate && fetchSubordinateTickets(selectedSubordinate.id)}
                          className="h-9 text-sm rounded-md border border-slate-300 px-3 hover:bg-slate-50 bg-white transition-colors"
                          title="Actualiser"
                        >
                          ⟳
                        </button>
                      </div>
                    </div>
                  </div>

                  {loadingSubTickets && (
                    <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-600">
                      Chargement des tickets...
                    </div>
                  )}

                  {!loadingSubTickets && paginatedSubTickets.length === 0 && (
                    <div className="rounded-md border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500 text-sm text-center">
                      Aucun ticket trouvé
                    </div>
                  )}

                  {!loadingSubTickets && paginatedSubTickets.length > 0 && (
                    <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <ul className="max-h-[520px] overflow-y-auto divide-y divide-slate-100">
                        {paginatedSubTickets.map((t) => (
                          <li
                            key={t.id}
                            onClick={() => setSelected(t)}
                            className="cursor-pointer px-4 py-3 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-0.5">
                                  <span className="font-mono">#{t.id}</span>
                                  <span>•</span>
                                  <span>{new Date(t.dateCreation).toLocaleString()}</span>
                                </div>
                                <p className="text-sm font-medium text-slate-800 truncate">
                                  {t.description || "(Sans titre)"}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  <span
                                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                      t.type === "ASSISTANCE"
                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                        : "bg-purple-50 text-purple-700 border border-purple-200"
                                    }`}
                                  >
                                    {t.type === "ASSISTANCE" ? "Assistance" : "Intervention"}
                                  </span>
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                                    {t.assignedTo ? `${t.assignedTo.prenom} ${t.assignedTo.nom}` : "Non assigné"}
                                  </span>
                                </div>
                              </div>
                              <StatusChip statut={t.statut} />
                            </div>
                          </li>
                        ))}
                      </ul>

                      <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-sm">
                        <span className="text-slate-600">
                          Page {subPage} / {subTotalPages} • {filteredSubTickets.length} ticket{filteredSubTickets.length > 1 ? "s" : ""} • {subPageSize}/page
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            disabled={subPage === 1}
                            onClick={() => setSubPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                          >
                            ← Précédent
                          </button>
                          <button
                            disabled={subPage === subTotalPages}
                            onClick={() => setSubPage((p) => Math.min(subTotalPages, p + 1))}
                            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                          >
                            Suivant →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Drawer ticket */}
        <TicketDrawer
          ticket={selected}
          onClose={() => setSelected(null)}
          user={user}
          onStatusUpdated={handleLocalStatusUpdated}
        />
      </main>
    </div>
  );
}

function StatusChip({ statut }: { statut: TicketStatut }) {
  const map = {
    OPEN: { label: "Ouvert", cls: "bg-yellow-50 text-yellow-700 border-yellow-300", icon: "" },
    IN_PROGRESS: { label: "En cours", cls: "bg-blue-50 text-blue-700 border-blue-300", icon: "" },
    A_CLOTURER: { label: "À clôturer", cls: "bg-violet-50 text-violet-700 border-violet-300", icon: "" },
    CLOSED: { label: "Clôturé", cls: "bg-emerald-50 text-emerald-700 border-emerald-300", icon: "" },
    TRANSFERE_MANTICE: { label: "Transféré à Mantice", cls: "bg-orange-50 text-orange-700 border-orange-300", icon: "" }, // AJOUT
  } as const;
  const s = map[statut];
  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${s.cls} flex items-center gap-1.5`}>
      <span>{s.icon}</span>
      {s.label}
    </span>
  );
}

function TicketDrawer({
  ticket,
  onClose,
  user,
  onStatusUpdated,
}: {
  ticket: Ticket | null;
  onClose: () => void;
  user: { id: number; prenom: string; nom: string; role: string } | null;
  onStatusUpdated: (id: number, newStatut: TicketStatut) => void;
}) {
  const [pj, setPj] = useState<PieceJointe[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [closing, setClosing] = useState(false);

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

const stepIndex =
  ticket.statut === "CLOSED" ? 4 :
  ticket.statut === "A_CLOTURER" ? 3 :
  ticket.statut === "IN_PROGRESS" ? 2 :
  ticket.statut === "TRANSFERE_MANTICE" ? 2 : // AJOUT : considéré comme "En cours"
  ticket.assignedTo ? 1 : 0;

  // ✅ Afficher le bouton pour tout ticket A_CLOTURER (l’API vérifiera que le user est bien le créateur)
  const canClose = ticket.statut === "A_CLOTURER";

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
      auteur: { id: user.id, prenom: (user as any).prenom || "Vous", nom: (user as any).nom || "" },
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

  const handleCloseTicket = async () => {
    if (!canClose) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setClosing(true);
    try {
      const res = await fetch(`/api/employee/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statut: "CLOSED" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Impossible de clôturer ce ticket");
        return;
      }

      const normalized = normalizeTicket(data);
      onStatusUpdated(normalized.id, normalized.statut);
      alert("Ticket clôturé avec succès !");
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la clôture du ticket");
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl border-l border-slate-200 p-4 md:p-5 flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
            <h3 className="text-base font-semibold text-slate-800">Ticket #{ticket.id}</h3>
          </div>

          <div className="flex items-center gap-2">
            {canClose && (
              <button
                onClick={handleCloseTicket}
                disabled={closing}
                className="rounded-md bg-emerald-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                title="Clôturer ce ticket"
              >
                {closing ? "Clôture…" : "Clôturer"}
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors"
            >
              ✕ Fermer
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 pb-3 border-b border-slate-100">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(ticket.dateCreation).toLocaleString()}
          </span>
          <span>•</span>
          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${ticket.type === "ASSISTANCE" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
            {ticket.type}
          </span>
          {ticket.createdBy && (
            <>
              <span>•</span>
              <span className="truncate">Par: {ticket.createdBy.prenom} {ticket.createdBy.nom}</span>
            </>
          )}
        </div>

        <div className="bg-slate-50 rounded-md p-3 mb-4">
          <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
        </div>

        <div className="mb-4 bg-white border border-slate-200 rounded-md p-3">
          <h4 className="text-sm font-semibold text-slate-800 mb-2.5">Progression</h4>

          <div className="relative flex items-center">
            <div className="absolute left-4 right-4 h-1 bg-slate-200 rounded-full" />
            <div
              className="absolute left-4 h-1 bg-blue-500 rounded-full transition-all"
              style={{ width: `calc(${(stepIndex / (4)) * 100}% - 1rem)` }}
            />
            <div className="w-full flex justify-between">
              {["Créé", "Assigné", "En cours", "À clôturer", "Clôturé"].map((lbl, i) => {
                const active = i <= stepIndex;
                const current = i === stepIndex;
                return (
                  <div key={lbl} className="flex flex-col items-center gap-1" style={{ minWidth: 0 }}>
                    <div
                      className={`h-3.5 w-3.5 rounded-full border ${
                        active ? "bg-blue-500 border-blue-600" : "bg-white border-slate-300"
                      } ${current ? "ring-4 ring-blue-100" : ""}`}
                    />
                    <span className={`text-[10px] text-center truncate ${active ? "text-slate-700" : "text-slate-400"}`} title={lbl}>
                      {lbl}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>
              Technicien assigné : {ticket.assignedTo ? `${ticket.assignedTo.prenom} ${ticket.assignedTo.nom}` : "En attente d'attribution"}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <h4 className="text-sm font-semibold text-slate-800">Pièces jointes</h4>
          </div>
          {loading && <div className="text-xs text-slate-500 bg-slate-50 rounded-md p-2">Chargement…</div>}
          {!loading && pj.length === 0 && (
            <div className="text-xs text-slate-500 bg-slate-50 rounded-md p-2 text-center">Aucune pièce jointe</div>
          )}
          {!loading && pj.length > 0 && (
            <ul className="space-y-2">
              {pj.map((f) => (
                <li key={f.id}>
                  <a
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md p-2 transition-colors border border-slate-200"
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

        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
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
              className="text-xs rounded-md border border-slate-300 px-2.5 py-1 hover:bg-slate-50 transition-colors"
              title="Actualiser les commentaires"
            >
              ⟳
            </button>
          </div>

          {loadingComments && <div className="text-xs text-slate-500 bg-slate-50 rounded-md p-2">Chargement…</div>}

          {comments.length === 0 && !loadingComments ? (
            <div className="text-xs text-slate-500 bg-slate-50 rounded-md p-3 text-center mb-3">
              Aucun commentaire pour le moment
            </div>
          ) : (
            <ul className="space-y-2 mb-3 flex-1 overflow-y-auto">
              {comments.map((c) => (
                <li key={c.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
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

          <div className="border-t border-slate-200 pt-3 mt-auto">
            <label className="text-[11px] font-medium text-slate-700 mb-1.5 block">Ajouter un commentaire</label>
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="w-full min-h-[84px] border border-slate-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 mb-2"
              placeholder="Précisions, compléments, captures envoyées, etc."
              maxLength={4000}
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">{commentInput.length} / 4000</span>
              <button
                onClick={handleAddComment}
                disabled={sending || commentInput.trim().length < 2}
                className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
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
