---
session: 2026-05-18-081
role: implementer
date: 2026-05-18
status: complete
slug: ssot-synopsis-backfill-005-019
parent: 2026-05-17-081
links:
  - 2026-05-17-081-arch-ssot-synopsis-backfill-005-019
  - 2026-05-17-080-arch-synopsis-guard-and-pilot
  - 2026-05-17-080-impl-synopsis-guard-and-pilot
  - 2026-05-11-061-arch-ssot-loop
commits: []
---

# Public-Synopsis-Backfill 005..019 - impl

## Summary

Brief 081 is complete: all polluted public synopses in `ssot-w40k-005..019` were rewritten batch-by-batch, applied to the DB, and logged in `sessions/ssot-loop-log.md`. The final dry-run now reports `ssot-w40k-001..020` synopsis-clean across all 32 banned patterns; Batch 020 stayed untouched as the pilot reference.

## What I did

- `scripts/seed-data/manual-overrides-ssot-w40k-005.json`..`019.json` - rewrote only the hit-bearing `overrides.synopsis` strings in each batch.
- `sessions/ssot-loop-log.md` - appended one compact Brief-081 H2 block per iteration.
- `sessions/2026-05-17-081-arch-ssot-synopsis-backfill-005-019.md` - flipped the standing brief status to `implemented` after iteration 019.
- `sessions/README.md` - updated the 081 active-thread row and added this closing report row.
- `sessions/2026-05-18-081-impl-ssot-synopsis-backfill-005-019.md` - added this aggregate closing report.

## Decisions I made

- I followed the Loop-Log detection path from the brief. The branch history and `tail` both showed `ssot-w40k-018` as the newest completed iteration, so the final iteration was `ssot-w40k-019`.
- I did not touch clean books. Across the loop, the touch set stayed exactly at 123 hit-bearing books; Batch 019 touched all 10 because all 10 had guard hits.
- I kept plot turns when the old synopsis already made them premise-level public context: Kage's apparent death and Burned Man identity, the unfinished Gothic War third-novel context, and the Soul Drinkers' Excommunicate Traitoris / mutation setup.
- I kept period naming in public prose: Tau / Imperial Guard for early Last Chancers copy, Battlefleet Gothic / Imperial Navy for Rennie's naval shelf, Eldar-era wording in earlier Watson material from prior batches, and current-era naming in the newer Welle-3 titles.
- No WebSearch was used in any 081 rewrite; the old `overrides.synopsis` text was the sole plot source.

## Aggregate Stats

- Books rewritten: 123.
- Batches completed: 15 (`005` through `019`).
- Lengths over rewritten books: pre min/mean/max `505 / 1536.3 / 2458`; post min/mean/max `502 / 605.3 / 783`.
- Batch 019 specifically: 10 rewritten / 10 total; hits `384 -> 0`; lengths pre min/mean/max `1115 / 1487.7 / 1837`; post `541 / 603.8 / 721`.
- Practical voice split: Welle-2 needed more elasticity because some early clean-adjacent / omnibus entries were thin or aggregate-shaped; Welle-3 settled into ~570-625 for most single-spine novels; Welle-4 Necromunda stayed leaner and street-level; Batch 019 landed between penal-legion memoir, naval campaign prose, and chapter-tragedy tone.
- Token estimate: small Welle-2 iterations generally felt ~20k-45k tokens; full 10-book Welle-3/4 iterations generally ~45k-80k, with extra overhead when Windows quoting or closing bookkeeping entered the loop.

## Verification

- `git branch --show-current` - `codex/ingest-batches-synopsis-005-019`.
- `git status --short --branch` - clean before edits, branch ahead of `origin/main`.
- Mini-tsx touch-set detector for Batch 019 - 10 hit books / 384 hits before rewrite.
- Mini-tsx synopsis lint for Batch 019 after rewrite - `total hits: 0`.
- Non-synopsis comparison for Batch 019 - only `overrides.synopsis` values changed.
- `npm.cmd run test:synopsis-lint` - pass, 14/0.
- `npm.cmd run test:apply-override-dry -- --batch=ssot-w40k-019` - pass; all batches `001..020` clean, `by label: none`.
- `npm.cmd run db:apply-override -- --batch=ssot-w40k-019` - pass; 10 updates, 0 inserts, 10 validated synopses.
- `npm.cmd run lint` - pass with the existing `@next/next/no-page-custom-font` warning in `src/app/layout.tsx`.
- `npm.cmd run typecheck` - pass.
- `npm.cmd run brain:lint -- --no-write` - pass, 0 blocking findings / 10 warnings.

## Open issues / blockers

None for Brief 081.

## For next session

- Cowork should run the post-081 Wiki-Hygiene pass and archive/prune the active session rows as usual.
- The SSOT loop can now resume with `ssot-w40k-021..025` under the existing Brief-061 loop, with both the public-synopsis discipline and the faction-granularity discipline active.
- Batch 019 leaves the expected resolver carry-over shape from the previous 200-book pause intact; no new synopsis-specific policy blocker surfaced.

## References

- `sessions/2026-05-17-081-arch-ssot-synopsis-backfill-005-019.md`
- `sessions/ssot-loop-log.md`