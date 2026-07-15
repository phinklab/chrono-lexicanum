---
title: Project state
type: overview
created: 2026-05-09
updated: 2026-07-15
sources:
  - ../../sessions/README.md
  - ../../docs/launch-master-plan.md
  - ../../docs/post-launch-feature-ideas.md
  - ../../sessions/2026-07-15-219-impl-werkstatt-verankerung.md
  - ../../sessions/2026-07-14-218-impl-journey-spatial-audit.md
  - ../../sessions/2026-07-14-217-impl-journey-lore-prototypes.md
  - ../../sessions/2026-07-13-216-impl-curator-spacing-polish.md
  - ../../sessions/2026-07-13-215-impl-great-journeys-five-route-expansion.md
  - ../../sessions/2026-07-13-214-impl-curator-rework-legal-i18n.md
  - ../../sessions/2026-07-13-214-impl-great-journeys-research-pass.md
  - ../../sessions/2026-07-13-213-impl-map-mobile-rendering.md
  - ../../sessions/2026-07-13-210-impl-map-feedback-pass.md
  - ../../sessions/2026-07-12-204-impl-launch-s5-seo-observability.md
related:
  - ./worklist.md
  - ./open-questions.md
  - ./roadmap.md
  - ./architecture.md
  - ./pipeline-state.md
  - ./log.md
confidence: high
---

# Project state — 2026-07-15

> Current-state anchor. History lives in [`log.md`](./log.md), git and the session reports.

## Phase

Chrono · Lexicanum is in the **pre-launch workshop phase** (decided 2026-07-15, Session 219). The mandatory launch-hardening stretch is complete: **S0 and S1a–S10a are all merged (PRs #240–#256)**, and the conditional map-LOD session S10b became moot after the Session-213 device acceptance. The durable decision record is the addendum in [`docs/launch-master-plan.md`](../../docs/launch-master-plan.md) (§ Entscheidungen → "Nachtrag — Werkstatt-Phase", W1–W6):

- **No launch date pressure.** Release waits for (i) the complete artist artwork and (ii) the whole feature wish list being *visited* — every idea gets an evaluation round and a maintainer verdict **build / backlog / drop**, not necessarily an implementation.
- **Workshop phase before the gate:** entry order idea 2 (double-purchase warner) → idea 1 (Status Imperialis) → idea 3c (statistics), then ideas 4, 3a, 3b, 5, 6 and a short triage of the appendix plus the worklist's perfection candidates. Schema changes are allowed; ideas-backlog-first convention stays. The list is canonical in-repo: [`docs/post-launch-feature-ideas.md`](../../docs/post-launch-feature-ideas.md).
- **Pre-launch quality passes:** S7b (measurable behind the gate; one final live measurement repeats after gate-off) and the pixel-identical S11 code PR after the feature wave.
- **Preview gate stays on; the invite machinery is load-bearing infrastructure until launch** (artist previews via the preview console, individually revocable codes). PL1 never runs before launch.
- **Fixed release endgame:** content freeze → launch-readiness (12 points, unchanged) → gate-off as a minimal flag flip → quiet window (PL1, final S7b live measurement, S11 documentation rollup) → only then the Reddit post.
- **E8 single-worktree exception extended** through launch-readiness inclusive.

## Working mode

- `main` is read-only; every durable change reaches it through a task branch and PR.
- Sessions run serially from the **coordination worktree** (E8, extended per W6). PR contents remain strand-pure; `brain/**` and `sessions/README.md` remain coordination-only.
- Session kickoff during the workshop phase comes from maintainer prompts; implementer reports remain mandatory.

## Product now

- **App:** preview-gated at <https://www.chrono-lexicanum.com/> (canonical host; `chrono-lexicanum.vercel.app` is secondary). `PREVIEW_GATE=off` is the launch flip; `noindex` is build-baked until then.
- **Routes are fully English since S4 (Session 202):** `/book`, `/character`, `/faction`, `/world` (+ `/person`, which covers authors and narrators), EN Compendium categories, `/ask/faction`; all old German paths 308 with query strings preserved. The book page is SSG/ISR from the snapshot.
- **The Curator** (Sessions 214/216, PRs #262/#263): `Ask the Archive` was renamed; `/ask` presents a two-path threshold (questionnaire vs. faction path) behind a compact switch. The faction path replaced the word cloud with a faction stepper, an always-visible 18-faction register, optional chapter choices and one answer; quiz rail geometry is exact down to 320 px; register and choices use Cardo display typography. URLs stayed `/ask` + `/ask/faction`.
- **Legal:** Imprint/Privacy are English-first documents with a stateless `?lang=de` switch (Session 214) — no cookie, no locale layer. Deeper site i18n remains future roadmap work.
- **SEO/observability (S5, Session 204):** server-only `SITE_URL` (prod build fails without it), snapshot-built `sitemap.xml` (2,277 URLs), canonicals + per-route OG, JSON-LD, Vercel Web Analytics + Speed Insights, and an error-only Sentry setup (client via same-origin tunnel, server envelope; both proven end-to-end). `public/lab/ofob/**` prototypes were **removed** (maintainer decision in S5).
- **Hardening highlights:** DB-free production build from versioned snapshot artifacts (S1a/S1b, CI-gated), loader contract data/null/throw with tagged caches (S2), least-privilege `chrono_runtime` role + migration rehearsal + fail-loud post-deploy revalidation (S3a), CSP without prod `unsafe-eval`, timing-safe login, public-bucket audio, runtime-credential cutover (S3b), Archive server pagination + lazy search index (S6), route CSS split + font cleanup (S7a), required Playwright+axe smoke set in CI (S8), Chronicle keyboard/SR/mobile pass (S9).

## Cartographer

- **Two renderers, one data/interaction model (Session 213, PR #260):** Android defaults to a bounded Canvas2D stage, desktop keeps SVG; shared camera core, `?mapRenderer=` override for parity testing. **Device-accepted by the maintainer on the real Android phone — pinch/pan fluid, flicker gone.** This closed the old Session-192 verdict and made S10b moot. Route lines render as static dashes; repaints only on camera frames plus a bounded draw-in window (Sessions 210/211, PRs #257–#259).
- **Great Journeys: 11 journeys / 231 acts** (Sessions 214/215/217/218, PRs #261/#264). The 214 research pass removed Farsight and Jaghatai Khan and expanded four routes; 215 added Gaunt, Lion, Abaddon, Yvraine and Ghazghkull; 217/218 replaced every invisible waypoint with **64 sourced synthetic chart points** (relative/schematic precision disclosed in the UI with rationale + source link), rebuilt Abaddon as **13 Eye-origin Black Crusade sorties** (42 stations) with per-crusade colours, made Indomitus a three-fleet network, and re-audited all synthetic coordinates against zones/regions/Warp breaks. No invented coordinates; `test:voyages` covers the contracts (1,163+ checks).
- **Payload/A11y (S10a, Session 209):** per-world details load lazily through the `PinSource.detail()` seam; world list + seek are fully keyboard operable; focus restore proven; the mobile sheet is deliberately modal.
- Base data: 1,055 worlds from committed `map-worlds.json`, 15 hand-curated zones, 923 lazy world blurbs. Espandor is fixed **in the source Excel** since Session 210 — `import:map-worlds` reproduces it (the old revert hazard is gone).

## Data and operations

- **Books:** 896 canonical per-book files (599 W40K + 297 HH), 196 collection edges; `apply:book --all` is the corpus materializer inside the nine-step `db:sync`.
- **Podcasts:** four shows, 1,114 episodes (W28 state); maintenance via the weekly refresh.
- **Era truth:** the blanket `time_ending` stamp is gone (S1a); `primary_era_id` is mechanically bucketed from setting dates, else `NULL` — data invariant verified in production.
- **CI:** lint, typecheck, `brain:lint`, **40 DB-free test suites**, DB-free `next build` (1,293 static pages) and the S8 smoke set are required gates.
- **Database:** runtime uses `RUNTIME_DATABASE_URL` (least-privilege role); migrations rehearsed in CI. Migration `0015` production evidence remains embedded as launch-readiness point 1.

## Open now

The canonical queue is [`worklist.md`](./worklist.md). In workshop-phase order:

1. **Feature triage wave:** idea 2 → 1 → 3c, then 4, 3a, 3b, 5, 6, appendix triage, perfection-candidate triage (verdict per idea: build / backlog / drop).
2. **Pre-launch quality passes** after the feature wave: S7b, S11 code PR.
3. **Launch-readiness** (12-point evidence, includes the migration-0015 check) once artwork is complete and the list is fully visited.

## Next action

Start the workshop phase with **idea 2 (double-purchase warner / containment explorer)** per the plan addendum's entry order.
