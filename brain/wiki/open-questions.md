---
title: Open questions (next-brief queue)
type: overview
created: 2026-05-09
updated: 2026-07-11
sources:
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

## (19) Make the launch release order internally consistent

`Owner: Philipp + Codex (preflight before S1a)` · `Sessions: 193, 194` · `Follow-up: close before S1a starts`

S0 (Session 194) closed the four maintainer decisions but deliberately did not touch the release order — the plan (now canonical at `docs/launch-master-plan.md`) still contains four incompatible contracts that must be resolved before implementation:

1. Era/apply code may not mutate production before its PR is merged.
2. Revalidation must follow the snapshot deploy, or the `db:sync` hook must be explicitly suppressible/deferred during a two-stage release.
3. Moving Vercel to `RUNTIME_DATABASE_URL` requires an actual consumer change in `src/db/client.ts`; a scripts-only DB-hardening PR cannot complete the cutover.
4. The final snapshot is a Batches release PR/deploy; its evidence protocol is a separate coordination artifact, not a mixed-strand PR.

A short preflight (Cowork or a mini coordination pass) should write one authoritative sequence into the plan and adjust the S1a/S3a prompts to it before S1a starts.

---

**16b (Era policy) closed in S0/Session 194:** Philipp chose the default variant — remove the blanket stamp, bucket mechanically from setting dates, else `NULL`; Chronicle verified unaffected (reads only the `eras`/`events` spine). Implementation is plan § S1a; the durable record lives in `docs/launch-master-plan.md` § Entscheidungen.

Timeline follow-up **16c (Atlas event pages)** moved to `deferred-questions.md`: it is real but not a next-session/launch blocker. Sessions 178b and 185–192 opened no additional architecture OQ; their smaller follow-ups are tracked in `worklist.md`.
