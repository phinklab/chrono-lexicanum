---
session: 2026-05-02-028
role: implementer
date: 2026-05-02
status: complete
slug: hygiene-pack-2c2
parent: 2026-05-02-027
links:
  - 2026-05-02-024
  - 2026-05-02-025
  - 2026-05-02-026
commits:
  - 2aa03f694f6b622ba3c5375f9be648768e65c786
  - 6bcb2714e21f5f5326557ce691e0fe7bde32b9df
  - 8ec2061c5c54a3ed44a77b4f6695b74f4b93625a
  - 53890f42d75246649c6feaf2bbd13b3e81b6080b
---

# Stufe 2c.2 — Hygiene-Pack (impl)

## Summary

Three loose ends from Stufe 2c.1 shipped on `feat/2c2-hygiene-pack` (PR #12). `series.json` `horus_heresy_main.total` 10 → 54 (canonical Black Library count); 5-line code-comment above `scripts/seed.ts:371` documents the slug-suffix decision; `npm run check:eras` wired into the `lint-and-typecheck` CI job. Reseed against the dev DB confirmed `Vol 41 / 54` rendering for *Master of Mankind* via curl smoke. CI green incl. the new step.

## What I did

- `sessions/2026-05-02-027-arch-hygiene-pack-2c2.md` — committed the brief.
- `sessions/README.md` — Cowork's pre-edit (027 active-thread row, 026 row, 025 flipped to implemented; carry-over: dropped `check:eras ins CI`, expanded redirect-mechanism note, added `series.totalPlanned` Sammelposten) folded in pre-impl.
- `ROADMAP.md` — Cowork's pre-edit (Phase 2a row split: 2c.1 done, 2c.2 added) folded in pre-impl.
- `scripts/seed-data/series.json` — `horus_heresy_main`: `total` 10 → 54; `note` expanded to capture the canonical source ("54 numbered novels, Horus Rising → The Buried Dagger; Siege of Terra continues as siege_of_terra.").
- `scripts/seed.ts` — 5-line `//`-comment above the `slugify(...)` call at the top of the per-book loop (formerly L371). Captures the editorial decision date (2026-05-02), session reference (027), and the Phase-4-collision rationale verbatim from the brief's recommended wording. No behavioral change.
- `.github/workflows/ci.yml` — appended `- run: npm run check:eras` after `npm run typecheck` in the `lint-and-typecheck` job. Two added lines (blank separator + step).

## Decisions I made

- **Expanded `note` field** instead of leaving it as `"Core arc."`. Reason: the new `total: 54` value benefits from carrying its provenance in the data file itself (future grep / future "wait, is this right?" reflex finds the answer immediately). Brief listed this as optional; the cost is one long string.

- **Comment as `//`-block, not JSDoc.** Matched the existing comment immediately below it (the `primaryEraId` validation block, also a `//`-block referencing brief 023). Keeps the visual texture of the loop body consistent.

- **Comment wording: brief's suggestion, near-verbatim.** Brief explicitly said "exakte Wortwahl deine"; I took the recommendation almost word-for-word because it already named the three load-bearing pieces (decision date + session ref + Phase-4-collision rationale + accepted cosmetic cost). Re-writing it to be different would have been worse.

- **CI step position: after `typecheck`** as the brief specified. Trade-off acknowledged in the brief — `check:eras` is the cheapest of the three but conceptually the last filter. Accepted.

- **DB verification path: ad-hoc tsx script, not psql.** No `psql` in the local PATH (Windows + Git Bash). Wrote a temp `scripts/_tmp-verify-027.ts` (10 lines, async IIFE around `postgres` client + one SELECT) to confirm `total_planned = 54`, then deleted the file. Did NOT commit it; not a long-term tool.

- **Curl smoke caveat.** The brief asked for the rendered HTML to contain `Vol 41 / 54` literally. The actual HTML emitted by Next is `Vol 41<!-- --> / 54` — React inserts a `<!-- -->` text-node boundary between the two adjacent JSX expressions in `DetailPanel.tsx:228-229`. Visible/rendered text is correct (`Vol 41 / 54`); flagging it because a future curl-grep for the literal string will miss it without the comment-tolerance.

- **No other `series.total` values touched.** Brief Constraint 8 + Out-of-scope #2 explicit: `gaunts_ghosts`, `ciaphas_cain`, `hh_more`, `space_wolves_sw`, `siege_of_terra` are all under-counted today but invisible until Phase 4 (no `seriesIndex > total` collision). Stays in carry-over (Cowork already added the Sammelposten row in the pre-edit).

- **Branch + commit split.** 4 commits: brief commit (carries Cowork's pre-edits) + one each for the three items, in dependency-free order so reviewers can read them as three independent diffs. Per CLAUDE.md "one logical change per commit." No `Co-Authored-By: Claude` trailer (per memory).

## Verification

Local (Git Bash on Windows; `npm.ps1` blocked by ExecutionPolicy, run via Bash tool):

- `npm run db:seed` — `Inserted 21 series.` and the rest of the 26-book bundle, no errors. Idempotent (matches session 022 numbers).
- DB SELECT via tsx + `postgres` client: `{"id":"horus_heresy_main","name":"The Horus Heresy","total_planned":54}`. ✓
- `curl -sS "http://localhost:3000/timeline?era=horus_heresy&book=master-of-mankind-hh41"` — 200 OK, HTML contains `<span class="dm-vol-count">Vol 41<!-- --> / 54</span>` (rendered text `Vol 41 / 54`). ✓
- `npm run lint` — pass (1 pre-existing `layout.tsx` font warning unchanged).
- `npm run typecheck` — pass.
- `npm run check:eras` — pass; distribution `1·5·1·1·0·15·3 = 26`, `OK — all 26 books carry a valid primaryEraId.`
- `npm run build` — pass; `/timeline` remains `(Dynamic) ƒ`, Hub revalidate=1h preserved, no static-render regressions.

CI (PR #12, run 25258356367):

- `ci / lint-and-typecheck` — pass in 25s.
- `Run npm run check:eras` step appears in the job log between `Run npm run typecheck` and the end-of-job, prints the same Era-distribution table + `OK` message as locally.
- Vercel preview deploy — pass.

## Open issues / blockers

None.

## For next session

- **`series.total` Sammelposten** — already on the carry-over (Cowork's pre-edit). Stichprobe noted in this session's curl/DB scan didn't surface anything new beyond the brief's list (`gaunts_ghosts: 4`, `ciaphas_cain: 3`, `hh_more: 4`, `space_wolves_sw: 4`, `siege_of_terra: 5`). Whoever takes the cleanup brief should treat each series independently — sourcing per series varies (Lexicanum, Black Library product page, Goodreads series page) and a per-series editorial note in the `note` field would make the next reviewer's life easier.

- **Series-Note sourcing format** (raised in brief Open Questions). My take after expanding the `horus_heresy_main` note: a one-line natural-language sentence works fine if the count is uncontroversial (single canonical source). For series where multiple sources disagree (e.g. `hh_more` Primarchs — Lexicanum lists the novellas separately from the novels), a structured `source` sub-field (`{"total": 14, "source": "lexicanum:Horus_Heresy_Series_Primarchs"}`) might earn its keep. Not urgent; the roster doc (`docs/data/2b-book-roster.md`) is the central provenance store today and probably stays that way until ingestion lands.

- **Self-test for the new CI step.** A future "what does check:eras catch?" sanity test could be wired in by deliberately introducing a bad `primaryEraId` on a feature branch and confirming CI fails. Not done in this session — the green run on PR #12 is necessary-not-sufficient evidence the step works. Low priority; the script's exit-1 path is already unit-tested by local dev (it's caught at least three of my typos during 024's seed iteration).

- **The `<!-- -->` JSX boundary in `DetailPanel.tsx`** isn't a bug, but it does mean any future automated check that greps the rendered HTML for adjacent-expression strings (e.g. "Vol 1 / 3", "1 of 5") needs to grep with a `Vol [0-9]+(<!-- -->)? / [0-9]+` pattern or render to text first. Only matters if anyone ever writes such a check — flagging because I just walked into it.

## References

- Black Library numbering for *The Horus Heresy* main series, novel #54 *The Buried Dagger* (Wraight, 2019). Brief 027 § "Warum 54 für `horus_heresy_main`" walks the rationale; I did not re-verify against Lexicanum since the brief author had already benchmarked.
- React JSX adjacent-expression `<!-- -->` boundary: standard server-render output, documented in React's JSX-to-HTML reconciler since the introduction of streaming SSR.
