# Phase-4 apply digest

Config: `scripts/resolver-pass.config.json` · apply-range: `ssot-hh-001 ssot-hh-002 ssot-hh-003 ssot-hh-004 ssot-hh-005 ssot-hh-006 ssot-hh-007 ssot-hh-008 ssot-hh-009 ssot-hh-010 ssot-hh-011 ssot-hh-012 ssot-hh-013 ssot-hh-014` · new wave:` ssot-hh-009 ssot-hh-010 ssot-hh-011 ssot-hh-012 ssot-hh-013 ssot-hh-014 `
Raw per-batch output (unbounded, NOT read by the LLM): `ingest/.last-run/phase4-apply-verbose.log` (gitignored).

### PRE-APPLY counts

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

### Seed resolver-extensions + facets (non-destructive)

```
seed-resolver-extensions: ok
[seed-facets] catalog values: 86; newly inserted (ON CONFLICT DO NOTHING): 0
```

### Per-batch apply (new-wave batches get a post-batch counts snapshot)
- applied `ssot-hh-001`: ok
- applied `ssot-hh-002`: ok
- applied `ssot-hh-003`: ok
- applied `ssot-hh-004`: ok
- applied `ssot-hh-005`: ok
- applied `ssot-hh-006`: ok
- applied `ssot-hh-007`: ok
- applied `ssot-hh-008`: ok
- applied `ssot-hh-009`: ok

### POST-BATCH counts — ssot-hh-009

```
[db-counts] start
works                655
work_factions        2267
work_locations       923
work_characters      1578
work_collections     147
work_persons         601
work_facets          13133
factions             190
locations            267
characters           457
facet_values         86
[db-counts] done
```
- applied `ssot-hh-010`: ok

### POST-BATCH counts — ssot-hh-010

```
[db-counts] start
works                665
work_factions        2292
work_locations       938
work_characters      1605
work_collections     147
work_persons         609
work_facets          13341
factions             190
locations            267
characters           457
facet_values         86
[db-counts] done
```
- applied `ssot-hh-011`: ok

### POST-BATCH counts — ssot-hh-011

```
[db-counts] start
works                675
work_factions        2311
work_locations       942
work_characters      1628
work_collections     156
work_persons         619
work_facets          13529
factions             190
locations            267
characters           457
facet_values         86
[db-counts] done
```
- applied `ssot-hh-012`: ok

### POST-BATCH counts — ssot-hh-012

```
[db-counts] start
works                685
work_factions        2334
work_locations       949
work_characters      1654
work_collections     160
work_persons         629
work_facets          13715
factions             190
locations            267
characters           457
facet_values         86
[db-counts] done
```
- applied `ssot-hh-013`: ok

### POST-BATCH counts — ssot-hh-013

```
[db-counts] start
works                695
work_factions        2359
work_locations       960
work_characters      1672
work_collections     162
work_persons         639
work_facets          13914
factions             190
locations            267
characters           457
facet_values         86
[db-counts] done
```
- applied `ssot-hh-014`: ok

### POST-BATCH counts — ssot-hh-014

```
[db-counts] start
works                705
work_factions        2380
work_locations       972
work_characters      1692
work_collections     162
work_persons         647
work_facets          14096
factions             190
locations            267
characters           457
facet_values         86
[db-counts] done
```

### POST-APPLY counts

```
[db-counts] start
works                705
work_factions        2380
work_locations       972
work_characters      1692
work_collections     162
work_persons         647
work_facets          14096
factions             190
locations            267
characters           457
facet_values         86
[db-counts] done
```

DONE
