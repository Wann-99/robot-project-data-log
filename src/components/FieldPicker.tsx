import { Search, Plus, Minus, Layers, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import Panel from "@/components/Panel";
import { cn } from "@/lib/utils";
import { useWorkbenchStore } from "@/store/workbenchStore";
import { inferColumnMeta } from "@/utils/columnMeta";

export default function FieldPicker({ embedded }: { embedded?: boolean }) {
  const offline = useWorkbenchStore((s) => s.offline);
  const groupCollapsed = useWorkbenchStore((s) => s.groupCollapsed);
  const toggleGroup = useWorkbenchStore((s) => s.toggleGroup);

  const panes = useWorkbenchStore((s) => s.panes);
  const activePaneId = useWorkbenchStore((s) => s.activePaneId);
  const setActivePane = useWorkbenchStore((s) => s.setActivePane);
  const addPane = useWorkbenchStore((s) => s.addPane);
  const removePane = useWorkbenchStore((s) => s.removePane);
  const appendKeys = useWorkbenchStore((s) => s.appendPaneKeys);
  const removeKeys = useWorkbenchStore((s) => s.removePaneKeys);

  const [q, setQ] = useState("");

  const activePane = panes.find((p) => p.id === activePaneId) ?? panes[0]!;
  const activeSet = useMemo(() => new Set(activePane.keys), [activePane.keys]);

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const keys = offline?.keys ?? [];
    const map = new Map<
      string,
      {
        group: string;
        order: number;
        description?: string;
        items: Array<{ key: string; meta: ReturnType<typeof inferColumnMeta> }>;
      }
    >();

    for (const k of keys) {
      const meta = inferColumnMeta(k);
      const hay = (k + " " + meta.label + " " + (meta.description ?? "")).toLowerCase();
      if (needle && !hay.includes(needle)) continue;

      const g = map.get(meta.group) ?? {
        group: meta.group,
        order: meta.groupOrder,
        description: meta.description,
        items: [],
      };
      g.items.push({ key: k, meta });
      map.set(meta.group, g);
    }

    return Array.from(map.values()).sort((a, b) => a.order - b.order);
  }, [offline?.keys, q]);

  function toggleKey(k: string) {
    if (activeSet.has(k)) removeKeys(activePane.id, [k]);
    else appendKeys(activePane.id, [k]);
  }

  const controls = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-slate-400" />
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {panes.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivePane(p.id)}
              className={cn(
                "whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
                p.id === activePane.id
                  ? "border-slate-200 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              {p.title} · {p.keys.length}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1 border-l border-slate-200 pl-2">
          <button
            type="button"
            onClick={() => addPane()}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            title="添加 Pane"
          >
            <Plus className="h-4 w-4" />
          </button>
          {panes.length > 1 && (
            <button
              type="button"
              onClick={() => removePane(activePane.id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              title="删除当前 Pane"
            >
              <Minus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
          placeholder="搜索字段（如 pose_x / imu_az）"
        />
      </div>
    </div>
  );

  const list = (
    <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
      {groups.length ? (
        <div className="space-y-2">
          {groups.map((g) => {
            // If the group is NOT in groupCollapsed, we treat it as collapsed by default
            const collapsed = groupCollapsed[g.group] === undefined ? true : Boolean(groupCollapsed[g.group]);
            const selectedCount = g.items.reduce((acc, it) => acc + (activeSet.has(it.key) ? 1 : 0), 0);
            return (
              <div key={g.group} className="rounded-xl border border-slate-200 bg-slate-50/60 p-1.5">
                <button
                  type="button"
                  onClick={() => toggleGroup(g.group)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-white/70"
                  title={g.description}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform", !collapsed && "rotate-90")} />
                    <span className="shrink-0 text-[11px] font-extrabold tracking-widest text-slate-600">{g.group.toUpperCase()}</span>
                    {g.description && <span className="truncate text-[11px] text-slate-400">{g.description}</span>}
                  </span>
                  <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {selectedCount}/{g.items.length}
                  </span>
                </button>
                {!collapsed && (
                  <div className="mt-1 flex flex-col gap-1">
                    {g.items.map((it) => {
                      const checked = activeSet.has(it.key);
                      return (
                        <button
                          key={it.key}
                          type="button"
                          onClick={() => toggleKey(it.key)}
                          className={cn(
                            "group flex w-full items-center justify-between gap-3 rounded-lg border px-2.5 py-2.5 text-left text-xs transition",
                            checked
                              ? "border-blue-200 bg-blue-50 text-slate-900 font-medium"
                              : "border-transparent bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                          )}
                          title={`${it.key}\n${it.meta.label}${it.meta.unit ? ` · ${it.meta.unit}` : ""}`}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {it.key}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide transition-opacity",
                              checked
                                ? "bg-blue-100/60 text-blue-700"
                                : "bg-transparent text-slate-400 opacity-0 group-hover:opacity-100",
                            )}
                          >
                            {checked ? "已添加" : "添加"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-3 py-10 text-center text-xs text-slate-500">未加载 CSV 或没有可用数值列</div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="flex h-full flex-col">
        <div className="shrink-0 space-y-3 px-3 py-3">
          {controls}
        </div>
        <div className="flex min-h-0 flex-1 px-3 pb-3">{list}</div>
      </div>
    );
  }

  return (
    <Panel title="字段" className="flex min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {controls}
        {list}
      </div>
    </Panel>
  );
}
