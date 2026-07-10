---
title: Roadmap
type: overview
created: 2026-05-09
updated: 2026-07-10
sources:
  - ../raw/historical/2026-05-08-pre-reset/ROADMAP.md
  - ../../sessions/README.md
  - ../../sessions/2026-07-10-193-impl-brain-launch-rollup.md
  - ../../sessions/2026-07-08-185-impl-website-review-mobile.md
  - ../../sessions/2026-07-09-190-impl-ui-refinements-great-journeys.md
related:
  - ./project-state.md
  - ./worklist.md
  - ./decisions/plan-reshuffle-2026-05-02.md
confidence: high
---

# Roadmap

> Phase-level direction. The executable queue is [`worklist.md`](./worklist.md); current facts are in [`project-state.md`](./project-state.md). Historical phase detail remains in git and the session log.

## Status snapshot (2026-07-10)

| Phase | Status | Current result |
|---|---|---|
| 1 — Foundation | shipped | Next.js/TypeScript/Drizzle/Supabase/Vercel, migrations, CI and preview environment |
| 2 — Chronicle | shipped | Event-backed cinematic + index timeline with curated Era/event art |
| 3 — Content ingestion | shipped; maintenance | 896-book per-book SSOT, additive podcast delta, weekly detection/review, idempotent apply/verify paths; crawler/LLM engines retired |
| 4 — Discovery | core shipped | Archive, Podcasts, Compendium, book/entity/person detail and universal search; personal library remains future work |
| 5 — Cartographer + Ask | shipped | Static 1,055-world Cartographer with Great Journeys and a four-question recommendation tool; targeted polish remains |
| 6 — Community | post-launch | Public submissions, review/merge workflow and credits |
| 7 — Polish & launch | **current** | Preview-gated product; serial launch-hardening programme and final readiness evidence |

## Phase 7 — launch programme

The launch programme is intentionally serial. Detailed specs live in maintainer-local working files; durable milestones are:

1. **Decide and align:** final URL/redirect/canonical matrix, production host, Era truth and error-tracker choice; make release/revalidation/credential ordering internally consistent.
2. **Build without production DB:** versioned public build projections, manifest and DB-free consumers; required production-build gate.
3. **Runtime correctness:** clear loader error semantics, cache/coalescing behavior, least-privilege DB roles, migration rehearsal, CSP/login/health/audio hardening.
4. **Public contract:** canonical routes + book ISR, sitemap/robots/metadata/OG/structured data, cookieless analytics, optional error-only reporting, launch/rollback runbook.
5. **Payload and accessibility:** Archive/search payload, route CSS/fonts/LCP, small Playwright+axe suite, Chronicle and Cartographer keyboard/screenreader/mobile paths.
6. **Readiness:** content freeze; migration/drift/role/config/domain/audio/device evidence; final reviewed snapshot deploy; rollback target; gate-off deploy and live crawl smoke.

The gate does not open with known core-tool accessibility or payload failures. Map rendering/LOD work is conditional on real-device measurement after the mandatory payload/A11y pass.

## Post-launch

- Remove the full preview login/invite mechanism and its activation table after the launch is stable.
- Optional MediaPlayer/chrome/assets pass, only with before/after measurements.
- Code cleanup and Brain/session rollup in separate PRs.
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
