# Podcast ingest quality report — Adeptus Ridiculous

Reproducible via: `PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast -- --show adeptus-ridiculous` (Brief 122 B1-S2 — registry-driven ingest + episode tagging + link-shape; no schema, no DB).

## Summary

- **Show:** Adeptus Ridiculous (slug `adeptus-ridiculous`)
- **Feed:** https://rss.buzzsprout.com/1497970.rss
- **Apple id:** 1679817767
- **Episodes:** 368
- **Extraction model:** `claude-sonnet-4-6` (prompt version `3f6a5ff87efa`)
- **Resolved coverage:** 292/368 episodes (79.3%) carry ≥1 resolved tag
- **Resolved tags:** 837 total — 570 subject, 267 mentioned
  - by type: 204 character, 499 faction, 134 location
- **Episode kinds:** 309 lore, 2 news_recap, 6 interview, 51 other
- **Show links:** 5 (apple_podcasts, official_website, rss, spotify, youtube)
- **Episode links:** 368/368 episodes carry an RSS audio link (`listen`/`rss`/`podcast_rss`)
- **Distinct unresolved surface-forms:** 164

## Method (resolution reuse)

Tagging rides the existing rails. The LLM (forced tool call, `temperature: 0`) extracts candidate surface-forms per axis, split into `primary` (→ `role: subject`) and `mentioned`. Each form is resolved by **`resolveSurfaceForm` from `src/lib/aliases`** (Brief 104) — the shared alias/canonical-name index, no forked logic. The authoritative `type` is whatever axis the alias module resolves to (so a mis-bucketed form still lands correctly); confidence is `1.0` for a canonical-name match and `0.9` for an alias-key match (`matchedVia` records which). A form the alias module does not know is recorded under `unresolved` with its raw string — never auto-created as a reference row.

## Determinism

Episodes are sorted by `(pubDate, guid)`, tags by `(type, role, canonicalId)`, unresolved forms by `(axisGuess, role, rawName)`; the artifact carries no wall-clock timestamps. The LLM step is cached under `ingest/.llm-cache/` (gitignored) and run at `temperature: 0`, so a warm-cache re-run reproduces the artifact byte-for-byte. (A cold re-run with the cache cleared re-queries the model; near-identical but not guaranteed byte-identical — the committed cache makes the deterministic path the default.)

## Unresolved surface-forms

Sorted by episode-frequency. These are candidates for the curation pass (real missing entities) or for the alias module to learn (variants/noise).

| axis (LLM guess) | surface-form | # episodes |
|---|---|---|
| location | the Warp | 6 |
| faction | Adeptus Terra | 4 |
| character | Cardinal Xaphan | 3 |
| faction | Departmento Munitorum | 3 |
| faction | Farsight Enclaves | 3 |
| faction | Vindicare Assassins | 3 |
| location | Badab | 3 |
| location | Nachmund Gauntlet | 3 |
| location | Nachmund Sub-Sector | 3 |
| character | Imotekh the Stormlord | 2 |
| character | Ku'Gath | 2 |
| character | Kubik | 2 |
| character | Lufgt Huron | 2 |
| character | Omnissiah | 2 |
| character | Vashtorr | 2 |
| character | Vashtorr the Arkifane | 2 |
| faction | Abhumans | 2 |
| faction | Cult Mechanicus | 2 |
| faction | Men of Iron | 2 |
| faction | Necrontyr | 2 |
| faction | Priesthood of Terra | 2 |
| faction | Skaven | 2 |
| location | Indiga | 2 |
| location | Maelstrom Zone | 2 |
| location | Sangua Terra | 2 |
| location | Warp | 2 |
| character | Ardias | 1 |
| character | Arvax | 1 |
| character | Be'lakor | 1 |
| character | Bjorn the Fell-Handed | 1 |
| character | Castellan Crowe | 1 |
| character | Commander Puretide | 1 |
| character | Corvin Severax | 1 |
| character | Da Red Gobbo | 1 |
| character | Daemonculaba | 1 |
| character | Demetrian Titus | 1 |
| character | Drach'nyen | 1 |
| character | Duke Severus XIII | 1 |
| character | Eldrad | 1 |
| character | Felix Jaeger | 1 |
| character | Frater Mathieu | 1 |
| character | Gammat Triskellian | 1 |
| character | Glinteef Goldakka | 1 |
| character | Gotrek Gurnisson | 1 |
| character | Greta | 1 |
| character | Grimtoof | 1 |
| character | Haarken Worldclaimer | 1 |
| character | Idaeus | 1 |
| character | Inquisitor Kryptman | 1 |
| character | Iordax Quan | 1 |
| character | Junith Eruita | 1 |
| character | Juskina Tull | 1 |
| character | Kaldor Draigo | 1 |
| character | Kaylia | 1 |
| character | Ko'vash | 1 |
| character | Kravek Morne | 1 |
| character | Learchus | 1 |
| character | Lhaerial Rey | 1 |
| character | Lost Primarchs | 1 |
| character | Marshal Adenauer | 1 |
| character | Mathieu | 1 |
| character | Nekrosor Ammenthar | 1 |
| character | O'Shaserra | 1 |
| character | Primarchs | 1 |
| character | Prince Yriel | 1 |
| character | Prisca | 1 |
| character | Rho-1 Lux | 1 |
| character | Saint Basillius | 1 |
| character | Sevastus Kranon | 1 |
| character | Shas'ui'T'au'Kais | 1 |
| character | Sister Iolanth | 1 |
| character | Stefan Crucius | 1 |
| character | Symeon Noctis | 1 |
| character | Talos Valcoran | 1 |
| character | The Horned Rat | 1 |
| character | Titus | 1 |
| character | Tyberos the Red Wake | 1 |
| character | Ufthak | 1 |
| character | Ugulhard | 1 |
| character | UR-025 | 1 |
| character | Warboss | 1 |
| character | Wazdakka Gutsmek | 1 |
| character | Wytbor Oct | 1 |
| faction | 1st Tanith Regiment | 1 |
| faction | Angels Vermillion | 1 |
| faction | Cadian 8th | 1 |
| faction | Carcharodon Astra | 1 |
| faction | Castellans of the Rift | 1 |
| faction | Chartist Captains | 1 |
| faction | Children of Thorns | 1 |
| faction | Collegiate Extremis | 1 |
| faction | Corpse Grinder Cult | 1 |
| faction | Council of Thirteen | 1 |
| faction | Cursed Founding | 1 |
| faction | Destroyers | 1 |
| faction | Drukhari Covens | 1 |
| faction | Drukhari Cults | 1 |
| faction | Drukhari Kabals | 1 |
| faction | Eldritch Raiders | 1 |
| faction | Elysian Drop Troops | 1 |
| faction | Exodites | 1 |
| faction | Fists Exemplar | 1 |
| faction | Flayed Ones | 1 |
| faction | Gaunt's Ghosts | 1 |
| faction | Genestealers | 1 |
| faction | Gretchin Revolutionary Committee | 1 |
| faction | Grey Seers | 1 |
| faction | Haemonculus Covens | 1 |
| faction | House Catallus | 1 |
| faction | House Ty | 1 |
| faction | II Legion | 1 |
| faction | Imperial Nobles | 1 |
| faction | Ithakas Dynasty | 1 |
| faction | Men of Stone | 1 |
| faction | Ork Freebootas | 1 |
| faction | Penal Legions | 1 |
| faction | Planetary Defence Force | 1 |
| faction | Raptors | 1 |
| faction | Rebel Grots | 1 |
| faction | Retributors | 1 |
| faction | Schola Progenium | 1 |
| faction | Severan Dominate | 1 |
| faction | Sons of Medusa | 1 |
| faction | Spyrer Hunters | 1 |
| faction | Steel Confessors | 1 |
| faction | Tanith First and Only | 1 |
| faction | Techmarines | 1 |
| faction | Vior'la Sept | 1 |
| faction | Xenos | 1 |
| faction | XI Legion | 1 |
| location | 500 Worlds of Ultramar | 1 |
| location | Agripinaa | 1 |
| location | Ash Wastes | 1 |
| location | Bubonicus | 1 |
| location | Cadian Gate | 1 |
| location | Corsair's Keep | 1 |
| location | Crimson Eyrie | 1 |
| location | Estalia | 1 |
| location | Farsight Enclaves | 1 |
| location | Fleshmyre | 1 |
| location | Forge Worlds | 1 |
| location | Galactic Core | 1 |
| location | Grakiliod Narrow | 1 |
| location | Hades Hive | 1 |
| location | Kislev | 1 |
| location | Landunder | 1 |
| location | Nearsteel | 1 |
| location | New Badab | 1 |
| location | Novamagnor | 1 |
| location | Octarius Sector | 1 |
| location | Periphery sub-sector | 1 |
| location | Realm of Slaanesh | 1 |
| location | Red Angel's Gate | 1 |
| location | Scitalyss | 1 |
| location | Segmentum Solar | 1 |
| location | Segmentum Ultima | 1 |
| location | Sortiarius | 1 |
| location | Steelmound | 1 |
| location | Taos 3 | 1 |
| location | Toros Tertium | 1 |
| location | Umidia | 1 |
| location | Vesmir II | 1 |
| location | Vior'la | 1 |
| location | Vostroya | 1 |

## Spot-check (10 episodes, evenly spaced)

### The Death Korps of Krieg | Into the Grimdark

- **Date / kind:** 2020-11-27 · lore
- **Tags:** `faction:death_korps_of_krieg` (subject, name, “Death Korps of Krieg”)

### SQUIG TIER LIST | Warhammer 40k Lore

- **Date / kind:** 2021-07-21 · lore
- **Tags:** `faction:orks` (subject, name)

### Interview with Richard Reed, Necron & Tomb King voice actor extraordinaire

- **Date / kind:** 2022-02-13 · interview
- **Tags:** `faction:necrons` (subject, name)

### Duperrault Family Massacre | Detective Ridiculous

- **Date / kind:** 2022-09-03 · other
- **Tags:** _none resolved_

### BIZARRE ABHUMANS & THE HORRORS OF THE SUMP | Warhammer 40k Lore

- **Date / kind:** 2023-03-08 · lore
- **Tags:** _none resolved_
- **Unresolved:** “Abhumans” (faction)

### One of the West's Most Mysterious Outlaws: the Ballarat Bandit | Detective Ridiculous

- **Date / kind:** 2023-09-24 · other
- **Tags:** _none resolved_

### FABIUS BILE: GODS ARE FOR THE WEAK. I AM NOT WEAK. | Warhammer 40k Lore

- **Date / kind:** 2024-04-03 · lore
- **Tags:** `character:fabius_bile` (subject, name, “Fabius Bile”); `faction:emperors_children` (subject, name, “Emperor's Children”); `faction:heretic_astartes` (mentioned, alias, “Chaos Space Marines”)

### ADEPTUS ARBITES: I AM THE LAW! | Warhammer 40k Lore

- **Date / kind:** 2024-10-09 · lore
- **Tags:** `faction:adeptus_arbites` (subject, name, “Adeptus Arbites”); `faction:inquisition` (mentioned, name)
- **Unresolved:** “Adeptus Terra” (faction); “Priesthood of Terra” (faction)

### THE OGRE KINGDOMS | Warhammer Fantasy Lore

- **Date / kind:** 2025-04-20 · other
- **Tags:** _none resolved_

### THE MOST HORRIFYING ORK IN THE GALAXY (It's not Ghaz) | Warhammer 40k Lore

- **Date / kind:** 2025-11-19 · lore
- **Tags:** `character:ghazghkull_thraka` (mentioned, name, “Ghazghkull Thraka”); `faction:orks` (subject, name)
