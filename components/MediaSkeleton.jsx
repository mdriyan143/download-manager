"use client";

export default function MediaSkeleton() {
  return (
    <div className="mt-6 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900" aria-busy="true">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="aspect-video w-full rounded-xl bg-slate-200 dark:bg-slate-800 sm:w-64" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-16 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
