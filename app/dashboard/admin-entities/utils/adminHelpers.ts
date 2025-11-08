export type Role = "EMPLOYE" | "TECHNICIEN" | "CHEF_DSI";

export type Departement = {
    id: number;
    nom: string;
    responsableId?: number | null;
    responsable?: { id: number; prenom: string; nom: string; email: string } | null;
};

export type Utilisateur = {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: Role;
    matricule?: string | null;
    departementId?: number | null;
    departement?: { id: number; nom: string } | null;
    codeHierarchique: number;
};

export type Application = { id: number; nom: string };
export type Materiel = { id: number; nom: string };

/* =========================================================
   Helpers dédoublonnage
   ========================================================= */
export function upsertByIdOrName<T extends { id?: number; nom?: string }>(
    arr: T[],
    item: T
): T[] {
    const byId = typeof item.id === "number"
        ? arr.findIndex((x) => x.id === item.id)
        : -1;

    if (byId >= 0) {
        const next = arr.slice();
        next[byId] = item;
        return next;
    }

    if (item.nom) {
        const lname = item.nom.toLowerCase();
        const byName = arr.findIndex((x) => (x.nom || "").toLowerCase() === lname);
        if (byName >= 0) {
            const next = arr.slice();
            next[byName] = item;
            return next;
        }
    }

    return [...arr, item];
}

/* =========================================================
   HTTP helpers
   ========================================================= */
export const authHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    };
};

export const fetchAllData = async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const [depsRes, usersRes, appsRes, matsRes] = await Promise.all([
        fetch("/api/departements", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        fetch("/api/utilisateurs", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        fetch("/api/applications", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        fetch("/api/materiels", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
    ]);

    const [deps, users, apps, mats] = await Promise.all([
        depsRes.json(),
        usersRes.json(),
        appsRes.json(),
        matsRes.json(),
    ]);

    return {
        departements: Array.isArray(deps) ? deps : [],
        utilisateurs: Array.isArray(users) ? users : [],
        applications: Array.isArray(apps) ? apps : [],
        materiels: Array.isArray(mats) ? mats : [],
    };
};

export const postJson = async (url: string, body: any) => {
    const res = await fetch(url, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Erreur HTTP ${res.status}`);
    return { data, status: res.status };
};

export const patchJson = async (url: string, body: any) => {
    const res = await fetch(url, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Erreur HTTP ${res.status}`);
    return data;
};

export const deleteItem = async (kind: "application" | "departement" | "materiel" | "utilisateur", id: number) => {
    const endpoint = kind === "utilisateur" ? "utilisateurs" : kind + "s";
    const res = await fetch(`/api/${endpoint}/${id}`, {
        method: "DELETE",
        headers: authHeaders()
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Erreur HTTP ${res.status}`);
    return data;
};