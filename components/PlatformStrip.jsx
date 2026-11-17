"use client";

import { useEffect, useState } from "react";
import { fetchPlatforms } from "@/lib/api";

export default function PlatformStrip() {
  const [platforms, setPlatforms] = useState([]);
  useEffect(() => { fetchPlatforms().then(setPlatforms).catch(() => {}); }, []);
  if (!platforms.length) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
      {platforms.map((p) => (
        <span key={p.id} className={`rounded-full border px-3 py-1 ${p.status === "available" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-slate-300 text-slate-500 dark:border-slate-700"}`}>
          {p.name}{p.status === "available" ? "" : " · soon"}
        </span>
      ))}
    </div>
  );
}
