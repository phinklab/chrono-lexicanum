---
session: 2026-05-22-091
role: implementer
date: 2026-05-22
status: complete
slug: resolver-phase4-split
parent: 2026-05-22-091
links:
  - 2026-05-16-076-arch-resolver-batch-4-axis-sliced
  - 2026-05-21-090-arch-resolver-pass-lean
commits:
  - c2fbfac
  - 5e49a08
---

# Resolver-Pass — Phase-4-Split (4a/4b) + range-aware forward-ref guard

## Summary

Resolver-Pass Phase 4 is now two `/clear`-separated subphases — **4a Integration/Apply** (mutation half) + **4b Verify/Report** (read-only half) — handed off via a self-contained 4a status file, and the `apply-override-dry.ts` forward-ref guard is now **range-aware** (accepts in-range cross-batch refs, throws on an out-of-range / unknown constituent). Pure machinery, no DB writes this session; whole acceptance suite green, and the new guard is vacuously satisfied on the current `001..035` roster (`forward refs=10, unresolvable=0`).

## What I did

- `scripts/resolver-pass.config.json` — replaced the single `phase-4-integration` `phases[]` entry with `phase-4a-integration` + `phase-4b-verify-report`. 4a gets the apply-side scope (seed/trias/override-globs/`run-phase4-apply.sh`) **plus two paths the old un-split scope never carried**: the new `scripts/apply-override-collections.ts` and the committed apply-digest `ingest/.last-run/phase4-digest.md` (4a writes + commits it; without it the driver's diff-subset halt-check would exit 2 on 4a's commit). 4b gets `verify-pass.ts` + the impl-report. 4a `statusFile` = the new `resolver-pass-6-phase-4a-report.md`; 4b `statusFile` = the impl-report (so the driver's `## Needs decision` check covers 4b). Per-pass values (`pass`/`wave`/`aggregator`/`verify`, `-6-` paths) untouched.
- `sessions/resolver-pass-runbook.md` — 5→6 phases everywhere: §0 sequence, §1 "sechsmal" + "(Phase 4a wendet sie an)", §3 heading + the `### Phase 4` block split into `### Phase 4a` / `### Phase 4b` (each with its own "Lies NUR" + Achs-Paket + Tun), §5 ordering (4a after 1–3, 4b strictly after 4a, 4b last), §7 digest discipline (4a writes+commits the apply-digest; 4b reads it and runs `verify-pass.ts` itself to emit the verify-digest to stdout), §9 commit rule, §10 verification (trias for 1–3/4a incl. `test:collection-refs`; 4b = verify-pass.ts + lint + typecheck, no trias re-run). Swept the two umbrella leftovers ("Phase-4a/4b-Kontext", "was Phase 4a ohnehin tut").
- `scripts/run-resolver-pass.sh` — **comment-only** header sweep (five→six subsessions, Integration/Apply (4a) → Verify/Report (4b)). No logic change — verified the generic phase loop tolerates 6 entries and `phase-0-*` does not match `phase-4a/4b` (see Verification).
- `scripts/apply-override-collections.ts` — **new** pure module (mirrors `apply-override-synopsis-lint.ts`): moved `RosterFile`/`RosterCollection` + `analyzeCollections` out of the dry-runner and extended the return with `unresolvableConstituentRefs: { collection, reason: "out-of-range" | "unknown-work" }[]`.
- `scripts/apply-override-dry.ts` — import from the new module, deleted the local copies, added an info line printing the unresolvable count, and rewrote the `if (!fixtureMode)` guard from report-only to range-aware (`assert.deepEqual(unresolvable.map(...), [], …)` — throws iff an applied collection has a constituent outside the applied range or absent from the roster; legit in-range forward refs stay accepted + printed).
- `scripts/test-apply-override-collections.ts` — **new** unit test (mirrors `test-synopsis-lint.ts`): 7 cases covering both guard branches (legit in-range forward ref → not flagged; out-of-range → reason `out-of-range`; unknown → reason `unknown-work`) plus same-batch / backward-ref / collection-not-applied / mixed edges.
- `package.json` — added `"test:collection-refs": "tsx scripts/test-apply-override-collections.ts"`.

## Decisions I made

- **Driver: comment-only, no logic patch.** The brief said verify-don't-patch unless a real incompatibility appears. None did: the phase loop is `while INDEX < PHASE_COUNT` (corpus-/count-agnostic), the halt-checks (worktree-clean / HEAD-moved / diff⊆scope / JSON-valid / `## Needs decision`) are phase-agnostic, and the only name-special branch is `phase-0-*` for the dossier-inject, which `phase-4a-*`/`phase-4b-*` correctly do not match. So both new phases get the dossier injected (harmless for 4b — its core inputs are the 4a status file + the apply-digest). Touched only the header comment.
- **The "verify-digest" is stdout, not a committed file.** `verify-pass.ts` `console.log`s its digest and exits — it writes nothing to disk. So 4b's scope carries **no** verify-digest path; the config/runbook frame it as "4b runs `verify-pass.ts`, which emits the verify-digest to stdout", and the only committed digest handed 4a→4b is the apply-digest. This avoids inventing a phantom output path that would never appear in a diff.
- **No `collection-gaps.json` exemption needed.** The new guard is vacuously green on the current `001..035` roster — every W40K collection edge has both endpoints inside W40K-0001..0350 (no edge crosses the applied-range boundary), and the two deferred gaps (W40K-0286 has no edges; W40K-0307's only edge `0279→0307` is in-range) are *absent* edges the guard never sees. Confirmed by `test:apply-override-dry` staying green at `unresolvable=0`.
- **Guard checks the constituent side only.** That is the direction Pass 6 exercised; the collection (anthology) side is in-range by construction because the filter requires `appliedIds.has(collectionExternalId)`. A backward ref (collection in a later batch than an already-applied content book) is resolved by the same ascending sweep and is correctly not flagged (unit-tested).

## Answers to the brief's open questions

- **Does "every phase must produce a commit" sit cleanly with 4b?** Yes. 4b always has a real commit — the impl-report (and the brief status flip lives in the parent brief, in 4b's `statusFile`/scope set conceptually, though in this combined session the flip is in Commit C). HEAD moves; the diff (impl-report, optionally `verify-pass.ts`) is a subset of 4b's scope. No driver change needed.
- **Should 4b re-run the full trias, or is `verify-pass.ts` + lint + typecheck enough?** The minimal-but-safe set is **`verify-pass.ts` + `lint` + `typecheck`, no trias re-run.** Rationale: 4a already greened the trias on the actual code edits (it owns every apply-side script); 4b writes only markdown (the impl-report) and reads digests, so a trias re-run would re-test unchanged code. Encoded in runbook §10.
- **Separate 4a status file vs. dossier append?** **Separate** `resolver-pass-6-phase-4a-report.md`, as the brief recommended — consistent with the phase-1–3 per-phase reports and required for the driver's `statusFile` / `## Needs decision` halt-check to target 4a specifically. A dossier append would not give the driver a per-phase status file to watch.

## Verification

All run in the coordination worktree `C:\Users\Phil\chrono-lexicanum` via Git Bash; no `.env.local` needed (the whole acceptance suite is DB-free).

- `npm run test:resolver` — **206 passed, 0 failed**
- `npm run test:resolver-data` — `resolver data integrity ok`
- `npm run test:resolver-coverage` — ok (below-threshold rows are data findings, not failures)
- `npm run test:apply-override-dry` — `forward collection refs: 10`, `unresolvable constituent refs: 0`, `[apply-override-dry] ok`
- `npm run test:collection-refs` — **# pass 7 / # fail 0** (both guard branches + edges)
- `npm run lint` — 0 errors (1 pre-existing `no-page-custom-font` warning, unrelated)
- `npm run typecheck` — clean
- `npm run brain:lint -- --no-write` — 0 blocking (14 warnings, pre-existing)
- `bash -n scripts/run-resolver-pass.sh` — OK; `phases.length === 6`; `phase-0-*` glob matches only `phase-0-preflight` (4a/4b get the dossier)

Not run this session (no DB, by design): `run-phase4-apply.sh`, `verify-pass.ts`. The apply-digest `ingest/.last-run/phase4-digest.md` is therefore unchanged — its addition to 4a's scope is forward provisioning for the next real Phase-4a run.

## Open issues / blockers

None. No `## Needs decision`.

## For next session

- **README reconciliation (Cowork, post-merge).** `sessions/README.md` "Active threads" still shows Brief 091 as `architect | open · Wartet auf Claude Code`; the brief frontmatter is now `implemented`. Post-merge, flip that row to implemented and add an impl-report row (precedent: how the 090 arch/impl rows were curated). Left to Cowork to stay consistent with how that narrative table is maintained.
- **Pass-7 config re-keying** (out of scope here): once the SSOT loop crystallizes `ssot-w40k-036..045`, bump `pass`/`wave`/`applyRange`/`verify` ranges and the `-6-` dossier/report paths to `-7-`. Only per-pass values change; the new 6-phase `phases[]` structure stays.
- **Two deferred collection-gaps** (Architect of Fate W40K-0286, War for Armageddon Omnibus W40K-0307) belong to OQ (14) Roster-Excel-Hygiene-Sweep — roster/Excel-SSOT edits, not resolver-machinery. The range-aware guard will start *throwing* on these only if a future wave applies the omnibus while its constituent stays out of range; today they are absent edges.
- **Phase-3 `characters.json` axis-slicing** remains the next known growth edge (Brief 090 § For next session) — untouched here.

## References

- Brief 091 `sessions/2026-05-22-091-arch-resolver-phase4-split.md` (this brief).
- Brief 076 (axis-sliced design) + Brief 090 (lean / token-budget rationale).
- `scripts/apply-override.ts` `applyCollections` — the ascending cumulative sweep that makes in-range forward refs legitimate.
- Pattern mirrors: `scripts/apply-override-synopsis-lint.ts` + `scripts/test-synopsis-lint.ts`.
