import { NextResponse } from "next/server";
import { PrismaClient, Statut } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

function getUser(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as { id: number; role: "EMPLOYE"|"TECHNICIEN"|"CHEF_DSI" }; }
  catch { return null; }
}

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function startOfWeek(d: Date) { 
  const x = new Date(d); 
  const day = x.getDay();
  const diff = x.getDate() - day + (day === 0 ? -6 : 1);
  x.setDate(diff);
  x.setHours(0,0,0,0);
  return x;
}

export async function GET(request: Request) {
  const payload = getUser(request);
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (payload.role !== "CHEF_DSI") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    const url = new URL(request.url);
    const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days") ?? 30)));

    // 1) Comptes par user (créateurs) => TOP 5 utilisateurs
    const perUserCounts = await prisma.ticket.groupBy({
      by: ["createdById"],
      _count: { _all: true },
    });
    const userIds = perUserCounts.map(x => x.createdById);
    const users = await prisma.utilisateur.findMany({
      where: { id: { in: userIds } },
      select: { id: true, prenom: true, nom: true, departementId: true, departement: { select: { id: true, nom: true } } },
    });

    // TOP 5 Utilisateurs
    const topUsers = perUserCounts
      .map(u => {
        const user = users.find(x => x.id === u.createdById);
        return {
          id: u.createdById,
          nomComplet: user ? `${user.prenom} ${user.nom}` : `#${u.createdById}`,
          count: u._count._all
        };
      })
      .sort((a,b) => b.count - a.count)
      .slice(0, 5);

    // Agrégation par département => TOP 5 départements
    const depAgg = new Map<number | "NA", { id: number | "NA"; nom: string; count: number }>();
    for (const u of users) {
      const count = perUserCounts.find(x => x.createdById === u.id)!._count._all;
      const depKey = (u.departementId ?? "NA") as number | "NA";
      const depName = u.departement?.nom ?? "Sans département";
      const prev = depAgg.get(depKey);
      if (prev) prev.count += count;
      else depAgg.set(depKey, { id: depKey, nom: depName, count });
    }
    const topDepartments = [...depAgg.values()]
      .sort((a,b) => b.count - a.count)
      .slice(0, 5);
    const topDepartment = topDepartments[0] ?? null;

    // 2) Temps moyen de traitement
    const closedDurations = await prisma.ticket.findMany({
      where: { statut: "CLOSED", OR: [{ dureeTraitementMinutes: { not: null } }, { AND: [{ prisEnChargeAt: { not: null } }, { clotureAt: { not: null } }] }] },
      select: { dureeTraitementMinutes: true, prisEnChargeAt: true, clotureAt: true },
    });
    const durations = closedDurations.map(t => {
      if (t.dureeTraitementMinutes != null) return t.dureeTraitementMinutes;
      if (t.prisEnChargeAt && t.clotureAt) {
        const diffMs = new Date(t.clotureAt).getTime() - new Date(t.prisEnChargeAt).getTime();
        return Math.max(0, Math.round(diffMs / 60000));
      }
      return null;
    }).filter((x): x is number => x !== null);
    const avgResolutionMinutes = durations.length ? Math.round(durations.reduce((a,b)=>a+b,0)/durations.length) : 0;

    // 3) TOP 5 Applications
    const perApp = await prisma.ticket.groupBy({ by: ["applicationId"], _count: { _all: true } });
    const appIds = perApp.filter(a=>a.applicationId != null).map(a=>a.applicationId!) as number[];
    const apps = appIds.length ? await prisma.application.findMany({ where: { id: { in: appIds } }, select: { id: true, nom: true } }) : [];
    const appMap = new Map(apps.map(a => [a.id, a.nom]));
    const topApplications = perApp
      .filter(a => a.applicationId != null)
      .map(a => ({ id: a.applicationId!, nom: appMap.get(a.applicationId!) ?? "(inconnu)", count: a._count._all }))
      .sort((a,b) => b.count - a.count)
      .slice(0, 5);
    const topApplication = topApplications[0] ?? null;

    // 4) Utilisateur top (pour compatibilité)
    const topUser = topUsers[0] ?? null;

    // 5) Stats par statut
    const byStatus = await prisma.ticket.groupBy({ by: ["statut"], _count: { _all: true } });
    const statuses = Object.values(Statut).map(s => ({
      statut: s,
      count: byStatus.find(x => x.statut === s)?._count._all ?? 0
    }));

    // 6) Tendance journalière
    const since = addDays(startOfDay(new Date()), -days + 1);
    const recent = await prisma.ticket.findMany({
      where: { dateCreation: { gte: since } },
      select: { dateCreation: true },
      orderBy: { dateCreation: "asc" },
    });
    const series: { date: string; count: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = addDays(since, i);
      const key = d.toISOString().slice(0,10);
      series.push({ date: key, count: 0 });
    }
    recent.forEach(t => {
      const key = startOfDay(new Date(t.dateCreation)).toISOString().slice(0,10);
      const row = series.find(s => s.date === key);
      if (row) row.count++;
    });

    // 7) Tendance hebdomadaire
    const weeklyMap = new Map<string, number>();
    recent.forEach(t => {
      const weekStart = startOfWeek(new Date(t.dateCreation));
      const key = weekStart.toISOString().slice(0,10);
      weeklyMap.set(key, (weeklyMap.get(key) || 0) + 1);
    });
    const seriesWeekly = Array.from(weeklyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a,b) => a.date.localeCompare(b.date));

    // 8) TOP 5 Matériels
    const perMat = await prisma.ticket.groupBy({ by: ["materielId"], _count: { _all: true } });
    const matIds = perMat.filter(m=>m.materielId!=null).map(m=>m.materielId!) as number[];
    const mats = matIds.length ? await prisma.materiel.findMany({ where: { id: { in: matIds } }, select: { id: true, nom: true } }) : [];
    const matMap = new Map(mats.map(m => [m.id, m.nom]));
    const topMateriels = perMat
      .filter(m => m.materielId != null)
      .map(m => ({ id: m.materielId!, nom: matMap.get(m.materielId!) ?? "(inconnu)", count: m._count._all }))
      .sort((a,b) => b.count - a.count)
      .slice(0, 5);
    const topMateriel = topMateriels[0] ?? null;

    return NextResponse.json({
      rangeDays: days,
      topDepartment,
      topDepartments,
      avgResolutionMinutes,
      topApplication,
      topApplications,
      topUser,
      topUsers,
      topMateriel,
      topMateriels,
      statuses,
      seriesDailyTickets: series,
      seriesWeeklyTickets: seriesWeekly,
    });
  } catch (e) {
    console.error("GET /api/reporting:", e);
    return NextResponse.json({ error: "Reporting indisponible." }, { status: 500 });
  }
}