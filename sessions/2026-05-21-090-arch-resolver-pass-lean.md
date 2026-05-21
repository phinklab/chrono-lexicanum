---
session: 2026-05-21-090
role: architect
date: 2026-05-21
status: open
slug: resolver-pass-lean
parent: 2026-05-21-089-arch-resolver-pass-5
links:
  - 2026-05-11-061-arch-ssot-loop
  - 2026-05-13-071-arch-loop-driver
  - 2026-05-16-076-arch-resolver-batch-4-axis-sliced
  - 2026-05-21-088-arch-ssot-loop-lean
commits: []
---

# Resolver-Pass lean — Token-Budget pro Phase, schlankes Runbook, 100er-Takt

## Goal

Den Resolver-Pass so umbauen, dass **jeder `/clear`-begrenzte Arbeitsschritt unter ~120k Tokens abschließt**, und den Resolver-Takt von 50 auf 100 Bücher anheben (nächste Resolver-Pause bei **350** Büchern, dann 450, 550 … — keine Übergangs-Pause bei 300) — damit größere Wellen möglich werden, ohne dass eine Phase in die Dumb-Zone driftet.

Der Standing-Loop wurde mit Brief [088](./2026-05-21-088-arch-ssot-loop-lean.md) zu einem mechanischen Task mit schlankem Runbook (~6k statt ~55k+ Tokens pro Iteration). Der **Resolver-Pass hat diese Behandlung noch nicht** — er ist heute der teure, drift-anfällige Teil der Pipeline. Dieser Brief macht für den Resolver dieselbe Bewegung: ein schlankes `resolver-pass-runbook.md`, token-gebudgetete Phasen, korpus-größen-unabhängige Integration, und das Konsolidieren der pro-Pass geklonten `-NNN`-Skripte zu stabilen Tools. Sekundär-Effekt mit gleichem Gewicht: ein Resolver-Pass soll künftig — wie eine Loop-Iteration — **ohne eigenen Architekten-Brief** auskommen, solange er keinen echten neuen Architektur-Call trägt.

## Context

- **Stand 2026-05-21, post-089.** 250 W40K-Bücher in der Authority-Schicht und in Postgres applied, fünf Resolver-Pässe durch (063–069 / 072 / 074 / 076 / 089), `origin/main` auf `d46bf6a`. Die nächste erwartete Reihenfolge war bisher: Loop-Re-Trigger `ssot-w40k-026..030` → Resolver-Pass-6-Brief bei der 300er-Pause. Dieser Brief schiebt sich davor: er baut die Maschinerie um, *bevor* der nächste Pass läuft — und verschiebt dabei mit dem 100er-Takt (Baustein 5) die nächste Resolver-Pause von 300 auf 350, sodass die erste neue Welle `251..350` umfasst.
- **Maintainer-Beobachtung (das Problem).** Ein Resolver-Pass beendet Sessions heute bei ~550k Tokens. Die Dumb-Zone — sichtbarer Qualitätsverfall in Sub-Aufgaben — beginnt ab ~120k. Brief 076 hatte das schon benannt („einzelne Subsessions > 100k Tokens zeigen sichtbar Drift"), das Axis-Slicing war die erste Antwort darauf. Sie reicht nicht: die Phasen selbst sind zu groß.
- **Maintainer-Verdacht zur Token-Quelle.** Verteilt über die Phasen, „aber es geht schon sehr viel drauf beim Dokumente-Lesen". Keine präzise Messung vorhanden — deshalb ist **Messen Baustein 1** (siehe unten). Bekannter struktureller Treiber: jede Phase kann heute Brief 076 (~33k Tokens) **plus** den Per-Pass-Brief lesen, bevor überhaupt Arbeit beginnt. Brief 089 verweist explizit: „CC liest `sessions/2026-05-16-076-...` § Constraints + Phase 0–4, bevor es startet." Genau dieses Vorab-Lesen ist das, was der Loop mit Brief 088 abgeschafft hat.
- **Der Aggregator ist schon mechanisch.** `scripts/aggregate-surface-forms-089.ts` liest die Override-Files + den Roster + die Reference-JSONs deterministisch und emittiert 6 der 7 Dossier-Pflichtsektionen als Markdown. Phase 0 muss die Override-Files also gar nicht selbst lesen — sie muss es nur *nicht trotzdem tun*. Das ist eine Runbook-Disziplin, kein neuer Code.
- **Phase 4 skaliert mit dem Gesamt-Korpus.** Phase 4 re-applied `001..NNN` sequentiell (Resolver-Set-Drift-Cleanup für die Altbestände + First-Apply für die neue Welle). Bei 250 Büchern sind das 25 Batch-Applies, bei 859 Büchern 86 — der einzige Teil des Passes, dessen Kosten *unbegrenzt* mit dem Korpus wachsen. Mit 100er-Wellen wird das der scharfe Engpass.
- **Per-Pass-`-NNN`-Skript-Klone.** `aggregate-surface-forms-076.ts` / `-089.ts`, `seed-facets-089.ts`, `run-phase4-apply-NNN.sh`, diverse `scripts/*-NNN.ts` werden pro Pass neu geklont. Das ist selbst Overhead — sowohl an CC-Arbeit als auch an Tokens (den alten Klon lesen, um den neuen zu schreiben).
- **Cadence-Mechanik.** Der 50er-Takt lebt in `scripts/loop-next-batch.ts` (`cumulativeBefore % 50 === 0`, Pure-Funktion `decideNextBatch`, getestet via `npm run test:loop-next`). Die Resolver-Pause ist seit Brief 088 selbst-erkennend über den `⏸ Resolver-Pause bei N Büchern`-Block im Loop-Log.
- **Maintainer-Entscheidungen (AskUserQuestion, 2026-05-21).** (1) Resolver-Takt → **alle ~100 Bücher**. (2) Token-Quelle → **erst messen lassen** (verteilt, Dokumente-Lesen auffällig). (3) Verschlankung → **schlankes Runbook, supervised** — der Maintainer fährt die Phasen weiter manuell mit `/clear`; der Driver `run-resolver-pass.sh` bleibt als Option erhalten, wird aber **nicht** scharfgeschaltet.

## Umbau — die fünf Bausteine

Architektonische Reihenfolge; CC darf innerhalb dieser Bausteine die konkrete Form wählen.

### 1. Messen zuerst

Bevor irgendetwas zerschnitten wird: CC schätzt die **Input-Token-Last jeder heutigen Phase** gegen den vorhandenen `001..025`-Korpus — deterministisch aus Datei-Größen (Brief 076, Per-Pass-Brief, Dossier, Reference-JSONs, Override-Files, Loop-Log-Blöcke) und aus den Apply-Log-Größen für die Phase-4-Schritte (`wc -c`, grob ÷4 für Tokens). Ergebnis: eine kurze Tabelle „Phase → geschätzte Input-Tokens", im Impl-Report. Der Befund priorisiert den Rest des Umbaus — besonders, wie tief Phase 4 zerschnitten werden muss. „Simplest thing first": nicht blind redesignen, erst sehen, wo es brennt.

**Abzweigung — der Mess-Befund ist ein echter Gate, kein Formalismus.** Zeigt die Messung, dass (a) der dominante Token-Treiber *nicht* dort liegt, wo dieser Brief ihn vermutet (Phase-4-Korpus-Skalierung + Vorab-Dokumente-Lesen), sodass die Bausteine 2–5 das ~120k-Ziel plausibel verfehlen, **oder** (b) eine Phase auch *nach* dem geplanten Umbau über dem ~60k-Read-Scope-Budget bliebe (z. B. weil eine Reference-JSON strukturell im Volltext gelesen werden muss — siehe die Phase-3-Frage unter Open questions) — dann stoppt CC nach Baustein 1: Mess-Befund + die konkrete Diskrepanz in den Impl-Report, Brief-Status `needs-decision`, die Bausteine 2–5 werden **nicht** blind durchgezogen. Das ist ein erfolgreicher Ausgang, kein gescheiterter — Cowork plant den Umbau dann mit den echten Zahlen neu (Endzustand (B) unter Acceptance). Trägt der Befund die Design-Prämisse, läuft der Rest des Briefs normal durch. Dieselbe `needs-decision`-Disziplin gilt, wenn sich erst *während* des Umbaus zeigt, dass eine Phase das Budget strukturell nicht erreichen kann.

### 2. Schlankes `resolver-pass-runbook.md`

Ein Runbook unter **`sessions/resolver-pass-runbook.md`** (gleicher Ort wie [`sessions/ssot-loop-runbook.md`](./ssot-loop-runbook.md)): die **ausführbare Spec** für genau eine Resolver-Pass-Phase. Pro Phase trägt es eine explizite **„Lies NUR …"-Regel** (die Anti-Bloat-Regel des Loop-Runbooks, §2 dort). Eine Phase liest künftig: das Runbook + das Dossier + ihr **phasen-spezifisches Achs-Paket** — **nicht** Brief 076, **nicht** den Per-Pass-Brief im Volltext, **nicht** die Override-Files.

Das **Achs-Paket** ist die definierte, kleine Datei-Menge einer Phase — ausdrücklich nicht „eine Datei". Es ist pro Phase im Runbook benannt und entspricht dem heutigen Phasen-Write-Scope der `resolver-pass.config.json`: z. B. Factions = `factions.json` + `faction-aliases.json` + ggf. `faction-policy.json` + `test-resolver.ts`; Locations und Characters analog mit ihren Sidecar-/Alias-/Test-Dateien. Die Phase liest genau ihr Paket, sonst nichts.

Brief 076 wird damit zu Design-Rationale, exakt wie Brief 061 nach Brief 088: er bekommt oben einen Zeiger-Banner („operative Phasen-Spec lebt jetzt in `sessions/resolver-pass-runbook.md`; dieser Brief = Design-Rationale, für einen Pass nicht lesen"). Der Inhalt von 076 wird nicht gelöscht — nur entwertet als Pflichtlektüre.

**Damit ein Pass wirklich ohne Architekten-Brief läuft**, reicht das Runbook allein nicht — zwei Sperren müssen weg:

- **Session-Start-Routine.** `CLAUDE.md` und `AGENTS.md` erzwingen heute die Session-Start-Leseroutine + das Lesen des höchsten offenen Briefs und kennen als Ausnahme nur die SSOT-Loop. Sie bekommen eine **Resolver-Runbook-Ausnahme analog zur SSOT-Loop-Ausnahme**: eine Resolver-Pass-Phase ist ein gescopeter Task — folge `sessions/resolver-pass-runbook.md`, überspringe die Session-Start-Routine, Brief 076 wird nicht gelesen.
- **Driver-Brief-Zwang.** `scripts/run-resolver-pass.sh` verlangt heute eine existierende `brief`-Datei (`die 1 "config missing .brief"`, `[[ ! -f "$BRIEF_PATH" ]]`) und injiziert `Brief: $BRIEF_PATH` in jeden Phasen-Trigger. Künftig ist **`runbook` das operative, required Config-Feld**, `brief` wird **optional / rationale-only** — der Driver läuft ohne Brief-Datei und injiziert den Runbook-Pointer in den Trigger.

### 3. Phase 0 token-dicht

Runbook-Regel für Phase 0: liest **nur** die Aggregator-Ausgabe + die für die Cluster-Orientierung relevanten Loop-Log-Blöcke (Tail-Read der betroffenen Blöcke, nicht die 1000+-Zeilen-Datei — dieselbe Disziplin wie Loop-Runbook §8 fürs Anhängen). Die 50–100 Override-Files werden **nie** von der Phase-0-Subsession gelesen; der Aggregator hat sie schon verarbeitet. Wenn der Aggregator dafür mehr emittieren muss (z. B. eine erste maschinelle Cross-Batch-Alias-Kandidaten-Liste oder eine `needs-decision`-Heuristik, damit die LLM-Sektionen des Dossiers schrumpfen), ist das Teil dieses Bausteins — CC's Call, ob es sich lohnt.

### 4. Phase 4 von der Korpus-Größe entkoppeln

Jeder Phase-4-Schritt, dessen Kosten **mit der Gesamt-Buchzahl wachsen** — der Re-Apply `001..NNN`, die Smoke-Slug-Checks, die Audit-Cockpit-SQL-Replica — läuft als Skript, das einen **Digest fester Größe** emittiert (eine Counts-Tabelle, eine Inserts/Updates-pro-Batch-Tabelle, eine Smoke-Tabelle). Die LLM-Subsession liest den Digest, **nie** die Per-Batch-Rohausgabe. So ist die Token-Last von Phase 4 unabhängig davon, ob 25 oder 86 Batches re-applied werden.

Erwartete Form: ein Split in **Phase 4a** (Integrations-Code — `seed-resolver-extensions.ts` erweitern, Test-Trias-Range ziehen, ggf. Call-spezifische Edits) und **Phase 4b** (Apply + Verify + Report über Digests). Ob ein Split nötig ist und wie tief, entscheidet der Mess-Befund aus Baustein 1 — wenn ein ungeteiltes Phase 4 mit Digest-Skripten schon unter dem Budget bleibt, ist das auch in Ordnung. Acceptance-Kriterium ist das Outcome (≤120k), nicht die Phasen-Zahl.

### 5. `-NNN`-Skript-Klone konsolidieren + 100er-Takt

- **Skript-Konsolidierung.** Die pro Pass geklonten Skripte (`aggregate-surface-forms-NNN.ts`, `seed-facets-NNN.ts`, `run-phase4-apply-NNN.sh`, sonstige `scripts/*-NNN.ts`) werden zu **stabilen, wave-parametrisierten** Tools — die Batch-Range / der Wellen-Parameter kommt aus Args oder aus der Per-Pass-Config, nicht aus hartcodierten Literalen. Die Determinismus-/Re-Run-Anker-Eigenschaft bleibt erhalten, weil die Config committet ist. Ergebnis: ein künftiger Pass legt **keine neuen `-NNN`-Klone** mehr an.
- **100er-Takt.** Die Cadence-Konstante in `scripts/loop-next-batch.ts` (heute `cumulativeBefore % 50 === 0`) wird auf den 100er-Takt umgestellt; `npm run test:loop-next` zieht mit; die Loop-Runbook-Texte mit „50" / „next-50" (`ssot-loop-runbook.md` §3/§8) und `run-ssot-loop.sh` werden konsistent nachgezogen. CC greppt selbst alle 50er-Vorkommen. **Cadence ab jetzt:** nächste Pause bei **350** (Welle `251..350` = volle 100 Bücher), danach 450, 550 … — es gibt **keine** Übergangs-Pause bei 300. Empfohlene Arithmetik: `cumulativeBefore % 100 === 50` — das trifft 350/450/550, lässt 300 bewusst aus und ist robust gegen einen evtl. veralteten `⏸ … bei 300`-Block im Loop-Log (`300 % 100 ≠ 50`). Die exakte Form ist CC's Call; die `decideNextBatch`-Pure-Funktion bleibt der Test-Seam und deckt die neue Cadence ab (inkl. des Falls „pausiert nicht bei 300").
- **`Decision`-Contract: nächste Pause introspektierbar.** Der Helper kennt heute nur den Boolean `resolverPause` plus `cumulativeBefore` — er kann nicht *benennen*, wo die nächste Pause liegt; ein Live-Lauf bei kumulativ 250 meldet schlicht `resolverPause: false` und sonst nichts zur Cadence (das macht die Acceptance sonst unscharf). Der `Decision`-Contract bekommt deshalb ein zusätzliches Feld (Vorschlag-Name `nextResolverPauseAt`): der kumulative Buch-Count, an dem der Loop als Nächstes *stoppt* — bei `resolverPause: true` ist das `cumulativeBefore` selbst, sonst die kleinste Cadence-Boundary echt größer als `cumulativeBefore` (250 → 350, 300 → 350, 340 → 350; 350 mit gesetztem Pause-Block → 450). Damit werden `npm run loop:next` und die Acceptance auf die Cadence prüfbar, statt nur den Boolean zu kennen. Feldname und exakte Form sind CC's Call; die `decideNextBatch`-Pure-Funktion bleibt der Test-Seam und deckt die Feld-Semantik mit ab.
- **`run-ssot-loop.sh` konkret nachziehen.** Der 50er-Sweep oben schließt `scripts/run-ssot-loop.sh` ein — dort reicht reines Suchen-Ersetzen aber nicht: Header-Docblock und Default-`ITERATIONS` sind heute als *Spec* auf den 50er-Takt formuliert (`default 5`, „5 batches × 10 books = 50 books before the next pause"). Sie werden auf den 100er-Takt umgeschrieben — Leitlinie: **ein** arg-loser Driver-Lauf landet weiterhin genau **eine volle Welle bis zur nächsten Pause**, in der 100er-Welt also 10 Batches; Default-`ITERATIONS`, die Docblock-Arithmetik und der `-h/--help`-Text ziehen entsprechend nach. Sonst fährt ein gewohnheitsmäßiger Lauf nur bis 300 (halbe Welle, keine Pause). Das *Ausführen* des Loops bleibt out-of-scope (siehe unten) — dieser Brief macht nur Skript-Text und -Default konsistent.

## Arbeits-Sequenz — `/compact`-Schnitte

Brief 090 handelt von Token-Disziplin — seine eigene Implementierung soll nicht in einer überlangen Session driften. Die fünf Bausteine geben die Reihenfolge; an zwei Stellen empfiehlt sich ein bewusster Kontext-Schnitt, damit kein Schritt die angesammelte Last des vorigen mitschleppt:

- **Nach Baustein 1 (Messen).** Der Mess-Schritt sammelt viel Datei-Größen-/`wc -c`-Rohausgabe an, die der Umbau danach nicht mehr braucht — gebraucht wird nur der *Befund* (die Tabelle im Report). Das ist ohnehin der needs-decision-Gate-Punkt: messen → Befund + Gate-Entscheidung in den Report → Schnitt → mit den Bausteinen 2–5 weiter.
- **Vor dem Validierungs-Re-Apply / Dry-Rehearsal gegen `001..025`** (der „Testrun"). Der Umbau ist dann geschrieben; der Testrun läuft besser mit geschlanktem Kontext — und spiegelt nebenbei, wie eine echte Resolver-Phase später laufen soll.

`/compact` ist das Minimum, `/clear` die Option: An beiden Schnitten reicht in der Regel ein `/compact` — es wirft die Token-Last ab, ohne den roten Faden zu verlieren. Ein volles `/clear` ist die schwerere Variante, wenn ein wirklich frischer Kontext hilft und der nächste Schritt aus Brief + Report selbsttragend ist (nach `/clear` liest CC den Brief bzw. den nächsten Baustein neu). Welche Stufe wann — CC's Call nach Kontext-Füllstand. Innerhalb des Umbaus (Bausteine 2–5) darf CC zusätzlich nach Bedarf `/compact`en; feste Grenzen schreibt dieser Brief dort nicht vor.

## Constraints

- **Token-Budget.** Die Dumb-Zone beginnt ~120k Total-Kontext — das ist die Decke, unter der jeder `/clear`-begrenzte Schritt bleiben soll. Verlässliche Telemetrie für den tatsächlichen Modell-Kontext pro `/clear`-Subsession gibt es nicht; das **verifizierbare** Kriterium ist deshalb zweiteilig: (a) der statische Read-Scope einer Phase — die Dateien + Digests, die sie liest — liegt, nach Bytegröße ÷ 4 als Token-Schätzung gerechnet, bei ≤ ~60k Token; (b) kein Schritt zieht Rohlogs (Per-Batch-Apply-Output, Volltest-Output) in den Kontext, nur Digests fester Größe. Die ~60k-Input-Decke lässt Raum für Tool-Ausgaben + Generierung innerhalb der 120k.
- **Resolver-Semantik unverändert.** Surface-Form → canonical ID via **direct match → alias lookup** über `src/lib/resolver/index.ts` + die Sidecar-JSONs. Keine Fuzzy-Logik, keine Slug-Heuristik, keine generische Title-Normalisierung. Was nicht direct/alias matcht, bleibt unresolved (Cockpit-Drift-Bucket) — wie heute.
- **Keine Schema-Migration**, kein Touch an `src/db/schema.ts` / `src/db/migrations/`. Harter Blocker → `needs-decision`-Stop.
- **Determinismus bleibt.** Aggregator und Apply-Skripte bleiben re-runnable und produzieren bei gleichen Inputs byte-identische Ausgabe.
- **Der Driver bleibt erhalten.** `scripts/run-resolver-pass.sh` wird **nicht** gelöscht und **nicht** scharfgeschaltet (Maintainer-Wahl: supervised). Aber Runbook und Driver müssen konsistent bleiben: die `trigger`-Strings in `resolver-pass.config.json` zeigen künftig auf eine Runbook-Sektion („Phase N — siehe `sessions/resolver-pass-runbook.md` §N"), statt die Spec zu duplizieren. Das Runbook ist die eine Quelle der Wahrheit; `runbook` wird das required operative Config-Feld, `brief` wird optional/rationale-only, und der Driver verlangt keine existierende Brief-Datei mehr (Mechanik in Baustein 2).
- **Dieser Brief fährt keinen Produktiv-Pass.** Validierung läuft gegen den vorhandenen `001..025`-Korpus: der Re-Apply ist idempotent (delete-then-insert pro Junction), ein gemessener Dry-Rehearsal / Re-Apply über die 250 Bücher ist sicher und ist genau das, was Phase 4 ohnehin tut.
- **Keine Tool-Versionen pinnen, keine neuen Dependencies** — ein Refactor dieser Art braucht keine.
- **Worktree.** Batches-Strang. Arbeite in `C:\Users\Phil\chrono-lexicanum-batches` auf einer frischen `codex/ingest-batches-resolver-pass-lean`-Branch aus aktuellem `origin/main`. Falls `git status` den Coordination-Worktree oder `main` zeigt: stoppen, wechseln, frische Branch.
- **Fremde/parallele Änderungen nicht zurücksetzen** (z. B. ein paralleler Loop-Lauf 026..030, ein Wiki-Hygiene-Pass).

## Out of scope

Implementer sind eifrig — diese Dinge bleiben **explizit unangetastet**:

- **Resolver-Pass 6 als echter Daten-Pass** (`251..350` — die erste volle 100er-Welle; es gibt **keinen** separaten `251..300`-Pass, der Umbau verschiebt die nächste Resolver-Pause von 300 auf 350). Das ist der erste Lauf der neuen Maschinerie und ein **separater, nach dem Umbau billiger Schritt** — runbook-getrieben, kein eigener großer Brief. Dieser Brief baut nur die Maschinerie.
- **Loop-Re-Trigger `ssot-w40k-026..035`** (bis zur 350er-Pause). Operativ, kein Brief. Läuft **idealerweise nach** Brief 090, damit die neue Cadence greift (nächste Pause 350, nicht 300). Falls der Loop vorher unter dem alten `%50`-Takt bis 300 läuft und dort einen `⏸ … bei 300`-Block setzt: die Pause-Detection aus Baustein 5 (`% 100 === 50`) hält 350 als nächsten echten Trigger — ein veralteter 300-Block verschiebt nichts.
- **Den Driver headless fahren / scharfschalten.** Bleibt Option für später; dieser Brief hält ihn nur konsistent.
- **Resolver-Matching-Semantik ändern**, Reference-Daten oder Override-Files inhaltlich umschreiben, HH-spezifischer Resolver, UI / Cockpit, V2-Pipeline (`src/lib/ingestion/**`), App-Routen.
- **OQ (3) Hand-Check-Workflow, OQ (13) Crawl-Simplification-Sichtung, OQ (14) Roster-Excel-Hygiene-Sweep** — bleiben in der Open-Questions-Queue, werden hier **nicht** adressiert.
- **Brain-Wiki** (`brain/wiki/**`). Cowork zieht den Wiki-Hygiene-Pass in einer eigenen Session nach dem Merge.

## Acceptance

Die Session hat **zwei zulässige Endzustände** — beide sind ein erfolgreicher Ausgang. Welcher gilt, entscheidet der Mess-Befund aus Baustein 1.

### (A) Umbau abgeschlossen — Brief-Status `implemented`

Der Regelfall. Die Session ist fertig, wenn alle folgenden Punkte grün sind:

- [ ] **Mess-Befund** im Impl-Report: eine Tabelle „heutige Phase → geschätzte Input-Token-Last" gegen den `001..025`-Korpus, mit benannter Haupt-Quelle (bestätigt oder widerlegt den Phase-4-/Dokumente-Lesen-Verdacht).
- [ ] **`sessions/resolver-pass-runbook.md`** existiert; pro Phase eine explizite „Lies NUR …"-Regel und ein benanntes Achs-Paket; eine Phase ist mit Runbook + Dossier + ihrem Achs-Paket vollständig handlungsfähig, **ohne** Brief 076 oder den Per-Pass-Brief im Kontext.
- [ ] **Brief 076** trägt oben einen Rationale-only-Zeiger-Banner auf das Runbook (analog Brief 061 nach Brief 088); der 076-Inhalt bleibt erhalten.
- [ ] **Read-Scope-Budget belegt:** für jede Phase ist der statische Read-Scope (Dateien + Digests) nach Bytegröße ÷ 4 als Token-Schätzung im Impl-Report tabelliert; Ziel ≤ ~60k Input pro Phase. Kein Phase-Schritt zieht Rohlogs in den Kontext — nur Digests fester Größe. Ein idempotenter Re-Apply / Dry-Rehearsal gegen `001..025` belegt, dass die umgebaute Phase 4 digest-only läuft.
- [ ] **Phase 4** ist so umgebaut, dass kein mit der Korpus-Größe wachsender Schritt Per-Batch-Rohausgabe in den LLM-Kontext zieht — Apply / Smoke / Audit-Replica laufen scriptgetrieben mit Digest-Ausgabe fester Größe.
- [ ] **Keine neuen `-NNN`-Skript-Klone** für einen künftigen Pass nötig; Aggregator, Facet-Seed und Phase-4-Apply sind stabile, wave-parametrisierte Tools.
- [ ] **Resolver-Takt ist 100 Bücher.** Die Cadence-Konstante in `loop-next-batch.ts` trifft die Boundaries 350/450/550, **nicht** 300. Der `Decision`-Contract trägt das neue Feld (Vorschlag: `nextResolverPauseAt`, Semantik in Baustein 5): `npm run loop:next` gegen den Live-Korpus `001..025` (kumulativ 250) emittiert `resolverPause: false` **und** `nextResolverPauseAt: 350`. `npm run test:loop-next` ist grün und deckt synthetisch ab: kumulativ 250 → `nextResolverPauseAt` 350; 300 → 350 bei `resolverPause: false` (300 ist **keine** Pause); 350 ohne Log-Pause-Block → `resolverPause: true`; 350 mit Log-Pause-Block → `nextResolverPauseAt` 450; sowie die Boundaries 450 und 550.
- [ ] **`run-ssot-loop.sh` auf 100er-Takt nachgezogen:** Header-Docblock, Default-`ITERATIONS` und `-h/--help`-Text formulieren den 100er-Takt — ein arg-loser Driver-Lauf landet eine volle Welle (10 Batches) bis zur nächsten Pause; alle übrigen `50`/`50er`/`next-50`-Vorkommen in Code, Kommentaren und Runbook-Texten sind mitgezogen.
- [ ] **Brief-freier Pass abgesichert:** `CLAUDE.md` + `AGENTS.md` tragen eine Resolver-Runbook-Ausnahme analog zur SSOT-Loop-Ausnahme (eine Resolver-Pass-Phase ist ein gescopeter Task — Session-Start-Routine übersprungen, Brief 076 nicht gelesen).
- [ ] **Driver konsistent:** `resolver-pass.config.json` trägt `runbook` als operatives required Feld, `brief` ist optional/rationale-only; `run-resolver-pass.sh` läuft ohne existierende Brief-Datei, injiziert den Runbook-Pointer und zeigt mit den `trigger`-Strings auf Runbook-Sektionen statt die Spec zu duplizieren.
- [ ] `npm run lint`, `typecheck`, `test:resolver`, `test:resolver-data`, `test:resolver-coverage`, `test:apply-override-dry`, `test:loop-next`, `brain:lint -- --no-write` laufen grün.
- [ ] Impl-Report `sessions/2026-05-21-090-impl-resolver-pass-lean.md` geschrieben; Status dieses Briefs auf `implemented`.

### (B) `needs-decision`-Stop nach Baustein 1 — Brief-Status `needs-decision`

Die Ausnahme, **nicht** der Default. Nur zulässig, wenn der Mess-Befund die Design-Prämisse widerlegt (Baustein 1 § Abzweigung: dominanter Token-Treiber woanders, sodass die Bausteine 2–5 das ~120k-Ziel verfehlen — oder eine Phase bliebe auch nach dem Umbau über dem ~60k-Read-Scope-Budget). Dann ist die Session fertig, wenn:

- [ ] **Mess-Befund** im Impl-Report wie unter (A): die Tabelle „heutige Phase → geschätzte Input-Token-Last" gegen den `001..025`-Korpus, mit benannter Haupt-Quelle.
- [ ] Die konkrete **Diskrepanz** zur Design-Prämisse ist im Report benannt — welcher Treiber bzw. welche Phase, welche Zahl, warum die Bausteine 2–5 das ~120k-Ziel so nicht erreichen.
- [ ] Die Bausteine 2–5 sind **bewusst nicht** ausgeführt (kein halber Umbau im Repo); Impl-Report `sessions/2026-05-21-090-impl-resolver-pass-lean.md` geschrieben; Status dieses Briefs auf `needs-decision`. Cowork plant den Umbau mit den echten Zahlen neu.

## Open questions

Inputs für den nächsten Architekten-Schritt, keine Blocker:

- Bestätigt der Mess-Befund den Phase-4-Verdacht, oder ist eine andere Phase der eigentliche 550k-Treiber?
- Skaliert Phase 3 (`characters.json` wächst mit jeder Welle — heute 199 Rows) bei künftigen 100er-Wellen noch in den Budget-Rahmen, oder braucht es perspektivisch einen Chunk-Mechanismus, damit eine Phase die Reference-JSON nicht mehr im Volltext lesen muss?
- Reicht ein rein runbook-getriebener Pass ohne Cowork-Brief für Wellen ohne neuen Architektur-Call — oder bleibt pro Pass ein Mini-Brief sinnvoll? (Zielbild: nur Pässe mit echtem neuen Call — neuer Vokabel-Wert, neuer Browse-Root, harte Alias-Identitäts-Entscheidung — bekommen eine kurze Cowork-Notiz; siehe Notes.)

## Notes

- **Analogie-Vorlage.** Brief [088](./2026-05-21-088-arch-ssot-loop-lean.md) (`ssot-loop-lean`) hat aus Brief 061 die operative Spec in `ssot-loop-runbook.md` extrahiert und 061 auf Design-Rationale reduziert. Dieser Brief macht exakt dieselbe Bewegung für den Resolver-Pass: Brief 076 → `resolver-pass-runbook.md`. Wer 088/061 als Muster liest, hat die halbe Arbeit verstanden.
- **Ziel-Betriebsmodell.** Nach diesem Umbau soll ein Resolver-Pass so funktionieren wie eine Loop-Iteration: Config + Runbook genügen, kein Architekten-Brief. Nur Pässe mit einem genuinen neuen Architektur-Call (ein neuer `facet-catalog`-Wert wie `commissar` in 089, ein neuer Browse-Root, eine harte Charakter-Identitäts-Entscheidung) bekommen weiterhin eine kurze Cowork-Notiz — die mechanische freq≥2-Promotion + kuratierte freq=1-Iconics + Alias-Konsolidierung sind eine stabile Regel, die ins Runbook gehört. Das spiegelt das Loop-Modell: die Iteration braucht keinen Brief, nur Änderungen *am Loop* brauchen einen.
- **Cadence.** Nächste Pause nach dem Umbau bei **350** Büchern → erste 100er-Welle `251..350`. Danach 450, 550, … Keine Übergangs-Pause bei 300.
- **Worktree-Startanweisung.** Arbeite ausschließlich im Batches-Worktree `C:\Users\Phil\chrono-lexicanum-batches`. Branch `codex/ingest-batches-resolver-pass-lean` aus frischem `origin/main`. `main` ist read-only.
- **Keine Code-Skizzen nötig** — die Vorlagen existieren alle im Repo: `ssot-loop-runbook.md` (Runbook-Form), `loop-next-batch.ts` (Cadence-Konstante + Test-Seam), `aggregate-surface-forms-089.ts` (der zu parametrisierende Aggregator), `run-resolver-pass.sh` + `resolver-pass.config.json` (Driver + Config), Brief 076 (die zu extrahierende Spec).
