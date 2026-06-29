#!/usr/bin/env bash
# db-sync.sh — NON-DESTRUCTIVE default apply (Brief 157). THE routine way to push
# committed SSOT changes into the live DB.
#
# This is `db:rebuild` MINUS the truncate. It re-applies the WHOLE committed
# override roster + every tail (per-book / podcast / audiobook / timeline /
# curation) idempotently, in the one order that resolves, and NEVER truncates.
# Safe to run any number of times — two runs reach the same end state.
#
# The chain is the existing building blocks, chained; it reimplements none of them:
#
#   1. db-apply-scope.ts --emit-config     PREFLIGHT (read-only) — derive the apply
#                                          scope from the committed roster on disk,
#                                          assert it is gap-free, write the derived
#                                          config. HALTS LOUDLY here (before any
#                                          write) on a stray file or a hole — a
#                                          committed batch can never be silently
#                                          dropped (the Brief 156 failure).
#   2. run-phase4-apply.sh <derived cfg>   Re-apply the whole crystallized override
#                                          roster (auto-derived: today w40k 1..60 +
#                                          hh 1..30), idempotent delete-then-insert
#                                          per junction. Restores author|editor
#                                          work_persons + every resolved junction.
#   3. apply:book --all                    TAIL (additive, Brief 170 Teil A) — apply
#                                          every per-book SSOT file under
#                                          scripts/seed-data/books/*.json. Runs after
#                                          the Legacy corpus and BEFORE the
#                                          podcast/timeline/curation tails so per-book
#                                          works exist when book-dates + curation edges
#                                          resolve against works.id. Idempotent; an
#                                          EMPTY books/ folder is a clean no-op (Teil A
#                                          ships it empty), so this step is invisible
#                                          until the first book is promoted per-book.
#   4. apply:podcast --all                 TAIL — restore the 4 committed podcast
#                                          shows + episodes (the truncate-less sync
#                                          rarely needs this, but a rebuild's
#                                          truncate wipes them, so it lives in the
#                                          shared chain). Runs AFTER the corpus and
#                                          BEFORE timeline: timeline event_works
#                                          hooks resolve against the podcast works.
#   5. apply:audiobook-narrators           TAIL — restore narrator|co_narrator|
#                                          full_cast work_persons (works exist now).
#   6. apply:audiobook-narrators --verify  Read-only post-condition (exact sidecar set).
#   7. apply:timeline                      TAIL — restore eras/events/event_works +
#                                          book-dates (every hook + book-date
#                                          resolves against works.id, incl. podcasts).
#   8. apply:timeline --verify             Read-only post-condition (exact seed set).
#   9. apply:curation-overlay              TAIL — re-assert the maintainer's hand
#                                          overrides. Runs LAST so its edges win and
#                                          its primary_era_id field-fix beats the
#                                          timeline remap.
#  10. apply:curation-overlay --verify     Read-only post-condition (every add/suppress/field).
#
# NON-DESTRUCTIVE — never truncates, so the DB serves continuously and there is no
# half-empty `works` window. What it does NOT guarantee: that a failure MID-CHAIN
# leaves an exactly-consistent state. If step 2 fails on batch 40 of 90, batches
# 1..39 may already be re-applied and 40.. still old. That is SAFE because the
# whole chain is idempotent and re-runnable — run it again and it converges to the
# clean end state — but it is not "previously-served data stays exactly consistent."
#
# Fail-fast: a failed step aborts before later steps run (honest non-zero exit).
# Idempotent + re-runnable: two runs reach the same end state. Default is the FULL
# roster re-apply — there is no targeted / --only mode (Brief 157, by design).
#
# USAGE
#   npm run db:sync
#   bash scripts/db-sync.sh                      # direct (if the npm shell can't resolve bash)
#   npm run db:sync -- --help
#
# Disaster-recovery (the truncate-first variant): npm run db:rebuild -- --confirm.
# Read-only health check (is a rebuild even warranted?): npm run db:drift.
# Preconditions + full runbook: scripts/runbooks/db-rebuild-runbook.md
set -euo pipefail
cd "$(dirname "$0")/.."

# Derived apply config — GENERATED each run by db-apply-scope.ts, gitignored
# (/ingest/.state/), never hand-edited. The auto-derived scope replaces the old
# hand-pinned scripts/db-rebuild.config.json (deleted in Brief 157).
DERIVED_CONFIG="ingest/.state/db-apply.derived.config.json"

print_help() {
  cat >&2 <<'EOF'
db-sync — NON-DESTRUCTIVE default apply. Re-apply the whole committed SSOT roster
+ every tail (per-book / podcast / audiobook / timeline / curation) into the live
DB, idempotently, WITHOUT ever truncating. This is the routine "push my changes" path.

Sequence (each step gates the next; a failure aborts before later steps run):
  1. db-apply-scope --emit-config         PREFLIGHT — derive + validate the apply scope (HALTS on a hole/stray)
  2. run-phase4-apply.sh <derived cfg>    re-apply the whole auto-derived committed roster (w40k 1..60 + hh 1..30)
  3. apply:book --all                     tail (additive) — apply per-book SSOT files (empty books/ = no-op)
  4. apply:podcast --all                  tail — restore the 4 committed podcast shows (before timeline)
  5. apply:audiobook-narrators            tail — restore the audio-role work_persons rows
  6. apply:audiobook-narrators --verify   confirm DB == sidecar-derived set, nonzero
  7. apply:timeline                       tail — restore eras/events/event_works + book-dates
  8. apply:timeline --verify              confirm era/event/event_works/book-date state == seed JSON
  9. apply:curation-overlay               tail — re-assert the maintainer's hand overrides; wins on primary_era_id
 10. apply:curation-overlay --verify      confirm every add present / suppression absent / field equal

NON-DESTRUCTIVE: never truncates. Safe to run repeatedly (idempotent). A mid-chain
failure never leaves a half-empty works domain — at worst a re-runnable mixed
state (early batches new, late batches old); just run it again to converge.

Usage:
  npm run db:sync
  bash scripts/db-sync.sh                  # direct (if the npm shell can't resolve bash)
  npm run db:sync -- --help

Disaster-recovery (truncate first, almost never needed): npm run db:rebuild -- --confirm
Read-only health check:                                  npm run db:drift
Preconditions + full runbook: scripts/runbooks/db-rebuild-runbook.md
EOF
}

for arg in "$@"; do
  case "$arg" in
    -h|--help) print_help; exit 0 ;;
    *) echo "[db-sync] unknown argument: $arg" >&2; print_help; exit 1 ;;
  esac
done

# --- fail-fast step runner --------------------------------------------------
# Run a labeled step; abort the whole sync on failure with a clear marker so a
# failed preflight/apply/tail step is never silently followed by later steps.
step() {
  local label="$1"; shift
  echo ""
  echo "==================================================================="
  echo "[db-sync] STEP: $label"
  echo "==================================================================="
  if ! "$@"; then
    echo "" >&2
    echo "[db-sync] FAILED at step: $label" >&2
    echo "[db-sync] aborting — later steps did NOT run. The chain is idempotent:" >&2
    echo "[db-sync] fix the cause and re-run \`npm run db:sync\` to converge." >&2
    exit 1
  fi
}

echo "[db-sync] starting non-destructive SSOT sync (no truncate)."

# 1. PREFLIGHT (read-only): derive the apply scope from the committed roster and
#    assert it is gap-free, BEFORE anything is written. A stray/misnamed override
#    file or a hole in a domain's 1..max run halts the run here.
step "1/10 preflight — derive + validate apply scope (db-apply-scope)" \
  npx tsx scripts/db-apply-scope.ts --emit-config "$DERIVED_CONFIG"

# 2. Re-apply the full crystallized override roster (auto-derived scope, both
#    domains). Idempotent; reproduces the data-complete + consolidated corpus.
step "2/10 re-apply full committed corpus (run-phase4-apply.sh)" \
  bash scripts/run-phase4-apply.sh "$DERIVED_CONFIG"

# 3. TAIL (additive, Brief 170 Teil A): apply every per-book SSOT file under
#    scripts/seed-data/books/*.json. Runs AFTER the Legacy corpus and BEFORE the
#    podcast/timeline/curation tails so per-book works exist when timeline
#    book-dates and curation edges resolve against works.id. apply:book seeds its
#    own reference/facet prolog and is idempotent; an EMPTY books/ folder is a
#    clean no-op (Teil A ships the folder empty), so this step stays invisible
#    until the first book is promoted via the per-book path.
step "3/10 apply per-book SSOT files (apply:book --all)" \
  npm run apply:book -- --all

# 4. TAIL: restore the committed podcast shows + episodes. Runs AFTER the corpus
#    (the works exist) and BEFORE timeline (step 7) because timeline event_works
#    hooks with role=podcast resolve against these podcast works.
step "4/10 restore podcast works (apply:podcast --all)" \
  npm run apply:podcast -- --all

# 5. TAIL: restore audiobook credits. The works exist now, so every sidecar book
#    resolves.
step "5/10 restore audiobook credits (apply:audiobook-narrators)" \
  npm run apply:audiobook-narrators

# 6. Verify the audio tail (read-only): DB audio-role set == sidecar-derived set, nonzero.
step "6/10 verify audiobook credits restored (apply:audiobook-narrators --verify)" \
  npm run apply:audiobook-narrators -- --verify

# 7. TAIL: restore the timeline domain. Runs AFTER the corpus + podcast re-apply
#    because every event_works hook + book-date resolves against works.id. Runs
#    BEFORE curation (step 9) so hand-curation wins last on primary_era_id.
step "7/10 restore timeline (apply:timeline)" \
  npm run apply:timeline

# 8. Verify the timeline tail (read-only): era/event/event_works/book-date state == seed JSON.
step "8/10 verify timeline restored (apply:timeline --verify)" \
  npm run apply:timeline -- --verify

# 9. TAIL: re-assert the maintainer's hand overrides. Runs LAST so the auto-edges
#    it suppresses exist to delete, its add-edges win over the wave, and its
#    primary_era_id field-fix wins over the step-7 timeline remap.
step "9/10 apply hand-override overlay (apply:curation-overlay)" \
  npm run apply:curation-overlay

# 10. Verify the curation tail (read-only): every final add present, every suppression absent.
step "10/10 verify hand overrides applied (apply:curation-overlay --verify)" \
  npm run apply:curation-overlay -- --verify

echo ""
echo "[db-sync] DONE — committed SSOT synced into the live DB (corpus + per-book + podcast + audiobook + timeline + hand overrides), no truncate."
exit 0
