import { useMemo } from "react";
import { useWorkbenchStore } from "@/store/workbenchStore";
import TimeSeriesChart, { type SeriesInput } from "@/components/TimeSeriesChart";
import { cn } from "@/lib/utils";

function buildOfflineSeries(
  time: number[],
  columns: Record<string, number[]>,
  keys: string[],
  indices?: number[],
): SeriesInput[] {
  const out: SeriesInput[] = [];
  for (const k of keys) {
    const col = columns[k];
    if (!col) continue;
    const data: Array<[number, number, number]> = [];
    if (indices && indices.length) {
      for (const i of indices) {
        const t = time[i]!;
        const v = col[i]!;
        if (Number.isFinite(t) && Number.isFinite(v)) data.push([t, v, i]);
      }
    } else {
      for (let i = 0; i < time.length; i += 1) {
        const t = time[i]!;
        const v = col[i]!;
        if (Number.isFinite(t) && Number.isFinite(v)) data.push([t, v, i]);
      }
    }
    out.push({ key: k, data });
  }
  return out;
}

export default function ChartsStack() {
  const panes = useWorkbenchStore((s) => s.panes);
  const activePaneId = useWorkbenchStore((s) => s.activePaneId);
  const offline = useWorkbenchStore((s) => s.offline);
  const nodeName = useWorkbenchStore((s) => s.nodeName);
  const nodePath = useWorkbenchStore((s) => s.nodePath);
  const ptName = useWorkbenchStore((s) => s.ptName);
  const subNodePTName = useWorkbenchStore((s) => s.subNodePTName);
  const toolName = useWorkbenchStore((s) => s.toolName);

  const offlineIndices = useMemo(() => {
    if (!offline?.time) return undefined;
    const nodeCol = offline.categoricals.NodeName;
    const pathCol = offline.categoricals.NodePath;
    const ptCol = offline.categoricals.PTName;
    const subCol = offline.categoricals.SubNodePTName;
    const toolCol = offline.categoricals.ToolName;
    if (!nodeCol) return undefined;
    if (
      nodeName === "ALL" &&
      nodePath === "ALL" &&
      ptName === "ALL" &&
      subNodePTName === "ALL" &&
      toolName === "ALL"
    )
      return undefined;

    const n = Math.min(
      nodeCol.ids.length,
      pathCol?.ids.length ?? nodeCol.ids.length,
      ptCol?.ids.length ?? nodeCol.ids.length,
      subCol?.ids.length ?? nodeCol.ids.length,
      toolCol?.ids.length ?? nodeCol.ids.length,
    );
    const nodeId = nodeName === "ALL" ? -1 : nodeCol.dict.indexOf(nodeName);
    if (nodeId === -1 && nodeName !== "ALL") return undefined;
    const pathId =
      nodePath === "ALL" ? -1 : pathCol ? pathCol.dict.indexOf(nodePath) : -1;
    if (pathId === -1 && nodePath !== "ALL") return undefined;
    const ptId = ptName === "ALL" ? -1 : ptCol ? ptCol.dict.indexOf(ptName) : -1;
    if (ptId === -1 && ptName !== "ALL") return undefined;
    const subId =
      subNodePTName === "ALL" ? -1 : subCol ? subCol.dict.indexOf(subNodePTName) : -1;
    if (subId === -1 && subNodePTName !== "ALL") return undefined;
    const toolId =
      toolName === "ALL" ? -1 : toolCol ? toolCol.dict.indexOf(toolName) : -1;
    if (toolId === -1 && toolName !== "ALL") return undefined;

    const idx: number[] = [];
    for (let i = 0; i < n; i += 1) {
      if (nodeId !== -1 && nodeCol.ids[i] !== nodeId) continue;
      if (pathId !== -1 && pathCol && pathCol.ids[i] !== pathId) continue;
      if (ptId !== -1 && ptCol && ptCol.ids[i] !== ptId) continue;
      if (subId !== -1 && subCol.ids[i] !== subId) continue;
      if (toolId !== -1 && toolCol && toolCol.ids[i] !== toolId) continue;
      idx.push(i);
    }
    return idx;
  }, [nodeName, nodePath, offline, ptName, subNodePTName, toolName]);

  const getTooltipInfo = useMemo(() => {
    if (!offline) return undefined;
    return (originalIndex: number) => {
      const nodeCol = offline.categoricals.NodeName;
      const ptCol = offline.categoricals.PTName;
      const nodeNameStr = nodeCol ? nodeCol.dict[nodeCol.ids[originalIndex]] : "Unknown";
      const ptNameStr = ptCol ? ptCol.dict[ptCol.ids[originalIndex]] : "Unknown";
      return { nodeName: nodeNameStr, ptName: ptNameStr };
    };
  }, [offline]);

  const charts = useMemo(() => {
    const group = "sync-charts";
    return panes.map((p) => {
      const keys = p.keys;
      const series =
        offline && offline.time ? buildOfflineSeries(offline.time, offline.columns, keys, offlineIndices) : [];
      return { pane: p, group, series };
    });
  }, [offline, offlineIndices, panes]);

  const chartHeight = panes.length <= 1 ? 520 : Math.max(260, Math.floor(820 / panes.length));
  const titlePrefix = useMemo(() => {
    const parts: string[] = [];
    if (nodeName && nodeName !== "ALL") parts.push(nodeName);
    if (ptName && ptName !== "ALL") parts.push(ptName);
    if (nodePath && nodePath !== "ALL") parts.push(nodePath);
    if (subNodePTName && subNodePTName !== "ALL") parts.push(subNodePTName);
    if (toolName && toolName !== "ALL") parts.push(toolName);
    return parts.length ? `${parts.join(" · ")} · ` : "";
  }, [nodeName, nodePath, ptName, subNodePTName, toolName]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {charts.map((c) => (
        <div
          key={c.pane.id}
          className={cn(
            "rounded-2xl border border-slate-200 bg-white/60 p-3",
            c.pane.id === activePaneId
              ? "shadow-[0_0_0_1px_rgba(59,130,246,0.25),0_10px_30px_rgba(15,23,42,0.08)]"
              : "shadow-[0_10px_30px_rgba(15,23,42,0.06)]",
          )}
        >
          <TimeSeriesChart
            group={c.group}
            title={`${titlePrefix}${c.pane.title} · ${c.pane.keys.length} signals`}
            series={c.series}
            height={chartHeight}
            getTooltipInfo={getTooltipInfo}
          />
        </div>
      ))}
    </div>
  );
}
