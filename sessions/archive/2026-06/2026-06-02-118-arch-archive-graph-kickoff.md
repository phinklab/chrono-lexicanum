---
session: 2026-06-02-118
role: architect
date: 2026-06-02
status: archived
slug: archive-graph-kickoff
parent: 2026-06-01-113
links:
  - 2026-06-01-109
  - 2026-06-01-113
  - 2026-06-01-114
commits: []
---

# Archive-as-Graph - Kickoff

> **Historischer Nordstern, nicht direkt implementieren.** Dieser Kickoff haelt
> die erste "Archiv als Graph"-Fassung fest. Die Produktgewichtung wurde danach
> in Brief 119 korrigiert: **Medienarchiv zuerst, Kontextgraph als Navigation**.
> Der erste ausfuehrbare Product-Brief ist Brief 120.
>
> **Archiviert 2026-06-03.** Nordstern in Board 121 (Product) gefaltet.

## Goal

Das Archiv von Insel-Seiten und Sonderfaellen zu einem zusammenhaengenden
Graphen machen: jeder Entity-Typ ist ein Knoten, jede Referenz ein Link, und
Detailansichten koennen im App-Kontext als Panel oder bei Direktlink als volle
Seite erscheinen.

Dieser Brief beschreibt die Mechanik-Idee. Die spaetere Reframe-Entscheidung aus
Brief 119 ist fuer Produktprioritaet und IA massgeblich.

## Entscheidungen (erste Fassung, 2026-06-02)

1. **Buch = vereinheitlicht.** Das Buch teilt die visuelle Grammatik der
   Entity-Hubs und oeffnet als Panel sowie als volle Seite. Es bleibt der
   reichste Eintrag: Synopsis, Kauf-/Hoer-Links, Facets, Audit.
2. **Panel statt Side-Sheet-Irritation.** App-Klicks sollen Details im Kontext
   oeffnen; Direktlink, Reload und Share sollen dieselbe Ansicht als volle Seite
   laden.
3. **Facets = Deep-Link in gefilterte Werke-Liste.** Ein Facet fuehrt nach
   `/werke?facet=...`, nicht in einen eigenen Hub.
4. **Eine Huelle, geteilte Primitive, getrennte Bodies.** Panel-Huelle,
   A11y/Scrim/Route-Mechanik und visuelle Primitive werden geteilt. Entity- und
   Buch-Bodies komponieren diese Primitive, bleiben aber getrennte Bodies.

## Zielmodell (erste Fassung)

- **Knoten:** Buch, Charakter, Fraktion, Welt, Facet -> Browse, Aera, Serie,
  Person/Autor.
- **Kanten:** jede Referenz ist ein Link; Soft-Nav oeffnet im App-Kontext,
  Hard-Nav/Refresh als volle Seite.
- **Auffahrten:** Startseite, Suche, Werke-Browse.
- **Module:** Chronicle, Cartographer und Ask fuehren in denselben Graphen und
  wieder heraus.
- **`/atlas`:** Maintainer-/Audit-Cockpit, nicht oeffentliches
  Navigationsrueckgrat.

## Superseded by

- Brief 119: korrigiert die Produktgewichtung. Buecher und Podcasts sind der
  Medien-Kern; Entities sind Kontext- und Einstiegsknoten, keine flachen Peers.
- Brief 120: erster ausfuehrbarer Product-Schritt fuer `/`, `/werke`,
  `/podcasts`, `/fraktionen`.

## Out of scope

- Schema / DB / Resolver.
- Neue Bilder oder reiche Entity-Fakten.
- Facet-Hubs.
- `/atlas` als oeffentlicher Wegweiser.

