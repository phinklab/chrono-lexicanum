# Podcast ingest quality report — Lorehammer - A Warhammer 40k Podcast

Reproducible via: `PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast -- --show lorehammer` (Brief 122 B1-S2 — registry-driven ingest + episode tagging + link-shape; no schema, no DB).

## Summary

- **Show:** Lorehammer - A Warhammer 40k Podcast (slug `lorehammer`)
- **Feed:** https://anchor.fm/s/1070b29c8/podcast/rss
- **Apple id:** 1266540593
- **Episodes:** 391
- **Extraction model:** `claude-sonnet-4-6` (prompt version `3f6a5ff87efa`)
- **Resolved coverage:** 282/391 episodes (72.1%) carry ≥1 resolved tag
- **Resolved tags:** 653 total — 460 subject, 193 mentioned
  - by type: 128 character, 436 faction, 89 location
- **Episode kinds:** 305 lore, 0 news_recap, 12 interview, 74 other
- **Show links:** 3 (apple_podcasts, official_website, rss)
- **Episode links:** 391/391 episodes carry an RSS audio link (`listen`/`rss`/`podcast_rss`)
- **Distinct unresolved surface-forms:** 203

## Method (resolution reuse)

Tagging rides the existing rails. The LLM (forced tool call, `temperature: 0`) extracts candidate surface-forms per axis, split into `primary` (→ `role: subject`) and `mentioned`. Each form is resolved by **`resolveSurfaceForm` from `src/lib/aliases`** (Brief 104) — the shared alias/canonical-name index, no forked logic. The authoritative `type` is whatever axis the alias module resolves to (so a mis-bucketed form still lands correctly); confidence is `1.0` for a canonical-name match and `0.9` for an alias-key match (`matchedVia` records which). A form the alias module does not know is recorded under `unresolved` with its raw string — never auto-created as a reference row.

## Determinism

Episodes are sorted by `(pubDate, guid)`, tags by `(type, role, canonicalId)`, unresolved forms by `(axisGuess, role, rawName)`; the artifact carries no wall-clock timestamps. The LLM step is cached under `ingest/.llm-cache/` (gitignored) and run at `temperature: 0`, so a warm-cache re-run reproduces the artifact byte-for-byte. (A cold re-run with the cache cleared re-queries the model; near-identical but not guaranteed byte-identical — the committed cache makes the deterministic path the default.)

## Unresolved surface-forms

Sorted by episode-frequency. These are candidates for the curation pass (real missing entities) or for the alias module to learn (variants/noise).

| axis (LLM guess) | surface-form | # episodes |
|---|---|---|
| location | The Warp | 14 |
| character | Duke Severus XIII | 5 |
| faction | Knights of Slaughter | 5 |
| faction | Severan Dominate | 5 |
| faction | Chaos Gods | 4 |
| faction | Crimson Armada | 4 |
| faction | League of Votann | 4 |
| faction | Bad Moons | 3 |
| faction | Farsight Enclaves | 3 |
| faction | Leagues of Votann | 3 |
| faction | Ork Freebooterz | 3 |
| faction | Traitor Legions | 3 |
| location | Spinward Front | 3 |
| character | Gork | 2 |
| character | Malice | 2 |
| character | Mork | 2 |
| character | Swarmlord | 2 |
| character | Void Dragon | 2 |
| faction | Aspect Warriors | 2 |
| faction | Beast Snagga Boyz | 2 |
| faction | Chaos Unbound | 2 |
| faction | Evil Sunz | 2 |
| faction | Freebooterz | 2 |
| faction | Iron Skulls | 2 |
| faction | Kabals | 2 |
| faction | Malice | 2 |
| faction | Minor Xenos Races | 2 |
| faction | Necrontyr | 2 |
| faction | Obliterators | 2 |
| faction | Old Ones | 2 |
| faction | Primarchs | 2 |
| faction | Primaris Space Marines | 2 |
| faction | Ravenwing | 2 |
| faction | Ruinous Powers | 2 |
| faction | Space Marine Legions | 2 |
| faction | War Hounds | 2 |
| location | Garden of Nurgle | 2 |
| location | Kokyotos | 2 |
| location | Kulth | 2 |
| location | Ohmsworld | 2 |
| location | Segmentum Solar | 2 |
| character | Ancestor Lord Bilboa | 1 |
| character | Be'lakor | 1 |
| character | Beast of Armageddon | 1 |
| character | Bugrat Skumdreg | 1 |
| character | Cegorach | 1 |
| character | Christoph | 1 |
| character | Commander Puretide | 1 |
| character | Dromlach | 1 |
| character | Emperor | 1 |
| character | God Emperor | 1 |
| character | God-Emperor | 1 |
| character | Great Unclean Ones | 1 |
| character | Grukk the Face-Eater | 1 |
| character | Imotekh the Stormlord | 1 |
| character | Inquisitor Kryptman | 1 |
| character | Isha | 1 |
| character | Kais | 1 |
| character | Khaela Mensha Khaine | 1 |
| character | Konor Guilliman | 1 |
| character | Krorks | 1 |
| character | Kurnous | 1 |
| character | Malal | 1 |
| character | Malcador the Sigilite | 1 |
| character | Marckus | 1 |
| character | Mon'praus | 1 |
| character | Old One Eye | 1 |
| character | Phoenix Lords | 1 |
| character | Prime Orks | 1 |
| character | Solomon Zane | 1 |
| character | Stefan | 1 |
| character | The Hive Mind | 1 |
| character | Titus | 1 |
| character | Urlock Gaur | 1 |
| character | Varak | 1 |
| character | Vashtorr the Arkifane | 1 |
| character | Weirdboyz | 1 |
| faction | Abhumans | 1 |
| faction | Abyssal Krakens | 1 |
| faction | Armageddon Steel Legion | 1 |
| faction | Astra Crota | 1 |
| faction | Astral Knights | 1 |
| faction | Asuryani | 1 |
| faction | Bleachskullz | 1 |
| faction | Blood Legions | 1 |
| faction | Bloodletters | 1 |
| faction | Bloodthirsters | 1 |
| faction | Brass Legion | 1 |
| faction | Carcharodons Astra | 1 |
| faction | Chromes | 1 |
| faction | Cold Traders | 1 |
| faction | Craftworlds | 1 |
| faction | Cult of Change | 1 |
| faction | Cult of Decay | 1 |
| faction | Cult of Excess | 1 |
| faction | Cult of the Doomed Ones | 1 |
| faction | Daemonettes | 1 |
| faction | Dark Gods | 1 |
| faction | Death Songs Chapter | 1 |
| faction | Deathwing | 1 |
| faction | Demiurg | 1 |
| faction | Divisio Militaris | 1 |
| faction | Doomed Ones | 1 |
| faction | Eaters of Cities | 1 |
| faction | Eldar Exodites | 1 |
| faction | Eldar Rangers | 1 |
| faction | Elysian Drop Troops | 1 |
| faction | Enoulians | 1 |
| faction | Fecundus Legions | 1 |
| faction | Fenrisian Einherjar | 1 |
| faction | Flash Gitz | 1 |
| faction | Fra'al | 1 |
| faction | Galg | 1 |
| faction | Ghost Wolves | 1 |
| faction | Haemonculi Covens | 1 |
| faction | Heretics | 1 |
| faction | Hive Fleet Grendyllus | 1 |
| faction | Horrors of Tzeentch | 1 |
| faction | House Arokis | 1 |
| faction | House Belli Obligatus | 1 |
| faction | House Koldere | 1 |
| faction | Inner Circle | 1 |
| faction | Iron Marines | 1 |
| faction | Jindarii | 1 |
| faction | Jokaero | 1 |
| faction | Kabal of the Black Heart | 1 |
| faction | Khrave | 1 |
| faction | Knight Houses | 1 |
| faction | Kor'vattra | 1 |
| faction | Lacrymole | 1 |
| faction | Legions of Excess | 1 |
| faction | Liber Malleus | 1 |
| faction | Loota Kult | 1 |
| faction | Lords of Change | 1 |
| faction | Lorehammer | 1 |
| faction | Loxatl | 1 |
| faction | Medusae | 1 |
| faction | Megarachnid | 1 |
| faction | Mephrit Dynasty | 1 |
| faction | Minotaurs | 1 |
| faction | Nekulli | 1 |
| faction | Nicassar | 1 |
| faction | Nihivokh Dynasty | 1 |
| faction | Noise Marines | 1 |
| faction | Nurglings | 1 |
| faction | Nyuserra Dynasty | 1 |
| faction | Order of the Crimson Lily | 1 |
| faction | Ordos Majoris | 1 |
| faction | Oretti | 1 |
| faction | Palatine Blades | 1 |
| faction | Phoenix Guard | 1 |
| faction | Plague Legions of Nurgle | 1 |
| faction | Q'orl | 1 |
| faction | Rak'Gol | 1 |
| faction | Rot Legions | 1 |
| faction | Scintillating Legions | 1 |
| faction | Slanni | 1 |
| faction | Slaugth | 1 |
| faction | Sons of Malice | 1 |
| faction | Space Marine Chapters | 1 |
| faction | Sslyth | 1 |
| faction | Stormbreakers | 1 |
| faction | Stryxis | 1 |
| faction | Tarellians | 1 |
| faction | The Lost and the Damned | 1 |
| faction | The Order | 1 |
| faction | The Reforge | 1 |
| faction | The Unbound | 1 |
| faction | Thyrrus | 1 |
| faction | Traitor Titan Legions | 1 |
| faction | Tzeentch's Scintillating Legions | 1 |
| faction | Umbra | 1 |
| faction | Vespid | 1 |
| faction | Viskeon | 1 |
| faction | Void Hunter Chapter | 1 |
| faction | Wych Cults | 1 |
| faction | Xenos Biologis | 1 |
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
| location | Korelia | 1 |
| location | Murder | 1 |
| location | Nurien Alpha | 1 |
| location | Pech | 1 |
| location | Segmentum Obscurus | 1 |
| location | Segmentum Pacificus | 1 |
| location | Segmentum Tempestus | 1 |
| location | Skalathrax | 1 |
| location | Startide Nexus | 1 |
| location | Stavon IX | 1 |
| location | the Immaterium | 1 |
| location | the Imperium | 1 |
| location | Tomb Worlds | 1 |
| location | Ultima Segmentum | 1 |
| location | Viđrfold | 1 |
| location | Vostroya | 1 |

## Spot-check (10 episodes, evenly spaced)

### AD FREE on Lorehammer Patreon

- **Date / kind:** 2017-07-31 · other
- **Tags:** _none resolved_

### 33 - Ordo Xenos and the Deathwatch

- **Date / kind:** 2018-09-12 · lore
- **Tags:** `faction:deathwatch` (subject, name); `faction:ordo_xenos` (subject, name, “Ordo Xenos”); `faction:inquisition` (mentioned, name)

### 53 - Heretic Astartes

- **Date / kind:** 2019-08-09 · lore
- **Tags:** `character:the_emperor` (mentioned, alias, “the Emperor”); `faction:heretic_astartes` (subject, alias, “Heretic Astartes”); `faction:imperium` (mentioned, alias)

### 70 - The Aeldari Path of the Dead

- **Date / kind:** 2020-05-06 · lore
- **Tags:** `faction:eldar` (subject, alias, “Aeldari”); `faction:adeptus_astartes` (mentioned, alias, “Space Marines”)

### 93 - Militarum Tempestus

- **Date / kind:** 2021-07-22 · lore
- **Tags:** `faction:tempestus_scions` (subject, alias, “Militarum Tempestus”); `faction:astra_militarum` (mentioned, alias, “Astra Militarum”); `faction:ecclesiarchy` (mentioned, name)

### 114 - Hive Cities and Highborns

- **Date / kind:** 2024-11-04 · lore
- **Tags:** `faction:imperium` (subject, alias, “Imperium of Man”)

### 138 - The Votann and Other Technologies

- **Date / kind:** 2025-01-15 · lore
- **Tags:** `faction:imperium` (mentioned, alias)
- **Unresolved:** “Leagues of Votann” (faction)

### 172 - Space Wolves, 30k Legion Era

- **Date / kind:** 2025-04-04 · lore
- **Tags:** `character:leman_russ` (subject, name, “Leman Russ”); `character:the_emperor` (mentioned, alias, “Emperor of Mankind”); `faction:space_wolves` (subject, name, “Space Wolves”)

### 198 - Tau Empire Auxiliaries

- **Date / kind:** 2025-06-25 · lore
- **Tags:** `faction:tau` (subject, alias, “T'au Empire”); `faction:imperium` (mentioned, alias); `location:tau_empire` (subject, name, “T'au Empire”)
- **Unresolved:** “Galg” (faction); “Nicassar” (faction); “Tarellians” (faction); “Vespid” (faction)

### 219 - Angron, Origins and Great Crusade

- **Date / kind:** 2026-01-19 · lore
- **Tags:** `character:angron` (subject, name); `character:the_emperor` (mentioned, alias, “The Emperor”); `faction:world_eaters` (subject, name, “World Eaters”); `location:nuceria` (subject, name)
- **Unresolved:** “War Hounds” (faction); “Eaters of Cities” (faction)
