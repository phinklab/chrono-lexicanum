# Resolver-Pass 7 — Phase 4a (Integration/Apply) report

> Done-summary, self-enthalten. No `## Needs decision` — apply landed clean on the
> first try, all apply-side trias green, lint + typecheck clean. Wave
> `ssot-w40k-036..045` (W40K-0351..0450), cumulative `applyRange` 001..045.
> Ready for **4b**.

## What changed

### Trias batch-range extensions (Brief 091 cumulative applyRange)

- **`scripts/apply-override-dry.ts`**: `BATCHES` 001..035 → **001..045**; `EXPECTED_RANGES`
  factions `1500 → 1900`, locations `600 → 800`, characters `1200 → 1400` (Pass-6 flagged
  the faction/location maxima as next-wave-overflow risks; cumulative 450-book actuals
  1659/638/1074 confirmed it). Note the new maxima are sized for one more wave
  of headroom, matching the Pass-5 → Pass-6 bump style.
- **`scripts/test-resolver-coverage.ts`**: `BATCHES` 001..035 → 001..045; header
  + log strings updated.
- **`scripts/test-resolver-data-integrity.ts`**: `OVERRIDE_BATCHES` 001..035 → 001..045;
  smoke-slugs-check label updated.
- **`scripts/apply-override-collections.ts`**: untouched — pure helper, no hardcoded range
  (caller drives via the externalBookId→batch map; Brief 091 contract).

### Data files

- **`scripts/seed-data/collection-gaps.json`** (+1 entry): **W40K-0434 *Space Wolves
  (Legends)*** (dossier §7d spot-check, see "Decisions" below). Three explicitly
  "Space Wolves:"-titled shorts (W40K-0430 *Scent of a Traitor*, W40K-0432 *The Darkness
  of Angels*, W40K-0433 *Wrath of the Wolf* — all 2016, all already `short_story` in the
  roster) are confident constituents of the SW Legends anthology, but `book-roster.json`
  carries 0 constituent edges for W40K-0434. Documented with the Pass-6
  `needs_constituent_collection_edges` status (constituent works exist, only the roster
  *edges* are absent — a roster/SSOT-loop change, out of resolver-pass scope).
- **`scripts/seed-data/persons.json`** 73 → **78 rows** (+5) — `ensurePersonsExist`
  apply side-output, atomically appended (matches Pass-6 pattern). New wave-7 authors:
  Thomas Parrott (W40K-0360), Chris Dows (W40K-0388), Andy Clark (0445/0446), Robbie
  MacNiven (0442–0444), Josh Reynolds (0438–0441). Other wave authors already had rows
  pre-pass.

### Phase-4 apply digest (committed; the 4b input)

- **`ingest/.last-run/phase4-digest.md`** — fixed-size digest (Pre/Per-Batch/Post counts +
  per-batch ok markers). All 45 batches applied ok; new wave 036..045 got
  post-batch counts snapshots.

## Counts (Pflicht-Tabelle)

| Stage                  | works | work_factions | work_locations | work_characters | work_collections | work_persons | work_facets | factions | locations | characters | facet_values |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **PRE-APPLY (350)**    | 350   | 1424          | 543            | 844             | 109              | 325          | 7227        | 162      | 189       | 237        | 86           |
| Per-batch 036 (360)    | 360   | 1438          | 552            | 875             | 121              | 340          | 7415        | 166      | 201       | 297        | 86           |
| Per-batch 037 (370)    | 370   | 1465          | 562            | 932             | 127              | 350          | 7591        | 166      | 201       | 297        | 86           |
| Per-batch 038 (380)    | 380   | 1487          | 578            | 953             | 134              | 360          | 7782        | 166      | 201       | 297        | 86           |
| Per-batch 039 (390)    | 390   | 1513          | 585            | 986             | 137              | 370          | 7966        | 166      | 201       | 297        | 86           |
| Per-batch 040 (400)    | 400   | 1535          | 590            | 1001            | 139              | 380          | 8141        | 166      | 201       | 297        | 86           |
| Per-batch 041 (410)    | 410   | 1553          | 596            | 1006            | 139              | 390          | 8326        | 166      | 201       | 297        | 86           |
| Per-batch 042 (420)    | 420   | 1581          | 607            | 1024            | 139              | 399          | 8517        | 166      | 201       | 297        | 86           |
| Per-batch 043 (430)    | 430   | 1611          | 620            | 1042            | 139              | 407          | 8692        | 166      | 201       | 297        | 86           |
| Per-batch 044 (440)    | 440   | 1634          | 629            | 1060            | 139              | 415          | 8896        | 166      | 201       | 297        | 86           |
| Per-batch 045 (450)    | 450   | 1659          | 638            | 1074            | 142              | 424          | 9087        | 166      | 201       | 297        | 86           |
| **POST-APPLY (450)**   | 450   | 1659          | 638            | 1074            | 142              | 424          | 9087        | 166      | 201       | 297        | 86           |

**Wave deltas (350 → 450):** works `+100`; work_factions `+235`; work_locations `+95`;
work_characters `+230`; work_collections `+33`; work_persons `+99`; work_facets `+1860`;
factions `+4`; locations `+12`; characters `+60`; facet_values `+0`.

**Dry-run match:** dry predicted work_factions=1659, work_locations=638,
work_characters=1074 — **exact** match against the POST-APPLY DB. No drift.

## Reference-row deltas

- **factions: 162 → 166 (+4)** — Phase 1: `talons_of_the_emperor`, `senatorum_imperialis`,
  `house_chimaeros`, `house_draconis`. Plus 7 new aliases (Phase-1 report).
- **locations: 189 → 201 (+12)** — Phase 2: `ullanor`, `alaitoc`, `velchanos_magna`,
  `adrastapol`, `demetrius`, `loki`, `mistral`, `phall`, `rock`, `ulthwe`, `inwit`,
  `baal_secundus`. No new aliases (no cross-batch alias-consolidation cases this wave for
  Locations per dossier §7a).
- **characters: 237 → 297 (+60)** — Phase 3: 60 new rows across all clusters
  (Path-of-the-Eldar/Dark-Eldar, Macharian Crusade, Forges of Mars, Ahriman trilogy,
  Yarrick trilogy, Jarnhamar, Legacy of Caliban, Black Legion, AdMech, Phoenix Lords,
  Beast Arises, Castellan Crowe, Carcharodons, Imperial Knights, LtDM shorts, Mephiston).
  +5 new aliases (the 7a cross-batch consolidation pairs).
- **sectors: 8 → 8 (+0)** — Phase 2 didn't promote any new sector (the 12 new locations
  used `sector: null`; the sole exception `baal_secundus` reused the existing `tempestus`
  segmentum FK via the parent `baal` row).
- **facet_values: 86 → 86 (+0)** — **NO facet promotion**, as the config Phase-4 trigger
  predicted. The four wave books with `value_outside_vocabulary:facetIds` flags
  (W40K-0391, 0394, 0395, 0396) carry the flag as documentation-of-mapping-choice (e.g.
  "skitarii protagonist archetype has no exact protagonist_class value; tech_priest used
  as nearest Mechanicus class") — the actual `facetIds` arrays use only valid catalog
  values. Dry confirmed `missing facet ids: 0`; `seed-facets` inserted 0; no strip-of-
  unknown-id occurred.
- **persons: 73 → 78 (+5)** — apply auto-side-output via `ensurePersonsExist`.

## Decisions (judgment calls justified in-phase, no `## Needs decision` escalations)

- **`collection-gaps.json` +1: W40K-0434 *Space Wolves (Legends)* added; the three other
  Legends anthologies + *Ahriman: Exodus* + *Adeptus Mechanicus Omnibus* spot-checks
  **deferred to this report** (matches Pass-6 "Overfiend" discipline — defer rather than
  guess).** Confidence breakdown:
  - **W40K-0434 *Space Wolves (Legends)*** → 3 confident constituents (W40K-0430 *Scent
    of a Traitor*, W40K-0432 *Darkness of Angels*, W40K-0433 *Wrath of the Wolf* — all
    three share the SW Legends anthology's 2016 publication year, the explicit
    "Space Wolves:" title prefix, and `format: short_story` in the roster). **Added to
    `collection-gaps.json`** with `status: needs_constituent_collection_edges`.
  - **W40K-0427 *Ultramarines (Legends)*** → only W40K-0407 *At Gaius Point* (ADB short)
    confidently fits the Ultramarines theme; the other Batch-041 shorts are not
    Ultramarines-themed (Mantis Warriors / Astral Claws / Relic-quest / Returned-mystery /
    Orphans-of-the-Kraken-Scythes). **One confirmed constituent is too thin to justify a
    gaps entry** (Pass-6 added Architect of Fate with 4/4 confirmed). **Deferred.**
  - **W40K-0429 *Astra Militarum*** → no wave book is clearly AM-themed-short. **Deferred.**
  - **W40K-0431 *Shas'o*** → no wave book is clearly T'au-themed-short in the
    034..045 range. **Deferred.**
  - **W40K-0372 *Ahriman: Exodus*** → the 4 internal tales don't have own roster rows
    (this is a `needs_constituent_roster_entries` situation like *Green Tide*, not
    `needs_constituent_collection_edges`). Pre-existing outbound edge to the omnibus
    W40K-0373 is intact. **Deferred** — a roster/SSOT-loop change, distinct from
    Pass-6's edge-only deferrals.
  - **W40K-0393 *Adeptus Mechanicus Omnibus*** → confirmed 2/2 constituents in roster
    (W40K-0391 *Skitarius*, W40K-0392 *Tech-Priest*). The dossier hint "verify whether
    the third volume exists" → **no third volume in the cumulative roster**; Sanders'
    "trilogy" is a duology by current roster count. **No gap.** (Lore note: a 2017
    *Cult Mechanicus* short by Sanders exists outside the roster — that's an SSOT-loop
    candidate, not a resolver-pass concern.)

- **`EXPECTED_RANGES` bumped** for the 450-book cumulative sweep (factions max
  1500 → 1900, locations 600 → 800, characters 1200 → 1400). Pass-6 flagged the faction
  and location maxima as next-wave overflow risk; the actual 1659/638/1074 confirmed it
  (1659 > 1500, 638 > 600). The new maxima follow the Pass-5 → Pass-6 +30%-headroom
  style, giving one more wave of margin without becoming permissive.

- **`work_collections` curve verifies the Pass-6 OQ(14)(e) edges + the Pass-7
  omnibus/anthology constituents resolve cleanly in the cumulative re-apply.** Pre-apply
  109 → post-apply 142 (+33). Per-batch growth aligned with the wave's omnibus structure:
  036 +12 (Path-of-Eldar Omnibus + Path-of-Dark-Eldar Omnibus + Ahriman trilogy seed +
  Architect-of-Fate's 4 OQ(14)(e) edges activating when constituents re-applied), 037 +6
  (Macharian-Crusade Omnibus + Forges-of-Mars Omnibus), 038 +7 (Ahriman Omnibus +
  Yarrick Omnibus), 039 +3 (Legacy-of-Caliban Omnibus), 040 +2 (AdMech Omnibus, 2
  constituents), 041..044 flat (no omnibus content), 045 +3 (Fabius-Bile Omnibus). The
  range-aware forward-ref guard (Brief 091) stayed green throughout — `apply-override-dry`
  reports 15 forward refs and 0 unresolvable-constituent-refs, all 15 with both endpoints
  in `applyRange` 001..045.

- **Format / authorship `data_conflict` flags advisory only, not apply-blockers** (per
  dossier §7d):
  - 5 Batch-041 `format->short_story` flags (W40K-0402..0406, the Legends-of-the-
    Space-Marines shorts mistagged as `novel` in roster).
  - 1 Batch-041 `format->novel` flag on *Farsight* (W40K-0410, novella-vs-novel).
  - 1 Batch-043 `format->collection` flag on *Sons of Corax* (W40K-0428, anthology
    mistagged as `novel`).
  - 2 `authors->...` flags (W40K-0408 *The Last Detail* → Paul Kearney, W40K-0444
    *Carcharadons: Void Exile* → Robbie MacNiven).

  Resolver doesn't act on format / authors; flags are preserved verbatim in the override
  files for the audit cockpit to surface. Phase 4b will report them as audit findings,
  not apply errors.

- **`low_confidence` flags carried through as-is** (per dossier §7d): W40K-0359 + W40K-0444
  on characters, W40K-0400 + W40K-0430 + W40K-0435 on locations.

## Apply pattern

- **001..035** (pre-existing 350 books) = **idempotent re-apply** (delete-then-insert per
  junction; 0 new works, only junction churn for resolver-set changes — e.g. the OQ(14)(e)
  collection edges activating, character-aliases unifying multi-name characters across
  batches). Non-destructive, no facet promotion.
- **036..045** (new 100 books) = **first-time apply** (+100 works, ~10 per batch). Same
  resolver-set with the Phase 1–3 promotions; first time the wave's omnibi/anthologies
  get their `work_collections` edges seeded.

## Trias verification (post-apply, code-edits)

- `npm run test:resolver` → **236 passed, 0 failed**.
- `npm run test:resolver-data` → **resolver data integrity ok**. 10 checks all green
  incl. the updated "coverage smoke slugs exist in 001..045" check.
- `npm run test:resolver-coverage` → exit 0; 450 books surveyed. Totals (post-apply,
  cumulative): factions=1659/1978 (post-Brief-077-skip, 165 grand-alignment surface forms
  suppressed); locations=638/818 (post-Brief-084-skip, 14 location umbrellas suppressed);
  characters=1074/1399. Below-threshold smoke axes (e.g. *calgars-fury* characters=1/1,
  *baneblade* factions=2/2) are data findings, not failures.
- `npm run test:apply-override-dry` → `[apply-override-dry] ok`. Validation block:
  `missing roster externalBookIds: 0`, `missing facet ids: 0`, `invalid normalized roles: 0`,
  `invalid rating overrides: 0`, `missing resolved FK targets: 0`, `dangling JSON FK/alias
  refs: 0`, `forward collection refs: 15` (in-range, non-blocker — Brief 091),
  `unresolvable constituent refs: 0`.
- `npm run test:collection-refs` → **7 passed, 0 failed** (helper-unit suite for the
  forward-ref guard, unchanged from Brief 091).
- `npm run lint` → 0 errors, 1 pre-existing warning (`src/app/layout.tsx` Next.js custom
  fonts hint — Phase-4a out-of-scope, predates this pass).
- `npm run typecheck` → 0 errors.

## Files changed (Phase-4a scope only)

- `scripts/apply-override-dry.ts` (range + EXPECTED_RANGES)
- `scripts/test-resolver-coverage.ts` (range)
- `scripts/test-resolver-data-integrity.ts` (range)
- `scripts/seed-data/collection-gaps.json` (+1 entry)
- `scripts/seed-data/persons.json` (apply side-output, +5)
- `ingest/.last-run/phase4-digest.md` (committed digest)
- `sessions/resolver-dossiers/resolver-pass-7-phase-4a-report.md` (this file)

No facet-catalog edit. No override-file edit. No new -NNN script clone.

## Ready for 4b

✅ All apply-side trias + lint + typecheck green. The 4a-statusfile + the committed
`ingest/.last-run/phase4-digest.md` are 4b's only apply-side inputs (runbook §3 Phase 4b;
4b reads NEITHER the override files NOR the raw `phase4-apply-verbose.log` NOR
the apply-side scripts). Phase 4b proceeds with `scripts/verify-pass.ts --config
scripts/resolver-pass.config.json` (stdout digest), lint, typecheck, and the impl-report
polish — no second DB apply, no trias re-run.

Commit: `Resolver-Pass 7 Phase 4a (Integration/Apply) — ssot-w40k-036..045`
(no co-author trailer).
