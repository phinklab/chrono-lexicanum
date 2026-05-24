# Resolver-Pass 9 — Phase 3 (Characters) Report (ssot-w40k-052..057 / W40K-0511..0565)

> Mechanische Resolver-Phase nach `sessions/resolver-pass-runbook.md` §3 Phase 3 + §4 + §5 (FK-Reihenfolge).
> Lese-Scope: Runbook + Config (`scripts/resolver-pass.config.json`) + Dossier
> (`sessions/resolver-dossiers/resolver-pass-9-dossier.md`) + Achs-Paket Characters. Keine Briefs, keine
> Override-Files, kein volles Loop-Log gelesen. Self-contained — kein Vorbehalt aus früherem Lauf.

## Summary

- **Wave:** `ssot-w40k-052..057` (6 Loop-Batches, 55 Bücher, W40K-0511..0565 — finale W40K-Welle).
- **Character-Surface-Forms in der Welle (Dossier §3):** 73 distinct / 94 occurrences.
- **Cross-Axis-Konflikte (Dossier §4):** 0 (saubere Welle).
- **Reference-Row-Delta (characters.json):** 325 → **345** rows (+20).
- **Alias-Delta (character-aliases.json):** 40 → **42** aliases (+2).
- **Resolver-Tests:** 280 → **287** (+7 neue Cases im ninth-wave-Block in `scripts/test-resolver.ts`,
  davon 2 Alias-Konsolidierung).
- **Trias-Status:** alle vier Apply-seitigen Tests grün (`test:resolver`, `test:resolver-data`,
  `test:resolver-coverage`, `test:apply-override-dry`).
- **Halt-Disziplin:** keine architektonische Unsicherheit; keine `## Needs decision`-Stops. Ein Commit.

## New rows in `scripts/seed-data/characters.json` (+20)

### 7a Cross-batch alias-consolidation (1 own row + 1 alias)

| id | name | primaryFactionId | freq | source | rationale |
| --- | --- | --- | --- | --- | --- |
| `agusto_zidarov` | Agusto Zidarov | `adeptus_arbites` | 2 (combined) | Wraights *Bloodlines* (W40K-0540) + *Broken City* anthology (W40K-0543) | Dossier 7a Case A. Probator (Varangantua Warhammer-Crime). Surface forms `Probator Agusto Zidarov` (W40K-0540) + `Agusto Zidarov` (W40K-0543) konsolidieren auf eine Row; der Probator-Rank-Prefix wird als Alias geführt. primaryFactionId `adeptus_arbites` matched die Pass-1-Browse-Root-Konvention für Enforcer-Probatoren (vgl. Pass-9 Phase-1-Alias `Enforcers`→`adeptus_arbites`). |

### 7b Big single-form cross-batch spines (12 freq≥2)

| id | name | primaryFactionId | freq | source | rationale |
| --- | --- | --- | --- | --- | --- |
| `djoseras` | Djoseras | `necrons` | 3 | Twice-Dead King trilogy + omnibus (W40K-0551, 0552, 0553) | Oltyx's Necron brother; Crowley-Trilogie. |
| `oltyx` | Oltyx | `necrons` | 3 | Twice-Dead King trilogy + omnibus (W40K-0551, 0552, 0553) | POV-Necron-Nemesor der Trilogie. |
| `yenekh` | Yenekh | `necrons` | 3 | Twice-Dead King trilogy + omnibus (W40K-0551, 0552, 0553) | Oltyx' Cryptek-Vizier. |
| `magister_sek` | Magister Sek | `sons_of_sek` | 2 | Urdesh duology (W40K-0549, 0550) | Anarch Sek, Leader of the Sons of Sek pact; primaryFactionId `sons_of_sek` (Pass-Pre existing). |
| `priad` | Priad | `iron_snakes` | 2 | Urdesh duology (W40K-0549, 0550) | Iron-Snakes Damocles-Squad sergeant; Chapter-grain. |
| `baggit` | Baggit | `ratlings` | 2 | Baggit-Clodde duology (W40K-0547, 0548) | Ratling POV; nutzt Pass-8-promotion `ratlings`. |
| `clodde` | Clodde | `ogryns` | 2 | Baggit-Clodde duology (W40K-0547, 0548) | Ogryn POV; **bindet Phase-1-neue Row `ogryns`** (Grain-Parität mit Baggit/ratlings innerhalb derselben Duologie). |
| `tabidiah_kruger` | Tabidiah Kruger | `astra_militarum` | 2 | Baggit-Clodde duology (W40K-0547, 0548) | Imperial Fixer; civilian-edge → broader-grain `astra_militarum` (kein clean Sub-Faction-Match). |
| `inquisitor_rostov` | Inquisitor Rostov | `inquisition` | 2 | Dawn of Fire (W40K-0531 *Throne of Light* + W40K-0535 *Hand of Abaddon*) | John French's Ordo-Hereticus-Inquisitor; parent-grain. |
| `ferren_areios` | Ferren Areios | `salamanders` | 2 | Dawn of Fire (W40K-0535 *Hand of Abaddon* + W40K-0538 *Master of Rites*) | Salamanders Captain; spin-off-Trio (Areios → Master of Rites). |
| `solomon_akurra` | Solomon Akurra | `alpha_legion` | 2 | Renegades duology (W40K-0560 *Harrowmaster* + W40K-0561 *Ghost Legion*) | Alpha-Legion-Harrowmaster POV. |

### 7c Lore-iconic freq=1 promotions (8)

| id | name | primaryFactionId | freq | source | rationale |
| --- | --- | --- | --- | --- | --- |
| `szarekh` | Szarekh | `necrons` | 1 lore-iconic | *The Silent King* (W40K-0536, Dawn of Fire finale) | The Silent King, primarch-tier Necron-Figur. |
| `nemesor_zahndrekh` | Nemesor Zahndrekh | `sautekh_dynasty` | 1 lore-iconic | *Severed* (W40K-0564) | Sautekh-Nemesor; **bindet Phase-1-neue Row `sautekh_dynasty`** (finer-grain pick gegenüber `necrons`-Parent, konsistent mit Dossier-7c-/Phase-1-Empfehlung). |
| `vargard_obyron` | Vargard Obyron | `sautekh_dynasty` | 1 lore-iconic | *Severed* (W40K-0564) | Zahndrekhs loyal Vargard; Pair-Row, dieselbe Sautekh-Dynasty-Grain. |
| `trajann_valoris` | Trajann Valoris | `custodes` | 1 lore-iconic | *Auric Gods* (W40K-0563) | Captain-General of the Adeptus Custodes. |
| `kor_phaeron` | Kor Phaeron | `word_bearers` | 1 lore-iconic | *Throne of Light* (W40K-0531) | Word-Bearers Master of the Faith / Erebus-Peer; Heresy-era Chaos-Lord. |
| `makari` | Makari | `orks` | 1 lore-iconic | *Ghazghkull Thraka: Prophet of the Waaagh!* (W40K-0558) | Ghazghkulls Grot-Banner-Bearer (Da Lucky 'Un). |
| `falx` | Falx | `ordo_xenos` | 1 lore-iconic | *Ghazghkull Thraka: Prophet of the Waaagh!* (W40K-0558) | Ordo-Xenos-Inquisitor; Loop-Log-Batch-056-Primary-Tagging. |
| `iron_queen_orlah` | Iron Queen Orlah | `imperial_knights` | 1 lore-iconic | *The Iron Kingdom* (W40K-0532, Dawn of Fire #5) | Knight-Queen of House Kamidar. |

## New aliases in `scripts/seed-data/character-aliases.json` (+2)

| surface form | freq | → canonical id | rationale |
| --- | --- | --- | --- |
| `Probator Agusto Zidarov` | 1 | `agusto_zidarov` | 7a Case A: konsolidiert mit `Agusto Zidarov` auf eine Row. Probator-Rank-Prefix als Alias geführt; surfaces in W40K-0540 *Bloodlines* (vgl. `Probator Quillon Drask` / `Probator Symeon Noctis` als parallele Probator-Prefix-Surface-Forms in §3). |
| `Ghazghkull Mag Uruk Thraka` | 3 | `ghazghkull_thraka` | **Cross-pass-7a-Konsolidierung — Dossier-Lücke korrigiert.** Existing Pass-7-Row `ghazghkull_thraka` (Yarrick-Trilogie, freq 3, W40K-0376/0378/0379) **deckt denselben Charakter** wie die Pass-9-Surface-Form `Ghazghkull Mag Uruk Thraka` (freq 3, W40K-0530/0558/0559). Das Dossier 7b empfahl die Pass-9-Surface-Form als **eigene neue Row** (`ghazghkull_mag_uruk_thraka`) ohne Hinweis auf die existierende `ghazghkull_thraka`-Row aus Pass 7 — das wäre ein duplicate-row geworden. Diese Phase korrigiert das per Alias auf die existierende Row; die kürzere Pass-7-Surface-Form `Ghazghkull Thraka` (existing `name`) und die längere Pass-9-Surface-Form `Ghazghkull Mag Uruk Thraka` (neuer Alias) routen jetzt beide auf eine Row. Same character, two surface forms, one canonical row. |

## Promotions-Disziplin (Dossier §7 / Runbook §4)

**freq ≥ 2 strict promotions (own row):** 12 — `agusto_zidarov`, `djoseras`, `oltyx`, `yenekh`,
`magister_sek`, `priad`, `baggit`, `clodde`, `tabidiah_kruger`, `inquisitor_rostov`, `ferren_areios`,
`solomon_akurra`.
**Lore-iconic freq=1 promotions (own row):** 8 — `szarekh`, `nemesor_zahndrekh`, `vargard_obyron`,
`trajann_valoris`, `kor_phaeron`, `makari`, `falx`, `iron_queen_orlah`.
**Cross-batch / cross-pass alias-Konsolidierung (alias only):** 2 — `Probator Agusto Zidarov` (7a Case A,
intra-pass), `Ghazghkull Mag Uruk Thraka` (cross-pass 7a, Dossier-Lücke).

**Bewusst NICHT promoviert (Dossier-Default oder Evidenz-Schwäche):**

- **Bereits-direct/aliased Surface-Forms (idempotent, keine Aktion):** `Roboute Guilliman` (freq 5,
  direct), `Belisarius Cawl` (freq 1, direct), `Abaddon the Despoiler` (freq 1, direct), `Cypher` (freq 1,
  direct), `Logan Grimnar` (freq 1, direct), `Saint Sabbat` (freq 2, direct).
- **AoS-spezifische Characters (jeweils unresolved):** `Anasta Malkorion` (freq 1, *The Vintage*),
  `Aaric Gothghul` (freq 1, *Gothgul Hollow*), `Runar Skoldolfr` + `Tiberius Grim` (freq 1, *Black-Eyed
  Saint*) — alle in `setting->age_of_sigmar`-flagged Büchern; gleicher Default wie Pass-8 / Pass-9-Phase-1
  (resolver doesn't act on setting; Flag trägt durch zur Audit-Cockpit-Advisory).
- **Warhammer-Fantasy-Characters (jeweils unresolved):** `Constant Drachenfels` + `Detlef Sierck` +
  `Genevieve Dieudonne` (freq 1, *The Vampire Genevieve* W40K-0511, `setting->warhammer_fantasy`-Flag);
  kein Warhammer-Fantasy-Bucket.
- **Ork-Grot/Character-Long-Tail (freq 1, jeweils unresolved):** `'Eadbasha`, `Bodgit`,
  `Brukka Bludspilla`, `Fingwit`, `Gitzit`, `Kaptin Bludhook`, `Redsnot`, `Slipbit`, `Slitta da Stabba`,
  `Da Red Gobbo`, `Setekh` (Severed character — Dossier 7c listete ihn fälschlich unter „Ork grot/character
  names"; tatsächlich ein Severed-Necron-Cluster-Name, lasse trotzdem unresolved als low-evidence freq=1).
  Loop-Log-Batch-056-Preservation der Grot-Naming-Convention; Long-Tail per Runbook §2.
- **Hand-of-Abaddon-Supporting-Cast (freq 1, jeweils unresolved):** `Tenebrus`, `Tharador Yheng`,
  `Magda Kesh`, `Graeyl Herek`. Dossier 7b bot Tenebrus als plausible Promotion (`black_legion`) — bewusst
  konservativ gelassen, alle freq=1 ohne lore-iconic-Anchor stark genug für eigene Row diese Welle. Bei
  nächster Wave-Surface-Form-Wiederkehr Promotion-Diskussion.
- **Martyr's-Tomb-Cast (freq 1, jeweils unresolved):** `Canoness Irinya`, `Gaheris`, `Katla Helvintr`.
  Gleicher Long-Tail-Default; freq-1-Cluster ohne klaren Anchor.
- **Crime-POVs (freq 1, jeweils unresolved):** `Quillon Drask`, `Symeon Noctis`, `Rho-1 Lux`,
  `Melita Voronova`, `Haska Jovanic`, `Andreti Sorokin`, `Udmil Terashova`. Dossier 7b/7c bot mehrere als
  plausible Phase-3-Adds; bewusst konservativ gelassen — Probator-Rank-Surface-Forms erscheinen lore-isch
  oft als `Probator <FullName>`, und ich behalte die freq-≥-2-strict-Disziplin streng (mit Ausnahme der
  drei explizit Lore-iconic-genug Custodes/Necron/Ork-Picks). `agusto_zidarov` ist die eine Crime-Promotion
  per 7a-Konsolidierung.
- **Auric-Gods-Custodes-Cast (freq 1, jeweils unresolved):** `Cartovandis`, `Meroved`, `Ursula Gedd` —
  Auric Gods (W40K-0563). Dossier 7c bot alle als plausible Phase-3-Adds; ich nehme nur den Captain-General
  `trajann_valoris` (lore-ikonisch) und lasse das Supporting-Cast unresolved (Long-Tail-freq=1 ohne
  primarch-tier-Anchor).
- **Sister-Isobel (freq 1, unresolved):** *Sea of Souls* (W40K-0534). `low_confidence:factions`-Buch; freq=1
  Long-Tail.
- **Sister-of-Silence Iota-11 (freq 1, unresolved):** *No Peace Among Stars* anthology (W40K-0537);
  freq=1 in einer Anthology — schwache Anchor-Evidenz.
- **Avenging-Son-Supporting-Cast (freq 1, jeweils unresolved):** `Vitrian Messinius`, `VanLeskus`, `Achallor`.
  Dossier 7c bot Phase-3-Promotion; konservativ gelassen (freq=1, Dawn-of-Fire-Opener-Supporting-Cast).
- **Sonstige freq=1 Long-Tail:** `Da Red Gobbo` (lore-iconic-genug per Dossier-7c, aber unresolved
  belassen — die Gobbo-Novellen 0556/0557 haben Author-data_conflict, und der Charakter ist sehr
  episodisch), `Drazus Jate`, `Marcus van Veenan`, `Savriel Sabbriatti`, `Kirian Malenko`,
  `Rudgard Howe`.

## Cross-Axis-Konflikte (Dossier §4 — Phase-3-Hälfte)

**Keine** — Dossier §4 zeigt für diese Welle eine leere Cross-Axis-Tabelle. Hinweis aus 7d: `Setekh`
(character, freq 1, *Severed*) sieht oberflächlich Necron-Place-like aus, ist aber ein Personenname —
kein Cross-Axis-Collision. Bewusst unresolved gelassen.

## FK-Sicherheit (Runbook §5)

Alle `primaryFactionId`-Werte der 20 neuen Rows verweisen auf die **post-Phase-1-Faction-Set**:

- Existing pre-Pass-9 IDs: `adeptus_arbites`, `necrons`, `sons_of_sek`, `iron_snakes`, `ratlings`,
  `astra_militarum`, `inquisition`, `salamanders`, `alpha_legion`, `custodes`, `word_bearers`, `orks`,
  `ordo_xenos`, `imperial_knights`.
- **Phase-1-promovierte neue IDs (FK-binding):** `ogryns` (für `clodde`), `sautekh_dynasty` (für
  `nemesor_zahndrekh` + `vargard_obyron`). Beide Phase-1-Rows wurden in derselben Welle commited
  (Phase-1-Report bestätigt): no FK-Trap.

Tris-Validierung `test:resolver-data` Check "character primaryFactionIds point at existing factions or
null" bestanden — alle 20 neuen Werte sind valid FKs.

## Idempotency-Check

Alle 20 neuen Row-IDs und 2 neuen Alias-Keys waren vor der Phase nicht im Reference-Set:

- Row-IDs gegen bestehende `characters.json` (vorher 325 Rows): kein Konflikt — alle 20 sind neu (Grep
  auf `"id": "<new-id>"` lieferte 0 Treffer pre-edit).
- **Wichtig:** `Ghazghkull Mag Uruk Thraka` war ursprünglich als neue Row geplant — ein
  pre-Trias-Run lieferte aber den existierenden Pass-7-Row `ghazghkull_thraka` (`name: "Ghazghkull
  Thraka"`) als Stage-1-Direct-Match-Konflikt. Dossier 7b hatte diese Cross-Pass-Identity nicht
  erwähnt; ich habe die geplante neue Row gedroppt und stattdessen einen Alias zur existierenden Row
  hinzugefügt (siehe Alias-Tabelle oben für Rationale).
- Alias-Keys gegen bestehende `character-aliases.json` (vorher 40): kein Konflikt — beide neu.
- Alias-Targets verweisen alle auf bestehende canonical IDs (`agusto_zidarov` — Phase-3-neu in diesem
  Commit; `ghazghkull_thraka` — Pass-7-existing).
- `name`-Eindeutigkeit gegen `characters.json` bestätigt für alle 20 neuen Rows (Grep auf
  `"name": "<new-name>"` lieferte 0 Treffer pre-edit; speziell `"Ghazghkull Mag Uruk Thraka"` ist als
  Row-Name nicht vergeben, nur als Alias-Key in `character-aliases.json`).

Re-Run auf derselben Branch wäre no-op.

## Verifikation (Runbook §10)

Code-berührende Phase 3 hält die Trias grün, bevor committet wird:

```text
npm run test:resolver            → 287 passed, 0 failed   (280 + 7 neu im ninth-wave-Block,
                                   davon 2 Alias-Konsolidierungs-Cases)
npm run test:resolver-data       → resolver data integrity ok (alle 10 Checks grün, inkl.
                                   "character primaryFactionIds point at existing factions or null" —
                                   bestätigt FK-Sicherheit der 20 neuen Rows inkl. Phase-1-Rows
                                   `ogryns` / `sautekh_dynasty`)
npm run test:resolver-coverage   → totals factions=1796/2116, locations=684/898,
                                   characters=1171/1535 (+1 vs Phase 2 baseline 1170 — neue
                                   Surface-Form-Matches in den Smoke-Slugs durch neue Character-Rows)
npm run test:apply-override-dry  → [apply-override-dry] ok
                                   (0 dangling FK/alias refs, 0 missing facet ids, 0 unresolvable
                                    constituents, 15 forward collection refs — Pass-6/7/8-collection-
                                    gaps carry-through, range-aware Guard grün)
```

Kein `lint`/`typecheck` — Phase 3 ändert nur JSON-Data-Files + `test-resolver.ts` (Test-Data, nicht
Production-Code).

## Touched files (Write-Scope-konform)

- `scripts/seed-data/characters.json` (+20 rows angehängt am Array-Ende: 1 7a-Konsolidierung + 11 7b-Spines
  + 8 lore-iconic freq=1)
- `scripts/seed-data/character-aliases.json` (+2 aliases: `Probator Agusto Zidarov` →
  `agusto_zidarov`, `Ghazghkull Mag Uruk Thraka` → `ghazghkull_thraka`)
- `scripts/test-resolver.ts` (+7 `check()`-Cases im ninth-wave-Block in `resolveCharacter`-Sektion, vor
  `console.log("\nnormalizeCharacterRole")` — davon 2 Alias-Konsolidierungen)
- `sessions/resolver-dossiers/resolver-pass-9-phase-3-report.md` (diese Datei)

Ready for Phase 4a (Integration/Apply).
