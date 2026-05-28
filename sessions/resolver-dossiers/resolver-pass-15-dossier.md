# Resolver-Pass 15 — Phase-0 Dossier (ssot-hh-026..030 / HH-0251..HH-0294)

> Deterministic cross-axis context for the three axis-phases (Factions / Locations / Characters) + the
> Phase-4 integration. **Sections 2–6 are the mechanical output** of
> `scripts/aggregate-surface-forms.ts --config scripts/resolver-pass.config.json` (read-only, idempotent —
> re-running on the committed override files + seed-data yields byte-identical output). **Section 7 is the
> only LLM-synthesized part** (cross-batch alias-consolidation + needs-decision candidates; this wave is
> the *first-cycle Heresy audio-drama bloc* + the *late-Heresy Garro re-issue trilogy* + the
> *Endryd-Haar Blackshields sub-arc* + the *HH artbook/scriptbook bloc*, so Section 7 leans on two
> Phase-1 Mechanicum / Officio-Sigillite curated freq-1 promotions, a Phase-2 sub-locale + daemon-
> world + vessel-grain promotion bloc plus one strict-freq-2 location alias case (`Solar System → sol_system`),
> two Phase-3 strict-freq-2/3 alias-consolidation cases (`Aenoid Thiel → aeonid_thiel` typo variant +
> `Bjorn the One-Handed → bjorn` Pre-Dreadnought honor-title variant), one strict-freq-3 within-batch
> character spine (`Endryd Haar` for the Blackshields sub-arc — the Pass-14-forecasted first hit), and
> a strong curated freq-1 supporting-cast tail — plus one **needs-decision disambig case** for the
> Heresy-era `Lord Cypher` title vs. the existing `cypher` Fallen-era canonical row). Phases 1–4 read
> THIS file, not the 5 override files or the loop-log. Brief-free pass (Brief 094 lean contract); the
> operative spec is [`sessions/resolver-pass-runbook.md`](../resolver-pass-runbook.md) + the per-pass
> config — no architect brief is read to run a phase.

## 1. Scope header

- **Wave:** `ssot-hh-026..030` (5 loop batches, **44 books** — 40 audio dramas in batches 026–029 plus
  the 4-book HH artbook/scriptbook tail in batch 030, picking up directly after the Pass-14 wave of
  50 books at HH-0201..HH-0250). Wave size confirmed by the loop-helper after Pass-14 settled
  cleanly (works 858/cumulativeAfter after ssot-hh-030 — the **near-final** HH wave; only
  ~1 batch (~10 books) remains in the HH-domain authority layer after this pass before the HH
  corpus closes out).
- **IDs:** `HH-0251..HH-0294` (44 books). Composition is the **first-cycle Heresy audio-drama bloc**
  (HH-0251..HH-0260, ssot-hh-026, 2012–2014 audio dramas — the foundational Black-Library Heresy
  audio-drama series after the 2007 Original Six), the **mid-Heresy Legion-vignette audio-drama
  bloc** (HH-0261..HH-0270, ssot-hh-027, 2014–2015 audio dramas — Imperial Fists / Night Lords /
  Iron Warriors / Blood Angels mid-Heresy beats), the **late-Heresy Garro-trilogy re-issue + Pharos
  / Sicarus / Tallarn-tail bloc** (HH-0271..HH-0280, ssot-hh-028, 2015–2017 audio dramas including
  the 2017 Garro audio-drama re-issue trio), the **Siege-prelude + Endryd-Haar Blackshields
  sub-arc bloc** (HH-0281..HH-0290, ssot-hh-029, 2016–2019 audio dramas — Cabal / Mechanicum-
  succession / Blackshields trilogy), and the **HH artbook + scriptbook tail bloc** (HH-0291..HH-0294,
  ssot-hh-030, 2007–2018 reference-volume re-issues — Collected Visions / Scripts Volume I + II /
  Visions of Heresy 2018 edition):
  - **ssot-hh-026 / HH-0251..HH-0260** = the **first-cycle Heresy audio-drama bloc** (2012–2014).
    Veritas Ferrum (Iron Hands at Isstvan V — `low_confidence:characters`), The Sigillite (Malcador
    + Khalid Hassan on Terra / Gyptus — namesake Officio-Sigillite audio drama), Honour to the Dead
    (Aeonid Thiel + Ultramarines + Word Bearers at Calth / Ithraca — `low_confidence:characters`,
    surface form `Fire Masters` + `Legio Praesagius`), Wolf Hunt (Space Wolves Severian hunted by
    Imperial agent Yasu Nagasena), Censure (Aeonid Thiel + Vultius + Kurtha Sedd at Calth — the
    follow-up novella to *Know No Fear*), Thief of Revelations (Ahriman + Magnus the Red + Sobek
    + Amon + Hathor Maat + Thousand Sons at Planet of Sorcerers / Eye of Terror — post-Prospero
    Tizca-aftermath audio drama), Kharn: The Eightfold Path (Kharn + World Eaters + Angron),
    Lucius: The Eternal Blade (Lucius + Sanakht + Emperor's Children at Planet of Sorcerers / Eye
    of Terror), Cypher: Guardian of Order (Lord Cypher title-character + Astelan + Luther +
    Zahariel on Caliban Northwilds — the Heresy-era Dark Angels Order-of-Caliban audio drama
    that surfaces the title position that becomes the post-Heresy *Cypher* identity — see §7d for
    the Cross-Era disambig), Hunter's Moon (Space Wolves Tidon + Sareo + Ven + Felbjorn on
    Pelago).
  - **ssot-hh-027 / HH-0261..HH-0270** = the **mid-Heresy Legion-vignette audio-drama bloc**
    (2014–2015). Wolf's Claw (Space Wolves Bjorn the One-Handed at Alaxxes Nebula — the
    Pre-Dreadnought Bjorn-Fell-Handed honor-title variant; see 7a Case B), Templar (Sigismund +
    Imperial Fists vs Kharn + Jubal Khan on Sol System), Garro: Shield of Lies (Garro + Malcador
    + Katanoh Tallery on Riga Orbital Plate — Knights-Errant arc continuation), Master of the
    First (Astelan + Luther + Captain Melian + Tylaine on Caliban Northwilds — Dark Angels
    Heresy-era), The Long Night (Sevatar + Night Lords — `low_confidence:locations`), Strategem
    (Aeonid Thiel + Ultramarines at Macragge — `data_conflict:title->Stratagem` roster typo),
    The Herald of Sanguinius (Sanguinius + Azkaellon + Sanguinary Guard + Blood Angels at
    Macragge), The Watcher (Ison + Imperial Fists + Malcador on Sol System), The Eagle's Talon
    (Iron Warriors at Tallarn — `low_confidence:characters`), Iron Corpses (Iron Warriors Koparnos
    at Tallarn — namesake Tallarn-arc audio drama).
  - **ssot-hh-028 / HH-0271..HH-0280** = the **late-Heresy Garro-trilogy re-issue + Pharos /
    Sicarus / Tallarn tail bloc** (2015–2017). Garro: Ashes of Fealty (Garro + Meric Voyen +
    Knights-Errant Death-Guard search), Garro: Burden of Duty (Garro + Yored Massak + Knights-
    Errant on the Phalanx — 2017 re-issue of the Pass-14 HH-0247 original), Garro: Oath of Moment
    (Garro + Tylos Rubio + Knights-Errant at Numinus — Calth-region audio drama), Raptor (Raven
    Guard Navar Hef survival at Isstvan V), Grey Talon (Bion Henricos + Hibou Khan — White-Scars-
    cross-Iron-Hands audio drama), Red-Marked (Aeonid Thiel + Ultramarines vs Word Bearers at
    Oran / Ultramar), The Either (Sons of Horus + Iron Hands Shadrak Meduson + Tybalt Marr at
    Dwell — the Shattered-Legions sub-arc), The Heart of the Pharos (Salamanders Tebecai +
    Oberdeii on Sotha / Mount Pharos — Pharos-beacon arc), The Thirteenth Wolf (Space Wolves
    Bulveye on Prospero — post-Prospero-burning Space Wolves audio drama), Children of Sicarus
    (Word Bearers Kor Phaeron + Larazzar at Sicarus / Eye of Terror — Word-Bearers daemon-world
    arc).
  - **ssot-hh-029 / HH-0281..HH-0290** = the **Siege-prelude + Endryd-Haar Blackshields sub-arc
    bloc** (2016–2019). Perpetual (Cabal + Oll Persson + John Grammaticus + Katt at Andrioch —
    Pass-? Perpetuals-arc audio drama), The Soul, Severed (Eidolon + Fulgrim + Archorian +
    Emperor's Children — `low_confidence:locations`), Valerius (Marcus Valerius + Corax + Raven
    Guard + Therion Cohort at Beta-Garmon — namesake-driven Pass-13/14 Marcus-Valerius cross-
    pass extension), The Binary Succession (Kelbor-Hal + Zagreus Kane + Vethorel + Mechanicum
    on Mars — the Heresy-era Mechanicum succession-crisis audio drama), Dark Compliance (Argonis
    Sons-of-Horus emissary at Accazzar-Beta — the late-Heresy Heretic-Astartes compliance arc),
    Blackshields: The False War (Endryd Haar + Blackshields + Mechanicum + World Eaters at
    Xana-Tisiphone — the **first hit** of the Pass-14-forecasted Endryd-Haar Blackshields sub-arc),
    Blackshields: The Red Fief (Endryd Haar + Blackshields at Duat — the Blackshields trilogy
    middle), Hubris of Monarchia (Alcaeus + Orks at Ghaslakh — the namesake-driven Imperial Fists
    audio drama), Nightfane (Salamanders + Aenoid Thiel typo + at Bael — see 7a Case A for the
    `Aenoid Thiel → aeonid_thiel` typo alias), Blackshields: The Broken Chain (Endryd Haar +
    Erud Vahn + Blackshields trilogy finale — `low_confidence:locations`).
  - **ssot-hh-030 / HH-0291..HH-0294** = the **HH artbook + scriptbook tail bloc** (2007–2018
    reference volumes). Collected Visions (HH artbook 2007 — multi-Legion overview, surface forms
    aggregate across the full HH series), Horus Heresy: The Scripts Volume I (HH scriptbook 2012
    — includes the **Original Six** audio-drama scripts from 2007: The Dark King, The Lightning
    Tower, Raven's Flight, plus Garro: Legion of One, Butcher's Nails, Grey Angel — see Pass-14
    HH-0241..HH-0246 for the audio-drama originals), Horus Heresy: The Scripts Volume II (HH
    scriptbook 2014 — second scriptbook compilation), Visions of Heresy 2018 ed. (re-issue
    artbook with updated commentary). All four are **reference / overview** volumes — surface
    forms span the entire HH cast (e.g. all Primarchs / all Legions in the artbooks), so the
    aggregate `freq` per surface form across HH-0291..HH-0294 captures the artbook/scriptbook
    overview-coverage tier, not strict campaign-page-count evidence. Notable for §6 / §5: **no
    omnibus / anthology entries** this wave (§5 is empty — none of HH-0291..HH-0294 carries
    `relatedBookIds` per the roster, since the artbooks/scriptbooks are reference volumes, not
    novel-omnibi). Audio-drama format dominates 40/44 books; the 4 ssot-hh-030 entries are the
    only non-audio-drama format (2 artbooks, 2 scriptbooks).
- **Cumulative:** **294 HH books** in the HH authority layer after this pass (250 applied through
  Pass 14 + 44 new in this wave). The Pass-14 dossier flagged the **HH-domain 250-book milestone**;
  Pass-15 crosses into the **HH-domain near-final** range — only ~1 batch (~10 books) of HH-domain
  works remains after this pass before the HH corpus closes out at the ~304-book mark (per the
  loop-helper detector running ahead of the pass). W40K side stays sealed at 565/565 books — out
  of scope for this pass.
- **Resolver baseline (pre-Pass-15 reference rows + aliases, emitted by the aggregator):** factions
  **199** rows / **72** aliases · locations **283** / **22** · characters **481** / **61**. The
  Pass-14 deltas vs. the Pass-14 baseline (194/71 · 275/20 · 474/60) are visible: **+5 faction rows
  / +1 faction alias / +8 location rows / +2 location aliases / +7 character rows / +1 character
  alias**. Pass-14 absorbed the Mechanicum / Titan-Legion / Knights-Errant promotion bloc + the
  Heresy-Primarch-homeworld + vessel-grain bloc (Chemos / Laer / Phalanx / Macragge's Honour /
  Irkalla / Imperial Webway / Albia / Illyrium) + the Knights-Errant-cross-arc spine pair (Macer
  Varren + Helig Gallor), so Pass-15's surface set lands on a thick anchor catalog: **every
  freq ≥ 2 Primarch surface in this wave catches its Pass-10/11/12/13/14 row direct**, **every
  freq ≥ 2 Legion / sub-Legion faction in this wave catches its Pass-10/11/12/13/14 row or alias
  direct** (Sons of Horus 7 / Word Bearers 9 / Ultramarines 11 / Space Wolves 7 / Imperial Fists
  7 / World Eaters 7 / Dark Angels 6 / Night Lords 6 / Alpha Legion 5 / Death Guard 5 / Iron
  Hands 5 / Raven Guard 5 / Thousand Sons 5 / Emperor's Children 4 / Iron Warriors 4 / Mechanicum
  4-via-alias / White Scars 4 / Blackshields 3-via-Pass-14-row / Blood Angels 3 / Knights-Errant
  3-via-Pass-11-alias / Luna Wolves 3-via-Pass-10-alias / Adeptus Custodes 2 / Knights Errant
  2-direct / Salamanders 2 / Imperial Army 2-via-Pass-10-alias), and the Cross-Era alias chains
  (Luna Wolves / Knights-Errant / Mechanicum / Imperial Army / Horus Lupercal / Kharn / Khârn /
  Lucius / Corvus Corax) all confirmed by §3. The new work in §7 is **two Phase-3 strict-freq-≥2
  alias-consolidation cases** (`Aenoid Thiel → aeonid_thiel` typo variant + `Bjorn the One-Handed
  → bjorn` Pre-Dreadnought honor-title variant) + **one strict-freq-2 location alias case**
  (`Solar System → sol_system`) + **one strict-freq-3 within-batch character spine** (`Endryd
  Haar` for the Pass-14-forecasted Blackshields sub-arc) + a curated freq-1 lore-iconic
  promotion bloc spanning all three axes.
- **Apply range Phase 4:** `hh 1..30` (config `aggregator.applyRange` = `{ domain: "hh", from: 1,
  to: 30 }`). Idempotent delete-then-insert re-apply of `ssot-hh-001..025` (already applied at
  Pass 10–14, no churn — the data has not changed) + first-time apply of `ssot-hh-026..030` (44
  new books). Domain-aware Trias-Batch-Range tuples for the apply-side trio
  (`apply-override-dry.ts` / `test-resolver-coverage.ts` / `test-resolver-data-integrity.ts`) are
  appended with the **five new `{ domain: "hh", n: "026" }` .. `{ domain: "hh", n: "030" }`
  entries** alongside the existing W40K-001..057 + HH-001..025 set (runbook §3 Phase 4a + config
  `phase-4a-integration.trigger`).
- **Clusters (observed; config has no `clusters` field this pass, so §3's cluster column stays `?`):**
  - `ssot-hh-026` → **HH-0251..HH-0260 — first-cycle Heresy audio-drama bloc (2012–2014).** Ten
    single-author Black Library audio dramas marking the first major wave of post-Original-Six HH
    audio-drama production: Iron-Hands vantage at Isstvan V (HH-0251), Officio-Sigillite Malcador
    audio drama (HH-0252), Calth-era Ultramarines/Word-Bearers (HH-0253/HH-0255), Wolf-Hunt
    Severian (HH-0254), post-Prospero Thousand Sons in the Eye of Terror (HH-0256/HH-0258),
    Khorne-arc Kharn (HH-0257), Caliban Order-of-Cypher Heresy-era Dark Angels (HH-0259), and
    Space-Wolves single-novella (HH-0260). Surface-form coverage spans the Mechanicum / Officio
    Sigillite / Order of Caliban institutional tier + the Khorne / Slaanesh / Tzeentch daemon-
    cult sub-tier.
  - `ssot-hh-027` → **HH-0261..HH-0270 — mid-Heresy Legion-vignette audio-drama bloc (2014–2015).**
    Ten single-author audio dramas covering Sigismund / Bjorn / Garro / Astelan / Sevatar /
    Aeonid Thiel / Sanguinius / Iron-Warriors-at-Tallarn vignettes — predominantly Legion-leader
    or sub-arc vignettes following the first-cycle establishment. The Knights-Errant arc
    continues via HH-0263 *Garro: Shield of Lies* (the third Garro audio drama in series order
    after Pass-14 HH-0244 / HH-0246–247 / HH-0248).
  - `ssot-hh-028` → **HH-0271..HH-0280 — late-Heresy Garro-trilogy re-issue + Pharos / Sicarus /
    Tallarn tail bloc (2015–2017).** Ten single-author audio dramas covering: the **2017 Garro
    audio-drama re-issue trio** (HH-0271 *Ashes of Fealty* / HH-0272 *Burden of Duty* / HH-0273
    *Oath of Moment* — the 2017 re-issued Garro audio-drama compilation; HH-0272 is the re-issue
    of the Pass-14 HH-0247 *Burden of Duty* original 2009 audio drama), the **Raven-Guard /
    White-Scars / Iron-Hands mid-Heresy** vignettes (HH-0274–HH-0275), the Aeonid-Thiel /
    Ultramarines continuation (HH-0276), the **Shattered Legions** arc (HH-0277 *The Either* —
    Shadrak Meduson + Tybalt Marr at Dwell), the **Pharos-beacon Salamanders arc** (HH-0278
    *The Heart of the Pharos* on Sotha — the Pass-12 Pharos-arc continuation), the Space-Wolves
    post-Prospero (HH-0279 *The Thirteenth Wolf*), and the **Word-Bearers daemon-world Sicarus
    arc** (HH-0280 *Children of Sicarus*).
  - `ssot-hh-029` → **HH-0281..HH-0290 — Siege-prelude + Endryd-Haar Blackshields sub-arc bloc
    (2016–2019).** Ten single-author audio dramas covering: the **Cabal / Perpetuals** arc (HH-0281
    *Perpetual* — Cabal/Oll Persson/John Grammaticus/Katt), the **Emperor's Children Eidolon /
    Fulgrim** post-decapitation arc (HH-0282 *The Soul, Severed*), the **Raven-Guard / Therion
    Cohort / Marcus Valerius** Beta-Garmon arc (HH-0283 *Valerius* — Pass-13/14 cross-pass
    extension), the **Mechanicum succession-crisis** arc (HH-0284 *The Binary Succession* —
    Kelbor-Hal + Zagreus Kane + Vethorel), the **Heretic-Astartes compliance** arc (HH-0285
    *Dark Compliance* — Argonis Sons-of-Horus emissary), the **Endryd-Haar Blackshields trilogy**
    (HH-0286 / HH-0287 / HH-0290 — the Pass-14-forecasted Blackshields sub-arc kicking off
    exactly at HH-0286 as forecast; see 7b), the **Imperial-Fists Ork-encounter** (HH-0288 *Hubris
    of Monarchia* — Alcaeus + Orks at Ghaslakh), and the **Salamanders namesake** (HH-0289
    *Nightfane* — contains the `Aenoid Thiel` typo variant of Pass-? `Aeonid Thiel` per 7a Case A).
  - `ssot-hh-030` → **HH-0291..HH-0294 — HH artbook + scriptbook tail bloc (2007–2018).** Four
    reference / overview volumes covering the full HH series: Collected Visions (2007 artbook),
    Horus Heresy: The Scripts Volume I (2012 scriptbook — includes the Original Six audio-drama
    scripts from 2007 + the early Garro scripts, mirroring Pass-14 HH-0241..HH-0246), Horus
    Heresy: The Scripts Volume II (2014 scriptbook), Visions of Heresy 2018 ed. (re-issue
    artbook). Surface forms aggregate across the entire HH series — multiple Primarchs and
    Legions surface in single artbook/scriptbook entries because these reference volumes cover
    the whole HH arc. **No omnibus / anthology entries** this wave; the §5 omnibus scan is empty.

## 2. Book table (44 entries)

| externalBookId | slug | title | format | author | year | batch | cluster | flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HH-0251 | `veritas-ferrum` | *Veritas Ferrum* | audio_drama | David Annandale | 2012 | `ssot-hh-026` | `?` | `low_confidence:characters` |
| HH-0252 | `the-sigillite` | *The Sigillite* | audio_drama | Chris Wraight | 2013 | `ssot-hh-026` | `?` | — |
| HH-0253 | `honour-to-the-dead` | *Honour to the Dead* | audio_drama | Gav Thorpe | 2013 | `ssot-hh-026` | `?` | `low_confidence:characters` |
| HH-0254 | `wolf-hunt` | *Wolf Hunt* | audio_drama | Graham McNeill | 2013 | `ssot-hh-026` | `?` | — |
| HH-0255 | `censure` | *Censure* | audio_drama | Nick Kyme | 2013 | `ssot-hh-026` | `?` | — |
| HH-0256 | `thief-of-revelations` | *Thief of Revelations* | audio_drama | Graham McNeill | 2013 | `ssot-hh-026` | `?` | — |
| HH-0257 | `kharn-the-eightfold-path` | *Kharn: The Eightfold Path* | audio_drama | Anthony Reynolds | 2013 | `ssot-hh-026` | `?` | — |
| HH-0258 | `lucius-the-eternal-blade` | *Lucius: The Eternal Blade* | audio_drama | Graham McNeill | 2013 | `ssot-hh-026` | `?` | — |
| HH-0259 | `cypher-guardian-of-order` | *Cypher: Guardian of Order* | audio_drama | Gav Thorpe | 2013 | `ssot-hh-026` | `?` | — |
| HH-0260 | `hunters-moon` | *Hunter's Moon* | audio_drama | Guy Haley | 2014 | `ssot-hh-026` | `?` | — |
| HH-0261 | `wolfs-claw` | *Wolf's Claw* | audio_drama | Chris Wraight | 2014 | `ssot-hh-027` | `?` | — |
| HH-0262 | `templar` | *Templar* | audio_drama | John French | 2014 | `ssot-hh-027` | `?` | — |
| HH-0263 | `garro-shield-of-lies` | *Garro: Shield of Lies* | audio_drama | James Swallow | 2014 | `ssot-hh-027` | `?` | — |
| HH-0264 | `master-of-the-first` | *Master of the First* | audio_drama | Gav Thorpe | 2014 | `ssot-hh-027` | `?` | — |
| HH-0265 | `the-long-night` | *The Long Night* | audio_drama | Aaron Dembski-Bowden | 2014 | `ssot-hh-027` | `?` | `low_confidence:locations` |
| HH-0266 | `strategem` | *Strategem* | audio_drama | Nick Kyme | 2014 | `ssot-hh-027` | `?` | `data_conflict:title->Stratagem` |
| HH-0267 | `the-herald-of-sanguinius` | *The Herald of Sanguinius* | audio_drama | Andy Smillie | 2014 | `ssot-hh-027` | `?` | — |
| HH-0268 | `the-watcher` | *The Watcher* | audio_drama | C Z Dunn | 2014 | `ssot-hh-027` | `?` | — |
| HH-0269 | `the-eagles-talon` | *The Eagle's Talon* | audio_drama | John French | 2015 | `ssot-hh-027` | `?` | `low_confidence:characters` |
| HH-0270 | `iron-corpses` | *Iron Corpses* | audio_drama | David Annandale | 2015 | `ssot-hh-027` | `?` | — |
| HH-0271 | `garro-ashes-of-fealty` | *Garro: Ashes of Fealty* | audio_drama | James Swallow | 2017 | `ssot-hh-028` | `?` | — |
| HH-0272 | `garro-burden-of-duty` | *Garro: Burden of Duty* | audio_drama | James Swallow | 2017 | `ssot-hh-028` | `?` | — |
| HH-0273 | `garro-oath-of-moment` | *Garro: Oath of Moment* | audio_drama | James Swallow | 2017 | `ssot-hh-028` | `?` | — |
| HH-0274 | `raptor` | *Raptor* | audio_drama | Gav Thorpe | 2015 | `ssot-hh-028` | `?` | — |
| HH-0275 | `grey-talon` | *Grey Talon* | audio_drama | Chris Wraight | 2016 | `ssot-hh-028` | `?` | — |
| HH-0276 | `red-marked` | *Red-Marked* | audio_drama | Nick Kyme | 2016 | `ssot-hh-028` | `?` | — |
| HH-0277 | `the-either` | *The Either* | audio_drama | Graham McNeill | 2016 | `ssot-hh-028` | `?` | — |
| HH-0278 | `the-heart-of-the-pharos` | *The Heart of the Pharos* | audio_drama | L.J. Goulding | 2016 | `ssot-hh-028` | `?` | — |
| HH-0279 | `the-thirteenth-wolf` | *The Thirteenth Wolf* | audio_drama | Gav Thorpe | 2016 | `ssot-hh-028` | `?` | — |
| HH-0280 | `children-of-sicarus` | *Children of Sicarus* | audio_drama | Anthony Reynolds | 2016 | `ssot-hh-028` | `?` | — |
| HH-0281 | `perpetual` | *Perpetual* | audio_drama | Dan Abnett | 2016 | `ssot-hh-029` | `?` | — |
| HH-0282 | `the-soul-severed` | *The Soul, Severed* | audio_drama | Chris Wraight | 2016 | `ssot-hh-029` | `?` | `low_confidence:locations` |
| HH-0283 | `valerius` | *Valerius* | audio_drama | Gav Thorpe | 2016 | `ssot-hh-029` | `?` | — |
| HH-0284 | `the-binary-succession` | *The Binary Succession* | audio_drama | David Annandale | 2017 | `ssot-hh-029` | `?` | — |
| HH-0285 | `dark-compliance` | *Dark Compliance* | audio_drama | John French | 2017 | `ssot-hh-029` | `?` | — |
| HH-0286 | `blackshields-the-false-war` | *Blackshields: The False War* | audio_drama | Josh Reynolds | 2017 | `ssot-hh-029` | `?` | — |
| HH-0287 | `blackshields-the-red-fief` | *Blackshields: The Red Fief* | audio_drama | Josh Reynolds | 2018 | `ssot-hh-029` | `?` | — |
| HH-0288 | `hubris-of-monarchia` | *Hubris of Monarchia* | audio_drama | Andy Smillie | 2018 | `ssot-hh-029` | `?` | — |
| HH-0289 | `nightfane` | *Nightfane* | audio_drama | Nick Kyme | 2018 | `ssot-hh-029` | `?` | — |
| HH-0290 | `blackshields-the-broken-chain` | *Blackshields: The Broken Chain* | audio_drama | Josh Reynolds | 2019 | `ssot-hh-029` | `?` | `low_confidence:locations` |
| HH-0291 | `collected-visions` | *Collected Visions* | artbook | ? | 2007 | `ssot-hh-030` | `?` | — |
| HH-0292 | `horus-heresy-the-scripts-volume-i` | *Horus Heresy: The Scripts: Volume I* | scriptbook | ? | 2012 | `ssot-hh-030` | `?` | — |
| HH-0293 | `horus-heresy-the-scripts-volume-ii` | *Horus Heresy: The Scripts: Volume II* | scriptbook | ? | 2014 | `ssot-hh-030` | `?` | — |
| HH-0294 | `visions-of-heresy-2018-ed` | *Visions of Heresy (2018 ed.)* | artbook | ? | 2018 | `ssot-hh-030` | `?` | — |

## 3. Surface-form aggregate (sorted: freq desc, name asc)

### Factions (38 distinct surface forms, 134 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Ultramarines | 11 | HH-0253, HH-0255, HH-0266 | direct | ultramarines | `?` |
| Word Bearers | 9 | HH-0253, HH-0255, HH-0262 | direct | word_bearers | `?` |
| Imperial Fists | 7 | HH-0262, HH-0269, HH-0272 | direct | imperial_fists | `?` |
| Sons of Horus | 7 | HH-0274, HH-0275, HH-0277 | direct | sons_of_horus | `?` |
| Space Wolves | 7 | HH-0260, HH-0261, HH-0268 | direct | space_wolves | `?` |
| World Eaters | 7 | HH-0257, HH-0262, HH-0286 | direct | world_eaters | `?` |
| Dark Angels | 6 | HH-0259, HH-0264, HH-0265 | direct | dark_angels | `?` |
| Night Lords | 6 | HH-0264, HH-0265, HH-0268 | direct | night_lords | `?` |
| Alpha Legion | 5 | HH-0260, HH-0261, HH-0281 | direct | alpha_legion | `?` |
| Death Guard | 5 | HH-0271, HH-0291, HH-0292 | direct | death_guard | `?` |
| Iron Hands | 5 | HH-0251, HH-0275, HH-0277 | direct | iron_hands | `?` |
| Raven Guard | 5 | HH-0274, HH-0283, HH-0291 | direct | raven_guard | `?` |
| Thousand Sons | 5 | HH-0256, HH-0258, HH-0279 | direct | thousand_sons | `?` |
| Emperor's Children | 4 | HH-0258, HH-0282, HH-0291 | direct | emperors_children | `?` |
| Iron Warriors | 4 | HH-0269, HH-0270, HH-0291 | direct | iron_warriors | `?` |
| Mechanicum | 4 | HH-0284, HH-0286, HH-0291 | alias | mechanicus | `?` |
| White Scars | 4 | HH-0262, HH-0275, HH-0291 | direct | white_scars | `?` |
| Blackshields | 3 | HH-0286, HH-0287, HH-0290 | direct | blackshields | `?` |
| Blood Angels | 3 | HH-0267, HH-0291, HH-0294 | direct | blood_angels | `?` |
| Knights-Errant | 3 | HH-0271, HH-0272, HH-0273 | alias | knights_errant | `?` |
| Luna Wolves | 3 | HH-0254, HH-0291, HH-0294 | alias | sons_of_horus | `?` |
| Adeptus Custodes | 2 | HH-0291, HH-0294 | direct | custodes | `?` |
| Imperial Army | 2 | HH-0252, HH-0255 | alias | astra_militarum | `?` |
| Knights Errant | 2 | HH-0263, HH-0268 | direct | knights_errant | `?` |
| Salamanders | 2 | HH-0291, HH-0294 | direct | salamanders | `?` |
| Administratum | 1 | HH-0263 | unresolved | — | `?` |
| Cabal | 1 | HH-0281 | direct | cabal | `?` |
| Daemons of Tzeentch | 1 | HH-0280 | alias | tzeentch | `?` |
| Fire Masters | 1 | HH-0253 | unresolved | — | `?` |
| Heretic Astartes | 1 | HH-0276 | direct | heretic_astartes | `?` |
| High Lords of Terra | 1 | HH-0284 | alias | senatorum_imperialis | `?` |
| Imperial Court | 1 | HH-0293 | unresolved | — | `?` |
| Inquisition | 1 | HH-0293 | direct | inquisition | `?` |
| Legio Praesagius | 1 | HH-0253 | unresolved | — | `?` |
| Officio Sigillite | 1 | HH-0252 | unresolved | — | `?` |
| Orks | 1 | HH-0288 | direct | orks | `?` |
| Sanguinary Guard | 1 | HH-0267 | direct | sanguinary_guard | `?` |
| Therion Cohort | 1 | HH-0283 | direct | therion_cohort | `?` |

### Locations (36 distinct surface forms, 67 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Terra | 9 | HH-0252, HH-0254, HH-0262 | direct | terra | `?` |
| Calth | 6 | HH-0253, HH-0255, HH-0273 | direct | calth | `?` |
| Isstvan V | 6 | HH-0251, HH-0274, HH-0275 | alias | istvaan_v | `?` |
| Eye of Terror | 3 | HH-0256, HH-0258, HH-0280 | direct | eye_of_terror | `?` |
| Macragge | 3 | HH-0266, HH-0267, HH-0276 | direct | macragge | `?` |
| Mars | 3 | HH-0284, HH-0291, HH-0294 | direct | mars | `?` |
| Caliban | 2 | HH-0259, HH-0264 | direct | caliban | `?` |
| Imperial Palace | 2 | HH-0252, HH-0254 | direct | imperial_palace | `?` |
| Isstvan III | 2 | HH-0291, HH-0294 | alias | istvaan_iii | `?` |
| Planet of Sorcerers | 2 | HH-0256, HH-0258 | unresolved | — | `?` |
| Sol System | 2 | HH-0262, HH-0268 | direct | sol_system | `?` |
| Tallarn | 2 | HH-0269, HH-0270 | direct | tallarn | `?` |
| Ultramar | 2 | HH-0276, HH-0278 | direct | ultramar | `?` |
| Accazzar-Beta | 1 | HH-0285 | unresolved | — | `?` |
| Alaxxes Nebula | 1 | HH-0261 | direct | alaxxes_nebula | `?` |
| Andrioch | 1 | HH-0281 | unresolved | — | `?` |
| Bael | 1 | HH-0289 | unresolved | — | `?` |
| Beta-Garmon | 1 | HH-0283 | direct | beta_garmon | `?` |
| Duat | 1 | HH-0287 | unresolved | — | `?` |
| Dwell | 1 | HH-0277 | unresolved | — | `?` |
| Ghaslakh | 1 | HH-0288 | unresolved | — | `?` |
| Gyptus | 1 | HH-0252 | unresolved | — | `?` |
| Ithraca | 1 | HH-0253 | unresolved | — | `?` |
| Mount Pharos | 1 | HH-0278 | unresolved | — | `?` |
| Northwilds | 1 | HH-0259 | unresolved | — | `?` |
| Nostramo | 1 | HH-0292 | direct | nostramo | `?` |
| Numinus | 1 | HH-0273 | unresolved | — | `?` |
| Oran | 1 | HH-0276 | unresolved | — | `?` |
| Pelago | 1 | HH-0260 | unresolved | — | `?` |
| Phalanx | 1 | HH-0272 | alias | phalanx | `?` |
| Prospero | 1 | HH-0279 | direct | prospero | `?` |
| Riga Orbital Plate | 1 | HH-0263 | unresolved | — | `?` |
| Sicarus | 1 | HH-0280 | unresolved | — | `?` |
| Solar System | 1 | HH-0271 | unresolved | — | `?` |
| Sotha | 1 | HH-0278 | direct | sotha | `?` |
| Xana-Tisiphone | 1 | HH-0286 | unresolved | — | `?` |

### Characters (75 distinct surface forms, 102 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Malcador the Sigillite | 7 | HH-0252, HH-0263, HH-0268 | direct | malcador_the_sigillite | `?` |
| Nathaniel Garro | 6 | HH-0263, HH-0271, HH-0272 | direct | nathaniel_garro | `?` |
| Aeonid Thiel | 4 | HH-0255, HH-0266, HH-0276 | direct | aeonid_thiel | `?` |
| Rogal Dorn | 4 | HH-0262, HH-0272, HH-0286 | direct | rogal_dorn | `?` |
| Endryd Haar | 3 | HH-0286, HH-0287, HH-0290 | unresolved | — | `?` |
| Horus Lupercal | 3 | HH-0277, HH-0291, HH-0294 | alias | horus | `?` |
| Kharn | 2 | HH-0262, HH-0292 | alias | kharn_the_betrayer | `?` |
| Luther | 2 | HH-0259, HH-0264 | direct | luther | `?` |
| Pallas Ravachol | 2 | HH-0291, HH-0294 | direct | pallas_ravachol | `?` |
| Roboute Guilliman | 2 | HH-0266, HH-0267 | direct | roboute_guilliman | `?` |
| Sigismund | 2 | HH-0262, HH-0292 | direct | sigismund | `?` |
| The Emperor | 2 | HH-0291, HH-0294 | direct | the_emperor | `?` |
| Aenoid Thiel | 1 | HH-0289 | unresolved | — | `?` |
| Ahzek Ahriman | 1 | HH-0256 | direct | ahzek_ahriman | `?` |
| Alcaeus | 1 | HH-0288 | unresolved | — | `?` |
| Altani | 1 | HH-0265 | unresolved | — | `?` |
| Amon | 1 | HH-0256 | unresolved | — | `?` |
| Angron | 1 | HH-0292 | direct | angron | `?` |
| Archorian | 1 | HH-0282 | unresolved | — | `?` |
| Argonis | 1 | HH-0285 | unresolved | — | `?` |
| Astelan | 1 | HH-0264 | direct | astelan | `?` |
| Azkaellon | 1 | HH-0267 | direct | azkaellon | `?` |
| Bion Henricos | 1 | HH-0275 | unresolved | — | `?` |
| Bjorn the One-Handed | 1 | HH-0261 | unresolved | — | `?` |
| Bulveye | 1 | HH-0279 | unresolved | — | `?` |
| Captain Melian | 1 | HH-0264 | unresolved | — | `?` |
| Corax | 1 | HH-0283 | direct | corax | `?` |
| Corvus Corax | 1 | HH-0292 | alias | corax | `?` |
| Eidolon | 1 | HH-0282 | direct | eidolon | `?` |
| Erud Vahn | 1 | HH-0290 | unresolved | — | `?` |
| Felbjorn | 1 | HH-0260 | unresolved | — | `?` |
| Fulgrim | 1 | HH-0282 | direct | fulgrim | `?` |
| Hathor Maat | 1 | HH-0256 | direct | hathor_maat | `?` |
| Hibou Khan | 1 | HH-0275 | unresolved | — | `?` |
| Horus | 1 | HH-0285 | direct | horus | `?` |
| Ison | 1 | HH-0268 | unresolved | — | `?` |
| John Grammaticus | 1 | HH-0281 | direct | john_grammaticus | `?` |
| Jubal Khan | 1 | HH-0262 | unresolved | — | `?` |
| Katanoh Tallery | 1 | HH-0263 | unresolved | — | `?` |
| Katt | 1 | HH-0281 | unresolved | — | `?` |
| Kelbor-Hal | 1 | HH-0284 | direct | kelbor_hal | `?` |
| Khalid Hassan | 1 | HH-0252 | unresolved | — | `?` |
| Khârn | 1 | HH-0257 | alias | kharn_the_betrayer | `?` |
| Konrad Curze | 1 | HH-0292 | direct | konrad_curze | `?` |
| Koparnos | 1 | HH-0270 | unresolved | — | `?` |
| Kor Phaeron | 1 | HH-0280 | direct | kor_phaeron | `?` |
| Kurtha Sedd | 1 | HH-0255 | direct | kurtha_sedd | `?` |
| Larazzar | 1 | HH-0280 | unresolved | — | `?` |
| Lord Cypher | 1 | HH-0259 | unresolved | — | `?` |
| Lucius | 1 | HH-0258 | alias | lucius_the_eternal | `?` |
| Magnus the Red | 1 | HH-0256 | direct | magnus_the_red | `?` |
| Marcus Valerius | 1 | HH-0283 | direct | marcus_valerius | `?` |
| Meric Voyen | 1 | HH-0271 | unresolved | — | `?` |
| Navar Hef | 1 | HH-0274 | unresolved | — | `?` |
| Oberdeii | 1 | HH-0278 | unresolved | — | `?` |
| Oll Persson | 1 | HH-0281 | direct | oll_persson | `?` |
| Sanakht | 1 | HH-0258 | direct | sanakht | `?` |
| Sanguinius | 1 | HH-0267 | direct | sanguinius | `?` |
| Sareo | 1 | HH-0260 | unresolved | — | `?` |
| Sevatar | 1 | HH-0265 | direct | sevatar | `?` |
| Severian | 1 | HH-0254 | direct | severian | `?` |
| Shadrak Meduson | 1 | HH-0277 | direct | shadrak_meduson | `?` |
| Sobek | 1 | HH-0256 | unresolved | — | `?` |
| Tebecai | 1 | HH-0278 | unresolved | — | `?` |
| Tidon | 1 | HH-0260 | unresolved | — | `?` |
| Tybalt Marr | 1 | HH-0277 | direct | tybalt_marr | `?` |
| Tylaine | 1 | HH-0264 | unresolved | — | `?` |
| Tylos Rubio | 1 | HH-0273 | direct | tylos_rubio | `?` |
| Ven | 1 | HH-0260 | unresolved | — | `?` |
| Vethorel | 1 | HH-0284 | unresolved | — | `?` |
| Vultius | 1 | HH-0255 | unresolved | — | `?` |
| Yasu Nagasena | 1 | HH-0254 | unresolved | — | `?` |
| Yored Massak | 1 | HH-0272 | direct | yored_massak | `?` |
| Zagreus Kane | 1 | HH-0284 | unresolved | — | `?` |
| Zahariel | 1 | HH-0259 | direct | zahariel | `?` |

## 4. Cross-axis surface-form conflicts

| surface form | axes |
| --- | --- |
| (none) | — |

## 5. Omnibus / anthology scan

| externalBookId | title | format | roster collection? | known constituents |
| --- | --- | --- | --- | --- |

## 6. data_conflict flag scan

| externalBookId | title | flags |
| --- | --- | --- |
| HH-0251 | *Veritas Ferrum* | `low_confidence:characters` |
| HH-0253 | *Honour to the Dead* | `low_confidence:characters` |
| HH-0265 | *The Long Night* | `low_confidence:locations` |
| HH-0266 | *Strategem* | `data_conflict:title->Stratagem` |
| HH-0269 | *The Eagle's Talon* | `low_confidence:characters` |
| HH-0282 | *The Soul, Severed* | `low_confidence:locations` |
| HH-0290 | *Blackshields: The Broken Chain* | `low_confidence:locations` |

## 7. Cross-batch alias-consolidation + needs-decision candidates

> The only LLM-synthesized section. It flags (7a) cross-form alias-consolidation cases the
> owning phase must collapse onto an existing canonical row (runbook §4) — this wave finds **two
> strict-freq-≥2 character alias cases** (`Aenoid Thiel → aeonid_thiel` typo variant + `Bjorn the
> One-Handed → bjorn` Pre-Dreadnought honor-title variant) and **one strict-freq-2 location
> alias case** (`Solar System → sol_system` spacing variant); (7b) one strict-freq-3 within-batch
> character spine — `Endryd Haar` for the Pass-14-forecasted Blackshields sub-arc — with no
> cross-batch spines this wave; (7c) the freq-driven promotion shape per axis, dominated on the
> **faction axis by a Mechanicum / Officio-Sigillite / Titan-Legion curated freq-1 promotion bloc**
> (Officio Sigillite + Legio Praesagius + optional Adeptus Administratum + optional Fire Masters),
> on the **location axis by a daemon-world / Pharos-beacon / sub-locale promotion bloc** (Sortiarius-
> alias-or-row for `Planet of Sorcerers` + Mount Pharos / Pharos + Sicarus + Ithraca + Northwilds
> + Numinus + assorted single-novella long-tail) plus the `Solar System → sol_system` alias, and
> on the **character axis by the audio-drama supporting-cast freq-1 tail** (Argonis + Khalid
> Hassan + Yasu Nagasena + Amon + Sobek + Zagreus Kane + Vethorel + assorted Legion vignettes);
> (7d) genuine needs-decision candidates — the **Cross-Era `Lord Cypher` ↔ `cypher` disambig**
> (Heresy-era Dark-Angels title-character HH-0259 *Cypher: Guardian of Order* vs the existing
> Pass-7 `cypher` canonical row for the post-Heresy Fallen-Lord-of-the-Fallen — same-name-family
> potentially same-identity; per runbook §4 Cross-Era convention this is a **strong alias
> candidate** but the title-vs-name distinction makes Phase-3 judgment necessary), the
> **`Planet of Sorcerers` → `sortiarius` alias case** (lore-canonical Thousand-Sons daemon-world
> name; Phase 2 decides alias-add or new row), the `data_conflict:title->Stratagem` (HH-0266
> roster typo; Phase 4a advisory carry-through), and the Endryd-Haar Blackshields-sub-arc
> primaryFactionId-dependency on the Pass-14 `blackshields` row (clean FK — no architectural
> concern). The §5 omnibus scan is **empty this wave** (no roster-collection omnibi; the
> HH-0291..HH-0294 artbook/scriptbook tail does not carry `relatedBookIds`), so the Brief-091
> forward-ref Guard is **not active** this wave — the audit-cockpit Guard expects clean output
> (0 out-of-range refs, 0 unknown-work refs). Everything below is grounded in §2–§6 + the
> Pass-10/11/12/13/14 alias / row anchors confirmed in §1 baseline.

### 7a. Cross-batch alias-consolidation cases (→ existing row + alias)

> Format: surface-forms · book-IDs · same entity? · recommendation. These are the cases where a naïve
> implementer would create **two** rows or invent a fresh row instead of aliasing onto an existing
> anchor. Per runbook §4: **one canonical identity = one canonical row; era-/form-specific surface
> forms live in `*-aliases.json`**.

**Factions (Phase 1):**

- *(No alias-consolidation cases this wave for the faction axis.)* All era-rename / cross-batch
  faction cases land on Pass-10/11/12/13/14 aliases (Mechanicum → `mechanicus` 4 hits cumulative
  in this wave — the **highest-frequency alias of the wave** on the faction axis; Knights-Errant /
  Knights Errant → `knights_errant` 5 hits combined, the Heresy-era hyphenated Pass-11 alias plus
  the unhyphenated Pass-11 direct alias both surface; Luna Wolves → `sons_of_horus` 3 hits via
  the Pass-10 Cross-Era anchor; Imperial Army → `astra_militarum` 2 hits via the Pass-10 alias;
  Daemons of Tzeentch → `tzeentch` 1 hit via the pre-Pass-10 alias; High Lords of Terra →
  `senatorum_imperialis` 1 hit via the pre-Pass-10 alias). The Pass-10/11/12/13/14 era-rename
  chain on the faction axis catches every re-surface in this wave; no new aliases needed.

**Locations (Phase 2):**

- **Case L1 — `Solar System` ↔ `sol_system` (canonical, pre-Pass-10-anchored).** `Solar System`
  (freq 1, HH-0271 *Garro: Ashes of Fealty*, unresolved in §3) is the **spaced-out variant** of
  the canonical `sol_system` row. Resolver is case-/spacing-sensitive (Brief 049/072); the
  long-established `Sol System` (freq 2, direct, sol_system) surface form catches direct, but
  the new spaced variant misses. Same locale, same row. → **alias `Solar System → sol_system`**
  in `location-aliases.json`. **Floor case.** Strict freq-1 alias add, justified by the
  identity-equivalence of the spacing variant (not a freq-≥2 promotion — the runbook §4 rule
  legitimizes the alias on identity-equivalence grounds even at freq-1, since the Ziel-Canonical-
  ID is lore-eindeutig).
- *(No other alias-consolidation cases this wave for the location axis.)* All other resolved
  location surfaces this wave catch on existing rows direct or via existing Pass-N aliases
  (Isstvan V → istvaan_v 6 hits cumulative — the **highest-frequency location alias of the wave**;
  Isstvan III → istvaan_iii 2 hits via the long-established alias; Phalanx → phalanx via the
  Pass-14 new row + alias). The location-axis question this wave puts on Phase 2 is the
  **`Planet of Sorcerers` strict-freq-2 within-batch evidence** — see 7c / 7d for the
  Sortiarius-alias-or-row judgment call.

**Characters (Phase 3) — two strict-freq-≥2 alias add cases:**

- **Case A — `Aenoid Thiel` ↔ `aeonid_thiel` (canonical, pre-Pass-N-anchored).** `Aenoid Thiel`
  (freq 1, HH-0289 *Nightfane*, unresolved in §3) is a **transposition typo variant** (transposed
  vowels `Ae` ↔ `Aeo`) of the canonical `Aeonid Thiel` (freq 4, direct, aeonid_thiel — the
  highest-frequency Ultramarines-supporting-cast surface in the wave, anchored across HH-0255 /
  HH-0266 / HH-0276 + HH-0289). Same person, same row, just spelled wrong on the override.
  → **alias `Aenoid Thiel → aeonid_thiel`** in `character-aliases.json`. **Floor case.** Strict
  freq-1 alias add justified by identity-equivalence (the typo points to the same Ultramarines
  Codicier/Sergeant figure recurring across the Calth / Aeonid-Thiel audio-drama bloc; no
  ambiguity given the source-context). Per runbook §4 promotion threshold, the within-wave
  identity-equivalence of a typo surface form is sufficient for an alias add (no row creation;
  just the alias entry).
- **Case B — `Bjorn the One-Handed` ↔ `bjorn` (canonical, Pass-11-anchored).** `Bjorn the
  One-Handed` (freq 1, HH-0261 *Wolf's Claw*, unresolved in §3) is the **Heresy-era pre-Dreadnought
  honor-title variant** of the Pass-11 `bjorn` canonical row. The Pass-11 `bjorn` row notes
  ("Slug 'bjorn' chosen for the bare HH surface-form; later-canon honor-title 'Bjorn the
  Fell-Handed' can be added as alias if a future wave surfaces it") explicitly anticipated the
  cross-pass alias case for the Fell-Handed variant; the Pass-15 wave surfaces the **One-Handed**
  variant (his Heresy-era nickname before losing an arm at the Wolfsbane catastrophe and being
  interred in the Dreadnought sarcophagus that gives him the Fell-Handed post-Heresy title).
  Same person — the future Bjorn the Fell-Handed, the last surviving Heresy-era Space Wolf —
  same row. → **alias `Bjorn the One-Handed → bjorn`** in `character-aliases.json`. Per runbook
  §4 Cross-Era / Character-Honor-Title-Split convention (the Kharn ↔ Kharn the Betrayer
  parallel — same identity, era-specific honor-title surface lives in the alias file). **Floor
  case — strict freq-1 honor-title alias add.** Optionally a follow-on alias `Bjorn the
  Fell-Handed → bjorn` could be pre-added if Phase 3 wants to close the loop on the
  Pass-11-anticipated Fell-Handed surface (this wave does not surface the Fell-Handed form, so
  pre-adding is optional / discretionary).

**Confirmations only (already-aliased / already-direct from Pass 10–14 — no Phase-N action):**

The following surface forms surface in this wave with `alias` or `direct` status because
Pass-10/11/12/13/14 already landed the anchor + alias. No alias-file edit needed; listed only to
make the Cross-Era / Pass-10–14-handoff chain explicit:

- **Factions:** `Mechanicum → mechanicus` (Pass-10 alias, **4 hits** this wave — HH-0284 /
  HH-0286 / HH-0291 / HH-0294 — the highest-frequency alias of the wave on the faction axis,
  driven by the Mechanicum succession-crisis arc + the Collected-Visions / Visions-of-Heresy
  overview-coverage in the artbooks), `Knights-Errant → knights_errant` (Pass-11 alias, **3
  hits** — HH-0271 / HH-0272 / HH-0273 — the 2017 Garro audio-drama re-issue trio anchors it
  exhaustively), `Knights Errant → knights_errant` (Pass-11 direct alias, **2 hits** — HH-0263
  / HH-0268), `Luna Wolves → sons_of_horus` (Pass-10 alias, **3 hits** — HH-0254 / HH-0291 /
  HH-0294 — Wolf Hunt + the two artbook overview entries; the Pass-10 Cross-Era anchor
  continues exhaustive coverage), `Imperial Army → astra_militarum` (Pass-10 alias, **2 hits**
  — HH-0252 / HH-0255), `Daemons of Tzeentch → tzeentch` (pre-Pass-10 alias, 1 hit — HH-0280),
  `High Lords of Terra → senatorum_imperialis` (pre-Pass-10 alias, 1 hit — HH-0284 *The Binary
  Succession*). The Pass-10/11/12/13/14 era-rename chain on the faction axis catches every
  re-surface in this wave.
- **Locations:** `Isstvan V → istvaan_v` (long-established alias, **6 hits** — HH-0251 / HH-0274
  / HH-0275 / HH-0291 / HH-0294 + one more — the highest-frequency location-alias hit of the
  wave — Isstvan V is the Heresy's foundational catastrophe site, surfacing wave-wide), `Isstvan
  III → istvaan_iii` (long-established alias, **2 hits** — HH-0291 omnibus-overview / HH-0294
  artbook-overview), `Phalanx → phalanx` (Pass-14 new alias, **1 hit** — HH-0272 *Garro: Burden
  of Duty* — first cross-pass confirmation of the Pass-14 alias/row for the Imperial-Fists
  vessel-grain).
- **Characters:** `Horus Lupercal → horus` (Pass-11 alias, **3 hits** — HH-0277 / HH-0291 /
  HH-0294 — the Shattered-Legions arc + the two artbook overview entries), `Kharn → kharn_the_
  betrayer` (Pass-11 alias, **2 hits** — HH-0262 / HH-0292 — the Templar audio + the Scripts-I
  scriptbook overview), `Corvus Corax → corax` (Pass-11 alias, 1 hit — HH-0292 scriptbook
  overview — first cross-pass confirmation of the Pass-11 Corvus-Corax-honor-form alias),
  `Khârn → kharn_the_betrayer` (pre-Pass-10 alias, 1 hit — HH-0257 *Kharn: The Eightfold Path*
  — the diacritic-variant continues coverage), `Lucius → lucius_the_eternal` (pre-Pass-10 alias,
  1 hit — HH-0258 *Lucius: The Eternal Blade* — the namesake audio-drama anchors the alias
  exhaustively).
- **Direct chain — all named Primarchs catch on Pass-10/11/12/13/14 rows.** Every named Primarch
  in this wave catches its bare-name surface form direct on the Pass-10/11/12/13/14 canonical
  row: Rogal Dorn (4 — Pass-11 row), Horus Lupercal (3 alias), Konrad Curze (1 — Pass-11 row),
  Magnus the Red (1), Roboute Guilliman (2), Sanguinius (1), Corax (1), Fulgrim (1), Angron (1),
  Horus (1). Plus the Mechanicum-Forge-Lord Kelbor-Hal (1 — Pass-? row). **The Primarch coverage
  is exhaustive** for the Pass-15 wave; no new Primarch row needed (the only Primarch surface
  in §3 unresolved would have been something exotic / non-canonical, none of which appears).
- **Direct chain — supporting cast confirmations (selected):** `Malcador the Sigillite` (Pass-11
  row, **freq 7 — the wave's highest-frequency character surface form**, the *Sigillite* audio
  drama + the Garro / Knights-Errant / Officio-Sigillite-frame audio-drama bloc + *The Watcher*
  + others — Malcador is the wave's spine character, as he was the Pass-14 spine), `Nathaniel
  Garro` (Pass-? row, **freq 6** — the 2017 Garro audio-drama re-issue trio + earlier Garro
  audio dramas — wave-central in ssot-hh-028), `Aeonid Thiel` (Pass-? row, **freq 4** — the
  Calth / Censure / Strategem / Red-Marked Ultramarines audio-drama bloc — the Pass-15 wave's
  most concentrated cross-batch supporting-cast spine; the typo variant `Aenoid Thiel` adds a
  5th implicit hit, see 7a Case A), `Rogal Dorn` (Pass-11 row, freq 4 — *Templar* + *Garro:
  Burden of Duty* + *Blackshields: The False War* + ...), `Sigismund` (Pass-? row, freq 2 —
  HH-0262 / HH-0292), `Luther` (Pass-? row, freq 2 — HH-0259 / HH-0264 — both Caliban Heresy-era
  audio dramas), `Pallas Ravachol` (Pass-? row, freq 2 — HH-0291 / HH-0294 — namesake-pair
  artbook/artbook-reissue overview), `Roboute Guilliman` (Pass-11 row, freq 2 — *Strategem* +
  *The Herald of Sanguinius*), `Tylos Rubio` (Pass-11 row, freq 1 — HH-0273 *Garro: Oath of
  Moment* — first cross-pass confirmation of the Pass-? Tylos-Rubio row), `Yored Massak` (Pass-14
  row, freq 1 — HH-0272 *Garro: Burden of Duty* — first cross-pass confirmation of the Pass-14
  row for the Imperial-Fists Librarian; this is the Pass-14 prediction landing exactly), `Marcus
  Valerius` (Pass-13 row, freq 1 — HH-0283 *Valerius* — namesake-driven cross-pass confirmation),
  `Astelan` (Pass-13 row, freq 1 — HH-0264 *Master of the First* — cross-pass confirmation of
  Pass-13 Dark-Angels Astelan), `Azkaellon` (Pass-? row, freq 1 — HH-0267 *The Herald of
  Sanguinius* — first cross-pass), `Eidolon` (pre-Pass-10 row, freq 1 — HH-0282 *The Soul,
  Severed*), `Fulgrim` (pre-Pass-10 row, freq 1 — HH-0282), `Sevatar` (Pass-? row, freq 1 —
  HH-0265 *The Long Night*), `Sanakht` (Pass-? row, freq 1 — HH-0258 *Lucius: The Eternal Blade*),
  `Hathor Maat` (Pass-? row, freq 1 — HH-0256 *Thief of Revelations*), `Ahzek Ahriman` (Pass-?
  row, freq 1 — HH-0256), `Kor Phaeron` (pre-Pass-10 row, freq 1 — HH-0280 *Children of Sicarus*),
  `John Grammaticus` (Pass-? row, freq 1 — HH-0281 *Perpetual*), `Oll Persson` (Pass-? row,
  freq 1 — HH-0281), `The Emperor` (Pass-10 row, freq 2 — HH-0291 / HH-0294 — namesake-pair
  artbook/artbook-reissue overview), `Shadrak Meduson` (Pass-? row, freq 1 — HH-0277 *The
  Either*), `Tybalt Marr` (Pass-? row, freq 1 — HH-0277), `Severian` (Pass-? row, freq 1 —
  HH-0254 *Wolf Hunt*), `Kurtha Sedd` (Pass-? row, freq 1 — HH-0255 *Censure*), `Zahariel`
  (Pass-? row, freq 1 — HH-0259 *Cypher: Guardian of Order*), `Kelbor-Hal` (Pass-? row, freq 1
  — HH-0284 *The Binary Succession*), `Magnus the Red` (Pass-11 row, freq 1 — HH-0256).
  **Pass-14's recommended +9-row promotion shape is fully confirmed in this wave** —
  Yored-Massak / Marcus-Valerius are both first-cross-pass-confirmations of Pass-14 rows.
- **Direct chain — locations:** `Terra` (9 — the highest-frequency location surface form of the
  wave, audio-drama-driven), `Calth` (6 — the Ultramarines audio-drama bloc center), `Macragge`
  (3), `Mars` (3), `Eye of Terror` (3), `Caliban` (2), `Imperial Palace` (2), `Sol System` (2),
  `Tallarn` (2), `Ultramar` (2), `Alaxxes Nebula` (1 — Pass-? row, namesake-confirmation in
  HH-0261), `Beta-Garmon` (1 — Pass-? row, first cross-pass confirmation in HH-0283 *Valerius*),
  `Nostramo` (1 — Pass-? row, first cross-pass confirmation in HH-0292), `Prospero` (1), `Sotha`
  (1 — first cross-pass confirmation in HH-0278 *The Heart of the Pharos* — the Pass-12 / 13 /
  14 Sotha-Pharos arc continues). The Pass-10/11/12/13/14 location chain is exhaustively
  anchored for this wave; the only direct-resolution gaps are the new sub-locale / daemon-world
  / Pharos promotions in 7c.

### 7b. Big single-form cross-batch spines (one row each — not alias work)

This wave is **light** on cross-batch spines — most freq-≥2 surface forms in §3 are either
already-anchored (Aeonid Thiel / Nathaniel Garro / Rogal Dorn / Roboute Guilliman / Sigismund /
Luther / The Emperor / Pallas Ravachol — all direct on Pass-10/11/12/13/14 rows), already-aliased
(Horus Lupercal / Kharn), or within-batch only (Endryd Haar / Planet of Sorcerers). The single
strict-evidence row-creation case is a within-batch (not cross-batch) freq-3 spine:

- **`Endryd Haar` (freq 3 — HH-0286 *Blackshields: The False War* / HH-0287 *Blackshields: The
  Red Fief* / HH-0290 *Blackshields: The Broken Chain*).** The Blackshields trilogy protagonist
  — the renegade-Iron-Hands-Captain-turned-Blackshield leader, anchoring the **Pass-14-forecasted
  Endryd-Haar Blackshields sub-arc** that the Pass-14 dossier 7d explicitly predicted ("the
  Endryd-Haar Blackshields sub-arc surfaces 36 books later — promoting at this first-hit
  prevents Pass-26-area churn"). The Pass-14 prediction lands at HH-0286, exactly as forecast.
  **Strict freq-3 within-batch** (all three audio dramas are in ssot-hh-029, the Blackshields
  trilogy is a single-batch arc by single author Josh Reynolds, so this is **not strict
  cross-batch**; the runbook §4 freq ≥ 2 strict-promotion rule does not require cross-batch,
  just freq ≥ 2 — within-batch freq-3 from three independent works under one batch is solid
  promotion evidence). Lore-iconic Blackshield-trilogy protagonist (cross-arc with the new Pass-14
  `blackshields` row + cross-arc with the *Crysos Morturg* Pass-14 row for the namesake-first-
  Blackshield character — Endryd Haar is the **trilogy-protagonist** Blackshield, parallel
  scaling to Crysos Morturg's namesake-short-story-protagonist Blackshield). → **new row
  `endryd_haar`**. primaryFactionId `blackshields` (the existing Pass-14 canonical anchor —
  the cross-arc evidence is exhaustive for the cluster). **Strong-promotion case.** FK
  dependency: `blackshields` row (Pass-14) — no FK trap, the row exists.

> The Endryd-Haar spine is tight. Phase 3 should validate identity coherence across the three
> audio dramas (strict reading from the source-context + the consistent author / consistent
> Blackshields-trilogy framing pins the identity; Endryd Haar is the trilogy-arc protagonist,
> no ambiguity). No strict cross-batch spines this wave — the audio-drama-cluster pattern
> tends to concentrate freq-≥2 evidence within single batches when a Legion-sub-arc lands in
> consecutive audio releases.

### 7c. Per-axis promotion shape (freq-driven; owning phase justifies the exact set)

**Factions (Phase 1).** Strict freq ≥ 2 unresolved + curated freq-1 lore-iconic adds.

Strict freq ≥ 2 unresolved:

- *(None this wave.)* The unresolved-faction list in §3 contains **only freq-1 surface forms**
  (Administratum / Fire Masters / Imperial Court / Legio Praesagius / Officio Sigillite — five
  unresolved freq-1 candidates). Phase-1's strict-freq-2 threshold contributes **zero** new
  rows this wave; all faction-promotion work is curated freq-1.

Curated freq-1 lore-iconic candidates — **the Officio-Sigillite / Mechanicum / Titan-Legion
curated promotion bloc**:

- **`Officio Sigillite` (freq 1, HH-0252 *The Sigillite*).** The formal Imperial organizational
  tier under Malcador the Sigillite — the Pass-11 Malcador anchor's own organizational structure.
  Lore-iconic foundational Imperial institution (the Officio Sigillite is the Heresy-era
  bureaucratic / intelligence apparatus that Malcador heads; cross-arc with every Malcador /
  Knights-Errant / Sigillite-frame audio drama from Pass-10 onward — Malcador surfaces freq 7
  this wave alone, anchoring the org-tier on its highest cross-pass frequency). The audio-
  drama's namesake (HH-0252 *The Sigillite*) makes this the canonical first-hit. → **new row
  `officio_sigillite`** with parent: empty (Imperial institution grain, parallel to other
  Imperial Adepta — Inquisition / Custodes / Mechanicus). **Lore-iconic strong-promotion case.**
  This is the Pass-15 wave's single most cross-arc-warranted faction promotion (Malcador-the-
  Sigillite is the freq-7 spine character; promoting his org-tier closes the lore loop).
- **`Legio Praesagius` (freq 1, HH-0253 *Honour to the Dead*).** Titan Legion — follows the
  Pass-14 Legio Audax / Legio Castigatra / Legio Cybernetica curated freq-1 promotion precedent.
  The Pass-12 dossier already flagged Titan-Legion grain as a curated promotion candidate;
  Pass-14 anchored three rows; Pass-15 produces the first Praesagius surface. → **new row
  `legio_praesagius`** with parent `mechanicus`. **Lore-iconic strong-promotion case** —
  consistent with the Pass-14 Titan-Legion grain decision.
- **`Fire Masters` (freq 1, HH-0253 *Honour to the Dead*).** A 31st-Millennium
  Salamanders-themed sub-grouping (or possibly a Mechanicum / Titan / Iron-Hands sub-grouping,
  depending on source-context — the loop-log/override evidence per §3 is HH-0253, an Ultramarines
  / Word-Bearers audio drama at Calth, so the Fire-Masters surface is supporting-cast on the
  Word-Bearers side; lore-evidence-thin). Phase-1 judgment — recommendation: **leave unresolved**
  for budget conservatism unless Phase-1 wants to commit to a small lore-faction-grain row
  with single-novella evidence. **Weak-promotion case** (lower priority than Officio Sigillite
  / Legio Praesagius).
- **`Adeptus Administratum` (= `Administratum`, freq 1, HH-0263 *Garro: Shield of Lies*).**
  Civilian Imperial Administratum — the Imperial bureaucracy. Pass-14 listed this as
  "leave unresolved for budget conservatism unless Phase-1 wants Administratum-grain coverage";
  Pass-15 has the same surface return at HH-0263 (a Garro/Sigillite audio drama where Garro
  encounters an Administratum adept — Katanoh Tallery). Cross-pass cumulative freq-2 (Pass-14
  HH-0224 + Pass-15 HH-0263) — Phase-1 may now reconsider for a curated cumulative-cross-pass
  promotion. Recommendation: **promote `adeptus_administratum`** as a cumulative-cross-pass
  curated freq-1 promotion (cross-arc warrant: the Administratum is the foundational Imperial
  civilian institution that resurfaces in any Officio-Sigillite-adjacent audio drama). → **new
  row `adeptus_administratum`** with parent: empty (Imperial institution grain). **Lore-iconic
  medium-promotion case** — promote alongside Officio Sigillite, since both are Imperial-civil
  grain and the cross-pass evidence is now solid.
- **`Imperial Court` (freq 1, HH-0293 *Horus Heresy: The Scripts Volume II*).** Generic Imperial
  political-grain reference in the scriptbook overview. Phase-1 judgment — recommendation:
  **leave unresolved** (generic-grain surface in a reference volume; lore-thin beyond the
  scriptbook context). **Weak-promotion case.**

> Phase-1 promotion shape (recommended): **0 alias adds** (all era-rename / cross-batch faction
> cases land on Pass-10/11/12/13/14 aliases) + **0 strict-freq-2 new rows** (none available this
> wave) + **3 strong curated freq-1 lore-iconic new rows** (`officio_sigillite` +
> `legio_praesagius` + `adeptus_administratum`) + **0..2 weak-curated freq-1 new rows**
> (`fire_masters` + `imperial_court`). Conservative floor: 2 new rows (Officio Sigillite + Legio
> Praesagius — the two most defensible); recommended target: **3 new rows** (floor + Adeptus
> Administratum on cumulative-cross-pass grounds); ceiling: **5 new rows** (recommended +
> Fire Masters + Imperial Court). **A medium-light Phase-1 promotion pass** — lighter than
> Pass-14's 5-row bloc, driven by curated lore-iconic Officio-Sigillite / Titan-Legion /
> Administratum sub-faction surface forms rather than a heavy Mechanicum / Knight-House /
> Warband promotion as in Pass-14.

**Locations (Phase 2).** Strict freq ≥ 2 unresolved + curated freq-1 lore-iconic + one alias add.

Alias adds:

- **`Solar System → sol_system`** (Case L1 from 7a — see above). **Floor case, strict freq-1
  alias add** on identity-equivalence grounds.

Strict freq ≥ 2 (within-batch):

- **`Planet of Sorcerers` (freq 2 — HH-0256 *Thief of Revelations* / HH-0258 *Lucius: The
  Eternal Blade*).** Within-batch (both ssot-hh-026); strict freq-2 by evidence but not
  cross-batch. The Thousand Sons' daemon-world in the Eye of Terror **after** Prospero burns —
  the canonical lore name is **Sortiarius** (the planet-name post-relocation). HH-0256 *Thief
  of Revelations* is a Thousand-Sons-in-the-Eye-of-Terror audio drama set on the post-Prospero
  daemon world; HH-0258 *Lucius: The Eternal Blade* surfaces the same locale (Emperor's
  Children visiting the Thousand-Sons daemon-world). **Phase-2 decision branch** (see 7d):
  (a) treat `Planet of Sorcerers` as an alias for a **new `sortiarius` row** (Thousand Sons
  daemon-world canonical name + the Planet-of-Sorcerers descriptive variant as alias —
  consistent with the Cross-Era pattern of canonical-name-row + descriptive-surface-alias);
  (b) treat `Planet of Sorcerers` as a **new row directly** (descriptive name as canonical);
  (c) leave unresolved + `## Needs decision`. Recommendation: **(a) new `sortiarius` row +
  alias `Planet of Sorcerers → sortiarius`** — the canonical lore name is Sortiarius (M41-era
  Thousand-Sons Daemon-Primarch-throneworld), and the descriptive-name pattern parallels Pass-?
  Mechanicum-name conventions. Optional companion alias: `Planet of the Sorcerers` (with the)
  if a future wave surfaces that variant. **Lore-iconic strong-promotion case.** Phase-2 judgment.

Curated freq-1 lore-iconic — **the daemon-world / Pharos-beacon / Heresy-locale promotion bloc**:

- **`Mount Pharos` / `Pharos` (freq 1, HH-0278 *The Heart of the Pharos*).** The Pharos beacon
  on Sotha — the **Pass-12/13/14 Pharos-arc center**, the xenotech-light-house device that
  becomes the Pharos novel + Sotha-defense-arc through the Heresy. **Foundational Heresy-era
  Ultramarines-Sotha lore.** The Pass-? `sotha` row already exists; the Pharos itself is a
  sub-locale (the mountain that hosts the beacon device, on Sotha). → **new row `pharos`** with
  parent `sotha` (Sotha sub-locale grain — the Pharos is on Sotha; parallel to other planet/
  sub-locale rows already in the layer). Optional alias `Mount Pharos → pharos` if Phase 2
  prefers the bare `pharos` row + Mount-Pharos alias mapping (recommended since both forms
  surface in the HH arc; the alias closes the descriptive-variant gap). **Lore-iconic strong-
  promotion case.**
- **`Sicarus` (freq 1, HH-0280 *Children of Sicarus*).** **The Word Bearers' daemon-world** in
  the Eye of Terror — the canonical Word-Bearers post-Heresy daemon-throneworld (Lorgar's
  domain in the Eye of Terror). Namesake-driven (HH-0280 *Children of Sicarus*). **Foundational
  Heresy lore** — parallel to Sortiarius for the Thousand Sons. → **new row `sicarus`** with
  parent: empty (Daemon-world grain in the Eye of Terror — like Sortiarius, not under another
  parent). **Lore-iconic strong-promotion case.**
- **`Ithraca` (freq 1, HH-0253 *Honour to the Dead*).** Calth sub-region — the Ithraca civilian
  district that surfaces in *Honour to the Dead* (and earlier in *Know No Fear* / *Mark of
  Calth*). Cross-arc with the Calth-arc Pass-? sub-locale rows. → **new row `ithraca`** with
  parent `calth` (Calth sub-locale grain). **Lore-iconic medium-promotion case.**
- **`Northwilds` (freq 1, HH-0259 *Cypher: Guardian of Order*).** Caliban sub-region — the
  Order-of-Caliban Heresy-era audio drama locale. Single-novella, but lore-iconic (Northwilds
  is a recurring Dark-Angels Heresy-era Caliban sub-region in Thorpe's Dark-Angels arc). → **new
  row `northwilds`** with parent `caliban` (Caliban sub-locale grain). **Lore-iconic medium-
  promotion case.**
- **`Numinus` (freq 1, HH-0273 *Garro: Oath of Moment*).** Calth-region locale — Numinus is the
  Calth sub-locale in Swallow's Garro arc (the Garro-Oath-of-Moment audio drama set on a
  Calth-adjacent world). Cross-arc with the Calth-region Pass-? sub-locale set. Phase-2 judgment
  — recommendation: **promote `numinus`** with parent `calth` (Calth sub-locale grain, parallel
  to Ithraca). **Lore-iconic medium-promotion case.**
- **`Riga Orbital Plate` (freq 1, HH-0263 *Garro: Shield of Lies*).** Orbital station — Knights-
  Errant operation locale from *Garro: Shield of Lies*. Single-novella surface. Phase-2 judgment
  — recommendation: **leave unresolved** for budget conservatism (orbital-station grain, no
  cross-arc warrant beyond the single Garro audio drama), or promote as a vessel-grain row with
  `tags:['vessel']`-equivalent (Orbital-Plate grain is sub-vessel — orbital civilian platform,
  not a mobile vessel; Phase-2 judgment on the grain category).
- **`Gyptus` (freq 1, HH-0252 *The Sigillite*).** Terran region — Malcador's audio drama locale.
  Loop-log evidence: Malcador-themed Terran sub-region (Egyptian-coded — Gyptus is a Terran
  pre-imperial-era civilization). Phase-2 judgment — recommendation: **leave unresolved** for
  budget conservatism (single-novella, weak cross-arc warrant beyond the Sigillite audio drama).
- **Single-novel campaign worlds / sub-locales (varying weight; Phase-2 judgment):**
  - **`Pelago` (freq 1, HH-0260 *Hunter's Moon*).** Space Wolves audio drama world. Phase-2
    judgment — recommendation: **leave unresolved** (single-audio-drama world, weak cross-arc
    warrant).
  - **`Dwell` (freq 1, HH-0277 *The Either*).** Shattered-Legions audio drama world. Phase-2
    judgment — recommendation: leave unresolved.
  - **`Andrioch` (freq 1, HH-0281 *Perpetual*).** Perpetuals-arc world. Phase-2 judgment —
    recommendation: leave unresolved.
  - **`Accazzar-Beta` (freq 1, HH-0285 *Dark Compliance*).** Late-Heresy compliance world.
    Phase-2 judgment.
  - **`Xana-Tisiphone` (freq 1, HH-0286 *Blackshields: The False War*).** Mechanicum forge-world
    — the Blackshields trilogy's Mechanicum-arc world. Phase-2 judgment — recommendation:
    **promote `xana_tisiphone`** (lore-iconic Mechanicum-forge-world, cross-arc with the
    Pass-14 Mechanicum-arc + the new Pass-15 Endryd-Haar Blackshields trilogy). **Lore-iconic
    medium-promotion case.**
  - **`Duat` (freq 1, HH-0287 *Blackshields: The Red Fief*).** Blackshields-trilogy locale.
    Phase-2 judgment — recommendation: **promote `duat`** alongside Xana-Tisiphone for the
    Blackshields-trilogy locale coverage (the trilogy spans three worlds; promoting all three
    gives the trilogy-arc complete locale coverage). **Medium-promotion case.**
  - **`Bael` (freq 1, HH-0289 *Nightfane*).** Salamanders-arc world from *Nightfane*. Phase-2
    judgment — recommendation: leave unresolved.
  - **`Ghaslakh` (freq 1, HH-0288 *Hubris of Monarchia*).** Imperial-Fists Ork-encounter world.
    Phase-2 judgment — recommendation: leave unresolved (single-novella Ork-skirmish world,
    weak cross-arc warrant).
  - **`Oran` (freq 1, HH-0276 *Red-Marked*).** Ultramar sub-locale. Phase-2 judgment — possible
    new row with parent `ultramar` if Phase 2 wants Ultramar sub-locale completionism.

> Phase-2 promotion shape (recommended): **1 alias add** (`Solar System → sol_system`) + **1
> strict-freq-2 new row + alias** (`sortiarius` row + `Planet of Sorcerers → sortiarius` alias —
> assuming Phase 2 takes recommendation (a) of the Sortiarius branch; see 7d) + **5 strong
> curated freq-1 lore-iconic new rows** (`pharos` + `sicarus` + `ithraca` + `northwilds` +
> `numinus`) + **0..3 medium-curated freq-1 new rows** (`xana_tisiphone` + `duat` + `oran`) +
> **0..5 weak-curated long-tail new rows** (`pelago` / `dwell` / `andrioch` / `accazzar_beta` /
> `bael` / `ghaslakh` / `gyptus` / `riga_orbital_plate` — Phase-2 judgment per row).
> Conservative floor: 3 new rows + 1 alias (the most defensible strong-promotion: Sortiarius +
> Pharos + Sicarus + the Sol-System alias); recommended target: **6 new rows + 2 aliases**
> (strong-promotion: Sortiarius + Pharos + Sicarus + Ithraca + Northwilds + Numinus, plus the
> Sortiarius companion alias + the Sol-System alias); ceiling: **9 new rows + 2 aliases**
> (recommended + Xana-Tisiphone + Duat + Oran). **Heavier than the Pass-14 location pass on
> sub-locale grain but lighter on vessel-grain** — Pass-14 was vessel-promotion-heavy (Phalanx,
> Macragge's Honour, Irkalla); Pass-15 is daemon-world + sub-locale promotion-heavy (Sortiarius,
> Sicarus, Ithraca, Northwilds, Numinus, Pharos). The Sortiarius / Sicarus / Pharos triple is
> the Pass-15 strongest location-promotion bloc (three lore-foundational Heresy daemon-worlds /
> beacons — parallel to Pass-14's Chemos / Laer Heresy-Primarch-homeworld pair).

**Characters (Phase 3).** See 7a (2 alias adds: Case A `Aenoid Thiel → aeonid_thiel` typo + Case
B `Bjorn the One-Handed → bjorn` Pre-Dreadnought honor-title) + 7b (1 spine row: `endryd_haar`).
Plus the freq-1 long tail.

Curated freq-1 lore-iconic character candidates (Phase-3 discretion):

- **Lore-iconic / cross-arc supporting cast (strong promotion candidates):**
  - **`Khalid Hassan`** (HH-0252 *The Sigillite*). Malcador's covert-operative agent — the
    Officio Sigillite's namesake-audio-drama deuteragonist. Lore-iconic supporting cast
    (cross-arc with the Pass-? Sigillite-frame audio dramas + Malcador's Knights-Errant
    network). → **new row `khalid_hassan`**. primaryFactionId `officio_sigillite` (the new
    Phase-1 row — FK dependency on Phase 1) OR `adeptus_astra_telepathica` (existing Pass-?
    row) if Phase 1 does not promote Officio Sigillite. Strong-promotion case.
  - **`Argonis`** (HH-0285 *Dark Compliance*). Sons of Horus emissary — the late-Heresy
    compliance-arc-Horus envoy. Lore-iconic Sons-of-Horus supporting cast (cross-arc with the
    post-Heresy / Siege-of-Terra Horus retinue arc). → **new row `argonis`**. primaryFactionId
    `sons_of_horus`. Strong-promotion case.
  - **`Endryd Haar` 7b** — see 7b (strict freq-3 within-batch promotion).
  - **`Yasu Nagasena`** (HH-0254 *Wolf Hunt*). Imperial Talent-scout / agent — the protagonist
    of *Wolf Hunt* (and cross-arc with the *The Sigillite* / Knights-Errant arc + the
    Officio-Sigillite-grain Imperial-agent network). → **new row `yasu_nagasena`**.
    primaryFactionId `officio_sigillite` if Phase 1 promotes that row OR (more conservative)
    `senatorum_imperialis`. Strong-promotion case.
  - **`Sobek`** (HH-0256 *Thief of Revelations*). Thousand Sons supporting cast — post-Prospero
    Thousand-Sons figure in the Eye of Terror. Cross-arc with the Pass-? Thousand-Sons supporting-
    cast catalog (Hathor Maat / Ahzek Ahriman / Sanakht — all direct in §3). → **new row
    `sobek`**. primaryFactionId `thousand_sons`. Medium-strong promotion.
  - **`Amon`** (HH-0256 *Thief of Revelations*). Thousand Sons supporting cast — Magnus's
    equerry. Cross-arc with the Thousand-Sons catalog. → **new row `amon`**. primaryFactionId
    `thousand_sons`. Medium-strong promotion.
  - **`Zagreus Kane`** (HH-0284 *The Binary Succession*). Mechanicum Fabricator-General successor
    candidate — the post-Kelbor-Hal Mars-loyalist Mechanicum figure who eventually becomes the
    post-Heresy Fabricator-General. Lore-iconic Mechanicum cross-arc figure. → **new row
    `zagreus_kane`**. primaryFactionId `mechanicus`. Strong-promotion case.
  - **`Vethorel`** (HH-0284 *The Binary Succession*). Mechanicum figure (paired with Zagreus
    Kane in the succession-crisis arc). Medium promotion — recommend promotion alongside
    Zagreus Kane for the Mechanicum-succession-arc completeness. → **new row `vethorel`**.
    primaryFactionId `mechanicus`. Medium-promotion case.
  - **`Lord Cypher`** (HH-0259 *Cypher: Guardian of Order*). **Cross-Era disambig candidate** —
    see 7d. The Heresy-era Dark-Angels title-character (Lord Cypher is the **title-position**
    in the Order of Caliban during the Heresy; the post-Heresy `cypher` row already exists for
    the M41 Fallen Lord-of-the-Fallen figure). Per runbook §4 Cross-Era convention: if the
    Heresy-era title-holder **is** the post-Heresy Cypher (the most-common-lore-reading),
    alias `Lord Cypher → cypher` is the correct call. If they are distinct (the title was
    held by multiple figures, only one of which becomes the post-Heresy Cypher), then either
    a new row `lord_cypher` (the title-position) or `## Needs decision` for ambiguity. The
    `cypher` row note explicitly says "Lord of the Fallen, central enigma" — the canonical
    identity is **the** Cypher, not a title — but the Heresy-era surface form is "Lord
    Cypher" (title). Phase-3 judgment — see 7d. Recommendation: **alias `Lord Cypher →
    cypher`** under Cross-Era convention (the Heresy-era title-holder is the same identity
    as the post-Heresy Cypher per the most-common-lore-reading).
- **Single-novel POVs / strong supporting cast (medium promotion candidates):**
  - **`Bulveye`** (HH-0279 *The Thirteenth Wolf*). Space Wolves Wolf Lord — namesake-arc
    audio drama character. Lore-anchored Space-Wolves Wolf-Lord (Bulveye is the Pass-? Wolf-Lord
    Thurr's predecessor / one of the Original Six Wolf Lords; cross-arc with the Space-Wolves
    Heresy arc). → **new row `bulveye`**. primaryFactionId `space_wolves`. Medium-promotion case.
  - **`Navar Hef`** (HH-0274 *Raptor*). Raven Guard Isstvan-V survival POV. Phase-3 judgment
    — recommendation: **promote `navar_hef`** (lore-iconic Raven-Guard Isstvan-V-survivor —
    cross-arc with the Raven-Guard *Deliverance Lost* + the Raven's Flight Pass-14 audio drama).
    primaryFactionId `raven_guard`. Medium-promotion case.
  - **`Bion Henricos`** (HH-0275 *Grey Talon*). Iron Hands / Shattered-Legions character —
    cross-arc with the Pass-? Iron-Hands Shattered-Legions catalog. Phase-3 judgment —
    recommendation: **promote `bion_henricos`** (lore-anchored Iron-Hands cross-arc figure).
    primaryFactionId `iron_hands`. Medium-promotion case.
  - **`Hibou Khan`** (HH-0275 *Grey Talon*). White Scars Khan — cross-arc with the *Brotherhood
    of the Storm* / *Path of Heaven* White-Scars arc. Phase-3 judgment — recommendation:
    **promote `hibou_khan`** (lore-iconic White-Scars Khan). primaryFactionId `white_scars`.
    Medium-promotion case.
  - **`Jubal Khan`** (HH-0262 *Templar*). White Scars Khan — cross-arc with the White-Scars arc.
    Phase-3 judgment — recommendation: **promote `jubal_khan`** alongside Hibou Khan for
    Khan-tier completeness. primaryFactionId `white_scars`. Medium-promotion case.
  - **`Captain Melian`** (HH-0264 *Master of the First*). Dark Angels supporting cast — Caliban
    Heresy-era audio drama. Phase-3 judgment — recommendation: leave unresolved (single-audio-
    drama supporting cast, weak cross-arc warrant).
  - **`Tylaine`** (HH-0264 *Master of the First*). Dark Angels supporting cast. Phase-3
    judgment.
  - **`Meric Voyen`** (HH-0271 *Garro: Ashes of Fealty*). Death Guard / Knights-Errant
    supporting cast — Garro-arc figure. Phase-3 judgment — recommendation: **promote
    `meric_voyen`** (cross-arc with the Garro / Knights-Errant network — Voyen is a recurring
    Garro-companion across the Garro audio-drama series). primaryFactionId `knights_errant` or
    `death_guard`. Medium-promotion case.
  - **`Katanoh Tallery`** (HH-0263 *Garro: Shield of Lies*). Administratum adept — civilian
    POV in the Garro arc. Phase-3 judgment — recommendation: leave unresolved (single-audio-
    drama civilian POV).
  - **`Ison`** (HH-0268 *The Watcher*). Imperial Fists / Librarian supporting cast. Phase-3
    judgment.
  - **`Tebecai` / `Oberdeii`** (HH-0278 *The Heart of the Pharos*). Salamanders Pharos-arc
    supporting cast. Phase-3 judgment — recommendation: **promote `oberdeii`** (cross-arc
    with the Pass-? Sotha-Pharos arc and recurring Salamanders Pass-13/14 cast); leave
    `tebecai` unresolved.
  - **`Koparnos`** (HH-0270 *Iron Corpses*). Iron Warriors at Tallarn — single-novella POV.
    Phase-3 judgment.
  - **`Erud Vahn`** (HH-0290 *Blackshields: The Broken Chain*). Blackshields-trilogy supporting
    cast (paired with Endryd Haar in the trilogy finale). Phase-3 judgment — recommendation:
    **promote `erud_vahn`** alongside Endryd Haar for trilogy-cast completeness. primaryFactionId
    `blackshields`. Medium-promotion case.
  - **`Alcaeus`** (HH-0288 *Hubris of Monarchia*). Imperial Fists / Custodes supporting cast.
    Phase-3 judgment.
  - **`Archorian`** (HH-0282 *The Soul, Severed*). Emperor's Children supporting cast — paired
    with Eidolon / Fulgrim. Phase-3 judgment.
  - **`Katt`** (HH-0281 *Perpetual*). Perpetuals-arc supporting cast — cross-arc with John
    Grammaticus / Oll Persson. Phase-3 judgment — recommendation: **promote `katt`** (cross-arc
    with the Perpetuals network — Katt is a Perpetual figure recurring across Abnett's HH
    catalog). primaryFactionId `perpetuals` (if such a row exists; else empty). Medium-
    promotion case.
- **Single-novel supporting cast (weak promotion candidates — Phase-3 judgment, default leave
  unresolved):**
  - **`Sareo` / `Ven` / `Tidon` / `Felbjorn`** (HH-0260 *Hunter's Moon*). Space Wolves
    Hunter's-Moon-arc supporting cast.
  - **`Larazzar`** (HH-0280 *Children of Sicarus*). Word Bearers daemon-world supporting cast.
  - **`Altani`** (HH-0265 *The Long Night*). Night Lords supporting cast.
  - **`Vultius`** (HH-0255 *Censure*). Aeonid-Thiel-arc supporting cast.

> Phase-3 promotion shape (recommended): **2 alias adds** (Case A `Aenoid Thiel → aeonid_thiel`
> + Case B `Bjorn the One-Handed → bjorn`) + **1 strict-freq-3 within-batch new row** (7b
> `endryd_haar`) + **6 strong curated freq-1 lore-iconic new rows** (`khalid_hassan` +
> `argonis` + `yasu_nagasena` + `sobek` + `amon` + `zagreus_kane`; alternatively `lord_cypher`
> could be alias-add per 7d disambig recommendation) + **0..8 medium-curated freq-1 new rows**
> (`vethorel` + `bulveye` + `navar_hef` + `bion_henricos` + `hibou_khan` + `jubal_khan` +
> `meric_voyen` + `oberdeii` + `erud_vahn` + `katt` — Phase-3 judgment per row) + **0..6 weak-
> curated long-tail new rows** (the remaining freq-1 long tail). Conservative floor: 1 new row
> (7b: endryd_haar) + 2 alias adds (7a Cases A + B) + 3 strongest freq-1 (Khalid Hassan + Argonis
> + Yasu Nagasena — the Officio-Sigillite / Sons-of-Horus-emissary / Wolf-Hunt-protagonist
> trio). Recommended target: **~10 new rows + 2 alias adds + 1 Cross-Era alias (Lord Cypher
> → cypher)** (floor + 4 additional strong-promotion + a few medium). Ceiling: **~17 new rows
> + 3 alias adds** (recommended + medium-curated + weak long-tail). **A medium-weight Phase-3
> promotion pass** — comparable to Pass-14's 9-row + 1-alias. The 7a alias-pair anchors a tight
> typo / Cross-Era pair; the 7b Endryd-Haar spine anchors the strongest single-row case; the
> audio-drama-supporting-cast freq-1 tail bulks the curated cut.

### 7d. needs-decision candidates (expected: 0 hard blockers)

- **Forward-ref Guard post-Brief-101: expected `out-of-range=0, unknown-work=0`.** Pass-15 has
  **no roster-collection omnibi** in the wave per §5 (empty omnibus scan — the §5 table has
  zero data rows). The HH-0291..HH-0294 artbook/scriptbook tail does **not** carry
  `relatedBookIds` per the roster (artbooks/scriptbooks are reference volumes, not novel-omnibi
  with constituent works), so the Brief-091 forward-ref Guard is **not active** this wave. The
  audit-cockpit Guard expects: 0 out-of-range refs (no refs to evaluate), 0 unknown-work refs
  (no refs to evaluate). Phase 4a verifies the counts; mismatch (`unknown-work > 0` or
  `out-of-range > 0`) is a `## Needs decision` stop. **Not a hard block** — the Guard has no
  work this wave; clean output expected.
- **`Lord Cypher → cypher` Cross-Era disambig (Phase 3).** The Heresy-era surface form `Lord
  Cypher` (freq 1, HH-0259 *Cypher: Guardian of Order*) is the **title-position** "Guardian of
  the Order of Caliban" held by the Dark Angels' Lord Cypher during the Heresy. The existing
  Pass-7 `cypher` row (primaryFactionId `fallen_angels`) is the post-Heresy "Lord of the
  Fallen, central enigma" — the M41-era Fallen Angel Cypher. Per runbook §4 Cross-Era
  convention (one canonical identity = one canonical row; era-/form-specific surface forms in
  `*-aliases.json`), the **canonical lore reading** is that the Heresy-era Lord Cypher title-
  holder is the **same individual** who becomes the post-Heresy Cypher (the title becomes the
  name as the order falls; this is the Master-of-Sanctity / Astelan / Luther / Zahariel
  paratext in *Cypher: Guardian of Order* — Luther's order, the Order of Caliban, the Lord
  Cypher's role within it). However, **alternate lore readings** exist where the title was held
  by multiple figures across the Heresy, only one of which becomes the post-Heresy Cypher
  (making this either a title-position-grain new row or an ambiguous identity). Phase 3 chooses
  between (a) alias `Lord Cypher → cypher` (Cross-Era same-identity reading — recommended per
  runbook §4), (b) new row `lord_cypher` (title-position-grain reading — Phase-3 judgment if
  the title-vs-name distinction is preserved), (c) `## Needs decision` (defer). Recommendation:
  **(a) alias `Lord Cypher → cypher`** per Cross-Era convention — the runbook §4 default for
  Heresy-era honor-title / cross-era surface forms is to alias onto the existing canonical row.
  The `cypher` row's existing note ("primaryFactionId fallen_angels per Phase-1 alias decision")
  pre-dates the Heresy-era *Cypher: Guardian of Order* surface; Phase 3 may want to update the
  row note to acknowledge the Heresy-era Lord-Cypher-title surface but the row itself does not
  need to be split. **Not a hard block** — Phase 3 chooses, alias-add recommended.
- **`Planet of Sorcerers` → `sortiarius` Phase-2 alias branch (Phase 2).** As detailed in 7c:
  the strict-freq-2 within-batch surface form `Planet of Sorcerers` (HH-0256 / HH-0258) has
  three Phase-2 decision branches — (a) new row `sortiarius` + alias `Planet of Sorcerers →
  sortiarius` (recommended — canonical-name-row + descriptive-surface-alias, consistent with
  the Cross-Era pattern), (b) new row `planet_of_sorcerers` (descriptive-name as canonical),
  (c) leave unresolved. Recommendation: **(a) `sortiarius` row + alias**. **Not a hard block**
  — Phase 2 chooses per source-coverage availability.
- **`Adeptus Administratum` cumulative-cross-pass evidence (Phase 1, parallels Pass-14's Astagar
  case).** Pass-14 listed `Administratum` (HH-0224 *Abyssal*) as "leave unresolved for budget
  conservatism"; Pass-15 has the same surface return at HH-0263 *Garro: Shield of Lies*.
  **Cumulative cross-pass freq-2.** Phase-1 may now reconsider for a curated cumulative-cross-
  pass promotion (parallel to the Pass-14-recommendation pattern for `astagar` — promote on
  cumulative-cross-pass evidence even when single-pass evidence is freq-1). Recommendation:
  **promote `adeptus_administratum`** (already included in 7c Phase-1 recommendation; flagged
  here for explicitness). **Not a hard block.**
- **`Astagar` Pass-14-listed cross-pass cumulative case — no Pass-15 surface (Phase 2 carry-over).**
  The Pass-14 dossier 7d flagged `astagar` as a cumulative-cross-pass-freq-2 Phase-2 case
  (Pass-13 HH-0141 + Pass-14 HH-0217). Pass-15 has **no** `Astagar` surface in §3 (verified in
  the aggregator output). Phase 2 may still choose to promote `astagar` from the Pass-13/14
  cumulative evidence at this wave (judgment carries over), or defer further. Not a Pass-15
  active question; flagged for completeness. **Not a hard block.**
- **`data_conflict:title->Stratagem` (HH-0266, Phase 4a-side, not Phase 1/2/3).** The roster
  records HH-0266 *Strategem* (with `data_conflict:title->Stratagem` flag — canonical Black-
  Library spelling is *Stratagem*, not *Strategem*). Phase 4a applies the override as authored;
  the title conflict surfaces in the apply digest as advisory carry-through. **Not a Phase-1/2/3
  concern.**
- **`low_confidence:*` advisory carry-through (6 flags, Phase 4a-side, not Phase 1/2/3).**
  HH-0251 *Veritas Ferrum* (`characters`), HH-0253 *Honour to the Dead* (`characters`), HH-0265
  *The Long Night* (`locations`), HH-0269 *The Eagle's Talon* (`characters`), HH-0282 *The Soul,
  Severed* (`locations`), HH-0290 *Blackshields: The Broken Chain* (`locations`). All advisory
  carry-through for the audit cockpit; does not gate resolver axes. **Not a Phase-1/2/3
  concern.**
- **HH-0291..HH-0294 reference-volume format coverage (Phase 4a-side advisory).** The four
  ssot-hh-030 books are 2 artbooks + 2 scriptbooks — reference / overview format, not novel /
  audio_drama format. Surface forms in these four books aggregate across the entire HH series
  (e.g. all 18 Primarchs surface in Collected Visions; all Original Six audio dramas appear in
  Scripts Volume I). The aggregator counts them like any other surface, but Phase 4a may want
  to flag the artbook/scriptbook format as advisory in the apply digest. **Not a Phase-1/2/3
  concern.**
- **Cumulative milestone — HH-domain 294-book mark (near-final).** After this pass: **294 HH
  books** (250 applied through Pass 14 + 44 in this wave). The Phase 4b impl-report should
  flag this as the **HH-domain near-final wave** — only ~1 batch (~10 books) of HH-domain
  works remains after this pass before the HH corpus closes out at the ~304-book mark. The
  next pass (Pass 16, expected ssot-hh-031..03N) is forecasted to be the **final HH wave**
  before the HH domain seals (parallel to W40K-565 seal). The Phase 4b impl-report should call
  this milestone out for the loop coordinator.
- **Cross-axis surface-form conflicts** — **none in this wave** per §4. The Pass-15 surface
  set is clean on that axis-disambig front. The Pass-11/12/13/14 advisories about future cross-
  axis disambig cases would activate this wave (HH-0259 *Cypher: Guardian of Order* surfaces
  `Lord Cypher` on the character axis — see disambig case above), but the surface name does
  not collide with a faction or location surface form (no `Cypher` faction or location surfaces
  in §3), so the cross-axis disambig is **not active** this wave; the `Lord Cypher` case is
  purely a character-axis Cross-Era same-name-family disambig.

The per-axis promotion extents (7c), the 7a strict-freq-≥2 alias-consolidation triple (Cases A,
B, L1), and the 7b Endryd-Haar within-batch spine are in-phase **judgments**, justified in each
phase report — none escalates to a hard block under current evidence. The Brief-091 forward-ref
Guard has no work this wave (§5 omnibus scan empty — no roster-collection omnibi), so the
architectural concern is closed; clean Guard outcome expected. The cumulative HH-domain near-
final milestone (294 books) should be called out in the Phase 4b impl-report.
