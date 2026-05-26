---
pass: 10
role: implementer
date: 2026-05-26
status: needs-decision
wave: ssot-hh-001..002
ids: HH-0001..HH-0020
branch: codex/ingest-batches-resolver-trial-hh
runbook: sessions/resolver-pass-runbook.md
config: scripts/resolver-pass.config.json
dossier: sessions/resolver-dossiers/resolver-pass-10-dossier.md
commits:
  - 31bf8bb  # Phase 0 (Preflight/Dossier)
  - 339e156  # Phase 1 (Factions)
  - 9fd077a  # Phase 2 (Locations)
  - a308a26  # Phase 3 (Characters)
  - 0a2e2c1  # Phase 4a (Integration/Apply) — ## Needs decision halt
  # Phase 4b (Verify/Report) is the commit carrying this report.
---

# Resolver-Pass 10 — impl report (ssot-hh-001..002 / HH-0001..HH-0020)

## Summary

**Pass-10 is the first Horus-Heresy resolver-pass wave** (the HH-domain
bootstrap, 20 books HH-0001..HH-0020). Brief 100 two-domain Resolver-Loop +
Cross-Era-Identitäten rules apply: HH surface-forms either Alias onto the
existing W40K Canonical-Row (`Luna Wolves` → `sons_of_horus`, `Kharn` →
`kharn_the_betrayer`, `Magnus` → `magnus_the_red`, …) or open a fresh HH-only
Canonical-Row (`horus`, `garviel_loken`, `nathaniel_garro`, …). Phases 0–3
landed cleanly with their per-phase reports; the JSON reference layer grew by
+6 factions / +10 locations / +60 characters and +4 / +1 / +4 aliases.

**Phase 4a halted on `## Needs decision`** — exactly the misfire the
dossier §7d named as the Phase-4a stop trigger. The Brief-091 range-aware
forward-ref Guard in `scripts/apply-override-dry.ts` hard-fails on the three
HH anthologies' out-of-range constituents (20 unresolvable-constituent-refs:
HH-0020 → HH-0117..HH-0120, HH-0010 → HH-0150..HH-0156, HH-0016 →
HH-0157..HH-0165). The classifier correctly emits `reason: "out-of-range"`
for all 20 (the constituents *are* in `book-roster.json`, just outside the
wave's `applyRange`), but the downstream integration assertion conflates
`out-of-range` with `unknown-work` and aborts the dry. For a sealed domain
(W40K post-Pass-9) the conflation is harmless; for an in-progress domain
(HH mid-bootstrap) it makes every anthology-with-deferred-constituents a hard
fail. **No DB apply was attempted**; the architectural fix is the architect's
call (three options in the §Needs decision block below).

Phase 4b ran the **read-only** half regardless: `verify-pass.ts --config …`
emits a digest confirming the DB is exactly where Pass-9 sealed it (HH-range
`total_works=0`, smoke slugs `tales-of-heresy` / `the-primarchs` not yet
present); `lint` + `typecheck` clean. Phase 4b polishes this impl-report
from the 4a status file + the (stale, Consolidation-Pass-1 era) committed
Apply-Digest + the Verify-Digest — **without re-deriving state**, per
runbook §3 Phase 4b.

**Headline:** the apply for HH-0001..HH-0020 is **blocked** until the
architect picks a resolution path for the Brief-091 Guard misfire. The
HH-domain bootstrap milestone (works `565 → 585`) is deferred to the
re-run of Phase 4a after the fix lands. Phases 0–3 are landed and stable;
the JSON-side row + alias additions will be picked up by
`seed-resolver-extensions.ts` on next 4a run with no extra phase work.

## What I did

The pass is a 6-phase sequence; Phases 0–3 landed in their own commits
(above) with full per-phase reports. Phase 4a stopped on `## Needs
decision` (one commit carrying the trias batch-range extensions + the
4a status file). Phase 4b is **read-only** — it ran
`scripts/verify-pass.ts --config …` (stdout digest), `lint`, `typecheck`,
and polished this report from the 4a status file + the committed Apply-
Digest + the Verify-Digest. No second DB apply, no trias re-run.

### Per-phase recap (detail in the phase reports)

- **Phase 0 — Preflight/Dossier:** `scripts/aggregate-surface-forms.ts
  --config …` produced 6 of the 7 dossier sections deterministically for
  the 20-book HH bootstrap; the 7th (needs-decision / cross-batch alias
  candidates, incl. the §7d Brief-091 Guard concern) was synthesized
  from tail-reads of the wave's loop-log blocks. No override files read
  in-context.
- **Phase 1 — Factions (+6 rows / +4 aliases / +6 specialCases):**
  HH-domain bootstrap promotions. The cross-era anchors land per the
  runbook §4 *Cross-Era-Identitäten* rules — HH surface-forms either
  Alias onto the existing W40K Canonical-Row or open a fresh HH-only
  row when no W40K pendant exists. ≥5 new resolver-test cases.
  Idempotency confirmed (every Pre-pass row that already covered an
  HH surface-form via alias was left untouched).
- **Phase 2 — Locations (+10 rows / +1 alias):** Sector / world /
  sub-location granularity for the HH bootstrap. Vessel-/Space-Hulk
  locations follow the `tags:['vessel'], gx/gy:null` convention so the
  galaxy map doesn't try to draw them. ≥4 new resolver-test cases.
  Idempotency confirmed.
- **Phase 3 — Characters (+60 rows / +4 aliases):** the HH bootstrap's
  large dramatis personae — Primarchs (with cross-era alias-routing
  where a W40K Honor-Title row exists, fresh rows for Primarchs without
  a W40K pendant), Mournival, Legion command staff, the Remembrancer
  order, the Sigillites of Terra, the Knights-Errant cluster. ≥5
  new resolver-test cases, ≥2 of them for cross-era / cross-batch alias-
  consolidation. `primaryFactionId` of new rows points at the Phase-1
  faction set (FK-clean, runbook §5: Phase 1 strictly before Phase 3).

### Phase 4a — Integration / Apply (halted)

- **Trias batch-range extension — Brief 100 Domain-+-N-Append:** the two
  new HH tuples `{domain:"hh", n:"001"}` + `{domain:"hh", n:"002"}`
  appended to `BATCHES` in `scripts/apply-override-dry.ts`,
  `scripts/test-resolver-coverage.ts`, `scripts/test-resolver-data-integrity.ts`.
  Header / smoke-slug-coverage labels updated to match the new mixed-domain
  shape (`ssot-w40k-001..057 + ssot-hh-001..002`). `EXPECTED_RANGES`
  untouched (no run reached the post-apply assertion).
- **Scripts intentionally not touched** (Pass-7/8/9 precedent):
  `scripts/seed-resolver-extensions.ts` (fully generic JSON-loader since
  Brief 077 — picks up the Phase 1/2/3 row additions automatically on
  next 4a run); `scripts/apply-override-collections.ts` (pure helper,
  no hardcoded range per Brief 091); `scripts/db-counts.ts`,
  `scripts/seed-facets.ts`, `scripts/run-phase4-apply.sh` (stable
  apply-side tooling). `ingest/.last-run/phase4-digest.md` not
  regenerated — running an apply against a red dry would produce a
  misleading half-success digest. `scripts/seed-data/collection-gaps.json`
  not touched — the HH anthology forward-refs are an apply-side Guard
  concern, not a roster maintenance concern (the constituents *are* in
  the roster, just outside the wave's apply range; adding a
  `needs_constituent_collection_edges` entry would not suppress the
  assertion). `scripts/seed-data/persons.json` unchanged at 96 rows
  (no apply ran, so no `ensurePersonsExist` side-output materialised).
  The two `manual-overrides-ssot-hh-00{1,2}.json` files untouched (zero
  unknown-facetIds verified: union of 46 distinct facetIds across both
  override files against `facet-catalog.json` = 0 stripping needed).
- **Apply-side trias state at the halt:**
  - `test:resolver` 315/0 ✓ (no resolver-test churn from 4a — that's
    Phases 1–3's scope; the Phase 1/2/3 new-block cases all green)
  - `test:resolver-data` ✓ (10 integrity checks; smoke-slug label
    updated to `w40k-001..057 + hh-001..002`)
  - `test:resolver-coverage` ✓ (exit 0; totals factions=1981/2319,
    locations=776/1027, characters=1329/1736 against the wider
    cumulative range now contributing HH-001..002)
  - `test:collection-refs` 7/0 ✓ (Brief-091 helper-unit suite — the
    `analyzeCollections` classifier correctly emits both `reason:
    "out-of-range"` and `reason: "unknown-work"`; only the integration
    assertion in `apply-override-dry.ts` conflates them)
  - **`test:apply-override-dry` FAILED** — assertion
    `unresolvableConstituentRefs deepEqual []` reported 20 out-of-range
    refs (HH-0020 → HH-0117..HH-0120, HH-0010 → HH-0150..HH-0156,
    HH-0016 → HH-0157..HH-0165). All 20 constituents present in
    `book-roster.json` (verified `present: 20/20`), so the classifier
    correctly labels them `reason: "out-of-range"`.
- **No DB apply** — `scripts/run-phase4-apply.sh` was not invoked
  (running against a red dry would mask the architectural issue).

### Phase 4b — Verify / Report (read-only)

- `scripts/verify-pass.ts --config scripts/resolver-pass.config.json`
  ran read-only against the live Supabase; stdout (Verify-Digest) below
  in §Verification.
- `npm run lint` + `npm run typecheck` ran clean.
- This impl-report assembled from the 4a status file + the committed
  Apply-Digest + the Verify-Digest stdout — no state re-derivation.

## Counts (Pflicht-Tabelle)

The apply did not run, so this table has only a Pre-Apply row and an
unchanged Post row. The DB is exactly where Pass-9 sealed it. No
Per-Batch snapshots exist.

| Stage | works | work_factions | work_locations | work_characters | work_collections | work_persons |
| --- | --- | --- | --- | --- | --- | --- |
| Pre-Apply (565) | 565 | 1903 | 733 | 1220 | 147 | 524 |
| (Per-batch HH-001) | — | — | — | — | — | — |
| (Per-batch HH-002) | — | — | — | — | — | — |
| **Post-Apply (unchanged, 565)** | **565** | **1903** | **733** | **1220** | **147** | **524** |
| Δ (wave 10, expected) | (+20) | (TBD) | (TBD) | (TBD) | (TBD) | (TBD) |

(`db-counts.ts` snapshot captured pre-4a; verify-pass.ts NEW-range audit
replica below confirms `total_works=0` for HH-0001..HH-0020 — the apply
truly did not happen.)

**Reference rows (JSON-side, landed via Phases 1–3):**

| file | rows pre Pass-10 | rows post Phase 1/2/3 (JSON) | delta | rows in DB | DB delta when 4a re-runs |
| --- | --- | --- | --- | --- | --- |
| `factions.json` | 173 | 179 | +6 | 173 | +6 (auto via JSON loader) |
| `faction-aliases.json` | 59 | 63 | +4 | (aliases not in DB) | — |
| `faction-policy.json` (specialCases) | 21 | 27 | +6 | (policy not in DB) | — |
| `locations.json` | 224 | 234 | +10 | 224 | +10 (auto via JSON loader) |
| `location-aliases.json` | 16 | 17 | +1 | (aliases not in DB) | — |
| `characters.json` | 344 | 404 | +60 | 344 | +60 (auto via JSON loader) |
| `character-aliases.json` | 43 | 47 | +4 | (aliases not in DB) | — |
| `sectors.json` | 8 | 8 | 0 | 8 | 0 |

`facet_values 86→86` — no facet add anticipated this wave (4a verified
0 unknown-facetIds across both override files; `facet-catalog.json`
deliberately out-of-scope per the runbook). `persons.json 96→96` —
unchanged at the halt (no apply ran).

## Decisions I made

Phase 4b is read-only — there were no decisions to make here beyond
faithfully reflecting the halted state in this report. The decisions
that landed in Phases 0–3 are documented in their per-phase reports;
the architect decision pending at Phase 4a is forwarded in the
`## Needs decision` block below.

## ⚠ Needs decision (forwarded from Phase 4a)

**Subject.** Brief-091 range-aware forward-ref Guard hard-fails on HH
anthology→constituent edges in this wave; this is precisely the misfire
the Pass-10 dossier §7d named as the Phase-4a stop trigger.

**Symptom.** With `BATCHES` extended to include `{domain:"hh", n:"001"}`
and `{domain:"hh", n:"002"}` per the Domain-+-N-Append rule,
`scripts/apply-override-dry.ts` runs `analyzeCollections` on the
cumulative roster + applied-ids map and reports:

```
forward collection refs:       15
unresolvable constituent refs: 20

forward collection refs with an out-of-range / unknown constituent — typo or unregistered deferred gap
+ actual - expected
+ [
+   'HH-0020->HH-0117 (out-of-range)',   // The Primarchs → constituent novella 1
+   'HH-0020->HH-0118 (out-of-range)',   // The Primarchs → constituent novella 2
+   'HH-0020->HH-0119 (out-of-range)',   // The Primarchs → constituent novella 3
+   'HH-0020->HH-0120 (out-of-range)',   // The Primarchs → constituent novella 4
+   'HH-0010->HH-0150 (out-of-range)',   // Tales of Heresy → constituent 1
+   'HH-0010->HH-0151..HH-0156 (out-of-range)',  // 6 more Tales of Heresy
+   'HH-0016->HH-0157 (out-of-range)',   // Age of Darkness → constituent 1
+   'HH-0016->HH-0158..HH-0165 (out-of-range)',  // 8 more Age of Darkness
+ ]
- []
```

All 20 constituents are **present in `book-roster.json`** (verified:
`present: 20 / 20`), so `analyzeCollections` correctly classifies them
with `reason: "out-of-range"` (not `"unknown-work"`). Dossier §7d
explicitly anticipates this exact case as the misfire trigger and the
intended contract — `out-of-range` informational, `unknown-work`
blocking.

**Where the hard-fail lives.** `scripts/apply-override-dry.ts:980-988`:

```ts
const unresolvable = collectionAnalysis.unresolvableConstituentRefs;
assert.deepEqual(
  unresolvable.map(
    (u) =>
      `${u.collection.collectionExternalId}->${u.collection.contentExternalId} (${u.reason})`,
  ),
  [],
  "forward collection refs with an out-of-range / unknown constituent — typo or unregistered deferred gap",
);
```

The assertion conflates `reason: "out-of-range"` (legitimate deferred
edge — will resolve when a later HH wave applies HH-0117..HH-0120 /
HH-0150..HH-0156 / HH-0157..HH-0165) with `reason: "unknown-work"`
(typo / unregistered deferred gap — will never resolve). For a sealed
domain (W40K post-Pass-9) the conflation is harmless; for an in-progress
domain (HH mid-bootstrap) it makes every anthology-with-deferred-
constituents a hard fail.

**Resolution paths (architect decides — these are options, not a chosen path).**

1. **Narrow the assertion to `reason: "unknown-work"`** (smallest change,
   most aligned with dossier §7d's stated contract). In
   `apply-override-dry.ts:980-988`, filter `unresolvable` to
   `reason === "unknown-work"` before the `deepEqual []` check; print
   `out-of-range` count in the report block above. The unit suite
   `test:collection-refs` already proves the classifier emits both
   reasons correctly; only the integration assertion changes.
2. **Make the assertion domain-aware** (medium change). Out-of-range
   fails only when the constituent's domain is **sealed** (W40K post-
   Pass-9; HH in-progress until the loop reports HH-complete). Requires
   a domain-seal state somewhere (loop-state.json or a hardcoded
   `SEALED_DOMAINS = ["w40k"] as const` in `apply-override-dry.ts`).
3. **Roster-driven allowlist** (largest change). Each anthology with
   deferred constituents gets a `collection-gaps.json` entry with
   `status: needs_constituent_collection_edges` + the constituent IDs;
   the dry filters those exact refs out of the unresolvable list.
   Couples the apply guard to the roster maintenance manifest — but
   `collection-gaps.json` is currently documentation-only and not parsed.

**Recommendation (advisory — architect decision).** Option 1 is the
minimal change that matches dossier §7d's stated contract; the cost is
that a typo of a W40K constituent (impossible now because W40K is
sealed and the roster is frozen) would no longer be caught by this
specific assertion — but `unknown-work` catches typos anyway, and a
W40K-internal typo would have to bypass the (also-asserted)
`assert.deepEqual(missingRoster, [], …)` check earlier. Option 2 is
more conservative if future domain seals are expected; option 3 is
overengineered for the present scope.

**What's blocked until this decision lands.**

- The DB apply for HH-0001..HH-0020 (the wave's 20 new HH works —
  first HH apply ever, the HH-domain bootstrap milestone). Pre-apply
  DB counts above stay frozen until 4a re-runs.
- The Phase-4a Apply-Digest commit (`ingest/.last-run/phase4-digest.md`)
  — currently still showing the Consolidation-Pass-1 era output
  (`Config: scripts/consolidation-pass.config.json`,
  `apply-range: ssot-w40k-001..057`, no `new wave`). A regeneration
  with the wave-10 config + applyRange `ssot-hh-001..002` will land
  once 4a re-runs.

**What's not blocked.**

- Phases 1–3 of this pass are landed and stable; the JSON-side row +
  alias additions are present in the seed-data tree, will be picked
  up by `seed-resolver-extensions.ts` on the next 4a run (no
  additional Phase 1–3 work needed when 4a re-runs).
- The two new HH batch tuples are already in all three trias batch-
  lists; once the architect's decision lands and the assertion is
  narrowed (or whichever path is chosen), `test:apply-override-dry`
  goes green and 4a can proceed without re-touching `BATCHES`.
- `seed-resolver-extensions.ts` is fully generic since Brief 077, so
  the +6/+10/+60 reference rows will seed automatically on next run.
- The +12 HH-bootstrap authors (Abnett, McNeill, Counter, French,
  Wraight, Reynolds, Swallow, Annandale, Dembski-Bowden, Thorpe,
  Kyme, Scanlon — verified union of `manual-overrides-ssot-hh-001/002`
  authors against `persons.json`) will materialise on first 4a run
  via the `ensurePersonsExist` apply side-output (96 → 108 expected).

## Verification

- **Trias (post-Phase-4a halt state):** `test:resolver` 315/0,
  `test:resolver-data` ok, `test:resolver-coverage` exit 0,
  `test:collection-refs` 7/0. **`test:apply-override-dry` red** by
  design — the architectural misfire above is the gating decision;
  the Phase-4b read-only half does not re-run the trias.
- **Lint (Phase 4b):** 0 errors, 1 pre-existing
  `@next/next/no-page-custom-font` warning in
  `src/app/layout.tsx:44` (unchanged across Passes 5/6/7/8/9, out
  of scope).
- **Typecheck (Phase 4b):** 0 errors.
- **Apply digest** (`ingest/.last-run/phase4-digest.md`, committed but
  **stale**): the file at HEAD still carries the Consolidation-Pass-1
  era output (`Config: scripts/consolidation-pass.config.json`,
  `apply-range: ssot-w40k-001..057`, no `new wave`, 57 batches all
  `ok`, PRE = POST = 565 works / 1903·733·1220·147·524 junctions,
  seed-resolver-extensions ok, seed-facets 0 new). It will be
  refreshed once 4a re-runs with `scripts/resolver-pass.config.json`
  and the architect's chosen Guard fix.
- **Verify digest** (`verify-pass.ts --config
  scripts/resolver-pass.config.json`, stdout — confirms the DB is at
  the Pass-9 W40K seal, no HH apply happened):

  ```
  # verify-pass digest — Resolver-Pass 10 (ssot-hh-001..002)

  == smoke slugs (factions / locations / characters / in_collection) ==
    (no rows)

  == rating coverage HH-0001..HH-0020 by source ==
    (no rows)

  == rating coverage HH-0001..HH-0020 rated/null/total ==
    {"rated":0,"null_rating":0,"total":0}

  == audit replica OLD range HH-0001..HH-0000 ==
    {"total_works":0,"drift_works":0,"gap_works":0,"content_in_collection":0}

  == audit replica NEW range HH-0001..HH-0020 ==
    {"total_works":0,"drift_works":0,"gap_works":0,"content_in_collection":0}
  ```

  Reading: smoke slugs `tales-of-heresy` / `the-primarchs` have not
  yet entered the `works` table (no rows match → no smoke row
  emitted). HH-0001..HH-0020 rating coverage and audit replica NEW
  range both `total=0`, exactly consistent with "the apply did not
  run" and "Pre-Apply counts above unchanged". OLD range
  `HH-0001..HH-0000` is empty by construction (inverted boundary —
  the verify config explicitly encodes "no prior HH baseline"). The
  Verify-Digest is therefore informationally minimal but
  *diagnostically correct* — it proves the halt did not silently
  partial-apply.
- **Phase-0 trias skip note (runbook §10):** the deterministic
  Aggregator + the markdown-only dossier Phase-0 produced are
  correctly outside the trias.

## Maintainer handoff

- **HH bootstrap apply is blocked** until you pick one of the three
  resolution paths in the `## Needs decision` block above (advisory
  recommendation: Option 1, narrow the assertion to
  `reason: "unknown-work"`). After the fix lands, re-run Phase 4a
  (clean run, no extra phase work — Phases 1–3 are stable on the
  branch).
- **No DB mutation happened in Pass 10** — the live Supabase is at
  the Pass-9 W40K seal (565 works / 1903·733·1220·147·524 junctions
  / 173·225·345 reference / 86 facet_values), verified by
  `verify-pass.ts`. PR-merging this branch as-is is **safe** (it
  only adds JSON reference rows, alias entries, three trias batch-
  tuple extensions, the per-phase reports, and this impl-report),
  but the wave's DB milestone (works 565 → 585, first HH apply) is
  deferred to the post-fix 4a re-run.
- **Branch:** `codex/ingest-batches-resolver-trial-hh` carries the
  5 phase commits + this Phase-4b commit (6 total), **not pushed**,
  no PR. Say "fertig" / "PR erstellen" to push + open the PR; or
  hold the branch until the architect fix lands and 4a re-runs (the
  resulting PR then carries the full HH bootstrap apply, not a
  half-state).
- **Reference layer**: factions `173→179`, faction-aliases `59→63`,
  faction-policy specialCases `21→27`, locations `224→234`,
  location-aliases `16→17`, characters `344→404`, character-aliases
  `43→47` — all JSON-side, all picked up automatically on the next
  4a run.

## Open issues / blockers

- **Architect decision required** — the Brief-091 range-aware
  forward-ref Guard misfire on HH anthology forward-refs (see the
  `## Needs decision` block above). Recommendation: Option 1
  (narrow assertion to `reason: "unknown-work"`); your call.
- **Stale Apply-Digest at HEAD** — `ingest/.last-run/phase4-digest.md`
  is from the Consolidation-Pass-1 era, not Pass 10. Will be refreshed
  by the post-fix 4a re-run; Phase 4b deliberately did not regenerate
  it (would be misleading without a successful apply).

## For next session

- **Architect:** decide between Options 1 / 2 / 3 in the `## Needs
  decision` block, then hand back a brief or have CC make the targeted
  edit to `apply-override-dry.ts:980-988`. After the assertion is
  narrowed (or whichever path is chosen), re-run Phase 4a — Phases 1–3
  are already on the branch and the trias batch-range extensions are
  already in place, so the re-run is exactly the
  `scripts/run-phase4-apply.sh scripts/resolver-pass.config.json`
  digest-only path plus the 4a status file refresh.
- **HH-domain bootstrap milestone** lands once 4a re-runs cleanly:
  expected `works 565 → 585`, first HH apply ever, the SSOT-loop's
  pivot point from "W40K bootstrap complete" to "HH bootstrap in
  progress". Subsequent HH waves (HH-003..) follow the established
  resolver-pass cadence.
- **Cowork Wiki-Hygiene pass** (Rollup-Ownership in the coordination
  worktree): defer until the apply lands and Pass 10 has a real DB
  delta to record. Updating `project-state.md` counts to the planned
  585 / HH-bootstrap-in-progress state before the apply happens
  would put the wiki ahead of the DB, which is exactly the drift the
  Rollup discipline avoids.
- **Loop-log marker** for the halt: the SSOT-loop normally owns
  `ssot-loop-log.md`; the resolver-pass doesn't usually write to it.
  The architect may want to append a shell-appended marker (runbook
  §8: `>>` only, never read+rewrite) noting the Brief-091 misfire so
  the next loop-state inspection sees the wave is halted, not silently
  partial.

## References

- Runbook: `sessions/resolver-pass-runbook.md` · Config:
  `scripts/resolver-pass.config.json`
- Dossier: `sessions/resolver-dossiers/resolver-pass-10-dossier.md`
  (§7d names the Brief-091 Guard misfire as the explicit 4a stop trigger)
- Phase reports: `…-phase-1-report.md` (factions) ·
  `…-phase-2-report.md` (locations) · `…-phase-3-report.md` (characters)
  · `…-phase-4a-report.md` (integration/apply — `## Needs decision` halt)
- Apply digest at HEAD: `ingest/.last-run/phase4-digest.md` (stale,
  Consolidation-Pass-1 era — regenerated on post-fix 4a re-run) ·
  verbose log: `ingest/.last-run/phase4-apply-verbose.log` (gitignored)
- Per-pass brief: none — Brief 094 removed the `brief` config field;
  the rationale is consolidated into the runbook anhang (Briefs 076 /
  090 / 091 / 094 / 100, not read to run a phase).
