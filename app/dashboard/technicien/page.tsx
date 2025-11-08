"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import TicketsTable from "@/app/components/techniciens/TicketsTable";
import TicketModal from "@/app/components/techniciens/TicketModal";
import NotificationBell from "@/app/components/NotificationBell";
import { statusLabel, normalizeTicket, type Ticket } from "@/app/dashboard/technicien/utils/ticketHelpers";
import { ClickableStatCard } from "@/app/components/techniciens/ClickableStatCard";

export default function TechnicianTicketsDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; prenom: string; nom: string; role: string } | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  const [statusFilter, setStatusFilter] = useState<Ticket["statut"] | "ALL">("ALL");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [loggingOut, setLoggingOut] = useState(false);

  // Authentication effect
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
    } catch {
      router.push("/login");
    }
  }, [router]);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/technicien/tickets", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Erreur récupération des tickets");
        return;
      }
      const list = Array.isArray(data) ? data.map(normalizeTicket) : [];
      setTickets(list);
    } catch (e) {
      console.error(e);
      alert("Erreur récupération des tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchTickets();
  }, [user, fetchTickets]);

  // Apply updated ticket to state
  const applyUpdatedTicket = (updated: any) => {
    const normalized = normalizeTicket(updated);
    setTickets((prev) => prev.map((t) => (t.id === normalized.id ? normalized : t)));
    setActiveTicket((prev) => (prev && prev.id === normalized.id ? normalized : prev));
  };

  // Modal handlers
  const openModal = (ticket: Ticket) => {
    setActiveTicket(ticket);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveTicket(null);
  };

  // Logout handler
  const handleLogout = async () => {
    setLoggingOut(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.removeItem("token");
    router.push("/login");
  };

  // Computed values
  const stats = useMemo(() => ({
    OPEN: tickets.filter((t) => t.statut === "OPEN").length,
    IN_PROGRESS: tickets.filter((t) => t.statut === "IN_PROGRESS").length,
    A_CLOTURER: tickets.filter((t) => t.statut === "A_CLOTURER").length,
    REJETE: tickets.filter((t) => t.statut === "REJETE").length,
    TRANSFERE_MANTICE: tickets.filter((t) => t.statut === "TRANSFERE_MANTICE").length,
    CLOSED: tickets.filter((t) => t.statut === "CLOSED").length,
  }), [tickets]);

  const filteredTickets = useMemo(() => {
    if (statusFilter === "ALL") return tickets;
    return tickets.filter((t) => t.statut === statusFilter);
  }, [tickets, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/cds.png" alt="CDS" className="h-8 w-auto" />
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Mes Tickets</h1>
              <p className="text-sm text-slate-500">{user.prenom} {user.nom}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              onClick={fetchTickets}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {loading ? "Chargement..." : "Rafraîchir"}
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs md:text-sm font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loggingOut ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-600"></div>
                  Déconnexion...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Déconnexion
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl w-full px-6 py-6 space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <ClickableStatCard
            label="Ouverts"
            count={stats.OPEN}
            icon="Clock"
            color="amber"
            isActive={statusFilter === "OPEN"}
            onClick={() => setStatusFilter("OPEN")}
          />
          <ClickableStatCard
            label="En cours"
            count={stats.IN_PROGRESS}
            icon="PlayCircle"
            color="blue"
            isActive={statusFilter === "IN_PROGRESS"}
            onClick={() => setStatusFilter("IN_PROGRESS")}
          />
          <ClickableStatCard
            label="À clôturer"
            count={stats.A_CLOTURER}
            icon="CheckCircle2"
            color="violet"
            isActive={statusFilter === "A_CLOTURER"}
            onClick={() => setStatusFilter("A_CLOTURER")}
          />
          <ClickableStatCard
            label="Rejetés"
            count={stats.REJETE}
            icon="XCircle"
            color="rose"
            isActive={statusFilter === "REJETE"}
            onClick={() => setStatusFilter("REJETE")}
          />
          <ClickableStatCard
            label="Transférés"
            count={stats.TRANSFERE_MANTICE}
            icon="Send"
            color="indigo"
            isActive={statusFilter === "TRANSFERE_MANTICE"}
            onClick={() => setStatusFilter("TRANSFERE_MANTICE")}
          />
          <ClickableStatCard
            label="Clôturés"
            count={stats.CLOSED}
            icon="Archive"
            color="emerald"
            isActive={statusFilter === "CLOSED"}
            onClick={() => setStatusFilter("CLOSED")}
          />
        </div>

        {/* Reset filter button */}
        {statusFilter !== "ALL" && (
          <div className="flex justify-center">
            <button
              onClick={() => setStatusFilter("ALL")}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ✕ Afficher tous mes tickets
            </button>
          </div>
        )}

        {/* Tickets table */}
        <TicketsTable
          tickets={filteredTickets}
          loading={loading}
          statusFilter={statusFilter}
          pageSize={pageSize}
          page={page}
          totalTickets={tickets.length}
          onPageSizeChange={setPageSize}
          onPageChange={setPage}
          onTicketClick={openModal}
        />

        {/* Modal */}
        {modalOpen && activeTicket && (
          <TicketModal
            ticket={activeTicket}
            onClose={closeModal}
            onTicketUpdate={applyUpdatedTicket}
          />
        )}
      </main>
    </div>
  );
}