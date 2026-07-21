# map-worlds — Review-Report (Brief 174 + 183)

> Generiert von `npm run import:map-worlds` — nicht von Hand editieren. Der Hand-Pfad ist `scripts/seed-data/source/map-worlds-curation.xlsx`: Sheet „Kuration“ hat eine Zeile pro Medien-Location ohne Match — `Aktion` = `link` (Excel-Welt existiert unter anderem Namen; `Ziel` = Welt-ID, deren `locationId` gesetzt wird), `rollup` (Werke an die Ziel-Welt anhängen, Herkunft via `via`), `pin` (neue Welt; `x`/`y`/`Segmentum`/`Klassifikation` Pflicht — `x`/`y` im SSOT-Pixelraum der Redditor-Excel, der Convert projiziert sie aufs Grid; Klassifikation „Region“ → `kind: region`) oder leer/`später` (offen). Sheet „Welten“ erzwingt pro Welt-ID ein `locationId` (oder `-`/`null` = bewusst ohne Match, z. B. Dubletten-Entkopplung) und/oder benennt die Welt per `Name-Override` um (nur Anzeigename; Welt-ID, Namens-Matching und Kurations-Ziele bleiben auf dem Excel-Namen). Danach Convert neu laufen lassen.

**Abdeckung: 1354 von 1710 Werk-Kanten (79.2 %) platziert** (matched/link/pin/rollup).

## 1. Match-Übersicht Excel ↔ Bestand

- Katalog-Welten gesamt: **1055** (992 aus der Excel, 63 Kurations-Pins)
- Verknüpft mit einer `locations.json`-Row: **156** Welten (149 verschiedene Locations)
- Davon mit ≥1 eigenem Werk (Buch/Podcast, ohne Rollup): **154**

| Welt-ID | Name | locationId | Bücher | Episoden |
|---|---|---|---:|---:|
| `adrastapol` | Adrastapol | `adrastapol` | 2 | 0 |
| `aexe-cardinal` | Aexe Cardinal | `aexe_cardinal` | 2 | 0 |
| `agrellan` | Agrellan | `agrellan` | 3 | 0 |
| `alaitoc` | Alaitoc | `alaitoc` | 4 | 0 |
| `alaric-prime` | Alaric Prime | `alaric_prime` | 2 | 0 |
| `alaxxes-nebula` | Alaxxes Nebula | `alaxxes_nebula` | 3 | 0 |
| `alecto` | Alecto | `alecto` | 0 | 0 |
| `ancreon-sextus` | Ancreon Sextus | `ancreon_sextus` | 2 | 0 |
| `armageddon` | Armageddon | `armageddon` | 25 | 14 |
| `armatura` | Armatura | `armatura` | 1 | 0 |
| `baal` | Baal | `baal` | 8 | 5 |
| `balhaut` | Balhaut | `balhaut` | 2 | 0 |
| `balopolis` | Balopolis | `balopolis` | 2 | 0 |
| `barbarus` | Barbarus | `barbarus` | 2 | 2 |
| `beta-garmon-iv` | Beta Garmon IV | `beta_garmon` | 3 | 0 |
| `blackstone-fortress` | Blackstone Fortress | `blackstone_fortress` | 4 | 2 |
| `blackstone-fortress-2` | Blackstone Fortress | `blackstone_fortress` | 4 | 2 |
| `blackstone-fortress-3` | Blackstone Fortress | `blackstone_fortress` | 4 | 2 |
| `blackstone-fortress-4` | Blackstone Fortress | `blackstone_fortress` | 4 | 2 |
| `cadia` | Cadia | `cadia` | 10 | 13 |
| `caliban` | Caliban | `caliban` | 11 | 5 |
| `calixis` | Calixis | `calixis` | 1 | 0 |
| `calth` | Calth | `calth` | 24 | 4 |
| `cao-quo` | Cao Quo | `cao_quo` | 1 | 0 |
| `chemos` | Chemos | `chemos` | 1 | 3 |
| `chogoris` | Chogoris | `chogoris` | 3 | 2 |
| `chondax` | Chondax | `chondax` | 4 | 1 |
| `colchis` | Colchis | `colchis` | 3 | 1 |
| `commorragh` | Commorragh | `commorragh` | 12 | 16 |
| `commorragh-2` | Commorragh | `commorragh` | 12 | 16 |
| `commorragh-3` | Commorragh | `commorragh` | 12 | 16 |
| `commorragh-4` | Commorragh | `commorragh` | 12 | 16 |
| `commorragh-5` | Commorragh | `commorragh` | 12 | 16 |
| `cretacia` | Cretacia | `cretacia` | 3 | 1 |
| `cryptus-system` | Cryptus-System | `cryptus` | 6 | 0 |
| `cthonia` | Cthonia | `cthonia` | 1 | 1 |
| `dalyth` | Dalyth | `dalyth` | 3 | 0 |
| `damask` | Damask | `damask` | 1 | 0 |
| `damnos` | Damnos | `damnos` | 2 | 0 |
| `damocles-gulf` | Damocles Gulf | `damocles_gulf` | 12 | 1 |
| `dasht-i-kevar` | Dasht i-Kevar | `dasht_i_kevar` | 2 | 0 |
| `davin` | Davin | `davin` | 7 | 2 |
| `deliverance` | Deliverance | `deliverance` | 4 | 2 |
| `dolumar-iv` | Dolumar IV | `dolumar_iv` | 1 | 0 |
| `dulmalin` | Dulma'lin | `dulma_lin` | 1 | 0 |
| `durer` | Durer | `durer` | 1 | 0 |
| `duriel` | Duriel | `duriel` | 1 | 0 |
| `eastern-fringe` | Eastern Fringe | `eastern_fringe` | 3 | 2 |
| `eechan` | Eechan | `eechan` | 1 | 0 |
| `elaras-veil` | Elara's Veil | `elaras_veil` | 1 | 0 |
| `enothis` | Enothis | `enothis` | 1 | 0 |
| `eustis-majoris` | Eustis Majoris | `eustis_majoris` | 4 | 0 |
| `eye-of-terror` | Eye of Terror | `eye_of_terror` | 43 | 20 |
| `fenris` | Fenris | `fenris` | 22 | 5 |
| `fortis-binary` | Fortis Binary | `fortis_binary` | 2 | 0 |
| `garm` | Garm | `garm` | 2 | 0 |
| `gathalamor` | Gathalamor | `gathalamor` | 1 | 0 |
| `gereon` | Gereon | `gereon` | 3 | 0 |
| `ghoul-stars` | Ghoul Stars | `ghoul_stars` | 3 | 1 |
| `gnostes` | Gnostes | `gnostes` | 1 | 0 |
| `golgotha` | Golgotha | `golgotha` | 4 | 0 |
| `gothic-sector` | Gothic Sector | `gothic_sector` | 3 | 1 |
| `gravalax` | Gravalax | `gravalax` | 1 | 0 |
| `gryphonne-iv` | Gryphonne IV | `gryphonne_iv` | 1 | 0 |
| `gudrun` | Gudrun | `gudrun` | 3 | 0 |
| `hagia` | Hagia | `hagia` | 2 | 0 |
| `halo-stars` | Halo Stars | `halo_stars` | 1 | 1 |
| `heletine` | Heletine | `heletine` | 1 | 0 |
| `herodor` | Herodor | `herodor` | 2 | 0 |
| `hubris` | Hubris | `hubris` | 2 | 0 |
| `hydra-cordatus` | Hydra Cordatus | `hydra_cordatus` | 5 | 1 |
| `hydraphur` | Hydraphur | `hydraphur` | 4 | 0 |
| `iax` | Iax | `iax` | 3 | 1 |
| `inwit` | Inwit | `inwit` | 1 | 1 |
| `istvaan-iii` | Istvaan III | `istvaan_iii` | 8 | 8 |
| `istvaan-v` | Istvaan V | `istvaan_v` | 27 | 12 |
| `iyanden` | Iyanden | `iyanden` | 2 | 2 |
| `jago` | Jago | `jago` | 2 | 0 |
| `kaelor` | Kaelor | `kaelor` | 1 | 0 |
| `kathur` | Kathur | `kathur` | 2 | 0 |
| `khur` | Khur | `khur` | 1 | 0 |
| `kiavahr` | Kiavahr | `kiavahr` | 1 | 1 |
| `kronus` | Kronus | `kronus` | 1 | 0 |
| `laeran` | Laeran | `laeran` | 2 | 3 |
| `lastrati` | Lastrati | `lastrati` | 1 | 0 |
| `luna` | Luna | `luna` | 8 | 0 |
| `machorta-sound` | Machorta Sound | `machorta_sound` | 1 | 0 |
| `macragge` | Macragge | `macragge` | 21 | 5 |
| `mars` | Mars | `mars` | 17 | 14 |
| `medusa` | Medusa | `medusa` | 5 | 4 |
| `menazoid-epsilon` | Menazoid Epsilon | `menazoid_epsilon` | 2 | 0 |
| `miral` | Miral | `miral` | 1 | 0 |
| `mistral` | Mistral | `mistral` | 3 | 0 |
| `molech` | Molech | `molech` | 3 | 2 |
| `moloch` | Arthas Moloch | `arthas_moloch` | 1 | 1 |
| `monthax` | Monthax | `monthax` | 2 | 0 |
| `necromunda` | Necromunda | `necromunda` | 21 | 9 |
| `nikaea` | Nikaea | `nikaea` | 2 | 0 |
| `nocturne` | Nocturne | `nocturne` | 13 | 2 |
| `nostramo` | Nostramo | `nostramo` | 4 | 6 |
| `nuceria` | Nuceria | `nuceria` | 7 | 3 |
| `octarius` | Octarius | `octarius` | 2 | 7 |
| `olympia` | Olympia | `olympia` | 1 | 1 |
| `orestes` | Orestes | `orestes` | 1 | 0 |
| `pariah-nexus` | Pariah Nexus | `pariah_nexus` | 2 | 3 |
| `parmenio` | Parmenio | `parmenio` | 1 | 1 |
| `pavonis` | Pavonis | `pavonis` | 6 | 0 |
| `periremunda` | Periremunda | `periremunda` | 1 | 0 |
| `perlia` | Perlia | `perlia` | 2 | 0 |
| `phaedra` | Phaedra | `phaedra` | 3 | 0 |
| `phalanx` | Phalanx | `phalanx` | 4 | 0 |
| `phall` | Phall | `phall` | 6 | 0 |
| `phantine` | Phantine | `phantine` | 3 | 0 |
| `phobian` | Phobian | `phobian` | 1 | 0 |
| `piscina` | Piscina | `piscina_iv` | 2 | 0 |
| `precipice` | Precipice | `precipice` | 4 | 1 |
| `prospero` | Prospero | `prospero` | 13 | 2 |
| `pyrites` | Pyrites | `pyrites` | 2 | 0 |
| `quadravidia` | Quadravidia | `quadravidia` | 1 | 0 |
| `rezlan-vi` | Rezlan VI | `rezlan_vi` | 1 | 0 |
| `rynns-world` | Rynn's World | `rynns_world` | 3 | 1 |
| `sabbat-worlds` | Sabbat Worlds | `sabbat` | 28 | 1 |
| `saltire-vex` | Saltire Vex | `saltire_vex` | 1 | 0 |
| `salvations-reach` | Salvation's Reach | `salvations_reach` | 2 | 0 |
| `sancour` | Sancour | `sancour` | 4 | 0 |
| `sanctuary-101` | Sanctuary 101 | `sanctuary_101` | 2 | 0 |
| `sanctus-reach` | Sanctus Reach | `sanctus_reach` | 3 | 0 |
| `scarus-sector` | Scarus Sector | `scarus` | 7 | 0 |
| `scintilla` | Scintilla | `scintilla` | 0 | 0 |
| `signus-prime` | Signus Prime | `signus_prime` | 2 | 2 |
| `solemnace` | Solemnace | `solemnace` | 3 | 1 |
| `sotha` | Sotha | `sotha` | 10 | 1 |
| `sycorax` | Sycorax | `sycorax` | 1 | 0 |
| `tallarn` | Tallarn | `tallarn` | 9 | 2 |
| `tanith` | Tanith | `tanith` | 2 | 1 |
| `tarsis-ultra` | Tarsis Ultra | `tarsis_ultra` | 3 | 0 |
| `tartarus` | Tartarus | `tartarus` | 2 | 0 |
| `tau` | T'au | `tau_empire` | 1 | 12 |
| `terra` | Terra | `terra` | 100 | 80 |
| `the-black-library` | The Black Library | `black_library_place` | 2 | 2 |
| `the-maelstrom` | The Maelstrom | `maelstrom` | 5 | 5 |
| `the-rock` | The Rock | `rock` | 3 | 2 |
| `thracian-primaris` | Thracian Primaris | `thracian_primaris` | 2 | 0 |
| `thramas-sector` | Thramas Sector | `thramas_sector` | 1 | 0 |
| `tsagualsa` | Tsagualsa | `tsagualsa` | 4 | 0 |
| `ulthwe` | Ulthwé | `ulthwe` | 2 | 1 |
| `urdesh` | Urdesh | `urdesh` | 5 | 0 |
| `van-horne` | Van Horne | `van_horne` | 2 | 0 |
| `verghast` | Verghast | `verghast` | 2 | 1 |
| `vigilus` | Vigilus | `vigilus` | 0 | 6 |
| `vilamus` | Vilamus | `vilamus` | 2 | 0 |
| `viorlos` | Vior'los | `vior_los` | 1 | 0 |
| `viridia` | Viridia | `viridia` | 1 | 0 |
| `voltemand` | Voltemand | `voltemand` | 3 | 0 |
| `vraks-prime` | Vraks Prime | `vraks_prime` | 1 | 10 |
| `yassilli-sarum` | Yassilli Sarum | `yassilli_sarum` | 2 | 0 |

## 2. Nachplatzierungs-Worklist — offene Medien-Locations

**237** `locations.json`-Rows tragen ≥1 Werk und sind weder verknüpft noch gerollt — absteigend nach Werk-Zahl. Zum Abarbeiten: Zeile in der Kurations-Excel mit einer `Aktion` versehen (s. Kopf), Convert neu laufen lassen.

| locationId | Name | Bücher | Episoden |
|---|---|---:|---:|
| `great_rift` | The Great Rift | 9 | 8 |
| `webway` | Webway | 8 | 7 |
| `imperium_nihilus` | Imperium Nihilus | 12 | 1 |
| `candleworld` | Candleworld | 4 | 0 |
| `orath` | Orath | 4 | 0 |
| `acheron` | Acheron | 3 | 0 |
| `antikef` | Antikef | 3 | 0 |
| `killing_ground` | Killing Ground | 3 | 0 |
| `rogar_iii` | Rogar III | 3 | 0 |
| `salinas` | Salinas | 3 | 0 |
| `velchanos_magna` | Velchanos Magna | 3 | 0 |
| `aerius` | Aerius | 2 | 0 |
| `anaxian_line` | Anaxian Line | 2 | 0 |
| `astagar` | Astagar | 2 | 0 |
| `boros_gate` | Boros Gate | 2 | 0 |
| `broucheroc` | Broucheroc | 2 | 0 |
| `caldera` | Caldera | 1 | 1 |
| `chaeroneia` | Chaeroneia | 2 | 0 |
| `civitas_beati` | Civitas Beati | 2 | 0 |
| `crannog_mons` | Crannog Mons | 2 | 0 |
| `croatoas` | Croatoas | 2 | 0 |
| `crythe` | Crythe | 2 | 0 |
| `daniks_world` | Danik's World | 2 | 0 |
| `demetrius` | Demetrius | 2 | 0 |
| `diamat` | Diamat | 2 | 0 |
| `dwell` | Dwell | 2 | 0 |
| `dynikas_v` | Dynikas V | 2 | 0 |
| `gabal` | Gabal | 1 | 1 |
| `galaspar` | Galaspar | 2 | 0 |
| `galt` | Galt | 2 | 0 |
| `gondwa_vi` | Gondwa VI | 2 | 0 |
| `hieronymous_theta` | Hieronymous Theta | 2 | 0 |
| `hive_blackbracken` | Hive Blackbracken | 2 | 0 |
| `hopes_end` | Hope's End | 2 | 0 |
| `hyades` | Hyades | 2 | 0 |
| `ilissus` | Ilissus | 2 | 0 |
| `ironfound` | Ironfound | 2 | 0 |
| `iydris` | Iydris | 2 | 0 |
| `kiros` | Kiros | 2 | 0 |
| `lentonia` | Lentonia | 2 | 0 |
| `lepidus_prime` | Lepidus Prime | 2 | 0 |
| `loki` | Loki | 2 | 0 |
| `lycheate` | Lycheate | 2 | 0 |
| `malouri` | Malouri | 2 | 0 |
| `medina_corridor` | Medina Corridor | 2 | 0 |
| `morod` | Morod | 1 | 1 |
| `neva` | Neva | 2 | 0 |
| `nusquam_fundumentibus` | Nusquam Fundumentibus | 2 | 0 |
| `ophelia_vii` | Ophelia VII | 2 | 0 |
| `piamen` | Piamen | 2 | 0 |
| `port_of_anguish` | Port of Anguish | 2 | 0 |
| `pythos` | Pythos | 2 | 0 |
| `rahes_paradise` | Rahe's Paradise | 2 | 0 |
| `ras_shakeh` | Ras Shakeh | 2 | 0 |
| `sabulorb` | Sabulorb | 2 | 0 |
| `sedh` | Sedh | 2 | 0 |
| `selaaca` | Selaaca | 2 | 0 |
| `shadow_point` | Shadow Point | 2 | 0 |
| `sin_of_damnation` | Sin of Damnation | 2 | 0 |
| `solemnus` | Solemnus | 2 | 0 |
| `stalinvast` | Stalinvast | 2 | 0 |
| `steel_tread` | Steel Tread | 2 | 0 |
| `stratos` | Stratos | 2 | 0 |
| `tanakreg` | Tanakreg | 2 | 0 |
| `terathalion` | Terathalion | 2 | 0 |
| `typhos_prime` | Typhos Prime | 2 | 0 |
| `vanqualis` | Vanqualis | 2 | 0 |
| `venam` | Venam | 2 | 0 |
| `visage` | Visage | 2 | 0 |
| `zartak` | Zartak | 1 | 1 |
| `absolom` | Absolom | 1 | 0 |
| `adumbria` | Adumbria | 1 | 0 |
| `agarimethea` | Agarimethea | 1 | 0 |
| `aghoru` | Aghoru | 1 | 0 |
| `alia` | Alia | 1 | 0 |
| `almace` | Almace | 1 | 0 |
| `andrioch` | Andrioch | 1 | 0 |
| `ardamantua` | Ardamantua | 1 | 0 |
| `attruso` | Attruso | 1 | 0 |
| `aurelia` | Subsector Aurelia | 1 | 0 |
| `bacchus` | Bacchus | 1 | 0 |
| `bale_stars` | Bale Stars | 1 | 0 |
| `ballards_run` | Ballard's Run | 1 | 0 |
| `bastion` | Bastion | 1 | 0 |
| `belmos_vii` | Belmos VII | 1 | 0 |
| `black_reach` | Black Reach | 1 | 0 |
| `byzas` | Byzas | 1 | 0 |
| `castellax` | Castellax | 1 | 0 |
| `casus_belli` | Casus Belli | 1 | 0 |
| `ceocan` | Ceocan | 1 | 0 |
| `cepharil` | Cepharil | 1 | 0 |
| `certus_minor` | Certus-Minor | 1 | 0 |
| `charchera_system` | Charchera System | 1 | 0 |
| `chertes` | Chertes | 1 | 0 |
| `constanix_ii` | Constanix II | 1 | 0 |
| `cressida` | Cressida | 1 | 0 |
| `crucible` | Crucible | 1 | 0 |
| `cybele` | Cybele | 1 | 0 |
| `darkand` | Darkand | 1 | 0 |
| `deighton` | Deighton | 1 | 0 |
| `diamantus` | Diamantus | 1 | 0 |
| `dim_zone` | Dim Zone | 1 | 0 |
| `divinatus_prime` | Divinatus Prime | 1 | 0 |
| `doahht` | Doahht | 1 | 0 |
| `dominicus_prime` | Dominicus Prime | 1 | 0 |
| `dominion` | Dominion | 1 | 0 |
| `donatos` | Donatos | 1 | 0 |
| `drechia` | Drechia | 1 | 0 |
| `duat` | Duat | 1 | 0 |
| `dulan` | Dulan | 1 | 0 |
| `dulcis` | Dulcis | 1 | 0 |
| `ector` | Ector | 1 | 0 |
| `equixus` | Equixus | 1 | 0 |
| `eternal_starforge_hold` | Kindred of the Eternal Starforge Hold ship | 1 | 0 |
| `euphoros` | Euphoros | 1 | 0 |
| `fabris_calivant` | Fabris Calivant | 1 | 0 |
| `fidem_iv` | Fidem IV | 1 | 0 |
| `floodgrave` | Floodgrave | 1 | 0 |
| `formosa_sector` | Formosa Sector | 1 | 0 |
| `fortuna_minor` | Fortuna Minor | 1 | 0 |
| `forty_seven_sixteen` | Forty-Seven Sixteen | 1 | 0 |
| `furia_penitens` | Furia Penitens | 1 | 0 |
| `galimo_prime` | Galimo Prime | 1 | 0 |
| `gathis_ii` | Gathis II | 1 | 0 |
| `geratomro` | Geratomro | 1 | 0 |
| `ghaslakh` | Ghaslakh | 1 | 0 |
| `ghyre` | Ghyre | 1 | 0 |
| `gildar_secundus` | Gildar Secundus | 1 | 0 |
| `gorro` | Gorro | 1 | 0 |
| `grayloc_manor` | Grayloc Manor | 1 | 0 |
| `hauts_bassiq` | Hauts Bassiq | 1 | 0 |
| `helwain` | Helwain | 1 | 0 |
| `hephaesto` | Hephaesto | 1 | 0 |
| `herodian_iv` | Herodian IV | 1 | 0 |
| `hevaran` | Hevaran | 1 | 0 |
| `hive_prome` | Hive Prome | 1 | 0 |
| `hive_tartarus` | Hive Tartarus | 1 | 0 |
| `hive_trazior` | Hive Trazior | 1 | 0 |
| `honoria` | Honoria | 1 | 0 |
| `iesta_veracrux` | Iesta Veracrux | 1 | 0 |
| `ikara_ix` | Ikara IX | 1 | 0 |
| `irkalla` | Irkalla | 1 | 0 |
| `iron_blood` | Iron Blood | 1 | 0 |
| `ithaka` | Ithaka | 1 | 0 |
| `kalidar` | Kalidar | 1 | 0 |
| `kallash` | Kallash | 1 | 0 |
| `kamidar` | Kamidar | 1 | 0 |
| `kanai_tertius` | Kanai Tertius | 1 | 0 |
| `karybdis` | Karybdis | 1 | 0 |
| `kepris` | Kepris | 1 | 0 |
| `khadar` | Khadar | 1 | 0 |
| `kolovan` | Kolovan | 1 | 0 |
| `kurbynola_system` | Kurbynola System | 1 | 0 |
| `lazulai` | Lazulai | 1 | 0 |
| `legitur` | Legitur | 1 | 0 |
| `lesser_damantyne` | Lesser Damantyne | 1 | 0 |
| `lubentina` | Lubentina | 1 | 0 |
| `lysios` | Lysios | 1 | 0 |
| `malodrax` | Malodrax | 1 | 0 |
| `malpertuis` | Malpertuis | 1 | 0 |
| `malveil` | Malveil | 1 | 0 |
| `morningstar` | Morningstar | 1 | 0 |
| `morsus` | Morsus | 1 | 0 |
| `nicomedua` | Nicomedua | 1 | 0 |
| `numinus` | Numinus | 1 | 0 |
| `nurth` | Nurth | 1 | 0 |
| `occluda_noctis` | Occluda Noctis | 1 | 0 |
| `oleris_iii` | Oleris III | 1 | 0 |
| `one_five_four_four` | One-Five-Four Four | 1 | 0 |
| `opal` | Opal | 1 | 0 |
| `opis` | Opis | 1 | 0 |
| `oran` | Oran | 1 | 0 |
| `orymous` | Orymous | 1 | 0 |
| `pelago` | Pelago | 1 | 0 |
| `percepton_primus` | Percepton Primus | 1 | 0 |
| `perdition` | Perdition | 1 | 0 |
| `phlegethon` | Phlegethon | 1 | 0 |
| `piety_v` | Piety V | 1 | 0 |
| `pontus_avernes` | Pontus Avernes | 1 | 0 |
| `port_sanctus` | Port Sanctus | 1 | 0 |
| `potence` | Potence | 1 | 0 |
| `proxima_apocryphis` | Proxima Apocryphis | 1 | 0 |
| `quintus` | Quintus | 1 | 0 |
| `quradim` | Quradim | 1 | 0 |
| `ras_hanem` | Ras Hanem | 1 | 0 |
| `reef_stars` | Reef Stars | 1 | 0 |
| `regium` | Regium | 1 | 0 |
| `rilis` | Rilis | 1 | 0 |
| `ring_of_iron` | Ring of Iron | 1 | 0 |
| `rotauri` | Rotauri | 1 | 0 |
| `sabien` | Sabien | 1 | 0 |
| `sacramentus` | Sacramentus | 1 | 0 |
| `sagaraya` | Sagaraya | 1 | 0 |
| `saim_hann` | Saim-Hann | 1 | 0 |
| `sandava_ii` | Sandava II | 1 | 0 |
| `sandava_iii` | Sandava III | 1 | 0 |
| `sargassion_reach` | Sargassion Reach | 1 | 0 |
| `sarosh` | Sarosh | 1 | 0 |
| `schadenhold` | Schadenhold | 1 | 0 |
| `serrine` | Serrine | 1 | 0 |
| `severitas` | Severitas | 1 | 0 |
| `shardenus` | Shardenus | 1 | 0 |
| `sigmatus` | Sigmatus | 1 | 0 |
| `silent_kingdom` | Silent Kingdom | 1 | 0 |
| `simia_orichalcae` | Simia Orichalcae | 1 | 0 |
| `solace` | Solace | 1 | 0 |
| `solo_baston` | Solo-Baston | 1 | 0 |
| `styxia_prime` | Styxia Prime | 1 | 0 |
| `targian` | Targian | 1 | 0 |
| `tatricala` | Tatricala | 1 | 0 |
| `telkens_rest` | Telken's Rest | 1 | 0 |
| `tempest` | Tempest | 1 | 0 |
| `temple_of_shades` | Temple of Shades | 1 | 0 |
| `thawra` | Thawra | 1 | 0 |
| `the_spoil` | The Spoil | 1 | 0 |
| `thennos` | Thennos | 1 | 0 |
| `theotokos` | Theotokos | 1 | 0 |
| `thoas` | Thoas | 1 | 0 |
| `tsadrekha` | Tsadrekha | 1 | 0 |
| `valoria_quintus` | Valoria Quintus | 1 | 0 |
| `vansen_falls` | Vansen Falls | 1 | 0 |
| `vaporis` | Vaporis | 1 | 0 |
| `velbayne` | Velbayne | 1 | 0 |
| `velua` | Velua | 1 | 0 |
| `vernailis` | Vernailis | 1 | 0 |
| `vincula_city` | Vincula City | 1 | 0 |
| `virger_mos_ii` | Virger-Mos II | 1 | 0 |
| `vondrak` | Vondrak | 1 | 0 |
| `voor` | Voor | 1 | 0 |
| `vorganthian` | Vorganthian | 1 | 0 |
| `vorlese` | Vorlese | 1 | 0 |
| `xana_tisiphone` | Xana-Tisiphone | 1 | 0 |
| `zalathras` | Zalathras | 1 | 0 |
| `zalidar` | Zalidar | 1 | 0 |
| `zaramund` | Zaramund | 1 | 0 |
| `ziasuthra` | Ziasuthra | 1 | 0 |
| `zoah` | Zoah | 1 | 0 |

## 3. Angewandte Kuration

### Links (6)

| locationId | Name | → Welt-ID(s) | Werke |
|---|---|---|---:|
| `tau_empire` | T'au Empire | `tau` | 13 |
| `black_library_place` | Black Library | `the-black-library` | 4 |
| `beta_garmon` | Beta-Garmon | `beta-garmon-iv` | 3 |
| `dalyth` | Dal'yth | `dalyth` | 3 |
| `piscina_iv` | Piscina IV | `piscina` | 2 |
| `arthas_moloch` | Arthas Moloch | `moloch` | 2 |

### Rollups (57)

| locationId | Name | → Welt-ID(s) | Werke |
|---|---|---|---:|
| `ultramar` | Ultramar | `macragge` | 40 |
| `imperial_palace` | Imperial Palace | `terra` | 32 |
| `hive_primus` | Hive Primus | `necromunda` | 20 |
| `underhive` | Underhive | `necromunda` | 20 |
| `fang` | The Fang | `fenris` | 13 |
| `ullanor` | Ullanor | `armageddon` | 13 |
| `sol_system` | Sol System | `terra` | 12 |
| `varangantua` | Varangantua | `alecto` | 11 |
| `medrengard` | Medrengard | `eye-of-terror` | 8 |
| `planet_of_the_sorcerers` | Planet of the Sorcerers | `prospero` | 8 |
| `vengeful_spirit` | Vengeful Spirit | `eye-of-terror` | 7 |
| `spire` | The Spire | `necromunda` | 5 |
| `tizca` | Tizca | `prospero` | 5 |
| `helican` | Helican Subsector | `gudrun` | 4 |
| `monarchia` | Monarchia | `khur` | 4 |
| `pluto` | Pluto | `terra` | 4 |
| `asaheim` | Asaheim | `fenris` | 3 |
| `eltath` | Eltath | `urdesh` | 3 |
| `lions_gate_spaceport` | Lion's Gate Spaceport | `terra` | 3 |
| `baal_secundus` | Baal Secundus | `baal` | 2 |
| `cirenholm` | Cirenholm | `phantine` | 2 |
| `deshea` | Desh'ea | `nuceria` | 2 |
| `drakaasi` | Drakaasi | `eye-of-terror` | 2 |
| `eternity_gate` | Eternity Gate | `terra` | 2 |
| `ferrozoica` | Ferrozoica | `verghast` | 2 |
| `hinzerhaus` | Hinzerhaus | `jago` | 2 |
| `jupiter` | Jupiter | `terra` | 2 |
| `ouranberg` | Ouranberg | `phantine` | 2 |
| `pharos` | Pharos | `sotha` | 2 |
| `queen_mab` | Queen Mab | `sancour` | 2 |
| `spaeton_house` | Spaeton House | `gudrun` | 2 |
| `titan` | Titan | `terra` | 2 |
| `vervunhive` | Vervunhive | `verghast` | 2 |
| `albia` | Albia | `terra` | 1 |
| `arx_tyrannus` | Arx Tyrannus | `badab` | 1 |
| `citadel_of_vraks` | Citadel of Vraks | `vraks-prime` | 1 |
| `delphic_battlement` | Delphic Battlement | `terra` | 1 |
| `eternity_wall_spaceport` | Eternity Wall Spaceport | `terra` | 1 |
| `fallen_dome_of_periculus` | Fallen Dome of Periculus | `necromunda` | 1 |
| `golden_throne` | Golden Throne | `terra` | 1 |
| `gyptus` | Gyptus | `terra` | 1 |
| `hy_brasil` | Hy Brasil | `terra` | 1 |
| `illyrium` | Illyrium | `macragge` | 1 |
| `imperial_webway` | Imperial Webway | `terra` | 1 |
| `isle_of_st_capilene` | Isle of St Capilene | `sancour` | 1 |
| `ithraca` | Ithraca | `calth` | 1 |
| `junktion` | Junktion | `necromunda` | 1 |
| `kadillus_harbour` | Kadillus Harbour | `piscina` | 1 |
| `macragges_honour` | Macragge's Honour | `macragge` | 1 |
| `mercury_wall` | Mercury Wall | `terra` | 1 |
| `molechs_enlightenment` | Molech's Enlightenment | `molech` | 1 |
| `northwilds` | Northwilds | `caliban` | 1 |
| `sanctum_imperialis` | Sanctum Imperialis | `terra` | 1 |
| `saturnine_gate` | Saturnine Gate | `terra` | 1 |
| `sicarus` | Sicarus | `eye-of-terror` | 1 |
| `torvendis` | Torvendis | `the-maelstrom` | 1 |
| `urgall_depression` | Urgall Depression | `istvaan-v` | 1 |

### Pins (63)

| locationId | Welt-ID | Name | kind | x | y | gx | gy | Werke |
|---|---|---|---|---:|---:|---:|---:|---:|
| `istvaan_v` | `istvaan-v` | Istvaan V | `unclassified` | 3447 | 1604 | 490.05 | 154.95 | 39 |
| `sabbat` | `sabbat-worlds` | Sabbat Worlds | `region` | 1127 | 4135 | 159.96 | 515.07 | 29 |
| `istvaan_iii` | `istvaan-iii` | Istvaan III | `unclassified` | 3489 | 1647 | 496.03 | 161.07 | 16 |
| `damocles_gulf` | `damocles-gulf` | Damocles Gulf | `region` | 5942 | 4381 | 845.05 | 550.07 | 13 |
| `sotha` | `sotha` | Sotha | `unclassified` | 6469 | 5210 | 920.04 | 668.02 | 11 |
| `nostramo` | `nostramo` | Nostramo | `unclassified` | 5555 | 1675 | 789.99 | 165.05 | 10 |
| `alecto` | `alecto` | Alecto | `unclassified` | 2955 | 5013 | 420.05 | 639.99 | 8 |
| `luna` | `luna` | Luna | `imperial` | 2370 | 3324 | 336.82 | 399.68 | 8 |
| `scarus` | `scarus-sector` | Scarus Sector | `region` | 1654 | 1288 | 234.94 | 109.99 | 7 |
| `cryptus` | `cryptus-system` | Cryptus-System | `unclassified` | 4923 | 2223 | 700.07 | 243.02 | 6 |
| `eastern_fringe` | `eastern-fringe` | Eastern Fringe | `region` | 6850 | 3300 | 974.25 | 396.26 | 5 |
| `pariah_nexus` | `pariah-nexus` | Pariah Nexus | `region` | 4400 | 2300 | 625.65 | 253.98 | 5 |
| `ghoul_stars` | `ghoul-stars` | Ghoul Stars | `region` | 5871 | 1429 | 834.95 | 130.05 | 4 |
| `gothic_sector` | `gothic-sector` | Gothic Sector | `region` | 3025 | 1745 | 430.01 | 175.01 | 4 |
| `iax` | `iax` | Iax | `unclassified` | 6307 | 5083 | 896.99 | 649.95 | 4 |
| `sancour` | `sancour` | Sancour | `unclassified` | 1514 | 1372 | 215.02 | 121.94 | 4 |
| `tsagualsa` | `tsagualsa` | Tsagualsa | `unclassified` | 6504 | 3818 | 925.02 | 469.96 | 4 |
| `alaxxes_nebula` | `alaxxes-nebula` | Alaxxes Nebula | `region` | 2950 | 2250 | 419.34 | 246.86 | 3 |
| `gereon` | `gereon` | Gereon | `unclassified` | 1303 | 4310 | 185 | 539.97 | 3 |
| `gudrun` | `gudrun` | Gudrun | `unclassified` | 1739 | 1344 | 247.03 | 117.95 | 3 |
| `mistral` | `mistral` | Mistral | `unclassified` | 1795 | 1253 | 255 | 105.01 | 3 |
| `phaedra` | `phaedra` | Phaedra | `unclassified` | 6258 | 4627 | 890.01 | 585.07 | 3 |
| `phantine` | `phantine` | Phantine | `unclassified` | 987 | 4345 | 140.04 | 544.95 | 3 |
| `sanctus_reach` | `sanctus-reach` | Sanctus Reach | `region` | 3250 | 1900 | 462.02 | 197.06 | 3 |
| `tarsis_ultra` | `tarsis-ultra` | Tarsis Ultra | `unclassified` | 6050 | 4980 | 860.42 | 635.3 | 3 |
| `ulthwe` | `ulthwe` | Ulthwé | `aeldari` | 1725 | 1991 | 245.04 | 210.01 | 3 |
| `voltemand` | `voltemand` | Voltemand | `unclassified` | 1230 | 4230 | 174.61 | 528.58 | 3 |
| `aexe_cardinal` | `aexe-cardinal` | Aexe Cardinal | `unclassified` | 1175 | 4295 | 166.79 | 537.83 | 2 |
| `alaric_prime` | `alaric-prime` | Alaric Prime | `unclassified` | 3270 | 1930 | 464.87 | 201.33 | 2 |
| `ancreon_sextus` | `ancreon-sextus` | Ancreon Sextus | `unclassified` | 1245 | 4175 | 176.75 | 520.76 | 2 |
| `balhaut` | `balhaut` | Balhaut | `unclassified` | 1075 | 4150 | 152.56 | 517.2 | 2 |
| `balopolis` | `balopolis` | Balopolis | `unclassified` | 1155 | 4385 | 163.94 | 550.64 | 2 |
| `dasht_i_kevar` | `dasht-i-kevar` | Dasht i-Kevar | `unclassified` | 5900 | 4550 | 839.08 | 574.12 | 2 |
| `fortis_binary` | `fortis-binary` | Fortis Binary | `unclassified` | 1010 | 4290 | 143.31 | 537.12 | 2 |
| `garm` | `garm` | Garm | `unclassified` | 2900 | 2450 | 412.23 | 275.32 | 2 |
| `hagia` | `hagia` | Hagia | `unclassified` | 1090 | 4230 | 154.69 | 528.58 | 2 |
| `herodor` | `herodor` | Herodor | `unclassified` | 1160 | 4120 | 164.65 | 512.93 | 2 |
| `hubris` | `hubris` | Hubris | `unclassified` | 1760 | 1310 | 250.02 | 113.12 | 2 |
| `jago` | `jago` | Jago | `unclassified` | 1250 | 4350 | 177.46 | 545.66 | 2 |
| `kathur` | `kathur` | Kathur | `unclassified` | 2050 | 2250 | 291.28 | 246.86 | 2 |
| `menazoid_epsilon` | `menazoid-epsilon` | Menazoid Epsilon | `unclassified` | 1050 | 4310 | 149 | 539.97 | 2 |
| `monthax` | `monthax` | Monthax | `unclassified` | 1140 | 4270 | 161.81 | 534.28 | 2 |
| `perlia` | `perlia` | Perlia | `unclassified` | 5250 | 3450 | 746.59 | 417.6 | 2 |
| `pyrites` | `pyrites` | Pyrites | `unclassified` | 1300 | 4200 | 184.57 | 524.32 | 2 |
| `salvations_reach` | `salvations-reach` | Salvation's Reach | `unclassified` | 1350 | 4430 | 191.69 | 557.04 | 2 |
| `tartarus` | `tartarus` | Tartarus | `unclassified` | 5700 | 4100 | 810.62 | 510.09 | 2 |
| `yassilli_sarum` | `yassilli-sarum` | Yassilli Sarum | `unclassified` | 1620 | 1330 | 230.1 | 115.96 | 2 |
| `calixis` | `calixis` | Calixis | `region` | 1300 | 1100 | 184.57 | 83.24 | 1 |
| `cao_quo` | `cao-quo` | Cao Quo | `unclassified` | 6200 | 4550 | 881.76 | 574.12 | 1 |
| `damask` | `damask` | Damask | `unclassified` | 1700 | 1400 | 241.48 | 125.92 | 1 |
| `durer` | `durer` | Durer | `unclassified` | 1700 | 1300 | 241.48 | 111.69 | 1 |
| `eechan` | `eechan` | Eechan | `unclassified` | 1780 | 1370 | 252.87 | 121.65 | 1 |
| `elaras_veil` | `elaras-veil` | Elara's Veil | `region` | 6700 | 4600 | 952.9 | 581.23 | 1 |
| `gnostes` | `gnostes` | Gnostes | `unclassified` | 1210 | 4400 | 171.77 | 552.77 | 1 |
| `gravalax` | `gravalax` | Gravalax | `unclassified` | 5980 | 4380 | 850.46 | 549.93 | 1 |
| `halo_stars` | `halo-stars` | Halo Stars | `region` | 1050 | 700 | 149 | 26.32 | 2 |
| `kronus` | `kronus` | Kronus | `unclassified` | 5900 | 4250 | 839.08 | 531.43 | 1 |
| `periremunda` | `periremunda` | Periremunda | `unclassified` | 5450 | 3900 | 775.05 | 481.63 | 1 |
| `quadravidia` | `quadravidia` | Quadravidia | `unclassified` | 5850 | 4500 | 831.96 | 567 | 1 |
| `rezlan_vi` | `rezlan-vi` | Rezlan VI | `unclassified` | 5800 | 4650 | 824.85 | 588.34 | 1 |
| `saltire_vex` | `saltire-vex` | Saltire Vex | `unclassified` | 6000 | 4600 | 853.31 | 581.23 | 1 |
| `thramas_sector` | `thramas-sector` | Thramas Sector | `region` | 6450 | 3750 | 917.33 | 460.29 | 1 |
| `vraks_prime` | `vraks-prime` | Vraks Prime | `unclassified` | 1580 | 1240 | 224.41 | 103.16 | 11 |

### Welten-Overrides (1)

| Welt-ID | locationId | Name-Override |
|---|---|---|
| `moloch` | (unverändert) | Arthas Moloch |

## 4. Excel-Namensdubletten + angewandte Regel

**Regel: keep-all mit Ordinal-Suffix.** Wiederholte Namen sind auf der Quellkarte überwiegend legitime Mehrfach-Objekte (Flotten an mehreren Positionen, Webway-Gates, Blackstone Fortresses) — es wird KEINE Zeile verworfen. Wiederholte Slugs bekommen in Sheet-Reihenfolge deterministische Suffixe (`-2`, `-3`, …). Alle Instanzen eines Namens matchen dieselbe Location (gleiches `locationId`, gleiche Werke); einzelne Pins lassen sich über Sheet „Welten“ (`locationId-Override` = `-`) entkoppeln.

### Black Templar Fleet (3×)

| Welt-ID | Excel-Zeile | gx | gy | Segmentum |
|---|---:|---:|---:|---|
| `black-templar-fleet` | 39 | 324.86 | 271.62 | Obscurus |
| `black-templar-fleet-2` | 44 | 370.96 | 211.15 | Obscurus |
| `black-templar-fleet-3` | 208 | 193.96 | 300.79 | Pacificus |

### Blackstone Fortress (4×)

| Welt-ID | Excel-Zeile | gx | gy | Segmentum |
|---|---:|---:|---:|---|
| `blackstone-fortress` | 234 | 118.27 | 489.88 | Pacificus |
| `blackstone-fortress-2` | 235 | 126.8 | 270.77 | Pacificus |
| `blackstone-fortress-3` | 685 | 631.77 | 392.99 | Ultima |
| `blackstone-fortress-4` | 686 | 566.32 | 406.08 | Ultima |

### Canopus (2×)

| Welt-ID | Excel-Zeile | gx | gy | Segmentum |
|---|---:|---:|---:|---|
| `canopus` | 65 | 203.07 | 153.81 | Obscurus |
| `canopus-2` | 445 | 217.44 | 544.24 | Tempestus |

### Commorragh (5×)

| Welt-ID | Excel-Zeile | gx | gy | Segmentum |
|---|---:|---:|---:|---|
| `commorragh` | 126 | 323.73 | 91.49 | Obscurus |
| `commorragh-2` | 422 | 203.92 | 592.47 | Tempestus |
| `commorragh-3` | 423 | 222.56 | 675.28 | Tempestus |
| `commorragh-4` | 766 | 828.69 | 70.15 | Ultima |
| `commorragh-5` | 768 | 616.4 | 363.96 | Ultima |

### Contra Empyric Nexus (3×)

| Welt-ID | Excel-Zeile | gx | gy | Segmentum |
|---|---:|---:|---:|---|
| `contra-empyric-nexus` | 237 | 131.36 | 234.2 | Pacificus |
| `contra-empyric-nexus-2` | 326 | 268.38 | 507.95 | Solar |
| `contra-empyric-nexus-3` | 704 | 617.54 | 597.73 | Ultima |

### Gramarye (2×)

| Welt-ID | Excel-Zeile | gx | gy | Segmentum |
|---|---:|---:|---:|---|
| `gramarye` | 298 | 250.88 | 485.19 | Solar |
| `gramarye-2` | 356 | 249.45 | 484.19 | Solar |

### Imperial Fists Fleet (2×)

| Welt-ID | Excel-Zeile | gx | gy | Segmentum |
|---|---:|---:|---:|---|
| `imperial-fists-fleet` | 386 | 449.22 | 562.73 | Tempestus |
| `imperial-fists-fleet-2` | 549 | 648.13 | 150.96 | Ultima |

### Jericho-Maw Warp Gate (2×)

| Welt-ID | Excel-Zeile | gx | gy | Segmentum |
|---|---:|---:|---:|---|
| `jericho-maw-warp-gate` | 119 | 182.01 | 125.64 | Obscurus |
| `jericho-maw-warp-gate-2` | 682 | 925.02 | 585.5 | Ultima |

### Prescience (2×)

| Welt-ID | Excel-Zeile | gx | gy | Segmentum |
|---|---:|---:|---:|---|
| `prescience` | 318 | 308.93 | 358.41 | Solar |
| `prescience-2` | 405 | 564.04 | 693.21 | Tempestus |

### Sarum (2×)

| Welt-ID | Excel-Zeile | gx | gy | Segmentum |
|---|---:|---:|---:|---|
| `sarum` | 80 | 217.3 | 102.59 | Obscurus |
| `sarum-2` | 678 | 556.22 | 400.53 | Ultima |

### Startide Nexus (2×)

| Welt-ID | Excel-Zeile | gx | gy | Segmentum |
|---|---:|---:|---:|---|
| `startide-nexus` | 683 | 805.5 | 373.35 | Ultima |
| `startide-nexus-2` | 684 | 906.23 | 560.17 | Ultima |

### The Gates of Fire (2×)

| Welt-ID | Excel-Zeile | gx | gy | Segmentum |
|---|---:|---:|---:|---|
| `the-gates-of-fire` | 333 | 228.25 | 405.51 | Solar |
| `the-gates-of-fire-2` | 334 | 242.48 | 417.32 | Solar |

## 5. ID-Kollisionen (verschiedene Namen → gleicher Basis-Slug)

Keine — jeder Basis-Slug stammt von genau einem (ggf. wiederholten) Namen.

## 6. Medien-Ableitung (JSON-first, DB-frei)

Quellen: `scripts/seed-data/books/*.json` (geteilter Resolver-Pfad `resolveLocations`, wie `apply:book`) + `curation-overlay.json`-Location-Tail (wie `apply:curation-overlay`) + `ingest/podcasts/<show>.json` (Junction-Regeln aus `apply-plan.ts`, wie `apply:podcast`). Der Convert läuft ohne DB-Verbindung.

- Bücher im Korpus: 896, davon mit ≥1 Location-Kante: 748 (1333 Kanten)
- Overlay-Location-Tail: 15 Adds, 2 Removes
- Podcast-Shows: 4, Episoden: 1102, davon mit ≥1 Location-Kante: 280 (377 Kanten, 0 FK-Drops)

Read-only `work_locations`-Stichprobe (Verifikations-Check, kein Datenpfad): siehe Impl-Report `sessions/2026-07-02-174-impl-map-ssot-reconciliation.md` § Verification.
