/** Persist Gemini wizard UI state so tab switches do not lose progress. */

export type GeminiDraftV1 = {
  v: 1;
  phase: "config" | "run" | "review";
  ord: number;
  modelId: string;
  surface: string;
  toolScope: Record<string, boolean>; // ToolScopeId keys when saved from UI
  scores: Record<string, Record<string, number>>;
  notes: Record<string, string>;
  overallConfidence: number;
  overallNotes: string;
};

const prefix = "wsr-gemini-draft-";

export function draftKey(sessionId: string) {
  return `${prefix}${sessionId}`;
}

export function loadGeminiDraft(sessionId: string): GeminiDraftV1 | null {
  try {
    const raw = sessionStorage.getItem(draftKey(sessionId));
    if (!raw) return null;
    const p = JSON.parse(raw) as unknown;
    if (!p || typeof p !== "object" || (p as GeminiDraftV1).v !== 1) return null;
    return p as GeminiDraftV1;
  } catch {
    return null;
  }
}

export function saveGeminiDraft(sessionId: string, draft: GeminiDraftV1) {
  try {
    sessionStorage.setItem(draftKey(sessionId), JSON.stringify(draft));
  } catch {
    /* quota */
  }
}

export function clearGeminiDraft(sessionId: string) {
  try {
    sessionStorage.removeItem(draftKey(sessionId));
  } catch {
    /* ignore */
  }
}
