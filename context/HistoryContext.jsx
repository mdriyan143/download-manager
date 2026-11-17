"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

const HistoryContext = createContext(null);
export const useHistory = () => useContext(HistoryContext);

const LS_KEY = "mediagrab:history";
const MAX = 200;

async function api(path, options) {
  const res = await fetch(`/api/history${path}`, options);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error("history request failed");
  return json.data;
}

// History is saved in MongoDB under an anonymous cookie id (no login).
// If the database is off, it falls back to this browser's localStorage automatically.
// "started" means the browser was handed the file; the browser decides whether the save finished.
export function HistoryProvider({ children }) {
  const [history, setHistory] = useState([]);
  const [mode, setMode] = useState("loading"); // "loading" | "server" | "local"
  const modeRef = useRef("loading");

  const switchMode = (m) => { modeRef.current = m; setMode(m); };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api("");
        if (cancelled) return;
        if (data.enabled) { setHistory(data.entries); return switchMode("server"); }
      } catch { /* fall through to local mode */ }
      if (cancelled) return;
      try { setHistory(JSON.parse(localStorage.getItem(LS_KEY) || "[]")); } catch { setHistory([]); }
      switchMode("local");
    })();
    return () => { cancelled = true; };
  }, []);

  // Local mode only: persist to localStorage.
  useEffect(() => {
    if (mode !== "local") return;
    try { localStorage.setItem(LS_KEY, JSON.stringify(history)); } catch { /* storage full or blocked */ }
  }, [mode, history]);

  const addEntry = useCallback((entry) => {
    const local = { id: crypto.randomUUID(), date: new Date().toISOString(), status: "started", ...entry };
    setHistory((list) => [local, ...list].slice(0, MAX));
    if (modeRef.current === "server") {
      api("", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) })
        .then((data) => data.entry && setHistory((list) => list.map((e) => (e.id === local.id ? data.entry : e))))
        .catch(() => {}); // the entry stays visible for this session
    }
  }, []);

  const removeEntry = useCallback((id) => {
    setHistory((list) => list.filter((e) => e.id !== id));
    if (modeRef.current === "server") api(`/${id}`, { method: "DELETE" }).catch(() => {});
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (modeRef.current === "server") api("", { method: "DELETE" }).catch(() => {});
  }, []);

  return (
    <HistoryContext.Provider value={{ history, mode, addEntry, removeEntry, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}
