---
title: Open questions (next-brief queue)
type: overview
created: 2026-05-09
updated: 2026-07-06
sources:
  - ../../sessions/README.md
  - ../../sessions/2026-07-05-178-impl-map-cartographer.md
  - ../../sessions/archive/2026-06/2026-06-28-170-impl-per-book-ssot.md
  - ../../sessions/archive/2026-06/2026-06-30-171-impl-per-book-ssot-migration.md
  - ../../sessions/archive/2026-06/2026-06-10-137-impl-timeline-data-foundation.md
  - ../../sessions/archive/2026-06/2026-06-16-152-impl-timeline-rebuild-tail.md
  - ../../sessions/archive/2026-06/2026-06-18-157-impl-incremental-apply-default.md
  - ../../scripts/book-apply-shared.ts
related:
  - ./project-state.md
  - ./deferred-questions.md
  - ./pipeline-state.md
  - ./log.md
confidence: high
---

# Open questions

> Items the **next** architect brief MUST address. The queue is intentionally small (3–5 items). Cowork prunes here when an item lands in a brief or is otherwise resolved. Dormant/distant items live in [`./deferred-questions.md`](./deferred-questions.md). Strang-Backlog lebt in den Boards 121/122; operativer Kleinkram in `project-state.md` § What's open.
>
> **Geschlossene OQs liegen in git + [`log.md`](./log.md).** OQ (15) Compendium-Taxonomie 2026-06-12 geschlossen (shipped; Rest → Boards 121-P8/P9 + 122-B8/B9). **OQ (17) Deep-Review-Rest 2026-06-12 geschlossen**: Gate-Ausnahmen `/healthz`+`/api/revalidate`, statische CSP, `/buecher` stilllegen, FilterRail löschen → Board **121-P11**; `/buch`-SSG vor Launch → **121-P12**. **OQ 16(a) 2026-06-16 geschlossen** durch Brief 152 / PR #177: `db:rebuild` hat jetzt `apply:timeline` + read-only Verify als Tail-Schritt 5/8 + 6/8. **OQ (18a) durch Brief 170 Teil A (per-book-ssot) geliefert** (PR #201, 2026-06-30): targeted apply via `apply:book --slug/--all` + additiver `db:sync`-Tail. **OQ (18b) 2026-07-01 geschlossen durch Brief 171 Teil B** (gemergt; Impl `2026-06-30-171-impl-per-book-ssot-migration.md`): exakter Aequivalenz-Deep-Diff bewiesen per **leerem DB-freiem Projektions-Diff** (896 Bücher / 0 Row-Deltas / 196 Collection-Kanten). Entscheidung dokumentiert: `db:drift` bleibt read-only Health-Check + per-Buch/Podcast-`--verify`; der volle Korpus-Deep-Diff ist der Operator-Pfad `equiv:diff --db-snapshot`/`--compare` gegen disposable DB, **nicht** `db:drift`.

Format per item: **(N) <Title>** with `Owner: …` (who has to act) · `Sessions: …` (raw sources) · `Follow-up brief: …` (if known).

---

**(16) Timeline-Datenfundament — zwei Folgethemen aus impl 137**
`Owner: Cowork (Brief-Schnitt)` · `Sessions: archive/2026-06/2026-06-10-137-impl-timeline-data-foundation.md; 2026-06-16-152-impl-timeline-rebuild-tail.md` · `Follow-up brief: offen`

- **(b) `primaryEraId` ist ein Placeholder-Feld.** Verortung post-171 (Brief 173, 2026-07-01): der `'time_ending'`-Hardcode lebt im geteilten Writer-Pfad `scripts/book-apply-shared.ts` — Konstante `M41_ERA_ID = "time_ending"` (Z. 99, mit Warn-Kommentar Z. 90–98), gestempelt in `computeBookRows` → `bookDetails.primaryEraId` (Z. 712), geschrieben von `applyBook` bei **jedem** Upsert (Insert wie Update) nach `book_details.primary_era_id` — praktisch der ganze 896er-Korpus trägt `'time_ending'`. Lesende Consumer existieren (Ask: `src/lib/ask/boundaries.ts`-Heresy-Gate + `ResultCard`-Era-Anzeige; Buchseite `src/lib/book/loadBook.ts`; `/archive`-Era-Gruppierung; Atlas-Queries), behandeln das Feld aber durchweg als uniformen Platzhalter (Anzeige bzw. Fallback auf Setting-Dates/Slug-Sets) — kein Consumer nutzt es ernsthaft als Era-Anker; seit der neue `/timeline` auf Events + Setting-Dates läuft, bleibt der Consumer-Druck niedrig. Brief erst, wenn ein Consumer das Feld ernsthaft nutzt; naheliegende Ableitung: aus Setting-Dates bucketen + Überschreiben abgewöhnen. Curation-Overlay kann einzelne Hand-Fixes zuletzt gewinnen lassen (`db:sync`-Schritt 8/9, nach dem Korpus-Apply), löst aber den systemischen Placeholder nicht.
- **(c) Atlas-Extension für Events.** Events sind first-class kuratierte Entities. `atlas:regen` um einen Event-Page-Type erweitern (eine Seite pro Event, Era-Index-Seiten).

---

*(Queue aktuell: (16b/c). 18a ist durch Brief 170 Teil A geliefert, 18b durch Brief 171 Teil B geschlossen (beide gemergt) — beide aus der Queue, siehe Kopfnotiz. Die Wave 154–163 (Buch-Reviewer + Stage 3 + Gate F/L + Product-Wave) hat **keine** neue OQ geöffnet — die ADR-Backfill-Schuld aus 154/155 ist im Koordinations-Pass 2026-06-24 abgearbeitet (`decisions/book-reviewer-no-apply-path.md` + `log.md`). Auch die Wave 174–184 (Map-Daten 174/183, Hygiene 175/176/177, CI-Gate 180, Design-Reset 184) **und der Map-Neubau 178** (gemergt 2026-07-06) haben **keine** neue OQ geöffnet — die 178-Follow-ups (Direction-Panel einbrennen, Episoden-Anker, Zoneneditor, Blurb-Filler) sind kleiner Product-Kleinkram in `worklist.md`, keine Architektur-OQ. Neue Items aus Impl-Reports kommen wie gewohnt nummeriert dazu.)*
