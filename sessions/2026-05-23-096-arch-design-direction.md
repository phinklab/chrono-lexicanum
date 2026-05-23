---
session: 2026-05-23-096
role: architect
date: 2026-05-23
status: open
slug: design-direction
parent: null
links: []
commits: []
---

# Design direction — roll a new visual direction across the whole site, Cartographer preserved

## Goal

Philipp has worked out a new graphic direction for Chrono · Lexicanum with Claude Design — a new look, new typography, background imagery. This session ports that direction into the live Next.js app: a new **global shell** (background, typography, colour system) plus a bespoke redesign of every public-facing route. The one exception is the Cartographer (`/map`), whose layout and features stay exactly as they are today and only inherit the new theme.

The aesthetic spec already exists as a Claude Design handoff file. The fetch URL and instruction are in [Notes](#notes) below — fetch it and read its readme **first**, before anything else.

## Design freedom — read before everything else

You have the **frontend-design skill** installed. This whole brief is a design task, and the aesthetic authority is **the Claude Design handoff file** — not me. I am deliberately not describing colours, spacing, type scale, animation timings, copy voice, or class shapes. I describe *scope, structure, and what must keep working*. Everything visual is settled by the design file or, where the file is silent, by you.

Two distinct kinds of design work are yours here:

1. **Faithful interpretation.** The handoff file delivers `index.html` (the homepage) plus a readme describing the broader visual system. Realise that homepage and that system as the design intends. Exact tokens, the Tailwind class shapes, how you restructure `globals.css`, how background images are loaded, motion timings — all yours.

2. **Extrapolation.** The design file shows one page. This session redesigns *all* public routes (see Scope). The Chronicle/Timeline, Ask, the book catalogue and the entity detail pages are **not** in the file — you extend the design language to them coherently. That extrapolation is real design judgement and it is firmly yours. This is exactly what the frontend-design skill is for; lean on it.

If you catch me prescribing a pixel value, an `oklch` triplet, a stagger in ms, exact copy, or a concrete class name anywhere below — treat it as an accident and ignore it. The constraints in this brief are *architectural* (route structure, server/client boundaries, what must not break). The look is the design file's and yours.

## Context

Chrono · Lexicanum is a Next.js 15 App Router app (React 19, TypeScript strict, Tailwind + a large `globals.css`). It is a fan-made W40k novel archive heading toward a public v1. Full stack and conventions: [`/CLAUDE.md`](../CLAUDE.md).

**The shell today.** [`src/app/layout.tsx`](../src/app/layout.tsx) is the global frame every route inherits:

- `<html data-palette="cold" data-theme="dark">`
- Google Fonts via `<link>` in `<head>` — five families (Cinzel, Cormorant Garamond, Newsreader, Space Grotesk, JetBrains Mono).
- `<body>` renders `<Starfield />` (fixed background, z0), `<TopChrome />` (fixed top chrome, z20), then `{children}`.
- `metadata` block: title template, description, openGraph, and `robots: { index: false, follow: false }` (dev-time noindex).

So the "shell" = `src/components/chrome/Starfield.tsx` + `src/components/chrome/TopChrome.tsx` + the font/token layer in [`src/app/globals.css`](../src/app/globals.css) (~3500 lines, much of it per-component CSS) + the `data-palette`/`data-theme` attributes. The new direction will most likely replace the starfield background and the font stack; whether the existing chrome components survive, get repurposed, or get replaced is an aesthetic call — yours and the design file's.

**The routes.** Public-facing: `/` (Hub — [`src/app/page.tsx`](../src/app/page.tsx), a server component that fetches a live novel count and renders three "doorway" links to Ask/Chronicle/Cartographer + the `Aquila` component), `/timeline` (Chronicle), `/map` (Cartographer), `/ask` (Ask the Archive), `/buecher` (book catalogue with audit/sort pills and filters), and the generated detail pages `/buch/[slug]`, `/fraktion/[slug]`, `/welt/[slug]`, `/charakter/[slug]`. Internal/maintainer-only: `/ingest` (read-only diff inspector), `/buch/[slug]/audit` (audit cockpit), `/lab/cartographer` (an isolated iframe prototype, already `noindex`).

**Strand.** This is a **Product/UI-strand** brief — implement it in the `chrono-lexicanum-product` worktree on a fresh `codex/product-*` task branch. A resolver run is currently live in the *Batches* worktree; that is a different worktree and parallel work is fine — this brief touches no database, no scripts, no ingestion code.

## Scope

In this session:

1. **Global shell** — port the new graphic direction (background imagery, typography, colour system) into `layout.tsx`, `globals.css`, and the chrome components, so every route inherits it.
2. **Homepage `/`** — rebuilt to match `index.html` from the design file.
3. **Bespoke redesign** of `/timeline`, `/ask`, `/buecher`, and the four detail page types (`/buch`, `/fraktion`, `/welt`, `/charakter`), extending the design language coherently.
4. **`/map`** — inherits the new global theme only. Layout, interaction model and features are **not** redesigned (see Constraints).

## Constraints

- **Port into the App Router, do not drop in static files.** The handoff file delivers `index.html` (and likely CSS/JS/assets). It must be *ported* into the existing structure — `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, React components under `src/components/`. Do **not** commit a literal `index.html` route, and do not stand up a parallel static page that bypasses routing. Raw inline `<script>` from the export gets re-expressed as React, not pasted in.
- **`/map` is preserved.** The Cartographer keeps its current layout, interaction model and every feature (sectors, worlds, year filter, book-pins) exactly as today. It picks up the new global background/typography/colour tokens because the shell is global — that is intended and wanted. But you do not redesign its layout or rework its components. If a global token change makes `/map` visibly broken or illegible, apply the *minimal* scoped fix to keep it working and legible, and note it in the report — do not take that as licence to redesign it.
- **`/buecher` keeps its function.** The catalogue is re-skinned in the new language, but the audit pills, sort pills, filters, and the existing URL contract (the `?audit=…` / sort query params) must all still work. Re-skin, don't re-architect.
- **Preserve behaviour and contracts on every existing route.** Data-fetching logic, route URLs, search-param contracts, and the SEO `metadata` block stay intact. The Hub stays a server component and keeps its live novel-count query (with the existing graceful-degrade-to-0 path). `params`/`searchParams` stay awaited (Next 15). No `db` import into a `'use client'` component.
- **TypeScript strict, no `any`.** Server components by default; `'use client'` only where hooks / browser APIs / event handlers are genuinely needed.
- **Accessibility is non-negotiable.** Any animated or parallax background / motion must honour `prefers-reduced-motion`. The redesigned site stays keyboard-navigable with visible focus states, and the design's colour choices must keep readable text contrast.
- **Background image assets live under `public/`** and are reasonably weight-optimised — this is a public site and hot-reload must stay fast (`npm run dev` re-render budget from `/CLAUDE.md` still applies).
- **Do not pin tool versions.** If the design needs a new font-loading approach, an animation library, or any new dependency, you research the current stable release, choose, pin it in `package.json`, and justify it in the report. I name intent, you pin the number.
- **`robots: { index: false }` stays.** Going public is a separate launch decision — do not flip the noindex flag in this brief.
- **Stay local — iterate, don't PR.** Philipp wants to review the redesign on his own machine as it develops, not through a stream of PRs. Do all of it on **one** local `codex/product-*` task branch; commit in logical, runnable chunks; **do not `git push` and do not open a PR**. When you consider the brief complete, stop and hand back for local review — do not push. The redesign will very likely be iterated locally across several sessions on this *same* branch (Philipp gives feedback from `npm run dev`, you adjust). The normal push + PR flow applies **only** once Philipp explicitly says `fertig` / `PR erstellen` — until then this brief overrides the default "Philipp says fertig → PR" expectation, and a follow-up session continuing this work stays on the same branch rather than cutting a new one.

## Out of scope

- **`/map` layout and feature work.** Theme inheritance only. See Constraints.
- **`/lab/cartographer`** — the isolated prototype stays completely untouched.
- **Bespoke redesign of the internal tools** `/ingest` and `/buch/[slug]/audit`. They are maintainer-only and `noindex`. They inherit the new global shell automatically (that is fine) and must keep functioning — verify they still render — but spend no bespoke design effort on them.
- **The database, schema, migrations, `scripts/**`, and all ingestion/resolver/SSOT code.** This brief is pure frontend. No migration, no schema change.
- **`brain/**` and `sessions/README.md`.** This is a strand worktree — under the Rollup-Ownership rule it never writes those. Substantive system facts (new components, dependency choices, how `globals.css` was restructured) go in your impl report's "What I did" / "For next session"; Cowork folds them into the wiki in the post-merge coordination pass.
- **Copy/voice rewrites beyond what the design file dictates.** If the design file changes wording, follow it; otherwise leave existing copy.

## Acceptance

The session is done when:

- [ ] The Claude Design handoff file has been fetched and its readme read; the new graphic direction (background imagery, typography, colour system) is realised in the global shell (`layout.tsx` + `globals.css` + chrome) so every route inherits it.
- [ ] The Hub `/` is rebuilt to match `index.html` from the design file; it stays a server component, the three doorway links (Ask / Chronicle / Cartographer) still navigate, and the live novel count still renders (and still degrades gracefully when the DB is unreachable).
- [ ] `/timeline`, `/ask`, and the four detail page types (`/buch/[slug]`, `/fraktion/[slug]`, `/welt/[slug]`, `/charakter/[slug]`) carry the new design language coherently, with all existing functionality intact.
- [ ] `/buecher` is re-skinned in the new language; audit pills, sort pills, filters, and the `?audit=…` / sort URL contract all still work.
- [ ] `/map` looks coherent under the new global theme but keeps its current layout, interaction model and features unchanged; `/ingest` and `/buch/[slug]/audit` still render and function.
- [ ] Animated / background motion honours `prefers-reduced-motion`; the site is keyboard-navigable with visible focus; text contrast is readable.
- [ ] Background image assets live under `public/` and are weight-optimised.
- [ ] `npm run lint`, `npm run typecheck`, and `npm run build` are green; the redesign runs cleanly on the local dev server (`npm run dev`) and has been eyeballed across the routes above.
- [ ] All work is committed locally on one `codex/product-*` branch; nothing pushed, no PR opened (see Constraints — "Stay local").
- [ ] No DB schema change, no migration; no edits under `brain/**` or to `sessions/README.md`.

## Open questions

Not blockers — inputs I'd value for the next architect session, to put in your report:

- What visual system did the design file actually specify (palette, type, motion, background treatment), and how did you extrapolate it to the routes the file doesn't show?
- How did you handle `globals.css` (~3500 lines today)? Wholesale replacement, layered new system, or incremental — and what did that mean for the per-component CSS the old design left behind?
- Font loading: did you keep the Google Fonts `<link>` approach or move to `next/font`? Any new dependency, and why that one?
- Did `/map` survive the global token change cleanly, or did it need a minimal scoped fix? Same question for `/ingest` and the audit cockpit.
- Did this scope land cleanly in one session, or do you recommend splitting the remaining work into a follow-up? Everything stays on one local branch with no PR (see Constraints), so "split" here means commit structure and whether a follow-up session is warranted — not multiple PRs. An honest read is useful: "all routes in one session" is ambitious and a sane split is a legitimate report outcome.

## Notes

- **Handoff file — fetch this first.** The Claude Design export. Fetch the file, read its readme, and implement the relevant aspects of the design:

  > `https://api.anthropic.com/v1/design/h/HU3iQEIaq4uY2A7roJ63EA?open_file=index.html`
  >
  > Implement: `index.html`

  The readme describes the broader visual system; `index.html` is the concrete homepage. Everything else (Timeline, Ask, catalogue, detail pages) you extrapolate from that system.

- **Suggested order of work** (process guidance, not a constraint): (1) global shell — background, typography, colour tokens — so every route stops looking broken against the new direction; (2) the Hub `/` exactly from `index.html`; (3) `/buecher` and the detail pages; (4) `/timeline` and `/ask`; (5) verify `/map` and the internal tools still hold up. Commit in logical chunks, and leave the branch in a runnable state at each commit — Philipp reviews locally via `npm run dev` between and after chunks, so a half-broken intermediate state costs him a review cycle.

- **The current chrome** — `Starfield` (background) and `TopChrome` (top nav) — is the shell the new direction most directly replaces. Whether you repurpose, rewrite, or retire those components, and whether the `Aquila` and the `data-palette="cold"` system survive, is an aesthetic call for you and the design file. Just keep the *navigation function* of `TopChrome` (or whatever replaces it) — users still need to move between the tools.

- **Strand discipline.** Detected worktree must be `chrono-lexicanum-product`; if your worktree self-check says otherwise, halt and check with Philipp before editing. Fresh `codex/product-*` branch from `origin/main`.

- **Pipeline carry-over.** The open-questions queue (`brain/wiki/open-questions.md` OQ 3 Hand-Check-Workflow, OQ 13 Crawl-Simplification) is Batches-strand and is explicitly **out of scope** for this Product brief — it stays queued for the pipeline track and is deferred here, not folded in.
