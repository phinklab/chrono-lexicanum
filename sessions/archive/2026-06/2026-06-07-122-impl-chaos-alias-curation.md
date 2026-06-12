---
session: 2026-06-07-122
role: implementer
date: 2026-06-07
status: complete
slug: chaos-alias-curation
parent: 2026-06-03-122
links:
  - 2026-06-07-122
  - 2026-06-02-114
commits: []
---

# 122 — Chaos/Nurgle alias curation + feed-free podcast re-resolution

## Summary

Maintainer observation: the Lorehammer episode **"166 - Plague Legions of
Nurgle"** carried **no Nurgle tag** (in fact zero tags). Root cause is the
two-stage tag pipeline, *not* a bug:

1. **Extraction (LLM, temp 0)** reads each episode's title + description and
   emits free-text **surface-forms** — for ep166 it emitted only flavour
   compounds (`Plague Legions of Nurgle`, `Great Unclean Ones`, `Rot Legions`,
   `Fecundus Legions`, `Garden of Nurgle`), never the bare token `Nurgle`.
2. **Resolution (`resolveSurfaceForm`, `src/lib/aliases`)** is an **exact**
   case-insensitive match against canonical names + a static alias table. None
   of those compounds matched, so all five were recorded as `unresolved` and —
   per the pipeline contract — **never written** as junctions. Title words carry
   zero weight; tags are LLM-judgment + alias resolution, so an entity named in
   the title is not guaranteed to be tagged (recall-limited extraction).

Fix: **21 verified Nurgle/Chaos alias entries** added to
`scripts/seed-data/faction-aliases.json`, then a **feed-free in-place
re-resolution** of all three committed artifacts and an idempotent re-apply.
Result: **ep166 now resolves to `faction:nurgle`** (verified in the live DB),
and the same class is fixed across all three shows. No TypeScript/pipeline
change.

## Why feed-free re-resolution (not a warm re-ingest)

`scripts/ingest-podcast.ts` always re-fetches the live RSS feed, so a warm
re-ingest of Lorehammer would regenerate all ~603 feed items — **resurrecting
the 212 `(Video)` duplicate episodes** that were manually removed in the
2026-06-07 onboard cleanup (391-episode state). Instead, a throwaway script
reconstructed each episode's `EpisodeExtraction` from the committed artifact
(resolved-tag `rawName`+`role` ∪ `unresolved` `rawName`+`axisGuess`+`role`) and
re-ran the **real** `resolveEpisodeTags` with the extended alias table — no feed,
no LLM call. Because aliases are only **added** (none removed), the operation is
provably **additive**: no existing tag can be lost; only previously-unresolved
forms move into `tags`. The re-serialization is byte-stable elsewhere, so the
diff is exactly the changed episodes' tag/unresolved regions.

## Alias additions (all in `faction-aliases.json`, all targets verified to exist)

| surface-form(s) | → canonical | rationale |
|---|---|---|
| Plague Legions of Nurgle, Rot Legions, Fecundus Legions, Nurglings, Great Unclean Ones | `nurgle` | Nurgle's daemon/legion forces — the maintainer wants these under **Nurgle** |
| Bloodletters | `khorne` | Khorne-exclusive daemons |
| Daemonettes | `slaanesh` | Slaanesh-exclusive daemons |
| Horrors of Tzeentch, Tzeentch's Scintillating Legions | `tzeentch` | Tzeentch-exclusive daemons |
| Daemon Princes | `daemons` | serve any god → generic daemon umbrella |
| Chaos Gods, Ruinous Powers, Forces of Chaos, Chaos Unbound, Lost and the Damned, Traitoris Militarum, Chaos Knights, Traitor Titan Legions, Traitor Fleets | `chaos` | general Chaos-aligned forces (cultists, traitor guard/titans/navy, chaos knights) |
| Traitor Legions, Chaos Lords | `heretic_astartes` | fallen Space Marine legions / their commanders |

God-specific daemon mapping follows the file's existing precedent
(`"Daemons of Tzeentch": "tzeentch"`). The alias module is **shared** (Brief
104): these entries also improve drift-classification and the search resolver,
not just podcast tagging.

### Deliberately dropped (the discovery agent proposed these; I rejected them)

- **`Garden of Nurgle`, `Daemon Worlds`, `Realm of Slaanesh` → `eye_of_terror`** —
  lore-wrong. These are warp realms, not the Eye of Terror; no canonical
  warp-realm location entity exists, so they stay **unresolved** rather than
  assert a false place. (ep166 still gains Nurgle from its other forms; `Garden
  of Nurgle` remains its one unresolved form.)
- **`Primarchs` → `heretic_astartes`** — dangerous: most primarchs are loyalist;
  the bare word would mis-tag broadly.
- **`Lost Primarchs`, `Daemonculaba`** — too ambiguous/obscure for a confident
  canonical target.

## Results (measured)

Feed-free re-resolution (throwaway, deleted) over the three artifacts:

| show | episodes | episodes changed | resolved tags | newly-resolved forms |
|---|---|---|---|---|
| lorehammer | 391 | 17 | 653 → **663** (+10) | 14 (chaos gods ×4, traitor legions ×3, …, plague legions of nurgle, great unclean ones, …) |
| the-40k-lorecast | 149 | 1 | 519 → **520** (+1) | traitor legions ×1 |
| adeptus-ridiculous | 363 | 15 | 778 → **790** (+12) | 10 (forces of chaos ×4, chaos knights ×2, …) |

(+10/+1/+12 net < the form counts because several forms dedupe into a tag the
episode already carried.)

Idempotent re-apply (all `Episodes inserted: 0`, exit 0):

| show | char | faction | loc | episodes in DB |
|---|---|---|---|---|
| lorehammer | 128 | **446** (was 436) | 89 | 391 |
| the-40k-lorecast | 155 | **268** (was 267) | 97 | 149 |
| adeptus-ridiculous | 191 | **480** (was 468) | 119 | 363 |

**ep166 verification (live DB):**

- `works` row `27d97026-…` "166 - Plague Legions of Nurgle" →
  `work_factions` now has `{ factionId: nurgle, role: subject, rawName: "Great
  Unclean Ones" }`. **`HAS nurgle: true`.**
- lorehammer: **7** episodes tagged `nurgle` (was 6 — ep166 added).
- `loadEntity("faction","nurgle")` → `podcast_episode` group of **13** works,
  **ep166 present: true**.

## Verification (all five gates green)

- `npm run lint` — pass (exit 0)
- `npm run typecheck` — pass (exit 0)
- `npm run test:podcast-ingest` — pass (30/0)
- `npm run test:podcast-apply` — pass (37/0)
- `npm run brain:lint -- --no-write` — pass (0 blocking; 13 pre-existing warnings)

Both throwaway scripts (`scripts/_tmp-reresolve-podcasts.ts`,
`scripts/_tmp-verify-nurgle.ts`) deleted before staging (confirmed absent from
`git status`). Diff is the 7 intended files only: `faction-aliases.json` + the 3
artifacts + their 3 reports.

## Open issues / follow-ups

- **Warp-realm locations are still unresolved** (`Garden of Nurgle`, `Daemon
  Worlds`, `Realm of Slaanesh`, …). A future curation pass could add canonical
  location entities (e.g. a Warp / Realm-of-Chaos place) — not done here (no
  invented entities).
- **Existing inconsistency left untouched:** `"Daemons of Nurgle"`/`"Daemons of
  Khorne"` already map to the generic `daemons`, while `"Daemons of Tzeentch"`
  and my new god-specific daemon forms map to the god. I did not rewrite
  existing entries (that would change already-applied resolutions). A future
  normalization could unify the policy.
- **Cold-re-ingest caveat (unchanged):** a *cold* Lorehammer re-ingest still
  regenerates the full ~603 feed (needs a feed-level `(Video)` twin-filter) and
  would re-resolve against these aliases anyway. Feed-free re-resolution is the
  safe path until a twin-filter exists.
- The broader **unresolved-form curation backlog** persists (non-Chaos forms,
  e.g. `The Warp`, `Leagues of Votann`) — out of scope for this pass.

## References

- Lorehammer onboard + `(Video)` dedup: `sessions/2026-06-07-122-impl-lorehammer-onboard.md`.
- Alias module: `src/lib/aliases/index.ts` (Brief 104); podcast resolution:
  `src/lib/ingestion/podcast/resolve.ts` (Brief 110); artifact serialize/report:
  `src/lib/ingestion/podcast/artifact.ts`.
- Rollup note for Cowork: `brain/**`, `sessions/README.md`, and the board are
  coordination-worktree-only — not touched here; backfill in the post-merge pass.
