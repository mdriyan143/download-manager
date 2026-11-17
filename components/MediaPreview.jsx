"use client";

import { useState } from "react";
import { Download, ShieldCheck, Clock, Music, Video, Star } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { formatBytes, formatDuration, pickOption } from "@/lib/format";

function OptionRow({ option, selected, onSelect }) {
  const tone = selected
    ? option.recommended
      ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500"
      : "border-indigo-500 bg-indigo-500/10"
    : option.recommended
      ? "border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-500"
      : "border-slate-200 hover:border-slate-300 dark:border-slate-700";

  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${tone}`}>
      <input type="radio" name="quality" className="sr-only" checked={selected} onChange={onSelect} />
      {option.kind === "audio" ? <Music className="h-4 w-4 text-slate-400" /> : <Video className="h-4 w-4 text-slate-400" />}
      <span className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <span><b>{option.label}</b> · {option.ext.toUpperCase()}</span>
        {option.recommended && (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <Star className="h-3 w-3" />{option.original ? "Original" : "Recommended"}
          </span>
        )}
        {option.watermarked && <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-600 dark:text-amber-400">Has watermark</span>}
        {option.compatible === false && (
          <span title="Some players show no picture for this codec. VLC plays it." className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-600 dark:text-amber-400">
            {option.codec} · may not play everywhere
          </span>
        )}
      </span>
      <span className="text-xs text-slate-500">{formatBytes(option.estimatedSize)}</span>
    </label>
  );
}

export default function MediaPreview({ media, onDownload }) {
  const { settings } = useSettings();
  const [selectedId, setSelectedId] = useState(() => pickOption(media.options, settings.defaultQuality).id);
  const selected = media.options.find((o) => o.id === selectedId);

  const videoOptions = media.options.filter((o) => o.kind !== "audio");
  const audioOptions = media.options.filter((o) => o.kind === "audio");

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-5 sm:flex-row">
        {media.thumbnail && <img src={media.thumbnail} alt="" referrerPolicy="no-referrer" className="aspect-video w-full rounded-xl object-cover sm:w-64" />}
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 break-words text-lg font-semibold">{media.title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {media.platform.name} · {media.mediaType}{media.uploader ? ` · ${media.uploader}` : ""}
            {media.durationSeconds ? <span className="ml-2 inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatDuration(media.durationSeconds)}</span> : null}
          </p>
          <p className={`mt-3 flex items-start gap-2 rounded-lg p-2.5 text-xs ${media.watermark.status === "watermarked" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"}`}>
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{media.watermark.note}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <fieldset className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <legend className="flex items-center gap-2 px-2 text-sm font-semibold"><Video className="h-4 w-4" />Video</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {videoOptions.map((o) => <OptionRow key={o.id} option={o} selected={o.id === selectedId} onSelect={() => setSelectedId(o.id)} />)}
          </div>
          {!media.ffmpegAvailable && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">Higher resolutions need FFmpeg on the server, so only formats with built-in audio are listed.</p>}
        </fieldset>

        <fieldset className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <legend className="flex items-center gap-2 px-2 text-sm font-semibold"><Music className="h-4 w-4" />Audio</legend>
          {audioOptions.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {audioOptions.map((o) => <OptionRow key={o.id} option={o} selected={o.id === selectedId} onSelect={() => setSelectedId(o.id)} />)}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500 dark:border-slate-700">
              {media.ffmpegAvailable
                ? `No audio track could be found for this ${media.platform.name} link.`
                : "Audio extraction needs FFmpeg on the server."}
            </p>
          )}
        </fieldset>
      </div>

      <button onClick={() => onDownload(selected)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 font-medium text-white transition hover:opacity-90">
        <Download className="h-4 w-4" /> Download {selected.label} ({selected.ext.toUpperCase()})
      </button>
      <p className="mt-2 text-center text-xs text-slate-500">Your browser decides where the file is saved, usually your Downloads folder.</p>
    </section>
  );
}
