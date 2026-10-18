import { randomUUID } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { COMPONENT_NAMES, type DesignNode, type ValidationResult } from "@dtc/design-rules";

/** What the Design Guard plug-in POSTs to the bridge. */
export interface DesignExport {
  fileName: string;
  page: string;
  exportedAt: string;
  nodes: DesignNode[];
  validation: ValidationResult;
  /** Base64 PNG of the exported selection (optionally a data: URL). */
  screenshot?: string;
}

export interface StoredExport extends DesignExport {
  id: string;
  receivedAt: string;
}

// dist/index.js lives at <repo>/packages/mcp-server/dist, so the repo root is three levels up.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
export const EXPORT_DIR = process.env.DTC_EXPORT_DIR
  ? resolve(process.env.DTC_EXPORT_DIR)
  : join(REPO_ROOT, ".design-exports");

const ID_PATTERN = /^[A-Za-z0-9-]+$/;

export function newExportId(): string {
  // Time-sortable prefix keeps `ls` and list_figma_exports in chronological order.
  return `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
}

export function saveExport(exp: StoredExport): void {
  mkdirSync(EXPORT_DIR, { recursive: true });
  writeFileSync(join(EXPORT_DIR, `${exp.id}.json`), JSON.stringify(exp, null, 2));
}

export function listExports(): Array<Pick<StoredExport, "id" | "fileName" | "page" | "exportedAt" | "receivedAt"> & {
  nodeCount: number;
  passed: boolean;
}> {
  let files: string[];
  try {
    files = readdirSync(EXPORT_DIR).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  return files
    .map((f) => {
      try {
        const e = JSON.parse(readFileSync(join(EXPORT_DIR, f), "utf8")) as StoredExport;
        const id = e.id ?? f.replace(/\.json$/, "");
        return {
          id,
          fileName: e.fileName,
          page: e.page,
          exportedAt: e.exportedAt,
          receivedAt: e.receivedAt ?? statSync(join(EXPORT_DIR, f)).mtime.toISOString(),
          nodeCount: e.nodes?.length ?? 0,
          passed: e.validation?.passed ?? false,
        };
      } catch {
        return undefined;
      }
    })
    .filter((e): e is NonNullable<typeof e> => !!e)
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

/** Load an export by id, or the most recent one for "latest". */
export function loadExport(id: string): StoredExport | undefined {
  const target = id === "latest" ? listExports()[0]?.id : id;
  if (!target || !ID_PATTERN.test(target)) return undefined;
  try {
    return JSON.parse(readFileSync(join(EXPORT_DIR, `${target}.json`), "utf8")) as StoredExport;
  } catch {
    return undefined;
  }
}

/** Library components (by Figma name) used anywhere in the node tree, with instance counts. */
export function componentsUsed(nodes: DesignNode[]): Record<string, number> {
  const counts: Record<string, number> = {};
  const library = new Set(COMPONENT_NAMES);
  const visit = (n: DesignNode) => {
    if (n.type === "INSTANCE" || n.type === "COMPONENT") {
      const base = (n.componentName ?? n.name).split(/[/,=\s]/)[0];
      if (library.has(base)) counts[base] = (counts[base] ?? 0) + 1;
    }
    n.children?.forEach(visit);
  };
  nodes.forEach(visit);
  return counts;
}
