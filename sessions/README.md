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
| [2026-05-10-056](2026-05-10-056-arch-v2-pre-roster-fixes.md) | architect | open | V2 Pre-Roster Fixes — per-page Lexicanum-Cache (24h TTL + negative caching), per-book Diff-Checkpointing in `run-batch.ts`, Cost-Recompute auf Cache-Hits. Plus Archivierung 047er V1-Diff + 054er V2-Pilot-Diff in `ingest/.archive/`. Vorarbeit für 057 (Master-Liste) + 10er-Batches. |
| [2026-05-09-055](2026-05-09-055-impl-v2-voll-lauf-decision-gate.md) | implementer | complete | V2 Voll-Lauf — 50 Bücher Diff (`v2-batch-20260510-1109.diff.json`), Discovery-Merge `genericityScore` + 11 Unit-Tests, Web-Search-Prompt strict (1.06/Buch). Surface-Form-Top-20 + Resolver-Triage-Notes für 056-Resolver verfügbar. Cache-Hits → Cost-Telemetrie blind ($0/Buch im Diff trotz real $0.0199/Buch fresh). |
| [2026-05-09-055](2026-05-09-055-arch-v2-voll-lauf-decision-gate.md) | architect | implemented | V2 Voll-Lauf Decision Gate — 50–100 Bücher V2-Lauf, Discovery-Fuzzy-Merge-Fix, strengerer Web-Search-Prompt. Side-Goal: Resolver-Dataset für 056. Dry-run only. |

For everything else, see [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history at the page level lives in [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Recently shipped" + [`brain/wiki/log.md`](../brain/wiki/log.md).
