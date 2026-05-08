# `brain/raw/reviews/`

External code reviews (codex, gpt-5, external authors, …) land here as the raw artifact you received. Each file is immutable.

Filename convention: `YYYY-MM-DD-<source>.md` (e.g. `2026-05-08-codex-pipeline.md`).

Each file carries this YAML frontmatter banner:

```yaml
---
review-date: 2026-05-08
review-source: codex
review-target: src/lib/ingestion/* + sessions/2026-05-08-046-arch-opus-pipeline-d.md (CLAUDE.md, ARCHITECTURE.md, etc.)
---
```

When a review lands:

1. Save the original artifact verbatim into this folder with the banner.
2. Triage findings — fold actionable items into [`brain/wiki/open-questions.md`](../../wiki/open-questions.md) or open a Cowork brief.
3. Reference the raw file in the resulting brief / decision page so the synthesis is traceable.

Reviews are never edited after they land. If the reviewer issues a follow-up, save it as a separate file with its own banner.

This folder is empty at first creation (Karpathy-Reset 2026-05-08, brief 049). The first incoming review under this convention is whichever one arrives next.
