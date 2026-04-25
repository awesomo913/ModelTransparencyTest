import { useCallback, useEffect, useState } from "react";
import { CATALOG } from "./models/catalog";
import { CoworkerTest } from "./components/CoworkerTest";
import { HeadToHeadTest } from "./components/HeadToHeadTest";
import { LocalPreviewHelp } from "./components/LocalPreviewHelp";
import { GeminiAgentTest } from "./components/GeminiAgentTest";
import {
  appendEvent,
  createSession,
  downloadJson,
  downloadJsonl,
  getAppVersion,
  listSessions,
  persistSession,
  type SessionRecord,
} from "./lib/telemetry";

type Tab = "a" | "b" | "c";

function readSeed() {
  const p = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const s = p.get("seed");
  if (s === null) return Math.floor(Math.random() * 1_000_000_000);
  const n = Number(s);
  return Number.isFinite(n) ? Math.floor(n) : 0;
}

export function App() {
  const [seed, setSeed] = useState(readSeed);
  const [tab, setTab] = useState<Tab>("a");
  const [notes, setNotes] = useState("");
  const [session, setSession] = useState<SessionRecord | null>(null);

  const startSession = useCallback(() => {
    const s = createSession(seed, notes.trim() || "default");
    const s2 = appendEvent(s, "session_start", { seed, catalogSize: CATALOG.length });
    setSession(s2);
    persistSession(s2);
  }, [seed, notes]);

  const append = useCallback((type: string, payload: Record<string, unknown>) => {
    setSession((prev) => {
      if (!prev) return null;
      const n = appendEvent(prev, type, payload);
      persistSession(n);
      return n;
    });
  }, []);

  useEffect(() => {
    if (!window.location.search.includes("seed=")) {
      const u = new URL(window.location.href);
      u.searchParams.set("seed", String(seed));
      window.history.replaceState({}, "", u.toString());
    }
  }, [seed]);

  const exportAll = () => {
    const all = listSessions();
    if (all.length === 0) {
      alert("No saved workspace sessions yet. Open a work session and save selections first.");
      return;
    }
    downloadJsonl(all, `workspace-routing-export-${Date.now()}.jsonl`);
  };

  const exportCurrent = () => {
    if (!session) {
      alert("Open a work session first.");
      return;
    }
    downloadJson(session, `workspace-routing-session-${session.sessionId}.json`);
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Workspace model routing</h1>
          <p className="sub">
            Policy UI for primary / backup model selection (preview). Runs entirely in the
            browser—no live API calls. v{getAppVersion()} · {CATALOG.length} models in directory
          </p>
        </div>
        <div className="header-actions">
          <LocalPreviewHelp />
          <label className="inline">
            Display seed{" "}
            <input
              className="input short"
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value) || 0)}
              title="Stabilizes list order for the same policy review or screenshots."
            />
          </label>
          <input
            className="input mid"
            placeholder="Label (org, team, or ticket)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {!session ? (
            <button type="button" className="btn" onClick={startSession}>
              Open work session
            </button>
          ) : (
            <>
              <span className="mono small" title="Session id">
                {session.sessionId.slice(0, 8)}…
              </span>
              <button type="button" className="btn secondary" onClick={exportCurrent}>
                Export session
              </button>
            </>
          )}
          <button type="button" className="btn secondary" onClick={exportAll}>
            Export all
          </button>
        </div>
      </header>

      {!session && (
        <p className="banner">
          Optional display seed and label, then <strong>Open work session</strong>. Use{" "}
          <strong>Directory</strong> to search and set models; <strong>Pairwise</strong> for A/B;{" "}
          <strong>Gemini agent</strong> for a structured multi-scenario rubric (wizard auto-saves to{" "}
          <code>sessionStorage</code> on tab switch). Exports write full sessions to{" "}
          <code>localStorage</code>. Directory and Pairwise do not persist across tab switches until
          you export.
        </p>
      )}

      {session && (
        <>
          <nav className="tabs" role="tablist">
            <button
              type="button"
              className={tab === "a" ? "tab active" : "tab"}
              onClick={() => setTab("a")}
              role="tab"
              aria-selected={tab === "a"}
            >
              Directory
            </button>
            <button
              type="button"
              className={tab === "b" ? "tab active" : "tab"}
              onClick={() => setTab("b")}
              role="tab"
              aria-selected={tab === "b"}
            >
              Pairwise
            </button>
            <button
              type="button"
              className={tab === "c" ? "tab active" : "tab"}
              onClick={() => setTab("c")}
              role="tab"
              aria-selected={tab === "c"}
            >
              Gemini agent
            </button>
          </nav>

          {tab === "a" && (
            <CoworkerTest
              key={session.sessionId}
              session={session}
              onAppend={append}
            />
          )}
          {tab === "b" && (
            <HeadToHeadTest
              key={session.sessionId}
              session={session}
              onAppend={append}
            />
          )}
          {tab === "c" && (
            <GeminiAgentTest
              key={session.sessionId}
              session={session}
              onAppend={append}
            />
          )}
        </>
      )}

      <footer className="footer">
        <p className="footer-lead">
          Internal routing preview. Exports are for policy review, integration, or compliance
          handoff—not live enforcement.
        </p>
      </footer>
    </div>
  );
}
