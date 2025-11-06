"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart3, Building2, AppWindow, UserRound, Clock, TrendingUp, AlertCircle, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, Wrench } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Role = "EMPLOYE" | "TECHNICIEN" | "CHEF_DSI";
type StatusKey = "OPEN"|"IN_PROGRESS"|"A_CLOTURER"|"REJETE"|"TRANSFERE_MANTICE"|"CLOSED";

type TopItem = { id: number | string; nom?: string; nomComplet?: string; count: number };

type Reporting = {
  rangeDays: number;
  topDepartment: TopItem | null;
  topDepartments: TopItem[];
  avgResolutionMinutes: number;
  topApplication: TopItem | null;
  topApplications: TopItem[];
  topUser: TopItem | null;
  topUsers: TopItem[];
  topMateriel: TopItem | null;
  topMateriels: TopItem[];
  statuses: { statut: StatusKey; count: number }[];
  seriesDailyTickets: { date: string; count: number }[];
  seriesWeeklyTickets: { date: string; count: number }[];
};

export default function ReportingDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; role: Role } | null>(null);
  const [range, setRange] = useState(30);
  const [viewMode, setViewMode] = useState<"daily"|"weekly">("weekly");
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
  
  const metrics = useMemo(() => {
    if (!data) return null;
    const open = data.statuses.find(s => s.statut === "OPEN")?.count ?? 0;
    const inProgress = data.statuses.find(s => s.statut === "IN_PROGRESS")?.count ?? 0;
    const closed = data.statuses.find(s => s.statut === "CLOSED")?.count ?? 0;
    const rejected = data.statuses.find(s => s.statut === "REJETE")?.count ?? 0;
    
    const activeTickets = open + inProgress;
    const resolutionRate = totalTickets > 0 ? Math.round((closed / totalTickets) * 100) : 0;
    const rejectionRate = totalTickets > 0 ? Math.round((rejected / totalTickets) * 100) : 0;
    
    return { activeTickets, resolutionRate, rejectionRate, closed, open };
  }, [data, totalTickets]);

  const chartData = useMemo(() => {
    if (!data) return [];
    if (viewMode === "weekly") {
      return data.seriesWeeklyTickets.map(d => ({
        label: `Semaine du ${new Date(d.date).toLocaleDateString('fr-FR', {day:'2-digit', month:'short'})}`,
        tickets: d.count
      }));
    } else {
      return data.seriesDailyTickets.map(d => ({
        label: new Date(d.date).toLocaleDateString('fr-FR', {day:'2-digit', month:'short'}),
        tickets: d.count
      }));
    }
  }, [data, viewMode]);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-indigo-600 mb-4" />
        <p className="text-gray-600 font-medium">Chargement du tableau de bord...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600 shadow">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Tableau de bord Analytics</h1>
              <p className="text-sm text-gray-500">Vue d'ensemble des performances</p>
            </div>
          </div>
          <div>
            <Link
              href="/dashboard/admin-entities"
              className="px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm font-medium"
            >
              Admin entités
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl w-full px-6 py-8 space-y-8">
        {err && (
          <div className="rounded-lg px-5 py-4 text-sm border bg-red-50 border-red-300 text-red-800 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium">{err}</span>
          </div>
        )}

        {/* Métriques principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            icon={<AlertCircle className="h-6 w-6" />}
            label="Tickets actifs"
            value={metrics?.activeTickets.toString() ?? "—"}
            sub={metrics ? `${metrics.open} en attente` : ""}
            trend="neutral"
            color="orange"
          />
          <MetricCard
            icon={<TrendingUp className="h-6 w-6" />}
            label="Taux de résolution"
            value={metrics ? `${metrics.resolutionRate}%` : "—"}
            sub={metrics ? `${metrics.closed} clôturés` : ""}
            trend={metrics && metrics.resolutionRate >= 70 ? "up" : "neutral"}
            color="green"
          />
          <MetricCard
            icon={<Clock className="h-6 w-6" />}
            label="Temps moyen"
            value={data ? fmtMinutes(data.avgResolutionMinutes) : "—"}
            sub="de traitement"
            trend="neutral"
            color="blue"
          />
          <MetricCard
            icon={<XCircle className="h-6 w-6" />}
            label="Taux de rejet"
            value={metrics ? `${metrics.rejectionRate}%` : "—"}
            sub={`sur ${totalTickets} tickets`}
            trend={metrics && metrics.rejectionRate > 10 ? "down" : "neutral"}
            color="red"
          />
        </div>

        {/* Graphique des demandes */}
        <div className="bg-white rounded-lg border border-gray-200 shadow overflow-hidden">
          <div className="bg-gray-50 px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Évolution des demandes</h3>
                <p className="text-sm text-gray-500 mt-0.5">Tendance sur la période sélectionnée</p>
              </div>
              <div className="flex gap-3 items-center">
                <select
                  value={range}
                  onChange={(e)=>setRange(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm font-medium"
                  title="Période"
                >
                  <option value={3}>3 derniers jours</option>
                  <option value={7}>7 derniers jours</option>
                  <option value={30}>30 derniers jours</option>
                  <option value={90}>90 derniers jours</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("daily")}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                      viewMode === "daily" 
                        ? "bg-indigo-600 text-white shadow" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Journalier
                  </button>
                  <button
                    onClick={() => setViewMode("weekly")}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                      viewMode === "weekly" 
                        ? "bg-indigo-600 text-white shadow" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Hebdomadaire
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-gray-600 mb-2" />
                  <p className="text-sm text-gray-500">Chargement...</p>
                </div>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{fontSize: 12}} stroke="#6b7280" />
                  <YAxis tick={{fontSize: 12}} stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    cursor={{fill: 'rgba(99, 102, 241, 0.1)'}}
                  />
                  <Legend wrapperStyle={{fontSize: 14}} />
                  <Bar dataKey="tickets" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Nombre de tickets" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-400">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>

        {/* TOP 5 sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Top5Card
            title="Top 5 Départements"
            icon={<Building2 className="h-5 w-5 text-indigo-600" />}
            items={data?.topDepartments ?? []}
            bgColor="bg-indigo-50"
            total={totalTickets}
          />
          <Top5Card
            title="Top 5 Utilisateurs"
            icon={<UserRound className="h-5 w-5 text-teal-600" />}
            items={data?.topUsers.map(u => ({...u, nom: u.nomComplet})) ?? []}
            bgColor="bg-teal-50"
            total={totalTickets}
          />
          <Top5Card
            title="Top 5 Applications"
            icon={<AppWindow className="h-5 w-5 text-purple-600" />}
            items={data?.topApplications ?? []}
            bgColor="bg-purple-50"
            total={totalTickets}
          />
          <Top5Card
            title="Top 5 Matériels"
            icon={<Wrench className="h-5 w-5 text-amber-600" />}
            items={data?.topMateriels ?? []}
            bgColor="bg-amber-50"
            total={totalTickets}
          />
        </div>

        {/* Distribution des statuts */}
        <div className="bg-white rounded-lg border border-gray-200 shadow overflow-hidden">
          <div className="bg-gray-50 px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Distribution des statuts</h3>
                <p className="text-sm text-gray-500 mt-0.5">Aperçu de l'état des tickets</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{totalTickets}</div>
                <div className="text-xs text-gray-500">tickets totaux</div>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {data?.statuses.map((s) => {
              const percentage = totalTickets ? Math.round((s.count / totalTickets) * 100) : 0;
              const config = getStatusConfig(s.statut);
              return (
                <div key={s.statut} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${config.bgLight}`}>
                        {config.icon}
                      </div>
                      <span className="font-medium text-gray-700">{statusLabel(s.statut)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">{percentage}%</span>
                      <span className="text-lg font-bold text-gray-900 min-w-[3rem] text-right">{s.count}</span>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${config.barColor}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {!data && loading && (
              <div className="text-center py-8 text-gray-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-gray-600 mb-2" />
                <p className="text-sm">Chargement des données...</p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  sub, 
  trend, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  sub?: string;
  trend: "up" | "down" | "neutral";
  color: string;
}) {
  const colorClasses = {
    orange: "bg-orange-500",
    green: "bg-green-500",
    blue: "bg-blue-600",
    red: "bg-red-500"
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} shadow`}>
          <div className="text-white">{icon}</div>
        </div>
        {trend !== "neutral" && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
            trend === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend === "up" ? "Bon" : "Attention"}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-600">{label}</div>
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        {sub && <div className="text-xs text-gray-500">{sub}</div>}
      </div>
    </div>
  );
}

function Top5Card({ 
  title, 
  icon, 
  items, 
  bgColor, 
  total 
}: { 
  title: string; 
  icon: React.ReactNode; 
  items: TopItem[]; 
  bgColor: string; 
  total: number;
}) {
  return (
    <div className={`rounded-lg border border-gray-200 shadow overflow-hidden ${bgColor}`}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-600">Sources principales de tickets</p>
          </div>
        </div>
        <div className="space-y-3">
          {items.length > 0 ? items.map((item, idx) => {
            const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={item.id} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-white text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-gray-900 text-sm truncate max-w-[200px]">
                      {item.nom || item.nomComplet || `#${item.id}`}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-600">{percentage}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-2 bg-gray-700 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-900 min-w-[2rem] text-right">{item.count}</span>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-8 text-gray-500 text-sm">Aucune donnée disponible</div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusConfig(status: StatusKey) {
  switch (status) {
    case "OPEN":
      return { 
        icon: <AlertCircle className="h-4 w-4 text-orange-600" />, 
        barColor: "bg-orange-500",
        bgLight: "bg-orange-50"
      };
    case "IN_PROGRESS":
      return { 
        icon: <Clock className="h-4 w-4 text-blue-600" />, 
        barColor: "bg-blue-500",
        bgLight: "bg-blue-50"
      };
    case "A_CLOTURER":
      return { 
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />, 
        barColor: "bg-green-500",
        bgLight: "bg-green-50"
      };
    case "CLOSED":
      return { 
        icon: <CheckCircle2 className="h-4 w-4 text-teal-600" />, 
        barColor: "bg-teal-500",
        bgLight: "bg-teal-50"
      };
    case "REJETE":
      return { 
        icon: <XCircle className="h-4 w-4 text-red-600" />, 
        barColor: "bg-red-500",
        bgLight: "bg-red-50"
      };
    case "TRANSFERE_MANTICE":
      return { 
        icon: <TrendingUp className="h-4 w-4 text-purple-600" />, 
        barColor: "bg-purple-500",
        bgLight: "bg-purple-50"
      };
    default:
      return { 
        icon: <AlertCircle className="h-4 w-4 text-gray-600" />, 
        barColor: "bg-gray-500",
        bgLight: "bg-gray-50"
      };
  }
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