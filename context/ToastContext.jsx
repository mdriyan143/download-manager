"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const show = useCallback((message, type = "success") => {
    const id = crypto.randomUUID();
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ success: (m) => show(m, "success"), error: (m) => show(m, "error") }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            {t.type === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />}
            <p className="flex-1 text-sm">{t.message}</p>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="-m-1 p-2 text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
