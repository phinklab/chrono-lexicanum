---
session: 2026-06-09-122
role: implementer
date: 2026-06-09
status: complete
slug: batches-entity-blurbs
parent: 2026-06-03-122
links:
  - 2026-06-04-129
commits: []
---

# 122-B3 — Entity-Blurbs (F/C/W)

## Summary

Added short, web-verified factual blurbs for **143 entities** (56 factions, 49
characters, 38 worlds) as committed seed-data JSON keyed by existing entity ids — **no
schema, no migration, no `seed.ts` change**, per Spec 129 decision #4. This is the
113-entity hand-curated B3 pass **plus a 30-entity long-tail re-pilot** that proved out a
reusable full-coverage mechanism. The one fact Cowork most needs: B3 ships a **curated
subset + the machinery to finish the rest**, not all 981 entities yet; the remaining ~838
are a tooled follow-up sweep (runbook below), and the consuming request-time loader is the
Product strand's job (B3 ships data + a build-visible integrity test only).

**Pivot mid-session (Philipp's call):** the full sweep runs on **subscription Sonnet
subagents, not the metered Anthropic API** — same "15 entities → fresh context → repeat"
shape, zero per-token cost. The re-pilot's 30 blurbs were generated this way and verified
short (2 sentences, 222–324 chars each).

## What I did

- `scripts/seed-data/faction-blurbs.json` — 56 blurbs: 46 curated (browse-roots + Imperium + First-Founding Legions + iconic tail) + 10 long-tail re-pilot (the three Ordos, Sabbat-Worlds regiments & warbands).
- `scripts/seed-data/character-blurbs.json` — 49 blurbs: 39 curated (primarchs + spotlight) + 10 long-tail re-pilot (Gaunt's Ghosts / Ciaphas Cain supporting cast).
- `scripts/seed-data/location-blurbs.json` — 38 blurbs: 28 curated Cartographer-visible worlds (`gx != null`) + 10 long-tail re-pilot (Scarus/Sabbat worlds & regions).
- `scripts/test-entity-blurbs.ts` — standalone integrity test (no DB, no framework; `node:assert/strict` + `check()` wrapper, mirroring `test-resolver-data-integrity.ts`). Subset-based (validates whatever is present) with an optional `BLURBS_REQUIRE_FULL=1` 100 %-coverage gate.
- `scripts/list-uncovered-blurbs.ts` — the resume oracle: diffs entity seed files against the blurb files and prints the remainder as ready-to-feed subagent batches (`npm run blurbs:remaining`).
- `scripts/generate-entity-blurbs.ts` — the API-key generator (reference / metered path; **not** used for the subscription sweep). `npm run generate:blurbs`.
- `scripts/runbooks/entity-blurbs-full-run.md` — the full-coverage sweep procedure (subscription Sonnet subagents, the prompt template, the loop, the final gate).
- `package.json` — wired `test:blurbs`, `blurbs:remaining`, `generate:blurbs`.
- `scripts/seed-data/README.md` — Files table + "Notes on entity-blurbs" updated for the sweep, the resume oracle, and the test's new caps.

Each blurb row: `{ id, blurb, source_kind: "manual", confidence, sourceUrl, checkedAt }`.

## Decisions I made

- **No schema column — committed curation JSON instead.** The `factions`/`characters`/`locations` tables have no blurb column and no `source_kind`/`confidence` columns. Adding them would be a 3-table migration, which Spec 129 decision #4 ("Kurations-Schicht = committed JSON über vorhandene IDs, kein Schema") + line 135 ("Blurbs reiten auf B3 … Kein Schema, kein Resolver") + Board guardrail #5 explicitly forbid. So this is **not** a `needs-decision` — the architecture already chose the JSON path. Blurb text lives only in the JSON, read at request time by 121's loader.
- **Per-row provenance mirrors `audiobook-narrators.json`** (the closest precedent for hand-curated + web-verified data): per-entry `confidence` + `sourceUrl` + `checkedAt`. `source_kind: "manual"` because the blurb text is hand-authored composition (DB `source_kind` enum value); `sourceUrl` records the verification source (Lexicanum).
- **Coverage = curated doors, confirmed with Philipp (2026-06-09):** factions = browse-roots + Legions + iconic tail (~45, not all 202); characters = primarchs + spotlight (~40, not all 490); worlds = the 28 map-coordinate worlds (not the 261 coordinate-less lore worlds). Spec 129 deliberately deferred the `/welten` door, so lore-only worlds are out of scope here.
- **Excluded Typhus & Szarekh from the primarch tier** — both matched a `/primarch/` notes grep but neither is a primarch (Typhus = Death Guard First Captain; Szarekh = the Silent King, "primarch-tier"). Kept both as spotlight characters. **Skipped Malcador, Ahriman, Abaddon, Dante, Yarrick** — not present in `characters.json`; including them would dangle and fail the test.
- **Did NOT run the agent workflow.** I initially launched a 32-agent draft/verify workflow (ultracode default); Philipp flagged it as disproportionate for this data task. Switched to authoring all 113 blurbs inline from knowledge, web-spot-checking only the uncertain few (Gudrun, Cretacia, Aeldari page). Same result, a fraction of the cost.
- **`confidence` 0.8–0.95**, reflecting certainty: 0.95 for well-established core lore, 0.85–0.9 where the fact or exact source page was less certain (e.g. Honsou 0.85, the `void`/"Warp Corridor" map placeholder 0.8, the Isstvan/Istvaan spelling variance 0.85).
- **Integrity test is subset-based, not exact-list.** When the goal became full coverage, pinning an exact curated id-list stopped making sense (it would reject every new sweep batch). The test now validates whatever is present: every id resolves against the entity seed file (dangling → fail), no duplicates, and every blurb is ≤ 3 sentences / ≤ 460 chars with a valid `source_kind`, `confidence ∈ (0,1]`, https `sourceUrl`, and `YYYY-MM-DD` `checkedAt`. `BLURBS_REQUIRE_FULL=1` adds a 100 %-coverage assertion — the final gate once the sweep is done. A dangling/over-long blurb fails the build — Spec 129's "dangling ID fällt laut, build-sichtbar", realised without any UI.
- **Re-pilot mechanism = subscription Sonnet subagents.** The 30 long-tail blurbs were generated by three `sonnet` subagents (one per type, fresh context each, web search only when unsure), which bill against the subscription rather than the API. The first pilot (via the API generator) drifted to 400–700-char essays; the tightened prompt (2–3 sentences, ≤320-char target, explicit anti-padding) fixed it — the re-pilot landed at 222–324 chars. This is the chosen path for the full sweep; the API generator stays as a metered fallback only.

## Verification

- `npm run test:blurbs` — **pass** (56 factions, 49 characters, 38 locations; all shape/length/integrity checks green)
- `npm run test:resolver-data` — **pass** (existing seed-data integrity unaffected)
- `npm run typecheck` (`tsc --noEmit`) — **pass** (covers the new `list-uncovered-blurbs.ts` + `generate-entity-blurbs.ts`)
- `npm run lint` (`eslint .`) — **pass**
- `npm run blurbs:remaining` — reports 838 remaining (146 factions / 441 characters / 251 locations), 143 done.

## Open issues / blockers

None. Not committed — awaiting `fertig`/`PR erstellen`. Branch: `codex/ingest-batches-entity-blurbs`.

## For next session

- **Full-coverage sweep (the immediate next task):** generate blurbs for the remaining ~838 entities via subscription Sonnet subagents. Everything is staged — follow [`scripts/runbooks/entity-blurbs-full-run.md`](../../scripts/runbooks/entity-blurbs-full-run.md): `npm run blurbs:remaining` to see/print batches, spawn one `sonnet` subagent per ~15-entity batch with the runbook's prompt template, append results, `npm run test:blurbs` after each, finish with `BLURBS_REQUIRE_FULL=1 npm run test:blurbs`. No information is needed beyond the runbook + the committed files.
- **Product (121):** build the request-time loader that joins these blurbs onto the entity hubs/door tiles. It should re-validate ids and "fall loud" on a dangling ref (the data is already loader-ready: typed, id-keyed, one file per entity type).
- **B9 (curated characters):** the spotlight character set here is a natural seed for B9's gallery; B9 can reference these ids directly.

## References

- Spec 129 — `sessions/2026-06-04-129-arch-doorways-curation-layer.md` (decisions #4, Strand-Split line on B3 blurbs).
- Board 122 — `sessions/2026-06-03-122-arch-batches-board.md` (B3 row, guardrails).
- Shape precedent: `scripts/seed-data/audiobook-narrators.json`; test precedent: `scripts/test-resolver-data-integrity.ts`.
- Lexicanum (`wh40k.lexicanum.com`) for fact/URL verification of the uncertain entries.
