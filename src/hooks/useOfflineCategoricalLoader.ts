import { useEffect } from "react";
import { useWorkbenchStore } from "@/store/workbenchStore";

export function useOfflineCategoricalLoader() {
  const offline = useWorkbenchStore((s) => s.offline);
  const load = useWorkbenchStore((s) => s.loadOfflineCategoricals);

  useEffect(() => {
    if (!offline) return;
    if (offline.metaLoading) return;
    const required = ["NodeName", "NodePath", "PTName", "SubNodePTName", "ToolName"] as const;
    const need = required.filter((k) => offline.stringKeys.includes(k));
    if (need.every((k) => Boolean(offline.categoricals[k]))) return;
    void load();
  }, [load, offline]);
}
