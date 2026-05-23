# Resolver-Pass 8 — Phase 4a (Integration/Apply) report

> Done-summary, self-enthalten. No `## Needs decision` — apply landed clean on the
> first try, all apply-side trias green, lint + typecheck clean. Wave
> `ssot-w40k-046..051` (W40K-0451..0510), cumulative `applyRange` 001..051.
> Ready for **4b**.

## What changed

### Trias batch-range extensions (Brief 091 cumulative applyRange)

- **`scripts/apply-override-dry.ts`**: header comment `001..010 → 001..051`;
  `BATCHES` 001..045 → **001..051** (+6: 046, 047, 048, 049, 050, 051).
  `EXPECTED_RANGES` **untouched** — actuals for the 510-book sweep land at
  `work_factions=1795`, `work_locations=683`, `work_characters=1170`, comfortably
  inside the Pass-7-bumped maxima `1900 / 800 / 1400`.
- **`scripts/test-resolver-coverage.ts`**: header comment + `BATCHES` 001..045 →
  001..051; log line `manual-overrides-ssot-w40k-001..045 → 001..051`.
- **`scripts/test-resolver-data-integrity.ts`**: `OVERRIDE_BATCHES` 001..045 →
  001..051; smoke-slugs-check label `001..045 → 001..051`.
- **`scripts/apply-override-collections.ts`**: untouched — pure helper, no
  hardcoded range (caller drives via the externalBookId→batch map; Brief 091
  contract).
- **`scripts/seed-resolver-extensions.ts`**: untouched — fully generic, loads
  factions/sectors/locations/characters from JSON at runtime (no hardcoded row
  list since Brief 077). Picking up the Phase 1/2/3 reference-row additions is
  automatic via the JSON loader.

### Data files

- **`scripts/seed-data/collection-gaps.json`**: untouched. Dossier §7d
  spot-check flagged four anthologies with `roster collection? no`
  (W40K-0484 *Vaults of Obsidian*, W40K-0492 *The Wicked and the Damned*,
  W40K-0498 *Maledictions*, W40K-0507 *Anathemas*); per the dossier's own
  note, "constituents are mostly shorter pieces in Warhammer Horror imprint,
  not within the Pass-8 60 books" → none of the constituents are in the
  cumulative `applyRange` (no in-range collection edges to add this wave).
  Following the Pass-7 "Overfiend / Ahriman: Exodus" discipline — defer
  rather than guess — no `collection-gaps.json` entry added.
- **`scripts/seed-data/persons.json`** 78 → **84 rows** (+6) — `ensurePersonsExist`
  apply side-output, atomically appended (matches Pass-6/7 pattern). New
  wave-8 authors: Matt Westbrook (W40K-0462 *Meduson Wings*), Lora Gray
  (W40K-0494 *Invocations*, W40K-0502 *Five Candles*), Nicholas Kaufmann
  (W40K-0496 *The Child Foretold*), Jake Ozga (W40K-0497 *Skull Throne*),
  J.S. Stearns (W40K-0501 *The Oubliette*), James Brogden (W40K-0505 *The
  Cache*). Other wave authors already had rows pre-pass (Wraight, Werner,
  Fehervari, Guymer, Haley, French, Hill, Thorpe, Kelly, St. Martin,
  Reynolds, Clark, Parrott, Hinks, Cavan Scott, Annandale, McNeill, Kyme).

### Phase-4 apply digest (committed; the 4b input)

- **`ingest/.last-run/phase4-digest.md`** — fixed-size digest (Pre/Per-Batch/Post
  counts + per-batch ok markers). All 51 batches applied ok; new wave 046..051
  got post-batch counts snapshots.

## Counts (Pflicht-Tabelle)

| Stage                  | works | work_factions | work_locations | work_characters | work_collections | work_persons | work_facets | factions | locations | characters | facet_values |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **PRE-APPLY (450)**    | 450   | 1659          | 638            | 1074            | 142              | 424          | 9087        | 166      | 201       | 297        | 86           |
| Per-batch 046 (460)    | 460   | 1696          | 651            | 1096            | 145              | 434          | 9325        | 171      | 214       | 325        | 86           |
| Per-batch 047 (470)    | 470   | 1721          | 661            | 1110            | 145              | 444          | 9492        | 171      | 214       | 325        | 86           |
| Per-batch 048 (480)    | 480   | 1753          | 671            | 1121            | 145              | 454          | 9684        | 171      | 214       | 325        | 86           |
| Per-batch 049 (490)    | 490   | 1781          | 679            | 1168            | 145              | 463          | 9877        | 171      | 214       | 325        | 86           |
| Per-batch 050 (500)    | 500   | 1793          | 682            | 1170            | 145              | 471          | 10069       | 171      | 214       | 325        | 86           |
| Per-batch 051 (510)    | 510   | 1795          | 683            | 1170            | 145              | 480          | 10242       | 171      | 214       | 325        | 86           |
| **POST-APPLY (510)**   | 510   | 1795          | 683            | 1170            | 145              | 480          | 10242       | 171      | 214       | 325        | 86           |

**Wave deltas (450 → 510):** works `+60`; work_factions `+136`; work_locations
`+45`; work_characters `+96`; work_collections `+3`; work_persons `+56`;
work_facets `+1155`; factions `+5`; locations `+13`; characters `+28`;
facet_values `+0`.

**Dry-run match:** dry predicted `work_factions=1795`, `work_locations=683`,
`work_characters=1170` — **exact** match against the POST-APPLY DB. No drift.

## Reference-row deltas

- **factions: 166 → 171 (+5)** — Phase 1: `kroot`, `ratlings`, `traitor_guard`,
  `lamenters`, `blood_drinkers`. Plus 7 new aliases (Phase-1 report:
  `Adeptus Ministorum` → `ecclesiarchy`, `High Lords of Terra` →
  `senatorum_imperialis`, `Cadian Shock` → `cadian_shock_troops`,
  `Officio Prefectus` → `commissariat`, `Ordo Sepulturum` → `inquisition`,
  `Saim-Hann` → `eldar`, `Ziasuthra` → `eldar`).
- **locations: 201 → 214 (+13)** — Phase 2: `blackstone_fortress`, `precipice`,
  `crannog_mons`, `malouri`, `almace`, `tizca`, `thennos`, `saim_hann`,
  `dominicus_prime`, `malveil`, `theotokos`, `vansen_falls`, `grayloc_manor`.
  No new aliases (no cross-batch alias-consolidation cases this wave for
  Locations per dossier §7a).
- **characters: 297 → 325 (+28)** — Phase 3: 28 new rows across all clusters
  (Warped Galaxies kids, Vaults of Terra, Watchers of the Throne, Horusian
  Wars, Dark Imperium, Cadian Saga, Blackstone Fortress, Iyanden, Devastation
  of Baal, Iron Hands). +1 new alias (`Zelia` → `zelia_lor` cross-batch
  consolidation, dossier §7a Case A).
- **sectors: 8 → 8 (+0)** — Phase 2 didn't promote any new sector (the 13 new
  locations used `sector: null` for most; `crannog_mons` / `malouri` /
  `thennos` referenced the existing `obscurus` / `tempestus` segmentum FKs;
  `tizca` referenced existing `obscurus`).
- **facet_values: 86 → 86 (+0)** — **NO facet promotion**, as the dossier §7d
  predicted. The wave carried zero `value_outside_vocabulary:facetIds` flags
  (dossier §7d explicit: "Unlike Pass 7, no override file in this wave
  flagged unknown facetIds in the §6 scan"). Dry confirmed `missing facet
  ids: 0`; `seed-facets` inserted 0; no strip-of-unknown-id occurred.
- **persons: 78 → 84 (+6)** — apply auto-side-output via `ensurePersonsExist`
  (see "Data files" above for the per-author breakdown).

## Decisions (judgment calls justified in-phase, no `## Needs decision` escalations)

- **No `collection-gaps.json` entries this wave** (dossier §7d spot-check).
  Four anthologies flagged `roster collection? no` (W40K-0484
  *Vaults of Obsidian*, W40K-0492 *The Wicked and the Damned*, W40K-0498
  *Maledictions*, W40K-0507 *Anathemas*), but the dossier's own §7d note
  is explicit: "constituents are mostly shorter pieces in Warhammer Horror
  imprint, not within the Pass-8 60 books". None of the four anthologies
  has a confident in-range constituent in 001..051; adding empty / out-of-
  range gap entries would not surface in any audit replica. **Deferred**
  in the Pass-7 "Ahriman: Exodus" sense — these are
  `needs_constituent_roster_entries` situations (the constituent shorts
  don't have roster rows yet), an SSOT-loop concern, not a Phase-4a action.

- **`EXPECTED_RANGES` left untouched** (factions 500..1900, locations
  180..800, characters 430..1400). The 510-book actuals 1795/683/1170 land
  comfortably inside the Pass-7-bumped maxima with one wave of headroom
  remaining (max-vs-actual: factions 105 / locations 117 / characters 230).
  No need to bump for Pass 8.

- **`work_collections` curve confirms the Pass-6/7 OQ(14)(e) edges + the
  Pass-8 omnibus constituent resolves cleanly in the cumulative re-apply.**
  Pre-apply 142 → post-apply 145 (+3). Per-batch growth aligned with the
  wave's omnibus/anthology structure: 046 +3 (Vaults-of-Terra Omnibus
  W40K-0459 → W40K-0456/0457/0458 — the three confirmed Crowl/Spinoza
  constituents in same batch), 047–051 flat (the four anthologies above
  have no in-range constituents this pass). The range-aware forward-ref
  guard (Brief 091) stayed green throughout — `apply-override-dry` reports
  15 forward refs (carried-through Pass-6/7) and 0
  unresolvable-constituent-refs, all 15 with both endpoints in `applyRange`
  001..051.

- **Format / setting / authorship `data_conflict` flags advisory only, not
  apply-blockers** (per dossier §7d). The wave carries a heavy Warhammer-
  Horror swarm in batches 050/051:
  - 8 `format->short_story` flags (W40K-0493 *The Hunt*, W40K-0495
    *Nightbleed*, W40K-0496 *The Child Foretold*, W40K-0497 *Skull Throne*,
    W40K-0502 *Five Candles*, W40K-0503 *A Moment of Cruelty*, W40K-0504
    *Pentimento*, W40K-0505 *The Cache*).
  - 4 `setting->age_of_sigmar` flags (W40K-0493, W40K-0497, W40K-0502,
    W40K-0503).
  - 2 `format->collection` flags (W40K-0468 *Divination*, W40K-0473
    *Minka Lesk: The Last Whiteshield*).
  - 2 `format->anthology` flags (W40K-0494 *Invocations*, W40K-0510
    *The Harrowed Paths*).
  - 1 `authors->multi-author` flag on W40K-0494 *Invocations* (10-author
    anthology vs roster's single-author tag).
  - 1 `title->Medusan Wings` flag on W40K-0462 *Meduson Wings* (dossier §7d
    note: "Medusan Wings" is lore-correct, but the slug stays as roster has
    it — not a resolver action).

  Resolver doesn't act on format / setting / authors; flags are preserved
  verbatim in the override files for the audit cockpit to surface. Phase
  4b will report them as audit findings, not apply errors.

- **`low_confidence` flags carried through as-is** (per dossier §7d): heavy
  concentration in the Warhammer-Horror batches 050/051. Affected books:
  W40K-0455 (chars), W40K-0458 (locs), W40K-0470 (factions), W40K-0480
  (rating), W40K-0501/0502/0504/0505 (factions), W40K-0506 (chars), W40K-0507
  (3-way: factions + locs + chars), W40K-0510 (2-way: factions + locs).

## Apply pattern

- **001..045** (pre-existing 450 books) = **idempotent re-apply**
  (delete-then-insert per junction; 0 new works, only junction churn for
  resolver-set changes — e.g. the Phase-1 alias additions like
  `Adeptus Ministorum`→`ecclesiarchy` retro-resolving older surface forms,
  Phase-3 character row promotions retro-resolving earlier mentions of
  `Mortarion`/`Typhus`/`Yvraine`/etc.). Non-destructive, no facet promotion.
- **046..051** (new 60 books) = **first-time apply** (+60 works, exactly 10
  per batch). Same resolver-set with the Phase 1–3 promotions; first time
  the wave's omnibus W40K-0459 gets its `work_collections` edges seeded.

## Trias verification (post-apply, code-edits)

- `npm run test:resolver` → **267 passed, 0 failed**.
- `npm run test:resolver-data` → **resolver data integrity ok**. 10 checks
  all green incl. the updated "coverage smoke slugs exist in 001..051" check.
- `npm run test:resolver-coverage` → exit 0; 510 books surveyed. Totals
  (post-apply, cumulative): factions=1795/2116 (post-Brief-077-skip, 165
  grand-alignment surface forms suppressed); locations=683/898 (post-Brief-
  084-skip, 14 location umbrellas suppressed); characters=1170/1535.
  Below-threshold smoke axes (e.g. *calgars-fury* characters=1/1, *baneblade*
  factions=2/2) are pre-existing data findings, not failures.
- `npm run test:apply-override-dry` → `[apply-override-dry] ok`. Validation
  block: `missing roster externalBookIds: 0`, `missing facet ids: 0`,
  `invalid normalized roles: 0`, `invalid rating overrides: 0`,
  `missing resolved FK targets: 0`, `dangling JSON FK/alias refs: 0`,
  `forward collection refs: 15` (in-range, non-blocker — Brief 091),
  `unresolvable constituent refs: 0`.
- `npm run test:collection-refs` → **7 passed, 0 failed** (helper-unit suite
  for the forward-ref guard, unchanged from Brief 091).
- `npm run lint` → 0 errors, 1 pre-existing warning (`src/app/layout.tsx`
  Next.js custom fonts hint — Phase-4a out-of-scope, predates this pass).
- `npm run typecheck` → 0 errors.

## Files changed (Phase-4a scope only)

- `scripts/apply-override-dry.ts` (range + header)
- `scripts/test-resolver-coverage.ts` (range + header + log label)
- `scripts/test-resolver-data-integrity.ts` (range + smoke-label)
- `scripts/seed-data/persons.json` (apply side-output, +6)
- `ingest/.last-run/phase4-digest.md` (committed digest)
- `sessions/resolver-dossiers/resolver-pass-8-phase-4a-report.md` (this file)

No `seed-resolver-extensions.ts` edit (script is generic; JSON loader picks up
the Phase 1/2/3 row additions automatically). No `collection-gaps.json` edit
(see Decisions). No `facet-catalog.json` edit (wave carried zero
`value_outside_vocabulary:facetIds`; would have been an out-of-scope
`## Needs decision` stop anyway). No override-file edit. No new `-NNN`
script clone.

## Ready for 4b

✅ All apply-side trias + lint + typecheck green. The 4a-statusfile + the
committed `ingest/.last-run/phase4-digest.md` are 4b's only apply-side
inputs (runbook §3 Phase 4b; 4b reads NEITHER the override files NOR the
raw `phase4-apply-verbose.log` NOR the apply-side scripts). Phase 4b
proceeds with `scripts/verify-pass.ts --config scripts/resolver-pass.config.json`
(stdout digest), lint, typecheck, and the impl-report polish — no second
DB apply, no trias re-run.

Commit: `Resolver-Pass 8 Phase 4a (Integration/Apply) — ssot-w40k-046..051`
(no co-author trailer).
