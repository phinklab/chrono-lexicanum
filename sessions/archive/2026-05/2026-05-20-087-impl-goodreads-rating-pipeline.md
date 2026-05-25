---
session: 2026-05-20-087
role: implementer
date: 2026-05-20
status: complete
slug: goodreads-rating-pipeline
parent: 2026-05-20-087
links:
  - 2026-05-11-061-arch-ssot-loop
commits:
  - pending
---

# Goodreads-Rating-Pipeline-Integration

## Summary

Brief 087 is implemented: Goodreads ratings are now a fourth forward-only SSOT-loop discipline, carried in `overrides.rating` and applied into `book_details.rating` / `rating_count` / `rating_source`. Existing `ssot-w40k-001..020` files remain no-op for ratings because missing `overrides.rating` is explicitly absent-state.

## What I did

- `sessions/2026-05-11-061-arch-ssot-loop.md` — added the Goodreads-Rating-Discipline for `ssot-w40k-021` / `W40K-0201` onward, including page-read-not-snippet, edition disambiguation, JSON shape, and unrated semantics.
- `scripts/run-ssot-loop.sh` — added `WebFetch` to `--allowedTools` and injected the short Goodreads discipline into the headless trigger.
- `scripts/apply-override-rating.ts` — new pure helper for normalizing rated / unrated / absent rating override states.
- `scripts/apply-override.ts` — validates optional rating overrides before mutation and writes rating fields only when `overrides.rating` is present.
- `scripts/apply-override-dry.ts` — simulates rating writes, reports rated/unrated/absent counts, and now supports `--file=<path>` for single-fixture dry runs.
- `scripts/test-resolver.ts` — added three apply-path unit anchors: rated value, unrated marker, absent field.
- `scripts/seed-data/fixtures/goodreads-rating-087-smoke.json` — single-book smoke fixture for `W40K-0201` (`Blind`).
- `sessions/README.md` / `sessions/2026-05-20-087-arch-goodreads-rating-pipeline.md` — marked 087 implemented and updated the active-thread pointer.

## Decisions I made

- **Rating JSON form:** nested object under `overrides.rating`.
  - Rated: `{ "status": "rated", "source": "goodreads", "value": 3.59, "count": 204, "evidenceUrl": "..." }`
  - Unrated: `{ "status": "unrated", "source": "goodreads", "reason": "...", "evidenceUrl": "..." }`
- **Unrated DB representation:** no migration. `status: "unrated"` writes `rating=NULL`, `rating_count=NULL`, `rating_source='goodreads'`; missing field writes nothing and keeps existing DB state.
- **Dry fixture mode:** added `apply-override-dry.ts --file=...` rather than creating a fake `manual-overrides-ssot-*` batch, so loop detection and cumulative counts cannot accidentally include the smoke.
- **Headless `WebFetch`:** not exercised end-to-end because today's handoff explicitly called out Anthropic / `claude -p` instability. The wrapper now permits `WebFetch`; the next real loop run is the first end-to-end reliability check.

## Verification

- `npm.cmd run test:resolver` — pass, `154 passed, 0 failed`.
- `npm.cmd run test:apply-override-dry` — pass; existing 200 books report `rated=0`, `unrated=0`, `absent=200`.
- `npx.cmd tsx scripts/apply-override-dry.ts --file=scripts/seed-data/fixtures/goodreads-rating-087-smoke.json` — pass; `W40K-0201 /buch/blind: rating=3.59 count=204 source=goodreads`.
- `npm.cmd run typecheck` — pass.
- `npm.cmd run brain:lint -- --no-write` — pass, 0 blocking / 13 warnings.
- `npm.cmd run lint` — pass with one existing Next font warning in `src/app/layout.tsx`.

## Smoke

Single-book candidate: `W40K-0201` / `blind` (`Blind`, Matthew Farrer), first not-yet-seeded `ssot-w40k-021` candidate.

Goodreads page selected: `https://www.goodreads.com/en/book/show/849226.Blind` (single novel, Shira Calpurnia #3; not the Enforcer omnibus). Page-read result used in the fixture: average `3.59`, count `204 ratings`.

## Open issues / blockers

No implementation blocker remains. The only unverified edge is actual `claude -p` headless `WebFetch` behavior; it was intentionally not run while the Anthropic/Cowork path is unstable.

## For next session

- Merge the 087 PR, then run the loop re-trigger for `ssot-w40k-021..025`.
- In that first live loop, watch the `WebFetch` reliability and whether Goodreads edition disambiguation needs an extra status-log convention.

## References

- Goodreads smoke source: https://www.goodreads.com/en/book/show/849226.Blind
