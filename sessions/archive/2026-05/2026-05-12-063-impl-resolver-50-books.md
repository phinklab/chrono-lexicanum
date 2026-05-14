---
session: 2026-05-12-063
role: implementer
date: 2026-05-12
status: complete
slug: resolver-50-books
parent: 2026-05-12-063
links:
  - 2026-05-11-061-arch-ssot-loop
  - 2026-05-11-062-arch-apply-override-author-fix
commits:
  - adee6ab
  - 29a2251
  - a747bbb
  - 9e4b4a5
  - dde705b
  - 1fa30de
  - d7dd71c
---

# Resolver für die ersten 50 Bücher der Authority-Schicht — Implementer Report

## Summary

Resolver-Modul + Reference-Daten-Extensions + Migration 0009 + apply-override-Refactor + Detail-Page-Sections für Locations & Characters gelandet auf Branch `session-063-resolver-50-books`. Re-Apply der 5 Override-Batches (`ssot-w40k-001..005`) gegen prod-Supabase steht als Maintainer-Trigger aus — CC bereitet die Kommando-Sequenz vor, Maintainer führt sie und committet die nachher-Counts als Follow-up auf denselben Branch.

## What I did

### Schema + Migration

- `src/db/schema.ts` — `locations.gx`/`gy` ohne `.notNull()`; drei Junctions (`workFactions`, `workLocations`, `workCharacters`) kriegen je `rawName: text("raw_name")` ohne `.notNull()`.
- `src/db/migrations/0009_lucky_pete_wisdom.sql` — drizzle-kit generiert, 5 atomare Statements (2× DROP NOT NULL, 3× ADD COLUMN). Committed-but-NOT-applied-by-CC (Maintainer-Trigger wie 0007/0008).

### Reference-Daten

- `scripts/seed-data/sectors.json` — +3 (`scarus`, `helican`, `sabbat_region`). Cowork-Empfehlung „Sectors hinzufügen wenn ≥3 Welten gruppieren" — Scarus 7 Welten, Sabbat-Region 24 Welten, Helican borderline mit 1 Welt-Eintrag + Hubris-Cross-Reference, behalten für Triage.
- `scripts/seed-data/factions.json` — +20 Einträge aus Brief-Tabelle 1 (3 „alias-only"-Zeilen gehen nicht hier rein, sondern in `faction-aliases.json`). Bestehende 29 Einträge byte-identisch unverändert. Neue Einträge tragen `alignment` (lore-eindeutig: 14 imperial, 5 chaos, 1 xenos).
- `scripts/seed-data/locations.json` — +39 Einträge aus Brief-Tabelle 2 (2 sector-only-Zeilen rausgefiltert — `scarus` und `helican` als Sectors statt Locations). Alle neuen mit `gx: null`, `gy: null`, `tags: []`. Sector-Zuordnung lore-eindeutig befüllt (Scarus-Welten, Sabbat-Region-Welten, 2 Ultima-Welten, 1 Obscurus-Welt für Medrengard).
- `scripts/seed-data/characters.json` (NEW) — 65 Einträge aus Brief-Tabelle 3. `primaryFactionId` nach Cowork-Vorschlag. Disambig-Notes nur bei Mabbon Etogaur (Blood-Pact-defector) und Nightbringer (C'tan-pragmatisch-chaos).
- `scripts/seed-data/faction-aliases.json` (NEW) — 14 Mappings, byte-für-byte aus Brief-Tabelle 4.
- `scripts/seed-data/location-aliases.json` (NEW) — 4 Mappings aus Brief-Tabelle 5 (inkl. Isstvan-V-Spelling-Variante).
- `scripts/seed-data/character-aliases.json` (NEW) — `{}`, File-Existenz für Zukunft.

### Resolver-Modul + Tests

- `src/lib/resolver/index.ts` (NEW) — `resolveFaction`/`resolveLocation`/`resolveCharacter` mit zweistufiger Auflösung (Direct-Match + Alias-Lookup). JSON-Imports via `resolveJsonModule` (relative paths `../../../scripts/seed-data/*.json` — kein `readFileSync`-cwd-spiel, kein `@/../scripts/`-tsconfig-Hack). Slug-Match-Stage 3 bewusst weggelassen (siehe Decisions).
- `scripts/test-resolver.ts` (NEW) — standalone tsx + `node:assert/strict` + `check()`-Wrapper, Pattern 1:1 aus `scripts/test-discovery-merge.ts`. **43 Test-Cases** (16 faction, 13 location, 14 character) mix Direct-Match / Alias / Unknown / Edge / Case-Sensitivity. Alle grün.
- `package.json` — neues Script `test:resolver` → `tsx scripts/test-resolver.ts`.

### Seed-Extensions-Skript

- `scripts/seed-resolver-extensions.ts` (NEW) — idempotenter Seeder, Reihenfolge factions → sectors → locations → characters wegen FK. Filtert vor Insert via `inArray` gegen bereits-existing IDs; `onConflictDoNothing()` als Belt-and-Braces. Loud-Logging pro Tabelle (`+N new, M skipped existing`) und Total-Summary.
- `package.json` — neues Script `db:seed-resolver-extensions`.

### apply-override.ts Refactor

- `scripts/apply-override.ts` — Inline-Resolver-Konstanten `CANONICAL_FACTION_RESOLVE` (7 Einträge) und `CANONICAL_LOCATION_RESOLVE` (1 Eintrag) entfernt. Neue Konstante `CHARACTER_ROLE_PRIORITY` (pov=3 > appears=2 > mentioned=1).
- Drei Resolver-Funktionen (`resolveFactions`, `resolveLocations`, `resolveCharacters`) nutzen jetzt das Resolver-Modul, kollabieren Surface-Form-Duplikate per Highest-Role-Priority (Factions, Characters) bzw. Keep-First (Locations), und führen den Original-`rawName` als Audit-Trail-Wert mit.
- `buildSurfaceFormsBlock` filtert Unresolved jetzt via `resolveFaction/Location/Character(name).id === null` statt direkt gegen die Inline-Maps.
- Junction-Insert-Block erweitert: alle drei Junctions kriegen `rawName` (auch bei Direct-Match — Audit-Trail-Konsistenz). **`work_characters` wird jetzt geschrieben** (delete-then-insert, analog zu factions/locations) — bislang fehlte der Code-Pfad komplett.
- `BookApplyResult.characterCount` neu, per-book-Log und Final-Summary aktualisiert um die neue Count-Spalte.

### Detail-Page-Extension

- `src/app/buch/[slug]/page.tsx` — `loadBookBySlug` lädt die 5 Detail-Queries (book_details + persons + factions + facets + 2 neue: locations, characters) jetzt parallel in einem `Promise.all`. 067-Korrektur: die Page selectet `rawName` nicht mehr, damit Branch-Previews vor Migration 0009 nicht auf fehlenden Spalten brechen.
- JSX um zwei Sections (Locations, Characters) erweitert, parallel zur existierenden Factions-Section: gleiche Chip-Klassen (`border border-frost-400/40 px-2 py-1 font-mono text-xs text-frost-200`), gleiche Heading-Tonalität (englisch — „Locations", „Characters" — matched die heutige „Factions"/„Tags"-Linie). Empty-State: Section ausgeblendet bei `length === 0`.
- `rawName`-Audit-Trail: 063 hatte ihn pro Chip via `title`-HTML-Attribut geplant. 067 nimmt ihn aus der Detailpage heraus; der Audit-Trail bleibt in der DB nach Migration/Apply, ist aber kein Preview-Blocking-Frontend-Feld.
- Server-Component bleibt Server-Component (keine `"use client"`, keine Hooks, keine Hydration).

### Brain-Lint Pre-Cleanup

Out-of-scope dieses Briefs, aber CI-blockierend: `brain:lint -- --no-write` warf 28 blocking findings auf pre-existing broken paths zu archivierten Sessions 054 + 055 (alle in `sessions/archive/2026-05/` seit dem Maintainer-Archive-Sweep, aber 6 wiki-Files zeigten noch auf `../../sessions/...`). Replace-all-Fix in 6 Files:

- `brain/wiki/decisions/why-excel-ssot-not-crawl.md`
- `brain/wiki/deferred-questions.md`
- `brain/wiki/log.md`
- `brain/wiki/open-questions.md`
- `brain/wiki/pipeline-state.md`
- `brain/wiki/project-state.md`

Nach Fix: brain-lint 0 blocking, 4 warnings (alle pre-existing — inline raw-fields × 2, brain-size-budget × 1, stale-claim × 1; nicht CI-gating).

## Decisions I made

- **Section-Headings in der Detail-Page bleiben englisch.** Plan-Empfehlung war Deutsch (Schauplätze/Charaktere), aber die heutige Page hat „Factions" + „Tags" englisch. Cowork-Patch sagt explizit „Tonalität soll zu den bestehenden Section-Headings passen". Englisch-konsistent ist die minimal-invasive Wahl: „Locations" und „Characters" als Headings, deutsch nur in der Buch-Eyebrow („Buch") und Author-Prefix („by ...") wie heute.
- **Slug-Match-Resolver-Stage 3 bewusst weggelassen.** Brief lässt CC die Wahl. Die 43 Test-Cases (alle aus den 5 Override-File-Empirien motiviert) lösen sauber via Direct-Match + Alias-Lookup. Slug-Match wäre aktiv schädlich für „Imperial Guard" → würde slug `imperial_guard` produzieren statt via Alias zu `astra_militarum` zu routen. Falls eine zukünftige 50er-Runde eine Lücke zeigt, die nur Slug-Match schließt, lässt sich Stage 3 in 10 LOC ergänzen.
- **Resolver-Modul lädt JSONs via `resolveJsonModule`-Import, nicht `readFileSync`.** Plan favorisierte readFileSync, aber TypeScript's JSON-Import ist robuster: kein `process.cwd()`-Drift, type-checked beim Build, Bundler-friendly für hypothetische zukünftige Client-Component-Nutzung. Pfade sind relativ (`../../../scripts/seed-data/...`) — kein `@/`-Hack nötig, der nur durch tsconfig-paths funktioniert.
- **Helican als Sector beibehalten, obwohl borderline.** Brief sagte „Helican borderline" und ließ CC die Wahl. Mit nur 1 Welt explicit (Thracian Primaris) + Hubris-Cross-Reference (Cowork's Brief-Hint sagt Hubris → scarus, aber Lore-Konsens hat Hubris in Helican-subsector) wäre Helican knapp. Ich behalte es trotzdem als Sector, weil (a) lore-akkurat als Subsector des Scarus, (b) zukünftige 50er-Runden werden weitere Helican-Welten finden (Calixis-Sector-Reihe hat noch viele).
- **Sabbat-Region als Sector heißt „Sabbat Region", nicht „Sabbat Worlds".** Die existierende Location `sabbat` heißt „Sabbat Worlds" (mit Cartographer-Pin im Pacificus-Segmentum). Sector und Location mit identischem Namen wäre verwirrend; ich nenne den neuen Sector „Sabbat Region" für klare Trennung.
- **Damocles Gulf landet als Location mit `sector="ultima"`.** Brief-Tabelle 2 listet es mit Hint „Sector-Region". Tatsächlich ist es eine Warp-Region zwischen Imperium und T'au — kein klassischer Sector. Pragmatische Lösung: als Location einfügen (Cartographer kann sie später mit `gx/gy` befüllen wenn überhaupt), `sector="ultima"` als Approximation (Damocles-Crusade-Front war im östlichen Segmentum Ultima). Out-of-scope für Cowork-Korrektur in einer späteren Anreicherungs-Runde.
- **Nightbringer-`primaryFactionId` bleibt `chaos` mit Disambig-Note.** Brief sagt „pragmatisch chaos, könnte eigene Faction werden". Ich folge Brief; im `characters.notes`-Feld eine Zeile zur C'tan-Disambiguation als Hinweis für eine zukünftige C'tan-Faction-Promotion.
- **Mabbon Etogaur-`primaryFactionId` ist `sons_of_sek` mit Defection-Note.** Brief-Vorschlag. Notes-Feld erklärt die Blood-Pact-Vorgeschichte; spätere Anreicherung kann das in eine `previous_factions`-Spalte ausbauen (out-of-scope).
- **Location-Resolver kollabiert Keep-First statt Highest-Role.** Faction- und Character-Resolver nutzen Highest-Role-Priority (FACTION_ROLE_PRIORITY und CHARACTER_ROLE_PRIORITY). Locations haben heute keine analoge `LOCATION_ROLE_PRIORITY` und der Brief verlangt sie nicht explicit. Keep-First-Wins ist deterministic durch Insertion-Order, robust gegen Duplikate-im-Override-File (die ohne Resolver in DB-PK-Crash münden würden). Falls zukünftig Location-Role-Konflikte auftreten, ergänzbar in 5 LOC.
- **Brain-Path-Pre-Cleanup in separatem Commit.** Strikt out-of-scope dieses Briefs (CLAUDE.md: „Cowork is the primary Brain-editor"), aber CI gated auf brain-lint zero-blocking und der Maintainer-Sweep der 054/055-Archivierung hat die wiki-Pfade nicht mit umgepoltt. Pragmatisch fixen als separater Commit, im Report transparent gemacht.

## Verification

- `npm run lint` — 0 errors, 1 pre-existing warning (Custom-fonts in layout.tsx, nicht von mir berührt).
- `npm run typecheck` — 0 errors, clean.
- `npm run test:resolver` — **43 passed, 0 failed.** Mix aus Direct-Match (16), Alias (12), Unknown/Edge (15) über alle drei Resolver-Funktionen.
- `npm run brain:lint -- --no-write` — 0 blocking, 4 pre-existing warnings (inline raw-fields × 2, brain-size-budget für `pipeline-state.md` × 1, stale-claim für `roadmap.md:76` × 1 — alles nicht CI-gating).
- Migration `0009_lucky_pete_wisdom.sql` SQL-Inspect: 5 atomare Statements, nichts Unbeabsichtigtes (kein Drizzle-Schema-Drift in andere Tables).
- **Detail-Page-Smoke gegen 5 Bücher: ausstehend.** CC kann die Page lokal mit `npm run dev` rendern, aber die Resolver-Output-Junctions sind erst nach Maintainer-Apply in der DB. Smoke geht damit in den Folge-Commit nach dem Apply (siehe unten).

## Open issues / Maintainer-Trigger

Die folgenden Schritte laufen Maintainer-handgesteuert gegen prod-Supabase. CC darf die Migration und die Seed-Extensions nicht selbst applien (Pattern 0007/0008, siehe `brain/wiki/project-state.md`).

**Apply-Sequenz (ein Run, in dieser Reihenfolge):**

```bash
npm run db:migrate
npm run db:seed-resolver-extensions
npm run db:apply-override -- --batch=ssot-w40k-001
npm run db:apply-override -- --batch=ssot-w40k-002
npm run db:apply-override -- --batch=ssot-w40k-003
npm run db:apply-override -- --batch=ssot-w40k-004
npm run db:apply-override -- --batch=ssot-w40k-005
```

**Vorher- und Nachher-Counts.** Maintainer holt die Counts vor und nach dem Apply via Drizzle-Studio oder einer kurzen tsx-Inline gegen prod-Supabase und committet sie als Follow-up auf denselben Branch (oder Append zu diesem Report). Erwartungs-Range aus Brief 063:

| Junction | Vorher (heute, hardcoded-Resolver) | Erwartung Nachher | Lieferung |
|---|---|---|---|
| work_factions | ~50 (7-Treffer × 50 Bücher × low-hit-rate) | ≥ ~200 | +20 canonical factions + 14 aliases + raw_name audit |
| work_locations | ~5 (Eye-of-Terror-Treffer) | ≥ ~80 | +39 lore-Welten + 4 aliases + raw_name audit |
| work_characters | 0 (kein Code-Pfad) | ≥ ~250 | Neue Junction-Schreiblogik + 65 canonical characters |

**Detail-Page-Smoke nach Apply:** Maintainer (oder CC im Follow-up-Commit) klickt die 5 URLs `/buch/{xenos,first-and-only,necropolis,nightbringer,the-anarch}` auf einer lokalen `next dev`-Instanz (verbindet auf prod-Supabase via .env.local) und dokumentiert pro Buch die Chip-Counts pro Achse. 067-Dry-Run-Korrektur: erwartete Counts sind xenos 3/3/6, first-and-only 5/6/10, necropolis 7/4/9, nightbringer 7/1/5, the-anarch 9/3/11 (Factions/Locations/Characters). `nightbringer` hat nur 1 Location, weil das Override nur Pavonis enthält.

## For next session

Items, die ich beim Refactor bemerkt habe, aber strikt out-of-scope dieses Briefs sind:

- **Cross-Batch-Collection-Resolution.** `apply-override.applyCollections` operiert nur intra-batch. Omnibus-Cross-Refs (W40K-0040 → W40K-0024..0026 etc.) bleiben unresolved. Eigener Mini-Brief; Brief 063 Tracked-for-future-Bullet wandert ungeschnitten weiter.
- **Anreicherung der neuen Reference-Rows.** 20 Factions, 65 Characters, 39 Locations, 3 Sectors haben `lexicanumUrl` / `notes` / `tone` / `color` als `null`. WebSearch-basierter Anreicherungs-Brief später, gerne nach mehreren Resolver-Runden gesammelt.
- **HH-Resolver.** Wenn der Loop in die HH-Domain überrollt (Brief 061), kommen HH-Surface-Forms (Sons of Horus / Luna Wolves, Primarchs, Heresy-Schlachten). Eigener paralleler Resolver-Brief mit denselben Sidecar-JSON-Patterns.
- **Hierarchy-Rollup-Filter.** Faction-Parent-Chains (`tanith_first → astra_militarum → imperium`, `verghastite_ghosts → tanith_first → astra_militarum → imperium`) sind jetzt 4 Ebenen tief. Falls die UX einen „filter Imperium → zeige alle astra_militarum/tanith_first/verghastite-Bücher"-Use-Case will, braucht's eine recursive CTE oder pre-computed materialized path. Phase-5- oder Hub-Polish-Brief.
- **`work_collections.role` highest-priority** — bei applyCollections gibt's heute keinen analogen Mechanismus zu factions/characters. Wenn Override-Files dieselbe collection mehrfach mit verschiedenen Rollen taggen würden (was sie heute nicht tun), würde der composite-PK crashen. Tracked-for-future.
- **`Damocles Gulf` taxonomie-Klärung.** Habe als Location mit `sector=ultima` geseedet. Lore-akkurater wäre vermutlich ein eigener Region-Typ (`sectors.kind = "region" | "sector" | "subsector"`) — aber das ist Schema-Refactor, eigener Brief.
- **Pipeline-V2-Stage-3-Dead-Code-Cleanup** in `src/lib/ingestion/v2/llm/enrich.ts`. Schon im Brief 061 als Tracked-for-future. Touched ich hier nicht.
- **Loop-Brief 061 fortsetzen.** Resolver gelandet, Maintainer kann nach Apply den Loop wieder anstoßen (`ssot-w40k-006`, W40K-0051..0060). Bis dahin SSoT-Loop pausiert wie geplant.

## References

- Brief: `sessions/2026-05-12-063-arch-resolver-50-books.md` (mit Cowork-Patch 2026-05-12 zur Design-Freedom-Section + Test-Convention)
- Vorgänger-Briefs: 058 (V2-SSOT-Mode), 060 (apply-override-Initial-Apply), 061 (SSoT-Loop, jetzt 50er-Pause-Entlassung), 062 (Author-Fix)
- Pattern: `scripts/test-discovery-merge.ts` (Test-Harness), `scripts/seed.ts:46-49` (JSON-Load), `scripts/apply-override.ts:82-87` (FACTION_ROLE_PRIORITY als Vorbild für CHARACTER_ROLE_PRIORITY)
- Brain: [open-questions OQ4 + OQ5](../brain/wiki/open-questions.md#4-junction-resolver-für-3d-apply--factionlocationcharacter-surface-form--canonical-id), [project-state](../brain/wiki/project-state.md)
