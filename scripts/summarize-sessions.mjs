#!/usr/bin/env node
/**
 * Summarize JSONL session exports from ModelTransparencyTester
 * (pairwise wins, directory primary picks, Gemini completions).
 * Usage: node scripts/summarize-sessions.mjs path/to/sessions.jsonl
 */
import { readFileSync, existsSync } from "node:fs";

const path = process.argv[2];
if (!path || !existsSync(path)) {
  console.error("Usage: node scripts/summarize-sessions.mjs <sessions.jsonl>");
  process.exit(1);
}

const lines = readFileSync(path, "utf8")
  .trim()
  .split("\n")
  .filter(Boolean);

const wins = new Map();
const primaryPicks = new Map();
const geminiAvgByModel = new Map();
let h2hRounds = 0;
let coworkerSubmits = 0;
let geminiCompletes = 0;

for (const line of lines) {
  let rec;
  try {
    rec = JSON.parse(line);
  } catch {
    continue;
  }
  for (const ev of rec.events ?? []) {
    if (ev.type === "h2h_round" && ev.payload?.winnerId) {
      h2hRounds++;
      const w = ev.payload.winnerId;
      wins.set(w, (wins.get(w) ?? 0) + 1);
    }
    if (ev.type === "coworker_submit" && ev.payload?.primaryId) {
      coworkerSubmits++;
      const p = ev.payload.primaryId;
      primaryPicks.set(p, (primaryPicks.get(p) ?? 0) + 1);
    }
    if (ev.type === "gemini_agent_complete" && ev.payload?.modelId) {
      geminiCompletes++;
      const mid = ev.payload.modelId;
      const sbs = ev.payload.scoresByScenario;
      if (sbs && typeof sbs === "object") {
        const dims = Object.values(sbs).flatMap((row) =>
          row && typeof row === "object" ? Object.values(row).filter((n) => typeof n === "number") : []
        );
        if (dims.length) {
          const sessionAvg = dims.reduce((a, b) => a + b, 0) / dims.length;
          const prev = geminiAvgByModel.get(mid) ?? { sum: 0, n: 0 };
          geminiAvgByModel.set(mid, { sum: prev.sum + sessionAvg, n: prev.n + 1 });
        }
      }
    }
  }
}

const sort = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]);

console.log("Sessions in file:", lines.length);
console.log("\nTest B — h2h_round wins (count):", h2hRounds, "rounds");
console.table(sort(wins).slice(0, 20));

console.log("\nTest A — coworker_submit primary (count):", coworkerSubmits, "submits");
console.table(sort(primaryPicks).slice(0, 20));

const geminiRows = [...geminiAvgByModel.entries()].map(([k, v]) => ({
  modelId: k,
  sessions: v.n,
  meanRubric1to5: v.n ? +(v.sum / v.n).toFixed(3) : 0,
}));
geminiRows.sort((a, b) => b.meanRubric1to5 - a.meanRubric1to5);
console.log("\nGemini agent — gemini_agent_complete (count):", geminiCompletes, "saves");
console.table(geminiRows.slice(0, 20));
