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

## Current head — 2026-07-11

`main` is at `013c955` (S0 merged, PR #240). The product is in pre-launch hardening behind the preview gate.

- **Corpus/runtime:** 896 per-book SSOT books; W28 applied podcast state = 1,114 episodes; 30 DB-free test suites.
- **Cartographer:** 1,055 worlds, 15 hand-curated zones, 923 lazy world blurbs and 8 Great Journeys / 101 acts. Mobile journey motion uses the Canvas path from Session 192; Session 191's isolated SVG-plane attempt is superseded.
- **Product wave 185–190:** Brief 181 prune delivered; app `/lab` removed; mobile map/Chronicle/player and responsive catalogue work shipped; `/artwork` is public; redundant headings/copy cleaned; Great Journeys shipped. Static `public/lab/ofob` Ask prototypes were later reintroduced intentionally.
- **Launch mode:** sessions run serially from the coordination worktree; the plan and kickoff prompts are canonical in-repo since S0 ([`docs/launch-master-plan.md`](../docs/launch-master-plan.md) + [`docs/launch-session-prompts.md`](../docs/launch-session-prompts.md)). PR contents remain strand-pure and `main` remains read-only.
- **S0 closed (Session 194, 2026-07-11):** URL matrix = full EN migration incl. `/buch → /book` (`/person` stays; plan Appendix A); canonical host `https://www.chrono-lexicanum.com` (already wired); Era default (stamp removal + bucketing + `NULL`, S1a); error-only tracker yes (S5).
- **OQ 19 closed (Session 195, 2026-07-11):** release order authoritative in the plan — S1a split into Code-PR + S1a-Snapshot release PR; revalidation is an explicit post-deploy command (S3a); `RUNTIME_DATABASE_URL` consumer switch is S3b with maintainer-gated cutover; snapshot PRs stay separate from coordination evidence.
- **Next:** S1a (Code-PR) per `docs/launch-session-prompts.md`.
- **Operator checks:** migration `0015`, optional production `db:drift`, and Philipps Pixel/Chrome verdict for Session 192.

## Active / load-bearing threads

| Session | Role | Status | Topic |
|---|---|---|---|
| [195-impl-launch-release-preflight](./2026-07-11-195-impl-launch-release-preflight.md) | implementer | complete | OQ-19-Preflight: release order canonized (S1a split, post-deploy revalidation, S3b runtime cutover, PR separation); OQ 19 closed. |
| [194-impl-launch-s0](./2026-07-11-194-impl-launch-s0.md) | implementer | complete | Launch S0: plan + prompts canonicalized under `docs/`; URL matrix, host, Era and tracker decisions recorded (plan Appendix A). |
| [193-impl-brain-launch-rollup](./2026-07-10-193-impl-brain-launch-rollup.md) | implementer | complete | Coordination ingest through 192 + W28; durable launch-mode/preflight record. |
| [192-impl-mobile-cartographer-canvas](./2026-07-10-192-impl-mobile-cartographer-canvas.md) | implementer | complete | Canonical mobile route-motion fix: Canvas ≤900 px, 30 fps, DPR ≤2; SVG paint animation off on mobile; Pixel verdict pending. |
| [191-impl-mobile-cartographer-motion](./2026-07-10-191-impl-mobile-cartographer-motion.md) | implementer | superseded | Isolated SVG motion plane; disproved on the Pixel and replaced by 192. |
| [190-impl-ui-refinements-great-journeys](./2026-07-09-190-impl-ui-refinements-great-journeys.md) | implementer | complete | Great Journeys (8/101), Luna pin, Cameo prototype choice, targeted UI refinements. |
| [185–189 Product/mobile wave](./2026-07-08-185-impl-website-review-mobile.md) | implementer | complete | Prune/token/mobile foundation, phone feedback, `/artwork`, copy/headline cleanup, map/Chronicle overlay and gesture fixes. Reports 185–189 remain in root for the current local workflow. |
| [182-arch-launch-tech](./2026-07-02-182-arch-launch-tech.md) | architect | superseded | Replaced by the maintainer launch programme; its SEO/A11y/observability outcomes are not yet implemented. |
| [181-arch-product-prune-pass](./2026-07-02-181-arch-product-prune-pass.md) | architect | implemented | Delivered by Session 185 / PR #226. Later `public/lab/ofob` prototypes are a new, explicit surface. |
| [129-arch-doorways-curation-layer](./2026-06-04-129-arch-doorways-curation-layer.md) | architect | open spec | Topic strands + character gallery wait on B8/B9 curation. |
| [121 Product board](./2026-06-03-121-arch-product-board.md) | architect | open board | Historic status board; current launch ordering lives in the worklist. |
| [122 Batches board](./2026-06-03-122-arch-batches-board.md) | architect | open board | Ongoing hand/data curation; current launch ordering lives in the worklist. |

## Recent operations outside numbered sessions

- Weekly Refresh W28 PR #230: two book candidates ignored; ten podcast episodes merged and applied live (Lorecast 155 / Adeptus 368 / Lorehammer 399; Luetin remains 192).
- PR #231 advanced the reviewed book/show cursors. Weekly PR #200 is closed and no longer an open reminder.
- Dependency PR #234 updated `read-excel-file` and `tsx`; no architecture change.

Older status/history is in [`brain/wiki/log.md`](../brain/wiki/log.md), git and the monthly archive folders.
