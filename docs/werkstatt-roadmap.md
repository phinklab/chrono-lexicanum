# Werkstatt-Fahrplan — Chrono Lexicanum

> **Die eine Wahrheit für den Rest der Werkstatt-Phase bis zum Launch.** Neu geschnitten 2026-07-16 (Session 242): Reihenfolge, offene Prompts, Urteils-Kurzreferenz — alles Erledigte ist raus (vollständige Bewertungs-Notizen der Runden 235–241 stehen in der Git-Historie dieser Datei, PRs #267/#268). Verbindliche Ober-Spec bleibt [`launch-master-plan.md`](./launch-master-plan.md) (Nachtrag W1–W6); bei Widerspruch gewinnt der Plan.

## Spielregeln (jede Session)

- **Eine Session pro Posten.** Frische CC-Session, Prompt aus dem passenden Block unten einfügen.
- Koordinations-Worktree (`C:\Users\Phil\chrono-lexicanum`, E8), frischer Branch von `origin/main`; Branch-Name steht im Prompt (`NNN` = nächste freie Session-Nummer — vorher `sessions/` auf die höchste Nummer prüfen, Lehre aus der Kollision, die PR #268 auflösen musste; Stand 2026-07-17: nächste freie Nummer **244**).
- **Kein Commit/PR, bis Philipp „fertig" sagt.** Philipp merged selbst; „ist gemerged" → Standard-Cleanup (Merge verifizieren, `fetch --prune`, zurück auf `main`, Task-Branch löschen).
- Bewertungsrunden fassen keinen Produktcode an. Bei Urteil **bauen** wird der Zuschnitt in der Runde besprochen; sehr kleine Posten dürfen nach Absprache direkt in derselben Session umgesetzt werden, wenn sie strang-rein bleiben.
- UI-Abnahme durch Philipp im Browser, keine Headless-Loops. Gates pro PR: `typecheck`, `lint`, `test`, `next build`; `brain:lint` wenn `brain/**` berührt.
- Parallele Strang-Arbeit ist ok, solange die Pfade disjunkt bleiben; ein Dev-Server pro Worktree, bei zwei Worktrees Ports trennen (Koordination z. B. `PORT=3001`).
- **Nach jeder Session diese Datei nachführen** (Status-Haken im Fahrplan, neue Urteile in die Kurzreferenz, ggf. neue Prompts ergänzen) — die Änderung fährt im Session-PR mit.

## Fahrplan (Reihenfolge = Wahrheit)

| # | Posten | Art | Abhängigkeit | Status |
|---|---|---|---|---|
| 1 | **WP** — Perfektions-Kandidaten-Triage | Bewertung | — | ✔ 243 |
| 2 | **WL** — Personal Library (local-first vs. spartanische Accounts) | Bewertung | — | ☐ |
| 3 | **W3b-B1** — Drei Zeitkarten für den Cartographer | Bau (Product, S–M) | — | ☐ |
| 4 | **W3b-B2** — Karten-Timeline + Journey-Kopplung | Bau (Product, S) | W3b-B1 | ☐ |
| 5 | **WM** — Map-UI-Rework (Cartouche/Instrumente) | Bewertung | W3b-B1+B2 gebaut | ☐ |
| 6 | *(WM-Bau, falls Urteil „bauen" — Zuschnitt aus Runde 5)* | Bau | WM | ☐ |
| 7 | **F1-B1** — M42-Nachdatierung | Bau (Batches, S–M) | — | ☐ |
| 8 | **F1-B2** — `/now` Status Imperialis | Bau (Product, M) | F1-B1 empfohlen | ☐ |
| 9 | **F3-B1** — `/statistics` Librarium-Statistiken | Bau (Product, M) | — | ☐ |
| 10 | **W3a-B1** — Charakter-Verbindungen (Ko-Okkurrenz) | Bau (Product, S–M) | — | ☐ |
| 11 | **WA-B1** — Archiv-Facetten-Filter | Bau (Product, M) | — | ☐ |
| 11b | **WP-B1** — Arthas-Moloch-Kartenlink (+ Pin-Name) | Bau (Batches, XS–S) | Excel-Zeile Philipp | ☐ |
| 12 | **Koordinations-Rollup** — Brain + sessions/README | Doku | jederzeit möglich, spätestens vor 13 | ☐ |
| 13 | **S7b** — Player/Chrome/Assets | Qualitätspass | 1–11b abgeschlossen | ☐ |
| 14 | **S11-Code-PR** (pixelgleich) | Qualitätspass | S7b | ☐ |
| 15 | **Launch-Readiness** → Gate-off → stilles Fenster → Reddit | Endspiel | W1-Gate (Artwork + Liste besucht) | ☐ |

Posten 13–15 laufen über [`launch-session-prompts.md`](./launch-session-prompts.md) bzw. das Launch-Readiness-Kapitel des Plans — hier nur der Reihenfolge halber. Die Positionen 3/4 stehen bewusst früh, damit Runde 5 (WM) das echte UI beurteilen kann; die übrigen Bauten (7–11b) sind untereinander unabhängig und können bei Bedarf umsortiert werden.

## Urteils-Kurzreferenz (Sessions 235–241 + WP 243)

| Runde | Idee | Urteil | Kern |
|---|---|---|---|
| F2 (235) | Doppelkauf-Warner | **Backlog** | Read-only-Variante (Buchseiten-„Enthält" + `/ask/collections`, ~M) liegt entscheidungsreif; die Ursprungs-Vision (Overlap gegen eigene Sammlung) braucht Personal Library → hängt an WL. `availability` ist 896/896 leer. |
| F1 (236) | Status Imperialis | **bauen** | Eigene Route `/now`, hybrid DB-Module + kuratierte Prosa; vorher M42-Nachdatierung (Batches). |
| F3 (237) | Statistiken | **bauen** | Eigene statische Route `/statistics`, 7 handgerollte SVG-Charts, keine Dependency. `pageCount` 0/896 und `series_id` 8/896 sind aus dem Scope. |
| W4 (238) | Provenienz-Badges | **Backlog** | F1-B2/F3-B1 definieren ihr H/M/L-Wording lokal; wird W4 je gebaut, konsolidiert es diese Stellen. |
| W3a (239) | Charakter-Graph | **bauen** | Ko-Okkurrenz-v1 ohne Schema als „Verbindungen"-Modul auf `/character/[slug]`; kuratierte `character_relations` bleibt v2-Option (bräuchte Brief). |
| W3b (240) | Timeline auf der Map | **bauen (umgeplant)** | Drei diskrete Zeitkarten (M30/M31/M41-42) + Karten-Timeline; kein Schema, kein Jahr-Scrub (Datenlage: `work_locations.atY` leer, Buch-Datierungen 97/896). |
| W5 (240) | Podcasts auf Buchseite | **Backlog** | Post-launch-Revisit; dann Abdeckung beider Wege zählen (Event-Ableitung vs. `episode_covers_work`). |
| W6 (240) | Size Comparison | **Backlog** | Post-launch; Schema-Neubau → zuerst Brief. |
| WA (241) | Anhang, 7 Ideen | **7/7** | Facetten-Filter-UI **bauen** (896/896 Bücher facettiert, 17.403 Zuweisungen). Series-Status-Board, Verpasst-Generator, Charakter-Dossiers, Spoiler-Graph **Backlog**. Release-Radar **verworfen**. Personal Library → Runde **WL**. |
| WP (243) | Perfektions-Kandidaten (Worklist §§ C/D, 8 Posten) | **11/11** | Chronicle-/Entity-Restyle **abgeschlossen** (Philipp meldet sich selbst, falls ihn etwas stört). BrandBeacon: echtes Logo liefert Philipp vor Rollout, Einbau dann XS. Cartographer-Tails: Journey-Ästhetik **erledigt** (PRs #264/#265), Vermesser-Modus **verworfen**, Episoden-Link-Revisit + teilbarer `voyage`-Hash → in **W3b-B2** eingezogen. Galaspar-Pin **Backlog** (Koordinaten fehlen), Myr **verworfen** (keine Werk-Kanten). Arthas Moloch = Chart-`moloch` (Identität von Philipp bestätigt) → **bauen** (11b, inkl. Pin-Umbenennung). Drukhari-Starter **verworfen** (Ask-Umbau macht den Punkt irrelevant). Podcast-Aliasse **Backlog** (post-launch). Charakter-Long-Tail kein eigener Posten — als Dichte-Kontext in W3a-B1 verankert. |

**Backlog-Revisit-Trigger (Kurzform):** Series-Board erst nach `seriesHint`-Promotion (eigener Batches-Posten, 8/896 promotet bei 896/896 Hints); Verpasst-Generator als `/now`-Erweiterung, wenn `/now` live ist; Charakter-Dossiers nach W3a-Bau neu anschauen („Zuletzt gesehen" braucht mehr Datierungsdecke); Spoiler-Graph allenfalls fern mit Serien-Granularität. Aus WP (243): Galaspar-Pin, sobald Philipp Koordinaten von der neueren Redditor-Karte abgelesen hat (dann `pin`-Zeile in der Kurations-Excel + Regen, XS — Location/Blurb/Event/2 Buch-Kanten liegen komplett bereit); BrandBeacon-Tausch, sobald Philipps Logo vorliegt (XS, spätestens im S7b-Pass); Podcast-Aliasse als post-launch Kurationswelle (175 Formen entscheidungsreif vorsortiert in `scripts/seed-data/podcast-aliases.review.md` — A1/A2 ≈ 20 klare Entities zuerst, A3-Götter-Grundsatzfrage separat).

---

## Prompts

### 1 · WP — Perfektions-Kandidaten-Triage

```text
Werkstatt-Runde WP — Triage der Perfektions-Kandidaten aus der Worklist.

Scope: reine Triage, keine Umsetzung. Lies brain/wiki/worklist.md §§ C/D (Product: Chronicle-Desktop-Restyle, BrandBeacon, Cartographer-Tails · Data: Galaspar/Myr, arthas_moloch, Drukhari-Starter, Podcast-Aliasse, Charakter-Long-Tail) und den Plan-Nachtrag W1–W6 in docs/launch-master-plan.md.

Pro Posten: kurzer Ist-Stand-Check gegen den aktuellen Code/Datenbestand (nichts aus alten Notizen übernehmen, was inzwischen erledigt sein könnte), ungefähre Größe, Empfehlung. Dann urteile ich pro Posten (bauen / Backlog / verwerfen). Sehr kleine „bauen"-Posten dürfen nach Absprache direkt in derselben Session umgesetzt werden, wenn sie strang-rein bleiben. Urteile in docs/werkstatt-roadmap.md eintragen (Kurzreferenz + Fahrplan nachführen), Worklist-Nachführung läuft über den Koordinations-Rollup. Branch: codex/session-NNN-wp-triage. Kein Commit/PR, bis ich „fertig" sage.
```

### 2 · WL — Personal Library (local-first vs. spartanische Accounts)

```text
Werkstatt-Runde WL — Bewertung Personal Library („Meine Bibliothek").

Scope: Bewertungsrunde, keine Umsetzung. Anlass (WA-Triage, Session 241): Die Idee ist gut, aber Umfang + Accounts-Voraussetzung sind „eine andere Hausnummer" — vor dem Launch soll geprüft werden, ob es eine sehr spartanische, fahrbare Schiene gibt, doch Accounts anzubieten. Lies docs/post-launch-feature-ideas.md § Anhang (Personal Library, Vorbild heresytracker.app) und die Urteils-Kurzreferenz in docs/werkstatt-roadmap.md.

Erkunde ehrlich beide Schienen und lege sie mir mit Empfehlung + grober Größe vor:
- (a) Local-first ohne Accounts: localStorage + Export/Import — welche Flächen brauchen den Besitz-/Gelesen-Status (Buchkarten, Detailseite, Archiv-Filter), was kostet eine Bibliotheksseite, wo sind die Grenzen (Gerätewechsel, Verlust).
- (b) Spartanische Accounts: Was wäre das echte Minimum auf dem bestehenden Stack (Supabase Auth liegt bereit; eine user_library-Tabelle + RLS; submissions als Präzedenz für Nutzerdaten) — inkl. dessen, was Accounts an Dauerbetrieb, Moderations-/Datenschutz-Pflichten und Launch-Risiko nach sich ziehen.
- F2-Synergie mitdenken: die ursprüngliche Doppelkauf-Warner-Vision (Overlap gegen die eigene Sammlung) war genau hieran gescheitert.

Danach warte auf mein Urteil (bauen / Backlog / verwerfen) und trage es in docs/werkstatt-roadmap.md ein (Kurzreferenz + Fahrplan). Branch: codex/session-NNN-wl-bewertung. Kein Commit/PR, bis ich „fertig" sage.
```

### 3 · W3b-B1 — Drei Zeitkarten (Product, S–M)

```text
Werkstatt-Bau W3b-B1 — Drei Zeitkarten für den Cartographer (Product, S–M).

Kontext: W3b-Urteil „bauen" im umgeplanten Zuschnitt (Werkstatt-Runde Session 240; Kurzreferenz in docs/werkstatt-roadmap.md). Drei diskrete Kartenzustände: Stufe 1 Pre-Heresy (M30), Stufe 2 Horus Heresy (M31), Stufe 3 = heutige Karte (M41/42). Pins/Planeten bleiben in allen Stufen identisch; nur Zonen und zeitgebundene Instrumente schalten.

Umfang:
- zones.json: Sichtbarkeits-Feld pro Zone (z. B. states: ["pre","hh","now"]), Parser-Validierung in src/lib/map/zones.ts, Filter an beiden Renderer-Stellen (ZonesLayer SVG + canvas-renderer Android) — der Doppel-Renderer-Stand aus Session 213 gilt.
- Zonen-Tagging der 15 Bestandszonen: Maelstrom in allen drei Stufen; Tau Empire, Necron-Dynastien, Scourge Stars, Cicatrix Maledictum und übrige M41/42-Zonen nur Stufe 3.
- ~2 neue Zonen im Zone-Editor (/map?zones=edit) zeichnen: Eye of Terror (um die bestehende Katalog-Entität eye-of-terror bei gx≈260/gy≈232 herum; gilt in allen drei Stufen) und Ruinstorm (nur Stufe 2). Formen-Abnahme durch Philipp.
- Zeitgebundene Instrumente koppeln: Imperium-Nihilus-Schatten nur in Stufe 3 wählbar; Lumen Astronomican bleibt in allen Stufen verfügbar, der Rift-Schnitt seiner Maske gilt nur in Stufe 3.
- Stufen-Toggle v1-pragmatisch im Overlay-Block der Cartouche/des Sheets (das große Aufräumen ist Runde WM); Stufen-Zustand in den Map-Hash (parseMapHash/writeMapHash).

UI-Abnahme durch Philipp im Browser, keine Headless-Loops. Branch: codex/product-map-time-states. Kein Commit/PR, bis ich „fertig" sage. Danach Fahrplan-Haken in docs/werkstatt-roadmap.md.
```

### 4 · W3b-B2 — Karten-Timeline + Journey-Kopplung (Product, S)

```text
Werkstatt-Bau W3b-B2 — Karten-Timeline über die drei Zeitkarten (Product, S).

Kontext: W3b-Urteil „bauen" (Session 240); setzt W3b-B1 voraus.

Umfang:
- Play-/Stepper-Steuerung über die drei Stufen (M30 → M31 → M41/42, Beschriftung im Ären-Vokabular der Chronicle), diskrete Schritte — keine kontinuierliche Scrub-Interpolation, kein freies Jahr (Datenlage, siehe Urteils-Kurzreferenz W3b).
- Journey-Kopplung: mapState-Tag pro Voyage (great-crusade → Stufe 1; horus, garro, lion → Stufe 2; übrige inkl. guilliman → Stufe 3), Dispatch beim Voyage-Start, vorherigen Zustand beim Voyage-Ende wiederherstellen. Ein Tag pro Voyage — kein Stufenwechsel pro Station (bewusste v1-Grenze).
- Aus der WP-Triage (Session 243) eingezogen — teilbare Reise-Links: `voyage=<id>` in den Map-Hash (parseMapHash/writeMapHash); Restore beim Laden startet die Voyage, Zusammenspiel mit dem mapState-Tag und der Stufe im Hash beachten.
- Ebenfalls WP-Triage — Link-Revisit: Episoden-Links im WorldPanel-Popup gehen heute ankerlos auf die Show-Halle (workHref), nur der Weg über „All N records →" (Planeten-Gesamtansicht) trägt die funktionierende #ep-<id>-Marke. Beim Bau entscheiden: Popup-Links per Episoden-Slug-Anker nachrüsten (Spec liegt im Map-Plan: Archiv-Loader + Hash-Match id ODER slug, ~3 Dateien) oder bewusst lassen — kurz im Report begründen.

UI-Abnahme durch Philipp im Browser, keine Headless-Loops. Branch: codex/product-map-timeline. Kein Commit/PR, bis ich „fertig" sage. Danach Fahrplan-Haken in docs/werkstatt-roadmap.md.
```

### 5 · WM — Map-UI-Rework (Bewertung)

```text
Werkstatt-Runde WM — Bewertung Map-UI-Rework (Cartouche/Instrumente des Cartographer).

Scope: Bewertungsrunde, keine Umsetzung. Anlass (Philipp, Session 240): Mit den Great Journeys, der Karten-Timeline und den Zeitkarten aus dem W3b-Bau trägt das heutige Instrumenten-UI (Cartouche/CartoucheSheet: Census, Voyage-Buttons, Overlay-Buttons, Seek, Zonen-Cycle) zu viele Ebenen — das UI soll als Ganzes revisitet werden. Erkunde den Ist-Stand nach dem W3b-Bau (welche Instrumente existieren, wie stapeln sie sich auf Desktop-Cartouche vs. Mobile-Sheet) und lege eine Rework-Richtung mit Optionen, Empfehlung und grober Größe vor. Design-Dauerurteile beachten (kein Glow, keine nackten Linien-Buttons, Buch-Titelblatt-Sprache).

Danach warte auf mein Urteil (bauen / Backlog / verwerfen) und trage es in docs/werkstatt-roadmap.md ein (Kurzreferenz + Fahrplan; bei „bauen" den Bau-Prompt als Posten 6 ergänzen). Branch: codex/session-NNN-wm-bewertung. Kein Commit/PR, bis ich „fertig" sage.
```

### 7 · F1-B1 — M42-Nachdatierung (Batches, S–M)

```text
Werkstatt-Bau F1-B1 — M42-Nachdatierung für Status Imperialis (Batches, S–M).

Kontext: F1-Urteil „bauen" (Werkstatt-Runde Session 236; Kurzreferenz in docs/werkstatt-roadmap.md). Ziel: die „Jetzt"-Kante der Setting-Datierungen schließen, damit die /now-Seite vollständig trägt.

Umfang:
- ~20–25 neue Zeilen in scripts/seed-data/book-dates.json für bekannte M42-Bücher, die undatiert im Bestand liegen: Dawn of Fire #2–#8 (The Gates of Bones, The Wolftime, Throne of Light, The Iron Kingdom, The Martyr's Tomb, Sea of Souls), Belisarius Cawl: The Great Work, Blood of Iax, Mark of Faith, Day of Ascension, Witchbringer, Steel Tread, Longshot, Outgunned, Catachan Devil, Deathworlder, Assassinorum: Kingmaker, The Bookkeeper's Skull, Helbrecht: Knight of the Throne u. a. — Methode meist series-inherited/event-anchored, Konfidenz ehrlich (M/L), Quelle je Zeile.
- Die 2 hook-losen Indomitus-Events kuratieren (Psychic Awakening; Era-Marker nur, falls sinnvoll) in den Timeline-Seeds.
- Prüfpunkt im Weekly-Refresh-Runbook ergänzen: „trägt ein promotetes Buch eine Datierung jenseits des /now-Seitenstands oder ein neues Groß-Event → Status-Prosa prüfen".
- Kein Produktions-Write ohne explizites Go; DB-Apply + Snapshot laufen über das Content-Release-Runbook.

Branch: codex/ingest-batches-m42-dates. Kein Commit/PR, bis ich „fertig" sage. Danach Fahrplan-Haken in docs/werkstatt-roadmap.md.
```

### 8 · F1-B2 — `/now` Status Imperialis (Product, M)

```text
Werkstatt-Bau F1-B2 — Status Imperialis (Product, M).

Kontext: F1-Urteil „bauen" (Session 236). Eigene Route (Arbeitsname /now), Seitentitel „Status Imperialis", Sternwarte-Vokabular, hybrid: DB-Module + schlanke kuratierte Prosa im Code.

Umfang:
- Route src/app/now/ (Server Component; Loader nach loadTimeline-Muster mit cachedRead + eigenem Tag).
- DB-Module: Antwort-Kopf („Wann ist jetzt?" mit ~012.M42-Rahmung + Tempus-Incertum-Kasten), die Indomitus-Events der Spine (Blurbs, dateLabels, Hooks, Artwork), „diese Bücher spielen jetzt gerade" (works.startY ≥ 41999, sortiert nach Setting-Datum, dateLabel + Konfidenz dezent — H/M/L-Wording lokal definieren, W4 liegt im Backlog und würde später konsolidieren), Ära-Kontext aus eras.
- Kuratierte Prosa im Code: Kurzlage Imperium Sanctus / Nihilus (je ~1 Absatz) + Freshness-Stempel aus den Daten („gestützt auf N datierte Werke bis …").
- Anbindung: VII. Burger-Eintrag, Home-Doorway (Act 3), Querverweis aus der Indomitus-Ära der Chronicle.

UI-Abnahme durch Philipp im Browser, keine Headless-Loops. Branch: codex/product-status-imperialis. Kein Commit/PR, bis ich „fertig" sage. Danach Fahrplan-Haken in docs/werkstatt-roadmap.md.
```

### 9 · F3-B1 — `/statistics` Librarium-Statistiken (Product, M)

```text
Werkstatt-Bau F3-B1 — Librarium-Statistiken (Product, M).

Kontext: F3-Urteil „bauen" (Werkstatt-Runde Session 237; Kurzreferenz in docs/werkstatt-roadmap.md). Eigene statische Route (Arbeitsname /statistics), „Librarium"-Vokabular, handgerollte SVG-Charts als Server Components, keine neue Dependency, Interaktivität max. CSS-Hover.

Umfang:
- Route src/app/statistics/ (Server Component; Loader nach loadTimeline-Muster mit cachedRead + eigenem Tag; Aggregat-Queries in SQL, kein Client-Charting).
- Kopf: Stat-Tiles (Bücher, Autoren, Podcast-Episoden + Gesamtstunden, Welten, Events — Zahlen live aus der DB, nichts hartkodieren).
- 7 Charts: Publikationskurve pro Erscheinungsjahr gestapelt nach Format; Autoren-Liga (Top 15 mit Karriere-Spanne); Fraktions-Präsenz (Top-Fraktionen nach Buchzahl); Charakter-Leaderboard (Abdeckungs-Caveat dezent); meistbeschriebene Welten; Rating-Verteilung (Quelle Goodreads + Abdeckung ehrlich ausweisen); Setting-vs.-Erscheinung-Scatter (kuratierte Teilmenge, Confidence-Farben H/M/L — Wording lokal definieren, s. W4-Backlog; Punktzahl aus den Daten).
- Nicht im Scope: Seiten-/Serien-Auswertungen (pageCount 0/896, series_id 8/896), Availability, Chart-Library.
- Anbindung: Burger-Eintrag (nächste freie Ziffer; VII ist durch /now verplant), Sitemap, OG-Metadaten mit Blick auf Reddit-Teilbarkeit.

UI-Abnahme durch Philipp im Browser, keine Headless-Loops. Branch: codex/product-librarium-statistics. Kein Commit/PR, bis ich „fertig" sage. Danach Fahrplan-Haken in docs/werkstatt-roadmap.md.
```

### 10 · W3a-B1 — Charakter-Verbindungen (Product, S–M)

```text
Werkstatt-Bau W3a-B1 — Charakter-Verbindungen (Ko-Okkurrenz-v1) (Product, S–M).

Kontext: W3a-Urteil „bauen" (Werkstatt-Runde Session 239; Kurzreferenz in docs/werkstatt-roadmap.md). Abgeleitete Ko-Okkurrenz ohne Schema-Change; kuratierte character_relations und eine eigene Graph-Explorer-Route bleiben bewusste v2-Optionen (bräuchten dann den Brief).

Umfang:
- „Verbindungen"-Modul auf /character/[slug] (Ego-Netz des Charakters, Server Component; Ableitung per SQL im Entity-Loader oder eigenem Loader mit cachedRead + Tag).
- Ableitungsregeln (aus der Bewertung, Session 239): nur works.kind='book'; beide Seiten Rolle pov/appears; Sammelband-Container ausschließen (work_collections, 59 Stück — sonst Doppelzählung Roman+Omnibus); Gewicht = Zahl gemeinsamer Bücher; Standardansicht Kanten ≥2 gemeinsame Bücher, Aufklappen auf alle.
- Navigation = Links auf die Nachbar-Charakterseiten; Kanten-Detail = Liste der gemeinsamen Bücher (zitierfähig, Provenienz-Ethos).
- Kein Client-Graph-Framework, keine eigene Route; UI so schneiden, dass typisierte kuratierte Kanten später als Overlay dazukommen können.
- Dichte-Kontext (WP-Triage, Session 243): ~315 distinkte Buch-Charaktere liegen unpromotet in scripts/seed-data/book-review-queue.json (361 Add-Referenzen über 256 Bücher, 161 mit Rolle pov, 104 Referenzen mit Konfidenz ≥ 0.8). Wirkt das Verbindungen-Modul nach dem Bau dünn, ist eine pov-first-Promotions-Teilwelle (Batches) der Hebel — kein Umbau des Moduls. Der Charakter-Long-Tail ist bewusst kein eigener Werkstatt-Posten.

UI-Abnahme durch Philipp im Browser, keine Headless-Loops. Branch: codex/product-character-connections. Kein Commit/PR, bis ich „fertig" sage. Danach Fahrplan-Haken in docs/werkstatt-roadmap.md.
```

### 11 · WA-B1 — Archiv-Facetten-Filter (Product, M)

```text
Werkstatt-Bau WA-B1 — Facetten-Filterleiste im Archiv (Product, M).

Kontext: WA-Urteil „bauen" (Werkstatt-Runde Session 241; Kurzreferenz in docs/werkstatt-roadmap.md). Die kuratierten Facetten (896/896 Bücher, ~19 Zuweisungen/Buch, 12 Kategorien) werden als kombinierbare Filter-UI im Archiv-Register sichtbar — kein Schema, keine neuen Daten, keine neue Dependency.

Umfang:
- Filter-Contract erweitern (src/app/archive/filters.ts + browse-wire/loader): von einem einzelnen facet-Param auf mehrere Facetten über Kategorien hinweg; Semantik UND zwischen Kategorien, ODER innerhalb einer Kategorie (Standard-Faceted-Search); IDs weiter über das bestehende ID_PATTERN validieren; URL-gespiegelt — jede Kombination ist ein teilbarer Link (Reddit-Antwort-Tauglichkeit ist ausdrücklich Ziel); Seitenzahl (page) bei Filterwechsel auf 1 zurücksetzen.
- Filterleiste im Register (Erweiterung der WerkeFilters-Zeile bzw. eigener Rail-Block): Chip-Gruppen für Ton, Plot-Typ, Blickwinkel (POV Side), Einstieg (Entry Point), Länge, Thema — Auswahl der v1-Kategorien beim Bau begründen; Trefferzahl pro Chip über den Gesamtkatalog (keine leeren Sackgassen), Chips unter Null Treffern gedimmt statt versteckt; Mobile als einklappbares Panel.
- Sichtbarkeit strikt über isVisibleFacetCategory (src/lib/facet-visibility.ts) + facet_categories.visibleToUsers — NEON-14-Content-Warnings bleiben komplett draußen.
- Bestehende Ein-Facetten-Pfade (Such-Vorschlag, browse-facet-chip, Buchseiten-Links) auf den neuen Mehrfach-Contract heben, keine zweite Wahrheit daneben.
- Design-Dauerurteile beachten (kein Glow, keine nackten Linien-Buttons, Buch-Titelblatt-Sprache); Payload-Budget des Registers im Blick (S6-Messwerte im Report neu erheben).

UI-Abnahme durch Philipp im Browser, keine Headless-Loops. Branch: codex/product-archive-facet-filters. Kein Commit/PR, bis ich „fertig" sage. Danach Fahrplan-Haken in docs/werkstatt-roadmap.md.
```

### 11b · WP-B1 — Arthas-Moloch-Kartenlink (Batches, XS–S)

```text
Werkstatt-Bau WP-B1 — Chart-Welt „Moloch" an arthas_moloch linken und umbenennen (Batches, XS–S).

Kontext: WP-Triage (Session 243). Philipp hat die Identität bestätigt: die unverlinkte Chart-Welt `moloch` in scripts/seed-data/map-worlds.json (Dead World, Segmentum Ultima, gx 861.84/gy 539.26, locationId null) IST Arthas Moloch (Location `arthas_moloch`: 1 Buch — Farsight: Empire of Lies — + 1 Podcast-Episode; offene Zeile in map-worlds.review.md § 2). Nicht verwechseln: `moloch-iii` und das HH-`molech` sind andere Welten.

Umfang:
- Kurations-Zeile: in scripts/seed-data/source/map-worlds-curation.xlsx (Sheet „Kuration") auf der Zeile `arthas_moloch` → Aktion=link, Ziel=moloch. Philipp trägt die Zeile ein (sein Arbeitsformat); CC fasst die Excel nur nach expliziter Absprache an.
- Pin-Umbenennung „Moloch" → „Arthas Moloch": die Pipeline kann heute nicht umbenennen (Welten-Sheet = worldId|locationIdOverride|note; link setzt nur die locationId, der Excel-Name bleibt). Kleinen Opt-in-Name-Override ergänzen (z. B. optionale Spalte im Welten-Sheet; Parser + Validierung in scripts/map-worlds-core.ts, Sync-Writeback beachten). Kein globales „linked ⇒ Location-Name" — Umbenennung nur per expliziter Zeile.
- npm run import:map-worlds; regeneriertes map-worlds.json + map-worlds.review.md committen; npm run test:map-worlds grün.

Branch: codex/ingest-batches-arthas-moloch. Kein Commit/PR, bis ich „fertig" sage. Danach Fahrplan-Haken in docs/werkstatt-roadmap.md.
```

### 12 · Koordinations-Rollup — Brain + sessions/README

```text
Koordinations-Rollup — Brain und sessions/README auf den Werkstatt-Stand ziehen (Koordination, S–M).

Scope: Doc-only-PR aus dem Koordinations-Worktree (Rollup-Ownership nach CLAUDE.md). Nachzuziehen:
- sessions/README.md: Journey-Audit-Sessions mit den NEUEN Nummern 220–234 (Umnummerierung PR #268), Werkstatt-Runden 235–241 (kein eigener Report — auf docs/werkstatt-roadmap.md verweisen), Fahrplan-Sessions ab 242.
- brain/wiki/project-state.md + log.md (+ index.md falls nötig): Werkstatt-Stand laut Fahrplan/Kurzreferenz in docs/werkstatt-roadmap.md, Nummern-Deduplizierung #268, gemergte PRs seit dem letzten Rollup.
- Die zwei seit Session 219 unkommitteten Cowork-Edits im Worktree (brain/wiki/worklist.md, docs/launch-master-plan.md — je 1 Zeile Verweis auf die Werkstatt-Roadmap) inhaltlich prüfen und mitnehmen; Worklist zusätzlich um die WP-Urteile ergänzen, falls WP schon gelaufen ist.
- npm run brain:lint -- --no-write muss grün sein.

Branch: codex/session-NNN-brain-rollup. Kein Commit/PR, bis ich „fertig" sage. Danach Fahrplan-Haken in docs/werkstatt-roadmap.md.
```
