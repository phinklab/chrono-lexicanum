# Phase-4 apply digest

Config: `scripts/resolver-pass.config.json` · apply-range: `ssot-hh-001 ssot-hh-002 ssot-hh-003 ssot-hh-004 ssot-hh-005 ssot-hh-006 ssot-hh-007 ssot-hh-008 ssot-hh-009 ssot-hh-010 ssot-hh-011 ssot-hh-012 ssot-hh-013 ssot-hh-014 ssot-hh-015 ssot-hh-016 ssot-hh-017 ssot-hh-018 ssot-hh-019 ssot-hh-020 ssot-hh-021 ssot-hh-022 ssot-hh-023 ssot-hh-024 ssot-hh-025 ssot-hh-026 ssot-hh-027 ssot-hh-028 ssot-hh-029 ssot-hh-030` · new wave:` ssot-hh-026 ssot-hh-027 ssot-hh-028 ssot-hh-029 ssot-hh-030 `
Raw per-batch output (unbounded, NOT read by the LLM): `ingest/.last-run/phase4-apply-verbose.log` (gitignored).

### PRE-APPLY counts

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
- applied `ssot-hh-022`: ok
- applied `ssot-hh-023`: ok
- applied `ssot-hh-024`: ok
- applied `ssot-hh-025`: ok
- applied `ssot-hh-026`: ok

### POST-BATCH counts — ssot-hh-026

```
[db-counts] start
works                825
work_factions        2639
work_locations       1102
work_characters      1929
work_collections     196
work_persons         755
work_facets          16248
factions             202
locations            288
characters           491
facet_values         86
[db-counts] done
```
- applied `ssot-hh-027`: ok

### POST-BATCH counts — ssot-hh-027

```
[db-counts] start
works                835
work_factions        2660
work_locations       1112
work_characters      1944
work_collections     196
work_persons         765
work_facets          16405
factions             202
locations            288
characters           491
facet_values         86
[db-counts] done
```
- applied `ssot-hh-028`: ok

### POST-BATCH counts — ssot-hh-028

```
[db-counts] start
works                845
work_factions        2682
work_locations       1126
work_characters      1958
work_collections     196
work_persons         775
work_facets          16592
factions             202
locations            288
characters           491
facet_values         86
[db-counts] done
```
- applied `ssot-hh-029`: ok

### POST-BATCH counts — ssot-hh-029

```
[db-counts] start
works                855
work_factions        2702
work_locations       1131
work_characters      1976
work_collections     196
work_persons         785
work_facets          16758
factions             202
locations            288
characters           491
facet_values         86
[db-counts] done
```
- applied `ssot-hh-030`: ok

### POST-BATCH counts — ssot-hh-030

```
[db-counts] start
works                859
work_factions        2752
work_locations       1144
work_characters      1992
work_collections     196
work_persons         785
work_facets          16845
factions             202
locations            288
characters           491
facet_values         86
[db-counts] done
```

### POST-APPLY counts

```
[db-counts] start
works                859
work_factions        2752
work_locations       1144
work_characters      1992
work_collections     196
work_persons         785
work_facets          16845
factions             202
locations            288
characters           491
facet_values         86
[db-counts] done
```

DONE
