#!/usr/bin/env bash
# scripts/run-resolver-loop.sh — Headless driver for the Resolver-Loop (Brief 094).
#
# Drives successive Resolver-Waves over the open W40K-Roster without supervision:
#
#   1. `scripts/resolver-loop-detect.ts` picks the next wave (or signals
#      idle / w40k-complete).
#   2. The detector writes a fresh per-wave `ResolverPassConfig` to
#      `scripts/resolver-pass.config.json` (overwriting the previous one).
#   3. The config change is committed (clean worktree is a precondition for
#      the pass driver).
#   4. Resume-check: `sessions/resolver-loop-log.md` is scanned for an
#      existing partial block; the first unchecked phase becomes `--start-phase`.
#   5. `scripts/run-resolver-pass.sh <config> --no-finalize --start-phase <p>
#      --phase-timeout 1800` runs the six per-phase `claude -p` subsessions.
#   6. The pass driver's state file (`scripts/.last-resolver-pass-state.json`)
#      is forwarded to `scripts/resolver-loop-log-update.ts`, which renders
#      the wave block (full or partial) in `sessions/resolver-loop-log.md`.
#   7. That update is committed.
#   8. Loop continues until idle / w40k-complete / needs-decision / halt /
#      timeout, then pushes the branch and opens (or updates) the PR once.
#
# A wave is the unit of supervision; phases inside a wave are mechanical.
# Per-pass architect briefs no longer exist (Brief 094) — operative spec is
# `sessions/resolver-pass-runbook.md` only.
#
# USAGE
#   ./scripts/run-resolver-loop.sh [--dry-run] [--max-waves N]
#     --dry-run     Run the detector + resume-check and print what would
#                   happen, but never invoke `claude -p`. No files written
#                   to scripts/resolver-pass.config.json or the log.
#     --max-waves N Safety cap (default 10). The driver stops after N waves
#                   even if more open waves remain — the operator re-invokes.
#
# WINDOWS
#   PowerShell:  & "C:\Program Files\Git\bin\bash.exe" scripts/run-resolver-loop.sh
#   Git Bash:    ./scripts/run-resolver-loop.sh
#
# REQUIRES
#   - clean worktree, current branch != main
#   - `claude` CLI in PATH (unless --dry-run)
#   - Node.js (for detector + log-update + JSON halt-checks)
# OPTIONAL
#   - `gh` CLI authenticated (else PR step is skipped, compare URL printed)
#
# EXIT CODES
#   0  driver stopped cleanly (idle / w40k-complete / needs-decision /
#      success at end of max-waves)
#   1  pre-run check failed (worktree dirty, on main, claude missing, …)
#   2  halt-check violation inside a phase (pass-driver exit 2)
#   3  `claude -p` returned non-zero exit (pass-driver exit 3)
#   4  bad CLI arguments
#   5  finalization failed (push/PR create failed when required)
#   6  `claude -p` exceeded the per-phase timeout (pass-driver exit 6)

set -euo pipefail

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

readonly CONFIG_PATH="scripts/resolver-pass.config.json"
readonly LOG_PATH="sessions/resolver-loop-log.md"
readonly STATE_FILE="scripts/.last-resolver-pass-state.json"
readonly STEP_LOG="scripts/.last-resolver-loop.log"
readonly PASS_DRIVER="scripts/run-resolver-pass.sh"
readonly LOG_UPDATER="scripts/resolver-loop-log-update.ts"
readonly DETECTOR="scripts/resolver-loop-detect.ts"
readonly PHASE_TIMEOUT=1800
readonly REPO_URL="https://github.com/phinklab/chrono-lexicanum"

# ANSI helpers (no-op if stdout not a tty)
if [[ -t 1 ]]; then
  C_BOLD=$'\033[1m'; C_RED=$'\033[31m'; C_GREEN=$'\033[32m'
  C_YELLOW=$'\033[33m'; C_BLUE=$'\033[34m'; C_RESET=$'\033[0m'
else
  C_BOLD=""; C_RED=""; C_GREEN=""; C_YELLOW=""; C_BLUE=""; C_RESET=""
fi

log()   { printf '%s[run-resolver-loop]%s %s\n' "$C_BLUE"   "$C_RESET" "$*"; }
ok()    { printf '%s[run-resolver-loop]%s %s\n' "$C_GREEN"  "$C_RESET" "$*"; }
warn()  { printf '%s[run-resolver-loop]%s %s\n' "$C_YELLOW" "$C_RESET" "$*" >&2; }
err()   { printf '%s[run-resolver-loop]%s %s\n' "$C_RED"    "$C_RESET" "$*" >&2; }

die() {
  local code="$1"; shift
  err "$*"
  exit "$code"
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

DRY_RUN=0
MAX_WAVES=10

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      sed -n '2,60p' "$0"
      exit 0
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --max-waves)
      shift
      MAX_WAVES="${1:-}"
      [[ ! "$MAX_WAVES" =~ ^[0-9]+$ ]] && die 4 "--max-waves requires a non-negative integer"
      shift
      ;;
    *)
      die 4 "unknown arg: $1 (use -h for help)"
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Pre-run checks
# ---------------------------------------------------------------------------

log "${C_BOLD}Pre-run checks${C_RESET}${DRY_RUN:+ (dry-run)}"

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

if (( DRY_RUN == 0 )); then
  if ! command -v claude >/dev/null 2>&1; then
    die 1 "'claude' CLI not in PATH — install Claude Code or fix PATH"
  fi
  CLAUDE_VERSION=$(claude --version 2>/dev/null | head -n1 || echo "unknown")
  ok "  claude in PATH ($CLAUDE_VERSION)"
fi

if ! command -v node >/dev/null 2>&1; then
  die 1 "'node' CLI not in PATH — required for detector + log-updater"
fi

if ! command -v npx >/dev/null 2>&1; then
  die 1 "'npx' CLI not in PATH — required for tsx invocations"
fi

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

if [[ ! -x "$PASS_DRIVER" && ! -f "$PASS_DRIVER" ]]; then
  die 1 "pass driver missing: $PASS_DRIVER"
fi

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# detect_next_wave: invoke the detector and echo its JSON.
# In non-dry-run mode, also writes the auto-config to $CONFIG_PATH if status === "open-wave".
detect_next_wave() {
  local extra_args=""
  if (( DRY_RUN == 0 )); then
    extra_args="--write-config $CONFIG_PATH"
  fi
  # shellcheck disable=SC2086
  npx tsx "$DETECTOR" $extra_args
}

# resolve_start_phase: given a wave label (e.g. ssot-w40k-046..051), scan the
# loop-log and echo the canonical name of the first un-checked phase. If no
# block exists for the wave, echoes phase-0-preflight. Self-contained Node
# (no .ts imports — keeps the wrapper dependency-free at runtime).
resolve_start_phase() {
  local wave="$1"
  WAVE_LABEL="$wave" LOG_PATH_ENV="$LOG_PATH" node --input-type=module -e "
    import fs from 'node:fs';
    const PHASE_ORDER = [
      ['phase-0-preflight',     'Phase 0'],
      ['phase-1-factions',      'Phase 1'],
      ['phase-2-locations',     'Phase 2'],
      ['phase-3-characters',    'Phase 3'],
      ['phase-4a-integration',  'Phase 4a'],
      ['phase-4b-verify-report','Phase 4b'],
    ];
    const wave = process.env.WAVE_LABEL;
    const logPath = process.env.LOG_PATH_ENV;
    const content = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : '';
    const lines = content.split(/\\r?\\n/);
    const waveEsc = wave.replace(/\\./g, '\\\\.');
    const headingRe = new RegExp('^##\\\\s+.*Resolver-Pass\\\\s+\\\\d+\\\\s*\\\\(.*' + waveEsc);
    let inBlock = false;
    let captured = false;
    const seen = new Set();
    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (headingRe.test(line)) { inBlock = true; captured = true; continue; }
        if (inBlock) break;
      }
      if (!inBlock) continue;
      const m = line.match(/^\\s*-\\s*\\[x\\]\\s*(Phase\\s+\\d+[a-z]?)/i);
      if (m) {
        const lbl = m[1].trim();
        for (const [name, label] of PHASE_ORDER) {
          if (lbl.toLowerCase().startsWith(label.toLowerCase())) { seen.add(name); break; }
        }
      }
    }
    if (!captured) { process.stdout.write('phase-0-preflight'); process.exit(0); }
    for (const [name] of PHASE_ORDER) {
      if (!seen.has(name)) { process.stdout.write(name); process.exit(0); }
    }
    process.stdout.write('phase-0-preflight');
  "
}

# update_loop_log: forward the pass-driver state file into a wave-block
# update via the log-updater script. Reads $STATE_FILE, $WAVE, $PASS,
# $BOOK_COUNT; writes/replaces the block in $LOG_PATH.
update_loop_log() {
  local outcome="$1"        # success | needs_decision | halt | timeout | claude_fail | in_progress
  local outcome_note="$2"   # may be empty

  local date
  date=$(date -u +%Y-%m-%d)

  # Pull per-phase SHAs out of the state file.
  local phase_args
  phase_args=$(STATE_FILE="$STATE_FILE" node --input-type=module -e "
    import fs from 'node:fs';
    const state = JSON.parse(fs.readFileSync(process.env.STATE_FILE, 'utf8'));
    const parts = [];
    for (const { name, sha } of (state.phasesRan || [])) {
      parts.push('--phase');
      parts.push(name + '|' + sha);
    }
    process.stdout.write(parts.join('\n'));
  ")

  # Build args array safely (paths may contain spaces).
  local -a args=(
    "$LOG_UPDATER"
    --log-path "$LOG_PATH"
    --date    "$date"
    --pass    "$PASS"
    --wave    "$WAVE"
    --book-count "$BOOK_COUNT"
    --outcome "$outcome"
  )
  if [[ -n "$outcome_note" ]]; then
    args+=( --outcome-note "$outcome_note" )
  fi
  if [[ -n "${NEEDS_DECISION_PHASE:-}" ]]; then
    args+=( --needs-decision-phase "$NEEDS_DECISION_PHASE" )
    if [[ -n "${NEEDS_DECISION_FILE:-}" ]]; then
      args+=( --needs-decision-file "$NEEDS_DECISION_FILE" )
    fi
  fi
  if [[ -n "$phase_args" ]]; then
    # newline-separated → array entries
    while IFS= read -r piece; do
      [[ -z "$piece" ]] && continue
      args+=( "$piece" )
    done <<<"$phase_args"
  fi

  npx tsx "${args[@]}"
}

# ---------------------------------------------------------------------------
# Loop
# ---------------------------------------------------------------------------

# tee stdout into a step log (gitignored)
mkdir -p "$(dirname "$STEP_LOG")"
exec > >(tee "$STEP_LOG") 2>&1

log "${C_BOLD}Driver start${C_RESET} — branch=$CURRENT_BRANCH max-waves=$MAX_WAVES${DRY_RUN:+ dry-run=$DRY_RUN}"

WAVES_RUN=0
WAVES_COMPLETED=()
TERMINAL_REASON=""
TERMINAL_OUTCOME="success"

while (( WAVES_RUN < MAX_WAVES )); do
  log "${C_BOLD}=== Wave ${WAVES_RUN}/${MAX_WAVES} — detect ===${C_RESET}"

  set +e
  DETECT_JSON=$(detect_next_wave)
  DETECT_EXIT=$?
  set -e
  if (( DETECT_EXIT != 0 )); then
    err "detector failed (exit $DETECT_EXIT)"
    err "$DETECT_JSON"
    exit 1
  fi

  STATUS=$(printf '%s' "$DETECT_JSON" | node --input-type=module -e "
    let s = ''; process.stdin.on('data', (c) => { s += c; });
    process.stdin.on('end', () => {
      try { process.stdout.write(JSON.parse(s).status); }
      catch { process.stdout.write('parse-error'); }
    });
  ")

  case "$STATUS" in
    idle)
      REASON=$(printf '%s' "$DETECT_JSON" | node --input-type=module -e "
        let s=''; process.stdin.on('data',(c)=>{s+=c;});
        process.stdin.on('end',()=>{try{process.stdout.write(JSON.parse(s).reason||'');}catch{process.stdout.write('');}});
      ")
      ok "  status: idle — $REASON"
      TERMINAL_REASON="idle: $REASON"
      break
      ;;
    w40k-complete)
      ok "  status: w40k-complete — all W40K books resolved"
      TERMINAL_REASON="w40k-complete"
      break
      ;;
    open-wave)
      ;;  # fall through to wave handling
    *)
      err "detector returned unexpected status: $STATUS"
      err "$DETECT_JSON"
      exit 1
      ;;
  esac

  # Pull wave + pass + bookCount from the detector output.
  read -r WAVE PASS BOOK_COUNT < <(printf '%s' "$DETECT_JSON" | node --input-type=module -e "
    let s=''; process.stdin.on('data',(c)=>{s+=c;});
    process.stdin.on('end',()=>{
      const r = JSON.parse(s);
      process.stdout.write(r.wave.first.toString().padStart(3,'0') + '..' + r.wave.last.toString().padStart(3,'0'));
      process.stdout.write(' ' + r.wave.pass + ' ' + r.wave.bookCount + '\\n');
    });
  ")
  WAVE="ssot-w40k-${WAVE}"

  log "  status: open-wave — wave=$WAVE pass=$PASS bookCount=$BOOK_COUNT"

  START_PHASE=$(resolve_start_phase "$WAVE")
  log "  resume start-phase: $START_PHASE"

  if (( DRY_RUN == 1 )); then
    log "  --dry-run: would write config + invoke pass driver. Skipping."
    WAVES_RUN=$(( WAVES_RUN + 1 ))
    TERMINAL_REASON="dry-run: open-wave $WAVE (pass $PASS, $BOOK_COUNT books, start $START_PHASE)"
    break
  fi

  # Config was already written by detect_next_wave (--write-config).
  if [[ -n "$(git status --porcelain "$CONFIG_PATH")" ]]; then
    log "  staging fresh per-wave config $CONFIG_PATH"
    git add "$CONFIG_PATH"
    git commit -m "Resolver-Loop: prepare Pass $PASS config (Welle $WAVE, $BOOK_COUNT Bücher)"
  else
    log "  config unchanged (resumed wave)"
  fi

  log "${C_BOLD}=== Pass $PASS · $WAVE · start-phase $START_PHASE ===${C_RESET}"

  set +e
  bash "$PASS_DRIVER" "$CONFIG_PATH" \
    --no-finalize \
    --start-phase "$START_PHASE" \
    --phase-timeout "$PHASE_TIMEOUT"
  PASS_EXIT=$?
  set -e

  if [[ ! -f "$STATE_FILE" ]]; then
    err "pass driver did not write state file at $STATE_FILE"
    exit 1
  fi

  STATE_OUTCOME=$(STATE_FILE="$STATE_FILE" node --input-type=module -e "
    import fs from 'node:fs';
    const s = JSON.parse(fs.readFileSync(process.env.STATE_FILE,'utf8'));
    process.stdout.write(s.outcome || 'unknown');
  ")
  NEEDS_DECISION_PHASE=$(STATE_FILE="$STATE_FILE" node --input-type=module -e "
    import fs from 'node:fs';
    const s = JSON.parse(fs.readFileSync(process.env.STATE_FILE,'utf8'));
    process.stdout.write(s.needsDecision?.phase || '');
  ")
  NEEDS_DECISION_FILE=$(STATE_FILE="$STATE_FILE" node --input-type=module -e "
    import fs from 'node:fs';
    const s = JSON.parse(fs.readFileSync(process.env.STATE_FILE,'utf8'));
    process.stdout.write(s.needsDecision?.file || '');
  ")

  case "$STATE_OUTCOME" in
    success)
      ok "  ✓ pass $PASS completed (6/6 phases)"
      update_loop_log "success" ""
      git add "$LOG_PATH"
      git commit -m "Resolver-Loop: Pass $PASS ($WAVE) — 6/6 phases ✓"
      WAVES_COMPLETED+=("Pass $PASS · $WAVE (6/6 ✓)")
      WAVES_RUN=$(( WAVES_RUN + 1 ))
      ;;
    needs_decision)
      warn "  ⚑ needs-decision in phase $NEEDS_DECISION_PHASE (file $NEEDS_DECISION_FILE)"
      update_loop_log "needs_decision" "phase $NEEDS_DECISION_PHASE"
      git add "$LOG_PATH"
      git commit -m "Resolver-Loop: Pass $PASS ($WAVE) — needs-decision in $NEEDS_DECISION_PHASE"
      WAVES_COMPLETED+=("Pass $PASS · $WAVE (needs-decision)")
      TERMINAL_OUTCOME="needs_decision"
      TERMINAL_REASON="needs-decision in $NEEDS_DECISION_PHASE ($NEEDS_DECISION_FILE)"
      WAVES_RUN=$(( WAVES_RUN + 1 ))
      break
      ;;
    halt|claude_fail|timeout)
      err "  pass driver stopped: outcome=$STATE_OUTCOME exit=$PASS_EXIT"
      update_loop_log "$STATE_OUTCOME" "pass-driver exit $PASS_EXIT"
      git add "$LOG_PATH"
      git commit -m "Resolver-Loop: Pass $PASS ($WAVE) — $STATE_OUTCOME (exit $PASS_EXIT)"
      WAVES_COMPLETED+=("Pass $PASS · $WAVE ($STATE_OUTCOME)")
      TERMINAL_OUTCOME="$STATE_OUTCOME"
      TERMINAL_REASON="$STATE_OUTCOME during pass $PASS (exit $PASS_EXIT)"
      # Surface the pass-driver exit code to our caller.
      case "$STATE_OUTCOME" in
        halt)        FINAL_EXIT=2 ;;
        claude_fail) FINAL_EXIT=3 ;;
        timeout)     FINAL_EXIT=6 ;;
      esac
      # finalize, then exit with that code
      break
      ;;
    *)
      err "pass driver wrote unrecognized outcome: $STATE_OUTCOME"
      exit 1
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Push + PR
# ---------------------------------------------------------------------------

if (( DRY_RUN == 1 )); then
  log "${C_BOLD}Dry-run done${C_RESET} — no commits, no push, no PR"
  log "  detector said: $TERMINAL_REASON"
  exit 0
fi

if (( ${#WAVES_COMPLETED[@]} == 0 )); then
  log "${C_BOLD}No waves to push${C_RESET} — $TERMINAL_REASON"
  exit 0
fi

log "${C_BOLD}Pushing branch${C_RESET}"

if ! git push -u origin "$CURRENT_BRANCH"; then
  err "git push failed — leaving branch local for manual inspection"
  exit 5
fi

pr_title() {
  local suffix=""
  if [[ "$TERMINAL_OUTCOME" != "success" ]]; then
    suffix=" ($TERMINAL_OUTCOME)"
  fi
  printf 'Resolver-Loop: %d wave(s)%s' "${#WAVES_COMPLETED[@]}" "$suffix"
}

pr_body() {
  printf 'Headless Resolver-Loop via scripts/run-resolver-loop.sh (Brief 094).\n\n'
  printf 'Waves run on this branch:\n'
  for w in "${WAVES_COMPLETED[@]}"; do
    printf -- '- %s\n' "$w"
  done
  printf '\n'
  if [[ "$TERMINAL_OUTCOME" != "success" ]]; then
    printf '## Stopped on %s\n\n' "$TERMINAL_OUTCOME"
    printf '%s\n\n' "$TERMINAL_REASON"
  fi
  printf 'Per-wave block in `%s`.\n' "$LOG_PATH"
  printf 'Runbook: `sessions/resolver-pass-runbook.md`.\n'
}

if (( GH_READY == 1 )); then
  EXISTING_URL=$(gh pr list --head "$CURRENT_BRANCH" --json url --jq '.[0].url // ""' 2>/dev/null || true)
  if [[ -n "$EXISTING_URL" ]]; then
    ok "PR exists already: $EXISTING_URL"
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

# ---------------------------------------------------------------------------
# Final summary
# ---------------------------------------------------------------------------

log "${C_BOLD}Done${C_RESET}"
log "  waves run:    ${#WAVES_COMPLETED[@]} / $MAX_WAVES"
log "  outcome:      $TERMINAL_OUTCOME"
[[ -n "$TERMINAL_REASON" ]] && log "  reason:       $TERMINAL_REASON"
log "  step-log:     $STEP_LOG (gitignored)"
log "  state-file:   $STATE_FILE (gitignored)"

if [[ "${FINAL_EXIT:-}" != "" ]]; then
  exit "$FINAL_EXIT"
fi
exit 0
