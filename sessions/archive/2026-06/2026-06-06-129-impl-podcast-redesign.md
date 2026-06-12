---
session: 2026-06-06-129
role: implementer
date: 2026-06-06
status: complete
slug: podcast-redesign
parent: 2026-06-03-121
links:
  - 2026-06-06-122
commits:
  - 5a94da2
---

# 129 - Podcast `/podcasts` redesign (121-P4)

## Summary

P4 is implemented: `/podcasts` is now a hall of show doorways and a new
`/podcasts/[slug]` detail route opens one show with a full, filterable episode
archive — inline playback, per-episode download, and faction chips into
`/werke`. Wired against the 122-B1 multi-show + `external_links` data; no
schema/data change on the Product side.

> Reconstruction note: the implementing session's conversation context was lost
> to an accidental `/clear`. The working tree was finalized and confirmed
> working by Philipp in `npm run dev` before commit; this report is reconstructed
> from the finalized diff and the file-level design comments. Verification gates
> below reflect what was actually re-run at commit time, not the original
> session.

## What I did

- `src/app/podcasts/[slug]/page.tsx` — **new** per-show detail route (server
  component). Mirrors the `/buch/[slug]` shape: `params` Promise, `notFound()`
  on miss, `generateStaticParams` + `generateMetadata`, `revalidate = 3600`.
  Renders the show mast/plate (art, stats, platform links from
  `external_links`, back-link) and mounts the archive island.
- `src/components/podcast/PodcastEpisodeArchive.tsx` — **new** `"use client"`
  archive island. Title search + episode-kind toggle + year quick-jump,
  one-at-a-time inline `<audio>` playback, per-episode download link and
  faction chips. Takes a fully-serialized episode set; imports the loader type
  via `import type` only (no `@/db` in the client bundle).
- `src/app/podcasts/loader.ts` — added `loadPodcastShow` / `podcastShowSlugs` /
  `PodcastShowDetail` / `PodcastEpisode` plus `PlatformLink` / `FactionTag`
  shapes; existing index loader retained.
- `src/app/podcasts/page.tsx` — index reworked from a flat list into a hall of
  show doorways (link-to-show).
- `src/app/styles/62-podcasts.css` — expanded for the index, the show
  mast/plate, and the archive surfaces (visual vocabulary borrowed from
  `/werke` + `/ask`).
- `sessions/2026-06-03-121-arch-product-board.md` — marked P4 erledigt while
  leaving the standing board open.

## Decisions I made

- **Detail route mirrors `/buch/[slug]`, not a bespoke shape.** Same
  `params`-Promise + `notFound` + `generateStaticParams`/`generateMetadata` +
  hourly `revalidate` contract, so newly-ingested episodes surface without a
  redeploy and the route stays statically generated.
- **Server page / client island split.** All DB work stays in the server route;
  the island receives serialized episodes and pulls only the loader *type* via
  `import type` (erased at build), keeping `@/db` out of the client bundle.
- **Playback is reconciled in change handlers, not an effect.** When a filter
  change would hide the playing row, playback is stopped synchronously in the
  query/kind setters — otherwise clearing the filter later would remount the row
  and `autoPlay` would restart it from 0.
- **`lore` is the unchipped house norm.** A pure-lore show shows no kind row and
  no per-row kind chip; only off-format episodes (interview/news/other) carry a
  tag, so the common case isn't a wall of identical "LORE" chips.
- **Native `<audio>` over a custom player.** Keeps playback accessible and
  robust; `colorScheme: dark` paints dark transport controls, `preload="none"`
  avoids fetching audio until play.
- **Download via `<a download>` + faction chips into `/werke?faction=…`.**
  Satisfies the board's "Download-Option" and "Link-zur-Show" asks directly off
  the 122-B1 link data, with no new data contract.

## Verification

- `npm run lint` — pass (clean).
- `npm run typecheck` — pass (clean; adding the `[slug]` route did not trip a
  stale `.next/types` validator).
- `npm run build` — **not run this pass** (deferred at Philipp's request).
- Manual: Philipp confirmed the redesigned `/podcasts` index and per-show
  archive working in `npm run dev` before the PR (the basis for "definitely
  done").
- Static read-through: every cross-file import resolves to a matching export
  (`loadPodcastShow`/`podcastShowSlugs`/`PodcastShowDetail`/`PodcastEpisode`),
  and the client island carries no DB import.

## Open issues / blockers

- None blocking. A full `next build` (which exercises `generateStaticParams` +
  `generateMetadata` against the DB) was not run this pass; lint + typecheck are
  green and dev is confirmed.

## For next session

- Product visual pass: check `/podcasts` and `/podcasts/[slug]` at desktop and
  ≤720px — long episode titles, faction-chip wrap, and the inline player row.
- Once a show carries YouTube links (Batches S4), confirm they render as
  platform links / per-episode links without a Product change (the link shapes
  already pass through).

## References

- `sessions/2026-06-03-121-arch-product-board.md` — P4 brief (board row).
- `sessions/2026-06-06-122-impl-podcast-b1-s3-apply-links.md` — the B1 data this
  renders.
- `src/app/buecher/` / `src/app/buch/[slug]/` — the route pattern mirrored here.
