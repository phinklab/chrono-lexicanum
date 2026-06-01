# Podcast ingest quality report — The 40k Lorecast

Reproducible via: `PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast` (Brief 110 Step 1 — pilot ingest + episode tagging; no schema, no DB).

## Summary

- **Show:** The 40k Lorecast (slug `the-40k-lorecast`)
- **Feed:** https://feeds.redcircle.com/cc233adb-de43-49be-bb76-9720292ddc98
- **Apple id:** 1709093251
- **Episodes:** 148
- **Extraction model:** `claude-sonnet-4-6` (prompt version `3f6a5ff87efa`)
- **Resolved coverage:** 136/148 episodes (91.9%) carry ≥1 resolved tag
- **Resolved tags:** 510 total — 365 subject, 145 mentioned
  - by type: 151 character, 265 faction, 94 location
- **Episode kinds:** 139 lore, 0 news_recap, 0 interview, 9 other
- **Distinct unresolved surface-forms:** 126

## Method (resolution reuse)

Tagging rides the existing rails. The LLM (forced tool call, `temperature: 0`) extracts candidate surface-forms per axis, split into `primary` (→ `role: subject`) and `mentioned`. Each form is resolved by **`resolveSurfaceForm` from `src/lib/aliases`** (Brief 104) — the shared alias/canonical-name index, no forked logic. The authoritative `type` is whatever axis the alias module resolves to (so a mis-bucketed form still lands correctly); confidence is `1.0` for a canonical-name match and `0.9` for an alias-key match (`matchedVia` records which). A form the alias module does not know is recorded under `unresolved` with its raw string — never auto-created as a reference row.

## Determinism

Episodes are sorted by `(pubDate, guid)`, tags by `(type, role, canonicalId)`, unresolved forms by `(axisGuess, role, rawName)`; the artifact carries no wall-clock timestamps. The LLM step is cached under `ingest/.llm-cache/` (gitignored) and run at `temperature: 0`, so a warm-cache re-run reproduces the artifact byte-for-byte. (A cold re-run with the cache cleared re-queries the model; near-identical but not guaranteed byte-identical — the committed cache makes the deterministic path the default.)

## Unresolved surface-forms

Sorted by episode-frequency. These are candidates for the curation pass (real missing entities) or for the alias module to learn (variants/noise).

| axis (LLM guess) | surface-form | # episodes |
|---|---|---|
| location | Sol | 6 |
| faction | Leagues of Votann | 4 |
| character | Titus | 3 |
| location | Badab | 3 |
| location | the Warp | 3 |
| location | Vraks | 3 |
| character | Ammentar | 2 |
| character | Demetrian Titus | 2 |
| character | Goge Vandire | 2 |
| character | Malcador | 2 |
| character | The Silent King | 2 |
| faction | Astral Claws | 2 |
| faction | Kabals | 2 |
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
| character | Guilliman | 1 |
| character | Harl Greyweaver | 1 |
| character | Ianus | 1 |
| character | Imotekh the Stormlord | 1 |
| character | Inquisitor Draxus | 1 |
| character | Inquisitor Rex | 1 |
| character | Inquisitor Thrax | 1 |
| character | Jurten | 1 |
| character | Kaldor Draigo | 1 |
| character | Magnus | 1 |
| character | Navigators | 1 |
| character | Ortan Cassius | 1 |
| character | Perigno | 1 |
| character | Phoenix Lords | 1 |
| character | Skarbrand | 1 |
| character | Soulsmelter | 1 |
| character | Szarek the Silent King | 1 |
| character | The Nightbringer | 1 |
| character | Thrax | 1 |
| character | Torias Telion | 1 |
| character | Ursulia | 1 |
| character | Valdor | 1 |
| character | Vangorich | 1 |
| character | Vect | 1 |
| character | Vulkan He'Stan | 1 |
| character | Zagstruk | 1 |
| character | Zhufor | 1 |
| faction | 13th Great Company | 1 |
| faction | Adeptus Terra | 1 |
| faction | Armageddon Steel Legion | 1 |
| faction | Aspect Warriors | 1 |
| faction | Astropaths | 1 |
| faction | Caryatids | 1 |
| faction | Cognitae | 1 |
| faction | Corsair Fleets | 1 |
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
| faction | Slaugth | 1 |
| faction | Tanith First and Only | 1 |
| faction | Tepresi | 1 |
| faction | The Cabal | 1 |
| faction | Tiger Claws | 1 |
| faction | Traitor Legions | 1 |
| faction | Valhallan Ice Warriors | 1 |
| faction | Vespid | 1 |
| faction | Wych Cults | 1 |
| faction | Zoats | 1 |
| location | Alaxxes | 1 |
| location | Belial IV | 1 |
| location | Craftworlds | 1 |
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
| location | The Webway | 1 |
| location | Tyran | 1 |
| location | Valhalla | 1 |
| location | Ymgarl | 1 |

## Spot-check (10 episodes, evenly spaced)

### Episode 1 History of Mankind - Age of Terra, Technology, Strife and the appearance of the Emperor

- **Date / kind:** 2023-09-25 · lore
- **Tags:** `character:the_emperor` (subject, alias, “The Emperor”); `location:terra` (subject, name)

### Episode 15 - The Scouring.... well really just the start of the Imperium going to hell in a handbasket trying to kill everyone and everything associated with Chaos

- **Date / kind:** 2024-01-02 · lore
- **Tags:** `character:leman_russ` (subject, name, “Leman Russ”); `character:lion_el_jonson` (subject, name, “Lion El'Jonson”); `character:roboute_guilliman` (subject, name, “Roboute Guilliman”); `faction:imperium` (subject, alias, “Imperium of Man”); `faction:chaos` (mentioned, alias); `location:terra` (subject, name)

### Episode 30 - Necrons pt 1

- **Date / kind:** 2024-04-15 · lore
- **Tags:** `faction:necrons` (subject, name)
- **Unresolved:** “The Silent King” (character); “Necrontyr” (faction)

### Episode 45 - Eldar pt 2 - What is an Eldar, their Craftworlds. and their Psychics

- **Date / kind:** 2024-07-29 · lore
- **Tags:** `faction:eldar` (subject, alias, “Craftworld Aeldari”)

### Episode 60 - Drukhari pt 1 - The survival of the Dark City & rise of Vect

- **Date / kind:** 2024-11-12 · lore
- **Tags:** `character:asdrubael_vect` (subject, name, “Asdrubael Vect”); `faction:eldar` (subject, alias, “Drukhari”); `location:commorragh` (subject, name)
- **Unresolved:** “The Webway” (location)

### Episode 75 - Blood Angels pt2 - After the Death of Sanguinius

- **Date / kind:** 2025-02-25 · lore
- **Tags:** `character:roboute_guilliman` (subject, name, “Roboute Guilliman”); `character:sanguinius` (subject, name); `faction:blood_angels` (subject, name, “Blood Angels”); `location:baal` (subject, name)
- **Unresolved:** “Primaris Marines” (faction)

### Episode 88 - Imperial Fists pt 2 - post Heresy Fists, Crimson fists, and Sigismund

- **Date / kind:** 2025-05-26 · lore
- **Tags:** `character:rogal_dorn` (subject, name, “Rogal Dorn”); `character:sigismund` (subject, name); `faction:black_templars` (subject, name, “Black Templars”); `faction:crimson_fists` (subject, name, “Crimson Fists”); `faction:imperial_fists` (subject, name, “Imperial Fists”); `faction:inquisition` (mentioned, name); `location:terra` (subject, name)

### Episode 100 - Cypher

- **Date / kind:** 2025-08-18 · lore
- **Tags:** `character:cypher` (subject, name); `character:luther` (mentioned, name); `faction:dark_angels` (subject, name, “Dark Angels”); `faction:fallen_angels` (subject, alias, “The Fallen”)

### Bonus Episode - Retro Recall with John and Tom

- **Date / kind:** 2025-11-22 · other
- **Tags:** _none resolved_

### Episode 128 - The 500 worlds pt 2 - Titus comes face to face with the destroyer curse.

- **Date / kind:** 2026-03-03 · lore
- **Tags:** `faction:necrons` (subject, name); `faction:mechanicus` (mentioned, name, “Adeptus Mechanicus”); `faction:tyranids` (mentioned, name)
- **Unresolved:** “Ammentar” (character); “Titus” (character); “The Nightbringer” (character); “Heliodras system” (location); “Idarus” (location); “Novamagnor” (location)
