export type TicketStatut = "OPEN" | "IN_PROGRESS" | "A_CLOTURER" | "CLOSED" | "TRANSFERE_MANTIS" | "REJETE"; // AJOUT DE REJETE

export type Ticket = {
    id: number;
    description: string;
    type: "ASSISTANCE" | "INTERVENTION";
    statut: TicketStatut; // Maintenant inclut REJETE
    dateCreation: string;
    assignedTo?: { id: number; prenom: string; nom: string } | null;
    createdBy?: { id: number; prenom: string; nom: string } | null;
};

export type SubordinateUser = {
    id: number;
    prenom: string;
    nom: string;
    email: string;
    codeHierarchique: number;
    departement?: { id: number; nom: string } | null;
};

export type PieceJointe = { id: number; nomFichier: string; url: string };

export type CommentItem = {
    id: number;
    contenu: string;
    createdAt: string;
    auteur: { id: number; prenom: string; nom: string };
};

export type Application = { id: number; nom: string };

export type Materiel = { id: number; nom: string };

export type TicketForm = {
    description: string;
    typeTicket: "ASSISTANCE" | "INTERVENTION";
    applicationId?: number | "";
    materielId?: number | "";
};

export function normalizeStatus(s: unknown): TicketStatut {
    if (typeof s !== "string") return "OPEN";
    const k = s.trim().toLowerCase();

    if (k === "open") return "OPEN";
    if (k === "in_progress" || k === "in-progress") return "IN_PROGRESS";
    if (k === "a_cloturer" || k === "a-cloturer" || k === "à_clôturer" || k === "à-clôturer") return "A_CLOTURER";
    if (k === "closed" || k === "close") return "CLOSED";
    if (k === "rejete" || k === "rejeté") return "REJETE"; // AJOUT DE CETTE LIGNE

    // AJOUT : Gestion du statut TRANSFERE_MANTIS
    if (k === "transfere_mantis" || k === "transfere" || k === "transféré" || k === "transféré_mantis") return "TRANSFERE_MANTIS";

    // Traitement des autres formats
    if (k === "en_attente" || k === "en-attente" || k === "attente" || k === "nouveau") return "OPEN";
    if (k === "en_cours" || k === "en-cours" || k === "traitement") return "IN_PROGRESS";
    if (k === "resolu" || k === "résolu") return "A_CLOTURER";
    if (k === "cloture" || k === "clôturé" || k === "cloturé") return "CLOSED";

    return "OPEN";
}

export function normalizeTicket(raw: any): Ticket {
    return {
        id: Number(raw.id),
        description: String(raw.description ?? ""),
        type: (raw.type === "INTERVENTION" ? "INTERVENTION" : "ASSISTANCE") as "ASSISTANCE" | "INTERVENTION",
        statut: normalizeStatus(raw.statut ?? raw.status),
        dateCreation: String(raw.dateCreation ?? raw.createdAt ?? new Date().toISOString()),
        assignedTo: raw.assignedTo
            ? {
                id: Number(raw.assignedTo.id),
                prenom: String(raw.assignedTo.prenom ?? ""),
                nom: String(raw.assignedTo.nom ?? ""),
            }
            : null,
        createdBy: raw.createdBy
            ? {
                id: Number(raw.createdBy.id),
                prenom: String(raw.createdBy.prenom ?? ""),
                nom: String(raw.createdBy.nom ?? ""),
            }
            : null,
    };
}