import { useEffect, useMemo, useRef, useState } from "react";
import { CATALOG, VENDOR_LABEL } from "../models/catalog";
import {
  AGENT_SCENARIOS,
  AGENT_SURFACES,
  GEMINI_DOC_BLURB,
  LIKERT_LABELS,
  RUBRIC_DIMENSIONS,
  TOOL_SCOPE_OPTIONS,
  type AgentSurfaceId,
  type ToolScopeId,
} from "../lib/geminiAgentRubric";
import { shuffleWithSeed } from "../lib/shuffle";
import {
  clearGeminiDraft,
  loadGeminiDraft,
  type GeminiDraftV1,
  saveGeminiDraft,
} from "../lib/geminiDraftStorage";
import { getAppVersion, type SessionRecord } from "../lib/telemetry";

function buildToolScope(d: GeminiDraftV1 | null): Record<ToolScopeId, boolean> {
  const o = {} as Record<ToolScopeId, boolean>;
  for (const t of TOOL_SCOPE_OPTIONS) {
    const v = d?.toolScope?.[t.id];
    o[t.id] = typeof v === "boolean" ? v : true;
  }
  return o;
}

function getInitialWizard(sessionId: string) {
  const d = loadGeminiDraft(sessionId);
  const google = CATALOG.filter((m) => m.vendor === "google");
  const maxOrd = AGENT_SCENARIOS.length - 1;
  const modelId =
    d?.modelId && google.some((m) => m.id === d.modelId)
      ? d.modelId
      : (google[0]?.id ?? "google-gemini-2-5-pro");
  const surface: AgentSurfaceId =
    d && AGENT_SURFACES.some((s) => s.id === d.surface) ? (d.surface as AgentSurfaceId) : "interactions";
  return {
    phase: (d?.phase === "config" || d?.phase === "run" || d?.phase === "review" ? d.phase : "config") as
      | "config"
      | "run"
      | "review",
    ord: d ? Math.min(Math.max(0, d.ord), maxOrd) : 0,
    modelId,
    surface,
    toolScope: buildToolScope(d),
    scores: d?.scores && typeof d.scores === "object" ? d.scores : {},
    notes: d?.notes && typeof d.notes === "object" ? d.notes : {},
    overallConfidence:
      d && d.overallConfidence >= 1 && d.overallConfidence <= 5 ? d.overallConfidence : 3,
    overallNotes: d?.overallNotes ?? "",
  };
}

type Props = {
  session: SessionRecord;
  onAppend: (type: string, payload: Record<string, unknown>) => void;
};

function emptyScores() {
  const o: Record<string, number> = {};
  for (const d of RUBRIC_DIMENSIONS) o[d.id] = 3;
  return o;
}

export function GeminiAgentTest({ session, onAppend }: Props) {
  const w0 = useMemo(() => getInitialWizard(session.sessionId), [session.sessionId]);
  const googleModels = useMemo(() => CATALOG.filter((m) => m.vendor === "google"), []);
  const scenarios = useMemo(
    () => shuffleWithSeed(AGENT_SCENARIOS, session.seed + 77_777),
    [session.seed]
  );

  const [phase, setPhase] = useState<"config" | "run" | "review">(w0.phase);
  const [ord, setOrd] = useState(w0.ord);
  const [modelId, setModelId] = useState(w0.modelId);
  const [surface, setSurface] = useState<AgentSurfaceId>(w0.surface);
  const [toolScope, setToolScope] = useState<Record<ToolScopeId, boolean>>(w0.toolScope);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>(w0.scores);
  const [notes, setNotes] = useState<Record<string, string>>(w0.notes);
  const [overallConfidence, setOverallConfidence] = useState(w0.overallConfidence);
  const [overallNotes, setOverallNotes] = useState(w0.overallNotes);

  const enterTime = useRef(performance.now());
  const mountLogged = useRef(false);

  const current = scenarios[ord];

  useEffect(() => {
    saveGeminiDraft(session.sessionId, {
      v: 1,
      phase,
      ord,
      modelId,
      surface,
      toolScope,
      scores,
      notes,
      overallConfidence,
      overallNotes,
    });
  }, [
    session.sessionId,
    phase,
    ord,
    modelId,
    surface,
    toolScope,
    scores,
    notes,
    overallConfidence,
    overallNotes,
  ]);

  useEffect(() => {
    const key = `rubric-mount-${session.sessionId}`;
    if (mountLogged.current || sessionStorage.getItem(key)) return;
    mountLogged.current = true;
    sessionStorage.setItem(key, "1");
    onAppend("gemini_agent_mount", {
      test: "gemini_agent",
      appVersion: getAppVersion(),
      scenarioCount: AGENT_SCENARIOS.length,
      dimensionCount: RUBRIC_DIMENSIONS.length,
    });
  }, [onAppend, session.sessionId]);

  useEffect(() => {
    if (phase !== "run" || !current) return;
    enterTime.current = performance.now();
    setScores((s) => {
      if (s[current.id]) return s;
      return { ...s, [current.id]: emptyScores() };
    });
  }, [phase, current?.id, ord, current]);

  const toggleTool = (id: ToolScopeId) => {
    setToolScope((t) => ({ ...t, [id]: !t[id] }));
  };

  const setDim = (scenarioId: string, dim: string, v: number) => {
    setScores((s) => ({
      ...s,
      [scenarioId]: { ...(s[scenarioId] ?? emptyScores()), [dim]: v },
    }));
  };

  const startRun = () => {
    onAppend("gemini_agent_config", {
      modelId,
      surface,
      toolScope: TOOL_SCOPE_OPTIONS.filter((t) => toolScope[t.id]).map((t) => t.id),
      scenarioOrder: scenarios.map((s) => s.id),
    });
    setPhase("run");
    setOrd(0);
  };

  const nextScenario = () => {
    if (!current) return;
    const dwell = Math.round(performance.now() - enterTime.current);
    const srow = scores[current.id] ?? emptyScores();
    onAppend("gemini_agent_scenario_step", {
      scenarioId: current.id,
      scenarioTitle: current.title,
      ordinal: ord + 1,
      of: scenarios.length,
      dwellMs: dwell,
      dimensionScores: srow,
      freeText: (notes[current.id] ?? "").slice(0, 8000),
    });
    if (ord + 1 >= scenarios.length) {
      setPhase("review");
    } else {
      setOrd(ord + 1);
    }
  };

  const prevScenario = () => {
    if (ord <= 0) {
      setPhase("config");
      return;
    }
    setOrd(ord - 1);
  };

  const saveAll = () => {
    onAppend("gemini_agent_complete", {
      modelId,
      surface,
      toolScope: TOOL_SCOPE_OPTIONS.filter((t) => toolScope[t.id]).map((t) => t.id),
      scenarioOrder: scenarios.map((s) => s.id),
      scoresByScenario: Object.fromEntries(
        scenarios.map((sc) => [sc.id, scores[sc.id] ?? emptyScores()])
      ),
      notesByScenario: { ...notes },
      overallConfidence,
      overallNotes: overallNotes.slice(0, 8000),
    });
    clearGeminiDraft(session.sessionId);
    alert("Gemini agent assessment saved to this session. Export from the header if you need a file.");
  };

  if (phase === "config") {
    return (
      <div className="panel gemini">
        <div className="panel-head">
          <h2>Optional: rate Gemini-style scenarios</h2>
          <p className="hint">Skip this if you only want the first two tabs. {GEMINI_DOC_BLURB}</p>
        </div>

        <div className="form-block">
          <label className="label">Gemini product line to evaluate (expected behavior)</label>
          <select
            className="input"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
          >
            {googleModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName} — {VENDOR_LABEL[m.vendor]}
              </option>
            ))}
          </select>
        </div>

        <div className="form-block">
          <span className="label">Agent surface (how the model is wired)</span>
          <div className="radio-list">
            {AGENT_SURFACES.map((a) => (
              <label key={a.id} className="radio-row">
                <input
                  type="radio"
                  name="surface"
                  checked={surface === a.id}
                  onChange={() => setSurface(a.id)}
                />
                <span>
                  <strong>{a.label}</strong>
                  <span className="subtle block">{a.detail}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-block">
          <span className="label">Tool scope in your evaluation (context only; no calls from this page)</span>
          <div className="tool-grid">
            {TOOL_SCOPE_OPTIONS.map((t) => (
              <label key={t.id} className="check-row">
                <input
                  type="checkbox"
                  checked={toolScope[t.id] ?? false}
                  onChange={() => toggleTool(t.id)}
                />
                <span>
                  <span className="check-title">{t.label}</span>
                  <span className="subtle small">{t.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <p className="meta">
          You will walk through {AGENT_SCENARIOS.length} detailed scenarios. Each uses the same
          seven-dimension rubric (1–5). Order is shuffled from your display seed for your session.
        </p>
        <button type="button" className="btn" onClick={startRun}>
          Start structured scenarios
        </button>
      </div>
    );
  }

  if (phase === "run" && current) {
    const row = scores[current.id] ?? emptyScores();
    return (
      <div className="panel gemini">
        <div className="panel-head">
          <h2>Scenario {ord + 1} / {scenarios.length}</h2>
          <p className="hint mono small">{current.id}</p>
        </div>
        <h3 className="scenario-h">{current.title}</h3>
        <div className="prose">
          <p>{current.context}</p>
          <p>
            <strong>What you are judging:</strong>
          </p>
          <ul>
            {current.task.map((t, i) => (
              <li key={`t-${i}`}>{t}</li>
            ))}
          </ul>
          <p>
            <strong>Success criteria (for your rating):</strong>
          </p>
          <ul>
            {current.successCriteria.map((t, i) => (
              <li key={`c-${i}`}>{t}</li>
            ))}
          </ul>
        </div>

        <div className="rubric">
          {RUBRIC_DIMENSIONS.map((d) => (
            <div key={d.id} className="rubric-row">
              <div className="rubric-text">
                <span className="rubric-label">{d.label}</span>
                <span className="subtle small block">{d.guidance}</span>
              </div>
              <div className="rubric-slider">
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={row[d.id] ?? 3}
                  onChange={(e) => setDim(current.id, d.id, Number(e.target.value))}
                />
                <div className="likert-anno">
                  <span>
                    {row[d.id] ?? 3} — {LIKERT_LABELS[row[d.id] ?? 3] ?? ""}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <label className="label">Notes for this scenario (optional, kept in export)</label>
        <textarea
          className="input ta"
          rows={3}
          value={notes[current.id] ?? ""}
          onChange={(e) => setNotes((n) => ({ ...n, [current.id]: e.target.value }))}
          placeholder="Edge cases, prior runs, or what would change the score"
        />

        <div className="footer-actions spread">
          <button type="button" className="btn secondary" onClick={prevScenario}>
            {ord === 0 ? "← Back to setup" : "← Previous scenario"}
          </button>
          <button type="button" className="btn" onClick={nextScenario}>
            {ord + 1 >= scenarios.length ? "Finish → Review" : "Next scenario →"}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "review") {
    const modelLabel = googleModels.find((m) => m.id === modelId)?.displayName ?? modelId;
    return (
      <div className="panel gemini">
        <h2>Review &amp; save</h2>
        <p className="meta">
          Target: <strong>{modelLabel}</strong> · Surface: {AGENT_SURFACES.find((s) => s.id === surface)?.label}
        </p>
        <table className="summary-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Avg (7 dims)</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((sc) => {
              const r = scores[sc.id] ?? emptyScores();
              const vals = RUBRIC_DIMENSIONS.map((d) => r[d.id] ?? 3);
              const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
              return (
                <tr key={sc.id}>
                  <td>{sc.title}</td>
                  <td>{avg.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="rubric-row single">
          <div className="rubric-text">
            <span className="rubric-label">Overall confidence in these ratings (1–5)</span>
            <span className="subtle small block">How certain are you, given the scenario text only?</span>
          </div>
          <div className="rubric-slider">
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={overallConfidence}
              onChange={(e) => setOverallConfidence(Number(e.target.value))}
            />
            <div className="likert-anno">
              {overallConfidence} — {LIKERT_LABELS[overallConfidence]}
            </div>
          </div>
        </div>

        <label className="label">Synthesis (optional)</label>
        <textarea
          className="input ta"
          rows={4}
          value={overallNotes}
          onChange={(e) => setOverallNotes(e.target.value)}
          placeholder="Where this line wins vs regresses, deployment caveats, or what you would A/B in production"
        />

        <div className="footer-actions spread">
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              setPhase("run");
              setOrd(scenarios.length - 1);
            }}
          >
            ← Last scenario
          </button>
          <button type="button" className="btn" onClick={saveAll}>
            Save assessment
          </button>
        </div>
      </div>
    );
  }

  return null;
}
