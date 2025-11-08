interface NotificationProps {
    notif: { type: "success" | "error"; msg: string } | null;
}

export default function Notification({ notif }: NotificationProps) {
    if (!notif) return null;

    return (
        <div className={`rounded-xl px-5 py-4 text-sm border shadow-sm animate-in fade-in slide-in-from-top-2 ${notif.type === "success"
                ? "bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-300 text-emerald-900"
                : "bg-gradient-to-r from-rose-50 to-rose-100/50 border-rose-300 text-rose-900"
            }`}>
            <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${notif.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`} />
                <span className="font-medium">{notif.msg}</span>
            </div>
        </div>
    );
}