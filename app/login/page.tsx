"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, motDePasse }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Identifiants incorrects");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      const role = data.user.role;
      if (role === "CHEF_DSI") router.push("/dashboard/admin-tickets");
      else if (role === "EMPLOYE") router.push("/dashboard/employee");
      else if (role === "TECHNICIEN") router.push("/dashboard/technicien");
    } catch (err) {
      console.error(err);
      setErrorMsg("Erreur lors de la connexion. Réessayez.");
      setLoading(false);
    }
  };

  const fieldBase =
    "border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-4 py-2.5 transition bg-white placeholder:text-slate-400 text-slate-800";

  return (
    <div className="h-screen overflow-hidden min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-100 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative w-20 h-20 mb-3 rounded-2xl shadow-lg bg-white p-3 border border-slate-200">
            <Image src="/cds.png" alt="Logo CDS" fill className="object-contain p-2" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">CDS Support</h1>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white">
            <h2 className="text-xl font-bold text-slate-900">Connexion</h2>
            <p className="text-sm text-slate-600 mt-1">Entrez vos identifiants</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 grid gap-5">
            {errorMsg && (
              <div className="w-full rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">
                {errorMsg}
              </div>
            )}

            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">Adresse email</label>
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
              <label htmlFor="motDePasse" className="text-sm font-medium text-slate-700">Mot de passe</label>
              <input
                id="motDePasse"
                type="password"
                placeholder="Votre mot de passe"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                required
                className={fieldBase}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`mt-2 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-semibold text-white shadow-md transition-all bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[.98] ${loading && "opacity-60 cursor-not-allowed"}`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  Connexion...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Se connecter
                </span>
              )}
            </button>

            {/*
                <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-100">
                  <a href="/register" className="text-blue-600 hover:underline font-medium">
                    Créer un compte
                  </a>
                  <a href="/forgot" className="text-slate-500 hover:underline">
                    Mot de passe oublié
                  </a>
                </div>
          */}

          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">© 2025 CDS Support</p>
      </div>
    </div>
  );
}
