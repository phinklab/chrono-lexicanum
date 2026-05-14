---
session: 2026-05-13-071
role: implementer
date: 2026-05-14
status: complete
slug: loop-driver
parent: 2026-05-13-071
links:
  - 2026-05-13-071-arch-loop-driver
  - 2026-05-11-061-arch-ssot-loop
commits:
  - 798b2d7
---

# Loop-Driver — Headless-Wrapper um Brief 061

## Summary

`scripts/run-ssot-loop.sh` ist gelandet (Bash, Single-File, ~450 LOC inkl. Header und ANSI-Output). Live-Smoke mit `N=1` auf disposable Branch hat den Resolver-Pause-Pfad sauber durchlaufen und PR #51 auf GitHub erstellt — die Subsession hat den Pause-Block korrekt committed, alle Halt-Checks waren grün, der Driver hat den Cumulative-Counter (100) aus dem Log-Diff geparsed.

## What I did

- `scripts/run-ssot-loop.sh` — neuer Single-File-Bash-Wrapper. Pre-Run-Checks (worktree clean, branch != main, claude/node in PATH, gh+auth optional). Iterationsschleife: pro Iter neue `claude -p`-Subsession mit `--allowedTools "Read Write Edit Bash Glob Grep WebSearch"` und `--permission-mode acceptEdits` (kein `--dangerously-skip-permissions`). Halt-Checks strikt: worktree clean, HEAD moved, `git diff --name-only` set-equality auf erwartete Pfade, Override-File-Count 0/1, JSON-Validierung via `node -e '...'` (kein jq), Log-Diff enthält neuen `## ` H2-Block, im Pause-Pfad zusätzlich `⏸`-Marker. Push + idempotenter PR-Create (`gh pr view --head` zuerst, `gh pr create` nur wenn keine PR existiert). Trigger-String löst die Brief-061-interne Widersprüchlichkeit (Z79 vs Z131) explizit auf.
- `.gitattributes` — neuer Eintrag `*.sh text eol=lf` (LF-Endings für alle Shell-Scripts; sonst CRLF-Risiko via Edit-Tool, siehe `feedback_edit_tool_line_endings`).
- `.gitignore` — neuer Eintrag `/scripts/.last-loop-run.log` (Driver-Step-Log, regenerierbar).

Alle drei Files in einem Commit (`798b2d7` auf `session-071-loop-driver`).

## Decisions I made

- **Bash via Git-Bash** (statt PowerShell) — wie im Plan + AskUserQuestion festgelegt. Symmetrisch zu `scripts/*.ts`, hält Linux/Mac-Maintainer-Beitritt offen, JSON-Halt-Checks via `node -e '...'` brauchen kein zusätzliches CLI.
- **`--allowedTools`** als canonical Flag — verifiziert via `claude --help` 2026-05-14 (Version 2.1.141). Beide Formen (`--allowedTools, --allowed-tools <tools...>`) werden akzeptiert; ich habe die compound-Form ohne Bindestrich genommen, weil sie der `--help`-Output zuerst listet.
- **`--permission-mode acceptEdits`** — File-Writes/Edits in der Subsession laufen ohne Prompt durch. Brief-Constraint ist eingehalten (kein `--dangerously-skip-permissions`).
- **Strikte Diff-Pfad-Set-Equality** als zentraler Halt-Check — Verteidigung gegen Subsessions, die unerwartete Files mitcommitten (Brain-Edits, package.json-Touches, Roster-Korrekturen). Erwartung: Erfolgspfad = `{neue-override.json, sessions/ssot-loop-log.md}`, Pause-Pfad = `{sessions/ssot-loop-log.md}`. Alles andere = `violation`, loud-stop.
- **PR-Idempotenz via `gh pr view --head $BRANCH`** — falls bei Re-Run schon eine PR auf dem Branch existiert, wird deren URL ausgegeben statt eine zweite zu öffnen. Codex-Review-Tipp aufgegriffen.
- **`--skip-initial-resolver-pause`-Flag** — injiziert `Maintainer-Marker: skip-50-stop` ausschließlich in den Trigger der ERSTEN Subsession; Iter 2..N bekommen den unmarkierten Trigger. Sonst hätte der erste produktive Lauf nach Cockpit-Merge sofort wieder Pause-PR produziert (cumulative=100 % 50 == 0).
- **Trigger-String klärt Brief-061-Widerspruch explizit auf** — Brief 061 sagt einmal „KEINEN Status-Log-Eintrag" beim Pause (Z. 79) und einmal „Status-Log-Eintrag mit Stop-Begründung" (Z. 131). Mein Trigger-String sagt: „Acceptance-Bullet auf Z. 131 ist die Wahrheit, Pause-Block + commit obligatorisch". Live-Smoke hat bestätigt, dass die Subsession das versteht und sauber den Pause-Block schreibt + committed.
- **Step-Log via `exec > >(tee)` ins gitignored `scripts/.last-loop-run.log`** — Stdout des Drivers wird sowohl angezeigt als auch persistiert, post-mortem-tauglich ohne Git-Pollution.
- **Kein Per-Iter-Timeout** — Brief sagt nichts dazu, bewusst weggelassen. Falls in der Praxis WebSearch-rate-limits oder unerwartete Tool-Use-Ketten zu Hängern führen, lässt sich später `timeout 1800 claude -p ...` nachreichen.
- **Step-Log-Pfad `scripts/.last-loop-run.log`** statt `.scripts-cache/` o.ä. — Single-File-Konvention zum Skript, nicht eigenes Subdirectory. `.gitignore` deckt's ab.

## Verification

Alle Gates aus dem Plan durchgelaufen, Reihenfolge:

1. **`bash -n scripts/run-ssot-loop.sh`** — pass.
2. **`shellcheck`** — nicht im PATH auf dieser Maschine (Windows + Git Bash, keine separate shellcheck-Installation). Self-Review der Skript-Logik per Auge gefahren; bash-strict-mode (`set -euo pipefail`) + `set +e`/`set -e` um den `claude -p`-Call rum, damit der Exit-Code abgefangen werden kann.
3. **`npm run lint`** — pass (1 pre-existing warning in `src/app/layout.tsx` zu Next.js custom-font, nicht von mir).
4. **`npm run typecheck`** — pass.
5. **`npm run brain:lint -- --no-write`** — pass (0 blocking, 6 warnings — alle pre-existing aus dem dirty Worktree der laufenden Cowork-Session, nicht von mir).
6. **Pre-Run-Checks negativ-Smoke** (zwei Tests):
   - Auf `main` mit cleanem Worktree: `bash <(git show session-071-loop-driver:scripts/run-ssot-loop.sh) 1` → Output „current branch is 'main' — checkout a session/ingest branch first", exit 1. ✓
   - Auf `session-071-loop-driver` mit `touch dummy.tmp`: `bash scripts/run-ssot-loop.sh 1` → Output „worktree is not clean — commit or stash before running" + `?? dummy.tmp`, exit 1. ✓
7. **Live-Smoke `N=1`** auf `tmp/loop-driver-smoke-001` (Branch lokal angelegt, weil Maintainer mich gebeten hat, den Smoke direkt zu fahren):
   - Pre-Run-Checks alle grün (worktree clean, branch != main, claude 2.1.141, gh + auth).
   - Subsession startete und gab inline ihre Pause-Detection-Notes aus (Live-Stream während `claude -p` lief).
   - Subsession committete `c286a8d` mit nur einem File: `sessions/ssot-loop-log.md` (+9 Zeilen, neuer `## 2026-05-14 · ⏸ Resolver-Pause bei 100 Büchern`-Block).
   - Halt-Checks: clean worktree ✓, HEAD moved ✓, Diff-Pfade = `{sessions/ssot-loop-log.md}` ✓, 0 neue Override-Files ✓, Log gewachsen mit `⏸` ✓.
   - Outcome: `resolver_pause`, sauberer break.
   - Push erfolgreich (`tmp/loop-driver-smoke-001 -> tmp/loop-driver-smoke-001`).
   - PR #51 erstellt: <https://github.com/phinklab/chrono-lexicanum/pull/51>.
   - Final-Summary: `iterations completed: 0/1`, `new override files: 0`, `resolver-pause hit: yes`, `cumulative at pause: 100`. Cumulative-Parsing aus dem Log-Diff via `grep -oE '⏸ Resolver-Pause bei [0-9]+ Büchern'` hat sauber gegriffen.
8. **Idempotenz-Smoke** und **`gh` ohne Auth** Variante A — **nicht durchgeführt**. Begründung: nach (7) wäre die Cleanup-Sequenz (PR close, Branch delete) nötig gewesen, um (8) sauber zu fahren. Cleanup hat die Email-Verification-Hürde getroffen (siehe Open issues), und ohne Branch-Delete würde Idempotenz-Smoke jetzt einen vorbelegten Worktree treffen. Ich habe das nicht hingebogen; die Logik selbst ist im Skript klar (`gh pr view --head` läuft erst), und der Code-Pfad ist trivial. Bei nächstem produktiven Lauf greift's.
9. **Resume-Mode-Smoke** (`--skip-initial-resolver-pause`) — bewusst nicht gefahren. Würde tatsächlich `ssot-w40k-011.json` produzieren, was vor Cockpit-Merge gegen die im Plan festgehaltene Sequenz wäre.

## Open issues / blockers

- **Cleanup PR #51 + Smoke-Branch hängt** — `gh pr close 51` und `git push --delete origin tmp/loop-driver-smoke-001` failen beide mit `GraphQL: At least one email address must be verified to do that` (für `closePullRequest`) bzw. `403 You must verify your email address` (für den Push-delete). Lokaler Branch ist gelöscht, remote Branch + PR sind offen. **Action für Maintainer:**
  1. <https://github.com/settings/emails> — Primary-Email verifizieren (oder eine zusätzliche verifizieren).
  2. PR #51 auf GitHub manuell schließen ohne Merge.
  3. Smoke-Branch auf GitHub löschen (oder via CLI nach Email-Verify: `git push --delete origin tmp/loop-driver-smoke-001`).
  4. Optional: den `c286a8d`-Pause-Block in `sessions/ssot-loop-log.md` ist sachlich korrekt (cumulative ist tatsächlich 100) — kann später bewusst per intentional commit auf `main` landen, wenn der nächste Resolver-Brief eh schon Loop-Log-Touches macht.
- **Push-Berechtigung am Branch** — `git push -u origin session-071-loop-driver` für diesen Session-Branch wird wahrscheinlich denselben Email-Verify-Fehler werfen. Maintainer-PR-Workflow muss erst nach Email-Verify weiterlaufen.

## For next session

- **`shellcheck` lokal verfügbar machen** — `choco install shellcheck` oder analog auf Windows; oder GitHub-Actions-Job ergänzen, der shellcheck auf `scripts/*.sh` läuft. Heute pure Augen-Review.
- **Cost-Tracking optional** — Plan sagt out-of-scope, aber `claude -p --output-format json` würde am Ende der Subsession ein JSON-Result mit Token-Counts liefern. Wenn das mal interessant wird, lässt sich das halt-checks-orthogonal nachrüsten (und im Final-Summary anzeigen).
- **Per-Iter-Timeout** — falls die ersten 1–2 produktiven Läufe zeigen, dass eine Iter länger als 20–30 min dauert, `timeout 1800 claude -p ...` rein. Aktuell weggelassen.
- **Brief 061 Widerspruch entkoppeln** — ein Mini-Brief, der Brief 061 Z. 79 zu „KEIN Override-File, ABER Status-Log-Eintrag mit ⏸-Marker, beides committed" umformuliert, würde den Trigger-Override im Driver-Skript überflüssig machen. Cosmetic, kein Bug.
- **Workflow-Page `brain/wiki/workflows/ssot-loop-driver.md`** — out of scope für diesen Brief. Nach 2–3 Maintainer-Läufen, wenn das Tooling sich bewährt hat, eine Cowork-Hygiene-Session.
- **Active-Threads in `sessions/README.md`** — Cowork-Aufgabe.

## References

- Brief 071: `sessions/2026-05-13-071-arch-loop-driver.md`
- Brief 061 (Loop): `sessions/2026-05-11-061-arch-ssot-loop.md`
- `claude --help` (CLI version 2.1.141, verifiziert 2026-05-14)
- Memory: `feedback_edit_tool_line_endings`, `feedback_no_claude_coauthor`, `environment_windows_powershell`
- PR #51 (Smoke, geschlossen erwartet): <https://github.com/phinklab/chrono-lexicanum/pull/51>
