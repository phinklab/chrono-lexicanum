# Resolver-Pass 5 — Phase 2 (Locations) report

> Done-summary. No `## Needs decision`.

## What changed

- **`scripts/seed-data/locations.json`**: 157 → **169 rows** (+12).
- **`scripts/seed-data/location-aliases.json`**: unchanged (all 12 resolve by direct name match — no alias needed).
- **`scripts/seed-data/sectors.json`**: unchanged (none of the 12 worlds maps to one of the 8 existing sectors → `sector: null`).
- **`scripts/test-resolver.ts`**: +5 location cases. `npm run test:resolver` = **167 passed, 0 failed**.

## New location rows (12 — all freq≥2)

| id | name | tags | example books | note |
| --- | --- | --- | --- | --- |
| `tartarus` | Tartarus | [] | W40K-0207, W40K-0210 | Dawn of War (novel + omnibus). |
| `rahes_paradise` | Rahe's Paradise | [] | W40K-0208, W40K-0210 | Ascension (novel + omnibus). |
| `solemnus` | Solemnus | [] | W40K-0203, W40K-0205 | Black Templars homeworld, *Crusade for Armageddon* (+ omnibus). |
| `chaeroneia` | Chaeroneia | [] | W40K-0214, W40K-0216 | Dark-Mechanicum forge world, *Dark Adeptus* (+ GK omnibus). |
| `drakaasi` | Drakaasi | [] | W40K-0215, W40K-0216 | Chaos arena world, *Hammer of Daemons* (+ GK omnibus). |
| `sin_of_damnation` | Sin of Damnation | **["vessel"]** | W40K-0221, W40K-0222 | **Space hulk** → vessel (072/076 convention: `gx/gy:null`). |
| `broucheroc` | Broucheroc | [] | W40K-0224, W40K-0227 | *Fifteen Hours* siege world (+ IG omnibus). |
| `rogar_iii` | Rogar III | [] | W40K-0225, W40K-0227 | *Death World* (+ IG omnibus). |
| `daniks_world` | Danik's World | [] | W40K-0226, W40K-0227 | *Rebel Winter* (+ IG omnibus). |
| `golgotha` | Golgotha | [] | W40K-0230, W40K-0234 | *Gunheads* desert war world (+ Hammer omnibus). |
| `kathur` | Kathur | [] | W40K-0231, W40K-0240 | *Cadian Blood* plague world (+ Honour omnibus). |
| `hieronymous_theta` | Hieronymous Theta | [] | W40K-0233, W40K-0240 | *Dead Men Walking* Necron world (+ Honour omnibus). |

## Decisions

- **Promotion bar = freq≥2 (strict).** All 12 promotions are freq≥2 in the deterministic aggregate.
  Most are "novel + its omnibus" pairs (e.g. Golgotha in *Gunheads* W40K-0230 + the *Hammer of the
  Emperor* omnibus W40K-0234), which still counts as ≥2 catalogued occurrences AND each is the principal
  setting of its novel — the strongest case for a location row.
- **`Sin of Damnation` = vessel.** A space hulk, modelled as `tags:["vessel"]` with null sector/coords,
  per the existing space-hulk/vessel convention (`casus_belli`, `ithracas_vengeance`, `steel_tread`).
- **No coordinates / sectors.** These are novel-specific battle worlds without canonical galaxy-map
  positions; `sector: null`, `gx: null`, `gy: null`, `tags: []` (migration 0009 made gx/gy nullable for
  exactly this). None matches the 8 existing `sectors.json` rows → no sector added.
- **freq=1 locations left surface-form** (unresolved, kept in `book_details.notes`): ~25 single-book
  worlds incl. Bastion Psykana, Herodian IV, Kalidar, Paragon, Aurelia, Geratomro, etc. Conservative
  boundary; the freq≥2 set already covers the wave's principal settings.
- **No location aliases added.** Every promoted surface-form (incl. apostrophe/numeral forms "Danik's
  World", "Rogar III") matches its row name directly; adding aliases would be redundant.

## Idempotency

All 12 ids and names are absent pre-pass (verified). Existing direct-match worlds NOT touched: Baal,
Armageddon, Hydraphur, Eye of Terror, Acheron.

## Verification

- `node -e JSON.parse` on `locations.json` → valid; 169 rows.
- `npm run test:resolver` → **167 passed, 0 failed** (incl. 5 new location cases, one exercising the
  vessel tag and one the apostrophe surface form).
