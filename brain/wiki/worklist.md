---
title: Worklist — konsolidierte offene Arbeit
type: overview
created: 2026-07-01
updated: 2026-07-15
sources:
  - ../../sessions/README.md
  - ../../docs/launch-master-plan.md
  - ../../docs/post-launch-feature-ideas.md
  - ../../sessions/2026-07-15-219-impl-werkstatt-verankerung.md
  - ../../sessions/2026-07-14-218-impl-journey-spatial-audit.md
  - ../../sessions/2026-07-13-214-impl-curator-rework-legal-i18n.md
  - ../../sessions/2026-07-13-213-impl-map-mobile-rendering.md
  - ../../sessions/2026-07-12-204-impl-launch-s5-seo-observability.md
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

## A. Path to launch (per plan addendum 2026-07-15)

The mandatory hardening stretch **S0 + S1a–S10a is fully merged (PRs #240–#256)**; S10b is moot after the Session-213 device acceptance. The authoritative spec is [`docs/launch-master-plan.md`](../../docs/launch-master-plan.md) incl. the 2026-07-15 addendum (W1–W6). Remaining order:

1. **Workshop phase (active):** visit [`docs/post-launch-feature-ideas.md`](../../docs/post-launch-feature-ideas.md) — entry idea 2 (double-purchase warner) → idea 1 (Status Imperialis) → idea 3c (statistics), then ideas 4, 3a, 3b, 5, 6, the appendix as short triage, and the perfection candidates (§§ C/D below) under the same verdict scheme: **build / backlog / drop** per idea. Schema changes allowed; ideas-backlog-first convention (see [`roadmap.md`](./roadmap.md)) stays. Order, verdict ledger and kickoff prompts: [`docs/werkstatt-roadmap.md`](../../docs/werkstatt-roadmap.md).
2. **Pre-launch quality passes** after the feature wave: **S7b** (final live measurement repeats after gate-off) and the **S11 code PR** (pixel-identical).
3. **Launch-readiness** (12-point evidence) once the artist artwork is complete and the list is fully visited; then gate-off as flag flip → quiet window (PL1, final S7b live measurement, S11 documentation rollup) → Reddit post. No launch date pressure (W1).

## B. Operator checks

- **Migration `0015`:** production evidence still open — stays tracked as **launch-readiness point 1** (read-only parity check before any production write); no separate earlier action required.
- **Production drift:** optional but recommended `npm run db:drift` read-only check alongside the readiness pass.

## C. Perfection candidates — product (workshop-phase triage, verdict: build / backlog / drop)

- **Entity/desktop Chronicle restyle:** structural polish separate from launch correctness.
- **BrandBeacon:** current scroll mark is a placeholder; a real logo mark is optional.
- **Cartographer tails:** episode-anchor compatibility (`#ep-<slug>`), survey-mode/output-file-tracing follow-up, optional shareable voyage state; Great-Journey leg aesthetics/waypoint positions are eyeball polish.

## D. Perfection candidates — data (workshop-phase triage, same verdict scheme)

- **Galaspar and Myr:** absent from the frozen map source Excel, not a renderer bug. Refresh/reconcile the source before adding them; do not invent coordinates.
- **`arthas_moloch` → `moloch`:** optional curation link so Farsight works resolve to the chart pin.
- **Drukhari starters:** current faction-starter picks lack author/kind metadata and render sparse verdicts.
- **Podcast alias review:** 175 unresolved forms remain in `scripts/seed-data/podcast-aliases.review.md`; next deliberate entity-curation wave.
- **Character long tail:** 315 Stage-3 sentinels remain parked.

## E. Blocked / long-range

- **P8 topic strands + P9 character gallery** wait on B8 topic curation + B9 Primarch curation. Brief 129 remains the product/content spec.
- **B5 hand curation** continues through `curation-overlay.json` + dry-run/verify; no standalone session required.
- **OQ 16c:** Atlas event pages remain a separate non-launch enhancement; see [`open-questions.md`](./open-questions.md).
- **Personal library/community contributions** remain post-launch roadmap work (personal library also appears as an appendix idea in the feature list — triage decides).

## F. Resolved since the 2026-07-11 state

- **Muss-Strecke S1a–S10a** delivered and merged (PRs #240–#256): snapshot/DB-free build, loader contract, runtime role + credential cutover, CSP/login/audio, EN canonical routes + book ISR, SEO/observability, payload passes, required smoke set, Chronicle + Cartographer A11y.
- **Session-192 Pixel/Chrome verdict:** superseded and closed by the **Session-213 device acceptance** (Android Canvas renderer, PR #260 — pinch/pan fluid, flicker gone). **S10b is thereby factually done** and will not be built.
- **Cameo / `ask-fraktion` item: covered by S5 + 214–216.** The static `public/lab/ofob/**` prototypes were **removed in S5** (Session 204, PR #251, maintainer decision — they would also have loaded Google Fonts against the privacy policy); Sessions 214/216 (PRs #262/#263) delivered the live, maintainer-approved `/ask/faction` hierarchy (faction stepper + always-visible register + chapter choices + one answer, The-Curator frame). No open remainder; the Cameo study itself was consumed as design input rather than implemented 1:1.
- **Legal i18n:** resolved by Session 214 — English-first Imprint/Privacy with a stateless `?lang=de` switch; deliberately **no** `next-intl`/locale layer (the Session-187 research is superseded for the legal pages). Wider site localisation stays a roadmap item.
- **Signed audio URLs:** resolved in S3b (Session 201, PR #248) — audio plays from the public bucket, tokenless.
- **Espandor SSOT hazard:** fixed in the source Excel in Session 210; `import:map-worlds` reproduces the position.
