import { useMemo } from "react";
import { useWorkbenchStore } from "@/store/workbenchStore";
import ChartsStack from "@/components/ChartsStack";
import OfflineNodeFilterBar from "@/components/OfflineNodeFilterBar";
import TimeKeySelect from "@/components/TimeKeySelect";
import ReactECharts from "echarts-for-react";
import { motion } from "framer-motion";

export default function DataAnalysisDisplay() {
  const panes = useWorkbenchStore((s) => s.panes);
  const activePaneId = useWorkbenchStore((s) => s.activePaneId);
  const offline = useWorkbenchStore((s) => s.offline);
  const nodeName = useWorkbenchStore((s) => s.nodeName);
  const nodePath = useWorkbenchStore((s) => s.nodePath);
  const ptName = useWorkbenchStore((s) => s.ptName);
  const subNodePTName = useWorkbenchStore((s) => s.subNodePTName);
  const toolName = useWorkbenchStore((s) => s.toolName);

  const keys = useMemo(() => {
    const activePane = panes.find((p) => p.id === activePaneId) || panes[0];
    return activePane?.keys ?? [];
  }, [activePaneId, panes]);

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
    const pathId = nodePath === "ALL" ? -1 : pathCol ? pathCol.dict.indexOf(nodePath) : -1;
    if (pathId === -1 && nodePath !== "ALL") return undefined;
    const ptId = ptName === "ALL" ? -1 : ptCol ? ptCol.dict.indexOf(ptName) : -1;
    if (ptId === -1 && ptName !== "ALL") return undefined;
    const subId = subNodePTName === "ALL" ? -1 : subCol ? subCol.dict.indexOf(subNodePTName) : -1;
    if (subId === -1 && subNodePTName !== "ALL") return undefined;
    const toolId = toolName === "ALL" ? -1 : toolCol ? toolCol.dict.indexOf(toolName) : -1;
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

  const stats = useMemo(() => {
    if (!offline || !keys.length) return null;
    let count = 0;
    let sum = 0;
    let max = -Infinity;
    let min = Infinity;
    
    const targetKey = keys[0];
    const col = offline.columns[targetKey];
    if (!col) return null;

    if (offlineIndices) {
      for (const i of offlineIndices) {
        const v = col[i];
        if (Number.isFinite(v)) {
          count++;
          sum += v;
          if (v > max) max = v;
          if (v < min) min = v;
        }
      }
    } else {
      for (let i = 0; i < col.length; i++) {
        const v = col[i];
        if (Number.isFinite(v)) {
          count++;
          sum += v;
          if (v > max) max = v;
          if (v < min) min = v;
        }
      }
    }

    const averages = keys.map(k => {
      const c = offline.columns[k];
      if (!c) return { name: k, value: 0 };
      let csum = 0;
      let ccount = 0;
      if (offlineIndices) {
        for (const i of offlineIndices) {
          if (Number.isFinite(c[i])) { csum += c[i]; ccount++; }
        }
      } else {
        for (let i = 0; i < c.length; i++) {
          if (Number.isFinite(c[i])) { csum += c[i]; ccount++; }
        }
      }
      return { name: k, value: ccount > 0 ? csum / ccount : 0 };
    });

    return {
      title: targetKey + (keys.length > 1 ? ` (+${keys.length - 1})` : ""),
      count,
      avg: count > 0 ? sum / count : 0,
      max: count > 0 ? max : 0,
      min: count > 0 ? min : 0,
      averages
    };
  }, [offline, keys, offlineIndices]);

  const barOption = useMemo(() => {
    if (!stats || !stats.averages.length) return {};
    const textSecondary = "rgba(71,85,105,0.70)";
    const axisLine = "rgba(15,23,42,0.14)";
    const split = "rgba(15,23,42,0.06)";
    
    return {
      backgroundColor: "transparent",
      animation: false,
      grid: { left: 44, right: 18, top: 20, bottom: 24 },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      xAxis: {
        type: "category",
        data: stats.averages.map(a => a.name),
        axisLine: { lineStyle: { color: axisLine } },
        axisTick: { show: false },
        axisLabel: { color: textSecondary, fontSize: 10, interval: 0, width: 60, overflow: "truncate" },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: textSecondary, fontSize: 11 },
        splitLine: { lineStyle: { color: split, type: "dashed" } },
      },
      series: [
        {
          type: "bar",
          barMaxWidth: 32,
          itemStyle: {
            color: (params: { dataIndex: number }) => params.dataIndex === 0 ? "#f43f5e" : "#94a3b8",
            borderRadius: [4, 4, 0, 0]
          },
          data: stats.averages.map(a => a.value)
        }
      ]
    };
  }, [stats]);

  if (!offline) return null;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 顶部筛选控制条 (类似于原版左上角的搜索和时间) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <OfflineNodeFilterBar />
        <div className="flex-shrink-0 border-l border-slate-100 pl-4 ml-2">
          <TimeKeySelect />
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        <h2 className="text-2xl font-bold text-slate-800 font-mono tracking-tight mb-6 flex items-center gap-3">
          <span className="w-2 h-6 bg-blue-500 rounded-full inline-block shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
          {stats?.title || "选择信号以分析"}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-slate-100">
          {[
            ["数据总数", stats?.count ?? 0, "行", "bg-blue-50 text-blue-600"], 
            ["平均数值", stats?.avg.toFixed(3) ?? "0.000", "", "bg-indigo-50 text-indigo-600"], 
            ["最大峰值", stats?.max.toFixed(3) ?? "0.000", "", "bg-rose-50 text-rose-600"], 
            ["最小谷值", stats?.min.toFixed(3) ?? "0.000", "", "bg-emerald-50 text-emerald-600"]
          ].map(([label, value, unit, colorClass], idx)=>(
            <motion.div 
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
              key={String(label)} 
              className={`flex flex-col group ${idx !== 0 ? 'pl-6' : ''}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${String(colorClass).split(' ')[0].replace('bg-', 'bg-').replace('50', '400')} transition-transform group-hover:scale-150`}></span>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-800 tabular-nums tracking-tight">{value}</span>
                <span className="text-sm font-medium text-slate-400">{unit}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 双图表区 */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        {/* 左侧主趋势图 */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow duration-300"
        >
          <h3 className="mb-4 text-slate-700 font-bold flex items-center gap-2 text-sm">
            <span className="bg-slate-100 text-slate-500 p-1.5 rounded-lg">📈</span> 信号时间序列趋势
          </h3>
          <div className="min-h-[220px]">
            <ChartsStack />
          </div>
        </motion.div>

        {/* 右侧分布对比图 */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow duration-300"
        >
          <h3 className="mb-4 text-slate-700 font-bold flex items-center gap-2 text-sm">
            <span className="bg-slate-100 text-slate-500 p-1.5 rounded-lg">📊</span> 多信号均值对比 (Top)
          </h3>
          <div className="h-[220px] w-full">
            {stats && stats.averages.length > 0 ? (
              <ReactECharts option={barOption} style={{ height: "100%", width: "100%" }} notMerge={true} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                无数据
              </div>
            )}
          </div>
        </motion.div>
      </div>
      
      {/* 底部数据流拆解与识别（占位） */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-slate-800 font-bold flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">🔄</span> 
            数据切片与异常识别
          </h3>
          <span className="text-xs text-slate-500">共 {stats?.count ?? 0} 行运行记录</span>
        </div>
        <div className="p-8 text-center text-sm text-slate-400">
          通过顶部条件进行筛选，下方可用于后续扩展展示异常点位明细。
        </div>
      </div>
    </div>
  );
}
