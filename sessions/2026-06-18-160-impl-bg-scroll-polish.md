---
session: 2026-06-18-160
role: implementer
date: 2026-06-18
status: complete
slug: bg-scroll-polish
parent: 2026-06-03-121
links:
  - 2026-06-03-121
  - 2026-06-04-129
  - 2026-06-13-150
commits: []
---

# Background + Scroll Polish

## Summary

The shared Home/Archive/Compendium/Ask background was replaced with the new artwork as an optimized WebP, and the shared background credit now reads `phil kuenzler` with only the `phinklabs` link. Archive, Compendium and Ask now open with a full-viewport masthead and a `NEXT` cue that snaps into the actual working surface over a darker scrolled overlay.

## What I did

- `public/img/main-bg.webp` - regenerated from `C:/Users/Phil/Downloads/chrono_main_bg.jpg` with the existing sharp pattern: width 2400, WebP quality 78, effort 6.
- `src/lib/art-credits.ts` - changed the shared main/login artwork credit from `piwireddit` + PHINKLABS/REDDIT to `phil kuenzler` + `phinklabs`.
- `src/components/chrome/RouteScrollCue.tsx` - added a reusable non-Home `NEXT` scroll cue for one-act route heroes.
- `src/app/archive/page.tsx` - moved Archive onto `SiteBackground`, added the route snap/cue, increased scroll scrim strength, and changed the subtitle/readout to cover novels plus podcast episodes/shows.
- `src/app/compendium/layout.tsx` and `src/components/ask/AskClient.tsx` - added the route cue and snap targets for Compendium and Ask.
- `src/app/styles/31-catalogue.css`, `41-site-bg.css`, `50-hub.css`, `53-ask.css`, `66-compendium.css` - made the background fade stronger/higher, added the shared route snap/cue CSS, gave Archive/Compendium/Ask full-viewport mastheads with darker snapped content sections, and pulled the gold auspex HUD circles down into the lowered title zone.
- `src/app/page.tsx` - updated the first Home cue from "What can I do here?" to "Enter the archive" and the intro heading to "What lives in the archive?".
- `src/app/styles/68-login.css` - removed native input borders/outlines/box-shadows/autofill surfaces from the login fields.

## Decisions I made

- **Used a shared `RouteScrollCue` instead of reusing `HeroScrollCue` from `components/home`.** The visual grammar is the same, but Archive/Compendium/Ask are route chrome, not Home acts.
- **Archive now uses `SiteBackground`.** That keeps the new main artwork and credit path identical across Home/Archive/Compendium/Ask, instead of keeping Archive's former bespoke fixed photo layer.
- **Kept the Product board open.** This was a chat-briefed Product polish task under standing Board 121, not a one-shot Architect-Brief with `status: open` to flip.

## Verification

- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run brain:lint -- --no-write` - pass, 0 blocking findings, 16 existing warnings.
- Browser on `http://localhost:3000`:
  - Home: `main-bg.webp`, credit `phil kuenzler`, only `phinklabs`, cue `NEXT Enter the archive`.
  - Archive: cue `NEXT Search the archive`; after click `scrollY=720`, `.catalogue-body` `bodyTop=0`, scrim opacity `0.86`.
  - Compendium: cue `NEXT Open the registers`; after click `scrollY=720`, `.cmp-body` `bodyTop=0`, scrim opacity `0.88`.
  - Ask: cue `NEXT Begin the questionnaire`; after click `scrollY=720`, `.ask-console__grid` `bodyTop=0`, scrim opacity `0.86`.
  - HUD alignment follow-up: Home, Compendium and Ask auspex circles measured in the H1 zone after the title move; Archive uses the same updated catalogue sweep coordinates, but the in-app browser tab stayed in route loading during the final visual measurement while HTTP returned 200.
  - Login: `login.webp`, credit `phil kuenzler`, only `phinklabs`; focused/filled name input has `borderTopWidth=0px`, `boxShadow=none`, `outlineStyle=none`, transparent background.

## Open issues / blockers

None.

## For next session

- The old `.catalogue-hero__photo` / `.catalogue-hero__fade` CSS is now legacy-unused after Archive moved to `SiteBackground`; it can be deleted in a future CSS cleanup pass.

## References

- Board context: `sessions/2026-06-03-121-arch-product-board.md`.
- Prior credit/background mechanism: `sessions/2026-06-13-150-impl-polish-sweep.md`.
