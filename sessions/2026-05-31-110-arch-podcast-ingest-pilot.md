---
session: 2026-05-31-110
role: architect
date: 2026-05-31
status: open
slug: podcast-ingest-pilot
parent: null
links: ["2026-05-31-109", "2026-05-29-105", "2026-05-29-104"]
commits: []
---

# Podcast track — kickoff & Step 1 (pilot ingest + episode tagging, no DB yet)

## Goal

Kick off the **podcast data track** — the Batches-side parallel track of the entity-graph arc (Brief 109) — and ship **Step 1**: ingest one pilot show's RSS feed and tag its episodes to the *existing* canonical entities via the resolver, producing a **committed, reviewable artifact + a quality report**, with **no schema change and no DB writes**. The point of Step 1 is to judge tagging quality cheaply before we commit to a storage layer.

> Cross-media context, decisions (4)–(7) and the role-vocabulary call live in Brief 109's arc-frame. This brief records the podcast-specific decisions and specs Step 1.

## The track — frame & decisions

1. **Podcasts are `works`, not a second database** (Brief 109 decision 1). A show and its episodes become `works` rows; the existing entity junctions (`work_characters` / `work_factions` / `work_locations`) tag them exactly like books, so they surface on the same entity pages and in the same search. (No storage is built in *this* step — see scope.)
2. **Data access is public and free — and not Spotify.** Resolve a show → its real RSS `feedUrl` via the Apple iTunes lookup endpoint (`https://itunes.apple.com/lookup?id=<showId>`, no auth). The **RSS feed (RSS 2.0 + iTunes namespace) is the source of truth**; Podcast Index (free key) is an optional search/aggregator. **Spotify is out** (no public RSS) and **Listen Notes is out** (its free/pro tier forbids storing API responses on our servers). Verified live this session: the lookup returns `feedUrl` + cover + episode count + last-release, and a real feed carries stable show + per-episode GUIDs, the `<enclosure>` audio URL, `pubDate`, and `itunes:duration`.
3. **Episode-level, not show-level** (Philipp's scope call). The lexicanum value is "this *episode* is about X"; a whole show tagged to everything is useless. The show is a container; the episode is the unit that gets tagged.
4. **Tagging rides the existing rails.** Tagging an episode is the same problem the book pipeline already solves: a surface-form ("Konrad Curze") → the resolver/alias library → a canonical entity ID → a junction with a `rawName` + `confidence` audit trail. The only difference is the text source: episode **title + description** instead of a book synopsis. Reuse the **resolution library** (Brief 104 `src/lib/aliases/` + the resolver), **not** the SSOT-Excel / override apparatus (podcasts are not in the maintainer's spreadsheet). "Is about" = junction `role='subject'` (Brief 109 decision 7). Unresolved surface-forms are **flagged**, never auto-created as reference rows — curation of the canonical set stays deliberate.
5. **Dry-run-first.** Prove acquisition + tagging quality as a committed, reviewable artifact **before** any schema or DB work — the project's established pattern (`ingest/.last-run/` dry-run diffs; Brief 105's spot-check-before-bulk). Step 2 (schema + apply) only happens after we review this artifact together.
6. **Store metadata, link the episode, never rehost audio.** We persist titles/descriptions/links and deep-link to the episode (the `<enclosure>` URL / Apple / show site) — same posture as the book storefront links. RSS is published for syndication, so the risk is low; skip any show whose feed copyright forbids it.
7. **Pilot first, then a curated handful.** One show end-to-end first; scale only once quality is confirmed.

### Sequencing (one step → one brief → one PR)

- **Step 1 (this brief, Batches):** pilot ingest + episode tagging → committed artifact + quality report. **No schema, no DB.**
- **Step 2 (Batches):** model shows/episodes as `works` (kinds + detail shape — see open questions), a new `source_kind` for provenance, and an **idempotent apply** (dry-run diff → DB) keyed on the stable GUIDs.
- **Step 3 (Batches):** scale to the curated handful (Lorehammer, Adeptus Ridiculous, Laying Down The Lore — verify each `feedUrl` first).
- **Rendering (Product track, Brief 109):** episodes appear on entity pages (works grouped by kind) and in browse automatically once they are `works` — no extra podcast UI work.

---

# Brief 110 · Step 1 — pilot ingest + episode tagging

> Batches strand. A read-only proof: fetch one feed, tag its episodes against existing entities, write a reviewable artifact. No schema, no DB writes.

## Goal

Ingest the pilot show's RSS feed and, for each episode, resolve its subject entities against the existing canonical reference set — emitting a committed artifact (per-episode metadata + resolved tags + unresolved surface-forms) and a human-readable quality report, so we can judge whether title+description tagging is good enough before building the storage layer.

## Context

Batches worktree `chrono-lexicanum-batches`. Pilot show: **The 40k Lorecast** — `feedUrl` `https://feeds.redcircle.com/cc233adb-de43-49be-bb76-9720292ddc98` (resolved this session via `https://itunes.apple.com/lookup?id=1709093251`; ~148 episodes, actively publishing, episode-per-topic titles like *"…Konrad Curze & The Night Lords"*). The feed is RSS 2.0 + iTunes namespace; confirmed per-item fields: `itunes:title`/`title`, `description` + `content:encoded` (HTML), `<enclosure url type length>` (audio), `<guid>` (stable), `pubDate`, `itunes:duration`, `itunes:episode`/`season`; channel-level `podcast:guid`, `itunes:image`.

Resolution reuses the existing **alias module** (Brief 104, `src/lib/aliases/`) + the resolver path, against the existing reference rows (~490 characters / ~290 locations / ~200 factions). Ingestion helpers live under `src/lib/ingestion/`.

This is Step 1 of the track framed above; it deliberately stops before any schema/DB so we can review tagging quality first.

## Constraints

- **No schema, no DB, no new reference rows.** The deliverable is a committed artifact + report. `git diff` shows only new script(s), the artifact/report, and (if needed) a `package.json` parser dependency.
- **Fetch the feed over HTTP and parse the RSS/iTunes fields.** Don't pin the parser library (version policy) — research the current stable, pin it in `package.json`, rationale in the report.
- **Tagging text = title + description** (HTML stripped to text). **No transcripts.**
- **LLM extraction via the project's existing LLM path** (Haiku-class; use the configured model, don't pin a model string). Extract candidate subject entities (characters / factions / locations) with a primary-vs-mentioned distinction.
- **Resolution reuses the alias/resolver library** — surface-form → canonical ID. Do **not** fork or duplicate alias logic. Unresolved surface-forms are recorded as `unresolved` in the artifact with their raw string; **never** auto-create a reference row.
- **Idempotent + deterministic.** Key episodes by their feed `<guid>`; a re-run produces a byte-stable artifact (sorted, pinned). Caching the LLM step (the `ingest/.llm-cache/` pattern) is encouraged so re-runs are cheap and stable.
- **Artifact + report location:** a committed JSON under the ingest area (e.g. `ingest/podcasts/the-40k-lorecast.json`) — per episode `{ guid, title, pubDate, durationSec, audioUrl, link, tags: [{ type, canonicalId, rawName, role, confidence }], unresolved: [...] }` — plus a markdown quality report (coverage %, tag counts by type, the unresolved list, a ~10-episode spot-check).
- TypeScript strict, no `any`. Reuse `src/lib/ingestion/` + `src/lib/aliases/` patterns where they fit.
- **Git:** code → task branch + PR (Batches: `codex/ingest-batches-<slug>`); announce the detected worktree / strand / branch before editing. This brief file is doc-only and already on `main`; flip its `status: open → implemented` inside the PR.

## Out of scope

- **Any schema change / DB write / migration / `source_kind` addition** → Step 2.
- **The curated handful** (other shows) → Step 3. Stick to the one pilot show.
- **UI / rendering episodes on entity pages** → the Product track (Brief 109).
- **Transcripts; Spotify; Listen Notes; affiliate links; hosting or caching the audio files** themselves (we only record the URL).
- **Auto-creating reference entities** for unresolved surface-forms — that stays a separate, deliberate curation step.
- Writing `role='subject'` to the DB — there is no DB write here; the artifact merely *records* the intended role.

## Acceptance

The session is done when:

- [ ] A committed artifact lists every pilot-show episode with parsed metadata (`guid`, title, date, duration, audio URL, link) and, per episode, resolved entity tags (`type`, `canonicalId`, `rawName`, `role`, `confidence`) plus unresolved surface-forms.
- [ ] A quality report states: total episodes, % with ≥1 resolved tag, tag counts by entity type, the unresolved surface-form list, and a ~10-episode spot-check with the tags shown.
- [ ] Resolution reuses the existing alias/resolver library (the report shows how; no forked alias logic).
- [ ] A second run reproduces the same artifact (determinism — say so in the report).
- [ ] No schema/DB change; `git diff` shows only the script(s), artifact, report, and any parser dep in `package.json`.
- [ ] `npm run typecheck`, `npm run lint` green.
- [ ] PR opened (not merged — Philipp merges); this brief flipped to `status: implemented` in the PR.

## Open questions for your report

- **Tagging quality** — what's the resolved-coverage %, and how clean is the spot-check? This is the decision input for whether title+description suffices or some shows will need transcripts later.
- **Unresolved surface-forms** — how many distinct ones, and are they real missing entities worth curating, or noise/variants the alias module should learn?
- **Step-2 modeling (your input wanted):** dedicated `podcast` + `podcast_episode` kinds (my lean — audio ≠ video, and episodes need fields the book columns don't have) **vs** reusing/generalizing the existing `channel` + `video` CTI (which the schema comments earmark for "future non-book works")? You can read the actual schema usage — push back if reuse is clearly better. Where should the stable episode ID live? (`<guid>` is ~36 chars; `works.externalBookId` is `varchar(16)` and book-named, so episodes need their own key.)
- **Role vocabulary** — is `subject` + `mentioned` enough for the episode→entity relationship, or do you want a distinct value?
- **Bonus/news/recap episodes** (no lore subject, e.g. a convention recap) — just zero-tag them (a gap), or capture a type/flag so the UI can hide them later?

## Notes

- **Verified this session (so you don't re-derive it):** Apple lookup → `feedUrl` works with no auth; the live Lorecast feed has stable show + episode GUIDs, `<enclosure>` audio URLs, `pubDate`, `itunes:duration`; episode titles name their subject. Spotify exposes no RSS; Listen Notes' free/pro tier forbids storing responses; Podcast Index is free (key + secret).
- **Dry-run-first** mirrors the project's `ingest/.last-run/` diff pattern and Brief 105's spot-check-before-bulk. Step 2 (schema + apply) waits until we've reviewed this artifact.
- **Pilot:** The 40k Lorecast (`id=1709093251`). **Step-3 candidates:** Lorehammer, Adeptus Ridiculous, Laying Down The Lore — resolve each `feedUrl` via Apple lookup and sanity-check episode-title format before bulk.
- References: Brief 109 (entity-graph arc, the parallel podcast track, `role='subject'`); Brief 104 (alias/resolution module to reuse); Brief 105 (committed-sidecar + spot-check-before-bulk precedent); `src/lib/ingestion/`, `src/lib/aliases/`, the resolver.
