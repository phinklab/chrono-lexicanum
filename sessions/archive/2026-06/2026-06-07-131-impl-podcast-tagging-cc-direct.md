---
session: 2026-06-07-131
role: implementer
date: 2026-06-08
status: complete
slug: podcast-tagging-cc-direct
parent: 2026-06-07-131
links:
  - 2026-06-07-130
  - 2026-06-01-110
  - 2026-06-03-122
commits: []
---

# Podcast tagging via CC-Direct — switchable Variant B alongside the metered API

## Summary

Podcast episode tagging is now a **switchable axis**: `--tagging=api` (default,
unchanged, metered) or `--tagging=cc-direct` (Variant B — the LLM step runs as
`claude -p` subsessions on the Max-plan allowance, so the pipeline makes **zero**
metered Anthropic API calls). The cc-direct path is a three-step pipeline
(`acquire → claude -p batches of 10 → assemble`) producing a **form-identical**
artifact, plus a migration that decompiles every existing committed artifact into
the new `<slug>.extractions.json` contract and **proves byte-identical
re-assembly** (4/4 shows, 923 episodes). A 20-episode luetin09 demo ran the full
live pipeline end-to-end. **The api path is byte-identical** (same
`EPISODE_PROMPT_VERSION_HASH 3f6a5ff87efa`; `extract.ts` only lost its inline
constants to a new module). **No DB writes, no schema/migration, no full Luetin
backfill** — all per the brief's constraints. **The full Luetin run is safely
possible** (see the dedicated section below).

## What I did

**New Anthropic-free lib modules** (the cc-direct path imports only these — never
the SDK):

- `src/lib/ingestion/podcast/prompt.ts` — the tagging prompt string, tool schema,
  `MAX_DESC_CHARS`, and `EPISODE_PROMPT_VERSION_HASH`, moved **verbatim** out of
  `extract.ts` (imports only `node:crypto` + `./types`). The verbatim move keeps
  the hash at `3f6a5ff87efa`, so the api cache keys and committed artifacts do not
  move.
- `src/lib/ingestion/podcast/extraction.ts` — `EpisodeExtraction`
  coercion/validation + the `<slug>.extractions.json` IO. `coerceEpisodeExtraction`
  mirrors `extract.ts`'s tool-output parsing exactly (api/cc-direct parity);
  `validateExtractionStrict` is the merge gate (structure-strict, value-coercing);
  `serializeExtractions`/`parseExtractionsFile` are deterministic (guids sorted,
  fixed key order, trailing newline).
- `src/lib/ingestion/podcast/manifest.ts` — the acquire manifest type + IO, the
  shared cc-direct file layout (`CC_TAG_BATCH_SIZE = 10`, work-dir/batch-name
  helpers, `chunkIntoBatches`), and the **migration core**:
  `reconstructExtractionFromArtifactEpisode` + `manifestFromArtifact` +
  `inferSourceFromArtifact` (hermetic — source read from the artifact's own
  episode-link provenance, no registry dependency).

**Refactor (byte-identical):**

- `src/lib/ingestion/podcast/extract.ts` — now imports the four constants from
  `./prompt` and re-exports them (api path's public surface unchanged). Remains
  the **sole** owner of `@anthropic-ai/sdk`. Net diff: −72/+21, no behaviour
  change.

**Script: the switchable CLI:**

- `scripts/ingest-podcast.ts` — new `--tagging=api|cc-direct`, `--stage=acquire|assemble`,
  `--out` flags. The api path now **lazily** imports the SDK + `extract`/`enrich`/`cache`
  (`import type AnthropicClient` is erased; the value loads via `await import` only
  inside `apiRun`). cc-direct `acquire` writes the manifest; `assemble` joins
  manifest + `<out>.extractions.json` into the artifact + report. Both cc-direct
  stages are Anthropic-free and need **no** key (`assemble` was demoed without
  `--env-file` at all).

**Scripts: the cc-direct tagging stage:**

- `scripts/podcast-cc-tag.ts` — `prepare` (manifest → batches of exactly 10 +
  `batches.json`), `check --batch N` (validate one subsession output — the driver's
  accept/retry gate, reuses `validateExtractionStrict`), `status`, `merge`
  (batch outputs → committed `<out>.extractions.json`). Anthropic-free.
- `scripts/run-podcast-tag-loop.sh` — the headless driver (modeled on
  `run-ssot-loop.sh`): `prepare` → one **fresh** `claude -p --model sonnet
  --allowedTools "Read Write" --permission-mode acceptEdits` per batch → `merge`.
  Resumable (skips batches whose output already validates), retries bad output
  (`--max-retries`, default 2). No git/PR step (it produces working files + the
  extractions contract; committing is a separate human decision).

**Script: migration + conventions:**

- `scripts/podcast-migrate-extractions.ts` — decompiles each committed
  `<slug>.json` to `<slug>.extractions.json`, **refusing to write unless
  re-assembly is byte-identical** (the alias-drift guard). `--check` verifies
  without writing.
- `ingest/podcasts/tagging-conventions.md` — the human-readable mirror the
  `claude -p` subsession reads, derived from `EPISODE_SYSTEM_PROMPT`, carrying a
  machine-checkable `EPISODE_PROMPT_VERSION_HASH` marker.

**Tests + wiring:**

- `scripts/test-podcast-cc-direct.ts` — 19 assertions: conventions-hash drift
  guard, migration byte-identity (per show), committed-extractions assembly,
  serialization determinism + insertion-order independence, parse round-trip,
  strict-validation accept/reject/coerce, lenient coercion, reconstruction units,
  and a **static no-SDK guarantee** (quoted-specifier scan).
- `ingest/podcasts/*.extractions.json` — migration output for all 4 committed
  shows (the-40k-lorecast, adeptus-ridiculous, lorehammer, luetin09).
- `package.json` — `ingest:podcast:tag`, `ingest:podcast:migrate-extractions`,
  `test:podcast-cc-direct`.
- `.gitignore` — `/ingest/podcasts/.cc-tag/` (per-run working files; the committed
  contract is `<slug>.extractions.json`).

## Decisions I made

- **Anthropic-free split via `prompt.ts` (verbatim move).** The hard constraint is
  "zero metered calls + `extract.ts`/`@anthropic-ai/sdk` not loaded in cc-direct."
  `enrich.ts` pulls the SDK at top level and `extract.ts` imports it, so the
  shared constants had to leave `extract.ts`. Moving the strings **byte-for-byte**
  (not re-authoring) is what keeps `EPISODE_PROMPT_VERSION_HASH` at `3f6a5ff87efa`
  — verified before building anything else.
- **`import type` + lazy `await import` for the api path.** `import type
  AnthropicClient from "@anthropic-ai/sdk"` is erased at compile, so type
  annotations cost nothing at runtime; the value loads only inside `apiRun`. The
  api functions receive their SDK-bound deps (`extractEpisodeEntities`, cache IO,
  `estimateUsdCost`) via an injected `ApiDeps` object typed with `typeof
  import(...)` (also erased).
- **Hermetic migration (source inferred from the artifact, not the registry).**
  `inferSourceFromArtifact` reads each episode link's `sourceKind`
  (`podcast_rss` → rss, `youtube` → youtube). The migration depends only on the
  committed file, so it can't break if the registry drifts. (Show-level links are
  deliberately ignored — an RSS show may curate a YouTube channel link.)
- **The migration reconstructs the MINIMAL extraction, not the original.** Forms
  that collapsed during resolution (two surface forms → one canonical id) are
  unrecoverable, but they left no trace in the artifact, so the minimal extraction
  re-assembles to the same bytes. The byte-identity check is the proof this is
  sufficient — and the empirical alias-drift guard.
- **`validateExtractionStrict` = structure-strict, value-coercing.** A missing
  axis / non-array bucket / absent `episodeKind` fails (→ the driver re-runs the
  batch); item values (non-strings, blanks) are coerced exactly like the api path,
  so a structurally-valid cc-direct output never diverges the artifact.
- **Batch size hard-coded to 10** in one place (`CC_TAG_BATCH_SIZE`), used by
  acquire's plan, `prepare`'s chunking, and the driver's bound.
- **Demo outputs not committed.** `--out luetin09-ccdemo` kept the real
  `luetin09.json` untouched; the demo's outputs are validation, captured in this
  report and reproducible in 3 commands. The committed deliverables are the code,
  the conventions doc, and the 4 migration extractions files (real shows). The
  `.cc-tag/` working dir is gitignored.
- **Did NOT pin any version, did NOT touch the DB, did NOT run the full backfill**
  — all per the brief.

## Verification

- `tsc --noEmit` — pass.
- `npx eslint .` — pass (full project).
- `npm run test:podcast-cc-direct` — **19 passed, 0 failed**.
- Regression: `test:podcast-ingest` 30/0, `test:aliases` 15/0, `test:podcast-apply`
  41/0 — all pass.
- **api byte-identity:** `EPISODE_PROMPT_VERSION_HASH` from `prompt.ts` = `3f6a5ff87efa`
  (the committed artifacts' `promptVersion`), verified by a one-off import.
- **Diff=0 hard constraints:** `git diff` empty for `resolve.ts`, `artifact.ts`,
  `apply-podcast.ts`, `types.ts`, `feed.ts`, `links.ts`, `registry.ts`,
  `youtube.ts`, `cache.ts`, `enrich.ts`. Only `extract.ts` changed among existing
  lib (the −72/+21 constant refactor).
- **Migration byte-identity:** `migrate-extractions --check` →
  `4/4 artifact(s) verified` byte-identical (adeptus-ridiculous 363, lorehammer
  391, luetin09 20, the-40k-lorecast 149 = 923 episodes; both rss and youtube
  sources).
- **Live demo (luetin09, 20 eps):**
  - acquire → manifest (20 episodes; guid set **identical** to committed
    `luetin09.json`).
  - `run-podcast-tag-loop.sh` → 2 fresh `claude -p` Sonnet subsessions (10 eps
    each), both validated, merged to 20 extractions. (Confirms nested `claude -p`
    works and produces quality tags — e.g. it correctly classified a real-world
    "Survivors 1975" episode as `other` with empty lists.)
  - assemble (run **without** `--env-file`) → artifact: 19/20 tagged (95%).
  - **Form-identity vs committed `luetin09.json`: every structural shape matches**
    (top-level / show / extraction / episode keys, tag/unresolved/link shapes,
    axis + role enums). Content is on par: api 41 tags / 18 tagged; cc-direct
    44 tags / 19 tagged; **same** episodeKind split (19 lore, 1 other), same
    unresolved count (12).
- **Zero metered calls (definitive):** ran the real cc-direct `assemble` under a
  `Module._load` hook that aborts on `@anthropic-ai/sdk`. Positive control
  (`require("@anthropic-ai/sdk")` under the hook) exited 42; the assemble exited
  0 with no FORBIDDEN — the SDK is never loaded. (This project is CJS, so the hook
  intercepts every load path, static or dynamic.)

## Can the full Luetin run be done safely now? — YES

The 20-episode demo exercised every moving part of the full run; scaling to all of
@luetin09's curated uploads (~1850 non-excluded of 1951, ≈ **185 batches of 10**)
is safe:

- **Cost: zero metered.** Every tagging call is a `claude -p` on the Max
  allowance; `ANTHROPIC_API_KEY` is never used (proven by the load-hook). A
  185-batch run costs **$0** in API spend.
- **Resumable.** The driver skips any batch whose `batch-NNN.output.json` already
  validates, so a long run survives interruption / throttling / a laptop sleep —
  just re-run `run-podcast-tag-loop.sh --out <name>` and it continues. This is the
  key safety property for a multi-hour job.
- **Bounded context.** A fresh `claude -p` per batch means batch 185 starts as
  clean as batch 1 — no context bloat, no `/clear` needed.
- **Validated + self-healing.** Each batch's output is structurally validated
  (exact guid coverage, well-formed extractions); a bad batch retries (default 2)
  before the driver stops with a precise message.
- **No DB risk.** The pipeline stops at the artifact; `apply-podcast.ts` (Diff=0)
  is a separate, later step.
- **Quality is on par** with the metered path (demo: 44 vs 41 tags, identical kind
  distribution).

**Practical notes for whoever runs it** (a future brief, not this session):

1. Wall time ≈ 185 batches × ~30–60 s ≈ **1.5–3 h** — run it headless. Max-plan
   rate limits may stretch this; resumability absorbs that completely.
2. Decide the **output target**: a full cc-direct run produces a luetin09 artifact
   with MORE episodes and (slightly) different tags than the committed api one.
   Either replace `luetin09.json` (and re-apply) or stage under a new `--out`.
   That's a curation/apply decision for the next brief.
3. The acquire `includeVideoIds` curation (41 force-included) is unchanged; a full
   backfill inherits exactly the Brief 130 denylist/allowlist.

## Open issues / blockers

- **Generated report's "Reproducible via" line is api-worded.** `buildReport()`
  lives in `artifact.ts` (Diff=0), so a cc-direct report still prints the
  `npm run ingest:podcast -- --show <slug>` api command. Cosmetic; fixing it means
  touching `artifact.ts` (would need its own brief to relax the Diff=0 boundary,
  or a `source`/`tagging`-aware report header).
- **Alias-gap candidates surfaced by the demo** (unresolved forms): `Emperor`
  (vs the resolving `The Emperor`), `Yarrick`, `Silent King`, `Men of Iron`,
  `Atoma Prime`, `Beta Garmon`, `Armageddon Steel Legion`, `Lyubov`. Normal
  curation fodder — same kind the api path produces — not a cc-direct issue.

## For next session

- A brief to **run the full Luetin cc-direct backfill** + decide its apply target
  (replace vs new slug), then DB-apply.
- Optionally make the quality report `tagging`-aware (would relax `artifact.ts`
  Diff=0) so cc-direct reports print the cc-direct reproduce commands.
- Consider a thin `npm`/doc pointer to `run-podcast-tag-loop.sh` in the ingest
  workflow page (Brain — coordination worktree owns that).

## References

- Brief: `sessions/2026-06-07-131-arch-podcast-tagging-cc-direct.md`.
- Driver model: `scripts/run-ssot-loop.sh`; CC-Direct rationale: the book-loop
  ADR `brain/wiki/decisions/why-cc-direct-curation.md`.
- YouTube source + curation: `sessions/2026-06-07-130-impl-youtube-source-adapter.md`.
