---
session: 2026-05-29-105
role: implementer
date: 2026-05-30
status: complete
slug: buy-listen-links
parent: 2026-05-29-105
links:
  - 2026-05-29-105-impl-data-buy-listen-links
commits: []
---

# Buy/listen links + audiobook narrators (Cluster A) — UI pass (Product)

## Summary

`/buch/[slug]` now carries a buy/listen rail under the cover — an **Amazon** link,
a **Black Library** link, and (where audio credits exist) a **Listen on Audible**
link plus the credit — all built through one geo-localizing util that resolves
the visitor's regional store **server-side** with an empty-today affiliate slot.
The persons query's missing `orderBy` (the L73 bug) is fixed. With the data pass
merged, this completes both halves; brief flipped to `status: implemented`.

## What I did

- `src/lib/store-links.ts` — **new.** Pure, total `buildStoreUrl({ service, region, title, author?, isbn?, tag? })`.
  `StoreService` = `amazon | audible | black_library`; `StoreRegion` = 12 ISO
  markets + `DEFAULT_REGION` (US). Amazon/Audible TLD maps; Amazon prefers ISBN
  (`/s?k={isbn}&i=stripbooks`) else title+author search; Audible
  `/search?keywords=`; Black Library a single search endpoint. No `next/*` import
  → stays pure/importable from the client island and a `tsx` smoke. **Affiliate
  slot:** empty `AFFILIATE_TAGS` map + optional `STORE_AFFILIATE_TAGS` env parse,
  resolved per service+TLD inside the builder — ships **no tag**, enables with
  zero call-site edits.
- `src/lib/store-region.ts` — **new, server-only.** `resolveRegion(storeOverride?)`
  mirrors `atlas/auth.ts`'s `headers()` pattern. Precedence: `?store=` override >
  `x-vercel-ip-country` (Vercel geo) > `Accept-Language` (region subtag, else a
  lang→country table) > `US`. Anything unsupported collapses to `US`.
- `src/components/book/BuyListenActions.tsx` — **new, server component.** Renders
  the rail; every `href` built server-side, so links are correct in SSR HTML with
  no client JS. Audible (+ credit) only when `audio` is non-null.
- `src/components/book/AudioCredit.tsx` — **new, server component.** `single` →
  "Narrated by X"; `duet`/`ensemble` → "Narrated by A, B & C" (≤3 shown, overflow
  "& N more"); `cast` → "Full-cast drama — …" (never "Narrated by", per brief).
- `src/components/book/RegionSwitcher.tsx` — **new, client island.** Optional
  US/UK/DE quick-switch writing `?store=` (EraToggle pattern); label shows the
  resolved region so visitors outside the trio still see their store. Page's only
  client component.
- `src/app/buch/[slug]/page.tsx` — **edit.** (1) Persons query: added
  `displayOrder` + `.orderBy(asc(role), asc(displayOrder))` (the L73 fix). (2)
  Added `isbn13`/`isbn10` to the `book_details` select and surfaced them. (3)
  `buildAudioCredit()` partitions audio roles into the render shape. (4) Added
  `searchParams` prop, `await`, `resolveRegion`. (5) Wrapped cover + actions +
  switcher in a `.book-detail__rail` (grid column 1). Title-block untouched.
- `src/app/globals.css` — **edit.** Added `.book-detail__rail / __obtain /
  __actions / __action / __audio-credit* / __region*` using existing tokens
  (cyan borders, mono labels, Cormorant italic credit, faint-cyan hover fill, **no
  glow**); extended the `@media (max-width:820px)` block with the rail cap.
- `.env.example` — **edit.** Documented the commented `STORE_AFFILIATE_TAGS`
  server-only stanza (unset = tag-free, today's default).
- `sessions/2026-05-29-105-arch-buy-listen-links.md` — **edit.** `status: open →
  implemented` (both passes done), per the doc-rides-inside-code-PR rule.

## Decisions I made

- **Derive, don't store** (brief's call) — no `external_links` rows, no migration.
  Geo is a TLD swap; the only persisted new data was the data pass's audio credits.
- **One representation = ISO region code.** `resolveRegion` returns `"DE"` etc.;
  `buildStoreUrl` maps region→TLD internally; the switcher writes `?store=DE`. No
  TLD strings leak across call sites.
- **Two files, pure builder + server resolver.** Keeping `store-links.ts` free of
  `next/headers` lets the client switcher import its `StoreRegion` type and lets a
  throwaway `tsx` exercise the builder without the Next runtime — matches house
  style (`slug.ts`/`timelineUrl.ts` pure; `atlas/auth.ts` server-touching).
- **Black Library endpoint = `…/Home/Search-Results.html?SearchText=`.** BL runs a
  custom (Red Technology) store, **not** Shopify, so the `/search?q=` guess 404s;
  the warhammer.com store rejects GET search (405). The canonical BL search URL
  returns HTTP 200 and echoes the query (server-rendered heading), so it never
  404s — but its **result list is JS-populated, so I could not assert results
  headlessly.** Kept it behind one constant + param for a one-line swap. See open
  questions.
- **Audible gated on credits, not the `audio_drama` format.** The brief ties the
  Audible action to "any listen-credit role exists," so I gate on the credit
  rows (audio !== null), matching acceptance exactly. A hypothetical credit-less
  audio_drama shows no Audible link (none exist in the data pass's 66).
- **Included the region switcher** (the brief left it optional). It doubles as the
  two-region verification path and reuses the blessed EraToggle pattern, so it
  carries no new architectural risk — and it deliberately drops the `.fr-pill`/
  `.era-toggle` `box-shadow` glow (maintainer dislikes halos).
- **Placement: a rail under the cover** in the 240px aside column (under-used
  below the cover), not a row in the dense title block. On mobile the grid
  collapses and the rail stacks directly under the cover, above the synopsis.
- **Amazon scoped to books** (`i=stripbooks`) to cut merch/game noise on
  "Warhammer" searches; ISBN used as the `k` term when `book_details` has one
  (partial coverage — most fall back to title+author).

## Answers to the brief's open questions (UI side)

1. **Durability / other re-apply paths:** answered by the data pass (scoping the
   override delete proved clean; `apply-override.ts` was the only routine
   clobber). Nothing on the UI side touches `work_persons`.
2. **Cheapest credit source / sidecar fields:** data-pass question; the UI
   consumes the applied rows directly (no sidecar read at render time).
3. **Are derived search links good enough UX?** Amazon/Audible search URLs are
   solid (ISBN-keyed when present; title+author otherwise, books-scoped). **Black
   Library is the weak link** — its on-site search results are JS-rendered and I
   couldn't confirm a given title resolves headlessly; the *page* always loads
   (no 404), but a title that BL's search tokenizes poorly could land on "no
   results." If that disappoints in real use, the follow-up is a stored
   `external_links` deep link for BL (or switch the constant to the warhammer.com
   store once a GET-able search path exists). Short ambiguous titles the data pass
   flagged (*Legion*, *Nemesis*, *Krieg*, *Leviathan*) are the first candidates.
4. **Markets mapped + default fallback.** Amazon: US, GB, DE, FR, ES, IT, NL, CA,
   AU, JP, IN, BR (TLDs com / co.uk / de / fr / es / it / nl / ca / com.au /
   co.jp / in / com.br). Audible: same where a storefront exists, else `.com`
   (e.g. NL→.com). **Default = US / `.com`** when region is undetectable — largest
   English catalog, and BL fiction is English-first. Region from `?store=` >
   Vercel geo > Accept-Language > US.
5. **Unreliable derivations:** only Black Library (above). Amazon/Audible derive
   reliably for every title.

## Verification

- `npm run typecheck` (`tsc --noEmit`) — **clean.**
- `npm run lint` (`eslint .`) — **clean.**
- `npm run build` — **green**; `/buch/[slug]` correctly `ƒ (Dynamic)`
  (reads headers/searchParams).
- **Pure builder smoke** (throwaway `tsx`, deleted): Amazon TLD swaps US→.com /
  DE→.de / GB→.co.uk / FR→.fr / JP→.co.jp / BR→.com.br / NL→.nl; Audible NL→.com
  fallback; ISBN used as `k`; `&`/`:` encoded (`%26`/`%3A`); **no `tag=` anywhere.**
- **Dev render** (`npm run dev`, real DB after `npm run apply:audiobook-narrators`,
  88 credits):
  - `horus-rising` (single) → "Narrated by Toby Longworth", Audible present.
  - `saturnine` (duet) → "Narrated by Jonathan Keeble & Emma Gregory".
  - `tales-of-heresy` (ensemble) → "Narrated by Gareth Armstrong, Emma Gregory,
    Jonathan Keeble & 2 more".
  - `butchers-nails` (full cast) → "Full-cast drama — Seán Barrett, Rupert Degas,
    Charlotte Page & 2 more" (**not** "Narrated by").
  - `space-marine` / `eye-of-terror` / `dark-apostle` (audit, no audio) → Amazon +
    Black Library only, **no** Audible, **no** `// AUDIOBOOK`, HTTP 200, no errors.
- **Geo precedence** (curl on the rendered HTML, `horus-rising`):
  `x-vercel-ip-country: DE` → amazon.de · `: US` → amazon.com ·
  `Accept-Language: en-GB` → amazon.co.uk · `?store=FR` with a DE geo header →
  amazon.fr (override wins).
- **No affiliate tag** in any rendered link (grep = 0); byline intact; switcher
  renders US/UK/DE.

## Open issues / blockers

None blocking. One watch-item: **Black Library search results are JS-rendered**,
so per-title result quality is unverified headlessly (the link never 404s). If
real-world UX disappoints, the fix is a stored BL deep link via `external_links`
or repointing the single `BLACK_LIBRARY_SEARCH` constant — both follow-ups, not
blockers.

## For next session

- **Affiliate revisit** (maintainer's call): register Amazon Associates / Audible,
  then either populate `AFFILIATE_TAGS` or set `STORE_AFFILIATE_TAGS` — no code
  change. OneLink/OneTag context is in the brief's Notes.
- **Black Library link hardening:** confirm in a real browser that BL search
  resolves common titles; if not, add stored BL deep links for the flagged short
  titles or switch to a GET-able warhammer.com search path.
- **ISBN coverage:** Amazon links sharpen automatically as `book_details.isbn13`
  fills in (Open Library backfill) — no further UI work needed.
- **Full 859 audio sweep** (data-pass follow-up) will light up the Audible action
  on the long tail; the UI already degrades gracefully until then.

## References

- `src/lib/atlas/auth.ts` — `headers()` server-read pattern mirrored by
  `store-region.ts`.
- `src/components/chrome/EraToggle.tsx` — URL-as-source-of-truth client island
  pattern reused by `RegionSwitcher`.
- Black Library search endpoint confirmed live (`/Home/Search-Results.html?SearchText=`,
  HTTP 200, query echoed); warhammer.com GET search returns 405.
