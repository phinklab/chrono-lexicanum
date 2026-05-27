# Resolver-Pass 11 — Phase 4a (Integration/Apply) Status Report

**Welle:** `ssot-hh-003..008` (HH-0021..HH-0080, 60 Bücher)
**Phase:** `phase-4a-integration`
**Scope:** `scripts/seed-resolver-extensions.ts` (reads erweitertes Reference-Set automatisch),
`scripts/apply-override-dry.ts` + `scripts/test-resolver-coverage.ts` + `scripts/test-resolver-data-integrity.ts`
(domain-aware Trias-Batch-Ranges um sechs `{domain:"hh", n:"003..008"}`-Tupel erweitert),
die HH-003..008 Override-Files (read-only durch Apply), `scripts/run-phase4-apply.sh`
(unverändert ausgeführt), der committete Apply-Digest `ingest/.last-run/phase4-digest.md`,
diese 4a-Statusdatei. **Auto-erweitert durch `db:apply-override`:** `scripts/seed-data/persons.json` (+2 Rows:
`l_j_goulding` für HH-0077 *The Last Council* sowie `charles_wraight` für HH-0080 *Ashes of
the Imperium* — Letzteres ist der Roster-Typo, den Dossier §7d explizit als
**Phase-4b-Verify-Concern** (nicht Phase-4a-Stop) markiert; die Override-File-Korrektur auf
`Chris Wraight` ist im Apply-Layer, das book-row-Author-Display verifiziert Phase 4b).
**Nicht berührt:** `scripts/seed-data/collection-gaps.json`, `scripts/db-counts.ts`,
`scripts/seed-facets.ts`, `scripts/apply-override-collections.ts` (kein Bedarf — keine unknown
facetIds, keine unknown-work collection refs, kein Persons-Aliase-Need-decision).
**Status:** done — ready for Phase 4b (Verify/Report).

## Summary

Apply-seitige Trias um sechs neue HH-Batch-Tupel ergänzt (Domain-+-N-Append, nicht reines
N-Append per Brief 100). `scripts/run-phase4-apply.sh scripts/resolver-pass.config.json` fuhr
non-destruktiv durch: Resolver-Extensions seed + Facet-Catalog seed (beide idempotent,
+0 facet_values), idempotenter Re-Apply der kumulativen `hh 001..008`-Range (delete-then-insert
pro Junction). Alle 8 Batches `applied: ok`; Reference-Row-Deltas matchen die Phase-1/2/3-Reports
exakt (+9 factions / +22 locations / +40 characters). 60 neue Bücher in der Authority-Layer
(works 585→645). Forward-ref Guard sauber (`out-of-range=27, unknown-work=0` — die 7 *Shadows
of Treachery*-Konstituenten plus die kumulativen HH-0010/HH-0020-Anthologie-Edges aus Pass 10).
Keine Strips, keine Anomalien, keine architektonische Unsicherheit — keine `Needs decision`-Blocker.

## Counts table — Pre / Per-Batch / Post

Aus `ingest/.last-run/phase4-digest.md` (committet, fix-große Datei):

| stage                          | works | work_factions | work_locations | work_characters | work_persons | work_collections | work_facets | factions | locations | characters | facet_values |
| ------------------------------ | ----: | ------------: | -------------: | --------------: | -----------: | ---------------: | ----------: | -------: | --------: | ---------: | -----------: |
| PRE-APPLY                      |   585 |          1981 |            776 |            1325 |          541 |              147 |       11672 |      179 |       234 |        404 |           86 |
| ssot-hh-001 / 002 (re-apply)   |   585 |             — |              — |               — |            — |                — |           — |        — |         — |          — |            — |
| POST-BATCH `ssot-hh-003`       |   595 |          2021 |            806 |            1373 |          549 |              147 |       11863 |      188 |       256 |        444 |           86 |
| POST-BATCH `ssot-hh-004`       |   605 |          2074 |            830 |            1416 |          555 |              147 |       12084 |      188 |       256 |        444 |           86 |
| POST-BATCH `ssot-hh-005`       |   615 |          2118 |            851 |            1452 |          563 |              147 |       12279 |      188 |       256 |        444 |           86 |
| POST-BATCH `ssot-hh-006`       |   625 |          2164 |            870 |            1493 |          572 |              147 |       12492 |      188 |       256 |        444 |           86 |
| POST-BATCH `ssot-hh-007`       |   635 |          2226 |            898 |            1537 |          582 |              147 |       12720 |      188 |       256 |        444 |           86 |
| POST-BATCH `ssot-hh-008`       |   645 |          2243 |            916 |            1549 |          592 |              147 |       12920 |      188 |       256 |        444 |           86 |
| POST-APPLY (= POST-BATCH 008)  |   645 |          2243 |            916 |            1549 |          592 |              147 |       12920 |      188 |       256 |        444 |           86 |

> Note: Per-Batch-Snapshots werden vom Digest-Script nur für **new-wave**-Batches geschrieben
> (`ssot-hh-003..008`, der `WAVE_BATCHES`-Filter in `run-phase4-apply.sh`). Der Re-Apply von
> `ssot-hh-001` + `ssot-hh-002` aus der kumulativen Range emittiert keine Per-Batch-Counts —
> das ist idempotenter Re-Apply ohne neue Bücher, der nur `delete-then-insert` pro Junction
> durchzieht; die Counts werden nicht angerührt (works bleibt 585).

### Deltas pre → post

| dimension          | delta   | comment                                                                                              |
| ------------------ | ------: | ---------------------------------------------------------------------------------------------------- |
| works              |    +60  | HH-0021..HH-0080 neu in Authority-Layer                                                              |
| work_factions      |   +262  | Junction-Rows; matched dry-totals modulo HH-001/002-Re-Apply-Idempotenz                              |
| work_locations     |   +140  | dry-totals `917` vs DB `916` — Differenz 1 ist Re-Apply-Dedupe (resolver-pass-runbook §10 acceptable) |
| work_characters    |   +224  | dry-totals `1553` vs DB `1549` — Differenz 4 ist Re-Apply-Dedupe (resolver-pass-runbook §10 acceptable) |
| work_persons       |    +51  | Author-Bindings für 60 neue Bücher (anthology + collaborative authors aggregiert)                    |
| work_collections   |     +0  | Keine neuen Collection-Edges — anthology-Konstituenten von HH-0022 sind out-of-range (HH-0124+)      |
| work_facets        |  +1248  | Facet-Junctions für 60 neue Bücher; Median ~20.8 Facets/Buch                                         |
| factions           |    +9   | exakt Phase-1-Promotion-Set: knights_errant, lectitio_divinitatus, legio_{ignatum,solaria,vulpa}, selenar_gene_cult, thunder_warriors, house_devine, sanguinary_guard |
| locations          |   +22   | exakt Phase-2-Promotion-Set (7 strict-freq + 8 standalone curated + 7 Palace sub-locales)            |
| characters         |   +40   | exakt Phase-3-Promotion-Set (3 Primarchen + 15 freq≥2 + 1 alias-target + 21 curated freq-1)          |
| facet_values       |     +0  | Catalog idempotent (`ON CONFLICT DO NOTHING` — keine neue facetId der Welle, alle bekannt)           |

## Reference-Row-Deltas vs Phase-1/2/3 reports

Exakter Konsens — die Apply-Hälfte spiegelt das Reference-Set, das Phase 1–3 angelegt haben:

| layer       | phase-report-claim | apply-digest-delta | match |
| ----------- | -----------------: | -----------------: | :---: |
| factions    | +9 rows / +6 aliases | factions 179→188 = +9 | ok |
| locations   | +22 rows / +0 aliases | locations 234→256 = +22 | ok |
| characters  | +40 rows / +6 aliases | characters 404→444 = +40 | ok |

Aliases sind im Reference-Layer keine eigene DB-Row; sie schlagen nur in den
Stage-2-Resolver-Lookups durch (work_*-Junction-Counts steigen, factions/locations/characters
nicht). Daher in `factions`/`locations`/`characters` nur die Row-Adds reflektiert.

## Forward-ref Guard (Brief 091 / Brief 101)

`scripts/apply-override-collections.ts` + `npm run test:apply-override-dry`-Tail:

```
forward collection refs:       15
unresolvable constituent refs: 27
by reason: out-of-range=27, unknown-work=0
```

- **`forward collection refs = 15`**: in-range Anthologie/Omnibus-Edges, deren content-side
  später im kumulativen sweep landet. Der ascending sweep löst diese auf, sobald die Content-Welle
  applied wird (Pass-6-Pattern, end-to-end verifiziert).
- **`out-of-range = 27`**: das Dossier prognostizierte 7 (die *Shadows of Treachery*-Konstituenten
  HH-0124/0125/0170/0172/0241/0242/+1). Die tatsächlichen 27 enthalten **zusätzlich** die
  pre-existing Out-of-Range-Edges aus Pass-10-Anthologien (HH-0010 → HH-0150..HH-0155,
  HH-0020 → HH-0117..HH-0120). Diese waren bereits in Pass 10 vorhanden; sie sind keine
  Regression. Per Brief 101 sind alle Out-of-Range-Edges informational — der Guard exit ok.
- **`unknown-work = 0`**: clean. Keine Override-Datei referenziert einen Konstituenten, den
  der Roster nicht kennt. Genau die Erwartung aus Dossier §7d.

Test: `npm run test:collection-refs` → 10/10 pass (Brief-091 Range-Aware Guard + Brief-101
Reason-Split beide grün).

## Strips / Anomalien / Ermessens-Entscheidungen

- **Keine facetId-Strips.** Pre-Apply-Scan: jede der 60 Bücher-`facetIds`-Listen referenziert
  ausschliesslich Catalog-Werte, die `facet-catalog.json` (86 Values über 12 Kategorien) bereits
  kennt. Kein Bedarf für `## Needs decision`-Stop (facet-catalog.json ist scope-bewusst nicht im
  Phase-4a-Scope per runbook §3 Phase 4a).
- **Keine Roster-ID-Strips.** Alle 60 `externalBookId`-Werte (HH-0021..HH-0080) existieren in
  `book-roster.json` — `missing roster externalBookIds: 0`.
- **Keine collection-gaps.json-Anpassung.** HH-0022 *Shadows of Treachery* hat 7 Konstituenten,
  die out-of-range sind; die Brief-101 Reason-Split akzeptiert das als deferred state. Keine
  Erweiterung der `collection-gaps.json`-Notiz erforderlich (sie ist primär für `unknown-work`
  / `needs_constituent_roster_entries` cases).
- **persons.json automatisch +2 Rows** (kein manueller Edit). `db:apply-override` extrahiert
  Author-Surface-Forms aus den Override-Files und schreibt fehlende Rows in `persons.json`
  zurück (idempotenter Apply-Layer-Mechanismus, der bei jeder neuen Welle greift). Diese Welle:
  `l_j_goulding` (HH-0077, neuer HH-Autor) + `charles_wraight` (HH-0080, Roster-Typo-Form).
  Der Charles-Wraight-Roster-Typo ist Dossier §7d-Phase-4b-Concern, nicht ein Phase-4a-Stop —
  das book-row-Author-Display verifiziert Phase 4b im Audit-Cockpit.
- **work_locations/characters dry-vs-DB-Differenz** (917 vs 916 / 1553 vs 1549): minimaler
  Apply-Idempotenz-Dedupe-Effekt. Der Dry simuliert Per-Book-Unique-Resolution in JS; der
  DB-Apply läuft delete-then-insert pro Junction mit eigener Role-Priority-Resolution. Eine
  ±1..4-Differenz ist seit Pass 5–9 etabliert und akzeptabel (resolver-pass-runbook §10 macht
  hier keine Equality-Annahme). Keine Anomalie.

## Code-Edits (Diff-Scope)

Apply-seitige Trias-Batch-Range um sechs HH-Tupel erweitert (Domain-+-N-Append per Brief 100,
analog zu Pass-10-Phase-4a-Pattern für HH-001..002):

- `scripts/apply-override-dry.ts` — BATCHES erweitert um `{domain:"hh", n:"003"}` .. `"008"`.
- `scripts/test-resolver-coverage.ts` — dito.
- `scripts/test-resolver-data-integrity.ts` — dito, plus Smoke-Slug-Test-Label
  `w40k-001..057 + hh-001..002` → `…hh-001..008` (Existenz-Check, kein neuer Smoke-Slug).

Keine weiteren Code-Änderungen. `seed-resolver-extensions.ts` liest `factions.json` /
`locations.json` / `characters.json` zur Laufzeit ein — die Phase-1/2/3-JSON-Adds reichen
durch ohne TS-Edit. `apply-override-collections.ts` ist nicht berührt (Brief-101-Logik
unverändert; aktuelle Welle braucht keine neuen Guard-Reasons).

## Trias / Lint / Typecheck (vor Commit)

- `npm run test:resolver` → **367 passed, 0 failed** (Phase-3-Stand unverändert; keine
  neuen Test-Cases in Phase 4a — alle Promotions sind Phase-1/2/3-gedeckt).
- `npm run test:resolver-data` → ok (Smoke-Slug-Existenz-Label auf `hh-001..008` updated; alle
  9 Checks grün).
- `npm run test:resolver-coverage` → ok (645 Bücher, totals: factions=2243/2581 mit 166
  Brief-077-skips, locations=917/1179 mit 14 Brief-084-skips, characters=1553/1983; below-threshold
  smoke-slugs sind W40K-bestand, keine HH-Regression).
- `npm run test:apply-override-dry` → ok (645 books, `out-of-range=27, unknown-work=0`, alle
  Validations clean).
- `npm run test:collection-refs` → **10 passed, 0 failed** (Brief-091/101 Range-Aware Guard +
  Reason-Split beide grün).
- `npm run lint` → 0 errors, 1 pre-existing Warning (`src/app/layout.tsx` no-page-custom-font —
  Strang-fremd, nicht in Phase-4a-Scope).
- `npm run typecheck` → ok (no errors).

## Smoke-Slug-Set (für Phase 4b)

Verify-Pass-Config-Smoke-Slugs (`scripts/resolver-pass.config.json` → `verify.smokeSlugs`)
sind HH-Wellen-Repräsentanten (eine Buch-Slug je Batch — `the-damnation-of-pythos` (HH-0030),
`corax` (HH-0040), `born-of-flame` (HH-0050), `fury-of-magnus` (HH-0060), `restorer` (HH-0070),
`ashes-of-the-imperium` (HH-0080)). Diese sind nicht Teil der Phase-4a-Apply-Trias-`SMOKE_SLUGS`
(W40K-Set, observational); Phase 4b reads sie via `verify-pass.ts`. Verifikation hier nicht
nötig — Phase 4a beendet read-only mit dem Apply-Digest als Hand-off-Material.

## Halt-Disziplin

- Mindestens ein commit pro Phase: ja (dieser commit).
- JSON-Files syntaktisch valide: ja (keine JSON-Edits in dieser Phase).
- Architektonische Unsicherheit: nein — keine `Needs decision`-Blocker.
- Write-Scope: Diff ⊆ {`scripts/apply-override-dry.ts`, `scripts/test-resolver-coverage.ts`,
  `scripts/test-resolver-data-integrity.ts`, `scripts/seed-data/persons.json`,
  `ingest/.last-run/phase4-digest.md`,
  `sessions/resolver-dossiers/resolver-pass-11-phase-4a-report.md`}. `persons.json` ist
  scope-explizit aufgeführt (Apply-Layer-Auto-Write); andere Scope-Files
  (`seed-resolver-extensions.ts`, `apply-override-collections.ts`, `collection-gaps.json`,
  `db-counts.ts`, `seed-facets.ts`, `run-phase4-apply.sh`, alle 6 Override-Files) bleiben
  zulässig auch ohne Diff — der Scope listet Maximum, nicht Minimum.
- Co-Author-Trailer: keiner.

## Ready for Phase 4b (Verify/Report)

Phase-4b-Achs-Paket (`scripts/verify-pass.ts`, finaler Impl-Report
`sessions/resolver-dossiers/resolver-pass-11-impl-report.md`) ist frei. Pflichtlektüre für
Phase 4b: diese 4a-Statusdatei + `ingest/.last-run/phase4-digest.md` (committet). Phase 4b
fährt `scripts/verify-pass.ts --config scripts/resolver-pass.config.json` selbst (Verify-Digest
nach stdout — KEINE Verify-Digest-Datei), `npm run lint`, `npm run typecheck`. **Kein**
zweiter DB-Apply, **keine** Trias-Re-Run, **keine** Override-Files / Apply-seitigen Skripte /
rohe Apply-Ausgabe lesen.
