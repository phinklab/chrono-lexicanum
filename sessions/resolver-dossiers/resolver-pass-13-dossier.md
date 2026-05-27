# Resolver-Pass 13 — Phase-0 Dossier (ssot-hh-015..020 / HH-0141..HH-0200)

> Deterministic cross-axis context for the three axis-phases (Factions / Locations / Characters) + the
> Phase-4 integration. **Sections 2–6 are the mechanical output** of
> `scripts/aggregate-surface-forms.ts --config scripts/resolver-pass.config.json` (read-only, idempotent —
> re-running on the committed override files + seed-data yields byte-identical output). **Section 7 is the
> only LLM-synthesized part** (cross-batch alias-consolidation + needs-decision candidates; this wave is
> dominated by the Heresy Anthology / Age-of-Darkness-era e-shorts tail + the long Heresy-novella mid-set,
> so the section is heavy on Sons-of-Horus-era short-form alias work, a small Pre-Heresy proto-cult
> question, and the lightest new-row promotion pass of the HH arc so far). Phases 1–4 read THIS file, not
> the 6 override files or the loop-log. Brief-free pass (Brief 094 lean contract); the operative spec is
> [`sessions/resolver-pass-runbook.md`](../resolver-pass-runbook.md) + the per-pass config — no architect
> brief is read to run a phase.

## 1. Scope header

- **Wave:** `ssot-hh-015..020` (6 loop batches, 10 books × 6 = **60 books** — the e-anthology /
  short-story tail of the mid-Heresy block, picking up directly after the Pass-12 wave of 60 books
  at HH-0081..HH-0140). Wave size confirmed by the loop-helper after Pass-12 settled cleanly
  (works 765/cumulativeAfter after ssot-hh-020).
- **IDs:** `HH-0141..HH-0200` (60 books). Composition shifts decisively away from Pass-12's
  *Primarchs*-monograph spine into the long-form Heresy short-story / e-short tail and a handful
  of novella anchors:
  - **ssot-hh-015 / HH-0141..HH-0150** = the **e-anthology / Heresy-Anthologies block**:
    Sedition's Gate, Echoes of Ruin (audio anthology), Death and Defiance, Blades of the Traitor,
    Meduson (Shattered Legions guerrilla), Betrayal at Calth (Underworld War paired novella),
    Echoes of Imperium (audio anthology), Virtues of the Sons / Sins of the Father (paired audio
    drama), Echoes of Revelation (audio anthology), Blood Games (Custodes standalone short).
  - **ssot-hh-016 / HH-0151..HH-0160** = the *Tales of Heresy* / *Age of Darkness* short-story
    cluster: Wolf at the Door (Space Wolves vs Dark Eldar), Scions of the Storm (Sor Talgron /
    Word Bearers), The Voice (Sisters of Silence aboard Validus), Call of the Lion (Dark Angels
    compliance debate), The Last Church (Emperor in disguise — highest GR rating of the batch),
    After Desh'ea (Kharn ↔ Angron origin, War-Hounds → World-Eaters transition), Rules of
    Engagement (post-Calth Codex test), Liar's Due (Alpha Legion propaganda on Virger-Mos II),
    Forgotten Sons (Salamanders + Ultramarines ambassador piece), The Last Remembrancer
    (Dorn/Qruze/Solomon-Voss execution argument on Titan).
  - **ssot-hh-017 / HH-0161..HH-0170** = the *Age of Darkness* / *Shattered Legions* short-story
    cluster: Rebirth (Kalliston vs Khârn on Tizca), Face of Treachery (Branne Nev — Raven Guard
    rescue of Corax from Isstvan V), Little Horus (Aximand-POV cross-arc), Iron Within (Dantioch
    debut at Schadenhold), Savage Weapons (Lion vs Curze parlay on Tsagualsa, Sevatar debut),
    Army of One (unnamed Eversor — `low_confidence:characters`), Kryptos (Sharrowkyn / Wayland +
    Sisypheum doctrine), Distant Echoes of Old Night (Death Guard Destroyers on unnamed forest
    moon), Lost Sons (Baal Blood Angels + Tylos Rubio), Death of a Silversmith (Vengeful Spirit
    remembrancer POV — `low_confidence:characters`).
  - **ssot-hh-018 / HH-0171..HH-0180** = the closing *Age of Darkness* / mid-Heresy novella set:
    The Divine Word (Therion Cohort + Marcus Valerius), The Kaban Project (Mechanicum prequel),
    The Gates of Terra (Ultramarine Arcadese under Malcador frame), Lord of the Red Sands
    (Angron interior monologue on Isstvan III), Serpent (Davinite Serpent Lodge / Thoros), Luna
    Mendax (Loken / Caliban-referenced), Riven (Crius / Iron Hands + Imperial Fists on Terra),
    Bjorn: Lone Wolf (Bjorn standalone), The Wolf of Ash and Fire (Russ + son, Great-Crusade-era),
    Heart of the Conqueror (Word Bearers + Navigator POV).
  - **ssot-hh-019 / HH-0181..HH-0190** = the mid-Heresy character-study short-story set: Child of
    Night (Night Lords Fel Zharost), The Devine Adoratrice (House Devine / Molech pre-setup),
    Daemonology (Mortarion / Terathalion), Sins of the Father (paired audio with Virtues of the
    Sons), The Final Compliance of Sixty-Three Fourteen (= Goughen, governor study), Vorax (Dark
    Mechanicum / Ring of Iron — `low_confidence:characters`), The Value of Fear (Night Lord as
    loyalist supporting), Brotherhood of the Moon (Torghun Khan / Luna Wolves recollection),
    Virtues of the Sons (Amit vs Khârn, Azkaellon vs Lucius dual-duel), Imperfect (Fulgrim as
    daemon prince + Fabius Bile clone variants — `low_confidence` skipped, but
    `protagonist_class=daemon`).
  - **ssot-hh-020 / HH-0191..HH-0200** = the closing 60th-book block of the Heresy-novella tail:
    Howl of the Hearthworld (Space Wolves Thirteenth-Falling-Stars watch-pack on Terra), A Safe
    and Shadowed Place (Night Lords remnants reach Sotha as Pharos prologue —
    `low_confidence:characters`), Gunsight (Vindicare Eristede Kell aboard Vengeful Spirit),
    Black Oculus (Iron Warriors Navigator post-Eye-of-Terror — `low_confidence:characters`),
    Wolf Mother (Alivia Sureka + Severian post-Vengeful-Spirit on Molech's Enlightenment),
    Twisted (Maloghurst counter-plots Davinite Lodge), Chirurgeon (Fabius Bile two-timeframe —
    `low_confidence:locations`), Tallarn: Witness (Susada Syn governor-militant on Tallarn),
    Ironfire (Idriss Krendl + Selenic palace + Diamat siege guns on Euphoros), Hands of the
    Emperor (Enobar Stentonox / Valdor — Imperial Palace airspace dispute).
- **Cumulative:** **200 HH books** in the HH authority layer after this pass (140 applied through
  Pass 12 + 60 new in this wave). W40K side stays sealed at 565/565 books — out of scope for this
  pass.
- **Resolver baseline (pre-Pass-13 reference rows + aliases, emitted by the aggregator):** factions
  **190** rows / **70** aliases · locations **267** / **19** · characters **457** / **56**. The
  Pass-12 deltas vs. the Pass-12 baseline (188/69 · 256/17 · 444/53) are visible: +2 faction rows /
  +1 faction alias / +11 location rows / +2 location aliases / +13 character rows / +3 character
  aliases. Pass-12 absorbed the Primarch-birthworld bloc and the Calth-Underworld spine pair, so
  Pass-13's surface set lands on a deep anchor catalog: **every freq ≥ 2 Primarch surface in this
  wave catches its Pass-10/11/12 row direct**, **every freq ≥ 2 Legion / sub-Legion faction in
  this wave catches its Pass-10/11/12 row or alias direct**, and the Pass-12 Cross-Era alias
  chains (Horus Lupercal / Lorgar Aurelian / Lucius / Khârn ↔ Kharn / Luna Wolves / Mechanicum /
  Imperial Army / Dark Eldar / Sisters of Silence / Knights-Errant) all confirmed by §3. The new
  alias work in §7a is the **next short-form cross-batch surface that Pass-12 didn't catch**
  (`Maloghurst` bare-form — Pass-10/12 anchored only the long-form `Maloghurst the Twisted`),
  plus one `the_emperor` longer-variant (`The Emperor of Mankind` with leading "The"), plus the
  full-form ↔ short-form pair `Nassir Amit` ↔ existing `amit` row, plus the Thousand-Sons psyker
  full-form pair `Revuel Arvida` (the namesake of HH-0161 *Rebirth*) ↔ `Arvida` short-form
  surface.
- **Apply range Phase 4:** `hh 1..20` (config `aggregator.applyRange` = `{ domain: "hh", from: 1,
  to: 20 }`). Idempotent delete-then-insert re-apply of `ssot-hh-001..014` (already applied at
  Pass 10–12, no churn — the data has not changed) + first-time apply of `ssot-hh-015..020` (60
  new books). Domain-aware Trias-Batch-Range tuples for the apply-side trio
  (`apply-override-dry.ts` / `test-resolver-coverage.ts` / `test-resolver-data-integrity.ts`) are
  appended with the **six new `{ domain: "hh", n: "015" }` .. `{ domain: "hh", n: "020" }`
  entries** alongside the existing W40K-001..057 + HH-001..014 set (runbook §3 Phase 4a + config
  `phase-4a-integration.trigger`).
- **Clusters (observed; config has no `clusters` field this pass, so §3's cluster column stays `?`):**
  - `ssot-hh-015` → **HH-0141..HH-0150 — Heresy-Anthology-Block + Custodes standalone:** five
    BL e-anthologies (Sedition's Gate, Echoes of Ruin audio, Death and Defiance, Blades of the
    Traitor, Echoes of Imperium audio, Echoes of Revelation audio) + Meduson (Shattered Legions
    guerrilla — `low_confidence:locations`) + Betrayal at Calth paired novella + Virtues of the
    Sons/Sins of the Father paired audio + Blood Games (Custodes Heresy debut — Dan Abnett, the
    only short-story standalone in this batch, surface forms include `Hy Brasil` Terran hive +
    `Amon Tauromachian` Custodian + `Aleya Doulos`-type Sister figures). The two
    `low_confidence:factions` flags (HH-0145 + HH-0147) reflect deliberate aggregator
    conservatism — both anthologies have partial/sub-coverage of supporting Legions, captured
    in the override as conservative aggregates rather than guessing.
  - `ssot-hh-016` → **HH-0151..HH-0160 — *Tales of Heresy* / *Age of Darkness* short-story
    cluster:** Wolf at the Door (Mike Lee — Space Wolves vs Dark Eldar — `Bulveye` + `Andras`
    POV), Scions of the Storm (Anthony Reynolds — Sor Talgron Word-Bearers introspection
    post-Monarchia), The Voice (James Swallow — Sisters of Silence aboard Black Ship Validus —
    `Amendera Kendel` + `Leilani Mollitas`), Call of the Lion (Gav Thorpe — Astelan / Belath
    compliance debate around Byzanthis; batch's lowest GR), The Last Church (Graham McNeill —
    Emperor-in-disguise as `Revelation`, civilian-priest `Uriah Olathaire` POV, the standout of
    the batch at GR 4.27), After Desh'ea (Matthew Farrer — Kharn ↔ Angron origin on Desh'ea,
    War-Hounds → World-Eaters transition with `Dreagher` supporting), Rules of Engagement
    (Graham McNeill — Ventanus / Aethon Codex-test cycle), Liar's Due (James Swallow — Alpha
    Legion propaganda on Virger-Mos II — `Mendacs` + `Dallon Prael` + `Silas Cincade`),
    Forgotten Sons (Nick Kyme — Salamanders + Ultramarines ambassador piece on Bastion —
    `Heka'tan` + `Vorkellen` + `Persephia` + `Arcadese`-spine first hit), The Last
    Remembrancer (John French — Dorn / Iacton Qruze / Solomon Voss execution argument on
    Titan — Sons-of-Horus-era arc). The Knights-Errant surface form `Knight-Errant Iacton
    Qruze` catches the Pass-11 alias on `Knights-Errant → knights_errant`.
  - `ssot-hh-017` → **HH-0161..HH-0170 — *Shattered Legions* / *Age of Darkness* short-story
    cluster:** Rebirth (Chris Wraight — Menes Kalliston / Revuel Arvida vs Khârn on Tizca,
    closing the Prospero arc-thread), The Face of Treachery (Gav Thorpe — Branne Nev's
    Raven-Guard rescue of Corax from Isstvan V), Little Horus (Dan Abnett — Aximand-POV with
    Sons-of-Horus supporting cast: Noctua + Meduson + Hibou Khan + Henricos + Loken-as-dream),
    The Iron Within (Rob Sanders — Barabas Dantioch's loyalist-Iron-Warrior debut at the
    Schadenhold on Lesser Damantyne; batch's highest GR 4.26), Savage Weapons (Aaron
    Dembski-Bowden — Tsagualsa parlay Lion vs Curze, Sevatar / Corswain / Alajos debut), Army
    of One (Rob Sanders — Eversor-assassin one-shot, assassin unnamed →
    `low_confidence:characters`), Kryptos (Graham McNeill — Sharrowkyn / Sabik Wayland debut +
    Sisypheum origin, locations empty because the Sisypheum is a ship), Distant Echoes of Old
    Night (Rob Sanders — Death Guard Destroyers' debut on unnamed forest moon — locations
    empty), Lost Sons (James Swallow — Baal Blood Angels + Warden Arkad + Tylos Rubio errant-
    knight visit), Death of a Silversmith (Graham McNeill — Vengeful-Spirit remembrancer POV
    killed by unnamed Luna-Wolf-era captain — false-Sejanus thread, `low_confidence:characters`).
  - `ssot-hh-018` → **HH-0171..HH-0180 — mid-Heresy novella / e-short set:** The Divine Word
    (Gav Thorpe — Therion Cohort `Marcus Valerius` POV embedded with Raven Guard, locations
    empty), The Kaban Project (Graham McNeill — Mechanicum prequel-to-*Mechanicum*, Sons of
    Horus supporting, `Pallas Ravachol` + `Lukas Chrom`), The Gates of Terra (Nick Kyme —
    Ultramarine `Arcadese`-spine second hit under a Malcador frame, sector-grain scope on
    Ardent Reef), Lord of the Red Sands (Aaron Dembski-Bowden — Angron interior monologue on
    Isstvan III, Nuceria supporting), Serpent (John French — Davinite Serpent Lodge cult
    vignette around `Thoros` priest, no Word Bearers on-page), Luna Mendax (Graham McNeill —
    Loken on Luna referencing Caliban errand, Caliban as supporting location), Riven (John
    French — `Crius` on Terra under Crusader Host, Iron Hands primary + Imperial Fists
    supporting), Bjorn: Lone Wolf (Chris Wraight — Bjorn standalone novella on Velbayne), The
    Wolf of Ash and Fire (Graham McNeill — Russ + son, Great-Crusade-era flavor; only batch
    entry tagged hopepunk), Heart of the Conqueror (Aaron Dembski-Bowden — Word Bearers /
    Navigator `Nisha Andrasta` POV en route, locations galactic). **`Maloghurst` cross-batch
    alias first hit** (HH-0144) carries through the wave (second hit HH-0196).
  - `ssot-hh-019` → **HH-0181..HH-0190 — mid-Heresy character-study cluster:** Child of Night
    (John French — Night Lord `Fel Zharost` lapsed-Librarian study), The Devine Adoratrice
    (Graham McNeill — House Devine pre-*Vengeful Spirit* setup on Molech, Serpent Cult, full
    Devine family — `Cyprian Devine` + `Cebella` + `Lyx` + `Raeven Devine` + `Abelard Devine`),
    Daemonology (Chris Wraight — Mortarion / Death Guard on Terathalion, with Terra), Sins of
    the Father (Andy Smillie — paired with Virtues of the Sons, Blood-Angels-vs-World-Eaters
    duel — `Nassir Amit` full-form first hit), The Final Compliance of Sixty-Three Fourteen
    (Guy Haley — `Mayder Oquin` governor study on Goughen = Sixty-Three Fourteen), Vorax
    (Matthew Farrer — Dark Mechanicum adept on Mars / Ring of Iron — `low_confidence`,
    `Maloghurst` second-hit no, Maloghurst surfaces in HH-0196), The Value of Fear (Gav
    Thorpe — Night Lord `Ashel` as loyalist-supporting, Alpha Legion antagonist), Brotherhood
    of the Moon (Chris Wraight — `Torghun Khan` White Scars internal trial recalling Luna
    Wolves), Virtues of the Sons (Andy Smillie — `Nassir Amit` second-hit + Amit vs Khârn,
    Azkaellon vs Lucius), Imperfect (Nick Kyme — Fulgrim daemon-prince POV + Fabius Bile
    clone-variants of Ferrus Manus, `protagonist_class=daemon`).
  - `ssot-hh-020` → **HH-0191..HH-0200 — closing 60th-book mid-Heresy block:** Howl of the
    Hearthworld (Aaron Dembski-Bowden — Space-Wolves watch-pack `Kargir` POV on Terra,
    Imperial Fists supporting, Malcador the Sigillite), A Safe and Shadowed Place (Guy Haley —
    Night Lords remnants reach Sotha as Pharos prologue, `low_confidence:characters`),
    Gunsight (James Swallow — Vindicare `Eristede Kell` aboard Vengeful Spirit, Officio
    Assassinorum primary), Black Oculus (John French — Iron Warriors Navigator monologue
    after passage through the Eye of Terror on Iron Blood, `low_confidence:characters`), Wolf
    Mother (Graham McNeill — `Alivia Sureka` + `Severian` aboard Molech's Enlightenment, Knights
    Errant supporting, Serpent Cult antagonist), Twisted (Guy Haley — `Maloghurst` second-hit
    counter-plots Davinite Lodge from inside Vengeful Spirit, Davin supporting), Chirurgeon
    (Nick Kyme — Fabius Bile two-timeframe study, `low_confidence:locations`), Tallarn:
    Witness (John French — `Susada Syn` governor-militant on Tallarn surveying post-battle
    waste from a Titan), Ironfire (Rob Sanders — Warsmith `Idriss Krendl` Ironfire protocol
    on Euphoros vs Selenic palace, Diamat siege guns), Hands of the Emperor (Rob Sanders —
    Shield-Captain `Enobar Stentonox` vs Imperial Fists working party over restricted Palace
    airspace + Constantin Valdor supporting).

## 2. Book table (60 entries)

| externalBookId | slug | title | format | author | year | batch | cluster | flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HH-0141 | `seditions-gate` | *Sedition's Gate* | collection | ? | 2014 | `ssot-hh-015` | `?` | — |
| HH-0142 | `echoes-of-ruin` | *Echoes of Ruin* | collection | ? | 2014 | `ssot-hh-015` | `?` | — |
| HH-0143 | `death-and-defiance` | *Death and Defiance* | collection | ? | 2014 | `ssot-hh-015` | `?` | — |
| HH-0144 | `blades-of-the-traitor` | *Blades of the Traitor* | collection | ? | 2015 | `ssot-hh-015` | `?` | — |
| HH-0145 | `meduson` | *Meduson* | collection | ? | 2015 | `ssot-hh-015` | `?` | `low_confidence:locations` |
| HH-0146 | `betrayal-at-calth` | *Betrayal at Calth* | collection | ? | 2015 | `ssot-hh-015` | `?` | — |
| HH-0147 | `echoes-of-imperium` | *Echoes of Imperium* | collection | ? | 2016 | `ssot-hh-015` | `?` | `low_confidence:factions` |
| HH-0148 | `virtues-of-the-sons-sins-of-the-father` | *Virtues of the Sons/Sins of the Father* | collection | Andy Smillie | 2016 | `ssot-hh-015` | `?` | — |
| HH-0149 | `echoes-of-revelation` | *Echoes of Revelation* | collection | ? | 2017 | `ssot-hh-015` | `?` | — |
| HH-0150 | `blood-games` | *Blood Games* | short_story | Dan Abnett | 2009 | `ssot-hh-015` | `?` | — |
| HH-0151 | `wolf-at-the-door` | *Wolf at the Door* | short_story | Mike Lee | 2009 | `ssot-hh-016` | `?` | — |
| HH-0152 | `scions-of-the-storm` | *Scions of the Storm* | short_story | Anthony Reynolds | 2009 | `ssot-hh-016` | `?` | — |
| HH-0153 | `the-voice` | *The Voice* | short_story | James Swallow | 2009 | `ssot-hh-016` | `?` | — |
| HH-0154 | `call-of-the-lion` | *Call of the Lion* | short_story | Gav Thorpe | 2009 | `ssot-hh-016` | `?` | — |
| HH-0155 | `the-last-church` | *The Last Church* | short_story | Graham McNeill | 2009 | `ssot-hh-016` | `?` | — |
| HH-0156 | `after-deshea` | *After Desh'ea* | short_story | Matthew Farrer | 2009 | `ssot-hh-016` | `?` | — |
| HH-0157 | `rules-of-engagement` | *Rules of Engagement* | short_story | Graham McNeill | 2011 | `ssot-hh-016` | `?` | — |
| HH-0158 | `liars-due` | *Liar's Due* | short_story | James Swallow | 2011 | `ssot-hh-016` | `?` | — |
| HH-0159 | `forgotten-sons` | *Forgotten Sons* | short_story | Nick Kyme | 2011 | `ssot-hh-016` | `?` | — |
| HH-0160 | `the-last-remembrancer` | *The Last Remembrancer* | short_story | John French | 2011 | `ssot-hh-016` | `?` | — |
| HH-0161 | `rebirth` | *Rebirth* | short_story | Chris Wraight | 2011 | `ssot-hh-017` | `?` | — |
| HH-0162 | `the-face-of-treachery` | *The Face of Treachery* | short_story | Gav Thorpe | 2011 | `ssot-hh-017` | `?` | — |
| HH-0163 | `little-horus` | *Little Horus* | short_story | Dan Abnett | 2011 | `ssot-hh-017` | `?` | — |
| HH-0164 | `the-iron-within` | *The Iron Within* | short_story | Rob Sanders | 2011 | `ssot-hh-017` | `?` | — |
| HH-0165 | `savage-weapons` | *Savage Weapons* | short_story | Aaron Dembski-Bowden | 2011 | `ssot-hh-017` | `?` | — |
| HH-0166 | `army-of-one` | *Army of One* | short_story | Rob Sanders | 2012 | `ssot-hh-017` | `?` | `low_confidence:characters` |
| HH-0167 | `kryptos` | *Kryptos* | short_story | Graham McNeill | 2012 | `ssot-hh-017` | `?` | — |
| HH-0168 | `distant-echoes-of-old-night` | *Distant Echoes of Old Night* | short_story | Rob Sanders | 2012 | `ssot-hh-017` | `?` | — |
| HH-0169 | `lost-sons` | *Lost Sons* | short_story | James Swallow | 2012 | `ssot-hh-017` | `?` | — |
| HH-0170 | `death-of-a-silversmith` | *Death of a Silversmith* | short_story | Graham McNeill | 2012 | `ssot-hh-017` | `?` | `low_confidence:characters` |
| HH-0171 | `the-divine-word` | *The Divine Word* | short_story | Gav Thorpe | 2012 | `ssot-hh-018` | `?` | — |
| HH-0172 | `the-kaban-project` | *The Kaban Project* | short_story | Graham McNeill | 2013 | `ssot-hh-018` | `?` | — |
| HH-0173 | `the-gates-of-terra` | *The Gates of Terra* | short_story | Nick Kyme | 2013 | `ssot-hh-018` | `?` | — |
| HH-0174 | `lord-of-the-red-sands` | *Lord of the Red Sands* | short_story | Aaron Dembski-Bowden | 2013 | `ssot-hh-018` | `?` | — |
| HH-0175 | `serpent` | *Serpent* | short_story | John French | 2013 | `ssot-hh-018` | `?` | — |
| HH-0176 | `luna-mendax` | *Luna Mendax* | short_story | Graham McNeill | 2013 | `ssot-hh-018` | `?` | — |
| HH-0177 | `riven` | *Riven* | short_story | John French | 2013 | `ssot-hh-018` | `?` | — |
| HH-0178 | `bjorn-lone-wolf` | *Bjorn: Lone Wolf* | short_story | Chris Wraight | 2013 | `ssot-hh-018` | `?` | — |
| HH-0179 | `the-wolf-of-ash-and-fire` | *The Wolf of Ash and Fire* | short_story | Graham McNeill | 2014 | `ssot-hh-018` | `?` | — |
| HH-0180 | `heart-of-the-conqueror` | *Heart of the Conqueror* | short_story | Aaron Dembski-Bowden | 2014 | `ssot-hh-018` | `?` | — |
| HH-0181 | `child-of-night` | *Child of Night* | short_story | John French | 2014 | `ssot-hh-019` | `?` | — |
| HH-0182 | `the-devine-adoratrice` | *The Devine Adoratrice* | short_story | Graham McNeill | 2014 | `ssot-hh-019` | `?` | — |
| HH-0183 | `daemonology` | *Daemonology* | short_story | Chris Wraight | 2014 | `ssot-hh-019` | `?` | — |
| HH-0184 | `sins-of-the-father` | *Sins of the Father* | short_story | Andy Smillie | 2014 | `ssot-hh-019` | `?` | — |
| HH-0185 | `the-final-compliance-of-sixty-three-fourteen` | *The Final Compliance of Sixty-Three Fourteen* | short_story | Guy Haley | 2014 | `ssot-hh-019` | `?` | — |
| HH-0186 | `vorax` | *Vorax* | short_story | Matthew Farrer | 2014 | `ssot-hh-019` | `?` | `low_confidence:characters` |
| HH-0187 | `the-value-of-fear` | *The Value of Fear* | short_story | Gav Thorpe | 2014 | `ssot-hh-019` | `?` | — |
| HH-0188 | `brotherhood-of-the-moon` | *Brotherhood of the Moon* | short_story | Chris Wraight | 2014 | `ssot-hh-019` | `?` | — |
| HH-0189 | `virtues-of-the-sons` | *Virtues of the Sons* | short_story | Andy Smillie | 2015 | `ssot-hh-019` | `?` | — |
| HH-0190 | `imperfect` | *Imperfect* | short_story | Nick Kyme | 2015 | `ssot-hh-019` | `?` | — |
| HH-0191 | `howl-of-the-hearthworld` | *Howl of the Hearthworld* | short_story | Aaron Dembski-Bowden | 2015 | `ssot-hh-020` | `?` | — |
| HH-0192 | `a-safe-and-shadowed-place` | *A Safe and Shadowed Place* | short_story | Guy Haley | 2015 | `ssot-hh-020` | `?` | `low_confidence:characters` |
| HH-0193 | `gunsight` | *Gunsight* | short_story | James Swallow | 2015 | `ssot-hh-020` | `?` | — |
| HH-0194 | `black-oculus` | *Black Oculus* | short_story | John French | 2015 | `ssot-hh-020` | `?` | `low_confidence:characters` |
| HH-0195 | `wolf-mother` | *Wolf Mother* | short_story | Graham McNeill | 2015 | `ssot-hh-020` | `?` | — |
| HH-0196 | `twisted` | *Twisted* | short_story | Guy Haley | 2015 | `ssot-hh-020` | `?` | — |
| HH-0197 | `chirurgeon` | *Chirurgeon* | short_story | Nick Kyme | 2015 | `ssot-hh-020` | `?` | `low_confidence:locations` |
| HH-0198 | `tallarn-witness` | *Tallarn: Witness* | short_story | John French | 2015 | `ssot-hh-020` | `?` | — |
| HH-0199 | `ironfire` | *Ironfire* | short_story | Rob Sanders | 2015 | `ssot-hh-020` | `?` | — |
| HH-0200 | `hands-of-the-emperor` | *Hands of the Emperor* | short_story | Rob Sanders | 2015 | `ssot-hh-020` | `?` | — |

## 3. Surface-form aggregate (sorted: freq desc, name asc)

### Factions (35 distinct surface forms, 131 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Sons of Horus | 11 | HH-0142, HH-0143, HH-0144 | direct | sons_of_horus | `?` |
| Emperor's Children | 8 | HH-0142, HH-0143, HH-0144 | direct | emperors_children | `?` |
| Imperial Fists | 8 | HH-0143, HH-0160, HH-0168 | direct | imperial_fists | `?` |
| World Eaters | 8 | HH-0142, HH-0143, HH-0148 | direct | world_eaters | `?` |
| Iron Hands | 7 | HH-0142, HH-0143, HH-0145 | direct | iron_hands | `?` |
| Raven Guard | 7 | HH-0145, HH-0147, HH-0149 | direct | raven_guard | `?` |
| Ultramarines | 7 | HH-0141, HH-0146, HH-0147 | direct | ultramarines | `?` |
| Blood Angels | 6 | HH-0143, HH-0147, HH-0148 | direct | blood_angels | `?` |
| Iron Warriors | 6 | HH-0144, HH-0159, HH-0164 | direct | iron_warriors | `?` |
| Night Lords | 6 | HH-0142, HH-0143, HH-0165 | direct | night_lords | `?` |
| Alpha Legion | 5 | HH-0141, HH-0149, HH-0158 | direct | alpha_legion | `?` |
| Space Wolves | 5 | HH-0142, HH-0143, HH-0151 | direct | space_wolves | `?` |
| Word Bearers | 5 | HH-0141, HH-0146, HH-0152 | direct | word_bearers | `?` |
| Salamanders | 4 | HH-0141, HH-0142, HH-0145 | direct | salamanders | `?` |
| White Scars | 4 | HH-0141, HH-0144, HH-0163 | direct | white_scars | `?` |
| Dark Angels | 3 | HH-0142, HH-0154, HH-0165 | direct | dark_angels | `?` |
| Death Guard | 3 | HH-0144, HH-0168, HH-0183 | direct | death_guard | `?` |
| Officio Assassinorum | 3 | HH-0143, HH-0166, HH-0193 | direct | officio_assassinorum | `?` |
| Adeptus Custodes | 2 | HH-0150, HH-0200 | direct | custodes | `?` |
| Crusader Host | 2 | HH-0176, HH-0177 | unresolved | — | `?` |
| Imperial Army | 2 | HH-0149, HH-0198 | alias | astra_militarum | `?` |
| Luna Wolves | 2 | HH-0179, HH-0188 | alias | sons_of_horus | `?` |
| Mechanicum | 2 | HH-0172, HH-0186 | alias | mechanicus | `?` |
| Navis Nobilite | 2 | HH-0180, HH-0194 | direct | navis_nobilite | `?` |
| Serpent Cult | 2 | HH-0182, HH-0195 | unresolved | — | `?` |
| Thousand Sons | 2 | HH-0141, HH-0161 | direct | thousand_sons | `?` |
| Dark Eldar | 1 | HH-0151 | alias | eldar | `?` |
| Dark Mechanicum | 1 | HH-0186 | direct | dark_mechanicum | `?` |
| Davinite Lodge | 1 | HH-0196 | unresolved | — | `?` |
| Davinite Serpent Lodge | 1 | HH-0175 | unresolved | — | `?` |
| House Devine | 1 | HH-0182 | direct | house_devine | `?` |
| Knights Errant | 1 | HH-0195 | direct | knights_errant | `?` |
| Orks | 1 | HH-0179 | direct | orks | `?` |
| Sisters of Silence | 1 | HH-0153 | alias | talons_of_the_emperor | `?` |
| Therion Cohort | 1 | HH-0171 | unresolved | — | `?` |

### Locations (51 distinct surface forms, 74 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Terra | 9 | HH-0143, HH-0150, HH-0155 | direct | terra | `?` |
| Calth | 3 | HH-0146, HH-0149, HH-0157 | direct | calth | `?` |
| Davin | 3 | HH-0141, HH-0175, HH-0196 | direct | davin | `?` |
| Isstvan V | 3 | HH-0142, HH-0162, HH-0177 | alias | istvaan_v | `?` |
| Vengeful Spirit | 3 | HH-0170, HH-0193, HH-0196 | direct | vengeful_spirit | `?` |
| Imperial Palace | 2 | HH-0191, HH-0200 | direct | imperial_palace | `?` |
| Macragge | 2 | HH-0143, HH-0147 | direct | macragge | `?` |
| Mars | 2 | HH-0172, HH-0186 | direct | mars | `?` |
| Nuceria | 2 | HH-0174, HH-0180 | direct | nuceria | `?` |
| Tallarn | 2 | HH-0144, HH-0198 | direct | tallarn | `?` |
| Terathalion | 2 | HH-0144, HH-0183 | unresolved | — | `?` |
| Ultramar | 2 | HH-0157, HH-0192 | direct | ultramar | `?` |
| Aegis sector | 1 | HH-0165 | unresolved | — | `?` |
| Ardent Reef | 1 | HH-0173 | unresolved | — | `?` |
| Astagar | 1 | HH-0141 | unresolved | — | `?` |
| Atlas | 1 | HH-0147 | unresolved | — | `?` |
| Baal | 1 | HH-0169 | direct | baal | `?` |
| Bastion | 1 | HH-0159 | unresolved | — | `?` |
| Beta-Garmon | 1 | HH-0149 | direct | beta_garmon | `?` |
| Byzanthis | 1 | HH-0154 | unresolved | — | `?` |
| Caliban | 1 | HH-0176 | direct | caliban | `?` |
| Chogoris | 1 | HH-0141 | direct | chogoris | `?` |
| Desh'ea | 1 | HH-0156 | direct | deshea | `?` |
| Diamat | 1 | HH-0199 | direct | diamat | `?` |
| Dwell | 1 | HH-0163 | unresolved | — | `?` |
| Euphoros | 1 | HH-0199 | unresolved | — | `?` |
| Eye of Terror | 1 | HH-0194 | direct | eye_of_terror | `?` |
| Forty-Seven Sixteen | 1 | HH-0152 | unresolved | — | `?` |
| Gorro | 1 | HH-0179 | unresolved | — | `?` |
| Goughen | 1 | HH-0185 | unresolved | — | `?` |
| Hy Brasil | 1 | HH-0150 | unresolved | — | `?` |
| Iron Blood | 1 | HH-0194 | unresolved | — | `?` |
| Isstvan III | 1 | HH-0174 | alias | istvaan_iii | `?` |
| Kernunnos | 1 | HH-0151 | unresolved | — | `?` |
| Lesser Damantyne | 1 | HH-0164 | unresolved | — | `?` |
| Luna | 1 | HH-0176 | direct | luna | `?` |
| Molech | 1 | HH-0182 | direct | molech | `?` |
| Molech's Enlightenment | 1 | HH-0195 | unresolved | — | `?` |
| Monarchia | 1 | HH-0152 | direct | monarchia | `?` |
| Prospero | 1 | HH-0161 | direct | prospero | `?` |
| Proxima Apocryphis | 1 | HH-0166 | unresolved | — | `?` |
| Ring of Iron | 1 | HH-0186 | unresolved | — | `?` |
| Schadenhold | 1 | HH-0164 | unresolved | — | `?` |
| Signus Cluster | 1 | HH-0169 | unresolved | — | `?` |
| Sol System | 1 | HH-0160 | direct | sol_system | `?` |
| Sotha | 1 | HH-0192 | direct | sotha | `?` |
| Titan | 1 | HH-0160 | unresolved | — | `?` |
| Tizca | 1 | HH-0161 | direct | tizca | `?` |
| Tsagualsa | 1 | HH-0165 | direct | tsagualsa | `?` |
| Velbayne | 1 | HH-0178 | unresolved | — | `?` |
| Virger-Mos II | 1 | HH-0158 | unresolved | — | `?` |

### Characters (106 distinct surface forms, 153 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Malcador the Sigillite | 6 | HH-0166, HH-0169, HH-0173 | direct | malcador_the_sigillite | `?` |
| Sanguinius | 6 | HH-0143, HH-0147, HH-0148 | direct | sanguinius | `?` |
| Azkaellon | 5 | HH-0143, HH-0147, HH-0148 | direct | azkaellon | `?` |
| Khârn | 5 | HH-0142, HH-0143, HH-0148 | alias | kharn_the_betrayer | `?` |
| Rogal Dorn | 5 | HH-0143, HH-0160, HH-0173 | direct | rogal_dorn | `?` |
| Horus Lupercal | 4 | HH-0172, HH-0179, HH-0193 | alias | horus | `?` |
| Lucius | 4 | HH-0142, HH-0143, HH-0148 | alias | lucius_the_eternal | `?` |
| Angron | 3 | HH-0156, HH-0174, HH-0180 | direct | angron | `?` |
| Fabius Bile | 3 | HH-0144, HH-0190, HH-0197 | direct | fabius_bile | `?` |
| Amit | 2 | HH-0143, HH-0148 | direct | amit | `?` |
| Arcadese | 2 | HH-0159, HH-0173 | unresolved | — | `?` |
| Bjorn | 2 | HH-0142, HH-0178 | direct | bjorn | `?` |
| Corax | 2 | HH-0149, HH-0162 | direct | corax | `?` |
| Ferrus Manus | 2 | HH-0143, HH-0190 | direct | ferrus_manus | `?` |
| Fulgrim | 2 | HH-0143, HH-0190 | direct | fulgrim | `?` |
| Garviel Loken | 2 | HH-0163, HH-0176 | direct | garviel_loken | `?` |
| Horus | 2 | HH-0142, HH-0143 | direct | horus | `?` |
| Idriss Krendl | 2 | HH-0164, HH-0199 | direct | idriss_krendl | `?` |
| Maloghurst | 2 | HH-0144, HH-0196 | unresolved | — | `?` |
| Marcus Valerius | 2 | HH-0149, HH-0171 | unresolved | — | `?` |
| Mortarion | 2 | HH-0144, HH-0183 | direct | mortarion | `?` |
| Nassir Amit | 2 | HH-0184, HH-0189 | unresolved | — | `?` |
| Perturabo | 2 | HH-0194, HH-0199 | direct | perturabo | `?` |
| Shadrak Meduson | 2 | HH-0145, HH-0163 | direct | shadrak_meduson | `?` |
| Abelard Devine | 1 | HH-0182 | unresolved | — | `?` |
| Alajos | 1 | HH-0165 | unresolved | — | `?` |
| Alivia Sureka | 1 | HH-0195 | direct | alivia_sureka | `?` |
| Amendera Kendel | 1 | HH-0153 | direct | amendera_kendel | `?` |
| Amon Tauromachian | 1 | HH-0150 | unresolved | — | `?` |
| Andras | 1 | HH-0151 | unresolved | — | `?` |
| Arkad | 1 | HH-0169 | unresolved | — | `?` |
| Arvida | 1 | HH-0141 | unresolved | — | `?` |
| Ashel | 1 | HH-0187 | unresolved | — | `?` |
| Barabas Dantioch | 1 | HH-0164 | direct | barabas_dantioch | `?` |
| Belath | 1 | HH-0154 | unresolved | — | `?` |
| Branne Nev | 1 | HH-0162 | direct | branne_nev | `?` |
| Bulveye | 1 | HH-0151 | unresolved | — | `?` |
| Cebella | 1 | HH-0182 | unresolved | — | `?` |
| Chamell | 1 | HH-0147 | unresolved | — | `?` |
| Constantin Valdor | 1 | HH-0200 | direct | constantin_valdor | `?` |
| Corswain | 1 | HH-0165 | unresolved | — | `?` |
| Crius | 1 | HH-0177 | unresolved | — | `?` |
| Cypher | 1 | HH-0142 | direct | cypher | `?` |
| Cyprian Devine | 1 | HH-0182 | unresolved | — | `?` |
| Dallon Prael | 1 | HH-0158 | unresolved | — | `?` |
| Dreagher | 1 | HH-0156 | unresolved | — | `?` |
| Eidolon | 1 | HH-0149 | direct | eidolon | `?` |
| Enobar Stentonox | 1 | HH-0200 | unresolved | — | `?` |
| Erebus | 1 | HH-0152 | direct | erebus | `?` |
| Eristede Kell | 1 | HH-0193 | direct | eristede_kell | `?` |
| Fel Zharost | 1 | HH-0181 | unresolved | — | `?` |
| Grael Noctua | 1 | HH-0163 | unresolved | — | `?` |
| Hastur Sejanus | 1 | HH-0170 | unresolved | — | `?` |
| Heka'tan | 1 | HH-0159 | unresolved | — | `?` |
| Henricos | 1 | HH-0163 | unresolved | — | `?` |
| Hibou Khan | 1 | HH-0163 | unresolved | — | `?` |
| Horus Aximand | 1 | HH-0163 | direct | horus_aximand | `?` |
| Iacton Qruze | 1 | HH-0160 | direct | iacton_qruze | `?` |
| Jaghatai Khan | 1 | HH-0188 | direct | jaghatai_khan | `?` |
| John Grammaticus | 1 | HH-0149 | direct | john_grammaticus | `?` |
| Kaban Machine | 1 | HH-0172 | unresolved | — | `?` |
| Kargir | 1 | HH-0191 | unresolved | — | `?` |
| Kharn | 1 | HH-0156 | alias | kharn_the_betrayer | `?` |
| Konrad Curze | 1 | HH-0165 | direct | konrad_curze | `?` |
| Kurtha Sedd | 1 | HH-0146 | direct | kurtha_sedd | `?` |
| Leilani Mollitas | 1 | HH-0153 | unresolved | — | `?` |
| Leman Russ | 1 | HH-0178 | direct | leman_russ | `?` |
| Leon Kyyter | 1 | HH-0158 | unresolved | — | `?` |
| Lermenta | 1 | HH-0183 | unresolved | — | `?` |
| Letae | 1 | HH-0193 | unresolved | — | `?` |
| Lion El'Jonson | 1 | HH-0165 | direct | lion_el_jonson | `?` |
| Lorgar Aurelian | 1 | HH-0180 | alias | lorgar | `?` |
| Lukas Chrom | 1 | HH-0172 | unresolved | — | `?` |
| Lyx | 1 | HH-0182 | unresolved | — | `?` |
| Mayder Oquin | 1 | HH-0185 | unresolved | — | `?` |
| Mendacs | 1 | HH-0158 | unresolved | — | `?` |
| Menes Kalliston | 1 | HH-0161 | unresolved | — | `?` |
| Merir Astelan | 1 | HH-0154 | unresolved | — | `?` |
| Murnau | 1 | HH-0168 | unresolved | — | `?` |
| Nisha Andrasta | 1 | HH-0180 | unresolved | — | `?` |
| Nykona Sharrowkyn | 1 | HH-0167 | unresolved | — | `?` |
| Oll Persson | 1 | HH-0149 | direct | oll_persson | `?` |
| Pallas Ravachol | 1 | HH-0172 | unresolved | — | `?` |
| Persephia | 1 | HH-0159 | unresolved | — | `?` |
| Raeven Devine | 1 | HH-0182 | unresolved | — | `?` |
| Revuel Arvida | 1 | HH-0161 | unresolved | — | `?` |
| Roboute Guilliman | 1 | HH-0157 | direct | roboute_guilliman | `?` |
| Sabik Wayland | 1 | HH-0167 | unresolved | — | `?` |
| Sevatar | 1 | HH-0165 | direct | sevatar | `?` |
| Severian | 1 | HH-0195 | direct | severian | `?` |
| Sheng | 1 | HH-0165 | unresolved | — | `?` |
| Silas Cincade | 1 | HH-0158 | unresolved | — | `?` |
| Solomon Voss | 1 | HH-0160 | unresolved | — | `?` |
| Sor Talgron | 1 | HH-0152 | direct | sor_talgron | `?` |
| Steloc Aethon | 1 | HH-0146 | direct | steloc_aethon | `?` |
| Susada Syn | 1 | HH-0198 | unresolved | — | `?` |
| Tarik Torgaddon | 1 | HH-0176 | direct | tarik_torgaddon | `?` |
| The Emperor | 1 | HH-0155 | direct | the_emperor | `?` |
| The Emperor of Mankind | 1 | HH-0179 | unresolved | — | `?` |
| Thoros | 1 | HH-0175 | unresolved | — | `?` |
| Torghun Khan | 1 | HH-0188 | unresolved | — | `?` |
| Tylos Rubio | 1 | HH-0169 | direct | tylos_rubio | `?` |
| Uriah Olathaire | 1 | HH-0155 | direct | uriah_olathaire | `?` |
| Ventanus | 1 | HH-0157 | unresolved | — | `?` |
| Vorkellen | 1 | HH-0159 | unresolved | — | `?` |
| Vulkan | 1 | HH-0141 | direct | vulkan | `?` |

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
| HH-0145 | *Meduson* | `low_confidence:locations` |
| HH-0147 | *Echoes of Imperium* | `low_confidence:factions` |
| HH-0166 | *Army of One* | `low_confidence:characters` |
| HH-0170 | *Death of a Silversmith* | `low_confidence:characters` |
| HH-0186 | *Vorax* | `low_confidence:characters` |
| HH-0192 | *A Safe and Shadowed Place* | `low_confidence:characters` |
| HH-0194 | *Black Oculus* | `low_confidence:characters` |
| HH-0197 | *Chirurgeon* | `low_confidence:locations` |

## 7. Cross-batch alias-consolidation + needs-decision candidates

> The only LLM-synthesized section. It flags (7a) cross-form alias-consolidation cases the
> owning phase must collapse onto an existing canonical row (runbook §4) — this wave finds **four
> character alias cases** the Pass-12 anchor chain didn't catch (`Maloghurst` short-form ↔ the
> Pass-10 `maloghurst_the_twisted` row; `Nassir Amit` full-form ↔ the existing `amit` row;
> `Revuel Arvida` full-form needs a new row paired with `Arvida` short-form alias; `The Emperor
> of Mankind` with leading "The" ↔ the Pass-10 `the_emperor` row); (7b) the cross-batch character
> spines (two strict-freq-2 this wave: `Marcus Valerius` Therion-Cohort officer + `Arcadese`
> Ultramarine spine); (7c) the freq-driven promotion shape per axis, dominated by the
> **Heresy-novella supporting-cast freq-1 tail** on the character axis and the **mid-Heresy
> vessel / sub-locale promotion bloc** on the location axis; (7d) genuine needs-decision
> candidates (mostly grain calls — Davinite-Lodge vs Davinite-Serpent-Lodge identity, Signus
> Cluster region-vs-system grain, Therion Cohort sub-faction grain). The Brief-091 forward-ref
> Guard concern is resolved (Brief 101); Pass-13 expects the cleanest Guard outcome yet (no
> roster-collection anthologies in the wave per §5 — the five anthologies are e-anthologies whose
> constituents are not roster-tracked separately). Everything below is grounded in §2–§6 + the
> Pass-10/11/12 alias / row anchors confirmed in §1 baseline.

### 7a. Cross-batch alias-consolidation cases (→ existing row + alias)

> Format: surface-forms · book-IDs · same entity? · recommendation. These are the cases where a naïve
> implementer would create **two** rows or invent a fresh row instead of aliasing onto an existing
> anchor. Per runbook §4: **one canonical identity = one canonical row; era-/form-specific surface
> forms live in `*-aliases.json`**.

**Factions (Phase 1):**

- **Case A — `Davinite Lodge` ↔ `Davinite Serpent Lodge` ↔ identity question.** `Davinite Lodge`
  (freq 1, HH-0196 *Twisted* — Maloghurst counter-plots Davinite Lodge from inside Vengeful
  Spirit) and `Davinite Serpent Lodge` (freq 1, HH-0175 *Serpent* — Davinite cult vignette
  around the priest Thoros) are **both pre-Heresy Davin Serpent-Lodge surface forms**. The
  *Serpent* loop-log explicitly: "surface form **Davinite Serpent Lodge** kept verbatim (no
  canonical-resolver hop); Word Bearers deliberately *not* listed because they do not appear
  on-page even though they later co-opt the lodge". The *Twisted* surface drops the "Serpent"
  qualifier but refers to the same cult (the same lodge Erebus uses in *False Gods* HH-0002 to
  corrupt Horus). **Phase-1 judgment: are these one identity (alias-consolidate) or two grains
  of the same cult, distinct enough that the Davinite-Lodge umbrella holds inner sub-Lodges?**
  Recommendation: **leave both unresolved** until Phase 1 decides — there is no existing anchor
  for either form (no `davinite_lodge` row in baseline), and creating one or two new rows is
  itself the Phase-1 decision. Per runbook §4: surface-form-treue holds in the override; the
  resolution is the alias-or-row call. **Not a hard block** — Phase-1 either promotes one row
  `davinite_lodge` + alias `Davinite Serpent Lodge → davinite_lodge` (recommended, simpler
  grain) or leaves both unresolved long-tail. Two separate rows is the third option but
  unmotivated by current evidence.

**Characters (Phase 3) — short-form / full-form / longer-variant consolidations:**

- **Case B — `Maloghurst` ↔ `maloghurst_the_twisted` (canonical, Pass-10-anchored).**
  `Maloghurst` (freq 2 cross-batch — HH-0144 *Blades of the Traitor* / HH-0196 *Twisted*,
  unresolved in §3) is the **short-form bare name** of the Pass-10-anchored
  `Maloghurst the Twisted` (Sons of Horus equerry, Horus's twisted right-hand counter-plotter).
  Same person; the bare-form surface is what the Pass-13 override authors used in both books.
  → **alias `Maloghurst → maloghurst_the_twisted`** in `character-aliases.json`. Pattern-parallel
  to Pass-12 Case B (`Typhon → typhus`) and the Pass-10 `Little Horus Aximand → horus_aximand`
  alias chain (anchor the long-form first, alias the short-form when it surfaces in later
  waves). No row edit. **Cross-batch freq 2** — the strongest alias case of the wave.
- **Case C — `Nassir Amit` ↔ `amit` (canonical, pre-Pass-10 row).** `Nassir Amit` (freq 2
  cross-batch — HH-0184 *Sins of the Father* / HH-0189 *Virtues of the Sons*, both Andy
  Smillie Blood-Angels duels, unresolved in §3) is the **full-name canonical form** of the
  pre-Pass-10 `amit` row (Blood Angels — Nassir Amit, the future Flesh-Tearers Chapter Master,
  who duels Khârn in *Virtues of the Sons*). The same character also surfaces direct as `Amit`
  (freq 2 — HH-0143 *Death and Defiance* / HH-0148 *Virtues of the Sons/Sins of the Father*)
  on the pre-Pass-10 row. Same person; existing slug is the short form (per pre-Pass-10
  convention). Per runbook §4: surface-form-treue + longer-form-canonical is the **preferred
  pattern** going forward (parity with `branne_nev` + `Branne` alias, `targutai_yesugei` +
  `Yesugei` alias, `barabas_dantioch` + `Dantioch` alias). The existing row, however, is
  `amit` (short). The cleanest call here is the **mirror direction**: keep the existing
  `amit` slug as anchor and add **alias `Nassir Amit → amit`** — the row was created before
  the long-form-canonical convention crystallized and renaming a stable canonical-id mid-arc is
  out of scope for an alias pass (would require row-id migration + downstream junction
  re-resolve). No row edit; just the alias. Phase-3 may instead `## Needs decision` if it
  wants to discuss row-renaming — recommendation **stands at alias-only** for budget
  conservatism. (Phase-3 should note this in its impl-report as a deferred row-rename
  candidate; a future consolidation pass may renormalize `amit → nassir_amit` if a wider sweep
  is run.)
- **Case D — `Revuel Arvida` ↔ `Arvida` (no canonical row — new row + alias).** `Revuel Arvida`
  (freq 1, HH-0161 *Rebirth* — Thousand Sons psyker, escaping Tizca after Prospero with the
  "knowledge is power" closing line) and `Arvida` (freq 1, HH-0141 *Sedition's Gate* — same
  Thousand Sons psyker as a Shattered-Legions ally) are **two surface forms of the same
  character** (the Pass-13 wave produces the first canonical surfaces of this figure). No
  existing row in baseline. → **new row `revuel_arvida`** + **alias `Arvida → revuel_arvida`**
  in `character-aliases.json` (longer-form-canonical pattern per runbook §4 — parity with
  `branne_nev` + `Branne`, `barabas_dantioch` + `Dantioch`, `targutai_yesugei` + `Yesugei`).
  primaryFactionId `thousand_sons` (exists, direct §3). Cross-batch evidence holds (the two
  surface forms come from different batches — HH-0141 in ssot-hh-015, HH-0161 in ssot-hh-017),
  passing the strict freq-2-via-alias-consolidation rule per the Pass-11 `targutai_yesugei`
  precedent.
- **Case E — `The Emperor of Mankind` ↔ `the_emperor` (canonical, Pass-10-anchored).** `The
  Emperor of Mankind` (freq 1, HH-0179 *The Wolf of Ash and Fire* — Russ + son
  Great-Crusade-era flavor, unresolved in §3) is a **longer-variant surface form** of the
  Pass-10 `the_emperor` row. The Pass-11 alias file already carries `Emperor of Mankind →
  the_emperor` (without leading "The"); this wave adds the leading-"The" variant. Same
  person, same row. → **alias `The Emperor of Mankind → the_emperor`** in
  `character-aliases.json`. Pattern-parallel to the existing `Emperor of Mankind` alias —
  surface-form-treue keeps the leading "The" as authored, resolution lands on the same row.
  No row edit.

**Locations (Phase 2):**

- *(No alias-consolidation cases this wave for the location axis.)* All resolved location
  surfaces this wave catch on existing rows direct or via existing Pass-N aliases (Isstvan V
  / Isstvan III via the long-established Istvaan aliases, Terra / Macragge / Mars / Tallarn /
  Nuceria / Ultramar / Calth / Davin / Vengeful Spirit / Imperial Palace / Sol System / Baal /
  Beta-Garmon / Caliban / Chogoris / Desh'ea / Diamat / Eye of Terror / Luna / Molech /
  Monarchia / Prospero / Sotha / Tizca / Tsagualsa all direct on baseline rows). The
  location-axis cross-batch consolidation question this wave puts on Phase 2 is the
  **`Signus Cluster` ↔ `signus_prime`** region-vs-world grain question (see 7d), not a
  forced alias case.

**Confirmations only (already-aliased / already-direct from Pass 10–12 — no Phase-N action):**

The following surface forms surface in this wave with `alias` or `direct` status because
Pass-10/11/12 already landed the anchor + alias. No alias-file edit needed; listed only to make
the Cross-Era / Pass-10–12-handoff chain explicit:

- **Factions:** `Sons of Horus` (direct, **11 hits** this wave — the post-Davin name is now the
  universal default in the wave's override authoring), `Luna Wolves → sons_of_horus` (Pass-10
  alias, **2 hits** this wave — HH-0179 + HH-0188; the Pass-11 cross-rename anchor is
  exhaustively confirmed), `Imperial Army → astra_militarum` (Pass-10 alias, **2 hits** —
  HH-0149/HH-0198), `Mechanicum → mechanicus` (Pass-10 alias, **2 hits** — HH-0172/HH-0186),
  `Sisters of Silence → talons_of_the_emperor` (Pass-10 alias, 1 hit — HH-0153), `Dark Eldar →
  eldar` (pre-Pass-10 alias, 1 hit — HH-0151), `Knights Errant` (direct on the Pass-11 row, 1
  hit — HH-0195). The Pass-10/11/12 era-rename chain on the faction axis catches every
  re-surface in this wave.
- **Characters:** `Khârn → kharn_the_betrayer` (pre-Pass-10 alias, **5 hits** — HH-0142 /
  HH-0143 / HH-0148 / HH-0161 / HH-0189; the highest-frequency alias of the wave), `Kharn →
  kharn_the_betrayer` (pre-Pass-10 alias, 1 hit — HH-0156 *After Desh'ea*), `Horus Lupercal →
  horus` (Pass-11 alias, **4 hits** — HH-0172 / HH-0179 / HH-0193 / HH-0196), `Lucius →
  lucius_the_eternal` (pre-Pass-10 alias, **4 hits** — HH-0142 / HH-0143 / HH-0148 / HH-0189),
  `Lorgar Aurelian → lorgar` (Pass-11 alias, 1 hit — HH-0180). Pass-12 closed the bulk of the
  Cross-Era / honor-title-split work; this wave's only **new** short-form / longer-variant
  alias cases are Case B (`Maloghurst`), Case D-companion (`Arvida`), and Case E (`The Emperor
  of Mankind`). Case C is full-form-to-existing-short-canonical (deferred row-rename, noted in
  Phase-3 report).
- **Direct chain — all named Primarchs catch on Pass-10/11/12 rows.** Every named Primarch in
  this wave catches its bare-name surface form direct on the Pass-10/11/12 canonical row:
  Sanguinius (6 — Pass-11 row), Rogal Dorn (5), Angron (3 — note also surfaces with the bare
  name plus arc-context: pre-Imperium slave, World-Eaters Primarch, fall-to-Chaos POV),
  Corax (2), Ferrus Manus (2), Fulgrim (2), Horus (2 bare-form direct + 4 Horus-Lupercal-alias
  = cumulative 6 surfaces), Mortarion (2), Perturabo (2 — Pass-11 row), Konrad Curze (1 —
  Pass-11 row), Leman Russ (1 — Pass-11 row), Lion El'Jonson (1 — Pass-11 row), Jaghatai Khan
  (1 — Pass-11 row), Roboute Guilliman (1), Vulkan (1), plus `Lorgar` via Lorgar-Aurelian
  alias (1) — every named Primarch except Alpharius (no surface this wave) is direct. **The
  Primarch coverage is exhaustive** for both the Pass-13 wave and every prior HH wave; this
  matches the Pass-12 milestone forecast.
- **Direct chain — supporting cast:** `Garviel Loken` (Pass-11 row, freq 2 — HH-0163 /
  HH-0176), `Shadrak Meduson` (Pass-11 row, freq 2 — HH-0145 / HH-0163), `Idriss Krendl`
  (Pass-9 row, freq 2 — HH-0164 / HH-0199), `Bjorn` (Pass-11 row, freq 2 — HH-0142 / HH-0178),
  `Malcador the Sigillite` (Pass-11 row, freq 6 — HH-0166 / HH-0169 / HH-0173 / HH-0178 / +2),
  `Azkaellon` (Pass-9 row, freq 5 — Blood-Angels duels arc; freq-1 spike in this wave's audio-
  drama anthologies), `Sevatar` (Pass-11 row, freq 1 — HH-0165), `Horus Aximand` (Pass-10 row,
  freq 1 — HH-0163), `Branne Nev` (Pass-10 row, freq 1 — HH-0162), `Erebus` (pre-Pass-10 row,
  freq 1 — HH-0152), `Eidolon` (pre-Pass-10 row, freq 1 — HH-0149), `Cypher` (pre-Pass-10 row,
  freq 1 — HH-0142), `Iacton Qruze` (pre-Pass-10 row, freq 1 — HH-0160), `Tarik Torgaddon`
  (Pass-12 row, freq 1 — HH-0176), `Constantin Valdor` (Pass-11 row, freq 1 — HH-0200),
  `Severian` (Pass-12 row, freq 1 — HH-0195), `Tylos Rubio` (Pass-11 row, freq 1 — HH-0169),
  `Alivia Sureka` (Pass-11 row, freq 1 — HH-0195), `Eristede Kell` (Pass-12 row, freq 1 —
  HH-0193), `John Grammaticus` (Pass-11 row, freq 1 — HH-0149), `Oll Persson` (Pass-11 row,
  freq 1 — HH-0149), `Barabas Dantioch` (Pass-12 row, freq 1 — HH-0164 the namesake debut —
  the surface form here is the full long-form, not the bare `Dantioch` alias — direct match),
  `Kurtha Sedd` + `Steloc Aethon` (Pass-12 7b spines, freq 1 each — HH-0146 *Betrayal at
  Calth*, the very Underworld War novella that motivated their Pass-12 creation; this is the
  clean cross-pass confirmation), `Amit` (pre-Pass-10 row, freq 2 — HH-0143/HH-0148; see Case
  C for the parallel `Nassir Amit` full-form), `Uriah Olathaire` (Pass-? row — McNeill's
  *Last Church* civilian priest debut, freq 1 — HH-0155), `The Emperor` (Pass-10 row, freq 1
  — HH-0155; see Case E for the `The Emperor of Mankind` companion variant). Every freq-2+
  unresolved character spine the Pass-12 dossier projected is now in place; this wave produces
  only **two** new cross-batch spine rows (7b).
- **Direct chain — locations:** `Terra` (9, the highest-frequency surface form of the wave),
  `Calth`, `Davin`, `Vengeful Spirit` (Pass-11 row), `Imperial Palace`, `Macragge`, `Mars`,
  `Nuceria` (Pass-11 row), `Tallarn` (Pass-11 row), `Ultramar`, `Baal`, `Beta-Garmon` (Pass-11
  row), `Caliban`, `Chogoris` (Pass-11 row), `Desh'ea` (Pass-12 row — the namesake debut for
  Pass-13's HH-0156 *After Desh'ea*, the Khârn-Angron-origin novella that motivated the
  Pass-12 promotion), `Diamat`, `Eye of Terror`, `Luna`, `Molech`, `Monarchia`, `Prospero`,
  `Sol System`, `Sotha`, `Tizca`, `Tsagualsa`. The Pass-10/11/12 location chain is exhaustively
  anchored for this wave; the only direct-resolution gaps are the new sub-locale / vessel
  promotions in 7c.

### 7b. Big single-form cross-batch spines (one row each — not alias work)

This wave is **markedly thinner** on cross-batch spines than even Pass-12 — the *Tales of
Heresy* / *Age of Darkness* anthology format produces many distinct one-off supporting cast
across the 60 books, but only **two** spine rows surface twice cross-batch in this wave:

- **`Marcus Valerius` (freq 2 — HH-0149 *Echoes of Revelation* / HH-0171 *The Divine Word*).**
  Therion Cohort officer (the Imperial Army's elite Therion regiment), embedded with Raven
  Guard across both his book surfaces. Loop-log HH-0171: "Therion Cohort POV (Marcus Valerius)
  embedded with Raven Guard". Loop-log HH-0149: "Valerius (Imperial Army/Beta-Garmon under
  Corax)". Lore-anchored Therion Cohort cross-arc figure (the Therion Cohort recurs across
  multiple Heresy short-story locales as the elite Imperial-Army cohort). → **new row
  `marcus_valerius`**. primaryFactionId `astra_militarum` (the existing Imperial-Army
  canonical anchor — Therion Cohort is a regiment-grain sub-faction of Imperial Army that
  Phase 1 may or may not promote separately; see 7c faction-axis Therion Cohort question).
- **`Arcadese` (freq 2 — HH-0159 *Forgotten Sons* / HH-0173 *The Gates of Terra*).**
  Ultramarine supporting figure in two short stories. Loop-log HH-0173: "It's an Ultramarine
  (Arcadese) POV under a Malcador frame, not an Imperial Fists story despite the Terra/Dorn
  dressing". HH-0159 *Forgotten Sons* has Ultramarines + Salamanders ambassadors on Bastion;
  the available coverage attests `Arcadese` as the Ultramarine ambassador POV. **Phase-3
  judgment confirmation needed** — both surface forms must refer to the same character
  (different HH authors / books / settings, but the same Ultramarine-named figure recurring is
  the strict reading). → **new row `arcadese`** (Phase-3 verifies cross-book identity in the
  Phase-3 report; if the identity check fails, leave both unresolved long-tail and `## Needs
  decision`). primaryFactionId `ultramarines` (exists, direct §3).

> Both spines are tight Heresy-supporting-cast rows. The two-novella pair is sufficient
> cross-batch evidence under the strict freq ≥ 2 rule for `marcus_valerius`. For `arcadese`,
> Phase-3 should validate that both HH-0159 and HH-0173 attest the same person — recommendation:
> promote per strict reading + flag the identity in the Phase-3 report.

### 7c. Per-axis promotion shape (freq-driven; owning phase justifies the exact set)

**Factions (Phase 1).** Strict freq ≥ 2 unresolved + curated freq-1 lore-iconic adds.

Strict freq ≥ 2 unresolved:

- **`Crusader Host` (freq 2 — HH-0176 *Luna Mendax* / HH-0177 *Riven*).** A multi-Legion
  Terran delegation organization (the Crusader Host, kept on Terra during the Heresy from
  each loyalist Legion as a hostage / coordination body). Lore-iconic cross-novella surface;
  the *Luna Mendax* / *Riven* novella pair uses it as the framing institution Loken / Crius
  serve under. → **new row `crusader_host`**. primaryFactionId tagging context: this is a
  cross-Legion Imperial-loyalist institution, parent — leave empty or `imperium` per Phase-1
  judgment. **Strict freq-2 promotion case.**
- **`Serpent Cult` (freq 2 — HH-0182 *The Devine Adoratrice* / HH-0195 *Wolf Mother*).** The
  House Devine Serpent Cult on Molech (the chaos-cult side of House Devine's hidden allegiance
  — the cult Alivia Sureka and Severian counter aboard Molech's Enlightenment after the
  Vengeful Spirit's Molech operation). **Distinct from** Case A's Davinite-Lodge / Davinite-
  Serpent-Lodge — that is the **Davin world** Serpent Lodge (Erebus's instrument for Horus's
  corruption); this is the **Molech-Devine** Serpent Cult (House Devine's secret allegiance).
  Two different cults sharing the "Serpent" naming convention, both on different worlds with
  different lore arcs. Per Phase-1 judgment, recommendation: → **new row `serpent_cult`** with
  parent `house_devine` (the existing direct §3 row) — the House-Devine-internal cult is the
  organizational successor / hidden-allegiance arm of House Devine. **Strict freq-2 promotion
  case.** Phase-1 may instead leave unresolved if it wants stricter sub-faction-grain
  conservatism; recommendation stands at promotion.

Curated freq-1 lore-iconic candidates:

- **`Therion Cohort` (freq 1, HH-0171 *The Divine Word*).** Imperial Army elite Therion
  Cohort regiment. Recurring across Heresy-era Imperial-Army shorts (already foreshadowed in
  Pass-12's HH-0093 *Scions of the Emperor* discussion of "Imperial Army formations"). The
  Pass-13 wave produces only one direct Therion-Cohort surface, but the spine character
  (`Marcus Valerius` — 7b new row) places it at the center of Phase-3 attention. Default =
  **new row `therion_cohort`** with parent `astra_militarum` (regiment-grain sub-faction of
  Imperial Army, parallel to the Pass-? regiment rows already in the layer). Phase-1
  judgment if it prefers leaving regiment-grain unresolved until a later freq-2 cross-batch
  surface materializes; recommendation: **promote** given the spine-character link.

> Phase-1 promotion shape (recommended): **0 alias adds** (no new faction-axis aliases this
> wave — all era-rename cases land on Pass-10/11 aliases, Case A is `## Needs decision` or
> a single combined `davinite_lodge` row decision) + **2 strict-freq-2 new rows**
> (`crusader_host`, `serpent_cult`) + **1 curated freq-1 lore-iconic new row**
> (`therion_cohort`) + **0..1 optional Case-A new row** (`davinite_lodge` if Phase-1 takes
> that route). Conservative floor: 2 new rows (the strict-freq-2 set);
> recommended target: 3 new rows (floor + therion_cohort); ceiling: 4 new rows (floor +
> therion_cohort + davinite_lodge). **The lightest Phase-1 promotion pass of the HH arc** —
> matches Pass-12's faction-axis lightness; the *Tales of Heresy* / *Age of Darkness*
> short-story format mostly consumes already-anchored Legions + adds only one new institution
> per novella.

**Locations (Phase 2).** Strict freq ≥ 2 unresolved + curated freq-1 lore-iconic.

Strict freq ≥ 2:

- **`Terathalion` (freq 2 — HH-0144 *Blades of the Traitor* / HH-0183 *Daemonology*).** A
  Heresy-era location, surfacing in both anthology and novella. Per HH-0183 loop-log:
  "Terathalion and Terra both load-bearing (the Malcador interludes are not framing
  decoration)". A specific compliance / warp-locale where Mortarion / Death Guard operate.
  → **new row `terathalion`** (Phase-2 judgment on parent sector — likely `?` initially). **Strict
  freq-2 promotion case.**

Curated freq ≥ 1 lore-iconic — **the mid-Heresy sub-locale / vessel promotion bloc**:

- **`Titan` (freq 1, HH-0160 *The Last Remembrancer*).** Saturn's moon — Sol-System locale,
  the M41 Grey Knights homeworld and Heresy-era Imperial holding (Dorn's execution argument
  staged on Titan in HH-0160). Foundational lore. Default = **new row `titan`** with parent
  `sol_system` (sub-locale grain, parallel to Pass-11's `lions_gate_spaceport` as Terra
  sub-locale or `phobos`/`deimos` as Mars-system sub-locales).
- **`Hy Brasil` (freq 1, HH-0150 *Blood Games*).** Terran hive — Dan Abnett's Custodes
  investigation site. Lore-iconic Terran hive (mythologically named after the legendary Irish
  island; foundational Terran-civilian-scope locale for the Custodes Heresy debut). Default =
  **new row `hy_brasil`** with parent `terra` (Terra sub-locale grain, parallel to existing
  Terran hive / district rows).
- **`Schadenhold` (freq 1, HH-0164 *The Iron Within*).** Iron Warriors loyalist fortress on
  Lesser Damantyne, Barabas Dantioch's stand. Foundational to the Dantioch arc + recurring
  in the broader Iron-Warriors-loyalist sub-thread (cross-arc with HH-0177 *Riven* / Crius
  arc). Default = **new row `schadenhold`** (parent: `lesser_damantyne` if Phase-2 also
  promotes that, or empty parent otherwise). Lore-iconic.
- **`Lesser Damantyne` (freq 1, HH-0164).** Parent world of Schadenhold. Lore-anchored as
  the Iron-Warriors-loyalist outpost world. Default = **new row `lesser_damantyne`**
  (Phase-2 judgment whether to promote alongside Schadenhold or leave as supporting in
  Schadenhold's row only).
- **`Signus Cluster` (freq 1, HH-0169 *Lost Sons*).** Blood-Angels region containing
  `signus_prime` (already a Pass-11 row). The Signus Cluster is the **region containing the
  Signus Prime world** — Blood Angels' fall-to-Signus campaign locus (the "Signus Campaign"
  is the broader region-arc, of which Signus Prime is the world-stage). **Phase-2 judgment
  call**: alias `Signus Cluster → signus_prime` (flat region-into-world grain — simplest)
  or promote a separate `signus_cluster` row (sector-grain parallel to existing
  cluster/sector rows). Recommendation: **alias `Signus Cluster → signus_prime`** for budget
  conservatism (parallel to how Pass-11/12 handled similar region-world pairs as flat
  references, e.g. *Beta-Garmon* on the world axis without a separate sector row).
  **Not a hard block** — Phase-2 may promote the separate row if it wants explicit cluster
  grain.
- **`Iron Blood` (freq 1, HH-0194 *Black Oculus*).** Iron Warriors flagship — vessel-grain
  per Pass-7's vessel convention: → **new row `iron_blood`** with `tags:['vessel']` + `gx/gy:
  null`. Lore-iconic (Perturabo's flagship throughout the Heresy and post-Heresy Iron
  Warriors arc).
- **`Molech's Enlightenment` (freq 1, HH-0195 *Wolf Mother*).** House Devine Knight-vessel.
  Vessel-grain: → **new row `molechs_enlightenment`** with `tags:['vessel']` + `gx/gy:null`.
  Lore-iconic to the post-*Vengeful-Spirit*-on-Molech arc.
- **`Ring of Iron` (freq 1, HH-0186 *Vorax*).** Mars-orbit Dark Mechanicum installation.
  Lore-iconic (the Ring of Iron is the Heresy-era Mars-orbit forge-belt and recurring
  Mechanicum-side locale). Phase-2 judgment — recommendation: **new row `ring_of_iron`**
  (Mars sub-locale grain, parent `mars` or empty).
- **Single-novel campaign worlds / sub-locales (varying weight; Phase-2 judgment):**
  - **`Byzanthis` (freq 1, HH-0154).** Dark Angels compliance debate site. Phase-2 judgment.
  - **`Bastion` (freq 1, HH-0159).** *Forgotten Sons* ambassador-piece world. Phase-2 judgment.
  - **`Virger-Mos II` (freq 1, HH-0158).** Alpha Legion propaganda target. Phase-2 judgment.
  - **`Forty-Seven Sixteen` (freq 1, HH-0152).** Word Bearers post-Monarchia compliance target.
    Phase-2 judgment.
  - **`Goughen` (freq 1, HH-0185).** = Sixty-Three Fourteen, governor-militant character study.
    Phase-2 judgment.
  - **`Proxima Apocryphis` (freq 1, HH-0166).** Eversor-target world. Phase-2 judgment.
  - **`Velbayne` (freq 1, HH-0178).** *Bjorn: Lone Wolf* campaign world. Phase-2 judgment.
  - **`Ardent Reef` (freq 1, HH-0173).** Sector-grain reference (`scope=sector` per the
    HH-0173 override). Phase-2 judgment — leave unresolved unless Phase 2 wants sector-grain
    expansion.
  - **`Aegis sector` (freq 1, HH-0165).** Region of the Lion vs Curze parlay near Tsagualsa.
    Phase-2 judgment — leave unresolved unless Phase 2 wants Heresy-era sector grain (parallel
    to existing sector rows).
  - **`Astagar` (freq 1, HH-0141).** Sedition's Gate anthology surface; per Pass-9 mention in
    HH-0217 *The Laurel of Defiance* ceremony-on-Macragge flashback, Astagar is a battle from
    earlier Heresy arcs — the surface is foundational to the Shadow-Crusade aftermath. Phase-2
    judgment — recommendation: leave unresolved (single-anthology-mention, low surface evidence
    for a Phase-2 promotion).
  - **`Atlas` (freq 1, HH-0147 *Echoes of Imperium*).** Audio anthology surface — disambig
    risk (Atlas is also a Titan figure, a Custodian title, a Vehicle class — generic name).
    Phase-2 judgment — recommendation: **leave unresolved** (disambig risk too high; no
    Phase-2 anchor without a stable lore-ID).
  - **`Dwell` (freq 1, HH-0163 *Little Horus*).** Single-short-story surface. Phase-2 judgment.
  - **`Euphoros` (freq 1, HH-0199).** Idriss Krendl Ironfire protocol target. Phase-2 judgment.
  - **`Gorro` (freq 1, HH-0179 *Wolf of Ash and Fire*).** Russ + son setting. Phase-2 judgment.
  - **`Kernunnos` (freq 1, HH-0151 *Wolf at the Door*).** Space Wolves vs Dark Eldar setting.
    Phase-2 judgment — recommendation: leave unresolved (single-short surface, low lore
    profile beyond the novella).
  - **`Persephia` (freq 1, HH-0159).** *Forgotten Sons* surface — may be a region or sub-locale
    of Bastion. Phase-2 judgment — leave unresolved unless Phase 2 confirms identity.

> Phase-2 promotion shape (recommended): **0 alias adds** (Signus Cluster recommended as
> alias to `signus_prime`, but that's a single optional alias add depending on Phase-2 grain
> call — see 7d) + **1 strict-freq-2 new row** (`terathalion`) + **5..8 curated freq-1
> lore-iconic new rows** (`titan` + `hy_brasil` + `schadenhold` + `lesser_damantyne` +
> `iron_blood`-vessel + `molechs_enlightenment`-vessel + `ring_of_iron` + optionally
> Signus-Cluster-as-row instead of alias) + **0..10 weak-curated freq-1 long-tail new rows**
> (Byzanthis / Bastion / Virger-Mos II / Forty-Seven Sixteen / Goughen / Proxima Apocryphis /
> Velbayne / Ardent Reef / Aegis sector / Astagar / Dwell / Euphoros / Gorro / Kernunnos /
> Persephia — Phase-2 judgment per row). Conservative floor: 1 new row (terathalion);
> recommended target: ~8 new rows (floor + 7 curated lore-iconic); ceiling: ~18 if Phase 2
> takes a generous lore-iconic cut. **Slightly heavier than Pass-12 on the location axis** —
> the vessel-promotion bloc (`iron_blood`, `molechs_enlightenment`) is new this wave + the
> mid-Heresy sub-locale layer (Titan / Hy Brasil / Schadenhold / Lesser Damantyne / Ring of
> Iron) bulks the curated cut.

**Characters (Phase 3).** See 7a (4 alias cases: B-Maloghurst alias-add, C-Nassir-Amit alias-add,
D-Arvida new-row-plus-alias, E-The-Emperor-of-Mankind alias-add) + 7b (2 freq-2 new rows:
`marcus_valerius` + `arcadese`). Plus the freq-1 long tail.

Curated freq-1 lore-iconic character candidates (Phase-3 discretion):

- **Lore-iconic / cross-arc supporting cast (strong promotion candidates):**
  - **`Solomon Voss`** (HH-0160 *The Last Remembrancer*). Iterator / remembrancer at the
    center of the execution argument with Dorn/Qruze on Titan. The Pass-12 dossier 7c flagged
    this as a strong-lore-iconic candidate for Pass-12; with HH-0160 surfacing it directly
    this wave, the promotion case is firm. → **new row `solomon_voss`**. primaryFactionId
    `imperium` (judgment — civilian remembrancer-grade).
  - **`Corswain`** (HH-0165 *Savage Weapons*). Dark Angels Voted Lieutenant; the Lion's
    right-hand at the Tsagualsa parlay. Major Dark-Angels supporting cast (cross-arc with
    Pass-? *Angels of Caliban* / Lion-arc novels). → **new row `corswain`**. primaryFactionId
    `dark_angels`.
  - **`Hastur Sejanus`** (HH-0170 *Death of a Silversmith*). The dead Mournival captain whose
    impersonation by Erebus's cult is a Foundational Heresy beat (the false-Sejanus thread).
    The figure recurs in the cult's mythology long after his death. Lore-iconic. → **new row
    `hastur_sejanus`**. primaryFactionId `sons_of_horus` (his Legion identity at death — the
    Luna-Wolves-era surface form is canonical-aliased onto Sons of Horus per Pass-10/11/12
    convention).
  - **`Sor Talgron`** (HH-0152 *Scions of the Storm*). Wait — already direct in §3
    (`sor_talgron` row exists, Pass-12 promotion). **Skip** — confirmation only.
  - **`Hibou Khan`** (HH-0163 *Little Horus*). White Scars Khan; mid-tier cross-arc
    supporting cast. Phase-3 judgment — recommendation: **new row `hibou_khan`**
    (primaryFactionId `white_scars`) if Phase 3 wants completionist White-Scars supporting
    cast; else leave unresolved long-tail.
  - **`Merir Astelan`** (HH-0154 *Call of the Lion*). First-of-the-Fallen Dark Angel
    (post-Heresy renegade); the compliance debate around Byzanthis is his Heresy-era surface.
    Lore-iconic (cross-arc with the Fallen / Cypher / Lion arcs). → **new row
    `merir_astelan`**. primaryFactionId `dark_angels` (Heresy-era; the Fallen / renegade
    status post-Heresy is downstream from his Pass-13 surface).
  - **`Iacton Qruze`** — already direct. Skip.
  - **`Crius`** (HH-0177 *Riven*). Iron Hands captain on Terra under the Crusader Host;
    cross-arc with HH-0176 *Luna Mendax* (Loken arc). Lore-iconic Iron-Hands supporting cast.
    Phase-3 judgment — recommendation: **new row `crius`** (primaryFactionId `iron_hands`).
- **Single-novel POVs / strong supporting cast (medium promotion candidates):**
  - `Menes Kalliston` (HH-0161 *Rebirth* — Thousand Sons psyker who confronts Khârn on
    Tizca). Phase-3 judgment — recommendation: promote (Thousand Sons supporting cast,
    cross-arc-relevant).
  - `Bulveye` (HH-0151 *Wolf at the Door* — Space Wolves jarl). Phase-3 judgment.
  - `Andras` (HH-0151 *Wolf at the Door* — Space Wolves Wolf-Guard). Phase-3 judgment.
  - `Belath` (HH-0154 *Call of the Lion* — Dark Angels). Phase-3 judgment.
  - `Heka'tan` (HH-0159 *Forgotten Sons* — Salamander ambassador). Phase-3 judgment —
    recommendation: promote (Salamander supporting cast).
  - `Dreagher` (HH-0156 *After Desh'ea* — War Hounds captain at the Khârn-Angron encounter).
    Phase-3 judgment — recommendation: promote (War-Hounds-era founding supporting cast).
  - `Pallas Ravachol` (HH-0172 *The Kaban Project* — Mechanicum POV — sequel to *Mechanicum*).
    Phase-3 judgment — recommendation: promote (Mechanicum cross-arc-relevant).
  - `Lukas Chrom` (HH-0172 *The Kaban Project* — Mechanicum Magos). Phase-3 judgment.
  - `Mendacs` (HH-0158 *Liar's Due* — Alpha Legion propagandist on Virger-Mos II). Phase-3
    judgment — recommendation: promote (Alpha Legion supporting cast — `mendacs` is the
    Latin "we lie" name, an in-Legion code name).
  - `Sharrowkyn` / `Nykona Sharrowkyn` (HH-0167 *Kryptos* — Raven Guard Shadowmaster, debut).
    Phase-3 judgment — recommendation: promote (Raven Guard supporting cast, cross-arc with
    the Sisypheum arc + future Shattered-Legions novellas).
  - `Sabik Wayland` (HH-0167 *Kryptos* — Iron Hands Techmarine, debut). Phase-3 judgment —
    recommendation: promote (Iron Hands supporting cast).
  - `Amon Tauromachian` (HH-0150 *Blood Games* — Custodian POV). Phase-3 judgment.
  - `Enobar Stentonox` (HH-0200 *Hands of the Emperor* — Shield-Captain Custodian). Phase-3
    judgment.
  - `Kargir` (HH-0191 *Howl of the Hearthworld* — Space Wolves Thirteenth-Falling-Stars
    watch-pack POV). Phase-3 judgment.
  - `Susada Syn` (HH-0198 *Tallarn: Witness* — governor-militant on Tallarn). Phase-3
    judgment — recommendation: promote (Tallarn supporting cast, cross-arc-relevant with the
    Tallarn novella set).
  - `Torghun Khan` (HH-0188 *Brotherhood of the Moon* — White Scars internal trial figure).
    Phase-3 judgment.
  - `Thoros` (HH-0175 *Serpent* — Davinite priest). Phase-3 judgment.
  - `Fel Zharost` (HH-0181 *Child of Night* — Night Lords lapsed Librarian; cross-arc with
    HH-0228 *Eater of Dreams* in a future wave — see Pass-26-area future cross-pass evidence).
    Phase-3 judgment — recommendation: promote (Night-Lords Librarian cross-arc figure).
  - `Mayder Oquin` (HH-0185 *Final Compliance of Sixty-Three Fourteen* — governor-militant
    study). Phase-3 judgment.
- **Single-novel supporting cast (weak promotion candidates — Phase-3 judgment, default leave
  unresolved):**
  - `Alajos` + `Sheng` (HH-0165 *Savage Weapons* — Dark-Angels supporting officers).
  - `Henricos` + `Grael Noctua` (HH-0163 *Little Horus* — Sons-of-Horus / Sisypheum supporting).
  - `Chamell` (HH-0147 *Echoes of Imperium* — audio-anthology figure with thin coverage).
  - `Dallon Prael` + `Leon Kyyter` + `Silas Cincade` (all HH-0158 *Liar's Due* — Alpha-Legion-
    propaganda civilian targets).
  - `Letae` (HH-0193 *Gunsight* — Vindicare-arc minor).
  - `Lermenta` (HH-0183 *Daemonology* — Mortarion / Death Guard supporting).
  - `Arkad` (HH-0169 *Lost Sons* — Blood-Angels Warden).
  - `Vorkellen` + `Persephia` (HH-0159 *Forgotten Sons* — *Forgotten Sons* supporting cast).
  - `Leilani Mollitas` (HH-0153 *The Voice* — Sisters-of-Silence supporting on Validus).
  - `Murnau` (HH-0168 *Distant Echoes of Old Night* — Death-Guard Destroyer).
  - `Ashel` (HH-0187 *Value of Fear* — Night-Lord-as-loyalist POV).
  - `Cyprian Devine` + `Cebella` + `Lyx` + `Raeven Devine` + `Abelard Devine` (all HH-0182
    *The Devine Adoratrice* — full Devine family of Molech, only the family-arc supports
    Phase-3 grain; Phase 3 may promote some as cross-arc-relevant House Devine principals,
    especially the head of house — `Cyprian Devine` and the Knight-pilot heir `Raeven Devine`).
  - `Nisha Andrasta` (HH-0180 *Heart of the Conqueror* — Navigator POV).
  - `Kaban Machine` (HH-0172 *The Kaban Project* — sentient Mechanicum construct, **axis-grain
    question: character or unique vehicle?** Phase 3 judgment — recommendation: leave
    unresolved long-tail unless Phase 3 promotes the Kaban Machine as a character-grain entity
    per Pass-12 7d's `nurgle` precedent).

> Phase-3 promotion shape (recommended): **3 alias adds** (Case B `Maloghurst → maloghurst_the_
> twisted`; Case C `Nassir Amit → amit`; Case E `The Emperor of Mankind → the_emperor`) + **1
> new-row-plus-alias** (Case D `revuel_arvida` + alias `Arvida → revuel_arvida`) + **2 freq-2
> new rows** (7b `marcus_valerius` + `arcadese`) + **8..12 curated freq-1 strong-lore-iconic
> new rows** (`solomon_voss` + `corswain` + `hastur_sejanus` + `hibou_khan` + `merir_astelan` +
> `crius` + `menes_kalliston` + `heka_tan` + `dreagher` + `pallas_ravachol` + `mendacs` +
> `nykona_sharrowkyn` + `sabik_wayland`) + **0..15 weak-curated long-tail new rows** (Phase-3
> judgment per row). Conservative floor: 4 new rows (the 2 freq-2 + 2 strongest freq-1:
> Solomon Voss + Corswain) + 1 Case-D new row + 3 alias adds. Recommended target: ~14 new
> rows (floor + 10 strong-lore-iconic) + 1 Case-D new row + 3 alias adds. Ceiling: ~25 if
> Phase 3 takes a generous freq-1 cut. **The lightest Phase-3 promotion pass of the HH arc**
> on the curated-strong tier — Pass-12 absorbed the Calth-Underworld + Cross-Era spines, so
> Pass-13 is mostly *Tales-of-Heresy* / *Age-of-Darkness* / mid-Heresy supporting cast judgment
> + the short-form alias cleanup.

### 7d. needs-decision candidates (expected: 0 hard blockers)

- **Forward-ref Guard post-Brief-101: expected `out-of-range=0, unknown-work=0`.** Pass-13 has
  **no roster-collection anthologies** in the wave per §5 (the table is empty — the five
  Heresy-Anthology-Block titles in ssot-hh-015 are e-anthologies whose constituents are not
  roster-tracked separately, only as `format=collection` aggregated tags). Pass-13 expects the
  **cleanest Guard outcome of the HH arc**: 0 out-of-range refs (clean), 0 unknown-work refs
  (clean). Phase 4a verifies the counts; mismatch (`unknown-work > 0`) is a `## Needs decision`
  stop. **Not a hard block** — the Guard is wired correctly per Brief 101 + Pass-11/12
  experience.
- **`Davinite Lodge` ↔ `Davinite Serpent Lodge` Phase-1 grain (7a Case A).** Phase 1 chooses
  between (a) promote one row `davinite_lodge` + alias `Davinite Serpent Lodge →
  davinite_lodge` (recommended — simpler grain, both refer to the same Davin cult), (b) leave
  both unresolved long-tail, (c) promote two separate rows (unmotivated by current evidence).
  Recommendation: (a). Phase 1 judgment. **Not a hard block.**
- **`Signus Cluster` Phase-2 region-vs-world grain (7c).** Phase 2 may instead promote a
  separate `signus_cluster` row (sector-grain parallel to existing cluster/sector rows) if
  hierarchical grain is preferred. Recommendation stands at **alias `Signus Cluster →
  signus_prime`** (flat grain, simplest; the `signus_prime` row conceptually carries the
  Signus Campaign region; no other partition surfaces). Phase 2 judgment. **Not a hard block.**
- **`Therion Cohort` Phase-1 regiment-grain (7c).** Phase 1 chooses whether to promote
  `therion_cohort` as a regiment-grain sub-faction of `astra_militarum` (recommended — given
  the spine character link to `marcus_valerius` in 7b) or to leave it unresolved long-tail
  until a future freq-2 cross-batch surface. Recommendation: promote. Phase 1 judgment.
  **Not a hard block.**
- **`Arcadese` 7b cross-book identity verification (Phase 3).** Phase 3 verifies that HH-0159
  *Forgotten Sons* and HH-0173 *The Gates of Terra* both attest the same Ultramarine
  character (different authors / books / settings, strict reading from current source
  coverage). If the identity check fails (the two `Arcadese` surfaces are different
  characters), then leave both unresolved long-tail + `## Needs decision`-flag. **Not a
  hard block** — recommendation is to promote per strict reading + note the identity check
  in the Phase-3 report.
- **`Nassir Amit` row-rename deferral (7a Case C).** Phase 3 chooses between (a) alias-only
  `Nassir Amit → amit` (recommended — keeps existing slug, lowest blast radius), (b) `##
  Needs decision`-stop to discuss row-renaming `amit → nassir_amit` mid-arc. Recommendation:
  (a) + note as deferred row-rename candidate for a future consolidation pass. Phase 3
  judgment. **Not a hard block.**
- **`Kaban Machine` axis-grain (Phase 3).** Phase 3 decides whether `Kaban Machine` is a
  character-grain entity (sentient Mechanicum construct, parallel to Pass-12's `nurgle`
  character-grain promotion) or a unique-vehicle / instrument-grain (leave unresolved
  character-side, deferred to a future facet/vehicle layer). Recommendation: **leave
  unresolved long-tail** for budget conservatism — Mechanicum-construct grain is not yet
  established in the resolver, and a single-novel surface is borderline. Phase 3 judgment.
  **Not a hard block.**
- **House Devine family (Phase 3).** HH-0182 *The Devine Adoratrice* surfaces the full
  Devine family (Cyprian / Cebella / Lyx / Raeven / Abelard). Phase 3 judgment whether to
  promote the head of house (Cyprian Devine) + the Knight-pilot heir (Raeven Devine) as
  cross-arc-relevant House Devine principals, with the rest left unresolved long-tail.
  Recommendation: promote `cyprian_devine` + `raeven_devine` if Phase 3 wants Devine-arc
  completionist grain; else leave all five unresolved. **Not a hard block.**
- **Format conflicts (Phase 4a-side, not Phase 1/2/3).** Several wave-15 books are e-shorts
  or audio dramas (HH-0142 *Echoes of Ruin* and HH-0149 *Echoes of Revelation* and HH-0147
  *Echoes of Imperium* all audio anthologies; HH-0148 *Virtues of the Sons/Sins of the
  Father* and HH-0184 *Sins of the Father* and HH-0189 *Virtues of the Sons* audio dramas).
  Phase 4a applies the override as authored; format mismatches surface in the apply digest.
  **Not a Phase-1/2/3 concern.**
- **`low_confidence:*` advisory carry-through (8 flags, Phase 4a-side, not Phase 1/2/3).**
  HH-0145 *Meduson* (`locations`), HH-0147 *Echoes of Imperium* (`factions`), HH-0166 *Army
  of One* (`characters`), HH-0170 *Death of a Silversmith* (`characters`), HH-0186 *Vorax*
  (`characters`), HH-0192 *A Safe and Shadowed Place* (`characters`), HH-0194 *Black Oculus*
  (`characters`), HH-0197 *Chirurgeon* (`locations`). All advisory carry-through for the
  audit cockpit; does not gate resolver axes. **Not a Phase-1/2/3 concern.**
- **Cumulative milestone — HH-domain past-200-books.** After this pass: **200 / X HH books**
  where X is the full HH-domain target (the loop-helper detector knows the total; Phase 4b
  can read it from `db-counts` / verify-pass output). The Phase 4b impl-report should flag
  this as the **HH 200-book milestone** — first-time crossing the 200-book mark in the HH
  authority layer, Pass-12 milestone of all 17 Primarchs anchored confirmed direct in this
  wave, the e-anthology / short-story-tail format now well-absorbed, every freq-2+ HH-cast
  row in place for the next wave's continuing arc work.
- **Cross-axis surface-form conflicts** — **none in this wave** per §4. The Pass-13 surface
  set is clean on that axis-disambig front. The Pass-11/12 advisories about future
  *Fulgrim*-adjacent `Laer`/`Laeran` and similar disambig cases still apply for later waves;
  this wave does not face them.

The per-axis promotion extents (7c), the 7a short-form / longer-variant alias-consolidation
cases, and the 7b cross-batch spine pair are in-phase **judgments**, justified in each phase
report — none escalates to a hard block under current evidence. The Brief-091 forward-ref
Guard is wired correctly (Brief 101 reason-split landed at Pass-10), and Pass-13 has no
roster-collection anthologies (clean Guard outcome expected), so the architectural concern is
closed; Phase 4a only verifies the expected `out-of-range=0, unknown-work=0` counts.
