import { useState, useCallback, useRef } from "react";
import { FileUp, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkbenchStore } from "@/store/workbenchStore";
import { analyzeCsvFile } from "@/utils/csv";

export default function OfflineCsvImporter({
  variant,
  className,
}: {
  variant: "welcome" | "header";
  className?: string;
}) {
  const setOfflineSchema = useWorkbenchStore((s) => s.setOfflineSchema);
  const [error, setError] = useState<string | undefined>();
  const [delimiter, setDelimiter] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importState, setImportState] = useState<"idle" | "uploading" | "analyzing" | "success">("idle");
  const [progress, setProgress] = useState(0);

  async function handleFile(file: File) {
    setError(undefined);
    setImportState("uploading");
    setProgress(0);

    // 模拟文件读取上传的过程（因为解析本地文件是瞬时的，此处为了 UX 平滑过渡加入短暂动画）
    for (let i = 0; i <= 60; i += 5) {
      setProgress(i);
      await new Promise((r) => setTimeout(r, 20));
    }

    setImportState("analyzing");
    for (let i = 60; i <= 95; i += 5) {
      setProgress(i);
      await new Promise((r) => setTimeout(r, 30));
    }

    try {
      const schema = await analyzeCsvFile(file, { delimiter: delimiter || undefined });
      setProgress(100);
      setImportState("success");
      
      // 解析完成后，短暂停留让用户看清成功状态，再进入工作台
      await new Promise((r) => setTimeout(r, 600));
      setOfflineSchema({ ...schema, delimiter: delimiter || undefined });
    } catch (e) {
      setImportState("idle");
      setProgress(0);
      setOfflineSchema(undefined);
      setError(e instanceof Error ? e.message : "CSV 解析失败");
    }
  }

  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (importState !== "idle") return;
    dragCounter.current += 1;
    if (dragCounter.current === 1) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (importState !== "idle") return;
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (importState !== "idle") return;
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const isBusy = importState !== "idle";

  if (variant === "header") {
    return (
      <label className={cn("flex items-center gap-2", className)}>
        <span className="relative inline-flex cursor-pointer items-center justify-center rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
          <FileUp className="h-4 w-4" />
          导入 CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={isBusy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.currentTarget.value = "";
            }}
          />
        </span>
      </label>
    );
  }

  return (
    <div 
      className={cn("h-screen w-full overflow-hidden bg-[#f8fafc] p-6", className)}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="absolute top-[-10%] left-[-10%] h-[40rem] w-[40rem] rounded-full bg-blue-400/20 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40rem] w-[40rem] rounded-full bg-purple-400/20 blur-[100px]" />

      <div className="relative z-10 flex h-full items-center justify-center">
        <div 
          className={cn(
            "relative w-full max-w-md transition-all duration-300",
            isDragging && "scale-105"
          )}
        >
          <div 
            className={cn(
              "relative h-full w-full cursor-pointer rounded-3xl p-10 text-center transition-all duration-300",
              isDragging 
                ? "bg-blue-50/80 border-2 border-blue-400 border-dashed shadow-[0_8px_30px_rgba(59,130,246,0.15)] pointer-events-none" 
                : isBusy
                  ? "bg-white shadow-2xl pointer-events-none border border-transparent"
                  : "border border-white bg-white/80 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] hover:border-blue-300 hover:shadow-xl backdrop-blur-2xl"
            )}
            onClick={() => !isBusy && fileInputRef.current?.click()}
          >
            <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
              {/* 外圈 SVG 进度环 */}
              {isBusy && (
                <svg className="absolute inset-0 h-full w-full -rotate-90 transition-all duration-300" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" className="text-slate-100" strokeWidth="4" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="46" 
                    fill="none" 
                    stroke="currentColor" 
                    className={cn(
                      "transition-all duration-300 ease-out", 
                      importState === "success" ? "text-emerald-500" : "text-blue-500"
                    )} 
                    strokeWidth="4" 
                    strokeDasharray="289.02" 
                    strokeDashoffset={289.02 - (progress / 100) * 289.02} 
                    strokeLinecap="round" 
                  />
                </svg>
              )}

              <div className={cn(
                "flex h-16 w-16 items-center justify-center rounded-2xl transition-colors duration-300",
                importState === "success" ? "bg-emerald-50 text-emerald-600" :
                isDragging ? "bg-blue-100 text-blue-600" : 
                isBusy ? "bg-blue-50 text-blue-600" : "bg-blue-50 text-blue-600 border border-blue-100 shadow-inner"
              )}>
                {importState === "success" ? <CheckCircle2 className="h-8 w-8" /> :
                 isBusy ? <FileSpreadsheet className="h-8 w-8" /> :
                 <FileUp className={cn("h-8 w-8", isDragging && "animate-bounce")} />}
              </div>
            </div>
            
            <h2 className={cn(
              "mb-3 text-2xl font-extrabold tracking-tight transition-colors duration-300",
              isDragging ? "text-blue-700" : importState === "success" ? "text-emerald-600" : isBusy ? "text-slate-700" : "text-slate-800"
            )}>
              {importState === "uploading" ? "正在读取文件..." :
               importState === "analyzing" ? "正在解析数据..." :
               importState === "success" ? "解析完成" :
               isDragging ? "释放鼠标以导入" : "点击或拖拽文件到此处"}
            </h2>
            <p className={cn("mb-8 text-sm leading-relaxed transition-colors duration-300", isBusy ? "text-slate-400" : "text-slate-500")}>
              {isBusy
                ? importState === "success" ? "即将进入工作台..." : `${progress}%`
                : isDragging 
                  ? "松开鼠标即可开始解析 CSV 文件数据"
                  : "系统将按字段分类并提供筛选与可视化分析。"}
            </p>

            <div className={cn("relative block group transition-opacity duration-300", isBusy ? "pointer-events-none opacity-0 h-0 overflow-hidden" : "opacity-100")}>
              <div className="absolute inset-0 rounded-xl bg-blue-500 blur opacity-25 transition-opacity duration-300 group-hover:opacity-40" />
              <div className="relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-xl">
                选择文件并开始分析
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                disabled={isBusy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                  e.currentTarget.value = "";
                }}
              />
            </div>

            {error && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

