---
title: Open questions (next-brief queue)
type: overview
created: 2026-05-09
updated: 2026-06-18
sources:
  - ../../sessions/README.md
  - ../../sessions/archive/2026-06/2026-06-10-137-impl-timeline-data-foundation.md
  - ../../sessions/archive/2026-06/2026-06-12-147-impl-deep-review-fixes.md
  - ../../sessions/2026-06-16-152-impl-timeline-rebuild-tail.md
  - ../../sessions/2026-06-18-157-impl-incremental-apply-default.md
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
> **Geschlossene OQs liegen in git + [`log.md`](./log.md).** OQ (15) Compendium-Taxonomie 2026-06-12 geschlossen (shipped; Rest → Boards 121-P8/P9 + 122-B8/B9). **OQ (17) Deep-Review-Rest 2026-06-12 geschlossen**: Gate-Ausnahmen `/healthz`+`/api/revalidate`, statische CSP, `/buecher` stilllegen, FilterRail löschen → Board **121-P11**; `/buch`-SSG vor Launch → **121-P12**. **OQ 16(a) 2026-06-16 geschlossen** durch Brief 152 / PR #177: `db:rebuild` hat jetzt `apply:timeline` + read-only Verify als Tail-Schritt 5/8 + 6/8.

Format per item: **(N) <Title>** with `Owner: …` (who has to act) · `Sessions: …` (raw sources) · `Follow-up brief: …` (if known).

---

**(16) Timeline-Datenfundament — zwei Folgethemen aus impl 137**
`Owner: Cowork (Brief-Schnitt)` · `Sessions: archive/2026-06/2026-06-10-137-impl-timeline-data-foundation.md; 2026-06-16-152-impl-timeline-rebuild-tail.md` · `Follow-up brief: offen`

- **(b) `primaryEraId` ist ein Placeholder-Feld.** `apply-override.ts` hardcodet `'time_ending'` bei jedem SSOT-Upsert. Seit der neue `/timeline` auf Events + Setting-Dates läuft, ist der Consumer-Druck gesunken. Brief erst, wenn ein Consumer das Feld ernsthaft nutzt; naheliegende Ableitung: aus Setting-Dates bucketen + Überschreiben abgewöhnen. Curation-Overlay kann einzelne Hand-Fixes zuletzt gewinnen lassen, löst aber den systemischen Placeholder nicht.
- **(c) Atlas-Extension für Events.** Events sind first-class kuratierte Entities. `atlas:regen` um einen Event-Page-Type erweitern (eine Seite pro Event, Era-Index-Seiten).

---

**(18) Inkrementeller Apply — zwei vertagte Vertiefungen aus Brief 157**
`Owner: Cowork (Brief-Schnitt)` · `Sessions: 2026-06-18-157-impl-incremental-apply-default.md` · `Follow-up brief: offen`

Brief 157 hat `db:sync` (nicht-destruktiver Voll-Roster-Re-Apply) als Default etabliert; bewusst der einfache, sichere erste Schritt. Zwei Vertiefungen sind ausdrücklich vertagt — erst bauen, wenn ein realer Bedarf sie rechtfertigt:

- **(a) `db:apply` mit Plan/Diff (Out-of-scope B des Briefs).** Ein Verb, das erst einen Plan druckt und nur das Delta upsertet, statt den vollen Roster re-zuapplizieren. Bei wachsender Datenmenge die natürliche Evolution von `db:sync`.
- **(b) Exakter „DB == kompletter SSOT"-Deep-Diff.** `db:drift` ist bewusst nur ein Health-Check (Slice-`--verify`s + Contiguity + Counts + Podcast-Drift); er fängt **keine** stale Korpus-Junction *innerhalb* einer applizierten Batch. Ein echter Vollvergleich kommt erst, wenn sich der Health-Check als unzureichend erweist.

---

*(Queue aktuell: (16b/c) + (18a/b). Neue Items aus Impl-Reports kommen wie gewohnt nummeriert dazu.)*
