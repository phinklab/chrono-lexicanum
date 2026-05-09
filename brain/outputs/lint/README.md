# `brain/outputs/lint/`

Lint reports for the Brain wiki land here as `YYYY-MM-DD.md`, one per run. Lint definitions live in [`brain/wiki/workflows/lint.md`](../../wiki/workflows/lint.md); the script is `scripts/brain-lint.ts` (run via `npm run brain:lint`).

Reports are *test reports*, not part of the executable knowledge — per the Karpathy compiler analogy in [`brain/CLAUDE.md`](../../CLAUDE.md), `outputs/` is intentionally separate from `wiki/`.

## Running

```bash
npm run brain:lint                     # writes today's report; exit 1 on blocking findings
npm run brain:lint -- --no-write       # CI mode (no file written)
npm run brain:lint -- --date=2026-05-09 # override report date
npm run brain:lint -- --strict         # warnings exit non-zero too
```

CI invokes the `--no-write` form in `.github/workflows/ci.yml` after `npm run check:eras`.

## Categories (recap)

Blocking: Frontmatter, Decision metadata, Sources, Internal links, Catalog freshness, Raw banners, Inline diff raw fields (in fenced/JSON contexts).

Warning: Stale low-confidence, Brain size budget, Stale claim suspects, Inline diff raw fields (inline-code in prose).

Detail and rationale in [`brain/wiki/workflows/lint.md`](../../wiki/workflows/lint.md).

## First report

`2026-05-09.md` — initial run after the script shipped (brief 053). Four blocking findings were fixed in the same session (date typo in one `sources:` path, wrong-depth relative paths in two decision pages, one wrong-date markdown link in `deferred-questions.md`). One warning remains — Phase-5 forward reference in `roadmap.md`, resolves when Phase 5 ships. See brief 053's implementer report for triage notes.
