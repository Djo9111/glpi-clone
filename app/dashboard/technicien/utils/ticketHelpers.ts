export type Ticket = {
    id: number;
    description: string;
    type: "ASSISTANCE" | "INTERVENTION";
    statut: "OPEN" | "IN_PROGRESS" | "A_CLOTURER" | "REJETE" | "TRANSFERE_MANTIS" | "CLOSED"; // CORRIGÉ
    dateCreation?: string;
    createdBy: { id: number; prenom: string; nom: string };
    assignedTo?: { id: number; prenom: string; nom: string } | null;
    application?: { id: number; nom: string } | null;
    materiel?: { id: number; nom: string } | null;
    mantisNumero?: string | null; // CORRIGÉ
};


export type PieceJointe = { id: number; nomFichier: string; url: string };

export function statusLabel(s: Ticket["statut"]): string {
    switch (s) {
        case "OPEN": return "Ouvert";
        case "IN_PROGRESS": return "En cours";
        case "A_CLOTURER": return "À clôturer";
        case "REJETE": return "Rejeté";
        case "TRANSFERE_MANTIS": return "Transféré MANTIS"; // CORRIGÉ
        case "CLOSED": return "Clôturé";
        default: return String(s);
    }
}

export function normalizeStatus(s: unknown): Ticket["statut"] {
    if (typeof s !== "string") return "OPEN";
    const k = s.trim().toLowerCase();
    if (k === "open") return "OPEN";
    if (k === "in_progress" || k === "in-progress") return "IN_PROGRESS";
    if (k === "a_cloturer" || k === "a-cloturer" || k === "à_clôturer" || k === "à-clôturer") return "A_CLOTURER";
    if (k === "rejete" || k === "rejeté") return "REJETE";
    if (k === "transfere_mantis" || k === "transfère_mantis" || k === "transfere-mantis") return "TRANSFERE_MANTIS"; // CORRIGÉ
    if (k === "closed" || k === "close") return "CLOSED";
    if (k === "en_attente" || k === "en-attente" || k === "attente" || k === "nouveau") return "OPEN";
    if (k === "en_cours" || k === "en-cours" || k === "traitement") return "IN_PROGRESS";
    if (k === "resolu" || k === "résolu" || k === "cloture" || k === "clôturé") return "CLOSED";
    return "OPEN";
}

export function normalizeTicket(raw: any): Ticket {
    return {
        id: Number(raw.id),
        description: String(raw.description ?? ""),
        type: (raw.type === "INTERVENTION" ? "INTERVENTION" : "ASSISTANCE"),
        statut: normalizeStatus(raw.statut ?? raw.status),
        dateCreation: String(raw.dateCreation ?? raw.createdAt ?? new Date().toISOString()),
        createdBy: {
            id: Number(raw.createdBy?.id ?? 0),
            prenom: String(raw.createdBy?.prenom ?? ""),
            nom: String(raw.createdBy?.nom ?? ""),
        },
        assignedTo: raw.assignedTo
            ? { id: Number(raw.assignedTo.id), prenom: String(raw.assignedTo.prenom ?? ""), nom: String(raw.assignedTo.nom ?? "") }
            : null,
        application: raw.application ? { id: Number(raw.application.id), nom: String(raw.application.nom ?? "") } : null,
        materiel: raw.materiel ? { id: Number(raw.materiel.id), nom: String(raw.materiel.nom ?? "") } : null,
        mantisNumero: raw.mantisNumero ?? null, // CORRIGÉ
    };
}