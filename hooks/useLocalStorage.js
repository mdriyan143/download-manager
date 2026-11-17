"use client";
import { useState, useEffect, useRef } from "react";

// SSR-safe: renders with initialValue first, then loads the saved value after hydration
// (reading localStorage during render would cause a hydration mismatch).
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) setValue(JSON.parse(saved));
    } catch { /* blocked or corrupt */ }
    loaded.current = true;
  }, [key]);

  useEffect(() => {
    if (!loaded.current) return; // don't overwrite saved data with the initial value
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
  }, [key, value]);

  return [value, setValue];
}
