"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, Home, History, Settings, Sun, Moon } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const { settings, updateSetting } = useSettings();
  const isDark = settings.theme === "dark";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white"><Download className="h-4 w-4" /></span>
          MediaGrab
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main">
          {links.map(({ to, label, icon: Icon }) => {
            const isActive = pathname === to;
            return (
              <Link key={to} href={to} aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${isActive ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                <Icon className="h-4 w-4" /><span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          <button onClick={() => updateSetting("theme", isDark ? "light" : "dark")} aria-label="Toggle theme"
            className="ml-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </nav>
      </div>
    </header>
  );
}
