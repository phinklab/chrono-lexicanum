# Phase-4 apply digest

Config: `scripts/resolver-pass.config.json` · apply-range: `ssot-hh-001 ssot-hh-002 ssot-hh-003 ssot-hh-004 ssot-hh-005 ssot-hh-006 ssot-hh-007 ssot-hh-008 ssot-hh-009 ssot-hh-010 ssot-hh-011 ssot-hh-012 ssot-hh-013 ssot-hh-014 ssot-hh-015 ssot-hh-016 ssot-hh-017 ssot-hh-018 ssot-hh-019 ssot-hh-020 ssot-hh-021 ssot-hh-022 ssot-hh-023 ssot-hh-024 ssot-hh-025` · new wave:` ssot-hh-021 ssot-hh-022 ssot-hh-023 ssot-hh-024 ssot-hh-025 `
Raw per-batch output (unbounded, NOT read by the LLM): `ingest/.last-run/phase4-apply-verbose.log` (gitignored).

### PRE-APPLY counts

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
- applied `ssot-hh-016`: ok
- applied `ssot-hh-017`: ok
- applied `ssot-hh-018`: ok
- applied `ssot-hh-019`: ok
- applied `ssot-hh-020`: ok
- applied `ssot-hh-021`: ok

### POST-BATCH counts — ssot-hh-021

```
[db-counts] start
works                775
work_factions        2533
work_locations       1038
work_characters      1826
work_collections     184
work_persons         709
work_facets          15406
factions             199
locations            283
characters           481
facet_values         86
[db-counts] done
```
- applied `ssot-hh-022`: ok

### POST-BATCH counts — ssot-hh-022

```
[db-counts] start
works                785
work_factions        2550
work_locations       1049
work_characters      1837
work_collections     184
work_persons         719
work_facets          15560
factions             199
locations            283
characters           481
facet_values         86
[db-counts] done
```
- applied `ssot-hh-023`: ok

### POST-BATCH counts — ssot-hh-023

```
[db-counts] start
works                795
work_factions        2570
work_locations       1058
work_characters      1858
work_collections     184
work_persons         729
work_facets          15728
factions             199
locations            283
characters           481
facet_values         86
[db-counts] done
```
- applied `ssot-hh-024`: ok

### POST-BATCH counts — ssot-hh-024

```
[db-counts] start
works                805
work_factions        2598
work_locations       1076
work_characters      1890
work_collections     193
work_persons         735
work_facets          15916
factions             199
locations            283
characters           481
facet_values         86
[db-counts] done
```
- applied `ssot-hh-025`: ok

### POST-BATCH counts — ssot-hh-025

```
[db-counts] start
works                815
work_factions        2621
work_locations       1087
work_characters      1911
work_collections     196
work_persons         745
work_facets          16084
factions             199
locations            283
characters           481
facet_values         86
[db-counts] done
```

### POST-APPLY counts

```
[db-counts] start
works                815
work_factions        2621
work_locations       1087
work_characters      1911
work_collections     196
work_persons         745
work_facets          16084
factions             199
locations            283
characters           481
facet_values         86
[db-counts] done
```

DONE
