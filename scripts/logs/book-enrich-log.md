# Book-enrichment (Stage 3) — findings (Brief 155)

_Generated 2026-06-18 · model = opus (enricher + verifier, Web-Search + Thinking) · structural sentinels only (factions + locations); characters out of scope._

> Every row is a READ-ONLY PROPOSAL in `scripts/seed-data/new-entity-proposals.json`.
> Nothing here is applied — materialization is the maintainer hand-gates F/L only.

## Resolution (raw / new-confirmed / alias-dedup / unresolved, pattern 144)

| axis | raw | new (confirmed) | alias (dedup) | unresolved | fields-unproven |
|---|---|---|---|---|---|
| factions | 21 | 20 | 1 | 0 | 1 |
| locations | 145 | 142 | 2 | 1 | 89 |
| **total** | **166** | **162** | **3** | **1** | **90** |

- **Faction resolution quote:** 100% (21/21) reached a new entity or an alias of an existing one.
- **Location resolution quote:** 99% (144/145).
- **Location placement:** 0 placed (real gx/gy) · 53 sector-only · 89 unplaceable. Real Map-pin gain = the 0 placed.
- **Dedup hits** (sentinels that were aliases of existing entities): factions 1, locations 2.

## Gates

- **Gate F (factions, early):** 20 new factions proposed for hand-promotion into `factions.json` (+ `faction-aliases.json`). 1 alias proposals.
- **Gate L (locations, with the Map):** 142 new locations proposed; promote staged when Map-curation is due. 2 alias proposals.

_Per-entity proposals (fields, sources, confidence, merge adjustments) live in the proposal JSON; the unresolved rows kept their `__unresolved__` sentinels._
