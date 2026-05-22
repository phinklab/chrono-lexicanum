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

> **Aktueller Kopf (2026-05-22).** `origin/main` steht auf `72c8788`. Seit `131a8a4` gemerged: **PR #82** (Resolver-Pass-6-Setup — Config Pass 5→6 + Brain-Hygiene post-090) und **PR #83 — Resolver-Pass 6** (`ssot-w40k-026..035` / W40K-0251..0350). Pass 6 ist der erste Lauf unter dem Brief-090-lean-Kontrakt (brief-frei + runbook-getrieben, fünf Phasen-Subsessions, supervised gefahren): **350/350 W40K-Bücher in Postgres applied**, Dry-Run-Prediction == DB-POST-APPLY exakt, Trias grün, kein needs-decision. Detail: [`resolver-dossiers/resolver-pass-6-impl-report.md`](./resolver-dossiers/resolver-pass-6-impl-report.md).
>
> **Nächste Reihenfolge:** **Brief 091** ([`2026-05-22-091-arch-resolver-phase4-split.md`](./2026-05-22-091-arch-resolver-phase4-split.md)) splittet Resolver-Pass-Phase 4 in **4a (Integration/Apply)** + **4b (Verify/Report)** — Phase 4 ging in Pass 6 mit dem Kontextfenster Richtung ~300k Token (gegen ~120k Per-Phase-Budget). Brief 091 trennt Mutation von Verifikation/Report mit `/clear`-Handoff über eine 4a-Statusdatei und härtet zusätzlich den forward-ref-Collection-Guard von report-only auf range-aware. Reine Resolver-Pass-Maschinerie, vorwärtsgerichtet für Pass 7+. Danach: SSOT-Loop-Lauf `ssot-w40k-036..045` (`bash scripts/run-ssot-loop.sh`), dann Resolver-Pass 7 — nächste Resolver-Pause bei 450 (Cadence 50→100).
>
> **OQ (14) geschlossen (post-092).** PR #85 (Roster-Excel-Hygiene-Sweep, [Session 092](./2026-05-22-092-impl-roster-hygiene.md)) ist gemerged — `origin/main` damit über `72c8788` hinaus vorgerückt. OQ (14) Roster-Excel-Hygiene-Sweep ist vollständig erledigt: alle fünf Gruppen (a)–(e) — `seriesHint`-Mistag (W40K-0244), sechs fehlende Autoren, zwei Format-`data_conflict` (W40K-0297/0334), zwei Titel-Mistags (W40K-0259/0330), fünf fehlende Collection-Kanten (W40K-0286/0307) — über reine Excel-SSOT-Edits + Loader-Regen. `book-roster.json` 191 → 196 Collections (`books` unverändert 859), kein DB-Touch. Der Slug-Delta aus den Titel-Fixes (W40K-0259 → `the-rose-in-anger`, W40K-0330 → `the-hunt-for-magnus`) ist als Resolver-Pass-7-Watch-Item in [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) § What's open geparkt. Offene OQ-Queue danach: OQ (3) Hand-Check-Workflow + OQ (13) Crawl-Simplification-Sichtung.
>
> **Archivierungs-Rückstand:** `sessions/` root trägt weiterhin geschlossene Session-Files (062–091); per Archive-Regel gehören die nach `archive/2026-05/`. Der Move ist an lint-geprüfte `sources:`-/Link-Referenzen in `brain/wiki/**` gekoppelt — am saubersten als eigene kleine CC-Aufgabe (`git mv` + Referenz-Rewrite + `brain:lint`-Verifikation; Präzedenz: Briefs 050/051).

| Session | Role | Status | Topic |
|---|---|---|---|
| [2026-05-22-091-arch-resolver-phase4-split](./2026-05-22-091-arch-resolver-phase4-split.md) | architect | open | **Resolver-Pass Phase-4-Split.** Phase 4 → 4a (Integration/Apply) + 4b (Verify/Report), `/clear`-getrennt, Handoff über eine 4a-Statusdatei; forward-ref-Guard in `apply-override-dry.ts` von report-only auf range-aware gehärtet. Touch-Set: `resolver-pass-runbook.md` + `resolver-pass.config.json` + `apply-override-dry.ts` + Driver-Verifikation. Wartet auf Claude Code. |
| 2026-05-22 · Brain-Hygiene-Pass post-092 | cowork | complete | OQ (14) nach PR #85 / Session 092 in die Wiki eingearbeitet: `open-questions.md` (OQ (14) strike-through-closed), `project-state.md` (Roster 191→196 Collections, Slug-Delta-Watch-Item in § What's open), `pipeline-state.md` (191→196), `index.md`/`log.md`, dieses README. Kein Code-/Schema-/DB-Touch, kein Archivierungs-Move. |
| [2026-05-22-092-impl-roster-hygiene](./2026-05-22-092-impl-roster-hygiene.md) | implementer | complete — merged (PR #85) | **Roster-Excel-Hygiene-Sweep (OQ (14)).** Alle fünf Gruppen (a)–(e): `seriesHint`-Mistag (W40K-0244), sechs fehlende Autoren, zwei Format-`data_conflict` (W40K-0297/0334), zwei Titel-Mistags (W40K-0259/0330), fünf fehlende Collection-Kanten (W40K-0286/0307). xlsx + `book-roster.json` (191→196 Collections, `books` 859). Kein DB-Touch; Slug-Delta für Resolver-Pass 7 vermerkt. |
| 2026-05-22 · Pass-6-Review + Brief 091 + Brain-Hygiene | cowork | complete | Resolver-Pass 6 reviewed (sauberer Lauf); Brief 091 geschrieben; Brain-Hygiene-Pass post-091 (`project-state`/`pipeline-state`/`open-questions`/`index`/`log` auf 350 Bücher + Pass-6-Ergebnis); dieses README. |
| Resolver-Pass 6 — `ssot-w40k-026..035` | resolver pass | complete — merged (PR #83) | Erster brief-freier, runbook-getriebener Resolver-Pass (W40K-0251..0350, erste 100er-Welle), supervised/axis-sliced gefahren. 350/350 W40K-Bücher applied, Dry-Prediction == DB exakt, Trias grün. Reports unter [`resolver-dossiers/`](./resolver-dossiers/). |
| [2026-05-11-061-arch-ssot-loop](./2026-05-11-061-arch-ssot-loop.md) | architect | open (standing) | **Standing-Loop.** 350 Bücher kristallisiert + via Resolver-Pass 6 in der DB applied; die operative Iter-Spec lebt seit Brief 088 in [`ssot-loop-runbook.md`](./ssot-loop-runbook.md), Brief 061 trägt nur noch die Design-Rationale. Bereit für den nächsten Lauf `ssot-w40k-036..045` (350er-Pause durch Pass 6 geräumt). Side-effect-ADR: [`brain/wiki/decisions/why-cc-direct-curation.md`](../brain/wiki/decisions/why-cc-direct-curation.md). |

For closed sessions: [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Recently shipped" + [`brain/wiki/log.md`](../brain/wiki/log.md).
