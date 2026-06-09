# Runbook — Entity-Blurbs full-coverage sweep (subscription Sonnet)

**Goal.** Give every entity in the three reference tables a short, factual catalogue
blurb, extending the committed curation JSONs from Board 122-B3. Target = **100 %
coverage** of:

| Type | Total | Done (2026-06-09) | Remaining |
|---|---|---|---|
| factions   | 202 | 56 | 146 |
| characters | 490 | 49 | 441 |
| locations  | 289 | 38 | 251 |
| **TOTAL**  | **981** | **143** | **838** |

The 143 already done = the hand-curated B3 pass (113) + the 30-entity long-tail
re-pilot. **Never regenerate an id that already has a blurb** — resume only fills the
remainder.

> This is a mechanical generation task, not a normal architect/implementer session.
> Skip the CLAUDE.md session-start read routine. The operative spec is this file.

---

## The mechanism — Sonnet subagents on the subscription (NOT the API)

The run is driven by **Claude Code `sonnet` subagents**, which bill against the Claude
subscription, **not** the metered Anthropic API. Do **NOT** run
`scripts/generate-entity-blurbs.ts` / `npm run generate:blurbs` — that script is the
API-key path (per-token billing); it stays in the repo only as a reference for the
prompt + schema. The full ~838-entity sweep on the API would cost roughly $12–18; on the
subscription it costs nothing metered.

Why subagents (and not the main loop doing it inline): each subagent gets a **fresh
context window**, so quality never drifts into the "dumb zone" as the run goes long. One
subagent = one batch of ~15 entities of a single type.

### The loop (the driving session runs this)

1. **`npm run blurbs:remaining`** — prints how many of each type are left. This is the
   resume oracle: the three blurb JSONs are "done", the three entity seed JSONs are
   "exists", the difference is "remaining". There is no separate ledger.
2. For a type, **`npm run blurbs:remaining -- --type character --batch 15`** — prints the
   uncovered entities as ready-to-feed JSON batches, each entity carrying `{id, name,
   ctx, cite?}` (ctx = faction/notes/sector/tags hints; cite = a Lexicanum URL when the
   seed row has one).
3. For each batch, **spawn one `sonnet` subagent** (`Agent` tool, `model: 'sonnet'`) with
   the prompt template below, pasting that batch's JSON in. Many batches can run in
   parallel (the workflow/agent concurrency cap is ~16); a full type is ~10–30 batches.
4. Each subagent returns a **JSON array** of `{id, blurb, sourceUrl, confidence}`. In the
   driving session, parse it, stamp `source_kind: "manual"` + `checkedAt: "<today>"`, and
   **append** the rows to the matching file's `blurbs` array
   (`faction-blurbs.json` / `character-blurbs.json` / `location-blurbs.json`).
5. After each write (or each type), **`npm run test:blurbs`** — must stay green (no
   dangling ids, ≤460 chars, ≤3 sentences, valid shape).
6. Repeat until `npm run blurbs:remaining` shows 0 / 0 / 0.

> **Step 4 tooling.** The "parse + stamp + append" of step 4 is done by
> `scripts/append-blurbs.ts` (the deterministic apply half of the trio with
> `list-uncovered-blurbs.ts`). It reads a subagent's raw output, validates every
> row against the *same* guardrails `test-entity-blurbs.ts` enforces, stamps
> `source_kind:"manual"` + `checkedAt`, and appends the survivors — rejecting
> (never writing) anything that would fail the test, and skipping ids already
> present (idempotent, so it is safe to re-run on resume):
>
> ```
> npx tsx scripts/append-blurbs.ts --type <faction|character|location> --date <YYYY-MM-DD> --in <subagent-output.json>
> ```
>
> A convenient pattern for the obscure `character` pole: split the per-batch
> input JSON to files once (`list-uncovered-blurbs.ts | scripts/.cache/split-batches.mjs`,
> the cache dir is gitignored), have each subagent read its `char-input-bN.json`
> and write `char-output-bN.json`, then `append-blurbs.ts` each output file. This
> keeps the batch JSON out of the driving session's context entirely.

### Final gate

When all three types read 0 remaining:

```
BLURBS_REQUIRE_FULL=1 npm run test:blurbs    # asserts 100 % coverage of all three tables
npm run lint
npm run typecheck
```

Then commit + PR (code/data → branch + PR; do not merge — Philipp merges).

---

## The subagent prompt template

Spawn with `Agent({ subagent_type: 'general-purpose', model: 'sonnet', prompt: <below> })`.
Substitute `<TYPE>` (faction / character / world) and paste the batch JSON for `<BATCH>`.

> You are writing short factual catalogue blurbs for a Warhammer 40,000 novel archive
> website. These are card blurbs shown on a `<TYPE>`'s detail page — NOT encyclopedia
> articles.
>
> Write ONE blurb for each entity in this list (use the exact `id` verbatim in your
> output; `name` is the display name, `ctx` is a context hint, `cite` if present is a
> Lexicanum URL you may use):
>
> `<BATCH JSON ARRAY>`
>
> RULES (strict):
> - 2–3 SHORT sentences. Hard cap: 320 characters total per blurb (aim ~250). Card blurb,
>   NOT an article.
> - Factual and neutral. Lead with what the entity IS and why it matters in the fiction.
> - Do NOT pad: no lists of sub-units, no officer-name rosters, no campaign minutiae, no
>   orbital mechanics, no plot recaps.
> - LICENSE SAFETY: write entirely in your own words. Paraphrase. Do NOT copy or
>   near-copy any sentence from a source.
> - Use web search ONLY when you are unsure of the facts; rely on your own knowledge
>   otherwise. Prefer wh40k.lexicanum.com, warhammer40k.fandom.com, or Black Library as
>   the cite source.
> - If an entity is too obscure to verify even with a search, write a careful one-line
>   best-effort blurb and set confidence ≤ 0.7 so it can be spot-checked later. Never
>   invent specific names/dates you cannot support.
> - Give each a sourceUrl (the page you'd cite) and a confidence 0.0–1.0.
>
> OUTPUT: return ONLY a JSON array, no prose before or after:
> `[{"id":"...","blurb":"...","sourceUrl":"https://...","confidence":0.9}, ...]`
> Every id in the input must appear in the output.

---

## Data shape & guardrails (unchanged from B3 — Spec 129, "kein Schema")

Blurbs live ONLY in the committed curation JSONs keyed by existing entity ids — **no DB
schema column, no migration, no seed.ts change**. Each row:

```jsonc
{
  "id": "elim_rawne",              // MUST exist in factions/characters/locations.json
  "blurb": "…",                    // 2–3 sentences, ≤ ~320 chars (test hard-caps at 460)
  "source_kind": "manual",         // hand-driven composition (DB sourceKind enum value)
  "confidence": 0.92,              // 0 < c ≤ 1
  "sourceUrl": "https://…",        // page the fact was verified against
  "checkedAt": "2026-06-09"        // YYYY-MM-DD of the run
}
```

- Files: `scripts/seed-data/{faction,character,location}-blurbs.json`, each
  `{ "$schema": "entity-blurbs-v1", "entityType": "...", "blurbs": [...] }`.
- DO NOT touch `brain/**` or `sessions/README.md` (Batches strand — Rollup-Ownership).
- DO NOT touch the DB schema, migrations, or `seed.ts`. No UI, no images.
- The request-time loader that surfaces these blurbs is a Product-strand job (Board 121),
  not part of this sweep.

## Quality notes carried from the re-pilot

- The 30-entity re-pilot landed at 2 sentences / 222–324 chars each — that is the target
  feel. The first pilot's 400–700-char essays were too long; the prompt above is the
  tightened version that fixed it.
- Spot-check any row with `confidence < 0.85` after the run (e.g. obscure minor
  characters and lore-only worlds will skew lower).
- The `characters` table (490) is the long pole and the most obscure tail — expect more
  web searches and more low-confidence rows there than for factions/locations.
