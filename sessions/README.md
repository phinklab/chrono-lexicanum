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

> **Aktueller Kopf (2026-05-26, post-Merge Brief 100).** **W40K datenkomplett + konsolidiert; Resolver-Maschinerie HH-ready; HH-Resolver-Trial wartet operativ.** Brief 098 (W40K-Konsolidierungs-Pass), Brief 099 (Sessions-Archiv-Sweep) und **Brief 100 (HH-Resolver-Domain-Öffnung)** sind alle gemergt. Der Headless-Resolver-Loop ist zwei-domänen-fähig (W40K + HH), drei externe Terminal-Zustände `open-wave | idle | all-complete`, HH-Bootstrap-Welle verbindlich `ssot-hh-001..002` (20 Bücher, Pass 10). HH-SSOT-Loop hat alle 30 Batches (`ssot-hh-001..030`, 294 Bücher) kristallisiert — Korpus damit komplett crystallized (565 W40K + 294 HH = 859/859 Override-Files).
>
> **Nächster Schritt — HH-Resolver-Trial-Lauf (operativ, kein Brief).** Philipp triggert `scripts/run-resolver-loop.sh` über die HH-Domäne; ~6 Wellen bis `all-complete`. Worauf zu achten ist: Phase-3-Token-Budget der Bootstrap-Welle (Foundational Ten + Mournival + erste Primarchen ≈ 150–200 neue Characters); Cross-Era-Alias-Disziplin (`Luna Wolves` → `sons_of_horus`, `Kharn` → `kharn_the_betrayer`, `Abaddon` → `abaddon_the_despoiler`, `Magnus` → `magnus_the_red`, `Lucius` → `lucius_the_eternal` resolven als Aliases zu existierenden W40K-Rows — kein neuer luna_wolves-Row); EXPECTED_RANGES-Cap-Riss → `## Needs decision`-Stop. **Nach dem Trial:** HH-Konsolidierungs-Pass-Folge-Brief (schlank — Maschinerie aus Brief 098 existiert), Korpus 859/859 datenkomplett + konsolidiert.
>
> **Paralleler Product-Strang — Brief 096 (Design-Direction).** Das site-weite Visual-Redesign läuft im `chrono-lexicanum-product`-Worktree, lokal-iterativ — Philipp committet erst, wenn das meiste sitzt, der PR kommt erst auf ausdrückliches `fertig`. Unabhängig von der Daten-/HH-Linie. **Andockende UI-Posten** (Cowork-Session 2026-05-25): Public-Page-Rating-Render (`bookDetails.rating` liegt für ~556/565 W40K-Bücher in der DB, `/buch/[slug]` rendert es nicht) und die Cockpit-Drift-Tie-Group-Sub-Sortierung gehören in bzw. an dieses Redesign — kein eigener Parallel-Brief.
>
> **Rollup-Ownership (Brief 095) ist scharf.** `sessions/README.md` + `brain/**` werden ausschließlich aus dem Koordinations-Worktree geschrieben. Dieser README-Stand und der vollständige Post-Merge-Koordinations-Pass über `project-state.md` / `pipeline-state.md` / `open-questions.md` / `log.md` / `index.md` plus die neue ADR `decisions/cross-era-identities.md` landen in einem Doc-only-Commit direkt auf `main` (PR-Policy 2026-05-25). Plus `CLAUDE.md` § Git um die PowerShell-Konvention erweitert (Cowork gibt Philipp git-Befehle zeilenweise, nie als `&&`-Kette).

| Session | Role | Status | Topic |
|---|---|---|---|
| [2026-05-26-100-arch-resolver-hh](./2026-05-26-100-arch-resolver-hh.md) + [100-impl](./2026-05-26-100-impl-resolver-hh.md) | architect + implementer | complete — merged | **HH-Resolver-Domain-Öffnung.** Detektor + Wrapper + Auto-Config + Verify-Trias zwei-domänen-fähig (W40K + HH); drei externe Terminal-Status (`open-wave \| idle \| all-complete`), W40K→HH-Übergang als interner Branch-Point. HH-Bootstrap-Welle `ssot-hh-001..002` (20 Bücher, Pass 10), spätere HH-Wellen regulär 50/60 → total ~6 HH-Wellen. Cross-Era-Identitäts-Disziplin (eine Canonical-Row pro Identität, Era-Surface-Forms als Aliases) im Runbook §4 + eigene ADR `decisions/cross-era-identities.md`. `EXPECTED_RANGES` auf 2500/1100/2200 (factions/locations/characters max) angehoben. 36 Detektor-Tests grün (von 22 prä-100); W40K-Hardcode-Sweep über das übrige Pass-Ökosystem negativ. Live-Smoke liefert die erwartete Bootstrap-Welle. |
| [2026-05-25-099-arch-sessions-archive-sweep](./2026-05-25-099-arch-sessions-archive-sweep.md) + [099-impl](./2026-05-25-099-impl-sessions-archive-sweep.md) | architect + implementer | complete — merged | **Sessions-Archiv-Sweep.** 53 geschlossene Session-Files (062–097) nach `sessions/archive/2026-05/` verschoben, 188 Pfad-Referenzen in 12 `brain/wiki/**`-Files umgeschrieben, `brain:lint` grün. Reine Repo-Hygiene, kein Code-/DB-Touch. |
| [2026-05-25-098-arch-w40k-consolidation-pass](./2026-05-25-098-arch-w40k-consolidation-pass.md) + [098-impl](./2026-05-25-098-impl-w40k-consolidation-pass.md) | architect + implementer | complete — merged | **W40K-Konsolidierungs-Pass.** Neuer Pass-Typ für Cross-Wave-Canonical-Row-Dedup, gebaut + erstmals über das W40K-Entitäten-Set gefahren. 2 Merges, 13 no-merges, 0 geflaggt; `locations 225→224`, `characters 345→344`. Maintainer-Review-Gate eingehalten. |
| [2026-05-23-096-arch-design-direction](./2026-05-23-096-arch-design-direction.md) | architect | open | **Design-Direction.** Site-weites Visual-Redesign nach neuer grafischer Richtung. In Arbeit im `chrono-lexicanum-product`-Worktree, lokal-iterativ — kein PR bis `fertig`. Reiner Product/UI-Strang, kein DB-/Pipeline-Touch. |
| [2026-05-11-061-arch-ssot-loop](./2026-05-11-061-arch-ssot-loop.md) | architect | open (standing) | **Standing-Loop.** 565 W40K-Bücher kristallisiert + applied; HH-Domäne in flight — 21 von 30 HH-Batches (`ssot-hh-001..021`, 210 Bücher) gemergt in `main`, die restlichen 9 Iter laufen via `run-ssot-loop.sh` parallel zur Cowork-2026-05-26-Session. Operative Iter-Spec: [`ssot-loop-runbook.md`](./ssot-loop-runbook.md). |

For closed sessions: [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Recently shipped" + [`brain/wiki/log.md`](../brain/wiki/log.md).
