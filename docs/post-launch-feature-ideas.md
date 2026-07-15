# Chrono · Lexicanum — Ideenliste Post-Launch-Features

> Ergebnis der Brainstorm-Session vom 2026-07-13 (Cowork). Basis: Schema-Sichtung
> (`src/db/schema.ts`) + Web-Tiefenrecherche (Reddit-Archive, Bolter & Chainsword,
> DakkaDakka, Goodreads, Fan-Tool-Landschaft; ~230 Suchen/Fetches über drei
> Research-Agents). Zweck: Input für Bewertungs-/Briefing-Sessions. Alle Ideen
> sind Post-Launch-Material — das Launch-Gate bleibt unberührt.

> **Statusänderung 2026-07-15 (Session 219):** Der Rahmensatz oben ist überholt —
> per Plan-Nachtrag ([`docs/launch-master-plan.md`](./launch-master-plan.md)
> § Entscheidungen → „Nachtrag — Werkstatt-Phase") wird diese Liste **vor** dem
> Launch in der Werkstatt-Phase besucht: jede Idee bekommt eine Bewertungsrunde
> und ein Maintainer-Urteil **„bauen / Backlog / verwerfen"** (nicht zwingend eine
> Umsetzung). Einstieg: Idee 2 (Doppelkauf-Warner) → Idee 1 (Status Imperialis) →
> Idee 3c (Statistiken), danach 4, 3a, 3b, 5, 6 und der Anhang als Kurz-Triage.
> Der Listeninhalt darunter bleibt unverändert das Brainstorm-Ergebnis vom
> 2026-07-13.

## Strategischer Kontext

- **Timing:** GW schließt die Black-Library-Website zum 31.08.2026 zugunsten einer
  App mit In-App-Zwang; die Community reagiert ablehnend („lock-in",
  „enshittification"). Der Appetit auf unabhängige, offene Referenzseiten ist
  aktuell auf einem Hoch — Rückenwind fürs Launch-Framing.
- **Quasi-Konkurrent:** [40ktimeline.com](https://40ktimeline.com/) ist live —
  597 Romane, zoombare Timeline, Entity-Graph, 52 Reading Orders, Quiz.
  Differenzierer von Chrono · Lexicanum: 896 Bücher, Cartographer,
  1.114 Podcast-Episoden, kuratierte Event-Spine mit Artwork, Facetten-/
  Mood-Klassifikation, Ratings, Availability-Daten. „Timeline + Quiz" allein ist
  kein Alleinstellungsmerkmal mehr; die Ideen unten setzen auf das, was nur wir
  haben.
- **Vertrauens-Befund:** Die Community belohnt quellenzitierende Genauigkeit
  (Lexicanum, „Arbitrator Ian") und bestraft unbelegte Claims (Fandom-Wiki,
  Loretuber). Zitierfähigkeit ist das Differenzierungsmerkmal, nicht Datenmenge.

---

## Idee 1 — Status Imperialis („Wann ist jetzt?")

**Was:** Eine kuratierte „Zustand der Galaxis heute"-Ansicht: aktuelles
Setting-Datum, die jüngsten Epochen-Events, „diese Bücher spielen jetzt gerade",
Kurzlage Imperium Sanctus/Nihilus.

**Platzierung (Philipp):** Eigene Seite **oder** in den Curator integriert —
Entscheidung offen.

**Datenbasis:** Vollständig vorhanden — `events` (Spine mit `dateLabel`, Tier,
Blurbs), `works.startY/endY` + `settingDateLabel`, `eras`. Reine Lese-/
Kurationsarbeit, kein Schema-Change.

**Offen:** Seitenzuschnitt (eigene Route vs. Curator-Sektion); wie viel
redaktionelle Prosa vs. rein datengetrieben; Update-Rhythmus bei neuen Büchern.

**Evidenz:** „What year is it / is time progressing?" und „Actual situation of
Imperium Nihilus?" sind seit einem Jahrzehnt die chronischsten Dauerfragen in
r/40kLore (266 bzw. 264 Punkte für fast identische Fragen im Abstand von drei
Jahren; GW liefert nichts Vergleichbares).

- <https://www.reddit.com/r/40kLore/comments/1i6ytcn/> (How has Imperium Nihilus not fallen?)
- <https://www.reddit.com/r/40kLore/comments/uvl7sz/> (What is the actual situation of Imperium Nihilus?)
- <https://www.reddit.com/r/40kLore/comments/kgnoq6/> (When is the „present" day?)

---

## Idee 2 — Doppelkauf-Warner (Containment-Explorer)

**Was:** „Enthalten in / Enthält"-Ansicht über Omnibus / Anthologie /
Kurzgeschichte, plus Overlap-Hinweis: „Wenn du X kaufst, besitzt du diese
N Titel bereits."

**Platzierung (Philipp):** Voraussichtlich Unterseite des Curators.

**Datenbasis:** Vollständig vorhanden — `work_collections` (196 Kanten, mit
`displayOrder`, `confidence`, `basis`), `book_details.format`, `availability`.
Fast reine UI-Arbeit.

**Offen:** Nur Explorer (pro Buch) oder zusätzlich interaktiver Modus „meine
Auswahl → Overlap-Rechnung"? Ob `confidence`/`basis` der Kanten mit angezeigt
wird (Synergie mit Idee 4).

**Evidenz:** Meistgewünschter ungebauter Service der Szene — Leser fürchten
Doppelkäufe und wünschen explizit eine Gesamtliste über Shorts/Novellas/Audio;
existierende Fan-Lösungen sind Excel-Fragmente.

- <https://www.goodreads.com/topic/show/1645848-horus-heresy-chronological>
- <https://bloody-plastic.com/projects/bl40knovels.html>

---

## Idee 3 — LotrProject-Paket (drei Teilfeatures)

Vorbild: [LotrProject](http://lotrproject.com/) (Timeline + Karte + Genealogie +
Buchstatistiken) — dieses Genre ist in 40k komplett unbesetzt.

### 3a) Charakter-Interaktions-Baum

**Was:** Visualisierung, welche Charaktere buch- und lore-übergreifend
miteinander interagieren — navigierbarer Graph/Baum, Einstieg z. B. beim
Imperator.

**Datenbasis — mit Lücke:** `characters` + `work_characters` (pov/appears/
mentioned) erlauben **Ko-Okkurrenz** („treten in denselben Werken auf"),
gewichtbar nach Rolle und Werkzahl. Echte *Beziehungs*-Semantik (Vater/Sohn,
Rivalen, getötet von …) existiert im Schema **nicht** — dafür bräuchte es eine
neue kuratierte Kanten-Tabelle (`character_relations` o. ä.).

**Offen (Kernentscheidung):** Reicht ein abgeleiteter Ko-Okkurrenz-Graph für
v1, oder direkt kuratierte Beziehungs-Tabelle (mehr Kurationsaufwand, aber erst
das gibt dem „ausgehend vom Imperator"-Baum Tiefe)? Rendering (Graph vs. Baum);
Ort (Compendium vs. eigene Route).

**Evidenz:** „Welche Bücher featuren Charakter X?" ist der zweithäufigste
Thread-Typ des Fandoms, beantwortet durch fehlbare Forums-Archäologie.

- <https://bolterandchainsword.com/topic/353525-novels-featuring-fabius-bile/>
- <http://lotrproject.com/> (Genealogie-Vorbild)

### 3b) Timeline auf der Map (Zeit-Scrub + Rift-Toggle)

**Was:** Anklickbare Timeline direkt im Cartographer: Klick auf einen Zeitpunkt
→ Karte passt sich an (Pins, Events, Zustand). Zusätzlich Pre-/Post-Great-Rift-
Toggle — UI-Platz: dort, wo heute Emperor's Light sitzt, als weitere wählbare
Ebene.

**Datenbasis:** Gut vorbereitet — Jahr-Filter existiert, `work_locations.atY`
datiert Werk↔Welt-Kanten, `events` haben Datierungen. **Neu wären:** Events als
Karten-Layer (`events` haben keine direkte Location-FK — läuft über Werk-Hooks
oder neue Kuration) und die Rift-Geometrie als handkuratiertes Overlay (wie die
15 Zonen).

**Offen:** Scrub-Granularität (Ären-Stufen vs. freies Jahr); eigene
`event_locations`-Kante ja/nein; Umfang der Rift-Grafik; Mobile-Performance
(Canvas-Pfad aus Session 192 beachten).

**Evidenz:** Stärkstes Einzelsignal der gesamten Recherche. Jamboniums
Karten-Timeline-Modus (Leaflet Playback: Play-Button + Slider, 750.M30–014.M31,
~120 verfolgbare Teilnehmer) war laut Autor der „original purpose" seines
9-Jahre-Projekts — deckt aber nur die Heresy ab; unsere Datierungen reichen
über alle acht Ären. Top-Kommentar des 1.195-Punkte-Kartenposts wünscht wörtlich
Filter + Hover-Zitate + Suche + Rift-Overlay. Selbst GWs offizielle Web-Map
wurde 2020 für die fehlende Timeline-Ebene kritisiert.

- <https://jambonium.co.uk/40kmap/> (Karte; Timeline-Modus via Button oben links)
- <https://jambonium.co.uk/2020/12/warhammer-map-update-timeline/> (Timeline-Modus-Ankündigung)
- <https://www.reddit.com/r/40kLore/comments/fvf6bs/> (1.195-Punkte-Map-Post inkl. Feature-Wunschliste)
- <https://www.thegamer.com/warhammer-40k-interactive-universe-map/> (Kritik an GWs offizieller Map)

### 3c) Statistics-Überblick („Librarium-Statistiken")

**Was:** Statistik-Seite(n): Bücher pro Jahrtausend vs. Erscheinungsjahr,
Autoren-Output über die Zeit, Seiten pro Serie, Rating-Verteilungen,
Fraktions-Abdeckung, meistbeschriebene Welten.

**Platzierung (Philipp):** Offen — wohin das gehört, ist noch unklar.

**Datenbasis:** Vollständig vorhanden (`works`, `book_details.pageCount/rating`,
Junctions, `persons`). Kein Schema-Change. Jede Grafik ist zugleich potenzielles
virales Launch-/Marketing-Material für Reddit.

**Offen:** Route/Einbettung; statisch generiert (passt zum Snapshot-Modell des
Launch-Plans) vs. interaktiv; welche 5–8 Charts die v1 bilden.

**Evidenz:** LotrProject-Statistikseiten als Vorbild mit Mainstream-Coverage;
Stats-Dashboards der Tabletop-Szene (Stat Check, 40kstats) zeigen, dass
zitierbare Dashboards zu Community-Infrastruktur werden.

- <http://lotrproject.com/statistics/books/>
- <https://www.stat-check.com/the-meta> · <https://40kstats.goonhammer.com/>

---

## Idee 4 — Provenienz sichtbar machen

**Was:** `source_kind`/`confidence` als dezentes „Quelle: …"-Badge in der UI —
mindestens bei Events und Setting-Datierungen (`settingMethod`/
`settingConfidence` existieren dort ebenfalls).

**Platzierung (Philipp):** Wo und wie genau — noch zu überlegen.

**Datenbasis:** Vollständig vorhanden, durchgängig durchs Schema (works, events,
external_links, work_collections).

**Offen:** UI-Form (Tooltip, Fußnoten-Glyph, Detail-Panel-Zeile); welche Flächen
zuerst; ob die Kurzvokabeln (`lex`, `fandom`, `tl`, `H/M/L`) ein
menschenlesbares Mapping brauchen.

**Evidenz:** Der Vertrauens-Befund der Recherche: Fandom-Wiki wird für unbelegte
Claims verachtet (420-Punkte-Thread), Lexicanum und quellenzitierende YouTuber
werden exakt dafür gefeiert.

- <https://www.reddit.com/r/40kLore/comments/v4y03h/> (Why is Lexicanum preferred to Fandom Wiki?)
- <https://www.reddit.com/r/40kLore/comments/1fe4yxk/> (Lore-YouTuber und Misinformation)

---

## Idee 5 — Podcasts auf der Buch-Detailseite

**Was:** Ein „Podcasts"-Abschnitt auf `/book/[slug]`: Episoden, die dieses Buch
besprechen.

**Platzierung (Philipp):** Buch-Seite selbst; muss noch geprüft werden.

**Datenbasis — mit Lücke:** Keine direkte Buch↔Episode-Kante. Zwei Wege:
(a) abgeleitet über gemeinsame Events (`event_works` trägt Buch-Hooks *und*
Podcast-Picks am selben Event — sofort nutzbar, aber nur für Event-gebundene
Bücher); (b) neue kuratierte Kante `episode_covers_work` für echte „Episode
bespricht Buch X"-Zuordnung (sauberer; Pflege evtl. in den Weekly-Refresh
integrierbar).

**Offen:** v1 über Event-Ableitung oder direkt die Junction; wie die
Episoden-Zuordnung künftig gepflegt wird.

**Evidenz:** Ein Cross-Media-Explorer (MCU-Timeline-Stil) existiert in 40k
nirgends; mit 1.114 verknüpfbaren Episoden sind wir die Einzigen mit der
Datenbasis — auch gegenüber 40ktimeline.com.

- <https://mcu-timeline.com/> (Genre-Vorbild aus anderem Fandom)

---

## Idee 6 — Size Comparison („Scala Imperialis")

**Was:** Interaktiver Größenvergleich über alle Rassen, Einheiten und Skalen der
Lore — vom Grot bis zum Gloriana-Schlachtschiff. Frei kombinierbares Lineup auf
gemeinsamer Grundlinie, Zoom über Größenordnungen, jede Angabe mit Quelle/
Confidence; bei widersprüchlichem Kanon beide Angaben sichtbar („Codex sagt X,
Roman Y sagt Z").

**Platzierung (Philipp):** Offen; persönlicher Favorit des Maintainers.

**Datenbasis — Neubau:** Einziges Feature der Liste ohne bestehende
DB-Grundlage. Braucht eine neue Tabelle (z. B. `size_entries`: Referenz auf
Charakter/Fraktion/frei benanntes Wesen/Fahrzeug, Min-/Max-Größe, Kategorie,
Quellenangabe, Confidence, Silhouetten-Asset). Anknüpfpunkte existieren:
`characters`/`factions` für Verlinkung, Provenienz-Konvention
(`source_kind`/`confidence`) und die Artwork-Credit-Pipeline der Events
(`artCreditName`/`artCreditUrl`) als Muster für Silhouetten-Assets.

**Offen:** Datenerhebung (Lexicanum + Codizes + Romanstellen; die
DakkaDakka-Referenz-Threads sind faktisch fertige crowdgesourcte
Quellensammlungen); Silhouetten-Beschaffung (selbst zeichnen vs.
Community-Beiträge via `submissions`-Pipeline); Scope der v1 (nur
Infanterie-Skala vs. gleich inkl. Titans/Schiffe); UX-Muster (Lineup à la
minicompare vs. Zoom-Journey à la neal.fun).

**Evidenz:** Klaffende Marktlücke. Es existieren nur: statische Einzelbilder
(DeviantArt/Fandom/Pinterest), ein YouTube-Genre linearer 3D-Videos und zwei
interaktive Nischen-Tools (nur Schiffe bzw. nur Tabletop-Miniaturen). Kein Tool
deckt alle Rassen interaktiv ab. Die 12+-Seiten-Referenz-Threads zeigen: Die
Community versucht das Datenproblem selbst zu lösen und scheitert an der
Quellenlage — genau die Lücke, die der Provenienz-Ansatz füllt.

- <https://www.deviantart.com/hebime/art/Height-comparison-Species-and-Walkers-407960414>
- <https://www.deviantart.com/eruisar/art/Height-Chart-v7-512871782>
- <https://www.voidstate.com/rpg/40k_ship_visualizer/> (interaktiv, nur Schiffe)
- <https://minicompare.info/> (interaktiv, nur Tabletop-Miniaturen)
- <https://www.dakkadakka.com/dakkaforum/posts/list/330/634292.page> (How tall are Space Marines? — Referenzsammlung)
- <https://www.dakkadakka.com/dakkaforum/posts/list/812055.page> (Titan size effort post)
- <https://www.youtube.com/watch?v=z9V3Xd8YbQM> (Beispiel des 3D-Video-Genres)

---

## Anhang — dokumentiert, aber (noch) nicht angenommen

Aus derselben Recherche, für spätere Bewertung: Series-Status-Board
(abgeschlossen/laufend/verwaist + „komplett lieferbar"-Filter),
Mood-/Facetten-Filter-UI (NEON-14 liegt ungenutzt in der DB), „Was habe ich
verpasst?"-Generator für Rückkehrer, Charakter-Dossiers mit „Zuletzt gesehen",
Spoiler-/Abhängigkeits-Graph (Werk→Werk-Kanten: spoilert/setzt voraus/vertieft),
Personal Library local-first mit Export (Feature-Vorbild heresytracker.app),
Release-Radar (Kalender + iCal aus dem Weekly-Refresh).

## Querschnitts-Hinweise für die Bewertungs-Session

1. Ideen **3a**, **5** und **6** haben Schema-Implikationen — nach Projekt-
   Konvention zuerst ins Ideas-Backlog der Roadmap, bevor sie ein Brief werden.
2. Ideen **1, 2, 3c, 4** sind mit vorhandenen Daten umsetzbar (kein
   Schema-Change) und damit Kandidaten für frühe Post-Launch-Sessions.
3. Recherche-Methodik-Caveat: Reddit war teils nur über Archiv-APIs erreichbar;
   Upvote-Zahlen sind Snapshot-Werte und eher Untergrenzen.
