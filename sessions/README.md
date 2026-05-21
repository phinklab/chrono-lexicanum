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

> **Aktueller Kopf (2026-05-21).** Brief 089 (Resolver-Pass 5) ist gemerged — `origin/main` steht auf `d46bf6a` (PR #78). Die ersten **250 W40K-Bücher** (`ssot-w40k-001..025`) sind als Resolver-Schicht kristallisiert und in Postgres applied; die 250er-Resolver-Pause ist geräumt. Davor gemerged: Brief 087 (Goodreads-Rating-Pipeline, PR #74/#75), Brief 088 (SSOT-Loop lean, PR #76 `71fb4f1`), der Loop-Lauf `ssot-w40k-021..025` (PR #77 `c2f53e7`). Der Coordination-Worktree wurde am 2026-05-21 per `git pull --ff-only` auf `origin/main` synct. Der Wiki-Hygiene-Pass post-087/088/089 ist durch — Brain steht auf dem 250-Bücher-Stand.
>
> **Nächste Reihenfolge:** (1) **Loop-Re-Trigger `ssot-w40k-026..030`** — `bash scripts/run-ssot-loop.sh 5` aus dem `chrono-lexicanum-batches`-Worktree auf frischer `codex/ingest-batches-026-030`-Branch. Brief 089 hat die 250er-Pause geräumt; der Loop resumed automatisch (selbst-erkennend seit Brief 088, kein Skip-Flag). Alle vier Loop-Disziplinen greifen ab Iter 026 (Public-Synopsis, Faction-Granularity, Locations-Granularity, Goodreads-Rating). (2) Bei der ungeskippten **300er-Pause** schreibt Cowork den **Resolver-Pass-6-Brief** (axis-sliced analog 076/089). **Maintainer-Punkt:** OQ (14) — der W40K-0244-`seriesHint`-Mistag + 5 `no_author`-Roster-Lücken sind reine Excel-SSOT-Edits, wann immer es passt.
>
> **Archivierungs-Rückstand:** `sessions/` root trägt noch ~33 geschlossene Session-Files (062–087); per Archive-Regel gehören die nach `archive/2026-05/`. Der Move ist an ~70 lint-geprüfte `sources:`-/Link-Referenzen in `brain/wiki/**` gekoppelt — am saubersten als eigene kleine CC-Aufgabe (`git mv` + Referenz-Rewrite + `brain:lint`-Verifikation; Präzedenz: Briefs 050/051). Cowork hält die `git mv`-Liste bereit.

| Session | Role | Status | Topic |
|---|---|---|---|
| [2026-05-21-089-arch-resolver-pass-5](./2026-05-21-089-arch-resolver-pass-5.md) | architect | implemented + merged (PR #78 `d46bf6a`) | **Resolver-Pass 5 — `ssot-w40k-021..025` (axis-sliced).** Fünfte 50er-Welle W40K-0201..0250 kristallisiert + 250 Bücher in Postgres applied, 250er-Resolver-Pause geräumt. Drei Wave-Calls (Astra-Militarum-Regimenter / `commissar`-`protagonist_class`-Facet + Retag / Author-Backfill). |
| [2026-05-21-089-impl-resolver-pass-5](./2026-05-21-089-impl-resolver-pass-5.md) | implementer | complete + merged (PR #78 `d46bf6a`) | Resolver-Pass 5 umgesetzt — axis-sliced, supervised/manuell gefahren (nicht über `run-resolver-pass.sh`). Reference 154/169/199, `facet_values` 86 (`commissar`); Junctions `work_factions=1153` / `locations=455` / `characters=701` / `collections=79` / `persons=232`. Alle Checks grün. |
| 2026-05-21 · SSOT-Loop `ssot-w40k-021..025` | loop | merged (PR #77 `c2f53e7`) | Standing-Loop (Brief 061) Iterationen 021..025 — 5 Override-JSONs W40K-0201..0250 + `ssot-loop-log.md`-Append, diff-only, kein DB-Touch. Vier Loop-Disziplinen aktiv; kumulativ 250 Bücher, selbst-erkennender 250er-Pause-Block. |
| [2026-05-21-088-arch-ssot-loop-lean](./2026-05-21-088-arch-ssot-loop-lean.md) | architect | implemented + merged (PR #76 `71fb4f1`) | **SSOT-Loop lean.** Loop-Iteration liest drei Dateien (~6k statt ~55k+ Tokens): [`ssot-loop-runbook.md`](./ssot-loop-runbook.md) + `loop:next`-Detection-Helper (`scripts/loop-next-batch.ts`) + `facet-catalog.json`. Resolver-Pause selbst-erkennend; `--skip-initial-resolver-pause` entfernt. |
| [2026-05-20-087-arch-goodreads-rating-pipeline](./2026-05-20-087-arch-goodreads-rating-pipeline.md) | architect | implemented + merged (PR #74/#75) | **Goodreads-Rating-Pipeline-Integration.** Goodreads-Rating als vierte forward-only Loop-Disziplin: `overrides.rating`, `apply-override-rating.ts`-Helper, Apply-Layer schreibt `book_details.rating`/`rating_count`/`rating_source`. Page-Read der Goodreads-Buchseite, nie Snippet. Forward-only ab `ssot-w40k-021`. |
| 2026-05-21 · Wiki-Hygiene-Pass (post-087/088/089) | cowork | complete | Brain-Update für Brief 087 + 088 + Loop `021..025` + Brief 089: `project-state.md`/`pipeline-state.md` auf 250 Bücher + post-089-Counts + neue „Latest pipeline state (post-089)"-Sektion, `open-questions.md` (OQ (14) Roster-Excel-Hygiene neu; Brief 087 / Loop `021..025` / Resolver-Pass 5 erledigt), `index.md`/`log.md` nachgezogen, README-Refresh. Coordination-Worktree resynct. |
| [2026-05-11-061-arch-ssot-loop](./2026-05-11-061-arch-ssot-loop.md) | architect | open (standing) | **Standing-Loop.** 250 Bücher applied; die operative Iter-Spec lebt seit Brief 088 in [`ssot-loop-runbook.md`](./ssot-loop-runbook.md), Brief 061 trägt nur noch die Design-Rationale. Nächster Lauf: `ssot-w40k-026..030`. Side-effect-ADR: [`brain/wiki/decisions/why-cc-direct-curation.md`](../brain/wiki/decisions/why-cc-direct-curation.md). |

For closed sessions: [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Recently shipped" + [`brain/wiki/log.md`](../brain/wiki/log.md).
