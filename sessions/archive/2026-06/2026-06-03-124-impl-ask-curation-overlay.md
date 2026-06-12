---
session: 2026-06-03-124
role: implementer
date: 2026-06-03
status: complete
slug: ask-curation-overlay
parent: 2026-06-03-122
links:
  - 2026-06-03-122
  - 2026-06-03-123
commits: []
---

# 124 - Ask curation overlay

## Summary

B4.4 is implemented: `recommend()` now applies a small, deterministic Ask curation overlay after base scoring and before limiting. The overlay is intentionally tiny (5 example rules), keyed by partial Ask profiles, and supports ban, pin, book boost, and matching-axis boost without touching the `/ask` UI or deleting `askPaths.ts`.

## What I did

- `scripts/seed-data/ask-curation.json` - new hand-curatable overlay with 5 defensible example rules from the B4.3 audit plus starter-guide anchors.
- `src/lib/ask/curation.ts` - new DB-free/client-safe parser and applier for partial-profile curation rules.
- `src/lib/ask/types.ts` - added optional `curation` effects on recommendations so callers can inspect pin/boost provenance.
- `src/lib/ask/recommend.ts` - applies curation server-side after base scoring; `curation: null` keeps explicit no-overlay mode available.
- `scripts/test-ask-recommend.ts` - added smoke coverage for ban > pin > boost, pin behavior, book boost, axis boost, and no-overlay mode.
- `sessions/2026-06-03-122-arch-batches-board.md` - marked B4 implemented through B4.1-B4.4 while leaving the standing board open.

## Decisions I made

- **Kept curation separate from base weights** because Philipp/Cowork need to tune examples without changing the recommender model or storing 1080 combinations.
- **Ban removes books outright** instead of merely lowering them. That makes precedence unambiguous and ensures a banned outlier cannot leak back into the limited result set.
- **Pin is structural plus points.** Pinned books sort ahead of non-pinned books for the matched partial profile, while the added points make the score shift visible.
- **Boost supports both `book` and `tag`.** Tag boosts only apply when the corresponding base reason matched, so an axis boost reinforces real matches rather than manufacturing fake ones.
- **Did not create a large starter list.** The committed rules only cover clear audit mismatches: Eisenhorn/Xenos Inquisition starter, one suppressed audit outlier, Infinite and the Divine for xenos standalone, and a small Guard/military axis boost.
- **Did not rerun the B4.3 audit artifact.** The existing audit remains the pre-curation review baseline; the smoke now verifies overlay behavior directly.

## Verification

- `npm.cmd run test:ask-questions` - pass.
- `npm.cmd run test:ask-recommend` - pass; smoke shows ban, pin, book boost, axis boost, deterministic ranking, and no-overlay mode.
- `npm.cmd run lint` - pass.
- `npm.cmd run typecheck` - pass.
- `npm.cmd run brain:lint -- --no-write` - fails before/independent of this task: 2 blocking Catalog freshness findings + 13 warnings. I did not edit `brain/**` from the Batches worktree.

## Open issues / blockers

- The Heresy/Indomitus era-tag issue from B4.3 remains a data/model follow-up; this overlay avoided pretending to fix that with broad hard pins.
- The example curation rules are seed rules, not final editorial truth. More rules should come from Philipp/Cowork review of the audit output.

## For next session

- Product 121-P3 can now wire the Ask funnel against the typed question/recommendation contract.
- If Cowork wants a second curation pass, start from `ingest/ask/audit-ask-combinations.md` and add only narrowly justified partial-profile rules.

## References

- `sessions/2026-06-03-123-impl-ask-combinations-audit.md`
- `ingest/ask/audit-ask-combinations.md`
- FanFiAddict beginner guide: https://fanfiaddict.com/so-you-want-to-start-reading-warhammer-40000-heres-where-to-start/
- WH40K Book Club beginner guide: https://wh40kbookclub.com/beginners-guide-to-warhammer-40000/
