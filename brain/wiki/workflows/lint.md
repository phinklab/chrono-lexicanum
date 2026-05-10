---
title: Lint workflow
type: workflow
created: 2026-05-09
updated: 2026-05-09
sources:
  - ../../../sessions/archive/2026-05/2026-05-08-049-arch-karpathy-brain-atlas-reset.md
  - ../../../sessions/archive/2026-05/2026-05-09-053-arch-brain-lint.md
  - ../../../scripts/brain-lint.ts
  - https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
related:
  - ../decisions/karpathy-reset-2026-05-08.md
  - ../../CLAUDE.md
  - ./session-end.md
confidence: high
---

# Lint workflow

> The third Karpathy operation (Ingest / Query / **Lint**). Lint flags drift between the wiki and reality. **It never edits the wiki** — fixes happen via Ingest in a separate session.

## Run

```bash
npm run brain:lint                     # writes brain/outputs/lint/<today>.md, exits 1 on blocking
npm run brain:lint -- --no-write       # CI mode: print summary + exit code, no report file
npm run brain:lint -- --date=2026-05-09 # override report date (for repro / replay)
npm run brain:lint -- --strict         # warnings exit non-zero too
npm run brain:lint -- --help           # full usage
```

CI calls `npm run brain:lint -- --no-write` after `npm run check:eras` in `.github/workflows/ci.yml`. Default exit policy: **blocking findings exit 1**, warnings exit 0. `--strict` flips warnings to blocking — not the CI default today (queue-stability before ratcheting; revisit after 2–3 weeks of real reports).

Reports land in [`../../outputs/lint/`](../../outputs/lint/) as `YYYY-MM-DD.md`. The folder is *artifact*, not wiki — it's the `outputs/` half of Karpathy's compiler analogy (test reports, not executable knowledge).

## When to run

- **Locally before a substantive architect brief** that builds on existing wiki claims (don't architect on stale facts).
- **CI on every PR** (automatic) — keeps frontmatter / sources / links / catalog freshness from rotting between merges.
- **After a long quiet period** (2+ weeks). Manual run on demand.

## Severity policy

| Severity | Categories | CI behavior |
|---|---|---|
| **error** (blocking) | Frontmatter, Decision metadata, Sources, Internal links, Catalog freshness, Raw banners, Inline diff raw fields (in fenced/JSON contexts) | Exit 1 |
| **warning** | Stale low-confidence, Brain size budget, Stale claim suspects, Inline diff raw fields (inline-code in prose) | Exit 0 (default), exit 1 with `--strict` |

Errors are deterministic: schema violations, broken links, missing files, raw payloads in synthesis pages. Warnings are heuristic drift signals — useful but not gate-worthy until the warning channel proves stable.

## Categories

The script (`scripts/brain-lint.ts`) implements ten categories. The blocking ones are explicit; warnings are conservative-by-default.

### 1. Frontmatter (blocking)

Every `brain/wiki/**/*.md` (except `log.md`) must carry YAML frontmatter with: `title` (string), `type` (one of `overview | decision | workflow | concept | source-summary | reference`), `created` (`YYYY-MM-DD`), `updated` (`YYYY-MM-DD`), `sources` (array, may be empty), `related` (array, may be empty), `confidence` (one of `high | medium | low`). Dates must parse; `updated >= created`.

### 2. Decision metadata (blocking)

Pages with `type: decision` must additionally carry `decision-date: YYYY-MM-DD`, and `decision-date <= updated`.

### 3. Sources (blocking)

For each `sources:` entry in wiki frontmatter:

- HTTPS URLs are allowed and not browsed.
- Relative paths are resolved against the wiki file's directory; existence is checked (anchors stripped first).
- Free text / parenthetical comments inside `sources:` are rejected — the array must be literal paths or URLs.
- Pointers into `ingest/.last-run/` are allowed (the [retention policy in pipeline-state.md](../pipeline-state.md#ingest-diff-retention) accepts diff JSON as a citable source).

### 4. Internal links (blocking)

Markdown links and images are scanned in:

- `brain/wiki/**/*.md` (full)
- `brain/CLAUDE.md`, `brain/outputs/lint/README.md`, `brain/raw/reviews/README.md` (full)
- Top-level `CLAUDE.md`, `README.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `ONBOARDING.md` — only links into `brain/` or `sessions/`

Fenced code blocks and inline-code spans are skipped. External URLs / `mailto:` / pure anchors / wikilinks are skipped. Targets are resolved relative to the file, anchors stripped, URL-encoding decoded; existence is then checked. Anchor existence inside the target file is not verified today.

### 5. Catalog freshness (blocking)

`brain/wiki/index.md` is the master catalog. Every wiki page (except `log.md`) must appear there as a relative markdown link. Every catalog link must resolve. If a catalog row shows an `updated` date, it must equal the page's frontmatter `updated`.

The orphan rule from brief 049 is folded into this check: a non-orphan is by definition catalogued.

### 6. Raw banners (blocking)

`brain/raw/historical/**/*.md` (except any `README.md`) must carry frontmatter with `snapshot-of`, `snapshot-date` (valid `YYYY-MM-DD`), `snapshot-reason`, `canonical-now`.

`brain/raw/reviews/**/*.md` (except `README.md`) must carry `review-date` (valid `YYYY-MM-DD`), `review-source`, `review-target`.

### 7. Inline diff raw fields (blocking in code/JSON, warning in prose)

Per the [Brain rule from brief 052](../pipeline-state.md#brain-regel-universell-unabhängig-von-der-storage-wahl), wiki pages must not inline-quote diff raw payloads. Tokens checked: `rawLlmPayload`, `rawHardcoverPayload`, `updated[].diff`, `llm_flags`, `payload`, plus `fieldOrigins` (only flagged in JSON contexts to avoid colliding with glossary mentions).

- In a fenced code block → blocking error (raw dump).
- In a JSON-shaped line (`"<token>":`) → blocking error.
- In an inline-code span in prose → warning (could be naming the field; could be quoting raw).
- In plain prose → no flag (too noisy; field names appear in legitimate explanation).

Pages exempt from this check (they define / describe the tokens):

- `brain/wiki/pipeline-state.md`
- `brain/wiki/workflows/lint.md` (this page)
- `brain/wiki/workflows/ingest.md`
- `brain/wiki/glossary.md` is exempt from the inline-code-warning bucket (glossary entries name tokens by definition); fenced/JSON checks still apply.

### 8. Stale low-confidence (warning)

Pages with `confidence: low` and `updated` more than 30 days ago. Either re-ingest with higher confidence, or downgrade the page-type if the uncertainty is permanent.

### 9. Brain size budget (warning)

Soft limits on body line count (frontmatter excluded; `log.md` and `index.md` exempt because they grow append-only / catalog-with-the-wiki):

| Page kind | Soft limit (body lines) |
|---|---|
| `project-state.md` | 160 |
| Decision pages (`type: decision`) | 100 |
| Other wiki pages | 300 |

Limits live as `SIZE_LIMITS` constants at the top of `scripts/brain-lint.ts` — calibrated against the May-2026 post-051-Slim Brain. Adjust there when the Brain grows organically.

### 10. Stale claim suspects (warning, intentionally narrow in v1)

Two zero-noise heuristics:

- **NPM scripts.** `npm run <name>` mentions in any wiki page are checked against `package.json.scripts`; missing scripts warn.
- **Repo paths.** Backticked tokens and markdown link targets with prefix `src/` | `scripts/` | `brain/` | `sessions/` | `docs/` | `ingest/` | `.github/` are checked for existence. Already-flagged blocking links aren't re-reported. Placeholder-shaped tokens (`<x>`, `{x}`, `YYYY/MM/DD/HH/NNN` segments) and gitignored ingest subdirs (`ingest/.cache/`, `ingest/.llm-cache/`, `ingest/.state/`) are skipped.

`log.md` is exempt from the path-claim check because it's an append-only operation log; its bullets document files as they were *at the time of the entry*, and rewriting historical entries falsifies the journal.

**Deliberately not in v1:** code-symbol heuristics (backticked `CONSTANT_NAME` / `functionName()` / `TypeName` greps against `src/`). Fuzzy selection, false-positive risk in glossary / concept pages erodes trust in the warning channel before it stabilizes. Promote to v2 once 2–3 weeks of real reports show the existing heuristics are stable.

## What lint does NOT do

- **Lint never edits the wiki.** It reports. Fixes happen via Ingest passes (Cowork-side) or as deliberate file edits in a follow-up implementer session.
- **Lint does not run code.** No DB connection, no LLM calls, no subprocess except `fs` reads and `package.json` parse.
- **Lint does not check raw / sessions content drift.** Sessions and `raw/` are immutable; only links *out of* current wiki/doc pages are lintable.
- **Lint does not check the Atlas.** Atlas is a mechanical mirror of Postgres; if it's wrong, the regen-script is buggy, not the Atlas content.
- **Lint does not verify factual claims** like "Phase 3 in flight" or "$0.114/book". Those are caught by the human eye during the periodic `session-end` pass.
- **Lint does not check anchor existence inside link targets.** Only file-existence.

## Distant: heuristic-LLM extension (Astro-Han pattern)

Brief 053's "Future-Anker" section names the natural next axis: an LLM-driven heuristic pass (CC skill or MCP tool) that reads wiki pages against code-reality and reports drift suspects (e.g. *"this page mentions `pickPrimarySource` but the function name has changed"*). The split mirrors the [Astro-Han karpathy-llm-wiki](https://github.com/Astro-Han/karpathy-llm-wiki) Agent skill's vocabulary: deterministic checks (this script) vs. heuristic checks (LLM). Not in 053; explicitly named so a future brief doesn't reinvent.
