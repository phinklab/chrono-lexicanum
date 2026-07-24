# Podcast ingest quality report — The 40k Lorecast

Reproducible via: `PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast -- --show the-40k-lorecast` (Brief 122 B1-S2 — registry-driven ingest + episode tagging + link-shape; no schema, no DB).

## Summary

- **Show:** The 40k Lorecast (slug `the-40k-lorecast`)
- **Feed:** https://feeds.redcircle.com/cc233adb-de43-49be-bb76-9720292ddc98
- **Apple id:** 1709093251
- **Episodes:** 157
- **Extraction model:** `claude-sonnet-4-6` (prompt version `3f6a5ff87efa`)
- **Resolved coverage:** 147/157 episodes (93.6%) carry ≥1 resolved tag
- **Resolved tags:** 561 total — 403 subject, 158 mentioned
  - by type: 169 character, 286 faction, 106 location
- **Episode kinds:** 147 lore, 1 news_recap, 0 interview, 9 other
- **Show links:** 5 (apple_podcasts, official_website, rss, spotify, youtube)
- **Episode links:** 157/157 episodes carry an RSS audio link (`listen`/`rss`/`podcast_rss`)
- **Distinct unresolved surface-forms:** 115

## Method (resolution reuse)

Tagging rides the existing rails. The LLM (forced tool call, `temperature: 0`) extracts candidate surface-forms per axis, split into `primary` (→ `role: subject`) and `mentioned`. Each form is resolved by **`resolveSurfaceForm` from `src/lib/aliases`** (Brief 104) — the shared alias/canonical-name index, no forked logic. The authoritative `type` is whatever axis the alias module resolves to (so a mis-bucketed form still lands correctly); confidence is `1.0` for a canonical-name match and `0.9` for an alias-key match (`matchedVia` records which). A form the alias module does not know is recorded under `unresolved` with its raw string — never auto-created as a reference row.

## Determinism

Episodes are sorted by `(pubDate, guid)`, tags by `(type, role, canonicalId)`, unresolved forms by `(axisGuess, role, rawName)`; the artifact carries no wall-clock timestamps. The LLM step is cached under `ingest/.llm-cache/` (gitignored) and run at `temperature: 0`, so a warm-cache re-run reproduces the artifact byte-for-byte. (A cold re-run with the cache cleared re-queries the model; near-identical but not guaranteed byte-identical — the committed cache makes the deterministic path the default.)

## Unresolved surface-forms

Sorted by episode-frequency. These are candidates for the curation pass (real missing entities) or for the alias module to learn (variants/noise).

| axis (LLM guess) | surface-form | # episodes |
|---|---|---|
| location | Sol | 6 |
| character | Titus | 3 |
| location | Badab | 3 |
| location | the Warp | 3 |
| character | Ammentar | 2 |
| character | Demetrian Titus | 2 |
| character | Goge Vandire | 2 |
| character | Malcador | 2 |
| faction | Lords of Terra | 2 |
| faction | Men of Iron | 2 |
| faction | Minotaurs | 2 |
| faction | Navigators | 2 |
| location | Novamagnor | 2 |
| character | Adrax Agatone | 1 |
| character | Antaro Chronus | 1 |
| character | Asterion Moloc | 1 |
| character | Astropaths | 1 |
| character | Aun'va | 1 |
| character | Be'lakor | 1 |
| character | Bjorn the Fell-Handed | 1 |
| character | Cardinal Xaphan | 1 |
| character | Cassian Vaughn | 1 |
| character | Cegorach | 1 |
| character | Commissar | 1 |
| character | Eldrad | 1 |
| character | Exarch | 1 |
| character | Garo | 1 |
| character | Harl Greyweaver | 1 |
| character | Ianus | 1 |
| character | Imotekh the Stormlord | 1 |
| character | Inquisitor Draxus | 1 |
| character | Inquisitor Rex | 1 |
| character | Inquisitor Thrax | 1 |
| character | Jurten | 1 |
| character | Kaldor Draigo | 1 |
| character | Layak | 1 |
| character | Navigators | 1 |
| character | Ortan Cassius | 1 |
| character | Perigno | 1 |
| character | Shaan | 1 |
| character | Shrike | 1 |
| character | Skarbrand | 1 |
| character | Soulsmelter | 1 |
| character | Szarek the Silent King | 1 |
| character | The Nightbringer | 1 |
| character | Thrax | 1 |
| character | Torias Telion | 1 |
| character | Ursulia | 1 |
| character | Valdor | 1 |
| character | Vangorich | 1 |
| character | Vulkan He'Stan | 1 |
| character | Zagstruk | 1 |
| character | Zhufor | 1 |
| faction | 13th Great Company | 1 |
| faction | Adeptus Terra | 1 |
| faction | Astropaths | 1 |
| faction | Caryatids | 1 |
| faction | Cognitae | 1 |
| faction | Corsair Fleets | 1 |
| faction | Covenant of Colchis | 1 |
| faction | Craftworld Iyanden | 1 |
| faction | Cythor Fiends | 1 |
| faction | Daughters of the Emperor | 1 |
| faction | Disciples of the Flame | 1 |
| faction | Drukhari Kabals | 1 |
| faction | Enoulians | 1 |
| faction | Ethereals | 1 |
| faction | Exodites | 1 |
| faction | Freeblades | 1 |
| faction | Haemonculus Covens | 1 |
| faction | Hive Fleet Behemoth | 1 |
| faction | Imperial Heralds | 1 |
| faction | Imperial Senate | 1 |
| faction | Jokaero | 1 |
| faction | Kataphrons | 1 |
| faction | Loyalist Legions | 1 |
| faction | Maug | 1 |
| faction | Men of Gold | 1 |
| faction | Men of Stone | 1 |
| faction | Necrontyr | 1 |
| faction | Old Ones | 1 |
| faction | Osirian Psibrids | 1 |
| faction | Primaris Marines | 1 |
| faction | Rak'Gol | 1 |
| faction | Schola Progenium | 1 |
| faction | Scourges | 1 |
| faction | Serrated Suns | 1 |
| faction | Slaugth | 1 |
| faction | Tanith First and Only | 1 |
| faction | Tepresi | 1 |
| faction | Tiger Claws | 1 |
| faction | Vespid | 1 |
| faction | Zoats | 1 |
| location | Alaxxes | 1 |
| location | Belial IV | 1 |
| location | Eskrador | 1 |
| location | Forge World | 1 |
| location | Garden of Nurgle | 1 |
| location | Ghenna | 1 |
| location | Graia | 1 |
| location | Heliodras system | 1 |
| location | Hive Cities | 1 |
| location | Idarus | 1 |
| location | Immaterium | 1 |
| location | Kaduku | 1 |
| location | Knight World | 1 |
| location | Lysithea | 1 |
| location | Mordian | 1 |
| location | Nephilim Sector | 1 |
| location | Osiris sector | 1 |
| location | San Leor | 1 |
| location | the immaterium | 1 |
| location | Tyran | 1 |
| location | Valhalla | 1 |
| location | Ymgarl | 1 |

## Spot-check (10 episodes, evenly spaced)

### Episode 1 History of Mankind - Age of Terra, Technology, Strife and the appearance of the Emperor

- **Date / kind:** 2023-09-25 · lore
- **Tags:** `character:the_emperor` (subject, alias, “The Emperor”); `location:terra` (subject, name)

### Episode 16 - Dark Angels - The rise of the 1st legion under the Emperor and their reunitment with the Lion.

- **Date / kind:** 2024-01-09 · lore
- **Tags:** `character:lion_el_jonson` (subject, name, “Lion El'Jonson”); `character:luther` (subject, name); `character:the_emperor` (mentioned, alias, “The Emperor”); `faction:dark_angels` (subject, name, “Dark Angels”)

### Episode 32 - What is a Space Marine & what is Space Marine Power Armor

- **Date / kind:** 2024-04-29 · lore
- **Tags:** `faction:adeptus_astartes` (subject, alias, “Space Marines”)

### Episode 48 - The Talons of the Emperor pt 1 - Adeptus Custodes

- **Date / kind:** 2024-08-19 · lore
- **Tags:** `character:trajann_valoris` (subject, name, “Trajann Valoris”); `character:abaddon_the_despoiler` (mentioned, alias, “Abaddon”); `faction:custodes` (subject, name, “Adeptus Custodes”)
- **Unresolved:** “Valdor” (character)

### Episode 63 - "Where are they now" Primarch edition - the Traitors.

- **Date / kind:** 2024-12-03 · lore
- **Tags:** `character:alpharius` (subject, name); `character:angron` (subject, name); `character:horus` (subject, name); `character:konrad_curze` (subject, name, “Konrad Curze”); `character:lorgar` (subject, name); `character:magnus_the_red` (subject, name, “Magnus the Red”); `character:mortarion` (subject, name); `character:perturabo` (subject, name); `character:ahzek_ahriman` (mentioned, alias, “Ahriman”); `character:typhus` (mentioned, name)

### Episode 79 - Ynnari pt 2 - Yvraine grows her forces and Slaanesh realizes the threat that is Ynnead.

- **Date / kind:** 2025-03-24 · lore
- **Tags:** `character:yvraine` (subject, name); `faction:eldar` (subject, alias, “Iyanden”); `faction:ynnari` (subject, name); `faction:slaanesh` (mentioned, name); `location:iyanden` (subject, name); `location:ulthwe` (subject, name)
- **Unresolved:** “Eldrad” (character); “Belial IV” (location)

### Episode 93 - The War of The Beast pt2. Terra is saved but the galaxy is still in danger

- **Date / kind:** 2025-06-30 · lore
- **Tags:** `faction:harlequins` (subject, name); `faction:orks` (subject, name); `faction:imperium` (mentioned, alias, “Imperium of Man”); `location:mars` (subject, name); `location:terra` (subject, name); `location:imperial_palace` (mentioned, name, “Imperial Palace”)

### Episode 106 - The Ultramarines, their epic characters!

- **Date / kind:** 2025-09-29 · lore
- **Tags:** `character:cato_sicarius` (subject, name, “Cato Sicarius”); `character:marneus_calgar` (subject, name, “Marneus Calgar”); `character:uriel_ventris` (subject, name, “Uriel Ventris”); `faction:ultramarines` (subject, name)
- **Unresolved:** “Antaro Chronus” (character); “Ortan Cassius” (character); “Torias Telion” (character)

### Episode 120 - 1st (ish) War of Armageddon - The Battle for Armageddon

- **Date / kind:** 2026-01-06 · lore
- **Tags:** `character:angron` (subject, name); `faction:grey_knights` (subject, name, “Grey Knights”); `faction:inquisition` (subject, name); `faction:space_wolves` (subject, name, “Space Wolves”); `faction:mechanicus` (mentioned, name, “Adeptus Mechanicus”); `location:armageddon` (subject, name)

### Episode 134 - The Siege of Vraks pt 2 - The arrival of Chaos and escalation of Vraks

- **Date / kind:** 2026-04-13 · lore
- **Tags:** `faction:astra_militarum` (subject, alias, “Astra Militarum”); `faction:heretic_astartes` (subject, alias, “Chaos Space Marines”); `faction:adeptus_astartes` (mentioned, alias, “Space Marines”); `location:vraks_prime` (subject, alias, “Vraks”)
