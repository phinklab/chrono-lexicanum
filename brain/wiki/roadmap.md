---
title: Roadmap
type: overview
created: 2026-05-09
updated: 2026-07-15
sources:
  - ../raw/historical/2026-05-08-pre-reset/ROADMAP.md
  - ../../sessions/README.md
  - ../../docs/launch-master-plan.md
  - ../../docs/post-launch-feature-ideas.md
  - ../../sessions/2026-07-10-193-impl-brain-launch-rollup.md
  - ../../sessions/2026-07-09-190-impl-ui-refinements-great-journeys.md
related:
  - ./project-state.md
  - ./worklist.md
  - ./decisions/plan-reshuffle-2026-05-02.md
confidence: high
---

# Roadmap

> Phase-level direction. The executable queue is [`worklist.md`](./worklist.md); current facts are in [`project-state.md`](./project-state.md). Historical phase detail remains in git and the session log.

## Status snapshot (2026-07-15)

| Phase | Status | Current result |
|---|---|---|
| 1 — Foundation | shipped | Next.js/TypeScript/Drizzle/Supabase/Vercel, migrations, CI and preview environment |
| 2 — Chronicle | shipped | Event-backed cinematic + index timeline with curated Era/event art |
| 3 — Content ingestion | shipped; maintenance | 896-book per-book SSOT, additive podcast delta, weekly detection/review, idempotent apply/verify paths; crawler/LLM engines retired |
| 4 — Discovery | core shipped | Archive, Podcasts, Compendium, book/entity/person detail and universal search; personal library remains future work |
| 5 — Cartographer + Ask | shipped | Static 1,055-world Cartographer with Great Journeys and a four-question recommendation tool; targeted polish remains |
| 6 — Community | post-launch | Public submissions, review/merge workflow and credits |
| 7 — Polish & launch | **current: workshop phase** | Mandatory hardening (S1a–S10a) merged; pre-launch workshop phase visits the feature wish list before the gate |

## Phase 7 — launch programme

The mandatory launch-hardening stretch (S0 and S1a–S10a) is fully merged (PRs #240–#256); the conditional map-LOD session became moot after the Session-213 device acceptance. Per the 2026-07-15 plan addendum (`docs/launch-master-plan.md` § Entscheidungen → "Nachtrag — Werkstatt-Phase"), the remaining path to launch is:

1. **Workshop phase (now):** visit the whole feature wish list ([`docs/post-launch-feature-ideas.md`](../../docs/post-launch-feature-ideas.md)) — entry order idea 2 → 1 → 3c, then 4, 3a, 3b, 5, 6 plus a short triage of the appendix and the worklist's perfection candidates. Every idea gets a maintainer verdict *build / backlog / drop*; schema changes are allowed (ideas-backlog-first convention below still applies).
2. **Pre-launch quality passes:** S7b (final live measurement repeats after gate-off) and the pixel-identical S11 code PR.
3. **Readiness and release endgame:** content freeze → 12-point launch-readiness evidence → gate-off as a minimal flag flip → quiet window (PL1, final S7b live measurement, S11 documentation rollup) → Reddit post.

There is no launch date pressure: the release additionally waits for the complete artist artwork. The preview gate and the invite machinery stay load-bearing until launch.

## Ideas backlog

Per convention, features enter here before any brief. From the 2026-07-13 idea list, the three schema-implicating ideas (details and evidence in [`docs/post-launch-feature-ideas.md`](../../docs/post-launch-feature-ideas.md)):

- **Character interaction tree (idea 3a):** co-occurrence works on existing `work_characters`, but real relationship semantics would need a new curated edge table (`character_relations` or similar).
- **Podcasts on the book detail page (idea 5):** no direct book↔episode edge exists; v1 could derive via shared events, a clean version needs a curated `episode_covers_work` junction (maintainable via the weekly refresh).
- **Size comparison "Scala Imperialis" (idea 6):** only feature without any DB basis; needs a new table (e.g. `size_entries` with min/max size, category, source, confidence, silhouette asset).

## Post-launch (quiet window and beyond)

- Remove the full preview login/invite mechanism and its activation table in the quiet window after gate-off (PL1) — never before launch.
- Final S7b live measurement and the S11 documentation rollup also land in the quiet window; the passes themselves run pre-launch.
- Expand Chronicle/Cartographer/editorial content from observed user needs rather than speculative systems.

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

## Historical plan note

The 2026-05-02 reshuffle moved ingestion ahead of Discovery and moved Cartographer/Ask into Phase 5. That decision succeeded: all three phases are now shipped. Old crawler/batched-backfill subphase prose is historical and no longer an operational roadmap.
