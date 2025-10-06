"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form className="bg-white p-8 rounded shadow-md w-full max-w-md flex flex-col gap-4" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold text-center mb-4">Connexion</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={motDePasse}
          onChange={e => setMotDePasse(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <button type="submit" className="bg-blue-900 text-white p-2 rounded hover:bg-blue-800">
          Se connecter
        </button>
      </form>
    </div>
  );
}
