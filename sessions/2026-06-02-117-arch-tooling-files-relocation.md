---
session: 2026-06-02-117
role: architect
date: 2026-06-02
status: open
slug: tooling-files-relocation
parent: 2026-06-01-111
links: [2026-06-01-111]
commits: []
---

# Tooling-Files raus aus dem Brief-Namespace + Pfad zentralisieren

## Goal

Die sechs **lebenden Tooling-Files** (2 Loop-Logs + 4 Runbooks) aus `sessions/` in die Tooling-Domäne ziehen und den Pfad pro Runner-Familie an **einer** Stelle definieren — damit `sessions/` wieder reine Architekt↔Implementer-Korrespondenz ist und die Loop-Scripts nicht mehr blind in den Doc-Namespace greifen. Das ist der Code-PR-Teil, der aus Brief 111 herausgelöst wurde, nachdem CC die harte Script-Kopplung gefunden hat.

## Context

Brief 111 (doc-only-Sweep) ging davon aus, Logs + Runbooks seien reine Docs und ließen sich per `git mv` verschieben. CC hat beim Implementieren das Gegenteil verifiziert — es sind last-tragende Pfade im mechanischen Tooling:

- `scripts/run-resolver-pass.sh:236` — `if [[ ! -f "$RUNBOOK_PATH" ]]; then die …` (Runner bricht hart ab, wenn die Runbook am erwarteten Pfad fehlt; `$RUNBOOK_PATH` kommt aus dem `.runbook`-Feld der Config).
- `scripts/run-ssot-loop.sh:52` + `scripts/run-resolver-loop.sh:66` — `readonly LOG_PATH="sessions/…-log.md"` als Write-Target, plus ein **strikter Diff-Shape-Check** (`run-ssot-loop.sh` ~278: die committeten Pfade müssen exakt `{NEW_FILE, LOG_PATH}` sein).
- `scripts/run-ssot-loop.sh:153` — der Agent-Prompt (Heredoc) sagt wörtlich „Lies sessions/ssot-loop-runbook.md".
- `scripts/resolver-loop-log-update.ts:245` — `path.join(repo,"sessions","resolver-loop-log.md")` (Default-Log-Pfad; der Runner reicht ihn zwar via `--log-path` durch, aber die Konstante existiert doppelt).
- `scripts/*.config.json` — `.runbook`-Felder (resolver-pass, consolidation-pass ×2, db-rebuild) und `.brief`-Felder (→ Briefs 102, 107) referenzieren `sessions/…`-Pfade.

Deshalb: Verschieben = `scripts/`-Edits = **Code-PR**, nicht doc-only. Entscheidung mit Philipp (2026-06-02): rausziehen **und** zentralisieren (nicht „liegen lassen").

**Warum Koordinations-Worktree, nicht Batches:** dieser Change ist quer — er fasst `scripts/**` (Batches-Territorium) **und** `brain/**` + `sessions/`-Struktur + `CLAUDE.md` an und muss **atomar** landen (sonst zeigen Scripts und Files für ein Fenster auseinander → kaputter Loop). `brain/**` ist Strang-Worktrees verboten (Rollup-Ownership, Brief 095), aber im **Koordinations-Worktree** frei schreibbar — genau wie bei Brief 095 selbst (meta/session-Code-Arbeit). Also: ein PR aus `chrono-lexicanum` (Koordination), Branch `codex/session-117-tooling-relocation`. Kein Cross-Worktree-Split, kein Backfill-Fenster.

**Zielort (architektonisch festgelegt):** `scripts/runbooks/` (die 4 Runbooks) + `scripts/logs/` (die 2 Loop-Logs). Begründung: es ist Tooling-State und Tooling-Spec — es gehört neben die Runner, die es lesen/schreiben, nicht in den Brief-Namespace. (CC: falls die exhaustive Ref-Suche einen zwingenden Grund gegen `scripts/`-Unterordner zeigt, im Report als `needs-decision` melden statt still etwas anderes zu wählen.)

## Constraints

- **Atomar in einem PR.** Datei-Moves (`git mv`), alle `scripts/`-Ref-Updates, `CLAUDE.md`-Callouts und `brain/**`-Ref-Rewrites landen zusammen. Nach dem Merge zeigt nichts mehr auf einen `sessions/…-log.md`- oder `sessions/…-runbook.md`-Pfad.
- **Pfad pro Runner-Familie an einer Stelle.** Der Log-Pfad ist genau einmal autoritativ (die Shell-`LOG_PATH`-Konstante); Helfer wie `resolver-loop-log-update.ts` bekommen ihn als Argument, statt ihn erneut hartzukodieren. Der ssot-loop-Runbook-Pfad wird (wie der Resolver-Runbook-Pfad schon) aus **einer** Variable/Config gelesen statt im Heredoc-String zu stehen. Ziel: ein künftiger Move ist ein Ein-Zeilen-Edit pro Familie, nicht ~10 verstreute String-Literale.
- **Verhalten unverändert.** Reine Relocation + Re-Pointing + Zentralisierung. Runbook-**Inhalte**, Loop-Logik, Diff-Shape-Regeln, Commit-Shape bleiben identisch — nur die Pfade ändern sich.
- **Kein echter Wave-/Loop-Lauf zum Testen.** Verifikation rein statisch + Smoke (s. Acceptance); **niemals** eine echte SSOT-/Resolver-Welle starten (würde Bücher resolven, State mutieren, Budget verbrennen).
- **`.brief`-Provenance ehrlich halten.** Beim Archivieren von 102/107 die `.brief`-Felder in den betroffenen Configs auf die neuen `archive/2026-05/`-Pfade nachziehen (nicht verwaisen lassen).
- Git nie aus der Sandbox; PowerShell-Befehle zeilenweise (kein `&&`). Branch von `origin/main`.

## Known anchor points (exhaustiv greppen — Liste ist Startpunkt, nicht abschließend)

CC: vor und nach dem Move `grep -rn` über `scripts/ brain/ CLAUDE.md docs/` laufen lassen. Bekannte Treffer:

- `scripts/run-ssot-loop.sh` — `LOG_PATH` (~52), Heredoc-Runbook-Ref (~153), Kommentare (6, 8, 385).
- `scripts/run-resolver-loop.sh` — `LOG_PATH` (~66), Kommentare (15, 20, 21, 28), Runbook-Print (~506).
- `scripts/run-resolver-pass.sh` — `.runbook`-Read + `-f`-Die (~233/236), Agent-Prompt inkl. „NICHT das volle ssot-loop-log.md" (~374–382), Kommentar (468), Print (611).
- `scripts/resolver-loop-log-update.ts` — `logPath` (~245) + Header-Kommentare (2, 3, 17).
- `scripts/resolver-loop-detect.ts` — `resolver-pass-runbook.md` in Narrations-Strings (~366, 374, 381, 389 …).
- `scripts/resolver-pass.config.json` — `.runbook` (5) + `$comment` (2).
- `scripts/consolidation-pass.config.json` / `consolidation-pass-2.config.json` — `.runbook` (5), `.brief` (→102), `.dossier`.
- `scripts/db-rebuild.config.json` + `scripts/db-rebuild.sh` — `.runbook` (→db-rebuild-runbook.md), `.brief` (→107).
- `scripts/run-phase4-apply.sh` — liest `aggregator.*` (Consolidation-Runbook dort nur Provenance — trotzdem prüfen).
- `CLAUDE.md` — die drei `>`-Mechanical-Task-Callouts (ssot-loop, resolver-Welle, consolidation/db-rebuild) nennen die Runbook-Pfade.
- `brain/wiki/**` — Runbook-/Log-Verweise (Teil der ~44 Refs aus Brief 111; nur die auf diese 6 Files betreffen 117, der Rest gehört zu 111).

## Out of scope

- **Kein Verhaltens-/Logik-Refactor** an den Loops, Resolvern, Configs — nur Pfade.
- **Keine Runbook-Inhaltsänderung.**
- `resolver-dossiers/` bleibt unangetastet (lebender Ordner; aktive Wellen-Dossier ist live aus `resolver-pass.config.json` referenziert).
- Der doc-only-Archiv-Sweep (098–106 + Kollision 115/116) ist **Brief 111** und landet vorher separat — 117 fasst nur 102/107 an (weil die script-gekoppelt sind).
- Keine bereits in Brief 111 geslimmten Synthese-Files weiter umschreiben.
- Kein Schema, keine Migration, keine Dependency.

## Acceptance

Die Session ist fertig, wenn:

- [ ] Die 4 Runbooks liegen in `scripts/runbooks/`, die 2 Loop-Logs in `scripts/logs/` (oder das im Report begründete Alternativ-Layout); unter `sessions/` liegt keine dieser 6 Files mehr.
- [ ] 102 + 107 (arch+impl) sind nach `archive/2026-05/` verschoben; die `.brief`-Felder ihrer Configs zeigen auf die neuen Pfade.
- [ ] `grep -rn` über `scripts/ brain/ CLAUDE.md docs/` findet **keinen** Verweis mehr auf `sessions/ssot-loop-log`, `sessions/resolver-loop-log` oder `sessions/*-runbook.md`.
- [ ] Der Log-Pfad ist pro Runner einmal autoritativ definiert; `resolver-loop-log-update.ts` kodiert ihn nicht mehr separat hart. Der ssot-loop-Runbook-Pfad steht in einer Variable/Config, nicht mehr als Literal im Heredoc.
- [ ] Smoke ohne echten Wave-Lauf grün: `run-resolver-pass.sh` kommt mit der neuen Runbook am `-f`-Check **vorbei** (kein Die); der ssot-loop-Diff-Shape-Check referenziert die neue `LOG_PATH`. CC dokumentiert im Report, wie geprüft (Dry-Run-Flag / geführter Abbruch vor echter Arbeit).
- [ ] `npm run brain:lint -- --no-write` läuft grün; `tsc --noEmit` (bzw. der Projekt-Typecheck) grün.
- [ ] Ein Branch `codex/session-117-tooling-relocation` aus dem Koordinations-Worktree, ein PR. Philipp merged.

## Open questions

- Kriegen `consolidation-pass-runbook.md` + `db-rebuild-runbook.md` denselben Move wie die zwei aktiv-geloopten Runbooks (ssot-loop, resolver-pass)? Vorschlag **ja** — alle 4 nach `scripts/runbooks/`, damit „Runbook" ein Ort ist. Falls einer davon toter/aufzulösender Ballast ist, im Report melden.
- Lohnt eine winzige geteilte Pfad-Konstante (z.B. `scripts/lib/paths.sh` gesourced + ein `paths.ts`-Export), oder reicht „je eine Konstante pro Runner"? CC entscheidet nach Idiom; Ziel ist nur „nicht ~10 verstreut".

## Notes

Folge-Brief zu 111. Auslöser war CCs `needs-decision`-Report: korrekt erkannt, dass die Brief-111-Prämisse (alles doc-only) an der Script-Kopplung bricht — guter Catch. Architektur-Kern hier: die 6 Files sind **Tooling, kein Brief**; sie verlassen `sessions/`, und der Pfad wird zentralisiert, damit ein nächster Move billig ist. Reihenfolge: 111-Teilmenge zuerst (doc-only → `main`), dann dieser PR.
