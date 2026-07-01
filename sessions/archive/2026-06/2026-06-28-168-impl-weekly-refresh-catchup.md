---
session: 2026-06-28-168
role: implementer
date: 2026-06-28
status: complete
slug: weekly-refresh-catchup
parent: 2026-06-27-168
links: [2026-06-27-168, 2026-06-27-167, 2026-06-18-157, 2026-06-03-122]
commits: []
---

# 168 — Weekly-Refresh-Catch-up: Bücher + Podcasts (Teil B)

## Summary

Ran the overdue weekly refresh once cleanly for ISO week **2026-W26**: preflight + detection green, Philipp reviewed the full backlog, the one fresh book was promoted additively, and the per-show cursors were re-baselined. **Podcasts were deferred to a dedicated session per Philipp's call** (both ingest modes rewrite the whole artifact — no new-episodes-only merge — so neither the metered API path nor the full-feed cc-direct re-tag fit this PR cleanly).

## What I did

- `scripts/seed-data/book-roster.extension.json` — appended `W40K-0599` *Armageddon: Season of Fire* (Jude Reid, 2026, novel) verbatim from the fresh `proposal.json`; `import:ssot-roster` re-merged → `book-roster.json` (37 extension rows, 896 books).
- `scripts/seed-data/manual-overrides-ssot-w40k-060.json` — curated the `W40K-0599` override (synopsis, 18 facets, 6 factions, 2 locations, 3 POV characters, unrated) into the **open restbatch slot 0599** (batch 060 was 8/10 after Brief 167 → now 9/10). No new batch 061 needed. Rationale extended.
- `scripts/seed-data/factions.json` — net-new `armageddon_steel_legion` (parent `astra_militarum`).
- `scripts/seed-data/locations.json` — net-new `hive_tartarus`. **Deliberately did NOT reuse the existing `tartarus` row** — that one is the *Dawn of War* planet (used in `ssot-w40k-021`), a different place.
- `scripts/seed-data/characters.json` + `character-aliases.json` — net-new `ambrosius_roth` / `sabreen` / `gavriel` (the three POVs) with rank-prefixed surface-form aliases (Major Ambrosius Roth / Sister Superior Sabreen / Brother Gavriel).
- `ingest/refresh/2026-W26/{report.md,proposal.json}` — fresh detection output.
- `ingest/refresh/book-seen.json` — `refresh:mark-reviewed --books --proposal …W26…` (the 1 fresh book marked seen; 31 total).
- `ingest/refresh/curation-state.json` — `refresh:mark-reviewed --show lorehammer` only (→ 2026-06-28); the three deferred shows stay at the 2026-01-01 floor.
- Closed stale rolling PR **#192** (`automation/weekly-refresh`) — not merged.

## Decisions I made

- **Podcasts deferred (Philipp's call).** I traced that `ingest:podcast` (both `--tagging=api` and `--tagging=cc-direct`) **replaces** the show artifact from the acquired episode set — there is no incremental "tag only the new episodes and merge" path; `--limit N` would *shrink* the committed artifact. So tagging the 8 new episodes means re-running the whole feed: api+Sonnet leans on the warm local LLM-cache (old eps = $0, ~8 new = metered pennies), while cc-direct is zero-metered but needs the entire feed hand-tagged via the driver loop. Presented the trade-off; Philipp chose **defer to a separate session**.
- **Cursor: only Lorehammer advanced.** This overrides Philipp's earlier "mark all 4 shows reviewed" once podcasts were deferred — marking the three *to-be-ingested* shows reviewed would advance their cursors past episodes that aren't in the artifact/DB yet, silently dropping them forever. Lorehammer is the genuinely reviewed-and-skipped show (meta/rules episodes Philipp declined), so its cursor advances; lorecast / adeptus-ridiculous / luetin09 stay at the floor so the follow-up session's `refresh:check` re-surfaces them.
- **Book left `unrated`** (2026 release, no Goodreads value captured) — same additive-pass convention as the Brief 167 OFOB books.
- **Faction granularity:** added `armageddon_steel_legion` as a regiment-level faction (precedent: `catachan_jungle_fighters` / `kasrkin` in the same domain) rather than collapsing to `astra_militarum`.

## Review gate (Philipp's promote/ignore/defer decisions)

- **Book** `W40K-0599` Armageddon: Season of Fire → **promote**.
- **Shows to ingest:** the-40k-lorecast, adeptus-ridiculous, luetin09 → approved, but **execution deferred** (see above). Lorehammer → reviewed + skipped.

## Open questions (answered for the rollup)

- **How many new per source?** Books: **1** (Armageddon: Season of Fire). Episodes: **14** — the-40k-lorecast 4, adeptus-ridiculous 3, lorehammer 6, luetin09 1. `refresh:audit-artifacts` was **clean** (0 shows with DB-ahead-of-artifact drift; all four in sync).
- **Stale W26 rolling PR #192:** superseded by this fresh run — same book but at the pre-167 stale id `W40K-0593`, and 11 episodes vs the now-14. Inspected, recommended close, **closed per Philipp's explicit OK** (CC never merged it).

## Follow-up (next session)

- **Podcast ingest** for `the-40k-lorecast`, `adeptus-ridiculous`, `luetin09` (Brief 168 deferral). Their cursors are intentionally unadvanced, so a fresh `refresh:check` re-surfaces exactly these deltas. Decide api+Sonnet (warm cache, cheap-metered) vs cc-direct (zero-metered, full-feed re-tag via the driver loop). Materialize post-merge via `db:sync` (`apply:podcast`).

## Gates

- `npm run test:refresh` → 65 passed, 0 failed.
- `npm run refresh:audit-artifacts` → clean (4 shows in sync).
- `apply-override-dry` (single batch + full cumulative) → ok; 0 missing facets / FK targets / dangling refs; junction totals in range.
- `npm run db:apply-scope` → roster contiguous (w40k 1..60, hh 1..30).
- `npm run lint` + `npm run typecheck` → green.

> **Ops (Maintainer, post-merge):** `npm run db:sync` lands the book additively; `npm run db:drift` should be clean. No `db:rebuild`/truncate. Podcast materialization waits for the follow-up session.
