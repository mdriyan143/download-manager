"use client";

export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <h3 id="confirm-title" className="font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
          <button onClick={onConfirm} className="rounded-lg bg-rose-500 px-4 py-2 text-sm text-white hover:bg-rose-600">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
