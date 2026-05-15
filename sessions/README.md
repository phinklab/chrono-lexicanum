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

> **Maintainer-Bedienung in einem Satz:** Brief 075 (Cockpit-Refinement Drift-Sort + OQ6 Hardcover-Rating-Promotion) liegt offen — zwei orthogonale Tracks in einem Mini-Brief, ohne Schema-Migration, Track-B-Sicherheitsventil eingebaut. **Codex-Review-Erratum ist in 075-arch eingearbeitet** (4 Punkte: `--env-file=.env.local`-Konvention, W40K-SSOT-Scope-Filter, `no_author`-Miss-Bucket, DetailPanel-Surface auf Public-Detail wegen Duplikat-UI in `/buecher`-Row-Details). Brief 074 (Resolver-Pass 3) ist gemerged (PR #57, `6ac4295`); Wiki-Hygiene-Pass post-074-impl ist durch. Sequenz: 075 → Loop-Re-Trigger für `ssot-w40k-016` (skip-50-stop-Marker bis zur 200er-Pause).

| Session | Role | Status | Topic |
|---|---|---|---|
| [2026-05-15-075-arch-cockpit-drift-sort-and-rating](./2026-05-15-075-arch-cockpit-drift-sort-and-rating.md) | architect | open | **Cockpit-Refinement (Drift-Sort + opt. „Auch enthalten in:"-DetailPanel auf `/buch/[slug]` Public) + OQ6 Hardcover-Rating-Promotion.** Zwei Tracks, beide ohne Schema-Migration. Track A motiviert durch 074-impl-Cockpit-Quality-Feedback (drift-Pille braucht freq-/confidence-Sort). Track B schließt OQ6 via Standalone-Backfill-Script `scripts/backfill-hardcover-rating.ts` (W40K-SSOT-scoped, Hardcover-only, OL-Fallback als Folge-OQ wenn Hit-Rate < 70 %). **Codex-Review-Erratum eingearbeitet** (`--env-file=.env.local`-Konvention, Scope-Filter, `no_author`-Miss-Bucket, DetailPanel-Surface-Klarstellung). Sicherheitsventil: Track B darf abbrechen ohne Track A zu blockieren. |
| [2026-05-15-074-impl-resolver-batch-3](./2026-05-15-074-impl-resolver-batch-3.md) | implementer | complete (PR #57, `6ac4295`) | **Resolver-Pass 3 für `ssot-w40k-011..015`.** +20 Factions inkl. `hydra_cabal`-Watson-Knoten + Squats-`tone`-Update auf `historical_canon_layer` via Upsert + Sororitas-Orders + Astartes-Loyalist-Sub-Factions + Aeldari-/Necron-/Navis-Sub-Factions + Goffs + Aeronautica Imperialis; +19 Locations (Imperium-Nihilus-Frames + Necron-Tomb-Worlds + Watson-Welten + Named-Vehicles); +26 Characters (Cawl + Hadeya Etsul + Aeronautica-Cross-Batch + Watson-Retinue mit `historical_canon_layer`-Marker im `notes`-Feld). 17 Faction-Aliases / 4 Location-Aliases / 17 Character-Aliases. Green Tide bleibt Buch-Scope, NEU `scripts/seed-data/collection-gaps.json` mit Green-Tide-Ledger. 13 unbekannte facetIds aus 015-Override gestrippt (LLM-Catalog-Typos). Re-Apply `001..015` (gleichzeitig Drift-Cleanup für 001..010 + First-Apply für 011..015): `work_factions=912`, `work_locations=287`, `work_characters=522`, `work_collections=35`. Watson-Trilogy junction-spot-check: 49 Rows sauber. test-resolver 78 passed (war 51). |
| [2026-05-15-074-arch-resolver-batch-3](./2026-05-15-074-arch-resolver-batch-3.md) | architect | implemented | **Resolver-Pass 3 — Surface-Form-Crystallization für `ssot-w40k-011..015`.** Brief mit Codex-Review-Erratum (Schema-Tatsachen, Squats-Existenz, Cawl-Status, Green-Tide-Roster-Lücke) + Green-Tide-Collection-Gap-Addendum. Geschlossen durch 074-impl. |
| [2026-05-13-071-impl-loop-driver](./2026-05-13-071-impl-loop-driver.md) | implementer | complete (PR #54, `4993e17`) | **Loop-Driver — `scripts/run-ssot-loop.sh`.** Bash-Single-File-Wrapper um Brief 061, `claude -p`-Subsession pro Iteration mit `--allowedTools` + `--permission-mode acceptEdits`. Strict Diff-Pfad-Set-Equality + JSON/H2-Halt-Checks. PR-idempotent via `gh pr view --head`. Live-Smoke `N=1` plus produktiver `N=5`-Lauf (50 neue Override-Files `ssot-w40k-011..015`, applied in DB erst durch 074-impl). |
| [2026-05-13-071-arch-loop-driver](./2026-05-13-071-arch-loop-driver.md) | architect | implemented | **Loop-Driver-Skript.** Headless-Wrapper um Brief 061. Future-Refinement (per-iter timeout, shellcheck-Lokal-Setup, workflow-page `brain/wiki/workflows/ssot-loop-driver.md`) bleibt offen. |
| [2026-05-11-061-arch-ssot-loop](./2026-05-11-061-arch-ssot-loop.md) | architect | open (standing, paused) | **Standing-Loop, auf 150er-Pause.** Pro `/clear` EIN 10er-Override-Batch via `claude -p`-Subsession. Stoppt loud bei kumulativ 50/100/150… Büchern → Resolver-Brief. **Aktuell pausiert** bei 150 Büchern; Re-Trigger via Maintainer-Skip-Marker für `ssot-w40k-016`. Iterations `002..015` erledigt + applied. **Side-effect-ADR:** [`brain/wiki/decisions/why-cc-direct-curation.md`](../brain/wiki/decisions/why-cc-direct-curation.md) kodifiziert den Pipeline-Shift, der aus diesem Brief resultierte. |

For closed sessions: [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Recently shipped" + [`brain/wiki/log.md`](../brain/wiki/log.md).
