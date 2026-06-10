# Phase-4 apply digest

Config: `scripts/resolver-pass.config.json` · apply-range: `ssot-w40k-001 ssot-w40k-002 ssot-w40k-003 ssot-w40k-004 ssot-w40k-005 ssot-w40k-006 ssot-w40k-007 ssot-w40k-008 ssot-w40k-009 ssot-w40k-010 ssot-w40k-011 ssot-w40k-012 ssot-w40k-013 ssot-w40k-014 ssot-w40k-015 ssot-w40k-016 ssot-w40k-017 ssot-w40k-018 ssot-w40k-019 ssot-w40k-020 ssot-w40k-021 ssot-w40k-022 ssot-w40k-023 ssot-w40k-024 ssot-w40k-025 ssot-w40k-026 ssot-w40k-027 ssot-w40k-028 ssot-w40k-029 ssot-w40k-030 ssot-w40k-031 ssot-w40k-032 ssot-w40k-033 ssot-w40k-034 ssot-w40k-035 ssot-w40k-036 ssot-w40k-037 ssot-w40k-038 ssot-w40k-039 ssot-w40k-040 ssot-w40k-041 ssot-w40k-042 ssot-w40k-043 ssot-w40k-044 ssot-w40k-045 ssot-w40k-046 ssot-w40k-047 ssot-w40k-048 ssot-w40k-049 ssot-w40k-050 ssot-w40k-051 ssot-w40k-052 ssot-w40k-053 ssot-w40k-054 ssot-w40k-055 ssot-w40k-056 ssot-w40k-057 ssot-w40k-058 ssot-w40k-059 ssot-w40k-060` · new wave:` ssot-w40k-058 ssot-w40k-059 ssot-w40k-060 `
Raw per-batch output (unbounded, NOT read by the LLM): `ingest/.last-run/phase4-apply-verbose.log` (gitignored).

### PRE-APPLY counts

```
[db-counts] start
works                1987
work_factions        4316
work_locations       1514
work_characters      2551
work_collections     196
work_persons         898
work_facets          17299
factions             202
locations            289
characters           490
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
- applied `ssot-w40k-047`: ok
- applied `ssot-w40k-048`: ok
- applied `ssot-w40k-049`: ok
- applied `ssot-w40k-050`: ok
- applied `ssot-w40k-051`: ok
- applied `ssot-w40k-052`: ok
- applied `ssot-w40k-053`: ok
- applied `ssot-w40k-054`: ok
- applied `ssot-w40k-055`: ok
- applied `ssot-w40k-056`: ok
- applied `ssot-w40k-057`: ok
- applied `ssot-w40k-058`: ok

### POST-BATCH counts — ssot-w40k-058

```
[db-counts] start
works                1987
work_factions        4320
work_locations       1516
work_characters      2554
work_collections     196
work_persons         898
work_facets          17299
factions             205
locations            296
characters           497
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-059`: ok

### POST-BATCH counts — ssot-w40k-059

```
[db-counts] start
works                1987
work_factions        4321
work_locations       1522
work_characters      2559
work_collections     196
work_persons         898
work_facets          17299
factions             205
locations            296
characters           497
facet_values         86
[db-counts] done
```
- applied `ssot-w40k-060`: ok

### POST-BATCH counts — ssot-w40k-060

```
[db-counts] start
works                1987
work_factions        4322
work_locations       1522
work_characters      2560
work_collections     196
work_persons         898
work_facets          17299
factions             205
locations            296
characters           497
facet_values         86
[db-counts] done
```

### POST-APPLY counts

```
[db-counts] start
works                1987
work_factions        4322
work_locations       1522
work_characters      2560
work_collections     196
work_persons         898
work_facets          17299
factions             205
locations            296
characters           497
facet_values         86
[db-counts] done
```

DONE
