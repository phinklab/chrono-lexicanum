---
session: 2026-07-13-214
role: implementer
date: 2026-07-13
status: complete
slug: curator-rework-legal-i18n
parent: none (direct maintainer design session, no architect brief)
links: []
commits: []
---

# The Curator — tool hierarchy, mobile faction path, loading repair and legal i18n

## Summary

`Ask the Archive` is now **The Curator**: the bare route first presents two restrained, Sternwarte-native paths and the selected tool then owns the page behind a compact switch. The faction path presents one selected faction, the full faction register and one answer separated by fading hairlines, the quiz rail is geometrically exact down to 320 px, duplicate loaders are suppressed, and Imprint/Privacy are English-first documents with a stateless `?lang=de` switch.

## What I did

- `src/app/ask/page.tsx`, `src/components/ask/AskClient.tsx`, `src/components/ask/AskToolTabs.tsx`, `src/app/styles/53-ask.css` — renamed the public tool to The Curator, introduced the bare-route path chooser, collapsed the chosen state to a compact Questions/Faction switch, removed snap and redundant ambient/readout collisions, and made mobile spacing safe-area aware.
- `src/app/ask/faction/[[...segments]]/page.tsx`, `src/components/ask/FactionCarousel.tsx`, `src/components/ask/FactionPickPanel.tsx`, `src/app/styles/54-ask-faction.css` — replaced the 18-name word cloud and false I/II/III sequence with a naked faction stepper, an always-visible ordered register, optional chapter choices and one answer; fading hairlines now separate the transparent sections, while focus and coarse-pointer targets stay stable.
- `src/app/styles/58-ask-booklist.css` — rebuilt the quiz rail on equal grid columns, anchored both rail endpoints to the outer dot centres, made every stop button fill its track cell, and aligned the gold fill exactly to the current dot at 320/390/1280 px.
- `src/app/styles/70-route-progress.css` — when an intercepted detail modal skeleton is present, hides the competing full-route cogitator while preserving its layout spacer, preventing the overlapping loading states from the supplied screenshot.
- `src/app/imprint/page.tsx`, `src/app/privacy/page.tsx`, `src/components/legal/LegalLanguageToggle.tsx`, `src/app/styles/71-legal.css` — added complete English legal documents as the default, retained the German originals behind `?lang=de`, localized metadata and document language, and added a frameless URL-driven language switch with no cookie or local storage.
- `src/components/chrome/{ArchiveFooter,SiteLegal,SiteMenu,SiteNav}.tsx`, `src/app/login/page.tsx`, `src/components/home/HomeExplore.tsx`, `src/app/page.tsx` — changed the public navigation vocabulary to Curator, Imprint and Privacy and marked the always-English footer/legal chrome with the correct language.
- `e2e/smoke-static.spec.ts`, `e2e/smoke-interactions.spec.ts` — pinned the Curator landing/selected hierarchy, visible 18-faction register, active-control focus retention, unsnapped route, one-pick answer, dot-centred progress at both launch widths, and English-default/URL-based legal language behavior.

## Decisions I made

- **Kept `/ask` and `/ask/faction` as the stable URLs** while changing the public name to The Curator. Renaming route contracts would add redirects, canonical and deep-link risk without improving the approved UI.
- **Used `/ask` as the threshold and `?mode=profile` as the explicit zero-answer quiz state.** Existing answer deep links still enter the quiz directly; Reset remains in the quiz instead of unexpectedly throwing the reader back to the picker.
- **Used space, typography, Sternwarte dots and horizontally fading hairlines instead of cards, filled panels or bordered selectors.** This follows the frontend-design skill and preserves the site's established visual grammar.
- **Kept the full faction roster permanently visible as a two-column mobile and three-column desktop register.** Every faction is recognizable and directly reachable at a glance without returning to the original free-form word cloud.
- **Scoped Left/Right faction cycling to the faction stepper.** Chapter and roster controls no longer accidentally change factions; selecting from the register keeps it visible and retains focus on the active faction.
- **Used `?lang=de` as the entire legal language state.** English is canonical/default, German is linkable, and no site-wide locale layer, cookie or browser storage was added.
- **Kept global legal labels in English even inside German documents.** The footer carries `lang="en"`; the German document content remains correctly scoped with `lang="de"`.
- **Used CSS `:has()` for the loading collision.** The modal fallback is the authoritative wait state; visibility suppression removes only the duplicate cogitator and leaves the existing jump-proof route spacer intact.

## Verification

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings; 21 pre-existing warnings.
- `npm run test:ask-questions` — pass, 10/10.
- `SITE_URL=https://example.invalid npm run build` — pass; 1,293 static pages generated. The existing Turbopack whole-project NFT tracing warning remains unchanged.
- Focused Playwright production runs — all requested cases reported `ok`: Curator progress/hierarchy at 320 and 1280 px, the final always-visible faction register at 320 and 1280 px, and Legal EN/DE switching. The final register cases completed in 461 ms and 425 ms; the Windows runner hit its 180 s shell timeout only while stopping the two already-finished Next test servers, matching the established harness behavior.
- In-app browser QA — `/ask`, `/ask?mode=profile`, `/ask/faction`, `/imprint` and `/imprint?lang=de` at 320, 390 and 1,440 px; verified no route snap, visible 18-faction register, transparent answer/alternative sections with fading hairlines, one-row compact switch, stable focus, safe-area clearance and English-default legal metadata/content.
- Browser geometry — at 320 px all progress centres were exact: outer rail deltas `0 px`, active-fill delta `0 px`; at 390 px the same deltas were `0 px`.
- `git diff --check` — pass.

## Open issues / blockers

No implementation blocker. The existing Playwright Windows web-server cleanup can keep the shell alive after all cases finish; reporter output and individual results are complete and green.

## For next session

- Maintainer visual review on the deployed preview can now tune copy density or spacing without another structural pass; the hierarchy and regression contracts are in place.
- If German should later persist when leaving a legal document through global chrome, add deliberate query propagation; this session intentionally keeps English as the global default and stores no locale state.

## References

- German Digital Services Act, § 5 DDG: https://www.gesetze-im-internet.de/ddg/__5.html
- GDPR, Regulation (EU) 2016/679: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679
- TDDDG, § 25: https://www.gesetze-im-internet.de/ttdsg/BJNR198210021.html
- Vercel Web Analytics privacy documentation: https://vercel.com/docs/analytics/privacy-policy
