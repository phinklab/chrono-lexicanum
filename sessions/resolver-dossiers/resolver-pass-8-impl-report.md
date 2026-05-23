---
pass: 8
role: implementer
date: 2026-05-23
status: implemented
wave: ssot-w40k-046..051
ids: W40K-0451..W40K-0510
branch: codex/ingest-batches-resolver-w40k-rest
runbook: sessions/resolver-pass-runbook.md
config: scripts/resolver-pass.config.json
dossier: sessions/resolver-dossiers/resolver-pass-8-dossier.md
commits:
  - bcfdf6c  # Phase 0 (Preflight/Dossier)
  - f7e7f85  # Phase 1 (Factions)
  - 47556f6  # Phase 2 (Locations)
  - 2477966  # Phase 3 (Characters)
  - 4694202  # Phase 4a (Integration/Apply)
  # Phase 4b (Verify/Report) is the commit carrying this report.
---

# Resolver-Pass 8 — impl report (ssot-w40k-046..051 / W40K-0451..0510)

## Summary

Crystallized the eighth wave (60 books, not the usual 100 — the final 60 of the
current W40K bootstrap roster) into the resolver reference layer and re-applied
all **510** W40K books to Postgres, taking the corpus from **450 → 510**. Brief
094 brief-free contract: runbook + per-pass config + dossier only, no per-pass
architect brief. Brief 091 6-phase 4a/4b split (0 / 1 / 2 / 3 / 4a / 4b),
`/clear`-separated, one commit per phase; the 4a status file + the committed
Apply-Digest were 4b's only apply-side inputs (no override files, no raw apply
log, no apply-side scripts read in 4b). Stable config-driven Phase-4 tooling
(`run-phase4-apply.sh`, `verify-pass.ts`, `db-counts.ts`, `seed-facets.ts`), no
`-NNN` clones. Ran supervised / axis-sliced (not via the headless driver).

Reference rows (Phases 1–3, seeded to DB in Phase 4a): factions **166→171**
(+5), locations **201→214** (+13), characters **297→325** (+28); aliases faction
48→55 (+7), location 15→15 (+0), character 39→40 (+1). DB junctions PRE→POST:
`work_factions 1659→1795` (+136), `work_locations 638→683` (+45),
`work_characters 1074→1170` (+96), `work_collections 142→145` (+3),
`work_persons 424→480` (+56), `work_facets 9087→10242` (+1155).
`facet_values 86→86` — **no facet promotion** (dossier §7d explicit: the wave
carried zero `value_outside_vocabulary:facetIds` flags; dry confirmed `missing
facet ids: 0`, nothing stripped, `facet-catalog.json` untouched). Dry-run
prediction == DB POST-APPLY exact. All trias green in 4a; lint + typecheck +
verify-pass digest green in 4b.

**No headline judgment call this pass.** `EXPECTED_RANGES` left untouched —
the 510-book actuals 1795/683/1170 land comfortably inside the Pass-7-bumped
maxima 1900/800/1400 with one wave of headroom remaining. No facet add. No
guard relaxation. No schema touch. No `collection-gaps.json` entry despite
four wave anthologies flagged `roster collection? no` (dossier §7d): their
constituents are Warhammer-Horror shorts outside the cumulative `applyRange`
001..051, so adding empty gap entries wouldn't surface in any audit replica
— deferred Pass-7-"Ahriman: Exodus"-style as `needs_constituent_roster_entries`
situations (an SSOT-loop concern, not a Phase-4a action).

## What I did

The pass is a 6-phase sequence; Phases 0–3 + 4a landed in their own commits
(above) with full per-phase reports. Phase 4b is **read-only** — it ran
`scripts/verify-pass.ts --config …` (stdout digest), `lint`, `typecheck`, and
polished this report from the 4a status file + the Apply-Digest + the
Verify-Digest. No second DB apply, no trias re-run.

### Per-phase recap (detail in the phase reports)

- **Phase 0 — Preflight/Dossier:** `scripts/aggregate-surface-forms.ts --config …`
  produced 6 of the 7 dossier sections deterministically; the 7th
  (needs-decision / cross-batch alias candidates) was synthesized from
  tail-reads of the wave's loop-log blocks. No override files read in-context.
- **Phase 1 — Factions (+5):** `kroot`, `ratlings`, `traitor_guard`,
  `lamenters`, `blood_drinkers` (Tau auxiliaries, Astra Militarum ratling
  abhumans, lost-loyalty Guard regiments, Blood Angels successors). +7 aliases
  (`Adeptus Ministorum` → `ecclesiarchy`, `High Lords of Terra` →
  `senatorum_imperialis`, `Cadian Shock` → `cadian_shock_troops`, `Officio
  Prefectus` → `commissariat`, `Ordo Sepulturum` → `inquisition`,
  `Saim-Hann` → `eldar`, `Ziasuthra` → `eldar`). All other wave Factions
  (Watchers of the Throne, Death Guard, Dark Imperium Primaris, Cadian Saga
  regiments, Iyanden, Iron Hands, Blackstone Fortress factions, …) already
  existed in `factions.json` → idempotent.
- **Phase 2 — Locations (+13):** `blackstone_fortress`, `precipice`,
  `crannog_mons`, `malouri`, `almace`, `tizca`, `thennos`, `saim_hann`,
  `dominicus_prime`, `malveil`, `theotokos`, `vansen_falls`, `grayloc_manor`.
  `sector/gx/gy` null for most freestanding rows; `crannog_mons` / `malouri` /
  `thennos` referenced existing `obscurus` / `tempestus` segmentum FKs;
  `tizca` referenced existing `obscurus`. No new aliases (no cross-batch
  alias-consolidation candidates this wave per dossier §7a). No new vessel
  row.
- **Phase 3 — Characters (+28):** the wave's distributed roster (Warped
  Galaxies kids, Vaults of Terra, Watchers of the Throne, Horusian Wars, Dark
  Imperium, Cadian Saga, Blackstone Fortress, Iyanden, Devastation of Baal,
  Iron Hands). +1 cross-batch alias-consolidation (`Zelia` → `zelia_lor`,
  dossier §7a Case A — Warped Galaxies kids' surname spelled out in later
  batches). `primaryFactionId` of new rows points at the Phase-1 faction set
  (FK-clean, runbook §5).

### Phase 4 — Integration / Apply / Verify (4a + 4b)

- **Trias batch-range extension** — `apply-override-dry.ts`,
  `test-resolver-coverage.ts`, `test-resolver-data-integrity.ts`: cumulative
  range `001..045` → **`001..051`**; smoke-slug list updated to the config
  `verify.smokeSlugs` (one per batch 046..051). `apply-override-collections.ts`
  untouched (pure helper, no hardcoded range; Brief 091 contract).
- **`EXPECTED_RANGES` left untouched** (factions 500..1900, locations
  180..800, characters 430..1400). The 510-book actuals 1795/683/1170 land
  comfortably inside the Pass-7-bumped maxima with one wave of headroom
  remaining (max-vs-actual: factions 105 / locations 117 / characters 230).
- **Re-apply** via `scripts/run-phase4-apply.sh scripts/resolver-pass.config.json`
  (digest-only): seeded resolver-extensions + facets non-destructively, then
  applied `001..051` idempotently (`001..045` = delete-then-insert per
  junction, 0 new works; `046..051` = first-time apply, +60 works). Digest:
  `ingest/.last-run/phase4-digest.md` (committed); raw per-batch output stays
  in the gitignored verbose log.
- **`persons.json` 78→84** (+6 wave-8 authors: Matt Westbrook, Lora Gray,
  Nicholas Kaufmann, Jake Ozga, J.S. Stearns, James Brogden — all from the
  050/051 Warhammer Horror swarm) — `ensurePersonsExist` apply side-output,
  atomically appended (matches Pass-6/7 pattern).
- **`collection-gaps.json` untouched.** Four wave anthologies flagged
  `roster collection? no` (W40K-0484 *Vaults of Obsidian*, W40K-0492 *The
  Wicked and the Damned*, W40K-0498 *Maledictions*, W40K-0507 *Anathemas*);
  per the dossier's own §7d note, "constituents are mostly shorter pieces in
  Warhammer Horror imprint, not within the Pass-8 60 books" → none of the
  four anthologies has a confident in-range constituent in 001..051. Deferred
  in the Pass-7 *Ahriman: Exodus* sense — see Decisions.
- **Verify** (Phase 4b): `scripts/verify-pass.ts --config …` emits the
  Verify-Digest to stdout (digest below); `lint` + `typecheck` clean. No
  second DB apply, no trias re-run.

## Counts (Pflicht-Tabelle)

| Stage | works | work_factions | work_locations | work_characters | work_collections | work_persons |
| --- | --- | --- | --- | --- | --- | --- |
| Pre-Apply (450) | 450 | 1659 | 638 | 1074 | 142 | 424 |
| Per-batch 046 (460) | 460 | 1696 | 651 | 1096 | 145 | 434 |
| Per-batch 047 (470) | 470 | 1721 | 661 | 1110 | 145 | 444 |
| Per-batch 048 (480) | 480 | 1753 | 671 | 1121 | 145 | 454 |
| Per-batch 049 (490) | 490 | 1781 | 679 | 1168 | 145 | 463 |
| Per-batch 050 (500) | 500 | 1793 | 682 | 1170 | 145 | 471 |
| **Post-Re-Apply 001..051 (510)** | **510** | **1795** | **683** | **1170** | **145** | **480** |
| Δ (wave 8) | +60 | +136 | +45 | +96 | +3 | +56 |

Reference rows: `factions 166→171`, `locations 201→214`, `characters 297→325`.
`facet_values 86→86` (no add; `seed-facets` inserted 0). `work_facets
9087→10242` (+1155). `persons.json 78→84` (+6 authors). **Dry-run prediction
(work_factions 1795 / locations 683 / characters 1170) matches DB POST-APPLY
exactly.** Apply pattern: `001..045` = idempotent re-apply (delete-then-insert,
0 new works); `046..051` = first-time apply (+60 works, 10/batch).

`work_collections` grew +3; the per-batch curve (046 +3, 047 +0, 048 +0, 049
+0, 050 +0, 051 +0) is fully accounted for by the wave's one in-range omnibus
W40K-0459 *Watchers of the Throne Omnibus* binding three Crowl/Spinoza
constituents (W40K-0456/0457/0458) all in batch 046. The four flagged
anthologies in batches 050/051 contributed zero edges this wave (their
shorter-piece constituents are outside `applyRange` 001..051). The
range-aware forward-ref guard (Brief 091) stayed green throughout — 15
in-range forward refs (carried from Pass-6/7), 0 unresolvable-constituent-refs.

## Decisions I made

- **No `collection-gaps.json` entries this wave** (dossier §7d spot-check).
  Four anthologies flagged `roster collection? no` — W40K-0484 *Vaults of
  Obsidian*, W40K-0492 *The Wicked and the Damned*, W40K-0498 *Maledictions*,
  W40K-0507 *Anathemas* — but the dossier's own §7d note is explicit:
  "constituents are mostly shorter pieces in Warhammer Horror imprint, not
  within the Pass-8 60 books". None of the four has a confident in-range
  constituent in 001..051; adding empty / out-of-range gap entries would not
  surface in any audit replica. **Deferred** in the Pass-7 *Ahriman: Exodus*
  sense — these are `needs_constituent_roster_entries` situations (the
  constituent shorts don't have roster rows yet), an SSOT-loop concern, not
  a Phase-4a action.
- **`EXPECTED_RANGES` left untouched** (factions 500..1900, locations
  180..800, characters 430..1400). The 510-book actuals land comfortably
  inside the Pass-7-bumped maxima with one wave of headroom remaining
  (factions 1795/1900, locations 683/800, characters 1170/1400). No bump
  needed for Pass 8.
- **No facet promotion / no stripping.** The wave carried zero
  `value_outside_vocabulary:facetIds` flags (dossier §7d explicit: "Unlike
  Pass 7, no override file in this wave flagged unknown facetIds in the §6
  scan"). Dry confirmed `missing facet ids: 0`; `seed-facets` inserted 0;
  no strip-of-unknown-id occurred. `facet-catalog.json` untouched (a
  Call-2-style facet add would have been a `## Needs decision` stop anyway,
  per the runbook's deliberate scope-exclusion).
- **Format / setting / authorship `data_conflict` flags advisory only**
  (dossier §7d). The Warhammer-Horror swarm in batches 050/051 is the
  dominant source:
  - 8 `format->short_story` flags (W40K-0493 *The Hunt*, W40K-0495
    *Nightbleed*, W40K-0496 *The Child Foretold*, W40K-0497 *Skull Throne*,
    W40K-0502 *Five Candles*, W40K-0503 *A Moment of Cruelty*, W40K-0504
    *Pentimento*, W40K-0505 *The Cache*).
  - 4 `setting->age_of_sigmar` flags (W40K-0493, W40K-0497, W40K-0502,
    W40K-0503 — Warhammer Horror imprint cross-pollination).
  - 2 `format->collection` flags (W40K-0468 *Divination*, W40K-0473
    *Minka Lesk: The Last Whiteshield*).
  - 2 `format->anthology` flags (W40K-0494 *Invocations*, W40K-0510
    *The Harrowed Paths*).
  - 1 `authors->multi-author` flag on W40K-0494 *Invocations* (10-author
    anthology vs roster's single-author tag).
  - 1 `title->Medusan Wings` flag on W40K-0462 *Meduson Wings* (dossier §7d:
    "Medusan Wings" is lore-correct, but the slug stays as roster has it —
    not a resolver action).
  Resolver doesn't act on format / setting / authors; flags preserved
  verbatim in the override files for the audit cockpit to surface (the
  delta vs Pass-7's pattern is visible in the 4b audit replica below).
- **`low_confidence` flags carried through as-is** (dossier §7d): heavy
  concentration in the Warhammer-Horror batches 050/051. Affected books:
  W40K-0455 (chars), W40K-0458 (locs), W40K-0470 (factions), W40K-0480
  (rating), W40K-0501/0502/0504/0505 (factions), W40K-0506 (chars),
  W40K-0507 (3-way: factions + locs + chars), W40K-0510 (2-way: factions +
  locs). Visible as elevated gap/drift counts in the 4b NEW-range replica.

## Verification

- **Trias green (post-Phase-4a):** `test:resolver` **267/0**,
  `test:resolver-data` ok (10/10 integrity checks incl. updated 001..051
  coverage smoke-slugs check), `test:resolver-coverage` exit 0 (510 books
  surveyed; totals factions=1795/2116 post-Brief-077-skip, locations=683/898
  post-Brief-084-skip, characters=1170/1535; below-threshold smoke axes are
  pre-existing data findings, not failures),
  `test:apply-override-dry` **ok** (`missing roster externalBookIds=0`,
  `missing facet ids=0`, `invalid normalized roles=0`, `invalid rating
  overrides=0`, `missing resolved FK targets=0`, `dangling JSON FK/alias
  refs=0`; `forward collection refs=15` in-range non-blocker per Brief 091;
  `unresolvable constituent refs=0`),
  `test:collection-refs` **7/0** (Brief-091 helper-unit suite).
- **Lint (Phase 4b):** 0 errors, 1 pre-existing `no-page-custom-font` warning
  in `src/app/layout.tsx` (unchanged across passes 5/6/7/8, out of scope).
- **Typecheck (Phase 4b):** 0 errors.
- **Apply digest** (`ingest/.last-run/phase4-digest.md`, committed in 4a):
  all 51 batches `ok`; seed-resolver-extensions ok; seed-facets 0 new.
- **Verify digest** (`verify-pass.ts --config …`, stdout):
  - **Smoke slugs (f/l/c/in_coll), one per batch 046..051:**
    `the-eye-of-medusa 2/2/1/0` (W40K-0460),
    `cadian-honour 2/0/1/0` (W40K-0470),
    `masters-of-shadow 2/0/0/0` (W40K-0480),
    `plague-of-the-nurglings 4/0/4/0` (W40K-0490),
    `the-colonels-monograph 1/2/0/0` (W40K-0500),
    `the-harrowed-paths 0/0/0/0` (W40K-0510). The
    `plague-of-the-nurglings 4/0/4` confirms the Plague War Death Guard
    roster + the four Mortarion/Typhus/Felthius/Vorx characters landing on
    the wave-3 Phase-3 promotions retro-resolving here; the
    `the-harrowed-paths 0/0/0/0` reflects the dossier §7d call —
    a 12-author short-story anthology where individual shorts carry no
    resolved entities at roster level (advisory `format->anthology` flag
    preserved). No collection-membership rows for these six (the wave's
    only omnibus is W40K-0459 *Watchers of the Throne Omnibus*, not in the
    smoke list).
  - **Rating coverage 0451..0510:** **59 rated (all goodreads), 1 null,
    60 total** (the single null is acceptable for a 60-book wave; not a
    Phase-4a action).
  - **Audit replica:** OLD `0001..0450` = 450w / **188 drift** / **184 gap**
    / 134 in_coll; NEW `0451..0510` = 60w / **25 drift** / **37 gap** /
    **3 in_coll**. The NEW-range `gap_works=37 / 60` (~62 %) reflects the
    Warhammer-Horror swarm — short-story books with empty
    factions/locations/characters junctions are gap-counted by the audit
    SQL but are correct per the roster (the anthology hosts the constituent
    shorts, not its own roster). The NEW-range `in_coll=3` ties to the
    three W40K-0456/0457/0458 Crowl/Spinoza constituents of the
    W40K-0459 *Watchers of the Throne Omnibus*. OLD-range `in_coll`
    held steady at 134 vs the Pass-7 post-apply 134 baseline (no
    retro-edge surprises from this wave's resolver-set changes).
- **Phase-0 trias skip note (runbook §10):** the deterministic Aggregator +
  the markdown-only dossier Phase-0 produced are correctly outside the trias.

## Maintainer handoff

- **No headline judgment call this pass** — `EXPECTED_RANGES` left untouched
  (one wave of headroom remaining), no facet add, no guard relaxation, no
  schema touch. Pass 8 matches the Brief 094 brief-free / Brief 091 4a-4b
  contract straight through.
- **Four deferred anthology-gap spot-checks** (W40K-0484 *Vaults of
  Obsidian*, W40K-0492 *The Wicked and the Damned*, W40K-0498
  *Maledictions*, W40K-0507 *Anathemas*) require roster authoring decisions
  on whether the Warhammer Horror shorter pieces get their own roster rows
  — not resolver-pass changes. Your call to pick them up via the SSOT loop
  or leave parked.
- **Wave is the W40K bootstrap closer** — 60 books instead of 100, taking
  the corpus from 450 to 510 (the agreed bootstrap target). After merge,
  the resolver Pass cadence is complete for the current W40K roster; next
  growth happens via the SSOT loop adding new books, which routes through
  the existing per-batch resolver paths (the resolver-pass-runbook is a
  bootstrap tool, not the steady-state path).
- **Stop-before-push:** branch `codex/ingest-batches-resolver-w40k-rest`
  carries the 5 phase commits + this Phase-4b commit (6 total), **not
  pushed**, no PR. Say "fertig" / "PR erstellen" to push + open the PR.

## Open issues / blockers

- None blocking. No `## Needs decision` from any phase; nothing escalated.

## For next session

- **Cowork Wiki-Hygiene pass:** `project-state.md` counts → 510 books /
  1795·683·1170·145·480 junctions; reference 171/214/325; aliases 55/15/40;
  `collection-gaps.json` unchanged (still 4 entries). `EXPECTED_RANGES`
  unchanged. The "bootstrap-W40K-roster complete at 510" milestone is the
  noteworthy fact for the rollup pass.
- **After merge:** the W40K bootstrap-resolver-pass cadence is complete; the
  SSOT loop resumes ownership of any further W40K book additions through
  the existing per-batch resolver paths.
- **Roster follow-ups (optional, SSOT-loop scope):** the four Warhammer-
  Horror anthology constituents (Vaults of Obsidian / Wicked and the Damned
  / Maledictions / Anathemas) want their shorter-piece roster rows
  authored; the format/setting/authorship data_conflict flags (8×short_story,
  4×age_of_sigmar, 2×collection, 2×anthology, 1×authors, 1×title) want
  roster corrections; the single null-rating wave-8 book wants its rating
  backfilled. All SSOT-loop scope, not resolver-pass scope.
- **Phase-3 `characters.json` axis-slicing** (Brief 090/091 § For next
  session) is still parked. With the +28 char rows this pass (smaller than
  Pass-7's +60), `characters.json` hasn't crossed the threshold where a
  Phase-3 read budget paged out — separate decision when the file actually
  starts to bite.

## References

- Runbook: `sessions/resolver-pass-runbook.md` · Config:
  `scripts/resolver-pass.config.json`
- Dossier: `sessions/resolver-dossiers/resolver-pass-8-dossier.md`
- Phase reports: `…-phase-1-report.md` (factions) ·
  `…-phase-2-report.md` (locations) · `…-phase-3-report.md` (characters) ·
  `…-phase-4a-report.md` (integration/apply)
- Apply digest: `ingest/.last-run/phase4-digest.md` (committed) · verbose
  log: `ingest/.last-run/phase4-apply-verbose.log` (gitignored)
- Per-pass brief: none — Brief 094 removed the `brief` config field; the
  rationale is consolidated into the runbook anhang (Briefs 076 / 090 / 091
  / 094, not read to run a phase).
