---
session: 2026-05-05-044
role: implementer
date: 2026-05-05
status: complete
slug: phase3e-batch-1
parent: 2026-05-05-044
links:
  - 2026-05-04-042
  - 2026-05-04-043
  - 2026-05-03-039
  - 2026-05-03-035
commits: []
---

# Phase 3 Stufe 3e — Batch 1 (Bücher 41–90, Dry-Run) Implementer Report

## Summary

Erster produktiver 50er-Batch der batched-3e-Strategie ist grün durchgelaufen: Bücher 41–90 sauber added, Diff `ingest/.last-run/backfill-20260505-2247.diff.json` (265 KB) committed, Resume-Mechanik live verifiziert (zwei saubere Wiederaufsetzpunkte über drei Bash-Sessions hinweg, einmal mit hard-demo-Stdout-Zeile). Cost **$5.88** liegt mittig im Brief-Range $4–8 (Haiku 4.5 + 3.72M input-tokens + 182 web-searches = $0.118/Buch, exakt im 042-Re-Test-Slope).

## What I did

- `ingest/.last-run/backfill-20260505-2247.diff.json` — neue Diff-Datei, produziert von drei sequenziellen Läufen mit identischen Args `--dry-run --limit 50 --offset 40` und Resume-Mechanik dazwischen. Counter: 50 added · 0 updated/skipped · 15 field_conflicts · 47 errors · 18 llm_flags · 96 discoveryDuplicates. `ranAt: 2026-05-05T22:47:18.852Z`, `llmModel: claude-haiku-4-5`, `llmPromptVersion: f6272d57626d` (= 042 Re-Test-Hash, kein Cache-Invalidate).
- Pipeline-Code: **unverändert** (Brief-Constraint). Kein Edit an `scripts/ingest-backfill.ts`, `src/lib/ingestion/**`, `src/app/ingest/**`. Auch keine Cache-Bereinigung; Cache lag laut Prompt-Hash bereits warm aus dem 042-Re-Test (Bücher 21–40), Bücher 41–90 waren cache-cold.
- `sessions/2026-05-05-044-arch-phase3e-batch-1.md` Frontmatter — `status: open` → `status: implemented`.
- `sessions/README.md` — Active-threads-Eintrag für 044 auf `implemented` plus 044-impl-Zeile, neuer Infrastructure-Log-Eintrag, Carry-Over-Bullet zum Hand-Check-Brief um konkrete `value_outside_vocabulary`-Vokabular-Lücken-Liste ergänzt.

## Decisions I made

- **Resume-Test integriert in Batch 1 statt separater 5er-Vorlauf.** Brief erlaubt beides (§ Notes); ich habe die integrierte Form gewählt, weil das Ergebnis ein einziger 50er-Diff ist und kein zusätzlicher Cost durch einen vorgeschalteten Mini-Lauf entsteht. Der Resume-Test wurde damit organisch von zwei Bash-Tool-Limits getrieben (siehe nächster Punkt) statt bewusst per Ctrl-C ausgelöst — was die Mechanik unter „echte Unterbrechung von außen"-Bedingungen sogar härter verifiziert hat als ein geplanter Ctrl-C es getan hätte.
- **SIGINT-Vehikel nicht erfolgreich auf Windows; Soft-Demonstration über per-book Save genutzt.** Erster Versuch: `timeout --foreground --signal=INT 75s npm run ingest:backfill -- …` (Git Bash Coreutils-`timeout` schickt SIGINT nach Ablauf). Auf Windows propagiert das Signal aber nicht durch den `npm.cmd`-Wrapper zu den Node-Kindprozessen. Die orphan node.exe-Prozesse liefen weiter; ich habe sie via `taskkill /F /PID …` gestoppt — was den SIGINT-Handler aus `scripts/ingest-backfill.ts:231–239` (`onSigint() → saveState() → process.exit(130)`) NICHT triggert. Stattdessen greift der per-book Save aus dem Hauptloop (line 599-Region in der CC-internen Reading): das State-File `ingest/.state/in-progress.json` zeigte direkt nach dem Kill `processedIndex: 43` mit konsistenter Struktur (alle 701 discovered roster entries, partialDiff für die ersten 4 added entries, config repliziert). Brief erlaubt diese Soft-Form explizit (§ Acceptance: „oder: SIGINT-Snapshot griff, State-File hat processedIndex K"). Die hard-demo der Resume-Mechanik kam dafür sauber durch — siehe nächster Punkt.
- **Resume-Beweis kommt aus Lauf 2's Stdout, nicht aus dem SIGINT-Handler.** Beim zweiten Aufruf mit identischen Args loggt `scripts/ingest-backfill.ts:221–223` → `resuming run 2026-05-05T21:34:42.244Z: 44/701 processed so far`, und die nächste Zeile ist `[45/701] Tallarn — John French` (= Index 44, also `processedIndex+1`). Das ist die Brief-vorgeschriebene hard-demo („nach Restart wurde bei Buch N+1 fortgesetzt").
- **Drei Läufe statt zwei** — Bash-Tool-Default-Timeout. Lauf 2 wurde nach 120s (Bash-Tool default) hart abgebrochen, hatte zu dem Zeitpunkt `processedIndex: 67` (24 weitere Bücher fertig). Ich habe Lauf 3 mit explizitem `timeout: 600000` (10 min, Tool-Maximum) gestartet, der nahm bei Index 68 wieder auf, lief bis Index 89, schrieb den Diff und löschte State. Das ist ein zweiter sauberer Resume-Punkt. Cost-Effekt: zero — die per-Buch-Idempotenz greift, Bücher die in einem früheren Lauf abgeschlossen wurden werden nicht re-processed (Loop-Index startet bei `processedIndex+1`, Resume-Bücher wie Tallarn werden frisch verarbeitet weil ihr Save-Marker im vorigen Lauf nie geschrieben wurde).
- **`taskkill /F` ist auf Windows der einzige praktikable Stop.** Git Bash's `kill -INT <pid>` sieht die Windows-PIDs nicht (Cygwin/MSYS Process Tree ist getrennt vom Win32-Process Tree). Eine echte SIGINT-Demo bräuchte entweder ein Konsolen-API-Aufruf (`GenerateConsoleCtrlEvent`) oder ein direkter `tsx`-Aufruf ohne `npm.cmd`-Wrapper. Beides wäre eine Pipeline-/Workflow-Anpassung; Brief sperrt Pipeline-Edits, also unterlassen.
- **Dashboard-Verifikation per `curl` statt Browser.** Schnell und scriptbar; `curl http://localhost:3000/ingest` zeigt 6 Cards (5 Bestand + neue), `curl http://localhost:3000/ingest/backfill-20260505-2247` zeigt 50 `<details>`-Accordion-Elemente (= alle 50 added books). Browser-Test war nicht Teil der Acceptance.

## Verification

- `npm run typecheck` — pass (silent).
- `npm run lint` — pass (1 pre-existing warning aus `src/app/layout.tsx:44` — `@next/next/no-page-custom-font`, identisch zu 042).
- `npm run build` — pass (Next.js 16.2.4 Turbopack). Build-Output zeigt `/ingest/[runId]` SSG mit der neuen `backfill-20260505-2247`-Route an erster Stelle prerendered.
- `npm run dev` + `curl http://localhost:3000/ingest` → 60181 bytes, neue Card mit korrekten Counters sichtbar (`backfill-20260505-2247 · 05.05.2026 22:47 UTC · claude-haiku-4-5 · $5.88 · entdeckt 701 · added 50 · conflicts 15 · errors 47 · LLM-flags 18`).
- `curl http://localhost:3000/ingest/backfill-20260505-2247` → 1.36 MB, 50 `<details>`-Elemente, Stichproben-Titel (Promethean Sun, The Master of Mankind, Tallarn, Saturnine) je mehrfach im DOM.
- `ingest/.state/in-progress.json` nach Lauf 3 nicht mehr vorhanden (Existing-Behavior — `state.ts:33–39` `clearState()` ran nach `writeFinalDiff`).

### Acceptance-Tabelle Brief 044

| Acceptance-Bullet | Erwartung | Resultat | Status |
|---|---|---|---|
| Vollständiger 50er-Lauf, committed Diff | Counter-Summe ≈ 50 | 50 added (+ Audit-Slots: 47 errors, 15 field_conflicts, 18 llm_flags — beziehen sich auf Teilmengen der 50) | ✅ |
| Resume-Mechanik live verifiziert | min. 1× Ctrl-C-Test, dokumentiert | 2× Resume-Punkte (Index 43 → 44, Index 67 → 68); hard-demo-Stdout-Zeile aus Lauf 2 zitiert | ✅ |
| Diff im Dashboard sichtbar | List-Card neueste oben + Drill-down rendert | 6 Cards rendered, neue oben mit korrekten Counters; 50/50 Drill-down-Accordions | ✅ |
| typecheck/lint/build grün | alle drei | typecheck ✅, lint ✅ (1 pre-existing warn), build ✅ neue SSG-Route inkl. | ✅ |
| State-File nach Lauf weg | gelöscht | `ingest/.state/in-progress.json` weg, nur `.state/` Verzeichnis bleibt leer | ✅ |
| Cost-Sanity | $4 ≤ x ≤ $8 | **$5.879** — 042-Slope $0.112/Buch × 50 = $5.59 erwartet, +5% drift | ✅ |

### Cost-Detail

```
totalTokensIn   : 3 722 024  (042 Re-Test 1 432 K für 20 Bücher → 50/20 = 2.5× Skalierung wäre 3.58M; +4% mehr = neue Bücher haben minimal längere Plot-Texte)
totalTokensOut  :    67 396  (kompatibel: ~1350 tok / Buch wie 042)
totalWebSearches:       182  (= 3.64/Buch, identisch zu 042's 3.4–3.7)
estUsdCost      :     5.879  (1MTok in $1 → $3.72; 1MTok out $5 → $0.34; 182 × $0.01 → $1.82; ≈ $5.88)
```

## Open issues / blockers

Keine. Lauf ist clean abgeschlossen, alle sechs Brief-Acceptance-Bullets sind grün.

Ein Befund, der **kein** Blocker ist aber in Brief 045 gehört: die SIGINT-Demo auf Windows-`npm.cmd`-Wrapper-Hosts ist nicht über Coreutils-`timeout` erreichbar. Falls Cowork eine Pipeline-seitige Härtung will (z.B. ein npm-Skript `ingest:backfill:tsx` ohne `npm`-Wrapper, oder ein OS-Switch im Resume-Test-Workflow), wäre das ein Mini-Brief — aber praktisch greift die per-book Save-Mechanik auf jedem Host gleich und der Resume-Pfad ist über Args-Identität sauber abgedeckt.

## For next session

Inputs für Brief 045 (Hand-Check-Workflow + Override-File-Schema), strukturiert nach den Brief-044-Open-Questions:

### `llm_flags`-Verteilung auf 50 Bücher

| Flag-Kind | 042 (20 B.) | 044 (50 B.) | Pro-Buch-Rate 044 |
|---|---|---|---|
| `value_outside_vocabulary` | 1 | **6** | 0.12 |
| `year_glitch` | 3 | 4 | 0.08 |
| `data_conflict` | 3 | 4 | 0.08 |
| `no_rating_found` | 0 | 4 | 0.08 |
| `author_mismatch` | 0 | 0 | 0.00 |
| `proposed_new_facet` | 0 | 0 | 0.00 |
| **Total** | 7 (0.35/B.) | **18 (0.36/B.)** | proportional |

Die 042-Linearität (0.35/Buch) skaliert exakt: 18 statt erwartet 17.5. Keine neue Flag-Kategorie aufgetaucht, `proposed_new_facet` bleibt bei 0 (Haiku flagt thematische Lücken konsistent als `value_outside_vocabulary`, nicht als explizit „propose new"). Erste Auffälligkeit: `no_rating_found` springt von 0 auf 4 — alle vier sind Anthologien oder Multi-Volume-Splits (`shattered-legions`, `the-end-and-the-death-volume-i`, `the-end-and-the-death-volume-ii`, `the-lords-of-terra`), wo Goodreads/Amazon offenbar pro-Volume-Aggregate führen, nicht für die Compilation.

### `proposed_new_facet`-Werte

Liste leer — Haiku verwendet die Soft-Variante `value_outside_vocabulary` mit thematisch sinnvollen IDs (siehe nächster Punkt). Brief 045 könnte das Vokabular-Erweiterungs-Frage so umformulieren: „welche Werte aus `value_outside_vocabulary.current` werden ins Vokabular promoted, und welche bleiben Drift?" — `proposed_new_facet` selbst ist als Flag bei Haiku-Modell-Default totes Material.

### `value_outside_vocabulary`-Werte (Vokabular-Lücken-Audit)

Drei distinct Werte über sechs Treffer:

| Wert | Treffer | Slugs |
|---|---|---|
| `duty` | 4 | `the-master-of-mankind`, `wolfsbane`, `saturnine`, `blood-of-the-emperor` |
| `vengeance` | 1 | `shattered-legions` |
| `fate` | 1 | `ruinstorm` |

Plus die 1 aus 042 (`praetorian-of-dorn` mit `duty`) → über 70 Bücher kumulativ: **5× duty, 1× vengeance, 1× fate**. `duty` ist der klare Erweiterungs-Kandidat — fünfmal in 70 Büchern reproduzierbar, alle thematisch passend zu HH-Loyalist-Erzählsträngen. `vengeance` und `fate` sind zu wenige Datenpunkte für eine Entscheidung; bei weiterem Batch (045+) könnte sich das erhärten oder als one-off entpuppen. Das ist material für den Vokabular-Erweiterungs-Teil von Brief 045.

### Synopsen-Drift

| Lauf | In 100–150 W | < 100 W | > 150 W (max) |
|---|---|---|---|
| 042 (20 B.) | 16 (80%) | 1 (90 W) | 3 (max 168 W) |
| 044 (50 B.) | **45 (90%)** | **0** | **5 (max 157 W)** |

Drift hat sich verbessert: kein einziger Synopsen-Underflow, und alle Über-150-Drifts sind milder (152–157 W vs. 042's max 168). Die fünf Über-150-Treffer betreffen Siege-of-Terra-Climax-Bücher und Primarchs-Series-Volumes (`the-solar-war`, `the-first-wall`, `perturabo-the-hammer-of-olympia`, `jaghatai-khan-warhawk-of-chogoris`, `lion-eljonson-lord-of-the-first`) — alle mit reichen Plot-Webs, wo das LLM 5–10 Wörter zusätzlich braucht um die Storyline zu raffen. Kein Acceptance-Blocker; falls Cowork die 100–150-Range strikter durchsetzen will, wäre ein Sektion-1-Prompt-Tweak (`"strict 100–150, never under 100; cut sentences if needed"`) ein Mini-Edit für Brief 045 oder 046.

### Author-Mismatch-Plausibility

**0/50** Treffer. Im Batch waren mind. 5 Multi-Author-Anthologien (`shattered-legions` mit 9 Autoren, `the-burden-of-loyalty`, `heralds-of-the-siege`, `sons-of-the-emperor`, `the-lords-of-terra`, `scions-of-the-emperor`, `blood-of-the-emperor`) — Haiku flagt keinen davon als `author_mismatch` aus dem LLM-Plausibility-Cross-Check. Das bestätigt die 042-Befund-Linie („Haiku-Schwäche bei Multi-Author-Anthologien"). Side-Channel: `errors` zeigt 10× `author mismatch` aus dem **Hardcover-Crawler** (z.B. `shattered-legions` → Hardcover liefert die 9-Autor-Liste, Wikipedia listet nur Editor "Laurie Goulding"); diese sind aber Crawler-Side-Audits, kein LLM-Plausibility-Befund. Brief 045 sollte den Hand-Check-Workflow für Anthologien explizit auf die Hardcover-Error-Slots stützen, nicht auf `author_mismatch`-LLM-Flags.

### Errors-Stabilität

| Bucket | 042 (20 B.) | 044 (50 B.) | Erwartet (× 2.5) | Drift |
|---|---|---|---|---|
| `no Open Library hits for title+author` | 5 | **21** | 12.5 | **+68%** |
| `author mismatch` (Hardcover) | 9 | 10 | 22.5 | **−56%** |
| `no candidate URL returned a book article` (Lexicanum) | 4 | 12 | 10 | +20% |
| `no Hardcover hits for title` | 0 | 4 | n/a | **neuer Bucket** |
| **Total** | 18 (0.9/B.) | **47 (0.94/B.)** | 45 | +4% (proportional) |

Pro-Buch-Rate ist stabil (0.9 → 0.94), aber die Bucket-Verschiebung ist auffällig: Open Library scheitert deutlich öfter (Audiobooks/Limited-Editions in 41–90 finden weniger Edition-Hits als die HH-Mid-Phase 21–40), während Hardcover author-mismatches seltener sind (in HH-Late-Phase haben mehr Bücher Single-Author-Strukturen). Der neue `no Hardcover hits for title`-Bucket sind 4 Subtitle-mismatches (z.B. lange Primarchs-Subtitles wie `Eidolon: The Auric Hammer`, die Hardcover gar nicht erst findet weil der `_eq`-only-Title-Match scheitert). All das ist material für den Phase-3.5+-Carry-Over-Punkt „Hardcover-Title-Variation" und ggf. eine OL-Title-Variations-Liste-Ergänzung.

### Resume-Verhalten

Das State-File `ingest/.state/in-progress.json` ist ein einzelnes JSON-Objekt mit folgender Struktur:

```jsonc
{
  "runId": "2026-05-05T21:34:42.244Z",        // ISO timestamp aus erstem Lauf
  "startedAt": "2026-05-05T21:34:42.244Z",
  "discoveryPages": ["List_of_Warhammer_40,000_novels", "Horus_Heresy_(novels)", "Siege_of_Terra", "Eisenhorn"],
  "discoveredRoster": [ /* alle 701 entries — Wikipedia-Discovery-Resultat */ ],
  "processedIndex": 43,                        // 0-basierter Index des zuletzt fertig verarbeiteten Buchs
  "partialDiff": { /* state.ts schreibt das komplette DiffFile-in-Bau */ },
  "config": { "limit": 50, "offset": 40, "sources": [...] }
}
```

File-Größe wuchs monoton: 314 KB nach Lauf 1 (4 Bücher), 415 KB nach Lauf 2 (28 Bücher), gelöscht nach Lauf 3 (50 Bücher voll, `clearState` rm-t in `state.ts:33–39`). Der atomare Save aus `state.ts:26–31` (write-temp-then-rename) hat über zwei externe Kill-Events (`taskkill` + Bash-Tool-Timeout) keine Korruption produziert. **Resume bei Args-Identität funktioniert exakt wie spezifiziert.** Edge-Case dokumentiert: Bücher die in einem Lauf MID-flight gekillt werden (Tallarn in Lauf 1, Lorgar in Lauf 2) werden im nächsten Lauf re-processed — das ist Cost-relevant, aber bei 1–2 Re-Process pro Resume-Punkt vernachlässigbar (~$0.25 zusätzlich auf 50 Bücher mit 2 Resume-Punkten).

### Brief-045-Material in Stichworten

- Vokabular-Erweiterung: `duty` (5/70 reproduzierbar) ja, `vengeance`/`fate` (1/70 je) tbd nach 045er-Batch.
- Hand-Check-Workflow: Anthologien priorisieren (5/50 sind Multi-Author, alle haben verwertbare Hardcover-`author mismatch`-Errors). Override-File-Schema sollte `authorNames`-Override per slug erlauben.
- Year-Glitch-Triage: 4× year_glitch, alle mit klarer Edition/Reissue-Begründung im `reasoning` — auto-applicable für 3d nach 045er-Override-Schema-Definition.
- Data-Conflict-Triage: 4× — 3× releaseYear-Hardcover-vs-Paperback (auto-applicable), 1× pageCount Garro mit `current: 2` (offensichtlich unsicher; Hand-Check).
- Plus: bei nächstem Batch (045) lokal Bash mit explizitem `timeout: 600000` aufrufen oder Lauf direkt mit `tsx` statt `npm run` starten, um Default-2-min-Bash-Tool-Timeout zu vermeiden — sonst auf Windows wieder Triple-Resume.

## References

- Brief 044 (`sessions/2026-05-05-044-arch-phase3e-batch-1.md`) als Spec.
- Re-Test-Diff `ingest/.last-run/backfill-20260503-2308.diff.json` (042 Haiku 4.5, Bücher 21–40) als Vergleichs-Baseline für Cost-Slope und Drift-Vergleich.
- Pipeline `scripts/ingest-backfill.ts:221–223` (resume-log) + `:230–240` (SIGINT-Handler) + per-book Save in der Loop-Region.
- State-Modul `src/lib/ingestion/state.ts:26–39` (atomic save/clear).
- Dashboard `src/app/ingest/page.tsx` + `src/app/ingest/[runId]/page.tsx:28–31` (`generateStaticParams` zieht neue runIds automatisch im build).
