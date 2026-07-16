# Werkstatt-Roadmap — Chrono Lexicanum

Begleitdokument zum Plan-Nachtrag **W1–W6** in [`launch-master-plan.md`](./launch-master-plan.md) (§ Entscheidungen → „Nachtrag — Werkstatt-Phase", 2026-07-15). Inhaltliche Grundlage jeder Runde ist die Ideenliste [`post-launch-feature-ideas.md`](./post-launch-feature-ideas.md). Diese Datei ist drei Dinge: **Reihenfolge**, **Urteils-Ledger** und **Kickoff-Prompts**. Verbindliche Spec bleibt der Plan-Nachtrag; bei Widerspruch gewinnt der Plan.

## Ablauf pro Runde

1. Frische CC-Session; Prompt aus dem passenden Block einfügen.
2. **Bewertung zuerst:** CC erkundet Daten-/Code-Grundlage, legt Optionen mit Empfehlung und grobem Aufwand vor — und **wartet**. Keine Umsetzung, kein Commit vor dem Urteil.
3. Philipp urteilt: **bauen / Backlog / verwerfen.** CC trägt das Urteil in die Tabelle unten ein (mit einem Satz Begründung in der Runden-Notiz).
4. Bei **bauen**: Zuschnitt besprechen — kleine Sachen direkt in derselben Session, größere als eigene Session/PR (Strang-Regeln nach CLAUDE.md; Schema-Ideen brauchen zuerst den Brief, Ideas-Backlog-Eintrag steht schon in `brain/wiki/roadmap.md`). Bei **Backlog / verwerfen**: nur Ledger-Eintrag, fertig.
5. `fertig` → Commit/PR wie üblich; Philipp merged. Brain-Rollups laufen gesammelt als Koordinations-PR, nicht pro Runde.

**Betriebsnotizen:** Bewertungsrunden fassen keinen Produktcode an und können parallel zu laufender Strang-Arbeit stattfinden. · Werkstatt-Sessions laufen im Koordinations-Worktree (E8, verlängert), jede auf frischem Branch von `origin/main`; parallele Arbeit in einem Strang-Worktree ist ok, solange die Pfade disjunkt bleiben — **Dateien eines offenen Strang-PRs sind tabu** (solange der Map-PR offen ist: `src/components/cartographer/**`, `src/lib/map/**`, `55-map.css`, Map-Seed-Daten). · Ein Dev-Server pro Worktree; bei zwei gleichzeitig laufenden Worktrees Ports trennen (Koordination z. B. `PORT=3001`). · UI-Abnahme wie immer durch Philipp im Browser, keine Headless-Loops. · Enge Session i. S. v. CLAUDE.md: project-state/open-questions müssen nicht gelesen werden — Plan-Nachtrag + Ideen-Eintrag reichen.

## Reihenfolge & Urteils-Ledger

| # | Runde | Gegenstand | Voraussetzung | Urteil | Session/PR |
|---|---|---|---|---|---|
| 1 | **F2** | Idee 2 — Doppelkauf-Warner (Containment-Explorer) | — | **Backlog** — Revisit nach den übrigen Runden | Session 220 |
| 2 | **F1** | Idee 1 — Status Imperialis | — | **bauen** | Session 221 |
| 3 | **F3** | Idee 3c — Statistiken („Librarium") | — | **bauen** | Session 222 |
| 4 | **W4** | Idee 4 — Provenienz sichtbar machen | sinnvoll nach F2 (Synergie Confidence-Anzeige) | **Backlog** | Session 223 |
| 5 | W3a | Idee 3a — Charakter-Interaktions-Baum *(Schema)* | — | **bauen** | Session 224 |
| 6 | W3b | Idee 3b — Timeline auf der Map *(umgeplant: drei Zeitkarten + Karten-Timeline, ohne Schema)* | — | **bauen** | Session 225 |
| 7 | W5 | Idee 5 — Podcasts auf der Buch-Detailseite *(Schema)* | — | **Backlog** — Revisit post-launch | Session 225 |
| 8 | W6 | Idee 6 — Size Comparison „Scala Imperialis" *(Schema, Neubau)* | — | **Backlog** — Revisit post-launch | Session 225 |
| 9 | WA | Anhang-Kurz-Triage (7 Ideen) | nach den Hauptideen | **7/7 entschieden** — 1× bauen (Facetten-UI), 4× Backlog, 1× verwerfen, 1× → Runde WL | Session 226 |
| 10 | WP | Perfektions-Kandidaten-Triage (Product + Data, 8 Posten) | nach den Hauptideen | ☐ offen | |
| 11 | WM | Map-UI-Rework — Cartouche/Instrumente revisiten (Journeys + Karten-Timeline + Zeitkarten sind zusammen zu viel fürs heutige UI; Philipp, Session 225) | nach W3b-Bau | ☐ offen | |
| 12 | WL | Personal Library — local-first vs. spartanische Accounts-Schiene (aus WA-Triage; Philipp will das vor dem Launch visitiert haben) | nach den Triage-Runden | ☐ offen | |
| 13 | — | S7b — Player/Chrome/Assets (vorgezogen, W3) | Feature-Welle abgeschlossen | — | |
| 14 | — | S11-Code-PR (pixelgleich, W3) | S7b | — | |
| 15 | — | Launch-Readiness → Gate-off → stilles Fenster | W1-Gate erfüllt (Artwork + Liste besucht) | — | |

Zeilen 11–13 laufen über die bestehenden Blöcke in [`launch-session-prompts.md`](./launch-session-prompts.md) bzw. das Launch-Readiness-Kapitel des Plans — hier nur der Reihenfolge halber gelistet.

**Runden-Notizen** (ein Satz pro gefälltem Urteil, jüngste oben):

- **WA · 6/7 triagiert** (2026-07-16, Session 226): Series-Status-Board **Backlog** (zu viel Aufwand — der wahre Posten wäre der Batches-Kurationspass `seriesHint`→Promotion: Hints 896/896 gesetzt, promotet nur 8/896; „komplett lieferbar" bleibt mangels `availability`-Daten gestrichen) · „Was habe ich verpasst?"-Generator **Backlog** (Release-Year-Filter existiert schon; Revisit allenfalls als /now-Erweiterung, wenn /now live ist) · Charakter-Dossiers/„Zuletzt gesehen" **Backlog** (die W3a-Charakter-Verbindungen sind für Philipp der stärkere Hebel; Datierungsdecke 97/896 trägt „Zuletzt gesehen" ohnehin nicht) · Spoiler-/Abhängigkeits-Graph **Backlog** („irgendwann"; bräuchte Schema-Brief + den größten Kurationsaufwand des Anhangs) · Release-Radar **verwerfen** („erstmal nicht"; Bücher tragen nur `releaseYear`, 19 Einträge ≥ 2026, iCal hieße Migration + Dauerpflege) · Personal Library **→ eigene Bewertungsrunde WL vor dem Launch** (Umfang/Aufwand voraussichtlich zu groß für die Werkstatt, aber prüfen, ob eine sehr spartanische Accounts-Schiene fahrbar ist; F2-Synergie Doppelkauf-Warner) · Mood-/Facetten-Filter-UI **bauen, vor dem Release** (nach ELI5 „übernehmen wir so": kombinierbare Facetten-Chips als Archiv-Filterleiste, teilbare Filter-Links; Datenbefund: 896/896 Bücher facettiert, 17.403 Zuweisungen ~19/Buch, heute filtert das Archiv genau *eine* Facette via Such-Chip; kein Schema, Product **M**, Kickoff WA-B1 unten; NEON-14-Content-Warnings bleiben bewusst UI-retired).
- **W5 · Backlog / W6 · Backlog** (2026-07-16, Session 225): Maintainer-Entscheid ohne eigene Bewertungsrunde — beide werden vor dem Launch nicht umgesetzt; die Kickoff-Prompts unten bleiben für das Post-Launch-Revisit stehen (W5 bräuchte dann die Abdeckungszählung beider Wege event-Ableitung vs. `episode_covers_work`, W6 als Schema-Neubau zuerst den Brief).
- **W3b · bauen** (2026-07-16, Session 225): Gebaut wird der von Philipp **umgeplante** Zuschnitt — **drei diskrete Zeitkarten** (Stufe 1 Pre-Heresy/M30, Stufe 2 Horus Heresy/M31, Stufe 3 = heutige Karte M41/42; Pins bleiben in allen Stufen identisch, nur Zonen + zeitgebundene Instrumente schalten) plus **Karten-Timeline** (Play über die drei Stufen + `mapState`-Kopplung der Great Journeys) — statt des ursprünglichen Jahr-Scrubs mit Events-Layer; **kein Schema, keine DB, kein Brief** (reine Product-Pfade: zones.json-Zustands-Tags, Voyage-Tags, UI-State; Zuschnitt Product **M**, geteilt B1/B2). Befunde der Erkundung: die Ideenlisten-Annahme „Jahr-Filter existiert" ist **falsch** (der Cartographer hat keinerlei Zeitdimension) und `work_locations.atY` ist **leer** (0/1.712 Kanten); Buch-Datierungen 97/896 und bimodal (Apostasy-Ära 0, Waning 2) — via Buch nicht machbar, wie im Urteil festgehalten; die Events (= Chronicle-Spine, 142/144 datiert, ausgewogen 6–23 pro Ära) wären als Zeitschicht tragfähig gewesen, werden im neuen Zuschnitt aber nicht gebraucht (Events→Location-Ableitung wäre ohnehin unbrauchbar ambig: nur 65/144 erreichen Locations, Molech → 24 „primary"); die **Rift-Hälfte der Idee existiert bereits** (Zone „Cicatrix Maledictum" + Nihilus-/Lumen-Instrumente, in beiden Renderern seit Session 213). Kuration im Bau: ~2 neue Zonen zeichnen (Eye of Terror — als Katalog-Entität `eye-of-terror` mit 78 Werken vorhanden, Zone elegant um den Pin herum; Ruinstorm für Stufe 2) + 15 Bestandszonen taggen (Maelstrom + Eye in allen Stufen; Tau/Dynastien/Scourge Stars/Rift nur Stufe 3). Folge-Runde **WM** (Map-UI-Rework) neu aufgenommen — nach dem W3b-Bau, weil Journeys + Timeline + Zeitkarten das heutige Instrumenten-UI übersteigen.
- **W3a · bauen** (2026-07-16, Session 224): Gebaut wird die abgeleitete Ko-Okkurrenz-v1 **ohne Schema-Change** (Variante A1: „Verbindungen"-Ego-Modul auf `/character/[slug]`, server-gerendert, Product **S–M** — die Schema-Brief-Pflicht greift nicht, da keine neue Tabelle; kuratierte `character_relations` bleibt bewusste v2-Option und bräuchte dann den Brief, ebenso eine eigene Graph-Explorer-Route). Befunde der Erkundung (gerechnet auf Live-DB): 507 Charaktere, 684/896 Bücher mit Charakter-Kanten (76 %), 2.056 Buch-Zeilen (825 pov/1.195 appears/36 mentioned — Mentioned-Rauschen auf Büchern praktisch inexistent; Podcast-Schicht mit Rolle `subject` separat, gehört nicht in den v1-Graphen); strikter Graph (pov/appears, nur Bücher) 1.770 Kanten/456 Knoten, Median-Grad 4, 46 Komponenten (Riese 244, Gaunt-Cluster ~37, 51 isolierte); **Omnibus-Doppelzählung ist das eine echte Datenproblem** — ohne die 59 `work_collections`-Container fallen die ≥2-Buch-Kanten von 988 auf 584 (Ausschluss = eine WHERE-Klausel, Pflicht in der Ableitung); Anthologie-Cliquen klein (Median-Cast 2/Buch, Max 18; nur 80/1.770 Kanten allein aus Casts ≥15); Stichproben lore-plausibel (Imperator↔Horus 7 gemeinsame Bücher, Valdor 5, Malcador/Dorn 3; Fabius↔Fulgrim/Ferrus/Lucius). Rendering-Richtung: Graph statt Baum (Daten zyklisch, Ären trennen die Komponenten sauber — es gibt keinen einen Baum über alles); Ort: Charakterseite statt eigene Route.
- **W4 · Backlog** (2026-07-16, Session 223): Aufwand (Product-Session S–M: Vokabular-Mapping + `ProvenanceLine`-Komponente + Chronicle-Verdrahtung + Buch-Datierungszeile) rechtfertigt für Philipp kein Feature, von dem er nicht voll überzeugt ist — Bewertung liegt entscheidungsreif bereit. Befunde der Erkundung: Events-Provenienz 144/144 gefüllt (H55/M81/L8), aber vom Chronicle-Loader nicht geladen; `settingDateLabel` wird **nirgends** gerendert (die Setting-Datierung selbst wäre erst sichtbar zu machen); `works.sourceKind/confidence` uniform (`ssot`/1.00) und damit UI-wertlos; zwei öffentliche Provenienz-Präzedenzfälle existieren schon (EntityBlurb-Cite-Chip, Map-Placement-Zeile „INFERRED PLACEMENT · SOURCE ↗"); die Kurzvokabeln (`lex`/`fandom`/`tl`/`chron`/`roster`/`lore`, 20 Kombo-Werte) sind im Repo nirgends menschenlesbar dokumentiert. Folge fürs Backlog: F1-B2 (/now, „Konfidenz dezent") und F3-B1 (Scatter-Confidence-Farben) definieren ihr H/M/L-Wording beim Bau lokal selbst; wird W4 später gebaut, konsolidiert es diese Stellen in das geteilte Modul. (2026-07-16, Session 222): Eigene statische Route (Arbeitsname `/statistics`, „Librarium"-Vokabular) — Loader nach loadTimeline-Muster (cachedRead + eigener Tag, aktualisiert sich per Content-Release), handgerollte SVG-Charts ohne neue Dependency, Interaktivität max. CSS-Hover; v1 = Stat-Tiles (896 Bücher · 108 Autoren · 1.114 Episoden · 1.534 h Podcast) + 7 Charts (Publikationskurve nach Format, Autoren-Liga, Fraktions-Präsenz, Charakter-Leaderboard, Welten-Ranking, Rating-Verteilung, Setting-vs.-Erscheinung-Scatter als Signature-Chart der kuratierten Datierungen mit Confidence-Farben). Zuschnitt: Product-Session **M**; Bau erst nach den restlichen Bewertungsrunden (wie F1). Befunde: zwei Ideenlisten-Claims falsch — `pageCount` **0/896** (leer, „Seiten pro Serie" entfällt; Open-Library-Backfill wäre eigener Batches-Posten) und `series_id` 8/896; belastbar dagegen Erscheinungsjahr 895/896, Format 100 %, Autoren-Junction 91 % (108 Autoren), Fraktionen 97 %, Welten 83 %, Charaktere 76 %, Rating 676/896 (nur Goodreads — ehrlich labeln), Setting-Datierungen 97/896 (H48/M43/L6, wächst mit F1-B1 auf ~120).
- **F1 · bauen** (2026-07-16, Session 221): Eigene Route (Arbeitsname `/now`, „Status Imperialis"), hybrid — DB-Module (Indomitus-Events, „spielt jetzt"-Buchliste ≥ 999.M41, Ära-Kontext) plus schlanke kuratierte Prosa im Code (Antwortsatz, Tempus Incertum, Kurzlage Sanctus/Nihilus); Update über bestehende Pfade (book-dates im Refresh-PR, Content-Release, Revalidate-Tag) + Prüfpunkt im Weekly-Refresh. Zuschnitt: Product-Session **M** (Seite) + Batches-PR **S–M** (M42-Nachdatierung ~20–25 book-dates-Zeilen — Dawn of Fire #2–#8, Cawl, Wolftime u. a. liegen undatiert im Bestand — plus 2 fehlende Event-Hooks). Befunde: Indomitus-Spine 12 Events komplett kuratiert (10/12 mit Hooks), 19 Bücher ≥ 999.M41 datiert (12 in M42, bis ~030.M42), `book_details.series_id` global fast leer (8/896), Sanctus/Nihilus-Lage nirgends als Daten — bewusst redaktionell. (2026-07-16, Session 220): Die ursprüngliche Vision (eigene Bibliothek eingeben → Overlap-Warnung beim Kaufkandidaten) bräuchte Nutzeraccounts/Personal Library und ist damit out of scope; die bewertete Read-only-Variante (Buchseiten-„Enthält"-Sektion + Curator-Unterseite `/ask/collections` als leiser Nebeneingang, zusammen ~M, ohne Confidence-Anzeige) liegt entscheidungsreif bereit — Revisit, wenn die übrigen Feature-Runden durch sind. Befunde der Erkundung: `confidence`/`basis` zu 100 % gefüllt, `availability` komplett leer (896/896 NULL), Abdeckung Omnibus 48/58 vs. Anthologie 9/64, Cross-Collection-Overlap fast leer (3 Paare).

---

## F2 — Bewertung: Doppelkauf-Warner (Idee 2)

```text
Werkstatt-Runde F2 — Bewertung Idee 2 (Doppelkauf-Warner / Containment-Explorer).

Scope: Bewertungsrunde, keine Umsetzung. Lies docs/post-launch-feature-ideas.md § Idee 2 und den Plan-Nachtrag W1–W6 in docs/launch-master-plan.md. Erkunde die reale Datenlage (work_collections-Kanten inkl. displayOrder/confidence/basis, book_details.format, availability) und die heutige Curator-Struktur, soweit nötig, um Platzierung und Aufwand ehrlich einzuschätzen.

Kläre die offenen Fragen der Idee und lege mir Optionen mit Empfehlung + grober Größe vor:
- Nur Explorer pro Buch, oder zusätzlich der interaktive Modus „meine Auswahl → Overlap-Rechnung"?
- confidence/basis der Kanten anzeigen (Synergie mit Idee 4) — ja/nein/wie zurückhaltend?
- Platzierung (voraussichtlich Curator-Unterseite) und wie sich das in die bestehende Zwei-Pfad-Schwelle fügt.

Danach warte auf mein Urteil (bauen / Backlog / verwerfen) und trage es in docs/werkstatt-roadmap.md ein. Bei „bauen" besprechen wir den Zuschnitt (gleiche Session oder eigene). Kein Commit/PR, bis ich „fertig" sage.
```

## F1 — Bewertung: Status Imperialis (Idee 1)

```text
Werkstatt-Runde F1 — Bewertung Idee 1 (Status Imperialis — „Wann ist jetzt?").

Scope: Bewertungsrunde, keine Umsetzung. Lies docs/post-launch-feature-ideas.md § Idee 1 und den Plan-Nachtrag W1–W6. Erkunde die Datenlage (events-Spine mit dateLabel/Tier/Blurbs, works.startY/endY + settingDateLabel, eras) so weit, dass klar ist, was eine kuratierte „Zustand der Galaxis heute"-Ansicht heute tragen würde und wo Kurationsarbeit nötig wäre.

Kläre die offenen Fragen und lege mir Optionen mit Empfehlung + grober Größe vor:
- Eigene Route vs. Integration in den Curator (Entscheidung ist offen).
- Wie viel redaktionelle Prosa vs. rein datengetrieben.
- Update-Rhythmus bei neuen Büchern (passt das in den Weekly-Refresh?).

Danach warte auf mein Urteil (bauen / Backlog / verwerfen) und trage es in docs/werkstatt-roadmap.md ein. Kein Commit/PR, bis ich „fertig" sage.
```

### F1-Bau — Kickoff-Prompts (Urteil „bauen", Session 221)

Zwei strand-reine Sessions; Reihenfolge B1 → B2 empfohlen (die Seite landet dann mit vollständiger Liste), technisch aber unabhängig. **Timing (Philipp, Session 221):** Die Bau-Sessions starten erst, wenn die restlichen Bewertungsrunden durch sind — mögliche Überschneidungen/Synergien mit späteren Urteilen (z. B. W4-Provenienz auf der /now-Fläche, F3-Statistik-Module) fließen dann in den finalen Zuschnitt ein.

**F1-B1 — Batches: M42-Nachdatierung (S–M)**

```text
Werkstatt-Bau F1-B1 — M42-Nachdatierung für Status Imperialis (Batches, S–M).

Kontext: F1-Urteil „bauen" (docs/werkstatt-roadmap.md § Runden-Notizen, Session 221). Ziel: die „Jetzt"-Kante der Setting-Datierungen schließen, damit die /now-Seite vollständig trägt.

Umfang:
- ~20–25 neue Zeilen in scripts/seed-data/book-dates.json für bekannte M42-Bücher, die undatiert im Bestand liegen: Dawn of Fire #2–#8 (The Gates of Bones, The Wolftime, Throne of Light, The Iron Kingdom, The Martyr's Tomb, Sea of Souls), Belisarius Cawl: The Great Work, Blood of Iax, Mark of Faith, Day of Ascension, Witchbringer, Steel Tread, Longshot, Outgunned, Catachan Devil, Deathworlder, Assassinorum: Kingmaker, The Bookkeeper's Skull, Helbrecht: Knight of the Throne u. a. — Methode meist series-inherited/event-anchored, Konfidenz ehrlich (M/L), Quelle je Zeile.
- Die 2 hook-losen Indomitus-Events kuratieren (Psychic Awakening; Era-Marker nur, falls sinnvoll) in den Timeline-Seeds.
- Prüfpunkt im Weekly-Refresh-Runbook ergänzen: „trägt ein promotetes Buch eine Datierung jenseits des /now-Seitenstands oder ein neues Groß-Event → Status-Prosa prüfen".
- Kein Produktions-Write ohne explizites Go; DB-Apply + Snapshot laufen über das Content-Release-Runbook.

Branch: codex/ingest-batches-m42-dates. Kein Commit/PR, bis ich „fertig" sage.
```

**F1-B2 — Product: /now „Status Imperialis" (M)**

```text
Werkstatt-Bau F1-B2 — Status Imperialis (Product, M).

Kontext: F1-Urteil „bauen" (docs/werkstatt-roadmap.md § Runden-Notizen, Session 221). Eigene Route (Arbeitsname /now), Seitentitel „Status Imperialis", Sternwarte-Vokabular, hybrid: DB-Module + schlanke kuratierte Prosa im Code.

Umfang:
- Route src/app/now/ (Server Component; Loader nach loadTimeline-Muster mit cachedRead + eigenem Tag).
- DB-Module: Antwort-Kopf („Wann ist jetzt?" mit ~012.M42-Rahmung + Tempus-Incertum-Kasten), die Indomitus-Events der Spine (Blurbs, dateLabels, Hooks, Artwork), „diese Bücher spielen jetzt gerade" (works.startY ≥ 41999, sortiert nach Setting-Datum, dateLabel + Konfidenz dezent), Ära-Kontext aus eras.
- Kuratierte Prosa im Code: Kurzlage Imperium Sanctus / Nihilus (je ~1 Absatz) + Freshness-Stempel aus den Daten („gestützt auf N datierte Werke bis …").
- Anbindung: VII. Burger-Eintrag, Home-Doorway (Act 3), Querverweis aus der Indomitus-Ära der Chronicle.

UI-Abnahme durch Philipp im Browser, keine Headless-Loops. Branch: codex/product-status-imperialis. Kein Commit/PR, bis ich „fertig" sage.
```

## F3 — Bewertung: Statistiken (Idee 3c)

```text
Werkstatt-Runde F3 — Bewertung Idee 3c (Statistics-Überblick „Librarium-Statistiken").

Scope: Bewertungsrunde, keine Umsetzung. Lies docs/post-launch-feature-ideas.md § Idee 3c und den Plan-Nachtrag W1–W6. Erkunde die Datenlage (works, book_details.pageCount/rating, Junctions, persons) und prüfe ehrlich, welche Auswertungen heute belastbar sind (Feldabdeckung!) und welche löchrig wären.

Kläre die offenen Fragen und lege mir Optionen mit Empfehlung + grober Größe vor:
- Route/Einbettung — wohin gehört das?
- Statisch generiert (Snapshot-Modell des Launch-Plans) vs. interaktiv.
- Welche 5–8 Charts bilden die v1 (mit Blick auf Reddit-Tauglichkeit als Launch-Material)?

Danach warte auf mein Urteil (bauen / Backlog / verwerfen) und trage es in docs/werkstatt-roadmap.md ein. Kein Commit/PR, bis ich „fertig" sage.
```

### F3-Bau — Kickoff-Prompt (Urteil „bauen", Session 222)

**Timing (wie F1):** Bau erst, wenn die restlichen Bewertungsrunden durch sind — spätere Urteile (v. a. W4-Provenienz fürs Confidence-Labeling des Scatter-Charts) fließen in den finalen Zuschnitt ein.

**F3-B1 — Product: /statistics „Librarium-Statistiken" (M)**

```text
Werkstatt-Bau F3-B1 — Librarium-Statistiken (Product, M).

Kontext: F3-Urteil „bauen" (docs/werkstatt-roadmap.md § Runden-Notizen, Session 222). Eigene statische Route (Arbeitsname /statistics), „Librarium"-Vokabular, handgerollte SVG-Charts als Server Components, keine neue Dependency, Interaktivität max. CSS-Hover.

Umfang:
- Route src/app/statistics/ (Server Component; Loader nach loadTimeline-Muster mit cachedRead + eigenem Tag; Aggregat-Queries in SQL, kein Client-Charting).
- Kopf: Stat-Tiles (Bücher, Autoren, Podcast-Episoden + Gesamtstunden, Welten, Events — Zahlen live aus der DB, nichts hartkodieren).
- 7 Charts: Publikationskurve pro Erscheinungsjahr gestapelt nach Format; Autoren-Liga (Top 15 mit Karriere-Spanne); Fraktions-Präsenz (Top-Fraktionen nach Buchzahl); Charakter-Leaderboard (Abdeckungs-Caveat dezent); meistbeschriebene Welten; Rating-Verteilung (Quelle Goodreads + Abdeckung ehrlich ausweisen); Setting-vs.-Erscheinung-Scatter (kuratierte Teilmenge, Confidence-Farben H/M/L, Punktzahl aus den Daten).
- Nicht im Scope: Seiten-/Serien-Auswertungen (pageCount 0/896, series_id 8/896), Availability, Chart-Library.
- Anbindung: Burger-Eintrag (nächste freie Ziffer; VII ist durch /now verplant), Sitemap, OG-Metadaten mit Blick auf Reddit-Teilbarkeit.

UI-Abnahme durch Philipp im Browser, keine Headless-Loops. Branch: codex/product-librarium-statistics. Kein Commit/PR, bis ich „fertig" sage.
```

## W4 — Bewertung: Provenienz sichtbar machen (Idee 4)

```text
Werkstatt-Runde W4 — Bewertung Idee 4 (Provenienz-Badges: source_kind/confidence in der UI).

Scope: Bewertungsrunde, keine Umsetzung. Lies docs/post-launch-feature-ideas.md § Idee 4 und den Plan-Nachtrag W1–W6. Erkunde, wo source_kind/confidence (und settingMethod/settingConfidence) heute durchs Schema laufen und welche Flächen sie sinnvoll zeigen könnten — berücksichtige das F2-Urteil, falls dort schon eine Confidence-Anzeige entschieden wurde.

Kläre die offenen Fragen und lege mir Optionen mit Empfehlung + grober Größe vor:
- UI-Form (Tooltip, Fußnoten-Glyph, Detail-Panel-Zeile) — dezent, im Sternwarte-Vokabular.
- Welche Flächen zuerst (mindestens Events + Setting-Datierungen laut Idee).
- Brauchen die Kurzvokabeln (lex, fandom, tl, H/M/L) ein menschenlesbares Mapping?

Danach warte auf mein Urteil (bauen / Backlog / verwerfen) und trage es in docs/werkstatt-roadmap.md ein. Kein Commit/PR, bis ich „fertig" sage.
```

## W3a — Bewertung: Charakter-Interaktions-Baum (Idee 3a, Schema)

```text
Werkstatt-Runde W3a — Bewertung Idee 3a (Charakter-Interaktions-Baum).

Scope: Bewertungsrunde, keine Umsetzung. Schema-Idee: ein „bauen"-Urteil führt zuerst zu einem Brief (Ideas-Backlog-Eintrag existiert in brain/wiki/roadmap.md). Lies docs/post-launch-feature-ideas.md § Idee 3a und den Plan-Nachtrag W1–W6. Erkunde characters + work_characters (pov/appears/mentioned) und schätze ehrlich, wie dicht/aussagekräftig ein reiner Ko-Okkurrenz-Graph auf unserem Bestand tatsächlich würde — Stichproben rechnen, nicht raten.

Kläre die Kernentscheidung und lege mir Optionen mit Empfehlung + grober Größe vor:
- Ko-Okkurrenz-Ableitung als v1 vs. direkt kuratierte Beziehungs-Tabelle (character_relations o. ä.) — inkl. realistischem Kurationsaufwand.
- Rendering-Richtung (Graph vs. Baum) und Ort (Compendium vs. eigene Route) — nur als Richtungsempfehlung, kein Design.

Danach warte auf mein Urteil (bauen / Backlog / verwerfen) und trage es in docs/werkstatt-roadmap.md ein. Kein Commit/PR, bis ich „fertig" sage.
```

### W3a-Bau — Kickoff-Prompt (Urteil „bauen", Session 224)

**Timing (wie F1/F3):** Bau erst, wenn die restlichen Bewertungsrunden durch sind — spätere Urteile fließen in den finalen Zuschnitt ein.

**W3a-B1 — Product: Charakter-Verbindungen, Ko-Okkurrenz-v1 (S–M)**

```text
Werkstatt-Bau W3a-B1 — Charakter-Verbindungen (Ko-Okkurrenz-v1) (Product, S–M).

Kontext: W3a-Urteil „bauen" (docs/werkstatt-roadmap.md § Runden-Notizen, Session 224). Abgeleitete Ko-Okkurrenz ohne Schema-Change; kuratierte character_relations und eine eigene Graph-Explorer-Route bleiben bewusste v2-Optionen (bräuchten dann den Brief).

Umfang:
- „Verbindungen"-Modul auf /character/[slug] (Ego-Netz des Charakters, Server Component; Ableitung per SQL im Entity-Loader oder eigenem Loader mit cachedRead + Tag).
- Ableitungsregeln (aus der Bewertung, Session 224): nur works.kind='book'; beide Seiten Rolle pov/appears; Sammelband-Container ausschließen (work_collections, 59 Stück — sonst Doppelzählung Roman+Omnibus); Gewicht = Zahl gemeinsamer Bücher; Standardansicht Kanten ≥2 gemeinsame Bücher, Aufklappen auf alle.
- Navigation = Links auf die Nachbar-Charakterseiten; Kanten-Detail = Liste der gemeinsamen Bücher (zitierfähig, Provenienz-Ethos).
- Kein Client-Graph-Framework, keine eigene Route; UI so schneiden, dass typisierte kuratierte Kanten später als Overlay dazukommen können.

UI-Abnahme durch Philipp im Browser, keine Headless-Loops. Branch: codex/product-character-connections. Kein Commit/PR, bis ich „fertig" sage.
```

## W3b — Bewertung: Timeline auf der Map (Idee 3b)

```text
Werkstatt-Runde W3b — Bewertung Idee 3b (Zeit-Scrub + Rift-Toggle im Cartographer).

Scope: Bewertungsrunde, keine Umsetzung. Lies docs/post-launch-feature-ideas.md § Idee 3b und den Plan-Nachtrag W1–W6. Erkunde den bestehenden Jahr-Filter, work_locations.atY und die events-Datierungen; prüfe, was ein Events-Karten-Layer (keine direkte Location-FK!) und eine handkuratierte Rift-Geometrie realistisch kosten. Beachte den Doppel-Renderer-Stand seit Session 213 (Canvas auf Android, SVG Desktop) für die Performance-Einschätzung.

Kläre die offenen Fragen und lege mir Optionen mit Empfehlung + grober Größe vor:
- Scrub-Granularität (Ären-Stufen vs. freies Jahr).
- Eigene event_locations-Kante ja/nein (das wäre der Kurations-/Schema-Anteil → dann Brief).
- Umfang der Rift-Grafik als Overlay (Muster: die 15 handkuratierten Zonen).

Danach warte auf mein Urteil (bauen / Backlog / verwerfen) und trage es in docs/werkstatt-roadmap.md ein. Kein Commit/PR, bis ich „fertig" sage.
```

### W3b-Bau — Kickoff-Prompts (Urteil „bauen", Session 225)

**Timing (wie F1/F3/W3a):** Bau erst, wenn die restlichen Bewertungsrunden durch sind. Reihenfolge B1 → B2 (die Timeline spielt über die Stufen, die B1 baut); die Runde WM (Map-UI-Rework) folgt nach beiden.

**W3b-B1 — Product: Drei Zeitkarten (S–M)**

```text
Werkstatt-Bau W3b-B1 — Drei Zeitkarten für den Cartographer (Product, S–M).

Kontext: W3b-Urteil „bauen" im umgeplanten Zuschnitt (docs/werkstatt-roadmap.md § Runden-Notizen, Session 225). Drei diskrete Kartenzustände: Stufe 1 Pre-Heresy (M30), Stufe 2 Horus Heresy (M31), Stufe 3 = heutige Karte (M41/42). Pins/Planeten bleiben in allen Stufen identisch; nur Zonen und zeitgebundene Instrumente schalten.

Umfang:
- zones.json: Sichtbarkeits-Feld pro Zone (z. B. states: ["pre","hh","now"]), Parser-Validierung in src/lib/map/zones.ts, Filter an beiden Renderer-Stellen (ZonesLayer SVG + canvas-renderer Android) — der Doppel-Renderer-Stand aus Session 213 gilt.
- Zonen-Tagging der 15 Bestandszonen: Maelstrom in allen drei Stufen; Tau Empire, Necron-Dynastien, Scourge Stars, Cicatrix Maledictum und übrige M41/42-Zonen nur Stufe 3.
- ~2 neue Zonen im Zone-Editor (/map?zones=edit) zeichnen: Eye of Terror (um die bestehende Katalog-Entität eye-of-terror bei gx≈260/gy≈232 herum; gilt in allen drei Stufen) und Ruinstorm (nur Stufe 2). Formen-Abnahme durch Philipp.
- Zeitgebundene Instrumente koppeln: Imperium-Nihilus-Schatten nur in Stufe 3 wählbar; Lumen Astronomican bleibt in allen Stufen verfügbar, der Rift-Schnitt seiner Maske gilt nur in Stufe 3.
- Stufen-Toggle v1-pragmatisch im Overlay-Block der Cartouche/des Sheets (das große Aufräumen ist Runde WM); Stufen-Zustand in den Map-Hash (parseMapHash/writeMapHash).

UI-Abnahme durch Philipp im Browser, keine Headless-Loops. Branch: codex/product-map-time-states. Kein Commit/PR, bis ich „fertig" sage.
```

**W3b-B2 — Product: Karten-Timeline + Journey-Kopplung (S)**

```text
Werkstatt-Bau W3b-B2 — Karten-Timeline über die drei Zeitkarten (Product, S).

Kontext: W3b-Urteil „bauen" (docs/werkstatt-roadmap.md § Runden-Notizen, Session 225); setzt W3b-B1 voraus.

Umfang:
- Play-/Stepper-Steuerung über die drei Stufen (M30 → M31 → M41/42, Beschriftung im Ären-Vokabular der Chronicle), diskrete Schritte — keine kontinuierliche Scrub-Interpolation, kein freies Jahr (Datenlage, siehe Runden-Notiz W3b).
- Journey-Kopplung: mapState-Tag pro Voyage (great-crusade → Stufe 1; horus, garro, lion → Stufe 2; übrige inkl. guilliman → Stufe 3), Dispatch beim Voyage-Start, vorherigen Zustand beim Voyage-Ende wiederherstellen. Ein Tag pro Voyage — kein Stufenwechsel pro Station (bewusste v1-Grenze).
- Performance-Erwartung: drei diskrete Zustände = eine Scene-Invalidation pro Schritt auf beiden Renderern; keine Sonderpfade nötig.

UI-Abnahme durch Philipp im Browser, keine Headless-Loops. Branch: codex/product-map-timeline. Kein Commit/PR, bis ich „fertig" sage.
```

## W5 — Bewertung: Podcasts auf der Buch-Detailseite (Idee 5, Schema)

```text
Werkstatt-Runde W5 — Bewertung Idee 5 (Podcast-Abschnitt auf /book/[slug]).

Scope: Bewertungsrunde, keine Umsetzung. Schema-Idee: ein „bauen"-Urteil führt zuerst zu einem Brief (Ideas-Backlog-Eintrag existiert in brain/wiki/roadmap.md). Lies docs/post-launch-feature-ideas.md § Idee 5 und den Plan-Nachtrag W1–W6. Erkunde beide Wege real: (a) Ableitung über gemeinsame Events (event_works trägt Buch-Hooks UND Podcast-Picks) — zähle, wie viele Bücher damit heute tatsächlich Episoden bekämen; (b) neue kuratierte Kante episode_covers_work — inkl. Frage, wie die Pflege in den Weekly-Refresh passt.

Lege mir beide Optionen mit Abdeckungszahlen, Empfehlung und grober Größe vor. Danach warte auf mein Urteil (bauen / Backlog / verwerfen) und trage es in docs/werkstatt-roadmap.md ein. Kein Commit/PR, bis ich „fertig" sage.
```

## W6 — Bewertung: Size Comparison „Scala Imperialis" (Idee 6, Schema-Neubau)

```text
Werkstatt-Runde W6 — Bewertung Idee 6 (Size Comparison „Scala Imperialis").

Scope: Bewertungsrunde, keine Umsetzung. Einziges Feature ohne bestehende DB-Grundlage — ein „bauen"-Urteil führt zuerst zu einem Brief mit Schema-Design (Ideas-Backlog-Eintrag existiert in brain/wiki/roadmap.md). Lies docs/post-launch-feature-ideas.md § Idee 6 und den Plan-Nachtrag W1–W6. Prüfe die Anknüpfpunkte (characters/factions, Provenienz-Konvention, Artwork-Credit-Muster) und skizziere, was eine ehrliche v1 an Datenerhebung und Silhouetten wirklich braucht.

Lege mir einen Zuschnittsvorschlag mit Empfehlung + grober Größe vor, entlang der offenen Fragen:
- v1-Scope (nur Infanterie-Skala vs. inkl. Titans/Schiffe).
- Datenerhebung (Quellenlage, Provenienz je Eintrag) und Silhouetten-Beschaffung.
- UX-Richtung (Lineup vs. Zoom-Journey) — nur als Richtung, kein Design.

Danach warte auf mein Urteil (bauen / Backlog / verwerfen) und trage es in docs/werkstatt-roadmap.md ein. Kein Commit/PR, bis ich „fertig" sage.
```

## WA — Anhang-Kurz-Triage

```text
Werkstatt-Runde WA — Kurz-Triage des Ideenlisten-Anhangs.

Scope: reine Triage, keine Umsetzung. Lies docs/post-launch-feature-ideas.md § Anhang (Series-Status-Board, Mood-/Facetten-Filter-UI, „Was habe ich verpasst?"-Generator, Charakter-Dossiers, Spoiler-/Abhängigkeits-Graph, Personal Library local-first, Release-Radar) und den Plan-Nachtrag W1–W6.

Pro Idee: zwei, drei Sätze Einordnung (Datenlage vorhanden? Schema-Implikation? ungefähre Größe?) und eine knappe Empfehlung — mehr Tiefe ist hier ausdrücklich nicht das Ziel; wer eine volle Bewertungsrunde verdient, bekommt sie als Folge-Urteil. Dann gehen wir die Liste zusammen durch und ich urteile pro Idee (bauen / Backlog / verwerfen). Urteile in docs/werkstatt-roadmap.md eintragen. Kein Commit/PR, bis ich „fertig" sage.
```

## WM — Bewertung: Map-UI-Rework

```text
Werkstatt-Runde WM — Bewertung Map-UI-Rework (Cartouche/Instrumente des Cartographer).

Scope: Bewertungsrunde, keine Umsetzung. Anlass (Philipp, Session 225): Mit den Great Journeys, der Karten-Timeline und den Zeitkarten aus dem W3b-Bau trägt das heutige Instrumenten-UI (Cartouche/CartoucheSheet: Census, Voyage-Buttons, Overlay-Buttons, Seek, Zonen-Cycle) zu viele Ebenen — das UI soll als Ganzes revisitet werden. Erkunde den Ist-Stand nach dem W3b-Bau (welche Instrumente existieren, wie stapeln sie sich auf Desktop-Cartouche vs. Mobile-Sheet) und lege eine Rework-Richtung mit Optionen, Empfehlung und grober Größe vor. Design-Dauerurteile beachten (kein Glow, keine nackten Linien-Buttons, Buch-Titelblatt-Sprache).

Danach warte auf mein Urteil (bauen / Backlog / verwerfen) und trage es in docs/werkstatt-roadmap.md ein. Kein Commit/PR, bis ich „fertig" sage.
```

### WA-Bau — Kickoff-Prompt (Urteil „bauen", Session 226)

**Timing (wie F1/F3/W3a/W3b):** Bau erst, wenn die restlichen Bewertungsrunden (WP, WM, WL) durch sind; gebaut wird vor dem Release (Maintainer-Urteil, Session 226).

**WA-B1 — Product: Archiv-Facetten-Filter „Mood-Browse" (M)**

```text
Werkstatt-Bau WA-B1 — Facetten-Filterleiste im Archiv (Product, M).

Kontext: WA-Urteil „bauen" (docs/werkstatt-roadmap.md § Runden-Notizen, Session 226). Die kuratierten Facetten (896/896 Bücher, ~19 Zuweisungen/Buch, 12 Kategorien) werden als kombinierbare Filter-UI im Archiv-Register sichtbar — kein Schema, keine neuen Daten, keine neue Dependency.

Umfang:
- Filter-Contract erweitern (src/app/archive/filters.ts + browse-wire/loader): von einem einzelnen facet-Param auf mehrere Facetten über Kategorien hinweg; Semantik UND zwischen Kategorien, ODER innerhalb einer Kategorie (Standard-Faceted-Search); IDs weiter über das bestehende ID_PATTERN validieren; URL-gespiegelt — jede Kombination ist ein teilbarer Link (Reddit-Antwort-Tauglichkeit ist ausdrücklich Ziel); Seitenzahl (page) bei Filterwechsel auf 1 zurücksetzen.
- Filterleiste im Register (Erweiterung der WerkeFilters-Zeile bzw. eigener Rail-Block): Chip-Gruppen für Ton, Plot-Typ, Blickwinkel (POV Side), Einstieg (Entry Point), Länge, Thema — Auswahl der v1-Kategorien beim Bau begründen; Trefferzahl pro Chip über den Gesamtkatalog (keine leeren Sackgassen), Chips unter Null Treffern gedimmt statt versteckt; Mobile als einklappbares Panel.
- Sichtbarkeit strikt über isVisibleFacetCategory (src/lib/facet-visibility.ts) + facet_categories.visibleToUsers — NEON-14-Content-Warnings bleiben komplett draußen.
- Bestehende Ein-Facetten-Pfade (Such-Vorschlag, browse-facet-chip, Buchseiten-Links) auf den neuen Mehrfach-Contract heben, keine zweite Wahrheit daneben.
- Design-Dauerurteile beachten (kein Glow, keine nackten Linien-Buttons, Buch-Titelblatt-Sprache); Payload-Budget des Registers im Blick (S6-Messwerte im Report neu erheben).

UI-Abnahme durch Philipp im Browser, keine Headless-Loops. Branch: codex/product-archive-facet-filters. Kein Commit/PR, bis ich „fertig" sage.
```

## WL — Bewertung: Personal Library (local-first vs. spartanische Accounts)

```text
Werkstatt-Runde WL — Bewertung Personal Library („Meine Bibliothek").

Scope: Bewertungsrunde, keine Umsetzung. Anlass (Philipp, Session 226 / WA-Triage): Die Idee ist gut, aber Umfang + Accounts-Voraussetzung sind „eine andere Hausnummer" — vor dem Launch soll geprüft werden, ob es eine sehr spartanische, fahrbare Schiene gibt, doch Accounts anzubieten. Lies docs/post-launch-feature-ideas.md § Anhang (Personal Library, Vorbild heresytracker.app) und die WA-Notiz in docs/werkstatt-roadmap.md.

Erkunde ehrlich beide Schienen und lege sie mir mit Empfehlung + grober Größe vor:
- (a) Local-first ohne Accounts: localStorage + Export/Import — welche Flächen brauchen den Besitz-/Gelesen-Status (Buchkarten, Detailseite, Archiv-Filter), was kostet eine Bibliotheksseite, wo sind die Grenzen (Gerätewechsel, Verlust).
- (b) Spartanische Accounts: Was wäre das echte Minimum auf dem bestehenden Stack (Supabase Auth liegt bereit; eine user_library-Tabelle + RLS; submissions als Präzedenz für Nutzerdaten) — inkl. dessen, was Accounts an Dauerbetrieb, Moderations-/Datenschutz-Pflichten und Launch-Risiko nach sich ziehen.
- F2-Synergie mitdenken: die ursprüngliche Doppelkauf-Warner-Vision (Overlap gegen die eigene Sammlung) war genau hieran gescheitert.

Danach warte auf mein Urteil (bauen / Backlog / verwerfen) und trage es in docs/werkstatt-roadmap.md ein. Kein Commit/PR, bis ich „fertig" sage.
```

## WP — Perfektions-Kandidaten-Triage

```text
Werkstatt-Runde WP — Triage der Perfektions-Kandidaten aus der Worklist.

Scope: reine Triage, keine Umsetzung. Lies brain/wiki/worklist.md §§ C/D (Product: Chronicle-Desktop-Restyle, BrandBeacon, Cartographer-Tails · Data: Galaspar/Myr, arthas_moloch, Drukhari-Starter, Podcast-Aliasse, Charakter-Long-Tail) und den Plan-Nachtrag W1–W6.

Pro Posten: kurzer Ist-Stand-Check gegen den aktuellen Code/Datenbestand (nichts aus alten Notizen übernehmen, was inzwischen erledigt sein könnte), ungefähre Größe, Empfehlung. Dann urteile ich pro Posten (bauen / Backlog / verwerfen). Sehr kleine „bauen"-Posten dürfen nach Absprache direkt in derselben Session umgesetzt werden, wenn sie strang-rein bleiben. Urteile in docs/werkstatt-roadmap.md eintragen, Worklist-Nachführung läuft über den nächsten Koordinations-Rollup. Kein Commit/PR, bis ich „fertig" sage.
```
