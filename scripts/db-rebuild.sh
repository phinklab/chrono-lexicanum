#!/usr/bin/env bash
# db-rebuild.sh — full SSOT rebuild orchestrator (Brief 107).
#
# A thin orchestrator that sits ABOVE the existing building blocks and chains
# them in the one order that makes a from-reset rebuild complete. It does NOT
# reimplement any of them — it calls them:
#
#   1. db:reset-for-ssot --confirm         TRUNCATE works CASCADE. Wipes the works
#                                          domain (incl. work_persons); REFERENCE
#                                          tables (persons, factions, characters,
#                                          locations, …) are preserved.
#   2. run-phase4-apply.sh <rebuild cfg>   Re-apply the whole crystallized override
#                                          roster (W40K 1..57 + HH 1..30 = all 859),
#                                          idempotent delete-then-insert per junction.
#                                          Restores author|editor work_persons.
#   3. apply:audiobook-narrators           TAIL — restore the narrator|co_narrator|
#                                          full_cast work_persons rows. Runs LAST
#                                          because it resolves externalBookId ->
#                                          works.id, so the works must exist.
#   4. apply:audiobook-narrators --verify  Read-only post-condition: DB audio-role
#                                          count == sidecar-derived expected (today
#                                          88), nonzero. Mismatch fails the rebuild.
#
# WHY a dedicated orchestrator and not a tail step in run-phase4-apply.sh: that
# engine runs on EVERY resolver wave + via the loop driver; an audio-apply tacked
# on there would fire redundantly per wave and couple a rebuild-only concern into
# the generic engine. The rebuild is the right level (Brief 107 § Notes).
#
# WHY the order is forgiving: the Brief-105 durability fix scopes the override
# delete in apply-override.ts to author|editor, and this worker scopes ITS delete
# to the audio roles — the two paths never clobber each other. So once the 88 rows
# are applied, every LATER routine re-apply leaves them intact; the rebuild only
# has to apply them once, at the end.
#
# DESTRUCTIVE — truncates `works`. Confirm-gated: refuses without --confirm or
# DB_RESET_CONFIRM=1, and a naked run never truncates. Fail-fast: a failed step
# aborts before later steps run (honest non-zero exit). Idempotent + re-runnable:
# two confirmed runs reach the same end state.
#
# USAGE
#   npm run db:rebuild -- --confirm
#   DB_RESET_CONFIRM=1 npm run db:rebuild
#   bash scripts/db-rebuild.sh --confirm        # direct (if the npm shell can't resolve bash)
#   npm run db:rebuild -- --help
#
# Preconditions + full runbook: sessions/db-rebuild-runbook.md
set -euo pipefail
cd "$(dirname "$0")/.."

REBUILD_CONFIG="scripts/db-rebuild.config.json"

print_help() {
  cat >&2 <<'EOF'
db-rebuild — full SSOT rebuild: reset the works domain, re-apply the whole
crystallized override roster, restore audiobook credits, then verify.

Sequence (each step gates the next; a failure aborts before later steps run):
  1. db:reset-for-ssot --confirm          TRUNCATE works CASCADE (reference tables preserved)
  2. run-phase4-apply.sh <rebuild cfg>    re-apply all 859 committed override batches (W40K 1..57 + HH 1..30)
  3. apply:audiobook-narrators            tail — restore the audio-role work_persons rows (works now exist)
  4. apply:audiobook-narrators --verify   confirm DB count == sidecar-derived expected (today 88), nonzero

DESTRUCTIVE — truncates `works`. Requires explicit confirmation via either:
  --confirm                  CLI flag.
  DB_RESET_CONFIRM=1         Environment variable.

Usage:
  npm run db:rebuild -- --confirm
  DB_RESET_CONFIRM=1 npm run db:rebuild
  bash scripts/db-rebuild.sh --confirm        # direct (if the npm shell can't resolve bash)
  npm run db:rebuild -- --help

Preconditions + full runbook: sessions/db-rebuild-runbook.md
EOF
}

# --- confirm-gating ---------------------------------------------------------
# Refuse to truncate without explicit confirmation. A naked `npm run db:rebuild`
# must NOT truncate. Mirrors the refuse-without-confirm pattern in
# scripts/db-reset-for-ssot.ts.
CONFIRM=0
for arg in "$@"; do
  case "$arg" in
    --confirm) CONFIRM=1 ;;
    -h|--help) print_help; exit 0 ;;
    *) echo "[db-rebuild] unknown argument: $arg" >&2; print_help; exit 1 ;;
  esac
done
# NB: an `if`, not `[[ ]] && CONFIRM=1` — the latter returns non-zero when the
# env var is unset and would trip `set -e`.
if [[ "${DB_RESET_CONFIRM:-}" == "1" ]]; then
  CONFIRM=1
fi

if [[ "$CONFIRM" -ne 1 ]]; then
  echo "[db-rebuild] refusing to rebuild (this TRUNCATEs works) without --confirm or DB_RESET_CONFIRM=1" >&2
  echo "" >&2
  print_help
  exit 1
fi

[[ -f "$REBUILD_CONFIG" ]] || { echo "[db-rebuild] rebuild config not found: $REBUILD_CONFIG" >&2; exit 1; }

# --- fail-fast step runner --------------------------------------------------
# Run a labeled step; abort the whole rebuild on failure with a clear marker so
# a failed reset/apply/audio step is never silently followed by later steps.
step() {
  local label="$1"; shift
  echo ""
  echo "==================================================================="
  echo "[db-rebuild] STEP: $label"
  echo "==================================================================="
  if ! "$@"; then
    echo "" >&2
    echo "[db-rebuild] FAILED at step: $label" >&2
    echo "[db-rebuild] aborting — later steps did NOT run." >&2
    exit 1
  fi
}

echo "[db-rebuild] starting full SSOT rebuild (confirmed). Rebuild config: $REBUILD_CONFIG"

# 1. Reset the works domain. Confirmation is passed through to the reset step;
#    reference tables (persons/factions/characters/locations/…) are preserved.
step "1/4 reset works domain (db:reset-for-ssot)" \
  npm run db:reset-for-ssot -- --confirm

# 2. Re-apply the full crystallized override roster (both domains, all 859).
#    Idempotent; reproduces the data-complete + consolidated corpus (the merges
#    are baked into the committed reference JSONs — no separate consolidation step).
step "2/4 re-apply full corpus (run-phase4-apply.sh)" \
  bash scripts/run-phase4-apply.sh "$REBUILD_CONFIG"

# 3. TAIL: restore audiobook credits. The works exist now, so every sidecar book
#    resolves. Runs only after the apply waves succeeded (fail-fast above).
step "3/4 restore audiobook credits (apply:audiobook-narrators)" \
  npm run apply:audiobook-narrators

# 4. Verify the rebuild is complete: DB audio-role count == sidecar-derived
#    expected (today 88), nonzero. Mismatch makes the rebuild fail.
step "4/4 verify audiobook credits restored (apply:audiobook-narrators --verify)" \
  npm run apply:audiobook-narrators -- --verify

echo ""
echo "[db-rebuild] DONE — works domain rebuilt, override roster re-applied, audiobook credits restored + verified."
exit 0
