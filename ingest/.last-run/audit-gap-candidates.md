# Audit Gap Candidates — non-audio_drama

Bücher, die `/buecher?audit=gap` als `hasJunctionGap=true` flagt **und** kein `audio_drama`-Format tragen. Reproduzierbar via `npm run audit:gap-candidates`; Output deterministisch sortiert nach `external_book_id`.

## Summary

- **Total:** 325
- **By domain:** HH=73, W40K=252, other=0
- **By missing axis:** factions=29, locations=228, characters=194 (Bücher können in mehreren Spalten zählen)

## Candidates

| ext_id | slug | format | f | l | c | conf | title |
|---|---|---|---:|---:|---:|---:|---|
| HH-0001 | `horus-rising` | novel | 4 | 0 | 7 | 1.00 | Horus Rising |
| HH-0007 | `legion` | novel | 3 | 0 | 6 | 1.00 | Legion |
| HH-0043 | `shattered-legions` | anthology | 8 | 0 | 2 | 1.00 | Shattered Legions |
| HH-0051 | `slaves-to-darkness` | novel | 7 | 0 | 8 | 1.00 | Slaves to Darkness |
| HH-0052 | `heralds-of-the-siege` | anthology | 0 | 0 | 0 | 1.00 | Heralds of the Siege |
| HH-0058 | `the-sons-of-selenar` | novella | 4 | 1 | 0 | 1.00 | The Sons of Selenar |
| HH-0074 | `dreams-of-unity` | short_story | 2 | 2 | 0 | 1.00 | Dreams of Unity |
| HH-0076 | `old-wounds-new-scars` | short_story | 0 | 2 | 1 | 1.00 | Old Wounds, New Scars |
| HH-0080 | `ashes-of-the-imperium` | novel | 3 | 2 | 0 | 1.00 | Ashes of the Imperium |
| HH-0081 | `roboute-guilliman-lord-of-ultramar` | novel | 2 | 0 | 1 | 1.00 | Roboute Guilliman: Lord of Ultramar |
| HH-0082 | `leman-russ-the-great-wolf` | novel | 2 | 0 | 2 | 1.00 | Leman Russ: The Great Wolf |
| HH-0083 | `magnus-the-red-master-of-prospero` | novel | 2 | 0 | 2 | 1.00 | Magnus the Red: Master of Prospero |
| HH-0085 | `lorgar-bearer-of-the-word` | novel | 0 | 1 | 2 | 1.00 | Lorgar: Bearer of the Word |
| HH-0086 | `fulgrim-the-palatine-phoenix` | novel | 1 | 0 | 1 | 1.00 | Fulgrim: The Palatine Phoenix |
| HH-0090 | `sons-of-the-emperor` | anthology | 8 | 0 | 6 | 1.00 | Sons of the Emperor |
| HH-0100 | `sanguinius-the-great-angel` | novel | 1 | 0 | 1 | 1.00 | Sanguinius: The Great Angel |
| HH-0101 | `grandfathers-gift` | short_story | 2 | 0 | 2 | 1.00 | Grandfather's Gift |
| HH-0102 | `the-atonement-of-fire` | short_story | 3 | 0 | 2 | 1.00 | The Atonement of Fire |
| HH-0103 | `a-lesson-in-iron` | short_story | 2 | 0 | 1 | 1.00 | A Lesson in Iron |
| HH-0105 | `the-passing-of-angels` | short_story | 1 | 0 | 2 | 1.00 | The Passing of Angels |
| HH-0106 | `the-abyssal-edge` | short_story | 2 | 0 | 3 | 1.00 | The Abyssal Edge |
| HH-0108 | `the-will-of-the-legion` | short_story | 1 | 0 | 1 | 1.00 | The Will of the Legion |
| HH-0113 | `eidolon-the-auric-hammer` | novel | 2 | 0 | 1 | 1.00 | Eidolon: The Auric Hammer |
| HH-0114 | `promethean-sun` | novella | 4 | 0 | 3 | 1.00 | Promethean Sun |
| HH-0117 | `the-reflection-crackd` | novella | 1 | 0 | 3 | 1.00 | The Reflection Crack'd |
| HH-0118 | `feat-of-iron` | novella | 4 | 0 | 1 | 1.00 | Feat of Iron |
| HH-0119 | `the-lion` | novella | 2 | 0 | 3 | 1.00 | The Lion |
| HH-0122 | `scorched-earth` | novella | 3 | 2 | 0 | 1.00 | Scorched Earth |
| HH-0123 | `tallarn-executioner` | novella | 2 | 1 | 0 | 1.00 | Tallarn: Executioner |
| HH-0128 | `the-seventh-serpent` | novella | 4 | 0 | 2 | 1.00 | The Seventh Serpent |
| HH-0137 | `spear-of-ultramar` | novella | 2 | 0 | 1 | 1.00 | Spear of Ultramar |
| HH-0140 | `visions-of-heresy` | anthology | 0 | 0 | 0 | 1.00 | Visions of Heresy |
| HH-0145 | `meduson` | collection | 4 | 0 | 1 | 1.00 | Meduson |
| HH-0148 | `virtues-of-the-sons-sins-of-the-father` | collection | 3 | 0 | 5 | 1.00 | Virtues of the Sons/Sins of the Father |
| HH-0150 | `blood-games` | short_story | 1 | 2 | 0 | 1.00 | Blood Games |
| HH-0151 | `wolf-at-the-door` | short_story | 2 | 0 | 1 | 1.00 | Wolf at the Door |
| HH-0153 | `the-voice` | short_story | 1 | 0 | 1 | 1.00 | The Voice |
| HH-0154 | `call-of-the-lion` | short_story | 1 | 0 | 1 | 1.00 | Call of the Lion |
| HH-0155 | `the-last-church` | short_story | 0 | 1 | 2 | 1.00 | The Last Church |
| HH-0158 | `liars-due` | short_story | 1 | 0 | 1 | 1.00 | Liar's Due |
| HH-0159 | `forgotten-sons` | short_story | 3 | 0 | 2 | 1.00 | Forgotten Sons |
| HH-0163 | `little-horus` | short_story | 3 | 0 | 3 | 1.00 | Little Horus |
| HH-0166 | `army-of-one` | short_story | 1 | 0 | 1 | 1.00 | Army of One |
| HH-0167 | `kryptos` | short_story | 2 | 0 | 2 | 1.00 | Kryptos |
| HH-0168 | `distant-echoes-of-old-night` | short_story | 2 | 0 | 0 | 1.00 | Distant Echoes of Old Night |
| HH-0171 | `the-divine-word` | short_story | 2 | 0 | 1 | 1.00 | The Divine Word |
| HH-0175 | `serpent` | short_story | 1 | 1 | 0 | 1.00 | Serpent |
| HH-0178 | `bjorn-lone-wolf` | short_story | 1 | 0 | 2 | 1.00 | Bjorn: Lone Wolf |
| HH-0179 | `the-wolf-of-ash-and-fire` | short_story | 2 | 0 | 2 | 1.00 | The Wolf of Ash and Fire |
| HH-0182 | `the-devine-adoratrice` | short_story | 2 | 1 | 0 | 1.00 | The Devine Adoratrice |
| HH-0184 | `sins-of-the-father` | short_story | 1 | 0 | 3 | 1.00 | Sins of the Father |
| HH-0185 | `the-final-compliance-of-sixty-three-fourteen` | short_story | 1 | 0 | 0 | 1.00 | The Final Compliance of Sixty-Three Fourteen |
| HH-0186 | `vorax` | short_story | 3 | 2 | 0 | 1.00 | Vorax |
| HH-0187 | `the-value-of-fear` | short_story | 3 | 0 | 0 | 1.00 | The Value of Fear |
| HH-0188 | `brotherhood-of-the-moon` | short_story | 2 | 0 | 1 | 1.00 | Brotherhood of the Moon |
| HH-0189 | `virtues-of-the-sons` | short_story | 3 | 0 | 5 | 1.00 | Virtues of the Sons |
| HH-0190 | `imperfect` | short_story | 2 | 0 | 3 | 1.00 | Imperfect |
| HH-0192 | `a-safe-and-shadowed-place` | short_story | 2 | 2 | 0 | 1.00 | A Safe and Shadowed Place |
| HH-0197 | `chirurgeon` | short_story | 1 | 0 | 1 | 1.00 | Chirurgeon |
| HH-0201 | `by-the-lions-command` | short_story | 2 | 0 | 2 | 1.00 | By the Lion's Command |
| HH-0202 | `all-that-remains` | short_story | 2 | 0 | 1 | 1.00 | All That Remains |
| HH-0204 | `artefacts` | short_story | 1 | 0 | 1 | 1.00 | Artefacts |
| HH-0206 | `tallarn-siren` | short_story | 2 | 1 | 0 | 1.00 | Tallarn: Siren |
| HH-0208 | `blackshield` | short_story | 2 | 0 | 1 | 1.00 | Blackshield |
| HH-0209 | `myriad` | short_story | 3 | 1 | 0 | 1.00 | Myriad |
| HH-0212 | `the-painted-count` | short_story | 1 | 1 | 0 | 1.00 | The Painted Count |
| HH-0213 | `exocytosis` | short_story | 2 | 0 | 2 | 1.00 | Exocytosis |
| HH-0216 | `the-ember-wolves` | short_story | 2 | 0 | 0 | 1.00 | The Ember Wolves |
| HH-0218 | `immortal-duty` | short_story | 1 | 1 | 0 | 1.00 | Immortal Duty |
| HH-0223 | `prologue-to-nikaea` | short_story | 0 | 0 | 1 | 1.00 | Prologue To Nikaea |
| HH-0224 | `abyssal` | short_story | 2 | 1 | 0 | 1.00 | Abyssal |
| HH-0229 | `bloodhowl` | short_story | 2 | 0 | 1 | 1.00 | Bloodhowl |
| HH-0230 | `amor-fati` | short_story | 1 | 0 | 3 | 1.00 | Amor Fati |
| W40K-0012 | `for-the-emperor` | novel | 6 | 0 | 5 | 1.00 | For the Emperor |
| W40K-0013 | `caves-of-ice` | novel | 4 | 0 | 5 | 1.00 | Caves of Ice |
| W40K-0014 | `the-traitors-hand` | novel | 3 | 0 | 5 | 1.00 | The Traitor's Hand |
| W40K-0016 | `duty-calls` | novel | 7 | 0 | 5 | 1.00 | Duty Calls |
| W40K-0018 | `the-emperors-finest` | novel | 7 | 0 | 3 | 1.00 | The Emperor's Finest |
| W40K-0019 | `the-last-ditch` | novel | 6 | 0 | 5 | 1.00 | The Last Ditch |
| W40K-0023 | `old-soldiers-never-die` | novella | 4 | 0 | 2 | 1.00 | Old Soldiers Never Die |
| W40K-0059 | `death-knell` | novella | 4 | 1 | 0 | 1.00 | Death Knell |
| W40K-0064 | `space-marine` | novel | 6 | 2 | 0 | 1.00 | Space Marine |
| W40K-0065 | `eye-of-terror` | novel | 7 | 1 | 0 | 1.00 | Eye of Terror |
| W40K-0066 | `pawns-of-chaos` | novel | 4 | 1 | 0 | 1.00 | Pawns of Chaos |
| W40K-0067 | `farseer` | novel | 5 | 1 | 0 | 1.00 | Farseer |
| W40K-0068 | `daemon-world` | novel | 8 | 2 | 0 | 1.00 | Daemon World |
| W40K-0070 | `fire-warrior` | novel | 8 | 2 | 0 | 1.00 | Fire Warrior |
| W40K-0075 | `eldar-prophecy` | novel | 1 | 1 | 0 | 1.00 | Eldar Prophecy |
| W40K-0076 | `relentless` | novel | 3 | 1 | 0 | 1.00 | Relentless |
| W40K-0077 | `titanicus` | novel | 6 | 1 | 0 | 1.00 | Titanicus |
| W40K-0078 | `sons-of-dorn` | novel | 5 | 1 | 0 | 1.00 | Sons of Dorn |
| W40K-0081 | `fire-caste` | novel | 5 | 1 | 0 | 1.00 | Fire Caste |
| W40K-0084 | `dark-hunters-umbra-sumus` | novel | 5 | 2 | 0 | 1.00 | Dark Hunters: Umbra Sumus |
| W40K-0085 | `assassinorum-execution-force` | novel | 8 | 1 | 0 | 1.00 | Assassinorum: Execution Force |
| W40K-0086 | `silver-skulls-portents` | novel | 5 | 1 | 0 | 1.00 | Silver Skulls: Portents |
| W40K-0088 | `warlord-fury-of-the-god-machine` | novel | 6 | 0 | 0 | 1.00 | Warlord: Fury of the God Machine |
| W40K-0092 | `the-last-hunt` | novel | 7 | 1 | 0 | 1.00 | The Last Hunt |
| W40K-0093 | `sons-of-the-hydra` | novel | 4 | 1 | 0 | 1.00 | Sons of the Hydra |
| W40K-0095 | `imperator-wrath-of-the-omnissiah` | novel | 7 | 2 | 0 | 1.00 | Imperator: Wrath of the Omnissiah |
| W40K-0096 | `legacy-of-dorn` | novel | 5 | 2 | 0 | 1.00 | Legacy of Dorn |
| W40K-0097 | `blood-of-iax` | novel | 4 | 3 | 0 | 1.00 | Blood of Iax |
| W40K-0111 | `volpone-glory` | novel | 3 | 1 | 0 | 1.00 | Volpone Glory |
| W40K-0113 | `day-of-ascension` | novel | 3 | 0 | 0 | 1.00 | Day of Ascension |
| W40K-0114 | `the-triumph-of-saint-katherine` | novel | 4 | 0 | 0 | 1.00 | The Triumph of Saint Katherine |
| W40K-0116 | `assassinorum-kingmaker` | novel | 4 | 0 | 0 | 1.00 | Assassinorum: Kingmaker |
| W40K-0117 | `krieg` | novel | 5 | 1 | 0 | 1.00 | Krieg |
| W40K-0118 | `catachan-devil` | novel | 3 | 1 | 0 | 1.00 | Catachan Devil |
| W40K-0119 | `helbrecht-knight-of-the-throne` | novel | 3 | 0 | 3 | 1.00 | Helbrecht: Knight of the Throne |
| W40K-0120 | `witchbringer` | novel | 3 | 0 | 0 | 1.00 | Witchbringer |
| W40K-0121 | `outgunned` | novel | 4 | 0 | 2 | 1.00 | Outgunned |
| W40K-0122 | `awakenings` | novel | 6 | 0 | 1 | 1.00 | Awakenings |
| W40K-0124 | `void-king` | novel | 2 | 1 | 0 | 1.00 | Void King |
| W40K-0125 | `kasrkin` | novel | 5 | 0 | 0 | 1.00 | Kasrkin |
| W40K-0128 | `warboss` | novel | 3 | 0 | 0 | 1.00 | Warboss |
| W40K-0129 | `pilgrims-of-fire` | novel | 4 | 2 | 0 | 1.00 | Pilgrims of Fire |
| W40K-0131 | `leviathan` | novel | 5 | 0 | 0 | 1.00 | Leviathan |
| W40K-0132 | `longshot` | novel | 3 | 1 | 0 | 1.00 | Longshot |
| W40K-0136 | `above-and-beyond` | novel | 3 | 0 | 2 | 1.00 | Above and Beyond |
| W40K-0137 | `elemental-council` | novel | 4 | 0 | 0 | 1.00 | Elemental Council |
| W40K-0139 | `hells-last` | novel | 4 | 0 | 1 | 1.00 | Hell's Last |
| W40K-0140 | `fulgrim-the-perfect-son` | novel | 5 | 0 | 1 | 1.00 | Fulgrim: The Perfect Son |
| W40K-0141 | `voidscarred` | novel | 4 | 0 | 0 | 1.00 | Voidscarred |
| W40K-0142 | `tomb-world` | novel | 3 | 1 | 0 | 1.00 | Tomb World |
| W40K-0143 | `vagabond-squadron` | novel | 4 | 0 | 0 | 1.00 | Vagabond Squadron |
| W40K-0144 | `archmagos` | novel | 2 | 0 | 1 | 1.00 | Archmagos |
| W40K-0146 | `death-rider` | novel | 5 | 0 | 0 | 1.00 | Death Rider |
| W40K-0147 | `the-green-tide` | omnibus | 5 | 1 | 0 | 1.00 | The Green Tide |
| W40K-0148 | `inquisitor-draco` | novel | 10 | 0 | 4 | 1.00 | Inquisitor / Draco |
| W40K-0161 | `status-deadzone` | anthology | 8 | 3 | 0 | 1.00 | Status: Deadzone |
| W40K-0163 | `salvation` | novel | 4 | 4 | 0 | 1.00 | Salvation |
| W40K-0165 | `junktion` | novel | 1 | 4 | 0 | 1.00 | Junktion |
| W40K-0166 | `fleshworks` | novel | 3 | 3 | 0 | 1.00 | Fleshworks |
| W40K-0167 | `outlander` | novel | 3 | 3 | 0 | 1.00 | Outlander |
| W40K-0168 | `back-from-the-dead` | novel | 3 | 3 | 0 | 1.00 | Back from the Dead |
| W40K-0176 | `road-to-redemption` | novel | 3 | 4 | 0 | 1.00 | Road to Redemption |
| W40K-0179 | `fire-made-flesh` | novel | 2 | 4 | 0 | 1.00 | Fire Made Flesh |
| W40K-0180 | `spark-of-revolution` | novella | 3 | 3 | 0 | 1.00 | Spark of Revolution |
| W40K-0189 | `soul-drinker` | novel | 3 | 0 | 1 | 1.00 | Soul Drinker |
| W40K-0190 | `the-bleeding-chalice` | novel | 3 | 0 | 3 | 1.00 | The Bleeding Chalice |
| W40K-0191 | `crimson-tears` | novel | 4 | 0 | 2 | 1.00 | Crimson Tears |
| W40K-0192 | `the-soul-drinkers-omnibus` | omnibus | 7 | 0 | 4 | 1.00 | The Soul Drinkers Omnibus |
| W40K-0194 | `hellforged` | novel | 4 | 0 | 1 | 1.00 | Hellforged |
| W40K-0195 | `daenyathos` | novella | 2 | 0 | 1 | 1.00 | Daenyathos |
| W40K-0206 | `broken-crusade` | novel | 2 | 0 | 0 | 1.00 | Broken Crusade |
| W40K-0211 | `dawn-of-war-ii` | novel | 3 | 0 | 0 | 1.00 | Dawn of War II |
| W40K-0213 | `grey-knights` | novel | 3 | 0 | 3 | 1.00 | Grey Knights |
| W40K-0220 | `black-tide` | novel | 4 | 0 | 3 | 1.00 | Black Tide |
| W40K-0228 | `desert-raiders` | novel | 2 | 0 | 0 | 1.00 | Desert Raiders |
| W40K-0229 | `ice-guard` | novel | 2 | 0 | 0 | 1.00 | Ice Guard |
| W40K-0232 | `redemption-corps` | novel | 4 | 0 | 1 | 1.00 | Redemption Corps |
| W40K-0233 | `dead-men-walking` | novel | 2 | 1 | 0 | 1.00 | Dead Men Walking |
| W40K-0235 | `imperial-glory` | novel | 1 | 0 | 0 | 1.00 | Imperial Glory |
| W40K-0236 | `iron-guard` | novel | 1 | 0 | 0 | 1.00 | Iron Guard |
| W40K-0237 | `commissar` | novel | 1 | 0 | 1 | 1.00 | Commissar |
| W40K-0238 | `baneblade` | novel | 2 | 0 | 1 | 1.00 | Baneblade |
| W40K-0239 | `straken` | novel | 2 | 0 | 1 | 1.00 | Straken |
| W40K-0241 | `shadowsword` | novel | 1 | 0 | 1 | 1.00 | Shadowsword |
| W40K-0242 | `glory-imperialis-omnibus` | omnibus | 2 | 0 | 0 | 1.00 | Glory Imperialis Omnibus |
| W40K-0243 | `final-deployment` | novel | 2 | 0 | 1 | 1.00 | Final Deployment |
| W40K-0244 | `the-remnant-blade` | novel | 1 | 0 | 1 | 1.00 | The Remnant Blade |
| W40K-0245 | `death-and-duty` | anthology | 1 | 0 | 0 | 1.00 | Death And Duty |
| W40K-0246 | `the-relentless-dead` | novel | 2 | 0 | 0 | 1.00 | The Relentless Dead |
| W40K-0247 | `chem-dog` | novel | 3 | 0 | 1 | 1.00 | Chem Dog |
| W40K-0248 | `steel-daemon` | novella | 2 | 0 | 0 | 1.00 | Steel Daemon |
| W40K-0249 | `iron-resolve` | novella | 2 | 0 | 0 | 1.00 | Iron Resolve |
| W40K-0250 | `warrior-brood` | novel | 3 | 0 | 0 | 1.00 | Warrior Brood |
| W40K-0251 | `warrior-coven` | novel | 3 | 0 | 0 | 1.00 | Warrior Coven |
| W40K-0252 | `deathwatch` | novel | 3 | 0 | 0 | 1.00 | Deathwatch |
| W40K-0253 | `shadowbreaker` | novel | 3 | 0 | 0 | 1.00 | Shadowbreaker |
| W40K-0257 | `the-bloodied-rose` | novella | 2 | 0 | 1 | 1.00 | The Bloodied Rose |
| W40K-0265 | `dark-disciple` | novel | 4 | 0 | 3 | 1.00 | Dark Disciple |
| W40K-0268 | `emperors-mercy` | novel | 2 | 1 | 0 | 1.00 | Emperor's Mercy |
| W40K-0269 | `flesh-and-iron` | novel | 1 | 1 | 0 | 1.00 | Flesh and Iron |
| W40K-0270 | `blood-gorgons` | novel | 1 | 0 | 0 | 1.00 | Blood Gorgons |
| W40K-0271 | `bastion-wars-the-omnibus` | omnibus | 3 | 0 | 1 | 1.00 | Bastion Wars: The Omnibus |
| W40K-0280 | `hunt-for-voldorius` | novel | 3 | 0 | 1 | 1.00 | Hunt for Voldorius |
| W40K-0284 | `the-gildar-rift` | novel | 2 | 0 | 1 | 1.00 | The Gildar Rift |
| W40K-0285 | `legion-of-the-damned` | novel | 2 | 0 | 0 | 1.00 | Legion of the Damned |
| W40K-0287 | `wrath-of-iron` | novel | 2 | 0 | 0 | 1.00 | Wrath of Iron |
| W40K-0288 | `the-siege-of-castellax` | novel | 2 | 1 | 0 | 1.00 | The Siege of Castellax |
| W40K-0289 | `the-death-of-antagonis` | novel | 2 | 0 | 0 | 1.00 | The Death of Antagonis |
| W40K-0290 | `death-of-integrity` | novel | 3 | 0 | 0 | 1.00 | Death of Integrity |
| W40K-0291 | `malodrax` | novel | 2 | 0 | 1 | 1.00 | Malodrax |
| W40K-0293 | `overfiend` | anthology | 6 | 1 | 0 | 1.00 | Overfiend |
| W40K-0295 | `the-world-engine` | novel | 1 | 0 | 0 | 1.00 | The World Engine |
| W40K-0299 | `the-plagues-of-orath` | anthology | 3 | 1 | 0 | 1.00 | The Plagues of Orath |
| W40K-0302 | `storm-of-damocles` | novel | 3 | 1 | 0 | 1.00 | Storm of Damocles |
| W40K-0303 | `tyrant-of-the-hollow-worlds` | novel | 2 | 0 | 1 | 1.00 | Tyrant of the Hollow Worlds |
| W40K-0305 | `scythes-of-the-emperor` | anthology | 2 | 1 | 0 | 1.00 | Scythes of the Emperor |
| W40K-0306 | `the-eye-of-ezekiel` | novel | 4 | 0 | 0 | 1.00 | The Eye of Ezekiel |
| W40K-0308 | `accursed-eternity` | novella | 1 | 0 | 0 | 1.00 | Accursed Eternity |
| W40K-0309 | `endeavour-of-will` | novella | 2 | 0 | 1 | 1.00 | Endeavour of Will |
| W40K-0310 | `fateweaver` | novella | 2 | 0 | 1 | 1.00 | Fateweaver |
| W40K-0311 | `sanctus` | novella | 3 | 1 | 0 | 1.00 | Sanctus |
| W40K-0312 | `catechism-of-hate` | novella | 2 | 0 | 0 | 1.00 | Catechism of Hate |
| W40K-0315 | `stormseer` | novella | 4 | 1 | 0 | 1.00 | Stormseer |
| W40K-0318 | `shadow-captain` | novella | 3 | 1 | 0 | 1.00 | Shadow Captain |
| W40K-0319 | `forge-master` | novella | 3 | 0 | 0 | 1.00 | Forge Master |
| W40K-0320 | `plague-harvest` | novella | 3 | 1 | 0 | 1.00 | Plague Harvest |
| W40K-0321 | `engines-of-war` | novella | 2 | 1 | 0 | 1.00 | Engines of War |
| W40K-0322 | `armour-of-faith` | novella | 3 | 1 | 0 | 1.00 | Armour of Faith |
| W40K-0323 | `sons-of-wrath` | novella | 2 | 0 | 1 | 1.00 | Sons of Wrath |
| W40K-0324 | `angrons-monolith` | novella | 2 | 1 | 0 | 1.00 | Angron's Monolith |
| W40K-0326 | `dantes-canyon` | novella | 2 | 1 | 0 | 1.00 | Dante's Canyon |
| W40K-0328 | `sanctus-reach-blood-on-the-mountain` | novella | 3 | 1 | 0 | 1.00 | Sanctus Reach: Blood on the Mountain |
| W40K-0329 | `sanctus-reach-maledictus` | novella | 4 | 1 | 0 | 1.00 | Sanctus Reach: Maledictus |
| W40K-0330 | `the-hunt-of-magnus` | novella | 2 | 0 | 2 | 1.00 | The Hunt of Magnus |
| W40K-0331 | `lords-of-the-storm` | novella | 1 | 0 | 0 | 1.00 | Lords of the Storm |
| W40K-0332 | `the-unkindness-of-ravens` | novella | 2 | 0 | 0 | 1.00 | The Unkindness of Ravens |
| W40K-0333 | `dark-vengeance` | novella | 2 | 0 | 0 | 1.00 | Dark Vengeance |
| W40K-0334 | `lords-of-caliban` | collection | 2 | 0 | 2 | 1.00 | Lords of Caliban |
| W40K-0335 | `mephiston-lord-of-death` | novella | 2 | 0 | 1 | 1.00 | Mephiston: Lord of Death |
| W40K-0336 | `arjac-rockfist-anvil-of-fenris` | novella | 2 | 3 | 0 | 1.00 | Arjac Rockfist: Anvil of Fenris |
| W40K-0338 | `broken-sword` | novella | 2 | 1 | 0 | 1.00 | Broken Sword |
| W40K-0339 | `black-leviathan` | novella | 2 | 0 | 0 | 1.00 | Black Leviathan |
| W40K-0341 | `the-last-days-of-ector` | novella | 1 | 0 | 0 | 1.00 | The Last Days of Ector |
| W40K-0342 | `crimson-dawn` | novella | 1 | 0 | 0 | 1.00 | Crimson Dawn |
| W40K-0343 | `shield-of-baal-tempestus` | novella | 4 | 1 | 0 | 1.00 | Shield of Baal: Tempestus |
| W40K-0345 | `shield-of-baal-devourer` | novella | 3 | 1 | 0 | 1.00 | Shield of Baal: Devourer |
| W40K-0350 | `shadow-knight` | short_story | 2 | 0 | 4 | 1.00 | Shadow Knight |
| W40K-0359 | `the-masque-of-vyle` | novella | 2 | 1 | 0 | 1.00 | The Masque of Vyle |
| W40K-0360 | `ishas-lament` | novella | 2 | 2 | 0 | 1.00 | Isha's Lament |
| W40K-0361 | `angel-of-fire` | novel | 2 | 0 | 5 | 1.00 | Angel of Fire |
| W40K-0381 | `stormcaller` | novel | 3 | 0 | 3 | 1.00 | Stormcaller |
| W40K-0383 | `ravenwing` | novel | 2 | 0 | 4 | 1.00 | Ravenwing |
| W40K-0384 | `master-of-sanctity` | novel | 2 | 0 | 5 | 1.00 | Master of Sanctity |
| W40K-0394 | `knights-of-the-imperium` | novella | 3 | 0 | 0 | 1.00 | Knights of the Imperium |
| W40K-0395 | `asurmen-hand-of-asuryan` | novel | 1 | 0 | 1 | 1.00 | Asurmen: Hand of Asuryan |
| W40K-0398 | `lemartes-guardian-of-the-lost` | novel | 1 | 0 | 1 | 1.00 | Lemartes: Guardian of the Lost |
| W40K-0399 | `cassius` | novel | 2 | 0 | 0 | 1.00 | Cassius |
| W40K-0400 | `shrike` | novel | 2 | 0 | 0 | 1.00 | Shrike |
| W40K-0401 | `azrael` | novel | 2 | 0 | 1 | 1.00 | Azrael |
| W40K-0402 | `orphans-of-the-kraken` | short_story | 2 | 1 | 0 | 1.00 | Orphans of the Kraken |
| W40K-0403 | `twelve-wolves` | short_story | 1 | 2 | 0 | 1.00 | Twelve Wolves |
| W40K-0404 | `the-relic` | short_story | 3 | 1 | 0 | 1.00 | The Relic |
| W40K-0405 | `the-trial-of-the-mantis-warrior` | short_story | 1 | 0 | 0 | 1.00 | The Trial of the Mantis Warrior |
| W40K-0406 | `the-returned` | short_story | 2 | 0 | 1 | 1.00 | The Returned |
| W40K-0407 | `at-gaius-point` | short_story | 2 | 1 | 0 | 1.00 | At Gaius Point |
| W40K-0408 | `the-last-detail` | short_story | 1 | 0 | 0 | 1.00 | The Last Detail |
| W40K-0409 | `hell-night` | short_story | 2 | 0 | 2 | 1.00 | Hell Night |
| W40K-0412 | `empire-of-lies` | novel | 3 | 0 | 1 | 1.00 | Empire of Lies |
| W40K-0413 | `farsight-blade-of-truth` | novel | 2 | 0 | 1 | 1.00 | Farsight: Blade Of Truth |
| W40K-0426 | `deathwatch-legends` | novel | 4 | 0 | 0 | 1.00 | Deathwatch (Legends) |
| W40K-0428 | `sons-of-corax` | collection | 2 | 0 | 0 | 1.00 | Sons of Corax |
| W40K-0430 | `space-wolves-scent-of-a-traitor` | short_story | 3 | 0 | 1 | 1.00 | Space Wolves: Scent of a Traitor |
| W40K-0431 | `shaso` | anthology | 1 | 0 | 2 | 1.00 | Shas'o |
| W40K-0435 | `shadowsun` | novella | 1 | 0 | 1 | 1.00 | Shadowsun |
| W40K-0436 | `warden-of-the-blade` | novel | 2 | 0 | 2 | 1.00 | Warden of the Blade |
| W40K-0437 | `castellan` | novel | 2 | 0 | 2 | 1.00 | Castellan |
| W40K-0442 | `carcharadons-red-tithe` | novel | 3 | 0 | 2 | 1.00 | Carcharadons: Red Tithe |
| W40K-0443 | `carcharadons-outer-dark` | novel | 3 | 0 | 1 | 1.00 | Carcharadons: Outer Dark |
| W40K-0444 | `carcharadons-void-exile` | novel | 2 | 0 | 0 | 1.00 | Carcharadons: Void Exile |
| W40K-0447 | `mephiston-blood-of-sanguinius` | novel | 1 | 0 | 1 | 1.00 | Mephiston: Blood of Sanguinius |
| W40K-0448 | `mephiston-revenant-crusade` | novel | 2 | 0 | 1 | 1.00 | Mephiston: Revenant Crusade |
| W40K-0454 | `cult-of-the-warmason` | novel | 3 | 0 | 0 | 1.00 | Cult of the Warmason |
| W40K-0455 | `cult-of-the-spiral-dawn` | novel | 2 | 0 | 0 | 1.00 | Cult of the Spiral Dawn |
| W40K-0461 | `the-voice-of-mars` | novel | 4 | 1 | 0 | 1.00 | The Voice of Mars |
| W40K-0462 | `meduson-wings` | novella | 3 | 1 | 0 | 1.00 | Meduson Wings |
| W40K-0466 | `resurrection` | novel | 1 | 0 | 1 | 1.00 | Resurrection |
| W40K-0468 | `divination` | collection | 1 | 0 | 1 | 1.00 | Divination |
| W40K-0470 | `cadian-honour` | novel | 2 | 0 | 1 | 1.00 | Cadian Honour |
| W40K-0472 | `shadow-of-the-eighth` | novel | 3 | 0 | 2 | 1.00 | Shadow of the Eighth |
| W40K-0476 | `war-of-secrets` | novel | 2 | 0 | 0 | 1.00 | War of Secrets |
| W40K-0477 | `of-honour-and-iron` | novel | 2 | 0 | 1 | 1.00 | Of Honour and Iron |
| W40K-0479 | `fist-of-the-imperium` | novel | 2 | 0 | 0 | 1.00 | Fist of the Imperium |
| W40K-0480 | `masters-of-shadow` | novel | 2 | 0 | 0 | 1.00 | Masters of Shadow |
| W40K-0486 | `attack-of-the-necron` | novel | 1 | 0 | 4 | 1.00 | Attack of the Necron |
| W40K-0487 | `claws-of-the-genestealer` | novel | 1 | 0 | 4 | 1.00 | Claws of the Genestealer |
| W40K-0488 | `secrets-of-the-tau` | novel | 2 | 0 | 5 | 1.00 | Secrets of the Tau |
| W40K-0489 | `war-of-the-orks` | novel | 2 | 0 | 5 | 1.00 | War of the Orks |
| W40K-0490 | `plague-of-the-nurglings` | novel | 4 | 0 | 4 | 1.00 | Plague of the Nurglings |
| W40K-0491 | `tomb-of-the-necron` | novel | 2 | 0 | 2 | 1.00 | Tomb of the Necron |
| W40K-0492 | `the-wicked-and-the-damned` | anthology | 3 | 0 | 0 | 1.00 | The Wicked and the Damned |
| W40K-0493 | `the-hunt` | short_story | 0 | 0 | 0 | 1.00 | The Hunt |
| W40K-0494 | `invocations` | anthology | 0 | 0 | 0 | 1.00 | Invocations |
| W40K-0495 | `nightbleed` | short_story | 0 | 0 | 0 | 1.00 | Nightbleed |
| W40K-0496 | `the-child-foretold` | short_story | 0 | 0 | 0 | 1.00 | The Child Foretold |
| W40K-0497 | `skull-throne` | short_story | 0 | 0 | 0 | 1.00 | Skull Throne |
| W40K-0498 | `maledictions` | anthology | 5 | 0 | 0 | 1.00 | Maledictions |
| W40K-0499 | `the-house-of-the-night-and-chain` | novel | 1 | 1 | 0 | 1.00 | The House of the Night and Chain |
| W40K-0500 | `the-colonels-monograph` | novella | 1 | 2 | 0 | 1.00 | The Colonel's Monograph |
| W40K-0501 | `the-oubliette` | novel | 0 | 0 | 0 | 1.00 | The Oubliette |
| W40K-0502 | `five-candles` | short_story | 0 | 0 | 0 | 1.00 | Five Candles |
| W40K-0503 | `a-moment-of-cruelty` | short_story | 0 | 0 | 0 | 1.00 | A Moment of Cruelty |
| W40K-0504 | `pentimento` | short_story | 0 | 0 | 0 | 1.00 | Pentimento |
| W40K-0505 | `the-cache` | short_story | 0 | 0 | 0 | 1.00 | The Cache |
| W40K-0506 | `the-reverie` | novel | 0 | 0 | 0 | 1.00 | The Reverie |
| W40K-0507 | `anathemas` | anthology | 0 | 0 | 0 | 1.00 | Anathemas |
| W40K-0508 | `sepulturum` | novel | 1 | 0 | 0 | 1.00 | Sepulturum |
| W40K-0509 | `the-deacon-of-wounds` | novel | 1 | 1 | 0 | 1.00 | The Deacon of Wounds |
| W40K-0510 | `the-harrowed-paths` | anthology | 0 | 0 | 0 | 1.00 | The Harrowed Paths |
| W40K-0511 | `the-vampire-genevieve` | omnibus | 0 | 0 | 0 | 1.00 | The Vampire Genevieve |
| W40K-0512 | `the-vintage` | novella | 0 | 0 | 0 | 1.00 | The Vintage |
| W40K-0513 | `the-isenbrach-horror` | novella | 0 | 0 | 0 | 1.00 | The Isenbrach Horror |
| W40K-0514 | `aberration` | novella | 0 | 0 | 0 | 1.00 | Aberration |
| W40K-0515 | `blood-drinker` | novella | 1 | 0 | 0 | 1.00 | Blood Drinker |
| W40K-0516 | `bird-of-change` | novella | 0 | 0 | 0 | 1.00 | Bird of Change |
| W40K-0517 | `the-accursed` | anthology | 4 | 0 | 0 | 1.00 | The Accursed |
| W40K-0518 | `the-bookkeepers-skull` | novel | 2 | 0 | 0 | 1.00 | The Bookkeeper's Skull |
| W40K-0519 | `gothgul-hollow` | novel | 0 | 0 | 0 | 1.00 | Gothgul Hollow |
| W40K-0520 | `the-stacks` | novella | 1 | 0 | 0 | 1.00 | The Stacks |
| W40K-0521 | `king-of-pigs` | short_story | 1 | 1 | 0 | 1.00 | King of Pigs |
| W40K-0522 | `the-somewhere-sister` | short_story | 0 | 0 | 0 | 1.00 | The Somewhere Sister |
| W40K-0523 | `the-gnarled-bough` | short_story | 0 | 0 | 0 | 1.00 | The Gnarled Bough |
| W40K-0524 | `pain-engine` | short_story | 1 | 0 | 0 | 1.00 | Pain Engine |
| W40K-0525 | `black-eyed-saint` | novel | 0 | 0 | 0 | 1.00 | Black-Eyed Saint |
| W40K-0526 | `the-resting-places` | anthology | 2 | 1 | 0 | 1.00 | The Resting Places |
| W40K-0527 | `unholy-tales-of-horror-woe-from-the-imperium` | omnibus | 3 | 0 | 0 | 1.00 | Unholy Tales of Horror & Woe From The Imperium |
| W40K-0533 | `the-martyrs-tomb` | novel | 4 | 0 | 0 | 1.00 | The Martyr's Tomb |
| W40K-0534 | `sea-of-souls` | novel | 3 | 1 | 0 | 1.00 | Sea of Souls |
| W40K-0537 | `no-peace-among-stars` | anthology | 4 | 0 | 0 | 1.00 | No Peace Among Stars |
| W40K-0539 | `no-good-men` | anthology | 1 | 1 | 0 | 1.00 | No Good Men |
| W40K-0541 | `flesh-and-steel` | novel | 2 | 2 | 0 | 1.00 | Flesh and Steel |
| W40K-0542 | `grim-repast` | novel | 1 | 2 | 0 | 1.00 | Grim Repast |
| W40K-0544 | `sanction-and-sin` | anthology | 1 | 2 | 0 | 1.00 | Sanction and Sin |
| W40K-0545 | `the-king-of-the-spoil` | novel | 0 | 3 | 0 | 1.00 | The King of the Spoil |
| W40K-0546 | `once-a-killer` | anthology | 1 | 2 | 0 | 1.00 | Once a Killer |
| W40K-0554 | `da-gobbos-revenge` | novella | 1 | 0 | 0 | 1.00 | Da Gobbo's Revenge |
| W40K-0555 | `da-gobbos-demise` | novella | 2 | 0 | 0 | 1.00 | Da Gobbo's Demise |
| W40K-0556 | `long-live-da-red-gobbo` | novella | 1 | 0 | 0 | 1.00 | Long Live Da Red Gobbo |
| W40K-0557 | `da-red-gobbos-last-stand` | novella | 1 | 0 | 0 | 1.00 | Da Red Gobbo's Last Stand |
| W40K-0559 | `ghazghkull-thraka-warlord-of-warlords` | novel | 2 | 0 | 1 | 1.00 | Ghazghkull Thraka: Warlord of Warlords |
| W40K-0560 | `renegades-harrowmaster` | novel | 2 | 0 | 1 | 1.00 | Renegades: Harrowmaster |
| W40K-0561 | `ghost-legion` | novel | 2 | 0 | 1 | 1.00 | Ghost Legion |
| W40K-0565 | `prisoners-of-waaagh` | novella | 2 | 0 | 0 | 1.00 | Prisoners of Waaagh! |
