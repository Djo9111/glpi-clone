import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-amber-50/40">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-amber-100">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/cds.png" alt="Logo CDS" width={48} height={48} className="rounded-xl shadow-sm" />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-xl tracking-tight">CDS Support</span>
              <span className="text-xs text-neutral-500">Assistance & interventions IT</span>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium rounded-xl border border-amber-200 hover:border-amber-300 hover:bg-amber-50 transition"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium rounded-xl bg-amber-500 text-white hover:bg-amber-600 active:scale-[.99] shadow-sm transition"
            >
              Inscription
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-grow">
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs text-amber-700 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Plateforme interne DSI
          </div>
          <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight text-neutral-900">
            Bienvenue sur <span className="text-amber-600">CDS&nbsp;Support</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-neutral-600">
            Gérez vos demandes d’assistance et vos interventions informatiques rapidement et efficacement.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="px-6 py-3 rounded-2xl bg-amber-500 text-white font-semibold hover:bg-amber-600 active:scale-[.99] shadow-sm transition"
            >
              Créer un compte
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 rounded-2xl border border-amber-200 bg-white font-semibold text-neutral-800 hover:bg-amber-50 transition"
            >
              J’ai déjà un compte
            </Link>
          </div>
        </section>

        {/* Feature cards */}
        <section className="mx-auto max-w-6xl px-4 pb-16 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="text-sm font-semibold text-amber-700">Pour les employés</div>
            <h3 className="mt-1 text-lg font-bold">Créer un ticket</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Décrivez votre besoin (assistance ou intervention) et suivez l’évolution jusqu’à la clôture.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="text-sm font-semibold text-amber-700">Pour les techniciens</div>
            <h3 className="mt-1 text-lg font-bold">Prendre en charge</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Consultez les tickets assignés, échangez par commentaires et mettez à jour les statuts.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="text-sm font-semibold text-amber-700">Pour le Chef DSI</div>
            <h3 className="mt-1 text-lg font-bold">Déléguer & superviser</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Recevez les notifications, assignez les tickets et suivez les indicateurs clés.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-100 bg-white/70">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-neutral-600">
          &copy; {new Date().getFullYear()} CDS Support. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}