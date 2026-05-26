# Resolver-Pass 10 — Phase 4a (Integration/Apply) Status

- **Wave:** `ssot-hh-001..002` (HH bootstrap, 20 books HH-0001..HH-0020).
- **Phase:** `phase-4a-integration`.
- **Dossier:** [`resolver-pass-10-dossier.md`](./resolver-pass-10-dossier.md) §7d (range-aware forward-ref Guard expectation: `out-of-range` informational, `unknown-work` blocking — Brief-101 reason-split lands the dossier's intended contract).
- **Runbook:** [`../resolver-pass-runbook.md`](../resolver-pass-runbook.md) §3 Phase 4a + §7 (Digest-Disziplin).
- **Status:** **ready for 4b.** Brief-101 Guard-Fix is on the branch (commit `1126e45`, rebase-merged from `origin/main`); `test:apply-override-dry` reports `out-of-range=20, unknown-work=0` and exits ok. The HH bootstrap apply ran cleanly: works `565 → 585`, the first HH apply ever, the HH-domain bootstrap milestone. Digest refreshed + committed.

## Done in this phase

This is the **re-run after Brief-101 Guard-Fix**. The prior 4a commit (HEAD~) carried the trias batch-range extensions, the apply-side script edits, and a `## Needs decision` halt because the Brief-091 Guard misfired on the three HH anthologies' out-of-range constituents (dossier §7d's named stop trigger). After Brief 101 narrowed the assertion to `reason: "unknown-work"` only, the misfire is gone: the dry now reports out-of-range refs informationally and exits ok. The re-run only needed to (a) confirm the trias is green against the Brief-101-fixed Guard, (b) digest-only-apply the wave, (c) rewrite this status file with the success block. Nothing else moved.

### Trias batch-range extensions (already on the branch from the prior 4a commit)

The two new HH tuples are already in all three trias batch lists from the prior Phase 4a commit (HEAD~`d08d796` pre-rebase; same content rebased on top of `1126e45`):

- **`scripts/apply-override-dry.ts`**: `BATCHES` ends ..057 + `{domain:"hh", n:"001"}` + `{domain:"hh", n:"002"}`. Header comment: `ssot-w40k-001..057 + ssot-hh-001..002`.
- **`scripts/test-resolver-coverage.ts`**: `BATCHES` end + 2 HH tuples. Header comment: `(extended after each HH resolver pass)`.
- **`scripts/test-resolver-data-integrity.ts`**: `OVERRIDE_BATCHES` end + 2 HH tuples. Smoke-slug label `coverage smoke slugs exist in w40k-001..057 + hh-001..002`.

No script edits in this re-run; the prior commit's edits suffice once the Brief-101 reason-split (commit `1126e45`) lands the intended Guard contract.

### Scripts intentionally NOT touched (justified, unchanged from prior 4a run)

- **`scripts/seed-resolver-extensions.ts`** — fully generic JSON-loader (Brief-077 form), no hardcoded row list. The Phase-1 +6 factions / Phase-2 +10 locations / Phase-3 +60 characters and the alias-file additions are picked up automatically. Same pattern as Pass-7 / Pass-8 / Pass-9.
- **`scripts/apply-override-collections.ts`** — pure helper; no hardcoded range. Driven by the caller via the externalBookId→batch map (Brief-091 contract). Untouched.
- **`scripts/seed-data/collection-gaps.json`** — no entries added this wave. The HH anthology forward-refs are out-of-range deferred edges that will materialize on later HH waves via the idempotent `delete-then-insert` re-apply; no roster maintenance entry needed.
- **`scripts/seed-data/persons.json`** — unchanged at 96 rows. The apply's `ensurePersonsExist` reported `0 newly created in DB` for both batches (5 distinct slugs in HH-001, 6 in HH-002; all already present from the W40K corpus).
- **`scripts/seed-data/manual-overrides-ssot-hh-00{1,2}.json`** — no override edits required this wave (0 unknown facetIds verified — see facet-strip check below).
- **`scripts/db-counts.ts` / `scripts/seed-facets.ts` / `scripts/run-phase4-apply.sh`** — stable apply-side tooling; not touched.

### Facet-strip check (zero strips needed, unchanged from prior 4a run)

Union of facetIds across `manual-overrides-ssot-hh-001.json` + `manual-overrides-ssot-hh-002.json` against `facet-catalog.json`: **46 distinct facetIds, 0 unknown.** `facet-catalog.json` correctly stays out of scope; no `## Needs decision`-stop on the facet axis.

## Counts (Pre/Per-Batch/Post)

| Stage | works | work_factions | work_locations | work_characters | work_collections | work_persons | work_facets | factions | locations | characters | facet_values |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **PRE-APPLY (565)** | 565 | 1903 | 733 | 1220 | 147 | 524 | 11291 | 173 | 224 | 344 | 86 |
| Per-batch `ssot-hh-001` | 575 | 1940 | 745 | 1282 | 147 | 533 | 11488 | 179 | 234 | 404 | 86 |
| Per-batch `ssot-hh-002` | 585 | 1981 | 776 | 1325 | 147 | 541 | 11672 | 179 | 234 | 404 | 86 |
| **POST-APPLY (585)** | **585** | **1981** | **776** | **1325** | **147** | **541** | **11672** | **179** | **234** | **404** | **86** |
| Δ (wave 10) | **+20** | +78 | +43 | +105 | 0 | +17 | +381 | +6 | +10 | +60 | 0 |

(Source: `ingest/.last-run/phase4-digest.md` at this commit.)

**Reading the deltas.**
- `works +20`: HH-0001..HH-0020 — the wave's 20 new HH books, the HH-domain bootstrap milestone.
- `work_collections +0`: the three HH anthologies (`HH-0010 Tales of Heresy`, `HH-0016 Age of Darkness`, `HH-0020 The Primarchs`) have all their constituent edges **out-of-range** for this wave (HH-0117..HH-0120 / HH-0150..HH-0156 / HH-0157..HH-0165 — those constituents land on later HH waves). The cumulative re-apply will materialize the edges then (idempotent delete-then-insert, runbook §7). The 15 *in-range* forward refs reported by the dry are all W40K-internal cross-batch edges from the cumulative 001..057 history.
- `facet_values +0`: 0 unknown facetIds across both override files — zero strips needed, `facet-catalog.json` stayed correctly out of scope.
- Reference deltas (`factions/locations/characters +6/+10/+60`) match the Phase 1/2/3 row additions exactly — `seed-resolver-extensions.ts` (fully generic since Brief 077) picked up the JSON-side additions automatically.

## Reference-row deltas (JSON-side ↔ DB)

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

(JSON-side counts verified via `node -e "JSON.parse(fs.readFileSync(...)).length"`; pre-Pass-10 baseline = state at commit `1126e45`. DB counts from `db-counts.ts`; alias / policy / persons-seed-file rows are reference data not surfaced in `db-counts`.)

## Apply-side trias verification

The apply-side trias all green on the post-Brief-101-fix + Phase-4a-BATCHES-extension state:

| script | result |
| --- | --- |
| `npm run test:resolver` | **315 passed, 0 failed** (no resolver-test churn from 4a — that's Phases 1–3's scope) |
| `npm run test:resolver-data` | **resolver data integrity ok** (10 checks; smoke-slug label `w40k-001..057 + hh-001..002`) |
| `npm run test:resolver-coverage` | **exit 0** — totals factions=1981/2319, locations=776/1027, characters=1329/1736 against the cumulative range (W40K + HH-001..002 contributing to the surveyed pool) |
| `npm run test:collection-refs` | **10 passed, 0 failed** — the Brief-101 reason-split helper suite (7 classifier cases + 3 dry-guard reason-split cases: out-of-range > 0 does NOT abort; unknown-work > 0 aborts; both > 0 aborts on the unknown-work subset only) |
| `npm run test:apply-override-dry` | **ok** — `forward collection refs: 15; unresolvable constituent refs: 20; by reason: out-of-range=20, unknown-work=0`. The Guard now treats the 20 HH anthology forward-refs as informational deferred edges (dossier §7d's intended contract); only `unknown-work` would abort, and there are none. |
| `npm run lint` | 0 errors, 1 pre-existing `@next/next/no-page-custom-font` warning in `src/app/layout.tsx:44` (unchanged across Passes 5–9, out of scope) |
| `npm run typecheck` | 0 errors |

## Apply-Digest summary

`ingest/.last-run/phase4-digest.md` refreshed + committed:

```
Config: `scripts/resolver-pass.config.json` · apply-range: `ssot-hh-001 ssot-hh-002` · new wave:` ssot-hh-001 ssot-hh-002 `
PRE-APPLY:  565 works / 1903·733·1220·147·524·11291 junctions / 173·224·344·86 refs+facets
seed-resolver-extensions: ok
seed-facets: catalog values 86; newly inserted 0
applied ssot-hh-001: ok  → POST 575 works / 1940·745·1282·147·533·11488 junctions / 179·234·404·86 refs+facets
applied ssot-hh-002: ok  → POST 585 works / 1981·776·1325·147·541·11672 junctions / 179·234·404·86 refs+facets
DONE
```

Per-batch growth shape: HH-001 (HH-0001..HH-0010) adds +10 works · +37 wf · +12 wl · +62 wc · +9 wp; HH-002 (HH-0011..HH-0020) adds +10 works · +41 wf · +31 wl · +43 wc · +8 wp. Reference-row deltas (`factions/locations/characters +6/+10/+60`) all land on the HH-001 boundary because `seed-resolver-extensions.ts` runs once before the first batch.

## Anomalies / discretionary decisions

- **None.** The Brief-101 Guard-Fix lands the dossier §7d intended contract exactly; the 20 out-of-range HH anthology forward-refs are now informational and will materialize on later HH waves via the cumulative idempotent re-apply (runbook §7). No `## Needs decision`-stop. No facet strips. No FK traps. No persons auto-creation. The wave is the cleanest HH-domain bootstrap shape one could ask for.

## Halt-Discipline checklist (driver post-phase verification)

- One commit on this phase: ✅ (this report + the refreshed `ingest/.last-run/phase4-digest.md` in a single commit; HEAD moves).
- `git diff --name-only HEAD~..HEAD` ⊆ Phase-4a Write-Scope: ✅ (only `ingest/.last-run/phase4-digest.md` + `sessions/resolver-dossiers/resolver-pass-10-phase-4a-report.md`).
- JSON files syntactically valid: ✅ (no JSON files touched in this re-run — the JSON-side row + alias additions landed in Phases 1–3 and were verified there).
- Trias green: ✅ (table above — `test:apply-override-dry` reports out-of-range=20 informationally and exits ok; `test:collection-refs` 10/10 incl. the Brief-101 reason-split cases).
- Lint + typecheck clean: ✅ (0 lint errors, 1 unchanged pre-existing warning out of scope; 0 typecheck errors).
- `## Needs decision` block present: ❌ (none — the wave runs clean on the Brief-101-fixed Guard).
- ready-for-4b marker: ✅ (this header carries it).
- No Co-Author trailer: ✅ (commit message imperative-only, no `Co-Authored-By:` line).
