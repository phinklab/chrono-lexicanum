# Resolver-Pass 9 — Phase 1 (Factions) Report (ssot-w40k-052..057 / W40K-0511..0565)

> Mechanische Resolver-Phase nach `sessions/resolver-pass-runbook.md` §3 Phase 1 + §4. Lese-Scope:
> Runbook + Config (`scripts/resolver-pass.config.json`) + Dossier
> (`sessions/resolver-dossiers/resolver-pass-9-dossier.md`) + Achs-Paket Factions. Keine Briefs, keine
> Override-Files, kein volles Loop-Log gelesen. Self-contained — kein Vorbehalt aus früherem Lauf.

## Summary

- **Wave:** `ssot-w40k-052..057` (6 Loop-Batches, 55 Bücher, W40K-0511..0565 — finale W40K-Welle).
- **Faction-Surface-Forms in der Welle (Dossier §3):** 58 distinct / 124 occurrences.
- **Cross-Axis-Konflikte (Dossier §4):** 0 (saubere Welle auf der Cross-Axis-Front).
- **Reference-Row-Delta (factions.json):** 171 → **173** rows (+2).
- **Alias-Delta (faction-aliases.json):** 55 → **59** aliases (+4).
- **Policy-Delta (faction-policy.json):** +2 `specialCases`-Notizen. KEINE neuen `browseRoots` (Dossier-
  /Runbook-Constraint: kein neuer Browse-Root ohne Maintainer-Decision).
- **Resolver-Tests:** 266 → **273** (+7 neue Cases im ninth-wave-Block in `scripts/test-resolver.ts`).
- **Trias-Status:** alle vier Apply-seitigen Tests grün
  (`test:resolver`, `test:resolver-data`, `test:resolver-coverage`, `test:apply-override-dry`).
- **Halt-Disziplin:** keine architektonische Unsicherheit; keine `## Needs decision`-Stops. Ein Commit.

## New rows in `scripts/seed-data/factions.json` (+2)

| id | name | parent | alignment | tone | freq | source-cluster | rationale |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ogryns` | Ogryns | `astra_militarum` | `imperium` | `line` | 2 | Baggit-and-Clodde-Duologie (Worley, W40K-0547 *Dredge Runners* + W40K-0548 *The Wraithbone Phoenix*) — Clodde der Ogryn POV | Distinkte Abhuman-Spezies-Grain unter Astra-Militarum-Umbrella, **konsistent mit Pass-8 `ratlings`-Promotion in derselben Duologie** (Baggit der Ratling parallel zu Clodde dem Ogryn — identische Spezies-Auxiliary-Grain, identische Modellierung). Eigene Row statt Alias zu `astra_militarum`, damit Phase 3 `primaryFactionId=ogryns` für Clodde setzen kann. Grain-Parität mit Ratlings innerhalb derselben Duologie zu brechen wäre awkward (Dossier 7c). |
| `sautekh_dynasty` | Sautekh Dynasty | `necrons` | `xenos` | `alien` | 1 (lore-iconic) | *Severed* (Crowley, W40K-0564) — Sautekh-Nemesor Zahndrekh + Vargard Obyron | Necron-Dynasty-Grain unter Necrons-Umbrella, analog `kroot` unter `tau` (distinkte Sub-Grain unter Xenos-Umbrella). Lore-iconic Necron-Dynasty (Zahndrekh / Obyron sind Sautekh-Notables); konsistent mit der Dynasty/Crownworld-Lore-Pattern. Cross-Reference: Ithakas Dynasty (Oltyx's Dynasty aus der Twice-Dead-King-Trilogie) erscheint in dieser Welle nur als Character-Mention, nicht als Faction-Tag — dieselbe Dynasty-Grain wäre anwendbar, falls je als Faction surfaced. |

## New aliases in `scripts/seed-data/faction-aliases.json` (+4)

| surface form | freq | → canonical id | rationale |
| --- | --- | --- | --- |
| `Enforcers` | 2 | `adeptus_arbites` | Varangantua / Warhammer-Crime sub-faction; surfaces in *No Good Men* (W40K-0539, Crime-anthology-Debüt) und *Bloodlines* (W40K-0540, Wraights Crime-Debüt). Default = Alias zu `adeptus_arbites`, matched der Pass-1-Browse-Root-Konvention für die `Bookkeeper's Skull`-Note ("Enforcers ≠ strikt Adeptus Arbites, aber als nächster Browse-Root mit low_confidence-Note getaggt") und der Probator-Doppelnutzung als Arbites-Rank + Enforcer-Rolle quer durch die Crime-Bücher. KEIN neuer Browse-Root ohne Maintainer-Decision (Dossier-Default). |
| `Argent Shroud` | 1 (lore-iconic) | `sisters_of_battle` | Sisters-of-Battle-Preceptory aus *The Gate of Bones* (W40K-0529). Konsistent mit der Regiment-/Preceptory-Grain-Regel — in vorigen Pässen wurde **keine** per-Preceptory-Row promoviert; das Sororitas-Umbrella deckt den Authority-Layer. Dossier-Default. |
| `Chaos Cultists` | 1 | `chaos` | Generic Chaos-Surface-Form aus *Da Gobbo's Demise* (W40K-0555). Loop-Log-Batch-056-Note: "tagged als `Chaos Cultists`, since no Heretic Astartes legion is named". Default = Alias zum existierenden `chaos`-Umbrella-Row (per `faction-policy.specialCases.chaos`: "Synthetischer Umbrella-Row hostet … Daemons / mortal Renegate-Tier"); **nicht** auf `heretic_astartes` aliasen (wrong grain — Cultisten sind mortals, nicht Astartes). |
| `Chaos Cults` | 1 | `chaos` | Generic Chaos-Surface-Form aus *The Bookkeeper's Skull* (W40K-0518). Gleicher Grain / dieselbe Rationale wie `Chaos Cultists`. Dossier-Default. |

## Promotions-Disziplin (Dossier §7c / Runbook §4)

**freq ≥ 2 strict promotions (own row):** 1 — `ogryns` (2, Baggit-and-Clodde-Duologie; Grain-Parität mit
Pass-8 `ratlings`).
**freq ≥ 2 strict promotions (alias):** 1 — `Enforcers` (2, → `adeptus_arbites`; Browse-Root-Default).
**Lore-iconic freq=1 promotions (own row):** 1 — `sautekh_dynasty` (Severed; Necron-Dynasty-Grain analog
`kroot`).
**Lore-iconic freq=1 promotions (alias):** 3 — `Argent Shroud`, `Chaos Cultists`, `Chaos Cults`.

**Bewusst NICHT promoviert (Dossier-Default oder Evidenz-Schwäche):**

- **`Soulblight Gravelords` (freq 3, AoS-Vampire-Faction)** — unresolved. AoS-flagged Horror-eShorts
  (Vintage / Aberration / Accursed), kein AoS-Faction-Bucket in `factions.json` (Pass-8 7d-Default). Das
  `setting->age_of_sigmar`-Flag trägt durch zur Audit-Cockpit-Advisory.
- **AoS-spezifische Faktionen (freq 1, jeweils unresolved):** `Disciples of Tzeentch`, `Freeguild`,
  `Stormcast Eternals`, `Cities of Sigmar` — gleicher Default wie Soulblight Gravelords.
- **Old-World-Faktionen (freq 1, jeweils unresolved):** `Vampire Counts`, `The Empire` — Vampire-Genevieve-
  Omnibus (W40K-0511, `setting->warhammer_fantasy`-flag); kein Warhammer-Fantasy-Bucket.
- **Ork-Sub-Clans (freq 1, jeweils unresolved):** `Blood Axes`, `Snakebites`, `Freebooterz` — kein
  per-Ork-Clan-Row in prior Pässen promoviert; `orks` parent reicht.
- **Varangantua-spezifische Orgs (freq 1, jeweils unresolved):** `Har Dhrol`, `Valtteri Cartel` — Loop-Log-
  Batch-055-Note preserved both as "Varangantua-specific orgs, resolver-loop will canonicalise"; Long-Tail,
  noch keine Promotion-Evidenz.
- **`Imperial Nobility` (freq 1)** — generisch, unresolved.
- **`Adeptus Administratum` (freq 1)** — *Unholy Tales* (W40K-0527, anthology). Lore-canon sibling zu
  `ecclesiarchy` / `astra_militarum` / `mechanicus` — Promotion *wäre* plausibel (Dossier 7c offers either
  path), aber Single-Occurrence in einer Anthologie ist schwache Evidenz; Default = unresolved, bewahre
  freq ≥ 2 strict + nur die deutlichsten lore-iconic freq=1. Bei nächster Surface-Form in einem stärkeren
  Anchor-Buch kommt eine Promotion-Diskussion in Frage.
- **Bereits-aliased Surface-Forms (idempotent, keine Aktion):** `Adeptus Ministorum` (freq 3 → `ecclesiarchy`,
  Pass-8-Alias zahlt sich hier weiter aus — *Unholy Tales* + Urdesh-Duologie), `Drukhari` (freq 2 →
  `eldar`, Pass-6-Alias), `Aeldari` (freq 1 → `eldar`), `The Fallen` (freq 1 → `fallen_angels`).

## Cross-Axis-Konflikte (Dossier §4 — Phase-1-Hälfte)

**Keine** — Dossier §4 zeigt für diese Welle eine leere Cross-Axis-Tabelle. Hinweis aus 7d: `Setekh`
(character, freq 1, Severed) sieht oberflächlich Necron-Place-like aus, ist aber ein Personenname — kein
Cross-Axis-Collision auf Faction.

## Idempotency-Check

Alle 2 neuen Row-IDs und alle 4 neuen Alias-Keys waren vor der Phase nicht im Reference-Set:

- Row-IDs gegen bestehende `factions.json` (vorher 171 Rows): kein Konflikt — `ogryns` und `sautekh_dynasty`
  sind neu (Grep auf `"name": "Ogryns"|"Sautekh Dynasty"` lieferte 0 Treffer).
- Alias-Keys gegen bestehende `faction-aliases.json` (vorher 55): kein Konflikt — alle 4 neu.
- Alias-Targets verweisen alle auf bestehende canonical IDs (`adeptus_arbites`, `sisters_of_battle`,
  `chaos` ×2).
- Parent-FKs der neuen Rows verweisen alle auf bestehende Rows (`astra_militarum` für `ogryns`, `necrons`
  für `sautekh_dynasty`).
- `name`-Eindeutigkeit gegen `factions.json` bestätigt (`name: "Ogryns"` / `name: "Sautekh Dynasty"` noch
  nicht vergeben).

Re-Run auf derselben Branch wäre no-op.

## FK-Sicherheit für Phase 3 (Runbook §5)

`primaryFactionId` neuer Characters in Phase 3 kann sicher auf die folgenden post-Phase-1-IDs zeigen:

- **Hard-FK-Dependencies (durch Phase 1 in dieser Welle neu):** `ogryns` (für Clodde — alternativ Fallback
  `astra_militarum` falls Phase 3 broad-grain wählt), `sautekh_dynasty` (für Nemesor Zahndrekh / Vargard
  Obyron — alternativ Fallback `necrons` falls Phase 3 broad-grain wählt).
- **Bereits existierende IDs für 7b-Spines (unverändert, keine Phase-1-Aktion nötig):** `necrons`,
  `sons_of_sek`, `iron_snakes`, `ratlings`, `astra_militarum`, `orks`, `alpha_legion`, `inquisition`,
  `salamanders`, `custodes`, `black_legion`, `order_of_our_martyred_lady`, `black_templars`, `rogue_traders`,
  `sisters_of_battle`, `adeptus_arbites`, `mechanicus`, `talons_of_the_emperor`, `word_bearers`,
  `ordo_xenos`, `imperial_knights`, `ultramarines`.
- **Aliased Surface-Forms (für Phase 3 ebenfalls direkt verwendbar):** `Enforcers` → `adeptus_arbites`
  (z. B. Rudgard Howe, Symeon Noctis, Quillon Drask, Agusto Zidarov), `Argent Shroud` →
  `sisters_of_battle`, `Chaos Cultists`/`Chaos Cults` → `chaos`.

## Verifikation

```text
npm run test:resolver            → 273 passed, 0 failed   (266 + 7 neu im ninth-wave-Block)
npm run test:resolver-data       → resolver data integrity ok
npm run test:resolver-coverage   → totals factions=1796/2116, locations=683/898, characters=1170/1535
                                   (below-threshold smoke rows sind data findings, not failures)
npm run test:apply-override-dry  → [apply-override-dry] ok
                                   (0 dangling FK/alias refs, 0 missing facet ids, 0 unresolvable constituents,
                                    15 forward collection refs — Pass-6/7/8-collection-gaps, range-aware Guard
                                    grün)
```

Trias-Schwesterndatei-Konsistenz: `test-resolver-data-integrity.ts` validiert insbesondere "alias targets
point at canonical ids" + "faction parents point at existing factions" — beides bestanden für die 4 neuen
Aliases und die 2 neuen Parent-FKs.

## Touched files (Write-Scope-konform)

- `scripts/seed-data/factions.json` (+2 rows: `ogryns`, `sautekh_dynasty`)
- `scripts/seed-data/faction-aliases.json` (+4 aliases: Enforcers / Argent Shroud / Chaos Cultists / Chaos Cults)
- `scripts/seed-data/faction-policy.json` (+2 `specialCases`-Notizen für `ogryns` / `sautekh_dynasty`,
  keine `browseRoots`-Änderung)
- `scripts/test-resolver.ts` (+7 `check()`-Cases im ninth-wave-Block, vor `console.log("\nresolveLocation")`)
- `sessions/resolver-dossiers/resolver-pass-9-phase-1-report.md` (diese Datei)

Ready for Phase 2 (Locations).
