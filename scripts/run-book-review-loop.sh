#!/usr/bin/env bash
# scripts/run-book-review-loop.sh — Headless driver for the cc-direct B11
# book-reviewer (Brief 154), cloned from run-podcast-tag-loop.sh.
#
#     prepare (project books DB-free → chunks)
#  →  THIS DRIVER  (per chunk: claude -p FINDER → enumerate → claude -p VERIFIER)
#  →  merge (confirmed → reviewQueue sidecar + facet notes + findings table)
#
# Two-stage adversarial topology (Brief 154 + pattern 144): a FINDER subsession
# proposes raw corrections; an INDEPENDENT VERIFIER subsession (fresh process,
# fresh context) confirms or refutes each. Only confirmed findings reach the
# output. Each stage is one fresh `claude -p` on the Max-plan allowance with ONLY
# Read+Write — ZERO metered Anthropic API. Fresh process per stage = clean
# context. Resumable: a chunk whose verifier output already validates is skipped.
#
# PARALLEL: chunks run through a concurrency-limited job pool (--concurrency).
# Each chunk's finder→verifier is serial within the chunk (verifier needs the
# finder output) but DIFFERENT chunks run concurrently. Per-chunk verbose output
# goes to ingest/book-review/.work/chunk-NN.log; the main log keeps status lines.
#
# USAGE
#   ./scripts/run-book-review-loop.sh [--concurrency N] [--limit N]
#                                     [--model opus] [--max-retries 2] [--pilot]
#     --concurrency  Chunks reviewed at once (default 4). Tune to the Max ceiling.
#     --limit        Launch at most N chunks this run (0 = all). Bounded waves;
#                    re-run to continue (completed chunks skip).
#     --model        `claude -p` model for finder + verifier (default: opus).
#     --max-retries  Re-runs of a stage whose output fails the contract (default 2).
#     --pilot        Review only the 40-book calibration slice (prepare --pilot).
#   Chunk size: env BOOK_REVIEW_CHUNK_SIZE (default 8).
#
# WINDOWS
#   PowerShell:  & "C:\Program Files\Git\bin\bash.exe" scripts/run-book-review-loop.sh
#   Git Bash:    ./scripts/run-book-review-loop.sh
#
# REQUIRES `claude` CLI, `node`, `npx tsx`, bash 4.3+ (`wait -n`). NO DB / .env
# needed (prepare, enumerate, merge are DB-free); parity is a separate local step.
#
# EXIT CODES
#   0  success (merged), or a deliberate partial wave (--limit) — re-run to finish
#   1  pre-run check failed (claude/node/bash missing, bad args)
#   2  one or more chunks never produced valid output — re-run to resume
#   4  prepare or merge (the tsx helper) failed

set -euo pipefail

readonly HELPER="scripts/book-review.ts"
readonly CONV_FACTIONS="ingest/book-review/conventions-factions.md"
readonly CONV_JUNCTIONS="ingest/book-review/conventions-junctions.md"
readonly CONV_FACETS="ingest/book-review/conventions-facets.md"
readonly ALLOWED_TOOLS="Read Write"
readonly WORK_DIR="ingest/book-review/.work"
readonly MANIFEST="${WORK_DIR}/manifest.json"
readonly STEP_LOG="scripts/.last-book-review-loop.log"

if [[ -t 1 ]]; then
  C_BOLD=$'\033[1m'; C_RED=$'\033[31m'; C_GREEN=$'\033[32m'
  C_YELLOW=$'\033[33m'; C_BLUE=$'\033[34m'; C_RESET=$'\033[0m'
else
  C_BOLD=""; C_RED=""; C_GREEN=""; C_YELLOW=""; C_BLUE=""; C_RESET=""
fi

log()  { printf '%s[book-review]%s %s\n' "$C_BLUE"   "$C_RESET" "$*"; }
ok()   { printf '%s[book-review]%s %s\n' "$C_GREEN"  "$C_RESET" "$*"; }
warn() { printf '%s[book-review]%s %s\n' "$C_YELLOW" "$C_RESET" "$*" >&2; }
err()  { printf '%s[book-review]%s %s\n' "$C_RED"    "$C_RESET" "$*" >&2; }
die()  { local code="$1"; shift; err "$*"; exit "$code"; }

# ---------------------------------------------------------------------------
# Arguments
# ---------------------------------------------------------------------------

MODEL="opus"
MAX_RETRIES=2
CONCURRENCY=4
LIMIT=0
PILOT=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) sed -n '2,52p' "$0"; exit 0 ;;
    --model)       MODEL="${2:-}";       shift 2 ;;
    --max-retries) MAX_RETRIES="${2:-}"; shift 2 ;;
    --concurrency) CONCURRENCY="${2:-}"; shift 2 ;;
    --limit)       LIMIT="${2:-}";       shift 2 ;;
    --pilot)       PILOT=1;              shift ;;
    *) die 1 "unknown argument: $1 (use -h for help)" ;;
  esac
done
[[ "$MAX_RETRIES" =~ ^[0-9]+$ ]] || die 1 "--max-retries must be a non-negative integer (got: $MAX_RETRIES)"
[[ "$CONCURRENCY" =~ ^[0-9]+$ ]] || die 1 "--concurrency must be a positive integer (got: $CONCURRENCY)"
[[ "$LIMIT"       =~ ^[0-9]+$ ]] || die 1 "--limit must be a non-negative integer (got: $LIMIT)"
(( CONCURRENCY < 1 )) && CONCURRENCY=1

# ---------------------------------------------------------------------------
# Pre-run checks
# ---------------------------------------------------------------------------

log "${C_BOLD}Pre-run checks${C_RESET}"
if (( BASH_VERSINFO[0] < 4 || ( BASH_VERSINFO[0] == 4 && BASH_VERSINFO[1] < 3 ) )); then
  die 1 "bash ${BASH_VERSION} too old for 'wait -n' (need 4.3+) — use Git Bash"
fi
command -v claude >/dev/null 2>&1 || die 1 "'claude' CLI not in PATH — install Claude Code or fix PATH"
command -v node   >/dev/null 2>&1 || die 1 "'node' not in PATH"
command -v npx    >/dev/null 2>&1 || die 1 "'npx' not in PATH (needed to run the tsx helper)"
for f in "$CONV_FACTIONS" "$CONV_JUNCTIONS" "$CONV_FACETS"; do
  [[ -f "$f" ]] || die 1 "convention doc missing: $f"
done
CLAUDE_VERSION=$(claude --version 2>/dev/null | head -n1 || echo "unknown")
ok "  claude in PATH ($CLAUDE_VERSION), node + npx present, bash ${BASH_VERSION}, conventions present"

mkdir -p "$(dirname "$STEP_LOG")"
exec > >(tee "$STEP_LOG") 2>&1

# ---------------------------------------------------------------------------
# Prepare (DB-free projection → chunks)
# ---------------------------------------------------------------------------

if (( PILOT )); then
  log "${C_BOLD}Prepare${C_RESET} — projecting the 40-book pilot slice and chunking"
  npx tsx "$HELPER" prepare --pilot || die 4 "prepare failed"
else
  log "${C_BOLD}Prepare${C_RESET} — projecting the full catalog and chunking"
  npx tsx "$HELPER" prepare || die 4 "prepare failed"
fi

CHUNK_COUNT=$(node -e "process.stdout.write(String(JSON.parse(require('fs').readFileSync('${MANIFEST}','utf8')).chunks.length))") \
  || die 4 "could not read chunk count from $MANIFEST"
LIMIT_NOTE=""; (( LIMIT > 0 )) && LIMIT_NOTE=", limit=${LIMIT}"
log "  $CHUNK_COUNT chunk(s) planned (model=${MODEL}, concurrency=${CONCURRENCY}${LIMIT_NOTE})"

# ---------------------------------------------------------------------------
# Trigger builders — the verbatim Brief-131 MECHANICAL-task preamble for BOTH
# the finder and the verifier (the token budget depends on it).
# ---------------------------------------------------------------------------

mechanical_preamble() {
  cat <<'EOF'
This is a MECHANICAL task, not a normal session: do NOT read CLAUDE.md,
AGENTS.md, brain/**, any session brief, or the session-start routine. Use ONLY
the Read and Write tools. Make no web requests. Do not run git or any other
command. Do not commit anything.
EOF
}

# $1 = chunk books input, $2 = finder output path
finder_trigger() {
  local input="$1" output="$2"
  cat <<EOF
You are a BOOK-REVIEW FINDER subsession for the Chrono Lexicanum Warhammer 40,000
novel archive.
$(mechanical_preamble)

Review exactly ONE chunk of books for data-quality corrections.

1. Read the three convention docs (what to flag, what NOT to flag, the role
   vocabulary, "an empty correction list is the right answer when the book is
   correct"):
   - ${CONV_FACTIONS}
   - ${CONV_JUNCTIONS}
   - ${CONV_FACETS}
2. Read this chunk's books: ${input}
   Each book carries its title, synopsis, and CURRENT factions / locations /
   characters / facets with canonical "id"s + roles (this is the visitor-facing
   state — review against THIS, not your own headcanon).
3. For EACH book, propose ONLY corrections you are confident the current data
   gets WRONG. Per faction / location / character axis, three kinds:
   - add: an entity the book substantially features that is MISSING. Emit the
     entity's SURFACE FORM (a name string, e.g. "Inquisitor Gregor Eisenhorn"),
     NOT an id — the driver resolves it.
   - remove: a CURRENT edge that does not belong (reference its canonical "id").
   - roleFix: a CURRENT edge whose role is wrong (reference its "id", give
     "currentRole" and "proposedRole").
   For facets: add / remove referencing a facet "id".
   Allowed roles — factions: primary|supporting|antagonist · locations:
   primary|secondary|mentioned · characters: pov|appears|mentioned.
   An EMPTY correction set is the CORRECT answer for a book whose data is right.
   Do NOT pad. Every finding needs a one-sentence "rationale"; add / roleFix /
   facet findings also need a "confidence" number in [0,1].
4. Write ${output} — ONE JSON object keyed by each book's EXACT externalBookId:
     {
       "W40K-000X": {
         "factions":   { "add":     [{ "name": "...", "role": "supporting", "confidence": 0.8, "rationale": "..." }],
                         "remove":  [{ "id": "...", "rationale": "..." }],
                         "roleFix": [{ "id": "...", "currentRole": "supporting", "proposedRole": "primary", "confidence": 0.7, "rationale": "..." }] },
         "locations":  { "add": [...], "remove": [...], "roleFix": [...] },
         "characters": { "add": [...], "remove": [...], "roleFix": [...] },
         "facets":     { "add":    [{ "id": "...", "confidence": 0.7, "rationale": "..." }],
                         "remove": [{ "id": "...", "confidence": 0.7, "rationale": "..." }] }
       }
     }
   Include EVERY externalBookId from the input and ONLY those. Omit any axis/kind
   you have no finding for. A book with no findings is "W40K-000X": {}. Write
   valid JSON only.

Produce no other files and no other output.
EOF
}

# $1 = chunk books input, $2 = enumerated findings, $3 = verifier output path
verifier_trigger() {
  local input="$1" findings="$2" output="$3"
  cat <<EOF
You are a BOOK-REVIEW VERIFIER subsession for the Chrono Lexicanum Warhammer
40,000 novel archive. You are an INDEPENDENT adversarial checker — a DIFFERENT
agent proposed these corrections; your job is to CONFIRM or REFUTE each, and to
default to REFUTE whenever the evidence is not clearly sufficient.
$(mechanical_preamble)

1. Read the three convention docs:
   - ${CONV_FACTIONS}
   - ${CONV_JUNCTIONS}
   - ${CONV_FACETS}
2. Read the chunk's books (title, synopsis, current edges + facets): ${input}
3. Read the enumerated findings to verify: ${findings}
   It is { "chunk": N, "findings": [ ... ] }. A finding's INDEX is its position
   in the "findings" array, starting at 0. Each finding has externalBookId,
   dimension, op, the proposed change, and a rationale.
4. For EACH finding, judge ONLY from the book's synopsis + current data + the
   conventions whether the proposed correction is RIGHT. CONFIRM only if you are
   convinced; a correction that merely "could be" true is a REFUTE — the
   reviewQueue must stay clean of plausible-but-unproven changes.
5. Write ${output} — ONE JSON object keyed by the finding INDEX as a string:
     { "0": { "verdict": "confirm", "reason": "..." },
       "1": { "verdict": "refute",  "reason": "..." } }
   Include EVERY index from 0 to findings.length-1 and no others. Write valid
   JSON only.

Produce no other files and no other output.
EOF
}

# ---------------------------------------------------------------------------
# Per-chunk worker (runs as a background job in the pool)
# ---------------------------------------------------------------------------

# attempt_stage: $1 label, $2 trigger, $3 validate cmd. Echoes to the (redirected)
# chunk log. Returns 0 on a validated stage, 1 after exhausting retries. No die.
attempt_stage() {
  local label="$1" trigger="$2" validate="$3"
  local attempt=0 cc_exit=0
  while (( attempt <= MAX_RETRIES )); do
    (( attempt > 0 )) && echo "  ${label}: retry ${attempt}/${MAX_RETRIES}"
    set +e
    claude -p "$trigger" \
      --model "$MODEL" \
      --allowedTools $ALLOWED_TOOLS \
      --permission-mode acceptEdits
    cc_exit=$?
    if (( cc_exit == 0 )) && eval "$validate"; then
      set -e
      echo "  ${label}: output validated"
      return 0
    fi
    set -e
    (( cc_exit != 0 )) && echo "  ${label}: claude -p exited ${cc_exit}"
    attempt=$(( attempt + 1 ))
  done
  return 1
}

# process_chunk: full finder→enumerate→verifier→check pipeline for one chunk.
# Verbose output → chunk log; concise status → main log. Never disrupts the pool.
process_chunk() {
  local i="$1"
  local pad; pad=$(printf '%02d' "$i")
  local input="${WORK_DIR}/chunk-${pad}.books.json"
  local findings="${WORK_DIR}/chunk-${pad}.findings.json"
  local finder_out="${WORK_DIR}/chunk-${pad}.finder.json"
  local verifier_out="${WORK_DIR}/chunk-${pad}.verifier.json"
  local clog="${WORK_DIR}/chunk-${pad}.log"
  local rc=2
  {
    echo "### chunk ${pad} start"
    if attempt_stage "FINDER ${pad}" \
        "$(finder_trigger "$input" "$finder_out")" \
        "npx tsx \"$HELPER\" enumerate --chunk ${i}"; then
      if attempt_stage "VERIFIER ${pad}" \
          "$(verifier_trigger "$input" "$findings" "$verifier_out")" \
          "npx tsx \"$HELPER\" check-verifier --chunk ${i}"; then
        rc=0
      fi
    fi
    echo "### chunk ${pad} end rc=${rc}"
  } >"$clog" 2>&1
  if (( rc == 0 )); then
    ok "  chunk ${pad}: reviewed ✓"
  else
    warn "  chunk ${pad}: FAILED — see ${clog}"
  fi
  return 0
}

running_jobs() { jobs -rp | wc -l | tr -d '[:space:]'; }

# ---------------------------------------------------------------------------
# Review pool (per chunk: finder → enumerate → verifier; concurrency-limited)
# ---------------------------------------------------------------------------

log "${C_BOLD}Review${C_RESET} — ${CONCURRENCY}-wide pool over ${CHUNK_COUNT} chunk(s)"
SKIPPED=0
LAUNCHED=0
for (( i=0; i<CHUNK_COUNT; i++ )); do
  if (( LIMIT > 0 && LAUNCHED >= LIMIT )); then
    log "  reached --limit ${LIMIT} launches — stopping (re-run to continue)"
    break
  fi
  if npx tsx "$HELPER" check-verifier --chunk "$i" >/dev/null 2>&1; then
    SKIPPED=$(( SKIPPED + 1 )); continue
  fi
  while (( $(running_jobs) >= CONCURRENCY )); do
    wait -n 2>/dev/null || true
  done
  log "  → chunk $(printf '%02d' "$i") launched (in flight: $(( $(running_jobs) + 1 ))/${CONCURRENCY})"
  process_chunk "$i" &
  LAUNCHED=$(( LAUNCHED + 1 ))
done
wait

# ---------------------------------------------------------------------------
# Completeness gate (resumable) → merge only when every chunk is verified
# ---------------------------------------------------------------------------

INCOMPLETE=()
DONE=0
for (( i=0; i<CHUNK_COUNT; i++ )); do
  if npx tsx "$HELPER" check-verifier --chunk "$i" >/dev/null 2>&1; then
    DONE=$(( DONE + 1 ))
  else
    INCOMPLETE+=("$i")
  fi
done
log "  complete: ${DONE}/${CHUNK_COUNT} chunk(s) (launched this run: ${LAUNCHED}, skipped: ${SKIPPED})"

if (( ${#INCOMPLETE[@]} > 0 )); then
  if (( LIMIT > 0 )); then
    ok "${C_BOLD}Partial wave done${C_RESET} (--limit ${LIMIT}). ${#INCOMPLETE[@]} chunk(s) remain — re-run to continue; completed chunks skip."
    exit 0
  fi
  warn "  ${#INCOMPLETE[@]} chunk(s) not complete: ${INCOMPLETE[*]}"
  die 2 "re-run to resume the incomplete chunks (completed chunks skip); merge deferred until all complete"
fi

# ---------------------------------------------------------------------------
# Merge → committed proposal files + findings table
# ---------------------------------------------------------------------------

log "${C_BOLD}Merge${C_RESET} — confirmed findings → sidecar + facet queue + findings table"
npx tsx "$HELPER" merge || die 4 "merge failed"

ok "${C_BOLD}Done${C_RESET}"
log "  total chunks:             $CHUNK_COUNT"
log "  launched this run:        $LAUNCHED"
log "  skipped (resume):         $SKIPPED"
log "  outputs: scripts/seed-data/book-review-queue.json, scripts/seed-data/facet-review-queue.json"
log "  findings table: scripts/logs/book-review-log.md"
log "  next (belegt, local, needs DB): npx tsx --env-file=.env.local scripts/book-review.ts parity"
log "  step-log: $STEP_LOG (gitignored), per-chunk logs: ${WORK_DIR}/chunk-NN.log"
