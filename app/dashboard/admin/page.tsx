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

  // Vérification JWT (inchangée)
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

  // Récupération des départements (inchangée)
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

  if (!user) return <p className="text-center mt-10 text-neutral-600">Chargement...</p>;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-amber-50/40">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-amber-100">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold tracking-tight">Admin — Création d'utilisateur</h1>
            <p className="text-xs text-neutral-500">Accès Chef DSI</p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/dashboard/admin-tickets" className="px-4 py-2 text-sm font-medium rounded-xl border border-amber-200 hover:border-amber-300 hover:bg-amber-50 transition">Voir les tickets</a>
            <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium rounded-xl bg-amber-500 text-white hover:bg-amber-600 active:scale-[.99] shadow-sm transition">Déconnexion</button>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="mx-auto max-w-5xl w-full px-4 py-8">
        <div className="rounded-2xl border border-amber-100 bg-white shadow-sm">
          <div className="border-b border-amber-100 px-6 py-4">
            <h2 className="text-base font-bold">Créer un utilisateur</h2>
            <p className="mt-1 text-sm text-neutral-600">Renseignez les informations de l'agent à ajouter au système.</p>
          </div>

          <form className="px-6 py-6 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="prenom" className="text-sm font-medium">Prénom</label>
                <input id="prenom" name="prenom" placeholder="Ex.: Awa" value={form.prenom} onChange={handleChange} className="border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 outline-none rounded-xl px-3 py-2" required />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="nom" className="text-sm font-medium">Nom</label>
                <input id="nom" name="nom" placeholder="Ex.: Ndiaye" value={form.nom} onChange={handleChange} className="border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 outline-none rounded-xl px-3 py-2" required />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input id="email" type="email" name="email" placeholder="agent@entreprise.com" value={form.email} onChange={handleChange} className="border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 outline-none rounded-xl px-3 py-2" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="motDePasse" className="text-sm font-medium">Mot de passe</label>
                <input id="motDePasse" type="password" name="motDePasse" placeholder="••••••••" value={form.motDePasse} onChange={handleChange} className="border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 outline-none rounded-xl px-3 py-2" required />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="role" className="text-sm font-medium">Rôle</label>
                <select id="role" name="role" value={form.role} onChange={handleChange} className="border border-amber-200 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 outline-none rounded-xl px-3 py-2" required>
                  <option value="ADMIN">Admin</option>
                  <option value="TECHNICIEN">Technicien</option>
                </select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="departementId" className="text-sm font-medium">Département</label>
              <select id="departementId" name="departementId" value={form.departementId} onChange={handleChange} className="border border-amber-200 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 outline-none rounded-xl px-3 py-2" required>
                <option value="">Sélectionnez un département</option>
                {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
              </select>
              <p className="text-xs text-neutral-500">Liste chargée depuis la base de données.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <a href="/dashboard/admin-tickets" className="px-4 py-2 rounded-xl border border-amber-200 hover:bg-amber-50 text-sm font-medium">Gérer les tickets</a>
              <button type="submit" className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-amber-600 active:scale-[.99]">Créer utilisateur</button>
            </div>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-neutral-500">Cette page permet au Chef DSI d'ajouter des techniciens ou des administrateurs.</p>
      </main>
    </div>
  );
}