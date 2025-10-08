"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, motDePasse }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      localStorage.setItem("token", data.token);

      const role = data.user.role;
      if (role === "CHEF_DSI") router.push("/dashboard/admin-tickets");
      else if (role === "EMPLOYE") router.push("/dashboard/employee");
      else if (role === "TECHNICIEN") router.push("/dashboard/technicien");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la connexion");
    }
  };

  const fieldBase =
    "border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-4 py-2.5 transition bg-white placeholder:text-slate-400 text-slate-800";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4 relative overflow-hidden">
      {/* Décoration de fond subtile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-100 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo et en-tête */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative w-24 h-24 mb-4 rounded-2xl shadow-lg bg-white p-3 border border-slate-200">
            <Image
              src="/cds.png"
              alt="Logo CDS"
              fill
              className="object-contain p-2"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">
            CDS Support
          </h1>
          <p className="text-sm text-slate-600">Portail de gestion des demandes techniques</p>
        </div>

        {/* Carte de connexion */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-1 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
              <h2 className="text-xl font-bold text-slate-900">Connexion</h2>
            </div>
            <p className="text-sm text-slate-600 ml-3">
              Entrez vos identifiants pour accéder à votre espace
            </p>
          </div>

          <div className="px-6 py-6 grid gap-5">
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
                placeholder="prenom.nom@cds.sn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={fieldBase}
              />
            </div>

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
                placeholder="Entrez votre mot de passe"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                required
                className={fieldBase}
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-orange-600 hover:to-orange-700 active:scale-[.98]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Se connecter
            </button>

            <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-100">
              <a 
                href="/register" 
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Créer un compte
              </a>
              <a 
                href="/forgot" 
                className="text-slate-500 hover:text-slate-700 hover:underline transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mot de passe oublié
              </a>
            </div>
          </div>
        </div>

        {/* Note de sécurité */}
        <div className="mt-6 flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-200 p-3">
          <svg className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <p className="text-xs font-medium text-slate-700">Accès sécurisé</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Cette plateforme est réservée aux utilisateurs autorisés. Vos données sont protégées et chiffrées.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          © 2025 CDS Support • Tous droits réservés
        </p>
      </div>
    </div>
  );
}