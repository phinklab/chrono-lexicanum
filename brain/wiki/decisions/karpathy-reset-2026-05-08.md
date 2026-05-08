---
title: Karpathy-Reset — Brain + Atlas
type: decision
created: 2026-05-08
updated: 2026-05-09
sources:
  - ../../../sessions/2026-05-08-049-arch-karpathy-brain-atlas-reset.md
  - https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
  - https://blog.starmorph.com/blog/karpathy-llm-wiki-knowledge-base-guide
related:
  - ../project-state.md
  - ../../CLAUDE.md
  - ../workflows/session-end.md
  - ../workflows/atlas-regen.md
confidence: high
decision-date: 2026-05-08
---

# Why a Karpathy-Reset (Brain + Atlas)

**Status:** active · **Decided:** 2026-05-08 (Brief 049) · **Implemented:** 2026-05-09 (049-impl) · **Sessions:** [049-arch](../../../sessions/2026-05-08-049-arch-karpathy-brain-atlas-reset.md), [049-impl](../../../sessions/2026-05-09-049-impl-karpathy-brain-atlas-reset.md)

## Context

Phase 3 produced material that was hard to navigate: ~50 sessions, ~21 ingestion modules, 2 external code reviews, a 9-item Carry-over (against an aspirational limit of 3–5). Cowork's session-start required reading `sessions/README.md` (95 lines) plus 2–3 recent reports just to get oriented — that's lookup-work, not a pattern. Top-level docs (CLAUDE.md / ARCHITECTURE.md / ROADMAP.md / ONBOARDING.md) drifted post-Plan-Reshuffle 2026-05-02; brief 048 partially refreshed them but no permanent discipline existed to keep them current.

Karpathy ([gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)) addresses exactly this: **the LLM does not answer from raw logs anymore. It maintains synthesized wiki pages against immutable raw sources, with three operations (Ingest / Query / Lint).** Starmorph's [implementation guide](https://blog.starmorph.com/blog/karpathy-llm-wiki-knowledge-base-guide) added concrete conventions (`wiki/index.md` + `wiki/log.md`, frontmatter schema with `type/created/updated/sources/related/confidence`, `outputs/` separate from `wiki/`).

The split that made this project-specific: **two domain-distinct knowledge stores.**

- **Engineering knowledge** (how the project works, why we chose Drizzle, how the pipeline runs, what's open) — small, changes per-session, always relevant for the LLM.
- **Book-domain knowledge** (~800 books × N fields, sources per field, plot synopses, faction/location/character mappings) — huge, changes per pipeline-run, **rarely** relevant for the LLM (only on explicit lookup). Postgres is canonical.

Mixing them eats Karpathy's token-vorteil immediately. The split is non-negotiable.

## Options considered

- **Option A — single Brain in repo, all knowledge.** Karpathy/Starmorph's literal pattern. Rejected: per-book detail (the ~800 books) would balloon the always-loaded context. Token-vorteil collapses.

- **Option B — Brain in repo + Atlas in repo.** Both folders inside `chrono-lexicanum/`. Rejected: Atlas in repo means git-tracking ~800-book Markdown output, and pipeline runs producing huge diffs. Cleaner to keep Atlas as a generated artifact, mechanically derived from Postgres.

- **Option C — Brain in external Obsidian vault + Atlas in external vault.** Both outside the repo. Rejected: an in-repo Brain commits with code changes (atomic commit pattern), and the top-level CLAUDE.md auto-load anchor pulls Brain into every session for free. External-vault Brain breaks both.

- **Option D ✅ chosen — Brain in repo (`brain/`), Atlas in external Obsidian vault (`chrono-atlas/`, default `~/chrono-atlas/`).**
  - In-repo Brain = atomic commits + auto-load via top-level CLAUDE.md + low-friction IDE editing.
  - External Atlas = Obsidian's natural graph-view UX, no git bloat from regenerated content, regenerated mechanically from Postgres (single source of truth) via `npm run atlas:regen`.
  - Brain is small (≤ a few hundred KB target), always loaded, LLM-synthesized. Atlas is big, never auto-loaded, mechanically generated.

## Decision

**Brain (`brain/` in repo) + Atlas (`chrono-atlas/` external Obsidian vault, default `~/chrono-atlas/`).**

Brain follows Karpathy's three-layer architecture instantiated with Starmorph conventions:

- `brain/CLAUDE.md` — Karpathy schema file (read-order, three operations, frontmatter convention)
- `brain/wiki/` — LLM-synthesized pages (the "executable")
- `brain/raw/` — immutable sources (`historical/`, `reviews/`)
- `brain/outputs/` — generated artefacts (`lint/` initially)

Atlas is **not** a Karpathy wiki. It's a mechanical mirror of Postgres: 0% LLM-synthesis, 100% generated. Postgres is canonical for book-domain; if Atlas and Postgres diverge, Postgres wins and the regen-script has a bug.

Top-level docs reshape:
- `README.md` slim (pitch + status + brain pointer + live URL)
- `ARCHITECTURE.md` / `ROADMAP.md` / `ONBOARDING.md` → 4-line redirect files pointing to `brain/wiki/<name>.md` and `brain/raw/historical/2026-05-08-pre-reset/<name>.md`
- Top-level `CLAUDE.md` keeps stack/conventions, gets a new `## Brain & Atlas` section at the top with the read-order

## Why

- **Atomic commits.** Code change + wiki-update in the same commit; reviewers see them together. External-vault Brain breaks this.
- **Auto-load.** Top-level CLAUDE.md is loaded by the harness on every session. With Brain in repo and CLAUDE.md pointing at it, Cowork/CC always start from the right pages — no separate sync discipline.
- **Karpathy spirit, low friction.** Karpathy's only hard requirement was a folder structure. Obsidian-bedienbarkeit can be served by the external Atlas; Brain wants editor support (VS Code) more than graph view.
- **Symmetry to the domain split.** External Atlas is the visualization layer for book data; in-repo Brain is the source-of-truth for engineering knowledge. The physical split mirrors the domain split.
- **Manual atlas-regen-trigger** (not auto-on-3d-Apply): 3d-Apply doesn't exist yet; Atlas is allowed to be stale (Postgres is truth); lazy trigger means no coupling, no race conditions.

## When this decision should be revisited

- If the wiki grows past ~50 pages or 2 MB and Query becomes slow → consider QMD ([Karpathy-recommended BM25/Vector/LLM-rerank](https://github.com/tobi/qmd)) as a search layer.
- If atlas-regen friction becomes painful (manual call gets forgotten before screenshots/Reddit-launch) → wire an auto-trigger after 3d-Apply.
- If a third domain emerges (e.g. content-licensing knowledge from Black Library negotiations) that doesn't fit Brain or Atlas, consider whether it deserves a third store — but be skeptical (every new store dilutes the domain-split discipline).
- If two-vault setup proves too high-friction for solo-Philipp use, consider folding Atlas back into Brain with an explicit `wiki/atlas/` subfolder + `tags: [book-data]` frontmatter for selective loading. Today (post-049) the split is non-negotiable; revisit after 6 months of real use.

## Initial concrete decisions resolved during 049

(Brief 049's open questions, all resolved by CC during implementation; documented here for future reference.)

1. **Wikilinks vs MD links.** Relative MD links inside Brain (IDE/GitHub render); Wikilinks reserved for the Atlas (Obsidian).
2. **Glossary granularity.** ≤3-sentence terms in `glossary.md`; longer/conceptual terms get individual `concepts/<slug>.md` pages (none planned in 049).
3. **brain/raw/sessions/.** Variant A: no symlinks. Wiki pages link directly to `../../sessions/<id>.md`. Cross-platform clean.
4. **Top-level CLAUDE.md vs brain/CLAUDE.md.** Both exist. Top-level remains auto-load anchor with new `## Brain & Atlas` section pointing to brain/CLAUDE.md (Karpathy schema).
5. **Atlas default path.** `path.join(os.homedir(), "chrono-atlas")`. CLI override `--out=<path>`.
6. **First ingest pass.** All ~25 wiki pages substantively seeded (Tier 1 fully fleshed, Tier 2 compact-seed-with-citations, catalogs `index.md` + `log.md` written last).
7. **CC skills for wiki ops.** Defer; re-evaluate after 2–3 manual session-end cycles.
8. **QMD/Dataview.** Mention only in `wiki/workflows/query.md` as "distant" — no action in 049.
