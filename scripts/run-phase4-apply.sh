#!/usr/bin/env bash
# run-phase4-apply.sh — stable, config-driven Phase-4 re-apply for axis-sliced
# Resolver-Passes (Brief 090; generalized from run-phase4-apply-NNN.sh).
#
# Reads the cumulative apply-range(s) + the new-wave batch ids from the per-pass
# config (scripts/resolver-pass.config.json: aggregator.applyRange | applyRanges
# / .batches). Supports the singleton applyRange (per-wave + Pass-1 form) and
# the multi-domain applyRanges list (Brief 102 Pass-2 form, Full-Corpus W40K+HH);
# inline helpers normalize to a list-of-batches in both cases.
# seeds the resolver-extension reference rows AND the facet_values catalog BEFORE
# applying any batch (apply-override.ts:validateFacetIds checks the DB and hard-
# throws on unknown facet ids; resolved junctions need their FK targets present),
# then re-applies each batch idempotently (delete-then-insert per junction — NOT
# a production pass, NOT db:seed which is destructive).
#
# Brief 090 Baustein 4 — DIGEST-ONLY: the unbounded raw per-batch apply output
# goes to a gitignored verbose log; the Phase-4 subsession reads ONLY the fixed-
# size digest (pre / per-new-wave-batch / post counts). Digest size is constant
# regardless of corpus size, so Phase 4 context no longer scales with book count.
#
# USAGE
#   ./scripts/run-phase4-apply.sh [scripts/resolver-pass.config.json]
set -euo pipefail
cd "$(dirname "$0")/.."

# Track whether any seed/apply step failed. The digest is still written in full
# (all batches, counts, DONE); the script just exits non-zero at the end so a
# failed re-apply is never silently reported as success.
FAILED=0

CONFIG="${1:-scripts/resolver-pass.config.json}"
[[ -f "$CONFIG" ]] || { echo "config not found: $CONFIG" >&2; exit 1; }

OUT_DIR="ingest/.last-run"
DIGEST="$OUT_DIR/phase4-digest.md"          # committed input for the LLM (fixed size)
VERBOSE="$OUT_DIR/phase4-apply-verbose.log"  # gitignored raw output (debug only)
mkdir -p "$OUT_DIR"
: > "$DIGEST"
: > "$VERBOSE"

# --- config helpers ---------------------------------------------------------

apply_batches() {
  node --input-type=module -e "
    import fs from 'node:fs';
    const cfg = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
    const agg = cfg.aggregator || {};
    const singleton = agg.applyRange;
    const list = Array.isArray(agg.applyRanges) ? agg.applyRanges : null;
    if (singleton && list && list.length > 0) {
      console.error('[run-phase4-apply] config has BOTH applyRange and applyRanges — pick one');
      process.exit(1);
    }
    const ranges = list && list.length > 0 ? list : (singleton ? [singleton] : []);
    const ids = [];
    for (const r of ranges) {
      for (let n = r.from; n <= r.to; n += 1) {
        ids.push('ssot-' + r.domain + '-' + String(n).padStart(3, '0'));
      }
    }
    process.stdout.write(ids.join(' '));
  " "$CONFIG"
}

wave_batches() {
  node --input-type=module -e "
    import fs from 'node:fs';
    const cfg = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
    process.stdout.write((cfg.aggregator.batches || []).join(' '));
  " "$CONFIG"
}

APPLY_BATCHES=$(apply_batches)
WAVE_BATCHES=" $(wave_batches) "   # padded for substring membership test

# digest_line writes to the digest; verbose_run sends raw output to the log only.
dnote() { printf '%s\n' "$*" >> "$DIGEST"; }
verbose_run() { "$@" >> "$VERBOSE" 2>&1; }

# Append a labeled db-counts snapshot as a compact table to the digest.
counts_snapshot() {
  local label="$1"
  dnote ""
  dnote "### $label"
  dnote ""
  dnote '```'
  npx tsx --env-file=.env.local scripts/db-counts.ts >> "$DIGEST" 2>>"$VERBOSE"
  dnote '```'
}

# --- digest header ----------------------------------------------------------

dnote "# Phase-4 apply digest"
dnote ""
dnote "Config: \`$CONFIG\` · apply-range: \`$APPLY_BATCHES\` · new wave:\`$WAVE_BATCHES\`"
dnote "Raw per-batch output (unbounded, NOT read by the LLM): \`$VERBOSE\` (gitignored)."

# --- seed (non-destructive) -------------------------------------------------

counts_snapshot "PRE-APPLY counts"

dnote ""
dnote "### Seed resolver-extensions + facets (non-destructive)"
dnote ""
dnote '```'
if { echo "== seed-resolver-extensions =="; npm run db:seed-resolver-extensions; } >> "$VERBOSE" 2>&1; then
  dnote "seed-resolver-extensions: ok"
else
  dnote "seed-resolver-extensions: FAILED (see verbose log)"
  FAILED=1
fi
# seed-facets: key on the tsx exit status (PIPESTATUS[0]), NOT on grep — grep
# legitimately exits 1 when there are no [seed-facets] lines to promote. Disable
# errexit only around the pipeline so a non-zero pipe status can't abort here;
# capture PIPESTATUS[0] (the brace group = tsx) before any other command resets it.
set +e
{ echo "== seed-facets =="; npx tsx --env-file=.env.local scripts/seed-facets.ts; } 2>>"$VERBOSE" \
  | tee -a "$VERBOSE" | grep -E '^\[seed-facets\]' >> "$DIGEST"
facets_status=${PIPESTATUS[0]}
set -e
if [[ "$facets_status" -ne 0 ]]; then
  dnote "seed-facets: FAILED (see verbose log)"
  FAILED=1
fi
dnote '```'

# --- apply each batch -------------------------------------------------------

dnote ""
dnote "### Per-batch apply (new-wave batches get a post-batch counts snapshot)"

for batch in $APPLY_BATCHES; do
  if verbose_run npm run db:apply-override -- --batch="$batch"; then
    dnote "- applied \`$batch\`: ok"
  else
    dnote "- applied \`$batch\`: FAILED (see verbose log)"
    FAILED=1
  fi
  if [[ "$WAVE_BATCHES" == *" $batch "* ]]; then
    counts_snapshot "POST-BATCH counts — $batch"
  fi
done

counts_snapshot "POST-APPLY counts"
dnote ""
dnote "DONE"

echo "phase4 digest written: $DIGEST"
echo "verbose log (gitignored): $VERBOSE"

# Surface any swallowed seed/apply failure. The digest is complete (through DONE)
# and per-step FAILED markers are in place; the exit code is the hard signal.
if [[ "$FAILED" -ne 0 ]]; then
  echo "phase4 apply: one or more steps FAILED (see verbose log: $VERBOSE)" >&2
  exit 1
fi
exit 0
