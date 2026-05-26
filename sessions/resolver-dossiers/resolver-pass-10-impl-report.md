---
pass: 10
role: implementer
date: 2026-05-26
status: complete
wave: ssot-hh-001..002
ids: HH-0001..HH-0020
branch: codex/ingest-batches-resolver-trial-hh
runbook: sessions/resolver-pass-runbook.md
config: scripts/resolver-pass.config.json
dossier: sessions/resolver-dossiers/resolver-pass-10-dossier.md
commits:
  - 24c5292  # Phase 0 (Preflight/Dossier)
  - b947f9f  # Phase 1 (Factions)
  - 258a977  # Phase 2 (Locations)
  - 499af8c  # Phase 3 (Characters)
  - d08d796  # Phase 4a (Integration/Apply) — pre-Brief-101 needs-decision halt (superseded by 42a6fad)
  - 37749be  # Phase 4b (Verify/Report) — pre-Brief-101 forwarded halt (superseded by this commit)
  - 42a6fad  # Phase 4a Re-Run (Integration/Apply) — HH bootstrap apply clean (works 565 → 585)
  # Phase 4b Re-Run (Verify/Report) is the commit carrying this report.
---

# Resolver-Pass 10 — impl report (ssot-hh-001..002 / HH-0001..HH-0020)

## Summary

**Pass-10 is the first Horus-Heresy resolver-pass wave** (the HH-domain
bootstrap, 20 books HH-0001..HH-0020). Brief 100 two-domain Resolver-Loop +
Cross-Era-Identitäten rules apply: HH surface-forms either Alias onto the
existing W40K Canonical-Row (`Luna Wolves` → `sons_of_horus`, `Kharn` →
`kharn_the_betrayer`, `Magnus` → `magnus_the_red`, …) or open a fresh HH-only
Canonical-Row (`horus`, `garviel_loken`, `nathaniel_garro`, …). All six
phases landed cleanly with their per-phase reports; the JSON reference layer
grew by +6 factions / +10 locations / +60 characters and +4 / +1 / +4
aliases.

**Phase 4a landed the HH bootstrap apply: works 565 → 585** (+20 — the
exact 20 HH books of this wave). The first 4a attempt halted on
`## Needs decision` because the Brief-091 range-aware forward-ref Guard
hard-failed on the three HH anthologies' out-of-range constituents
(20 `unresolvableConstituentRefs` with `reason: "out-of-range"` —
HH-0020 → HH-0117..HH-0120, HH-0010 → HH-0150..HH-0156, HH-0016 →
HH-0157..HH-0165 — exactly the misfire dossier §7d named as the
explicit 4a stop trigger). Brief 101 narrowed the Guard's assertion to
`reason: "unknown-work"` only — `out-of-range` refs are now reported
informationally in the dry's by-reason breakdown but no longer abort,
matching dossier §7d's stated contract. The re-run (commit `42a6fad`)
went green on the first try: `test:apply-override-dry` reports
`out-of-range=20, unknown-work=0` and exits ok; `bash
scripts/run-phase4-apply.sh scripts/resolver-pass.config.json`
applied both batches cleanly with a refreshed Apply-Digest.

Phase 4b ran the **read-only** half: `verify-pass.ts --config …`
confirms the live DB matches the digest (20 HH works present, smoke
slugs `tales-of-heresy` / `the-primarchs` carrying their junction
counts, 20/20 Goodreads-rated, NEW-range audit replica reports the
expected drift/gap shape for the HH bootstrap); `lint` + `typecheck`
clean. This impl-report is polished from the 4a status file + the
committed Apply-Digest + the Verify-Digest stdout — **without
re-deriving state**, per runbook §3 Phase 4b.

**Headline:** the HH-domain bootstrap milestone is **on the branch and
in the DB**. PR-ready (the rebase rewrites the pre-Brief-101 4a/4b
commits' narrative; the new 42a6fad + this commit replace the
needs-decision stop with a clean run). Subsequent HH waves (HH-003..)
follow the established resolver-pass cadence.

## What I did

The pass is a 6-phase sequence. Phases 0–3 landed in their own
commits with full per-phase reports. The first Phase 4a / 4b pair
landed in the pre-rebase commits (`d08d796` / `37749be`) carrying a
`## Needs decision` halt forwarded to this report — superseded after
the Brief-101 Guard-Fix (commit `1126e45` from `origin/main`,
rebase-merged into this branch) by the Phase 4a Re-Run
(commit `42a6fad`) and this Phase 4b Re-Run commit. The re-runs only
needed (a) confirming the trias is green against the Brief-101-fixed
Guard, (b) the digest-only-apply of the wave, (c) refreshing the 4a
status file with a success block, (d) running the 4b read-only verify
and polishing this impl-report.

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

### Phase 4a — Integration / Apply (re-run, commit `42a6fad`)

- **Trias batch-range extensions — Brief 100 Domain-+-N-Append**
  (already on the branch from the pre-rebase Phase-4a commit
  `d08d796`): the two new HH tuples `{domain:"hh", n:"001"}` +
  `{domain:"hh", n:"002"}` appended to `BATCHES` in
  `scripts/apply-override-dry.ts`,
  `scripts/test-resolver-coverage.ts`, and
  `scripts/test-resolver-data-integrity.ts`. Header /
  smoke-slug-coverage labels updated to match the mixed-domain shape
  (`ssot-w40k-001..057 + ssot-hh-001..002`). The Brief-101 Guard-Fix
  (commit `1126e45`) lands on the same `apply-override-dry.ts`
  hunk — the rebase merged the two edits cleanly (the BATCHES array
  add and the assertion narrowing are in different parts of the
  file).
- **Scripts intentionally not touched** (unchanged from prior 4a
  attempt): `scripts/seed-resolver-extensions.ts` (fully generic
  JSON-loader, Brief-077 form — picks up Phase 1/2/3 row additions
  automatically); `scripts/apply-override-collections.ts` (pure
  helper, no hardcoded range, Brief-091 contract);
  `scripts/db-counts.ts`, `scripts/seed-facets.ts`,
  `scripts/run-phase4-apply.sh` (stable apply-side tooling).
  `scripts/seed-data/collection-gaps.json` not touched — the HH
  anthology forward-refs are out-of-range deferred edges that will
  materialize on later HH waves via the idempotent cumulative
  re-apply, no roster maintenance entry needed.
  `scripts/seed-data/persons.json` unchanged at 96 rows: the apply's
  `ensurePersonsExist` reported `0 newly created in DB` for both
  batches (5 distinct slugs in HH-001, 6 in HH-002; all 11 already
  present from the W40K corpus). The two
  `manual-overrides-ssot-hh-00{1,2}.json` files untouched (0 unknown
  facetIds verified: union of 46 distinct facetIds across both
  override files against `facet-catalog.json` = 0 strips needed).
- **Apply-side trias green on the re-run:**
  - `test:resolver` 315/0 ✓
  - `test:resolver-data` ✓ (10 integrity checks; smoke-slug label
    `w40k-001..057 + hh-001..002`)
  - `test:resolver-coverage` ✓ (exit 0; totals factions=1981/2319,
    locations=776/1027, characters=1329/1736 against the wider
    cumulative range now contributing HH-001..002)
  - `test:collection-refs` 10/0 ✓ (the Brief-101 reason-split helper
    suite — 7 classifier cases + 3 dry-guard reason-split cases:
    out-of-range > 0 does NOT abort; unknown-work > 0 aborts; both
    > 0 aborts on the unknown-work subset only)
  - **`test:apply-override-dry` ok** —
    `forward collection refs: 15; unresolvable constituent refs: 20;
    by reason: out-of-range=20, unknown-work=0`. The Brief-101
    Guard treats the 20 HH anthology forward-refs as informational
    deferred edges (dossier §7d's intended contract); only
    `unknown-work` would abort, and there are none.
- **Digest-only apply ran clean:** `bash
  scripts/run-phase4-apply.sh scripts/resolver-pass.config.json`
  refreshed `ingest/.last-run/phase4-digest.md`:
  `seed-resolver-extensions: ok`, `seed-facets: 0 new`,
  `applied ssot-hh-001: ok`, `applied ssot-hh-002: ok`,
  `DONE`. Pre 565 → Per-batch (HH-001) 575 → Per-batch (HH-002) 585
  → Post 585 works. Reference deltas (`factions/locations/characters
  +6/+10/+60`) land on the HH-001 boundary because
  `seed-resolver-extensions.ts` runs once before the first batch.

### Phase 4b — Verify / Report (read-only, this commit)

- `scripts/verify-pass.ts --config scripts/resolver-pass.config.json`
  ran read-only against the live Supabase; stdout (Verify-Digest)
  below in §Verification.
- `npm run lint` + `npm run typecheck` ran clean (0 errors; same
  pre-existing `@next/next/no-page-custom-font` warning in
  `src/app/layout.tsx:44` carried unchanged across Passes 5–10).
- This impl-report assembled from the 4a status file + the
  committed Apply-Digest + the Verify-Digest stdout — no state
  re-derivation, no second DB apply, no trias re-run (runbook
  §3 Phase 4b).

## Counts (Pflicht-Tabelle)

| Stage | works | work_factions | work_locations | work_characters | work_collections | work_persons |
| --- | --- | --- | --- | --- | --- | --- |
| Pre-Apply (565) | 565 | 1903 | 733 | 1220 | 147 | 524 |
| Per-batch HH-001 | 575 | 1940 | 745 | 1282 | 147 | 533 |
| Per-batch HH-002 | 585 | 1981 | 776 | 1325 | 147 | 541 |
| **Post-Apply (585)** | **585** | **1981** | **776** | **1325** | **147** | **541** |
| Δ (wave 10) | **+20** | **+78** | **+43** | **+105** | **0** | **+17** |

(Source: `ingest/.last-run/phase4-digest.md` at `42a6fad`.
`work_facets 11291 → 11672 (+381)` and `facet_values 86 → 86 (0 new)`
included in the digest but elided here for table width.)

**Reading the deltas.**
- `works +20`: HH-0001..HH-0020 — the wave's 20 new HH books, the
  HH-domain bootstrap milestone.
- `work_collections +0`: the three HH anthologies (`HH-0010 Tales of
  Heresy`, `HH-0016 Age of Darkness`, `HH-0020 The Primarchs`) have
  all their constituent edges **out-of-range** for this wave —
  HH-0117..HH-0120 / HH-0150..HH-0156 / HH-0157..HH-0165 land on
  later HH waves; the cumulative re-apply will materialize the
  in_collection edges then (idempotent delete-then-insert, runbook
  §7). The 15 *in-range* forward refs reported by the dry are all
  W40K-internal cross-batch edges from the cumulative 001..057
  history.
- `facet_values +0`: 0 unknown facetIds across both override files —
  zero strips needed; `facet-catalog.json` correctly stayed out of
  scope.
- Reference deltas (`factions/locations/characters +6/+10/+60`)
  match Phase 1/2/3 row additions exactly —
  `seed-resolver-extensions.ts` (fully generic since Brief 077)
  picked up the JSON-side additions automatically.

**Reference rows (JSON-side, landed via Phases 1–3, in the DB after 4a):**

| file | rows pre Pass-10 | rows post Phase 1/2/3 (JSON) | delta | rows in DB | DB delta after 4a |
| --- | --- | --- | --- | --- | --- |
| `factions.json` | 173 | 179 | +6 | 179 | +6 ✓ |
| `faction-aliases.json` | 59 | 63 | +4 | (aliases not in DB) | — |
| `faction-policy.json` (specialCases) | 23 | 29 | +6 | (policy not in DB) | — |
| `locations.json` | 224 | 234 | +10 | 234 | +10 ✓ |
| `location-aliases.json` | 16 | 17 | +1 | (aliases not in DB) | — |
| `characters.json` | 344 | 404 | +60 | 404 | +60 ✓ |
| `character-aliases.json` | 43 | 47 | +4 | (aliases not in DB) | — |
| `sectors.json` | 8 | 8 | 0 | 8 | 0 |
| `persons.json` | 96 | 96 | 0 | (autoCreated: 0 in DB) | 0 |

`facet_values 86→86` — no facet add needed this wave.
`persons.json 96→96` — all 11 distinct HH-bootstrap author/editor
slugs were already in the DB from the W40K corpus
(`ensurePersonsExist: 0 newly created` for both batches).

## Decisions I made

Phase 4b is read-only — there were no decisions to make here beyond
faithfully reflecting the clean 4a re-run state in this report. The
decisions that landed in Phases 0–3 are documented in their per-phase
reports; the Phase-4a Brief-091 Guard misfire that triggered the
first attempt's `## Needs decision` halt was resolved by Brief 101
(commit `1126e45`, reason-split assertion narrowed to
`reason: "unknown-work"`) — that is the architect decision the prior
impl-report was forwarding; this re-run impl-report records its
resolution and the resulting clean apply.

## Resolution of the prior `## Needs decision` (now closed)

**Subject (closed).** Brief-091 range-aware forward-ref Guard hard-
failed on HH anthology→constituent edges in the first Phase-4a
attempt, exactly the misfire dossier §7d named as the explicit 4a
stop trigger.

**Resolution.** Brief 101 ("HH-Bootstrap forward-ref Guard —
Reason-Split", commit `1126e45` on `origin/main`, rebase-merged into
this branch) narrowed the assertion in
`scripts/apply-override-dry.ts:980-1002`:

```ts
// Brief 091 range-aware guard, Brief 101 reason-split: in-range forward
// refs (above) stay accepted. The tripwire is the constituent side, and it
// splits by reason. `out-of-range` is a consistent deferred state — the
// constituent is in the roster, just not in the cumulative apply range
// yet, and applyCollections re-evaluates the edge when the constituent's
// wave lands (Pass 6's anthology forward refs proved this end-to-end).
// `unknown-work` is the real error — constituent absent from the roster
// entirely (typo or unregistered deferred gap) → never resolves. Out-of-
// range refs are reported in the reason-breakdown above as informational
// deferred edges; only unknown-work refs abort the dry, and only those
// are listed in the failure message (the actionable set).
const unknownWorkRefs = collectionAnalysis.unresolvableConstituentRefs.filter(
  (u) => u.reason === "unknown-work",
);
assert.deepEqual(
  unknownWorkRefs.map(
    (u) =>
      `${u.collection.collectionExternalId}->${u.collection.contentExternalId}`,
  ),
  [],
  "forward collection refs with an unknown constituent — typo or unregistered deferred gap",
);
```

This is **Option 1** from the prior impl-report's resolution-paths
list — the minimal change matching dossier §7d's stated contract.
The companion `test:collection-refs` suite was extended in the same
commit with three "dry-guard reason-split" cases (out-of-range > 0
does NOT abort; unknown-work > 0 aborts; both > 0 aborts on the
unknown-work subset only) to lock the contract into the test
harness.

**Effect on this wave.** The 20 out-of-range HH anthology forward-
refs (HH-0020 → HH-0117..HH-0120, HH-0010 → HH-0150..HH-0156,
HH-0016 → HH-0157..HH-0165) now show in the dry's
`by reason: out-of-range=20, unknown-work=0` informational
breakdown but do not abort. The HH bootstrap apply ran clean:
works 565 → 585 (+20), reference deltas +6/+10/+60. Subsequent HH
waves will apply the constituent novels, and the cumulative idempotent
re-apply will then materialize the 20 in_collection edges
(`work_collections` is currently +0; will tick up in batches as
later waves land).

## Verification

- **Apply digest** (`ingest/.last-run/phase4-digest.md`, committed at
  `42a6fad`):

  ```
  Config: scripts/resolver-pass.config.json · apply-range: ssot-hh-001 ssot-hh-002 · new wave: ssot-hh-001 ssot-hh-002
  PRE-APPLY:  565 works / 1903·733·1220·147·524·11291 junctions / 173·224·344·86 refs+facets
  seed-resolver-extensions: ok
  seed-facets: catalog values 86; newly inserted 0
  applied ssot-hh-001: ok → POST 575 works / 1940·745·1282·147·533·11488 / 179·234·404·86
  applied ssot-hh-002: ok → POST 585 works / 1981·776·1325·147·541·11672 / 179·234·404·86
  DONE
  ```

- **Verify digest** (`verify-pass.ts --config
  scripts/resolver-pass.config.json`, stdout — the live DB matches
  the digest exactly):

  ```
  # verify-pass digest — Resolver-Pass 10 (ssot-hh-001..002)

  == smoke slugs (factions / locations / characters / in_collection) ==
    {"external_book_id":"HH-0010","slug":"tales-of-heresy","f":7,"l":2,"c":9,"in_coll":0}
    {"external_book_id":"HH-0020","slug":"the-primarchs","f":6,"l":1,"c":5,"in_coll":0}

  == rating coverage HH-0001..HH-0020 by source ==
    {"rating_source":"goodreads","n":20}

  == rating coverage HH-0001..HH-0020 rated/null/total ==
    {"rated":20,"null_rating":0,"total":20}

  == audit replica OLD range HH-0001..HH-0000 ==
    {"total_works":0,"drift_works":0,"gap_works":0,"content_in_collection":0}

  == audit replica NEW range HH-0001..HH-0020 ==
    {"total_works":20,"drift_works":15,"gap_works":2,"content_in_collection":0}
  ```

  **Reading the verify-digest.**
  - **Smoke slugs both present** (`tales-of-heresy` HH-0010 with
    7f/2l/9c, `the-primarchs` HH-0020 with 6f/1l/5c). `in_coll=0`
    on both because the anthology→constituent edges are
    out-of-range for this wave — exactly the expected shape (will
    land on later HH waves' cumulative re-apply).
  - **Rating coverage 20/20** for HH-0001..HH-0020 — the SSOT-loop
    pre-applied Goodreads ratings during the resolve phase, all
    20 books carry a `rating_source=goodreads` value.
  - **OLD range HH-0001..HH-0000 all zero** — inverted boundary
    by construction (the verify config explicitly encodes "no prior
    HH baseline"); the empty result proves the comparison-baseline
    is the empty set, not stale W40K data.
  - **NEW range HH-0001..HH-0020 audit replica:**
    - `total_works=20` — all 20 HH works materialized in `works`.
    - `drift_works=15` — 15 works have at least one junction whose
      `raw_name` ≠ canonical entity name (case-insensitive). For
      the HH bootstrap this is **expected and good** — it's the
      cross-era alias system working: `raw_name="Luna Wolves"`
      resolves to canonical `Sons of Horus`, `raw_name="Kharn"`
      to canonical `Kharn the Betrayer`, etc. (runbook §4
      Cross-Era-Identitäten). 15/20 drift means the dramatis
      personae across most HH books leans on the cross-era
      anchoring.
    - `gap_works=2` — 2 works have at least one of factions /
      locations / characters with `count=0`. The audit-cockpit
      drift/gap signals are data findings, not 4a failures; they
      get triaged on the wider data-quality cycle, not in the
      resolver-pass.
    - `content_in_collection=0` — consistent with the
      `work_collections +0` from the Apply-Digest: 0 distinct
      HH works currently appear as content in any collection
      edge. The 3 anthologies (HH-0010 / HH-0016 / HH-0020) are
      collection *containers* themselves; their constituents
      (HH-0117.. / HH-0150.. / HH-0157..) are out-of-range and
      will populate `work_collections` on later HH waves.

- **Trias (post-Phase-4a-Re-Run state):** `test:resolver` 315/0,
  `test:resolver-data` ok, `test:resolver-coverage` exit 0,
  `test:collection-refs` 10/0,
  `test:apply-override-dry` ok (out-of-range=20, unknown-work=0).
- **Lint:** 0 errors, 1 pre-existing
  `@next/next/no-page-custom-font` warning in
  `src/app/layout.tsx:44` (unchanged across Passes 5–10, out
  of scope).
- **Typecheck:** 0 errors.
- **Phase-0 trias skip note (runbook §10):** the deterministic
  Aggregator + the markdown-only dossier Phase-0 produced are
  correctly outside the trias.

## Maintainer handoff

- **HH bootstrap apply landed in the DB:** works `565 → 585` (+20).
  The live Supabase carries 585 works / 1981·776·1325·147·541·11672
  junctions / 179·234·404·86 refs+facets, verified by
  `verify-pass.ts`. PR-merging this branch is **safe and
  complete** — it brings the JSON reference additions, the alias
  entries, the three trias batch-tuple extensions, the per-phase
  reports, the refreshed Apply-Digest, and this impl-report.
- **Branch shape:** `codex/ingest-batches-resolver-trial-hh`
  carries the 5 original phase commits (Phases 0–3 + the first
  4a + the first 4b — pre-Brief-101, needs-decision halt) plus
  the Brief-101 Guard-Fix commit `1126e45` rebase-merged from
  `origin/main`, plus the Phase 4a Re-Run (`42a6fad`) and this
  Phase 4b Re-Run commit on top. The pre-Brief-101 4a/4b commits
  stay on the branch as historical record of the halt and its
  forwarding; the post-Brief-101 re-runs supersede them
  semantically.
- **Push needs `--force-with-lease`** — the rebase rewrote the
  branch's earlier history (the `behind 8` portion before the
  rebase brought `1126e45` in). `git push --force-with-lease
  origin codex/ingest-batches-resolver-trial-hh` is the safe
  variant (rejects the push if the remote has moved
  unexpectedly since the last fetch). PR #105 becomes
  merge-ready after that push.
- **Reference layer in the DB:** factions `173→179`,
  locations `224→234`, characters `344→404`, sectors `8→8`,
  facet_values `86→86`. JSON-side files mirror the DB exactly.

## Open issues / blockers

- **None.** The prior `## Needs decision` block (Brief-091 Guard
  misfire) is resolved by Brief 101's reason-split; the HH
  bootstrap apply is in the DB; the trias is green; lint and
  typecheck clean; the Verify-Digest matches the Apply-Digest.

## For next session

- **Cowork Wiki-Hygiene pass** (Rollup-Ownership in the
  coordination worktree, post-merge): once PR #105 lands on
  `main`, the coordination worktree backfills
  `brain/wiki/project-state.md` (works 565 → 585, HH bootstrap
  in progress), `brain/wiki/log.md` (Pass-10 wave entry), and
  `sessions/README.md` (Pass-10 wave row). The strand worktree
  does not touch `brain/**` per CLAUDE.md §"Parallel worktrees" →
  "Rollup-Ownership".
- **Next HH wave** (HH-003.. when the SSOT-loop produces it):
  follows the established resolver-pass cadence. Subsequent waves
  that apply the constituent novels (HH-0117.. anthology-of-The-
  Primarchs constituents; HH-0150.. Tales-of-Heresy
  constituents; HH-0157.. Age-of-Darkness constituents) will
  materialize the 20 currently-out-of-range collection edges via
  the cumulative idempotent re-apply (`work_collections` ticks up
  by the constituent count when each anthology's content batch
  lands).
- **Audit-cockpit drift/gap follow-up** (data-quality cycle, not
  resolver-pass): the 15 drift_works are expected (cross-era
  alias resolution producing raw_name ≠ canonical.name); the
  2 gap_works are data findings worth triaging in the next
  audit-cockpit sweep — likely a couple of HH books with sparse
  metadata where one junction axis is empty.

## References

- Runbook: `sessions/resolver-pass-runbook.md` · Config:
  `scripts/resolver-pass.config.json`
- Dossier: `sessions/resolver-dossiers/resolver-pass-10-dossier.md`
  (§7d named the Brief-091 Guard misfire as the explicit 4a stop
  trigger and the intended contract — `out-of-range`
  informational, `unknown-work` blocking — that Brief 101
  delivered)
- Phase reports: `…-phase-1-report.md` (factions) ·
  `…-phase-2-report.md` (locations) · `…-phase-3-report.md`
  (characters) · `…-phase-4a-report.md` (integration/apply —
  re-run success block at `42a6fad`)
- Apply digest at HEAD: `ingest/.last-run/phase4-digest.md` ·
  verbose log: `ingest/.last-run/phase4-apply-verbose.log`
  (gitignored)
- Brief 101 (Guard reason-split, the resolution of the prior
  `## Needs decision`): `sessions/2026-05-26-101-arch-hh-forward-ref-guard-reason-split.md`
  (+ impl report `sessions/2026-05-26-101-impl-hh-forward-ref-guard-reason-split.md`)
- Per-pass brief: none — Brief 094 removed the `brief` config
  field; the rationale is consolidated into the runbook anhang
  (Briefs 076 / 090 / 091 / 094 / 100 / 101 — not read to run a
  phase).
