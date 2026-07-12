---
session: 2026-07-11-197
role: implementer
date: 2026-07-11
status: complete
slug: launch-s1a-snapshot-release
parent: docs/launch-master-plan.md § Session 1a (PR 2 der Zweiteilung) + scripts/runbooks/content-release-runbook.md
links:
  - https://github.com/phinklab/chrono-lexicanum/pull/243
commits: []
---

# Launch S1a-Snapshot — Produktions-Sync (Era-Fix) & initiale Snapshot-Artefakte

## Summary

Erster Durchlauf des Content-Release-Runbooks: genau ein vollständig grüner
`db:sync` (nach explizitem Go) hat die 7 gemergten, nie applied Bücher
angewandt und die Era-Invariante in der Produktions-DB hergestellt; die
initialen 104 Snapshot-Artefakte + Manifest liegen deterministisch (Doppellauf
byte-identisch) auf `codex/ingest-batches-initial-snapshot`. Ein Runbook-STOPP
trat wie antizipiert ein: der Sync hängte die nie applied Autorin
Victoria Hayward an `persons.json` an → separater Source-PR
[#243](https://github.com/phinklab/chrono-lexicanum/pull/243) (vor dem
Snapshot-PR zu mergen).

## Ablauf & Messwerte

**Setup.** Worktree `chrono-lexicanum` (Koordination, E8-Launch-Ausnahme),
logischer Strang Batch/Ingestion, frischer Branch
`codex/ingest-batches-initial-snapshot` von `origin/main` (= `1afa854`,
S1a/PR #242 gemerged). Working Tree sauber; untracktes `outputs/`
(Maintainer-Datei) unangetastet, nie gestaged.

**Stufe 1 — Read-only Preflight.**

- Migrations-Head-Parität (`build-snapshot.ts --check-migrations`): **grün** —
  Repo == DB, 16 Migrationen, Head `0015_keen_tag`, Hash `a37bede08bab…`.
  Damit ist der bis dato ausstehende Produktionsbeleg für `0015` erbracht.
- `npm run db:drift` (read-only): 2 rote Checks, beide eingeordnet:
  - per-book tail: 7 Dateien „no works row — not applied yet"
    (W40K-0593–0599: deathworlder, the-rose-in-darkness, the-rose-at-war,
    lelith-hesperax-queen-of-knives, our-martyred-lady,
    the-long-and-hungry-road, armageddon-season-of-fire) — erwarteter
    source-first-Zustand, vom Sync behoben.
  - podcast artifact drift **lorehammer**: 12 Episoden in DB, nicht im
    committeten Artefakt (DB 399, Artefakt 387). Vor dem Go verifiziert:
    `apply-podcast.ts` upsertet per `(podcast_work_id, episode_guid)` ohne
    Lösch-Sweep — die 12 Episoden überleben den Sync und stehen korrekt im
    Snapshot (DB ist SSOT). Offen bleibt die Reproduzierbarkeitslücke
    (Follow-up unten).

**Stufe 2/3 — Go + genau EIN db:sync.** Explizites Go von Philipp
(Content-Freeze bestätigt). Kette 9/9 Schritte, alle `--verify` grün,
Exit 0. `apply:book --all`: **inserts=7, updates=889, total=896**;
Junction-Endstand u. a. work_facets 17403 · work_persons 905 ·
work_factions 2906 · work_locations 1334 · work_characters 2049 ·
work_collections 196.

**Runbook-STOPP (persons.json).** Der Sync schrieb
`victoria_hayward` (Autorin von *Deathworlder*; zudem Beiträgerin in
once-a-killer, sanction-and-sin) nach `persons.json` (Total 104) — der im
Runbook Stufe 3 explizit antizipierte Fall. Nach Rückfrage-Entscheid:
separater Source-PR
[#243](https://github.com/phinklab/chrono-lexicanum/pull/243)
(`codex/ingest-batches-persons-hayward`, Commit `6e232b0`), **vor dem
Snapshot-PR zu mergen**. Der Snapshot-Branch bleibt artefakt-rein.

**Era-Invariante (read-only, nach Sync).** Eigenes Read-only-Skript
(Scratchpad, identische Bucket-Semantik: inklusives `[start,end]` über
`startY`; Kurationsoverlay enthält verifiziert **keine**
`primaryEraId`-Field-Fixes, also keine Ausnahmen):

- 896 `book_details`-Zeilen · **97 gesetzt** (== alle 97 book-dates-Slugs) ·
  **799 NULL** · **0 Mismatches**.
- Verteilung: great_crusade 4 · horus_heresy 19 · the_forging 16 ·
  the_waning 2 · **time_ending 44** (exakt die Runbook-Erwartung „44 legitim") ·
  indomitus 12. Pauschalstempel „889 × time_ending" beseitigt.

**Stufe 4 — Snapshot (Doppellauf).** `npm run snapshot:regen`:

- **104 Artefakte + Manifest** nach `scripts/snapshot-data/`
  (`generatedAt 2026-07-11T19:01:29.398Z`).
- Manifest: `sourceMigration` = {count 16, `0015_keen_tag`,
  Hash `a37bede…` — identisch zum Preflight}; jeder Eintrag mit
  `path` + `sha256`; Manifest hasht sich nicht selbst.
- Counts: books 896 · eras 8 · podcastIndexShows 4 · podcastSearchShows 4 ·
  podcastSearchEpisodes 1114 · factionGuideRows 228 · charaktereRows 507 ·
  weltenRows 446 · personenRows 137 · hotIds {character 30, faction 39,
  location 13, person 14} · entityViews 96.
- Stichproben: `entities/character/roboute_guilliman.json` +
  `entities/faction/thousand_sons.json` (vollständige Projektion:
  type/id/name/blurb/facts/worksByKind/crossLinks); `deathworlder` (neues
  Buch) in `browse-books.json` mit Synopsis präsent; Era-Verteilung im
  Artefakt deckungsgleich zur DB (97 gesetzt, 44 time_ending).
- **Determinismus-Beleg:** sha256 über alle 105 Dateien vor/nach dem
  Zweitlauf — **byte-identisch** (Exporter: „content unchanged — generatedAt
  carried forward"). `git status` nach beiden Läufen identisch
  (nur `?? scripts/snapshot-data/` + Maintainer-`outputs/`).

## Decisions I made

- **Lorehammer-Drift nicht in dieser Session behoben** (Go trotz Drift, mit
  Philipps Entscheid): der Sync gefährdet die 12 Episoden nicht, der Snapshot
  spiegelt die DB korrekt. Die Reproduzierbarkeitslücke (ein `db:rebuild` aus
  `main` verlöre die 12 Episoden; Weekly-Refresh würde sie als „neu"
  re-detecten) bleibt als Follow-up: `npm run ingest:podcast -- --show
  lorehammer` re-pullen und Artefakt source-first mergen.
- **persons.json als separater Mini-PR** statt im Snapshot-PR
  (Runbook-Default, von Philipp bestätigt) — Merge-Reihenfolge: erst #243,
  dann der Snapshot-PR.
- **Era-Invariante mit eigenem Read-only-Skript geprüft** statt über
  `apply:book --verify` — der Verify ist nur ein Presence-Check und deckt
  `primary_era_id` nicht ab (deshalb zeigte der Drift-Check vorab auch keine
  Era-Mismatches).

## Verification

- `build-snapshot.ts --check-migrations` — grün (Repo == DB, `0015_keen_tag`).
- `npm run db:sync` — genau ein Lauf, Exit 0, 9/9 Schritte inkl. aller
  `--verify` grün (Log im Session-Scratchpad).
- Era-Invarianten-Skript (read-only) — 0 Mismatches (Zahlen oben).
- `npm run snapshot:regen` ×2 — Doppellauf byte-identisch (sha256-Diff leer).
- PR-Gates: Snapshot-Diff enthält ausschließlich `scripts/snapshot-data/**`;
  keine Code-Änderungen; `persons.json` fährt in #243; Revalidation in dieser
  Session **nicht** ausgeführt (folgt laut Runbook erst nach Merge/Deploy als
  manueller curl, B1/E4).

## For next session

- **Follow-up (Batches):** Lorehammer-Artefakt re-pullen
  (`npm run ingest:podcast -- --show lorehammer`) und als Source-PR mergen,
  damit `main` die 12 DB-Episoden wieder reproduziert und der Weekly-Refresh
  sie nicht als „neu" re-detected.
- Nach Merge des Snapshot-PRs (= Deploy, E4): Revalidation (genau ein POST,
  manueller curl bis S3a) + Live-Smoke laut Runbook Stufe 6.
- Dieser Report fährt laut Runbook („Launch-Protokolle/Rollups in separaten
  Koordinations-PRs") **nicht** im Snapshot-PR mit — er bleibt bis zum
  nächsten Koordinations-Rollup-PR uncommitted im Working Tree.
