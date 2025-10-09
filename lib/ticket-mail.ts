// lib/ticket-mail.ts
type TicketEmailData = {
  id: number;
  type: "ASSISTANCE" | "INTERVENTION";
  description: string;
  dateCreation: Date | string;
  createdBy: { prenom: string; nom: string; email?: string };
  pieceUrls?: string[]; // liens publics vers /public/uploads/...
};

export function ticketHtml(t: TicketEmailData) {
  const desc = escapeHtml(t.description);
  const date = new Date(t.dateCreation).toLocaleString();
  const pj = (t.pieceUrls?.length
    ? `<ul>${t.pieceUrls.map(u => `<li><a href="${u}">${u}</a></li>`).join("")}</ul>`
    : "<i>Aucune</i>");
  return `
  <div style="font-family:system-ui,Segoe UI,Arial;line-height:1.5">
    <h2 style="margin:0 0 8px">Nouveau ticket #${t.id}</h2>
    <p><b>Type :</b> ${t.type}</p>
    <p><b>Créé par :</b> ${escapeHtml(t.createdBy.prenom)} ${escapeHtml(t.createdBy.nom)}</p>
    <p><b>Créé le :</b> ${date}</p>
    <p><b>Description :</b><br/>${desc}</p>
    <p><b>Pièces jointes :</b><br/>${pj}</p>
    <p style="margin-top:12px">
      Ouvrir dans le back-office :
      <a href="https://ton-domaine/admin/tickets/${t.id}">Ticket #${t.id}</a>
    </p>
  </div>`;
}

// petite import locale pour ne pas dupliquer
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m] as string)
  );
}
