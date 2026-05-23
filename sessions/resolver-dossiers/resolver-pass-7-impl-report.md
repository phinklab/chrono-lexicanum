---
pass: 7
role: implementer
date: 2026-05-23
status: implemented
wave: ssot-w40k-036..045
ids: W40K-0351..W40K-0450
branch: codex/ingest-batches-resolver-pass-7
brief: sessions/2026-05-22-093-arch-resolver-pass-7.md  # rationale-only (Brief 090 lean contract); not read to run a phase
runbook: sessions/resolver-pass-runbook.md
config: scripts/resolver-pass.config.json
dossier: sessions/resolver-dossiers/resolver-pass-7-dossier.md
commits:
  - b1af27b  # Phase 0 (Preflight/Dossier)
  - e891151  # Phase 1 (Factions)
  - c63b181  # Phase 2 (Locations)
  - 64643ba  # Phase 3 (Characters)
  - d2c9590  # Phase 4a (Integration/Apply)
  # Phase 4b (Verify/Report) is the commit carrying this report.
---

# Resolver-Pass 7 — impl report (ssot-w40k-036..045 / W40K-0351..0450)

## Summary

Crystallized the seventh 100-book wave into the resolver reference layer and re-applied all **450** W40K
books to Postgres, taking the corpus from the 350-book resolver-pause to **450/450**. **First real run on
the Brief-091 6-phase 4a/4b split** (0 / 1 / 2 / 3 / 4a / 4b), `/clear`-separated, one commit per phase;
the 4a-status + committed Apply-Digest were 4b's only apply-side inputs (no override files, no raw apply
log, no apply-side scripts read in 4b). Lean/brief-free per Brief 090: runbook + per-pass config +
dossier, stable config-driven Phase-4 tooling (`run-phase4-apply.sh`, `verify-pass.ts`, `db-counts.ts`,
`seed-facets.ts`), no `-NNN` clones. Ran **supervised / axis-sliced** (not via the headless driver).

Reference rows (Phases 1–3, seeded to DB in Phase 4a): factions **162→166** (+4), locations **189→201**
(+12), characters **237→297** (+60); aliases faction 41→48 (+7), location 15→15 (+0), character 34→39
(+5). DB junctions PRE→POST: `work_factions 1424→1659` (+235), `work_locations 543→638` (+95),
`work_characters 844→1074` (+230), `work_collections 109→142` (+33), `work_persons 325→424` (+99).
`facet_values 86→86` — **no facet promotion** (config Phase-4 trigger; dry confirmed `missing facet
ids: 0`, nothing stripped, `facet-catalog.json` untouched). Dry-run prediction == DB POST-APPLY exact.
All trias green in 4a; lint + typecheck + verify-pass digest green in 4b.

**One Phase-4a wave-specific call:** `EXPECTED_RANGES` in `apply-override-dry.ts` bumped (factions
1500→1900, locations 600→800, characters 1200→1400). Pass-6 flagged the faction/location maxima as
next-wave overflow risks; the actual cumulative 1659/638/1074 confirmed it. No other judgment headline —
no facet add, no guard relaxation, no schema touch.

## What I did

The pass is a 6-phase sequence; Phases 0–3 + 4a landed in their own commits (above) with full per-phase
reports. Phase 4b is **read-only** — it ran `scripts/verify-pass.ts --config …` (stdout digest), `lint`,
`typecheck`, and polished this report from 4a status + Apply-Digest + Verify-Digest. No second DB apply,
no trias re-run.

### Per-phase recap (detail in the phase reports)

- **Phase 0 — Preflight/Dossier:** `scripts/aggregate-surface-forms.ts --config …` produced 6 of the 7
  dossier sections deterministically; the 7th (needs-decision / cross-batch alias candidates) was synthesized
  from tail-reads of the wave's loop-log blocks. No override files read in-context.
- **Phase 1 — Factions (+4):** `talons_of_the_emperor`, `senatorum_imperialis`, `house_chimaeros`,
  `house_draconis` (the High Lords umbrella + Knight houses from the *Beast Arises* / *Imperial Knights*
  clusters). +7 aliases. All other wave Factions (Aeldari Craftworlds, Thousand Sons, World Eaters, Black
  Legion, Space Wolves Successors, Dark Angels, AdMech, Phoenix Lords, Carcharodons, Fabius Bile, …) already
  existed in `factions.json` → idempotent.
- **Phase 2 — Locations (+12):** `ullanor`, `alaitoc`, `velchanos_magna`, `adrastapol`, `demetrius`, `loki`,
  `mistral`, `phall`, `rock`, `ulthwe`, `inwit`, `baal_secundus`. `sector/gx/gy` null for the 11 freestanding
  rows; `baal_secundus` reused the existing `tempestus` segmentum FK via parent `baal`. No new aliases (no
  cross-batch alias-consolidation candidates this wave per dossier §7a). No new vessel row.
- **Phase 3 — Characters (+60):** the wave's trilogy/omnibus + *Beast Arises* ensemble (Aeldari paths,
  Macharian Crusade, Forges of Mars, Ahriman trilogy, Yarrick, Jarnhamar, Legacy of Caliban, Black Legion,
  AdMech, Phoenix Lords, *Beast Arises* High Lords, Castellan Crowe, Carcharodons, Imperial Knights, LtDM
  shorts, Mephiston). +5 cross-batch alias-consolidations (one character spanning omnibus + member volumes →
  one row). `primaryFactionId` of new rows points at the Phase-1 faction set (FK-clean, runbook §5).

### Phase 4 — Integration / Apply / Verify (4a + 4b)

- **Trias batch-range extension** — `apply-override-dry.ts`, `test-resolver-coverage.ts`,
  `test-resolver-data-integrity.ts`: cumulative range `001..035` → **`001..045`**; smoke-slug list updated to
  the config `verify.smokeSlugs` (one per batch 036..045). `apply-override-collections.ts` untouched (pure
  helper, no hardcoded range; Brief 091 contract).
- **`EXPECTED_RANGES` bumped** (factions max 1500→1900, locations 600→800, characters 1200→1400) — the
  Pass-5→Pass-6 +30 % headroom style; sized for one more wave of margin.
- **Re-apply** via `scripts/run-phase4-apply.sh scripts/resolver-pass.config.json` (digest-only): seeded
  resolver-extensions + facets non-destructively, then applied `001..045` idempotently (`001..035` =
  delete-then-insert per junction, 0 new works; `036..045` = first-time apply, +100 works). Digest:
  `ingest/.last-run/phase4-digest.md` (committed); raw per-batch output stays in the gitignored verbose log.
- **`persons.json` 73→78** (+5 wave-7 authors: Thomas Parrott, Chris Dows, Andy Clark, Robbie MacNiven,
  Josh Reynolds) — `ensurePersonsExist` apply side-output, atomically appended (matches Pass-6 pattern).
- **`collection-gaps.json` +1 entry**: W40K-0434 *Space Wolves (Legends)* (`status:
  needs_constituent_collection_edges`, 3 confident constituents). The other Legends anthology spot-checks
  (Ultramarines, Astra Militarum, Shas'o) + *Ahriman: Exodus* + *Adeptus Mechanicus Omnibus* spot-checks were
  deferred — see Decisions.
- **Verify** (Phase 4b): `scripts/verify-pass.ts --config …` emits the Verify-Digest to stdout (digest below);
  `lint` + `typecheck` clean. No second DB apply, no trias re-run.

## Counts (Pflicht-Tabelle)

| Stage | works | work_factions | work_locations | work_characters | work_collections | work_persons |
| --- | --- | --- | --- | --- | --- | --- |
| Pre-Apply (350) | 350 | 1424 | 543 | 844 | 109 | 325 |
| Per-batch 036 (360) | 360 | 1438 | 552 | 875 | 121 | 340 |
| Per-batch 037 (370) | 370 | 1465 | 562 | 932 | 127 | 350 |
| Per-batch 038 (380) | 380 | 1487 | 578 | 953 | 134 | 360 |
| Per-batch 039 (390) | 390 | 1513 | 585 | 986 | 137 | 370 |
| Per-batch 040 (400) | 400 | 1535 | 590 | 1001 | 139 | 380 |
| Per-batch 041 (410) | 410 | 1553 | 596 | 1006 | 139 | 390 |
| Per-batch 042 (420) | 420 | 1581 | 607 | 1024 | 139 | 399 |
| Per-batch 043 (430) | 430 | 1611 | 620 | 1042 | 139 | 407 |
| Per-batch 044 (440) | 440 | 1634 | 629 | 1060 | 139 | 415 |
| **Post-Re-Apply 001..045 (450)** | **450** | **1659** | **638** | **1074** | **142** | **424** |
| Δ (wave 7) | +100 | +235 | +95 | +230 | +33 | +99 |

Reference rows: `factions 162→166`, `locations 189→201`, `characters 237→297`. `facet_values 86→86`
(no add; `seed-facets` inserted 0). `work_facets 7227→9087` (+1860). `persons.json 73→78` (+5 authors).
**Dry-run prediction (work_factions 1659 / locations 638 / characters 1074) matches DB POST-APPLY
exactly.** Apply pattern: `001..035` = idempotent re-apply (delete-then-insert, 0 new works); `036..045`
= first-time apply (+100 works, 10/batch).

`work_collections` grew +33; the per-batch curve (036 +12, 037 +6, 038 +7, 039 +3, 040 +2, 041–044 flat,
045 +3) matches the wave's omnibus structure (Path-of-Eldar + Path-of-Dark-Eldar Omnibi + Ahriman trilogy
seed + the *Architect of Fate* OQ(14)(e) edges activating, Macharian-Crusade + Forges-of-Mars Omnibi,
Ahriman + Yarrick Omnibi, Legacy-of-Caliban Omnibus, AdMech Omnibus, Fabius-Bile Omnibus). **The 5 new
in_coll edges in batches 026/030 from PR #85 / OQ (14) (Architect of Fate W40K-0286 + 4 constituents,
War for Armageddon Omnibus W40K-0307 + Blood and Fire W40K-0316) landed on the cumulative re-apply** —
the open question in the brief is answered: yes, `applyCollections` pulls them idempotently, the
range-aware forward-ref guard (Brief 091) stays green (all 15 forward refs in `applyRange` 001..045).

## Decisions I made

- **`EXPECTED_RANGES` bumped** (factions max 1500→1900, locations 600→800, characters 1200→1400) — the
  Pass-6 flag (faction/location maxima are next-wave overflow risks) materialised; 1659 > 1500, 638 > 600,
  1074 was still inside 1200 but bumped for consistent +30 % headroom across all three axes (Pass-5→Pass-6
  style). Not permissive, just one more wave of margin.
- **`collection-gaps.json` +1, five spot-checks deferred** (dossier §7d). Confidence breakdown:
  - **W40K-0434 *Space Wolves (Legends)*** → **added** with 3 confident constituents (W40K-0430 *Scent of a
    Traitor*, W40K-0432 *Darkness of Angels*, W40K-0433 *Wrath of the Wolf* — all 2016, all
    "Space Wolves:"-prefixed, all already `short_story`). Status `needs_constituent_collection_edges` — the
    works exist, only the roster *edges* are absent (a roster/SSOT-loop change, out of resolver-pass scope).
  - **W40K-0427 *Ultramarines (Legends)*** → deferred. Only W40K-0407 *At Gaius Point* (ADB) fits confidently;
    the other Batch-041 shorts are Mantis Warriors / Astral Claws / Relic-quest / Returned-mystery / Orphans-
    of-the-Kraken-Scythes themed. One constituent is too thin (Pass-6 added Architect of Fate with 4/4).
  - **W40K-0429 *Astra Militarum*** and **W40K-0431 *Shas'o*** → deferred (no wave book is clearly AM- or
    T'au-themed-short in 034..045).
  - **W40K-0372 *Ahriman: Exodus*** → deferred. The 4 internal tales have no own roster rows — a
    `needs_constituent_roster_entries` situation (like *Green Tide*), distinct from edge-only deferrals.
    Pre-existing outbound edge to omnibus W40K-0373 is intact.
  - **W40K-0393 *Adeptus Mechanicus Omnibus*** → **no gap.** Confirmed 2/2 constituents (W40K-0391
    *Skitarius*, W40K-0392 *Tech-Priest*); the dossier's "verify whether the third volume exists" → no
    third volume in the cumulative roster. Sanders' "trilogy" is a duology by current roster count.
- **No facet promotion / no stripping.** Config trigger + dry (`missing facet ids: 0`) confirm the wave is
  vocabulary-clean. The four wave books with `value_outside_vocabulary:facetIds` flags (W40K-0391, 0394,
  0395, 0396) carry the flag as documentation-of-mapping-choice; their actual `facetIds` arrays use only
  valid catalog values. `facet-catalog.json` untouched, `seed-facets` inserted 0, no strip occurred.
- **Format / authorship `data_conflict` flags advisory only** (dossier §7d). The resolver doesn't act on
  format or authors; flags preserved in the override files for the audit cockpit:
  - 5 Batch-041 `format->short_story` flags (W40K-0402..0406, Legends-of-the-Space-Marines shorts mistagged
    as `novel`).
  - 1 Batch-041 `format->novel` flag on *Farsight* (W40K-0410, novella-vs-novel).
  - 1 Batch-043 `format->collection` flag on *Sons of Corax* (W40K-0428, anthology mistagged as `novel`).
  - 2 `authors->…` flags (W40K-0408 *The Last Detail* → Paul Kearney; W40K-0444 *Carcharadons: Void Exile*
    → Robbie MacNiven).
- **`low_confidence` flags carried through as-is** (dossier §7d): W40K-0359 + W40K-0444 on characters,
  W40K-0400 + W40K-0430 + W40K-0435 on locations.

## Verification

- **Trias green (post-Phase-4a):** `test:resolver` **236/0**, `test:resolver-data` 10/10 integrity checks
  (incl. updated 001..045 coverage smoke-slugs check), `test:resolver-coverage` exit 0 (450 books surveyed;
  below-threshold smoke axes are findings, not failures), `test:apply-override-dry` **ok**
  (`missing roster externalBookIds=0`, `missing facet ids=0`, `invalid normalized roles=0`,
  `invalid rating overrides=0`, `missing resolved FK targets=0`, `dangling JSON FK/alias refs=0`;
  `forward collection refs=15` in-range non-blocker per Brief 091; `unresolvable constituent refs=0`),
  `test:collection-refs` **7/0** (Brief-091 helper-unit suite).
- **Lint (Phase 4b):** 0 errors, 1 pre-existing `no-page-custom-font` warning in `src/app/layout.tsx`
  (unchanged across passes 5/6/7, out of scope).
- **Typecheck (Phase 4b):** 0 errors.
- **Apply digest** (`ingest/.last-run/phase4-digest.md`, committed in 4a): all 45 batches `ok`;
  seed-resolver-extensions ok; seed-facets 0 new.
- **Verify digest** (`verify-pass.ts --config …`, stdout):
  - **Smoke slugs (f/l/c/in_coll), one per batch 036..045:**
    `path-of-the-warrior 1/1/3/1`, `priests-of-mars 3/1/7/1`, `blood-of-asaheim 4/1/2/0`,
    `the-talon-of-horus 4/1/3/0`, `ragnar-blackmane 4/1/2/0`, `farsight 2/1/1/0`,
    `i-am-slaughter 3/1/1/0`, `the-beheading 3/1/2/0`, `primogenitor 2/1/1/1`, `dante 2/3/1/0`.
    The two `in_coll=1` rows confirm the wave's omnibus membership (Path-of-Eldar, Fabius-Bile);
    `priests-of-mars c=7` confirms the Forges-of-Mars Phase-3 character set landed; low character counts on
    the Beast-Arises spines (W40K-0414/0425) reflect that ensemble's rotating roster across 12 books.
  - **Rating coverage 0351..0450:** **100 rated (all goodreads), 0 null, 100 total.**
  - **Audit replica:** OLD `0001..0350` = 350w / 146 drift / 151 gap / 106 in_coll; NEW `0351..0450` =
    100w / 42 drift / 34 gap / 28 in_coll. OLD-range `in_coll` rose +5 vs the synthetic post-Pass-6
    baseline (101) — the OQ(14)(e) edges from PR #85 landing exactly where the 4a counts curve predicted.
- **Phase-0 trias skip note (runbook §10):** the deterministic Aggregator + the markdown-only dossier
  Phase-0 produced are correctly outside the trias.

## Maintainer handoff

- **No headline judgment call this pass** — `EXPECTED_RANGES` bumping is a routine sizing edit, not a guard
  relaxation; Brief 091 already addressed Pass-6's forward-ref guard (now range-aware, stays green
  throughout the cumulative sweep with 15 in-range refs). Pass 7 simply matches the brief's Acceptance list.
- **Five deferred collection-gaps spot-checks** (Ultramarines Legends 0427, Astra Militarum 0429, Shas'o
  0431, Ahriman:Exodus 0372, AdMech-Omnibus-3rd-volume confirmed-non-existent). The Space Wolves Legends
  gap (W40K-0434) was added with confident constituents; the other four require roster authoring decisions,
  not resolver-pass changes. Your call to pick them up via the SSOT loop or leave them parked.
- **Stop-before-push:** branch `codex/ingest-batches-resolver-pass-7` carries the 5 phase commits + this
  Phase-4b commit (6 total), **not pushed**, no PR. Say "fertig" / "PR erstellen" to push + open the PR.

## Open issues / blockers

- None blocking. No `## Needs decision` from any phase; nothing escalated.

## For next session

- **Cowork Wiki-Hygiene pass:** `project-state.md` counts → 450 books / 1659·638·1074·142·424 junctions;
  reference 166/201/297; aliases 48/15/39; `collection-gaps.json` 4 entries (was 3); `EXPECTED_RANGES`
  faction/location bumped (footnote-worthy). Pass-7-Watch-Item "slug/title delta W40K-0259/W40K-0330" was
  out-of-scope per brief (apply-override freezes slug/title on update) and stays parked as a separate
  Maintainer-Entscheidung (explicit re-import path vs. accept cosmetic delta pre-launch).
- **After merge:** the SSOT loop resumes from the 450-pause (advisory) → next wave `ssot-w40k-046..055`.
- **Roster follow-ups (optional, SSOT-loop scope):** Space Wolves Legends 0434 wants its 3 collection
  edges authored; Ahriman:Exodus 0372 wants its 4 internal tales as roster rows; the format/authorship
  data_conflict flags (5×short_story, 1×novel, 1×collection, 2×authors) want roster corrections.
- **Phase-3 `characters.json` axis-slicing** (Brief 090/091 § For next session) is still parked. With the
  +60 char rows this pass, `characters.json` continues the trajectory — separate decision when the file
  starts paging out a Phase-3 read budget.

## References

- Runbook: `sessions/resolver-pass-runbook.md` · Config: `scripts/resolver-pass.config.json`
- Brief (rationale-only): `sessions/2026-05-22-093-arch-resolver-pass-7.md`
- Dossier: `sessions/resolver-dossiers/resolver-pass-7-dossier.md`
- Phase reports: `…-phase-1-report.md` (factions) · `…-phase-2-report.md` (locations) ·
  `…-phase-3-report.md` (characters) · `…-phase-4a-report.md` (integration/apply)
- Apply digest: `ingest/.last-run/phase4-digest.md` (committed) · verbose log:
  `ingest/.last-run/phase4-apply-verbose.log` (gitignored)
