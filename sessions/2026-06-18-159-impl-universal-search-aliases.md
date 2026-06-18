---
session: 2026-06-18-159
role: implementer
date: 2026-06-18
status: complete
slug: universal-search-aliases
parent: 2026-06-03-121
links:
  - 2026-06-03-121-arch-product-board
  - 2026-06-18-158-impl-gate-fl-materialize
commits: []
---

# Universal Search - entity aliases + Compendium visibility

## Summary

Product-strand, Worktree `chrono-lexicanum-product`, Branch `codex/product-search-alias-suggestions`. Universal Search now includes Factions, Characters and Worlds from the same visible Compendium rows, indexes Faction/Location/Character alias surfaces, routes alias hits to canonical entities, and the Worlds directory now uses threshold 2 instead of 3.

Follow-up polish requested during visual QA also shipped: Home hero copy now says `fan-made non-official` and describes the broader site, Home's desktop title stays on one line, and `/archive` hero copy says `ARCHIVE` instead of `WORKS`.

## What I did

- `src/app/archive/filters.ts` - extended the pure suggestion contract with `character` and `world`, alias display (`Alias -> Canonical` in code as a Unicode arrow in UI), canonical dedupe, entity suggestion builder, and focus-route helpers.
- `src/lib/aliases/index.ts` - exported `listAliasEntries()` so UI search consumes the existing seed alias maps without duplicating JSON imports.
- `src/lib/compendium/loader.ts` - lowered `WORLD_MENTION_THRESHOLD` to `2`; added `loadCompendiumSearchSuggestions()` over visible faction/character/world rows with alignment/faction/sector + appearance-count hints and alias rows.
- `src/app/page.tsx`, `src/app/archive/page.tsx`, `src/app/archive/podcasts/page.tsx` - merged Compendium entity suggestions into the shared Home/Archive/Podcasts search indexes.
- `src/components/home/HomeSearch.tsx`, `src/components/podcast/PodcastsSearch.tsx`, `src/app/archive/WerkeFilters.tsx` - routed character/world picks to `/compendium/charaktere?focus=<id>` and `/compendium/welten?focus=<id>`.
- `src/app/styles/61-browse.css`, `src/app/styles/62-podcasts.css` - removed the teal suggestion-panel border and the active row's left accent stroke; new entity classes use the same compact label treatment.
- `src/app/styles/50-hub.css` - kept `CHRONO LEXICANUM` unbroken on desktop, with the existing mobile breakpoint allowed to wrap.
- `scripts/test-search-index.ts`, `package.json` - added a DB-free search-index regression test for alias labels, canonical dedupe and focus route contracts.

## Decisions I made

- **Entity suggestions come from Compendium loaders, not book rows.** That makes Characters and Worlds first-class suggestions and keeps search visibility/counts aligned with `/compendium/*`.
- **Alias rows share the canonical dedupe key.** A query like `Crimson` shows one canonical `Crimson Slaughter` row rather than duplicate canonical + alias rows; an alias-specific query like `Crimson Sabres` shows `Crimson Sabres -> Crimson Slaughter` and commits `crimson_slaughter`.
- **Factions moved out of `buildSearchIndex(books)`.** They now come from `loadFactionItems()` so the hint can use alignment/counts and alias rows. This preserves visible faction coverage while avoiding duplicate faction suggestions.
- **No DB/Data-Apply work.** Per request, I did not run `db:sync`, `db:drift`, `db:rebuild`, migrations, or any apply path.
- **Cache note:** the changed code uses the existing `cachedRead` tags (`compendium`, `factions`, `characters`, `worlds`) with `READ_CACHE_TTL=3600`. A fresh deploy should execute the new threshold/search code, but if Vercel still shows the old 110-world list from Data Cache, run `POST /api/revalidate` with no body or with `{"tags":["compendium","worlds","factions","characters"]}` once `REVALIDATE_TOKEN` is configured.

## Verification

- `npm run test:search-index` - pass (5/5).
- `npm run test:aliases` - pass (15/15).
- `npm run lint` - pass.
- `npm run typecheck` - pass.
- `npm run brain:lint -- --no-write` - pass, 0 blocking findings; 16 pre-existing warnings.
- Manual visual QA by Philipp - pass: alias suggestions, canonical routing, Worlds visibility and dropdown styling looked good before PR.

## Open issues / blockers

None. Dev-server background startup from the Codex shell hit a local Next lockfile/Windows process quirk, so the final visual smoke was done by Philipp via `npm run dev`.

## For next session

- If post-deploy Compendium counts look stale despite the code change, use `/api/revalidate` for `compendium/worlds/factions/characters`.
- Mobile-specific Home title wrapping remains a future mobile pass, per maintainer note.

## References

- `src/lib/db-cache.ts` and `src/app/api/revalidate/route.ts` for cache tags/revalidation behavior.
