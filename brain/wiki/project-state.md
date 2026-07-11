---
title: Project state
type: overview
created: 2026-05-09
updated: 2026-07-11
sources:
  - ../../sessions/README.md
  - ../../sessions/2026-07-11-195-impl-launch-release-preflight.md
  - ../../sessions/2026-07-11-194-impl-launch-s0.md
  - ../../docs/launch-master-plan.md
  - ../../sessions/2026-07-10-193-impl-brain-launch-rollup.md
  - ../../sessions/2026-07-06-178b-impl-map-polish.md
  - ../../sessions/2026-07-08-185-impl-website-review-mobile.md
  - ../../sessions/2026-07-08-186-impl-mobile-feedback-round-2.md
  - ../../sessions/2026-07-09-190-impl-ui-refinements-great-journeys.md
  - ../../sessions/2026-07-10-192-impl-mobile-cartographer-canvas.md
  - ../../ingest/refresh/2026-W28/report.md
  - ../../sessions/archive/2026-06/2026-06-28-170-impl-per-book-ssot.md
  - ../../sessions/archive/2026-06/2026-06-30-171-impl-per-book-ssot-migration.md
  - ../../sessions/2026-07-01-172-impl-podcast-weekly-maintenance.md
related:
  - ./worklist.md
  - ./open-questions.md
  - ./roadmap.md
  - ./architecture.md
  - ./pipeline-state.md
  - ./log.md
confidence: high
---

# Project state — 2026-07-11

> Current-state anchor. History lives in [`log.md`](./log.md), git and the session reports.

## Phase

Chrono · Lexicanum is in **pre-launch hardening**. The public product shape is complete: Chronicle, Cartographer, Ask the Archive, Archive/Podcasts, Compendium and entity/book detail surfaces are live behind the temporary preview gate. The old crawler/backfill phase is retired; content maintenance is the per-book SSOT plus additive podcast and weekly-refresh flows.

The active programme is a serial launch campaign. Since S0 (Session 194) its master plan and kickoff prompts are canonical in-repo documents: [`docs/launch-master-plan.md`](../../docs/launch-master-plan.md) (spec + decisions + URL matrix appendix) and [`docs/launch-session-prompts.md`](../../docs/launch-session-prompts.md) (kickoff prompts). Brain records decisions, order and current blockers; planned work is not described as shipped.

## Working mode

- `main` is read-only; every durable change still reaches it through a task branch and PR.
- During the launch campaign only, sessions run serially from the **coordination worktree**. This is a temporary exception to worktree routing, not to strand-pure PR contents or Rollup Ownership.
- `brain/**` and `sessions/README.md` remain coordination-only. The Product/Batches bootstrap worktrees stay available but are not used in parallel while the exception is active.
- Session kickoff comes from `docs/launch-session-prompts.md`; implementer reports remain mandatory. Normal three-worktree routing resumes after the campaign.

## Product now

- **App:** <https://chrono-lexicanum.vercel.app/>. Anonymous visitors still hit `/login`; `PREVIEW_GATE=off` is the launch flip, followed post-launch by removal of the preview machinery.
- **Routes:** `/`, `/archive`, `/archive/podcasts`, `/compendium`, `/timeline`, `/ask`, `/ask/fraktion`, `/map`, `/buch/[slug]`, entity/person detail routes, `/artwork`, `/imprint` and `/privacy`. `/artwork` is ungated like the legal pages and offers the maintainer's WebP plus public-storage high-resolution JPEGs.
- **Design/mobile wave (185–190):** Brief 181's prune was delivered; app `/lab` routes and the old gate bypass are gone, typography tokens and shared search utilities are consolidated, and mobile now has a map sheet, Chronicle phone treatment, media-player stud, history-safe overlays and responsive Archive/Compendium surfaces. Static `public/lab/ofob/*` Ask studies were deliberately reintroduced in 190 and remain prototypes, not app routes.
- **Ask:** four-question recommendation funnel with server-only ranking, curation overlay and hard boundaries. The Cameo hierarchy study was selected, but the live `/ask/fraktion` implementation is still pending.

## Cartographer

- `/map` is statically prerendered from committed `map-worlds.json`: **1,055 worlds**, **1,352/1,710** placed work edges (79.1%), currently 155 worlds with linked works.
- Map text coverage is complete for the intended fallback layer: 923 lazy-loaded world blurbs plus higher-priority location blurbs.
- All zone graphics are hand-curated: 15 published zones; the editor is hard dev-only. Direction proofs, background photo, Rift-unrest and the old generated zone graphics are gone; the map sits on `--cl-void`.
- Great Journeys replaced the old course model: **8 journeys / 101 acts** (90 stations + 11 leg waypoints), guided tour plus a single final-act card. Luna is its own chart pin.
- Session 191's isolated SVG motion plane was disproved on the maintainer's Pixel and is superseded. Session 192 is canonical: mobile route motion uses Canvas at 30 fps with DPR capped at 2; mobile SVG paint animation is disabled; desktop retains the SVG choreography.

## Data and operations

- **Books:** 896 canonical per-book files under `scripts/seed-data/books/` (599 W40K + 297 HH), with 196 collection edges. `apply:book --all` is the primary corpus materializer; legacy rosters/batches remain only as frozen equivalence provenance or refusal stubs.
- **Podcasts:** four shows, **1,114 podcast episodes** in the applied W28 state: The 40k Lorecast 155, Adeptus Ridiculous 368, Lorehammer 399 and Luetin09 192. W28 added ten episodes and advanced the review cursors; the old “apply four shows / Weekly PR #200” reminders are resolved.
- **Apply contract:** `npm run db:sync` is the non-destructive nine-step default (preflight, per-book corpus, podcast, audiobook narrators + verify, timeline + verify, curation + verify). `db:rebuild` is confirm-gated disaster recovery. `db:drift` is read-only; full corpus equivalence remains the disposable-DB `equiv:diff` operator path.
- **CI:** lint, typecheck, `brain:lint` and **30 DB-free test suites** are established gates. A DB-free production build is planned but not yet a required invariant.
- **Database:** migrations through `0014` are known applied. Migration `0015` (indexes) has no durable execution evidence and remains a maintainer check; the same is true for a fresh production `db:drift`.

## Launch programme

Maintainer decisions already fixed for the programme:

- Build-time public projections move to a versioned snapshot; Postgres remains the source of truth.
- Content releases are two-stage: merge/apply content, generate and review the fresh snapshot on its own branch, deploy that snapshot, then revalidate and live-smoke.
- A deliberately small Playwright + axe smoke set will become required; it is not the start of a broad browser-test suite.
- The 92-vh ceremonial hero remains for organic visits; query/filter arrivals jump to results.
- Payload, CSS/LCP, foundational A11y, Chronicle A11y and Cartographer payload/A11y are all pre-gate requirements. Map LOD is conditional on a real-device measurement after the payload/A11y pass.

S0 decisions (Philipp, 2026-07-11, recorded in the plan and its Appendix A):

- **URL matrix:** full English migration of the remaining German paths before launch — `/buch → /book`, `/charakter → /character`, `/fraktion → /faction`, `/welt → /world`, Compendium category slugs → EN, `/ask/fraktion → /ask/faction`; `/person` stays (covers authors *and* narrators). All old paths 308 with query strings forwarded verbatim; sitemap/canonical and `/api/revalidate` path assignments live in the plan's Appendix A. Implemented in S4/S5.
- **Canonical host:** `https://www.chrono-lexicanum.com`. The Strato-registered domain is already wired: www serves the Vercel project (preview gate answers), the apex 308s to www preserving path + query.
- **Era policy:** default variant — remove the blanket `time_ending` stamp, bucket mechanically from setting dates where present, else `NULL` (S1a). Verified: Chronicle reads only the curated `eras`/`events` spine, never `books.era_id`.
- **Observability:** Vercel Web Analytics + Speed Insights, **plus one error-only tracker** (no replay, no tracing, no PII); package choice and activation in S5.

Release-order preflight (Session 195, 2026-07-11, OQ 19 closed): S1a is split into a **Code-PR** (no production writes) and a separate **"S1a-Snapshot"** release PR (one `db:sync` after merge + freeze + explicit Go; the snapshot PR is the deploy). Revalidation is an explicit fail-loud **post-deploy** command — built in S3a, called exactly once by the E4 runbook after the snapshot deploy, never automatically from `db:sync`. The `RUNTIME_DATABASE_URL` consumer switch in `src/db/client.ts` belongs to **S3b** (Product) with a transitional fallback and a maintainer-gated Vercel cutover. Snapshot artifacts ship in Batches release PRs; launch evidence + rollups stay separate coordination PRs.

Planned sequence, condensed: **S0 decisions/preflight → build snapshot + DB-free consumers → loader/cache semantics → DB/runtime hardening → canonical routes + book snapshot → SEO/observability → payload/CSS/A11y → Chronicle and Cartographer A11y → launch-readiness evidence → gate off → post-launch cleanup.** Exact task specs live in `docs/launch-master-plan.md`.

## Open now

The canonical queue is [`worklist.md`](./worklist.md). The immediate blockers are:

1. Verify migration `0015` (also embedded as the read-only parity preflight of S1a-Snapshot), optional production `db:drift`, and the Pixel/Chrome verdict for Session 192.

Smaller product/data follow-ups (Cameo live implementation, Legal i18n, Galaspar/Myr source gap, `arthas_moloch` mapping, episode anchors, survey-mode tracing and other polish) stay in `worklist.md`; they do not outrank the launch gate.

## Next action

Merge the Session-195 preflight PR, then start **S1a (Code-PR)** (`codex/ingest-batches-snapshot-exporter`) from `docs/launch-session-prompts.md`. OQ 19 is closed; the release order is authoritative in the plan.
