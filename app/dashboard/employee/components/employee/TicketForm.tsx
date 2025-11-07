import { TicketForm as TicketFormType, Application, Materiel } from "../../utils/ticketHelpers";

const MAX_FILES = 5;

interface TicketFormProps {
    ticketForm: TicketFormType;
    files: File[];
    filesError: string;
    applications: Application[];
    materiels: Materiel[];
    loadingCats: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onFilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export default function TicketForm({
    ticketForm,
    files,
    filesError,
    applications,
    materiels,
    loadingCats,
    onChange,
    onFilesChange,
    onSubmit,
}: TicketFormProps) {
    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 md:p-5">
            <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-3">Nouvelle demande</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <button
                    type="button"
                    onClick={() =>
                        onChange({
                            target: { name: "typeTicket", value: "ASSISTANCE" }
                        } as React.ChangeEvent<HTMLSelectElement>)
                    }
                    className={`text-left border rounded-md p-3 transition ${ticketForm.typeTicket === "ASSISTANCE"
                            ? "border-blue-500 bg-blue-50/50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                >
                    <div className="font-medium text-slate-800">Assistance</div>
                    <div className="text-xs text-slate-600">Besoin logiciel / bureautique</div>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        onChange({
                            target: { name: "typeTicket", value: "INTERVENTION" }
                        } as React.ChangeEvent<HTMLSelectElement>)
                    }
                    className={`text-left border rounded-md p-3 transition ${ticketForm.typeTicket === "INTERVENTION"
                            ? "border-purple-500 bg-purple-50/50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                >
                    <div className="font-medium text-slate-800">Intervention</div>
                    <div className="text-xs text-slate-600">Panne matérielle avec déplacement</div>
                </button>
            </div>

            <div className="grid gap-2 mb-3">
                {ticketForm.typeTicket === "ASSISTANCE" && (
                    <>
                        <label className="text-xs font-medium text-slate-700">Application (optionnel)</label>
                        <select
                            name="applicationId"
                            value={ticketForm.applicationId ?? ""}
                            onChange={onChange}
                            className="border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none rounded-md px-3 py-2 text-sm bg-white"
                            disabled={loadingCats}
                        >
                            <option value="">— Sélectionner une application —</option>
                            {applications.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.nom}
                                </option>
                            ))}
                        </select>
                    </>
                )}
                {ticketForm.typeTicket === "INTERVENTION" && (
                    <>
                        <label className="text-xs font-medium text-slate-700">Matériel (optionnel)</label>
                        <select
                            name="materielId"
                            value={ticketForm.materielId ?? ""}
                            onChange={onChange}
                            className="border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none rounded-md px-3 py-2 text-sm bg-white"
                            disabled={loadingCats}
                        >
                            <option value="">— Sélectionner un matériel —</option>
                            {materiels.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.nom}
                                </option>
                            ))}
                        </select>
                    </>
                )}
            </div>

            <div className="grid gap-2">
                <label htmlFor="description" className="text-xs font-medium text-slate-700">
                    Décrivez votre besoin
                </label>
                <textarea
                    id="description"
                    name="description"
                    placeholder="Ex. : Mon imprimante ne répond plus malgré le redémarrage."
                    value={ticketForm.description}
                    onChange={onChange}
                    className="border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none rounded-md px-3 py-2 min-h-[96px] text-sm text-slate-800 placeholder:text-slate-400"
                    required
                />
            </div>

            <div className="grid gap-2 mt-3">
                <label htmlFor="fileInput" className="text-xs font-medium text-slate-700">Joindre des fichiers</label>
                <input
                    id="fileInput"
                    name="files"
                    type="file"
                    multiple
                    onChange={onFilesChange}
                    className="border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none rounded-md px-3 py-2 text-sm bg-white"
                    accept=".pdf,.png,.jpg,.jpeg,.txt,.log,.doc,.docx,.xlsx,.csv"
                />

                {filesError && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                        {filesError}
                    </div>
                )}

                {files.length > 0 && !filesError && (
                    <ul className="mt-1 text-xs text-slate-600 space-y-1 bg-slate-50 rounded-md p-2">
                        {files.map((f, i) => (
                            <li key={i} className="flex items-center gap-2">
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                {f.name} — {(f.size / 1024 / 1024).toFixed(2)} Mo
                            </li>
                        ))}
                    </ul>
                )}
                <p className="text-[11px] text-slate-500">Formats : PDF, images, Office, TXT/LOG • Max 10 Mo par fichier, {MAX_FILES} fichiers</p>
            </div>

            <div className="mt-4">
                <button
                    type="button"
                    onClick={onSubmit}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
                    disabled={!!filesError}
                >
                    Envoyer la demande
                </button>
            </div>
        </div>
    );
}