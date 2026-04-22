import { useMemo } from "react";
import { useWorkbenchStore } from "@/store/workbenchStore";

export default function TimeKeySelect() {
  const offline = useWorkbenchStore((s) => s.offline);
  const setTimeKey = useWorkbenchStore((s) => s.setOfflineTimeKey);

  const options = useMemo(() => {
    if (!offline) return [];
    const canonical = ["ProgramTime", "PlanTime", "NodeTime"];
    const found = canonical.filter((k) => offline.numericKeys.includes(k));
    if (found.length) return found;
    const keys = offline.numericKeys.filter((k, i, a) => a.indexOf(k) === i);
    const timeLike = keys.filter((k) => k.toLowerCase().includes("time") || k.toLowerCase().includes("stamp"));
    timeLike.sort((a, b) => a.localeCompare(b));
    return timeLike.length ? timeLike : keys.slice(0, 1);
  }, [offline]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-slate-600">时间列</span>
      <select
        disabled={!offline}
        value={offline?.timeKey ?? ""}
        onChange={(e) => setTimeKey(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800 outline-none focus:border-blue-400 disabled:opacity-50"
      >
        {options.length ? options.map((k) => <option key={k} value={k}>{k}</option>) : <option value="">未加载</option>}
      </select>
    </div>
  );
}
