---
session: 2026-05-29-105
role: architect
date: 2026-05-29
status: implemented
slug: buy-listen-links
parent: null
links:
  - 2026-05-27-103
  - 2026-05-23-096
commits: []
---

# Buy/listen links + audiobook narrators (Cluster A)

## Goal

Give every book page a clear way to **buy or listen** — an Amazon link that lands each visitor in their own regional store, a Black Library link, and (where an audiobook exists) an Audible link plus the audio credits (narrator / co-narrator / full cast). No affiliate program yet; build it so affiliate is a later config-swap, not a rebuild.

This is **Cluster A of three** from the 2026-05-29 Cowork planning session. The maintainer's larger vision — make each book "handhabbar" (timeline placement, map placement, character travel paths), podcasts, and faction/theme hubs — is split into A → B → C. **A is commerce + audio links.** B (curated character travel paths on the map) and C (podcasts + hub) are separate future briefs and are **out of scope here** (see § Out of scope).

> **Revised 2026-05-29 after a CC review of the first draft.** Four findings folded in: narrator data would be silently wiped by the override apply path (P1), provenance had no home (P1), the audio roles were too narrow (P2), and the UI acceptance had no testable data anchor (P2). Details inline; the review's code references checked out.

## Design freedom — read before everything else

Everything about how the buy/listen actions *look and read* is yours, and you have the `frontend-design` skill and the bespoke `/buch/[slug]` page (Brief 096 Phase D) that I don't. I am specifying only that the actions exist, link to the right place, and localize. **You decide** all of:

- placement and grouping of the buy/listen actions on the book page, and whether they're buttons, links, a row, a panel, an overflow menu, whatever reads best in the existing bespoke layout;
- visual treatment — colors, spacing, type, iconography (store glyphs or not), hover/active/focus states, any animation or timing;
- the exact copy/labels ("Buy on Amazon", "Listen on Audible", "Black Library", credit wording — "Narrated by …" / "Full cast" / "Sprecher: …", language to match the rest of the page);
- whether and how a region indicator / region switcher appears, if you want one at all (the default link already localizes server-side — a switcher is a nicety, your call);
- how the page looks when there's *no* audiobook data (omit the Audible action, fall back to an Audible search link, etc.);
- how the audio credit renders for a full-cast drama vs. a single narrator;
- class shapes, tokens, and any component extraction.

If you catch me prescribing a pixel, a class, a label string, or a layout below — ignore it, it's an accident. Acceptance is written as outcomes for exactly this reason. Voice/precedent: `sessions/archive/2026-04/2026-04-29-009-arch-aquila-redesign.md` and the other design-freedom briefs.

## Context

State today (post-PR-111, 2026-05-28): corpus is data-complete and consolidated — **859/859 books** (565 W40K + 294 HH) in Postgres. The bespoke `/buch/[slug]` page exists (Brief 096 Phase D). Goodreads ratings are populated; faceting is rich; faction/location/character tags are partial.

What's relevant for this brief, confirmed from the schema, the seed data, and the apply path:

- **`services` already has the storefronts we need** — `amazon` (domain `amazon.com`), `audible` (`affiliateSupported: true`), `black_library`. No new service rows.
- **`external_links`** carries `kind` (`buy_print | listen | read | reference | …`), `serviceId`, `url`, `region` (nullable), `affiliate` (bool, default false). It can express everything here — but see the architectural call below: we don't necessarily need to *store* the storefront links.
- **Audio credits need no schema change** — `persons` + `work_persons`, and `role` already includes `narrator`, `co_narrator`, `full_cast`. **But** (review finding, verified): the override apply path **deletes *all* `work_persons` for a work and re-inserts only authors + editors** (`scripts/apply-override.ts` ~L1024 delete, L1008–1027 author/editor-only insert). A naive narrator insert would be **silently wiped on the next resolver/SSOT re-apply** — and those re-applies happen every wave/consolidation. So audio credits need a *durable* path, not a one-off insert (see Constraints + Data-pass acceptance).
- **`work_persons` has no `rawName`** (only `note`) — unlike the faction/location/character junctions, which is where the original draft's "provenance consistent with the person-loading path" was wrong: the author/editor path carries no provenance at all. Provenance for 859 researched audio credits therefore lives in a **committed source file**, not a junction column.
- **The SSOT roster carries only `authors`/`editors`** — no narrators, no store links, no ISBNs beyond what the Open-Library crawl filled into `book_details.isbn13/isbn10` (partial). So audiobook existence + credits are the one genuinely *missing* datum; storefront links are derivable.

Decisions already made with the maintainer this session (so you don't have to re-litigate them):

- **No Library/WorldCat link** in this pass (deferred, cheap to add later).
- **No affiliate tags now.** We looked at Amazon OneLink; it's an Associates-account feature and we're not enrolling yet. We replicate only the *visible* behavior (visitor lands in their local store) ourselves, server-side, with no account. Affiliate is an explicit later revisit.
- **Audio depth = link + credits.** No runtime/ASIN, no `audio_editions` table (that was the option the maintainer did *not* pick).

### Shape: two passes, two strands

Mirror the Brief 103 split — one brief, two implementer passes:

- **Data pass (Batches strand, `chrono-lexicanum-batches`):** source audiobook existence + credits into a committed sidecar (`scripts/seed-data/audiobook-narrators.json`) and apply them durably to `persons` + `work_persons` (see acceptance).
- **UI pass (Product strand, `chrono-lexicanum-product`):** render the buy/listen actions on the book page and build the geo-localized, affiliate-ready link util.

Order: the UI pass degrades gracefully where audio data is absent, **but** its audiobook-rendering acceptance must be verified against at least one book that *has* audio credits — so either the data pass lands a pilot first, or the UI pass seeds a small local smoke fixture for its own verification (see UI acceptance). Don't let the "either order" freedom leave the audiobook rendering untested.

### Architectural call: derive storefront links, don't store them

For Amazon and Black Library, **build the URL at render time** from the book's title (and ISBN when present), not a stored/scraped per-book link. Rationale — "simplest thing first" (`cowork-session.md`; this is exactly the Hardcover-arc lesson): a deterministic search/lookup URL needs zero sourcing for 859 books, never 404s, and geo-localizes by swapping the TLD. A stored deep link would mean validating 859 URLs that then go stale. The trade is a search-results landing instead of a product page — acceptable for v1, and upgradeable later (deep links / ASIN as a refinement, or maintainer overrides via `external_links` rows for the rare ambiguous title). So this brief writes **no `external_links` rows and needs no schema migration** — the only persisted new data is the audio credits (sidecar → `persons`/`work_persons`).

## Constraints

- **No version pins** anywhere (you research and pin; CLAUDE.md § version policy).
- **Server components by default.** The default localized link must resolve **server-side** from the request's region/locale (Vercel geo headers / `Accept-Language`) — no mandatory client JS to get a correct link. A region switcher, if you build one, may be a small client island.
- **No schema migration.** Use the existing `persons` / `work_persons` / `services` / `external_links`. If you become convinced a schema change is genuinely needed, **stop and surface it as `needs-decision`** rather than inventing a table.
- **Durable audio credits (the P1 fix).** Audio credits must survive a later resolver/SSOT re-apply. The binding outcome: a re-apply of an audio-bearing work does **not** drop its credits. Recommended mechanism (do this unless you have a cleaner one): scope the override apply's `work_persons` delete to author/editor roles only — so it stops clobbering `narrator`/`co_narrator`/`full_cast` — and apply audio credits from the committed sidecar via a small idempotent script modeled on the existing override-apply pattern (`work_persons` PK is `(workId, personId, role)`, so insert-on-conflict-do-nothing is idempotent). Both halves are needed: scoping the delete is what makes it durable, the sidecar+script is the source.
- **Provenance lives in the committed sidecar**, not in a junction column (`work_persons` has no `rawName`). The sidecar is the reviewable source of truth; DB rows are derived from it.
- **Listen-credit roles = `narrator` | `co_narrator` | `full_cast`.** Black Library audio dramas are frequently full-cast, not single-narrator. Treat all three as audiobook signals (gating the Audible action and the credit display).
- **Data pass — simplest source first.** Spot-check ~15–20 representative books (mix of modern in-print and older paperbacks, W40K + HH) for audiobook existence + findable credits **before** building any bulk machinery. If a plain web search per book covers it (as it did for Goodreads ratings), use that. Don't build a multi-stage client/override loop unless the spot-check proves it's needed.
- **Affiliate-ready, affiliate-off.** Construct store URLs through a single util that can later accept an affiliate tag (injected from config) **without changing call sites**. Ship it with **no tag**. Don't add an Associates/OneTag integration now.
- **Strand discipline (Brief 095 / Rollup-ownership).** Neither strand writes `brain/**` or `sessions/README.md`. Substantive facts (coverage numbers, source chosen, spot-check result, durability-mechanism choice) go in the impl report; I fold them into the wiki in the post-merge pass.

## Out of scope

- **Cluster B** — character travel paths, map coordinates (`gx/gy` backfill), in-universe dating (`startY/endY`), any `journeys` model. Separate future brief.
- **Cluster C** — podcasts, new work-kinds, faction/theme hub pages. Separate future brief.
- **Library/WorldCat link**, **affiliate tags / OneLink / OneTag integration**, **runtime/ASIN/`audio_editions`** — all explicitly deferred.
- Don't touch the resolver/SSOT pipeline **beyond the one narrow change** of scoping the `work_persons` delete to author/editor roles (so audio credits survive re-apply). Leave the audit cockpit, Brief 104's alias work, and all faction/location/character junctions alone.
- Don't refactor the `/buch/[slug]` page beyond what's needed to host the actions and fix the person ordering; don't restyle unrelated parts of it.
- The open-questions queue (OQ 3 hand-check workflow, OQ 13 crawl-simplification) and the standing watch-items (Brief 104 alias-aware drift, sessions-archive sweep + NNN-collision fix, Brief 096 G+H) are **not** addressed here and remain queued — this brief opens the commerce/audio line and defers them.

## Acceptance

### Data pass (Batches)

The pass is done when:

- [ ] A spot-check of ~15–20 books (mix of modern in-print and older paperbacks, W40K + HH) is documented in the report: what share have an audiobook, how reliably credits were findable, and which source is cheapest.
- [ ] Audio credits live in a committed source — `scripts/seed-data/audiobook-narrators.json` (or equivalent), keyed by `externalBookId`, each credit carrying name, role (`narrator`/`co_narrator`/`full_cast`), source URL, `checkedAt`, and `confidence`.
- [ ] A small idempotent apply script writes those credits to `persons` + `work_persons`; a documented re-run produces no duplicates.
- [ ] **Durability is verified:** after applying audio credits, a resolver/SSOT re-apply of an audio-bearing work leaves its credits intact (i.e. the override apply no longer clobbers non-author/editor roles).
- [ ] Canonical tables uncorrupted; verify/test suite green (`tsc --noEmit`, lint, resolver tests as applicable).
- [ ] The report states coverage: how many books got audio credits, broken down W40K / HH, and how many were full-cast vs. single-narrator.

### UI pass (Product)

The pass is done when:

- [ ] `/buch/[slug]` shows buy/listen actions: an **Amazon** link, a **Black Library** link, and — where any listen-credit role (`narrator`/`co_narrator`/`full_cast`) exists — an **Audible** link plus the credit (full-cast rendered sensibly, not as a lone narrator).
- [ ] Persons render in a coherent order (authors/editors vs. audio credits grouped, ordered by role then `displayOrder`); the current person query has no `orderBy` (`src/app/buch/[slug]/page.tsx` ~L73) — fix it as part of this.
- [ ] The audiobook rendering is verified against at least one book with audio credits (pilot data from the data pass, or a local smoke fixture).
- [ ] The Amazon (and Audible) link **resolves to the visitor's regional store** with a sensible default when the region is unknown; verified for at least two regions (e.g. a DE vs. a US/UK request hits different TLDs).
- [ ] Store URLs are built through one util that can later take an affiliate tag from config without touching call sites; **no tag ships** today.
- [ ] A book with **no** audio credits renders cleanly (Audible action omitted or a graceful fallback — your call), with no errors.
- [ ] Build green, lint clean, `tsc --noEmit` clean.

## Open questions

Inputs I'd value in the report — not blockers:

- Did scoping the apply's `work_persons` delete prove clean, or did a different durability mechanism work better? Any other code path that re-applies `work_persons` and would also need the same treatment?
- Did the spot-check confirm web search as the cheapest credit source, or is there a structured Black Library / Audible listing that's cheaper and cleaner? Is the sidecar field set right, or would you add/drop a field?
- Are derived search links good enough UX in practice, or do enough titles land on a bad search result to justify stored deep links / ASINs as a follow-up refinement?
- Which markets did you map for geo-localization, and what's the default fallback domain when region is undetectable?
- Any titles where storefront derivation is unreliable (ambiguous/colliding names) that would warrant a stored `external_links` override later?

## Notes

- **OneLink finding (for the maintainer's later affiliate revisit):** Amazon OneLink is the official "one link, auto-localized, commission attributed per region" tool, and it auto-enrolls you in the supported regional programs — but it requires an Associates account. When the maintainer wants affiliate on, it's: register Associates (home marketplace, e.g. `.de`), add the OneTag script to the shell, drop the tag(s) into config. Because store URLs go through one util here, that becomes a config change, not a code change. Books pay ~4.5%; Audible pays a per-trial bounty (~$5–10, up to ~$25/year) — the more meaningful lever for an audiobook-heavy audience, which is why the Audible link + credits are worth getting right now even with affiliate off.
- **Illustrative only (NOT an implementation):** the link util might look like `buildStoreUrl({ service, region, isbn?, title, tag? })` returning the localized URL with `tag` left `undefined` today; a sidecar entry might look like `{ "externalBookId": "HH-0001", "credits": [{ "name": "…", "role": "narrator", "sourceUrl": "…", "checkedAt": "2026-05-…", "confidence": 0.9 }] }`. Shapes are yours.
- **Strand precedent:** Brief 103 ran as a data PR + a UI PR off the two worktrees — same pattern here.
- **Review credit:** the durability (P1), provenance-source (P1), full-cast roles (P2), and test-anchor (P2) points all came from the CC review of the first draft; the code references (`apply-override.ts` ~L1024, `work_persons` schema, `page.tsx` ~L73) were verified before folding them in.
