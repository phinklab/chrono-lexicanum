# Podcast ingest quality report — Lorehammer - A Warhammer 40k Podcast

Reproducible via: `PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast -- --show lorehammer` (Brief 122 B1-S2 — registry-driven ingest + episode tagging + link-shape; no schema, no DB).

## Summary

- **Show:** Lorehammer - A Warhammer 40k Podcast (slug `lorehammer`)
- **Feed:** https://anchor.fm/s/1070b29c8/podcast/rss
- **Apple id:** 1266540593
- **Episodes:** 603
- **Extraction model:** `claude-sonnet-4-6` (prompt version `3f6a5ff87efa`)
- **Resolved coverage:** 453/603 episodes (75.1%) carry ≥1 resolved tag
- **Resolved tags:** 1108 total — 766 subject, 342 mentioned
  - by type: 235 character, 712 faction, 161 location
- **Episode kinds:** 490 lore, 0 news_recap, 14 interview, 99 other
- **Show links:** 3 (apple_podcasts, official_website, rss)
- **Episode links:** 603/603 episodes carry an RSS audio link (`listen`/`rss`/`podcast_rss`)
- **Distinct unresolved surface-forms:** 212

## Method (resolution reuse)

Tagging rides the existing rails. The LLM (forced tool call, `temperature: 0`) extracts candidate surface-forms per axis, split into `primary` (→ `role: subject`) and `mentioned`. Each form is resolved by **`resolveSurfaceForm` from `src/lib/aliases`** (Brief 104) — the shared alias/canonical-name index, no forked logic. The authoritative `type` is whatever axis the alias module resolves to (so a mis-bucketed form still lands correctly); confidence is `1.0` for a canonical-name match and `0.9` for an alias-key match (`matchedVia` records which). A form the alias module does not know is recorded under `unresolved` with its raw string — never auto-created as a reference row.

## Determinism

Episodes are sorted by `(pubDate, guid)`, tags by `(type, role, canonicalId)`, unresolved forms by `(axisGuess, role, rawName)`; the artifact carries no wall-clock timestamps. The LLM step is cached under `ingest/.llm-cache/` (gitignored) and run at `temperature: 0`, so a warm-cache re-run reproduces the artifact byte-for-byte. (A cold re-run with the cache cleared re-queries the model; near-identical but not guaranteed byte-identical — the committed cache makes the deterministic path the default.)

## Unresolved surface-forms

Sorted by episode-frequency. These are candidates for the curation pass (real missing entities) or for the alias module to learn (variants/noise).

| axis (LLM guess) | surface-form | # episodes |
|---|---|---|
| location | The Warp | 25 |
| faction | Knights of Slaughter | 10 |
| faction | Crimson Armada | 8 |
| faction | Chaos Gods | 7 |
| faction | Ork Freebooterz | 7 |
| faction | Traitor Legions | 7 |
| character | Duke Severus XIII | 6 |
| faction | Leagues of Votann | 6 |
| faction | Severan Dominate | 6 |
| faction | Farsight Enclaves | 5 |
| character | Gork | 4 |
| character | Mork | 4 |
| character | Void Dragon | 4 |
| faction | Chaos Unbound | 4 |
| faction | League of Votann | 4 |
| faction | Malice | 4 |
| faction | Ravenwing | 4 |
| faction | War Hounds | 4 |
| location | Segmentum Solar | 4 |
| location | Spinward Front | 4 |
| character | Malice | 3 |
| faction | Bad Moons | 3 |
| faction | Freebooterz | 3 |
| faction | Kabals | 3 |
| faction | Ruinous Powers | 3 |
| character | Ancestor Lord Bilboa | 2 |
| character | Be'lakor | 2 |
| character | Beast of Armageddon | 2 |
| character | Cegorach | 2 |
| character | Commander Puretide | 2 |
| character | Dromlach | 2 |
| character | Emperor | 2 |
| character | Great Unclean Ones | 2 |
| character | Imotekh the Stormlord | 2 |
| character | Inquisitor Kryptman | 2 |
| character | Isha | 2 |
| character | Kais | 2 |
| character | Konor Guilliman | 2 |
| character | Krorks | 2 |
| character | Kurnous | 2 |
| character | Malal | 2 |
| character | Malcador the Sigilite | 2 |
| character | Old One Eye | 2 |
| character | Phoenix Lords | 2 |
| character | Prime Orks | 2 |
| character | Stefan | 2 |
| character | Swarmlord | 2 |
| character | Titus | 2 |
| character | Urlock Gaur | 2 |
| character | Varak | 2 |
| character | Vashtorr the Arkifane | 2 |
| character | Weirdboyz | 2 |
| faction | Abyssal Krakens | 2 |
| faction | Armageddon Steel Legion | 2 |
| faction | Aspect Warriors | 2 |
| faction | Astra Crota | 2 |
| faction | Asuryani | 2 |
| faction | Beast Snagga Boyz | 2 |
| faction | Blood Legions | 2 |
| faction | Bloodletters | 2 |
| faction | Bloodthirsters | 2 |
| faction | Brass Legion | 2 |
| faction | Carcharodons Astra | 2 |
| faction | Chromes | 2 |
| faction | Cold Traders | 2 |
| faction | Cult of Change | 2 |
| faction | Cult of Decay | 2 |
| faction | Cult of Excess | 2 |
| faction | Daemonettes | 2 |
| faction | Deathwing | 2 |
| faction | Demiurg | 2 |
| faction | Eaters of Cities | 2 |
| faction | Eldar Exodites | 2 |
| faction | Eldar Rangers | 2 |
| faction | Elysian Drop Troops | 2 |
| faction | Enoulians | 2 |
| faction | Evil Sunz | 2 |
| faction | Fecundus Legions | 2 |
| faction | Fenrisian Einherjar | 2 |
| faction | Fra'al | 2 |
| faction | Galg | 2 |
| faction | Ghost Wolves | 2 |
| faction | Heretics | 2 |
| faction | House Belli Obligatus | 2 |
| faction | Inner Circle | 2 |
| faction | Iron Skulls | 2 |
| faction | Jindarii | 2 |
| faction | Jokaero | 2 |
| faction | Kabal of the Black Heart | 2 |
| faction | Khrave | 2 |
| faction | Knight Houses | 2 |
| faction | Kor'vattra | 2 |
| faction | Lacrymole | 2 |
| faction | Legions of Excess | 2 |
| faction | Liber Malleus | 2 |
| faction | Loxatl | 2 |
| faction | Medusae | 2 |
| faction | Megarachnid | 2 |
| faction | Minor Xenos Races | 2 |
| faction | Minotaurs | 2 |
| faction | Necrontyr | 2 |
| faction | Nekulli | 2 |
| faction | Nicassar | 2 |
| faction | Nihivokh Dynasty | 2 |
| faction | Noise Marines | 2 |
| faction | Nurglings | 2 |
| faction | Obliterators | 2 |
| faction | Old Ones | 2 |
| faction | Oretti | 2 |
| faction | Palatine Blades | 2 |
| faction | Phoenix Guard | 2 |
| faction | Plague Legions of Nurgle | 2 |
| faction | Primarchs | 2 |
| faction | Primaris Space Marines | 2 |
| faction | Q'orl | 2 |
| faction | Rak'Gol | 2 |
| faction | Rot Legions | 2 |
| faction | Slanni | 2 |
| faction | Slaugth | 2 |
| faction | Sons of Malice | 2 |
| faction | Space Marine Legions | 2 |
| faction | Sslyth | 2 |
| faction | Stryxis | 2 |
| faction | Tarellians | 2 |
| faction | The Order | 2 |
| faction | The Reforge | 2 |
| faction | The Unbound | 2 |
| faction | Thyrrus | 2 |
| faction | Umbra | 2 |
| faction | Vespid | 2 |
| faction | Viskeon | 2 |
| faction | Wych Cults | 2 |
| faction | Yu'vath | 2 |
| faction | Zoats | 2 |
| location | Black Hold | 2 |
| location | Cedrinum | 2 |
| location | Daemon Worlds | 2 |
| location | Forge of Souls | 2 |
| location | Garden of Nurgle | 2 |
| location | Immaterium | 2 |
| location | Kokyotos | 2 |
| location | Kulth | 2 |
| location | Murder | 2 |
| location | Nurien Alpha | 2 |
| location | Ohmsworld | 2 |
| location | Pech | 2 |
| location | Segmentum Obscurus | 2 |
| location | Segmentum Pacificus | 2 |
| location | Segmentum Tempestus | 2 |
| location | Skalathrax | 2 |
| location | Startide Nexus | 2 |
| location | the Immaterium | 2 |
| location | the Imperium | 2 |
| location | Ultima Segmentum | 2 |
| location | Vostroya | 2 |
| character | Bugrat Skumdreg | 1 |
| character | Christoph | 1 |
| character | God Emperor | 1 |
| character | God-Emperor | 1 |
| character | Grukk the Face-Eater | 1 |
| character | Khaela Mensha Khaine | 1 |
| character | Marckus | 1 |
| character | Mon'praus | 1 |
| character | Shapers | 1 |
| character | Solomon Zane | 1 |
| character | The Hive Mind | 1 |
| faction | Abhumans | 1 |
| faction | Astral Knights | 1 |
| faction | Bleachskullz | 1 |
| faction | Chaos Mutants | 1 |
| faction | Craftworlds | 1 |
| faction | Cult of the Doomed Ones | 1 |
| faction | Dark Gods | 1 |
| faction | Death Songs Chapter | 1 |
| faction | Divisio Militaris | 1 |
| faction | Doomed Ones | 1 |
| faction | Fallen | 1 |
| faction | Flash Gitz | 1 |
| faction | Haemonculi Covens | 1 |
| faction | Hive Fleet Grendyllus | 1 |
| faction | Horrors of Tzeentch | 1 |
| faction | House Arokis | 1 |
| faction | House Gangs of Necromunda | 1 |
| faction | House Koldere | 1 |
| faction | Iron Marines | 1 |
| faction | Loota Kult | 1 |
| faction | Lords of Change | 1 |
| faction | Lorehammer | 1 |
| faction | Mephrit Dynasty | 1 |
| faction | Nyuserra Dynasty | 1 |
| faction | Order of the Crimson Lily | 1 |
| faction | Ordos Majoris | 1 |
| faction | Psykers | 1 |
| faction | Scintillating Legions | 1 |
| faction | Space Marine Chapters | 1 |
| faction | Stormbreakers | 1 |
| faction | The Lost and the Damned | 1 |
| faction | Traitor Titan Legions | 1 |
| faction | Tzeentch's Scintillating Legions | 1 |
| faction | Void Hunter Chapter | 1 |
| faction | Xenos Biologis | 1 |
| location | Astronomican | 1 |
| location | Cerberus II | 1 |
| location | Elysia | 1 |
| location | Elysium | 1 |
| location | Khorne's Fortress | 1 |
| location | Korelia | 1 |
| location | Nurgle's Garden | 1 |
| location | Octavius War | 1 |
| location | Stavon IX | 1 |
| location | Tomb Worlds | 1 |
| location | Viđrfold | 1 |

## Spot-check (10 episodes, evenly spaced)

### AD FREE on Lorehammer Patreon

- **Date / kind:** 2017-07-31 · other
- **Tags:** _none resolved_

### 42 - Travelling the Void

- **Date / kind:** 2019-02-15 · lore
- **Tags:** _none resolved_

### 71 - Wych Cults

- **Date / kind:** 2020-05-20 · lore
- **Tags:** `faction:eldar` (subject, alias, “Drukhari”)
- **Unresolved:** “Wych Cults” (faction)

### 89 - Bestiary and Herbarium Pt. 3

- **Date / kind:** 2021-04-29 · lore
- **Tags:** _none resolved_

### (Video) 111 - Vashtorr, The Arkifane, Lord of the Forge of Souls 

- **Date / kind:** 2024-10-09 · lore
- **Tags:** _none resolved_
- **Unresolved:** “Vashtorr the Arkifane” (character); “Ruinous Powers” (faction); “Forge of Souls” (location)

### 135 - The High Lords of Terra

- **Date / kind:** 2025-01-03 · lore
- **Tags:** `faction:ecclesiarchy` (subject, name); `faction:imperium` (subject, alias, “Imperium of Man”); `faction:inquisition` (subject, name); `faction:mechanicus` (subject, name, “Adeptus Mechanicus”); `faction:senatorum_imperialis` (subject, alias, “High Lords of Terra”); `location:terra` (subject, name)

### (Video) 161 - Jaghatai Khan, Origins and Great Crusade 

- **Date / kind:** 2025-03-12 · lore
- **Tags:** `character:jaghatai_khan` (subject, name, “Jaghatai Khan”); `character:the_emperor` (mentioned, alias, “The Emperor”); `faction:white_scars` (subject, name, “White Scars”); `location:chogoris` (subject, name)

### (Video) 189 - Loxatl, Medusae and Megarachnid

- **Date / kind:** 2025-05-16 · lore
- **Tags:** `faction:eldar` (mentioned, alias, “Aeldari”); `faction:orks` (mentioned, name); `faction:tyranids` (mentioned, name)
- **Unresolved:** “Loxatl” (faction); “Medusae” (faction); “Megarachnid” (faction); “Murder” (location)

### Bonus 46 - Mark Has Been Selected

- **Date / kind:** 2025-09-22 · other
- **Tags:** _none resolved_
- **Unresolved:** “Segmentum Solar” (location)

### 227 - Astartes Armoury: Equipment

- **Date / kind:** 2026-03-06 · lore
- **Tags:** `faction:adeptus_astartes` (subject, name, “Adeptus Astartes”)
