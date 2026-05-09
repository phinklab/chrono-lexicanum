---
title: Query workflow
type: workflow
created: 2026-05-09
updated: 2026-05-09
sources:
  - https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
  - https://blog.starmorph.com/blog/karpathy-llm-wiki-knowledge-base-guide
  - ../../../sessions/archive/2026-05/2026-05-08-049-arch-karpathy-brain-atlas-reset.md
related:
  - ./ingest.md
  - ./lint.md
  - ../../CLAUDE.md
confidence: high
---

# Query workflow

> One of Karpathy's three operations (Ingest / **Query** / Lint). Query is how Cowork or Claude Code answer "what did we decide / what's open / how does X work" against the wiki — without paging in raw session logs or guessing.

## Trigger

Cowork or CC needs to know:

- *What did we decide* about library X / pattern Y / phase Z?
- *What's currently open* on the queue?
- *How does* the pipeline / the schema / the merge engine *work*?
- *Where does* book-domain knowledge live (hint: it doesn't live in Brain)?

## Input

- The question.
- [`../index.md`](../index.md) — the master catalog, read first.
- The relevant `wiki/` pages (pulled by topic from the catalog).

## Output

An answer grounded in wiki content, with citations to the wiki pages that support each claim.

## Rules

### 1. Read `index.md` first

Don't brute-force load every wiki page into context. The catalog has a one-line description per page + the `updated` date. Use it to pick the 2–4 pages that are actually relevant. This is the whole point of the index — without it, Query devolves into "load everything" which loses the token-vorteil of Karpathy's pattern.

### 2. Cite

Every wiki-derived claim in the answer should reference the wiki page that supports it: `[architecture.md](../architecture.md)` or `[decisions/why-haiku-not-sonnet.md](../decisions/why-haiku-not-sonnet.md)`. This lets the user follow up if needed and creates an audit trail in chat history.

### 3. If the wiki doesn't have it, say so

Don't fall back to guessing from raw sources or from training-cutoff knowledge. If the question's answer isn't in the wiki, the honest response is "the wiki doesn't cover this — let me check the source / the code / the current state". Then trigger an [Ingest](./ingest.md) if the question revealed a wiki gap.

### 4. If the wiki has it but you suspect it's stale, verify

A memory record is a claim that something was true *when the page was written*. If the question is about *current* state and the page's `updated` date is old, suspect drift:

- For factual claims: read the source (the code, the schema, the migration). If it disagrees with the wiki, the wiki is stale → trigger Ingest.
- For decisional claims (which we chose, what we decided): less likely to drift, but check anyway — the decision page should have a "When this should be revisited" section that makes it auditable.
- For state claims (current phase, what's running, latest cost): trust the wiki only if `updated` is within ~1 week. Older state: cross-check.

When stale-ness is confirmed: don't answer from the stale wiki. Update it (Ingest pass) and *then* answer.

### 5. The Atlas is on-demand only

If the question is about book-domain detail (a specific book's synopsis, a specific faction's books, cross-book queries), the answer lives in **Postgres** (canonical) or the external **Atlas** (`~/chrono-atlas/`, generated). Brain doesn't carry that data.

For book-domain Query:

- Recent state: query Postgres directly (Drizzle, `npm run db:studio`, or a one-off query).
- Browseable / graph-based: refresh the Atlas (`npm run atlas:regen`) and open it in Obsidian.
- Don't try to answer book-domain questions from Brain — at best you'll get the high-level numbers from [`../book-data-overview.md`](../book-data-overview.md), which doesn't carry per-book detail.

## Common Query patterns

### "What did we decide about X?"

1. Skim [`../index.md`](../index.md) for the relevant decision page (decisions are catalogued under their `type: decision`).
2. Read the page's Decision + Why sections.
3. Check the "When this should be revisited" section — if a triggering condition has met, the decision may be stale.

### "What's open?"

1. Read [`../open-questions.md`](../open-questions.md). It's structured: each item has Owner / Sessions / Follow-up brief.
2. Items at the top are higher-priority (or just newer). The list is curated by Cowork; not every item is equally urgent.

### "What's the current state of X?"

1. [`../project-state.md`](../project-state.md) for high-level "where are we now."
2. For pipeline-detail: [`../pipeline-state.md`](../pipeline-state.md).
3. For schema-detail: [`../architecture.md`](../architecture.md) + `src/db/schema.ts`.
4. Cross-check `updated` dates — if a page is old and the question is about current state, verify against code/repo before answering.

### "How does X work?"

1. Find the relevant page via [`../index.md`](../index.md).
2. Read the page; follow `related:` links if needed.
3. If the explanation is shallow and the source code is the real answer, cite the source code (e.g. "see `src/lib/ingestion/merge.ts:42–60` — wiki only has a synthesis").

## What Query does NOT do

- **Doesn't load raw sources by default.** `sessions/`, `raw/historical/`, `raw/reviews/` are referenced as sources but not loaded for typical queries. The whole point of synthesis is that the wiki carries enough that you don't need to read 50 sessions for a question.
- **Doesn't load Atlas by default.** Brain reading is small; Atlas is huge. Loading per-book Markdown into context for an engineering question is wrong.
- **Doesn't trigger Ingest as a side effect.** If Query reveals stale-ness or a gap, *note it* — but the actual Ingest is a separate operation (Cowork-initiated or CC-initiated, see [`./ingest.md`](./ingest.md)).

## Distant: search tools

Today (post-049, ~25 wiki pages): **`index.md` is enough**. You can read every page's title in <30 seconds.

When the wiki grows past ~50 pages or 2 MB, tools like [QMD](https://github.com/tobi/qmd) (Karpathy-recommended BM25/Vector/LLM-rerank over Markdown, with MCP server) become attractive — they let Query be "find me the page that talks about X" rather than "scan the index manually." This is open question 7 in brief 049 and item 8 in [`../open-questions.md`](../open-questions.md). Not in scope for 049.

For Atlas (the external book-domain vault), Obsidian's Dataview plugin offers structured cross-page queries. If you start running cross-book queries regularly (e.g. "show all books with the `value_outside_vocabulary` flag, sorted by year"), Dataview is the right answer. Today the regen-script renders the proof-of-render only; Dataview waits for full rendering.
