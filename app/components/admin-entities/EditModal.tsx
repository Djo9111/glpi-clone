import { type Role, type Utilisateur, type Departement } from "@/app/dashboard/admin-entities/utils/adminHelpers";
import Modal from "./Modal";
import Input from "./Input";
import FormActions from "./FormActions";

interface EditModalProps {
    openModal: string | null;
    loading: boolean;
    editApp: { nom: string };
    editDep: { nom: string; responsableId: string };
    editMat: { nom: string };
    editUser: {
        nom: string; prenom: string; role: Role; departementId: string;
        matricule: string; motDePasse?: string; codeHierarchique: string;
    };
    utilisateurs: Utilisateur[];
    departements: Departement[];
    onClose: () => void;
    onEditAppChange: (form: { nom: string }) => void;
    onEditDepChange: (form: { nom: string; responsableId: string }) => void;
    onEditMatChange: (form: { nom: string }) => void;
    onEditUserChange: (form: any) => void;
    onPatchApp: (e: React.FormEvent) => void;
    onPatchDep: (e: React.FormEvent) => void;
    onPatchMat: (e: React.FormEvent) => void;
    onPatchUser: (e: React.FormEvent) => void;
}

export default function EditModal({
    openModal,
    loading,
    editApp,
    editDep,
    editMat,
    editUser,
    utilisateurs,
    departements,
    onClose,
    onEditAppChange,
    onEditDepChange,
    onEditMatChange,
    onEditUserChange,
    onPatchApp,
    onPatchDep,
    onPatchMat,
    onPatchUser,
}: EditModalProps) {
    if (!openModal || !openModal.startsWith("edit-")) {
        return null;
    }

    return (
        <>
            {/* Modal Édition Application */}
            {openModal === "edit-application" && (
                <Modal title="Modifier l'application" onClose={loading ? () => { } : onClose}>
                    <form onSubmit={onPatchApp} className="space-y-4">
                        <Input label="Nom" value={editApp.nom} onChange={v => onEditAppChange({ nom: v })} />
                        <FormActions loading={loading} onCancel={onClose} submitLabel="Enregistrer" />
                    </form>
                </Modal>
            )}

            {/* Modal Édition Département */}
            {openModal === "edit-departement" && (
                <Modal title="Modifier le département" onClose={loading ? () => { } : onClose}>
                    <form onSubmit={onPatchDep} className="space-y-4">
                        <Input label="Nom" value={editDep.nom} onChange={v => onEditDepChange({ ...editDep, nom: v })} />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Responsable</label>
                            <select
                                value={editDep.responsableId}
                                onChange={(e) => onEditDepChange({ ...editDep, responsableId: e.target.value })}
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
                        <FormActions loading={loading} onCancel={onClose} submitLabel="Enregistrer" />
                    </form>
                </Modal>
            )}

            {/* Modal Édition Matériel */}
            {openModal === "edit-materiel" && (
                <Modal title="Modifier le matériel" onClose={loading ? () => { } : onClose}>
                    <form onSubmit={onPatchMat} className="space-y-4">
                        <Input label="Nom" value={editMat.nom} onChange={v => onEditMatChange({ nom: v })} />
                        <FormActions loading={loading} onCancel={onClose} submitLabel="Enregistrer" />
                    </form>
                </Modal>
            )}

            {/* Modal Édition Utilisateur */}
            {openModal === "edit-utilisateur" && (
                <Modal title="Modifier l'utilisateur" onClose={loading ? () => { } : onClose}>
                    <form onSubmit={onPatchUser} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Prénom" value={editUser.prenom} onChange={v => onEditUserChange({ ...editUser, prenom: v })} />
                            <Input label="Nom" value={editUser.nom} onChange={v => onEditUserChange({ ...editUser, nom: v })} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                                <select
                                    value={editUser.role}
                                    onChange={(e) => onEditUserChange({ ...editUser, role: e.target.value as Role })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                >
                                    <option value="EMPLOYE">EMPLOYE</option>
                                    <option value="TECHNICIEN">TECHNICIEN</option>
                                    <option value="CHEF_DSI">CHEF_DSI</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Département</label>
                                <select
                                    value={editUser.departementId}
                                    onChange={(e) => onEditUserChange({ ...editUser, departementId: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                >
                                    <option value="">— Aucun —</option>
                                    {departements.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
                                </select>
                            </div>
                            <Input
                                label="Code hiérarchique"
                                value={editUser.codeHierarchique}
                                onChange={v => onEditUserChange({ ...editUser, codeHierarchique: v })}
                                type="number"
                            />
                        </div>
                        <Input
                            label="Matricule (optionnel)"
                            value={editUser.matricule}
                            onChange={v => onEditUserChange({ ...editUser, matricule: v })}
                        />
                        <Input
                            type="password"
                            label="Nouveau mot de passe (optionnel)"
                            value={editUser.motDePasse || ""}
                            onChange={v => onEditUserChange({ ...editUser, motDePasse: v })}
                            placeholder="laisser vide pour ne pas changer"
                        />
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                            <strong>Code hiérarchique :</strong> 0 = employé simple, 1+ = niveaux de supervision.
                            Un code supérieur permet de voir les tickets des utilisateurs du même département avec un code inférieur.
                        </div>
                        <FormActions loading={loading} onCancel={onClose} submitLabel="Enregistrer" />
                    </form>
                </Modal>
            )}
        </>
    );
}