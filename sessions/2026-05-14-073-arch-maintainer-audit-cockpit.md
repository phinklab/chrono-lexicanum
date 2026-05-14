---
session: 2026-05-14-073
role: architect
date: 2026-05-14
status: implemented
slug: maintainer-audit-cockpit
parent: null
links:
  - 2026-05-14-072-arch-resolver-batch-2
  - 2026-05-14-072-impl-resolver-batch-2
  - 2026-05-13-070-arch-faction-policy-hygiene
  - 2026-05-13-071-arch-loop-driver
  - 2026-05-11-061-arch-ssot-loop
commits: []
---

# Maintainer-Audit-Cockpit — `/buch/[slug]/audit` + `/buecher` Audit-Modus

## Goal

Trenne `/buch/[slug]` (public-lean) von `/buch/[slug]/audit` (Maintainer-Cockpit), und gib `/buecher` einen Audit-Modus mit vier Filtern, damit die Resolver-Drift in 100 applied W40K-Büchern triagierbar wird, bevor der Loop für `ssot-w40k-011` wieder anläuft.

Heute zeigt `/buch/[slug]` ungefähr 30 % dessen, was die SSOT-/Resolver-Pipeline pro Buch in die DB schreibt, und `/buecher` ist zwar reichhaltiger, aber blind gegenüber Datenqualitäts-Pathologien (Long-Tail-Drift, Iyanden-Doppel-Pfad, Aeldari-/Drukhari-Aliase, Cross-Batch-Collections). Der Pivot ist: die bisherige Detail-Seite soll Public bleiben und nicht länger Audit-Trail und Reader-Display mischen — die neue Audit-Sub-Route wird das **Maintainer-Cockpit** zum Erkennen von Resolver-Drift, Surface-Form-Diskrepanzen und fehlenden Junctions, während die SSOT-Pipeline weiterläuft. Korrekturen laufen weiter offline über `manual-overrides-*.json` + `scripts/apply-override.ts` — die UI ist read-only.

## Design freedom — read before everything else

Du hast den **frontend-design-Skill** installiert. Dieses Brief ist *architektonisch* eng (welche Routen, welche Felder, welche Filter), und *ästhetisch* bewusst offen. Alles, was visuelle Sprache betrifft, ist deine Entscheidung.

Was das konkret heißt — ich gebe dir keine Pixel, keine ms, keine oklch-Tripel, keine Klassen-Shapes:

- **Audit-Filter-Pillen auf `/buecher`** — ich sage „vier Pills, einzeln aktivierbar, URL-State". Form (Pill-Geometrie, aktiv/inaktiv-Differenzierung, Multi-Select-Treatment, Stagger beim Wechsel) ist deine. Heutige `src/app/buecher/SortPills.tsx` ist ein vernünftiger Ausgangspunkt, kein Korsett.
- **Audit-View-Layout** auf `/buch/[slug]/audit` — ich sage „Sektionen: Header / Work fields / Book details / Persons / Factions / Locations / Characters / Facets / Collections / External links". Welche Sektion eine Tabelle, welche ein Definition-List, welche eine Grid-Karte ist, ist deine. Ob du den Audit-Frame klar vom Public-Frame absetzt (anderer Hintergrund-Token, kicker `// Cogitator-Audit · provenance`, mono-lastiger als die Public-Seite) oder den Frame teilst, ist deine. Cogitator-Terminal-Voice darf hier *stärker* werden als auf der Public-Seite — das ist eine Maintainer-Surface, kein Reader-Surface.
- **Drift-Markierung** für `raw_name ≠ canonical` — ich sage „sichtbar in Faction-/Location-/Character-Sektion". Form (Surface-Form als Kicker neben der Pille, separate Drift-Pille mit zweiter Klasse, kursiver Beisatz, Tooltip, Hover-Reveal) ist deine. Wichtig ist nur, dass ein Maintainer beim Scroll-by erkennt: „die Surface-Form ‚Imperial Guard' wurde auf `astra_militarum` resolved" — ohne in den Code zu schauen.
- **Public-Audit-Linking** — `/buch/[slug]` trägt einen diskreten Audit-Link (klein, unten, nicht prominent — ein Mikro-Switch für Maintainer). `/buch/[slug]/audit` trägt einen prominenten Rück-Link zur Public-Ansicht (oben, sichtbar). Position, Treatment, exakte Copy („Cogitator-Audit", „Maintainer view", „/audit →", whatever) ist deine.
- **Audit-Modus-Listen-Zeile** in `/buecher` — ich sage „erweitert, ersetzt nicht: zusätzlich `externalBookId` + `sourceKind` + `confidence` + Junction-Counts + Collection-Count + Direkt-Link auf `/buch/[slug]/audit`". Form (eigene Audit-Strap unter der Public-Zeile, separate Spalte, kompakte Mono-Strip rechts) ist deine.
- **Animations-Timings, Stagger, oklch-Triplets, Spacing-Skala** — komplett deine.
- **Exakte Copy** — komplett deine. Ich gebe dir Begriffe (Audit, Drift, Junction-Lücke, SSOT, Cross-Batch-Collection); deine Sache, ob sie auf der Oberfläche „Drift" heißen oder „Surface-Form-Abweichung" oder schlicht den raw_name als Kicker zeigen.

Wenn du dich beim Lesen dieses Briefs ertappst, eine Klasse / einen Pixel / einen oklch-Wert hier erwartet zu haben — den habe ich bewusst nicht geschrieben. Die einzige *architektonische* Constraint im Design-Bereich ist: **Public bleibt slim** (kein Audit-Lärm), **Audit darf maintainer-laut werden** (Long-Tail-Drift muss sich nicht verstecken). Innerhalb dessen: greif zu.

Reference-Points, an denen du die Voice kalibrieren kannst: aktueller Hub (`src/app/page.tsx`), Catalogue (`src/app/buecher/page.tsx`), und der bestehende globals.css mit `oklch()`-Tokens. Keine neuen Tokens für diesen Brief nötig — die Palette reicht.

## Context

**Pipeline-Stand 2026-05-14.** Brief 072 hat den Resolver-Pass 2 für `ssot-w40k-006..010` durchgebracht. Globale Junction-Counts: `work_factions=650`, `work_locations=239`, `work_characters=475`, `work_collections=35`. Coverage `factions=650/657`, `locations=239/258`, `characters=475/552`. 100 W40K-Bücher liegen in der Authority-Schicht. OQ9-Trigger (≥100 applied) ist erfüllt; das Cockpit ist der nächste Schritt *vor* Brief 071 (Loop-Driver) und *vor* `ssot-w40k-011`-Loop-Resume.

**Konkretes Triage-Material aus 072**, das das Cockpit sichtbar machen muss:

- **Character-Long-Tail.** +112 Character-Junctions für 50 Bücher (vs. +363 für die ersten 50). 77 unresolved freq-1-Surface-Forms bleiben im Long-Tail. Die Pathology zeigt sich genau dort, wo Bücher 0 Characters resolved haben oder eine Surface-Form aliasen müsste.
- **Iyanden-Doppel-Pfad.** Es gibt eine `locations.iyanden`-Row UND einen faction-axis-Alias „Iyanden"/„Craftworld Iyanden" → `eldar`. Beide Pfade müssen im Audit-View sichtbar werden (Location-Sektion + Faction-Sektion mit `raw_name`-Drift).
- **Aeldari-/Drukhari-/Dark-Eldar-Aliase.** Surface-Form ≠ canonical id; klassischer raw_name-Drift-Fall. Heute mappt `scripts/seed-data/faction-aliases.json` sowohl „Drukhari" als auch „Dark Eldar" auf `eldar` (kein eigener `dark_eldar`-Knoten). Im Audit muss sichtbar werden: „die Surface-Form ‚Drukhari' wurde auf `eldar` (Name: Eldar) resolved" — d.h. `work_factions.raw_name = "Drukhari"` und `factions.name = "Eldar"`, also Drift-Markierung greift.
- **Cross-Batch-Collections.** 35 `work_collections`-Rows nach 072-Refactor, davon einige nur content-seitig im Batch (`first-and-only`/`ghostmaker`/`necropolis` als Inhalte von `W40K-0040`-Omnibus). Detail-Page „Auch enthalten in:" + „Enthält:" ist Pflicht in der Audit-View.

**Heutige Routen-Form.**

- `src/app/buch/[slug]/page.tsx` (Brief 060+063) ist die heutige Detail-Page. Rendert `works` + `bookDetails` + `work_persons` + `work_factions` + `work_locations` + `work_characters` + `work_facets`. Liest aber keine Audit-Spalten (`raw_name`, `confidence`, `sourceKind`, `externalBookId`), kein `work_collections`, kein `external_links`, kein `bookDetails.notes`/`rating`.
- `src/app/buecher/page.tsx` (Brief 064+) ist der Catalogue mit `containedIn`, Sort-Pills (`updated`/`title`), Format-/Availability-/M-Band-Labels.

**Schema-Inventar** (`src/db/schema.ts`):

- `works` — Provenance pro Buch: `sourceKind`, `confidence`, `externalBookId`, `releaseYear`, `startY`/`endY`, `kind`, `canonicity`, `coverUrl`, `createdAt`, `updatedAt`.
- `bookDetails` — `isbn13`/`isbn10`, `seriesId`+`seriesIndex`, `pageCount`, `format`, `availability`, `rating` + `ratingSource` + `ratingCount`, `primaryEraId`, `notes`.
- `work_factions` / `work_locations` / `work_characters` — Junction-Audit: `role` + `raw_name` (Brief 063 Audit-Trail-Spalte). `work_locations` zusätzlich `at_y`.
- `work_collections` — vollumfänglich provenanced: `displayOrder` + `confidence` + `basis` + beide FK-Richtungen (`collection_work_id` / `content_work_id`).
- `work_persons` — `role` + `displayOrder` + `note`.
- `external_links` — service + URL + kind (Phase-2-Junction).
- Reference-Tabellen (`factions`, `locations`, `characters`, `persons`) tragen **keine** per-Row `sourceKind`/`confidence`. Provenance auf der Junction ist `raw_name` (drift ja/nein); Provenance auf der Work-Achse ist `works.sourceKind`+`works.confidence`. Das ist explizit der heutige Stand — keine Schema-Migration in diesem Brief.

**OQ9-Entscheidungen, die in dieses Brief einfließen** (aus 2026-05-13-Diskussion + 2026-05-14 AskUserQuestion):

- Read-only Audit. Keine Inline-Edits, keine UI-Writes, kein Auth-Gate.
- Sub-Route: `/buch/[slug]/audit` als Sub-Segment unter `src/app/buch/[slug]/audit/page.tsx`.
- Audit-View-Tiefe: jeder Junction-Typ rendert seinen vollumfänglichen Audit-Trail (was die Schicht heute hergibt — kein neues Schema).
- Default-Sort im Audit-Modus auf `/buecher`: `updatedAt desc` (letzter Apply zuerst).
- Pflicht-Filter auf `/buecher` Audit-Modus: `Drift` + `Junction-Lücke` + `SSOT` + Bonus `In mehreren Collections`. **`confidence < 0.7` ist bewusst nicht Pflicht** — heute steht im SSOT-Layer fast alles auf 1.00; der Filter wird erst scharf, wenn der Sonnet-Pipeline-Lauf wieder läuft (post-OQ2-(c)).

## Constraints

- **`/buch/[slug]` bleibt public-lean.** Sichtbare Felder: Cover, Titel, Autor(en), Erscheinungsjahr, Format-Label, Era-Anchor, Serie+Index, Synopsis, Faction-/Location-/Character-Pillen (so wie heute schon — *nur* mit Reference-`name`, **ohne** `raw_name`-Drift-Marker), Facet-/Tag-Pillen (`work_facets`-Anzeige bleibt). Nicht sichtbar bleibt der Audit-Layer: kein `works.confidence`, kein `works.sourceKind`, kein `works.externalBookId`, kein `bookDetails.notes`, kein `bookDetails.rating`+`ratingSource`, keine `work_collections.confidence`/`basis`, keine `external_links`, kein `raw_name` als Beisatz an irgendeiner Pille. Diese Seite ist Reddit-Public-Display.
- **`/buch/[slug]/audit` ist die Sub-Route.** Implementation als `src/app/buch/[slug]/audit/page.tsx`. Server Component. `notFound()` wenn slug nicht existiert. Server-side DB-Read via `src/db/client.ts` (Standard).
- **Audit-Route ist `noindex`.** Form (per-route `metadata.robots`, robots.txt-Entry, X-Robots-Tag) ist Design-Freedom; *Intent* ist Constraint. Maintainer-Surface, nicht Crawler-Target.
- **`/buecher` Audit-Modus über URL-State.** Form (`?audit=drift`, `?audit=drift,gap`, eigener Pfad — `/buecher?audit=...` ist die Empfehlung) ist Design-Freedom; *Intent* ist: Maintainer kann den Audit-Mode in der URL teilen und neu laden ohne Re-Click.
- **Multi-Select bei den vier Audit-Filtern.** Filter müssen einzeln aktivierbar **und** kombinierbar sein. Logik bei Multi-Select: **AND** (Drift ∧ Junction-Lücke = Bücher mit beiden Eigenschaften), nicht OR. Wenn ein Single-Select-UI cleaner aussieht und der AND-Mode trotzdem über die URL erreichbar bleibt, ist das auch akzeptabel — entscheid du.
- **Default-Sort im Audit-Modus:** `updatedAt desc`. SortPills bleiben verfügbar (Titel A–Z auch im Audit-Modus wählbar).
- **Public-Modus auf `/buecher` bleibt unverändert** in Sicht-Feldern. Keine `raw_name`, kein `confidence`, kein `externalBookId` in der Public-Listen-Zeile.
- **Keine Schema-Migration.** Kein `drizzle-kit generate`. Keine neuen Spalten, kein `sources[]`-Array-Field, kein Override-Provenance-Pfad. Wenn etwas davon im Brief 074+ relevant wird, eigenes Brief.
- **Server-Component-Default.** Filter-Pillen + SortPills sind die einzigen Client-Inseln (URL-write via `router.replace`).
- **`prefers-reduced-motion`** wird von jeder neu eingeführten Animation respektiert (Filter-Toggle-Transitions, Audit-Sektion-Mount-Stagger falls du eine baust).
- **Keine Refactors außerhalb des Brief-Scopes.** `/timeline`, `/timeline/[era]`, `/map`, `/ask`, `/ingest`, `/fraktion/[slug]`, `/welt/[slug]`, `/charakter/[slug]` werden nicht angefasst.

## Out of scope

- **Inline-Edit-Pfad in der UI.** Audit ist read-only. Korrekturen laufen offline über `manual-overrides-*.json` + `scripts/apply-override.ts`. Auch keine „Open in editor"-Buttons, keine Copy-to-clipboard-Affordances für Override-JSON-Snippets — eigenes Brief, wenn jemals nötig.
- **Auth / Login.** Audit-Route ist heute öffentlich erreichbar (read-only, robots-noindex reicht). Kein Middleware-Gate, kein Session-Cookie, kein Basic-Auth.
- **`ssot-w40k-011`-Loop-Resume.** Brief 061 bleibt standing-paused.
- **Brief 071 (Loop-Driver).** Aktivierung folgt *nach* diesem Brief.
- **OQ2-(c) `chaos`-pov_side-Prompt-Härtung.** Bündelt sich mit dem nächsten Pipeline-Touch (Brief 074 oder dem ersten Sonnet-Pipeline-Brief).
- **Hardcover-Rating-Promotion (OQ6).** Eigenes Brief — auch wenn `bookDetails.rating` heute schon in der Audit-View *gerendert* werden soll (es ist ein DB-Feld), wird hier keine *Field-Promotion-Pipeline* gebaut.
- **Schema-Migration** jeglicher Art. Kein `sources[]`-Array, keine `override_source`-Spalte, keine `audit_log`-Tabelle.
- **Cartographer-/Timeline-Audit-Filter.** Eigene Phase.
- **Reference-Entity-Audit-Pages** (`/fraktion/[slug]/audit`, `/welt/[slug]/audit`, `/charakter/[slug]/audit`). Eigenes Brief, wenn die OQ9-Cockpit-Erfahrung das nahelegt.
- **Robots/Indexer-Policy als Site-weit-Regel.** Audit-Route trägt `noindex`; Public-Site bleibt indexierbar wie heute.

## Acceptance

The session is done when:

### `/buch/[slug]` (public-lean)

- [ ] Route rendert weiterhin auf `/buch/[slug]`, Server Component, ohne Auth.
- [ ] Sichtbare Felder: Cover (`works.coverUrl` mit Fallback wenn `NULL`), Titel (`works.title`), Autor(en) (`work_persons.role='author'`), Erscheinungsjahr (`works.releaseYear`), Format-Label (`bookDetails.format` via `FORMAT_LABELS`), Era-Anchor (`bookDetails.primaryEraId` → `eras.name`), Serie + Index (`bookDetails.seriesId` + `seriesIndex`), Synopsis (`works.synopsis`), Faction-/Location-/Character-Pillen (Reference-`name` only — **ohne** `raw_name`-Drift-Marker, der gehört in die Audit-View), Facet-/Tag-Pillen.
- [ ] **Nicht sichtbar:** `raw_name` (auf keiner Junction-Sektion, auch nicht als Tooltip/Hover), `works.confidence`, `works.sourceKind`, `works.externalBookId`, `bookDetails.notes`, `bookDetails.rating`/`ratingSource`/`ratingCount`, `work_collections.confidence`/`basis`, `external_links` als Liste.
- [ ] Diskreter Audit-Link sichtbar (Form + exakte Copy + Position = Design-Freedom).

### `/buch/[slug]/audit` (Maintainer-Cockpit)

- [ ] Neue Route unter `src/app/buch/[slug]/audit/page.tsx`. Server Component. `notFound()` wenn slug nicht existiert.
- [ ] Header zeigt: Titel + `works.externalBookId` (z. B. „W40K-0042"; wenn `NULL`, sichtbar als „—") + `works.sourceKind` + `works.confidence` (formatiert: 1.00 / 0.75) + `works.updatedAt` (lokalisiert, de-DE).
- [ ] Sektion **„Work fields"** rendert *alle* `works`-Spalten der gelesenen Row: `id`, `slug`, `title`, `synopsis`, `coverUrl`, `releaseYear`, `startY`, `endY`, `kind`, `canonicity`, `sourceKind`, `confidence`, `externalBookId`, `createdAt`, `updatedAt`. `NULL`-Werte sind sichtbar als leere/dim-Darstellung — niemand soll raten müssen, ob ein Feld leer ist oder ob die Query es nicht abfragt.
- [ ] Sektion **„Book details"** rendert alle `bookDetails`-Spalten: `isbn13`, `isbn10`, `seriesId` + `seriesIndex`, `pageCount`, `format`, `availability`, `rating` + `ratingSource` + `ratingCount`, `primaryEraId`, `notes`.
- [ ] Sektion **„Persons"** listet alle `work_persons`-Rows mit `role`, `displayOrder`, `note`, `persons.name`. Sortierung nach `displayOrder`.
- [ ] Sektion **„Factions"** listet alle `work_factions`-Rows mit `factions.name`, `factions.id`, `role`, `raw_name`. **Drift-Markierung greift nur, wenn `raw_name IS NOT NULL AND raw_name <> factions.name`** (Form der Markierung ist Design-Freedom). Identische `raw_name == name`-Rows sind *kein* Drift (`apply-override.ts` setzt `raw_name` unconditional, siehe Drift-Filter-Constraint oben). Sub-Sortierung: deine Wahl, alphabetisch oder role-gewichtet, dokumentier sie im Report.
- [ ] Sektion **„Locations"** listet alle `work_locations`-Rows mit `locations.name`, `locations.id`, `role`, `raw_name`, `at_y`. Drift-Markierung-Bedingung wie bei Factions (Vergleich gegen `locations.name`).
- [ ] Sektion **„Characters"** listet alle `work_characters`-Rows mit `characters.name`, `characters.id`, `role`, `raw_name`. Drift-Markierung-Bedingung wie bei Factions (Vergleich gegen `characters.name`).
- [ ] Sektion **„Facets / Tags"** listet alle `work_facets`-Rows mit `facet_categories.name` + `facet_values.name`. Gruppierung nach Kategorie (deine Wahl).
- [ ] Sektion **„Collections"** mit zwei Sub-Blöcken:
  - **(a) „Enthalten in"** — alle `work_collections`-Rows wo `content_work_id = work.id`, mit `displayOrder` + `confidence` + `basis` + Link zur Collection-Detail-Page (`/buch/{collection-slug}`).
  - **(b) „Enthält"** — alle `work_collections`-Rows wo `collection_work_id = work.id`, mit `displayOrder` + `confidence` + `basis` + Link zur Content-Detail-Page (`/buch/{content-slug}`).
  - Beide Sub-Blöcke sind sichtbar auch wenn leer — explizite „Enthalten in: keine" / „Enthält: keine"-Darstellung (Form ist Design-Freedom).
- [ ] Sektion **„External links"** listet alle `external_links`-Rows mit `services.name` + URL + `kind`. Wenn leer: sichtbar als „—".
- [ ] Prominenter Rück-Link auf `/buch/[slug]` im Header.
- [ ] Audit-Route ist `noindex`. Ein Aufruf der Seite mit z. B. `curl -I` zeigt einen `X-Robots-Tag`-Header oder das HTML trägt `<meta name="robots" content="noindex">`. Welcher Weg gewählt wurde, im Report dokumentieren.
- [ ] Wenn `works.kind ≠ 'book'` (Films, Channels): die Sektionen, die nur für Bücher existieren (`book_details`, `work_facets`), sind sichtbar leer/„—". Kein Crash, kein redirect — die Route ist für alle `works`-Slugs valide, aber Bücher sind das interessante Material.

### `/buecher` Audit-Modus

- [ ] `/buecher` rendert weiterhin den Public-Catalogue wie heute (default, kein Audit-State aktiv).
- [ ] Vier Audit-Filter klickbar via Pillen-Treatment (Form = Design-Freedom). URL-State trägt den Audit-Mode (`?audit=...` o. ä.). Filter sind **kombinierbar (AND-Logik)**:
  - **Drift** — Bücher mit mindestens einer Junction-Row in (`work_factions` ∪ `work_locations` ∪ `work_characters`), wo `raw_name IS NOT NULL` **und** `raw_name <> {reference}.name` (also: `work_factions.raw_name <> factions.name`, `work_locations.raw_name <> locations.name`, `work_characters.raw_name <> characters.name`). **Wichtig:** `scripts/apply-override.ts` setzt `raw_name` heute *unconditional* aus der Surface-Form (auch wenn identisch mit canonical) — ein bloßer `IS NOT NULL`-Check würde fast alle SSOT-Bücher matchen und den Filter wertlos machen.
  - **Junction-Lücke** — Bücher mit `kind='book'`, bei denen mindestens eine der drei Junction-Tabellen (`work_factions`, `work_locations`, `work_characters`) 0 Rows für `work.id` enthält.
  - **SSOT** — Bücher mit `works.sourceKind = 'ssot'`.
  - **In mehreren Collections** — Bücher mit `COUNT(*) FROM work_collections WHERE content_work_id = work.id` ≥ 2.
- [ ] Default-Sort im Audit-Modus: `updatedAt desc`. `SortPills` bleibt verfügbar; `Titel A–Z` weiter wählbar.
- [ ] Im Audit-Modus zeigt jede Listen-Zeile *zusätzlich* (Public-Felder bleiben sichtbar — Audit *erweitert*, ersetzt nicht):
  - `works.externalBookId` (z. B. „W40K-0042")
  - `works.sourceKind`
  - `works.confidence` (formatiert)
  - Junction-Counts kompakt (Empfehlung: `f:N · l:N · c:N` für factions/locations/characters; exaktes Treatment = Design-Freedom)
  - Collection-Membership-Count (`enthalten in: N` + ggf. `enthält: N`)
  - Direkt-Link auf `/buch/[slug]/audit` (nicht auf `/buch/[slug]`) — die „Detailseite öffnen →"-Affordance ist im Audit-Modus eine Audit-Affordance.
- [ ] Wenn `?audit=drift` (nur Drift aktiv) und 0 Bücher matchen: sichtbare „Keine Drift-Treffer in diesem Filter"-Darstellung (Form = Design-Freedom).

### Hygiene

- [ ] `npm run typecheck` — pass.
- [ ] `npm run lint` — pass auf bisherigem Baseline (das bekannte `@next/next/no-page-custom-font`-Warning bleibt akzeptiert).
- [ ] `npm run brain:lint -- --no-write` — pass (blocking 0; bestehende Warnings akzeptiert, keine neuen).
- [ ] `npm run dev` — every route 200, console clean. Manuelle Sanity-Checks:
  - `/buch/the-anarch` (public-lean — kein `raw_name` sichtbar)
  - `/buch/the-anarch/audit` (Cockpit — alle Felder sichtbar)
  - `/buecher` (Public, unverändert)
  - `/buecher?audit=drift` (Drift-Filter aktiv)
  - `/buecher?audit=gap` (Junction-Lücke-Filter aktiv)
  - `/buecher?audit=drift,ssot` (Multi-Select AND)
  - Audit-Route `noindex` verifiziert (z. B. via `curl -I` oder Browser-DevTools Network-Tab).
- [ ] Implementer-Report `sessions/2026-05-14-073-impl-maintainer-audit-cockpit.md` committed; dieses Brief auf `status: implemented` geflipped.

## Open questions for your report

1. **Design-Entscheidungen, die du getroffen hast** — Filter-Pill-Shape, Drift-Markierung, Audit-Section-Frame, Public-↔-Audit-Link-Position + -Copy, Layout-Density. Most-read section.
2. **Multi-Filter-URL-Form.** `?audit=drift,gap,ssot` (comma-separated) vs. `?audit=drift&audit=gap` (repeated param) vs. `?drift=1&gap=1&ssot=1` (Bool-Flags). Welche hast du gewählt und warum?
3. **Noindex-Mechanismus.** Per-route `metadata.robots`, X-Robots-Tag, robots.txt-Pfad-Disallow? Welche, und welcher Trade-off?
4. **Junction-Lücke-Query-Form.** Drei `LEFT JOIN ... GROUP BY HAVING COUNT(*) = 0`, drei `NOT EXISTS`-Subselects, oder ein Aggregat in der Drizzle-`with`-Query? Welche Form bei 100 Büchern und wie sieht das bei 500 aus?
5. **Catalogue-Performance unter Audit-Modus.** Heutige `/buecher`-Query lädt alle Bücher + alle Junctions in Memory. Wird unter Audit-Mode mit Junction-Counts plus Collection-Counts pro Row irgendwas unschön (>100 Bücher)? Wenn ja, was wäre der nächste Hebel?
6. **`works.kind ≠ 'book'`-Behandlung.** Hast du die Audit-Route für non-book-Works funktional gehalten oder gibt es Pathologien (z. B. fehlende `book_details`-Row, NULL-Crash)? Wo war die Grenze sauber?
7. **Faction-Drift sichtbar machen bei Mid-Knoten / Browse-Root.** Wenn `raw_name = "Death Guard"` und canonical `factions.name = "Death Guard"` (id `death_guard`, parent = `heretic_astartes`), ist `raw_name == name` → kein Drift-Marker. Wenn jemand aber den Browse-Root-Pfad (`chaos → heretic_astartes → death_guard`) hinter dem Namen sehen will: hast du das in die Audit-View aufgenommen oder defer'd?

## Notes

### Telemetrie-Anker aus 072 (Daten, die das Cockpit sichtbar machen muss)

- **Coverage global:** `factions=650/657`, `locations=239/258`, `characters=475/552`. Cross-Batch-Collections: `work_collections=35` (Baseline 17 → Refactor 35).
- **Character-Long-Tail:** +112 Junctions für die zweiten 50 Bücher (vs. +363 für die ersten 50). 77 unresolved freq-1-Surface-Forms.
- **Iyanden-Doppel-Pfad:** `locations.iyanden`-Row UND Faction-Alias „Iyanden"/„Craftworld Iyanden" → `eldar`. Im Audit-View tauchen beide Pfade in zwei verschiedenen Sektionen auf; das ist intendiert.
- **Aeldari/Drukhari-Aliase:** `faction-aliases.json` mappt sowohl „Drukhari" als auch „Dark Eldar" auf `eldar` (kein eigener `dark_eldar`-Faction-Row). Im Audit-View ist das ein klassischer `raw_name`-Drift-Fall (`raw_name = "Drukhari"` ≠ `factions.name = "Eldar"`) — Drift-Marker muss greifen.
- **Smoke-Slugs für deine manuellen Checks:** `the-anarch` (9/3/11 — Factions/Locations/Characters), `calgars-fury` (7/3/1), `the-emperors-gift` (8/2/1), `storm-of-iron` (6/1/6), `celestine` (5/1/1), `spear-of-the-emperor` (8/3/2). Mindestens einer davon hat eine Drift-Row — gut zum Verifizieren der Drift-Markierung.

### Schema-Klarstellung pro Junction-Typ

Die Audit-Tiefe-Entscheidung „raw_name + confidence + sourceKind + basis" ist als *axis-übergreifend* zu lesen, nicht als per-Junction-Vollset. Was die DB heute hergibt, pro Achse:

- **`works`** trägt `confidence` + `sourceKind` + `externalBookId` (per-Buch-Provenance). Wird im Audit-Header + „Work fields"-Sektion gerendert.
- **`work_factions` / `work_locations` / `work_characters`** tragen `role` + `raw_name` (Brief 063 Audit-Trail). `work_locations` zusätzlich `at_y`. **Keine** per-Junction-`confidence`/`sourceKind`/`basis` — das hier ist die Sicht, nicht „fehlt", sondern „liegt eine Schicht höher".
- **`work_collections`** trägt vollumfänglich `displayOrder` + `confidence` + `basis`. Wird in der Collections-Sektion entsprechend gerendert.
- **`work_persons`** trägt `role` + `displayOrder` + `note`.

Keine Schema-Migration in diesem Brief. Wenn das Cockpit zeigt, dass per-Junction-Provenance auf Faction/Location/Character gebraucht wird, ist das ein Future-Brief.

### `confidence < 0.7`-Filter bewusst nicht Pflicht

`works.confidence` steht im SSOT-Authority-Layer heute fast überall auf 1.00 (Maintainer-kuratiert). Der Filter ist erst dann scharf, wenn die LLM-Enrichment-Stage wieder läuft (post-OQ2-(c), Sonnet-Pipeline). Wenn du den Filter *trivial* mit-implementieren kannst (eine weitere Pille, +1 WHERE-Clause), gerne — sonst defer auf das Sonnet-Pipeline-Brief.

### Public-↔-Audit-Linking-Pattern

- **Public-Route** trägt einen diskreten Audit-Link: klein, unten, mono-typografisch, keine prominent gefärbte CTA. Maintainer findet ihn, Reddit-Besucher übersieht ihn (oder klickt aus Neugier, sieht eine Maintainer-Surface, und das ist okay).
- **Audit-Route** trägt einen prominenten Rück-Link auf Public: oben, sichtbar, klar als „Maintainer view" / „Audit" markiert mit Rück-Affordance.
- Exakte Copy + Treatment = Design-Freedom. Vorschlag (übernehmen oder verwerfen): Audit-Link auf Public = „`// audit →`", Public-Link auf Audit = „`← Public view`".

### Reference-Files für CC

- `src/app/buch/[slug]/page.tsx` — heutige Detail-Page (port forward + slim down).
- `src/app/buecher/page.tsx` — heutiger Catalogue (extend mit Audit-Mode).
- `src/app/buecher/SortPills.tsx` — Vorlage für das URL-write-via-`router.replace`-Pattern, das die Audit-Filter-Pillen brauchen.
- `src/db/schema.ts` lines 206–507 — works / bookDetails / Junctions / work_collections.
- `scripts/apply-override.ts` — wo `raw_name` befüllt wird; hilft beim mentalen Modell der Audit-Trail-Spalten.
- `sessions/2026-05-14-072-impl-resolver-batch-2.md` — Triage-Material-Quelle (Counts, Smoke-Slugs, Long-Tail).
- `brain/wiki/decisions/faction-policy.md` — Browse-Root vs. Tree-Root, wenn du Faction-Hierarchy im Audit-View nahelegen willst.

### Suggested commit shape

Vorschlag, aber wenn du es anders schneidest, fein:

1. *`/buch/[slug]` slim-down* — Audit-Felder rauslöschen (waren da noch nie alle drin, aber sicherheitshalber), diskreter Audit-Link rein.
2. *`/buch/[slug]/audit/page.tsx`* — neue Route + alle Sektionen + Robots-Noindex.
3. *`/buecher` Audit-Mode-Pillen + Filter-Logik* — eigene Client-Komponente (`AuditPills.tsx`?), URL-State, AND-Multi-Select.
4. *Audit-Modus-Listen-Zeile-Erweiterung* — `BookRow` ergänzt um Audit-Strap, Direkt-Link auf `/audit`.

### Was Cowork bewusst *nicht* festgelegt hat

- Param-Name (`?audit=...` vs. `?view=audit`+Filter-Params vs. Sub-Pfad `/buecher/audit?...`)
- Pillen-Form, Hover-State, Active-State, Spacing
- Drift-Marker-Treatment (Pille-mit-zweiter-Klasse vs. Surface-Form-als-Kicker vs. Tooltip)
- Header-Composition auf `/buch/[slug]/audit` (Grid vs. Definition-List vs. Strip)
- Exakte Copy für Section-Titel, Empty-States, Links
- Animations-Timings, oklch-Triplets, Spacing-Skala

Das ist alles dein Spielraum.
