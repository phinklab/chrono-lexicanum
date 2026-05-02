---
session: 2026-05-01-021
role: architect
date: 2026-05-01
status: implemented
slug: rich-seed-2b
parent: null
links:
  - 2026-05-01-019
  - 2026-05-01-020
  - 2026-05-02-022
commits:
  - 2df6dd2
  - 694340d
  - d5afa16
---

# Stufe 2b — Rich Seed (26 Bücher voll annotiert) + Hub-Count-Refresh

## Goal

Den Stufe-2a-Schema-Apparat mit echten Daten füllen: **23 zusätzliche Bücher
auf den 3-Buch-Sanity-Fixture aufpacken, sodass `db:seed` auf 26 voll
annotierte Werke landet** (factions, persons, facets, external_links pro Buch).
Parallel den Hub-Footer-Count auf eine ISR-Revalidate-Strategie setzen, damit
die "Novels Indexed"-Zahl ohne manuelles Redeploy aktuell bleibt. Die UI
verändert sich dabei nicht strukturell — die Timeline rendert die neuen Bücher
auf den vorhandenen Surfaces. Stress-Punkte sind die Era-Verdichtung (16/26 in
`time_ending`), lange Buch-Titel im BookDot-Tooltip, und die
Reference-Table-Erweiterungen.

## Design freedom — read before everything else

Dieser Brief ist primär Daten-Arbeit; kein neues UI-Surface, keine neue
Komponente. **Aber:** mit dem Sprung von 3 auf 26 Büchern wird die
Era-Detail-View in den dichteren Eras (vor allem `time_ending` mit 16 Büchern,
`horus_heresy` mit 4) sichtbar anders aussehen als nach Session 013. Wenn dabei
Brüche auffallen — BookDot-Crowding, Tooltip-Truncation bei "Ghazghkull Thraka:
Prophet of the Waaagh!" oder "Vaults of Terra: The Carrion Throne", Author-
Display-Länge bei langen Pseudonymen — ist die Behebung **dein Designer-Call**.
Halte dich am bestehenden Vokabular von Overview / EraDetail (Sessions 011 / 013):
serif für Titel, mono für Kicker, oklch-Leitfarben, buzzy hover. Wenn die
Lösung ist "Tooltip wraps zu zwei Zeilen", "Titel wird bei N Zeichen
ellipsiert", "BookDots clustern automatisch ab N pro Era" — alles dein Aufruf,
keine Architekten-Genehmigung nötig. Begründe im Report.

Sonst: keine UI-Aesthetik-Entscheidungen in diesem Brief. Hub bleibt visuell wie
nach 013. Cluster-collapse für dichte Eras ist explizit Stufe 2c oder Phase 4
(siehe Out-of-scope).

## Context

### Wo wir stehen

Stufe 2a (Sessions 019/020) hat das works-zentrische Schema ausgerollt:
`works` + 4 Detail-Tabellen (CTI), 12 Facet-Kategorien mit 85 Werten, services
und external_links, unified persons. Hub-Footer und Timeline-Page lesen seitdem
aus `works WHERE kind='book'`. 3-Buch-Sanity-Fixture (Horus Rising, Eisenhorn:
Xenos, Dark Imperium) ist voll annotiert geseedet. Build grün, Discriminator-
Sanity-Counts = 0, Vercel-Preview live.

### Was Cowork bereits getan hat (vor diesem Brief)

Die Seed-Daten sind **fertig populiert in seed-data/** — Cowork-Recherche aus
Lexicanum / Black Library / ISFDB / Wikipedia, hand-kuratiert per Carry-over-
Vorgabe (kein automatischer Crawler). Konkret:

- `scripts/seed-data/books.json` — 26 Bücher (3 Sanity unverändert + 23 neu).
  Sanity-Mini-Korrektur: `di01 Dark Imperium` hat jetzt `series:
  "dark_imperium", seriesIndex: 1` (war im Original-Seed eine Lücke; series-
  Reference existierte bereits in `series.json`).
- `scripts/seed-data/factions.json` — additiv um 4 Factions erweitert
  (`imperial_fists`, `black_templars`, `sisters_of_battle`, `orks`). 25 → 29.
- `scripts/seed-data/series.json` — additiv um 7 Series erweitert
  (`beast_arises`, `dawn_of_fire`, `vaults_of_terra`, `farsight`,
  `path_of_the_eldar`, `grey_knights_trilogy`, `priests_of_mars`). 14 → 21.
- `scripts/seed-data/persons.json` — additiv um 10 Autoren erweitert (Aaron
  Dembski-Bowden, Graham McNeill, Sandy Mitchell, Gav Thorpe, Chris Wraight,
  Nate Crowley, Robert Rath, Phil Kelly, Rachel Harrison, Ben Counter). 2 → 12.
- `docs/data/2b-book-roster.md` — Cowork-Begleit-Dokument (Quellen-Links,
  Confidence-Map, Wert-Begründungen pro Buch). **Du musst dieses Doc nicht
  lesen, um den Brief umzusetzen** — es ist Audit-Trail / Philipp-Review-
  Surface. Falls dir bei einem Buch ein Wert seltsam vorkommt, schaust du dort
  nach der Source.

### Era-Verteilung der 26 Bücher

| Era | Anzahl | Stress-Hinweis |
|---|---|---|
| `great_crusade` | 2 | Legion · The First Heretic |
| `horus_heresy` | 4 | Horus Rising · Mechanicum · Know No Fear · Master of Mankind |
| `age_rebirth` | 1 | The Talon of Horus |
| `long_war` | 1 | I Am Slaughter |
| `age_apostasy` | 0 | (Romanlandschaft fast leer) |
| `time_ending` | 16 | **dichteste Era — UI-Stress-Punkt** |
| `indomitus` | 2 | Dark Imperium · Avenging Son |

### Hub-Footer-Count

Heute: `select count(*) from works where kind='book'` in `src/app/page.tsx`.
Next prerendert die Route statisch — Count wird zur Build-Zeit gebacken. Mit
3 Büchern war das harmlos; mit 26+ und perspektivisch wachsend lohnt sich ISR.
Carry-over (aus 015) markiert das als ungelöst und 2b-relevant.

## Constraints

### Daten-Seed

1. **Daten sind ready.** Du sollst die seed-data/*.json **nicht** umschreiben,
   ergänzen oder „verbessern". Wenn dir bei der Validierung ein konkreter Wert
   defekt vorkommt (z.B. ein faction-FK auf einen nicht-existenten id), flag
   im Report — fix das aber nicht eigenmächtig. Eine zweite Cowork-Runde
   korrigiert das im Roster-Doc und in der JSON.

2. **`npm run db:seed` muss idempotent durchlaufen** und ohne Fehler enden.
   Erwartete Output-Counts (in dieser Größenordnung):
   - 7 eras (unverändert)
   - 29 factions (war 25, +4)
   - 21 series (war 14, +7)
   - 5 sectors (unverändert)
   - 28 locations (unverändert)
   - 0 characters (unverändert — keine `characters: [...]` arrays in den 26
     Büchern; siehe Out-of-scope)
   - 18 services (unverändert)
   - 12 facet_categories (unverändert)
   - 85 facet_values (unverändert)
   - 12 persons (war 2, +10)
   - **26 works (kind=book)**
   - **26 book_details**
   - **~70 work_factions** (3.0 Faction-Refs/Buch im Schnitt — siehe Tabelle
     unten für die exakte Erwartung)
   - **26 work_persons** (genau 1 author/Buch in 2b)
   - **~290 work_facets** (im Schnitt 11 Facet-Werte/Buch — Pflicht plus
     best-effort)
   - **26 external_links** (genau 1 Lexicanum-URL pro Buch in 2b)

   Toleranz auf den junction-Counts: ±10% ist okay (ich habe nicht jedes
   Faction-Array exakt durchgezählt). Wenn der Output massiv abweicht (>15%),
   ist das Signal für ein Daten-Problem — flag im Report.

3. **Discriminator-Sanity-Query weiter `0`.** Die in 020 etablierte Sanity-
   Query (`SELECT count(*) FROM book_details bd JOIN works w ON w.id=bd.work_id
   WHERE w.kind != 'book'`) muss nach dem Seed weiterhin `0` zurückgeben —
   analog für die anderen Detail-Tabellen.

### Hub-Footer ISR-Revalidate

4. **`src/app/page.tsx` bekommt `export const revalidate = 3600`** (eine
   Stunde). Begründung: Buch-Population wächst in dieser Phase wöchentlich, nicht
   stündlich, aber 3600 ist der konventionelle Default für „aktuell genug ohne
   Cache-Investition" in Next 15 ISR. Kein on-demand-Revalidation, keine API-
   Route, keine Webhook-Komplexität — der einfachste Mechanismus, der die
   carry-over-Sorge schließt. Wenn dir bei der Implementierung auffällt, dass
   `revalidate = 86400` (täglich) für unseren Use-Case besser passt (weil die
   Buchanzahl tatsächlich nur in diskreten Releases wächst), darfst du das so
   wählen — begründe im Report. **Keine SSR / `export const dynamic = 'force-
   dynamic'`** — das wäre Overkill und würde die Performance des sonst
   statischen Hubs unnötig schädigen.

### Reference-Table-Erweiterung (FK-Konsistenz)

5. **Die 4 neuen Factions, 7 neuen Series und 10 neuen Persons müssen in der
   DB landen.** Der bestehende Seed-Mechanismus (`db.insert(factions).values(...)`
   etc.) deckt das automatisch — die JSONs sind erweitert, der Seed
   reflektiert sie. Wenn du beim Seed einen Foreign-Key-Verstoß siehst, ist
   die Reihenfolge der Inserts in `seed.ts` möglicherweise zu fragil
   (factions inserted *vor* works → faction-FKs validieren, daher okay; aber
   prüfen falls du Friktion siehst).

### Build-Akzeptanz

6. `npm run lint` grün. `npm run typecheck` grün. `npm run build` lokal grün.
   PR-CI (`ci / lint-and-typecheck`) grün. Vercel-Preview-Deploy grün
   (Migrate-Step trivially no-op; next-build-Step grün; `/healthz` 200).

### UI-Smoke (auf 26-Bücher-Skala)

7. **Lokale Smoke-Checks im Browser auf `next start`** (siehe Acceptance unten
   für die Liste). Wenn dabei eine Komponente strukturell bricht (Layout-
   overflow, Tooltip-Tooth-Issue mit langen Titeln), fix das im Rahmen der
   Design-Freiheit (siehe oben).

## Out of scope

- **Schema-Änderungen.** Stufe 2a hat das Schema gelegt. 2b ist reine Daten-
  Erweiterung plus eine 1-Zeile-Modifikation an `src/app/page.tsx`. Wenn dir
  bei der Validierung etwas am Schema unsauber vorkommt, flag in „For next
  session" — nicht in diesem Brief fixen.
- **`work_characters` und `work_locations` Junctions populieren.** Die 2b-
  books.json hat **keine** `characters: [...]` oder `locationId` Felder.
  Junction-Wiring ist 2c-Arbeit (DetailPanel + Cartographer-Pins). Lass die
  bestehenden seed.ts-Pfade dazu unangefasst; sie sind aktuell no-ops mit
  unseren Daten.
- **`confidence` und `source_kind` per Buch.** seed.ts schreibt heute hardcoded
  `sourceKind: "manual"`, `confidence` defaultet auf `1.00`. Cowork hat im
  Roster-Doc eine Confidence-Map für 7 Bücher festgehalten (`pe01`, `gk01`,
  `pm01`, `nl01`, `bl01`, `gh01`, `id01` mit Werten 0.6–0.8), aber der Seed
  greift sie nicht ab. Die per-Buch-Confidence-Persistenz ist Phase-4-Aufgabe
  (Ingestion-Pipeline mit echtem Provenance-Layer). Heute keine Anpassung.
- **`books.json`-Werte umschreiben.** Wenn dir bei einem Buch ein Datums-
  Anker oder ein Faction-Tag schief vorkommt: flag im Report; nicht editieren.
- **FilterRail / EntryRail / Cluster-Collapse.** Die Facets sind in der DB,
  aber 2b verkabelt sie nicht in die UI. Stufe 2c (DetailPanel +
  Filter-Surface).
- **Cartographer Buch-Pins.** Stufe 2c.
- **DetailPanel + `/buch/[slug]` Voll-Wiring.** Stufe 2c. Die Stub-Routen
  bleiben fehlerfreie Stubs.
- **Session 018 anfassen.** Auf Eis. Reaktivierung in Stufe 2c.
- **Pseudonym-Auflösung in der UI.** Sandy Mitchell ist Pseudonym von Alex
  Stewart (im `bio`-Feld dokumentiert). Die UI rendert „Sandy Mitchell" als
  Author-Display — kein Disclaimer-Text in 2b.
- **External-Link-Erweiterung.** Jedes Buch hat aktuell genau 1 Lexicanum-URL.
  Black-Library / Goodreads / Audible kommen mit der DetailPanel-UI in 2c.
- **Phase-4-Ingestion-Pipeline.** Bleibt für 200+-Skala, nach 2c.

## Acceptance

Die Session ist fertig, wenn:

### Daten in der DB

- [ ] `npm run db:seed` läuft idempotent durch, Output meldet 26 works
  (kind=book), 26 book_details, 12 persons, 29 factions, 21 series.
- [ ] Die in Constraint 2 gelisteten Counts treffen ungefähr (±10% auf
  junction-Counts ist okay).
- [ ] Discriminator-Sanity-Query auf allen 4 Detail-Tabellen liefert weiter
  `0`.
- [ ] Drizzle Studio (`npm run db:studio`) zeigt 26 Werke mit korrekten
  Joins (z.B. `works WHERE kind='book' AND startY < 31000` listet die 6
  Pre/Heresy-Era-Bücher).

### Hub

- [ ] `src/app/page.tsx` hat `export const revalidate = 3600` (oder 86400,
  begründet) hinzugefügt.
- [ ] `/` rendert mit „**26** Novels Indexed" im Footer.
- [ ] Nach einem manuellen DB-Update (z.B. ein Buch via Drizzle-Studio
  hinzufügen) und Cache-Wartezeit aktualisiert sich der Count ohne Redeploy.
  (Du musst diesen End-to-End-Test nicht zwingend live durchspielen — die
  ISR-Revalidate-Konfiguration genügt; vermerke im Report aber, dass das
  Verhalten erwartet wird.)

### Timeline

- [ ] `/timeline` rendert die Overview-Ribbon, alle 7 Eras zeigen ihre Buch-
  Anzahl korrekt:
  - `great_crusade`: 2
  - `horus_heresy`: 4
  - `age_rebirth`: 1
  - `long_war`: 1
  - `age_apostasy`: 0 (oder kein Badge — was die UI heute macht)
  - `time_ending`: 16
  - `indomitus`: 2
- [ ] `/timeline?era=horus_heresy` zeigt **4** BookDots in EraDetail (Horus
  Rising, Mechanicum, Know No Fear, Master of Mankind), Tooltip-Hover für
  jedes funktioniert.
- [ ] `/timeline?era=time_ending` zeigt **16** BookDots ohne strukturellen
  Layout-Bruch.
- [ ] `/timeline?era=age_apostasy` zeigt den existierenden empty-state
  (cogitator-empty-Pattern, weil 0 Bücher).
- [ ] Lange Titel (`Ghazghkull Thraka: Prophet of the Waaagh!`,
  `Vaults of Terra: The Carrion Throne`) rendern im Tooltip ohne
  visuelles Brecheisen — entweder voll, oder mit ellipsis. Dein Call.

### Stubs

- [ ] `/map`, `/ask`, `/buch/[slug]`, `/fraktion/[slug]`, `/welt/[slug]`,
  `/charakter/[slug]` weiterhin 200 / fehlerfrei (kein DB-Aufruf, keine
  Build-Fehler).
- [ ] `/healthz` antwortet 200.

### Build & CI

- [ ] `npm run lint` grün.
- [ ] `npm run typecheck` grün.
- [ ] `npm run build` lokal grün.
- [ ] PR-CI grün.
- [ ] Vercel-Preview-Deploy grün; live-URL des Previews zeigt Hub mit
  „26 Novels" und Timeline mit allen 26 Büchern.

### Dokumentation

- [ ] `scripts/seed-data/README.md` aktualisiert: 26 Bücher statt 3, neue
  Faction-/Series-/Person-Counts, Verweis auf `docs/data/2b-book-roster.md`
  als Begleit-Doc.
- [ ] `ROADMAP.md` Stufe 2b abgehakt; Stufe 2c (DetailPanel + Reaktivierung
  von Session 018) bleibt der nächste Schritt.
- [ ] Dieser Brief (`2026-05-01-021`) auf `status: implemented` gesetzt,
  Commits-Liste in der Frontmatter gefüllt.
- [ ] `sessions/README.md` Active-Threads-Tabelle mit der neuen Impl-Session
  aktualisiert; Carry-over-Punkte „Hub novel-count freshness" und „2b
  Facet-Fillrate" gestrichen (in diesem Brief gefoldet).

## Open questions

Bitte im Report beantworten:

- **Hub-Revalidate-Wahl.** 3600 oder 86400? Begründe deine Wahl — wenn du eine
  dritte Variante (on-demand-Revalidation via Webhook, Tag-based-revalidation)
  wählst, sage warum.
- **UI-Stress bei 16 Büchern in `time_ending`.** Wie verhält sich EraDetail?
  Kommt es zu BookDot-Crowding, Tooltip-Overlap, oder bleibt das visuell
  ruhig? Falls du was anpassen musstest, beschreibe was und warum.
- **Lange Titel im BookDot-Tooltip.** Wie hast du Ghazghkull / Vaults of Terra
  / The Devastation of Baal gerendert? Truncation-Schwelle, Wrap-Verhalten,
  oder beides?
- **Author-Display weiterhin Single-String.** Alle 26 Bücher haben in 2b genau
  1 Autor. Hast du den Multi-Author-Code aus 020 angefasst? (Sollte nein —
  das Verhalten ist by design `authors[0]` wenn array length 1.)
- **Reference-Table-Order im Seed.** Bist du in eine FK-Friction gelaufen
  (z.B. `work_factions` gegen `factions` mit dem 4 neuen Einträgen)? Wenn
  ja, wie gelöst?
- **Idempotenz-Test.** Hast du `npm run db:seed` zweimal hintereinander laufen
  lassen, um zu bestätigen dass die Counts identisch bleiben? (Stufe 2a hat das
  als Pattern eingeführt.)
- **Was war das schmerzhafteste Stück?** Oder lief es trivial durch? Damit
  Cowork beim Stufe-2c-Brief weiß, wo die Welle bricht.
- **Confidence-Map ungelesen.** Cowork hat im Roster-Doc eine Confidence-
  Tabelle für 7 unsichere Datierungen festgehalten, aber der Seed greift sie
  nicht ab. Hast du beim Sichten dieser Bücher (`pe01`, `gk01`, `pm01`,
  `nl01`, `bl01`, `gh01`, `id01`) was gesehen, das uns sagt „diese Datierung
  ist falsch"? Falls ja: nicht in 2b fixen, aber ins Report-„For next session"
  eintragen.

## Notes

### A. Wo die Daten herkommen

Cowork hat per WebFetch / WebSearch hand-kuratiert aus:

- **Lexicanum** (`wh40k.lexicanum.com`) — primäre Source für in-universe-
  Datierung, Faction-Listen, Charakter-IDs, Series-Position. Pro-Buch-URL ist
  in `books.json[*].externalLinks[0].url`.
- **Black Library** (`blacklibrary.com`) — Verlags-Synopsen als Cross-Check.
  Synopsen in `books.json` sind paraphrasiert, nicht copy-paste, um Verlags-
  Copyright nicht zu reizen.
- **ISFDB** (`isfdb.org`) — Bibliographie-Tiefe für `pubYear`.
- **Wikipedia** — Autoren-Bibliographie + Geburtsjahre wo nicht in Lexicanum.

Die per-Buch-Begründungen für editorial-Calls (`tone`, `theme`, `plot_type`,
`entry_point`) liegen in `docs/data/2b-book-roster.md` — wieder, du musst das
nicht lesen, aber falls du beim Validieren denkst „warum hat der Roman
`hopepunk` und nicht nur `grimdark`?", findest du die Antwort dort.

### B. Reading-Order / Era-Bias

Time-of-Ending ist mit 16/26 (62%) bewusst der dickste Brocken — das spiegelt
den Bias der 40k-Romanlandschaft (M41 ist die „Standard-Era" der Spielwelt).
Wenn das in der EraDetail-View visuell unangenehm wird, ist das ein
Designauftrag den du im Rahmen der Design-Freiheit angehst, nicht ein
Datenproblem das wir umbiegen.

### C. Faction-Diversität (für Sanity-Verifikation)

Falls du in der DB stichprobenartig joins prüfen willst, hier die erwarteten
Primary-Faction-Counts:

```
ultramarines     → 3 (Know No Fear, Dark Imperium, Avenging Son)
sons_of_horus    → 1 (Horus Rising)
alpha_legion     → 1 (Legion)
mechanicus       → 2 (Mechanicum, Priests of Mars)
word_bearers     → 1 (The First Heretic)
custodes         → 1 (Master of Mankind)
chaos            → 1 (The Talon of Horus)
imperial_fists   → 1 (I Am Slaughter)
astra_militarum  → 1 (Gaunt's Ghosts)
commissariat     → 1 (Ciaphas Cain)
inquisition      → 3 (Eisenhorn, Ravenor, Carrion Throne)
night_lords      → 1 (Soul Hunter)
black_templars   → 1 (Helsreach)
iron_warriors    → 1 (Storm of Iron)
eldar            → 1 (Path of the Warrior)
orks             → 1 (Ghazghkull)
blood_angels     → 1 (Devastation of Baal)
necrons          → 1 (The Infinite and the Divine)
tau              → 1 (Farsight)
sisters_of_battle→ 1 (Mark of Faith)
grey_knights     → 1 (Grey Knights)
————————————————————
Σ primary        = 26
```

Sanity-SQL: `SELECT faction_id, count(*) FROM work_factions WHERE role='primary'
GROUP BY faction_id ORDER BY count DESC`. Sollte 21 Zeilen liefern, mit
Ultramarines=3, Inquisition=3, Mechanicum=2, alle anderen =1.

### D. UI-Stress-Punkte (zur Voraborientierung)

Die folgenden Eras sind die wahrscheinlichsten Brüche bei 26 statt 3 Büchern:

- **`time_ending` / EraDetail.** 16 BookDots auf einem Era-Block. Buzzy hover
  aus 013 wurde für genau diesen Fall gemacht; sollte funktionieren. Wenn der
  Tooltip-Stack bei 5+ überlappt, hast du Designauftrag.
- **`horus_heresy` / EraDetail.** 4 BookDots — sollte trivial sein.
- **Overview-Ribbon-Count-Badges.** Stufe 013 hat per-Era `[NNN VOLUMES]`
  Count-Badges eingeführt. Mit „16" / „4" / „2" / „1" / „0" sollte das
  optisch okay aussehen — flag falls nicht.

Lange Titel und Author-Strings:

- `Ghazghkull Thraka: Prophet of the Waaagh!` — 41 Zeichen
- `Vaults of Terra: The Carrion Throne` — 36 Zeichen
- `Gaunt's Ghosts: First and Only` — 30 Zeichen
- `The Infinite and the Divine` — 27 Zeichen

Author-Anzeige Edge-Cases:

- `Aaron Dembski-Bowden` — 20 Zeichen mit Bindestrich
- `Sandy Mitchell` — Pseudonym (UI rendert nur den Display-Namen, ohne
  Auflösung)

### E. Cowork-Roster-Doc als optionale Lese-Quelle

`docs/data/2b-book-roster.md` enthält pro Buch:

- In-universe-Datierung mit Quellen-URL
- Faction-Auswahl-Begründung
- Wackelige Facet-Calls (warum Cain `satirical`, warum Devastation of Baal
  `requires_context`, etc.)
- Confidence-Map für unsichere Datierungen

Lies es **nur falls** dir bei der Validierung eine Datenkollision auffällt.
Sonst: ignorier es, der Brief sollte allein reichen.

### F. Reihenfolge (Vorschlag, nicht bindend)

1. `git pull`, schau auf das aktuelle 2b-Daten-Set in `seed-data/`.
2. `npm run db:seed` lokal — verifizier idempotency und counts.
3. Discriminator-Sanity-SQL ausführen. (Ist sie nicht 0, ist Daten-Problem.)
4. `src/app/page.tsx`: `export const revalidate = 3600` ergänzen.
5. `npm run dev` lokal, browse durch:
   - `/` → 26 Novels
   - `/timeline` → 7 Eras
   - `/timeline?era=time_ending` → 16 BookDots
   - `/timeline?era=horus_heresy` → 4 BookDots
   - Tooltip-Hover über die langen Titel
6. Falls UI-Bruch → fix im Rahmen Design-Freiheit, dokumentier im Report.
7. `npm run lint` + `npm run typecheck` + `npm run build` grün.
8. PR auf, Preview-Deploy abwarten, live-URL prüfen.
9. Report schreiben, Brief auf `implemented` flippen, sessions/README.md
   aktualisieren, ROADMAP.md Stufe 2b abhaken.
