import Image from "next/image";
import Link from "next/link";

// Objectif du relooking
// - Palette plus neutre (slate/zinc) avec un bleu discret en primaire
// - L'orange n'apparaît qu'en accent (pastille, liens mineurs)
// - Surfaces très claires, bords doux, ombres légères
// - Pas de thème trop sombre; lisibilité et contraste AA
// - Composants et classes Tailwind prêts à l'emploi

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur bg-white/75 border-b border-zinc-200/60">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/cds.png"
              alt="Logo CDS"
              width={40}
              height={40}
              className="rounded-lg shadow-sm"
            />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-lg tracking-tight text-zinc-900">
                CDS Support
              </span>
              <span className="text-xs text-zinc-500">
                Assistance & interventions IT
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium rounded-xl border border-zinc-200 hover:bg-zinc-50 active:scale-[.99] transition"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[.99] shadow-sm transition"
            >
              Inscription
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-grow">
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Plateforme interne DSI
          </div>

          <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900">
            Bienvenue sur <span className="bg-gradient-to-r from-zinc-900 to-zinc-700 bg-clip-text text-transparent">CDS&nbsp;Support</span>
          </h1>

          <p className="mt-4 text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto">
            Gérez vos demandes d’assistance et vos interventions informatiques rapidement et efficacement.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-[.99] shadow-sm transition"
            >
              Créer un compte
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 rounded-2xl border border-zinc-200 bg-white font-semibold text-zinc-800 hover:bg-zinc-50 transition"
            >
              J’ai déjà un compte
            </Link>
          </div>

          {/* Mini points forts */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-600">
            <div className="inline-flex items-center gap-2">
              <span className="i bi-check-circle w-4 h-4" />
              Suivi en temps réel
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="i bi-check-circle w-4 h-4" />
              Notifications ciblées
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="i bi-check-circle w-4 h-4" />
              KPIs lisibles
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="mx-auto max-w-6xl px-4 pb-16 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition will-change-transform">
            <div className="text-xs font-semibold text-zinc-500 tracking-wide uppercase">
              Pour les employés
            </div>
            <h3 className="mt-2 text-lg font-bold text-zinc-900">Créer un ticket</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Décrivez votre besoin (assistance ou intervention) et suivez l’évolution jusqu’à la clôture.
            </p>
            <Link
              href="/tickets/new"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
            >
              Commencer
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 0 1 1.06 0l6 6a.75.75 0 0 1-1.06 1.06L13.75 6.81V20a.75.75 0 0 1-1.5 0V6.81l-5.22 5.22a.75.75 0 1 1-1.06-1.06l6-6Z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition will-change-transform">
            <div className="text-xs font-semibold text-zinc-500 tracking-wide uppercase">
              Pour les techniciens
            </div>
            <h3 className="mt-2 text-lg font-bold text-zinc-900">Prendre en charge</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Consultez les tickets assignés, échangez par commentaires et mettez à jour les statuts.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
            >
              Ouvrir le tableau
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                <path fillRule="evenodd" d="M3.75 12a.75.75 0 0 1 .75-.75h12.69l-4.22-4.22a.75.75 0 1 1 1.06-1.06l5.5 5.5a.75.75 0 0 1 0 1.06l-5.5 5.5a.75.75 0 1 1-1.06-1.06l4.22-4.22H4.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition will-change-transform">
            <div className="text-xs font-semibold text-zinc-500 tracking-wide uppercase">
              Pour le Chef DSI
            </div>
            <h3 className="mt-2 text-lg font-bold text-zinc-900">Déléguer & superviser</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Recevez les notifications, assignez les tickets et suivez les indicateurs clés.
            </p>
            <Link
              href="/reports"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
            >
              Voir les rapports
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 0 1 1.06 0l6 6a.75.75 0 0 1-1.06 1.06L13.75 6.81V20a.75.75 0 0 1-1.5 0V6.81l-5.22 5.22a.75.75 0 1 1-1.06-1.06l6-6Z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white/75">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-zinc-600">
          &copy; {new Date().getFullYear()} CDS Support. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
