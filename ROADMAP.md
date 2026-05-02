# Roadmap

> A phased plan. Each phase ends in something demoable. We do not start the next phase until the previous one is shippable.

> **Plan-Reshuffle 2026-05-02.** Reihenfolge angepasst, weil Daten-Ingestion vorgezogen wird (paralleles Scrapen läuft, während Feature-Arbeit weitergeht): Phase 2 schließt mit dem Minimal-FilterRail; Phase 3 = Daten-Ingestion (vorher Phase 4); Phase 4 = Discovery-Layer (Timeline-Reshape + DB-Suche + Detail-Seiten + persönliche Bibliothek — fusioniert die alte Detail-Seiten-Phase mit neuen Ideen); Phase 5 = die übrigen zwei Tools (Cartographer + Ask the Archive — vorher unter Phase 2). EntryRail (vormals 2a.1) ist gestrichen — die Funktion wird vollständig vom Empfehlungs-Trichter in Phase 5 abgedeckt.

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

## Phase 1.5 — Build/deploy hygiene ✅ (shipped 2026-05-01, sessions 014–015)

Small but important so we don't fight the toolchain later.

- [x] CI: a GitHub Action that runs `npm run lint` and `tsc --noEmit` on every PR
- [x] Drizzle migrations run automatically on Vercel deploy (programmatic runner via `vercel-build`)
- [x] Vercel preview URLs comment on PRs (Vercel-GitHub integration default; no Action needed)
- [x] Add a `/healthz` route that pings the DB so we can monitor uptime later

---

## Phase 2 — Chronicle (Timeline) — Tool 1/3 ✅ (shipped 2026-05-02, sessions 008–013, 018–030)

Der erste der drei Tool-Räume. Aus dem Prototyp portiert, dann aufgewertet zur DB-getriebenen Detail-Modal-Erfahrung. Geschlossen mit einer schlanken FilterRail, übergeben an Phase 3 (Ingestion). Cartographer und Ask the Archive sind aus dieser Phase rausgezogen und leben jetzt in Phase 5.

### 2.0. CSS foundation + Hub polish + global chrome ✅ (shipped 2026-04-29, sessions 006–007 + 009–010)

Visual ground floor before the tool routes get touched. Token migration into `@theme`, polished Hub on the existing flowed layout, and the global chrome that every tool route sits inside. Aquila redesign (sessions 009–010) shipped in parallel — silhouette now reads as the canonical W40k two-headed eagle.

- [x] Prototype design tokens (surfaces / ink / lines / oklch accents) merged into `globals.css` `@theme`
- [x] Tailwind v4 v3-compat border-color block retired
- [x] Hub with corner-decorated tiles, kicker typography, Aquila glow, staggered tile-rise, multi-segment stats footer
- [x] `<Starfield />` 4-layer parallax canvas behind every route
- [x] `<TopChrome />` with mark-sigil + wordmark + era-toggle, fixed top of viewport
- [x] `<EraToggle />` writing `?era=…` to URL (consumed by 2a Timeline)

### 2a. Chronicle (Timeline) — done

**Slim port** ✅ (shipped 2026-04-29, sessions 008 + 011), **polish pass** ✅ (shipped 2026-04-30, sessions 012 + 013), **Schema-Foundation** ✅ (shipped 2026-05-01, session 019): Overview ribbon + EraDetail at `/timeline`, `?era=…` URL contract migrated to prototype era ids (legacy redirects in place), buzzy hover on era bands, themed focus brackets, per-era `[NNN VOLUMES]` count badges, and the works-centric DB foundation (Class-Table-Inheritance, facets, external_links, persons).

- [x] Port `OverviewTimeline.jsx` → `src/components/timeline/Overview.tsx`
- [x] Port `EraView.jsx` → `src/components/timeline/EraDetail.tsx`
- [x] Server-fetch books ordered by `startY` (no client-side `window.BOOKS` global)
- [x] Schema migration: `books`-zentriert → `works`+CTI; facets / external_links / persons; CHECK-trigger discriminator; Hub-count + Timeline-RQB on `works WHERE kind='book'`. (Stufe 2a — session 019, 2026-05-01.)
- [x] **Stufe 2b** — 26 hand-curated books with full annotation (factions, persons, facets, external_links). Cowork compiled candidate set; Philipp curated JSON by hand. Hub-Footer-Count auf ISR (revalidate 1h). Phase-3 ingestion pipeline waits for the 200+-scale that follows. (Stufe 2b — sessions 021/022, 2026-05-02.)
- [x] **Stufe 2c.0** — `book_details.primary_era_id` (explicit anchor) ersetzt das algorithmische Era-Bucketing (sessions 023/024, 2026-05-02). Migration 0004, alle 26 Bücher annotiert, `npm run check:eras`-Guardrail wired.
- [x] **Stufe 2c.1** — DetailPanel + deep-linking ported against the post-2a/post-2c.0 schema (sessions 025/026, 2026-05-02). Hero modal with curated Reading-Notes block, Sources grouped by external_link.kind, cross-era series-volume nav. URL contract `?era=<id>&book=<slug>` canonical; `?book=<slug>` resolves server-side via `book_details.primary_era_id`. Cartographer's book-pins moved to Phase 5 proper.
- [x] **Stufe 2c.2** — Hygiene-pack (sessions 027/028, 2026-05-02): `series.json` total fix for `horus_heresy_main` (10 → 54), slug-format decision documented as code-comment, `check:eras` wired into the `lint-and-typecheck` CI step.
- [x] **Stufe 2a.2 — FilterRail (Minimal-MVP)** (shipped 2026-05-02, sessions 029/030). Schlanke Filter-Schiene auf der EraDetail-View, die die in 2b annotierten Facets sichtbar/filterbar macht (Fraktion + Length-Tier). URL-State (`?faction=…&length=…`), OR innerhalb Achse / AND zwischen Achsen, server-seitige SQL-Filterung via 2-Step Drizzle (matched-IDs EXISTS → relational hydrate), Hide-axis-bei-1-Wert, Empty-State-Split (era-clear vs filter-constrained). Bewusst minimal, weil Phase 4 (Discovery-Layer / Timeline-Reshape) das Filter-Modell vermutlich neu definiert. **EntryRail (vormals 2a.1) gestrichen** — Empfehlungs-Funktion wird vom Ask-the-Archive-Trichter in Phase 5 vollständig abgedeckt.

**Aufgeschoben in Phase 4 (Discovery-Layer):**

- Cluster-collapse für dichte Eras — wartet auf Ingestion-Datenmenge plus Reshape-Entscheidung
- Pan-scrubber click-to-jump, Mobile-Touch-Test, M39–M41 encoding gap — sammeln sich im Reshape
- Tone/Theme/Content-Warning-Filter-Achsen — heben sich auf, wenn der Discovery-Layer das Filter-Modell ohnehin überholt

**Phase 2 abgeschlossen 2026-05-02:** Chronicle steht aus DB mit DetailPanel + Deeplinks + Minimal-FilterRail, deployed, alle 26 Bücher annotiert sichtbar.

---

## Phase 3 — Data-Ingestion-Pipeline (vorgezogen) — in flight

> **Reihenfolge-Wechsel 2026-05-02.** Vorher Phase 4. Vorgezogen, weil paralleles Scrapen ab jetzt im Hintergrund laufen soll, während wir in Phase 4 am Discovery-Layer bauen — die DB füllt sich, Features entstehen, beides asynchron.

Die Aufgabe ist groß und teilbar. Erste Cowork-Brief-Aufgabe der Phase ist explizit ein **Brainstorm/Research-Brief**: wie automatisieren wir Scraping so, dass es agentisch / kontinuierlich läuft, ohne Philipps lokalen Rechner zu brauchen. Mögliche Achsen, die wir dort durchgehen: Scheduled Tasks vs. GitHub Actions vs. Vercel Cron vs. Supabase Edge Functions, Provenance-Tracking, Idempotenz, Confidence-Scoring, Dry-Run-Modi.

Ziel-Set: einige Hundert gut-quellengeprüfte Bücher, mit jedem Datensatz seine Provenance-Spur (`source_kind`, `confidence` — Felder existieren schon im Schema, werden aber heute nicht gefüttert).

- [ ] **Phase-3-Brainstorm-Brief** — Architektur-Optionen für agentisches/kontinuierliches Scrapen, Trade-offs benennen, Empfehlung (Cowork + Philipp)
- [ ] `ingest/lexicanum/` — Crawler für Canon-Daten, Locations, Characters pro Buch
- [ ] `ingest/goodreads/` — Cover, ISBN, Publication-Year, Average-Rating
- [ ] `ingest/black_library/` — offizielle Synopsen (robots.txt-respektierend)
- [ ] Normalisierte JSON-Cache pro Source unter `ingest/.cache/<source>/<slug>.json`
- [ ] Merge-Step mit `confidence`-Scoring (manual > lexicanum > goodreads > black_library)
- [ ] Load-Step: idempotente Upserts in Postgres, Confidence-Werte aus 2b-Roster aktivieren (siehe Carry-over)
- [ ] Automation-Layer (Form aus dem Brainstorm): Trigger + Schedule + Dead-Letter / Retries
- [ ] Dashboard / CLI-Status: was läuft, was hat gefailed, was hat sich geändert

---

## Phase 4 — Discovery-Layer (Timeline-Reshape + DB-Suche + Detail-Seiten + persönliche Bibliothek)

> **Neuer Inhalt 2026-05-02.** Fusioniert die alte „Detail-Seiten"-Phase mit Philipps Plan für eine cineastischere Era-Erkundung und persönliche Library. Beginnt, sobald Ingestion in Phase 3 genug Daten geliefert hat, dass der Reshape-Bedarf konkret wird.

Vier Bausteine, die zusammen die „Bücher entdecken / sich erinnern"-UX bilden:

### 4a. Timeline-Reshape (cineastisch, era-zentriert, scaling)

Weg vom singulären Zeitstrahl-Ribbon. Die Era-Idee bleibt zentral, aber die Darstellung wird etwas „cooler" und vor allem für Hunderte Bücher pro Ära handhabbar (heute zerfällt der Ribbon-Approach bei der Datenmenge). Brainstorm-/Research-Brief am Phasen-Anfang. Mögliche Richtungen, die zur Diskussion stehen: Era-as-Diorama (eigene Hero-Ansicht pro Ära), zoombare Mehr-Ebenen-Timeline, Cinematic-Card-Stack, Era-Galleries mit narrativen Übergängen. Cluster-collapse, Pan-Scrubber, M39–M41-Encoding-Gap und Mobile-Touch-Polish folgen aus diesem Reshape.

### 4b. Pure DB-/Sortier-Seite („Database View")

Ohne Gimmick. Für User, die einfach nach Büchern suchen wollen: filterbare/sortierbare Tabelle aller Bücher (nach Era, Fraktion, Autor, Year, Length, Tone, Series), Volltextsuche, URL-shareable Filter-Zustand. Komplementär zur cineastischen Timeline.

### 4c. Detail-Seiten (`/buch/[slug]` etc., aus alter Phase 3)

Erst hier, weil sie aus der DB-Sicht und der Bibliothek heraus verlinkt werden müssen.

- [ ] `/buch/[slug]` — full book detail (synopsis, factions, characters, primary locations, „what to read next")
- [ ] `/fraktion/[slug]` — faction overview, sub-factions, books featuring them, key locations
- [ ] `/welt/[slug]` — world detail with map embed and books set there
- [ ] `/charakter/[slug]` — character with appearance list and primary faction
- [ ] Open Graph images per book/faction (rendered via `next/og`)
- [ ] `sitemap.xml` und `robots.txt`

### 4d. Persönliche Bibliothek (read / heard / want)

Eigene Library: was wurde gelesen / gehört / soll noch. Daraus abgeleitete Empfehlungen („du magst Eisenhorn — probier Ravenor"). Audio-Hörer-Fokus: viele Leser konsumieren nur Audio, wollen aber etwas Visuelles, das die Lektüre repräsentiert (siehe Cover-Ständer im Ideas-Backlog). Auth-Gating und Storage-Modell (Anonyme Local-Storage-Library? Account?) — eigener Architektur-Brief.

---

## Phase 5 — Die anderen zwei Tools (Cartographer + Ask the Archive)

> **Verschoben aus alter Phase 2** — die Tools sind weiterhin im Vision-Set, brauchen aber Daten und Detail-Seiten als Unterbau, also sinnvoll erst nach Phase 4.

### 5a. Cartographer (Galaxy-Map)

- [ ] Port `GalaxyMode.jsx` → `src/components/map/Galaxy.tsx`
- [ ] Server-fetch sectors + locations
- [ ] Time-Slider (filter visible book-pins by in-universe year)
- [ ] Click a location → highlights all books that take place there

### 5b. Ask the Archive (Empfehlungs-Trichter)

- [ ] Port `AskMode.jsx` → `src/components/ask/Funnel.tsx`
- [ ] Move `archive.js` scoring weights into a typed `recommend(answers)` function in `src/lib/recommend.ts`
- [ ] Persist answers in URL (`/ask/result?experience=new&faction_love=imperium&...`) for Reddit-shareability

---

## Phase 6 — Community contributions

Sobald Phase 1–5 öffentlich sind, werden Leute eigene Chapters und fehlende Bücher beitragen wollen.

- [ ] `/contribute` — public form: pick entity type (book / chapter / location / correction), fill payload
- [ ] Anonymous submissions allowed, optional email for follow-up
- [ ] Submissions land in `submissions` table with `status='pending'`
- [ ] Maintainer dashboard at `/admin/submissions` (Supabase auth-gated to Philipp's email)
- [ ] Approve → merge into canonical table; Reject → store reason
- [ ] Public credits page listing approved contributors (opt-in)

---

## Phase 7 — Polish and launch

- [ ] Custom domain (e.g. `chrono-lexicanum.de`)
- [ ] Performance pass (Lighthouse > 95 on every primary route)
- [ ] Real Open Graph images per book
- [ ] Reddit launch post + a how-to-contribute thread

---

## Ideas Backlog (not committed)

- **Book-Cover-Ständer** für Audio-Hörer — physisch oder digital, Erinnerungs-Display für gehörte Bücher. IP-sensitiv (Warhammer-Cover sind GW), Lösungspfade: eigene Cover-Render im Lexicanum-Stil, „Reading-Trophy"-Mockups statt Originale, oder Lizenz-Klärung mit Black Library. Spannender Phase-7+-Bonus.
- Reading-Order-Presets („HH chronological," „HH publication," „newcomer-friendly," „audiobook-only")
- Cross-references: „books featuring Cadia" computed live from `book_locations`
- Audiobook-Narrator-Directory
- „What's new in M42?" living timeline für aktuelle GW-Releases
- Vergleich mit den offiziellen Black Library Reading-Order-PDFs
