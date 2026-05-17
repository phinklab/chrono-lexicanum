---
session: 2026-05-17-081
role: architect
date: 2026-05-17
status: open
slug: ssot-synopsis-backfill-005-019
parent: 2026-05-17-080-arch-synopsis-guard-and-pilot
links:
  - 2026-05-17-080-arch-synopsis-guard-and-pilot
  - 2026-05-17-080-impl-synopsis-guard-and-pilot
  - 2026-05-11-061-arch-ssot-loop
  - 2026-05-16-077-arch-grand-alignment-junction-hygiene
commits: []
---

# Public-Synopsis-Backfill — Standing /clear-Loop für `ssot-w40k-005..019`

## Goal

Standing-Loop, der die 123 polluted Synopsen aus den Welle-2–Welle-4-Override-Files
(`ssot-w40k-005..019`) gegen den Brief-080-Guard sauber bekommt. Pro `/clear`
genau **ein** Batch: Codex liest den Brief + das Ziel-Override-File + optional
den letzten kompakten Status-Block, rewrittet die treffer-tragenden
`overrides.synopsis`-Strings in Public-Reader-Copy (Voice = Pilot 080, nur
einen Tick saftiger — siehe § Design freedom), re-applied den Batch, hängt
einen kompakten Loop-Log-Block an und stoppt. Maintainer macht `/clear`,
gleicher Eröffnungs-Prompt mit Verweis auf 081, nächster Batch.

15 Iterationen, eine Override-Datei je Iteration. Keine kumulative
Voll-Kontext-Session über alle Synopsen — der Brief 080-Pilot hat empirisch
gezeigt, dass schon 10 Synopsen + Helper-Code + Loop-Log-Append ~110k Tokens
fressen. 15 Batches in einer Sitzung würden ein Mehrfaches davon kosten.
`/clear`-Disziplin ist hier nicht-verhandelbar.

## Design freedom — read before everything else

**Voice ist deine Wahl, kalibriert gegen den Pilot 080.** Maintainer hat
nach dem Pilot signalisiert: Voice grundsätzlich gut, soll aber einen Tick
länger/saftiger sein als der 412–556-Charkorridor von Batch 020. Gleiche
public-reader-copy-Richtung, aber etwas mehr Raum für Hook + Konflikt +
Tonality-Closing. Du wählst pro Buch:

- Premise-erst vs. Setup-erst-Eröffnung — Maintainer-Wahl im Pilot war 6/10
  Premise, 4/10 Setup. Behalte das Verhältnis grob bei oder verschiebe es,
  wenn ein konkretes Buch besser auf dem anderen Bein steht.
- In-Universe-Vokabular-Dichte — Pilot hat „Astartes" / „Arbites" benutzt,
  fachfremde Begriffe wie „Excommunicate Traitoris" einmalig erklärt. Diese
  Linie bleibt das Default — sie liest sich für Reader, ohne die Lore zu
  flattern.
- Tonality-Marker als Prose statt als Audit-Tag — Pilot-Closing-Beispiele:
  „A rare Arbites-led procedural-mystery in a political-thriller key" /
  „a chapter-tragedy of pride, mutation, and the cost of choosing
  rebellion". Mach das.
- Satzrhythmus und Genre-Drift — Necromunda-Hive-Gang-Bücher (016/017/018)
  dürfen knappiger und straßiger klingen als Soul-Drinkers-Tragödien
  (019/020-Cluster); Last-Chancers (019) dürfen härter und ein-/zwei-
  satziger sein als ein Calpurnia-Procedural (020). Konsistenz innerhalb
  eines Buchs ist wichtiger als Konsistenz zwischen Sub-Settings.
- Period-treue Faction-Namen — Pilot hat „Dark Eldar" für 2005er-Bücher
  und „Sisters of Battle" für 2012er-Bücher genommen, weil die
  Black-Library-Copy der jeweiligen Publikationsära das so liest. Behalte
  das Pattern.

**Voice der Loop-Log-Append-Blöcke ist deine Wahl.** Format-Vorschlag in §
Notes; weiche ab, wenn die acht Akzeptanz-Felder pro Block trotzdem
sichtbar sind.

Hart bleiben: die Längenkorridore (siehe § Constraints), die Verboten-
Pattern (durch den Brief-080-Guard sowieso erzwungen), Scope (nur die
treffer-tragenden Bücher in 005..019, kein 020, kein 001..004), **kein
WebSearch**, keine Plot-Erfindung, kein Voll-Read von `ssot-loop-log.md`,
ein Commit pro Batch.

## Context

Brief 080 ist gemerged. Track B (Apply-Layer-Guard, 32 Patterns,
`scripts/apply-override-synopsis-lint.ts`) ist scharf — jeder
`db:apply-override`-Lauf gegen einen Batch mit Hits wirft hart, bevor
irgendetwas in `works.synopsis` geschrieben wird. Track A (Pilot-Rewrite
`ssot-w40k-020.json`) hat 10 Synopsen in Public-Reader-Copy gebracht
(Korridor 412–556 Zeichen, mean 475). Batch 020 ist clean und bleibt
clean.

Forward-Discipline (Brief 061 § Public-Synopsis-Discipline) greift ab
`ssot-w40k-021`. Brief 081 schließt die Backfill-Lücke zwischen
Discipline-Forward-Cutoff und dem heutigen Apply-Layer-enforced
Standard.

**Codex-Datenprüfung (per Maintainer-Brief, 2026-05-17).**
`works.synopsis` wird heute nur gerendert/angezeigt — Buch-Detail-Seite
(`/buch/[slug]`), Katalog-Row, Timeline-Cards, Audit-Cockpit, später
Atlas-Regen. Strukturierte Daten kommen aus `facetIds` / `factions[]` /
`locations[]` / `characters[]` / `flags[]` / `notes`, **nicht** aus der
Synopsis. Kürzen der Synopsis verliert keine Filter-/Resolver-/JSON-LD-
Funktion, nur Public-Prose-Detail. Heißt aber auch: beim Rewrite müssen
die Reader-tragenden Bestandteile der alten Synopsis erhalten bleiben —
Protagonist, Setting, zentraler Konflikt, entscheidende Faction /
Antagonist (wenn in der alten Synopsis vorhanden), Tonality. Nicht „weg
mit allem, was nach Curation klingt" — sondern „raus mit Audit-Tails und
Curation-Vokabular, aber Reader-Kern bleibt".

**Ist-Zustand-Vermessung (Brief-080-impl-Baseline, dry-run-report).** Hits
sind die `test:apply-override-dry`-Treffer pro Batch gegen die 32 Patterns
in `scripts/seed-data/synopsis-banned-patterns.json`:

| Batch | Hits  | Books mit Hits | Anmerkung |
|-------|------:|---------------:|-----------|
| 001..004 | 0   |       0        | clean — out of scope |
| 005   |   1   |       1        | klein, Pilot-Einstieg |
| 006   |   2   |       2        | klein |
| 007   |  31   |       5        | mittel |
| 008   |   7   |       6        | mittel, breit-verteilt |
| 009   |  18   |       9        | quasi voll |
| 010   | 110   |      10        | voll |
| 011   | 243   |      10        | voll |
| 012   | 239   |      10        | voll |
| 013   | 309   |      10        | voll |
| 014   | 321   |      10        | voll |
| 015   | 369   |      10        | voll |
| 016   | 476   |      10        | voll |
| 017   | 350   |      10        | voll |
| 018   | 499   |      10        | voll |
| 019   | 384   |      10        | voll |
| **020** | **0** |     **0**     | Pilot, clean — out of scope |
| **Sum** | **3359** | **123**    | |

123 Bücher in 15 Batches. Welle-2 (005..009) ist klein und dünn-getroffen
— guter Loop-Einstieg, kalibriert Voice + Pacing. Welle-3 (010..015) und
Welle-4 (016..019) sind voll-getroffen und liefern die eigentliche Masse.

**Maintainer-Beobachtung-Vorrang.** Brief 080 § Context-Tabelle hatte
005..008 als clean vermutet; das stimmt nicht (Brief-080-impl hat es
korrigiert). 081 nimmt 005..008 explizit mit auf.

Pfad-Bezüge:

- Override-Files: [`scripts/seed-data/manual-overrides-ssot-w40k-005.json`](../scripts/seed-data/manual-overrides-ssot-w40k-005.json)
  …`-019.json`. Pro Iteration eine Datei.
- Apply-Skript: [`scripts/apply-override.ts`](../scripts/apply-override.ts) (idempotent, schreibt
  `works.synopsis` pro Buch, Guard-Pre-Pass ist scharf).
- Dry-Runner: [`scripts/apply-override-dry.ts`](../scripts/apply-override-dry.ts) (Synopsis-Lint
  report-only — exit 0 auf Hits in nicht-touched-Batches, siehe Brief-080-P1).
- Test-Runner: [`scripts/test-synopsis-lint.ts`](../scripts/test-synopsis-lint.ts) (14 Cases — Pure-Helper-
  Smoke; muss zwischen Iterationen unverändert grün bleiben).
- Pattern-File: [`scripts/seed-data/synopsis-banned-patterns.json`](../scripts/seed-data/synopsis-banned-patterns.json)
  (32 Patterns, Brief 080). Du editierst sie **nicht** — sie ist die
  Wahrheit, die du beim Rewrite respektierst.
- Loop-Log: [`sessions/ssot-loop-log.md`](./ssot-loop-log.md) (~393k chars, niemals voll lesen).
- Pilot-Block im Loop-Log: letzter Block vor diesem Brief, „2026-05-17 ·
  ⏭ Pilot Synopsis-Rewrite ssot-w40k-020 (Brief 080)". Lies *maximal* den
  per `tail -n 200 sessions/ssot-loop-log.md` — wenn du Voice-Referenz
  brauchst, lies stattdessen die rewritteten Synopsen direkt aus
  `ssot-w40k-020.json` (siehe Voice-Korridor-Beispiele in § Notes).

## Constraints

### Loop-Form (Standing-Brief-Disziplin)

- **Genau ein Batch pro `/clear`-Subsession.** Codex liest Brief 081,
  ermittelt die nächste Iteration nach dem Detection-Algorithmus weiter
  unten, produziert die Override-File-Edits + Loop-Log-Append + Commit,
  stoppt. Soll-Reihenfolge: **005 → 006 → 007 → 008 → 009 → 010 → 011 →
  012 → 013 → 014 → 015 → 016 → 017 → 018 → 019**. Klein-zu-groß, weil
  Welle-2 (005..009) leichter ist und Codex damit Voice plus Pacing
  kalibriert, bevor Welle-3/4 die volle Last bringt. Maintainer darf
  pro Eröffnungs-Prompt explizit eine andere Iteration anfordern (siehe
  Detection-Algorithmus Punkt 1).

- **Pro Subsession lesen: Session-Start-Pflichtlektüre (CLAUDE.md +
  Brain-Read-Order pro [`brain/wiki/workflows/cc-session.md`](../brain/wiki/workflows/cc-session.md))
  bleibt unangetastet — das hier ersetzt sie nicht.** Zusätzlich für 081-
  spezifischen Kontext: nur Brief 081 + Ziel-Override-File + den
  letzten kompakten Loop-Log-Tail-Block (`tail -n 200 sessions/ssot-loop-log.md`).
  Kein Voll-Read von `ssot-loop-log.md` (~393k chars). Kein Voll-Read von
  Brief 080 oder Brief 061. Kein Voll-Read von `apply-override.ts` oder
  dem Synopsis-Lint-Helper — alles, was du brauchst, ist in § Constraints
  / § Notes hier oder ergibt sich aus dem Pattern-JSON. Falls du Voice-
  Beispiele in der Quelle willst, lies 2–3 rewrittete Synopsen direkt aus
  `scripts/seed-data/manual-overrides-ssot-w40k-020.json` per `jq`-Filter
  (kein Voll-Read der Datei nötig).

- **Detection-Algorithmus (eindeutig, nicht zwei Varianten).** Codex
  ermittelt die nächste Iteration in **dieser Reihenfolge**:
  1. Wenn der Maintainer in seinem Eröffnungs-Prompt explizit eine Iteration
     nennt („Brief 081, Iteration N" / „Batch ssot-w40k-{NNN}") → das
     gewinnt. Diese Eskalation steht dem Maintainer immer offen, z. B. wenn
     er einen früheren Batch nachschärfen will.
  2. Sonst: Codex liest per `tail -n 200 sessions/ssot-loop-log.md` und
     sucht nach H2-Blöcken der Form
     `## YYYY-MM-DD · 🔄 Synopsis-Rewrite ssot-w40k-{NNN} (Brief 081)`.
     Der höchste schon gemeldete NNN + 1 ist die nächste Iteration. Wenn
     noch keiner gemeldet ist → Iteration 1 = `ssot-w40k-005`. Wenn der
     höchste gemeldete = `019` → Loop ist durch, Codex geht zum Closing-File
     (siehe § Status-Lifecycle).
  3. Die Iter-Tabelle in § Notes ist nur **Soll-Reihenfolge** (klein-zu-groß-
     Rationale) — sie ist nicht der State. State lebt im Loop-Log.

  Hintergrund: alle 15 Override-Files existieren bereits seit Brief 061-Loop
  (sie sind nur intern polluted). File-Existenz allein kann nicht als
  Iterations-Marker dienen.

- **Kein WebSearch.** Wie im Pilot 080: Quelle für jeden Rewrite ist
  ausschließlich die existierende `overrides.synopsis` im File. Plot-Fakten
  stehen schon drin (mit Curation-Chrome drumherum). Keine neuen Plot-
  Fakten erfinden. Wenn dir Details unklar erscheinen — paraphrasieren,
  Detail weglassen, oder mit `low_confidence`-Hinweis im Loop-Log
  vermerken. **WebSearch ist verboten.**

### Scope

- **Touch-Set pro Batch = Bücher mit Guard-Hits.** Default: nur die Bücher
  rewriten, die in der Brief-080-impl-Baseline (siehe Ist-Zustand-Tabelle)
  unter „Books mit Hits" laufen — diese Zahl ist gleichzeitig die Anzahl
  der zu rewrittenden Bücher pro Batch. Konkret: 005 = 1 Buch, 006 = 2,
  007 = 5, 008 = 6, 009 = 9, 010..019 = je 10 (alle voll-getroffen).

- **Bestimmung der Hit-Bücher pro Batch — Pflicht-Pfad ist ein Mini-tsx-
  Aufruf, nicht der Dry-Run.** Der Dry-Runner druckt heute nur
  Per-Batch-Totals (`ssot-w40k-{NNN}: 31 hits / 5/10 books`), **keine
  Buch-Slugs** — `scripts/apply-override-dry.ts:711` aggregiert per
  Label, nicht per Buch. Codex muss das Touch-Set deterministisch selbst
  drucken, indem er `lintSynopsis()` pro Buch im Ziel-File ausführt:

  ```bash
  npx tsx -e "
  import { lintSynopsis, loadBannedPatterns } from './scripts/apply-override-synopsis-lint';
  import { readFileSync } from 'node:fs';
  const NNN = '005'; // ← Iteration einsetzen
  const file = JSON.parse(readFileSync(\`./scripts/seed-data/manual-overrides-ssot-w40k-\${NNN}.json\`, 'utf-8'));
  const patterns = loadBannedPatterns('./scripts/seed-data');
  for (const b of file.books) {
    const r = lintSynopsis(b.externalBookId, b.slug, b.overrides.synopsis, patterns);
    if (r.hits.length) console.log(\`  \${b.externalBookId} \${b.slug}: \${r.hits.length} hits (\${r.hits.map(h=>h.patternLabel).join(', ')})\`);
  }
  "
  ```

  Output ist das Touch-Set für die Iteration. Das `npm run test:apply-override-dry`
  läuft trotzdem (siehe § Per-Batch-Verifikation) — aber als Sanity-Check,
  nicht als Touch-Set-Quelle.

- **Clean Bücher in 005..019 möglichst nicht anfassen.** Ausnahme nur,
  wenn Batch-Konsistenz es zwingt (z. B. ein clean Buch mit unverkürzter
  Curation-Prosa stört die Voice-Linie der rewritteten Nachbarn so stark,
  dass Reader-Eindruck inkonsistent wird). Codex entscheidet pro Fall und
  vermerkt es im Loop-Log-Block.

- **Out of scope hart.** Batches `ssot-w40k-001..004` (clean), `ssot-w40k-020`
  (Pilot, clean). Wenn Codex aus Versehen einen Bytes-Diff auf 020 oder
  001..004 schreibt → Revert. Brief-080-Pilot soll als Voice-Referenz
  unangetastet bleiben.

- **Per Buch nur `overrides.synopsis` editieren.** `overrides.facetIds`,
  `overrides.factions[]`, `overrides.locations[]`, `overrides.characters[]`,
  `overrides.flags[]` und das Top-Level (`$schema`, `batch`, `createdBy`,
  `createdAt`, `model`, `rationale`) bleiben byte-identisch. Diff einer
  Iteration zeigt nur Synopsis-Lines. Wenn Codex versehentlich den
  `rationale`-Header umformuliert oder facetIds dreht → in-iteration
  reverten.

### Längen-Korridor (neuer Zielwert, ersetzt Pilot-300–400-Mean)

- **Standalone-Romane / Novellas / Einzel-POV-Bücher:** ~500–620 Zeichen.
  Pilot 080 hat empirisch bei 412–556 / mean 475 gelandet, was Maintainer
  als „grundsätzlich gut, aber einen Tick mehr Hook + Konflikt +
  Tonality-Closing" markiert hat. 081 zielt explizit auf eine Spanne
  einen Tick darüber.

- **Omnibi und Multi-POV-Werke:** ~620–750 Zeichen. Mehr Bogen, mehr
  Ton-Drift, mehr Sub-Faction-Kontext rechtfertigt mehr Raum — aber
  nicht der Doorstopper-Modus pre-080.

- **Soft-Floor 420 Zeichen.** Wenn ein Buch wirklich dünn dokumentiert
  ist (Long-Tail-Long-Tail-Imprint), darf eine Synopsis kürzer sein.
  `low_confidence`-Hinweis **nur im Loop-Log-Block** (Feld
  „`low_confidence`-/Twist-Policy-Calls"). **Keine Flag-Edits** —
  `overrides.flags[]` ist Teil des byte-identischen Scope-Locks (siehe
  unten), und der Brief soll keine Doppel-Surface-Form für „dünn
  dokumentiert" haben. Loop-Log ist die einzige Wahrheit dafür in 081.

- **Soft-Cap 800 Zeichen, nur begründet.** Wenn ein einziger Omnibus oder
  ein Multi-POV-Series-Closer es wirklich braucht (z. B. der Phalanx-
  Trial-Bogen, der drei Mid-Twist-Stränge zusammenbinden muss). Begründung
  pro Buch im Loop-Log: „X Zeichen weil Multi-POV-Series-Closer mit drei
  Pflicht-Subplot-Strängen". Codex's-Call.

- **300–400-Mean aus Brief 080 ist verworfen.** Falls Codex Pilot-Beispiele
  als Schablone benutzt: in Länge sind sie 80–100 Zeichen knapp am neuen
  Korridor. Voice ja, Länge bewusst über.

### Reader-Info-Erhaltung (kein bloßes Cleaning)

- **Bewahre beim Rewrite:** (a) Protagonist (Name + Rolle, sofern in der
  alten Synopsis benannt), (b) Setting / Setting-Type (Welt / Sektor /
  Schiff / Hive — keine konkrete Sterneitabelle, aber das *Wo*), (c)
  zentraler Konflikt (gegen wen, worüber), (d) entscheidende Faction /
  Antagonist (wenn die alte Synopsis sie nennt — z. B. Word Bearers,
  Necron-Overlord X, Inquisitor Y), (e) Tonality (war_story vs
  political_thriller vs body_horror — als Prose-Marker).

- **Sicher weglassen** sind: Cross-Refs (`(W40K-NNNN)`, `*Crossfire* (W40K-…)`),
  Brief-Verweise, Authority-Layer-Tail-Strings („First authority-layer
  X surface forms"), Curation-Mehrfach-Aufzählungen, Audit-Mehrfach-
  Listen, jq-Mess-Sätze, „aggregation per Brief"-Tails, Markdown-
  Emphasis-Klötze.

- **Plot-Twists, die schon in der alten Synopsis stehen, dürfen weiterhin
  stehen.** Pilot 080 hat das beim Daenyathos-Twist (Catechisms-Martial-
  Long-Game-Corruption) so gehandhabt — partielle Obfuskation hätte Scope
  erfunden. Wenn Codex bei einem konkreten Buch Twist-Schutz für reader-
  ehrlicher hält, im Loop-Log notieren (Material für eine generische
  Twist-Policy in einem späteren Brief).

- **Keine Plot-Erfindung.** Wenn dir ein Element in der alten Synopsis
  unklar ist und du es nicht ehrlich kürzer ausdrücken kannst, **lass es
  weg** statt zu raten. „Gekürzt = gekürzt" ist OK.

### Per-Batch-Verifikation

Pro Iteration, nach dem Rewrite:

- **`npm run test:synopsis-lint`** — Sanity-Check, dass der Helper grün
  bleibt (sollte 14/14 unverändert sein, keine Code-Edits in 081).

- **`npm run test:apply-override-dry`** — Per-Batch-Hit-Counts. Erwartung
  nach Iteration N: Batch N hat 0 Hits, alle nicht-touched Batches
  behalten ihre vorherigen Hit-Zahlen. Exit 0 wegen Brief-080-P1-
  Report-Semantik (kein Fail auf Synopsis-Hits in Inspections-Modus).

- **`npm run db:apply-override -- --batch=ssot-w40k-{NNN}`** — Realer
  Apply. Guard prüft alle 10 Bücher des Batches gegen 32 Patterns.
  Wirft, wenn auch nur ein Buch im Batch noch einen Treffer hat. Bei
  005..008: alle Bücher inkl. der unangetasteten clean ones müssen
  passieren (= clean-Bücher hatten 0 Hits in der Baseline, das gilt
  weiter). Bei 010..019: alle 10 Bücher rewritet, alle 10 müssen
  passen. Bei 009: 9 rewritten + 1 clean.

  Hinweis: das Apply-Skript schreibt batch-weise — alle 10 `works`-Rows
  des Batches bekommen ein neues `updatedAt`, auch die Bücher, an denen
  nur `overrides.synopsis` byte-identisch geblieben wäre. Das ist
  technisch OK (idempotent in den Werten, nur `updatedAt`-Drift) und
  konsistent mit dem Verhalten in 077/080. Für Audit-Cockpit-Drift-Sort
  irrelevant, weil Drift dort über `bookDetails.notes` läuft, nicht
  über `updatedAt`.

  Windows-Footnote: wenn Maintainer-Setup PowerShell mit strict
  Execution-Policy ist, `npm.cmd run …` statt `npm run …`. Auf
  git-bash / WSL ist `npm run …` direkt OK (Brief 080-impl hat es so
  gefahren).

- **Loop-Log-Append.** Ein H2-Block pro Iteration, kompakt — Form-
  Vorschlag in § Notes. Niemals Voll-Lesen vor Append. `>>` oder Edit-am-
  Datei-Ende reicht. Keine giant prose; per-batch stats und Voice-
  Beobachtungen, keine Per-Buch-Bullet-Liste über zehn Zeilen pro Buch.

- **Pro Iteration ein Commit auf der Batch-Worktree-Task-Branch**
  `codex/ingest-batches-synopsis-005-019` (von `origin/main` abgezweigt,
  Worktree-Pfad `C:\Users\Phil\chrono-lexicanum-batches` — pro
  Worktree-Regeln in [`CLAUDE.md`](../CLAUDE.md) § „Parallel worktrees"
  ist das der Batch/Ingestion-Strang). Commit-Message: „SSOT-Synopsis-
  Rewrite ssot-w40k-{NNN} (Brief 081)". Diff zeigt: nur
  `manual-overrides-ssot-w40k-{NNN}.json`-Synopsis-Lines + ein Append-
  Block in `ssot-loop-log.md`.

### Globale Acceptance (am Ende der letzten Iteration)

- **`npm run lint`** + **`npm run typecheck`** + **`npm run brain:lint -- --no-write`**
  grün am Ende der **letzten** (also: 019er) Iteration. Während der
  Iterationen 005..018 dürfen sie ungelaufen bleiben — data-only-Commits,
  per Brief-061-Klausel akzeptabel.

- **Status-Lifecycle (pro Standard-Konvention aus `sessions-format.md`).**
  Pro Iteration N (N in 005..019) ist die Iteration „done", sobald
  Override-File-Commit + Loop-Log-Block landen und der Per-Batch-Real-
  Apply grün läuft. Brief 081 selbst bleibt `open` (Standing-Brief wie
  061), bis Iteration 019 durch ist. Pro Iteration **kein** eigener
  `081-impl-…`-File — der Loop-Log-Block IST der Iterations-Report.

- **Closing-Impl-File ist Pflicht (nicht optional).** Nach Iteration 019
  schreibt Codex ein `sessions/2026-05-DD-081-impl-ssot-synopsis-backfill-005-019.md`
  aus dem Template `sessions/_templates/implementer-report.md`. Inhalt:
  schlanker Sammel-Report (Summary / What I did / Decisions / Verification
  / Open issues / For next session), der die 15 Loop-Log-Blöcke
  aggregiert — Total-Statistik (Bücher gesamt, mean-/min-/max-Länge
  gesamt, Token-Verbrauch-Schätzung Welle-2 vs Welle-3/4, generische
  Voice-Notes, Antworten auf § Open questions, For-next-session-Punkte).
  100–200 Zeilen reichen — der Detail-State lebt im Loop-Log.

- **Status-Flips macht Codex (analog 077-impl / 080-impl).** Im gleichen
  Commit wie das Closing-File: Brief 081-arch `status: open → implemented`,
  Closing-File `status: complete`, plus die zwei Active-Threads-Zeilen
  in `sessions/README.md` (siehe § Notes „Append-Discipline"). Cowork
  übernimmt nur den Hygiene-Pass danach (Brain-Wiki + Archiv-Verschiebung).

## Out of scope

- **Batches `ssot-w40k-001..004` und `ssot-w40k-020`.** Alle clean. Nicht
  anfassen. 020 ist Pilot-Referenz und bleibt Voice-Korridor-Beispiel.

- **HH-Domain.** Files existieren noch nicht. Forward-Discipline + Apply-
  Guard greifen automatisch, wenn HH-Loop später dazukommt.

- **Junctions / facetIds / Flags / book_details.notes.** Apply-Skript
  schreibt sie weiter; Guard betrachtet sie nicht. Pure Out-of-Scope.

- **Pattern-File-Erweiterung.** `synopsis-banned-patterns.json` ist das,
  was es ist. Codex erweitert es nicht. Wenn ein Edge-Case-Pattern-False-
  Positive auftritt (z. B. typografisches `*Crossfire*` als Werks-Titel-
  Quoting im Rewrite gewollt) → Codex umformuliert die Synopsis, statt
  das Pattern weicher zu machen.

- **Loop-Driver `scripts/run-ssot-loop.sh`.** Heredoc bleibt
  unangetastet. 081 ist Maintainer-getriggert, kein Headless-Loop. Auch
  wenn ein generischer Synopsis-Backfill-Headless-Driver später lohnt —
  nicht in 081.

- **Cockpit / UI / Schema-Migration.** Keine. Public-Verbesserung kommt
  rein aus saubereren `works.synopsis`-Daten.

- **WebSearch.** Verboten in jedem Subsession-Lauf.

- **Trigger-Heredoc-Edit in `run-ssot-loop.sh`** für Forward-Discipline.
  Brief 077 + 080 haben das schon verankert.

- **`sessions/README.md`-Aktive-Threads-Pflege während der Iterationen.**
  Cowork pflegt das in einem batched Hygiene-Pass nach 081-Closing. Codex
  fügt nach Iteration 019 einmal die 081-Closing-Zeile ein (siehe § Notes
  Form-Vorschlag).

- **Brain-Wiki-Pflege.** Cowork pflegt `project-state.md` /
  `pipeline-state.md` / `log.md` / `open-questions.md` im Hygiene-Pass
  nach 081-Closing. Codex editiert keine Wiki-Pages.

- **Re-Apply der bereits sauberen Pilot-Batch 020.** Out-of-scope. Wenn
  Codex aus Versehen 020 mit anfasst → revert.

## Acceptance

The standing brief is **done** when alle 15 Iterationen durch sind. Pro
Iteration N (mit N in 005..019):

- [ ] **Hit-Bücher rewritten.** Alle Bücher im Touch-Set für Batch N (siehe
  Ist-Zustand-Tabelle in § Context) haben eine rewrittete
  `overrides.synopsis` ohne Pattern-Treffer.

- [ ] **Längen im Korridor.** Standalones 500–620, Omnibi/Multi-POV 620–750.
  Soft-Floor 420, Soft-Cap 800 nur mit begründetem Notes-Eintrag.

- [ ] **Diff zeigt nur Synopsis-Lines.** `git diff scripts/seed-data/manual-overrides-ssot-w40k-{NNN}.json`
  betrifft nur `overrides.synopsis`-Strings (plus formatting im Trailing-
  Whitespace falls JSON-Parser das tut). Kein Top-Level-Edit, kein
  facetIds-Swap, kein Faction-Reorder.

- [ ] **`npm run test:synopsis-lint`** grün (14/14, oder die aktuelle
  Test-Case-Zahl falls Codex zwischendurch Cases ergänzt — sollte er
  nicht).

- [ ] **`npm run test:apply-override-dry`** grün (exit 0). Synopsis-Lint-
  Report zeigt für Batch N: 0 Hits in allen Pattern-Klassen. Andere
  Batches behalten ihre Hit-Zahlen.

- [ ] **`npm run db:apply-override -- --batch=ssot-w40k-{NNN}`** grün. 10
  `works.synopsis`-Rows updated (oder 5 bei 005-Restbatch — Restbatch
  besteht in 005..019 nicht, aber prinzipiell). 0 Throws.

- [ ] **Loop-Log-Block angehängt.** H2-Form siehe § Notes; acht Pflicht-
  Felder vorhanden (Datum, Batch, Touch-Set-Größe, Pre/Post-Längen-
  Statistik, Per-Pattern-Class-Post-Mess, Voice-Beobachtungen, Codex-
  Iteration-Time-Estimate, Notes).

- [ ] **Commit landet auf dem Loop-Branch** als ein logisches Commit pro
  Iteration.

Am Ende der letzten Iteration (019) zusätzlich:

- [ ] **`npm run lint` / `npm run typecheck` / `npm run brain:lint -- --no-write`** grün.

- [ ] **Batch 020 unverändert clean.** `npm run test:apply-override-dry`
  zeigt für 020 weiter 0 Hits. `git diff --stat origin/main..` zeigt
  keinen Hit auf `manual-overrides-ssot-w40k-020.json`.

- [ ] **081-impl-Closing-File** unter `sessions/2026-05-DD-081-impl-ssot-synopsis-backfill-005-019.md`
  aus `sessions/_templates/implementer-report.md`, mit Total-Statistik
  (siehe § Constraints „Closing-Impl-File ist Pflicht").

- [ ] **Status-Flips** im gleichen Commit wie das Closing-File: Brief
  081-arch `status: open → implemented`, Closing-File `status: complete`.

- [ ] **`sessions/README.md` Active-Threads** bekommt die 081-arch +
  081-impl-Zeilen (siehe § Notes „Append-Discipline"; eine Edit am Ende).

## Open questions

Im 081-impl-Closing-File beantworten:

- **Voice-Korridor 500–620 / 620–750 in Praxis.** Hat sich der neue
  Korridor saftig genug angefühlt, oder zu lang/zu kurz für bestimmte
  Sub-Settings (Necromunda-Hive-Gang vs Soul-Drinkers-Tragödie vs Last-
  Chancers-Penalisten vs Calpurnia-Procedural)? Welche Genre-Variation
  hat sich praktisch bewährt?

- **Twist-Schutz-Policy.** Hast du in einem oder mehreren Büchern den
  alten Twist erhalten (wie Pilot 080 bei Daenyathos) oder bewusst
  partiell obfuskiert? Welche Linie hat sich beim Lesen besser
  angefühlt — Material für eine generische Twist-Policy in einem
  späteren Brief.

- **Period-treue Faction-Namen außerhalb Pilot-Beispiele.** Pilot hat
  „Dark Eldar" (2005er) und „Sisters of Battle" (2012er) genommen.
  In den 015..019-Necromunda-Modern-Imprint-Büchern: bist du auf
  „Astra Militarum"-Drift gestoßen? In den 011..013-Space-Wolves /
  Iron-Warriors-Clustern: konsistent benutzt?

- **Touch-Set-Erweiterung.** Wie oft hat dich Batch-Konsistenz dazu
  gezwungen, ein clean Buch mit anzufassen, und welches Buch war das
  jeweils? Wenn nie → gut. Wenn mehr als 3–4 → Hinweis darauf, dass
  Voice-Drift zwischen rewritteten und originalen Synopsen größer ist
  als erwartet.

- **Pro-Iteration-Token-Budget.** Wie viele Tokens hat eine typische
  005..009-Iteration vs. eine typische 010..019-Iteration ungefähr
  gekostet? Wenn Welle-3/4-Iterationen >80k landen, ist das ein
  Hinweis, dass der Brief in Welle-5 (HH-Domain später) noch enger
  geschnitten werden sollte.

- **Detection-Algorithmus.** Variante A (deterministische Reihenfolge
  im Brief) oder Variante B (Codex-detect via tail des Loop-Logs)? Was
  hat sich praktisch glatter angefühlt?

## Notes

### Iterations-Reihenfolge (deterministische Variante A)

| Iter | Batch  | Touch-Set | Anmerkung |
|-----:|--------|----------:|-----------|
| 1    | 005    | 1         | Warm-up, Voice-Kalibrierung |
| 2    | 006    | 2         | Warm-up |
| 3    | 007    | 5         | Erster mittlerer Batch |
| 4    | 008    | 6         | Mittel, breit verteilt |
| 5    | 009    | 9         | Quasi voll — Übergang zu Welle-3 |
| 6    | 010    | 10        | Welle-3 Start |
| 7    | 011    | 10        | |
| 8    | 012    | 10        | |
| 9    | 013    | 10        | |
| 10   | 014    | 10        | |
| 11   | 015    | 10        | |
| 12   | 016    | 10        | Welle-4 Start (Necromunda-Cluster) |
| 13   | 017    | 10        | Necromunda Mid |
| 14   | 018    | 10        | Necromunda Modern-Imprint |
| 15   | 019    | 10        | Last-Chancers / Gothic-War / Soul-Drinkers-Opener |

### Loop-Log-Block-Form (Vorschlag)

Pro Iteration ein H2-Block (Codex darf Form anpassen, solange die acht
Pflicht-Felder sichtbar bleiben):

```markdown
## 2026-05-DD · 🔄 Synopsis-Rewrite ssot-w40k-{NNN} (Brief 081)

- **Touch-Set:** N rewritten / M total books in batch
- **Length pre → post (chars):** min=A→A' · mean=B→B' · max=C→C'
- **Per-pattern-class post-mess:** `**` = 0, `authority-layer` = 0, `Brief-NNN` = 0, `W40K-NNNN` = 0 (all four classes — extend if you found another class hot in this batch)
- **Voice notes:** 1–3 sentences. Premise vs setup ratio, In-Universe-vocabulary calls, tonality-marker placement choices specific to this batch's sub-setting.
- **Touched clean books?** none / list with reason (batch-consistency drift)
- **`low_confidence`-/Twist-Policy-Calls:** none / list with reason
- **Iteration time / token estimate:** rough; helps Cowork tune Welle-5+ briefs
- **Carry-over notes:** anything that should go into the 081-impl-closing or a follow-up brief
```

Bei `tail`-Append ohne Voll-Read: Codex schreibt den Block in eine
temp-File und macht `cat tmp.md >> sessions/ssot-loop-log.md` (Pilot-
Pattern aus Brief 080).

### Voice-Korridor-Beispiele aus Pilot 080 (zum Kalibrieren)

`crossfire` (Standalone, 525 chars):

> Newly promoted to arbiter senioris, Shira Calpurnia of the Adeptus
> Arbites arrives at Hydraphur and lands in a tangle of corruption,
> civil unrest, and Ecclesiarchy politics — opened by a string of
> assassination attempts on her own life. The trail leads to a noble
> house and a conspiracy hidden beneath a religious festival, climaxing
> in a bell-tower as Calpurnia keeps her quarry talking long enough to
> read him the law. A rare Arbites-led procedural-mystery in a
> political-thriller key.

`legacy` (Standalone, 478 chars):

> The death of a rich and ancient Rogue Trader brings his Charter of
> Trade — a relic literally signed by the Emperor — to Hydraphur, where
> Calpurnia must see Hoyyon Phrax's will carried out under Imperial
> law. Rival heirs decide that due process be damned, and the
> administrators of a will must take up arms on the side of legal
> process — while ambitious clerics of the Ecclesiarchy, drawn by the
> relic, open a second front. The procedural shades into court-
> intrigue.

`the-soul-drinkers-omnibus` (Omnibus, 556 chars — bereits am unteren Ende des neuen Omnibus-Korridors):

> The Soul Drinkers' rebellion against their own Chapter Master over a
> stolen relic ends in Excommunicate Traitoris status and the slow
> chaotic mutation of every warrior in the chapter. Librarian Sarpedon
> — soon to grow arachnid legs as the gene-seed twists — leads them
> through a fugitive war against the Inquisition's Thaddeus and the
> daemon-prince Teturact, and at last to a reckoning with Tellos, the
> former brother now wholly Chaos. The complete first trilogy in a
> single volume: a chapter-tragedy of pride, mutation, and the cost of
> choosing rebellion.

`daenyathos` (Novella, 431 chars — knapp unter neuem Standalone-Floor; Codex-Wahl ob saftiger oder so belassen):

> A prequel-novella told across centuries — Chaplain Daenyathos as a
> sergeant at the Second Siege of Terra, then his slow rise as the Soul
> Drinkers' philosopher-soldier and author of their Catechisms Martial,
> then his interment in a dreadnought and disappearance. Daenyathos has
> watched the Imperium long enough to despise it, and the Catechisms
> are not the guidance his chapter believed — they are the long-game
> seed of its undoing.

Beobachtbares: Premise/Setup-Hook im ersten Satz, Konflikt mit benannter
Faction/Antagonist in der Mitte, Tonality-Marker als Schluss-Cadence.
Voice ist deine, Längen-Cadence einen Tick saftiger als oben.

### Beispiel-Eröffnungs-Prompt für eine Subsession (Maintainer)

Maintainer ruft Codex nach `/clear` etwa so an:

> „Brief `sessions/2026-05-17-081-arch-ssot-synopsis-backfill-005-019.md`
> ausführen. Nächste Iteration."

Codex erkennt den nächsten Batch aus der Iter-Tabelle (Variante A) oder
aus dem Loop-Log-Tail (Variante B), produziert die Override-File-Edits +
Loop-Log-Append + Commit, stoppt. Maintainer macht `/clear`, gleicher
Prompt, nächste Iteration.

### Append-Discipline für `sessions/README.md` am Loop-Ende

Nach Iteration 019, Codex fügt zwei Zeilen in die Active-Threads-Tabelle
ein (Form analog zur 080er-Zeile):

```
| [2026-05-17-081-arch-ssot-synopsis-backfill-005-019](./2026-05-17-081-arch-ssot-synopsis-backfill-005-019.md) | architect | implemented | **Public-Synopsis-Backfill — Standing /clear-Loop für `ssot-w40k-005..019`.** 15 `/clear`-Subsessions, 123 Synopsen rewritten in Public-Reader-Copy (Standalone 500–620, Omnibi/Multi-POV 620–750, Soft-Floor 420, Soft-Cap 800 begründet). Voice = Pilot-080-Linie + einen Tick saftiger. Pro Iteration Test/Dry/Real-Apply + Loop-Log-Append; Batch 020 + 001..004 unangetastet. |
| [2026-05-DD-081-impl-ssot-synopsis-backfill-005-019](./2026-05-DD-081-impl-ssot-synopsis-backfill-005-019.md) | implementer | complete | Closing-File mit Total-Statistik nach Iter-019 — siehe Loop-Log für Per-Iteration-Details. |
```

Cowork prunt diese Zeilen im Hygiene-Pass nach Closing (Archiv-Verschiebung
in `sessions/archive/2026-05/`).
