# Phase-4 apply digest

Config: `scripts/resolver-pass.config.json` · apply-range: `ssot-w40k-001 ssot-w40k-002 ssot-w40k-003 ssot-w40k-004 ssot-w40k-005 ssot-w40k-006 ssot-w40k-007 ssot-w40k-008 ssot-w40k-009 ssot-w40k-010 ssot-w40k-011 ssot-w40k-012 ssot-w40k-013 ssot-w40k-014 ssot-w40k-015 ssot-w40k-016 ssot-w40k-017 ssot-w40k-018 ssot-w40k-019 ssot-w40k-020 ssot-w40k-021 ssot-w40k-022 ssot-w40k-023 ssot-w40k-024 ssot-w40k-025` · new wave:` ssot-w40k-021 ssot-w40k-022 ssot-w40k-023 ssot-w40k-024 ssot-w40k-025 `
Raw per-batch output (unbounded, NOT read by the LLM): `ingest/.last-run/phase4-apply-verbose.log` (gitignored).

### PRE-APPLY counts

```
[db-counts] start
works                250
work_factions        1153
work_locations       455
work_characters      701
work_collections     79
work_persons         232
work_facets          5404
factions             154
locations            169
characters           199
facet_values         86
[db-counts] done
```

### Seed resolver-extensions + facets (non-destructive)

```
seed-resolver-extensions: ok
[seed-facets] catalog values: 86; newly inserted (ON CONFLICT DO NOTHING): 0
```

### Per-batch apply (new-wave batches get a post-batch counts snapshot)
- applied `ssot-w40k-001`: ok
- applied `ssot-w40k-002`: ok
- applied `ssot-w40k-003`: ok
- applied `ssot-w40k-004`: ok
- applied `ssot-w40k-005`: ok
- applied `ssot-w40k-006`: ok
- applied `ssot-w40k-007`: ok
- applied `ssot-w40k-008`: ok
- applied `ssot-w40k-009`: ok
- applied `ssot-w40k-010`: ok
- applied `ssot-w40k-011`: ok
- applied `ssot-w40k-012`: ok
- applied `ssot-w40k-013`: ok
- applied `ssot-w40k-014`: ok
- applied `ssot-w40k-015`: ok
- applied `ssot-w40k-016`: ok
- applied `ssot-w40k-017`: ok
- applied `ssot-w40k-018`: ok
- applied `ssot-w40k-019`: ok
- applied `ssot-w40k-020`: ok
- applied `ssot-w40k-021`: ok

### POST-BATCH counts — ssot-w40k-021

```
[db-counts] start
works                250
work_factions        1153
work_locations       455
work_characters      701
work_collections     79
work_persons         232
work_facets          5404
factions             154
locations            169
characters           199
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-022`: ok

### POST-BATCH counts — ssot-w40k-022

```
[db-counts] start
works                250
work_factions        1153
work_locations       455
work_characters      701
work_collections     79
work_persons         232
work_facets          5404
factions             154
locations            169
characters           199
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-023`: ok

### POST-BATCH counts — ssot-w40k-023

```
[db-counts] start
works                250
work_factions        1153
work_locations       455
work_characters      701
work_collections     79
work_persons         232
work_facets          5404
factions             154
locations            169
characters           199
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-024`: ok

### POST-BATCH counts — ssot-w40k-024

```
[db-counts] start
works                250
work_factions        1153
work_locations       455
work_characters      701
work_collections     79
work_persons         232
work_facets          5404
factions             154
locations            169
characters           199
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-025`: ok

### POST-BATCH counts — ssot-w40k-025

```
[db-counts] start
works                250
work_factions        1153
work_locations       455
work_characters      701
work_collections     79
work_persons         232
work_facets          5404
factions             154
locations            169
characters           199
facet_values         86
[db-counts] done
```

### POST-APPLY counts

```
[db-counts] start
works                250
work_factions        1153
work_locations       455
work_characters      701
work_collections     79
work_persons         232
work_facets          5404
factions             154
locations            169
characters           199
facet_values         86
[db-counts] done
```

DONE
