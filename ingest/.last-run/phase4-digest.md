# Phase-4 apply digest

Config: `scripts/resolver-pass.config.json` · apply-range: `ssot-w40k-001 ssot-w40k-002 ssot-w40k-003 ssot-w40k-004 ssot-w40k-005 ssot-w40k-006 ssot-w40k-007 ssot-w40k-008 ssot-w40k-009 ssot-w40k-010 ssot-w40k-011 ssot-w40k-012 ssot-w40k-013 ssot-w40k-014 ssot-w40k-015 ssot-w40k-016 ssot-w40k-017 ssot-w40k-018 ssot-w40k-019 ssot-w40k-020 ssot-w40k-021 ssot-w40k-022 ssot-w40k-023 ssot-w40k-024 ssot-w40k-025 ssot-w40k-026 ssot-w40k-027 ssot-w40k-028 ssot-w40k-029 ssot-w40k-030 ssot-w40k-031 ssot-w40k-032 ssot-w40k-033 ssot-w40k-034 ssot-w40k-035 ssot-w40k-036 ssot-w40k-037 ssot-w40k-038 ssot-w40k-039 ssot-w40k-040 ssot-w40k-041 ssot-w40k-042 ssot-w40k-043 ssot-w40k-044 ssot-w40k-045 ssot-w40k-046 ssot-w40k-047 ssot-w40k-048 ssot-w40k-049 ssot-w40k-050 ssot-w40k-051` · new wave:` ssot-w40k-046 ssot-w40k-047 ssot-w40k-048 ssot-w40k-049 ssot-w40k-050 ssot-w40k-051 `
Raw per-batch output (unbounded, NOT read by the LLM): `ingest/.last-run/phase4-apply-verbose.log` (gitignored).

### PRE-APPLY counts

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
- applied `ssot-w40k-037`: ok
- applied `ssot-w40k-038`: ok
- applied `ssot-w40k-039`: ok
- applied `ssot-w40k-040`: ok
- applied `ssot-w40k-041`: ok
- applied `ssot-w40k-042`: ok
- applied `ssot-w40k-043`: ok
- applied `ssot-w40k-044`: ok
- applied `ssot-w40k-045`: ok
- applied `ssot-w40k-046`: ok

### POST-BATCH counts — ssot-w40k-046

```
[db-counts] start
works                460
work_factions        1696
work_locations       651
work_characters      1096
work_collections     145
work_persons         434
work_facets          9325
factions             171
locations            214
characters           325
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-047`: ok

### POST-BATCH counts — ssot-w40k-047

```
[db-counts] start
works                470
work_factions        1721
work_locations       661
work_characters      1110
work_collections     145
work_persons         444
work_facets          9492
factions             171
locations            214
characters           325
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-048`: ok

### POST-BATCH counts — ssot-w40k-048

```
[db-counts] start
works                480
work_factions        1753
work_locations       671
work_characters      1121
work_collections     145
work_persons         454
work_facets          9684
factions             171
locations            214
characters           325
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-049`: ok

### POST-BATCH counts — ssot-w40k-049

```
[db-counts] start
works                490
work_factions        1781
work_locations       679
work_characters      1168
work_collections     145
work_persons         463
work_facets          9877
factions             171
locations            214
characters           325
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-050`: ok

### POST-BATCH counts — ssot-w40k-050

```
[db-counts] start
works                500
work_factions        1793
work_locations       682
work_characters      1170
work_collections     145
work_persons         471
work_facets          10069
factions             171
locations            214
characters           325
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-051`: ok

### POST-BATCH counts — ssot-w40k-051

```
[db-counts] start
works                510
work_factions        1795
work_locations       683
work_characters      1170
work_collections     145
work_persons         480
work_facets          10242
factions             171
locations            214
characters           325
facet_values         86
[db-counts] done
```

### POST-APPLY counts

```
[db-counts] start
works                510
work_factions        1795
work_locations       683
work_characters      1170
work_collections     145
work_persons         480
work_facets          10242
factions             171
locations            214
characters           325
facet_values         86
[db-counts] done
```

DONE
