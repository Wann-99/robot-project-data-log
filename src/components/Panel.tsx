import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function Panel({
  title,
  right,
  className,
  children,
}: {
  title?: string;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] backdrop-blur-md",
        className,
      )}
    >
      {(title || right) && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-200/60 px-4 py-3">
          <div className="font-['Rajdhani'] text-sm font-semibold tracking-wide text-slate-800">{title}</div>
          <div className="flex items-center gap-2">{right}</div>
        </div>
      )}
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}
