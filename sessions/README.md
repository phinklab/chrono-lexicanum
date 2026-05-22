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

> **Aktueller Kopf (2026-05-22).** `origin/main` steht auf `131a8a4`. Seit dem post-089-Stand gemerged: **Brief 090** (Resolver-Pass lean, PR #80) und der **100er-Loop-Lauf `ssot-w40k-026..035`** (PR #81). Brief 090 hat den Resolver-Pass **brief-frei + runbook-getrieben** gemacht — operative Spec: [`resolver-pass-runbook.md`](./resolver-pass-runbook.md); Phase 4 digest-only; stabile wave-parametrisierte Tools statt `-NNN`-Klone; Resolver-Cadence 50→100 (nächste Pause 350/450/550). Der 100er-Loop hat W40K-0251..0350 als zehn Override-JSONs kristallisiert — **350 Override-Files committed, DB weiterhin bei 250 applied**; der selbst-erkennende `⏸`-Resolver-Pause-Block bei 350 steht im Loop-Log.
>
> **Nächste Reihenfolge:** **Resolver-Pass 6** für `ssot-w40k-026..035` (W40K-0251..0350) — brief-frei, runbook-getrieben. `scripts/resolver-pass.config.json` ist in der Cowork-Session 2026-05-22 von Pass 5 auf Pass 6 umgestellt (`pass=6`, wave `026..035`, `applyRange` 1..35, Verify-Ranges, Phase 4 ohne Facet-Promotion). Gefahren wird er als Sequenz von 5 Phasen-Subsessions (ein `/clear` je Phase) nach [`resolver-pass-runbook.md`](./resolver-pass-runbook.md) + der Config — Brief 090 selbst wird **nicht** gelesen. Optional headless über `scripts/run-resolver-pass.sh scripts/resolver-pass.config.json` (Driver weiterhin supervised, noch nicht produktiv-gefahren). **Maintainer-Punkt:** OQ (14) Roster-Excel-Hygiene-Sweep ist um vier neue Flags aus der `026..035`-Welle gewachsen — Format-`data_conflict` W40K-0297 (Flesh Tearers) + W40K-0334 (Lords of Caliban) und Titel-Mistags W40K-0259 (Rose in Anger) + W40K-0330 (Hunt for Magnus); reine Excel-SSOT-Edits.
>
> **Archivierungs-Rückstand:** `sessions/` root trägt weiterhin geschlossene Session-Files (062–090); per Archive-Regel gehören die nach `archive/2026-05/`. Der Move ist an lint-geprüfte `sources:`-/Link-Referenzen in `brain/wiki/**` gekoppelt — am saubersten als eigene kleine CC-Aufgabe (`git mv` + Referenz-Rewrite + `brain:lint`-Verifikation; Präzedenz: Briefs 050/051).

| Session | Role | Status | Topic |
|---|---|---|---|
| Resolver-Pass 6 — `ssot-w40k-026..035` | resolver pass | pending — Config bereit | **Brief-freier, runbook-getriebener Resolver-Pass 6** für W40K-0251..0350. Sechste Welle, erstmals als 100er-Welle (10 Batches). `resolver-pass.config.json` auf Pass 6 gesetzt; gefahren über [`resolver-pass-runbook.md`](./resolver-pass-runbook.md) (5 Phasen-Subsessions) oder `scripts/run-resolver-pass.sh`. Erwartetes Ende: DB von 250 auf 350 applied, 350er-Resolver-Pause geräumt. |
| 2026-05-22 · Resolver-Pass-6-Setup + Brain-Hygiene | cowork | complete | `resolver-pass.config.json` Pass 5 → Pass 6; Brain-Hygiene-Pass (`project-state`/`pipeline-state`/`open-questions`/`index`/`log` auf 350 Override-Files + Brief-090-Maschinerie + 100er-Loop); `CLAUDE.md` um die Git-Sandbox-Prevention-Regel ergänzt; dieses README. |
| [2026-05-21-090-arch-resolver-pass-lean](./2026-05-21-090-arch-resolver-pass-lean.md) | architect | implemented + merged (PR #80) | **Resolver-Pass lean.** Token-Budget pro Phase: schlankes [`resolver-pass-runbook.md`](./resolver-pass-runbook.md), brief-freier Driver, Phase-4 digest-only, stabile wave-parametrisierte Tools (keine `-NNN`-Klone mehr), Resolver-Cadence 50→100. |
| [2026-05-21-090-impl-resolver-pass-lean](./2026-05-21-090-impl-resolver-pass-lean.md) | implementer | complete + merged (PR #80) | Brief 090 umgesetzt — Mess-Gate bestätigt (Vorab-Dokumentenlast ~22k/Phase + Phase-4-Korpus-Skalierung), Bausteine 2–5 gebaut, Phase-4-Digest live gegen 250 Bücher idempotent-validiert. Suite grün. |
| 2026-05-21 · SSOT-Loop `ssot-w40k-026..035` | loop | merged (PR #81) | Standing-Loop (Brief 061) Iterationen 026..035 — erste 100er-Welle: 10 Override-JSONs W40K-0251..0350 + `ssot-loop-log.md`-Append, diff-only, kein DB-Touch. Vier Loop-Disziplinen aktiv; kumulativ 350 Override-Files, selbst-erkennender 350er-Pause-Block. |
| [2026-05-11-061-arch-ssot-loop](./2026-05-11-061-arch-ssot-loop.md) | architect | open (standing) | **Standing-Loop.** 350 Override-Files (DB bei 250 applied); die operative Iter-Spec lebt seit Brief 088 in [`ssot-loop-runbook.md`](./ssot-loop-runbook.md), Brief 061 trägt nur noch die Design-Rationale. Loop pausiert bei 350, bis Resolver-Pass 6 durch ist. Side-effect-ADR: [`brain/wiki/decisions/why-cc-direct-curation.md`](../brain/wiki/decisions/why-cc-direct-curation.md). |

For closed sessions: [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Recently shipped" + [`brain/wiki/log.md`](../brain/wiki/log.md).
