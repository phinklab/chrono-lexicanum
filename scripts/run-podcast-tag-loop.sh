#!/usr/bin/env bash
# scripts/run-podcast-tag-loop.sh — Headless driver for cc-direct podcast tagging.
#
# The "tag" stage of the Brief 131 cc-direct pipeline (Variant B):
#     acquire (npm run ingest:podcast -- --tagging=cc-direct --stage=acquire …)
#  →  THIS DRIVER  (prepare → claude -p per batch → merge)
#  →  assemble (… --stage=assemble …)
#
# It chunks the acquired manifest into batches of exactly CC_TAG_BATCH_SIZE (10)
# and runs ONE fresh `claude -p` subsession PER batch. Each subsession runs on the
# Max-plan allowance with ONLY the Read+Write tools — so this pipeline makes ZERO
# metered Anthropic API calls (Brief 131 hard constraint). A fresh `claude -p` per
# batch means each starts with a clean context (auto close/reopen — no manual
# /clear). Resumable: a batch whose `batch-NNN.output.json` already validates is
# skipped, so re-running continues where it stopped.
#
# USAGE
#   ./scripts/run-podcast-tag-loop.sh --out <name> [--model sonnet]
#                                     [--label claude-sonnet-4-6] [--max-retries 2]
#     --out          REQUIRED. The basename chosen at acquire (the manifest lives
#                    at ingest/podcasts/.cc-tag/<out>/manifest.json).
#     --model        `claude -p` model for the subsessions (default: sonnet —
#                    podcast tagging uses Sonnet, never Haiku).
#     --label        Model label stamped into <out>.extractions.json
#                    (default: claude-sonnet-4-6).
#     --max-retries  Re-runs of a batch whose output fails validation (default 2).
#
# WINDOWS
#   PowerShell:  & "C:\Program Files\Git\bin\bash.exe" scripts/run-podcast-tag-loop.sh --out luetin09-ccdemo
#   Git Bash:    ./scripts/run-podcast-tag-loop.sh --out luetin09-ccdemo
#
# REQUIRES
#   - `claude` CLI in PATH, `node`, and `npx tsx` (the helper is tsx).
#   - A manifest written by the acquire stage for <out>.
#
# EXIT CODES
#   0  success: every batch tagged + merged into <out>.extractions.json
#   1  pre-run check failed (claude/node missing, no manifest, bad args)
#   2  a batch never produced valid output within --max-retries
#   3  `claude -p` returned non-zero exit
#   4  prepare or merge (the tsx helper) failed

set -euo pipefail

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

readonly HELPER="scripts/podcast-cc-tag.ts"
readonly CONVENTIONS="ingest/podcasts/tagging-conventions.md"
readonly ALLOWED_TOOLS="Read Write"
readonly STEP_LOG="scripts/.last-podcast-tag-loop.log"

if [[ -t 1 ]]; then
  C_BOLD=$'\033[1m'; C_RED=$'\033[31m'; C_GREEN=$'\033[32m'
  C_YELLOW=$'\033[33m'; C_BLUE=$'\033[34m'; C_RESET=$'\033[0m'
else
  C_BOLD=""; C_RED=""; C_GREEN=""; C_YELLOW=""; C_BLUE=""; C_RESET=""
fi

log()  { printf '%s[podcast-tag]%s %s\n' "$C_BLUE"   "$C_RESET" "$*"; }
ok()   { printf '%s[podcast-tag]%s %s\n' "$C_GREEN"  "$C_RESET" "$*"; }
warn() { printf '%s[podcast-tag]%s %s\n' "$C_YELLOW" "$C_RESET" "$*" >&2; }
err()  { printf '%s[podcast-tag]%s %s\n' "$C_RED"    "$C_RESET" "$*" >&2; }
die()  { local code="$1"; shift; err "$*"; exit "$code"; }

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

OUT=""
MODEL="sonnet"
LABEL="claude-sonnet-4-6"
MAX_RETRIES=2

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) sed -n '2,46p' "$0"; exit 0 ;;
    --out)         OUT="${2:-}";         shift 2 ;;
    --model)       MODEL="${2:-}";       shift 2 ;;
    --label)       LABEL="${2:-}";       shift 2 ;;
    --max-retries) MAX_RETRIES="${2:-}"; shift 2 ;;
    *) die 1 "unknown argument: $1 (use -h for help)" ;;
  esac
done

[[ -n "$OUT" ]] || die 1 "--out <name> is required (the basename chosen at acquire)"
if ! [[ "$MAX_RETRIES" =~ ^[0-9]+$ ]]; then
  die 1 "--max-retries must be a non-negative integer (got: $MAX_RETRIES)"
fi

readonly WORK_DIR="ingest/podcasts/.cc-tag/${OUT}"
readonly BATCHES_JSON="${WORK_DIR}/batches.json"
readonly MANIFEST_JSON="${WORK_DIR}/manifest.json"

# ---------------------------------------------------------------------------
# Pre-run checks
# ---------------------------------------------------------------------------

log "${C_BOLD}Pre-run checks${C_RESET}"

command -v claude >/dev/null 2>&1 || die 1 "'claude' CLI not in PATH — install Claude Code or fix PATH"
command -v node   >/dev/null 2>&1 || die 1 "'node' not in PATH"
command -v npx    >/dev/null 2>&1 || die 1 "'npx' not in PATH (needed to run the tsx helper)"
CLAUDE_VERSION=$(claude --version 2>/dev/null | head -n1 || echo "unknown")
ok "  claude in PATH ($CLAUDE_VERSION), node + npx present"

[[ -f "$MANIFEST_JSON" ]] || die 1 "manifest not found: $MANIFEST_JSON
  run acquire first:
  npm run ingest:podcast -- --tagging=cc-direct --stage=acquire --show <slug> --out ${OUT}"
ok "  manifest present ($MANIFEST_JSON)"

# tee stdout into a step log (gitignored via *.log)
mkdir -p "$(dirname "$STEP_LOG")"
exec > >(tee "$STEP_LOG") 2>&1

# ---------------------------------------------------------------------------
# Prepare batches
# ---------------------------------------------------------------------------

log "${C_BOLD}Prepare${C_RESET} — chunking manifest into batches"
npx tsx "$HELPER" prepare --out "$OUT" || die 4 "prepare failed"

BATCH_COUNT=$(node -e "process.stdout.write(String(JSON.parse(require('fs').readFileSync('${BATCHES_JSON}','utf8')).count))") \
  || die 4 "could not read batch count from $BATCHES_JSON"
log "  $BATCH_COUNT batch(es) planned"

# ---------------------------------------------------------------------------
# Trigger string builder (per batch)
# ---------------------------------------------------------------------------

# $1 = batch input path, $2 = batch output path
batch_trigger() {
  local input="$1" output="$2"
  cat <<EOF
You are a tagging subsession for the Chrono Lexicanum Warhammer 40,000 podcast
archive. This is a MECHANICAL task, not a normal session: do NOT read CLAUDE.md,
AGENTS.md, brain/**, any session brief, or the session-start routine. Use ONLY
the Read and Write tools. Make no web requests. Do not run git or any other
command. Do not commit anything.

Tag exactly ONE batch of episodes:

1. Read the conventions: ${CONVENTIONS}
2. Read this batch's input: ${input}
3. For EACH episode in that input, decide its tags per the conventions:
   - episodeKind: one of "lore", "news_recap", "interview", "other".
   - three axes — characters, factions, locations — each an object with two
     string arrays: "primary" (entities the episode is substantially ABOUT) and
     "mentioned" (named only in passing).
   Use surface forms exactly as a lore reader writes them (e.g. "Konrad Curze",
   "Night Lords", "Terra"); output NO slugs. Tag ONLY in-universe Warhammer
   40,000 entities — real-world names (hosts, guests, authors, "Games Workshop",
   "Black Library") are NOT entities and belong in no list. Empty lists are the
   correct answer for a news round-up or a guest interview with no in-universe
   subject; do NOT pad lists to look thorough.
4. Write ${output} — a single JSON object keyed by each episode's EXACT guid
   (the "guid" field from the input), each value shaped:
     {
       "episodeKind": "lore",
       "characters": { "primary": [], "mentioned": [] },
       "factions":   { "primary": [], "mentioned": [] },
       "locations":  { "primary": [], "mentioned": [] }
     }
   Include EVERY guid from the input and ONLY those guids. Write valid JSON only.

Produce no other files and no other output.
EOF
}

# ---------------------------------------------------------------------------
# Tag loop (one fresh claude -p per batch; resumable; retry on bad output)
# ---------------------------------------------------------------------------

TAGGED=0
SKIPPED=0

for (( i=0; i<BATCH_COUNT; i++ )); do
  PAD=$(printf '%03d' "$i")
  INPUT="${WORK_DIR}/batch-${PAD}.input.json"
  OUTPUT="${WORK_DIR}/batch-${PAD}.output.json"

  # Resumable: skip a batch whose output already validates.
  if npx tsx "$HELPER" check --out "$OUT" --batch "$i" >/dev/null 2>&1; then
    ok "  batch ${PAD}: already tagged — skipping"
    SKIPPED=$(( SKIPPED + 1 ))
    continue
  fi

  log "${C_BOLD}=== Batch ${PAD} / $(( BATCH_COUNT - 1 )) ===${C_RESET}"
  TRIGGER=$(batch_trigger "$INPUT" "$OUTPUT")

  attempt=0
  accepted=0
  while (( attempt <= MAX_RETRIES )); do
    if (( attempt > 0 )); then
      warn "  batch ${PAD}: retry ${attempt}/${MAX_RETRIES}"
    fi
    log "  invoking claude -p (--model ${MODEL}) ..."

    set +e
    claude -p "$TRIGGER" \
      --model "$MODEL" \
      --allowedTools $ALLOWED_TOOLS \
      --permission-mode acceptEdits
    CC_EXIT=$?
    set -e

    if (( CC_EXIT != 0 )); then
      warn "  claude -p exited $CC_EXIT"
      attempt=$(( attempt + 1 ))
      continue
    fi

    if npx tsx "$HELPER" check --out "$OUT" --batch "$i"; then
      ok "  batch ${PAD}: output validated"
      accepted=1
      break
    fi
    warn "  batch ${PAD}: output failed validation"
    attempt=$(( attempt + 1 ))
  done

  if (( accepted != 1 )); then
    if (( CC_EXIT != 0 )); then
      die 3 "batch ${PAD}: claude -p kept failing (last exit $CC_EXIT)"
    fi
    die 2 "batch ${PAD}: no valid output after $(( MAX_RETRIES + 1 )) attempt(s)"
  fi
  TAGGED=$(( TAGGED + 1 ))
done

# ---------------------------------------------------------------------------
# Merge → committed extractions file
# ---------------------------------------------------------------------------

log "${C_BOLD}Merge${C_RESET} — assembling ${OUT}.extractions.json"
npx tsx "$HELPER" merge --out "$OUT" --model "$LABEL" || die 4 "merge failed"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

ok "${C_BOLD}Done${C_RESET}"
log "  batches tagged this run: $TAGGED"
log "  batches skipped (resume): $SKIPPED"
log "  total batches:            $BATCH_COUNT"
log "  next: npm run ingest:podcast -- --tagging=cc-direct --stage=assemble --out ${OUT}"
log "  step-log: $STEP_LOG (gitignored)"
