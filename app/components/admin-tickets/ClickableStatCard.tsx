import { Clock, AlertCircle, CheckCircle2, XCircle, Send, Archive } from "lucide-react";

const iconComponents = {
    Clock, AlertCircle, CheckCircle2, XCircle, Send, Archive
};

interface ClickableStatCardProps {
    label: string;
    count: number;
    icon: keyof typeof iconComponents;
    color: "amber" | "blue" | "violet" | "rose" | "indigo" | "emerald";
    isActive: boolean;
    onClick: () => void;
}

export function ClickableStatCard({ label, count, icon, color, isActive, onClick }: ClickableStatCardProps) {
    const IconComponent = iconComponents[icon];
    const bgColor = `bg-${color}-50`;
    const textColor = `text-${color}-700`;
    const borderColor = `border-${color}-500`;

    return (
        <button
            onClick={onClick}
            className={`${bgColor} rounded-xl p-4 border-2 transition-all cursor-pointer text-left ${isActive
                    ? `${borderColor} shadow-lg scale-105`
                    : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                }`}
        >
            <div className="flex items-center justify-between mb-2">
                <div className={`bg-${color}-500 text-white p-2 rounded-lg`}>
                    <IconComponent className="h-5 w-5" />
                </div>
            </div>
            <div className="mt-2">
                <p className={`text-2xl font-bold ${textColor}`}>{count}</p>
                <p className="text-sm text-slate-600 mt-1">{label}</p>
            </div>
        </button>
    );
}