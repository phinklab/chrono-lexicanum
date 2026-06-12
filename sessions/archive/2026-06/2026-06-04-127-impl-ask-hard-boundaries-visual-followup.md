---
session: 2026-06-04-127
role: implementer
date: 2026-06-04
status: complete
slug: ask-hard-boundaries-visual-followup
parent: 2026-06-03-121
links:
  - 2026-06-03-126
commits: []
---

# 127 - Ask hard boundaries + visual follow-up

## Summary

Post-P3 follow-up is implemented: `/ask` keeps its cyan/librarium identity but now follows the `/werke` hero rhythm more closely, and the recommender applies non-negotiable gates without allowing empty profiles. All 1080 complete Ask answer combinations now return at least one recommendation.

## What I did

- `src/app/styles/53-ask.css` - aligned Ask's hero height, centered sweep, title y-position, and body overlap with the `/werke` archive rhythm while keeping cyan and the existing background.
- `src/app/styles/58-ask-booklist.css` - removed leftover gold accents from Ask controls/results so the surface remains cyan.
- `src/lib/ask/boundaries.ts` - added DB-free hard-boundary rules for Ask candidates.
- `src/lib/ask/recommend.ts` - filters recommendation candidates through the hard boundaries before scoring and before the curation overlay.
- `scripts/test-ask-questions.ts` - added DB-free regression coverage for the faction and length boundaries.

## Decisions I made

- **Kept Ask cyan and kept `librarium`.** The archive page is now the layout/rhythm reference, not a color/background transplant.
- **Question 2 is the real faction gate.** If a book has `primary` factions, the selected faction family must be one of them. If no primary role exists, the leading non-antagonist faction must match. This blocks "selected Inquisition, got Ultramarines-primary" without making all broad Imperium content vanish.
- **Question 4 is hard only for the concrete bad case.** `single book` excludes container formats (`omnibus`, `anthology`, `collection`, `artbook`, `scriptbook`). `trilogy` and `epic` stay strong scoring preferences instead of hard candidate killers, because hard-filtering them created empty combinations.
- **Curation cannot override the gates.** Boundaries run before `applyAskCuration()`, so pins/boosts cannot reintroduce a blocked omnibus for `single book`.

## Verification

- `npm.cmd run test:ask-questions` - pass, including boundary regression tests.
- No-write enumeration over all 1080 complete Ask combinations via `recommend(..., { cacheBooks: true })` - pass, `empty: 0`.
- `npm.cmd run test:ask-recommend` - pass.
- `npm.cmd run lint` - pass.
- `npm.cmd run typecheck` - pass.
- Previously in this follow-up before the last boundary correction: `npm.cmd run build` and `npm.cmd run brain:lint -- --no-write` both passed (`brain:lint`: 0 blocking, 15 warnings).

## Open issues / blockers

No blocker. Browser visual QA was intentionally left to Philipp's live view per maintainer input.

## For next session

- If the faction gate feels too strict for broad Imperium picks, tune only the boundary predicate/fallback, not the scoring weights.
- If Product wants stricter commitment behavior later, add a fallback ladder rather than returning empty results.

## References

- `sessions/2026-06-03-126-impl-ask-funnel-redesign.md`
- `src/lib/ask/recommend.ts`
- `src/lib/ask/boundaries.ts`
