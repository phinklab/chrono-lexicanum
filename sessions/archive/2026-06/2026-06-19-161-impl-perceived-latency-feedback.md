---
session: 2026-06-19-161
role: implementer
date: 2026-06-19
status: complete
slug: perceived-latency-feedback
parent: 2026-06-03-121
links:
  - 2026-06-03-121
commits: []
---

# Perceived-Latency: server-bound navigation made visible

## Summary

Every server-/DB-hitting navigation now signals immediately instead of sitting
dead until the target paints: the three search consoles + the in-modal hops
navigate through one shared `useTransition`, which drives a global gold beam
(click→stream) while reused `loading.tsx` boundaries cover the gap that follows
(stream→paint). No latency was touched — only its visibility — and the wait is
anti-flash-gated so instant/cached navigations show nothing.

## What I did

**Layer 1 — the shared mechanic (the reusable backbone):**
- `src/components/chrono/RouteProgress.tsx` — new. `NavProgressProvider` owns one
  `useTransition`; exposes `useRouteNav()` → `{navigate, replace}` and
  `useRouteNavState()` → `{isPending, pendingVisible}` over **two** contexts.
  Renders the global `RouteProgressBar` (gold hairline beam, top edge).
- `src/app/layout.tsx` — wrapped `{children}` + `{modal}` in `<NavProgressProvider>`
  (server pages stay server components; the provider's children are server-rendered
  props).
- `src/components/home/HomeSearch.tsx`, `src/components/podcast/PodcastsSearch.tsx`
  — picks navigate through `navigate()`; pass `pendingVisible` → `BrowseSearch`.
- `src/components/browse/BrowseSearch.tsx` — new optional `pending` prop → form
  `aria-busy` + `browse-search--pending` (tints/spins the always-present auspex
  reticle).
- `src/components/shared/DetailModal.tsx` — in-panel hops use `navigate()`/`replace()`;
  `router.back()` (close) untouched.
- `src/app/styles/70-route-progress.css` — new. Beam (sweep + reduced-motion static),
  inline reticle pending, modal-skeleton body sizing. `@import` added to `globals.css`.

**Layer 2 — loading boundaries (audit gaps filled):**
- `src/app/loading.tsx` — new root catch-all fallback (reuses `CogitatorLoading`):
  one file covers home + the four entity full-pages (charakter/welt/fraktion/person)
  + `/archive/podcasts(+[slug])` + `buch/[slug]/audit`.
- `src/app/@modal/loading.tsx` + `src/components/shared/DetailModalSkeleton.tsx` —
  new. Overlay-shaped skeleton reusing the real `detail-modal-*` chrome + the compact
  `.lx-cog`; inert (no focus-trap/inert/scroll-lock) so the live modal's open effects
  run exactly once.

## Decisions I made

- **One root `app/loading.tsx` as a catch-all, not seven per-route files.** Home is
  the root segment page, so its `loading.tsx` *is* the tree-wide fallback for every
  boundary-less child — covering the whole audit gap set at once. Routes with their
  own boundary keep it; static routes (login, /lab/*) never suspend, so never paint
  it. DRY and inherently "shows only on a real wait."
- **Two contexts (actions vs state).** `navigate`/`replace` are identity-stable, so a
  component that only navigates never re-renders on a pending toggle; only the few
  bits rendering a pending affordance subscribe to state.
- **`pendingVisible` gated ~120ms behind raw `isPending`.** This is the no-flash
  guarantee — a nav that commits faster reveals nothing. `aria-busy` follows the gated
  signal too, so sub-threshold navs don't churn the live region. The reveal lives in a
  timer and the reset in the effect cleanup, to satisfy `react-hooks/set-state-in-effect`
  (no synchronous setState in an effect body).
- **The auspex reticle is the inline indicator.** `<BrowseSearch>` renders the sigil
  unconditionally in every skin (Home/Podcasts/Archive), so tinting+spinning it is one
  skin-agnostic affordance rather than three bespoke ones.
- **Scope per the maintainer:** Layer 1 wired into the three search consoles **+**
  `DetailModal`'s in-panel hops (covers the headline Primarch flow end-to-end).
  `WerkeFilters` / `CompendiumControls` / `RegionSwitcher` are left as one-line
  inheritors (swap `router.push/replace` → `useRouteNav().navigate/replace`).
- **`@modal/loading.tsx` is safe for the initial open; the in-modal hop is belt-and-
  suspenders.** A soft-nav into the slot (from `null`) shows the skeleton — pure gain.
  An entity↔entity hop runs in a transition over an already-committed boundary, so React
  holds the open panel rather than flashing the skeleton; Layer 1's beam signals that hop
  regardless. Confirmed visually by the maintainer (no flicker).
- **Reused, not rebuilt:** `CogitatorLoading`, `.lx-cog`, the `detail-modal-*` chrome,
  the `--cl-gold` token, `useReducedMotion`, and the `AskClient` transition pattern.
- **Built a throwaway `/lab/loading` demo to settle the look in-browser, then deleted
  it** (maintainer approved the beam/reticle/skeleton with motion).

## Verification

- `npx tsc --noEmit` — pass.
- `npm run lint` — pass (after fixing the one `set-state-in-effect` finding).
- Clean dev server (`rm -rf .next` + `npm run dev`, single instance) — `GET / 200`,
  Next 16.2.9 / Turbopack, ready in 349ms.
- Manual (maintainer eyeballed in browser): global beam, inline reticle pending, and
  the modal skeleton all approved, with motion (reduced-motion static fallback retained
  for the OS preference). No skeleton flicker on the in-modal hop.

## Open issues / blockers

None.

## For next session — slow paths this visibility honestly exposed

The point of making the wait legible is that the worst waits are now obvious. Candidates
for a **latency-reduction** brief (explicitly out of scope here — nothing was optimized):

- **Home cold-fill ~3.3s** (measured: `GET / 200 in 3.3s`, application-code 1966ms) — four
  parallel loaders (browse books, podcast index, compendium suggestions, primarch
  suggestions) on the gateway route.
- **Compendium → modal double-hop** (the Primarch pick) — two sequential server
  round-trips (category directory, then the `@modal` entity intercept). The beam +
  cogitator + skeleton now narrate it, but it's two cold fetches back to back.
- **`/archive/podcasts`** — a five-loader shell (index + books + podcasts + compendium +
  primarchs) with no caching headroom on first paint.
- **`buch/[slug]/audit`** — nine parallel DB queries (admin-only, but the heaviest
  single fan-out in the app).

Smaller follow-ups:
- One-line adoption of the shared hook by `WerkeFilters`, `CompendiumControls`,
  `RegionSwitcher` (filter-in-place + region switches would then light the beam too).
- Optional route-shaped skeletons (currently every full-page gap reuses the generic
  cogitator — consistent, but an entity/podcast-shaped skeleton would read closer to the
  destination).

## References

- Board context: `sessions/2026-06-03-121-arch-product-board.md`.
- Transition reference already in-tree: `src/components/ask/AskClient.tsx`.
