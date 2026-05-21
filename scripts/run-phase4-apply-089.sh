#!/usr/bin/env bash
# Re-apply ssot-w40k-001..025 sequentially for Brief 089 Phase 4 (Resolver-Pass 5).
#
# Order matters: seed the resolver-extension reference rows (new factions /
# locations / characters) AND the new `commissar` facet_value BEFORE applying
# any batch — apply-override.ts:validateFacetIds checks the DB facet_values
# table and hard-throws on unknown ids, and resolved junctions need their FK
# targets present. `db:seed` is NOT used (it is destructive); the two seed
# steps below are non-destructive (faction upsert + ON CONFLICT DO NOTHING).
#
# Per-batch DB-count snapshots for the new 021..025 wave feed the Pre/Per-Batch/
# Post Counts-Tabelle (re-apply 001..020 is resolver-set-drift cleanup).
set -euo pipefail
cd "$(dirname "$0")/.."

LOGFILE="ingest/.last-run/phase4-apply-089.log"
mkdir -p ingest/.last-run
: > "$LOGFILE"

note() {
  printf '\n=== %s ===\n' "$1" | tee -a "$LOGFILE"
}

note "PRE-APPLY counts"
npx tsx --env-file=.env.local scripts/db-counts-089.ts | tee -a "$LOGFILE"

note "SEED resolver-extensions (factions upsert + locations/characters insert)"
npm run db:seed-resolver-extensions 2>&1 | tee -a "$LOGFILE"

note "SEED facets (commissar -> facet_values, ON CONFLICT DO NOTHING)"
npx tsx --env-file=.env.local scripts/seed-facets-089.ts | tee -a "$LOGFILE"

for n in 001 002 003 004 005 006 007 008 009 010 011 012 013 014 015 016 017 018 019 020 021 022 023 024 025; do
  note "APPLY ssot-w40k-$n"
  npm run db:apply-override -- --batch="ssot-w40k-$n" 2>&1 | tee -a "$LOGFILE"
  case "$n" in
    021|022|023|024|025)
      note "POST-BATCH ssot-w40k-$n counts"
      npx tsx --env-file=.env.local scripts/db-counts-089.ts | tee -a "$LOGFILE"
      ;;
  esac
done

note "POST-APPLY counts"
npx tsx --env-file=.env.local scripts/db-counts-089.ts | tee -a "$LOGFILE"

note "DONE"
