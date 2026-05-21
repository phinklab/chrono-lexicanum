# Resolver-Pass 5 — Phase 1 (Factions) report

> Done-summary. No `## Needs decision` — all Call-1 decisions resolved in-phase with justification.

## What changed

- **`scripts/seed-data/factions.json`**: 146 → **154 rows** (+8).
- **`scripts/seed-data/faction-aliases.json`**: 36 → **37** (+1, `Collegia Titanica`).
- **`scripts/seed-data/faction-policy.json`**: +2 `specialCases` notes (`deathwatch`, `tempestus_scions`); no browse-root added.
- **`scripts/test-resolver.ts`**: +8 faction cases (7 direct, 1 alias). `npm run test:resolver` = **162 passed, 0 failed**.

## New faction rows (8)

| id | name | parent | alignment | tone | freq | rationale |
| --- | --- | --- | --- | --- | --- | --- |
| `blood_ravens` | Blood Ravens | adeptus_astartes | imperium | imperial | **6** | Dawn-of-War chapter, the largest unresolved faction in the wave (W40K-0207..0212). |
| `adeptus_astra_telepathica` | Adeptus Astra Telepathica | imperium | imperium | archive | **2** | Astropath/Telepathica org (Calpurnia *Blind* + Enforcer omnibus). Parent imperium, non-browse-root — mirrors `adeptus_arbites`. |
| `mordian_iron_guard` | Mordian Iron Guard | astra_militarum | imperium | line | **2** | The only Call-1 regiment at freq≥2 (W40K-0236 *Iron Guard* + W40K-0249 *Iron Resolve*). |
| `deathwatch` | Deathwatch | adeptus_astartes | imperium | archive | 1 | Brief-named Deathwatch-line opener (W40K-0250 *Warrior Brood*). Ordo-Xenos chamber militant → single-parent `adeptus_astartes` analog `grey_knights`. |
| `vostroyan_firstborn` | Vostroyan Firstborn | astra_militarum | imperium | line | 1 | Codex-iconic regiment; principal faction of W40K-0237 *Commissar*. |
| `tallarn_desert_raiders` | Tallarn Desert Raiders | astra_militarum | imperium | line | 1 | Codex-iconic regiment; defining identity of W40K-0228 *Desert Raiders* (surface-form tagged on the W40K-0234 omnibus). |
| `tempestus_scions` | Tempestus Scions | astra_militarum | imperium | line | 1 | Iconic elite formation; principal of W40K-0243 *Final Deployment*. |
| `savlar_chem_dogs` | Savlar Chem-Dogs | astra_militarum | imperium | line | 1 | Distinctive penal/chem regiment; defining identity of W40K-0247 *Chem Dog*. |

## Call 1 — Astra-Militarum regiments: freq tally + promotion logic

The deterministic aggregator (`aggregate-surface-forms-089.ts`) shows the wave tags generic
`Astra Militarum` (12) / `Imperial Guard` (7, alias→astra_militarum) far more than any named regiment.
Of the brief's flagged regiments, **only `Mordian Iron Guard` reaches freq≥2** (2). The rest are each
freq=1 because the books predominantly tag the umbrella, not the regiment.

**Promotion rule applied** (consistent with the established data model — `factions.json` already carries
~13 named-regiment rows under `astra_militarum`, most of them 1–2-book regiments from Gaunt's Ghosts /
Last Chancers): promote freq≥2 + freq=1 regiments that are (a) codex-iconic AND (b) the *principal*
faction of a book in this wave AND (c) not already represented.

- **Promoted:** Mordian Iron Guard (freq 2), Vostroyan Firstborn, Tallarn Desert Raiders, Tempestus
  Scions, Savlar Chem-Dogs (all freq=1, each the principal/defining regiment of its book).
- **Left as surface-form (unresolved):**
  - `Brimlock Dragoons` (freq 1) — *supporting* tag in W40K-0235 *Imperial Glory* whose principal is
    generic Guard; less iconic. Conservative exclusion.
  - `Valhallan Ice Warriors` (freq 1, omnibus-only tag W40K-0234) — the **regiment-TYPE**, while a
    specific Valhallan regiment row `valhallan_597th` already exists. Aliasing type→specific would be a
    wrong canonical edge; a parallel broad row alongside the specific one is muddy. Left unresolved.
  - `Blades of Atrocity` (W40K-0244 Night Lords warband, freq 1), `Enslavers`, `Red Wings` — niche,
    freq 1, stay surface-form.

## Other faction decisions

- **`Collegia Titanica` → alias `adeptus_titanicus`** (freq 2, W40K-0203/0205). Same institution (Titan
  Legions); the browse-root row `adeptus_titanicus` already exists. Clean, lore-unambiguous alias.
- **`deathwatch` parent = `adeptus_astartes`** (not a new browse-root, not under `ordo_xenos`): single-
  parent limit + `grey_knights` precedent (chamber militant under astartes for resolver robustness).
- **`tempestus_scions` parent = `astra_militarum`**: institutionally parallel but grouped under the Guard
  umbrella for reader filtering (commissariat-style pragmatism), documented in policy `specialCases`.

## Idempotency

Confirmed already-present (NOT recreated): `astra_militarum`, `adeptus_astartes`, `adeptus_arbites`,
`black_templars`, `grey_knights`, `blood_angels`, `flesh_tearers`, `night_lords`, `crimson_slaughter`,
`fabius_bile_coterie`, `cadian_shock_troops`, `catachan_jungle_fighters`, `death_korps_of_krieg`,
`valhallan_597th`, `adeptus_titanicus`, `raven_guard`, `sisters_of_battle`, `mechanicus`, `ordo_xenos`,
`ordo_malleus`, `word_bearers`, `emperors_children`, `death_guard`, `khorne`, `tzeentch`, `alpha_legion`,
`dark_mechanicum`, `necrons`, `tyranids`, `orks`. All 8 new ids are absent pre-pass.

## Verification

- `node -e JSON.parse` on the 3 touched JSON files → valid.
- `npm run test:resolver` → **162 passed, 0 failed** (incl. the 8 new fifth-wave cases).
- No browse-root added; `faction-policy.json` change is documentation-only (`specialCases`).
- Grand-alignment skip (Brief 077) unaffected: all new sub-factions carry explicit `alignment`, so a book
  tagging both `Imperium`/`Chaos` and a new sub-faction will skip the redundant umbrella as before.
