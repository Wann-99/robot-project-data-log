import { useEffect, useCallback, useRef, useState } from "react";
import { PanelLeftClose } from "lucide-react";
import FieldPicker from "@/components/FieldPicker";
import OfflineCsvImporter from "@/components/OfflineCsvImporter";
import DataAnalysisDisplay from "@/components/DataAnalysisDisplay";
import TopBar from "@/components/TopBar";
import { useOfflineCsvLoader } from "@/hooks/useOfflineCsvLoader";
import { useOfflineCategoricalLoader } from "@/hooks/useOfflineCategoricalLoader";
import { cn } from "@/lib/utils";
import { useWorkbenchStore } from "@/store/workbenchStore";
import type { ViewConfig } from "@/types";

const VIEW_KEY = "robot-scope:view";

export default function Home() {
  const offline = useWorkbenchStore((s) => s.offline);
  const panes = useWorkbenchStore((s) => s.panes);
  const offlineTimeKey = useWorkbenchStore((s) => s.offline?.timeKey);
  const nodeName = useWorkbenchStore((s) => s.nodeName);
  const nodePath = useWorkbenchStore((s) => s.nodePath);
  const ptName = useWorkbenchStore((s) => s.ptName);
  const subNodePTName = useWorkbenchStore((s) => s.subNodePTName);
  const toolName = useWorkbenchStore((s) => s.toolName);
  const sidebarCollapsed = useWorkbenchStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useWorkbenchStore((s) => s.toggleSidebar);
  const sidebarWidth = useWorkbenchStore((s) => s.sidebarWidth);
  const setSidebarWidth = useWorkbenchStore((s) => s.setSidebarWidth);
  const importView = useWorkbenchStore((s) => s.importView);

  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(sidebarWidth);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = sidebarWidth;
    setIsResizing(true);
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (e: PointerEvent) => {
      const delta = e.clientX - resizeStartX.current;
      const newWidth = Math.max(200, Math.min(600, resizeStartWidth.current + delta));
      setSidebarWidth(newWidth);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isResizing, setSidebarWidth]);

  useOfflineCsvLoader();
  useOfflineCategoricalLoader();

  useEffect(() => {
    const raw = localStorage.getItem(VIEW_KEY);
    if (!raw) return;
    try {
      const cfg = JSON.parse(raw) as ViewConfig;
      importView(cfg);
    } catch {
      return;
    }
  }, [importView]);

  useEffect(() => {
    const cfg: ViewConfig = {
      mode: "offline",
      panes,
      timeKey: offlineTimeKey,
      nodeName,
      nodePath,
      ptName,
      subNodePTName,
      toolName,
    };
    localStorage.setItem(VIEW_KEY, JSON.stringify(cfg));
  }, [nodeName, nodePath, offlineTimeKey, panes, ptName, subNodePTName, toolName]);

  if (!offline) {
    return <OfflineCsvImporter variant="welcome" />;
  }

  return (
    <div
      className={cn(
        "flex h-screen w-full overflow-hidden bg-slate-50 text-slate-800 p-2 md:p-3",
        isResizing && "cursor-col-resize select-none",
      )}
    >
      <aside
        className={cn(
          "relative flex-shrink-0 overflow-hidden",
          sidebarCollapsed ? "w-0" : "",
          isResizing ? "transition-none" : "transition-[width] duration-300",
        )}
        style={{ width: sidebarCollapsed ? 0 : sidebarWidth }}
      >
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ width: sidebarWidth }}>
          <div className="relative flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 bg-white/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">传感器列表</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {offline.keys.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggleSidebar()}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="折叠侧边栏"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
            {offline.dataLoading && (
              <div className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden bg-transparent">
                <div
                  className="h-full bg-blue-500 transition-all duration-200 ease-out"
                  style={{ width: `${Math.max(2, offline.dataProgress * 100)}%` }}
                />
              </div>
            )}
          </div>
          <div className="flex-1 overflow-hidden p-2">
            <FieldPicker embedded />
          </div>
        </div>
      </aside>

      {!sidebarCollapsed && (
        <div
          className={cn(
            "relative z-50 flex w-2 md:w-3 flex-shrink-0 cursor-col-resize items-stretch justify-center bg-transparent touch-none",
            isResizing && "select-none",
          )}
          onPointerDown={handlePointerDown}
          aria-label="resize sidebar"
          title="拖拽调整侧边栏宽度"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <TopBar onImportView={() => {}} />
          <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-[#f4f6f8] p-4 md:p-6">
            <DataAnalysisDisplay />
          </main>
        </div>
      </div>
    </div>
  );
}
