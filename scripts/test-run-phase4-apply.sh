#!/usr/bin/env bash
# test-run-phase4-apply.sh — hermetic test for scripts/run-phase4-apply.sh.
#
# Proves the Brief-090 Phase-4a apply digest script (a) keeps the SUCCESS path
# byte-identical to the last-merged (origin/main) version and (b) now surfaces
# seed/apply failures via `exit 1` while still writing the full digest through
# DONE, with per-step FAILED markers left in place.
#
# Hermetic: each scenario runs the script in a throwaway `mktemp -d` sandbox with
# PATH-shimmed `npm`/`npx` (no Supabase, no real tsx). Real `node` runs the inline
# config parse. The script's own `cd "$(dirname "$0")/.."` lands it in the
# sandbox, so the digest is written there — the real repo is never touched. The
# config is passed as a RELATIVE path so the `$CONFIG` echoed into the digest
# header is stable across runs, which makes the byte-identical diff meaningful.
#
# USAGE
#   bash scripts/test-run-phase4-apply.sh        # run all scenarios
#
# Exit 0 = all assertions passed; exit 1 = at least one failed. (Running this
# against the *un-hardened* script is expected to FAIL scenarios 2/3/5 — that is
# the swallowing bug this change fixes.)
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_UNDER_TEST="$REPO/scripts/run-phase4-apply.sh"

# tiny fixture: applyRange 001..003, new wave = 002 + 003
FIXTURE_JSON='{"aggregator":{"applyRange":{"domain":"w40k","from":1,"to":3},"batches":["ssot-w40k-002","ssot-w40k-003"]}}'

FAILS=0
pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }

# --- shims ------------------------------------------------------------------

write_shims() {
  local bindir="$1"
  cat > "$bindir/npm" <<'NPMEOF'
#!/usr/bin/env bash
# fake npm: handles `npm run db:seed-resolver-extensions` and
# `npm run db:apply-override -- --batch=<id>`. Exit codes are env-controlled.
sub=""
for a in "$@"; do case "$a" in db:*) sub="$a"; break;; esac; done
case "$sub" in
  db:seed-resolver-extensions)
    echo "[seed-resolver-extensions] done. total: +0 new, 0 existing (test shim)"
    exit "${SHIM_SEED_RESOLVER_EXIT:-0}"
    ;;
  db:apply-override)
    batch=""
    for a in "$@"; do case "$a" in --batch=*) batch="${a#--batch=}";; esac; done
    echo "[apply-override] batch=$batch (test shim)"
    echo "[apply-override] done. inserts=0 updates=0 total=0"
    if [[ -n "${SHIM_FAIL_BATCH:-}" && "$batch" == "${SHIM_FAIL_BATCH:-}" ]]; then
      echo "[apply-override] failed: simulated batch failure" >&2
      exit "${SHIM_FAIL_BATCH_EXIT:-1}"
    fi
    exit 0
    ;;
  *)
    echo "fake npm: unhandled invocation: $*" >&2
    exit 90
    ;;
esac
NPMEOF
  cat > "$bindir/npx" <<'NPXEOF'
#!/usr/bin/env bash
# fake npx: dispatches on the *.ts argument (seed-facets.ts / db-counts.ts).
ts=""
for a in "$@"; do case "$a" in *.ts) ts="$a";; esac; done
case "$(basename "$ts")" in
  seed-facets.ts)
    if [[ "${SHIM_SEED_FACETS_SILENT:-0}" == "1" ]]; then
      # exit 0 but emit NO [seed-facets] line: the script's grep then exits 1,
      # which must NOT be mistaken for a seed-facets failure.
      echo "seed-facets: nothing to promote (test shim, no marker line)"
    else
      echo "[seed-facets] catalog values: 3; newly inserted (ON CONFLICT DO NOTHING): 0"
    fi
    exit "${SHIM_SEED_FACETS_EXIT:-0}"
    ;;
  db-counts.ts)
    echo "[db-counts] start"
    echo "works                0"
    echo "[db-counts] done"
    exit "${SHIM_DBCOUNTS_EXIT:-0}"
    ;;
  *)
    echo "fake npx: unhandled .ts arg: '$ts' (args: $*)" >&2
    exit 91
    ;;
esac
NPXEOF
  chmod +x "$bindir/npm" "$bindir/npx"
}

# --- case runner ------------------------------------------------------------
# run_case <label> <script-path> [VAR=val ...]
# sets globals: CASE_EC, CASE_DIGEST, CASE_T
run_case() {
  local label="$1" script="$2"; shift 2
  local T; T="$(mktemp -d)"
  mkdir -p "$T/scripts" "$T/bin"
  cp "$script" "$T/scripts/run-phase4-apply.sh"
  printf '%s\n' "$FIXTURE_JSON" > "$T/fixture.config.json"
  write_shims "$T/bin"
  # relative config path → stable $CONFIG in the digest header (the script cd's
  # into the sandbox first), so the success byte-diff compares only real changes.
  env PATH="$T/bin:$PATH" "$@" bash "$T/scripts/run-phase4-apply.sh" "fixture.config.json" \
    > "$T/out" 2> "$T/err"
  CASE_EC=$?
  CASE_T="$T"
  CASE_DIGEST="$T/ingest/.last-run/phase4-digest.md"
}

# assertion helpers (operate on $CASE_DIGEST / $CASE_T / $CASE_EC)
dhas()   { if grep -qF -- "$1" "$CASE_DIGEST"; then pass "$2"; else fail "$2 — digest missing: $1"; fi; }
dlacks() { if grep -qF -- "$1" "$CASE_DIGEST"; then fail "$2 — digest unexpectedly has: $1"; else pass "$2"; fi; }
ehas()   { if grep -qF -- "$1" "$CASE_T/err"; then pass "$2"; else fail "$2 — stderr missing: $1"; fi; }
ec_is()  { if [[ "$CASE_EC" -eq "$1" ]]; then pass "$2 (exit $CASE_EC)"; else fail "$2 — expected exit $1, got $CASE_EC"; fi; }

echo "== run-phase4-apply.sh hardening test =="
echo "script under test: $SCRIPT_UNDER_TEST"

# --- Scenario 1: all-ok (success path unchanged) ----------------------------
echo ""
echo "[1] all-ok -> exit 0, full digest through DONE, no FAILED"
run_case "all-ok" "$SCRIPT_UNDER_TEST"
ec_is 0 "exits 0"
dhas 'DONE' "digest ends with DONE"
dhas 'seed-resolver-extensions: ok' "seed-resolver ok note"
dhas '[seed-facets]' "seed-facets marker line present"
dhas 'applied `ssot-w40k-001`: ok' "batch 001 applied ok"
dhas 'applied `ssot-w40k-002`: ok' "batch 002 applied ok"
dhas 'applied `ssot-w40k-003`: ok' "batch 003 applied ok"
dhas '### POST-BATCH counts — ssot-w40k-002' "post-batch snapshot for wave batch 002"
dhas '### POST-BATCH counts — ssot-w40k-003' "post-batch snapshot for wave batch 003"
dlacks 'POST-BATCH counts — ssot-w40k-001' "no post-batch snapshot for non-wave batch 001"
dlacks 'FAILED' "no FAILED marker anywhere"
WT_DIGEST="$CASE_DIGEST"; WT_T="$CASE_T"

# byte-identical success digest vs the last-merged (origin/main) version.
if git -C "$REPO" cat-file -e "origin/main:scripts/run-phase4-apply.sh" 2>/dev/null; then
  base="$(mktemp)"
  git -C "$REPO" show "origin/main:scripts/run-phase4-apply.sh" > "$base"
  run_case "all-ok baseline" "$base"
  if diff -u "$CASE_DIGEST" "$WT_DIGEST" > /dev/null; then
    pass "success digest byte-identical to origin/main baseline"
  else
    fail "success digest differs from origin/main baseline"
    diff -u "$CASE_DIGEST" "$WT_DIGEST" | sed -n '1,40p'
  fi
  rm -rf "$CASE_T"; rm -f "$base"
else
  printf '  SKIP  origin/main baseline unavailable — byte-identical check skipped\n'
fi
rm -rf "$WT_T"

# --- Scenario 2: seed-resolver-extensions fails -----------------------------
echo ""
echo "[2] seed-resolver fails -> exit 1, FAILED note, digest still completes"
run_case "seed-resolver-fail" "$SCRIPT_UNDER_TEST" SHIM_SEED_RESOLVER_EXIT=1
ec_is 1 "exits 1"
dhas 'seed-resolver-extensions: FAILED' "seed-resolver FAILED note"
dhas 'DONE' "digest still ends with DONE"
dhas 'applied `ssot-w40k-001`: ok' "batches still applied (001)"
dhas 'applied `ssot-w40k-003`: ok' "batches still applied (003)"
ehas 'one or more steps FAILED' "stderr carries the final FAILED line"
rm -rf "$CASE_T"

# --- Scenario 3: seed-facets exits 1 ----------------------------------------
echo ""
echo "[3] seed-facets exits 1 -> exit 1, FAILED note (keys on tsx exit, not grep)"
run_case "seed-facets-fail" "$SCRIPT_UNDER_TEST" SHIM_SEED_FACETS_EXIT=1
ec_is 1 "exits 1"
dhas 'seed-facets: FAILED' "seed-facets FAILED note"
dhas 'DONE' "digest still ends with DONE"
rm -rf "$CASE_T"

# --- Scenario 4: seed-facets exits 0 but prints no marker (grep empty) -------
echo ""
echo "[4] seed-facets ok but silent -> exit 0 (grep exit-1 is NOT a failure)"
run_case "seed-facets-silent" "$SCRIPT_UNDER_TEST" SHIM_SEED_FACETS_SILENT=1
ec_is 0 "exits 0 despite empty grep"
dlacks 'seed-facets: FAILED' "no false seed-facets FAILED note"
dhas 'DONE' "digest ends with DONE"
rm -rf "$CASE_T"

# --- Scenario 5: a middle apply batch fails ---------------------------------
echo ""
echo "[5] middle batch fails -> exit 1, loop continues past it"
run_case "apply-batch-fail" "$SCRIPT_UNDER_TEST" SHIM_FAIL_BATCH=ssot-w40k-002
ec_is 1 "exits 1"
dhas 'applied `ssot-w40k-002`: FAILED' "failing batch 002 marked FAILED"
dhas 'applied `ssot-w40k-001`: ok' "earlier batch 001 still ok"
dhas 'applied `ssot-w40k-003`: ok' "later batch 003 still ok (loop continued)"
dhas 'DONE' "digest still ends with DONE"
rm -rf "$CASE_T"

# --- summary ----------------------------------------------------------------
echo ""
if [[ "$FAILS" -eq 0 ]]; then
  echo "ALL SCENARIOS PASSED"
  exit 0
else
  echo "FAILURES: $FAILS"
  exit 1
fi
