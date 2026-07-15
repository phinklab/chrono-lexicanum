---
title: Open questions (next-brief queue)
type: overview
created: 2026-05-09
updated: 2026-07-15
sources:
  - ../../sessions/2026-07-11-195-impl-launch-release-preflight.md
  - ../../sessions/2026-07-11-194-impl-launch-s0.md
  - ../../docs/launch-master-plan.md
  - ../../sessions/2026-07-10-193-impl-brain-launch-rollup.md
  - ../../sessions/archive/2026-06/2026-06-10-137-impl-timeline-data-foundation.md
  - ../../sessions/archive/2026-06/2026-06-16-152-impl-timeline-rebuild-tail.md
  - ../../sessions/archive/2026-06/2026-06-30-171-impl-per-book-ssot-migration.md
  - ../../scripts/book-apply-shared.ts
related:
  - ./project-state.md
  - ./worklist.md
  - ./deferred-questions.md
  - ./log.md
confidence: high
---

# Open questions

> Questions the **next** coordination brief/session must close. Keep this queue small; dormant work belongs in [`deferred-questions.md`](./deferred-questions.md), operational work in [`worklist.md`](./worklist.md), and closed history in [`log.md`](./log.md).

*No open architecture questions right now.* The mandatory launch stretch (S1a–S10a) is merged; the project is in the **workshop phase** (plan addendum 2026-07-15) and the next step is the feature triage starting with idea 2 per [`docs/post-launch-feature-ideas.md`](../../docs/post-launch-feature-ideas.md). Each triage round may open new questions here (ideas 3a, 5, 6 carry schema implications — see the roadmap's ideas backlog). Dormant items live in [`deferred-questions.md`](./deferred-questions.md).

---

**19 (launch release order) closed in Session 195 (OQ-19-Preflight, 2026-07-11, Philipp-confirmed):** all four contradictions resolved in `docs/launch-master-plan.md` + prompts — (1) S1a split into a Code-PR (no production writes) and a separate "S1a-Snapshot" release PR (one `db:sync` after merge + freeze + explicit Go; the snapshot PR is the deploy); (2) `db:sync` never auto-revalidates — S3a ships an explicit fail-loud post-deploy revalidation command the E4 runbook calls exactly once after the snapshot deploy; (3) the `RUNTIME_DATABASE_URL` consumer switch in `src/db/client.ts` is S3b (Product) with a transitional fallback and a maintainer-gated Vercel cutover; (4) snapshot artifacts ship in Batches release PRs, the launch-readiness protocol + rollups stay separate coordination PRs. Durable record: plan §§ S1a/S3a/S3b/Launch-Readiness + Nachtrag 2026-07-11.

**16b (Era policy) closed in S0/Session 194:** Philipp chose the default variant — remove the blanket stamp, bucket mechanically from setting dates, else `NULL`; Chronicle verified unaffected (reads only the `eras`/`events` spine). Implementation is plan § S1a; the durable record lives in `docs/launch-master-plan.md` § Entscheidungen.

Timeline follow-up **16c (Atlas event pages)** moved to `deferred-questions.md`: it is real but not a next-session/launch blocker. Sessions 178b and 185–192 opened no additional architecture OQ; their smaller follow-ups are tracked in `worklist.md`.
