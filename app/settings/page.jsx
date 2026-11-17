"use client";

import { useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { useHistory } from "@/context/HistoryContext";
import { useToast } from "@/context/ToastContext";
import ConfirmDialog from "@/components/ConfirmDialog";

const qualities = [["best", "Best available"], ["1080", "1080p"], ["720", "720p"], ["480", "480p"], ["360", "360p"]];

export default function Settings() {
  const { settings, updateSetting } = useSettings();
  const { clearHistory } = useHistory();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const card = "rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900";
  const field = "rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-base sm:text-sm dark:border-slate-700 dark:bg-slate-900";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className={card}>
        <h2 className="mb-3 font-semibold">Appearance</h2>
        <div className="flex gap-2">
          {["dark", "light"].map((theme) => (
            <button key={theme} onClick={() => updateSetting("theme", theme)}
              className={`rounded-lg border px-4 py-2 text-sm capitalize ${settings.theme === theme ? "border-indigo-500 bg-indigo-500/10" : "border-slate-200 dark:border-slate-700"}`}>{theme}</button>
          ))}
        </div>
      </section>

      <section className={card}>
        <h2 className="mb-3 font-semibold">Downloads</h2>
        <label className="flex items-center justify-between gap-4 text-sm">
          Default quality
          <select value={settings.defaultQuality} onChange={(e) => updateSetting("defaultQuality", e.target.value)} className={field}>
            {qualities.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <p className="mt-3 text-xs text-slate-500">Video is saved as MP4 and audio as M4A, without extra conversion. If your default isn't available for a video, the closest lower quality is picked.</p>
      </section>

      <section className={card}>
        <h2 className="mb-3 font-semibold">History</h2>
        <button onClick={() => setConfirmOpen(true)} className="rounded-lg border border-rose-500/40 px-4 py-2 text-sm text-rose-500 hover:bg-rose-500/10">Clear download history</button>
      </section>

      <section className={card}>
        <h2 className="mb-2 font-semibold">About</h2>
        <p className="text-sm text-slate-500">MediaGrab v1.1 downloads only media that is publicly accessible. It does not bypass private accounts, logins, DRM or paywalls, and it never adds its own watermark. Please respect creators' rights and each platform's terms. Files pass through the server to your browser and are never stored on it. Your browser controls where they are saved, often the default Downloads folder.</p>
      </section>

      <ConfirmDialog open={confirmOpen} title="Clear all history?" message="Entries are removed from this browser only. Saved files stay on your device."
        confirmLabel="Clear" onCancel={() => setConfirmOpen(false)} onConfirm={() => { clearHistory(); setConfirmOpen(false); toast.success("History cleared."); }} />
    </div>
  );
}
