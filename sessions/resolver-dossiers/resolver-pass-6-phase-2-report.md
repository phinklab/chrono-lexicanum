# Resolver-Pass 6 — Phase 2 (Locations) report

> Done-summary. No `## Needs decision` — every promotion/alias call resolved in-phase with
> justification (dossier §7 expected zero hard blockers; confirmed). Wave `ssot-w40k-026..035`
> (W40K-0251..0350), Space-Marine-Battles- / worlds-heavy.

## What changed

- **`scripts/seed-data/locations.json`**: 169 → **189 rows** (+20).
- **`scripts/seed-data/location-aliases.json`**: 13 → **15** (+2).
- **`scripts/seed-data/sectors.json`**: **unchanged** — every new row uses `sector: null`; no candidate
  needed a brand-new segmentum FK.
- **`scripts/test-resolver.ts`**: +6 location cases (4 direct, 2 alias). `npm run test:resolver` = **191 passed, 0 failed**.

## New location rows (20)

Every freq ≥ 2 **unresolved** location surface form from dossier §3/§7c, plus the Case G primary.
`id` = snake_case(name); apostrophes dropped (precedent `rynns_world` / `daniks_world`). All rows
`sector: null, gx: null, gy: null` per the established resolver-promotion pattern (no fabricated map
coords). `tags: []` for worlds; `["region"]` for the two region/warzone-tier forms.

| id | name | freq | tags | rationale |
| --- | --- | --- | --- | --- |
| `orath` | Orath | 4 | `[]` | *Plagues of Orath* warzone (W40K-0299/0320/0321). |
| `agrellan` | Agrellan | 3 | `[]` | Damocles / Agrellan campaign world (W40K-0294/0337/0340). |
| `cryptus` | Cryptus | 3 | `[]` | *Shield of Baal* system — **Case G** (also `Cryptus System` alias). |
| `dalyth` | Dal'yth | 3 | `[]` | T'au septworld, Damocles Gulf crusade (W40K-0262/0263/0298). |
| `sanctus_reach` | Sanctus Reach | 3 | `["region"]` | Sanctus Reach warzone region (W40K-0296/0327/0329). |
| `alaric_prime` | Alaric Prime | 2 | `[]` | Key world of the Sanctus Reach campaign (W40K-0296/0328). |
| `boros_gate` | Boros Gate | 2 | `[]` | Boros system strongpoint, Word Bearers (W40K-0266/0267). |
| `crythe` | Crythe | 2 | `[]` | Night Lords cluster (W40K-0346/0349). |
| `ilissus` | Ilissus | 2 | `[]` | W40K-0286/0311. |
| `lepidus_prime` | Lepidus Prime | 2 | `[]` | Overfiend cluster (W40K-0315/0318). |
| `lycheate` | Lycheate | 2 | `[]` | *Bloodied Rose* novella arc (W40K-0258/0259). |
| `medina_corridor` | Medina Corridor | 2 | `["region"]` | Bastion Wars contested region (W40K-0268/0269). |
| `neva` | Neva | 2 | `[]` | *Faith and Fire* cardinal world (W40K-0254/0256). |
| `port_of_anguish` | Port of Anguish | 2 | `[]` | Salamanders, *Firedrake* (W40K-0273/0276). |
| `sanctuary_101` | Sanctuary 101 | 2 | `[]` | Necron massacre site, *Hammer and Anvil* (W40K-0255/0256). |
| `stratos` | Stratos | 2 | `[]` | Nocturne-system world, Salamanders (W40K-0272/0276). |
| `tanakreg` | Tanakreg | 2 | `[]` | Word Bearers, *Dark Apostle* (W40K-0264/0267). |
| `tsagualsa` | Tsagualsa | 2 | `[]` | Night Lords graveworld (W40K-0348/0349). |
| `van_horne` | Van Horne | 2 | `[]` | *Faith and Fire* location (W40K-0254/0256). Identity confirmed location, not character. |
| `vilamus` | Vilamus | 2 | `[]` | Marines Errant fortress, Red Corsairs raid (W40K-0347/0349). |

## New aliases (2)

Both target canonical rows, lore-unique, no cross-axis trap (dossier §4 conflicts = none).

| surface form | → id | freq | rationale |
| --- | --- | --- | --- |
| `Cryptus System` | `cryptus` | 1 | **Case G** — same *Shield of Baal* system as `Cryptus` (freq 3, new row this phase). One row + alias, not two rows. |
| `the Maelstrom` | `maelstrom` | 2 | Alias-gap fix: the `maelstrom` row (name "Maelstrom", `tags:["warp"]`) already exists; exact-match misses the lowercase-"the" surface form. Mirrors Phase-1's `Tau`→`tau` and the existing `the Phalanx`→`phalanx`. |

## Vessel watch (config Phase-2 trigger)

Dossier §7c confirms **no freq ≥ 2 ship / hulk surface-form** this wave — the Night Lords' *Covenant of
Blood* and any Space Hulk are not tagged as location surface-forms in the override files. The two freq-1
forms that are arguably vessels/megastructures — **`Death of Integrity`** (W40K-0290, the eponymous space
hulk) and **`World Engine`** (W40K-0295, the Necron megastructure) — are left **unresolved** (freq-1; the
dossier explicitly steers "leaves the long tail unresolved", consistent with Phase 1's freq-1 posture). **No
`tags:["vessel"]` row added this phase.**

## Idempotency

Confirmed against the full 169-row `locations.json` + 13-key `location-aliases.json`: all 20 new ids **and**
their `name`s were absent pre-pass, and both alias keys were absent. Only missing rows/keys were created;
nothing existing was edited. Alias targets resolve: `maelstrom` pre-exists; `cryptus` is created in this
same phase.

## Deliberate non-promotions (per runbook §4 discipline)

- **Case H — `Helsreach` / `Hive Helsreach`** (freq-1 each): left **unresolved**. The hive sits on
  `Armageddon`, which already resolves direct; hive-level granularity is unnecessary, and the dossier marks
  Case H lower-priority ("otherwise leave the long-tail freq-1 forms unresolved").
- **freq-1 long tail** left unresolved (no eponymous-iconic promotion this wave): Antagonis, Arvion,
  Badlanding, Bane's Landing, Castellax, Certus-Minor, Chiaro, Claros, Contqual, Craftworld Ulthwé, Ector,
  Gangava Prime, Ghoul Stars, Gildar Rift, Gildar Secundus, Hauts Bassiq, Heletine, Honoria, Kadillus
  Harbour, Kulgarde, Lastrati, Lautis, Lysios, Malodrax, Medina Worlds, Miral Prime, Octavius, Pallevon,
  Pandorax System, Phodia, Pythos, Quintus, Shardenus, Solo-Baston, Squire's Rest, Styxia, Umidia, Valedor,
  Vidar Sector, Watch Fortress Damaroth, Zalathras, Zalidar.
- Already-resolving (no work): Armageddon, Damocles Gulf, Nocturne, Cretacia, Damnos, Fenris, Rynn's World,
  The Fang, Asaheim, Baal, Eastern Fringe, Eye of Terror, Medrengard, Octarius, Piscina IV, Sotha, Ultramar.

## Verification

- `JSON.parse` valid on both touched JSONs (loaded by `tsx` at resolver module-init; a parse error would surface in `test:resolver`).
- `npm run test:resolver` → **191 passed, 0 failed** (incl. the 6 new sixth-wave location cases).
- `npm run test:resolver-data` → `resolver data integrity ok` (exit 0; alias targets point at canonical ids — incl. the new `the Maelstrom`/`Cryptus System` keys — no dangling FKs; sector surface forms resolve as non-pinned locations).
- `npm run test:resolver-coverage` → exit 0 (below-threshold rows are data findings, not failures; location coverage rises as the wave's new forms now resolve).
- `npm run test:apply-override-dry` → `[apply-override-dry] ok` (exit 0; 0 dangling JSON FK/alias refs, 0 missing resolved FK targets).
