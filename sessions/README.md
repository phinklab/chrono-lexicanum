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

> **Kopf (2026-06-12, großer Rollup-Pass).** Arbeitsmodus bleiben die zwei **stehenden Strang-Boards** [121](./2026-06-03-121-arch-product-board.md) (Product) + [122](./2026-06-03-122-arch-batches-board.md) (Batches); Briefing pro Task über Chat, kleine CC-Handoff-Docs, Cowork reviewt + archiviert. **Stand:** P1–P4 + B1/B3/B4/B10 erledigt (Ask-Funnel, Podcast-Pipeline mit 4 Shows inkl. YouTube/CC-Direct, Entity-Blurbs-Subset, Weekly-Refresh-Cron); Briefs 130/131/133 implemented + archiviert; Timeline-Cinematic (137/138/140) + `/compendium`/`/archive`-IA (129-impls, 139) + Deep-Review-Zyklus (140/141/144 → 147/148) gemergt. **Die Site steht hinter dem Preview-Login-Gate** (Session 145; `PREVIEW_GATE=off` für den Launch). 122-B5 (Chronicle-Datierung) bleibt ⏸ Cowork+Philipp-Hand-Kuratierung im git-ignored `/timeline-workshop/` — das 137er-Fundament (8 Eras / 144 Events / 223 Hooks / 97 datierte Werke) ist applied, die Rest-Bücher-Datierung läuft weiter. **Als Nächstes (Backlog-Sort 2026-06-12):** Brief 149 (Kurations-Fundament, Batches) + Brief 150 (Polish-Sweep, Product) parallel; danach P11 Admin+Rückbau → P12 URL-EN+SSG → B11 Reviewer → B12 Ask-Tuning → P13 Mobile; P14 Map ⏸ extern. Boards um P10–P14 / B11–B12 erweitert; P5/P6 + B3-Full sind maintainer-direkt erledigt. Queue: [`brain/wiki/open-questions.md`](../brain/wiki/open-questions.md) (16 Timeline-Folgen, 17 Deep-Review-Rest).

| Session | Role | Status | Topic |
|---|---|---|---|
| [149-arch-curation-foundation](./2026-06-12-149-arch-curation-foundation.md) | architect | open | **Kurations-Fundament (Batches, 122-B2).** Hand-Override-Format (final vs. Review-Queue) + resolver-/rebuild-fester Apply-Pfad + Content-Warnings aus den Daten. Entsperrt 121-P11 (Admin-Seite) + 122-B11 (Buch-Reviewer). |
| [150-arch-polish-sweep](./2026-06-12-150-arch-polish-sweep.md) | architect | open | **Polish-Sweep (Product, 121-P10).** CW-Anzeige raus, Fraktions-Icons statt Punkt, Cogitator-Loading transparent, Login-BG + generalisierter Artist-Credit-Slot (bubondubon). Parallel zu 149 fahrbar. |
| [129-arch-doorways-curation-layer](./2026-06-04-129-arch-doorways-curation-layer.md) | architect | open | **Doorways & Kurations-Schicht.** IA-Entscheidung: 3-Baender-Home + kuratierte Themen-Straenge (`/themen`) + Charakter-Galerie (`/charaktere`, Primarchen-Tier) als JSON-Kurations-Schicht. P1 (Home) + `/compendium` sind geliefert; bleibt offen als Spec für 121-P8/P9 + 122-B8/B9. |
| [121-arch-product-board](./2026-06-03-121-arch-product-board.md) | architect | open (board) | **Product-Strang-Board.** Erledigt: P1–P4. Offen: P5 (Entity-Hubs als Guides), P6 (Display-Tweaks), P7 (Frontend-Lockdown; Teile via 147), P8/P9 (Themen/Galerie, warten auf 122-B8/B9). |
| [122-arch-batches-board](./2026-06-03-122-arch-batches-board.md) | architect | open (board) | **Batches-Strang-Board.** Erledigt: B1, B3 (Subset+Machinery), B4, B10. Offen: B2 (Buch-Kuratierung), B5 (⏸ Hand), B6 (Dead-Code), B7 (brain:lint-Guardrail), B8/B9 (Kurations-JSONs). |
| [147-impl-deep-review-fixes](./2026-06-12-147-impl-deep-review-fixes.md) | implementer | complete | **Deep-Review-Fixes (just-closed, load-bearing).** 7 Wellen aus Report 144 umgesetzt; gemergt, Migration 0013 applied. Offene Reste → OQ (17): Preview-Gate vs. Maschinen-Endpoints, CSP, `/buecher`, FilterRail, `/buch`-SSG, `REVALIDATE_TOKEN`. |
| [148-impl-weekly-refresh-delta](./2026-06-12-148-impl-weekly-refresh-delta.md) | implementer | complete | **Weekly-Refresh-Delta (just-closed).** Book-Backlog-Cursor `book-seen.json` (entsteht beim ersten `refresh:mark-reviewed`), Welle-6-Rest aus 144 (3 umgesetzt, 1 verworfen). |

For closed/older sessions: [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Latest pipeline state" + [`brain/wiki/log.md`](../brain/wiki/log.md).
