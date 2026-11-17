"use client";

import { useState } from "react";
import { ClipboardPaste, X, Download, Loader2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function UrlInput({ onSubmit, loading }) {
  const [value, setValue] = useState("");
  const toast = useToast();

  const pasteFromClipboard = async () => {
    try {
      setValue((await navigator.clipboard.readText()).trim());
    } catch {
      toast.error("Clipboard access was blocked. Paste the link with Ctrl+V instead.");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="media-url" className="sr-only">Media link</label>
          <input id="media-url" type="url" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Paste a video link here..."
            className="w-full rounded-xl bg-transparent py-3 pl-4 pr-24 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/50" />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
            {value && <button type="button" onClick={() => setValue("")} aria-label="Clear" className="rounded-lg p-2.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>}
            <button type="button" onClick={pasteFromClipboard} aria-label="Paste from clipboard" className="rounded-lg p-2.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><ClipboardPaste className="h-4 w-4" /></button>
          </div>
        </div>
        <button type="submit" disabled={loading || !value.trim()}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {loading ? "Checking..." : "Get media"}
        </button>
      </div>
    </form>
  );
}
