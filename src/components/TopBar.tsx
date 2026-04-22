import { Download, Upload, PanelLeft, Activity } from "lucide-react";
import { useRef } from "react";
import OfflineCsvImporter from "@/components/OfflineCsvImporter";
import { useWorkbenchStore } from "@/store/workbenchStore";
import type { ViewConfig } from "@/types";

export default function TopBar({
  onImportView,
}: {
  onImportView: (config: ViewConfig) => void;
}) {
  const offline = useWorkbenchStore((s) => s.offline);
  const exportView = useWorkbenchStore((s) => s.exportView);
  const importView = useWorkbenchStore((s) => s.importView);
  const sidebarCollapsed = useWorkbenchStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useWorkbenchStore((s) => s.toggleSidebar);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function downloadView() {
    const v = exportView();
    const blob = new Blob([JSON.stringify(v, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "view.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    const text = await file.text();
    const config = JSON.parse(text) as ViewConfig;
    importView(config);
    onImportView(config);
  }

  return (
    <header className="relative flex-shrink-0 z-20 border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex items-center gap-3">
            {sidebarCollapsed && (
              <button
                type="button"
                onClick={() => toggleSidebar()}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                title="展开侧边栏"
              >
                <PanelLeft className="h-5 w-5" />
              </button>
            )}
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-blue-600 shadow-sm text-white">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-['Rajdhani'] text-lg font-bold tracking-wide text-slate-900">Robot Project Data in Log</div>
            <div className="truncate text-xs text-slate-500">
              {offline
                ? `CSV: ${offline.fileName}${offline.rowCount ? ` · ${offline.rowCount.toLocaleString()} rows` : ""}`
                : "离线模式：选择 CSV 开始分析"}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 md:w-auto md:justify-end">
          <OfflineCsvImporter variant="header" />

          <button
            type="button"
            onClick={downloadView}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <Download className="h-4 w-4" />
            导出视图
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <Upload className="h-4 w-4" />
            导入视图
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImportFile(f);
              e.currentTarget.value = "";
            }}
          />
        </div>
      </div>
    </header>
  );
}
