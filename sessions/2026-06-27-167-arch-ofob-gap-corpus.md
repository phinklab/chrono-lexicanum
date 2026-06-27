---
session: 2026-06-27-167
role: architect
date: 2026-06-27
status: implemented
slug: ofob-gap-corpus
parent: 2026-06-26-166
links: [2026-06-26-166, 2026-06-18-157, 2026-06-03-122]
commits: []
---

# 167 — OFOB-Lücken-Bücher in den Korpus (Teil A von A/B/C)

> **Drei-Teiler, je eigener PR, `/clear` dazwischen.** A = dieser Brief (OFOB-Bücher → Korpus, Batches). B = [168](./2026-06-27-168-arch-weekly-refresh-catchup.md) (Weekly-Refresh-Catch-up, Batches). C = [169](./2026-06-27-169-arch-faction-starters-relink.md) (faction-starters-Re-Link, Product). Reihenfolge A → B → C. Am Ende dieses Briefs: commit + PR + Folgeprompt für B.

## Goal

Die 6 in OFOB (Brief 166) ungelinkten **echten** Bücher additiv in den Korpus + die DB bringen — **ohne Full-Rewrite**. Quelle ist ein fertig recherchiertes Sheet; CC trägt es verbatim ein, ein nicht-destruktives `db:sync` landet es.

> **Kein Full-Rewrite.** `db:sync` ist seit [Brief 157](./archive/2026-06/2026-06-18-157-impl-incremental-apply-default.md) der Default-Apply: nicht-destruktiv, idempotent — **kein Truncate, kein Re-Crawl, kein Re-LLM**. Neue Bücher = reine Addition (Roster-Extension + Override-Batch + `db:sync`). `db:rebuild` wird **nicht** angefasst.

## Context

- **Daten sind fertig — CC recherchiert nichts.** Cowork hat alle 10 OFOB-Misses web-recherchiert; das autoritative Sheet liegt unter **`scripts/seed-data/source/OFOB-gap-books.xlsx`**. **Nur Tab `ADD — new books`** ist Scope dieses Briefs (6 Bücher). Tab `REPOINT` gehört zu Brief 169. CC trägt die ADD-Zeilen **verbatim** ein und erfindet keine Inhalte.
- Die 6 ADD-Bücher: `Deathworlder`, `The Rose in Darkness`, `The Rose at War` (anthology), `Lelith Hesperax: Queen of Knives`, `Our Martyred Lady` (audio_drama), `The Long and Hungry Road` (short_story — von Philipp 2026-06-27 zum ADD entschieden). Jede Zeile trägt `slug`, `title`, `authors`, `format`, `releaseYear`, `seriesHint`, `factions`/`locations`/`characters` (als `Name:role`), Synopsis-Entwurf, `sourceUrl`. Alle W40K-Domäne.
- **Mechanik (Session 136 + 157):** neue Bücher → Einträge in `scripts/seed-data/book-roster.extension.json` → `npm run import:ssot-roster` schreibt `book-roster.json` neu → Override-Batch `manual-overrides-ssot-w40k-NNN.json` kuratiert die Junctions → `db:sync`. `db:apply-scope` hat einen **Contiguity-Preflight-Guard**, der bei Lücke/Stray laut anhält.
- **Batch-Zuordnung — Restbatch erweitern, NICHT neu nummerieren (Session 136, restbatch-extension-Präzedenz).** Die Loop-/Resolver-Logik kachelt IDs strikt nach Batchnummer: Batch `N` besitzt den Slot `W40K-((N-1)*10+1)..((N-1)*10+10)` (`scripts/resolver-loop-detect.ts`, `(first-1)*10+1`). Die höchste W40K-Batch **`ssot-w40k-060`** ist eine **partielle Domain-End-Restbatch**: ihr Slot ist `W40K-0591..0600`, gefüllt sind erst `0591..0592` (2/10). Die 6 ADD-Bücher fallen damit in **denselben Slot** (`W40K-0593..0598`) und gehören **in `ssot-w40k-060`** (Erweiterung 2 → 8/10), **nicht** in eine neue `061`. Eine `061` mit `W40K-0593..0598` wäre positionslogisch falsch — diese IDs gehören Batch 060. Präzedenz: Session 136 (`restbatch-extension pattern` — „extend a partial domain-end batch rather than mis-number appended books").
- **Strang:** Batches (`chrono-lexicanum-batches`).

## Steps

1. Tab `ADD — new books` lesen. Pro Zeile einen Eintrag in `book-roster.extension.json` (`externalBookId`, `slug`, `title`, `authors`, `editors`, `editorialNote`, `releaseYear`, `format`, `seriesHint`, `sourceUrl`, `notes`). **`externalBookId` vergibt CC** — lückenlos ab High-Water-Mark `W40K-0592`, also `W40K-0593..0598`. Diese sechs IDs liegen im Slot von Batch **060** (`0591..0600`).
2. `npm run import:ssot-roster` → `book-roster.json` deterministisch neu.
3. Die bestehende Restbatch **`manual-overrides-ssot-w40k-060.json`** von 2 auf 8 Bücher **erweitern** (die 6 neuen `W40K-0593..0598` ergänzen — keine neue `061` anlegen): pro Buch `synopsis` (aus dem Sheet, license-safe), `facetIds` (kontrolliertes Vokabular), `factions`/`locations`/`characters` aus den Sheet-Tags, `flags` wo unsicher, `rating: unrated`. **Net-neue Referenz-Entitäten** (Characters wie Augusta Santorus / Wulf Khan / Lelith Hesperax / Saint Celestine / Inquisitor Greyfax; Locations wie Lazulai / Opal / Chertes) nach bestehender Resolver-/Kurations-Disziplin in die Referenz-Kataloge + Aliases aufnehmen, damit die Junctions resolven; Unauflösbares **flaggen**, nicht raten. (`The Long and Hungry Road` = hive-mind-POV, keine benannten Charaktere — `characters` leer ist ok.)
4. **Apply ist Post-Merge-Maintainer-Op, kein Implementierungsschritt.** CC baut/verifiziert nur den PR-Diff + die Dry-Run-Gates (§ Acceptance); `db:sync`/`db:drift` laufen erst **nach dem Merge** durch Philipp gegen die Prod-DB (§ Handover) — außer Philipp autorisiert es live im Chat. CC schreibt aus einem ungemergten Branch **nicht** in die Prod-DB.

## Constraints

- **Nur nicht-destruktiv:** Post-Merge ist der Apply `npm run db:sync`. Kein `db:rebuild`/Truncate/Re-Crawl/Re-LLM.
- **Contiguity:** Restbatch `ssot-w40k-060` von 2 auf 8 erweitert (`W40K-0593..0598`), lückenlos; **keine neue `061`**; `db:apply-scope`-Preflight muss grün sein.
- **CC erfindet keine Buch-Inhalte** — alles aus dem ADD-Tab; CC ergänzt nur `facetIds` + Entity-Resolution + Flags.
- Synopsis license-safe (paraphrasiert). Version-Policy: nichts pinnen außer selbst Installiertes.

## Out of scope

- Weekly-Refresh (→ Brief 168) und faction-starters-Re-Link (→ Brief 169) — **nicht** hier.
- Kein `db:rebuild`/Truncate. Kein Excel→Korpus-Importer (6 Bücher von Hand übersetzen — simplest thing first).
- OQ 18(a) `db:apply` Plan/Diff **nicht** bauen (`db:sync` reicht); 18(b)/16(b/c) unberührt.
- Entity-Blurbs für net-neue Entitäten: dem Blurb-Tool (122-B3) überlassen; CC listet net-neue Entitäten im Report.

## Acceptance

- [ ] Die 6 ADD-Bücher stehen in `book-roster.extension.json` (CC-vergebene contiguous `W40K-####`); `npm run import:ssot-roster` schreibt `book-roster.json` neu.
- [ ] `manual-overrides-ssot-w40k-060.json` von 2 auf 8 Bücher erweitert (die 6 neuen `W40K-0593..0598`), alle 6 mit `facetIds` + resolveden Junctions; net-neue Referenz-Rows ergänzt, Unresolved geflaggt. **Keine `061`.**
- [ ] `npm run db:apply-scope` zeigt lückenlosen Scope inkl. der erweiterten 060; `npm run test:roster-extension` + `npm run test:apply-override-dry` grün.
- [ ] `npm run lint` + `npm run typecheck` grün.
- [ ] (Maintainer-Ops nach Merge) `npm run db:sync` landet die 6 Bücher nicht-destruktiv; `npm run db:drift` read-only sauber.

## Handover (commit + Folgeprompt)

> **Transfer:** Dieser Brief + das Quell-Excel wurden im **Koordinations-Worktree** (`C:\Users\Phil\chrono-lexicanum`) erstellt und liegen dort uncommitted. Kopiere `sessions/2026-06-27-167-arch-ofob-gap-corpus.md` und `scripts/seed-data/source/OFOB-gap-books.xlsx` an dieselben relativen Pfade in **diesen Batches-Worktree** und committe sie im PR mit.

1. Auf frischem Batches-Task-Branch (`codex/ingest-batches-ofob-gap-corpus`) alle Task-Dateien committen (Brief + Excel + `book-roster.extension.json` + `book-roster.json` + erweiterte `manual-overrides-ssot-w40k-060.json` + ggf. neue Referenz-Katalog-Edits), PR öffnen, in diesem Brief `status: open → implemented` flippen. PR nicht selbst mergen.
2. **Philipp den Folgeprompt geben** (verbatim), damit er nach `/clear` Teil B startet:

   > „Teil B / Brief 168 — Weekly-Refresh-Catch-up (im **Batches-Worktree** ausführen). Lies, kopiere aus dem Koordinations-Worktree und implementiere `C:\Users\Phil\chrono-lexicanum\sessions\2026-06-27-168-arch-weekly-refresh-catchup.md`. Voraussetzung: Brief 167 ist gemergt."

3. Ops-Hinweis an Philipp: nach Merge `npm run db:sync` (oder gesammelt einmal nach Brief 168 — `db:sync` ist idempotent und re-appliziert ohnehin den vollen Roster). PowerShell zeilenweise, kein `&&`.

## Notes

- Sheet-Tab `README` erklärt Spalten + Farb-Legende. Quellen je Zeile (Lexicanum/Black Library), recherchiert 2026-06-27.
- `db:sync`-Kette (157): Preflight → Korpus-Re-Apply → `apply:podcast --all` → Audiobook(+verify) → Timeline(+verify) → Curation(+verify). Idempotent, truncatet nie.
