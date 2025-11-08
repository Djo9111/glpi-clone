import { PlusCircle, AppWindow, Building2, Boxes, Users } from "lucide-react";

interface EntityCreationPanelProps {
    onShowModal: (modal: "application" | "departement" | "materiel" | "utilisateur") => void;
}

function EntityButton({ icon, title, subtitle, onClick, color }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick: () => void;
    color: "blue" | "purple" | "orange" | "green";
}) {
    const colorClasses = {
        blue: { bg: "bg-blue-50 hover:bg-blue-100", text: "text-blue-700", border: "hover:border-blue-300" },
        purple: { bg: "bg-purple-50 hover:bg-purple-100", text: "text-purple-700", border: "hover:border-purple-300" },
        orange: { bg: "bg-orange-50 hover:bg-orange-100", text: "text-orange-700", border: "hover:border-orange-300" },
        green: { bg: "bg-green-50 hover:bg-green-100", text: "text-green-700", border: "hover:border-green-300" },
    };

    return (
        <button
            onClick={onClick}
            className={`group w-full text-left rounded-2xl border border-slate-200 bg-white p-6 ${colorClasses[color].border} hover:shadow-lg transition-all`}
        >
            <div className="flex items-center gap-4">
                <div className={`rounded-xl ${colorClasses[color].bg} ${colorClasses[color].text} p-4 transition-colors`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <div className="font-semibold text-slate-900 text-lg">{title}</div>
                    <div className="text-sm text-slate-500 mt-0.5">{subtitle}</div>
                </div>
            </div>
            <div className={`mt-4 inline-flex items-center gap-2 text-sm font-medium ${colorClasses[color].text}`}>
                <PlusCircle className="h-4 w-4" />
                Créer maintenant
            </div>
        </button>
    );
}

export default function EntityCreationPanel({ onShowModal }: EntityCreationPanelProps) {
    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Créer une entité</h2>
                    <p className="text-sm text-slate-500 mt-1">Ajoutez rapidement de nouveaux éléments au système</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <EntityButton
                    icon={<AppWindow className="h-6 w-6" />}
                    title="Application"
                    subtitle="Nouvelle application"
                    onClick={() => onShowModal("application")}
                    color="blue"
                />
                <EntityButton
                    icon={<Building2 className="h-6 w-6" />}
                    title="Département"
                    subtitle="Nouveau département"
                    onClick={() => onShowModal("departement")}
                    color="purple"
                />
                <EntityButton
                    icon={<Boxes className="h-6 w-6" />}
                    title="Matériel"
                    subtitle="Nouveau matériel"
                    onClick={() => onShowModal("materiel")}
                    color="orange"
                />
                <EntityButton
                    icon={<Users className="h-6 w-6" />}
                    title="Utilisateur"
                    subtitle="Nouveau compte"
                    onClick={() => onShowModal("utilisateur")}
                    color="green"
                />
            </div>
        </div>
    );
}