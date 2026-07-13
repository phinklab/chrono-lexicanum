---
session: 2026-07-13-216
role: implementer
date: 2026-07-13
status: complete
slug: curator-spacing-polish
parent: none (direct maintainer follow-up to 2026-07-13-214)
links:
  - 2026-07-13-214
commits: []
---

# The Curator — lower composition, faction typography and dot choreography

## Summary

The Curator now follows the same lower-anchored masthead rhythm as Home, Archive and Compendium, placing its titles and tool content in the darker part of the background. Faction names use the site's display-register typography, the questionnaire rail and every stop share an exact axis, and answer choices use the full Sternwarte-dot bloom already established by the site's dot buttons.

## What I did

- `src/app/styles/53-ask.css` — moved the Curator landing and both selected-tool headers down the viewport, aligned eyebrow/title weight and scale with the shared route mastheads, and delayed the tool bodies until the darker image region.
- `src/app/styles/54-ask-faction.css` — restyled the always-visible faction register with the same display face, weight, line height and gold interaction language used by the Home and Compendium registers while retaining two mobile and three desktop columns.
- `src/components/ask/AskClient.tsx`, `src/app/styles/58-ask-booklist.css` — replaced the offset-based quiz rail with one nested rail coordinate system; line, fill and dot centres now match vertically and horizontally, and percentage fill ends exactly on each active stop.
- `src/components/ask/QuestionCard.tsx`, `src/app/styles/58-ask-booklist.css` — added the shared `BtnFx` rings/stars to each answer option and locally anchored the animation to the existing option dot without inheriting `.lx-btn` layout styles; idle rings stay dormant and the mobile bloom remains inside the viewport.
- `e2e/smoke-interactions.spec.ts` — extended the existing Curator geometry regression to assert the vertical rail-to-dot centre delta as well as both endpoints and the active fill.

### Maintainer follow-up — 2026-07-14

- Restyled the compact post-choice `The Curator` mark in Cardo italic so it reads as an editorial signature instead of a second telemetry label.
- Removed the active dot and its indentation from the `All factions` register; selection remains clear through gold type and `aria-current`.
- After maintainer review, unified all 18 faction names and every optional subfaction/chapter choice on Cardo; removed the temporary comparison attributes and route-scoped Chronicle font again.
- Removed the decorative midpoint before result-format labels such as `Trilogy` and `Omnibus`; author-plus-format combinations retain neutral spacing without a replacement glyph.
- Extended the faction smoke to pin the no-dot active state and the Cardo treatment of both menu levels.

## Decisions I made

- **Used the established lower masthead composition instead of adding a new scrim or panel.** The image, existing fade, typography and negative space provide the requested separation without introducing a foreign UI surface.
- **Kept the active tool header slightly shorter than the 92-vh catalogue mastheads.** At 84 svh the title sits in the dark region while the first progress/faction cue remains close enough to the fold to preserve tool discoverability.
- **Let the mobile landing extend to 105 svh.** Its title, subtitle and two stacked paths are taller than the site's ordinary heroes; the small extension moves the whole composition down while keeping both path titles visible in the first viewport.
- **Reused `BtnFx` markup but not the `.lx-btn` host class.** Local selectors preserve the ballot's full-width typography, borders and spacing while delivering the same expanding ring/star animation on hover and keyboard focus.
- **Used a nested rail with direct percentage width for progress.** This removes transform/subpixel drift and makes the fill geometry independent of viewport width.
- **Used Cardo as the final register voice.** Title case, restrained tracking and a larger optical size keep faction and subfaction names editorial and clickable without competing with the display hero above.

## Verification

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings; 21 pre-existing warnings.
- `npm run test:ask-questions` — pass, 10/10.
- `SITE_URL=https://example.invalid npm run build` — pass; 1,293 static pages generated. The existing Turbopack whole-project NFT tracing warning remains unchanged.
- Focused Playwright production run — 4/4 pass: Curator landing/progress and faction-register cases at 320 and 1,280 px.
- In-app browser QA — `/ask`, `/ask?mode=profile` and `/ask/faction` at 390 × 844 plus desktop; verified the lower/darker composition, two-column mobile faction register, no horizontal overflow and the shared display typography.
- Browser geometry at 390 px — rail left/right endpoints and all four dot centres match exactly; maximum x/y delta `0 px`.
- `git diff --check` — pass.

## Open issues / blockers

None.

## For next session

- Maintainer review on localhost or the next deployed preview can tune only subjective spacing; the Curator hierarchy, typography, animation and geometry contracts are now covered.

## References

- Existing project patterns: `src/app/styles/50-hub.css`, `src/app/styles/31-catalogue.css`, `src/app/styles/42-lex-primitives.css`, `src/app/styles/66-compendium.css`.
