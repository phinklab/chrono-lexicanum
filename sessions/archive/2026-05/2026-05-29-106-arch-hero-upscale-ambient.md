---
session: 2026-05-29-106
role: architect
date: 2026-05-29
status: archived
slug: hero-upscale-ambient
parent: null
links:
  - 2026-05-23-096
  - 2026-05-17-079
commits: []
---

# Hero image upscaling + ambient-motion variant lab

> **▶ Zurückgezogen 2026-06-01 (Philipp).** Vorschnell erstellt und nicht ausreichend durchdacht — die Hero-/Ambient-/Upscaling-Richtung überlegt sich Philipp zuerst selbst neu. `status: open → archived`, **nicht implementiert**, kein Code gelaufen, kein PR. Der physische Archive-Move (→ `sessions/archive/2026-05/`) reitet auf dem ausstehenden Sessions-Archive-Sweep. Wird die Hero-Polish-Linie später wieder aufgegriffen, entsteht ein frischer Brief mit neuer NNN — der Inhalt unten bleibt als Ausgangsmaterial erhalten.

## Goal

Two things, both deliverable by CC end-to-end without any paid service or hand-made video: (1) **upscale** the AI-generated full-bleed background stills (`public/img/*.webp`) to crisp hi-DPI masters, and (2) build a small **lab** that shows one upscaled hero still with **several visually-distinct, procedural ambient-motion variants** — drifting fog, light-shaft shimmer, dust/ember particles, a subtle depth-parallax drift, etc. — so the maintainer can preview them side-by-side and pick. Only atmospheric elements move; the rest stays a pin-sharp still.

This brief delivers the **upscaled pilot still + the variant lab to choose from**. Wiring the chosen variant into the live `SiteBackground` is a deliberate **follow-up** once Philipp has picked (see Out of scope) — so we don't commit the production shell to a look before he's seen the options.

> **Why "variants to try" and not one cinemagraph.** First draft of this brief leaned on CC to *generate* the motion (a pre-rendered AI image-to-video loop). That was wrong: generating such a loop means logging into a paid service, paying, iterating creatively, and masking — none of which CC does autonomously in a terminal, and self-hosted video models need a GPU it doesn't have. What CC *can* own completely is **procedural, code-based motion** (WebGL / canvas / CSS / SVG over the still). So the deliverable is a menu of procedural variants. Pre-rendered AI loops stay an **optional, later, maintainer-driven** drop-in (§ Notes), not part of this brief's generation.

## Design freedom — read before everything else

Everything about how the upscaled stills and each motion variant *look and read* is yours — you have the `frontend-design` skill that I don't. I specify only that the stills get sharper, that there are **several genuinely different** procedural treatments to compare (different technique families, not one effect in five tints), that only atmosphere moves, and the perf/accessibility outcomes below. **You decide** all of:

- **how many** variants and **which technique families** to build (some candidates in § Notes — pick the ones worth comparing, add your own);
- **what** moves and how much per variant — region (sky, light shafts, smoke, dust, ring glow), drift speed, amplitude, opacity, loop feel, "alive" vs. "barely-there";
- the **lab's** shape — a `/lab` route or a `public/lab/` page, how variants are switched/labelled, whether they show side-by-side or one-at-a-time (follow the existing lab precedent, your call);
- the **upscaler** and settings (Real-ESRGAN/Upscayl or another — your research), target resolution, format, sharpen/denoise; and the per-variant encode/asset details if any;
- poster / placeholder / fade-in, how motion sits within the existing `.site-bg__vignette` + `.site-bg__grain` look;
- component names, class shapes, tokens, any shaders/noise functions.

If you catch me prescribing a pixel, an fps, a millisecond, a colour, or a class shape below — ignore it, it's an accident. Acceptance is outcomes for exactly this reason. Voice/precedent: `sessions/archive/2026-04/2026-04-29-009-arch-aquila-redesign.md`, `2026-04-29-006-arch-css-hub-polish.md`.

## Context

State today (post-PR-111, 2026-05-28): corpus data-complete (859/859); the design-direction shell (Brief 096 A–F) is merged. Relevant facts, confirmed from the tree:

- **The AI backgrounds live at `public/img/*.webp`:** `hub`, `vista`, `librarium`, `chronicle-hall`, `cartog-hall`, `cartog-holo` (+ `books`). These are the "Hero / Hintergründe" in scope.
- **`src/components/chrome/SiteBackground.tsx` is a Server Component** that renders the photo as a **CSS `background-image`** on `.site-bg__photo`, with `.site-bg__vignette` + `.site-bg__grain` over it; pages opt in via a `variant` prop mapped in a `PHOTOS` record. Not a `next/image` pipeline today.
- **Reduced motion is already a project convention** — `HeroDescent.tsx` reads `matchMedia('(prefers-reduced-motion: reduce)')` and notes it's handled centrally in `globals.css`. Extend that; don't invent a parallel one.
- **There's a lab precedent** — `public/lab/` exists and Brief 079 (Lab-Cartographer-Prototype) established the "build a throwaway preview to evaluate before wiring into the app" pattern. This brief's lab follows it.

### What CC can and can't do here (the honest split)

- **Integration = CC.** The lab, the variant components/shaders, the eventual progressive-enhancement layer, perf, a11y — all code, all yours.
- **Upscaling = CC or Philipp.** CC can run an open-source upscaler locally (Real-ESRGAN / Upscayl CLI — no login, no cost), *or* Philipp upscales with his own tool (Topaz etc.) and hands CC the files. Either is fine; pick whichever is cleaner on the machine and say which you used. If a local depth map is needed for a parallax variant, Depth-Anything / MiDaS run locally too.
- **Motion generation = procedural only in this brief.** No paid image-to-video service, no login-walled tool, no GPU-heavy self-hosted model in CC's path. If you think a variant genuinely needs a pre-rendered asset, **don't generate it** — note it as a maintainer-driven option instead and build the procedural ones.

### Shape

Single **Product strand** (`chrono-lexicanum-product`). Two phases:

- **Phase 1 — Upscale the pilot still** (the `hub` backdrop is the obvious pilot; your pick) to a sharp hi-DPI master + web-optimized derivative.
- **Phase 2 — Variant lab** over that upscaled still: several distinct procedural ambient-motion treatments, switchable, for Philipp to preview and choose.

Production wiring of the winner into `SiteBackground` is **not** in this brief — it waits on Philipp's choice (§ Out of scope).

## Constraints

- **No version pins** anywhere — research and pin the tools/libraries yourself (CLAUDE.md § version policy). Naming a tool/technique *family* to research is fine; a version number is not.
- **Motion variants are procedural / code-based.** No paid AI-video service, no login-gated generator, no GPU-heavy self-hosted model on CC's critical path. WebGL / canvas / CSS / SVG (optionally a locally-generated depth map) only.
- **The static upscaled image is the server-rendered default and the LCP element** in any real use, and the base layer in the lab. A variant is an enhancement *over* the still — with JS off, before it loads, or under reduced motion, the still alone must look right and not break.
- **`prefers-reduced-motion: reduce` ⇒ no autoplaying motion** in every variant — static still only, via the existing central convention. Non-negotiable, and it must be checkable in the lab.
- **Motion pauses when unseen** — off-screen (IntersectionObserver) and tab hidden — to spare CPU/battery. Anything video-like autoplays muted + inline.
- **Performance budget.** Each variant stays light and deferred; no layout shift (reserve aspect ratio); the still is never blocked by the effect. Keep within the "no slow dev experience" rule (CLAUDE.md). Report a rough cost per variant (asset/JS weight, and whether it's GPU-cheap) so the production pick is informed.
- **Server components by default** — if/when wired into `SiteBackground`, it stays a Server Component with only a small client island for motion control. (The lab page itself may be client-side; it's a preview.)
- **No schema / DB / migration / runtime AI / runtime upscaling.** Static assets + front-end only. Nothing touches Postgres, seed data, resolver, or ingestion. Upscaling happens at authoring time.
- **Strand discipline (Brief 095 / Rollup-ownership).** The Product strand does **not** write `brain/**` or `sessions/README.md`. Substantive facts (upscaler chosen, variant families built, per-variant cost, which you'd recommend) go in the impl report; I fold them into the wiki in the post-merge pass.

## Out of scope

- **Wiring the chosen variant into the live `SiteBackground`** — explicitly a follow-up after Philipp picks from the lab. Don't restyle the production shell in this brief beyond what the lab needs. (If wiring the *winner* turns out trivial and Philipp picks during the session, a thin production hookup is welcome — but the lab is the contract.)
- **Pre-rendered AI-video / image-to-video generation** of any kind — optional, later, maintainer-driven (§ Notes). Not generated here.
- **Per-book cover art, thumbnails**, entity imagery beyond the shared `SiteBackground` set, `/buch/[slug]` art.
- **The map and timeline canvases** — `/map` polish, SMIL hazard zones, Brief 096 G+H. (The `cartog-holo` *backdrop* could be a still/variant target later; the interactive plot-room is not.)
- **No new image CDN / loader / `next/image` migration** unless it's genuinely the simplest way to ship hi-DPI for a CSS background — if so keep it minimal and justify it.
- The open-questions queue (**OQ 3** hand-check workflow, **OQ 13** crawl-simplification) and standing watch-items (Brief 104, Brief 105, the sessions-archive sweep + NNN-collision fix, legacy-token cleanup, Brief 096 G+H) are **not** addressed here and remain queued.

## Acceptance

### Phase 1 — Upscale pilot still

Done when:

- [ ] The pilot background (`hub` or your pick) exists as a sharp hi-DPI master + web-optimized derivative; visibly crisper than the current asset at large sizes, no AI-mushy edges.
- [ ] The report records who upscaled it (CC via OSS CLI, or Philipp-provided), the tool/settings, and before/after weight.
- [ ] Build green, lint clean, `tsc --noEmit` clean.

### Phase 2 — Variant lab

Done when:

- [ ] A lab page presents the upscaled pilot still with **several genuinely distinct** procedural ambient-motion variants (different technique families — aim for ~3–4+ that are worth comparing, not one effect re-tinted), each clearly labelled and switchable.
- [ ] In every variant, only atmospheric elements move; the rest stays a sharp still, and each loops without a visible seam.
- [ ] Every variant honors `prefers-reduced-motion: reduce` (falls back to the static still), and this is demonstrable from the lab.
- [ ] Motion pauses off-screen / tab-hidden; anything video-like is muted + inline.
- [ ] No layout shift; the still renders first and the effect layers on after; each variant stays light (report rough per-variant cost and which is GPU-cheap).
- [ ] The report names the variants built, what each does, rough cost, and **which CC would recommend** for production — plus how Philipp previews the lab locally (route/path + how to switch).
- [ ] Build green, lint clean, `tsc --noEmit` clean.

## Open questions

Inputs I'd value in the report — not blockers:

- Which technique families did you build, and which read best over *these* gothic backgrounds (and which fell flat)?
- Rough cost per variant — JS/asset weight, GPU-cheap or not? Any that you'd rule out on perf grounds for production?
- Did the OSS upscaler hold up on these AI stills, or did one need a different approach? If you needed a depth map (parallax variant), did it run locally cleanly?
- Your single recommendation for the production default, and why.
- Anything that made you wish for a pre-rendered loop after all (so we can scope the optional maintainer-driven path realistically)?

## Notes

- **Candidate technique families (illustrative — pick/extend, NOT a spec):** (a) a drifting translucent **fog/cloud overlay** blended over the still; (b) a slow **light-shaft / god-ray shimmer** on the cathedral light; (c) **particle drift** — dust motes, embers, ash; (d) a **noise-displacement** shimmer (heat-haze) on a masked region; (e) a **2.5D depth-parallax** drift from a locally-generated depth map (a *different kind* of motion — camera, not rising steam — worth one slot for comparison). All are code; none need a paid service.
- **The optional later path (maintainer-driven):** if, after seeing the procedural variants, Philipp wants the photoreal "exact painted smoke animates" look, that's a pre-rendered AI cinemagraph — *he* (or he-with-an-API-key) generates a seamless loop via a hosted service, and a thin follow-up wires it in as a `<video muted loop playsinline>` with the still as poster. Keep the eventual still↔motion pairing shaped so a video file could drop into the same slot a procedural layer uses — but don't build or generate it now.
- **Illustrative only (NOT an implementation):** the eventual pairing might read `MOTION: Partial<Record<SiteBgVariant, MotionSpec>>` where a spec is either a procedural-variant id or a loop URL. Shapes are yours.
- This is a maintainer-requested polish item on the public-launch path — no roadmap/DB movement, mirrors how Brief 105 opened a line without an OQ. Lab precedent: Brief 079.
- **Strand:** single Product strand; branch from `origin/main` in `chrono-lexicanum-product` as `codex/product-hero-upscale-ambient` (or your slug), PR, flip this brief's `status: open → implemented` inside that PR.
