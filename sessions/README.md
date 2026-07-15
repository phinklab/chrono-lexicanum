# Sessions

This folder is the project's history. Architect briefs and implementer reports use one Markdown file per session.

For naming, lifecycle and archiving, see [`brain/wiki/workflows/sessions-format.md`](../brain/wiki/workflows/sessions-format.md).

## Quick reference

- **Naming:** `YYYY-MM-DD-NNN-{arch|impl}-{slug}.md`
- **NNN:** monotonically increasing across the project
- **Templates:** [`_templates/`](./_templates/)
- **Drafts:** `_drafts/` (gitignored)
- **Canonical open-work queue:** [`brain/wiki/worklist.md`](../brain/wiki/worklist.md)
- **Architecture questions:** [`brain/wiki/open-questions.md`](../brain/wiki/open-questions.md)
- **Cosmetic UI polish:** [`docs/ui-backlog.md`](../docs/ui-backlog.md)
- **Archive:** closed sessions normally move to [`archive/YYYY-MM/`](./archive/); the July root cleanup stays deferred until the launch campaign wraps (the tracked prompt collection still references reports at their root paths).

## Current head — 2026-07-15

`main` is at `55a8ea7` (journey chart-point curation merged, PR #264). The product is in the **pre-launch workshop phase** behind the preview gate.

- **Mandatory launch stretch done:** S0 + S1a–S10a all merged (Sessions 194–209, PRs #240–#256) — snapshot/DB-free build, loader contract, runtime role + cutover, CSP/login/audio, EN canonical routes + book ISR, SEO/Sentry/analytics, payload passes, required smoke set, Chronicle + Cartographer A11y. S10b is moot after the Session-213 device acceptance.
- **Map wave 210–218:** static-dash route rendering + compositing fix (210/211, PRs #257–#259); **Android Canvas renderer device-accepted** (213, PR #260); Great Journeys reworked to **11 journeys / 231 acts** with 64 sourced chart points and 13 Black-Crusade sorties (214/215/217/218, PRs #261/#264). Session 212's attempt failed on-device and was fully rolled back (see its tombstone); the fix landed as 213.
- **Curator + legal (214/216, PRs #262/#263):** `Ask the Archive` → **The Curator** with a two-path threshold and a rebuilt faction path (stepper + always-visible register + chapters + one answer); Imprint/Privacy are English-first with `?lang=de`.
- **Workshop phase (Session 219, 2026-07-15):** no launch date pressure — release waits for complete artist artwork and a fully *visited* feature wish list ([`docs/post-launch-feature-ideas.md`](../docs/post-launch-feature-ideas.md), verdict per idea: build / backlog / drop). Entry idea 2 → 1 → 3c; S7b + S11 code PR run pre-launch; preview gate + invite machinery stay load-bearing; release endgame fixed (freeze → readiness → flag flip → quiet window → Reddit). E8 single-worktree mode extended through launch-readiness. Durable record: plan addendum in [`docs/launch-master-plan.md`](../docs/launch-master-plan.md).
- **Corpus/runtime:** 896 per-book SSOT books; 1,114 podcast episodes (W28); 40 DB-free test suites; DB-free build with 1,293 static pages; sitemap 2,277 URLs.
- **Operator checks:** migration `0015` stays embedded as launch-readiness point 1; optional production `db:drift` alongside it.
- **Next:** workshop phase, starting with idea 2 (double-purchase warner).

## Active / load-bearing threads

| Session | Role | Status | Topic |
|---|---|---|---|
| [219-impl-werkstatt-verankerung](./2026-07-15-219-impl-werkstatt-verankerung.md) | implementer | complete | Workshop phase anchored: plan addendum W1–W6, idea list committed, brain reconcile through 218, artifact hygiene. |
| [218-impl-journey-spatial-audit](./2026-07-14-218-impl-journey-spatial-audit.md) | implementer | complete | Full spatial audit of 64 synthetic chart points, Black Crusade colours/sections, Indomitus fleet network (PR #264). |
| [217-impl-journey-lore-prototypes](./2026-07-14-217-impl-journey-lore-prototypes.md) | implementer | complete | Sourced chart points replace invisible waypoints; Abaddon as 13 Eye-origin sorties (PR #264 with 218). |
| [216-impl-curator-spacing-polish](./2026-07-13-216-impl-curator-spacing-polish.md) | implementer | complete | Curator lower masthead composition, Cardo register typography, exact rail geometry (PR #263). |
| [215-impl-great-journeys-five-route-expansion](./2026-07-13-215-impl-great-journeys-five-route-expansion.md) | implementer | complete | Gaunt, Lion, Abaddon, Yvraine, Ghazghkull added → eleven-journey roster (PR #261, with the 214 research pass). |
| [214-impl-curator-rework-legal-i18n](./2026-07-13-214-impl-curator-rework-legal-i18n.md) | implementer | complete | The Curator rename + faction-path rebuild; English-first legal pages with `?lang=de` (PR #262). |
| [214-impl-great-journeys-research-pass](./2026-07-13-214-impl-great-journeys-research-pass.md) | implementer | complete | Roster rework (Farsight/Khan out, four routes expanded) + five researched journey candidates (PR #261). |
| [213-impl-map-mobile-rendering](./2026-07-13-213-impl-map-mobile-rendering.md) | implementer | complete | Canonical Android fix: bounded Canvas2D renderer, shared camera core, full-route fit — device-accepted; closes the 192 verdict, moots S10b (PR #260). |
| [212-impl-map-render-pipeline](./2026-07-13-212-impl-map-render-pipeline.md) | implementer | superseded | On-device failure, fully rolled back; original report lost untracked — tombstone reconstructed in Session 219. Fix landed as 213. |
| [210/211 map feedback + compositing](./2026-07-13-210-impl-map-feedback-pass.md) | implementer | complete | Static-dash route rendering, journey-flow cleanup, Espandor SSOT fix, iOS ghost-layer fix (PRs #257–#259). |
| [196–209 launch wave S1a–S10a](./2026-07-11-196-impl-launch-s1a-snapshot-exporter.md) | implementer | complete | The mandatory hardening stretch, one session per plan step (PRs #242–#256). |
| [129-arch-doorways-curation-layer](./2026-06-04-129-arch-doorways-curation-layer.md) | architect | open spec | Topic strands + character gallery wait on B8/B9 curation. |
| [121 Product board](./2026-06-03-121-arch-product-board.md) | architect | open board | Historic status board; current ordering lives in the worklist. |
| [122 Batches board](./2026-06-03-122-arch-batches-board.md) | architect | open board | Ongoing hand/data curation; current ordering lives in the worklist. |

Older status/history is in [`brain/wiki/log.md`](../brain/wiki/log.md), git and the monthly archive folders.
