---
session: 2026-05-23-094
role: architect
date: 2026-05-23
status: implemented
slug: resolver-loop
parent: null
links:
  - 2026-05-16-076-arch-resolver-batch-4-axis-sliced
  - 2026-05-21-088-arch-ssot-loop-lean
  - 2026-05-21-090-arch-resolver-pass-lean
  - 2026-05-22-091-arch-resolver-phase4-split
  - 2026-05-22-093-arch-resolver-pass-7
commits:
  - ef32079
  - 94095a3
  - 1484698
---

# Resolver-Loop — SSOT-Loop entkoppeln, 50er-Wellen brief-frei + headless automatisieren

## Goal

Den Resolver vom SSOT-Loop entkoppeln und in einen eigenständigen, automatisierten Headless-Loop über 50-Bücher-Wellen verwandeln — runbook-getrieben, ohne per-pass Brief, ohne Voraus-Lektüre.

Heute verzahnen sich SSOT-Loop und Resolver über ein Koordinations-Protokoll, jeder Resolver-Pass wird supervised gefahren und durch einen eigenen Cowork-Brief aufgesetzt, und 100er-Wellen treiben die Phasen tief in die Dumb-Zone. Dieser Brief macht für den Resolver, was Brief 088 für den SSOT-Loop gemacht hat — brief-frei + runbook-getrieben — und geht einen Schritt weiter: voll entkoppelt, in 50er-Wellen, headless automatisiert. Erster scharfer Lauf: die 115 restlichen W40K-Bücher unbeaufsichtigt durchresolven.

## Context

- **Stand 2026-05-23.** 450 W40K-Bücher kristallisiert und in Postgres applied (Resolver-Pass 7 gemerged — PR #90, Commit `1de82a3`, `ssot-w40k-036..045` / W40K-0351..0450). W40K hat **565** Bücher gesamt → **115 übrig** (Batches `ssot-w40k-046..057`, der letzte ein 5-Bücher-Restbatch). HH: **294** Bücher, **0** kristallisiert. Korpus bei 859 gedeckelt.
- **Pain 1 — Verzahnung.** SSOT-Loop und Resolver sind heute über eine Pause-Mechanik gekoppelt: der `⏸ Resolver-Pause`-Block im Loop-Log, die Cadence-Arithmetik in `scripts/loop-next-batch.ts`. Zwei unabhängige Prozesse mit einem Koordinations-Protokoll dazwischen.
- **Pain 2 — Voraus-Briefs.** Resolver-Pässe wurden supervised gefahren, jeder per Cowork-Brief aufgesetzt (089/090/091/093). Brief 090 hat das Runbook zur Spec gemacht und den per-pass Brief „optional" gestellt — aber das Brief-Lesen ist nicht verschwunden: die Config trägt ein `brief`-Feld, das Runbook zitiert 076/090/091 als Provenienz, und eine supervised-Session greift gewohnheitsmäßig nach „dem höchsten offenen Brief". Maintainer-Beobachtung: beim letzten Mal „extrem viel Voraus-Briefs lesen müssen".
- **Pain 3 — Dumb-Zone.** 100er-Wellen treiben die Phasen 1/2/3/4a auf ~200–250k Token; der sichtbare Kuratierungs-Qualitätsverfall beginnt ab ~120k. Der Phase-4-Split (Brief 091) lindert, behebt nicht.
- **Die 100er-Begründung ist weggefallen.** Größere Wellen wurden (Brief 090) u. a. wegen der Cross-Wave-Identitäts-Fragmentierung gewählt. Diese Sorge übernimmt künftig ein eigener Konsolidierungs-Pass (separater Folge-Brief) — die Wellengröße ist damit frei, ein reiner Qualitäts-Hebel zu sein.
- **Maintainer-Entscheidungen (diese Session, AskUserQuestion + Dialog).** Wellengröße zurück auf **50**. Der Resolver wird ein **automatisierter, headless Loop**, vom SSOT-Loop **entkoppelt**. **Kein per-pass Brief** mehr, das Runbook wird selbst-enthalten. Erster Lauf = die **115 W40K-Reste headless**. **Kein** Vorab-Mess-Schritt — der Trial-Lauf ist die empirische Probe. Der Konsolidierungs-Pass wird ein eigener Folge-Brief.

## Umbau — die vier Bausteine

Architektonische Reihenfolge; CC wählt innerhalb der Bausteine die konkrete Form. Brief 088 (`ssot-loop-lean`) ist die Form-Vorlage — die operative Spec wandert ins Runbook, der Brief wird Archiv.

### 1. Entkopplung SSOT-Loop ↔ Resolver

Die Resolver-Pause-Mechanik wird **vollständig entfernt** — der SSOT-Loop läuft künftig bis `loopComplete` durch, ohne je für den Resolver anzuhalten.

- `scripts/loop-next-batch.ts`: die Cadence-/Pause-Logik fliegt raus (`CADENCE`, `CADENCE_OFFSET`, `isCadenceBoundary`, `nextCadenceBoundaryAfter`, `buildPauseHeadingRegex`, `logHasPauseBlockFor`); der `Decision`-Contract verliert `resolverPause` und `nextResolverPauseAt`. Nebeneffekt-Gewinn: die Pause-Erkennung war der **einzige** Grund, warum `loop-next-batch.ts` das (≫100k Token große) `ssot-loop-log.md` überhaupt liest — der Detektor liest das Log danach gar nicht mehr (`logText` aus `DecideInput` raus, `loadInputs` öffnet die Log-Datei nicht mehr).
- `scripts/run-ssot-loop.sh` + `sessions/ssot-loop-runbook.md`: alle Pause-/`⏸`-/Cadence-Texte raus. CC greppt selbst alle einschlägigen Vorkommen (`Resolver-Pause`, `Cadence`, `% 100`, „nächste Pause" …) und zieht sie konsistent nach.
- `npm run test:loop-next` zieht auf den geschrumpften `Decision` nach.

Netto löscht dieser Baustein Code. Der bestehende `⏸ Resolver-Pause bei 450 Büchern`-Block im Loop-Log ist harmloser historischer Text und bleibt stehen. Die Cadence-Mechanik geht auf Brief 061/090 zurück; beide bleiben als Archiv unverändert.

### 2. Resolver-Wellen-Detektor + Auto-Config

Die per-Welle-Config wird **nicht mehr von Cowork handgekeyt** (heute: Brief 093 hat `resolver-pass.config.json` von Pass 6 auf 7 umgeschlüsselt). Eine Maschine erzeugt sie.

- **Pure-core-Detektor** (Vorbild: `decideNextBatch` in `loop-next-batch.ts`): berechnet deterministisch die noch offenen W40K-Resolver-Wellen aus dem kristallisierten Override-File-Bestand + dem Resolver-Fortschritts-Stand.
- **Wellen-Algorithmus, explizit festgelegt.** Die ursprüngliche Formulierung („~50-Bücher-Welle = 5 Batches" + „kleinen Endrest falten") war mehrdeutig — sie ergäbe für die 115 W40K-Reste ebenso `50/65` wie `50/50/15`, nicht das gewünschte `60/55`. Festlegung: Zielgröße ~50 Bücher pro Welle, harte Obergrenze ~60. Der Detektor wählt die **kleinste** Wellenzahl, bei der keine Welle ~60 überschreitet — formal `waveCount = ceil(restbücher / 60)` (`ceil`, **nicht** `round`/`floor`) — und teilt die zusammenhängenden offenen Batches dann in `waveCount` zusammenhängende, **nach Buchzahl möglichst balancierte** Gruppen. Eine Welle ist damit eine Batch-Gruppe variabler Größe um ~50, **kein** fixes 5-Batch-Fenster. Konkret für die 115 W40K-Reste (Batches `046..057`, der letzte ein 5-Bücher-Restbatch): `ceil(115/60)=2` → zwei Wellen, balanciert `046..051` (60) + `052..057` (55). Zielgröße + Obergrenze sind benannte Konstanten.
- **Domain-Grenze + Terminal-Zustände.** Der Detektor ist **W40K-gescopet** — er erzeugt **nie** eine HH-Welle, auch dann nicht, wenn der SSOT-Loop HH bereits kristallisiert hat (`ssot-hh-*`-Override-Files liegen vor). Er hat **drei Ausgänge**: (a) **≥ 1 offene Welle** → Wellen-Config (Auto-Config-Schritt unten); (b) **keine kristallisiert-aber-unresolved W40K-Batches, das W40K-Roster aber noch nicht erschöpft** → Meldung „keine offene W40K-Welle" (Leerlauf — der SSOT-Loop muss erst weiter kristallisieren; genau das ist der Stand zum Implementierungs-Zeitpunkt, siehe § Trial); (c) **alle 565 W40K-Bücher resolved** → Meldung „W40K vollständig". In den Fällen (b) und (c) **endet der Loop sauber als regulärer Terminal-Zustand — kein `## Needs decision`.** „W40K vollständig" ist ein Erfolgs-Endzustand, kein Halt, der eine Maintainer-Entscheidung verlangt; `## Needs decision` bleibt echten Blockern und Phasen-Fehlern vorbehalten. HH-Resolving ist ein eigener Brief (Out of scope).
- **Selbst-erkennender Stand, mit Phasen-Granularität.** Der Detektor/Loop erkennt seinen Fortschritt selbst — analog zum SSOT-Loop. Die Mechanik (eigenes `resolver-loop-log.md`, State-File, oder Ableitung aus committeten per-Welle-/per-Phase-Reports) ist CC's Call, **muss aber Phasen-Granularität tragen**: Baustein 4 setzt darauf den präzisen Resume auf — für die angefangene Welle muss ablesbar sein, welche Phasen schon abgeschlossen committet sind.
- **Auto-Config.** Aus der Detektor-Entscheidung wird die per-Welle-`resolver-pass.config.json` **mechanisch erzeugt**: `wave`, `aggregator.batches`, `applyRange`, `verify`-Ranges rechnerisch; `clusters` aus dem Roster-`seriesHint` abgeleitet (oder weggelassen, falls CC sie für entbehrlich hält — die Aggregator-Buch-Tabelle trägt Titel/Serie/Format schon); `smokeSlugs` automatisch gewählt (ein repräsentatives Buch je Batch).
- **Generische Trigger.** Die heutigen Phasen-`trigger`-Strings in `resolver-pass.config.json` tragen handgeschriebene Pass-7-Lore (Aeldari-/Beast-Arises-Stichworte), Report-Pfade und Brief-Status-Update-Anweisungen. Die maschinell erzeugten Trigger sind **generische Templates**: Runbook-Sektions-Pointer + ausschließlich maschinelle Wave-Parameter (Wave-ID, Batch-Liste, Ranges). Keine handgeschriebene Lore, kein Brief-Status-Update (es gibt nach Baustein 3 keinen per-pass Brief). Wave-spezifische inhaltliche Orientierung liefert das Dossier / der Aggregator, nicht der Trigger.
- Pure-core = Test-Seam, wie bei `decideNextBatch`.

### 3. Brief-freies, selbst-enthaltenes Runbook

Eine Resolver-Welle liest künftig **nur**: Runbook + Config + Dossier + ihr Achs-Paket. **Null Briefs.**

- Das `brief`-Feld fliegt aus `resolver-pass.config.json`; `scripts/run-resolver-pass.sh` verlangt/injiziert keinen Brief mehr (die Brief-Behandlung dort wird toter Code — CC darf sie entfernen).
- `sessions/resolver-pass-runbook.md` wird **operativ selbst-enthalten**: CC sweept jede „Brief NNN"-Referenz. Wo das Runbook für eine *operative* Regel auf einen Brief verweist (z. B. „nach 072/076-Konvention", „(Baustein 3/4)"), wird die Regel **inline ausgeschrieben**. Reine Provenienz-Zitate wandern in **eine** abgesetzte, klar als überspringbar markierte „Herkunft / Background"-Fußnote — eine Phase muss nie einem Brief-Link folgen.
- `CLAUDE.md` + `AGENTS.md`: die Resolver-Runbook-Ausnahme (Brief 090) wird wasserdicht — eine Resolver-Welle (headless **oder** supervised) überspringt unmissverständlich die Session-Start-Leseroutine **und** liest nie einen Brief, auch nicht „den höchsten offenen Brief".
- **Brief 094 ist der letzte per-pass-artige Resolver-Brief** — wie Brief 088 für den SSOT-Loop. Danach läuft der Resolver-Loop brief-frei; nur ein genuiner neuer Architektur-Call (HH-Resolver, neuer Facet-Wert, Konsolidierungs-Pass) bekommt noch einen Brief.

### 4. Headless-Loop-Driver scharf

`scripts/run-resolver-pass.sh` fährt heute **eine** Welle (6 Phasen) und finalisiert selbst mit `git push` + `gh pr create`. Er wird zum sauberen Subroutine-Baustein und in einen Loop gewickelt — ein schlanker `scripts/run-resolver-loop.sh` als Geschwister zu `run-ssot-loop.sh`, oder ein Loop-Modus; CC's Call.

- **Loop.** Nächste Welle erkennen (Baustein 2) → Config erzeugen → 6 Phasen fahren → bei sauberem Erfolg vorrücken → wiederholen, bis keine offene W40K-Welle mehr da ist **oder** eine Phase `## Needs decision` setzt bzw. hart fehlschlägt (die Halt-Checks erkennen das bereits; der Loop stoppt sauber).
- **Finalisierung.** `run-resolver-pass.sh` bekommt einen Weg, seine **eigene** Push-/PR-Finalisierung zu unterdrücken (Flag — Form CC's Call). Der **Loop-Driver besitzt die Finalisierung**: alle Wellen eines Loop-Laufs auf **einer** Branch, am Ende **ein** Push + **ein** PR über alle abgeschlossenen Wellen — exakt wie `run-ssot-loop.sh` (ein PR pro Loop-Lauf, viele Commits). Standalone aufgerufen (eine einzelne Welle) behält `run-resolver-pass.sh` sein heutiges Push-/PR-Verhalten. Stoppt ein Loop-Lauf vorzeitig (needs-decision / Fehler), wird die Branch trotzdem gepusht und ein PR geöffnet/aktualisiert, damit die Arbeit gesichert ist.
- **Resume, phasen-präzise.** Der bestehende Pass-Driver startet immer bei Phase 0 und verlangt pro Phase einen Commit — ein erneuter Lauf darf eine angefangene Welle deshalb **nicht** von Phase 0 neu fahren (die schon erledigten, jetzt idempotent-no-op Phasen würden am „HEAD muss sich bewegen"-Halt-Check brechen). Resume erkennt (a) die höchste vollständig abgeschlossene Welle und (b) innerhalb der angefangenen Welle die erste **nicht** abgeschlossene Phase und setzt dort auf. Der Pass-Driver bekommt dafür eine Start-Phase-Fähigkeit (`--start-phase` o. ä.) + Phasen-Abschluss-Erkennung (eine Phase gilt als abgeschlossen, wenn ihr Commit vorliegt und ihre Statusdatei — falls vorhanden — keinen `## Needs decision`-Block trägt). Der strenge „jede gefahrene Phase committet"-Halt-Check bleibt für die tatsächlich gefahrenen Phasen erhalten. Anwendungsfall: ein `## Needs decision`-Stopp passiert mitten in einer Welle; nach der Maintainer-Intervention setzt der Resume-Lauf an genau der punktenden Phase wieder auf, ohne die Phasen davor erneut zu fahren.
- **Status-Lifecycle-Regel.** Die Phasen-Abschluss-Erkennung prüft die Statusdatei auf `## Needs decision` — also muss geregelt sein, was beim Re-Run mit einem schon vorhandenen `## Needs decision`-Block passiert. Sonst stoppt der Halt-Check nach einem erfolgreichen Re-Run erneut am alten Block, und die bereits reparierte Phase gilt nie als abgeschlossen. Verbindlich: die Statusdatei einer Phase spiegelt stets ihren **jüngsten** Lauf — ein erfolgreicher Re-Run hinterlässt **keinen** veralteten `## Needs decision`-Block aus einem früheren Fehlversuch. Halt-Check und Abschluss-Erkennung müssen denselben Statusblock als maßgeblich werten. Die Form — Statusdatei beim Re-Run vollständig überschreiben **oder** durchweg nur den jüngsten Statusblock auswerten — ist CC's Call; das Outcome ist verbindlich: Re-Run erfolgreich ⇒ Phase liest als abgeschlossen ⇒ kein Phantom-Halt am Alt-Block.
- **Härtung.** Ein per-Phase-Timeout, damit ein hängendes `claude -p` den Loop nicht endlos blockiert.
- **Scharf** heißt: der Headless-Loop wird der produktive Pfad. Resolver-Wellen werden nicht mehr von Hand mit `/clear` gefahren.

## Der Trial — erster scharfer Lauf

Nach Merge + nachdem der SSOT-Loop die W40K-Reste kristallisiert hat, fährt der Resolver-Loop **headless, unbeaufsichtigt** über die 115 restlichen W40K-Bücher (≈2 Wellen, 60 + 55; ≈12 Headless-Phasen-Subsessions) → alle 565 W40K-Bücher resolved/applied.

Das ist **operativ** (Philipp triggert es), **nicht** Teil der Implementierung dieses Briefs — exakt wie Pass 6 der erste Lauf der Brief-090-Maschinerie war. Worauf beim Trial zu achten ist: Bleiben die Phasen 1/2/3/4a bei 50er-Wellen aus der Dumb-Zone? Eine Phase, die immer noch driftet, ist bei Buch ~565 sichtbar, nicht erst bei 859 — und ist das Signal, die Wellengröße nachzujustieren. HH ist **nicht** Teil des Trials (siehe Out of scope).

**Sequencing-unabhängig implementierbar.** Zum Implementierungs-Zeitpunkt sind die Batches `046..057` noch nicht kristallisiert — ein Live-Detektor-Lauf gegen den Bestand fände korrekt „nichts offen" (Detektor-Ausgang (b), siehe Baustein 2). Brief 094 wird deshalb **substanziell gegen synthetische Fixtures** validiert (siehe Acceptance) — die Wellen-Aufteilung lässt sich am Live-Bestand nicht prüfen, solange `046..057` nicht kristallisiert sind. Ergänzend prüft ein **Live-Smoke** gegen den Implementierungs-Zeitpunkt-Stand, dass der selbst-erkennende Startzustand „resolved bis 045" korrekt als „keine offene W40K-Welle" liest (kein False-Positive „W40K vollständig", keine Phantom-Welle). Die Implementierung hängt nicht daran, ob der SSOT-Restlauf schon gelaufen ist; nur der erste echte Trial-Lauf braucht die kristallisierten W40K-Reste.

## Constraints

- **Resolver-Semantik unverändert** — Surface-Form → canonical ID via direct match → alias lookup; kein Fuzzy, kein Slug-Match, keine Titel-Normalisierung (Brief 049/072).
- **Die 6-Phasen-Maschinerie pro Welle (0/1/2/3/4a/4b — Brief 076/090/091) bleibt unangetastet.** Dieser Brief wickelt sie in einen Loop und füttert sie automatisch; er fasst die Phasen-Struktur, die Achsen-Aufteilung und das Resolver-Matching **nicht** an.
- **Der SSOT-Loop muss voll funktionsfähig bleiben** — Baustein 1 editiert `loop-next-batch.ts`, das der Live-Loop benutzt; die Batch-Erkennung (nächster Batch, Domain-Reihenfolge, Restbatch) bleibt korrekt, nur die Pause-Schicht verschwindet.
- **Keine Schema-Migration**, kein Touch an `src/db/schema.ts` / `src/db/migrations/`. Harter Blocker → `needs-decision`-Stop.
- **Determinismus bleibt.** Detektor, Auto-Config-Erzeugung, Aggregator und Apply-Skripte sind re-runnable und produzieren bei gleichen Inputs byte-identische Ausgabe.
- **Keine Tool-Versionen pinnen, keine neuen Dependencies** — ein Refactor dieser Art braucht keine.
- **Dieser Brief fährt keinen Produktiv-Pass.** Validierung läuft gegen den schon kristallisierten Korpus; der Re-Apply ist idempotent (delete-then-insert pro Junction).
- **Pass 7 nicht anfassen.** Er ist separat auf der alten Schiene fertig gelaufen (supervised, Brief 093) und gemerged (PR #90, Commit `1de82a3`) — DB bei 450. Die Loop-Maschinerie setzt bei 450 auf; CC fasst die gemergten Pass-7-Artefakte nicht an.
- **Worktree.** Batches-Strang. Arbeite in `C:\Users\Phil\chrono-lexicanum-batches` auf einer frischen `codex/ingest-batches-resolver-loop`-Branch aus aktuellem `origin/main`. `main` ist read-only.
- **Fremde/parallele Änderungen nicht zurücksetzen** (paralleler Loop-Lauf, Wiki-Hygiene-Pass).

## Out of scope

Implementer sind eifrig — diese Dinge bleiben **explizit unangetastet**:

- **Der Konsolidierungs-Pass** (Cross-Wave-Canonical-Row-Dedup). Eigener Folge-Brief. Sein erster großer Lauf liegt am W40K-complete-Meilenstein (nach dem Trial) und ist zugleich der Maschinerie-Test für den finalen Full-Corpus-Lauf nach HH. Hier **nicht** gebaut — entschiedene Eckpunkte siehe Notes.
- **Der HH-Resolver.** Der Resolver ist W40K-getunt; HH (294 Bücher, Pre-Heresy-Factions, Terra/Imperium vor dem Split, eigenes Personal) bekommt einen eigenen Brief. Der W40K-gescopete Detektor erzeugt **nie** eine HH-Welle — der Loop „erreicht" die HH-Domain also gar nicht; er endet bei W40K-complete sauber mit „W40K vollständig" (regulärer Terminal-Zustand, **kein** `## Needs decision` — siehe Baustein 2, „Domain-Grenze + Terminal-Zustände"). HH später mit demselben Driver zu fahren ist Sache des HH-Briefs, nicht dieses Loops. Der Trial ist W40K-only.
- **Pass 7** — läuft supervised auf der alten Config fertig, unberührt.
- **Phase-3 `characters.json`-Achsen-Slicing** — bekannte Wachstumskante (Brief 090/091), separate spätere Sache.
- **Resolver-Matching-Semantik ändern, Reference-Daten oder Override-Files inhaltlich umschreiben, UI/Cockpit, V2-Pipeline (`src/lib/ingestion/**`), App-Routen.**
- **OQ (3) Hand-Check-Workflow, OQ (13) Crawl-Simplification-Sichtung** — bleiben in der Open-Questions-Queue, hier **nicht** adressiert.
- **Das operative Loopen bis 859 und der Trial-Lauf selbst** — operativ, kein Brief.
- **Brain-Wiki** (`brain/wiki/**`). Cowork zieht den Wiki-Hygiene-Pass in einer eigenen Session nach dem Merge.

## Acceptance

Die Session ist fertig, wenn:

- [x] **Entkopplung:** `loop-next-batch.ts` trägt keine Resolver-Cadence mehr (`CADENCE`/`CADENCE_OFFSET`/`resolverPause`/`nextResolverPauseAt` etc. entfernt); `Decision` ist entsprechend geschrumpft; `loop-next-batch.ts` liest `ssot-loop-log.md` nicht mehr; `run-ssot-loop.sh` + `ssot-loop-runbook.md` tragen keine Pause-/Cadence-Texte mehr; `npm run loop:next` gegen den Live-Korpus liefert schlicht den nächsten Batch; `npm run test:loop-next` grün und an den geschrumpften `Decision` angepasst.
- [x] **Wellen-Detektor:** ein pure-core-Helper liefert deterministisch die offenen W40K-Resolver-Wellen nach dem festgelegten Algorithmus (`ceil(restbücher / 60)` Wellen, balancierte zusammenhängende Batch-Partition). Unit-Tests mit **synthetischen Fixtures** decken alle drei Detektor-Ausgänge ab: (a) **offene Welle(n)** — Fixture „Resolver-Fortschritt 45 + Batches `046..057` kristallisiert" → 2 Wellen (`046..051` / `052..057` = 60 / 55); (b) **Leerlauf** — Fixture „Resolver-Fortschritt 45, nichts über Batch `045` kristallisiert, W40K-Roster nicht erschöpft" → „keine offene W40K-Welle" (**nicht** „W40K vollständig"); (c) **W40K-complete** — Fixture „alle 565 W40K-Bücher resolved, `ssot-hh-*`-Override-Files liegen vor" → **keine** HH-Welle, Detektor meldet „W40K vollständig". Zusätzlich ein **Live-Smoke**: ein Detektor-Lauf gegen den realen Repo-Stand zum Implementierungs-Zeitpunkt (Pass 7 gemerged, `001..045` resolved, `046..057` noch nicht kristallisiert) liefert Ausgang (b) „keine offene W40K-Welle" — das verankert den selbst-erkennenden Startzustand „resolved bis 045" als geprüftes Kriterium statt als bloße Annahme (hat der SSOT-Loop zwischenzeitlich Batches über `045` kristallisiert, dokumentiert CC den dann abweichenden, ebenfalls korrekten Ausgang im Report).
- [x] **Auto-Config:** die per-Welle-`resolver-pass.config.json` wird maschinell erzeugt (`wave`/`batches`/`applyRange`/`verify`-Ranges; `clusters` aus `seriesHint` abgeleitet oder bewusst weggelassen; `smokeSlugs` auto-gewählt); die Phasen-`trigger` sind **generische Templates** (Runbook-Pointer + maschinelle Wave-Parameter, **keine** handgeschriebene Pass-Lore, **kein** Brief-Status-Update); kein Hand-Keying mehr nötig; JSON valide.
- [x] **Brief-frei:** `resolver-pass.config.json` hat kein `brief`-Feld mehr; `run-resolver-pass.sh` verlangt/injiziert keinen Brief; `resolver-pass-runbook.md` ist operativ selbst-enthalten (keine „Brief NNN"-Referenz ist mehr Pflichtlektüre — Provenienz steht in einer abgesetzten, überspringbaren Fußnote); `CLAUDE.md` + `AGENTS.md` tragen eine wasserdichte Resolver-Wellen-Ausnahme (keine Session-Start-Routine, kein Brief).
- [x] **Headless-Loop-Driver:** ein Loop-Wrapper fährt aufeinanderfolgende W40K-Wellen automatisch (Detektor → Config → 6 Phasen → nächste Welle) und stoppt sauber bei `## Needs decision`, Phasen-Fehler oder keiner offenen W40K-Welle mehr (Leerlauf bzw. W40K-complete — Detektor-Ausgänge (b)/(c), Baustein 2); `run-resolver-pass.sh` ist ein sauberer Subroutine-Baustein (eigene Push-/PR-Finalisierung unterdrückbar); der Loop-Driver macht **ein** Push + **einen** PR pro Loop-Lauf; Resume ist phasen-präzise (erneuter Lauf setzt an der ersten offenen Phase der angefangenen Welle auf, fährt abgeschlossene Phasen nicht erneut) und re-run-fest (ein erfolgreicher Phasen-Re-Run hinterlässt keinen veralteten `## Needs decision`-Block, an dem der Halt-Check erneut stoppen würde); ein per-Phase-Timeout ist vorhanden; `bash -n` grün; eine etwaige Änderung an `run-resolver-pass.sh` ist im Report begründet.
- [x] **Validierung mit synthetischen Fixtures** (kein Live-Bestand an kristallisierten-aber-unresolved Büchern nötig — der echte Lauf ist der operative Trial): Unit-Tests für den Detektor inkl. aller drei Detektor-Ausgänge (115 → 60/55-Aufteilung, Leerlauf, HH-Domain-Grenze) und des Live-Smokes; ein fixture-getriebener Check für die Config-Erzeugung inkl. der generischen Trigger; ein Dry-/No-Op-Modus oder dokumentierter Trace für die Loop-Orchestrierung (detect → generate → Phasen-Aufruf → advance/halt), der auch den Resume an einer simulierten unfertigen Welle abdeckt — inklusive des Falls, dass die punktende Phase aus einem früheren Lauf einen `## Needs decision`-Block trägt: nach erfolgreichem Re-Run liest die Phase als abgeschlossen und der Loop rückt vor, ohne am veralteten Block erneut zu halten.
- [x] `npm run lint`, `typecheck`, `test:resolver`, `test:resolver-data`, `test:resolver-coverage`, `test:apply-override-dry`, `test:loop-next`, `brain:lint -- --no-write` laufen grün.
- [x] Impl-Report `sessions/2026-05-23-094-impl-resolver-loop.md` geschrieben; Status dieses Briefs auf `implemented`.

## Open questions

Inputs für den nächsten Architekten-Schritt, keine Blocker:

- Wie erkennt der Resolver-Loop seinen Stand am saubersten — eigenes `resolver-loop-log.md`, ein State-File, oder das Zählen committeter per-Welle-Reports? Im Report die Wahl begründen.
- Bleibt `clusters` als auto-abgeleitetes Config-Feld nützlich, oder trägt die Aggregator-Buch-Tabelle die Orientierung schon allein?
- Deutet das Dry-Rehearsal an, dass 50er-Wellen die Phasen sauber unter die Dumb-Zone bringen — oder zeichnet sich schon dort Drift ab?
- Braucht der Headless-Loop-Driver über den per-Phase-Timeout hinaus weitere Robustheits-Haken, die erst bei einem echten Mehr-Wellen-Lauf sichtbar werden?

## Notes

- Reine Resolver-Maschinerie — keine UI-Oberfläche, daher **kein** „Design freedom"-Abschnitt (analog Brief 091/093).
- **Analogie:** Brief 088 hat den SSOT-Loop brief-frei + runbook-getrieben gemacht und Brief 061 auf Design-Rationale reduziert. Brief 094 macht dieselbe Bewegung für den Resolver — zusätzlich entkoppelt er ihn vom SSOT-Loop und verwandelt ihn in einen eigenen automatisierten Loop. Wer 088 als Muster liest, hat die halbe Form verstanden. Vorlagen liegen alle im Repo: `loop-next-batch.ts` (Detektor + Test-Seam), `run-ssot-loop.sh` (Loop-Driver-Form), `run-resolver-pass.sh` + `resolver-pass.config.json` (per-Welle-Driver + Config), `resolver-pass-runbook.md` (die selbst-enthalten zu machende Spec). Keine Code-Skizzen nötig.
- **Sequenz danach** (operativ, festgehalten damit sie nicht verloren geht): (1) SSOT-Loop bis 859 durchlaufen lassen — ~4 Durchläufe: 1× W40K-Rest (115), 3× HH (~98). (2) Resolver-Headless-Trial über die 115 W40K-Reste → W40K komplett resolved. (3) Großer Konsolidierungs-Pass über das W40K-Entitäten-Set. (4) HH-Resolver. SSOT-Loop und Resolver sind nach diesem Brief entkoppelt — die Reihenfolge ist flexibel; HH-Kristallisierung kann jederzeit laufen.
- **Konsolidierungs-Pass — entschiedene Eckpunkte für den Folge-Brief** (Cross-Wave-Canonical-Row-Dedup, AskUserQuestion diese Session): eigener **Pass-Typ** mit schlankem Geschwister-Runbook (Batches-Strang), abgekoppelt von der Triage. Arbeitet auf dem Entitäten-Set (~290 Character-Rows etc.), nicht auf den Büchern → wellengrößen-unabhängig, passt in ein Kontextfenster. Mechanische Dubletten-Kandidaten über einen erweiterten Aggregator (globale Kandidaten-Liste), tiefe Lore-Aliase per LLM-Adjudikation/Lexicanum-Lookup. Merge = Reference-JSONs editieren (Rows mergen, Namen als Aliase falten) → der idempotente Phase-4a-Re-Apply leitet alle Junctions neu ab, auch rückwirkend; **keine** Schema-/Merge-Migration. Faction-Merges müssen `parent_id` / `primaryFactionId` mit-umbiegen; gemergte Reference-Rows dürfen **keine** verwaisten DB-Rows hinterlassen. **Cadence:** ein verpflichtender finaler Pass + ad-hoc-Zwischenläufe. **Erster echter Lauf:** am W40K-complete-Meilenstein — er konsolidiert das W40K-Set und testet zugleich die Maschinerie für den finalen Full-Corpus-Lauf nach HH.
- Hintergrund-Rationale (warum es den Resolver-Pass gibt, die Achsen-Aufteilung, das Token-Budget): Briefs 076 / 090 / 091. Dieser Brief baut darauf auf, wiederholt es nicht — und macht es nach Baustein 3 endgültig zu reinem Archiv.
- **Präzisierungs-Pass nach Codex-Review (2026-05-23).** Sechs Review-Punkte sind eingearbeitet: Loop-Finalisierung (ein Push + ein PR pro Lauf, `run-resolver-pass.sh` als unterdrückbarer Subroutine-Baustein — Baustein 4); phasen-präziser Resume statt vagem „idempotent" (Baustein 4); der explizite Wellen-Algorithmus `ceil(rest/60)` + balancierte Partition statt der mehrdeutigen Faltungs-Formulierung (Baustein 2); Validierung über synthetische Fixtures statt Live-Bestand (Acceptance + § Trial); der HH-Domain-Halt als Detektor-Anforderung + Acceptance-Kriterium (Baustein 2); generische statt pass-spezifischer Phasen-Trigger (Baustein 2).
- **Präzisierungs-Pass II nach Review (2026-05-23, zweite Runde).** Drei weitere Findings eingearbeitet: (1) der selbst-erkennende Startzustand „resolved bis 045" ist jetzt als **Live-Smoke** plus explizite Fixture-Progress-Angabe verankert — der Detektor hat drei benannte Ausgänge (offene Welle / Leerlauf / W40K-complete), die Acceptance prüft alle drei synthetisch + den Live-Stand (Baustein 2, Acceptance, § Trial). (2) Eine **Status-Lifecycle-Regel** schließt eine Resume-Lücke: ein erfolgreicher Phasen-Re-Run darf keinen veralteten `## Needs decision`-Block zurücklassen, sonst stoppt der Halt-Check die reparierte Phase erneut am Alt-Block; Halt-Check und Abschluss-Erkennung werten denselben Statusblock (Baustein 4 + Acceptance). (3) Der **HH-Halt** ist vereindeutigt: W40K-complete endet sauber als regulärer Terminal-Zustand „W40K vollständig" — **kein** `## Needs decision`; die zuvor widersprüchliche Out-of-scope-Formulierung („Halt-Check … `## Needs decision`") ist angeglichen. `## Needs decision` bleibt echten Blockern und Phasen-Fehlern vorbehalten.
