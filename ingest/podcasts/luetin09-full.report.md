# Podcast ingest quality report — Luetin09

Reproducible via: `PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast -- --show luetin09` (Brief 122 B1-S2 — registry-driven ingest + episode tagging + link-shape; no schema, no DB).

## Summary

- **Show:** Luetin09 (slug `luetin09`)
- **Feed:** https://www.youtube.com/feeds/videos.xml?channel_id=UC8RfCCzWsMgNspTI-GTFenQ
- **Episodes:** 1854
- **Extraction model:** `claude-sonnet-4-6` (prompt version `3f6a5ff87efa`)
- **Resolved coverage:** 170/1854 episodes (9.2%) carry ≥1 resolved tag
- **Resolved tags:** 379 total — 255 subject, 124 mentioned
  - by type: 52 character, 279 faction, 48 location
- **Episode kinds:** 191 lore, 17 news_recap, 16 interview, 1630 other
- **Show links:** 1 (youtube)
- **Episode links:** 1854/1854 episodes carry a YouTube watch link (`watch`/`youtube`/`youtube`)
- **Distinct unresolved surface-forms:** 52

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
| location | Vraks | 2 |
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
| character | Silent King | 1 |
| character | Sly Marbo | 1 |
| character | Solaria | 1 |
| character | The Emperor of Man | 1 |
| faction | Ambull | 1 |
| faction | Armageddon Steel Legion | 1 |
| faction | Death Cult Assassins | 1 |
| faction | Fire Hawks | 1 |
| faction | Leagues of Votann | 1 |
| faction | Mordant Acid Dogs | 1 |
| faction | Necrontyr | 1 |
| faction | Sons of Malice | 1 |
| faction | The Cabal | 1 |
| faction | Titan Legions | 1 |
| faction | Van Saar | 1 |
| location | Atoma Prime | 1 |
| location | Charadon | 1 |
| location | Crone Worlds | 1 |
| location | Daemon Worlds | 1 |
| location | Gorkamorka | 1 |
| location | Hive Secundus | 1 |
| location | Koronus Expanse | 1 |
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
| location | Vraks Prime | 1 |
| location | Zhao-Arkhad | 1 |

## Spot-check (10 episodes, evenly spaced)

### Jellyfish - aka - what happens when you didnt start Youtube with the intention of making a channel

- **Date / kind:** 2009-09-22 · other
- **Tags:** _none resolved_

### Battlefield 3: Kharg The Dawn Beckons

- **Date / kind:** 2012-08-11 · other
- **Tags:** _none resolved_

### Battlefield 3: Markaz Rush defence failure - Prioritize vehicles, with Luetin

- **Date / kind:** 2012-12-19 · other
- **Tags:** _none resolved_

### Luetin plays Farcry 3 | ep 39 Lazy slow boat to nowhere

- **Date / kind:** 2013-06-08 · other
- **Tags:** _none resolved_

### Battlefield 4 | Golmud Rush - Full Breakdown

- **Date / kind:** 2014-01-10 · other
- **Tags:** _none resolved_

### STRESS CAPS | BF4 Breakdown [Locker CQ]

- **Date / kind:** 2015-01-08 · other
- **Tags:** _none resolved_

### ZEUS - OP COMM BREAK | ARMA 3 [ARES, Blastcore Phoenix, JSRS Dragonfyre]

- **Date / kind:** 2015-11-27 · other
- **Tags:** _none resolved_

### MSI 1070 X 8G – 60FPS+ ARMA 3 Zeus PC

- **Date / kind:** 2016-12-21 · other
- **Tags:** _none resolved_

### DO NOT BUY Star Wars Battlefront 2? – BELOW THE LINE [11]

- **Date / kind:** 2017-10-12 · other
- **Tags:** _none resolved_

### 40K BUNDLE? I'd buy that for $1 | WARHAMMER 40,000 Humble Bundle week

- **Date / kind:** 2018-11-10 · news_recap
- **Tags:** _none resolved_
