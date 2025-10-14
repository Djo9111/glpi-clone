"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusCircle, AppWindow, Building2, Users, Boxes, X } from "lucide-react";

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
  const [openModal, setOpenModal] = useState<null | "application" | "departement" | "materiel" | "utilisateur">(null);
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Form states
  const [formApp, setFormApp] = useState({ nom: "" });
  const [formDep, setFormDep] = useState<{ nom: string; responsableId: string }>({ nom: "", responsableId: "" });
  const [formMat, setFormMat] = useState({ nom: "" });
  const [formUser, setFormUser] = useState<{
    nom: string;
    prenom: string;
    email: string;
    motDePasse: string;
    role: Role;
    departementId: string;
    matricule: string;
  }>({
    nom: "",
    prenom: "",
    email: "",
    motDePasse: "",
    role: "EMPLOYE",
    departementId: "",
    matricule: "",
  });

  // ======================================================
  // Auth check
  // ======================================================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "CHEF_DSI") {
        alert("Accès refusé !");
        router.push("/login");
        return;
      }
      setUser({ id: payload.id, role: payload.role });
    } catch {
      router.push("/login");
    }
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
        depsRes.json(),
        usersRes.json(),
        appsRes.json(),
        matsRes.json(),
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

  useEffect(() => {
    if (user) fetchAll();
  }, [user, fetchAll]);

  // Helpers
  const closeModal = () => setOpenModal(null);
  const show = (k: typeof openModal) => setOpenModal(k);

  // ======================================================
  // Submit helpers
  // ======================================================
  const postJson = async (url: string, body: any) => {
    const token = localStorage.getItem("token");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Erreur HTTP ${res.status}`);
    return { data, status: res.status }; // 200 (existant) ou 201 (créé)
  };

  // ======================================================
  // Submit handlers (avec guards + dédoublonnage + refresh)
  // ======================================================
  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // anti double-clic
    const nom = formApp.nom.trim();
    if (!nom) return setNotif({ type: "error", msg: "Le nom est requis." });

    try {
      setLoading(true);
      const { data } = await postJson("/api/applications", { nom });
      setApplications((prev) => {
        const merged = upsertByIdOrName(prev, data as Application);
        return merged.sort((a, b) => a.nom.localeCompare(b.nom));
      });
      setFormApp({ nom: "" });
      setNotif({ type: "success", msg: "Application OK." });
      await fetchAll();
      closeModal();
    } catch (err: any) {
      setNotif({ type: "error", msg: err.message || "Création impossible." });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const nom = formDep.nom.trim();
    if (!nom) return setNotif({ type: "error", msg: "Le nom du département est requis." });
    const responsableId = formDep.responsableId ? Number(formDep.responsableId) : undefined;

    try {
      setLoading(true);
      const { data } = await postJson("/api/departements", { nom, ...(responsableId ? { responsableId } : {}) });
      setDepartements((prev) => {
        const merged = upsertByIdOrName(prev, data as Departement);
        return merged.sort((a, b) => a.nom.localeCompare(b.nom));
      });
      setFormDep({ nom: "", responsableId: "" });
      setNotif({ type: "success", msg: "Département OK." });
      await fetchAll();
      closeModal();
    } catch (err: any) {
      setNotif({ type: "error", msg: err.message || "Création impossible." });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const nom = formMat.nom.trim();
    if (!nom) return setNotif({ type: "error", msg: "Le nom du matériel est requis." });

    try {
      setLoading(true);
      const { data } = await postJson("/api/materiels", { nom });
      setMateriels((prev) => {
        const merged = upsertByIdOrName(prev, data as Materiel);
        return merged.sort((a, b) => a.nom.localeCompare(b.nom));
      });
      setFormMat({ nom: "" });
      setNotif({ type: "success", msg: "Matériel OK." });
      await fetchAll();
      closeModal();
    } catch (err: any) {
      setNotif({ type: "error", msg: err.message || "Création impossible." });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
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
          if (ln !== 0) return ln;
          return a.prenom.localeCompare(b.prenom);
        })
      );
      setFormUser({
        nom: "",
        prenom: "",
        email: "",
        motDePasse: "",
        role: "EMPLOYE",
        departementId: "",
        matricule: "",
      });
      setNotif({ type: "success", msg: "Utilisateur OK." });
      await fetchAll();
      closeModal();
    } catch (err: any) {
      setNotif({ type: "error", msg: err.message || "Création impossible." });
    } finally {
      setLoading(false);
    }
  };

  // Petits compteurs (vitrine)
  const stats = useMemo(() => {
    return {
      apps: applications.length,
      deps: departements.length,
      mats: materiels.length,
      users: utilisateurs.length,
    };
  }, [applications.length, departements.length, materiels.length, utilisateurs.length]);

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
              href="/dashboard/admin-tickets"
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Tickets
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                router.push("/login");
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl w-full px-6 py-6 space-y-8">
        {/* Notif */}
        {notif && (
          <div
            className={`rounded-lg px-4 py-3 text-sm border ${
              notif.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
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
          <p className="text-sm text-slate-500 mt-1">
            Cliquez sur une catégorie pour ouvrir le formulaire de création, sans quitter cette page.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <EntityButton
              icon={<AppWindow className="h-6 w-6" />}
              title="Application"
              subtitle="Ajoutez une application (ex. Word, Delta)"
              onClick={() => show("application")}
            />
            <EntityButton
              icon={<Building2 className="h-6 w-6" />}
              title="Département"
              subtitle="Ajoutez un département et son responsable"
              onClick={() => show("departement")}
            />
            <EntityButton
              icon={<Boxes className="h-6 w-6" />}
              title="Matériel"
              subtitle="Ajoutez un type de matériel"
              onClick={() => show("materiel")}
            />
            <EntityButton
              icon={<Users className="h-6 w-6" />}
              title="Utilisateur"
              subtitle="Créez un employé/technicien/admin"
              onClick={() => show("utilisateur")}
            />
          </div>
        </div>

        {/* Listes “dernier ajout” */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardList title="Dernières applications" items={applications.map(a => a.nom).slice(-6).reverse()} />
          <CardList title="Derniers matériels" items={materiels.map(m => m.nom).slice(-6).reverse()} />
          <CardList title="Derniers départements" items={departements.map(d => d.nom).slice(-6).reverse()} />
          <CardList
            title="Derniers utilisateurs"
            items={utilisateurs.slice(-6).reverse().map(u => `${u.prenom} ${u.nom} (${u.role})`)}
          />
        </div>
      </main>

      {/* Modales */}
      {openModal === "application" && (
        <Modal title="Nouvelle application" onClose={loading ? () => {} : closeModal}>
          <form onSubmit={handleCreateApp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l’application</label>
              <input
                value={formApp.nom}
                onChange={(e) => setFormApp({ nom: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ex. Word"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
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
                <PlusCircle className="h-4 w-4" /> Créer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {openModal === "departement" && (
        <Modal title="Nouveau département" onClose={loading ? () => {} : closeModal}>
          <form onSubmit={handleCreateDep} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom du département</label>
              <input
                value={formDep.nom}
                onChange={(e) => setFormDep((s) => ({ ...s, nom: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ex. DSI"
              />
            </div>

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

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
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
                <PlusCircle className="h-4 w-4" /> Créer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {openModal === "materiel" && (
        <Modal title="Nouveau matériel" onClose={loading ? () => {} : closeModal}>
          <form onSubmit={handleCreateMat} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom du matériel</label>
              <input
                value={formMat.nom}
                onChange={(e) => setFormMat({ nom: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ex. Imprimante"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
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
                <PlusCircle className="h-4 w-4" /> Créer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {openModal === "utilisateur" && (
        <Modal title="Nouvel utilisateur" onClose={loading ? () => {} : closeModal}>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                <input
                  value={formUser.prenom}
                  onChange={(e) => setFormUser((s) => ({ ...s, prenom: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ex. Awa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                <input
                  value={formUser.nom}
                  onChange={(e) => setFormUser((s) => ({ ...s, nom: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ex. Ndiaye"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formUser.email}
                  onChange={(e) => setFormUser((s) => ({ ...s, email: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="exemple@domaine.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={formUser.motDePasse}
                  onChange={(e) => setFormUser((s) => ({ ...s, motDePasse: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
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
                  {departements.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Matricule (optionnel)</label>
              <input
                value={formUser.matricule}
                onChange={(e) => setFormUser((s) => ({ ...s, matricule: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ex. EMP-00123"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
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
                <PlusCircle className="h-4 w-4" /> Créer
              </button>
            </div>
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

function EntityButton({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
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
          {items.map((t, idx) => (
            <li key={idx} className="truncate">• {t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
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
