import { useEffect, useMemo, useRef } from "react";
import { useWorkbenchStore } from "@/store/workbenchStore";

export function useOfflineCsvLoader() {
  const offline = useWorkbenchStore((s) => s.offline);
  const panes = useWorkbenchStore((s) => s.panes);
  const loadOfflineColumns = useWorkbenchStore((s) => s.loadOfflineColumns);

  const keys = useMemo(() => {
    const set = new Set<string>();
    for (const p of panes) for (const k of p.keys) set.add(k);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [panes]);

  const needsLoad = useMemo(() => {
    if (!offline) return false;
    if (!keys.length) return false;
    if (offline.dataLoading) return false;
    const loaded = new Set(offline.loadedKeys);
    return keys.some((k) => !loaded.has(k)) || !offline.time;
  }, [offline, keys]);

  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!needsLoad) return;

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void loadOfflineColumns(keys);
    }, 450);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
    };
  }, [needsLoad, keys, loadOfflineColumns]);

  return { requestedKeys: keys };
}
