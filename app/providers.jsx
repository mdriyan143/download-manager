"use client";

import { SettingsProvider } from "@/context/SettingsContext";
import { ToastProvider } from "@/context/ToastContext";
import { HistoryProvider } from "@/context/HistoryContext";

export default function Providers({ children }) {
  return (
    <SettingsProvider>
      <ToastProvider>
        <HistoryProvider>{children}</HistoryProvider>
      </ToastProvider>
    </SettingsProvider>
  );
}
