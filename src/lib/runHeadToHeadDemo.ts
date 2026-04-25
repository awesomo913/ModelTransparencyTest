import { CATALOG } from "../models/catalog";
import { pickRandomPair } from "./shuffle";
import type { SessionRecord } from "./telemetry";

const SCENARIOS = [
  "Greenfield: design a public HTTP API, OpenAPI, and 6-month migration plan for clients.",
  "Incident: paged 3am, logs show flapping connection pool; find root cause and harden tests.",
  "Refactor: untangle 40k lines of JS into typed modules with zero behavior change.",
] as const;

const TOTAL = 12;

/**
 * Appends 12 h2h_round events + h2h_complete in one go (for “finish for me” demo).
 * Uses same scenario selection as the UI (index from seed) for consistency.
 */
export function appendHeadToHeadDemo(
  session: SessionRecord,
  onAppend: (type: string, payload: Record<string, unknown>) => void
) {
  const scenarioIndex = Math.abs(session.seed) % SCENARIOS.length;
  const scenario = SCENARIOS[scenarioIndex]!;
  for (let r = 0; r < TOTAL; r++) {
    const pair = pickRandomPair(CATALOG, session.seed, r);
    const leftWins = (session.seed + r) % 2 === 0;
    const winner = leftWins ? pair[0]! : pair[1]!;
    const loser = leftWins ? pair[1]! : pair[0]!;
    onAppend("h2h_round", {
      round: r + 1,
      scenario,
      leftId: pair[0]!.id,
      rightId: pair[1]!.id,
      winnerId: winner.id,
      loserId: loser.id,
      source: "demo_autorun",
    });
  }
  onAppend("h2h_complete", { totalRounds: TOTAL, scenario, source: "demo_autorun" });
}
