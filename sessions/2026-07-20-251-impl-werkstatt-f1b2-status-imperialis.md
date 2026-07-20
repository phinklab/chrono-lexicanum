---
session: 2026-07-20-251
role: implementer
date: 2026-07-20
status: complete
slug: werkstatt-f1b2-status-imperialis
parent: none
links:
  - docs/werkstatt-roadmap.md
  - sessions/2026-07-20-250-impl-werkstatt-f1b1-m42-dates.md
commits: []
---

# Werkstatt-Bau F1-B2 — `/now` Status Imperialis

## Summary

F1-B2 (Fahrplan-Posten 8, F1-Urteil „bauen" aus Session 236) ist gebaut —
Launch-Modus, logischer Strang Product, Coordination-Worktree, Branch
`codex/product-status-imperialis`. Neue Route **`/now` („Status Imperialis")**:
Masthead nach der Haus-Falz-Regel, Antwort-Akt („When is now?" → „Circa the
year 42,012" → prominent `012.M42`), Ära-Kontext aus `eras`, kuratierte
Zwillings-Prosa Sanctus/Nihilus, „The Road to Now" (die 5 neuesten
Spine-Events, absteigend) und „The Present in Print" (die 10 neuesten
Releases im Jetzt-Fenster, kanonisch sortiert; 7 davon web-recherchierte
Kuration). Dazu: Map-Hash um `lumen`/`nihilus`-Deep-Links erweitert,
Chronicle-Terminus übergibt an `/now`, Nav-Rework (Rail 6 Punkte ohne Home,
Burger 7 mit Home), zwei neue HOUSE RULES (BtnFx überall, Masthead-Falz)
im Code verankert. Mehrere Feedback-Runden mit Philipp im Browser; Stand
ist abgenommen.

## What I did

**Route + Loader**

- `src/lib/now/loadNow.ts` (neu) — Loader nach loadTimeline-Muster
  (`cachedRead`, Key `status-imperialis`, Tags `now` + `timeline` + `books`;
  `now` in `CATALOGUE_TAGS` registriert, der Release-Purge ohne Body deckt
  ihn ab). Payload: Indomitus-Ära, Event-Spine mit Chips (re-used
  `buildChip` — jetzt aus `loadTimeline.ts` exportiert), Buchliste.
- Buchliste = zwei Achsen: **Auswahl** die 10 neuesten Releases
  (`releaseYear` desc, Tie → späteres Setting), **Anzeige** kanonisch nach
  Setting (`sortY` asc). Fenster: `startY ≥ 41999` **und**
  `releaseYear ≥ 2017` (`NOW_RELEASE_FLOOR` — 999.M41 war zwei Jahrzehnte
  das eingefrorene Setting-„Jetzt"; ohne Release-Floor schwemmt der
  Back-Katalog herein: Nightbringer 2002, Dawn of War 2004, …).
- **Kuratierte Leading-Edge-Zeilen** (`CURATED_NOW_BOOKS`, 7 Slugs) für
  neueste Releases ohne DB-Datierung, per Web-Recherche belegt (WarCom,
  Lexicanum, Reviews; Subagent-Recherche über die ~25 neuesten
  Katalogtitel 2025/26): veterans-of-the-fall, demolisher, ghost-legion,
  archmagos, carcharadons-void-exile, ghazghkull-thraka-warlord-of-warlords,
  armageddon-season-of-fire. Lesbare Approximations-Labels statt Zahlen;
  Dedupe gegen die DB — bekommt ein Slug später ein echtes Setting-Datum,
  ersetzt die DB-Zeile die Kuration automatisch.
- `src/app/now/page.tsx` (neu) — Server Component, `force-dynamic`
  (E4: kein Snapshot-Artefakt für die Now-Payload, ein Build-Prerender
  würde die Live-DB lesen; Muster = /timeline, die getaggte Data-Cache
  trägt die Last — Build zeigt `ƒ /now`). H/M/L-Wording lokal
  (firm/estimated/conjectural, W4-Backlog notiert). Beide CTAs
  (`/timeline?era=indomitus`, `/map#lumen=1&nihilus=1`) mit `<BtnFx />`
  und `target="_blank"`.
- `src/app/styles/57-now.css` (neu) — route-scoped; Masthead nach
  Falz-Regel, Antwort-Akt, Zwillings-Prosa, Event-Registry mit gedämpften
  Artwork-Platten, Buch-Registry (Datumsspalte 168px, umbrechend).

**Map-Deep-Link (Overlay-Flags)**

- `src/lib/map/hash.ts` — Hash-Kontrakt um `lumen`/`nihilus` erweitert
  (strikt `=1`, default-off, nur geschrieben wenn an — plain Links bleiben
  plain); `CartographerRoot.tsx` restauriert beide beim Mount (Nihilus-Guard
  bleibt beim Reducer) und schreibt sie zurück. `scripts/test-map-zones.ts`
  um die neuen Felder + 6 Asserts erweitert.

**Anbindung**

- Chronicle: Terminus der letzten Ära → primärer Link „CONTINUE TO —
  STATUS IMPERIALIS" (`/now`), Return-to-Beginning wird
  `terminus-btn--minor` (CSS in 67). `CinematicView.tsx` + 67-chronicle.
- Home: Doorway **X · Status Imperialis** in „Discover More" (Cartographer
  → XI).
- Nav-Rework nach Philipps Vorgaben (mehrere Runden): **Rail** (Desktop)
  I Archive · II Compendium · III Curator · IV Chronicle ·
  **V Status Imperialis** · VI Cartographer — **Home raus** (BrandBeacon +
  Map-Wortmarke sind der Heimweg); **Burger** behält Home (I) + dieselben
  sechs (Home-Träger-Rolle seit Wortmarken-Pensionierung 2026-07-08).
  Gruppierungs-Vorschlag wurde verworfen (Rail lebt von der flachen Liste;
  Map behält eigenen Punkt).
- `sitemap.ts`: `/now`; OG via `routeOg`.
- `/book/[slug]`: Foto-Backdrop entfernt (`variant="none"` — Philipps
  Ansage), `/now` nutzt das Standard-`main`-Bild.

**HOUSE RULES verankert** (Code + CSS + Memory)

- **BtnFx überall:** jeder `.lx-btn` rendert `<BtnFx />` als letztes Kind
  (BtnFx.tsx-Header + 42-lex-primitives.css).
- **Masthead-Falz:** Route-Landings über fixem Art = ~92vh-Akt, Copy am
  Falz gedockt (flex-end, ~8vh), route-cue-Übergabe — Kommentarblock oben
  in 42-lex-primitives.css mit den vier Implementierungen.

**Docs**

- `docs/werkstatt-roadmap.md` — F1-B2 auf ✔ 251, nächste freie Nummer →
  252; F3-B1-Anbindungszeile an den neuen Nav-Stand angepasst.

## Decisions I made

- **Gegen aktuellen DB-Stand gebaut** (Philipps Wahl): der F1-B1-Apply ist
  noch nicht in der Produktions-DB (verifiziert: 19 statt 37 Bücher ≥
  41999, `psychic_awakening`/`era_indomitus` ohne Hooks). Die Seite füllt
  sich nach dem nächsten Content-Release von selbst (Tag-Purge).
- **`/now` als finale URL** (Philipps Wahl).
- Diverse Feinschliff-Runden auf Philipps Browser-Feedback: lesbare
  Jahreszahl vor Imperial-Notation, „Why every date here is a guess"
  (borderlos), Road-to-Now 5 Einträge absteigend, Present-in-Print
  10 neueste kanonisch, Freshness-Stempel entfernt, era.sub-Zeile raus,
  Ära-Subline/Backdrops raus, Status Imperialis nach kurzem 5-Punkte-
  Experiment zurück als eigener Nav-Punkt.

## Verification

- `npm run typecheck` / `npm run lint` — pass (nach jeder Runde).
- `npm test` — PASS, 41 Suiten (inkl. erweiterter map-zones-Suite).
- `npm run build` — pass; `/now` = `ƒ (Dynamic)`, kein Build-DB-Read.
- Browser-Verifikation gegen den lokalen Dev-Server: Masthead-Geometrie
  (0,92 × Viewport, flex-end, 8vh), Map-Deep-Link (beide Toggles
  aria-pressed=true), Nav-Stände Rail/Burger, Buchliste (kein
  Spalten-Überlauf), Terminus-Link. **UI-Abnahme durch Philipp im
  Browser** über mehrere Runden; finaler Stand abgenommen („fertig").
- Kein DB-Write in dieser Session.

## Open issues / blockers

Keine Blocker.

## For next session

- **Content-Release fahren** (Batches/Koordination): erst damit erscheinen
  die 25 F1-B1-Datierungen + PA-/Era-Marker-Hooks auf `/now` (Buchliste
  bleibt per Design bei 10; Road-to-Now-Hooks wachsen).
- **F3-B1 (`/statistics`)**: Nav-Ziffer = nächste freie (Rail VII, Burger
  VIII); Prompt-Zeile in der Roadmap ist angepasst.
- **Ideen ohne Auftrag** (nur notiert): eigener Podcasts-Nav-Punkt; auf
  `/timeline` Desktop fehlt seit dem Home-Schnitt ein direkter Home-Link
  (BrandBeacon ist dort aus, weil die Bühne nicht scrollt) — kleinste
  Lösung wäre ein Always-on-Beacon auf der Timeline.
- Weekly-Refresh-Prüfpunkt (F1-B1) deckt jetzt auch `CURATED_NOW_BOOKS`
  ab: neue Groß-Events/Datierungen → kuratierte Liste + Status-Prosa
  prüfen.

## References

- Web-Recherche Buch-Settings: WarCom-Reveals (Season of Fire/11th-Edition-
  Tie-in, Ghost Legion/Pyre of Faith, Archmagos, World Ablaze), Lexicanum
  (Fourth War for Armageddon, Veterans of the Fall, Void Exile), Track of
  Words/Goonhammer/Unseen-Library-Reviews, Mike Brooks' Blog (Ghost
  Legion ← Harrowmaster, Era Indomitus).
