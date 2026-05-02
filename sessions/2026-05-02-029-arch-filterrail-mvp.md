---
session: 2026-05-02-029
role: architect
date: 2026-05-02
status: implemented
slug: filterrail-mvp
parent: 2026-05-02-028
links:
  - 2026-05-02-021
  - 2026-05-02-022
  - 2026-05-02-025
  - 2026-05-02-026
commits: []
---

# Stufe 2a.2 — FilterRail (Minimal-MVP)

## Goal

Eine schlanke Filter-Schiene auf der EraDetail-View, die die in Stufe 2b annotierte Bücher-Annotation für User sichtbar und filterbar macht — bewusst minimal, mit nur zwei Achsen und ohne Polish-Marathon.

Hintergrund für die bewusste Minimal-Setzung: Mit dem Plan-Reshuffle vom 2026-05-02 wird Phase 3 (Daten-Ingestion) vorgezogen, und Phase 4 reshapet danach die gesamte Timeline-Struktur (cineastischer, scaling für Hunderte von Büchern pro Ära). Das Filter-Modell wird dort vermutlich neu definiert. Investiere darum keinen Polish in eine FilterRail, die in einigen Wochen evtl. neu gemacht wird — der Wert dieser Session ist „2b-Annotation jetzt sichtbar machen", nicht „best-in-class Filter-UX bauen".

**EntryRail (vormals geplant als Stufe 2a.1) ist gestrichen.** Die Empfehlungs-/Einstiegs-Funktion wird vom Ask-the-Archive-Trichter in Phase 5 vollständig abgedeckt — EntryRail jetzt zu bauen wäre Doppelarbeit für einen kurzlebigen Code-Pfad. Falls beim Implementieren der Drang aufkommt, „eine kleine Empfehlungs-Schiene" oben drüber mit reinzubasteln: nicht tun. Out-of-scope unten.

## Design freedom — read before everything else

Alle visuellen Entscheidungen liegen bei dir. Konkret heißt das:

- **Form der Filter-Controls**: Pills, Chips, Dropdowns, Segments, Checkboxen — was zum bestehenden Stil (`?era=…`-Toggle, EraDetail-Track, DetailPanel-Modal) passt. Du hast den frontend-design-Skill und das Auge dafür.
- **Position**: über oder unter dem BookDots-Track, sticky oder nicht, im selben „chrome"-Bereich wie der EraToggle oder eigener Container — deine Entscheidung. Cowork hat keine Pixel-Vorgabe.
- **Active-State-Visualisierung**: wie ein gewählter Filter aussieht, wie ein Multi-Select sich „lesen" lässt, wie der Reset-Button aussieht — alles deine Wahl.
- **Empty-State-Copy**: welcher Wortlaut bei 0-Match passt (themengerecht, knapp). Keine Cowork-Vorgabe.
- **Mobile-Verhalten**: ein erster Wurf reicht. Wenn es auf Mobile als Drawer/Bottom-Sheet besser wäre — go for it. Wenn es nur „nicht broken auf Mobile" ist — auch okay (Mobile-Touch-Polish ist eine eigene spätere Aufgabe in Phase 4).
- **Animation-Timings, Farben, Spacing, Klassennamen**: alles dein Reich.

Die Acceptance-Bullets unten beschreiben Outcomes („Filter wirken in URL", „Multi-Select funktioniert"), keine Klassen-Shapes oder Pixel-Werte.

## Context

Letzte Sessions: 027/028 (Hygiene-Pack: HH-Total 10→54, Slug-Doc, `check:eras` in CI), 025/026 (DetailPanel + Deeplinks mit `?era=…&book=…`-Contract), 023/024 (Era-Anchor: `book_details.primary_era_id`), 021/022 (Rich-Seed: 26 Bücher voll annotiert). Schema-Foundation (Stufe 2a, Session 019/020) hat `works`+CTI mit `work_factions`-Junction und `work_facets`-Tabelle gebracht — beide sind die Datenquelle für die zwei Filter-Achsen dieser Session.

**Roadmap-Reshuffle 2026-05-02** (siehe ROADMAP.md): Phase 2 (Chronicle) schließt mit dieser Session. Danach Phase 3 = Daten-Ingestion (vorgezogen, paralleles Scrapen während Feature-Arbeit weiterläuft), dann Phase 4 = Discovery-Layer (Timeline-Reshape + DB-/Sortier-Seite + Detail-Seiten + persönliche Bibliothek). Cartographer + Ask the Archive sind nach Phase 5 verschoben.

Heute rendert EraDetail alle Bücher der Ära als BookDots im Track, ohne Filter. Die in 2b annotierten Facets (Fraktion, Length-Tier, Tone, Theme, Content-Warning) sind heute nur sichtbar, wenn der User ein Buch anklickt und das DetailPanel-Modal öffnet — der ganze Reichtum der hand-kuratierten Annotation ist also vor dem User versteckt. Die FilterRail soll davon zwei Achsen für Filter-Aktionen freilegen.

## Constraints

1. **Genau zwei Filter-Achsen.** Fraktion (über `work_factions`-Junction) und Length-Tier (über `work_facets WHERE category='length_tier'`). Tone, Theme, Content-Warning bleiben aus dieser Session draußen — siehe „Out of scope".

2. **URL-State.** Filter persistieren in URL als `?era=<id>&faction=<id>[,<id>]&length=<value>[,<value>]`. Multi-Wert pro Achse als comma-separated Liste. State-Update via `router.replace()` (kein Full-Reload, kein History-Pollution bei jedem Click).

3. **Semantik:** OR innerhalb einer Achse, AND zwischen Achsen. Beispiel: `?era=horus_heresy&faction=thousand_sons,space_wolves&length=novella` heißt „(Thousand Sons ODER Space Wolves) UND Length = novella".

4. **Filter-Optionen werden zur Render-Zeit aus den real existierenden DB-Werten dieser Ära generiert.** Keine Hardcoded Faction-Liste. Nur Werte rendern, die mindestens ein Buch in der aktuellen Ära referenzieren. (Empfehlung in Open Questions: Achse ganz ausblenden, wenn nur 1 Wert existiert — sonst nutzlos.)

5. **Reset bei Era-Wechsel.** Wenn der User über den EraToggle (TopChrome) zu einer anderen Ära wechselt, droppen alle Filter-Werte. URL nach Era-Wechsel: `?era=<new>`, ohne `faction`/`length`-Parameter. (Begründung: Filter-Werte sind Era-spezifisch — Faction-IDs aus M30 ergeben in M41 wenig Sinn.)

6. **FilterRail wirkt nur auf EraDetail, nicht auf Overview-Ribbon.** Die Per-Era-Count-Badges im Overview bleiben unfilteriert. (Filter im Overview wären ein größerer UX-Wurf — Counts müssten live re-berechnen plus visuell anzeigen, was wegfilteriert ist. Gehört in Phase 4-Reshape.)

7. **Empty-State.** Wenn die Filter-Kombination 0 Bücher matcht: kurze, themengerechte Copy + sichtbarer Reset-Button. Kein leerer Track ohne Hinweis.

8. **Filter-Logik server-seitig.** Die Loader-Funktion (heute irgendwo zwischen `src/app/timeline/page.tsx` und einer Helper-Funktion — siehe `loadBookDetail`/`resolveBookEra`-Pattern aus 026) bekommt die Filter-Parameter und filtert in SQL via Drizzle. **Kein Client-Side-Filter über alle vor-geladene Bücher.** Begründung: Vorbereitung auf Phase-3-Skala. Wenn statt heute 26 demnächst 300+ Bücher pro Ära kommen, muss der Pattern tragen.

9. **Server-Component bleibt Server-Component.** EraDetail (oder das, was die BookDots rendert) bleibt Server. Die FilterRail-Komponente, die den User-Input verarbeitet, ist `'use client'` und liest Filter-State via `useSearchParams` aus dem URL. Kein DB-Import in Client-Bundle (siehe 026 für das Pattern).

10. **DetailPanel-Verhalten unverändert.** Der `?book=<slug>`-Parameter beeinflusst Filter nicht, und Filter-Änderungen brechen ein offenes DetailPanel nicht ungewollt. Filter-State und Book-Modal-State sind orthogonal. Wenn beide Parameter gleichzeitig in der URL sind (`?era=…&faction=…&book=…`), funktioniert das Modal weiterhin und der Filter wirkt auf den Track im Hintergrund.

11. **Keine Schema-Änderung.** Falls deine Filter-Query ein neues DB-Index braucht (z.B. auf `work_facets(category, value)`), in einer eigenen Migration mit Begründung im Report flaggen — nicht stillschweigend dazupacken.

## Out of scope

- **EntryRail.** Komplett gestrichen — siehe Goal/Context. Nicht spekulativ vorbauen, auch nicht „nur einen Platzhalter".
- **Tone-, Theme-, Content-Warning-Filter.** Bleiben für Phase-4-Reshape.
- **Filter auf Overview-Ribbon.** Per-Era-Counts bleiben unfilteriert.
- **Mobile-Touch-Optimierung jenseits des Minimum-Brauchbaren.** Wenn es auf Mobile irgendwie funktioniert, reicht — eigene Polish-Aufgabe in Phase 4.
- **Andere Filter-Persistenz-Mechanismen.** Kein Local-Storage, keine Cookies. URL-only — Reddit-shareability ist Teil des Designs.
- **Pan-Scrubber click-to-jump, M39–M41-Encoding-Gap, Cluster-Collapse.** Alle in Phase 4.
- **`series.totalPlanned`-Sammelposten** (Carry-over). Bleibt liegen — Phase-3-Datenmenge wird das ohnehin neu sortieren.
- **`secondary_era_ids`-Multi-Era-Sichtbarkeit** (Carry-over). Filter würden das Thema schärfen, aber gehört nicht in diese Session.
- **Filter-Empfehlungen / „häufig gewählte Kombination"-UX.** Phase 4 / 5.

## Acceptance

Die Session ist durch wenn:

- [ ] FilterRail rendert auf `/timeline?era=<id>` (Position visuell deine Wahl) mit den zwei Achsen Fraktion + Length-Tier; Optionen aus DB-Werten der aktuellen Ära generiert.
- [ ] Multi-Select pro Achse, OR/AND-Semantik wie in Constraints spezifiziert.
- [ ] URL-State `?era=…&faction=…&length=…` korrekt geschrieben und gelesen; Browser-Back/Forward funktionieren.
- [ ] Era-Wechsel über EraToggle droppt Filter-Werte aus der URL.
- [ ] Empty-State erscheint sichtbar bei 0-Match-Kombination, mit funktionierendem Reset-Button.
- [ ] DetailPanel-Modal (`?book=<slug>`) funktioniert unverändert auch bei aktiven Filtern in der URL.
- [ ] `npm run lint`, `npm run typecheck`, `npm run check:eras`, `npm run build` grün.
- [ ] Curl-Smoke: `curl -sS "http://localhost:3000/timeline?era=horus_heresy&faction=thousand_sons"` rendert HTML, das nur die Magnus/Thousand-Sons-HH-Bücher als BookDots enthält (vergleiche gegen Baseline ohne Filter).
- [ ] Mindestens ein zweiter Curl-Smoke mit kombinierten Filtern auf einer anderen Ära (Vorschlag: `?era=time_ending&length=novella` — sollte je nach 2b-Daten 0–N Treffer ergeben; wenn 0, schöner Empty-State).

## Open questions

- **Single-Source-of-Truth für Filter-State?** Empfehlung: URL ist die einzige Wahrheit (jede Filter-Aktion → URL-Update → React liest neu via `useSearchParams`). Wenn das Flicker oder Race-Conditions in der Praxis macht, deine Entscheidung — dann mit lokalem State + URL-Sync. Bitte im Report begründen, falls du abweichst.
- **Achse ausblenden bei nur 1 Wert?** Empfehlung: ja — ein Filter mit nur einer Option ist sinnfrei und konsumiert visuell Platz. Konkretes Beispiel: Wenn `time_ending` nur Bücher mit length-tier=`novel` hat, sollte die Length-Achse dort gar nicht rendern. Akzeptabel ist auch: rendern aber als "disabled" markieren. Deine Wahl, im Report begründen.
- **Komponentenname.** Annehmen `src/components/timeline/FilterRail.tsx` parallel zu `Overview.tsx`/`EraDetail.tsx`. Wenn du eine bessere Stelle siehst (z.B. zwei Komponenten — `FilterRail.tsx` als Container + `FilterPills.tsx` als visuelles Atom), go ahead.
- **Drizzle-Query-Pattern.** Heute machen die Loader vermutlich ein einfaches `select().where(eq(books.primaryEraId, eraId))`. Mit Filter wird das ein Multi-Join (`books` × `work_factions` × `work_facets`). Bitte mit `EXPLAIN`/Logging prüfen, dass die Query nicht in Quadratisches reinläuft — nicht dramatisch bei 26 Büchern, aber wir wollen den Pattern tragen sehen.

## Notes

- **Verifikations-Pfad.** Du hattest in 028 erwähnt, dass `psql` lokal nicht in PATH ist und du ad-hoc `tsx`-Scripts genutzt hast. Falls du wieder DB-Queries verifizieren musst: gleiches Recht, kein Pattern wird draus, kleine `_tmp-…ts`-Files in `scripts/` sind okay solange sie nicht committed werden.
- **JSX-Boundary-Hinweis aus 028.** Der `<!-- -->`-Kommentar zwischen adjacent JSX-Expressions macht curl-greps fragil. Wenn du in den Acceptance-Curl-Smokes auf gerenderte Texte greppst (z.B. „Magnus the Red"), nutze Patterns mit Tolerance dafür oder grep auf data-attributes / dot-IDs.
- **Carry-over-Items.** Bleiben liegen wie sie in `sessions/README.md` stehen. Diese Session bringt keine raus und keine neuen rein — sauberer Schluss von Phase 2.
- **Phase-3-Brainstorm-Brief folgt.** Sobald 029 implementiert und der Report gelesen ist, eröffnet die nächste Cowork-Session einen Architektur-Brainstorm-Brief für Phase 3 (Ingestion + Automation-Layer). Das ist kein Implementierungs-Brief, sondern ein Decision-Brief — entsprechend anders strukturiert.
