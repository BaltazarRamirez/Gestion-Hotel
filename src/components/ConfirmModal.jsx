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
      ? "action-btn action-btn-danger"
      : "action-btn action-btn-info";

  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="mt-1 text-sm text-slate-400">{description}</p>

      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="action-btn action-btn-neutral"
        >
          {cancelLabel}
        </button>

        <button
          onClick={onConfirm}
          className={confirmClasses}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

