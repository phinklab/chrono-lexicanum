#!/usr/bin/env bash
# scripts/run-ssot-loop.sh — Headless wrapper for the SSOT-Loop.
#
# Runs N successive `claude -p` subsessions, each with a fresh context, then
# pushes the branch and opens a PR. Each subsession executes one iteration per
# scripts/runbooks/ssot-loop-runbook.md (the single operative spec): produce ONE
# `manual-overrides-ssot-{w40k|hh}-NNN.json` plus a status-block in
# `scripts/logs/ssot-loop-log.md`, both in a single commit.
#
# USAGE
#   ./scripts/run-ssot-loop.sh [N]
#     N        Number of iterations (default 10, valid 1..20).
#
# Brief 094 decoupled the SSOT-Loop from the resolver: this driver no longer
# pauses on the 100er-cadence and no longer probes loop-next-batch for a pause
# flag. Each iteration produces exactly one override file + one log block, and
# the driver runs the requested N iterations straight through (or until
# loopComplete / a halt-check violation). The resolver loop is now a separate
# headless wrapper (scripts/run-resolver-loop.sh) over its own waves.
#
# WINDOWS
#   PowerShell:  & "C:\Program Files\Git\bin\bash.exe" scripts/run-ssot-loop.sh
#   Git Bash:    ./scripts/run-ssot-loop.sh
#
# REQUIRES
#   - clean worktree, current branch != main
#   - `claude` CLI in PATH (verified against version printing
#     `--allowedTools, --allowed-tools <tools...>` in --help)
#   - Node.js (for JSON halt-checks; no jq dependency)
# OPTIONAL
#   - `gh` CLI authenticated (else PR step is skipped, compare URL printed)
#
# EXIT CODES
#   0  success: N iterations completed (or loopComplete reached)
#   1  pre-run check failed (worktree dirty, on main, claude missing, ...)
#   2  halt-check violation inside an iteration (CC misbehaved)
#   3  `claude -p` returned non-zero exit
#   4  bad CLI arguments
#   5  finalization failed (push/PR create failed when required)
#
# Mini-doc only — see sessions/2026-05-13-071-arch-loop-driver.md (the brief)
# and the impl report sessions/2026-05-13-071-impl-loop-driver.md for the
# design rationale, halt-check matrix, and smoke results.

set -euo pipefail

# --- RETIRED (Brief 171 Teil B) --------------------------------------------
# The SSOT-Loop produced one manual-overrides-ssot-*.json batch per iteration.
# Brief 171 migrated the whole corpus into per-book SSOT files
# (scripts/seed-data/books/*.json) and retired the batch world. There is no batch
# to crystallize anymore; new books are scaffolded directly under books/ (see
# scripts/seed-data/books/README.md + scripts/runbooks/add-book-runbook.md).
echo "[run-ssot-loop] RETIRED (Brief 171). The batch SSOT-Loop is gone." >&2
echo "[run-ssot-loop]   New books go directly into scripts/seed-data/books/<slug>.json." >&2
echo "[run-ssot-loop]   See scripts/seed-data/books/README.md + add-book-runbook.md." >&2
exit 1

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

readonly BRIEF_PATH="sessions/2026-05-11-061-arch-ssot-loop.md"
readonly LOG_PATH="scripts/logs/ssot-loop-log.md"
readonly RUNBOOK_PATH="scripts/runbooks/ssot-loop-runbook.md"
readonly OVERRIDE_DIR="scripts/seed-data"
readonly OVERRIDE_PREFIX="manual-overrides-ssot-"
readonly ALLOWED_TOOLS="Read Write Edit Bash Glob Grep WebSearch WebFetch"
readonly STEP_LOG="scripts/.last-loop-run.log"
readonly REPO_URL="https://github.com/phinklab/chrono-lexicanum"

# ANSI helpers (no-op if stdout not a tty)
if [[ -t 1 ]]; then
  C_BOLD=$'\033[1m'; C_RED=$'\033[31m'; C_GREEN=$'\033[32m'
  C_YELLOW=$'\033[33m'; C_BLUE=$'\033[34m'; C_RESET=$'\033[0m'
else
  C_BOLD=""; C_RED=""; C_GREEN=""; C_YELLOW=""; C_BLUE=""; C_RESET=""
fi

log()   { printf '%s[run-ssot-loop]%s %s\n' "$C_BLUE"   "$C_RESET" "$*"; }
ok()    { printf '%s[run-ssot-loop]%s %s\n' "$C_GREEN"  "$C_RESET" "$*"; }
warn()  { printf '%s[run-ssot-loop]%s %s\n' "$C_YELLOW" "$C_RESET" "$*" >&2; }
err()   { printf '%s[run-ssot-loop]%s %s\n' "$C_RED"    "$C_RESET" "$*" >&2; }

die() {
  local code="$1"; shift
  err "$*"
  exit "$code"
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

ITERATIONS=10

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      sed -n '2,46p' "$0"   # print the header docblock
      exit 0
      ;;
    -*)
      die 4 "unknown flag: $1 (use -h for help)"
      ;;
    *)
      ITERATIONS="$1"
      shift
      ;;
  esac
done

if ! [[ "$ITERATIONS" =~ ^[0-9]+$ ]] || (( ITERATIONS < 1 )) || (( ITERATIONS > 20 )); then
  die 4 "iterations must be an integer in 1..20 (got: $ITERATIONS)"
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
  die 1 "current branch is 'main' — checkout a session/ingest branch first"
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
  die 1 "'node' CLI not in PATH — required for JSON halt-checks"
fi

# ---------------------------------------------------------------------------
# Trigger string builder
# ---------------------------------------------------------------------------

base_trigger() {
  cat <<EOF
Führe genau eine SSOT-Loop-Iteration aus.

Lies ${RUNBOOK_PATH} und folge ihm exakt. Lies nichts, was das
Runbook nicht ausdrücklich nennt.

Das ist eine mechanische Loop-Iteration, keine normale Session: überspringe die
in CLAUDE.md/AGENTS.md definierte Session-Start-Leseroutine (brain/CLAUDE.md,
wiki/index.md, project-state.md, open-questions.md, cc-session.md) und lies
Brief 061 nicht. Kein Co-Author-Trailer im Commit.
EOF
}

# ---------------------------------------------------------------------------
# Halt-checks
# ---------------------------------------------------------------------------

# Lists override files matching the SSOT prefix, sorted, one per line.
list_override_files() {
  ls "$OVERRIDE_DIR/${OVERRIDE_PREFIX}"*.json 2>/dev/null | sort
}

# Validates a manual-overrides JSON file: schema, batch pattern, books length.
# Exits non-zero with a message on failure.
validate_override_json() {
  local file="$1"
  node --input-type=module -e "
    import fs from 'node:fs';
    const file = process.argv[1];
    const txt = fs.readFileSync(file, 'utf8');
    let data;
    try { data = JSON.parse(txt); } catch (e) {
      console.error('JSON parse failed for ' + file + ': ' + e.message);
      process.exit(11);
    }
    const schema = data['\$schema'];
    if (schema !== 'manual-overrides-v1') {
      console.error('bad \$schema: ' + JSON.stringify(schema));
      process.exit(12);
    }
    if (typeof data.batch !== 'string' || !/^ssot-(w40k|hh)-\\d+\$/.test(data.batch)) {
      console.error('bad batch: ' + JSON.stringify(data.batch));
      process.exit(13);
    }
    if (!Array.isArray(data.books)) {
      console.error('books is not an array');
      process.exit(14);
    }
    if (data.books.length < 1 || data.books.length > 10) {
      console.error('books.length out of range 1..10: ' + data.books.length);
      process.exit(15);
    }
  " "$file"
}

# Runs all post-iteration halt-checks.
# Inputs (globals): HEAD_BEFORE, FILES_BEFORE_RAW, ITER (for log)
# Outputs (globals): OUTCOME=success|loop_complete|violation, REASON, NEW_FILE
run_halt_checks() {
  OUTCOME="violation"
  REASON=""
  NEW_FILE=""

  # Check 2: worktree clean (no uncommitted leftovers)
  if [[ -n "$(git status --porcelain)" ]]; then
    REASON="worktree dirty after iteration — CC left uncommitted changes"
    git status --short >&2
    return
  fi

  # Check 3: HEAD moved (CC committed exactly one new commit)
  local head_after
  head_after=$(git rev-parse HEAD)
  if [[ "$head_after" == "$HEAD_BEFORE" ]]; then
    REASON="HEAD did not move — CC produced no commit"
    return
  fi

  # Check 4: commit-content paths
  local diff_paths
  diff_paths=$(git diff --name-only "$HEAD_BEFORE" HEAD | sort)

  # Check 5: new override files
  local files_after_raw new_files
  files_after_raw=$(list_override_files)
  new_files=$(comm -13 \
    <(printf '%s\n' "$FILES_BEFORE_RAW") \
    <(printf '%s\n' "$files_after_raw"))
  local new_count
  new_count=$(printf '%s' "$new_files" | grep -c . || true)

  if (( new_count > 1 )); then
    REASON="iteration must commit exactly 1 new override file (got $new_count): $new_files"
    return
  fi

  # Log diff
  local log_diff
  log_diff=$(git diff "$HEAD_BEFORE" HEAD -- "$LOG_PATH")

  if [[ -z "$log_diff" ]]; then
    REASON="$LOG_PATH did not grow"
    return
  fi
  if ! grep -q '^+## ' <<<"$log_diff"; then
    REASON="$LOG_PATH grew but no new H2-block was appended"
    return
  fi

  if (( new_count == 0 )); then
    if [[ "$diff_paths" != "$LOG_PATH" ]]; then
      REASON="loop-complete path: commit touched unexpected paths
  expected: $LOG_PATH
  got:      $(echo "$diff_paths" | tr '\n' ' ')"
      return
    fi
    if ! grep -Eiq 'Loop complete|loop-complete|🏁' <<<"$log_diff"; then
      REASON="0 new override files but no loop-complete marker in log diff"
      return
    fi
    OUTCOME="loop_complete"
    return
  fi

  NEW_FILE="$new_files"

  # Check 4 strict: diff paths must equal exactly {NEW_FILE, LOG_PATH}
  local expected
  expected=$(printf '%s\n%s\n' "$NEW_FILE" "$LOG_PATH" | sort)
  if [[ "$diff_paths" != "$expected" ]]; then
    REASON="commit touched unexpected paths
  expected: $(echo "$expected" | tr '\n' ' ')
  got:      $(echo "$diff_paths" | tr '\n' ' ')"
    return
  fi

  # Check 6+7: JSON valid + top-level form
  if ! validate_override_json "$NEW_FILE"; then
    REASON="override-JSON validation failed for $NEW_FILE"
    return
  fi

  OUTCOME="success"
}

# ---------------------------------------------------------------------------
# Iteration loop
# ---------------------------------------------------------------------------

ITER_SUCCESS_COUNT=0
LOOP_COMPLETE_HIT=0
NEW_FILES_COMMITTED=()
ATTEMPT=1

# tee stdout into a step log (gitignored)
mkdir -p "$(dirname "$STEP_LOG")"
exec > >(tee "$STEP_LOG") 2>&1

log "${C_BOLD}Driver start${C_RESET} — iterations=$ITERATIONS, branch=$CURRENT_BRANCH"

while (( ATTEMPT <= ITERATIONS )); do
  log "${C_BOLD}=== Iteration $ATTEMPT/$ITERATIONS ===${C_RESET}"

  HEAD_BEFORE=$(git rev-parse HEAD)
  FILES_BEFORE_RAW=$(list_override_files)

  TRIGGER=$(base_trigger)
  log "  invoking claude -p ..."

  set +e
  claude -p "$TRIGGER" \
    --allowedTools $ALLOWED_TOOLS \
    --permission-mode acceptEdits
  CC_EXIT=$?
  set -e

  if (( CC_EXIT != 0 )); then
    err "claude -p exited with code $CC_EXIT — stopping driver"
    exit 3
  fi

  run_halt_checks
  case "$OUTCOME" in
    success)
      ok "  ✓ all halt-checks green — committed $NEW_FILE"
      ITER_SUCCESS_COUNT=$(( ITER_SUCCESS_COUNT + 1 ))
      NEW_FILES_COMMITTED+=("$NEW_FILE")
      ATTEMPT=$(( ATTEMPT + 1 ))
      ;;
    loop_complete)
      ok "  ✓ loop-complete detected — stopping driver cleanly"
      LOOP_COMPLETE_HIT=1
      break
      ;;
    violation)
      err "halt-check violation: $REASON"
      err "—— git status ——"
      git status --short >&2 || true
      err "—— git show --stat HEAD ——"
      git show --stat HEAD >&2 || true
      exit 2
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Push + PR
# ---------------------------------------------------------------------------

log "${C_BOLD}Pushing branch${C_RESET}"

if ! git push -u origin "$CURRENT_BRANCH"; then
  err "git push failed — leaving branch local for manual inspection"
  exit 5
fi

# Build PR body
pr_body() {
  printf 'Loop-Iterationen via scripts/run-ssot-loop.sh.\n\n'
  if (( ${#NEW_FILES_COMMITTED[@]} > 0 )); then
    printf 'Override-Files entstanden:\n'
    for f in "${NEW_FILES_COMMITTED[@]}"; do
      printf -- '- %s\n' "$f"
    done
    printf '\n'
  else
    if (( LOOP_COMPLETE_HIT == 1 )); then
      printf 'Keine neuen Override-Files (Loop complete reached).\n\n'
    else
      printf 'Keine neuen Override-Files.\n\n'
    fi
  fi
  if (( LOOP_COMPLETE_HIT == 1 )); then
    printf 'Loop complete: alle Roster-Bücher sind in der Authority-Schicht abgedeckt.\n\n'
  fi
  printf 'Per-Buch-Notes: scripts/logs/ssot-loop-log.md.\n'
}

pr_title() {
  local suffix=""
  if (( LOOP_COMPLETE_HIT == 1 )); then
    suffix=", loop-complete"
  fi
  printf 'Loop-Iterationen via run-ssot-loop.sh (%d iter%s)' "$ITER_SUCCESS_COUNT" "$suffix"
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

# ---------------------------------------------------------------------------
# Final summary
# ---------------------------------------------------------------------------

log "${C_BOLD}Done${C_RESET}"
log "  iterations completed:    $ITER_SUCCESS_COUNT / $ITERATIONS"
log "  new override files:      ${#NEW_FILES_COMMITTED[@]}"
log "  loop-complete hit:       $([[ $LOOP_COMPLETE_HIT == 1 ]] && echo yes || echo no)"
log "  step-log:                $STEP_LOG (gitignored)"
