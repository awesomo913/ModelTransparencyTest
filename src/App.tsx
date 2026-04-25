import { useCallback, useEffect, useRef, useState } from "react";
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
import { appendFullQuickTest } from "./lib/runQuickTestBundle";

type Tab = "a" | "b" | "c";

function readSeed() {
  const p = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const s = p.get("seed");
  if (s === null) return Math.floor(Math.random() * 1_000_000_000);
  const n = Number(s);
  return Number.isFinite(n) ? Math.floor(n) : 0;
}

export function App() {
  const initialSeed = useRef(readSeed());
  const [seed, setSeed] = useState(() => initialSeed.current);
  const [tab, setTab] = useState<Tab>("a");
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const booted = useRef(false);

  const append = useCallback((type: string, payload: Record<string, unknown>) => {
    setSession((prev) => {
      if (!prev) return null;
      const n = appendEvent(prev, type, payload);
      persistSession(n);
      return n;
    });
  }, []);

  /** One-time auto start: no “open session” step. */
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const s0 = initialSeed.current;
    const s = createSession(s0, "auto");
    const s2 = appendEvent(s, "session_start", { seed: s0, catalogSize: CATALOG.length });
    setSession(s2);
    persistSession(s2);
  }, []);

  useEffect(() => {
    if (!window.location.search.includes("seed=")) {
      const u = new URL(window.location.href);
      u.searchParams.set("seed", String(seed));
      window.history.replaceState({}, "", u.toString());
    }
  }, [seed]);

  const startFreshSession = useCallback(() => {
    const nextSeed = Math.floor(Math.random() * 1_000_000_000);
    setSeed(nextSeed);
    const s = createSession(nextSeed, "auto");
    const s2 = appendEvent(s, "session_start", { seed: nextSeed, catalogSize: CATALOG.length });
    setSession(s2);
    persistSession(s2);
    setTab("a");
  }, []);

  const loadSampleBundle = useCallback(() => {
    if (!session) return;
    appendFullQuickTest(session, append);
    alert(
      "Sample data was added to your log (directory + pairwise + Gemini). Use Export to download JSON if you want a file."
    );
  }, [session, append]);

  const exportAll = () => {
    const all = listSessions();
    if (all.length === 0) {
      alert("Nothing saved yet.");
      return;
    }
    downloadJsonl(all, `workspace-routing-export-${Date.now()}.jsonl`);
  };

  const exportCurrent = () => {
    if (!session) return;
    downloadJson(session, `workspace-routing-session-${session.sessionId}.json`);
  };

  return (
    <div className="app">
      <header className="header simple">
        <div>
          <h1>Code review</h1>
          <p className="sub">
            In-browser only; nothing is sent to a model. v{getAppVersion()}
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn" onClick={exportCurrent}>
            Download this session
          </button>
          <button type="button" className="btn secondary" onClick={exportAll}>
            Download all
          </button>
          <button type="button" className="btn secondary" onClick={startFreshSession}>
            New session
          </button>
          <button
            type="button"
            className="btn text"
            onClick={() => setShowDetails((v) => !v)}
          >
            {showDetails ? "Hide options" : "Options"}
          </button>
          <LocalPreviewHelp />
        </div>
      </header>

      {showDetails && (
        <div className="details-bar">
          <label className="inline">
            Seed (order of lists){" "}
            <input
              className="input short"
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value) || 0)}
            />
          </label>
          <span className="mono small">{session?.sessionId.slice(0, 8)}…</span>
          {session && (
            <button type="button" className="btn secondary" onClick={loadSampleBundle}>
              Append demo events (all tabs)
            </button>
          )}
        </div>
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
              1 · PR review
            </button>
            <button
              type="button"
              className={tab === "b" ? "tab active" : "tab"}
              onClick={() => setTab("b")}
              role="tab"
              aria-selected={tab === "b"}
            >
              2 · Compare two
            </button>
            <button
              type="button"
              className={tab === "c" ? "tab active" : "tab"}
              onClick={() => setTab("c")}
              role="tab"
              aria-selected={tab === "c"}
            >
              3 · Gemini rubric
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
        <p className="footer-lead">Preview only. Export JSON for your own records.</p>
      </footer>
    </div>
  );
}
