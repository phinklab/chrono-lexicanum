---
session: 2026-05-13-071
role: architect
date: 2026-05-13
status: open
slug: loop-driver
parent: 2026-05-11-061
links:
  - 2026-05-11-061-arch-ssot-loop
  - 2026-05-12-069-impl-resolver-apply-evidence
  - 2026-05-13-070-impl-faction-policy-hygiene
commits: []
---

# Loop-Driver — Headless-Wrapper um Brief 061

## Goal

Ein Maintainer-Skript (`scripts/run-ssot-loop.{sh|ps1}` — CC wählt Form und Sprache), das Brief 061 in N Loop-Iterationen autonom abarbeitet, indem es pro Iteration eine eigene Claude-Code-Subsession via `claude -p` startet. Jede Subsession bekommt einen frischen Context (das löst das eigentliche Problem: nach 4–5 Iterationen wird das Context-Fenster der manuellen `/clear`-Bedienung zu groß). Default-Iteration-Count: **5** — wodurch das Skript zur 100-Bücher-Marke automatisch durch den 50er-Loud-Stop aus Brief 061 angehalten wird (60 + 4×10 = 100, der fünfte Iter-Versuch trifft die Resolver-Pause und exitet sauber). PR-Erstellung am Ende des Driver-Laufs, nicht pro Loop-Iteration.

## Context

**Wo wir stehen.** Nach 070-impl ist die Faction-Policy-Hygiene gelandet. Authority-Layer-Stand: 60 Bücher (`ssot-w40k-001..006`), nächste Loop-Iteration wäre `ssot-w40k-007`. Brief 061 ist der Standing-Loop-Brief; pro `/clear` eine Iteration. 50er-Resolver-Schwelle ist hart-codiert in 061 — Loop stoppt loud bei kumulativ 50/100/150/… Büchern und meldet „Resolver-Brief fällig".

**Was das hier ändert.** Statt manueller `/clear` + „Brief 061 ausführen" × 5 schreibt der Maintainer einen Branch und ruft `./scripts/run-ssot-loop.sh 5` (oder PowerShell-Äquivalent). Das Skript startet 5 frische `claude -p`-Subsessions hintereinander, jede mit dem 061-Trigger. Zwischen Iterationen führt das Skript mittlere Halt-Checks aus (siehe Constraints). Am Ende — entweder nach 5 erfolgreichen Iters oder nach einem detektierten Resolver-Loud-Stop — wird der Branch gepusht und ein PR erstellt.

**Warum ein Driver-Skript und kein Mega-Brief.** Ein einziger CC-Aufruf, der „mach 5 Iterationen am Stück" sagt, löst Philipps Context-Problem nicht: die Sub-Iterationen würden alle im selben Context laufen und sich aufstapeln. Headless-Subprozesse pro Iteration sind der saubere Cut.

**Maintainer-Workflow nach Brief 071-impl.** Pre-Iter-007 z.B.:

```
git checkout main && git pull
git checkout -b ingest/batches-007-010
./scripts/run-ssot-loop.sh 5      # läuft autonom durch, stoppt bei 100-Pause
# Spot-Review der 4 neuen Override-Files + Loop-Log-Blöcke
# (Skript hat schon gepusht + PR erstellt; Maintainer reviewed im Browser)
```

Nach Merge: Resolver-Brief schreiben (manuell, Cowork-Aufgabe), separater Branch + PR. Cadence bleibt 50 Bücher → Resolver → 50 Bücher → Resolver.

## Constraints

- **Eine Datei: `scripts/run-ssot-loop.{sh|ps1}`.** CC wählt Sprache und Form. Philipp ist auf Windows; PowerShell ist die natürliche Wahl, Bash via Git-for-Windows funktioniert auch. Wenn CC unsicher ist welches er bekommt: beide schreiben oder cross-platform-kompatibles Bash mit `set -euo pipefail` und Hinweis im Header zur Ausführung via Git Bash. Single-File, kein Module-Split.

- **Subprozess pro Iteration: `claude -p`.** Jede Iteration startet eine eigene Claude-Code-Subsession via `claude -p "<trigger>"`. Der Trigger ist im Wesentlichen „Brief `sessions/2026-05-11-061-arch-ssot-loop.md` ausführen, eine Iteration, dann stoppen." (Exakte Formulierung CC's Wahl — kann auch leicht ausführlicher sein, falls das die Headless-Session in Spur hält.) Token-/Allow-Tool-Flags: das Skript setzt `--allowedTools` oder gleichwertig auf das, was Brief 061 braucht (Read, Write, Edit, Bash, Glob, Grep, WebSearch). `--dangerously-skip-permissions` ist verboten.

- **Iteration-Count parametrisiert, Default 5.** Erstes Positional-Argument bzw. `-Iterations`-Param ist die Anzahl. Default 5. Skript validiert `1 ≤ N ≤ 20` (höher macht keinen Sinn, weil die nächste Resolver-Pause garantiert dazwischen greift).

- **Pre-Run-Sanity-Checks.** Bevor die erste Iteration startet:
  - `git status --porcelain` muss leer sein (Worktree clean). Andernfalls loud-exit.
  - Aktueller Branch ist nicht `main`. Andernfalls Warnung + interaktive Bestätigung oder Abbruch (CC's Call, aber kein automatisches Weiterfahren auf `main`).
  - `claude` binary im PATH. Andernfalls loud-exit mit klarer Fehlermeldung.
  - Optional: `gh` CLI verfügbar. Falls nicht, Skript läuft trotzdem, überspringt aber den PR-Create-Schritt am Ende und gibt stattdessen einen manuellen Push/PR-Hinweis aus.

- **Halt-Checks zwischen Iterationen, Tier „Mittel" (Recommended aus AskUserQuestion).** Nach jeder Iteration prüft das Skript:
  1. **Exit-Status der `claude -p`-Subprozess.** Non-zero → loud-Stop (kein weiteres Iter, kein Push, kein PR; Maintainer-Inspektion nötig).
  2. **Genau ein neuer Override-File hinzugekommen.** `git status --porcelain` listet neue Datei unter `scripts/seed-data/manual-overrides-ssot-*.json`. Wenn null neue Files (und auch kein git-stage'd commit), interpretiere als Resolver-Loud-Stop → sauberer Skript-Exit (mit eindeutigem Status, siehe nächster Punkt).
  3. **Override-File ist valides JSON.** `JSON.parse` (in Node) oder `jq empty` — eines davon ohne Fehler.
  4. **Top-Level-Form passt.** `$schema === "manual-overrides-v1"`, `batch` matcht Pattern `ssot-(w40k|hh)-\d+`, `books` ist Array.
  5. **Buch-Anzahl plausibel.** `books.length` zwischen 1 und 10 (Restbatches sind <10 erlaubt, normale Batches sind 10).
  6. **Loop-Log ist gewachsen.** `sessions/ssot-loop-log.md` hat mindestens einen neuen H2-Block seit Iter-Start (vor-/nach-Diff per `git diff` oder line-count).
  7. **CC hat selbst committed.** Wenn CC den Override-File geschrieben aber nicht committed hat, das ist ein Verstoß gegen Brief 061; Skript loud-stoppt und verlangt Maintainer-Inspektion. (Brief 061 sagt explizit: „CC committet die neue Override-JSON + den Status-Log-Append".)

  Bei Verstoß gegen irgendeinen dieser Checks: loud-Stop, klare Fehlermeldung, weder Push noch PR. Maintainer inspiziert.

- **Resolver-Loud-Stop sauber erkennen.** Wenn Brief 061 die 50er-Pause greift, schreibt CC keinen Override-File und stoppt loud. Aus Driver-Skript-Sicht ist das **kein Fehler** — es ist das erwartete Stop-Signal. Erkennung über Halt-Check #2 (kein neuer Override-File) plus Halt-Check #6 (Loop-Log hat einen Pause-Block, erkennbar an `⏸ Resolver-Pause`-Marker im neuen Block). Skript exitet mit eigenem Status („resolver pause hit") und springt zu Push + PR-Create für die bis dahin gelaufenen Iterationen.

- **Branch-Handling.** Skript erstellt **keinen** Branch selbst und wechselt **keinen** Branch. Maintainer ist verantwortlich für `git checkout -b ingest/batches-NNN-MMM` vor dem Lauf. Skript verifiziert nur, dass nicht auf `main` gearbeitet wird (siehe Pre-Run-Checks).

- **Push + PR am Ende des Driver-Laufs.** Nach erfolgreicher letzter Iteration (oder nach detektiertem Resolver-Stop):
  - `git push -u origin <current-branch>`.
  - Wenn `gh` CLI verfügbar: `gh pr create --fill --base main` (oder gleichwertig). PR-Body kann CC sinnvoll prefillen (z.B. „Loop-Iterationen 007–010 via run-ssot-loop.sh"). Mehr darf das Skript nicht in den PR-Body schreiben — die Iterationen selbst sind dokumentiert in `ssot-loop-log.md`.
  - Wenn `gh` nicht verfügbar: Hinweis ausgeben („Push erledigt, bitte PR manuell anlegen unter <repo-url>/compare/<branch>").

- **Idempotenz / Recovery.** Wenn ein Maintainer das Skript zweimal hintereinander auf demselben Branch startet, soll das nicht zerstörerisch sein. Pre-Run-Check „Worktree clean" fängt schon viel ab. Über den letzten Push muss sich das Skript keine Gedanken machen: `git push` failt benign, wenn nichts neues zu pushen ist.

- **Logging.** Skript schreibt sein eigenes Step-Log nach `stdout` (so dass Maintainer im Terminal mitliest). Optional: zusätzliche Datei `scripts/.last-loop-run.log` für post-mortem — CC's Call. Nicht in git eintragen (`.gitignore`-Eintrag mit committen, wenn die Datei geschrieben wird).

- **Sicherheit-Boundary.** Skript ruft nur `claude -p`, `git`, optional `gh`, und Standard-Unix-Tools (`jq` falls genutzt). Keine Anthropic-API-Direct-Calls, keine WebFetch außerhalb dessen, was die CC-Subsession ohnehin tut. Skript-Output kann nicht in Git committed werden außer durch CC selbst innerhalb der Subsession.

- **Verifikation: Smoke-Run mit `N=1`.** CC führt am Ende der Implementierung **einen** Smoke-Run auf einem disposable Branch durch (z.B. `tmp/loop-driver-smoke`) mit `iterations=1`, der genau eine Iter durchläuft. Wenn der Smoke greift und die Halt-Checks korrekt durchlaufen, das ist die Abnahme. Falls der Smoke `ssot-w40k-007` schreibt — perfekt, der landet sauber im Authority-Layer (Brief 061 ist idempotent in dem Sinne, dass jeder produzierte Override-File legitim ist). Falls CC den Smoke aus Token-/Cost-Gründen nicht laufen lassen will, dokumentiert er das im Report und schiebt die Live-Verifikation auf den ersten echten Maintainer-Lauf.

- **`npm run lint` + `tsc --noEmit`** grün, falls CC TypeScript-Code für Halt-Checks schreibt (z.B. ein kleines `scripts/loop-validate-batch.ts`). Wenn das Skript pure Shell ist und Halt-Checks via `jq` macht: `shellcheck` falls verfügbar, sonst manueller Review.

## Out of scope

- **Brief 061 anfassen.** 50er-Cadence bleibt unverändert, Pause-Threshold ist nicht parametrisierbar (separater Brief, falls je gewünscht). Auch keine Änderungen am Loop-Log-Format, an der Detection-Logik, an Override-File-Schema.

- **Multi-Tool-Support (Codex).** Skript ruft nur `claude -p`. Codex-Variante wäre ein eigener Brief.

- **Auto-Merge des PR.** Skript erstellt PR, mergt ihn nicht. Maintainer-Review bleibt obligatorisch.

- **Auto-Resolver-Trigger.** Wenn der Resolver-Stop greift, schreibt das Skript **nicht** automatisch einen Resolver-Brief-Stub. Das ist Cowork-Aufgabe im nächsten Brief.

- **Cost-Cap / Token-Budget.** Skript trackt Token-Verbrauch nicht und limitiert ihn nicht. Maintainer beobachtet manuell (z.B. via Claude-Code-Status). Cost-Cap wäre ein Stretch-Goal für ein späteres Driver-Brief.

- **Parallele Iterationen.** Iterationen laufen strikt sequenziell. Keine Parallelisierung.

- **PR-Body-Auto-Summary.** PR-Body bleibt minimal („Loop-Iterationen NNN–MMM via run-ssot-loop.sh"). Detaillierte Per-Buch-Summary lebt in `ssot-loop-log.md` und ist über Git-Diff im PR ohnehin sichtbar. Cowork pflegt keine separate Summary-Disziplin im PR-Body.

- **Workflow-Doku in `brain/wiki/workflows/`.** Mini-Doc-Hinweis im Skript-Header reicht. Wenn der Driver sich nach 2–3 Maintainer-Läufen bewährt hat, kann Cowork in einer späteren Hygiene-Session eine Workflow-Page schreiben. Out of scope für die Implementierung dieses Briefs — CC schreibt aber gerne ein paar Zeilen Verwendungs-Hinweis als Skript-Kommentar.

- **`sessions/README.md` Active-Threads pflegen.** Cowork erledigt das (siehe Übergabe).

## Acceptance

The session is done when:

- [ ] **Skript existiert:** `scripts/run-ssot-loop.{sh|ps1}`. Single-File, dokumentierter Header (Usage, Voraussetzungen, Exit-Codes).

- [ ] **Iteration-Count parametrisiert.** Default 5. Validierung `1..20`.

- [ ] **Pre-Run-Checks** (Worktree clean, nicht auf `main`, `claude` im PATH, `gh` optional) implementiert und greifen mit klaren Fehlermeldungen.

- [ ] **Subprozess-Aufruf von `claude -p`** mit `--allowedTools` (oder gleichwertig), kein `--dangerously-skip-permissions`. Trigger-String enthält den Pfad zu Brief 061.

- [ ] **Mittel-Tier Halt-Checks** zwischen Iterationen implementiert (Exit-Status, ein neuer Override-File, JSON-valide, Top-Level-Form, Buch-Anzahl, Loop-Log gewachsen, CC hat committed). Bei Verstoß: loud-Stop.

- [ ] **Resolver-Loud-Stop sauber erkannt.** Skript detektiert „keine neue Override-File + Pause-Block im Loop-Log" als legitimes Stop-Signal, exitet sauber und springt zu Push + PR.

- [ ] **Push + PR am Ende.** `git push -u origin <branch>` plus `gh pr create --fill --base main` (oder Fallback-Hinweis, wenn `gh` fehlt).

- [ ] **Idempotenz.** Doppelter Aufruf auf demselben Branch ist nicht zerstörerisch (Pre-Run-Check fängt offene Worktree-Änderungen ab, `git push` ist benign idempotent).

- [ ] **Smoke-Run mit `N=1`** durchgeführt oder explizit als zurückgestellt dokumentiert. Wenn durchgeführt: `ssot-w40k-007.json` ist sauber committed, Halt-Checks alle grün, push + PR erstellt.

- [ ] **Logging:** Pro Iteration klare Stdout-Zeilen („=== Iteration k/N ==="; Halt-Check-Resultate). Optional Step-Log-File, in `.gitignore` eingetragen.

- [ ] **Lint/Typecheck/Shellcheck** grün, soweit anwendbar.

## Open questions

- **Bash vs PowerShell.** Philipp ist auf Windows. PowerShell-natürlich, Bash funktioniert via Git Bash. CC's Wahl mit Begründung im Report — Tendenz Cowork: Bash mit Git-Bash-Hinweis im Header, weil das Skript zum Rest des Projekts (Node-Skripte unter `scripts/*.ts`) symmetrisch bleibt und macOS-/Linux-Maintainer-Beitritt offen hält. Aber CC darf für PowerShell argumentieren.

- **`claude -p` exakte Flag-Form.** Genauer Flag-Name für Tool-Allowlist (`--allowedTools` vs `--allowed-tools` vs `--allow-tool`) hat sich in CC-Versionen geändert. CC prüft die installierte Version und nutzt das richtige. Im Skript-Header dokumentieren, gegen welche CC-Version getestet wurde.

- **PR-Body-Vorbefüllung.** Cowork-Tendenz: minimaler PR-Body („Loop-Iterationen NNN–MMM via run-ssot-loop.sh. Siehe `sessions/ssot-loop-log.md` für Per-Buch-Notes."). CC darf etwas mehr Vorbefüllung machen (z.B. eine kompakte Liste der entstandenen Override-Files), aber keine Synopsis-Zitate.

- **Behandlung von `gh` ohne Auth.** Wenn `gh` installiert ist aber nicht authentifiziert (`gh auth status` failt): Skript darf den Lauf nicht failen, nur den PR-Create-Schritt überspringen und Hinweis ausgeben. CC's Wahl wie er das prüft (vor dem `gh pr create`-Aufruf oder als Catch-am-Stderr).

- **Cost-Sichtbarkeit.** Soll das Skript am Ende eine summarische „Iterationen gelaufen, schätzungsweise N Bücher in Authority"-Zeile ausgeben? Cowork: ja, nice-to-have. CC's Call ob er das aus dem letzten Loop-Log-Block parst oder einfach „Lauf erfolgreich, M Iterationen, K Override-Files entstanden" als Minimal-Statement ausgibt.

## Notes

### Beispiel-Skript-Skelett (illustrativ, nicht final — CC legt finale Form fest)

```bash
#!/usr/bin/env bash
# scripts/run-ssot-loop.sh
# Headless wrapper around Brief 061 (SSOT Loop). Runs N iterations in
# successive `claude -p` subsessions, then pushes + opens a PR.
#
# Usage:   ./scripts/run-ssot-loop.sh [iterations=5]
# Requires: claude in PATH, clean worktree, current branch != main.
# Optional: gh CLI for auto-PR (otherwise prints manual hint).

set -euo pipefail

ITERATIONS="${1:-5}"
BRIEF="sessions/2026-05-11-061-arch-ssot-loop.md"
ALLOWED_TOOLS="Read,Write,Edit,Bash,Glob,Grep,WebSearch"

# --- Pre-run checks (worktree clean, branch != main, claude in PATH, ...)
# --- For i in 1..ITERATIONS:
#       record file-set-before
#       claude -p "Brief $BRIEF ausführen. Eine Iteration." \
#              --allowedTools "$ALLOWED_TOOLS"
#       record file-set-after
#       run halt checks (medium tier)
#       if resolver-pause detected -> break, exit cleanly
#       if halt check fails       -> exit non-zero
# --- git push
# --- gh pr create --fill --base main  (or manual hint)
```

### Halt-Check Tier „Mittel" — konkret

Nach jeder Iteration:

```
1. Exit code von claude -p == 0
2. git ls-files --others --exclude-standard scripts/seed-data | grep manual-overrides-ssot-
   → genau eine neue Datei, ODER null neue Dateien (Resolver-Pause-Kandidat)
3. Wenn ein neuer File: jq empty <file>                            (JSON valid)
4. jq '."$schema"' <file>      == "manual-overrides-v1"
   jq '.batch'                  =~ ssot-(w40k|hh)-[0-9]+
   jq '.books | length'         in [1..10]
5. git log -1 --name-only       (CC's commit existiert, listet die neue Datei)
6. git diff HEAD~1 -- sessions/ssot-loop-log.md  (Log gewachsen)
   bei Resolver-Pause: neuer Block enthält "⏸"
```

CC kann Reihenfolge anpassen; entscheidend ist das Verhalten und dass kein Verstoß durchrutscht.

### Beispiel-Lauf

```
$ git checkout -b ingest/batches-007-010
$ ./scripts/run-ssot-loop.sh 5

[run-ssot-loop] Pre-run checks ...
  ✓ worktree clean
  ✓ branch != main (ingest/batches-007-010)
  ✓ claude in PATH (claude-code 1.x)
  ✓ gh available + authenticated

[run-ssot-loop] === Iteration 1/5 ===
  claude -p "Brief 061 ausführen ..." (subsession)
  → manual-overrides-ssot-w40k-007.json (10 books, JSON valid)
  → ssot-loop-log.md grew by 1 block (committed as 0d4f12a)
  ✓ all halt-checks green

[run-ssot-loop] === Iteration 2/5 ===
  ...

[run-ssot-loop] === Iteration 4/5 ===
  ...
  → manual-overrides-ssot-w40k-010.json (10 books, cumulative=100)

[run-ssot-loop] === Iteration 5/5 ===
  claude -p "..."
  → no new override file produced
  → ssot-loop-log.md grew by 1 block with ⏸ marker
  ✓ resolver pause detected — stopping cleanly

[run-ssot-loop] Pushing branch ...
  ✓ pushed ingest/batches-007-010
  ✓ PR opened: https://github.com/.../pull/123

[run-ssot-loop] Done. 4 iterations succeeded, 1 resolver-pause hit.
                Next step: schreibe Resolver-Brief (OQ4 + OQ5 für die nächsten 50).
```

### `brain/`-Updates

Out of scope für diesen Brief. Wenn das Skript läuft und sich bewährt, schreibt Cowork in einer späteren Hygiene-Session eine `brain/wiki/workflows/ssot-loop-driver.md`-Page. Für diesen Brief reicht der Skript-interne Header.

### Branch-Naming-Konvention

Cowork-Vorschlag: `ingest/batches-NNN-MMM` (z.B. `ingest/batches-007-010`). Nicht im Skript hart-coded — Maintainer-Hand-Konvention, das Skript wechselt keine Branches. Wenn sich die Konvention bewährt, in der zukünftigen Workflow-Page festziehen.

### Was NICHT in den PR-Body geht

- Keine Synopsis-Auszüge (Brief 052 / Decision: Inline-Diff-Quote-Verbot).
- Keine Per-Buch-Aufzählungen (lebt in `ssot-loop-log.md`).
- Keine Resolver-Empfehlungen (Cowork schreibt den Resolver-Brief, nicht der Driver).

PR-Body-Vorschlag (CC darf abweichen, solange minimal):

```
Loop-Iterationen NNN–MMM via scripts/run-ssot-loop.sh.

Override-Files entstanden:
- scripts/seed-data/manual-overrides-ssot-w40k-NNN.json
- ...

Resolver-Pause bei kumulativ X Büchern (Brief 061-Loud-Stop).
Per-Buch-Notes: sessions/ssot-loop-log.md.
```

---

Brief 071 ist ein Tooling-Brief. CC entscheidet Bash vs PowerShell, Halt-Check-Form, `gh`-Detection-Heuristik, exakte `claude -p`-Flag-Form. Cowork ist streng bei: 50er-Cadence respektieren, Brief 061 nicht anfassen, kein Auto-Merge, kein Auto-Resolver-Trigger, kein `--dangerously-skip-permissions`.
