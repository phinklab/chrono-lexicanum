---
session: 2026-06-26-166
role: implementer
date: 2026-06-26
status: complete
slug: ask-hub-one-faction-one-book
parent: 2026-06-26-166
links: [2026-06-24-164, 2026-06-03-121]
commits: []
---

# 166 — Find your next book: Ask-Hub + „1 Faction, 1 Book" + Diamond-Rückbau (121-Product)

## Summary

`/ask` is now a two-way "Find your next book" hub: the unchanged Brief-164 questionnaire and a new "One faction, one book" tool at `/ask/fraktion`, both reachable through a shared tab switch. After a maintainer eyeball pass the faction tool is a **client carousel** (one faction per slide, book shown immediately, jump rail + arrows + arrow-keys, chapter chips that swap the book in place) sitting inside the **exact `/ask` shell** (photo hero, scroll-darken, snap) so switching tabs never jumps to a different layout. The one fact Cowork needs: **the Zwischenstep is closed** — Philipp's overrides are applied, so 60/70 curation picks link to a `/buch/{slug}`, and the remaining **10 are intentionally unlinked** (audio-dramas / series with no single corpus book) and are the DB-Nachpflege list.

## What I did

**(1) Excel → JSON convert pipeline (DB-free, deterministic, re-run-stable)**
- `scripts/import-faction-starters.ts` — new `npm run import:faction-starters` (modeled on `import-ssot-roster.ts`). Reads both sheets of `Warhammer_OFOC_SSOT.xlsx` via `readSheet(FILE, name, {trim:false})`, forward-fills `Main faction`, skips blank spacer rows, comma-splits `Alternative` into extra picks, strips parenthetical format markers (`(Audiodrama)`/`(Audiobook)`/`(short story?)`) into `kind`/`note`, keeps `Series`/`trilogy`/`Omnibus` as a `kind` hint. Tolerant title→slug resolution against `book-roster.json` (normalize + drop the `the` stopword + Levenshtein/token-sort fuzzy). Fail-loud **only** on malformed rows / header mismatch / unknown `Main faction` / **a non-existent override slug** — never on a resolution miss. Writes `faction-starters.json` + `faction-starters.review.md`.
- `scripts/seed-data/faction-starters.overrides.json` — maintainer corrections keyed by verbatim title; Philipp's 19 links + 10 unlinks live here, plus a `labelOverrides` map (verbatim label → corrected **display** label, e.g. `Nekrons → Necrons`, `Tau → T'au Empire`, `Adeptus Sororitas → Adepta Sororitas`).
- `scripts/seed-data/faction-starters.json` — generated. 18 factions, 26 subfactions, 70 picks, **60 linked** (36 exact + 5 fuzzy + 19 override), 10 unlinked. Display labels + slugs reflect `labelOverrides` (clean URLs, e.g. `/ask/fraktion/necrons`, `/ask/fraktion/tau-empire`).
- `scripts/seed-data/faction-starters.review.md` — generated hand-gate; now only the 5 fuzzy audit rows, 0 uncertain, 0 not-found.
- `scripts/seed-data/source/Warhammer_OFOC_SSOT.xlsx` — Philipp's source, committed for reproducibility.

**(2) Faction tool UI** (`/ask/fraktion`, SSR drilldown, runtime DB-free)
- `src/lib/ask/faction-starters-schema.ts` — JSON-free types + `validateFactionStarters()` (structural: label + ≥1 pick-with-title or ≥1 child; children exactly one level; unique sibling slugs) + pure lookups. Shared with the convert step (no circular JSON dep).
- `src/lib/ask/faction-starters.ts` — app loader: static JSON import → `validateFactionStarters` at module init → re-exports.
- `src/app/ask/fraktion/[[...segments]]/page.tsx` — optional catch-all, `generateStaticParams` pre-renders all 45 nodes (picker + 18 factions + 26 subfactions). `notFound()` on >2 segments or bad slug. Renders the **same shell as `/ask`** (`main.ask.route-snap` + `SiteBackground` + `ScrollScrim` + `GhostReadout`/`FloatingCoord` + full-height `route-act` hero + `route-body-snap` grid); the URL segments seed only the carousel's initial slide.
- `src/components/ask/FactionCarousel.tsx` (`"use client"`) — the tool. One faction per slide with its curated book shown immediately; navigation via prev/next chevrons, `ArrowLeft`/`ArrowRight` keys, and a jump rail of all 18 factions (active one lit). Sub-faction armies (Space Marines, Chaos, Astra Militarum) render **chapter chips** that swap the shown book in place; Astra Militarum (own pick + children) leads with an "Overall" chip. All navigation is pure client state — the URL segment only seeds the first slide — so picking a faction or chapter **never navigates and never jumps the page to the top**. Replaces the original server `FactionFinder` roster (deleted).
- `src/components/ask/FactionPickPanel.tsx` (`"use client"`) — the verdict block of a slide: pick #1 + reshuffle (relabeled **"Alternative"**; ephemeral `useState`, wrap-around, only when ≥2 picks; remounts per faction/chapter so it resets to pick #1); resolved pick → `<Link href="/buch/{slug}">` (existing intercepting modal). Kicker simplified to just "Entry point" — the slide header carries the faction/chapter name.
- `src/app/styles/54-ask-faction.css` — carousel styles (jump rail, stage, **frameless chevron arrows**, slide **pinned to the top** of the snapped section via `justify-content:flex-start` so the faction title doesn't drift as slide height changes, chapter chips) + reveal animation gated on `prefers-reduced-motion`; `@import`ed after `53-ask.css`.

**(3) Hub framing**
- `src/components/ask/AskToolTabs.tsx` (server) — the two-way switch, rendered in both masts (`aria-current="page"`).
- `src/components/ask/AskClient.tsx` — tabs inserted into the questionnaire mast; eyebrow/title/sub reframed. Questionnaire **logic untouched** (Brief-164 param contract, matrix hot-path, deep-links).
- `src/app/ask/page.tsx` — `metadata` + `ASK_READOUT_LINES` reframed to the hub voice; recommendation flow unchanged.

**(4) Diamond rollback**
- `src/components/ask/QuestionCard.tsx` — removed the leading `◇/◆` glyph; selection now reads as a gold left-rule + gold label on `data-selected`/`aria-pressed`.
- `src/app/styles/58-ask-booklist.css` — `.ask-opt` reflowed to a single column with a `::before` gold bar; `:focus-visible` added. `ResultCard` "◆ Top match" marker left untouched.

## Decisions I made

- **Zwischenstep — applied Philipp's calls verbatim, nothing invented.** A (14 confident corpus matches) + C (10 unlinks `""`) as proposed; B (his explicit picks): `Ghazghkull Thraka → ghazghkull-thraka-prophet-of-the-waaagh`, `ciaphas cain series → ciaphas-cain-the-anthology`, `Deathwatch the Omnibus → deathwatch`, `Farsight crisis of faith → farsight`, `Death Korps Novels (…) → krieg` (the first one). **Verified all 19 slugs exist in `book-roster.json` before writing.**
- **Added a fail-loud guard for override slugs.** A non-empty override pointing at a slug not in the corpus now aborts the convert with a clear error, rather than silently shipping a `/buch/{slug}` that 404s in the modal. This extends the brief's fail-loud set (malformed input) without touching the "never fail on a resolution miss" rule.
- **Split JSON-free schema from the JSON-importing loader** so the convert step and the app share one validator without the script pulling a JSON dependency.
- **Dropped `the` as a normalization stopword** — it turned three real matches (Grey Knights / Night Lords omnibus, Lords of Silence) from uncertain into exact, with no false positives in the corpus.
- **Fuzzy auto-links are surfaced in the review even though they link** — typo-tolerant matches (e.g. `Space Wolfes Omnibus → The Space Wolf Omnibus`) are auditable, not silent.
- **Faction page mirrors the full `/ask` shell (maintainer eyeball pass).** An earlier cut stripped `route-snap`/`route-act`/`route-body-snap` and used a compact mast, which made switching tabs jump to a visibly different layout. Philipp asked for them to match exactly, so the faction page now carries the identical shell (photo hero, `ScrollScrim` darken-on-scroll, snap stops). The carousel — not a compact mast — lives in the snapped body, and that body grid is pinned to the top (`justify-content:flex-start`) so a taller/shorter book doesn't re-centre the block and drift the faction title.
- **Carousel over the SSR drilldown (maintainer eyeball pass).** The original `FactionFinder` navigated on every faction/chapter pick, which reset scroll to the top and read as cramped. Replaced with a pure-client carousel: the URL seeds the initial slide (deep-link + SSR preserved), but all navigation is client state — picking a faction or chapter swaps the slide/book in place with no router navigation. Frameless chevron arrows + arrow-key support + a jump rail of all 18 factions.
- **Faction-name spelling fixed through the pipeline, not the generated JSON.** A `labelOverrides` map in `faction-starters.overrides.json` (verbatim → corrected display label) is applied in `import-faction-starters.ts` **before** slug derivation, so both display names and URLs come out clean (`Nekrons → Necrons`/`necrons`, `Tau → T'au Empire`/`tau-empire`, `Adeptus Sororitas → Adepta Sororitas`, `Genestealer → Genestealer Cults`, plus `Space Wolves`/`Emperor's Children`/`Black Legion`). The In-Depth subfaction matching is keyed on the **raw** label, so a display correction can never change which Excel rows attach to which faction. Debatable names aligned to the canonical `factions.json`. Excel stays SSOT; re-running the convert is stable.
- **Nested sub-route over a query param** for the drilldown seed (`/ask/fraktion/[faction]/[subfaction]`), per the brief's "im Zweifel die Sub-Route" — deep-linkable and SSR at both levels.

## Verification

- `npm run import:faction-starters` — clean: `picks 70 | exact 36 | fuzzy 5 | override 19 | unlinked 10`, review `uncertain 0 | not-found 0`.
- `npm run typecheck` (`tsc --noEmit`) — pass.
- `npm run lint` (`eslint .`) — pass.
- Data-layer harness (throwaway, deleted): fed the real generated JSON to `validateFactionStarters` — passes; confirmed 2 group nodes (Space Marines, Chaos Space Marines), 16 leaf nodes, and that `generateStaticParams` resolves all 45 nodes.
- Server/client boundary reviewed by hand: the page (server) passes only serializable plain data (`nodes` + the initial faction/sub slug strings) to `FactionCarousel` (`"use client"`), which in turn hands `FactionPickPanel` plain picks.
- **Maintainer eyeballed in the browser** (the standing "Philipp eyeballs it" preference): confirmed the tab switch reads as the same page, the carousel jump-rail/arrows/arrow-keys and chapter chips, spelling fixes, the frameless arrows, the pinned (non-drifting) faction title, and the "Alternative" reshuffle. No headless/route sweep.

## Open issues / blockers

None blocking. The 10 unlinked picks render their title with a "Not in the archive yet" affordance (no dead link) until the books exist in the corpus.

## For next session

- **DB-Nachpflege (10 unlinked picks):** `Our Martyred Lady (Audiodrama)`, `Rose at War`, `Rose in Darkness`, `Watchers of the Throne Series`, `Lelith Hesperax`, `The Great Devourer Omnibus`, `The long and hungry road`, `Lords OF Blood: Blood Angels Omnibus`, `Masters of the Hunt`, `Deathworlder`. When these enter the corpus, swap the `""` override for a slug and re-run — the review will re-surface anything still missing.
- The 5 fuzzy auto-links are linked but flagged in `faction-starters.review.md` for a confirmation glance.

## References

- `scripts/import-ssot-roster.ts` — the convert-step pattern this followed.
- `scripts/seed-data/book-roster.json` — the resolution corpus (889 books).
