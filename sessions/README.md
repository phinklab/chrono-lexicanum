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

> **Maintainer-Bedienung in einem Satz:** Brief 074 (Resolver-Pass 3, `ssot-w40k-011..015`) liegt offen — schließt die Surface-Form-Crystallization für die dritte 50er-Welle (150 Bücher applied auf `main` post-PR #54). Eigener Branch, keine Schema-Migration, keine UI-Arbeit, kein V2-Pipeline-Touch. Loop bleibt paused, bis Resolver-Apply durch ist.

| Session | Role | Status | Topic |
|---|---|---|---|
| [2026-05-15-074-arch-resolver-batch-3](./2026-05-15-074-arch-resolver-batch-3.md) | architect | open | **Resolver-Pass 3 — Surface-Form-Crystallization für `ssot-w40k-011..015`.** 50 frische Bücher (W40K-0101..0150) auf `main` post-Driver-Run (PR #54, `4993e17`). Erweitert `factions.json` / `locations.json` / `characters.json` + Aliase im 072-Stil; **Watson-Trilogy als distinct historical-canon-layer** behandeln (Squats / Hydra-Cabal / pre-modern Surface-Forms; schema-konformer `historical_canon_layer`-Marker, nicht auf moderne Codex-Begriffe kollabieren). `work_collections`-Status-Pass mit The Green Tide (015) als bekannter Roster-Lücke, erwartbar 0 Zusatz-Rows. Re-Apply `001..015`, Pre-/Per-Batch-/Post-Counts-Tabelle Pflicht (072-Disziplin-Lesson). Audit-Cockpit (Brief 073) als Vor-/Nach-Triage-Tool. Out-of-scope: V2-LLM-Pipeline (`src/lib/ingestion/v2/*`), Schema-Migration, UI-Erweiterung, `value_outside_vocabulary`-Promotion, HH-Domain, `brain/wiki/*`-Edits (Pipeline-Verschiebung kommt in eigene Wiki-Hygiene-Session). |
| [2026-05-14-073-impl-maintainer-audit-cockpit](./2026-05-14-073-impl-maintainer-audit-cockpit.md) | implementer | complete | **Maintainer-Audit-Cockpit.** `/buch/[slug]/audit` (Server Component, noindex, alle DB-Felder inkl. `raw_name`, `confidence`, `sourceKind`, `work_collections.basis`, `external_links`, `notes`); `/buch/[slug]` slim-down auf Public-Lean; `/buecher` Audit-Modus mit vier Pillen (`drift` / `gap` / `ssot` / `collections`, AND, URL-State `?audit=…`); Default-Sort `updatedAt desc`. `src/lib/book-labels.ts` extracted für konsistente Labels public/audit. Catalog-Filter heute in-memory (Acceptable bis 500 Bücher). |
| [2026-05-14-073-arch-maintainer-audit-cockpit](./2026-05-14-073-arch-maintainer-audit-cockpit.md) | architect | implemented | **Maintainer-Audit-Cockpit (OQ9).** Closed durch 073-impl: Audit-Sub-Route + Audit-Filter-Pillen, Design-Freedom an CC, keine Schema-Migration. |
| [2026-05-14-072-impl-resolver-batch-2](./2026-05-14-072-impl-resolver-batch-2.md) | implementer | complete | **Resolver-Pass 2 — `ssot-w40k-006..010` durch.** +54 Factions inkl. `heretic_astartes`-Mid-Knoten + Reparents (inkl. Alpha Legion) + Death-Guard / Emperor's-Children-Lücken-Fix; +45 Locations + `great_rift` in-place mit `era_frame`; +38 Characters (16 freq≥2 + 22 lore-iconic); Aeldari-/Drukhari-/Khârn-/Czevak-Aliase. `apply-override.applyCollections` löst Cross-Batch via `works.external_book_id` (same-batch 17 → cross-batch 35). Re-Apply `001..010` mit Post-Counts `work_factions=650`, `work_locations=239`, `work_characters=475`, `work_collections=35`. Smoke-Slugs grün. Load-bearing für Brief 074 — Vorlage für Reparent-Disziplin + Cross-Batch-Refactor. |
| [2026-05-13-071-impl-loop-driver](./2026-05-13-071-impl-loop-driver.md) | implementer | complete | **Loop-Driver — `scripts/run-ssot-loop.sh`.** Bash-Single-File-Wrapper um Brief 061, `claude -p`-Subsession pro Iteration mit `--allowedTools` + `--permission-mode acceptEdits`. Strict Diff-Pfad-Set-Equality + JSON/H2-Halt-Checks. PR-idempotent via `gh pr view --head`. `--skip-initial-resolver-pause`-Flag für die erste Iter. Live-Smoke `N=1` plus produktiver `N=5`-Lauf (PR #54, 50 neue Bücher `ssot-w40k-011..015`) sind durch. Cleanup-Hänger an PR #51 (Email-Verify-Hürde) — Maintainer-Restpunkt, nicht load-bearing. |
| [2026-05-13-071-arch-loop-driver](./2026-05-13-071-arch-loop-driver.md) | architect | implemented | **Loop-Driver-Skript.** Headless-Wrapper um Brief 061. Implementiert + produktiv gefahren (PR #54). Future-Refinement (per-iter timeout, shellcheck-Lokal-Setup, workflow-page `brain/wiki/workflows/ssot-loop-driver.md`) bleibt offen. |
| [2026-05-11-061-arch-ssot-loop](./2026-05-11-061-arch-ssot-loop.md) | architect | open (standing, paused) | **Standing-Loop, auf 150er-Pause.** Pro `/clear` EIN 10er-Override-Batch. Stoppt loud bei kumulativ 50/100/150… Büchern → Resolver-Brief. **Aktuell pausiert** bei 150 Büchern; Re-Trigger nach Brief 074 (Resolver-Apply). Iterations `002..015` erledigt; nächste Iteration wäre `ssot-w40k-016`. |

For closed sessions: [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Recently shipped" + [`brain/wiki/log.md`](../brain/wiki/log.md).
