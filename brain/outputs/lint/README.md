# `brain/outputs/lint/`

Lint reports for the Brain wiki land here as `YYYY-MM-DD.md`.

Lint definitions live in [`brain/wiki/workflows/lint.md`](../../wiki/workflows/lint.md). The lint script itself is a follow-up brief — until then, this folder is empty.

When a lint script lands and runs, it produces one report per run (chronological newest-last in this folder), grouped by check category:

- Stale claims (Wiki page asserts something that no longer matches the code/repo state)
- Broken internal links
- Orphan pages (no inbound links from `wiki/index.md` or any other wiki page; `index.md` itself is exempt)
- Pages without YAML frontmatter, or with required fields missing
- Pages with `confidence: low` older than 30 days (Re-ingestion reminder)
- `raw/historical/` files without `snapshot-*` frontmatter banner
- Decision pages without `decision-date`

Per the schema in [`brain/CLAUDE.md`](../../CLAUDE.md), `outputs/` is intentionally separate from `wiki/` — lint reports are *test reports*, not part of the executable knowledge.

This folder is empty at first creation (Karpathy-Reset 2026-05-08, brief 049).
