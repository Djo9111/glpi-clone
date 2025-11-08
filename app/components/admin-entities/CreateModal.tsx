import { type Role, type Utilisateur, type Departement } from "@/app/dashboard/admin-entities/utils/adminHelpers";
import Modal from "./Modal";
import Input from "./Input";
import FormActions from "./FormActions";

interface CreateModalProps {
    openModal: string | null;
    loading: boolean;
    formApp: { nom: string };
    formDep: { nom: string; responsableId: string };
    formMat: { nom: string };
    formUser: {
        nom: string; prenom: string; email: string; motDePasse: string; role: Role;
        departementId: string; matricule: string; codeHierarchique: string;
    };
    utilisateurs: Utilisateur[];
    departements: Departement[];
    onClose: () => void;
    onFormAppChange: (form: { nom: string }) => void;
    onFormDepChange: (form: { nom: string; responsableId: string }) => void;
    onFormMatChange: (form: { nom: string }) => void;
    onFormUserChange: (form: any) => void;
    onCreateApp: (e: React.FormEvent) => void;
    onCreateDep: (e: React.FormEvent) => void;
    onCreateMat: (e: React.FormEvent) => void;
    onCreateUser: (e: React.FormEvent) => void;
}

export default function CreateModal({
    openModal,
    loading,
    formApp,
    formDep,
    formMat,
    formUser,
    utilisateurs,
    departements,
    onClose,
    onFormAppChange,
    onFormDepChange,
    onFormMatChange,
    onFormUserChange,
    onCreateApp,
    onCreateDep,
    onCreateMat,
    onCreateUser,
}: CreateModalProps) {
    if (!openModal || !openModal.startsWith("application") && !openModal.startsWith("departement") &&
        !openModal.startsWith("materiel") && !openModal.startsWith("utilisateur")) {
        return null;
    }

    return (
        <>
            {/* Modal Application */}
            {openModal === "application" && (
                <Modal title="Nouvelle application" onClose={loading ? () => { } : onClose}>
                    <form onSubmit={onCreateApp} className="space-y-4">
                        <Input
                            label="Nom de l'application"
                            value={formApp.nom}
                            onChange={v => onFormAppChange({ nom: v })}
                            placeholder="Ex. Word"
                        />
                        <FormActions loading={loading} onCancel={onClose} />
                    </form>
                </Modal>
            )}

            {/* Modal Département */}
            {openModal === "departement" && (
                <Modal title="Nouveau département" onClose={loading ? () => { } : onClose}>
                    <form onSubmit={onCreateDep} className="space-y-4">
                        <Input
                            label="Nom du département"
                            value={formDep.nom}
                            onChange={v => onFormDepChange({ ...formDep, nom: v })}
                            placeholder="Ex. DSI"
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Responsable (optionnel)</label>
                            <select
                                value={formDep.responsableId}
                                onChange={(e) => onFormDepChange({ ...formDep, responsableId: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value="">— Aucun —</option>
                                {utilisateurs.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.prenom} {u.nom} — {u.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <FormActions loading={loading} onCancel={onClose} />
                    </form>
                </Modal>
            )}

            {/* Modal Matériel */}
            {openModal === "materiel" && (
                <Modal title="Nouveau matériel" onClose={loading ? () => { } : onClose}>
                    <form onSubmit={onCreateMat} className="space-y-4">
                        <Input
                            label="Nom du matériel"
                            value={formMat.nom}
                            onChange={v => onFormMatChange({ nom: v })}
                            placeholder="Ex. Imprimante"
                        />
                        <FormActions loading={loading} onCancel={onClose} />
                    </form>
                </Modal>
            )}

            {/* Modal Utilisateur */}
            {openModal === "utilisateur" && (
                <Modal title="Nouvel utilisateur" onClose={loading ? () => { } : onClose}>
                    <form onSubmit={onCreateUser} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Prénom"
                                value={formUser.prenom}
                                onChange={v => onFormUserChange({ ...formUser, prenom: v })}
                                placeholder="Ex. Awa"
                            />
                            <Input
                                label="Nom"
                                value={formUser.nom}
                                onChange={v => onFormUserChange({ ...formUser, nom: v })}
                                placeholder="Ex. Ndiaye"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                type="email"
                                label="Email"
                                value={formUser.email}
                                onChange={v => onFormUserChange({ ...formUser, email: v })}
                                placeholder="exemple@domaine.com"
                            />
                            <Input
                                type="password"
                                label="Mot de passe"
                                value={formUser.motDePasse}
                                onChange={v => onFormUserChange({ ...formUser, motDePasse: v })}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                                <select
                                    value={formUser.role}
                                    onChange={(e) => onFormUserChange({ ...formUser, role: e.target.value as Role })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                >
                                    <option value="EMPLOYE">EMPLOYE</option>
                                    <option value="TECHNICIEN">TECHNICIEN</option>
                                    <option value="CHEF_DSI">CHEF_DSI</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Département (optionnel)</label>
                                <select
                                    value={formUser.departementId}
                                    onChange={(e) => onFormUserChange({ ...formUser, departementId: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                >
                                    <option value="">— Aucun —</option>
                                    {departements.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
                                </select>
                            </div>
                            <Input
                                label="Code hiérarchique"
                                value={formUser.codeHierarchique}
                                onChange={v => onFormUserChange({ ...formUser, codeHierarchique: v })}
                                placeholder="0, 1, 2..."
                                type="number"
                            />
                        </div>
                        <Input
                            label="Matricule (optionnel)"
                            value={formUser.matricule}
                            onChange={v => onFormUserChange({ ...formUser, matricule: v })}
                            placeholder="Ex. EMP-00123"
                        />
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                            <strong>Code hiérarchique :</strong> 0 = employé simple, 1+ = niveaux de supervision.
                            Un code supérieur permet de voir les tickets des utilisateurs du même département avec un code inférieur.
                        </div>
                        <FormActions loading={loading} onCancel={onClose} />
                    </form>
                </Modal>
            )}
        </>
    );
}