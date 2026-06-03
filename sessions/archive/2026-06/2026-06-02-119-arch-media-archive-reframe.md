---
session: 2026-06-02-119
role: architect
date: 2026-06-02
status: archived
slug: media-archive-reframe
parent: 2026-06-02-118
links:
  - 2026-05-31-109
  - 2026-05-31-110
  - 2026-06-01-113
  - 2026-06-01-114
commits: []
---

# Media archive reframe - books first, graph as navigation

> **Kein Implementier-Brief.** Dieses Dokument amendiert den Nordstern aus
> Brief 118: Das Archiv wird nicht zu einem flachen Wiki-Graphen. Es bleibt eine
> Buch- und Medien-Datenbank; der Graph ist die fluide Navigation darum herum.
> Der erste ausfuehrbare Schritt ist Brief 120.
>
> **Archiviert 2026-06-03.** Acceptance erfüllt (120 gemergt); Nordstern +
> Sequenz in die Boards 121/122 gefaltet.

## Goal

Den Product-Nordstern so schaerfen, dass CC die Website danach reorganisiert,
ohne Buecher, Podcasts, Fraktionen, Charaktere und Welten faelschlich gleich
zu gewichten.

## Decisions

1. **Medien-Kern statt flacher Graph.** Buecher sind der Kern des Archivs.
   Podcasts sind die zweite Medien-Saeule. Fraktionen, Charaktere, Welten,
   Aeren, Serien und Personen sind Kontextknoten, keine gleichrangigen
   Endziele.
2. **Unified detail view != equal product priority.** Eine geteilte Panel-/
   Detail-Huelle ist weiterhin richtig, aber sie bedeutet nur: alles bleibt
   anklickbar und im Lesefluss. Sie bedeutet nicht: alles ist ein Wiki-Artikel.
3. **Kontextknoten fuehren zurueck zu Medien.** Ein Magnus-/Thousand-Sons-/
   Prospero-Panel beantwortet nicht "alles Lore-Wissen", sondern: welche
   Buecher, Podcastfolgen, Reihen, Orte und Nachbarknoten haengen daran?
4. **Bestehende DB-Daten sichtbar machen.** Die Seite soll die erhobenen
   Junctions und Fakten nutzen: Counts, Werkgruppen, Rollen (`subject`,
   `mentioned`, `appears`, ...), haeufige Nachbarknoten, Facets und
   Podcast-Tags. Kleine Banner/Strips sind gut, solange sie aus vorhandenen
   Daten berechnet werden. Kein LLM-Prosa-Generator, keine neuen Lore-Texte.
5. **Keine Bilder in diesem Arc.** Cover/Podcast-Art, die bereits in `works` ist,
   darf genutzt werden. Neue Entity-Bilder/Portraits/Platzhalter sind out of
   scope.
6. **Fraktionen bekommen Wuerde als Guide, nicht als Wiki.** `/fraktionen` und
   `/fraktion/[id]` duerfen sich wie ein eigener Einstieg anfuehlen, aber als
   Reading/Listening Guide: Einstiegstitel, wichtige Reihen, Podcastfolgen,
   verwandte Charaktere/Welten, Timeline/Map-Links.
7. **Facets bleiben Filter.** Ein Facet fuehrt nach `/werke?facet=...`, nicht in
   einen eigenen Hub.
8. **`/atlas` bleibt Maintainer-Cockpit.** Kein oeffentlicher Wegweiser, keine
   Home-Card fuer normale Besucher.

## Target IA

Oeffentliche Haupteingaenge:

- `/` - kuratierter Einstieg: Suche/Quicklinks, Werke, Podcasts, Fraktionen,
  Chronicle, Cartographer, Ask.
- `/werke` - Buch-Browse als primaere Archivhalle; Filter und Facet-Deep-Links.
- `/podcasts` - Podcast-Browse: Shows und Folgen aus den `podcast` /
  `podcast_episode` Works.
- `/fraktionen` - Fraktions-Einstieg als Medien-Guide-Index.
- `/chronicle`, `/cartographer`, `/ask` - Linsen in denselben Bestand.
- Detailrouten (`/buch`, `/podcast`, `/charakter`, `/fraktion`, `/welt`,
  spaeter `/aera`, `/serie`, `/person`) - volle Seite bei Hard-Nav, Panel bei
  Soft-Nav, soweit verdrahtet.

Der Navigationssog ist:

`Home/Search/Browse/Tools -> Buch oder Podcast -> Kontext -> wieder zu Medien`.

## Sequence

1. **Brief 120 - Public media IA.** Home, `/werke`, `/podcasts`,
   `/fraktionen`; `/atlas` aus der oeffentlichen Navigation raus; Facets als
   `/werke`-Filter; keine Detail-/Panel-Ueberarbeitung.
2. **Folge-Brief - Media-aware context surfaces.** `EntityView`/Panel und
   `/fraktion/[id]` zeigen Podcastgruppen, Datenbanner und Guide-Struktur; nicht
   mehr nur "related works" als generische Karten. Buch-Chips und Facets werden
   zu Links.
3. **Folge-Brief - Search + module cross-links.** Universal Search verdrahten;
   Chronicle/Cartographer/Ask fuehren in dieselben Medien- und Kontextknoten.
4. **Batches-Folge - Podcast Step 3.** Weitere grosse Warhammer-Podcasts
   kuratiert ingestieren; Product rendert dann automatisch mehr Medien.

## Out of scope

- Schema- oder DB-Arbeit in Product-Briefs.
- Neue Entity-Bilder, Portraits, KI-Bilder, Platzhalter-Bilder.
- Lange Lore-/Wiki-Texte.
- Facet-Hubs.
- `/atlas` als oeffentlicher Navigationspfad.

## Acceptance

Dieses Reframe ist erledigt, wenn:

- [ ] Ein ausfuehrbarer erster Product-Brief existiert (Brief 120).
- [ ] Brief 120 die Leitplanke enthaelt: Medienarchiv zuerst, Kontextgraph als
      Navigation, nicht als flaches Wiki.
- [ ] Brief 120 baut auf dem aktuellen Stand auf: Brief 113 Entity-Panel und
      Brief 114 Podcast-Works sind bereits implementiert.

