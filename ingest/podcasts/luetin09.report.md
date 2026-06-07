# Podcast ingest quality report — Luetin09

Reproducible via: `PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast -- --show luetin09` (Brief 122 B1-S2 — registry-driven ingest + episode tagging + link-shape; no schema, no DB).

## Summary

- **Show:** Luetin09 (slug `luetin09`)
- **Feed:** https://www.youtube.com/feeds/videos.xml?channel_id=UC8RfCCzWsMgNspTI-GTFenQ
- **Episodes:** 20
- **Extraction model:** `claude-sonnet-4-6` (prompt version `3f6a5ff87efa`)
- **Resolved coverage:** 18/20 episodes (90.0%) carry ≥1 resolved tag
- **Resolved tags:** 41 total — 31 subject, 10 mentioned
  - by type: 11 character, 23 faction, 7 location
- **Episode kinds:** 19 lore, 0 news_recap, 0 interview, 1 other
- **Show links:** 1 (youtube)
- **Episode links:** 20/20 episodes carry a YouTube watch link (`watch`/`youtube`/`youtube`)
- **Distinct unresolved surface-forms:** 11

## Method (resolution reuse)

Tagging rides the existing rails. The LLM (forced tool call, `temperature: 0`) extracts candidate surface-forms per axis, split into `primary` (→ `role: subject`) and `mentioned`. Each form is resolved by **`resolveSurfaceForm` from `src/lib/aliases`** (Brief 104) — the shared alias/canonical-name index, no forked logic. The authoritative `type` is whatever axis the alias module resolves to (so a mis-bucketed form still lands correctly); confidence is `1.0` for a canonical-name match and `0.9` for an alias-key match (`matchedVia` records which). A form the alias module does not know is recorded under `unresolved` with its raw string — never auto-created as a reference row.

## Determinism

Episodes are sorted by `(pubDate, guid)`, tags by `(type, role, canonicalId)`, unresolved forms by `(axisGuess, role, rawName)`; the artifact carries no wall-clock timestamps. The LLM step is cached under `ingest/.llm-cache/` (gitignored) and run at `temperature: 0`, so a warm-cache re-run reproduces the artifact byte-for-byte. (A cold re-run with the cache cleared re-queries the model; near-identical but not guaranteed byte-identical — the committed cache makes the deterministic path the default.)

## Unresolved surface-forms

Sorted by episode-frequency. These are candidates for the curation pass (real missing entities) or for the alias module to learn (variants/noise).

| axis (LLM guess) | surface-form | # episodes |
|---|---|---|
| character | Yarrick | 2 |
| character | Cyrus | 1 |
| character | Lyubov | 1 |
| character | Men of Iron | 1 |
| character | Thothmek | 1 |
| faction | Leagues of Votann | 1 |
| faction | Steel Legion | 1 |
| location | Atoma Prime | 1 |
| location | Beta Garmon | 1 |
| location | Nachmund | 1 |
| location | Vraks | 1 |

## Spot-check (10 episodes, evenly spaced)

### YOU'LL NEVER SEE THEM AGAIN? - Imperial Guard Regiments | WARHAMMER 40,000 LORE/DISCUSSION

- **Date / kind:** 2025-03-13 · lore
- **Tags:** `faction:astra_militarum` (subject, alias, “Astra Militarum”)

### WHAT IF - ASTARTES NEVER EXISTED? | WARHAMMER 40000 LORE/SPECULATION - 40K

- **Date / kind:** 2025-04-23 · lore
- **Tags:** `faction:adeptus_astartes` (subject, name, “Adeptus Astartes”); `faction:thunder_warriors` (subject, name, “Thunder Warriors”); `faction:imperium` (mentioned, alias, “Imperium of Man”)

### 40K BEGINNERS - TRAITOR ASTARTES [Part 3] | Warhammer 40,000 Lore/History

- **Date / kind:** 2025-05-16 · lore
- **Tags:** `faction:black_legion` (subject, name, “Black Legion”); `faction:death_guard` (subject, name, “Death Guard”); `faction:emperors_children` (subject, name, “Emperor's Children”); `faction:heretic_astartes` (subject, alias, “Chaos Space Marines”); `faction:sons_of_horus` (subject, name, “Sons of Horus”); `faction:thousand_sons` (subject, name, “Thousand Sons”); `faction:world_eaters` (subject, name, “World Eaters”)

### 40K ARBITES LORE - DARKTIDE DEEP DIVE | Warhammer 40,000 Lore/History

- **Date / kind:** 2025-06-21 · lore
- **Tags:** `faction:adeptus_arbites` (subject, name, “Adeptus Arbites”)
- **Unresolved:** “Atoma Prime” (location)

### THE COST OF COURAGE IN M41 - The Tragedy of Lyubov | Warhammer 40,000 Lore/History

- **Date / kind:** 2025-08-13 · lore
- **Tags:** `faction:blood_pact` (subject, name, “Blood Pact”)
- **Unresolved:** “Lyubov” (character)

### 40K PRIMARCHS - SANGUINIUS - THE RISE AND FALL OF AN ANGEL | Warhammer 40,000 Lore/History

- **Date / kind:** 2025-09-28 · lore
- **Tags:** `character:sanguinius` (subject, name); `character:angron` (mentioned, name); `character:ka_bandha` (mentioned, name, “Ka'Bandha”); `faction:blood_angels` (subject, name, “Blood Angels”); `location:baal` (subject, name); `location:signus_prime` (subject, name, “Signus Prime”)
- **Unresolved:** “Beta Garmon” (location)

### 40K - THE DARK AGE OF AI and THE STC LIE | Warhammer 40,000 Lore/Speculation

- **Date / kind:** 2025-11-26 · lore
- **Tags:** `character:the_emperor` (mentioned, alias, “Emperor of Mankind”); `faction:mechanicus` (subject, name, “Adeptus Mechanicus”)
- **Unresolved:** “Men of Iron” (character)

### 40K - THE GREAT NACHMUND WAR [4]: PURIFICATION | Warhammer 40,000 Lore/History

- **Date / kind:** 2025-12-25 · lore
- **Tags:** `location:vigilus` (subject, name)
- **Unresolved:** “Nachmund” (location)

### THE RISE & FALL OF HUMAN CIVILIZATIONS [2] - SURVIVORS OF THE APOCALYPSE

- **Date / kind:** 2026-03-22 · other
- **Tags:** _none resolved_

### 40K - THE SILENT DEATH OF STC - Anything goes now? | Warhammer 40,000 Lore/Discussion

- **Date / kind:** 2026-05-10 · lore
- **Tags:** `faction:mechanicus` (mentioned, name, “Adeptus Mechanicus”)
