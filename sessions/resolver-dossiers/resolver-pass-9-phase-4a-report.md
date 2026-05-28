# Resolver-Pass 9 — Phase 4a (Integration/Apply) report

> Done-summary, self-enthalten. No `## Needs decision` — apply landed clean on the
> first try, all apply-side trias green, lint + typecheck clean. Wave
> `ssot-w40k-052..057` (W40K-0511..0565, 55 books — **final W40K wave**),
> cumulative `applyRange` 001..057. Ready for **4b**.

## What changed

### Trias batch-range extensions (Brief 091 cumulative applyRange)

- **`scripts/apply-override-dry.ts`**: header comment `001..051 → 001..057`;
  `BATCHES` 001..051 → **001..057** (+6: 052, 053, 054, 055, 056, 057).
  **`EXPECTED_RANGES.factions.max` bumped 1900 → 2100.** The 565-book actuals
  land at `work_factions=1903`, just past the Pass-7-set 1900 ceiling (Pass-8
  had headroom 105 above its 1795 actual; Pass-9 +108 consumes it). New
  ceiling 2100 ≈ ~200 headroom (one full HH-pivot wave of growth on the
  faction axis). Locations / characters maxima untouched — actuals
  733 / 1220 still well inside `800 / 1400`.
- **`scripts/test-resolver-coverage.ts`**: header comment + `BATCHES` 001..051 →
  001..057; log line `manual-overrides-ssot-w40k-001..051 → 001..057`.
- **`scripts/test-resolver-data-integrity.ts`**: `OVERRIDE_BATCHES` 001..051 →
  001..057; smoke-slugs-check label `001..051 → 001..057`.
- **`scripts/apply-override-collections.ts`**: untouched — pure helper, no
  hardcoded range (caller drives via the externalBookId→batch map; Brief 091
  contract).
- **`scripts/seed-resolver-extensions.ts`**: untouched — fully generic, loads
  factions/sectors/locations/characters from JSON at runtime (no hardcoded row
  list since Brief 077). Picking up the Phase 1/2/3 reference-row additions
  (+2 factions, +11 locations, +20 characters, +4 faction-aliases, +2
  character-aliases) is automatic via the JSON loader.

### Data files

- **`scripts/seed-data/collection-gaps.json`**: **+3 entries** (per dossier §7d
  spot-checks; Pass-7 precedent for `needs_constituent_collection_edges`):
  - **W40K-0553 *The Twice-Dead King Omnibus*** → constituent **W40K-0564
    *Severed*** (Crowley, 2019). Roster already links Ruin (0551) + Reign
    (0552); dossier §7d + ssot-loop-log batch 056 explicit: the 2025 omnibus
    bundles "Ruin + Reign + Severed + shorts". All endpoints inside
    `applyRange` 001..057.
  - **W40K-0527 *Unholy Tales of Horror & Woe From The Imperium*** → 4
    constituents: **W40K-0501 *The Oubliette*** (Stearns), **W40K-0508
    *Sepulturum*** (Kyme), **W40K-0509 *The Deacon of Wounds*** (Annandale),
    **W40K-0518 *The Bookkeeper's Skull*** (Hill). All four exist as works in
    book-roster.json, none has a roster collection edge. Dossier §7d +
    ssot-loop-log batch 053 explicit.
  - **W40K-0526 *The Resting Places*** → 2 in-W40K-range constituents:
    **W40K-0521 *King of Pigs*** (Archer), **W40K-0524 *Pain Engine***
    (Thursten). The mixed_w40k_aos anthology also bundles AoS shorts that
    have no W40K roster rows (dossier §7d advisory; not added).
  Other 5 anthologies in this wave (W40K-0517 *The Accursed*, W40K-0537 *No
  Peace Among Stars*, W40K-0539 *No Good Men*, W40K-0543 *Broken City*,
  W40K-0544 *Sanction and Sin*, W40K-0546 *Once a Killer*) — no confident
  in-range constituents this pass, deferred per Pass-8 pattern.
- **`scripts/seed-data/persons.json`** 84 → **96 rows** (+12) —
  `ensurePersonsExist` apply side-output, atomically appended (matches
  Pass-6/7/8 pattern). New wave-9 authors: Kim Newman (W40K-0511 *The Vampire
  Genevieve*), James Brogdan (W40K-0515 *Blood Drinker*), Richard Strachan
  (W40K-0516 *Bird of Change*), Anna Stephens (W40K-0519 *Gothgul Hollow*),
  Chris Winterton (W40K-0520 *The Stacks*), J. H. Archer (W40K-0521 *King of
  Pigs*), Jeremy Lambert (W40K-0522 *The Somewhere Sister*), Jamie
  Mistry-Evans (W40K-0523 *The Gnarled Bough*), Chris Thursten (W40K-0524
  *Pain Engine*), Dale Lucas (W40K-0525 *Black-Eyed Saint*), Alec Worley
  (W40K-0547 *Dredge Runners* + W40K-0548 *The Wraithbone Phoenix*), Justin
  Wooley (W40K-0565 *Prisoners of Waaagh!*, roster-typo `Wooley` per dossier
  §7d note — Black Library canonical is `Woolley`, advisory only). Other
  wave authors already had rows pre-pass (Annandale, Hinks, Ozga, Hill, Wraight,
  Brooks, Crowley, Flowers, Haley, Clark, Thorpe, Kyme, Collins, Beer, Farrer,
  French).

### Phase-4 apply digest (committed; the 4b input)

- **`ingest/.last-run/phase4-digest.md`** — fixed-size digest (Pre/Per-Batch/Post
  counts + per-batch ok markers). All 57 batches applied ok; new wave 052..057
  got post-batch counts snapshots.

## Counts (Pflicht-Tabelle)

| Stage                  | works | work_factions | work_locations | work_characters | work_collections | work_persons | work_facets | factions | locations | characters | facet_values |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **PRE-APPLY (510)**    | 510   | 1795          | 683            | 1170            | 145              | 480          | 10242       | 171      | 214       | 325        | 86           |
| Per-batch 052 (520)    | 520   | 1804          | 684            | 1171            | 145              | 489          | 10447       | 173      | 225       | 345        | 86           |
| Per-batch 053 (530)    | 530   | 1824          | 689            | 1178            | 145              | 497          | 10623       | 173      | 225       | 345        | 86           |
| Per-batch 054 (540)    | 540   | 1851          | 701            | 1188            | 145              | 504          | 10807       | 173      | 225       | 345        | 86           |
| Per-batch 055 (550)    | 550   | 1873          | 722            | 1201            | 145              | 511          | 11004       | 173      | 225       | 345        | 86           |
| Per-batch 056 (560)    | 560   | 1892          | 729            | 1215            | 147              | 519          | 11191       | 173      | 225       | 345        | 86           |
| Per-batch 057 (565)    | 565   | 1903          | 733            | 1220            | 147              | 524          | 11291       | 173      | 225       | 345        | 86           |
| **POST-APPLY (565)**   | 565   | 1903          | 733            | 1220            | 147              | 524          | 11291       | 173      | 225       | 345        | 86           |

**Wave deltas (510 → 565):** works `+55`; work_factions `+108`; work_locations
`+50`; work_characters `+50`; work_collections `+2`; work_persons `+44`;
work_facets `+1049`; factions `+2`; locations `+11`; characters `+20`;
facet_values `+0`.

**Dry-run match:** dry predicted `work_factions=1903`, `work_locations=733`,
`work_characters=1220` — **exact** match against the POST-APPLY DB. No drift.

## Reference-row deltas

- **factions: 171 → 173 (+2)** — Phase 1: `ogryns` (parent `astra_militarum`,
  freq 2 Baggit-Clodde duology — grain-parity with Pass-8 `ratlings`),
  `sautekh_dynasty` (parent `necrons`, freq-1 lore-iconic *Severed* —
  Dynasty/Crownworld grain analog `kroot` under `tau`). Plus 4 new aliases
  (Phase-1 report: `Enforcers` → `adeptus_arbites`, `Argent Shroud` →
  `sisters_of_battle`, `Chaos Cultists` → `chaos`, `Chaos Cults` → `chaos`).
  Phase 1 also added 2 `specialCases` notes to `faction-policy.json` for
  `ogryns` / `sautekh_dynasty`; no new `browseRoots`.
- **locations: 214 → 225 (+11)** — Phase 2: 6 freq≥2 (`varangantua`, `alecto`,
  `antikef`, `sedh`, `anaxian_line`, `hive_blackbracken`) + 5 lore-iconic
  freq=1 (`imperial_palace`, `ghoul_stars`, `gathalamor`, `kamidar`,
  `the_spoil`). No new aliases (every promoted surface form is a direct
  canonical-name match). No new sectors (Alecto modeled as region-row in
  `locations.json` per Pass-8 `imperium_nihilus` / `pariah_nexus` precedent).
- **characters: 325 → 345 (+20)** — Phase 3: 1 cross-batch 7a consolidation
  (`agusto_zidarov`) + 11 7b spines (`djoseras`, `oltyx`, `yenekh`,
  `magister_sek`, `priad`, `baggit`, `clodde`, `tabidiah_kruger`,
  `inquisitor_rostov`, `ferren_areios`, `solomon_akurra`) + 8 lore-iconic
  freq=1 (`szarekh`, `nemesor_zahndrekh`, `vargard_obyron`, `trajann_valoris`,
  `kor_phaeron`, `makari`, `falx`, `iron_queen_orlah`). +2 new aliases:
  `Probator Agusto Zidarov` → `agusto_zidarov` (intra-pass 7a), `Ghazghkull
  Mag Uruk Thraka` → `ghazghkull_thraka` (**cross-pass 7a** — dossier-gap
  correction: existing Pass-7 row `ghazghkull_thraka` already covers this
  character; Phase 3 routed the longer Pass-9 surface form via alias instead
  of creating a duplicate row).
- **sectors: 8 → 8 (+0)** — Phase 2 didn't promote any new sector (all 11
  new locations used `sector: null` except `imperial_palace` which uses the
  existing `solar` FK).
- **facet_values: 86 → 86 (+0)** — **NO facet promotion**, as the dossier §7d
  predicted. The wave carried zero `value_outside_vocabulary:facetIds` flags
  (the only facet-relevant data_conflict is `audio_drama` on W40K-0547
  *Dredge Runners*, but that value was already in the catalog per loop-log
  batch 053 note). Dry confirmed `missing facet ids: 0`; `seed-facets`
  inserted 0; no strip-of-unknown-id occurred.
- **persons: 84 → 96 (+12)** — apply auto-side-output via `ensurePersonsExist`
  (see "Data files" above for the per-author breakdown).

## Decisions (judgment calls justified in-phase, no `## Needs decision` escalations)

- **3 `collection-gaps.json` entries added this wave** (W40K-0553
  Twice-Dead King Omnibus, W40K-0527 Unholy Tales, W40K-0526 Resting Places)
  — confident in-range constituents documented per Pass-7 precedent
  (`needs_constituent_collection_edges`). All endpoints inside applyRange
  001..057; defer the actual roster edges to an SSOT-loop / roster update
  (out of resolver-pass scope, exactly the contract for Pass-6/7's Architect
  of Fate / War for Armageddon Omnibus / Pass-7 Space Wolves Legends
  entries). Other 5 anthologies in this wave (Accursed, No Peace Among
  Stars, No Good Men, Broken City, Sanction and Sin, Once a Killer) — no
  confident in-range constituents; deferred per Pass-8 pattern.

- **`EXPECTED_RANGES.factions.max` bumped 1900 → 2100.** Pass-8 left this
  untouched because actuals 1795 had 105 headroom under 1900. Pass-9 actuals
  1903 just clear the old ceiling (Phase-1 promotions + 55 new books'
  faction junctions consumed the full headroom). New ceiling 2100 ≈ 197
  headroom — one full HH-pivot-wave of growth room on the faction axis.
  Locations max 800 and characters max 1400 untouched (733 / 1220 actuals
  still well inside).

- **`work_collections` curve confirms the dossier-§7d Twice-Dead King
  Omnibus + Severed gap is the only roster-edge addition needed in this
  wave's existing roster.** Pre-apply 145 → post-apply 147 (+2). Per-batch
  growth: 052/053/054/055 all flat (Crime / Horror anthologies with no
  in-range roster edges — the gaps now documented in `collection-gaps.json`),
  056 +2 (Twice-Dead King Omnibus W40K-0553 → Ruin/Reign edges resolve as
  same-batch when 056 lands), 057 +0. The range-aware forward-ref guard
  (Brief 091) stayed green throughout — `apply-override-dry` reports 15
  forward refs (unchanged from Pass-7/8 carry-through) and 0
  unresolvable-constituent-refs, all 15 with both endpoints in `applyRange`
  001..057.

- **Format / setting / authorship `data_conflict` flags advisory only, not
  apply-blockers** (per dossier §7d). The wave carries a heavy
  Horror-eShort + AoS swarm in batches 052/053:
  - 6 `format->novella` flags (W40K-0512/0513/0514/0515/0516/0520).
  - 4 `format->short_story` flags (W40K-0521/0522/0523/0524).
  - 2 `format->omnibus` flags (W40K-0511 *The Vampire Genevieve*,
    W40K-0527 *Unholy Tales*).
  - 1 `format->audio_drama` flag on W40K-0547 *Dredge Runners* (lore-correct
    Black Library 2020 full-cast audio drama; value already in
    facet-catalog).
  - 7 `setting->age_of_sigmar` flags (W40K-0512/0514/0516/0519/0522/0523/0525)
    + 1 `setting->warhammer_fantasy` flag (W40K-0511) + 1 `domain->mixed_w40k_aos`
    flag (W40K-0526).
  - 2 `title` typo flags (W40K-0519 `gothghul-hollow`, W40K-0529
    `The Gate of Bones`).
  - 2 `authors` flags (W40K-0556 `Justin Woolley`, W40K-0557 `Andi
    Ewington` — empty roster `authors[]` per dossier §7d).

  Resolver doesn't act on format / setting / title / authors; flags are
  preserved verbatim in the override files for the audit cockpit to surface.
  Phase 4b will report them as audit findings, not apply errors.

- **`low_confidence` flags carried through as-is** (per dossier §7d):
  - `low_confidence:factions` × 5 — W40K-0517 *Accursed*, W40K-0518
    *Bookkeeper's Skull*, W40K-0532 *Iron Kingdom*, W40K-0534 *Sea of
    Souls*, W40K-0563 *Auric Gods*.
  - `low_confidence:characters` × 8 — Horror-eShort cluster W40K-0512..0516,
    W40K-0520 plus two more.
  - `low_confidence:locations` × 1 — W40K-0513 *Isenbrach Horror*.

  Matches the loop-log's per-batch low-confidence pattern: confined-Horror
  pieces, AoS-flagged Horror eShorts where names aren't in coverage, recent
  low-coverage novellas.

## Apply pattern

- **001..051** (pre-existing 510 books) = **idempotent re-apply**
  (delete-then-insert per junction; 0 new works, only junction churn for
  resolver-set changes — e.g. the Phase-1 alias additions like
  `Enforcers`→`adeptus_arbites` retro-resolving earlier Crime mentions, the
  Phase-3 character row promotions resolving prior wave surface forms of
  `Ghazghkull` / `Magister Sek` / etc.). Non-destructive, no facet promotion.
- **052..057** (new 55 books) = **first-time apply** (+55 works; 052..056 ten
  per batch, 057 +5 = final W40K wave). Same resolver-set with the Phase
  1–3 promotions; first time the wave's omnibus W40K-0553 (Twice-Dead King)
  gets its in-roster `work_collections` edges seeded (0551/0552 → 0553,
  same-batch resolution on apply of 056).

## Trias verification (post-apply, code-edits)

- `npm run test:resolver` → **287 passed, 0 failed** (280 pre-Pass-9 + 7
  ninth-wave-block cases from Phases 1/2/3).
- `npm run test:resolver-data` → **resolver data integrity ok**. 10 checks
  all green incl. the updated "coverage smoke slugs exist in 001..057" check.
- `npm run test:resolver-coverage` → exit 0; 565 books surveyed. Totals
  (post-apply, cumulative): factions=1903/2240, locations=733/971,
  characters=1220/1629. Below-threshold smoke axes (e.g. *calgars-fury*
  characters=1/1, *baneblade* factions=2/2) are pre-existing data findings,
  not failures.
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

- `scripts/apply-override-dry.ts` (range + header + `EXPECTED_RANGES.factions.max`)
- `scripts/test-resolver-coverage.ts` (range + header + log label)
- `scripts/test-resolver-data-integrity.ts` (range + smoke-label)
- `scripts/seed-data/collection-gaps.json` (+3 entries: W40K-0553 / W40K-0527 / W40K-0526)
- `scripts/seed-data/persons.json` (apply side-output, +12)
- `ingest/.last-run/phase4-digest.md` (committed digest)
- `sessions/resolver-dossiers/resolver-pass-9-phase-4a-report.md` (this file)

No `seed-resolver-extensions.ts` edit (script is generic; JSON loader picks up
the Phase 1/2/3 row additions automatically). No `facet-catalog.json` edit
(wave carried zero `value_outside_vocabulary:facetIds`; would have been an
out-of-scope `## Needs decision` stop anyway). No override-file edit. No new
`-NNN` script clone.

## Final W40K wave — milestone

Per dossier §7d + loop-log batch 057 milestone note: this is the **last
W40K-only apply** before the SSOT loop pivots to Horus Heresy. Cumulative
totals reach **565/565 W40K books** in the authority layer
(`works=565`). The SSOT loop's next run flips into the HH domain. The
EXPECTED_RANGES bump above carries one HH-pivot wave of headroom on the
faction axis for the next pass; Phase 4b's impl report can flag the
milestone for the cockpit's per-domain coverage panel.

## Ready for 4b

✅ All apply-side trias + lint + typecheck green. The 4a-statusfile + the
committed `ingest/.last-run/phase4-digest.md` are 4b's only apply-side
inputs (runbook §3 Phase 4b; 4b reads NEITHER the override files NOR the
raw `phase4-apply-verbose.log` NOR the apply-side scripts). Phase 4b
proceeds with `scripts/verify-pass.ts --config scripts/resolver-pass.config.json`
(stdout digest), lint, typecheck, and the impl-report polish — no second
DB apply, no trias re-run.

Commit: `Resolver-Pass 9 Phase 4a (Integration/Apply) — ssot-w40k-052..057`
(no co-author trailer).
