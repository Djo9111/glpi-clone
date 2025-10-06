// app/page.tsx
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6 bg-blue-900 text-white">
        <div className="flex items-center gap-2">
          <Image src="/cds.png" alt="Logo CDS" width={60} height={60} />
          <span className="font-bold text-xl">CDS Support</span>
        </div>
        <nav className="flex gap-4">
          <Link href="/login" className="hover:underline">Connexion</Link>
          <Link href="/register" className="hover:underline">Inscription</Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-grow flex flex-col justify-center items-center text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Bienvenue sur CDS Support</h1>
        <p className="text-lg md:text-xl text-gray-700 mb-6">
          Gérez vos demandes d’assistance et interventions informatiques rapidement et efficacement
        </p>
        <Link href="/register" className="bg-blue-900 text-white px-6 py-3 rounded hover:bg-blue-800">
          Créer un compte
        </Link>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 text-gray-600 text-center py-4">
        &copy; {new Date().getFullYear()} CDS Support. Tous droits réservés.
      </footer>
    </div>
  );
}
