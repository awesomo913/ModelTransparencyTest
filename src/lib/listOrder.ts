import type { ModelEntry } from "../models/catalog";
import { interleaveByVendor } from "./shuffle";

export type ListOrderMode = "interleave" | "custom";

export type BuildOrderedResult = {
  ordered: ModelEntry[];
  orderMode: ListOrderMode;
  /** Custom ids that are not in the catalog (skipped) */
  invalidCustomIds: string[];
};

const catalogIdSet = (catalog: ModelEntry[]) => new Set(catalog.map((m) => m.id));

/**
 * @param customIds - When null or empty, uses seed + interleave. When set, uses that id order
 * first, then appends any remaining catalog entries in default catalog order.
 */
export function buildOrderedCatalog(
  catalog: ModelEntry[],
  seed: number,
  customIds: string[] | null
): BuildOrderedResult {
  if (customIds == null || customIds.length === 0) {
    return {
      ordered: interleaveByVendor(catalog, seed),
      orderMode: "interleave",
      invalidCustomIds: [],
    };
  }
  const valid = catalogIdSet(catalog);
  const seen = new Set<string>();
  const ordered: ModelEntry[] = [];
  const invalidCustomIds: string[] = [];
  for (const raw of customIds) {
    const id = raw.trim();
    if (!id) continue;
    if (!valid.has(id)) {
      invalidCustomIds.push(id);
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    const m = catalog.find((c) => c.id === id);
    if (m) ordered.push(m);
  }
  for (const m of catalog) {
    if (!seen.has(m.id)) ordered.push(m);
  }
  return { ordered, orderMode: "custom", invalidCustomIds };
}

/** Parse textarea: one id per line, or comma-separated. */
export function parseIdList(input: string): string[] {
  const lines: string[] = [];
  for (const line of input.split(/\r?\n/)) {
    if (line.includes(",")) {
      for (const part of line.split(",")) {
        const t = part.trim();
        if (t) lines.push(t);
      }
    } else {
      const t = line.trim();
      if (t) lines.push(t);
    }
  }
  return lines;
}

export function loadStoredCustomOrder(sessionId: string): string[] | null {
  try {
    const k = `mtt-list-order-${sessionId}`;
    const raw = localStorage.getItem(k);
    if (raw == null) return null;
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return null;
    return p.filter((x): x is string => typeof x === "string");
  } catch {
    return null;
  }
}

export function saveStoredCustomOrder(sessionId: string, ids: string[] | null) {
  try {
    const k = `mtt-list-order-${sessionId}`;
    if (ids == null || ids.length === 0) {
      localStorage.removeItem(k);
    } else {
      localStorage.setItem(k, JSON.stringify(ids));
    }
  } catch (e) {
    console.warn("ModelTransparencyTester: could not save list order to localStorage", e);
  }
}
