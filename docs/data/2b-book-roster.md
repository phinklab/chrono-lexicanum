# Stufe 2b — Book Roster (26 Bücher)

Begleit-Dokument zu `scripts/seed-data/books.json`. Cowork-Recherche; Philipp
review-Zielform. Quellen-Links pro Buch, Wert-Begründungen, Confidence-Hinweise.

> **Was hier steht:** für jedes der 26 Bücher die in-universe-Datierung mit Quelle,
> die Faction-Auswahl mit Rolle, die wackeligen Facet-Calls (besonders
> `entry_point` und `tone`), und Hinweise wo wir editorial-Spielraum hatten.
>
> **Was hier NICHT steht:** Synopsen — die stehen in `books.json` selbst (eigene
> Paraphrase, nicht copy-paste von Black Library, um Verlags-Copyright nicht zu
> reizen).

## Verteilung

| Era | Anzahl | Bücher |
|---|---|---|
| Great Crusade (M30.798–M30.997) | 2 | Legion · The First Heretic |
| Horus Heresy (M30.998–M31.014) | 4 | Horus Rising · Mechanicum · Know No Fear · Master of Mankind |
| Age of Rebirth (M31.015–M31.999) | 1 | The Talon of Horus |
| The Long War (M32–M36) | 1 | I Am Slaughter |
| Age of Apostasy (M37) | 0 | — |
| Time of Ending (M40.997–M41.999) | 16 | Eisenhorn · Gaunt's Ghosts · Ciaphas Cain · Ravenor · Soul Hunter · Helsreach · Storm of Iron · Path of the Warrior · Carrion Throne · Ghazghkull · Devastation of Baal · Infinite & Divine · Farsight · Mark of Faith · Grey Knights · Priests of Mars |
| Indomitus (M42) | 2 | Dark Imperium · Avenging Son |

**Authoren-Verteilung:** Dan Abnett 7 · Aaron Dembski-Bowden 5 · Graham McNeill 3 ·
Guy Haley 3 · je 1 für Sandy Mitchell, Gav Thorpe, Chris Wraight, Nate Crowley,
Robert Rath, Phil Kelly, Rachel Harrison, Ben Counter.

**Faction-Coverage:** Sons of Horus, Word Bearers, Alpha Legion, Iron Warriors,
Night Lords, Black Legion (Chaos undivided), Thousand Sons (peripheral via Talon),
Ultramarines, Imperial Fists, Black Templars, Blood Angels, Custodes, Mechanicus,
Inquisition (×3), Astra Militarum (×3), Commissariat, Grey Knights, Sisters of
Battle, Eldar, Necrons, Tau, Orks, Tyranids.

**Faction-Lücken (bewusst nicht abgedeckt in 2b):** Space Wolves, Salamanders,
Dark Angels, Raven Guard, World Eaters, Daemons (kein dedizierter PoV-Roman in
unserer Liste), Drukhari, Genestealer Cults, Adeptus Arbites (`shira_calpurnia`-
Series).

---

## Sanity-3 (unverändert übernommen, mit einer Mini-Korrektur)

### `hh01` Horus Rising — Dan Abnett (2006)
- **In-universe:** M31.998 (per existierender Sanity-Annotation; Lexicanum führt
  Davin-Mond als 005.M31, aber wir behalten den Brief-019-Stand)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/Horus_Rising_(Novel)>
- **Status:** unverändert.

### `eis01` Eisenhorn: Xenos — Dan Abnett (2001)
- **In-universe:** M41.200–M41.220 (per Eisenhorn-Tetralogie-Datierung)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/Xenos_(Novel)>
- **Status:** unverändert.

### `di01` Dark Imperium — Guy Haley (2017)
- **In-universe:** M42.030–M42.040 (per Indomitus-Crusade-Anchor)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/Dark_Imperium_(Novel)>
- **Status:** **Eine Mini-Ergänzung gegenüber Stufe 2a:** `series:
  "dark_imperium", seriesIndex: 1` ergänzt — die series-Reference existierte in
  `series.json`, war aber im Buch-Eintrag nicht verlinkt. Reine Konsistenz-Korrektur.

---

## Horus Heresy (Eras: great_crusade + horus_heresy + age_rebirth)

### `hh07` Legion — Dan Abnett (2008)
- **In-universe:** M30.985 (Nurthene War, vor Isstvan)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/Legion_(Novel)>
- **Faction-Calls:** `alpha_legion` primary; `astra_militarum` supporting (John
  Grammaticus' Imperial Army-Hintergrund). Kein chaos-Antagonist, weil der Roman
  bewusst die XX-Legion-Loyalität in der Schwebe lässt.
- **Facet-Calls:** `entry_point: mid_series` ist diskutabel — viele empfehlen
  Legion als Stand-alone-Einstieg. Im Reading-Order der Heresy ist es Band 7.
  Ich habe `mid_series` gewählt, weil das Buch einige HH-Kontextknoten verträgt.
- **Pov:** `dual` (Astartes + Imperial Army parallel).

### `hh09` Mechanicum — Graham McNeill (2008)
- **In-universe:** M30.998–M31.000 (Mars-Heresy parallel zu Isstvan)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/Mechanicum_(Novel)>
- **Faction-Calls:** `mechanicus` primary; `imperium` supporting; `chaos`
  antagonist (via Kelbor-Hal-Faktion).
- **Facet-Calls:** `protagonist_class: tech_priest` — der Roman ist breit
  ensemble, aber Dalia Cythera + die Magos-Streitenden machen den
  Tech-Priest-Bogen zur Achse.

### `hh14` The First Heretic — Aaron Dembski-Bowden (2010)
- **In-universe:** M30.951 (Monarchia-Censure) bis M30.998 (post-Isstvan)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/The_First_Heretic_(Novel)>
- **Faction-Calls:** `word_bearers` primary; `custodes` supporting (Aquillon und
  die Custodian-Auditoren); `chaos` antagonist.
- **Facet-Calls:** `pov_side: ["imperium", "chaos"]` — der Roman beginnt mit
  Word-Bearers-als-treue-Astartes und endet mit ihnen als first-heretics. Das ist
  faktisch ein dualer pov, aber `dual` als pov_side meint typischerweise
  Imperium-vs-Chaos parallel. Ich habe `["imperium", "chaos"]` gewählt — ein
  multi-value statt der single `dual`-id.

### `hh19` Know No Fear — Dan Abnett (2012)
- **In-universe:** M30.998 (Battle of Calth, ein Tag)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/Know_No_Fear_(Novel)>
- **Faction-Calls:** `ultramarines` primary; `word_bearers` antagonist.
- **Facet-Calls:** `entry_point: mid_series` — liest sich aber als ausgezeichneter
  HH-Einstieg. `pov_side: dual` (Calth aus beiden Seiten erzählt).
- **Location-Pin (für 2c):** `calth` (existiert in locations.json).

### `hh41` Master of Mankind — Aaron Dembski-Bowden (2017)
- **In-universe:** M31.005–M31.010 (Webway-Krieg unter dem Imperialen Palast,
  während Isstvan-Aftermath und Pre-Siege)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/The_Master_of_Mankind>
- **Faction-Calls:** `custodes` primary; `mechanicus` supporting (Kane-side);
  `chaos` antagonist (Daemons via Webway).
- **Facet-Calls:** `entry_point: requires_context` — es gibt keinen sinnvollen
  Einstieg in Master of Mankind ohne mindestens Horus Rising + Vulkan Lives oder
  äquivalente Heresy-Vorgeschichte. `tone: cosmic_horror` ist der zentrale Treffer
  hier — das Webway-Setting funktioniert auf Lovecraft-Achse, nicht auf
  Astartes-Action.

### `bl01` The Talon of Horus — Aaron Dembski-Bowden (2014)
- **In-universe:** M31.040 (post-Heresy, Black Legion entsteht)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/The_Talon_of_Horus_(Novel)>
- **Faction-Calls:** `chaos` primary (Black Legion bezieht sich technisch nicht
  als Chapter, sondern als Chaos-Sammlung — wir nutzen `chaos` Reference-Faction,
  ergänzt durch `sons_of_horus` und `thousand_sons` als supporting).
- **Caveat:** Wir haben aktuell keine eigene `black_legion`-Faction in
  `factions.json`, nur die `black_legion`-Series. Das ist absichtlich — Black
  Legion ist eher ein politisches Vehikel innerhalb von Chaos Undivided als eine
  separate Faction-Einheit.
- **Facet-Calls:** `entry_point: series_start` (Black Legion-Duology), `pov_side:
  chaos`.

---

## Long War / Beast Arises

### `ba01` I Am Slaughter — Dan Abnett (2015)
- **In-universe:** M32.544 (War of the Beast / Ullanor-Rückkehr der Orks)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/I_Am_Slaughter_(Novel)>
- **Faction-Calls:** `imperial_fists` primary (die Legion existiert in M32 noch
  als ungeteilter Block — wir flaggen aber als Chapter, weil M32 bereits
  Codex-Astartes-Ära ist); `orks` antagonist.
- **Facet-Calls:** `length_tier: short` — Beast Arises 1 ist ~250 Seiten, kürzer
  als Standard.

---

## Time of Ending (M41)

### `gg01` Gaunt's Ghosts: First and Only — Dan Abnett (1999)
- **In-universe:** M41.745 (Sabbat Worlds Crusade Phase 1)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/First_and_Only_(Novel)>
- **Faction-Calls:** `astra_militarum` primary; `commissariat` supporting (Gaunt
  selbst); `chaos` antagonist.
- **Facet-Calls:** `scope: regiment` — Gaunt's Ghosts ist explizit
  Tanith-First-and-Only-fokussiert, regiment-scale, kein Sektor-Shift.
- **Location-Pin (für 2c):** `sabbat`.

### `cc01` Ciaphas Cain: For the Emperor — Sandy Mitchell (2003)
- **In-universe:** M41.928 (Gravalax)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/For_the_Emperor_(Novel)>
- **Faction-Calls:** `commissariat` primary; `astra_militarum` supporting; `tau`
  antagonist (gemilderte Diplomatie-Konfrontation, kein Vollkrieg).
- **Facet-Calls:** `tone: ["satirical", "action_heavy"]` — Cain ist der
  einzige unsere 26 mit `satirical`-Tone-Wert. `cw_language` (Cain's
  Memoiren-Stil ist umgangssprachlich, im 40k-Kontext klar locker).
- **Pseudonym-Note:** Sandy Mitchell ist Pseudonym von Alex Stewart. In
  `persons.json` ist beides im `bio`-Feld vermerkt.

### `rv01` Ravenor — Dan Abnett (2004)
- **In-universe:** M41.341 (Eustis Majoris, ~120 Jahre nach Eisenhorn-Trilogie)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/Ravenor_(Novel)>
- **Faction-Calls:** `inquisition` primary; `chaos` antagonist (flect-drug-Spur).
- **Facet-Calls:** `cw_crime` zusätzlich zu Standard `cw_violence` und
  `cw_death` — das Buch dreht sich substantiell um Drogenhandel und organisiertes
  Verbrechen.

### `nl01` Soul Hunter — Aaron Dembski-Bowden (2010)
- **In-universe:** M41.850 (Eye of Terror, vor 13th Black Crusade)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/Soul_Hunter_(Novel)>
- **Faction-Calls:** `night_lords` primary; `blood_angels` antagonist (Talos vs.
  Septimus' Heimatwelt-Erinnerungen).
- **Facet-Calls:** `tone: cosmic_horror` zusätzlich zu grimdark/somber —
  Talos' Seherflüche und das Covenant-of-Blood-Setting tragen das.
- **CW:** `cw_disturbing` ist hier nicht-trivial — die Night-Lords-Trilogie ist
  bekannt für Folter- und Belagerungs-Szenen mit Zivilisten.

### `hr01` Helsreach — Aaron Dembski-Bowden (2010)
- **In-universe:** M41.998 (Third War for Armageddon)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/Helsreach_(Novel)>
- **Faction-Calls:** `black_templars` primary (Reclusiarch Grimaldus); `astra_
  militarum` supporting (Cyria Tyro); `orks` antagonist (Ghazghkull-Waaagh).
- **Facet-Calls:** `entry_point: standalone` — Helsreach steht ohne
  Vorraussetzungen.
- **Location-Pin (für 2c):** `armageddon`.

### `si01` Storm of Iron — Graham McNeill (2002)
- **In-universe:** M41.600 (Hydra Cordatus)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/Storm_of_Iron>
- **Faction-Calls:** `iron_warriors` primary; `imperial_fists` antagonist (kleine
  loyalist-Garnison); `astra_militarum` supporting; `mechanicus` supporting (PDF +
  Tech-Priester der Festung).
- **Facet-Calls:** `pov_side: dual` (Honsou + Imperial-Verteidigung wechseln).

### `pe01` Path of the Warrior — Gav Thorpe (2010)
- **In-universe:** M41.x (Lexicanum führt keine spezifische Datierung; ich
  setze M41.850 als Anker, aligned mit Path-of-the-Eldar-Trilogy-Internal-Timing)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/Path_of_the_Warrior_(Novel)>
- **Faction-Calls:** `eldar` primary (Alaitoc Craftworld).
- **Facet-Calls:** `protagonist_class: pc_xenos`, `pov_side: xenos`. Korlandril
  ist Künstler-zu-Krieger-Bogen, also `scope: squad` (Striking Scorpions Aspect
  Schrein) und `tone: somber/philosophical`.

### `vt01` Vaults of Terra: The Carrion Throne — Chris Wraight (2017)
- **In-universe:** M41.997 (kurz vor Cicatrix Maledictum)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/The_Carrion_Throne_(Novel)>
- **Faction-Calls:** `inquisition` primary (Crowl + Spinoza); `custodes`
  supporting (Heqa-Aun-Begegnung); `chaos` antagonist.
- **Facet-Calls:** `plot_type: ["mystery", "political_thriller", "court_intrigue"]`
  — die Roman-DNA ist Krimi auf Terra, die Bürokratie-Schicht ist plot-tragend.
- **Location-Pin (für 2c):** `terra`.

### `gh01` Ghazghkull Thraka: Prophet of the Waaagh! — Nate Crowley (2022)
- **In-universe:** M41.600–M41.999 (Memoirs-Form, der Imperial-Historiker
  Klaff schreibt rückblickend; Hauptmasse der "Ereignisse" auf M41-Ende)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/Ghazghkull_Thraka:_Prophet_of_the_Waaagh!>
  (URL-Slug enthält Sonderzeichen — beim Verlinken auf URL-encoding achten:
  `Ghazghkull_Thraka%3A_Prophet_of_the_Waaagh%21`)
- **Faction-Calls:** `orks` primary; `astra_militarum` supporting (Klaff selbst,
  als Imperial-Historiker); `ultramarines` supporting (mehrere Astartes-Begegnungen).
- **Facet-Calls:** `tone: ["satirical", "action_heavy", "grimdark"]` — Crowleys
  Stimme schwankt bewusst zwischen den drei. `cw_language` für Klaffs unterdrückte
  Verzweiflung.

### `db01` The Devastation of Baal — Guy Haley (2017)
- **In-universe:** M41.999 (kurz vor Cicatrix Maledictum)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/Devastation_of_Baal_(Novel)>
- **Faction-Calls:** `blood_angels` primary; `tyranids` antagonist (Hive Fleet
  Leviathan).
- **Facet-Calls:** `entry_point: requires_context` — der Roman setzt Sanguinius'
  Tod, die Time-of-Ending-Verzweiflung und die Successor-Chapter-Tradition voraus.
- **Location-Pin (für 2c):** `baal`.

---

## Weitere M41-Einsteiger (Xenos- und Sister-Lückenfüller)

### `id01` The Infinite and the Divine — Robert Rath (2020)
- **In-universe:** sehr breit — die Necron-Erzählung umspannt rund 60.000 Jahre
  Schlaf-Wach-Zyklen. Anker für unsere Timeline: M40-Ende / M41 (das jüngste
  Awakening, in dem der Großteil der Pointe spielt). Ich setze `startY: 35000,
  endY: 41999` — das spiegelt die Spanne ehrlich, ohne den Roman an einen einzelnen
  Punkt zu nageln.
- **Quelle:** <https://wh40k.lexicanum.com/wiki/The_Infinite_and_the_Divine>
- **Faction-Calls:** `necrons` primary (kein Antagonist gesetzt — der Konflikt
  ist Trazyn-vs-Orikan, also intra-Necron).
- **Facet-Calls:** `tone: ["satirical", "philosophical", "cosmic_horror"]` —
  die Mischung ist die ganze Pointe des Buchs (Comedy + Existential).
- **CW:** nur `cw_violence` (verglichen mit Astartes-Romanen sehr mild).

### `fs01` Farsight: Crisis of Faith — Phil Kelly (2018)
- **In-universe:** M41.801 (Damocles Gulf-Era; Lexicanum gibt die spezifische
  Datierung in der Farsight-Series-Page an)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/Crisis_of_Faith_(Novel)>
- **Faction-Calls:** `tau` primary; `astra_militarum` antagonist (Imperial
  Damocles-Streitkräfte).
- **Facet-Calls:** `pov_side: xenos`, `protagonist_class: pc_xenos`.

### `mf01` Mark of Faith — Rachel Harrison (2019)
- **In-universe:** M42.010 (post-Indomitus, Imperium Nihilus)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/Mark_of_Faith_(Novel)>
- **Faction-Calls:** `sisters_of_battle` primary; `chaos` antagonist.
- **Facet-Calls:** `tone: ["somber", "grimdark", "hopepunk"]` — Mark of Faith ist
  eines der wenigen 40k-Bücher, das `hopepunk` rechtfertigt: Glaube als aktiv
  konstruktive Kraft trotz universeller Verzweiflung. `entry_point: standalone`.

### `gk01` Grey Knights — Ben Counter (2004)
- **In-universe:** M41.x (Lexicanum führt keine spezifische Datierung; ich
  setze M41.850 als Anker)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/Grey_Knights_(Novel)>
- **Faction-Calls:** `grey_knights` primary; `chaos` antagonist (Ghargatuloth).
- **Facet-Calls:** `protagonist_class: space_marine` — Grey Knights sind
  taxonomisch Space Marines (Adeptus Astartes Daemonhunter Chapter).

### `pm01` Priests of Mars — Graham McNeill (2012)
- **In-universe:** M41.880 (Halo Stars Expedition)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/Priests_of_Mars_(Novel)>
- **Faction-Calls:** `mechanicus` primary; `imperium` supporting (Astra-Militarum
  Eskorten); `eldar` antagonist (Yvraine-ähnliche Aeldari-Gruppe blockiert die
  Expedition).
- **Facet-Calls:** `tone: ["somber", "philosophical", "cosmic_horror"]` — Priests
  of Mars zieht die Tech-Priest-Existenz-Krise durch und der Halo-Stars-Setting
  funktioniert auf Lovecraft-Achse.

---

## Indomitus (M42)

### `df01` Avenging Son — Guy Haley (2020)
- **In-universe:** M42.010 (Indomitus Crusade Phase 1)
- **Quelle:** <https://wh40k.lexicanum.com/wiki/Avenging_Son_(Novel)>
- **Faction-Calls:** `ultramarines` primary; `imperium` supporting (Adeptus
  Custodes, Imperial Navy); `chaos` antagonist.
- **Facet-Calls:** `entry_point: series_start` (Dawn of Fire 1, der erweiterte
  Indomitus-Crusade-Arc).

---

## Confidence-Map

Wo die in-universe-Datierung weniger fest sitzt als gewünscht — als Hinweis für
spätere Confidence-Felder (CC patcht seed.ts in 2b, dann wird das relevant):

| Buch | Datierung | Confidence-Vorschlag |
|---|---|---|
| `pe01` Path of the Warrior | M41.850 | 0.7 (Lexicanum gibt keinen Punkt-Anker) |
| `gk01` Grey Knights | M41.850 | 0.7 (Lexicanum gibt keinen Punkt-Anker) |
| `pm01` Priests of Mars | M41.880 | 0.7 (Anker grob aus Halo-Stars-Datierung) |
| `nl01` Soul Hunter | M41.850 | 0.8 (Night-Lords-internen Datierung; pre-13th-Crusade-Kontext) |
| `bl01` The Talon of Horus | M31.040 | 0.7 (Black-Legion-Geburt ist als Periode dokumentiert, nicht als Datum) |
| `gh01` Ghazghkull | M41.600–M41.999 Spanne | 0.7 (Memoirs-Form, kein einzelner Anker) |
| `id01` Infinite and the Divine | M35.000–M41.999 Spanne | 0.6 (60.000-Jahre-Bogen — wir picken die Awakening-Phase als Endpunkt) |

Alle anderen Bücher: confidence implizit 1.0 (default in der DB).

## Externe Quellen, die wir noch nicht durchgehärtet haben

Aktuell setzt jedes Buch nur **1 external_link** (Lexicanum). Eine sinnvolle 2c
oder Phase-4-Erweiterung wäre, pro Buch zusätzlich:

- Black Library URL (kind=`buy_print` oder `read`)
- Goodreads URL (kind=`reference`)
- Audible URL (kind=`listen`, wo Audiobook existiert)

Das ist editorial cheap zu adden, sobald die Detail-Page-UI (2c) das Lesen
solcher Listen rechtfertigt. Heute machen die zusätzlichen FK-Joins für eine
Timeline-Surface ohne Detail-Click keinen Mehrwert.

## Bewusst nicht annotiert (für 2c / Phase 4)

- **`work_characters`** — keine Junctions in 2b. Iconic-Charaktere (Eisenhorn,
  Cain, Ravenor, Gaunt, Trazyn, Farsight, Ghazghkull, Dante, Calgar, Cawl, …)
  sind alle wikipedia-/lexicanum-dokumentiert und trivial nachzutragen, sobald
  die DetailPanel-UI sie braucht.
- **`work_locations`** — eine Handvoll obvious Pins ist im Roster oben
  bereits als Hinweis vermerkt (Calth, Sabbat, Armageddon, Terra, Baal).
  Volles Junction-Populating in 2c.
- **Cover-Artists, Audiobook-Narrators** — `persons.json` enthält nur Autoren in
  2b. John Blanche, Neil Roberts, Toby Longworth (Eisenhorn-Audio), Jonathan
  Keeble (Cain-Audio), Ramon Tikaram (HH-Audio) etc. kommen mit echten
  Audiobook-/Cover-external_links nach.
- **Co-Authoren / Editors** — keine Co-Author-Pflicht für 2b. Master of Mankind
  und Mark of Faith sind beide solo; Beast Arises ist multi-Author auf
  Series-Level, aber Band 1 ist klar Abnett-solo.

## Quellen, die ich für die Recherche verwendet habe

Konsolidierte Quellen-Liste der Top-Domains, denen die obigen Werte
entstammen — pro Buch ist die Lexicanum-URL die primäre Quelle, aber die
Facet-Begründungen kommen aus einer breiteren Mischung:

- **Lexicanum** — primäre Source für Faction-Listen, in-universe-Datierung,
  Charakter-IDs, Series-Position. Pro-Buch-URL siehe oben.
- **Black Library** (`blacklibrary.com`) — Verlags-Synopsen als Cross-Check.
  Direkter Verlinkung in `external_links` ist in 2b nicht enthalten (siehe
  „Externe Quellen, die wir noch nicht durchgehärtet haben"); gelesen aber
  zur Synopse-Paraphrase.
- **ISFDB** (`isfdb.org`) — bibliographie-Tiefe für `pubYear` (Erstausgabe-
  Jahr).
- **Wikipedia** — Autoren-Bibliographie, Geburtsjahre wo nicht in Lexicanum.
- **Eigene 40k-Lore-Kenntnis** — Facet-Calls (`tone`, `theme`, `plot_type`,
  `entry_point`) sind editorial und nicht primär quellenbasiert. Wo ein Wert
  defensiv ist (z.B. `cw_disturbing` für Soul Hunter), reflektiert das den
  Konsens der 40k-Community-Reviews mehr als ein einzelnes Quellen-Zitat.

Wo ein Wert definitiv durch eine Quelle gestützt sein muss (in-universe-
Datierung, Faction-Liste, Series-Index), ist das oben pro Buch verlinkt.
Editorial-Calls sind als solche markiert.
