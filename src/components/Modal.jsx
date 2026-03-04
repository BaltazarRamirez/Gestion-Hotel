import { useEffect } from "react";

export function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative flex max-h-[90vh] w-full flex-col rounded-t-2xl border border-slate-600 bg-slate-800 p-4 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h3 className="truncate pr-2 text-base font-semibold text-slate-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto text-slate-200">{children}</div>
      </div>
    </div>
  );
}

