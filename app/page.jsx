"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import UrlInput from "@/components/UrlInput";
import PlatformStrip from "@/components/PlatformStrip";
import MediaPreview from "@/components/MediaPreview";
import MediaSkeleton from "@/components/MediaSkeleton";
import HistoryRow from "@/components/HistoryRow";
import { fetchMediaInfo, buildDownloadUrl } from "@/lib/api";
import { useHistory } from "@/context/HistoryContext";
import { useToast } from "@/context/ToastContext";

export default function HomePage() {
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { history, addEntry } = useHistory();
  const toast = useToast();

  const analyzeUrl = async (url) => {
    setLoading(true); setError(""); setMedia(null);
    try {
      setMedia(await fetchMediaInfo(url));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startDownload = (option) => {
    // A temporary link click hands the download to the browser's own download manager.
    const link = document.createElement("a");
    link.href = buildDownloadUrl({ url: media.sourceUrl, optionId: option.id, title: media.title });
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();

    addEntry({
      platform: media.platform.name, mediaUrl: media.sourceUrl, title: media.title, thumbnail: media.thumbnail,
      filename: `${media.title}.${option.ext}`, format: option.ext.toUpperCase(), quality: option.label,
      watermarkStatus: media.watermark.status,
    });
    toast.success("Download started. Check your browser's downloads.");
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Download videos, <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">the clean way</span></h1>
        <p className="mt-3 text-slate-500">Paste a link, pick a quality and save it straight to your device. No watermark added by us.</p>
      </div>

      <UrlInput onSubmit={analyzeUrl} loading={loading} />
      <PlatformStrip />

      {loading && <MediaSkeleton />}
      {error && (
        <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />{error}
        </div>
      )}
      {media && <MediaPreview key={media.sourceUrl} media={media} onDownload={startDownload} />}

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent downloads</h2>
          <span className="text-xs text-slate-500">{history.length} started in total</span>
        </div>
        {history.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">Nothing yet. Your downloads will show up here.</p>
        ) : (
          <>
            <ul className="space-y-2">{history.slice(0, 3).map((e) => <HistoryRow key={e.id} entry={e} />)}</ul>
            <Link href="/history" className="mt-3 inline-block text-sm text-indigo-500 hover:underline">View all history</Link>
          </>
        )}
      </section>
    </>
  );
}