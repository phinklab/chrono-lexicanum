---
session: 2026-05-02-027
role: architect
date: 2026-05-02
status: implemented
slug: hygiene-pack-2c2
parent: null
links:
  - 2026-05-02-024
  - 2026-05-02-025
  - 2026-05-02-026
commits: []
---

# Stufe 2c.2 — Hygiene-Pack (post-2c.1 cleanup)

## Goal

Drei kleine Loose Ends aus Stufe 2c.1 sauber abschließen: (1) ein editorial-falsches `series.totalPlanned` korrigieren, das im DetailPanel sichtbar als „Vol 41 / 10" rendert, (2) das aktuelle Slug-Format `slugify("{title}-{id}")` als bewusste Entscheidung im Code dokumentieren statt es zu ändern, (3) den DB-freien `npm run check:eras`-Guardrail an die CI hängen. Ein PR, keine neuen UI-Surfaces, keine Schema-Änderung, keine neuen Dependencies.

## Context

Stufe 2c.1 (DetailPanel + Deep-Linking, sessions 025/026) ist sauber gemerged (PR #11, commits `0e0eaa…` bis `120c3b…`). Der Implementer-Report 026 § „For next session" hat drei kleine Items ausgespuckt, die nicht jeweils ihren eigenen Brief verdienen aber zusammen einen schnellen Aufräum-Pass ergeben.

Zustand der drei Items vor dieser Session:

1. **Vol-N/totalPlanned-Inkonsistenz.** `scripts/seed-data/series.json` hat `horus_heresy_main.total = 10` (Platzhalter aus dem ersten Sanity-3-Seed). `scripts/seed-data/books.json` hat sechs Bücher in dieser Serie mit `seriesIndex` 1, 7, 9, 14, 19 und 41 (Master of Mankind, hh41). Das DetailPanel-Template aus 2c.1 rendert diese beiden Felder verbatim als „Vol N / X" — sichtbares Resultat heute: „Vol 41 / 10". Brief 025 Acceptance hatte „Vol 1 / 64" geraten; das Cowork-Rateergebnis war auch falsch. Der kanonische Stand der nummerierten Hauptserie „The Horus Heresy" ist 54 Bände (Horus Rising = #1 bis The Buried Dagger = #54; Siege of Terra läuft als eigene Serie weiter).

2. **Slug-Format `-{id}`-Suffix.** Implementer Report 026 § „For next session" hat zwei Optionen genannt: (a) Suffix droppen (sauberer für Share-URLs, Risiko Titel-Kollision), (b) behalten (eindeutig, aber `-hh01`-Tail in URLs). Editorial-Entscheidung mit Philipp am 2026-05-02: **behalten.** Begründung: Phase-4-Skala (200+ Bücher) wird Titel-Kollisionen auslösen (Black Library hat mehrfach gleiche Titel reissued); der Suffix garantiert Eindeutigkeit ohne Sonderfall-Logik im Seed; URL-Ästhetik ist sekundär gegenüber Stabilität. **In dieser Session: keine Code-Änderung am Slug-Verhalten — nur ein Doc-Comment an `slugify`-Aufruf in `scripts/seed.ts` Zeile 371, der die Entscheidung samt Datum sichtbar im Code festhält, damit der nächste „warum eigentlich der Suffix"-Reflex einen sofortigen Anker findet.**

3. **`check:eras` ins CI.** Carry-over-Item aus Report 024. Das Script `scripts/check-eras.ts` läuft schon lokal über `npm run check:eras` und ist DB-frei (liest nur `seed-data/*.json`, validiert die Era-Verteilung). Carry-over-Note: „Tiny Hygiene-Aktion, eigene kleine Session wenn jemand Lust hat." Diese Session nimmt es mit. `.github/workflows/ci.yml` braucht eine zusätzliche Step-Zeile in `lint-and-typecheck` (siehe Zeile 24 unten — Reihenfolge nach `typecheck`).

## Constraints

1. **Keine Schema-Änderung.** Kein neues Drizzle-Migration-File. Wer dieses Item refactor-würdig findet: separater Brief.
2. **Keine neuen Dependencies.** Weder npm packages noch neue dev-tools. Wenn etwas „nur ein kleines util" denkbar wäre — nein.
3. **Keine UI-Änderung.** Das DetailPanel rendert nach dem Fix automatisch „Vol 41 / 54" statt „Vol 41 / 10" (gleicher Code-Path). Keine neuen Komponenten, kein neues CSS, keine Animation.
4. **Slug-Verhalten bleibt unverändert.** `scripts/seed.ts:371` (`const slug = slugify(\`${b.title}-${b.id}\`)`) wird nicht angefasst — nur ein erklärender Code-Comment direkt darüber. Bestehende DB-Slugs (`horus-rising-hh01` etc.) bleiben gültig; bestehende Share-Links funktionieren weiter.
5. **Reseed wird gebraucht.** Die `series.totalPlanned`-Änderung ist eine Daten-Änderung in `series.json`, die per `npm run db:seed` in die DB rollt. Der Seed ist idempotent (siehe Stufe 2b), kein Drama — aber bitte in der CC-Verifikation explizit durchziehen, damit „Vol 41 / 54" tatsächlich aus der DB rendert.
6. **CI-Step fail-fast.** `npm run check:eras` als eigenständiger Step in `lint-and-typecheck` (nicht in `vercel-build`, nicht im Pre-Push-Hook). Reihenfolge: nach `typecheck`, vor möglichen weiteren Steps. Wenn er rot wird, soll der PR rot werden — gleicher Severity wie lint/typecheck.
7. **Weiter im Carry-over: Redirect 307 vs. meta-refresh** (Item #4 in `sessions/README.md`). Mit Philipp am 2026-05-02 bestätigt: bleibt auf der Backlog, KEINE middleware.ts in dieser Session. Wenn der Reflex kommt „während ich eh in `src/app/timeline/page.tsx` bin könnte ich das auch noch…" — nein. Eigener Brief wenn überhaupt.
8. **Andere fragwürdige `series.total`-Werte** (siehe „Out of scope" und „Open questions") sind in dieser Session **nicht** Teil der Acceptance. Wenn CC bei der Recherche zu HH-main auf weitere offensichtliche Fehler stößt, wandert das in den Report („For next session"), nicht in den PR.

## Out of scope

- **`middleware.ts` für saubere 307-Redirects** auf direkte `?era=…`/`?book=…`-Hits. Carry-over #4, bleibt dort.
- **Andere falsche `series.total`-Werte.** Schnelle Stichprobe: `gaunts_ghosts: 4` (real ≥16 Sabbat-Worlds-Romane), `ciaphas_cain: 3` (real 13+), `hh_more: 4` (Primarchs-Reihe ist 14), `space_wolves_sw: 4` (William Kings Ragnar-Saga sind 6), `siege_of_terra: 5` (real 8 nummerierte Romane plus End-and-the-Death-Splits). Heute kein „Vol N / X mit N > X"-Bug, weil keines dieser Bücher seriesIndex > total trägt — also unsichtbar bis Phase 4. Bewusst aus dem Scope: jedes braucht Quellenarbeit und Editorial-Entscheidung pro Reihe; in einem Hygiene-PR vermischt würde das ausfransen.
- **Slug-Refactor.** Auch nicht „nur ein bisschen". Entscheidung ist gefallen (Suffix bleibt); jede Code-Änderung am Verhalten ist Out of Scope.
- **FactionGlyph SVG-Komponente** (Stufe 2a.2). Eigener Brief, sobald wir dort sind.
- **EntryRail** (Stufe 2a.1). Eigener Brief.
- **`/buch/[slug]` Phase-3-Detailseite.** Eigener Brief.
- **Cover-Image-Pfade.** Phase 4.
- **`docs/ui-backlog.md`-Items.** Diese Session ist daten-/CI-Hygiene, kein UI-Polish-Pass.
- **Empty-`content_warning`-Fall verifizieren** (Brief-025-Acceptance unverifiziert weil keine Daten). Erst relevant wenn ein Buch ohne Warnings reinkommt.

## Acceptance

The session is done when:

- [ ] `scripts/seed-data/series.json` — `horus_heresy_main.total` von `10` auf `54` gesetzt. `note`-Feld optional aktualisiert (z.B. „Core arc — 54 numbered novels, Horus Rising → The Buried Dagger; Siege of Terra continues as `siege_of_terra`."), aber das ist deine Wahl.
- [ ] `npm run db:seed` lokal durchgezogen (mit `.env.local`); Output zeigt 21 Series geseedet (kein Count-Drift), keine Errors.
- [ ] DB-SELECT-Verifikation: `SELECT name, total FROM series WHERE id = 'horus_heresy_main'` liefert `total = 54`. Curl-Smoke `/timeline?era=horus_heresy&book=master-of-mankind-hh41` (oder welcher Slug `hh41` heute trägt — `slugify("Master of Mankind-hh41")` → `master-of-mankind-hh41`) liefert 200; gerendertes HTML enthält wörtlich `Vol 41 / 54`.
- [ ] `scripts/seed.ts` — Code-Comment direkt über Zeile 371 (oberhalb des `slugify`-Aufrufs), 2-4 Zeilen, der die Entscheidung erklärt. Vorgeschlagener Inhalt: „Slug carries the `-{id}` suffix to guarantee uniqueness across the catalog. Editorial decision 2026-05-02 (session 027): bare title slugs (`horus-rising`) would collide at Phase-4 scale (200+ books, multiple Black Library reissues with identical titles). Cosmetic noise in the URL (`-hh01`) is the accepted cost." — exakte Wortwahl deine. Kein Verhaltens-Change am Code drumherum.
- [ ] `.github/workflows/ci.yml` — neuer Step `- run: npm run check:eras` in `lint-and-typecheck`, nach dem `typecheck`-Step. Siehe „Notes" unten für die exakte Position falls hilfreich. Concurrency-Block und alles andere unverändert.
- [ ] Auf `feat/2c2-hygiene-pack` (oder gleichwertiger Branch-Name nach deiner Konvention) gepusht; PR geöffnet; CI-Check `ci / lint-and-typecheck` ist grün, **inklusive** dem neuen `check:eras`-Step.
- [ ] Lokal: `npm run lint` grün, `npm run typecheck` grün, `npm run check:eras` grün, `npm run build` grün.
- [ ] Im Report Decision-Log: Begründung der gewählten `total`-Zahl falls von 54 abgewichen wurde (z.B. wenn Lexicanum eine andere kanonische Zählung führt — ich habe gegen Black Library's eigene Nummerierung im Schmuckumschlag gebenchmarked, aber wenn dir die Recherche eine bessere Zahl liefert, nimm die und erklär es im Report).

## Open questions

- **Andere falsche `series.total`-Werte** (siehe „Out of scope" Punkt 2). Wenn dir bei der Master-of-Mankind-Verifikation andere offensichtlich-falsche Reihen ins Auge stechen, liste sie im Report § „For next session" — entweder als Mini-Brief-Sammelposten oder als Ankündigung des Cleanup, der mit Stufe 2b's Roster-Doc-Begleitung kommt. Keine Action diesmal.
- **Unknown-era + valid-book branch** (Report 026 § „For next session", Punkt 4). CC hat in `src/app/timeline/page.tsx` einen Branch `?era=<unknown>&book=<valid>` → `?era=<book.primaryEraId>&book=<slug>` über Brief-025-Acceptance hinaus hinzugefügt. **Cowork bestätigt: behalten.** Ist eine vernünftige Interpretation der Constraints 1+11 (Overview hat keine BookDots zum Focus-Returnen, also würde der Panel orphanen). Keine Code-Änderung in dieser Session — nur Erwähnung damit klar ist, dass das nicht versehentlich revertet werden soll.
- **Series-Note-Pflege.** Die `note`-Felder in `series.json` sind aktuell ein-Zeiler („Core arc.", „Climax arc.", „Inquisitor trilogy."). Wenn du beim HH-main-Update das Note-Feld erweiterst, gerne — ist aber kein Acceptance-Item. Frage für den nächsten Architekt: lohnt sich ein etwas formellerer Sourcing-Hinweis pro Serie (Lexicanum-URL, Stand-Datum), oder reicht das Roster-Doc als zentrale Provenance? Antwort gerne im Report.

## Notes

### Exakte Stelle in `ci.yml`

Aktuell (Stand `main`):

```yaml
      - run: npm run lint

      - run: npm run typecheck
```

Ziel-Form:

```yaml
      - run: npm run lint

      - run: npm run typecheck

      - run: npm run check:eras
```

Begründung Reihenfolge: `check:eras` ist der billigste der drei (DB-frei, paar Hundert ms), aber konzeptionell ist er der „letzte Filter" — fail-fast bei lint/typecheck (Compiler-Probleme zuerst), dann der Daten-Sanity-Check.

### Warum 54 für `horus_heresy_main`

Black Library nummeriert die Hauptserie „The Horus Heresy" durchgehend: Buch 1 ist *Horus Rising* (2006), Buch 54 ist *The Buried Dagger* (2019). Danach beginnt die separate Serie *Siege of Terra* (in unserer `series.json` schon korrekt als `siege_of_terra` modelliert, eigenständige `total`). Master of Mankind ist tatsächlich Buch #41 in dieser Hauptzählung — der `seriesIndex: 41` im Seed ist also korrekt; nur das `total` war falsch.

Die Cowork-25-Brief-Acceptance „Vol 1 / 64" war mein Schätzfehler (vermutlich HH+SoT zusammen gezählt). 54 ist die richtige Zahl für die main-Serie isoliert.

Falls Lexicanum oder eine andere Quelle eine abweichende kanonische Zahl führt (z.B. wenn dort die *Primarchs*-Sub-Serie in HH-main mitgezählt wird), recherchier kurz und nimm die Lexicanum-Zahl. Begründung im Report § „Decisions I made". Im Zweifel: 54.

### Warum Slug-Suffix bleibt

Drei Argumente, in absteigender Stärke:

1. **Phase-4-Skala wird Kollisionen produzieren.** Black Library hat Titel mehrfach reissued (z.B. *Eisenhorn* als Romane UND als Omnibus UND als TV-Drama-Tie-In). Bei 200+ Werken im Katalog ist die Wahrscheinlichkeit eines exakten Titel-Match nicht null.
2. **Stabilität schlägt Ästhetik.** Ein Slug, der sich beim Hinzufügen eines neuen Buchs ändern könnte (Hybrid-Variante: erstes Buch ist `horus-rising`, zweites wird `horus-rising-2` und das erste muss umziehen?), bricht jeden geteilten Link rückwirkend.
3. **`-{id}` ist semantisch sauber.** Die Buch-ID ist die einzige projekt-interne Adresse, die garantiert nie kollidiert (DB UNIQUE constraint). Sie an den Slug zu hängen heißt: der Slug ist stabil so lange die ID stabil ist, und die ID ändert sich nie.

Cosmetic-Argument der Gegenseite: `chrono-lexicanum.de/buch/horus-rising-hh01` liest sich nicht so eingängig wie `…/buch/horus-rising`. Akzeptiert. Nicht stark genug, um die Stabilitätsgarantie aufzugeben.

### `check:eras` Output (Erinnerung)

Aktuell liefert das Script bei sauberer Verteilung 1·5·1·1·0·15·3 = 26 Bücher (siehe Report 024). Wenn jemand ein neues Buch ohne `primaryEraId` reincommittet oder mit unbekanntem Era-ID, schlägt das Script fehl. Genau das soll auch in der CI passieren — heute fängt es nur ein lokales `npm run` ab, nach dieser Session jeden PR.

### Carry-over-Pruning

Nach dem Schreiben dieses Briefs wird in `sessions/README.md` § „Carry-over for the next architect brief":

- **Item #2 (`check:eras` ins CI)** — entfernt; durch diesen Brief abgedeckt.
- **Items #1 (Confidence-Map), #3 (`secondary_era_ids`), #4 (Redirect 307)** — bleiben unverändert.

Plus: Active-Threads-Tabelle bekommt einen neuen Eintrag für 026 (status: complete) und einen für 027 (status: open). 025 wandert von `open` auf `implemented`.

### ROADMAP-Update

`ROADMAP.md` § Phase 2a hat aktuell:

> - [ ] **Stufe 2c** — Reactivate session 018 (DetailPanel + deep-linking) against the new schema. Cartographer's book-pins also land in 2c.

Die DetailPanel-+-Deep-Linking-Hälfte ist mit 026 erledigt; die Cartographer-book-pins-Hälfte gehört konzeptuell zu Phase 2b (Cartographer) und nicht zu 2c. Cowork updated diese Roadmap-Zeile beim Schreiben des Briefs (kein CC-Task).
