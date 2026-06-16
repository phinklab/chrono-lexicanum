# Sessions

This folder is the project's history. Every architect brief from Cowork and every implementer report from Claude Code is one Markdown file here.

For format, naming, status lifecycle, and archive rule, see [`brain/wiki/workflows/sessions-format.md`](../brain/wiki/workflows/sessions-format.md).

## Quick reference

- **Naming:** `YYYY-MM-DD-NNN-{arch|impl}-{slug}.md`
- **`NNN`** is monotonically increasing across the project (not reset daily)
- **Templates** live in [`_templates/`](./_templates/) — copy when starting a session
- **Drafts** go in `_drafts/` (gitignored)
- **Board-Tasks (121/122):** Briefing pro Task über Chat (Cowork → Philipp → CC); CC legt bei Abschluss ein kleines Handoff-Doc in `sessions/` ab, Cowork reviewt + archiviert.
- **Archive rule:** root holds only open / `needs-decision` briefs and at most the last 1–2 just-closed sessions; everything else moves to [`archive/YYYY-MM/`](./archive/) promptly. Detail in [sessions-format § Archiving](../brain/wiki/workflows/sessions-format.md#archiving).

## Pointers

- **Infrastructure log** — replaced by structured updates to [`brain/wiki/log.md`](../brain/wiki/log.md), [`brain/wiki/project-state.md`](../brain/wiki/project-state.md), and [`brain/wiki/pipeline-state.md`](../brain/wiki/pipeline-state.md). Pre-049 entries preserved at [`brain/raw/historical/sessions-readme-log-pre-2026-05-08.md`](../brain/raw/historical/sessions-readme-log-pre-2026-05-08.md).
- **Carry-over for the next architect brief** — replaced by [`brain/wiki/open-questions.md`](../brain/wiki/open-questions.md) (numbered queue) plus [`brain/wiki/deferred-questions.md`](../brain/wiki/deferred-questions.md) (dormant items).
- **Cosmetic UI polish** — lives in [`docs/ui-backlog.md`](../docs/ui-backlog.md), cleared in batched cleanup sessions.

## Active threads

> **Kopf (2026-06-16, Post-Merge-Rollup 149/151/152).** Arbeitsmodus bleiben die zwei stehenden Strang-Boards [121](./2026-06-03-121-arch-product-board.md) (Product) + [122](./2026-06-03-122-arch-batches-board.md) (Batches). Seit dem letzten großen Rollup sind P10/Brief 150, B2/Brief 149, B13/Brief 151 und OQ 16(a)/Brief 152 implementiert und gemergt. `db:rebuild` hat jetzt Timeline-Restore + Verify als Schritt 5/8+6/8; Curation läuft danach 7/8+8/8, damit Hand-Kuration bei `primary_era_id` zuletzt gewinnt. **Scope-Entscheid 2026-06-16:** Admin wird nicht als deployed `/admin` gebaut, sondern als local-only Tool im Batches-Tree (122-B14, bindet nur an `127.0.0.1`/`localhost`). **Als Nächstes:** B14 Local-only Curation Admin Tool, danach P11 Product-Rückbau/Security-Rest → P12 URL-EN+SSG → B11 Buch-Reviewer → B12 Ask-Tuning → P13 Mobile. Queue: [`brain/wiki/open-questions.md`](../brain/wiki/open-questions.md) (nur noch 16b/c: `primaryEraId`-Placeholder + Atlas-Events).

| Session | Role | Status | Topic |
|---|---|---|---|
| [129-arch-doorways-curation-layer](./2026-06-04-129-arch-doorways-curation-layer.md) | architect | open | **Doorways & Kurations-Schicht.** IA-Entscheidung: 3-Bänder-Home + kuratierte Themen-Stränge (`/themen`) + Charakter-Galerie (`/charaktere`, Primarchen-Tier) als JSON-Kurations-Schicht. P1 (Home) + `/compendium` sind geliefert; bleibt offen als Spec für 121-P8/P9 + 122-B8/B9. |
| [121-arch-product-board](./2026-06-03-121-arch-product-board.md) | architect | open (board) | **Product-Strang-Board.** Erledigt: P1–P6, P10. Offen: P7 (Frontend-Lockdown; Teile via 147), P8/P9 (Themen/Galerie, warten auf 122-B8/B9), P11 (Product-Rückbau/Security-Rest; Admin-Tool nach 122-B14 verschoben), P12 (URL-EN+SSG), P13 (Mobile), P15 (Map-Chrome-Kohärenz, Kandidat); P14 Map pausiert extern. |
| [122-arch-batches-board](./2026-06-03-122-arch-batches-board.md) | architect | open (board) | **Batches-Strang-Board.** Erledigt: B1, B2 (Brief 149), B3, B4, B10, B13 (Brief 151), OQ 16(a) Rebuild-Tail (Brief 152). Offen: B5 (Hand-Kuratierung), B6 (Dead-Code), B7 (brain:lint-Guardrail), B8/B9 (Kurations-JSONs), B11/B12, **B14 Local-only Curation Admin Tool**. |
| [152-impl-timeline-rebuild-tail](./2026-06-16-152-impl-timeline-rebuild-tail.md) | implementer | complete | **Timeline-Rebuild-Tail (just-closed).** `apply:timeline --verify`, DB-freier `diffTimelineState` + `test:timeline`, `db:rebuild` 8-Schritt-Sequenz. OQ 16(a) geschlossen; echter DB-Verify bleibt Post-Freeze. |
| [149-impl-curation-foundation](./2026-06-14-149-impl-curation-foundation.md) | implementer | complete | **Kurations-Fundament (just-closed).** Sidecar `curation-overlay.json`, Validator, programmatischer Apply/Dry-Run/Verify, Tail-Slot in `db:rebuild`; entsperrt 122-B14 Local-only Admin Tool und B11 Buch-Reviewer. |

For closed/older sessions: [`archive/2026-04/`](archive/2026-04/), [`archive/2026-05/`](archive/2026-05/), and [`archive/2026-06/`](archive/2026-06/). Project-history: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) + [`brain/wiki/log.md`](../brain/wiki/log.md).
