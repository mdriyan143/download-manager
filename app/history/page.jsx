"use client";

import { useState, useMemo } from "react";
import { Search, Trash2 } from "lucide-react";
import HistoryRow from "@/components/HistoryRow";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useHistory } from "@/context/HistoryContext";

export default function History() {
  const { history, removeEntry, clearHistory } = useHistory();
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("all");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const platforms = useMemo(() => [...new Set(history.map((e) => e.platform))], [history]);
  const visible = history.filter((e) =>
    (platform === "all" || e.platform === platform) && e.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">History</h1>
        {history.length > 0 && (
          <button onClick={() => setConfirmOpen(true)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-rose-500 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" />Clear all</button>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by filename" aria-label="Search history"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-base sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-800 dark:bg-slate-900" />
        </div>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Filter by platform"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-sm dark:border-slate-800 dark:bg-slate-900">
          <option value="all">All platforms</option>
          {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          {history.length === 0 ? "No downloads yet." : "No entries match your search."}
        </p>
      ) : (
        <ul className="space-y-2">{visible.map((e) => <HistoryRow key={e.id} entry={e} onDelete={removeEntry} />)}</ul>
      )}
      <p className="mt-4 text-xs text-slate-500">Deleting history does not delete files already saved on your device. "Started" means the file was handed to your browser.</p>

      <ConfirmDialog open={confirmOpen} title="Clear all history?" message="This removes every entry from this browser. Saved files stay on your device."
        confirmLabel="Clear all" onCancel={() => setConfirmOpen(false)} onConfirm={() => { clearHistory(); setConfirmOpen(false); }} />
    </>
  );
}
