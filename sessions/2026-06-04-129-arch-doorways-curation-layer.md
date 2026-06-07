---
session: 2026-06-04-129
role: architect
date: 2026-06-04
status: open
slug: doorways-curation-layer
parent: 2026-06-02-120
links:
  - 2026-06-02-118
  - 2026-06-02-119
  - 2026-06-02-120
  - 2026-06-03-121
  - 2026-06-03-122
  - 2026-06-01-113
  - 2026-06-02-114
commits: []
---

# 129 - Doorways & curation layer (home-regroup, topic-threads, curated characters)

> **Entscheidungs-/Nordstern-Inkrement, kein One-Shot-Implementier-Brief.**
> Erweitert Brief 120, ersetzt nichts. Die ausfuehrbare Arbeit landet als Zeilen
> auf den Boards 121 (Product-UI) + 122 (Batches-Daten) und wird pro Task per
> Chat gebrieft. Diese Datei haelt die IA-Entscheidung fest, damit sie nach der
> Session nicht verloren ist.

## Goal

Die Medienarchiv-IA fuer einen Erstbesucher **lesbar** machen und die zwei noch
fehlenden Tueren bauen, die Philipp will: kuratierte **Themen-Straenge**
("Hot Topics") und eine **kuratierte Charakter-Galerie** (Primarchen + Spotlight).
Beide als duenne **Kurations-Schicht** ueber vorhandenen Daten - kein neuer
Lore-Text, kein Wiki.

Der Kern-Satz, auf den dieser Brief die Seite festlegt: **Der Medienkatalog
(Buecher + Podcasts) ist das eine Rueckgrat; jede andere Flaeche ist eine
beschriftete Tuer hinein, die sich nur in ihrer Achse unterscheidet** - Thema
(Fraktionen/Charaktere/Straenge), Zeit (Chronicle), Raum (Cartographer),
Empfehlung (Ask), Roh-Browse (`/werke`). Tueren fuehren zurueck zu Medien. Kein
Wiki: bei uns ist die Magnus-Seite kein Lore-Artikel, sondern ein Weg zu
Buechern und Podcasts.

## Design freedom - read before everything else

Optik, Layout und Mikrocopy gehoeren CC (frontend-design Skill). Ausdruecklich an
CC uebergeben: die **visuelle Form der drei Home-Baender** (Karten, Sektionen oder
Akkordeon - deine Wahl), das Tile-Design, das Layout der Themen-Strang-Seite, das
Layout der Charakter-Galerie inklusive **wie der Primarchen-Tier optisch liest**,
die gesamte Copy/Voice, Farben, Spacing, Typo, Motion-Timings, Klassen-Shapes,
oklch-Werte. `/werke` + Chronicle sind die optische Blaupause (Boards 120/121),
die atmosphaerische HUD-Sprache der Home bleibt. Dieser Brief fixiert nur die
**Informationshierarchie + Contracts** unten, nicht den Look. Wenn hier irgendwo
ein Pixel-, ms- oder Klassenwert auftaucht, ist das ein Fehler - ueberschreib ihn.

## Context

- **Brief 120 (implemented):** Home benennt das Archiv und bietet Einstiege zu
  `/werke`, `/podcasts`, `/fraktionen`, Chronicle, Cartographer, Ask; `/atlas`
  ist zum Maintainer-Cockpit degradiert. Heutige Home = `src/app/page.tsx` +
  `src/components/home/ToolsAccordion.tsx` - eine **flache 6-Reihen-Liste**
  (Works/Podcasts/Factions/Ask/Chronicle/Cartographer als gleichrangige Peers).
  Das ist die "alles gleich wichtig"-Falle, die dieser Brief aufloest.
- **Entity-Hubs existieren:** `/charakter|fraktion|welt/[slug]` auf geteilter
  `EntityView` (Brief 109/113), oeffnen bei Soft-Nav als `@modal`-Panel.
  `/fraktionen` ist der Fraktions-Guide-Index. Podcasts sind echte `works`
  (Brief 114, `kind in (podcast, podcast_episode)`).
- **Schema-Falle (wichtig fuer die Begrifflichkeit):** In-universe-Figuren =
  `characters` (Magnus, Eisenhorn). `persons` = **real-world** Autoren/Sprecher.
  Die kuratierte Charakter-Tuer geht ueber `characters`, nicht `persons`.
- **Kurations-Konvention existiert schon:** committed JSON unter
  `scripts/seed-data/` (`ask-curation.json`, `facet-catalog.json`,
  `collection-gaps.json`). Die Kurations-Schicht braucht **kein** neues Schema.
- Vorhandene Junctions tragen die Counts: `work_factions`, `work_characters`,
  `work_locations`, Podcast-Tag-Junctions aus Brief 114. Live-Counts kommen aus
  der DB, nicht aus der Kurations-JSON.

## Decisions

1. **Home = drei lesbare Baender** (Inhalt/Hierarchie fix, visuelle Form = CC):
   - **Band 1 - Bestand:** Werke - Podcasts. "Was hier drin ist."
   - **Band 2 - Tueren nach Thema:** Fraktionen - Charaktere (kuratiert) -
     Hot Topics. Jede Kachel ist "Tuer -> Buecher + Podcasts dahinter",
     mit Live-Counts aus vorhandenen Junctions. (Welten = optionale spaetere
     Tuer, 2026-06-04 bewusst raus aus diesem Scope.)
   - **Band 3 - Linsen:** Chronicle (Zeit) - Cartographer (Raum) - Ask (Guide).
   Die Gruppierung selbst ist die Besucher-Fuehrung; sie soll fast ohne
   Erklaertext lesen.
   **Manifestation (P1, 2026-06-04, nach Philipps Home-Rebuild):** Die Baender
   rendern als die vorhandene `MORE TO EXPLORE`-Contents-Liste (Section 3 der neu
   gebauten Home), segmentiert durch drei Part-Divider. Row-Grammatik bleibt 1:1
   (Index + Serif-Titel + Italic-Gloss + Latin-Sigil + Hairline + Chevron); die
   neuen Tueren werden als zusaetzliche Zeilen in Band 2 eingefuegt. Die aktuelle
   Reihenfolge (Works/Podcasts -> Factions -> Ask/Chronicle/Cartographer) sitzt
   bereits auf den Baendern. **Gruppen-Titel in Klartext (Philipp 2026-06-04,
   kein Latein auf Gruppen-Ebene): Band 1 = "The Library", Band 2 = "Browse by
   Topic", Band 3 = "Discover More".** Die per-Zeile Latin-Sigils
   (LIBRORVM/VOX/...) bleiben als Deko neben dem Klartext-Zeilentitel.
   Divider-Optik, Nummerierungs-Stil und Motion-Reflow = CC; den exakten Wortlaut
   der drei Titel darf CC fein justieren, aber sie bleiben allgemeinverstaendlich
   (kein nicht-uebersetztes Latein als Gruppen-Header). Nummerierung lueckenlos
   01-08 (kein 05-Gap nach Worlds-Removal: Factions=03, Characters=04, Hot
   Topics=05, Ask=06, Chronicle=07, Cartographer=08). Roemische Ziffer I/II/III
   am Part-Divider bleibt wie im Screenshot; nur das lateinische Part-Wort
   weicht dem Klartext-Titel.
2. **Hot Topics = kuratierte Themen-Straenge.** Ein Strang = ein von Philipp
   kuratiertes Buendel: Titel, kurzer Blurb, handverlesene Referenzen auf
   Buecher + Podcasts (+ optional Entities). Index `/themen`, Detail
   `/thema/[slug]`. Die Detailseite **komponiert vorhandene Primitive**
   (RelatedWorks-/EntityView-Grammatik) - kein Fork, kein Prosa-Generator. Das
   ist genau, was sie zum Guide statt zum Artikel macht.
3. **Charakter-Tuer = kuratierte Auswahl ueber `characters`, mit Primarchen-Tier.**
   **Nicht** die flachen ~490. Eine kleine Kurations-Liste markiert
   Spotlight-Charaktere und welche davon Primarchen sind. Galerie-Index
   `/charaktere` zeigt **nur die kuratierten**; Primarchen lesen als eigener
   Tier/Sektion. Nicht-kuratierte Charaktere bleiben erreichbar ueber
   Fraktions-Guides + Suche + ihre vorhandenen Detail-Hubs.
4. **Kurations-Schicht = committed JSON ueber vorhandene IDs, kein Schema.**
   Beide neuen Inhaltstypen sind kleine handgepflegte seed-data-JSONs, die auf
   vorhandene work-/entity-IDs zeigen; serverseitige Loader joinen gegen Postgres
   fuer Live-Titel/Counts. Einfachste ehrliche Sache, Praezedenz `ask-curation.json`.
   **Revisit-Trigger:** wenn Straenge per-Item-State, Ordering at scale oder
   User-Submission brauchen -> dann DB-Tabellen (`topics`/`topic_items`).
5. **Baut auf 120, ersetzt nichts.** `/werke`, `/podcasts`, `/fraktionen`, die
   `/atlas`-Degradierung stehen alle. Facets deep-linken weiter nach
   `/werke?facet=...` (kein Facet-Hub, kein Themen-Hub-Ersatz dafuer).

## Strand-Split (seedet die Boards)

- **Product (121):** Home-3-Baender-Regroup (verfeinert P1); `/themen` +
  `/thema/[slug]`; `/charaktere` kuratierte Galerie + Primarchen-Tier;
  Live-Counts auf den Band-2-Kacheln. Guide-Treatment dieser Flaechen verwendet
  `EntityView`/Listen-Primitive wieder (haengt an P5).
- **Batches (122):** die kuratierte Themen-Strang-JSON + die
  kuratierte-Charakter/Primarchen-Auswahl-JSON anlegen (referenzieren vorhandene
  IDs); 1-2-Satz-Blurbs reiten auf B3 (Entity-Blurbs). Kein Schema, kein Resolver.

## Constraints

- TS strict; Server Components default; kein `db`-Import in Client Components;
  `params`/`searchParams` awaited.
- Neue Routen ASCII-Deutsch, konsistent mit Bestand: `/themen`, `/thema/[slug]`,
  `/charaktere`. URL-/searchParam-Contracts der vorhandenen Routen intakt.
- Kuratierte Flaechen rendern **nur** aus vorhandenen DB-Daten + den
  Kurations-JSONs. Kein neuer Lore-/Wiki-Text, kein LLM-Prosa-Generator, keine
  neuen Entity-Bilder.
- Kuration referenziert vorhandene IDs; eine **dangling ID faellt laut** im Loader
  (build-sichtbar), nicht still.
- `prefers-reduced-motion`, sichtbarer Keyboard-Fokus, lesbarer Kontrast.
- Keine Version-Pins (CC recherchiert/pinnt).

## Out of scope

- Flacher ~490-Charakter-Index als primaere Tuer (ausdruecklich verworfen).
- Neues Schema / Migration / Resolver; DB-gestuetzte Topics.
- Universal-Search-Verdrahtung (eigener Arc), neue Entity-Bilder, lange
  Lore-Artikel.
- `/map` Feature-Aenderungen (nur Theme-Erbe).
- `/welten`-Tuer + Index - near-free Parallele zu `/fraktionen`; optionaler
  Follow-up wann Philipp will, **bewusst nicht dieser Scope** (2026-06-04
  bestaetigt).

## Acceptance (Entscheidungs-Ebene; Task-Acceptance kommt per Board-Chat-Brief)

Die Entscheidung ist festgehalten, wenn:

- [ ] Dieser Brief das 3-Baender-Home-Modell, die zwei kuratierten Tueren, die
      JSON-Kurations-Schicht und die Routen traegt - doc-only, auf `main`.
- [ ] Board 121 Zeilen traegt fuer: Home-3-Baender-Regroup, `/themen` +
      `/thema/[slug]`, `/charaktere` kuratierte Galerie + Primarchen-Tier.
- [ ] Board 122 Zeilen traegt fuer: kuratierte Themen-Strang-JSON,
      kuratierte-Charakter/Primarchen-Auswahl-JSON.
- [ ] `sessions/README.md` Active-Threads aktualisiert.

## Open questions (fuer Implementier-Zeit / fuer Philipp am Task-Brief)

- Themen-Strang-Granularitaet: Ereignisse ("Belagerung von Terra"), Boegen
  ("Horus Heresy") oder beides? (Pro Strang bei der Kuration entscheidbar, keine
  strukturelle Wirkung.)
- `/charaktere`: nur kuratiert, oder kuratiert-zuerst + "alle zeigen"-Notausgang
  in den Long-Tail? (Default: nur kuratiert; Long-Tail via Suche.)
- Primarchen: Tier innerhalb `/charaktere`, oder zusaetzlich eine near-free
  `/primarchen`-gefilterte Sicht? (Default: Tier innerhalb; `/primarchen`
  optional.)

## Notes

- **Praezedenz (Recherche).** AO3 mappt 1:1: fan-made, "Works" sind das Objekt,
  navigiert wird Fandom -> Filter nach Character/Relationship/Freeform-Tag, kein
  Wiki. Fraktion ~ Fandom; Hot-Topics ~ Freeform-/Additional-Tags. Letterboxds
  "Popular This Week" + kuratierte Listen = die lebendige Themen-Strang-Flaeche.
- Eine Themen-Strang-Detailseite ist strukturell ein Entity-Hub (kuratierte Liste
  von Werken/Podcasts + Nachbarknoten) -> vorhandene `EntityView`/`RelatedWorks`-
  Primitive komponieren. Das haelt sie als Guide statt Artikel.
- Konvergenz-Hinweis fuer CC: Band-2-Kachel, Fraktions-/Charakter-/Themen-Tile
  und die Hub-Header teilen dieselbe "Tuer -> Medien + Count"-Grammatik; ein
  geteiltes Primitive lohnt, statt drei Varianten.
