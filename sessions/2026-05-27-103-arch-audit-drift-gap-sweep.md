---
session: 2026-05-27-103
role: architect
date: 2026-05-27
status: open
slug: audit-drift-gap-sweep
parent: null
links:
  - 2026-05-27-102-arch-hh-consolidation-pass
  - 2026-05-27-102-impl-hh-consolidation-pass
  - 2026-05-15-075-arch-cockpit-drift-sort-and-rating
  - 2026-05-15-075-impl-cockpit-drift-sort-and-rating
  - 2026-05-14-073-arch-maintainer-audit-cockpit
  - 2026-05-26-100-arch-resolver-hh
  - 2026-05-28-103-impl-data-audit-drift-gap-sweep
commits: []
---

# Audit-Cockpit Drift/Gap-Sweep — Signal-zu-Noise post-HH

## Implementation status (2026-05-28 Cowork-Update)

Dieser Brief ist als **Strang-Split** angelegt — UI-Pass im Product-Worktree + Daten-Pass im Batches-Worktree, parallel und unabhängig.

- **Daten-Pass — done & merged (PR #109, 2026-05-28).** `npm run audit:gap-candidates` als read-only Triage-Helper gelandet (325 Kandidaten Raw-Output, HH=73 W40K=252); zwei Pilot-Backfills HH-0260 *Hunter's Moon* + HH-0270 *Iron Corpses*; NEW-Range gap_works 18→16. Impl-Report: [`2026-05-28-103-impl-data-audit-drift-gap-sweep.md`](./2026-05-28-103-impl-data-audit-drift-gap-sweep.md).
- **UI-Pass — open.** Audio-Drama-Dämpfung im Gap-Bucket + Drift-Tie-Group-Sub-Sortierung. Spec vollständig in diesem Brief (§ Constraints / UI + § Acceptance / UI + § Design freedom). Branch z.B. `codex/product-audit-drift-gap-sweep`, Worktree `chrono-lexicanum-product`.

CC hatte den Brief-Status nach dem Daten-PR auf `implemented` geflippt (Brief-§-Notes idempotent-Konvention). Cowork hat ihn am 2026-05-28 nach Codex-Review **bewusst zurück auf `open` gesetzt**, damit der "höchster offener Brief"-Flow im UI-Pass sauber greift. Der UI-PR flippt den Status wieder auf `implemented`.

Die Codex-Review-Punkte vom 2026-05-28 (Drift-Comparator-Schärfung, URL-Persistenz-Festlegung, AND-Semantik-Implementations-Regel, Browser-Smoke in Acceptance) sind in den entsprechenden Sektionen unten eingearbeitet — sie ändern Outcomes nicht, sondern reduzieren Implementations-Mehrdeutigkeit.

## Goal

Das Audit-Cockpit (`/buecher?audit=drift` und `/buecher?audit=gap`) wieder lesbar machen. Post-HH-Wellen meldet die NEW-Range Audit-Replica in `verify-pass.ts` kumulativ ~148 drift_works + ~98 gap_works über die HH-Domain. Die große Mehrheit ist erwartet / strukturell — Drift sind Cross-Era-Aliases + Honor-Title-Splits + Primarchen-Pattern (ADR-Disziplin), Gap sind Audio-Drama-Single-Axis-Pieces. Echte fixable Data-Quality-Lücken sind ~10–20 Bücher unter den ~246 roten Pillen. Brief 103 baut den Filter, die Sortierung und den Triage-Workflow, der die echten Kandidaten herausschält.

Drei Achsen, zwei Implementations-Pässe:

- **UI-Pass** (Product-Worktree): Audio-Drama-Dämpfung im Gap-Bucket + Drift-Tie-Group-Sub-Sortierung nach `raw_name`-Häufigkeit.
- **Daten-Pass** (Batches-Worktree): `audit:gap-candidates`-Helper-Skript + 2 Pilot-Override-Backfills (HH-0260 *Hunter's Moon*, HH-0270 *Iron Corpses*) als Workflow-Demo.

Der Rest der ~10–20 Backfill-Kandidaten ist laufender Maintainer-Excel-Sweep, kein einmaliger Architektur-Brief.

## Design freedom — read before everything else

Du hast den **frontend-design Skill** installiert und bist bei den ästhetischen Entscheidungen dieses Briefs besser als ich. Alles Visuelle ist **deine Wahl**:

- Wie genau ein "gedämpftes" Audio-Drama in der Gap-Liste aussieht — Opacity, Farbverschiebung, Schrifttyp-Tonalität, Größe des Markers. Ich sage nur, dass es noch lesbar bleibt, aber unmissverständlich als "erwartet sparse" liest. Nicht "wegradiert".
- Der genaue Markersymbol für Audio-Drama (🎧, 📻, ein Glyph, ein Text-Tag, eine schmale farbige Borderlinie) und seine Position in der Row. Konsistent mit dem restlichen `/buecher`-Cockpit-Stil.
- Die Form der Toggle-Pille ("Audio-Dramen ausblenden") — Sub-Pille rechts neben der Gap-Pille? Sekundäre Toolbar darunter? Inline-Switch? Egal — was zur bestehenden `AuditPills.tsx`-/`SortPills.tsx`-Sprache passt.
- Die Default-Sichtbarkeit der Toggle-Pille (visuelle Sichtbarkeit, **nicht** Persistenz-Mechanismus): sichtbar nur wenn `?audit=gap` als alleiniger Filter aktiv ist, oder schon vorher dezent? — deine Wahl.
- Das visuelle Anzeigen der Drift-Tie-Group-Sub-Sortierung: in der Row-Anzeige sichtbar (z.B. "drift via `Luna Wolves` × 12"), oder unsichtbar im Backend? Wenn sichtbar, in welchem Format. Wenn unsichtbar, ist das ebenfalls okay.
- Pixel-Werte, oklch-Triplets, Stagger-/Animations-Timings, exakte Klassen-Shapes, Copy-Voice der neuen Pille — alles deins.

Was ich vorgebe, sind **Outcomes und Datenquellen**, nicht Pixel:

- Audio-Drama-Source-of-Truth: `bookDetails.format === 'audio_drama'`. Existiert bereits als Enum in `src/db/schema.ts` (Zeile 150–163, `bookFormat`), wird in `CatalogueBook.format` schon durchgereicht (`src/app/buecher/page.tsx` Zeile 283). Kein neues Feld, kein neues Facet, kein Schema-Touch.
- Filterscope: **nur Gap-Bucket, und zwar nur bei genau einem aktiven Filter.** Drift ist format-unabhängig (Cross-Era-Aliases gelten für Novels genauso wie für Audio-Dramen), die Audio-Drama-Behandlung bleibt strikt auf den Single-Filter-Modus `?audit=gap` beschränkt. Implementations-Regel: `auditFilters.length === 1 && auditFilters[0] === "gap"`. Bei jeder AND-Kombination (`?audit=drift,gap`, `?audit=gap,ssot`, …) bleiben Audio-Dramen unverändert sichtbar (Codex-Review-Punkt, 2026-05-28).
- Drift-Sub-Sort-Quelle: die **resolved drift rawNames** aus den Audit-Rows in `src/app/buecher/page.tsx` (`factionAuditRows`, `locationAuditRows`, `characterAuditRows`). "Drift" heißt hier konkret: `rawName !== null && rawName !== "" && rawName !== name` (`countResolvedDrift`-Definition, Zeile 121–127). Diese rawNames sind canonical-resolved (z.B. `Luna Wolves` → `sons_of_horus`), tragen also Surface-Form-Information — das Wording "unresolved Surface-Forms" in der Brief-Erstfassung war ein Fehlgriff (Codex-Review-Punkt, 2026-05-28). Es geht um die Cross-Era-Alias-Häufigkeit, nicht um unauflösbare Strings.
- Drift-Sub-Sort-Achse: primär **`sum(freq(rawName))` über alle drift-Junctions des Buchs** (= Summe der globalen Häufigkeit jeder im Buch vorkommenden drift-rawName-Surface-Form, DESC), sekundär **Axis-Triple lexicographic DESC auf `(factionDriftCount, locationDriftCount, characterDriftCount)`** (Buch mit mehr Faction-Drift zuerst — Cross-Era-Aliases sind die Top-Cluster-Kategorie aus dem 100er-ADR), tertiär **`updatedAt DESC`** (heutiger Default). Begründung: Bücher mit hohem Drift-Volume × Cluster-Häufigkeit zuerst — der Maintainer sieht zuerst die Bücher, deren Surface-Forms global am stärksten cluster-bestätigt sind, weil dort der Reference-Layer-Erweiterungs-Hebel am höchsten ist. Begründung des `sum`- statt `max`-Calls: simpel, deterministisch, korrelliert Drift-Häufigkeit zusätzlich mit Drift-Volume.

Architektonisch fest (nicht-verhandelbar):

- Keine Schema-Migration, keine neuen DB-Felder, keine neuen Drizzle-Tables. Alle Datenpunkte sind heute schon da.
- Drift-Sub-Sort und Audio-Drama-Filter dürfen die existierende `sortBooks()`-Pipeline in `src/app/buecher/page.tsx` (Zeile 324+) erweitern, nicht ersetzen. Defaults bleiben Defaults, nur die Tie-Group-Behandlung ändert sich.
- Der `audit:gap-candidates`-Helper im Daten-Pass-Strang liest die DB read-only, schreibt kein Override und triggert keinen Resolver-Lauf. Output ist Konsole (+ optional Markdown unter `ingest/.last-run/` oder einem äquivalenten Audit-Pfad — deine Wahl).

## Context

### Wo wir stehen (Stand 2026-05-27, post-PR-108)

- PR #108 (Brief 102 / HH-Konsolidierungs-Pass) ist gemergt. Korpus ist datenkomplett **und** über beide Domänen konsolidiert: 859/859 Bücher, 489 characters, 288 locations, 202 factions; Brief-094-§-Cadence-Bogen geschlossen.
- Cross-Era-ADR positiv validiert (cross-era-anchor-breach Aggregator-Tripwire = 0 Treffer über 18 pinned Surface-Forms in Pass 2 — siehe `decisions/cross-era-identities.md`).
- `verify-pass.ts` trägt einen Out-of-Range-Bolt-on (Brief 101 § Open questions, in Brief 102 gefaltet); Pass-2-Lauf = 0 (positiver Full-Corpus-Tripwire).
- Offene OQ-Queue: OQ (3) Hand-Check-Workflow, OQ (13) Crawl-Simplification — beide nicht akut, keine in Brief 103 gefaltet.

### Was Brief 103 löst

Nach den fünf HH-Wellen 11–15 schreibt die NEW-Range Audit-Replica in `scripts/verify-pass.ts` kumulativ **~148 drift_works + ~98 gap_works** über die HH-Domäne (Pass-15-Forecast). Beispielzahl Pass 15 (44 Bücher): 25 drift_works (~57 %) + 18 gap_works (~41 %). Cockpit-User-Erlebnis heute: `/buecher?audit=drift` und `/buecher?audit=gap` zeigen 246 Bücher als "rote Pille — prüfen". Davon ist die große Mehrheit false alarm:

- **drift_works** sind mehrheitlich Cross-Era-Aliases + Honor-Title-Splits + Primarchen-Pattern. `raw_name="Luna Wolves"` zeigt auf canonical `sons_of_horus`, `raw_name="Kharn"` auf `kharn_the_betrayer`. Das ist KEIN Bug, das ist genau das ADR-Verhalten aus Brief 100. Die `drift`-Pille flagt sie trotzdem, weil das technische Kriterium (`raw_name ≠ canonical.name`) erfüllt ist.
- **gap_works** sind mehrheitlich Audio-Drama-Single-Axis-Pieces. HH-0260 *Hunter's Moon* (`f=2, l=0, c=0` — Single-Scene Space-Wolves-Audio), HH-0270 *Iron Corpses* (`f=1, l=1, c=0` — Iron-Warriors-at-Tallarn-Single-Arc), HH-0290 *Blackshields: The Broken Chain* (`f=2, l=0, c=2` — Endryd-Haar-Trilogy-Closer) sind Pass-15-Beispiele. Strukturell sparse — nicht weil Daten fehlen, sondern weil's eine 60-Minuten-Audio-Folge auf einem unbenannten Schiff ist.

Aus den ~246 sind nur ~10–20 echte fixable Data-Quality-Lücken (Pass-15-Forecast: HH-0260 + HH-0270 als die wahrscheinlichsten Backfill-Kandidaten — beide bieten lore-anchored Achsen-Punkte, die der Pass-Implementierer übersprungen hat, weil das Korpus-Token-Budget dünn war).

### Drift-Sortier-Pille rangiert flat

Zusätzlich: die Drift-Frequenz-Sort-Pille rangiert 19/20 Top-Treffer **flat auf `drift_count=2 / confidence=1.00`** (Brief-075-impl-Punkt 3, an Brief 096 angedockt aber noch nicht implementiert — siehe `open-questions.md` (10-historic) Note „Cockpit-Refinements"). Heute wird die Tie-Group via `updatedAt DESC` differenziert (`sortBooks()` in `src/app/buecher/page.tsx:330–344`). Das macht den Sortier-Output auch ohne Audio-Drama-Filterung schwer lesbar — der Maintainer sieht 20 fast identische Drift-Zeilen ohne Triage-Signal.

### Architekturkonzept

Aus den drei Achsen werden zwei Implementations-Pässe, sauber strang-getrennt:

- **UI-Pass** (Product-Strang, `chrono-lexicanum-product`): Audit-Filter-Refinement + Drift-Sortierung. Branch z.B. `codex/product-audit-drift-gap-sweep`. Berührt `src/app/buecher/` und ggf. `src/app/buch/[slug]/audit/`. Kein Daten-Touch, kein Schema, kein Override.
- **Daten-Pass** (Batches-Strang, `chrono-lexicanum-batches`): `audit:gap-candidates`-Helper-Skript + 2 Pilot-Override-Edits (HH-0260, HH-0270). Branch z.B. `codex/ingest-batches-audit-pilot`. Berührt `scripts/` (neues Skript) und `scripts/seed-data/manual-overrides-ssot-hh-026.json` (HH-0260) + `scripts/seed-data/manual-overrides-ssot-hh-027.json` (HH-0270). Kein UI-Touch.

Die zwei Pässe sind **unabhängig** und können **parallel** laufen. Der UI-Pass setzt nicht den Helper-Skript-Output voraus (er filtert client-side gegen `bookDetails.format`); der Daten-Pass setzt nicht die UI-Pille voraus (das Skript läuft gegen die DB, nicht gegen die UI). Maintainer kann zwei `codex`-Terminals parallel öffnen, jeweils in einem der zwei Worktrees.

## Constraints

### Allgemein

- **TypeScript strict, App Router server components default.** Keine `any`, keine unnötigen Client-Komponenten. Wo Filter-State Client-State braucht, ist `'use client'` okay (analog zu den bestehenden `AuditPills.tsx` / `SortPills.tsx`).
- **Keine Versions-Pins.** Wenn neue Dependencies nötig wären (sollten sie nicht — alles im bestehenden Stack machbar), bitte vorher im Report rechtfertigen.
- **Keine Schema-Migration, keine DB-Felder, keine Drizzle-Schema-Touches.** Audio-Drama-Source ist `bookDetails.format === 'audio_drama'` (bookFormat-Enum, existiert), Drift-Daten kommen aus dem existierenden `*_audit`-Spalten-Material in `work_factions`/`work_locations`/`work_characters`.

### UI-Pass (Product-Worktree)

- **Audio-Drama-Behandlung wirkt ausschließlich bei exakt einem aktiven Filter = `gap`.** Implementations-Regel (verbindlich, Codex-Review-2026-05-28): `auditFilters.length === 1 && auditFilters[0] === "gap"`. Bei jeder anderen Filter-Kombination — `?audit=drift`, `?audit=ssot`, `?audit=collections`, AND-Kombis wie `?audit=drift,gap` oder `?audit=gap,ssot` — bleiben Audio-Dramen unverändert sichtbar. **Nicht** `auditFilters.includes("gap")` prüfen; das würde AND-Kombis falsch einschließen.
- **Default-Verhalten im Single-Gap-Modus: dämpfen, nicht filtern.** Audio-Dramen bleiben in der Liste sichtbar, sind aber visuell als "erwartet sparse" gekennzeichnet (gedimmt + Marker — Form ist deine Wahl). Eine Toggle-Pille daneben versteckt sie hart, wenn der Maintainer klickt.
- **Toggle-Persistenz: URL-Search-Param-only, kein localStorage** (Codex-Review-2026-05-28). Der gesamte `/buecher`-Filter-Flow ist heute URL-getrieben (`AuditPills.tsx` via `useSearchParams`+`router.replace`, `parseAudit(sp.audit)` server-side in `page.tsx`); localStorage würde unnötigen Client-State, Hydration-/Flash-Risiko und nicht-teilbare URLs einführen. **Konkreter Key**: ein zusätzlicher Search-Param neben `audit=` — Empfehlung `?audit=gap&hideAudio=1`, exakter Key/Wert ist deins (alternativ ein Wert-Erweiterungs-Pattern auf `audit=`, falls das im AuditPills-Stil organischer wirkt). Server-side parsen wie `parseAudit`, Toggle als kleines Client-Island analog `AuditPills.tsx`. Default ohne Param = dämpfen-aber-sichtbar.
- **Drift-Tie-Group-Sub-Sortierung** (greift innerhalb der existierenden Drift-Sortier-Pipeline in `sortBooks()` für den Drift-Branch, nicht als separater Sort-Modus):
  - **Datenquelle**: die `factionAuditRows` / `locationAuditRows` / `characterAuditRows` in `getBooks()` tragen pro Junction `rawName` und `name`. "Drift-rawName" = Row mit `rawName !== null && rawName !== "" && rawName !== name` (exakt die `countResolvedDrift`-Definition, Zeile 121–127). Diese sind **canonical-resolved** (z.B. `Luna Wolves` → `sons_of_horus`) — das Wording "unresolved Surface-Forms" in der Brief-Erstfassung war falsch.
  - **Pre-pass (single sweep, vor `sortBooks()`)**: über das gesamte Catalog-Set genau eine Aggregation `globalDriftFreq: Map<rawName, count>` aufbauen — pro Vorkommen einer drift-Junction (jede der drei Audit-Row-Listen) den `rawName` zählen. Das ist die globale Häufigkeit jeder drift-Surface-Form über alle Bücher × alle drei Achsen.
  - **Per-book Score**: `driftScore(book) = sum( globalDriftFreq.get(row.rawName) ?? 0 ) over all drift-rows in factionAuditRows ⊎ locationAuditRows ⊎ characterAuditRows of this book`. Architektonische Wahl `sum` statt `max`: simpel, deterministisch, korrelliert Cluster-Häufigkeit zusätzlich mit Drift-Volume — ein Buch mit drei drift-Junctions auf globalen Top-Cluster-Surface-Forms rangiert vor einem Buch mit einer Junction auf demselben Cluster. (Codex-Review-2026-05-28 hat zu Recht beanstandet, dass der Brief das nicht festgelegt hatte.)
  - **Comparator-Reihenfolge im Drift-Branch von `sortBooks()`**:
    1. `driftCount DESC` (bestehender Primär-Schlüssel, bleibt; tie-bricht zwischen 2 und 3, 3 und 4 …)
    2. `confidence DESC` (bestehender Sekundär-Schlüssel, bleibt)
    3. **NEU: `driftScore DESC`** (`sum(freq(rawName))` wie oben)
    4. **NEU: Axis-Triple lexicographic DESC auf `(factionDriftCount, locationDriftCount, characterDriftCount)`** — Buch mit mehr Faction-Drift zuerst (Cross-Era-Aliases als Top-Kategorie aus dem 100er-ADR), dann Locations, dann Characters
    5. `updatedAt DESC` (bestehender Tertiär-Schlüssel, bleibt — jetzt Quintär)
    6. `externalBookId ASC` (bestehender Stabilisator, bleibt)
  - Die Sub-Sort-Schritte 3+4 wirken **nur im Drift-Branch** (Comparator wird ohnehin nur dort betreten); der Default-Sort ohne Audit-Filter bleibt vollständig unverändert.
  - Implementierung darf den Pre-pass in `getBooks()` ranspannen (Datenfluss zwischen Audit-Rows und Sort-Funktion ist heute über `CatalogueBook.audit` vermittelt — entweder `driftScore` + Axis-Triple in `CatalogueBook.audit` aufnehmen, oder die globale Frequenz-Map als Closure in den Sort-Aufruf reichen). Form-Detail-Wahl ist deins; Outcome: deterministischer Sort über die Tie-Group, kein DB-Touch.
- **Cockpit-Refinements in `/buch/[slug]/audit`**: wenn die Sub-Sort-Sichtbarkeit auf der Detailseite Sinn ergibt (z.B. "dieses Buch hat drift via `Luna Wolves` × 12, gehört zur Top-Tie-Group"), gerne — aber out-of-scope-fail-safe wenn die Detailseite nichts anzeigen muss. Architektonisches Outcome: die Audit-Detailseite bleibt funktional unverändert; alle Drift/Gap-Refinements landen primär in der Listenansicht `/buecher`.
- **No-regression auf die existierenden Filter.** `?audit=drift`, `?audit=ssot`, `?audit=collections`, kombinierte AND-Filter (`?audit=drift,gap`), Sort-Pillen — alles bleibt unverändert.

### Daten-Pass (Batches-Worktree)

- **`npm run audit:gap-candidates`** als neues Script-Subkommando in `package.json` + Implementierungs-Skript in `scripts/audit-gap-candidates.ts` (oder analoger Pfad — wähle). Read-only gegen die DB.
- **Output-Form**: Konsolen-Listing der Bücher mit `hasJunctionGap === true AND bookDetails.format !== 'audio_drama'`. Pro Buch: `external_book_id`, `slug`, `title`, `format`, `f/l/c`-Counts, ggf. `confidence`. Optional eine Markdown-Datei unter `ingest/.last-run/audit-gap-candidates.md` (oder analog) für späteren Diff. Form-Detail-Wahl ist deins.
- **Idempotent + reproduzierbar.** Zwei aufeinanderfolgende Läufe gegen den unveränderten DB-Stand produzieren denselben Output (sortierter, deterministischer Output).
- **Pilot-Bücher: HH-0260 *Hunter's Moon* + HH-0270 *Iron Corpses***. Override-Edits in `scripts/seed-data/manual-overrides-ssot-hh-026.json` (HH-0260, Welle 026 = HH-0251..HH-0260) bzw. `manual-overrides-ssot-hh-027.json` (HH-0270, Welle 027 = HH-0261..HH-0270). Die Edits sind regulärer Maintainer-Override-Schema-Stoff: Locations + Characters füllen, wo Lore-Anker existieren (HH-0260 ist im Pass-15-Dossier §6 als `low_confidence:characters` geflaggt — der Implementierer hat die Achsen-Daten erkannt, aber nicht durchgeschrieben). Recherche-Quelle ist Lexicanum / Black-Library-Listings für die jeweiligen Audio-Dramen.
- **Pilot-Backfill-Verification**: nach den Override-Edits ein erneuter `npm run test:apply-override-dry` + ein gezielter `verify-pass.ts`-Run gegen die `ssot-hh-026/027`-Range. Die NEW-Range gap_works-Zahl sollte um 2 sinken (`HH-0260` + `HH-0270` raus aus dem Gap-Bucket). Im Impl-Report die pre/post-Counts dokumentieren.
- **`npm run audit:gap-candidates`-Output nach den Pilot-Backfills**: HH-0260 + HH-0270 verschwinden aus der Kandidatenliste. Die Restliste (~10–20 echte Backfill-Kandidaten) bleibt für den laufenden Maintainer-Excel-Sweep stehen.

## Out of scope

- **Brief 096 (Design-Direction) nicht anfassen.** Brief 096 läuft als laufendes lokal-iteratives Site-weites Redesign im Product-Worktree. Brief 103 bleibt audit-cockpit-spezifisch — wenn der Cockpit-Filter mit dem 096-Redesign zusammenstößt, fügen wir's später zusammen. Keine globalen Style-Token-Touches, keine `globals.css`-Erweiterungen, die das Site-weite Design verändern.
- **Den Cockpit-Drift/Gap-Threshold-Algorithmus nicht neu erfinden.** Drift/Gap-Detection lebt seit Brief 073 in `src/app/buecher/page.tsx` (`countResolvedDrift()`, `hasJunctionGap`). Brief 103 polished nur Sichtbarkeit / Sortierung / Sparse-Marker, nicht die Erkennung selbst.
- **Nicht alle ~10–20 fixable Backfills im selben Brief.** Der Daten-Pass macht 2 Pilots als Workflow-Demo, der Rest läuft als laufender Maintainer-Excel-Sweep (Maintainer entscheidet pro Buch und schiebt einen Override in den nächsten passenden `ssot-hh-NNN`-Override; Cowork pflegt das nicht als Architektur-Brief).
- **Public-Page-Rating-Render nicht.** `bookDetails.rating` ist in der DB, `/buch/[slug]` rendert es heute nicht — das gehört in Brief 096 (laufende Buchseiten-Redesign). Brief 103 ist Cockpit-only.
- **Keine Schema-Migration.** Wenn Drift-raw-name-Häufigkeit eine Aggregations-Query braucht, ist das in der Read-Path-Logik in `src/app/buecher/page.tsx` zu lösen, nicht via neue DB-Spalte oder Materialized View.
- **Keine Persistenz von gefilterten Maintainer-Entscheidungen.** Wenn der Maintainer sagt "HH-0290 ist eh Audio-Drama, ignoriere", landet das nicht in einer DB-Tabelle ("seen / acknowledged / suppressed") — das ist eine spätere Erweiterung, hier explizit nicht. Pro Pageload neue Sicht.
- **Keine HH-domain-spezifischen UI-Pfade.** Audio-Drama-Filter wirkt domain-agnostisch (W40K hat ebenfalls Audio-Dramen, z.B. `format=audio_drama` in W40K-0250+). Nicht "HH-only".
- **Kein neuer Brain-/Wiki-Page-Schreibe-Versuch aus den Strang-Worktrees.** Brief 095 / Rollup-Ownership: `brain/**` + `sessions/README.md` werden ausschließlich im Koordinations-Worktree geschrieben. Beide Impl-Reports landen als pro-Session-Datei (single-writer, conflict-free), Cowork zieht das in den Brain-Pages im Post-Merge-Pass nach.

## Acceptance

Der Brief ist done wenn — strang-getrennt prüfbar:

### UI-Pass

- [ ] `/buecher?audit=gap` (Single-Gap-Modus) zeigt Audio-Drama-Bücher visuell gedämpft + mit einem klaren Marker (Form ist CC-Wahl); ein lesbarer Toggle-Mechanismus (URL-Search-Param, kein localStorage) versteckt sie hart, wenn aktiviert.
- [ ] Die Audio-Drama-Behandlung wirkt **ausschließlich bei `auditFilters.length === 1 && auditFilters[0] === "gap"`.** Belegt durch das Verhalten unter `?audit=drift`, `?audit=ssot`, `?audit=collections`, **und insbesondere unter AND-Kombinationen wie `?audit=drift,gap` und `?audit=gap,ssot`** — Audio-Dramen sind dort unverändert sichtbar (weder gedämpft noch über die Toggle-Pille versteckbar).
- [ ] Toggle-Persistenz ist URL-Search-Param-basiert (z.B. `?audit=gap&hideAudio=1`, exakter Key/Wert ist CC-Wahl), server-side geparst, kein localStorage. Reload auf der gleichen URL behält den Zustand; der Link ist teilbar.
- [ ] `/buecher?audit=drift` sortiert innerhalb der existierenden `driftCount` / `confidence`-Tie-Groups nach `driftScore DESC` (= sum globaler drift-rawName-Frequenz) primär, dann Axis-Triple lex-DESC `(factionDriftCount, locationDriftCount, characterDriftCount)` sekundär, dann `updatedAt DESC` tertiär. Bücher mit den global häufigsten resolved drift-rawNames erscheinen zuerst.
- [ ] Drift-Tie-Group-Sub-Sortierung wirkt nur im Drift-Branch von `sortBooks()`; Default-Sortierung der Liste ohne Audit-Filter (und die Sortierungen unter `?audit=gap`/`ssot`/`collections`) bleibt unverändert.
- [ ] **Browser-Smoke** (Codex-Review-2026-05-28, manuelle Sichtprüfung im Dev-Server reicht — kein automatisiertes E2E nötig): vier URL-Varianten auf Desktop **und** mobile Breite (≤ ~640px Viewport) inspizieren — `/buecher?audit=gap` (Default-Single-Gap: Audio-Dramen gedämpft sichtbar, Toggle-Pille sichtbar/erreichbar), `/buecher?audit=gap&hideAudio=1` (oder gewählter Toggle-Param: Audio-Dramen hart versteckt), `/buecher?audit=drift` (Tie-Group-Sub-Sort sichtbar an unterscheidbarer Reihenfolge bei zuvor flat-rangierten Treffern; Audio-Dramen unverändert sichtbar), `/buecher?audit=drift,gap` (AND-Kombi: Audio-Dramen unverändert sichtbar, keine Dämpfung, keine Toggle-Pille-Wirkung). Pro Variante kurz im Impl-Report festhalten: Pillen-/Row-Layout intakt (kein Overlap, keine umgebrochenen Pillen-Texte, lesbarer Marker).
- [ ] `npm run lint` + `npm run typecheck` grün; `npm run brain:lint -- --no-write` grün (keine neuen blocking Warnings); kein Schema-/DB-Touch.

### Daten-Pass

- [ ] `npm run audit:gap-candidates` produziert eine reproduzierbare, sortierte Liste der Bücher mit `hasJunctionGap === true AND bookDetails.format !== 'audio_drama'`. Output enthält pro Buch mindestens `external_book_id`, `slug`, `title`, `f/l/c`-Counts.
- [ ] HH-0260 *Hunter's Moon* und HH-0270 *Iron Corpses* sind als Pilot-Backfills in `scripts/seed-data/manual-overrides-ssot-hh-026.json` bzw. `manual-overrides-ssot-hh-027.json` editiert; die Override-Edits folgen dem bestehenden Override-Schema (Locations + Characters lore-anchored).
- [ ] Pre/Post-Backfill-Counts dokumentiert: NEW-Range gap_works im `verify-pass.ts`-Output für `ssot-hh-026/027` ist post-Backfill um 2 niedriger (HH-0260 + HH-0270 nicht mehr im Gap-Bucket).
- [ ] Post-Backfill-Lauf von `npm run audit:gap-candidates`: HH-0260 + HH-0270 verschwinden aus der Kandidatenliste.
- [ ] `npm run test:apply-override-dry` ok mit `out-of-range=0, unknown-work=0`; volle Resolver-Trias (`test:resolver`, `test:resolver-data`, `test:resolver-coverage`) grün; `test:collection-refs` grün; `npm run lint` + `npm run typecheck` + `npm run brain:lint -- --no-write` grün.

### Beides

- [ ] Beide Impl-Reports landen unter `sessions/2026-05-NN-103-impl-{ui|data}-audit-drift-gap-sweep.md` (oder analog — kebab-case slug-Variante deiner Wahl, solange beide Reports klar als Brief-103-Antworten erkennbar sind). Strand-Reports tragen "What I did" + "For next session"-Sektionen mit den Fakten, die Cowork im Post-Merge-Pass in `project-state.md` / `pipeline-state.md` / `open-questions.md` einarbeitet. Keine direkten `brain/**`- oder `sessions/README.md`-Edits aus den Strang-Worktrees (Brief 095, Rollup-Ownership).

## Open questions for your report

Inputs, die ich für die nächste Architekten-Session schätzen würde — keine Blocker:

1. **Konkrete Zahl der fixable Gap-Kandidaten post-Audio-Drama-Filter.** Wie viele Bücher hat `audit:gap-candidates` ausgespuckt (ohne HH-0260/HH-0270, die dann ge-backfilled sind)? Verteilt sich die Restliste über HH und W40K, oder ist sie HH-konzentriert?
2. **Verteilung der unresolved Surface-Forms in der Drift-Tie-Group.** Was sind die Top-5 globalen unresolved Surface-Forms (raw_name-Häufigkeit über alle drift_works)? Das ist Material für die nächsten Cross-Era-Alias-Cluster bzw. potenzielle Reference-Layer-Erweiterungen.
3. **Drift-Sub-Sort aus `*_audit`-Spalten direkt abfragbar?** Die `*_audit`-Spalten (factionAuditRows, locationAuditRows, characterAuditRows in `src/app/buecher/page.tsx`) tragen den `raw_name` pro Junction. Ist Aggregation client-side im Read-Path okay, oder rufst du nach einer DB-side-Aggregation (eine zusätzliche Drizzle-Query)?
4. **Pilot-Backfill-Qualität.** Wie groß war die Override-Edit-Größe pro Pilot-Buch (ungefähre Zeilenzahl pro Override-JSON-Block)? War die Lore-Anker-Recherche pro Buch trivial oder hat sie spezifische Quellen gebraucht (Lexicanum-Seite, Black-Library-Listing)? Material für den späteren Maintainer-Excel-Sweep-Schätzung.
5. **Toggle-Param-Key**. Welche Form hast du gewählt — `?audit=gap&hideAudio=1`, oder eine Erweiterung des `audit=`-Pillen-Sets (z.B. `?audit=gap,noaudio`)? Begründung.
6. **Brief 096 / Design-Direction-Kollision**. Hat das laufende lokal-iterative Brief-096-Redesign deine Filter-/Pillen-Sprache beeinflusst? Wenn ja, wie hast du das aufgelöst?
7. **Drift-Score-Datenfluss**. Hast du den globalen `driftFreq`-Pre-pass via `CatalogueBook.audit`-Erweiterung gefahren oder via Closure-Parameter in den Sort-Aufruf? Performance-Implikationen?

## Notes

- **Strang-Disziplin (Brief 095, Rollup-Ownership)**: beide Impl-Pässe laufen in ihren jeweiligen Worktrees. **Product**: `chrono-lexicanum-product`. **Batches**: `chrono-lexicanum-batches`. CC checkt am Session-Start den aktuellen Pfad via `git branch --show-current` + `git status --short --branch`, kündigt Worktree+Strang+Branch in einem Satz an, und hält an wenn der Worktree nicht zum Pass passt (UI-Arbeit im Batches-Worktree oder umgekehrt → halt, ask back). Detail in `CLAUDE.md` § "Parallel worktrees" + § "Brain & Atlas".
- **PR-Policy**: beide Impl-Pässe sind Code-Pässe (UI = `src/`, Daten = `scripts/` + `scripts/seed-data/`) → branch + PR, wie üblich. Brief 103 selbst (diese Datei) ist doc-only → committet direkt auf `main` ohne Branch.
- **Branch-Vorschläge** (CC kann andere wählen, Hauptsache sie machen die Strang-Zugehörigkeit lesbar):
  - UI-Pass: `codex/product-audit-drift-gap-sweep`
  - Daten-Pass: `codex/ingest-batches-audit-pilot`
- **Brief-Status-Flip** (aktualisiert 2026-05-28 nach Codex-Review): der Daten-Pass hat den Status im PR #109-Commit auf `implemented` geflippt. Cowork hat ihn anschließend bewusst zurück auf `open` gesetzt (siehe § Implementation status oben), damit der "höchster offener Brief"-Flow für den UI-Pass sauber greift. **Der UI-Pass flippt den Status in seinem PR wieder auf `implemented`** — eine Zeile Edit in der Frontmatter dieser Datei. Nach UI-PR-Merge ist der Brief final `implemented` und bleibt es; Cowork räumt im Post-Merge-Pass keinen weiteren Status mehr auf.
- **HH-0260 / HH-0270 Recherche-Quellen** (informativ, du darfst andere wählen):
  - HH-0260 *Hunter's Moon* — Space-Wolves-Audio mit Bjorn-Era-Setting (Sons-of-Russ-mode pre-Heresy). Pass-15-Dossier §6 hat es als `low_confidence:characters` geflaggt → Implementierer kannte Lore-Anker, hat sie nicht durchgeschrieben.
  - HH-0270 *Iron Corpses* — Iron-Warriors-at-Tallarn-Single-Arc (post-Phall, pre-Tallarn-Front). Characters-Achse leer (c=0) — Tallarn-Engagements haben fest definierte Captain-Casts, sollten resolvable sein.
  - Recherche-Quellen: Lexicanum-Page pro Audio-Drama, Black-Library-Audio-Listings, ggf. Fan-Wikis für sekundäre Validation. Lore-Anker, die nicht in einer dieser Quellen explizit benannt sind, gehören NICHT in den Override (Halluzinations-Schutz).
- **Pre-existing Lint-Warning**: `@next/next/no-page-custom-font` in `src/app/layout.tsx:44` ist seit langem da, Strang-fremd; ignorierbar (nicht durch diesen Brief eingeführt).
- **Skill-Note (UI-Pass)**: der frontend-design Skill ist hier richtig am Platz — Pillen-Form / Dämpf-Visualisierung / Marker-Symbol sind genau die Pixel-Entscheidungen, die er besser trifft als Cowork.
- **Dokumentation post-Merge**: Cowork zieht Brief-103-Outcomes nach dem Merge in `project-state.md` § What's open (Audit-Cockpit-Punkt → ggf. closed oder reduziert), `pipeline-state.md` (verify-pass-NEW-Range gap_works-Counts post-Pilot-Backfill), `open-questions.md` (keine numerierte OQ neu — die laufenden ~10–20 Backfill-Kandidaten bleiben Maintainer-Excel-Workflow, nicht OQ), `sessions/README.md` (Active-Threads-Update). Alles im Koordinations-Worktree, doc-only auf `main`.
