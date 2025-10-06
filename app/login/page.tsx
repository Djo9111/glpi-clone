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

      // Stockage du JWT
      localStorage.setItem("token", data.token);

      // Redirection selon rôle
      const role = data.user.role; // <-- utiliser data.user.role
      if (role === "CHEF_DSI") window.location.href = "/dashboard/admin-tickets";
      else if (role === "EMPLOYE") window.location.href = "/dashboard/employee";
      else if (role === "TECHNICIEN") window.location.href = "/dashboard/technicien";
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la connexion");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-amber-50/40 px-4">
      <div className="w-full max-w-md">
        {/* Logo / entête compact */}
        <div className="mb-6 flex items-center gap-3">
          <Image src="/cds.png" alt="Logo CDS" width={56} height={56} className="rounded-xl shadow-sm" />
          <div className="leading-tight">
            <h1 className="text-xl font-semibold tracking-tight">CDS Support</h1>
            <p className="text-xs text-neutral-500">Accédez à votre espace</p>
          </div>
        </div>

        {/* Carte de connexion */}
        <div className="rounded-2xl border border-amber-100 bg-white shadow-sm">
          <div className="border-b border-amber-100 px-6 py-4">
            <h2 className="text-lg font-bold">Connexion</h2>
            <p className="mt-1 text-sm text-neutral-600">Entrez vos identifiants pour continuer.</p>
          </div>

          <form className="px-6 py-6 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                placeholder="vous@entreprise.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="border border-amber-200 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 outline-none rounded-xl px-3 py-2"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="motDePasse" className="text-sm font-medium">Mot de passe</label>
              <input
                id="motDePasse"
                type="password"
                placeholder="••••••••"
                value={motDePasse}
                onChange={e => setMotDePasse(e.target.value)}
                required
                className="border border-amber-2 00 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60 outline-none rounded-xl px-3 py-2"
              />
            </div>

            <button type="submit" className="mt-2 inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-amber-600 active:scale-[.99]">
              Se connecter
            </button>

            <div className="flex items-center justify-between text-sm pt-1">
              <a href="/register" className="text-amber-700 hover:underline">Créer un compte</a>
              <a href="/forgot" className="text-neutral-500 hover:underline">Mot de passe oublié ?</a>
            </div>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-neutral-500">Accès réservé aux utilisateurs autorisés.</p>
      </div>
    </div>
  );
}