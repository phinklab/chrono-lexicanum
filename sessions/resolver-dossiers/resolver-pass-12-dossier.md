# Resolver-Pass 12 — Phase-0 Dossier (ssot-hh-009..014 / HH-0081..HH-0140)

> Deterministic cross-axis context for the three axis-phases (Factions / Locations / Characters) + the
> Phase-4 integration. **Sections 2–6 are the mechanical output** of
> `scripts/aggregate-surface-forms.ts --config scripts/resolver-pass.config.json` (read-only, idempotent —
> re-running on the committed override files + seed-data yields byte-identical output). **Section 7 is the
> only LLM-synthesized part** (cross-batch alias-consolidation + needs-decision candidates; this pass is
> dominated by the Black-Library *Primarchs* series + a long short-story / novella tail, so the section
> is heavy on Primarch-birthworld promotions, two new Calth-Underworld character rows, and a single
> Cross-Era character alias the Pass-11 anchor chain didn't yet catch). Phases 1–4 read THIS file, not
> the 6 override files or the loop-log. Brief-free pass (Brief 094 lean contract); the operative spec is
> [`sessions/resolver-pass-runbook.md`](../resolver-pass-runbook.md) + the per-pass config — no architect
> brief is read to run a phase.

## 1. Scope header

- **Wave:** `ssot-hh-009..014` (6 loop batches, 10 books × 6 = **60 books** — the Black-Library
  *Primarchs* monograph series + novella/short-story bridge, picking up directly after the Pass-11 wave
  of 60 books at HH-0021..HH-0080). Wave size confirmed at the loop-helper after Pass-11 settled cleanly
  (works 645→705, no Guard misfires on this wave's batches).
- **IDs:** `HH-0081..HH-0140` (60 books). Composition is markedly different from Pass-11's mid-HH main
  arc:
  - **ssot-hh-009 / HH-0081..HH-0090** = the first nine *Primarchs* monographs (Guilliman, Russ, Magnus,
    Perturabo, Lorgar, Fulgrim, Ferrus Manus, Jaghatai, Vulkan) + the *Sons of the Emperor* anthology.
  - **ssot-hh-010 / HH-0091..HH-0100** = the second nine *Primarchs* monographs (Corax, Angron, Konrad
    Curze, Lion El'Jonson, Alpharius, Mortarion, Rogal Dorn, Sanguinius) + the *Scions of the Emperor*
    and *Blood of the Emperor* anthologies. All 17 *Primarchs* novels are now in the layer.
  - **ssot-hh-011 / HH-0101..HH-0110** = short-story tail (*Grandfather's Gift*, *The Atonement of
    Fire*, *A Lesson in Iron*, *Ghost of Nuceria*, *The Passing of Angels*, *The Abyssal Edge*, *Mercy
    of the Dragon*, *The Will of the Legion*, *Ember of Extinction*) + *Valdor: Birth of the Imperium*
    (the Unification-Wars novel).
  - **ssot-hh-012 / HH-0111..HH-0120** = three character-specific novels (*Luther: First of the Fallen*,
    *Sigismund: The Eternal Crusader*, *Eidolon: The Auric Hammer*) + classic early-HH novellas
    (*Promethean Sun*, *Aurelian*, *Brotherhood of the Storm*, *The Reflection Crack'd*, *Feat of Iron*,
    *The Lion*, *The Serpent Beneath*).
  - **ssot-hh-013 / HH-0121..HH-0130** = ten classic HH novellas (*Corax: Soulforge*, *Scorched Earth*,
    *Tallarn: Executioner*, *Prince of Crows*, *The Crimson Fist*, *The Purge*, *Ravenlord*, *The
    Seventh Serpent*, *Tallarn: Ironclad*, *Cybernetica*).
  - **ssot-hh-014 / HH-0131..HH-0140** = the closing novella/anthology tail (*Wolf King*, *The
    Honoured*, *The Unburdened*, *Garro: Vow of Faith*, *Sons of the Forge*, *Dreadwing*, *Spear of
    Ultramar*, *Angron*, *The Imperial Truth*, *Visions of Heresy*).
- **Cumulative:** **140 HH books** in the HH authority layer after this pass (80 applied through Pass 11
  + 60 new in this wave). W40K side stays sealed at 565/565 books — out of scope for this pass.
- **Resolver baseline (pre-Pass-12 reference rows + aliases, emitted by the aggregator):** factions
  **188** rows / **69** aliases · locations **256** / **17** · characters **444** / **53**. The Pass-11
  deltas vs. the Pass-11 baseline (179/63 · 234/17 · 404/47) are visible: +9 faction rows / +6 faction
  aliases / +22 location rows / +0 location aliases / +40 character rows / +6 character aliases. Every
  Pass-11 anchor for the cases §7 forecasted is in place: **all 17 Primarchs have canonical rows**
  (Pass-10 added 11, Pass-11 added 3 — Sanguinius / Jaghatai Khan / Perturabo); the freq-2 Pass-11
  cross-batch character spines (Shiban Khan, Aeonid Thiel, Arkhan Land, Bjorn, Ka'Bandha, Lotara Sarrin,
  Sevatar, Shadrak Meduson, Tybalt Marr, Tylos Rubio, Zardu Layak, Euphrati Keeler, Oll Persson,
  Sigismund, Artellus Numeon) catch their Pass-12 re-surfaces direct in §3; the Pass-11 location
  Primarch/sub-locale promotions (Sol System, Vengeful Spirit, Lion's Gate Spaceport, Chondax, Molech,
  Pluto, Tallarn, Nuceria, Signus Prime, Pythos, Iydris, Nostramo, Chogoris, Armatura, Beta-Garmon,
  Palace sub-locales) likewise anchor everything that re-surfaces. The Pass-11 Cross-Era character
  aliases (Horus Lupercal / Corvus Corax / Lorgar Aurelian / Emperor of Mankind / Calas Typhon /
  Yesugei) all confirmed; the new alias work in §7a is the **one Cross-Era case Pass-11 didn't catch**
  (`Typhon` bare-form — Pass-11 aliased `Calas Typhon` only) + the typo cross-batch consolidation
  `Alexis Pollux ↔ Alexis Polux`.
- **Apply range Phase 4:** `hh 1..14` (config `aggregator.applyRange` = `{ domain: "hh", from: 1, to:
  14 }`). Idempotent delete-then-insert re-apply of `ssot-hh-001..008` (already applied at Pass 10 +
  Pass 11, no churn — the data has not changed) + first-time apply of `ssot-hh-009..014` (60 new
  books). Domain-aware Trias-Batch-Range tuples for the apply-side trio (`apply-override-dry.ts` /
  `test-resolver-coverage.ts` / `test-resolver-data-integrity.ts`) are appended with the **six new
  `{ domain: "hh", n: "009" }` .. `{ domain: "hh", n: "014" }` entries** alongside the existing
  W40K-001..057 + HH-001..008 set (runbook §3 Phase 4a + config `phase-4a-integration.trigger`).
- **Clusters (observed; config has no `clusters` field this pass, so §3's cluster column stays `?`):**
  - `ssot-hh-009` → **HH-0081..HH-0090 — the first nine Primarchs monographs + Sons of the Emperor
    anthology:** Annandale *Roboute Guilliman: Lord of Ultramar* (Ultramarines vs Orks on Thoas);
    Wraight *Leman Russ: The Great Wolf* (Russ vs the Lion on Dulan); McNeill *Magnus the Red: Master
    of Prospero* (Thousand Sons + Iron Warriors evacuation of Morningstar); Haley *Perturabo: The
    Hammer of Olympia* (origin/present split-timeline on Olympia, Hrud backdrop); Thorpe *Lorgar:
    Bearer of the Word* (pre-discovery Colchis origin, proto-cults `Covenant of Colchis` /
    `Brotherhood of Lorgar`); Reynolds *Fulgrim: The Palatine Phoenix* (Byzas compliance); Guymer
    *Ferrus Manus: The Gorgon of Medusa* (Gardinaal xeno-empire); Wraight *Jaghatai Khan: Warhawk of
    Chogoris* (episodic Crusade-years span, Nephilim xenos); Annandale *Vulkan: Lord of Drakes*
    (Salamanders origin, Nocturne, Taras Division); anthology *Sons of the Emperor* (9 constituent
    stories — **the only roster-collection anthology in the wave**, constituents HH-0101..HH-0106 +3,
    all in-range for the cumulative apply hh 1..14).
  - `ssot-hh-010` → **HH-0091..HH-0100 — the second nine Primarchs monographs + Scions/Blood
    anthologies:** Haley *Corax: Lord of Shadows* (Carinae Sodality / Zenith / Kiavahr); St. Martin
    *Angron: Slave of Nuceria* (Nuceria slave-pit pre-discovery); anthology *Scions of the Emperor*
    (no roster constituents); Haley *Konrad Curze: The Night Haunter* (Nostramo upbringing, frame
    novel with cw_mental_health / cw_abuse); Guymer *Lion El'Jonson: Lord of the First* (Khrave xenos
    in the Ghoul Stars); Brooks *Alpharius: Head of the Hydra* (Rangdan Xenocides framing);
    anthology *Blood of the Emperor* (no roster constituents); Annandale *Mortarion: The Pale King*
    (Galaspar, The Order tyranny); Thorpe *Rogal Dorn: The Emperor's Crusader* (Occluda Noctis
    beyond the Northern Major Warp Storm); Wraight *Sanguinius: The Great Angel* (locations[]
    deliberately empty — Sanguinius's homeworld off-limits in-book).
  - `ssot-hh-011` → **HH-0101..HH-0110 — short-story tail + Valdor novel:** Haley *Grandfather's
    Gift* (Mortarion in Nurgle's Garden, with Kau'gath); Annandale *The Atonement of Fire*
    (Ultramarines vs World Eaters at Diavanos, post-Ruinstorm); Guymer *A Lesson in Iron* (Ferrus
    Manus / Iron Hands, **not** Perturabo as the loop-log explicitly corrected); St. Martin *Ghost of
    Nuceria* (`low_confidence:factions` — Angron pre-Imperium, his slave army has no Legion); French
    *The Passing of Angels* (locations[] empty — no compliance world named); Dembski-Bowden *The
    Abyssal Edge* (Sevatar/Curze/Magnus at Zoah, archivist Orthos Ulatal frame); Kyme *Mercy of the
    Dragon* (Vulkan + Emperor on Nocturne); Clark *The Will of the Legion* (Imperial Fists / Rogal
    Dorn — author-attribution snag resolved in-favor of Imperial Fists per source); Easton *Ember of
    Extinction* (`data_conflict:title->Embers of Extinction`); Wraight *Valdor: Birth of the
    Imperium* (Unification Wars frame, Valdor / Kandawire / Amar Astarte trio, Mount Ararat).
  - `ssot-hh-012` → **HH-0111..HH-0120 — three character-novels + classic early-HH novellas:** Thorpe
    *Luther: First of the Fallen* (Caliban / Rock, The Fallen); French *Sigismund: The Eternal
    Crusader* (interview frame with Solomon Voss; Imperial Fists + World Eaters / Kharn); Collins
    *Eidolon: The Auric Hammer* (Tatricala); Kyme *Promethean Sun* (Exodite Eldar unnamed —
    locations[] empty); Dembski-Bowden *Aurelian* (Lorgar in the Eye of Terror with Daemon Ingethel,
    surface form `Lorgar Aurelian` — Pass-11 anchor catches this); Wraight *Brotherhood of the Storm*
    (Shiban / Yesugei / Ilya — three-POV White Scars ensemble); McNeill *The Reflection Crack'd*
    (Lucius / Slaanesh-cult — `Lucius` Pass-10 anchor catches this); Kyme *Feat of Iron* (Eldar on
    One-Five-Four Four); Thorpe *The Lion* (Death Guard antagonist, `Typhon` bare-form — see §7a
    Case B); Sanders *The Serpent Beneath* (Alpha-Legion-only at Tenebrae 9-50).
  - `ssot-hh-013` → **HH-0121..HH-0130 — ten classic HH novellas:** Thorpe *Corax: Soulforge*
    (Agapito / Constanix II); Kyme *Scorched Earth* (Salamanders / Urgall Depression); French
    *Tallarn: Executioner* (Tahirah POV); Dembski-Bowden *Prince of Crows* (Night Lords / Thramas
    Sector); French *The Crimson Fist* (Imperial Fists / Phall System); Reynolds *The Purge* (Word
    Bearers + Iron Warriors at Percepton Primus with Sor Talgron, Aecus Decimus, Jaruleth); Thorpe
    *Ravenlord* (Raven Guard / Carandiru / Deliverance / Lycaeus — see §7a Case C); McNeill *The
    Seventh Serpent* (Alpha Legion, Atesh Tarsa, Shadrak Meduson, Sharrowkyn); French *Tallarn:
    Ironclad* (Iron Warriors Hrend, cross-batch with Pass-11's *Tallarn* anthology); Sanders
    *Cybernetica* (Knights-Errant — Pass-11 alias catches this — at Mars with Dravian Klayde).
  - `ssot-hh-014` → **HH-0131..HH-0140 — closing novella/anthology tail:** Wraight *Wolf King*
    (Space Wolves / Alpha Legion / White Scars triangle, Bjorn / Alaxxes Nebula); Sanders *The
    Honoured* (Calth Underworld War, loyalist — Steloc Aethon POV, Kurtha Sedd antagonist); Annandale
    *The Unburdened* (Calth Underworld War, traitor companion — same character pair); Swallow *Garro:
    Vow of Faith* (Knights-Errant — Pass-11 alias — vs Officio Assassinorum / Alpha Legion shadow at
    Salvaguardia); Kyme *Sons of the Forge* (Salamanders, T'kell; `low_confidence:factions` —
    antagonist unspecified in coverage); Guymer *Dreadwing* (Lion / Redloss / Holguin, Caliban
    backdrop); Annandale *Spear of Ultramar* (Charchera System, Warsmith Khrossus); Dembski-Bowden
    *Angron* (`data_conflict:format->anthology` — two-author short-story compilation tagged at
    Angron/Kharn/Lorgar level); Goulding-ed. *The Imperial Truth* (`data_conflict:format->anthology`
    + `low_confidence:characters` — six-author 2013 Weekender limited); Merrett *Visions of Heresy*
    (`low_confidence:factions` — art/reference book, factions/locations/characters deliberately
    empty rather than aggregated to an "all eighteen Legions" pseudo-list).
- **Headline shape (from §3):** 39 distinct faction surface forms / 143 occ · 56 location / 75 occ ·
  81 character / 163 occ — substantially **lower volume per axis than Pass-11** (which had 46 / 262
  factions, 57 / 152 locations, 111 / 247 characters): same number of books, fewer Astartes-on-battle
  surface mentions because the Primarchs monographs are character-driven origin/biography texts and
  the novella tail tends to single-Legion ensembles. Cross-axis conflicts (§4) = **0** (the wave is
  clean on that front again). 4 anthology rows (§5; **only HH-0090 `Sons of the Emperor` has roster
  constituents** — 9 forward-refs HH-0101..HH-0106 + 3 more, **all in-range for the cumulative apply
  hh 1..14**; the other 3 anthologies — *Scions*, *Blood*, *Visions of Heresy* — have no roster
  constituents at all). **6** `data_conflict` / `low_confidence` flag rows (§6 — concentrated in the
  short-story tail of ssot-hh-011 and the novella/reference-book closer of ssot-hh-014).
- **Forward-ref Guard expectation (post-Brief-101 wired correctly per Pass-11 experience):** Pass 12
  expects the cleanest Guard outcome yet — the single roster-collection anthology HH-0090 has 9
  constituents (HH-0101..HH-0106 + 3) **all inside the cumulative apply range hh 1..14**, so:
  `out-of-range` count = **0**, `unknown-work` count = **0**. If either is non-zero, that's a Phase-4a
  `## Needs decision` stop. The Pass-11 baseline was `out-of-range=7` (Shadows of Treachery
  constituents outside hh 1..8); Pass 12 absorbs every roster-collection forward-ref the wave introduces.
- **Generated by** `scripts/aggregate-surface-forms.ts --config scripts/resolver-pass.config.json`
  from the 6 override files (ssot-hh-009..014, 60 books) + `book-roster.json` + the current
  `factions.json` / `locations.json` / `characters.json` + their alias tables.

## 2. Book table (60 entries)

| externalBookId | slug | title | format | author | year | batch | cluster | flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HH-0081 | `roboute-guilliman-lord-of-ultramar` | *Roboute Guilliman: Lord of Ultramar* | novel | David Annandale | 2016 | `ssot-hh-009` | `?` | — |
| HH-0082 | `leman-russ-the-great-wolf` | *Leman Russ: The Great Wolf* | novel | Chris Wraight | 2016 | `ssot-hh-009` | `?` | — |
| HH-0083 | `magnus-the-red-master-of-prospero` | *Magnus the Red: Master of Prospero* | novel | Graham McNeill | 2017 | `ssot-hh-009` | `?` | — |
| HH-0084 | `perturabo-the-hammer-of-olympia` | *Perturabo: The Hammer of Olympia* | novel | Guy Haley | 2017 | `ssot-hh-009` | `?` | — |
| HH-0085 | `lorgar-bearer-of-the-word` | *Lorgar: Bearer of the Word* | novel | Gav Thorpe | 2017 | `ssot-hh-009` | `?` | — |
| HH-0086 | `fulgrim-the-palatine-phoenix` | *Fulgrim: The Palatine Phoenix* | novel | Josh Reynolds | 2017 | `ssot-hh-009` | `?` | — |
| HH-0087 | `ferrus-manus-the-gorgon-of-medusa` | *Ferrus Manus: The Gorgon of Medusa* | novel | David Guymer | 2018 | `ssot-hh-009` | `?` | — |
| HH-0088 | `jaghatai-khan-warhawk-of-chogoris` | *Jaghatai Khan: Warhawk of Chogoris* | novel | Chris Wraight | 2018 | `ssot-hh-009` | `?` | — |
| HH-0089 | `vulkan-lord-of-drakes` | *Vulkan: Lord of Drakes* | novel | David Annandale | 2018 | `ssot-hh-009` | `?` | — |
| HH-0090 | `sons-of-the-emperor` | *Sons of the Emperor* | anthology | ? | 2018 | `ssot-hh-009` | `?` | — |
| HH-0091 | `corax-lord-of-shadows` | *Corax: Lord of Shadows* | novel | Guy Haley | 2018 | `ssot-hh-010` | `?` | — |
| HH-0092 | `angron-slave-of-nuceria` | *Angron: Slave of Nuceria* | novel | Ian St. Martin | 2019 | `ssot-hh-010` | `?` | — |
| HH-0093 | `scions-of-the-emperor` | *Scions of the Emperor* | anthology | ? | 2019 | `ssot-hh-010` | `?` | — |
| HH-0094 | `konrad-curze-the-night-haunter` | *Konrad Curze: The Night Haunter* | novel | Guy Haley | 2019 | `ssot-hh-010` | `?` | — |
| HH-0095 | `lion-eljonson-lord-of-the-first` | *Lion El'Jonson: Lord of the First* | novel | David Guymer | 2020 | `ssot-hh-010` | `?` | — |
| HH-0096 | `alpharius-head-of-the-hydra` | *Alpharius: Head of the Hydra* | novel | Mike Brooks | 2021 | `ssot-hh-010` | `?` | — |
| HH-0097 | `blood-of-the-emperor` | *Blood of the Emperor* | anthology | ? | 2021 | `ssot-hh-010` | `?` | — |
| HH-0098 | `mortarion-the-pale-king` | *Mortarion: The Pale King* | novel | David Annandale | 2022 | `ssot-hh-010` | `?` | — |
| HH-0099 | `rogal-dorn-the-emperors-crusader` | *Rogal Dorn: The Emperor's Crusader* | novel | Gav Thorpe | 2022 | `ssot-hh-010` | `?` | — |
| HH-0100 | `sanguinius-the-great-angel` | *Sanguinius: The Great Angel* | novel | Chris Wraight | 2022 | `ssot-hh-010` | `?` | — |
| HH-0101 | `grandfathers-gift` | *Grandfather's Gift* | short_story | Guy Haley | 2017 | `ssot-hh-011` | `?` | — |
| HH-0102 | `the-atonement-of-fire` | *The Atonement of Fire* | short_story | David Annandale | 2018 | `ssot-hh-011` | `?` | — |
| HH-0103 | `a-lesson-in-iron` | *A Lesson in Iron* | short_story | David Guymer | 2017 | `ssot-hh-011` | `?` | — |
| HH-0104 | `ghost-of-nuceria` | *Ghost of Nuceria* | short_story | Ian St. Martin | 2019 | `ssot-hh-011` | `?` | `low_confidence:factions` |
| HH-0105 | `the-passing-of-angels` | *The Passing of Angels* | short_story | John French | 2019 | `ssot-hh-011` | `?` | — |
| HH-0106 | `the-abyssal-edge` | *The Abyssal Edge* | short_story | Aaron Dembski-Bowden | 2019 | `ssot-hh-011` | `?` | — |
| HH-0107 | `mercy-of-the-dragon` | *Mercy of the Dragon* | short_story | Nick Kyme | 2019 | `ssot-hh-011` | `?` | — |
| HH-0108 | `the-will-of-the-legion` | *The Will of the Legion* | short_story | Andy Clark | 2020 | `ssot-hh-011` | `?` | — |
| HH-0109 | `ember-of-extinction` | *Ember of Extinction* | short_story | Brandon Easton | 2020 | `ssot-hh-011` | `?` | `data_conflict:title->Embers of Extinction` |
| HH-0110 | `valdor-birth-of-the-imperium` | *Valdor: Birth of the Imperium* | novel | Chris Wraight | 2019 | `ssot-hh-011` | `?` | — |
| HH-0111 | `luther-first-of-the-fallen` | *Luther: First of the Fallen* | novel | Gav Thorpe | 2021 | `ssot-hh-012` | `?` | — |
| HH-0112 | `sigismund-the-eternal-crusader` | *Sigismund: The Eternal Crusader* | novel | John French | 2022 | `ssot-hh-012` | `?` | — |
| HH-0113 | `eidolon-the-auric-hammer` | *Eidolon: The Auric Hammer* | novel | Marc Collins | 2024 | `ssot-hh-012` | `?` | — |
| HH-0114 | `promethean-sun` | *Promethean Sun* | novella | Nick Kyme | 2011 | `ssot-hh-012` | `?` | — |
| HH-0115 | `aurelian` | *Aurelian* | novella | Aaron Dembski-Bowden | 2011 | `ssot-hh-012` | `?` | — |
| HH-0116 | `brotherhood-of-the-storm` | *Brotherhood of the Storm* | novella | Chris Wraight | 2012 | `ssot-hh-012` | `?` | — |
| HH-0117 | `the-reflection-crackd` | *The Reflection Crack'd* | novella | Graham McNeill | 2012 | `ssot-hh-012` | `?` | — |
| HH-0118 | `feat-of-iron` | *Feat of Iron* | novella | Nick Kyme | 2012 | `ssot-hh-012` | `?` | — |
| HH-0119 | `the-lion` | *The Lion* | novella | Gav Thorpe | 2012 | `ssot-hh-012` | `?` | — |
| HH-0120 | `the-serpent-beneath` | *The Serpent Beneath* | novella | Rob Sanders | 2012 | `ssot-hh-012` | `?` | — |
| HH-0121 | `corax-soulforge` | *Corax: Soulforge* | novella | Gav Thorpe | 2013 | `ssot-hh-013` | `?` | — |
| HH-0122 | `scorched-earth` | *Scorched Earth* | novella | Nick Kyme | 2013 | `ssot-hh-013` | `?` | — |
| HH-0123 | `tallarn-executioner` | *Tallarn: Executioner* | novella | John French | 2013 | `ssot-hh-013` | `?` | — |
| HH-0124 | `prince-of-crows` | *Prince of Crows* | novella | Aaron Dembski-Bowden | 2014 | `ssot-hh-013` | `?` | — |
| HH-0125 | `the-crimson-fist` | *The Crimson Fist* | novella | John French | 2014 | `ssot-hh-013` | `?` | — |
| HH-0126 | `the-purge` | *The Purge* | novella | Anthony Reynolds | 2014 | `ssot-hh-013` | `?` | — |
| HH-0127 | `ravenlord` | *Ravenlord* | novella | Gav Thorpe | 2014 | `ssot-hh-013` | `?` | — |
| HH-0128 | `the-seventh-serpent` | *The Seventh Serpent* | novella | Graham McNeill | 2014 | `ssot-hh-013` | `?` | — |
| HH-0129 | `tallarn-ironclad` | *Tallarn: Ironclad* | novella | John French | 2015 | `ssot-hh-013` | `?` | — |
| HH-0130 | `cybernetica` | *Cybernetica* | novella | Rob Sanders | 2015 | `ssot-hh-013` | `?` | — |
| HH-0131 | `wolf-king` | *Wolf King* | novella | Chris Wraight | 2015 | `ssot-hh-014` | `?` | — |
| HH-0132 | `the-honoured` | *The Honoured* | novella | Rob Sanders | 2015 | `ssot-hh-014` | `?` | — |
| HH-0133 | `the-unburdened` | *The Unburdened* | novella | David Annandale | 2015 | `ssot-hh-014` | `?` | — |
| HH-0134 | `garro-vow-of-faith` | *Garro: Vow of Faith* | novella | James Swallow | 2015 | `ssot-hh-014` | `?` | — |
| HH-0135 | `sons-of-the-forge` | *Sons of the Forge* | novella | Nick Kyme | 2016 | `ssot-hh-014` | `?` | `low_confidence:factions` |
| HH-0136 | `dreadwing` | *Dreadwing* | novella | David Guymer | 2018 | `ssot-hh-014` | `?` | — |
| HH-0137 | `spear-of-ultramar` | *Spear of Ultramar* | novella | David Annandale | 2018 | `ssot-hh-014` | `?` | — |
| HH-0138 | `angron` | *Angron* | collection | ? | 2013 | `ssot-hh-014` | `?` | `data_conflict:format->anthology` |
| HH-0139 | `the-imperial-truth` | *The Imperial Truth* | collection | ? | 2013 | `ssot-hh-014` | `?` | `data_conflict:format->anthology`; `low_confidence:characters` |
| HH-0140 | `visions-of-heresy` | *Visions of Heresy* | anthology | Alan Merrett | 2013 | `ssot-hh-014` | `?` | `low_confidence:factions` |

## 3. Surface-form aggregate (sorted: freq desc, name asc)

### Factions (39 distinct surface forms, 143 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Dark Angels | 10 | HH-0082, HH-0090, HH-0093 | direct | dark_angels | `?` |
| Iron Warriors | 9 | HH-0083, HH-0084, HH-0090 | direct | iron_warriors | `?` |
| Death Guard | 8 | HH-0093, HH-0097, HH-0098 | direct | death_guard | `?` |
| Salamanders | 8 | HH-0089, HH-0090, HH-0107 | direct | salamanders | `?` |
| Ultramarines | 8 | HH-0081, HH-0087, HH-0093 | direct | ultramarines | `?` |
| Alpha Legion | 7 | HH-0093, HH-0096, HH-0097 | direct | alpha_legion | `?` |
| Imperial Fists | 7 | HH-0093, HH-0097, HH-0099 | direct | imperial_fists | `?` |
| Iron Hands | 7 | HH-0087, HH-0093, HH-0103 | direct | iron_hands | `?` |
| Word Bearers | 7 | HH-0115, HH-0121, HH-0122 | direct | word_bearers | `?` |
| Emperor's Children | 6 | HH-0086, HH-0087, HH-0113 | direct | emperors_children | `?` |
| Night Lords | 6 | HH-0090, HH-0093, HH-0094 | direct | night_lords | `?` |
| World Eaters | 6 | HH-0090, HH-0092, HH-0102 | direct | world_eaters | `?` |
| Blood Angels | 5 | HH-0090, HH-0093, HH-0100 | direct | blood_angels | `?` |
| Orks | 5 | HH-0081, HH-0088, HH-0089 | direct | orks | `?` |
| Raven Guard | 5 | HH-0091, HH-0121, HH-0127 | direct | raven_guard | `?` |
| Thousand Sons | 4 | HH-0083, HH-0090, HH-0097 | direct | thousand_sons | `?` |
| White Scars | 4 | HH-0088, HH-0093, HH-0116 | direct | white_scars | `?` |
| Imperial Army | 3 | HH-0091, HH-0123, HH-0129 | alias | astra_militarum | `?` |
| Sons of Horus | 3 | HH-0090, HH-0115, HH-0127 | direct | sons_of_horus | `?` |
| Adeptus Custodes | 2 | HH-0110, HH-0139 | direct | custodes | `?` |
| Eldar | 2 | HH-0114, HH-0118 | alias | eldar | `?` |
| Knights-Errant | 2 | HH-0130, HH-0134 | alias | knights_errant | `?` |
| Mechanicum | 2 | HH-0121, HH-0130 | alias | mechanicus | `?` |
| Space Wolves | 2 | HH-0082, HH-0131 | direct | space_wolves | `?` |
| Adeptus Astartes | 1 | HH-0110 | direct | adeptus_astartes | `?` |
| Brotherhood of Lorgar | 1 | HH-0085 | unresolved | — | `?` |
| Carinae Sodality | 1 | HH-0091 | unresolved | — | `?` |
| Covenant of Colchis | 1 | HH-0085 | unresolved | — | `?` |
| Daemons of Nurgle | 1 | HH-0101 | unresolved | — | `?` |
| Heretic Astartes | 1 | HH-0113 | direct | heretic_astartes | `?` |
| Hrud | 1 | HH-0084 | unresolved | — | `?` |
| Imperium | 1 | HH-0104 | alias | imperium | `?` |
| Khrave | 1 | HH-0095 | unresolved | — | `?` |
| Nephilim | 1 | HH-0088 | unresolved | — | `?` |
| Officio Assassinorum | 1 | HH-0134 | direct | officio_assassinorum | `?` |
| Rangdan | 1 | HH-0096 | unresolved | — | `?` |
| The Fallen | 1 | HH-0111 | alias | fallen_angels | `?` |
| The Order | 1 | HH-0098 | unresolved | — | `?` |
| Thunder Warriors | 1 | HH-0110 | direct | thunder_warriors | `?` |

### Locations (56 distinct surface forms, 75 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Terra | 7 | HH-0093, HH-0096, HH-0097 | direct | terra | `?` |
| Nuceria | 4 | HH-0092, HH-0104, HH-0138 | direct | nuceria | `?` |
| Nocturne | 3 | HH-0089, HH-0107, HH-0135 | direct | nocturne | `?` |
| Caliban | 2 | HH-0111, HH-0136 | direct | caliban | `?` |
| Calth | 2 | HH-0132, HH-0133 | direct | calth | `?` |
| Chondax | 2 | HH-0116, HH-0120 | direct | chondax | `?` |
| Galaspar | 2 | HH-0093, HH-0098 | unresolved | — | `?` |
| Isstvan V | 2 | HH-0115, HH-0122 | alias | istvaan_v | `?` |
| Nostramo | 2 | HH-0094, HH-0124 | direct | nostramo | `?` |
| Prospero | 2 | HH-0097, HH-0131 | direct | prospero | `?` |
| Tallarn | 2 | HH-0123, HH-0129 | direct | tallarn | `?` |
| Alaxxes Nebula | 1 | HH-0131 | unresolved | — | `?` |
| Barbarus | 1 | HH-0098 | unresolved | — | `?` |
| Byzas | 1 | HH-0086 | unresolved | — | `?` |
| Carandiru | 1 | HH-0127 | unresolved | — | `?` |
| Carinae | 1 | HH-0091 | unresolved | — | `?` |
| Charchera System | 1 | HH-0137 | unresolved | — | `?` |
| Chogoris | 1 | HH-0088 | direct | chogoris | `?` |
| Colchis | 1 | HH-0085 | direct | colchis | `?` |
| Constanix II | 1 | HH-0121 | unresolved | — | `?` |
| Cthonia | 1 | HH-0097 | unresolved | — | `?` |
| Deliverance | 1 | HH-0127 | direct | deliverance | `?` |
| Desh'ea | 1 | HH-0138 | unresolved | — | `?` |
| Diavanos | 1 | HH-0102 | unresolved | — | `?` |
| Dulan | 1 | HH-0082 | unresolved | — | `?` |
| Eye of Terror | 1 | HH-0115 | direct | eye_of_terror | `?` |
| Fenris | 1 | HH-0097 | direct | fenris | `?` |
| Garden of Nurgle | 1 | HH-0101 | unresolved | — | `?` |
| Gardinaal | 1 | HH-0087 | unresolved | — | `?` |
| Ghoul Stars | 1 | HH-0095 | direct | ghoul_stars | `?` |
| Kiavahr | 1 | HH-0091 | unresolved | — | `?` |
| Lycaeus | 1 | HH-0127 | unresolved | — | `?` |
| Macragge | 1 | HH-0093 | direct | macragge | `?` |
| Mars | 1 | HH-0130 | direct | mars | `?` |
| Medusa | 1 | HH-0087 | direct | medusa | `?` |
| Monarchia | 1 | HH-0133 | direct | monarchia | `?` |
| Morningstar | 1 | HH-0083 | unresolved | — | `?` |
| Mount Ararat | 1 | HH-0110 | unresolved | — | `?` |
| Occluda Noctis | 1 | HH-0099 | unresolved | — | `?` |
| Olympia | 1 | HH-0084 | unresolved | — | `?` |
| One-Five-Four Four | 1 | HH-0118 | unresolved | — | `?` |
| Percepton Primus | 1 | HH-0126 | unresolved | — | `?` |
| Phall | 1 | HH-0109 | direct | phall | `?` |
| Phall System | 1 | HH-0125 | unresolved | — | `?` |
| Salvaguardia | 1 | HH-0134 | unresolved | — | `?` |
| Taras Division | 1 | HH-0089 | unresolved | — | `?` |
| Tatricala | 1 | HH-0113 | unresolved | — | `?` |
| Tenebrae 9-50 | 1 | HH-0120 | unresolved | — | `?` |
| The Rock | 1 | HH-0111 | direct | rock | `?` |
| Thoas | 1 | HH-0081 | unresolved | — | `?` |
| Thramas Sector | 1 | HH-0124 | unresolved | — | `?` |
| Ullanor | 1 | HH-0088 | direct | ullanor | `?` |
| Ultramar | 1 | HH-0126 | direct | ultramar | `?` |
| Urgall Depression | 1 | HH-0122 | unresolved | — | `?` |
| Zenith | 1 | HH-0091 | unresolved | — | `?` |
| Zoah | 1 | HH-0106 | unresolved | — | `?` |

### Characters (81 distinct surface forms, 163 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Lion El'Jonson | 9 | HH-0082, HH-0093, HH-0095 | direct | lion_el_jonson | `?` |
| Rogal Dorn | 8 | HH-0093, HH-0097, HH-0099 | direct | rogal_dorn | `?` |
| Sanguinius | 7 | HH-0088, HH-0090, HH-0093 | direct | sanguinius | `?` |
| Ferrus Manus | 6 | HH-0087, HH-0093, HH-0103 | direct | ferrus_manus | `?` |
| Angron | 5 | HH-0090, HH-0092, HH-0104 | direct | angron | `?` |
| Fulgrim | 5 | HH-0086, HH-0087, HH-0115 | direct | fulgrim | `?` |
| Horus | 5 | HH-0090, HH-0097, HH-0098 | direct | horus | `?` |
| Konrad Curze | 5 | HH-0090, HH-0093, HH-0094 | direct | konrad_curze | `?` |
| Magnus the Red | 5 | HH-0083, HH-0088, HH-0090 | direct | magnus_the_red | `?` |
| Mortarion | 5 | HH-0093, HH-0097, HH-0098 | direct | mortarion | `?` |
| Perturabo | 5 | HH-0083, HH-0084, HH-0109 | direct | perturabo | `?` |
| Roboute Guilliman | 5 | HH-0081, HH-0087, HH-0093 | direct | roboute_guilliman | `?` |
| Vulkan | 5 | HH-0089, HH-0090, HH-0107 | direct | vulkan | `?` |
| Alpharius | 4 | HH-0093, HH-0096, HH-0097 | direct | alpharius | `?` |
| Emperor of Mankind | 3 | HH-0104, HH-0107, HH-0110 | alias | the_emperor | `?` |
| Jaghatai Khan | 3 | HH-0088, HH-0093, HH-0116 | direct | jaghatai_khan | `?` |
| Leman Russ | 3 | HH-0082, HH-0097, HH-0131 | direct | leman_russ | `?` |
| Lorgar | 3 | HH-0085, HH-0126, HH-0138 | direct | lorgar | `?` |
| Corax | 2 | HH-0121, HH-0127 | direct | corax | `?` |
| Eidolon | 2 | HH-0113, HH-0117 | direct | eidolon | `?` |
| Kharn | 2 | HH-0112, HH-0138 | alias | kharn_the_betrayer | `?` |
| Kurtha Sedd | 2 | HH-0132, HH-0133 | unresolved | — | `?` |
| Malcador the Sigillite | 2 | HH-0130, HH-0134 | direct | malcador_the_sigillite | `?` |
| Omegon | 2 | HH-0096, HH-0120 | direct | omegon | `?` |
| Sevatar | 2 | HH-0106, HH-0124 | direct | sevatar | `?` |
| Steloc Aethon | 2 | HH-0132, HH-0133 | unresolved | — | `?` |
| Targutai Yesugei | 2 | HH-0088, HH-0116 | direct | targutai_yesugei | `?` |
| Aecus Decimus | 1 | HH-0126 | unresolved | — | `?` |
| Agapito | 1 | HH-0121 | unresolved | — | `?` |
| Akurduana | 1 | HH-0087 | unresolved | — | `?` |
| Alexis Pollux | 1 | HH-0109 | unresolved | — | `?` |
| Alexis Polux | 1 | HH-0125 | direct | alexis_polux | `?` |
| Amar Astarte | 1 | HH-0110 | unresolved | — | `?` |
| Atesh Tarsa | 1 | HH-0128 | unresolved | — | `?` |
| Bjorn | 1 | HH-0131 | direct | bjorn | `?` |
| Branne | 1 | HH-0121 | alias | branne_nev | `?` |
| Calliphone | 1 | HH-0084 | unresolved | — | `?` |
| Constantin Valdor | 1 | HH-0110 | direct | constantin_valdor | `?` |
| Corvus Corax | 1 | HH-0091 | alias | corax | `?` |
| Dantioch | 1 | HH-0084 | unresolved | — | `?` |
| Dravian Klayde | 1 | HH-0130 | unresolved | — | `?` |
| Durath | 1 | HH-0082 | unresolved | — | `?` |
| Euphrati Keeler | 1 | HH-0134 | direct | euphrati_keeler | `?` |
| Forrix | 1 | HH-0084 | direct | forrix | `?` |
| Haln | 1 | HH-0134 | unresolved | — | `?` |
| Hasik Khan | 1 | HH-0088 | unresolved | — | `?` |
| Holguin | 1 | HH-0136 | unresolved | — | `?` |
| Horus Lupercal | 1 | HH-0115 | alias | horus | `?` |
| Hrend | 1 | HH-0129 | unresolved | — | `?` |
| Ilya Ravallion | 1 | HH-0116 | unresolved | — | `?` |
| Ingethel | 1 | HH-0115 | unresolved | — | `?` |
| Jaruleth | 1 | HH-0126 | unresolved | — | `?` |
| Jorin Bloodhowl | 1 | HH-0082 | unresolved | — | `?` |
| Kandawire | 1 | HH-0110 | unresolved | — | `?` |
| Kau'gath | 1 | HH-0101 | unresolved | — | `?` |
| Kell | 1 | HH-0134 | unresolved | — | `?` |
| Khrossus | 1 | HH-0137 | unresolved | — | `?` |
| Kor Phaeron | 1 | HH-0085 | direct | kor_phaeron | `?` |
| Lorgar Aurelian | 1 | HH-0115 | alias | lorgar | `?` |
| Lucius | 1 | HH-0117 | alias | lucius_the_eternal | `?` |
| Luther | 1 | HH-0111 | direct | luther | `?` |
| Moses Trurakk | 1 | HH-0087 | unresolved | — | `?` |
| Nairo | 1 | HH-0085 | unresolved | — | `?` |
| Nathaniel Garro | 1 | HH-0134 | direct | nathaniel_garro | `?` |
| Nemiel | 1 | HH-0119 | direct | nemiel | `?` |
| Nurgle | 1 | HH-0101 | unresolved | — | `?` |
| Orthos Ulatal | 1 | HH-0106 | unresolved | — | `?` |
| Ra'stan | 1 | HH-0122 | unresolved | — | `?` |
| Redloss | 1 | HH-0136 | unresolved | — | `?` |
| Shadrak Meduson | 1 | HH-0128 | direct | shadrak_meduson | `?` |
| Sharrowkyn | 1 | HH-0128 | direct | sharrowkyn | `?` |
| Shiban Khan | 1 | HH-0116 | direct | shiban_khan | `?` |
| Sigismund | 1 | HH-0112 | direct | sigismund | `?` |
| Solomon Voss | 1 | HH-0112 | unresolved | — | `?` |
| Sor Talgron | 1 | HH-0126 | unresolved | — | `?` |
| T'kell | 1 | HH-0135 | unresolved | — | `?` |
| Tahirah | 1 | HH-0123 | unresolved | — | `?` |
| Typhon | 1 | HH-0119 | unresolved | — | `?` |
| Ulrach Branthan | 1 | HH-0128 | unresolved | — | `?` |
| Usabius | 1 | HH-0122 | unresolved | — | `?` |
| Xyrokles | 1 | HH-0093 | unresolved | — | `?` |

## 4. Cross-axis surface-form conflicts

| surface form | axes |
| --- | --- |
| (none) | — |

## 5. Omnibus / anthology scan

| externalBookId | title | format | roster collection? | known constituents |
| --- | --- | --- | --- | --- |
| HH-0090 | *Sons of the Emperor* | anthology | yes (9) | HH-0101, HH-0102, HH-0103, HH-0104, HH-0105, HH-0106, … (9 total) |
| HH-0093 | *Scions of the Emperor* | anthology | no | — |
| HH-0097 | *Blood of the Emperor* | anthology | no | — |
| HH-0140 | *Visions of Heresy* | anthology | no | — |

## 6. data_conflict flag scan

| externalBookId | title | flags |
| --- | --- | --- |
| HH-0104 | *Ghost of Nuceria* | `low_confidence:factions` |
| HH-0109 | *Ember of Extinction* | `data_conflict:title->Embers of Extinction` |
| HH-0135 | *Sons of the Forge* | `low_confidence:factions` |
| HH-0138 | *Angron* | `data_conflict:format->anthology` |
| HH-0139 | *The Imperial Truth* | `data_conflict:format->anthology`; `low_confidence:characters` |
| HH-0140 | *Visions of Heresy* | `low_confidence:factions` |

## 7. Cross-batch alias-consolidation + needs-decision candidates

> The only LLM-synthesized section. It flags (7a) Cross-Era / cross-form alias-consolidation cases the
> owning phase must collapse onto an existing canonical row (runbook §4) — this wave finds **one
> Cross-Era character alias** the Pass-11 anchor chain didn't catch (`Typhon` bare-form; Pass-11
> only aliased `Calas Typhon`), one typo-driven cross-batch character alias (`Alexis Pollux ↔
> alexis_polux`), and a location alt-name pair (`Lycaeus ↔ Deliverance`); (7b) the cross-batch
> character spines (only two this wave: the Calth-Underworld antagonist/loyalist pair Kurtha Sedd +
> Steloc Aethon); (7c) the freq-driven promotion shape per axis, dominated by the **Primarch-birthworld
> bloc** on the location axis (Olympia / Barbarus / Cthonia + Galaspar at freq 2) and a modest
> xenos-species + curated freq-1 supporting-cast set on the faction + character axes; (7d) genuine
> needs-decision candidates (mostly grain calls — `Nurgle` as character vs faction, xenos-species
> promotion threshold, pre-Imperium proto-cult judgment). The Brief-091 forward-ref Guard concern is
> resolved (Brief 101); Pass-12 expects the cleanest Guard outcome yet (all roster-collection
> constituents in-range for hh 1..14). Everything below is grounded in §2–§6 + the Pass-11 alias /
> row anchors confirmed in §1 baseline.

### 7a. Cross-batch alias-consolidation cases (→ existing row + alias)

> Format: surface-forms · book-IDs · same entity? · recommendation. These are the cases where a naïve
> implementer would create **two** rows or invent a fresh row instead of aliasing onto an existing
> anchor. Per runbook §4: **one canonical identity = one canonical row; era-/form-specific surface
> forms live in `*-aliases.json`**.

**Factions (Phase 1):**

- **Case A — `Daemons of Nurgle` ↔ `daemons` (canonical, Pass-10-anchored).** `Daemons of Nurgle`
  (freq 1, HH-0101 *Grandfather's Gift*, unresolved) is the sub-faction-grain surface for the
  Nurgle-aligned Daemons. Default = **alias `Daemons of Nurgle → daemons`** in
  `faction-aliases.json` (parallel to the Pass-11 *Daemons of Khorne* discussion under runbook §4 —
  sub-faction-grain is not yet established in the resolver; flat alias to the parent for now).
  Phase-1 may instead promote `nurgle_daemons` if it wants the per-Power grain (consistent with the
  per-Titan-Legion grain Pass-11 took on `legio_ignatum` etc.) — judgment call, the recommendation
  stands at flat alias for surface-form-treue + budget-conservatism.

**Characters (Phase 3) — Cross-Era / honor-title / cross-form consolidations:**

- **Case B — `Typhon` ↔ `typhus` (canonical, Pass-11-aliased via `Calas Typhon`).** `Typhon`
  (freq 1, HH-0119 *The Lion* — Death Guard antagonist) is the **short-form bare name** of Calas
  Typhon, the Death Guard First Captain who becomes Typhus the Traveller. Pass-11 added the alias
  `Calas Typhon → typhus` (case E in the Pass-11 dossier), but the bare-form `Typhon` was not in
  that wave's surface set. This wave surfaces it. → **alias `Typhon → typhus`**. Pattern-parallel
  to Pass-11's Horus Lupercal / Lorgar Aurelian / Corvus Corax / Emperor of Mankind alias chain
  (anchor the long-form first, alias the short-form when it surfaces in a later wave). No row edit.
- **Case C — `Alexis Pollux` ↔ `alexis_polux` (canonical, direct in §3).** `Alexis Pollux`
  (freq 1, HH-0109 *Ember of Extinction*, unresolved) is a **typo** for the lore-canonical
  `Alexis Polux` (freq 1, HH-0125 *The Crimson Fist*, direct → `alexis_polux` — Captain Alexis
  Polux of the Imperial Fists 405th Company who commands at the Battle of Phall, which both books
  reference). Same person; the wave authoring of HH-0109 introduced the double-l misspelling. →
  **alias `Alexis Pollux → alexis_polux`** in `character-aliases.json`. This is the only typo-driven
  cross-batch character consolidation of the wave. Phase 3 should also note the override-side typo
  for the impl-report audit (the surface form in HH-0109's override stays as authored —
  surface-form-treue per runbook §4 — the alias normalizes resolution).

**Locations (Phase 2):**

- **Case D — `Lycaeus` ↔ `deliverance` (canonical, direct in §3).** `Lycaeus` (freq 1, HH-0127
  *Ravenlord*, unresolved) is the **older Mechanicum-era / pre-Liberation name** for the moon-prison
  that becomes Deliverance after Corax's slave uprising overthrows the Mechanicum overseers.
  Same place, two era-specific surface forms — both surface in the same book (HH-0127), the
  novella crosscutting Lycaeus's hellish past with Deliverance's liberated present. → **alias
  `Lycaeus → deliverance`** in `location-aliases.json`. Pattern-parallel to runbook §4's
  Luna-Wolves-↔-Sons-of-Horus precedent (era-rename onto the post-rename canonical row).
- **Case E — `Phall System` ↔ `phall` (canonical, direct in §3).** `Phall System` (freq 1,
  HH-0125 *The Crimson Fist*, unresolved) is the **system-grain surface** for the same warp-route
  collision-site that `Phall` (freq 1, HH-0109 *Ember of Extinction*, direct → `phall`) names as
  the battle locale. Both books are in the wave; both reference the same place (the Phall System
  is where Polux's fleet ambushes the Iron Warriors). Same place, two grain-variant surface forms.
  Default = **alias `Phall System → phall`** in `location-aliases.json` (simplest grain — the
  `phall` canonical row already conceptually carries the system; no other warp-route partition
  surfaces). Phase-2 may instead promote a separate system-grain row `phall_system` if it wants
  explicit hierarchical grain — judgment call; recommendation stands at alias for budget-
  conservatism + parity with how other system/world pairs are flat in `locations.json`.

**Confirmations only (already-aliased / already-direct from Pass 10–11 — no Phase-N action):**

The following surface forms surface in this wave with `alias` or `direct` status because Pass-10 or
Pass-11 already landed the anchor + alias. No alias-file edit needed; listed only to make the
Cross-Era / Pass-10/11-handoff chain explicit:

- **Factions:** `Imperial Army → astra_militarum` (Pass-10 alias, **3 hits** this wave —
  HH-0091/0123/0129), `Mechanicum → mechanicus` (Pass-10 alias, **2 hits** — HH-0121/0130), `Eldar
  → eldar` (Pass-10 alias, 2 hits — HH-0114/0118), `Knights-Errant → knights_errant` (Pass-11
  alias **on the Pass-11 new row**, 2 hits — HH-0130/0134), `The Fallen → fallen_angels`
  (Pass-10-or-earlier alias, 1 hit — HH-0111), `Imperium → imperium` (1 hit, HH-0104). Every
  Pass-10/11 anchor chain on the faction axis catches its re-surface.
- **Characters:** `Emperor of Mankind → the_emperor` (Pass-11 alias, **3 hits** this wave —
  HH-0104/0107/0110), `Kharn → kharn_the_betrayer` (Pass-10 alias, 2 hits — HH-0112/0138),
  `Horus Lupercal → horus`, `Corvus Corax → corax`, `Lorgar Aurelian → lorgar` (all Pass-11 aliases,
  1 hit each — HH-0115/0091/0115), `Lucius → lucius_the_eternal` (Pass-10 alias, 1 hit — HH-0117),
  `Branne → branne_nev` (Pass-10 alias, 1 hit — HH-0121). Pass-11's Cross-Era / honor-title-split
  work was correctly forecasted — every aliased Pass-12 character surface lands on the right
  anchor.
- **Direct chain — all 17 Primarchs anchored.** Every named Primarch in this wave catches its
  bare-name surface form direct on the Pass-10/11 canonical row: Lion El'Jonson (freq 9), Rogal
  Dorn (8), Sanguinius (7 — Pass-11 row), Ferrus Manus (6), Angron (5), Fulgrim (5), Horus (5),
  Konrad Curze (5), Magnus the Red (5), Mortarion (5), Perturabo (5 — Pass-11 row), Roboute
  Guilliman (5), Vulkan (5), Alpharius (4), Jaghatai Khan (3 — Pass-11 row), Leman Russ (3),
  Lorgar (3), Corax (2). **Primarch coverage is now exhaustive** for both the Pass-12 wave and
  every prior HH wave.
- **Direct chain — supporting cast:** `Targutai Yesugei` (Pass-11 row, freq 2 — HH-0088/0116);
  `Eidolon`, `Omegon`, `Malcador the Sigillite`, `Sevatar` (Pass-11 rows, freq 2 each); `Shadrak
  Meduson`, `Sharrowkyn`, `Shiban Khan`, `Sigismund`, `Bjorn`, `Constantin Valdor`, `Euphrati
  Keeler` (Pass-11 rows, freq 1 each); `Kor Phaeron`, `Forrix`, `Luther`, `Nathaniel Garro`,
  `Nemiel` (pre-Pass-11 rows, freq 1 each); `Alexis Polux` (pre-Pass-11 W40K row, freq 1 — anchor
  for Case C). Every freq-2+ unresolved character spine the Pass-11 dossier projected is now in
  place; this wave produces only **two** new cross-batch spine rows (7b).
- **Direct chain — locations:** `Terra`, `Nuceria` (Pass-11 row), `Nocturne`, `Caliban`, `Calth`,
  `Chondax` (Pass-11 row), `Nostramo` (Pass-11 row), `Prospero`, `Tallarn` (Pass-11 row),
  `Chogoris` (Pass-11 row), `Colchis`, `Deliverance`, `Eye of Terror`, `Fenris`, `Ghoul Stars`,
  `Macragge`, `Mars`, `Medusa`, `Monarchia`, `Phall`, `The Rock → rock`, `Ullanor`, `Ultramar`.
  Every freq-2 location surface this wave produces is anchored except `Galaspar` (7c new row) —
  the Pass-11 location promotion bloc absorbed exactly the right cases.

### 7b. Big single-form cross-batch spines (one row each — not alias work)

This wave is **markedly thinner** on cross-batch spines than Pass-11 (which had 15 freq-2 character
spines + 3 Primarchs). Only **two** spine rows surface this wave — both from the Calth Underworld
War novella pair, both freq 2 cross-batch within the same arc:

- **`Kurtha Sedd` (freq 2 — HH-0132 *The Honoured* / HH-0133 *The Unburdened*).** Word Bearers Dark
  Apostle leading the Calth Underworld War. Lore-iconic to the Calth post-Underworld-War arc
  (foundational *Mark of Calth* villain whose campaign defines the Underworld novellas). → **new row
  `kurtha_sedd`**. primaryFactionId `word_bearers` (exists, direct §3).
- **`Steloc Aethon` (freq 2 — HH-0132 / HH-0133).** Ultramarines Honoured commander, Calth loyalist
  POV (the namesake of *The Honoured*). → **new row `steloc_aethon`**. primaryFactionId
  `ultramarines` (exists, direct §3).

> Both spines are tight Calth-Underworld-arc rows — the two-novella pair is sufficient cross-batch
> evidence under the strict freq ≥ 2 rule. Phase 3 may also fold in the closing-arc novella *Born of
> Flame* / Calth-aftermath surfaces from Pass-11's roster if it wants broader Calth-pair-level
> evidence — recommendation: hold at the two-book spine for surface-form-treue.

### 7c. Per-axis promotion shape (freq-driven; owning phase justifies the exact set)

**Factions (Phase 1).** Strict freq ≥ 2 unresolved + curated freq-1 lore-iconic adds.

*No strict-freq unresolved factions this wave* (the §3 unresolved set is all freq-1). Curated
freq-1 candidates:

- **`Rangdan` (freq 1, HH-0096 *Alpharius: Head of the Hydra*).** Xenos species; foundational to
  the Rangdan Xenocides (the catastrophic pre-Heresy campaign — Alpha Legion's defining
  pre-Heresy operation, recurring HH-lore reference). Curated lore-iconic. Default = **new row
  `rangdan`** (parallel to existing xenos-species faction rows like `eldar`, `orks`).
- **`Hrud` (freq 1, HH-0084 *Perturabo: The Hammer of Olympia*).** Recurring xenos species in
  both HH and W40K canon (the Hrud Migration is a backdrop to Perturabo's Olympia early-rule
  arc). Curated lore-iconic. Default = **new row `hrud`**.
- **`Khrave` (freq 1, HH-0095 *Lion El'Jonson: Lord of the First*).** HH-era psychic xenos in
  the Ghoul Stars campaign. Lower lore profile than Rangdan/Hrud — single-novel surface,
  recurring only at this single Primarchs-monograph beat. Phase-1 judgment whether to promote
  or leave unresolved long-tail.
- **`Nephilim` (freq 1, HH-0088 *Jaghatai Khan: Warhawk of Chogoris*).** Xenos species at one
  Crusade-era beat in the Khan's biography. Lowest lore profile of the four xenos species
  surfacing this wave. Phase-1 judgment — recommendation: leave unresolved long-tail unless
  Phase 1 wants completionist xenos-grain.
- **`Daemons of Nurgle` (freq 1, HH-0101).** See 7a Case A — alias to `daemons`. **No new row.**
- **`Brotherhood of Lorgar` / `Covenant of Colchis` (freq 1 each, both HH-0085 *Lorgar: Bearer of
  the Word*).** Pre-Imperium proto-Word Bearers cults from Lorgar's pre-discovery Colchis origin
  story. Per the loop-log: "no Astartes Legion yet, so factions are the proto-religious bodies …
  Both feed Word Bearers lineage downstream." Both freq 1, both single-book, neither has
  post-discovery continuity in the resolver canon (the Word Bearers Legion is the institutional
  successor; the cults exist only in HH-0085's pre-discovery flashback frame). Default = **leave
  unresolved** (no anchor — Phase 1 should not invent rows for pre-Legion proto-religious bodies
  that BL itself treats as ancestral context). Phase-1 judgment if it wants curated lore-iconic
  promotion for the Colchis cult lineage; recommendation stands at unresolved.
- **`The Order` (freq 1, HH-0098 *Mortarion: The Pale King*).** Galaspar tyranny; one-off
  antagonist faction. Per the loop-log: "`The Order` as one-off antagonist faction (Galaspar's
  ruling tyranny)." Single-book, no recurrence, generic name (`The Order` is a name that may
  surface elsewhere too — disambig-risk). → **leave unresolved**.
- **`Carinae Sodality` (freq 1, HH-0091 *Corax: Lord of Shadows*).** Raven Guard sub-cell / sodality
  on Kiavahr (Raven Guard sub-faction grain not established in the resolver). → **leave
  unresolved**.

> Phase-1 promotion shape (recommended): **1 alias add** (Daemons of Nurgle → daemons) + **2..4
> new rows** (`rangdan` + `hrud` as strict-curated lore-iconic; `khrave` + `nephilim` as
> discretionary). The strict-freq floor is 0 new rows; the curated lore-iconic ceiling lands at 4.
> **The lightest Phase-1 promotion pass of the HH arc** — this wave's faction surface set is
> dominated by Pass-10-anchored Legions + Pass-11-aliased era-renames, and only the four xenos
> species are genuinely new.

**Locations (Phase 2).** Strict freq ≥ 2 unresolved + curated freq-1 lore-iconic.

Strict freq ≥ 2:

- **`Galaspar` (freq 2 — HH-0093 *Scions of the Emperor* / HH-0098 *Mortarion: The Pale King*).**
  The world ruled by *The Order* in *Mortarion: The Pale King* and referenced in *Scions of the
  Emperor*. Tyranny / compliance target in Mortarion's pre-Heresy biography. → **new row
  `galaspar`** (Phase-2 judgment on parent sector — likely `?` initially).

Curated freq ≥ 1 lore-iconic — **the Primarch-birthworld bloc** is the largest discretion area:

- **`Olympia` (freq 1, HH-0084).** Perturabo's homeworld; foundational lore. Default = **new row
  `olympia`** (Primarch-birthworld grain — every prior HH wave has added this tier).
- **`Barbarus` (freq 1, HH-0098).** Mortarion's homeworld; foundational lore. → **new row
  `barbarus`**.
- **`Cthonia` (freq 1, HH-0097).** Horus's homeworld; foundational lore. → **new row `cthonia`**.
- **`Morningstar` (freq 1, HH-0083).** Magnus the Red's knowledge-evacuation operation site in
  *Master of Prospero*. Lore profile lower than birthworlds — single-novel battle/operation
  locale, not a Primarch homeworld. Phase-2 judgment — recommendation: leave unresolved unless
  Phase 2 wants to capture the Magnus-arc operation locale.

- **Primarchs-monograph single-book campaign worlds (mostly novel-specific, varying lore weight):**
  - **`Byzas` (freq 1, HH-0086).** Fulgrim compliance target in *Palatine Phoenix*. Phase-2 judgment.
  - **`Thoas` (freq 1, HH-0081).** Guilliman vs Orks in *Lord of Ultramar*. Phase-2 judgment.
  - **`Dulan` (freq 1, HH-0082).** Russ vs Lion battlefield in *Great Wolf*. Lore-iconic to the
    Russ/Lion conflict thread. Phase-2 judgment — recommendation: promote (curated).
  - **`Gardinaal` (freq 1, HH-0087).** Ferrus Manus xeno-empire campaign in *Gorgon of Medusa*.
    Phase-2 judgment.
  - **`Kiavahr` (freq 1, HH-0091).** Raven Guard moon-parent (Deliverance is Kiavahr's moon).
    Lore-iconic in the Corax arc. → **new row `kiavahr`** (recommended).
  - **`Carinae` (freq 1, HH-0091).** Sub-region tied to Carinae Sodality. Phase-2 judgment —
    leave unresolved unless Phase 2 wants sub-region grain.
  - **`Zenith` (freq 1, HH-0091).** Carinae sub-locale. Same call as Carinae — leave unresolved.
  - **`Occluda Noctis` (freq 1, HH-0099).** Region beyond the Northern Major Warp Storm; Dorn's
    pre-Heresy operational frontier. Lore-iconic to *Rogal Dorn: The Emperor's Crusader*. Phase-2
    judgment — recommendation: promote `occluda_noctis` (curated lore-iconic).

- **HH novella campaign worlds / sub-locales (varying weight):**
  - **`Tatricala` (freq 1, HH-0113 *Eidolon: The Auric Hammer*).** Eidolon novel's primary world.
    Phase-2 judgment.
  - **`Desh'ea` (freq 1, HH-0138 *Angron*).** Angron's first scene with the World Eaters /
    Khârn — lore-iconic to the World Eaters origin. → **new row `deshea`** (slug strips
    apostrophe — convention from `Ka'Bandha → ka_bandha` in Pass-11).
  - **`Constanix II` (freq 1, HH-0121 *Corax: Soulforge*).** Mechanicum forge world. Forge-world
    grain consistent with existing Mechanicum-world rows. Phase-2 judgment — recommendation:
    promote `constanix_ii`.
  - **`Tenebrae 9-50` (freq 1, HH-0120 *The Serpent Beneath*).** Alpha Legion installation;
    foundational to *Serpent Beneath* (the eponymous Alpha-Legion-internal ops). Lore-iconic to
    the Alpha Legion sub-arc. Phase-2 judgment.
  - **`Carandiru` (freq 1, HH-0127 *Ravenlord*).** Raven Guard novella battlefield. Phase-2 judgment.
  - **`Thramas Sector` (freq 1, HH-0124 *Prince of Crows*).** The Thramas Crusade sector — Dark
    Angels vs Night Lords campaign (one of the largest Heresy theatres, defining backdrop for
    Curze's hunt + Lion's pursuit). Sector-grain canonical, lore-iconic. → **new row
    `thramas_sector`** (recommended — sector grain parallel to existing sector rows; tag if needed).
  - **`Urgall Depression` (freq 1, HH-0122 *Scorched Earth*).** Isstvan V drop-site sub-location
    (the Salamanders/Iron Hands/Raven Guard landing-zone of the Dropsite Massacre). Lore-iconic
    sub-location of Isstvan V. Phase-2 judgment — recommendation: promote `urgall_depression`
    (Isstvan V sub-location grain, parallel to Pass-11's Lion's Gate Spaceport-as-Terra-sub
    promotion).
  - **`Percepton Primus` (freq 1, HH-0126 *The Purge*).** Iron Warriors Purge site. Phase-2 judgment.
  - **`One-Five-Four Four` (freq 1, HH-0118 *Feat of Iron*).** Eldar maiden-world compliance
    target. Lore-iconic to *Feat of Iron* (the eponymous Iron Hands feat). Phase-2 judgment —
    recommendation: promote `one_five_four_four`.
  - **`Charchera System` (freq 1, HH-0137 *Spear of Ultramar*).** System-grain target. Phase-2 judgment.
  - **`Salvaguardia` (freq 1, HH-0134 *Garro: Vow of Faith*).** Garro vow-of-faith site. Phase-2 judgment.
  - **`Diavanos` (freq 1, HH-0102 *The Atonement of Fire*).** Ultramarines vs World Eaters battle
    site post-Ruinstorm. Phase-2 judgment.
  - **`Zoah` (freq 1, HH-0106 *The Abyssal Edge*).** Sevatar/Curze/Magnus operation site. Phase-2
    judgment.
  - **`Mount Ararat` (freq 1, HH-0110 *Valdor: Birth of the Imperium*).** Unification-Wars site,
    Valdor frame. Lore-iconic to Imperial pre-history. Phase-2 judgment — recommendation: leave
    unresolved unless Phase 2 wants Unification-Wars grain (this is a one-off Valdor-frame
    reference; the broader Unification Wars setting will surface in future waves).
  - **`Alaxxes Nebula` (freq 1, HH-0131 *Wolf King*; cumulative freq 2 with Pass-11's HH-0028
    *Scars*).** Cross-pass cumulative freq 2 — the White Scars vs Alpha Legion ambush nebula. Pass-11
    left this unresolved per Pass-11 §7c's "leave unresolved long-tail" call; this wave surfaces it
    again, raising the cumulative freq to 2. → **new row `alaxxes_nebula`** (curated lore-iconic;
    Pass-11-deferred, Pass-12-promotes given the cross-pass evidence).
  - **`Garden of Nurgle` (freq 1, HH-0101 *Grandfather's Gift*).** Warp-realm sub-locale (Mortarion's
    audience with Nurgle). Phase-2 judgment — recommendation: leave unresolved (warp-realm grain
    not established in the resolver; analogous to Pass-11's discussion of `Ruinstorm` as
    warp-phenomenon-not-location).
  - **`Taras Division` (freq 1, HH-0089 *Vulkan: Lord of Drakes*).** Region in Vulkan's
    Salamanders-origin arc. Phase-2 judgment — leave unresolved unless Phase 2 wants region grain.

> Phase-2 promotion shape (recommended): **2 alias adds** (Lycaeus → deliverance; Phall System → phall,
> 7a Cases D + E) + **1 strict-freq new row** (`galaspar`) + **3 Primarch-birthworld bloc new rows**
> (`olympia` + `barbarus` + `cthonia`) + **3..7 curated freq-1 lore-iconic new rows** (`kiavahr` +
> `thramas_sector` + `urgall_depression` + `occluda_noctis` + `deshea` + `alaxxes_nebula` +
> `constanix_ii` as strong defaults; `one_five_four_four` + `dulan` + the remainder discretionary).
> Conservative floor: 4 new rows (galaspar + 3 birthworlds); recommended target: ~10 new rows
> (floor + 6 curated lore-iconic); ceiling ~18 if Phase 2 takes a generous lore-iconic cut.

**Characters (Phase 3).** See 7a (2 alias adds: `Typhon → typhus`, `Alexis Pollux → alexis_polux`)
+ 7b (2 freq-2 new rows: `kurtha_sedd` + `steloc_aethon`). Plus the freq-1 long tail.

Curated freq-1 lore-iconic character candidates (Phase-3 discretion):

- **Lore-iconic / cross-arc supporting cast (strong promotion candidates):**
  - **`Barabas Dantioch`** (`Dantioch`, HH-0084 *Perturabo*). Iron Warriors Warsmith — a cross-arc
    figure who reappears in the *Imperial Truth* + the Hydra-Cordatus arc (already an alt-name
    pattern: full canonical = "Barabas Dantioch", HH-0084 surfaces the short form). → **new row
    `barabas_dantioch`** + **alias `Dantioch → barabas_dantioch`** (longer-form-canonical pattern
    per runbook §4). Lore-iconic — Dantioch is the lone-loyalist-Iron-Warrior archetype.
  - **`Sor Talgron`** (HH-0126 *The Purge*). Word Bearers, lore-iconic to the Burning of Monarchia
    + *The Purge* novella. → **new row `sor_talgron`**. primaryFactionId `word_bearers`.
  - **`Ingethel`** (HH-0115 *Aurelian*). The Daemon guide of Lorgar in the Eye of Terror; a
    foundational figure in the Word Bearers' fall to Chaos arc (across *Aurelian* + *The First
    Heretic* prequel chain). → **new row `ingethel`**. primaryFactionId `daemons` (judgment) or
    leave empty (Daemon-grain).
  - **`Kandawire` + `Amar Astarte`** (both HH-0110 *Valdor*). The two central non-Valdor POVs of
    *Valdor: Birth of the Imperium* (the three-POV court-intrigue trio). Both lore-iconic to the
    Imperial founding arc. → **new rows `kandawire` + `amar_astarte`**. primaryFactionId —
    judgment (Unification-era, no Legion).
  - **`Ilya Ravallion`** (HH-0116 *Brotherhood of the Storm*; cross-arc with Pass-11's HH-0036
    *Path of Heaven*). White Scars human-ally cross-arc figure. Cumulative cross-pass freq 2.
    → **new row `ilya_ravallion`**. primaryFactionId `white_scars` (or empty — she is the
    Departmento-Munitorum-attached cross-Legion liaison).
  - **`Hasik Khan`** (HH-0088 *Warhawk of Chogoris*). White Scars Khorchin Khan; lore-iconic
    cross-arc character. → **new row `hasik_khan`**. primaryFactionId `white_scars`.
  - **`Holguin` + `Redloss`** (both HH-0136 *Dreadwing*). Holguin = Dark Angels Voted Lieutenant;
    Redloss = Dark Angels Dreadwing Master. Both lore-iconic Dark Angels supporting cast (Dreadwing
    organization). → **new rows `holguin` + `redloss`**. primaryFactionId `dark_angels`.
- **Single-novel POVs / strong supporting cast (medium promotion candidates):**
  - `Solomon Voss` (HH-0112 — Sigismund interviewer; lore-iconic to *Sigismund: Eternal Crusader*).
  - `Atesh Tarsa` (HH-0128 — Salamander aboard the Sisypheum).
  - `Khrossus` (HH-0137 — Warsmith *Spear of Ultramar*).
  - `T'kell` (HH-0135 — Tu'Shan-era Salamander, "Drake Lord", slug strips apostrophe → `tkell`).
  - `Agapito` (HH-0121 — Raven Guard captain in *Soulforge*; recurring across Corax arc).
  - `Tahirah` (HH-0123 — Tahirah Idriss, *Tallarn: Executioner* POV).
  - `Hrend` (HH-0129 *Tallarn: Ironclad*; cross-arc with Pass-11's HH-0045 *Tallarn* anthology
    where the same surface form was unresolved. Cumulative cross-pass freq 2.) → **new row
    `hrend`** (cumulative cross-pass evidence promotes per the same logic Phase 2 uses for
    Alaxxes Nebula).
  - `Kau'gath` (HH-0101 — Ork warboss in *Grandfather's Gift*; slug strips apostrophe → `kaugath`).
  - `Orthos Ulatal` (HH-0106 — archivist frame).
- **Single-novel supporting cast (weak promotion candidates — Phase-3 judgment, default
  leave unresolved):**
  - `Aecus Decimus`, `Jaruleth` (both HH-0126 *The Purge* Iron Warriors line officers — leave
    unresolved unless Phase 3 wants The-Purge-arc completionist grain).
  - `Akurduana`, `Moses Trurakk` (both HH-0087 *Ferrus Manus* supporting cast).
  - `Calliphone` (HH-0084 *Perturabo* — Perturabo's mentor on Olympia).
  - `Nairo` (HH-0085 *Lorgar* — pre-discovery Colchis companion).
  - `Jorin Bloodhowl` (HH-0082 *Great Wolf* — Space Wolf in Russ vs Lion).
  - `Durath` (HH-0082 — Dark Eldar antagonist in *Great Wolf*).
  - `Kell` + `Haln` (both HH-0134 *Garro: Vow of Faith* — Assassinorum operative + Alpha Legion
    shadow; antagonists, may surface again in Garro arc).
  - `Dravian Klayde` (HH-0130 *Cybernetica* — Mechanicum POV).
  - `Ulrach Branthan`, `Usabius` (HH-0128 + HH-0122 — single-novella supporting cast).
  - `Xyrokles` (HH-0093 *Scions of the Emperor* — Iron Warriors antagonist in one anthology story).
  - `Ra'stan` (HH-0122 *Scorched Earth* — slug strips apostrophe).

- **`Nurgle` (freq 1, HH-0101 *Grandfather's Gift*) — axis-grain question.** `Nurgle` surfaces here
  as a **character** entry (the Chaos God appears on-page in Mortarion's audience). Phase-3 judgment:
  is this a character row or a faction row? Default = **Phase-3 promotes character row `nurgle`**
  (parallel to a potential future four-Gods cast — Khorne / Tzeentch / Slaanesh — when they surface
  on-page; the canonical override author tagged it as a character, not a faction). Phase-3 may
  defer to long-tail unresolved if it prefers narrower character-grain (only-personified-mortals).
  **Recommendation: promote `nurgle`** (curated lore-iconic — the Chaos Gods as character rows is a
  defensible grain choice that matches BL's narrative practice of treating them as on-page actors).

Phase-3 promotion shape (recommended): **2 alias adds** (7a Cases B + C: Typhon → typhus, Alexis
Pollux → alexis_polux) + **2 freq-2 new rows** (7b: `kurtha_sedd` + `steloc_aethon`) + **8..12
curated freq-1 strong-lore-iconic new rows** (`barabas_dantioch` + `sor_talgron` + `ingethel` +
`kandawire` + `amar_astarte` + `ilya_ravallion` + `hasik_khan` + `holguin` + `redloss` + `hrend` +
`nurgle` + optionally `solomon_voss` / `agapito` / `tkell`) + **0..15 weak-curated long-tail new
rows** (Phase-3 judgment per row). Conservative floor: 4 new rows (the 2 freq-2 + 2 strongest
freq-1: Dantioch + Sor Talgron); recommended target: ~13 new rows (floor + 9 strong-lore-iconic);
ceiling ~25 if Phase 3 takes a generous freq-1 cut. **The lightest Phase-3 promotion pass of the
HH arc** — Pass-11 absorbed every freq-2 spine for the main HH cast, so Pass-12 is mostly
single-novel supporting cast judgment + Cross-Era cleanup.

### 7d. needs-decision candidates (expected: 0 hard blockers)

- **Forward-ref Guard post-Brief-101: expected `out-of-range=0, unknown-work=0`.** Pass-12's only
  roster-collection anthology HH-0090 *Sons of the Emperor* has 9 constituents (HH-0101..HH-0106 +3),
  **all inside the cumulative apply range hh 1..14**. The other 3 anthologies in §5 (*Scions*,
  *Blood*, *Visions of Heresy*) have no roster constituents. Pass-12 expects the **cleanest Guard
  outcome of the HH arc**: 0 out-of-range refs (informational), 0 unknown-work refs (clean). The
  Pass-11 baseline was `out-of-range=7` (Shadows of Treachery constituents outside hh 1..8); Pass
  12 absorbs every roster-collection forward-ref. Phase 4a verifies the counts; mismatch
  (`unknown-work > 0`) is a `## Needs decision` stop. **Not a hard block** — the Guard is wired
  correctly per Brief 101 + Pass-11 experience.
- **`Phall` ↔ `Phall System` Phase-2 grain (7a Case E).** Phase 2 may instead promote a separate
  system-grain row `phall_system` if hierarchical grain is preferred. Recommendation stands at
  **alias `Phall System → phall`** (simplest grain — the `phall` row already conceptually carries
  the system; no other partition surfaces). Phase 2 judgment. **Not a hard block.**
- **`Daemons of Nurgle` Phase-1 grain (7a Case A).** Phase 1 may instead promote `nurgle_daemons`
  if it wants per-Power-of-Chaos sub-faction grain (consistent with Pass-11's per-Titan-Legion
  promotion of `legio_ignatum` / `legio_solaria` / `legio_vulpa`). Recommendation stands at **alias
  `Daemons of Nurgle → daemons`** (flat sub-faction-grain not yet established; matches Pass-11's
  Daemons-of-Khorne discussion). Phase 1 judgment. **Not a hard block.**
- **Xenos-species promotion threshold (Phase 1).** All four xenos species (Rangdan, Hrud, Khrave,
  Nephilim) are freq 1 single-book. Phase 1 picks the cut: recommendation = promote Rangdan + Hrud
  (strong lore profile), discretionary Khrave + Nephilim. Phase-1 judgment. **Not a hard block.**
- **Pre-Imperium proto-cults (Phase 1).** `Covenant of Colchis` + `Brotherhood of Lorgar` (both
  HH-0085) are freq 1 single-book, pre-Legion proto-religious bodies. Recommendation = **leave
  unresolved** (no anchor; BL treats them as ancestral context, the Word Bearers Legion is the
  institutional successor). Phase 1 judgment if it wants curated lore-iconic promotion.
  **Not a hard block.**
- **`Nurgle` Phase-3 character-vs-faction grain.** Override author tagged `Nurgle` as a character
  in HH-0101 (the Chaos God appears on-page). Phase-3 judgment whether to promote as character row
  `nurgle` (recommendation) or leave unresolved + defer four-Gods-cast question. **Not a hard block.**
- **`Lycaeus` Phase-2 alias call (7a Case D).** Phase 2 confirms that Lycaeus is the pre-Liberation
  Mechanicum name for Deliverance (BL canon explicitly: same moon, two era-names). Alias is the
  cleanest grain. Phase 2 may instead promote separate-row + alias if it wants pre-Liberation
  era-grain — judgment call. **Not a hard block.**
- **Format conflicts.** HH-0138 *Angron* (`data_conflict:format->anthology`), HH-0139 *The
  Imperial Truth* (`data_conflict:format->anthology`), and the roster tagging it as `collection`
  rather than `anthology` — both books are short-story compilations. Phase 4a applies the override
  as written; format mismatches surface in the apply digest. **Not a Phase-1/2/3 concern.**
- **`Ember of Extinction` title conflict.** HH-0109 `data_conflict:title->Embers of Extinction`
  — roster has singular *Ember*, override author / BL / Lexicanum spell canonical plural *Embers*.
  Phase 4a applies the override; title mismatch is upstream of resolver axes. **Not a Phase-1/2/3
  concern.**
- **`Visions of Heresy` empty axes.** HH-0140 — art/reference book with `factions[] /
  locations[] / characters[]` deliberately empty and a `low_confidence:factions` flag. Per the
  loop-log: "factions/locations/characters deliberately left empty with a low_confidence flag
  rather than aggregated to an 'all eighteen Legions' pseudo-list." Phase 4a applies as-authored
  (empty arrays produce zero junctions for this book); the verify cockpit will show book-row
  exists with no resolved junctions. Expected. **Not a Phase-1/2/3 concern.**
- **`Sons of the Forge` / `Ghost of Nuceria` low_confidence:factions.** Both books authored with
  partial / withheld antagonist factions per source coverage. Advisory carry-through for the audit
  cockpit; does not gate resolver axes. **Not a Phase-1/2/3 concern.**
- **Cumulative milestone — HH-domain past-mid-arc.** After this pass: **140 / X HH books** where
  X is the full HH-domain target (the loop-helper detector knows the total; Phase 4b can read it
  from `db-counts` / verify-pass output). The Phase 4b impl-report should flag this as the **HH
  past-mid-arc milestone** — Primarch coverage exhaustive (all 17), the entire *Primarchs*
  monograph series now in the layer, Calth Underworld pair + classic novella tail absorbed, every
  freq-2+ HH-cast row in place for the next wave's continuing arc work.
- **Cross-axis surface-form conflicts** — **none in this wave** per §4. The Pass-12 surface set is
  clean on that axis-disambig front (no `Nurgle` faction-vs-character cross-axis appearance — only
  the `Daemons of Nurgle` faction surface separately from the `Nurgle` character surface, which
  resolves cleanly by axis). The Pass-11 advisory about a future *Fulgrim*-adjacent `Laer`/`Laeran`
  case still applies for later waves; this wave does not face it.

The per-axis promotion extents (7c), the 7a Cross-Era + alias-consolidation cases, and the 7b
Calth-Underworld new-row pair are in-phase **judgments**, justified in each phase report — none
escalates to a hard block under current evidence. The Brief-091 forward-ref Guard is wired
correctly (Brief 101 reason-split landed at Pass-10), so the architectural concern is closed; Phase
4a only verifies the expected `out-of-range=0, unknown-work=0` counts.
