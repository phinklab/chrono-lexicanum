---
session: 2026-06-03-126
role: implementer
date: 2026-06-03
status: complete
slug: ask-funnel-redesign
parent: 2026-06-03-121
links:
  - 2026-06-03-125
commits: []
---

# 126 - Ask funnel redesign

## Summary

P3 is implemented: `/ask` is now a public five-question funnel wired to the B4
flat Ask contract and real DB-backed `recommend()` results. The old six-path
sample-data UI is retired.

## What I did

- `src/app/ask/page.tsx` - parses flat answer SearchParams and calls
  `recommend()` server-side only when all five answers are present.
- `src/lib/ask/params.ts` - shared validation/build helpers for the public
  SearchParam contract.
- `src/components/ask/*` - rebuilt the client funnel, question cards, progress
  rail, loading/error states, and recommendation cards against
  `ASK_QUESTIONS`/`AskRecommendationResult`.
- `src/app/styles/53-ask.css` and `58-ask-booklist.css` - replaced the old
  path-landing layout with a compact `/werke`/Chronicle-style ask console.
- `src/lib/askPaths.ts` and `src/components/ask/PathSelect.tsx` - removed the
  stale six-path placeholder contract and sample books.
- `sessions/2026-06-03-121-arch-product-board.md` - marked P3 erledigt while
  leaving the standing board open.

## Decisions I made

- **SearchParams are the public contract.** Answers are mirrored as
  `experience`, `faction_love`, `tone`, `length`, and `era_pref` in the URL.
  This keeps result URLs shareable and lets the Server Component call
  `recommend()` without a client DB import or extra API route.
- **Recommendations load only for complete profiles.** Partial states stay in
  the client funnel; complete profiles are ranked server-side with
  `onError: "throw"` so the UI can show an explicit error state.
- **No `askPaths.ts` mapping layer.** Keeping the old six-path model would have
  created a second source of truth. The B4 `ASK_QUESTIONS` flat contract is now
  the UI source.
- **Scores and curation are hidden.** Result cards show human reason chips from
  matched reasons plus book metadata and links to `/buch/[slug]`; score and
  curation internals stay out of the public UI.

## Verification

- `npm.cmd run lint` - pass.
- `npm.cmd run typecheck` - pass.
- `npm.cmd run build` - pass; `/ask` is dynamic as expected.
- `npm.cmd run brain:lint -- --no-write` - pass with 15 warnings, 0 blocking.
- Server smoke: `GET /ask?experience=new&faction_love=inquisition&tone=political&length=trilogy&era_pref=long_war` returned 200 and included result heading plus `/buch/` links.

## Open issues / blockers

- Browser visual QA was tool-blocked in this desktop thread: the in-app Browser
  bootstrap failed twice with `windows sandbox failed: spawn setup refresh`, and
  the bundled Playwright package lacks `playwright-core`. The dev server is
  available on `http://localhost:3000` for manual review.

## For next session

- Product visual pass should check `/ask` at desktop and <=720px in a real
  browser, especially long reason chips and recommendation rows.
- Editorial/product review can tune the B4 curation overlay if starter-family
  expectations differ from the current Top-5 output.

## References

- `sessions/2026-06-03-125-impl-ask-model-handoff.md`
- `sessions/2026-06-03-121-arch-product-board.md`
- `src/lib/ask/questions.ts`
- `src/lib/ask/recommend.ts`
- `src/lib/ask/types.ts`
