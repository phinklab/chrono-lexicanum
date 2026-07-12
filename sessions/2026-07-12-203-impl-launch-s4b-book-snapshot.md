---
session: 2026-07-12-203
role: implementer
date: 2026-07-12
status: complete
slug: launch-s4b-book-snapshot
parent: docs/launch-master-plan.md §§ Session 1a / Session 4 (S4b-Mini) + Impl-Report 202 „For next session"
links:
  - docs/launch-master-plan.md
  - sessions/2026-07-12-202-impl-launch-s4-canonical-routes.md
commits: []
---

# Launch S4b — Buch-Projektion in den Snapshot

Worktree: `chrono-lexicanum` (Koordination, E8-Ausnahme) · logischer Strang:
Batch/Ingestion · Branch: `codex/ingest-batches-book-snapshot`.

## Vorspann: S4 war nicht gemerged

Die Session-Voraussetzung „S4 gemerged" war beim Start **nicht** erfüllt: die
gesamten S4-Änderungen lagen uncommitted im Working Tree (Session 202 endete
ohne „fertig"), origin/main stand auf S3b (#248). Auf Philipps Entscheidung
(Option „S4 committen + PR") hin: S4 als `a7a2791` auf
`codex/product-canonical-routes` committed, gepusht, **PR #249** erstellt.
`codex/ingest-batches-book-snapshot` basiert auf diesem S4-Commit — **vor dem
Push muss der Branch auf den gemergten main rebased werden** (#249 wird
squash-gemerged, sonst trägt der S4b-PR den S4-Commit doppelt).

## Summary

`scripts/build-snapshot.ts` exportiert jetzt die Buch-Projektion: pro
kuratiertem Hot-Book ein `books/<slug>.json` (exakt `loadBook`-Shape,
compile-time-Contract), dazu `book-hot-slugs.json` (Prerender-Liste) und
`book-slugs.json` (alle 896 `kind='book'`-Slugs — die S5-Sitemap-Quelle).
`loadBook` ist nach dem Entity-Muster in DB-freie Fassade + lazy importiertes
`loader-live.ts` gespalten; `/book/[slug]/generateStaticParams` prerendert das
Hot-Subset aus dem Snapshot. Artefakte + Manifest regeneriert (Doppellauf
byte-identisch); damit sind auch die **3198 eingebackenen `/buch/`-Hrefs** aus
den 96 Entity-Artefakten verschwunden. Wichtigster Befund: der Exporter hatte
**kein** `/buch/`-Literal — die Hrefs laufen über `workHref`
(`@/lib/work-links`), das S4 bereits migriert hat; der Regen allein erledigte
die Alt-Links, ein Exporter-Fix war nicht nötig (die Warnung aus Report 202
war insofern zu pessimistisch formuliert, das Ergebnis ist dasselbe).

## What I did

- **`src/lib/book/hot-subset.ts` (NEU, pur):** `HOT_BOOK_SLUGS` = alle 65
  aufgelösten Picks der „One faction, one book"-Kuration
  (`FACTION_STARTER_NODES` — abgeleitet statt kopiert, eine redaktionelle
  Quelle) + 8 Marquee-Slugs, die die 40k-Starter nicht tragen (HH-Auftakt-
  Trilogie, `xenos`, `first-and-only`, `for-the-emperor`, `space-wolf`,
  `nightbringer`) ⇒ 73 Slugs, dedupliziert/sortiert, alle gegen den Bestand
  verifiziert.
- **`src/lib/book/loader-live.ts` (NEU):** `loadBookLive` (Verbatim-Umzug des
  8-Query-Fan-outs aus `loadBook.ts`) + `listHotBookSlugsLive` (Intersect
  Kuration × Live-Tabelle, `kind='book'`) + `BookDetail`-Typ.
- **`src/lib/book/loadBook.ts` → DB-freie Fassade:** Build-Phase liest
  `books/<slug>.json` bzw. `book-hot-slugs.json` (fail-closed), Request-Zeit
  lazy-importiert den Live-Pfad hinter der unveränderten
  `cachedRead`-Schicht (Tag `books`); S2-Fehlervertrag unverändert
  (`test-loader-error-contract` deckt die Fassade weiter ab).
- **`src/lib/snapshot/build-data.ts`:** `readSnapshotBook`.
- **`scripts/snapshot-shared.ts`:** Registry `bookSlugs`/`bookHotSlugs`,
  `bookArtifactPath`, Counts-Felder, `MIN_COUNTS.hotBookSlugs = 35`
  (Half-Floor), zwei neue Fail-closed-Invarianten: `bookSlugs === books`
  (Slug-Liste und Browse-Projektion teilen die `kind='book'`-Basis) und
  `bookDetails === hotBookSlugs` (kein Hot-Slug ohne Payload).
- **`scripts/build-snapshot.ts`:** Projektion 10 (`projectHotBookSlugs`,
  meldet Drops) + 11 (`projectBookDetail`, Verbatim-Transplantat mit
  deterministischen ORDER-BY-Tiebreakern; Abweichungen vom Live-Loader im
  Block-Kommentar dokumentiert); `book-slugs.json` kommt aus der ohnehin
  slug-sortierten Browse-Projektion (kein Extra-Query); Header-/Help-Doku.
- **`src/app/book/[slug]/page.tsx`:** `generateStaticParams` →
  `listHotBookSlugs()` (73 Pfade statt `[]`).
- **Tests (`test-build-snapshot.ts`):** 2 neue Compile-Time-Contracts
  (`projectBookDetail` ≡ `loadBook`, `hotSlugs` ≡ `listHotBookSlugs`),
  Fixtures + 4 neue Runtime-Checks (Payload-Fehlstand, Slug-Drift,
  Hot-Floor, `bookArtifactPath`), Registry-Count 8 → 10.
- **Alt-Pfad-Reste:** `content-release-runbook.md` Live-Smoke-Beispiele →
  `/character|/faction|/book`; `test-release-revalidate.ts`-Mock-Payload →
  `/character/[slug]`.
- **Artefakte regeneriert** (read-only Export, Migrations-Parität ok, Head
  `0015_keen_tag`): 179 Artefakte + Manifest; Diff = 96 Entity-Views (nur
  Href-Zeilen, stichprobengeprüft) + 76 neue Dateien + Manifest. Kein
  Content-Drift — alle Alt-Counts identisch zum committeten Stand.

## Decisions I made

- **Hot-Set aus den Faction-Startern abgeleitet statt handgepflegt:** die
  Picks sind genau die Bücher, die die Site selbst als Einstiege empfiehlt —
  zweite Pflegeliste vermieden; Marquee-Extension bleibt bewusst klein (8).
- **Artefakte im Code-PR** — Abweichung von der E4-Norm („Snapshot-PR = reiner
  Artefakt-PR"), explizit vom S4b-Prompt so beauftragt; inhaltlich ist der
  Regen href-only + additiv, der Merge deployt die korrigierten Links.
- **Optionaler Umzug von `src/app/fraktionen/{loader,filters}.ts` NICHT
  gemacht** (Report-202-Punkt 3): reiner Modul-Umzug ohne S4b-Nutzen, hätte
  den Mini-PR um src-weite Import-Shuffles verbreitert. Bleibt offen.

## Verification

- `npm run lint` grün · `npx tsc --noEmit` grün · `npm test` 38/38 grün.
- `npm run build` mit unerreichbarer `DATABASE_URL`
  (CI-Muster `127.0.0.1:9`) grün: Routentabelle zeigt `● /book/[slug]` mit
  73 prerenderten Pfaden aus dem Snapshot, `ƒ /book/[slug]/audit` bleibt
  dynamisch.
- **Determinismus:** zweiter `snapshot:regen` ⇒ byte-identisch (SHA-Summe über
  alle 180 Dateien identisch, `generatedAt` carried forward).
- `grep -r '/buch/' scripts/snapshot-data/` ⇒ 0 Treffer (vorher 3198 in 96
  Dateien).

## Open issues / blockers

- **Vor dem Push:** #249 (S4) mergen, dann diesen Branch auf `origin/main`
  rebasen (Squash-Merge ⇒ der S4-Basis-Commit muss raus).
- S5 konsumiert `book-slugs.json` für die Sitemap (Plan § Session 5).
- Offen aus 202: Modul-Heimat für `src/app/fraktionen/{loader,filters}.ts`.

## References

- `docs/launch-master-plan.md` §§ Session 1a (Exporter-Vertrag,
  Determinismus, Fail-closed), Session 4 Punkt 3 (S4b-Mini), Anhang-A-Tabelle
  (`/book/[slug]` ~896 in der Sitemap „ab S4b").
- Muster: `src/lib/entity/{loader,loader-live,hot-subset}.ts` (S1b-Weiche).
