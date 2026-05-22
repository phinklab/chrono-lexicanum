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

> **Aktueller Kopf (2026-05-22).** `origin/main` steht auf `e67207a`. Seit der Pass-6-Reihe gemerged: **Brief 091** (Resolver-Pass-Phase-4-Split 4a/4b + range-aware forward-ref-Guard — implementiert, [`091-impl`](./2026-05-22-091-impl-resolver-phase4-split.md)), **Session 092** (Roster-Excel-Hygiene-Sweep, PR #85) und der **SSOT-Loop-Lauf `ssot-w40k-036..045`** (PR #87): 100 Bücher W40K-0351..0450 kristallisiert, kumulativ 450 Override-Files, der `⏸ Resolver-Pause bei 450 Büchern`-Block steht im Loop-Log. DB-Stand unverändert 350 W40K-Bücher (Pass 7 schreibt sie auf 450).
>
> **Nächste Reihenfolge:** **Resolver-Pass 7** (`ssot-w40k-036..045` / W40K-0351..0450 → DB von 350 auf 450 Bücher). Der Cowork-Setup-Schritt ist durch: per-pass Brief [`093`](./2026-05-22-093-arch-resolver-pass-7.md) geschrieben + `scripts/resolver-pass.config.json` von Pass 6 auf Pass 7 re-keyed. Gefahren wird Pass 7 als sechs Phasen-Subsessions (0/1/2/3/4a/4b) nach [`resolver-pass-runbook.md`](./resolver-pass-runbook.md) + Config — erster produktiver Lauf auf der von Brief 091 gesplitteten 6-Phasen-Maschinerie. Brief 093 trägt zusätzlich den korrigierten Slug-/Title-Delta-Befund (W40K-0259/0330 — out of scope für Pass 7, der Re-Apply friert `slug`/`title` ein). Ein Review des Pass-7-Setups hat drei Findings ergeben: zwei sind in-place im Setup-Commit gefixt (Phase-4b-Write-Scope um Brief 093 ergänzt; veraltete Slug-Delta-Formulierung in dieser README korrigiert), das dritte — `run-phase4-apply.sh` schluckt Seed-/Apply-Fehler — wird direkt in einer kurzen Claude-Code-Session gefixt (kein eigener Brief) und soll **vor** Pass 7 Phase 4a landen. Danach: SSOT-Loop-Lauf `ssot-w40k-046..055`, nächste Resolver-Pause bei 550.
>
> **OQ (14) geschlossen (post-092).** PR #85 (Roster-Excel-Hygiene-Sweep, [Session 092](./2026-05-22-092-impl-roster-hygiene.md)) ist gemerged — `origin/main` damit über `72c8788` hinaus vorgerückt. OQ (14) Roster-Excel-Hygiene-Sweep ist vollständig erledigt: alle fünf Gruppen (a)–(e) — `seriesHint`-Mistag (W40K-0244), sechs fehlende Autoren, zwei Format-`data_conflict` (W40K-0297/0334), zwei Titel-Mistags (W40K-0259/0330), fünf fehlende Collection-Kanten (W40K-0286/0307) — über reine Excel-SSOT-Edits + Loader-Regen. `book-roster.json` 191 → 196 Collections (`books` unverändert 859), kein DB-Touch. Der Slug-Delta aus den Titel-Fixes (W40K-0259 → `the-rose-in-anger`, W40K-0330 → `the-hunt-for-magnus`) ist — Befund in Brief 093 korrigiert — **out of scope für Resolver-Pass 7** (der Re-Apply friert `slug`/`title` ein) und in [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) § What's open als eigene, kleine Maintainer-Entscheidung geparkt. Offene OQ-Queue danach: OQ (3) Hand-Check-Workflow + OQ (13) Crawl-Simplification-Sichtung.
>
> **Archivierungs-Rückstand:** `sessions/` root trägt weiterhin geschlossene Session-Files (062–091); per Archive-Regel gehören die nach `archive/2026-05/`. Der Move ist an lint-geprüfte `sources:`-/Link-Referenzen in `brain/wiki/**` gekoppelt — am saubersten als eigene kleine CC-Aufgabe (`git mv` + Referenz-Rewrite + `brain:lint`-Verifikation; Präzedenz: Briefs 050/051).

| Session | Role | Status | Topic |
|---|---|---|---|
| [2026-05-22-093-arch-resolver-pass-7](./2026-05-22-093-arch-resolver-pass-7.md) | architect | open | **Resolver-Pass 7.** `ssot-w40k-036..045` (W40K-0351..0450) → DB von 350 auf 450 Bücher. Per-pass Config-Re-Key ist durch; gefahren als sechs Phasen-Subsessions (0/1/2/3/4a/4b) nach Runbook + Config. Trägt das korrigierte Slug-/Title-Delta-Finding (W40K-0259/0330 — out of scope, `slug`/`title` frozen on update). Wartet auf Claude Code. |
| 2026-05-22 · Resolver-Pass-7-Setup + Review | cowork | complete | Brief 093 geschrieben + `scripts/resolver-pass.config.json` von Pass 6 auf Pass 7 re-keyed (wave `036..045`, `applyRange` 1..45, Verify-Ranges W40K-0351..0450, `clusters` + `smokeSlugs` aus den Override-Files, `brief`-Feld auf Brief 093); `sessions/README.md` + `brain/wiki/project-state.md` nachgezogen. Anschließendes Setup-Review: drei Findings — Phase-4b-Write-Scope um Brief 093 ergänzt (Config) + Slug-Delta-Formulierung in dieser README korrigiert (beide in-place); `run-phase4-apply.sh`-Fail-Hard (Seed-/Apply-Fehler werden geschluckt) wird direkt in einer kurzen Claude-Code-Session gefixt, kein eigener Brief. |
| SSOT-Loop-Lauf `ssot-w40k-036..045` | loop run | complete — merged (PR #87) | Standing-Loop (Brief 061), zweite volle 100er-Welle: 100 Bücher W40K-0351..0450 in zehn Iterationen, zehn Override-JSONs + Loop-Log-Appends, diff-only, kein DB-Touch. Selbst-erkennender `⏸ Resolver-Pause bei 450 Büchern`-Block. |
| [2026-05-22-091-arch-resolver-phase4-split](./2026-05-22-091-arch-resolver-phase4-split.md) + [091-impl](./2026-05-22-091-impl-resolver-phase4-split.md) | architect + implementer | complete — merged | **Resolver-Pass Phase-4-Split.** Phase 4 → 4a (Integration/Apply) + 4b (Verify/Report), `/clear`-getrennt, Handoff über eine 4a-Statusdatei; forward-ref-Collection-Guard in `apply-override-dry.ts` von report-only auf range-aware gehärtet. 6-Phasen-Maschinerie in `resolver-pass-runbook.md` + `resolver-pass.config.json`. |
| [2026-05-11-061-arch-ssot-loop](./2026-05-11-061-arch-ssot-loop.md) | architect | open (standing) | **Standing-Loop.** 450 Bücher kristallisiert; als Nächstes via Resolver-Pass 7 in die DB. Die operative Iter-Spec lebt seit Brief 088 in [`ssot-loop-runbook.md`](./ssot-loop-runbook.md), Brief 061 trägt nur noch die Design-Rationale. Side-effect-ADR: [`brain/wiki/decisions/why-cc-direct-curation.md`](../brain/wiki/decisions/why-cc-direct-curation.md). |

For closed sessions: [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Recently shipped" + [`brain/wiki/log.md`](../brain/wiki/log.md).
