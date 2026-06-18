---
session: 2026-06-18-155
role: implementer
date: 2026-06-18
status: complete
slug: book-review-web-pass
parent: 2026-06-18-155
links:
  - 2026-06-17-154
  - 2026-06-14-149
  - 2026-06-11-144
  - 2026-06-07-131
commits: []
---

# Buch-Reviewer Stage 3 — Strukturelle Sentinels per Web-Enrichment vervollständigen (CC-Direct, Opus + Web)

## Summary

The B11 CC-Direct machinery is extended (not rebuilt) with a `--enrich` mode — a
**two-stage Opus + Web-Search pass** that ran over **all 166 structural sentinels**
(21 faction + 145 location) and turned each into a **read-only enrichment proposal**
with cited sources + confidence. **Resolution: factions 100 % (20 new + 1 alias),
locations 99 % (142 new + 2 alias + 1 unresolved).** **The model is hard-guarded
to Opus** — `--enrich` aborts on any non-Opus alias, so the web pass cannot
silently fall back to a cheaper model. The proposals are in
`new-entity-proposals.json`, which has **no apply path** (test- + grep-proven);
materialization is the maintainer hand-gates F/L only. No DB mutation.

## What I did

### Build — extended the B11 machinery (Brief 155 § "erweitert B11, baut nichts neu")
- `scripts/book-review/contract.ts` — added the **enrichment contract** (the brief
  asks the Finding-Contract to carry it): `EnrichmentProposalSchema` (per-axis
  payloads — faction `parent`/`alignment`/`tone`/`glyph`, location
  `sector`/`gx`/`gy`/`tags`/flags/`placeable`), the **alias** form (`aliasTo`),
  the **unresolved** decision — each with `sources[]` (url + trust rank) +
  `confidence`; `EnrichVerdictSchema` (per-sentinel existence + faction
  alignment/parent + location sector). `.strict()` + `superRefine` reject malformed
  shapes; `trust` is normalized at parse time (see Decisions). Added `parseSentinelId`.
- `scripts/book-review/enrichment.ts` (new) — `buildWorklist` (distinct
  faction+location sentinels from `book-review-queue.json`, each with source-book
  title+synopsis; characters excluded), `loadVocab` (reads the **live**
  alignment/tone/sector vocab from the catalogs — not guessed), `findExistingId`
  (deterministic dedup backstop via the resolver/alias index), `buildProposals`
  (the merge: per-field verification guards + dedup → the read-only proposal file),
  `renderEnrichLog`.
- `scripts/book-review.ts` — added DB-free subcommands `enrich-prepare`,
  `enrich-check-enricher`, `enrich-check-verifier`, `enrich-merge` (resumable,
  idempotent manifest; mirrors the B11 prepare/check/merge).
- `scripts/run-book-review-loop.sh` — added the **`--enrich` mode**: WebSearch +
  WebFetch, "think hard" + Web-Search in both triggers, the **Opus guard**,
  iterates over distinct **sentinel** chunks (not books), reusing the existing
  concurrency pool / retry / resume / completeness-gate. A **stage-1 resume-skip**
  reuses an already-valid enricher output instead of re-spending allowance. The
  B11 review path is behaviourally unchanged.
- `ingest/book-review/conventions-enrichment.md` (new) — the committed convention
  both stages read: **trust hierarchy** (Lexicanum primary · 40k Fandom secondary ·
  Wikipedia/Black Library publication-facts-only), **evidence threshold** (one
  credible, edition-independent wiki hit; never over-narrow, never invent), the
  **pinned field vocabulary per axis**, the dedup-first rule, "a field you cannot
  evidence stays null."
- `scripts/test-book-enrich.ts` (new) + `package.json` (`review:enrich`,
  `test:book-enrich`) — 50 DB-free tests.

### Run — the web pass over the 166 sentinels (this session)
- Ran `npm run review:enrich` (Opus, Web-Search + Thinking, concurrency 4,
  `BOOK_ENRICH_CHUNK_SIZE=4` → 42 chunks). 40/42 completed on the first wave; 2
  chunks (16, 20) failed a contract enum on a model trust-label format drift
  (`black_library` vs `black-library`) — fixed (parse-time normalization) and
  resumed verifier-only (their enricher output was reused). All 42 verified → merge.
  Zero metered Anthropic API; the run did **not** hit the Max-allowance wall.
- `scripts/seed-data/new-entity-proposals.json` — the committed READ-ONLY output
  (21 faction + 145 location proposals, web provenance + confidence + any merge
  adjustments).
- `scripts/logs/book-enrich-log.md` — the findings table (below).

## Decisions I made

- **Opus is hard-enforced, not just defaulted** (the user's explicit check). Beyond
  `--model opus` being the default, `--enrich` **aborts (exit 1)** on any non-Opus
  alias — verified `--enrich --model sonnet` fails fast. The merge stamps the
  actual model into `new-entity-proposals.json` (`"model": "opus"`). Exact alias:
  **`opus`** (Claude Code resolves it to the current Opus per the version policy —
  no over-pinning).
- **Extended the one driver with a mode flag, not a parallel clone** (the brief's
  "erweitert B11, baut nichts neu"). The shared pool/retry/resume/gate logic stays
  single-source; only prepare/triggers/tools/merge differ by `$ENRICH`.
- **MECHANICAL preamble — byte-identical except the one clause that must flip.** The
  B11 preamble forbids web; this pass requires it. The enrich preamble keeps every
  other byte identical and flips exactly "Use ONLY the Read and Write tools. Make no
  web requests." → "Use ONLY the Read, Write, and web-search tools. Web search is
  REQUIRED for this task." — the only sensible reading of "byte-genau wie Finder"
  for a pass whose point is web.
- **Trust label normalized at parse time.** The contract pins a 5-value trust enum,
  but the model drifts on cosmetics (`black_library`, `blacklibrary`, `Wikia`). A
  `z.preprocess` maps these onto the controlled set (unrecognizable → `other`), so
  format drift never drops a sound proposal. This is exactly what cost chunks 16/20
  on the first wave; locked with a regression test.
- **Chunk size 4 (env `BOOK_ENRICH_CHUNK_SIZE`).** The brief delegates this. The
  unit of work is the distinct sentinel; 4/subsession balances research focus +
  clean context against the spawn count (166 → 42 enricher chunks). **Token frame:**
  each chunk input is a small JSON (≤ ~6 KB: pinned vocab + 4 sentinels, synopses
  bounded to 1400 chars); web results are the bulk, and no chunk approached the
  ~120 k ceiling across all 42 (no size-related failures).
- **Dedup enforced twice** — the enricher emits `alias` when the entity exists, and
  the merge re-checks deterministically (`findExistingId` + a proposedId-collision
  check), overriding a `new`→`alias` on an exact name/alias hit; an alias to a
  non-existent id is withheld (stays a sentinel).
- **Field-level verification, not all-or-nothing** — a refuted faction
  `alignment`/`parent`, a non-existent `parent`/`sector`, or an out-of-vocab `tone`
  is blanked (logged adjustment) while the rest stands. Coordinates kept only when
  `placeable` and both `gx`/`gy` finite — never guessed.

## Verification

- `tsc --noEmit` — **pass**.
- `npm run lint` (`eslint .`) — **pass** (whole repo).
- `scripts/test-book-enrich.ts` — **50 pass / 0 fail** (contract incl. trust
  normalization, every merge guard, dedup, worklist = 21F + 145L = 166,
  no-apply-path guard).
- `scripts/test-book-review.ts` (existing B11) — **49 pass / 0 fail** (the contract
  extension + driver mode are additive).
- `bash scripts/run-book-review-loop.sh --enrich --model sonnet` — **aborts** with
  the Opus-guard error.
- **NO APPLY PATH (grep-proven):** `grep -rn "new-entity-proposals"` across
  `scripts/` + `src/` returns only the producer module (`enrichment.ts`, writes it),
  the test, and **a comment + a log line** in the driver — no apply/`db:rebuild`/
  seed loader reads it.
- **No prod DB mutation.** Diff to `resolve.ts` logic, `curation-overlay`
  apply/validator, `db:rebuild`, the facet path = **0** (enrichment consumes the
  resolver read-only and writes only its proposal file + log). DB-Freeze held.

### Findings (raw / new-confirmed / alias-dedup / unresolved, pattern 144)

| axis | raw | new | alias | unresolved | fields-unproven |
|---|---|---|---|---|---|
| factions | 21 | 20 | 1 | 0 | 1 |
| locations | 145 | 142 | 2 | 1 | 89 |
| **total** | **166** | **162** | **3** | **1** | **90** |

## Open issues / blockers

None blocking. The build + run are complete and green; the proposals await the
maintainer hand-gates (the reviewer applies nothing).

### Open questions from the brief (answered)

- **Anreicherungs-Quote:** factions **100 %** (20 new + 1 alias, 0 unresolved);
  locations **99 %** (142 new + 2 alias, 1 unresolved). 1 faction (Gardinaal —
  ambiguous abhuman empire) got neither alignment nor parent (honestly left null).
- **Realer Map-Zuwachs — the load-bearing finding:** of 145 locations, **0 got real
  `gx`/`gy`**, **53 are sector-only**, **89 unplaceable**. The web pass does **not**
  directly populate the map: Lexicanum/Fandom document at most a Segmentum/sector
  for these deep-cut novel worlds, never coordinates — and the "never guess
  coordinates" guard held perfectly (0 fabricated). The realistic Gate-L gain is the
  **53 sector-assigned worlds** a maintainer can hand-place *within their sector*
  during Map-curation; coordinate placement stays human work (as Gate L anticipated).
- **Dedup hits (catalog-coverage signal):** 3 — faction `Crimson Sabres →
  crimson_slaughter`; locations `Redemption` + `Vytarn → candleworld` (two in-book
  names for one existing world). Low dedup rate = the B11 resolver had already
  crystallized the easy matches; these 3 were name-drift the alias index missed.
- **Adversarial value:** the verifier refuted 1 location existence (`Rhamiel` — a
  character/event, not a world; the only "world" phrasing was a Black Library blurb
  the convention bars) and 1 sector (`Solo-Baston`). Both correctly handled (sentinel
  kept / field blanked).
- **Gate F handhabbar?** Yes — **20 new factions + 1 alias**, small, Ask-bearing, no
  coordinate risk → one hand-pass into `factions.json` + `faction-aliases.json`
  (same class as the 96/Drukhari), ready for the first follow-up rebuild.
- **Gate L staging:** **142 new + 2 alias**. Suggest staging by **sector-assigned
  first** (the 53 placeable-within-sector) + confidence, deferred to Map-curation.
- **Rebuild FK precondition:** a **new** faction/location must exist as a reference
  row **before** the corpus re-apply points edges at it (the Drukhari dry-run halt in
  the 154 report). After Gate F, a clean rebuild seeds the new factions as reference
  rows first, then re-applies corpus + overlay tail. The DB-free enrichment pass is
  unaffected by the freeze.

## For next session

- **Gate F promotion** (20 factions) + the follow-up rebuild (seed new reference rows
  first, then corpus + overlay tail).
- **Gate L** when Map-curation runs: the 53 sector-only worlds are the placement
  worklist; the 89 unplaceable stay sector-less/sentinel.
- **Character sentinels (315)** remain parked + reversible (own brief if B12 needs them).
- **ADR backfill (coordination-only):** the full B11 topology incl. this Stage-3
  enrichment pass + proposal path wants a `log.md`/ADR entry — `brain/**` is
  coordination-only, so this report carries the facts; Cowork backfills.

## References

- Arch brief: `sessions/2026-06-18-155-arch-book-review-web-pass.md`
- B11 build + full run: `sessions/2026-06-17-154-impl-book-reviewer.md`
- Convention: `ingest/book-review/conventions-enrichment.md`
- Output: `scripts/seed-data/new-entity-proposals.json` (read-only) · findings:
  `scripts/logs/book-enrich-log.md`
- CC-Direct driver pattern: `sessions/archive/2026-06/2026-06-07-131-arch-podcast-tagging-cc-direct.md`
