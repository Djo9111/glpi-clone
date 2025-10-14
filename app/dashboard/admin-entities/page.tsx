"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlusCircle, AppWindow, Building2, Users, Boxes, X,
  Pencil, Trash2
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

  // Form states (création)
  const [formApp, setFormApp] = useState({ nom: "" });
  const [formDep, setFormDep] = useState<{ nom: string; responsableId: string }>({ nom: "", responsableId: "" });
  const [formMat, setFormMat] = useState({ nom: "" });
  const [formUser, setFormUser] = useState<{
    nom: string; prenom: string; email: string; motDePasse: string; role: Role; departementId: string; matricule: string;
  }>({ nom: "", prenom: "", email: "", motDePasse: "", role: "EMPLOYE", departementId: "", matricule: "" });

  // Form states (édition)
  const [editId, setEditId] = useState<number | null>(null);
  const [editApp, setEditApp] = useState<{ nom: string }>({ nom: "" });
  const [editDep, setEditDep] = useState<{ nom: string; responsableId: string }>({ nom: "", responsableId: "" });
  const [editMat, setEditMat] = useState<{ nom: string }>({ nom: "" });
  const [editUser, setEditUser] = useState<{
    nom: string; prenom: string; role: Role; departementId: string; matricule: string; motDePasse?: string;
  }>({ nom: "", prenom: "", role: "EMPLOYE", departementId: "", matricule: "", motDePasse: "" });

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
  // CREATE handlers (avec guards + dédoublonnage + refresh)
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
      setNotif({ type: "success", msg: "Application OK." });
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
      setNotif({ type: "success", msg: "Département OK." });
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
      setNotif({ type: "success", msg: "Matériel OK." });
      await fetchAll(); closeModal();
    } catch (err: any) { setNotif({ type: "error", msg: err.message || "Création impossible." }); }
    finally { setLoading(false); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault(); if (loading) return;
    const payload = {
      nom: formUser.nom.trim(),
      prenom: formUser.prenom.trim(),
      email: formUser.email.trim().toLowerCase(),
      motDePasse: formUser.motDePasse,
      role: formUser.role,
      departementId: formUser.departementId ? Number(formUser.departementId) : undefined,
      matricule: formUser.matricule?.trim() || undefined,
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
      setFormUser({ nom: "", prenom: "", email: "", motDePasse: "", role: "EMPLOYE", departementId: "", matricule: "" });
      setNotif({ type: "success", msg: "Utilisateur OK." });
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
      matricule: u.matricule || "", motDePasse: ""
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
    const body: any = {
      nom: editUser.nom.trim(),
      prenom: editUser.prenom.trim(),
      role: editUser.role,
      departementId: editUser.departementId ? Number(editUser.departementId) : null,
      matricule: editUser.matricule?.trim() || null,
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
      setNotif({ type: "success", msg: "Supprimé." });
      await fetchAll();
    } catch (err:any) {
      setNotif({ type: "error", msg: err.message || "Suppression impossible." });
    } finally {
      setLoading(false);
    }
  };

  // Petits compteurs (vitrine)
  const stats = useMemo(() => ({
    apps: applications.length, deps: departements.length, mats: materiels.length, users: utilisateurs.length,
  }), [applications.length, departements.length, materiels.length, utilisateurs.length]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
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
            <h1 className="text-lg font-semibold text-slate-900">Administration des entités</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/reporting"
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Reporting
            </Link>
            <Link
              href="/dashboard/admin-tickets"
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Tickets
            </Link>
            <button
              onClick={() => { localStorage.removeItem("token"); router.push("/login"); }}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl w-full px-6 py-6 space-y-8">
        {/* Notif */}
        {notif && (
          <div className={`rounded-lg px-4 py-3 text-sm border ${
            notif.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"}`}>
            {notif.msg}
          </div>
        )}

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat icon={<AppWindow className="h-5 w-5" />} label="Applications" value={stats.apps} />
          <MiniStat icon={<Building2 className="h-5 w-5" />} label="Départements" value={stats.deps} />
          <MiniStat icon={<Boxes className="h-5 w-5" />} label="Matériels" value={stats.mats} />
          <MiniStat icon={<Users className="h-5 w-5" />} label="Utilisateurs" value={stats.users} />
        </div>

        {/* Actions : boutons d’ouverture */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900">Créer une entité</h2>
          <p className="text-sm text-slate-500 mt-1">Cliquez pour ouvrir le formulaire, sans quitter la page.</p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <EntityButton icon={<AppWindow className="h-6 w-6" />} title="Application" subtitle="Ajoutez une application" onClick={() => show("application")} />
            <EntityButton icon={<Building2 className="h-6 w-6" />} title="Département" subtitle="Ajoutez un département" onClick={() => show("departement")} />
            <EntityButton icon={<Boxes className="h-6 w-6" />} title="Matériel" subtitle="Ajoutez un matériel" onClick={() => show("materiel")} />
            <EntityButton icon={<Users className="h-6 w-6" />} title="Utilisateur" subtitle="Créez un compte" onClick={() => show("utilisateur")} />
          </div>
        </div>

        {/* Gestion (listes complètes + actions) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ManageCard
            title="Applications"
            rows={applications.map(a => [String(a.id), a.nom])}
            onEdit={(idx) => openEditApp(applications[idx])}
            onDelete={(idx) => confirmAndDelete("application", applications[idx].id)}
          />
          <ManageCard
            title="Matériels"
            rows={materiels.map(m => [String(m.id), m.nom])}
            onEdit={(idx) => openEditMat(materiels[idx])}
            onDelete={(idx) => confirmAndDelete("materiel", materiels[idx].id)}
          />
          <ManageCard
            title="Départements"
            rows={departements.map(d => [
              String(d.id),
              d.nom + (d.responsable ? ` — Resp: ${d.responsable.prenom} ${d.responsable.nom}` : "")
            ])}
            onEdit={(idx) => openEditDep(departements[idx])}
            onDelete={(idx) => confirmAndDelete("departement", departements[idx].id)}
          />
          <ManageCard
            title="Utilisateurs"
            rows={utilisateurs.map(u => [
              String(u.id),
              `${u.prenom} ${u.nom} — ${u.email} — ${u.role}${u.departement ? ` — ${u.departement.nom}` : ""}`
            ])}
            onEdit={(idx) => openEditUser(utilisateurs[idx])}
            onDelete={(idx) => confirmAndDelete("utilisateur", utilisateurs[idx].id)}
          />
        </div>

        {/* Listes “dernier ajout” (toujours utile) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardList title="Dernières applications" items={applications.map(a => a.nom).slice(-6).reverse()} />
          <CardList title="Derniers matériels" items={materiels.map(m => m.nom).slice(-6).reverse()} />
          <CardList title="Derniers départements" items={departements.map(d => d.nom).slice(-6).reverse()} />
          <CardList title="Derniers utilisateurs" items={utilisateurs.slice(-6).reverse().map(u => `${u.prenom} ${u.nom} (${u.role})`)} />
        </div>
      </main>

      {/* Modales CRÉATION */}
      {openModal === "application" && (
        <Modal title="Nouvelle application" onClose={loading ? () => {} : closeModal}>
          <form onSubmit={handleCreateApp} className="space-y-4">
            <Input label="Nom de l’application" value={formApp.nom} onChange={v => setFormApp({ nom: v })} placeholder="Ex. Word" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
            <Input label="Matricule (optionnel)" value={formUser.matricule} onChange={v => setFormUser(s => ({ ...s, matricule: v }))} placeholder="Ex. EMP-00123" />
            <FormActions loading={loading} onCancel={closeModal} />
          </form>
        </Modal>
      )}

      {/* Modales ÉDITION */}
      {openModal === "edit-application" && (
        <Modal title="Modifier l’application" onClose={loading ? () => {} : closeModal}>
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
        <Modal title="Modifier l’utilisateur" onClose={loading ? () => {} : closeModal}>
          <form onSubmit={handlePatchUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Prénom" value={editUser.prenom} onChange={v => setEditUser(s => ({ ...s, prenom: v }))} />
              <Input label="Nom" value={editUser.nom} onChange={v => setEditUser(s => ({ ...s, nom: v }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
            <Input label="Matricule (optionnel)" value={editUser.matricule} onChange={v => setEditUser(s => ({ ...s, matricule: v }))} />
            <Input type="password" label="Nouveau mot de passe (optionnel)" value={editUser.motDePasse || ""} onChange={v => setEditUser(s => ({ ...s, motDePasse: v }))} placeholder="laisser vide pour ne pas changer" />
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
function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-lg bg-slate-100">{icon}</div>
        <span className="text-2xl font-bold text-slate-900">{value}</span>
      </div>
      <div className="text-sm text-slate-600 mt-2">{label}</div>
    </div>
  );
}

function EntityButton({ icon, title, subtitle, onClick }:{
  icon: React.ReactNode; title: string; subtitle: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-300 hover:shadow transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">{icon}</div>
        <div>
          <div className="font-medium text-slate-900">{title}</div>
          <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
        </div>
      </div>
      <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700">
        <PlusCircle className="h-4 w-4" />
        Ouvrir le formulaire
      </div>
    </button>
  );
}

function CardList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="text-sm font-semibold text-slate-900 mb-3">{title}</div>
      {items.length === 0 ? (
        <div className="text-sm text-slate-500">Aucun élément</div>
      ) : (
        <ul className="text-sm text-slate-700 space-y-2">
          {items.map((t, idx) => (<li key={idx} className="truncate">• {t}</li>))}
        </ul>
      )}
    </div>
  );
}

function ManageCard({
  title, rows, onEdit, onDelete,
}: {
  title: string;
  rows: string[][];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="text-sm font-semibold text-slate-900 mb-3">{title}</div>
      {rows.length === 0 ? (
        <div className="text-sm text-slate-500">Aucun élément</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-3 w-20">ID</th>
              <th className="py-2 pr-3">Infos</th>
              <th className="py-2 text-right w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t border-slate-100">
                <td className="py-2 pr-3 font-mono text-slate-700">#{r[0]}</td>
                <td className="py-2 pr-3 text-slate-800">{r[1]}</td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => onEdit(idx)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 mr-2"
                    title="Modifier"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button
                    onClick={() => onDelete(idx)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded border border-rose-300 text-rose-700 bg-white hover:bg-rose-50"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" /> Del
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
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
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        placeholder={placeholder}
      />
    </div>
  );
}

function FormActions({ loading, onCancel, submitLabel = "Créer" }:{
  loading: boolean; onCancel: () => void; submitLabel?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="px-4 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60"
      >
        Annuler
      </button>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
      >
        <PlusCircle className="h-4 w-4" /> {submitLabel}
      </button>
    </div>
  );
}

function Modal({ title, onClose, children }:{
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
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
