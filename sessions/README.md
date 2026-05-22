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
> **Maintainer-Punkt:** OQ (14) Roster-Excel-Hygiene-Sweep ist nach Pass 6 fünf Gruppen lang — Format-`data_conflict` (W40K-0297/0334), Titel-Mistags (W40K-0259/0330) und neu zwei fehlende Collection-Kanten (Architect of Fate W40K-0286, War for Armageddon Omnibus W40K-0307); alles reine Excel-SSOT-Edits.
>
> **Archivierungs-Rückstand:** `sessions/` root trägt weiterhin geschlossene Session-Files (062–091); per Archive-Regel gehören die nach `archive/2026-05/`. Der Move ist an lint-geprüfte `sources:`-/Link-Referenzen in `brain/wiki/**` gekoppelt — am saubersten als eigene kleine CC-Aufgabe (`git mv` + Referenz-Rewrite + `brain:lint`-Verifikation; Präzedenz: Briefs 050/051).

| Session | Role | Status | Topic |
|---|---|---|---|
| [2026-05-22-091-arch-resolver-phase4-split](./2026-05-22-091-arch-resolver-phase4-split.md) | architect | open | **Resolver-Pass Phase-4-Split.** Phase 4 → 4a (Integration/Apply) + 4b (Verify/Report), `/clear`-getrennt, Handoff über eine 4a-Statusdatei; forward-ref-Guard in `apply-override-dry.ts` von report-only auf range-aware gehärtet. Touch-Set: `resolver-pass-runbook.md` + `resolver-pass.config.json` + `apply-override-dry.ts` + Driver-Verifikation. Wartet auf Claude Code. |
| 2026-05-22 · Pass-6-Review + Brief 091 + Brain-Hygiene | cowork | complete | Resolver-Pass 6 reviewed (sauberer Lauf); Brief 091 geschrieben; Brain-Hygiene-Pass post-091 (`project-state`/`pipeline-state`/`open-questions`/`index`/`log` auf 350 Bücher + Pass-6-Ergebnis); dieses README. |
| Resolver-Pass 6 — `ssot-w40k-026..035` | resolver pass | complete — merged (PR #83) | Erster brief-freier, runbook-getriebener Resolver-Pass (W40K-0251..0350, erste 100er-Welle), supervised/axis-sliced gefahren. 350/350 W40K-Bücher applied, Dry-Prediction == DB exakt, Trias grün. Reports unter [`resolver-dossiers/`](./resolver-dossiers/). |
| [2026-05-11-061-arch-ssot-loop](./2026-05-11-061-arch-ssot-loop.md) | architect | open (standing) | **Standing-Loop.** 350 Bücher kristallisiert + via Resolver-Pass 6 in der DB applied; die operative Iter-Spec lebt seit Brief 088 in [`ssot-loop-runbook.md`](./ssot-loop-runbook.md), Brief 061 trägt nur noch die Design-Rationale. Bereit für den nächsten Lauf `ssot-w40k-036..045` (350er-Pause durch Pass 6 geräumt). Side-effect-ADR: [`brain/wiki/decisions/why-cc-direct-curation.md`](../brain/wiki/decisions/why-cc-direct-curation.md). |

For closed sessions: [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Recently shipped" + [`brain/wiki/log.md`](../brain/wiki/log.md).
