---
session: 2026-05-21-088
role: architect
date: 2026-05-21
status: implemented
slug: ssot-loop-lean
parent: 2026-05-11-061
links:
  - 2026-05-13-071-arch-loop-driver
  - 2026-05-20-087-arch-goodreads-rating-pipeline
commits: []
---

# SSOT-Loop — schlanke, selbst-erklärende Iteration

## Goal

Eine einzelne Loop-Iteration wird ein schlanker, selbst-erklärender mechanischer Task: CC liest pro Iteration genau drei Dinge — ein kurzes Runbook, die Ausgabe eines Detection-Skripts und `scripts/seed-data/facet-catalog.json` — und sonst nichts. Kein Brief 061, keine `CLAUDE.md`-Session-Start-Leseroutine, kein 422 KB-Roster.

Beobachtung aus einem Maintainer-Lauf am 2026-05-21: eine CC-Session mit dem Auftrag „Brief 061 ausführen" verbrannte massiv Token, bevor sie das erste Buch anfasste. Sie lud die volle `CLAUDE.md`-Brain-Lesekette (`project-state.md` allein ~46 k Token), den 368-Zeilen-Brief 061, `run-ssot-loop.sh` und diverse Referenzdateien, und verhakte sich zusätzlich an der `200 % 50 == 0`-Pause-Arithmetik. Eine Loop-Iteration ist aber mechanisch trivial: nächsten Batch erkennen, 10 Bücher recherchieren, eine Override-JSON schreiben, einen Log-Block anhängen, committen. Dieser Aufwand gehört in den Prompt, nicht in eine Schnitzeljagd durch das Repo.

## Context

Der SSOT-Loop (Brief [061](./2026-05-11-061-arch-ssot-loop.md), Standing) baut den Authority-Layer auf: pro `/clear` ein 10er-Batch `manual-overrides-ssot-{domain}-{NNN}.json`. Driver ist `scripts/run-ssot-loop.sh` (Brief [071](./2026-05-13-071-arch-loop-driver.md)), der pro Iteration eine `claude -p`-Subsession mit einem Heredoc-Trigger startet. Brief [087](./2026-05-20-087-arch-goodreads-rating-pipeline.md) hat die Goodreads-Rating-Disziplin als vierte Loop-Disziplin ergänzt. Der Loop steht aktuell bei 200 Büchern in der Authority-Schicht (`ssot-w40k-001..020`), Pause-Block für die 200er-Schwelle liegt in `sessions/ssot-loop-log.md`. Nächster Schritt war/ist der Re-Trigger `ssot-w40k-021..025`.

Drei konkrete Probleme, die dieser Brief schließt:

**1. Token-Bloat pro Iteration.** Der Heredoc in `run-ssot-loop.sh` sagt CC „Brief sessions/2026-05-11-061-arch-ssot-loop.md ausführen". CC liest daraufhin den ganzen 368-Zeilen-Brief, fährt die `CLAUDE.md`-Session-Start-Leseroutine (Brain-Kette inkl. `project-state.md`/`open-questions.md`) und lädt Referenzdaten. Die Detection (welcher Batch ist dran?) ist in Brief 061 nur als Pseudocode beschrieben — CC leitet sie jede Iteration neu her und liest dabei tendenziell `book-roster.json` (422 KB) und die `manual-overrides-ssot-*.json`-Files (je ~33 KB) in den Kontext. Nichts davon braucht eine mechanische Iteration.

**2. Kein Detection-Helper.** Brief 061 § Notes nannte `scripts/loop-next-batch.ts` als optionales Helper-Skript — es existiert nicht. Detection läuft heute inline (CC) bzw. in Bash (`count_override_books()` im Driver). Ein committetes, rein lesendes Helper-Skript, das den nächsten Batch + den 10-Buch-Slice + den Resolver-Pause-Status als kompaktes JSON ausgibt, nimmt den Roster und die Override-Files komplett aus CC's Kontext.

**3. Resolver-Pause-Fehlzündung beim Resume.** Der Pre-Check stoppt loud, wenn `cumulativeBefore % 50 == 0`. Nach einem Resolver-Pass steht der Zähler genau auf so einem Vielfachen (jetzt 200) — der mechanische Check feuert dann erneut, obwohl die Schwelle längst abgearbeitet ist. Bisher umschifft mit dem manuellen `--skip-initial-resolver-pause`-Flag (3× genutzt: Schwellen 50/100/150). Genau hier hat sich die CC-Session verhakt. Maintainer-Entscheidung 2026-05-21: der Pre-Check wird selbst-erkennend (siehe § Constraints) — das Flag entfällt.

**Worktree.** Diese Arbeit gehört per `CLAUDE.md` § Parallel worktrees in den Batch/Ingestion-Strang: `C:\Users\Phil\chrono-lexicanum-batches`, frische `codex/ingest-batches-{slug}`-Branch aus `origin/main`. Der Coordination-Worktree (`C:\Users\Phil\chrono-lexicanum`) ist per Strand-Policy **nicht** die Implementationsbasis — `main` ist dort read-only. CC liest diesen Brief per absolutem Pfad und führt die gesamte Arbeit im Batches-Worktree aus.

## Constraints

- **Neues Helper-Skript `scripts/loop-next-batch.ts` + `npm run loop:next`.** Rein lesend (keine Writes, keine Git-Aktion), re-runbar, idempotent. Gibt EIN kompaktes JSON auf stdout aus mit mindestens: `loopComplete` (bool), `resolverPause` (bool), `cumulativeBefore` (number), `batch` (`{domain, number, id}`), `rosterSlice` (Array der 10 — bzw. 5/4 am Restbatch — Bücher mit nur den Feldern, die CC zum Recherchieren und zum Schreiben der Override-JSON braucht: mindestens `externalBookId`, `slug`, `title`, `format`; `author`/`series` wenn der Roster sie trägt). Detection-Logik = Brief 061 § Notes-Pseudocode (Domain-Reihenfolge W40K→HH, Restbatch-Handling, Loop-Complete). Der **Sinn** des Skripts: CC konsumiert nur dessen stdout — `book-roster.json` und die `manual-overrides-ssot-*.json`-Files landen nie in CC's Kontext.

- **Neues Runbook `sessions/ssot-loop-runbook.md`.** Die selbst-erklärende, ausführbare Spec für genau eine Iteration. Selbst-erklärend heißt: wer das Runbook + die `loop:next`-Ausgabe + `facet-catalog.json` gelesen hat, braucht für eine vollständige Iteration nichts weiter. Inhalt = synthetisiert aus den vorhandenen Quellen, **nicht neu erfunden**: Brief 061 §§ Constraints/Acceptance/Notes und der aktuelle `base_trigger()`-Heredoc (der die vier Disziplinen bereits wörtlich trägt). Abschnittsliste siehe § Notes. Zielumfang ~140–190 Zeilen.

- **Resolver-Pause „einmal pro Schwelle".** `loop-next-batch.ts` setzt `resolverPause = true` genau dann, wenn `cumulativeBefore > 0` **und** `cumulativeBefore % 50 == 0` **und** `sessions/ssot-loop-log.md` noch **keinen** H2-Block trägt, der `⏸ Resolver-Pause bei {cumulativeBefore} Büchern` matcht. Existiert der Block schon (z. B. der 200er-Block heute), läuft der Loop automatisch weiter. Der Pause-Block ist damit sein eigener Marker — kein manuelles Flag, keine neue State-Datei. UTF-8-sicher matchen (`⏸`, `Büchern`).

- **Test-Seam für die Detection-/Pause-Logik.** `loop-next-batch.ts` muss so strukturiert sein, dass seine Batch-Detection und die Resolver-Pause-Entscheidung mit synthetischen Eingaben verifizierbar sind, **ohne** die realen `book-roster.json` / `manual-overrides-ssot-*.json` / `sessions/ssot-loop-log.md` anzufassen oder zu mutieren. Die konkrete Form ist CC's Wahl — z. B. eine pure, exportierte Entscheidungsfunktion mit injizierten Inputs (Roster-Slice, Override-Count, Log-Text) oder Pfad-Override-Eingaben (`--roster-path` / `--log-path` / `--seed-dir` o. ä.), die auf ein synthetisches Fixture zeigen können. Grund: die Acceptance verlangt einen Nachweis für ein un-geblocktes 50er-Vielfaches; ein solcher Zustand existiert real nicht (die nächste echte Schwelle wäre 250 und setzt 50 weitere Override-Bücher voraus). Referenz ist das pure-DI-Helper-Muster aus Brief 077/080/084.

- **`run-ssot-loop.sh` wird schlank.** `base_trigger()` zeigt nur noch aufs Runbook plus einen Anti-Ritual-Hinweis (Skizze siehe § Notes). Die vier Disziplin-Absätze (Public-Synopsis, Faction-Granularity, Locations-Granularity, Goodreads-Rating) und der „Brief-071-Vertrag"-Absatz verlassen den Heredoc — das Runbook ist ab jetzt die **einzige** Quelle dieser Regeln (Heredoc/Brief-Drift war ein Dauerproblem). `--skip-initial-resolver-pause` wird komplett entfernt: Flag, Arg-Parsing, `SKIP_INITIAL_PAUSE`/`build_trigger()`-Skip-Zweig, Help-Docblock-Zeilen. Die Halt-Checks und der `FINAL_PAUSE_PROBE` bleiben funktional erhalten; CC verifiziert, dass der Probe-Pfad mit der selbst-erkennenden Pause sauber komponiert.

- **Anti-Ritual ist Teil der Spec.** Das Runbook (und der Heredoc) weisen explizit an: eine Loop-Iteration ist ein mechanischer Task, **keine** normale Session — die in `CLAUDE.md` und `AGENTS.md` definierte Session-Start-Leseroutine (`brain/CLAUDE.md`, `wiki/index.md`, `project-state.md`, `open-questions.md`, `cc-session.md`) wird übersprungen, Brief 061 wird **nicht** gelesen.

- **`CLAUDE.md`- und `AGENTS.md`-Carve-out.** Eine knappe Zeile in `CLAUDE.md` (passend bei der Read-order-/Workflow-Sektion) **und** eine analoge Zeile in `AGENTS.md` (passend bei `## Session start`) halten fest: SSOT-Loop-Iterationen folgen `sessions/ssot-loop-runbook.md` und überspringen die Session-Start-Leseroutine. Beide Dateien, weil `AGENTS.md` für Codex/andere Agent-Runner dieselbe Pflicht-Lesekette eigenständig erzwingt — ein Carve-out nur in `CLAUDE.md` ließe `AGENTS.md` driften und dort weiter die volle Routine vorschreiben (genau das Drift-Problem, das dieser Brief sonst schließt). Verankerung in beiden Dateien folgt dem Vorgehen aus Brief 082/083 (Parallel-Worktree-Disziplin in `CLAUDE.md` + `AGENTS.md`). Macht den Override offiziell statt implizit.

- **Brief 061 bekommt ein Banner.** Oben in `sessions/2026-05-11-061-arch-ssot-loop.md`: die operative Spec ist nach `sessions/ssot-loop-runbook.md` umgezogen; Brief 061 bleibt als Design-Rationale (warum es den Loop gibt, die Architektur-Entscheidungen) erhalten und wird nicht mehr direkt ausgeführt. Brief 061 sonst inhaltlich nicht umschreiben.

- **Output-Invarianz.** Das ist ein Prompt-/Plumbing-Refactor. Das Override-JSON-Schema, die tatsächlichen Disziplin-Regeln, der Apply-Layer und das Status-Log-Block-Format bleiben **unverändert** — eine Iteration nach diesem Brief produziert strukturell dasselbe wie vorher, nur über einen schlankeren Pfad.

- **Log-Append ohne Voll-Last.** Das Runbook weist an, den Status-Log-Block an `sessions/ssot-loop-log.md` anzuhängen, **ohne** die (1000+ Zeilen lange) Datei komplett in den Kontext zu lesen — Shell-Append oder Tail-only-Read.

- **Keine Version-Pins.** Wenn `loop-next-batch.ts` über `tsx` läuft (wie die anderen `scripts/*.ts`): Tooling-Wahl + Pin macht CC, nicht dieser Brief.

- **Verifikation grün:** `npm run lint`, Typecheck, `npm run brain:lint -- --no-write` (0 blocking).

## Out of scope

- **Den Loop fahren.** Dieser Brief baut die schlanke Maschinerie. Der Re-Trigger `ssot-w40k-021..025` läuft als eigener, separater Schritt, **nachdem** dieser Brief gemerged ist.
- **Resolver, Apply-Layer, Override-Schema, Disziplin-Regeln.** Werden nicht angefasst — nur umorganisiert (Heredoc/Brief → Runbook), nicht inhaltlich geändert.
- **Worktree-/Git-Housekeeping.** Git- oder Worktree-Hygiene ist nicht Teil dieser Session; das behandelt der separate Brief [089](./2026-05-21-089-arch-worktree-git-repair.md). Die Arbeit zu Brief 088 läuft komplett im Batches-Worktree.
- **`sessions/README.md` Active-Threads-Tabelle.** Pflegt Cowork (Brief 061 § Out-of-scope-Norm bleibt gültig — CC fasst die Tabelle nicht an).
- **Dead-Code-Retirement** (OQ 13) und der V2-LLM-Stage-Aufräum-Brief — eigene Sessions.
- **Brain-Hygiene** (`project-state.md`/`open-questions.md`/`log.md`) — macht Cowork im Post-Report-Pass.
- **Bestehende Override-Files `001..020`** — nicht nachbearbeiten.

## Acceptance

The session is done when:

- [ ] `scripts/loop-next-batch.ts` existiert, `npm run loop:next` läuft und gibt das kompakte JSON aus (`loopComplete`, `resolverPause`, `cumulativeBefore`, `batch`, `rosterSlice`). Skript ist rein lesend und re-runbar.
- [ ] `sessions/ssot-loop-runbook.md` existiert, ist selbst-erklärend und enthält die Abschnitte aus § Notes. Es benennt explizit sein Lese-Set: nur {dieses Runbook, `npm run loop:next`-Ausgabe, `scripts/seed-data/facet-catalog.json`}.
- [ ] Eine CC-Iteration, die nur diese drei Dinge liest, kann einen vollständigen Batch produzieren — Brief 061, die Brain-Lesekette und `book-roster.json` werden nicht geladen.
- [ ] `run-ssot-loop.sh`: `base_trigger()` ist schlank (Runbook-Verweis + Anti-Ritual-Hinweis), die vier Disziplin-Absätze + „Brief-071-Vertrag" sind raus, `--skip-initial-resolver-pause` ist vollständig entfernt, Help-Docblock aktualisiert. Driver-Struktur (Pre-Run-Checks, Halt-Checks, `FINAL_PAUSE_PROBE`, Push/PR) bleibt funktional.
- [ ] Resolver-Pause selbst-erkennend, über den Test-Seam belegt: ein geblocktes 50er-Vielfaches (`cumulativeBefore = 200`, 200er-`⏸`-Block im Log) liefert `resolverPause: false`, ein synthetisches un-geblocktes 50er-Vielfaches liefert `resolverPause: true`. Beide Fälle laufen gegen synthetische Eingaben (pure Funktion bzw. Fixture), **nicht** gegen mutierte reale Dateien; Nachweis im Report.
- [ ] `CLAUDE.md` **und** `AGENTS.md` tragen die Carve-out-Zeile für Loop-Iterationen (Iteration folgt dem Runbook, überspringt die Session-Start-Leseroutine).
- [ ] `sessions/2026-05-11-061-arch-ssot-loop.md` trägt oben das „Spec umgezogen"-Banner; 061 sonst inhaltlich unverändert.
- [ ] Output-Invarianz gewahrt: Override-Schema, Disziplin-Regeln, Status-Log-Format unverändert gegenüber heute.
- [ ] `npm run lint` + Typecheck + `npm run brain:lint -- --no-write` grün (0 blocking).
- [ ] Closing-Impl-Report `sessions/2026-05-21-088-impl-ssot-loop-lean.md`.

## Open questions

- **Per-Iteration-Kontextgröße.** Im Report bitte grob beziffern, wie groß der Lese-Kontext einer Iteration jetzt ist (Runbook-Zeilen + `facet-catalog.json` + `loop:next`-Output) — als Beleg gegen den Vorher-Zustand (Brain-Kette + 368-Zeilen-Brief + Roster).
- **Eine Detection-Quelle?** Soll der Driver seinen End-of-Run-Boundary-Check (`count_override_books()`) durch einen Aufruf von `loop-next-batch.ts` ersetzen, damit Detection nur eine Quelle hat? Cowork-Tendenz: ja — aber CC's Call, nicht blockierend, gerne im Report begründen.
- **Pause-Marker-Vertrauensmodell.** Der `⏸`-Block gilt als „Schwelle wurde angekündigt". Ein Loop-Re-Run nach einer Pause **ohne** zwischenzeitlichen Resolver läuft damit über die Schwelle hinweg. Das entspricht dem advisory-Charakter der Pause (und exakt dem Vertrauensmodell des alten Skip-Flags). Bitte bestätigen, dass das Runbook diese Eigenschaft ehrlich benennt.
- OQ (3) Hand-Check-Workflow und OQ (13) Crawl-Simplification bleiben in der Queue — dieser Brief ist ein Maintainer-initiierter Loop-Hygiene-Schritt und faltet sie bewusst nicht ein.

## Notes

### Runbook-Abschnittsliste (`sessions/ssot-loop-runbook.md`)

Synthese aus Brief 061 + aktuellem Heredoc — Reihenfolge frei, aber alle Punkte müssen rein:

1. **Was das ist.** Eine mechanische Loop-Iteration, keine normale Session.
2. **Lese-Scope (die Anti-Bloat-Regel).** Lies nur: dieses Runbook, die `npm run loop:next`-Ausgabe, `scripts/seed-data/facet-catalog.json`. Lies **nicht**: Brief 061, `book-roster.json`, die `manual-overrides-ssot-*.json`-Files, das volle `ssot-loop-log.md`. Fahre **nicht** die in `CLAUDE.md`/`AGENTS.md` definierte Session-Start-Leseroutine.
3. **Schritt 1 — Detect.** `npm run loop:next` ausführen, Felder des JSON erklären.
4. **Schritt 2 — Verzweigung.** `resolverPause` → nur Pause-Block schreiben, committen, stoppen. `loopComplete` → Complete-Block, committen, stoppen. Sonst → Batch produzieren.
5. **Schritt 3 — Batch produzieren.** Pro Buch: WebSearch (Plot-Lore) + WebFetch der Goodreads-Buchseite (Rating). Override-JSON schreiben.
6. **Override-JSON-Schema.** Top-Level (`$schema`, `batch`, `createdBy`, `createdAt`, `model`, `rationale`) + pro Buch (`externalBookId`, `slug`, `overrides.{synopsis, facetIds, factions, locations, characters, flags, rating}`). Die `rating`-Unterform ausbuchstabieren (`status: "rated"` mit `value`/`count`/`source`/`evidenceUrl` bzw. `status: "unrated"` mit `source`/`reason`/`evidenceUrl`).
7. **Die Disziplinen** (operativ, kondensiert): Public-Synopsis, Faction-Granularity, Locations-Granularity, Goodreads-Rating, dazu Plot-Halluzinations-Disziplin, Omnibus-Aggregation, Format-Compliance-Check, Inquisition-Konsistenz, Surface-Form-Treue, WebSearch-Discipline (1 obligatorisch, Soft-Cap 5).
8. **Status-Log-Block-Format** + die Regel „anhängen ohne das volle Log zu lesen".
9. **Commit-Regel.** Ein Commit = {Override-File, Log-Append} bzw. {Log-Append} bei Pause. Kein Co-Author-Trailer. Nur diese Pfade anfassen.
10. **Verifikation.** Lint/Typecheck dürfen bei reinem Daten-Commit übersprungen werden (Brief-061-Konvention) — wenn übersprungen, kurz begründen.

### Helper-Ausgabe (illustrativ — CC wählt finale Form)

```json
{
  "loopComplete": false,
  "resolverPause": false,
  "cumulativeBefore": 200,
  "batch": { "domain": "w40k", "number": 21, "id": "ssot-w40k-021" },
  "rosterSlice": [
    { "externalBookId": "W40K-0201", "slug": "...", "title": "...", "format": "novel", "author": "..." }
  ],
  "note": "boundary 200 already announced in ssot-loop-log.md — proceeding"
}
```

### Schlanker Heredoc (illustrativ — CC wählt finale Form)

```
Führe genau eine SSOT-Loop-Iteration aus.

Lies sessions/ssot-loop-runbook.md und folge ihm exakt. Lies nichts,
was das Runbook nicht ausdrücklich nennt.

Das ist eine mechanische Loop-Iteration, keine normale Session:
überspringe die in CLAUDE.md/AGENTS.md definierte Session-Start-
Leseroutine (brain/CLAUDE.md, wiki/index.md, project-state.md,
open-questions.md, cc-session.md) und lies Brief 061 nicht. Kein
Co-Author-Trailer im Commit.
```

### Worktree / Übergabe

Der Coordination-Worktree ist nicht die Implementationsbasis — diese Brief-Datei liegt dort nur als loses, untracked File. Praktischer Pfad: CC liest diesen Brief per absolutem Pfad und nimmt eine Kopie in den PR auf (`sessions/` im Batches-Worktree), damit Brief + Impl-Report gemeinsam auf `origin/main` landen. Branch-Konvention: `codex/ingest-batches-ssot-loop-lean` (oder ähnlich) aus `origin/main`.
