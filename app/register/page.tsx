"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type Departement = {
  id: number;
  nom: string;
};

export default function RegisterPage() {
  // États (inchangés)
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    motDePasse: "",
    confirmMotDePasse: "",
    departementId: "",
    matricule: ""
  });

  // Fetch départements depuis l'API (inchangé)
  useEffect(() => {
    fetch("/api/departements")
      .then(res => res.json())
      .then((data: Departement[]) => setDepartements(data))
      .catch(err => console.error("Erreur fetch départements :", err));
  }, []);

  // Gestion des changements (inchangé)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Soumission du formulaire (inchangé)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (form.motDePasse !== form.confirmMotDePasse) {
      alert("Les mots de passe ne correspondent pas !");
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Erreur : ${data.error}`);
        return;
      }

      alert("Utilisateur créé avec succès !");
      console.log("Utilisateur créé :", data);
      // redirection possible vers /login
    } catch (error) {
      console.error("Erreur fetch signup :", error);
      alert("Erreur lors de la création de l'utilisateur");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-amber-50/40 px-4">
      <div className="w-full max-w-xl">
        {/* Header compact avec logo */}
        <div className="mb-6 flex items-center gap-3">
          <Image src="/cds.png" alt="Logo CDS" width={56} height={56} className="rounded-xl shadow-sm" />
          <div className="leading-tight">
            <h1 className="text-xl font-semibold tracking-tight">CDS Support</h1>
            <p className="text-xs text-neutral-500">Plateforme interne DSI</p>
          </div>
        </div>

        {/* Carte formulaire */}
        <div className="rounded-2xl border border-amber-100 bg-white shadow-sm">
          <div className="border-b border-amber-100 px-6 py-4">
            <h2 className="text-lg font-bold">Inscription Employé</h2>
            <p className="mt-1 text-sm text-neutral-600">Créez votre compte pour soumettre des demandes d’assistance ou d’intervention.</p>
          </div>

          <form className="px-6 py-6 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="prenom" className="text-sm font-medium">Prénom</label>
                <input
                  id="prenom"
                  name="prenom"
                  placeholder="Ex.: Awa"
                  value={form.prenom}
                  onChange={handleChange}
                  className="border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 outline-none rounded-xl px-3 py-2"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="nom" className="text-sm font-medium">Nom</label>
                <input
                  id="nom"
                  name="nom"
                  placeholder="Ex.: Ndiaye"
                  value={form.nom}
                  onChange={handleChange}
                  className="border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 outline-none rounded-xl px-3 py-2"
                  required
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="vous@entreprise.com"
                value={form.email}
                onChange={handleChange}
                className="border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 outline-none rounded-xl px-3 py-2"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="motDePasse" className="text-sm font-medium">Mot de passe</label>
                <input
                  id="motDePasse"
                  type="password"
                  name="motDePasse"
                  placeholder="••••••••"
                  value={form.motDePasse}
                  onChange={handleChange}
                  className="border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 outline-none rounded-xl px-3 py-2"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="confirmMotDePasse" className="text-sm font-medium">Confirmer le mot de passe</label>
                <input
                  id="confirmMotDePasse"
                  type="password"
                  name="confirmMotDePasse"
                  placeholder="••••••••"
                  value={form.confirmMotDePasse}
                  onChange={handleChange}
                  className="border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 outline-none rounded-xl px-3 py-2"
                  required
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="departementId" className="text-sm font-medium">Département</label>
              <select
                id="departementId"
                name="departementId"
                value={form.departementId}
                onChange={handleChange}
                className="border border-amber-200 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 outline-none rounded-xl px-3 py-2"
                required
              >
                <option value="">Sélectionnez votre département</option>
                {departements.map(d => (
                  <option key={d.id} value={d.id}>{d.nom}</option>
                ))}
              </select>
              <p className="text-xs text-neutral-500">La liste est chargée depuis la base de données.</p>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="matricule" className="text-sm font-medium">Matricule <span className="text-neutral-400">(optionnel)</span></label>
              <input
                id="matricule"
                name="matricule"
                placeholder="Ex.: EMP-00123"
                value={form.matricule}
                onChange={handleChange}
                className="border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 outline-none rounded-xl px-3 py-2"
              />
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-amber-600 active:scale-[.99]"
            >
              S'inscrire
            </button>

            <div className="pt-2 text-sm text-neutral-600">
              Déjà un compte ? <a href="/login" className="font-medium text-amber-700 hover:underline">Se connecter</a>
            </div>
          </form>
        </div>

        {/* Note légale / footer mince */}
        <p className="mt-4 text-center text-xs text-neutral-500">
          En créant un compte, vous acceptez nos conditions d’utilisation et notre politique de confidentialité.
        </p>
      </div>
    </div>
  );
}