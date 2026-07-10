---
title: Worklist — konsolidierte offene Arbeit
type: overview
created: 2026-07-01
updated: 2026-07-10
sources:
  - ../../sessions/README.md
  - ../../sessions/2026-07-10-193-impl-brain-launch-rollup.md
  - ../../sessions/2026-07-06-178b-impl-map-polish.md
  - ../../sessions/2026-07-08-185-impl-website-review-mobile.md
  - ../../sessions/2026-07-08-187-impl-artwork-footer-mobile-i18n.md
  - ../../sessions/2026-07-09-190-impl-ui-refinements-great-journeys.md
  - ../../sessions/2026-07-10-192-impl-mobile-cartographer-canvas.md
  - ../../ingest/refresh/2026-W28/report.md
  - ../../sessions/2026-06-03-121-arch-product-board.md
  - ../../sessions/2026-06-03-122-arch-batches-board.md
related:
  - ./project-state.md
  - ./open-questions.md
  - ./deferred-questions.md
confidence: high
---

# Worklist

> **Canonical queue for open work.** Current state only; completed history lives in [`log.md`](./log.md) and session reports. Cosmetic-only details remain in [`docs/ui-backlog.md`](../../docs/ui-backlog.md).

## A. Launch sequence

The maintainer-local launch plan is the active execution programme. Its detailed specs and prompts intentionally remain untracked; this page records only durable order and gates.

1. **S0 — decisions + plan preflight (next).**
   - Decide final URL matrix, canonical production host/domain, Era policy and optional error-only tracker.
   - Correct four release-order issues before S1a: no production apply from unmerged Era code; revalidation after snapshot deploy (or explicitly suppressible); wire the runtime credential into the actual DB client; split the final snapshot deploy from the coordination evidence report.
   - Brief 181 is implemented via Session 185. Brief 182 is superseded by the launch programme, not implemented.
2. **Build stability.** Versioned public build projections + manifest; DB-free build consumers and required build gate; loader error semantics/caches; least-privilege runtime/migration credentials; CSP/login/health/audio hardening.
3. **Launch contract.** Canonical routes and book ISR; book projection added to the snapshot; SEO/robots/sitemap/OG/observability plus launch/rollback runbook.
4. **Payload and accessibility.** Search/Archive payload; route CSS/fonts/LCP; small required Playwright+axe set; Chronicle A11y/mobile; Cartographer payload/A11y. Map LOD only after a failing real-device measurement.
5. **Launch-readiness.** Content freeze, migration/drift/role evidence, final snapshot PR/deploy, production configuration, domain/audio/cache/device checks, rollback target, gate-off deploy and live crawl smoke.
6. **Post-launch.** Remove preview machinery, then optional MediaPlayer/chrome/assets work and a separate code + documentation cleanup pair.

## B. Immediate checks

- **Migration `0015`:** no durable evidence that the index migration reached production. Verify before launch.
- **Production drift:** optional but recommended `npm run db:drift` read-only check after the release workflow is settled.
- **Session 192 physical-device verdict:** confirm the Canvas route-motion path on Philipps Pixel/Chrome preview. Session 191's SVG motion-plane result is superseded.
- **Local plan safety:** the two launch working files are deliberately untracked. Preserve them locally, but do not cite them as committed Brain sources and do not let a cleanup remove them mid-campaign.

## C. Product follow-ups outside or after the gate

- **Cameo implementation:** the sharpened Cameo study is Philipps selected `/ask/fraktion` hierarchy, but only static prototypes exist under `public/lab/ofob/`. Implement live or explicitly defer; S5 must remove or consciously expose the prototypes before gate-off.
- **Legal i18n:** Session 187 researched `next-intl` without locale routing for EN-default + EN/DE legal pages, with later EN/DE/RU subpaths. No translation or runtime i18n exists yet; needs its own brief.
- **Entity/desktop Chronicle restyle:** the large mobile/design wave shipped, but this structural polish remains separate from launch correctness.
- **BrandBeacon:** current scroll mark is a placeholder; a real logo mark is optional.
- **Cartographer tails:** episode-anchor compatibility (`#ep-<slug>`), survey-mode/output-file-tracing follow-up and optional shareable voyage state. Great-Journey leg aesthetics/waypoint positions are eyeball polish, not blockers.

## D. Data follow-ups

- **Galaspar and Myr:** absent from the frozen map source Excel, not a renderer bug. Refresh/reconcile the source before adding them; do not invent coordinates.
- **`arthas_moloch` → `moloch`:** optional curation link so Farsight works resolve to the chart pin.
- **Drukhari starters:** current faction-starter picks lack author/kind metadata and render sparse verdicts.
- **Podcast alias review:** 175 unresolved forms remain in `scripts/seed-data/podcast-aliases.review.md`; next deliberate entity-curation wave.
- **Signed audio URLs:** current committed Supabase audio URLs expire around June 2027. Migrate to verified public tokenless URLs before then; this is already included in launch hardening.
- **Character long tail:** 315 Stage-3 sentinels remain parked.

## E. Blocked / long-range

- **P8 topic strands + P9 character gallery** wait on B8 topic curation + B9 Primarch curation. Brief 129 remains the product/content spec.
- **B5 hand curation** continues through `curation-overlay.json` + dry-run/verify; no standalone session required.
- **OQ 16c:** Atlas event pages remain a separate non-launch enhancement; see [`open-questions.md`](./open-questions.md).
- **Personal library/community contributions** remain post-launch roadmap work.

## F. Resolved since the 2026-07-06 rollup

- Brief 181 Product Prune, P7 cleanup and most of P13/mobile were delivered across Sessions 185–190.
- DirectionPanel/photo/proof controls, generated zones, Rift-unrest, the zone-editor handoff, the 24-blurb filler and the Rift-spine TODO are resolved: 15 curated zones, hard dev-only editor, 923 world blurbs and zone-derived Cicatrix boundary.
- Weekly W28 was reviewed: two book candidates ignored, ten podcast episodes applied, show/book cursors advanced. The old four-show apply reminder and Weekly PR #200 are closed.
