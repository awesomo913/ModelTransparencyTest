import {
  AGENT_SCENARIOS,
  RUBRIC_DIMENSIONS,
  TOOL_SCOPE_OPTIONS,
} from "./geminiAgentRubric";
import { shuffleWithSeed } from "./shuffle";
import type { SessionRecord } from "./telemetry";
import { SAMPLE_PRIMARY_ID } from "./quickDefaults";

/** Flat scores for a quick demo row (all 4 = “strong”). */
function demoRow() {
  const o: Record<string, number> = {};
  for (const d of RUBRIC_DIMENSIONS) o[d.id] = 4;
  return o;
}

export function appendGeminiDemo(
  session: SessionRecord,
  onAppend: (type: string, payload: Record<string, unknown>) => void
) {
  const scenarios = shuffleWithSeed(AGENT_SCENARIOS, session.seed + 77_777);
  const scenarioOrder = scenarios.map((s) => s.id);
  const toolScope = TOOL_SCOPE_OPTIONS.map((t) => t.id);
  const modelId = SAMPLE_PRIMARY_ID;

  onAppend("gemini_agent_config", {
    modelId,
    surface: "interactions",
    toolScope,
    scenarioOrder,
    source: "demo_autorun",
  });

  scenarios.forEach((sc, i) => {
    onAppend("gemini_agent_scenario_step", {
      scenarioId: sc.id,
      scenarioTitle: sc.title,
      ordinal: i + 1,
      of: scenarios.length,
      dwellMs: 0,
      dimensionScores: demoRow(),
      freeText: "Sample (auto)",
      source: "demo_autorun",
    });
  });

  const scoresByScenario: Record<string, Record<string, number>> = {};
  for (const sc of scenarios) {
    scoresByScenario[sc.id] = demoRow();
  }
  onAppend("gemini_agent_complete", {
    modelId,
    surface: "interactions",
    toolScope,
    scenarioOrder,
    scoresByScenario,
    notesByScenario: Object.fromEntries(scenarios.map((s) => [s.id, "Sample (auto)"])),
    overallConfidence: 4,
    overallNotes: "Sample run — no real evaluation.",
    source: "demo_autorun",
  });
}
