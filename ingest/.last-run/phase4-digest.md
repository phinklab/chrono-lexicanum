# Phase-4 apply digest

Config: `scripts/resolver-pass.config.json` · apply-range: `ssot-w40k-001 ssot-w40k-002 ssot-w40k-003 ssot-w40k-004 ssot-w40k-005 ssot-w40k-006 ssot-w40k-007 ssot-w40k-008 ssot-w40k-009 ssot-w40k-010 ssot-w40k-011 ssot-w40k-012 ssot-w40k-013 ssot-w40k-014 ssot-w40k-015 ssot-w40k-016 ssot-w40k-017 ssot-w40k-018 ssot-w40k-019 ssot-w40k-020 ssot-w40k-021 ssot-w40k-022 ssot-w40k-023 ssot-w40k-024 ssot-w40k-025 ssot-w40k-026 ssot-w40k-027 ssot-w40k-028 ssot-w40k-029 ssot-w40k-030 ssot-w40k-031 ssot-w40k-032 ssot-w40k-033 ssot-w40k-034 ssot-w40k-035` · new wave:` ssot-w40k-026 ssot-w40k-027 ssot-w40k-028 ssot-w40k-029 ssot-w40k-030 ssot-w40k-031 ssot-w40k-032 ssot-w40k-033 ssot-w40k-034 ssot-w40k-035 `
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
- applied `ssot-w40k-022`: ok
- applied `ssot-w40k-023`: ok
- applied `ssot-w40k-024`: ok
- applied `ssot-w40k-025`: ok
- applied `ssot-w40k-026`: ok

### POST-BATCH counts — ssot-w40k-026

```
[db-counts] start
works                260
work_factions        1178
work_locations       464
work_characters      717
work_collections     81
work_persons         242
work_facets          5590
factions             162
locations            189
characters           237
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-027`: ok

### POST-BATCH counts — ssot-w40k-027

```
[db-counts] start
works                270
work_factions        1216
work_locations       475
work_characters      742
work_collections     87
work_persons         252
work_facets          5780
factions             162
locations            189
characters           237
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-028`: ok

### POST-BATCH counts — ssot-w40k-028

```
[db-counts] start
works                280
work_factions        1242
work_locations       487
work_characters      762
work_collections     94
work_persons         262
work_facets          5967
factions             162
locations            189
characters           237
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-029`: ok

### POST-BATCH counts — ssot-w40k-029

```
[db-counts] start
works                290
work_factions        1265
work_locations       494
work_characters      770
work_collections     94
work_persons         271
work_facets          6156
factions             162
locations            189
characters           237
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-030`: ok

### POST-BATCH counts — ssot-w40k-030

```
[db-counts] start
works                300
work_factions        1297
work_locations       504
work_characters      781
work_collections     94
work_persons         277
work_facets          6323
factions             162
locations            189
characters           237
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-031`: ok

### POST-BATCH counts — ssot-w40k-031

```
[db-counts] start
works                310
work_factions        1325
work_locations       510
work_characters      787
work_collections     95
work_persons         285
work_facets          6514
factions             162
locations            189
characters           237
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-032`: ok

### POST-BATCH counts — ssot-w40k-032

```
[db-counts] start
works                320
work_factions        1353
work_locations       518
work_characters      791
work_collections     95
work_persons         295
work_facets          6682
factions             162
locations            189
characters           237
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-033`: ok

### POST-BATCH counts — ssot-w40k-033

```
[db-counts] start
works                330
work_factions        1376
work_locations       526
work_characters      798
work_collections     98
work_persons         305
work_facets          6848
factions             162
locations            189
characters           237
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-034`: ok

### POST-BATCH counts — ssot-w40k-034

```
[db-counts] start
works                340
work_factions        1396
work_locations       532
work_characters      804
work_collections     102
work_persons         315
work_facets          7023
factions             162
locations            189
characters           237
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-035`: ok

### POST-BATCH counts — ssot-w40k-035

```
[db-counts] start
works                350
work_factions        1424
work_locations       543
work_characters      844
work_collections     109
work_persons         325
work_facets          7227
factions             162
locations            189
characters           237
facet_values         86
[db-counts] done
```

### POST-APPLY counts

```
[db-counts] start
works                350
work_factions        1424
work_locations       543
work_characters      844
work_collections     109
work_persons         325
work_facets          7227
factions             162
locations            189
characters           237
facet_values         86
[db-counts] done
```

DONE
