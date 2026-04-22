import Papa from "papaparse";
import type { CategoricalColumn, OfflineSchema } from "@/types";

type CsvParseOptions = {
  delimiter?: string;
  timeKey?: string;
};

function safeNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.trim());
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function normalizeTimestampLike(values: number[]): number[] {
  if (values.length < 3) return values;
  const sample = values.slice(0, Math.min(200, values.length)).filter((n) => Number.isFinite(n));
  if (sample.length < 3) return values;

  const sorted = [...sample].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)]!;

  const looksLikeMsEpoch = median > 1e11;
  const looksLikeSecEpoch = median > 1e8 && median <= 1e11;
  if (looksLikeMsEpoch) return values;
  if (looksLikeSecEpoch) return values.map((t) => t * 1000);

  const dt = sorted[Math.floor(sorted.length * 0.75)]! - sorted[Math.floor(sorted.length * 0.25)]!;
  const looksLikeSeconds = dt > 1 && dt < 1e6 && median < 1e7;
  if (looksLikeSeconds) return values.map((t) => t * 1000);
  return values;
}

export function deriveTime(values: number[]): number[] {
  const filled = values.map((t, i) => (Number.isFinite(t) ? t : i));
  return normalizeTimestampLike(filled);
}

export async function analyzeCsvFile(file: File, options?: CsvParseOptions): Promise<OfflineSchema> {
  const result = await new Promise<Papa.ParseResult<Record<string, unknown>>>((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      delimiter: options?.delimiter,
      dynamicTyping: false,
      preview: 2000,
      worker: true,
      complete: resolve,
      error: reject,
    });
  });

  const rows = result.data.filter((r) => r && typeof r === "object");
  const keysAll = Object.keys(rows[0] ?? {});

  const numericKeys: string[] = [];
  const stringKeys: string[] = [];

  for (const k of keysAll) {
    let ok = 0;
    let total = 0;
    let str = 0;
    for (let i = 0; i < rows.length; i += 1) {
      const v = (rows[i] as Record<string, unknown>)[k];
      if (v === "" || v === null || v === undefined) continue;
      total += 1;
      if (safeNumber(v) !== undefined) ok += 1;
      else str += 1;
    }
    if (total > 0 && ok / total >= 0.9) numericKeys.push(k);
    else if (total > 0 && str / total >= 0.9) stringKeys.push(k);
  }

  const canonicalTimeKeys = ["ProgramTime", "PlanTime", "NodeTime"];
  const prefer = ["programtime", "plantime", "nodetime", "t", "time", "timestamp", "stamp", "sec", "secs", "time_s", "time_ms"];
  const timeKey =
    options?.timeKey ??
    canonicalTimeKeys.find((k) => numericKeys.includes(k)) ??
    prefer.find((p) => numericKeys.some((k) => k.toLowerCase() === p)) ??
    numericKeys.find((k) => k.toLowerCase().includes("time")) ??
    numericKeys[0] ??
    keysAll[0] ??
    "t";

  const keys = numericKeys.filter((k) => k !== timeKey);

  return {
    file,
    fileName: file.name,
    delimiter: options?.delimiter,
    timeKey,
    numericKeys,
    keys,
    stringKeys,
  };
}

export async function loadCsvColumns({
  file,
  delimiter,
  timeKey,
  keys,
  onProgress,
  shouldAbort,
}: {
  file: File;
  delimiter?: string;
  timeKey: string;
  keys: string[];
  onProgress?: (progress: number) => void;
  shouldAbort?: () => boolean;
}): Promise<{ time: number[]; columns: Record<string, number[]>; rowCount: number }> {
  const headerRow = await new Promise<string[]>((resolve, reject) => {
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: "greedy",
      delimiter,
      dynamicTyping: false,
      preview: 1,
      worker: true,
      complete: (res) => resolve((res.data?.[0] as string[]) ?? []),
      error: reject,
    });
  });

  const index = new Map<string, number>();
  for (let i = 0; i < headerRow.length; i += 1) index.set(headerRow[i] ?? "", i);

  const selected = Array.from(new Set([timeKey, ...keys]));
  const selectedIdx = selected
    .map((k) => ({ k, i: index.get(k) }))
    .filter((x): x is { k: string; i: number } => typeof x.i === "number");

  const columns: Record<string, number[]> = {};
  for (const k of selected) columns[k] = [];

  let rowCount = 0;

  await new Promise<void>((resolve, reject) => {
    let skippedHeader = false;
    let aborted = false;
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: "greedy",
      delimiter,
      dynamicTyping: false,
      worker: true,
      chunkSize: 1024 * 1024 * 2,
      chunk: (chunk, parser) => {
        if (shouldAbort?.()) {
          aborted = true;
          parser.abort();
          return;
        }
        if (typeof chunk.meta?.cursor === "number") {
          onProgress?.(Math.min(1, Math.max(0, chunk.meta.cursor / file.size)));
        }

        const rows = chunk.data as string[][];
        for (const row of rows) {
          if (!skippedHeader) {
            skippedHeader = true;
            const isHeader =
              row.length === headerRow.length &&
              row.every((v, i) => String(v ?? "") === String(headerRow[i] ?? ""));
            if (isHeader) continue;
          }

          rowCount += 1;
          for (const { k, i } of selectedIdx) {
            const v = safeNumber(row[i]);
            columns[k]!.push(v ?? NaN);
          }
        }
      },
      complete: () => {
        if (aborted) reject(new Error("aborted"));
        else resolve();
      },
      error: (e) => reject(e),
    });
  });

  const time = deriveTime(columns[timeKey] ?? []);
  columns[timeKey] = time;

  const outCols: Record<string, number[]> = {};
  for (const k of keys) outCols[k] = columns[k] ?? [];

  return { time, columns: outCols, rowCount };
}

export async function loadCsvCategoricals({
  file,
  delimiter,
  keys,
  onProgress,
  shouldAbort,
}: {
  file: File;
  delimiter?: string;
  keys: string[];
  onProgress?: (progress: number) => void;
  shouldAbort?: () => boolean;
}): Promise<{ rowCount: number; columns: Record<string, CategoricalColumn> }> {
  const headerRow = await new Promise<string[]>((resolve, reject) => {
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: "greedy",
      delimiter,
      dynamicTyping: false,
      preview: 1,
      worker: true,
      complete: (res) => resolve((res.data?.[0] as string[]) ?? []),
      error: reject,
    });
  });

  const index = new Map<string, number>();
  for (let i = 0; i < headerRow.length; i += 1) index.set(headerRow[i] ?? "", i);

  const selectedIdx = keys
    .map((k) => ({ k, i: index.get(k) }))
    .filter((x): x is { k: string; i: number } => typeof x.i === "number");

  const dicts: Record<string, string[]> = {};
  const maps: Record<string, Map<string, number>> = {};
  const ids: Record<string, number[]> = {};
  for (const { k } of selectedIdx) {
    dicts[k] = [];
    maps[k] = new Map<string, number>();
    ids[k] = [];
  }

  let rowCount = 0;

  await new Promise<void>((resolve, reject) => {
    let skippedHeader = false;
    let aborted = false;
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: "greedy",
      delimiter,
      dynamicTyping: false,
      worker: true,
      chunkSize: 1024 * 1024 * 2,
      chunk: (chunk, parser) => {
        if (shouldAbort?.()) {
          aborted = true;
          parser.abort();
          return;
        }
        if (typeof chunk.meta?.cursor === "number") {
          onProgress?.(Math.min(1, Math.max(0, chunk.meta.cursor / file.size)));
        }

        const rows = chunk.data as string[][];
        for (const row of rows) {
          if (!skippedHeader) {
            skippedHeader = true;
            const isHeader =
              row.length === headerRow.length &&
              row.every((v, i) => String(v ?? "") === String(headerRow[i] ?? ""));
            if (isHeader) continue;
          }

          rowCount += 1;
          for (const { k, i } of selectedIdx) {
            const raw = row[i];
            const s = raw === undefined || raw === null ? "" : String(raw);
            const m = maps[k]!;
            let id = m.get(s);
            if (id === undefined) {
              id = dicts[k]!.length;
              dicts[k]!.push(s);
              m.set(s, id);
            }
            ids[k]!.push(id);
          }
        }
      },
      complete: () => {
        if (aborted) reject(new Error("aborted"));
        else resolve();
      },
      error: (e) => reject(e),
    });
  });

  const out: Record<string, CategoricalColumn> = {};
  for (const { k } of selectedIdx) {
    out[k] = {
      dict: dicts[k] ?? [],
      ids: Uint32Array.from(ids[k] ?? []),
    };
  }

  return { rowCount, columns: out };
}
