---
title: Open questions (next-brief queue)
type: overview
created: 2026-05-09
updated: 2026-06-12
sources:
  - ../../sessions/README.md
  - ../../sessions/archive/2026-06/2026-06-10-137-impl-timeline-data-foundation.md
  - ../../sessions/2026-06-12-147-impl-deep-review-fixes.md
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
> **Geschlossene OQs liegen in git + [`log.md`](./log.md).** OQ (15) Compendium-Taxonomie wurde 2026-06-12 geschlossen: `/compendium` ist shipped (129-impl-compendium-doorways), die Restpunkte (Primarchen-Kuration, Themen-Stränge, Autoren-Tiefe) leben als 121-P8/P9 + 122-B8/B9 in den Boards.

Format per item: **(N) <Title>** with `Owner: …` (who has to act) · `Sessions: …` (raw sources) · `Follow-up brief: …` (if known).

---

**(16) Timeline-Datenfundament — drei Folgethemen aus impl 137**
`Owner: Cowork (Brief-Schnitt) / Batches (a) / Cowork (b, c)` · `Sessions: archive/2026-06/2026-06-10-137-impl-timeline-data-foundation.md` · `Follow-up brief: offen`

- **(a) `db:rebuild` wischt Timeline-Daten mit weg.** `TRUNCATE works CASCADE` leert `event_works` + `works.setting*`. **Interim-Regel: nach jedem `db:rebuild` muss `npm run apply:timeline` laufen.** Sauber: Tail-Step in `db-rebuild.sh` analog `apply:audiobook-narrators` (kleines Batches-Item; Runbook-governed).
- **(b) `primaryEraId` ist ein Placeholder-Feld.** `apply-override.ts` hardcodet `'time_ending'` bei jedem SSOT-Upsert. Seit der neue `/timeline` auf Events + Setting-Dates läuft, ist der Consumer-Druck gesunken — Brief erst, wenn ein Consumer das Feld ernsthaft nutzt; naheliegende Ableitung: aus Setting-Dates bucketen + Überschreiben abgewöhnen.
- **(c) Atlas-Extension für Events.** Events sind first-class kuratierte Entities — `atlas:regen` um einen Event-Page-Type erweitern (eine Seite pro Event, Era-Index-Seiten).

---

**(17) Deep-Review-Rest — Maintainer-Entscheide + Maschinen-Endpoints**
`Owner: Philipp (Entscheide) / Cowork (Brief-Schnitt) / Product (Umsetzung)` · `Sessions: 2026-06-12-147-impl-deep-review-fixes.md` · `Follow-up brief: in den angekündigten Frontend-Brief bzw. einen kleinen Hardening-Nachzügler falten`

Aus 147 § „Open issues" / „Decisions for Philipp", noch unentschieden bzw. unerledigt:

- **Preview-Gate vs. Maschinen-Endpoints:** der Catch-all-Matcher in `src/proxy.ts` schickt auch `/api/revalidate` + `/healthz` ohne Cookie auf den Login-Redirect — externe Monitor-/Apply-Aufrufe scheitern mit 307. Negative-Lookahead erweitern oder bewusst so lassen, bis das Gate fällt.
- **CSP-Strategie** (statisch/Hash vs. Nonce+dynamisch vs. vorerst ohne) — einziger fehlender Security-Header.
- **`/buecher` vs. `/archive`:** redundant — behalten oder 308-Redirect?
- **FilterRail:** dormant — endgültig löschen oder reaktivieren? (Kandidat für 121-P7-Cleanup-Ledger.)
- **`/buch/[slug]`-SSG-Blockade:** `searchParams`+`headers()` aus Brief 105 verhindern Prerender — lohnt der Client-Insel-Umbau?
- **`REVALIDATE_TOKEN`** in Vercel setzen (operativ, kein Brief — hier nur, bis es passiert ist).
