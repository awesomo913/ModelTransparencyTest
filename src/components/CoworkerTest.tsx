import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CATALOG, VENDOR_LABEL, type ModelEntry } from "../models/catalog";
import { interleaveByVendor } from "../lib/shuffle";
import { getAppVersion, type SessionRecord } from "../lib/telemetry";
import { MOCK_REVIEW } from "../data/mockCodeReview";
import { CopilotSparkIcon } from "./CopilotSparkIcon";

type Props = {
  session: SessionRecord;
  onAppend: (type: string, payload: Record<string, unknown>) => void;
  defaultPrimaryId?: string;
  defaultSecondaryId?: string | null;
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

export function CoworkerTest({
  session,
  onAppend,
  defaultPrimaryId,
  defaultSecondaryId,
}: Props) {
  const ordered = useMemo(
    () => interleaveByVendor(CATALOG, session.seed),
    [session.seed]
  );
  const [query, setQuery] = useState("");
  const [primaryId, setPrimaryId] = useState<string | null>(defaultPrimaryId ?? null);
  const [secondaryId, setSecondaryId] = useState<string | null>(defaultSecondaryId ?? null);
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
    alert("Saved. Use Download this session in the header for a file.");
  };

  const togglePrimary = (id: string) => {
    setPrimaryId((p) => (p === id ? null : id));
  };
  const toggleSecondary = (id: string) => {
    if (id === primaryId) return;
    setSecondaryId((s) => (s === id ? null : id));
  };

  return (
    <div className="panel review-shell">
      <div className="review-workspace">
        <section className="review-pr" aria-label="Pull request">
          <header className="review-pr-head">
            <div className="review-pr-badge">
              <span className="mono small">
                {MOCK_REVIEW.org}/{MOCK_REVIEW.repo}
              </span>
              <span className="review-pr-num">#{MOCK_REVIEW.prNumber}</span>
            </div>
            <h2 className="review-pr-title">{MOCK_REVIEW.title}</h2>
            <p className="review-pr-meta muted small">
              {MOCK_REVIEW.author} wants to merge{" "}
              <code>{MOCK_REVIEW.branch}</code> into <code>{MOCK_REVIEW.base}</code>
            </p>
            <dl className="review-stats">
              <div>
                <dt>Files</dt>
                <dd>{MOCK_REVIEW.filesChanged}</dd>
              </div>
              <div>
                <dt>+ / −</dt>
                <dd>
                  <span className="stat-add">+{MOCK_REVIEW.additions}</span>{" "}
                  <span className="stat-del">−{MOCK_REVIEW.deletions}</span>
                </dd>
              </div>
            </dl>
          </header>
          <p className="review-summary">{MOCK_REVIEW.summary}</p>
          <pre className="review-code" tabIndex={0}>
            <code>{MOCK_REVIEW.snippet}</code>
          </pre>
          <p className="review-footnote muted small">
            Skim the change, then use the thread assistant on the right to pick which model
            should answer follow-ups for this review.
          </p>
        </section>

        <aside className="review-side" aria-label="Assistant and models">
          <div className="cp-topbar">
            <CopilotSparkIcon className="cp-spark" />
            <div>
              <div className="cp-topbar-title">Thread assistant</div>
              <div className="cp-topbar-sub muted small">This PR · coding review</div>
            </div>
          </div>

          <div className="cp-compose" role="presentation">
            <CopilotSparkIcon className="cp-compose-icon" />
            <div className="cp-compose-placeholder">
              Ask about this change…
              <span className="cp-compose-hint"> (model below)</span>
            </div>
          </div>

          <div className="cp-model-panel">
            <div className="cp-model-panel-head">
              <span>Models for this thread</span>
            </div>
            <div className="cp-toolbar">
              <label className="grow">
                <span className="label">Search</span>
                <input
                  className="input"
                  value={query}
                  placeholder="Filter by name, vendor, or keyword…"
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
                Clear
              </button>
            </div>
            <p className="cp-meta">
              {filtered.length} of {ordered.length} shown · list order is shuffled (seed) · search
              steps: {searchCommitCount}
            </p>
            <div className="cp-picks">
              {primaryId && (
                <span className="cp-pill primary">
                  Primary: {ordered.find((m) => m.id === primaryId)?.displayName ?? primaryId}
                </span>
              )}
              {secondaryId && (
                <span className="cp-pill secondary">
                  Backup: {ordered.find((m) => m.id === secondaryId)?.displayName ?? secondaryId}
                </span>
              )}
            </div>
            <ul className="cp-list" role="list">
              {filtered.map((m) => {
                const isP = primaryId === m.id;
                const isS = secondaryId === m.id;
                return (
                  <li key={m.id} className={`cp-row ${isP ? "is-primary" : ""} ${isS ? "is-secondary" : ""}`}>
                    <div className="cp-row-main">
                      <span className="pill vendor">{VENDOR_LABEL[m.vendor]}</span>
                      <span className="cp-row-name">{m.displayName}</span>
                    </div>
                    <div className="cp-row-ids mono small">{m.id}</div>
                    <div className="cp-row-actions">
                      <button
                        type="button"
                        className={isP ? "btn sm active" : "btn sm secondary"}
                        onClick={() => togglePrimary(m.id)}
                      >
                        {isP ? "Primary ✓" : "Primary"}
                      </button>
                      <button
                        type="button"
                        className={isS ? "btn sm active-alt" : "btn sm secondary"}
                        onClick={() => toggleSecondary(m.id)}
                        disabled={isP}
                      >
                        {isS ? "Backup ✓" : "Backup"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="cp-footer">
              <button type="button" className="btn" onClick={commit} disabled={!primaryId}>
                Save model choice
              </button>
              {!primaryId && <span className="warn">Pick a primary model to continue.</span>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
