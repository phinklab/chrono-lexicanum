# Resolver-Pass 5 — Phase-0 Dossier (Brief 089, ssot-w40k-021..025 / W40K-0201..0250)

> Deterministic cross-axis context for the three axis-phases (Factions / Locations / Characters).
> The surface-form tables below are produced by `scripts/aggregate-surface-forms-089.ts` (read-only,
> idempotent — re-running yields byte-identical output). Phases 1–3 read THIS file, not the 50 override
> files or the loop-log. Sections 1–7 are the mandatory dossier contract (Brief 076 § Phase 0).

## 1. Scope header

- **Wave:** `ssot-w40k-021..025` (5 loop batches, 10 books each).
- **IDs:** `W40K-0201..W40K-0250` (50 books).
- **Cumulative:** 250 / 250 W40K books at the resolver-pause grenze (200 already applied through Pass 4 + these 50).
- **Resolver baseline (pre-Pass-5 reference rows + aliases):** factions **146** rows / **36** aliases · locations **157** / **13** · characters **169** / **26**. (Matches project-state post-076; supersedes any other count.)
- **Apply range Phase 4:** `001..025` sequential (021..025 first-time apply; 001..020 resolver-set-drift cleanup).

## 2. Book table (50 entries)

| externalBookId | slug | title | format | author | year | batch | cluster | flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W40K-0201 | `blind` | *Blind* | novel | Matthew Farrer | 2006 | `ssot-w40k-021` | `calpurnia/templars/dow` | — |
| W40K-0202 | `enforcer-omnibus` | *Enforcer Omnibus* | omnibus | Matthew Farrer | 2010 | `ssot-w40k-021` | `calpurnia/templars/dow` | — |
| W40K-0203 | `crusade-for-armageddon` | *Crusade for Armageddon* | novel | Jonathan Green | 2003 | `ssot-w40k-021` | `calpurnia/templars/dow` | — |
| W40K-0204 | `conquest-of-armageddon` | *Conquest of Armageddon* | novel | Jonathan Green | 2005 | `ssot-w40k-021` | `calpurnia/templars/dow` | — |
| W40K-0205 | `the-armageddon-omnibus` | *The Armageddon Omnibus* | omnibus | Jonathan Green | 2011 | `ssot-w40k-021` | `calpurnia/templars/dow` | — |
| W40K-0206 | `broken-crusade` | *Broken Crusade* | novel | Steven B. Fischer | 2024 | `ssot-w40k-021` | `calpurnia/templars/dow` | — |
| W40K-0207 | `dawn-of-war` | *Dawn of War* | novel | C.S. Goto | 2004 | `ssot-w40k-021` | `calpurnia/templars/dow` | — |
| W40K-0208 | `ascension-dawn-of-war` | *Ascension* | novel | C.S. Goto | 2005 | `ssot-w40k-021` | `calpurnia/templars/dow` | — |
| W40K-0209 | `tempest` | *Tempest* | novel | C.S. Goto | 2006 | `ssot-w40k-021` | `calpurnia/templars/dow` | `low_confidence:factions` |
| W40K-0210 | `blood-ravens-the-dawn-of-war-omnibus` | *Blood Ravens: The Dawn of War Omnibus* | omnibus | C.S. Goto | 2008 | `ssot-w40k-021` | `calpurnia/templars/dow` | — |
| W40K-0211 | `dawn-of-war-ii` | *Dawn of War II* | novel | Chris Roberson | 2009 | `ssot-w40k-022` | `grey-knights/blood-angels` | `low_confidence:locations` |
| W40K-0212 | `dawn-of-war-iii` | *Dawn of War III* | novel | Robbie MacNiven | 2017 | `ssot-w40k-022` | `grey-knights/blood-angels` | `low_confidence:rating` |
| W40K-0213 | `grey-knights` | *Grey Knights* | novel | Ben Counter | 2004 | `ssot-w40k-022` | `grey-knights/blood-angels` | `low_confidence:locations` |
| W40K-0214 | `dark-adeptus` | *Dark Adeptus* | novel | Ben Counter | 2006 | `ssot-w40k-022` | `grey-knights/blood-angels` | — |
| W40K-0215 | `hammer-of-daemons` | *Hammer of Daemons* | novel | Ben Counter | 2008 | `ssot-w40k-022` | `grey-knights/blood-angels` | — |
| W40K-0216 | `the-grey-knights-omnibus` | *The Grey Knights Omnibus* | omnibus | Ben Counter | 2009 | `ssot-w40k-022` | `grey-knights/blood-angels` | — |
| W40K-0217 | `deus-encarmine` | *Deus Encarmine* | novel | James Swallow | 2004 | `ssot-w40k-022` | `grey-knights/blood-angels` | — |
| W40K-0218 | `deus-sanguinius` | *Deus Sanguinius* | novel | James Swallow | 2005 | `ssot-w40k-022` | `grey-knights/blood-angels` | — |
| W40K-0219 | `red-fury` | *Red Fury* | novel | James Swallow | 2008 | `ssot-w40k-022` | `grey-knights/blood-angels` | — |
| W40K-0220 | `black-tide` | *Black Tide* | novel | James Swallow | 2010 | `ssot-w40k-022` | `grey-knights/blood-angels` | — |
| W40K-0221 | `space-hulk` | *Space Hulk* | novella | Gav Thorpe | 2009 | `ssot-w40k-023` | `space-hulk/guard-open` | — |
| W40K-0222 | `sin-of-damnation` | *Sin of Damnation* | novella | Gav Thorpe | 2014 | `ssot-w40k-023` | `space-hulk/guard-open` | — |
| W40K-0223 | `astorath-angel-of-mercy` | *Astorath: Angel of Mercy* | novella | Guy Haley | 2020 | `ssot-w40k-023` | `space-hulk/guard-open` | — |
| W40K-0224 | `fifteen-hours` | *Fifteen Hours* | novel | Mitchel Scanlon | 2005 | `ssot-w40k-023` | `space-hulk/guard-open` | — |
| W40K-0225 | `death-world` | *Death World* | novel | Steve Lyons | 2006 | `ssot-w40k-023` | `space-hulk/guard-open` | — |
| W40K-0226 | `rebel-winter` | *Rebel Winter* | novel | Steve Parker | 2007 | `ssot-w40k-023` | `space-hulk/guard-open` | — |
| W40K-0227 | `imperial-guard-omnibus-volume-one-shield-of-the-emperor` | *Imperial Guard Omnibus: Volume One / Shield of the Emperor* | omnibus | ? | 2008 | `ssot-w40k-023` | `space-hulk/guard-open` | — |
| W40K-0228 | `desert-raiders` | *Desert Raiders* | novel | Lucien Soulban | 2007 | `ssot-w40k-023` | `space-hulk/guard-open` | `low_confidence:characters` |
| W40K-0229 | `ice-guard` | *Ice Guard* | novel | Steve Lyons | 2009 | `ssot-w40k-023` | `space-hulk/guard-open` | `low_confidence:factions` |
| W40K-0230 | `gunheads` | *Gunheads* | novel | Steve Parker | 2009 | `ssot-w40k-023` | `space-hulk/guard-open` | — |
| W40K-0231 | `cadian-blood` | *Cadian Blood* | novel | Aaron Dembski-Bowden | 2009 | `ssot-w40k-024` | `astra-militarum-main` | — |
| W40K-0232 | `redemption-corps` | *Redemption Corps* | novel | Rob Sanders | 2010 | `ssot-w40k-024` | `astra-militarum-main` | `low_confidence:locations` |
| W40K-0233 | `dead-men-walking` | *Dead Men Walking* | novel | Steve Lyons | 2010 | `ssot-w40k-024` | `astra-militarum-main` | — |
| W40K-0234 | `hammer-of-the-emperor-omnibus` | *Hammer of the Emperor Omnibus* | omnibus | ? | 2011 | `ssot-w40k-024` | `astra-militarum-main` | `low_confidence:factions` |
| W40K-0235 | `imperial-glory` | *Imperial Glory* | novel | Richard Williams | 2011 | `ssot-w40k-024` | `astra-militarum-main` | — |
| W40K-0236 | `iron-guard` | *Iron Guard* | novel | Mark Clapham | 2012 | `ssot-w40k-024` | `astra-militarum-main` | `low_confidence:factions` |
| W40K-0237 | `commissar` | *Commissar* | novel | Andy Hoare | 2013 | `ssot-w40k-024` | `astra-militarum-main` | — |
| W40K-0238 | `baneblade` | *Baneblade* | novel | Guy Haley | 2013 | `ssot-w40k-024` | `astra-militarum-main` | — |
| W40K-0239 | `straken` | *Straken* | novel | Toby Frost | 2014 | `ssot-w40k-024` | `astra-militarum-main` | — |
| W40K-0240 | `honour-imperialis-omnibus` | *Honour Imperialis Omnibus* | omnibus | ? | 2014 | `ssot-w40k-024` | `astra-militarum-main` | `low_confidence:characters` |
| W40K-0241 | `shadowsword` | *Shadowsword* | novel | Guy Haley | 2016 | `ssot-w40k-025` | `am-close/deathwatch` | — |
| W40K-0242 | `glory-imperialis-omnibus` | *Glory Imperialis Omnibus* | omnibus | ? | 2017 | `ssot-w40k-025` | `am-close/deathwatch` | `low_confidence:locations`; `low_confidence:characters` |
| W40K-0243 | `final-deployment` | *Final Deployment* | novel | ? | 2025 | `ssot-w40k-025` | `am-close/deathwatch` | — |
| W40K-0244 | `the-remnant-blade` | *The Remnant Blade* | novel | Mike Vincent | 2025 | `ssot-w40k-025` | `am-close/deathwatch` | `data_conflict:seriesHint->Night Lords`; `low_confidence:locations` |
| W40K-0245 | `death-and-duty` | *Death And Duty* | anthology | ? | 2025 | `ssot-w40k-025` | `am-close/deathwatch` | `low_confidence:characters`; `low_confidence:locations` |
| W40K-0246 | `the-relentless-dead` | *The Relentless Dead* | novel | ? | 2025 | `ssot-w40k-025` | `am-close/deathwatch` | — |
| W40K-0247 | `chem-dog` | *Chem Dog* | novel | Callum Davis | 2026 | `ssot-w40k-025` | `am-close/deathwatch` | `low_confidence:locations` |
| W40K-0248 | `steel-daemon` | *Steel Daemon* | novella | Ian St. Martin | 2018 | `ssot-w40k-025` | `am-close/deathwatch` | `low_confidence:locations` |
| W40K-0249 | `iron-resolve` | *Iron Resolve* | novella | Steve Lyons | 2019 | `ssot-w40k-025` | `am-close/deathwatch` | — |
| W40K-0250 | `warrior-brood` | *Warrior Brood* | novel | C.S. Goto | 2005 | `ssot-w40k-025` | `am-close/deathwatch` | — |

> **Call-3 verification (visible above):** W40K-0206 → Steven B. Fischer, W40K-0244 → Mike Vincent — both
> author cells now populated (were `authors: []`). The Phase-4 re-apply must produce `work_persons`
> author rows for both.

## 3. Surface-form aggregate (sorted: freq desc, name asc; status vs pre-Pass-5 reference state)

### Factions (45 distinct surface forms, 138 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Orks | 21 | W40K-0203, W40K-0204, W40K-0205 | direct | orks | (all 5) |
| Astra Militarum | 12 | W40K-0203, W40K-0204, W40K-0205 | direct | astra_militarum | calpurnia, am-main, am-close |
| Blood Angels | 7 | W40K-0217, W40K-0218, W40K-0219 | direct | blood_angels | gk/ba, space-hulk |
| Imperial Guard | 7 | W40K-0224, W40K-0225, W40K-0226 | alias | astra_militarum | space-hulk |
| Tyranids | 7 | W40K-0211, W40K-0220, W40K-0221 | direct | tyranids | 4 clusters |
| **Blood Ravens** | **6** | W40K-0207, W40K-0208, W40K-0209 | **unresolved** | — | calpurnia, gk/ba |
| Inquisition | 6 | W40K-0207, W40K-0210, W40K-0217 | direct | inquisition | 4 clusters |
| Eldar | 5 | W40K-0207, W40K-0208, W40K-0209 | alias | eldar | calpurnia, gk/ba |
| Black Templars | 4 | W40K-0203, W40K-0204, W40K-0205 | direct | black_templars | calpurnia |
| Grey Knights | 4 | W40K-0213, W40K-0214, W40K-0215 | direct | grey_knights | gk/ba |
| Adepta Sororitas | 3 | W40K-0208, W40K-0210, W40K-0232 | direct | sisters_of_battle | am-main, calpurnia |
| Cadian Shock Troops | 3 | W40K-0231, W40K-0234, W40K-0240 | direct | cadian_shock_troops | am-main |
| Death Korps of Krieg | 3 | W40K-0233, W40K-0240, W40K-0246 | direct | death_korps_of_krieg | am-close, am-main |
| Heretic Astartes | 3 | W40K-0204, W40K-0205, W40K-0206 | direct | heretic_astartes | calpurnia |
| Ordo Malleus | 3 | W40K-0213, W40K-0214, W40K-0216 | direct | ordo_malleus | gk/ba |
| Adeptus Arbites | 2 | W40K-0201, W40K-0202 | direct | adeptus_arbites | calpurnia |
| **Adeptus Astra Telepathica** | **2** | W40K-0201, W40K-0202 | **unresolved** | — | calpurnia |
| Adeptus Mechanicus | 2 | W40K-0214, W40K-0216 | direct | mechanicus | gk/ba |
| Alpha Legion | 2 | W40K-0207, W40K-0210 | direct | alpha_legion | calpurnia |
| **Collegia Titanica** | **2** | W40K-0203, W40K-0205 | **unresolved** | — | calpurnia |
| Dark Mechanicum | 2 | W40K-0214, W40K-0216 | direct | dark_mechanicum | gk/ba |
| Death Guard | 2 | W40K-0231, W40K-0240 | direct | death_guard | am-main |
| Emperor's Children | 2 | W40K-0219, W40K-0220 | direct | emperors_children | gk/ba |
| Flesh Tearers | 2 | W40K-0219, W40K-0220 | direct | flesh_tearers | gk/ba |
| Khorne | 2 | W40K-0215, W40K-0216 | direct | khorne | gk/ba |
| **Mordian Iron Guard** | **2** | W40K-0236, W40K-0249 | **unresolved** | — | am-main, am-close |
| Necrons | 2 | W40K-0233, W40K-0240 | direct | necrons | am-main |
| Tzeentch | 2 | W40K-0213, W40K-0216 | direct | tzeentch | gk/ba |
| Word Bearers | 2 | W40K-0217, W40K-0218 | direct | word_bearers | gk/ba |
| Blades of Atrocity | 1 | W40K-0244 | unresolved | — | am-close |
| Brimlock Dragoons | 1 | W40K-0235 | unresolved | — | am-main |
| Catachan Jungle Fighters | 1 | W40K-0239 | direct | catachan_jungle_fighters | am-main |
| Chaos | 1 | W40K-0229 | direct | chaos | space-hulk |
| Crimson Slaughter | 1 | W40K-0248 | direct | crimson_slaughter | am-close |
| **Deathwatch** | 1 | W40K-0250 | **unresolved** | — | am-close |
| Enslavers | 1 | W40K-0223 | unresolved | — | space-hulk |
| Night Lords | 1 | W40K-0244 | direct | night_lords | am-close |
| Ordo Xenos | 1 | W40K-0250 | direct | ordo_xenos | am-close |
| Raven Guard | 1 | W40K-0231 | direct | raven_guard | am-main |
| Red Wings | 1 | W40K-0223 | unresolved | — | space-hulk |
| Savlar Chem-Dogs | 1 | W40K-0247 | unresolved | — | am-close |
| Tallarn Desert Raiders | 1 | W40K-0234 | unresolved | — | am-main |
| Tempestus Scions | 1 | W40K-0243 | unresolved | — | am-close |
| Valhallan Ice Warriors | 1 | W40K-0234 | unresolved | — | am-main |
| Vostroyan Firstborn | 1 | W40K-0237 | unresolved | — | am-main |

**Call-1 regiment tally (deterministic).** Of the named Astra-Militarum regiments the brief flagged, the
**only one at freq≥2 is `Mordian Iron Guard` (2: W40K-0236, W40K-0249)**. The rest are each freq=1
because the books predominantly tag generic `Astra Militarum` / `Imperial Guard` rather than the regiment
surface-form: Vostroyan Firstborn (1), Tallarn Desert Raiders (1), Valhallan Ice Warriors (1),
Tempestus Scions (1), Savlar Chem-Dogs (1), Brimlock Dragoons (1). Already-existing regiment rows
(`cadian_shock_troops`, `catachan_jungle_fighters`, `death_korps_of_krieg`, `valhallan_597th`) resolve
direct. → Phase 1 decides the freq=1-iconic promotion set (Call 1) and justifies it; `Mordian Iron Guard`
is the strict freq≥2 promotion. Note `Valhallan Ice Warriors` vs the existing specific row
`valhallan_597th` is a type-vs-regiment distinction — do NOT alias the type to the specific row.

**Non-regiment faction targets (Phase 1).** `Blood Ravens` (freq 6 — Dawn-of-War chapter, Space-Marine
parent) and `Adeptus Astra Telepathica` (freq 2 — the Astropath/Telepathica org, imperium parent) and
`Collegia Titanica` (freq 2 — the Titan Legions; candidate alias to existing browse-root
`adeptus_titanicus`) are the substantive unresolved faction promotions. `Deathwatch` (freq 1, W40K-0250,
adeptus_astartes parent) is a brief-named freq=1 iconic (Deathwatch-line opener). `Blades of Atrocity`
(freq 1, the W40K-0244 Night Lords warband) / `Enslavers` / `Red Wings` stay surface-form (freq 1, niche).

### Locations (41 distinct surface forms, 62 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id | cluster |
| --- | --- | --- | --- | --- | --- |
| Baal | 4 | W40K-0217, W40K-0218, W40K-0219 | direct | baal | gk/ba, space-hulk |
| Eye of Terror | 4 | W40K-0209, W40K-0210, W40K-0215 | direct | eye_of_terror | calpurnia, gk/ba |
| Armageddon | 3 | W40K-0203, W40K-0204, W40K-0205 | direct | armageddon | calpurnia |
| Broucheroc | 2 | W40K-0224, W40K-0227 | unresolved | — | space-hulk |
| Chaeroneia | 2 | W40K-0214, W40K-0216 | unresolved | — | gk/ba |
| Danik's World | 2 | W40K-0226, W40K-0227 | unresolved | — | space-hulk |
| Drakaasi | 2 | W40K-0215, W40K-0216 | unresolved | — | gk/ba |
| Golgotha | 2 | W40K-0230, W40K-0234 | unresolved | — | am-main, space-hulk |
| Hieronymous Theta | 2 | W40K-0233, W40K-0240 | unresolved | — | am-main |
| Hydraphur | 2 | W40K-0201, W40K-0202 | direct | hydraphur | calpurnia |
| Kathur | 2 | W40K-0231, W40K-0240 | unresolved | — | am-main |
| Rahe's Paradise | 2 | W40K-0208, W40K-0210 | unresolved | — | calpurnia |
| Rogar III | 2 | W40K-0225, W40K-0227 | unresolved | — | space-hulk |
| Sin of Damnation | 2 | W40K-0221, W40K-0222 | unresolved | — | space-hulk |
| Solemnus | 2 | W40K-0203, W40K-0205 | unresolved | — | calpurnia |
| Tartarus | 2 | W40K-0207, W40K-0210 | unresolved | — | calpurnia |

> (freq=1 locations omitted from this digest — 25 of them, all unresolved, all niche single-book worlds:
> Acheron[direct], Aurelia, Bastion Psykana, Belmos VII, Borosis, Cressida, Cybele, Dulcis, Dulma'lin,
> Dynikas V, Furia Penitens, Geratomro, Grazzen, Herodian IV, Hieronymous City, Kalidar, Kallash, Khadar,
> Oleris III, Paragon, Rilis, Sabien, Shenlong, Tempest, Voor. Full list in the aggregator output.)

**Locations targets (Phase 2).** freq≥2 unresolved worlds: Broucheroc, Chaeroneia, Danik's World,
Drakaasi, Golgotha, Hieronymous Theta, Kathur, Rahe's Paradise, Rogar III, Solemnus, Tartarus.
**`Sin of Damnation` (freq 2) is a space hulk → vessel** (`tags:['vessel']`, `gx/gy:null`). Phase 2
decides the freq≥2 set + any freq=1 iconic (e.g. the Bastion Psykana / Blind Tower from the Calpurnia
finale). No new sector is obviously required (Hydraphur already resolves direct).

### Characters (58 distinct surface forms, 92 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id | cluster |
| --- | --- | --- | --- | --- | --- |
| Alaric | 4 | W40K-0213, W40K-0214, W40K-0215 | unresolved | — | gk/ba |
| Gabriel Angelos | 4 | W40K-0207, W40K-0208, W40K-0210 | unresolved | — | calpurnia, gk/ba |
| Macha | 4 | W40K-0207, W40K-0208, W40K-0210 | unresolved | — | calpurnia, gk/ba |
| Rafen | 4 | W40K-0217, W40K-0218, W40K-0219 | unresolved | — | gk/ba |
| Marshal Brant | 3 | W40K-0203, W40K-0204, W40K-0205 | unresolved | — | calpurnia |
| Nyxos | 3 | W40K-0213, W40K-0214, W40K-0216 | unresolved | — | gk/ba |
| Arkio | 2 | W40K-0217, W40K-0218 | unresolved | — | gk/ba |
| Arvin Larn | 2 | W40K-0224, W40K-0227 | unresolved | — | space-hulk |
| Captain Raphael | 2 | W40K-0221, W40K-0222 | unresolved | — | space-hulk |
| Captain Sebastev | 2 | W40K-0226, W40K-0227 | unresolved | — | space-hulk |
| Duke Venalitor | 2 | W40K-0215, W40K-0216 | unresolved | — | gk/ba |
| Fabius Bile | 2 | W40K-0219, W40K-0220 | direct | fabius_bile | gk/ba |
| Ghargatuloth | 2 | W40K-0213, W40K-0216 | unresolved | — | gk/ba |
| Isador Akios | 2 | W40K-0207, W40K-0210 | unresolved | — | calpurnia |
| Major Mortensen | 2 | W40K-0232, W40K-0240 | unresolved | — | am-main |
| Mephiston | 2 | W40K-0217, W40K-0218 | unresolved | — | gk/ba |
| Noxx | 2 | W40K-0219, W40K-0220 | unresolved | — | gk/ba |
| Parmenion Thade | 2 | W40K-0231, W40K-0240 | unresolved | — | am-main |
| Remius Stele | 2 | W40K-0217, W40K-0218 | unresolved | — | gk/ba |
| Rhamah | 2 | W40K-0209, W40K-0210 | unresolved | — | calpurnia |
| Sergeant Greiss | 2 | W40K-0225, W40K-0227 | unresolved | — | space-hulk |
| Sergeant Lorenzo | 2 | W40K-0221, W40K-0222 | unresolved | — | space-hulk |
| Sergeant Wulfe | 2 | W40K-0230, W40K-0234 | unresolved | — | am-main, space-hulk |
| Shira Calpurnia | 2 | W40K-0201, W40K-0202 | direct | shira_calpurnia | calpurnia |

> freq=1 characters (34) omitted from this digest; notable for Phase 3 / Call 2 / consolidation:
> **Marken Cortein Lo Bannick** (W40K-0238) + **Lo Bannick** (W40K-0241) = same person (see §5);
> **Dante** (W40K-0217) + **Commander Dante** (W40K-0223) = same person (see §5);
> **Commissar Flint** (W40K-0237), **Bastun Hasp** (W40K-0247), **Commissar Morrell** (W40K-0239) for
> Call-2 protagonist_class triage; Astorath (W40K-0223), Colonel Iron Hand Straken (W40K-0239),
> Dalchian Rassaq (W40K-0244 Night Lords POV), Inquisitor Kalypsia (W40K-0250). Full list in the aggregator.

**Characters targets (Phase 3).** Promote freq≥2 + lore-iconic freq=1. Big spines: Alaric (Grey Knights,
4), Gabriel Angelos + Macha (Dawn of War, 4 each), Rafen (Blood Angels, 4), Marshal Brant (Black
Templars, 3), Mephiston (Blood Angels, 2), Fabius Bile resolves direct. `primaryFactionId` for new
characters must point at the Phase-1 faction set (Blood Ravens for Angelos/Isador, eldar for Macha,
grey_knights for Alaric/Nyxos, blood_angels for Rafen/Mephiston/Dante).

## 4. Cross-axis surface-form conflicts

**None.** No surface form appears on two axes in this wave (aggregator cross-axis scan = empty). The
072-style Iyanden trap does not recur here.

## 5. Cross-batch alias-consolidation cases

> Format per case: surface-forms · book IDs · recommendation · `Decision needed:` / `Cowork-default akzeptiert:`.

### Case A — Lo Bannick (one row, two surface-forms) — **brief-mandated**
- **Surface-forms:** `Marken Cortein Lo Bannick` (W40K-0238 *Baneblade*, pov) + `Lo Bannick` (W40K-0241 *Shadowsword*, pov).
- **Same person:** yes — Guy Haley's tank-commander protagonist across the Baneblade→Shadowsword arc.
- **Recommendation:** ONE character row (canonical id `lo_bannick`; `name` = "Marken Cortein Lo Bannick" or "Lo Bannick" — Phase-3's call), with the other surface-form as a `character-aliases.json` entry. primaryFactionId = `cadian_shock_troops` (Paragon/Kalidar are Cadian armour) — Phase 3 verifies.
- **Cowork-default akzeptiert:** one row, both forms resolve.

### Case B — Dante (one row, two surface-forms)
- **Surface-forms:** `Dante` (W40K-0217 *Deus Encarmine*, supporting) + `Commander Dante` (W40K-0223 *Astorath*, supporting).
- **Same person:** yes — Commander Dante, Chapter Master of the Blood Angels. Both Blood-Angels-cluster books.
- **Recommendation:** ONE row (`commander_dante`), both surface-forms as aliases. primaryFactionId = `blood_angels`.
- **Cowork-default akzeptiert:** one row.

### Case C — Alaric (one row across trilogy + omnibus)
- **Surface-forms:** `Alaric` (W40K-0213, W40K-0214, W40K-0215; also the omnibus W40K-0216).
- **Same person:** yes — Justicar Alaric, Ben Counter's Grey Knights protagonist. Single surface-form, no alias needed — just a single promotion that the omnibus + the three constituents all resolve to.
- **Cowork-default akzeptiert:** one row (`alaric` / `justicar_alaric`), primaryFactionId = `grey_knights`.

### Case D — Gabriel Angelos / Macha (Dawn-of-War spine, single forms)
- **Surface-forms:** `Gabriel Angelos` (W40K-0207/0208/0210, +0212 not tagged here) and `Macha` (same books). Single consistent surface-form each across the trilogy + omnibus.
- **Recommendation:** one row each — `gabriel_angelos` (primaryFactionId `blood_ravens`, depends on Phase 1), `macha` (eldar Farseer). No alias consolidation needed; flagged here because they span the omnibus/constituent set.
- **Cowork-default akzeptiert:** one row each.

### Case E — Yarrick (brief watch-item) — **no work**
- The brief named Yarrick (Gunheads) as a cross-batch candidate. **Yarrick is NOT tagged as a character
  surface-form in any 021..025 override** (aggregator: absent). He is a synopsis-level mention only
  (the Fortress of Arrogance is his lost tank in W40K-0230). → No character row, no consolidation. Noted
  so Phase 3 does not invent one.

> No case is marked `Decision needed:` — all five resolve under the Cowork defaults. None escalates to a
> Phase-3 `## Needs decision` stop.

## 6. Omnibus / anthology / format conflicts

**8 omnibi + 1 anthology. All omnibi have full roster-constituent coverage (no Green-Tide-style gap).**

| ID | title | format | roster constituents | note |
| --- | --- | --- | --- | --- |
| W40K-0202 | *Enforcer Omnibus* | omnibus | W40K-0199, W40K-0200, W40K-0201 | cross-wave (0199/0200 from wave 020) |
| W40K-0205 | *The Armageddon Omnibus* | omnibus | W40K-0203, W40K-0204 | **unrated marker** (POD, 7 ratings) |
| W40K-0210 | *Blood Ravens: DoW Omnibus* | omnibus | W40K-0207, W40K-0208, W40K-0209 | — |
| W40K-0216 | *The Grey Knights Omnibus* | omnibus | W40K-0213, W40K-0214, W40K-0215 | — |
| W40K-0227 | *Imperial Guard Omnibus Vol. One* | omnibus | W40K-0224, W40K-0225, W40K-0226 | — |
| W40K-0234 | *Hammer of the Emperor Omnibus* | omnibus | W40K-0228, W40K-0229, W40K-0230 | `low_confidence:factions` |
| W40K-0240 | *Honour Imperialis Omnibus* | omnibus | W40K-0231, W40K-0232, W40K-0233 | `low_confidence:characters` |
| W40K-0242 | *Glory Imperialis Omnibus* | omnibus | W40K-0235, W40K-0236, W40K-0237 | `low_confidence:locations`+`characters` |
| W40K-0245 | *Death And Duty* | anthology | (none — original anthology) | `low_confidence`; no constituent books expected |

→ **No `collection-gaps.json` entry required this wave.** Every omnibus links its constituents; the
anthology W40K-0245 is an original multi-author collection with no separately-catalogued constituent
works (expected, not a gap). Phase 4 spot-checks one omnibus (`work_collections`).

**Format / data conflicts (from flags):**
- **W40K-0244 *The Remnant Blade* — `data_conflict:seriesHint->Night Lords`.** Roster `seriesHint` says
  "Imperial Guard"; the override correctly tags `Night Lords` (primary) + `Blades of Atrocity`, POV
  Dalchian Rassaq. `night_lords` resolves direct (under `heretic_astartes`). The `seriesHint` fix in the
  roster is a **maintainer handoff** (Series-grouping change) — NOT done this pass (Brief 089 Call 3).
- **W40K-0205 *The Armageddon Omnibus*** — deliberately carries the unrated marker (Phase-4 rating
  coverage expectation ≈ 49/50).
- **`low_confidence` flags** on 14 books (mostly omnibi aggregating thin per-constituent detail) — these
  are advisory curation flags, not resolver blockers; they explain why some omnibus axes are sparse.

## 7. needs-decision candidates

**Zero hard blockers.** Cowork expectation (0–3) met at 0. All wave decisions are resolvable in-phase
with justification:
- **Call-1 freq=1-iconic regiment-promotion extent** (Phase 1, judgment not blocker): which of
  Vostroyan Firstborn / Tallarn Desert Raiders / Valhallan Ice Warriors / Tempestus Scions / Savlar
  Chem-Dogs / Brimlock Dragoons (all freq=1) get promoted as iconic sub-factions vs stay surface-form.
  Mordian Iron Guard (freq≥2) is a definite promotion. Phase 1 justifies the set in its report.
- **`Collegia Titanica` → alias `adeptus_titanicus` vs new row** (Phase 1, judgment).
- **`Valhallan Ice Warriors` (type) vs existing `valhallan_597th` (specific regiment)** (Phase 1):
  do not alias type→specific; either a new broad row or leave unresolved.
- The five §5 consolidation cases all take the Cowork default (no escalation).

If any of the above turns genuinely ambiguous in-phase, that phase writes a `## Needs decision` block in
its per-phase status file and stops (Brief 076 contract). None is expected to.
