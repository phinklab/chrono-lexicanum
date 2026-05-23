# Resolver-Pass 7 — Phase 3 (Characters) report

> Done-summary. No `## Needs decision` — every promotion / alias-consolidation call resolved
> in-phase with justification (dossier §7d expected zero hard blockers; confirmed). Wave
> `ssot-w40k-036..045` (W40K-0351..0450), trilogy-/omnibus-/M32-Beast-Arises-ensemble heavy.

## What changed

- **`scripts/seed-data/characters.json`**: 237 → **297 rows** (+60).
- **`scripts/seed-data/character-aliases.json`**: 34 → **39 keys** (+5, all are the 7a
  cross-batch alias-consolidation pairs).
- **`scripts/test-resolver.ts`**: +12 `resolveCharacter` cases (7 direct, 5
  alias-consolidation) — exceeds the runbook ≥5 / ≥2-consolidation minimum.

## Cross-batch alias-consolidation (dossier §7a — one row + alias, never two rows)

The omnibus/trilogy duplication this wave was built for. Each pair below would have produced
two rows under a naïve implementer; instead they collapse onto **one** canonical row plus a
character-alias.

| canonical row | resolves direct (name) | new alias key | primaryFactionId | rationale |
|---|---|---|---|---|
| `ahzek_ahriman` *(exists, Pass-4)* | Ahzek Ahriman | `Ahriman` → `ahzek_ahriman` | thousand_sons | Case A: French's trilogy uses short form vols 1-2, full form vol 3+ + omnibus. Combined effective freq 7. |
| `abaddon_the_despoiler` *(exists, Pass-2)* | Abaddon the Despoiler | `Abaddon` → `abaddon_the_despoiler` | black_legion | Case B: Warmaster across Khârn / Talon of Horus / Black Legion (W40K-0388..0390 + W40K-0397). |
| `sebastian_yarrick` **(new row)** | Sebastian Yarrick | `Commissar Yarrick` → `sebastian_yarrick` | astra_militarum | Case C: Annandale's eponymous trilogy (4) + LtDM anthology cameo (1). |
| `commander_farsight` **(new row)** | Commander Farsight | `Farsight` → `commander_farsight` | tau | Case D: Kelly's standalone Farsight novella uses bare form; the Crisis of Faith / Empire of Lies / Blade of Truth trilogy uses the rank-prefixed form (4 + 1). |
| `gunnlaugur` **(new row)** | Gunnlaugur | `Gunnlaugr` → `gunnlaugur` | space_wolves | Case E: Wraight's Blood of Asaheim trilogy; Vol 1 (W40K-0380) override carries the missing-vowel spelling (2 + 1). |

## Spines promoted (dossier §7b — freq ≥ 2 strict)

Every cluster's named spine collapses onto **one** row per character (omnibus + per-volume +
LtDM cameos all hit the same canonical id). `primaryFactionId` set per dossier hint / Phase-1
landed factions; `null` not used this phase (every promoted row has a clean canonical faction).

### Path of the Eldar — Craftworld Alaitoc (`eldar`, ssot-w40k-036)
Korlandril (4), Thirianna (4), Aradryan (4).

### Path of the Dark Eldar — Commorragh (`eldar`, ssot-w40k-036)
Asdrubael Vect (4 — lore-iconic Supreme Overlord), Morr (4), Nyos Yllithian (4), Bellathonis (3).

### Macharian Crusade (`astra_militarum`, ssot-w40k-037)
Lord Solar Macharius (4 — lore-iconic), Leo Lemuel (4), Anton (4), Ivan (4), Richter (2);
**Inquisitor Drake** (2) → `inquisition`.

### Forges of Mars (`mechanicus`, ssot-w40k-037)
Lexell Kotov (4), Tarkis Blaylock (4), Linya Tychon (4), Galatea (4 — abominable intelligence),
Telok (2);
**Roboute Surcouf** (4) → `rogue_traders` *(Pass-6 row)*;
**Ven Anders** (3) → `astra_militarum` *(Cadian Colonel)*;
**Tanna** (2) → `black_templars` *(Reclusiarch)*.

### Ahriman trilogy (`thousand_sons`, ssot-w40k-037..038)
Ctesias (4), Astraeos (2), Carmenta (2); **Inquisitor Iobel** (2) → `inquisition`.

### Yarrick trilogy (`astra_militarum`, ssot-w40k-038)
Sebastian Yarrick (4, 7a Case C), Lord Commissar Rasp (2);
**Ghazghkull Thraka** (3 — lore-iconic Warboss) → `orks`.

### Blood of Asaheim / Jarnhamar (`space_wolves`, ssot-w40k-038..039)
Gunnlaugur (2, 7a Case E), Ingvar (3).

### Legacy of Caliban (`dark_angels`, ssot-w40k-039)
Asmodai (4 — lore-iconic Interrogator-Chaplain), Annael (4), Telemenus (3), Sammael (2 —
Master of the Ravenwing), Sapphon (2), Azrael (3 — Supreme Grand Master); **Cypher** (2 —
lore-iconic Fallen) → `fallen_angels` *(Phase-1 alias decision: The Fallen → fallen_angels)*.

### Black Legion (`black_legion`, ssot-w40k-039)
Iskandar Khayon (2).

### Adeptus Mechanicus trilogy (`mechanicus`, ssot-w40k-040)
Haldron-44 Stroika (3), Omnid Torquora (3), Idriss Krendl (2).

### Phoenix Lords pair (`eldar`, ssot-w40k-040)
Asurmen (2 — lore-iconic first Phoenix Lord).

### Farsight (`tau`, ssot-w40k-041..042)
Commander Farsight (4, 7a Case D).

### The Beast Arises mega-series (M32, ssot-w40k-042..043)
Koorland (10 — Imperial Fists Last Wall, `imperial_fists`), Drakan Vangorich (8 — Grand Master
of Assassins, `officio_assassinorum`), The Beast (4 — lore-iconic Ork Warlord, `orks`),
Maximus Thane (2 — Fists Exemplar successor, `imperial_fists`), **Inquisitor Wienand** (2) →
`inquisition`; **Vulkan** (2 — Primarch/Perpetual M32 cameo) → `salamanders`.

### Castellan Crowe (`grey_knights`, ssot-w40k-044)
Garran Crowe (2); **The Blade of Antwyr** (2) → `daemons` *(weapon-as-character edge case;
see §"Edge case" below)*.

### Carcharodons (`carcharodons`, ssot-w40k-045)
Bail Sharr (2).

### Imperial Knights duology (Phase-1 FKs, ssot-w40k-045)
Danial Tan Draconis (2) → `house_draconis`; Luk Kar Chimaeros (2) → `house_chimaeros`. Both
parent rows landed by Pass-7 Phase 1 (runbook §5 FK-safety honored).

### Space Wolves LtDM shorts (`space_wolves`, ssot-w40k-044)
Krom Dragongaze (3 — Wolf Lord of the Drakeslayers).

## Curated freq-1 promotions (dossier §7b lore-iconic + Phase-1 FK targets)

Strict eponymous-of-wave-book criterion (matches Phase-1/2 discipline note) for three;
Phase-1-anticipated FK targets for the other two.

| id | name | primaryFactionId | rationale |
|---|---|---|---|
| `njal_stormcaller` | Njal Stormcaller | space_wolves | Eponymous of Wraight's *Stormcaller* (W40K-0381); lore-iconic Rune Priest. |
| `jain_zar` | Jain Zar | eldar | Eponymous of Thorpe's *Jain Zar: The Storm of Silence* (W40K-0396); dossier §7b explicit "two eponymous novels = two character rows" (Asurmen + Jain Zar). |
| `lemartes` | Lemartes | blood_angels | Eponymous of Annandale's *Lemartes: Guardian of the Lost* (W40K-0398); also cameo in Hinks' Mephiston trilogy → freq 2 cumulative per dossier §7b. |
| `tolwyn_draconis` | Tolwyn Draconis | house_draconis | Phase-1 FK target (companion to `danial_tan_draconis` in Clark's *Kingsblade*, W40K-0445). |
| `alicia_kar_manticos` | Alicia Kar Manticos | house_chimaeros | Phase-1 FK target (companion to `luk_kar_chimaeros` in Clark's *Knightsblade*, W40K-0446). |

## Edge case — The Blade of Antwyr

Dossier §7b flagged the weapon-as-character judgment explicitly. In Annandale's *Warden of the
Blade* + *Castellan* the Blade is a sentient, speaking, daemon-bound sword that converses with
Garran Crowe through both volumes — i.e., it acts as a character in the prose. Promoted as a
character row `the_blade_of_antwyr` (name "The Blade of Antwyr", `the_*` snake-case follows the
existing `the_exalted` precedent) with `primaryFactionId: daemons` (Slaanesh daemon bound into
the blade). The alternative (leaving unresolved) would lose a freq-2 named entity tracked across
two wave books; the chosen path matches Pass-6's discipline ("only leave unresolved when identity
is genuinely ambiguous" — here the identity is unambiguous, only the schema fit is novel).

## Deliberate non-promotions (runbook §4 discipline)

freq-1 long tail left **unresolved** (not strictly eponymous of a wave book + not curated by
dossier §7b as a Phase-3 promotion target). Pass-6 followed the same discipline.

- Path-of-the-Eldar fringe: Kenainath, Amallyn, Brakus Andradus, Maugra. (Kenainath called out
  by dossier §7b as "lore-iconic candidate" — held back: candidate ≠ curated.)
- Path-of-the-Dark-Eldar fringe: none past §7b.
- Ahriman cluster fringe: Helio Isidorus, Setekh.
- Yarrick cluster fringe: (no freq-1 long-tail left after the Yarrick/Rasp/Ghazghkull set).
- Jarnhamar fringe: Baldr Fjolnir.
- Khârn cluster: Skoral, Dreagher.
- Black Legion fringe: Thagus Daravek.
- Phoenix Lords fringe: Neridiath.
- Farsight cluster fringe: Torchstar, Aun'Va.
- Beast Arises freq-1 long-tail (~12 names): Asger Warfist, Marshal Magneric, Juskina Tull,
  Inquisitor Veritus, Lansung, Rafal Kulik, Urquidex, Zerberyn, Captain Daed, Captain Koryn,
  Artemis, Colonel Straken, Torias Telion. Phase-1 report flagged Tull/Lansung/Kulik as
  potential `senatorum_imperialis` FK targets *"whichever subset Phase 3 promotes"* — chosen
  subset: zero. The High-Lords ensemble is genuinely freq-1, no eponymous wave book, no
  lore-iconic individuals at the depth of Koorland/Vangorich/The Beast. The
  `senatorum_imperialis` row landed by Phase 1 is still useful for any future-wave promotion;
  no FK is wasted.
- LtDM anthology fringe (Space Wolves shorts): Daegalan, Hrothgar, Jarl.
- Castellan Crowe fringe: Balthus, Castellan Gavallan.
- Fabius Bile trilogy fringe: Oleander Koh, Itako, Skell. (Dossier §7b explicit: "new freq-1
  trilogy companions are Phase-3 promotions only if lore-iconic" — none qualify.)
- Carcharodons fringe: Te Kahurangi *(direct, Pass-6)*, Voldire.
- Salamanders / Legends-shorts fringe (8 names): Cassios, Tiresias, Daegalan, Hrothgar, Hearon,
  Pyriel, Zurus, Tarikus, Jarold, Rhodomanus, Lugft Huron, Maetrus, Neotera, Naberius, Zavien.
  (Pass-6 set the same discipline for fringe Salamanders short-story characters.)
- Other freq-1: Dak'ir (direct, Pass-6), Tsu'gan (direct, Pass-6), Mephiston (direct, earlier),
  Eldrad Ulthran (direct, earlier), Magnus the Red (direct, earlier), Marneus Calgar (direct),
  Cato Sicarius (direct), Astelan (direct), Ulrik the Slayer (direct), Logan Grimnar (direct),
  Commander Shadowsun (direct), Ragnar Blackmane (direct, alias Ragnar Thunderfist), Fabius
  Bile (direct), Te Kahurangi (direct).
- Already-aliased (no work): Khârn / Kharn → `kharn_the_betrayer`, Dante → `commander_dante`,
  Lord Castellan Creed → `ursarkar_e_creed`.

## Idempotency

Confirmed against the pre-pass 237-row `characters.json` + 34-key `character-aliases.json`:
- All 60 new ids **and** their `name`s are absent pre-pass.
- All 5 new alias keys are absent pre-pass.
- Only missing rows / keys were created; nothing existing was edited (`grukk_face_rippa` row
  unchanged, `Varro Tigurius` alias unchanged).
- All 5 new alias targets (`ahzek_ahriman`, `abaddon_the_despoiler`, `sebastian_yarrick`,
  `commander_farsight`, `gunnlaugur`) point at canonical character ids; the latter three are
  rows created in **this same commit**, no dangling FK in the file at any intermediate state
  (the file is updated atomically — `test:resolver-data` "alias targets point at canonical ids"
  asserts the post-commit state).

Post-phase counts (verified): `characters.json` rows=297 unique-ids=297 unique-names=297;
`character-aliases.json` keys=39.

## FK-safety (runbook §5)

Every new `primaryFactionId` points at a faction that **already exists** in `factions.json`,
either from the pre-Pass-7 baseline (162 rows) or from Pass-7 Phase 1's 4 new rows
(`talons_of_the_emperor` *(not used this phase)*, `senatorum_imperialis` *(not used this
phase — see Beast-Arises freq-1 deliberate-non-promotion)*, `house_chimaeros`, `house_draconis`).
The two Phase-1 FK targets actively consumed by this phase:

- `house_draconis` ← `danial_tan_draconis`, `tolwyn_draconis` (2 rows)
- `house_chimaeros` ← `luk_kar_chimaeros`, `alicia_kar_manticos` (2 rows)

Confirmed green by `test:resolver-data` ("character primaryFactionIds point at existing
factions or null") and `test:apply-override-dry` ("dangling JSON FK/alias refs: 0").

## Verification

- `JSON.parse` valid on both touched JSONs (loaded by `tsx` at resolver module-init; every test
  below would otherwise fail at import time).
- `npm run test:resolver` → **236 passed, 0 failed** (incl. the 12 new seventh-wave cases:
  7 direct + 5 alias-consolidation). Exit 0.
- `npm run test:resolver-data` → `resolver data integrity ok`. All checks green incl.
  "character primaryFactionIds point at existing factions or null", "alias targets point at
  canonical ids". Exit 0.
- `npm run test:resolver-coverage` → exit 0. Totals: characters=**848/1118** (was 844/1118
  post-Phase-2; +4 reflects newly-resolving smoke-book character surface forms in the cumulative
  001..035 smoke set — the wave's 036..045 surface forms get exercised in Phase 4 once the
  apply-range extends). Below-threshold rows are data findings, not failures.
- `npm run test:apply-override-dry` → `[apply-override-dry] ok`. Validation: `missing roster
  externalBookIds: 0`, `missing facet ids: 0`, `invalid normalized roles: 0`, `invalid rating
  overrides: 0`, `missing resolved FK targets: 0`, `dangling JSON FK/alias refs: 0`, `forward
  collection refs: 15` (range-aware guard from Brief 091, all within `applyRange` 001..045 —
  non-blocker), `unresolvable constituent refs: 0`. Exit 0.

## Notes for later (Phase 4 will spot-check)

- `characters.json` now 2073 lines / 297 rows — comfortably whole-file readable; **no axis-slice
  needed yet** (runbook §3 Phase-3 watch — the dossier flagged this as the "ab ~mid-Korpus ggf.
  Achs-Slice nötig" axis to monitor as the corpus grows).
- Phase-4 collection-gaps spot-checks (dossier §7d, not this phase): four
  "no roster collection" anthologies — *Ultramarines (Legends)* (W40K-0427), *Astra Militarum*
  (W40K-0429), *Shas'o* (W40K-0431), *Space Wolves (Legends)* (W40K-0434) — likely cluster with
  the 0402–0406 `format->short_story` data_conflict swarm + `Ahriman: Exodus` (W40K-0372) + the
  *Adeptus Mechanicus Omnibus* (W40K-0393, only 2 of 3 listed constituents). Phase 4 confirms
  against `book-roster.json` and adds edges to `collection-gaps.json` if confirmed missing.
- 5 `format->short_story` data_conflict flags (Batch 041 W40K-0402..0406) + `format->novel` on
  *Farsight* (W40K-0410) + `format->collection` on *Sons of Corax* (W40K-0428): advisory only,
  resolver doesn't act on format. Phase 4 carries them through to the audit cockpit.
- `low_confidence:characters` flag on W40K-0359 *(The Masque of Vyle)* and W40K-0444
  *(Carcharadons: Void Exile)*: this phase took the override character list as-is per dossier
  §7d — the audit flags are preserved for Phase 4 / the audit cockpit.

## Files changed (Phase-3 scope only)

- `scripts/seed-data/characters.json`
- `scripts/seed-data/character-aliases.json`
- `scripts/test-resolver.ts`
- `sessions/resolver-dossiers/resolver-pass-7-phase-3-report.md`

Commit: `Resolver-Pass 7 Phase 3 (Characters) — ssot-w40k-036..045` (no co-author trailer).
