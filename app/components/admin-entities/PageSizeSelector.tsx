interface PageSizeSelectorProps {
    pageSize: number;
    onPageSizeChange: (size: number) => void;
}

export default function PageSizeSelector({ pageSize, onPageSizeChange }: PageSizeSelectorProps) {
    return (
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/80 shadow-sm px-5 py-3">
            <span className="text-sm font-medium text-slate-700">Éléments par page</span>
            <div className="flex gap-2">
                {[5, 10, 20, 50].map(size => (
                    <button
                        key={size}
                        onClick={() => onPageSizeChange(size)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pageSize === size
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                    >
                        {size}
                    </button>
                ))}
            </div>
        </div>
    );
}