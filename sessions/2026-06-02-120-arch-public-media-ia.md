---
session: 2026-06-02-120
role: architect
date: 2026-06-02
status: open
slug: public-media-ia
parent: 2026-06-02-119
links:
  - 2026-06-02-118
  - 2026-06-02-119
  - 2026-06-01-113
  - 2026-06-02-114
commits: []
---

# Public media IA - home, works, podcasts, factions

## Goal

Die oeffentliche Website um den neuen Product-Nordstern reorganisieren:
**Buecher zuerst, Podcasts als zweite Medien-Saeule, Kontextknoten als Wege
zurueck zu Medien.** Ergebnis dieses Schritts sind klare Einstiege (`/`,
`/werke`, `/podcasts`, `/fraktionen`) und Facet-/Filter-Links, noch keine
Detail-/Panel-Ueberarbeitung.

## Context

Brief 113 ist gemergt: `/charakter`, `/fraktion`, `/welt` rendern echte
`EntityView`s und oeffnen in der App via `@modal`-Slot als Panel. Brief 114 ist
gemergt: `podcast` und `podcast_episode` existieren als `works.kind`, der
40k-Lorecast liegt mit 149 Episoden und Entity-Junctions in der DB.

Heute ist die Home stark immersiv, aber nicht klar genug als Medienarchiv. Die
oeffentliche Buchliste lebt unter `/buecher`; `/atlas` erscheint noch als Tool,
ist aber Maintainer-Cockpit. Philipp will: Buchdatenbank als Kern behalten,
Podcasts sichtbar machen, Fraktionen als Guide-Einstieg, alles fluide klickbar,
aber kein Wiki.

Relevante Dateien: `src/app/page.tsx`, `src/components/home/ToolsAccordion.tsx`,
`src/app/buecher/page.tsx`, `src/components/entity/*`,
`src/lib/entity/{loader,types}.ts`, `src/db/schema.ts`.

## Design freedom

Optik, Layout und Mikrocopy gehoeren CC. Nutze die bestehende reworkte
Chrono-Aesthetik, aber mache die erste Ansicht funktional klarer: Besucher
sollen sofort sehen, dass sie Buecher, Podcasts, Fraktionen und Tools betreten
koennen. Keine neue Landingpage-Prosa-Wand, keine Bilderpflicht.

**Visuelle Leitplanke (wichtig):** Die neue IA soll nicht wie ein Fremdsystem
aussehen. Fuer **Ansichten und Bedienelemente** (Buchlisten, Filter, Navi,
Sortierung, Medienkarten, Fraktions-Index) sind die aktuelle Archive-/`/buecher`
-Seite und Chronicle die Referenz: dichte, scanbare Listen, klare HUD-Labels,
praezise Kanten, ruhige Kontrollflaechen, guter Rhythmus. Fuer **Hintergrund,
Atmosphaere und Bewegung** ist die aktuelle Home die Referenz: bewegte
HUD-Elemente, Auspex-/Readout-Gefuehl, kurze Texte als Stimmungstraeger,
Tiefe im Hintergrund. Heisst: die neuen Seiten sollen die Nutzbarkeit von
Archive/Chronicle mit der lebendigen Hintergrundsprache der Home verbinden.

## Constraints

- **Medienarchiv zuerst.** Home- und Nav-Struktur muessen Buecher/Werke,
  Podcasts und Fraktionen vor `/atlas` sichtbar machen. `/atlas` bleibt
  erreichbar/admin-seitig, wird aber nicht als oeffentliches Tool beworben.
- **`/werke` wird der oeffentliche Buch-Browse.** Nutze die bestehende
  `/buecher`-Logik als Basis. CC entscheidet, ob `/buecher` intern bleibt,
  redirectet oder als Alias bestehen bleibt; der kanonische neue Einstieg ist
  `/werke`.
- **Filter sind URL-gespiegelt.** `/werke` soll mindestens `q`, `era`,
  `faction`, `format`, `availability`, `facet`, `sort` als Query-Filter
  unterstuetzen, soweit vorhandene Daten es tragen. Facet-Chips fuehren nach
  `/werke?facet=<facetId>`. Kein Facet-Hub.
- **`/podcasts` nutzt vorhandene DB-Works.** Liste Shows (`kind='podcast'`) und
  deren Episoden (`kind='podcast_episode'`) aus der DB. Minimal reicht: Show-
  Cards, Episodenzahl, letzte Folgen, und Links zu kanonischen Detail-URLs, wenn
  diese in diesem Schritt mitfallen. Wenn Detailrouten zu gross werden, bleiben
  sie explizit fuer den naechsten Brief im Report.
- **`/fraktionen` ist ein Medien-Guide-Index.** Liste Fraktionen mit
  vorhandenen Counts: Buecher, Podcastfolgen, ggf. Key-Characters/Subfactions.
  Link zu `/fraktion/[id]`. Keine langen Lore-Beschreibungen.
- **Home-Suche nicht faken.** Wenn noch keine echte Universal Search gebaut wird,
  darf die Home-Suche nur eine echte vorhandene Funktion ausloesen (z.B.
  `/werke?q=...`) oder sichtbar als Browse-Suche scoped sein. Keine tote
  Omnibox.
- **Panel-Mechanik nicht neu bauen.** Brief 113s `@modal`-Slot bleibt wie er ist.
  Detail-/Panel-Anreicherung ist Folge-Brief, nicht dieser Schritt.
- **Keine neuen Bilder.** Vorhandene `works.coverUrl`/Podcast-Art darf benutzt
  werden; keine Entity-Image-Slots.
- TypeScript strict, Server Components wo moeglich, keine DB-Imports in Client
  Components.

## Out of scope

- Universal Search via `resolveSurfaceForm`.
- Detail-/Panel-Ueberarbeitung (`EntityView`-Datenbanner, Podcastgruppen im
  Panel, Fraktionsdetail als Guide) - Folge-Brief.
- Weitere Podcast-Ingests - Batches-Folge.
- Schema, Migration, Resolver-Umbau.
- Lange Wiki-/Lore-Texte und neue Entity-Bilder.

## Acceptance

Die Session ist fertig, wenn:

- [ ] Home (`/`) benennt das Produkt klar als Warhammer-40k-Bucharchiv mit
      Podcast-Saeule und bietet sichtbare Einstiege zu `/werke`, `/podcasts`,
      `/fraktionen`, Chronicle, Cartographer und Ask.
- [ ] `/atlas` ist nicht mehr der oeffentliche Tool-/Home-Einstieg; die Route
      selbst bleibt unveraendert erreichbar fuer Maintainer.
- [ ] `/werke` rendert die Buchdatenbank mit URL-Filtern (`q`, `era`,
      `faction`, `format`, `availability`, `facet`, `sort` soweit Daten
      vorhanden) und Facet-Chips linken nach `/werke?facet=...`.
- [ ] `/podcasts` rendert die persistierten Podcast-Works aus Brief 114
      (mindestens die Show + Episodenuebersicht fuer den 40k Lorecast).
- [ ] `/fraktionen` rendert einen Guide-Index aus vorhandenen DB-Daten:
      Fraktionsname, Medien-Counts, Link zu `/fraktion/[id]`.
- [ ] Die visuelle Umsetzung orientiert sich sichtbar an Archive/Chronicle fuer
      UI-Elemente und Views sowie an Home fuer Hintergrund, HUD-Bewegung und
      atmosphaerische Texte; sie wirkt nicht wie eine neue, abgetrennte Designsprache.
- [ ] Keine neuen Entity-Bilder, keine langen Lore-Artikel, keine Schema- oder
      DB-Aenderungen.
- [ ] Desktop und schmale Breite sind visuell geprueft; Text ueberlappt nicht.
- [ ] `npm run lint`, `npm run typecheck`, `npm run build`, und
      `npm run brain:lint -- --no-write` gruen oder im Report begruendet, falls
      ein command wegen Umgebung nicht laufen konnte.
- [ ] Implementer-Report geschrieben; Briefstatus im PR auf `implemented`
      geflippt.

## Open questions for the report

- Soll `/buecher` dauerhaft als Alias zu `/werke` bleiben, oder nur redirecten?
- Haben Podcast-Detailrouten in diesen Scope gepasst? Wenn nein: exakte
  naechste Naht nennen.
- Welche Filter fuehlen sich mit echten Daten gut an, welche sind duenn oder
  audit-lastig und sollten aus der public UI raus?
- Welche Fraktions-Counts/Sortierung geben den besten Guide-Effekt?

## Notes

Naechster Brief nach diesem Schritt: **Media-aware context surfaces**. Der soll
`EntityView`/Panel und `/fraktion/[id]` als Reading/Listening Guides umbauen:
Podcastgruppen linken, kleine datengetriebene Banner ("12 books / 5 podcast
episodes / linked to Prospero"), Buch-Entity-Chips als Links, Facets zu
`/werke?facet=...`. Dieser Schritt hier baut erst die oeffentliche Richtung.
