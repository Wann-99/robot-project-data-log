export type Mode = "offline";

export type CategoricalColumn = {
  dict: string[];
  ids: Uint32Array;
};

export type OfflineDataset = {
  file: File;
  fileName: string;
  delimiter?: string;
  timeKey: string;
  numericKeys: string[];
  keys: string[];
  stringKeys: string[];
  categoricals: Partial<
    Record<"NodeName" | "NodePath" | "PTName" | "SubNodePTName" | "ToolName", CategoricalColumn>
  >;
  loadedKeys: string[];
  time?: number[];
  columns: Record<string, number[]>;
  rowCount?: number;
  metaLoading: boolean;
  metaProgress: number;
  metaError?: string;
  dataLoading: boolean;
  dataProgress: number;
  dataError?: string;
};

export type OfflineSchema = Pick<
  OfflineDataset,
  "file" | "fileName" | "delimiter" | "timeKey" | "numericKeys" | "keys" | "stringKeys"
>;

export type PaneConfig = {
  id: string;
  title: string;
  keys: string[];
};

export type ViewConfig = {
  mode: Mode;
  panes: PaneConfig[];
  timeKey?: string;
  nodeName?: string;
  nodePath?: string;
  ptName?: string;
  subNodePTName?: string;
  toolName?: string;
};
