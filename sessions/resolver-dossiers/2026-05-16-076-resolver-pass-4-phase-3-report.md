---
report: 2026-05-16-076-resolver-pass-4-phase-3
brief: sessions/2026-05-16-076-arch-resolver-batch-4-axis-sliced.md
dossier: sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-dossier.md
phase: 3
axis: characters
status: done
generated: 2026-05-16
---

# Phase 3 (Characters) — Done summary

> Per-Phase-Statusdatei laut Brief 076 § Phasen-Write-Scopes / Erratum-Punkt 4+8. Kurze Done-Summary. Finaler konsolidierter impl-Report folgt in Phase 4.

## Outcome

40 neue Character-Rows in `scripts/seed-data/characters.json` (129 → 169). 3 neue Aliase in `scripts/seed-data/character-aliases.json` (23 → 26). 13 neue Resolver-Test-Cases in `scripts/test-resolver.ts` (Acceptance ≥ 5, ≥ 2 alias-consolidation; geliefert 10 direct + 3 alias-consolidation). `npm run test:resolver` grün: **116 passed, 0 failed** (103 + 13 neue).

Kein `needs-decision`-Stop. Alle vier Phase-3-Domain Cross-Batch-Cases (Mad Donna / D'onne Ulanti, Kal Jerico classic-vs-modern, Lord Helmawr classic-†-vs-modern, Lieutenant Kage / the Burned Man) sind nach Cowork-Default + Dossier-Verdict (alle vier `Cowork-default akzeptiert`) entschieden. Case 5 (Soul Drinkers Firstborn vs. Primaris) ist Faction-Domain und in Phase 1 abgeschlossen — Phase 3 nutzt nur das Resultat (`soul_drinkers` als single-Row für Sarpedon / Daenyathos / Iktinos / Tellos).

## New character rows (40)

Logische Cluster-Gruppierung, Append-Only an `characters.json`:

### Space-Wolves-Saga (12)

| # | id | name | primaryFactionId | promotion reason |
| - | -- | ---- | ---------------- | ---------------- |
| 1 | `ragnar_blackmane` | Ragnar Blackmane | space_wolves | freq=8, saga POV |
| 2 | `strybjorn_grimskull` | Strybjorn Grimskull | space_wolves | freq=4, saga POV |
| 3 | `sven_brujothirson` | Sven Brujothirson | space_wolves | freq=4, saga POV |
| 4 | `ranek` | Ranek | space_wolves | freq=3, Wolf-Priest-Mentor |
| 5 | `kjel` | Kjel | space_wolves | freq=2, Curse-of-the-Wulfen-Tragedy |
| 6 | `berek_thunderfist` | Berek Thunderfist | space_wolves | freq=3, Wolf-Lord |
| 7 | `ivan_sternberg` | Ivan Sternberg | inquisition | freq=2, Inquisitor-Quest-Giver |
| 8 | `madox` | Madox | thousand_sons | freq=4, Tzeentch-Sorcerer arch-antagonist |
| 9 | `gabriela_belisarius` | Gabriela Belisarius | house_belisarius | freq=2, Wolfblade-Navigator |
| 10 | `torin` | Torin | space_wolves | freq=2, Wolfblade-Companion |
| 11 | `ivar_krakenblood` | Ivar Krakenblood | space_wolves | freq=1 lore-iconic (Krakenblood-Title POV) |
| 12 | `ulrik_the_slayer` | Ulrik the Slayer | space_wolves | freq=1 lore-iconic (third-edition Space-Wolves Wolf-Priest, Cowork-Dossier-Kandidat) |

### Necromunda (13)

| # | id | name | primaryFactionId | promotion reason |
| - | -- | ---- | ---------------- | ---------------- |
| 13 | `kal_jerico` | Kal Jerico | necromunda | freq=4, Multi-Era one-row (D2) |
| 14 | `wotan` | Wotan | necromunda | freq=3, Kal-Companion |
| 15 | `scabbs` | Scabbs | necromunda | freq=2, Kal-Sidekick |
| 16 | `yoland` | Yoland | necromunda | freq=2, Kal-Psyker-Companion |
| 17 | `gerontius_helmawr` | Lord Gerontius Helmawr | house_helmawr | freq=2, classic Helmawr (D3) |
| 18 | `lord_helmawr` | Lord Helmawr | house_helmawr | freq=1, modern Helmawr split (D3) |
| 19 | `cardinal_crimson` | Cardinal Crimson | redemptionists | freq=2, Kal-Antagonist (W40K-0169 Title) |
| 20 | `mad_donna` | Mad Donna | house_escher | freq=2, Cross-Batch-Konsolidierung (D1) |
| 21 | `iktomi` | Iktomi | ratskins | freq=2, Ratskin-Guide |
| 22 | `caleb_cursebound` | Caleb Cursebound | necromunda | freq=2, Cursebound-Saga-POV |
| 23 | `brielle` | Brielle | house_escher | freq=1 lore-iconic (Terminal-Overkill-POV) |
| 24 | `scrutinator_primus_servalen` | Scrutinator Primus Servalen | necromunda_enforcers | freq=1 lore-iconic (Soulless-Fury-Dual-POV) |
| 25 | `jarene` | Jarene | house_escher | freq=2, Wild-Cats-POV |

### Last-Chancers / Gothic-War (5)

| # | id | name | primaryFactionId | promotion reason |
| - | -- | ---- | ---------------- | ---------------- |
| 26 | `colonel_schaeffer` | Colonel Schaeffer | last_chancers | freq=5, LC-Commander |
| 27 | `lieutenant_kage` | Lieutenant Kage | last_chancers | freq=5, LC-POV + Cross-Batch-Konsolidierung (D4) |
| 28 | `lorii` | Lorii | last_chancers | freq=2, Sniper-Twin |
| 29 | `overlord_von_strab` | Overlord von Strab | astra_militarum | freq=2, Armageddon-Antagonist |
| 30 | `captain_leoten_sempter` | Captain Leoten Sempter | imperial_navy | freq=3, Gothic-War-Flag-Captain |

### Soul-Drinkers (7)

| # | id | name | primaryFactionId | promotion reason |
| - | -- | ---- | ---------------- | ---------------- |
| 31 | `sarpedon` | Sarpedon | soul_drinkers | freq=8, Chapter-Master |
| 32 | `daenyathos` | Daenyathos | soul_drinkers | freq=3, Founder-Philosopher |
| 33 | `iktinos` | Iktinos | soul_drinkers | freq=2, Chaplain-Traitor |
| 34 | `tellos` | Tellos | soul_drinkers | freq=2, Daemon-Fallen |
| 35 | `teturact` | Teturact | chaos | freq=2, Chaos-Sorcerer-Arch-Villain |
| 36 | `inquisitor_thaddeus` | Inquisitor Thaddeus | inquisition | freq=2, Hunter-of-Sarpedon |
| 37 | `yeceqath_voice_of_all` | Yeceqath the Voice of All | chaos | freq=1 lore-iconic (Primaris-Era-Arch-Heretic, Dossier-Kandidat) |

### Calpurnia (3)

| # | id | name | primaryFactionId | promotion reason |
| - | -- | ---- | ---------------- | ---------------- |
| 38 | `shira_calpurnia` | Shira Calpurnia | adeptus_arbites | freq=2, Arbites-POV |
| 39 | `lord_medell` | Lord Medell | imperium | freq=1 lore-iconic (Crossfire-Antagonist) |
| 40 | `hoyyon_phrax` | Hoyyon Phrax | rogue_traders | freq=1 lore-iconic (Phrax-Charter-Namensgeber) |

Idempotenz-Check: `node -e "const f=require('./scripts/seed-data/characters.json'); const ids=new Set(); for(const r of f){if(ids.has(r.id))throw new Error('dup: '+r.id); ids.add(r.id);}"` zeigt 169 rows, 0 Duplikate.

Alias-Target-Validity: `node -e "const a=require('./scripts/seed-data/character-aliases.json'); const c=require('./scripts/seed-data/characters.json'); const ids=new Set(c.map(r=>r.id)); for(const [k,v] of Object.entries(a)){if(!ids.has(v))throw new Error('alias '+k+' targets unknown id '+v);}"` zeigt 26 aliases, alle Targets sind valide canonical IDs.

## New aliases (3)

Alle drei sind explizite Cross-Batch-Konsolidierungen mit Surface-Form-Beleg in mindestens einem Override-File:

| surface form | canonical id | Cross-Batch-Case | Beleg-Bücher |
| ------------ | ------------ | ---------------- | ------------ |
| `D'onne Ulanti` | `mad_donna` | Case 1 (Mad Donna / D'onne Ulanti dual-POV) | W40K-0162, W40K-0177 (beide haben **beide** Surface-Forms als POV-Pair) |
| `Ragnar Thunderfist` | `ragnar_blackmane` | (kein cross-batch-Case, aber dual-surface-POV im Series-Opener) | W40K-0152 *Space Wolf* listet `Ragnar Blackmane` + `Ragnar Thunderfist` beide als POV — pre-/post-Blackmane-Cloak-Namensformen derselben Person, narratives Device. W40K-0158 omnibus reappearance. |
| `the Burned Man` | `lieutenant_kage` | Case 4 (Kage / the Burned Man dual-Surface in W40K-0185) | W40K-0185 *Armageddon Saint* (beide als POV; saint-cult-vs-Schaeffer-Naming-Device) |

Cowork-Faustregel "alias nur bei ≥1× konkret auftauchendem Surface-Form" eingehalten — jeder Alias-Surface-Form ist als `name`-Field im Override-File belegt. Override-File-Grep + Loop-Log-Cross-Reference dokumentiert in den Per-Decision-Begründungen unten.

## Decisions

### D1 — Mad Donna / D'onne Ulanti Cross-Batch-Konsolidierung (Dossier §5 Case 1)

**Gewählt:** Eine Row `mad_donna` (canonical name "Mad Donna"), `primaryFactionId='house_escher'`. Surface-Form `D'onne Ulanti` als Alias zu dieser Row.

**Begründung:**

- Cowork-Default akzeptiert: Loop-Log (Z. 729) + Dossier §5 Case 1 + Brief-Cowork-Tendenz aligned auf single-canonical-row. Spire-born ex-noble (House Ulanti) + Escher-aligned-Gang-Leader = derselbe Charakter, klares Pseudonym-Pattern. Override-Belege: W40K-0162 (classic *Survival Instinct*) + W40K-0177 (modern *Soulless Fury*) tagen **beide** `D'onne Ulanti` UND `Mad Donna` jeweils als POV — bestätigt dual-surface-Identität.
- Canonical-ID-Wahl `mad_donna` statt `d_onne_ulanti`: Cowork-Suggestion-Liste bot beide Optionen; CC wählt `mad_donna` weil (a) Underhive-legend-Name ist die stabilere Identitäts-Throughline über Imprint-Reboots hinweg, (b) modern-imprint-Revival (*Soulless Fury*-Hauptcharakter-Label) verwendet "Mad Donna" als Buch-Cover-Identifier, (c) `D'onne Ulanti` ist die Geburts-/Spire-Identität, die im narrativen Bogen zurückgelassen wird.
- `primaryFactionId='house_escher'` per `mabbon_etogaur`-Precedent ("primaryFactionId reflects current allegiance"): Mad Donna **fronted an House Escher gang** (Loop-Log W40K-0162 + W40K-0177), Spire-Ulanti-Origin ist Pre-Fall-Identity → notes documents both (Origin: House Ulanti / Current: Escher-gang). Alternative `house_ulanti` (Origin-Faction) geprüft und verworfen — `mabbon_etogaur`-Convention setzt "current allegiance" als Lead-Tag.

### D2 — Kal Jerico classic-vs-modern Cross-Batch-Konsolidierung (Dossier §5 Case 2)

**Gewählt:** Eine Row `kal_jerico`, `primaryFactionId='necromunda'`. Multi-Era-Surface-Form, kein Alias nötig (Direct-Match identisch über alle vier Bücher).

**Begründung:**

- Cowork-Default akzeptiert: Surface-Form bleibt identisch über Reboot-Grenze (W40K-0164/0169/0170 classic + W40K-0172 modern-Reynolds-Reboot — alle vier tagen exakt `"Kal Jerico"`). Soft-Reboot ist Stil-Reboot, keine Identitäts-Frage; same name + same setting (Necromunda Underhive) + same class (bounty hunter) + same canonical-illegitimate-Helmawr-bastard-throughline.
- Override-Lektüre: Reynolds' *Sinner's Bounty* (W40K-0172) zeigt **keinen** on-page-Re-Cast-Indikator (z. B. kein "neue Origin-Story", keine Reboot-Continuity-Bruch-Aussage); Loop-Log (Z. 729) explizit: "Resolver decision needed: one Kal-Jerico canonical entity with multi-era surface forms, or two distinct entities with shared name" — Phase-3-CC entscheidet pro single-entity.
- `primaryFactionId='necromunda'` (Phase-1-Mid-Knoten) statt `house_helmawr` (sein nominaler Spire-Stammhaus): Kal ist **independent bounty-hunter**, nicht als House-Mitglied operierend; Necromunda-Generic-Tag passt sauberer als House-Mitgliedschaft, die er ablehnt/nicht trägt.
- Verdict: Phase-3-CC stoppt **nicht** mit `needs-decision` (Dossier §5 Case 2 erlaubte Eskalation, falls Phase-3-Sub-Session re-cast-Evidenz findet — keine gefunden).

### D3 — Lord Helmawr classic-†-Gerontius vs. modern-(lebend) Cross-Batch-Konsolidierung (Dossier §5 Case 3)

**Gewählt:** Zwei Rows. Classic = `gerontius_helmawr` / "Lord Gerontius Helmawr"; modern = `lord_helmawr` / "Lord Helmawr". Beide `primaryFactionId='house_helmawr'`. Kein Alias zwischen ihnen.

**Begründung:**

- Cowork-Default akzeptiert: In-fiction-Continuity ist explizit gebrochen — Lord Gerontius Helmawr wird in *Lasgun Wedding* (W40K-0170) **on-page assassiniert** (Loop-Log Z. 725 + Override-Rationale ssot-w40k-017); Lord Helmawr in *Soulless Fury* (W40K-0177) ist **lebend, regiert wieder** (Loop-Log: "the modern imprint is best read as a soft-reboot that keeps the geographical / factional / cultural backdrop while resetting load-bearing character-state — most notably, Lord Helmawr is alive again"). Identitäts-Trennung sauberer als Multi-Era-Alias.
- Surface-Form-Disambiguation: classic Override-Files tagen **explizit "Lord Gerontius Helmawr"** mit first-name (W40K-0164 + W40K-0170); modern Override-File (W40K-0177) tagt **"Lord Helmawr"** ohne first-name. Cowork-Brief sagt "Phase-3-CC darf für die modern-Row einen `Lord Helmawr` ohne first-name-disambig wählen (Black-Library-Copy nennt ihn so)" — übernommen.
- Trade-off dokumentiert: Wenn eine zukünftige Override-File "Lord Helmawr" in einem classic-Buch-Kontext schreibt, würde der Resolver zur modern-Row direct-matchen (falsch). Brief autorisiert diese Trade-off-Wahl explizit. notes-Felder beider Rows dokumentieren die Disambiguation für künftige Maintainer-Lektüre.
- Verdict: Kein `needs-decision`-Stop (Brief-Loop-Log hat ausreichend Lore-Klarheit; "die in-fiction-Continuity ist explizit gebrochen" — keine modern-Loop-Coverage-Lücke).

### D4 — Lieutenant Kage / the Burned Man Cross-Batch-Konsolidierung (Dossier §5 Case 4)

**Gewählt:** Eine Row `lieutenant_kage` / "Lieutenant Kage", `primaryFactionId='last_chancers'`. Surface-Form `the Burned Man` als Alias zu dieser Row.

**Begründung:**

- Cowork-Default akzeptiert: Override-File W40K-0185 *Armageddon Saint* tagt **beide** "Lieutenant Kage" UND "the Burned Man" als POV des Same-Charakters — explizit narratives Device (Schaeffer's Sichtweise vs. saint-cult-Sichtweise; Loop-Log Z. 772). Niedrige Ambiguität, Mad-Donna-analog (D1).
- Canonical-ID `lieutenant_kage` (rank-inclusive) statt `kage` (bare): Surface-Form über alle 5 Last-Chancers-Bücher (W40K-0181..0185) ist **"Lieutenant Kage"** (rank-inclusive) — Direct-Match-Konsistenz mit `colonel_schaeffer`-Pattern. "the Burned Man" als Alias.
- `primaryFactionId='last_chancers'` (Phase-1-Sub-Faction): Kage ist Last-Chancers-Lieutenant — penal-legion-Identität ist die throughline, nicht die generische Astra-Militarum-Rolle.
- Loop-Log-Befund: "narrative device is that the saint-cult knows the figure as 'the Burned Man' while Schaeffer knows him as Kage" → Konsolidierung als alias-tracking ist exakt der vorgeschlagene Lösungsweg.

### D5 — Obispal-Promotion-Default (Dossier §7.8)

**Gewählt:** **Skip.** Obispal (freq=1, W40K-0151 Watson-Trilogy-Omnibus-Aggregat) bleibt unresolved long-tail.

**Begründung:**

- 074-impl hat 23 character-rows neu promoted (Jaq Draco / Meh'Lindi / Vitali Googol / Grimm aus der Watson-Trilogie); Obispal war in dieser Promotion-Liste **explizit nicht enthalten** trotz freq=1 im selben Aggregat. Das ist der bewusst-knappe historical-canon-layer-Cut der 074-Phase.
- Cowork-Faustregel "lieber Long-Tail unresolved als falsche Canonical-Kanten" + Dossier §7.8 erlaubt sowohl Promote als auch Skip; Phase-3-CC folgt dem 074-Precedent.
- Wenn ein späterer Resolver-Pass die Watson-Trilogy-Surface-Forms tiefer abdeckt (oder eine Hygiene-Session die historical-canon-layer-Liste konsolidiert), kann Obispal nachträglich promotet werden. Aus-Scope dieser Session.

### D6 — freq=1 lore-iconic Character-Promotionen (Brief Phase-3 + Dossier §7.9)

**Promoted (9):**

| # | id | name | Promotion-Begründung |
| - | -- | ---- | -------------------- |
| 1 | `lord_helmawr` | Lord Helmawr (modern) | Cross-Batch-Case-3 explicit-split — distinkt von `gerontius_helmawr` |
| 2 | `brielle` | Brielle | W40K-0173 *Terminal Overkill* POV (Hill's Escher coming-of-age) |
| 3 | `scrutinator_primus_servalen` | Scrutinator Primus Servalen | W40K-0177 dual-POV mit Mad Donna; Enforcer-Scrutinator-rank-pioneer |
| 4 | `ivar_krakenblood` | Ivar Krakenblood | W40K-0160 *Krakenblood* (2025 Collins) Title-POV |
| 5 | `ulrik_the_slayer` | Ulrik the Slayer | Krakenblood-Quest-Giver; canonical third-edition Space-Wolves Wolf-Priest (Cowork-Dossier-Hinweis "third-edition lore-iconic") |
| 6 | `yeceqath_voice_of_all` | Yeceqath the Voice of All | W40K-0198 *Traitor by Deed* Primaris-era arch-heretic — Phase-1-soul_drinkers-Primaris-Reboot-Era-Marker passend (Phase-1 D2 + Phase-3-Adjacency) |
| 7 | `lord_medell` | Lord Medell | W40K-0199 *Crossfire*-Antagonist (Hydraphur-noble-conspiracy) |
| 8 | `hoyyon_phrax` | Hoyyon Phrax | W40K-0200 *Legacy*-Namensgeber (Phrax-Charter-deceased-Rogue-Trader) |
| 9 | `cardinal_crimson` | Cardinal Crimson | Eigentlich freq=2 (W40K-0169 + W40K-0170 reappearance) — Nicht freq=1, aber in der Cowork-Erwartungsliste nicht explizit aufgeführt; hier promoted weil Title-Eponym + Reappearance (Override-Rationale ssot-w40k-017: "Cardinal Crimson ×2") |

**Skipped (18, alle freq=1 long-tail):**

`Obispal` (D5), `Armand Helmawr` (W40K-0164 supporting), `Breaker Brass` (W40K-0180), `Desolation Zoon` (W40K-0172), `Dog` (W40K-0177 — zu generisch), `Erik Bane` (W40K-0168), `Fettnir` (W40K-0173), `KB-88` (W40K-0177 cyber-mastiff — Mascot-Tier), `Lord Silas Pureburn` (W40K-0179), `Nemo` (W40K-0169), `Red Tori` (W40K-0173 deceased-mother flashback), `Sinden Kass` (W40K-0165), `Tempes Sol` (W40K-0179), `Uriah Storm` (W40K-0166), `Valtin Schemko` (W40K-0164), `Yar Umbra` (W40K-0178 framing-piece), `Zefer Tyranus` (W40K-0163), `Zeke` (W40K-0176).

Begründung: Cowork-Faustregel "lieber knapp"; alle haben freq=1 ohne kreuzende cross-batch-/lore-iconic-Marker. Wenn künftige Resolver-Pässe diese Charaktere wieder bringen (Reappearance → freq≥2), oder eine Cowork-Hygiene-Session sie explizit listet, können sie nachträglich promotet werden.

### D7 — `historical_canon_layer`-Markierung: keine

**Gewählt:** Keine Phase-3-Promotion trägt `historical_canon_layer` im Notes-Feld.

**Begründung:**

- Cowork-Brief explizit: "Für diese Welle: Cowork-Tendenz **keine `historical_canon_layer`-Markierungen** für die early-2000s-Cluster, weil sie publication-era post-Codex sind und ihre Surface-Forms weiterhin in der modernen Lore-Sprache leben." Übernommen.
- Die 074-impl-Watson-Trilogy-Promotionen (Jaq Draco / Meh'Lindi / Vitali Googol / Grimm) tragen `historical_canon_layer` weil Watson 1990-1995 pre-Codex-Black-Library-Lore ist — strukturell andere Layer.
- Die Phase-4-Welle-Cluster (Necromunda-classic-2005-2008, Last-Chancers-2001-2004, Soul-Drinkers-2002-2012, Gothic-War-2001-2003, Calpurnia-2003-2004) sind alle post-Codex-2nd-Edition + post-Black-Library-Verlagsbasis; ihre Surface-Forms (Sarpedon, Schaeffer, Kal Jerico etc.) leben in der modernen Lore-Sprache.

### D8 — Soul-Drinkers Faction-Tagging (Phase-1-Continuity-Marker)

**Gewählt:** Sarpedon / Daenyathos / Iktinos / Tellos alle `primaryFactionId='soul_drinkers'` (Phase-1-D2 single-Row mit `tone='primaris_reboot_coexistent'`).

**Begründung:**

- Phase 1 D2 (siehe Phase-1-Report) hat sich für eine Soul-Drinkers-Row entschieden (Firstborn-+-Primaris-coexistent). Phase 3 nutzt diese Single-Row für alle Soul-Drinkers-Character-Promotionen; kein zweites `soul_drinkers_primaris`-Faction-Target nötig.
- Yeceqath the Voice of All (Primaris-era arch-heretic, W40K-0198) ist **Antagonist** zu den Primaris-Soul-Drinkers, **kein** Soul-Drinker selbst → `primaryFactionId='chaos'` (Grand-Alignment-Catch-all für Chaos-Cult-Leader ohne klaren Astartes-Marker im Synopsis-Text).
- Teturact (Bleeding-Chalice-Arch-Villain, W40K-0190) ist Chaos-Sorcerer / Necromancer, **kein** Soul-Drinker → analog `primaryFactionId='chaos'`.

### D9 — Lord Medell `primaryFactionId='imperium'` (Grand-Alignment-Catchall)

**Gewählt:** `lord_medell` trägt `primaryFactionId='imperium'` (Grand-Alignment-Knoten).

**Begründung:**

- Lord Medell ist Hydraphur-noble-house-head; keine spezifische `house_medell`-Faction-Row existiert in `factions.json` (Phase-1-Out-of-Scope für single-book-freq=1-noble-houses).
- Grand-Alignment `imperium` ist Schema-konform und etabliertes Pattern für catch-all-Imperial-Identitäten ohne spezifischen Sub-Knoten (analog `cherubael / chaos`, `nightbringer / chaos` — siehe ihre notes-Felder mit "pragmatically tagged until X-Faction lands").
- `notes`-Feld dokumentiert die Wahl explizit: "Generic imperium primary because no house_medell faction-row exists; noble-house promotion would be over-broad for a single-book appearance".

### D10 — Necromunda-Underhive-Operator primaryFactionId-Wahl

**Gewählt:** Kal-Jerico-Companions Wotan / Scabbs / Yoland + Caleb Cursebound tragen `primaryFactionId='necromunda'` (Phase-1-Mid-Knoten generic).

**Begründung:**

- Diese Charaktere sind Underhive-Operator ohne House-Mitgliedschaft (Wotan = cyber-mastiff, Scabbs = ratskin-sidekick, Yoland = independent psyker, Caleb Cursebound = bounty-hunter/conman per Loop-Log "Caleb Cursebound is a bounty-hunter/conman").
- `necromunda`-Mid-Knoten (Phase-1-D1) ist der korrekte parent-Tag für Underhive-Generic-Identitäten ohne House- oder Cult-Spezialisierung. Sub-Faction-spezifische Tags (z. B. `house_escher` für Mad Donna, `redemptionists` für Cardinal Crimson, `ratskins` für Iktomi, `necromunda_enforcers` für Servalen) sind den Spezialisierungs-Eindeutigen vorbehalten.
- Brielle / Jarene: `house_escher` (explizite Gang-Mitgliedschaft im Override-Synopsis: "Wild-Hydras gang" + "Wild-Cats gang", beide House-Escher-Sub-Gangs).

### D11 — Overlord von Strab `primaryFactionId='astra_militarum'`

**Gewählt:** `overlord_von_strab` trägt `primaryFactionId='astra_militarum'`.

**Begründung:**

- Override-Synopsis W40K-0183: "the renegade Imperial Commander of that world, Overlord von Strab" — "Imperial Commander" ist sein institutioneller Rang vor dem Renegade-Status. In W40K-Lore ist Imperial-Commander-Rank typischerweise Astra-Militarum-tier (planetary military governor / PDF-Commander).
- Renegade-Continuity wäre `chaos` denkbar, aber Synopsis bietet **keinen explicit Chaos-Aligned-Marker** (kein Mark-of-Chaos, kein Daemonic-Pact-Statement). Default zu institutioneller Pre-Renegade-Rolle = `astra_militarum`.
- Alternative `chaos` (full-renegade-tag) geprüft + verworfen — `astra_militarum` mit notes-Disambiguation ("renegade Imperial Commander ... retreated into the Ork-infested rebel hive") ist präziser und faktisch dem Synopsis-Wording verpflichtet.

### D12 — Captain-Rank vs. Lord-Rank ID-Konvention

**Gewählt:** Rank-inclusive Surface-Form → Rank-inclusive ID. Konkret: `colonel_schaeffer`, `lieutenant_kage`, `captain_leoten_sempter`, `scrutinator_primus_servalen`, `cardinal_crimson`, `overlord_von_strab`, `gerontius_helmawr`, `lord_helmawr`, `lord_medell`, `inquisitor_thaddeus`.

**Begründung:**

- Bestehender Convention-Spread in `characters.json`: rank-inclusive Surface-Forms erhalten rank-inclusive IDs (`lord_general_lugo`, `lord_general_dravere`, `captain_idaeus`, `captain_aeschelus`, `chaplain_astador`, `chaplain_tangata_manu`). Phase 3 folgt diesem Pattern für alle rank-startende-Surface-Forms.
- Non-rank-startende Charaktere (Sarpedon, Daenyathos, Iktinos, Tellos, Madox, Brielle, Iktomi, Jarene, Wotan etc.) tragen bare-name IDs ohne künstliche Rank-Konstruktion.
- `Ulrik the Slayer` → `ulrik_the_slayer` (epithet-included, kein rank); analog `kharn_the_betrayer`, `lukas_the_strifeson`, `orikan_the_diviner`, `trazyn_the_infinite` aus bestehender Convention.

## Resolver-Status-Veränderung

Pre-Phase-3 (post-074-Baseline):

```
characters: 129 rows / 23 aliases
character surface forms in wave: 5 resolved (direct only), 62 unresolved (Dossier §3.3 — 67 distinct, 5 directs from prior Watson-Trilogy-Promotion + Magnus/Abaddon prior-pass)
```

Post-Phase-3:

```
characters: 169 rows (+40) / 26 aliases (+3)
character surface forms in wave: 49 resolved (direct: 46 / alias: 3), 18 unresolved
```

Long-Tail-unresolved (18, alle bewusst freq=1 long-tail-skip per D5/D6):

Obispal (W40K-0151), Armand Helmawr (W40K-0164), Breaker Brass (W40K-0180), Desolation Zoon (W40K-0172), Dog (W40K-0177), Erik Bane (W40K-0168), Fettnir (W40K-0173), KB-88 (W40K-0177), Lord Silas Pureburn (W40K-0179), Nemo (W40K-0169), Red Tori (W40K-0173), Sinden Kass (W40K-0165), Tempes Sol (W40K-0179), Uriah Storm (W40K-0166), Valtin Schemko (W40K-0164), Yar Umbra (W40K-0178), Zefer Tyranus (W40K-0163), Zeke (W40K-0176).

## Test-Coverage

13 neue Character-Test-Cases in `scripts/test-resolver.ts` (Acceptance ≥ 5, ≥ 2 alias-consolidation):

| # | Test | Typ | Bezug |
| - | ---- | --- | ----- |
| 1 | `Ragnar Blackmane` → `ragnar_blackmane` | direct | Space-Wolves-Saga POV |
| 2 | `Ragnar Thunderfist` → `ragnar_blackmane` | **alias-consolidation** | Pre-Blackmane novitiate name |
| 3 | `Sarpedon` → `sarpedon` | direct | Soul-Drinkers Chapter-Master |
| 4 | `Daenyathos` → `daenyathos` | direct | Soul-Drinkers founder-philosopher |
| 5 | `Kal Jerico` → `kal_jerico` | direct | Multi-Era one-row (D2) |
| 6 | `Mad Donna` → `mad_donna` | direct | Canonical Underhive-Legend |
| 7 | `D'onne Ulanti` → `mad_donna` | **alias-consolidation** | Cross-Batch-Case 1 (D1) |
| 8 | `Lieutenant Kage` → `lieutenant_kage` | direct | Last-Chancers POV |
| 9 | `the Burned Man` → `lieutenant_kage` | **alias-consolidation** | Cross-Batch-Case 4 (D4) |
| 10 | `Lord Gerontius Helmawr` → `gerontius_helmawr` | direct | Helmawr-Split classic (D3) |
| 11 | `Lord Helmawr` → `lord_helmawr` | direct | Helmawr-Split modern (D3) |
| 12 | `Shira Calpurnia` → `shira_calpurnia` | direct | Calpurnia-Trilogy POV |
| 13 | `Captain Leoten Sempter` → `captain_leoten_sempter` | direct | Gothic-War Flag-Captain |

Acceptance-Coverage: 10 direct + 3 alias-consolidation ≥ Brief-Minimum (5 + 2). Mad-Donna + Kage-Burned-Man als explizit geforderte Alias-Consolidation-Coverage geliefert; Ragnar-Thunderfist als third bonus.

`npm run test:resolver` Ergebnis: **116 passed, 0 failed** (alle bestehenden 103 unverändert).

## Files touched (Phase-3 Write-Scope)

- `scripts/seed-data/characters.json` (+40 rows, append-only)
- `scripts/seed-data/character-aliases.json` (+3 keys)
- `scripts/test-resolver.ts` (+13 test cases, sectioned-append nach `alias - Lord Castellan Creed routes to Ursarkar Creed` block)
- `sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-3-report.md` (diese Datei, neu)

**Nicht berührt** in dieser Phase: keine Pfade außerhalb des Write-Scopes.

## Hand-off to Phase 4 (Integration)

- **Character-Faction-Dependency-Validierung:** alle 40 neuen Characters tragen `primaryFactionId`-Tags, die entweder Pre-Phase-1-existing (`space_wolves`, `inquisition`, `thousand_sons`, `imperial_navy`, `chaos`, `astra_militarum`, `imperium`, `rogue_traders`, `adeptus_arbites`) oder Phase-1-newly-added (`house_belisarius`, `house_escher`, `house_helmawr`, `necromunda`, `necromunda_enforcers`, `last_chancers`, `redemptionists`, `ratskins`, `soul_drinkers`) sind. **Keine FK-Trap** zu erwarten.
- **`seed-resolver-extensions.ts`-Updates für Phase 4:** Phase 4 muss alle 40 neuen Character-Rows in den Character-Insert-Block aufnehmen (`ON CONFLICT DO NOTHING`-Pattern wie 072/074); analog die 3 neuen Aliase in den `character_aliases`-Insert-Block.
- **Smoke-Page-Empfehlungen für Phase 4:** Mind. 3 der 6-8 Phase-4-Smoke-Bücher sollten Phase-3-Promotionen abdecken — Vorschlag: `space-wolf` (W40K-0152, Ragnar Saga opener), `soul-drinker` (W40K-0189, Soul-Drinkers opener), `crossfire` (W40K-0199, Calpurnia opener). Optional: `survival-instinct` (W40K-0162, Mad-Donna-classic) oder `soulless-fury` (W40K-0177, Mad-Donna-+-Servalen-dual-POV) für Alias-Consolidation-Smoke.
- **Audit-Cockpit-Drift-Bucket-Erwartung:** Long-Tail-18-unresolved-Characters (D5/D6 Skips) bleiben im `gap`-Audit-Bucket nach Phase-4-Re-Apply; das ist erwartet, kein Fehler.
- **Cross-Axis-Sicherheit:** Yoland (`necromunda`), Wotan (`necromunda`), Sarpedon (`soul_drinkers`) usw. teilen keine Surface-Form mit existierenden Location-/Faction-Rows der Welle (cross-axis-grep-frei). Cross-axis-Iyanden-Style-Konflikte gibt es in dieser Welle nicht — Phase-2-D5 hat den einzigen Cross-Axis-Case (`Imperium`-als-Location) bereits behandelt.

## Open issues / blockers

Keine. Phase 4 (Integration) ist freigegeben.
