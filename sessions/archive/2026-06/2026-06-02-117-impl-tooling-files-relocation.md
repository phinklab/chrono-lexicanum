---
session: 2026-06-02-117
role: implementer
date: 2026-06-02
status: implemented
slug: tooling-files-relocation
parent: 2026-06-02-117
links: [2026-06-02-117, 2026-06-01-111]
commits: []
---

# Tooling-Files-Relocation — Impl-Report (Brief 117)

Reine Relocation + Re-Pointing + Pfad-Zentralisierung. **Keine** Loop-Logik, **kein** Runbook-Inhalt geändert. Code-Session im Koordinations-Worktree (`chrono-lexicanum`), Branch `codex/session-117-tooling-relocation` von `origin/main`.

## Was bewegt wurde (git mv, History erhalten)

- **4 Runbooks** `sessions/` → `scripts/runbooks/`: `ssot-loop-runbook.md`, `resolver-pass-runbook.md`, `consolidation-pass-runbook.md`, `db-rebuild-runbook.md`.
- **2 Loop-Logs** `sessions/` → `scripts/logs/`: `ssot-loop-log.md`, `resolver-loop-log.md` (append-only, Inhalt unangetastet).
- **Briefs 102 + 107 mit-archiviert** → `sessions/archive/2026-05/` (waren als einzige geschlossenen Paare config-`.brief`-gekoppelt → in Brief 111 bewusst zurückgehalten).

## Pfad-Zentralisierung — eine Stelle pro Runner-Familie statt ~10 Literale

- **Neu `scripts/lib/tooling-paths.ts`** — geteilte TS-Konstanten `RESOLVER_LOOP_LOG_PATH` (`scripts/logs/resolver-loop-log.md`) + `RESOLVER_PASS_RUNBOOK_PATH` (`scripts/runbooks/resolver-pass-runbook.md`), extensionslos importiert von `resolver-loop-detect.ts` (Detektor, dedupt den 2× verwendeten Runbook-Pfad + den Log-Pfad) und `resolver-loop-log-update.ts` (Updater-Default).
- **Shell-Driver-Konstanten:** `run-ssot-loop.sh` trägt `readonly LOG_PATH=scripts/logs/ssot-loop-log.md` + neu `readonly RUNBOOK_PATH=scripts/runbooks/ssot-loop-runbook.md` (Heredoc `base_trigger()` von `<<'EOF'` auf `<<EOF` umgestellt, damit `${RUNBOOK_PATH}` interpoliert — Body sonst frei von `$`/Backticks geprüft); `run-resolver-loop.sh` trägt `readonly LOG_PATH=scripts/logs/resolver-loop-log.md` und reicht es im Loop explizit als `--log-path $LOG_PATH` an den Detektor durch. **Im Loop ist die Shell die Autorität**, die TS-Konstanten sind der Standalone-Fallback (`npm run resolver:next-wave`). Künftiger Umzug = 1 Edit pro Sprache.
- **Configs:** `run-resolver-pass.sh` liest `.runbook` aus der Config (harter `-f`-Die unverändert, `run-resolver-pass.sh:233/236`).

## Re-Pointing (Refs, nicht Logik)

- Narration/Header der 6 Shell-/TS-Files.
- **4 Config-JSONs:** `.runbook` → `scripts/runbooks/…` (`resolver-pass`, `consolidation-pass`, `consolidation-pass-2`, `db-rebuild`); `consolidation-pass-2`/`db-rebuild`-`.brief` → neue `sessions/archive/2026-05/…`-Pfade.
- **`CLAUDE.md` + `AGENTS.md`:** je 3 Runbook-Callouts (SSOT/Resolver/Consolidation) + die Batches-Strang-Write-Path-Zeile (`sessions/ssot-loop-log.md` → `scripts/logs/ssot-loop-log.md`).
- **`brain/wiki/pipeline-state.md`:** Frontmatter-`sources:` (3) + Body-Path-Claims (Runbooks + Loop-Logs).
- **`brain/wiki/decisions/cross-era-identities.md`:** `sources:` + Body-Links — 102-arch/impl → `archive/`, `resolver-pass-runbook` → `scripts/runbooks/`.

## Verifikation (OHNE echten SSOT-/Resolver-Wave-Lauf)

- **Gate-Grep:** `git grep -nE 'sessions/[a-z0-9-]*(runbook|loop-log)\.md'` über `scripts/ brain/ CLAUDE.md AGENTS.md docs/` (exkl. der append-only History `scripts/logs/*.md` + `brain/wiki/log.md`) → **Exit 1, keine Treffer**.
- **`tsc --noEmit`** → grün (Exit 0). Der einzige Fehler vorab war `fast-xml-parser` in `src/lib/ingestion/podcast/feed.ts` — pre-existing/environmental (Brief-110-Dep, in diesem Worktree nicht installiert; mein Branch fasst **kein** `src/`-File an); nach `npm install` grün.
- **`brain:lint --no-write`** → 0 blocking, 14 pre-existing warnings (unveränderte Zahl ggü. Brief 111).
- **Statische `-f`-Probe (geführter Abbruch vor echter Arbeit):** alle 4 Config-`.runbook` + die 2 archivierten `.brief` + die Shell-Konstanten (`run-ssot-loop.sh` LOG_PATH+RUNBOOK_PATH, `run-resolver-loop.sh` LOG_PATH) resolven auf existierende Dateien. `run-resolver-pass.sh`-Gate-Logik gelesen + bestätigt: liest `.runbook` (Z. 233), `test -f` darauf (Z. 236), Print `config parsed: … runbook=scripts/runbooks/resolver-pass-runbook.md` (Z. 247) — der Pfad, der jetzt existiert.

## Append-only-Disziplin

`brain/wiki/log.md` (dieser 117-Eintrag = Append, kein Rewrite) + die 2 verschobenen Loop-Logs behalten ihre historischen `sessions/…`-Erwähnungen bewusst — Historie, kein lebender Pfad. Der Linter exemptet `log.md` von Path-Claims (`scripts/brain-lint.ts:1071`).

## Brief-Status

`sessions/2026-06-02-117-arch-tooling-files-relocation.md`: `status: open → implemented` (Ein-Zeilen-Edit, reitet in dieser Code-PR mit, PR-Policy „code-handing brief").
