---
session: 2026-06-10-135
role: implementer
date: 2026-06-10
status: complete
slug: luetin-exclude
parent: 2026-06-09-133    # weekly content refresh thread (Brief 133 / Board 122-B10)
links:
  - 2026-06-09-134       # book-cutoff sibling follow-up (same refresh thread)
commits: []              # filled by the PR; this report rides inside the code branch
---

# Weekly refresh follow-up — drop the off-topic luetin09 video

> Maintainer spotted a non-40k episode in the first YouTube-enabled refresh
> (rolling PR #152): **"THE RISE & FALL OF HUMAN CIVILIZATIONS [2] — SURVIVORS OF
> THE APOCALYPSE"** (`WqRuXAiM_qI`, 2026-03-22). Not Warhammer — must not ingest.
> "die luetin episode muss weg, das ist nicht warhammer."

## What I did

- **`scripts/seed-data/podcast-shows.json`** — removed `WqRuXAiM_qI` from
  luetin09's `includeVideoIds`. That list is a force-include **allowlist** that
  rescues videos *past* the `excludePlaylists` denylist (`applyIncludeOverrides`
  in `youtube.ts`). The video had been hand-added there during luetin curation
  (Brief 130/132) — a curation slip, not a detection bug. Removing it lets the
  video fall back to its excluded playlist, so the adapter stops selecting it.

## Verification

- **`npm run refresh:check`** (live YouTube): `[podcast luetin09] ok — 0 new`
  (was 1) → `REFRESH_RESULT=findings books=30 episodes=2` (was 3 episodes). The
  off-topic episode is gone; the 30 wanted books are unaffected. Confirms the
  video *was* in an excluded playlist (removal alone re-denylisted it — no
  `excludeTitlePatterns` needed).
- **DB query** (production, read-only, throwaway script): the guid
  `WqRuXAiM_qI` is **not** in `podcast_episode_details`; luetin09 has exactly
  **191** episodes = the canonical `ingest/podcasts/luetin09.json`. So the DB was
  built from the canonical artifact, never the `-full` superset (which *does*
  contain the video) — it never reached Postgres. No DB cleanup required.
- **`npm run test:podcast-youtube`** — 29 passed, 0 failed.

## Rollup facts for Cowork (Batches strand — I can't touch `brain/**`)

- **Curation-hygiene note:** `includeVideoIds` force-includes *past* the playlist
  denylist, so a wrongly-listed id silently surfaces non-40k content. luetin09's
  allowlist is now 39 ids; it's the list to spot-check if off-topic episodes
  reappear. This was a single curation correction — no mechanism change.
- The weekly YouTube diff now returns luetin09 = 0 new; the next rolling-PR #152
  regeneration shows **2** new episodes (the-40k-lorecast + lorehammer), not 3.

## References

- Book-cutoff sibling follow-up: `sessions/2026-06-09-134-impl-book-cutoff.md`.
- YouTube allowlist semantics: `src/lib/ingestion/podcast/youtube.ts`
  (`applyIncludeOverrides` — `includeVideoIds` removes ids from the denylist).
