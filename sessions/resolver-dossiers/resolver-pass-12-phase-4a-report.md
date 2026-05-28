# Resolver-Pass 12 — Phase 4a (Integration/Apply) Status Report

**Welle:** `ssot-hh-009..014` (HH-0081..HH-0140, 60 Bücher)
**Phase:** `phase-4a-integration`
**Scope:** `scripts/seed-resolver-extensions.ts` (liest das erweiterte Reference-Set automatisch
aus den Phase-1/2/3-JSONs — kein Code-Edit nötig), `scripts/apply-override-dry.ts` +
`scripts/test-resolver-coverage.ts` + `scripts/test-resolver-data-integrity.ts` (domain-aware
Trias-Batch-Ranges um sechs `{domain:"hh", n:"009..014"}`-Tupel erweitert; in
`test-resolver-data-integrity.ts` zusätzlich die hardcodierte Label-Range im
`coverage smoke slugs`-Check von `hh-001..008` auf `hh-001..014` aktualisiert, parity zur
Pass-11-Phase-4a-Anpassung von `hh-001..002`→`hh-001..008`), die HH-009..014 Override-Files
(read-only durch Apply), `scripts/run-phase4-apply.sh` (unverändert ausgeführt), der committete
Apply-Digest `ingest/.last-run/phase4-digest.md`, diese 4a-Statusdatei.
**Auto-erweitert durch `db:apply-override`:** `scripts/seed-data/persons.json` (+2 Rows:
`brandon_easton` für HH-0109 *Ember of Extinction*, `alan_merrett` für HH-0140 *Visions of
Heresy* — beides bekannte BL-Autoren, die Welle ist deren Erstauftritt in der Authority-Layer).
**Nicht berührt:** `scripts/seed-data/collection-gaps.json`, `scripts/apply-override-collections.ts`,
`scripts/db-counts.ts`, `scripts/seed-facets.ts` (kein Bedarf — keine unknown facetIds, keine
unknown-work collection refs, keine neuen Facet-Catalog-Werte).
**Status:** done — ready for Phase 4b (Verify/Report).

## Summary

Apply-seitige Trias um sechs neue HH-Batch-Tupel ergänzt (Domain-+-N-Append, nicht reines
N-Append per Brief 100). `scripts/run-phase4-apply.sh scripts/resolver-pass.config.json` fuhr
non-destruktiv durch: Resolver-Extensions seed + Facet-Catalog seed (beide idempotent,
+0 facet_values), idempotenter Re-Apply der kumulativen `hh 001..014`-Range (delete-then-insert
pro Junction für 001..008, first-time für 009..014). Alle 14 Batches `applied: ok`;
Reference-Row-Deltas matchen die Phase-1/2/3-Reports exakt (+2 factions / +11 locations
/ +13 characters). 60 neue Bücher in der Authority-Layer (works 645→705). Forward-ref Guard
sauber im einzig gating-relevanten Reason: `unknown-work=0`. Die 21 verbleibenden
`out-of-range`-Refs sind erwartete deferred edges (anthology-Konstituenten in HH-0141+ Wellen,
W40K-Omnibus-Konstituenten in W40K-Folge-Wellen — alle bekannte Roster-Books, nicht typo).
Apple-seitige Trias grün (test:resolver 392, test:resolver-data 10 checks, test:resolver-
coverage informational-OK, test:apply-override-dry ok, test:collection-refs 10/0, lint clean,
typecheck clean). Keine Strips, keine Anomalien, keine architektonische Unsicherheit, keine
`Needs decision`-Blocker.

## Counts table — Pre / Per-Batch / Post

Aus `ingest/.last-run/phase4-digest.md` (committet, fix-große Datei):

| stage                          | works | work_factions | work_locations | work_characters | work_persons | work_collections | work_facets | factions | locations | characters | facet_values |
| ------------------------------ | ----: | ------------: | -------------: | --------------: | -----------: | ---------------: | ----------: | -------: | --------: | ---------: | -----------: |
| PRE-APPLY                      |   645 |          2243 |            916 |            1549 |          592 |              147 |       12920 |      188 |       256 |        444 |           86 |
| ssot-hh-001..008 (re-apply)    |   645 |             — |              — |               — |            — |                — |           — |        — |         — |          — |            — |
| POST-BATCH `ssot-hh-009`       |   655 |          2267 |            923 |            1578 |          601 |              147 |       13133 |      190 |       267 |        457 |           86 |
| POST-BATCH `ssot-hh-010`       |   665 |          2292 |            938 |            1605 |          609 |              147 |       13341 |      190 |       267 |        457 |           86 |
| POST-BATCH `ssot-hh-011`       |   675 |          2311 |            942 |            1628 |          619 |              156 |       13529 |      190 |       267 |        457 |           86 |
| POST-BATCH `ssot-hh-012`       |   685 |          2334 |            949 |            1654 |          629 |              160 |       13715 |      190 |       267 |        457 |           86 |
| POST-BATCH `ssot-hh-013`       |   695 |          2359 |            960 |            1672 |          639 |              162 |       13914 |      190 |       267 |        457 |           86 |
| POST-BATCH `ssot-hh-014`       |   705 |          2380 |            972 |            1692 |          647 |              162 |       14096 |      190 |       267 |        457 |           86 |
| POST-APPLY (= POST-BATCH 014)  |   705 |          2380 |            972 |            1692 |          647 |              162 |       14096 |      190 |       267 |        457 |           86 |

> Note: Per-Batch-Snapshots werden vom Digest-Script nur für **new-wave**-Batches geschrieben
> (`ssot-hh-009..014`, der `WAVE_BATCHES`-Filter in `run-phase4-apply.sh`). Der Re-Apply von
> `ssot-hh-001..008` aus der kumulativen Range emittiert keine Per-Batch-Counts — das ist
> idempotenter Re-Apply ohne neue Bücher, der nur `delete-then-insert` pro Junction durchzieht;
> die Counts werden nicht angerührt (works bleibt 645).

### Deltas pre → post

| dimension          | delta   | comment                                                                                              |
| ------------------ | ------: | ---------------------------------------------------------------------------------------------------- |
| works              |    +60  | HH-0081..HH-0140 neu in Authority-Layer                                                              |
| work_factions      |   +137  | Junction-Rows für 60 neue Bücher                                                                     |
| work_locations     |    +56  | Junction-Rows für 60 neue Bücher                                                                     |
| work_characters    |   +143  | Junction-Rows für 60 neue Bücher                                                                     |
| work_persons       |    +55  | Author-Bindings für 60 neue Bücher (anthology + collaborative authors aggregiert)                    |
| work_collections   |    +15  | HH-0090 *Sons of the Emperor* 9-Konstituenten-Bloc (HH-0101..HH-0109) + 6 Pass-11-Baseline-Forward-Refs (HH-0020→HH-0117..HH-0120 + HH-0022→HH-0124..HH-0125), jetzt in-range absorbiert |
| work_facets        |  +1176  | Facet-Junctions für 60 neue Bücher; Median ~19.6 Facets/Buch                                         |
| factions           |    +2   | exakt Phase-1-Promotion-Set: `rangdan`, `hrud`                                                       |
| locations          |   +11   | exakt Phase-2-Promotion-Set: `galaspar` + 3 Primarch-birthworlds (`olympia`/`barbarus`/`cthonia`) + 7 curated lore-iconic (`kiavahr`/`thramas_sector`/`urgall_depression`/`occluda_noctis`/`deshea`/`alaxxes_nebula`/`constanix_ii`) |
| characters         |   +13   | exakt Phase-3-Promotion-Set: 2 freq-2 Calth-Underworld-Spines (`kurtha_sedd`/`steloc_aethon`) + 11 curated freq-1 (`barabas_dantioch`/`sor_talgron`/`ingethel`/`kandawire`/`amar_astarte`/`ilya_ravallion`/`hasik_khan`/`holguin`/`redloss`/`hrend`/`nurgle`) |
| facet_values       |     +0  | Catalog idempotent (`ON CONFLICT DO NOTHING` — keine neue facetId der Welle, alle bekannt)           |

## Reference-Row-Deltas vs Phase-1/2/3 reports

Exakter Konsens — die Apply-Hälfte spiegelt das Reference-Set, das Phase 1–3 angelegt haben:

| layer       | phase-report-claim     | apply-digest-delta             | match |
| ----------- | ----------------------: | ------------------------------: | :---: |
| factions    | +2 rows / +1 alias     | factions 188→190 = +2          | ok   |
| locations   | +11 rows / +2 aliases  | locations 256→267 = +11        | ok   |
| characters  | +13 rows / +3 aliases  | characters 444→457 = +13       | ok   |

Aliases sind im Reference-Layer keine eigene DB-Row; sie schlagen nur in den
Stage-2-Resolver-Lookups durch (work_*-Junction-Counts steigen via aufgelöste Surface-Forms,
`factions`/`locations`/`characters`-Row-Counts nicht). Daher in der DB-Counts-Tabelle nur die
Row-Adds reflektiert.

## Forward-ref Guard (Brief 091 / Brief 101)

`scripts/apply-override-collections.ts` + `npm run test:apply-override-dry`-Tail:

```
forward collection refs:       30
unresolvable constituent refs: 21
by reason: out-of-range=21, unknown-work=0
```

- **`unknown-work=0`**: clean — kein Konstituent fehlt im Roster (kein Typo, kein
  unregistriertes deferred-gap). Das ist das einzige Brief-101-Reason-Split-Kriterium, das den
  Dry-Run abbrechen würde (Brief 101: nur `unknown-work` aborts).
- **`out-of-range=21`**: erwartete deferred edges. Konstituenten sind bekannte Roster-Bücher
  außerhalb der applied range `w40k 1..57 + hh 1..14`. Beispiele aus dem Roster:
  HH-Anthologien mit Konstituenten in HH-0141+ Folge-Wellen sowie W40K-Omnibi mit
  Konstituenten in W40K-0566+ Folge-Wellen. Werden absorbiert, sobald die jeweilige Welle
  landet (Pass-6 Pattern verified end-to-end, Pass-11-Baseline `out-of-range=27` ist diesen
  Pass auf 21 gesunken weil Pass-12 die HH-0020→HH-0117..0120 + HH-0022→HH-0124..0125 Edges
  ins Range gehoben hat).
- **`forward refs = 30`**: legitime cross-batch edges, alle resolvable durch den ascending
  sweep (`apply-override.ts:applyCollections`). Liste:
  - HH-0090 → HH-0101..HH-0109 (**9 — neu in dieser Welle**, *Sons of the Emperor*
    Anthology-Konstituenten — exakt die 9, die Dossier §1 forecast hat, alle in-range hh 1..14)
  - HH-0020 → HH-0117..HH-0120 (4 — Pass-10-Baseline-Anthology *Tales of Heresy* oder
    Äquivalent, Konstituenten jetzt in Pass-12-Range absorbiert)
  - HH-0022 → HH-0124..HH-0125 (2 — Pass-11-Baseline *Shadows of Treachery* Konstituenten
    jetzt in Pass-12-Range absorbiert)
  - W40K-0286 → W40K-0308..0311 (4), W40K-0307 → W40K-0316 (1), W40K-0296 → W40K-0327..0329
    (3), W40K-0294 → W40K-0337..0340 (4), W40K-0304 → W40K-0343..0345 (3) — pre-existing
    W40K-Omnibus-Edges (Pass-6/-7/-8 Pattern verified).
- **Pass-12 Forward-Ref-Bilanz:** Die Welle hat die *Sons of the Emperor* 9-Konstituenten-Bloc
  als saubere in-range-Edges hinzugefügt UND 6 Pass-11-Baseline-out-of-range-Refs absorbiert
  (HH-0020→HH-0117..0120 + HH-0022→HH-0124..0125). Brief-101-Reason-Split bleibt clean:
  `unknown-work=0`.

> **Dossier §7d-Vergleich.** Das Phase-0-Dossier prognostizierte `out-of-range=0, unknown-work=0`.
> `unknown-work=0` trifft zu. `out-of-range=0` traf nicht zu — wegen 21 erwarteter HH-Folge-
> Wellen-Konstituenten und pre-existing W40K-Omnibus-Edges. Brief-101-Logik (out-of-range
> informational, nur unknown-work gating) → **kein Stop**. Phase-0-Dossier-Forecast unterschätzte
> die pre-Pass-12-out-of-range-Baseline (Pass-11-4a-Report zeigt actual `out-of-range=27`,
> nicht `7` wie das Dossier vermutete) — die Forecast-Differenz ist diagnostisch, nicht gating.

## Strips / Anomalien

- **Keine facetId-Strips.** `missing facet ids: 0` im Dry. `facet-catalog.json` (bewusst nicht im
  Scope) hat alle vorkommenden facetIds; keine unknown facetId in HH-009..014 Override-Files.
- **Keine unresolved FK targets.** `missing resolved FK targets: 0`, `dangling JSON FK/alias
  refs: 0`. Alle Phase-1/2/3-Promotion-Targets existieren; alle Alias-Targets resolven.
- **Keine invalid roles / ratings.** `invalid normalized roles: 0`, `invalid rating overrides: 0`.
- **Re-Apply-Idempotenz für hh-001..008:** Die kumulative Range re-applied 8 frühere Batches
  idempotent (delete-then-insert pro Junction). Counts vor und nach Re-Apply für die alte Range
  sind identisch (works=645 PRE = 645 vor erstem new-wave Batch); kein Drift, kein Datenverlust.
- **Persons-Erweiterungen (+2 Rows, auto durch apply-override).** `scripts/seed-data/persons.json`
  trägt 2 neue Author-Rows: `brandon_easton` (HH-0109 *Ember of Extinction*) und `alan_merrett`
  (HH-0140 *Visions of Heresy*) — beides bekannte BL-Autoren in deren Authority-Layer-Erstauftritt.
  Anthology-Editoren mit `author: "?"` im Roster (*Sons of the Emperor*, *Scions of the Emperor*,
  *Blood of the Emperor*) erzeugen keine Persons-Row (bekannte Roster-Konvention für
  Multi-Author-Anthologien). Parallel zur Pass-11-Konvention (`l_j_goulding`, `charles_wraight`
  als Pass-11-Auto-Adds).

## Apply-side Trias (vor Commit)

- `npm run test:resolver` → **392 passed, 0 failed** (Phase-3-Baseline gehalten).
- `npm run test:resolver-data` → **ok** (10 Checks grün; Label-Update auf `hh-001..014` greift).
- `npm run test:resolver-coverage` → **ok** (smoke slugs identifiziert; below-threshold rows
  sind informational data-findings, keine automatic failures — exakt wie Pass 11).
- `npm run test:apply-override-dry` → **ok** (Brief-101-Guard: `unknown-work=0`,
  `out-of-range=21` informational; alle 14 batches `clean` im Synopsis-Lint; FK-Validation 0).
- `npm run test:collection-refs` → **10 pass, 0 fail** (Brief-101-Reason-Split-Unit-Tests
  weiter alle grün).
- `npm run lint` → **0 errors** (1 unrelated `@next/next/no-page-custom-font`-Warning in
  `src/app/layout.tsx`, pre-existing, kein Welle-Effekt).
- `npm run typecheck` → **clean**.

## Halt-Disziplin

- Mindestens ein commit pro Phase: ja (dieser commit).
- JSON-Files syntaktisch valide: ja (kein JSON-Edit in dieser Phase — alle JSON-Files unverändert).
- Architektonische Unsicherheit: nein — keine `Needs decision`-Blocker. Dossier-§7d-Punkte:
  - Forward-ref Guard (`unknown-work=0`): clean, in-phase entschieden.
  - facet-catalog Strips: keiner nötig (`missing facet ids: 0`).
  - Pre-Pass-12-out-of-range-Baseline unterschätzt im Dossier: diagnostisch, kein Stop.
- Write-Scope: Diff ⊆ {`scripts/apply-override-dry.ts`, `scripts/test-resolver-coverage.ts`,
  `scripts/test-resolver-data-integrity.ts`, `scripts/seed-data/persons.json`,
  `ingest/.last-run/phase4-digest.md`,
  `sessions/resolver-dossiers/resolver-pass-12-phase-4a-report.md`} — alle innerhalb des
  Phase-4a-Config-Scopes.
- Co-Author-Trailer: keiner.

## Ready for Phase 4b (Verify/Report)

Phase 4b-Achs-Paket (`scripts/verify-pass.ts`, finaler Impl-Report
`sessions/resolver-dossiers/resolver-pass-12-impl-report.md`) ist frei. Phase 4b liest:

- diese 4a-Statusdatei (für 4a-Done-Summary + Counts-Tabelle + Reference-Row-Deltas
  + Brief-101-Reason-Split),
- den committeten Apply-Digest `ingest/.last-run/phase4-digest.md` (für Per-Batch-Counts +
  PRE-/POST-Counts),
- `verify-pass.ts --config scripts/resolver-pass.config.json`-stdout
  (Verify-Digest, Smoke-Slug-Junction-Counts für die Config-Slug-Liste
  `sons-of-the-emperor`/`sanguinius-the-great-angel`/`valdor-birth-of-the-imperium`/
  `the-serpent-beneath`/`cybernetica`/`visions-of-heresy`, Rating-Coverage HH-0081..HH-0140,
  Drift/Gap/Collection-Audit-Replica für Old-Range HH-0001..HH-0080 + New-Range HH-0081..HH-0140).

**Keine** zweite DB-Apply, **keine** Trias-Re-Run, **kein** Override-File-Read in Phase 4b
(Read-only-Hälfte). Erwartung: HH-Past-Mid-Arc-Milestone (140 HH-Bücher in der Authority-Layer,
alle 17 Primarchen anchored, Calth-Underworld-Pair + Primarchs-Monograph-Serie + Classic-
Novella-Tail absorbiert) — Detailrahmen für die Phase-4b-Impl-Report-Synthesis.
