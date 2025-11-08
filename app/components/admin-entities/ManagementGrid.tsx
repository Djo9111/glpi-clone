import { AppWindow, Building2, Boxes, Users, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { type Application, type Departement, type Materiel, type Utilisateur } from "@/app/dashboard/admin-entities/utils/adminHelpers";

interface ManagementGridProps {
    applications: Application[];
    departements: Departement[];
    materiels: Materiel[];
    utilisateurs: Utilisateur[];
    totals: {
        apps: number;
        deps: number;
        mats: number;
        users: number;
    };
    currentPages: {
        apps: number;
        deps: number;
        mats: number;
        users: number;
    };
    totalPages: {
        apps: number;
        deps: number;
        mats: number;
        users: number;
    };
    searchTerms: {
        apps: string;
        deps: string;
        mats: string;
        users: string;
    };
    onPageChange: (pages: any) => void;
    onSearchChange: (terms: any) => void;
    onEditApp: (app: Application) => void;
    onEditDep: (dep: Departement) => void;
    onEditMat: (mat: Materiel) => void;
    onEditUser: (user: Utilisateur) => void;
    onDelete: (kind: "application" | "departement" | "materiel" | "utilisateur", id: number) => void;
}

function ManageCard<T>({
    title,
    icon,
    color,
    data,
    total,
    currentPage,
    totalPages,
    onPageChange,
    searchTerm,
    onSearchChange,
    renderRow,
    onEdit,
    onDelete,
}: {
    title: string;
    icon: React.ReactNode;
    color: "blue" | "purple" | "orange" | "green";
    data: T[];
    total: number;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    renderRow: (item: T) => { id: number; main: string; sub?: string };
    onEdit: (index: number) => void;
    onDelete: (index: number) => void;
}) {
    const colorClasses = {
        blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
        purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
        orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
        green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden">
            <div className={`${colorClasses[color].bg} border-b ${colorClasses[color].border} p-5`}>
                <div className="flex items-center gap-3">
                    <div className={`${colorClasses[color].text}`}>{icon}</div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                        <p className="text-sm text-slate-600">{total} élément{total > 1 ? 's' : ''} au total</p>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Rechercher..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                </div>

                {/* Data */}
                {data.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-slate-400 mb-2">
                            <Boxes className="h-12 w-12 mx-auto" />
                        </div>
                        <p className="text-sm text-slate-500">Aucun élément trouvé</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {data.map((item, idx) => {
                            const row = renderRow(item);
                            return (
                                <div
                                    key={row.id}
                                    className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-200 text-slate-700 text-xs font-mono font-semibold">
                                                #{row.id}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-slate-900 truncate">{row.main}</p>
                                                {row.sub && <p className="text-sm text-slate-500 truncate mt-0.5">{row.sub}</p>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit(idx)}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
                                            title="Modifier"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">Modifier</span>
                                        </button>
                                        <button
                                            onClick={() => onDelete(idx)}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-300 text-rose-700 bg-white hover:bg-rose-50 text-sm font-medium transition-colors"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">Supprimer</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <p className="text-sm text-slate-600">
                            Page {currentPage} sur {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onPageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Préc.
                            </button>
                            <button
                                onClick={() => onPageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                            >
                                Suiv.
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ManagementGrid({
    applications,
    departements,
    materiels,
    utilisateurs,
    totals,
    currentPages,
    totalPages,
    searchTerms,
    onPageChange,
    onSearchChange,
    onEditApp,
    onEditDep,
    onEditMat,
    onEditUser,
    onDelete,
}: ManagementGridProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ManageCard
                title="Applications"
                icon={<AppWindow className="h-5 w-5" />}
                color="blue"
                data={applications}
                total={totals.apps}
                currentPage={currentPages.apps}
                totalPages={totalPages.apps}
                onPageChange={(p) => onPageChange({ ...currentPages, apps: p })}
                searchTerm={searchTerms.apps}
                onSearchChange={(v) => onSearchChange({ ...searchTerms, apps: v })}
                renderRow={(a) => ({ id: a.id, main: a.nom })}
                onEdit={(idx) => onEditApp(applications[idx])}
                onDelete={(idx) => onDelete("application", applications[idx].id)}
            />
            <ManageCard
                title="Matériels"
                icon={<Boxes className="h-5 w-5" />}
                color="orange"
                data={materiels}
                total={totals.mats}
                currentPage={currentPages.mats}
                totalPages={totalPages.mats}
                onPageChange={(p) => onPageChange({ ...currentPages, mats: p })}
                searchTerm={searchTerms.mats}
                onSearchChange={(v) => onSearchChange({ ...searchTerms, mats: v })}
                renderRow={(m) => ({ id: m.id, main: m.nom })}
                onEdit={(idx) => onEditMat(materiels[idx])}
                onDelete={(idx) => onDelete("materiel", materiels[idx].id)}
            />
            <ManageCard
                title="Départements"
                icon={<Building2 className="h-5 w-5" />}
                color="purple"
                data={departements}
                total={totals.deps}
                currentPage={currentPages.deps}
                totalPages={totalPages.deps}
                onPageChange={(p) => onPageChange({ ...currentPages, deps: p })}
                searchTerm={searchTerms.deps}
                onSearchChange={(v) => onSearchChange({ ...searchTerms, deps: v })}
                renderRow={(d) => ({
                    id: d.id,
                    main: d.nom,
                    sub: d.responsable ? `Resp: ${d.responsable.prenom} ${d.responsable.nom}` : undefined
                })}
                onEdit={(idx) => onEditDep(departements[idx])}
                onDelete={(idx) => onDelete("departement", departements[idx].id)}
            />
            <ManageCard
                title="Utilisateurs"
                icon={<Users className="h-5 w-5" />}
                color="green"
                data={utilisateurs}
                total={totals.users}
                currentPage={currentPages.users}
                totalPages={totalPages.users}
                onPageChange={(p) => onPageChange({ ...currentPages, users: p })}
                searchTerm={searchTerms.users}
                onSearchChange={(v) => onSearchChange({ ...searchTerms, users: v })}
                renderRow={(u) => ({
                    id: u.id,
                    main: `${u.prenom} ${u.nom}`,
                    sub: `${u.email} • ${u.role} • Code: ${u.codeHierarchique}${u.departement ? ` • ${u.departement.nom}` : ""}`
                })}
                onEdit={(idx) => onEditUser(utilisateurs[idx])}
                onDelete={(idx) => onDelete("utilisateur", utilisateurs[idx].id)}
            />
        </div>
    );
}