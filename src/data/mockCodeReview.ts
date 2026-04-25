/**
 * Fictional repo / PR text for a neutral “sprint review” task.
 * Not tied to a real product or trademarked UI copy.
 */
export const MOCK_REVIEW = {
  org: "acme",
  repo: "payments-gateway",
  prNumber: 4821,
  title: "Harden idempotency + rollout flags for v2 /charges",
  author: "sgarcia",
  base: "main",
  branch: "feature/charge-idempotency",
  filesChanged: 14,
  additions: 842,
  deletions: 210,
  summary: `This change threads an idempotency key through the charge path, adds a 14-day
feature flag, and backfills a migration with zero-downtime cutover. Rollback is one toggled
flag plus a re-read from the outbox. Load tests in staging are green; on-call will watch
P99 in three regions for 48h after deploy.`,
  snippet: `// services/charge/orchestrate.ts (excerpt)
export async function commitCharge(ctx: Ctx) {
  const key = assertIdemKey(ctx.headers["idempotency-key"]);
  const existing = await outbox.findByKey(key);
  if (existing) return existing.receipt; // 202-style replay
  const draft = buildDraft(ctx);
  await flags.assert("v2_charges", ctx.tenant);
  return pipeline.commit(draft);
}`,
} as const;
