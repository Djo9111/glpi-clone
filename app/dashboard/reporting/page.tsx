"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart3, Building2, AppWindow, UserRound, Wrench, Clock3, TrendingUp } from "lucide-react";

type Role = "EMPLOYE" | "TECHNICIEN" | "CHEF_DSI";
type StatusKey = "OPEN"|"IN_PROGRESS"|"A_CLOTURER"|"REJETE"|"TRANSFERE_MANTICE"|"CLOSED";

type Reporting = {
  rangeDays: number;
  topDepartment: { id: number | "NA"; nom: string; count: number } | null;
  avgResolutionMinutes: number;
  topApplication: { id: number; nom: string; count: number } | null;
  topUser: { id: number; nomComplet: string; count: number } | null;
  topMateriel: { id: number; nom: string; count: number } | null;
  statuses: { statut: StatusKey; count: number }[];
  seriesDailyTickets: { date: string; count: number }[];
};

export default function ReportingDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; role: Role } | null>(null);
  const [range, setRange] = useState(30);
  const [data, setData] = useState<Reporting | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "CHEF_DSI") { alert("Accès refusé !"); router.push("/login"); return; }
      setUser({ id: payload.id, role: payload.role });
    } catch { router.push("/login"); }
  }, [router]);

  const load = async (days: number) => {
    setLoading(true); setErr(null);
    try {
      const token = localStorage.getItem("token")!;
      const res = await fetch(`/api/reporting?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Erreur HTTP ${res.status}`);
      setData(json);
    } catch (e: any) {
      setErr(e.message || "Erreur de chargement");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(range); }, [user, range]);

  const totalTickets = useMemo(() => data?.statuses.reduce((a,b)=>a+b.count,0) ?? 0, [data]);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
        <p className="text-slate-600">Chargement…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BarChart3 className="h-6 w-6 text-slate-800" />
            <h1 className="text-lg font-semibold text-slate-900">Tableau de bord — Reporting</h1>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={range}
              onChange={(e)=>setRange(Number(e.target.value))}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm bg-white"
              title="Période"
            >
              <option value={7}>7 jours</option>
              <option value={30}>30 jours</option>
              <option value={90}>90 jours</option>
            </select>
            <Link
              href="/dashboard/admin-entities"
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Admin entités
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl w-full px-6 py-6 space-y-8">
        {err && <div className="rounded-lg px-4 py-3 text-sm border bg-rose-50 border-rose-200 text-rose-800">{err}</div>}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<Building2 className="h-5 w-5" />}
            label="Département le plus problématique"
            value={data?.topDepartment ? `${data.topDepartment.nom}` : "—"}
            sub={data?.topDepartment ? `${data.topDepartment.count} ticket(s)` : ""}
          />
          <KpiCard
            icon={<Clock3 className="h-5 w-5" />}
            label="Temps moyen de traitement"
            value={data ? fmtMinutes(data.avgResolutionMinutes) : "—"}
            sub="tickets clôturés"
          />
          <KpiCard
            icon={<AppWindow className="h-5 w-5" />}
            label="Application la plus problématique"
            value={data?.topApplication ? data.topApplication.nom : "—"}
            sub={data?.topApplication ? `${data.topApplication.count} ticket(s)` : ""}
          />
          <KpiCard
            icon={<UserRound className="h-5 w-5" />}
            label="Utilisateur le plus demandeur"
            value={data?.topUser ? data.topUser.nomComplet : "—"}
            sub={data?.topUser ? `${data.topUser.count} ticket(s)` : ""}
          />
        </div>

        {/* Répartition par statut + total */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-900">Répartition des statuts</div>
              <div className="text-xs text-slate-500">{totalTickets} ticket(s)</div>
            </div>
            <div className="space-y-3">
              {data?.statuses.map((s) => (
                <div key={s.statut}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{statusLabel(s.statut)}</span>
                    <span className="font-medium">{s.count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded">
                    <div
                      className="h-2 rounded bg-slate-800"
                      style={{ width: `${totalTickets ? (s.count / totalTickets) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
              {!data && loading && <div className="text-sm text-slate-500">Chargement…</div>}
            </div>
          </div>

          {/* Tendance 30j : mini bar chart CSS */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-900">Tendance quotidienne (tickets)</div>
              <TrendingUp className="h-4 w-4 text-slate-500" />
            </div>
            {data ? (
              <div className="h-32 flex items-end gap-1">
                {data.seriesDailyTickets.map((d) => {
                  const max = Math.max(...data.seriesDailyTickets.map(s => s.count), 1);
                  const h = Math.round((d.count / max) * 100);
                  return (
                    <div key={d.date} className="flex-1 bg-slate-100 rounded">
                      <div title={`${d.date}: ${d.count}`}
                        className="w-full bg-slate-800 rounded-b"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-slate-500">Chargement…</div>
            )}
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>{data?.seriesDailyTickets[0]?.date ?? ""}</span>
              <span>{data?.seriesDailyTickets.at(-1)?.date ?? ""}</span>
            </div>
          </div>
        </div>

        {/* Enrichissements optionnels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SimpleCard
            title="Top matériel (si renseigné)"
            rows={data?.topMateriel ? [[data.topMateriel.nom, `${data.topMateriel.count}`]] : []}
            empty="Aucune donnée matériel"
            icon={<Wrench className="h-4 w-4 text-slate-600" />}
          />
          <SimpleCard
            title="Top 5 jours les plus chargés"
            rows={(data ? [...data.seriesDailyTickets].sort((a,b)=>b.count-a.count).slice(0,5) : [])
              .map(x => [x.date, `${x.count}`])}
            empty="Pas de données"
            icon={<BarChart3 className="h-4 w-4 text-slate-600" />}
          />
        </div>
      </main>
    </div>
  );
}

function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-lg bg-slate-100">{icon}</div>
        <div className="text-xs text-slate-500">{sub}</div>
      </div>
      <div className="mt-3 text-sm text-slate-500">{label}</div>
      <div className="text-xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function SimpleCard({ title, rows, empty, icon }:{ title: string; rows: string[][]; empty: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <div className="text-sm font-semibold text-slate-900">{title}</div>
      </div>
      {rows.length === 0 ? (
        <div className="text-sm text-slate-500">{empty}</div>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t first:border-t-0 border-slate-100">
                <td className="py-2 pr-3 text-slate-700">{r[0]}</td>
                <td className="py-2 text-right font-medium">{r[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function statusLabel(s: StatusKey) {
  switch (s) {
    case "OPEN": return "Ouvert";
    case "IN_PROGRESS": return "En cours";
    case "A_CLOTURER": return "À clôturer";
    case "REJETE": return "Rejeté";
    case "TRANSFERE_MANTICE": return "Transféré MANTICE";
    case "CLOSED": return "Clôturé";
    default: return s;
  }
}
function fmtMinutes(m: number) {
  if (!m || m <= 0) return "0 min";
  const h = Math.floor(m/60);
  const r = m % 60;
  return h ? `${h}h ${r}min` : `${r} min`;
}
