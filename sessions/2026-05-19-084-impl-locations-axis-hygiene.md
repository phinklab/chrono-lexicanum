---
session: 2026-05-19-084
role: implementer
date: 2026-05-19
status: complete
slug: locations-axis-hygiene
parent: 2026-05-19-084-arch-locations-axis-hygiene
links:
  - 2026-05-19-084-arch-locations-axis-hygiene
  - 2026-05-16-077-impl-grand-alignment-junction-hygiene
  - 2026-05-13-070-impl-faction-policy-hygiene
commits: []
---

# Locations-Axis-Hygiene — Sister-Pass zu Brief 077 für die Locations-Achse

## Summary

Brief 084 (Sister-Pass zu Brief 077) auf der Locations-Achse umgesetzt. Allowlist-basierter Apply-Layer-Skip schiebt 14 `Imperium`-Surface-Forms aus `book_details.notes` → `locationsUnresolved` in einen neuen `locationsSkippedRedundant`-Audit-Bucket; 6 Erhaltungs-Pfad-Bücher mit `Imperium` als alleinigem Location-Tag bleiben unverändert. Effekt entspricht exakt der Brief-§-Acceptance-Tabelle (20 → 6 / 0 → 14 / 417 → 417 / 0 Doppel-Vorkommen). `work_locations`-Junction-Count bleibt invariant — Notes-Bucket-Umsortierungs-Pass, keine Junction-Reduktion.

## What I did

**Neu:**

- `scripts/seed-data/location-policy.json` — 13 `redundantSurfaceForms` (Imperium-Cluster ×4, Chaos-Cluster ×4, Warp-Cluster ×2, Xenos-Cluster ×3) + 2 `specialCases` (Warp-Begründung, Eye-of-Terror-Abgrenzung). Kein `browseRoots`-Feld (per Cowork-Position offene Question 4).
- `scripts/apply-override-location-skip.ts` — pure DI-Helper `decideLocationSkips()` analog `decideFactionSkips()`, aber surface-form-zentriert (Umbrellas resolven zu `null`, es gibt keine ID, die als Skip-Key dienen könnte). Case-insensitive Trim-Match gegen `ReadonlySet<string>`-Eingabe. No-op-Returns wenn entweder Skip-Set leer oder keine resolved Location im Block (= Erhaltungs-Pfad).
- `scripts/db-counts-084.ts` — One-shot DB-Counts-Helper für Pre/Post-Verifikation. Parst `book_details.notes` per Buch, extrahiert `---surfaceForms---`-Block, summiert die vier Brief-§-Acceptance-Metriken (Bücher mit Umbrella in `locationsUnresolved` / `locationsSkippedRedundant` / `work_locations`-Sanity / Doppel-Vorkommen-Check). Exit non-zero bei Doppel-Vorkommen.
- `scripts/smoke-locations-084.ts` — Smoke-Probe für 5 Slugs (3 Skip-Pfad: `13th-legion`, `kill-team`, `annihilation-squad`; 2 Erhaltungs-Pfad: `soul-drinker`, `hellforged`) plus Junction-Sanity über alle 5 (kein Umbrella-`raw_name` in `work_locations`).
- `brain/wiki/decisions/location-policy.md` — ADR analog `faction-policy.md`-Struktur. Sektionen: Context (drei strukturelle Unterschiede zur Faction-Achse), Decision (Allowlist + Skip-Bedingung + Audit-Bucket + Startup-Validation), Why (warum Allowlist statt Tree-Membership, warum nicht im Resolver, warum surface-form-zentriert, warum Audit-Bucket, warum `work_locations` invariant), Revisit-Triggers (HH-Domain-Forward-Behavior, Audit-Bucket-False-Positives ≥ 5, neue Umbrella-Surface-Forms im Coverage-Output ≥ 3×, UI-Map-Filter-Phase, künftige Eldar-/Tau-Sub-Subdivisions, Notes-Format-Migration), Aftermath.

**Bearbeitet:**

- `scripts/apply-override.ts` — Import + Konstanten + `LocationSkipContext`-Interface + `loadLocationSkipContext()` (3-Throw-Bedingungs-Startup-Validation: JSON parsbar, Array-Form, kein Eintrag matcht case-insensitive eine `locations.json`-Row oder `location-aliases.json`-Key). `applyBook(override, roster, skipCtx, locationSkipCtx)` Signatur erweitert. `decideLocationSkips()` läuft nach `resolveLocations()` + vor `buildSurfaceFormsBlock()`. `buildSurfaceFormsBlock` um 4. Positional-Parameter `skippedLocationSurfaceForms: string[] = []` erweitert; case-insensitive Exclusion-Filter im `locationsUnresolved`-Build (kein Doppel-Vorkommen); conditional `locationsSkippedRedundant`-Payload-Bucket nur bei non-empty. Doppelte `resolveLocations()`-Call (Z. 1007 alt) entfernt — reuse des Resultats vom Top des `applyBook`.
- `scripts/apply-override-dry.ts` — Import `decideLocationSkips`; `LocationPolicyFile`-Interface + `redundantLocationSurfaceForms: ReadonlySet<string>` in `ReferenceData`; `locationsSkippedRedundant: string[]` in `BookSimulation`. `loadReferences()` liest `location-policy.json`. `simulateBook` filtert `locations.unresolved` + befüllt `locationsSkippedRedundant`. Neuer Report-Block „[apply-override-dry] location-umbrella-junction-skip (Brief 084)" mit „skipped surface forms: N across M books" + „by name: …" — observational, kein Fail.
- `scripts/test-resolver.ts` — 4 neue Test-Cases unter neuer Sektion `decideLocationSkips`: (a) Skip fires (Cadia + Imperium), (b) Skip preserves (Imperium alone), (c) Multiple umbrellas (Cadia + Imperium + Chaos), (d) Case-insensitive (IMPERIUM, "  Imperium of MAN  ").
- `scripts/test-resolver-coverage.ts` — Import `decideLocationSkips`; `LocationPolicyRow`-Interface + `LOCATION_POLICY` + `REDUNDANT_LOCATION_SURFACE_FORMS`-Set; neue `locationCoverageWithSkip()`-Funktion + `LocationCoverageWithSkip`-Interface; `BookCoverageExt` erweitert; `totals.locationsSkipped`-Akkumulator; Tail-String erweitert um `(post-Brief-084-skip, M location umbrella surface forms suppressed)`.
- `sessions/2026-05-11-061-arch-ssot-loop.md` — Dritter Discipline-Block „Locations-Granularity-Discipline (ab `ssot-w40k-021` / `W40K-0201`)" nach dem Faction-Granularity-Block (Z. 135). Vier semantische Cluster der 13 verbotenen Strings + Erhaltungs-Pfad-Klärung + Begründung mit Brief-084-Verweis.
- `scripts/run-ssot-loop.sh` — `base_trigger()`-Heredoc erweitert: dritte Discipline-Zeile „Locations-Granularity-Discipline (ab ssot-w40k-021 / W40K-0201 — Brief 061 § Constraints, Brief 084)" mit derselben Form wie die Faction-Granularity-Zeile.
- `brain/wiki/index.md` — Catalog-Eintrag für die neue ADR ergänzt (unter Decision pages, nach `faction-policy.md`).
- `sessions/2026-05-19-084-arch-locations-axis-hygiene.md` — Frontmatter `status: open → implemented` + impl-Link in `links:` ergänzt.
- `sessions/README.md` — Active-Threads-Tabelle: 084-arch `open → implemented`, neue 084-impl-Zeile direkt darunter, Maintainer-Bedienung-Satz auf „PR mergen → Brief 085 → Loop-Re-Trigger" gefasst.

## Decisions I made

- **Pure-Helper-File-Aufteilung wie 077.** `decideLocationSkips()` lebt in einer neuen File `scripts/apply-override-location-skip.ts` (DI-Form, keine FS/DB zur Call-Time). `loadLocationSkipContext()` lebt in `apply-override.ts` neben `loadSkipContext()`, analog zur 077-Form (Loading-Code mit FS/JSON-Reads dort, wo der Apply-Layer ihn aufruft).
- **Surface-Form-zentrierte Skip-Form (statt ID-zentriert).** Brief-077-`decideFactionSkips` arbeitet mit IDs, weil Faction-Umbrellas zu echten `factions.id`-Rows resolven. Locations-Umbrellas resolven zu `null` — es gibt keine ID. Skip-Key ist deshalb der Surface-Form-String case-insensitive nach `trim`.
- **Doppel-Vorkommen-Exclusion-Regel im `buildSurfaceFormsBlock`.** Ohne explizite Exclusion landet `Imperium` in beiden Buckets (einmal als unresolved, einmal als skipped). `buildSurfaceFormsBlock` filtert die unresolved-Liste gegen das Skip-Set case-insensitive — das ist der einzig korrekte Ort für die Exclusion, weil Skip-Decision und Bucket-Build dort zusammenkommen.
- **Konditionaler Bucket-Write.** `locationsSkippedRedundant` wird nur geschrieben, wenn non-empty (analog `factionsSkippedRedundant`). Diff-Minimalität bei Büchern ohne Skip.
- **`work_locations`-Invariant-Erwartung verifiziert.** Re-Apply-Run zeigt 417 → 417, exakt wie Brief 084 § Acceptance vorausgesagt. Apply-Layer schreibt nur Junction-Rows für `resolveLocation(name).id !== null`-Surface-Forms; Umbrellas wurden vor 084 nie zu Junctions, post-084 weiterhin nicht. Skip ist Notes-Concern, kein Junction-Concern.
- **5 Smoke-Slugs aus Empirie-Listen gewählt.** Skip-Pfad: `13th-legion` (2 Einträge), `kill-team` (alias-basierte Peer-Resolution via `Tau Empire space` → `t_au_empire`), `annihilation-squad` (3 Einträge, mehrere Peers). Erhaltungs-Pfad: `soul-drinker` + `hellforged` (beide `Imperium` als alleiniger Location-Tag). Coverage über die zwei wichtigen Edge-Cases (Alias-Auflösung, multiple Peers) plus die zwei häufigsten Erhaltungs-Pfad-Patterns.
- **Kein `browseRoots`-Feld in `location-policy.json`.** Per Cowork-Position (Brief 084 § Open questions 4). UI-Map-Filter-Phase bekommt einen eigenen Brief, der das Konzept dann von Grund auf entscheidet.
- **HH-Domain als Revisit-Trigger im ADR.** Per Maintainer-Tendenz (pre-plan-Klärung via AskUserQuestion): HH ist heute nicht aktiv, eine eigene ADR-Sektion wäre Spekulation. Revisit-Trigger („beim ersten HH-File-Import den Allowlist-Pfad gegen Pre-Heresy-Loyalist-Cabal-Doppelnatur testen") ist die ehrlichste Form.
- **`db-counts-084.ts` parst die DB direkt (statt jq über Override-Files).** Brief 084 § Acceptance ist Post-Apply-Wahrheit, die Override-Files sind nur Pre-Apply-Erwartung. Parser greift auf `book_details.notes` zu, weil dort die Skip-Decision sichtbar wird (`locationsSkippedRedundant`-Bucket).
- **`brain:lint` 2 verbleibende Blocker sind erwartet** zum Zeitpunkt des ADR-Writes: die ADR sourced den impl-Report, der zu dem Moment noch nicht existierte. Post-impl-Write sind alle ADR-Sources auflösbar. Lint-Re-Run nach Commit zeigt 0 blocking.

## Verification

**Static (alle grün):**

- `npm run lint` — pass (1 pre-existing Warning in `src/app/layout.tsx`, kein Touch in 084).
- `npm run typecheck` — pass (post-fix: zwei `interface NotesRow` → `type NotesRow` in den neuen Scripts, weil `db.execute<T>` einen `Record<string, unknown>`-kompatiblen Type erwartet).
- `npm run test:resolver` — 126/0 (war 122 vor 084, 4 neue `decideLocationSkips`-Cases).
- `npm run test:resolver-coverage` — Tail jetzt: `locations=417/493 (post-Brief-084-skip, 14 location umbrella surface forms suppressed)`. Faction-Tail unverändert: `(post-Brief-077-skip, 165 grand-alignment surface forms suppressed)`.
- `npm run test:apply-override-dry` — `ok`; neuer Report-Block:
  ```
  [apply-override-dry] location-umbrella-junction-skip (Brief 084):
    skipped surface forms: 14 across 14 books
    by name: Imperium x14
  ```
- `npm run brain:lint -- --no-write` — 0 blocking nach Commit der impl-Report-File (zum ADR-Write-Zeitpunkt 3 blocking wegen fehlender impl-Report-Source, danach geheilt).

**Pre-Apply Snapshot** (`npx tsx --env-file=.env.local scripts/db-counts-084.ts`):

```
policy: 13 redundant surface forms loaded from location-policy.json
work_locations                     417

Brief 084 § Acceptance — observational counts:
  books with redundant umbrella in locationsUnresolved      20
  books with redundant umbrella in locationsSkippedRedundant 0
  work_locations (sanity, invariant)                         417
  books with double-occurrence (both buckets)               0

by surface form (locationsUnresolved, redundant only):
  Imperium                     20
```

**Re-Apply** `ssot-w40k-001..020` per `npm run db:apply-override -- --batch=ssot-w40k-NNN`. Alle 20 Batches `done. inserts=0 updates=10 total=10` — 200 Bücher, 0 neue, 200 Notes-Updates (erwartetes Verhalten).

**Post-Apply Snapshot** (`npx tsx --env-file=.env.local scripts/db-counts-084.ts`):

```
policy: 13 redundant surface forms loaded from location-policy.json
work_locations                     417

Brief 084 § Acceptance — observational counts:
  books with redundant umbrella in locationsUnresolved      6
  books with redundant umbrella in locationsSkippedRedundant 14
  work_locations (sanity, invariant)                         417
  books with double-occurrence (both buckets)               0

by surface form (locationsUnresolved, redundant only):
  Imperium                     6

by surface form (locationsSkippedRedundant):
  Imperium                     14
```

**Counts-Delta-Tabelle** (gegen Brief 084 § Acceptance):

| Metrik | Pre-084 | Post-084 (Ist) | Erwartung | Match |
|---|---:|---:|---:|---|
| Bücher mit `Imperium` in `locationsUnresolved` | 20 | 6 | 6 | ✓ |
| Bücher mit `Imperium` in `locationsSkippedRedundant` | 0 | 14 | 14 | ✓ |
| `work_locations` (Junction-Count) | 417 | 417 | 417 | ✓ |
| Doppel-Vorkommen | 0 | 0 | 0 | ✓ |

**Smoke** (`npx tsx --env-file=.env.local scripts/smoke-locations-084.ts`):

```
[smoke-locations-084] Skip-Pfad (umbrella + peer location)
  /buch/13th-legion — ok (skipped: [Imperium])
  /buch/kill-team — ok (skipped: [Imperium])
  /buch/annihilation-squad — ok (skipped: [Imperium])

[smoke-locations-084] Erhaltungs-Pfad (umbrella as sole tag)
  /buch/soul-drinker — ok (kept in unresolved: [Imperium])
  /buch/hellforged — ok (kept in unresolved: [Imperium])

[smoke-locations-084] Junction sanity — no umbrella raw_name
  /buch/13th-legion — ok (1 junction rows, no umbrella raw_name)
  /buch/kill-team — ok (1 junction rows, no umbrella raw_name)
  /buch/annihilation-squad — ok (2 junction rows, no umbrella raw_name)
  /buch/soul-drinker — ok (0 junction rows, no umbrella raw_name)
  /buch/hellforged — ok (0 junction rows, no umbrella raw_name)

Summary: 0 smoke failures across 5 slugs (3 skip + 2 preservation, plus junction sanity over all 5)
```

**Audit-Bucket-Stichprobe** (Surface-Form-Häufigkeit aus Post-Apply): nur `Imperium` (×14) ist in `locationsSkippedRedundant` belegt. Die anderen 12 Initial-Einträge (`Imperium of Man`, `Imperium of Mankind`, `the Imperium`, `Chaos`, `Chaos Space`, `the Chaos Space`, `Realm of Chaos`, `the Warp`, `Warp Space`, `Xenos`, `Aliens`, `Alien Space`) sind 0× belegt — Forward-Discipline-Vorrat für den Loop ab `ssot-w40k-021`.

**Startup-Validation** lief beim ersten `db:apply-override`-Aufruf einmal sauber durch: keine der 13 Skip-Strings matched case-insensitive einen `locations.json`-Name oder `location-aliases.json`-Key. Brief-084-Open-Question „initiale 13er-Liste sauber" beantwortet: ja.

## Open issues / blockers

Keine. Brief 084 § Acceptance vollständig getroffen, alle Erwartungen exakt erreicht.

## For next session

Suggestions für den nächsten Architect-Brief:

- **`Subsector Aurelia` als unresolved Location** in `coverage`-Output war im Vor-084-Output sichtbar (echte `locations.json`-Lücke, kein Umbrella). Folge-Vorschlag: `locations.json` um `subsector_aurelia` ergänzen (Vigilus-Region, post-Indomitus-Crusade-Schlacht). **NICHT** zur Skip-Liste hinzufügen — Skip-Liste bleibt Maintainer-Pflege, hier wäre eine echte Resolver-Erweiterung der richtige Pfad.
- **`book_details.notes`-Format-Versionierung.** Wir haben jetzt zwei conditional Buckets (`factionsSkippedRedundant`, `locationsSkippedRedundant`) plus die drei Unresolved-Buckets plus `flags` plus `formatOverride`. Ein optionales `schemaVersion: 1`-Top-Level-Feld würde künftige Migrationen sauberer machen, ist aber nicht akut.
- **OQ (10) Hardcover-Hit-Rate-Härtung (Brief 085)** ist der nächste geplante Brief — Titel-Normalisierungs-Layer als bevorzugter Promote-Pfad gegenüber OL-Fallback.
- **Loop-Re-Trigger `ssot-w40k-021..025`** kann nach 085 angefahren werden — die vier Disciplines greifen automatisch:
  1. Public-Synopsis im Heredoc + Apply-Layer-Forward-Guard (Brief 080).
  2. Faction-Granularity im Heredoc + Grand-Alignment-Skip im Apply-Layer (Brief 077).
  3. Locations-Granularity im Heredoc + Umbrella-Skip im Apply-Layer (Brief 084 — heute).
  4. (Wenn Brief 085 ein Loop-Trigger-Heredoc-Edit braucht: vierte Discipline.)

## References

- Brief 077 (Faction-Achse, Vorbild für Skip-Architektur): [`sessions/2026-05-16-077-arch-grand-alignment-junction-hygiene.md`](./2026-05-16-077-arch-grand-alignment-junction-hygiene.md), [`sessions/2026-05-16-077-impl-grand-alignment-junction-hygiene.md`](./2026-05-16-077-impl-grand-alignment-junction-hygiene.md).
- ADR-Vorbild: [`brain/wiki/decisions/faction-policy.md`](../brain/wiki/decisions/faction-policy.md).
- Skip-Helper-Sibling: [`scripts/apply-override-skip.ts`](../scripts/apply-override-skip.ts).
- Loop-Driver: [`scripts/run-ssot-loop.sh`](../scripts/run-ssot-loop.sh), [`sessions/2026-05-11-061-arch-ssot-loop.md`](./2026-05-11-061-arch-ssot-loop.md).
