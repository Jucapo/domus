/**
 * Diálogos in-app (sustituyen window.alert / window.confirm).
 */
export function AlertDialog({ open, title, message, confirmLabel = 'Aceptar', onClose }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal
        aria-labelledby="alert-dialog-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <h2 id="alert-dialog-title" className="text-base font-semibold text-slate-900">
            {title}
          </h2>
        ) : null}
        <p className={`text-sm text-slate-600 ${title ? 'mt-2' : ''}`}>{message}</p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger,
  onConfirm,
  onCancel,
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <h2 id="confirm-dialog-title" className="text-base font-semibold text-slate-900">
            {title}
          </h2>
        ) : null}
        <p className={`text-sm text-slate-600 ${title ? 'mt-2' : ''}`}>{message}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
