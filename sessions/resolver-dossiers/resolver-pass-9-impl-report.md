---
pass: 9
role: implementer
date: 2026-05-24
status: implemented
wave: ssot-w40k-052..057
ids: W40K-0511..W40K-0565
branch: codex/ingest-batches-resolver-w40k-final
runbook: sessions/resolver-pass-runbook.md
config: scripts/resolver-pass.config.json
dossier: sessions/resolver-dossiers/resolver-pass-9-dossier.md
commits:
  - f2d9974  # Phase 0 (Preflight/Dossier)
  - 57f915e  # Phase 1 (Factions)
  - bc87089  # Phase 2 (Locations)
  - 8def700  # Phase 3 (Characters)
  - afe8a2b  # Phase 4a (Integration/Apply)
  # Phase 4b (Verify/Report) is the commit carrying this report.
---

# Resolver-Pass 9 — impl report (ssot-w40k-052..057 / W40K-0511..0565)

## Summary

Crystallized the ninth wave (55 books — the **final W40K wave**, 5 short by
design as the SSOT loop closes out the W40K-only roster before pivoting to
Horus Heresy) into the resolver reference layer and re-applied all **565**
W40K books to Postgres, taking the corpus from **510 → 565**. Brief 094
brief-free contract: runbook + per-pass config + dossier only, no per-pass
architect brief. Brief 091 6-phase 4a/4b split (0 / 1 / 2 / 3 / 4a / 4b),
`/clear`-separated, one commit per phase; the 4a status file + the committed
Apply-Digest were 4b's only apply-side inputs (no override files, no raw apply
log, no apply-side scripts read in 4b). Stable config-driven Phase-4 tooling
(`run-phase4-apply.sh`, `verify-pass.ts`, `db-counts.ts`, `seed-facets.ts`),
no `-NNN` clones. Ran supervised / axis-sliced (not via the headless driver).

Reference rows (Phases 1–3, seeded to DB in Phase 4a): factions **171→173**
(+2), locations **214→225** (+11), characters **325→345** (+20); aliases
faction 55→59 (+4), location 15→15 (+0), character 40→42 (+2). DB junctions
PRE→POST: `work_factions 1795→1903` (+108), `work_locations 683→733` (+50),
`work_characters 1170→1220` (+50), `work_collections 145→147` (+2),
`work_persons 480→524` (+44), `work_facets 10242→11291` (+1049).
`facet_values 86→86` — **no facet promotion** (dossier §7d explicit: the wave
carried zero `value_outside_vocabulary:facetIds` flags; dry confirmed
`missing facet ids: 0`, nothing stripped, `facet-catalog.json` untouched).
Dry-run prediction (work_factions 1903 / locations 733 / characters 1220)
== DB POST-APPLY exact. All trias green in 4a; lint + typecheck +
verify-pass digest green in 4b.

**Headline judgment call: `EXPECTED_RANGES.factions.max` bumped 1900 → 2100.**
The 565-book actuals 1903 just clear the Pass-7-set ceiling 1900 (Pass-8 had
105 headroom above its 1795 actual; Pass-9's +108 consumed it all). New
ceiling 2100 ≈ ~197 headroom — one full HH-pivot-wave of growth room on the
faction axis. Locations max 800 and characters max 1400 untouched (733 /
1220 actuals still well inside).

**Three `collection-gaps.json` entries added** (W40K-0553 *Twice-Dead King
Omnibus* → W40K-0564 *Severed*; W40K-0527 *Unholy Tales of Horror & Woe*
→ W40K-0501/0508/0509/0518; W40K-0526 *The Resting Places* →
W40K-0521/0524) — confident in-range constituents documented per the
Pass-7 `needs_constituent_collection_edges` precedent; the actual roster
edges are SSOT-loop work, not resolver-pass scope. Other 5 wave anthologies
(*Accursed*, *No Peace Among Stars*, *No Good Men*, *Broken City*,
*Sanction and Sin*, *Once a Killer*) have no confident in-range
constituents; deferred per Pass-8 pattern.

**Final-W40K-wave milestone:** per dossier §7d + loop-log batch 057 milestone
note, this is the last W40K-only apply before the SSOT loop pivots to Horus
Heresy. Cumulative totals reach **565/565 W40K books** in the authority
layer (`works=565`). The SSOT loop's next run flips into the HH domain;
the `EXPECTED_RANGES` faction bump above buys one HH-pivot wave of headroom.

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
- **Phase 1 — Factions (+2):** `ogryns` (Astra Militarum abhuman heavy-infantry
  auxiliaries, freq 2 Baggit-Clodde duology — grain-parity with the Pass-8
  `ratlings` promotion), `sautekh_dynasty` (freq-1 lore-iconic *Severed*,
  Necron Dynasty/Crownworld grain analog to the `kroot`-under-`tau` model).
  +4 aliases: `Enforcers` → `adeptus_arbites` (Browse-Root convention per the
  Pass-1-era *Bookkeeper's Skull* loop note), `Argent Shroud` →
  `sisters_of_battle` (regiment-grain rule), `Chaos Cultists` / `Chaos Cults`
  → `chaos` (broad-faction-fallback; not `heretic_astartes` — wrong grain).
  +2 `specialCases` notes in `faction-policy.json` for the new rows; no new
  `browseRoots`. All other wave Factions (Ultramarines, Iron Snakes, Sons of
  Sek, Black Templars, Alpha Legion, Death Guard, Necrons, Orks, Word Bearers,
  Adeptus Custodes, …) already existed → idempotent.
- **Phase 2 — Locations (+11):** 6 freq≥2 (`varangantua` — the wave's master
  Crime-hive surface form, freq 10; `alecto` — the Sector containing it,
  freq 8; `antikef` — Necron crownworld of the Twice-Dead King trilogy,
  freq 3; `sedh` — Antikef-companion world, freq 2; `anaxian_line` — Iron
  Kingdom + Hand of Abaddon, freq 2; `hive_blackbracken` — King of Pigs +
  Resting Places, freq 2) + 5 lore-iconic freq=1 (`imperial_palace`,
  `ghoul_stars`, `gathalamor`, `kamidar`, `the_spoil`). No new aliases
  (every promoted surface form is a direct canonical-name match). No new
  sectors (Alecto modeled as a region-row in `locations.json` per the
  Pass-8 `imperium_nihilus` / `pariah_nexus` precedent); `imperial_palace`
  reused the existing `solar` segmentum FK.
- **Phase 3 — Characters (+20):** the wave's distributed roster (Twice-Dead
  King trilogy/omnibus, Urdesh duology, Baggit-and-Clodde duology, Renegades
  duology, Ghazghkull duology, Dawn of Fire spine, Severed cluster, Auric
  Gods cluster, Hand of Abaddon dramatis personae, Martyr's Tomb dramatis
  personae, Crime/Varangantua POVs). 1 intra-pass cross-batch alias-
  consolidation (`agusto_zidarov` collapsing `Probator Agusto Zidarov`
  W40K-0540 *Bloodlines* + `Agusto Zidarov` W40K-0543 *Broken City*,
  dossier §7a Case A) + 11 7b spines (`djoseras`, `oltyx`, `yenekh` for the
  Twice-Dead King trilogy; `magister_sek`, `priad` for the Urdesh duology;
  `baggit`, `clodde`, `tabidiah_kruger` for the Baggit-Clodde duology;
  `inquisitor_rostov`, `ferren_areios` for the Dawn of Fire spine;
  `solomon_akurra` for the Renegades duology) + 8 lore-iconic freq=1
  (`szarekh`, `nemesor_zahndrekh`, `vargard_obyron`, `trajann_valoris`,
  `kor_phaeron`, `makari`, `falx`, `iron_queen_orlah`). +2 new aliases:
  `Probator Agusto Zidarov` → `agusto_zidarov` (intra-pass 7a), `Ghazghkull
  Mag Uruk Thraka` → `ghazghkull_thraka` (**cross-pass 7a** dossier-gap
  correction — the existing Pass-7 row already covers this character, so the
  longer Pass-9 surface form routes via alias instead of creating a duplicate
  row). `primaryFactionId` of new rows points at the Phase-1 faction set
  (FK-clean, runbook §5): Necron-cluster → `necrons` (+ `sautekh_dynasty`
  for the *Severed* cast), Crime cluster → `adeptus_arbites`, Ork cluster
  → `orks`, Alpha Legion → `alpha_legion`, Custodes → `custodes`, Dawn of
  Fire → `inquisition` / `salamanders`.

### Phase 4 — Integration / Apply / Verify (4a + 4b)

- **Trias batch-range extension** — `apply-override-dry.ts`,
  `test-resolver-coverage.ts`, `test-resolver-data-integrity.ts`:
  cumulative range `001..051` → **`001..057`**; smoke-slug-coverage label
  updated to match. `apply-override-collections.ts` untouched (pure helper,
  no hardcoded range; Brief 091 contract). `seed-resolver-extensions.ts`
  untouched (fully generic since Brief 077; the JSON loader picks up the
  Phase 1/2/3 row additions automatically).
- **`EXPECTED_RANGES.factions.max` bumped 1900 → 2100** (the headline 4a
  judgment call) — see Summary + Decisions. Locations max 800 and
  characters max 1400 untouched.
- **Re-apply** via `scripts/run-phase4-apply.sh scripts/resolver-pass.config.json`
  (digest-only): seeded resolver-extensions + facets non-destructively, then
  applied `001..057` idempotently (`001..051` = delete-then-insert per
  junction, 0 new works; `052..057` = first-time apply, +55 works,
  10/batch except the 5-book final 057). Digest:
  `ingest/.last-run/phase4-digest.md` (committed); raw per-batch output
  stays in the gitignored verbose log.
- **`persons.json` 84→96** (+12 wave-9 authors: Kim Newman, James Brogdan,
  Richard Strachan, Anna Stephens, Chris Winterton, J. H. Archer, Jeremy
  Lambert, Jamie Mistry-Evans, Chris Thursten, Dale Lucas, Alec Worley,
  Justin Wooley) — `ensurePersonsExist` apply side-output, atomically
  appended (matches Pass-6/7/8 pattern). Other wave authors (Annandale,
  Hinks, Ozga, Hill, Wraight, Brooks, Crowley, Flowers, Haley, Clark,
  Thorpe, Kyme, Collins, Beer, Farrer, French) already had rows pre-pass.
- **`collection-gaps.json` +3 entries** (Pass-7
  `needs_constituent_collection_edges` precedent): W40K-0553 *Twice-Dead
  King Omnibus* → W40K-0564 *Severed* (roster already links 0551 *Ruin* +
  0552 *Reign*); W40K-0527 *Unholy Tales* → W40K-0501 *Oubliette* +
  W40K-0508 *Sepulturum* + W40K-0509 *Deacon of Wounds* + W40K-0518
  *Bookkeeper's Skull* (all four exist as works, none with a roster
  collection edge); W40K-0526 *Resting Places* → W40K-0521 *King of Pigs*
  + W40K-0524 *Pain Engine* (in-range W40K subset of the mixed_w40k_aos
  anthology; AoS shorts have no W40K roster rows, advisory only). All
  endpoints inside `applyRange` 001..057. The actual roster edges are
  SSOT-loop / roster authoring work, not resolver-pass scope.
- **Verify** (Phase 4b): `scripts/verify-pass.ts --config …` emits the
  Verify-Digest to stdout (digest below); `lint` + `typecheck` clean. No
  second DB apply, no trias re-run.

## Counts (Pflicht-Tabelle)

| Stage | works | work_factions | work_locations | work_characters | work_collections | work_persons |
| --- | --- | --- | --- | --- | --- | --- |
| Pre-Apply (510) | 510 | 1795 | 683 | 1170 | 145 | 480 |
| Per-batch 052 (520) | 520 | 1804 | 684 | 1171 | 145 | 489 |
| Per-batch 053 (530) | 530 | 1824 | 689 | 1178 | 145 | 497 |
| Per-batch 054 (540) | 540 | 1851 | 701 | 1188 | 145 | 504 |
| Per-batch 055 (550) | 550 | 1873 | 722 | 1201 | 145 | 511 |
| Per-batch 056 (560) | 560 | 1892 | 729 | 1215 | 147 | 519 |
| **Post-Re-Apply 001..057 (565)** | **565** | **1903** | **733** | **1220** | **147** | **524** |
| Δ (wave 9) | +55 | +108 | +50 | +50 | +2 | +44 |

Reference rows: `factions 171→173`, `locations 214→225`, `characters
325→345`. Aliases: faction 55→59 (+4), location 15→15 (+0), character
40→42 (+2). `facet_values 86→86` (no add; `seed-facets` inserted 0).
`work_facets 10242→11291` (+1049). `persons.json 84→96` (+12 authors).
**Dry-run prediction (work_factions 1903 / locations 733 / characters
1220) matches DB POST-APPLY exactly.** Apply pattern: `001..051` =
idempotent re-apply (delete-then-insert per junction, 0 new works);
`052..057` = first-time apply (+55 works; 052..056 ten per batch, 057 +5
= final W40K wave).

`work_collections` grew +2; the per-batch curve (052/053/054/055 all flat,
056 +2, 057 +0) is fully accounted for by W40K-0553 *Twice-Dead King
Omnibus* binding its in-roster Ruin/Reign constituents (0551/0552) on the
same-batch resolution of 056. The three new `collection-gaps.json`
entries (Twice-Dead King Omnibus → Severed; Unholy Tales → four shorts;
Resting Places → two W40K shorts) sit on top of that, deferred to an SSOT
roster pass. The range-aware forward-ref guard (Brief 091) stayed green
throughout — 15 in-range forward refs (unchanged from Pass-7/8 carry-
through), 0 unresolvable-constituent-refs.

## Decisions I made

- **`EXPECTED_RANGES.factions.max` bumped 1900 → 2100** (the headline 4a
  judgment call). Pass-8 left this untouched (105 headroom under 1900);
  Pass-9 actuals 1903 just clear the old ceiling because the Phase-1
  promotions (`ogryns`, `sautekh_dynasty`, +4 aliases retro-resolving
  earlier-wave Crime / Chaos mentions) plus 55 new books' faction
  junctions consumed the full headroom. New ceiling 2100 ≈ ~197 headroom
  — one full HH-pivot-wave of growth room on the faction axis. Locations
  max 800 and characters max 1400 untouched (733 / 1220 actuals still
  well inside).
- **Three `collection-gaps.json` entries added this wave** (Pass-7
  `needs_constituent_collection_edges` precedent): W40K-0553 → W40K-0564
  (Twice-Dead King Omnibus + *Severed*); W40K-0527 → W40K-0501/0508/0509/0518
  (*Unholy Tales* 4 constituents); W40K-0526 → W40K-0521/0524 (*Resting
  Places* in-range W40K constituents). All endpoints inside applyRange
  001..057; dossier §7d + ssot-loop-log batch 053/056 explicit on the
  collection structure. The actual roster edges defer to an SSOT-loop /
  roster authoring pass — out of resolver-pass scope, exactly the Pass-6/7
  *Architect of Fate* / *War for Armageddon Omnibus* / *Space Wolves
  Legends* contract.
- **Five remaining wave anthologies deferred without entries** (W40K-0517
  *The Accursed*, W40K-0537 *No Peace Among Stars*, W40K-0539 *No Good
  Men*, W40K-0543 *Broken City*, W40K-0544 *Sanction and Sin*, W40K-0546
  *Once a Killer*). No confident in-range constituents; deferred per the
  Pass-8 pattern as `needs_constituent_roster_entries` situations (an
  SSOT-loop concern, not a Phase-4a action).
- **No facet promotion / no stripping.** The wave carried zero
  `value_outside_vocabulary:facetIds` flags (dossier §7d explicit: the
  only facet-relevant `data_conflict` is `audio_drama` on W40K-0547
  *Dredge Runners*, but that value was already in the catalog per loop-log
  batch 053). Dry confirmed `missing facet ids: 0`; `seed-facets` inserted
  0; no strip-of-unknown-id occurred. `facet-catalog.json` untouched (a
  Call-2-style facet add would have been a `## Needs decision` stop
  anyway, per the runbook's deliberate scope-exclusion).
- **Format / setting / authorship `data_conflict` flags advisory only**
  (dossier §7d). The wave carries a heavy Horror-eShort + AoS swarm in
  batches 052/053:
  - 6 `format->novella` flags (W40K-0512/0513/0514/0515/0516/0520 — the
    Horror eShort cluster).
  - 4 `format->short_story` flags (W40K-0521/0522/0523/0524 — more
    Horror shorts).
  - 2 `format->omnibus` flags (W40K-0511 *The Vampire Genevieve*, W40K-0527
    *Unholy Tales*).
  - 1 `format->audio_drama` flag on W40K-0547 *Dredge Runners* (lore-
    correct Black Library 2020 full-cast audio drama; value already in
    facet-catalog).
  - 7 `setting->age_of_sigmar` flags (W40K-0512/0514/0516/0519/0522/0523/0525)
    + 1 `setting->warhammer_fantasy` flag (W40K-0511) + 1
    `domain->mixed_w40k_aos` flag (W40K-0526).
  - 2 `title` typo flags (W40K-0519 `gothghul-hollow`, W40K-0529 *The Gate
    of Bones*).
  - 2 `authors` flags (W40K-0556 *Long Live Da Red Gobbo* / W40K-0557
    *Da Red Gobbo's Last Stand* — empty roster `authors[]`).
  Resolver doesn't act on format / setting / title / authors; flags
  preserved verbatim in the override files for the audit cockpit to
  surface. Visible in the 4b NEW-range audit replica as elevated gap counts
  (short-story books with empty entity junctions are gap-counted by the
  audit SQL but are correct per the roster).
- **`low_confidence` flags carried through as-is** (dossier §7d): heavy
  concentration in batches 052/053 (Horror eShort + AoS swarm). Affected
  books: `low_confidence:factions` × 5 (W40K-0517 *Accursed*, W40K-0518
  *Bookkeeper's Skull*, W40K-0532 *Iron Kingdom*, W40K-0534 *Sea of
  Souls*, W40K-0563 *Auric Gods*); `low_confidence:characters` × 8
  (Horror-eShort cluster W40K-0512..0516, W40K-0520 plus two more);
  `low_confidence:locations` × 1 (W40K-0513 *Isenbrach Horror*). Visible
  as elevated gap/drift counts in the 4b NEW-range replica.

## Verification

- **Trias green (post-Phase-4a):** `test:resolver` **287/0** (280
  pre-Pass-9 + 7 ninth-wave-block cases from Phases 1/2/3),
  `test:resolver-data` ok (10/10 integrity checks incl. updated
  001..057 coverage smoke-slugs check), `test:resolver-coverage` exit 0
  (565 books surveyed; totals factions=1903/2240, locations=733/971,
  characters=1220/1629 — below-threshold smoke axes such as
  *calgars-fury* chars=1/1 and *baneblade* factions=2/2 are pre-existing
  data findings, not failures), `test:apply-override-dry` **ok**
  (`missing roster externalBookIds=0`, `missing facet ids=0`, `invalid
  normalized roles=0`, `invalid rating overrides=0`, `missing resolved
  FK targets=0`, `dangling JSON FK/alias refs=0`; `forward collection
  refs=15` in-range non-blocker per Brief 091; `unresolvable constituent
  refs=0`), `test:collection-refs` **7/0** (Brief-091 helper-unit suite).
- **Lint (Phase 4b):** 0 errors, 1 pre-existing `no-page-custom-font`
  warning in `src/app/layout.tsx` (unchanged across passes 5/6/7/8/9,
  out of scope).
- **Typecheck (Phase 4b):** 0 errors.
- **Apply digest** (`ingest/.last-run/phase4-digest.md`, committed in 4a):
  all 57 batches `ok`; seed-resolver-extensions ok; seed-facets 0 new.
- **Verify digest** (`verify-pass.ts --config …`, stdout):
  - **Smoke slugs (f/l/c/in_coll), one per batch 052..057:**
    `the-stacks 1/0/0/0` (W40K-0520 — the dossier-flagged
    `low_confidence:characters` Horror novella; the lone faction is
    `inquisition`, no locs/chars resolved per the low-confidence note),
    `the-wolftime 4/1/3/0` (W40K-0530 — Dawn of Fire #3, healthy
    Ultramarines + Space Wolves + Inquisition + Orks faction set with
    Roboute Guilliman / Logan Grimnar / Ghazghkull characters),
    `bloodlines 1/1/1/0` (W40K-0540 — Wraight's Warhammer Crime debut,
    the new `agusto_zidarov` Probator character + `varangantua` location
    + `adeptus_arbites` faction all land cleanly), `the-magister-and-the-
    martyr 5/2/3/0` (W40K-0550 — Farrer's Urdesh-duology closer, healthy
    Iron Snakes / Sons of Sek / Saint Sabbat / Urdesh / Sabbat Worlds set
    with Priad / Magister Sek / Saint Sabbat), `renegades-harrowmaster
    2/0/1/0` (W40K-0560 — Brooks's Alpha Legion novel, with the new
    `solomon_akurra` character resolving cleanly), `prisoners-of-waaagh
    2/0/0/0` (W40K-0565 — Wooley's [sic] Ork novella, last book of the
    W40K corpus; `orks` + `astra_militarum`, no locs/chars beyond the
    surface forms left unresolved per dossier §7c). No collection-
    membership rows for these six (the wave's only in-roster omnibus
    edge is W40K-0553 *Twice-Dead King Omnibus* → 0551/0552, not in the
    smoke list).
  - **Rating coverage 0511..0565:** **51 rated (all goodreads), 4 null,
    55 total** (~93% coverage — typical for a fresh wave; the 4 nulls are
    acceptable, not a Phase-4a action).
  - **Audit replica:** OLD `0001..0510` = 510w / **213 drift** / **220 gap**
    / **137 in_coll**; NEW `0511..0565` = 55w / **14 drift** / **34 gap**
    / **2 in_coll**. The NEW-range `gap_works=34 / 55` (~62 %) reflects
    the Horror-eShort + AoS swarm — short-story books with empty
    factions/locations/characters junctions are gap-counted by the audit
    SQL but are correct per the roster (the constituent shorts of the
    anthologies carry the entities, not the anthology itself). The
    NEW-range `in_coll=2` ties to W40K-0551 *Ruin* + W40K-0552 *Reign*
    as constituents of W40K-0553 *Twice-Dead King Omnibus*. OLD-range
    `in_coll=137` is +3 vs the Pass-8 post-apply 134 baseline; the three
    new edges are the *Severed* (W40K-0564) → *Twice-Dead King Omnibus*
    (W40K-0553) advisory pending the roster pass plus a small drift-of-
    junction effect from this pass's resolver-set changes retro-resolving
    earlier-wave surface forms (e.g. `Enforcers` → `adeptus_arbites`,
    `Ghazghkull Mag Uruk Thraka` → `ghazghkull_thraka`). OLD-range drift
    +25 / gap +36 vs Pass-8's OLD-range numbers reflect the cumulative
    pre-510 audit replica now including the Pass-8 60 new books with
    their own drift/gap patterns (Pass-8 itself reported 25 NEW drift / 37
    NEW gap; those roll into the Pass-9 OLD).
- **Phase-0 trias skip note (runbook §10):** the deterministic Aggregator
  + the markdown-only dossier Phase-0 produced are correctly outside the
  trias.

## Maintainer handoff

- **Headline judgment call: `EXPECTED_RANGES.factions.max` 1900 → 2100.**
  Documented in Decisions; one full HH-pivot-wave of headroom; locations
  / characters maxima untouched.
- **Three new `collection-gaps.json` entries** (W40K-0553 → 0564,
  W40K-0527 → 0501/0508/0509/0518, W40K-0526 → 0521/0524) require
  roster authoring (the actual `work_collections` edges) — SSOT-loop
  scope, not resolver-pass scope. Your call to pick them up via the
  SSOT loop or leave parked.
- **Six wave anthologies deferred without entries** (Accursed, No Peace
  Among Stars, No Good Men, Broken City, Sanction and Sin, Once a
  Killer) — no confident in-range constituents, parked as
  `needs_constituent_roster_entries`.
- **Final W40K wave milestone.** Cumulative 565/565 W40K books in the
  authority layer; the SSOT loop's next run flips into the HH domain.
  After merge, the resolver-pass cadence is **complete for the W40K
  roster**. Steady-state growth happens via the SSOT loop's existing
  per-batch resolver paths; the next bootstrap resolver-pass wave will
  be the first HH wave (different `domain` in `applyRange`, different
  reference seeds for the Heresy-era factions / locations / characters
  that don't already exist).
- **Stop-before-push:** branch `codex/ingest-batches-resolver-w40k-final`
  carries the 5 phase commits + this Phase-4b commit (6 total), **not
  pushed**, no PR. Say "fertig" / "PR erstellen" to push + open the PR.

## Open issues / blockers

- None blocking. No `## Needs decision` from any phase; nothing escalated.

## For next session

- **Cowork Wiki-Hygiene pass:** `project-state.md` counts → 565 books /
  1903·733·1220·147·524 junctions; reference 173/225/345; aliases
  59/15/42; `collection-gaps.json` 4 → 7 entries (the three new ones
  this pass); `EXPECTED_RANGES.factions.max` 1900 → 2100. The
  **final-W40K-wave milestone (565/565)** is the noteworthy fact for
  the rollup pass — the W40K bootstrap resolver-pass cadence is now
  complete; steady-state growth shifts to the SSOT loop's per-batch
  resolver paths, and the next bootstrap resolver-pass will open the
  HH domain.
- **After merge:** the W40K bootstrap-resolver-pass cadence is complete;
  the SSOT loop resumes ownership of any further W40K book additions
  through the existing per-batch resolver paths. First HH wave is the
  next resolver-pass milestone.
- **Roster follow-ups (optional, SSOT-loop scope):** the three new
  `collection-gaps.json` entries (Twice-Dead King Omnibus / Unholy Tales
  / Resting Places) + the six deferred wave anthologies want their
  in-roster collection edges authored; the format/setting/authorship
  data_conflict flags (6×novella, 4×short_story, 2×omnibus, 1×audio_drama,
  7×age_of_sigmar, 1×warhammer_fantasy, 1×mixed_w40k_aos, 2×title,
  2×authors) want roster corrections; the four null-rating wave-9 books
  want their ratings backfilled. All SSOT-loop scope, not resolver-pass
  scope.
- **Phase-3 `characters.json` axis-slicing** (Brief 090/091 § For next
  session) is still parked. With the +20 char rows this pass (smaller
  than Pass-7's +60 and Pass-8's +28), `characters.json` hasn't crossed
  the threshold where a Phase-3 read budget paged out — separate
  decision when the file actually starts to bite. The W40K bootstrap
  closing here means the file growth pattern is about to shift entirely
  with the HH pivot.

## References

- Runbook: `sessions/resolver-pass-runbook.md` · Config:
  `scripts/resolver-pass.config.json`
- Dossier: `sessions/resolver-dossiers/resolver-pass-9-dossier.md`
- Phase reports: `…-phase-1-report.md` (factions) ·
  `…-phase-2-report.md` (locations) · `…-phase-3-report.md` (characters)
  · `…-phase-4a-report.md` (integration/apply)
- Apply digest: `ingest/.last-run/phase4-digest.md` (committed) · verbose
  log: `ingest/.last-run/phase4-apply-verbose.log` (gitignored)
- Per-pass brief: none — Brief 094 removed the `brief` config field; the
  rationale is consolidated into the runbook anhang (Briefs 076 / 090 /
  091 / 094, not read to run a phase).
