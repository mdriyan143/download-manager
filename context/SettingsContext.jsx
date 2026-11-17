"use client";

import { createContext, useContext, useEffect } from "react";
import useLocalStorage from "@/hooks/useLocalStorage";

const SettingsContext = createContext(null);
export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useLocalStorage("mediagrab:settings", { theme: "dark", defaultQuality: "best" });

  // Add or remove the .dark class so Tailwind's dark: styles switch.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
  }, [settings.theme]);

  const updateSetting = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));
  return <SettingsContext.Provider value={{ settings, updateSetting }}>{children}</SettingsContext.Provider>;
}
