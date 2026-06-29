#!/usr/bin/env bash
# db-sync.sh — NON-DESTRUCTIVE default apply (Brief 157, rewired per-book Brief 171).
# THE routine way to push committed SSOT changes into the live DB.
#
# This is `db:rebuild` MINUS the truncate. It re-applies the WHOLE per-book corpus
# + every tail (podcast / audiobook / timeline / curation) idempotently, in the
# one order that resolves, and NEVER truncates. Safe to run any number of times —
# two runs reach the same end state.
#
# Brief 171: the corpus now lives ONLY in scripts/seed-data/books/*.json. The
# primary corpus step is `apply:book --all` (it runs its own non-destructive
# reference/facet seed prolog first, then applies every per-book file). The Legacy
# batch corpus step (run-phase4-apply.sh looping db:apply-override over the roster)
# is RETIRED — the batch files are frozen provenance, not a live source.
#
# The chain is the existing building blocks, chained; it reimplements none of them:
#
#   1. book-corpus-preflight.ts            PREFLIGHT (read-only, DB-free) — assert
#                                          every books/*.json parses, slug+id are
#                                          unique (folder-only), collects[] resolve,
#                                          and the prolog seed catalogs are present.
#                                          HALTS LOUDLY here (before any write) on a
#                                          stray/dup/bad-id/unresolvable member.
#   2. apply:book --all                    PRIMARY corpus step — seed the reference/
#                                          facet prolog, then apply every per-book
#                                          SSOT file (works/book_details/junctions/
#                                          persons/collections), idempotent delete-
#                                          then-insert per junction. An EMPTY books/
#                                          folder is a clean no-op.
#   3. apply:podcast --all                 TAIL — restore the committed podcast shows
#                                          + episodes. Runs AFTER the corpus and
#                                          BEFORE timeline: timeline event_works
#                                          hooks resolve against the podcast works.
#   4. apply:audiobook-narrators           TAIL — restore narrator|co_narrator|
#                                          full_cast work_persons (works exist now).
#   5. apply:audiobook-narrators --verify  Read-only post-condition (exact sidecar set).
#   6. apply:timeline                      TAIL — restore eras/events/event_works +
#                                          book-dates (every hook + book-date
#                                          resolves against works.id, incl. podcasts).
#   7. apply:timeline --verify             Read-only post-condition (exact seed set).
#   8. apply:curation-overlay              TAIL — re-assert the maintainer's hand
#                                          overrides. Runs LAST so its edges win and
#                                          its primary_era_id field-fix beats the
#                                          timeline remap.
#   9. apply:curation-overlay --verify     Read-only post-condition (every add/suppress/field).
#
# NON-DESTRUCTIVE — never truncates, so the DB serves continuously and there is no
# half-empty `works` window. What it does NOT guarantee: that a failure MID-CHAIN
# leaves an exactly-consistent state. If step 2 fails partway, some books may
# already be re-applied and others still old. That is SAFE because the whole chain
# is idempotent and re-runnable — run it again and it converges to the clean end
# state — but it is not "previously-served data stays exactly consistent."
#
# Fail-fast: a failed step aborts before later steps run (honest non-zero exit).
# Idempotent + re-runnable: two runs reach the same end state. Default is the FULL
# corpus re-apply — there is no targeted / --only mode (Brief 157, by design).
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

print_help() {
  cat >&2 <<'EOF'
db-sync — NON-DESTRUCTIVE default apply. Re-apply the whole per-book SSOT corpus
+ every tail (podcast / audiobook / timeline / curation) into the live DB,
idempotently, WITHOUT ever truncating. This is the routine "push my changes" path.

Sequence (each step gates the next; a failure aborts before later steps run):
  1. book-corpus-preflight                DB-free preflight — parse/unique/collects/prolog (HALTS on a problem)
  2. apply:book --all                     PRIMARY corpus step — prolog + every per-book file (empty books/ = no-op)
  3. apply:podcast --all                  tail — restore the committed podcast shows (before timeline)
  4. apply:audiobook-narrators            tail — restore the audio-role work_persons rows
  5. apply:audiobook-narrators --verify   confirm DB == sidecar-derived set, nonzero
  6. apply:timeline                       tail — restore eras/events/event_works + book-dates
  7. apply:timeline --verify              confirm era/event/event_works/book-date state == seed JSON
  8. apply:curation-overlay               tail — re-assert the maintainer's hand overrides; wins on primary_era_id
  9. apply:curation-overlay --verify      confirm every add present / suppression absent / field equal

NON-DESTRUCTIVE: never truncates. Safe to run repeatedly (idempotent). A mid-chain
failure never leaves a half-empty works domain — at worst a re-runnable mixed
state; just run it again to converge.

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

# 1. PREFLIGHT (read-only, DB-free): assert the per-book corpus is parse-clean,
#    slug/id-unique (folder-only), collects-resolvable, and the prolog catalogs
#    are present, BEFORE anything is written. A stray/dup/bad-id/unresolvable
#    member halts the run here. (Replaces the Brief-157 batch-contiguity preflight
#    — there are no batches anymore.)
step "1/9 preflight — validate per-book corpus (book-corpus-preflight)" \
  npx tsx scripts/book-corpus-preflight.ts

# 2. PRIMARY corpus step (Brief 171): apply every per-book SSOT file under
#    scripts/seed-data/books/*.json. apply:book seeds its own non-destructive
#    reference/facet prolog first, then writes works/book_details/junctions/
#    persons/collections idempotently. Runs in post-retirement mode (folder-only;
#    the frozen Legacy roster is out of scope). An EMPTY books/ folder is a clean
#    no-op. This REPLACES the retired run-phase4-apply.sh batch corpus step.
step "2/9 apply per-book corpus (apply:book --all)" \
  npm run apply:book -- --all --mode post-retirement

# 3. TAIL: restore the committed podcast shows + episodes. Runs AFTER the corpus
#    (the works exist) and BEFORE timeline (step 6) because timeline event_works
#    hooks with role=podcast resolve against these podcast works.
step "3/9 restore podcast works (apply:podcast --all)" \
  npm run apply:podcast -- --all

# 4. TAIL: restore audiobook credits. The works exist now, so every sidecar book
#    resolves.
step "4/9 restore audiobook credits (apply:audiobook-narrators)" \
  npm run apply:audiobook-narrators

# 5. Verify the audio tail (read-only): DB audio-role set == sidecar-derived set, nonzero.
step "5/9 verify audiobook credits restored (apply:audiobook-narrators --verify)" \
  npm run apply:audiobook-narrators -- --verify

# 6. TAIL: restore the timeline domain. Runs AFTER the corpus + podcast re-apply
#    because every event_works hook + book-date resolves against works.id. Runs
#    BEFORE curation (step 8) so hand-curation wins last on primary_era_id.
step "6/9 restore timeline (apply:timeline)" \
  npm run apply:timeline

# 7. Verify the timeline tail (read-only): era/event/event_works/book-date state == seed JSON.
step "7/9 verify timeline restored (apply:timeline --verify)" \
  npm run apply:timeline -- --verify

# 8. TAIL: re-assert the maintainer's hand overrides. Runs LAST so the auto-edges
#    it suppresses exist to delete, its add-edges win over the corpus, and its
#    primary_era_id field-fix wins over the step-6 timeline remap.
step "8/9 apply hand-override overlay (apply:curation-overlay)" \
  npm run apply:curation-overlay

# 9. Verify the curation tail (read-only): every final add present, every suppression absent.
step "9/9 verify hand overrides applied (apply:curation-overlay --verify)" \
  npm run apply:curation-overlay -- --verify

echo ""
echo "[db-sync] DONE — committed SSOT synced into the live DB (per-book corpus + podcast + audiobook + timeline + hand overrides), no truncate."
exit 0
