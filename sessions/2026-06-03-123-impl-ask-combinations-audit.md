---
session: 2026-06-03-123
role: implementer
date: 2026-06-03
status: complete
slug: ask-combinations-audit
parent: 2026-06-03-122
links:
  - 2026-06-03-122
commits: []
---

# 123 - Ask combinations audit

## Summary

B4.3 is implemented: `npm run audit:ask-combinations` enumerates all 1080 flat Ask answer combinations, calls `recommend()` for each, and writes review artefacts under `ingest/ask/`.

The generated report is explicitly marked as review basis only, not a frontend data source. It surfaces several curation findings for Philipp/Cowork, especially `era_heresy` and `era_indomitus` having no Top-10 ranking effect in the current data path.

## What I did

- `scripts/audit-ask-combinations.ts` - new DB-backed audit script; emits Markdown + slim JSON with all combinations, Top-10 recommendations, matched reason codes, dominance stats, weak/empty stats, tag-effect stats, option coverage, and plausibility checks.
- `ingest/ask/audit-ask-combinations.md` - generated reviewer report.
- `ingest/ask/audit-ask-combinations.json` - generated structured reviewer data; slimmed to matched reason codes instead of full internal reason objects.
- `src/lib/ask/recommend.ts` - added opt-in `cacheBooks` support so the audit still calls `recommend()` 1080 times without reloading the DB 1080 times. Default behavior is unchanged.
- `package.json` - added `audit:ask-combinations` alongside the existing Ask test scripts already present on this branch.

## Decisions I made

- **Generated both Markdown and JSON.** Markdown is the review surface; JSON is a companion for searching/scripting, not app data.
- **Top-10 instead of Top-5.** The brief allowed either; Top-10 gives better visibility into near-misses for the curation review.
- **Opt-in recommender cache.** I kept it behind `cacheBooks?: boolean` so normal server calls continue to fetch current DB state per call, while the audit run remains fast and cheap.
- **No Board status flip.** `122` is a standing board, not a single closed brief; this report records B4.3 completion without changing the board to `implemented`.

## Verification

- `npm run test:ask-questions` - pass.
- `npm run audit:ask-combinations` - pass; wrote `ingest/ask/audit-ask-combinations.md` and `.json`.
- `npm run test:ask-recommend` - pass.
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run brain:lint -- --no-write` - fails before this task: 2 blocking Catalog freshness findings + 13 warnings. I did not edit `brain/**` from the Batches worktree.

## Open issues / blockers

- The audit report flags plausible ranking issues, but this session intentionally did not tune the recommender.
- Current standout findings: most requested plausibility anchors are `review`, `era_heresy` and `era_indomitus` are active but never matched in Top-10, and Eisenhorn/Uriel/Ultramarines/Ravenor-style rows are dominant in broad slices.

## For next session

- Review `ingest/ask/audit-ask-combinations.md` before changing weights; the report already separates empty/weak/dominance/tag-effect/coverage questions.
- Likely follow-up: inspect why Heresy/Indomitus era tags do not match current `primaryEraId`/timeline data even on explicit era requests.
- Likely follow-up: decide whether omnibus/container rows should be damped or whether canonical starter singles should be promoted for the public Ask experience.

## References

- FanFiAddict beginner guide: https://fanfiaddict.com/so-you-want-to-start-reading-warhammer-40000-heres-where-to-start/
- WH40K Book Club beginner guide: https://wh40kbookclub.com/beginners-guide-to-warhammer-40000/
