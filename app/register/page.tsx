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
    matricule: "",
  });

  // Fetch départements depuis l'API (inchangé)
  useEffect(() => {
    fetch("/api/departements")
      .then((res) => res.json())
      .then((data: Departement[]) => setDepartements(data))
      .catch((err) => console.error("Erreur fetch départements :", err));
  }, []);

  // Gestion des changements (inchangé)
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
        body: JSON.stringify(form),
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

  // Styles utilitaires
  const fieldBase =
    "border border-zinc-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70 outline-none rounded-xl px-3 py-2 transition bg-white placeholder:text-zinc-400";
  const labelBase = "text-sm font-medium text-zinc-800";
  const helperBase = "text-xs text-zinc-500";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-50 px-4">
      <div className="w-full max-w-xl">
        {/* Header compact avec logo */}
        <div className="mb-6 flex items-center gap-3">
          <Image
            src="/cds.png"
            alt="Logo CDS"
            width={48}
            height={48}
            className="rounded-lg shadow-sm"
          />
          <div className="leading-tight">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
              CDS Support
            </h1>
            <p className="text-xs text-zinc-500">Plateforme interne DSI</p>
          </div>
        </div>

        {/* Carte formulaire */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-zinc-200 px-6 py-4 bg-white/60 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-zinc-900">Inscription Employé</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Créez votre compte pour soumettre des demandes d’assistance ou d’intervention.
            </p>
          </div>

          <form className="px-6 py-6 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="prenom" className={labelBase}>
                  Prénom
                </label>
                <input
                  id="prenom"
                  name="prenom"
                  placeholder="Ex.: Awa"
                  value={form.prenom}
                  onChange={handleChange}
                  className={fieldBase}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="nom" className={labelBase}>
                  Nom
                </label>
                <input
                  id="nom"
                  name="nom"
                  placeholder="Ex.: Ndiaye"
                  value={form.nom}
                  onChange={handleChange}
                  className={fieldBase}
                  required
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="email" className={labelBase}>
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="awa.ndiaye@cds.sn"
                value={form.email}
                onChange={handleChange}
                className={fieldBase}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="motDePasse" className={labelBase}>
                  Mot de passe
                </label>
                <input
                  id="motDePasse"
                  type="password"
                  name="motDePasse"
                  placeholder="••••••••"
                  value={form.motDePasse}
                  onChange={handleChange}
                  className={fieldBase}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="confirmMotDePasse" className={labelBase}>
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirmMotDePasse"
                  type="password"
                  name="confirmMotDePasse"
                  placeholder="••••••••"
                  value={form.confirmMotDePasse}
                  onChange={handleChange}
                  className={fieldBase}
                  required
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="departementId" className={labelBase}>
                Département
              </label>
              <select
                id="departementId"
                name="departementId"
                value={form.departementId}
                onChange={handleChange}
                className={`${fieldBase} appearance-none`}
                required
              >
                <option value="">Sélectionnez votre département</option>
                {departements.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nom}
                  </option>
                ))}
              </select>
              <p className={helperBase}>La liste est chargée depuis la base de données.</p>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="matricule" className={labelBase}>
                Matricule <span className="text-zinc-400">(optionnel)</span>
              </label>
              <input
                id="matricule"
                name="matricule"
                placeholder="Ex.: EMP-00123"
                value={form.matricule}
                onChange={handleChange}
                className={fieldBase}
              />
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[.99]"
            >
              S'inscrire
            </button>

            <div className="pt-2 text-sm text-zinc-600">
              Déjà un compte ?
              <a href="/login" className="font-medium text-blue-700 hover:underline">
                {" "}Se connecter
              </a>
            </div>
          </form>
        </div>

        {/* Note légale / footer mince */}
        <p className="mt-4 text-center text-xs text-zinc-500">
          En créant un compte, vous acceptez nos conditions d’utilisation et notre politique de confidentialité.
        </p>
      </div>
    </div>
  );
}
