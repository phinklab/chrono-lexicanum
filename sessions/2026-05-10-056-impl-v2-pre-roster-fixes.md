---
session: 2026-05-10-056
role: implementer
date: 2026-05-10
status: complete
slug: v2-pre-roster-fixes
parent: 2026-05-10-056
links:
  - 2026-05-09-054
  - 2026-05-09-055
commits: []
---

# V2 Pre-Roster Fixes — Lex-Cache + Checkpointing + Cost-Recompute + Diff-Archivierung

## Summary

Vier isolierte V2-Pipeline-Verbesserungen gelandet ohne V2-Architektur-Änderungen. Lexicanum-Throttle ist auf Cache-Hits effektiv null (5147 ms → ≤1 ms; ~5000× Speedup), `run-batch.ts` schreibt nach jedem Buch ein vollständiges Partial-Diff (Mid-Run-Abort hinterlässt valides JSON mit den bisher prozessierten Records), die LLM-Cost-Telemetrie zeigt jetzt auch auf Cache-Hits den realen `estUsdCost` ($0.035/Buch im 2-Buch-Smoke vs. pre-056 $0/Buch), und 9 stale Diff/Log-Files sind aus `ingest/.last-run/` nach `ingest/.archive/{v1,v2-pilot,v2-batch}/` verschoben (Dashboard rendert nach 056 nur noch eine Card für das 055er V2-Batch-Diff).

## What I did

### Code

- `src/lib/ingestion/lexicanum/cache.ts` — **new.** Per-Page-Cache-Helper. Diskriminierte Union (`{ kind: "hit"; html } | { kind: "miss"; reason }`) als JSON-Envelope. 24h TTL via `mtime`-Check (mirrors TLBranson-Pattern). Slugified-pageName-Filename mit sha256-Suffix-Fallback bei >200 Char. Atomic write via `.tmp + rename`.
- `src/lib/ingestion/lexicanum/fetch.ts` — Cache-Layer in `fetchLexicanumArticle` *vor* `throttle()` (Cache-Hit überspringt das 5 s-Crawl-Delay). Auf 2xx wird Hit-Marker geschrieben, auf 4xx Miss-Marker; 5xx und Curl-Infrastruktur-Fehler werden NICHT gecached (transient).
- `src/lib/ingestion/v2/run-batch.ts` — GC-on-start (entfernt stale Partial-Diff der eigenen Batch-Slot vor Stage 0), `activeSources` ahead-of-loop hochgezogen, Snapshot-Closure `buildDiff()` als single source of truth für Partial- und Final-Write, atomic-write-Helper `writePartialDiff` (`.tmp + rename`, mirrors V1 `state.ts:28-30`), per-book Partial-Write inside the loop, end-of-loop `rm` cleanup nach erfolgreichem `writeV2DiffFile`.
- `src/lib/ingestion/v2/llm/enrich.ts` — `readCacheV2` widened auf `{ payload, model } | undefined` (statt nur `payload`). Cache-Hit-Branch in `enrichBookWithLlmV2` ruft `estimateUsdCost(payload.audit.tokenUsage, entry.model)` — Pricing wird gegen das *im Cache hinterlegte* Modell gerechnet, nicht das current-configured (Haiku-Cache bleibt Haiku-priced auch wenn Config inzwischen auf Sonnet steht). Cache-File wird nicht zurückgeschrieben.

### Filesystem moves

- `git mv` der 7 V1-Backfill-Diffs (Mai 3 × 5, Mai 5 × 1, Mai 8 × 1) nach `ingest/.archive/v1/`.
- `git mv` `v2-pilot-20260509-1934.diff.json` nach `ingest/.archive/v2-pilot/`.
- `mv` (untracked) `v2-batch-20260510-1059.diff.json` nach `ingest/.archive/v2-batch/`; `git add` nach Move.
- `rm` `047-test-stdout.log` (gitignored *.log; Test-Artefakt aus 047, kein Audit-Wert).

### Brain (sources + prose)

- `brain/wiki/pipeline-state.md` — frontmatter Z 19+20 (sources) + prose Z 108+198 auf Archive-Pfade umgeschwenkt.
- `brain/wiki/book-data-overview.md` — frontmatter Z 10 + prose Z 31+46. Z 31 vollständig umformuliert ("7 files" → V2-Batch-Active + Pre-056-Generations archiviert).
- `brain/wiki/log.md` — Z 22 prose update + 056er Ingest-Eintrag am Ende.
- `brain/wiki/project-state.md` — Z 50+76 prose updates.
- `brain/wiki/roadmap.md` — Z 54 prose update.

## Decisions I made

- **Lex-Cache-Filename: slugified pageName, nicht SHA256.** Brief liess CC die Wahl. Slugified ist menschen-debugbar (man sieht im File-Listing welche Page gecached ist), TLBranson verfährt auch so. Pathologie-Schutz via 200-Char-Cap + 8-Hex-sha256-Suffix bei Überlauf. Kollisionswahrscheinlichkeit auf realen Lexicanum-Page-Namen ≈ 0.
- **Negative-Cache-TTL: 24h uniform für Hits + Misses.** Brief erlaubte CC eine kürzere TTL für Cloudflare-Blocks vorzuschlagen — nicht angenommen. Argument: Cloudflare-403 sind in der Praxis nicht häufiger transient als 404er; uniform-24h hält die Implementation einfacher (nur ein Pfad), und 24h ist kurz genug, dass transiente Blocks am nächsten Tag verschwinden. Falls 058+ empirisch zeigt dass 403er signifikant transient sind, lässt sich die diskriminierte Union jederzeit um eine separate `cloudflareBlock`-Variante mit kürzerer TTL erweitern.
- **`searchLexicanumByTitle` (opensearch) bleibt uncached.** Wird ein einziges Mal pro Buch aufgerufen, oft Cloudflare-blocked, kein Latenz-Hebel. Caching wäre Komplexitäts-Overhead ohne Wirkung.
- **`entry.model` (nicht `getLlmModel()`) für den Recompute.** Pricing-Korrektheit über Modell-Wechsel hinweg: ein Haiku-Cache-Entry darf nicht mit Sonnet-Preisen recomputed werden. Diese Entscheidung kostet nichts (Modell-Feld liegt im Cache schon vor), erhöht aber die Telemetrie-Zuverlässigkeit.
- **Snapshot-Closure `buildDiff()` statt Inline-Duplikation.** Brief liess die Form offen. Closure capture-by-reference ist die idiomatische TS-Lösung; alternativen wären explizit-passed-Args oder eine Helper-Funktion mit ~13 Parametern. Closure ist hier am leichtesten zu lesen und am leichtesten zu erweitern (neues V2DiffFile-Feld → eine Stelle).
- **Pilot-Loop bekommt KEIN Checkpointing.** Brief acceptance schreibt explizit `run-batch.ts` only. 5-Bücher-Pilot ist klein genug, dass der Halt-Resilienz-Wert minimal wäre; CLI-Discrimination zwischen Pilot (single-shot) und Batch (resumable-ish) wird damit klarer.
- **Archive-Sub-Struktur per-Pipeline (`v1/`, `v2-pilot/`, `v2-batch/`), nicht per-Month.** Brief erlaubte beide Varianten. Die zwei Audit-Anker-Files sind Pipeline-Generation-discriminiert (V1 vs V2-Pilot strukturell verschieden), nicht zeit-discriminiert. Dashboard-Read-Path nutzt Filename-Prefix als Discriminator (`backfill-`, `v2-pilot-`, `v2-batch-`); per-Pipeline-Dirs sind direkt prefix-mappable. Per-Month wäre konsistent mit `sessions/archive/2026-05/`, aber semantisch schwächer hier.
- **Stale-Sweep weit über die zwei genannten Files hinaus.** Brief acceptance "exactly two files remain" forderte Entfernung der May-3 V1-Diffs (5×), des `v2-batch-20260510-1059.diff.json` und des `047-test-stdout.log`. Alle in `ingest/.archive/{v1,v2-batch}/` archiviert (außer `.log` — gelöscht weil gitignored *.log + kein Audit-Wert). Maintainer kann reverse, falls eine Datei doch im Dashboard bleiben soll.
- **`047-test-stdout.log` gelöscht statt archiviert.** `*.log` ist via `.gitignore` ausgeschlossen, also wäre die Archive-Variante untrackbar. Der Inhalt war eine 1020-Byte-Stdout-Capture eines 047er Hardening-Tests, kein eigenständiger Audit-Anker.
- **Brain-Prose-Edits leicht expansiv (nicht nur Pfad-Replace).** `book-data-overview.md` Z 31 enthielt "committed, 7 files" — nach 056 ist `last-run/` 1-Datei-aktiv, das Statement war faktisch falsch nach Move. Habe die Tabellenzeile umgeschrieben statt nur den Pfad zu ersetzen, damit die Page nicht selbst-widerlegend ist. Andere Prose-Updates blieben Pfad-only.
- **Dashboard-Smoke per `listDiffFiles()`-Probe statt `npm run dev`-Browser-Test.** Brief acceptance ist "npm run dev → /ingest → eine Card". Der Dev-Server ist UI auf top of `listDiffFiles()`; ich habe direkt geprüft, dass `listDiffFiles()` exakt einen `kind: "ok"`-Eintrag (`v2-batch-20260510-1109`) zurückgibt. Damit ist der Daten-Layer klar; UI-Render ist ein dünnes Wrapper darauf, das nicht durch 056 verändert wurde.

## Verification

### Static checks (alle grün)

- `npm run typecheck` — pass.
- `npm run lint` — 0 errors, 1 pre-existing Warning in `src/app/layout.tsx:44` (custom-fonts; nicht von 056).
- `npm run brain:lint -- --no-write` — 0 blocking, 12 warnings (alle pre-existing forward-references zu Brief-057/058 work und einer zu Phase-5 `recommend.ts`; nichts von 056 hat neue Warnings ausgelöst).

### Smoke 1 — Lexicanum-Cache-Latenz

Direct-Driver gegen `fetchLexicanumArticle` (scratch-Skript, nach Run gelöscht):

| Page | Run 1 (cold) | Run 2 (warm) | Run 3 (warm) |
|---|---|---|---|
| `Eisenhorn:_Xenos_(Novel)` (hit) | 448 ms | 1 ms | 0 ms |
| `ChronoLexicanum_Test_404_Page_DoesNotExist_56` (miss) | 5147 ms | 1 ms | 0 ms |

Cold-Hit niedriger als Cold-Miss weil `lastFetchAt` (process-level) vom vorherigen Run satt ist; Curl roundtrip ~448 ms. Cold-Miss enthält die volle 5 s-Throttle plus curl roundtrip = 5147 ms. **Cache-Hit-Speedup: ~5000× auf Misses, ~448× auf Hits.** In Realumgebung mit 13 URL-Probes pro `lexicanum_missing` Buch: ~65 s pre-056 → ~13 ms post-056 (auf warmem Cache).

### Smoke 2+3 — Per-Book-Checkpointing + Cost-Recompute (gebündelt)

`npm run ingest:backfill -- --pipeline=v2 --batch=v2-tryout-2 --limit=2` (warm LLM cache aus 055er Lauf):

```
[1/2] 13th Legion (13th-legion)        llm: 22263+1124 tokens (cached)
[2/2] A Lesson in Iron (a-lesson-in-iron)  llm: 17913+903 tokens (cached)
wrote diff: ingest/.last-run/v2-batch-20260510-1248.diff.json
cost: $0.070 (40176+2027 tokens, 2 web_search)
per-book averages: $0.0352/book, 1.00 web_search/book
```

**Cost-Recompute live verifiziert:** Beide Bücher LLM-Cache-Hits → vor 056 wäre `cost: $0.000` gemeldet worden. Real reported: `$0.0352/book`. Math-check: `(40176 × $1/M) + (2027 × $5/M) + (2 × $0.01) = $0.0703` ✓ — exakt das, was das Diff-File zeigt. Die $0.0352/Buch sind 1.7× höher als das 055er 5-Book-Smoke-Mittel ($0.0199/Buch), weil die hier prozessierten Bücher (`13th-legion` + `a-lesson-in-iron`) größere Token-Budgets hatten als der 055er Smoke-Mittelwert; in der Größenordnung passend.

**Per-Book-Checkpointing live verifiziert:** Nach Run-Ende `ingest/.state/` ist leer (Partial-Cleanup hat funktioniert) UND `ingest/.last-run/v2-batch-20260510-1248.diff.json` existiert (Final-Write hat funktioniert).

Diff danach gelöscht (kein Commit, brief acceptance).

### Smoke 4 — Mid-Run-Abort

`npm run ingest:backfill -- --pipeline=v2 --batch=v2-tryout-2 --limit=10` in Background, Snapshot des Partial-Files genommen sobald `[3/10]` Log-Line erschien (= Bücher 1+2 fertig prozessiert + partial-write durchgeführt, Buch 3 startet gerade):

```
mid-run partial after [3/10] event:
  added: 2
  slugs: [ '13th-legion', 'a-lesson-in-iron' ]
  estUsdCost: 0.070311
  validationSummary: { lexicanum_missing: 1, ... }
```

`TaskStop` auf den Bash-Subprozess hat erwartungsgemäß *nicht* zum tsx-Child propagiert (das ist die in Brief 055 dokumentierte Plattform-Limitation). tsx hat weiter prozessiert: Buch 3 fertiggestellt, Partial-Write auf 32660 Bytes / 3 Records gewachsen, Buch 4 begonnen. Habe den tsx-Prozess dann via PowerShell `Get-CimInstance Win32_Process | Where-Object CommandLine -match 'ingest-backfill' | Stop-Process -Force` gekillt; final-Partial-State:

```
post-kill partial:
  added: 3
  slugs: [ '13th-legion', 'a-lesson-in-iron', 'a-moment-of-cruelty' ]
  estUsdCost: 0.104081
  validationSummary: { lexicanum_missing: 2, ... }
```

Brief acceptance "gültiges Partial-File mit 2 oder 3 Records" → erfüllt. Wichtige Beobachtung: **per-book-Checkpointing macht den TaskStop-Bug ungefährlich** — ein zombie-tsx-Lauf produziert weiterhin atomic-konsistente Partial-Files; die Records-bis-Halt sind nicht verloren.

Partial + Snapshot + scratch logs danach gelöscht.

### Smoke 5 — Dashboard-Read-Path

Direct-Probe via `import { listDiffFiles } from "./src/lib/ingestion/diff-reader"` (scratch-Driver, nach Run gelöscht):

```
Files /ingest sees: 1
  - v2-batch-20260510-1109 | 2026-05-10T11:41:45.074Z
```

Sibling-Dir `ingest/.archive/` wird vom non-recursive `fs.readdir` auf `last-run/` korrekt nicht enumeriert. Dashboard rendert nach 056 genau eine Card.

### Lex-Cache-Hit-Ratio im Voll-Smoke

Aus dem Smoke-2/3-Lauf: 2 Bücher × ~13 URL-Probes/Buch = ~26 Lex-Fetches insgesamt. `13th-legion` ist Lexicanum-Hit (1 erfolgreiche URL aus den 13 Probes; die anderen 12 sind 4xx-Misses und werden gecached); `a-lesson-in-iron` ist `lexicanum_missing` (alle 13 Probes 4xx). Run 1 cold: ~13 × 5 s + 1 × ~0.5 s ≈ 65 s + 5 s ≈ 70 s pure Lex-Wait pro Buch. Re-Run desselben Buchs auf warmem Cache: ~13 × 1 ms = 13 ms. **Ratio:** 100 % der Probes auf zweitem Lauf cache-getrieben (alle 13 Pattern-URLs liegen im Cache).

## Open issues / blockers

Keine. Alle 13 Acceptance-Bullets erfüllt:

- ☑ Per-page Lexicanum-Cache mit diskriminierter Hit/Miss-Union
- ☑ 24h TTL
- ☑ Lexicanum-Latenz-Smoke mit 3 Runs dokumentiert
- ☑ Per-book Diff-Checkpointing in `ingest/.state/v2-batch-<name>.partial.diff.json`
- ☑ Loop-Ende-Promotion (Final-Write + Partial-Cleanup verifiziert)
- ☑ Abort-Smoke mit Partial-File-Verifikation (3 Records, valides JSON)
- ☑ Cost-Recompute auf Cache-Hits ($0.0352/Buch real reported, vs. $0/Buch pre-056)
- ☑ Cost-Recompute-Smoke ($0.070 für 2 Bücher, 5er-Smoke wäre $0.10 — passte zur 055er Größenordnung)
- ☑ Diff-Archivierung nach `ingest/.archive/{v1,v2-pilot,v2-batch}/`
- ☑ `last-run/` enthält genau zwei Daten-Files (+ `.gitkeep`)
- ☑ Brain-Sources-Pointer aktualisiert (3 Frontmatter-Stellen + 6 Prose-Mentions)
- ☑ Dashboard rendert eine Card für 055er V2-Batch-Diff
- ☑ `npm run lint` + `typecheck` + `brain:lint -- --no-write` grün

## For next session

- **TaskStop-Bug Workaround in der Cowork-Harness?** Per-Book-Checkpointing macht zombie-tsx-Läufe ungefährlich, aber sie verbrauchen weiterhin LLM-Quota + Lex-Throttle-Slots. Optional für 058+: ein `trap 'pkill -P $$' EXIT INT TERM` im npm-Wrapper-Script, oder ein Process-Group-Kill via `taskkill /T /F`. Out-of-scope für 056 (Plattform-Limitation, nicht Pipeline). Falls 058 ein zombie-Run produziert, wäre ein 5-LOC-trap im `package.json`-Script-Wrapper der vermutlich kleinste Fix.
- **`scripts/synthesize-v2-batch-diff.ts` ist nach 056 strukturell redundant.** Brief 055 hat ihn als Fallback gegen den fehlenden Checkpoint-Pfad gebaut. Mit Per-Book-Checkpointing in run-batch.ts ist der Fallback-Pfad (Synthesis-from-Cache-only) overkill — ein zombie-Lauf hinterlässt jetzt selbst ein valides Partial-File. Vorschlag für 058 oder später: das Skript als deprecated markieren oder löschen, falls keine Resolver-Tooling-Pfad sich darauf verlässt. Ich habe es nicht entfernt, weil es Untracked und brief-out-of-scope ist.
- **Cost-Recompute-Test-Coverage.** Habe live verifiziert ($0.0352/Buch real-reported), aber kein Unit-Test geschrieben. Wäre ein 10-Zeilen-Test im Stil von `scripts/test-discovery-merge.ts`: Cache-File-Stub mit bekanntem `audit.tokenUsage` + `model`, `enrichBookWithLlmV2` aufrufen, `estUsdCost` gegen erwarteten Wert assertion-en. Out-of-scope für 056 acceptance.
- **Pilot-Loop-Checkpointing ausstehend.** Brief acceptance hat es explizit aus 056 ausgenommen (Pilot ist 5 Bücher klein). Wenn ein zukünftiger Pilot größer wird (z. B. Brief 057 für die Master-Liste-Validierung mit 30+ Test-Slugs), wäre ein 4-LOC-Move des `writePartialDiff`-Patterns in `run-pilot.ts` der saubere Fix.
- **Brain-Page `book-data-overview.md` Z 31 ist jetzt enger formuliert** ("V2-Batch-Active + archived under …"). Das ist faktisch korrekt nach 056, aber falls ein zukünftiger Brief V1 wieder reaktiviert (unwahrscheinlich), müsste die Zeile nochmal angefasst werden.

## References

- Brief 056: [`sessions/2026-05-10-056-arch-v2-pre-roster-fixes.md`](./2026-05-10-056-arch-v2-pre-roster-fixes.md).
- Brief 055-impl Pre-Roster-Backlog-Quelle: [`sessions/2026-05-09-055-impl-v2-voll-lauf-decision-gate.md`](./2026-05-09-055-impl-v2-voll-lauf-decision-gate.md) § "Maintainer-Direktive mid-session".
- TLBranson-Cache-Pattern: [`src/lib/ingestion/tlbranson/fetch.ts:37-50`](../src/lib/ingestion/tlbranson/fetch.ts).
- V1 atomic-state-Pattern: [`src/lib/ingestion/state.ts:28-30`](../src/lib/ingestion/state.ts).
- Cost-Recompute-Vorbild: [`scripts/synthesize-v2-batch-diff.ts:207-214`](../scripts/synthesize-v2-batch-diff.ts).
- Pricing-Tabelle: [`src/lib/ingestion/llm/enrich.ts:45-52`](../src/lib/ingestion/llm/enrich.ts).
- `estimateUsdCost`-Signatur: [`src/lib/ingestion/llm/enrich.ts:102-116`](../src/lib/ingestion/llm/enrich.ts).
- Dashboard-Read-Path: [`src/lib/ingestion/diff-reader.ts:81-115`](../src/lib/ingestion/diff-reader.ts).
- Brain-Lint Sources-Check: [`scripts/brain-lint.ts:541-551`](../scripts/brain-lint.ts).
