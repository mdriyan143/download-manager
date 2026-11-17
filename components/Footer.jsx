export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-1 px-4 py-5 text-center text-xs text-slate-500 sm:flex-row sm:text-left">
        <p>&copy; {year} MediaGrab. All rights reserved.</p>
        <p>
          Created by <span className="font-medium text-slate-700 dark:text-slate-300">Md Riyan Biswas</span>
        </p>
      </div>
    </footer>
  );
}
