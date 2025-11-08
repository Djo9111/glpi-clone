import { AppWindow, Building2, Boxes, Users } from "lucide-react";

interface StatsOverviewProps {
    stats: {
        apps: number;
        deps: number;
        mats: number;
        users: number;
    };
}

function MiniStat({ icon, label, value, color }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: "blue" | "purple" | "orange" | "green";
}) {
    const colorClasses = {
        blue: "from-blue-500 to-blue-600",
        purple: "from-purple-500 to-purple-600",
        orange: "from-orange-500 to-orange-600",
        green: "from-green-500 to-green-600",
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white shadow-lg`}>
                    {icon}
                </div>
                <span className="text-3xl font-bold text-slate-900">{value}</span>
            </div>
            <div className="text-sm font-medium text-slate-600 mt-3">{label}</div>
        </div>
    );
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MiniStat icon={<AppWindow className="h-5 w-5" />} label="Applications" value={stats.apps} color="blue" />
            <MiniStat icon={<Building2 className="h-5 w-5" />} label="Départements" value={stats.deps} color="purple" />
            <MiniStat icon={<Boxes className="h-5 w-5" />} label="Matériels" value={stats.mats} color="orange" />
            <MiniStat icon={<Users className="h-5 w-5" />} label="Utilisateurs" value={stats.users} color="green" />
        </div>
    );
}