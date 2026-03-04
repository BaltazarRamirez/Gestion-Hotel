import { Modal } from "./Modal";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmVariant = "danger",
  onCancel,
  onConfirm,
}) {
  const confirmClasses =
    confirmVariant === "danger"
      ? "bg-red-600 hover:bg-red-500 text-white"
      : "bg-blue-600 hover:bg-blue-500 text-white";

  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="mt-1 text-sm text-slate-400">{description}</p>

      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-xl border border-slate-600 bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600"
        >
          {cancelLabel}
        </button>

        <button
          onClick={onConfirm}
          className={`rounded-xl px-4 py-2 text-sm font-medium ${confirmClasses}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

