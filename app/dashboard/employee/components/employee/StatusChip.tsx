import { TicketStatut } from "../../utils/ticketHelpers";

interface StatusChipProps {
    statut: TicketStatut;
}

export default function StatusChip({ statut }: StatusChipProps) {
    const map = {
        OPEN: { label: "Ouvert", cls: "bg-yellow-50 text-yellow-700 border-yellow-300", icon: "" },
        IN_PROGRESS: { label: "En cours", cls: "bg-blue-50 text-blue-700 border-blue-300", icon: "" },
        A_CLOTURER: { label: "À clôturer", cls: "bg-violet-50 text-violet-700 border-violet-300", icon: "" },
        CLOSED: { label: "Clôturé", cls: "bg-emerald-50 text-emerald-700 border-emerald-300", icon: "" },
        TRANSFERE_MANTICE: { label: "Transféré à Mantice", cls: "bg-orange-50 text-orange-700 border-orange-300", icon: "" },
    } as const;

    const s = map[statut];

    return (
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${s.cls} flex items-center gap-1.5`}>
            <span>{s.icon}</span>
            {s.label}
        </span>
    );
}