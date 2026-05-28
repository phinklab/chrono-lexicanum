# Resolver-Pass 11 — Phase 3 (Characters) Status Report

**Welle:** `ssot-hh-003..008` (HH-0021..HH-0080, 60 Bücher)
**Phase:** `phase-3-characters`
**Scope:** `scripts/seed-data/characters.json`, `scripts/seed-data/character-aliases.json`, `scripts/test-resolver.ts`, this status file.
**Status:** done — ready for Phase 4a (Integration/Apply).

## Summary

Promotions-Disziplin: **3 Primarch new rows** (Sanguinius / Jaghatai Khan / Perturabo) + **15
freq ≥ 2 supporting-cast new rows** + **1 alias-target new row** (`targutai_yesugei`) + **21
curated freq=1 lore-iconic new rows** = **40 neue Character-Rows**. Dazu **6 Alias-Adds** —
fünf Cross-Era / cross-form Konsolidierungen (7a Case D / F / G / H / I) plus die
Cross-Era honor-title-split Case E (Kharn ↔ Kharn-the-Betrayer-parity). Alle FK-Bindungen
auf das Phase-1-Faction-Set bzw. bestehende Anker; Resolver-Trias grün (367 cases, 0 failures;
+20 neue Pass-11-Phase-3-Test-Cases, davon 6 Alias-Konsolidierung). Keine architektonische
Unsicherheit; keine `Needs decision`-Blocker.

Strict-freq floor (Dossier-Recommendation): 18 Rows (15 freq≥2 + 3 Primarchs); curated
lore-iconic ceiling: ~60. Actual promotion **40 Rows** — innerhalb des konservativen Mittelfelds
und vergleichbar mit Pass-10's ~41-row HH-Bootstrap. **Largest Phase-3 promotion pass to date
within the curated-freq-1 cut** wäre das Ceiling gewesen; Phase 3 wählt bewusst den disziplinierten
Mittelweg.

## New character rows (40 total)

### Primarch spine (3 rows, 7b)

| id | name | primaryFactionId | evidence | dossier ref |
| --- | --- | --- | --- | --- |
| `sanguinius` | Sanguinius | `blood_angels` | freq 10 (HH-0021/0027/0034/0046/0049/0050/0054/0055/0057/0063) — Blood Angels Primarch, Signus Trial → Echoes-of-Eternity Delphic-Battlement-Duell | §7b |
| `jaghatai_khan` | Jaghatai Khan | `white_scars` | freq 5 (HH-0028/0031/0036/0062/0076) — White Scars Primarch, Scars / Path of Heaven / Warhawk | §7b |
| `perturabo` | Perturabo | `iron_warriors` | freq 5 (HH-0023/0045/0051/0055/0057) — Iron Warriors Primarch, Angel Exterminatus / Tallarn / First Wall | §7b |

> Mit diesen drei landet die **Primarch-Abdeckung im HH-Korpus essentially complete**
> (Pass-10-Set + Pass-11-Set) — jeder auf der Page benannte Primarch in HH-0001..HH-0080
> hat eine canonical-row.

### Heresy supporting cast — freq ≥ 2 (15 rows, 7b)

| id | name | primaryFactionId | freq | dossier ref |
| --- | --- | --- | --- | --- |
| `shiban_khan` | Shiban Khan | `white_scars` | 4 (HH-0028/0036/0062/0076) | §7b |
| `artellus_numeon` | Artellus Numeon | `salamanders` | 3 (HH-0026/0032/0050) | §7b |
| `euphrati_keeler` | Euphrati Keeler | `lectitio_divinitatus` | 3 (HH-0064/0067/0069) | §7b (Phase-1 Verweise: Saint of the cult) |
| `oll_persson` | Oll Persson | `imperium` | 3 (HH-0025/0065/0066) | §7b (civilian Perpetual) |
| `sigismund` | Sigismund | `imperial_fists` | 3 (HH-0039/0055/0061) | §7b |
| `aeonid_thiel` | Aeonid Thiel | `ultramarines` | 2 (HH-0031/0035) | §7b |
| `arkhan_land` | Arkhan Land | `mechanicus` | 2 (HH-0041/0079) | §7b |
| `bjorn` | Bjorn | `space_wolves` | 2 (HH-0033/0049) | §7b (bare HH form; honor-title-Alias deferred) |
| `ka_bandha` | Ka'Bandha | `daemons` | 2 (HH-0021/0063) — slug strips apostrophe | §7b |
| `lotara_sarrin` | Lotara Sarrin | `world_eaters` | 2 (HH-0024/0078) | §7b |
| `sevatar` | Sevatar | `night_lords` | 2 (HH-0022/0035) | §7b |
| `shadrak_meduson` | Shadrak Meduson | `iron_hands` | 2 (HH-0043/0047) | §7b |
| `tybalt_marr` | Tybalt Marr | `sons_of_horus` | 2 (HH-0043/0047) | §7b |
| `tylos_rubio` | Tylos Rubio | `knights_errant` | 2 (HH-0029/0042) | §7b (Phase-1 Verweise: current-state grain parity mit Garro) |
| `zardu_layak` | Zardu Layak | `word_bearers` | 2 (HH-0051/0056) | §7b |

### Alias-target new row (1 row, 7a Case I)

| id | name | primaryFactionId | evidence | dossier ref |
| --- | --- | --- | --- | --- |
| `targutai_yesugei` | Targutai Yesugei | `white_scars` | combined freq 2 (`Targutai Yesugei` direct HH-0028 + `Yesugei` alias HH-0036) — longer-form-canonical pattern parity mit `branne_nev` / `lucius_the_eternal` | §7a Case I |

### Curated freq=1 lore-iconic (21 rows, 7c)

| id | name | primaryFactionId | evidence | dossier ref |
| --- | --- | --- | --- | --- |
| `azkaellon` | Azkaellon | `sanguinary_guard` | HH-0063 *Echoes of Eternity* — Sanguinary Guard captain (Phase-1 Verweise) | §7c |
| `raldoron` | Raldoron | `blood_angels` | HH-0021 *Fear to Tread* — Blood Angels First Captain | §7c |
| `meros` | Meros | `blood_angels` | HH-0021 *Fear to Tread* — Apothecary | §7c |
| `zephon` | Zephon | `blood_angels` | HH-0079 *Bringer of Sorrow* | §7c |
| `alexis_polux` | Alexis Polux | `imperial_fists` | HH-0022 *Shadows of Treachery* (`The Crimson Fist` novella) — later Crimson Fists founder | §7c |
| `archamus` | Archamus | `imperial_fists` | HH-0039 *Praetorian of Dorn* — Dorn's Huscarl-Master | §7c |
| `tolbek` | Tolbek | `thousand_sons` | HH-0044 *The Crimson King* | §7c |
| `menkaura` | Menkaura | `thousand_sons` | HH-0044 *The Crimson King* | §7c |
| `sanakht` | Sanakht | `thousand_sons` | HH-0044 *The Crimson King* | §7c |
| `hathor_maat` | Hathor Maat | `thousand_sons` | HH-0044 *The Crimson King* — Pavoni captain | §7c |
| `rylanor` | Rylanor | `emperors_children` | HH-0023 *Angel Exterminatus* — Ancient, Iydris trap-pivot | §7c (strong lore-iconic) |
| `sharrowkyn` | Sharrowkyn | `raven_guard` | HH-0023 *Angel Exterminatus* — Raven Guard sniper | §7c |
| `maloghurst_the_twisted` | Maloghurst the Twisted | `sons_of_horus` | HH-0051 *Slaves to Darkness* — Horus's equerry | §7c (strong Mournival-era anchor) |
| `madail` | Madail | `daemons` | HH-0021 *Fear to Tread* — Daemonic 'Lord of Hosts' | §7c + §7d axis-disambig (character, not location) |
| `galba` | Galba | `iron_hands` | HH-0030 *Damnation of Pythos* — POV | §7c |
| `khi_dem` | Khi'dem | `salamanders` | HH-0030 *Damnation of Pythos* — Salamanders survivor; slug strips apostrophe | §7c |
| `barthusa_narek` | Barthusa Narek | `word_bearers` | HH-0047 *Old Earth* — Word Bearers defector, Iron-Hands-aligned (Legion-origin Konvention parity mit severian Luna-Wolves-apostate) | §7c |
| `alivia_sureka` | Alivia Sureka | `imperium` | HH-0076 *Old Wounds, New Scars* — Perpetual, civilian | §7c (Oll-Persson-parallel) |
| `katsuhiro` | Katsuhiro | `astra_militarum` | HH-0056 *The Lost and the Damned* — Imperial Army trooper POV | §7c |
| `mohana_mankata_vi` | Mohana Mankata Vi | `talons_of_the_emperor` | HH-0053 *Titandeath* — Sisters of Silence Knight-Centura (§7d disambig: distinct identity) | §7c |
| `esha_ani_mohana` | Esha Ani Mohana | `legio_solaria` | HH-0053 *Titandeath* — Legio Solaria Princeps Senior (§7d disambig: distinct identity from Mohana Mankata Vi) | §7c |

## New character aliases (6 total)

| surface form | → canonical id | dossier ref | rationale |
| --- | --- | --- | --- |
| `Horus Lupercal` | `horus` | §7a Case D | Single highest-impact alias of the wave: freq 9 HH-0051/0055/0056/... — Warmaster's full pre-Heresy + Heresy-era name; combined effective freq 12 on Pass-10 `horus` row |
| `Calas Typhon` | `typhus` | §7a Case E | Cross-Era honor-title-split — Heresy-era name of the Death Guard First Captain who becomes Typhus; pattern-parity mit Kharn ↔ Kharn the Betrayer (runbook §4) |
| `Corvus Corax` | `corax` | §7a Case F | Primarch full name (freq 1 HH-0040 *Corax* anthology); pattern-parallel to Case D |
| `Lorgar Aurelian` | `lorgar` | §7a Case G | Word Bearers Primarch full name (freq 1 HH-0051 *Slaves to Darkness*); pattern-parallel to Case D / F |
| `Emperor of Mankind` | `the_emperor` | §7a Case H | Formal title (freq 1 HH-0060 *Fury of Magnus*); future variants (`Emperor`, `Master of Mankind`) deferred until they surface |
| `Yesugei` | `targutai_yesugei` | §7a Case I | Short-form of new row `targutai_yesugei`; longer-form-canonical / shorter-alias pattern per runbook §4 (parity mit `branne_nev` + `Branne`) |

## Cross-Era / Identity-Disziplin (runbook §4)

- **Primarch-Honor-Title-Split parity.** Cases D / F / G fügen die Primarch-Full-Names (`Horus
  Lupercal`, `Corvus Corax`, `Lorgar Aurelian`) als Aliase auf die Pass-10-angelegten
  Primarch-Anker; **kein** Row-Split, parallel zum existierenden Magnus ↔ Magnus the Red /
  Mortarion ↔ Mortarion Patterns.
- **Cross-Era honor-title-split (Case E).** `Calas Typhon` (Heresy) → `typhus` (W40K-Anker)
  ist die direkte Kharn ↔ Kharn the Betrayer-Parallele aus runbook §4 — die existing
  W40K-Canonical-Row absorbiert den Heresy-Surface-Form als Alias. **Keine** separate
  Heresy-Row `calas_typhon`.
- **Formal-title alias (Case H).** `Emperor of Mankind` → `the_emperor` ist die formal-title
  Variante der Pass-10 short-form-canonical-Wahl; framing parity mit Lorgar Aurelian-Pattern.
- **Longer-form-canonical (Case I).** `targutai_yesugei` (full name, HH-0028) als Canonical,
  `Yesugei` (short, HH-0036) als Alias — runbook §4 longer-form-canonical / shorter-alias
  Pattern, parity mit Pass-10 `branne_nev` + `Branne` und Pass-N `lucius_the_eternal` +
  `Lucius`.
- **Axis-disambig (§7d, Phase-3-judgment).** `Madail` (Surface-Form taucht in §3 als
  Location auf) → Phase 2 hat ihn bewusst nicht promotet, Phase 3 promotet ihn als Character
  (Daemonic Lord of Hosts, *Fear to Tread*). Konsistent mit Dossier §7d. **Kein** Cross-axis-Konflikt
  (§4 = 0).
- **Same-name disambig (§7d).** `Mohana Mankata Vi` ↔ `Esha Ani Mohana` — Phase 3
  konfirmiert per BL-Lore: zwei distinct Charaktere (Mohana Mankata Vi = Sisters of Silence
  Knight-Centura; Esha Ani Mohana = Princeps Senior of Legio Solaria). Zwei separate Rows,
  keine Alias-Konsolidierung.
- **Cross-axis-Konflikte:** §4 Dossier-Output = 0 — keine in dieser Welle.

## Resolver-Trias (vor Commit)

- `npm run test:resolver` → **367 passed, 0 failed** (+20 neue Pass-11-Phase-3-Test-Cases:
  9 direct-matches auf neuen Rows + 6 alias-routes + 5 alias-consolidations, wobei
  `Horus Lupercal`/`Corvus Corax`/`Yesugei` jeweils mit dem direct-match-Pendant zusammen
  einen Konsolidierungs-Beweis bilden). ≥ 5 / ≥ 2 alias-Schwellen weit erfüllt.
- `npm run test:resolver-data` → ok (parent/alias-Targets validiert; alle neuen
  `primaryFactionId`-Werte (`blood_angels`, `white_scars`, `iron_warriors`, `salamanders`,
  `lectitio_divinitatus`, `imperium`, `imperial_fists`, `ultramarines`, `mechanicus`,
  `space_wolves`, `daemons`, `world_eaters`, `night_lords`, `iron_hands`, `sons_of_horus`,
  `knights_errant`, `word_bearers`, `sanguinary_guard`, `thousand_sons`, `emperors_children`,
  `raven_guard`, `astra_militarum`, `talons_of_the_emperor`, `legio_solaria`) existieren;
  alle 6 neuen Alias-Targets (`horus`, `typhus`, `corax`, `lorgar`, `the_emperor`,
  `targutai_yesugei`) existieren).
- `npm run test:resolver-coverage` → unverändert von Pass-10/Phase-1/Phase-2 (read-only;
  berührt HH-003..008 erst in Phase 4a).
- `npm run test:apply-override-dry` → ok; Guard-Counts: `out-of-range=20, unknown-work=0`
  (Pass-10-Stand, HH-0003..0008-Apply erst in Phase 4a).

## Idempotenz-Check

Pro neuer Row wurde vor dem Insert geprüft, dass `id` und `name` in `characters.json` noch
nicht existieren; pro neuem Alias wurde geprüft, dass der Surface-Form-Key in
`character-aliases.json` noch nicht belegt ist:

- **40 neue Rows**: kein bestehender `id`/`name`-Konflikt. ok
- **6 neue Aliases** (`Horus Lupercal`, `Calas Typhon`, `Corvus Corax`, `Lorgar Aurelian`,
  `Emperor of Mankind`, `Yesugei`): alle Keys neu in `character-aliases.json`. ok
- **Alias-Target-Existenz**: alle 6 Targets sind existing Rows (5 Pass-10-Anker:
  `horus`, `corax`, `lorgar`, `the_emperor`, `typhus`; 1 neu in dieser Phase:
  `targutai_yesugei`). ok

## Test-Case-Zählung

20 neue Pass-11-Phase-3-Resolver-Test-Cases (≥ 5 Schwelle deutlich erfüllt; ≥ 2
Alias-Konsolidierungs-Schwelle weit erfüllt mit 6 alias-Tests). Pattern:

- **9 direct-matches auf neuen Rows**: Sanguinius / Jaghatai Khan / Perturabo (Primarchs),
  Shiban Khan / Sigismund / Euphrati Keeler / Ka'Bandha / Tylos Rubio (freq≥2),
  Targutai Yesugei (alias-target new row).
- **6 alias-tests**: `Horus Lupercal` → `horus`, `Calas Typhon` → `typhus`,
  `Corvus Corax` → `corax`, `Lorgar Aurelian` → `lorgar`,
  `Emperor of Mankind` → `the_emperor`, `Yesugei` → `targutai_yesugei`.
- **5 weitere alias-consolidations als Doppel-Assertions** (im selben `check`-Block):
  `Horus Lupercal` + `Horus` beide → `horus` (Konsolidierungs-Beweis); analog
  `Corvus Corax` + `Corax` → `corax`. Plus drei direct-matches auf besonders
  lore-iconic freq=1 Rows (Maloghurst the Twisted / Rylanor / Madail).
- **2 disambig-Tests**: Mohana Mankata Vi + Esha Ani Mohana — Beweis, dass die zwei
  distinct Rows direct-matches sind, nicht durch eine versehentliche Alias-Konsolidierung
  fusioniert.

## Skipped / deferred promotion candidates

Per Dossier §7c freq-1 long-tail (~30 unresolved single-surface names; viele
lore-iconic, viele nicht), Phase 3 hat folgende bewusst **nicht** promotet (Long-Tail-Disziplin
per runbook §2 — lieber Long-Tail offen lassen als eine falsche Canonical-Kante schreiben):

- **Imperial Fists / Custodes ohne klare lore-Iconik**: `su_kassen` (HH-0055 Imperial Navy
  admiral) — Phase 3 lässt unresolved (Custodes/Navy-Cluster wenig ausgebildet im
  Resolver-Set; future-Welle darf nachziehen wenn Recurrence).
- **Khan / Custodes cluster**: `torghun_khan` (HH-0028), `ra_endymion` (HH-0041),
  `diocletian_coros` (HH-0041), `kane` (HH-0041) — alle unresolved (freq=1, supporting cast).
- **Word Bearers traitor-cast freq=1**: `ekaddon` (HH-0051), `volk` (HH-0051) —
  unresolved (Slaves-to-Darkness supporting cast).
- **Night Lords**: `gendor_skraivok` (HH-0056), `krukesh_the_pale` (HH-0034) — unresolved
  (Painted-Count + Damnation-of-Pythos supporting cast).
- **Knights-Errant / Garro**: `macer_varren` (HH-0042), `iaeo` (HH-0045), `hrend` (HH-0045)
  — unresolved (Garro-anthology supporting cast).
- **Mortal POVs / Mechanicum** ohne klare Recurrence: `samonas` (HH-0072), `dahren_heruk`
  (HH-0074), `kabe` (HH-0074), `kano` (HH-0021), `terent_hartekk` (HH-0053), `oberdeii`
  (HH-0034), `ilya_ravallion` (HH-0036), `rhydia_erephren` (HH-0030), `durun_atticus`
  (HH-0030), `agapito` (HH-0040) — unresolved.
- **Iron Hands cluster freq=1**: `bion_henricos` (HH-0043) — unresolved (single freq-1
  supporting cast).

Diese Wahl hält das Promotion-Profile bei 40 Rows — auf der Hälfte des dossier-recommended
ceiling (~60) und deutlich über dem strict-floor (18). Future-HH-Wellen dürfen die
freq=1 long-tail wieder ansehen, wenn sie cross-batch recurrence aufzeigen.

## Phase 4a Apply-Side — Forward-Plan

Die 40 neuen Character-Rows + 6 neue Aliases fließen via `seed-resolver-extensions.ts` in die
DB (Phase 4a Concern, nicht hier). Override-Files (`manual-overrides-ssot-hh-003..008`)
enthalten die Character-Surface-Forms aus Dossier §3 — der Resolver auf Apply-Seite löst sie
via diese Phase-3-Adds (für die 40 promotet) bzw. lässt sie unresolved (für die ~30
bewusst-deferred freq=1).

Smoke-slug-Junction-Counts (Dossier-Config `verify.smokeSlugs`):
- `the-damnation-of-pythos` (HH-0030) — wird `galba` / `khi_dem` / `durun_atticus`-Surfaces
  resolven (galba/khi_dem promotet; durun_atticus unresolved → long-tail).
- `corax` (HH-0040) — wird `corvus_corax` über die neue Alias → `corax`-Row resolven;
  `agapito`, `branne` (Pass-10-Alias) unresolved/resolved bleiben.
- `born-of-flame` (HH-0050) — wird `artellus_numeon` direct resolven.
- `fury-of-magnus` (HH-0060) — wird `emperor_of_mankind` über neue Alias → `the_emperor`
  resolven.
- `restorer` (HH-0070) — `maximus_thane` Pass-10 direct (unverändert).
- `ashes-of-the-imperium` (HH-0080) — Long-Tail-Set, Author-Typo-Correction Phase-4a-Concern.

## Halt-Disziplin

- Mindestens ein commit pro Phase: ja (dieser commit).
- JSON-Files syntaktisch valide: ja (`characters.json` korrekt geschlossen mit trailing-comma
  vor neuen Rows, `character-aliases.json` mit trailing-comma vor neuen Keys, beide schließen
  sauber).
- Architektonische Unsicherheit: nein — keine `Needs decision`-Blocker.
- Write-Scope: Diff ⊆ {`scripts/seed-data/characters.json`,
  `scripts/seed-data/character-aliases.json`, `scripts/test-resolver.ts`,
  `sessions/resolver-dossiers/resolver-pass-11-phase-3-report.md`}.
- Co-Author-Trailer: keiner.

## Ready for Phase 4a (Integration/Apply)

Apply-Achs-Paket (`scripts/seed-resolver-extensions.ts`, die domain-aware-Trias-Batch-Ranges
in `apply-override-dry.ts` / `test-resolver-coverage.ts` / `test-resolver-data-integrity.ts`,
die ssot-hh-003..008 Override-Files, `run-phase4-apply.sh`, Phase-4a-Statusdatei) ist
frei und FK-konsistent. Phase 1–3 haben das Reference-Set vollständig erweitert:

- **Faction-Layer:** 9 neue Rows + 6 neue Aliases (Phase 1).
- **Location-Layer:** 22 neue Rows + 0 neue Aliases (Phase 2).
- **Character-Layer:** 40 neue Rows + 6 neue Aliases (Phase 3, hier).

Der Resolver auf Apply-Seite wird in Phase 4a die HH-0021..HH-0080-Override-Files gegen das
erweiterte Reference-Set fahren; die Brief-101-Guard-Erwartung ist
`out-of-range=7 (Shadows-of-Treachery), unknown-work=0` per Dossier §1/§7d.
