import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useWorkbenchStore } from "@/store/workbenchStore";

function selectClass(disabled?: boolean) {
  return cn(
    "w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800 outline-none focus:border-blue-400",
    disabled && "opacity-50",
  );
}

export default function OfflineNodeFilterBar() {
  const offline = useWorkbenchStore((s) => s.offline);
  const nodeName = useWorkbenchStore((s) => s.nodeName);
  const nodePath = useWorkbenchStore((s) => s.nodePath);
  const ptName = useWorkbenchStore((s) => s.ptName);
  const subNodePTName = useWorkbenchStore((s) => s.subNodePTName);
  const toolName = useWorkbenchStore((s) => s.toolName);
  const setNodeName = useWorkbenchStore((s) => s.setNodeName);
  const setNodePath = useWorkbenchStore((s) => s.setNodePath);
  const setPTName = useWorkbenchStore((s) => s.setPTName);
  const setSubNodePTName = useWorkbenchStore((s) => s.setSubNodePTName);
  const setToolName = useWorkbenchStore((s) => s.setToolName);

  const nodeCol = offline?.categoricals.NodeName;
  const pathCol = offline?.categoricals.NodePath;
  const ptCol = offline?.categoricals.PTName;
  const subCol = offline?.categoricals.SubNodePTName;
  const toolCol = offline?.categoricals.ToolName;

  const nodeOptions = useMemo(() => {
    if (!nodeCol) return ["ALL"];
    const vals = nodeCol.dict.filter((v) => v && v.trim().length > 0);
    vals.sort((a, b) => a.localeCompare(b));
    return ["ALL", ...vals];
  }, [nodeCol]);

  const pathOptions = useMemo(() => {
    if (!nodeCol || !pathCol) return ["ALL"];
    if (nodeName === "ALL") {
      const vals = pathCol.dict.filter((v) => v && v.trim().length > 0);
      vals.sort((a, b) => a.localeCompare(b));
      return ["ALL", ...vals];
    }

    const nodeId = nodeCol.dict.indexOf(nodeName);
    if (nodeId < 0) return ["ALL"];

    const set = new Set<number>();
    const n = Math.min(nodeCol.ids.length, pathCol.ids.length);
    for (let i = 0; i < n; i += 1) {
      if (nodeCol.ids[i] === nodeId) set.add(pathCol.ids[i]!);
    }

    const vals = Array.from(set)
      .map((id) => pathCol.dict[id] ?? "")
      .filter((v) => v && v.trim().length > 0)
      .sort((a, b) => a.localeCompare(b));
    return ["ALL", ...vals];
  }, [nodeCol, nodeName, pathCol]);

  const ptOptions = useMemo(() => {
    if (!nodeCol || !pathCol || !ptCol) return ["ALL"];
    const nodeId = nodeName === "ALL" ? -1 : nodeCol.dict.indexOf(nodeName);
    const pathId = nodePath === "ALL" ? -1 : pathCol.dict.indexOf(nodePath);
    if (nodeId === -1 && nodeName !== "ALL") return ["ALL"];
    if (pathId === -1 && nodePath !== "ALL") return ["ALL"];

    const set = new Set<number>();
    const n = Math.min(nodeCol.ids.length, pathCol.ids.length, ptCol.ids.length);
    for (let i = 0; i < n; i += 1) {
      if (nodeId !== -1 && nodeCol.ids[i] !== nodeId) continue;
      if (pathId !== -1 && pathCol.ids[i] !== pathId) continue;
      set.add(ptCol.ids[i]!);
    }

    const vals = Array.from(set)
      .map((id) => ptCol.dict[id] ?? "")
      .filter((v) => v && v.trim().length > 0)
      .sort((a, b) => a.localeCompare(b));
    return ["ALL", ...vals];
  }, [nodeCol, nodeName, nodePath, pathCol, ptCol]);

  const subOptions = useMemo(() => {
    if (!nodeCol || !pathCol || !ptCol || !subCol) return ["ALL"];
    const nodeId = nodeName === "ALL" ? -1 : nodeCol.dict.indexOf(nodeName);
    const pathId = nodePath === "ALL" ? -1 : pathCol.dict.indexOf(nodePath);
    const ptId = ptName === "ALL" ? -1 : ptCol.dict.indexOf(ptName);
    if (nodeId === -1 && nodeName !== "ALL") return ["ALL"];
    if (pathId === -1 && nodePath !== "ALL") return ["ALL"];
    if (ptId === -1 && ptName !== "ALL") return ["ALL"];

    const set = new Set<number>();
    const n = Math.min(nodeCol.ids.length, pathCol.ids.length, ptCol.ids.length, subCol.ids.length);
    for (let i = 0; i < n; i += 1) {
      if (nodeId !== -1 && nodeCol.ids[i] !== nodeId) continue;
      if (pathId !== -1 && pathCol.ids[i] !== pathId) continue;
      if (ptId !== -1 && ptCol.ids[i] !== ptId) continue;
      set.add(subCol.ids[i]!);
    }

    const vals = Array.from(set)
      .map((id) => subCol.dict[id] ?? "")
      .filter((v) => v && v.trim().length > 0)
      .sort((a, b) => a.localeCompare(b));
    return ["ALL", ...vals];
  }, [nodeCol, nodeName, nodePath, pathCol, ptCol, ptName, subCol]);

  const toolOptions = useMemo(() => {
    if (!nodeCol || !pathCol || !ptCol || !subCol || !toolCol) return ["ALL"];
    const nodeId = nodeName === "ALL" ? -1 : nodeCol.dict.indexOf(nodeName);
    const pathId = nodePath === "ALL" ? -1 : pathCol.dict.indexOf(nodePath);
    const ptId = ptName === "ALL" ? -1 : ptCol.dict.indexOf(ptName);
    const subId = subNodePTName === "ALL" ? -1 : subCol.dict.indexOf(subNodePTName);
    if (nodeId === -1 && nodeName !== "ALL") return ["ALL"];
    if (pathId === -1 && nodePath !== "ALL") return ["ALL"];
    if (ptId === -1 && ptName !== "ALL") return ["ALL"];
    if (subId === -1 && subNodePTName !== "ALL") return ["ALL"];

    const set = new Set<number>();
    const n = Math.min(nodeCol.ids.length, pathCol.ids.length, ptCol.ids.length, subCol.ids.length, toolCol.ids.length);
    for (let i = 0; i < n; i += 1) {
      if (nodeId !== -1 && nodeCol.ids[i] !== nodeId) continue;
      if (pathId !== -1 && pathCol.ids[i] !== pathId) continue;
      if (ptId !== -1 && ptCol.ids[i] !== ptId) continue;
      if (subId !== -1 && subCol.ids[i] !== subId) continue;
      set.add(toolCol.ids[i]!);
    }

    const vals = Array.from(set)
      .map((id) => toolCol.dict[id] ?? "")
      .filter((v) => v && v.trim().length > 0)
      .sort((a, b) => a.localeCompare(b));
    return ["ALL", ...vals];
  }, [nodeCol, nodeName, nodePath, pathCol, ptCol, ptName, subCol, subNodePTName, toolCol]);

  const disabled = !offline || offline.metaLoading || !nodeCol;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
      <div>
        <div className="text-xs text-slate-600">NodeName</div>
        <select
          value={nodeName}
          disabled={disabled}
          onChange={(e) => setNodeName(e.target.value)}
          className={selectClass(disabled)}
        >
          {nodeOptions.map((v) => (
            <option key={v} value={v}>
              {v === "ALL" ? "全部" : v}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div className="text-xs text-slate-600">NodePath</div>
        <select
          value={nodePath}
          disabled={disabled || !pathCol}
          onChange={(e) => setNodePath(e.target.value)}
          className={selectClass(disabled || !pathCol)}
        >
          {pathOptions.map((v) => (
            <option key={v} value={v}>
              {v === "ALL" ? "全部" : v}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div className="text-xs text-slate-600">PTName</div>
        <select
          value={ptName}
          disabled={disabled || !ptCol}
          onChange={(e) => setPTName(e.target.value)}
          className={selectClass(disabled || !ptCol)}
        >
          {ptOptions.map((v) => (
            <option key={v} value={v}>
              {v === "ALL" ? "全部" : v}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div className="text-xs text-slate-600">SubNodePTName</div>
        <select
          value={subNodePTName}
          disabled={disabled || !subCol}
          onChange={(e) => setSubNodePTName(e.target.value)}
          className={selectClass(disabled || !subCol)}
        >
          {subOptions.map((v) => (
            <option key={v} value={v}>
              {v === "ALL" ? "全部" : v}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div className="text-xs text-slate-600">ToolName</div>
        <select
          value={toolName}
          disabled={disabled || !toolCol}
          onChange={(e) => setToolName(e.target.value)}
          className={selectClass(disabled || !toolCol)}
        >
          {toolOptions.map((v) => (
            <option key={v} value={v}>
              {v === "ALL" ? "全部" : v}
            </option>
          ))}
        </select>
      </div>
      {offline?.metaLoading && (
        <div className="col-span-5 text-xs text-slate-500">
          正在加载 NodeName/NodePath/PTName/SubNodePTName/ToolName… {Math.round(offline.metaProgress * 100)}%
        </div>
      )}
      {offline?.metaError && <div className="col-span-5 text-xs text-amber-700">{offline.metaError}</div>}
    </div>
  );
}
