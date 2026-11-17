"use client";

import { Trash2 } from "lucide-react";
import { formatDate } from "@/lib/format";

export default function HistoryRow({ entry, onDelete }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      {entry.thumbnail && <img src={entry.thumbnail} alt="" referrerPolicy="no-referrer" className="h-12 w-20 shrink-0 rounded-lg object-cover" />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{entry.filename}</p>
        <p className="text-xs text-slate-500">{entry.platform} · {entry.format} · {entry.quality} · {formatDate(entry.date)}</p>
      </div>
      <span className="hidden rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-600 dark:text-indigo-400 sm:inline">{entry.status}</span>
      {onDelete && <button onClick={() => onDelete(entry.id)} aria-label="Delete entry" className="rounded-lg p-2.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>}
    </li>
  );
}
