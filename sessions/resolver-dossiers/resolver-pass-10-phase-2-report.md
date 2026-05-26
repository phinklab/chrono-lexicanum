# Resolver-Pass 10 — Phase 2 (Locations) Status

- **Wave:** `ssot-hh-001..002` (HH bootstrap, 20 books HH-0001..HH-0020).
- **Phase:** `phase-2-locations`.
- **Dossier:** [`resolver-pass-10-dossier.md`](./resolver-pass-10-dossier.md) §7c (Phase-2 promotion shape) + §7d (architectural notes; no Phase-2 blockers).
- **Runbook:** [`../resolver-pass-runbook.md`](../resolver-pass-runbook.md) §3 Phase 2 + §4 (Promotions-/Alias-Disziplin) + §5 (FK-Sicherheit; Phase-2 is FK-independent).
- **Status:** done. No `## Needs decision` block.

## Done summary

Phase-2 promotion shape executed inside the conservative floor that the dossier §7c flagged ("Conservative floor: 7 new rows + 1 alias"). Delivered shape: **10 new rows + 1 alias**, sticking to surface forms with clear lore-iconic standing across the HH-bootstrap arc. The dossier-tagged judgment-call set ( `Sarosh` / `Murder` / `Sixty-Three Nineteen` / `Xenobia` / `Nurth` / `Eolith` / `Magma City` / `Iesta Veracrux` / `Dagonet` / `Hollow Mountain` / `Veridia` / `Perditus`) was **left unresolved** as long-tail (single freq-1 hits without a clear lore-anchor role) — they can promote in a later HH wave if they recur, per runbook §4 ("Lieber Long-Tail offen lassen als eine falsche Canonical-Kante schreiben"). No Cross-Era location aliases in this wave — §7a notes that HH-era locations mostly keep their post-Heresy surface forms unchanged, so location aliasing in this wave is limited to the doubled-s spelling variant `Isstvan III` → `istvaan_iii` (matching the existing `Isstvan V` → `istvaan_v` proof-pattern).

### New row adds — `scripts/seed-data/locations.json` (+10 rows)

All ten rows are appended below `the_spoil` (the prior tail of the file), preserving file-order semantics. JSON validity re-verified post-edit.

| id | name | sector | gx/gy | tags | basis (dossier ref) |
| --- | --- | --- | --- | --- | --- |
| `istvaan_iii` | Istvaan III | `obscurus` | `540 / 212` | `["sons_of_horus", "world_eaters", "death_guard", "emperors_children"]` | §7c freq=2 strict promotion. Heresy-pivotal world (the virus-bombing in HH-0003 *Galaxy in Flames* + HH-0004 *Flight of the Eisenstein*). Two-t convention analog to existing `istvaan_v` (`locations.json:104`). Coords placed adjacent to istvaan_v (545/210) to keep the same-system geographic cluster intact. Tag legions = the four traitor legions that conducted the Isstvan-III virus-bombing per HH-bootstrap lore. |
| `istvaan_system` | Istvaan System | `obscurus` | `null / null` | `["region"]` | §7c freq=1 lore-iconic + §3 "Isstvan System" surface form. System-grain parent of `istvaan_iii` + `istvaan_v`. tag=`region` analog to other system-/region-grain rows (`anaxian_line`, `alecto`). gx/gy=null because system-grain rows don't render geographically — the constituent worlds do. |
| `colchis` | Colchis | `null` | `null / null` | `["word_bearers"]` | §7c freq=1 curated lore-iconic. Lorgar's homeworld / Word Bearers homeworld; *The First Heretic* centerpiece. Surface form direct from §3. sector=null (canonical sector ambiguous in lore; conservative default analog to many late-roster rows). |
| `monarchia` | Monarchia | `null` | `null / null` | `["word_bearers"]` | §7c freq=1 curated lore-iconic. Word Bearers' Perfect City on Khur; the Emperor's burning of Monarchia is the foundational *First Heretic* pivot. Sub-world grain (city on Khur); tags carry the Word Bearers affiliation. |
| `khur` | Khur | `null` | `null / null` | `["word_bearers"]` | §7c freq=1 curated lore-iconic. Word Bearers world (where Monarchia stood). Companion to `monarchia`; sibling-level row rather than parent-child (locations.json schema doesn't model parent-child world↔sub-world links — both rows stand independently with tag affiliation). |
| `nikaea` | Nikaea | `null` | `null / null` | `[]` | §7c freq=1 curated lore-iconic. Council of Nikaea — the psyker-trial moment foundational across HH (anchor of *A Thousand Sons* HH-0012 + cross-HH-arc reference). Tags empty because Nikaea is not a Legion-affiliated world; it's a conclave-site. |
| `deliverance` | Deliverance | `null` | `null / null` | `["raven_guard"]` | §7c freq=1 curated lore-iconic. Raven Guard homeworld (the Kiavahr moon, renamed Deliverance by Corax post-liberation); *Deliverance Lost* HH-0018 centerpiece. |
| `aghoru` | Aghoru | `null` | `null / null` | `[]` | §7c freq=1 lore-iconic. Tomb-world from *A Thousand Sons* HH-0012 (Magnus's archaeological expedition; the opening arc that introduces the Thousand Sons cast). Tags empty — Aghoru is a setting world, not a faction-affiliated stronghold. |
| `laeran` | Laeran | `null` | `null / null` | `["emperors_children"]` | §7c freq=1 lore-iconic. Slaaneshi-tainted coral-world conquered by the Emperor's Children in *Fulgrim* HH-0005; the Laer-coil seduction seeds the Legion's fall to Slaanesh. **Cross-Axis distinction respected:** `Laeran` (location) is distinct from the Phase-1 `laer` row (Slaaneshi xenos race / faction) — same lore-root, two surface forms, two axes; no §4 cross-axis surface-form collision (the strings differ: `Laeran` vs `Laer`). |
| `diamat` | Diamat | `null` | `null / null` | `["mechanicus"]` | §7c freq=1 lore-iconic. Mechanicum / Iron Hands battle-world featured in *Fallen Angels* HH-0011 (cross-HH Heresy strategic-frame anchor; Forge World whose Knights and Mechanicum forces are contested in the early Heresy). Tags = `mechanicus` reflects the Forge-World grain. |

### Alias adds — `scripts/seed-data/location-aliases.json` (+1 alias)

| surface form | target canonical id | type | dossier ref | reason |
| --- | --- | --- | --- | --- |
| `Isstvan III` | `istvaan_iii` | Spelling variant (doubled-s) | §7c freq=2 strict | Same spelling-variant pattern as the existing `Isstvan V` → `istvaan_v` alias. Canonical row uses the two-t form (`istvaan_iii` / `Istvaan III`); the doubled-s surface form `Isstvan III` (which appears in §3 `Isstvan III` freq=2 entries from HH-0003, HH-0004 overrides) routes through the alias to the canonical row. |

### `sectors.json` — no changes

Per runbook §3 Phase 2 ("ggf. `sectors.json` (nur falls eine neue Location einen Sector-FK braucht)"): the ten new rows use either an already-existing sector FK (`obscurus`, present at `sectors.json:11`) or `null` (canonical-sector-unknown default). No new Segmentum/Subsector rows are required — therefore `sectors.json` is left untouched. The file remains in Phase-2 scope only as a precautionary entry (for the sector-FK-needs case that did not materialize this wave).

### Promotion-discipline notes (runbook §4)

- **Promotions justified.** One freq=2-strict promotion (`istvaan_iii`) + nine curated freq=1 lore-iconic promotions, each tied to a foundational HH-bootstrap-arc set-piece (the Heresy schism worlds: `istvaan_iii` / `istvaan_system`; the Word Bearers' fall arc: `colchis` / `monarchia` / `khur`; the Thousand Sons + Magnus arc: `nikaea` / `aghoru`; the Raven Guard recovery: `deliverance`; the Emperor's Children fall: `laeran`; the Mechanicum war-frame: `diamat`). Each justified in the row-table above.
- **Long-tail held back.** The dossier §7c surfaced ~12 additional freq=1 candidates as "Phase 2 judgment" calls — none of those graduated this pass. `Sarosh` (HH-0006 Descent of Angels), `Murder` (HH-0001 Horus Rising spider-world set-piece), `Sixty-Three Nineteen` (HH-0001 numbered designation, awkward slug), `Xenobia` / `Nurth` / `Eolith` (HH-0007 Legion worlds), `Iesta Veracrux` / `Dagonet` (HH-0013 Nemesis worlds), `Hollow Mountain` (HH-0017 The Outcast Dead Terra-sub-locale), `Magma City` (HH-0009 Mars-sub-locale), `Veridia` (HH-0019 Know No Fear), `Perditus` (HH-0020 The Primarchs). These remain **unresolved**; if a later HH wave surfaces any of them again, the freq accumulation justifies a strict-freq-≥-2 promotion or a stronger lore-iconic curated case in that wave's dossier.
- **No over-broad aliases.** The single alias (`Isstvan III` → `istvaan_iii`) has: (a) concrete wave occurrence (dossier §3 freq=2 across HH-0003 + HH-0004), (b) lore-eindeutiges target (Heresy virus-bombing world, two canonical spellings in fan + Black-Library copy), (c) no Cross-Axis-Disambig-Falle (no §4 conflict surfaces with `Isstvan III` on any other axis).
- **Vessel watch — no vessel rows this wave.** Dossier §7c notes: the HH-era signature vessels (*Vengeful Spirit*, *Eisenstein*, *Macragge's Honour*, *Furious Abyss*) did not surface as named location-axis surface forms in the override files of `ssot-hh-001..002`. The override authors did not flag these as location entries; Phase 2 therefore does **not** add vessel rows under the runbook §3 Phase-2 convention (`tags:['vessel']`, `gx/gy:null`). If a later HH wave's overrides surface these names on the location axis, that wave applies the vessel convention.
- **Cross-axis discipline (§4).** Dossier §4 (cross-axis surface-form conflicts) is empty for this wave. The single in-wave near-miss — `Laer` (faction) vs `Laeran` (location) — is **not** a cross-axis conflict because the surface forms are string-distinct; the two-row decision is justified separately in Phase 1 (race-axis row) and Phase 2 (world-axis row).
- **Idempotence per row checked.** Each new id (`istvaan_iii`, `istvaan_system`, `colchis`, `monarchia`, `khur`, `nikaea`, `deliverance`, `aghoru`, `laeran`, `diamat`) is new vs. baseline (verified via grep against pre-edit `locations.json`). The added alias key (`Isstvan III`) is new vs. the pre-edit `location-aliases.json` (16-key baseline). Re-applying the same edits is a no-op.
- **Phase-3 carry-forward unaffected.** Phase 3 reads `characters.json` + `character-aliases.json` + (for FK-safety) the post-Phase-1 `factions.json`. Phase-2 changes are independent of Phase 3 inputs; no FK risk introduced.

## New resolver test cases — `scripts/test-resolver.ts` (11 added, ≥4 required)

All eleven added in the "tenth wave" block immediately after the ninth-wave location tests (just before `console.log("\nresolveCharacter")`). Trias-Run vor commit confirms all green.

| # | name | type | what it locks down |
| --- | --- | --- | --- |
| 1 | direct match - tenth wave Istvaan III | new row | freq=2 strict, two-t canonical convention |
| 2 | alias - tenth wave Isstvan III routes to istvaan_iii | spelling-variant alias | doubled-s surface form analog to Isstvan V |
| 3 | direct match - tenth wave Istvaan System | new row | system-grain parent of istvaan_iii + istvaan_v |
| 4 | direct match - tenth wave Colchis | new row | Word Bearers homeworld (*First Heretic*) |
| 5 | direct match - tenth wave Monarchia | new row | Perfect City on Khur (*First Heretic* burning) |
| 6 | direct match - tenth wave Khur | new row | Word Bearers world hosting Monarchia |
| 7 | direct match - tenth wave Nikaea | new row | Council of Nikaea (*A Thousand Sons*) |
| 8 | direct match - tenth wave Deliverance | new row | Raven Guard homeworld moon (*Deliverance Lost*) |
| 9 | direct match - tenth wave Aghoru | new row | Tomb-world expedition (*A Thousand Sons*) |
| 10 | direct match - tenth wave Laeran | new row | Slaaneshi coral-world, distinct from laer faction row (*Fulgrim*) |
| 11 | direct match - tenth wave Diamat | new row | Mechanicum / Iron Hands battle-world (*Fallen Angels*) |

## Verification

Resolver-Trias green vor commit (runbook §10):

- `npm run test:resolver` → **308 passed, 0 failed** (was 297 post-Phase-1; +11 = the tenth-wave location block above).
- `npm run test:resolver-data` → all integrity checks ok (no duplicate ids/names; faction parents resolve; **location sectors point at existing sectors or null** — the new `obscurus` references resolve, the eight `null` references pass; character primaryFactionIds resolve; alignment enum ok; alias targets resolve; **location coordinates are paired** — the two `(gx,gy)` pairings in this wave's adds are both filled (`istvaan_iii: 540/212`) or both null (the other nine rows), no half-paired coords; sector surface forms resolve; override character roles ok; coverage smoke slugs exist).
- `npm run test:resolver-coverage` → exit 0; totals factions=1903/2240, locations=733/971, characters=1220/1629 (unchanged from Phase-1 reading because the apply-side hasn't run yet — that's Phase 4a; Phase-2 only widens the reference-row set, which the coverage script's count-against-overrides reads after the apply).
- `npm run test:apply-override-dry` → ok; 0 missing FK targets, 0 dangling JSON refs, 0 invalid normalized roles, 0 unresolvable constituent refs. The 15 "forward collection refs" line corresponds to the three HH anthologies' out-of-range constituent slugs (Brief 091 range-aware forward-ref Guard, called out in dossier §7d as the Phase-4a architectural concern — expected behavior, non-blocking for Phase 2).

## Counts delta (Phase-2 only, vs. pre-Phase-2 baseline)

| file | rows pre | rows post | delta |
| --- | --- | --- | --- |
| `locations.json` | 224 | 234 | +10 (`istvaan_iii`, `istvaan_system`, `colchis`, `monarchia`, `khur`, `nikaea`, `deliverance`, `aghoru`, `laeran`, `diamat`) |
| `location-aliases.json` | 16 | 17 | +1 (`Isstvan III` → `istvaan_iii`) |
| `sectors.json` | 8 | 8 | 0 (no new sectors required this wave) |
| `test-resolver.ts` resolveLocation checks | (ninth-wave-end) | +11 | tenth-wave block |

Pre-Phase-2 baseline numbers (`224` locations rows / `16` alias keys) match the dossier §1 baseline counts ("locations **224** / **16**"). Post-Phase-2 numbers (`234` / `17`) verified via `JSON.parse + Object.keys/length` post-edit.

## Carry-forward into Phase 3 / 4

- **Phase 3 (Characters)** is independent of Phase-2 reference rows; no shared FK surfaces (character rows don't carry a location-FK in the seed-data schema — only the override files associate characters to books, and the book-axis is not Phase-3 scope). Phase 3 proceeds against the post-Phase-1 `factions.json` for `primaryFactionId` FK safety, per runbook §5.
- **Phase 4a (Integration)** picks up the ten new location rows + one new alias via `scripts/seed-resolver-extensions.ts` (Phase 4a will extend its insert-list with the HH wave's new reference rows). Per runbook §3 Phase 4a, the Trias-Batch-Range append (`apply-override-dry.ts` / `test-resolver-coverage.ts` / `test-resolver-data-integrity.ts`) extends the domain-aware range to include `{domain:"hh", n:"001"}` + `{domain:"hh", n:"002"}` — the new location rows are then exercised against the HH override files. The 15 forward collection refs (Brief 091 anthology Guard) remain the only Phase-4a architectural concern (dossier §7d) — Phase-2 does not change that count and does not address it (the Guard is a Phase-4a apply-side mechanism). No Phase-2 facet additions; `facet-catalog.json` is correctly out-of-scope for Phase 2.

## Halt-Discipline checklist (driver post-phase verification)

- One commit on this phase: ✅ (this report + the three edited content files in a single commit).
- `git diff --name-only HEAD~..HEAD` ⊆ Phase-2 Write-Scope: ✅ (only `scripts/seed-data/locations.json`, `scripts/seed-data/location-aliases.json`, `scripts/test-resolver.ts`, `sessions/resolver-dossiers/resolver-pass-10-phase-2-report.md`; `scripts/seed-data/sectors.json` is in scope but unchanged this wave, which the subset check allows).
- JSON files syntactically valid: ✅ (parsed-and-validated pre-commit via `JSON.parse`).
- No `## Needs decision` block: phase is `done`.
- No Co-Author trailer: commit message is imperative-only.
