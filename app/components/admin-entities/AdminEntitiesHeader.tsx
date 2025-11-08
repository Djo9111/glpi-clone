import Link from "next/link";

interface AdminEntitiesHeaderProps {
    onLogout: () => void;
    loggingOut: boolean;
}

export default function AdminEntitiesHeader({ onLogout, loggingOut }: AdminEntitiesHeaderProps) {
    return (
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg shadow-sm">
            <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img src="/cds.png" alt="CDS" className="h-9 w-auto" />
                    <div className="h-8 w-px bg-slate-200" />
                    <h1 className="text-xl font-bold text-slate-900">Administration des entités</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/reporting"
                        className="px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        Reporting
                    </Link>
                    <Link
                        href="/dashboard/admin-tickets"
                        className="px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        Tickets
                    </Link>
                    <button
                        onClick={onLogout}
                        disabled={loggingOut}
                        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs md:text-sm font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loggingOut ? (
                            <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-600"></div>
                                Déconnexion...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Déconnexion
                            </>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}