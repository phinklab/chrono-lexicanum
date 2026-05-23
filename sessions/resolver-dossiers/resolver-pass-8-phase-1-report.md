# Resolver-Pass 8 — Phase 1 (Factions) Report (ssot-w40k-046..051 / W40K-0451..0510)

> Mechanische Resolver-Phase nach `sessions/resolver-pass-runbook.md` §3 Phase 1 + §4. Lese-Scope:
> Runbook + Config (`scripts/resolver-pass.config.json`) + Dossier
> (`sessions/resolver-dossiers/resolver-pass-8-dossier.md`) + Achs-Paket Factions. Keine Briefs, keine
> Override-Files, kein volles Loop-Log gelesen. Self-contained — kein Vorbehalt aus früherem Lauf.

## Summary

- **Wave:** `ssot-w40k-046..051` (6 Loop-Batches, 60 Bücher, W40K-0451..0510).
- **Faction-Surface-Forms in der Welle (Dossier §3):** 51 distinct / 138 occurrences.
- **Cross-Axis-Konflikte (Dossier §4):** 3 (Iyanden, Saim-Hann, Ziasuthra — alle faction+location, alle Aeldari).
- **Reference-Row-Delta (factions.json):** 166 → **171** rows (+5).
- **Alias-Delta (faction-aliases.json):** 48 → **55** aliases (+7).
- **Policy-Delta (faction-policy.json):** +5 specialCases-Notizen. KEINE neuen browseRoots (Dossier
  §3-Constraint: kein neuer Browse-Root ohne Maintainer-Decision).
- **Resolver-Tests:** 236 → **248** (+12 neue Cases im eighth-wave-Block in `scripts/test-resolver.ts`).
- **Trias-Status:** alle vier Apply-seitigen Tests grün
  (`test:resolver`, `test:resolver-data`, `test:resolver-coverage`, `test:apply-override-dry`).
- **Halt-Disziplin:** keine architektonische Unsicherheit; keine `## Needs decision`-Stops. Ein Commit.

## New rows in `scripts/seed-data/factions.json` (+5)

| id | name | parent | alignment | tone | freq | source-cluster | rationale |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `kroot` | Kroot | `tau` | `xenos` | `alien` | 3 | Blackstone Fortress duology + Vaults of Obsidian (Hinks, W40K-0483/0484/0485) — Grekh POV | Distinkte Xenos-Spezies-Grain unter T'au-Empire-Umbrella, analog `genestealer_cults` unter `tyranids`. Eigene Row statt Alias zu `tau`, weil Kroot eine distinkte Spezies sind und Phase 3 `primaryFactionId=kroot` für Grekh setzen kann. |
| `ratlings` | Ratlings | `astra_militarum` | `imperium` | `line` | 3 | Blackstone Fortress duology (Raus/Rein Twins, W40K-0483/0484/0485) | Abhuman-Auxiliary-Grain unter Astra Militarum, analog der named-regiment-Tier (`cadian_shock_troops`, `kasrkin`). Konsistente Spezies-Grain-Promotion zusammen mit `kroot` (beide freq=3, beide Auxiliary-Spezies, beide aus demselben Source-Cluster). |
| `traitor_guard` | Traitor Guard | `chaos` | `chaos` | `chaos` | 3 | Cadian Saga: Traitor Rock / Shadow of the Eighth / Last Whiteshield (Hill, W40K-0471/0472/0473) | Kein sauberes Alias-Target — `heretic_astartes` ist falscher Grain (Chaos Space Marines, nicht turned Guard). Parent=`chaos`, alignment=`chaos` analog `blood_pact` / `sons_of_sek` / `zoican_host` (turned-mortal-Renegate unter chaos; Single-Parent-Schema, Loyalitäts-Bruch ist das definierende Merkmal). |
| `lamenters` | Lamenters | `adeptus_astartes` | `imperium` | `imperial` | 1 (lore-iconic) | Devastation of Baal (Haley, W40K-0474) | Blood-Angels-Successor-Chapter, lore-ikonisch durch die Badab-War-Tragödie (zum Penitent-Crusade verurteilt). Parent=`adeptus_astartes` analog `flesh_tearers` / `mortifactors` (kein blood_angels-sub-tier; Authority-Layer reicht). |
| `blood_drinkers` | Blood Drinkers | `adeptus_astartes` | `imperium` | `imperial` | 1 (lore-iconic) | Devastation of Baal (Haley, W40K-0474) | Blood-Angels-Successor-Chapter (eines der älteren Founding-Successors). Gleiche Successor-Grain-Promotion wie `lamenters`, identische Modellierung. |

## New aliases in `scripts/seed-data/faction-aliases.json` (+7)

| surface form | freq | → canonical id | rationale |
| --- | --- | --- | --- |
| `Adeptus Ministorum` | **11** (wave-top) | `ecclesiarchy` | Lore-canon: Adeptus Ministorum *ist* der formale Name der Ecclesiarchy. Höchste Evidenz der Welle (Dark Imperium trilogy / Horusian Wars / Cult of the Warmason / Cadian Saga / Vaults of Terra / mehr). Pure Alias-Add — `ecclesiarchy` existiert seit langem. |
| `High Lords of Terra` | 2 | `senatorum_imperialis` | Lore-canon: High Lords *sind* das Senatorum Imperialis. Watchers-of-the-Throne-Duologie (W40K-0452/0453). `senatorum_imperialis` wurde Pass 7 genau für diese M42-Mention promoviert (freq=1 lore-iconic). |
| `Cadian Shock` | 3 | `cadian_shock_troops` | Kürzungsform der Cadian Shock Troops, das Regiment-Row existiert (Pass 3). Folge dem Pass-3-Präzedenz (`Cadian` / `Cadian Regiments` aliasen ebenfalls auf `cadian_shock_troops`) — präziser als auf `astra_militarum` aliasen. |
| `Officio Prefectus` | 2 | `commissariat` | Lore-canon: Officio Prefectus *ist* eines der formalen Institutionsnamen für die Commissariat (Maledictions / Wicked and the Damned Anthologien). `commissariat` existiert seit langem als Sub-Row unter Imperium. |
| `Ordo Sepulturum` | 1 (lore-iconic) | `inquisition` | Inquisitions-Sub-Ordo spezialisiert auf Pestilenz / Walking Dead. Source: Kyme *Sepulturum* (W40K-0508). Konsistent mit `Ordo Hereticus` als direct match (Inquisitions-Sub-Ordos werden auf das Umbrella aliased, wenn kein eigener Ordo-Row existiert; Ordo Hereticus / Malleus / Xenos haben eigene Rows als historisch wichtigste, der Ordo Sepulturum nicht). |
| `Saim-Hann` | 1 + 1 cross-axis | `eldar` | Wild Rider / Ghost Warrior (Iyanden-Duologie, W40K-0481/0482). Konsistent mit Pass-7-Default für Craftworlds (`Iyanden` / `Biel-Tan` aliasen ebenfalls auf `eldar` — kein per-Craftworld-Split). Cross-Axis-Konflikt auf Location-Achse (Dossier §4) ist Phase-2-Sache. |
| `Ziasuthra` | 1 + 1 cross-axis | `eldar` | Aeldari-Figur (Ziasuthra the Awakened — Iyanden-Duologie, W40K-0481). Gleicher Default wie Saim-Hann, gleiche Pass-7-Konsistenz. Cross-Axis-Konflikt auf Location-Achse ist Phase-2-Sache. |

## Promotions-Disziplin (Dossier §7c / Runbook §4)

**freq ≥ 2 strict promotions (own row):** 3 — `kroot` (3), `ratlings` (3), `traitor_guard` (3).
**freq ≥ 2 strict promotions (alias):** 4 — `Adeptus Ministorum` (11), `Cadian Shock` (3), `Officio
Prefectus` (2), `High Lords of Terra` (2).
**Lore-iconic freq=1 promotions (own row):** 2 — `lamenters`, `blood_drinkers` (beide Devastation of Baal,
Blood-Angels-Successor-Grain konsistent mit existierendem `flesh_tearers`).
**Lore-iconic freq=1 promotions (alias):** 3 — `Ordo Sepulturum`, `Saim-Hann`, `Ziasuthra`.

**Bewusst NICHT promoviert (Dossier-Default oder Evidenz-Schwäche):**

- `Angels Resplendent` (freq 1, Fehervari Dark-Coil-Thread, einmaliger Auftritt) — unresolved, Successor-
  Grain-Promotion ohne sauberes Source-Anchor-Buch.
- `Genesis Chapter` (freq 1, Ultramarines-Successor aus *Of Honour and Iron*) — unresolved, kein
  eigenständiges Anchor-Buch.
- `Clan Urretzi` (freq 1, Squat / League-of-Votann-Clan aus *The Cache*) — unresolved, kein League-of-Votann
  Browse-Row existiert; Dossier-Default ist „leave unresolved" (single occurrence; nicht promotion-worthy
  in dieser Welle).

## Cross-Axis-Konflikte (Dossier §4 — Phase-1-Hälfte)

- **Iyanden** (faction+location). Faction-Axis war bereits Pass-6 aliased (`Iyanden`→`eldar`) — idempotent,
  keine Phase-1-Aktion. Location-Achse (eigene Row `iyanden` existiert seit Pass 4) ist Phase-2-Sache.
- **Saim-Hann** (faction+location). Faction-Axis: neuer Alias `Saim-Hann`→`eldar` (oben). Location-Achse
  ist Phase-2-Sache.
- **Ziasuthra** (faction+location). Faction-Axis: neuer Alias `Ziasuthra`→`eldar` (oben). Location-Achse
  ist Phase-2-Sache.

Achs-getrennte Tables — keine Resolver-Interferenz. Auf der Faction-Achse landen alle drei beim Aeldari-
Umbrella.

## Idempotency-Check

Alle 5 neuen Row-IDs und alle 7 neuen Alias-Keys waren vor der Phase nicht im Reference-Set:

- Row-IDs gegen bestehende `factions.json` (vorher 166 Rows): kein Konflikt — `kroot`/`ratlings`/
  `traitor_guard`/`lamenters`/`blood_drinkers` sind neu. (`ratskins` existiert als Necromunda-Sub-Row,
  ist aber ein anderer Identifier; kein Name-Match mit `Ratlings`.)
- Alias-Keys gegen bestehende `faction-aliases.json` (vorher 48): kein Konflikt — alle 7 neu.
- Alias-Targets verweisen alle auf bestehende canonical IDs (`ecclesiarchy`, `senatorum_imperialis`,
  `cadian_shock_troops`, `commissariat`, `inquisition`, `eldar` ×2).
- Parent-FKs der neuen Rows verweisen alle auf bestehende Rows (`tau`, `astra_militarum`, `chaos`,
  `adeptus_astartes` ×2).

Re-Run auf derselben Branch wäre no-op.

## Verifikation

```text
npm run test:resolver            → 248 passed, 0 failed   (236 + 12 neu im eighth-wave-Block)
npm run test:resolver-data       → resolver data integrity ok
npm run test:resolver-coverage   → grand totals factions=1662/1978, locations=638/818, characters=1074/1399
                                   (below-threshold smoke rows sind data findings, not failures)
npm run test:apply-override-dry  → [apply-override-dry] ok (0 dangling FK/alias refs, 0 missing facet ids)
```

Trias-Schwesterndatei-Konsistenz: `test-resolver-data-integrity.ts` validiert, dass alle 7 neuen
Alias-Targets auf existierende canonical IDs zeigen und alle 5 neuen Parent-FKs auf existierende Faction-
Rows — beides bestanden („alias targets point at canonical ids" + „faction parents point at existing
factions").

## Touched files (Write-Scope-konform)

- `scripts/seed-data/factions.json` (+5 rows)
- `scripts/seed-data/faction-aliases.json` (+7 aliases)
- `scripts/seed-data/faction-policy.json` (+5 specialCases-Notizen, keine browseRoots-Änderung)
- `scripts/test-resolver.ts` (+12 check()-Cases im eighth-wave-Block, vor `console.log("\nresolveLocation")`)
- `sessions/resolver-dossiers/resolver-pass-8-phase-1-report.md` (diese Datei)

Ready for Phase 2 (Locations).
