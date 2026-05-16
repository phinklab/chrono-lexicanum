#!/usr/bin/env bash
# Re-apply ssot-w40k-001..020 sequentially for Brief 076 Phase 4.
# After each batch logs DB-side counts via apply-override; after every fifth
# batch and at the end runs the count-probe so the Pre/Per-Batch/Post-Counts
# Pflicht-Tabelle gets material.
set -euo pipefail
cd "$(dirname "$0")/.."

LOGFILE="ingest/.last-run/phase4-apply-076.log"
mkdir -p ingest/.last-run
: > "$LOGFILE"

note() {
  printf '\n=== %s ===\n' "$1" | tee -a "$LOGFILE"
}

note "PRE-APPLY"
npx tsx --env-file=.env.local scripts/db-counts-076.ts | tee -a "$LOGFILE"

for n in 001 002 003 004 005 006 007 008 009 010 011 012 013 014 015 016 017 018 019 020; do
  note "BATCH ssot-w40k-$n"
  npm run db:apply-override -- --batch="ssot-w40k-$n" 2>&1 | tee -a "$LOGFILE"
  # Per-batch DB count snapshot for the 016..020 wave so the Phase-4-Counts-
  # Tabelle gets actual deltas (re-apply 001..015 is drift-cleanup and noisy).
  case "$n" in
    016|017|018|019|020)
      note "POST-BATCH ssot-w40k-$n counts"
      npx tsx --env-file=.env.local scripts/db-counts-076.ts | tee -a "$LOGFILE"
      ;;
  esac
done

note "POST-APPLY"
npx tsx --env-file=.env.local scripts/db-counts-076.ts | tee -a "$LOGFILE"

note "DONE"
