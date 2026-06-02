---
session: 2026-06-02-118
role: architect
date: 2026-06-02
status: open
slug: archive-graph-kickoff
parent: 2026-06-01-113
links:
  - 2026-06-01-109
  - 2026-06-01-113
  - 2026-06-01-114
commits: []
---

# Archive-as-Graph — Arc-Reframe + Entscheidungen

> **Kein Implementier-Brief.** Dies ist der **Nordstern** eines mehrschrittigen Product-Arcs: er hält die mit Philipp getroffenen Entscheidungen + die Schritt-Sequenz fest. Jeder Schritt bekommt **seinen eigenen Brief** (ein Schritt → ein Brief → ein PR), der seine eigene `## Design freedom` + `## Acceptance` trägt. Dieser Kickoff ist doc-only und landet direkt auf `main`.
>
> **Revidiert 2026-06-02 (mit Philipp).** Das flache „jeder Knoten ein Peer"-Modell ist durch ein **Tier-Modell** ersetzt: **Werke (Buch + Podcast) sind das Zentrum**, Entities sind Wege dahin, und eine Lens steigt nur dann zum Werkzeug auf, wenn sie eine kuratierte Achse über dieselben Werke ist. Auslöser: das flache Modell fühlte sich *richtungslos* **und** *wiki-haft* an — beides löst die Gewichtung (Flachheit *ist* Wiki-haftigkeit; Hierarchie ist, was ein kuratiertes Archiv von einem Wiki trennt). Siehe Entscheidungen **5–6** + Zielmodell. Die **Mechanik** (geteilte Hülle, zentrales Panel, keine Sackgassen — Entsch. 1–4) bleibt unverändert.

## Goal

Das Archiv von „Insel-Seiten + Sonderfall-Buch + rechtem Side-Sheet" zu **einem gerichteten Graphen** machen: **Werke (Buch + Podcast) sind die Schwerkraft**, jede Entity ist ein Weg zu Werken, jede Referenz ein Link, **eine geteilte Detail-Mechanik für alles** — gezeigt als **zentrales Panel** (soft-nav) und als volle Seite (hard-nav / Share / SEO). Drei kuratierte Achsen über demselben Werk-Korpus sind die Werkzeuge — **Chronicle (Zeit) · Cartographer (Raum) · Fraktions-Sektion (Zugehörigkeit)** — Auffahrten *in* den Graphen statt Inseln daneben. Maintainer-Befund, der den Arc auslöste: man klickt heute in die Tiefe und fällt aus dem Graphen — `/buch/[slug]`-Referenzen sind tote Chips, Facets haben kein Ziel, und das rechte Side-Sheet ist schlecht lesbar. Zweiter Befund (2026-06-02): das flache Knoten-Modell hatte keine Richtung und fühlte sich dadurch wiki-haft an.

## Entscheidungen (mit Philipp, 2026-06-02)

1. **Buch = Werk im Top-Tier, teilt die Hüllen-Mechanik.** Das Buch teilt die visuelle Grammatik der Entity-Hubs (Header-Meta, Werk-/Bezugs-Karten, „VERKNÜPFT"-Rail) und öffnet als zentrales Panel **und** volle Seite. Es bleibt der **reichste** Knoten (Synopsis, Kauf-/Hör-Links, Store-Switch, Facet-Wall, Audit) — gleiche Hülle, keine inhaltliche Verarmung. (Reframe: nicht mehr „reichster Knoten unter Gleichen", sondern *reichstes Werk im Top-Tier* — siehe Entsch. 5. Die Hüllen-Mechanik ist unverändert.)
2. **Panel = zentrales Overlay, kein Side-Sheet.** Das rechte Side-Sheet (das 113-Panel bzw. das ältere Atlas-`DetailPanel`) wird ein **zentriertes** Overlay; der Hintergrund tritt hinter einen Scrim zurück und ist *nicht* das Leseziel (löst „links sieht man nichts → schlecht lesbar"). Die **Form** (zentral) ist entschieden; exakte Maße / Scrim-Werte / Ein-Ausblend-Timing bleiben CC (Design freedom).
3. **Facets = Deep-Link in gefilterte Werke-Liste.** Ein Facet-Klick führt nach `/werke?facet=…` (filterbare, URL-gespiegelte Übersicht), **kein** eigener Facet-Hub. Facets taggen im Schema nur Werke; „Charaktere zu einem Facet" wäre abgeleitet und bleibt vorerst out.
4. **Eine Hülle, geteilte Primitive, getrennte Bodies.** Architektur-Leitplanke für die Vereinheitlichung: die **Panel-Hülle** (zentral, Scrim, A11y, intercepting routes) ist **typ-agnostisch** und wickelt jeden Body. Die **Grammatik** (Header-Meta, Rail, Chips, Section-Labels, Hairlines, Gradient-to-dark) lebt in **geteilten Primitiven**. Entity- und Buch-Body **komponieren dieselben Primitive**, bleiben aber je ein eigener Body — ein Buch ist reicher als eine Entity, also **kein** Body-Zwang in eine gemeinsame Komponente. (Setzt die in Brief 113 schon notierte „Chip/Section/Hairline-Konvergenz" als verbindliche Richtung fest.)
5. **Werke sind das Zentrum; Entities sind Wege, keine Peers.** *(neu, ersetzt das flache Modell.)* Drei Gewichte statt einer Ebene:
   - **Werke** (Buch + Podcast) = die Schwerkraft, das reichste, das Ziel. Hier lebt der Text (Synopsis / Show-Notes); hierhin zieht jede Kante.
   - **Dünne Lenses** (Charakter · Welt · Serie · Person/Autor · Ära) = Verbindungsknoten: volle Aggregator-Seite (für char/fraktion/welt schon live aus Brief 109) + Panel-Peek + schlanke Identitäts-Zeile + „kommt in diesen Werken vor". **Keine** bespoke Erfahrung. „Dünn" heißt *nicht* „weg" — die Aggregator-Seite und der Peek bleiben.
   - **Facets** = reine Filter (Entsch. 3).
   - **Anti-Wiki-Leitplanke:** Lenses tragen **Verbindungen + Kuration, nie Lore-Prosa**. Lexicanum erzählt alles über die Thousand Sons; Chrono sagt, *was man dazu lesen/hören soll und warum* — eine Empfehlungs-Maschine im Graph-Gewand. Prosa lebt auf Werken.
6. **Eine Lens steigt zum Werkzeug auf, wenn sie eine kuratierte Achse über dieselben Werke ist.** *(neu.)* Es gibt drei natürliche Achsen, zwei existieren schon: **Chronicle = Zeit**, **Cartographer = Raum**. Die dritte ist **Zugehörigkeit → Fraktions-Sektion** (die *einzige* neue Graduierung).
   - Die Fraktions-Sektion wird **nicht neu gebaut**, sondern *hebt den lebenden `/fraktion`-Hub* (Brief 109) zur kuratierten Erfahrung: Einstiegs-Bücher, ein Fraktions-Zeitleisten-Slice, Signatur-Welten, eine Podcast-Folgen-Schiene.
   - **Welt steigt NICHT auf** (Maintainer-Entscheid 2026-06-02): Cartographer *ist* die räumliche Erfahrung; Welt bleibt dünner Knoten. Ebenso Charakter / Serie / Autor — keine Sektionen.
   - **Podcasts = zweite Werk-Sorte** im Top-Tier, kein Sonderfall neben Büchern: eine Folge wird an Fraktion/Charakter/Welt getaggt (Resolver ~92 %, Brief 110) und erscheint automatisch in der Fraktions-Sektion + im Panel-Peek. Die Podcast-Schiene der Sektion leuchtet erst nach Podcast-Schema (Brief 114, Batches) + ein paar ingesteten Shows — **kein Blocker, nur Sequenz**.

## Zielmodell (IA)

- **Tier 1 — Werke (die Schwerkraft):** Buch · Podcast (+ Podcast-Folge). Reichster Knoten, das Ziel; Text lebt hier; jede Kante zieht hierher zurück.
- **Tier 2 — Werkzeuge / schwere Lenses (kuratierte Achsen über Werke):** Chronicle (Zeit) · Cartographer (Raum) · **Fraktions-Sektion (Zugehörigkeit — neu, hebt den `/fraktion`-Hub)**. Volle eigene Erfahrung, nicht nur Aggregator.
- **Tier 3 — dünne Lenses (Verbindungsknoten):** Charakter · Welt · Serie · Person/Autor · Ära. Volle Aggregator-Seite (live aus 109 für char/fraktion/welt) + Panel-Peek + schlanke Identitäts-Zeile; keine bespoke Erfahrung. *(Fraktion ist hier zusätzlich der Aggregator-Fallback/Peek-Body und hat obendrein die Tier-2-Sektion.)*
- **Facets:** reine Filter → `/werke?facet=…`, kein Knoten.
- **Kanten:** *jede* Referenz auf *jeder* Detail-Ansicht ist ein Link. Soft-Nav in der App → zentrales Panel; Hard-Nav / Refresh / geteilter Link → volle SSG-Seite (kanonischer Fallback, zero-fork). Die „VERKNÜPFT"-Rail trägt die Entity↔Entity-Kanten. **Schwerkraft-Regel:** man kann frei durch die Lenses wandern, aber jeder Pfad führt am Ende auf ein Werk — sackgassenfrei *und* gerichtet.
- **Auffahrten (On-Ramps):** Startseite (kuratiert) · Suche (`resolveSurfaceForm`) · Werke-Browse (`/werke`, Filter + Facet-Deep-Links).
- **`/atlas` bleibt Maintainer-/Audit-Cockpit** (Counts, Junctions, Drift), **nicht** das öffentliche Navigations-Rückgrat. Öffentlich navigiert man über Home + Suche + Werke-Browse + Hubs/Panels/Sektionen.

## Sequenz (ein Schritt → ein Brief → ein PR; alles `chrono-lexicanum-product` außer Schema)

1. **Geteilte Detail-Hülle: zentrales Panel + Buch vereinheitlicht.** (→ Brief 119) Adressiert die zwei akuten Schmerzpunkte zuerst: Side-Sheet → zentrales Overlay; geteilte Primitive heben; `/buch/[slug]` auf die geteilte Naht + alle Referenzen werden Links (öffnen via root-nahem `@modal`-Slot automatisch zentral). *(Verhältnis zu Brief 113 → Open questions.)*
2. **Werke-Browse + klickbare Facets.** `/werke` filterbar (Ära/Fraktion/Format/Typ/Rating/Verfügbarkeit/Facet), URL spiegelt Filter; Facet-Chips überall → `?facet=…`.
3. **Fehlende dünne Knoten:** `/aera` · `/serie` · `/person` auf derselben Loader-/View-Engine (Ära/Serie laut Stand fast gratis; Person = Autor/Sprecher-Hub). Bleiben Tier-3 (Aggregator + Peek), keine Sektionen.
4. **Fraktions-Sektion (neu — Tier-2-Graduierung).** Hebt den lebenden `/fraktion`-Hub (109) zur kuratierten Achse „Zugehörigkeit": Einstiegs-Bücher, Fraktions-Zeitleisten-Slice, Signatur-Welten, Podcast-Folgen-Schiene. Eigener Brief mit eigener `## Design freedom`. **Reihenfolge flexibel** — hängt nur an Step 1 (Hülle/Panel) + dem live `/fraktion`-Hub, *nicht* an Steps 2–3; kann vorgezogen werden. **Dependency:** die Podcast-Schiene leuchtet erst nach Podcast-Schema (Brief 114, Batches) + ein paar ingesteten Shows — Sektion kann ohne starten, Schiene wird nachgezogen.
5. **Suche verdrahten.** Home-Suchfeld → `resolveSurfaceForm` → Knoten/Panel.
6. **Modul-Cross-Links.** Buch↔Timeline, Welt/Sektor↔Map, Ask→Hubs/Werke, und die drei Achsen verlinken sich gegenseitig (Fraktions-Sektion ↔ Chronicle/Cartographer).
7. **Startseite festzurren** als kuratierter Graph-Eingang, der Werke ins Zentrum stellt.

Diese Sequenz **löst die losen „Entity-Graph Steps 2–5"** in `open-questions.md` / `project-state.md` ab; der Rollup-Pass zieht das nach (inkl. des Tier-Framings — siehe Notes).

## Out of scope (arc-weit)

- **Schema / DB / Resolver** — das ist der Batches-Strang (Podcasts via Brief 114). Dieser Arc rendert nur, was die DB schon hat.
- **Welt-, Charakter-, Serie-, Autor-Sektionen** — diese Lenses bleiben **dünn** (Aggregator + Peek). Nur Fraktion graduiert zu Tier-2; die räumliche Achse ist Cartographer, nicht eine Welt-Sektion.
- **Lore-Prosa auf Lenses** — Entities tragen Verbindungen + knappe Kuration, keine enzyklopädischen Texte (Anti-Wiki-Leitplanke, Entsch. 5).
- **Bild + reichere Header-Fakten** (Rolle „Primarch", Ära, Heimat) — deferred, brauchen Schema-Spalten + Backfill.
- **„Charaktere zu einem Facet"** (abgeleitet aus Werken) — später, nicht in Schritt 2.
- **`/atlas` als öffentliches Rückgrat** — bleibt Maintainer-Cockpit.

## Open questions

- **Brief 113 ↔ Step 1 (119).** Brief 113 (EntityView-Redesign + In-Context-Panel, geschrieben, `open`) überlappt mit Step 1. Geht 113 *in* 119 auf, oder läuft 113 als eigener PR voraus und 119 ergänzt nur die Buch-auf-die-Naht-Hälfte? Maintainer-Entscheid beim Anwerfen von Step 1 — diese Revision rewired die Nummerierung bewusst **nicht**.
- **Fraktions-Sektion vs. dünner `/fraktion`-Aggregator.** Die Sektion ist die Tier-2-Erfahrung; der dünne Aggregator (109) bleibt als Panel-Peek-Body. Die genaue Naht (Peek „in Sektion öffnen"-Eskalation; teilt die Sektion die Panel-Hülle oder ist sie eine eigene Route?) klärt der Sektions-Brief.

## Notes

Worktree **`chrono-lexicanum-product`**, kollidiert nicht mit dem laufenden Brief 114 (Batches). Versionen recherchiert + pinnt CC, kein Pin in Briefs. Jeder Schritt-Brief trägt seine eigene `## Design freedom` (Optik = CC) + `## Acceptance` + Maintainer-Visual-Pass (Desktop + schmal). Der Kickoff bleibt `open`, solange der Arc läuft; einzelne Schritt-Briefs flippen je auf `implemented`.

Diese Revision (Tier-Framing) ist **noch nicht** in `project-state.md` / `open-questions.md` nachgezogen — das ist Aufgabe des nächsten Koordinations-Passes (Rollup-Ownership). `sessions/README.md` ist mit dieser Session nachgezogen.
