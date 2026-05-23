# Resolver-Pass 7 — Phase 2 (Locations) report

> Done-summary. No `## Needs decision` — every promotion call resolved in-phase with
> justification (dossier §7d expected zero hard blockers; confirmed). Wave `ssot-w40k-036..045`
> (W40K-0351..0450), trilogy- and omnibus-heavy with a M32 Beast-Arises arc.

## What changed

- **`scripts/seed-data/locations.json`**: 189 → **201 rows** (+12).
- **`scripts/seed-data/location-aliases.json`**: **unchanged** (15 keys). Dossier §7a confirms no
  cross-batch location alias-consolidation pairs in this wave; every unresolved freq ≥ 2 location appears
  under one consistent surface form.
- **`scripts/seed-data/sectors.json`**: **unchanged** — 11 of 12 new rows use `sector: null`; the twelfth
  (`baal_secundus`) reuses the existing `tempestus` segmentum FK (parent body `baal` is already pinned
  there). No new segmentum/sector was needed.
- **`scripts/test-resolver.ts`**: +10 location cases (all direct matches). `npm run test:resolver` =
  **224 passed, 0 failed**.

## New location rows (12)

Every freq ≥ 2 **unresolved** location surface form from dossier §3/§7c, plus the three lore-iconic freq-1
candidates the dossier explicitly curated (`Ulthwe`, `Inwit`, `Baal Secundus`). `id` = snake_case(name)
with `The` dropped per existing precedent (`fang`, `phalanx`, `spire`, `great_rift`). All freshly-promoted
rows use `sector: null, gx: null, gy: null` per the established resolver-promotion pattern (no
fabricated map coords); `baal_secundus` reuses `sector: "tempestus"` since the parent `baal` row is
already pinned there. Faction-tag values reuse existing canonical faction ids (`orks`, `eldar`,
`mechanicus`, `imperial_knights`, `astra_militarum`, `imperial_navy`, `dark_angels`, `imperial_fists`,
`blood_angels`) so future map / facet code can pivot off them without an FK chase.

| id | name | freq | tags | rationale |
| --- | --- | --- | --- | --- |
| `ullanor` | Ullanor | 5 | `["orks"]` | M32 Ork throneworld; spine of *The Beast Arises* close (W40K-0420/0421/0422/0423/0424). Lore-iconic since the Great Crusade Ullanor Crusade. |
| `alaitoc` | Alaitoc | 4 | `["eldar"]` | Craftworld Alaitoc, homeworld of Thorpe's *Path of the Eldar* trilogy + omnibus (W40K-0351/0352/0353/0354). Mirrors the location-axis `iyanden` precedent (Craftworld as Location, sub-faction aliased via faction-aliases). |
| `velchanos_magna` | Velchanos Magna | 3 | `["mechanicus"]` | Forge World of Sanders' *Skitarius* / *Tech-Priest* / Adeptus Mechanicus Omnibus (W40K-0391/0392/0393). |
| `adrastapol` | Adrastapol | 2 | `["imperial_knights"]` | Imperial Knight noble homeworld of the *Kingsblade* / *Knightsblade* duology (W40K-0445/0446). |
| `demetrius` | Demetrius | 2 | `["astra_militarum"]` | Macharian Crusade target system, *Fist of Demetrius* + omnibus (W40K-0362/0364). |
| `loki` | Loki | 2 | `["astra_militarum"]` | Macharian Crusade target system, *Fall of Macharius* + omnibus (W40K-0363/0364). |
| `mistral` | Mistral | 2 | `["astra_militarum"]` | Hades-class hive world in Yarrick's arc (*Imperial Creed* W40K-0377 + omnibus W40K-0379). |
| `phall` | Phall | 2 | `["imperial_navy"]` | Imperial Navy contested system in *The Beast Arises* (W40K-0417/0418); echoes the Heresy-era Battle of Phall, hence `imperial_navy` tag. |
| `rock` | The Rock | 2 | `["dark_angels"]` | Dark Angels' mobile fortress-monastery asteroid; *The Unforgiven* + Legacy of Caliban Omnibus (W40K-0385/0386). Id follows the `fang`/`phalanx`/`spire` "drop The" precedent. |
| `ulthwe` | Ulthwe | 1 (lore-iconic) | `["eldar"]` | Craftworld Ulthwé, surfaces in *Jain Zar: The Storm of Silence* (W40K-0396). Dossier §7c lore-iconic freq-1 candidate. The unresolved `Craftworld Ulthwé` long-tail from Pass 6 (Phase-2 report §"Deliberate non-promotions") now resolves cleanly. |
| `inwit` | Inwit | 1 (lore-iconic) | `["imperial_fists"]` | Imperial Fists homeworld, central to M32 *The Last Son of Dorn* (W40K-0423). Dossier §7c lore-iconic freq-1 candidate. |
| `baal_secundus` | Baal Secundus | 1 (lore-iconic) | `["blood_angels"]` | Blood Angels recruitment moon, distinct from the parent `baal` system; surfaces in Haley's *Dante* (W40K-0450). Dossier §7c lore-iconic freq-1 candidate. **Sole row with a non-null sector** this phase: reuses existing `tempestus` segmentum FK (parent `baal` is pinned there). |

## Idempotency

Confirmed against the pre-pass 189-row `locations.json`: all 12 new ids **and** their `name`s were absent;
no existing row was edited. `location-aliases.json` and `sectors.json` were not touched at all.

## Deliberate non-promotions (per runbook §4 discipline)

- **Cross-batch alias-consolidation cases (Dossier §7a)** — confirmation only, no row work:
  - `Cryptus` (W40K-0450 from *Dante*, freq 1) already resolves direct via the Pass-6 promotion;
    re-uses canonical `cryptus` (with the Pass-6 `Cryptus System` alias also still in place).
- **freq ≥ 2 unresolved long-tail** left unresolved this phase (insufficient lore-iconic case to justify a
  freq=2 promotion against the dossier curation, or the surface form represents a sub-region of an
  already-pinned world): none from §3 — every freq ≥ 2 location was promoted.
- **freq-1 long tail** left unresolved (no eponymous-iconic promotion this wave outside the dossier's
  curated three): Anuiven, Aphium, Ardamantua, Arkunasha, Arthas Moloch, Badab, Blackstone Fortress,
  Caldera, Diamantus, Divinatus Prime, Donatos, Dynikas V, Gathis, Hypasitis, Kolovan, Kora, Kurbynola
  System, Morsus, Perreken, Phlegethon, Piety V, Port Sanctus, Precipice, Ras Shakeh, Rhamiel, Sable
  Marches, Salandraxis, Sandava II, Sandava III, Sargassion Reach, Vaporis, Vior'los, Vondrak, Zartak.
  Notable: **Ardamantua** (W40K-0414 *I Am Slaughter* — the Imperial-Fists-massacre that triggers the
  whole 12-book Beast Arises mega-series) is left freq-1-unresolved this phase to stay strict with the
  dossier's curated freq-1 list (Ulthwe / Inwit / Baal Secundus). Future Beast-Arises retro-anthologies
  or reprints could promote it cleanly via `location-aliases.json` + a single row later.
- Already-resolving (no work): Eye of Terror, Terra, Commorragh, Armageddon, Mars, Cadia, Fenris,
  Golgotha, Planet of the Sorcerers, Prospero, Solemnace, The Fang, Damocles Gulf, Cryptus, Eastern
  Fringe, Imperium Nihilus, Macragge, Sotha, Ultramar, Webway.

## Vessel watch (config Phase-2 trigger)

Dossier §7c confirms **no freq ≥ 2 ship / hulk surface-form** this wave — the Aeldari craftworlds *are*
mobile worldships, but treated as locations per the standard precedent (`iyanden` is a location, not a
vessel). The only freq-0 ship-named candidate the dossier names (*Vulkan's Wrath* from Forges of Mars,
not in this aggregator) is genuinely long-tail and stays out of scope. **No `tags:["vessel"]` row added
this phase.**

## Verification

- `JSON.parse` valid on `locations.json` (loaded by `tsx` at resolver module-init; a parse error would
  surface in `test:resolver`).
- `npm run test:resolver` → **224 passed, 0 failed** (incl. the 10 new seventh-wave location cases).
- `npm run test:resolver-data` → `resolver data integrity ok` (exit 0; **location sectors point at
  existing sectors or null** — incl. `baal_secundus → tempestus` and the eleven `sector: null` rows;
  alias targets point at canonical ids; no dangling FKs).
- `npm run test:resolver-coverage` → exit 0 (below-threshold rows are data findings, not failures).
- `npm run test:apply-override-dry` → `[apply-override-dry] ok` (exit 0; 0 dangling JSON FK/alias refs,
  0 missing resolved FK targets, 15 forward collection refs as expected for the un-applied wave range).
