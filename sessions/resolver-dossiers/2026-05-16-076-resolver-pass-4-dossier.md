---
dossier: 2026-05-16-076-resolver-pass-4
brief: sessions/2026-05-16-076-arch-resolver-batch-4-axis-sliced.md
phase: 0
generated: 2026-05-16
generator: scripts/aggregate-surface-forms-076.ts
inputs:
  - scripts/seed-data/manual-overrides-ssot-w40k-016.json
  - scripts/seed-data/manual-overrides-ssot-w40k-017.json
  - scripts/seed-data/manual-overrides-ssot-w40k-018.json
  - scripts/seed-data/manual-overrides-ssot-w40k-019.json
  - scripts/seed-data/manual-overrides-ssot-w40k-020.json
  - scripts/seed-data/book-roster.json
  - scripts/seed-data/factions.json
  - scripts/seed-data/locations.json
  - scripts/seed-data/characters.json
  - scripts/seed-data/faction-aliases.json
  - scripts/seed-data/location-aliases.json
  - scripts/seed-data/character-aliases.json
  - scripts/seed-data/faction-policy.json
  - sessions/ssot-loop-log.md
---

# Resolver-Pass 4 Dossier — `ssot-w40k-016..020` / `W40K-0151..W40K-0200`

> **Lese-Anker für Phasen 1, 2, 3.** Diese Datei ist die einzige Cross-Axis-Kontextquelle für die Achs-Phasen. Wer nur diesen Dossier liest, hat alles, was er für seine Achse braucht — Loop-Log und die 50 Override-Files müssen nicht erneut geöffnet werden. Wenn etwas hier fehlt: Aggregator-Helper-Script `scripts/aggregate-surface-forms-076.ts` re-runnen (`npx tsx scripts/aggregate-surface-forms-076.ts`) oder Loop-Log-Block für die betroffene Iteration nachschlagen (`sessions/ssot-loop-log.md`, Zeilen ~609-833 für 016-020 + Pause).

## 1. Scope-Header

- **Welle:** `ssot-w40k-016..020` (5 Loop-Iterationen, alle aus 2026-05-16 Loop-Run).
- **External Book IDs:** `W40K-0151..W40K-0200` (50 Bücher).
- **Kumulativ:** 200 / 200 zur natürlichen Resolver-Pause-Grenze. Erste Iteration nach Pass 4 wäre `ssot-w40k-021` (`cumulativeBefore=200 % 50 == 0` → loud-stop garantiert ohne Skip-Marker).
- **Authority-Layer-Stand:** 200 Override-Files committed (`ssot-w40k-001..020`); 150 davon (`001..015`) sind post-074 als Postgres-Rows applied; **50 neue (`016..020`) sind nicht in der DB** — Apply ist Phase-4-Verantwortlichkeit.
- **Resolver-Baseline (pre-Pass-4):** `factions=126 rows / 36 aliases`, `locations=132 rows / 11 aliases`, `characters=129 rows / 23 aliases`. Junction-Counts post-074-Re-Apply: `work_factions=912 / work_locations=287 / work_characters=522 / work_collections=35`.
- **Cluster-Schwerpunkte dieser Welle:** Space-Wolves-original-cluster (016, 1999-2025) · Necromunda-classic-imprint (017, 2000-2008) · Necromunda-modern-imprint-relaunch (018, 2018-2021) · Last-Chancers / Gothic-War / Soul-Drinkers-opener (019, 2001-2020) · Soul-Drinkers-continuation / Calpurnia-opener (020, 2002-2020).

## 2. Buch-Tabelle (50 Zeilen)

| externalBookId | slug | title | format | author | year | batch | cluster | flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W40K-0151 | `the-inquisition-war-omnibus` | *The Inquisition War Omnibus* | omnibus | Ian Watson | 2009 | `ssot-w40k-016` | `space-wolves` | — |
| W40K-0152 | `space-wolf` | *Space Wolf* | novel | William King | 1999 | `ssot-w40k-016` | `space-wolves` | — |
| W40K-0153 | `ragnars-claw` | *Ragnar's Claw* | novel | William King | 2000 | `ssot-w40k-016` | `space-wolves` | — |
| W40K-0154 | `grey-hunter` | *Grey Hunter* | novel | William King | 2002 | `ssot-w40k-016` | `space-wolves` | — |
| W40K-0155 | `wolfblade` | *Wolfblade* | novel | William King | 2003 | `ssot-w40k-016` | `space-wolves` | — |
| W40K-0156 | `sons-of-fenris` | *Sons of Fenris* | novel | Lee Lightner | 2007 | `ssot-w40k-016` | `space-wolves` | — |
| W40K-0157 | `wolfs-honour` | *Wolf's Honour* | novel | Lee Lightner | 2008 | `ssot-w40k-016` | `space-wolves` | — |
| W40K-0158 | `the-space-wolf-omnibus` | *The Space Wolf Omnibus* | omnibus | William King | 2008 | `ssot-w40k-016` | `space-wolves` | — |
| W40K-0159 | `space-wolf-the-second-omnibus` | *Space Wolf: The Second Omnibus* | omnibus | William King, Lee Lightner | 2009 | `ssot-w40k-016` | `space-wolves` | — |
| W40K-0160 | `krakenblood` | *Krakenblood* | novel | Marc Collins | 2025 | `ssot-w40k-016` | `space-wolves` | — |
| W40K-0161 | `status-deadzone` | *Status: Deadzone* | anthology | Marc Gascoigne, Andy Jones | 2000 | `ssot-w40k-017` | `necromunda-classic` | — |
| W40K-0162 | `survival-instinct` | *Survival Instinct* | novel | Andy Chambers | 2005 | `ssot-w40k-017` | `necromunda-classic` | — |
| W40K-0163 | `salvation` | *Salvation* | novel | C.S. Goto | 2005 | `ssot-w40k-017` | `necromunda-classic` | — |
| W40K-0164 | `blood-royal` | *Blood Royal* | novel | Gordon Rennie, Will McDermott | 2005 | `ssot-w40k-017` | `necromunda-classic` | — |
| W40K-0165 | `junktion` | *Junktion* | novel | Matthew Farrer | 2005 | `ssot-w40k-017` | `necromunda-classic` | — |
| W40K-0166 | `fleshworks` | *Fleshworks* | novel | Lucien Soulban | 2006 | `ssot-w40k-017` | `necromunda-classic` | — |
| W40K-0167 | `outlander` | *Outlander* | novel | Matt Keefe | 2006 | `ssot-w40k-017` | `necromunda-classic` | — |
| W40K-0168 | `back-from-the-dead` | *Back from the Dead* | novel | Nick Kyme | 2006 | `ssot-w40k-017` | `necromunda-classic` | — |
| W40K-0169 | `cardinal-crimson` | *Cardinal Crimson* | novel | Will McDermott | 2006 | `ssot-w40k-017` | `necromunda-classic` | — |
| W40K-0170 | `lasgun-wedding` | *Lasgun Wedding* | novel | Will McDermott | 2007 | `ssot-w40k-017` | `necromunda-classic` | — |
| W40K-0171 | `wanted-dead` | *Wanted: Dead* | novel | Mike Brooks | 2018 | `ssot-w40k-018` | `necromunda-modern` | `data_conflict:format->novella` |
| W40K-0172 | `sinners-bounty` | *Sinner's Bounty* | novel | Josh Reynolds | 2019 | `ssot-w40k-018` | `necromunda-modern` | — |
| W40K-0173 | `terminal-overkill` | *Terminal Overkill* | novel | Justin D. Hill | 2019 | `ssot-w40k-018` | `necromunda-modern` | — |
| W40K-0174 | `low-lives` | *Low Lives* | novel | Denny Flowers | 2019 | `ssot-w40k-018` | `necromunda-modern` | `data_conflict:format->novella` |
| W40K-0175 | `underhive-a-necromunda-anthology` | *Underhive: A Necromunda Anthology* | anthology | Mike Brooks | 2019 | `ssot-w40k-018` | `necromunda-modern` | — |
| W40K-0176 | `road-to-redemption` | *Road to Redemption* | novel | Mike Brooks | 2020 | `ssot-w40k-018` | `necromunda-modern` | — |
| W40K-0177 | `soulless-fury` | *Soulless Fury* | novel | Will McDermott | 2020 | `ssot-w40k-018` | `necromunda-modern` | — |
| W40K-0178 | `uprising` | *Uprising* | novel | Denny Flowers | 2020 | `ssot-w40k-018` | `necromunda-modern` | `data_conflict:format->anthology` |
| W40K-0179 | `fire-made-flesh` | *Fire Made Flesh* | novel | Denny Flowers | 2021 | `ssot-w40k-018` | `necromunda-modern` | — |
| W40K-0180 | `spark-of-revolution` | *Spark of Revolution* | novella | Gary Kloster | 2020 | `ssot-w40k-018` | `necromunda-modern` | — |
| W40K-0181 | `13th-legion` | *13th Legion* | novel | Gav Thorpe | 2001 | `ssot-w40k-019` | `lc/gw/sd-open` | — |
| W40K-0182 | `kill-team` | *Kill Team* | novel | Gav Thorpe | 2001 | `ssot-w40k-019` | `lc/gw/sd-open` | — |
| W40K-0183 | `annihilation-squad` | *Annihilation Squad* | novel | Gav Thorpe | 2004 | `ssot-w40k-019` | `lc/gw/sd-open` | — |
| W40K-0184 | `the-last-chancers-omnibus` | *The Last Chancers Omnibus* | omnibus | Gav Thorpe | 2006 | `ssot-w40k-019` | `lc/gw/sd-open` | — |
| W40K-0185 | `armageddon-saint` | *Armageddon Saint* | novel | Gav Thorpe | 2020 | `ssot-w40k-019` | `lc/gw/sd-open` | — |
| W40K-0186 | `execution-hour` | *Execution Hour* | novel | Gordon Rennie | 2001 | `ssot-w40k-019` | `lc/gw/sd-open` | — |
| W40K-0187 | `shadow-point` | *Shadow Point* | novel | Gordon Rennie | 2003 | `ssot-w40k-019` | `lc/gw/sd-open` | — |
| W40K-0188 | `the-gothic-war-omnibus` | *The Gothic War Omnibus* | omnibus | Gordon Rennie | 2010 | `ssot-w40k-019` | `lc/gw/sd-open` | — |
| W40K-0189 | `soul-drinker` | *Soul Drinker* | novel | Ben Counter | 2002 | `ssot-w40k-019` | `lc/gw/sd-open` | — |
| W40K-0190 | `the-bleeding-chalice` | *The Bleeding Chalice* | novel | Ben Counter | 2003 | `ssot-w40k-019` | `lc/gw/sd-open` | — |
| W40K-0191 | `crimson-tears` | *Crimson Tears* | novel | Ben Counter | 2005 | `ssot-w40k-020` | `sd-cont/calpurnia` | — |
| W40K-0192 | `the-soul-drinkers-omnibus` | *The Soul Drinkers Omnibus* | omnibus | Ben Counter | 2006 | `ssot-w40k-020` | `sd-cont/calpurnia` | — |
| W40K-0193 | `chapter-war` | *Chapter War* | novel | Ben Counter | 2007 | `ssot-w40k-020` | `sd-cont/calpurnia` | — |
| W40K-0194 | `hellforged` | *Hellforged* | novel | Ben Counter | 2009 | `ssot-w40k-020` | `sd-cont/calpurnia` | — |
| W40K-0195 | `daenyathos` | *Daenyathos* | novella | Ben Counter | 2010 | `ssot-w40k-020` | `sd-cont/calpurnia` | — |
| W40K-0196 | `phalanx` | *Phalanx* | novel | Ben Counter | 2012 | `ssot-w40k-020` | `sd-cont/calpurnia` | — |
| W40K-0197 | `soul-drinkers-annihilation-second-omnibus` | *Soul Drinkers: Annihilation Second Omnibus* | omnibus | Ben Counter | 2013 | `ssot-w40k-020` | `sd-cont/calpurnia` | — |
| W40K-0198 | `traitor-by-deed` | *Traitor by Deed* | novella | Ben Counter | 2020 | `ssot-w40k-020` | `sd-cont/calpurnia` | — |
| W40K-0199 | `crossfire` | *Crossfire* | novel | Matthew Farrer | 2003 | `ssot-w40k-020` | `sd-cont/calpurnia` | — |
| W40K-0200 | `legacy` | *Legacy* | novel | Matthew Farrer | 2004 | `ssot-w40k-020` | `sd-cont/calpurnia` | — |

## 3. Surface-Form-Aggregat pro Achse

Sortierung: `freq desc`, dann `surface-form asc`. Status gegen Resolver-State pre-Pass-4 (post-074-Baseline). Bei `direct` matcht die Surface-Form den `name`-Feldwert in der jeweiligen Reference-Tabelle; bei `alias` matcht sie einen Key in der jeweiligen `*-aliases.json`; bei `unresolved` keines von beidem.

### 3.1 Factions (61 distinct surface-forms, 298 total occurrences)

Resolver-Status-Summary: **27 resolved** (direct: 21 / alias: 6), **34 unresolved**. Die unresolved-Long-Tail klustert nach Necromunda-Houses + cult/guild-register (`House Escher`, `House Cawdor`, `House Helmawr`, `House Goliath`, `House Orlock`, `House Delaque`, `House Van Saar`, `House Ko'iron`, `House Ulanti`, `House of Chains`; `Spyrers`, `Guilders`, `Redemptionists`, `Necromunda Enforcers`, `Razorheads`, `Venators`, `Ratskins`, `Corpse Guild`, `Guild of Light`), Space-Wolves-tribal-tier + cross-faction-bond (`Thunderfist tribe`, `Grimskull tribe`, `House Belisarius`), und Soul-Drinkers-Chapter-Cluster (`Soul Drinkers` selbst + `Last Chancers` + `Howling Griffons` als first-authority-layer-Sub-Faction-Surface-Forms).

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Imperium | 50 | W40K-0151, W40K-0152, W40K-0153 | alias | imperium | `lc/gw/sd-open`, `necromunda-classic`, `necromunda-modern`, `sd-cont/calpurnia`, `space-wolves` |
| Chaos | 24 | W40K-0151, W40K-0152, W40K-0153 | direct | chaos | `lc/gw/sd-open`, `sd-cont/calpurnia`, `space-wolves` |
| Guilders | 20 | W40K-0161, W40K-0162, W40K-0163 | unresolved | — | `necromunda-classic`, `necromunda-modern` |
| Redemptionists | 11 | W40K-0161, W40K-0163, W40K-0167 | unresolved | — | `necromunda-classic`, `necromunda-modern` |
| Adeptus Astartes | 10 | W40K-0151, W40K-0152, W40K-0153 | direct | adeptus_astartes | `space-wolves` |
| Soul Drinkers | 10 | W40K-0189, W40K-0190, W40K-0191 | unresolved | — | `lc/gw/sd-open`, `sd-cont/calpurnia` |
| Space Marines | 10 | W40K-0151, W40K-0152, W40K-0153 | alias | adeptus_astartes | `space-wolves` |
| Space Wolves | 9 | W40K-0152, W40K-0153, W40K-0154 | direct | space_wolves | `space-wolves` |
| House Escher | 7 | W40K-0161, W40K-0162, W40K-0169 | unresolved | — | `necromunda-classic`, `necromunda-modern` |
| Imperial Guard | 7 | W40K-0181, W40K-0182, W40K-0183 | alias | astra_militarum | `lc/gw/sd-open`, `sd-cont/calpurnia` |
| Inquisition | 7 | W40K-0151, W40K-0153, W40K-0158 | direct | inquisition | `lc/gw/sd-open`, `sd-cont/calpurnia`, `space-wolves` |
| Adeptus Mechanicus | 6 | W40K-0189, W40K-0190, W40K-0192 | direct | mechanicus | `lc/gw/sd-open`, `sd-cont/calpurnia` |
| Chaos Space Marines | 6 | W40K-0151, W40K-0154, W40K-0156 | alias | heretic_astartes | `space-wolves` |
| Heretic Astartes | 6 | W40K-0151, W40K-0154, W40K-0156 | direct | heretic_astartes | `space-wolves` |
| House Cawdor | 6 | W40K-0161, W40K-0167, W40K-0175 | unresolved | — | `necromunda-classic`, `necromunda-modern` |
| House Helmawr | 6 | W40K-0164, W40K-0169, W40K-0170 | unresolved | — | `necromunda-classic`, `necromunda-modern` |
| Imperial Navy | 6 | W40K-0186, W40K-0187, W40K-0188 | direct | imperial_navy | `lc/gw/sd-open`, `sd-cont/calpurnia` |
| Orks | 6 | W40K-0181, W40K-0183, W40K-0184 | direct | orks | `lc/gw/sd-open`, `sd-cont/calpurnia` |
| Last Chancers | 5 | W40K-0181, W40K-0182, W40K-0183 | unresolved | — | `lc/gw/sd-open` |
| Thousand Sons | 5 | W40K-0151, W40K-0154, W40K-0157 | direct | thousand_sons | `space-wolves` |
| Tzeentch | 5 | W40K-0151, W40K-0154, W40K-0157 | direct | tzeentch | `space-wolves` |
| House Goliath | 4 | W40K-0161, W40K-0173, W40K-0175 | unresolved | — | `necromunda-classic`, `necromunda-modern` |
| House Orlock | 4 | W40K-0161, W40K-0174, W40K-0175 | unresolved | — | `necromunda-classic`, `necromunda-modern` |
| Necromunda Enforcers | 4 | W40K-0168, W40K-0171, W40K-0175 | unresolved | — | `necromunda-classic`, `necromunda-modern` |
| Black Legion | 3 | W40K-0186, W40K-0187, W40K-0188 | direct | black_legion | `lc/gw/sd-open` |
| Ecclesiarchy | 3 | W40K-0185, W40K-0199, W40K-0200 | direct | ecclesiarchy | `lc/gw/sd-open`, `sd-cont/calpurnia` |
| House Delaque | 3 | W40K-0161, W40K-0166, W40K-0175 | unresolved | — | `necromunda-classic`, `necromunda-modern` |
| House Van Saar | 3 | W40K-0161, W40K-0166, W40K-0175 | unresolved | — | `necromunda-classic`, `necromunda-modern` |
| Imperial Fists | 3 | W40K-0194, W40K-0196, W40K-0197 | direct | imperial_fists | `sd-cont/calpurnia` |
| Navis Nobilite | 3 | W40K-0151, W40K-0155, W40K-0159 | direct | navis_nobilite | `space-wolves` |
| Spyrers | 3 | W40K-0163, W40K-0164, W40K-0175 | unresolved | — | `necromunda-classic`, `necromunda-modern` |
| Adeptus Arbites | 2 | W40K-0199, W40K-0200 | direct | adeptus_arbites | `sd-cont/calpurnia` |
| Crimson Fists | 2 | W40K-0191, W40K-0192 | direct | crimson_fists | `sd-cont/calpurnia` |
| Dark Angels | 2 | W40K-0156, W40K-0159 | direct | dark_angels | `space-wolves` |
| Dark Eldar | 2 | W40K-0191, W40K-0192 | alias | eldar | `sd-cont/calpurnia` |
| Grimskull tribe | 2 | W40K-0152, W40K-0158 | unresolved | — | `space-wolves` |
| House Belisarius | 2 | W40K-0155, W40K-0159 | unresolved | — | `space-wolves` |
| Howling Griffons | 2 | W40K-0193, W40K-0197 | unresolved | — | `sd-cont/calpurnia` |
| Necrons | 2 | W40K-0194, W40K-0197 | direct | necrons | `sd-cont/calpurnia` |
| Ratskins | 2 | W40K-0174, W40K-0178 | unresolved | — | `necromunda-modern` |
| Sisters of Battle | 2 | W40K-0196, W40K-0197 | alias | sisters_of_battle | `sd-cont/calpurnia` |
| Tau Empire | 2 | W40K-0182, W40K-0184 | alias | tau | `lc/gw/sd-open` |
| Thunderfist tribe | 2 | W40K-0152, W40K-0158 | unresolved | — | `space-wolves` |
| Venators | 2 | W40K-0172, W40K-0178 | unresolved | — | `necromunda-modern` |
| Aeldari | 1 | W40K-0151 | direct | eldar | `space-wolves` |
| Callidus Temple | 1 | W40K-0151 | direct | callidus_temple | `space-wolves` |
| Corpse Guild | 1 | W40K-0178 | unresolved | — | `necromunda-modern` |
| Eldar | 1 | W40K-0151 | alias | eldar | `space-wolves` |
| Genestealer Cults | 1 | W40K-0151 | direct | genestealer_cults | `space-wolves` |
| Guild of Light | 1 | W40K-0179 | unresolved | — | `necromunda-modern` |
| Harlequins | 1 | W40K-0151 | direct | harlequins | `space-wolves` |
| House Ko'iron | 1 | W40K-0163 | unresolved | — | `necromunda-classic` |
| House of Chains | 1 | W40K-0180 | unresolved | — | `necromunda-modern` |
| House Ulanti | 1 | W40K-0177 | unresolved | — | `necromunda-modern` |
| Hydra | 1 | W40K-0151 | direct | hydra_cabal | `space-wolves` |
| Officio Assassinorum | 1 | W40K-0151 | direct | officio_assassinorum | `space-wolves` |
| Ordo Malleus | 1 | W40K-0151 | direct | ordo_malleus | `space-wolves` |
| Razorheads | 1 | W40K-0168 | unresolved | — | `necromunda-classic` |
| Rogue Traders | 1 | W40K-0200 | direct | rogue_traders | `sd-cont/calpurnia` |
| Squats | 1 | W40K-0151 | direct | squats | `space-wolves` |
| Tyranids | 1 | W40K-0151 | direct | tyranids | `space-wolves` |

### 3.2 Locations (35 distinct surface-forms, 151 total occurrences)

Resolver-Status-Summary: **7 resolved** (direct only, 0 aliases hit), **28 unresolved**. Die unresolved-Long-Tail klustert nach Necromunda-Geographie (`Hive Primus`, `Underhive`, `The Spire`, `Hive City`, `Junktion`, `Hope's End`, `Floodgrave`, `Dim Zone`, `Fallen Dome of Periculus`), Space-Wolves-Saga (`The Fang`, `Asaheim`, `Aerius`, `Galt`, `Garm`, `Hyades`, `Planet of the Sorcerers`, `Venam`), Last-Chancers / Gothic-War (`Acheron`, `Gothic Sector`, `Shadow Point`, `Typhos Prime`, `Tau Empire space`), Soul-Drinkers / Calpurnia (`the Phalanx`, `Selaaca`, `Vanqualis`, `Hydraphur`, `Kepris`). Außerdem: **`Imperium` (×20) als Location** — galactic-scale Frame-Tag-Pattern, nicht eine konkrete Location-Row (vergleichbar mit `era_frame`-Tags aus 072).

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Hive Primus | 20 | W40K-0161, W40K-0162, W40K-0163 | unresolved | — | `necromunda-classic`, `necromunda-modern` |
| Imperium | 20 | W40K-0181, W40K-0182, W40K-0183 | unresolved | — | `lc/gw/sd-open`, `sd-cont/calpurnia` |
| Necromunda | 20 | W40K-0161, W40K-0162, W40K-0163 | direct | necromunda | `necromunda-classic`, `necromunda-modern` |
| Underhive | 20 | W40K-0161, W40K-0162, W40K-0163 | unresolved | — | `necromunda-classic`, `necromunda-modern` |
| Fenris | 9 | W40K-0152, W40K-0153, W40K-0154 | direct | fenris | `space-wolves` |
| The Fang | 8 | W40K-0152, W40K-0153, W40K-0154 | unresolved | — | `space-wolves` |
| The Spire | 5 | W40K-0162, W40K-0163, W40K-0164 | unresolved | — | `necromunda-classic`, `necromunda-modern` |
| Armageddon | 3 | W40K-0183, W40K-0184, W40K-0185 | direct | armageddon | `lc/gw/sd-open` |
| Gothic Sector | 3 | W40K-0186, W40K-0187, W40K-0188 | unresolved | — | `lc/gw/sd-open` |
| Acheron | 2 | W40K-0183, W40K-0184 | unresolved | — | `lc/gw/sd-open` |
| Aerius | 2 | W40K-0153, W40K-0158 | unresolved | — | `space-wolves` |
| Asaheim | 2 | W40K-0152, W40K-0158 | unresolved | — | `space-wolves` |
| Galt | 2 | W40K-0153, W40K-0158 | unresolved | — | `space-wolves` |
| Garm | 2 | W40K-0154, W40K-0158 | unresolved | — | `space-wolves` |
| Hope's End | 2 | W40K-0174, W40K-0178 | unresolved | — | `necromunda-modern` |
| Hyades | 2 | W40K-0156, W40K-0159 | unresolved | — | `space-wolves` |
| Hydraphur | 2 | W40K-0199, W40K-0200 | unresolved | — | `sd-cont/calpurnia` |
| Planet of the Sorcerers | 2 | W40K-0154, W40K-0158 | unresolved | — | `space-wolves` |
| Selaaca | 2 | W40K-0196, W40K-0197 | unresolved | — | `sd-cont/calpurnia` |
| Shadow Point | 2 | W40K-0187, W40K-0188 | unresolved | — | `lc/gw/sd-open` |
| Tau Empire space | 2 | W40K-0182, W40K-0184 | unresolved | — | `lc/gw/sd-open` |
| Terra | 2 | W40K-0155, W40K-0159 | direct | terra | `space-wolves` |
| the Phalanx | 2 | W40K-0196, W40K-0197 | unresolved | — | `sd-cont/calpurnia` |
| Typhos Prime | 2 | W40K-0181, W40K-0184 | unresolved | — | `lc/gw/sd-open` |
| Vanqualis | 2 | W40K-0193, W40K-0197 | unresolved | — | `sd-cont/calpurnia` |
| Venam | 2 | W40K-0153, W40K-0158 | unresolved | — | `space-wolves` |
| Dim Zone | 1 | W40K-0173 | unresolved | — | `necromunda-modern` |
| Fallen Dome of Periculus | 1 | W40K-0179 | unresolved | — | `necromunda-modern` |
| Floodgrave | 1 | W40K-0176 | unresolved | — | `necromunda-modern` |
| Hive City | 1 | W40K-0166 | unresolved | — | `necromunda-classic` |
| Junktion | 1 | W40K-0165 | unresolved | — | `necromunda-classic` |
| Kepris | 1 | W40K-0198 | unresolved | — | `sd-cont/calpurnia` |
| Sabulorb | 1 | W40K-0151 | direct | sabulorb | `space-wolves` |
| Stalinvast | 1 | W40K-0151 | direct | stalinvast | `space-wolves` |
| Webway | 1 | W40K-0151 | direct | webway | `space-wolves` |

### 3.3 Characters (67 distinct surface-forms, 134 total occurrences)

Resolver-Status-Summary: **5 resolved** (alle direct via 074-Watson-Trilogy-Promotion: Jaq Draco / Meh'Lindi / Vitali Googol / Grimm; plus Magnus the Red und Abaddon the Despoiler aus früheren Resolver-Pässen). **62 unresolved** — die Welle bringt im Wesentlichen vollständig neue Character-Surface-Forms (ein Designziel der Welle, kein Drift): Ragnar-saga (Ragnar Blackmane + Ragnar Thunderfist alt-surface; Strybjorn Grimskull; Sven Brujothirson; Berek Thunderfist; Ranek; Kjel; Ivan Sternberg; Madox; Gabriela Belisarius; Torin; Ivar Krakenblood; Ulrik the Slayer), Kal-Jerico-cluster (Kal Jerico; Wotan; Scabbs; Yoland; Lord Gerontius Helmawr; Lord Helmawr; Armand Helmawr; Valtin Schemko; Cardinal Crimson; Nemo), Necromunda-modern-POVs (Mad Donna + D'onne Ulanti dual-surface; Caleb Cursebound; Iktomi; Brielle; Red Tori; Fettnir; Zeke; Scrutinator Primus Servalen; KB-88; Dog; Tempes Sol; Lord Silas Pureburn; Breaker Brass; Yar Umbra; Jarene; Desolation Zoon; Erik Bane; Sinden Kass; Uriah Storm; Zefer Tyranus), Last-Chancers / Gothic-War / Soul-Drinkers (Colonel Schaeffer; Lieutenant Kage + the Burned Man dual-surface; Lorii; Overlord von Strab; Captain Leoten Sempter; Sarpedon; Daenyathos; Iktinos; Tellos; Teturact; Inquisitor Thaddeus), Calpurnia (Shira Calpurnia; Lord Medell; Hoyyon Phrax), Soul-Drinkers-Primaris (Yeceqath the Voice of All). Hinzu kommt **Obispal aus W40K-0151** — eine 074-Watson-Trilogy-omnibus-Aggregat-Surface-Form, die in 074 nicht promoted wurde (074-impl listet 23 character-rows neu, Obispal nicht; 074-impl-Report-Pattern markiert solche freq=1-Watson-iconics als historical-canon-layer-Promotion-Kandidaten). Phase-3-Resolver-Call: gehört Obispal zur Phase-3-Promotion-Liste (074-impl-Hand-off) oder bleibt er Long-Tail-unresolved?

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Ragnar Blackmane | 8 | W40K-0152, W40K-0153, W40K-0154 | unresolved | — | `space-wolves` |
| Sarpedon | 8 | W40K-0189, W40K-0190, W40K-0191 | unresolved | — | `lc/gw/sd-open`, `sd-cont/calpurnia` |
| Colonel Schaeffer | 5 | W40K-0181, W40K-0182, W40K-0183 | unresolved | — | `lc/gw/sd-open` |
| Lieutenant Kage | 5 | W40K-0181, W40K-0182, W40K-0183 | unresolved | — | `lc/gw/sd-open` |
| Kal Jerico | 4 | W40K-0164, W40K-0169, W40K-0170 | unresolved | — | `necromunda-classic`, `necromunda-modern` |
| Madox | 4 | W40K-0154, W40K-0157, W40K-0158 | unresolved | — | `space-wolves` |
| Strybjorn Grimskull | 4 | W40K-0152, W40K-0153, W40K-0154 | unresolved | — | `space-wolves` |
| Sven Brujothirson | 4 | W40K-0152, W40K-0153, W40K-0154 | unresolved | — | `space-wolves` |
| Abaddon the Despoiler | 3 | W40K-0186, W40K-0187, W40K-0188 | direct | abaddon_the_despoiler | `lc/gw/sd-open` |
| Berek Thunderfist | 3 | W40K-0153, W40K-0154, W40K-0158 | unresolved | — | `space-wolves` |
| Captain Leoten Sempter | 3 | W40K-0186, W40K-0187, W40K-0188 | unresolved | — | `lc/gw/sd-open` |
| Daenyathos | 3 | W40K-0195, W40K-0196, W40K-0197 | unresolved | — | `sd-cont/calpurnia` |
| Ranek | 3 | W40K-0152, W40K-0153, W40K-0158 | unresolved | — | `space-wolves` |
| Wotan | 3 | W40K-0164, W40K-0169, W40K-0170 | unresolved | — | `necromunda-classic` |
| Caleb Cursebound | 2 | W40K-0174, W40K-0178 | unresolved | — | `necromunda-modern` |
| D'onne Ulanti | 2 | W40K-0162, W40K-0177 | unresolved | — | `necromunda-classic`, `necromunda-modern` |
| Gabriela Belisarius | 2 | W40K-0155, W40K-0159 | unresolved | — | `space-wolves` |
| Iktinos | 2 | W40K-0196, W40K-0197 | unresolved | — | `sd-cont/calpurnia` |
| Iktomi | 2 | W40K-0174, W40K-0178 | unresolved | — | `necromunda-modern` |
| Inquisitor Thaddeus | 2 | W40K-0190, W40K-0192 | unresolved | — | `lc/gw/sd-open`, `sd-cont/calpurnia` |
| Ivan Sternberg | 2 | W40K-0153, W40K-0158 | unresolved | — | `space-wolves` |
| Jarene | 2 | W40K-0171, W40K-0175 | unresolved | — | `necromunda-modern` |
| Kjel | 2 | W40K-0152, W40K-0158 | unresolved | — | `space-wolves` |
| Lord Gerontius Helmawr | 2 | W40K-0164, W40K-0170 | unresolved | — | `necromunda-classic` |
| Lorii | 2 | W40K-0183, W40K-0184 | unresolved | — | `lc/gw/sd-open` |
| Mad Donna | 2 | W40K-0162, W40K-0177 | unresolved | — | `necromunda-classic`, `necromunda-modern` |
| Magnus the Red | 2 | W40K-0154, W40K-0158 | direct | magnus_the_red | `space-wolves` |
| Overlord von Strab | 2 | W40K-0183, W40K-0184 | unresolved | — | `lc/gw/sd-open` |
| Ragnar Thunderfist | 2 | W40K-0152, W40K-0158 | unresolved | — | `space-wolves` |
| Scabbs | 2 | W40K-0169, W40K-0170 | unresolved | — | `necromunda-classic` |
| Shira Calpurnia | 2 | W40K-0199, W40K-0200 | unresolved | — | `sd-cont/calpurnia` |
| Tellos | 2 | W40K-0191, W40K-0192 | unresolved | — | `sd-cont/calpurnia` |
| Teturact | 2 | W40K-0190, W40K-0192 | unresolved | — | `lc/gw/sd-open`, `sd-cont/calpurnia` |
| Torin | 2 | W40K-0155, W40K-0159 | unresolved | — | `space-wolves` |
| Yoland | 2 | W40K-0169, W40K-0170 | unresolved | — | `necromunda-classic` |
| Armand Helmawr | 1 | W40K-0164 | unresolved | — | `necromunda-classic` |
| Breaker Brass | 1 | W40K-0180 | unresolved | — | `necromunda-modern` |
| Brielle | 1 | W40K-0173 | unresolved | — | `necromunda-modern` |
| Cardinal Crimson | 1 | W40K-0169 | unresolved | — | `necromunda-classic` |
| Desolation Zoon | 1 | W40K-0172 | unresolved | — | `necromunda-modern` |
| Dog | 1 | W40K-0177 | unresolved | — | `necromunda-modern` |
| Erik Bane | 1 | W40K-0168 | unresolved | — | `necromunda-classic` |
| Fettnir | 1 | W40K-0173 | unresolved | — | `necromunda-modern` |
| Grimm | 1 | W40K-0151 | direct | grimm | `space-wolves` |
| Hoyyon Phrax | 1 | W40K-0200 | unresolved | — | `sd-cont/calpurnia` |
| Ivar Krakenblood | 1 | W40K-0160 | unresolved | — | `space-wolves` |
| Jaq Draco | 1 | W40K-0151 | direct | jaq_draco | `space-wolves` |
| KB-88 | 1 | W40K-0177 | unresolved | — | `necromunda-modern` |
| Lord Helmawr | 1 | W40K-0177 | unresolved | — | `necromunda-modern` |
| Lord Medell | 1 | W40K-0199 | unresolved | — | `sd-cont/calpurnia` |
| Lord Silas Pureburn | 1 | W40K-0179 | unresolved | — | `necromunda-modern` |
| Meh'Lindi | 1 | W40K-0151 | direct | meh_lindi | `space-wolves` |
| Nemo | 1 | W40K-0169 | unresolved | — | `necromunda-classic` |
| Obispal | 1 | W40K-0151 | unresolved | — | `space-wolves` |
| Red Tori | 1 | W40K-0173 | unresolved | — | `necromunda-modern` |
| Scrutinator Primus Servalen | 1 | W40K-0177 | unresolved | — | `necromunda-modern` |
| Sinden Kass | 1 | W40K-0165 | unresolved | — | `necromunda-classic` |
| Tempes Sol | 1 | W40K-0179 | unresolved | — | `necromunda-modern` |
| the Burned Man | 1 | W40K-0185 | unresolved | — | `lc/gw/sd-open` |
| Ulrik the Slayer | 1 | W40K-0160 | unresolved | — | `space-wolves` |
| Uriah Storm | 1 | W40K-0166 | unresolved | — | `necromunda-classic` |
| Valtin Schemko | 1 | W40K-0164 | unresolved | — | `necromunda-classic` |
| Vitali Googol | 1 | W40K-0151 | direct | vitali_googol | `space-wolves` |
| Yar Umbra | 1 | W40K-0178 | unresolved | — | `necromunda-modern` |
| Yeceqath the Voice of All | 1 | W40K-0198 | unresolved | — | `sd-cont/calpurnia` |
| Zefer Tyranus | 1 | W40K-0163 | unresolved | — | `necromunda-classic` |
| Zeke | 1 | W40K-0176 | unresolved | — | `necromunda-modern` |

## 4. Cross-Axis-Warnungen

Eine einzige Surface-Form belegt mehr als eine Achse in dieser Welle:

| surface form | axes | status pro Achse | bemerkung |
| --- | --- | --- | --- |
| Imperium | faction (×50) + location (×20) | faction: alias → `imperium` (resolved); location: unresolved | Erwartetes Pattern. Faction-Seite ist die canonical Auflösung (Imperium-of-Man als grand alignment); Location-Seite ist eine LLM-eingestreute galactic-scale Frame-Tag, **kein** konkreter Ort. **Lösungsweg analog 072 `era_frame`-Pattern:** Locations-Achse lässt `Imperium` unresolved (Phase 2 schreibt **keine** `imperium`-Location-Row); falls Drift-Eliminierung gewünscht, eine zukünftige Hygiene-Session kann eine `imperial_space`-Location mit `tags:['era_frame']` einführen — aus dem Brief OOS für diese Session. Phase-2-Report: Eintrag in der "documented unresolved" Liste, kein Action-Item. |

Andere Surface-Forms tauchen jeweils nur auf einer Achse auf (Iyanden-Style-Konflikte aus 072 sind in dieser Welle nicht reproduziert). **Phase 1/2/3 dürfen also ohne Cross-Axis-Coordination arbeiten**, mit der einen Ausnahme oben.

## 5. Cross-Batch Alias-Consolidation Cases

Fünf Cases stehen in scharfer Form. Jeder ist im Brief § Context vor-strukturiert; dieses Dossier fügt nur die konkreten Buch-IDs + Resolver-Status pro Surface-Form hinzu und markiert pro Case, ob Phase 1/3 die Cowork-Tendenz übernehmen kann oder als `needs-decision` stoppen sollte.

### Case 1: Mad Donna / D'onne Ulanti (Phase 3 — Characters)

- **Surface-Forms:** `Mad Donna` (freq=2, W40K-0162 + W40K-0177); `D'onne Ulanti` (freq=2, dieselben zwei Bücher — beide Surface-Forms koexistieren als POV-Pair in beiden Büchern).
- **Beteiligte Bücher:** `W40K-0162` *Survival Instinct* (Andy Chambers, 2005, classic-imprint Escher-female-POV) + `W40K-0177` *Soulless Fury* (Will McDermott, 2020, modern-imprint dual-POV mit Servalen, fünfzehn-Jahre-Revival).
- **Loop-Log-Befund** (`ssot-loop-log.md` Zeile 729): explizite Empfehlung "Resolver-Brief should consolidate into a canonical-character entry that captures both surface forms as aliases of one entity".
- **Cowork-Default (Brief):** eine Row mit beiden Surface-Forms als Aliase. CC's Wahl der canonical-ID (Cowork-Suggestion: `d_onne_ulanti` oder `mad_donna`).
- **Verdict für Phase 3:** **Cowork-default akzeptiert.** Niedrige Ambiguität; gleicher Charakter (Spire-born ex-noble + Escher-aligned gang leader); klares Pseudonym-pattern. Phase-3-CC kann ohne `needs-decision` entscheiden und seine Wahl im Phase-3-Report begründen.

### Case 2: Kal Jerico — classic (2005-2008) vs. modern (2019) (Phase 3 — Characters)

- **Surface-Forms:** `Kal Jerico` (freq=4, W40K-0164 + W40K-0169 + W40K-0170 + W40K-0172).
- **Beteiligte Bücher:** Classic-Trilogie `W40K-0164` *Blood Royal* + `W40K-0169` *Cardinal Crimson* + `W40K-0170` *Lasgun Wedding* (Rennie / McDermott, 2005-2007); modern-Imprint-Reboot `W40K-0172` *Sinner's Bounty* (Josh Reynolds, 2019).
- **Loop-Log-Befund** (`ssot-loop-log.md` Zeile 729): "Resolver decision needed: one Kal-Jerico canonical entity with multi-era surface forms, or two distinct entities with shared name."
- **Cowork-Default (Brief):** eine Row (`kal_jerico`), Multi-Era-Alias-Pattern; weil same name + same setting (Necromunda Underhive) + same class (bounty hunter). Soft-Reboot-Continuity ist Stil-Reboot, keine Identitäts-Frage.
- **Verdict für Phase 3:** **Cowork-default akzeptiert, mit Note.** Surface-Form bleibt identisch über die Reboot-Grenze hinweg; die modern-Reynolds-Iterationen liefern keine on-page-Continuity-Bruch-Indikatoren analog zum Helmawr-Fall (siehe Case 3). Wenn Phase-3-CC bei tieferer Lektüre einen klaren Re-Cast-Beleg findet (z. B. eine Reynolds-Aussage über eine vom-Klassiker-getrennte Origin), darf er auf `needs-decision` umschalten.

### Case 3: Lord Helmawr classic †Gerontius vs. modern (lebend) (Phase 3 — Characters)

- **Surface-Forms:** `Lord Gerontius Helmawr` (freq=2, W40K-0164 + W40K-0170 — letzteres ist seine Assassination); `Lord Helmawr` (freq=1, W40K-0177 — lebende modern-imprint-Surface-Form).
- **Beteiligte Bücher:** Classic `W40K-0164` *Blood Royal* (lebt) + `W40K-0170` *Lasgun Wedding* (assassiniert in dem Buch, 2007); modern `W40K-0177` *Soulless Fury* (Lord Helmawr lebt wieder, 2020, Lord-Helmawr-as-living-throughline).
- **Loop-Log-Befund** (`ssot-loop-log.md` Zeile 725): "the modern imprint is best read as a **soft-reboot** that keeps the geographical / factional / cultural backdrop while resetting load-bearing character-state — most notably, **Lord Helmawr is alive again** … Resolver-Brief should explicitly mark the two as distinct entities."
- **Cowork-Default (Brief):** zwei Rows. Classic = `gerontius_helmawr`; modern = `lord_helmawr` (oder eine spezifischere ID, falls die modern-imprint-Lore einen Vornamen führt — Loop-Log ist hier dünn).
- **Verdict für Phase 3:** **Cowork-default akzeptiert.** In-fiction-Continuity ist explizit gebrochen (tot im Classic, lebend im Modern); Identitäts-Trennung sauberer als Multi-Era-Alias. Phase-3-CC darf für die modern-Row einen `Lord Helmawr` ohne first-name-disambig wählen (Black-Library-Copy nennt ihn so) oder, falls neuere Coverage einen Vornamen liefert, einen disambig-vornamen ergänzen.

### Case 4: Lieutenant Kage / the Burned Man (Phase 3 — Characters)

- **Surface-Forms:** `Lieutenant Kage` (freq=5, W40K-0181 + W40K-0182 + W40K-0183 + W40K-0184 + W40K-0185); `the Burned Man` (freq=1, W40K-0185 nur).
- **Beteiligte Bücher:** Last-Chancers-Original-Trilogie W40K-0181/0182/0183 + Omnibus W40K-0184 + sixteen-year-later Sequel `W40K-0185` *Armageddon Saint* (Gav Thorpe, 2020).
- **Loop-Log-Befund** (`ssot-loop-log.md` Zeile 772): "narrative device is that the saint-cult knows the figure as 'the Burned Man' while Schaeffer knows him as Kage … Resolver-Brief should consolidate into a canonical-character entry with alias-tracking — a third cross-entry alias-consolidation case in three consecutive batches (after Mad Donna in ssot-w40k-018 and Kal Jerico in ssot-w40k-017→018)."
- **Cowork-Default (Brief):** eine Row (`lieutenant_kage` oder `kage`), beide Surface-Forms als Aliase. Niedrige Ambiguität (selbe Person, alt-Surface-Form ist Narrativ-Device, kein Re-Cast).
- **Verdict für Phase 3:** **Cowork-default akzeptiert.** Analog Mad-Donna-Pattern. Phase-3-CC kann ohne `needs-decision` entscheiden.

### Case 5: Soul Drinkers Firstborn vs. Primaris (Phase 1 — Factions)

- **Surface-Forms (Faction-Achse):** `Soul Drinkers` (freq=10, W40K-0189 + W40K-0190 + W40K-0191 + W40K-0192 omnibus + W40K-0193 + W40K-0194 + W40K-0196 + W40K-0197 omnibus + W40K-0198 + Phalanx-Inquisition-Trial-tagging). Einheitliche Surface-Form über firstborn + primaris.
- **Beteiligte Bücher:** Firstborn-Sextet 2002-2012 (W40K-0189..0197, mit *Phalanx* W40K-0196 als series finale + firstborn-chapter-closure); Primaris-Reboot `W40K-0198` *Traitor by Deed* (Ben Counter, 2020, post-Cicatrix-Maledictum, Indomitus-Crusade-era).
- **Loop-Log-Befund** (`ssot-loop-log.md` Zeile 795 + 807 + 824): "**Soft-reboot continuity question** for Resolver: Firstborn vs Primaris Soul Drinkers — same name, same heraldry, different gene-seed-tier-cohort, fifteen-year publication gap, post-Cicatrix continuity"; "Kept the single surface form `Soul Drinkers`, noted Primaris status only in the synopsis. Resolver-class disambiguation deferred."
- **Schema-Faktum** (Erratum-Punkt 6 im Brief): `factions` hat `tone`+`glyph`, **kein** `notes`. Continuity-Marker, falls erwünscht, geht ins `tone`-Feld (Single-Token-Konvention analog 074-Squats-Pattern) oder bleibt ganz aus der DB heraus und lebt nur im Phase-1-Report.
- **Cowork-Default (Brief):** **eine Faction-Row** (`soul_drinkers`), entweder mit `tone`-Marker (z. B. `tone: "primaris_reboot_coexistent"` o. ä.; CC's Wahl) oder ohne Marker und nur im Phase-1-Report dokumentiert. Begründung: dasselbe Chapter-Name + Heraldry-Setup; Firstborn-Continuity endet mit *Phalanx*; Primaris-Reboot ist eine `era_frame`-Frage, keine Faction-Identitäts-Frage; der Resolver trägt heute keine Primaris-vs-Firstborn-Dimension.
- **Verdict für Phase 1:** **Cowork-default akzeptiert, mit CC-Wahl beim Marker-Pfad.** Phase-1-CC entscheidet zwischen `tone`-Eintrag vs. Report-only; beides ist Schema-konform. Wenn Phase-1-CC bei der Lektüre des Loop-Logs den Eindruck gewinnt, dass die Primaris-Soul-Drinkers in zukünftigen Sequels gegenüber den Firstborn-Excommunicate-Traitoris-Continuum strukturell trennbar sein müssen (Cowork-Tendenz: nein, aber CC darf widersprechen), → `needs-decision`.

### Zusammenfassung (für Phase 4 / impl-Report)

| Case | Achse | Cowork-default | Default-Akzeptanz im Dossier | Phase, die entscheidet |
| --- | --- | --- | --- | --- |
| 1 — Mad Donna / D'onne Ulanti | Characters | eine Row, beide als Aliase | ja | Phase 3 |
| 2 — Kal Jerico classic vs. modern | Characters | eine Row, multi-era-Aliase | ja (mit Vorbehalt: Phase-3-CC darf widersprechen) | Phase 3 |
| 3 — Lord Helmawr classic †Gerontius vs. modern | Characters | zwei Rows | ja | Phase 3 |
| 4 — Kage / the Burned Man | Characters | eine Row, beide als Aliase | ja | Phase 3 |
| 5 — Soul Drinkers Firstborn vs. Primaris | Factions | eine Row, `tone`-Marker oder Report-only | ja (CC-Wahl beim Marker-Pfad) | Phase 1 |

**Erwartung an die `needs-decision`-Liste:** alle fünf Defaults sind hier explizit akzeptiert. Phase 1/3 dürfen ohne Stopp durchlaufen, sofern keine bei tieferer Inspektion zutage tretende Continuity-Brüche neu aufkommen.

## 6. Omnibus- / Anthology- / Format-Konflikte

### 6.1 Omnibus-Scan (9 Entries, davon 7 echte Omnibi + 2 Anthologien)

| externalBookId | title | format | roster-collection-Edges? | known constituents | Phase-4-Action |
| --- | --- | --- | --- | --- | --- |
| W40K-0151 | *The Inquisition War Omnibus* | omnibus | yes (3) | W40K-0148, W40K-0149, W40K-0150 (Watson-Trilogie, ssot-w40k-015) | normal apply — `work_collections`-Junctions erwartet |
| W40K-0158 | *The Space Wolf Omnibus* | omnibus | yes (3) | W40K-0152, W40K-0153, W40K-0154 | normal apply |
| W40K-0159 | *Space Wolf: The Second Omnibus* | omnibus | yes (3) | W40K-0155, W40K-0156, W40K-0157 | normal apply |
| W40K-0161 | *Status: Deadzone* | anthology | **no (0)** | — (11 short stories by 8 authors, kein per-story-Roster-Entry) | **Green-Tide-Analog-Kandidat → `collection-gaps.json`** |
| W40K-0175 | *Underhive: A Necromunda Anthology* | anthology | **no (0)** | — (anthology, kein per-story-Roster-Entry) | **Green-Tide-Analog-Kandidat → `collection-gaps.json`** |
| W40K-0184 | *The Last Chancers Omnibus* | omnibus | yes (3) | W40K-0181, W40K-0182, W40K-0183 | normal apply |
| W40K-0188 | *The Gothic War Omnibus* | omnibus | yes (2) | W40K-0186, W40K-0187 (Gothic-War-Duology; geplante dritte Rennie-Novel nie geschrieben) | normal apply — beachte: nur 2 constituents, kein partial-coverage-Issue |
| W40K-0192 | *The Soul Drinkers Omnibus* | omnibus | yes (3) | W40K-0189, W40K-0190, W40K-0191 | normal apply |
| W40K-0197 | *Soul Drinkers: Annihilation Second Omnibus* | omnibus | yes (4) | W40K-0193, W40K-0194, W40K-0195, W40K-0196 | normal apply |

**Phase-4-Empfehlung:** Die zwei Anthologien (W40K-0161 + W40K-0175) bekommen Einträge in `scripts/seed-data/collection-gaps.json`, analog dem 074-Green-Tide-Pattern (W40K-0147 *The Green Tide*). Schema-Vorlage aus 074:

```json
{
  "collectionExternalId": "W40K-0161",
  "title": "Status: Deadzone",
  "status": "needs_constituent_roster_entries",
  "knownExistingConstituents": [],
  "knownMissingConstituents": ["(11 short stories by Farrer / Rennie / Green / Hammond / Summers / Williams / Rutledge / others — no per-story roster IDs yet)"],
  "note": "Anthology format; constituents are short stories, not novels. Defer complete work_collections until per-story roster entries are modeled."
}
```

Phase-4-CC kann beide Anthologien in einem JSON-Edit dazunehmen. Apply für die Anthologie-Bücher selbst läuft normal (sie sind work-rows wie jedes andere Buch; nur `work_collections`-Junctions bleiben leer wegen fehlender Roster-Edges).

### 6.2 `data_conflict`-Flag-Scan (per-book flags aus den Override-Files)

| externalBookId | title | flag(s) | Phase-4-Action |
| --- | --- | --- | --- |
| W40K-0171 | *Wanted: Dead* | `data_conflict:format->novella` | Roster-Fix außerhalb dieses Briefs (Maintainer-Excel-Workflow). Apply funktioniert normal; das Flag ist Curation-Note, kein Apply-Blocker. |
| W40K-0174 | *Low Lives* | `data_conflict:format->novella` | wie oben |
| W40K-0178 | *Uprising* | `data_conflict:format->anthology` | wie oben — beachte: Roster sagt `novel`, LLM-Befund ist `anthology`. Hat Konsequenzen für Sektion 6.1, falls Maintainer den Roster-Fix einspielt: W40K-0178 würde dann zur Anthologie-Liste hinzukommen. |

**Phase-4-Verantwortlichkeit:** Diese Flags brauchen **keine** Override-File-Edits (Brief-Constraint "Surface-Form-Treue erhalten"). Phase 4 dokumentiert sie im Report unter "Open Issues / Hand-off to Maintainer" für eine spätere Roster-Hygiene-Session.

### 6.3 Format-Vocabulary-Mismatch (latent)

Aus dem Loop-Log (017 + 018 Blöcke): die Facet-Vocabulary-Datei `facet-catalog.json` hat **kein** `anthology` als `format`-Value. Die Override-Files lösen das durch `format=book` im facetIds-Slot + `format=anthology` als Surface-Form-Field (W40K-0161 + W40K-0175 nutzen dieses Pattern). **Aus-Scope:** Phase 4 dieses Briefs erweitert das Vocabulary **nicht** — gehört in eine spätere Vocabulary-Hygiene-Session zusammen mit den anderen Loop-Log-vocabulary-gaps (`bounty_hunter`, `ganger`, `naval_officer`, `wolf_priest`, `body_horror`, etc.).

## 7. Kandidaten für `needs-decision`

Konsolidiertes Ergebnis: **Keine** harten `needs-decision`-Stopps werden für diese Welle erwartet. Alle fünf cross-batch alias-consolidation-Cases (Sektion 5) haben Cowork-Defaults, die im Dossier-Verdict akzeptiert sind; Phase 1 und Phase 3 können sie übernehmen.

Weiche Decision-Punkte, die in den Phase-Reports begründet werden (nicht `needs-decision`-stop-würdig, aber Wahl-würdig):

1. **Phase 1 — Necromunda-Houses-Parent-Wahl.** Houses Cawdor / Escher / Goliath / Orlock / Helmawr / Delaque / Van Saar / Ko'iron / Ulanti / of Chains: parent ist `imperium` (Grand-Alignment-Knoten) oder ein neuer `necromunda`-Mid-Knoten oder direkt unter `astra_militarum` (House-Forces sind technisch Imperial-Militia, nicht regular guard)?
   - **Cowork-Tendenz** (Brief Open-Question + Sektion 7-Eintrag): neuer `necromunda`-Mid-Knoten unter `imperium`, parallel zu `commissariat` / `astra_militarum` / `inquisition` — strukturell eigene Cluster, aber **NICHT** Browse-Root (kein Browse-Root-Promote in dieser Session laut `faction-policy.json`). Wenn Phase-1-CC das als architektonisch zu invasiv wirkt (z. B. weil ein neuer Mid-Knoten die `seed-resolver-extensions.ts`-Insert-Reihenfolge umstellen müsste) → `needs-decision`.
   - **Schema-Faktum:** `factions.parent` ist ein einzelner FK; Multi-Parent geht nicht. Wer parent='necromunda' wählt, schreibt zunächst eine `necromunda`-Faction-Row (alignment='imperium', parent='imperium'), dann die 10 Häuser darunter.
   - **Alternative (Cowork-Tendenz #2):** Houses direkt unter `imperium` (single-parent), `necromunda`-Mid-Knoten weggelassen. Einfacher, weniger neue Rows; verliert die strukturelle Cluster-Information aber nur in der Faction-Hierarchie, nicht in der `locations`-Achse (`necromunda` ist eine eigene Location-Row).
   - **CC's Call. Im Phase-1-Report dokumentieren.**

2. **Phase 1 — Last Chancers parent.** `Last Chancers` ist eine Sub-Faction unter `astra_militarum` (Brief-Vorgabe explizit; alignment='imperium').

3. **Phase 1 — Adeptus Arbites primary.** Erstmals als primary in der Welle. Cowork-Tendenz: eigene canonical row `adeptus_arbites` direkt unter `imperium` (parent='imperium'); kein Hydraphur-Sub-Tier. **Schon resolved-direct** für die Surface-Form `Adeptus Arbites` (siehe Sektion 3.1) — Reference-Row existiert post-074. **Phase 1 hat hier vermutlich nichts zu tun außer Validierung.** ⚠ Wenn die direct-Match-Status im Aggregat falsch ist (z. B. weil die `factions.json`-Row `adeptus_arbites` einen anderen Display-Namen führt), → fix in Phase 1.

4. **Phase 1 — Soul Drinkers Marker-Pfad.** Siehe Sektion 5 Case 5 — CC's Wahl zwischen `tone`-Eintrag und Report-only.

5. **Phase 2 — `Imperium`-als-Location-Frame.** Siehe Sektion 4 — keine Action erwartet, im Phase-2-Report unter "documented unresolved" listen.

6. **Phase 2 — Hydraphur sector.** Calpurnia-Cluster: `Hydraphur` (freq=2, W40K-0199 + W40K-0200). Wenn ein Sector-FK gebraucht wird, prüft Phase 2 zuerst `sectors.json` für einen passenden Eintrag; wenn nein, kann sie einen Sector hinzufügen (Write-Scope erlaubt) oder `sector: null` setzen und im Phase-Report flaggen. **Vermutlich `sector: null` ausreichend** — Hydraphur als Fortress-System hat keine konkrete sector-membership-Notiz im Loop-Log.

7. **Phase 2 — Named Vessels.** Cluster: `Lord Solar Macharius` (Cruiser, Gothic War duology + omnibus), `Planet Killer` (Chaos Super-Weapon, Gothic War duology + omnibus), `Brokenback` (Soul Drinkers' Chaos-Cruiser-Hulk, Hellforged + Annihilation Second Omnibus). **Keiner ist im Surface-Form-Aggregat als location-eintrag aufgetaucht** (Sektion 3.2) — die LLM hat sie nicht als location getagged, sondern in den Synopses erwähnt. **Phase 2 hat hier nichts zu tun**, außer optional die Vessels als `tags:['vessel']`-Rows hinzuzufügen, wenn das aus Konsistenzgründen wünschenswert ist (Cowork-Tendenz: weglassen — sie tauchen nicht als location-Surface-Forms auf und ein speculative-Vessel-Promote ohne Surface-Form-Beleg verletzt die Brief-Constraint "keine over-broad Promotionen").

8. **Phase 3 — Obispal-Promotion-Default.** Surface-Form `Obispal` (freq=1, W40K-0151 Watson-Trilogy-Omnibus-Aggregat). 074-impl hat 23 character-rows neu promoted, Obispal nicht. Phase-3-CC wählt: promote (074-impl-Hand-off, historical-canon-layer-Pattern) vs. unresolved-long-tail (Cowork-Default: lieber knapp). Im Phase-3-Report begründen.

9. **Phase 3 — freq=1-lore-iconic-Promotionen.** Cowork-Erwartung (Brief): Sarpedon, Daenyathos, Iktinos, Tellos, Shira Calpurnia, Lord Medell, Schaeffer, Lieutenant Kage, Captain Leoten Sempter, Kal Jerico, Mad Donna, Caleb Cursebound, Iktomi, Lord Helmawr (modern), Lord Gerontius Helmawr (classic) **plus 4-8 freq=1 iconics** (Phase-3-CC's Wahl). Mögliche freq=1-iconic-Promotionen (CC entscheidet, ich liste die Kandidaten): `Cardinal Crimson` (Necromunda Kal-Jerico-Antagonist), `Erik Bane` (Back-from-the-Dead POV), `Sinden Kass` (Junktion POV), `Uriah Storm` (Fleshworks POV), `Zefer Tyranus` (Salvation POV), `Brielle` (Terminal Overkill POV), `Scrutinator Primus Servalen` (Soulless Fury dual-POV mit Mad Donna), `Hoyyon Phrax` (Legacy supporting-deceased Rogue Trader namesake), `Ivar Krakenblood` (Krakenblood POV), `Ulrik the Slayer` (Krakenblood quest-giver, **third-edition lore-iconic**), `Yeceqath the Voice of All` (Traitor by Deed Primaris-era arch-heretic), `Daenyathos` (Soul-Drinkers-prequel-reveal — schon freq=3, qualifiziert eigentlich strict). **Phase-3-CC kuratiert.**

## 8. Aggregator-Reproduzierbarkeit + Geltungsbereich

- **Script:** `scripts/aggregate-surface-forms-076.ts`. Lesend-only, kein DB-Zugriff, kein LLM-Call, idempotent. Lauf-Befehl: `npx tsx scripts/aggregate-surface-forms-076.ts > /tmp/agg-076.md`.
- **Vor Phasen 1/2/3:** das Script kann jederzeit re-runned werden, um Surface-Form-Aggregate zu validieren. Wenn nach einem Phase-Edit Status-Veränderungen auftreten (z. B. nachdem Phase 1 eine neue `factions.json`-Row hinzufügt, sollte ein erneuter Aggregator-Run die betroffenen factions-Surface-Forms als `direct` zeigen statt `unresolved`), → das ist die Phase-eigene Smoke-Test.
- **Cross-Axis-Datenkonsistenz-Check** (für eine spätere `apply-override.ts`-Sicherheits-Schleife, nicht in dieser Welle):
  - 50 books × ~6 factions / ~3 locations / ~3 characters average = 50 × 12 = ~600 expected junction-rows nach Apply-Sweep für die Welle. Coverage-Aggregat aus Sektion 3: 298 + 151 + 134 = 583 Override-Surface-Form-Slots. Phase-4-Coverage-Tabelle (analog 074) soll diese ~583 als Soll-Junction-Zahl vor Apply benutzen; die tatsächlichen `work_factions / work_locations / work_characters`-Zuwächse nach Re-Apply 016..020 sollten in dieser Größenordnung liegen.

---

**Phase 0 done. Phase 1 (Factions) ist freigegeben. Lese-Vorschlag für Phase 1:** Brief § Constraints + Phase-1-Goal + dieses Dossier Sektionen 1/3.1/4/5/6/7. Brauchst du Loop-Log-Original-Block für 016-020? Stehe in `sessions/ssot-loop-log.md` Zeilen ~609-833. Override-Files unter `scripts/seed-data/manual-overrides-ssot-w40k-{016..020}.json`. **Viel Erfolg.**
