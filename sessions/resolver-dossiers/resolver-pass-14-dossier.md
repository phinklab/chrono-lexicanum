# Resolver-Pass 14 — Phase-0 Dossier (ssot-hh-021..025 / HH-0201..HH-0250)

> Deterministic cross-axis context for the three axis-phases (Factions / Locations / Characters) + the
> Phase-4 integration. **Sections 2–6 are the mechanical output** of
> `scripts/aggregate-surface-forms.ts --config scripts/resolver-pass.config.json` (read-only, idempotent —
> re-running on the committed override files + seed-data yields byte-identical output). **Section 7 is the
> only LLM-synthesized part** (cross-batch alias-consolidation + needs-decision candidates; this wave is
> the *Heresy-era short-fiction tail* + the *original-six audio-drama bloc* + the *first three HH omnibus
> entries*, so Section 7 leans on five faction-axis Mechanicum / Titan-Legion sub-faction promotions, a
> location-axis Heresy-Primarch-homeworld + vessel-grain promotion bloc, two strict-cross-batch character
> spines, one strict freq-2 character alias add — plus a noteworthy anthology-cascade question for the
> HH-0234/HH-0235/HH-0236 ↔ HH-0237 audio-drama bundle). Phases 1–4 read THIS file, not the 5 override
> files or the loop-log. Brief-free pass (Brief 094 lean contract); the operative spec is
> [`sessions/resolver-pass-runbook.md`](../resolver-pass-runbook.md) + the per-pass config — no architect
> brief is read to run a phase.

## 1. Scope header

- **Wave:** `ssot-hh-021..025` (5 loop batches, 10 books × 5 = **50 books** — the audio-drama /
  e-short tail of the Heresy series + the first three HH omnibus entries, picking up directly
  after the Pass-13 wave of 60 books at HH-0141..HH-0200). Wave size confirmed by the loop-helper
  after Pass-13 settled cleanly (works 815/cumulativeAfter after ssot-hh-025).
- **IDs:** `HH-0201..HH-0250` (50 books). Composition is the **Heresy-era short-fiction tail** —
  predominantly Black Library e-shorts (ssot-hh-021/022/023, all `short_story` format), the
  **first three HH omnibus volumes** (ssot-hh-024 HH-0231/HH-0232/HH-0233, format `omnibus`), seven
  audio dramas (ssot-hh-024 HH-0234..HH-0240, mid-Heresy character pieces) and the **original-six
  HH audio-drama bloc plus the four early Garro / Heresy-flagship audio dramas** (ssot-hh-025
  HH-0241..HH-0250, the early-Heresy audio-drama foundation — *The Dark King*, *The Lightning
  Tower*, *Raven's Flight*, *Garro: Legion of One*, *Butcher's Nails*, *Grey Angel*, *Burden of
  Duty*, *Garro: Sword of Truth*, *Warmaster*, *Strike and Fade*):
  - **ssot-hh-021 / HH-0201..HH-0210** = the **Dark-Angels / Knights-Errant / Iron-Hand-vantage
    short-story cluster**: By the Lion's Command (Corswain confronts the neutral system Terra
    Nullius pursuing Typhon's Death Guard), All That Remains (Imperial Army survivors aboard a
    warp-marooned hospital transport seed the Knights-Errant programme — `low_confidence:characters`
    + `low_confidence:locations`), The Phoenician (dying Gabriel Santar's vantage on the
    Fulgrim/Ferrus duel at Isstvan V), Artefacts (Vulkan-and-son framing — `low_confidence:locations`),
    Ghosts Speak Not & Patience (paired Knights-Errant Garro shorts), Tallarn: Siren (Marshal Lycus
    underground siege — `low_confidence:characters`), Inheritor (Torquill Eliphas / Word Bearers /
    Ark of Testimony on Kronus), Blackshield (Khorak vs Crysos Morturg — `low_confidence:locations`),
    Myriad (Mechanicum guerrilla cell on Mars finds a Kastelan robot — `low_confidence:characters`),
    Into Exile (Imperial Fists extract Arkhan Land from Mars — `data_conflict:slug->into-exile`).
  - **ssot-hh-022 / HH-0211..HH-0220** = the **mid-Heresy-Advent-shorts cluster**: The Grey
    Raven (Raven-Guard character beat hooking into *Weregeld*), The Painted Count (shipboard on
    the Nightfall + Sotha supporting), Exocytosis (Angels-of-Caliban sequel on Zaramund),
    The Last Son of Prospero (Arvida-saved-by-Malcador), Ordo Sinister (female pariah-princeps
    Hydragyrum on Terra defending Imperial Webway), The Ember Wolves (Titan-vs-Titan from the
    traitor princeps' viewpoint — Legio Audax vs Legio Castigatra), The Laurel of Defiance
    (ceremony-on-Macragge frame with Astagar flashback), Immortal Duty (Iron-Hands Medusan
    Immortal boarding at Isstvan V), Champion of Oaths (Sigismund vignette on Terra —
    `data_conflict:releaseYear->2018`), Child of Chaos (Erebus monologue from Davin's ruined
    temple with Colchisian flashback — `data_conflict:releaseYear->2018`).
  - **ssot-hh-023 / HH-0221..HH-0230** = the **Shadow-Crusade / Knights-Errant / redemption-arc
    cluster**: Massacre (Talos / Night Lords / First Claw at Isstvan V dropsite), Two Metaphysical
    Blades (Apollonian/Dionysian spear-frame for Valdor and Russ), Prologue to Nikaea (Malcador on
    Thawra — `low_confidence:factions`), Abyssal (civilian POV inside Black Ship Irkalla),
    Lantern's Light (Mortarion on Barbarus pre-Crusade), The Serpent's Dance (Amendera Kendel +
    Helig Gallor vs Alpha Legion in Jovian shipyards), The Lightning Hall (*Mechanicum* sequel —
    House Taranis vs Kelbor-Hal on Mars), Eater of Dreams (Fel Zharost + Macer Varren take the
    Grey on Albia), Bloodhowl (Space Wolves Jorin Bloodhowl internal fracture —
    `low_confidence:locations`), Amor Fati (post-decapitation Eidolon chaos-POV seeks
    Emperor's-Children geneseed — `low_confidence:locations`).
  - **ssot-hh-024 / HH-0231..HH-0240** = the **first-three-HH-omnibi + mid-Heresy audio-drama
    bloc**: Crusade's End (HH Omnibus #1 — *Horus Rising* + *False Gods* + *Galaxy in Flames* +
    *Flight of the Eisenstein* + interleaved shorts), The Razing of Prospero (HH Omnibus #3 —
    *A Thousand Sons* + *Prospero Burns* + supporting shorts), The Last Phoenix (HH Omnibus #2 —
    *Fulgrim* + *Angel Exterminatus* + supporting novellas), Perturabo: Stone and Iron (Robbie
    MacNiven Iron-Warriors audio drama — `low_confidence:locations`), Malcador: First Lord of the
    Imperium (Goulding two-hander Malcador / Sibel Niasta), Konrad Curze: A Lesson in Darkness
    (Ian St. Martin Night-Lords audio drama on Piamen with iterator Nivalus), The Lords of Terra
    (audio anthology re-issuing HH-0234/HH-0235/HH-0236 — `data_conflict:format->anthology`),
    Illyrium (Tarasha Euten + Ammon co-POV on Macragge / Illyrium province / Macragge's Honour),
    The Revelation of the Word (Word-Bearer chaplain + Lectitio worshipper on unnamed Five-Hundred-
    Worlds planet — `low_confidence:locations`), Morningstar (Magnus / Thousand Sons on Tizca and
    Prospero).
  - **ssot-hh-025 / HH-0241..HH-0250** = the **original-six HH audio-drama bloc + Garro/Eisenstein
    + Strike and Fade**: The Dark King (Curze/Dorn pre-Heresy philosophical clash, the foundational
    Heresy audio drama from 2007), The Lightning Tower (Dorn introspection on Terra, 2007 pair to
    *The Dark King*), Raven's Flight (Isstvan V survival, Corax + Branne + Marcus Valerius —
    Branne already aliased to `branne_nev`), Garro: Legion of One (Knights-Errant recover Loken
    on Isstvan III — surface form `Knights-Errant` carries plus origin-Legion supporting cast Death
    Guard / Ultramarines / Luna Wolves for the three operatives), Butcher's Nails (Angron/Lorgar
    tension en route to Calth, no specific planet), Grey Angel (Loken on Caliban testing Dark
    Angels' loyalty), Burden of Duty (Garro on the Phalanx recruiting librarians, including Yored
    Massak), Garro: Sword of Truth (investigation across Sol System), Warmaster (Horus monologue
    on the Vengeful Spirit), Strike and Fade (Salamanders ambush on Isstvan V —
    `low_confidence:characters`).
- **Cumulative:** **250 HH books** in the HH authority layer after this pass (200 applied through
  Pass 13 + 50 new in this wave). **HH 250-book milestone** — first-time crossing the 250-book
  mark in the HH layer. W40K side stays sealed at 565/565 books — out of scope for this pass.
- **Resolver baseline (pre-Pass-14 reference rows + aliases, emitted by the aggregator):** factions
  **194** rows / **71** aliases · locations **275** / **20** · characters **474** / **60**. The
  Pass-13 deltas vs. the Pass-13 baseline (190/70 · 267/19 · 457/56) are visible: **+4 faction rows
  / +1 faction alias / +8 location rows / +1 location alias / +17 character rows / +4 character
  aliases**. Pass-13 absorbed the *Tales of Heresy* / *Age of Darkness* supporting-cast bloc + the
  short-form alias cleanup (Maloghurst short-form, Nassir Amit full-form, Revuel Arvida new row,
  The Emperor of Mankind variant), so Pass-14's surface set lands on a thick anchor catalog: **every
  freq ≥ 2 Primarch surface in this wave catches its Pass-10/11/12/13 row direct**, **every freq ≥
  2 Legion / sub-Legion faction in this wave catches its Pass-10/11/12/13 row or alias direct**, and
  the Pass-13 Cross-Era alias chains (Knights-Errant / Sisters of Silence / Luna Wolves / Mechanicum /
  Dark Eldar / Imperial Army / Horus Lupercal / Lorgar Aurelian / Lucius / Khârn / Maloghurst /
  Typhon / Calas Typhon) all confirmed by §3. The new work in §7a is one **strict-freq-2 character
  alias add** (`the Emperor` lowercase-article variant to `the_emperor` row — the Pass-13 Case-E
  *capitalized* variant `The Emperor of Mankind` extended to the bare lowercase-article form), plus
  one **strict-freq-2 cross-batch character spine** (`Helig Gallor` — the Knights-Errant agent
  paired with Garro in HH-0205 and with Amendera Kendel in HH-0226), plus one **strict freq-3
  cross-batch character spine** (`Macer Varren` — the World-Eater turned Knights-Errant figure
  recurring across HH-0228 / HH-0244 / HH-0248).
- **Apply range Phase 4:** `hh 1..25` (config `aggregator.applyRange` = `{ domain: "hh", from: 1,
  to: 25 }`). Idempotent delete-then-insert re-apply of `ssot-hh-001..020` (already applied at
  Pass 10–13, no churn — the data has not changed) + first-time apply of `ssot-hh-021..025` (50
  new books). Domain-aware Trias-Batch-Range tuples for the apply-side trio
  (`apply-override-dry.ts` / `test-resolver-coverage.ts` / `test-resolver-data-integrity.ts`) are
  appended with the **five new `{ domain: "hh", n: "021" }` .. `{ domain: "hh", n: "025" }`
  entries** alongside the existing W40K-001..057 + HH-001..020 set (runbook §3 Phase 4a + config
  `phase-4a-integration.trigger`).
- **Clusters (observed; config has no `clusters` field this pass, so §3's cluster column stays `?`):**
  - `ssot-hh-021` → **HH-0201..HH-0210 — Dark-Angels / Knights-Errant / Iron-Hand-vantage
    short-story cluster.** Ten single-author Black Library e-shorts spanning the late-Heresy
    Dark Angels arc (Corswain confronting Terra Nullius), the Knights-Errant programme genesis
    (HH-0202 e-shorts, HH-0205 paired Garro pieces, HH-0210 Imperial Fists extracting Arkhan
    Land), the Word Bearers Shadow Crusade (HH-0207 Inheritor / Templum Daemonarchia on Kronus),
    a Tallarn underground (HH-0206 Siren), a Blackshield POV (HH-0208) and the loyalist
    Mechanicum guerrilla cell on Mars (HH-0209 Myriad / Legio Cybernetica direct sequel to
    *Cybernetica*). Three `low_confidence` flags this batch (HH-0202 dual, HH-0206 characters,
    HH-0208 locations, HH-0209 characters) plus one `data_conflict:slug` (HH-0210
    `into-exhile` ↔ `into-exile`).
  - `ssot-hh-022` → **HH-0211..HH-0220 — mid-Heresy-Advent-shorts cluster.** Ten well-documented
    Advent shorts — Raven Guard *Grey Raven* hook-to-*Weregeld*, Night Lords *Painted Count* on
    the Nightfall, Dark Angels *Exocytosis* / *Angels of Caliban* sequel on Zaramund, *The Last
    Son of Prospero* (Arvida confirmation surface — the Pass-13 7a Case-D `Revuel Arvida`
    namesake), *Ordo Sinister* (Hydragyrum pariah-princeps + Borealis Thoon + Imperial Webway —
    Mechanicum-Ordo-Sinister direct surface in the wave's most lore-iconic sub-faction prompt),
    *The Ember Wolves* (Legio Audax vs Legio Castigatra Titan duel — paired Mechanicum Titan-
    Legion surface forms), *Laurel of Defiance* (Astagar flashback echo of HH-0141 *Sedition's
    Gate*), *Immortal Duty* (Iron-Hands Medusan boarding at Isstvan V), *Champion of Oaths*
    (Sigismund vignette on Terra — `data_conflict:releaseYear->2018`) and *Child of Chaos*
    (Erebus monologue from Davin's ruined temple with Colchisian flashback —
    `data_conflict:releaseYear->2018`).
  - `ssot-hh-023` → **HH-0221..HH-0230 — Shadow-Crusade / Knights-Errant / redemption-arc
    cluster.** Ten shorts — *Massacre* (Talos / First Claw / Night Lords at Isstvan V dropsite),
    *Two Metaphysical Blades* (Valdor + Russ century-spanning spear-frame — protagonist_class
    `multi`), *Prologue to Nikaea* (Malcador on Thawra — `low_confidence:factions`), *Abyssal*
    (civilian POV inside Black Ship Irkalla — Sisters-of-Silence vessel-grain surface),
    *Lantern's Light* (Mortarion on Barbarus pre-Crusade — the namesake bare-name Primarch
    surface direct on the Pass-10 `mortarion` row), *The Serpent's Dance* (**Helig Gallor** +
    Amendera Kendel vs Alpha Legion in Jovian shipyards — the 7b cross-batch spine catches its
    second hit here), *The Lightning Hall* (*Mechanicum* sequel — House Taranis vs Kelbor-Hal
    on Mars — Knight-House grain surface in the wave's most lore-iconic Knight-House prompt),
    *Eater of Dreams* (**Fel Zharost** + **Macer Varren** take the Grey on Albia — `Fel Zharost`
    confirmation Pass-13-promoted row, `Macer Varren` 7b spine catches its first hit here +
    Terran-region `Albia` sub-locale), *Bloodhowl* (Space Wolves Jorin Bloodhowl internal
    fracture — `low_confidence:locations`), *Amor Fati* (post-decapitation Eidolon chaos-POV
    on Emperor's-Children geneseed quest — `low_confidence:locations`).
  - `ssot-hh-024` → **HH-0231..HH-0240 — first-three-HH-omnibi + mid-Heresy audio-drama bloc.**
    Three omnibi (Crusade's End / The Razing of Prospero / The Last Phoenix — known constituents
    HH-0001..HH-0004 / HH-0012+HH-0015 / HH-0005+HH-0023+HH-0044, all in-range for the
    forward-ref Guard — see 7d), then seven audio dramas: *Perturabo: Stone and Iron* (Iron-
    Warriors-Primarch + Iron-Warriors-sub-faction on an unnamed Greenskin world —
    `low_confidence:locations`), *Malcador: First Lord of the Imperium* (two-hander Malcador +
    **Sibel Niasta** — Niasta carries half the script weight; Adeptus Astra Telepathica surface),
    *Konrad Curze: A Lesson in Darkness* (Night-Lords-Primarch + **Piamen** compliance world +
    iterator **Nivalus**), *The Lords of Terra* (audio anthology re-issuing HH-0234/HH-0235/
    HH-0236 — `data_conflict:format->anthology`; the **anthology-cascade question** for §7d),
    *Illyrium* (Ultramarines + Tarasha Euten + Ammon on Macragge / **Illyrium** province /
    **Macragge's Honour** flagship), *The Revelation of the Word* (Word-Bearer chaplain on
    Five-Hundred-Worlds — `low_confidence:locations`), *Morningstar* (Magnus / Thousand Sons on
    Tizca and Prospero — direct continuations of the Pass-12 Tizca / Prospero canonical rows).
  - `ssot-hh-025` → **HH-0241..HH-0250 — original-six HH audio-drama bloc + Garro/Eisenstein +
    Strike and Fade.** Ten audio dramas — the original-six 2007–2012 audio-drama foundation:
    *The Dark King* (Curze/Dorn 2007 — unnamed compliant world, locations empty), *The Lightning
    Tower* (Dorn 2007 on Terra — clean primary location set), *Raven's Flight* (2010 Isstvan V
    survival, Corax + **Branne** alias-via-`branne_nev`-Pass-10 + Marcus Valerius confirmation
    Pass-13-promoted row), *Garro: Legion of One* (2011 Knights-Errant recover Loken on Isstvan
    III — surface `Knights-Errant` carries plus the three operative origin-Legions Death
    Guard / Ultramarines / Luna Wolves; Garro Pass-? row + Tylos Rubio Pass-11 row),
    *Butcher's Nails* (2012 Angron/Lorgar tension en route to Calth — no setting, pov_side
    `chaos`), *Grey Angel* (2012 Loken on Caliban testing Dark Angels' loyalty), *Burden of
    Duty* (2012 Garro on the Phalanx recruiting librarians, including **Yored Massak**),
    *Garro: Sword of Truth* (2012 investigation across Sol System), *Warmaster* (2012 nine-
    minute Horus monologue on the Vengeful Spirit), *Strike and Fade* (2012 Salamanders ambush
    on Isstvan V — `low_confidence:characters`). **`Knights-Errant` cross-batch surge** — five
    hits across HH-0226 / HH-0228 (already-Pass-9-aliased) / HH-0244 / HH-0246-side / HH-0248
    confirmations.

## 2. Book table (50 entries)

| externalBookId | slug | title | format | author | year | batch | cluster | flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HH-0201 | `by-the-lions-command` | *By the Lion's Command* | short_story | Gav Thorpe | 2015 | `ssot-hh-021` | `?` | — |
| HH-0202 | `all-that-remains` | *All That Remains* | short_story | James Swallow | 2015 | `ssot-hh-021` | `?` | `low_confidence:characters`; `low_confidence:locations` |
| HH-0203 | `the-phoenician` | *The Phoenician* | short_story | Nick Kyme | 2015 | `ssot-hh-021` | `?` | — |
| HH-0204 | `artefacts` | *Artefacts* | short_story | Nick Kyme | 2015 | `ssot-hh-021` | `?` | `low_confidence:locations` |
| HH-0205 | `ghosts-speak-not-patience` | *Ghosts Speak Not & Patience* | short_story | James Swallow | 2016 | `ssot-hh-021` | `?` | — |
| HH-0206 | `tallarn-siren` | *Tallarn: Siren* | short_story | John French | 2016 | `ssot-hh-021` | `?` | `low_confidence:characters` |
| HH-0207 | `inheritor` | *Inheritor* | short_story | Gav Thorpe | 2016 | `ssot-hh-021` | `?` | — |
| HH-0208 | `blackshield` | *Blackshield* | short_story | Chris Wraight | 2016 | `ssot-hh-021` | `?` | `low_confidence:locations` |
| HH-0209 | `myriad` | *Myriad* | short_story | Rob Sanders | 2016 | `ssot-hh-021` | `?` | `low_confidence:characters` |
| HH-0210 | `into-exhile` | *Into Exhile* | short_story | Aaron Dembski-Bowden | 2016 | `ssot-hh-021` | `?` | `data_conflict:slug->into-exile` |
| HH-0211 | `the-grey-raven` | *The Grey Raven* | short_story | Gav Thorpe | 2016 | `ssot-hh-022` | `?` | — |
| HH-0212 | `the-painted-count` | *The Painted Count* | short_story | Guy Haley | 2016 | `ssot-hh-022` | `?` | — |
| HH-0213 | `exocytosis` | *Exocytosis* | short_story | James Swallow | 2016 | `ssot-hh-022` | `?` | — |
| HH-0214 | `the-last-son-of-prospero` | *The Last Son of Prospero* | short_story | Chris Wraight | 2016 | `ssot-hh-022` | `?` | — |
| HH-0215 | `ordo-sinister` | *Ordo Sinister* | short_story | John French | 2017 | `ssot-hh-022` | `?` | — |
| HH-0216 | `the-ember-wolves` | *The Ember Wolves* | short_story | Rob Sanders | 2017 | `ssot-hh-022` | `?` | — |
| HH-0217 | `the-laurel-of-defiance` | *The Laurel of Defiance* | short_story | Guy Haley | 2017 | `ssot-hh-022` | `?` | — |
| HH-0218 | `immortal-duty` | *Immortal Duty* | short_story | Nick Kyme | 2017 | `ssot-hh-022` | `?` | — |
| HH-0219 | `champion-of-oaths` | *Champion of Oaths* | short_story | John French | 2017 | `ssot-hh-022` | `?` | `data_conflict:releaseYear->2018` |
| HH-0220 | `child-of-chaos` | *Child of Chaos* | short_story | Chris Wraight | 2017 | `ssot-hh-022` | `?` | `data_conflict:releaseYear->2018` |
| HH-0221 | `massacre` | *Massacre* | short_story | Aaron Dembski-Bowden | 2018 | `ssot-hh-023` | `?` | — |
| HH-0222 | `two-metaphysical-blades` | *Two Metaphysical Blades* | short_story | Chris Wraight | 2018 | `ssot-hh-023` | `?` | — |
| HH-0223 | `prologue-to-nikaea` | *Prologue To Nikaea* | short_story | David Annandale | 2018 | `ssot-hh-023` | `?` | `low_confidence:factions` |
| HH-0224 | `abyssal` | *Abyssal* | short_story | David Annandale | 2018 | `ssot-hh-023` | `?` | — |
| HH-0225 | `lanterns-light` | *Lantern's Light* | short_story | James Swallow | 2019 | `ssot-hh-023` | `?` | — |
| HH-0226 | `the-serpents-dance` | *The Serpent's Dance* | short_story | Mike Brooks | 2020 | `ssot-hh-023` | `?` | — |
| HH-0227 | `the-lightning-hall` | *The Lightning Hall* | short_story | Graham McNeill | 2020 | `ssot-hh-023` | `?` | — |
| HH-0228 | `eater-of-dreams` | *Eater of Dreams* | short_story | Marc Collins | 2021 | `ssot-hh-023` | `?` | — |
| HH-0229 | `bloodhowl` | *Bloodhowl* | short_story | Chris Forrester | 2021 | `ssot-hh-023` | `?` | `low_confidence:locations` |
| HH-0230 | `amor-fati` | *Amor Fati* | short_story | Michael F. Haspil | 2021 | `ssot-hh-023` | `?` | `low_confidence:locations` |
| HH-0231 | `crusades-end` | *Crusade's End* | omnibus | ? | 2016 | `ssot-hh-024` | `?` | — |
| HH-0232 | `the-razing-of-prospero` | *The Razing of Prospero* | omnibus | ? | 2016 | `ssot-hh-024` | `?` | — |
| HH-0233 | `the-last-phoenix` | *The Last Phoenix* | omnibus | ? | 2016 | `ssot-hh-024` | `?` | — |
| HH-0234 | `perturabo-stone-and-iron` | *Perturabo: Stone and Iron* | audio_drama | Robbie MacNiven | 2017 | `ssot-hh-024` | `?` | `low_confidence:locations` |
| HH-0235 | `malcador-first-lord-of-the-imperium` | *Malcador: First Lord of the Imperium* | audio_drama | L.J. Goulding | 2017 | `ssot-hh-024` | `?` | — |
| HH-0236 | `konrad-curze-a-lesson-in-darkness` | *Konrad Curze: A Lesson in Darkness* | audio_drama | Ian St. Martin | 2017 | `ssot-hh-024` | `?` | — |
| HH-0237 | `the-lords-of-terra` | *The Lords of Terra* | audio_drama | ? | 2018 | `ssot-hh-024` | `?` | `data_conflict:format->anthology` |
| HH-0238 | `illyrium` | *Illyrium* | audio_drama | Darius Hinks | 2019 | `ssot-hh-024` | `?` | — |
| HH-0239 | `the-revelation-of-the-word` | *The Revelation of the Word* | audio_drama | David Annandale | 2019 | `ssot-hh-024` | `?` | `low_confidence:locations` |
| HH-0240 | `morningstar` | *Morningstar* | audio_drama | Graham McNeill | 2019 | `ssot-hh-024` | `?` | — |
| HH-0241 | `the-dark-king` | *The Dark King* | audio_drama | Graham McNeill | 2007 | `ssot-hh-025` | `?` | — |
| HH-0242 | `the-lightning-tower` | *The Lightning Tower* | audio_drama | Dan Abnett | 2007 | `ssot-hh-025` | `?` | — |
| HH-0243 | `ravens-flight` | *Raven's Flight* | audio_drama | Gav Thorpe | 2010 | `ssot-hh-025` | `?` | — |
| HH-0244 | `garro-legion-of-one` | *Garro: Legion of One* | audio_drama | James Swallow | 2011 | `ssot-hh-025` | `?` | — |
| HH-0245 | `butchers-nails` | *Butcher's Nails* | audio_drama | Aaron Dembski-Bowden | 2012 | `ssot-hh-025` | `?` | — |
| HH-0246 | `grey-angel` | *Grey Angel* | audio_drama | John French | 2012 | `ssot-hh-025` | `?` | — |
| HH-0247 | `burden-of-duty` | *Burden of Duty* | audio_drama | James Swallow | 2012 | `ssot-hh-025` | `?` | — |
| HH-0248 | `garro-sword-of-truth` | *Garro: Sword of Truth* | audio_drama | James Swallow | 2012 | `ssot-hh-025` | `?` | — |
| HH-0249 | `warmaster` | *Warmaster* | audio_drama | John French | 2012 | `ssot-hh-025` | `?` | — |
| HH-0250 | `strike-and-fade` | *Strike and Fade* | audio_drama | Guy Haley | 2012 | `ssot-hh-025` | `?` | `low_confidence:characters` |

## 3. Surface-form aggregate (sorted: freq desc, name asc)

### Factions (36 distinct surface forms, 112 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Imperial Fists | 10 | HH-0206, HH-0210, HH-0211 | direct | imperial_fists | `?` |
| Death Guard | 8 | HH-0201, HH-0205, HH-0208 | direct | death_guard | `?` |
| Night Lords | 8 | HH-0212, HH-0221, HH-0228 | direct | night_lords | `?` |
| World Eaters | 7 | HH-0207, HH-0217, HH-0228 | direct | world_eaters | `?` |
| Knights-Errant | 6 | HH-0226, HH-0228, HH-0244 | alias | knights_errant | `?` |
| Word Bearers | 6 | HH-0207, HH-0217, HH-0220 | direct | word_bearers | `?` |
| Emperor's Children | 5 | HH-0203, HH-0230, HH-0231 | direct | emperors_children | `?` |
| Iron Warriors | 5 | HH-0206, HH-0233, HH-0234 | direct | iron_warriors | `?` |
| Iron Hands | 4 | HH-0203, HH-0218, HH-0221 | direct | iron_hands | `?` |
| Sisters of Silence | 4 | HH-0205, HH-0224, HH-0226 | alias | talons_of_the_emperor | `?` |
| Space Wolves | 4 | HH-0222, HH-0229, HH-0231 | direct | space_wolves | `?` |
| Adeptus Custodes | 3 | HH-0211, HH-0222, HH-0232 | direct | custodes | `?` |
| Dark Angels | 3 | HH-0201, HH-0213, HH-0246 | direct | dark_angels | `?` |
| Dark Mechanicum | 3 | HH-0209, HH-0210, HH-0227 | direct | dark_mechanicum | `?` |
| Raven Guard | 3 | HH-0211, HH-0221, HH-0243 | direct | raven_guard | `?` |
| Salamanders | 3 | HH-0204, HH-0221, HH-0250 | direct | salamanders | `?` |
| Thousand Sons | 3 | HH-0214, HH-0232, HH-0240 | direct | thousand_sons | `?` |
| Ultramarines | 3 | HH-0217, HH-0238, HH-0244 | direct | ultramarines | `?` |
| Adeptus Astra Telepathica | 2 | HH-0235, HH-0237 | direct | adeptus_astra_telepathica | `?` |
| Knights Errant | 2 | HH-0202, HH-0205 | direct | knights_errant | `?` |
| Luna Wolves | 2 | HH-0231, HH-0244 | alias | sons_of_horus | `?` |
| Mechanicum | 2 | HH-0209, HH-0210 | alias | mechanicus | `?` |
| Orks | 2 | HH-0234, HH-0237 | direct | orks | `?` |
| Sons of Horus | 2 | HH-0231, HH-0249 | direct | sons_of_horus | `?` |
| Adeptus Administratum | 1 | HH-0224 | unresolved | — | `?` |
| Alpha Legion | 1 | HH-0226 | direct | alpha_legion | `?` |
| Blackshields | 1 | HH-0208 | unresolved | — | `?` |
| Crimson Fists | 1 | HH-0233 | direct | crimson_fists | `?` |
| Dark Eldar | 1 | HH-0245 | alias | eldar | `?` |
| House Taranis | 1 | HH-0227 | unresolved | — | `?` |
| Imperial Army | 1 | HH-0202 | alias | astra_militarum | `?` |
| Legio Audax | 1 | HH-0216 | unresolved | — | `?` |
| Legio Castigatra | 1 | HH-0216 | unresolved | — | `?` |
| Legio Cybernetica | 1 | HH-0209 | unresolved | — | `?` |
| Ordo Sinister | 1 | HH-0215 | unresolved | — | `?` |
| White Scars | 1 | HH-0214 | direct | white_scars | `?` |

### Locations (41 distinct surface forms, 63 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Terra | 10 | HH-0211, HH-0214, HH-0215 | direct | terra | `?` |
| Isstvan V | 5 | HH-0203, HH-0218, HH-0221 | alias | istvaan_v | `?` |
| Mars | 3 | HH-0209, HH-0210, HH-0227 | direct | mars | `?` |
| Davin | 2 | HH-0220, HH-0231 | direct | davin | `?` |
| Isstvan III | 2 | HH-0231, HH-0244 | alias | istvaan_iii | `?` |
| Macragge | 2 | HH-0217, HH-0238 | direct | macragge | `?` |
| Piamen | 2 | HH-0236, HH-0237 | unresolved | — | `?` |
| Prospero | 2 | HH-0232, HH-0240 | direct | prospero | `?` |
| Sol System | 2 | HH-0226, HH-0248 | direct | sol_system | `?` |
| Tizca | 2 | HH-0232, HH-0240 | direct | tizca | `?` |
| 60-Sixty | 1 | HH-0231 | unresolved | — | `?` |
| Absalom | 1 | HH-0216 | unresolved | — | `?` |
| Albia | 1 | HH-0228 | unresolved | — | `?` |
| Astagar | 1 | HH-0217 | unresolved | — | `?` |
| Barbarus | 1 | HH-0225 | direct | barbarus | `?` |
| Caliban | 1 | HH-0246 | direct | caliban | `?` |
| Calth | 1 | HH-0248 | direct | calth | `?` |
| Chemos | 1 | HH-0233 | unresolved | — | `?` |
| Colchis | 1 | HH-0220 | direct | colchis | `?` |
| Deliverance | 1 | HH-0243 | direct | deliverance | `?` |
| Eye of Terror | 1 | HH-0233 | direct | eye_of_terror | `?` |
| Fenris | 1 | HH-0232 | direct | fenris | `?` |
| Illyrium | 1 | HH-0238 | unresolved | — | `?` |
| Imperial Palace | 1 | HH-0242 | direct | imperial_palace | `?` |
| Imperial Webway | 1 | HH-0215 | unresolved | — | `?` |
| Irkalla | 1 | HH-0224 | unresolved | — | `?` |
| Iydris | 1 | HH-0233 | direct | iydris | `?` |
| Jupiter | 1 | HH-0226 | unresolved | — | `?` |
| Kronus | 1 | HH-0207 | unresolved | — | `?` |
| Laer | 1 | HH-0233 | unresolved | — | `?` |
| Luna | 1 | HH-0205 | direct | luna | `?` |
| Macragge's Honour | 1 | HH-0238 | unresolved | — | `?` |
| Nikaea | 1 | HH-0232 | direct | nikaea | `?` |
| Phalanx | 1 | HH-0247 | unresolved | — | `?` |
| Phall | 1 | HH-0233 | direct | phall | `?` |
| Sotha | 1 | HH-0212 | direct | sotha | `?` |
| Tallarn | 1 | HH-0206 | direct | tallarn | `?` |
| Terra Nullius | 1 | HH-0201 | unresolved | — | `?` |
| Thawra | 1 | HH-0223 | unresolved | — | `?` |
| Ultramar | 1 | HH-0207 | direct | ultramar | `?` |
| Zaramund | 1 | HH-0213 | unresolved | — | `?` |

### Characters (79 distinct surface forms, 123 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Malcador the Sigillite | 10 | HH-0202, HH-0205, HH-0211 | direct | malcador_the_sigillite | `?` |
| Konrad Curze | 4 | HH-0221, HH-0236, HH-0237 | direct | konrad_curze | `?` |
| Leman Russ | 4 | HH-0222, HH-0229, HH-0231 | direct | leman_russ | `?` |
| Nathaniel Garro | 4 | HH-0205, HH-0244, HH-0247 | direct | nathaniel_garro | `?` |
| Fulgrim | 3 | HH-0203, HH-0230, HH-0233 | direct | fulgrim | `?` |
| Garviel Loken | 3 | HH-0231, HH-0244, HH-0246 | direct | garviel_loken | `?` |
| Macer Varren | 3 | HH-0228, HH-0244, HH-0248 | unresolved | — | `?` |
| Perturabo | 3 | HH-0233, HH-0234, HH-0237 | direct | perturabo | `?` |
| Ahzek Ahriman | 2 | HH-0232, HH-0240 | direct | ahzek_ahriman | `?` |
| Amendera Kendel | 2 | HH-0205, HH-0226 | direct | amendera_kendel | `?` |
| Constantin Valdor | 2 | HH-0222, HH-0232 | direct | constantin_valdor | `?` |
| Erebus | 2 | HH-0220, HH-0231 | direct | erebus | `?` |
| Fabius Bile | 2 | HH-0230, HH-0233 | direct | fabius_bile | `?` |
| Ferrus Manus | 2 | HH-0203, HH-0233 | direct | ferrus_manus | `?` |
| Helig Gallor | 2 | HH-0205, HH-0226 | unresolved | — | `?` |
| Horus Lupercal | 2 | HH-0231, HH-0249 | alias | horus | `?` |
| Lorgar | 2 | HH-0220, HH-0245 | direct | lorgar | `?` |
| Lorgar Aurelian | 2 | HH-0231, HH-0239 | alias | lorgar | `?` |
| Luther | 2 | HH-0213, HH-0246 | direct | luther | `?` |
| Magnus the Red | 2 | HH-0232, HH-0240 | direct | magnus_the_red | `?` |
| Nivalus | 2 | HH-0236, HH-0237 | unresolved | — | `?` |
| Roboute Guilliman | 2 | HH-0217, HH-0238 | direct | roboute_guilliman | `?` |
| Rogal Dorn | 2 | HH-0241, HH-0242 | direct | rogal_dorn | `?` |
| Sibel Niasta | 2 | HH-0235, HH-0237 | unresolved | — | `?` |
| the Emperor | 2 | HH-0222, HH-0225 | unresolved | — | `?` |
| Tylos Rubio | 2 | HH-0244, HH-0248 | direct | tylos_rubio | `?` |
| Ahrem Gallikus | 1 | HH-0218 | unresolved | — | `?` |
| Alexis Polux | 1 | HH-0233 | direct | alexis_polux | `?` |
| Ammon | 1 | HH-0238 | unresolved | — | `?` |
| Angron | 1 | HH-0245 | direct | angron | `?` |
| Arcatus Vindix Centurio | 1 | HH-0211 | unresolved | — | `?` |
| Arkhan Land | 1 | HH-0210 | direct | arkhan_land | `?` |
| Aveth Vairon | 1 | HH-0224 | unresolved | — | `?` |
| Balsar Kurthuri | 1 | HH-0211 | unresolved | — | `?` |
| Balthus Voltemand | 1 | HH-0216 | unresolved | — | `?` |
| Bjorn | 1 | HH-0232 | direct | bjorn | `?` |
| Borealis Thoon | 1 | HH-0215 | unresolved | — | `?` |
| Branne | 1 | HH-0243 | alias | branne_nev | `?` |
| Calas Typhon | 1 | HH-0213 | alias | typhus | `?` |
| Captain Shang | 1 | HH-0212 | unresolved | — | `?` |
| Corax | 1 | HH-0243 | direct | corax | `?` |
| Corswain | 1 | HH-0201 | direct | corswain | `?` |
| Crysos Morturg | 1 | HH-0208 | unresolved | — | `?` |
| Cyrion | 1 | HH-0221 | direct | cyrion | `?` |
| Eidolon | 1 | HH-0230 | direct | eidolon | `?` |
| Fel Zharost | 1 | HH-0228 | direct | fel_zharost | `?` |
| Gabriel Santar | 1 | HH-0203 | unresolved | — | `?` |
| Gendor Skraivok | 1 | HH-0212 | unresolved | — | `?` |
| Gunnar Thorolfsson | 1 | HH-0229 | unresolved | — | `?` |
| Hakeem | 1 | HH-0248 | unresolved | — | `?` |
| Hydragyrum | 1 | HH-0215 | unresolved | — | `?` |
| Iacton Cruze | 1 | HH-0246 | unresolved | — | `?` |
| Jaghatai Khan | 1 | HH-0214 | direct | jaghatai_khan | `?` |
| Jorin Bloodhowl | 1 | HH-0229 | unresolved | — | `?` |
| Julius Kaesoron | 1 | HH-0203 | direct | julius_kaesoron | `?` |
| Kasper Hawser | 1 | HH-0232 | direct | kasper_hawser | `?` |
| Kelbor-Hal | 1 | HH-0227 | direct | kelbor_hal | `?` |
| Khorak | 1 | HH-0208 | unresolved | — | `?` |
| Lucius | 1 | HH-0233 | alias | lucius_the_eternal | `?` |
| Lucretius Corvo | 1 | HH-0217 | unresolved | — | `?` |
| Lycus | 1 | HH-0206 | unresolved | — | `?` |
| Maloghurst | 1 | HH-0231 | alias | maloghurst_the_twisted | `?` |
| Marcus Valerius | 1 | HH-0243 | direct | marcus_valerius | `?` |
| Mortarion | 1 | HH-0225 | direct | mortarion | `?` |
| Nicanor | 1 | HH-0210 | unresolved | — | `?` |
| Noriz | 1 | HH-0211 | unresolved | — | `?` |
| Raf Maven | 1 | HH-0227 | unresolved | — | `?` |
| Revuel Arvida | 1 | HH-0214 | direct | revuel_arvida | `?` |
| Saul Tarvitz | 1 | HH-0231 | direct | saul_tarvitz | `?` |
| Sigismund | 1 | HH-0219 | direct | sigismund | `?` |
| Talos | 1 | HH-0221 | direct | talos | `?` |
| Tarasha Euten | 1 | HH-0238 | unresolved | — | `?` |
| Tarik Torgaddon | 1 | HH-0231 | direct | tarik_torgaddon | `?` |
| the Exalted | 1 | HH-0221 | unresolved | — | `?` |
| Torquill Eliphas | 1 | HH-0207 | unresolved | — | `?` |
| Typhon | 1 | HH-0201 | alias | typhus | `?` |
| Vulkan | 1 | HH-0204 | direct | vulkan | `?` |
| Xarl | 1 | HH-0221 | direct | xarl | `?` |
| Yored Massak | 1 | HH-0247 | unresolved | — | `?` |

## 4. Cross-axis surface-form conflicts

| surface form | axes |
| --- | --- |
| (none) | — |

## 5. Omnibus / anthology scan

| externalBookId | title | format | roster collection? | known constituents |
| --- | --- | --- | --- | --- |
| HH-0231 | *Crusade's End* | omnibus | yes (4) | HH-0001, HH-0002, HH-0003, HH-0004 |
| HH-0232 | *The Razing of Prospero* | omnibus | yes (2) | HH-0012, HH-0015 |
| HH-0233 | *The Last Phoenix* | omnibus | yes (3) | HH-0005, HH-0023, HH-0044 |

## 6. data_conflict flag scan

| externalBookId | title | flags |
| --- | --- | --- |
| HH-0202 | *All That Remains* | `low_confidence:characters`; `low_confidence:locations` |
| HH-0204 | *Artefacts* | `low_confidence:locations` |
| HH-0206 | *Tallarn: Siren* | `low_confidence:characters` |
| HH-0208 | *Blackshield* | `low_confidence:locations` |
| HH-0209 | *Myriad* | `low_confidence:characters` |
| HH-0210 | *Into Exhile* | `data_conflict:slug->into-exile` |
| HH-0219 | *Champion of Oaths* | `data_conflict:releaseYear->2018` |
| HH-0220 | *Child of Chaos* | `data_conflict:releaseYear->2018` |
| HH-0223 | *Prologue To Nikaea* | `low_confidence:factions` |
| HH-0229 | *Bloodhowl* | `low_confidence:locations` |
| HH-0230 | *Amor Fati* | `low_confidence:locations` |
| HH-0234 | *Perturabo: Stone and Iron* | `low_confidence:locations` |
| HH-0237 | *The Lords of Terra* | `data_conflict:format->anthology` |
| HH-0239 | *The Revelation of the Word* | `low_confidence:locations` |
| HH-0250 | *Strike and Fade* | `low_confidence:characters` |

## 7. Cross-batch alias-consolidation + needs-decision candidates

> The only LLM-synthesized section. It flags (7a) cross-form alias-consolidation cases the
> owning phase must collapse onto an existing canonical row (runbook §4) — this wave finds
> **one strict-freq-2 character alias case** (`the Emperor` lowercase-article variant to
> the_emperor row, paralleling the Pass-13 Case-E capitalized variant); (7b) two cross-batch
> character spines (one strict freq-3 — `Macer Varren` across three independent batches; one
> strict freq-2 — `Helig Gallor` across two independent batches); (7c) the freq-driven
> promotion shape per axis, dominated on the **faction axis by a Mechanicum / Titan-Legion
> sub-faction promotion bloc** (Ordo Sinister + Legio Audax + Legio Castigatra + Legio
> Cybernetica + House Taranis) and a **Blackshields warband-grain** promotion, on the
> **location axis by a Heresy-Primarch-homeworld + vessel-grain promotion bloc** (Chemos +
> Laer + Phalanx + Macragge's Honour + Irkalla + Albia + Illyrium + Imperial Webway + Jupiter
> + Ring-of-Iron-already-in-Pass-13-but-still-judgment-call), and on the **character axis by
> the early-Heresy audio-drama supporting-cast freq-1 tail**; (7d) genuine needs-decision
> candidates (mostly grain calls — the HH-0237 anthology-cascade question for the freq-2
> `Sibel Niasta` / `Nivalus` / `Piamen` surfaces; the `Blackshields` warband-vs-aggregator-
> faction grain; format conflicts in HH-0237 / HH-0210 / HH-0219 / HH-0220; the omnibus
> forward-ref Guard at HH-0231 / HH-0232 / HH-0233 — all constituent HH-0001..HH-0044 in
> range for cumulative HH-0001..HH-0250, clean Guard expected). The Brief-091 forward-ref
> Guard concern is resolved (Brief 101); Pass-14 has **three roster-collection omnibi in §5**
> all pointing to in-range constituents, so the expected outcome is `out-of-range=0,
> unknown-work=0`. Everything below is grounded in §2–§6 + the Pass-10/11/12/13 alias / row
> anchors confirmed in §1 baseline.

### 7a. Cross-batch alias-consolidation cases (→ existing row + alias)

> Format: surface-forms · book-IDs · same entity? · recommendation. These are the cases where a naïve
> implementer would create **two** rows or invent a fresh row instead of aliasing onto an existing
> anchor. Per runbook §4: **one canonical identity = one canonical row; era-/form-specific surface
> forms live in `*-aliases.json`**.

**Factions (Phase 1):**

- *(No alias-consolidation cases this wave for the faction axis.)* All era-rename / honor-
  title / cross-batch faction cases land on Pass-10/11/12/13 aliases (Knights-Errant /
  Knights Errant → `knights_errant` 8 hits cumulative, Sisters of Silence →
  `talons_of_the_emperor` 4 hits, Luna Wolves → `sons_of_horus` 2 hits, Mechanicum →
  `mechanicus` 2 hits, Dark Eldar → `eldar` 1 hit, Imperial Army → `astra_militarum` 1 hit).
  The Pass-10/11/12/13 era-rename chain on the faction axis catches every re-surface in this
  wave; no new aliases needed.

**Locations (Phase 2):**

- *(No alias-consolidation cases this wave for the location axis.)* All resolved location
  surfaces this wave catch on existing rows direct or via existing Pass-N aliases (Isstvan V
  / Isstvan III via the long-established Istvaan aliases, Terra / Macragge / Mars / Davin /
  Prospero / Sol System / Tizca / Barbarus / Caliban / Calth / Colchis / Deliverance / Eye of
  Terror / Fenris / Imperial Palace / Iydris / Luna / Nikaea / Phall / Sotha / Tallarn /
  Ultramar all direct on baseline rows). The location-axis question this wave puts on Phase
  2 is the **`Piamen` strict-freq-2 evidence** — actually anthology-cascade via HH-0237 not
  independent (see 7d), so a Phase-2 grain call.

**Characters (Phase 3) — strict-freq-2 alias add:**

- **Case A — `the Emperor` ↔ `the_emperor` (canonical, Pass-10-anchored).** `the Emperor`
  (freq 2 — HH-0222 *Two Metaphysical Blades* / HH-0225 *Lantern's Light*, unresolved in §3)
  is the **bare lowercase-article variant** of the Pass-10 `the_emperor` row. Pass-13 Case E
  added `The Emperor of Mankind → the_emperor` (capitalized-with-extension variant); the
  resolver is case-sensitive (Brief 049/072), so the lowercase-article form `the Emperor`
  needs its own alias entry. Same person, same row. → **alias `the Emperor → the_emperor`**
  in `character-aliases.json`. Both surfaces are within `ssot-hh-023` (HH-0221..HH-0230), so
  the freq-2 evidence is **within-batch**, not strict cross-batch. Per runbook §4 promotion
  threshold (freq ≥ 2 strict OR lore-iconic freq=1), the within-batch freq-2 surface form of
  an already-canonical entity is sufficient for an alias add (the entity exists, the surface
  is a clear variant — no row creation needed, just an alias entry). No row edit; just the
  alias. **Floor case.**

**Confirmations only (already-aliased / already-direct from Pass 10–13 — no Phase-N action):**

The following surface forms surface in this wave with `alias` or `direct` status because
Pass-10/11/12/13 already landed the anchor + alias. No alias-file edit needed; listed only to
make the Cross-Era / Pass-10–13-handoff chain explicit:

- **Factions:** `Knights-Errant → knights_errant` (Pass-11 alias, **6 hits** this wave —
  HH-0226 / HH-0228 / HH-0244 / HH-0246 / HH-0247 / HH-0248; the highest-frequency alias of
  the wave — the *Garro* / *Eisenstein* / *Knights-Errant*-arc audio-drama bloc anchors it
  exhaustively), `Knights Errant → knights_errant` (Pass-11 direct alias, **2 hits** — HH-0202
  / HH-0205 — note the original non-hyphenated form), `Sisters of Silence →
  talons_of_the_emperor` (Pass-10 alias, **4 hits** — HH-0205 / HH-0224 / HH-0226 / [HH-0232
  via omnibus aggregate]), `Luna Wolves → sons_of_horus` (Pass-10 alias, **2 hits** — HH-0231
  via omnibus / HH-0244 — the Pass-11 cross-rename anchor continues exhaustive coverage),
  `Mechanicum → mechanicus` (Pass-10 alias, **2 hits** — HH-0209 / HH-0210), `Dark Eldar →
  eldar` (pre-Pass-10 alias, 1 hit — HH-0245), `Imperial Army → astra_militarum` (Pass-10
  alias, 1 hit — HH-0202). The Pass-10/11/12/13 era-rename chain on the faction axis catches
  every re-surface in this wave.
- **Locations:** `Isstvan V → istvaan_v` (long-established alias, **5 hits** — HH-0203 /
  HH-0218 / HH-0221 / HH-0243 / HH-0250; the highest-frequency location-alias hit of the wave
  — Isstvan V is the Heresy's foundational catastrophe site, surfacing wave-wide), `Isstvan
  III → istvaan_iii` (long-established alias, **2 hits** — HH-0231 omnibus / HH-0244).
- **Characters:** `Horus Lupercal → horus` (Pass-11 alias, **2 hits** — HH-0231 omnibus /
  HH-0249), `Lorgar Aurelian → lorgar` (Pass-11 alias, **2 hits** — HH-0231 omnibus / HH-0239),
  `Branne → branne_nev` (Pass-13 Case-D-companion alias, 1 hit — HH-0243 — the namesake debut
  for the Pass-13 alias), `Calas Typhon → typhus` (pre-Pass-10 alias, 1 hit — HH-0213),
  `Lucius → lucius_the_eternal` (pre-Pass-10 alias, 1 hit — HH-0233 omnibus), `Maloghurst →
  maloghurst_the_twisted` (Pass-13 Case-B alias, 1 hit — HH-0231 omnibus — first cross-pass
  confirmation of the Pass-13 alias), `Typhon → typhus` (pre-Pass-10 alias, 1 hit — HH-0201).
  Pass-13 closed the bulk of the short-form / honor-title-split work; this wave's only **new**
  alias case is Case A (`the Emperor` lowercase-article variant).
- **Direct chain — all named Primarchs catch on Pass-10/11/12/13 rows.** Every named Primarch
  in this wave catches its bare-name surface form direct on the Pass-10/11/12/13 canonical row:
  Konrad Curze (4 — Pass-11 row), Leman Russ (4 — Pass-11 row), Fulgrim (3), Perturabo (3 —
  Pass-11 row), Ferrus Manus (2), Lorgar (2 bare-form direct + 2 Lorgar-Aurelian-alias =
  cumulative 4 surfaces), Magnus the Red (2), Roboute Guilliman (2), Rogal Dorn (2), Horus
  Lupercal (2 alias), Angron (1), Corax (1), Jaghatai Khan (1), Mortarion (1), Vulkan (1).
  **The Primarch coverage is exhaustive** for the Pass-14 wave; this matches the Pass-13
  forecast.
- **Direct chain — supporting cast confirmations (selected):** `Malcador the Sigillite` (Pass-11
  row, **freq 10 — the wave's highest-frequency character surface form**, the *Malcador* /
  Knights-Errant / Sigillite-frame audio-drama bloc + the *Last Son of Prospero* novella +
  the *Prologue to Nikaea* + the *All That Remains* opening + others — Malcador is the wave's
  spine character), `Nathaniel Garro` (Pass-? row, **freq 4** — the *Garro* audio-drama bloc
  is wave-central in ssot-hh-025), `Garviel Loken` (Pass-11 row, **freq 3** — HH-0231 omnibus
  / HH-0244 / HH-0246), `Ahzek Ahriman` (Pass-? row, freq 2 — HH-0232 / HH-0240), `Amendera
  Kendel` (Pass-13 row, freq 2 — HH-0205 / HH-0226 — the namesake first-cross-pass-confirmation
  of the Pass-13 row, with the cross-batch pair of *Ghosts Speak Not & Patience* + *The
  Serpent's Dance*), `Constantin Valdor` (Pass-11 row, freq 2 — HH-0222 / HH-0232), `Erebus`
  (pre-Pass-10 row, freq 2 — HH-0220 / HH-0231 omnibus), `Fabius Bile` (pre-Pass-10 row, freq
  2 — HH-0230 / HH-0233), `Luther` (Pass-? row, freq 2 — HH-0213 / HH-0246), `Tylos Rubio`
  (Pass-11 row, freq 2 — HH-0244 / HH-0248). Plus single-hit confirmations: `Bjorn` (Pass-11
  row, HH-0232), `Marcus Valerius` (Pass-13 row, HH-0243 — the namesake first-cross-pass-
  confirmation of the Pass-13 row), `Revuel Arvida` (Pass-13 row, HH-0214 — the namesake
  first-cross-pass-confirmation), `Fel Zharost` (Pass-13 row, HH-0228 — the namesake first-
  cross-pass-confirmation), `Corswain` (Pass-13 row, HH-0201 — the namesake first-cross-pass-
  confirmation), `Tarik Torgaddon` (Pass-12 row, HH-0231 omnibus), `Saul Tarvitz` (Pass-? row,
  HH-0231 omnibus), `Arkhan Land` (Pass-? row, HH-0210), `Kelbor-Hal` (Pass-? row, HH-0227),
  `Sigismund` (Pass-? row, HH-0219), `Eidolon` (pre-Pass-10 row, HH-0230), `Talos` (Pass-? row,
  HH-0221), `Cyrion` (Pass-? row, HH-0221), `Xarl` (Pass-? row, HH-0221), `Julius Kaesoron`
  (Pass-? row, HH-0203), `Alexis Polux` (Pass-? row, HH-0233 omnibus), `Kasper Hawser` (Pass-?
  row, HH-0232 omnibus). **Pass-13's recommended +14-row promotion shape is fully confirmed in
  this wave** — every Pass-13 promoted-row that surfaces in Pass-14 catches direct.
- **Direct chain — locations:** `Terra` (10 — the highest-frequency location surface form of
  the wave, audio-drama-driven), `Macragge`, `Mars`, `Davin`, `Prospero`, `Sol System`, `Tizca`,
  `Barbarus` (Pass-? row — the namesake first-cross-pass-confirmation in HH-0225 *Lantern's
  Light*), `Caliban`, `Calth`, `Colchis`, `Deliverance` (Pass-? row, namesake first-cross-pass
  in HH-0243), `Eye of Terror`, `Fenris`, `Imperial Palace`, `Iydris`, `Luna`, `Nikaea`,
  `Phall`, `Sotha`, `Tallarn`, `Ultramar`. The Pass-10/11/12/13 location chain is exhaustively
  anchored for this wave; the only direct-resolution gaps are the new sub-locale / vessel
  promotions in 7c.

### 7b. Big single-form cross-batch spines (one row each — not alias work)

This wave is **moderately rich** on cross-batch spines — the audio-drama / Knights-Errant /
Garro arc anchors a small set of recurring agents:

- **`Macer Varren` (freq 3 — HH-0228 *Eater of Dreams* / HH-0244 *Garro: Legion of One* /
  HH-0248 *Garro: Sword of Truth*).** The Knights-Errant operative — ex-World-Eaters survivor
  of Isstvan III, paired with Garro on Isstvan III rescue (HH-0244), the Grey-Knights
  redemption arc (HH-0228 with Fel Zharost on Albia), the Sol System investigation (HH-0248).
  **Strict freq-3 across three independent batches** (ssot-hh-023 / ssot-hh-025 / ssot-hh-025)
  — the strongest spine case of the wave. Lore-iconic Knights-Errant figure (cross-arc with
  the Pass-11 / Pass-12 Knights-Errant network). → **new row `macer_varren`**. primaryFactionId
  `knights_errant` (the existing Pass-11 canonical anchor — the cross-pass evidence is
  exhaustive for the cluster).
- **`Helig Gallor` (freq 2 — HH-0205 *Ghosts Speak Not & Patience* / HH-0226 *The Serpent's
  Dance*).** The Knights-Errant agent — paired with Nathaniel Garro in HH-0205 (loop-log:
  "paired Knights Errant shorts (Garro+Kendel; Garro+Gallor)"), paired with **Amendera Kendel**
  in HH-0226 (loop-log: "Amendera Kendel (Sisters of Silence → Sigillite agent) and Helig
  Gallor (Knights-Errant) vs Alpha Legion cell in Jovian shipyards"). **Strict freq-2 across
  two independent batches** (ssot-hh-021 / ssot-hh-023). Lore-anchored Knights-Errant figure
  (cross-arc with the Garro / Kendel network). → **new row `helig_gallor`**. primaryFactionId
  `knights_errant` (the existing Pass-11 canonical anchor).

> Both spines are tight Knights-Errant cross-arc supporting-cast rows. The cross-batch
> evidence is exhaustive for both under the strict freq ≥ 2 rule. Phase 3 should validate
> identity coherence (especially for `Macer Varren` across three different authors / three
> different audio-drama / short-story formats — strict reading from current source coverage
> + loop-log is that all three surfaces refer to the same character; the Knights-Errant
> programme + the World-Eaters origin + the Isstvan-III survival pin the identity).

### 7c. Per-axis promotion shape (freq-driven; owning phase justifies the exact set)

**Factions (Phase 1).** Strict freq ≥ 2 unresolved + curated freq-1 lore-iconic adds.

Strict freq ≥ 2 unresolved:

- *(None this wave.)* The unresolved-faction list in §3 contains **only freq-1 surface forms**
  (Adeptus Administratum / Blackshields / House Taranis / Imperial Army-aliased-already /
  Legio Audax / Legio Castigatra / Legio Cybernetica / Ordo Sinister). Phase-1's strict-freq-2
  threshold contributes **zero** new rows this wave; all faction-promotion work is curated
  freq-1.

Curated freq-1 lore-iconic candidates — **the Mechanicum / Titan-Legion / Warband sub-faction
promotion bloc**:

- **`Ordo Sinister` (freq 1, HH-0215 *Ordo Sinister*).** The Mechanicum's Pariah-Princeps
  sub-organization — the audio-drama's namesake protagonist Hydragyrum is the female pariah-
  princeps fighting on Terra defending the Imperial Webway. Lore-iconic Mechanicum sub-
  faction (the Ordo Sinister is recurring across Heresy-era Mechanicum politics and the M41
  Imperial-Knights / Mechanicus pantheon). → **new row `ordo_sinister`** with parent
  `mechanicus`. **Lore-iconic strong-promotion case.**
- **`Legio Audax` (freq 1, HH-0216 *The Ember Wolves*).** Titan Legion ("the Ember Wolves"
  namesake-themed). The Pass-12 dossier already flagged Titan-Legion grain as a curated
  promotion candidate; Pass-14 produces the first Audax surface. → **new row `legio_audax`**
  with parent `mechanicus`. **Lore-iconic strong-promotion case.**
- **`Legio Castigatra` (freq 1, HH-0216 *The Ember Wolves*).** Titan Legion (paired antagonist
  to Legio Audax in *The Ember Wolves*). Parallel promotion to Legio Audax — both Titan
  Legions surface together in the same novella; promoting both maintains the Titan-vs-Titan
  symmetry of the source. → **new row `legio_castigatra`** with parent `mechanicus`. **Lore-
  iconic strong-promotion case.**
- **`Legio Cybernetica` (freq 1, HH-0209 *Myriad*).** The Mechanicum sub-organization that
  builds and commands the Kastelan robots — direct sequel to the *Cybernetica* novel (which is
  itself the Pass-9 promoted-row context). Lore-iconic Mechanicum sub-faction (the Cybernetica
  is the namesake of the *Cybernetica* novel + recurring across Mechanicum politics). → **new
  row `legio_cybernetica`** with parent `mechanicus`. **Lore-iconic strong-promotion case.**
- **`House Taranis` (freq 1, HH-0227 *The Lightning Hall*).** Loyalist Knight House — the
  Knight-House-vs-Mechanicum schism on Mars driven by Kelbor-Hal's defection. Lore-iconic
  Knight House (the parallel to Pass-13's Pass-? `house_devine` row — the loyalist counter to
  Devine's chaos secret allegiance). → **new row `house_taranis`** (Knight-House grain,
  parent: empty or `mechanicus` depending on Phase-1's Knight-House hierarchy call;
  recommendation: empty parent — Knight Houses are their own organizational tier, parallel to
  but distinct from a Legion or Mechanicum sub-organization). **Lore-iconic strong-promotion
  case.**
- **`Blackshields` (freq 1, HH-0208 *Blackshield*).** The catch-all warband category for
  Heresy-era Astartes warbands of mixed-Legion or renegade-Legion provenance fighting outside
  the loyalist / traitor binary. The Pass-14 surface is just the first hit of a much-larger
  cross-arc warband category (loop-log mentions Endryd Haar / Blackshields sub-arc kicking off
  at HH-0286 — multiple future cross-batch surfaces guaranteed). Lore-iconic, future-proofed.
  → **new row `blackshields`** (warband-grain category, parent: empty — Blackshields are by
  definition outside the standard organizational hierarchy). **Lore-iconic strong-promotion
  case.** This is the wave's most future-proof promotion (the Endryd-Haar Blackshields sub-
  arc surfaces 36 books later — promoting at this first-hit prevents Pass-26-area churn).
- **`Adeptus Administratum` (freq 1, HH-0224 *Abyssal*).** Civilian Administratum institution.
  Lower lore-profile than the Mechanicum / Titan-Legion / Knight-House / Warband promotions;
  Phase-1 judgment — recommendation: **leave unresolved** for budget conservatism unless
  Phase-1 wants Administratum-grain coverage. **Weak-promotion case.**

> Phase-1 promotion shape (recommended): **0 alias adds** (all era-rename / cross-batch
> faction cases land on Pass-10/11/12/13 aliases) + **0 strict-freq-2 new rows** (none
> available this wave) + **5 strong curated freq-1 lore-iconic new rows** (`ordo_sinister` +
> `legio_audax` + `legio_castigatra` + `legio_cybernetica` + `house_taranis` + `blackshields`
> — six total if Phase 1 takes the lore-iconic strong-promotion set) + **0..1 weak-curated
> freq-1 new row** (`adeptus_administratum`). Conservative floor: 4 strong-promotion rows
> (Ordo Sinister + Legio Cybernetica + House Taranis + Blackshields — the four most
> defensible); recommended target: **6 new rows** (all strong curated freq-1); ceiling: **7
> new rows** (recommended + Adeptus Administratum). **A medium-weight Phase-1 promotion pass**
> — heavier than Pass-13's 2-strict-freq-2 floor, all driven by curated lore-iconic Mechanicum
> / Titan-Legion / Knight-House / Warband sub-faction surface forms.

**Locations (Phase 2).** Strict freq ≥ 2 unresolved + curated freq-1 lore-iconic.

Strict freq ≥ 2:

- **`Piamen` (freq 2 — HH-0236 *Konrad Curze: A Lesson in Darkness* / HH-0237 *The Lords of
  Terra*).** Compliance world from the Konrad Curze audio drama. **Anthology-cascade
  evidence** — HH-0237 is the audio anthology re-issuing HH-0234/HH-0235/HH-0236 (per loop-log
  HH-0237: "Tags aggregated across the three constituent works per Omnibus/Anthology rule");
  the Piamen surface in HH-0237 is the same surface as HH-0236, not independent. So **strict
  freq-2 by aggregator count, effective freq-1 by independent-source evidence**. Phase-2
  judgment — see 7d for the anthology-cascade caveat. Recommendation: treat as curated freq-1
  (single-audio-drama lore-iconic Night-Lords compliance world) → **new row `piamen`** if
  Phase 2 wants completionist Night-Lords-arc grain, else leave unresolved. **Strict-freq-2-
  by-cascade promotion case** — see 7d.

Curated freq ≥ 1 lore-iconic — **the Heresy-Primarch-homeworld / vessel-grain promotion bloc**:

- **`Chemos` (freq 1, HH-0233 *The Last Phoenix* omnibus).** **Fulgrim's Primarch homeworld** —
  Emperor's-Children Primarch-birthworld surface. **The strongest lore-iconic promotion of
  Pass-14** — Chemos is foundational Emperor's Children lore (the parched factory world that
  raised Fulgrim, recurring in *Fulgrim* / *Angel Exterminatus* / the post-Heresy E.C.-arc).
  Parallel to Pass-? `barbarus` / `caliban` / `colchis` / `nuceria` / `prospero` Primarch-
  homeworld rows already in the layer. → **new row `chemos`** with parent: empty (Primarch-
  homeworld grain). **Lore-iconic strong-promotion case.**
- **`Laer` (freq 1, HH-0233 *The Last Phoenix* omnibus).** The Laer Temple of Slaanesh — the
  daemon-blade-corruption locale that turned Fulgrim. **Foundational Heresy lore** — the
  Pass-12 dossier 7d advisory about "future *Fulgrim*-adjacent `Laer`/`Laeran` disambig
  cases" arrives at this wave (HH-0233 surfaces `Laer` direct as a location). No Cross-axis
  conflict in §4 (no faction-axis Laer surface in this wave; the daemon-Laeran-species
  surface didn't surface), so the disambig is **not active** this wave. → **new row `laer`**
  with parent: empty (a fall-of-Fulgrim site; sub-locale grain). **Lore-iconic strong-
  promotion case.**
- **`Phalanx` (freq 1, HH-0247 *Burden of Duty*).** Imperial Fists star-fortress / mobile
  fortress-monastery. **Lore-iconic Imperial-Fists vessel-grain surface** — the Phalanx is the
  Fists' moving fleet-headquarters across the Heresy and post-Heresy. Per Pass-7 vessel
  convention: → **new row `phalanx`** with `tags:['vessel']` + `gx/gy:null`. **Lore-iconic
  strong-promotion case.** The Pass-13 dossier 7c already listed `phalanx` as a Phase-2
  judgment-call freq-1; Pass-14 surfaces it direct in HH-0247.
- **`Macragge's Honour` (freq 1, HH-0238 *Illyrium*).** Ultramarines flagship — vessel-grain.
  Lore-iconic (Macragge's Honour is Guilliman's flagship throughout the Heresy and post-
  Heresy). → **new row `macragges_honour`** with `tags:['vessel']` + `gx/gy:null`. **Lore-
  iconic strong-promotion case.** Parallel to Pass-13's `iron_blood` / `molechs_enlightenment`
  vessel-promotions.
- **`Irkalla` (freq 1, HH-0224 *Abyssal*).** Sisters-of-Silence Black Ship — vessel-grain.
  Loop-log HH-0224: "civilian POV inside Black Ship Irkalla; surface form `Irkalla` kept as
  named ship/location". Lore-anchored (the Sisters' Black Ships are the Pariah-detention
  fleet, recurring across Sisters-of-Silence arcs). → **new row `irkalla`** with
  `tags:['vessel']` + `gx/gy:null`. **Lore-iconic strong-promotion case.**
- **`Imperial Webway` (freq 1, HH-0215 *Ordo Sinister*).** Loop-log HH-0215: "Primary
  location 'Imperial Webway' — concrete-geographical enough (Eldar construct, not the warp),
  Terra as supporting since they defend it." The Emperor's hidden Webway project under Terra.
  Lore-iconic (the Webway Project is the central Heresy-era Imperial mega-engineering project
  that the Heresy interrupts; it underlies the post-Heresy structure of the Imperium of Man).
  → **new row `imperial_webway`** with parent: empty (a region / construct grain — not a
  planet, not a vessel). **Lore-iconic strong-promotion case.**
- **`Albia` (freq 1, HH-0228 *Eater of Dreams*).** Terran region — loop-log HH-0228: "Albia
  kept as Terran region surface form with Terra as supporting location." Heresy-era Terran-
  civilian region (the Albian Land — one of the canonical Terran sub-regions). Parallel to
  Pass-? Terran sub-locale rows already in the layer. → **new row `albia`** with parent
  `terra` (Terra sub-locale grain). **Lore-iconic medium-promotion case.**
- **`Illyrium` (freq 1, HH-0238 *Illyrium*).** Macragge province — loop-log HH-0238:
  "Macragge, the Illyrium province, and the flagship Macragge's Honour all named on-page".
  Macragge sub-locale grain. → **new row `illyrium`** with parent `macragge`. **Lore-iconic
  medium-promotion case** (the namesake of the audio-drama; province-grain parallel to other
  Ultramar / Macragge sub-locale rows).
- **`Jupiter` (freq 1, HH-0226 *The Serpent's Dance*).** Sol-system planet (Jovian shipyards
  surface). Lore-iconic Sol-system locale. → **new row `jupiter`** with parent `sol_system`
  (Sol-system planet grain, parallel to Pass-? `mars` / `luna` / `terra` rows). **Lore-iconic
  medium-promotion case.**
- **`Terra Nullius` (freq 1, HH-0201 *By the Lion's Command*).** Loop-log HH-0201: "Corswain
  confronts the neutral system Terra Nullius while pursuing Typhon's Death Guard". Single-
  novella surface; lore-thin (Terra Nullius is essentially a one-off neutral-system surface
  in the Dark Angels short-story). Phase-2 judgment — recommendation: **leave unresolved**
  (single-novella, low cross-arc warrant). **Weak-promotion case.**
- **`Single-novel campaign worlds / sub-locales (varying weight; Phase-2 judgment):**
  - **`60-Sixty` (freq 1, HH-0231 *Crusade's End* omnibus).** = Sixty-Three / Murder system
    from *Horus Rising*. Phase-2 judgment — recommendation: leave unresolved (numeric-named
    Murder-system surface, low promotion warrant; Sixty-Three Fourteen / Goughen is the
    Pass-13 `mayder_oquin` namesake, distinct).
  - **`Absalom` (freq 1, HH-0216 *The Ember Wolves*).** Single-novella Titan-duel world.
    Phase-2 judgment — recommendation: leave unresolved.
  - **`Astagar` (freq 1, HH-0217 *The Laurel of Defiance*).** = Pass-13 `astagar` already
    listed as Phase-2 judgment-leave-unresolved. Same recommendation: **leave unresolved**
    (single-anthology-mention echo, low surface evidence — note: this is the SAME Astagar
    that surfaced at HH-0141 *Sedition's Gate* in Pass-13; cross-pass cumulative evidence is
    now freq-2 cross-batch — Phase-2 may want to reconsider for a curated freq-2-cumulative
    promotion if it tracks cumulative cross-pass surfaces).
  - **`Kronus` (freq 1, HH-0207 *Inheritor*).** Word Bearers Templum Daemonarchia world,
    referenced as Dawn-of-War (game) world. Phase-2 judgment.
  - **`Thawra` (freq 1, HH-0223 *Prologue to Nikaea*).** Single-short-story surface where
    Malcador meets the Phase-1-`low_confidence:factions`-flagged figures. Phase-2 judgment —
    recommendation: leave unresolved (lore-thin, no cross-arc surface).
  - **`Zaramund` (freq 1, HH-0213 *Exocytosis*).** *Angels of Caliban* sequel world. Phase-2
    judgment — recommendation: leave unresolved (sequel-context-dependent).

> Phase-2 promotion shape (recommended): **0 alias adds** (no new location-axis aliases this
> wave) + **0..1 strict-freq-2 new rows** (`piamen` — but only if Phase 2 accepts the
> anthology-cascade evidence; see 7d) + **8 strong curated freq-1 lore-iconic new rows**
> (`chemos` + `laer` + `phalanx`-vessel + `macragges_honour`-vessel + `irkalla`-vessel +
> `imperial_webway` + `albia` + `illyrium` + `jupiter`) + **0..6 weak-curated freq-1 long-tail
> new rows** (`terra_nullius` / `60_sixty` / `absalom` / `kronus` / `thawra` / `zaramund` —
> Phase-2 judgment per row). Conservative floor: 5 new rows (the most defensible strong-
> promotion set: Chemos + Laer + Phalanx + Macragge's Honour + Imperial Webway); recommended
> target: **8 new rows** (all strong curated freq-1, no Piamen); ceiling: **15 new rows**
> (recommended + Piamen + 6 weak-curated). **Heavier than Pass-13 on the location axis** —
> the Heresy-Primarch-homeworld surface (`chemos`) + the vessel-promotion bloc (`phalanx`,
> `macragges_honour`, `irkalla`) + the regional / planetary anchors (`imperial_webway`,
> `albia`, `illyrium`, `jupiter`) all bulk the curated cut. The vessel-grain triple (Phalanx,
> Macragge's Honour, Irkalla) is the heaviest vessel-promotion bloc of the HH arc.

**Characters (Phase 3).** See 7a (1 alias add: `the Emperor → the_emperor`) + 7b (2 spine
rows: `macer_varren` + `helig_gallor`). Plus the freq-1 long tail.

Curated freq-1 lore-iconic character candidates (Phase-3 discretion):

- **Lore-iconic / cross-arc supporting cast (strong promotion candidates):**
  - **`Hydragyrum`** (HH-0215 *Ordo Sinister*). Female pariah-princeps protagonist — the
    Ordo Sinister namesake-audio-drama's protagonist (loop-log HH-0215: "female pariah-
    princeps protagonist (Hydragyrum) → protagonist_gender=female, protagonist_class=multi
    (Titan crew)"). Lore-iconic Ordo-Sinister-faction-protagonist (cross-arc with the new
    Phase-1 `ordo_sinister` row). → **new row `hydragyrum`**. primaryFactionId
    `ordo_sinister` (the new Phase-1 row — FK dependency on Phase 1).
  - **`Sibel Niasta`** (HH-0235 *Malcador: First Lord of the Imperium* / HH-0237 anthology-
    cascade). Co-protagonist of the Malcador audio drama. **Anthology-cascade strict freq-2**
    (HH-0237 is the audio anthology aggregating HH-0235; not strict independent freq-2).
    Phase-3 judgment — see 7d. Recommendation: **promote `sibel_niasta`** despite the cascade
    caveat — the character is a co-protagonist of a major Malcador audio drama (carries half
    the script weight per loop-log), and the *Malcador: First Lord of the Imperium* audio is
    among the most-anchored Malcador works in the Heresy series. primaryFactionId
    `adeptus_astra_telepathica` (direct §3 — Niasta's astropath corps; the existing canonical
    anchor).
  - **`Marcus Valerius` Pass-13-confirmation** — already direct (Pass-13 row, HH-0243). Skip
    (no Phase-3 action).
  - **`Helig Gallor` 7b** — see 7b (strict freq-2 cross-batch promotion).
  - **`Macer Varren` 7b** — see 7b (strict freq-3 cross-batch promotion).
  - **`Corswain` Pass-13-confirmation** — already direct (Pass-13 row, HH-0201). Skip.
  - **`Talos`** (HH-0221 *Massacre*). Night-Lords Soul-Hunter — the central Talos figure of
    the post-Heresy *Soul Hunter* / *Blood Reaver* / *Void Stalker* trilogy. Lore-iconic
    Night-Lords cross-arc protagonist. **Already direct in §3** — `talos` row exists. Skip.
  - **`Xarl`** (HH-0221 *Massacre*). Night-Lords (Talos's First Claw). Lore-iconic supporting
    cast (cross-arc with the post-Heresy Night-Lords trilogy). **Already direct in §3** —
    `xarl` row exists. Skip.
  - **`Cyrion`** (HH-0221 *Massacre*). Night-Lords (Talos's First Claw). **Already direct in
    §3** — `cyrion` row exists. Skip.
  - **`Borealis Thoon`** (HH-0215 *Ordo Sinister*). Supporting cast in the Ordo Sinister
    audio drama. Phase-3 judgment — recommendation: **leave unresolved** (single-audio-drama
    supporting cast, lore-thin beyond the namesake work).
  - **`Crysos Morturg`** (HH-0208 *Blackshield*). Blackshield protagonist of the namesake
    short. Cross-arc with the future Endryd Haar Blackshields sub-arc (HH-0286+). Lore-
    iconic — first-named Blackshield with a POV anchor. → **new row `crysos_morturg`**.
    primaryFactionId `blackshields` (the new Phase-1 row — FK dependency on Phase 1).
  - **`Yored Massak`** (HH-0247 *Burden of Duty*). Knights-Errant Imperial-Fists Librarian
    recruited by Garro on the Phalanx. Cross-arc with the Garro / Knights-Errant network
    (cross-pass confirmation HH-0272 *Garro: Burden of Duty* alternate-canon reissue).
    Loop-log HH-0247: "Phalanx as primary location (star-fortress / sub-location)". Phase-3
    judgment — recommendation: **promote `yored_massak`**. primaryFactionId `knights_errant`.
  - **`Torquill Eliphas`** (HH-0207 *Inheritor*). Word Bearers / Ark of Testimony Chapter
    constructor of the Templum Daemonarchia on Kronus. Lore-iconic in the Dawn of War (game)
    crossover and the Word-Bearers Shadow-Crusade arc. Phase-3 judgment — recommendation:
    **promote `torquill_eliphas`**. primaryFactionId `word_bearers`.
  - **`Khorak`** (HH-0208 *Blackshield*). Renegade Deathshroud Death Guard vs Blackshield
    Morturg. Lore-thin beyond the namesake short (the loyalist-Crysos-Morturg side has more
    arc warrant). Phase-3 judgment — recommendation: **leave unresolved** (single-novella
    antagonist, weak cross-arc warrant).
  - **`Gabriel Santar`** (HH-0203 *The Phoenician*). Iron Hands officer — vantage character
    for the Fulgrim/Ferrus duel at Isstvan V. Phase-3 judgment — recommendation: leave
    unresolved (single-short-story vantage, weak cross-arc warrant).
- **Single-novel POVs / strong supporting cast (medium promotion candidates):**
  - **`Lycus`** (HH-0206 *Tallarn: Siren*). Marshal Lycus — Tallarn-arc Tallarn-Cohort
    officer. Cross-arc with the Tallarn novella set (Pass-13's Tallarn-arc Susada Syn
    cross-reference). Phase-3 judgment.
  - **`Jorin Bloodhowl`** (HH-0229 *Bloodhowl*). Space Wolves internal-fracture POV. Phase-3
    judgment.
  - **`Gunnar Thorolfsson`** (HH-0229 *Bloodhowl*). Space Wolves supporting cast. Phase-3
    judgment.
  - **`Gendor Skraivok`** (HH-0212 *The Painted Count*). Night-Lords "Painted Count" namesake
    — the daemon-blade figure aboard the Nightfall. Cross-arc with the post-Heresy Night-
    Lords arc + the Painted-Count daemon-weapon thread. Phase-3 judgment — recommendation:
    **promote `gendor_skraivok`** (lore-anchored Night-Lords sub-arc figure).
  - **`Captain Shang`** (HH-0212 *The Painted Count*). Night-Lords supporting cast on the
    Nightfall. Phase-3 judgment.
  - **`Ammon`** (HH-0238 *Illyrium*). Ultramarines co-POV. Phase-3 judgment.
  - **`Tarasha Euten`** (HH-0238 *Illyrium*). Ultramarines/civilian co-POV. Phase-3
    judgment.
  - **`Nivalus`** (HH-0236 *Konrad Curze: A Lesson in Darkness* / HH-0237 anthology-cascade).
    Iterator on Piamen — the Curze-audio-drama supporting cast. **Anthology-cascade strict
    freq-2** (HH-0237 anthology aggregates HH-0236 surfaces); not strict independent freq-2.
    Phase-3 judgment — see 7d. Recommendation: **leave unresolved** for budget conservatism
    (the iterator role is supporting cast, not protagonist; the Sibel-Niasta promotion is
    the priority anthology-cascade case).
  - **`Iacton Cruze`** (HH-0246 *Grey Angel*). NOT the Pass-? Iacton Qruze — different
    spelling, different character (the HH-0246 "Iacton Cruze" is a Dark Angels figure tested
    by Loken on Caliban; the Pass-? `iacton_qruze` is the Sons-of-Horus Half-heard). **Cross-
    axis surface-form disambig** — same surface family, different identities. Phase-3
    `## Needs decision`-flag candidate (see 7d). Recommendation: **leave unresolved** + flag
    for Phase-3 / future-pass clarification.
  - **`Saul Tarvitz` confirmation** — already direct (Pass-? row, HH-0231 omnibus). Skip.
  - **`Tarik Torgaddon` confirmation** — already direct (Pass-12 row, HH-0231 omnibus). Skip.
- **Single-novel supporting cast (weak promotion candidates — Phase-3 judgment, default leave
  unresolved):**
  - **`Aveth Vairon`** (HH-0224 *Abyssal*). Civilian POV inside Black Ship Irkalla.
  - **`Hakeem`** (HH-0248 *Garro: Sword of Truth*). Garro-arc supporting cast.
  - **`Ahrem Gallikus`** (HH-0218 *Immortal Duty*). Iron-Hands Medusan-Immortal POV.
  - **`Arcatus Vindix Centurio`** (HH-0211 *The Grey Raven*). Custodian supporting cast.
  - **`Balsar Kurthuri`** (HH-0211 *The Grey Raven*). Raven-Guard supporting cast.
  - **`Balthus Voltemand`** (HH-0216 *The Ember Wolves*). Titan-duel supporting cast.
  - **`Nicanor`** (HH-0210 *Into Exile*). Imperial-Fists officer extracting Arkhan Land from
    Mars.
  - **`Noriz`** (HH-0211 *The Grey Raven*). Raven-Guard / Custodes / Imperial-Fists
    supporting cast.
  - **`Raf Maven`** (HH-0227 *The Lightning Hall*). House-Taranis Knight scion POV.
  - **`the Exalted`** (HH-0221 *Massacre*). Generic Night-Lords leader epithet. Phase-3
    judgment — recommendation: **leave unresolved** (epithet, not a personal name; generic
    leader designation).

> Phase-3 promotion shape (recommended): **1 alias add** (Case A `the Emperor → the_emperor`)
> + **2 strict-freq-2/3 cross-batch new rows** (7b `macer_varren` + `helig_gallor`) + **5
> strong curated freq-1 lore-iconic new rows** (`hydragyrum` + `sibel_niasta` + `crysos_morturg`
> + `yored_massak` + `torquill_eliphas`) + **0..6 medium-curated freq-1 new rows**
> (`gendor_skraivok` + `lycus` + `jorin_bloodhowl` + `ammon` + `tarasha_euten` + `captain_shang`
> — Phase-3 judgment per row) + **0..10 weak-curated long-tail new rows** (the remaining freq-1
> long tail). Conservative floor: 2 new rows (7b: macer_varren + helig_gallor) + 3 strongest
> freq-1 (Hydragyrum + Sibel Niasta + Crysos Morturg — the new-faction-row-coupled promotions:
> Hydragyrum-on-ordo_sinister + Crysos-Morturg-on-blackshields, plus Sibel-Niasta-on-existing-
> adeptus_astra_telepathica) + 1 alias add. Recommended target: **~9 new rows** (floor + 4
> additional strong-promotion + a few medium) + 1 alias. Ceiling: **~15 new rows** + 1 alias.
> **A medium-weight Phase-3 promotion pass** — between Pass-13's recommended +14 and a much-
> lighter floor. The 7b spine pair anchors the strongest cases; the audio-drama / Knights-
> Errant / Ordo-Sinister-faction-coupling supporting-cast tail bulks the curated cut.

### 7d. needs-decision candidates (expected: 0 hard blockers)

- **Forward-ref Guard post-Brief-101: expected `out-of-range=0, unknown-work=0`.** Pass-14 has
  **three roster-collection omnibi** in the wave per §5: HH-0231 *Crusade's End* → constituents
  HH-0001..HH-0004 (already applied at Pass 10), HH-0232 *The Razing of Prospero* →
  constituents HH-0012 + HH-0015 (already applied at Pass 11), HH-0233 *The Last Phoenix* →
  constituents HH-0005 + HH-0023 + HH-0044 (HH-0005 / HH-0023 applied at Pass 10–11, HH-0044
  applied at Pass 11). All cited constituents are within the cumulative Pass-14 apply range
  HH-0001..HH-0250 — Brief-101 reason-split + range-aware Guard handles this cleanly. Pass-14
  expects: 0 out-of-range refs (all constituents in-range), 0 unknown-work refs (all
  constituents are known works in the roster). Phase 4a verifies the counts; mismatch
  (`unknown-work > 0` or `out-of-range > 0`) is a `## Needs decision` stop. **Not a hard
  block** — the Guard is wired correctly per Brief 101 + Pass-11/12/13 experience.
- **HH-0237 anthology-cascade evidence for `Sibel Niasta` / `Nivalus` / `Piamen` (Phase 2 +
  Phase 3).** HH-0237 *The Lords of Terra* is an audio anthology re-issuing HH-0234 / HH-0235
  / HH-0236 (per loop-log "Tags aggregated across the three constituent works per
  Omnibus/Anthology rule"). Three surface forms in §3 register freq-2 via this anthology
  cascade rather than independent cross-batch evidence: `Sibel Niasta` (HH-0235 + HH-0237 —
  cascade from HH-0235), `Nivalus` (HH-0236 + HH-0237 — cascade from HH-0236), `Piamen`
  (HH-0236 + HH-0237 — cascade from HH-0236). All three are effectively **single-independent-
  source freq-1** despite registering freq-2 in the mechanical aggregate count. **Phase-N
  judgment:** treat as strict-freq-2-by-cascade (legitimate promotion ground per the freq-2
  rule's literal reading) OR as curated-freq-1 (more conservative — anthology re-issues don't
  add new evidence). Recommendations per surface: `sibel_niasta` (promote — co-protagonist
  carries lore-warrant beyond the cascade), `nivalus` (leave unresolved — supporting cast,
  weak cross-arc), `piamen` (Phase-2 judgment — leave unresolved for budget conservatism, or
  promote if Phase-2 wants completionist Night-Lords-compliance-world grain). The
  anthology-cascade question itself is a **runbook-evolution issue**: future passes may want
  the aggregator to flag anthology-cascade surfaces explicitly (e.g. a freq-2-cascade vs
  freq-2-independent distinction in §3) to avoid this judgment-call burden. **Not a hard
  block** — Phase-N decides per surface; recommendation above.
- **`Iacton Cruze` ↔ `Iacton Qruze` Phase-3 disambig (7c).** HH-0246 *Grey Angel* surfaces
  `Iacton Cruze` (note: "Cruze", not "Qruze") as a Dark-Angels figure tested by Loken on
  Caliban. The existing Pass-? `iacton_qruze` row is the Sons-of-Horus "Half-heard" /
  veteran figure. **Same-surface-family different-identity case** — Phase 3 chooses between
  (a) flag as a typo / variant-spelling of `Iacton Qruze` (alias `Iacton Cruze → iacton_qruze`
  — assuming a misspelling in the override), (b) treat as a distinct character (new row
  `iacton_cruze` — assuming the surface is correct as authored), (c) leave unresolved + `##
  Needs decision`. Recommendation: **(c) leave unresolved + flag for source-coverage
  re-verification** — the Pass-14 surface evidence (one short-story mention) is insufficient
  to commit to (a) or (b); a future pass with cross-arc confirmation will clarify. The
  loop-log HH-0246 line is sparse ("Loken on Caliban testing Dark Angels' loyalty"), so the
  Cruze-vs-Qruze identity question rests on the override file's spelling — which Phase 3
  does **not** read in the resolver-pass context (per runbook §1). **Not a hard block** —
  Phase 3 leaves unresolved, flags the disambig, defers to a future pass.
- **`Astagar` Pass-13-and-Pass-14 cumulative cross-batch evidence (Phase 2).** `Astagar`
  surfaced freq-1 in Pass-13 HH-0141 *Sedition's Gate* and again freq-1 in Pass-14 HH-0217
  *The Laurel of Defiance* (the Macragge ceremony with Astagar flashback). **Cumulative
  cross-pass freq-2.** Phase-2 may now reconsider the Pass-13-listed-as-leave-unresolved
  recommendation in light of the new evidence. Recommendation: **promote `astagar`** as a
  curated freq-2-cumulative cross-pass promotion if Phase-2 tracks cumulative cross-pass
  evidence (parallel to how Pass-13 Case-D-companion `revuel_arvida` consolidated cross-batch
  surfaces from different waves). Phase-2 judgment. **Not a hard block.**
- **`Blackshields` warband-vs-aggregator-faction grain (Phase 1).** Phase 1 chooses how to
  model `blackshields` — (a) flat faction-grain row `blackshields` (the catch-all warband
  category for renegade-or-mixed Astartes), (b) leave unresolved long-tail until the future
  Endryd-Haar sub-arc (HH-0286+) provides cross-batch evidence. Recommendation: **(a) promote
  `blackshields`** — the cross-arc warrant is strong (Endryd-Haar Blackshields sub-arc
  surfaces 36 books later per loop-log; promoting at first-hit prevents Pass-26-area churn).
  Phase 1 judgment. **Not a hard block.**
- **Format conflicts (Phase 4a-side, not Phase 1/2/3).** HH-0237 *The Lords of Terra* has
  `data_conflict:format->anthology` (roster says `audio_drama` but the release is structurally
  an anthology re-issuing HH-0234/HH-0235/HH-0236); HH-0210 *Into Exile* has
  `data_conflict:slug->into-exile` (roster slug `into-exhile` vs canonical `into-exile`);
  HH-0219 *Champion of Oaths* and HH-0220 *Child of Chaos* both have
  `data_conflict:releaseYear->2018` (roster 2017, Goodreads/BL first publication 2018). Phase
  4a applies the override as authored; the format / slug / releaseYear conflicts surface in
  the apply digest as advisory carry-through. **Not a Phase-1/2/3 concern.**
- **`low_confidence:*` advisory carry-through (10 flags, Phase 4a-side, not Phase 1/2/3).**
  HH-0202 *All That Remains* (`characters` + `locations`), HH-0204 *Artefacts* (`locations`),
  HH-0206 *Tallarn: Siren* (`characters`), HH-0208 *Blackshield* (`locations`), HH-0209
  *Myriad* (`characters`), HH-0223 *Prologue to Nikaea* (`factions`), HH-0229 *Bloodhowl*
  (`locations`), HH-0230 *Amor Fati* (`locations`), HH-0234 *Perturabo: Stone and Iron*
  (`locations`), HH-0239 *The Revelation of the Word* (`locations`), HH-0250 *Strike and Fade*
  (`characters`). All advisory carry-through for the audit cockpit; does not gate resolver
  axes. **Not a Phase-1/2/3 concern.**
- **Cumulative milestone — HH-domain 250-book mark.** After this pass: **250 HH books**
  (200 applied through Pass 13 + 50 in this wave). The Phase 4b impl-report should flag this
  as the **HH 250-book milestone** — first-time crossing the 250-book mark in the HH
  authority layer. Remaining HH-domain tail: 859 - 814 cumulative-pre-pass = 45-ish books
  to go (loop-helper detector knows the total; the next 4-5 waves close the HH domain).
- **Cross-axis surface-form conflicts** — **none in this wave** per §4. The Pass-14 surface
  set is clean on that axis-disambig front. The Pass-11/12 advisories about future
  *Fulgrim*-adjacent `Laer`/`Laeran` and similar disambig cases would activate this wave
  (HH-0233 *The Last Phoenix* omnibus surfaces `Laer` direct in §3 — locations axis only),
  but the faction-axis `Laeran` daemon-species surface didn't materialize, so the
  cross-axis disambig is **not active** this wave. Phase 2 may promote `laer` cleanly.

The per-axis promotion extents (7c), the 7a strict-freq-2 alias add, and the 7b cross-batch
spine pair are in-phase **judgments**, justified in each phase report — none escalates to a
hard block under current evidence. The Brief-091 forward-ref Guard is wired correctly (Brief
101 reason-split landed at Pass-10), and Pass-14's three roster-collection omnibi all point to
in-range constituents (clean Guard outcome expected), so the architectural concern is closed;
Phase 4a only verifies the expected `out-of-range=0, unknown-work=0` counts.
