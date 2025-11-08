"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Notif = {
  id: number;
  message: string;
  dateEnvoi: string;
  isRead: boolean;
  ticket: { id: number; description: string | null };
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notif[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok) {
        setUnread(data.unreadCount || 0);
        setItems(data.items || []);
      }
    } catch (e) {
      console.error(e);
    }
  };
  // remplacer useEffect par pour diminuer les logs
  /*
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
  
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setRole(payload.role ?? null);
    } catch {
      return; // Si token invalide, on arrête
    }
  
    let mounted = true;
  
    const fetchWithValidation = async () => {
      if (!mounted) return;
      
      const currentToken = localStorage.getItem("token");
      if (!currentToken) {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
  
      try {
        await fetchNotifications();
      } catch (error) {
        console.error('Erreur fetch notifications:', error);
      }
    };
  
    // Premier appel immédiat
    fetchWithValidation();
  
    // Polling toutes les 60 secondes au lieu de 12
    timerRef.current = window.setInterval(fetchWithValidation, 60000);
  
    return () => {
      mounted = false;
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);
  */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setRole(payload.role ?? null);
      } catch { }
    }

    fetchNotifications();
    timerRef.current = window.setInterval(fetchNotifications, 12000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  // Fermeture quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/notifications`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setUnread(0);
        setItems(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getTicketLink = (id?: number) => {
    if (!id) return null;
    if (role === "CHEF_DSI") return `/dashboard/admin-tickets/${id}`;
    if (role === "TECHNICIEN") return `/dashboard/technicien/${id}`;
    if (role === "EMPLOYE") return `/dashboard/employee?tab=tickets`;
    return null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative inline-flex items-center justify-center rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-medium hover:bg-amber-50"
        aria-label="Notifications"
      >
        {/* Icône cloche simple en SVG */}
        <svg width="20" height="20" viewBox="0 0 24 24" className="mr-1">
          <path d="M12 2a6 6 0 0 0-6 6v3.586l-1.707 1.707A1 1 0 0 0 5 15h14a1 1 0 0 0 .707-1.707L18 11.586V8a6 6 0 0 0-6-6zM8 16a4 4 0 0 0 8 0H8z" />
        </svg>
        Notifications
        {unread > 0 && (
          <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-h-[60vh] overflow-auto rounded-2xl border border-amber-200 bg-white shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-amber-100">
            <span className="font-semibold">Boîte de réception</span>
            <button
              onClick={markAllRead}
              className="text-xs text-amber-700 hover:underline"
            >
              Tout marquer comme lu
            </button>
          </div>

          {items.length === 0 ? (
            <div className="p-4 text-sm text-neutral-500">Aucune notification</div>
          ) : (
            <ul className="divide-y divide-amber-100">
              {items.map(n => {
                const ticketLink = getTicketLink(n.ticket?.id);

                return (
                  <li
                    key={n.id}
                    className={`px-4 py-3 ${n.isRead ? "bg-white" : "bg-amber-50/50"
                      }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-neutral-800">{n.message}</p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {new Date(n.dateEnvoi).toLocaleString()}
                        </p>

                        {ticketLink && role !== "EMPLOYE" && (
                          <div className="mt-2">
                            <Link
                              href={ticketLink}
                              className="text-xs text-amber-700 hover:underline"
                              onClick={() => setOpen(false)}
                            >
                              Ouvrir le ticket #{n.ticket?.id}
                            </Link>
                          </div>
                        )}
                      </div>
                      {!n.isRead && (
                        <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}