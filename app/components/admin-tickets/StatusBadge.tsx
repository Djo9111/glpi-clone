import { statusLabel, type Ticket } from "@/app/dashboard/admin-tickets/utils/ticketHelpers";

export function StatusBadge({ status }: { status: Ticket["statut"] }) {
    const config = {
        OPEN: { className: "bg-amber-100 text-amber-800" },
        IN_PROGRESS: { className: "bg-blue-100 text-blue-800" },
        A_CLOTURER: { className: "bg-violet-100 text-violet-800" },
        REJETE: { className: "bg-rose-100 text-rose-800" },
        TRANSFERE_MANTICE: { className: "bg-indigo-100 text-indigo-800" },
        CLOSED: { className: "bg-emerald-100 text-emerald-800" },
    };

    const { className } = config[status];
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
            {statusLabel(status)}
        </span>
    );
}