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
| [2026-05-11-060-arch-ssot-w40k-001-db-apply](./2026-05-11-060-arch-ssot-w40k-001-db-apply.md) | architect | implemented | Erster DB-Apply — `ssot-w40k-001` (10 Bücher) mit Cowork-Override-Authority aus `manual-overrides-ssot-w40k-001.json` statt Haiku-Diff. Phase 3d Showcase-Welle. CC-Sequenz: 059 → 060. |
| [2026-05-11-060-impl-ssot-w40k-001-db-apply](./2026-05-11-060-impl-ssot-w40k-001-db-apply.md) | implementer | complete | 060-Pendant: `scripts/apply-override.ts` + minimaler `/buch/[slug]`-DB-Render; 10/10 Bücher idempotent in Postgres. |
| [2026-05-11-059-arch-cc-direct-overrides-w40k-002-005](./2026-05-11-059-arch-cc-direct-overrides-w40k-002-005.md) | architect | open | CC-Direct mit WebSearch produziert vier Override-Files für `ssot-w40k-002..005` (W40K-0011..0050, 40 Bücher). Diff-only; Apply läuft per Brief-060-Skript. Schließt 50-Bücher-Schwelle → Resolver-Brief. Supersedes Brief 059-alt (A/B-Pilot). |
| [2026-05-11-058-arch-v2-ssot-mode-first-batch](./2026-05-11-058-arch-v2-ssot-mode-first-batch.md) | architect | implemented | V2-Pipeline auf SSOT-Mode umstellen + erster 10er-Batch `ssot-w40k-001` (W40K-0001..W40K-0010) als committed Diff |
| [2026-05-11-058-impl-v2-ssot-mode-first-batch](./2026-05-11-058-impl-v2-ssot-mode-first-batch.md) | implementer | complete | 058-Pendant: SSOT-Mode in `run-batch.ts`, `ssot-w40k-001` Diff $0.382/10 Bücher |

For everything else, see [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history at the page level lives in [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Recently shipped" + [`brain/wiki/log.md`](../brain/wiki/log.md).
