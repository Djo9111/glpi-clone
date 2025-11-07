"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import NotificationBell from "@/app/components/NotificationBell";
import TicketForm from "./components/employee/TicketForm";
import TicketsList from "./components/employee/TicketsList";
import TeamSection from "./components/employee/TeamSection";
import TicketDrawer from "./components/employee/TicketDrawer";
import { normalizeTicket, normalizeStatus } from "./utils/ticketHelpers";
import type { Ticket, TicketStatut, SubordinateUser, Application, Materiel, TicketForm as TicketFormType } from "./utils/ticketHelpers";

const MAX_FILES = 5;

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
  const [ticketForm, setTicketForm] = useState<TicketFormType>({
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

  // —— Filtres pour tickets des subordonnés ——
  const [subQuery, setSubQuery] = useState("");
  const [subStatusFilter, setSubStatusFilter] = useState<"ALL" | TicketStatut>("ALL");
  const [subPage, setSubPage] = useState(1);
  const [subPageSize, setSubPageSize] = useState<5 | 10 | 20 | 50>(10);

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

  const fetchSubordinates = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;

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
              className={`px-3 md:px-4 py-2 text-sm border-b-2 ${activeTab === "form"
                  ? "border-orange-500 text-orange-700"
                  : "border-transparent text-slate-600 hover:text-slate-800"
                }`}
            >
              Faire une demande
            </button>
            <button
              onClick={() => setActiveTab("tickets")}
              className={`px-3 md:px-4 py-2 text-sm border-b-2 ${activeTab === "tickets"
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
                className={`px-3 md:px-4 py-2 text-sm border-b-2 ${activeTab === "subordinates"
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
            <TicketForm
              ticketForm={ticketForm}
              files={files}
              filesError={filesError}
              applications={applications}
              materiels={materiels}
              loadingCats={loadingCats}
              onChange={handleChange}
              onFilesChange={handleFiles}
              onSubmit={handleSubmit}
            />
          )}

          {/* —— Mes Tickets —— */}
          {activeTab === "tickets" && (
            <TicketsList
              tickets={tickets}
              loading={loading}
              user={user}
              query={query}
              setQuery={setQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              page={page}
              setPage={setPage}
              pageSize={pageSize}
              setPageSize={setPageSize}
              filtered={filtered}
              paginated={paginated}
              totalPages={totalPages}
              onRefresh={fetchMyTickets}
              onSelectTicket={setSelected}
            />
          )}

          {/* —— Mon équipe (subordonnés) —— */}
          {activeTab === "subordinates" && (
            <TeamSection
              subordinates={subordinates}
              loadingSubordinates={loadingSubordinates}
              selectedSubordinate={selectedSubordinate}
              setSelectedSubordinate={setSelectedSubordinate}
              subordinateTickets={subordinateTickets}
              loadingSubTickets={loadingSubTickets}
              subQuery={subQuery}
              setSubQuery={setSubQuery}
              subStatusFilter={subStatusFilter}
              setSubStatusFilter={setSubStatusFilter}
              subPage={subPage}
              setSubPage={setSubPage}
              subPageSize={subPageSize}
              setSubPageSize={setSubPageSize}
              filteredSubTickets={filteredSubTickets}
              paginatedSubTickets={paginatedSubTickets}
              subTotalPages={subTotalPages}
              onFetchSubordinateTickets={fetchSubordinateTickets}
              onSelectTicket={setSelected}
            />
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