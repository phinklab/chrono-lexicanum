---
session: 2026-05-12-064
role: implementer
date: 2026-05-12
status: complete
slug: resolver-deep-audit
parent: 2026-05-12-063
links:
  - 2026-05-12-063
  - 2026-05-11-061
  - 2026-05-11-062
commits: []
---

# Resolver Deep Audit - Implementer Review

## Scope

Audit-Ziel war die committed Resolver-Session auf Branch `session-063-resolver-50-books`, Range `main..HEAD` mit `HEAD=7eb09d8` und den vom Maintainer genannten Commits `654a9c4`, `adee6ab`, `29a2251`, `a747bbb`, `9e4b4a5`, `dde705b`, `1fa30de`, `7eb09d8`.

Wichtig: Waehrend des Audits tauchten uncommitted Worktree-Aenderungen an `scripts/seed.ts`, `scripts/seed-resolver-extensions.ts`, Resolver-/Alias-Daten und Role-Normalisierung auf. Ich habe sie nicht zurueckgesetzt und nicht als 063-Session-Commits bewertet. Einige Findings unten sind in diesen uncommitted Kandidaten-Patches bereits teilweise adressiert; sie brauchen aber eigenen Review/Commit, bevor 063 wirklich als geschlossen gelten sollte.

Keine DB-Mutation ausgefuehrt. Kein `db:migrate`, kein `apply-override`, kein Prod-Write.

## Findings

### P1 - Sector-Surface-Forms werden in 063 committed nicht resolved, obwohl sie haeufig sind

`scripts/seed-data/sectors.json:43` und `:47` seedet `scarus`/`helican` nur als Sectors. `resolveLocation()` liest aber nur `locations.json` plus `location-aliases.json` (`src/lib/resolver/index.ts:24-29`, `:40-42`, `:63-64`), und `location-aliases.json` hat in 063 nur Sabbat/Istvaan-Mappings (`scripts/seed-data/location-aliases.json:1-6`). Damit bleiben `Scarus Sector` 7x und `Helican Subsector` 4x unresolved, z.B. `manual-overrides-ssot-w40k-001.json:145`, `:202`, `:229`, `:24`, `:111`, `:291`.

Fix: Entweder Sector-Surface-Forms als Location-Rows mit nullable coords anlegen (`scarus`, `helican`) oder explizite Location-Aliases auf solche Location-Rows setzen. Danach `test:resolver` um `Scarus Sector` und `Helican Subsector` erweitern.

### P1 - Faction-Alignment faellt still auf `neutral` zurueck

Neue imperiale Factions nutzen `alignment: "imperial"` in `scripts/seed-data/factions.json:180`, `:187`, `:215`, `:222`, `:229`, `:236`. Die DB-Enum heisst aber `imperium`, und `seed-resolver-extensions.ts` akzeptiert nur `imperium|chaos|xenos|neutral` (`:42-48`); `asAlignment()` gibt bei unbekanntem Wert still `neutral` zurueck (`:93-97`) und schreibt das in die DB (`:102-107`).

Fix: JSON auf `imperium` umstellen und Seeder laut failen lassen, wenn ein unbekanntes Alignment auftaucht. Als Migrationshilfe kann `imperial -> imperium` bewusst gemappt werden, aber nicht still zu `neutral`.

### P1 - Fresh-Seed ist in 063 nicht konsistent mit dem Resolver-Layer

Der committed `scripts/seed.ts` laedt kein `characters.json` (`scripts/seed.ts:190-195`), leitet Characters weiter aus `books.json` ab (`:306-318`) und ignoriert die neuen 65 canonical Characters. Ein Fresh-Seed plus `db:apply-override` kann dadurch `work_characters.character_id`-FKs reissen. Gleichzeitig ignoriert `seed.ts` das explizite `alignment`-Feld und inferiert nur aus direktem Parent/Tone (`:200-204`, `:250-254`), wodurch tiefere imperiale Unterfaktionen wie `tanith_first -> astra_militarum` ebenfalls neutral werden. Die Location-Typen/Mapping in `seed.ts:291-302` sind auch noch auf nicht-null `sector/gx/gy` modelliert, obwohl 0009 diese Werte nullable macht.

Fix: `seed.ts` muss `characters.json` direkt laden und seeden, Alignment normalisieren/validieren, nullable `sector/gx/gy` abbilden und Referenzen vor dem TRUNCATE validieren. Der uncommitted Worktree-Diff scheint genau in diese Richtung zu gehen, ist aber nicht Teil von 063.

### P1 - Character-Roles aus Overrides werden unveraendert in `work_characters` geschrieben

Das Schema kommentiert Character-Roles als `pov|appears|mentioned` (`src/db/schema.ts:367-368`). Die Overrides enthalten aber massenhaft `supporting` und `antagonist` auf der Character-Achse, z.B. `manual-overrides-ssot-w40k-001.json:28` und `manual-overrides-ssot-w40k-005.json:255`. Der committed Apply-Pfad priorisiert nur `pov|appears|mentioned` (`scripts/apply-override.ts:99-103`, `:413-419`) und schreibt anschliessend `c.role` unveraendert (`:735-742`). Audit-Zaehler ueber 001..005: Characters haben 279x `supporting`, 21x `antagonist`, aber nur 3x `appears` und 3x `mentioned`.

Fix: Vor DB-Insert normalisieren, z.B. `supporting|antagonist -> appears` oder bewusst ein erweitertes Character-Role-Vokabular definieren und Schema-Kommentar, Tests und UI darauf anpassen. Unerwartete Rollen sollten laut failen.

### P1 - Detail-Page ist an 0009-Migration-Timing gekoppelt

`/buch/[slug]` selectet jetzt `work_factions.raw_name`, `work_locations.raw_name` und `work_characters.raw_name` (`src/app/buch/[slug]/page.tsx:64-90`). Diese Spalten existieren erst nach `0009_lucky_pete_wisdom.sql:3-5`. Der 063-Report sagt aber, Migration und Re-Apply seien Maintainer-Trigger und noch ausstehend (`sessions/2026-05-12-063-impl-resolver-50-books.md:24`, `:31`, `:102`). Bis 0009 applied ist, brechen Buchseiten gegen eine alte DB mit "column raw_name does not exist".

Fix: 0009 muss vor jedem Deploy/Local-Smoke der neuen Page applied sein, oder die UI-Aenderung wird in eine Folge nach Migration-Apply verschoben. Falls das Vercel-`vercel-build`-Migrate-Pattern die Prod-Reihenfolge garantiert, sollte der Report das explizit sagen; lokal bleibt `npm run dev` vor Migration riskant.

### P2 - Der 5er-Detail-Smoke kann mit den committed Daten nicht komplett gruen sein

Statische Resolver-Simulation ueber `manual-overrides-ssot-w40k-001..005` ergibt fuer die 5 Acceptance-Slugs nach De-Dupe: `xenos` = 2 Locations, `nightbringer` = 1 Location, `first-and-only` = 6, `necropolis` = 4, `the-anarch` = 3. `xenos` verliert u.a. `Helican Subsector`; `nightbringer` hat im Override selbst nur `Pavonis` (`manual-overrides-ssot-w40k-005.json:247-248`). Das widerspricht der Arch-Acceptance "jede Achse >=3 Chips" (`sessions/2026-05-12-063-arch-resolver-50-books.md:46`, `:159`, `:195`).

Fix: Nach Sector-Fix die Smoke-Erwartung pro Buch realistisch neu berechnen. Fuer `nightbringer` entweder weitere belegte Locations in den Override aufnehmen oder die Acceptance mit Begruendung auf `>=1` fuer diese Achse senken.

### P2 - `rawName`-Semantik ist zwischen Schema-Kommentar und Write-Pfad widerspruechlich

Der Schema-Kommentar sagt `NULL = Direct-Match ohne Drift` (`src/db/schema.ts:346-350`). `apply-override` schreibt aber `rawName` fuer jede resolved Junction, auch Direct-Matches (`scripts/apply-override.ts:710-724`, `:735-742`). Das ist als Audit-Trail nicht falsch, aber der Kommentar und der UI-Tooltip-Helper beschreiben eine andere Semantik.

Fix: Entweder Kommentar auf "immer Original-Surface-Form" aendern oder im Resolver-Result `rawName=null` setzen, wenn `raw === canonical.name`.

### P2 - `seed-resolver-extensions` ist idempotent, aber validiert die JSON-Konsistenz nicht

Die idempotente Insert-Mechanik ist grundsaetzlich ok: jedes Insert filtert existing IDs und nutzt `onConflictDoNothing()` (`scripts/seed-resolver-extensions.ts:197-198` exemplarisch fuer Characters; analog Factions/Sectors/Locations). Was fehlt, ist ein loud Preflight fuer doppelte IDs/Namen, dangling parents/sectors/primaryFactionIds und Alias-Targets. Gerade der Alignment-Bug zeigt, dass "invalid -> neutral" zu leise ist.

Fix: Vor den Inserts alle JSONs plus Alias-Dateien laden, IDs/Namen/Targets validieren und erst danach schreiben. Bei Fehlern vor der ersten DB-Mutation abbrechen.

### P2 - Session-Status/Acceptance ist zu optimistisch

063-Arch steht auf `implemented` (`sessions/2026-05-12-063-arch-resolver-50-books.md:5`), 063-Impl auf `complete` (`sessions/2026-05-12-063-impl-resolver-50-books.md:5`), obwohl Re-Apply 001..005 und Detail-Smoke explizite Acceptance waren (`063-arch:194-195`) und im Impl-Report als ausstehend markiert sind (`063-impl:102`, `:104-106`). Ausserdem nennen die Frontmatter-Commitlisten nur `adee6ab..1fa30de`; der Range enthaelt aber auch `654a9c4` und `7eb09d8`.

Fix: Status/Report auf "partial / maintainer-trigger pending" korrigieren oder einen Folge-Report nach Migration+Seed+Re-Apply+Smoke schreiben, der die Acceptance wirklich schliesst und die Commitlisten vervollstaendigt.

## Coverage Notes

Statische Simulation gegen die committed 063-Resolver-Daten:

- Factions: 318/324 Occurrences resolved; 6 unresolved singleton Surface-Forms (`Cognitae`, `Slaanesh`, `Black Legion`, `Reclaimers`, `Skitarii`, `Volpone Bluebloods`).
- Locations: 117/148 resolved; 31 unresolved, davon `Scarus Sector` 7x und `Helican Subsector` 4x.
- Characters: 363/375 resolved; 12 unresolved singletons, wie vom Brief als Long-Tail akzeptiert.
- JSON-Referenzen: keine doppelten IDs/Namen und keine dangling Alias-Targets/FK-artigen JSON-Referenzen im committed Seed-Datensatz gefunden.

## Fix-Reihenfolge fuer Folge-Sessions

1. Kleiner Daten-/Resolver-Fix: `imperial -> imperium`, Sector-Surface-Forms als Locations/Aliases, Character-Role-Normalisierung, Resolver-Tests erweitern.
2. Re-Seed-Konsistenz fixen: `scripts/seed.ts` auf `characters.json`, nullable Locations, Alignment-Normalisierung und Reference-Validation bringen.
3. `seed-resolver-extensions` Preflight-Validation einbauen und einmal gegen eine nicht-Prod-Test-DB smoken.
4. Erst dann Maintainer-Trigger: `db:migrate`, `db:seed-resolver-extensions`, Re-Apply `ssot-w40k-001..005`, SQL-Counts dokumentieren.
5. Detail-Page-Smoke mit realen Chip-Counts durchfuehren; `xenos` und `nightbringer` Acceptance entweder durch Daten korrigieren oder begruendet anpassen.
6. Session-Hygiene: 063-Status/Commitlisten nachziehen oder 064/065-Folge-Report als Closing-Report nutzen.

## Verification

Erster Lauf waehrend des Audits, bevor die spaeter sichtbaren uncommitted Fix-Kandidaten den Worktree weiter veraendert hatten:

- `npm.cmd run test:resolver` - pass, 43 passed / 0 failed.
- `npm.cmd run typecheck` - pass.
- `npm.cmd run lint` - pass mit 1 bekannter Warnung in `src/app/layout.tsx:44` (`@next/next/no-page-custom-font`).
- `npm.cmd run brain:lint -- --no-write` - pass, 0 blocking / 4 warnings.

Zweiter Lauf nach Report-Erstellung gegen den aktuellen dirty Worktree:

- `npm.cmd run test:resolver` - fail. 47 passed / 5 failed. Die neuen `normalizeCharacterRole`-Tests erwarten Strings, die aktuelle Funktion liefert aber ein Objekt `{ axis, raw, role, changed }`.
- `npm.cmd run typecheck` - fail. `scripts/test-resolver-data-integrity.ts:221` uebergibt ein `RoleNormalization<CharacterJunctionRole>` an eine Stelle, die `string` erwartet.
- `npm.cmd run lint` - pass mit derselben bekannten Font-Warnung in `src/app/layout.tsx:44`.
- `npm.cmd run brain:lint -- --no-write` - pass, 0 blocking / 4 warnings.

Alle Kommandos liefen ohne DB-Mutation.
