---
session: 2026-06-10-137
role: implementer
date: 2026-06-11
status: complete
slug: timeline-data-foundation
parent: 2026-06-10-137 (arch brief)
links: [2026-06-10-138]
commits:
  - (der Commit, der diesen Report trägt)
---

# Timeline data foundation — events spine, 8-era map, book↔event hooks, book setting dates

> Worktree: `chrono-lexicanum-batches`, Strang: Batch/Ingestion,
> Branch: `codex/ingest-batches-timeline-data-foundation`.

## Summary

Die vier Workshop-JSONs sind validiert, committed und in Supabase applied: **8 Era-Rows
(deep_history/the_forging/the_waning neu, age_rebirth/long_war retired), 144 Events,
223 event_works-Hooks (95 Buch, 125 Podcast, 3 Serie), 97 datierte Werke (53 davon
event-anchored)**. Migration `0012_timeline_events.sql` liefert `events`, `event_works`
(inkl. CHECK exactly-one-of work/series), sechs neue `eras`-Spalten und vier
`works.setting*`-Spalten. Der Apply (`npm run apply:timeline`) ist idempotent — zweiter
Lauf erreicht bitidentische DB-Counts. **Der primaryEraId-Remap war in der Praxis ein
No-op (0 Bücher auf age_rebirth/long_war, Manual-Pass-Liste leer)** — Grund und
Folge-Implikation unter „Befunde", das ist der wichtigste Punkt für Cowork.

## What I did

**Schema (`src/db/schema.ts` + `src/db/migrations/0012_timeline_events.sql`):**

- `event_tier` pgEnum ('epoch','major','minor'); `events`-Tabelle exakt nach Brief-Spec
  (string-PK, nullable startY/endY für die 2 Off-Scale-Deep-History-Rows, editorialer
  `eraId`-FK, `sortIndex`, Provenance `confidence` varchar(1) + `sourceKind` text,
  `blurb`/`curatorNote`, `artworkRef` + `artCreditName`/`artCreditUrl`); Indizes auf
  `era_id` und `start_y`.
- `event_works`: uuid-PK, `eventId` FK ON DELETE CASCADE, nullable `workId`/`seriesId`,
  `role` text, `displayLabel`, `position`. UNIQUE (eventId,workId) + (eventId,seriesId),
  CHECK `(work_id IS NULL) <> (series_id IS NULL)` — drizzle-kit 0.31 emittiert den
  CHECK direkt aus `check()` im Schema, kein Hand-SQL nötig, kein TTY-Prompt.
- `eras` + `short`/`mLabel`/`sub`/`tagline`/`intro`/`coverRef` (alle nullable);
  `works` + `settingDateLabel`/`settingMethod`/`settingConfidence`/`settingAnchorEventId`
  (FK → events, nullable). `settingMethod` bewusst text statt enum — siehe Befunde.
- Relations: `eras→events`, `events→era/works`, `eventWorks→event/work/series`,
  `works.eventWorks` + `series.eventWorks` many-Seiten.

**Seed-Pfad konsistent gehalten:**

- `scripts/seed.ts`: Era-Insert trägt die sechs neuen Spalten + explizites `sortOrder`
  aus dem JSON (Fallback weiterhin Array-Index).
- `scripts/seed-data/books.json`: mechanischer Remap der zwei Bücher auf retirte Eras —
  `bl01` (Talon of Horus, 31040) age_rebirth→horus_heresy, `ba01` (I Am Slaughter,
  32544) long_war→the_forging. Ohne das wäre CI rot (`check:eras` läuft on PR und
  validiert books.json gegen eras.json).

**Apply-Pfad (`scripts/apply-timeline-data.ts`, npm-Script `apply:timeline`):**

- Stage 1 Datei-Validierung (Shapes, Vokabulare, Cross-File: eraId ∈ eras,
  eventId ∈ events, settingAnchorEventId ∈ events, exactly-one-of
  workSlug/episodeGuid+showSlug/seriesId, offscale ⇔ null-Dates, Dupe-Checks) —
  sammelt ALLE Probleme, dann Abbruch mit Liste.
- Stage 2 DB-Auflösung: workSlug → works (kind='book' erzwungen), showSlug →
  podcast-Work + (podcastWorkId, episodeGuid) → `podcast_episode_details` (der
  Brief-genannte Unique-Join), seriesId → series, book-dates-Slug → works. Jede
  unaufgelöste Referenz bricht vor jedem Write ab — keine stillen Skips.
- Stage 3 Plan-Report (Era-Diff, Remap-Liste inkl. Manual-Pass, Event-Verteilung,
  Hook-Counts); `--dry-run` endet hier.
- Stage 4 Apply in **einer** Transaktion: Eras upsert → Events upsert by id →
  event_works wholesale rebuild (delete all + chunked insert) → Buch-Daten (nur
  book-dates-Slugs; bumpt works.updatedAt) → stale Events delete → primaryEraId-Remap
  (age_rebirth→horus_heresy; long_war per startY-Bucket; undatierbar → NULL +
  Manual-Pass-Report) → Retire der zwei alten Era-Rows.

**Ausführung gegen Supabase:** Migration via `npm run db:migrate`, Dry-Run reviewed,
Apply ausgeführt, zweiter Apply als Idempotenz-Beweis (identische Counts):

```
eras: 8   events: 144 (6/23/21/19/20/21/22/12 über die acht Eras)
event_works: 223 (125 podcast, 95 book, 3 book-series)
works mit Setting-Date: 97 (53 event-anchored)
```

`npx tsc --noEmit`, `npm run lint`, `npm run check:eras` grün.

## Befunde (substantiv, für die Coordination-Rollups)

1. **primaryEraId-Remap war ein No-op — und warum das ein Folge-Thema ist.**
   `apply-override.ts` (Z. 929/939) hardcodet `primaryEraId: M41_ERA_ID`
   (= 'time_ending') bei **jedem** SSOT-Buch-Upsert, Insert wie Update. Die Live-DB
   hatte deshalb 0 Bücher auf age_rebirth/long_war; die Manual-Pass-Liste ist leer.
   Folge-Implikation: (a) ~alle 859 SSOT-Bücher tragen den Placeholder 'time_ending',
   der als Era-Anker editorial wertlos ist; (b) jede künftige Kuration von
   primaryEraId würde von der nächsten Resolver-Welle wieder mit 'time_ending'
   überstempelt. Sobald ein Consumer primaryEraId ernsthaft nutzt, braucht es einen
   Brief: Placeholder durch echte Ableitung ersetzen (naheliegend: aus den jetzt
   vorhandenen Setting-Dates bucketen) und apply-override das Überschreiben abgewöhnen.
2. **`db:rebuild` wischt Timeline-Daten mit weg.** Schritt 1 (`db-reset-for-ssot`)
   macht `TRUNCATE works CASCADE` — das kaskadiert in `event_works` (FK auf works)
   und verliert natürlich alle `works.startY/endY/setting*`-Werte. `events`/`eras`
   überleben (Reference-Tables). Nach einem Rebuild muss `npm run apply:timeline`
   laufen; sauberer wäre ein Tail-Step in `db-rebuild.sh` analog
   `apply:audiobook-narrators` — Folge-Brief-Material, ich habe das Script bewusst
   nicht angefasst (Runbook-governed).
3. **Gelieferte JSONs weichen in Details vom Brief-Shape ab — Dateien sind per Brief
   autoritativ, ich habe mich nach ihnen gerichtet:** eras.json nutzt `start`/`end`
   (nicht startY/endY); book-dates.json hat **97** Einträge (Brief: „~110") und ein
   informatives `title`- + `note`-Feld (note bleibt JSON-only, bewusst keine Spalte);
   `settingMethod` enthält neben den vier Brief-Werten auch `bracket` und
   `series-inherited` (deshalb text-Spalte, kein enum — Vokabular wächst ohne
   Migration). 44 der 97 Datierungen haben keinen Anchor-Event (null ist erlaubt).
4. **Episoden-Hooks decken vier Shows ab** (lorehammer, luetin09, adeptus-ridiculous,
   the-40k-lorecast) — alle 125 Guids lösten gegen `podcast_episode_details` auf;
   die Shows waren also alle schon applied.

## Antworten auf die Open Questions

- **Atlas-Mirror für events:** Ja, lohnt sich als eigener Page-Type — Events sind
  jetzt first-class kuratierte Entities mit Provenance und Hooks; ein
  `atlas:regen`-Extension-Pass (eine Seite pro Event, Era-Index-Seiten) ist ein
  natürlicher Follow-up. Nicht hier implementiert (out of scope per Brief).
- **delete-and-reinsert für events/event_works:** Für `event_works` ja — uuid-PK ist
  synthetisch, kein Consumer braucht stabile Row-Identity, wholesale rebuild ist die
  einfachste Drift-Garantie. Für `events` habe ich **upsert-by-id + stale-delete**
  statt delete-then-insert gewählt: `works.settingAnchorEventId` zeigt per FK auf
  events — ein wholesale delete würde nach dem ersten Apply an genau diesen FKs
  scheitern (oder müsste alle Anchors erst nullen, was Provenance verliert). Die
  string-PKs sind ohnehin die stabile Identity.

## For next session

- Brief 138 (Product) kann auf die DB los: 8 Eras mit Editorial-Copy, 144 Events,
  Hooks inkl. displayLabel/position, Setting-Dates auf works. `coverRef`/`artworkRef`
  dangeln erwartungsgemäß bis die Assets shippen.
- Folge-Themen für Cowork (siehe Befunde): apply-override-M41-Placeholder ablösen;
  `apply:timeline` als Tail-Step in `db:rebuild`; Atlas-Extension für events.
