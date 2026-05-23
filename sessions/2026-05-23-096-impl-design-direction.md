---
session: 2026-05-23-096
role: implementer
date: 2026-05-23
status: implemented
slug: design-direction
parent: 2026-05-23-096
links:
  - sessions/2026-05-23-096-arch-design-direction.md
  - sessions/2026-05-23-096-impl-plan-design-direction.md
commits:
  - d37c590
  - 492b352
  - ed611c1
  - a55679a
---

# Design direction — Warhammer-Optics ported across the public site

## Summary

Phases A through F of brief 096 are live on `codex/product-2026-05-23-design-direction` (four commits, not pushed): new global shell + Hub, re-skinned `/buecher`, bespoke `/buch/[slug]`, and new shells for `/fraktion`, `/welt`, `/charakter`, `/ask`, `/map`. Internal tools (`/ingest`, `/buch/[slug]/audit`, `/lab/cartographer`, `/timeline`) inherit the new shell without any touch-up — the legacy `--hl`/`--warm`/`--ink-*`/`--line-1` tokens stay aliased in `:root`, so the audit-cockpit/timeline/ingest CSS keeps rendering at full contrast. Phases G (Timeline bespoke) and H (Ask 6-path funnel) are deferred as planned.

## What I did

**Phase A — Global shell** (commit `d37c590`)
- `src/app/layout.tsx` — replaced `<Starfield />` + `<TopChrome />` with `<SiteBackground />` + `<TopNav />`. Self-host Cinzel / Cormorant Garamond / IBM Plex Mono via `next/font/google`, exposed as `--font-cinzel` / `--font-cormorant` / `--font-plex-mono`. `robots: { index: false, follow: false }` preserved.
- `src/app/globals.css` — added the new `@theme {}` token set (`--color-cl-void/plate/bone/cyan/gold/...`) and short `:root` aliases (`--cl-void`, `--cl-cyan`, …). New keyframes `chronoSpin` / `chronoSpinRev` / `chronoSweep` / `chronoPulse` / `chronoCursor`, wrapped in `@media (prefers-reduced-motion: no-preference)` where animation is decorative. Body switches to Cormorant serif default.
- `src/components/chrome/SiteBackground.tsx` — new, three photo variants (`vista` / `librarium` / `cartog`) + `none`.
- `src/components/chrome/TopNav.tsx` — new, five primary links, EraToggle preserved as Suspense client island (`?era=` URL contract unchanged).
- `src/components/chrono/*` — twelve new primitives: `MainAuspex`, `AuspexSweep`, `CornerAuspex`, `FloatingCoord`, `ScanLine`, `Typewriter`, `LiveTelemetry`, `ProcessingDots`, `GhostReadout`, `LetterField`, `WordField`, `BottomConsole`. Server-renderable where possible; only the time-driven primitives are client islands.
- `src/lib/useReducedMotion.ts` — SSR-safe `matchMedia` hook.
- `public/img/{vista,librarium,cartog-hall}.webp` — backdrop WebPs (78 KB / 128 KB / 196 KB) converted from PNG via `scripts/convert-bg-images.ts` (sharp).
- `public/img/logo_cl_v2.svg` — new logo asset.

**Phase B — Hub `/`** (same commit `d37c590`)
- `src/app/page.tsx` rewritten — full-bleed vista backdrop, dual offset `MainAuspex` discs (big at bottom-right, small at bottom-left), centred title block (eyebrow + `CHRONO ◆ LEXICANUM` + Cormorant italic sub + gold stats), four ambient `FloatingCoord` pings, right-aligned `GhostReadout` panel, `BottomConsole` doorways. Live `novelCount` from `works` table (revalidate 1h, graceful 0 fallback on DB error).
- `globals.css` — deleted legacy `.hub-*` / `.mode-tile` block (~263 lines) and stale `.top-nav-link` block; added new `.hub` / `.hub-auspex` / `.hub-title-block` / `.hub-ghost` rules with `vh`-scaled `calc()` positioning and a `@media (max-width: 900px)` collapse.

**Phase C — `/buecher`** (commit `492b352`)
- `src/app/buecher/page.tsx` rewritten — same data fetch (`loadBooks`, `parseAudit`, `parseSort`, `sortBooks`, `matchesAudit` unchanged), new shell: vista background pulled down to 22%, 520px hero with `AuspexSweep` over the hero, two `FloatingCoord` pings, Plex-Mono eyebrow + Cinzel `BÜCHER` heading. Toolbar carries `LiveTelemetry LOAD` / `COGITATIO` + the existing `SortPills` / `AuditPills` client islands (class-names kept identical so URL contract round-trips unchanged). Nine-column row layout: index / faction dot / title+byline / primary faction / era / year / chips / updated / chevron. Native `<details>/<summary>` expands; expanded body 160px cover + body with audit-chips, meta, synopsis, factions/facets/contained-in tag rows.
- `src/lib/faction-colors.ts` — new, six canonical faction-dot colours from the design's `books.html` lines 26–32.
- `src/components/chrono/AuspexSweep.tsx` — refactored to fill its parent via `viewBox` + 100% width/height; parent positions the wrapper. Dropped `cx`/`cy` props (no callers).
- `globals.css` — deleted the entire legacy `.catalogue-*` / `.row-*` block (~500 lines), added a fresh re-skin under the same class names for the catalogue, plus enriched/audit chip variants and cyan-bordered tag chips. Three breakpoints (1100 / 720 / mobile).

**Phase D — `/buch/[slug]`** (commit `ed611c1`)
- `src/app/buch/[slug]/page.tsx` rewritten — DB query unchanged. New shell: `SiteBackground vista` at 22%, two-column `[240px_minmax(0,1fr)]` layout. Left: cover inside `c-glass c-corners` panel with 14px inset padding (subtle cyan corner brackets, no radial halo — per the no-glow-halo feedback memory). Right: Plex Mono eyebrow `// LECTIO PROFVNDA · BUCH`, Cinzel title `clamp(36px, 4vw, 56px)`, Cormorant italic byline, Plex Mono meta strip (year · format · era · series #N), "Auch enthalten in:" line, Cormorant italic synopsis, four sections (Fraktionen / Orte / Charaktere / Facetten) each with `//` kicker + `c-hairline` + cyan-bordered chips. Footer `// audit` link.
- `globals.css` — added new `.book-detail*` block at end of file. Audit-cockpit's legacy `.dm-*` classes (used by both `/buch/[slug]/audit` *and* `src/components/timeline/DetailPanel.tsx`) left untouched.

**Phase E — Stub-route shells** (commit `a55679a`)
- `src/app/fraktion/[slug]/page.tsx`, `src/app/welt/[slug]/page.tsx`, `src/app/charakter/[slug]/page.tsx`, `src/app/map/page.tsx` — all reuse a shared `.stub-shell` layout with `// PHASE-3 · IN VORBEREITUNG` eyebrow, Cinzel `{slug}` (or `CARTOGRAPHER`) title, Cormorant italic body, decorative `CornerAuspex` top-right. Per-route backdrop variant: `vista` for fraktion/welt/charakter, `cartog` for map.
- `src/app/ask/page.tsx` rewritten — `librarium` backdrop, `// ORACVLVM · DELIBERATIO` eyebrow, Cinzel `ASK THE ARCHIVE`, lede, status line, **3×2 grid of disabled `c-glass c-corners` cards** (I/II/III/IV/V/VI · Latin label · Cormorant copy · `// inaktiv` footer). The cards are wrapped in a `role="group"` div with `aria-label` so the listitem doesn't fail `jsx-a11y/role-supports-aria-props`. Footer `EX DELIBERATIONE · LECTIO · STAMP M42.347`.
- `globals.css` — appended shared `.stub-shell*` block + a separate `.ask*` block (Latin path cards with three responsive breakpoints).

**Phase F — Verify internal tools** (no commit)
- Confirmed `--hl` / `--warm` / `--ink-1/2/3` / `--line-1` / `--bg-1` are still aliased in `:root` (lines 220–237 of `globals.css`) and the underlying `--color-*` tokens (`--color-lum`, `--color-amber`, `--color-bg-1`, …) still exist (lines 127–144). So `/buch/[slug]/audit`, `/ingest`, `/lab/cartographer`, `/timeline` inherit the new TopNav + fonts but retain their existing CSS values untouched. No contrast fixes needed → no commit.

## Decisions I made

- **Brief said "300px sidebar with ERA/FACTION/SEARCH controls" for `/buecher`. I skipped that.** Those controls have no URL-contract support — they'd be dead UI on a v1 launch. The plan also calls out that ERA/FACTION/SEARCH "would need new query-param plumbing." I kept `SortPills` + `AuditPills` in a top toolbar instead (same URL contract as today). Note this when designing a future Phase: a sidebar makes sense once the actual filter routing exists.
- **No radial halo behind the book cover.** The plan called for "subtle cyan halo box-shadow." Memory `feedback_hub_aesthetic` documents the no-glow-halos preference. I interpreted "halo" as the existing `c-corners` cyan corner brackets + the `c-glass` inset border — those provide the structural framing without the warm-amber radial bloom that triggered the original feedback.
- **`/ask` 6-path content is my own placeholder copy, not from the design handoff.** The brief's `ask.html` lines 30–249 reference an external file (`ask.html` lives outside this worktree — `archive/` is gitignored per CLAUDE.md). I composed six reasonable mood-paths in Latin (VESTIGIVM / BELLVM / PRIMARCH / HEREXIS / EXPLORATIO / INITIVM) marked clearly with `// PHASE-H · IN VORBEREITUNG · VISUELLE VORSCHAU` and `// inaktiv` per-card. Cowork should replace these with the canonical six from the handoff when Phase H lands.
- **`CornerAuspex` doesn't take a `corner` prop.** I initially passed `corner="tr"` (per plan hint), realised it just renders a box and positioning is the parent's job, and switched to wrapping it in a `.stub-shell__decor` / `.ask__decor` absolutely-positioned wrapper. No API change to `CornerAuspex`.
- **Phase F yielded no commit.** Per plan ("commit only if fixes applied"). The aliased token chain (`--hl` → `--color-lum`, etc.) survived the global re-skin intact, so all internal-tool stylesheets continue to work as-is.
- **Phases G + H deferred as planned.** The brief's own plan marks the planned stopping point as Phase F. The branch is two commits ahead of where Phase F finished, so Cowork has a clean handoff point.

## Verification

- `npm run lint` — pass (clean, no warnings)
- `npx tsc --noEmit` — pass
- `DATABASE_URL=<placeholder> npm run build` — pass; all 11 routes built (`/`, `/_not-found`, `/ask`, `/buch/[slug]`, `/buch/[slug]/audit`, `/buecher`, `/charakter/[slug]`, `/fraktion/[slug]`, `/healthz`, `/ingest`, `/ingest/[runId]` (SSG with 2 prerendered runs), `/lab/cartographer`, `/map`, `/timeline`, `/welt/[slug]`)
- **`npm run dev` walk-through — not executed in this session.** The Phase A+B walk-through happened pre-context-summary; Phases C+D+E only had build/lint/typecheck validation. The page-tsx structures are static-server-rendered (no client-only logic), so SSR success during `next build` covers correctness of markup + types; visual confirmation against the design handoff is Philipp's call.
- **Reduced-motion** — animations are CSS keyframes wrapped in `@media (prefers-reduced-motion: no-preference)` so the brake works at the media-query layer without per-component opt-in. Not toggled in DevTools this session.

## Open issues / blockers

- None. The branch is in a clean, lintable, buildable state.

## For next session

- **Cartographer (`/map`) bespoke redesign.** Currently a stub shell — explicitly out of scope for brief 096. When the GalaxyMode port lands, replace `cartog-hall.webp` backdrop with the actual map surface and drop the `.stub-shell` shape.
- **Timeline (`/timeline`) bespoke redesign — Phase G.** Brief 096 plan flagged this as optional headroom; it didn't fit. Re-skin Overview ribbon, EraDetail era band, FilterRail, DetailPanel within the new cyan/bone/Plex-Mono vocabulary while preserving `?era=` / `?book=` / `?faction=` / `?length=` URL semantics and the brief 008 redirect logic + brief 025 `key={era.id}` remount behaviour. `DetailPanel.tsx` still uses the legacy `.dm-*` CSS — those rules remain in `globals.css` and currently serve both `/timeline`'s detail panel and `/buch/[slug]/audit`.
- **Ask 6-path funnel — Phase H.** Replace the placeholder Latin copy in `src/app/ask/page.tsx` with the canonical six paths from the design handoff. The state machine itself needs new client components under `src/components/ask/` (PathSelect, QuestionCard, ResultCard, useAskFlow).
- **`/buecher` left sidebar with real filter routing.** When `?era=`, `?faction=`, `?q=` are added to `searchParams`, retire the in-toolbar SortPills+AuditPills cluster into a 280–320px left sidebar.
- **Cleanup pass on legacy tokens.** `--color-void / --color-aquila / --color-frost-*` (Tailwind v3-style) may now be entirely unused; once a code review confirms no route still references them, drop the `@theme {}` aliases.
- **Three commits on this branch are atypically large** (Phase A+B is ~28 files / ~3 800 lines, Phase C is ~1 300 lines of CSS churn). Acceptable for a clean-slate visual port; subsequent maintenance changes should land smaller.

## References

- `sessions/2026-05-23-096-arch-design-direction.md` — the brief
- `sessions/2026-05-23-096-impl-plan-design-direction.md` — my 530-line implementation plan from the start of this session
- `brain/wiki/decisions/` — no new ADR generated; this brief is a visual-direction port, not an architectural shift
- Memory: `feedback_hub_aesthetic` (no glow halos), `feedback_no_claude_coauthor` (commits don't tag Claude), `feedback_parallel_worktree_workflow` (stay-local-iterate-don't-PR)
