"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type Departement = {
  id: number;
  nom: string;
};

export default function RegisterPage() {
  // États
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

  // Fetch départements depuis l'API
  useEffect(() => {
    fetch("/api/departements")
      .then(res => res.json())
      .then((data: Departement[]) => setDepartements(data))
      .catch(err => console.error("Erreur fetch départements :", err));
  }, []);

  // Gestion des changements dans le formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Soumission du formulaire
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md flex flex-col items-center">
        {/* Logo */}
        <Image src="/cds.png" alt="Logo CDS" width={80} height={80} className="mb-4" />

        <h2 className="text-2xl font-bold mb-6 text-center">Inscription Employé</h2>

        <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
          <input
            name="prenom"
            placeholder="Prénom"
            value={form.prenom}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            name="nom"
            placeholder="Nom"
            value={form.nom}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            type="password"
            name="motDePasse"
            placeholder="Mot de passe"
            value={form.motDePasse}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            type="password"
            name="confirmMotDePasse"
            placeholder="Confirmer mot de passe"
            value={form.confirmMotDePasse}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <select
            name="departementId"
            value={form.departementId}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          >
            <option value="">Sélectionnez votre département</option>
            {departements.map(d => (
              <option key={d.id} value={d.id}>{d.nom}</option>
            ))}
          </select>
          <input
            name="matricule"
            placeholder="Matricule (optionnel)"
            value={form.matricule}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <button
            type="submit"
            className="bg-blue-900 text-white p-2 rounded hover:bg-blue-800"
          >
            S'inscrire
          </button>
        </form>
      </div>
    </div>
  );
}
