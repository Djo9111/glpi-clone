"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type UserMin = { id: number; prenom: string; nom: string };
type Ticket = {
  id: number;
  description: string;
  type: "ASSISTANCE" | "INTERVENTION";
  statut: "OPEN" | "IN_PROGRESS" | "CLOSED";
  dateCreation: string;
  createdBy: UserMin;
  assignedTo?: UserMin | null;
  departement?: { id: number; nom: string } | null;
};

type PieceJointe = { id: number; nomFichier: string; url: string };

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; role: string } | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [techniciens, setTechniciens] = useState<UserMin[]>([]);
  const [pjs, setPjs] = useState<PieceJointe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPj, setLoadingPj] = useState(false);

  // Auth + rôle
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "CHEF_DSI") { alert("Accès refusé !"); router.push("/login"); return; }
      setUser(payload);
    } catch { router.push("/login"); }
  }, [router]);

  const fetchDatas = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const [tRes, techRes] = await Promise.all([
        fetch(`/api/admin/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        fetch(`/api/admin/techniciens`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
      ]);
      const [tData, techData] = await Promise.all([tRes.json(), techRes.json()]);
      if (tRes.ok) setTicket(tData);
      setTechniciens(techData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }

    // Pièces jointes
    try {
      setLoadingPj(true);
      const pjRes = await fetch(`/api/tickets/${id}/pieces-jointes`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const pjData = await pjRes.json();
      setPjs(Array.isArray(pjData) ? pjData : []);
    } catch (e) {
      console.error(e);
      setPjs([]);
    } finally {
      setLoadingPj(false);
    }
  }, [id]);

  useEffect(() => { fetchDatas(); }, [fetchDatas]);

  const handleAssign = async (technicienId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assignedToId: technicienId }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Erreur d’assignation"); return; }
      setTicket(data);
      alert("Technicien assigné !");
    } catch (e) { console.error(e); alert("Erreur lors de l’assignation"); }
  };

  const handleStatusChange = async (newStatus: Ticket["statut"]) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statut: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Erreur statut"); return; }
      setTicket(data);
      alert("Statut mis à jour !");
    } catch (e) { console.error(e); alert("Erreur lors de la mise à jour du statut"); }
  };

  if (!user) return <p className="text-center mt-10 text-neutral-600">Chargement…</p>;
  if (loading) return <p className="text-center mt-10 text-neutral-600">Chargement du ticket…</p>;
  if (!ticket) return <p className="text-center mt-10 text-red-600">Ticket introuvable.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50/40">
      <header className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-amber-100">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Ticket #{ticket.id}</h1>
            <p className="text-xs text-neutral-500">
              Créé le {new Date(ticket.dateCreation).toLocaleString()} • {ticket.type}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/admin-tickets" className="px-3 py-2 text-sm rounded-xl border border-amber-200 hover:bg-amber-50">
              ← Retour aux tickets
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 grid gap-4 md:grid-cols-3">
        {/* Colonne gauche : détails + pièces jointes */}
        <section className="md:col-span-2 space-y-4">
          <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700">{ticket.type}</span>
              <span className="text-xs text-neutral-500">Statut: {ticket.statut}</span>
            </div>
            <p className="mt-2 text-neutral-800 whitespace-pre-wrap">{ticket.description}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600">
              <span className="rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5">
                Créé par {ticket.createdBy.prenom} {ticket.createdBy.nom}
              </span>
              <span className="rounded-full bg-white border border-amber-100 px-2 py-0.5">
                Assigné à {ticket.assignedTo ? `${ticket.assignedTo.prenom} ${ticket.assignedTo.nom}` : "—"}
              </span>
              {ticket.departement?.nom && (
                <span className="rounded-full bg-white border border-amber-100 px-2 py-0.5">
                  Dépt. {ticket.departement.nom}
                </span>
              )}
            </div>
          </div>

          {/* 📎 Pièces jointes */}
          <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-700">Pièces jointes</h3>
              <button
                onClick={fetchDatas}
                className="text-xs rounded-lg border border-amber-200 px-2 py-1 hover:bg-amber-50"
              >
                Rafraîchir
              </button>
            </div>

            {loadingPj && <div className="mt-2 text-xs text-neutral-500">Chargement…</div>}

            {!loadingPj && pjs.length === 0 && (
              <div className="mt-2 text-sm text-neutral-500">Aucune pièce jointe.</div>
            )}

            {!loadingPj && pjs.length > 0 && (
              <ul className="mt-3 space-y-1">
                {pjs.map((f) => (
                  <li key={f.id}>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-amber-700 underline hover:no-underline break-all"
                    >
                      {f.nomFichier}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Colonne droite : actions */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-700">Actions</h3>
            <div className="mt-3 grid gap-2">
              <label className="text-xs">Assigner un technicien</label>
              <select
                value={ticket.assignedTo?.id || ""}
                onChange={(e) => handleAssign(parseInt(e.target.value))}
                className="border border-amber-200 rounded-xl px-2 py-1 text-sm bg-white"
              >
                <option value="">— Sélectionner —</option>
                {techniciens.map((t) => (
                  <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>
                ))}
              </select>

              <label className="text-xs mt-3">Changer le statut</label>
              <select
                value={ticket.statut}
                onChange={(e) => handleStatusChange(e.target.value as Ticket["statut"])}
                className="border border-amber-200 rounded-xl px-2 py-1 text-sm bg-white"
              >
                <option value="OPEN">Ouvert</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="CLOSED">Clôturé</option>
              </select>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
