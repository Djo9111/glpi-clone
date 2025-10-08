"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Departement = { id: number; nom: string };

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; role: string } | null>(null);
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    motDePasse: "",
    role: "TECHNICIEN",
    departementId: ""
  });

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
      setUser(payload);
    } catch {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const fetchDepartements = async () => {
      const res = await fetch("/api/departements");
      const data = await res.json();
      setDepartements(data);
    };
    fetchDepartements();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Erreur : ${data.error}`);
        return;
      }
      alert("Utilisateur créé avec succès !");
      setForm({ nom: "", prenom: "", email: "", motDePasse: "", role: "TECHNICIEN", departementId: "" });
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création de l'utilisateur");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-600">Chargement...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header moderne avec logo */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/60 shadow-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/cds.png" 
              alt="CDS Logo" 
              className="h-10 w-auto"
            />
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">Administration</h1>
              <p className="text-xs text-slate-500">Gestion des utilisateurs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href="/dashboard/admin-tickets" 
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Tickets
            </a>
            <button 
              onClick={handleLogout} 
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[.98] shadow-sm transition-all"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="mx-auto max-w-4xl w-full px-4 py-10">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-1 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
              <h2 className="text-xl font-bold text-slate-800">Créer un utilisateur</h2>
            </div>
            <p className="text-sm text-slate-600 ml-3">
              Ajoutez un nouveau technicien ou administrateur au système
            </p>
          </div>

          <div className="px-6 py-6">
            <div className="grid gap-5">
              {/* Nom et Prénom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="prenom" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Prénom
                  </label>
                  <input 
                    id="prenom" 
                    name="prenom" 
                    placeholder="Ex. : Awa" 
                    value={form.prenom} 
                    onChange={handleChange} 
                    className="border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-slate-800 placeholder:text-slate-400" 
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="nom" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Nom
                  </label>
                  <input 
                    id="nom" 
                    name="nom" 
                    placeholder="Ex. : Ndiaye" 
                    value={form.nom} 
                    onChange={handleChange} 
                    className="border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-slate-800 placeholder:text-slate-400" 
                    required 
                  />
                </div>
              </div>

              {/* Email */}
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  Adresse email
                </label>
                <input 
                  id="email" 
                  type="email" 
                  name="email" 
                  placeholder="prenom.nom@cds.sn" 
                  value={form.email} 
                  onChange={handleChange} 
                  className="border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-slate-800 placeholder:text-slate-400" 
                  required 
                />
              </div>

              {/* Mot de passe et Rôle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="motDePasse" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Mot de passe
                  </label>
                  <input 
                    id="motDePasse" 
                    type="password" 
                    name="motDePasse" 
                    placeholder="Mot de passe sécurisé" 
                    value={form.motDePasse} 
                    onChange={handleChange} 
                    className="border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-slate-800 placeholder:text-slate-400" 
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="role" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Rôle
                  </label>
                  <select 
                    id="role" 
                    name="role" 
                    value={form.role} 
                    onChange={handleChange} 
                    className="border border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-slate-800" 
                    required
                  >
                    <option value="ADMIN">Administrateur</option>
                    <option value="TECHNICIEN">Technicien</option>
                  </select>
                </div>
              </div>

              {/* Département */}
              <div className="grid gap-2">
                <label htmlFor="departementId" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Département
                </label>
                <select 
                  id="departementId" 
                  name="departementId" 
                  value={form.departementId} 
                  onChange={handleChange} 
                  className="border border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-slate-800" 
                  required
                >
                  <option value="">Sélectionnez un département</option>
                  {departements.map(d => (
                    <option key={d.id} value={d.id}>{d.nom}</option>
                  ))}
                </select>
                {departements.length === 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Aucun département disponible
                  </p>
                )}
                {departements.length > 0 && (
                  <p className="text-xs text-slate-500">
                    {departements.length} département(s) disponible(s)
                  </p>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <a 
                  href="/dashboard/admin-tickets" 
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Gérer les tickets
                </a>
                <button 
                  type="button"
                  onClick={handleSubmit}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2.5 font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-orange-600 hover:to-orange-700 active:scale-[.98]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Créer l'utilisateur
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Note informative */}
        <div className="mt-6 flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-4">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900">Information</p>
            <p className="text-sm text-blue-700 mt-1">
              Cette interface permet au Chef DSI de créer des comptes pour les techniciens et administrateurs. Les nouveaux utilisateurs recevront leurs identifiants par email.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}