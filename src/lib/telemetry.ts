export type EventBase = {
  t: string;
  type: string;
  payload: Record<string, unknown>;
};

export type SessionRecord = {
  schemaVersion: 1;
  sessionId: string;
  appVersion: string;
  createdAt: string;
  userAgent: string;
  language: string;
  seed: number;
  events: EventBase[];
  notes: string;
};

const STORAGE_KEY = "model-coworker-lab-sessions";
const APP_VERSION = "1.1.0";

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadAll(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as SessionRecord[];
  } catch {
    return [];
  }
}

function saveAll(rows: SessionRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows, null, 0));
}

export function createSession(seed: number, notes: string): SessionRecord {
  return {
    schemaVersion: 1,
    sessionId: newId(),
    appVersion: APP_VERSION,
    createdAt: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    language: typeof navigator !== "undefined" ? navigator.language : "",
    seed,
    events: [],
    notes,
  };
}

export function appendEvent(
  session: SessionRecord,
  type: string,
  payload: Record<string, unknown>
): SessionRecord {
  const e: EventBase = { t: new Date().toISOString(), type, payload };
  return { ...session, events: [...session.events, e] };
}

export function persistSession(session: SessionRecord) {
  const all = loadAll();
  const i = all.findIndex((s) => s.sessionId === session.sessionId);
  if (i >= 0) all[i] = session;
  else all.push(session);
  saveAll(all);
}

export function listSessions(): SessionRecord[] {
  return loadAll();
}

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJsonl(sessions: SessionRecord[], filename: string) {
  const lines = sessions.map((s) => JSON.stringify(s));
  const blob = new Blob([lines.join("\n") + "\n"], { type: "application/x-ndjson" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getAppVersion() {
  return APP_VERSION;
}
