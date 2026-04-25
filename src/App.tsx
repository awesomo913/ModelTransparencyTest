import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { CATALOG } from "./models/catalog";
import { CoworkerTest } from "./components/CoworkerTest";
import { HeadToHeadTest } from "./components/HeadToHeadTest";
import { LocalPreviewHelp } from "./components/LocalPreviewHelp";
import { GeminiAgentTest } from "./components/GeminiAgentTest";
import { ListOrderModal } from "./components/ListOrderModal";
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
import {
  buildOrderedCatalog,
  loadStoredCustomOrder,
  saveStoredCustomOrder,
  type ListOrderMode,
} from "./lib/listOrder";

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
  const [showDetails, setShowDetails] = useState(false);
  const [listOrderOpen, setListOrderOpen] = useState(false);
  const [customOrderIds, setCustomOrderIds] = useState<string[] | null>(null);
  const [lastListOrderInvalid, setLastListOrderInvalid] = useState<string[]>([]);
  const [listRevision, setListRevision] = useState(0);

  const [session, setSession] = useState<SessionRecord | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const s0 = initialSeed.current;
      const s = createSession(s0, "auto");
      const s2 = appendEvent(s, "session_start", { seed: s0, catalogSize: CATALOG.length });
      try {
        persistSession(s2);
      } catch {
        // Storage may be blocked; in-memory session still works
      }
      return s2;
    } catch (e) {
      console.error("ModelTransparencyTester: session init failed", e);
      return null;
    }
  });

  const append = useCallback((type: string, payload: Record<string, unknown>) => {
    setSession((prev) => {
      if (!prev) return null;
      const n = appendEvent(prev, type, payload);
      persistSession(n);
      return n;
    });
  }, []);

  const listBundle = useMemo(
    () => buildOrderedCatalog(CATALOG, seed, customOrderIds),
    [seed, customOrderIds]
  );

  useEffect(() => {
    if (!session) return;
    setCustomOrderIds(loadStoredCustomOrder(session.sessionId));
    setLastListOrderInvalid([]);
    setListRevision((r) => r + 1);
  }, [session.sessionId]);

  useEffect(() => {
    if (!window.location.search.includes("seed=")) {
      const u = new URL(window.location.href);
      u.searchParams.set("seed", String(seed));
      window.history.replaceState({}, "", u.toString());
    }
  }, [seed]);

  const setSeedAndSession = useCallback((n: number) => {
    setSeed(n);
    setSession((prev) => {
      if (!prev) return null;
      const next = { ...prev, seed: n };
      persistSession(next);
      return next;
    });
    const u = new URL(window.location.href);
    u.searchParams.set("seed", String(n));
    window.history.replaceState({}, "", u.toString());
    setListRevision((r) => r + 1);
  }, []);

  const applyListOrder = useCallback(
    (mode: ListOrderMode, ids: string[] | null) => {
      if (!session) return;
      const nextIds = mode === "interleave" || !ids?.length ? null : ids;
      setCustomOrderIds(nextIds);
      saveStoredCustomOrder(session.sessionId, nextIds);
      const res = buildOrderedCatalog(CATALOG, seed, nextIds);
      setLastListOrderInvalid(res.invalidCustomIds);
      append("coworker_list_order", {
        orderMode: res.orderMode,
        listOrderIds: res.ordered.map((m) => m.id),
        invalidCustomIds: res.invalidCustomIds,
        seed,
      });
      setListRevision((r) => r + 1);
    },
    [session, seed, append]
  );

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
    downloadJsonl(all, `model-transparency-tester-sessions-${Date.now()}.jsonl`);
  };

  const exportCurrent = () => {
    if (!session) return;
    downloadJson(session, `model-transparency-tester-${session.sessionId}.json`);
  };

  const onVersionContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    setListOrderOpen(true);
  };

  return (
    <div className="app">
      <header className="header simple">
        <div>
          <h1>ModelTransparencyTester</h1>
          <p className="sub">
            Log how people pick models (order, search, time)—all local, no model APIs.{" "}
            <span
              className="mtt-build"
              onContextMenu={onVersionContextMenu}
              title=""
              aria-hidden="true"
            >
              v{getAppVersion()}
            </span>
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
              onChange={(e) => setSeedAndSession(Number(e.target.value) || 0)}
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

      <ListOrderModal
        open={listOrderOpen}
        onClose={() => setListOrderOpen(false)}
        orderMode={listBundle.orderMode}
        customIdsText={customOrderIds?.join("\n") ?? ""}
        lastInvalid={lastListOrderInvalid}
        onApply={(mode, ids) => applyListOrder(mode, ids)}
      />

      {!session && (
        <div className="app-error" role="alert">
          <p>
            Could not start a session. Enable JavaScript and try refreshing. If local storage is
            blocked, allow it for this origin or the app may not save exports.
          </p>
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
              key={`${session.sessionId}-${listRevision}`}
              session={session}
              onAppend={append}
              ordered={listBundle.ordered}
              orderMode={listBundle.orderMode}
              listSeed={seed}
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
          ModelTransparencyTester does not call providers. Export JSON/JSONL for your own
          analysis.
        </p>
      </footer>
    </div>
  );
}
