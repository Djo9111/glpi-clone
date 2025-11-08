"use client";

import { useState, useEffect, useCallback } from "react";
import { type PieceJointe } from "@/app/dashboard/admin-tickets/utils/ticketHelpers";

export function AttachmentList({ ticketId }: { ticketId: number }) {
    const [loading, setLoading] = useState(false);
    const [list, setList] = useState<PieceJointe[]>([]);
    const [loadedOnce, setLoadedOnce] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/tickets/${ticketId}/pieces-jointes`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            });
            const data = await res.json();
            setList(Array.isArray(data) ? data : []);
            setLoadedOnce(true);
        } catch {
            setList([]);
        } finally {
            setLoading(false);
        }
    }, [ticketId]);

    useEffect(() => {
        if (!loadedOnce) load();
    }, [loadedOnce, load]);

    return (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            {loading && <div className="text-sm text-slate-500">Chargement…</div>}
            {!loading && list.length === 0 && (
                <div className="text-sm text-slate-500">Aucune pièce jointe</div>
            )}
            {!loading && list.length > 0 && (
                <ul className="space-y-2">
                    {list.map((f) => (
                        <li key={f.id}>
                            <a
                                href={f.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-700 hover:underline break-all"
                                title={f.nomFichier}
                            >
                                📎 {f.nomFichier}
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}