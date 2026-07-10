---
title: Open questions (next-brief queue)
type: overview
created: 2026-05-09
updated: 2026-07-10
sources:
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

## (16b) Replace the false `primaryEraId` default

`Owner: Philipp (policy in S0) → Codex (S1a)` · `Sessions: 137, 152, 171, 193` · `Follow-up: launch S0/S1a`

The per-book writer still stamps `book_details.primary_era_id = 'time_ending'` through `M41_ERA_ID` for effectively the whole corpus. This was once low-pressure placeholder debt; it is now a launch correctness issue because book and Ask surfaces can display the value.

S0 must choose between:

- recommended: remove the blanket stamp, derive an Era mechanically from setting dates where reliable, otherwise write `NULL`; or
- hide/clear the field until hand curation.

Whichever choice wins must live in the durable apply path, survive `db:rebuild`, remain null-safe in Ask/Search/Book consumers and be reflected in the build snapshot.

## (19) Make the launch release order internally consistent

`Owner: Philipp + Codex (S0 preflight)` · `Session: 193` · `Follow-up: launch S0 before S1a`

The local launch plan currently contains four incompatible contracts that must be resolved before implementation:

1. Era/apply code may not mutate production before its PR is merged.
2. Revalidation must follow the snapshot deploy, or the `db:sync` hook must be explicitly suppressible/deferred during a two-stage release.
3. Moving Vercel to `RUNTIME_DATABASE_URL` requires an actual consumer change in `src/db/client.ts`; a scripts-only DB-hardening PR cannot complete the cutover.
4. The final snapshot is a Batches release PR/deploy; its evidence protocol is a separate coordination artifact, not a mixed-strand PR.

S0 should write one authoritative sequence and adjust later prompts to it before S1a starts.

---

Timeline follow-up **16c (Atlas event pages)** moved to `deferred-questions.md`: it is real but not a next-session/launch blocker. Sessions 178b and 185–192 opened no additional architecture OQ; their smaller follow-ups are tracked in `worklist.md`.
