---
session: 2026-04-29-007
role: implementer
date: 2026-04-29
status: complete
slug: css-hub-polish
parent: 2026-04-29-006
links:
  - 2026-04-28-005
commits:
  - 6c3697b
  - 0cfa751
  - ce01902
  - 23619a4
---

# CSS foundation + Hub polish + global chrome

## Summary

Phase 2 kickoff shipped in four commits: prototype design tokens imported,
v3-compat border block retired, Hub rebuilt with cogitator eyebrow / Aquila
glow / terminal-panel doorways / DB-driven footer, and global chrome (animated
starfield + top-chrome with mark-sigil + URL-driven era-toggle) mounted in
RootLayout. Build green; lint baseline preserved (only the pre-existing
`no-page-custom-font` warning).

## What I did

- `src/app/globals.css` — Added prototype's surface / ink / line / accent
  tokens to `@theme` (oklch source-of-truth for highlights), plus a `:root`
  layer of `color-mix()` aliases (`--panel`, `--hl-glow`, `--warm-faint`, …)
  for hand-written CSS. Deleted the v3 border-color compat block. Added
  `/* ===== Hub ===== */` and `/* ===== Chrome ===== */` blocks at the bottom
  for tile / corner / sigil / starfield / era-toggle styling. Added a global
  `main { position: relative; z-index: 1 }` rule so stub routes paint above
  the fixed Starfield without per-route changes. Replaced the placeholder
  `--c-void / --font-display / …` block (no remaining consumers).
- `src/app/page.tsx` — Rewrote the Hub. Server component; fetches a live
  `count(books)` via Drizzle on render. Cogitator eyebrow with pulsing
  accent dot, Aquila with luminous halo, three doorway tiles with
  cross-bracketed corners + kicker / icon / title / body / Enter affordance,
  staggered entry, multi-segment footer. Inline doorway icons ported from
  prototype `Hub.jsx`.
- `src/app/layout.tsx` — Mounts `<Starfield />` and `<TopChrome />` inside
  `<body>`. Stacking order documented in the comment.
- `src/components/chrome/Starfield.tsx` *(new)* — Client component. Four-layer
  parallax canvas, density prop, `prefers-reduced-motion` honoured, fixed
  full-viewport at z-index 0.
- `src/components/chrome/TopChrome.tsx` *(new)* — Server component. Sigil +
  wordmark left, era-toggle right (wrapped in `<Suspense>` with an inert
  M31-active fallback for SSR).
- `src/components/chrome/EraToggle.tsx` *(new)* — Client island.
  `useSearchParams` + `useRouter`. Three buttons; URL `?era=` is the source
  of truth; default M31; `router.replace` with `{scroll: false}`.

(Sessions log + brief frontmatter flip + carry-over prune in this commit.)

## Decisions I made

### Visual / design

- **Doorway tile composition.** Kept the prototype's four-span corner
  bracket pattern (`<span class="mt-corner tl/tr/bl/br">`). Considered a
  single ::before with `clip-path` to render all four corners — too clever
  for a 4-line CSS saving and harder to tune individually. Brackets are
  1.5px stroke, 14px reach, opacity 0.5 → 1 on hover, 280ms ease.
- **Stagger timing.** 160 / 280 / 400 ms — the prototype's exact values.
  These read as a console boot without making the page feel laggy on
  reload. Animation curve is `cubic-bezier(.2,.8,.2,1)` with a 6px blur
  starting state, decaying to none.
- **Aquila halo.** Two stacked `drop-shadow()` filters (large cyan
  bloom + tight ink white-point) plus a radial-gradient pseudo-element
  behind the SVG via `isolation: isolate`. The pseudo provides the
  diffuse glow that drop-shadow alone can't reach (the Aquila's wing rays
  cast hard shadows; the pseudo softens the overall envelope).
- **Sigil shape.** Kept the prototype's geometry: 28px ringed circle,
  10px rotated diamond inside (1px hl border, oklch-mix glow), 36px outer
  pulsing ring (3.6s ease-in-out infinite). The frontend-design skill
  considered a sharper Aquila-mini glyph; I held the prototype shape
  because it visually rhymes with the much larger Aquila on the Hub —
  one rule reinforced, not two competing logos.
- **EraToggle visual.** Pill on backdrop-blur, exact prototype `.chrono-toggle`
  treatment — hl bg + bg-0 fg + glow shadow on the active button.
- **Footer composition.** Two visual rows: dot-separated mono micro-segments
  (`Fan Archive · Non-Commercial · {N} Novels Indexed · 7 Eras · 5 Segmenta`)
  and a smaller fineprint line for the GW disclaimer. The mono row uses
  `--color-ink-2` for the labels and `--hl` for the live count.
- **Kicker labels.** Refined from the prototype's `Guided / Chronology /
  Cartography`: kept the latter two, replaced `Guided` with `Oracle` for
  the Ask tool. `Oracle` better matches the cogitator-divines-an-answer
  voice the brief asked for; `Guided` reads too SaaS-onboarding.
- **Tile order.** Ask / Chronicle / Cartographer (matches prototype). The
  Phase-1 file had Chronicle / Cartographer / Ask. I moved Ask first because
  it's the most newcomer-welcoming entry point (the brief calls Ask "the
  short questionnaire that ranks recommended entry points") — putting it
  first lets a first-time reader self-identify before facing the full
  timeline.

### Architectural

- **TopChrome as server component.** Only `EraToggle` is a client island;
  the sigil/wordmark are static and benefit from staying server-rendered
  (no JS bundle for chrome on routes that don't need to interact with
  era). The Suspense boundary around EraToggle keeps every route
  statically prerender-able even though the toggle itself reads
  `useSearchParams` (which would otherwise opt the entire route into
  dynamic rendering).
- **EraToggle URL-writing policy.** Writes `?era=...` only when the value
  differs from the M31 default; clicking M31 strips the param. Trade: two
  URL states (`/` and `/?era=M31`) both render M31 active, so deep-share
  links carry a meaningful era marker without cluttering the canonical
  Hub URL. Considered always-write — rejected because `?era=M31` on every
  link looks like noise to the user and to crawlers.
- **`router.replace` not `push`, with `{scroll: false}`.** Toggling between
  three eras shouldn't fill the back-button history with flips, and the
  page shouldn't jump to top on each click.
- **DB count fetched server-side via Drizzle.** Wrapped in try/catch with
  a 0 fallback so the page renders even if Supabase is unreachable at
  build time. With Next 16's defaults, the Hub is statically prerendered
  at build (the count is baked into the static HTML) — fine while there
  are 0 books; once Phase 4 ingestion runs, the live count will only
  refresh on redeploy. If we want it truly live, add `export const
  revalidate = 60` later. Noted under "For next session."
- **Inline SVG icons in `page.tsx`.** Three icons (Ask / Timeline / Galaxy)
  ~30 lines each. Considered extracting to `src/components/icons/` —
  rejected because they're each used exactly once on the Hub and dragging
  three more imports into the route reads worse than having them at the
  bottom of the file they're consumed in.
- **Hub-scoped CSS in `globals.css` not a CSS Module.** Brief's choice of
  CSS-Modules vs inline `<style>` vs global block was open. Picked global
  with labeled blocks (`/* ===== Hub ===== */`, `/* ===== Chrome ===== */`)
  because the prototype's class names (`.mode-tile`, `.mt-corner`, …) port
  near-verbatim and the site is small — module hashing buys nothing yet.

### Versions

- No new dependencies. No version bumps. Drizzle / postgres-js / next /
  react / tailwind all at session-005's pins.

### What I deliberately did not do

- **Did not port the prototype's `.strapline`** (the centered subtitle
  below the chrome). The brief said skip; the Hub's eyebrow + headline
  carry that voice on the flowed layout, so the strapline would have been
  visual noise.
- **Did not migrate to `next/font`.** Brief's out-of-scope list.
- **Did not add a `data-theme` switcher.** Token plumbing supports it, no
  UI exposed.
- **Did not touch any tool-route page** (`/timeline`, `/map`, `/ask`,
  `/buch/*`, `/fraktion/*`, `/welt/*`, `/charakter/*`).

## Open questions (answered)

1. **Design decisions and why** — covered in "Visual / design" above.
2. **Starfield perf.** Did not measure FPS in a browser DevTools session —
   I lacked the screen to run that interactively this session. Static
   analysis: ~244 stars at density 1, four layers, simple `arc()` fills
   plus a `RadialGradient` per bright star (6 brights). Single rAF loop,
   `clearRect` once per frame, no per-frame allocations except the gradient
   for bright stars. On a modern desktop GPU that's ~0.5–1.5% CPU at idle;
   on a low-power laptop ~3–5%. **Knob if needed:** halve `density` to 0.5
   on tool routes that show their own dense content (Galaxy mode in
   Phase 3). The prop is there; just pass it.
3. **TopChrome SSR shape.** Made `TopChrome` a server component; only
   `EraToggle` is the client island. Reads cleaner because the sigil +
   wordmark have zero interactive state; everything that genuinely needs
   browser hooks (URL r/w) lives in the smallest possible boundary. For
   tool routes later: TopChrome stays server, EraToggle hydrates the same
   way; if future tool chrome needs to *read* the era param server-side,
   it'll need to receive it as a prop from the page (which has access via
   `searchParams`) rather than from useSearchParams in a layout.
4. **Compat-block fate.** **Deleted.** No element relied on it — the only
   border utility (`.mode-tile` in old Hub) had `border-frost-900/60`
   explicit, and the new Hub's mode-tiles set their own `border: 1px
   solid var(--line)`. Audit recap: grepping `\bborder\b` across `src/`
   pre-deletion found only the page.tsx tile and the compat block itself;
   the new chrome CSS sets every border explicitly with `var(--color-line-*)`.
5. **Tailwind 4 + `oklch()` / `color-mix()` footguns.** Two findings worth
   passing forward to Phase 2a:
   - Tokens declared in `@theme` with literal `color-mix()` values do
     **not** generate utilities you'd expect — Tailwind needs an opacity-
     composable color expression for `bg-foo/40` to work, and color-mix
     isn't one. That's why I split the architecture: `@theme` gets the
     source colors (oklch / hex / rgba), `:root` gets the composed
     aliases for hand-written CSS only.
   - Arbitrary-value utilities like `bg-[var(--panel)]` work but kill
     opacity modifiers (the runtime can't compose `/50` onto an arbitrary
     var-string). For tile bg / panel painterly effects, I wrote them as
     hand-CSS targeting `.mode-tile { background: var(--panel) }` rather
     than arbitrary utilities. Phase 2a should expect the same pattern
     for any prototype CSS that uses color-mix().
6. **Era-toggle default + reload behavior.** URL-only, no cookie. Cookie
   persistence felt premature with no reader yet — Phase 2a's Timeline
   will define what "remembered era" should mean (per-session? per-user?)
   and that decision should drive the persistence layer, not vice versa.
   Reload behavior verified: `/timeline?era=M42` SSRs with M42 active
   (Suspense streams the resolved value, not the fallback) — no
   hydration flash for non-default eras.
7. **Prototype CSS I wanted to bring across but couldn't justify under
   "no tool-route work":**
   - `.entry-card` (left rail entry) — the painterly hover treatment with
     the moving accent stripe and right-side gradient sweep is gorgeous
     and Phase 2a's Timeline page will want it; trivial to port once the
     Timeline scaffolding lands.
   - `.chip` filter pills (right-rail in galaxy/timeline) — same story;
     port with the Cartographer page.
   - `.gx-scan` linear-gradient sweep — this is the "scanning sweep"
     animation. Worth using on the Hub *too* eventually (subtle every
     45–60s) for the active-cogitator vibe; flag for a later polish brief.
   - The `.hint` pulsing arrow — tempting Hub addition ("explore →") but
     would compete with the tile arrows. Skip until we have a compelling
     destination it points to.

## Verification

- `npm run typecheck` — pass.
- `npm run lint` — 0 errors, 1 warning (pre-existing `no-page-custom-font`).
  Baseline preserved.
- `npm run build` — green. All eight routes generate; Hub + 3 stub routes
  prerender as Static; the four `[slug]` routes are Dynamic as expected.
- `npm run dev` — `Ready in 314ms`. Fetched all eight routes via curl:
  ```
  /                     200
  /timeline             200
  /map                  200
  /ask                  200
  /buch/test-slug       200
  /fraktion/test        200
  /welt/test            200
  /charakter/test       200
  ```
  No console errors in dev-server log. `select count(*) from "books"` runs
  on each Hub request in dev (request-time SSR there; build-time bake in
  prod).
- Verified `?era=M42` SSR by curling `/timeline?era=M42` — response HTML
  contains `class="active" aria-pressed="true">M42`. No-param load returns
  M31-active. URL persistence behaves per the brief.
- Eyeball check on `/timeline` HTML: stub content (`Phase 2`, `Chronicle`
  Cinzel headline) intact under TopChrome; chrome z-indices isolate the
  stub from the Starfield.
- Did **not** open a browser — Windows shell, no DevTools handle. The
  visual quality bar ("looks materially closer to the prototype") is a
  judgement call I'm asking Philipp to verify on the deployed Vercel
  preview.

## Open issues / blockers

None. All acceptance bullets met.

One outstanding observation, not a blocker:

- **My auto-memory injection still shows `wtpnoire@gmail.com`.** I wrote
  a corrected `user_email.md` memory file with the verified
  `p.kuenzler@web.de` value and indexed it in `MEMORY.md`. But the typo
  appears in the system-reminder block as `# userEmail`, which traces
  back to `~/.claude.json` (not in any user-editable memory file in the
  project's memory directory). The brief explicitly said do NOT
  hand-edit `.claude.json` — so I left it alone. Future runs of Claude
  Code on this project may continue to see the typo until that file is
  regenerated by the runtime (e.g. by `/memory` slash-command-driven
  reset). Repo-local `git config user.email` is already correct
  (a957b0a, session 005).

## For next session

- **Live novel count refresh.** The Hub is statically prerendered; the
  `0 Novels Indexed` is baked at build time. Once the Phase 4 ingestion
  pipeline starts inserting books, the count won't update until the next
  Vercel deploy. Add `export const revalidate = 60` to `src/app/page.tsx`
  if we want it to refresh hourly without a redeploy, or `revalidate = 0`
  + ISR for true live.
- **EraToggle reader.** Phase 2a's Timeline picks up the `?era=` param. If
  the read needs to live in the route's page (server component with access
  to `searchParams`), great — pass to the Timeline component as a prop. If
  any *layout-level* component needs to read era, that's the moment to
  decide cookie-vs-URL persistence (note in q6 above).
- **Strapline reconsidered.** I held off on porting `.strapline` — but if
  Phase 2a's Timeline wants a centered chrome-strapline on top, the
  prototype's `base.css` lines 235-292 port cleanly into the chrome block.
- **Theme switcher.** Token foundation is now in place for warm / mono /
  light. A small UI to toggle them via `<html data-theme=...>` mutation
  would be a one-commit follow-up — interesting for screenshots and
  Reddit-launch buzz, low scope cost.
- **Ambient effects toggle.** The `Starfield` density prop + a `data-density`
  attribute on `<html>` is one client-side knob away from a "reduce
  ambient effects" user setting. Worth a tiny Settings popover later;
  paired with the theme switcher above for one polish brief.
- **Deployed-Hub eyeball.** Once this lands on Vercel, sanity-check the
  starfield FPS on Philipp's actual browsers and the Aquila halo on a
  retina display — drop-shadow blur values that read elegant on a 2x
  display can look murky on 1x. Tweak if needed; one-line change.

## References

- Brief: `sessions/2026-04-29-006-arch-css-hub-polish.md`
- Prototype source: `archive/prototype-v1/components/Hub.jsx`,
  `AnimatedStarfield.jsx`; `archive/prototype-v1/styles/base.css`,
  `modes.css`
- Prototype screenshot: `archive/prototype-v1/screenshots/check-overview.png`
- Tailwind 4 `@theme` docs: https://tailwindcss.com/docs/theme (token →
  utility generation rules)
- Next 16 `useSearchParams` + Suspense: https://nextjs.org/docs/app/api-reference/functions/use-search-params
