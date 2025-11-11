import { TicketStatut } from "../../dashboard/employee/utils/ticketHelpers";

interface StatusChipProps {
    statut: TicketStatut;
}

export default function StatusChip({ statut }: StatusChipProps) {
    const map = {
        OPEN: { label: "Ouvert", cls: "bg-yellow-50 text-yellow-700 border-yellow-300", icon: "" },
        IN_PROGRESS: { label: "En cours", cls: "bg-blue-50 text-blue-700 border-blue-300", icon: "" },
        A_CLOTURER: { label: "À clôturer", cls: "bg-violet-50 text-violet-700 border-violet-300", icon: "" },
        CLOSED: { label: "Clôturé", cls: "bg-emerald-50 text-emerald-700 border-emerald-300", icon: "" },
        TRANSFERE_MANTIS: { label: "Transféré à MANTIS", cls: "bg-orange-50 text-orange-700 border-orange-300", icon: "" },
        REJETE: { label: "Rejeté", cls: "bg-red-50 text-red-700 border-red-300", icon: "" }, // AJOUT DE CETTE LIGNE
    } as const;

    const s = map[statut];

    return (
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${s.cls} flex items-center gap-1.5`}>
            <span>{s.icon}</span>
            {s.label}
        </span>
    );
}