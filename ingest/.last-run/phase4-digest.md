# Phase-4 apply digest

Config: `scripts/resolver-pass.config.json` · apply-range: `ssot-hh-001 ssot-hh-002 ssot-hh-003 ssot-hh-004 ssot-hh-005 ssot-hh-006 ssot-hh-007 ssot-hh-008` · new wave:` ssot-hh-003 ssot-hh-004 ssot-hh-005 ssot-hh-006 ssot-hh-007 ssot-hh-008 `
Raw per-batch output (unbounded, NOT read by the LLM): `ingest/.last-run/phase4-apply-verbose.log` (gitignored).

### PRE-APPLY counts

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

### Seed resolver-extensions + facets (non-destructive)

```
seed-resolver-extensions: ok
[seed-facets] catalog values: 86; newly inserted (ON CONFLICT DO NOTHING): 0
```

### Per-batch apply (new-wave batches get a post-batch counts snapshot)
- applied `ssot-hh-001`: ok
- applied `ssot-hh-002`: ok
- applied `ssot-hh-003`: ok

### POST-BATCH counts — ssot-hh-003

```
[db-counts] start
works                595
work_factions        2021
work_locations       806
work_characters      1373
work_collections     147
work_persons         549
work_facets          11863
factions             188
locations            256
characters           444
facet_values         86
[db-counts] done
```
- applied `ssot-hh-004`: ok

### POST-BATCH counts — ssot-hh-004

```
[db-counts] start
works                605
work_factions        2074
work_locations       830
work_characters      1416
work_collections     147
work_persons         555
work_facets          12084
factions             188
locations            256
characters           444
facet_values         86
[db-counts] done
```
- applied `ssot-hh-005`: ok

### POST-BATCH counts — ssot-hh-005

```
[db-counts] start
works                615
work_factions        2118
work_locations       851
work_characters      1452
work_collections     147
work_persons         563
work_facets          12279
factions             188
locations            256
characters           444
facet_values         86
[db-counts] done
```
- applied `ssot-hh-006`: ok

### POST-BATCH counts — ssot-hh-006

```
[db-counts] start
works                625
work_factions        2164
work_locations       870
work_characters      1493
work_collections     147
work_persons         572
work_facets          12492
factions             188
locations            256
characters           444
facet_values         86
[db-counts] done
```
- applied `ssot-hh-007`: ok

### POST-BATCH counts — ssot-hh-007

```
[db-counts] start
works                635
work_factions        2226
work_locations       898
work_characters      1537
work_collections     147
work_persons         582
work_facets          12720
factions             188
locations            256
characters           444
facet_values         86
[db-counts] done
```
- applied `ssot-hh-008`: ok

### POST-BATCH counts — ssot-hh-008

```
[db-counts] start
works                645
work_factions        2243
work_locations       916
work_characters      1549
work_collections     147
work_persons         592
work_facets          12920
factions             188
locations            256
characters           444
facet_values         86
[db-counts] done
```

### POST-APPLY counts

```
[db-counts] start
works                645
work_factions        2243
work_locations       916
work_characters      1549
work_collections     147
work_persons         592
work_facets          12920
factions             188
locations            256
characters           444
facet_values         86
[db-counts] done
```

DONE
