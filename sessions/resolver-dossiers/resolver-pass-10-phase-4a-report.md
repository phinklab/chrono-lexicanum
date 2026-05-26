# Resolver-Pass 10 — Phase 4a (Integration/Apply) Status

- **Wave:** `ssot-hh-001..002` (HH bootstrap, 20 books HH-0001..HH-0020).
- **Phase:** `phase-4a-integration`.
- **Dossier:** [`resolver-pass-10-dossier.md`](./resolver-pass-10-dossier.md) §7d (architectural concern: range-aware forward-ref Guard for the three anthologies — explicitly designated as the Phase-4a stop point if the Guard misfires).
- **Runbook:** [`../resolver-pass-runbook.md`](../resolver-pass-runbook.md) §3 Phase 4a + §7 (Digest-Disziplin).
- **Status:** **stopped — `## Needs decision` block below.** The Brief-091 range-aware forward-ref Guard fires (hard fail) on the three HH anthologies' out-of-range constituents, exactly the misfire case dossier §7d named ("If the Guard misfires, that's a Phase-4a `## Needs decision` stop"). No DB apply was attempted; no per-batch/post snapshot exists.

## Done in this phase

### Trias batch-range extensions (Brief 100 domain-aware Domain-+-N-Append)

The two new HH tuples appended to each of the three trias batch lists, per runbook §3 Phase 4a + the per-pass config trigger ("Domain-+-N-Append, nicht reines N-Append"):

- **`scripts/apply-override-dry.ts`**: `BATCHES` ends ..057 → ..057 + `{domain:"hh", n:"001"}` + `{domain:"hh", n:"002"}`. Header comment "ssot-w40k-001..057 + ssot-hh-001..030" → "ssot-w40k-001..057 + ssot-hh-001..002" (the prior `..030` was a forward-looking carry-through from the script comment that no longer matches reality; the actual `BATCHES` array now reflects what is materially exercised). `EXPECTED_RANGES` untouched (no run reached the post-apply assertion).
- **`scripts/test-resolver-coverage.ts`**: `BATCHES` end + 2 HH tuples. Header comment updated from "(+ ssot-hh-NNN after each HH resolver pass)" to "+ ssot-hh-001..002 (extended after each HH resolver pass)" so the file-comment matches the array.
- **`scripts/test-resolver-data-integrity.ts`**: `OVERRIDE_BATCHES` end + 2 HH tuples. The smoke-slug assertion label `"coverage smoke slugs exist in 001..057"` rewritten to `"coverage smoke slugs exist in w40k-001..057 + hh-001..002"` to match the new mixed-domain shape (the W40K-only `001..057` syntax was misleading once the array spans domains).

### Scripts intentionally NOT touched (justified)

- **`scripts/seed-resolver-extensions.ts`** — fully generic JSON-loader (Brief-077 form), no hardcoded row list. The Phase-1 +6 factions / Phase-2 +10 locations / Phase-3 +60 characters and the alias-file additions are picked up automatically on next run. Same pattern as Pass-7 / Pass-8 / Pass-9 (Pass-9 4a-report explicitly: "untouched — fully generic, loads factions/sectors/locations/characters from JSON at runtime").
- **`scripts/apply-override-collections.ts`** — pure helper; no hardcoded range. Driven by the caller via the externalBookId→batch map (Brief-091 contract). Untouched.
- **`scripts/seed-data/collection-gaps.json`** — no entries added this wave. Manifest only; not consumed by any apply script. The HH anthology forward-refs are an apply-side Guard concern, not a roster maintenance concern (the constituents *are* in the roster, just outside this wave's apply range). Adding a `needs_constituent_collection_edges` entry would not suppress the Guard assertion — see `## Needs decision` below.
- **`scripts/seed-data/persons.json`** — no apply was run, so no `ensurePersonsExist` side-output materialised. Persons file unchanged at 96 rows.
- **`scripts/seed-data/manual-overrides-ssot-hh-00{1,2}.json`** — no override edits required this wave (zero unknown facetIds verified — see facet-strip section below). Untouched.
- **`scripts/db-counts.ts` / `scripts/seed-facets.ts` / `scripts/run-phase4-apply.sh`** — stable apply-side tooling; not touched. The digest script was not invoked because the trias is red — running an apply against a red dry would mask the architectural issue.
- **`ingest/.last-run/phase4-digest.md`** — not regenerated. The prior committed digest from Pass-9 (W40K-final-wave, applyRange `w40k 001..057`) remains the latest committed digest. A fresh HH digest will land once the Guard decision is taken and 4a re-runs.

### Facet-strip check (zero strips needed)

Verified the union of facetIds across `manual-overrides-ssot-hh-001.json` + `manual-overrides-ssot-hh-002.json` against `facet-catalog.json`:

```
total distinct facetIds in wave: 46
unknown (would need stripping): 0
```

Zero stripping required; `facet-catalog.json` correctly stays out of scope this wave; no `## Needs decision`-stop on the facet axis.

## Pre-Apply DB counts snapshot (the only counts row available — no apply ran)

| Stage              | works | work_factions | work_locations | work_characters | work_collections | work_persons | work_facets | factions | locations | characters | facet_values |
| ---                | ---   | ---           | ---            | ---             | ---              | ---          | ---         | ---      | ---       | ---        | ---          |
| **PRE-APPLY (565)**| 565   | 1903          | 733            | 1220            | 147              | 524          | 11291       | 173      | 224       | 344        | 86           |

(captured via `npx tsx --env-file=.env.local scripts/db-counts.ts`)

The PRE-APPLY DB state matches the Pass-9 post-apply seal exactly — 565/565 W40K works, no HH books applied yet. **No Per-Batch and no Post snapshots** because the apply did not run (see `## Needs decision`).

## Reference-row deltas in this pass (Phases 1–3 already on the branch)

| file                            | rows pre Pass-10 | rows post Phase 1/2/3 (JSON) | delta | rows in DB | DB delta when 4a re-runs (if needs-decision resolved) |
| ---                             | ---              | ---                          | ---   | ---        | ---                                                   |
| `factions.json`                 | 173              | 179                          | +6    | 173        | +6 (auto via JSON loader)                             |
| `faction-aliases.json`          | 59               | 63                           | +4    | (aliases not in DB)                                   |                                                       |
| `faction-policy.json` (specialCases) | 21          | 27                           | +6    | (policy not in DB)                                    |                                                       |
| `locations.json`                | 224              | 234                          | +10   | 224        | +10 (auto via JSON loader)                            |
| `location-aliases.json`         | 16               | 17                           | +1    | (aliases not in DB)                                   |                                                       |
| `characters.json`               | 344              | 404                          | +60   | 344        | +60 (auto via JSON loader)                            |
| `character-aliases.json`        | 43               | 47                           | +4    | (aliases not in DB)                                   |                                                       |
| `sectors.json`                  | 8                | 8                            | 0     | 8          | 0                                                     |

(JSON-side deltas verified via `node -e "..."` count on each file post-Phase-3; matches Phase-1/2/3 reports.)

## Apply-side trias verification

The first three trias scripts went green on the post-Phase-3 + Phase-4a-BATCHES-extension state:

| script                                  | result                                                                                       |
| ---                                     | ---                                                                                          |
| `npm run test:resolver`                 | **315 passed, 0 failed** (no resolver-test churn from Phase 4a — that's Phases 1–3's scope)  |
| `npm run test:resolver-data`            | **resolver data integrity ok** (10 checks; smoke-slug label `w40k-001..057 + hh-001..002`)   |
| `npm run test:resolver-coverage`        | **exit 0** — totals factions=1981/2319, locations=776/1027, characters=1329/1736 against the wider cumulative range (W40K + HH-001..002 now contributing to the surveyed pool) |
| `npm run test:collection-refs`          | **7 passed, 0 failed** — the `analyzeCollections` helper correctly classifies the HH anthology constituents as `reason=out-of-range` (the unit suite verifies the classification; it does **not** verify the integration assertion in apply-override-dry.ts) |
| `npm run test:apply-override-dry`       | **FAILED — assertion `unresolvableConstituentRefs deepEqual []`.** 20 out-of-range refs reported: HH-0020 → HH-0117..HH-0120 (4), HH-0010 → HH-0150..HH-0156 (7), HH-0016 → HH-0157..HH-0165 (9). See `## Needs decision` below. |

`npm run lint` and `npm run typecheck` were **not** invoked because the apply-side dry is red and the integrity question above is the gating decision; running lint/typecheck would not change the halt outcome.

## ⚠ Needs decision

**Subject.** Brief-091 range-aware forward-ref Guard hard-fails on HH anthology→constituent edges in this wave; this is precisely the misfire the Pass-10 dossier §7d named as the Phase-4a stop trigger.

**Concrete symptom.** With `BATCHES` extended to include `{domain:"hh", n:"001"}` and `{domain:"hh", n:"002"}` per the Domain-+-N-Append rule, `scripts/apply-override-dry.ts` runs `analyzeCollections` on the cumulative roster + applied-ids map and reports:

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

All 20 constituents are **present in `book-roster.json`** (verified: `present: 20 / 20`), so `analyzeCollections` correctly classifies them with `reason: "out-of-range"` (not `"unknown-work"`). The Pass-10 dossier §7d explicitly anticipates this: *"Phase 4a verifies the Guard is wired for the domain-aware applyRange `{domain:"hh", from:1, to:2}` and that the constituent slugs are correctly recognized as 'outside-range' rather than 'missing entirely'."* The classification is right; the **assertion downstream of the classification is wrong for the HH-in-progress domain**.

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

The assertion conflates `reason: "out-of-range"` (legitimate deferred edge — will resolve when a later HH wave applies HH-0117..HH-0120 / HH-0150..HH-0156 / HH-0157..HH-0165) with `reason: "unknown-work"` (typo / unregistered deferred gap — will never resolve). For a sealed domain (W40K post-Pass-9) the conflation is harmless because nothing further gets applied; for an in-progress domain (HH mid-bootstrap) it makes every anthology-with-out-of-range-constituents a hard fail.

**What the dossier expected.** From §7d verbatim:

> "The **range-aware forward-ref Guard (Brief 091)** must let these pass — that's its purpose. **Expected behavior:** the Guard suppresses the constituent collection edges for the anthologies in this wave; later HH waves will apply the constituent novels (HH-0117.., HH-0150.., HH-0157..) and the cumulative re-apply will then materialize the edges (delete-then-insert idempotent, runbook §7)."

So the *intended* contract is: `reason: "out-of-range"` is informational (counted, printed) but does NOT abort the dry; only `reason: "unknown-work"` aborts. The current code aborts on both — that's the misfire.

**Resolution paths (architect decides — these are options, not a chosen path).**

1. **Narrow the assertion to `reason: "unknown-work"`** (smallest change, most aligned with dossier intent). In `apply-override-dry.ts:980-988`, filter `unresolvable` to `reason === "unknown-work"` before the `deepEqual []` check; print `out-of-range` count in the report block above. The unit suite `test:collection-refs` already proves the classifier emits both reasons correctly; only the integration assertion changes.
2. **Make the assertion domain-aware** (medium change). Out-of-range fails only when the constituent's domain is **sealed** (W40K is sealed post-Pass-9; HH is in-progress until the loop reports HH-complete). Requires a domain-seal state somewhere (loop-state.json or similar) or hardcoded `SEALED_DOMAINS = ["w40k"] as const` in apply-override-dry.ts.
3. **Roster-driven allowlist** (largest change). Each anthology with deferred constituents gets a `collection-gaps.json` entry with `status: needs_constituent_collection_edges` + the constituent IDs; the dry filters those exact refs out of the unresolvable list. Couples the apply guard to the roster maintenance manifest — but `collection-gaps.json` is currently documentation-only and not parsed.

**Recommendation (advisory — architect decision).** Option 1 is the minimal change that matches dossier §7d's stated contract; the cost is that a typo of a W40K constituent (impossible now because W40K is sealed and the roster is frozen) would no longer be caught by this specific assertion — but unknown-work catches typos anyway, and a W40K-internal typo would have to bypass the (also-asserted) `assert.deepEqual(missingRoster, [], ...)` check earlier. Option 2 is more conservative if future domain seals are expected; option 3 is overengineered for the present scope.

**What's blocked until this decision lands.**

- The DB-apply for HH-0001..HH-0020 (the wave's 20 new HH works — first HH apply ever, the HH-domain bootstrap milestone). Pre-apply DB counts above stay frozen until 4a re-runs.
- The Phase-4a Apply-Digest commit (`ingest/.last-run/phase4-digest.md`) — would currently contain a `seed-resolver-extensions: ok / seed-facets: ok / applied <batch>: FAILED` sequence under any path that runs `db:apply-override` against a dry-red state. Not regenerated to avoid a misleading half-success digest.
- Phase 4b — runbook §3 Phase 4b strictly reads the 4a statusfile + the committed Apply-Digest. With the digest unchanged from Pass-9 and 4a in `## Needs decision`, 4b has nothing valid to verify. The driver halt at the end of this phase keeps 4b from running on a stale digest.

**What's NOT blocked.**

- Phases 1–3 of this pass are landed and stable; the JSON-side row + alias additions are present in the seed-data tree, will be picked up by `seed-resolver-extensions.ts` on the next 4a run (no additional Phase 1–3 work needed when 4a re-runs).
- The two new HH batch tuples are now in all three trias batch-lists; when the architect's decision lands and the assertion is narrowed (or whichever path is chosen), `test:apply-override-dry` should immediately go green and 4a can proceed without re-touching `BATCHES`.

## Halt-Discipline checklist (driver post-phase verification)

- One commit on this phase: ✅ (this report + the three trias scripts in a single commit; HEAD moves).
- `git diff --name-only HEAD~..HEAD` ⊆ Phase-4a Write-Scope: ✅ (only `scripts/apply-override-dry.ts`, `scripts/test-resolver-coverage.ts`, `scripts/test-resolver-data-integrity.ts`, `sessions/resolver-dossiers/resolver-pass-10-phase-4a-report.md`).
- JSON files syntactically valid: ✅ (no JSON files touched — only TS sources + this Markdown report).
- `## Needs decision` block present: ✅ (above).
- No Co-Author trailer: ✅ (the commit message will be imperative-only, no `Co-Authored-By:` line).
- ready-for-4b marker: **not asserted** — phase is `## Needs decision`-stopped, follow-up phases must not run until the architect decision lands.
