# Design Language — Chrono · Lexicanum

> **System of record for the site's visual language.**
> The canonical surfaces are **`/werke` (Works / the Archive)** and **`/ask` (Oracle)** — they
> were redesigned first and every other page is brought to *their* image. This document captures
> the **design of the elements** (type, color, surfaces, controls, motion, decoration), **not**
> the background photography. Background images are a swappable per-route variable
> (`SiteBackground variant=…`); the vocabulary below is what stays constant.
>
> **How to use it:** when redesigning a page, copy the *skeleton* (§4), the *element vocabulary*
> (§6) and obey the *foundations* (§3) and the *don't-list* (§8). Accent color follows the
> per-domain map (§7). Concrete class names and token values are given so a port is near drop-in.
>
> Owner: Product strand. Lives in `docs/` (the Brain wiki is the long-term home, but the Product
> worktree may not write `brain/**`). Update this file when the canonical surfaces change.

---

## 1. North star — the cogitator console

The site reads as an **in-universe Imperial archive terminal**: a cool, dark, machine-calm console
that a cogitator is quietly running. The fiction is carried entirely by *restraint plus a few
deliberate flourishes* — Latin-ish eyebrows (`// CATALOGVS · LIBRORVM`), zero-padded console
counters (`001`, `01 / 05`), drifting telemetry readouts, an auspex sweep over the hero art — never
by skeuomorphism or clutter.

**The five restraint laws (these override any "nice effect" instinct):**

1. **No bloom.** No glow halos behind hero art, no radial light-blooms, no warm-amber background
   gradients. Glows, where they exist at all, are capped at ~18 % alpha (focus ring, text-shadow).
2. **Sharp geometry.** No `border-radius` on panels/cards. Angularity is the house shape; corner
   accents come from L-bracket primitives (`.c-corners`), not rounded boxes.
3. **Accent is reserved for live data and interaction.** Structure (dividers, rows, labels) is
   neutral bone/void; the accent hue appears only on hover, focus, selection, active state, and
   genuinely *live* values (the year, the active chip, telemetry).
4. **One accent per domain.** Each page commits to a single accent (cyan **or** gold), never both.
5. **Decoration never blocks interaction.** Every decorative layer is `aria-hidden` and
   `pointer-events: none`, and sits behind content in the z-stack.

---

## 2. Foundations

### 2.1 Color — neutrals + the two-accent system

Everything is built from a void/bone neutral spine plus **two house accents**. Tokens live in
`src/app/styles/00-tokens.css` as `@theme` values, aliased to short `--cl-*` names for hand-written CSS.

**Neutral spine (used on every page):**

| Token | Value | Role |
|---|---|---|
| `--cl-void` | `#02030a` | Page background, deepest surface |
| `--cl-void-2` | `#06080f` | Popover / menu plate (FilterSelect, suggestions) |
| `--cl-bone` | `#e8dcc0` | Primary text |
| `--cl-dim` | `rgba(232,220,192,.62)` | Secondary text, labels |
| `--cl-faint` | `rgba(232,220,192,.28)` | Hairline borders, resting control borders |
| `--cl-ghost` | `rgba(232,220,192,.14)` | Disabled text, faintest rules |
| `--line-0` | `rgba(232,228,216,.08)` | Row dividers (lists) |
| `--line-1` | `rgba(232,228,216,.16)` | Stepper bars, slightly stronger rules |

**Cyan accent — the house default + the "Oracle / discovery" domain:**

| Token | Value | Role |
|---|---|---|
| `--cl-cyan` | `#9ce6ff` | The default interactive/highlight hue |
| `--cl-cyan-dim` | `rgba(156,230,255,.45)` | Dim accent borders |
| `--cl-cyan-fnt` | `rgba(156,230,255,.18)` | Faint active wash |

Cyan washes seen in practice: `rgba(156,230,255,.05)` (row hover), `.07` (selected row).

**Gold accent — the "Archive / catalogue" domain:**

| Token | Value | Role |
|---|---|---|
| `--cl-gold` | `#c9a65a` | Catalogue accent |
| `--cl-gold-dim` | `#8a6f2c` | Dim gold borders |

Gold washes: `rgba(201,166,90,X)` where `X` = `.05` row-hover · `.10` active fill · `.12` active option · `.18` chip-hover.

> **The accent is not chosen per component — it is inherited from the page.** The browse controls,
> primitives, and decoration all default to **cyan**. The **gold** look is applied entirely by
> ancestor selectors — `body:has(main.catalogue)` and `.catalogue--werke …` — which recolor the
> exact same classes. A component never hardcodes gold. To make a surface gold, put it under
> `main.catalogue`; otherwise it renders cyan. See the domain map in §7.

`--cl-blood` (`#a51c1c`) exists for destructive/error semantics; use sparingly.

### 2.2 Typography — three faces, fixed jobs

Three typefaces, each with one job. Never mix the jobs.

| Face | Token | Job |
|---|---|---|
| **Cinzel** (display serif) | `--font-cinzel` | Headings, page titles, list-row titles. Wide tracking (`0.14–0.32em`), light weight (400–500), often uppercase. |
| **Cormorant Garamond** (reading serif) | `--font-cormorant` | All reading prose: subs, hints, synopses, blurbs. Usually *italic*, weight 500. |
| **IBM Plex Mono** (label mono) | `--font-plex-mono` | Every label, eyebrow, kicker, chip, index, counter, telemetry. Uppercase, wide tracking. |

> ⚠ The live mono variable injected by Next's font loader is **`--font-plex-mono`** — always use that
> in component CSS. (The `@theme` token `--font-mono: 'JetBrains Mono'` exists but is *not* what the
> mono UI renders.)

**Two size ladders** (re-tune a whole role by editing one token):

```
Cormorant reading:  --fs-read-xs 15  · --fs-read-sm 17 · --fs-read 19 · --fs-read-lg 22   (px)
                    --fw-read 500   · --lh-read 1.6
Plex Mono labels:   --fs-label-xs 11 · --fs-label 12   · --fs-label-lg 13                  (px)
```

Body base is Cormorant at `--fs-read-sm` (17 px) — Cormorant has a small x-height and reads ~2 px
small, so the floor is deliberately raised; mono labels floor at 11 px (never sub-10).

**Letter-spacing encodes hierarchy** (a real, consistent convention):
`0.26em` card eyebrows · `0.22–0.24em` filter/section labels, group headers · `0.20em` sort pills ·
`0.18em` clear-links, indices · `0.12–0.14em` inputs, chips · `0.06–0.10em` hints, values.

Helper utilities exist: `.font-display` (Cinzel 0.32em/400), `.font-display2` (Cinzel 0.14em/500),
`.font-serif` (Cormorant), `.font-mono` (Plex Mono 0.22em uppercase 12 px).

### 2.3 Surfaces & geometry

Sharp corners everywhere. Two surface treatments:

- **Full glass** — `.c-glass`: `linear-gradient(180deg, rgba(8,12,20,.80), rgba(4,8,14,.88))` +
  `backdrop-filter: blur(10px)` + `1px` cyan-`.18` border + soft shadow
  (`0 12px 40px rgba(0,0,0,.55)`), hover lifts `translateY(-2px)` and brightens the border. Used for
  doorway cards, modals, "boxed" panels.
- **Frameless void wash** — the `/werke` + `/ask` discipline. A panel is *near-invisible*:
  `border: 0; background: rgba(2,3,10,.25);` **no blur, no shadow, no corner ticks.** Legibility
  comes from the page's strong void-fade backdrop + scroll scrim (§4), not from the card. **Prefer
  this over `.c-glass` when matching the canonical surfaces** — the redesigned pages float content
  over the hero photo rather than boxing it.

**Accent primitives:**

- `.c-corners` — two L-brackets (top-left + bottom-right), `14px`, `1px`, `var(--cl-cyan)`,
  `pointer-events: none`. The targeting-reticle motif. (`body:has(main.catalogue)` recolors to gold.)
- `.c-hairline` / `.c-vhair` — a `1px` divider that fades to transparent at both ends, accent in the
  middle. Section dividers inside cards.
- `.c-shadow-text-sm` — `text-shadow: 0 2px 8px rgba(0,0,0,.95)` (no glow) for headings over imagery.
  Prefer this over the glowy `.c-shadow-text` (which adds a cyan bloom — restraint law #1).

### 2.4 Motion & accessibility floor

- **Reduced-motion is a hard global kill-switch:** `@media (prefers-reduced-motion: reduce)` forces
  `animation-duration`/`transition-duration` to `0.001ms !important` on `*, *::before, *::after`.
  Animation *primitives* (`.c-pulse`, `.c-blink`, `.c-twinkle`, `.c-fade-in`, `.c-cursor`) are also
  gated behind `prefers-reduced-motion: no-preference`. Motion is opt-out by default. The one
  deliberate exception is **`ScrollScrim`** (scroll-linked = a direct response to user input, not
  autonomous motion) — documented in its header.
- **Focus is always visible and accent-colored:** the global `:focus-visible` ring is
  `outline: 1px solid var(--cl-cyan); outline-offset: 2px; box-shadow: 0 0 0 4px rgba(156,230,255,.18)`.
  Components repeat the `1px solid accent` outline rather than inventing new focus styles. Never
  `outline: none` without an equivalent visible cue.
- **DOM order = reading/tab order.** When two columns swap visually (e.g. the `/ask` panel swap),
  reorder the DOM, don't lean only on CSS `order`.
- **Transitions are calm and short:** ≈180 ms on controls (color/border/background); 200–300 ms on
  the `.c-glass` primitive. No bounce, no scale.
- Custom scrollbar is neutral bone-grey (`rgba(232,228,216,.18)`, hover `.34`), `8px`, no glow.

---

## 3. The page skeleton — the "media-page" anatomy

Both canonical pages share one vertical structure. This is the spine to copy for any new full-page
surface (it is exactly what aligns `/werke` and `/ask`).

```
┌─ fixed, viewport-sized, BEHIND content (z -2 / -1) ─────────────┐
│  background photo (100vh, cover)   ← SiteBackground variant      │
│  bottom-heavy fade to void         ← solid in top ~50%,          │
│                                       full void by the bottom    │
│  ScrollScrim (raises void opacity 0→~0.7 as you scroll in)       │
├─ hero band  height: clamp(520px, 60vh, 700px) ──────────────────┤
│     auspex sweep (absolute, top:60px, centered)                  │
│     title block (absolute, top:320px, centered):                 │
│        // MONO · EYEBROW            (mono, accent, 0.22em)        │
│        CINZEL HEADING               (clamp(44px,4.6vw,64px), 400) │
│        Cormorant italic sub         (max 640px, --fs-read)       │
├─ content band  margin-top: -80px  (pulls UP over the photo) ────┤
│     toolbar:  N · SHOWN  / total works  · <CatalogueTelemetry>   │
│     [controls / search console]                                  │
│     list / body  (frameless, hairline-divided)                   │
│     footer triad:  LEFT · MIDDLE(accent) · RIGHT  (mono caps)    │
└──────────────────────────────────────────────────────────────────┘
```

Load-bearing values (identical on `/werke` `.catalogue-hero` and `/ask` `.ask-console__mast`):

- **Hero height: `clamp(520px, 60vh, 700px)`** — capped so the pulled-up content band doesn't drop
  far below the fixed title on tall viewports. Keep the two pages on the *same* clamp so their
  content bands stay aligned.
- **Title sits 320 px from the hero top** — `/werke` positions `.catalogue-hero__title` absolutely
  at `top: 320px`; `/ask` reaches the same line via `padding-top: 320px` on the (relative)
  `.ask-console__mast`, title in normal flow. Either way the title stays put; only the band moves.
- **Content band `margin-top: -80px`** so the first rows overlap the fading lower edge of the photo.
- Content max-width ≈ `1180px` (`/ask` grid) / `1320px` (`/werke` body); horizontal padding
  `clamp(20px, 3vw, 48px)`.
- The background photo + fade are viewport-pinned (they stay while rows scroll over them); the scrim
  fades them toward void for legibility. (`/werke` makes its own `.catalogue-hero__photo`/`__fade`
  `position: fixed`; `/ask` rides the fixed `.site-bg` with an `absolute` `::after` fade.) Eyebrow →
  Cinzel heading → Cormorant sub is the fixed title recipe.
- Mobile (`≤720px`): hero collapses to `420px`, title to `top:240px`, band `margin-top:-48px`.

---

## 4. Chrome (shared on every page)

- **`TopNav`** (`.top-nav`) — fixed, `height: var(--top-nav-h, 48px)`, `z-index:50`, mono. Grid
  `1fr auto 1fr` locks the 7 nav links to true viewport centre. Active link =
  `aria-current="page"` → accent text + faint accent fill + dim accent border. Scroll past 24 px
  **collapses** it to a centered logo-only "MENU" affordance. On catalogue pages,
  `body:has(main.catalogue)` recolors the whole nav cyan→gold. Home is just the `Home` nav item
  (`p === '/'`); the hero must sit inside this 48 px chrome.
- **`SiteBackground`** (`.site-bg`) — fixed `inset:0`, `z-index:-1`, `aria-hidden`,
  `pointer-events:none`. Renders photo + radial vignette + a subtle SVG grain (`opacity:.12`).
  One component, **variant→photo map** (the only per-route knob, plus a `position` prop):

  | variant | photo | used by |
  |---|---|---|
  | `main` | `/img/main-bg.webp` | Home, Archive, Compendium, Statistics, Now |
  | `vista` | `/img/vista.webp` | Entity detail pages |
  | `login` | `/img/login.webp` | Login (removed for launch) |
  | `none` | — | vignette + grain over void only |
- **`BottomConsole`** (`.bottom-console`) — fixed bottom telemetry strip + optional 3 doorway cards
  (`ORACVLVM → /ask`, `BIBLIOTHECA → /werke`, `CARTOGRAPHIA → /map`), each a `.c-glass .c-corners`
  Link. Props: `withCards`, `compactCards`, `novelCountText`, `doorways`. The strip shows a pulsing
  `COGITATOR-1011` dot + live `VOLT`/`DRIFT` readouts + the novel count + `STAMP M42.347`.

z-strata to respect: `site-bg -1` · page `<main>` 1 · `bottom-console` 30 · `top-nav` 50.

---

## 5. Component & pattern vocabulary

### 5.1 Eyebrow / kicker — `.card-eyebrow`

Mono uppercase micro-heading above a title, e.g. `// CATALOGVS · LIBRORVM`, `// RESPONSVM / TOP FIVE`.
`--fs-label` (12 px), `letter-spacing: 0.26em`, `color: var(--row-accent, var(--cl-cyan))` — a parent
can set `--row-accent` to retint it. Every section/card gets one.

### 5.2 The search console — `.browse-search` + `.browse-suggest`  **(the canonical interactive pattern)**

This is the universal "search everything we can filter" combobox. **It is the field the Home search
must adopt.** Structure (`WerkeFilters.tsx` + `61-browse.css`):

- **`form.browse-search`** (`role="search"`) holds: `.browse-search__sigil` (auspex reticle SVG,
  `aria-hidden`) + `input[role="combobox"]` + `.browse-search__clear` (custom `×`, only when text) +
  a visually-hidden `.browse-search__status` live region.
- **Input** is an ARIA combobox: `aria-expanded`, `aria-controls` (set *only* when suggestions
  exist), `aria-autocomplete="list"`, `aria-activedescendant`, `autoComplete="off"`.
- **`.browse-suggest`** popover (`z-index:40`, plate `var(--cl-void-2)`, `1px` cyan-dim border,
  `max-height: min(58vh, 420px)`, scrollable) holds a `role="listbox"` `<ul>` whose rows are:
  - `.browse-suggest__group` — mono group eyebrow (`BOOKS`, `FACTIONS`, `FACETS`, `FORMATS`,
    `AUTHORS`), `role="presentation"` `aria-hidden`.
  - `.browse-suggest__opt` — `role="option"`, flex label + hint, **2 px left accent border-strip**
    on `.is-active`. Book labels render as **Cormorant serif** (`--fs-read-sm`); faction/facet/
    format/author labels render as **mono**. `.browse-suggest__hit` is a `<mark>` (accent color, no
    background) bolding the matched substring. `__hint` is right-aligned mono metadata.
  - Footer `.browse-suggest__foot` (`Enter — search every field for "…"`) and empty-state
    `.browse-suggest__empty` are `<p>` siblings **outside** the listbox.

**Behavior** (URL is the single source of truth; the box keeps a local draft, re-syncs from the URL
during render — the React adjust-state-on-prop-change pattern, no effect):

- Keyboard: ↑/↓ move active, Enter commits the highlighted suggestion *or* runs the broadened
  free-text search, Esc closes. Picks use `onMouseDown` + `preventDefault` so they land before blur.
- Pick semantics on `/werke`: **book** → `router.push('/buch/[slug]')` (navigates *away* into the
  book); **faction/facet/format** → set that URL param in place; **author** → set `q`; **Enter on
  raw text** → set `q` (a broadened filter reaching title, authors, factions, facets, format, series,
  era). The in-place picks use `router.replace(…, {scroll:false})` so the list re-filters with no
  scroll jump.

**Two visual skins, same structure:** the default (cyan) is a bordered box with a mono 12 px input;
under `.catalogue--werke` it dissolves into a **borderless gold hairline-underline** with a
**Cormorant 19 px** input — *italic placeholder, upright typed text* (`:focus-within` darkens the
gold underline). The contract
(`q`/`faction`/`format`/`facet`/`sort` params, `Suggestion[]` index, `rankSuggestions`) lives in
`src/app/werke/filters.ts` and is pure (shared by server + client).

### 5.3 Filter controls

- **`FilterSelect`** (`src/components/browse/FilterSelect.tsx`) — the on-brand custom dropdown that
  **replaces native `<select>`** (the OS popup renders unreadable on the void). A
  `button[aria-haspopup="listbox"]` + popover `ul[role="listbox"]` with full keyboard model
  (↑/↓/Home/End/Enter/Space/Esc/Tab), active-descendant, click-outside, scroll-into-view. Plate
  `var(--cl-void-2)`, `1px` cyan-dim border; the **highlighted** option = faint wash + bone text, the
  **selected** (chosen) option = accent text + trailing `✓` (two distinct states).
  **Never ship a raw `<select>` on the dark surface.**
- **`.browse-pill`** (`.active`) — ghost-outlined segmented toggle (`1px` faint border at rest; sort
  options); active = accent text + accent border + faint same-hue fill. `aria-pressed`. *(The boxed
  `.sort-pills`/`.sort-pill` toolbar in `/buecher` is the maintainer-catalogue variant — prefer
  `.browse-pill` for public surfaces.)*
- **`.browse-facet-chip`** — active-filter chip `Category: Name ×`, whole chip clears the filter.
- **`.browse-clear`** — underlined mono "Clear all" text-button (only when a filter is active).

### 5.4 Lists & rows — the shared row idiom

All three canonical lists (`catalogue-row`, `ask-option`, `ask-result`) share one discipline:

- **Hairline-divided rows**, single column, `border-top: 1px solid var(--line-0)` with the first
  child suppressed. **No per-row box, no fill at rest, no `translateY` lift, no drop-shadow, no
  boxed number badge.**
- Anatomy: mono **zero-padded index** (`001`, `01`) in `--cl-faint` → optional **faction dot**
  (`10px` circle, the row's strongest accent) → **Cinzel title** (bone; dim when a stub) → Cormorant
  italic byline/sub → mono meta (faction / year / format) → chips → chevron.
- **Accent only on state:** hover = faint accent wash (`.05`), selected/current = `.07` + accent
  text. The `/ask` option chevron also *changes shape* `›`→`▸` on select (a non-hue selection cue).
- `/werke` rows use `<details>/<summary>` to expand an inset detail body (cover + meta + synopsis +
  faction/facet tag rows + "Open book →").
- **Chips:** mono, uppercase, `1px` border, accent text — `.catalogue-chip` (gold),
  `.ask-reasons li` (cyan-outlined, `rgba(156,230,255,.07)` fill, 11 px). Restraint: chips for *live*
  classification, neutral hairlines for structure.

### 5.5 Cards, panels & the status rail

- **De-boxed card** — `.ask-card` (`58-ask-booklist.css`): `border:0; background: rgba(2,3,10,.25)`;
  sets a local `--row-accent`. The default card surface for the canonical pages (see §2.3).
  `ProcessingPanel` is the lone card that keeps `.c-corners`.
- **Status rail** — `.ask-status` (an `<aside aria-label>`): head counter → **`ProgressDots`
  stepper** (a row of `1px`-tall hairline bars, one per question: filled = cyan-dim, current = full
  cyan, pending = cyan→bone gradient — *bars, not round dots*) → answer-step revisit buttons → action
  pills. On `≤960px` it stacks above the question (`order:-1`).

### 5.6 Buttons — the three-tier hierarchy

One filled button per view, at most. (Classes are `ask-*` but the system is surface-agnostic.)

| Tier | Class | Look | Use |
|---|---|---|---|
| Primary | `.ask-cta` | **solid cyan fill, void text**, hover brightens (`color-mix 88% + white`, no glow) | the single confirm/forward action |
| Secondary / exit | `.ask-pill` | dark fill + faint hairline; only the **border** reacts on hover | every "way out" (reset, "Complete archive") |
| Tertiary | `.ask-footlink` | borderless mono text, **underline on hover** | back / reset / low-emphasis nav |

Inline links: `.c-link-cyan` (accent, fade-on-hover, no underline).

### 5.7 The "living archive" decoration layer

Accent-parameterized, purely decorative overlays. **All** sit behind content as non-interactive
layers — `aria-hidden` and/or `pointer-events:none`, guaranteed at the layer level (some set both
inline; the SVG discs get `pointer-events:none` from their placement wrapper, and `GhostReadout`
relies on `pointer-events:none` without an inline `aria-hidden`). They animate via shared `chrono*`
keyframes (in `00-tokens.css`); timing is always a prop.

| Component | What it is | Key props (defaults) |
|---|---|---|
| `MainAuspex` | big rotating HUD disc (rings, ticks, bearings, sweep) | `size=480`, `accent="var(--cl-cyan)"`, `spinDur=80`, `spinRevDur=110`, `sweepDur=10` |
| `AuspexSweep` | small sweep-arm + rings overlay for hero art | `r=240`, `accent="var(--cl-cyan)"`, `sweepDuration=14` |
| `GhostReadout` | cycling typewriter cogitator log | `lines[]`, `color="var(--cl-gold)"`, `lineMs=2400`, `typeSpeed=30`, `max=5` |
| `FloatingCoord` | a single coordinate label that rises & fades | `x`,`y`,`label`, `color="var(--cl-gold)"`, `lifetime=5`, `delay=0` |
| `CatalogueTelemetry` | the canonical `LOAD`/`COGITATIO` live readout pair | `accent: "cyan" \| "gold"` (enum) |
| `ScrollScrim` | drives the fixed-photo→void scroll fade | `heroSelector`, `varName`, `maxOpacity=0.7` |

> ⚠ **Accent-prop inconsistency to respect:** the SVG discs use `accent` (free CSS-var string,
> default cyan); the text loops (`GhostReadout`, `FloatingCoord`) use `color` (default **gold**);
> `CatalogueTelemetry` uses an `accent: "cyan"|"gold"` enum. When you add these to a page, pass the
> page's accent explicitly so they don't fall back to the wrong default.

`ScrollScrim` and `CatalogueTelemetry` are **shared across pages already** — reuse verbatim, don't
reinvent the scroll fade or the telemetry pair.

---

## 6. Domain accent map

The accent is a property of the **page**, inherited by everything inside it.

| Route | `<main>` class | `SiteBackground` | Accent | Status |
|---|---|---|---|---|
| `/archive` Works / Archive | `catalogue catalogue--werke` | `main` | **Gold** | ✅ canonical |
| `/` Home | `hub` | `main` | **Cyan** | canonical |
| `/character/*`, `/faction/*`, `/person/*`, `/world/*` | `entity-page` | `vista` | **Cyan** | house default |
| `/statistics`, `/now`, `/archive/podcasts/*` | route-specific | `main` | **Cyan/Gold by domain** | current |
| `/book/*` | `book-page` | `none` | **Gold** | current |
| `/map`, `/timeline` | route-specific | own flat/stage surface | **Cyan/Gold by domain** | current |

Rule of thumb: **gold = the catalogue/archive**; **cyan = everything else** (the default). A page
goes gold *only* by living under `main.catalogue`.

---

## 7. The don't-list (anti-patterns)

- ❌ A raw native `<select>` on the dark surface → use `FilterSelect`.
- ❌ `border-radius` on panels/cards → sharp corners; bracket with `.c-corners`.
- ❌ Glow halos behind hero art, warm-amber background gradients, bloom → restraint law #1.
- ❌ Accent color on resting structure (dividers, labels, inactive rows) → accent is for state + live data.
- ❌ Two accents on one page → one per domain.
- ❌ Decoration that intercepts clicks or sits above content → `aria-hidden` + `pointer-events:none` + behind.
- ❌ A boxed "glass card" per list row → frameless hairline-divided rows.
- ❌ `outline: none` on an interactive without a replacement focus cue.
- ❌ Hardcoding gold in a component → let `main.catalogue` recolor it.

---

## 8. Applying it to Home (`/`, P1)

**Today:** `main.hub` is a full-bleed `main-bg.webp` vista with offset dual `MainAuspex`, a centered
Cinzel title, a cyan `GhostReadout`, a *simpler* `hub-search` bar (`HomeSearch.tsx` → routes to
`/werke?q=`), a `ToolsAccordion`, and the `BottomConsole`. It predates the `/werke` + `/ask` system.

**Target:** bring Home onto the §3 media-page skeleton and §5 element vocabulary, **keeping cyan**
(domain map §6) and the shared `main-bg.webp` background. Specifically:

1. **Adopt the search console verbatim** (§5.2) as the Home hero search, in its **cyan** skin, with
   the **full live typeahead** (grouped `BOOKS / FACTIONS / FACETS / FORMATS / AUTHORS` dropdown).
   This requires building the same `searchIndex: Suggestion[]` on the Home server component that
   `/werke/page.tsx` builds (from `loadBrowseBooks()`), and a **navigate-mode** for picks: book →
   `/buch/[slug]`, faction/facet/format → `/werke?faction=…` (etc.), author/Enter free text →
   `/werke?q=…`. (On `/werke` the same console filters in place; on Home it *navigates into* the
   archive — "search, then arrive at the archive with the query.") Extract the search into a shared
   component rather than copy-pasting.
2. **Keep what already fits the language:** the `MainAuspex` hero identity, the Cinzel title +
   `// MONO · EYEBROW`, the `GhostReadout`/`FloatingCoord` ambience (pass `color="var(--cl-cyan)"`),
   the `BottomConsole` doorways.
3. **Re-skin panels/lists** to the frameless §2.3 wash + §5.4 row idiom + §5.6 buttons where the page
   currently uses ad-hoc `hub-*` styling.
4. **Obey the foundations + don't-list** — cyan focus rings, reduced-motion, no bloom, sharp corners.

The home search is the one sanctioned cross-page feature port (the maintainer asked for it directly);
otherwise each page keeps its own function — only the *visual language* is shared.
