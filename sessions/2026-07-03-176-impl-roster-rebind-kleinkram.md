---
session: 2026-07-03-176
role: implementer
date: 2026-07-03
status: complete
slug: roster-rebind-kleinkram
parent: 2026-07-02-176
links: [2026-06-30-171, 2026-06-14-151, 2026-06-01-112]
commits: []
---

# 176 — Roster-Rebind + Verify-Kleinkram + brain:lint-Budget-Guardrail (Impl)

## Summary

Alle drei Posten geliefert, plus die Slug-Normalisierung. (1) `import-faction-starters` und der `book-review/projection`-Pfad lesen jetzt den **effektiven Per-Buch-Korpus** (`scripts/seed-data/books/*.json`); für den Bestands-Korpus sind die Outputs **bewiesen unverändert** (Import-Re-Run: nur das `_doc`-Feld diffst; Review-Projektion: 896/896 Bücher, 0 Deltas per Test). Ein Post-Migrations-Buch ist für beide sichtbar (fail→pass-Demo + permanenter Test). (2) `refresh:audit-artifacts` lief read-only **clean** (4/4 Shows in sync); `db:drift` übersprungen — kein Philipp-Go in dieser Session. (3) brain:lint prüft die **Always-Read-Budgets** (Soft→warning, Hard→error) gemäß 112er-Spec; `brain:lint -- --no-write` ist grün (0 blocking; `sessions/README.md` reißt erwartungsgemäß das Soft-Budget → dokumentiertes Warning). **Bonus:** die Slug-Diskrepanz `W40K-0259`/`W40K-0330` ist normalisiert — und der eingefrorene Golden divergiert dabei **nicht** (`equiv:diff` bleibt leer, empirisch verifiziert; Begründung unten).

## What I did

### 1a. Rebind `import-faction-starters.ts`
- `buildCorpus()` liest `loadEffectiveCorpusBooks()` (aus `scripts/refresh/effective-corpus.ts`, dir-injectable, fail-soft) statt `book-roster.json`. Konstante `ROSTER_FILE` → `CORPUS_NAME` (Fehlermeldungs-Anzeige), Header/`_doc`-Text angepasst.
- **Diff-Beweis Bestands-Korpus:** Baseline-Lauf vor dem Umbau war byte-identisch zum committeten Stand. Nach dem Umbau: identische Stats (70 Picks | 36 exact | 5 fuzzy | 29 override | 0 unlinked), `faction-starters.review.md` byte-identisch, `faction-starters.json` diffst **nur im `_doc`-Feld** (Selbstbeschreibung der Resolutionsquelle — bewusst aktualisiert, kein Pick/Slug-Delta).
- **Sichtbarkeits-Demo (transient, nicht committet):** Override auf unbekannten Slug ohne Korpus-Datei → lauter Abbruch (`is not a known book slug in scripts/seed-data/books/*.json`); mit temporärem `books/zzz-brief-176-demo.json` (W40K-9999) → Validierung grün, Pick verlinkt. Danach zurückgesetzt, Outputs regeneriert.
- Nebeneffekt: Korpus-Slugs sind jetzt die **kanonischen `works.slug`-Werte** (Override-Slugs) — ein Titel, der auf W40K-0259/0330 aufgelöst hätte, hätte mit dem Roster-Slug vorher einen 404-`/buch/`-Link erzeugt. Latenter Bug, durch den Rebind geschlossen (aktuell referenziert kein Pick diese Bücher).

### 1b. Rebind `book-review/projection`-Pfad
- `projection.ts`: neuer Loader **`loadCorpusBooks(dir?)`** — jede `books/*.json` als projektierbares Buch (`{externalBookId, slug, overrides: curation}`; `curation` ist das identische `OverrideCuration`-Shape der Batch-Overrides). `loadProjectionContext(booksDir?)` speist den Titel-Lookup (`rosterByBook` → **`corpusByBook`**, nur in projection.ts konsumiert) aus demselben Korpus statt aus dem Roster.
- `book-review.ts` `prepare`: **Full-Sweep enumeriert den Per-Buch-Korpus** (sorted-filename = Slug-Reihenfolge, deterministisch); **Pilot + Parity bleiben bewusst auf den eingefrorenen `PILOT_BATCHES`** (Kalibrier-Golden, Brief 154). Manifest-`generatedFor` für full: `"N books (effective per-book corpus)"`.
- `enrichment.ts` `buildWorklist`: Synopsis/Titel-Kontext der Sentinels aus `loadCorpusBooks()` statt Batch-Sweep.
- `discoverAllBatches` bleibt als LEGACY-Provenance-Tooling (Docstring markiert, **B6-Kandidat**).
- **Diff-Beweis + Sichtbarkeit als permanenter Test** (`test-book-review.ts` Sektion 7, läuft in `test:book-review`): (a) Per-Buch-Korpus deckt alle 896 Frozen-Batch-Bücher; (b) `projectBook(batch) == projectBook(per-book)` für **alle 896** (JSON-deep-equal): **0 Deltas**; (c) synthetisches `book-v1`-File in injiziertem Dir wird enumeriert, titel-aufgelöst und kuratierungs-projiziert (`ordo_malleus`-Edge resolved wie ein Batch-Override).

### 2. Verify-Posten (Brief 151/171)
- `npm run refresh:audit-artifacts` (Header verifiziert: SELECT-only, kein Write): **✅ clean** — `the-40k-lorecast` 154/154, `adeptus-ridiculous` 367/367, `lorehammer` 391/391, `luetin09` 192/192 guids artifact↔DB in sync; 0 Shows mit gefährlichem Drift (DB vor Artifact). Exit 0.
- `npm run db:drift`: **übersprungen** — Brief verlangt Philipps explizites Go (Prod-Zugriff); in dieser Session nicht vorhanden. Bleibt als optionaler Ein-Kommando-Nachtrag offen.

### 3. brain:lint Always-Read-Budget-Guardrail (B7, Spec 112)
- **`scripts/brain-lint-budgets.ts`** (NEU, pure — kein fs/process): Budget-Tabelle als Konstanten (Spiegel von `brain/CLAUDE.md` § "Always-read budgets", per 112-Empfehlung kein Markdown-Parsing), `checkAlwaysReadBudgets(readContent)` mit injizierbarem Reader, `countOpenItems`. Char-basiert (Token ≈ chars/4). Soft → warning, Hard → error; fehlende Always-Read-Datei → error. Open-Items-Zähler: Zeilen `**(N)` (heutiges Format) **oder** `## (N)` (112er-Form), `~~`-durchgestrichen = geschlossen; > 5 offene → warning. Separates Modul, weil `brain-lint.ts` `main()` beim Import ausführt (Testbarkeit).
- **`scripts/brain-lint.ts`**: neue Kategorie **"Always-read budget"** (nach "Brain size budget"), Reader an `repoRoot` gebunden, Finding-Format wie bestehende Checks (File · gemessen · Budget · Severity). Header-Kommentar um die mixed-Severity-Kategorie ergänzt.
- **`scripts/test-brain-lint-budgets.ts`** (NEU, `npm run test:brain-lint-budgets`): 12 Checks — unter Soft / über Soft (warning + Messwert in Message) / über Hard (error) / fehlende Datei (error) / Open-Items-Formate + Grenzwert 5/6 / **Ist-Repo trägt keine Hard-Verletzung**.

### 4. Slug-Normalisierung `W40K-0259` / `W40K-0330` (durchgeführt)
- `book-roster.json`: `the-rose-in-anger` → **`the-rose-in-the-anger`**, `the-hunt-for-magnus` → **`the-hunt-of-magnus`** — die Override-Slugs, die tatsächlich in `works.slug` / den `/buch/`-URLs / `books/*.json` leben.
- **Der Golden divergiert NICHT:** Das Roster-`slug`-Feld speist in der Äquivalenz-Projektion nichts — `computeBookRows` schreibt `override.slug` (`book-apply-shared.ts:701`; Roster-Slug nur in einer Warn-Log-Zeile). Coworks Sorge im Brief ("Re-Run von `equiv:diff` wäre für diese 2 Slugs nicht mehr leer") trifft nicht zu: `equiv:diff` **vor und nach** der Edit ausgeführt — beide Male **EMPTY DIFF** (896 Bücher, 0 Row-Deltas, 196/196 Collections). Auch Refresh-Identität matcht über `slugify(title)`, nie über das Roster-`slug`-Feld.
- Dokumentiert als Golden-Kommentar in `scripts/seed-data/README.md` (einziger Post-Freeze-Edit; Caveat: ein Provenance-Re-Run von `import:ssot-roster` mit `ALLOW_RETIRED_SSOT_IMPORT=1` würde die zwei Felder aus der eingefrorenen Excel zurückdrehen).

## Consumer-Sweep (Open Question 1)

Über die zwei rebounden Consumer hinaus **keine weiteren Live-Reader** des eingefrorenen Rosters. Verbleibende Treffer, klassifiziert:

| Reader | Einordnung |
|---|---|
| `scripts/refresh-check.ts` | **LIVE, by design** — Brief-170-Chokepoint: mergt Legacy-Roster + `books/` als Superset für Identity-Index + Id-Allocator (Dupes harmlos). Kein Rebind nötig; post-171 wäre `books/`-only möglich (B6/171-Folge, kosmetisch). |
| `equivalence-diff.ts`, `legacy-corpus-projection.ts`, `migrate-corpus-to-books.ts` | **Golden-Tooling by design** — lesen den Roster, WEIL er die eingefrorene Legacy-Welt ist. |
| `import-ssot-roster.ts`, `loop-next-batch.ts`, `apply-override.ts`, `db-apply-scope.ts` | **RETIRED** (171) — CLIs refusen. |
| `aggregate-surface-forms.ts`, `resolver-loop-detect.ts`, `apply-override-dry.ts`, `roster-extension.ts`, v2 `ssot/load-roster.ts`+`adapt.ts` | **LEGACY-FROZEN** (171-Inventar) — read-only über die eingefrorene Batch-Welt. |
| `book-review/projection.ts` `discoverAllBatches`/`loadBatchBooks` | Batch-Loader bleiben für **Pilot/Parity/Tests** (Kalibrier-Golden); `discoverAllBatches` ist ab jetzt orphaned → **B6-Kandidat**. |
| Übrige Treffer | Kommentare/Doku/Sessions — keine Reads. |

## Budget-Werte: 112er-Spec vs. Ist-Stand (Open Question 2)

Spec-Werte unverändert übernommen (sie sind heute noch sinnvoll dimensioniert):

| File | Soft / warn | Hard / error | Ist 2026-07-03 | Status |
|---|---|---|---|---|
| `brain/wiki/project-state.md` | 25.000 | 45.000 | 21.316 (≈5.3k tok) | unter Soft |
| `brain/wiki/open-questions.md` | 16.000 · >5 offene Items | 28.000 | 4.565 · **1 offenes Item** (16b/c) | unter Soft |
| `sessions/README.md` | 14.000 | 24.000 | **19.005** (≈4.8k tok) | **über Soft → warning** |
| `brain/wiki/index.md` | 24.000 | 36.000 | 16.928 | unter Soft |

`sessions/README.md` reißt Soft mit ~36 % Überhang, hat aber reichlich Luft bis Hard — per Brief-Constraint **nicht selbst gekürzt** (Rollup-Ownership), als Warning reportet. → Prune-Kandidat für Coworks nächsten Koordinations-Pass.

## Decisions I made

- **Full-Sweep-Reihenfolge ändert sich** von (sorted-batch, file-order) zu (sorted-filename = Slug). Rein operativ (Chunk-Zusammensetzung eines KÜNFTIGEN full-`prepare`); die Projektion pro Buch ist deltalos. Bestehende `.work`-Manifeste resumen unverändert.
- **Pilot/Parity nicht rebound** — `PILOT_BATCHES` ist der eingefrorene Kalibrier-Slice (Brief 154) und `review:books:parity` testet Projektion↔DB genau darüber; die Batch-Loader bleiben dafür stehen.
- **`_doc`-Feld im committeten `faction-starters.json` aktualisiert** statt byte-identisch zu bleiben: eine stale Selbstbeschreibung ("resolved against book-roster.json") wäre schlechter als ein dokumentiertes Ein-Feld-Diff.
- **Budget-Check als eigenes pures Modul** (`brain-lint-budgets.ts`): `brain-lint.ts` führt `main()` beim Import aus; Extraktion statt `isMain()`-Umbau hält das CI-Skript-Verhalten unangetastet und macht den Check fixture-testbar.
- **Slug-Normalisierung Richtung Override-Slug** (nicht umgekehrt): die Override-Slugs sind kanonisch (DB/`books/`/URLs). Die Gegenrichtung (Typo-Korrektur in `works.slug`) wäre ein URL-Rename mit DB-Write + Frozen-Batch-Edit → Folge-Arbeit, out of scope. Falls gewünscht: eigener Brief.
- **Keine neuen Dependencies.**

## Verification

- `npm run typecheck` — pass; `npm run lint` — pass
- `npm run brain:lint -- --no-write` — **grün**: 0 blocking, 15 Warnings (14 pre-existing + 1 neu: `sessions/README.md` über Soft-Budget — erwartet, dokumentiert oben)
- `npm run test:brain-lint-budgets` — 12/0 (NEU)
- `npm run test:book-review` — 54/0 (inkl. neuer Rebind-Sektion: 896/896 Coverage, **0 Projektions-Deltas**, Post-Migrations-Sichtbarkeit)
- `npm run equiv:diff` — **EMPTY DIFF vor UND nach der Slug-Normalisierung** (896 Bücher, 0 Row-Deltas, 196/196 Collections)
- `npm run test:migration-equivalence` — 11/0; `npm run book:preflight` — OK (896 Files, max W40K-0599/HH-0297)
- `npm run import:faction-starters` — Stats identisch zur Baseline; Diff nur `_doc`
- `npm run refresh:audit-artifacts` — ✅ clean (4/4 Shows in sync, exit 0)
- Suiten: `test:book-file` 34/0, `test:apply-book` 24/0, `test:book-detection-guard` 7/0, `test:refresh` 66/0, `test:book-enrich` 50/0, `test:roster-extension` 20/0, `test:apply-override-dry` ok, `test:synopsis-lint` 14/0, `test:collection-refs` 10/0, `test:loop-next` 9/0, `test:resolver-loop-detect` 36/0
- **Keine DB-Writes** (audit ist SELECT-only), kein Schema-Change, keine `brain/**`-Edits.

## Open issues / blockers

- Keine Blocker. `db:drift` (read-only Post-171-Bestätigung gegen Prod) wartet auf Philipps Go — ein Kommando, jederzeit nachholbar.
- Doku-Nachtrag für Cowork (Koordinations-Pass, hier tabu wegen Rollup-Ownership): `brain/wiki/workflows/lint.md` um die Kategorie "Always-read budget" ergänzen; `sessions/README.md` unter das 14k-Soft-Budget prunen.

## For next session

- **B6 Dead-Code-Sweep (Brief 177)** — startet nach Merge dieses PRs. Kandidaten aus dieser Session: `discoverAllBatches` (projection.ts, orphaned), ggf. `refresh-check.ts`-Merge auf `books/`-only vereinfachen; Rest siehe 171-Inventar.
- Optional: `db:drift` auf Philipps Go.
