---
title: Roadmap
type: overview
created: 2026-05-09
updated: 2026-07-22
sources:
  - ../raw/historical/2026-05-08-pre-reset/ROADMAP.md
  - ../../sessions/README.md
  - ../../docs/launch-master-plan.md
  - ../../docs/werkstatt-roadmap.md
  - ../../sessions/2026-07-21-257-impl-text-delint-emdash.md
  - ../../sessions/2026-07-21-256-impl-nav-curator-compendium.md
  - ../../sessions/2026-07-20-253-impl-werkstatt-wab1-archive-facet-filters.md
  - ../../sessions/2026-07-20-252-impl-werkstatt-f3b1-librarium-statistics.md
  - ../../sessions/2026-07-20-251-impl-werkstatt-f1b2-status-imperialis.md
  - ../../sessions/2026-07-19-249-impl-map-ui-rework.md
related:
  - ./project-state.md
  - ./worklist.md
  - ./decisions/plan-reshuffle-2026-05-02.md
confidence: high
---

# Roadmap

> Phase-level direction. The executable queue is [`worklist.md`](./worklist.md); current facts are in [`project-state.md`](./project-state.md). Historical phase detail remains in git and the session log.

## Status snapshot (2026-07-22)

| Phase | Status | Current result |
|---|---|---|
| 1 — Foundation | shipped | Next.js/TypeScript/Drizzle/Supabase/Vercel, migrations, CI and preview environment |
| 2 — Chronicle | shipped | Event-backed cinematic + index timeline with curated Era/event art |
| 3 — Content ingestion | shipped; maintenance | 896-book per-book SSOT, additive podcast delta, weekly detection/review, idempotent apply/verify paths; crawler/LLM engines retired |
| 4 — Discovery | shipped | Archive with multi-facet filtering, Podcasts, Compendium + Guided Picks, `/now`, Librarium statistics, detail hubs and universal search |
| 5 — Cartographer | shipped | 1,055-world chart, three time states, era-aware Great Journeys, dual renderer and task-oriented instruments |
| 6 — Community | post-launch | Public submissions, review/merge workflow and credits |
| 7 — Polish & launch | **current: quality passes** | Hardening + workshop construction complete; S7b and S11 code are the only remaining pre-launch implementation passes |

## Phase 7 — remaining launch programme

The mandatory launch-hardening stretch S0 + S1a–S10a and the workshop programme through item 11b are complete. The full workshop ledger is [`docs/werkstatt-roadmap.md`](../../docs/werkstatt-roadmap.md); W3a-B1 moved to backlog on 2026-07-22. The remaining sequence is fixed:

1. **S7b:** Player/Chrome/asset cleanup and measurement behind the preview gate. One final live measurement repeats after gate-off.
2. **S11 code PR:** pixel-identical maintenance after S7b.
3. **Content freeze + Launch-Readiness:** once artist artwork is complete, capture the 12-point evidence package.
4. **Gate-off:** minimal flag flip, new production deploy and live-crawl verification.
5. **Quiet window:** PL1 preview removal, final S7b live measurement and the separate S11 documentation rollup.
6. **Reddit post:** only after the quiet window is complete.

There is no launch-date pressure. The preview gate and invite machinery stay load-bearing through readiness and gate-off.

## Decided backlog

The workshop visited the whole feature list; these are decisions, not untriaged ideas:

- **Character connections (W3a):** post-launch revisit. Existing `work_characters` supports the scoped co-occurrence-v1 without schema; semantic relationships would need curated edges later.
- **Podcasts on book pages (W5):** post-launch revisit after measuring both derivation paths; a clean durable model may need `episode_covers_work`.
- **Size comparison (W6):** post-launch, schema + source design required.
- **Personal Library / double-purchase overlap:** only after real user demand; local-first before accounts.
- **Provenance consolidation (W4), Cartographer running timeline (W3b-B3), Galaspar, podcast aliases and the remaining editorial passes:** use the triggers and prepared cuts in the workshop roadmap.

## Post-launch (quiet window and beyond)

- Remove the full preview login/invite mechanism and activation table in PL1 after gate-off, never before.
- Complete the final S7b live measurement and S11 documentation rollup before announcing the site.
- Expand Chronicle, Cartographer and editorial content from observed user needs rather than speculative systems.

## Future product phases

### Personal library

Read / heard / want state, auth and storage require a dedicated architecture brief. This is distinct from recommendations and not part of launch hardening.

### Community contributions

Public corrections/new-content submissions should land in the existing `submissions` quarantine, never directly in canonical tables. Admin review, merge semantics and opt-in credits ship together.

### Editorial layers

- Topic strands and character/Primarch galleries after B8/B9 curation.
- Reading-order presets (Horus Heresy chronology/publication, newcomer-friendly, audio-first).
- Audiobook narrator directory and current-era editorial collections.
- Legal/site localisation when Philipp chooses language scope.
- UI prose and synopsis anti-slop work only after the Session-257 proposal is explicitly approved and calibrated against the 40k vocabulary.

## Historical plan note

The 2026-05-02 reshuffle moved ingestion ahead of Discovery and moved Cartographer/Ask into Phase 5. That decision succeeded; all three phases are shipped. The 2026-07 workshop then evaluated the remaining wish list and moved all non-launch work into explicit backlog or drop decisions.
