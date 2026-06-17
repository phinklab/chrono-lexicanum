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

> **Kopf (2026-06-17, B11-Pilot beauftragt).** Arbeitsmodus bleiben die zwei stehenden Strang-Boards [121](./2026-06-03-121-arch-product-board.md) (Product) + [122](./2026-06-03-122-arch-batches-board.md) (Batches). Seit dem letzten großen Rollup sind P10/Brief 150, B2/Brief 149, B13/Brief 151, OQ 16(a)/Brief 152 und **P11/Report 153 (Seiten-Rückbau + Security-Rest)** implementiert. `db:rebuild` hat jetzt Timeline-Restore + Verify als Schritt 5/8+6/8; Curation läuft danach 7/8+8/8, damit Hand-Kuration bei `primary_era_id` zuletzt gewinnt. **Scope-Entscheid 2026-06-17:** Das local-only Browser-Admin-Tool (122-B14) wurde nach Maintainer-Test verworfen; Hand-Kuration läuft künftig per normalem Codex-Auftrag an `curation-overlay.json` + Dry-Run/Verify. **Neu 2026-06-17:** B11 (Großer Buch-Reviewer) wurde nach P11 vorgezogen und als **Pilot-Brief [154](./2026-06-17-154-arch-book-reviewer.md)** beauftragt — CC-Direct Finder+Verifier über ~30–50 Bücher (Factions/Junctions/Facets), Findings → `reviewQueue` (Facets separat read-only); Synopsis-Qualität bewusst gestrichen. **Als Nächstes:** B11-Pilot fahren → dann P12 URL-EN+SSG → B12 Ask-Tuning → P13 Mobile. P11 ist nach Product-PR/Merge separat nachzuhalten (Report 153 liegt lokal auf `codex/product-p11-rueckbau`, noch nicht gepusht). Queue: [`brain/wiki/open-questions.md`](../brain/wiki/open-questions.md) (nur noch 16b/c: `primaryEraId`-Placeholder + Atlas-Events).

| Session | Role | Status | Topic |
|---|---|---|---|
| [154-arch-book-reviewer](./2026-06-17-154-arch-book-reviewer.md) | architect | open | **Großer Buch-Reviewer — Pilot (122-B11).** CC-Direct Batch-Driver, Finder + adversariale Verifier über ~30–50 Bücher; Dimensionen Factions/Junctions(Loc+Char)/Facets. Faction-/Junction-Findings → `reviewQueue` (149), Facet-Findings in separaten read-only Vorschlags-Log (kein Apply-Pfad, schützt 149/150-CW-Garantie). Synopsis-Qualität gestrichen. Read-only ggü. DB, Voll-Lauf = Maintainer-Betrieb. |
| [129-arch-doorways-curation-layer](./2026-06-04-129-arch-doorways-curation-layer.md) | architect | open | **Doorways & Kurations-Schicht.** IA-Entscheidung: 3-Bänder-Home + kuratierte Themen-Stränge (`/themen`) + Charakter-Galerie (`/charaktere`, Primarchen-Tier) als JSON-Kurations-Schicht. P1 (Home) + `/compendium` sind geliefert; bleibt offen als Spec für 121-P8/P9 + 122-B8/B9. |
| [121-arch-product-board](./2026-06-03-121-arch-product-board.md) | architect | open (board) | **Product-Strang-Board.** Erledigt: P1–P6, P10, **P11 (Report 153 — `/atlas`-Route raus, `/buecher`→308, toter Timeline/Chronicle+FilterRail gelöscht, Gate-Ausnahmen healthz/revalidate, statische CSP; PR ausstehend)**. Offen: P7 (Frontend-Lockdown; Teile via 147), P8/P9 (Themen/Galerie, warten auf 122-B8/B9), P12 (URL-EN+SSG), P13 (Mobile), P15 (Map-Chrome-Kohärenz, Kandidat); P14 Map pausiert extern. |
| [122-arch-batches-board](./2026-06-03-122-arch-batches-board.md) | architect | open (board) | **Batches-Strang-Board.** Erledigt: B1, B2 (Brief 149), B3, B4, B10, B13 (Brief 151), OQ 16(a) Rebuild-Tail (Brief 152). Offen: **B11 (Buch-Reviewer — Pilot beauftragt, Brief 154)**, B5 (Hand-Kuratierung), B6 (Dead-Code), B7 (brain:lint-Guardrail), B8/B9 (Kurations-JSONs), B12 (Ask-Tuning, nach B11). **B14 Local-only Curation Admin Tool verworfen** (Kuration per Codex-Overlay-Änderung statt JSON-Editor). |
| [153-impl-product-p11-rueckbau](./2026-06-16-153-impl-product-p11-rueckbau.md) | implementer | complete | **P11 Seiten-Rückbau + Security-Rest (just-closed).** `/atlas`-Web-Route + Admin-UI entfernt (geteilte Libs bleiben), `/buecher`→308 auf `/archive`, toter Timeline/Chronicle-Cluster + FilterRail gelöscht, Preview-Gate-Ausnahmen healthz/api-revalidate, statische CSP-Baseline. Lint/typecheck/brain:lint grün. Lokal auf `codex/product-p11-rueckbau`, **noch nicht gepusht/gemergt**. |
| [152-impl-timeline-rebuild-tail](./2026-06-16-152-impl-timeline-rebuild-tail.md) | implementer | complete | **Timeline-Rebuild-Tail (just-closed).** `apply:timeline --verify`, DB-freier `diffTimelineState` + `test:timeline`, `db:rebuild` 8-Schritt-Sequenz. OQ 16(a) geschlossen; echter DB-Verify bleibt Post-Freeze. |

For closed/older sessions: [`archive/2026-04/`](archive/2026-04/), [`archive/2026-05/`](archive/2026-05/), and [`archive/2026-06/`](archive/2026-06/). Project-history: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) + [`brain/wiki/log.md`](../brain/wiki/log.md).
