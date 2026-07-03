---
session: 2026-07-02-176
role: architect
date: 2026-07-02
status: implemented
slug: roster-rebind-kleinkram
parent: null
links: [2026-06-30-171, 2026-06-14-151, 2026-06-01-112]
commits: []
---

# 176 — Roster-Rebind + Verify-Kleinkram + brain:lint-Budget-Guardrail (122-Batches)

## Goal

Drei kleine, unabhängige Hygiene-Posten in einem PR: (1) die zwei letzten Consumer des eingefrorenen `book-roster.json` auf den Per-Buch-Korpus rebinden, (2) die offenen Read-only-Verifikationen aus 151/171 einmal ziehen und dokumentieren, (3) den brain:lint-Always-Read-Budget-Guardrail aus Board-Task **B7** bauen (Spec: archivierter Brief 112).

## Context

- **Rebind (aus 171-Impl, Drift-Falle):** `scripts/import-faction-starters.ts` und der `book-review/projection`-Pfad lesen noch den eingefrorenen `book-roster.json` statt `loadEffectiveCorpusBooks` — sie sehen per-Buch-Bücher (alles, was seit der Migration via `/add-book` dazukommt) nicht. Der Roster selbst bleibt als eingefrorener Äquivalenz-Golden liegen (Brief 171) — nur die zwei Live-Consumer wechseln die Quelle.
- **Verify-Posten:** einmal `npm run refresh:audit-artifacts` lokal read-only (Brief-151-Preflight, bevor dem Wochenlauf vertraut wird). Optional, auf Philipps Go: `npm run db:drift` gegen Prod als read-only Bestätigung der Post-171-Applies.
- **B7 (Spec: [`archive/2026-06/2026-06-01-112-arch-brain-lint-always-read-budgets.md`](./archive/2026-06/2026-06-01-112-arch-brain-lint-always-read-budgets.md)):** brain:lint soll die Always-Read-Floor-Dateien (top-level `CLAUDE.md`, `brain/CLAUDE.md`, `index.md`, `project-state.md`, `open-questions.md`, …) gegen Token-/Zeilen-Budgets prüfen, damit der Session-Start-Floor nicht schleichend wächst. Details, Budgets und Warn-/Block-Semantik im 112er-Spec; wo der Spec post-171 veraltet ist, gilt der heutige Datei-Stand.
- **Slug-Kosmetik (aus 171-Impl):** `W40K-0259` / `W40K-0330` tragen eine Roster/Override-Slug-Diskrepanz, die für den Äquivalenz-Beweis verbatim erhalten wurde. Normalisieren ist erwünscht, **aber**: es divergiert den eingefrorenen Golden (ein Re-Run von `equiv:diff` wäre für diese 2 Slugs nicht mehr leer). Wenn die Normalisierung sauber geht: durchführen + die Divergenz im Report und am Golden-Kommentar dokumentieren. Wenn sie Folge-Arbeit nach sich zieht: lassen und mit `needs-decision`-Begründung zurückgeben.

## Constraints

- Rebind ändert nur die Datenquelle, nicht das Verhalten der Consumer: gleiche Projektion, gleiche Outputs für den Bestands-Korpus (Diff-Beweis oder Test).
- `refresh:audit-artifacts` und `db:drift` sind strikt read-only; `db:drift` nur mit Philipps explizitem Go (Prod-Zugriff).
- brain:lint-Guardrail: nur Lint-Tooling (`scripts/**`) — **keine** `brain/**`-Edits in diesem PR (Rollup-Ownership). Wenn Budgets aktuell schon reißen: als Warnung/Finding reporten, nicht selbst kürzen.
- Kein Schema-Change, keine DB-Writes, keine neuen Dependencies ohne Report-Begründung.
- Batches-Worktree, ein PR.

## Out of scope

- **B6 Dead-Code-Sweep** — eigener Brief 177, startet erst nach Merge dieses PRs (Konflikt in `import-faction-starters.ts` vermeiden).
- Roster/Batches/Excel-Golden-Dateien selbst — bleiben eingefroren (außer dem dokumentierten Slug-Kommentar, falls normalisiert wird).
- Podcast-Themen (Brief 175) und alles Map-bezogene (174/178).

## Acceptance

The session is done when:

- [ ] `import-faction-starters` und `book-review/projection` lesen den effektiven Per-Buch-Korpus; ein nach der Migration hinzugefügtes Buch ist für beide sichtbar (Test oder demonstrierter Check).
- [ ] Für den Bestands-Korpus sind die Outputs beider Consumer unverändert (Diff/Verify im Report).
- [ ] `refresh:audit-artifacts`-Ergebnis steht im Report; `db:drift`-Ergebnis ebenfalls, falls Philipp das Go gab.
- [ ] brain:lint prüft die Always-Read-Budgets gemäß 112er-Spec; Überschreitungen erscheinen als klare Findings; `npm run brain:lint -- --no-write` läuft auf dem Branch grün (bzw. Findings sind dokumentiert, nicht blockend, falls der Ist-Stand Budgets reißt — Abwägung im Report).
- [ ] Slug-Diskrepanz `W40K-0259`/`W40K-0330`: normalisiert + Golden-Divergenz dokumentiert, **oder** begründet zurückgestellt.
- [ ] `npm run lint` + `npm run typecheck` + bestehende Test-Suites grün.

## Open questions

- Gibt es über die zwei bekannten Consumer hinaus weitere Reader des eingefrorenen Rosters (Grep-Sweep)? Falls ja: mitrebinden oder als B6-Kandidat listen.
- Empfohlene Budget-Werte für die Always-Read-Floor (112er-Spec vs. heutiger Ist-Stand) — kurze Tabelle im Report.
