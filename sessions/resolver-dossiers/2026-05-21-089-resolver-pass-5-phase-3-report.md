# Resolver-Pass 5 — Phase 3 (Characters) report

> Done-summary. No `## Needs decision` — the five cross-batch consolidation cases all took the Cowork default.

## What changed

- **`scripts/seed-data/characters.json`**: 169 → **199 rows** (+30).
- **`scripts/seed-data/character-aliases.json`**: 26 → **28** (+2 consolidation aliases).
- **`scripts/test-resolver.ts`**: +6 character cases (4 direct, **2 alias-consolidation**). `test:resolver` = **173 passed, 0 failed**.
- `test:resolver-data` (integrity) all green — incl. "character primaryFactionIds point at existing factions" and "no duplicate ids or names".

## New character rows (30)

**freq≥2 promotions (22):** alaric→grey_knights, gabriel_angelos→blood_ravens, macha→eldar,
rafen→blood_angels, marshal_brant→black_templars, nyxos→ordo_malleus, arkio→blood_angels,
arvin_larn→astra_militarum, captain_raphael→blood_angels, captain_sebastev→vostroyan_firstborn,
duke_venalitor→khorne, ghargatuloth→tzeentch, isador_akios→blood_ravens, major_mortensen→astra_militarum,
mephiston→blood_angels, noxx→flesh_tearers, parmenion_thade→cadian_shock_troops, remius_stele→word_bearers,
rhamah→blood_ravens, sergeant_greiss→catachan_jungle_fighters, sergeant_lorenzo→blood_angels,
sergeant_wulfe→cadian_shock_troops.

**freq=1 lore-iconic (6):** astorath→blood_angels (BA High Chaplain), colonel_iron_hand_straken→
catachan_jungle_fighters (iconic Catachan hero), commissar_flint→commissariat (W40K-0237 protagonist),
bastun_hasp→commissariat (W40K-0247 protagonist), dalchian_rassaq→night_lords (W40K-0244 POV),
tempestor_traxel→tempestus_scions (W40K-0243 lead).

**Cross-batch consolidation (2):** lo_bannick→cadian_shock_troops, commander_dante→blood_angels.

## The five cross-batch alias-consolidation cases (dossier §5)

| Case | Resolution | How |
| --- | --- | --- |
| **A — Lo Bannick** | ✅ one row `lo_bannick` | row name "Lo Bannick"; alias "Marken Cortein Lo Bannick" (W40K-0238 *Baneblade*) → lo_bannick; "Lo Bannick" (W40K-0241 *Shadowsword*) direct. |
| **B — Dante** | ✅ one row `commander_dante` | row name "Commander Dante" (W40K-0223 *Astorath*); alias "Dante" (W40K-0217 *Deus Encarmine*) → commander_dante. |
| **C — Alaric** | ✅ one row `alaric` | single surface-form across W40K-0213/0214/0215 + omnibus 0216; no alias needed. |
| **D — Gabriel Angelos / Macha** | ✅ one row each | single consistent surface-forms across the DoW trilogy + omnibus; no alias. gabriel_angelos→blood_ravens, macha→eldar. |
| **E — Yarrick** | ✅ no work | NOT tagged as a character in any 021..025 override (synopsis-mention only in W40K-0230). No row invented. |

Both consolidation cases (A, B) carry a `notes` line documenting the merge. The two consolidation
test cases assert that **both** surface-forms resolve to the single canonical id.

## primaryFactionId conventions applied

- **Commissars → `commissariat`** (Flint, Hasp), matching the existing Gaunt / Hark / Cain rows (the
  Commissariat is the institutional home; the attached regiment is not the primary faction).
- **Fallen Inquisitor Remius Stele → `word_bearers`** (operative allegiance/antagonist role), not
  loyalist `inquisition` — documented in the row `notes`.
- **Daemon antagonists**: Duke Venalitor → khorne, Ghargatuloth → tzeentch (their patron god).
- **Dawn-of-War Blood Ravens** (Angelos, Isador, Rhamah) → the new `blood_ravens` faction (Phase 1
  strictly precedes Phase 3, so the FK exists). Macha → eldar.
- All 30 `primaryFactionId` values verified by `test:resolver-data` ("point at existing factions").

## Idempotency

All 30 ids and names absent pre-pass (verified). Existing direct-match characters NOT touched: Fabius
Bile, Shira Calpurnia.

## Verification

- `node -e JSON.parse` on `characters.json` + `character-aliases.json` → valid; 199 rows.
- `npm run test:resolver` → **173 passed, 0 failed** (incl. 6 new char cases; 2 alias-consolidation).
- `npm run test:resolver-data` → all integrity checks pass (FKs, no dup ids/names, alias targets valid).
