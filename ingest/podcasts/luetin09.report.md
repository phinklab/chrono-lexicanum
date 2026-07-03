# Podcast ingest quality report — Luetin09

Reproducible via: `PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast -- --show luetin09` (Brief 122 B1-S2 — registry-driven ingest + episode tagging + link-shape; no schema, no DB).

## Summary

- **Show:** Luetin09 (slug `luetin09`)
- **Feed:** https://www.youtube.com/feeds/videos.xml?channel_id=UC8RfCCzWsMgNspTI-GTFenQ
- **Episodes:** 192
- **Extraction model:** `claude-sonnet-4-6` (prompt version `3f6a5ff87efa`)
- **Resolved coverage:** 169/192 episodes (88.0%) carry ≥1 resolved tag
- **Resolved tags:** 389 total — 260 subject, 129 mentioned
  - by type: 55 character, 283 faction, 51 location
- **Episode kinds:** 192 lore, 0 news_recap, 0 interview, 0 other
- **Show links:** 1 (youtube)
- **Episode links:** 192/192 episodes carry a YouTube watch link (`watch`/`youtube`/`youtube`)
- **Distinct unresolved surface-forms:** 42

## Method (resolution reuse)

Tagging rides the existing rails. The LLM (forced tool call, `temperature: 0`) extracts candidate surface-forms per axis, split into `primary` (→ `role: subject`) and `mentioned`. Each form is resolved by **`resolveSurfaceForm` from `src/lib/aliases`** (Brief 104) — the shared alias/canonical-name index, no forked logic. The authoritative `type` is whatever axis the alias module resolves to (so a mis-bucketed form still lands correctly); confidence is `1.0` for a canonical-name match and `0.9` for an alias-key match (`matchedVia` records which). A form the alias module does not know is recorded under `unresolved` with its raw string — never auto-created as a reference row.

## Determinism

Episodes are sorted by `(pubDate, guid)`, tags by `(type, role, canonicalId)`, unresolved forms by `(axisGuess, role, rawName)`; the artifact carries no wall-clock timestamps. The LLM step is cached under `ingest/.llm-cache/` (gitignored) and run at `temperature: 0`, so a warm-cache re-run reproduces the artifact byte-for-byte. (A cold re-run with the cache cleared re-queries the model; near-identical but not guaranteed byte-identical — the committed cache makes the deterministic path the default.)

## Unresolved surface-forms

Sorted by episode-frequency. These are candidates for the curation pass (real missing entities) or for the alias module to learn (variants/noise).

| axis (LLM guess) | surface-form | # episodes |
|---|---|---|
| faction | Old Ones | 4 |
| location | the Warp | 4 |
| location | Nachmund Gauntlet | 3 |
| character | Goge Vandire | 2 |
| character | Sebastian Thor | 2 |
| faction | Men of Iron | 2 |
| location | Koronus Expanse | 2 |
| character | Centurius | 1 |
| character | Colonel Bane | 1 |
| character | Corporal Varlak | 1 |
| character | Demetrian Titus | 1 |
| character | Gork | 1 |
| character | Grizgutz | 1 |
| character | Illuminor Szeras | 1 |
| character | Kryptman | 1 |
| character | Lyubov | 1 |
| character | Malice | 1 |
| character | Mork | 1 |
| character | Sly Marbo | 1 |
| faction | Ambull | 1 |
| faction | Death Cult Assassins | 1 |
| faction | Fire Hawks | 1 |
| faction | Mordant Acid Dogs | 1 |
| faction | Necrontyr | 1 |
| faction | Sons of Malice | 1 |
| location | Atoma Prime | 1 |
| location | Charadon | 1 |
| location | Crone Worlds | 1 |
| location | Daemon Worlds | 1 |
| location | Gorkamorka | 1 |
| location | Hive Secundus | 1 |
| location | Lorn V | 1 |
| location | Maiden Worlds | 1 |
| location | Moebian Domain | 1 |
| location | Naxos | 1 |
| location | Nephilim Sector | 1 |
| location | Rophanon | 1 |
| location | Ryza | 1 |
| location | Tertium | 1 |
| location | The Maw | 1 |
| location | Tomb Worlds | 1 |
| location | Zhao-Arkhad | 1 |

## Spot-check (10 episodes, evenly spaced)

### IMPERIUM OF MAN | Warhammer 40,000 Overview

- **Date / kind:** 2014-12-28 · lore
- **Tags:** `faction:imperium` (subject, alias, “Imperium of Man”)

### MEGA CITIES - JUDGE DREDD  | Lore / History / Beginner's Guide

- **Date / kind:** 2018-09-06 · lore
- **Tags:** _none resolved_

### THE EMPEROR OF MAN [3.1] Addendum- Faith & The Warp - WARHAMMER 40,000 Semantics

- **Date / kind:** 2019-05-21 · lore
- **Tags:** `character:the_emperor` (subject, alias, “Emperor of Mankind”)
- **Unresolved:** “the Warp” (location)

### THE ZOATS RETURN TO 40K - WIDER IMPLICATIONS | Warhammer 40,000 Lore/History

- **Date / kind:** 2020-01-26 · lore
- **Tags:** `faction:tyranids` (subject, name)

### 40K - CHRONOSTRIFE WAR - Is it actually M42?? | Warhammer 40,000 Lore/History

- **Date / kind:** 2020-11-06 · lore
- **Tags:** `faction:imperium` (mentioned, alias, “Imperium of Man”)

### 40K's MOST INSANE & POWERFUL WEAPONS [Part FOUR] | WARHAMMER 40,000 Lore/History

- **Date / kind:** 2021-09-12 · lore
- **Tags:** `faction:adeptus_astartes` (subject, name, “Adeptus Astartes”); `faction:death_korps_of_krieg` (subject, name, “Death Korps of Krieg”); `faction:emperors_children` (subject, name, “Emperor's Children”); `faction:sisters_of_battle` (subject, alias, “Adepta Sororitas”)

### KNIGHTS OF 40K - DEFENDERS OF THE FARTHEST FRONTIER | Warhammer 40,000 Lore/History

- **Date / kind:** 2022-09-21 · lore
- **Tags:** `faction:imperial_knights` (subject, name, “Imperial Knights”)

### 40K - DA ORKS 10 BEST SHOOTAS | Warhammer 40,000 Lore/History

- **Date / kind:** 2023-08-19 · lore
- **Tags:** `faction:orks` (subject, name)

### 40K - KASRKIN ORIGINS - CADIAN SPEC OPS | Warhammer 40,000 Lore/History

- **Date / kind:** 2024-05-18 · lore
- **Tags:** `faction:kasrkin` (subject, name); `faction:cadian_shock_troops` (mentioned, name, “Cadian Shock Troops”); `location:cadia` (subject, name)
- **Unresolved:** “Lorn V” (location)

### YOU'LL NEVER SEE THEM AGAIN? - Imperial Guard Regiments | WARHAMMER 40,000 LORE/DISCUSSION

- **Date / kind:** 2025-03-13 · lore
- **Tags:** `faction:astra_militarum` (subject, alias, “Astra Militarum”)
