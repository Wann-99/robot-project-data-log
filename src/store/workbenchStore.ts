import { create } from "zustand";
import type { OfflineDataset, OfflineSchema, PaneConfig, ViewConfig } from "@/types";
import { loadCsvCategoricals, loadCsvColumns } from "@/utils/csv";

let offlineLoadToken = 0;
let offlineMetaToken = 0;

export type WorkbenchState = {
  panes: PaneConfig[];
  activePaneId: string;
  nodeName: string;
  nodePath: string;
  ptName: string;
  subNodePTName: string;
  toolName: string;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  groupCollapsed: Record<string, boolean>;
  offline?: OfflineDataset;

  setActivePane: (id: string) => void;
  addPane: () => void;
  removePane: (id: string) => void;
  setPaneKeys: (id: string, keys: string[]) => void;
  appendPaneKeys: (id: string, keys: string[]) => void;
  removePaneKeys: (id: string, keys: string[]) => void;
  setNodeName: (nodeName: string) => void;
  setNodePath: (nodePath: string) => void;
  setPTName: (ptName: string) => void;
  setSubNodePTName: (subNodePTName: string) => void;
  setToolName: (toolName: string) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  toggleGroup: (group: string) => void;

  setOfflineSchema: (schema?: OfflineSchema) => void;
  setOfflineTimeKey: (timeKey: string) => void;
  loadOfflineCategoricals: () => Promise<void>;
  loadOfflineColumns: (keys: string[]) => Promise<void>;

  exportView: () => ViewConfig;
  importView: (config: ViewConfig) => void;
};

const defaultPanes: PaneConfig[] = [
  { id: "p1", title: "Pane 1", keys: [] },
];

export const useWorkbenchStore = create<WorkbenchState>((set, get) => ({
  panes: defaultPanes,
  activePaneId: "p1",
  nodeName: "ALL",
  nodePath: "ALL",
  ptName: "ALL",
  subNodePTName: "ALL",
  toolName: "ALL",
  sidebarCollapsed: false,
  sidebarWidth: 256,
  groupCollapsed: {},
  offline: undefined,
  setActivePane: (id) => set({ activePaneId: id }),
  addPane: () =>
    set((s) => {
      const nextNum = Math.max(1, ...s.panes.map((p) => Number(p.id.slice(1)) || 1)) + 1;
      const id = `p${nextNum}`;
      const pane: PaneConfig = { id, title: `Pane ${nextNum}`, keys: [] };
      return { panes: [...s.panes, pane], activePaneId: pane.id };
    }),
  removePane: (id) =>
    set((s) => {
      if (s.panes.length <= 1) return s;
      const panes = s.panes.filter((p) => p.id !== id);
      const nextActive = s.activePaneId === id ? panes[0]?.id ?? "p1" : s.activePaneId;
      return { panes, activePaneId: nextActive };
    }),
  setPaneKeys: (id, keys) =>
    set((s) => ({
      panes: s.panes.map((p) => (p.id === id ? { ...p, keys } : p)),
    })),
  appendPaneKeys: (id, keys) =>
    set((s) => ({
      panes: s.panes.map((p) => {
        if (p.id !== id) return p;
        const setKeys = new Set(p.keys);
        for (const k of keys) setKeys.add(k);
        return { ...p, keys: Array.from(setKeys) };
      }),
    })),
  removePaneKeys: (id, keys) =>
    set((s) => ({
      panes: s.panes.map((p) => {
        if (p.id !== id) return p;
        const rm = new Set(keys);
        return { ...p, keys: p.keys.filter((k) => !rm.has(k)) };
      }),
    })),
  setNodeName: (nodeName) => set({ nodeName, nodePath: "ALL", ptName: "ALL", subNodePTName: "ALL", toolName: "ALL" }),
  setNodePath: (nodePath) => set({ nodePath, ptName: "ALL", subNodePTName: "ALL", toolName: "ALL" }),
  setPTName: (ptName) => set({ ptName, subNodePTName: "ALL", toolName: "ALL" }),
  setSubNodePTName: (subNodePTName) => set({ subNodePTName, toolName: "ALL" }),
  setToolName: (toolName) => set({ toolName }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  toggleGroup: (group) => set((s) => ({ groupCollapsed: { ...s.groupCollapsed, [group]: !s.groupCollapsed[group] } })),

  setOfflineSchema: (schema) =>
    set((s) => ({
      offline: schema
        ? {
            ...schema,
            categoricals: {},
            loadedKeys: [],
            time: undefined,
            columns: {},
            rowCount: undefined,
            metaLoading: false,
            metaProgress: 0,
            metaError: undefined,
            dataLoading: false,
            dataProgress: 0,
            dataError: undefined,
          }
        : undefined,
      panes: schema ? s.panes : defaultPanes,
    })),
  setOfflineTimeKey: (timeKey) =>
    set((s) => {
      if (!s.offline) return s;
      const keys = s.offline.numericKeys.filter((k) => k !== timeKey);
      return {
        offline: {
          ...s.offline,
          timeKey,
          keys,
          categoricals: s.offline.categoricals,
          loadedKeys: [],
          time: undefined,
          columns: {},
          rowCount: undefined,
          metaLoading: s.offline.metaLoading,
          metaProgress: s.offline.metaProgress,
          metaError: s.offline.metaError,
          dataLoading: false,
          dataProgress: 0,
          dataError: undefined,
        },
      };
    }),
  loadOfflineCategoricals: async () => {
    const s = get();
    if (!s.offline) return;
    const required = ["NodeName", "NodePath", "PTName", "SubNodePTName", "ToolName"].filter((k) =>
      s.offline!.stringKeys.includes(k),
    ) as Array<"NodeName" | "NodePath" | "PTName" | "SubNodePTName" | "ToolName">;
    if (!required.length) return;
    if (required.every((k) => Boolean(s.offline!.categoricals[k]))) return;

    offlineMetaToken += 1;
    const token = offlineMetaToken;

    set((st) =>
      st.offline ? { offline: { ...st.offline, metaLoading: true, metaProgress: 0, metaError: undefined } } : st,
    );

    try {
      const { rowCount, columns } = await loadCsvCategoricals({
        file: s.offline.file,
        delimiter: s.offline.delimiter,
        keys: required,
        onProgress: (p) => {
          if (offlineMetaToken !== token) return;
          set((st) => (st.offline ? { offline: { ...st.offline, metaProgress: p } } : st));
        },
        shouldAbort: () => offlineMetaToken !== token,
      });

      set((st) =>
        st.offline
          ? {
              offline: {
                ...st.offline,
                rowCount: st.offline.rowCount ?? rowCount,
                categoricals: { ...st.offline.categoricals, ...(columns as OfflineDataset["categoricals"]) },
                metaLoading: false,
                metaProgress: 1,
                metaError: undefined,
              },
            }
          : st,
      );
    } catch (e) {
      set((st) =>
        st.offline
          ? {
              offline: {
                ...st.offline,
                metaLoading: false,
                metaProgress: 0,
                metaError: e instanceof Error ? e.message : "加载分类列失败",
              },
            }
          : st,
      );
    }
  },
  loadOfflineColumns: async (keys) => {
    const s = get();
    if (!s.offline) return;

    const targetKeys = Array.from(new Set(keys)).filter((k) => s.offline!.keys.includes(k));
    const already = new Set(s.offline.loadedKeys);
    const need = targetKeys.filter((k) => !already.has(k));
    if (s.offline.time && need.length === 0) return;

    offlineLoadToken += 1;
    const token = offlineLoadToken;

    set((st) =>
      st.offline ? { offline: { ...st.offline, dataLoading: true, dataProgress: 0, dataError: undefined } } : st,
    );
    try {
      const { time, columns, rowCount } = await loadCsvColumns({
        file: s.offline.file,
        delimiter: s.offline.delimiter,
        timeKey: s.offline.timeKey,
        keys: need,
        onProgress: (p) => {
          if (offlineLoadToken !== token) return;
          set((st) => (st.offline ? { offline: { ...st.offline, dataProgress: p } } : st));
        },
        shouldAbort: () => offlineLoadToken !== token,
      });
      set((st) =>
        st.offline
          ? {
              offline: {
                ...st.offline,
                time: st.offline.time ?? time,
                columns: { ...st.offline.columns, ...columns },
                rowCount: st.offline.rowCount ?? rowCount,
                dataLoading: false,
                dataProgress: 1,
                loadedKeys: Array.from(new Set([...st.offline.loadedKeys, ...need])),
                dataError: undefined,
              },
            }
          : st,
      );
    } catch (e) {
      set((st) =>
        st.offline
          ? {
              offline: {
                ...st.offline,
                dataLoading: false,
                dataProgress: 0,
                dataError: e instanceof Error ? e.message : "加载 CSV 失败",
              },
            }
          : st,
      );
    }
  },

  exportView: () => {
    const s = get();
    return {
      mode: "offline",
      panes: s.panes,
      timeKey: s.offline?.timeKey,
      nodeName: s.nodeName,
      nodePath: s.nodePath,
      ptName: s.ptName,
      subNodePTName: s.subNodePTName,
      toolName: s.toolName,
    };
  },
  importView: (config) =>
    set((s) => ({
      panes: config.panes?.length ? config.panes : s.panes,
      activePaneId: config.panes?.[0]?.id ?? s.activePaneId,
      nodeName: config.nodeName ?? s.nodeName,
      nodePath: config.nodePath ?? s.nodePath,
      ptName: config.ptName ?? s.ptName,
      subNodePTName: config.subNodePTName ?? s.subNodePTName,
      toolName: config.toolName ?? s.toolName,
      offline:
        s.offline && config.timeKey
          ? {
              ...s.offline,
              timeKey: config.timeKey,
              keys: s.offline.numericKeys.filter((k) => k !== config.timeKey),
              loadedKeys: [],
              time: undefined,
              columns: {},
              rowCount: undefined,
              dataLoading: false,
              dataProgress: 0,
              dataError: undefined,
            }
          : s.offline,
    })),
}));
