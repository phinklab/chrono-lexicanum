---
session: 2026-05-27-103
role: architect
date: 2026-05-27
status: implemented
slug: audit-drift-gap-sweep
parent: null
links:
  - 2026-05-27-102-arch-hh-consolidation-pass
  - 2026-05-27-102-impl-hh-consolidation-pass
  - 2026-05-15-075-arch-cockpit-drift-sort-and-rating
  - 2026-05-15-075-impl-cockpit-drift-sort-and-rating
  - 2026-05-14-073-arch-maintainer-audit-cockpit
  - 2026-05-26-100-arch-resolver-hh
commits: []
---

# Audit-Cockpit Drift/Gap-Sweep — Signal-zu-Noise post-HH

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
- Die Default-Sichtbarkeit der Toggle-Pille: sichtbar nur wenn `?audit=gap` aktiv, oder immer? URL-Persistenz (eigener Search-Param?) oder Session-only (localStorage)? Beide Wege sind okay — wähle, was sich zum restlichen Filter-Verhalten konsistent anfühlt.
- Das visuelle Anzeigen der Drift-Tie-Group-Sub-Sortierung: in der Row-Anzeige sichtbar (z.B. "drift via `Luna Wolves` × 12"), oder unsichtbar im Backend? Wenn sichtbar, in welchem Format. Wenn unsichtbar, ist das ebenfalls okay.
- Pixel-Werte, oklch-Triplets, Stagger-/Animations-Timings, exakte Klassen-Shapes, Copy-Voice der neuen Pille — alles deins.

Was ich vorgebe, sind **Outcomes und Datenquellen**, nicht Pixel:

- Audio-Drama-Source-of-Truth: `bookDetails.format === 'audio_drama'`. Existiert bereits als Enum in `src/db/schema.ts` (Zeile 150–163, `bookFormat`), wird in `CatalogueBook.format` schon durchgereicht (`src/app/buecher/page.tsx` Zeile 283). Kein neues Feld, kein neues Facet, kein Schema-Touch.
- Filterscope: **nur Gap-Bucket.** Drift ist format-unabhängig (Cross-Era-Aliases gelten für Novels genauso wie für Audio-Dramen), die Audio-Drama-Behandlung bleibt strikt auf `?audit=gap` beschränkt.
- Drift-Sub-Sort-Achse: primär `raw_name`-Häufigkeit über den unresolved Surface-Forms, sekundär Axis-Triple `(faction-drift, location-drift, character-drift)`, tertiär `updatedAt DESC`. Begründung steht in § Context.

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

- **Audio-Drama-Filter wirkt nur auf `?audit=gap`.** Auf `?audit=drift`, `?audit=ssot`, `?audit=collections` bleiben Audio-Dramen unverändert sichtbar — der Filter ist eine Gap-Bucket-Eigenschaft, kein globaler Cockpit-Filter.
- **Default-Verhalten von `?audit=gap`: dämpfen, nicht filtern.** Audio-Dramen bleiben in der Liste sichtbar, sind aber visuell als "erwartet sparse" gekennzeichnet (gedimmt + Marker — Form ist deine Wahl). Eine Toggle-Pille daneben versteckt sie hart, wenn der Maintainer klickt.
- **Toggle-Pille-Persistenz**: URL-Search-Param oder localStorage — wähle, was zum restlichen Filter-Verhalten passt. Wenn URL-Param, ist ein neuer Key okay (z.B. `?audit=gap&hide-audio=1`), oder das Pillen-Set unter `?audit=` erweitert. Persistenz über Page-Reload muss funktionieren, Persistenz über Session-End ist Bonus.
- **Drift-Tie-Group-Sub-Sortierung**: innerhalb der `drift_count=2 / confidence=1.00`-Tie-Group erst nach **raw_name-Häufigkeit über den unresolved Surface-Forms** sortieren (Bücher mit den global häufigsten unresolved Surface-Forms zuerst), dann nach **Axis-Triple** `(faction-drift, location-drift, character-drift)`, dann nach **updatedAt DESC** (heutiger Default). Die Sub-Sort wirkt nur wenn der Drift-Filter aktiv ist (`?audit=drift`).
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

- [ ] `/buecher?audit=gap` zeigt Audio-Drama-Bücher visuell gedämpft + mit einem klaren Marker (Form ist CC-Wahl); ein lesbarer Toggle-Mechanismus versteckt sie hart, wenn aktiviert.
- [ ] Die Audio-Drama-Behandlung wirkt **nur** auf `?audit=gap`. `?audit=drift`, `?audit=ssot`, `?audit=collections`, AND-Kombinationen (`?audit=drift,gap`) sehen Audio-Dramen unverändert.
- [ ] `/buecher?audit=drift` sortiert innerhalb der `drift_count=2 / confidence=1.00`-Tie-Group nach raw_name-Häufigkeit primär, Axis-Triple sekundär, updatedAt DESC tertiär. Bücher mit den global häufigsten unresolved Surface-Forms erscheinen zuerst.
- [ ] Drift-Tie-Group-Sub-Sortierung wirkt nur wenn `?audit=drift` aktiv ist; Default-Sortierung der Liste ohne Audit-Filter bleibt unverändert.
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
5. **Toggle-Persistenz-Mechanismus**. Welche Form hast du gewählt — URL-Search-Param oder localStorage? Begründung.
6. **Brief 096 / Design-Direction-Kollision**. Hat das laufende lokal-iterative Brief-096-Redesign deine Filter-/Pillen-Sprache beeinflusst? Wenn ja, wie hast du das aufgelöst?

## Notes

- **Strang-Disziplin (Brief 095, Rollup-Ownership)**: beide Impl-Pässe laufen in ihren jeweiligen Worktrees. **Product**: `chrono-lexicanum-product`. **Batches**: `chrono-lexicanum-batches`. CC checkt am Session-Start den aktuellen Pfad via `git branch --show-current` + `git status --short --branch`, kündigt Worktree+Strang+Branch in einem Satz an, und hält an wenn der Worktree nicht zum Pass passt (UI-Arbeit im Batches-Worktree oder umgekehrt → halt, ask back). Detail in `CLAUDE.md` § "Parallel worktrees" + § "Brain & Atlas".
- **PR-Policy**: beide Impl-Pässe sind Code-Pässe (UI = `src/`, Daten = `scripts/` + `scripts/seed-data/`) → branch + PR, wie üblich. Brief 103 selbst (diese Datei) ist doc-only → committet direkt auf `main` ohne Branch.
- **Branch-Vorschläge** (CC kann andere wählen, Hauptsache sie machen die Strang-Zugehörigkeit lesbar):
  - UI-Pass: `codex/product-audit-drift-gap-sweep`
  - Daten-Pass: `codex/ingest-batches-audit-pilot`
- **Brief-Status-Flip**: jeder Pass flippt den Brief-Status `status: open → implemented` in seinem PR mit (eine Zeile Edit in der Frontmatter dieser Datei). Wenn beide Pässe parallel laufen und der eine zuerst mergt, ist das okay — der zweite Pass kann den Brief-Status weiter auf `implemented` halten (idempotent), oder Cowork räumt den Status im Post-Merge-Pass auf. Keine harte Sequenz nötig.
- **HH-0260 / HH-0270 Recherche-Quellen** (informativ, du darfst andere wählen):
  - HH-0260 *Hunter's Moon* — Space-Wolves-Audio mit Bjorn-Era-Setting (Sons-of-Russ-mode pre-Heresy). Pass-15-Dossier §6 hat es als `low_confidence:characters` geflaggt → Implementierer kannte Lore-Anker, hat sie nicht durchgeschrieben.
  - HH-0270 *Iron Corpses* — Iron-Warriors-at-Tallarn-Single-Arc (post-Phall, pre-Tallarn-Front). Characters-Achse leer (c=0) — Tallarn-Engagements haben fest definierte Captain-Casts, sollten resolvable sein.
  - Recherche-Quellen: Lexicanum-Page pro Audio-Drama, Black-Library-Audio-Listings, ggf. Fan-Wikis für sekundäre Validation. Lore-Anker, die nicht in einer dieser Quellen explizit benannt sind, gehören NICHT in den Override (Halluzinations-Schutz).
- **Pre-existing Lint-Warning**: `@next/next/no-page-custom-font` in `src/app/layout.tsx:44` ist seit langem da, Strang-fremd; ignorierbar (nicht durch diesen Brief eingeführt).
- **Skill-Note (UI-Pass)**: der frontend-design Skill ist hier richtig am Platz — Pillen-Form / Dämpf-Visualisierung / Marker-Symbol sind genau die Pixel-Entscheidungen, die er besser trifft als Cowork.
- **Dokumentation post-Merge**: Cowork zieht Brief-103-Outcomes nach dem Merge in `project-state.md` § What's open (Audit-Cockpit-Punkt → ggf. closed oder reduziert), `pipeline-state.md` (verify-pass-NEW-Range gap_works-Counts post-Pilot-Backfill), `open-questions.md` (keine numerierte OQ neu — die laufenden ~10–20 Backfill-Kandidaten bleiben Maintainer-Excel-Workflow, nicht OQ), `sessions/README.md` (Active-Threads-Update). Alles im Koordinations-Worktree, doc-only auf `main`.
