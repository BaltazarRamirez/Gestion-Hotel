const STYLES = {
  success: "bg-emerald-600 border border-emerald-500/50",
  error: "bg-red-600 border border-red-500/50",
  info: "bg-blue-600 border border-blue-500/50",
};

export function Toast({ message, type = "success", onClose }) {
  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        role="alert"
        className={`flex items-start gap-3 rounded-xl px-4 py-2 text-sm text-white shadow-xl ${
          STYLES[type] ?? STYLES.info
        }`}
      >
        <span className="min-w-0 flex-1">{message}</span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-white/90 hover:bg-black/10"
            aria-label="Cerrar notificación"
          >
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}

