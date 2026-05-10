# Sessions

This folder is the project's history. Every architect brief from Cowork and every implementer report from Claude Code is one Markdown file here.

For format, naming, status lifecycle, and archive rule, see [`brain/wiki/workflows/sessions-format.md`](../brain/wiki/workflows/sessions-format.md).

## Quick reference

- **Naming:** `YYYY-MM-DD-NNN-{arch|impl}-{slug}.md`
- **`NNN`** is monotonically increasing across the project (not reset daily)
- **Templates** live in [`_templates/`](./_templates/) — copy when starting a session
- **Drafts** go in `_drafts/` (gitignored)
- **Archive rule:** root holds only open / `needs-decision` briefs and at most the last 1–2 just-closed sessions; everything else moves to [`archive/YYYY-MM/`](./archive/) promptly. Detail in [sessions-format § Archiving](../brain/wiki/workflows/sessions-format.md#archiving).

## Pointers

- **Infrastructure log** — replaced by structured updates to [`brain/wiki/log.md`](../brain/wiki/log.md), [`brain/wiki/project-state.md`](../brain/wiki/project-state.md), and [`brain/wiki/pipeline-state.md`](../brain/wiki/pipeline-state.md). Pre-049 entries preserved at [`brain/raw/historical/sessions-readme-log-pre-2026-05-08.md`](../brain/raw/historical/sessions-readme-log-pre-2026-05-08.md).
- **Carry-over for the next architect brief** — replaced by [`brain/wiki/open-questions.md`](../brain/wiki/open-questions.md) (numbered queue) plus [`brain/wiki/deferred-questions.md`](../brain/wiki/deferred-questions.md) (dormant items).
- **Cosmetic UI polish** — lives in [`docs/ui-backlog.md`](../docs/ui-backlog.md), cleared in batched cleanup sessions.

## Active threads

Only open / `needs-decision` briefs and the last just-closed session. Cowork updates this list during session-end; older sessions archive to [`archive/YYYY-MM/`](./archive/).

| Session | Role | Status | Topic |
|---|---|---|---|
| [2026-05-10-057](2026-05-10-057-impl-excel-ssot-import.md) | implementer | complete | Excel-SSOT-Import — Schema-Migration `0008_ssot_schema.sql` generiert + Drizzle-Schema erweitert (bookFormat +3, sourceKind +1, `works.external_book_id` UNIQUE, `bookDetails.notes`, `work_collections`-Junction mit Self-M2M). Truncate-Skript mit `--confirm`/ENV-Gate. Loader `scripts/import-ssot-roster.ts` produziert deterministisch (SHA256-verifiziert) `book-roster.json` (859 Bücher + 191 Collections). Migration-Apply + Truncate-Smoke deferred zu Maintainer-Trigger (nur prod-DB verfügbar). |
| [2026-05-10-057](2026-05-10-057-arch-excel-roster-import.md) | architect | implemented | Excel-SSOT-Import — Schema-Migration (bookFormat-Enum +3, sourceKind +1, `works.external_book_id`, `bookDetails.notes`, `work_collections`-Junction), Hard-Delete-Truncate der 26 hand-kuratierten Bücher, Loader (`scripts/import-ssot-roster.ts`) der 859 Bücher + 192 Collection-Refs nach `scripts/seed-data/book-roster.json` schreibt. Excel-Datei zieht um nach `scripts/seed-data/source/`. Pipeline-Refactor explizit Brief 058. |
| [2026-05-10-056](2026-05-10-056-impl-v2-pre-roster-fixes.md) | implementer | complete | V2 Pre-Roster Fixes — per-page Lexicanum-Cache (24h TTL + negative caching), per-book Diff-Checkpointing in `run-batch.ts`, Cost-Recompute auf Cache-Hits, Archivierung 047er V1-Diff + 054er V2-Pilot-Diff in `ingest/.archive/`. |

For everything else, see [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history at the page level lives in [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Recently shipped" + [`brain/wiki/log.md`](../brain/wiki/log.md).
