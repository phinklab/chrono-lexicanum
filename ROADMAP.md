# Roadmap

> A phased plan. Each phase ends in something demoable. We do not start the next phase until the previous one is shippable.

---

## Phase 1 — Foundation ✅ (shipped 2026-04-28, sessions 001–003)

The skeleton: Next.js + TypeScript + Tailwind + Drizzle + Supabase, deployed to Vercel, with the prototype's data already seeded into Postgres.

- [x] Move prototype to `archive/prototype-v1/`
- [x] Next.js + TypeScript + Tailwind scaffold
- [x] Drizzle schema covering eras, factions, series, books, sectors, locations, characters, junctions, submissions
- [x] Drizzle client + drizzle.config
- [x] Seed script that ingests the legacy `data/*.js` files
- [x] Stub routes for `/`, `/timeline`, `/map`, `/ask`, `/buch/[slug]`, `/fraktion/[slug]`, `/welt/[slug]`, `/charakter/[slug]`
- [x] Aquila SVG ported as a TSX component (proof of port)
- [x] CLAUDE.md, README.md, ROADMAP.md, ARCHITECTURE.md, ONBOARDING.md
- [x] `npm install` + first `npm run dev` succeeds locally
- [x] Supabase project created, `.env.local` filled, `db:migrate` and `db:seed` run successfully
- [x] First push to GitHub
- [x] First Vercel deploy (with env vars set in dashboard) — live at `https://chrono-lexicanum.vercel.app/`

**Phase 1.1 — stack bumps** ✅ (shipped 2026-04-28, sessions 004–005): bumped Next to its current major + Tailwind to v4. Pipeline is now CSS-first (`@theme {…}` in `globals.css`).

---

## Phase 1.5 — Build/deploy hygiene

Small but important so we don't fight the toolchain later.

- [ ] CI: a GitHub Action that runs `npm run lint` and `tsc --noEmit` on every PR
- [ ] Drizzle migrations run automatically on Vercel deploy (build hook or `postinstall` guard)
- [ ] Vercel preview URLs comment on PRs
- [ ] Add a `/healthz` route that pings the DB so we can monitor uptime later

---

## Phase 2 — Port the three tools

The prototype already has these working in JSX. Migration is "make it work in our new structure," not "redesign."

### 2.0. CSS foundation + Hub polish + global chrome ✅ (shipped 2026-04-29, sessions 006–007 + 009–010)

Visual ground floor before the tool routes get touched. Token migration into `@theme`, polished Hub on the existing flowed layout, and the global chrome that every tool route sits inside. Aquila redesign (sessions 009–010) shipped in parallel — silhouette now reads as the canonical W40k two-headed eagle.

- [x] Prototype design tokens (surfaces / ink / lines / oklch accents) merged into `globals.css` `@theme`
- [x] Tailwind v4 v3-compat border-color block retired
- [x] Hub with corner-decorated tiles, kicker typography, Aquila glow, staggered tile-rise, multi-segment stats footer
- [x] `<Starfield />` 4-layer parallax canvas behind every route
- [x] `<TopChrome />` with mark-sigil + wordmark + era-toggle, fixed top of viewport
- [x] `<EraToggle />` writing `?era=…` to URL (consumed by 2a Timeline)

### 2a. Chronicle (Timeline) — in flight

**Slim port** ✅ (shipped 2026-04-29, sessions 008 + 011) and **polish pass** ✅ (shipped 2026-04-30, sessions 012 + 013): Overview ribbon + EraDetail at `/timeline`, `?era=…` URL contract migrated to prototype era ids (legacy redirects in place), buzzy hover on era bands, themed focus brackets, per-era `[NNN VOLUMES]` count badges that scale to a real catalogue.

- [x] Port `OverviewTimeline.jsx` → `src/components/timeline/Overview.tsx`
- [x] Port `EraView.jsx` → `src/components/timeline/EraDetail.tsx`
- [x] Server-fetch books ordered by `startY` (no client-side `window.BOOKS` global)
- [ ] Port `DetailPanel.jsx` for the book pop-out (2a.3)
- [ ] URL state: `?era=horus_heresy&book=eisenhorn-xenos` deep-linkable (2a.3)
- [ ] EntryRail (2a.1) and FilterRail (2a.2) on top of the ribbon
- [ ] Cluster-collapse for dense eras (driven by Phase 4 real-book ingestion)
- [ ] Pan-scrubber click-to-jump, mobile-touch test, M39–M41 encoding gap

### 2b. Cartographer (Map)

- [ ] Port `GalaxyMode.jsx` → `src/components/map/Galaxy.tsx`
- [ ] Server-fetch sectors + locations
- [ ] Add a **time slider** (filter visible book-pins by in-universe year)
- [ ] Click a location → highlights all books that take place there

### 2c. Ask the Archive

- [ ] Port `AskMode.jsx` → `src/components/ask/Funnel.tsx`
- [ ] Move `archive.js` scoring weights into a typed `recommend(answers)` function in `src/lib/recommend.ts`
- [ ] Persist answers in URL (`/ask/result?experience=new&faction_love=imperium&...`) so a result page is shareable on Reddit

**Phase 2 is done when:** all three tools are at parity with the prototype, served from Postgres, deployed.

---

## Phase 3 — Detail pages

These don't exist in the prototype but unlock the whole "browse by topic" use case and Reddit-shareability.

- [ ] `/buch/[slug]` — full book detail (synopsis, factions, characters, primary locations, "what to read next")
- [ ] `/fraktion/[slug]` — faction overview, sub-factions, books featuring them, key locations
- [ ] `/welt/[slug]` — world detail with map embed and books set there
- [ ] `/charakter/[slug]` — character with appearance list and primary faction
- [ ] Open Graph images per book/faction (rendered via `next/og`)
- [ ] `sitemap.xml` and `robots.txt` (un-blocking SEO once we go public)

---

## Phase 4 — Data ingestion pipeline

The fun part for Philipp. Build a Python ingestion stack that fills the (currently empty) book catalog from scratch — Lexicanum as primary canon source, Goodreads for covers and ISBNs, Black Library for official synopses. Target: a few hundred well-sourced books.

- [ ] `ingest/lexicanum/` — scrape Lexicanum wiki for canon dates, locations, characters per book
- [ ] `ingest/goodreads/` — pull cover, ISBN, publication year, average rating
- [ ] `ingest/black_library/` — official synopses (respecting their robots.txt)
- [ ] Each scraper writes a normalized JSON file under `ingest/.cache/<source>/<slug>.json`
- [ ] A **merge step** combines source files into a per-book record with `confidence` scoring (manual > lexicanum > goodreads > black_library)
- [ ] A **load step** upserts into Postgres
- [ ] The ingestion is fully idempotent and rerunnable

---

## Phase 5 — Community contributions

Once Phase 1–3 are public on Reddit, people will want to add their chapters and missing books.

- [ ] `/contribute` — public form: pick entity type (book / chapter / location / correction), fill payload
- [ ] Anonymous submissions allowed, optional email for follow-up
- [ ] Submissions land in `submissions` table with `status='pending'`
- [ ] Maintainer dashboard at `/admin/submissions` (Supabase auth-gated to Philipp's email)
- [ ] Approve → merge into canonical table; Reject → store reason
- [ ] Public credits page listing approved contributors (opt-in)

---

## Phase 6 — Polish and launch

- [ ] Custom domain (e.g. `chrono-lexicanum.de`)
- [ ] Performance pass (Lighthouse > 95 on every primary route)
- [ ] Real Open Graph images per book
- [ ] Reddit launch post + a how-to-contribute thread

---

## Ideas Backlog (not committed)

- Reading order presets ("HH chronological," "HH publication," "newcomer-friendly," "audiobook-only")
- Per-user "shelves" (read / want-to-read / favorites) — needs auth
- Cross-references: "books featuring Cadia" computed live from `book_locations`
- Audiobook narrator directory
- A small "What's new in M42?" living timeline showing latest GW novel releases
- Comparison with the official Black Library reading order PDFs
