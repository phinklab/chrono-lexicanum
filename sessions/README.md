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
- **Archive:** closed sessions normally move to [`archive/YYYY-MM/`](./archive/); the July root cleanup stays deferred until the launch campaign wraps because the tracked prompt collection and workshop roadmap still reference root reports.

## Current head — 2026-07-23

`main` is at `603e9e1` (dependency-audit hardening merged, PR #291). The preview-gated product has completed the workshop evaluation and construction wave; only S7b, the S11 code pass and the fixed launch endgame remain.

- **Numbering authority:** PR #268 resolved the July collision. Great-Journey audit reports are **Sessions 220–234** (not 219–233); workshop evaluation rounds are **235–241**. Rounds 242–244 and build reports 245+ follow that corrected sequence. Session 257 is the merged Text-Delint report, this coordination rollup is Report 258, and the merged dependency-audit follow-up is Session 259. The next free number is 260.
- **Launch foundation:** S0 + S1a–S10a remain fully merged (Sessions 194–209, PRs #240–#256). S10b is moot after the Session-213 Android device acceptance. Preview gate/invite infrastructure stays until gate-off.
- **Journey audit wave (220–234, PR #265):** Great Crusade + the independent 18-Legion Warmaster's Web, then Horus, Guilliman, Garro, Abaddon, Eisenhorn, Ghazghkull, Yvraine and Indomitus were fully re-audited; PR #268 assigned the final report numbers.
- **Workshop verdict wave (235–244, PRs #267/#268/#273/#274):** every wish-list, appendix and perfection candidate received build/backlog/drop treatment in [`docs/werkstatt-roadmap.md`](../docs/werkstatt-roadmap.md). These evaluation rounds intentionally have no per-round report files; the versioned ledger + git history are the record.
- **Workshop construction (245–254, PRs #275–#280 and #282–#285):** desktop Map flicker removed; three time states + journey coupling + task-oriented Map UI shipped; 25 M42 dates, `/now`, `/statistics`, Archive multi-facets and the Arthas Moloch link/name override shipped. W3a-B1 moved to post-launch backlog on 2026-07-22.
- **Site-wide follow-through (255–257, PRs #286–#288):** shared navigation/typography and `/now` cleanup; Library-first unnumbered IA; Curator tools moved into Compendium Guided Picks with 308 redirects; CI now rejects U+2014 in rendered `src/` text after the 157-instance editorial sweep.
- **Corpus/runtime:** 896 per-book SSOT books, 1,114 podcast episodes at the last recorded weekly state, DB-free build/test path, least-privilege runtime credential and required accessibility/observability gates.
- **Next:** S7b → pixel-identical S11 code PR → complete artwork + content freeze → 12-point Launch-Readiness → gate-off/deploy → quiet window (PL1, final S7b live measurement, S11 documentation rollup) → Reddit post.

## Active / load-bearing threads

| Session | Role | Status | Topic |
|---|---|---|---|
| [259-impl-dependency-audit-fix](./2026-07-23-259-impl-dependency-audit-fix.md) | implementer | complete | Next 16.2.11 plus narrow PostCSS/Sharp overrides; production audit restored (PR #291). |
| [258-impl-brain-rollup](./2026-07-22-258-impl-brain-rollup.md) | implementer | complete | Coordination rollup through PR #288; #268 number reconcile; W3a backlog; queue reduced to S7b/S11 + launch endgame. |
| [257-impl-text-delint-emdash](./2026-07-21-257-impl-text-delint-emdash.md) | implementer | complete | Required rendered-text Em-dash lint + editorial sweep (PR #288); broader anti-slop/content pass remains an unapproved proposal. |
| [256-impl-nav-curator-compendium](./2026-07-21-256-impl-nav-curator-compendium.md) | implementer | complete | Library-first unnumbered nav; Curator dissolved into Compendium Guided Picks; `/ask` 308s (PR #287). |
| [255-impl-sitewide-ui-nav-typography](./2026-07-21-255-impl-sitewide-ui-nav-typography.md) | implementer | complete | Shared nav IA, popup dedup, `/now` cleanup and site-wide typography-role foundation (PR #286). |
| [254-impl-werkstatt-wpb1-arthas-moloch](./2026-07-21-254-impl-werkstatt-wpb1-arthas-moloch.md) | implementer | complete | `moloch` linked/renamed to Arthas Moloch; opt-in Excel Name-Override contract (PR #285). |
| [253-impl-werkstatt-wab1-archive-facet-filters](./2026-07-20-253-impl-werkstatt-wab1-archive-facet-filters.md) | implementer | complete | Archive filter ledger, multi-facet AND/OR URL contract and sort directions (PR #284). |
| [252-impl-werkstatt-f3b1-librarium-statistics](./2026-07-20-252-impl-werkstatt-f3b1-librarium-statistics.md) | implementer | complete | `/statistics` Librarium with dependency-free server charts (PR #283). |
| [251-impl-werkstatt-f1b2-status-imperialis](./2026-07-20-251-impl-werkstatt-f1b2-status-imperialis.md) | implementer | complete | `/now` Status Imperialis, map handoff and present-era modules (PR #282). |
| [250-impl-werkstatt-f1b1-m42-dates](./2026-07-20-250-impl-werkstatt-f1b1-m42-dates.md) | implementer | complete | 25 M42 setting dates, event hooks and weekly Status-Imperialis check (PR #280). |
| [249-impl-map-ui-rework](./2026-07-19-249-impl-map-ui-rework.md) | implementer | complete | Cartouche as title + interactive legend, Journey entry, renderer-parity zone rework (PR #279). |
| [247-impl-map-timeline](./2026-07-18-247-impl-map-timeline.md) | implementer | complete | Journey-era coupling, `voyage` hash restore and episode anchors (PR #277); W3b-B3 running timeline is backlog. |
| [246-impl-map-time-states-ui](./2026-07-18-246-impl-map-time-states-ui.md) | implementer | complete | Three time states, Era Plate, era-aware zones/instruments and HH drawing foundation (PR #276). |
| [245-impl-map-flicker-fix](./2026-07-17-245-impl-map-flicker-fix.md) | implementer | complete | Journey Canvas on every viewport; SVG journey paint static; flicker removed (PR #275). |
| [235–244 workshop ledger](../docs/werkstatt-roadmap.md) | coordination | complete | Evaluation rounds, WP/WL triage and decision-ready backlog cuts; no per-round report files. |
| [220–234 journey audit wave](./2026-07-15-220-impl-great-crusade-journey-audit.md) | implementer | complete | Full Great-Journey audit wave from Great Crusade through Indomitus (PR #265; renumbered by #268). |
| [219-impl-werkstatt-verankerung](./2026-07-15-219-impl-werkstatt-verankerung.md) | implementer | complete | Workshop phase and launch endgame anchored; parent state for the July programme (PR #266). |
| [129-arch-doorways-curation-layer](./2026-06-04-129-arch-doorways-curation-layer.md) | architect | open spec | Decision-level topic-strands/character-gallery spec; post-launch, waiting on B8/B9 curation. |
| [121 Product board](./2026-06-03-121-arch-product-board.md) | architect | open board | Historic status board; current ordering lives in the worklist. |
| [122 Batches board](./2026-06-03-122-arch-batches-board.md) | architect | open board | Ongoing hand/data curation; current ordering lives in the worklist. |

Older status/history is in [`brain/wiki/log.md`](../brain/wiki/log.md), git and the monthly archive folders.
