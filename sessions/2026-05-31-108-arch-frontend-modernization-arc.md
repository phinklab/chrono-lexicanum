---
session: 2026-05-31-108
role: architect
date: 2026-05-31
status: open
slug: frontend-modernization-arc
parent: null
links: []
commits: []
---

# Frontend modernization arc — kickoff & visual-regression baseline (Step 1)

## Goal

Kick off the frontend (CSS / HTML / client-JS) modernization arc and ship **Step 1 — a Playwright visual-regression baseline** that locks the site's current appearance before any refactor touches a line of CSS. This file also records the decisions Cowork and Philipp ratified for the arc, and the discipline the later briefs follow.

> **Sourcing note (read this).** The authoritative findings and the detailed sequenced plan live in Codex's review inside the **Product worktree** at `reviews/website-code-review-2026-05/` — twelve files: `000-index.md`, `001-baseline-inventory.md`, `002-css-structure-tokens.md`, `003-css-route-legacy.md`, `004-css-motion-responsive.md`, `005-app-router-boundaries.md`, `006-data-db.md`, `007-performance.md`, `008-accessibility-ux.md`, `009-security-launch.md`, `010-architecture-ai-debt.md`, and the 466-line `900-implementation-plan.md`. **Read those directly** — they are the detail source for briefs 109+. This brief deliberately does **not** paraphrase the slice-level findings; it sets the frame and specifies Step 1, which is independent of any specific finding.

---

# The arc — frame & decisions

## Decisions ratified with Philipp (2026-05-31)

1. **Target stack: keep it, enforce boundaries.** Tailwind v4 CSS-first `@theme` + CSS Modules stays — the tools are already modern; the problem is the missing boundary. **No new styling framework** (no CSS-in-TS, no Sass — those are *more* ballast).
2. **Safety net first.** A Playwright visual-regression baseline lands **before** any teardown, so every later refactor can prove pixel-parity. That is this brief (Step 1).
3. **CSS core first.** This arc does the CSS work — dead-code removal, the styling rule, the `globals.css` teardown, tokenizing, component-CSS normalization. **Client-JS slimming and the a11y/reduced-motion pass are a later arc**, sequenced after the CSS core lands.
4. **Sequence slice by slice.** One step → one brief → one PR. Briefs 109+ get written one at a time off `900-implementation-plan.md` + the slices.

## The styling-decision rule (Cowork's architectural call)

This is the single rule the CSS arc refactors toward, and the rule new pages follow afterward. It is an architectural decision (mine), aligned with Philipp's "keep the stack, draw the boundary" choice:

```
@theme   (globals.css)  → design tokens ONLY: colour/oklch palette, spacing, type scale, motion
base     (@layer base)  → resets, element defaults, @font-face, prefers-reduced-motion, focus-visible
Tailwind (inline JSX)   → layout + spacing + genuine one-offs. Repeated arbitrary value? Promote to a token first.
Modules  (*.module.css) → any component with >~5 rules, complex state, or animation. camelCase class names.
```

End state that defines "done" for the CSS arc: **`globals.css` holds zero component classes** — every hand-written component block migrates to its component's module; what remains is tokens + base + a11y. No hard-coded colours/sizes outside `@theme`. Keyframes co-locate with the module that uses them.

## Verified ground-truth (shared anchors)

These are confirmed against the current tree (not from the review's prose), so this brief and the next don't drift:

- **`src/app/globals.css` is ~7,200 lines.** It is the central cleanup target.
- It mixes **two palettes** in `@theme` — a post-096 `cl-*` (void/cyan/gold) set and a retained Phase-1 `void / aquila / frost / heresy` set — plus `:root` `color-mix()` aliases, plus large hand-written component blocks (`.catalogue-*`, `.atlas-*`, `.timeline-*`). Notable sub-blocks: a **~400-line `.timeline-shell--chronicle`** block ported from `public/lab/timeline-prototype/`, and a **legacy `.dm-*`** block (~line 4491).
- **~80 components carry `"use client"`** — a broad client surface, concentrated in `src/components/map/**` (disc / editor / tweaks), plus `chrono/*`, `home/*`, `ask/*`, `timeline/chronicle/*`, `atlas/*`, `chrome/*`. `src/components/Aquila.tsx` is already correctly server-only. (The client-JS slimming that acts on this is the *later* arc, not the CSS core.)

## Non-goals (the whole arc)

- **No new styling framework.** Keep Tailwind v4 `@theme` + CSS Modules.
- **Refactor, not redesign.** Visual parity is the bar for the CSS steps — the Step-1 baseline must stay green through the teardown.
- **Product worktree only.** No data / ingestion / Batches-strand work.
- **No new features.** Nothing here adds a page or a capability.

## Verify-then-act discipline (every brief in this arc)

The review is a *static* read. Before any deletion or demotion, CC greps/reads to confirm the item against the real tree, and the report flags any review claim that did **not** hold. Deletions only after a grep shows zero references; client/server demotions only after reading the actual component. This protects against removing live code or breaking navigation.

## Sequencing (to be written one at a time)

Step 1 (this brief) is the safety net and has no dependency. **Briefs 109+ will be sequenced by Cowork next session**, reading `900-implementation-plan.md` + the slices and following the CSS-core-first order Philipp chose (broadly: delete dead CSS → document + enforce the rule → `globals.css` teardown into component modules → tokenize the palettes/scales → normalize component CSS). The client-JS slimming and a11y/reduced-motion passes (which fold OQ-116) come in a follow-on arc. The exact step→brief table is intentionally not fixed here until the plan doc is read faithfully — this brief commits only to Step 1.

---

# Brief 108 · Step 1 — visual-regression baseline

> The only step implemented in this session. It touches **no** `src/` CSS, markup, or components — it photographs them.

## Goal

A committed, deterministic Playwright visual-regression suite that captures every route's current rendered appearance and runs from one npm script, so every later refactor brief can prove pixel-parity by running it.

## Context

Product worktree `chrono-lexicanum-product`. **Enumerate the routes from `src/app/**/page.tsx`** and baseline every one that renders — do not work from a hard-coded list. The set includes at least the Hub (`/`), the catalogue (`/buecher`), `/timeline`, `/map`, `/ask`, and the detail routes (`/buch/[slug]`, `/fraktion/[slug]`, `/welt/[slug]`, `/charakter/[slug]`); confirm the live set yourself.

Two things make naive screenshots non-deterministic and must be handled: **animation** (the Starfield rAF, tile/hero motion, map transitions, the chronicle prototype's star drift) and **DB-driven content** (counts and lists from Postgres). The whole value of this step is that two runs of an unchanged tree produce **identical** screenshots — otherwise the net cries wolf and the later briefs can't trust it.

## Constraints

- **Deterministic rendering.** Neutralize animation for the snapshot (force `prefers-reduced-motion`, and/or a test-only flag that stops the Starfield + transitions), wait for fonts loaded + network idle before capture, pin viewport(s), pin timezone/locale. *How* is yours.
- **Stable data.** Snapshot against a known DB state — seed/fixture, mock the data layer, or a pinned local seed. Volatile regions that can't be frozen may be masked. Pick one approach and document it; the later refactor briefs will assume it.
- **Reproducible environment.** Screenshots must regenerate identically in a defined environment (e.g. Playwright's official Docker image, or a documented Node + Playwright toolchain). You choose the mechanism. Whether the baseline is portable to Philipp's Windows machine / Vercel CI is an open question for your report (it decides whether a later step wires this into CI).
- **One script to run, one to update.** e.g. `npm run test:visual` and an `--update-snapshots` path. Tests + baseline images are committed, in a conventional location.
- **Coverage:** every rendering route incl. exactly one representative detail page per `[slug]` route. Pick stable seeded slugs; document which.
- **Zero `src/` change.** This brief adds test files, `package.json`/lock entries, screenshots, and a docs note — nothing else. `git diff` proves it. If a route genuinely can't be captured deterministically without touching a component, **stop and report** — do not quietly patch it (that finding belongs to the later client-JS / a11y arc).
- **Don't fix the reduced-motion JS gap here.** If a JS animation ignores `prefers-reduced-motion`, neutralize it for the snapshot via a test hook/flag and note the gap for the later arc — do not fix it in this brief.
- TypeScript strict, no `any`.
- **Version policy:** do not pin Playwright in this brief. Research the current stable, pin it in `package.json`, and put the rationale in your report.
- **Git:** this is code (test files + `package.json`) → task branch + PR per `CLAUDE.md` (Product strand: `codex/product-<slug>`). Announce the detected worktree/strand/branch before editing. The brief *file* is doc-only and already on `main`; flip its `status: open → implemented` inside your PR.

## Out of scope

- Any CSS / markup / component change (this is a measurement tool only).
- CI wiring — local baseline first; the CI decision is deferred to a later step. If you think CI is trivially safe and worth it, *propose* it in the report; don't add it.
- Deleting dead code, tokenizing, module migration, RSC demotion — all later briefs.
- Anything in the Batches/Data strand or outside the Product worktree.

## Acceptance

The session is done when:

- [ ] `npm run test:visual` exists and passes green on a clean checkout in the chosen reproducible environment.
- [ ] Baseline screenshots are committed for every rendering route (incl. one each of the `[slug]` detail routes).
- [ ] Two consecutive runs with no code change produce zero diffs (determinism demonstrated — say so in the report).
- [ ] A short docs note explains: how to run, how to update baselines, which seeded slugs the detail snapshots use, and the environment assumption.
- [ ] `git diff` shows **no** changes under `src/` (only tests, `package.json`/lock, screenshots, docs).
- [ ] `npm run typecheck`, `npm run lint`, `npm run build` all green.
- [ ] PR opened (not merged — Philipp merges); this brief flipped to `status: implemented` inside the PR.

## Open questions for your report

- What environment did you settle on for reproducible rendering, and how portable is the baseline — will it diff on Philipp's Windows machine or on Vercel CI? (This decides whether a later step wires it into CI.)
- How did you stabilize DB-driven content — seed, mock, or masking? Which approach should the refactor briefs assume?
- Did any route require a `src/` change to be captured deterministically? If yes, that's a finding for the later client-JS / a11y arc — describe it, don't fix it.
- Which viewport(s) did you baseline? Do you recommend a separate mobile baseline, or is one desktop width enough for the refactor's purposes?
- Anything in the review's `900-implementation-plan.md` that contradicts a baseline-first approach, or that you'd resequence — flag it for the next architect session.

## Notes

- Suggested commit shape: (1) Playwright setup + config + script; (2) route specs + first committed baseline; (3) docs note. Split however reads cleanest.
- Build this to be **trusted** — every later CSS step leans on it to prove parity. A flaky net is worse than none.
- Don't pin Playwright's version (project version policy). Research current stable, pin in `package.json`, note rationale in report.
