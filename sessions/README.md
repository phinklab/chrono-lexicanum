# Sessions

This folder is the project's history. Every architect brief from Cowork and every implementer report from Claude Code is one Markdown file here.

For format, naming, status lifecycle, and archive rule, see [`brain/wiki/workflows/sessions-format.md`](../brain/wiki/workflows/sessions-format.md).

## Quick reference

- **Naming:** `YYYY-MM-DD-NNN-{arch|impl}-{slug}.md`
- **`NNN`** is monotonically increasing across the project (not reset daily)
- **Templates** live in [`_templates/`](./_templates/) — copy when starting a session
- **Drafts** go in `_drafts/` (gitignored)
- **Board-Tasks (121/122):** Briefing pro Task über Chat (Cowork → Philipp → CC); CC legt bei Abschluss ein sehr kleines Handoff-Doc in `sessions/` ab, Cowork reviewt + archiviert
- **Archive rule:** root holds only open / `needs-decision` briefs and at most the last 1–2 just-closed sessions; everything else moves to [`archive/YYYY-MM/`](./archive/) promptly. Detail in [sessions-format § Archiving](../brain/wiki/workflows/sessions-format.md#archiving).

## Pointers

- **Infrastructure log** — replaced by structured updates to [`brain/wiki/log.md`](../brain/wiki/log.md), [`brain/wiki/project-state.md`](../brain/wiki/project-state.md), and [`brain/wiki/pipeline-state.md`](../brain/wiki/pipeline-state.md). Pre-049 entries preserved at [`brain/raw/historical/sessions-readme-log-pre-2026-05-08.md`](../brain/raw/historical/sessions-readme-log-pre-2026-05-08.md).
- **Carry-over for the next architect brief** — replaced by [`brain/wiki/open-questions.md`](../brain/wiki/open-questions.md) (numbered queue) plus [`brain/wiki/deferred-questions.md`](../brain/wiki/deferred-questions.md) (dormant items).
- **Cosmetic UI polish** — lives in [`docs/ui-backlog.md`](../docs/ui-backlog.md), cleared in batched cleanup sessions.

## Active threads

> **Kopf (2026-06-03).** Prozess-Reset auf zwei **stehende Strang-Boards** statt Einzel-Briefs: [121](./2026-06-03-121-arch-product-board.md) (Product — Redesign-Sweep auf die `/werke`-Blaupause + Frontend-Lockdown) und [122](./2026-06-03-122-arch-batches-board.md) (Batches — Podcast-Daten, Buch-Kuratierung, Entity-Blurbs, Ask-Modell/-Logik, Chronicle-Daten, Dead-Code). Jedes Board trägt eine Task-Checkliste; das Briefing pro Task läuft über Chat (Cowork → Philipp → CC), CC legt bei Abschluss ein sehr kleines Handoff-Doc ab (Cowork reviewt + archiviert). Ask läuft strang-übergreifend: **122-B4 (Logik) zuerst, dann 121-P3 (Funnel-UI)** gegen den Typen-Contract. **Keine offenen Alt-Briefs/OQs mehr** — 096/118/119 geschlossen, 061 zum Runbook-Tool retired, 112 → 122-B7, OQ 3/13 → 122-B2/B6 gefaltet.

> **Archiv-Rückstand (Hygiene, nicht „offen"):** die implementierten Paare 104 · 108 · 109 · 110 · 113 · 114 plus **061** (status `archived`, aber bewusst noch im Root — trägt 5 Provenance-Refs in `brain/wiki/decisions/` + `pipeline-state.md`, die ein Move mitziehen müsste) gehören in `archive/2026-05|06/` — separater Sweep mit Referenz-Rewrite, blockt nichts. 120 bleibt als jüngster Kontext im Root.

| Session | Role | Status | Topic |
|---|---|---|---|
| [121-arch-product-board](./2026-06-03-121-arch-product-board.md) | architect | open (board) | **Product-Strang-Board.** Redesign-Sweep (Home/Chronicle/Ask/Podcast/Entity-Hubs) auf die `/werke`-Blaupause, Display-Tweaks, Frontend-Lockdown. Design-Freiheit an CC; Nordstern 118/119 gefaltet. |
| [122-arch-batches-board](./2026-06-03-122-arch-batches-board.md) | architect | open (board) | **Batches-Strang-Board.** Podcast Step 3 (+ Show-Links), Buch-Kuratierung (OQ 3), Entity-Blurbs, Ask-Modell/-Logik (B4 zuerst, blockt 121-P3), Chronicle-Daten, Dead-Code (OQ 13), brain:lint-Guardrail (112). SSOT-Loop als Standing-Tool. |
| [120-arch-public-media-ia](./2026-06-02-120-arch-public-media-ia.md) | architect | implemented | **Public Media IA (Product), gemergt 2026-06-03.** Home, `/werke`, `/podcasts`, `/fraktionen`; jüngster gemergter Product-Schritt, Kontext für 121. Report: [120-impl](./2026-06-02-120-impl-public-media-ia.md). |

For closed/older sessions: [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Latest pipeline state" + [`brain/wiki/log.md`](../brain/wiki/log.md).
