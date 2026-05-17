---
session: 2026-05-17-080
role: architect
date: 2026-05-17
status: implemented
slug: synopsis-guard-and-pilot
parent: 2026-05-11-061-arch-ssot-loop
links:
  - 2026-05-11-061-arch-ssot-loop
  - 2026-05-16-076-arch-resolver-batch-4-axis-sliced
  - 2026-05-16-077-arch-grand-alignment-junction-hygiene
commits: []
---

# Public-Synopsis-Forward-Guard + Pilot-Rewrite (Batch 020)

## Goal

Zwei zusammenhängende, klein dimensionierte Lieferungen in einer CC-Session: (1) **Track B** — Forward-Guard im Apply-Layer, der die in Brief 061 § Public-Synopsis-Discipline kodifizierten Verbote (Markdown-Sterne, SSOT-IDs, Brief-Refs, „authority layer"-Vokabular, „surface form"-Tails) künftig hart ablehnt; (2) **Track A-Pilot** — Rewrite der 10 Synopsen in `ssot-w40k-020.json` (der zuletzt geschriebene und am stärksten polluted Batch) als Voice-Kalibrierung. Maintainer schaut sich nach dem Pilot die 10 Public-Synopsen auf `/buch/[slug]` an und gibt Voice-Feedback für den nachfolgenden Loop-Brief 081, der die restlichen 110 Bücher in 11 `/clear`-Subsessions rewrittet.

Architektonisch ist die Session **klein gehalten**, weil ein vorheriger Schnitt (alter Brief 079, jetzt zurückgezogen) das Token-Budget gesprengt hat: 120 Bücher Synopsis-Rewrite plus Helper plus optionaler WebSearch sind keine 1-Session-Arbeit. Die Aufteilung 080 (Guard + 10er-Pilot) → 081 (Standing-Loop für 110 Bücher) übernimmt das Pattern aus Brief 061 (10er-Batches als Standing-Loop). Realistische Ziel-Spanne für 080: **50–80k Tokens** (Pflicht-Start-Lese-Docs + Code-Wiring + Helper + Tests + 10 Synopsen) — siehe Acceptance „Session-Token-Disziplin".

## Design freedom — read before everything else

**Voice der 10 Pilot-Synopsen ist deine Wahl, nicht meine.** Der Pilot ist genau dafür da: Maintainer sieht nach 080-impl-Merge eine 10er-Stichprobe deiner Voice-Wahl und kann den Folge-Loop 081 mit präzisem Voice-Feedback laden, statt deine 120 Synopsen post-hoc zu korrigieren. Du wählst pro Synopsis: Premise-erst-vs-Setup-erst, In-Universe-Vokabular-Dichte („Astartes" / „Space Marine" / paraphrasiert), Satzrhythmus, Tonality-Hinweise als Prose statt als Audit-Tag, exakte Zeichenzahl im 200–500-Korridor. **Schau dir die schon-sauberen Synopsen in `ssot-w40k-001..008` an** (z. B. `xenos`, `gaunts-ghosts-the-saint-omnibus-4-7`, `shroud-of-night`) als Voice-Korridor-Beispiele — Korridor, nicht harte Schablone.

**Voice der Apply-Reject-Error-Message ist deine Wahl.** Architektur ist nur „der Apply bricht hart ab und macht den Treffer (Buch-ID + Pattern + 40-Zeichen-Snippet) für den Maintainer auffindbar". Format, Ton, Mehrzeilig-vs-Einzeilig — du entscheidest.

Hart bleiben: die strukturellen Constraints (Scope hart auf Batch 020 + Forward-Guard, Längen-Korridor, Verboten-Pattern-Liste, Apply-Reject-Position im Code, **kein WebSearch**, keine Plot-Erfindung).

## Context

Auslöser: Maintainer-Review der Public-`/buch/[slug]`-Seite am 2026-05-17 hat sichtbar gemacht, dass die Synopsen in den späteren Welle-2- bis Welle-4-Batches mit internem Curation-Vokabular und Markdown-Sternen durchsetzt sind. Beispiel `legacy` (W40K-0200) trägt 9× `**bold**`, einen `*Crossfire* (W40K-0199)`-Cross-Ref und einen `**First authority-layer X surface forms.**`-Tail. Brief 076 hat die **Public-Synopsis-Discipline** in Brief 061 § Constraints verankert, aber forward-only ab `ssot-w40k-021`. Brief 080 schließt die Lücke zwischen kodifizierter Discipline und Apply-Layer-Enforcement.

Ist-Zustand-Vermessung über alle 20 Override-Files (gemessen 2026-05-17 via `jq` + `[scan("\\*\\*")]` / `[scan("authority[- ]layer")]` / `[scan("[Bb]rief[- ][0-9]")]` / `[scan("W40K-[0-9]")]`):

| Batch | `**`-Treffer | „authority-layer" | Brief-Refs | W40K-IDs |
|---|---:|---:|---:|---:|
| 001–008 | 0 | 0–4 | 0 | 0–5 |
| 009 | 2 | 5 | 0 | 0 |
| 010 | 42 | 12 | 0 | 5 |
| 011 | 156 | 9 | 0 | 0 |
| 012 | 132 | 14 | 0 | 0 |
| 013 | 158 | 34 | 0 | 0 |
| 014 | 140 | 56 | 0 | 5 |
| 015 | 132 | 61 | 1 | 13 |
| 016 | 242 | 31 | 3 | 22 |
| 017 | 202 | 28 | 1 | 6 |
| 018 | 280 | 32 | 2 | 10 |
| 019 | 220 | 31 | 3 | 9 |
| **020** | **246** | **35** | **3** | **14** |

Scope-Wahl Batch 020 als Pilot ist bewusst: höchster Markdown-Stern-Count plus mittlere W40K-Cross-Ref-Dichte plus klassisch-polluted „**First authority-layer X surface forms.**"-Tails — repräsentativ für das, was der Loop-Brief 081 dann in 11 weiteren Batches abarbeiten muss.

Pfad-Bezüge:

- **`works.synopsis`** ([schema.ts:219](../src/db/schema.ts)) ist die Public-Render-Quelle für `/buch/[slug]` DetailPanel. TEXT-Spalte, geschrieben vom Apply-Skript ([`scripts/apply-override.ts:742`](../scripts/apply-override.ts)).
- **Override-File** [`scripts/seed-data/manual-overrides-ssot-w40k-020.json`](../scripts/seed-data/manual-overrides-ssot-w40k-020.json) trägt 10 Bücher (`W40K-0191..W40K-0200`, Soul Drinkers + Shira Calpurnia Cluster). Du editierst nur `overrides.synopsis` pro Buch. Alles andere bleibt byte-identisch (auch `createdBy`, `model`, `rationale`).
- **Apply-Skript** ([`scripts/apply-override.ts`](../scripts/apply-override.ts)) ist idempotent und schreibt `works.synopsis = override.overrides.synopsis` pro Buch. Re-Apply via `npm run db:apply-override -- --batch=ssot-w40k-020`.
- **Loop-Discipline** ([`sessions/2026-05-11-061-arch-ssot-loop.md`](./2026-05-11-061-arch-ssot-loop.md) § Public Synopsis Discipline) bleibt forward-only-Discipline für künftige Batches. Der Apply-Reject-Guard aus diesem Brief greift sowohl rückwirkend (Batch 020 muss nach dem Rewrite den Guard passieren) als auch forward (Batches 021+ werden beim Apply geprüft).
- **Brief 077** ([`scripts/apply-override-skip.ts`](../scripts/apply-override-skip.ts)) hat das Pattern „Pure Helper mit DI-Signatur + Wiring in `apply-override.ts` + `apply-override-dry.ts`" etabliert. Der Synopsis-Lint-Guard folgt 1:1 dem gleichen Shape.

Token-Discipline (Lektion aus dem zurückgezogenen alten 079-Brief): wenn du Files liest, lies nur das aktuelle Pilot-File (`ssot-w40k-020.json`) — die anderen 11 Batches sind nicht Teil dieser Session. Pro Buch nur einmal lesen (Original-Synopsis), dann direkt rewriten und schreiben. **Kein WebSearch** in dieser Session, weil (a) Plot-Fakten liegen schon in der bestehenden Synopsis-Prose (Curation-Vokabular drumherum ist der einzige Müll), und (b) WebSearch war im alten Brief der eigentliche Token-Killer.

Anschluss in der Maintainer-Bedienung: 080 (dieser) landet vor dem Loop-Re-Trigger für neue Bücher; 081 (Folge-Loop für 110 verbleibende Bücher) wird **nach** Maintainer-Review der Pilot-Voice geschrieben. Reihenfolge: Brief 080 → Maintainer-Review der 10 Pilot-Synopsen auf der Public-Page → Brief 081 (Standing-Loop mit eventueller Voice-Feinjustierung) → Loop-Re-Trigger `ssot-w40k-021..025` über Brief 061.

## Constraints

### Track B — Forward-Guard im Apply-Layer

- **Position im Code.** Pure Helper-Funktion analog [`scripts/apply-override-skip.ts`](../scripts/apply-override-skip.ts) aus Brief 077. Vorschlag: `scripts/apply-override-synopsis-lint.ts` mit DI-Signatur (Synopsis-String + Buch-ID + Slug + Pattern-Liste rein, Treffer-Array raus). Wiring in [`scripts/apply-override.ts`](../scripts/apply-override.ts) direkt vor dem `works`-Insert/Update (~Zeile 740, also vor dem `synopsis: override.overrides.synopsis`-Schreib-Punkt). Dasselbe Wiring landet im Dry-Run-Pendant `scripts/apply-override-dry.ts` — **aber mit klar getrennter Semantik**, siehe nächster Bulletpoint.

- **Apply-vs-Dry-Semantik (kritisch, P1-Fix).** [`scripts/apply-override-dry.ts`](../scripts/apply-override-dry.ts) simuliert hart alle `BATCHES = ssot-w40k-001..020` als Inspektions-Tool. Wenn der Synopsis-Lint im Dry exakt das Verhalten des Real-Apply hätte (hard throw), würde der Dry sofort auf den polluted Batches 009..019 rot werden — Batches, die in diesem Brief explizit out-of-scope sind und erst Brief 081 anfasst. Diese Acceptance wäre unmöglich. Architekt-Call:
  - **Real Apply (`apply-override.ts`):** **hard throw** auf Pattern-Treffer (Gate-Semantik). Der Maintainer kann polluted Synopsen nicht in die DB schreiben.
  - **Dry-Run (`apply-override-dry.ts`):** Synopsis-Lint läuft, Treffer werden gesammelt und im Dry-Report sichtbar ausgegeben (Per-Buch-Liste mit Pattern-Labels + Counts), aber der Dry-Lauf **failed nicht** auf Synopsis-Treffern. Inspektions-/Report-Semantik. Begründung: Dry-Run ist Diagnose-Werkzeug, nicht Gate; sein Job ist „zeige mir, was beim echten Apply passieren würde", nicht „blockiere mich". Polluted Batches sollen im Dry-Report sichtbar werden, damit der Brief-081-Loop Pre-Mess-Telemetrie hat — *ohne* dass dieser Brief sie fixen muss.
  - **Optional, falls einfach zu bauen:** Ein `--strict-synopsis`-Flag im Dry, das hard-fail-Verhalten anschaltet (für CI/Pre-Commit-Hooks später). Out-of-scope für 080, aber kurzer Hinweis im Helper-Header lohnt sich für Brief 081. Wenn du den Flag spontan einbaust, ein Satz im Report.
  - Exit-Code-Verhalten Dry: bleibt bei `0` solange nur Synopsis-Treffer ausgegeben werden; Faction-Skip-Probes etc. behalten ihr bestehendes Verhalten.

- **Pattern-Quelle.** Verboten-Liste lebt in einer JSON-Datei in `scripts/seed-data/` analog `faction-policy.json` aus Brief 077. Vorschlag-Name: `scripts/seed-data/synopsis-banned-patterns.json`. Form-Vorschlag (nicht binding — wenn du eine andere Struktur sinnvoller findest, ein Satz im Report):

  ```json
  {
    "$schema": "synopsis-banned-patterns-v1",
    "patterns": [
      { "kind": "regex", "value": "\\*\\*", "label": "markdown-bold" },
      { "kind": "regex", "value": "W40K-\\d", "label": "ssot-id-w40k" },
      { "kind": "substring", "value": "authority layer", "label": "authority-layer" },
      ...
    ]
  }
  ```

  Architekt-Default-Tendenz: JSON-File, parallel zur Brief-077-Konvention. Wenn du dich für Code-Inline entscheidest, kurze Begründung im Report.

- **Verboten-Patterns (Match-Liste).** Operative Form der 061-Discipline:
  - Markdown-Emphasis: `**bold**`, `*italic*` (single-asterisk-Italic — du darfst Single-`*` weicher matchen, siehe § Open questions), `_under_`, `__double__`.
  - SSOT-IDs: `W40K-NNNN`, `HH-NNNN`, `ssot-w40k-NNN`, `ssot-hh-NNN`.
  - Brief-Verweise: `Brief NNN`, `Brief-NNN`, `brief NNN` (case-insensitive).
  - Authority-Layer-Vokabular: `authority layer`, `authority-layer`, `cumulative=`, `cumulativeBefore`, `loop-iteration`.
  - Resolver-/Curation-Slang: `surface form`, `surface-form`, `canonical entity`, `direct match`, `alias lookup`, `Resolver-Pass`, `resolver pass`.
  - Audit-Marker: `data_conflict`, `low_confidence`, `historical_canon_layer`, `Inquisition-consistency triggered`, `omnibus-constraint`, `aggregation per Brief`, `value_outside_vocabulary`.
  - Footnote-Style: `See note:`, `[ref]`, `cf.` (am Satzanfang), Footnote-Reference-Style.

- **Match-Strategie.** Case-insensitive. Substring-Match für Vokabular-Strings, Regex-Match für ID-/Markdown-Pattern (deine Wahl im JSON pro Eintrag — die `kind: "regex" | "substring"`-Form im Vorschlag oben ist eine Option). Hauptsache: alle Ist-Zustand-Beispiele (`**First authority-layer X surface forms.**`, `**Inquisition-consistency triggered**`, `(W40K-0199)`, `Aggregation per Brief-061 omnibus-constraint`) werden gefangen.

- **Reject-Form.** Apply wirft hart (kein Soft-Warn). Error-Message enthält mindestens: (a) `externalBookId`, (b) `slug`, (c) Batch-Name, (d) Pattern-Label oder -Value, (e) 40-Zeichen-Snippet um den Treffer. Voice der Message ist deine Wahl. Mehrere Treffer in einem Buch werden alle gemeldet (eine Liste), nicht nur der erste — Maintainer soll alles auf einmal sehen.

- **Kein Skip-Schalter.** Wenn ein Edge-Case auftritt, ist die Lösung „edit den Synopsis-Text" oder „pattern aus JSON entfernen", kein per-Run-Override. Konsistenz mit Brief 077.

- **Tests.** Mindestens ein Unit-Test (in einem passenden `*.test.ts` oder ad-hoc `scripts/test-synopsis-lint.ts`) deckt drei Cases ab: (i) clean passes, (ii) polluted throws (Beispiel: synthetische Synopsis mit `**` und `Brief 061`), (iii) edge-case mit literal-`*` ohne `**` (z. B. typografischer Asterisk in einem Werks-Titel-Quoting — soll passen). Falls du den Italic-`*<wort>*`-Match weicher implementierst als den `**bold**`-Match, deckt der Edge-Test das ab.

### Track A — Pilot-Rewrite `ssot-w40k-020.json`

- **Scope hart.** Nur `scripts/seed-data/manual-overrides-ssot-w40k-020.json`. **Keine anderen Override-Files** in dieser Session anfassen — auch nicht 019, auch nicht 001..008. Pro Buch nur `overrides.synopsis`; alle anderen Felder (`externalBookId`, `slug`, `overrides.facetIds`, `overrides.factions[]`, `overrides.locations[]`, `overrides.characters[]`, `overrides.flags[]`) sowie Top-Level (`$schema`, `batch`, `createdBy`, `createdAt`, `model`, `rationale`) bleiben byte-identisch.

- **Längen-Korridor.** 200–500 Zeichen Ziel pro Synopsis (Soft-Floor 150, Soft-Cap 600). Mittel über die 10 Bücher sollte bei 300–400 liegen. Bei Omnibi/Multi-POV (Batch 020 enthält `the-soul-drinkers-omnibus`, `soul-drinkers-annihilation-second-omnibus`) darf der Cap auf 600 ausgereizt werden — du nennst die Begründung pro Buch im Status-Log.

- **Plot-Treue, kein WebSearch.** Quelle ist *ausschließlich* die existierende `overrides.synopsis` im File. Du extrahierst den Plot-Kern (Premise + Konflikt + Tonality), entfernst alles aus der Verboten-Liste, schreibst eine knappe Public-Reader-Copy. **Keine neuen Plot-Fakten erfinden.** Wenn die existierende Synopsis Plot-Fakten enthält, die du in der Kurzfassung weglässt — das ist OK, „gekürzt = gekürzt". Wenn dir Plot-Details unklar erscheinen — paraphrasieren, nicht recherchieren. **WebSearch ist verboten in dieser Session.** (Lektion aus dem zurückgezogenen alten 079: WebSearch war der Token-Killer, und für reinen Curation-Vokabular-Cleanup ist er nicht nötig.)

- **Faction/Location/Character-Namen — Reader-Voice.** Verwende Reader-übliche Bezeichnungen, deine Wahl pro Buch. „Imperial Guard" oder „Astra Militarum" — beides OK, je nachdem was im Synopsis-Flow organischer liest. „Adeptus Arbites" mit kurzer Erklärung („Arbites — Imperial law enforcement") oder paraphrasiert — auch beides OK. Konsistenz innerhalb eines Buchs ist wichtiger als Konsistenz zwischen Büchern.

- **Omnibi-Formel.** Bei `the-soul-drinkers-omnibus` und `soul-drinkers-annihilation-second-omnibus`: **kein Per-Constituent-Plot-Walkthrough**. Stattdessen Setup-Satz (Soul-Drinkers-Kontext), ein-zwei Sätze Bogen über die enthaltenen Werke, optional Tonality-Hinweis. Faustregel 350–550 Zeichen.

- **Status-Log-Eintrag.** Du erweiterst `sessions/ssot-loop-log.md` mit einem H2-Block zum Pilot: (a) Datum + Batch-Name + Pilot-Marker, (b) Anzahl rewriteter Synopsen (10), (c) Mittel/Min/Max-Längen pre vs. post, (d) Buch-IDs mit Sonderanmerkung (z. B. Cap-Überschreitung-Begründung für Omnibi), (e) Voice-Note-an-Maintainer (ein-zwei Sätze: welche Voice-Entscheidungen du getroffen hast — In-Universe-Vokabular-Level, Premise-vs-Setup-Eröffnung, Tonality-Marker-Stil — damit Maintainer dem Folge-Loop 081 präzise Voice-Korrekturen mitgeben kann).

  **Loop-Log-Read-Discipline (P2-Fix, kritisch).** `sessions/ssot-loop-log.md` ist heute ca. 393.000 Zeichen lang (~100k Tokens) — ein Full-Read killt das Token-Budget der Session sofort. **Niemals den ganzen Loop-Log lesen.** Wenn du das letzte Format-Beispiel sehen willst, nimm `tail -n 200 sessions/ssot-loop-log.md` (oder `tail -n 400`, je nach Block-Länge). Für den Append-Schritt brauchst du den File-Inhalt gar nicht zu kennen — `>>` oder Edit-am-Datei-Ende reicht. Dieselbe Discipline gilt für alle großen Append-Only-Logs im Repo.

### Track-übergreifend

- **Commits getrennt.** Track B (Apply-Guard + Helper + Tests + JSON-Pattern-File) und Track A (Pilot-Synopsis-Rewrite + Status-Log) als zwei eigene Commits. Reihenfolge: Track B zuerst, dann Track A — so ist der Guard scharf, wenn du Track A schreibst, und der Re-Apply von Batch 020 prüft die neuen Synopsen tatsächlich gegen den Guard.

- **Re-Apply nur Batch 020.** Nach Track A: `npm run db:apply-override -- --batch=ssot-w40k-020`. Lauf updated 10 `works.synopsis`-Rows und triggert *keinen* Guard-Throw. Wenn der Lauf wirft → Track A ist nicht durch, du fixt die Synopsis nach.

- **Smoke gegen die Public-Page.** Nach Re-Apply Stichprobe gegen 3 von 10 `/buch/[slug]`-Slugs aus Batch 020 (deine Wahl, gerne die schwersten Fälle wie `the-soul-drinkers-omnibus` / `legacy` / `daenyathos`). Lokal oder gegen `https://chrono-lexicanum.vercel.app/` — beides OK. Snippet oder Screenshot im Report.

- **`npm run lint`** + **`npm run typecheck`** + **`npm run test:apply-override-dry`** grün. Tests, die durch den neuen Helper dazukommen, laufen mit. **`npm run brain:lint -- --no-write`** grün (keine Brain-Edits in dieser Session — Cowork pflegt Wiki im Hygiene-Pass nach 080-impl-Merge).

- **`sessions/README.md` Active-Threads.** Du fügst 080-arch + 080-impl-Zeile rein, prunst keine vorhandenen Zeilen.

- **Dry-Run-Vergleichsbasis-Snapshot (P3-präzisiert).** `npm run test:apply-override-dry` läuft sowieso über alle 001..020 (siehe Apply-vs-Dry-Semantik weiter oben). Im Report listest du *report-only*, was der Synopsis-Lint pro Batch gefunden hat — als Pre-Mess-Telemetrie für Brief 081. Erwartung pro § Context-Tabelle: 001..005 zeigen 0 Treffer in allen Pattern-Klassen, 006..008 zeigen ein paar W40K-IDs (`(W40K-NNNN)`-Cross-Refs) und vereinzelte `authority-layer`-Vorkommen, 009..019 zeigen volle Pollution-Profile, 020 nach deinem Track-A-Rewrite zeigt 0. **Keine Edits an 001..019 in dieser Session.** Wenn 006..008 Treffer haben, die nach „echtem Müll" aussehen (nicht typografische Cross-Refs), kurze Note im Report — Cowork promotet das ggf. als OQ.

## Out of scope

- **Batches `ssot-w40k-009..019` Rewrite.** Folge-Brief 081 (Standing-Loop-Pattern, 1 Batch pro `/clear`-Session, 11 Iterationen). **Nicht** in 080 anfassen — das ist die zentrale Token-Disziplin dieses Briefs.

- **Batches `ssot-w40k-001..008`.** Sind gemessen clean. Optional-Dry-Check (s. o.) ist erlaubt; *Edits* sind nicht.

- **HH-Domain.** Files existieren heute nicht. Forward-Discipline + Apply-Guard greifen automatisch, wenn HH-Loop dazukommt.

- **Junctions / facetIds / Flags.** `overrides.facetIds`, `overrides.factions[]`, `overrides.locations[]`, `overrides.characters[]`, `overrides.flags[]` bleiben byte-identisch. Apply-Guard prüft *nur* die Synopsis-Spalte.

- **`book_details.notes` / `---surfaceForms---`-Block.** Apply-Skript schreibt sie weiter wie bisher (Brief 077). Guard betrachtet sie nicht.

- **Trigger-Heredoc-Edit in `run-ssot-loop.sh`.** Discipline ist seit Brief 076 verankert, Apply-Reject ist Enforcement. Heredoc bleibt unangetastet.

- **Cockpit-/UI-Änderungen.** Keine. Public-Verbesserung kommt rein aus saubereren `works.synopsis`-Daten.

- **Schema-Migration.** Keine.

- **WebSearch in Track A.** Verboten. Plot-Verifikation ist nicht Zweck dieser Session — Curation-Vokabular-Cleanup ist es.

- **Wiki-Pflege.** Cowork pflegt `project-state.md` / `pipeline-state.md` / `log.md` / `open-questions.md` im Hygiene-Pass *nach* 080-impl-Merge. CC editiert keine Wiki-Pages.

- **`brain:lint`-Integration.** Guard sitzt im Apply-Skript, nicht im Brain-Lint. Wenn ein Pre-Commit-Hook auf die JSON-Files lohnt, ist das ein eigener kleiner Folge-Brief.

## Acceptance

The session is done when:

- [ ] **Track B — Pure Helper committed.** `scripts/apply-override-synopsis-lint.ts` (oder gewählter Pfad) als pure Helper-Funktion mit DI-Signatur, analog zum Brief-077-Pattern.

- [ ] **Verboten-Patterns persistiert.** JSON-File in `scripts/seed-data/` (Vorschlag: `synopsis-banned-patterns.json`) oder Code-Inline-Array (mit Begründung im Report) trägt die Match-Liste aus § Constraints.

- [ ] **Apply-Wiring scharf.** `scripts/apply-override.ts` ruft den Lint-Guard vor jedem `works.synopsis`-Write. `scripts/apply-override-dry.ts` ruft ihn ebenfalls. Hard throw mit `externalBookId` + `slug` + Batch-Name + Pattern-Labels + 40-Zeichen-Snippet im Error-Text.

- [ ] **Tests grün.** Mindestens drei Cases: clean passes, polluted throws, edge-case mit Single-`*`-Italic-Distinction. Tests laufen via `npm run test:apply-override-dry` oder einer passenden Test-Runner-Form mit.

- [ ] **Track A — `ssot-w40k-020.json` rewritten.** 10 `overrides.synopsis`-Strings durchgängig auf Public-Reader-Copy (Verboten-Pattern-Count = 0, Längen-Korridor 200–500 mit Soft-Cap 600 für Omnibi, Mittel 300–400). Alle anderen File-Felder byte-identisch (Diff zeigt nur Synopsis-Lines).

- [ ] **Verboten-Pattern-Re-Mess.** Mess-Befehl (siehe § Notes) zeigt für Batch 020 post-Rewrite **0 Treffer** in allen vier Pattern-Klassen (`**`, `authority[- ]layer`, `[Bb]rief[- ][0-9]`, `W40K-[0-9]`). Mess-Tabelle im Report.

- [ ] **Re-Apply Batch 020 grün.** `npm run db:apply-override -- --batch=ssot-w40k-020` läuft ohne Guard-Throw, updated 10 `works.synopsis`-Rows. Sanity-Probe: ein vorheriger Lauf gegen einen anderen Batch (z. B. trockenes `apply-override.ts`-Skript gegen `ssot-w40k-019.json` mit dem alten polluted Inhalt) würde **werfen** — du musst diesen Lauf *nicht* fahren (out-of-scope, polluted Files bleiben polluted bis Brief 081), aber der Guard ist nur dann sinnvoll demonstriert, wenn der Real-Apply hard-fail-Fähigkeit hat. Das wird stattdessen durch den polluted-throws-Unit-Test (siehe nächster Punkt) abgedeckt.

- [ ] **Public-Smoke.** 3 von 10 Pilot-Slugs auf `/buch/[slug]` (lokal oder prod) — Synopsis rendert ohne Markdown-Artefakte. Snippet oder Screenshot im Report.

- [ ] **Status-Log-Append.** `sessions/ssot-loop-log.md` hat einen Pilot-Block (Datum, Batch, Pre/Post-Längen-Statistik, Voice-Note-an-Maintainer).

- [ ] **`sessions/README.md` Active-Threads-Update.** 080-arch + 080-impl-Zeilen ergänzt, andere unangetastet.

- [ ] **`npm run test:apply-override-dry` läuft grün** (Exit 0). Synopsis-Lint-Treffer für die Batches 009..019 erscheinen im Dry-Report als Inspektions-Output, nicht als Failure (siehe § Constraints „Apply-vs-Dry-Semantik"). Telemetrie-Tabelle (Treffer-Counts pro Batch) wird im 080-impl-Report dokumentiert — Pre-Mess-Baseline für Brief 081.

- [ ] **Commits getrennt.** Mindestens zwei: Track B (Helper + Pattern-File + Wiring + Tests), Track A (Synopsis-Rewrite + Status-Log).

- [ ] **Lint / Typecheck / Tests grün.** `npm run lint`, `npm run typecheck`, `npm run test:apply-override-dry`, `npm run brain:lint -- --no-write`.

- [ ] **Session-Token-Disziplin.** Realistische Ziel-Spanne ist **50–80k Tokens** (Pflicht-Start-Lese-Docs + Code-Wiring-Fläche `apply-override.ts ~39k chars` + `apply-override-dry.ts ~21k chars` + Helper + Test + 10 Synopsis-Rewrites). Wenn du am Ende deutlich >120k landest, im Report notieren — Material für Loop-Format-Justierung des Folge-Briefs 081.

## Open questions

Du beantwortest im Report:

- **Voice-Note für den Folge-Loop 081.** Welche Voice-Entscheidungen hast du beim Pilot getroffen (In-Universe-Vokabular-Level, Setup-vs-Premise-Eröffnung, Tonality-Marker als Prose statt Tag, Sentence-Rhythm, Omnibus-vs-Standalone-Formel)? Welche davon hältst du für übertragbar auf die 110 Folge-Bücher, welche solltest du je nach Buch-Genre/Sub-Setting variieren?

- **`*`-Italic-Detection-Edge-Cases.** Beim Track-B-Guard — wie weich/strict hast du Single-`*`-Match gegen Double-`**`-Match gehalten? False-Positive-Sorgen-Cases?

- **Pattern-File-Form.** JSON in `scripts/seed-data/` oder Code-Inline-Array? Wenn JSON: hast du die Vorschlag-Form (`{ kind, value, label }`) genommen oder eine andere Struktur? Architekt-OK für jede begründete Wahl.

- **Token-Verbrauch-Beobachtung.** Wie viele Tokens hat die Session ungefähr verbraucht (input + output)? Wenn deutlich unter 40k, ist 081 als Standing-Loop entspannt; wenn >60k, müssen wir die Form für 081 nochmal nachjustieren.

- **Optional-Dry-Run gegen 001..008.** Wenn der Dry trotz „clean" gemessenem Status Treffer wirft, kurze Auflistung — wahrscheinlich seltene Edge-Cases (z. B. `*Crossfire*` als typografisches Werkstitel-Quoting). Material für eine Pattern-Justierung im Loop 081 oder eine Allowlist-Erweiterung.

## Notes

### Mess-Befehl für die Re-Mess-Akzeptanz

```bash
f=scripts/seed-data/manual-overrides-ssot-w40k-020.json
stars=$(jq -r '[.books[].overrides.synopsis] | join(" ") | [scan("\\*\\*")] | length' "$f")
authlayer=$(jq -r '[.books[].overrides.synopsis] | join(" ") | [scan("authority[- ]layer")] | length' "$f")
brieftalk=$(jq -r '[.books[].overrides.synopsis] | join(" ") | [scan("[Bb]rief[- ][0-9]")] | length' "$f")
wid=$(jq -r '[.books[].overrides.synopsis] | join(" ") | [scan("W40K-[0-9]")] | length' "$f")
echo "Batch 020 post-rewrite: **=$stars  authority-layer=$authlayer  Brief-NNN=$brieftalk  W40K-NNNN=$wid"
```

Acceptance: jede Zahl = 0.

### Helper-Shape-Skizze (illustrativ, nicht final)

```ts
// scripts/apply-override-synopsis-lint.ts (Skizze)
export interface SynopsisLintHit {
  patternLabel: string;
  matchedText: string;
  position: number;
  snippet: string; // 40 chars around match
}

export interface SynopsisLintResult {
  externalBookId: string;
  slug: string;
  hits: SynopsisLintHit[];
}

export function lintSynopsis(
  externalBookId: string,
  slug: string,
  synopsis: string,
  patterns: ReadonlyArray<{ kind: "regex" | "substring"; value: string; label: string }>,
): SynopsisLintResult { /* … */ }
```

Wiring in `apply-override.ts` (Skizze):

```ts
const lintResult = lintSynopsis(book.externalBookId, book.slug, book.overrides.synopsis, BANNED_PATTERNS);
if (lintResult.hits.length > 0) {
  const summary = lintResult.hits
    .map((h) => `${h.patternLabel} → "${h.snippet}"`)
    .join("; ");
  throw new Error(
    `[apply-override] synopsis-lint failed for ${book.externalBookId} (${book.slug}) in batch ${batch}: ${summary}`,
  );
}
```

Voice + exakte Form sind deine Wahl (siehe § Design freedom). Wichtig ist: hard throw, alle Treffer sichtbar, Maintainer kann den Pattern + Position eindeutig zuordnen.

### Voice-Korridor-Beispiel (illustrativ)

**Pre (W40K-0200 `legacy`, ~1.087 chars):**
```
**Legacy** (Matthew Farrer, 2004) — Shira Calpurnia #2, direct sequel
to *Crossfire* (W40K-0199). The rich and influential **Rogue Trader
Hoyyon Phrax** has died, and his **Charter of Trade** — an extremely
ancient document **signed by the Emperor Himself**, making it not
merely a legal instrument but a **holy relic** in the eyes of
ambitious clerics — … **First authority-layer Hoyyon Phrax + first
authority-layer Phrax Trading Charter + first authority-layer Rogue
Traders in the Arbites line + first authority-layer Emperor-signed-
charter-relic register surface forms.**
```

**Post-Korridor (~350 chars, illustrativ — nicht prescriptive):**
```
The death of a rich and ancient Rogue Trader brings his Charter of
Trade — a relic literally signed by the Emperor — to the fortress-
system of Hydraphur, where Arbites officer Shira Calpurnia must see
the inheritance carried out under Imperial law. Rival heirs and
ambitious Ecclesiarchy clerics have other plans, and the procedural
quickly turns into a court-intrigue thriller.
```

Voice-Punkte aus dem Beispiel: kein Markdown, kein Cross-Ref-Tail, kein „surface form"-Suffix, Plot-Kern intakt, Tonality (procedural / court-intrigue / thriller) als Prose statt als Audit-Tag. Voice und exakte Wortwahl bleiben deine Entscheidung — siehe § Design freedom.

### Voice-Note-an-Maintainer-Form (Vorschlag)

Im Status-Log-Block für den Pilot, eingebettet unter dem H2-Header:

```markdown
**Voice notes for follow-up loop 081:**
- In-universe vocabulary level: kept "Astartes" / "Arbites" but explained "Excommunicate Traitoris" once on first use.
- Opening pattern: ~6 of 10 books open with premise sentence ("A renegade Soul Drinkers chapter ..."), ~4 with setup ("On the fortress-system of Hydraphur ...").
- Tonality marker placement: woven into closing sentence as prose, never as standalone tag.
- Omnibus formula at ~400 chars (vs. cap 600) felt right; doorstopper 600-char form was not needed.
```

Form ist Vorschlag — exakte Struktur deine Wahl, solange Maintainer die übertragbaren Voice-Entscheidungen identifizieren kann.

### Anschluss-Hinweis für die Wiki-Hygiene (Cowork)

Nach 080-impl-Merge updated Cowork in einem batched Hygiene-Pass:

- `brain/wiki/project-state.md` § „Latest pipeline state" — Brief 080 als Forward-Guard + Pilot-Eintrag.
- `brain/wiki/pipeline-state.md` § Apply-Layer-Erweiterung um den Synopsis-Lint-Guard analog der Brief-077-Skip-Logik.
- `brain/wiki/log.md` — Brief-080-Eintrag.
- `brain/wiki/open-questions.md` — kein neuer OQ-Eintrag erwartet, außer der Pilot-Voice-Feedback öffnet eine Folge-Frage für 081.
- Brief 081 (Folge-Loop für 110 verbleibende Bücher in Batches 009..019) wird **nach** dem Pilot-Voice-Feedback geschrieben — Maintainer kann an dem 10er-Pilot die Voice-Entscheidungen sehen und in 081 als § Constraints reinschreiben (oder gar nicht, falls die Pilot-Voice passt).
