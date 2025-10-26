"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlusCircle, AppWindow, Building2, Users, Boxes, X,
  Pencil, Trash2, ChevronLeft, ChevronRight, Search
} from "lucide-react";

/* =========================================================
   Types (côté front)
   ========================================================= */
type Role = "EMPLOYE" | "TECHNICIEN" | "CHEF_DSI";

type Departement = {
  id: number;
  nom: string;
  responsableId?: number | null;
  responsable?: { id: number; prenom: string; nom: string; email: string } | null;
};

type Utilisateur = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  matricule?: string | null;
  departementId?: number | null;
  departement?: { id: number; nom: string } | null;
  codeHierarchique: number;
};

type Application = { id: number; nom: string };
type Materiel = { id: number; nom: string };

/* =========================================================
   Helpers dédoublonnage
   ========================================================= */
function upsertByIdOrName<T extends { id?: number; nom?: string }>(
  arr: T[],
  item: T
) {
  const byId = typeof item.id === "number"
    ? arr.findIndex((x) => x.id === item.id)
    : -1;

  if (byId >= 0) {
    const next = arr.slice();
    next[byId] = item;
    return next;
  }

  if (item.nom) {
    const lname = item.nom.toLowerCase();
    const byName = arr.findIndex((x) => (x.nom || "").toLowerCase() === lname);
    if (byName >= 0) {
      const next = arr.slice();
      next[byName] = item;
      return next;
    }
  }

  return [...arr, item];
}

/* =========================================================
   Composant principal
   ========================================================= */
export default function AdminEntitiesPage() {
  const router = useRouter();

  // Auth
  const [user, setUser] = useState<{ id: number; role: Role } | null>(null);

  // Data référentielles
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [materiels, setMateriels] = useState<Materiel[]>([]);

  // UI state
  const [openModal, setOpenModal] =
    useState<null | "application" | "departement" | "materiel" | "utilisateur" |
      "edit-application" | "edit-departement" | "edit-materiel" | "edit-utilisateur">(null);
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Pagination & Search
  const [pageSize, setPageSize] = useState(5);
  const [currentPages, setCurrentPages] = useState({
    apps: 1, deps: 1, mats: 1, users: 1
  });
  const [searchTerms, setSearchTerms] = useState({
    apps: "", deps: "", mats: "", users: ""
  });

  // Form states (création)
  const [formApp, setFormApp] = useState({ nom: "" });
  const [formDep, setFormDep] = useState<{ nom: string; responsableId: string }>({ nom: "", responsableId: "" });
  const [formMat, setFormMat] = useState({ nom: "" });
  const [formUser, setFormUser] = useState<{
    nom: string; prenom: string; email: string; motDePasse: string; role: Role; departementId: string; matricule: string; codeHierarchique: string;
  }>({ nom: "", prenom: "", email: "", motDePasse: "", role: "EMPLOYE", departementId: "", matricule: "", codeHierarchique: "0" });

  // Form states (édition)
  const [editId, setEditId] = useState<number | null>(null);
  const [editApp, setEditApp] = useState<{ nom: string }>({ nom: "" });
  const [editDep, setEditDep] = useState<{ nom: string; responsableId: string }>({ nom: "", responsableId: "" });
  const [editMat, setEditMat] = useState<{ nom: string }>({ nom: "" });
  const [editUser, setEditUser] = useState<{
    nom: string; prenom: string; role: Role; departementId: string; matricule: string; motDePasse?: string; codeHierarchique: string;
  }>({ nom: "", prenom: "", role: "EMPLOYE", departementId: "", matricule: "", motDePasse: "", codeHierarchique: "0" });

  // ======================================================
  // Auth check
  // ======================================================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "CHEF_DSI") { alert("Accès refusé !"); router.push("/login"); return; }
      setUser({ id: payload.id, role: payload.role });
    } catch { router.push("/login"); }
  }, [router]);

  // ======================================================
  // Load référentiels
  // ======================================================
  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const [depsRes, usersRes, appsRes, matsRes] = await Promise.all([
        fetch("/api/departements", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        fetch("/api/utilisateurs", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        fetch("/api/applications", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        fetch("/api/materiels", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
      ]);

      const [deps, users, apps, mats] = await Promise.all([
        depsRes.json(), usersRes.json(), appsRes.json(), matsRes.json(),
      ]);

      setDepartements(Array.isArray(deps) ? deps : []);
      setUtilisateurs(Array.isArray(users) ? users : []);
      setApplications(Array.isArray(apps) ? apps : []);
      setMateriels(Array.isArray(mats) ? mats : []);
    } catch (e) {
      console.error(e);
      setNotif({ type: "error", msg: "Erreur de chargement des données." });
    }
  }, []);

  useEffect(() => { if (user) fetchAll(); }, [user, fetchAll]);

  // Auto-hide notifications
  useEffect(() => {
    if (notif) {
      const timer = setTimeout(() => setNotif(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notif]);

  // Helpers
  const closeModal = () => setOpenModal(null);
  const show = (k: typeof openModal) => setOpenModal(k);

  // ======================================================
  // HTTP helpers
  // ======================================================
  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  };

  const postJson = async (url: string, body: any) => {
    const res = await fetch(url, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Erreur HTTP ${res.status}`);
    return { data, status: res.status };
  };

  const patchJson = async (url: string, body: any) => {
    const res = await fetch(url, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Erreur HTTP ${res.status}`);
    return data;
  };

  const del = async (url: string) => {
    const res = await fetch(url, { method: "DELETE", headers: authHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Erreur HTTP ${res.status}`);
    return data;
  };

  // ======================================================
  // CREATE handlers
  // ======================================================
  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault(); if (loading) return;
    const nom = formApp.nom.trim();
    if (!nom) return setNotif({ type: "error", msg: "Le nom est requis." });
    try {
      setLoading(true);
      const { data } = await postJson("/api/applications", { nom });
      setApplications((prev) => upsertByIdOrName(prev, data as Application).sort((a, b) => a.nom.localeCompare(b.nom)));
      setFormApp({ nom: "" });
      setNotif({ type: "success", msg: "Application créée avec succès." });
      await fetchAll(); closeModal();
    } catch (err: any) { setNotif({ type: "error", msg: err.message || "Création impossible." }); }
    finally { setLoading(false); }
  };

  const handleCreateDep = async (e: React.FormEvent) => {
    e.preventDefault(); if (loading) return;
    const nom = formDep.nom.trim();
    if (!nom) return setNotif({ type: "error", msg: "Le nom du département est requis." });
    const responsableId = formDep.responsableId ? Number(formDep.responsableId) : undefined;
    try {
      setLoading(true);
      const { data } = await postJson("/api/departements", { nom, ...(responsableId ? { responsableId } : {}) });
      setDepartements((prev) => upsertByIdOrName(prev, data as Departement).sort((a, b) => a.nom.localeCompare(b.nom)));
      setFormDep({ nom: "", responsableId: "" });
      setNotif({ type: "success", msg: "Département créé avec succès." });
      await fetchAll(); closeModal();
    } catch (err: any) { setNotif({ type: "error", msg: err.message || "Création impossible." }); }
    finally { setLoading(false); }
  };

  const handleCreateMat = async (e: React.FormEvent) => {
    e.preventDefault(); if (loading) return;
    const nom = formMat.nom.trim();
    if (!nom) return setNotif({ type: "error", msg: "Le nom du matériel est requis." });
    try {
      setLoading(true);
      const { data } = await postJson("/api/materiels", { nom });
      setMateriels((prev) => upsertByIdOrName(prev, data as Materiel).sort((a, b) => a.nom.localeCompare(b.nom)));
      setFormMat({ nom: "" });
      setNotif({ type: "success", msg: "Matériel créé avec succès." });
      await fetchAll(); closeModal();
    } catch (err: any) { setNotif({ type: "error", msg: err.message || "Création impossible." }); }
    finally { setLoading(false); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault(); if (loading) return;
    const codeHierarchique = Number(formUser.codeHierarchique);
    if (!Number.isInteger(codeHierarchique) || codeHierarchique < 0) {
      return setNotif({ type: "error", msg: "Code hiérarchique doit être un entier >= 0." });
    }
    const payload = {
      nom: formUser.nom.trim(),
      prenom: formUser.prenom.trim(),
      email: formUser.email.trim().toLowerCase(),
      motDePasse: formUser.motDePasse,
      role: formUser.role,
      departementId: formUser.departementId ? Number(formUser.departementId) : undefined,
      matricule: formUser.matricule?.trim() || undefined,
      codeHierarchique,
    };
    if (!payload.nom || !payload.prenom || !payload.email || !payload.motDePasse) {
      return setNotif({ type: "error", msg: "Champs requis: nom, prénom, email, mot de passe." });
    }
    try {
      setLoading(true);
      const { data } = await postJson("/api/utilisateurs", payload);
      setUtilisateurs((prev) =>
        upsertByIdOrName(prev, data as Utilisateur).sort((a, b) => {
          if (a.role !== b.role) return a.role.localeCompare(b.role);
          const ln = a.nom.localeCompare(b.nom);
          return ln !== 0 ? ln : a.prenom.localeCompare(b.prenom);
        })
      );
      setFormUser({ nom: "", prenom: "", email: "", motDePasse: "", role: "EMPLOYE", departementId: "", matricule: "", codeHierarchique: "0" });
      setNotif({ type: "success", msg: "Utilisateur créé avec succès." });
      await fetchAll(); closeModal();
    } catch (err: any) { setNotif({ type: "error", msg: err.message || "Création impossible." }); }
    finally { setLoading(false); }
  };

  // ======================================================
  // EDIT handlers
  // ======================================================
  const openEditApp = (a: Application) => {
    setEditId(a.id); setEditApp({ nom: a.nom }); show("edit-application");
  };
  const openEditDep = (d: Departement) => {
    setEditId(d.id); setEditDep({ nom: d.nom, responsableId: d.responsableId ? String(d.responsableId) : "" }); show("edit-departement");
  };
  const openEditMat = (m: Materiel) => {
    setEditId(m.id); setEditMat({ nom: m.nom }); show("edit-materiel");
  };
  const openEditUser = (u: Utilisateur) => {
    setEditId(u.id);
    setEditUser({
      nom: u.nom, prenom: u.prenom, role: u.role,
      departementId: u.departementId ? String(u.departementId) : "",
      matricule: u.matricule || "", motDePasse: "",
      codeHierarchique: String(u.codeHierarchique)
    });
    show("edit-utilisateur");
  };

  const handlePatchApp = async (e: React.FormEvent) => {
    e.preventDefault(); if (loading || editId == null) return;
    const nom = editApp.nom.trim(); if (!nom) return setNotif({ type: "error", msg: "Nom requis." });
    try {
      setLoading(true);
      const updated = await patchJson(`/api/applications/${editId}`, { nom });
      setApplications(prev => upsertByIdOrName(prev, updated).sort((a,b)=>a.nom.localeCompare(b.nom)));
      setNotif({ type: "success", msg: "Application mise à jour." });
      await fetchAll(); closeModal();
    } catch (err:any) { setNotif({ type: "error", msg: err.message || "Mise à jour impossible." }); }
    finally { setLoading(false); }
  };

  const handlePatchDep = async (e: React.FormEvent) => {
    e.preventDefault(); if (loading || editId == null) return;
    const nom = editDep.nom.trim(); if (!nom) return setNotif({ type: "error", msg: "Nom requis." });
    const responsableId = editDep.responsableId ? Number(editDep.responsableId) : null;
    try {
      setLoading(true);
      const updated = await patchJson(`/api/departements/${editId}`, { nom, responsableId });
      setDepartements(prev => upsertByIdOrName(prev, updated).sort((a,b)=>a.nom.localeCompare(b.nom)));
      setNotif({ type: "success", msg: "Département mis à jour." });
      await fetchAll(); closeModal();
    } catch (err:any) { setNotif({ type: "error", msg: err.message || "Mise à jour impossible." }); }
    finally { setLoading(false); }
  };

  const handlePatchMat = async (e: React.FormEvent) => {
    e.preventDefault(); if (loading || editId == null) return;
    const nom = editMat.nom.trim(); if (!nom) return setNotif({ type: "error", msg: "Nom requis." });
    try {
      setLoading(true);
      const updated = await patchJson(`/api/materiels/${editId}`, { nom });
      setMateriels(prev => upsertByIdOrName(prev, updated).sort((a,b)=>a.nom.localeCompare(b.nom)));
      setNotif({ type: "success", msg: "Matériel mis à jour." });
      await fetchAll(); closeModal();
    } catch (err:any) { setNotif({ type: "error", msg: err.message || "Mise à jour impossible." }); }
    finally { setLoading(false); }
  };

  const handlePatchUser = async (e: React.FormEvent) => {
    e.preventDefault(); if (loading || editId == null) return;
    const codeHierarchique = Number(editUser.codeHierarchique);
    if (!Number.isInteger(codeHierarchique) || codeHierarchique < 0) {
      return setNotif({ type: "error", msg: "Code hiérarchique doit être un entier >= 0." });
    }
    const body: any = {
      nom: editUser.nom.trim(),
      prenom: editUser.prenom.trim(),
      role: editUser.role,
      departementId: editUser.departementId ? Number(editUser.departementId) : null,
      matricule: editUser.matricule?.trim() || null,
      codeHierarchique,
    };
    if (!body.nom || !body.prenom) return setNotif({ type: "error", msg: "Nom et prénom requis." });
    if (editUser.motDePasse && editUser.motDePasse.trim().length > 0) {
      body.motDePasse = editUser.motDePasse;
    }
    try {
      setLoading(true);
      const updated = await patchJson(`/api/utilisateurs/${editId}`, body);
      setUtilisateurs(prev => upsertByIdOrName(prev, updated).sort((a, b) => {
        if (a.role !== b.role) return a.role.localeCompare(b.role);
        const ln = a.nom.localeCompare(b.nom);
        return ln !== 0 ? ln : a.prenom.localeCompare(b.prenom);
      }));
      setNotif({ type: "success", msg: "Utilisateur mis à jour." });
      await fetchAll(); closeModal();
    } catch (err:any) { setNotif({ type: "error", msg: err.message || "Mise à jour impossible." }); }
    finally { setLoading(false); }
  };

  // ======================================================
  // DELETE handlers
  // ======================================================
  const confirmAndDelete = async (kind: "application"|"departement"|"materiel"|"utilisateur", id: number) => {
    if (!window.confirm("Confirmer la suppression ?")) return;
    try {
      setLoading(true);
      await del(`/api/${kind === "utilisateur" ? "utilisateurs" : kind + "s"}/${id}`);
      if (kind === "application") setApplications(prev => prev.filter(x => x.id !== id));
      if (kind === "materiel") setMateriels(prev => prev.filter(x => x.id !== id));
      if (kind === "departement") setDepartements(prev => prev.filter(x => x.id !== id));
      if (kind === "utilisateur") setUtilisateurs(prev => prev.filter(x => x.id !== id));
      setNotif({ type: "success", msg: "Supprimé avec succès." });
      await fetchAll();
    } catch (err:any) {
      setNotif({ type: "error", msg: err.message || "Suppression impossible." });
    } finally {
      setLoading(false);
    }
  };

  // Filtered & Paginated Data
  const filteredApps = useMemo(() => 
    applications.filter(a => a.nom.toLowerCase().includes(searchTerms.apps.toLowerCase())),
    [applications, searchTerms.apps]
  );
  const filteredDeps = useMemo(() => 
    departements.filter(d => d.nom.toLowerCase().includes(searchTerms.deps.toLowerCase())),
    [departements, searchTerms.deps]
  );
  const filteredMats = useMemo(() => 
    materiels.filter(m => m.nom.toLowerCase().includes(searchTerms.mats.toLowerCase())),
    [materiels, searchTerms.mats]
  );
  const filteredUsers = useMemo(() => 
    utilisateurs.filter(u => 
      `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(searchTerms.users.toLowerCase())
    ),
    [utilisateurs, searchTerms.users]
  );

  const paginatedApps = useMemo(() => {
    const start = (currentPages.apps - 1) * pageSize;
    return filteredApps.slice(start, start + pageSize);
  }, [filteredApps, currentPages.apps, pageSize]);

  const paginatedDeps = useMemo(() => {
    const start = (currentPages.deps - 1) * pageSize;
    return filteredDeps.slice(start, start + pageSize);
  }, [filteredDeps, currentPages.deps, pageSize]);

  const paginatedMats = useMemo(() => {
    const start = (currentPages.mats - 1) * pageSize;
    return filteredMats.slice(start, start + pageSize);
  }, [filteredMats, currentPages.mats, pageSize]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPages.users - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPages.users, pageSize]);

  const totalPages = {
    apps: Math.ceil(filteredApps.length / pageSize),
    deps: Math.ceil(filteredDeps.length / pageSize),
    mats: Math.ceil(filteredMats.length / pageSize),
    users: Math.ceil(filteredUsers.length / pageSize),
  };

  // Stats
  const stats = useMemo(() => ({
    apps: applications.length, 
    deps: departements.length, 
    mats: materiels.length, 
    users: utilisateurs.length,
  }), [applications.length, departements.length, materiels.length, utilisateurs.length]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4" />
          <p className="text-slate-600 font-medium">Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/cds.png" alt="CDS" className="h-9 w-auto" />
            <div className="h-8 w-px bg-slate-200" />
            <h1 className="text-xl font-bold text-slate-900">Administration des entités</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/reporting"
              className="px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Reporting
            </Link>
            <Link
              href="/dashboard/admin-tickets"
              className="px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Tickets
            </Link>
            <button
              onClick={() => { localStorage.removeItem("token"); router.push("/login"); }}
              className="px-4 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-slate-900 to-slate-700 text-white hover:from-slate-800 hover:to-slate-600 transition-all shadow-sm"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl w-full px-6 py-8 space-y-8">
        {/* Notif */}
        {notif && (
          <div className={`rounded-xl px-5 py-4 text-sm border shadow-sm animate-in fade-in slide-in-from-top-2 ${
            notif.type === "success" 
              ? "bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-300 text-emerald-900"
              : "bg-gradient-to-r from-rose-50 to-rose-100/50 border-rose-300 text-rose-900"
          }`}>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${notif.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`} />
              <span className="font-medium">{notif.msg}</span>
            </div>
          </div>
        )}

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat icon={<AppWindow className="h-5 w-5" />} label="Applications" value={stats.apps} color="blue" />
          <MiniStat icon={<Building2 className="h-5 w-5" />} label="Départements" value={stats.deps} color="purple" />
          <MiniStat icon={<Boxes className="h-5 w-5" />} label="Matériels" value={stats.mats} color="orange" />
          <MiniStat icon={<Users className="h-5 w-5" />} label="Utilisateurs" value={stats.users} color="green" />
        </div>

        {/* Actions : boutons d'ouverture */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Créer une entité</h2>
              <p className="text-sm text-slate-500 mt-1">Ajoutez rapidement de nouveaux éléments au système</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <EntityButton icon={<AppWindow className="h-6 w-6" />} title="Application" subtitle="Nouvelle application" onClick={() => show("application")} color="blue" />
            <EntityButton icon={<Building2 className="h-6 w-6" />} title="Département" subtitle="Nouveau département" onClick={() => show("departement")} color="purple" />
            <EntityButton icon={<Boxes className="h-6 w-6" />} title="Matériel" subtitle="Nouveau matériel" onClick={() => show("materiel")} color="orange" />
            <EntityButton icon={<Users className="h-6 w-6" />} title="Utilisateur" subtitle="Nouveau compte" onClick={() => show("utilisateur")} color="green" />
          </div>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/80 shadow-sm px-5 py-3">
          <span className="text-sm font-medium text-slate-700">Éléments par page</span>
          <div className="flex gap-2">
            {[5, 10, 20, 50].map(size => (
              <button
                key={size}
                onClick={() => setPageSize(size)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pageSize === size
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Gestion (listes complètes + actions) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ManageCard
            title="Applications"
            icon={<AppWindow className="h-5 w-5" />}
            color="blue"
            data={paginatedApps}
            total={filteredApps.length}
            currentPage={currentPages.apps}
            totalPages={totalPages.apps}
            onPageChange={(p) => setCurrentPages(prev => ({ ...prev, apps: p }))}
            searchTerm={searchTerms.apps}
            onSearchChange={(v) => setSearchTerms(prev => ({ ...prev, apps: v }))}
            renderRow={(a) => ({ id: a.id, main: a.nom })}
            onEdit={(idx) => openEditApp(paginatedApps[idx])}
            onDelete={(idx) => confirmAndDelete("application", paginatedApps[idx].id)}
          />
          <ManageCard
            title="Matériels"
            icon={<Boxes className="h-5 w-5" />}
            color="orange"
            data={paginatedMats}
            total={filteredMats.length}
            currentPage={currentPages.mats}
            totalPages={totalPages.mats}
            onPageChange={(p) => setCurrentPages(prev => ({ ...prev, mats: p }))}
            searchTerm={searchTerms.mats}
            onSearchChange={(v) => setSearchTerms(prev => ({ ...prev, mats: v }))}
            renderRow={(m) => ({ id: m.id, main: m.nom })}
            onEdit={(idx) => openEditMat(paginatedMats[idx])}
            onDelete={(idx) => confirmAndDelete("materiel", paginatedMats[idx].id)}
          />
          <ManageCard
            title="Départements"
            icon={<Building2 className="h-5 w-5" />}
            color="purple"
            data={paginatedDeps}
            total={filteredDeps.length}
            currentPage={currentPages.deps}
            totalPages={totalPages.deps}
            onPageChange={(p) => setCurrentPages(prev => ({ ...prev, deps: p }))}
            searchTerm={searchTerms.deps}
            onSearchChange={(v) => setSearchTerms(prev => ({ ...prev, deps: v }))}
            renderRow={(d) => ({ 
              id: d.id, 
              main: d.nom,
              sub: d.responsable ? `Resp: ${d.responsable.prenom} ${d.responsable.nom}` : undefined
            })}
            onEdit={(idx) => openEditDep(paginatedDeps[idx])}
            onDelete={(idx) => confirmAndDelete("departement", paginatedDeps[idx].id)}
          />
          <ManageCard
            title="Utilisateurs"
            icon={<Users className="h-5 w-5" />}
            color="green"
            data={paginatedUsers}
            total={filteredUsers.length}
            currentPage={currentPages.users}
            totalPages={totalPages.users}
            onPageChange={(p) => setCurrentPages(prev => ({ ...prev, users: p }))}
            searchTerm={searchTerms.users}
            onSearchChange={(v) => setSearchTerms(prev => ({ ...prev, users: v }))}
            renderRow={(u) => ({ 
              id: u.id, 
              main: `${u.prenom} ${u.nom}`,
              sub: `${u.email} • ${u.role} • Code: ${u.codeHierarchique}${u.departement ? ` • ${u.departement.nom}` : ""}`
            })}
            onEdit={(idx) => openEditUser(paginatedUsers[idx])}
            onDelete={(idx) => confirmAndDelete("utilisateur", paginatedUsers[idx].id)}
          />
        </div>
      </main>

      {/* Modales CRÉATION */}
      {openModal === "application" && (
        <Modal title="Nouvelle application" onClose={loading ? () => {} : closeModal}>
          <form onSubmit={handleCreateApp} className="space-y-4">
            <Input label="Nom de l'application" value={formApp.nom} onChange={v => setFormApp({ nom: v })} placeholder="Ex. Word" />
            <FormActions loading={loading} onCancel={closeModal} />
          </form>
        </Modal>
      )}

      {openModal === "departement" && (
        <Modal title="Nouveau département" onClose={loading ? () => {} : closeModal}>
          <form onSubmit={handleCreateDep} className="space-y-4">
            <Input label="Nom du département" value={formDep.nom} onChange={v => setFormDep(s => ({ ...s, nom: v }))} placeholder="Ex. DSI" />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Responsable (optionnel)</label>
              <select
                value={formDep.responsableId}
                onChange={(e) => setFormDep((s) => ({ ...s, responsableId: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">— Aucun —</option>
                {utilisateurs.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.prenom} {u.nom} — {u.email}
                  </option>
                ))}
              </select>
            </div>
            <FormActions loading={loading} onCancel={closeModal} />
          </form>
        </Modal>
      )}

      {openModal === "materiel" && (
        <Modal title="Nouveau matériel" onClose={loading ? () => {} : closeModal}>
          <form onSubmit={handleCreateMat} className="space-y-4">
            <Input label="Nom du matériel" value={formMat.nom} onChange={v => setFormMat({ nom: v })} placeholder="Ex. Imprimante" />
            <FormActions loading={loading} onCancel={closeModal} />
          </form>
        </Modal>
      )}

      {openModal === "utilisateur" && (
        <Modal title="Nouvel utilisateur" onClose={loading ? () => {} : closeModal}>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Prénom" value={formUser.prenom} onChange={v => setFormUser(s => ({ ...s, prenom: v }))} placeholder="Ex. Awa" />
              <Input label="Nom" value={formUser.nom} onChange={v => setFormUser(s => ({ ...s, nom: v }))} placeholder="Ex. Ndiaye" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input type="email" label="Email" value={formUser.email} onChange={v => setFormUser(s => ({ ...s, email: v }))} placeholder="exemple@domaine.com" />
              <Input type="password" label="Mot de passe" value={formUser.motDePasse} onChange={v => setFormUser(s => ({ ...s, motDePasse: v }))} placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                <select
                  value={formUser.role}
                  onChange={(e) => setFormUser((s) => ({ ...s, role: e.target.value as Role }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="EMPLOYE">EMPLOYE</option>
                  <option value="TECHNICIEN">TECHNICIEN</option>
                  <option value="CHEF_DSI">CHEF_DSI</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Département (optionnel)</label>
                <select
                  value={formUser.departementId}
                  onChange={(e) => setFormUser((s) => ({ ...s, departementId: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">— Aucun —</option>
                  {departements.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
                </select>
              </div>
              <Input 
                label="Code hiérarchique" 
                value={formUser.codeHierarchique} 
                onChange={v => setFormUser(s => ({ ...s, codeHierarchique: v }))} 
                placeholder="0, 1, 2..."
                type="number"
              />
            </div>
            <Input label="Matricule (optionnel)" value={formUser.matricule} onChange={v => setFormUser(s => ({ ...s, matricule: v }))} placeholder="Ex. EMP-00123" />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <strong>Code hiérarchique :</strong> 0 = employé simple, 1+ = niveaux de supervision. 
              Un code supérieur permet de voir les tickets des utilisateurs du même département avec un code inférieur.
            </div>
            <FormActions loading={loading} onCancel={closeModal} />
          </form>
        </Modal>
      )}

      {/* Modales ÉDITION */}
      {openModal === "edit-application" && (
        <Modal title="Modifier l'application" onClose={loading ? () => {} : closeModal}>
          <form onSubmit={handlePatchApp} className="space-y-4">
            <Input label="Nom" value={editApp.nom} onChange={v => setEditApp({ nom: v })} />
            <FormActions loading={loading} onCancel={closeModal} submitLabel="Enregistrer" />
          </form>
        </Modal>
      )}

      {openModal === "edit-departement" && (
        <Modal title="Modifier le département" onClose={loading ? () => {} : closeModal}>
          <form onSubmit={handlePatchDep} className="space-y-4">
            <Input label="Nom" value={editDep.nom} onChange={v => setEditDep(s => ({ ...s, nom: v }))} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Responsable</label>
              <select
                value={editDep.responsableId}
                onChange={(e) => setEditDep((s) => ({ ...s, responsableId: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">— Aucun —</option>
                {utilisateurs.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.prenom} {u.nom} — {u.email}
                  </option>
                ))}
              </select>
            </div>
            <FormActions loading={loading} onCancel={closeModal} submitLabel="Enregistrer" />
          </form>
        </Modal>
      )}

      {openModal === "edit-materiel" && (
        <Modal title="Modifier le matériel" onClose={loading ? () => {} : closeModal}>
          <form onSubmit={handlePatchMat} className="space-y-4">
            <Input label="Nom" value={editMat.nom} onChange={v => setEditMat({ nom: v })} />
            <FormActions loading={loading} onCancel={closeModal} submitLabel="Enregistrer" />
          </form>
        </Modal>
      )}

      {openModal === "edit-utilisateur" && (
        <Modal title="Modifier l'utilisateur" onClose={loading ? () => {} : closeModal}>
          <form onSubmit={handlePatchUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Prénom" value={editUser.prenom} onChange={v => setEditUser(s => ({ ...s, prenom: v }))} />
              <Input label="Nom" value={editUser.nom} onChange={v => setEditUser(s => ({ ...s, nom: v }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                <select
                  value={editUser.role}
                  onChange={(e) => setEditUser(s => ({ ...s, role: e.target.value as Role }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="EMPLOYE">EMPLOYE</option>
                  <option value="TECHNICIEN">TECHNICIEN</option>
                  <option value="CHEF_DSI">CHEF_DSI</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Département</label>
                <select
                  value={editUser.departementId}
                  onChange={(e) => setEditUser(s => ({ ...s, departementId: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">— Aucun —</option>
                  {departements.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
                </select>
              </div>
              <Input 
                label="Code hiérarchique" 
                value={editUser.codeHierarchique} 
                onChange={v => setEditUser(s => ({ ...s, codeHierarchique: v }))} 
                type="number"
              />
            </div>
            <Input label="Matricule (optionnel)" value={editUser.matricule} onChange={v => setEditUser(s => ({ ...s, matricule: v }))} />
            <Input type="password" label="Nouveau mot de passe (optionnel)" value={editUser.motDePasse || ""} onChange={v => setEditUser(s => ({ ...s, motDePasse: v }))} placeholder="laisser vide pour ne pas changer" />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <strong>Code hiérarchique :</strong> 0 = employé simple, 1+ = niveaux de supervision. 
              Un code supérieur permet de voir les tickets des utilisateurs du même département avec un code inférieur.
            </div>
            <FormActions loading={loading} onCancel={closeModal} submitLabel="Enregistrer" />
          </form>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================
   Composants UI auxiliaires
   ========================================================= */
function MiniStat({ icon, label, value, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: number;
  color: "blue" | "purple" | "orange" | "green";
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    green: "from-green-500 to-green-600",
  };
  
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white shadow-lg`}>
          {icon}
        </div>
        <span className="text-3xl font-bold text-slate-900">{value}</span>
      </div>
      <div className="text-sm font-medium text-slate-600 mt-3">{label}</div>
    </div>
  );
}

function EntityButton({ icon, title, subtitle, onClick, color }:{
  icon: React.ReactNode; 
  title: string; 
  subtitle: string; 
  onClick: () => void;
  color: "blue" | "purple" | "orange" | "green";
}) {
  const colorClasses = {
    blue: { bg: "bg-blue-50 hover:bg-blue-100", text: "text-blue-700", border: "hover:border-blue-300" },
    purple: { bg: "bg-purple-50 hover:bg-purple-100", text: "text-purple-700", border: "hover:border-purple-300" },
    orange: { bg: "bg-orange-50 hover:bg-orange-100", text: "text-orange-700", border: "hover:border-orange-300" },
    green: { bg: "bg-green-50 hover:bg-green-100", text: "text-green-700", border: "hover:border-green-300" },
  };
  
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left rounded-2xl border border-slate-200 bg-white p-6 ${colorClasses[color].border} hover:shadow-lg transition-all`}
    >
      <div className="flex items-center gap-4">
        <div className={`rounded-xl ${colorClasses[color].bg} ${colorClasses[color].text} p-4 transition-colors`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-900 text-lg">{title}</div>
          <div className="text-sm text-slate-500 mt-0.5">{subtitle}</div>
        </div>
      </div>
      <div className={`mt-4 inline-flex items-center gap-2 text-sm font-medium ${colorClasses[color].text}`}>
        <PlusCircle className="h-4 w-4" />
        Créer maintenant
      </div>
    </button>
  );
}

function ManageCard<T>({
  title, icon, color, data, total, currentPage, totalPages, onPageChange, 
  searchTerm, onSearchChange, renderRow, onEdit, onDelete,
}: {
  title: string;
  icon: React.ReactNode;
  color: "blue" | "purple" | "orange" | "green";
  data: T[];
  total: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  renderRow: (item: T) => { id: number; main: string; sub?: string };
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}) {
  const colorClasses = {
    blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
    green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden">
      <div className={`${colorClasses[color].bg} border-b ${colorClasses[color].border} p-5`}>
        <div className="flex items-center gap-3">
          <div className={`${colorClasses[color].text}`}>{icon}</div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600">{total} élément{total > 1 ? 's' : ''} au total</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        {/* Data */}
        {data.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-2">
              <Boxes className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-sm text-slate-500">Aucun élément trouvé</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((item, idx) => {
              const row = renderRow(item);
              return (
                <div
                  key={row.id}
                  className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-200 text-slate-700 text-xs font-mono font-semibold">
                        #{row.id}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 truncate">{row.main}</p>
                        {row.sub && <p className="text-sm text-slate-500 truncate mt-0.5">{row.sub}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(idx)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
                      title="Modifier"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Modifier</span>
                    </button>
                    <button
                      onClick={() => onDelete(idx)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-300 text-rose-700 bg-white hover:bg-rose-50 text-sm font-medium transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Supprimer</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Page {currentPage} sur {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Préc.
              </button>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                Suiv.
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Input({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        placeholder={placeholder}
      />
    </div>
  );
}

function FormActions({ loading, onCancel, submitLabel = "Créer" }:{
  loading: boolean; onCancel: () => void; submitLabel?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-4">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="px-5 py-2.5 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
      >
        Annuler
      </button>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 shadow-sm transition-all"
      >
        {loading ? (
          <>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Traitement...
          </>
        ) : (
          <>
            <PlusCircle className="h-4 w-4" />
            {submitLabel}
          </>
        )}
      </button>
    </div>
  );
}

function Modal({ title, onClose, children }:{
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="px-6 py-6 max-h-[calc(100vh-200px)] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}