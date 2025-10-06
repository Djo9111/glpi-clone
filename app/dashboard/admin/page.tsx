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

  // Vérification JWT
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

  // Récupération des départements
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

  if (!user) return <p>Chargement...</p>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Admin - Création Utilisateur</h1>
      <div className="bg-white p-6 rounded shadow w-full max-w-md">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input name="prenom" placeholder="Prénom" value={form.prenom} onChange={handleChange} className="border p-2 rounded" required />
          <input name="nom" placeholder="Nom" value={form.nom} onChange={handleChange} className="border p-2 rounded" required />
          <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className="border p-2 rounded" required />
          <input type="password" name="motDePasse" placeholder="Mot de passe" value={form.motDePasse} onChange={handleChange} className="border p-2 rounded" required />
          <select name="role" value={form.role} onChange={handleChange} className="border p-2 rounded" required>
            <option value="ADMIN">Admin</option>
            <option value="TECHNICIEN">Technicien</option>
          </select>
          <select name="departementId" value={form.departementId} onChange={handleChange} className="border p-2 rounded" required>
            <option value="">Sélectionnez un département</option>
            {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
          </select>
          <button type="submit" className="bg-blue-900 text-white p-2 rounded hover:bg-blue-800">Créer utilisateur</button>
        </form>
      </div>
    </div>
  );
}
