import type { ModelEntry, VendorId } from "../models/catalog";

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Interleave by vendor so one provider (e.g. Anthropic) never appears as a single contiguous block
 * in the default list order. Vendors are shuffled per seed, then round-robin.
 */
export function interleaveByVendor(catalog: ModelEntry[], seed: number): ModelEntry[] {
  const rand = mulberry32(seed);
  const byVendor = new Map<VendorId, ModelEntry[]>();
  for (const m of catalog) {
    const list = byVendor.get(m.vendor) ?? [];
    list.push(m);
    byVendor.set(m.vendor, list);
  }
  for (const list of byVendor.values()) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [list[i], list[j]] = [list[j]!, list[i]!];
    }
  }
  const vendorOrder = [...byVendor.keys()];
  for (let i = vendorOrder.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [vendorOrder[i], vendorOrder[j]] = [vendorOrder[j]!, vendorOrder[i]!];
  }
  const out: ModelEntry[] = [];
  let max = 0;
  for (const v of vendorOrder) {
    max = Math.max(max, byVendor.get(v)?.length ?? 0);
  }
  for (let r = 0; r < max; r++) {
    for (const v of vendorOrder) {
      const row = byVendor.get(v);
      const m = row?.[r];
      if (m) out.push(m);
    }
  }
  return out;
}

export function pickRandomPair(
  catalog: ModelEntry[],
  seed: number,
  round: number
): [ModelEntry, ModelEntry] {
  const rand = mulberry32(seed * 1_000_003 + round * 17);
  const a = Math.floor(rand() * catalog.length);
  let b = Math.floor(rand() * (catalog.length - 1));
  if (b >= a) b += 1;
  return [catalog[a]!, catalog[b]!];
}

/** Deterministic scenario / item shuffle for a session seed. */
export function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  const rand = mulberry32(seed);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}
