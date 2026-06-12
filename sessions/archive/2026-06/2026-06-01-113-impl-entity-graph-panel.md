---
session: 2026-06-01-113
role: implementer
date: 2026-06-02
status: complete
slug: entity-graph-panel
parent: 2026-06-01-113
links: ["2026-06-01-109"]
commits:
  - 237043f
  - 6a18553
---

# Entity-Graph Step 2 — EntityView-Redesign + In-Context-Panel

## Summary

Both phases of Brief 113 shipped on one branch (`codex/product-entity-graph-panel`),
one PR. **Phase A** reworked the shared `EntityView` into a header meta-line +
work cards + a right CONNECTIONS rail that reflows under the main column via a
CSS container query, over a gradient-to-dark scrim. **Phase B** added a root
`@modal` parallel slot with `(.)`-intercepts so an in-app soft-nav to any entity
URL opens that redesigned hub as a right side-sheet overlay — **zero fork**: the
intercept is a Server Component calling the same `loadEntity` and rendering the
same db-free `<EntityView>`, only the overlay shell is `'use client'`. The one
fact worth flagging: the panel's single-column reflow is bought entirely by
Phase A's container query (the drawer is < 880px wide), so Phase B added no
layout code — exactly the seam the 109 note set up.

## What I did

### Phase A — EntityView redesign (commit `237043f`)

- `src/lib/entity/types.ts` — added `TYPE_TO_ATLAS` (entity type → its `/atlas`
  inventory deck + English label) for the page-frame breadcrumb. Pure/db-free.
- `src/components/entity/EntityView.tsx` — split `data.facts` by label into a
  header meta set (`META_FACT_LABELS`) and the dossier remainder, so a hoisted
  fact never renders twice; wrapped the body in a `--railed` grid that only
  claims a rail column when `crossLinks.length > 0`.
- `src/components/entity/EntityHeader.tsx` — added the 1–3-fact meta-line under
  the `<h1>` (string facts as text, `EntityRef` facts as links). Still db-free.
- `src/components/entity/RelatedWorks.tsx` — works rendered as cards per kind
  group (`// Books (n)`), books link, non-book kinds inert.
- `src/components/entity/CrossLinkRail.tsx` — `<section>` → `<aside>` "CONNECTIONS"
  rail with a `→ linked` footnote.
- `src/components/entity/EntityBackLink.tsx` (new) — the "‹ Characters/Factions/
  Worlds" breadcrumb. Deliberately a **page-frame** component, not part of
  `EntityView`, so the Phase-B panel does not render it.
- `src/app/{charakter,fraktion,welt}/[slug]/page.tsx` — wrapped the view in
  `.entity__inner` + `<EntityBackLink>`.
- `src/app/styles/59-entity.css` — full layout rework: full-bleed `main.entity`
  with a two-linear gradient-to-dark scrim (`::before`), `.entity-view` as a
  query container, the `@container (min-width: 880px)` two-column grid, work-card
  grid, and a reduced-motion guard for the hover transforms.

### Phase B — in-context panel (commit `6a18553`)

- `src/app/@modal/default.tsx` — slot fallback, `null` (hard-nav / unmatched).
- `src/app/@modal/[...catchAll]/page.tsx` — slot reset, `null` (soft-nav to a
  non-intercepted route clears a stale panel; see Decisions).
- `src/app/@modal/(.)charakter/[slug]/page.tsx`, `(.)fraktion/…`, `(.)welt/…` —
  the three intercept Server Components: `await params` → `loadEntity(type, slug)`
  → `notFound()` if null → `<EntityPanel><EntityView/></EntityPanel>`.
- `src/components/entity/EntityPanel.tsx` (new) — the only `'use client'` piece:
  backdrop + side-sheet dialog, focus trap, Escape/backdrop/button close via
  `router.back()`, focus capture+restore, body scroll-lock, capture-phase click
  delegation that rewrites in-panel entity links to `router.replace`, and an
  "Open full page ↗" hard-nav affordance.
- `src/app/layout.tsx` — `RootLayout` gains the `modal` slot, rendered between
  `{children}` and `<MediaPlayer />`.
- `src/app/styles/60-entity-panel.css` (new) — overlay chrome only (backdrop
  gradient + blur, drawer, top bar, close, slide-in). The body styles are reused
  from `59-entity.css` unchanged.
- `src/app/globals.css` — `@import './styles/60-entity-panel.css';` in slot.

## Decisions I made

- **Side-sheet drawer (620px), not a centered modal.** Two reasons: it reads as
  "drill into a connected entity without losing your place" (distinct from the
  centered `DetailPanel` on /timeline), and at < 880px it triggers Phase A's
  container-query reflow for free, so the rail stacks with zero Phase-B layout
  work — the explicit 109 seam.
- **Slot reset = `default.tsx` (null) + `[...catchAll]/page.tsx` (null).** Next
  keeps a parallel slot's last active state across *soft* navigation when no
  segment matches — so without the catch-all, an open panel lingers over a
  `/buch/[slug]` page after an in-panel book link is clicked. The low-priority
  catch-all gives every non-intercepted route a matching slot segment that
  renders nothing; the `(.)`-intercepts outrank it for entity routes. `default.tsx`
  alone covers only hard-nav/unmatched. This is the brief's named outcome
  (line 74), the catch-all is the mechanism.
- **In-panel hops = `router.replace` via capture-phase delegation; close =
  `router.back()`.** A click on an entity link *inside* the panel is rewritten
  to replace-nav by an `onClickCapture` handler on the shell — it runs before
  Next's `<Link>` onClick and marks the event `defaultPrevented`, so Next skips
  its push and I navigate with replace. Result: in-panel hops never stack
  history, so one `back()` always closes to the context that was under the panel
  (the brief's flat-panel + close contract). Book/external links and
  modified-clicks (cmd/ctrl/shift → new tab) pass through untouched.
- **`router.back()` is correct here, unlike `DetailPanel`.** `DetailPanel`
  rejected `back()` because its modal could *be* the landing URL (a shared
  `?book=` link), making history ambiguous. An intercepting-route panel can
  never be the landing URL — a hard load renders the full page, the panel only
  exists after an in-app push — so the previous history entry is always the
  in-app origin. `back()` is the idiomatic, safe close.
- **Included an "Open full page ↗" affordance** (brief open question, my call:
  include). It's a plain `<a data-entity-hardnav>` the delegation skips, so it
  hard-navigates to the canonical SSG page — useful for share/SEO and a clean
  escape hatch from the overlay.
- **A11y reuses the `DetailPanel` recipe** (brief: "wo es passt, wiederverwenden")
  — focus trap (Tab + Shift-Tab), initial focus on close, Escape, focus restore,
  scroll-lock, `role=dialog` + `aria-modal` + a visually-hidden label. Background
  inertness is achieved the house way (focus trap + scroll-lock + pointer-catching
  backdrop) rather than the `inert` attribute, because the underlying content
  lives in a sibling slot the panel can't reach across.
- **`prefers-reduced-motion`: no local block.** The global cascade in
  `10-base.css` collapses every animation/transition to 0.001ms !important, so
  the drawer slide + backdrop fade resolve to instant — same rationale
  `24-detail-modal.css` documents.
- **English/Latin copy throughout** (DOSSIER / RELATED WORKS / CONNECTIONS, and
  the breadcrumb "Characters/Factions/Worlds"), not the mockup's German strings.
  The shipped family (/buch, the 109 hubs) and the atlas decks themselves are
  English-labelled; the mockup German was a structure north-star, not copy.
- **Next 16.2.4 / React 19.2.5** (brief said "15"; repo pin wins per version
  policy). The `@modal` slot types the root layout via the generated
  `LayoutProps`; a `tsc` run against a stale `.next/types` validator errors until
  a build regenerates it (see Verification).

## Verification

- `npm run lint` (`eslint .`) — **pass.**
- `npm run typecheck` (`tsc --noEmit`) — **pass**, after a build. The first run
  errored: the committed-state `.next/types/validator.ts` predated the `@modal`
  slot, so `LayoutProps<"/">` lacked `modal`. `next build` regenerates the slot
  types; the re-run is clean. (`.next/` is gitignored — CI regenerates it.)
- `npm run build` — **pass.** Route table:
  - `● /charakter/[slug]` (490), `● /fraktion/[slug]` (202), `● /welt/[slug]`
    (289) — still **SSG** (Phase A + B acceptance).
  - `ƒ /(.)charakter/[slug]`, `ƒ /(.)fraktion/[slug]`, `ƒ /(.)welt/[slug]`,
    `ƒ /[...catchAll]` — intercepts + reset correctly **dynamic** (soft-nav only).
  - No existing route broke (/, /ask, /atlas, /buch, /buecher, /timeline, /map
    all built).
- `git grep` invariants:
  - `loadEntity` called from all three intercepts; `<EntityView>` imported
    unchanged in all three — **no second data path, no view fork.**
  - The only real `'use client'` directive is `EntityPanel.tsx` (the `@modal`
    matches are prose in doc comments).
  - The only real `<h1>` element is `EntityHeader.tsx:31`; `EntityView` and its
    section modules import nothing from `@/db` / server-only / the loader.
- Wiring confirmed by source: `AtlasInventoryTable` renders `<Link href={row.href}>`
  to `/charakter|fraktion|welt/${id}` (soft-nav → interceptable), so the
  `/atlas/{charaktere,fraktionen,welten}` rows feed the root slot. The hub rails
  + fact-links do too. `/buch` + `/buecher` carry no entity links today.

## Open issues / blockers

- **No headless visual / interaction pass** (no browser/Playwright in this repo,
  as in Step 1). Structure, compile, and route classification are verified; the
  interaction-heavy acceptance items — soft-nav opens the overlay, slot-reset on a
  `/buch` link, the A→B close contract, focus trap/restore under AT — are
  by-construction + build. The live pass at **desktop + ≤720px** for the redesigned
  hubs *and* the panel is the maintainer's to do.
- **Focus-restore edge (documented, untested by acceptance):** after a *cross-type*
  in-panel hop (e.g. faction → character) then close, focus restores to the
  last-captured trigger rather than the page element that first opened the panel.
  The common open→Escape (no hop) path is correct. Fixing it robustly across slot
  remounts is more machinery than the acceptance warrants; flagged here.
- `CROSSLINK_CAP = 40` (Step-1 carryover) still truncates silently. Not blocking.

## For next session

- **Maintainer visual pass** is the gate for both phases (hubs + panel, desktop +
  mobile). Tune the drawer width / gradient stops / breakpoint if the eyeball
  disagrees — all are single-value CSS in `59`/`60`.
- **Timeline/Map/Ask as panel triggers** — out of scope here (brief line 104).
  They are *not* plain entity `<Link>`s, so they don't open the panel yet; wiring
  them is the natural Step-2 follow-up.
- **`/buch` + `/buecher` entity chips** — when those surfaces start linking to
  entities, they'll open the panel automatically via the root slot (no work).
- **`/buch` grammar convergence** (`.c-chip` / `.c-section` primitives, 109 note
  3) — still open; a `/buch` polish could fold it in.
- **Era/series hubs** (109 note 1) — still near-free if wanted; the panel slot
  would extend to them by adding `(.)aera` / `(.)serie` intercepts.

## References

- Panel seam spec: 109-impl § "For next session" point 2.
- A11y recipe reused: `src/components/timeline/DetailPanel.tsx` +
  `src/app/styles/24-detail-modal.css` (focus trap, scroll-lock, reduced-motion
  via global cascade).
- Next.js 16 parallel routes + intercepting routes + `default.tsx` slot fallback;
  the `[...catchAll]` slot-reset pattern for soft-nav unmatched routes.
