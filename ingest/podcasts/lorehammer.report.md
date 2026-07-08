# Podcast ingest quality report — Lorehammer - A Warhammer 40k Podcast

Reproducible via: `PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast -- --show lorehammer` (Brief 122 B1-S2 — registry-driven ingest + episode tagging + link-shape; no schema, no DB).

## Summary

- **Show:** Lorehammer - A Warhammer 40k Podcast (slug `lorehammer`)
- **Feed:** https://anchor.fm/s/1070b29c8/podcast/rss
- **Apple id:** 1266540593
- **Episodes:** 387
- **Extraction model:** `claude-sonnet-4-6` (prompt version `3f6a5ff87efa`)
- **Resolved coverage:** 291/387 episodes (75.2%) carry ≥1 resolved tag
- **Resolved tags:** 683 total — 488 subject, 195 mentioned
  - by type: 130 character, 466 faction, 87 location
- **Episode kinds:** 299 lore, 0 news_recap, 12 interview, 76 other
- **Show links:** 3 (apple_podcasts, official_website, rss)
- **Episode links:** 387/387 episodes carry an RSS audio link (`listen`/`rss`/`podcast_rss`)
- **Distinct unresolved surface-forms:** 133

## Method (resolution reuse)

Tagging rides the existing rails. The LLM (forced tool call, `temperature: 0`) extracts candidate surface-forms per axis, split into `primary` (→ `role: subject`) and `mentioned`. Each form is resolved by **`resolveSurfaceForm` from `src/lib/aliases`** (Brief 104) — the shared alias/canonical-name index, no forked logic. The authoritative `type` is whatever axis the alias module resolves to (so a mis-bucketed form still lands correctly); confidence is `1.0` for a canonical-name match and `0.9` for an alias-key match (`matchedVia` records which). A form the alias module does not know is recorded under `unresolved` with its raw string — never auto-created as a reference row.

## Determinism

Episodes are sorted by `(pubDate, guid)`, tags by `(type, role, canonicalId)`, unresolved forms by `(axisGuess, role, rawName)`; the artifact carries no wall-clock timestamps. The LLM step is cached under `ingest/.llm-cache/` (gitignored) and run at `temperature: 0`, so a warm-cache re-run reproduces the artifact byte-for-byte. (A cold re-run with the cache cleared re-queries the model; near-identical but not guaranteed byte-identical — the committed cache makes the deterministic path the default.)

## Unresolved surface-forms

Sorted by episode-frequency. These are candidates for the curation pass (real missing entities) or for the alias module to learn (variants/noise).

| axis (LLM guess) | surface-form | # episodes |
|---|---|---|
| location | The Warp | 13 |
| faction | Knights of Slaughter | 5 |
| faction | Crimson Armada | 4 |
| character | Duke Severus XIII | 3 |
| faction | Farsight Enclaves | 3 |
| faction | Severan Dominate | 3 |
| character | Gork | 2 |
| character | Mork | 2 |
| character | Void Dragon | 2 |
| faction | Bad Moons | 2 |
| faction | Iron Skulls | 2 |
| faction | Malice | 2 |
| faction | Minor Xenos Races | 2 |
| faction | Necrontyr | 2 |
| faction | Old Ones | 2 |
| faction | Primarchs | 2 |
| location | Garden of Nurgle | 2 |
| location | Segmentum Solar | 2 |
| location | Spinward Front | 2 |
| character | Ancestor Lord Bilboa | 1 |
| character | Be'lakor | 1 |
| character | Beast of Armageddon | 1 |
| character | Bugrat Skumdreg | 1 |
| character | Cegorach | 1 |
| character | Christoph | 1 |
| character | Commander Puretide | 1 |
| character | Dromlach | 1 |
| character | Imotekh the Stormlord | 1 |
| character | Inquisitor Kryptman | 1 |
| character | Isha | 1 |
| character | Kais | 1 |
| character | Khaela Mensha Khaine | 1 |
| character | Konor Guilliman | 1 |
| character | Kurnous | 1 |
| character | Malal | 1 |
| character | Malice | 1 |
| character | Marckus | 1 |
| character | Mon'praus | 1 |
| character | Old One Eye | 1 |
| character | Solomon Zane | 1 |
| character | Stefan | 1 |
| character | Swarmlord | 1 |
| character | Titus | 1 |
| character | Urlock Gaur | 1 |
| character | Varak | 1 |
| character | Vashtorr the Arkifane | 1 |
| faction | Abhumans | 1 |
| faction | Abyssal Krakens | 1 |
| faction | Astra Crota | 1 |
| faction | Bleachskullz | 1 |
| faction | Brass Legion | 1 |
| faction | Chromes | 1 |
| faction | Cold Traders | 1 |
| faction | Death Songs Chapter | 1 |
| faction | Demiurg | 1 |
| faction | Doomed Ones | 1 |
| faction | Eaters of Cities | 1 |
| faction | Elysian Drop Troops | 1 |
| faction | Enoulians | 1 |
| faction | Fenrisian Einherjar | 1 |
| faction | Fra'al | 1 |
| faction | Galg | 1 |
| faction | Ghost Wolves | 1 |
| faction | Heretics | 1 |
| faction | Hive Fleet Grendyllus | 1 |
| faction | House Arokis | 1 |
| faction | House Belli Obligatus | 1 |
| faction | House Koldere | 1 |
| faction | Iron Marines | 1 |
| faction | Jindarii | 1 |
| faction | Jokaero | 1 |
| faction | Khrave | 1 |
| faction | Lacrymole | 1 |
| faction | Liber Malleus | 1 |
| faction | Loota Kult | 1 |
| faction | Lorehammer | 1 |
| faction | Loxatl | 1 |
| faction | Medusae | 1 |
| faction | Megarachnid | 1 |
| faction | Mephrit Dynasty | 1 |
| faction | Minotaurs | 1 |
| faction | Nekulli | 1 |
| faction | Nicassar | 1 |
| faction | Nihivokh Dynasty | 1 |
| faction | Nyuserra Dynasty | 1 |
| faction | Order of the Crimson Lily | 1 |
| faction | Oretti | 1 |
| faction | Phoenix Guard | 1 |
| faction | Primaris Marines | 1 |
| faction | Q'orl | 1 |
| faction | Rak'Gol | 1 |
| faction | Slanni | 1 |
| faction | Slaugth | 1 |
| faction | Sons of Malice | 1 |
| faction | Sslyth | 1 |
| faction | Stormbreakers | 1 |
| faction | Stryxis | 1 |
| faction | Tarellians | 1 |
| faction | The Reforge | 1 |
| faction | The Unbound | 1 |
| faction | Thyrrus | 1 |
| faction | Umbra | 1 |
| faction | Vespid | 1 |
| faction | Viskeon | 1 |
| faction | Void Hunter Chapter | 1 |
| faction | Yu'vath | 1 |
| faction | Zoats | 1 |
| location | Astronomican | 1 |
| location | Black Hold | 1 |
| location | Cedrinum | 1 |
| location | Cerberus II | 1 |
| location | Daemon Worlds | 1 |
| location | Elysium | 1 |
| location | Forge of Souls | 1 |
| location | Immaterium | 1 |
| location | Kokyotos | 1 |
| location | Korelia | 1 |
| location | Kulth | 1 |
| location | Murder | 1 |
| location | Nurien Alpha | 1 |
| location | Ohmsworld | 1 |
| location | Pech | 1 |
| location | Segmentum Obscurus | 1 |
| location | Segmentum Pacificus | 1 |
| location | Segmentum Tempestus | 1 |
| location | Skalathrax | 1 |
| location | Startide Nexus | 1 |
| location | Stavon IX | 1 |
| location | the Immaterium | 1 |
| location | Tomb Worlds | 1 |
| location | Ultima Segmentum | 1 |
| location | Viđrfold | 1 |
| location | Vostroya | 1 |

## Spot-check (10 episodes, evenly spaced)

### AD FREE on Lorehammer Patreon

- **Date / kind:** 2017-07-31 · other
- **Tags:** _none resolved_

### 32 - Ordo Malleus and the Grey Knights

- **Date / kind:** 2018-08-31 · lore
- **Tags:** `faction:grey_knights` (subject, name, “Grey Knights”); `faction:ordo_malleus` (subject, name, “Ordo Malleus”)

### Listener Lore 4

- **Date / kind:** 2019-08-01 · lore
- **Tags:** `faction:astral_knights` (subject, name, “Astral Knights”); `faction:deathwatch` (subject, name); `faction:orks` (subject, name); `faction:thousand_sons` (subject, name, “Thousand Sons”)

### Listener Lore 10

- **Date / kind:** 2020-04-29 · lore
- **Tags:** `faction:imperial_knights` (subject, name, “Imperial Knights”); `faction:mechanicus` (subject, name, “Adeptus Mechanicus”); `faction:necrons` (subject, name)

### Bonus 23 - Colyn Bares All!

- **Date / kind:** 2021-06-10 · interview
- **Tags:** _none resolved_

### 112 - Vostroyan Firstborn

- **Date / kind:** 2024-10-23 · lore
- **Tags:** `character:the_emperor` (mentioned, alias, “The Emperor”); `faction:astra_militarum` (subject, alias, “Astra Militarum”); `faction:vostroyan_firstborn` (subject, name, “Vostroyan Firstborn”)
- **Unresolved:** “Vostroya” (location)

### 143 - The Emperors Children, 40k Warband Era

- **Date / kind:** 2025-01-27 · lore
- **Tags:** `character:fulgrim` (subject, name); `faction:emperors_children` (subject, name, “Emperor's Children”); `faction:adeptus_astartes` (mentioned, name, “Adeptus Astartes”); `faction:heretic_astartes` (mentioned, alias, “Chaos Space Marines”)

### 177 - Slaanesh's Cult of Excess

- **Date / kind:** 2025-04-16 · lore
- **Tags:** `faction:emperors_children` (subject, name, “Emperor's Children”); `faction:slaanesh` (subject, name)

### Mark Borg 40,000 RPG Pt. 2

- **Date / kind:** 2025-08-06 · other
- **Tags:** _none resolved_

### 227 - Astartes Armoury: Equipment

- **Date / kind:** 2026-03-06 · lore
- **Tags:** `faction:adeptus_astartes` (subject, name, “Adeptus Astartes”)
