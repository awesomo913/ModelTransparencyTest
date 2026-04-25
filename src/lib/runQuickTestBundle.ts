import { CATALOG } from "../models/catalog";
import { interleaveByVendor } from "./shuffle";
import { SAMPLE_PRIMARY_ID, SAMPLE_SECONDARY_ID } from "./quickDefaults";
import type { SessionRecord } from "./telemetry";
import { appendHeadToHeadDemo } from "./runHeadToHeadDemo";
import { appendGeminiDemo } from "./runGeminiDemo";

/**
 * One-click: appends the same data you would get from filling all three areas with “sample” choices.
 * Safe to run multiple times (adds more events to the same session log).
 */
export function appendFullQuickTest(
  session: SessionRecord,
  onAppend: (type: string, payload: Record<string, unknown>) => void
) {
  const ordered = interleaveByVendor(CATALOG, session.seed);
  const q = "";
  onAppend("coworker_search", {
    query: q,
    resultCount: CATALOG.length,
    searchCommitIndex: 1,
    source: "demo_autorun",
  });
  onAppend("coworker_submit", {
    primaryId: SAMPLE_PRIMARY_ID,
    secondaryId: SAMPLE_SECONDARY_ID,
    searchQuery: q,
    searchCommitCount: 1,
    msToSubmit: 0,
    visibleCountAtSubmit: CATALOG.length,
    listOrderIds: ordered.map((m) => m.id),
    source: "demo_autorun",
  });

  appendHeadToHeadDemo(session, onAppend);
  appendGeminiDemo(session, onAppend);

  onAppend("quick_test_bundle_done", { at: new Date().toISOString() });
}
