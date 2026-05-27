# Resolver-Pass 11 — Phase-0 Dossier (ssot-hh-003..008 / HH-0021..HH-0080)

> Deterministic cross-axis context for the three axis-phases (Factions / Locations / Characters) + the
> Phase-4 integration. **Sections 2–6 are the mechanical output** of
> `scripts/aggregate-surface-forms.ts --config scripts/resolver-pass.config.json` (read-only, idempotent —
> re-running on the committed override files + seed-data yields byte-identical output). **Section 7 is the
> only LLM-synthesized part** (cross-batch alias-consolidation + needs-decision candidates, heavy on
> Cross-Era identity calls + Primarch spines since this wave finally surfaces the bulk of the HH cast).
> Phases 1–4 read THIS file, not the 6 override files or the loop-log. Brief-free pass (Brief 094 lean
> contract); the operative spec is [`sessions/resolver-pass-runbook.md`](../resolver-pass-runbook.md) +
> the per-pass config — no architect brief is read to run a phase.

## 1. Scope header

- **Wave:** `ssot-hh-003..008` (6 loop batches, 10 books × 6 = **60 books** — the bulk Horus-Heresy wave,
  picking up directly after the Pass-10 HH-bootstrap of 20 books at HH-0001..HH-0020). Wave size was
  re-confirmed at the loop-helper after the Pass-10 first-HH-apply settled cleanly (works 565→585,
  Brief-101 Guard-Fix landed).
- **IDs:** `HH-0021..HH-0080` (60 books — the meat of Black Library's Horus-Heresy main series:
  *Fear to Tread* through *Ashes of the Imperium*, 2012–2026, including all three *Siege of Terra*
  arc-openers and the *End and the Death* trilogy finale).
- **Cumulative:** **80 HH books** in the HH authority layer after this pass (20 applied through Pass 10
  + 60 new in this wave). W40K side stays sealed at 565/565 books — out of scope for this pass.
- **Resolver baseline (pre-Pass-11 reference rows + aliases, emitted by the aggregator):** factions
  **179** rows / **63** aliases · locations **234** / **17** · characters **404** / **47**.
  The Pass-10 deltas are visible here: +6 faction rows / +4 faction aliases / +10 location rows /
  +1 location alias / +60 character rows / +4 character aliases vs. the Pass-10 pre-pass baseline.
  Cross-Era anchors added by Pass 10 (`horus`, `lion_el_jonson`, `leman_russ`, `lorgar`, `fulgrim`,
  `alpharius`, `omegon`, `angron`, `rogal_dorn`, `corax`, `konrad_curze` Primarchs · `garviel_loken`,
  `tarik_torgaddon`, `horus_aximand`, `erebus`, `nathaniel_garro`, `malcador_the_sigillite`, `luther`,
  `nemiel`, `zahariel`, `the_emperor` etc. supporting cast · `cabal` faction · `istvaan_iii` /
  `colchis` / `monarchia` / `khur` / `nikaea` / `deliverance` locations) are already in place — every
  freq ≥ 2 HH-era surface form that resolves direct in §3 lands on one of those Pass-10 anchors. No
  FK-trap from Pass-10-side row gaps.
- **Apply range Phase 4:** `hh 1..8` (config `aggregator.applyRange` = `{ domain: "hh", from: 1, to: 8 }`).
  Idempotent delete-then-insert re-apply of `ssot-hh-001` + `ssot-hh-002` (already applied at Pass 10,
  no churn — the data has not changed) + first-time apply of `ssot-hh-003..008` (60 new books).
  Domain-aware Trias-Batch-Range tuples for the apply-side trio (`apply-override-dry.ts` /
  `test-resolver-coverage.ts` / `test-resolver-data-integrity.ts`) are appended with the **six new
  `{ domain: "hh", n: "003" }` .. `{ domain: "hh", n: "008" }` entries** alongside the existing
  W40K-001..057 + HH-001..002 set (runbook §3 Phase 4a + config `phase-4a-integration.trigger`).
- **Clusters (observed; config has no `clusters` field this pass, so §3's cluster column stays `?`):**
  - `ssot-hh-003` → **HH-0021..HH-0030 — mid-arc pivots, Signus to Pythos:** Swallow *Fear to Tread*
    (Sanguinius / Signus / Ka'Bandha, Blood Angels Signus Trial); anthology *Shadows of Treachery*
    (7-story collection — known constituents HH-0124, HH-0125, HH-0170, HH-0172, HH-0241, HH-0242,
    +1 — all forward-refs outside this wave's apply range); McNeill *Angel Exterminatus*
    (Fulgrim / Perturabo / Iydris); Dembski-Bowden *Betrayer* (Angron / Khârn / Lotara Sarrin /
    Nuceria pivot to Daemonhood); anthology *Mark of Calth* (no constituents in roster); Kyme
    *Vulkan Lives* (Vulkan / Konrad Curze / Numeon, Traoris); Abnett *The Unremembered Empire*
    (Imperium Secundus genesis, Macragge / Sotha); Wraight *Scars* (White Scars, Chondax /
    Jaghatai); McNeill *Vengeful Spirit* (Horus / Molech / House Devine); Annandale *The Damnation
    of Pythos* (Iron Hands remnants, Pythos / Galba / Durun Atticus).
  - `ssot-hh-004` → **HH-0031..HH-0040 — anthology-heavy bridge + early Siege ramp:** anthology
    *Legacies of Betrayal* (no constituents in roster); Kyme *Deathfire* (Salamanders, Nocturne /
    Mount Deathfire); anthology *War Without End*; Haley *Pharos* (Sotha / Mount Pharos);
    anthology *Eye of Terra*; Wraight *The Path of Heaven* (Shiban Khan / Kalium Gate); anthology
    *The Silent War* (Garro / Knights-Errant; `low_confidence:characters` flag — see §6); Thorpe
    *Angels of Caliban* (Lion El'Jonson / Dark Angels); French *Praetorian of Dorn* (Rogal Dorn /
    Alpharius / Pluto / Phall); Thorpe *Corax* anthology.
  - `ssot-hh-005` → **HH-0041..HH-0050 — Webway War + final scattered arcs:** Dembski-Bowden *The
    Master of Mankind* (Webway War / Custodes / The Emperor); Swallow *Garro: Weapons of Fate*
    anthology (`data_conflict:format->novel` flag — see §6); anthology *Shattered Legions*
    (`low_confidence:locations` — Iron Hands / Meduson); McNeill *The Crimson King* (Magnus / Tizca);
    French *Tallarn* anthology (World Eaters siege of Tallarn); Annandale *Ruinstorm* (Imperium
    Secundus arc closure); Kyme *Old Earth* (Vulkan / Eldrad Ulthran); anthology *The Burden of
    Loyalty* (`low_confidence:characters`); Haley *Wolfsbane* (Russ / Horus); Kyme *Born of Flame*
    anthology.
  - `ssot-hh-006` → **HH-0051..HH-0060 — Slaves to Darkness through Fury of Magnus (Siege of Terra
    opens):** French *Slaves to Darkness* (Mournival final form / Maloghurst / Zardu Layak);
    anthology *Heralds of the Siege* (`low_confidence:factions,characters,locations` — three flags,
    the most ambiguous override in the wave); Haley *Titandeath* (Beta-Garmon / Legio Solaria /
    Legio Vulpa); Swallow *The Buried Dagger* (Death Guard / Calas Typhon / Daemon-Primarchy of
    Mortarion); French *The Solar War* (Pluto / Sol System — **Siege of Terra Vol. 1**); Haley
    *The Lost and the Damned* (Lion's Gate Spaceport / Katsuhiro — **SoT Vol. 2**); Thorpe *The
    First Wall* (Lion's Gate / Sigismund — **SoT Vol. 3**); McNeill *The Sons of Selenar* novella
    (`data_conflict:title->Sons of the Selenar` flag, `low_confidence:characters` — Selenar
    gene-cult on Luna); Abnett *Saturnine* (Saturnine Gate / Eternity Wall — **SoT Vol. 4**);
    McNeill *Fury of Magnus* novella (Magnus / Imperial Palace).
  - `ssot-hh-007` → **HH-0061..HH-0070 — Mortis through Era of Ruin (Siege climaxes + post-Heresy
    bridge):** French *Mortis* (Adeptus Titanicus / Legio Ignatum / Legio Mortis — **SoT Vol. 5**);
    Wraight *Warhawk* (White Scars / Jaghatai — **SoT Vol. 6**); Dembski-Bowden *Echoes of Eternity*
    (Sanguinius / Ka'Bandha / Delphic Battlement — **SoT Vol. 7**); Swallow *Garro: Knight of Grey*
    novella (Garro / Knights-Errant); Abnett *The End and The Death Vol. 1/2/3* (**SoT Vol. 8 trilogy
    finale**, Horus's death, Golden Throne, Sanctum Imperialis); Abnett *Era Of Ruin*
    (`data_conflict:format->anthology` flag — post-Heresy bridge); Swallow *Flames of Betrayal*
    (`data_conflict:format->omnibus` flag — Garro post-Heresy); Wraight *Restorer* short story
    (Maximus Thane, smoke-slug for this batch).
  - `ssot-hh-008` → **HH-0071..HH-0080 — short-story tail + post-Heresy bridge:** Haley *Duty Waits*
    (Maximus Thane); Wraight *Magisterium* (Custodes); French *Now Peals Midnight*
    (`low_confidence:characters`); Kyme *Dreams of Unity* (proto-Heresy / Thunder Warriors); Thorpe
    *The Board is Set* (`low_confidence:factions`); McNeill *Old Wounds, New Scars*
    (`low_confidence:factions`); Goulding *The Last Council* (`low_confidence:factions`);
    Dembski-Bowden *A Rose Watered with Blood* (`low_confidence:locations`); Dembski-Bowden
    *Bringer of Sorrow*; Wraight *Ashes of the Imperium* (`data_conflict:authors->Chris Wraight`
    + `low_confidence:characters` — author typo `Charles` → `Chris` in roster).
- **Headline shape (from §3):** 46 distinct faction surface forms / 262 occ · 57 location / 152 occ ·
  111 character / 247 occ — **3.3× / 2.7× / 5.4× the per-axis volume** of Pass 10. Cross-axis conflicts
  (§4) = **0** (clean on that front again). 13 anthology rows (§5; **only `Shadows of Treachery` has
  known roster constituents** — 7 forward-refs HH-0124/0125/0170/0172/0241/0242/+1, all outside the
  cumulative apply range hh 1..8; the other 12 anthologies have **no** roster constituents at all, so
  Brief-091 Guard considers them "unknown constituents" = anthologies-without-children, expected on
  HH because most HH anthologies' short stories never got individual HH-NNNN entries in the roster
  schema). **14** `data_conflict` / `low_confidence` flag rows (§6 — clusters mostly in the
  anthology-heavy ssot-hh-004/005 and the short-story-heavy ssot-hh-008).
- **Forward-ref Guard expectation (post-Brief-101):** The single architectural concern that gated
  Pass-10's Phase 4a — the forward-ref Guard misfiring on out-of-range anthology constituents — is
  **resolved** as of commit `1126e45` (Brief 101, rebase-merged onto main): out-of-range refs are now
  informational only; `unknown-work` (truly unknown roster IDs) remains blocking. Pass 11 expects:
  `out-of-range` count = 7 (the *Shadows of Treachery* constituents); `unknown-work` count = 0. If
  `unknown-work > 0`, that's a Phase-4a `## Needs decision` stop (an override file references a roster
  ID that the canonical roster doesn't know — that's authoring-side broken, not Guard-side).
- **Generated by** `scripts/aggregate-surface-forms.ts --config scripts/resolver-pass.config.json`
  from the 6 override files (ssot-hh-003..008, 60 books) + `book-roster.json` + the current
  `factions.json` / `locations.json` / `characters.json` + their alias tables.

## 2. Book table (60 entries)

| externalBookId | slug | title | format | author | year | batch | cluster | flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HH-0021 | `fear-to-tread` | *Fear to Tread* | novel | James Swallow | 2012 | `ssot-hh-003` | `?` | — |
| HH-0022 | `shadows-of-treachery` | *Shadows of Treachery* | anthology | ? | 2012 | `ssot-hh-003` | `?` | — |
| HH-0023 | `angel-exterminatus` | *Angel Exterminatus* | novel | Graham McNeill | 2013 | `ssot-hh-003` | `?` | — |
| HH-0024 | `betrayer` | *Betrayer* | novel | Aaron Dembski-Bowden | 2013 | `ssot-hh-003` | `?` | — |
| HH-0025 | `mark-of-calth` | *Mark of Calth* | anthology | ? | 2017 | `ssot-hh-003` | `?` | — |
| HH-0026 | `vulkan-lives` | *Vulkan Lives* | novel | Nick Kyme | 2013 | `ssot-hh-003` | `?` | — |
| HH-0027 | `the-unremembered-empire` | *The Unremembered Empire* | novel | Dan Abnett | 2013 | `ssot-hh-003` | `?` | — |
| HH-0028 | `scars` | *Scars* | novel | Chris Wraight | 2014 | `ssot-hh-003` | `?` | — |
| HH-0029 | `vengeful-spirit` | *Vengeful Spirit* | novel | Graham McNeill | 2014 | `ssot-hh-003` | `?` | — |
| HH-0030 | `the-damnation-of-pythos` | *The Damnation of Pythos* | novel | David Annandale | 2014 | `ssot-hh-003` | `?` | — |
| HH-0031 | `legacies-of-betrayal` | *Legacies of Betrayal* | anthology | ? | 2015 | `ssot-hh-004` | `?` | — |
| HH-0032 | `deathfire` | *Deathfire* | novel | Nick Kyme | 2015 | `ssot-hh-004` | `?` | — |
| HH-0033 | `war-without-end` | *War Without End* | anthology | ? | 2016 | `ssot-hh-004` | `?` | — |
| HH-0034 | `pharos` | *Pharos* | novel | Guy Haley | 2016 | `ssot-hh-004` | `?` | — |
| HH-0035 | `eye-of-terra` | *Eye of Terra* | anthology | ? | 2017 | `ssot-hh-004` | `?` | — |
| HH-0036 | `the-path-of-heaven` | *The Path of Heaven* | novel | Chris Wraight | 2016 | `ssot-hh-004` | `?` | — |
| HH-0037 | `the-silent-war` | *The Silent War* | anthology | ? | 2016 | `ssot-hh-004` | `?` | `low_confidence:characters` |
| HH-0038 | `angels-of-caliban` | *Angels of Caliban* | novel | Gav Thorpe | 2016 | `ssot-hh-004` | `?` | — |
| HH-0039 | `praetorian-of-dorn` | *Praetorian of Dorn* | novel | John French | 2017 | `ssot-hh-004` | `?` | — |
| HH-0040 | `corax` | *Corax* | anthology | Gav Thorpe | 2017 | `ssot-hh-004` | `?` | — |
| HH-0041 | `the-master-of-mankind` | *The Master of Mankind* | novel | Aaron Dembski-Bowden | 2017 | `ssot-hh-005` | `?` | — |
| HH-0042 | `garro-weapons-of-fate` | *Garro: Weapons of Fate* | anthology | James Swallow | 2017 | `ssot-hh-005` | `?` | `data_conflict:format->novel` |
| HH-0043 | `shattered-legions` | *Shattered Legions* | anthology | ? | 2017 | `ssot-hh-005` | `?` | `low_confidence:locations` |
| HH-0044 | `the-crimson-king` | *The Crimson King* | novel | Graham McNeill | 2017 | `ssot-hh-005` | `?` | — |
| HH-0045 | `tallarn` | *Tallarn* | anthology | John French | 2017 | `ssot-hh-005` | `?` | — |
| HH-0046 | `ruinstorm` | *Ruinstorm* | novel | David Annandale | 2017 | `ssot-hh-005` | `?` | — |
| HH-0047 | `old-earth` | *Old Earth* | novel | Nick Kyme | 2017 | `ssot-hh-005` | `?` | — |
| HH-0048 | `the-burden-of-loyalty` | *The Burden of Loyalty* | anthology | ? | 2018 | `ssot-hh-005` | `?` | `low_confidence:characters` |
| HH-0049 | `wolfsbane` | *Wolfsbane* | novel | Guy Haley | 2018 | `ssot-hh-005` | `?` | — |
| HH-0050 | `born-of-flame` | *Born of Flame* | anthology | Nick Kyme | 2018 | `ssot-hh-005` | `?` | — |
| HH-0051 | `slaves-to-darkness` | *Slaves to Darkness* | novel | John French | 2018 | `ssot-hh-006` | `?` | — |
| HH-0052 | `heralds-of-the-siege` | *Heralds of the Siege* | anthology | ? | 2018 | `ssot-hh-006` | `?` | `low_confidence:factions`; `low_confidence:characters`; `low_confidence:locations` |
| HH-0053 | `titandeath` | *Titandeath* | novel | Guy Haley | 2018 | `ssot-hh-006` | `?` | — |
| HH-0054 | `the-buried-dagger` | *The Buried Dagger* | novel | James Swallow | 2019 | `ssot-hh-006` | `?` | — |
| HH-0055 | `the-solar-war` | *The Solar War* | novel | John French | 2019 | `ssot-hh-006` | `?` | — |
| HH-0056 | `the-lost-and-the-damned` | *The Lost and the Damned* | novel | Guy Haley | 2019 | `ssot-hh-006` | `?` | — |
| HH-0057 | `the-first-wall` | *The First Wall* | novel | Gav Thorpe | 2020 | `ssot-hh-006` | `?` | — |
| HH-0058 | `the-sons-of-selenar` | *The Sons of Selenar* | novella | Graham McNeill | 2020 | `ssot-hh-006` | `?` | `data_conflict:title->Sons of the Selenar`; `low_confidence:characters` |
| HH-0059 | `saturnine` | *Saturnine* | novel | Dan Abnett | 2020 | `ssot-hh-006` | `?` | — |
| HH-0060 | `fury-of-magnus` | *Fury of Magnus* | novella | Graham McNeill | 2021 | `ssot-hh-006` | `?` | — |
| HH-0061 | `mortis` | *Mortis* | novel | John French | 2021 | `ssot-hh-007` | `?` | — |
| HH-0062 | `warhawk` | *Warhawk* | novel | Chris Wraight | 2021 | `ssot-hh-007` | `?` | — |
| HH-0063 | `echoes-of-eternity` | *Echoes of Eternity* | novel | Aaron Dembski-Bowden | 2022 | `ssot-hh-007` | `?` | — |
| HH-0064 | `garro-knight-of-grey` | *Garro: Knight of Grey* | novella | James Swallow | 2023 | `ssot-hh-007` | `?` | — |
| HH-0065 | `the-end-and-the-death-vol-1` | *The End and The Death Vol. 1* | novel | Dan Abnett | 2023 | `ssot-hh-007` | `?` | — |
| HH-0066 | `the-end-and-the-death-vol-2` | *The End and The Death Vol. 2* | novel | Dan Abnett | 2023 | `ssot-hh-007` | `?` | — |
| HH-0067 | `the-end-and-the-death-vol-3` | *The End and The Death Vol. 3* | novel | Dan Abnett | 2024 | `ssot-hh-007` | `?` | — |
| HH-0068 | `era-of-ruin` | *Era Of Ruin* | novel | Dan Abnett | 2025 | `ssot-hh-007` | `?` | `data_conflict:format->anthology`; `low_confidence:characters` |
| HH-0069 | `flames-of-betrayal` | *Flames of Betrayal* | novel | James Swallow | 2026 | `ssot-hh-007` | `?` | `data_conflict:format->omnibus` |
| HH-0070 | `restorer` | *Restorer* | short_story | Chris Wraight | 2017 | `ssot-hh-007` | `?` | — |
| HH-0071 | `duty-waits` | *Duty Waits* | short_story | Guy Haley | 2017 | `ssot-hh-008` | `?` | — |
| HH-0072 | `magisterium` | *Magisterium* | short_story | Chris Wraight | 2017 | `ssot-hh-008` | `?` | — |
| HH-0073 | `now-peals-midnight` | *Now Peals Midnight* | short_story | John French | 2017 | `ssot-hh-008` | `?` | `low_confidence:characters` |
| HH-0074 | `dreams-of-unity` | *Dreams of Unity* | short_story | Nick Kyme | 2017 | `ssot-hh-008` | `?` | — |
| HH-0075 | `the-board-is-set` | *The Board is Set* | short_story | Gav Thorpe | 2017 | `ssot-hh-008` | `?` | `low_confidence:factions` |
| HH-0076 | `old-wounds-new-scars` | *Old Wounds, New Scars* | short_story | Graham McNeill | 2018 | `ssot-hh-008` | `?` | `low_confidence:factions` |
| HH-0077 | `the-last-council` | *The Last Council* | short_story | L.J. Goulding | 2018 | `ssot-hh-008` | `?` | `low_confidence:factions` |
| HH-0078 | `a-rose-watered-with-blood` | *A Rose Watered with Blood* | short_story | Aaron Dembski-Bowden | 2018 | `ssot-hh-008` | `?` | `low_confidence:locations` |
| HH-0079 | `bringer-of-sorrow` | *Bringer of Sorrow* | short_story | Aaron Dembski-Bowden | 2019 | `ssot-hh-008` | `?` | — |
| HH-0080 | `ashes-of-the-imperium` | *Ashes of the Imperium* | novel | Charles Wraight | 2025 | `ssot-hh-008` | `?` | `data_conflict:authors->Chris Wraight`; `low_confidence:characters` |

## 3. Surface-form aggregate (sorted: freq desc, name asc)

### Factions (46 distinct surface forms, 262 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Sons of Horus | 20 | HH-0022, HH-0029, HH-0031 | direct | sons_of_horus | `?` |
| Adeptus Custodes | 19 | HH-0037, HH-0039, HH-0041 | direct | custodes | `?` |
| Death Guard | 18 | HH-0029, HH-0031, HH-0032 | direct | death_guard | `?` |
| Imperial Fists | 18 | HH-0022, HH-0039, HH-0055 | direct | imperial_fists | `?` |
| Word Bearers | 17 | HH-0021, HH-0024, HH-0025 | direct | word_bearers | `?` |
| Blood Angels | 14 | HH-0021, HH-0027, HH-0034 | direct | blood_angels | `?` |
| Ultramarines | 13 | HH-0024, HH-0025, HH-0027 | direct | ultramarines | `?` |
| White Scars | 11 | HH-0028, HH-0031, HH-0033 | direct | white_scars | `?` |
| Night Lords | 10 | HH-0022, HH-0026, HH-0027 | direct | night_lords | `?` |
| World Eaters | 10 | HH-0024, HH-0029, HH-0031 | direct | world_eaters | `?` |
| Dark Angels | 9 | HH-0027, HH-0031, HH-0033 | direct | dark_angels | `?` |
| Iron Warriors | 9 | HH-0022, HH-0023, HH-0035 | direct | iron_warriors | `?` |
| Salamanders | 9 | HH-0026, HH-0027, HH-0030 | direct | salamanders | `?` |
| Emperor's Children | 7 | HH-0023, HH-0029, HH-0031 | direct | emperors_children | `?` |
| Iron Hands | 7 | HH-0023, HH-0026, HH-0030 | direct | iron_hands | `?` |
| Raven Guard | 7 | HH-0022, HH-0023, HH-0026 | direct | raven_guard | `?` |
| Alpha Legion | 6 | HH-0028, HH-0039, HH-0040 | direct | alpha_legion | `?` |
| Thousand Sons | 6 | HH-0041, HH-0044, HH-0051 | direct | thousand_sons | `?` |
| Mechanicum | 5 | HH-0022, HH-0041, HH-0048 | alias | mechanicus | `?` |
| Sisters of Silence | 5 | HH-0033, HH-0037, HH-0039 | alias | talons_of_the_emperor | `?` |
| Knights Errant | 4 | HH-0042, HH-0048, HH-0064 | unresolved | — | `?` |
| Space Wolves | 4 | HH-0028, HH-0033, HH-0048 | direct | space_wolves | `?` |
| Astra Militarum | 3 | HH-0056, HH-0057, HH-0073 | direct | astra_militarum | `?` |
| Chaos Daemons | 3 | HH-0041, HH-0044, HH-0046 | alias | daemons | `?` |
| Daemons of Chaos | 3 | HH-0065, HH-0066, HH-0067 | unresolved | — | `?` |
| Eldar | 2 | HH-0023, HH-0047 | alias | eldar | `?` |
| Heretic Astartes | 2 | HH-0078, HH-0080 | direct | heretic_astartes | `?` |
| Imperial Army | 2 | HH-0029, HH-0045 | alias | astra_militarum | `?` |
| Knights-Errant | 2 | HH-0037, HH-0054 | unresolved | — | `?` |
| Adeptus Astartes | 1 | HH-0080 | direct | adeptus_astartes | `?` |
| Adeptus Mechanicum | 1 | HH-0061 | unresolved | — | `?` |
| Cabal | 1 | HH-0026 | direct | cabal | `?` |
| Collegia Titanica | 1 | HH-0053 | alias | adeptus_titanicus | `?` |
| Daemons of Khorne | 1 | HH-0063 | unresolved | — | `?` |
| House Devine | 1 | HH-0029 | unresolved | — | `?` |
| Imperial Navy | 1 | HH-0055 | direct | imperial_navy | `?` |
| Lectitio Divinitatus | 1 | HH-0042 | unresolved | — | `?` |
| Legio Ignatum | 1 | HH-0061 | unresolved | — | `?` |
| Legio Mortis | 1 | HH-0061 | direct | legio_mortis | `?` |
| Legio Solaria | 1 | HH-0053 | unresolved | — | `?` |
| Legio Vulpa | 1 | HH-0053 | unresolved | — | `?` |
| Mechanicus | 1 | HH-0035 | unresolved | — | `?` |
| Sanguinary Guard | 1 | HH-0063 | unresolved | — | `?` |
| Selenar | 1 | HH-0037 | unresolved | — | `?` |
| Selenar Gene-Cult | 1 | HH-0058 | unresolved | — | `?` |
| Thunder Warriors | 1 | HH-0074 | unresolved | — | `?` |

### Locations (57 distinct surface forms, 152 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Terra | 36 | HH-0022, HH-0033, HH-0035 | direct | terra | `?` |
| Imperial Palace | 20 | HH-0041, HH-0054, HH-0056 | direct | imperial_palace | `?` |
| Macragge | 7 | HH-0026, HH-0027, HH-0032 | direct | macragge | `?` |
| Isstvan V | 6 | HH-0022, HH-0023, HH-0026 | alias | istvaan_v | `?` |
| Calth | 5 | HH-0024, HH-0025, HH-0031 | direct | calth | `?` |
| Nocturne | 4 | HH-0026, HH-0032, HH-0047 | direct | nocturne | `?` |
| Sol System | 4 | HH-0039, HH-0055, HH-0073 | unresolved | — | `?` |
| Sotha | 4 | HH-0027, HH-0034, HH-0038 | direct | sotha | `?` |
| Ultramar | 4 | HH-0024, HH-0025, HH-0027 | direct | ultramar | `?` |
| Vengeful Spirit | 4 | HH-0029, HH-0065, HH-0066 | unresolved | — | `?` |
| Lion's Gate Spaceport | 3 | HH-0057, HH-0059, HH-0062 | unresolved | — | `?` |
| Luna | 3 | HH-0037, HH-0042, HH-0058 | direct | luna | `?` |
| Chondax | 2 | HH-0028, HH-0031 | unresolved | — | `?` |
| Eye of Terror | 2 | HH-0023, HH-0044 | direct | eye_of_terror | `?` |
| Mars | 2 | HH-0022, HH-0048 | direct | mars | `?` |
| Molech | 2 | HH-0029, HH-0076 | unresolved | — | `?` |
| Pluto | 2 | HH-0039, HH-0055 | unresolved | — | `?` |
| Prospero | 2 | HH-0028, HH-0044 | direct | prospero | `?` |
| Tallarn | 2 | HH-0035, HH-0045 | unresolved | — | `?` |
| Alaxxes Nebula | 1 | HH-0028 | unresolved | — | `?` |
| Armatura | 1 | HH-0024 | unresolved | — | `?` |
| Beta-Garmon | 1 | HH-0053 | unresolved | — | `?` |
| Caliban | 1 | HH-0038 | direct | caliban | `?` |
| Chogoris | 1 | HH-0028 | unresolved | — | `?` |
| Davin | 1 | HH-0046 | direct | davin | `?` |
| Deliverance | 1 | HH-0040 | direct | deliverance | `?` |
| Delphic Battlement | 1 | HH-0063 | unresolved | — | `?` |
| Eternity Gate | 1 | HH-0063 | unresolved | — | `?` |
| Eternity Wall Spaceport | 1 | HH-0059 | unresolved | — | `?` |
| Fenris | 1 | HH-0049 | direct | fenris | `?` |
| Golden Throne | 1 | HH-0067 | unresolved | — | `?` |
| Hollow Mountain | 1 | HH-0067 | unresolved | — | `?` |
| Holst Aspyce | 1 | HH-0021 | unresolved | — | `?` |
| Hydra Cordatus | 1 | HH-0023 | direct | hydra_cordatus | `?` |
| Isstvan III | 1 | HH-0042 | alias | istvaan_iii | `?` |
| Iydris | 1 | HH-0023 | unresolved | — | `?` |
| Kalium Gate | 1 | HH-0036 | unresolved | — | `?` |
| Mercury Wall | 1 | HH-0061 | unresolved | — | `?` |
| Mount Deathfire | 1 | HH-0032 | unresolved | — | `?` |
| Mount Pharos | 1 | HH-0034 | unresolved | — | `?` |
| Nostramo | 1 | HH-0022 | unresolved | — | `?` |
| Nuceria | 1 | HH-0024 | unresolved | — | `?` |
| One Forty Twenty | 1 | HH-0050 | unresolved | — | `?` |
| Phall | 1 | HH-0022 | direct | phall | `?` |
| Phorus | 1 | HH-0021 | unresolved | — | `?` |
| Planet of the Sorcerers | 1 | HH-0044 | direct | planet_of_the_sorcerers | `?` |
| Pythos | 1 | HH-0030 | unresolved | — | `?` |
| Ruinstorm | 1 | HH-0032 | unresolved | — | `?` |
| Sanctum Imperialis | 1 | HH-0063 | unresolved | — | `?` |
| Saturnine Gate | 1 | HH-0059 | unresolved | — | `?` |
| Signus Cluster | 1 | HH-0021 | unresolved | — | `?` |
| Signus Prime | 1 | HH-0021 | unresolved | — | `?` |
| Traoris | 1 | HH-0026 | unresolved | — | `?` |
| Trisolian | 1 | HH-0049 | unresolved | — | `?` |
| Tsagualsa | 1 | HH-0022 | direct | tsagualsa | `?` |
| Ullanor | 1 | HH-0028 | direct | ullanor | `?` |
| Webway | 1 | HH-0041 | direct | webway | `?` |

### Characters (111 distinct surface forms, 247 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Malcador the Sigillite | 14 | HH-0029, HH-0033, HH-0037 | direct | malcador_the_sigillite | `?` |
| Rogal Dorn | 13 | HH-0022, HH-0039, HH-0055 | direct | rogal_dorn | `?` |
| Roboute Guilliman | 10 | HH-0024, HH-0027, HH-0032 | direct | roboute_guilliman | `?` |
| Sanguinius | 10 | HH-0021, HH-0027, HH-0034 | unresolved | — | `?` |
| Horus Lupercal | 9 | HH-0051, HH-0055, HH-0056 | unresolved | — | `?` |
| Mortarion | 9 | HH-0036, HH-0051, HH-0054 | direct | mortarion | `?` |
| Konrad Curze | 6 | HH-0022, HH-0026, HH-0027 | direct | konrad_curze | `?` |
| Nathaniel Garro | 6 | HH-0033, HH-0037, HH-0042 | direct | nathaniel_garro | `?` |
| The Emperor | 6 | HH-0035, HH-0041, HH-0065 | direct | the_emperor | `?` |
| Angron | 5 | HH-0024, HH-0031, HH-0033 | direct | angron | `?` |
| Constantin Valdor | 5 | HH-0039, HH-0056, HH-0065 | direct | constantin_valdor | `?` |
| Jaghatai Khan | 5 | HH-0028, HH-0031, HH-0036 | unresolved | — | `?` |
| Perturabo | 5 | HH-0023, HH-0045, HH-0051 | unresolved | — | `?` |
| Vulkan | 5 | HH-0026, HH-0027, HH-0032 | direct | vulkan | `?` |
| Fulgrim | 4 | HH-0023, HH-0031, HH-0033 | direct | fulgrim | `?` |
| John Grammaticus | 4 | HH-0026, HH-0027, HH-0065 | direct | john_grammaticus | `?` |
| Shiban Khan | 4 | HH-0028, HH-0036, HH-0062 | unresolved | — | `?` |
| Artellus Numeon | 3 | HH-0026, HH-0032, HH-0050 | unresolved | — | `?` |
| Euphrati Keeler | 3 | HH-0064, HH-0067, HH-0069 | unresolved | — | `?` |
| Ezekyle Abaddon | 3 | HH-0055, HH-0056, HH-0059 | alias | abaddon_the_despoiler | `?` |
| Horus | 3 | HH-0029, HH-0035, HH-0049 | direct | horus | `?` |
| Lion El'Jonson | 3 | HH-0027, HH-0038, HH-0046 | direct | lion_el_jonson | `?` |
| Lucius | 3 | HH-0023, HH-0031, HH-0044 | alias | lucius_the_eternal | `?` |
| Magnus the Red | 3 | HH-0041, HH-0044, HH-0060 | direct | magnus_the_red | `?` |
| Oll Persson | 3 | HH-0025, HH-0065, HH-0066 | unresolved | — | `?` |
| Sigismund | 3 | HH-0039, HH-0055, HH-0061 | unresolved | — | `?` |
| Aeonid Thiel | 2 | HH-0031, HH-0035 | unresolved | — | `?` |
| Arkhan Land | 2 | HH-0041, HH-0079 | unresolved | — | `?` |
| Bjorn | 2 | HH-0033, HH-0049 | unresolved | — | `?` |
| Erebus | 2 | HH-0024, HH-0025 | direct | erebus | `?` |
| Garviel Loken | 2 | HH-0029, HH-0042 | direct | garviel_loken | `?` |
| Ka'Bandha | 2 | HH-0021, HH-0063 | unresolved | — | `?` |
| Kor Phaeron | 2 | HH-0025, HH-0046 | direct | kor_phaeron | `?` |
| Leman Russ | 2 | HH-0048, HH-0049 | direct | leman_russ | `?` |
| Lorgar | 2 | HH-0024, HH-0035 | direct | lorgar | `?` |
| Lotara Sarrin | 2 | HH-0024, HH-0078 | unresolved | — | `?` |
| Sevatar | 2 | HH-0022, HH-0035 | unresolved | — | `?` |
| Shadrak Meduson | 2 | HH-0043, HH-0047 | unresolved | — | `?` |
| Tybalt Marr | 2 | HH-0043, HH-0047 | unresolved | — | `?` |
| Tylos Rubio | 2 | HH-0029, HH-0042 | unresolved | — | `?` |
| Zardu Layak | 2 | HH-0051, HH-0056 | unresolved | — | `?` |
| Agapito | 1 | HH-0040 | unresolved | — | `?` |
| Ahriman | 1 | HH-0044 | alias | ahzek_ahriman | `?` |
| Ahzek Ahriman | 1 | HH-0055 | direct | ahzek_ahriman | `?` |
| Alexis Polux | 1 | HH-0022 | unresolved | — | `?` |
| Alivia Sureka | 1 | HH-0076 | unresolved | — | `?` |
| Alpharius | 1 | HH-0039 | direct | alpharius | `?` |
| Archamus | 1 | HH-0039 | unresolved | — | `?` |
| Argel Tal | 1 | HH-0024 | direct | argel_tal | `?` |
| Astelan | 1 | HH-0038 | direct | astelan | `?` |
| Azkaellon | 1 | HH-0063 | unresolved | — | `?` |
| Barthusa Narek | 1 | HH-0047 | unresolved | — | `?` |
| Belisarius Cawl | 1 | HH-0049 | direct | belisarius_cawl | `?` |
| Bion Henricos | 1 | HH-0043 | unresolved | — | `?` |
| Branne | 1 | HH-0040 | alias | branne_nev | `?` |
| Calas Typhon | 1 | HH-0054 | unresolved | — | `?` |
| Corax | 1 | HH-0022 | direct | corax | `?` |
| Corvus Corax | 1 | HH-0040 | unresolved | — | `?` |
| Dahren Heruk | 1 | HH-0074 | unresolved | — | `?` |
| Diocletian Coros | 1 | HH-0041 | unresolved | — | `?` |
| Durun Atticus | 1 | HH-0030 | unresolved | — | `?` |
| Eidolon | 1 | HH-0036 | direct | eidolon | `?` |
| Ekaddon | 1 | HH-0051 | unresolved | — | `?` |
| Eldrad Ulthran | 1 | HH-0047 | direct | eldrad_ulthran | `?` |
| Emperor of Mankind | 1 | HH-0060 | unresolved | — | `?` |
| Esha Ani Mohana | 1 | HH-0053 | unresolved | — | `?` |
| Forrix | 1 | HH-0023 | direct | forrix | `?` |
| Galba | 1 | HH-0030 | unresolved | — | `?` |
| Gendor Skraivok | 1 | HH-0056 | unresolved | — | `?` |
| Hathor Maat | 1 | HH-0044 | unresolved | — | `?` |
| Hrend | 1 | HH-0045 | unresolved | — | `?` |
| Iacton Qruze | 1 | HH-0029 | direct | iacton_qruze | `?` |
| Iaeo | 1 | HH-0045 | unresolved | — | `?` |
| Ilya Ravallion | 1 | HH-0036 | unresolved | — | `?` |
| Kabe | 1 | HH-0074 | unresolved | — | `?` |
| Kane | 1 | HH-0041 | unresolved | — | `?` |
| Kano | 1 | HH-0021 | unresolved | — | `?` |
| Katsuhiro | 1 | HH-0056 | unresolved | — | `?` |
| Khârn | 1 | HH-0024 | alias | kharn_the_betrayer | `?` |
| Khi'dem | 1 | HH-0030 | unresolved | — | `?` |
| Krukesh the Pale | 1 | HH-0034 | unresolved | — | `?` |
| Little Horus Aximand | 1 | HH-0029 | alias | horus_aximand | `?` |
| Lorgar Aurelian | 1 | HH-0051 | unresolved | — | `?` |
| Luther | 1 | HH-0038 | direct | luther | `?` |
| Macer Varren | 1 | HH-0042 | unresolved | — | `?` |
| Madail | 1 | HH-0021 | unresolved | — | `?` |
| Maloghurst the Twisted | 1 | HH-0051 | unresolved | — | `?` |
| Maximus Thane | 1 | HH-0071 | direct | maximus_thane | `?` |
| Menkaura | 1 | HH-0044 | unresolved | — | `?` |
| Meros | 1 | HH-0021 | unresolved | — | `?` |
| Mersadie Oliton | 1 | HH-0055 | direct | mersadie_oliton | `?` |
| Mohana Mankata Vi | 1 | HH-0053 | unresolved | — | `?` |
| Oberdeii | 1 | HH-0034 | unresolved | — | `?` |
| Ra Endymion | 1 | HH-0041 | unresolved | — | `?` |
| Raldoron | 1 | HH-0021 | unresolved | — | `?` |
| Remus Ventanus | 1 | HH-0025 | direct | remus_ventanus | `?` |
| Rhydia Erephren | 1 | HH-0030 | unresolved | — | `?` |
| Rylanor | 1 | HH-0023 | unresolved | — | `?` |
| Samonas | 1 | HH-0072 | unresolved | — | `?` |
| Sanakht | 1 | HH-0044 | unresolved | — | `?` |
| Sharrowkyn | 1 | HH-0023 | unresolved | — | `?` |
| Su-Kassen | 1 | HH-0055 | unresolved | — | `?` |
| Targutai Yesugei | 1 | HH-0028 | unresolved | — | `?` |
| Terent Hartekk | 1 | HH-0053 | unresolved | — | `?` |
| Tolbek | 1 | HH-0044 | unresolved | — | `?` |
| Torghun Khan | 1 | HH-0028 | unresolved | — | `?` |
| Typhus | 1 | HH-0067 | direct | typhus | `?` |
| Volk | 1 | HH-0051 | unresolved | — | `?` |
| Yesugei | 1 | HH-0036 | unresolved | — | `?` |
| Zahariel | 1 | HH-0038 | direct | zahariel | `?` |
| Zephon | 1 | HH-0079 | unresolved | — | `?` |

## 4. Cross-axis surface-form conflicts

| surface form | axes |
| --- | --- |
| (none) | — |

## 5. Omnibus / anthology scan

| externalBookId | title | format | roster collection? | known constituents |
| --- | --- | --- | --- | --- |
| HH-0022 | *Shadows of Treachery* | anthology | yes (7) | HH-0124, HH-0125, HH-0170, HH-0172, HH-0241, HH-0242, … (7 total) |
| HH-0025 | *Mark of Calth* | anthology | no | — |
| HH-0031 | *Legacies of Betrayal* | anthology | no | — |
| HH-0033 | *War Without End* | anthology | no | — |
| HH-0035 | *Eye of Terra* | anthology | no | — |
| HH-0037 | *The Silent War* | anthology | no | — |
| HH-0040 | *Corax* | anthology | no | — |
| HH-0042 | *Garro: Weapons of Fate* | anthology | no | — |
| HH-0043 | *Shattered Legions* | anthology | no | — |
| HH-0045 | *Tallarn* | anthology | no | — |
| HH-0048 | *The Burden of Loyalty* | anthology | no | — |
| HH-0050 | *Born of Flame* | anthology | no | — |
| HH-0052 | *Heralds of the Siege* | anthology | no | — |

## 6. data_conflict flag scan

| externalBookId | title | flags |
| --- | --- | --- |
| HH-0037 | *The Silent War* | `low_confidence:characters` |
| HH-0042 | *Garro: Weapons of Fate* | `data_conflict:format->novel` |
| HH-0043 | *Shattered Legions* | `low_confidence:locations` |
| HH-0048 | *The Burden of Loyalty* | `low_confidence:characters` |
| HH-0052 | *Heralds of the Siege* | `low_confidence:factions`; `low_confidence:characters`; `low_confidence:locations` |
| HH-0058 | *The Sons of Selenar* | `data_conflict:title->Sons of the Selenar`; `low_confidence:characters` |
| HH-0068 | *Era Of Ruin* | `data_conflict:format->anthology`; `low_confidence:characters` |
| HH-0069 | *Flames of Betrayal* | `data_conflict:format->omnibus` |
| HH-0073 | *Now Peals Midnight* | `low_confidence:characters` |
| HH-0075 | *The Board is Set* | `low_confidence:factions` |
| HH-0076 | *Old Wounds, New Scars* | `low_confidence:factions` |
| HH-0077 | *The Last Council* | `low_confidence:factions` |
| HH-0078 | *A Rose Watered with Blood* | `low_confidence:locations` |
| HH-0080 | *Ashes of the Imperium* | `data_conflict:authors->Chris Wraight`; `low_confidence:characters` |

## 7. Cross-batch alias-consolidation + needs-decision candidates

> The only LLM-synthesized section. It flags (7a) Cross-Era / cross-form alias-consolidation cases the
> owning phase must collapse onto an existing canonical row (runbook §4); (7b) the big single-form
> cross-batch character spines that promote to one row each (the bulk of Phase-3 volume in the
> mid-HH-arc wave is here — Sanguinius / Jaghatai / Perturabo finally land); (7c) the freq-driven
> promotion shape per axis; (7d) genuine needs-decision candidates (mostly grain calls and a single
> author-typo confirmation). The Brief-091 forward-ref Guard concern from Pass 10's §7d **no longer
> applies** — Brief 101 (commit `1126e45`) narrowed the assertion to `unknown-work` only; out-of-range
> constituent refs are informational and exit ok. Everything below is grounded in §2–§6 + the Pass-10
> alias / row anchors confirmed in §1 baseline.

### 7a. Cross-batch alias-consolidation cases (→ existing row + alias)

> Format: surface-forms · book-IDs · same entity? · recommendation. These are the cases where a naïve
> implementer would create **two** rows or invent a fresh row instead of aliasing onto an existing
> anchor. Per runbook §4: **one canonical identity = one canonical row; era-/form-specific surface
> forms live in `*-aliases.json`**.

**Factions (Phase 1):**

- **Case A — `Daemons of Chaos` ↔ `Chaos Daemons` ↔ `daemons` (canonical).** `Daemons of Chaos`
  (freq 3, HH-0065/0066/0067 *End and the Death* trilogy, unresolved) is a synonym for the same
  collective referenced by `Chaos Daemons` (freq 3, HH-0041/0044/0046, **already aliased** to
  `daemons` by Pass 10). Same entity, two surface-form variants. → **alias `Daemons of Chaos` →
  `daemons`** in `faction-aliases.json`. Combined effective freq 6+ on `daemons` once the alias
  lands. **No** new row.
- **Case B — `Knights-Errant` ↔ `Knights Errant` (hyphen variant).** `Knights Errant` (freq 4,
  HH-0042/0048/0064, unresolved) and `Knights-Errant` (freq 2, HH-0037/0054, unresolved) are the
  **same loyalist-Astartes cadre** under Malcador the Sigillite — author-style hyphenation difference
  only. The canonical row decision falls to Phase 1 (see 7c): **new row `knights_errant`** + **alias
  `Knights-Errant` → `knights_errant`** catches the hyphenated variant. Combined effective freq 6.
  This is a 7a+7c pair: 7a flags the alias-consolidation; 7c justifies the new row at combined freq 6.
- **Case C — `Adeptus Mechanicum` ↔ `Mechanicum` ↔ `mechanicus` (canonical).** `Adeptus Mechanicum`
  (freq 1, HH-0061, unresolved) and `Mechanicus` (freq 1, HH-0035, unresolved) are surface-form
  variants of the same organization that `Mechanicum` (freq 5, **already aliased** to `mechanicus`
  by Pass 10) names. → **alias `Adeptus Mechanicum` → `mechanicus`** + **alias `Mechanicus` →
  `mechanicus`** (catches the bare-canonical-name-without-`Adeptus` variant). Both safe additions —
  the `mechanicus` row anchors all three surface forms.

**Characters (Phase 3) — Cross-Era / honor-title / cross-form consolidations:**

- **Case D — `Horus Lupercal` ↔ `horus` (canonical, Pass-10-added).** `Horus Lupercal` (freq **9**,
  HH-0051/0055/0056..., unresolved) is the Warmaster's full pre-Heresy and Heresy-era name;
  `Horus` (freq 3 in this wave, direct on `horus`) is the short form. Same person. → **alias
  `Horus Lupercal` → `horus`** in `character-aliases.json`. Combined effective freq 12 on `horus`
  once the alias lands — this is the **single highest-impact alias add of the wave**, dwarfing
  every other Cross-Era consolidation. The Pass-10 anchor row `horus` (added with primaryFactionId
  `sons_of_horus`) is correct; no row edit needed.
- **Case E — `Calas Typhon` ↔ `typhus` (canonical).** `Calas Typhon` (freq 1, HH-0054 *The Buried
  Dagger*, unresolved) is the **Heresy-era name** of the Death Guard First Captain who becomes
  **Typhus** the Traveller (the existing W40K-side canonical row, `typhus` in `characters.json`).
  This is exactly the Cross-Era honor-title-split pattern runbook §4 codifies (cf. Kharn ↔ Kharn the
  Betrayer): → **alias `Calas Typhon` → `typhus`** + a curated freq-1 add (lore-iconic — pivotal POV
  of *The Buried Dagger*, the Death Guard fall to Nurgle).
- **Case F — `Corvus Corax` ↔ `corax` (canonical, Pass-10-added).** `Corvus Corax` (freq 1, HH-0040
  *Corax* anthology, unresolved) is the Primarch's full name; `Corax` (freq 1, HH-0022, direct) is
  the short form. Same person. → **alias `Corvus Corax` → `corax`**. Combined effective freq 2 on
  `corax`. Pattern-parallel to Case D Horus Lupercal but at smaller freq.
- **Case G — `Lorgar Aurelian` ↔ `lorgar` (canonical, Pass-10-added).** `Lorgar Aurelian` (freq 1,
  HH-0051 *Slaves to Darkness*, unresolved) is the Word Bearers Primarch's full name; `Lorgar`
  (freq 2, direct) is the short form. → **alias `Lorgar Aurelian` → `lorgar`**.
- **Case H — `Emperor of Mankind` ↔ `the_emperor` (canonical, Pass-10-added).** `Emperor of Mankind`
  (freq 1, HH-0060 *Fury of Magnus*, unresolved) is the formal title; `The Emperor` (freq 6 this
  wave, direct on `the_emperor` from the Pass-10 add) is the short form. → **alias `Emperor of
  Mankind` → `the_emperor`**. Future waves are likely to surface more variants (`Emperor` bare,
  `Master of Mankind`, etc.); this wave only aliases the one form that surfaces.
- **Case I — `Yesugei` ↔ `Targutai Yesugei` (same person, one new row + alias).** `Yesugei`
  (freq 1, HH-0036 *The Path of Heaven*, unresolved) and `Targutai Yesugei` (freq 1, HH-0028
  *Scars*, unresolved) are the **same character** — the White Scars Stormseer's short form vs.
  full name. Phase-3 picks one as canonical and aliases the other. Per runbook §4 Cross-Era /
  honor-title precedent (the longer / more specific form is the canonical row, the shorter form is
  the alias), the recommendation is: **new row `targutai_yesugei`** + **alias `Yesugei` →
  `targutai_yesugei`**. Combined effective freq 2 on the new row. Phase-3 may invert if it prefers
  the short canonical (`yesugei`) — judgment call, no hard preference, but the longer-form-canonical
  pattern matches Branne (which Pass-10 made `branne_nev` canonical + `Branne` alias) and Lucius
  the Eternal.

**Confirmations only (already-aliased / already-direct from Pass 10 — no Phase-N action):**

The following surface forms surface in this wave with `alias` or `direct` status because Pass-10 work
already landed the anchor + alias. No alias-file edit needed; listed only to make the
Cross-Era / Pass-10-handoff chain explicit:

- **Characters:** `Mechanicum`, `Sisters of Silence`, `Chaos Daemons`, `Eldar`, `Imperial Army` (all
  alias, all Pass-10 adds). `Ezekyle Abaddon → abaddon_the_despoiler`, `Lucius → lucius_the_eternal`,
  `Khârn → kharn_the_betrayer`, `Branne → branne_nev`, `Ahriman → ahzek_ahriman`, `Little Horus
  Aximand → horus_aximand` — every one a Pass-10-or-earlier alias confirmed by re-surfacing.
- **Direct chain:** every Primarch row Pass-10 added (`horus`, `lion_el_jonson`, `fulgrim`, `angron`,
  `corax`, `konrad_curze`, `mortarion`, `vulkan`, `roboute_guilliman`, `leman_russ`, `lorgar`,
  `alpharius`) catches its bare-name HH surface form direct in §3 — Cross-Era anchor chain works.
  Same for `the_emperor`, `nathaniel_garro`, `malcador_the_sigillite`, `garviel_loken`,
  `john_grammaticus`, `constantin_valdor`, `erebus`, `argel_tal`, `astelan`, `iacton_qruze`,
  `mersadie_oliton`, `eidolon`, `forrix`, `eldrad_ulthran`, `belisarius_cawl`, `maximus_thane`,
  `kor_phaeron`, `luther`, `zahariel`, `remus_ventanus`, `typhus` (the latter now Cross-Era-anchored
  via Case E once the alias lands).

**Locations (Phase 2) — alias-only candidates:**

- **None in this wave.** `Isstvan III` (freq 1, alias to `istvaan_iii` via Pass-10 alias) is the only
  location alias surfacing — confirmation only, no new alias-file work. Every other location is
  either direct (Pass-10 anchor) or a fresh 7c new-row promotion candidate.

### 7b. Big single-form cross-batch spines (one row each — not alias work)

These are **single, consistent** unresolved surface forms that recur cross-batch or have lore-iconic
weight. Each promotes to **one** new canonical row. Bulk of Phase-3 volume in this wave.

**Primarch spine — three remaining Primarchs land:**

- **`Sanguinius` (freq 10 — HH-0021/0027/0034/0046/0049/0050/0054/0055/0057/0063).** Blood Angels
  Primarch. Highest-freq unresolved character in the wave. New row `sanguinius`. primaryFactionId
  `blood_angels` (exists, direct §3). Spans the entire wave from *Fear to Tread* (Signus trial)
  through *Echoes of Eternity* (his Siege-of-Terra duel with Ka'Bandha).
- **`Jaghatai Khan` (freq 5 — HH-0028/0031/0036/0062/0076).** White Scars Primarch. New row
  `jaghatai_khan`. primaryFactionId `white_scars` (exists, direct §3). *Scars* / *Path of Heaven* /
  *Warhawk* arc.
- **`Perturabo` (freq 5 — HH-0023/0045/0051/0055/0057).** Iron Warriors Primarch. New row
  `perturabo`. primaryFactionId `iron_warriors` (exists, direct §3). *Angel Exterminatus* /
  *Tallarn* / *The First Wall* arc.

> With Sanguinius / Jaghatai / Perturabo landed, the **Primarch coverage is essentially complete** at
> Pass 11 — every named-and-on-page Primarch across HH-0021..HH-0080 has a row by the end of Phase 3
> (the Pass-10 set plus these three).

**Heresy supporting cast — freq ≥ 2 cross-batch:**

- **`Shiban Khan` (freq 4 — HH-0028/0036/0062/0076).** Wraight's White Scars POV across *Scars* /
  *Path of Heaven* / *Warhawk*. New row `shiban_khan`. primaryFactionId `white_scars`.
- **`Artellus Numeon` (freq 3 — HH-0026/0032/0050).** Salamanders captain; central to *Vulkan Lives*
  / *Deathfire* / *Born of Flame*. New row `artellus_numeon`. primaryFactionId `salamanders`.
- **`Euphrati Keeler` (freq 3 — HH-0064/0067/0069).** Imperial Saint of the Lectitio Divinitatus
  cult; *Garro: Knight of Grey* + *End and Death Vol. 3* + *Flames of Betrayal*. New row
  `euphrati_keeler`. primaryFactionId — civilian Remembrancer turned saint (no Legion);
  judgment call.
- **`Oll Persson` (freq 3 — HH-0025/0065/0066).** Perpetual; *Mark of Calth* / *End and Death Vol.
  1/2*. New row `oll_persson`. primaryFactionId — civilian perpetual, no Legion.
- **`Sigismund` (freq 3 — HH-0039/0055/0061).** Imperial Fists First Captain, later First Captain
  of the Black Templars; *Praetorian of Dorn* / *Solar War* / *Mortis*. New row `sigismund`.
  primaryFactionId `imperial_fists`.
- **`Aeonid Thiel` (freq 2 — HH-0031/0035).** Ultramarines sergeant; *Legacies of Betrayal* / *Eye
  of Terra* / *Know No Fear*-era. New row `aeonid_thiel`. primaryFactionId `ultramarines`.
- **`Arkhan Land` (freq 2 — HH-0041/0079).** Mechanicum tech-archeologist; *Master of Mankind* /
  *Bringer of Sorrow*. New row `arkhan_land`. primaryFactionId `mechanicus`.
- **`Bjorn` (freq 2 — HH-0033/0049).** Space Wolves; the future Bjorn the Fell-Handed. New row
  `bjorn`. primaryFactionId `space_wolves`. (Phase 3 may pick a fuller slug like `bjorn_the_fell_
  handed` if the longer-form-canonical pattern matches; this wave only surfaces bare `Bjorn`.)
- **`Ka'Bandha` (freq 2 — HH-0021/0063).** Bloodthirster of Khorne, Sanguinius's recurring foe;
  *Fear to Tread* / *Echoes of Eternity*. New row `ka_bandha` (slug strips apostrophe). primaryFactionId —
  Daemon, judgment: either `daemons` (the Pass-10 anchor) or a future `khorne_daemons` sub-row;
  default = `daemons`.
- **`Lotara Sarrin` (freq 2 — HH-0024/0078).** Captain of the *Conqueror*, World Eaters fleet;
  *Betrayer* / *A Rose Watered with Blood*. New row `lotara_sarrin`. primaryFactionId
  `world_eaters` (she's the mortal fleet-captain attached to the Legion).
- **`Sevatar` (freq 2 — HH-0022/0035).** Night Lords First Captain. New row `sevatar`. primaryFactionId
  `night_lords`.
- **`Shadrak Meduson` (freq 2 — HH-0043/0047).** Iron Hands captain post-Isstvan; *Shattered Legions*
  / *Old Earth*. New row `shadrak_meduson`. primaryFactionId `iron_hands`.
- **`Tybalt Marr` (freq 2 — HH-0043/0047).** Sons of Horus captain ("The Either"); *Shattered
  Legions* / *Old Earth* antagonist. New row `tybalt_marr`. primaryFactionId `sons_of_horus`.
- **`Tylos Rubio` (freq 2 — HH-0029/0042).** Former Thousand Sons librarian turned Knight-Errant
  under Garro; *Vengeful Spirit* / *Garro: Weapons of Fate*. New row `tylos_rubio`. primaryFactionId —
  judgment: `thousand_sons` (origin), `knights_errant` (current — Phase 1 has the new row from 7c),
  or `imperium`/empty. Recommendation: `knights_errant` if Phase 1 promotes it (current-state grain
  matches Garro's row pattern); else `thousand_sons`.
- **`Zardu Layak` (freq 2 — HH-0051/0056).** Word Bearers Crimson Lord; *Slaves to Darkness* / *The
  Lost and the Damned*. New row `zardu_layak`. primaryFactionId `word_bearers`.

### 7c. Per-axis promotion shape (freq-driven; owning phase justifies the exact set)

**Factions (Phase 1).** Strict freq ≥ 2 unresolved + curated freq-1 lore-iconic adds.

- **`Knights Errant` / `Knights-Errant` (combined freq 6).** See 7a Case B. → **new row
  `knights_errant`** + **alias `Knights-Errant` → `knights_errant`**. Lore-iconic — Malcador's
  loyalist Astartes cadre after the Heresy break, foundational for the Garro / Tylos Rubio /
  *Knight of Grey* arc.
- **`Daemons of Chaos` (freq 3).** See 7a Case A — alias to `daemons`. No new row.
- **`Adeptus Mechanicum` / `Mechanicus` (freq 1 each).** See 7a Case C — aliases to `mechanicus`. No
  new rows.
- **`House Devine` (freq 1, lore-iconic).** Imperial Knight house on Molech; pivotal *Vengeful
  Spirit* antagonist house. Default = **new row `house_devine`** (per-house grain; parity with the
  Pass-10 Knights of Taranis decision if that landed). Phase-1 judgment whether to promote — single
  freq-1 surface, lore-iconic but borderline.
- **`Lectitio Divinitatus` (freq 1, lore-iconic).** Imperial cult that worships the Emperor as
  a god; foundational to Keeler / Garro lore arc. Default = **new row `lectitio_divinitatus`**
  (curated freq-1 add — surfaces explicitly in *Garro: Weapons of Fate* and is referenced through
  the *End and Death* trilogy).
- **`Legio Ignatum` / `Legio Solaria` / `Legio Vulpa` (freq 1 each).** Titan Legions surfaced in
  *Titandeath* (HH-0053) and *Mortis* (HH-0061). Phase-1 parity-with-`legio_tempestus` and
  `legio_mortis` (which already exist as own rows) argues for per-Legio grain. Default = **new rows
  `legio_ignatum`, `legio_solaria`, `legio_vulpa`** (curated freq-1 — Titan Legion grain consistent
  with the existing convention). Phase-1 judgment.
- **`Sanguinary Guard` (freq 1, lore-iconic).** Blood Angels honor-guard formation. Single
  freq-1 surface in *Echoes of Eternity*; possible promotion as Blood-Angels-sub-faction grain, or
  leave unresolved long-tail. Phase-1 judgment.
- **`Selenar` / `Selenar Gene-Cult` (freq 1 each).** Same entity — the Lunar gene-cult per *The
  Sons of Selenar*; surface variants `Selenar` (HH-0037) and `Selenar Gene-Cult` (HH-0058). →
  **one new row `selenar_gene_cult`** + **alias `Selenar` → `selenar_gene_cult`**. Curated
  lore-iconic (single-novella-but-foundational-Luna-arc) freq-1.
- **`Thunder Warriors` (freq 1, lore-iconic).** Proto-Astartes of the Unification Wars; surface in
  *Dreams of Unity* (HH-0074 — explicitly a Thunder-Warrior-era pre-Heresy retrospective). Default
  = **new row `thunder_warriors`** (curated freq-1 — foundational Imperial military history).
- **`Daemons of Khorne` (freq 1).** Sub-faction grain under `daemons`. Recommendation: **alias
  `Daemons of Khorne` → `daemons`** (sub-faction grain not yet established in the resolver; flat
  alias to the parent for now). Phase-1 may instead promote `khorne_daemons` if it wants the grain
  — judgment call.

> Phase-1 promotion shape (recommended): **6 alias adds** (Daemons of Chaos / Knights-Errant /
> Adeptus Mechanicum / Mechanicus / Selenar / Daemons of Khorne, all to existing or newly-added
> anchors) + **6..9 new rows** (`knights_errant` strict-freq + curated freq-1: `lectitio_divinitatus`
> + 3× Titan Legions + `selenar_gene_cult` + `thunder_warriors` + judgment calls on `house_devine` /
> `sanguinary_guard`). The strict-freq floor is 1 new row (`knights_errant`); the curated lore-iconic
> ceiling lands ~9.

**Locations (Phase 2).** Strict freq ≥ 2 unresolved + curated freq-1 lore-iconic:

Strict freq ≥ 2:

- **`Sol System` (freq 4, unresolved).** System-grain canonical row — parent of Terra / Luna / Mars
  / Pluto / Saturn etc. Pivotal to the Solar War / Siege of Terra. Default = **new row `sol_system`**
  (system grain consistent with existing system rows). May add alias `Sol` if it surfaces later.
- **`Vengeful Spirit` (freq 4, unresolved).** Horus's flagship — vessel-as-location convention per
  runbook §3 Phase 2. Default = **new row `vengeful_spirit`** with **`tags: ['vessel']`,
  `gx: null, gy: null`** (the convention). Lore-iconic Heresy-arc vessel.
- **`Lion's Gate Spaceport` (freq 3, lore-iconic).** Terra sub-locale; foundational Siege of Terra
  battlefield. Default = **new row `lions_gate_spaceport`** (Terra sub-location grain).
- **`Chondax` (freq 2).** White Scars war-world; *Scars* / *Legacies of Betrayal*. → **new row
  `chondax`**.
- **`Molech` (freq 2, lore-iconic).** Knight-world; central to *Vengeful Spirit* + *Old Wounds, New
  Scars*. → **new row `molech`**.
- **`Pluto` (freq 2).** Sol-System outpost; *Praetorian of Dorn* + *Solar War*. → **new row `pluto`**.
- **`Tallarn` (freq 2, lore-iconic).** Iron Warriors siege world (the eponymous Tallarn battle); also
  the W40K Tallarn desert-world origin. → **new row `tallarn`**.

Curated freq ≥ 1 lore-iconic:

- **`Nuceria` (freq 1, lore-iconic).** Angron's homeworld; *Betrayer* climax. → **new row `nuceria`**.
- **`Signus Prime` / `Signus Cluster` (freq 1 each, lore-iconic).** Blood Angels Signus arc; *Fear to
  Tread*. → **new row `signus_prime`** (world grain) + **new row `signus_cluster`** (cluster /
  sub-sector grain, parent of Signus Prime). Or just `signus_prime` + leave `Signus Cluster`
  unresolved if Phase 2 doesn't want cluster-grain. Judgment.
- **`Pythos` (freq 1).** Eponymous *The Damnation of Pythos* world. → **new row `pythos`**.
- **`Iydris` (freq 1, lore-iconic).** Eldar maiden-world climax of *Angel Exterminatus*. → **new
  row `iydris`**. Curated.
- **`Mount Pharos` (freq 1) / `Mount Deathfire` (freq 1).** Sub-locations of Sotha / Nocturne
  respectively; eponymous to *Pharos* / *Deathfire*. Default = **new rows `mount_pharos`,
  `mount_deathfire`** (Phase-2 sub-location grain), or leave unresolved long-tail. Judgment.
- **`Nostramo` (freq 1).** Night Lords homeworld (destroyed by Curze pre-Heresy). → **new row
  `nostramo`**.
- **`Chogoris` (freq 1).** White Scars homeworld. → **new row `chogoris`**.
- **`Armatura` (freq 1, lore-iconic).** World Eaters training world; *Betrayer*. → **new row
  `armatura`**.
- **`Beta-Garmon` (freq 1, lore-iconic).** Titandeath system (the largest Titan engagement of the
  Heresy); *Titandeath*. → **new row `beta_garmon`**.
- **Imperial Palace / Siege-of-Terra sub-locales (freq 1 each):** `Eternity Gate`, `Eternity Wall
  Spaceport`, `Saturnine Gate`, `Mercury Wall`, `Delphic Battlement`, `Golden Throne`,
  `Sanctum Imperialis`. Each is a Palace sub-location, lore-iconic to the SoT arc. Phase-2 judgment
  on per-sub-location grain — recommendation: **promote all 7** as new rows (curated lore-iconic,
  consistent with the Pass-10 `hollow_mountain`-style Terra-sub-location precedent). Phase-2 may
  collapse some into `imperial_palace` if grain feels too fine.
- **`Kalium Gate` (freq 1).** Webway / Path-of-Heaven battle locale. Phase-2 judgment whether to
  promote — single freq-1, semi-generic.
- **`Holst Aspyce`, `Phorus`, `Traoris`, `Trisolian`, `Alaxxes Nebula`, `One Forty Twenty`,
  `Madail`, `Ruinstorm`** — each freq-1, mostly unfamiliar / niche / non-world (e.g. `Ruinstorm` is
  the warp-phenomenon name, not a location; `Madail` may be a character mis-flagged as location).
  Phase-2 judgment per-row; default = **leave unresolved** unless individual lore-significance is
  obvious to Phase 2.

> Phase-2 promotion shape (recommended): **0 alias adds** + **7 strict-freq new rows** (`sol_system`,
> `vengeful_spirit`, `lions_gate_spaceport`, `chondax`, `molech`, `pluto`, `tallarn`) + **8..20
> curated freq-1 new rows** (the lore-iconic list above; Palace sub-locales are the largest
> discretion bloc). Conservative floor: 14 new rows; ceiling ~22.

**Characters (Phase 3).** See 7a (6 alias adds: Horus Lupercal / Calas Typhon / Corvus Corax /
Lorgar Aurelian / Emperor of Mankind / Yesugei) + 7b (~17 new rows from freq ≥ 2). Plus the freq-1
long tail (~30 unresolved single-surface names; many lore-iconic, many not).

Curated lore-iconic freq-1 new rows (Phase-3 discretion):

- **Imperial Fists / Siege defenders:** `alexis_polux` (HH-0022 *Shadows of Treachery*),
  `archamus` (HH-0039 Dorn's huscarl), `maximus_thane` (already direct), `su_kassen` (HH-0055
  Imperial Navy admiral, Solar War — possibly Imperial Navy primaryFaction).
- **Blood Angels:** `azkaellon` (HH-0063 Sanguinary Guard captain), `raldoron` (HH-0021 First
  Captain), `meros` (HH-0021 Apothecary), `zephon` (HH-0079).
- **Word Bearers / traitor cast:** `madail` (HH-0021 if character, see locations note), `tolbek`
  (HH-0044 Crimson King), `menkaura` (HH-0044), `sanakht` (HH-0044), `hathor_maat` (HH-0044
  Pavoni captain).
- **Thousand Sons:** `hathor_maat`, `sanakht`, `menkaura`, `tolbek` — *The Crimson King* cluster.
- **White Scars / Khan cluster:** `torghun_khan` (HH-0028).
- **Iron Warriors / Perturabo cluster:** `rylanor` (HH-0023 Emperor's Children Ancient; lore-iconic
  — the dreadnought-trap of *Angel Exterminatus*), `sharrowkyn` (HH-0023 Raven Guard sniper —
  *Angel Exterminatus*).
- **Salamanders / Vulkan cluster:** `galba` (HH-0030), `khi_dem` (HH-0030).
- **Iron Hands:** `bion_henricos` (HH-0043 *Shattered Legions*), `barthusa_narek` (HH-0047 *Old
  Earth*; Word Bearers-defector POV — Iron-Hands-aligned).
- **Mechanicum:** `kane` (HH-0041), `diocletian_coros` (HH-0041 *Master of Mankind*),
  `ra_endymion` (HH-0041), `ekaddon` (HH-0051), `volk` (HH-0051), `maloghurst_the_twisted`
  (HH-0051 Sons of Horus equerry — strong lore-iconic).
- **Night Lords:** `gendor_skraivok` (HH-0056 "Painted Count"), `krukesh_the_pale` (HH-0034).
- **Knights-Errant / Garro:** `macer_varren` (HH-0042), `iaeo` (HH-0045 — Assassin, possibly), `hrend`
  (HH-0045).
- **Loyalist / civilian / Custodes:** `agapito` (HH-0040 Raven Guard captain), `katsuhiro`
  (HH-0056 Imperial Army trooper), `oberdeii` (HH-0034 — *Pharos*), `samonas` (HH-0072),
  `dahren_heruk` (HH-0074), `kabe` (HH-0074), `kano` (HH-0021), `terent_hartekk` (HH-0053),
  `ilya_ravallion` (HH-0036), `rhydia_erephren` (HH-0030), `mohana_mankata_vi` (HH-0053 — Sister
  of Silence Knight-Centura; her full name suggests Talons-of-the-Emperor primaryFactionId),
  `esha_ani_mohana` (HH-0053 — note possible relation to Mohana Mankata Vi; Phase 3 may pick
  full canonical or alias-consolidate if same person), `durun_atticus` (HH-0030 Iron Hands captain
  — *Damnation of Pythos*).
- **Daemon antagonists:** `madail` (HH-0021 if character — Daemonic antagonist in *Fear to Tread*).
- **`alivia_sureka` (HH-0076).** Perpetual; *Old Wounds, New Scars*. Worth promoting (perpetual
  thread, parallels Oll Persson).

> Phase-3 promotion shape (recommended): **6 alias adds** (7a Cross-Era / consolidation cases) +
> **15 freq-2 new rows** (7b cross-batch spines) + **3 Primarch new rows** (Sanguinius / Jaghatai /
> Perturabo) + **~25–45 curated freq-1 new rows** (lore-iconic list above, Phase-3 judgment on the
> exact set). The bulk-by-far is the freq-1 long tail; the strict-freq floor for new rows is 18
> (the 15 freq-2 + 3 Primarchs); the curated lore-iconic ceiling lands ~60. **This is the largest
> Phase-3 promotion pass to date** if Phase 3 takes a generous freq-1 cut — bigger than Pass 10's
> ~41-row HH-bootstrap.

### 7d. needs-decision candidates (expected: 0 hard blockers)

- **Forward-ref Guard post-Brief-101: out-of-range is now informational.** Pass 10's §7d flagged
  the range-aware forward-ref Guard as the only architectural concern; Brief 101 (commit `1126e45`)
  landed the reason-split — `out-of-range` exits ok, `unknown-work` blocks. For Pass 11 this
  translates to a deterministic Phase-4a expectation: the *Shadows of Treachery* anthology
  (HH-0022) has 7 known constituents (HH-0124/0125/0170/0172/0241/0242/+1) all outside the
  cumulative apply range `hh 1..8` — the Guard should report **7 out-of-range refs (informational),
  0 unknown-work refs (clean)**. The other 12 anthologies in §5 have no roster constituents at all
  (they will not surface any forward-ref work; collection-edge logic simply has nothing to defer).
  **Phase 4a verifies** the counts match this expectation; mismatch (`unknown-work > 0`) is a
  `## Needs decision` stop. **Not a hard block** — the Guard is wired correctly per Pass-10
  experience.
- **`Mohana Mankata Vi` ↔ `Esha Ani Mohana` — possible same-person check (Phase-3 disambig).** Both
  surface freq 1 in HH-0053 *Titandeath*. The name-overlap (`Mohana`) is suggestive; Black Library
  lore names Mohana Mankata Vi as the Knight-Centura of the Talons of the Emperor. Phase 3 should
  verify in-source whether these are two distinct characters or one with a surface-form variant.
  **Likely** two distinct characters (the surname-vs-given-name pattern fits the Sisters of Silence
  naming convention), but Phase 3 confirms. If same, alias-consolidate; if distinct, two rows.
  **Not a hard block** — Phase 3 picks.
- **`Madail` — axis disambig.** Surfaces as `Madail` freq 1 in HH-0021 *Fear to Tread*. Black Library
  lore: Madail is a Daemonic antagonist (the "Lord of Hosts" Daemon in the Signus campaign). Phase 3
  promotes as character row `madail`. **Not** a location. **Not a hard block.**
- **`Ruinstorm` — axis disambig.** Surfaces as a location surface form (freq 1, HH-0032 *Deathfire*),
  but in BL lore the Ruinstorm is the warp-storm phenomenon Lorgar / Erebus unleashed across the
  galaxy (also the title of HH-0046 *Ruinstorm*). Default Phase-2 call: **leave unresolved**
  (warp-phenomenon, not a location-row grain). The override author may have used the surface form
  loosely; Phase 2 leaves it long-tail. **Not a hard block.**
- **`Selenar` ↔ `Selenar Gene-Cult` Phase-1 grain.** 7c recommends one row + alias. Phase 1 may
  instead pick two distinct rows if "the Selenar" (the species / people) vs "the Selenar Gene-Cult"
  (the political organization) feels like two-axis grain. Recommendation stands at **one row +
  alias** (cleanest grain for a single freq-1 source); Phase 1 judgment. **Not a hard block.**
- **`House Devine` / Knight-house grain.** Phase 1 must decide whether to keep per-Knight-house
  grain (parity with `legio_tempestus` / new `legio_mortis` per-Titan-Legion grain) or roll up into
  `imperial_knights`. Recommendation: **per-house row `house_devine`** (curated lore-iconic), but
  Phase 1 may consolidate. **Not a hard block.**
- **`Vulkan Lives` Conqueror question.** Phase-2 grain on the `Vengeful Spirit` vessel row: should
  Black Library's other named HH-arc ships (*Eisenstein* HH-0004, *Furious Abyss* HH-0008,
  *Conqueror* HH-0024, *Macragge's Honour*, *Mournival*) **also** get vessel rows in this wave when
  they're not surface-form-named in §3 as locations? Recommendation: **no** — only promote vessel
  rows when the surface form appears in §3 as a location (the wave authoring decision). This wave
  promotes `vengeful_spirit` only because it's freq 4 in the location aggregate. Future waves can
  add more vessels as they surface. **Not a hard block.**
- **`Ashes of the Imperium` author typo.** HH-0080 has `data_conflict:authors->Chris Wraight` —
  roster claims `Charles Wraight`, override authors recommend the canonical `Chris Wraight` (the
  actual Black Library author of all the *Restorer* / Ashes-arc stories). Phase 4a applies the
  override as written; the roster-side typo is upstream of this pass. **Not a Phase-1/2/3 concern**,
  flagged so Phase 4b's verify cockpit can confirm the override's author-field correction landed
  (book-row should display `Chris Wraight` post-apply).
- **`Era Of Ruin` / `Flames of Betrayal` / `Garro: Weapons of Fate` format conflicts.** HH-0068
  (`format->anthology`), HH-0069 (`format->omnibus`), HH-0042 (`format->novel`) — roster claims one
  format, override-author recommends another. Phase 4a applies the override; format mismatches
  surface in the apply digest. **Not a Phase-1/2/3 concern.**
- **`Sons of Selenar` title conflict.** HH-0058 `data_conflict:title->Sons of the Selenar` — roster
  has `The Sons of Selenar` (with leading "The"), override author recommends `Sons of the Selenar`
  (different word order). Phase 4a applies the override; title mismatch is upstream of resolver
  axes. **Not a Phase-1/2/3 concern.**
- **No data_conflict that blocks resolver axes.** §6's 14 flag rows are all `low_confidence:*` or
  `data_conflict:{format,title,authors}` — none reach into resolver-canonical (faction / location /
  character ID) territory. The `low_confidence` flags are advisory carry-through for the audit
  cockpit; they don't gate Phase 1/2/3 work.
- **Cumulative milestone — HH-domain mid-wave.** Per project state: HH bootstrap (Pass 10) put 20
  HH-books in the layer; this wave adds 60 more, reaching **80 / X HH** where X is the full
  HH-domain target (the loop-helper detector knows the total; Phase 4b can read it from `db-counts`
  / verify-pass output). The Phase 4b impl-report should flag this as the **HH mid-arc milestone**,
  including the *Siege of Terra* opening (the *Solar War* through *End and Death Vol. 3* arc), and
  carry the post-Heresy-bridge advisories (HH-0068/0069/0080) for the next HH wave to assess.
- **Cross-axis surface-form conflicts** — **none in this wave** per §4. (Pass-10 advisory: a future
  *Fulgrim*-adjacent wave with both `Laer`/`Laeran` may surface; this wave does not face the case.)
  No `Selenar` (faction) vs. `Selenar` (location) ambiguity either — Selenar appears only on the
  faction axis here.

The per-axis promotion extents (7c), the 7a Cross-Era + alias-consolidation cases, and the 7b new-row
character spines are in-phase **judgments**, justified in each phase report — none escalates to a
hard block under current evidence. The Brief-091 forward-ref Guard is now **wired correctly** (Brief
101 reason-split landed), so the previously-noted architectural concern is closed; Phase 4a only
verifies the expected `out-of-range=7, unknown-work=0` counts.
