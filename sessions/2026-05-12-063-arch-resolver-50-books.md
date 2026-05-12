---
session: 2026-05-12-063
role: architect
date: 2026-05-12
status: implemented
slug: resolver-50-books
parent: 2026-05-11-061
links:
  - 2026-05-11-058-arch-v2-ssot-mode-first-batch
  - 2026-05-11-060-arch-ssot-w40k-001-db-apply
  - 2026-05-11-061-arch-ssot-loop
  - 2026-05-11-062-arch-apply-override-author-fix
commits: []
---

# Resolver für die ersten 50 Bücher der Authority-Schicht

## Goal

Resolve die Faction-, Location- und Character-Surface-Forms aus den 50 bereits-applied Büchern (`ssot-w40k-001..005`) in proper Junction-Rows. Konkret: extrahiere die heute in `apply-override.ts` hartkodierte Resolver-Logik in vier Sidecar-JSONs + ein Resolver-Modul, erweitere die Reference-Tabellen (`factions`, `locations`, `characters`) um die belastbar-häufigen Surface-Forms (frequency ≥ 2), mache `locations.gx`/`gy` nullable (60 neue Lore-Welten haben keine sinnvollen Galaxy-Coords), und applied 001..005 neu, damit die Detail-Pages echte Faction/Location/Character-Chips rendern statt der heute fast-leeren Junction-Sets.

Adresse OQ4 (Junction-Resolver für Faction/Location/Character Surface-Form → Canonical-ID) und OQ5 (Unresolved-Queue-Strategie) aus `brain/wiki/open-questions.md`. Brief 061's SSoT-Loop ist parallel auf 50-Buch-Pause; die Apply-Sweep nach Resolver-Landing erlaubt es, ihn wieder anzustoßen.

## Design freedom — read before everything else

**Patch-Update 2026-05-12 (CC-Audit):** Dieser Brief berührt das UI. Die heutige Detail-Page `src/app/buch/[slug]/page.tsx` rendert nur Factions + Facets, nicht Locations und nicht Characters — Cowork's ursprüngliche Notiz „die Detail-Page rendert Junction-Chips schon" war für Factions korrekt, für Locations/Characters falsch. Damit die Resolver-Verifikation (Hand-Sichten der Junction-Output) machbar ist, muss die Page um zwei Sections erweitert werden. Diese Section gibt CC dafür Design-Freedom.

**Was CC entscheidet (Pixel/ms/oklch/Copy):**
- Section-Layout (Stack? Inline-Group? Grid? Section-Reihenfolge zueinander und zur Factions-Section?).
- Section-Heading-Copy (Deutsch? „Schauplätze" / „Charaktere"? Oder Englisch? Tonalität soll zu den bestehenden Section-Headings passen.).
- Chip-Shape, -Padding, -Gap, -Border-Radius, -Background — gerne abgeleitet aus dem bestehenden Faction-Chip-Pattern auf derselben Seite, oder bewusst differenziert wenn das die UX klarer macht.
- Empty-State-Behaviour: Section ausblenden wenn 0 Einträge, oder Section mit Empty-Copy zeigen — CC's Call.
- Truncation / „mehr anzeigen"-Toggle bei langen Listen (Characters >15? Locations >10?) — wenn CC findet das die Liste sonst die Page erschlägt.
- Role-Indication innerhalb der Chips: heutige Factions tragen `role` (primary/supporting/antagonist) und werden in der DB so geschrieben. Sichtbar machen ja/nein, wie (Farbe, Subscript, Tooltip), ist CC's Call.
- `raw_name` (Migration 0009): am Chip sichtbar als Tooltip auf-hover? Audit-Mode? Gar nicht? CC entscheidet — das ist primarily ein Cowork-Triage-Hilfsmittel, kein User-Feature, kann unsichtbar bleiben.
- Mobile-Behaviour der neuen Sections.

**Was Cowork festhält:**
- Auf jeder `/buch/<slug>`-Page gibt es nach dem Resolver-Landing **drei** Junction-Sections: Factions (existiert), Locations (neu), Characters (neu). Plus Facets (existiert).
- Auf den 5 Verifikations-Büchern (xenos, first-and-only, necropolis, nightbringer, the-anarch) zeigt jede Achse ≥3 Chips.
- Heutige Factions+Facets-Rendering darf nicht regressen.
- Server-Component bleibt Server-Component (keine Client-Hydration nötig wegen neuer Sections).

## Context

**Was heute steht.** 50 Bücher in der Authority-Schicht, applied via Brief 060 + Brief 062. Loop-Log unter `sessions/ssot-loop-log.md` dokumentiert die 5 Iterationen. Nächste Loop-Iteration (`ssot-w40k-006`) würde per Brief-061-Pre-Check loud-stoppen, weil kumulativ 50 % 50 == 0 ist — genau dieser Trigger.

**Aktueller Resolver in `scripts/apply-override.ts`.** Zwei Inline-Konstanten:
- `CANONICAL_FACTION_RESOLVE` — 7 Einträge (Inquisition, Ordo Xenos/Malleus/Hereticus → `inquisition`; Chaos → `chaos`; Adeptus Mechanicus → `mechanicus`; Necrons → `necrons`).
- `CANONICAL_LOCATION_RESOLVE` — 1 Eintrag (Eye of Terror → `eye_of_terror`).
- Characters: kein Resolver. `work_characters` bleibt leer.

Alles andere landet zwischen `---surfaceForms---`/`---/surfaceForms---` Delimitern im `book_details.notes`-Blob.

**Empirische Surface-Form-Verteilung (50 Bücher, 5 Override-JSONs aggregiert).**

| Achse | Distinct | Total Occurrences | Direct-Match heute | Unknown |
|---|---|---|---|---|
| Factions | 43 | 324 | 9 (20.9%) | 34 (79.1%) |
| Locations | 64 | 148 | 4 (6.3%) | 60 (93.8%) |
| Characters | 77 | 375 | 0 (0%) | 77 (100%) |

Direct-Match-Lücken meistens entweder Naming-Drift (Excel-Form vs. Canonical-name in `factions.json`: "Chaos" 44× vs. canonical `name: "Chaos Undivided"`; "Imperial Guard" 37× vs. canonical `name: "Astra Militarum"`; "Eldar" 5× vs. canonical `name: "Aeldari"`; "Tau Empire" 2× vs. canonical `name: "T'au Empire"`; "Adepta Sororitas" 1× vs. canonical `name: "Adepta Sororitas"` ✓ — der ist direct-match, andere brauchen Aliase) oder echte Canonical-Lücken (Tanith First-and-Only 23×, Blood Pact 17×, Sons of Sek 6×, Mortifactors 2×, …).

Vollständige Frequency-Tabellen mit Cowork-vorgeschlagenen Canonical-IDs siehe Notes.

**Schema-Stand relevant für Resolver.**
- `factions { id varchar(64) PK, name text, parentId varchar(64), alignment factionAlignment, tone text, glyph text }` — keine `aliases`-Spalte. Hierarchie über `parentId` (heute schon: 16 Imperium-Children, 2 Chaos-Children, 5 standalone-aliens).
- `locations { id varchar(64) PK, name, sectorId, gx int NOT NULL, gy int NOT NULL, capital bool, warp bool, lexicanumUrl, tags text[] }` — **`gx`/`gy` sind NOT NULL** wegen Cartographer (Phase 5). Das ist der Migration-Hebel für 0009.
- `characters { id varchar(64) PK, name text, primaryFactionId varchar(64), lexicanumUrl, notes }` — Schema existiert, Tabelle ist leer (kein Seed). Keine `aliases`-Spalte.
- Junctions `workFactions { workId, factionId, role }`, `workLocations { workId, locationId, role, atY }`, `workCharacters { workId, characterId, role }` — keine `rawName`-Spalte heute.

**Maintainer-Architektur-Entscheidungen aus Cowork-AskUserQuestion (2026-05-12, this session).**
- **Characters: Option C — Hybrid Top-N.** Charaktere mit frequency ≥ 2 werden geseedet (~65 Stück aus diesen 50 Büchern; rollt mit jedem zukünftigen 50er-Schritt weiter). Long-Tail (frequency = 1, 12 Charaktere in dieser Runde) bleibt in `book_details.notes`-Blob.
- **Factions: Option D — Cowork-curated Catalog-Extend + Alias-JSON.** Cowork enumeriert in den Notes welche Surface-Forms canonical werden, welche Aliase auf existierende IDs sind, und welche unter den Tisch fallen. CC committet die Edits an `factions.json` + ein neues `faction-aliases.json`. Kein autonomes Auto-Create, keine Staging-Tabelle.
- **Locations: Option A — gx/gy nullable + Lore-Welten ergänzen.** Migration macht `locations.gx`/`gy` NULLABLE; ~40 neue frequency≥2-Welten kriegen `null` Coords. Cartographer (Phase 5) wird dann `WHERE gx IS NOT NULL` filtern. Lore-Welten landen in `workLocations` ohne Cartographer-Pin.
- **Apply-Sweep: Option A — Re-apply 001..005 mit dem neuen Resolver.** Idempotenz via `apply-override.ts`-delete-then-insert ist schon da. Re-Run schreibt die 50 Bücher mit den neuen Junction-Sets neu; alte minimal-Junctions verschwinden, neue volle Junctions kommen rein.

## Constraints

### Migration 0009

- **Neue Drizzle-Migration `0009_resolver_layer.sql`** mit drei atomaren Schritten:
  - `ALTER TABLE locations ALTER COLUMN gx DROP NOT NULL;`
  - `ALTER TABLE locations ALTER COLUMN gy DROP NOT NULL;`
  - `ALTER TABLE work_factions ADD COLUMN raw_name text;`
  - `ALTER TABLE work_locations ADD COLUMN raw_name text;`
  - `ALTER TABLE work_characters ADD COLUMN raw_name text;`
- Drizzle-Schema in `src/db/schema.ts` entsprechend anpassen: `gx`/`gy` ohne `.notNull()`, drei Junctions kriegen `rawName: text("raw_name")` ohne `notNull` (NULL = aufgelöst per Canonical-Mapping ohne Surface-Form-Drift; non-NULL = der LLM-Surface-Form-String der zu dieser Junction-Row geführt hat).
- Migration committed-but-NOT-applied-by-CC (Maintainer-Trigger Pattern, wie 0008). CC schreibt die SQL, generiert den drizzle-kit-Output, committet. Apply läuft Maintainer-handgesteuert (`npm run db:migrate`).

### Reference-Daten-Extensions

- **`scripts/seed-data/factions.json`**: erweitern um die in den Notes aufgelisteten neuen IDs. Bestehende 29 Einträge bleiben unverändert. Konvention: `id` ist snake-case-slug; `parent` zeigt auf eine existierende ID (kein dangling-FK); `tone` und `glyph` darf CC füllen wenn ein offensichtliches Default zur Hand ist, sonst `null`. `alignment` default `neutral`, außer wenn lore-eindeutig (`imperial` / `chaos` / `xenos`).
- **`scripts/seed-data/locations.json`**: erweitern um die in den Notes aufgelisteten neuen IDs. Neue Einträge tragen `gx: null`, `gy: null`, `sector: null` (oder existierender Sector-Slug wenn lore-eindeutig). `tags` array darf leer sein. **Wichtig:** die heutigen 28 Einträge mit ihren `gx`/`gy`-Werten bleiben unverändert — Cartographer-Phase-5-Welten bleiben Pin-fähig.
- **`scripts/seed-data/characters.json`** (NEW FILE): array of `{ id, name, primaryFactionId, lexicanumUrl, notes }`. CC seedet die Notes-aufgelistete Frequency-≥-2-Liste. `primaryFactionId` darf `null` sein wenn Lore-mehrdeutig (z.B. Mabbon Etogaur — Blood Pact ehemalig, Sons of Sek jetzt, "Etogaur" ist ein Rang nicht eine Faction — pragmatisch `blood_pact` setzen mit `notes` zur Disambiguation). `lexicanumUrl` und `notes` dürfen leer sein in dieser Runde; nicht jetzt anreichern.

### Alias-JSONs

- **`scripts/seed-data/faction-aliases.json`** (NEW FILE): JSON-Objekt `{ "<Surface-Form>": "<canonicalId>" }`. Konvention für Wahl der canonicalId: gegen die `factions.id`-Spalte. Beispiel-Mappings siehe Notes. Idempotent gepflegt: wenn dasselbe canonical-ID-Target schon im `name`-Feld einer existierenden Faction steht und damit Direct-Match greift, KEIN redundantes Alias-Mapping schreiben (Direct-Match-Pfad hat Priorität im Resolver).
- **`scripts/seed-data/location-aliases.json`** (NEW FILE): analog für Locations. Beispiel: `"Sabbat Worlds" → "sabbat"` (canonical-name in `locations.json` ist "Sabbat Worlds", `id` ist `sabbat`).
- **`scripts/seed-data/character-aliases.json`** (NEW FILE, aber wahrscheinlich klein): analog für Charaktere. Reserviert für Fälle wie Rangbezeichnungen ("Lord General Lugo" → `lugo` falls CC entscheidet, dass der Rang nicht zum ID gehört) oder lore-bekannte Namensvarianten. CC darf in dieser Runde leer-Default ablegen wenn keine Alias-Notwendigkeit auffällt; das File wird zukünftig befüllt.

### Resolver-Modul

- **Neuer Pfad `src/lib/resolver/`** mit mindestens drei Funktionen:
  - `resolveFaction(name: string): { id: string; raw: string } | { id: null; raw: string }`
  - `resolveLocation(name: string): { id: string; raw: string } | { id: null; raw: string }`
  - `resolveCharacter(name: string): { id: string; raw: string } | { id: null; raw: string }`
- Auflösungs-Reihenfolge je Funktion:
  1. **Direct-Match** gegen `<entity>.name`-Spalte aus DB (case-sensitive, exakt). CC darf für Performance auch gegen den importierten `seed-data/<entity>.json` matchen — Inhalt ist äquivalent zur DB nach `seed-resolver-extensions` (siehe unten).
  2. **Alias-Lookup** gegen `<entity>-aliases.json`. Bei Treffer: return `{ id: aliasedId, raw: name }`.
  3. **Slug-Match**: slugify(name) gegen `<entity>.id`. (Optional — viele Resolutions reichen schon über 1+2; nimm die einfachste Form, die die Empirie aus den 50 Büchern auflöst.)
  4. Kein Treffer: return `{ id: null, raw: name }` — Caller entscheidet was mit `raw` passiert (heute: in `book_details.notes`-Blob schreiben).
- **Tests.** Konvention im Repo ist standalone-tsx-Skripte mit `node:assert/strict` + eigenem `check()`-Wrapper, siehe `scripts/test-discovery-merge.ts` (Aufruf via `npm run test:discovery-merge`). CC legt analog `scripts/test-resolver.ts` an + neues package.json-Script `test:resolver`. **Kein vitest, kein neues Test-Framework** — der frühere Brief-Hinweis auf „existierender vitest-Setup" war Cowork-Fehlannahme (es existiert keiner). Mindestens 10 Test-Cases pro Resolver-Funktion, mix aus Direct-Match / Alias / Unknown.
- Resolver-Modul lädt seine Daten beim Modul-Init aus den JSON-Files (synchron via `readFileSync`; das Modul ist nur in Build-time/Node.js-Kontexten genutzt, nicht im Browser).

### `seed-resolver-extensions.ts` (NEW SCRIPT)

- Idempotenter Seed-Extension-Skript unter `scripts/seed-resolver-extensions.ts`. Ruft `INSERT … ON CONFLICT DO NOTHING` für die neuen Faction/Location/Character-Rows. Berührt NICHT die existierenden Rows (kein UPDATE, kein DELETE).
- CLI: `npm run db:seed-resolver-extensions` (neues package.json-Script). Idempotent; mehrfach ausführbar.
- Reihenfolge der Inserts: (a) Factions zuerst (Locations.sector und Characters.primaryFactionId können auf neue Factions FK'en) (b) dann Sectors-Updates falls nötig (c) Locations (d) Characters.
- Loud-Logging: pro Schritt "+ N rows", am Ende Summary.
- Maintainer-Trigger nach Migration-Apply. CC schreibt das Script, lässt es lokal gegen prod-Supabase aber NICHT laufen (Cowork/CC dürfen prod-DB nicht von Hand mutieren — Pattern wie 0008-Apply).

### Detail-Page-Extension (`src/app/buch/[slug]/page.tsx`)

- Heutige `loadBookBySlug`-Query um zwei zusätzliche Joins ergänzen: `workLocations` × `locations` und `workCharacters` × `characters`. Beide werden in dieser Runde immer geladen (kein Lazy-Load, kein Suspense-Boundary nötig — Server-Component, ein extra Roundtrip ist akzeptabel).
- JSX um zwei Sections erweitern parallel zum existierenden Faction-Section-Pattern. Konkrete Form ist Design-Freedom (siehe oben).
- `raw_name` aus den Junction-Rows ist im Server-Query verfügbar (Migration 0009 fügt die Spalte hinzu). Ob CC sie ans UI durchreicht ist Design-Freedom; falls ja, als optionaler `title`-Attribute auf dem Chip o.ä. — User-sichtbar oder nicht.
- Keine neuen Routen, keine neuen API-Endpoints, keine Client-State-Erweiterung.

### `apply-override.ts` Refactor

- Inline-Konstanten `CANONICAL_FACTION_RESOLVE` + `CANONICAL_LOCATION_RESOLVE` entfernen.
- Resolver-Modul stattdessen nutzen: `resolveFaction`, `resolveLocation`, `resolveCharacter`.
- Junction-Insert-Logik erweitern: `rawName` befüllen (gleich der eingespeisten `OverrideEntity.name`-Surface-Form). Auch bei Direct-Match wird `rawName` befüllt — das ist der Audit-Trail "Buch sagte X, resolved wurde Y".
- **Characters-Junction wird jetzt geschrieben.** Heute fehlt die ganze `workCharacters`-Schreib-Logik in `applyBook`. CC ergänzt sie analog zu `workFactions` und `workLocations`: delete-then-insert per workId, Highest-Role-Priority für composite-PK-Kollisionen (Role-Reihenfolge: `pov` > `appears` > `mentioned`).
- Unresolved Surface-Forms (kein canonical-ID-Match nach allen 4 Stufen): bleiben weiterhin im `book_details.notes`-Blob zwischen den `---surfaceForms---`-Delimitern. Frequency=1-Long-Tail aus dieser Runde (12 Charaktere, kleinere Anzahl Locations/Factions) landet damit dort.

### Re-Apply 001..005

- Nach `db:migrate` + `db:seed-resolver-extensions` läuft CC: `npm run db:apply-override -- --batch=ssot-w40k-001` durch `005`, in der Reihenfolge.
- `apply-override.ts` ist delete-then-insert per Junction — Re-Run produziert KEINE Duplikate, sondern wischt + schreibt die volle neue Resolver-Output frisch.
- CC sammelt vorher/nachher SQL-Counts: `select count(*) from work_factions; select count(*) from work_locations; select count(*) from work_characters;` — auf einer Test-DB falls vorhanden, sonst die prod-Counts vor + nach. Numbers landen im Impl-Report.

### Verify

- `npm run lint` grün.
- `npm run typecheck` grün.
- `npm run brain:lint -- --no-write` grün.
- Resolver-Modul-Tests grün (existierender vitest-Setup nutzen — kein neues Test-Framework hinzufügen).
- **Detail-Page-Smoke gegen ein 5er-Sample (manuelle Verifikation):** `/buch/xenos`, `/buch/first-and-only`, `/buch/necropolis`, `/buch/nightbringer`, `/buch/the-anarch`. Erwartung: jede Seite zeigt jetzt Faction/Location/Character-Chips mit ≥3 Einträgen je Achse (heute meist 0–1).
- SQL-Counts vor/nach Re-Apply im Impl-Report. Erwartung: work_factions ≥ ~200, work_locations ≥ ~80, work_characters ≥ ~250 nach Re-Apply (vorher heute praktisch nur die hardcoded-Resolver-Treffer).

## Out of scope

- **Loop-Brief 061 fortsetzen.** Brief 061 bleibt auf 50er-Pause. Nach Resolver-Landing + Apply-Sweep darf Maintainer den Loop wieder anstoßen (`ssot-w40k-006`); das geschieht außerhalb dieses Briefs.
- **Hierarchy-Rollup-Query** (parentId-recursive CTE, „Filter Imperium surface-t auch ultramarines-getaggte Bücher"). UX-Frage, Detail-Page-Frage. Phase-5- oder Hub-Polish-Brief.
- **`unresolved_entities`-Staging-Tabelle.** Option D macht sie obsolet (Cowork tritt direkt im Brief als Triage auf). Bleibt in `deferred-questions.md` archiviert für den Fall, dass autonomer Pipeline-Crawl wieder live geht.
- **Cartographer-Coords für die ~40 neuen Lore-Welten.** Phase 5. Diese Runde: `gx`/`gy` bleiben `null`, Cartographer filtert `WHERE gx IS NOT NULL`.
- **lexicanumUrl + notes für die neuen Characters/Locations/Factions.** Eigenes Brief später (Anreicherung). Diese Runde: leer / null lassen.
- **Faceten-Dimension `legion`** und andere OQ2-Vokabular-Erweiterungen. Eigenes Brief.
- **Detail-Page-Strukturänderungen außerhalb der zwei neuen Sections.** Patch-Update: Locations- und Characters-Sections SIND in diesem Brief drin (siehe Design-Freedom + Constraints). Out-of-scope sind: Re-Skin der existierenden Factions-Section, Sidebar/Layout-Refactor der ganzen Page, neue Routen (`/buch/<slug>/related`, `/buch/<slug>/excerpts`), Map-Embed, "Auch enthalten in"-Section (eigenes Mini-Brief, post-Cross-Batch-Collection-Resolution).
- **Pipeline-V2-Stage-3-Dead-Code-Cleanup** in `src/lib/ingestion/v2/llm/enrich.ts`. Eigenes Aufräum-Brief, läuft, wenn der Loop ein paar Iterationen stabil läuft (per Brief 061 Tracked-for-future).
- **Submissions-Flow** für User-Beiträge zu Factions/Locations/Characters. Phase-7-Community-Brief.
- **`work_factions.role` highest-priority-Resolver-Logik** für Aliase, die auf dieselbe canonical-ID kollidieren. Heutige `FACTION_ROLE_PRIORITY`-Logik in `apply-override.ts` bleibt unverändert; sie operiert nach dem Resolver-Lookup und ist orthogonal.
- **Hardcover-Rating-Promotion + OL-Fallback** (OQ6). Eigener Brief.
- **HH-Domain**. Die Resolver-Notes-Listen sind W40K-spezifisch (HH-Surface-Forms wie "Sons of Horus", "Luna Wolves", "Word Bearers", "Magnus the Red", "Horus Lupercal" sind nicht in den Listen, weil die Authority-Schicht heute reines W40K ist). HH-Surface-Form-Listen kommen in einem zukünftigen Resolver-Brief, wenn der Loop in die HH-Domain überrollt. Die existierenden HH-relevanten Factions (`sons_of_horus`, `night_lords`, `thousand_sons`, `world_eaters`, `word_bearers`, `alpha_legion`) bleiben unverändert in `factions.json`.

## Acceptance

The session is done when:

- [ ] **Migration 0009 generiert und committed** (`drizzle-kit generate`). SQL enthält `ALTER TABLE locations` (gx/gy DROP NOT NULL) + `ALTER TABLE work_factions/work_locations/work_characters ADD COLUMN raw_name text`.
- [ ] **`src/db/schema.ts`** entsprechend angepasst: Locations gx/gy ohne `.notNull()`, drei Junctions kriegen `rawName: text("raw_name")`.
- [ ] **`scripts/seed-data/factions.json`** erweitert um die Notes-Liste neuer Factions (siehe Tabelle). Bestehende Einträge unverändert.
- [ ] **`scripts/seed-data/locations.json`** erweitert um die Notes-Liste neuer Lore-Welten. Neue Einträge tragen `gx: null`, `gy: null`. Bestehende 28 Einträge unverändert.
- [ ] **`scripts/seed-data/characters.json`** angelegt mit der Notes-Liste frequency-≥-2-Charaktere (~65 Einträge).
- [ ] **`scripts/seed-data/faction-aliases.json`** angelegt. Mindestens die in Notes Tabelle 4 aufgeführten Aliase.
- [ ] **`scripts/seed-data/location-aliases.json`** angelegt. Mindestens die in Notes Tabelle 5 aufgeführten Aliase.
- [ ] **`scripts/seed-data/character-aliases.json`** angelegt (darf in dieser Runde nur `{}` enthalten — Existenz reicht für zukünftige Erweiterungen).
- [ ] **`src/lib/resolver/`** angelegt: drei Funktionen exportiert (resolveFaction, resolveLocation, resolveCharacter), liest die fünf JSONs (3 Reference + 2 Aliase + plus characters/character-aliases falls separat strukturiert). Single-Source-of-Truth-Modul.
- [ ] **`scripts/test-resolver.ts`** angelegt (standalone tsx + `node:assert/strict`, Pattern aus `scripts/test-discovery-merge.ts`), neues package.json-Script `test:resolver`. Mindestens 10 Test-Cases pro Resolver-Funktion, mix Direct-Match / Alias / Unknown. **Kein vitest.**
- [ ] **`src/app/buch/[slug]/page.tsx` extended:** `loadBookBySlug` zieht jetzt zusätzlich `workLocations`+`locations` und `workCharacters`+`characters`. JSX bekommt zwei neue Sections (Locations, Characters). Design ist CC's Call (siehe Design-Freedom-Section).
- [ ] **`scripts/seed-resolver-extensions.ts`** angelegt, idempotent, `INSERT … ON CONFLICT DO NOTHING`. Neues package.json-Script `db:seed-resolver-extensions`.
- [ ] **`scripts/apply-override.ts` refactored**: Inline-Resolver entfernt, Resolver-Modul genutzt. `work_factions.raw_name` und `work_locations.raw_name` werden befüllt. `work_characters` wird jetzt analog zu `work_factions`/`work_locations` geschrieben (delete-then-insert per workId, `rawName` befüllt, Highest-Role-Priority).
- [ ] **Re-Apply 001..005** durchgeführt (5× `npm run db:apply-override -- --batch=ssot-w40k-00X`). Maintainer-Trigger; CC bereitet das Kommando vor, Maintainer führt aus. SQL-Counts vor + nach im Impl-Report.
- [ ] **Detail-Page-Smoke** gegen 5 Bücher (xenos, first-and-only, necropolis, nightbringer, the-anarch). Pro Buch im Impl-Report: Chip-Counts pro Achse (Factions / Locations / Characters) nach Re-Apply. Erwartung ≥3 pro Achse je Buch — wenn ein Buch unter dieser Schwelle bleibt, bekommt es eine kurze Begründung („nur 1 Location explizit gesetzt im Override-File, da Storymise enge Indoor-Setzung").
- [ ] **`npm run lint` + `npm run typecheck` + `npm run test:resolver` + `npm run brain:lint -- --no-write`** grün.

## Open questions

- **Slug-Match (Resolver-Stage 3) Notwendigkeit.** Die ersten zwei Stages (Direct-Match + Alias-Lookup) sollten 95%+ der Empirie auflösen. Slug-Match ist als Defense-in-Depth gedacht (Surface-Form "Imperial Guard" → slug `imperial_guard` matched nicht, weil canonical-id `astra_militarum` ist — Alias muss greifen). CC darf Stage 3 weglassen, wenn die Test-Cases auch ohne Slug-Match cleane Resolutionen liefern. Begründung im Report.

- **`work_characters.role`-Priorität bei Kollisionen.** Default-Wert ist `appears`. Empirie: ein POV-Charakter in zwei Büchern hat zwei Junction-Rows, jeweils mit `role=pov`. Aber: was wenn dasselbe Buch denselben Charakter mehrmals in der LLM-Output-Liste auftaucht (z.B. einmal als POV, einmal als Background-Mention)? Composite-PK kollidiert. Vorschlag: Reihenfolge `pov` > `appears` > `mentioned`; CC implementiert oder begründet alternative.

- **Excel-SSOT-Roster-Korrekturen.** Wenn CC bei der Resolver-Arbeit Lore-Korrekturen am `book-roster.json` bemerkt (z.B. Faction-/Setting-Mistags die per WebSearch belegt sind), bleibt das out-of-scope dieses Briefs — gehört in den Loop-Brief 061-Status-Log oder einen separaten Roster-Fix-Brief. Hier nur erwähnen, nicht beheben.

- **`primaryFactionId` für Charaktere mit Cross-Faction-Loyalitäten** (Mabbon Etogaur, Beta Bequin, Lord General Lugo, Honsou). CC's Beste-Schätzung; bei expliziter Unklarheit `null` setzen + im `notes`-Feld kurz begründen. Open für Maintainer-Korrektur in zukünftiger Anreicherungsrunde.

## Notes

### Tabelle 1 — Neue Factions (frequency ≥ 2, 26 Einträge)

Cowork-Vorschlag für IDs + Parents. CC darf Lore-Korrekturen einbauen (z.B. Belladon als Sub-Tanith oder Sub-Astra-Militarum), aber soll im Report begründen, wenn er von der Vorschlagsliste abweicht. Tone darf leer bleiben.

| Surface-Form | Freq | Vorgeschlagene ID | Vorgeschlagener `parent` | Alignment |
|---|---|---|---|---|
| Tanith First-and-Only | 23 | `tanith_first` | `astra_militarum` | `imperial` |
| Verghastite Ghosts | 20 | `verghastite_ghosts` | `tanith_first` | `imperial` |
| Blood Pact | 17 | `blood_pact` | `chaos` | `chaos` |
| Ordo Xenos | 14 | (alias only → `inquisition`) | — | — |
| Belladon | 11 | `belladon` | `tanith_first` | `imperial` |
| Sons of Sek | 6 | `sons_of_sek` | `chaos` | `chaos` |
| Imperial Navy | 5 | `imperial_navy` | `imperium` | `imperial` |
| Ecclesiarchy | 4 | `ecclesiarchy` | `imperium` | `imperial` |
| Urdeshi | 4 | `urdeshi` | `astra_militarum` | `imperial` |
| Adeptus Astartes | 4 | `adeptus_astartes` | `imperium` | `imperial` |
| Genestealer Cults | 3 | `genestealer_cults` | `tyranids` | `xenos` |
| Valhallan 597th | 3 | `valhallan_597th` | `astra_militarum` | `imperial` |
| Phantine Air Corps | 3 | `phantine_air_corps` | `astra_militarum` | `imperial` |
| Gereon Resistance | 3 | `gereon_resistance` | `astra_militarum` | `imperial` |
| Ordo Malleus | 2 | (alias only → `inquisition`) | — | — |
| Ordo Hereticus | 2 | (alias only → `inquisition`) | — | — |
| Jantine Patricians | 2 | `jantine_patricians` | `astra_militarum` | `imperial` |
| Vervunhive Militia | 2 | `vervunhive_militia` | `astra_militarum` | `imperial` |
| Zoican Host | 2 | `zoican_host` | `chaos` | `chaos` |
| Aexegarian Forces | 2 | `aexegarian_forces` | `astra_militarum` | `imperial` |
| Mortifactors | 2 | `mortifactors` | `adeptus_astartes` | `imperial` |
| Lords of the Unholy Host | 2 | `lords_of_unholy_host` | `chaos` | `chaos` |
| Daemons | 2 | `daemons` | `chaos` | `chaos` |

Bereits direct-matched in `factions.json` heute: `Inquisition` (25×), `Commissariat` (35×), `Adeptus Mechanicus` (10×), `Tyranids` (6×), `Necrons` (4×), `Orks` (4×), `Ultramarines` (4×), `Iron Warriors` (2×), `Adepta Sororitas` (1×).

Frequency=1-Long-Tail Factions (bleibt in `book_details.notes`-Blob): Tau Empire (1× — Surface-Form-Treue, canonical-name "T'au Empire" — siehe Tabelle 4), Cognitae, Slaanesh, Black Legion, Space Marines, Reclaimers, Skitarii, Volpone Bluebloods. Diese könnten CC oder Cowork in einer zukünftigen 50er-Runde promoten, wenn weitere Bücher die Counts hochziehen.

### Tabelle 2 — Neue Locations (frequency ≥ 2, ~40 Einträge)

Alle `gx: null`, `gy: null`, `tags: []` in dieser Runde. CC darf `sector` füllen, wenn die Welt einer bekannten Sector-Welt eindeutig zuzuordnen ist (z.B. Sancour, Eustis Majoris, Spaeton House → Scarus Sector; Calth, Macragge → Ultramar; etc.). Sonst `null`.

| Surface-Form | Freq | Vorgeschlagene ID | Hint |
|---|---|---|---|
| Scarus Sector | 7 | `scarus` | Sector-Eintrag, nicht Welt |
| Helican Subsector | 4 | `helican` | Sub-Sector |
| Eustis Majoris | 4 | `eustis_majoris` | sector=`scarus` |
| Sancour | 4 | `sancour` | sector=`scarus` |
| Damocles Gulf | 3 | `damocles_gulf` | Sector-Region |
| Voltemand | 3 | `voltemand` | sector=`sabbat_region` (neu? siehe sectors.json) |
| Gereon | 3 | `gereon` | sector=`sabbat_region` |
| Urdesh | 3 | `urdesh` | sector=`sabbat_region` |
| Eltath | 3 | `eltath` | auf Urdesh — Hauptstadt; CC entscheidet ob eigener Eintrag oder Tag |
| Hubris | 2 | `hubris` | sector=`scarus` |
| Thracian Primaris | 2 | `thracian_primaris` | sector=`helican` |
| Spaeton House | 2 | `spaeton_house` | sector=`scarus` |
| Yassilli Sarum | 2 | `yassilli_sarum` | sector=`scarus` |
| Queen Mab | 2 | `queen_mab` | Stadt auf Sancour |
| Perlia | 2 | `perlia` | Cain-Setting |
| Ironfound | 2 | `ironfound` | Forge-World |
| Tanith | 2 | `tanith` | Heimatwelt der Ghosts (zerstört) |
| Pyrites | 2 | `pyrites` | Sabbat-Welt |
| Fortis Binary | 2 | `fortis_binary` | Sabbat-Welt |
| Menazoid Epsilon | 2 | `menazoid_epsilon` | Sabbat-Welt |
| Monthax | 2 | `monthax` | Sabbat-Welt |
| Verghast | 2 | `verghast` | Sabbat-Welt |
| Vervunhive | 2 | `vervunhive` | Stadt auf Verghast |
| Ferrozoica | 2 | `ferrozoica` | Stadt auf Verghast |
| Hagia | 2 | `hagia` | Saint Sabbat Heimatwelt |
| Phantine | 2 | `phantine` | Sabbat-Welt |
| Cirenholm | 2 | `cirenholm` | Hive-City auf Phantine |
| Ouranberg | 2 | `ouranberg` | Hive-City auf Phantine |
| Aexe Cardinal | 2 | `aexe_cardinal` | Sabbat-Welt |
| Herodor | 2 | `herodor` | Sabbat-Welt |
| Civitas Beati | 2 | `civitas_beati` | Stadt auf Herodor |
| Ancreon Sextus | 2 | `ancreon_sextus` | Sabbat-Welt |
| Jago | 2 | `jago` | Fortress-Welt |
| Hinzerhaus | 2 | `hinzerhaus` | Citadel auf Jago |
| Balhaut | 2 | `balhaut` | Sabbat-Welt |
| Balopolis | 2 | `balopolis` | Stadt auf Balhaut |
| Salvation's Reach | 2 | `salvations_reach` | Sek-Space-Hulk-Archiv |
| Pavonis | 2 | `pavonis` | Ultramarines-Welt |
| Tarsis Ultra | 2 | `tarsis_ultra` | Ultramarines-Welt |
| Medrengard | 2 | `medrengard` | Iron-Warriors-Welt, im Eye of Terror |

Wenn `sector` einer existierenden Sector-Welt entspricht und der Slug noch nicht in `sectors.json` existiert (z.B. `sabbat_region`, `scarus`, `helican`): **CC entscheidet, ob diese Sectors auch geseedet werden** oder ob die Welten `sector: null` bleiben. Empfehlung Cowork: Sectors auch hinzufügen, wenn sie ≥3 Welten gruppieren (Scarus Sector + Sabbat-Region beide hits, Helican borderline). Sectors-Inserts gehören in das `seed-resolver-extensions`-Skript, vor Locations-Inserts.

Direct-matched heute: Sabbat Worlds (23× → `sabbat`), Eye of Terror (4× → `eye_of_terror`), Gudrun (3× → `gudrun`), Macragge (2× → `macragge`).

Frequency=1-Long-Tail (bleibt in Notes): Eisenhorn-shorts settings, single-mention Ultramarines worlds, etc.

### Tabelle 3 — Neue Characters (frequency ≥ 2, 65 Einträge)

`id` ist snake-case-slug des Namens (siehe `slugifyPerson`-Funktion in `apply-override.ts` — gleiche Regeln). `primaryFactionId` ist Cowork's beste-Schätzung; CC darf korrigieren.

| Name | Freq | Vorgeschlagene ID | primary_faction_id |
|---|---|---|---|
| Ibram Gaunt | 23 | `ibram_gaunt` | `commissariat` |
| Elim Rawne | 23 | `elim_rawne` | `tanith_first` |
| Hlaine Larkin | 21 | `hlaine_larkin` | `tanith_first` |
| Oan Mkoll | 18 | `oan_mkoll` | `tanith_first` |
| Viktor Hark | 18 | `viktor_hark` | `commissariat` |
| Ciaphas Cain | 12 | `ciaphas_cain` | `commissariat` |
| Jurgen | 12 | `jurgen` | `astra_militarum` |
| Tona Criid | 12 | `tona_criid` | `verghastite_ghosts` |
| Amberley Vail | 11 | `amberley_vail` | `inquisition` |
| Colm Corbec | 11 | `colm_corbec` | `tanith_first` |
| Caffran | 11 | `caffran` | `tanith_first` |
| Gideon Ravenor | 9 | `gideon_ravenor` | `inquisition` |
| Ban Daur | 9 | `ban_daur` | `verghastite_ghosts` |
| Gregor Eisenhorn | 8 | `gregor_eisenhorn` | `inquisition` |
| Regina Kasteen | 8 | `regina_kasteen` | `valhallan_597th` |
| Ruput Broklaw | 7 | `ruput_broklaw` | `valhallan_597th` |
| Ana Curth | 7 | `ana_curth` | `tanith_first` |
| Cherubael | 6 | `cherubael` | `chaos` |
| Mabbon Etogaur | 6 | `mabbon_etogaur` | `sons_of_sek` |
| Alizebeth Bequin | 5 | `alizebeth_bequin` | `inquisition` |
| Harlon Nayl | 5 | `harlon_nayl` | `inquisition` |
| Patience Kys | 5 | `patience_kys` | `inquisition` |
| Uber Aemos | 4 | `uber_aemos` | `inquisition` |
| Godwyn Fischig | 4 | `godwyn_fischig` | `inquisition` |
| Pontius Glaw | 4 | `pontius_glaw` | `chaos` |
| Kara Swole | 4 | `kara_swole` | `inquisition` |
| Carl Thonius | 4 | `carl_thonius` | `inquisition` |
| Wystan Frauka | 4 | `wystan_frauka` | `inquisition` |
| Brin Milo | 4 | `brin_milo` | `tanith_first` |
| Tolin Dorden | 4 | `tolin_dorden` | `tanith_first` |
| Bragg | 4 | `bragg` | `tanith_first` |
| Felyx Chass | 4 | `felyx_chass` | `verghastite_ghosts` |
| Uriel Ventris | 4 | `uriel_ventris` | `ultramarines` |
| Pasanius Lysane | 4 | `pasanius_lysane` | `ultramarines` |
| Zygmunt Molotch | 3 | `zygmunt_molotch` | `chaos` |
| Sanian | 3 | `sanian` | `ecclesiarchy` |
| Lord General Lugo | 3 | `lord_general_lugo` | `astra_militarum` |
| Gerome Landerson | 3 | `gerome_landerson` | `gereon_resistance` |
| Dalin Criid | 3 | `dalin_criid` | `belladon` |
| Ario Barzano | 3 | `ario_barzano` | `inquisition` |
| Midas Betancore | 2 | `midas_betancore` | `inquisition` |
| Zael Efferneti | 2 | `zael_efferneti` | `inquisition` |
| Beta Bequin | 2 | `beta_bequin` | `inquisition` |
| Lord General Dravere | 2 | `lord_general_dravere` | `astra_militarum` |
| Agun Soric | 2 | `agun_soric` | `verghastite_ghosts` |
| Gol Kolea | 2 | `gol_kolea` | `verghastite_ghosts` |
| Heritor Asphodel | 2 | `heritor_asphodel` | `zoican_host` |
| Vaynom Blenner | 2 | `vaynom_blenner` | `commissariat` |
| Lijah Cuu | 2 | `lijah_cuu` | `tanith_first` |
| Saint Sabbat | 2 | `saint_sabbat` | `ecclesiarchy` |
| Enok Innokenti | 2 | `enok_innokenti` | `chaos` |
| Murtan Feygor | 2 | `murtan_feygor` | `tanith_first` |
| Brostin | 2 | `brostin` | `tanith_first` |
| Mkvenner | 2 | `mkvenner` | `tanith_first` |
| Beltayn | 2 | `beltayn` | `tanith_first` |
| Bonin | 2 | `bonin` | `tanith_first` |
| Varl | 2 | `varl` | `tanith_first` |
| Noches Sturm | 2 | `noches_sturm` | `chaos` |
| Macaroth | 2 | `macaroth` | `astra_militarum` |
| Anakwanar Sek | 2 | `anakwanar_sek` | `sons_of_sek` |
| Captain Idaeus | 2 | `captain_idaeus` | `ultramarines` |
| Nightbringer | 2 | `nightbringer` | `chaos` (C'tan — könnte eigene Faction werden, hier pragmatisch chaos) |
| Chaplain Astador | 2 | `chaplain_astador` | `mortifactors` |
| Ardaric Vaanes | 2 | `ardaric_vaanes` | `lords_of_unholy_host` |
| Honsou | 2 | `honsou` | `iron_warriors` |

Frequency=1-Long-Tail Characters (bleibt in Notes): 12 Charaktere wie Dan-Abnett-, McNeill-Nebenfiguren aus einzelnen Büchern.

### Tabelle 4 — Faction-Aliases (Surface-Form → existing ID)

```json
{
  "Chaos": "chaos",
  "Imperial Guard": "astra_militarum",
  "Astra Militarum": "astra_militarum",
  "Ordo Xenos": "inquisition",
  "Ordo Malleus": "inquisition",
  "Ordo Hereticus": "inquisition",
  "Eldar": "eldar",
  "Aeldari": "eldar",
  "Tau Empire": "tau",
  "T'au Empire": "tau",
  "T'au": "tau",
  "Space Marines": "adeptus_astartes",
  "Imperium of Mankind": "imperium",
  "Imperium of Man": "imperium"
}
```

CC darf weitere Aliase einfügen, wenn sie aus den 50-Bücher-Surface-Forms motiviert sind. Direct-matches gehen weiter ohne Alias (siehe oben).

### Tabelle 5 — Location-Aliases

```json
{
  "Sabbat Worlds": "sabbat",
  "Sabbat Worlds Crusade": "sabbat",
  "Istvaan V": "istvaan_v",
  "Isstvan V": "istvaan_v"
}
```

Wenig nötig. Die meisten Locations sind direct-name-matches gegen ihre neuen Einträge in `locations.json`.

### Tabelle 6 — Character-Aliases

In dieser Runde: leer `{}`. CC darf bei Bedarf füllen (z.B. wenn ein Buch "Inquisitor Eisenhorn" sagt statt "Gregor Eisenhorn" — dann `"Inquisitor Eisenhorn": "gregor_eisenhorn"`). File-Existenz reicht für zukünftige Erweiterung.

### Resolver-Modul-Sketch (illustrativ, NICHT bindend)

```ts
// src/lib/resolver/index.ts
import factionsCanon from "@/../scripts/seed-data/factions.json";
import factionAliases from "@/../scripts/seed-data/faction-aliases.json";
// ... etc.

interface Resolution {
  id: string | null;
  raw: string;
}

export function resolveFaction(name: string): Resolution {
  // 1. Direct name match
  const direct = factionsCanon.find((f) => f.name === name);
  if (direct) return { id: direct.id, raw: name };
  // 2. Alias
  const aliasId = (factionAliases as Record<string, string>)[name];
  if (aliasId) return { id: aliasId, raw: name };
  // 3. (optional) Slug fallback
  // const slug = slugify(name);
  // const slugMatch = factionsCanon.find((f) => f.id === slug);
  // if (slugMatch) return { id: slugMatch.id, raw: name };
  return { id: null, raw: name };
}
// resolveLocation, resolveCharacter analog
```

CC's tatsächliche Form (synchronous JSON-Import vs. async-DB-Lookup, Caching-Strategy, File-Layout in `src/lib/resolver/`) ist freie Wahl, solange die Drei-Funktions-API + die Resolution-Reihenfolge stehen.

### Re-Apply-Sequenz (illustrativ)

Nach Migration-Apply + Seed-Extensions-Run, lokal vom Maintainer aus:

```bash
npm run db:migrate
npm run db:seed-resolver-extensions
npm run db:apply-override -- --batch=ssot-w40k-001
npm run db:apply-override -- --batch=ssot-w40k-002
npm run db:apply-override -- --batch=ssot-w40k-003
npm run db:apply-override -- --batch=ssot-w40k-004
npm run db:apply-override -- --batch=ssot-w40k-005
```

Reihenfolge ist 001..005 (chronologisch), nicht reverse — work_collections-Inserts brauchen alle Constituent-UUIDs im selben Batch + Cross-Batch-Refs werden im Apply-Skript heute ignoriert (siehe `applyCollections`-Kommentar). Ein W40K-0040 Founding Omnibus in Batch 004 referenziert Constituent-IDs aus Batch 003 (W40K-0024..0026); diese Cross-Batch-Junction wird in dieser Runde nicht gefüllt (Apply-Skript schreibt nur intra-batch). Das ist heute schon der Stand — Resolver-Brief ändert das nicht. Ein zukünftiger `apply-cross-batch-collections`-Mini-Brief kann das nachreichen.

### Tracked-for-future-briefs

- **Cross-Batch-Collection-Resolution.** `apply-override.applyCollections` operiert nur intra-batch. Die Omnibus-Cross-Refs (W40K-0040 → W40K-0024..0026, W40K-0041..0042 → W40K-0027..0034, etc.) bleiben unresolved. Eigener Mini-Brief.
- **HH-Resolver.** Wenn der Loop in die HH-Domain überrollt (vermutlich nach Resolver-100 oder -150), kommt ein paralleler HH-Resolver-Brief mit denselben Sidecar-JSON-Patterns. HH bringt eigene Surface-Forms (Sons of Horus / Luna Wolves, Magnus / Ahriman, Primarchs, Heresy-Schlachten).
- **Anreicherungs-Brief.** `lexicanumUrl` + `notes` für die in dieser Runde gepflanzten Reference-Rows. WebSearch-basiert; CC oder ein dediziertes Anreicherungs-Script.
- **Faction-Glyphs**. Wenn die Detail-Page Glyph-Rendering nutzt: die neuen Factions haben `glyph: null`. Phase-5 oder Hub-Polish-Brief.
- **Hierarchy-Rollup-Filter** (parentId-recursive). UX-Frage am Hub / der Detail-Page. Phase-5 oder Hub-Polish.
- **Loop fortsetzen.** Brief 061 ist auf 50er-Pause; Maintainer-Trigger nach Resolver-Apply (kein neuer Brief nötig — Brief 061 ist standing).
- **Apply-Sweep für 002-Re-Apply-Konsistenz** mit dem 062er-Author-Fix (heute schon idempotent angewendet). Falls Resolver-Apply gegen 001 oder 002 unerwartete Persons-Inserts triggert, im Report dokumentieren.
