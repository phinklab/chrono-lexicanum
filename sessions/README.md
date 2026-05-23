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

> **Aktueller Kopf (2026-05-23).** `origin/main` trägt seit dem post-092-Stand drei weitere gemergte Stränge: **Resolver-Pass 7** (`ssot-w40k-036..045`, PR #90 — DB 350 → **450 W40K-Bücher**), **Brief 094** (Resolver-Loop — Resolver vom SSOT-Loop entkoppelt + headless automatisiert) und **Brief 095** (Rollup-Ownership). Alle drei sind implementiert + gemergt (Maintainer-bestätigt); die exakte HEAD-SHA ist nicht gepinnt (die Cowork-Sandbox fasst `git` nicht an).
>
> **Nächste Reihenfolge — brief-frei + operativ.** Brief 094 hat den Resolver vom SSOT-Loop entkoppelt und beide Loops headless gemacht: der SSOT-Loop läuft cadence-frei bis 859 durch, der Resolver-Loop verarbeitet kristallisierte Batches in ≤60-Buch-Wellen. Philipp lässt den SSOT-Loop weiterlaufen (`bash scripts/run-ssot-loop.sh` aus dem Batches-Worktree — kristallisiert `ssot-w40k-046+`) und startet dann den headless `bash scripts/run-resolver-loop.sh`. Erster scharfer headless Lauf = die 115 W40K-Reste (`046..057`) in zwei Wellen (`046..051` = 60 + `052..057` = 55). **Kein Architekten-Brief nötig.** Der nächste Brief ist der **Konsolidierungs-Pass** am W40K-complete-Meilenstein (565 Bücher; eigener Pass-Typ, in Brief 094 abgegrenzt, doubles as Maschinerie-Test vor der HH-Domain) — fällig wenn die Loops 565 erreichen.
>
> **Rollup-Ownership ist scharf (Brief 095).** `sessions/README.md` + `brain/**` werden ab jetzt ausschließlich aus dem Koordinations-Worktree geschrieben — nie aus den Product-/Batches-Strängen. Strang-Reports tragen substantielle System-Fakten in „What I did" / „For next session"; Cowork zieht sie im Post-Merge-Koordinations-Pass nach. Dieser README-Stand ist das Ergebnis genau eines solchen Passes (post-093/094/095).
>
> **Archivierungs-Rückstand:** `sessions/` root trägt weiterhin geschlossene Session-Files (062–095); per Archive-Regel gehören die nach `archive/2026-05/`. Der Move ist an lint-geprüfte `sources:`-/Link-Referenzen in `brain/wiki/**` gekoppelt — am saubersten als eigene kleine CC-Aufgabe (`git mv` + Referenz-Rewrite + `brain:lint`-Verifikation; Präzedenz: Briefs 050/051).

| Session | Role | Status | Topic |
|---|---|---|---|
| 2026-05-23 · Post-Merge-Koordinations-Pass | cowork | complete | Pass 7 + Brief 094 + Brief 095 in die Rollup-Dateien eingearbeitet (`project-state` / `pipeline-state` / `open-questions` / `index` / `log` / diese README). Erster Pass unter der Brief-095-Rollup-Ownership-Regel (Cowork als alleiniger Schreiber von `sessions/README.md` + `brain/**`). Kein Code-/Schema-/DB-Touch. |
| [2026-05-23-095-arch-rollup-ownership](./2026-05-23-095-arch-rollup-ownership.md) + [095-impl](./2026-05-23-095-impl-rollup-ownership.md) | architect + implementer | complete — merged | **Rollup-Ownership.** `sessions/README.md` + `brain/**` werden nur noch im Koordinations-Worktree geschrieben — nie in den Strang-Worktrees; plus Worktree-Selbstprüfung am Session-Start (Ansage + Halt-mit-Rückfrage bei Strang-Mismatch). Edits an `CLAUDE.md`/`AGENTS.md`/`cc-session.md`/`cowork-session.md` + Sweep `sessions-format.md`/`brain/CLAUDE.md`. Reine Doku, kein Code. |
| [2026-05-23-094-arch-resolver-loop](./2026-05-23-094-arch-resolver-loop.md) + [094-impl](./2026-05-23-094-impl-resolver-loop.md) | architect + implementer | complete — merged | **Resolver-Loop.** Resolver vom SSOT-Loop entkoppelt + brief-frei headless automatisiert: Cadence raus (SSOT-Loop läuft bis 859), Wellen-Detektor `resolver-loop-detect.ts` + Auto-Config, brief-freies Runbook, headless `run-resolver-loop.sh` (Resume + Halt-Disziplin + State-File). `test:resolver-loop-detect` 22/22, Trias grün, Live-Smoke `idle`. |
| [2026-05-22-093-arch-resolver-pass-7](./2026-05-22-093-arch-resolver-pass-7.md) + [impl-report](./resolver-dossiers/resolver-pass-7-impl-report.md) | architect + implementer | complete — merged (PR #90) | **Resolver-Pass 7.** `ssot-w40k-036..045` (W40K-0351..0450) → DB von 350 auf **450 W40K-Bücher**. Erster echter Lauf auf der 6-Phasen-4a/4b-Maschinerie; supervised/axis-sliced. Counts `work_factions 1424→1659`, `work_locations 543→638`, `work_characters 844→1074`. Dry-Prediction == DB-POST-APPLY exakt, Trias grün, kein needs-decision. |
| [2026-05-11-061-arch-ssot-loop](./2026-05-11-061-arch-ssot-loop.md) | architect | open (standing) | **Standing-Loop.** 450 Bücher kristallisiert + applied; läuft seit Brief 094 cadence-frei weiter bis 859 (keine Resolver-Pause mehr). Die operative Iter-Spec lebt seit Brief 088 in [`ssot-loop-runbook.md`](./ssot-loop-runbook.md), Brief 061 trägt nur noch die Design-Rationale. Side-effect-ADR: [`brain/wiki/decisions/why-cc-direct-curation.md`](../brain/wiki/decisions/why-cc-direct-curation.md). |

For closed sessions: [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Recently shipped" + [`brain/wiki/log.md`](../brain/wiki/log.md).
