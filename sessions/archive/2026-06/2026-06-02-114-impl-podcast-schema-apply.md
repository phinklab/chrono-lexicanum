---
session: 2026-06-02-114
role: implementer
date: 2026-06-02
status: complete
slug: podcast-schema-apply
parent: 2026-06-01-114
links:
  - 2026-06-01-110
commits: []
---

# Podcast Step 2 — Schema + idempotenter Apply

## Summary

The committed pilot artifact now lands in Postgres: new `podcast` + `podcast_episode` work-kinds + detail tables (migration `0010`), an idempotent `(Show, episodeGuid)`-keyed apply that writes the show, 149 episodes, and 519 resolved tag-junctions (`role=subject|mentioned`, `raw_name` set), plus the four bundled alias wins. **The live double-apply is byte-idempotent** — re-applying wrote 0 new rows and held junction counts at 155/267/97. No rendering (Product track).

## What I did

- `src/db/schema.ts` — added work-kinds `podcast` + `podcast_episode`, `source_kind` value `podcast_rss`, the `podcastDetails` (≈ channel_details) and `podcastEpisodeDetails` (≈ video_details) tables with `UNIQUE(podcast_work_id, episode_guid)`, and their relations.
- `src/db/migrations/0010_concerned_black_queen.sql` — generated migration; hand-appended the two CTI kind-check triggers (`assert_podcast_details_kind` / `assert_podcast_episode_details_kind`), matching the 0003 pattern Drizzle can't express.
- `src/lib/ingestion/podcast/apply-plan.ts` — **new** pure module: `assertShowArtifact` (validate-before-mutate), `deriveEpisodeSlug`, `buildApplyPlan` → a declarative, deterministic `ApplyPlan` (show + episodes + FK-gated junction sets + a drop/unresolved report). Shared by the script and the test so the write shape has one source.
- `scripts/apply-podcast.ts` — **new** apply: reads the committed artifact (no live re-fetch), loads DB reference sets, builds the plan, `--dry-run` prints it without writing; the live path upserts the show (match `podcastGuid`→`feedUrl`→`slug`), upserts each episode (match `(show, guid)`), and does per-episode delete-then-insert of the three junction sets.
- `scripts/test-podcast-apply.ts` — **new** DB-free test (analog `test:apply-override-dry`): 25 cases covering validation, slug determinism, plan determinism, FK-safety, the unresolved invariant, role-verbatim, dedup, and double-apply idempotency against an in-memory store that mirrors the script's semantics. Also exercises the real committed artifact end-to-end.
- `scripts/seed-data/character-aliases.json` — added `Guilliman → roboute_guilliman`, `Magnus → magnus_the_red`, `Vect → asdrubael_vect`.
- `scripts/seed-data/location-aliases.json` — added `The Webway → webway`.
- `ingest/podcasts/the-40k-lorecast.json` + `.report.md` — re-ran ingest (warm cache, 148/149 hits, $0.0092) so the four forms resolve; the four canonical ids now appear as tags, none remain unresolved.
- `package.json` — added `apply:podcast` and `test:podcast-apply`.

## Decisions I made

- **`podcast_episode_details.podcast_work_id` `NOT NULL`, `onDelete` no-action** (the brief's open question). An episode always has a show, so this keeps the `UNIQUE(podcast_work_id, episode_guid)` key null-free; no-action means a deleted show surfaces as an FK error rather than silently orphaning/erasing episodes (cleanup is the apply's job, not a cascade's).
- **Populate show metadata now** (the brief's other open question). `podcast_details.{feedUrl,podcastGuid,appleId,imageUrl}` and `works.coverUrl` (← show image) are filled — the data is free from the artifact and avoids a later backfill. `synopsis` stays NULL (the artifact carries no show description).
- **Episode slug = `slugify(showSlug + "-" + guid)`.** Deterministic, globally unique (show slug is UNIQUE, guid is unique-per-show), readable. `assertShowArtifact` rejects any artifact whose episodes would derive an empty, >200-char, or colliding slug — so a bad feed fails loudly before mutation rather than at a DB constraint.
- **Uniform freeze rule:** the `works` row is frozen after insert (slug, title, coverUrl, releaseYear); only `updatedAt` bumps on re-apply. Detail rows and junction sets are refreshed every apply. The brief mandated freezing the episode slug+title; I extended it to the whole `works` row for both show and episode so idempotency has one crisp rule (identity/display frozen, metadata/relationships authoritative). Matches `apply-override.ts`'s book-freeze.
- **`canonicity='fan'`, `source_kind='podcast_rss'`** on both kinds; episode `release_year` ← year of `pubDate` for the universal sort axis.
- **Junction `role` = the artifact's `subject|mentioned`, written verbatim** into the shared `varchar` role column; `raw_name` set; **no `confidence`** on the junction (per brief — it stays in the artifact).
- **Migration enum-add safety:** `ALTER TYPE … ADD VALUE` runs earlier in `0010` than the trigger `CREATE FUNCTION`s that reference the new literals. This is safe because `CREATE FUNCTION` (plpgsql) only stores the body text — the literal is coerced to `work_kind` at trigger-fire time (always a later transaction), never at creation, so there is no "unsafe use of new value" conflict. **Verified live:** `db:migrate` applied `0010` in 492 ms with no error.
- **Pure-module + mirrored-test split:** `buildApplyPlan` is the single shared source of the write shape. The test re-implements the apply's upsert/delete-then-insert against an in-memory store (the real script uses Drizzle) — the same trade-off as `test:apply-override-dry`. True DB idempotency is verified live (below), not just simulated.
- **Bundled alias wins — scope held to the brief's four.** Added only forms with an existing canonical target: `Guilliman`, `Magnus`, `Vect`, `The Webway`. Skipped `Titus`/`Demetrian Titus` (no canonical character row exists) and `the Warp`/`Immaterium` (deliberate umbrellas; `the Warp` is already in `location-policy.redundantSurfaceForms`).
- **No new dependencies, no version pins changed.** Used Drizzle's existing `unique()` builder for the composite constraint.

## Verification

- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm run test:resolver` — 473 passed, 0 failed.
- `npm run test:podcast-ingest` — 10 passed, 0 failed.
- `npm run test:podcast-apply` — 25 passed, 0 failed (incl. real-artifact determinism + double-apply idempotency).
- `npm run test:aliases` — 15 passed, 0 failed (the four new aliases don't regress).
- `npm run db:generate` — produced `0010`; triggers hand-appended.
- `npm run db:migrate` — **applied `0010` to Supabase** in 492 ms (enum-add + tables + triggers).
- `npm run apply:podcast -- --dry-run` — loaded 490 characters / 202 factions / 289 locations; planned 149 episodes, 519 tags→junctions, **0 dropped** (every resolved canonicalId exists in the DB), 0 rows written.
- `npm run apply:podcast` (#1) — show **inserted**, 149 episodes inserted; junctions characters 155 / factions 267 / locations 97 = **519**.
- `npm run apply:podcast` (#2, re-apply) — show **updated** (same UUID), **0 inserted / 149 updated**, episodes-in-DB still 149, junctions **155 / 267 / 97 unchanged** → idempotent on the live DB, no duplicates, no junction drift.

## Open issues / blockers

None. Session is `complete`. Rendering is intentionally out of scope (Product track).

## For next session

- **Rendering (Product track):** episodes/shows now exist as `works`-by-kind (`podcast` / `podcast_episode`) and can surface on the hubs. `works.coverUrl` is populated for the show; episodes inherit show art in the UI.
- **Likely alias typo:** `Bjorn the Fell-Handed` is unresolved, yet `character-aliases.json` has the key `"Bjorn the One-Handed": "bjorn"`. Bjorn's epithet is *the Fell-Handed* — the existing key looks like a typo. Worth a one-line fix (left untouched here to hold scope).
- **Real missing entities (curation candidates), by episode frequency:** `Titus`/`Demetrian Titus` (5 episodes — Space Marine 2 protagonist, no canonical row), `Sol` (location, 6), `Leagues of Votann` (faction, 4), plus `Malcador`, `The Silent King`, `Be'lakor`, `Eldrad`, `Goge Vandire`. These are unresolved-but-real, not noise.
- **A new episode (#149) appeared** during this session's re-run (the feed is live); Step 3's ingest is incremental and cache-warm, so this is cheap to keep current.
- **Step 3:** additional shows (Lorehammer, Adeptus Ridiculous, Laying Down The Lore) — the apply is show-agnostic (keyed on `podcastGuid`/`feedUrl`/`slug`), so it generalizes without change.
- The extraction prompt still over-extracts some common nouns (`Commissar`, `Exarch`, `Astropaths`) — a separate prompt-tuning follow-up, as the brief noted.

## References

- Brief `2026-06-01-114-arch-podcast-schema-apply.md`; Step-1 report `2026-05-31-110-impl-podcast-ingest-pilot.md` (§ OQ-2/OQ-3).
- Existing patterns followed: `scripts/apply-override.ts` (per-unit transaction, freeze-on-update, delete-then-insert), `scripts/apply-audiobook-narrators.ts` (validate-before-mutate, CLI), `src/db/migrations/0003_create_works_foundation.sql` (CTI kind-check triggers), `scripts/apply-override-dry.ts` (DB-free simulation test).
