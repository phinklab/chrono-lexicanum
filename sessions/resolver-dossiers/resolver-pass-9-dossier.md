# Resolver-Pass 9 — Phase-0 Dossier (ssot-w40k-052..057 / W40K-0511..0565)

> Deterministic cross-axis context for the three axis-phases (Factions / Locations / Characters) + the
> Phase-4 integration. **Sections 2–6 are the mechanical output** of
> `scripts/aggregate-surface-forms.ts --config scripts/resolver-pass.config.json` (read-only, idempotent —
> re-running on the committed override files + seed-data yields byte-identical output). **Section 7 is the
> only LLM-synthesized part** (cross-batch alias-consolidation + needs-decision candidates). Phases 1–4
> read THIS file, not the 6 override files or the loop-log. Brief-free pass (Brief 094 lean contract); the
> operative spec is [`sessions/resolver-pass-runbook.md`](../resolver-pass-runbook.md) + the per-pass
> config — no architect brief is read to run a phase.

## 1. Scope header

- **Wave:** `ssot-w40k-052..057` (6 loop batches, 10 + 10 + 10 + 10 + 10 + 5 books = 55 books — the 6th is short because this is the **final W40K wave**).
- **IDs:** `W40K-0511..W40K-0565` (55 books).
- **Cumulative:** 565 W40K books (510 applied through Pass 8 + these 55). Cumulative reaches 565/565 — the W40K corpus is now complete in the authority layer (per loop-log batch 057 milestone note; HH domain still pending).
- **Resolver baseline (pre-Pass-9 reference rows + aliases):** factions **171** rows / **55** aliases · locations **214** / **15** · characters **325** / **40**. (Emitted deterministically by the aggregator; supersedes any other count.)
- **Apply range Phase 4:** `001..057` (config `aggregator.applyRange` = w40k 1..57). `052..057` first-time apply; `001..051` idempotent resolver-set re-apply (delete-then-insert per junction over existing books — non-destructive, runbook §7).
- **Clusters (observed; config has no `clusters` field this pass, so §2's cluster column stays `?`):**
  - `ssot-w40k-052` → **Warhammer Horror / Old-World swarm**: Newman omnibus *The Vampire Genevieve* (Warhammer Fantasy, format=omnibus collecting Drachenfels/Genevieve Undead/Beasts in Velvet/Silver Nails) + 6 Horror eShorts (Vintage/Isenbrach Horror/Aberration/Blood Drinker/Bird of Change/The Stacks, mixed 40K + AoS settings, all format=novella per overrides) + Horror anthology *The Accursed* + Hill's *The Bookkeeper's Skull* (40K Enforcer cadet) + AoS novel *Gothgul Hollow* (Stephens, Tales of Mhurghast #1; title typo).
  - `ssot-w40k-053` → **More Horror eShorts + Dawn of Fire opens**: AoS/40K Horror shorts (King of Pigs / Somewhere Sister AoS / Gnarled Bough AoS / Pain Engine / Black-Eyed Saint AoS) + mixed-domain anthology *The Resting Places* + 4-novel omnibus *Unholy Tales* (collecting Oubliette/Sepulturum/Deacon of Wounds/Bookkeeper's Skull) + **Dawn of Fire books 1–3** (Haley *Avenging Son* / Clark *Gates of Bones* [title typo: canonical "Gate of Bones"] / Thorpe *Wolftime*).
  - `ssot-w40k-054` → **Dawn of Fire 4–7 + Crime opens**: Haley *Throne of Light* / Kyme *Iron Kingdom* / Collins *Martyr's Tomb* / Wraight *Sea of Souls* / Kyme *Hand of Abaddon* / Haley *Silent King* (Dawn of Fire finale, Ultramarines-vs-Necrons frame) + anthology *No Peace Among Stars* + *Master of Rites* (Ferren-Areios spin-off) + **Warhammer Crime debuts** (anthology *No Good Men* + Wraight *Bloodlines*, both Varangantua / Enforcers / Probators first-appearances).
  - `ssot-w40k-055` → **Warhammer Crime continued + Iron-Snakes-Urdesh duology**: 6 Crime works (Haley *Flesh and Steel* / Collins *Grim Repast* / anthologies *Broken City* + *Sanction and Sin* + *Once a Killer* / Beer *King of the Spoil*) + **Baggit-and-Clodde duology** (Worley *Dredge Runners* [format conflict: audio drama] + *Wraithbone Phoenix*) + **Farrer's Urdesh duology** (Iron Snakes Astartes × Saint Sabbat × Anarch Sek: *Serpent and the Saint* / *Magister and the Martyr*).
  - `ssot-w40k-056` → **Twice-Dead King + Gobbo + Ghazghkull + Renegades opener**: Crowley **Twice-Dead King trilogy + omnibus** (*Ruin* / *Reign* / *Twice-Dead King Omnibus*, Necron protagonist Oltyx); 4 **Gobbo novellas** (Brooks *Da Gobbo's Revenge* / Flowers *Demise* / *Long Live Da Red Gobbo* / *Da Red Gobbo's Last Stand*, the last two with empty roster-authors → data_conflict suggestions); **Ghazghkull Thraka duology** (Crowley *Prophet of the Waaagh!* + Flowers *Warlord of Warlords*); Brooks **Renegades opener** (*Harrowmaster*, Alpha Legion POV).
  - `ssot-w40k-057` → **5 books, final W40K wave**: Brooks *Ghost Legion* (Renegades sequel) / French *Lord of the Fallen* (Cypher: Lord of the Fallen marketplace title) / Kyme *Auric Gods* (Custodes novella) / Crowley *Severed* (Sautekh Dynasty Necron novella, Nemesor Zahndrekh / Vargard Obyron) / Wooley [sic — Black Library spelling is Woolley] *Prisoners of Waaagh!*.
- **Headline shape (from §3):** 58 distinct faction surface forms / 124 occ · 45 location / 73 occ · 73 character / 94 occ. Cross-axis conflicts (§4) = **0** (none — clean wave on that front). 9 omnibus/anthology rows (§5: 1 omnibus already collected with 2 of 3+ likely constituents, 8 anthologies all `roster collection? no`). 24 `low_confidence` / `data_conflict` flag rows (§6) — heavy concentration in batches 052/053 (Horror/AoS setting + eShort format) and a small Crime/Gobbo author-attribution swarm in 056.
- **Generated by** `scripts/aggregate-surface-forms.ts --config scripts/resolver-pass.config.json` from the 6 override files (ssot-w40k-052..057, 55 books) + `book-roster.json` + the current `factions.json` / `locations.json` / `characters.json` + their alias tables.

## 2. Book table (55 entries)

| externalBookId | slug | title | format | author | year | batch | cluster | flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W40K-0511 | `the-vampire-genevieve` | *The Vampire Genevieve* | novel | Kim Newman | 2021 | `ssot-w40k-052` | `?` | `data_conflict:format->omnibus`; `data_conflict:setting->warhammer_fantasy` |
| W40K-0512 | `the-vintage` | *The Vintage* | novel | David Annandale | 2021 | `ssot-w40k-052` | `?` | `data_conflict:format->novella`; `data_conflict:setting->age_of_sigmar`; `low_confidence:characters` |
| W40K-0513 | `the-isenbrach-horror` | *The Isenbrach Horror* | novel | Darius Hinks | 2021 | `ssot-w40k-052` | `?` | `data_conflict:format->novella`; `low_confidence:characters`; `low_confidence:locations` |
| W40K-0514 | `aberration` | *Aberration* | novel | Jake Ozga | 2021 | `ssot-w40k-052` | `?` | `data_conflict:format->novella`; `data_conflict:setting->age_of_sigmar`; `low_confidence:characters` |
| W40K-0515 | `blood-drinker` | *Blood Drinker* | novel | James Brogdan | 2021 | `ssot-w40k-052` | `?` | `data_conflict:format->novella`; `low_confidence:characters` |
| W40K-0516 | `bird-of-change` | *Bird of Change* | novel | Richard Strachan | 2021 | `ssot-w40k-052` | `?` | `data_conflict:format->novella`; `data_conflict:setting->age_of_sigmar`; `low_confidence:characters` |
| W40K-0517 | `the-accursed` | *The Accursed* | anthology | ? | 2021 | `ssot-w40k-052` | `?` | `low_confidence:factions` |
| W40K-0518 | `the-bookkeepers-skull` | *The Bookkeeper's Skull* | novel | Justin D. Hill | 2022 | `ssot-w40k-052` | `?` | `low_confidence:factions` |
| W40K-0519 | `gothgul-hollow` | *Gothgul Hollow* | novel | Anna Stephens | 2022 | `ssot-w40k-052` | `?` | `data_conflict:setting->age_of_sigmar`; `data_conflict:title->gothghul-hollow` |
| W40K-0520 | `the-stacks` | *The Stacks* | novel | Chris Winterton | 2022 | `ssot-w40k-052` | `?` | `data_conflict:format->novella`; `low_confidence:characters` |
| W40K-0521 | `king-of-pigs` | *King of Pigs* | novel | J. H. Archer | 2022 | `ssot-w40k-053` | `?` | `data_conflict:format->short_story` |
| W40K-0522 | `the-somewhere-sister` | *The Somewhere Sister* | novel | Jeremy Lambert | 2022 | `ssot-w40k-053` | `?` | `data_conflict:format->short_story`; `data_conflict:domain->age_of_sigmar` |
| W40K-0523 | `the-gnarled-bough` | *The Gnarled Bough* | novel | Jamie Mistry-Evans | 2022 | `ssot-w40k-053` | `?` | `data_conflict:format->short_story`; `data_conflict:domain->age_of_sigmar` |
| W40K-0524 | `pain-engine` | *Pain Engine* | novel | Chris Thursten | 2022 | `ssot-w40k-053` | `?` | `data_conflict:format->short_story` |
| W40K-0525 | `black-eyed-saint` | *Black-Eyed Saint* | novel | Dale Lucas | 2023 | `ssot-w40k-053` | `?` | `data_conflict:domain->age_of_sigmar` |
| W40K-0526 | `the-resting-places` | *The Resting Places* | anthology | ? | 2023 | `ssot-w40k-053` | `?` | `data_conflict:domain->mixed_w40k_aos` |
| W40K-0527 | `unholy-tales-of-horror-woe-from-the-imperium` | *Unholy Tales of Horror & Woe From The Imperium* | anthology | ? | 2023 | `ssot-w40k-053` | `?` | `data_conflict:format->omnibus` |
| W40K-0528 | `avenging-son` | *Avenging Son* | novel | Guy Haley | 2020 | `ssot-w40k-053` | `?` | — |
| W40K-0529 | `the-gates-of-bones` | *The Gates of Bones* | novel | Andy Clark | 2021 | `ssot-w40k-053` | `?` | `data_conflict:title->The Gate of Bones` |
| W40K-0530 | `the-wolftime` | *The Wolftime* | novel | Gav Thorpe | 2021 | `ssot-w40k-053` | `?` | — |
| W40K-0531 | `throne-of-light` | *Throne of Light* | novel | Guy Haley | 2022 | `ssot-w40k-054` | `?` | — |
| W40K-0532 | `the-iron-kingdom` | *The Iron Kingdom* | novel | Nick Kyme | 2023 | `ssot-w40k-054` | `?` | `low_confidence:factions` |
| W40K-0533 | `the-martyrs-tomb` | *The Martyr's Tomb* | novel | Marc Collins | 2023 | `ssot-w40k-054` | `?` | — |
| W40K-0534 | `sea-of-souls` | *Sea of Souls* | novel | Chris Wraight | 2023 | `ssot-w40k-054` | `?` | `low_confidence:factions` |
| W40K-0535 | `hand-of-abaddon` | *Hand Of Abaddon* | novel | Nick Kyme | 2024 | `ssot-w40k-054` | `?` | — |
| W40K-0536 | `the-silent-king` | *The Silent King* | novel | Guy Haley | 2025 | `ssot-w40k-054` | `?` | — |
| W40K-0537 | `no-peace-among-stars` | *No Peace Among Stars* | anthology | ? | 2025 | `ssot-w40k-054` | `?` | — |
| W40K-0538 | `master-of-rites` | *Master of Rites* | novel | ? | 2025 | `ssot-w40k-054` | `?` | — |
| W40K-0539 | `no-good-men` | *No Good Men* | anthology | ? | 2020 | `ssot-w40k-054` | `?` | — |
| W40K-0540 | `bloodlines` | *Bloodlines* | novel | Chris Wraight | 2020 | `ssot-w40k-054` | `?` | — |
| W40K-0541 | `flesh-and-steel` | *Flesh and Steel* | novel | Guy Haley | 2020 | `ssot-w40k-055` | `?` | — |
| W40K-0542 | `grim-repast` | *Grim Repast* | novel | Marc Collins | 2021 | `ssot-w40k-055` | `?` | — |
| W40K-0543 | `broken-city` | *Broken City* | anthology | ? | 2021 | `ssot-w40k-055` | `?` | — |
| W40K-0544 | `sanction-and-sin` | *Sanction and Sin* | anthology | ? | 2021 | `ssot-w40k-055` | `?` | — |
| W40K-0545 | `the-king-of-the-spoil` | *The King of the Spoil* | novel | Jonathan D. Beer | 2023 | `ssot-w40k-055` | `?` | — |
| W40K-0546 | `once-a-killer` | *Once a Killer* | anthology | ? | 2023 | `ssot-w40k-055` | `?` | — |
| W40K-0547 | `dredge-runners` | *Dredge Runners* | novella | Alec Worley | 2020 | `ssot-w40k-055` | `?` | `data_conflict:format->audio_drama` |
| W40K-0548 | `the-wraithbone-phoenix` | *The Wraithbone Phoenix* | novel | Alec Worley | 2022 | `ssot-w40k-055` | `?` | — |
| W40K-0549 | `the-serpent-and-the-saint` | *The Serpent and the Saint* | novel | Matthew Farrer | 2021 | `ssot-w40k-055` | `?` | — |
| W40K-0550 | `the-magister-and-the-martyr` | *The Magister and the Martyr* | novel | Matthew Farrer | 2021 | `ssot-w40k-055` | `?` | — |
| W40K-0551 | `ruin` | *Ruin* | novel | Nate Crowley | 2021 | `ssot-w40k-056` | `?` | — |
| W40K-0552 | `reign` | *Reign* | novel | Nate Crowley | 2021 | `ssot-w40k-056` | `?` | — |
| W40K-0553 | `the-twice-dead-king-omnibus` | *The Twice-Dead King Omnibus* | omnibus | Nate Crowley | 2025 | `ssot-w40k-056` | `?` | — |
| W40K-0554 | `da-gobbos-revenge` | *Da Gobbo's Revenge* | novella | Mike Brooks | 2021 | `ssot-w40k-056` | `?` | — |
| W40K-0555 | `da-gobbos-demise` | *Da Gobbo's Demise* | novella | Denny Flowers | 2022 | `ssot-w40k-056` | `?` | — |
| W40K-0556 | `long-live-da-red-gobbo` | *Long Live Da Red Gobbo* | novella | ? | 2024 | `ssot-w40k-056` | `?` | `data_conflict:authors->Justin Woolley` |
| W40K-0557 | `da-red-gobbos-last-stand` | *Da Red Gobbo's Last Stand* | novella | ? | 2025 | `ssot-w40k-056` | `?` | `data_conflict:authors->Andi Ewington` |
| W40K-0558 | `ghazghkull-thraka-prophet-of-the-waaagh` | *Ghazghkull Thraka: Prophet of the Waaagh!* | novel | Nate Crowley | 2022 | `ssot-w40k-056` | `?` | — |
| W40K-0559 | `ghazghkull-thraka-warlord-of-warlords` | *Ghazghkull Thraka: Warlord of Warlords* | novel | Denny Flowers | 2026 | `ssot-w40k-056` | `?` | — |
| W40K-0560 | `renegades-harrowmaster` | *Renegades: Harrowmaster* | novel | Mike Brooks | 2022 | `ssot-w40k-056` | `?` | — |
| W40K-0561 | `ghost-legion` | *Ghost Legion* | novel | Mike Brooks | 2026 | `ssot-w40k-057` | `?` | — |
| W40K-0562 | `lord-of-the-fallen` | *Lord of the Fallen* | novel | John French | 2023 | `ssot-w40k-057` | `?` | — |
| W40K-0563 | `auric-gods` | *Auric Gods* | novella | Nick Kyme | 2018 | `ssot-w40k-057` | `?` | `low_confidence:factions` |
| W40K-0564 | `severed` | *Severed* | novella | Nate Crowley | 2019 | `ssot-w40k-057` | `?` | — |
| W40K-0565 | `prisoners-of-waaagh` | *Prisoners of Waaagh!* | novella | Justin Wooley | 2020 | `ssot-w40k-057` | `?` | — |

## 3. Surface-form aggregate (sorted: freq desc, name asc)

### Factions (58 distinct surface forms, 124 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Orks | 10 | W40K-0530, W40K-0551, W40K-0553 | direct | orks | `?` |
| Adeptus Astartes | 8 | W40K-0517, W40K-0528, W40K-0530 | direct | adeptus_astartes | `?` |
| Adeptus Arbites | 7 | W40K-0518, W40K-0541, W40K-0542 | direct | adeptus_arbites | `?` |
| Astra Militarum | 7 | W40K-0517, W40K-0529, W40K-0532 | direct | astra_militarum | `?` |
| Ultramarines | 6 | W40K-0528, W40K-0530, W40K-0531 | direct | ultramarines | `?` |
| Inquisition | 5 | W40K-0517, W40K-0520, W40K-0531 | direct | inquisition | `?` |
| Necrons | 5 | W40K-0536, W40K-0551, W40K-0552 | direct | necrons | `?` |
| Adeptus Custodes | 3 | W40K-0529, W40K-0562, W40K-0563 | direct | custodes | `?` |
| Adeptus Mechanicus | 3 | W40K-0528, W40K-0537, W40K-0541 | direct | mechanicus | `?` |
| Adeptus Ministorum | 3 | W40K-0527, W40K-0549, W40K-0550 | alias | ecclesiarchy | `?` |
| Imperial Navy | 3 | W40K-0534, W40K-0552, W40K-0553 | direct | imperial_navy | `?` |
| Nurgle | 3 | W40K-0521, W40K-0526, W40K-0527 | direct | nurgle | `?` |
| Soulblight Gravelords | 3 | W40K-0512, W40K-0514, W40K-0517 | unresolved | — | `?` |
| Adepta Sororitas | 2 | W40K-0529, W40K-0534 | direct | sisters_of_battle | `?` |
| Alpha Legion | 2 | W40K-0560, W40K-0561 | direct | alpha_legion | `?` |
| Black Legion | 2 | W40K-0528, W40K-0532 | direct | black_legion | `?` |
| Black Templars | 2 | W40K-0533, W40K-0559 | direct | black_templars | `?` |
| Death Guard | 2 | W40K-0533, W40K-0538 | direct | death_guard | `?` |
| Drukhari | 2 | W40K-0524, W40K-0526 | alias | eldar | `?` |
| Enforcers | 2 | W40K-0539, W40K-0540 | unresolved | — | `?` |
| Iron Snakes | 2 | W40K-0549, W40K-0550 | direct | iron_snakes | `?` |
| Officio Assassinorum | 2 | W40K-0561, W40K-0562 | direct | officio_assassinorum | `?` |
| Ogryns | 2 | W40K-0547, W40K-0548 | unresolved | — | `?` |
| Ratlings | 2 | W40K-0547, W40K-0548 | direct | ratlings | `?` |
| Sons of Sek | 2 | W40K-0549, W40K-0550 | direct | sons_of_sek | `?` |
| Word Bearers | 2 | W40K-0529, W40K-0531 | direct | word_bearers | `?` |
| Adeptus Administratum | 1 | W40K-0527 | unresolved | — | `?` |
| Aeldari | 1 | W40K-0548 | direct | eldar | `?` |
| Argent Shroud | 1 | W40K-0529 | unresolved | — | `?` |
| Blood Axes | 1 | W40K-0559 | unresolved | — | `?` |
| Blood Drinkers | 1 | W40K-0515 | direct | blood_drinkers | `?` |
| Chaos Cultists | 1 | W40K-0555 | unresolved | — | `?` |
| Chaos Cults | 1 | W40K-0518 | unresolved | — | `?` |
| Cities of Sigmar | 1 | W40K-0519 | unresolved | — | `?` |
| Dark Angels | 1 | W40K-0562 | direct | dark_angels | `?` |
| Disciples of Tzeentch | 1 | W40K-0516 | unresolved | — | `?` |
| Freebooterz | 1 | W40K-0557 | unresolved | — | `?` |
| Freeguild | 1 | W40K-0512 | unresolved | — | `?` |
| Har Dhrol | 1 | W40K-0545 | unresolved | — | `?` |
| Heretic Astartes | 1 | W40K-0517 | direct | heretic_astartes | `?` |
| Howling Griffons | 1 | W40K-0537 | direct | howling_griffons | `?` |
| Imperial Knights | 1 | W40K-0532 | direct | imperial_knights | `?` |
| Imperial Nobility | 1 | W40K-0513 | unresolved | — | `?` |
| Iron Warriors | 1 | W40K-0529 | direct | iron_warriors | `?` |
| Mordian Iron Guard | 1 | W40K-0535 | direct | mordian_iron_guard | `?` |
| Order of Our Martyred Lady | 1 | W40K-0533 | direct | order_of_our_martyred_lady | `?` |
| Ordo Xenos | 1 | W40K-0558 | direct | ordo_xenos | `?` |
| Red Corsairs | 1 | W40K-0535 | direct | red_corsairs | `?` |
| Rogue Traders | 1 | W40K-0533 | direct | rogue_traders | `?` |
| Sautekh Dynasty | 1 | W40K-0564 | unresolved | — | `?` |
| Snakebites | 1 | W40K-0556 | unresolved | — | `?` |
| Space Wolves | 1 | W40K-0530 | direct | space_wolves | `?` |
| Stormcast Eternals | 1 | W40K-0517 | unresolved | — | `?` |
| The Empire | 1 | W40K-0511 | unresolved | — | `?` |
| The Fallen | 1 | W40K-0562 | alias | fallen_angels | `?` |
| Valtteri Cartel | 1 | W40K-0545 | unresolved | — | `?` |
| Vampire Counts | 1 | W40K-0511 | unresolved | — | `?` |
| White Consuls | 1 | W40K-0528 | direct | white_consuls | `?` |

### Locations (45 distinct surface forms, 73 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Varangantua | 10 | W40K-0539, W40K-0540, W40K-0541 | unresolved | — | `?` |
| Alecto | 8 | W40K-0541, W40K-0542, W40K-0543 | unresolved | — | `?` |
| Terra | 4 | W40K-0528, W40K-0531, W40K-0562 | direct | terra | `?` |
| Antikef | 3 | W40K-0551, W40K-0552, W40K-0553 | unresolved | — | `?` |
| Anaxian Line | 2 | W40K-0532, W40K-0535 | unresolved | — | `?` |
| Hive Blackbracken | 2 | W40K-0521, W40K-0526 | unresolved | — | `?` |
| Sabbat Worlds | 2 | W40K-0549, W40K-0550 | direct | sabbat | `?` |
| Sedh | 2 | W40K-0551, W40K-0553 | unresolved | — | `?` |
| Shyish | 2 | W40K-0517, W40K-0519 | unresolved | — | `?` |
| Ultramar | 2 | W40K-0536, W40K-0538 | direct | ultramar | `?` |
| Urdesh | 2 | W40K-0549, W40K-0550 | direct | urdesh | `?` |
| Altdorf | 1 | W40K-0511 | unresolved | — | `?` |
| Armageddon | 1 | W40K-0558 | direct | armageddon | `?` |
| Blood-Rock Peaks | 1 | W40K-0525 | unresolved | — | `?` |
| Calignius | 1 | W40K-0525 | unresolved | — | `?` |
| Doahht | 1 | W40K-0564 | unresolved | — | `?` |
| Drachenfels | 1 | W40K-0511 | unresolved | — | `?` |
| Eye of Terror | 1 | W40K-0534 | direct | eye_of_terror | `?` |
| Fenris | 1 | W40K-0530 | direct | fenris | `?` |
| Gabal | 1 | W40K-0559 | unresolved | — | `?` |
| Gathalamor | 1 | W40K-0529 | unresolved | — | `?` |
| Ghereppan | 1 | W40K-0550 | unresolved | — | `?` |
| Ghoul Stars | 1 | W40K-0564 | unresolved | — | `?` |
| Golden Chain | 1 | W40K-0533 | unresolved | — | `?` |
| Gothghul Hollow | 1 | W40K-0519 | unresolved | — | `?` |
| Great Rift | 1 | W40K-0538 | alias | great_rift | `?` |
| Imperial Palace | 1 | W40K-0562 | unresolved | — | `?` |
| Imperium Nihilus | 1 | W40K-0536 | direct | imperium_nihilus | `?` |
| Kamidar | 1 | W40K-0532 | unresolved | — | `?` |
| Machorta Sound | 1 | W40K-0528 | unresolved | — | `?` |
| Mhurghast | 1 | W40K-0519 | unresolved | — | `?` |
| Nearsteel | 1 | W40K-0541 | unresolved | — | `?` |
| Pariah Nexus | 1 | W40K-0536 | direct | pariah_nexus | `?` |
| Polaris | 1 | W40K-0542 | unresolved | — | `?` |
| Rotauri | 1 | W40K-0565 | unresolved | — | `?` |
| Segmentum Solar | 1 | W40K-0531 | unresolved | — | `?` |
| Srinagar | 1 | W40K-0531 | unresolved | — | `?` |
| Steelmound | 1 | W40K-0541 | unresolved | — | `?` |
| The Old World | 1 | W40K-0511 | unresolved | — | `?` |
| The Spoil | 1 | W40K-0545 | unresolved | — | `?` |
| Thorsarbour | 1 | W40K-0518 | unresolved | — | `?` |
| Ullanor | 1 | W40K-0558 | direct | ullanor | `?` |
| Ultima Segmentum | 1 | W40K-0560 | unresolved | — | `?` |
| Velua | 1 | W40K-0533 | unresolved | — | `?` |
| Vorganthian | 1 | W40K-0563 | unresolved | — | `?` |

### Characters (73 distinct surface forms, 94 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Roboute Guilliman | 5 | W40K-0528, W40K-0529, W40K-0530 | direct | roboute_guilliman | `?` |
| Djoseras | 3 | W40K-0551, W40K-0552, W40K-0553 | unresolved | — | `?` |
| Ghazghkull Mag Uruk Thraka | 3 | W40K-0530, W40K-0558, W40K-0559 | unresolved | — | `?` |
| Oltyx | 3 | W40K-0551, W40K-0552, W40K-0553 | unresolved | — | `?` |
| Yenekh | 3 | W40K-0551, W40K-0552, W40K-0553 | unresolved | — | `?` |
| Baggit | 2 | W40K-0547, W40K-0548 | unresolved | — | `?` |
| Clodde | 2 | W40K-0547, W40K-0548 | unresolved | — | `?` |
| Ferren Areios | 2 | W40K-0535, W40K-0538 | unresolved | — | `?` |
| Inquisitor Rostov | 2 | W40K-0531, W40K-0535 | unresolved | — | `?` |
| Magister Sek | 2 | W40K-0549, W40K-0550 | unresolved | — | `?` |
| Priad | 2 | W40K-0549, W40K-0550 | unresolved | — | `?` |
| Saint Sabbat | 2 | W40K-0549, W40K-0550 | direct | saint_sabbat | `?` |
| Solomon Akurra | 2 | W40K-0560, W40K-0561 | unresolved | — | `?` |
| Tabidiah Kruger | 2 | W40K-0547, W40K-0548 | unresolved | — | `?` |
| 'Eadbasha | 1 | W40K-0565 | unresolved | — | `?` |
| Aaric Gothghul | 1 | W40K-0519 | unresolved | — | `?` |
| Abaddon the Despoiler | 1 | W40K-0528 | direct | abaddon_the_despoiler | `?` |
| Achallor | 1 | W40K-0529 | unresolved | — | `?` |
| Agusto Zidarov | 1 | W40K-0543 | unresolved | — | `?` |
| Anasta Malkorion | 1 | W40K-0512 | unresolved | — | `?` |
| Andreti Sorokin | 1 | W40K-0545 | unresolved | — | `?` |
| Belisarius Cawl | 1 | W40K-0528 | direct | belisarius_cawl | `?` |
| Bodgit | 1 | W40K-0557 | unresolved | — | `?` |
| Brukka Bludspilla | 1 | W40K-0556 | unresolved | — | `?` |
| Canoness Irinya | 1 | W40K-0533 | unresolved | — | `?` |
| Cartovandis | 1 | W40K-0563 | unresolved | — | `?` |
| Constant Drachenfels | 1 | W40K-0511 | unresolved | — | `?` |
| Cypher | 1 | W40K-0562 | direct | cypher | `?` |
| Da Red Gobbo | 1 | W40K-0555 | unresolved | — | `?` |
| Detlef Sierck | 1 | W40K-0511 | unresolved | — | `?` |
| Drazus Jate | 1 | W40K-0560 | unresolved | — | `?` |
| Falx | 1 | W40K-0558 | unresolved | — | `?` |
| Fingwit | 1 | W40K-0554 | unresolved | — | `?` |
| Gaheris | 1 | W40K-0533 | unresolved | — | `?` |
| Genevieve Dieudonne | 1 | W40K-0511 | unresolved | — | `?` |
| Gitzit | 1 | W40K-0555 | unresolved | — | `?` |
| Graeyl Herek | 1 | W40K-0535 | unresolved | — | `?` |
| Haska Jovanic | 1 | W40K-0545 | unresolved | — | `?` |
| Iota-11 | 1 | W40K-0537 | unresolved | — | `?` |
| Iron Queen Orlah | 1 | W40K-0532 | unresolved | — | `?` |
| Kaptin Bludhook | 1 | W40K-0557 | unresolved | — | `?` |
| Katla Helvintr | 1 | W40K-0533 | unresolved | — | `?` |
| Kirian Malenko | 1 | W40K-0546 | unresolved | — | `?` |
| Kor Phaeron | 1 | W40K-0531 | unresolved | — | `?` |
| Logan Grimnar | 1 | W40K-0530 | direct | logan_grimnar | `?` |
| Magda Kesh | 1 | W40K-0535 | unresolved | — | `?` |
| Makari | 1 | W40K-0558 | unresolved | — | `?` |
| Marcus van Veenan | 1 | W40K-0565 | unresolved | — | `?` |
| Melita Voronova | 1 | W40K-0545 | unresolved | — | `?` |
| Meroved | 1 | W40K-0563 | unresolved | — | `?` |
| Nemesor Zahndrekh | 1 | W40K-0564 | unresolved | — | `?` |
| Probator Agusto Zidarov | 1 | W40K-0540 | unresolved | — | `?` |
| Quillon Drask | 1 | W40K-0542 | unresolved | — | `?` |
| Redsnot | 1 | W40K-0555 | unresolved | — | `?` |
| Rho-1 Lux | 1 | W40K-0541 | unresolved | — | `?` |
| Rudgard Howe | 1 | W40K-0518 | unresolved | — | `?` |
| Runar Skoldolfr | 1 | W40K-0525 | unresolved | — | `?` |
| Savriel Sabbriatti | 1 | W40K-0547 | unresolved | — | `?` |
| Setekh | 1 | W40K-0564 | unresolved | — | `?` |
| Sister Isobel | 1 | W40K-0534 | unresolved | — | `?` |
| Slipbit | 1 | W40K-0556 | unresolved | — | `?` |
| Slitta da Stabba | 1 | W40K-0559 | unresolved | — | `?` |
| Symeon Noctis | 1 | W40K-0541 | unresolved | — | `?` |
| Szarekh | 1 | W40K-0536 | unresolved | — | `?` |
| Tenebrus | 1 | W40K-0535 | unresolved | — | `?` |
| Tharador Yheng | 1 | W40K-0535 | unresolved | — | `?` |
| Tiberius Grim | 1 | W40K-0525 | unresolved | — | `?` |
| Trajann Valoris | 1 | W40K-0563 | unresolved | — | `?` |
| Udmil Terashova | 1 | W40K-0540 | unresolved | — | `?` |
| Ursula Gedd | 1 | W40K-0563 | unresolved | — | `?` |
| VanLeskus | 1 | W40K-0528 | unresolved | — | `?` |
| Vargard Obyron | 1 | W40K-0564 | unresolved | — | `?` |
| Vitrian Messinius | 1 | W40K-0528 | unresolved | — | `?` |

## 4. Cross-axis surface-form conflicts

| surface form | axes |
| --- | --- |
| (none) | — |

## 5. Omnibus / anthology scan

| externalBookId | title | format | roster collection? | known constituents |
| --- | --- | --- | --- | --- |
| W40K-0517 | *The Accursed* | anthology | no | — |
| W40K-0526 | *The Resting Places* | anthology | no | — |
| W40K-0527 | *Unholy Tales of Horror & Woe From The Imperium* | anthology | no | — |
| W40K-0537 | *No Peace Among Stars* | anthology | no | — |
| W40K-0539 | *No Good Men* | anthology | no | — |
| W40K-0543 | *Broken City* | anthology | no | — |
| W40K-0544 | *Sanction and Sin* | anthology | no | — |
| W40K-0546 | *Once a Killer* | anthology | no | — |
| W40K-0553 | *The Twice-Dead King Omnibus* | omnibus | yes (2) | W40K-0551, W40K-0552 |

## 6. data_conflict flag scan

| externalBookId | title | flags |
| --- | --- | --- |
| W40K-0511 | *The Vampire Genevieve* | `data_conflict:format->omnibus`; `data_conflict:setting->warhammer_fantasy` |
| W40K-0512 | *The Vintage* | `data_conflict:format->novella`; `data_conflict:setting->age_of_sigmar`; `low_confidence:characters` |
| W40K-0513 | *The Isenbrach Horror* | `data_conflict:format->novella`; `low_confidence:characters`; `low_confidence:locations` |
| W40K-0514 | *Aberration* | `data_conflict:format->novella`; `data_conflict:setting->age_of_sigmar`; `low_confidence:characters` |
| W40K-0515 | *Blood Drinker* | `data_conflict:format->novella`; `low_confidence:characters` |
| W40K-0516 | *Bird of Change* | `data_conflict:format->novella`; `data_conflict:setting->age_of_sigmar`; `low_confidence:characters` |
| W40K-0517 | *The Accursed* | `low_confidence:factions` |
| W40K-0518 | *The Bookkeeper's Skull* | `low_confidence:factions` |
| W40K-0519 | *Gothgul Hollow* | `data_conflict:setting->age_of_sigmar`; `data_conflict:title->gothghul-hollow` |
| W40K-0520 | *The Stacks* | `data_conflict:format->novella`; `low_confidence:characters` |
| W40K-0521 | *King of Pigs* | `data_conflict:format->short_story` |
| W40K-0522 | *The Somewhere Sister* | `data_conflict:format->short_story`; `data_conflict:domain->age_of_sigmar` |
| W40K-0523 | *The Gnarled Bough* | `data_conflict:format->short_story`; `data_conflict:domain->age_of_sigmar` |
| W40K-0524 | *Pain Engine* | `data_conflict:format->short_story` |
| W40K-0525 | *Black-Eyed Saint* | `data_conflict:domain->age_of_sigmar` |
| W40K-0526 | *The Resting Places* | `data_conflict:domain->mixed_w40k_aos` |
| W40K-0527 | *Unholy Tales of Horror & Woe From The Imperium* | `data_conflict:format->omnibus` |
| W40K-0529 | *The Gates of Bones* | `data_conflict:title->The Gate of Bones` |
| W40K-0532 | *The Iron Kingdom* | `low_confidence:factions` |
| W40K-0534 | *Sea of Souls* | `low_confidence:factions` |
| W40K-0547 | *Dredge Runners* | `data_conflict:format->audio_drama` |
| W40K-0556 | *Long Live Da Red Gobbo* | `data_conflict:authors->Justin Woolley` |
| W40K-0557 | *Da Red Gobbo's Last Stand* | `data_conflict:authors->Andi Ewington` |
| W40K-0563 | *Auric Gods* | `low_confidence:factions` |

## 7. Cross-batch alias-consolidation + needs-decision candidates

> The only LLM-synthesized section. It flags (7a) surface-form variants the owning phase must collapse into
> **one** row + an alias — Pass 9 has only one such pair — plus (7b) the big single-form cross-batch spines
> that already resolve cleanly (Twice-Dead King trilogy/omnibus, Urdesh duology, Baggit-Clodde duology,
> Ghazghkull duology, Renegades duology, Dawn of Fire); (7c) the freq-driven promotion shape per axis;
> (7d) genuine needs-decision candidates (mostly out-of-domain swarms — Old World / AoS — and Phase-4
> collection-gap spot-checks). Everything is grounded in the §2–§6 aggregate (book-IDs cited) + canonical
> Black-Library series structure + the loop-log tail for batches 052..057; no identity is asserted that the
> surface forms + co-occurrence don't already imply. **Zero hard blockers expected** — every call below
> resolves in-phase with justification. If an identity turns genuinely ambiguous in-phase, that phase writes
> a `## Needs decision` block in its per-phase status file and stops (runbook §3).

### 7a. Cross-batch alias-consolidation cases (→ one row + alias)

> Format: surface-forms · book-IDs · same entity? · recommendation. These are the cases where a naïve
> implementer would create **two** rows. Pass 9 has exactly one — the Crime-strand Probator across his
> novel and the anthology that surfaces him again.

**Characters (Phase 3):**

- **Case A — Agusto Zidarov.** `Probator Agusto Zidarov` (W40K-0540 *Bloodlines*, freq 1, unresolved) +
  `Agusto Zidarov` (W40K-0543 *Broken City* anthology, freq 1, unresolved). Same: yes — Wraight's
  Varangantua Probator from *Bloodlines* (the genre-defining Warhammer Crime debut), surfacing again as the
  POV / mention in the *Broken City* anthology's lead Crime story. → one row `agusto_zidarov`,
  `Probator Agusto Zidarov` as alias. Combined effective freq 2 across 2 books. primaryFactionId
  `adeptus_arbites` (exists — Probators are an Arbites rank under the Varangantua/Crime convention; see
  also 7c Note for the `Enforcers` parent-grain call).

**Locations (Phase 2):**

- (No location alias-consolidation pairs in this wave. The freq ≥ 2 unresolved locations — `Varangantua`,
  `Alecto`, `Antikef`, `Anaxian Line`, `Hive Blackbracken`, `Sedh`, `Shyish` — each appear under one
  consistent surface form, so they're 7c promotions/decisions, not 7a aliases.)

**Factions (Phase 1):**

- (No faction alias-consolidation pairs in this wave. The freq ≥ 2 unresolved factions — `Soulblight
  Gravelords`, `Enforcers`, `Ogryns` — each appear under one consistent surface form. Already-resolved
  alias confirmations: `Adeptus Ministorum` (freq 3 → `ecclesiarchy`, Pass-8 alias paying off across
  Unholy Tales + Urdesh duology), `Drukhari` (freq 2 → `eldar`, Pass-6 alias). No action.)

### 7b. Big single-form cross-batch spines (one row each — not alias work)

These are **single, consistent** surface forms that recur across a duology/trilogy + its omnibus, or
across a multi-book character arc, so the omnibus occurrence and the per-volume occurrences must resolve
to **one** promoted row (do not split them). This is the bulk of Phase-3 volume; all are freq ≥ 2.

- **Twice-Dead King trilogy + omnibus** (Crowley, 0551/0552 + omnibus 0553): `Djoseras` (3 — late
  Twice-Dead King, Oltyx's brother), `Oltyx` (3 — Necron Nemesor protagonist), `Yenekh` (3 — Oltyx's
  Cryptek vizier). primaryFactionId `necrons` (exists). All three resolve identically across the two
  novels + the 2025 omnibus reissue (the omnibus rolls the same characters by reference).
- **Urdesh duology** (Farrer, 0549/0550): `Magister Sek` (2 — Anarch Sek, leader of the Sons of Sek
  pact), `Priad` (2 — Iron Snakes Damocles-Squad sergeant). primaryFactionId map: Sek → `sons_of_sek`
  (exists); Priad → `iron_snakes` (exists). Saint Sabbat (freq 2) already resolves direct →
  `saint_sabbat`.
- **Baggit-and-Clodde duology** (Worley, 0547/0548): `Baggit` (2 — Ratling), `Clodde` (2 — Ogryn),
  `Tabidiah Kruger` (2 — their Imperial handler/contact across both works). primaryFactionId map:
  Baggit → `ratlings` (exists, promoted Pass 8); Clodde → `ogryns` if Phase 1 promotes (7c — consistent
  grain with Pass-8 Ratlings call), else `astra_militarum` fallback; Kruger → no clean faction (civilian
  Imperial fixer), default empty / fallback `imperium` if the broad row exists.
- **Ghazghkull duology + cross-wave reference** (Crowley *Prophet of the Waaagh!* 0558 + Flowers
  *Warlord of Warlords* 0559 + *Wolftime* 0530): `Ghazghkull Mag Uruk Thraka` (3 — full surface form
  preserved per surface-form-treue, see loop-log notable-forms note for batch 053). One row
  `ghazghkull_mag_uruk_thraka` (or `ghazghkull` if Phase 3 prefers the short canonical slug), with the
  full form as `name` and the bare `Ghazghkull` not appearing in this wave (so no alias needed yet).
  primaryFactionId `orks` (exists). Lore-iconic Phase-3 anchor for the entire Ork strand of this wave.
- **Renegades duology** (Brooks, 0560/0561): `Solomon Akurra` (2 — Alpha Legion Harrowmaster POV across
  *Harrowmaster* + *Ghost Legion*). primaryFactionId `alpha_legion` (exists, direct in §3).
- **Dawn of Fire spine** (0528..0531, 0535, 0536): `Roboute Guilliman` (5 — direct, exists), `Belisarius
  Cawl` (1 — direct), `Abaddon the Despoiler` (1 — direct), plus the cross-batch spines `Inquisitor
  Rostov` (2 — Throne of Light 0531 + Hand of Abaddon 0535, John French's Ordo Hereticus inquisitor),
  `Ferren Areios` (2 — Hand of Abaddon 0535 + Master of Rites 0538, Salamanders captain). primaryFactionId
  map: Rostov → `inquisition` (exists); Areios → `salamanders` (exists). The DoF-finale book *The Silent
  King* (0536) adds `Szarekh` (1 — Necron Silent King, lore-iconic freq-1, 7c).
- **Severed cluster** (Crowley 0564): `Nemesor Zahndrekh` (1, lore-iconic Sautekh Nemesor), `Vargard
  Obyron` (1, lore-iconic, Zahndrekh's bodyguard), `Setekh` (1). primaryFactionId `necrons` (exists);
  lore-iconic freq-1 promotions per 7c. Note `Severed` may also be a constituent of W40K-0553
  *Twice-Dead King Omnibus* (per loop-log batch 056 note); see 7d Phase-4 spot-check.
- **Auric Gods cluster** (Kyme 0563, Custodes novella): `Cartovandis` (1), `Meroved` (1), `Ursula Gedd`
  (1), `Trajann Valoris` (1, lore-iconic — Captain-General of the Adeptus Custodes). primaryFactionId
  `custodes` (exists).
- **Hand of Abaddon dramatis personae** (Kyme 0535): `Tenebrus` (1, lore-iconic — recurring Hand of
  Abaddon antagonist), `Tharador Yheng` (1), `Magda Kesh` (1), `Graeyl Herek` (1). primaryFactionId map:
  Tenebrus → `black_legion` (exists) or `chaos`-side fallback; Yheng → Word Bearers/Astra Militarum side
  (Phase-3 judgment, low-evidence); Kesh / Herek → `astra_militarum` (exists) fallback. No spine, all
  freq-1 but lore-cluster-anchored.
- **The Martyr's Tomb dramatis personae** (Collins 0533): `Canoness Irinya` (1 — Sororitas /
  `order_of_our_martyred_lady`), `Gaheris` (1 — Black Templar), `Katla Helvintr` (1 — Rogue Trader).
  primaryFactionId map: Irinya → `order_of_our_martyred_lady` (exists, direct §3) or `sisters_of_battle`
  fallback; Gaheris → `black_templars` (exists, direct); Helvintr → `rogue_traders` (exists, direct).
- **Sea of Souls** (Wraight 0534): `Sister Isobel` (1, Sister of Battle). primaryFactionId
  `sisters_of_battle` (exists). Lore-iconic freq-1 candidate (7c).
- **Crime / Varangantua POVs** (0540..0542, 0545): `Quillon Drask` (1 — Grim Repast probator),
  `Symeon Noctis` (1 — Flesh and Steel probator), `Rho-1 Lux` (1 — Flesh and Steel tech-priest),
  `Melita Voronova` (1 — King of the Spoil), `Haska Jovanic` (1 — King of the Spoil),
  `Andreti Sorokin` (1 — King of the Spoil), `Udmil Terashova` (1 — Bloodlines). primaryFactionId map:
  the probators → `adeptus_arbites` (exists, direct), Rho-1 Lux → `mechanicus` (exists), the cartel
  /info-broker characters → no clean faction, default empty / `imperium`. (See 7a Case A for Zidarov.)

> **FK-safety (runbook §5):** every spine above points at a faction that **already exists** in
> `factions.json` for the default mapping (`necrons`, `sons_of_sek`, `iron_snakes`, `ratlings`,
> `astra_militarum`, `orks`, `alpha_legion`, `inquisition`, `salamanders`, `custodes`, `black_legion`,
> `order_of_our_martyred_lady`, `black_templars`, `rogue_traders`, `sisters_of_battle`,
> `adeptus_arbites`, `mechanicus`). The Phase-1 promotions in 7c (`ogryns`, `sautekh_dynasty` — both
> defensible) only become hard FK dependencies for Phase 3 *if* Phase 3 picks them as `primaryFactionId`
> for Clodde / Severed cast — and even there the fallback is the parent faction (`astra_militarum` /
> `necrons`). Phase 1 promotes from evidence (7c); Phase 3 takes whatever survives.

### 7c. Per-axis promotion shape (freq-driven; owning phase justifies the exact set)

**Factions (Phase 1).** Strict **freq ≥ 2 unresolved** promotion candidates — three rows / aliases, each
defensible:

- **`Enforcers` (freq 2).** Varangantua / Warhammer Crime sub-faction; surfaces in *No Good Men* (0539,
  Crime anthology, "first appearance of Varangantua / Enforcers / Probators surface forms in the
  authority layer") and *Bloodlines* (0540, Wraight's Crime debut). Pass-1 (Brief 061 era) loop note on
  *The Bookkeeper's Skull* (0518) already established the convention: "Enforcers ≠ strictly Adeptus
  Arbites but tagged as nearest Browse-Root with low_confidence note". Default = **alias to
  `adeptus_arbites`** (matches the Browse-Root convention; Probators surface as both an Arbites rank and
  an Enforcer role across these books). Promote as own row only if Phase 1 deliberately introduces a
  Varangantua-Enforcer browse-root distinct from Arbites (judgment call; default is alias).
- **`Ogryns` (freq 2).** Imperial Guard abhuman auxiliaries (heavy infantry); primary surface in the
  Baggit-and-Clodde duology (Clodde the Ogryn). Pass 8 promoted `Ratlings` as own row (now resolves
  direct freq 2 in this wave, 7b spine). **Consistency call:** default = **own row `ogryns`** to match
  the Ratlings grain. Phase 1 judgment if a different grain is wanted, but breaking parity with Ratlings
  inside the same Baggit-Clodde duology would be awkward.
- **`Soulblight Gravelords` (freq 3).** Age-of-Sigmar Vampire faction; surfaces only in AoS-flagged
  Horror eShorts (Vintage 0512, Aberration 0514, Accursed 0517). Default = **leave unresolved** —
  consistent with the Pass-8 7c default for AoS-specific factions (no AoS faction bucket in
  `factions.json`; the `setting->age_of_sigmar` flags on those books carry through to the audit cockpit
  as advisory). Same call applies to all the other AoS / Old-World factions below.

Lore-iconic freq-1 candidates (Phase 1's discretion):

- **`Adeptus Administratum` (freq 1).** Imperial bureaucratic body (surface in *Unholy Tales* 0527
  anthology). Lore-canon: the Administratum is the Imperium's civil service spine; sibling to
  `ecclesiarchy` / `astra_militarum` / `mechanicus` in the Adeptus Terra structure. Plausible Phase-1
  add (own row `adeptus_administratum`, primaryFactionId / parent → `imperium` if such fallback exists;
  else standalone). Or leave unresolved (single occurrence, low evidence).
- **`Sautekh Dynasty` (freq 1, lore-iconic).** Necron dynasty surfacing in *Severed* (0564, with both
  `Sautekh Dynasty` and `Necrons` tagged primary per loop-log batch 057 note so the dynasty browse-root
  surfaces). Default = **new row `sautekh_dynasty`** as Necron-dynasty grain (consistent with the
  Dynasty/Crownworld lore pattern; Zahndrekh + Obyron are Sautekh notables). Plausible Phase-1 add.
  Cross-references the Twice-Dead King trilogy's Ithakas Dynasty (Oltyx's dynasty — not surfaced as
  faction in this wave, only as character mentions); same dynasty grain would apply if it ever surfaces
  as a faction tag.
- **`Argent Shroud` (freq 1).** Sisters of Battle preceptory / order; loop log batch 053 calls it "a
  specific Sisters of Battle preceptory under Adepta Sororitas". Default = **alias to
  `sisters_of_battle`** (consistent with the regiment-grain rule — no per-preceptory rows promoted in
  prior passes). Or leave unresolved.
- **`Chaos Cultists` (freq 1) + `Chaos Cults` (freq 1).** Generic Chaos surface forms; loop log batch
  056 explicitly tagged Da Gobbo's Demise antagonists as `Chaos Cultists` "since no Heretic Astartes
  legion is named in available sources". Default = **alias to `chaos`** if that broad row exists in
  `factions.json`, else leave unresolved (don't auto-alias to `heretic_astartes` — wrong grain).
- **AoS / Old-World factions to leave unresolved (no AoS bucket):** `Disciples of Tzeentch` (1, AoS),
  `Freeguild` (1, AoS), `Stormcast Eternals` (1, AoS), `Cities of Sigmar` (1, AoS), `Vampire Counts` (1,
  Old World), `The Empire` (1, Old World). All consistent with the Pass-8 default — no per-AoS-faction
  promotions; the setting-flag carries through.
- **Ork sub-clans to leave unresolved:** `Blood Axes` (1), `Snakebites` (1), `Freebooterz` (1). Default
  = leave unresolved (no per-Ork-clan rows promoted in prior passes; `orks` parent suffices).
- **Varangantua-specific orgs to leave unresolved:** `Har Dhrol` (1), `Valtteri Cartel` (1). Loop log
  batch 055 explicitly preserved both as "Varangantua-specific orgs, resolver-loop will canonicalise" —
  long-tail, no promotion-worthy evidence yet.
- **`Imperial Nobility` (freq 1).** Generic; leave unresolved.

**Locations (Phase 2).** The wave has **three large promotions** that anchor entire Crime + Necron
strands, plus a handful of mid-evidence Cadia-cluster-style sub-locations:

- **`Varangantua` (freq 10, unresolved).** The single highest-evidence unresolved surface form in the
  wave. Master Crime hive city; the Imperium's M42 noir setting. Default = **own row `varangantua`**
  (Hive city, Imperium-side, Sector Alecto). Surfaces across the entire Crime cluster (0539..0542,
  0545; plus inside Crime anthologies 0543/0544/0546). primaryLocation type = hive city; gx/gy per
  Sector Alecto convention if Phase 2 has coords for the sector.
- **`Alecto` (freq 8, unresolved).** The Sector containing Varangantua. Default = **own row `alecto`**
  (Sector grain, distinct from the city). Phase 2 judgment whether to link Varangantua → Alecto as a
  parent reference (if nested location refs are supported). If `sectors.json` is the right home rather
  than `locations.json`, Phase 2 adds it there.
- **`Antikef` (freq 3, unresolved).** Necron crownworld in the Twice-Dead King trilogy + omnibus
  (0551/0552/0553). Default = **own row `antikef`** (Necron crownworld). Companion to `Sedh` below.
- **`Anaxian Line` (freq 2, unresolved).** Strategic line / region from Iron Kingdom (0532) + Hand of
  Abaddon (0535). Default = **own row `anaxian_line`** (region grain).
- **`Hive Blackbracken` (freq 2, unresolved).** Hive city from King of Pigs (0521) + Resting Places
  (0526, anthology containing King of Pigs). Default = **own row `hive_blackbracken`** (Hive city).
- **`Sedh` (freq 2, unresolved).** Necron-related world adjacent to Antikef in the Twice-Dead King
  cluster (0551, 0553). Default = **own row `sedh`** (companion to Antikef).
- **`Shyish` (freq 2, unresolved).** AoS Realm of Death surfacing in *The Accursed* (0517, anthology
  with one AoS story) + *Gothgul Hollow* (0519, AoS novel — both flagged `setting->age_of_sigmar`).
  Default = **leave unresolved** (same call as Pass 8 — resolver doesn't act on setting; the
  `setting->age_of_sigmar` flag carries through to the audit cockpit advisory). Same call for the
  freq-1 AoS feature `Mhurghast` (also Gothgul Hollow).

Lore-iconic freq-1 candidates (Phase 2's discretion):

- **`Ullanor` (1) — direct.** Already resolves direct → `ullanor`. No action.
- **`Armageddon` (1) — direct.** Already resolves direct → `armageddon`. No action.
- **`Fenris` (1) — direct.** Already resolves direct → `fenris`. No action.
- **`Terra` (4) — direct.** No action.
- **`Imperial Palace` (1).** Sub-location of Terra; surface in Lord of the Fallen (0562). Plausible new
  row `imperial_palace` (Terra sub-locale) or alias to `terra`.
- **`Segmentum Solar` (1) + `Ultima Segmentum` (1).** Segmentum-grain regions. Plausible promotions if
  Phase 2 wants segmentum-level rows; else leave unresolved.
- **`Ghoul Stars` (1).** Region surface in Severed (0564). Lore-iconic frontier zone.
- **`Calignius` (1)** + **`Blood-Rock Peaks` (1)** — Black-Eyed Saint (0525, AoS-flagged); AoS sub-locales,
  default leave unresolved consistent with Shyish call.
- **`Polaris` (1)** + **`Steelmound` (1)** + **`Nearsteel` (1)**: Varangantua sub-districts (Grim Repast
  / Flesh and Steel). Plausible sub-location rows if Phase 2 supports nested location grain under
  Varangantua; else leave unresolved.
- **`Drachenfels` (1)** + **`Altdorf` (1)** + **`The Old World` (1)** — Warhammer Fantasy locales from
  the Genevieve omnibus (0511). Out-of-domain (`setting->warhammer_fantasy` flag); default = leave
  unresolved (no Warhammer Fantasy bucket; resolver doesn't act on setting).
- **`Thorsarbour` (1)** — Bookkeeper's Skull agri-belt farmstead; long-tail.
- **`Vorganthian` (1)** — Auric Gods setting; low_confidence:factions book; default leave unresolved.
- **`Doahht` (1)** — Severed setting; possibly promote as Sautekh-cluster world; Phase 2 judgment.
- **`Kamidar` (1)** — Iron Kingdom setting (Knight world); lore-iconic.
- **`Gathalamor` (1)** — Gates of Bones setting; lore-iconic Dark Imperium world.
- **`The Spoil` (1)** — King of the Spoil setting; sub-region of Varangantua.
- **`Gabal` (1)** — Ghazghkull: Warlord of Warlords setting.
- **`Velua` (1)** — Martyr's Tomb setting.
- **`Srinagar` (1)** — Throne of Light setting.
- **`Machorta Sound` (1)** — Avenging Son setting.
- **`Ghereppan` (1)** — Magister and the Martyr setting (Urdesh sub-locale).
- **`Golden Chain` (1)** — Martyr's Tomb setting.
- **`Gothghul Hollow` (1)** — Tales of Mhurghast #1 setting; `data_conflict:title` flag (canonical
  spelling has two h's). AoS-flagged on the book (0519).
- **`Rotauri` (1)** — Prisoners of Waaagh setting (0565).

**Vessel watch (none high-evidence in this wave).** No freq ≥ 2 named ship surfaces. The
Baggit-and-Clodde duology has unnamed Imperial vessels; the Twice-Dead King trilogy's "armada of the
Imperium" stayed nameless per loop log; Sea of Souls is a confined-ship piece but the ship isn't named
in §3. No vessel promotions this wave.

**Characters (Phase 3).** The 7a case (Agusto Zidarov consolidation) + the 7b spines are the substance.
Already `direct` (no work): `Roboute Guilliman`, `Belisarius Cawl`, `Abaddon the Despoiler`, `Cypher`,
`Logan Grimnar`, `Saint Sabbat`. Every **new** character's `primaryFactionId` must point at the
post-Phase-1 faction set (runbook §5) — so Phase 3 reads the freshly-committed Phase-1 factions.json
before adding any rows that may lean on `ogryns` / `sautekh_dynasty` / `adeptus_administratum` if Phase
1 promotes them. The fallbacks (`astra_militarum` / `necrons` / `imperium`-or-empty) are always safe.

Lore-iconic freq-1 candidates (Phase 3's discretion):

- **`Szarekh` (1).** Necron Silent King; *The Silent King* (0536). Lore-iconic Necron primarch-tier
  figure. Plausible promotion (primaryFactionId `necrons`).
- **`Nemesor Zahndrekh` (1) + `Vargard Obyron` (1).** Sautekh notables from Severed (0564). Lore-iconic
  Necron duo (Zahndrekh — eccentric Necron Lord still fighting an Imperial-era war; Obyron — his
  loyal Vargard). primaryFactionId `necrons`; if Phase 1 promotes `sautekh_dynasty`, that's the
  finer-grain pick.
- **`Trajann Valoris` (1).** Captain-General of the Adeptus Custodes; *Auric Gods* (0563). Lore-iconic.
  primaryFactionId `custodes`.
- **`Kor Phaeron` (1).** Word Bearers Master of the Faith / Erebus's peer; *Throne of Light* (0531).
  Lore-iconic Heresy-era Chaos lord. primaryFactionId `word_bearers` (exists, direct §3).
- **`Tenebrus` (1).** Recurring Hand of Abaddon antagonist (Sorcerer). primaryFactionId `chaos`-side
  fallback or `black_legion`.
- **`Cartovandis` (1) + `Meroved` (1) + `Ursula Gedd` (1).** Auric Gods Custodes cast. primaryFactionId
  `custodes`.
- **`Iota-11` (1).** Sister of Silence (No Peace Among Stars anthology 0537). primaryFactionId
  `talons_of_the_emperor` (exists, Pass-8 promotion) or `sisters_of_silence` if that exists.
- **`Rho-1 Lux` (1).** Tech-priest in Flesh and Steel. primaryFactionId `mechanicus` (exists).
- **`Symeon Noctis` (1) + `Quillon Drask` (1).** Varangantua probators. primaryFactionId
  `adeptus_arbites` (exists).
- **`Rudgard Howe` (1).** Enforcer cadet, Bookkeeper's Skull. primaryFactionId `adeptus_arbites` (Pass-1
  Enforcer convention; or own grain if Phase 1 promotes `enforcers`).
- **`Sister Isobel` (1).** Sea of Souls Sister. primaryFactionId `sisters_of_battle`.
- **`Falx` (1).** Ordo Xenos inquisitor in *Ghazghkull: Prophet of the Waaagh!* (0558); loop log batch
  056 explicitly tagged `Inquisition` + `Ordo Xenos` primary for him. primaryFactionId `ordo_xenos`
  (exists, direct §3) or `inquisition` parent.
- **`Makari` (1).** Ghazghkull's grot banner-bearer; lore-iconic. primaryFactionId `orks`.
- **`Vitrian Messinius` (1) + `VanLeskus` (1).** Dawn of Fire opener POVs (Avenging Son 0528).
  primaryFactionId `ultramarines` (exists) for Messinius; VanLeskus is Astra-Militarum-side per loop
  log → `astra_militarum`.
- **`Achallor` (1).** Gates of Bones character. Phase 3 judgment.
- **`Iron Queen Orlah` (1).** Iron Kingdom Knight queen. primaryFactionId `imperial_knights` (exists,
  direct §3).
- **`Tharador Yheng` (1) + `Magda Kesh` (1) + `Graeyl Herek` (1).** Hand of Abaddon cast (see 7b note).
- **`Canoness Irinya` (1) + `Gaheris` (1) + `Katla Helvintr` (1).** Martyr's Tomb cast (see 7b note).
- **`Kirian Malenko` (1).** Once a Killer (0546) title character (per loop log).
- **`Anasta Malkorion` (1).** The Vintage Vyrkos vampire (AoS-flagged book); plausible leave unresolved
  given the `setting->age_of_sigmar` flag — same advisory pattern as the AoS-faction call.
- **`Aaric Gothghul` (1).** Gothgul Hollow protagonist (AoS-flagged); same call.
- **`Runar Skoldolfr` (1) + `Tiberius Grim` (1).** Black-Eyed Saint POVs (AoS-flagged); same call.
- **`Constant Drachenfels` (1) + `Detlef Sierck` (1) + `Genevieve Dieudonne` (1).** Vampire Genevieve
  omnibus (Warhammer Fantasy — `setting->warhammer_fantasy` flag); default = leave unresolved
  consistent with the AoS pattern (no Old-World bucket).
- **Ork grot/character names — `'Eadbasha`, `Bodgit`, `Brukka Bludspilla`, `Fingwit`, `Gitzit`,
  `Kaptin Bludhook`, `Redsnot`, `Slipbit`, `Slitta da Stabba`, `Da Red Gobbo`, `Setekh`.** All freq 1,
  Ork-strand grot/character names from the Gobbo novellas (0554..0557) + Ghazghkull duology + Prisoners
  of Waaagh. Loop log batch 056 explicitly preserved grot-naming convention as-is. Default = Phase 3
  judgment per character; most stay unresolved long-tail, `Da Red Gobbo` is lore-iconic enough to be a
  plausible Phase-3 add (primaryFactionId `orks`).
- **`Drazus Jate` (1).** Harrowmaster Alpha Legion supporting POV.
- **`Marcus van Veenan` (1).** Prisoners of Waaagh (0565) protagonist.
- **`Savriel Sabbriatti` (1).** Dredge Runners (0547) character.
- **`Solomon Akurra` — already 7b.**
- **`Melita Voronova` (1) + `Haska Jovanic` (1) + `Andreti Sorokin` (1) + `Udmil Terashova` (1).**
  Crime POVs (see 7b note).

### 7d. needs-decision candidates (expected: 0 hard blockers)

- **Out-of-domain swarm — Old World (Warhammer Fantasy) + AoS — batches 052/053.** The Newman *Vampire
  Genevieve* omnibus (0511) is **Warhammer Fantasy** (Old World), even further out-of-domain than AoS;
  the 052/053 Horror-eShort cluster mixes 40K horror with AoS shorts (Vintage, Aberration, Bird of
  Change, Gothgul Hollow, Somewhere Sister, Gnarled Bough, Black-Eyed Saint, plus mixed *Resting
  Places*). Pattern: **leave AoS- and Old-World-specific factions / locations / characters unresolved**
  per the Pass-8 7d default (no AoS bucket, no Old-World bucket, resolver doesn't act on setting). The
  per-book `setting->age_of_sigmar` / `setting->warhammer_fantasy` / `domain->mixed_w40k_aos` flags
  carry through to the audit cockpit as advisory. Advisory-only; not an apply-blocker. The 4 Genevieve
  omnibus constituents (Drachenfels / Genevieve Undead / Beasts in Velvet / Silver Nails) are not in
  book-roster (Old-World, not part of the 40K authority layer), so **no collection-gap edges** are
  expected for that omnibus.
- **`format->novella` / `format->short_story` data_conflict swarm — 14 books in batches 052/053.** All
  of W40K-0512/0513/0514/0515/0516/0520 flagged `format->novella` (Horror eShorts shipped as ~32–50pp
  pieces, not novels per Black Library); W40K-0521/0522/0523/0524 flagged `format->short_story`.
  Roster carries them as novels; override marks them as Horror shorts. **Advisory only** — resolver
  doesn't act on format. Phase 4 carries the flags through to the audit cockpit; not an apply-blocker.
  (Same `length_tier` / `format` gap pattern that the loop-log batch-053 `value_outside_vocabulary` note
  flagged as a candidate facet extension; not Phase-0's call.)
- **`format->omnibus` on W40K-0511 (*The Vampire Genevieve*) + W40K-0527 (*Unholy Tales of Horror & Woe
  From The Imperium*).** Both flagged: 0511 is the Genevieve Old-World omnibus (4 constituents,
  out-of-domain — see above); 0527 is an Imperial-Horror omnibus collecting *The Oubliette* /
  *Sepulturum* / *The Deacon of Wounds* / *The Bookkeeper's Skull* per loop-log batch 053. **The
  Bookkeeper's Skull is W40K-0518 in THIS wave** — so 0527 has at least one constituent in-roster
  (W40K-0518), and §5 shows `roster collection? no` for it. **Phase-4 collection-gap spot-check:** if
  book-roster confirms W40K-0518 is missing as a constituent of W40K-0527, add the constituent edge to
  `collection-gaps.json`. The other 3 constituents (Oubliette / Sepulturum / Deacon of Wounds) are
  Horror novels from earlier waves — Phase 4 should check book-roster for those slugs too. **Judgment
  call for Phase 4a; not a hard block.**
- **Twice-Dead King Omnibus constituent gap — W40K-0564 *Severed*.** §5 shows W40K-0553 with
  `roster collection? yes (2)` linking W40K-0551/0552. Per loop-log batch 056, the 2025 Twice-Dead King
  Omnibus actually bundles "Ruin + Reign + Severed + shorts". W40K-0564 *Severed* IS in this same wave
  (batch 057). **Phase-4 collection-gap spot-check:** verify book-roster, if W40K-0564 is missing as a
  constituent of W40K-0553, add the constituent edge to `collection-gaps.json` (matches Pass-7's pattern
  for the War-for-Armageddon Omnibus / Pass-6's Architect-of-Fate Omnibus). Range-aware forward-ref
  Guard (Brief 091) stays green because both 0553 and 0564 are within the cumulative `applyRange`
  001..057. **Judgment call for Phase 4a; not a hard block.**
- **Other 7 anthologies with `roster collection? no` — Phase-4 collection-gaps spot-check.** *The
  Accursed* (0517), *The Resting Places* (0526), *No Peace Among Stars* (0537), *No Good Men* (0539),
  *Broken City* (0543), *Sanction and Sin* (0544), *Once a Killer* (0546). Per loop-log:
  - *The Resting Places* (0526, batch 053) is an anthology aggregating constituents including *King of
    Pigs* (W40K-0521, in this wave) and *Pain Engine* (W40K-0524, in this wave). **Likely
    collection-gap.**
  - *No Good Men* (0539, batch 054) is the Warhammer Crime debut anthology — constituents are shorter
    Crime pieces, not in this wave's roster.
  - *Broken City* (0543) is a 7-story Crime anthology incl. Bleedout/Rath, Sanctioner/Wraight; *Sanction
    and Sin* (0544) is a 9-story Crime anthology (first BL anthology with four female authors); *Once a
    Killer* (0546) is an 8-story Crime anthology. Some constituents may match earlier-wave eShorts; most
    are short pieces unique to the anthology. **Phase 4 spot-checks book-roster** for each anthology
    and adds any missing constituent edges to `collection-gaps.json`. If no constituents match, the
    `roster collection? no` stays — audit-advisory only.
- **`W40K-0529 *The Gates of Bones* — title typo.** Canonical = *The Gate of Bones* (singular, per
  loop-log batch 053). Roster has the typo, override flagged `data_conflict:title->The Gate of Bones`.
  Advisory only; resolver doesn't act on title. Override slug stays as roster has it.
- **`W40K-0519 *Gothgul Hollow* — title typo.** Canonical = *Gothghul Hollow* (two h's, per loop-log
  batch 052). Override flagged `data_conflict:title->gothghul-hollow`. Same advisory pattern.
- **`W40K-0547 *Dredge Runners* — format conflict (audio_drama).** Roster says novella; lore-correct =
  Black Library 2020 full-cast audio drama (~1h). Override sets `facetIds format=audio_drama +
  length_tier=novella` to match the actual artefact per loop-log batch 055. **Phase 4 check:** the
  original facet-catalog list (per loop-log batch 053 note) includes
  `format=book/audiobook/animation/live_action/audio_drama/podcast` — so `audio_drama` should be a
  known facet and apply cleanly. If Phase 4a discovers it unknown, **strip per 074/076 convention**
  (do not silently add to `facet-catalog.json` — that's a `## Needs decision` stop). Not expected to
  trigger.
- **`W40K-0556 *Long Live Da Red Gobbo* + W40K-0557 *Da Red Gobbo's Last Stand* — author data_conflict.**
  Both have empty roster `authors[]`; override flags suggest Justin Woolley (0556) and Andi Ewington
  (0557). Advisory only — resolver doesn't act on author attribution. Phase 4 carries the flags
  through; not an apply-blocker.
- **`W40K-0565 *Prisoners of Waaagh!* — author spelling typo.** Roster has "Justin Wooley" (one L);
  Black Library / Goodreads canonical = "Woolley" (two L). Loop log batch 057 explicitly noted this is
  informational only (no override field for author). Advisory; not a resolver action.
- **`low_confidence:factions` cluster — 5 books.** *The Accursed* (0517), *The Bookkeeper's Skull*
  (0518), *The Iron Kingdom* (0532), *Sea of Souls* (0534), *Auric Gods* (0563). Advisory — Phase 1
  takes the override faction list as-is; the flag is preserved for the audit cockpit. Concentration
  matches the loop log's pattern: confined-ship pieces (Sea of Souls), enforcer-edge cases (Bookkeeper's
  Skull → Enforcers), inferred-Chaos-sub (Iron Kingdom → Black Legion), and recent low-coverage Custodes
  novella (Auric Gods).
- **`low_confidence:characters` swarm — 8 books, mostly Horror eShorts.** *The Vintage* (0512), *The
  Isenbrach Horror* (0513), *Aberration* (0514), *Blood Drinker* (0515), *Bird of Change* (0516), *The
  Stacks* (0520), plus the Horror-cluster patterns. Loop log batch 052 explicitly noted "names not in
  coverage" for several of these. Advisory only — the empty / short character lists are accurate to
  what's nameable from public sources.
- **`low_confidence:locations` on W40K-0513 *The Isenbrach Horror*.** Single book; advisory.
- **`value_outside_vocabulary:facetIds` (none in this wave).** The §6 scan shows no `facetIds` flagged
  as out-of-vocabulary in any override file. The audio_drama call (0547) above is the only
  facet-relevant data_conflict; that value should be known (see above). If Phase 4a discovers any
  unknown facetIds during apply, the 074/076 convention holds: strip the unknown facetIds; do **not**
  silently add to `facet-catalog.json` (that's a `## Needs decision` stop).
- **Forward-reference collection edges when re-applying 001..051.** The Pass-6 / Pass-7 / Pass-8
  collection edges added to `collection-gaps.json` (Architect of Fate W40K-0286, War for Armageddon
  Omnibus W40K-0307, Pass-7 / Pass-8 additions) re-trigger when their host batches are re-applied. The
  range-aware forward-ref Guard (Brief 091) stays green because all constituents are within the
  cumulative `applyRange` 001..057. Phase 4a notes this in the counts-digest; no Phase-0 action.
- **Cross-axis surface-form conflicts** — **none in this wave** per §4. Pass 8 had 3 (Iyanden /
  Saim-Hann / Ziasuthra, all Aeldari faction+location); Pass 9 is clean on that front. Notable since
  the Severed cast surfaces `Setekh` (character, freq 1) which superficially looks Necron-place-like —
  but it's a personal name, not a location, no cross-axis collision.
- **Cumulative milestone — final W40K wave.** Per loop-log batch 057 milestone note: "cumulativeBefore=
  560 + slice=5 reaches 565/565 W40K. Loop helper should now flip into HH domain on next run; no
  Loop-Complete yet (HH still pending)." Pass-9 Phase 4 will be the **last W40K-only apply** before
  the SSOT loop pivots to Horus Heresy. No Phase-0 action — listed only as orientation so Phase 4b's
  impl report can flag the milestone.

The per-axis promotion extents (7c), the 7a Zidarov identity call, and the 7b spine identifications
are in-phase **judgments**, justified in each phase report — none escalates to a hard block under
current evidence.
