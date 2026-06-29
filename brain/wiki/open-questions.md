---
title: Open questions (next-brief queue)
type: overview
created: 2026-05-09
updated: 2026-06-24
sources:
  - ../../sessions/README.md
  - ../../sessions/archive/2026-06/2026-06-10-137-impl-timeline-data-foundation.md
  - ../../sessions/archive/2026-06/2026-06-16-152-impl-timeline-rebuild-tail.md
  - ../../sessions/archive/2026-06/2026-06-18-157-impl-incremental-apply-default.md
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
> **Geschlossene OQs liegen in git + [`log.md`](./log.md).** OQ (15) Compendium-Taxonomie 2026-06-12 geschlossen (shipped; Rest → Boards 121-P8/P9 + 122-B8/B9). **OQ (17) Deep-Review-Rest 2026-06-12 geschlossen**: Gate-Ausnahmen `/healthz`+`/api/revalidate`, statische CSP, `/buecher` stilllegen, FilterRail löschen → Board **121-P11**; `/buch`-SSG vor Launch → **121-P12**. **OQ 16(a) 2026-06-16 geschlossen** durch Brief 152 / PR #177: `db:rebuild` hat jetzt `apply:timeline` + read-only Verify als Tail-Schritt 5/8 + 6/8. **OQ (18a) durch Brief 170 Teil A (per-book-ssot) geliefert** (PR #201, 2026-06-30): targeted apply via `apply:book --slug/--all` + additiver `db:sync`-Tail. **OQ (18b) → Brief 171 Teil B** (2026-06-30 `open`): exakter Aequivalenz-Deep-Diff via leerem Snapshot-Diff-Gate der Migration; ob `db:drift` danach ein wiederkehrender Korpus-Deep-Diff wird oder Health-Check + per-Buch-`--verify` bleibt, entscheidet 171.

Format per item: **(N) <Title>** with `Owner: …` (who has to act) · `Sessions: …` (raw sources) · `Follow-up brief: …` (if known).

---

**(16) Timeline-Datenfundament — zwei Folgethemen aus impl 137**
`Owner: Cowork (Brief-Schnitt)` · `Sessions: archive/2026-06/2026-06-10-137-impl-timeline-data-foundation.md; 2026-06-16-152-impl-timeline-rebuild-tail.md` · `Follow-up brief: offen`

- **(b) `primaryEraId` ist ein Placeholder-Feld.** `apply-override.ts` hardcodet `'time_ending'` bei jedem SSOT-Upsert. Seit der neue `/timeline` auf Events + Setting-Dates läuft, ist der Consumer-Druck gesunken. Brief erst, wenn ein Consumer das Feld ernsthaft nutzt; naheliegende Ableitung: aus Setting-Dates bucketen + Überschreiben abgewöhnen. Curation-Overlay kann einzelne Hand-Fixes zuletzt gewinnen lassen, löst aber den systemischen Placeholder nicht.
- **(c) Atlas-Extension für Events.** Events sind first-class kuratierte Entities. `atlas:regen` um einen Event-Page-Type erweitern (eine Seite pro Event, Era-Index-Seiten).

---

*(Queue aktuell: (16b/c). 18a ist durch Brief 170 Teil A geliefert; 18b liegt bei Brief 171 Teil B (`open`) — beide aus der Queue, siehe Kopfnotiz. Die Wave 154–163 (Buch-Reviewer + Stage 3 + Gate F/L + Product-Wave) hat **keine** neue OQ geöffnet — die ADR-Backfill-Schuld aus 154/155 ist im Koordinations-Pass 2026-06-24 abgearbeitet (`decisions/book-reviewer-no-apply-path.md` + `log.md`). Neue Items aus Impl-Reports kommen wie gewohnt nummeriert dazu.)*
