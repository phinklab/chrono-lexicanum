---
session: 2026-05-10-056
role: architect
date: 2026-05-10
status: open
slug: v2-pre-roster-fixes
parent: 2026-05-09-055
links:
  - 2026-05-09-054
  - 2026-05-09-055
commits: []
---

# V2 Pre-Roster Fixes — Lex-Cache + Checkpointing + Cost-Recompute + Diff-Archivierung

## Goal

Drei isolierte V2-Ingestion-Pfad-Fixes, die die Maintainer-Verwertbarkeit kleiner Batches dramatisch verbessern, plus eine Aufräum-Operation auf `ingest/.last-run/`. Die drei Fixes: per-page Lexicanum-Cache (24h TTL, mit *negative caching*), per-book Diff-Checkpointing in `run-batch.ts` (mid-run-Halt = usable Artefakt), Cost-Recompute auf Cache-Hits (Telemetrie ist nicht mehr blind). Die Aufräumung: 047er V1-Diff und 054er V2-Pilot-Diff in `ingest/.archive/` verschieben — nur das 055er V2-Batch-Diff bleibt aktiv im Dashboard.

Nach 056 ist der V2-Pfad bereit für die Master-Liste-Erstellung (Brief 057) und danach 10er-Batches mit echter Cost-Telemetrie und Resume-fähigem State.

## Context

Brief 055 hat den ersten V2-Voll-Lauf über 50 Bücher geliefert — und gleichzeitig drei strukturelle Schwächen freigelegt, die jeden weiteren Lauf unhandlich machen:

- **Lexicanum-Throttle dominiert die Latenz.** `CRAWL_DELAY_MS = 5_000` × 11 URL-Patterns = bis zu 55 s pro `lexicanum_missing` Buch, *vor* dem LLM-Call. Bei ~70 % lex-missing-Rate im typischen Slug-Window heißt das, dass ein 100-Bücher-Batch ~70 Min nur für Lexicanum-Probing kostet. Genau der Grund warum 055 mid-run abgebrochen wurde.
- **Cost-Telemetrie kollabiert auf Cache-Hits.** Das 055er Diff-File zeigt `llmCostSummary.estUsdCost = $0` für alle 50 Bücher, weil sie alle Cache-Hits waren. Real Cost-pro-Buch ist nur aus dem 5-Book-Smoke ($0.0199/Buch) bekannt — kein Beleg über 50.
- **Kein per-book Checkpointing in `run-batch.ts`.** Der Diff schreibt erst end-of-loop. Mid-run-Halt verliert den ganzen aggregierten State; CC hat in 055 einen Synthesis-from-Cache-Fallback (`scripts/synthesize-v2-batch-diff.ts`) gebaut, weil der TaskStop-Mechanismus drei Mal nicht zum tsx-Child propagiert ist und alle Hoffnung erschien verloren — der Live-Lauf hat dann doch durchgelaufen, aber Glück ist keine Strategie.

Parallel dazu: das `ingest/.last-run/` Verzeichnis trägt drei strukturell unterschiedliche Diff-Files (V1 post-047, V2-Pilot, V2-Batch). Maintainer-Direktive 2026-05-10: nur das aktuelle V2-Batch-Diff bleibt aktiv. Die zwei älteren Diffs sind Audit-Anker für Brain-Pages (`pipeline-state.md`, `decisions/why-haiku-not-sonnet.md`, `decisions/why-multi-source-merge.md`) und müssen erhalten bleiben — aber außerhalb des Dashboard-Read-Path.

V2's Master-Liste-Brief (057) wird die Buch-Auswahl-Strategie strukturell ablösen (Slug-Sort → Roster-File). 056 ist die Vorarbeit dazu — wir machen die Pipeline session-tauglich, *bevor* wir die Auswahl-Logik anfassen.

## Constraints

- **Drei isolierte Fixes, keine V2-Architektur-Änderungen.** `BookV2Record`, `Validation[]`, `FieldRecord<T>`, Discovery-Spine, Validators, Slim-LLM-Prompt — alles unangetastet.
- **CLI-Verhalten unverändert.** `npm run ingest:backfill -- --pipeline=v2 --batch=v2-tryout-2 --limit=N` muss weiter genau so funktionieren wie nach 055; nur Latenz, Cost-Reporting und Halt-Verhalten verändern sich.
- **V1-Pfad unangetastet.** V1-Module + V1-Cache + V1-Diff-Writer bleiben verbatim.
- **Schema-Änderungen: keine.** Migration 0007 bleibt committed-but-not-applied.
- **TypeScript strict bleibt strict.** Kein `any`, kein `as unknown as`. Cache-Helper exportiert seine Types; Negative-Cache-Marker als diskriminierte Union (`{ kind: "hit"; html: string } | { kind: "miss"; status: number; reason: string }` o. Ä.).
- **Cross-platform.** Cache-Filenames mit safe-slugify (kein `:` o. ä. — Windows-kompatibel). Pfade mit forward-slash-Normalisierung wie heute.
- **Dashboard-Read-Path bleibt funktional.** Diff-Archivierung darf das `/ingest`-Dashboard nicht brechen — Card-Render-Logik enumeriert nur `ingest/.last-run/`. Sub-Verzeichnisse darunter (z. B. `ingest/.last-run/.archive/`) wären nicht okay; Sibling-Verzeichnis (`ingest/.archive/`) ist die saubere Lösung.
- **Brain-Sources-Pointer mit-aktualisieren.** Wikilinks/`sources:`-Pfade in betroffenen Brain-Pages auf den neuen Archive-Pfad umschwenken. Brain:lint muss grün bleiben.

## Out of scope

- **Master-Liste-Erstellung.** Brief 057. 056 berührt kein `seed-data/`, kein `book-roster.json`, keine neue Discovery-Quelle.
- **Buch-Auswahl-Strategie-Änderung.** Bleibt Slug-Sort bis 057 sie ablöst. `run-batch.ts` Selektor-Logik unverändert.
- **`--resume`-Modus für Batches.** Partial-Diff-File ist Output, kein Eingangs-Wieder-Aufnahme-Punkt. Wenn ein Lauf mid-run hält, bleibt das Partial-File zur Hand-Übernahme nach `ingest/.last-run/` liegen — kein Auto-Resume in 056. Falls 057+10er-Workflow Resume real braucht, separater Mini-Brief.
- **TaskStop-Harness-Issue.** Plattform-Limitation, nicht V2-Pipeline. Out of scope.
- **Negative-Caching für Quellen außer Lexicanum.** TLBranson hat schon eigenes Caching, OL und Hardcover sind schnell genug für synchron-fresh. Nur Lexicanum kriegt den 24h-Cache + Negative-Caching-Pfad.
- **Resolver / Unresolved-Queue / Schema-Erweiterung.** Verschoben hinter die 10er-Batches.
- **V2-Pilot-Re-Run.** Pilot-Slugs sind durch den 055er Hash-Bump bereits cache-invalidiert; ein erneuter Re-Run wäre erst nach 057-Master-Liste sinnvoll.

## Acceptance

The session is done when:

- [ ] **Per-page Lexicanum-Cache** liegt unter `ingest/.cache/lexicanum/` (analog zur bestehenden `ingest/.cache/tlbranson/` Struktur), mit einem File pro abgefragter URL. Cache-Form trägt mindestens `{ url, fetchedAt, kind: "hit" | "miss", html?: string, status?: number, reason?: string }`. **Negative caching ist obligatorisch:** 404er, blocked-Fetches und Cloudflare-Blocks werden gecached, damit ein Re-Run desselben `lexicanum_missing` Buchs nicht 11 URLs × 5 s erneut probiert.
- [ ] **24h TTL** auf den Cache-Files. Stale Hits werden re-fetcht, frische Hits direkt aus File gelesen ohne Throttle-Wait.
- [ ] **Lexicanum-Latenz-Smoke:** Drei aufeinanderfolgende Runs *desselben* `lexicanum_missing` Slugs (z. B. `--pipeline=v2 --slug=<lex-missing-slug>` oder eine entsprechende Test-Form). Run 1 zeigt im Log die ~55 s Throttle-Wait; Run 2 + 3 lesen aus Cache und überspringen den Wait. Im Implementer-Report: konkrete Latenzen (Wall-Clock-Sekunden für `fetchOne(slug)` aus Lexicanum-Adapter).
- [ ] **Per-book Diff-Checkpointing** in `run-batch.ts`: nach jedem fertig-prozessierten Buch wird ein Partial-Diff unter `ingest/.state/v2-batch-<name>.partial.diff.json` geschrieben (overwrite, nicht append; struktur-äquivalent zu `V2DiffFile` aber mit dem bisherigen Records-Array-Stand). Pfad-Konvention orientiert an V1's `src/lib/ingestion/state.ts`.
- [ ] **Loop-Ende-Promotion:** bei erfolgreichem End-of-Loop wird das Partial-File nach `ingest/.last-run/v2-batch-YYYYMMDD-HHMM.diff.json` umbenannt/kopiert + die `ingest/.state/`-Variante gelöscht. Bei mid-run-Abort bleibt das Partial-File liegen für Hand-Übernahme.
- [ ] **Abort-Smoke:** Ein Smoke-Lauf mit `--limit=5`, mid-run abgebrochen (Ctrl-C nach Buch 2 oder 3) hinterlässt ein gültiges `ingest/.state/v2-batch-<name>.partial.diff.json` mit den bis dahin prozessierten Records (2 oder 3). Im Report dokumentiert; Partial-File danach gelöscht.
- [ ] **Cost-Recompute auf Cache-Hits.** Wenn eine LLM-Cache-Response gelesen wird und `enrich.estUsdCost === 0` aber `audit.tokenUsage` vorhanden, dann wird `estimateUsdCost(tokenUsage)` rückgerechnet. Resultierender `llmCostSummary.estUsdCost` ist > 0 und plausibel-nahe zum fresh-Lauf-Cost. Weder das Cache-File noch das Diff-File schreibt den recomputed Wert *zurück* — der Recompute passiert beim Lesen für die Diff-Aggregation.
- [ ] **Cost-Recompute-Smoke:** Re-Run des 055er Batches (`--pipeline=v2 --batch=v2-tryout-2 --limit=5` mit warmem Cache) zeigt im resultierenden Diff-File `llmCostSummary.estUsdCost > 0` für jedes Buch, mit aggregiertem Mittelwert in derselben Größenordnung wie der 5-Book-Smoke aus 055 ($0.0199/Buch). Diff danach gelöscht — kein Commit.
- [ ] **Diff-Archivierung:** `ingest/.last-run/backfill-20260508-2101.diff.json` (V1 post-047) und `ingest/.last-run/v2-pilot-20260509-1934.diff.json` (V2-Pilot post-054) verschoben nach `ingest/.archive/` mit sinnvoller Sub-Struktur (Vorschlag: `ingest/.archive/v1/` und `ingest/.archive/v2-pilot/`, oder per-month wie der `sessions/archive/`-Pfad — CC entscheidet, im Report begründen). Files bleiben committed.
- [ ] **`ingest/.last-run/` enthält nach 056** genau zwei Files: das 055er `v2-batch-20260510-1109.diff.json` + das `v2-batch-20260510-1109-surfaces.json`. Sonst nichts.
- [ ] **Brain-`sources:`-Pointer aktualisiert.** Pages, die per Frontmatter auf die archivierten Diffs verweisen — mindestens `brain/wiki/pipeline-state.md`, `brain/wiki/decisions/why-haiku-not-sonnet.md`, `brain/wiki/decisions/why-multi-source-merge.md`, `brain/wiki/project-state.md` (falls dort gelistet) — werden auf den neuen Archive-Pfad umgeschwenkt. CC kann grep-en (`grep -r "backfill-20260508-2101" brain/`, `grep -r "v2-pilot-20260509-1934" brain/`) um die Trefferliste zu finden.
- [ ] **Dashboard-Read-Path:** `/ingest` rendert nach 056 weiterhin korrekt (eine Card für das 055er Diff). Smoke-Test: `npm run dev` → `/ingest` öffnen, Card erscheint, Detail-Page-Klick funktioniert.
- [ ] **`npm run lint`** + **`npm run typecheck`** (oder das im Repo etablierte typecheck-Script) + **`npm run brain:lint -- --no-write`** sind grün.
- [ ] **Implementer-Report dokumentiert:** Lexicanum-Cache-Hit-Ratio im Smoke (% Cache-Hits aus 11 URL-Patterns × N Bücher), gemessene Latenz-Reduktion, Cost-Recompute-Beleg (real estimate-Wert für 055er Re-Run), Archive-Sub-Struktur-Begründung, Liste der angefassten Brain-Pages. Plus die übliche Decisions-Rubrik für jede Stelle, an der CC vom Brief abgewichen ist.

## Open questions

- **Cache-Filename-Konvention für Lexicanum.** TLBranson cached per slugified-URL (z. B. `ingest/.cache/tlbranson/the-end-and-the-death-volume-i.html`) — sollte Lexicanum dasselbe Schema haben? Lexicanum-URLs enthalten oft Sonderzeichen (`Eisenhorn:_Xenos_(Novel)`); CC entscheidet die Slugify-Variante (z. B. SHA256 vs. percent-decoded slugify). Argument für SHA256: deterministisch + filesystem-safe. Argument für slugified-URL: human-debugbar (man sieht im File-Listing was gecached ist). Ich lehne leicht zu slugified+kollisions-safe — aber CC entscheidet.
- **Negative-Cache-TTL.** 24h für Hits ist klar; soll Misses (404er, Cloudflare-Blocks) anders behandelt werden? Vorschlag: gleiche 24h, aber CC darf eine kürzere TTL für Cloudflare-Blocks vorschlagen (z. B. 1h), falls die häufiger transient sind.
- **Cost-Recompute-Funktion: existiert die schon?** `estimateUsdCost(tokenUsage)` müsste eigentlich für die fresh-Lauf-Cost-Berechnung schon existieren (sonst wäre $0.062/Buch im Pilot nicht messbar gewesen). CC findet die Stelle und exportiert sie ggf. zur Wiederverwendung — keine neue Helper-Funktion, falls vermeidbar.
- **`ingest/.archive/` Sub-Struktur.** Per-Pipeline (`v1/`, `v2-pilot/`, `v2-batch-historical/`) oder per-Month wie `sessions/archive/2026-05/`? Per-Pipeline ist klarer für die zwei aktuellen Files (V1 + V2-Pilot strukturell verschieden); per-Month wäre konsistent mit der sessions/archive-Konvention. CC entscheidet, kurz begründen.
- **Partial-Diff-Garbage-Collection.** Wenn ein Run mid-run abbricht und das Partial-File liegen bleibt, *und dann* ein neuer Run startet ohne dass jemand das Partial-File abräumt — was passiert? Vorschlag: neuer Run löscht beim Start das Partial-File seiner eigenen Batch-Konfiguration (gleicher `<name>`-Slot). Stale Partial-Files anderer Batches bleiben. CC kann das Verhalten konkretisieren oder eine bessere Variante vorschlagen.

## Notes

- **Session-Splitting-Disziplin (aus 055-Erfahrung).** Pre-Brief: per-Buch-Latenz von Lex-Cache-Smoke schätzen × Buffer × N (Bücher), bevor irgendwelche Batch-Größen vereinbart werden. Bei 056 ist N klein (3-Buch-Smoke + 5-Buch-Re-Run + ein paar Edge-Test-Cases) — keine Stunden-Lauf-Gefahr.
- **Side-Goal explizit.** 056 produziert *keinen* committed Diff. Smoke-Diffs werden nach Verifikation gelöscht. Das einzige neue committed Artefakt sind die zwei Diff-Files in `ingest/.archive/` (Bewegung aus `last-run`) plus die Code-Änderungen für die drei Fixes plus die Brain-Page-Updates.
- **Sequenz nach 056.** Brief 057 — Master-Liste-Erstellung (`scripts/seed-data/book-roster.json` + `book-roster-overrides.json` + Build-Skript via tlbranson Books + Horus Heresy + Wikipedia-Master, dedup). Brief 058 — V2-Batch-Mode auf Master-Liste umstellen + erster 10er-Batch in derselben Session. Briefs 059+ — fortlaufende 10er-Batches mit Maintainer-Review zwischen den Briefs.
- **Resolver-Verschiebung.** Open Questions 4 (Junction-Resolver) + 5 (Unresolved-Queue) bleiben in `brain/wiki/open-questions.md`, aber rutschen in der Sequenz nach hinten — erst nach 30–50 real-prozessierten Büchern aus den 10er-Batches gibt es echte Empirie für die Alias-Tabelle. Bis dahin ist die 055er Surface-Form-Top-20 unsere Referenz, aber kein Implementier-Eingang.
- **TaskStop-Issue dokumentieren, nicht fixen.** Aus der 055er Erfahrung wissen wir: TaskStop propagiert in unserer Harness nicht zum tsx-Child. Mit per-book Checkpointing wird das ungefährlich — selbst ein zombiende Hintergrund-Lauf produziert ein lesbares Partial-File. Der TaskStop-Bug bleibt aber bestehen; CC kann im Report kurz anmerken, ob ein lokaler Workaround (z. B. trap auf SIGTERM in der Wrapper-Bash, Process-Group-Kill) sinnvoll ist — keine Hard-Acceptance, nur Note.
- **Design-Freedom-Block fehlt absichtlich.** Dieser Brief berührt kein UI. Cache-File-Format, Filename-Konvention, Sub-Verzeichnis-Struktur, CLI-Output-Format sind Architektur-/Implementierungs-Entscheidungen.
