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

> **Aktueller Kopf (2026-05-25).** **W40K ist datenkomplett — 565/565 Bücher in Postgres.** Seit dem post-095-Stand sind drei Stränge gemergt: der **SSOT-Loop-Lauf** (12 Iterationen, PR #94 — `ssot-w40k-046..057` kristallisiert), **Resolver-Pass 8** + der Brief-097-Hotfix (PR #95 — DB 450 → 510) und **Resolver-Pass 9** (PR #96 — DB 510 → **565**, die finale W40K-Welle). Die W40K-Bootstrap-Resolver-Kadenz (Pässe 1–9) ist damit abgeschlossen; der nächste Resolver-Lauf wäre die erste Horus-Heresy-Welle (eigener Brief, später).
>
> **Nächster Schritt — Brief 098 (W40K-Konsolidierungs-Pass).** Der in Brief 094 abgegrenzte Pass am W40K-complete-Meilenstein: ein eigener Pass-Typ, der die über neun Wellen gewachsene Reference-Schicht global auf Cross-Wave-Dubletten prüft und merged — gebaut + erstmals über das W40K-Entitäten-Set gefahren. Plus eine kurze Vorab-Verifikation (Teil 1): prüfen, dass `resolver-loop-log.md` + Wellen-Detektor korrekt `w40k-complete` melden (die Pass-8-/9-Blöcke sind inzwischen auf `main`). Batches-Strang, normaler Stop-before-push-Modus. *Brief am 2026-05-25 in fünf Runden nach Codex-Review plus zwei Maintainer-Review-Runden revidiert (Teil 1 → Verifikation, expliziter DB-Reference-Prune inkl. `characters.primary_faction_id`-Remap, Adjudikations-Dossier, Field-Retention, 120k-Token-Budget, `npm run typecheck` + `brain:lint`; Runde 3: Field-Retention auch DB-seitig synchronisiert, atomarer Prune mit Dry-Run-Plan/Transaktion/Post-Verify, neue `consolidation-*`-Skripte statt In-Place-Umbau der Resolver-Skripte; Runde 4: Snapshot-/Rollback-Artefakt vor dem Prune, maschinenlesbare `merge-map.json` als DB-Sync-Quelle, operationale W40K-Scope-Definition, dedizierte `consolidation-pass.config.json`; Runde 5: Reference-Premerge-Snapshot vor den JSON-Edits, Session-Start-Routing für den Pass-Typ in `CLAUDE.md`/`AGENTS.md`, präzisierte `tags`-vs-DB-Row-Verifikation; Runde 6 (Maintainer-Review): Maintainer-Review-Gate vor dem Prod-DB-Prune, gepaarter Impl-Report wieder verpflichtend, präzisierte HH-Scope-Definition; Runde 7 (Maintainer-Review): DB-Snapshot vor den Re-Apply gezogen, vetoete Merges bleiben als no-merge in der Merge-Map).*
>
> **Paralleler Product-Strang — Brief 096 (Design-Direction).** Das site-weite Visual-Redesign läuft im `chrono-lexicanum-product`-Worktree, lokal-iterativ — Philipp committet erst, wenn das meiste sitzt, der PR kommt erst auf ausdrückliches `fertig`. Unabhängig von der Daten-/HH-Linie. (Der Brief lag bis zur Cowork-Session 2026-05-25 nur lokal auf einem Altbranch und ist in dieser Session ins Repo zurückgeholt worden.)
>
> **Rollup-Ownership (Brief 095) ist scharf.** `sessions/README.md` + `brain/**` werden ausschließlich aus dem Koordinations-Worktree geschrieben. Dieser README-Stand ist das Ergebnis des Post-Merge-Koordinations-Passes vom 2026-05-25 (#94 / #95 / #96 eingearbeitet).
>
> **Archivierungs-Rückstand:** `sessions/` root trägt weiterhin geschlossene Session-Files (062–097) inkl. der `resolver-dossiers/`-Pass-8-/9-Reports; per Archive-Regel gehören die nach `archive/2026-05/`. Der Move ist an lint-geprüfte `sources:`-/Link-Referenzen in `brain/wiki/**` gekoppelt — am saubersten als eigene kleine CC-Aufgabe (`git mv` + Referenz-Rewrite + `brain:lint`-Verifikation; Präzedenz: Briefs 050/051).

| Session | Role | Status | Topic |
|---|---|---|---|
| [2026-05-25-098-arch-w40k-consolidation-pass](./2026-05-25-098-arch-w40k-consolidation-pass.md) | architect | open | **W40K-Konsolidierungs-Pass.** Cross-Wave-Canonical-Row-Dedup: ein eigener Pass-Typ (schlankes Geschwister-Runbook + Dubletten-Kandidaten-Aggregator + Adjudikations-Dossier + Reference-Prune), der die über neun Wellen gewachsene Reference-Schicht global dedupt — gebaut + erstmals über das W40K-Entitäten-Set gefahren. Teil 1: `resolver-loop-log.md`-Verifikation (Detektor-Stand prüfen). Batches-Strang. Revidiert 2026-05-25 (5 Runden Codex-Review + 2 Maintainer-Reviews). |
| [2026-05-23-096-arch-design-direction](./2026-05-23-096-arch-design-direction.md) | architect | open | **Design-Direction.** Site-weites Visual-Redesign nach neuer grafischer Richtung (Handoff-Datei). In Arbeit im `chrono-lexicanum-product`-Worktree, lokal-iterativ — kein PR bis `fertig`. Reiner Product/UI-Strang, kein DB-/Pipeline-Touch. |
| [2026-05-23-097-arch-resolver-loop-finalize-fix](./2026-05-23-097-arch-resolver-loop-finalize-fix.md) + [097-impl](./2026-05-23-097-impl-resolver-loop-finalize-fix.md) | architect + implementer | complete — merged (PR #95) | **Resolver-Loop finalize fix.** Hotfix der `readonly STATE_FILE`-Kollision in `run-resolver-loop.sh` + Pass-8-Loop-Log-Backfill. Gemergt zusammen mit Resolver-Pass 8. |
| [Resolver-Pass 9](./resolver-dossiers/resolver-pass-9-impl-report.md) | implementer | complete — merged (PR #96) | **W40K complete.** `ssot-w40k-052..057` (W40K-0511..0565) → DB 510 → **565**. Die finale W40K-Welle; Dry-Prediction == DB exakt, Trias grün, `EXPECTED_RANGES.factions.max` 1900 → 2100. |
| [Resolver-Pass 8](./resolver-dossiers/resolver-pass-8-impl-report.md) | implementer | complete — merged (PR #95) | `ssot-w40k-046..051` (W40K-0451..0510) → DB 450 → 510. Erste Welle der headless-Loop-Maschinerie (supervised gefahren). |
| SSOT-Loop-Lauf (PR #94) | implementer | complete — merged | 12 Iterationen `run-ssot-loop.sh` — `ssot-w40k-046..057` kristallisiert (115 W40K-Reste). Fortschritt in [`ssot-loop-log.md`](./ssot-loop-log.md). |
| 2026-05-25 · Post-Merge-Koordinations-Pass + Brief 098 | cowork | complete | #94 / #95 / #96 in die Rollup-Dateien eingearbeitet (`project-state` / `pipeline-state` / `open-questions` / `index` / `log` / diese README); Brief 098 geschrieben; Brief 096 vom Altbranch ins Repo zurückgeholt. Kein Code-/Schema-/DB-Touch. |
| [2026-05-11-061-arch-ssot-loop](./2026-05-11-061-arch-ssot-loop.md) | architect | open (standing) | **Standing-Loop.** 565 W40K-Bücher kristallisiert + applied; läuft cadence-frei weiter — der nächste Lauf kippt in die HH-Domäne (294 Bücher). Operative Iter-Spec: [`ssot-loop-runbook.md`](./ssot-loop-runbook.md). |

For closed sessions: [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Recently shipped" + [`brain/wiki/log.md`](../brain/wiki/log.md).
