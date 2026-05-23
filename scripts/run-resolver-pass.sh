#!/usr/bin/env bash
# scripts/run-resolver-pass.sh — Headless driver for axis-sliced Resolver-Passes.
#
# Mirrors `scripts/run-ssot-loop.sh` (Brief 071) but orchestrates the six
# subsessions of an axis-sliced Resolver-Pass (Brief 076/091 — Preflight/Dossier →
# Factions → Locations → Characters → Integration/Apply (4a) → Verify/Report (4b)). Each phase is a fresh
# `claude -p` subsession with a phase-specific trigger and a phase-specific
# write-scope allowlist; the driver verifies post-phase that the commit diff is
# a subset of the allowlist (exact paths or Bash-style glob patterns), that JSON
# files validate, and that the per-phase status file does not contain a
# `## Needs decision` H2 block.
#
# Since Brief 094 the headless loop wrapper `scripts/run-resolver-loop.sh` is the
# scharfe path — it auto-generates the config per wave and chains successive waves;
# this driver runs a single wave standalone (re-runs, diagnostics, manual ops).
# The operative spec is the lean runbook `sessions/resolver-pass-runbook.md` —
# each phase reads runbook + config + its axis-package only. Per-pass architect
# briefs no longer exist (Brief 094 removed the `brief` field from the config).
# The driver injects the runbook pointer into every phase trigger.
#
# USAGE
#   ./scripts/run-resolver-pass.sh <pass-config.json>
#
#   The config file is a small JSON descriptor produced by
#   `scripts/resolver-loop-detect.ts --write-config` for each wave;
#   see scripts/resolver-pass.config.json for the template. Shape:
#     {
#       "pass":     "8",
#       "wave":     "ssot-w40k-046..051",
#       "runbook":  "sessions/resolver-pass-runbook.md",   // REQUIRED (operative spec)
#       "dossier":  "sessions/resolver-dossiers/resolver-pass-N-dossier.md",
#       "phases": [
#         {
#           "name": "phase-0-preflight",
#           "trigger": "<one-paragraph CC trigger>",
#           "scope": ["sessions/resolver-dossiers/...-dossier.md", "scripts/aggregate-surface-forms-077.ts"],
#           "statusFile": null
#         },
#         {
#           "name": "phase-1-factions",
#           "trigger": "...",
#           "scope": ["scripts/seed-data/factions.json", "scripts/seed-data/faction-aliases.json",
#                     "scripts/seed-data/faction-policy.json", "scripts/test-resolver.ts",
#                     "sessions/resolver-dossiers/...-phase-1-report.md"],
#           "statusFile": "sessions/resolver-dossiers/...-phase-1-report.md"
#         },
#         ... (phases 2, 3, 4 analog)
#       ]
#     }
#   Scope entries may be exact paths or simple Bash globs such as
#   "scripts/*-077.ts" and "scripts/run-phase4-apply-077.sh".
#
#   Flags (all optional; standalone defaults preserve the historical behaviour):
#     --no-finalize         Skip push + PR (the loop wrapper finalises once at end).
#     --start-phase <name>  Skip phases ahead of <name> without invoking claude.
#                           Earlier phases are assumed already committed on HEAD.
#     --phase-timeout <sec> Wrap each `claude -p` in `timeout -k 30 <sec>`. 0 = off.
#                           Default 1800. Requires GNU coreutils `timeout` (Git Bash
#                           on Windows has it via MSYS).
#
# STATE FILE
#   scripts/.last-resolver-pass-state.json — gitignored sentinel written on exit
#   (success, needs-decision, halt, timeout, claude-fail). The loop wrapper reads
#   this to know what to record in sessions/resolver-loop-log.md.
#
# WINDOWS
#   PowerShell:  & "C:\Program Files\Git\bin\bash.exe" scripts/run-resolver-pass.sh cfg.json
#   Git Bash:    ./scripts/run-resolver-pass.sh cfg.json
#
# REQUIRES
#   - clean worktree, current branch != main
#   - `claude` CLI in PATH
#   - Node.js (for JSON halt-checks; no jq dependency)
# OPTIONAL
#   - `gh` CLI authenticated (else PR step is skipped, compare URL printed)
#
# EXIT CODES
#   0  success: all configured phases completed OR `needs_decision` cleanly hit
#   1  pre-run check failed (worktree dirty, on main, claude missing, config bad, …)
#   2  halt-check violation inside a phase (CC misbehaved or scope violation)
#   3  `claude -p` returned non-zero exit
#   4  bad CLI arguments
#   5  finalization failed (push/PR create failed when required)
#   6  `claude -p` exceeded --phase-timeout (Brief 094)

set -euo pipefail

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

readonly ALLOWED_TOOLS="Read Write Edit Bash Glob Grep WebSearch"
readonly STEP_LOG="scripts/.last-resolver-pass.log"
readonly STATE_FILE="scripts/.last-resolver-pass-state.json"
readonly REPO_URL="https://github.com/phinklab/chrono-lexicanum"

# ANSI helpers (no-op if stdout not a tty)
if [[ -t 1 ]]; then
  C_BOLD=$'\033[1m'; C_RED=$'\033[31m'; C_GREEN=$'\033[32m'
  C_YELLOW=$'\033[33m'; C_BLUE=$'\033[34m'; C_RESET=$'\033[0m'
else
  C_BOLD=""; C_RED=""; C_GREEN=""; C_YELLOW=""; C_BLUE=""; C_RESET=""
fi

log()   { printf '%s[run-resolver-pass]%s %s\n' "$C_BLUE"   "$C_RESET" "$*"; }
ok()    { printf '%s[run-resolver-pass]%s %s\n' "$C_GREEN"  "$C_RESET" "$*"; }
warn()  { printf '%s[run-resolver-pass]%s %s\n' "$C_YELLOW" "$C_RESET" "$*" >&2; }
err()   { printf '%s[run-resolver-pass]%s %s\n' "$C_RED"    "$C_RESET" "$*" >&2; }

die() {
  local code="$1"; shift
  err "$*"
  exit "$code"
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

CONFIG_PATH=""
NO_FINALIZE=0
START_PHASE=""
PHASE_TIMEOUT=1800

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      sed -n '2,65p' "$0"
      exit 0
      ;;
    --no-finalize)
      NO_FINALIZE=1
      shift
      ;;
    --start-phase)
      shift
      START_PHASE="${1:-}"
      [[ -z "$START_PHASE" ]] && die 4 "--start-phase requires a phase name"
      shift
      ;;
    --phase-timeout)
      shift
      PHASE_TIMEOUT="${1:-}"
      [[ ! "$PHASE_TIMEOUT" =~ ^[0-9]+$ ]] && die 4 "--phase-timeout requires a non-negative integer"
      shift
      ;;
    -*)
      die 4 "unknown flag: $1 (use -h for help)"
      ;;
    *)
      if [[ -n "$CONFIG_PATH" ]]; then
        die 4 "extra positional argument: $1"
      fi
      CONFIG_PATH="$1"
      shift
      ;;
  esac
done

if [[ -z "$CONFIG_PATH" ]]; then
  die 4 "missing config path — usage: $0 <pass-config.json>"
fi
if [[ ! -f "$CONFIG_PATH" ]]; then
  die 4 "config not found: $CONFIG_PATH"
fi

# ---------------------------------------------------------------------------
# Pre-run checks
# ---------------------------------------------------------------------------

log "${C_BOLD}Pre-run checks${C_RESET}"

if [[ -n "$(git status --porcelain)" ]]; then
  err "worktree is not clean — commit or stash before running"
  git status --short >&2
  exit 1
fi
ok "  worktree clean"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" == "main" ]]; then
  die 1 "current branch is 'main' — checkout a resolver/* branch first"
fi
ok "  branch != main ($CURRENT_BRANCH)"

if ! command -v claude >/dev/null 2>&1; then
  die 1 "'claude' CLI not in PATH — install Claude Code or fix PATH"
fi
CLAUDE_VERSION=$(claude --version 2>/dev/null | head -n1 || echo "unknown")
ok "  claude in PATH ($CLAUDE_VERSION)"

GH_READY=0
if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then
    GH_READY=1
    ok "  gh available + authenticated"
  else
    warn "  gh available but not authenticated — PR-create will be skipped"
  fi
else
  warn "  gh not in PATH — PR-create will be skipped"
fi

if ! command -v node >/dev/null 2>&1; then
  die 1 "'node' CLI not in PATH — required for JSON halt-checks + config parsing"
fi

# ---------------------------------------------------------------------------
# Config parsing
# ---------------------------------------------------------------------------

# parse_config_field <jq-style-path>
# Usage:
#   parse_config_field '.pass'   → echoes the pass string
#   parse_config_field '.phases' → echoes the phases array length (when assigned via `length`)
parse_config_string() {
  local path="$1"
  node --input-type=module -e "
    import fs from 'node:fs';
    const cfg = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
    const path = process.argv[2].split('.').filter(Boolean);
    let cur = cfg;
    for (const p of path) cur = cur?.[p];
    if (cur === undefined || cur === null) process.exit(1);
    process.stdout.write(String(cur));
  " "$CONFIG_PATH" "$path"
}

PASS_LABEL=$(parse_config_string ".pass" || die 1 "config missing .pass")
WAVE_LABEL=$(parse_config_string ".wave" || die 1 "config missing .wave")
# The runbook (sessions/resolver-pass-runbook.md) is the required operative
# spec. Per-pass briefs no longer exist (Brief 094 removed `brief`).
RUNBOOK_PATH=$(parse_config_string ".runbook" || die 1 "config missing .runbook (operative spec)")
DOSSIER_PATH=$(parse_config_string ".dossier" || die 1 "config missing .dossier")

if [[ ! -f "$RUNBOOK_PATH" ]]; then
  die 1 "runbook path does not exist: $RUNBOOK_PATH"
fi

PHASE_COUNT=$(node --input-type=module -e "
  import fs from 'node:fs';
  const cfg = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
  if (!Array.isArray(cfg.phases) || cfg.phases.length === 0) process.exit(1);
  process.stdout.write(String(cfg.phases.length));
" "$CONFIG_PATH" || die 1 "config has no phases array")

ok "  config parsed: pass=$PASS_LABEL, wave=$WAVE_LABEL, runbook=$RUNBOOK_PATH, phases=$PHASE_COUNT"

# get_phase_field <index> <field>
# Returns the phase's trigger / name as a string, or scope as newline-joined paths.
get_phase_string() {
  local index="$1"
  local field="$2"
  node --input-type=module -e "
    import fs from 'node:fs';
    const cfg = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
    const phase = cfg.phases[parseInt(process.argv[2], 10)];
    const v = phase?.[process.argv[3]];
    if (v === undefined || v === null) process.exit(1);
    if (typeof v === 'string') process.stdout.write(v);
    else if (Array.isArray(v)) process.stdout.write(v.join('\n'));
    else process.stdout.write(JSON.stringify(v));
  " "$CONFIG_PATH" "$index" "$field"
}

# ---------------------------------------------------------------------------
# Halt-checks (per phase)
# ---------------------------------------------------------------------------

# Input  globals: HEAD_BEFORE, PHASE_SCOPE_RAW (newline-joined), PHASE_STATUS_FILE
# Output globals: OUTCOME=success|needs_decision|violation, REASON
run_phase_halt_checks() {
  OUTCOME="violation"
  REASON=""

  # 1. worktree clean
  if [[ -n "$(git status --porcelain)" ]]; then
    REASON="worktree dirty after phase — CC left uncommitted changes"
    git status --short >&2
    return
  fi

  # 2. HEAD moved (CC committed something). Conservative first-driver contract:
  # every phase must leave at least one commit; no-op status-file escapes are
  # intentionally not supported yet.
  local head_after
  head_after=$(git rev-parse HEAD)
  if [[ "$head_after" == "$HEAD_BEFORE" ]]; then
    REASON="HEAD did not move — CC produced no commit"
    return
  fi

  # 3. diff-paths ⊆ phase-scope
  local diff_paths
  diff_paths=$(git diff --name-only "$HEAD_BEFORE" HEAD | sort)

  if [[ -z "$diff_paths" ]]; then
    REASON="git diff produced no paths despite HEAD moving"
    return
  fi

  local out_of_scope=""
  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    if ! path_is_in_scope "$path"; then
      out_of_scope="${out_of_scope}${path}"$'\n'
    fi
  done <<<"$diff_paths"

  if [[ -n "$out_of_scope" ]]; then
    REASON="commit touched paths outside phase write-scope:
$(printf '%s' "$out_of_scope" | sed 's/^/  /')
allowed scope (exact paths or Bash globs):
$(printf '%s\n' "$PHASE_SCOPE_RAW" | sed 's/^/  /')"
    return
  fi

  # 4. JSON validity for touched .json files
  local bad_json=""
  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    if [[ "$path" == *.json && -f "$path" ]]; then
      if ! node --input-type=module -e "
        import fs from 'node:fs';
        try { JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); }
        catch (e) { console.error(process.argv[1] + ': ' + e.message); process.exit(1); }
      " "$path" 2>/dev/null; then
        bad_json="$bad_json $path"
      fi
    fi
  done <<<"$diff_paths"
  if [[ -n "$bad_json" ]]; then
    REASON="JSON validation failed for:$bad_json"
    return
  fi

  # 5. needs_decision detection in per-phase status file (Erratum-Punkt 4)
  if [[ -n "${PHASE_STATUS_FILE:-}" && -f "$PHASE_STATUS_FILE" ]]; then
    if grep -q '^## Needs decision' "$PHASE_STATUS_FILE"; then
      OUTCOME="needs_decision"
      REASON="phase produced ## Needs decision block in $PHASE_STATUS_FILE"
      return
    fi
  fi

  OUTCOME="success"
}

path_is_in_scope() {
  local path="$1"
  local scope_entry
  while IFS= read -r scope_entry; do
    [[ -z "$scope_entry" ]] && continue
    if [[ "$path" == $scope_entry ]]; then
      return 0
    fi
  done <<<"$PHASE_SCOPE_RAW"
  return 1
}

# ---------------------------------------------------------------------------
# Trigger builder
# ---------------------------------------------------------------------------

build_phase_trigger() {
  local phase_name="$1"
  local phase_trigger_body="$2"
  local phase_scope_raw="$3"
  local include_dossier="$4"   # "1" for all phases except phase-0-preflight

  cat <<EOF
Resolver-Pass $PASS_LABEL ($WAVE_LABEL), Phase: $phase_name.

Dies ist ein mechanischer Task, keine normale Session. Lies $RUNBOOK_PATH und
folge ihm exakt; lies die Pass-Config $CONFIG_PATH (Phase-Name, Scope, Pfade).
Lies NUR, was das Runbook ausdrücklich nennt (Runbook + Config + Dossier + das
Achs-Paket dieser Phase) — KEINEN Brief (weder Brief 076 noch einen per-pass
Architect-Brief; per-pass Briefs existieren seit Brief 094 nicht mehr), NICHT
die Override-Files, NICHT das volle ssot-loop-log.md. Überspringe die
Session-Start-Leseroutine aus CLAUDE.md/AGENTS.md. Kein Co-Author-Trailer.

Runbook: $RUNBOOK_PATH
EOF
  if [[ "$include_dossier" == "1" ]]; then
    printf 'Dossier: %s\n' "$DOSSIER_PATH"
  fi
  cat <<EOF

Phase-Trigger:
$phase_trigger_body

Write-Scope (driver verifiziert post-phase, dass git diff --name-only HEAD~..HEAD ⊆ dieser Liste ist; Eintraege duerfen exakte Pfade oder Bash-Glob-Patterns sein):
$(printf '  - %s\n' $phase_scope_raw)

Halt-Disziplin:
- Mindestens ein commit pro Phase (HEAD muss sich bewegen; no-op-Phasen werden von dieser Driver-Version nicht akzeptiert).
- JSON-Files müssen syntaktisch valide bleiben.
- Bei architektonischer Unsicherheit: `## Needs decision`-H2-Block in die Per-Phase-Statusdatei schreiben (falls eine im Scope ist) und stoppen — Driver erkennt das und beendet sauber ohne Folge-Phasen.
- Keine Touches ausserhalb des oben gelisteten Write-Scopes.
- Keine Co-Author-Trailer im commit message.
EOF
}

# ---------------------------------------------------------------------------
# Phase loop
# ---------------------------------------------------------------------------

PHASES_COMPLETED=0
NEEDS_DECISION_HIT=0
NEEDS_DECISION_PHASE=""
NEEDS_DECISION_FILE=""
PHASES_RAN_SHAS=()

# tee stdout into a step log (gitignored)
mkdir -p "$(dirname "$STEP_LOG")"
exec > >(tee "$STEP_LOG") 2>&1

# write_state_file <outcome>
#   outcome ∈ {running, success, needs_decision, halt, claude_fail, timeout}
#   Inputs: $PASS_LABEL, $WAVE_LABEL, $CURRENT_BRANCH, $PHASES_COMPLETED,
#           $NEEDS_DECISION_*, $PHASES_RAN_SHAS.
write_state_file() {
  local outcome="$1"
  local nd_phase="${NEEDS_DECISION_PHASE:-}"
  local nd_file="${NEEDS_DECISION_FILE:-}"
  local shas_csv=""
  for entry in "${PHASES_RAN_SHAS[@]}"; do
    shas_csv="${shas_csv}${entry}"$'\n'
  done
  CONFIG_VAL="$CONFIG_PATH" \
  PASS_VAL="$PASS_LABEL" \
  WAVE_VAL="$WAVE_LABEL" \
  BRANCH_VAL="$CURRENT_BRANCH" \
  OUTCOME_VAL="$outcome" \
  PHASES_COMPLETED_VAL="$PHASES_COMPLETED" \
  NEEDS_DECISION_PHASE_VAL="$nd_phase" \
  NEEDS_DECISION_FILE_VAL="$nd_file" \
  PHASES_RAN_SHAS_VAL="$(printf '%s' "$shas_csv")" \
  node --input-type=module -e "
    import fs from 'node:fs';
    const phasesShas = (process.env.PHASES_RAN_SHAS_VAL || '').split(/\r?\n/)
      .filter(Boolean)
      .map((row) => {
        const [name, sha] = row.split('|');
        return { name, sha };
      });
    const state = {
      config: process.env.CONFIG_VAL,
      pass: process.env.PASS_VAL,
      wave: process.env.WAVE_VAL,
      branch: process.env.BRANCH_VAL,
      outcome: process.env.OUTCOME_VAL,
      phasesCompleted: Number(process.env.PHASES_COMPLETED_VAL || '0'),
      phasesRan: phasesShas,
      needsDecision: process.env.NEEDS_DECISION_PHASE_VAL
        ? { phase: process.env.NEEDS_DECISION_PHASE_VAL, file: process.env.NEEDS_DECISION_FILE_VAL || null }
        : null,
      writtenAt: new Date().toISOString(),
    };
    fs.writeFileSync('$STATE_FILE', JSON.stringify(state, null, 2) + '\\n', 'utf8');
  "
}

log "${C_BOLD}Driver start${C_RESET} — pass=$PASS_LABEL wave=$WAVE_LABEL branch=$CURRENT_BRANCH phases=$PHASE_COUNT phaseTimeout=${PHASE_TIMEOUT}s${NO_FINALIZE:+ no-finalize=${NO_FINALIZE}}"

# Resolve --start-phase to an index. Earlier phases are assumed already
# committed on HEAD by a prior run (the loop wrapper computes this from
# sessions/resolver-loop-log.md).
INDEX=0
if [[ -n "$START_PHASE" ]]; then
  while (( INDEX < PHASE_COUNT )); do
    if [[ "$(get_phase_string $INDEX name)" == "$START_PHASE" ]]; then
      break
    fi
    INDEX=$(( INDEX + 1 ))
  done
  if (( INDEX >= PHASE_COUNT )); then
    die 4 "--start-phase '$START_PHASE' not found in config phases"
  fi
  if (( INDEX > 0 )); then
    log "  --start-phase $START_PHASE: skipping $INDEX earlier phase(s) (assumed already committed on $CURRENT_BRANCH)"
    PHASES_COMPLETED=$INDEX
  fi
fi

# Detect GNU-flavoured `timeout`; bypass cleanly when missing.
HAS_TIMEOUT=0
if command -v timeout >/dev/null 2>&1; then
  HAS_TIMEOUT=1
fi

write_state_file "running"

while (( INDEX < PHASE_COUNT )); do
  PHASE_NAME=$(get_phase_string "$INDEX" "name")
  PHASE_TRIGGER_BODY=$(get_phase_string "$INDEX" "trigger")
  PHASE_SCOPE_RAW=$(get_phase_string "$INDEX" "scope")
  PHASE_STATUS_FILE=$(get_phase_string "$INDEX" "statusFile" 2>/dev/null || true)

  log "${C_BOLD}=== Phase $((INDEX + 1))/$PHASE_COUNT: $PHASE_NAME ===${C_RESET}"

  HEAD_BEFORE=$(git rev-parse HEAD)

  local_include_dossier="1"
  if [[ "$PHASE_NAME" == phase-0-* || "$PHASE_NAME" == "phase-0" ]]; then
    local_include_dossier="0"
  fi

  TRIGGER=$(build_phase_trigger "$PHASE_NAME" "$PHASE_TRIGGER_BODY" "$PHASE_SCOPE_RAW" "$local_include_dossier")
  if (( PHASE_TIMEOUT > 0 )) && (( HAS_TIMEOUT == 1 )); then
    log "  invoking claude -p (timeout ${PHASE_TIMEOUT}s) ..."
  else
    log "  invoking claude -p (no timeout) ..."
  fi

  set +e
  if (( PHASE_TIMEOUT > 0 )) && (( HAS_TIMEOUT == 1 )); then
    timeout -k 30 "${PHASE_TIMEOUT}s" claude -p "$TRIGGER" \
      --allowedTools $ALLOWED_TOOLS \
      --permission-mode acceptEdits
  else
    claude -p "$TRIGGER" \
      --allowedTools $ALLOWED_TOOLS \
      --permission-mode acceptEdits
  fi
  CC_EXIT=$?
  set -e

  if (( CC_EXIT == 124 )) && (( HAS_TIMEOUT == 1 )) && (( PHASE_TIMEOUT > 0 )); then
    err "claude -p timed out after ${PHASE_TIMEOUT}s — phase=$PHASE_NAME"
    write_state_file "timeout"
    exit 6
  fi
  if (( CC_EXIT != 0 )); then
    err "claude -p exited with code $CC_EXIT — stopping driver"
    write_state_file "claude_fail"
    exit 3
  fi

  run_phase_halt_checks
  case "$OUTCOME" in
    success)
      PHASE_SHA=$(git rev-parse HEAD)
      ok "  ✓ phase $PHASE_NAME completed (commit ${PHASE_SHA:0:7})"
      PHASES_RAN_SHAS+=("${PHASE_NAME}|${PHASE_SHA}")
      PHASES_COMPLETED=$(( PHASES_COMPLETED + 1 ))
      INDEX=$(( INDEX + 1 ))
      write_state_file "running"
      ;;
    needs_decision)
      ok "  ⚑ needs-decision detected in $PHASE_STATUS_FILE — stopping driver cleanly"
      NEEDS_DECISION_HIT=1
      NEEDS_DECISION_PHASE="$PHASE_NAME"
      NEEDS_DECISION_FILE="$PHASE_STATUS_FILE"
      write_state_file "needs_decision"
      break
      ;;
    violation)
      err "halt-check violation: $REASON"
      err "—— git status ——"
      git status --short >&2 || true
      err "—— git show --stat HEAD ——"
      git show --stat HEAD >&2 || true
      write_state_file "halt"
      exit 2
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Push + PR
# ---------------------------------------------------------------------------

# Record final outcome before the (optional) push+PR step so the loop wrapper
# can read the state file even if push fails.
if (( NEEDS_DECISION_HIT == 1 )); then
  write_state_file "needs_decision"
else
  write_state_file "success"
fi

if (( NO_FINALIZE == 1 )); then
  log "${C_BOLD}--no-finalize: skipping push + PR${C_RESET} (orchestrator will finalize)"
else
  log "${C_BOLD}Pushing branch${C_RESET}"

  if ! git push -u origin "$CURRENT_BRANCH"; then
    err "git push failed — leaving branch local for manual inspection"
    exit 5
  fi

  pr_title() {
    local suffix=""
    if (( NEEDS_DECISION_HIT == 1 )); then
      suffix=" (needs-decision)"
    fi
    printf 'Resolver-Pass %s (%s, %d/%d phases)%s' \
      "$PASS_LABEL" "$WAVE_LABEL" "$PHASES_COMPLETED" "$PHASE_COUNT" "$suffix"
  }

  pr_body() {
    printf 'Axis-sliced Resolver-Pass %s, wave %s, via scripts/run-resolver-pass.sh.\n\n' \
      "$PASS_LABEL" "$WAVE_LABEL"
    printf 'Phases completed: %d / %d.\n\n' "$PHASES_COMPLETED" "$PHASE_COUNT"
    if (( NEEDS_DECISION_HIT == 1 )); then
      printf '## Needs decision\n\n'
      printf 'Phase **%s** stopped with a `## Needs decision` block in `%s`.\n' \
        "$NEEDS_DECISION_PHASE" "$NEEDS_DECISION_FILE"
      printf 'Maintainer follow-up: resolve the question (adjust dossier / fix data / open a follow-up architect brief) and re-run this driver on the remaining phases.\n\n'
    fi
    printf 'Runbook: `%s`.\n' "$RUNBOOK_PATH"
    printf 'Dossier: `%s`.\n' "$DOSSIER_PATH"
  }

  if (( GH_READY == 1 )); then
    EXISTING_URL=$(gh pr list --head "$CURRENT_BRANCH" --json url --jq '.[0].url // ""' 2>/dev/null || true)
    if [[ -n "$EXISTING_URL" ]]; then
      ok "PR existiert bereits: $EXISTING_URL"
    else
      log "creating PR ..."
      if PR_URL=$(gh pr create --base main --title "$(pr_title)" --body "$(pr_body)" 2>&1); then
        ok "PR opened: $PR_URL"
      else
        warn "gh pr create failed:"
        warn "$PR_URL"
        warn "open manually: $REPO_URL/compare/$CURRENT_BRANCH"
        exit 5
      fi
    fi
  else
    warn "PR step skipped — open manually: $REPO_URL/compare/$CURRENT_BRANCH"
  fi
fi

# ---------------------------------------------------------------------------
# Final summary
# ---------------------------------------------------------------------------

log "${C_BOLD}Done${C_RESET}"
log "  phases completed:        $PHASES_COMPLETED / $PHASE_COUNT"
log "  needs-decision hit:      $([[ $NEEDS_DECISION_HIT == 1 ]] && echo "yes ($NEEDS_DECISION_PHASE)" || echo no)"
log "  step-log:                $STEP_LOG (gitignored)"
log "  state-file:              $STATE_FILE (gitignored)"
