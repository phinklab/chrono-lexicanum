# Phase-4 apply digest

Config: `scripts/resolver-pass.config.json` · apply-range: `ssot-hh-001 ssot-hh-002` · new wave:` ssot-hh-001 ssot-hh-002 `
Raw per-batch output (unbounded, NOT read by the LLM): `ingest/.last-run/phase4-apply-verbose.log` (gitignored).

### PRE-APPLY counts

```
[db-counts] start
works                565
work_factions        1903
work_locations       733
work_characters      1220
work_collections     147
work_persons         524
work_facets          11291
factions             173
locations            224
characters           344
facet_values         86
[db-counts] done
```

### Seed resolver-extensions + facets (non-destructive)

```
seed-resolver-extensions: ok
[seed-facets] catalog values: 86; newly inserted (ON CONFLICT DO NOTHING): 0
```

### Per-batch apply (new-wave batches get a post-batch counts snapshot)
- applied `ssot-hh-001`: ok

### POST-BATCH counts — ssot-hh-001

```
[db-counts] start
works                575
work_factions        1940
work_locations       745
work_characters      1282
work_collections     147
work_persons         533
work_facets          11488
factions             179
locations            234
characters           404
facet_values         86
[db-counts] done
```
- applied `ssot-hh-002`: ok

### POST-BATCH counts — ssot-hh-002

```
[db-counts] start
works                585
work_factions        1981
work_locations       776
work_characters      1325
work_collections     147
work_persons         541
work_facets          11672
factions             179
locations            234
characters           404
facet_values         86
[db-counts] done
```

### POST-APPLY counts

```
[db-counts] start
works                585
work_factions        1981
work_locations       776
work_characters      1325
work_collections     147
work_persons         541
work_facets          11672
factions             179
locations            234
characters           404
facet_values         86
[db-counts] done
```

DONE
