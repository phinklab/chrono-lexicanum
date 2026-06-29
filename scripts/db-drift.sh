#!/usr/bin/env bash
# db-drift.sh — READ-ONLY health check (Brief 157). Tells the maintainer whether
# the live DB looks in sync with the committed SSOT — and therefore whether a
# (rare, destructive) `db:rebuild` is even warranted, or a `db:sync` is enough.
#
# It composes EXISTING read-only signals; it implements no new comparison logic.
# Unlike db:sync / db:rebuild it is NOT fail-fast: it runs EVERY check, then prints
# one summary, so a single red signal doesn't hide the others.
#
#   1. book-corpus-preflight     PER-BOOK CORPUS — every books/*.json parses, is
#                                slug/id-unique, collects-resolvable, prolog inputs
#                                present (DB-free; no batch-contiguity claim).
#   2. db-counts                 COUNTS — junction/reference/works counts (also proves
#                                the DB is reachable). Informational snapshot.
#   3. apply:audiobook-narrators --verify   exact sidecar audio-credit set == DB.
#   4. apply:timeline --verify              exact timeline seed state == DB.
#   5. apply:curation-overlay --verify      every hand override add/suppress/field == DB.
#   6. apply:book --verify       PER-BOOK TAIL (Brief 170 Teil A) — every committed
#                                scripts/seed-data/books/*.json is present in `works`
#                                (slug + book_details row). Empty folder = clean pass.
#   7. refresh:audit-artifacts   PODCAST-ARTIFACT-DRIFT — committed podcast artifacts
#                                vs DB episode guids, per show.
#
# STRICTLY READ-ONLY: every sub-step is a read-only probe or a `--verify` mode. It
# writes nothing — not Postgres, not the roster, not the artifacts.
#
# What it does NOT do (Brief 157, by design): an exact "DB == the COMPLETE SSOT"
# deep diff. The tail `--verify`s prove their own slices (audio / timeline /
# curation) exactly, and contiguity proves the apply scope is complete, but a
# stale corpus junction inside an applied batch is NOT caught here. A full
# DB==SSOT compare is a deferred follow-up; this is the cheap health check. If a
# check is red, re-sync (`npm run db:sync`); if it stays red, investigate / rebuild.
#
# USAGE
#   npm run db:drift
#   bash scripts/db-drift.sh            # direct (if the npm shell can't resolve bash)
#   npm run db:drift -- --help
#
# Exit: 0 iff every check passed; non-zero if any check is red (with a summary).
set -uo pipefail
cd "$(dirname "$0")/.."

print_help() {
  cat >&2 <<'EOF'
db-drift — READ-ONLY health check. Composes existing read-only signals into a
single healthy/unhealthy verdict. Writes nothing. NOT fail-fast: runs every check.

Checks:
  1. book-corpus-preflight              per-book corpus parse/unique/collects/prolog — DB-free
  2. db-counts                          junction/reference/works counts (+ DB reachable)
  3. apply:audiobook-narrators --verify exact sidecar audio-credit set == DB
  4. apply:timeline --verify            exact timeline seed state == DB
  5. apply:curation-overlay --verify    every hand override add/suppress/field == DB
  6. apply:book --verify                every per-book SSOT file present in works (empty folder = pass)
  7. refresh:audit-artifacts            podcast artifact <-> DB episode-guid drift

Does NOT do an exact DB==COMPLETE-SSOT deep diff (deferred, by design). If a check
is red: re-sync with `npm run db:sync`; if it stays red, investigate / rebuild.

Usage:
  npm run db:drift
  bash scripts/db-drift.sh            # direct (if the npm shell can't resolve bash)
  npm run db:drift -- --help

Exit: 0 iff every check passed; non-zero if any check is red.
Full runbook: scripts/runbooks/db-rebuild-runbook.md
EOF
}

for arg in "$@"; do
  case "$arg" in
    -h|--help) print_help; exit 0 ;;
    *) echo "[db-drift] unknown argument: $arg" >&2; print_help; exit 1 ;;
  esac
done

# --- aggregating check runner (NOT fail-fast) -------------------------------
PASS=()
FAIL=()
check() {
  local label="$1"; shift
  echo ""
  echo "-------------------------------------------------------------------"
  echo "[db-drift] CHECK: $label"
  echo "-------------------------------------------------------------------"
  if "$@"; then
    PASS+=("$label")
  else
    FAIL+=("$label")
    echo "[db-drift] ✗ check failed: $label" >&2
  fi
}

echo "[db-drift] read-only health check — running every signal, then summarizing."

check "per-book corpus preflight (book-corpus-preflight)" \
  npx tsx scripts/book-corpus-preflight.ts

check "db counts (DB reachable)" \
  npx tsx --env-file=.env.local scripts/db-counts.ts

check "audiobook tail (apply:audiobook-narrators --verify)" \
  npm run apply:audiobook-narrators -- --verify

check "timeline tail (apply:timeline --verify)" \
  npm run apply:timeline -- --verify

check "curation tail (apply:curation-overlay --verify)" \
  npm run apply:curation-overlay -- --verify

check "per-book tail (apply:book --verify)" \
  npm run apply:book -- --verify

check "podcast artifact drift (refresh:audit-artifacts)" \
  npm run refresh:audit-artifacts

# --- summary ----------------------------------------------------------------
echo ""
echo "==================================================================="
echo "[db-drift] SUMMARY"
echo "==================================================================="
if [[ "${#PASS[@]}" -gt 0 ]]; then
  for p in "${PASS[@]}"; do echo "  ✓ $p"; done
fi
if [[ "${#FAIL[@]}" -gt 0 ]]; then
  for f in "${FAIL[@]}"; do echo "  ✗ $f"; done
fi

if [[ "${#FAIL[@]}" -eq 0 ]]; then
  echo ""
  echo "[db-drift] HEALTHY — every check passed. No rebuild warranted."
  exit 0
fi

echo ""
echo "[db-drift] UNHEALTHY — ${#FAIL[@]} check(s) red (see above)." >&2
echo "[db-drift] first try \`npm run db:sync\` (non-destructive); rebuild only if it stays red." >&2
exit 1
