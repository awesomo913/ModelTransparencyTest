import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CATALOG, VENDOR_LABEL, type ModelEntry } from "../models/catalog";
import { interleaveByVendor } from "../lib/shuffle";
import { getAppVersion, type SessionRecord } from "../lib/telemetry";

type Props = {
  session: SessionRecord;
  onAppend: (type: string, payload: Record<string, unknown>) => void;
};

function matchesQuery(m: ModelEntry, q: string) {
  if (!q.trim()) return true;
  const s = q.toLowerCase();
  return (
    m.displayName.toLowerCase().includes(s) ||
    m.id.toLowerCase().includes(s) ||
    m.searchBlob.toLowerCase().includes(s) ||
    VENDOR_LABEL[m.vendor].toLowerCase().includes(s)
  );
}

export function CoworkerTest({ session, onAppend }: Props) {
  const ordered = useMemo(
    () => interleaveByVendor(CATALOG, session.seed),
    [session.seed]
  );
  const [query, setQuery] = useState("");
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [secondaryId, setSecondaryId] = useState<string | null>(null);
  const [started] = useState(() => performance.now());
  const [searchCommitCount, setSearchCommitCount] = useState(0);
  const lastLoggedQuery = useRef<string | null>(null);
  const mountLogged = useRef(false);

  const filtered = useMemo(
    () => ordered.filter((m) => matchesQuery(m, query)),
    [ordered, query]
  );

  useEffect(() => {
    const key = `wsr-mount-${session.sessionId}-coworker`;
    if (mountLogged.current || sessionStorage.getItem(key)) return;
    mountLogged.current = true;
    sessionStorage.setItem(key, "1");
    onAppend("coworker_mount", {
      test: "coworker",
      appVersion: getAppVersion(),
      listOrderIds: ordered.map((m) => m.id),
    });
  }, [onAppend, ordered, session.sessionId]);

  const commitSearchLog = useCallback(
    (q: string) => {
      if (lastLoggedQuery.current === q) return;
      lastLoggedQuery.current = q;
      setSearchCommitCount((c) => {
        const next = c + 1;
        onAppend("coworker_search", {
          query: q,
          resultCount: ordered.filter((m) => matchesQuery(m, q)).length,
          searchCommitIndex: next,
        });
        return next;
      });
    },
    [onAppend, ordered]
  );

  const commit = () => {
    if (!primaryId) return;
    const elapsed = Math.round(performance.now() - started);
    onAppend("coworker_submit", {
      primaryId,
      secondaryId,
      searchQuery: query,
      searchCommitCount,
      msToSubmit: elapsed,
      visibleCountAtSubmit: filtered.length,
      listOrderIds: ordered.map((m) => m.id),
    });
    onAppend("cohort", { test: "coworker", primaryId, secondaryId });
    alert("Saved to this browser’s workspace log. Use Export in the header to download JSON.");
  };

  const togglePrimary = (id: string) => {
    setPrimaryId((p) => (p === id ? null : id));
  };
  const toggleSecondary = (id: string) => {
    if (id === primaryId) return;
    setSecondaryId((s) => (s === id ? null : id));
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Model directory</h2>
        <p className="hint">
          Providers are <strong>interleaved in the grid</strong> so similar lines aren’t grouped as
          one wall of cards. Use search to narrow the directory; committed searches and submit timing
          are recorded for the policy log.
        </p>
      </div>

      <div className="scenario">
        <strong>Scenario:</strong> Long-lived repository work—services, migrations, correctness,
        review discipline. Select a <em>primary</em> model and an optional <em>secondary</em> (e.g.
        backup style or different strength).
      </div>

      <div className="toolbar">
        <label className="grow">
          <span className="label">Search</span>
          <input
            className="input"
            value={query}
            placeholder="Name, vendor, or keyword (e.g. codex, claude, flash, router)…"
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => commitSearchLog(query)}
          />
        </label>
        <button
          type="button"
          className="btn secondary"
          onClick={() => {
            setQuery("");
            commitSearchLog("");
          }}
        >
          Clear search
        </button>
      </div>

      <p className="meta">
        Showing {filtered.length} of {ordered.length} · search steps committed: {searchCommitCount}
      </p>

      <div className="grid">
        {filtered.map((m) => {
          const isP = primaryId === m.id;
          const isS = secondaryId === m.id;
          return (
            <div key={m.id} className={`card ${isP ? "primary" : ""} ${isS ? "secondary" : ""}`}>
              <div className="card-top">
                <span className="pill vendor">{VENDOR_LABEL[m.vendor]}</span>
                <span className="mono small">{m.id}</span>
              </div>
              <div className="card-title">{m.displayName}</div>
              <div className="card-actions">
                <button
                  type="button"
                  className={isP ? "btn sm active" : "btn sm secondary"}
                  onClick={() => togglePrimary(m.id)}
                >
                  {isP ? "Primary ✓" : "Set primary"}
                </button>
                <button
                  type="button"
                  className={isS ? "btn sm active-alt" : "btn sm secondary"}
                  onClick={() => toggleSecondary(m.id)}
                  disabled={isP}
                >
                  {isS ? "Secondary ✓" : "Set secondary"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="footer-actions">
        <button type="button" className="btn" onClick={commit} disabled={!primaryId}>
          Save policy choice
        </button>
        {!primaryId && <span className="warn">Select a primary model first.</span>}
      </div>
    </div>
  );
}
