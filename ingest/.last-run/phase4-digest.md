# Phase-4 apply digest

Config: `scripts/resolver-pass.config.json` · apply-range: `ssot-hh-001 ssot-hh-002 ssot-hh-003 ssot-hh-004 ssot-hh-005 ssot-hh-006 ssot-hh-007 ssot-hh-008 ssot-hh-009 ssot-hh-010 ssot-hh-011 ssot-hh-012 ssot-hh-013 ssot-hh-014 ssot-hh-015 ssot-hh-016 ssot-hh-017 ssot-hh-018 ssot-hh-019 ssot-hh-020` · new wave:` ssot-hh-015 ssot-hh-016 ssot-hh-017 ssot-hh-018 ssot-hh-019 ssot-hh-020 `
Raw per-batch output (unbounded, NOT read by the LLM): `ingest/.last-run/phase4-apply-verbose.log` (gitignored).

### PRE-APPLY counts

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
- applied `ssot-hh-010`: ok
- applied `ssot-hh-011`: ok
- applied `ssot-hh-012`: ok
- applied `ssot-hh-013`: ok
- applied `ssot-hh-014`: ok
- applied `ssot-hh-015`: ok

### POST-BATCH counts — ssot-hh-015

```
[db-counts] start
works                715
work_factions        2425
work_locations       985
work_characters      1727
work_collections     165
work_persons         649
work_facets          14324
factions             194
locations            275
characters           474
facet_values         86
[db-counts] done
```
- applied `ssot-hh-016`: ok

### POST-BATCH counts — ssot-hh-016

```
[db-counts] start
works                725
work_factions        2438
work_locations       992
work_characters      1743
work_collections     175
work_persons         659
work_facets          14512
factions             194
locations            275
characters           474
facet_values         86
[db-counts] done
```
- applied `ssot-hh-017`: ok

### POST-BATCH counts — ssot-hh-017

```
[db-counts] start
works                735
work_factions        2455
work_locations       1001
work_characters      1764
work_collections     181
work_persons         669
work_facets          14717
factions             194
locations            275
characters           474
facet_values         86
[db-counts] done
```
- applied `ssot-hh-018`: ok

### POST-BATCH counts — ssot-hh-018

```
[db-counts] start
works                745
work_factions        2474
work_locations       1011
work_characters      1782
work_collections     182
work_persons         679
work_facets          14902
factions             194
locations            275
characters           474
facet_values         86
[db-counts] done
```
- applied `ssot-hh-019`: ok

### POST-BATCH counts — ssot-hh-019

```
[db-counts] start
works                755
work_factions        2493
work_locations       1017
work_characters      1797
work_collections     184
work_persons         689
work_facets          15063
factions             194
locations            275
characters           474
facet_values         86
[db-counts] done
```
- applied `ssot-hh-020`: ok

### POST-BATCH counts — ssot-hh-020

```
[db-counts] start
works                765
work_factions        2511
work_locations       1031
work_characters      1811
work_collections     184
work_persons         699
work_facets          15223
factions             194
locations            275
characters           474
facet_values         86
[db-counts] done
```

### POST-APPLY counts

```
[db-counts] start
works                765
work_factions        2511
work_locations       1031
work_characters      1811
work_collections     184
work_persons         699
work_facets          15223
factions             194
locations            275
characters           474
facet_values         86
[db-counts] done
```

DONE
