# Resolver-Pass 16 — Phase 4a (Integration/Apply) report

**Wave:** `ssot-w40k-058..060` (22 books, W40K-0571..0592) · **applyRange:** `w40k 1..60`
**Branch:** `codex/ingest-batches-resolver-w24` · **Dossier:** `resolver-pass-16-dossier.md`

> **Completion note (provenance).** The headless `claude -p` Phase-4a subsession launched
> `run-phase4-apply.sh` as a **background** job and returned before it finished, leaving the
> worktree dirty → the pass-driver halt-check tripped (`worktree dirty after phase`, exit 2)
> and the loop opened PR #156 with the apply still running detached. The detached apply then
> ran to completion correctly (all 60 batches `ok`, `DONE`). This phase was **finished
> manually in the parent session** — the apply itself was not redone (idempotent + already
> complete); the trias was re-run green and this report + the commit were produced by hand.
> No data was lost; only the commit was missing.

## Apply

`scripts/run-phase4-apply.sh scripts/resolver-pass.config.json` — seeds resolver-extensions
(dynamic: reads `factions/sectors/locations/characters.json`) + facets non-destructively,
then re-applies the cumulative `w40k 1..60` idempotently (delete-then-insert per junction).
Digest: `ingest/.last-run/phase4-digest.md`. **0 FAILED**, all 60 batches `ok`, `DONE`.

### DB counts (pre → post)

| metric | pre | post | Δ |
|---|---|---|---|
| works | 1987 | 1987 | 0 |
| work_factions | 4316 | 4322 | **+6** |
| work_locations | 1514 | 1522 | **+8** |
| work_characters | 2551 | 2560 | **+9** |
| work_collections | 196 | 196 | 0 |
| work_persons | 898 | 898 | 0 |
| work_facets | 17299 | 17299 | 0 |
| factions (ref) | 202 | 205 | **+3** |
| locations (ref) | 289 | 296 | **+7** |
| characters (ref) | 490 | 497 | **+7** |
| facet_values | 86 | 86 | 0 |

`works` flat (the 22 wave books were already inserted by the promote PR; this is a
re-apply). `work_persons`/`work_facets`/`facet_values` flat → no new authors, **no facet
strips** (no unknown facetId surfaced; the `## Needs decision` facet-add path was not hit).

### Reference-row deltas (the Phase 1–3 promotions, now live in the DB)

- **factions +3:** `leagues_of_votann` (strict freq-2), `order_pronatus`, `exorcists`.
- **locations +7:** `vraks_prime`, `citadel_of_vraks`, `eternal_starforge_hold` (vessel),
  `gryphonne_iv`, `ras_shakeh`, `formosa_sector`, `fortuna_minor`.
- **characters +7:** `morvenn_vahl`, `torquemada_coteaz`, `arcadian_leontus`, `grotsnik`,
  `aestred_thurga`, `xantine`, `darya_nevic` (strict freq-2 cross-batch).

### Trias-range extension (this commit)

`apply-override-dry.ts`, `test-resolver-coverage.ts`, `test-resolver-data-integrity.ts`
each gained the `{domain:"w40k", n:"058"|"059"|"060"}` tuples (domain-+-N append); the
integrity smoke-slug check label updated `w40k-001..057` → `w40k-001..060`.

## Verification (apply-side trias — all green)

| check | result |
|---|---|
| `test:resolver` | **497 passed / 0 failed** |
| `test:resolver-data` | resolver data integrity ok (smoke slugs `w40k-001..060` + `hh-001..030`) |
| `test:resolver-coverage` | exit 0 (below-threshold rows are data findings, not failures) |
| `test:apply-override-dry` | ok — forward refs 53, unresolvable 0, out-of-range=0, unknown-work=0 |
| `test:collection-refs` | 10 pass / 0 fail |

## Batch-057 extension caveat (carries to a follow-up)

applyRange `1..60` re-applied the **extended** `ssot-w40k-057` (incl. W40K-0566..0570), so
those books' forms that match this pass's new rows now resolve. Their remaining genuinely-novel
surface-forms — and the **HH-0295..0297** forms in the extended `ssot-hh-030` (untouched by a
W40K-domain applyRange) — are **not** aggregated by this wave (detector tiles by batch number).
Closure is a separate targeted pass; see the impl report.

**Ready for 4b.** No `## Needs decision`.
