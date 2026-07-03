# podcast-aliases — unresolved surface-form review (Brief 175)

Triage des Podcast-Alias-Backlogs (Luetin09 Lore-Scope + Lorehammer Voll-Lauf, Stand 2026-07-03).
Eindeutige Fälle (Ziel-Entity existiert bereits) wurden direkt als Aliases in
`character-aliases.json` / `faction-aliases.json` / `location-aliases.json` ergänzt — **57 Formen
aufgelöst** (6 Luetin, 51 Lorehammer). Die **175 Restformen (166 distinkt)** unten brauchen eine
Entscheidung von Philipp: Entity anlegen, Alias auf bestehende Entity setzen, oder bewusst
unaufgelöst lassen (`unresolved` ist im Artefakt kein Fehler, sondern der dokumentierte Zustand).

So wird ein Eintrag erledigt: **(a)** neue Entity in `characters.json` / `factions.json` /
`locations.json` anlegen (danach ggf. Alias-Varianten in den Sidecar), **(b)** Alias auf eine
bestehende Entity in den passenden `*-aliases.json` eintragen, oder **(c)** Zeile hier streichen =
bewusst unaufgelöst. Nach jeder Kuration: betroffene Shows re-assemblen
(`--tagging=cc-direct --stage=assemble`), sonst driftet `test:podcast-cc-direct`.

Spalten: Achse (LLM-Guess), Form (verbatim), Häufigkeit (Episoden je Show: LU = Luetin09,
LH = Lorehammer), Einschätzung.

## Summary

- Backlog gesamt (pre-Kuration): **48 LU + 184 LH = 232 Formen**
- Direkt als Alias aufgelöst: **57** (Sidecars, dieser PR)
- Auf dieser Review-Liste: **175 (166 distinkt)** — davon ~90 echte Lore-Kandidaten, ~12
  Sammelbegriffe, ~5 ambig, ~59 vermutlich Homebrew/episodenspezifisch

## A — Neue-Entity-Kandidaten (echte 40k-Lore)

### A1 — Top-Kandidat: der Warp

| Achse | Form | Häufigkeit | Einschätzung |
|---|---|---|---|
| location | the Warp | LU ×4, LH ×14 | **Häufigste unaufgelöste Form überhaupt.** Location-Entity `immaterium` („The Immaterium/The Warp") anlegen; danach Aliases „the Warp", „Immaterium", „the Immaterium". |
| location | Immaterium | LH ×1 | → gleicher Eintrag |
| location | the Immaterium | LH ×1 | → gleicher Eintrag |

### A2 — Charaktere (real, prominent)

| Achse | Form | Häufigkeit | Einschätzung |
|---|---|---|---|
| character | Goge Vandire | LU ×2 | Age of Apostasy, High Lord/Tyrann — echte Lücke |
| character | Sebastian Thor | LU ×2 | Age of Apostasy, Reformator — echte Lücke (Paar mit Vandire) |
| character | Kryptman / Inquisitor Kryptman | LU ×1, LH ×1 | Ordo-Xenos-Inquisitor (Tyraniden-Lore) — beide Formen auf eine Entity |
| character | Illuminor Szeras | LU ×1 | Necron-Cryptek (eigenes Modell/Novellen) |
| character | Imotekh the Stormlord | LH ×1 | Necron-Phaeron der Sautekh (Fraktion `sautekh_dynasty` existiert schon) |
| character | Be'lakor | LH ×1 | Erster Daemon Prince — prominente Lücke |
| character | Vashtorr the Arkifane | LH ×1 | Arks of Omen — neuere Lore |
| character | Sly Marbo | LU ×1 | Catachan-Legende |
| character | Demetrian Titus | LU ×1 | Space Marine (2) Protagonist, inzwischen auch BL-Romane; s.a. „Titus" unter C |
| character | Centurius | LU ×1 | Legion of the Damned (Fraktion existiert) |
| character | Commander Puretide | LH ×1 | T'au-Stratege (Farsight/Shadowsun-Lehrer) |
| character | Kais | LH ×1 | T'au (Fire Warrior); Vorsicht: kurzer Name, ggf. nur mit Voll-Kontext anlegen |
| character | Urlock Gaur | LH ×1 | Sabbat-Kriege, Archon der Blood Pact (Fraktion existiert) |
| character | Swarmlord | LH ×2 | benannter Tyraniden-Organismus |
| character | Old One Eye | LH ×1 | benannter Tyraniden-Organismus |
| character | Void Dragon | LH ×2 | C'tan; Alternative: Alias → faction `ctan` statt eigener Entity |
| character | Konor Guilliman | LH ×1 | Roboutes Ziehvater — **nicht** `roboute_guilliman`; „Konor" ist zudem eine Welt in Ultramar |

### A3 — Götter (eigene Entities oder Alias auf Fraktion — Philipps Grundsatzentscheidung)

Präzedenz im Sidecar wäre „Chaos Gods" → `chaos`; individuelle benannte Gottheiten wurden hier
bewusst NICHT automatisch gemappt.

| Achse | Form | Häufigkeit | Einschätzung |
|---|---|---|---|
| character | Gork | LU ×1, LH ×2 | Ork-Gott; Alias-Alternative → `orks` |
| character | Mork | LU ×1, LH ×2 | Ork-Gott; Alias-Alternative → `orks` |
| location | Gorkamorka | LU ×1 | kombinierte Gottheit (LLM-Guess location); Alias-Alternative → `orks` |
| character | Cegorach | LH ×1 | Aeldari-Gott (Laughing God); Alias-Alternative → `harlequins` |
| character | Isha | LH ×1 | Aeldari-Göttin; Alias-Alternative → `eldar` |
| character | Kurnous | LH ×1 | Aeldari-Gott; Alias-Alternative → `eldar` |
| character | Khaela Mensha Khaine | LH ×1 | Aeldari-Kriegsgott; Alias-Alternative → `eldar` |
| character | Malal / Malice | LU ×1, LH ×3 (char+faction) | 5. Chaosgott (apokryph) — Cluster mit „Sons of Malice" (A4) und „Cult of the Doomed Ones"/„Doomed Ones" (LH ×2, eigene Folge) |

### A4 — Fraktionen/Rassen (real)

| Achse | Form | Häufigkeit | Einschätzung |
|---|---|---|---|
| faction | Old Ones | LU ×4, LH ×2 | War-in-Heaven-Rasse — zweithäufigste echte Lücke |
| faction | Men of Iron | LU ×2 | Dark-Age-KI — echte Lücke |
| faction | Necrontyr | LU ×1, LH ×2 | Vorläufer-Rasse der Necrons — lore-distinkt, kein sauberer Alias auf `necrons` |
| faction | Bad Moons | LH ×3 | Ork-Klan; Peers `goffs`/`evil_sunz`/`blood_axes` existieren als eigene Entities |
| faction | Farsight Enclaves | LH ×3 | T'au-Abspaltung, kanonisch eigenständig (Charakter-Alias „Farsight" existiert) |
| faction | Sons of Malice | LU ×1, LH ×1 | reales Renegade-Chapter (Malice-Cluster, A3) |
| faction | Minotaurs | LH ×1 | reales Chapter — **nicht** `brazen_minotaurs` (anderes Chapter!) |
| faction | Fire Hawks | LU ×1 | reales Chapter (Vorläufer der Legion of the Damned — `legion_of_the_damned` existiert) |
| faction | Elysian Drop Troops | LH ×1 | reales IG-Regiment; Peers (Catachan, Krieg, Mordian, …) sind eigene Entities |
| faction | Mordant Acid Dogs | LU ×1 | reales IG-Regiment |
| faction | Mephrit Dynasty | LH ×1 | reale Necron-Dynastie (`sautekh_dynasty` als Peer) |

### A5 — Minor-Xenos-Block (je LH ×1, aus den „Minor Xenos"-Folgen)

Fra'al, Galg, Q'orl, Rak'Gol, Stryxis, Slaugth, Loxatl, Khrave, Nicassar, Vespid, Demiurg,
Jokaero, Zoats, Slanni, Tarellians, Umbra, Thyrrus, Nekulli, Lacrymole, Medusae, Sslyth,
Yu'vath, Megarachnid — alles reale (teils sehr alte) Xenos-Rassen. Dazu mit unsicherer
Schreibweise/Provenienz: Enoulians, Jindarii, Viskeon. Empfehlung: als Block entscheiden —
entweder eine Welle „Minor Xenos"-Entities anlegen oder den Block bewusst unaufgelöst lassen;
einzelne Highlights (Jokaero, Vespid, Demiurg, Loxatl) ggf. vorziehen.

### A6 — Locations (real)

| Achse | Form | Häufigkeit | Einschätzung |
|---|---|---|---|
| location | Nachmund Gauntlet | LU ×3 | Warp-Korridor (Vigilus-Kontext; `vigilus` existiert) |
| location | Koronus Expanse | LU ×2 | Rogue-Trader-Region; Cluster mit „The Maw" (LU ×1, die Passage dorthin) |
| location | Segmentum Solar | LH ×2 | Galaxis-Segment; Block mit Obscurus/Pacificus/Tempestus/Ultima (je LH ×1) |
| location | Astronomican | LH ×1 | psychisches Leuchtfeuer — location-artig, prominent |
| location | Ryza | LU ×1 | Forge World (Peer `gryphonne_iv` existiert) |
| location | Zhao-Arkhad | LU ×1 | Forge World (AdMech/Necron-Romane) |
| location | Vostroya | LH ×1 | Heimatwelt (`vostroyan_firstborn` existiert als Fraktion) |
| location | Pech | LH ×1 | Kroot-Heimatwelt (`kroot` existiert) |
| location | Elysium | LH ×1 | Regiments-Heimatwelt (Paar mit „Elysian Drop Troops", A4) |
| location | Skalathrax | LH ×1 | berühmtes Khorne/Khârn-Schlachtfeld |
| location | Charadon | LU ×1 | Ork-Reich / War Zone Charadon |
| location | Lorn V | LU ×1 | Dawn of War: Winter Assault |
| location | Murder | LH ×1 | HH „Murder" (Urisarach) — Paar mit Megarachnid (A5) |
| location | Hive Secundus | LU ×1 | Necromunda (Peer `hive_primus` existiert) |
| location | Garden of Nurgle | LH ×2 | Daemon-Realm; Block mit „Forge of Souls" (LH ×1) |

### A7 — RPG-/Spiel-Cluster (real publiziert, aber Nicht-BL-Kanon — als Block entscheiden)

| Cluster | Formen | Einschätzung |
|---|---|---|
| Only War (FFG) | Severan Dominate (LH ×5), Duke Severus XIII (LH ×5), Spinward Front (LH ×3), Kulth (LH ×2), Kokyotos (LH ×2) | eigene Lorehammer-Folgenserie 115–119; echte FFG-Publikation. Aufnehmen oder RPG-Kanon bewusst ausklammern? |
| Darktide | Atoma Prime (LU ×1), Tertium (LU ×1), Moebian Domain (LU ×1) | Spiel-Kanon; als Block entscheiden |

## B — Sammelbegriffe / Kategorien (Empfehlung: bewusst unaufgelöst lassen)

| Achse | Form | Häufigkeit | Begründung |
|---|---|---|---|
| faction | Primarchs | LH ×2 | Sammelbegriff über Charaktere, keine Fraktion |
| faction | Heretics | LH ×1 | zu generisch (Listener-Lore-Folge, mentioned) |
| faction | Abhumans | LH ×1 | Kategorie (Ogryns/Ratlings/Squats existieren einzeln); eigene Folge 17 bliebe subject-los |
| faction | Minor Xenos Races | LH ×2 | Kategoriebegriff (die konkreten Rassen s. A5) |
| location | Tomb Worlds | LU ×1, LH ×1 | Weltklasse, keine konkrete Welt |
| location | Crone Worlds | LU ×1 | dito |
| location | Daemon Worlds | LU ×1, LH ×1 | dito |
| location | Maiden Worlds | LU ×1 | dito |
| faction | Death Cult Assassins | LU ×1 | Unit-Typ ohne sauberen Eltern (nicht Officio Assassinorum) |
| faction | Ambull | LU ×1 | Kreatur/Gattung, keine Fraktion |
| faction | Cold Traders | LH ×1 | Rogue-Trader-Milieubegriff |
| faction | Liber Malleus | LH ×1 | Buch/Begriff, keine Fraktion |

## C — Ambig (kein globaler Alias vertretbar)

| Achse | Form | Häufigkeit | Begründung |
|---|---|---|---|
| faction | Phoenix Guard | LH ×1 | Kontext ist die EC-30k-Folge (EC-Elite), kollidiert aber mit der Eldar-Bedeutung (Biel-Tan) — ein globaler Alias würde Buch-Resolves verfälschen |
| character | Titus | LH ×1 | vermutlich Demetrian Titus, aber „Titus" allein ist zu generisch als globaler Schlüssel |
| character | Beast of Armageddon | LH ×1 | Epithet Ghazghkulls — Empfehlung: Alias → `ghazghkull_thraka`, wenn Philipp die Zuordnung bestätigt |
| location | Nephilim Sector | LU ×1 | mehrere „Nephilim"-Referenzen im Kanon (Sektor/Jericho-Reach vs. DA-Kontext) |

## D — Vermutlich Homebrew / podcast-intern / episodenspezifisch (Empfehlung: ignorieren)

Lorehammers „By Blade and Bolter"-Serie und „Listener Lore"-Folgen sind Fan-/Host-Homebrew;
Luetins Reste sind episodenspezifische Nebenfiguren. Keine Entities anlegen.

| Achse | Form | Häufigkeit | Hinweis |
|---|---|---|---|
| faction | Knights of Slaughter | LH ×5 | „By Blade and Bolter" (Homebrew-Chapter-Serie) |
| faction | Crimson Armada | LH ×4 | dito |
| faction | Brass Legion | LH ×1 | dito |
| faction | House Belli Obligatus | LH ×1 | dito |
| faction | House Arokis | LH ×1 | vermutlich dito/Listener Lore |
| faction | House Koldere | LH ×1 | dito |
| faction | Iron Skulls | LH ×2 | Hobby-Armee eines Hosts („Mark's Iron Skulls") |
| faction | Nihivokh Dynasty | LH ×1 | vermutlich Host-Homebrew (vgl. „Erik's Nekhebet Dynasty", Bonus 11) |
| faction | Nyuserra Dynasty | LH ×1 | dito |
| faction | Hive Fleet Grendyllus | LH ×1 | vermutlich Homebrew-Hive-Fleet |
| faction | Loota Kult | LH ×1 | Listener Lore 7 |
| faction | Fenrisian Einherjar | LH ×1 | Listener Lore 12 |
| faction | Ghost Wolves | LH ×1 | Listener Lore 18 |
| faction | Bleachskullz | LH ×1 | Homebrew-Ork-Mob |
| faction | Abyssal Krakens | LH ×1 | Homebrew |
| faction | Astra Crota | LH ×1 | Homebrew/unklar |
| faction | Death Songs Chapter | LH ×1 | Homebrew/unklar |
| faction | Iron Marines | LH ×1 | Homebrew/unklar |
| faction | Void Hunter Chapter | LH ×1 | Homebrew/unklar |
| faction | Stormbreakers | LH ×1 | unklar (es gibt ein neueres GW-Chapter dieses Namens — nur bei Bedarf prüfen) |
| faction | Order of the Crimson Lily | LH ×1 | Homebrew/unklar (Sororitas-Stil) |
| faction | The Reforge | LH ×1 | episodenspezifisch/unklar |
| faction | The Unbound | LH ×1 | episodenspezifisch („Chaos Unbound"-Bonusfolgen) |
| faction | Oretti | LH ×1 | unklar |
| faction | Eaters of Cities | LH ×1 | episodenspezifisch |
| faction | Chromes | LH ×1 | vermutlich Necromunda-Milieu/Homebrew |
| faction | Lorehammer | LH ×1 | der Podcast hat sich selbst getaggt — Noise |
| character | Bugrat Skumdreg | LH ×1 | Homebrew-Ork |
| character | Grizgutz | LU ×1 | Ork-Nebenfigur (Gorkamorka-Spiel), mentioned |
| character | Ancestor Lord Bilboa | LH ×1 | vermutlich Homebrew (Votann-Stil) |
| character | Dromlach | LH ×1 | episodenspezifisch/unklar |
| character | Marckus | LH ×1 | episodenspezifisch/unklar |
| character | Christoph | LH ×1 | episodenspezifisch/unklar |
| character | Stefan | LH ×1 | episodenspezifisch/unklar (mentioned) |
| character | Solomon Zane | LH ×1 | unklar (mentioned) |
| character | Varak | LH ×1 | episodenspezifisch/unklar |
| character | Mon'praus | LH ×1 | episodenspezifisch/unklar (T'au-Stil) |
| character | Colonel Bane | LU ×1 | episodenspezifisch/unklar |
| character | Corporal Varlak | LU ×1 | episodenspezifisch/unklar (mentioned; **nicht** `varl`) |
| character | Lyubov | LU ×1 | episodenspezifisch/unklar |
| location | Ohmsworld | LH ×2 | episodenspezifisch/unklar |
| location | Black Hold | LH ×1 | episodenspezifisch/unklar |
| location | Cedrinum | LH ×1 | episodenspezifisch/unklar |
| location | Cerberus II | LH ×1 | episodenspezifisch/unklar |
| location | Korelia | LH ×1 | episodenspezifisch/unklar (mentioned) |
| location | Nurien Alpha | LH ×1 | episodenspezifisch/unklar |
| location | Stavon IX | LH ×1 | episodenspezifisch/unklar |
| location | Startide Nexus | LH ×1 | episodenspezifisch/unklar |
| location | Viđrfold | LH ×1 | episodenspezifisch/unklar (Fenris-Stil) |
| location | Naxos | LU ×1 | episodenspezifisch/unklar |
| location | Rophanon | LU ×1 | episodenspezifisch/unklar |
