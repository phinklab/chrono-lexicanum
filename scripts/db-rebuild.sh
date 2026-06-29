#!/usr/bin/env bash
# db-rebuild.sh — DISASTER-RECOVERY full SSOT rebuild (Brief 107, redefined in
# Brief 157).
#
# ⚠ YOU ALMOST NEVER NEED THIS. The routine way to push committed SSOT changes
# into the live DB is the NON-DESTRUCTIVE `npm run db:sync` — it re-applies the
# whole roster + every tail idempotently and NEVER truncates. Use this rebuild
# ONLY for from-clean recovery: a fresh/migrated DB, or when `npm run db:drift`
# shows real divergence a re-sync can't fix.
#
# db:rebuild == db:sync + a prepended, confirm-gated TRUNCATE. The destructive
# truncate is the ONLY thing this adds over db:sync; the entire restore chain
# (corpus + per-book + podcast + audiobook + timeline + curation, auto-derived
# scope) lives in scripts/db-sync.sh and is shared by both paths — this
# orchestrator does not reimplement it.
#
#   1. db-apply-scope.ts (--check)         PREFLIGHT (read-only) — derive + validate
#                                          the apply scope from the committed roster
#                                          BEFORE the truncate. A stray file or a hole
#                                          HALTS LOUDLY here, so a confirmed rebuild
#                                          never truncates into an unappliable roster.
#   2. db:reset-for-ssot --confirm         DESTRUCTIVE TRUNCATE works CASCADE. Wipes the
#                                          works domain (incl. work_persons, podcasts,
#                                          event_works, the timeline columns on works);
#                                          REFERENCE tables (persons, factions,
#                                          characters, locations, eras, …) are preserved.
#   3. db:sync                             The full NON-DESTRUCTIVE restore chain:
#                                          re-apply the auto-derived committed roster +
#                                          per-book + podcast + audiobook + timeline +
#                                          curation, each verify-gated. (Re-runs the
#                                          preflight in --emit-config mode; harmless.)
#
# WHY a dedicated orchestrator and not a tail in run-phase4-apply.sh: that engine
# runs on EVERY resolver wave; a reset/audio/timeline step there would fire
# redundantly per wave and couple rebuild-only concerns into the generic engine.
# The rebuild (now: db:sync) is the right level (Brief 107 § Notes).
#
# DESTRUCTIVE — truncates `works`. Confirm-gated: refuses without --confirm or
# DB_RESET_CONFIRM=1, and a naked run never truncates. Fail-fast: a failed step
# aborts before later steps run. Idempotent + re-runnable: two confirmed runs
# reach the same end state.
#
# USAGE
#   npm run db:rebuild -- --confirm
#   DB_RESET_CONFIRM=1 npm run db:rebuild
#   bash scripts/db-rebuild.sh --confirm        # direct (if the npm shell can't resolve bash)
#   npm run db:rebuild -- --help
#
# Routine alternative (use this instead): npm run db:sync
# Read-only health check:                  npm run db:drift
# Preconditions + full runbook: scripts/runbooks/db-rebuild-runbook.md
set -euo pipefail
cd "$(dirname "$0")/.."

print_help() {
  cat >&2 <<'EOF'
db-rebuild — DISASTER-RECOVERY full SSOT rebuild: validate the apply scope,
TRUNCATE the works domain, then run the full non-destructive db:sync restore.

⚠ You almost never need this. The routine "push my changes" path is the
non-destructive `npm run db:sync` (no truncate). Use this ONLY for from-clean
recovery (fresh/migrated DB, or `npm run db:drift` shows real divergence).

db:rebuild == db:sync + a prepended confirm-gated TRUNCATE.

Sequence (each step gates the next; a failure aborts before later steps run):
  1. db-apply-scope (preflight)           validate the apply scope BEFORE truncate (HALTS on a hole/stray)
  2. db:reset-for-ssot --confirm          TRUNCATE works CASCADE (reference tables preserved)
  3. db:sync                              the full non-destructive restore chain (corpus + per-book + podcast + audiobook + timeline + curation, all verify-gated)

DESTRUCTIVE — truncates `works`. Requires explicit confirmation via either:
  --confirm                  CLI flag.
  DB_RESET_CONFIRM=1         Environment variable.

Usage:
  npm run db:rebuild -- --confirm
  DB_RESET_CONFIRM=1 npm run db:rebuild
  bash scripts/db-rebuild.sh --confirm        # direct (if the npm shell can't resolve bash)
  npm run db:rebuild -- --help

Routine alternative (use this instead): npm run db:sync
Read-only health check:                  npm run db:drift
Preconditions + full runbook: scripts/runbooks/db-rebuild-runbook.md
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
  echo "[db-rebuild] for the routine non-destructive path use: npm run db:sync" >&2
  echo "" >&2
  print_help
  exit 1
fi

# --- fail-fast step runner --------------------------------------------------
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

echo "[db-rebuild] starting DISASTER-RECOVERY rebuild (confirmed) — truncate + db:sync."

# 1. PREFLIGHT (read-only): validate the apply scope BEFORE the destructive
#    truncate, so a confirmed rebuild can never truncate into a roster it then
#    can't fully re-apply. db:sync (step 3) re-runs this in --emit-config mode;
#    running it here too is harmless (read-only) and is the hard guarantee that
#    the guard fires before the truncate.
step "1/3 preflight — validate apply scope before truncate (db-apply-scope)" \
  npx tsx scripts/db-apply-scope.ts

# 2. DESTRUCTIVE: truncate the works domain. Confirmation is passed through;
#    reference tables (persons/factions/characters/locations/eras/…) are preserved.
step "2/3 TRUNCATE works domain (db:reset-for-ssot --confirm)" \
  npm run db:reset-for-ssot -- --confirm

# 3. The full non-destructive restore chain — corpus + per-book + podcast +
#    audiobook + timeline + curation, auto-derived scope, each verify-gated. Identical to a
#    standalone `npm run db:sync`; the only difference from a routine sync is the
#    truncate that ran first (step 2).
step "3/3 restore everything (db:sync)" \
  bash scripts/db-sync.sh

echo ""
echo "[db-rebuild] DONE — works domain truncated and fully rebuilt + verified via db:sync."
exit 0
