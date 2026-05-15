---
session: 2026-05-15-074
role: implementer
date: 2026-05-15
status: complete
slug: resolver-batch-3
parent: 2026-05-15-074-arch-resolver-batch-3
links:
  - 2026-05-14-072-impl-resolver-batch-2
  - 2026-05-13-070-impl-faction-policy-hygiene
  - 2026-05-12-069-impl-resolver-apply-evidence
commits:
  - 7b86d5c
---

# Resolver-Pass 3 — Surface-Form-Crystallization für ssot-w40k-011..015 (impl)

## Summary

Dritte Resolver-Welle umgesetzt. `factions.json` +20 (inkl. `hydra_cabal`-Watson-Knoten, Astra-Militarum-named-regiment-tier, Sororitas-Orders, Astartes-Loyalist-Sub-Factions, Aeldari-/Necron-/Navis-Sub-Factions, Goffs). `locations.json` +19 (Imperium-Nihilus-Frames + Necron-Tomb-Worlds + Watson-Welten + Named-Vehicles). `characters.json` +26 (Cawl NEU als 074-Cross-Batch-Anchor + Hadeya Etsul + Aeronautica-cross-batch Lucille/Kile/Bree + Watson-Retinue + lore-iconic-singletons). Aliases erweitert (Space Sharks/Dark City/Cawl-Multispelling etc.); Review-Follow-up ergänzt `Imperium` / `Chaos Space Marines` und entfernt zwei riskante Character-Aliases. Brief-Erratum #4 umgesetzt: Green Tide bleibt voll im Resolver-Scope, kein partieller `work_collections`-Eintrag; neue `scripts/seed-data/collection-gaps.json` mit dem W40K-0147-Ledger. Re-Apply `ssot-w40k-001..015` produzierte 50 frische `works`-Rows (die Brief-061-Loop hatte sie nur als Override-Files gemerged, nicht in die DB geschrieben). Globale Junction-Counts nach Review-Follow-up-Re-Apply: `work_factions=912`, `work_locations=287`, `work_characters=522`, `work_collections=35` (Green Tide unverändert bei 0 Cross-Batch-Rows, wie erwartet wegen `roster.collections`-Lücke).

## What I did

- **`scripts/seed-data/factions.json`** — 20 neue Faction-Rows + Squats-`tone`-Update von `"Aus-Setting-Removed sub-faction (Squats)"` auf `"historical_canon_layer"` (siehe Decisions).
- **`scripts/seed-data/locations.json`** — 19 neue Locations; Review-Follow-up ergänzt fehlende `era_frame`-Tags auf den 074-Frame-Locations.
- **`scripts/seed-data/characters.json`** — 26 neue Characters (Cawl NEU per Brief-Erratum #3; plus Lucille von Shard / Kile Simlex / Bree Jagdea als echte ≥2-cross-batch Aeronautica-Continuity).
- **`scripts/seed-data/faction-aliases.json`** — 17 neue Aliases (`Imperium → imperium`, `Chaos Space Marines → heretic_astartes`, `Space Sharks → carcharodons`, `Hydra → hydra_cabal`, `Adepta Sororitas → sisters_of_battle`, …).
- **`scripts/seed-data/location-aliases.json`** — 4 neue Aliases (`Dark City → commorragh`, `Serenade → cepharil`, …).
- **`scripts/seed-data/character-aliases.json`** — 17 neue Aliases (`Cawl → belisarius_cawl`, `Inquisitor Draco → jaq_draco`, `Lord Castellan Creed → ursarkar_e_creed`, …); Review-Follow-up entfernt das zu breite `Creed` und den falschen `Lord Solar Trazyn`-Alias.
- **`scripts/seed-data/collection-gaps.json` (NEU)** — Green-Tide-Ledger-Eintrag mit den 4 existierenden Constituents (W40K-0128/0118/0249/0565) + 4 fehlenden Short-Stories. Override-File-15 erwähnt W40K-0117 für *Catachan Devil*, der korrekte Roster-Eintrag ist W40K-0118 — Note dokumentiert.
- **`scripts/seed-data/manual-overrides-ssot-w40k-015.json`** — 13 unbekannte facetIds entfernt (`interplanetary`/`freedom`/`discovery`/`duty`/`early_release`); siehe Decisions.
- **`scripts/apply-override-dry.ts`** — Batch-Range 001..015 + 8 neue Smoke-Slugs + erweiterte EXPECTED_RANGES für die 150-Bücher-Größenordnung.
- **`scripts/test-resolver-coverage.ts`** — Batch-Range 001..015 + Smoke-Slugs.
- **`scripts/test-resolver-data-integrity.ts`** — Batch-Range 001..015 + Smoke-Slugs + Slug-Existence-Test-Label.
- **`scripts/test-resolver.ts`** — 24 neue Resolver-Cases (Brief-074-spezifische direct-matches + Aliase, davon 11 Faction, 6 Location, 7 Character).
- **`scripts/seed-data/persons.json`** — 17 auto-erstellte Author-Personen aus dem 011..015-Apply (Loop-LLM-Subsession schrieb sie ohne Roster-Author, Brief-061-Konvention).
- **`scripts/seed-resolver-extensions.ts`** — Review-Follow-up: Location-Tags werden für bestehende Rows idempotent aus JSON gemerged, damit tag-only-Fixes wie die 074-`era_frame`-Korrektur die DB erreichen.
- **Helper-Scripts (NEU, alle in `scripts/`):** `aggregate-surface-forms-074.ts` (Override-Aggregation), `snapshot-counts-074.ts` (DB-Snapshots für die Counts-Tabelle), `audit-cockpit-replica-074.ts` (Cockpit-Pillen-SQL-Replica), `smoke-slugs-074.ts` (Junction-Counts pro Slug), `watson-trilogy-check.ts` (Watson-Trilogy-Junction-Audit), `strip-unknown-facets-074.ts` (Data-Hygiene für die 015-Override-facetIds).
- **`sessions/2026-05-15-074-arch-resolver-batch-3.md`** — Status `open` → `implemented`, `commits: […]` gesetzt.

## Decisions I made

- **Squats `tone` Update auf `historical_canon_layer`.** Bestätigt mit User vor Plan-Exit. `seed-resolver-extensions.ts:247` upsertet die Spalte aus dem JSON; der bestehende Text `"Aus-Setting-Removed sub-faction (Squats)"` lebt jetzt nur noch in git-history. Die `setting_removed`-Semantik ist nicht verloren (Squats sind per definitionem Setting-removed-Lore), nur nicht mehr im `tone`-Slot kodiert. Single-Token-Konvention konsistent mit `archive`/`line`/`alien` im Rest von factions.json.
- **`hydra_cabal` als neuer Knoten (NICHT `hydra`).** ID-Form `hydra_cabal` vermeidet Verwechslung mit dem existierenden Location `hydra_cordatus`. Surface-Form `Hydra` läuft via `faction-aliases.json` auf `hydra_cabal`.
- **`triarch_praetorians` alignment=`xenos`** (lore-konsistent: Necrons sind xenos). Brief-Tendenz `neutral` verworfen — `factionAlignment` Enum trägt `xenos`, und keine andere Necron-Sub-Faction in factions.json ist `neutral` (alle bestehenden Necron-Knoten = `xenos`). Triarch Council als Alias auf `triarch_praetorians` (lore-distinkt, aber freq=1 ohne eigene Promotion).
- **Belisarius Cawl als NEUER character-row angelegt** (Brief-Erratum #3 widerlegt die Erst-Fassungs-Annahme „existiert schon"). 3 Appearances 011/014/015, `notes='Cawl trilogy anchor'` OHNE `historical_canon_layer`-Marker.
- **Watson-Retinue als single rows mit `historical_canon_layer`-Marker im `notes`-Feld** (Schema-Tatsache aus Brief-Erratum #1: `characters` hat `notes`, kein `tags`). Kompakter String `'historical_canon_layer; Watson Inquisition-War Trilogy retinue'`.
- **Aeronautica Imperialis aufgenommen** (freq=4 in 011..015, parent=`astra_militarum`). Brief nicht explizit, aber ≥2-Schwelle erfüllt und Brief erlaubt CC-Judgment für freq-getriebene Adds.
- **Goffs aufgenommen, Blood Axes / Evil Sunz / Gretchin nicht.** Goffs freq=3 cross-batch (Brutal Kunnin + Warboss + Green Tide) als named Ork-clan-Anker. Blood Axes / Evil Sunz freq=2 nur in Warboss + Green Tide (das Green Tide ist Warboss' Omnibus-Container — Doppelcounting); Gretchin ist Race-Subdivision (unit-type), keine Faction. Konservativ gehalten analog 072's „named-regiment-tier nicht zu granular".
- **Order of the Last Candle (freq=1) + Order of Our Martyred Lady (freq=3) aufgenommen, weitere 5 Sororitas-Orders (Argent Shroud / Bloody Rose / Ebon Chalice / Sacred Rose / Valorous Heart) nicht.** Die 5 sind alle freq=1 und nur im Triumph-of-Saint-Katherine-supporting-Tier — Brief sagt „plus weitere wenn freq≥2"; keine erfüllt. Cowork-Validierung im Folge-Brief, falls 016+ welche dazubringen.
- **`cepharil` canonical, `serenade` Alias** (Cowork-Brief: „Cowork-Tendenz: Cepharil/Serenade Single-Row"). Cepharil ist der Lexicanum-Hauptname; Serenade der in-novel-Twin-Name. Alias-Richtung gewählt damit Cepharil im Frontend rendert.
- **13 unbekannte facetIds aus 015-Override gestrippt.** Loop-Driver-LLM-Subsession (Brief 071 produktiver Run, PR #54) schrieb `interplanetary`/`freedom`/`discovery`/`duty`/`early_release` in W40K-0141/0144/0146/0147/0148/0149/0150, obwohl keine davon in `facet-catalog.json` existiert. `apply-override.ts:486-499` validiert facetIds gegen den Katalog und throwt bei Misses — ohne Strip wäre der Re-Apply blockiert. Diese IDs überlappen NICHT mit Brief-074's 9-Tag-`value_outside_vocabulary`-Hand-off-Liste (commissar/inquisitor/squat/corsair/etc.); es sind LLM-Typos gegen einen veralteten Katalog-Snapshot. Strip = NICHT promoten, voll Brief-konform. Hand-off-Hinweis für die Vokabular-Hygiene-Session: scope `interplanetary` (zwischen `planetary` und `sector`), theme `freedom`/`discovery`/`duty` und entry_point `early_release` sind LLM-suggested coverage-gaps, die separat zu validieren sind.
- **DB-Stand widerspricht Brief-Erst-Annahme.** Brief 074-arch sagte „150 W40K-Bücher applied" / „die 50 neuen Bücher liegen heute als works/book_details Rows" — Reality-Check vor Apply: `SELECT COUNT(*) FROM works = 100`. Der Brief-061-Loop hat die 011..015-Override-Files nur produziert + commited, nicht in die DB applied (Brief 074-arch erwähnt das selbst weiter unten richtig: „CC's per-Iter-Subsession hat `db:apply-override` während des Loops nicht ausgeführt"). Erste-Annahme-Zeile war Tippfehler. Konsequenz: meine 15× apply-override-Sequence ist gleichzeitig Drift-Cleanup für 001..010 UND First-Time-Apply für 011..015.
- **Author-Auto-Creates persistiert** (`scripts/seed-data/persons.json` +17 Einträge, +80 Zeilen). Apply-Override-Pipeline schreibt fehlende Author-Slugs in persons.json — Brief-061-Konvention, nicht 074-spezifisch.
- **Helper-Scripts unter `scripts/` committed** (5 NEUE Scripts: aggregate-surface-forms-074, snapshot-counts-074, audit-cockpit-replica-074, smoke-slugs-074, strip-unknown-facets-074, watson-trilogy-check). Sie sind one-shot-Operational-Tools — analog 072's `test-resolver-data-integrity.ts`-Pattern. Reproduzierbarkeit der Counts-Tabelle und der Audit-SQL ist im Repo dokumentiert statt nur im Report-Text.

## Verification

### Counts-Tabelle (Pflicht)

| Phase                         | `work_factions` | `work_locations` | `work_characters` | `work_collections` |
| ----------------------------- | --------------- | ---------------- | ----------------- | ------------------ |
| Pre-Apply (vor diesem Brief)  | 650             | 239              | 475               | 35                 |
| Per-Batch 011                 | 697             | 257              | 492               | 35                 |
| Per-Batch 012                 | 733             | 265              | 494               | 35                 |
| Per-Batch 013                 | 786             | 274              | 498               | 35                 |
| Per-Batch 014                 | 843             | 280              | 508               | 35                 |
| Per-Batch 015                 | 912             | 287              | 522               | 35                 |
| Post-Re-Apply 001..015 (total)| 912             | 287              | 522               | 35                 |

Re-Apply 001..010 davor verschob `work_factions` minimal (650 → 651, Resolver-Set-Drift-Cleanup) und `work_characters` nach Review-Follow-up auf 476 (Bree Jagdea aus `ssot-w40k-009`). Per-Batch-Counts oben sind Snapshots NACH jedem `db:apply-override --batch=ssot-w40k-NNN`-Run; jeder Batch baut auf den vorigen auf.

### Coverage-Tabelle

| Achse        | Reference-Rows | Junction-Distincts | Distinct-Coverage |
| ------------ | -------------- | ------------------ | ----------------- |
| factions     | 126            | 912 / 1003 input   | 90.9 % direct match |
| locations    | 132            | 287 / 342 input    | 83.9 % direct match |
| characters   | 129            | 522 / 677 input    | 77.1 % direct match |

Die Rest-Unresolveds (9.1 % / 16.1 % / 22.9 %) sind überwiegend erwartete 1×-Surface-Forms; verbleibende 2×-Treffer sind primär Omnibus-inherited Ork-/Catachan-Constituent-Forms aus `The Green Tide` plus `Saint Katherine` als eigener späterer Curations-Call.

### Smoke-Slugs (`f/l/c/in-coll`)

| Slug                          | ExternalId  | F | L | C | in-collection |
| ----------------------------- | ----------- | - | - | - | ------------- |
| honourbound                   | W40K-0101   | 5 | 1 | 1 | 0 |
| the-infinite-and-the-divine   | W40K-0108   | 4 | 2 | 2 | 0 |
| brutal-kunnin                 | W40K-0107   | 4 | 1 | 1 | 0 |
| krieg                         | W40K-0117   | 5 | 1 | 0 | 0 |
| archmagos                     | W40K-0144   | 3 | 0 | 1 | 0 |
| inquisitor-draco              | W40K-0148   | 11| 0 | 4 | 0 |
| voidscarred                   | W40K-0141   | 4 | 0 | 0 | 0 |
| the-green-tide                | W40K-0147   | 6 | 1 | 0 | **0** |

Green Tide: 5 factions / 1 location / 0 characters / **0 work_collections** wie erwartet — der Roster trägt 0 `collections`-Rows mit W40K-0147 als parent, also kann `applyCollections` nichts schreiben. Stattdessen lebt der Hinweis in `scripts/seed-data/collection-gaps.json`. Inquisitor / Draco-15 trotz 11 Faction-Surface-Forms hat 0 Locations (Watson-Trilogy-Book-1 ist Earth-/Inquisition-bound; Stalinvast + Sabulorb + Webway erscheinen erst in Books 2/3 der Trilogy = `harlequin` + `chaos-child` — dort sind sie korrekt als `work_locations` resolved).

### Audit-Cockpit-Tour via SQL (User-Antwort: SQL statt dev-Server)

Replica der `/buecher?audit=…`-Pillen-Logik (`drift` = raw_name ≠ canonical, `gap` = mind. eine Junction-Achse = 0, `ssot` = sourceKind='ssot', `collections` = ≥2 contained-in-Rows) gegen die DB:

- **Pre-Apply, W40K-0001..0100** (die schon vor 074 in DB existierenden 100 Bücher): `drift=72, gap=30, ssot=100, collections=8, drift_and_gap=22`.
- **Pre-Apply, W40K-0101..0150** (die 50 neuen Bücher): `rows=0` — die Loop-Driver-Subsession hatte sie nicht in die DB geschrieben.
- **Post-Apply, W40K-0001..0100** (Re-Apply 001..010 mit Review-Follow-up-Resolver-Set): `drift=72, gap=29, ssot=100, collections=8, drift_and_gap=21` — eine kleine Gap-Reduktion durch den Bree-Jagdea-Cross-Batch-Character aus `ssot-w40k-009`; der Großteil der Drift bleibt erwartete raw_name-vs-canonical-Abweichung.
- **Post-Apply, W40K-0101..0150**: `drift=34, gap=31, ssot=50, collections=0, drift_and_gap=22`. Die Drift-Zahl steigt gegenüber dem Erst-Report, weil `Imperium` / `Chaos Space Marines` jetzt bewusst resolve'n und damit als raw_name-vs-canonical-Drift sichtbar werden (`Imperium` → `Imperium of Man`, `Chaos Space Marines` → `Heretic Astartes`). Gap sinkt leicht durch die Alias- und Character-Fixes. Rest-Gaps sind erwartetes Verhalten bei Büchern mit 0 Characters oder 0 Locations, weil ihre Surface-Forms freq=1 oder bewusst nicht promoted blieben.

**Cockpit-Quality-Feedback (Brief-074 Open-Questions-Punkt):** Die SQL-Replica der vier Pillen war 1:1 aus der TSX-Datei ablesbar (kein versteckter Filter-State). Die UX-Erkenntnis aus der SQL-Replica: die `drift`-Pille ist primärer Triage-Wert (raw_name-Audit), aber sie unterscheidet nicht zwischen „erwartetes lore-thin-Sub-Regiment-Surface-Form" und „resolver-Promotion-Kandidat" — die nächste Cockpit-Iteration könnte einen `confidence` / `frequency`-Sort innerhalb der drift-gefilterten Liste hinzunehmen, damit Maintainer-Triage die freq≥2-Drifts zuerst sieht. Heute muss man pro Buch auf die `/buch/<slug>/audit`-Route klicken, um die rohen Surface-Forms zu sehen.

### CLI-Checks (alle Acceptance-Bullets)

| Check                                            | Status | Note |
| ------------------------------------------------ | ------ | ---- |
| `npm run db:seed-resolver-extensions`            | pass   | Initial: factions +20, locations +19, characters +23. Review-Follow-up re-run: factions 126 updated, location tags 7 updated, characters +3. |
| `npm run db:apply-override --batch=ssot-w40k-001..015` | pass | 15 Runs, alle inserts=0|10 / updates=0|10. Persons.json grew from 14 → 31 across runs. |
| `npm run lint`                                   | pass   | Bestehende `no-page-custom-font`-Warning in `layout.tsx:44` (Pre-074). |
| `npm run typecheck`                              | pass   | 0 errors. |
| `npm run brain:lint -- --no-write`               | pass   | 0 blocking, 5 warnings (bestehend, nicht 074-induziert). |
| `npm run test:resolver`                          | pass   | 78 passed, 0 failed (war 51 vor 074). |
| `npm run test:resolver-data`                     | pass   | inkl. „coverage smoke slugs exist in 001..015" (Label-Update). |
| `npm run test:resolver-coverage`                 | pass   | 150 books processed, 7 below-threshold smoke-axes (data findings, keine failures). |
| `npm run test:apply-override-dry`                | pass   | missing facet ids: 0, dangling: 0, forward refs: 0. |
| `git diff --check`                               | pass   | keine Whitespace-Errors. |

### Watson-Trilogy junction-spot-check (Decisions-Validation)

49 Junction-Rows für `inquisitor-draco` + `harlequin` + `chaos-child`. Kern-Match:
- **Hydra** (3×): alle 3 Bücher resolved sauber auf `hydra_cabal` mit `raw_name='Hydra'`.
- **Squats** (3×): alle 3 Bücher resolved auf `squats` (existing row mit `tone='historical_canon_layer'` jetzt).
- **Watson-Retinue (Jaq Draco / Meh'Lindi / Vitali Googol / Grimm)**: alle 4 Character-Rows × 3 Bücher = 12 Junction-Rows, alle direkt-resolved, alle mit `notes='historical_canon_layer; ...'`.
- **Stalinvast** in `harlequin`, **Sabulorb** + **Webway** in `chaos-child` — sauber resolved.

## Open issues / blockers

Keine Blocker.

**Hand-off zur Vokabular-Hygiene-Session** (Brief-074 Out-of-Scope, aber 074-impl-induziertes Material):

- **Loop-Log-Tag-Kandidaten (9):** `commissar` / `inquisitor` / `squat` / `corsair` / `triarch_praetorian` / `valkyrie_pilot` / `webway_journey` / `omnibus_with_prior_constituents` / `cabal_inquisition` / `rogue_inquisition` / `cw_canon_divergence` — laut Brief-074 als laufende Tag-Triage am Cockpit, nicht einmaliger Architektur-Brief.
- **Catalog-LLM-Typos (5, NEU in dieser Welle):** `interplanetary` (scope, zwischen `planetary` und `sector`), `freedom`/`discovery`/`duty` (theme), `early_release` (entry_point). LLM-suggested coverage-gaps, getrennt zu validieren ob Catalog-Erweiterung erwünscht ist.
- **`Order of the …`-Sororitas-Sub-Factions** (5 Cases aus *Triumph of Saint Katherine*) — alle freq=1. Sollte 016+ welche dazubringen, prüfen ob die kumulative Schwelle ≥2 reißt.
- **Roster-Cleanup-Lücken** (5 `data_conflict`-Author-Missing-Flags aus 015 Loop-Log: W40K-0141/0142/0143/0146/0147) — bleiben im Excel-Maintainer-Workflow per Brief-061-Konvention.
- **Sub-Sub-Regiment-Tier** (z. B. „Eleventh Antari Rifles" / „472nd Siege Regiment" / „901st Tactical Wing" / „Cadian 101st" / „Cadian 217th") — alle freq=1, bleiben in `book_details.notes`-Surface-Forms-Block. Cowork-Default war „nicht aufnehmen"; ich habe diesen Default gehalten.

**Brief-Erst-Annahme-Korrektur:** Der Brief sagte „150 W40K-Bücher in DB" — Reality: nur 100 (Loop-Driver hat 011..015 nicht applied). Brief 074-arch sollte das anpassen oder die Wiki-Session den Stand korrigieren. Effekt war neutral: die 15× apply-override hat beide Mengen versorgt (Re-Apply 001..010 + First-Apply 011..015).

## For next session

1. **Loop-Re-Trigger für `ssot-w40k-016`.** 150 Bücher applied, Brief-061-Pre-Check würde sonst loud-stoppen (150 % 50 == 0). Maintainer-Skip-Marker / „lets go" gemäß bisheriger Konvention.
2. **CC-Direct-Curation ADR + Wiki-Hygiene-Session** (Cowork's offene OQ aus project-state). V2-LLM-Stage als „ausgemustert" markieren, OQ1 / OQ2-(c) als „moot post-Pipeline-Shift" schließen, ADR `decisions/why-cc-direct-curation.md` schreiben.
3. **Cockpit-Detail-View-Refinement (siehe Cockpit-Quality-Feedback oben).** Sort/Filter innerhalb der drift-Pille nach freq/confidence; ggf. Sub-Sub-Faction-Surface-Forms-Sektion als eigene UI-Komponente.
4. **Collection-Gap-Resolve-Pass für Green Tide.** Wenn die Maintainer-Excel-Workflow-Iteration die 4 Short-Story-Constituents (`Where Dere's Da Warp Dere's a Way` / `Painboyz` / `Mad Dok` / `The Enemy of My Enemy`) als eigene Roster-Works aufnimmt, kann ein Folge-Brief das Ledger schließen: `roster.collections`-Rows ergänzen, Re-Apply, `collection-gaps.json` ggf. löschen oder als historisches Audit erhalten.

## References

- `sessions/2026-05-15-074-arch-resolver-batch-3.md` — Brief mit Erratum + Green-Tide-Addendum.
- `sessions/2026-05-14-072-impl-resolver-batch-2.md` — Disziplin-Vorlage (Counts-Tabelle, Pre/Per-Batch).
- `sessions/ssot-loop-log.md` — Loop-Log mit 5 `data_conflict`-Flags + 9 `value_outside_vocabulary`-Kandidaten.
- `scripts/seed-resolver-extensions.ts` — Upsert-Pfad (`seed-resolver-extensions.ts:247`).
- `scripts/apply-override.ts` — `applyCollections` Cross-Batch-Resolve via `external_book_id` (Z. 796–870); facet-ID-Validierung (Z. 486–499).
- `scripts/seed-data/collection-gaps.json` — neuer Ledger.
- `brain/wiki/decisions/faction-policy.md` — Browse-Root-Disziplin (Faction-Policy aus 070).
- Helper-Scripts: `scripts/aggregate-surface-forms-074.ts`, `scripts/audit-cockpit-replica-074.ts`, `scripts/smoke-slugs-074.ts`, `scripts/snapshot-counts-074.ts`, `scripts/strip-unknown-facets-074.ts`, `scripts/watson-trilogy-check.ts`.
