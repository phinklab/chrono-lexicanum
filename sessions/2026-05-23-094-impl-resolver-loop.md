---
session: 2026-05-23-094
role: implementer
date: 2026-05-23
status: complete
slug: resolver-loop
parent: 2026-05-23-094
links:
  - sessions/2026-05-23-094-arch-resolver-loop.md
  - sessions/resolver-loop-log.md
  - sessions/resolver-pass-runbook.md
commits:
  - ef32079
  - 94095a3
  - 1484698
---

# Brief 094 — Resolver-Loop entkoppeln + headless

## Summary

Bausteine 1–4 alle umgesetzt: der SSOT-Loop läuft ohne Cadence-Pause durch,
ein pure-core Wellen-Detektor produziert per-Welle ResolverPassConfigs (115-
Buch-Rest = 60 + 55), Runbook + CLAUDE/AGENTS sind brief-frei und der neue
`scripts/run-resolver-loop.sh` chainet Wellen automatisch mit Resume + Halt-
Disziplin + State-File-Bookkeeping. Live-Smoke gegen den Repo-Stand sagt
`idle` (Pass 7 ist gemerged, 046+ noch nicht kristallisiert) — die Schiene
ist scharf, sobald der SSOT-Loop weiter läuft.

## What I did

**Baustein 1 — SSOT-Loop ↔ Resolver entkoppelt** (Commit ef32079)

- `scripts/loop-next-batch.ts` — Cadence-Konstanten + Helper raus
  (`isCadenceBoundary`, `nextCadenceBoundaryAfter`, `buildPauseHeadingRegex`,
  `logHasPauseBlockFor`); `Decision` ohne `resolverPause`/`nextResolverPauseAt`;
  `logPath` raus aus `DecideInput`/`parseArgs`/`loadInputs`.
- `scripts/run-ssot-loop.sh` — `resolver_pause_now`-Helper raus,
  Pause-Halt-Check-Sondervariante (0-new-overrides erlauben) raus,
  `RESOLVER_PAUSE_HIT`/`CUMULATIVE_AT_PAUSE`/`FINAL_PAUSE_PROBE` raus,
  Final-Pausenprobe + `resolver_pause`-Case raus, `pr_body`/`pr_title`
  ohne Pause-Sprache. Docblock-Erklärung der 100er-Cadence raus.
- `scripts/test-loop-next-batch.ts` — 6 Pause-Cadence-Tests entfernt;
  Batch-Selection-Tests an die schlanke `Decision`-Shape angepasst (alle
  9 grün).
- `sessions/ssot-loop-runbook.md` — Pause-Block-Spec, `resolverPause`-
  Detect-Variante, Vertrauensmodell raus.

**Baustein 2 — Wellen-Detektor + Auto-Config** (Commit 94095a3)

- `scripts/resolver-loop-detect.ts` (neu) — pure-core Detektor.
  - `partitionWaves(openBatches, hardCap=60)` — greedy contiguous partition
    mit Hard-Cap UND Target-Boundary (`Math.ceil(total/N)`); ein Zwischen-
    Wave schließt entweder bei Overflow ODER wenn `reachedTarget && result.length < N-1`.
    Für den 115-Bücher-Rest (Batches 046..057 = 11×10 + 5): `waveCount =
    ceil(115/60) = 2` → 046..051 (60) + 052..057 (55).
  - `detectNextWave(input)` — drei Terminal-Zustände:
    `open-wave` (offene Batches + W40K nicht erschöpft → erste Welle +
    Auto-Config), `idle` (kein File über Fortschritt — SSOT-Loop muss weiter),
    `w40k-complete` (Fortschritt deckt das volle W40K-Roster — HH ignoriert).
    Keiner der Terminal-Zustände stoppt den Loop mit `## Needs decision`.
  - `buildWaveConfig(wave)` — mechanische ResolverPassConfig: `pass`
    aus Loop-Log + 1, `wave`-Label `ssot-w40k-AAA..BBB`, `aggregator.batches`
    als Liste, `applyRange` kumulativ ab 1, `verify.newRange/oldRange/
    ratingRange` aus Batch-Nummern × 10, `smokeSlugs` = letztes Buch je Batch
    (deterministisch). Generische Phase-Trigger ohne handgeschriebene
    Lore + ohne Brief-Status-Update.
  - `parseResolverLoopLog(content)` — erkennt zwei Block-Shapes: per-Welle-H2
    (zählt als komplett iff ≥6 `[x] Phase`-Bullets) und Bootstrap-Bullet
    `[x] Pass N..M ... ssot-w40k-AAA..BBB`. Empty Log → `progress=0, nextPass=1`.
  - Thin CLI `--roster-path`/`--seed-dir`/`--log-path`/`--write-config`.
- `scripts/test-resolver-loop-detect.ts` (neu, 18 Tests) — partitionWaves
  (115-Split, single-wave, leer, hard-cap), detectNextWave (open-wave / idle ×2
  / w40k-complete), buildWaveConfig (generische Trigger, per-Batch-Override-
  Files in 4a-Scope, Dossier+Status+ImplReport tracken Pass-Nr, kein `brief`,
  kein `clusters`), parseResolverLoopLog (bootstrap, completed, partial,
  empty, bootstrap+pass8).
- `sessions/resolver-loop-log.md` (neu) — Bootstrap-Block `## 2026-05-23
  · Bootstrap (Pre-Loop-State)` mit `[x] Pass 1..7 (Welle ssot-w40k-001..045,
  450 Bücher)` — daraus liest der Detektor `progress=45, nextPass=8`.
- `package.json` — `resolver:next-wave` + `test:resolver-loop-detect`-Scripts.

**Baustein 3 — Brief-freies Runbook** (Commit 1484698)

- `scripts/resolver-pass.config.json` — `brief`-Feld weg; `$comment` notiert
  Auto-Regeneration durch den Detektor.
- `scripts/run-resolver-pass.sh` — `BRIEF_PATH` parsing + Existence-Check raus;
  Phase-Trigger-Heredoc reformuliert (expliziter "KEINEN Brief — weder
  Brief 076 noch per-pass Architect-Brief"); `pr_body` ohne Brief-Referenz;
  Docblock-Shape-Doku ohne `brief`.
- `sessions/resolver-pass-runbook.md` — 10 Brief-Pointer durch inline-Prosa
  ersetzt; Header-Quote ohne "Brief 076 = Design"; neuer Anhang "Herkunft"
  listet die Briefs (076/090/091/094) für Background-Interessierte.
- `CLAUDE.md` Zeile 30 — "Resolver-Pass-Phase?" → "Resolver-Welle?", expliziter
  "Lies keinen Brief".
- `AGENTS.md` Zeile 25–33 — englischer Mirror plus expliziter "skip step 6
  of the session-start reading routine".

**Baustein 4 — Headless Loop-Driver** (Commit 1484698)

- `scripts/run-resolver-loop.sh` (neu) — Geschwister von `run-ssot-loop.sh`.
  Pre-Checks (worktree clean, branch != main, claude / node / npx in PATH,
  gh authenticated, Pass-Driver existiert) → Schleife (Detektor →
  `--write-config scripts/resolver-pass.config.json` → Config-Commit falls
  geändert → Resume-Check via inline-Node → Pass-Driver mit
  `--no-finalize --start-phase $S --phase-timeout 1800` → State-File lesen
  → Loop-Log-Block updaten + committen → weiter) → Finalisierung (push +
  PR einmal). Flags `--dry-run` + `--max-waves N`. Exit-Codes 0/1/2/3/4/5/6
  spiegeln den Pass-Driver.
- `scripts/resolver-loop-log-update.ts` (neu) — pure-core (`renderWaveBlock`,
  `parseWaveBlockShas`, `upsertWaveBlock`) + thin CLI für das Rendern + Upserten
  von Wellen-Blöcken in `sessions/resolver-loop-log.md`. Behält SHAs aus
  älteren Partial-Blocks (Resume-Pfad).
- `scripts/run-resolver-pass.sh` — drei neue Flags: `--no-finalize`
  unterdrückt push+PR; `--start-phase <name>` überspringt vorherige Phasen
  (PHASES_COMPLETED wird vorab auf den INDEX gezogen); `--phase-timeout <sec>`
  (Default 1800) wrappt `claude -p` in GNU `timeout -k 30`; Exit-Code 6
  neu für Timeout. Pro Phase wird `scripts/.last-resolver-pass-state.json`
  geschrieben mit `outcome ∈ {running, success, needs_decision, halt,
  claude_fail, timeout}` + `phasesRan: [{name, sha}]` + `needsDecision`-Pointer.
- `.gitignore` — `/scripts/.last-resolver-loop.log` +
  `/scripts/.last-resolver-pass-state.json`.

## Decisions I made

- **`resolver-loop-log-update.ts` als eigenes File, nicht im Detektor mit
  drangezogen.** Der Detektor liest den Log, der Updater schreibt ihn — zwei
  saubere Verantwortungen. Reduziert die CLI-Oberfläche jedes einzelnen
  Files. Der Wrapper invokt beide via `npx tsx`.
- **Resume-Check inline in der Bash, nicht via `tsx`-Import aus dem
  Updater-File.** Node kann kein nacktes `.ts`-Modul importieren; `npx tsx
  --eval` mit `import './scripts/...ts'` ist fragil. Stattdessen: eine
  Self-contained Node-Heredoc-Inline-Regex (10 Zeilen) im Wrapper — keine
  Laufzeit-Abhängigkeit von Updater-File-Layout, gleiche Phase-Order-
  Konstante wie der Updater (verifiziert per `bash -n` + Live-Smoke).
- **Pro Welle 8 Commits (1 Config-Prep + 6 Phase + 1 Log-Update).** Der
  Pass-Driver verlangt einen sauberen Worktree, deshalb muss die Auto-Config-
  Änderung VOR dem Pass-Driver committet sein. Pro 115-Buch-Rest (2 Wellen)
  also ~16 Commits — überschaubar; Commit-Subjects sind selbsterklärend
  (`Resolver-Loop: prepare Pass N config` / `Resolver-Loop: Pass N (Welle X)
  — 6/6 ✓`).
- **`--max-waves` Default 10.** Hoch genug für den 115-Buch-Rest (2 Wellen)
  ohne Re-Invocation; niedrig genug, dass ein Wrapper-Bug nicht den ganzen
  Roster in einem Shot durchpeitscht.
- **`--phase-timeout` Default 1800s (30 min).** Phase-3 / Phase-4a sind
  in Pass 7 jeweils ~20–25 min gelaufen; 30 min lässt Spielraum, ohne tote
  Sessions dauerhaft offen zu halten. GNU `timeout` wird erkannt; ohne
  ihn warnt der Wrapper und läuft ohne Timeout weiter.
- **Resume schreibt vorhandene Phase-SHAs aus dem Partial-Block in den
  neuen Block zurück** (`parseWaveBlockShas` im Updater). Andernfalls
  würde ein Resume von Phase-3 die SHAs für Phase 0–2 löschen.
- **Outcome-Footer im Wellen-Block** (`_Outcome: **needs-decision** — phase
  X._`) statt nur an die betroffene Bullet. Schneller fürs Auge,
  Block-Boundary klar.

## Verification

- `npm run lint` — pass (nur das vorbestehende `pages/_document.js`-Warning
  in `src/app/layout.tsx`, unrelated).
- `npm run typecheck` — pass.
- `npm run test:resolver` — 236 / 236 pass.
- `npm run test:resolver-data` — pass.
- `npm run test:resolver-coverage` — pass (below-threshold rows sind data
  findings, kein Failure).
- `npm run test:apply-override-dry` — pass.
- `npm run test:loop-next` — 9 / 9 pass.
- `npm run test:resolver-loop-detect` — 18 / 18 pass.
- `npm run brain:lint -- --no-write` — 0 blocking, 14 warnings (alle aus
  Pre-094-Inhalten).
- `bash -n scripts/run-resolver-loop.sh` — clean.
- `bash -n scripts/run-resolver-pass.sh` — clean.
- **Live-Smoke `npm run resolver:next-wave`** gegen Repo-Stand →
  `{ "status": "idle", "reason": "progress at ssot-w40k-045; no later batches
  crystallized" }` (erwartet — Pass 7 gemerged, SSOT-Loop hat noch keine
  046+ kristallisiert).
- **Live-Smoke `bash scripts/run-resolver-loop.sh --dry-run`** —
  pre-checks alle grün, detektiert `idle`, exit 0 ohne `claude -p`-Aufruf.

## Open issues / blockers

Keiner. Der Trial-Lauf (115 W40K-Reste headless) ist explizit operativ —
Philipp triggert ihn nach Merge dieser PR, indem er den SSOT-Loop ein paar
Iterationen weiter laufen lässt (kristallisiert Override-Files 046+),
und dann `bash scripts/run-resolver-loop.sh` startet.

## For next session

- **HH-Resolver-Schiene.** Der Detektor ist W40K-only (Plan-Mandat). Sobald
  W40K resolved ist (alle 565), wechselt der status auf `w40k-complete`
  und der Loop verlässt — HH-Override-Files werden ignoriert. Sobald HH
  drankommt, muss entweder der Detektor um eine Domain-Achse erweitert
  werden (zweite Schleife W40K → HH) ODER ein zweiter HH-Detektor mit
  spiegelnden Schwellen entstehen.
- **Resume nach Pass-Driver-Crash zwischen Phase und Log-Commit.**
  Konkret: wenn der Wrapper zwischen dem Pass-Driver-Return und dem Log-
  Update-Commit crashed (extrem unwahrscheinlich, aber denkbar), zeigt
  HEAD die Phase-Commits, aber kein Wellen-Block im Log — der nächste
  Wrapper-Lauf würde die Welle als "nicht gestartet" ansehen und Phase-0
  von Neuem fahren. Mitigation für eine spätere Iteration: State-File
  als zweite Quelle der Wahrheit beim Resume mitlesen.
- **`scripts/resolver-loop-log-update.ts` hat aktuell keine Unit-Tests.**
  Die Logik ist mechanisch (Regex + Splice), wird vom Live-Smoke implizit
  geprüft. Wenn das File mal komplex wird (z. B. Multi-Wellen-Block-
  Reflow), Tests nachziehen.
- **`brain/wiki/`-Hygiene-Pass für die Brief-094-Begriffe.** Die Wiki-
  Seiten erwähnen noch hier und dort "per-pass Brief"-Sprache; OQ (3)
  ist ohnehin offen — nächste Brain-Sweep-Session zieht das mit.

## References

- Brief 094: `sessions/2026-05-23-094-arch-resolver-loop.md`
- Runbook: `sessions/resolver-pass-runbook.md`
- Loop-Log (Bootstrap + zukünftige Wellen): `sessions/resolver-loop-log.md`
- Vorgänger: Brief 091 (Phase-4-Split), Brief 088 (SSOT-Loop-Decouple-
  Vorlage), Brief 071 (Loop-Driver-Schema)
