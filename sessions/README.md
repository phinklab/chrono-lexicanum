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

> **Aktueller Kopf (2026-05-25).** **W40K ist datenkomplett *und* konsolidiert — 565/565 Bücher in Postgres.** Brief 098 (W40K-Konsolidierungs-Pass) ist gemergt: der neue Pass-Typ ist gebaut und erstmals über das W40K-Entitäten-Set gelaufen — 15 Dubletten-Kandidaten, **2 echte Cross-Wave-Merges** (`vigilus_s`→`vigilus`, `magister_sek`→`anakwanar_sek`), 0 geflaggt. Reference-Schicht jetzt `factions 173` / `locations 224` / `characters 344`, Junction-Counts unverändert. Die niedrige Dubletten-Zahl bestätigt, dass die per-Welle-Disziplin über alle neun Resolver-Wellen gehalten hat. Die W40K-Bootstrap-Resolver-Kadenz (Pässe 1–9) plus die erste Konsolidierung sind damit abgeschlossen.
>
> **Nächster Schritt — Brief 099 (Sessions-Archiv-Sweep).** Reine Repo-Hygiene im Koordinations-Worktree: die ~55 geschlossenen Session-Files (062–097) aus dem `sessions/`-Root nach `archive/2026-05/` verschieben, alle `sources:`-/Link-Referenzen umschreiben, `brain:lint` grün ziehen. Präzedenz Brief 051. `status: open`.
>
> **Großer nächster Daten-Strang — HH-Domain-Resolver.** Sobald die Horus-Heresy-Bücher (294) durch den SSOT-Loop kristallisiert sind, braucht die HH-Domäne einen eigenen Resolver-Brief: der headless Detektor `resolver-loop-detect.ts` ist W40K-only und meldet `w40k-complete` als Terminal-Zustand. Eigener Brief, sobald Philipp ihn ansetzt.
>
> **Paralleler Product-Strang — Brief 096 (Design-Direction).** Das site-weite Visual-Redesign läuft im `chrono-lexicanum-product`-Worktree, lokal-iterativ — Philipp committet erst, wenn das meiste sitzt, der PR kommt erst auf ausdrückliches `fertig`. Unabhängig von der Daten-/HH-Linie. **Andockende UI-Posten** (Cowork-Session 2026-05-25): Public-Page-Rating-Render (`bookDetails.rating` liegt für ~556/565 Bücher in der DB, `/buch/[slug]` rendert es nicht) und die Cockpit-Drift-Tie-Group-Sub-Sortierung gehören in bzw. an dieses Redesign — kein eigener Parallel-Brief.
>
> **Rollup-Ownership (Brief 095) ist scharf.** `sessions/README.md` + `brain/**` werden ausschließlich aus dem Koordinations-Worktree geschrieben. Dieser README-Stand ist das Ergebnis des Post-Merge-Koordinations-Passes für Brief 098 (2026-05-25).

| Session | Role | Status | Topic |
|---|---|---|---|
| [2026-05-25-099-arch-sessions-archive-sweep](./2026-05-25-099-arch-sessions-archive-sweep.md) | architect | open | **Sessions-Archiv-Sweep.** Geschlossene Root-Session-Files (062–097) nach `sessions/archive/2026-05/` verschieben + Referenz-Rewrite über `brain/**` / Top-Level-Docs + `brain:lint` grün. Koordinations-Worktree, Meta/Session-Task. Reine Hygiene, kein Code-/Schema-/DB-Touch. |
| [2026-05-25-098-arch-w40k-consolidation-pass](./2026-05-25-098-arch-w40k-consolidation-pass.md) + [098-impl](./2026-05-25-098-impl-w40k-consolidation-pass.md) | architect + implementer | complete — merged | **W40K-Konsolidierungs-Pass.** Neuer Pass-Typ für Cross-Wave-Canonical-Row-Dedup, gebaut + erstmals über das W40K-Entitäten-Set gefahren. 2 Merges, 13 no-merges, 0 geflaggt; `locations 225→224`, `characters 345→344`, Junctions unverändert. Maintainer-Review-Gate eingehalten. Teil 1 (`resolver-loop-log.md`-Verifikation): kein Drift. |
| [2026-05-23-096-arch-design-direction](./2026-05-23-096-arch-design-direction.md) | architect | open | **Design-Direction.** Site-weites Visual-Redesign nach neuer grafischer Richtung. In Arbeit im `chrono-lexicanum-product`-Worktree, lokal-iterativ — kein PR bis `fertig`. Reiner Product/UI-Strang, kein DB-/Pipeline-Touch. |
| [Resolver-Pass 9](./resolver-dossiers/resolver-pass-9-impl-report.md) | implementer | complete — merged (PR #96) | **W40K complete.** `ssot-w40k-052..057` (W40K-0511..0565) → DB 510 → **565**. Die finale W40K-Welle; Dry-Prediction == DB exakt, Trias grün. |
| 2026-05-25 · Post-Merge-Koordinations-Pass (#98) + Brief 099 | cowork | complete | Brief 098 in die Rollup-Dateien eingearbeitet (`project-state` / `pipeline-state` / `open-questions` / `index` / `log` / diese README); Brief 099 (Sessions-Archiv-Sweep) geschrieben. Kein Code-/Schema-/DB-Touch. |
| [2026-05-11-061-arch-ssot-loop](./2026-05-11-061-arch-ssot-loop.md) | architect | open (standing) | **Standing-Loop.** 565 W40K-Bücher kristallisiert + applied; läuft cadence-frei weiter — der nächste Lauf kippt in die HH-Domäne (294 Bücher). Operative Iter-Spec: [`ssot-loop-runbook.md`](./ssot-loop-runbook.md). |

For closed sessions: [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Recently shipped" + [`brain/wiki/log.md`](../brain/wiki/log.md).
