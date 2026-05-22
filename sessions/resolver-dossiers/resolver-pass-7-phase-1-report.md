# Resolver-Pass 7 — Phase 1 (Factions) report

> Done-summary. No `## Needs decision` — every promotion/alias call resolved in-phase with
> justification (dossier §7d expected zero hard blockers; confirmed). Wave `ssot-w40k-036..045`
> (W40K-0351..0450), trilogy-/omnibus-/chapter-heavy with M32 Beast-Arises ensemble +
> Imperial-Knights duology.

## What changed

- **`scripts/seed-data/factions.json`**: 162 → **166 rows** (+4).
- **`scripts/seed-data/faction-aliases.json`**: 41 → **48** (+7).
- **`scripts/seed-data/faction-policy.json`**: **untouched** (per config trigger: read-only, no
  new browse-root, no new specialCases entry).
- **`scripts/test-resolver.ts`**: +8 faction cases (4 direct, 4 alias). `npm run test:resolver`
  = **214 passed, 0 failed**.

## New faction rows (4)

Every freq ≥ 2 **unresolved** faction surface form from dossier §3/§7c that warrants its own row
+ the one strictly-lore-iconic freq-1 (per §7c "Phase 1 should promote"). ID = snake_case(name);
all four parents (`imperium`, `imperial_knights`) are pre-existing rows → FK-safe.

| id | name | parent | alignment | tone | freq | rationale |
| --- | --- | --- | --- | --- | --- | --- |
| `talons_of_the_emperor` | Talons of the Emperor | `imperium` | `imperium` | `gold` | **3** | Custodes + Sisters of Silence joint org; surfaces in *Watchers in Death* / *The Last Son of Dorn* / *Shadow of Ullanor* (W40K-0422..0424). New umbrella row — Custodes (`custodes`, exists) stays separately under `imperium` per idempotency discipline. **[Phase-3 FK: any Sisters-of-Silence-led character promoted in Phase 3.]** |
| `senatorum_imperialis` | Senatorum Imperialis | `imperium` | `imperium` | `imperial` | 1 (lore-iconic) | M32 High Lords body in *The Beheading* (W40K-0425). Promoted per §7c default; freq-1 but lore-unambiguous and the natural `primaryFactionId` for the High-Lords ensemble. **[Phase-3 FK: Juskina Tull, Lansung, Rafal Kulik, Vangorich (Officio is closer), Inquisitor Veritus (Inquisition is closer) — whichever subset Phase 3 promotes.]** |
| `house_chimaeros` | House Chimaeros | `imperial_knights` | `imperium` | `imperial` | **2** | Imperial-Knight antagonist house from Andy Clark's *Kingsblade* / *Knightsblade* duology (W40K-0445/0446). Promoted on maintainer judgment (per dossier §7c the alias-to-`imperial_knights` path is the default; the noble-house-promote path is the alternative — chosen here to give Phase 3 a distinct FK for the four Chimaeros/Manticos characters). 3-level hierarchy `mechanicus → imperial_knights → house_*` matches the existing Necromunda noble-house pattern (Helmawr/Goliath/Escher under `necromunda`). **[Phase-3 FK: Luk Kar Chimaeros, Alicia Kar Manticos.]** |
| `house_draconis` | House Draconis | `imperial_knights` | `imperium` | `imperial` | **2** | Imperial-Knight protagonist house (Adrastapol) from the same duology. Symmetric to Chimaeros. **[Phase-3 FK: Danial Tan Draconis, Tolwyn Tan Draconis.]** |

**Parent logic** (all parents pre-existing → FK-safe): direct-imperium-tier orgs (Talons, Senatorum)
take `parent: imperium` mirroring the `custodes`-row treatment for joint Imperial bodies;
Imperial-Knight noble houses take `parent: imperial_knights` (which itself sits under `mechanicus`),
forming the 3-level chapter-level granularity matched by the Necromunda houses precedent.

## New aliases (7)

All target ids exist (pre-existing rows in `factions.json` or new rows added in this same phase).
Each surface form occurs concretely in the wave + maps to a lore-unique canonical id + carries no
cross-axis disambiguation trap (dossier §4 conflicts = none).

| surface form | → id | freq | rationale |
| --- | --- | --- | --- |
| `The Fallen` | `fallen_angels` | **4** | Existing row `fallen_angels` (Pass 2). Identical lore concept (Cypher's Fallen Brethren) — alias rather than new row keeps idempotency (Pass-2 row stays untouched). |
| `Sisters of Silence` | `talons_of_the_emperor` | **3** | Surface-form-on-umbrella, mirrors Pass-2 pattern `Cadian → cadian_shock_troops` / Pass-6 `Tau → tau`. Target row added in this phase. |
| `Craftworld Eldar` | `eldar` | **5** | Dossier-§7c default — matches existing `Craftworld Aeldari → eldar` (aliases:35) and `Aeldari → eldar` (aliases:7). Keeps Pass-2 Aeldari-umbrella convention (no Craftworld-vs-Commorrite-vs-Aspect-Warrior granularity introduced). |
| `Eldar Corsairs` | `eldar` | **2** | Aeldari sub-form; same Aeldari-umbrella convention as `Dark Eldar`/`Drukhari → eldar`. `aeldari_corsairs` exists as a sub-row, but the bare `Eldar Corsairs` form aliases to the umbrella — symmetric to how `Dark Eldar` doesn't alias to a Commorrite sub-row. |
| `Incubi` | `eldar` | **2** | Drukhari bodyguard cult; Aeldari-umbrella per §7c — Pass 7 does not introduce aspect-warrior/cult-level granularity. |
| `Mandrakes` | `eldar` | **2** | Drukhari shadow killers; Aeldari-umbrella per §7c. |
| `Striking Scorpions` | `eldar` | **2** | Aeldari Aspect Warriors; Aeldari-umbrella per §7c. |

## Carry-over decisions (dossier §7c → resolved in-phase)

1. **`The Fallen` (4 occ)** → alias to existing `fallen_angels`. (Dossier hinted "Phase 1 promotes" — interpreted as "make the surface-form resolvable", not "create a duplicate row of `fallen_angels`".)
2. **`Sisters of Silence` (3 occ)** → new row `talons_of_the_emperor` + alias `Sisters of Silence` → it. (Dossier explicit: "Imperial Talons-of-the-Emperor sisterhood".)
3. **`Craftworld Eldar` (5 occ)** → alias to `eldar` (dossier-§7c default). The alternative path (`craftworld_aeldari` as a new sub-row under `eldar`) was not taken — Pass 7 is not the moment to introduce Craftworld-vs-Commorrite granularity into the umbrella; Pass-2 convention (Dark Eldar / Drukhari / Biel-Tan / Iyanden / Craftworld Aeldari all → `eldar`) stands.
4. **`Senatorum Imperialis` (1 occ, lore-iconic)** → new row (dossier-§7c "Phase 1 should promote").
5. **`Eldar Corsairs` / `Incubi` / `Mandrakes` / `Striking Scorpions` (each freq 2)** → alias to `eldar` (dossier-§7c default). No aspect-warrior/cult-level granularity introduced.
6. **`House Chimaeros` / `House Draconis` (each freq 2)** → new rows under `parent: imperial_knights` (maintainer judgment in-phase; dossier flagged the alias-vs-promote choice as defensible either way). The promote path was chosen to give Phase 3 distinct FKs for the four Chimaeros/Manticos and Draconis characters, matching the existing Necromunda 3-level noble-house pattern. No `faction-policy.json` edit (no new browse-root, no specialCase entry — `imperial_knights` already sits under `mechanicus` and that parent edge plus the new rows is enough).

## Idempotency

Confirmed against the full 162-row `factions.json` + 41-key `faction-aliases.json`:
- All 4 new ids **and** their `name`s are absent pre-pass.
- All 7 alias keys are absent pre-pass.
- Only missing rows were created; nothing existing was edited.
- Already-present parents reused (NOT recreated): `imperium`, `imperial_knights`.
- Already-present alias targets reused (NOT recreated): `fallen_angels`, `eldar`.
- New row `talons_of_the_emperor` (added in this phase) is the target for the `Sisters of Silence` alias — both land in the same commit, no dangling FK in the file at any intermediate state (the file is updated atomically).

Post-phase counts (verified): `factions.json` rows=166 unique-ids=166 unique-names=166;
`faction-aliases.json` keys=48.

## Deliberate non-promotions (per runbook §4 discipline)

freq-1 long tail left **unresolved** (not strictly eponymous of a wave book): `Brazen Minotaurs`,
`Mantis Warriors`, `Astral Claws` (Badab War successors, surface in *Sons of Corax* / *The Trial of
the Mantis Warrior*), `Blood Disciples`, `Flesh Thieves` (Salamanders shorts). Pass-6 set the same
discipline (only freq-1 promotion last wave: `legion_of_the_damned`, strictly eponymous of W40K-0285).

Already-resolving (no work this phase): `Orks` (21) / `Astra Militarum` (17) / `Inquisition` (12) /
`Adeptus Mechanicus` (11, alias→`mechanicus`) / `Thousand Sons` (11) / `Dark Eldar` (10, alias) /
`Dark Angels` (9) / `Space Wolves` (9) / `Tyranids` (8) / `Necrons` (7) / `Adeptus Astartes` (6) /
`Emperor's Children` (6) / `Heretic Astartes` (6) / `Black Templars` (5) / `Blood Angels` (5) /
`Death Guard` (5) / `Eldar` (5, alias) / `Imperial Fists` (5) / `Adepta Sororitas` (4) /
`Chaos Daemons` (4, alias) / `Iron Warriors` (4) / `T'au Empire` (4) / `Black Legion` (3) /
`Carcharodons` (3) / `Deathwatch` (3) / `Dark Mechanicum` (2) / `Drukhari` (2, alias) /
`Ecclesiarchy` (2) / `Flesh Tearers` (2) / `Grey Knights` (2) / `Officio Assassinorum` (2) /
`Ordo Xenos` (2) / `Raven Guard` (2) / `Salamanders` (2) / `Tau` (2, alias) / `Ultramarines` (2) /
`World Eaters` (2), plus the freq-1 direct-resolves (`Adeptus Arbites`, `Crimson Fists`, `Daemons`,
`Doom Eagles`, `Harlequins`, `Imperial Knights`, `Imperial Navy`, `Night Lords`, `Red Corsairs`,
`Scythes of the Emperor`, `Sons of Horus`, `Word Bearers`).

**Cross-axis fallen explicitly avoided** (NOT added to `faction-aliases.json`): `Alaitoc`, `Ulthwe`
are Location surface forms (Phase 2 owns); `Ahriman`, `Cypher`, `Astelan`, `Dante`, `The Beast` are
Character surface forms (Phase 3 owns).

## Phase-3 FK readiness (runbook §5)

All four new faction dependencies flagged by dossier §7b/§7c are now landed:
- `talons_of_the_emperor` — for any Sisters-of-Silence-led character Phase 3 promotes (no freq ≥ 2 explicit candidate in §3, but the umbrella is in place).
- `senatorum_imperialis` — for the M32 High Lords ensemble (Juskina Tull / Lansung / Rafal Kulik etc., if Phase 3 promotes them; Vangorich → `officio_assassinorum`, Veritus → `inquisition` are closer).
- `house_chimaeros` — for Luk Kar Chimaeros (freq 2), Alicia Kar Manticos (freq 1).
- `house_draconis` — for Danial Tan Draconis (freq 2), Tolwyn Tan Draconis (freq 1).

Every other Phase-3 spine identified in dossier §7b already points at a pre-existing faction
(`imperial_fists`, `officio_assassinorum`, `inquisition`, `orks`, `eldar`, `thousand_sons`,
`astra_militarum`, `space_wolves`, `dark_angels`, `mechanicus`, `tau`, `black_legion`,
`emperors_children`, `carcharodons`, `blood_angels`, `grey_knights`). The Cypher alias case
(`Cypher → fallen_angels` already exists implicitly via the new `The Fallen → fallen_angels`
alias; Cypher itself is a character surface form for Phase 3 to handle).

Phase 3 must **read the freshly-committed Phase-1 factions.json** (runbook §5: phase reads its
own scope + the committed Phase-1 set; no FK trap from setting `primaryFactionId` against the
pre-Phase-7 baseline).

## Verification

- `JSON.parse` valid on both touched JSONs (loaded by `tsx` at resolver module-init — every test
  below would otherwise fail at import time).
- `npm run test:resolver` → **214 passed, 0 failed** (incl. the 8 new seventh-wave cases). Exit 0.
- `npm run test:resolver-data` → `resolver data integrity ok` (alias targets point at canonical
  ids; no dangling FKs; no duplicate ids/names; the 4 new rows pass the parent-points-at-existing
  check). Exit 0.
- `npm run test:resolver-coverage` → exit 0. Totals: factions = 1424 / 1729 (post-Brief-077
  grand-alignment skip suppresses 165 umbrella surface forms), locations = 543 / 689, characters
  = 844 / 1118. Below-threshold rows are data findings, not failures. The 4 new faction rows +
  19 newly-resolving wave occurrences (4 + 3 + 5 + 4 promoted; 4 + 3 + 5 + 2 + 2 + 2 + 2 aliased
  = effectively all the previously-unresolved freq ≥ 2 faction surface forms in the wave
  except the 5 deliberate-non-promotions long-tail).
- `npm run test:apply-override-dry` → `[apply-override-dry] ok`. Validation block:
  `missing roster externalBookIds: 0`, `missing facet ids: 0`, `invalid normalized roles: 0`,
  `invalid rating overrides: 0`, `missing resolved FK targets: 0`, `dangling JSON FK/alias
  refs: 0`, `forward collection refs: 15` (range-aware guard from Brief 091, all within
  `applyRange` 001..045 — non-blocker), `unresolvable constituent refs: 0`. Exit 0.

Grand-alignment skip (Brief 077) unaffected: all 4 new sub-factions carry explicit `alignment`,
so a block tagging both `Imperium`/`Chaos` + a new sub-faction skips the redundant umbrella as
before (matches Pass-6's discipline note).
