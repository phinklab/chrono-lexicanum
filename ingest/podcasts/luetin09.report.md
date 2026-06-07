# Podcast ingest quality report — Luetin09

Reproducible via: `PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast -- --show luetin09` (Brief 122 B1-S2 — registry-driven ingest + episode tagging + link-shape; no schema, no DB).

## Summary

- **Show:** Luetin09 (slug `luetin09`)
- **Feed:** https://www.youtube.com/feeds/videos.xml?channel_id=UC8RfCCzWsMgNspTI-GTFenQ
- **Episodes:** 10
- **Extraction model:** `claude-haiku-4-5` (prompt version `3f6a5ff87efa`)
- **Resolved coverage:** 9/10 episodes (90.0%) carry ≥1 resolved tag
- **Resolved tags:** 24 total — 23 subject, 1 mentioned
  - by type: 9 character, 8 faction, 7 location
- **Episode kinds:** 10 lore, 0 news_recap, 0 interview, 0 other
- **Show links:** 1 (youtube)
- **Episode links:** 10/10 episodes carry a YouTube watch link (`watch`/`youtube`/`youtube`)
- **Distinct unresolved surface-forms:** 8

## Method (resolution reuse)

Tagging rides the existing rails. The LLM (forced tool call, `temperature: 0`) extracts candidate surface-forms per axis, split into `primary` (→ `role: subject`) and `mentioned`. Each form is resolved by **`resolveSurfaceForm` from `src/lib/aliases`** (Brief 104) — the shared alias/canonical-name index, no forked logic. The authoritative `type` is whatever axis the alias module resolves to (so a mis-bucketed form still lands correctly); confidence is `1.0` for a canonical-name match and `0.9` for an alias-key match (`matchedVia` records which). A form the alias module does not know is recorded under `unresolved` with its raw string — never auto-created as a reference row.

## Determinism

Episodes are sorted by `(pubDate, guid)`, tags by `(type, role, canonicalId)`, unresolved forms by `(axisGuess, role, rawName)`; the artifact carries no wall-clock timestamps. The LLM step is cached under `ingest/.llm-cache/` (gitignored) and run at `temperature: 0`, so a warm-cache re-run reproduces the artifact byte-for-byte. (A cold re-run with the cache cleared re-queries the model; near-identical but not guaranteed byte-identical — the committed cache makes the deterministic path the default.)

## Unresolved surface-forms

Sorted by episode-frequency. These are candidates for the curation pass (real missing entities) or for the alias module to learn (variants/noise).

| axis (LLM guess) | surface-form | # episodes |
|---|---|---|
| character | Cyrus | 1 |
| character | Thothmek | 1 |
| character | Vynn Conglahr | 1 |
| character | Yarrick | 1 |
| faction | Leagues of Votann | 1 |
| location | Beta Garmon | 1 |
| location | Indomitus Sprawl | 1 |
| location | Nachmund | 1 |

## Spot-check (10 episodes, evenly spaced)

### 40K PRIMARCHS - SANGUINIUS - THE RISE AND FALL OF AN ANGEL | Warhammer 40,000 Lore/History

- **Date / kind:** 2025-09-28 · lore
- **Tags:** `character:angron` (subject, name); `character:ka_bandha` (subject, name, “Ka'Bandha”); `character:sanguinius` (subject, name); `faction:blood_angels` (subject, name, “Blood Angels”); `location:baal` (subject, name); `location:signus_prime` (subject, name, “Signus Prime”); `location:eye_of_terror` (mentioned, name, “Eye of Terror”)
- **Unresolved:** “Beta Garmon” (location)

### THE SLEEPER LEGION - WHO WON THE HERESY | Warhammer 40,000 Lore/History

- **Date / kind:** 2025-10-23 · lore
- **Tags:** `faction:word_bearers` (subject, name, “Word Bearers”)

### 40K - THE DARK AGE OF AI and THE STC LIE | Warhammer 40,000 Lore/Speculation

- **Date / kind:** 2025-11-26 · lore
- **Tags:** `character:the_emperor` (subject, alias, “The Emperor of Mankind”); `faction:mechanicus` (subject, name, “Adeptus Mechanicus”)

### 40K - THE DARK ANGELS - and return of THE LION | Warhammer 40,000 Lore/History

- **Date / kind:** 2025-12-15 · lore
- **Tags:** `character:lion_el_jonson` (subject, name, “Lion El'Jonson”); `faction:dark_angels` (subject, name, “Dark Angels”)

### 40K - THE GREAT NACHMUND WAR [4]: PURIFICATION | Warhammer 40,000 Lore/History

- **Date / kind:** 2025-12-25 · lore
- **Tags:** `location:vigilus` (subject, name)
- **Unresolved:** “Nachmund” (location)

### BELISARIUS CAWL - THE TRUE OMNISSIAH? | Warhammer 40,000 Lore/History

- **Date / kind:** 2026-02-06 · lore
- **Tags:** `character:belisarius_cawl` (subject, name, “Belisarius Cawl”); `faction:mechanicus` (subject, name, “Adeptus Mechanicus”)
- **Unresolved:** “Vynn Conglahr” (character); “Leagues of Votann” (faction); “Indomitus Sprawl” (location)

### THE RISE & FALL OF HUMAN CIVILIZATIONS [2] - SURVIVORS OF THE APOCALYPSE

- **Date / kind:** 2026-03-22 · lore
- **Tags:** _none resolved_

### 40K 11ED - VINDICATION FOR YARRICK - AMID LORE ARMAGEDDON | Warhammer 40,000 History/Rant/Lore

- **Date / kind:** 2026-04-10 · lore
- **Tags:** `faction:astra_militarum` (subject, alias, “Astra Militarum”); `faction:orks` (subject, name); `location:armageddon` (subject, name)
- **Unresolved:** “Yarrick” (character)

### 40K - THE SILENT DEATH OF STC - Anything goes now? | Warhammer 40,000 Lore/Discussion

- **Date / kind:** 2026-05-10 · lore
- **Tags:** `faction:imperium` (subject, alias, “Imperium of Man”)

### THE EMPEROR WAS DEFEATED - BEFORE - THE SIEGE OF TERRA | Warhammer 40,000 Lore/History

- **Date / kind:** 2026-05-22 · lore
- **Tags:** `character:konrad_curze` (subject, name, “Konrad Curze”); `character:lion_el_jonson` (subject, name, “Lion El'Jonson”); `character:the_emperor` (subject, alias, “The Emperor of Mankind”); `location:terra` (subject, name); `location:webway` (subject, name)
- **Unresolved:** “Cyrus” (character); “Thothmek” (character)
