---
title: Project state
type: overview
created: 2026-05-09
updated: 2026-07-23
sources:
  - ../../sessions/README.md
  - ../../docs/launch-master-plan.md
  - ../../docs/werkstatt-roadmap.md
  - ../../sessions/2026-07-23-259-impl-dependency-audit-fix.md
  - ../../sessions/2026-07-21-257-impl-text-delint-emdash.md
  - ../../sessions/2026-07-21-256-impl-nav-curator-compendium.md
  - ../../sessions/2026-07-21-255-impl-sitewide-ui-nav-typography.md
  - ../../sessions/2026-07-21-254-impl-werkstatt-wpb1-arthas-moloch.md
  - ../../sessions/2026-07-20-253-impl-werkstatt-wab1-archive-facet-filters.md
  - ../../sessions/2026-07-20-252-impl-werkstatt-f3b1-librarium-statistics.md
  - ../../sessions/2026-07-20-251-impl-werkstatt-f1b2-status-imperialis.md
  - ../../sessions/2026-07-20-250-impl-werkstatt-f1b1-m42-dates.md
  - ../../sessions/2026-07-19-249-impl-map-ui-rework.md
  - ../../sessions/2026-07-18-247-impl-map-timeline.md
  - ../../sessions/2026-07-18-246-impl-map-time-states-ui.md
  - ../../sessions/2026-07-17-245-impl-map-flicker-fix.md
  - ../../sessions/2026-07-15-220-impl-great-crusade-journey-audit.md
  - ../../sessions/2026-07-16-234-impl-indomitus-journey-audit.md
related:
  - ./worklist.md
  - ./open-questions.md
  - ./roadmap.md
  - ./architecture.md
  - ./pipeline-state.md
  - ./log.md
confidence: high
---

# Project state — 2026-07-23

> Current-state anchor. History lives in [`log.md`](./log.md), git and the session reports.

## Phase

Chrono · Lexicanum is at the end of the **pre-launch workshop phase**. The mandatory hardening stretch S0 + S1a–S10a was already complete; the subsequent workshop programme has now visited the full wish list and finished its construction wave through Fahrplan item 11b. The canonical ledger and remaining order live in [`docs/werkstatt-roadmap.md`](../../docs/werkstatt-roadmap.md).

- Evaluation rounds 235–244 assigned every candidate a maintainer verdict: build, backlog or drop. PR #268 is the numbering authority: the Journey audits are Sessions 220–234 and the evaluation rounds are 235–241.
- The selected construction work is merged through Sessions 245–254 / PRs #275–#280 and #282–#285: Cartographer rendering and time states, task-oriented Map UI, M42 dating, `/now`, `/statistics`, Archive facets and the Arthas Moloch pin.
- **W3a-B1 character connections moved to the post-launch backlog on 2026-07-22.** Its co-occurrence-v1 cut is still decision-ready in the workshop roadmap, but it is no longer a pre-launch task.
- Sessions 255–257 / PRs #286–#288 added the current site-wide navigation and typography system, folded the Curator tools into the Compendium, and introduced the required rendered-text Em-dash lint.
- Session 259 / PR #291 restored the production dependency audit after new PostCSS/Sharp advisories: Next and its ESLint preset are on 16.2.11, and narrow overrides deduplicate Next onto the patched direct dependencies.

The only pre-launch implementation work left is **S7b**, then the pixel-identical **S11 code PR**, followed by the fixed launch endgame. Release still waits for the complete artist artwork; there is no launch-date pressure.

## Working mode

- `main` is read-only; every durable change reaches it through a task branch and PR.
- Launch/workshop sessions run serially from the **coordination worktree** under the temporary E8 exception. PR contents remain strand-pure; `brain/**` and `sessions/README.md` remain coordination-only.
- The preview gate and individually revocable invite machinery remain load-bearing until gate-off. PL1 never runs before launch.

## Product now

- **App:** preview-gated at <https://www.chrono-lexicanum.com/>. `PREVIEW_GATE=off` is the launch flip; a new production deploy is required to remove the build-baked `noindex` state.
- **Information architecture:** the primary nav is flat and unnumbered, with **The Library** first (Archive, Compendium) and **Explore** second (Cartographer, Chronicle, Status Imperialis, Librarium). Cartographer remains the leading Explore entry. The shared site menu uses the same source of truth.
- **Compendium / recommendations:** the Curator no longer exists as a separate destination. `Four Questions` and `One Faction, One Book` are Guided Picks inside the Compendium; old `/ask` paths 308 to their new routes with query/deep-link continuity.
- **Archive:** a single Filters control opens a shareable multi-facet ledger. Semantics are OR within a category and AND between categories; Faction, Format and six curated facet groups share one URL contract, with sort direction toggles and honest zero-result counts.
- **Current era and statistics:** `/now` presents Status Imperialis from the M42-dating foundation; `/statistics` presents the Librarium as server-rendered, dependency-free SVG/HTML data views.
- **Typography and copy hygiene:** Mastheads share the `.lx-hero__*` voice stack and the token ladder now documents text roles. CI runs `npm run text:lint`; rendered text under `src/` contains no U+2014 Em dashes. The broader editorial/slop and synopsis pass remains a separate, unapproved follow-up.
- **Hardening foundation:** DB-free production builds, typed loader error semantics, least-privilege runtime credentials, English canonical routes, SEO/observability, server pagination, split route CSS, required Playwright+axe smoke tests and Chronicle/Cartographer accessibility remain in place.

## Cartographer

- The chart has three discrete time states (`pre`, `hh`, `now`) with shared hash state, renderer-parity zone filtering and era-aware instruments. Great Journeys can change state at authored act boundaries; `voyage=<id>` links restore a journey.
- The Cartouche is now title + one interactive legend; Great Journeys are the prominent content entry, and the world index remains available as the keyboard/AT path. Journey rendering uses Canvas on all viewports while the SVG layer stays paint-static, eliminating the desktop flicker.
- Sessions 220–234 completed the full journey audit after PR #265; `The Warmaster's Web` is an independent 18-Legion journey, and the character/campaign routes use sourced or explicitly schematic placement rather than invented precision.
- The chart pin `moloch` is linked to `arthas_moloch`, displayed as **Arthas Moloch**, and carries its book + podcast works. The source pipeline now supports a display-only `Name-Override` column while retaining the legacy Excel header on read.
- Base data remains the committed map catalog (1,055 worlds) plus hand-curated zones and lazy world detail payloads; the production app does not depend on build-time database access for the Map.

## Data and operations

- **Books:** 896 canonical per-book files (599 W40K + 297 HH), 196 collection edges; `apply:book --all` remains the corpus materializer inside `db:sync`.
- **Podcasts:** four shows, 1,114 episodes at the last recorded weekly state; maintenance uses the additive delta/weekly-refresh path.
- **Era truth:** 25 additional M42 setting dates support Status Imperialis. The blanket `time_ending` stamp remains removed; `primary_era_id` is mechanically bucketed from setting dates or left `NULL`.
- **CI:** lint, typecheck, `brain:lint`, the DB-free test/build gates, smoke tests, rendered-text lint and the production dependency audit are required. The audit baseline is green on Next 16.2.11 with PostCSS 8.5.16 and Sharp 0.35.3.
- **Database:** runtime uses `RUNTIME_DATABASE_URL`; migration `0015` production evidence remains launch-readiness point 1.

## Open now

The canonical queue is [`worklist.md`](./worklist.md). Only the launch line remains:

1. **S7b — Player / Chrome / Assets:** run behind the preview gate; repeat the final live measurement after gate-off.
2. **S11 code PR:** pixel-identical cleanup after S7b. Its Brain/session documentation rollup stays in the quiet window.
3. **Launch endgame:** complete artwork + content freeze → 12-point Launch-Readiness → minimal gate-off flag flip + production deploy → quiet window (PL1, final S7b live measurement, S11 documentation rollup) → Reddit post.

## Next action

Run **S7b** from the launch prompt collection. W3a-B1 and every other deferred idea stay out of the pre-launch queue.
