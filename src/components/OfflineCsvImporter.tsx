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
      className={cn("h-screen w-full overflow-hidden bg-[#f4f7fc] p-6", className)}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="absolute top-[-10%] left-[-10%] h-[40rem] w-[40rem] rounded-full bg-[#dbeafe]/40 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40rem] w-[40rem] rounded-full bg-[#e0e7ff]/40 blur-[100px]" />

      <div className="relative z-10 flex h-full items-center justify-center">
        <div 
          className={cn(
            "relative w-full max-w-md transition-all duration-300",
            isDragging && "scale-105"
          )}
        >
          <div 
            className={cn(
              "relative h-full w-full cursor-pointer rounded-[32px] p-12 text-center transition-all duration-300",
              isDragging 
                ? "bg-[#eff6ff]/80 border-2 border-[#60a5fa] border-dashed shadow-[0_8px_30px_rgba(59,130,246,0.15)] pointer-events-none" 
                : isBusy
                  ? "bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] pointer-events-none border border-transparent"
                  : "border-none bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)]"
            )}
            onClick={() => !isBusy && fileInputRef.current?.click()}
          >
            <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center">
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
                "flex h-[72px] w-[72px] items-center justify-center rounded-2xl transition-colors duration-300",
                importState === "success" ? "bg-emerald-50 text-emerald-600" :
                isDragging ? "bg-blue-100 text-blue-600" : 
                isBusy ? "bg-blue-50 text-blue-600" : "bg-[#f4f7fc] text-[#3b82f6]"
              )}>
                {importState === "success" ? <CheckCircle2 className="h-8 w-8" /> :
                 isBusy ? <FileSpreadsheet className="h-8 w-8" /> :
                 <FileUp className={cn("h-8 w-8", isDragging && "animate-bounce")} strokeWidth={2.5} />}
              </div>
            </div>
            
            <h2 className={cn(
              "mb-3 text-[22px] font-bold tracking-wide transition-colors duration-300",
              isDragging ? "text-blue-700" : importState === "success" ? "text-emerald-600" : isBusy ? "text-slate-700" : "text-[#1e293b]"
            )}>
              {importState === "uploading" ? "正在读取文件..." :
               importState === "analyzing" ? "正在解析数据..." :
               importState === "success" ? "解析完成" :
               isDragging ? "释放鼠标以导入" : "导入日志文件"}
            </h2>
            <p className={cn("mb-8 text-[13px] leading-relaxed transition-colors duration-300 px-4", isBusy ? "text-slate-400" : "text-[#64748b]")}>
              {isBusy
                ? importState === "success" ? "即将进入工作台..." : `${progress}%`
                : isDragging 
                  ? "松开鼠标即可开始解析 .log 文件数据"
                  : "请上传包含 Plan 和节点执行时间的 .log 文件，系统将自动进行循环拆解与性能分析。"}
            </p>

            <div className={cn("relative block group transition-opacity duration-300 mx-auto w-4/5", isBusy ? "pointer-events-none opacity-0 h-0 overflow-hidden" : "opacity-100")}>
              <div className="relative flex items-center justify-center gap-2 rounded-xl bg-[#4338ca] hover:bg-[#3730a3] px-6 py-3.5 text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(67,56,202,0.3)] transition-all duration-200">
                <FileUp className="h-4 w-4" />
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

