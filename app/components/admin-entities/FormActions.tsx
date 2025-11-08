import { PlusCircle } from "lucide-react";

interface FormActionsProps {
    loading: boolean;
    onCancel: () => void;
    submitLabel?: string;
}

export default function FormActions({ loading, onCancel, submitLabel = "Créer" }: FormActionsProps) {
    return (
        <div className="flex items-center justify-end gap-3 pt-4">
            <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-5 py-2.5 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
            >
                Annuler
            </button>
            <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 shadow-sm transition-all"
            >
                {loading ? (
                    <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Traitement...
                    </>
                ) : (
                    <>
                        <PlusCircle className="h-4 w-4" />
                        {submitLabel}
                    </>
                )}
            </button>
        </div>
    );
}