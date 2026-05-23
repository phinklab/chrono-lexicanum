# Phase-4 apply digest

Config: `scripts/resolver-pass.config.json` · apply-range: `ssot-w40k-001 ssot-w40k-002 ssot-w40k-003 ssot-w40k-004 ssot-w40k-005 ssot-w40k-006 ssot-w40k-007 ssot-w40k-008 ssot-w40k-009 ssot-w40k-010 ssot-w40k-011 ssot-w40k-012 ssot-w40k-013 ssot-w40k-014 ssot-w40k-015 ssot-w40k-016 ssot-w40k-017 ssot-w40k-018 ssot-w40k-019 ssot-w40k-020 ssot-w40k-021 ssot-w40k-022 ssot-w40k-023 ssot-w40k-024 ssot-w40k-025 ssot-w40k-026 ssot-w40k-027 ssot-w40k-028 ssot-w40k-029 ssot-w40k-030 ssot-w40k-031 ssot-w40k-032 ssot-w40k-033 ssot-w40k-034 ssot-w40k-035 ssot-w40k-036 ssot-w40k-037 ssot-w40k-038 ssot-w40k-039 ssot-w40k-040 ssot-w40k-041 ssot-w40k-042 ssot-w40k-043 ssot-w40k-044 ssot-w40k-045` · new wave:` ssot-w40k-036 ssot-w40k-037 ssot-w40k-038 ssot-w40k-039 ssot-w40k-040 ssot-w40k-041 ssot-w40k-042 ssot-w40k-043 ssot-w40k-044 ssot-w40k-045 `
Raw per-batch output (unbounded, NOT read by the LLM): `ingest/.last-run/phase4-apply-verbose.log` (gitignored).

### PRE-APPLY counts

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
- applied `ssot-w40k-027`: ok
- applied `ssot-w40k-028`: ok
- applied `ssot-w40k-029`: ok
- applied `ssot-w40k-030`: ok
- applied `ssot-w40k-031`: ok
- applied `ssot-w40k-032`: ok
- applied `ssot-w40k-033`: ok
- applied `ssot-w40k-034`: ok
- applied `ssot-w40k-035`: ok
- applied `ssot-w40k-036`: ok

### POST-BATCH counts — ssot-w40k-036

```
[db-counts] start
works                360
work_factions        1438
work_locations       552
work_characters      875
work_collections     121
work_persons         340
work_facets          7415
factions             166
locations            201
characters           297
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-037`: ok

### POST-BATCH counts — ssot-w40k-037

```
[db-counts] start
works                370
work_factions        1465
work_locations       562
work_characters      932
work_collections     127
work_persons         350
work_facets          7591
factions             166
locations            201
characters           297
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-038`: ok

### POST-BATCH counts — ssot-w40k-038

```
[db-counts] start
works                380
work_factions        1487
work_locations       578
work_characters      953
work_collections     134
work_persons         360
work_facets          7782
factions             166
locations            201
characters           297
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-039`: ok

### POST-BATCH counts — ssot-w40k-039

```
[db-counts] start
works                390
work_factions        1513
work_locations       585
work_characters      986
work_collections     137
work_persons         370
work_facets          7966
factions             166
locations            201
characters           297
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-040`: ok

### POST-BATCH counts — ssot-w40k-040

```
[db-counts] start
works                400
work_factions        1535
work_locations       590
work_characters      1001
work_collections     139
work_persons         380
work_facets          8141
factions             166
locations            201
characters           297
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-041`: ok

### POST-BATCH counts — ssot-w40k-041

```
[db-counts] start
works                410
work_factions        1553
work_locations       596
work_characters      1006
work_collections     139
work_persons         390
work_facets          8326
factions             166
locations            201
characters           297
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-042`: ok

### POST-BATCH counts — ssot-w40k-042

```
[db-counts] start
works                420
work_factions        1581
work_locations       607
work_characters      1024
work_collections     139
work_persons         399
work_facets          8517
factions             166
locations            201
characters           297
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-043`: ok

### POST-BATCH counts — ssot-w40k-043

```
[db-counts] start
works                430
work_factions        1611
work_locations       620
work_characters      1042
work_collections     139
work_persons         407
work_facets          8692
factions             166
locations            201
characters           297
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-044`: ok

### POST-BATCH counts — ssot-w40k-044

```
[db-counts] start
works                440
work_factions        1634
work_locations       629
work_characters      1060
work_collections     139
work_persons         415
work_facets          8896
factions             166
locations            201
characters           297
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-045`: ok

### POST-BATCH counts — ssot-w40k-045

```
[db-counts] start
works                450
work_factions        1659
work_locations       638
work_characters      1074
work_collections     142
work_persons         424
work_facets          9087
factions             166
locations            201
characters           297
facet_values         86
[db-counts] done
```

### POST-APPLY counts

```
[db-counts] start
works                450
work_factions        1659
work_locations       638
work_characters      1074
work_collections     142
work_persons         424
work_facets          9087
factions             166
locations            201
characters           297
facet_values         86
[db-counts] done
```

DONE
