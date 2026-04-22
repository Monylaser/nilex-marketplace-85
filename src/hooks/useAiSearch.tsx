import { useEffect, useState } from "react";

const KEY = "nilex.aiSearch.enabled";

export function useAiSearchPref() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem(KEY, enabled ? "1" : "0"); } catch { /* ignore */ }
  }, [enabled]);
  return { enabled, setEnabled };
}
