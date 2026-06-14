---
session: 2026-06-12-148
role: implementer
date: 2026-06-12
status: complete
slug: weekly-refresh-delta
parent: 2026-06-11-144
links: []
commits:
  - 56127cc # Welle-Refresh: Book-Backlog-Cursor (Delta-Reporting)
  - 9e7429e # Diff-Reader: Promise.all + Element-Tripwire (144 A.4a/A.5)
  - 4a34d3c # JSON.parse-Guards state/llm-cache/load-roster (144 T.4-Rest)
---

# Weekly-Refresh auf Delta-Reporting + Welle-6-Neubewertung

## Summary

Der Weekly-Refresh hat jetzt einen **Book-Backlog-Cursor** (`book-seen.json`): Report und
Rolling-PR zeigen nur noch das echte Wochen-Delta, der unentschiedene Backlog liegt collapsed
als Pending-Sektion bei, und eine Woche ohne frische Funde ist ein Noop. Von den vier
Welle-6-Kandidaten aus Report 144 sind drei umgesetzt (A.4a, A.5 als Mini-Tripwire, T.4-Rest)
und einer verworfen (A.4b). **Wichtigster Fakt:** die DB wurde nicht angefasst — alle
geänderten Pfade sind Detection/Read-only-Tooling; `book-seen.json` wird bewusst NICHT
initial committet (s. „Open issues").

## Thema 1 — Analyse: was der Weekly wirklich macht

**(a) Schritt für Schritt.** `weekly-refresh.yml` (Cron Mo 06:00 UTC) → `npm ci` →
`refresh:check:ci` (`scripts/refresh-check.ts`): lädt den 889er-Roster und indiziert ihn
einmalig (drei Hash-Maps), fetcht **eine** CSV (Track of Words, ~1060 Zeilen) + **vier**
Podcast-Feeds, klassifiziert jede in-scope CSV-Zeile per O(1)-Lookup gegen den Index,
diffte Episoden-GUIDs gegen die committeten Artefakte, und schreibt bei Findings genau
zwei Dateien (`report.md` + `proposal.json`). **Kein LLM-Call, kein DB-Import** (das
bestätigt der Workflow-Header explizit: keine Anthropic-/Supabase-Secrets). CPU-Anteil
~150 ms; die Laufzeit dominieren `npm ci` und fünf Netz-Fetches.

**(b) Skaliert er mit dem Delta oder dem Bestand?** Mit dem Delta — die Befürchtung
„riesiger Lauf für ein einzelnes Add" trifft auf die **Laufzeit nicht** zu. Der Roster wird
einmal geladen (O(889)), danach ist jede Kandidaten-Klassifikation ein Hash-Lookup. Was
**nicht** delta-basiert war, ist der **Report-Inhalt**: gediffte wird gegen den committeten
Roster, und alles, was seit dem Year-Floor (2025) weder promotet noch ignoriert ist, wurde
**jede Woche erneut als „neu" proposed**. Der lokale W24-Lauf listete so 30 „neue" Bücher
(PR-Titel: „30 new book(s)"), obwohl das echte Wochen-Delta ein Bruchteil war. Podcasts
hatten dieses Problem nicht (per-Show-Cursor seit Brief 133); Büchern fehlte der Zustand
zwischen „ignorieren" (permanent) und „promoten": **gesehen, Entscheidung offen**.

**(c) Verdict.** Grundlogik sinnvoll (detection-only, fail-soft, deterministisch,
byte-stabiles Proposal) — umgebaut wurde nur die Reporting-Schicht, nicht die Engine.

## What I did

### Block 1 — Book-Backlog-Cursor (`56127cc`)

- `scripts/refresh/book-seen.ts` (neu) — Spiegel von `book-ignore.ts`:
  `ingest/refresh/book-seen.json` hält Title-Slugs mit `firstSeen` (ISO-Woche). Parse ist
  fail-loud (Key muss `slugify(title)` sein, `firstSeen` muss `YYYY-Www` matchen); Merge ist
  first-seen-wins; Serialize deterministisch (Slugs sortiert).
- `scripts/refresh/book-source.ts` — `detectMissingBooks` partitioniert verdict-`new` und
  `title-collision` per Seen-Set in `pendingBooks`/`pendingReviewBooks`. Partition erst
  **nach** der ID-Allokation: IDs bleiben positional in CSV-Reihenfolge, ein Mark-Reviewed
  verschiebt also keine IDs (Proposal-Byte-Stabilität bleibt). `ignoreSlugs`+`seenSlugs`
  dabei in ein trailing Options-Objekt (`BookDetectFilters`) gefaltet.
- `scripts/refresh/types.ts` — `BookDiffResult` + `pendingBooks`/`pendingReviewBooks`
  (required, volle Rows — Promotion-Copy-Paste aus dem Backlog funktioniert weiter).
- `scripts/refresh/emit.ts` — `proposalHasFindings` ist jetzt faktisch fresh-only (Formel
  unverändert, `newBooks` enthält nur Ungesehenes): reiner Backlog ⇒ Noop ⇒ Rolling-PR
  schließt. Report: Summary `N new, M pending, K to review`, Sektion „New since last
  review", Pending-Backlog als `<details>`-Block, Seen-Kollisionen als Count. Das
  ⚠-Format-Flag wird per Sektion geschnitten (`formatDefaultedIds` ∩ Tabellen-IDs), damit
  die Footnote nur unter Tabellen mit geflaggten Zeilen rendert.
- `scripts/refresh-check.ts` — lädt das Seen-Set, Contract-Zeile jetzt
  `REFRESH_RESULT=findings books=<fresh> pending=<m> episodes=<k> path=<dir>` (Token-Order-
  Constraints im Header dokumentiert: `path=` zuletzt, kein Token-Name darf in einem anderen
  enden — die yml-seds sind greedy). Neues Flag `--include-seen` (leeres Seen-Set) macht den
  Backlog nach Noop-Wochen lokal regenerierbar — sonst gäbe es ihn nach „alles markiert +
  nichts Frisches" in keinem committeten Artefakt mehr.
- `scripts/refresh-mark-reviewed.ts` — neuer Modus `--books`: löst das neueste
  `ingest/refresh/<week>/proposal.json` auf (`--week`/`--proposal` override), markiert alles
  dort Gelistete (new + pending + beide Review-Buckets) als seen, `firstSeen` aus
  `proposal.isoWeek`. Mit `--show`/`--all` kombinierbar.
- `scripts/refresh/proposal-path.ts` (neu) — `findProposalPath`/`loadProposal` aus
  `refresh-ignore-book.ts` extrahiert (geteilt von ignore-book + mark-reviewed).
- `scripts/refresh-ignore-book.ts` — `--id` löst jetzt auch Pending-IDs auf (das
  wahrscheinlichste Dismiss-Ziel ist genau der Backlog), `--all-review` schließt
  `pendingReviewBooks` ein.
- `.github/workflows/weekly-refresh.yml` — PR-Titel trägt den Backlog separat:
  „1 new book(s) (+29 pending), 2 new episode(s)"; `pending=` fehlt-tolerant geparst
  (Pre-Cursor-Runs). Die `books=`/`episodes=`-seds verlangen jetzt ein führendes
  Leerzeichen (Token-Präfix-Härtung, analog `path=`).
- `scripts/runbooks/weekly-refresh-runbook.md` — neue Sektion „Book backlog cursor"
  (Semantik, Sequencing-Falle, ID-Instabilität, `--include-seen`, Lifecycle) + Promote-Flow
  Schritt 6 (`mark-reviewed -- --books` nach jedem Review, auch ohne Promotion).
- `scripts/test-refresh.ts` — 7 neue Tests: Partition inkl. ID-Stabilität, Backlog-only ⇒
  kein Finding, book-seen Roundtrip/Guards/first-seen-wins, Report mit Pending-`<details>`
  und per-Sektion-⚠.

### Block 2+3 — Welle-6-Kandidaten (Report 144 § A.4/A.5/T.4), einzeln neu bewertet

| Punkt | Verdict | Begründung |
|---|---|---|
| **A.4a** Promise.all im Diff-Reader | ✅ umgesetzt (`9e7429e`) | Read-only, ~Zeilen-Tausch; /ingest rendert seit S.3 per Request, parallele FS-Reads sind strikt besser. Fehler bleiben per-File-Slots. |
| **A.5** Diff-File-Validierung | ✅ als Mini-Tripwire (`9e7429e`) | Volles Zod-Schema **verworfen**: es wäre exakt der Type-Mirror zu `DiffFile`, den das Modul per Invariant ausschließt, ~100+ Zeilen Parallel-Struktur gegen nahe null Realrisiko (selbst-produzierte, committete, PR-reviewte Files). Stattdessen Element-[0]-Sample-Check auf das, was der Detail-View non-optional dereferenziert (`added[].payload`, `updated[].diff`, `field_conflicts[].sources`) — ehrlich als Writer-Schema-Drift-Tripwire kommentiert, nicht als Validierung. |
| **T.4-Rest** 3× `JSON.parse` as-Cast | ✅ umgesetzt (`4a34d3c`) | Lokale Shape-Guards, bewusst kein Shared-Helper: die drei Stellen haben drei verschiedene Failure-Semantiken. `state.ts` → loud throw mit Lösch-Hinweis (korruptes Resume-State darf keinen 8h-Lauf type-lügen); `llm/cache.ts` → Miss (verhindert konkret den `null.key`-TypeError bei `JSON.parse("null")`); `load-roster.ts` → bestehende Checks + `books[0]`-Element-Sample. |
| **A.4b** Pipeline-Parallelisierung | ❌ verworfen | Report 144 nennt das Sequenzielle selbst einen bewussten Resilience-Tradeoff (per-Buch-Checkpoints; State-Writes nicht concurrency-safe); Lexicanum robots.txt `Crawl-delay: 5` verbietet Parallel-Fetches der dominanten Quelle; es bräuchte eine neue Dependency (`p-limit`) gegen die No-new-deps-Policy — und vor allem ist der Punkt **vom Thema-1-Befund geschluckt**: der Weekly nutzt die v1/v2-Pipeline gar nicht (CSV+RSS only), die Pipeline läuft real kaum noch. Nutzen ~0, Risiko real. |

**Korrektur am Session-Auftrag:** „T.4-Rest" ist **kein** structuredClone-Thema. Der
structuredClone-Teil von T.4 (`galaxy/data.ts`) wurde bereits in Session 147/Welle 3
erledigt; die drei Reststellen (Report 147 nennt sie explizit) sind `JSON.parse`-ohne-Guard
— Fix-Spec laut 144 „safeJsonParse-Helper oder Zod", umgesetzt als lokale Guards (s.o.).

## Decisions I made

- **Explizites `mark-reviewed -- --books` statt Auto-Seen im Detection-Lauf** — spiegelt
  die Podcast-Cursor-Semantik, die Philipp am 2026-06-09 selbst festgelegt hat („advance
  ONLY on explicit mark-reviewed"). Ein Auto-Seen hätte zudem Findings verschluckt, wenn
  ein Rolling-PR ungemergt geschlossen wird.
- **Kein initiales `book-seen.json` committet** — Kurations-Entscheidung gehört Philipp.
  Praktisch ist sie aktuell gegenstandslos: der Live-Backlog ist **0** (die 30 W24-Bücher
  wurden in Session 136 promotet, 46 weitere sind ignore-gelistet) — der Cursor greift ab
  der nächsten Ankündigungswelle von selbst.
- **`pendingBooks` als volle Rows im Proposal** (nicht nur Slugs/Counts) — Promotion bleibt
  Copy-Paste aus `proposal.json`, und `refresh:ignore-book --id` kann Pending-IDs auflösen.
- **Findings = fresh-only** — eine Woche mit stehendem Backlog und nichts Neuem schließt
  den Rolling-PR. Dafür `--include-seen` als lokaler Regenerations-Hebel (der Backlog wäre
  sonst nach einer Noop-Woche in keinem committeten Artefakt mehr).
- **Partition nach ID-Allokation** — IDs bleiben positional, ein Seen-Mark ändert kein Byte
  an den übrigen Proposal-Zeilen.

## Verification

- `npx tsc --noEmit` — grün (nach jedem Block).
- `npm run lint` — grün.
- `npm run test:refresh` — 55/55 grün (48 bestehende + 7 neue, offline).
- Read-only E2E: `refresh:check --week=2026-W99` (echter Netz-Lauf) → Contract-Zeile trägt
  `pending=0`, `proposal.json` trägt die neuen Felder; `mark-reviewed -- --books --week
  2026-W24` markierte die 30 Alt-Einträge (first-seen-wins, slug-sortiert; das W24-Proposal
  ist pre-Split — die `?? []`-Guards greifen); Folge-Lauf mit gefülltem Seen-File parst
  sauber und zeigt korrekt 0 pending (alle 30 sind inzwischen promotet ⇒ `exact` ⇒
  Lifecycle wie dokumentiert); `--include-seen` läuft. Testartefakte (W98/W99-Dirs,
  Test-`book-seen.json`) danach gelöscht — nichts davon committet.
- Smoke: `listDiffFiles()` gegen die zwei committeten `ingest/.last-run/*.diff.json` —
  `ok=2 error=0` (der verschärfte Guard akzeptiert echte Files).
- **Kein** `db:migrate`, **kein** Apply-/Seed-/Ingest-Lauf — DB unberührt (Schutzregel der
  Session). Der einzige lokale Untracked-Stand (`ingest/refresh/2026-W24/`,
  `ingest/podcasts/luetin09-full.json`) blieb unangetastet.

## Open issues / blockers

Keine Blocker. Ein Hinweis: `book-seen.json` existiert noch nicht — das ist der
Auslieferungszustand. Verhalten bleibt bis zum ersten `refresh:mark-reviewed -- --books`
exakt wie bisher; beim nächsten Findings-PR einmal nach dem Review ausführen (Runbook
§ Book backlog cursor, Sequencing-Falle beachten: erst PR mergen/fetchen, dann marken).

## For next session

- **Für den Cowork-Rollup** (Brain schreibt der Coordination-Worktree): Weekly-Refresh-
  Semantik geändert — `books=` in der Contract-Zeile zählt nur noch frische Funde, neues
  Token `pending=`, neue committete State-Datei `ingest/refresh/book-seen.json`, neuer
  mark-reviewed-Modus `--books`. Runbook ist aktualisiert (Batches-eigene Datei).
- Beobachtung, nicht angefasst: Report 147 „Open issues" Nr. 3 (Preview-Gate 307t externe
  Aufrufe auf `/api/revalidate`/`/healthz`) steht noch offen — betrifft auch die
  Batches-Apply-Scripts, sobald sie den Revalidate-POST aufnehmen sollen.

## References

- Report 144 (`sessions/archive/2026-06/2026-06-11-144-impl-technical-deep-review.md`) § A.4/A.5/T.4 —
  Specs der Welle-6-Kandidaten.
- Report 147 (`sessions/2026-06-12-147-impl-deep-review-fixes.md`) § „Welle 6 —
  übersprungen" — Skip-Begründung (Strang-Regel) + die drei T.4-Reststellen.
- Runbook `scripts/runbooks/weekly-refresh-runbook.md` — operative Doku des neuen Cursors.
