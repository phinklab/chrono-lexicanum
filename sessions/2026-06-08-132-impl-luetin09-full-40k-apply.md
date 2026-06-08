---
session: 2026-06-08-132
role: implementer
date: 2026-06-08
status: complete
slug: luetin09-full-40k-apply
parent: 2026-06-07-131
links:
  - 2026-06-07-131
  - 2026-06-07-130
  - 2026-06-02-114
commits: []
---

# Full-scope @luetin09 ingest via cc-direct (Variant B) + 40k-lore DB apply

## Summary

The full `@luetin09` catalog (**1854 episodes**) was tagged through the Brief-131
**cc-direct** pipeline (Variant B): 186 batches, one fresh `claude -p --model
sonnet` subsession each, **zero metered Anthropic API calls**. The result was then
curated to the **191 Warhammer-40k lore episodes** and **applied to Postgres** (191
`youtube` works, 374 tag-junctions, 192 YouTube `watch` links); one non-40k stray
left over from the Session-130 demo apply was removed, so the DB holds exactly the
191 lore episodes. This is the full-catalog follow-up the 130-impl report flagged.

## What I did

### 1. Ingest — full catalog via cc-direct (zero metered calls)

- **acquire** — `ingest:podcast --tagging=cc-direct --stage=acquire --show luetin09
  --out luetin09-full`: 1951 uploads → 97 denylisted, 41 curated-lore force-included
  → **1854 acquired**, 186 batches, prompt `3f6a5ff87efa`. YouTube key only.
- **tag** — `scripts/run-podcast-tag-loop.sh --out luetin09-full`: 186/186 batches,
  one fresh `claude -p --model sonnet` per 10-ep batch, `--allowedTools "Read Write"
  --permission-mode acceptEdits` (no web/bash/git). Resumable; 0 resumed this run.
  Merged **1854 extractions** → `ingest/podcasts/luetin09-full.extractions.json`.
- **assemble** — `--stage=assemble --out luetin09-full`: wrote `luetin09-full.json`
  + `.report.md`. 170/1854 (9.2%) carry ≥1 resolved tag; kinds **191 lore, 17
  news_recap, 16 interview, 1630 other** (the bulk is Luetin's pre-Warhammer gaming
  catalog back to 2009 — correctly tagged `other`/empty, not force-fit to 40k).

### 2. Curate — the 40k boundary

- Quantified that `episodeKind` is the only clean 40k signal: `other` (1630) holds
  only **2** episodes with any 40k entity (both 40k *video-game* clips);
  `news_recap`+`interview` (33) are franchise-agnostic — **24** are Battlefield/COD/
  Squad gaming, only 9 are 40k (game news/promo). So "kind ≠ other" would pull in
  non-40k gaming. **`lore` is the clean 40k core** (verified: even the 17 tag-less
  lore eps are 40k gear/concept explainers — Purity Seals, Volkite Weapons, Hive
  Cities). Philipp chose **lore-only (191)**.
- Filtered the full artifact to `episodeKind === "lore"` → 191 eps (87.4% carry a
  resolved tag, 374 tags, 63 unresolved). **Promoted this subset to the committed
  `ingest/podcasts/luetin09.json`** (was the 20-ep Session-130 demo) so
  `apply:podcast --show luetin09` reproduces this DB.

### 3. DB apply (youtube source) + stray removal

- Applied via `npm run apply:podcast -- --show luetin09` after a clean dry-run
  (filtered artifact transiently staged at the registry path, demo restored via git
  each time — `--file` would force the `rss` default; `--show` carries the registry
  `source:"youtube"`). **172 inserted + 19 updated = 191**; junctions 52 char / 275
  faction / 47 location (= 374, **0 dropped** — every resolved entity exists in the
  DB reference set); links 1 show + 191 episode.
- The Session-130 demo apply (20 eps = 19 lore + 1 `other`) had left **1 stray**
  (`WqRuXAiM_qI` "THE RISE & FALL OF HUMAN CIVILIZATIONS [2]" — a real-world video
  essay on the 1975 BBC series *Survivors*, not 40k), so the show stood at 192. A
  guarded one-off (refuses to delete any `lore` row; throwaway, not committed)
  deleted that episode `works` row (cascade removed its detail + link). DB → **191**.

## Decisions I made

- **40k = `episodeKind: "lore"` only (191), Philipp's call.** Kind alone is not a
  40k filter for news/interview (franchise-agnostic); `lore` is. The 9 40k
  game-news/promo videos and the 1630 `other` stay unapplied by choice.
- **Apply through `--show`, not `--file`.** `--file` has no registry entry →
  `workSourceKindForSource` falls back to `rss`/`podcast_rss`; only the registry
  path carries `source:"youtube"`. Staged-and-restored `luetin09.json` for each
  apply, then promoted the 191-lore set as the canonical artifact so the path is
  stable going forward.
- **Committed extractions + report, not the 1.15 MB full artifact.** The
  186-batch Sonnet run is expensive to reproduce, so `luetin09-full.extractions.json`
  (the Brief-131 contract artifact) + `.report.md` are committed. The derived
  `luetin09-full.json` (full 1854-ep assembly) is left local/untracked.
- **Zero metered calls — verified by construction + at runtime.** The cc-direct
  path never imports `@anthropic-ai/sdk` (lazy-imported only on the `api` branch);
  tagging is entirely Max-plan `claude -p` subsessions; assemble printed
  `tagging = cc-direct (zero Anthropic API calls)`.

## Verification

- Tag loop: **186/186** batches validated + merged, 1854 extractions, model
  `claude-sonnet-4-6`, prompt `3f6a5ff87efa`.
- Apply dry-run: `source youtube`, `Work source_kind: youtube`, 191 episodes, 374
  junctions (0 dropped), 1 + 191 links, no writes.
- Real apply: 172 inserted / 19 updated; junctions 52/275/47; links 1 + 191.
- Read-only DB verification: **191** episode works, all `episode_kind = lore`, all
  `source_kind = youtube`; show work `youtube`/`podcast`/"Luetin09"; junctions
  total 374; external_links 191 episode + 1 show. Sample episode `watch` URLs
  confirmed live (e.g. Belisarius Cawl → `watch?v=WkWh3q3Cry0`).
- Stray removal: guarded delete, 192 → 191; both one-off scripts deleted (not
  committed).

## Open issues / blockers

- **None blocking.** DB holds exactly the 191 lore episodes with links + tags.

## For next session

- **63 unresolved alias candidates** in the 191-lore set are skipped per invariant
  (never written). Top by frequency: `Old Ones`, `the Warp`, `Nachmund Gauntlet`,
  `Goge Vandire`, `Sebastian Thor`, `Men of Iron`, `Vraks`; long tail incl.
  `Illuminor Szeras`, `Kryptman`, `Silent King`, `The Emperor of Man`, `Leagues of
  Votann`, `Necrontyr`. Some are real missing entities (curate), some alias-variant
  gaps (`the Warp` → Immaterium, `The Emperor of Man` → the Emperor). After curating
  the alias index: re-assemble → re-apply (idempotent delete-then-insert backfills).
- **9 40k game-news/promo videos** (Eternal Crusade, Dawn of War 3, Space Marine
  bundle, 40k Animated Series) are unapplied — a possible future "40k-news" tier.
- **Full assembled artifact** `luetin09-full.json` (1854 eps) left local/untracked;
  commit later if a full-catalog artifact in git is wanted.

## References

- Brief `2026-06-07-131-arch-podcast-tagging-cc-direct.md` (the cc-direct pipeline).
- `2026-06-07-130-impl-luetin-db-apply.md` ("For next session" → "Full-catalog
  backfill … a separate, deliberate run") — this is that run.
- `scripts/{ingest-podcast,podcast-cc-tag,apply-podcast}.ts`,
  `scripts/run-podcast-tag-loop.sh`, `src/lib/ingestion/podcast/{apply-plan,artifact,resolve,types}.ts`.
