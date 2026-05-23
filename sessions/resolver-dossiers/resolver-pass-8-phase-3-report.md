# Resolver-Pass 8 — Phase 3 (Characters) Report (ssot-w40k-046..051 / W40K-0451..0510)

> Mechanische Resolver-Phase nach `sessions/resolver-pass-runbook.md` §3 Phase 3 + §4 + §5 (FK-Reihenfolge).
> Lese-Scope: Runbook + Config (`scripts/resolver-pass.config.json`) + Dossier
> (`sessions/resolver-dossiers/resolver-pass-8-dossier.md`) + Achs-Paket Characters + Phase-1/Phase-2-Reports
> (Pflicht-Querverweis für FK-Targets). Keine Briefs, keine Override-Files, kein volles Loop-Log gelesen.
> Self-contained — kein Vorbehalt aus früherem Lauf.

## Summary

- **Wave:** `ssot-w40k-046..051` (6 Loop-Batches, 60 Bücher, W40K-0451..0510).
- **Character-Surface-Forms in der Welle (Dossier §3):** 81 distinct / 136 occurrences.
- **Reference-Row-Delta (`characters.json`):** 297 → **325** rows (+28).
- **Alias-Delta (`character-aliases.json`):** 39 → **40** aliases (+1; nur `Zelia` → `zelia_lor` aus 7a Case A).
- **Resolver-Tests:** 255 → **267** (+12 neue Cases im eighth-wave-Block in `scripts/test-resolver.ts`,
  davon 2 alias-consolidation).
- **Trias-Status:** alle vier Apply-seitigen Tests grün
  (`test:resolver`, `test:resolver-data`, `test:resolver-coverage`, `test:apply-override-dry`).
- **FK-Reihenfolge (Runbook §5):** alle `primaryFactionId`s der neuen Rows zeigen auf das **post-Phase-1**
  Faction-Set — explizit verifiziert via `test:resolver-data` (`character primaryFactionIds point at
  existing factions or null`).
- **Halt-Disziplin:** keine architektonische Unsicherheit; keine `## Needs decision`-Stops. Ein Commit.

## New rows in `scripts/seed-data/characters.json` (+28)

Strukturiert nach Cluster, dann freq desc. Spalten: `id` · `name` · `primaryFactionId` (alle Phase-1-FK-safe)
· freq (Dossier §3 / 7b-spine) · source-cluster · Begründung.

### Warped Galaxies kids' series (Cavan Scott, batches 049–050) — 5 rows

| id | name | primaryFactionId | freq | source | rationale |
| --- | --- | --- | --- | --- | --- |
| `talen` | Talen | `astra_militarum` | 6 | W40K-0486..0491 | Wave-top character. Imperial-Guardsman-boy companion. Cadian-boy framing → `astra_militarum` (Dossier 7b). |
| `mekki` | Mekki | `mechanicus` | 5 | W40K-0486..0490 | Forge-World tech-priest novice → `mechanicus` (Dossier 7b). |
| `fleapit` | Fleapit | `null` | 5 | W40K-0486..0490 | Abhuman/robot companion; kein clean canonical (`abhumans`-Row existiert nicht). `null` per Dossier 7d Note 1 / Torris-Vaun-Präzedenz. |
| `zelia_lor` | Zelia Lor | `imperium` | 6 (kombiniert) | W40K-0486..0491 | **7a Case A** — Cross-Batch-Alias-Konsolidierung: `Zelia Lor` (freq 5) + `Zelia` (freq 1) → eine Row + Alias. Civilian-Fallback `imperium` per Dossier 7d Note 1. |
| `harleen_amity` | Harleen Amity | `inquisition` | 2 | W40K-0488, W40K-0489 | Inquisitor introduced in Secrets of the Tau + War of the Orks → `inquisition`. |

### Vaults of Terra trilogy + omnibus (Wraight, batch 046) — 2 rows

| id | name | primaryFactionId | freq | source | rationale |
| --- | --- | --- | --- | --- | --- |
| `erasmus_crowl` | Erasmus Crowl | `inquisition` | 4 | W40K-0456..0459 | Inquisitor-POV der Trilogie + Omnibus. |
| `luce_spinoza` | Luce Spinoza | `inquisition` | 4 | W40K-0456..0459 | Crowl's Interrogator-Akolyth. Inquisitorial Interrogator-Grain unter dem Ordo-Umbrella. |

### Watchers of the Throne duology (Wraight, batch 046) — 3 rows

| id | name | primaryFactionId | freq | source | rationale |
| --- | --- | --- | --- | --- | --- |
| `aleksei_lev_tieron` | Aleksei Lev Tieron | `senatorum_imperialis` | 2 | W40K-0452, W40K-0453 | Chancellor des Senatorum (High Twelve). FK auf Pass-7-Promotion `senatorum_imperialis`. |
| `tanau_aleya` | Tanau Aleya | `talons_of_the_emperor` | 2 | W40K-0452, W40K-0453 | Sister of Silence Vigilator. FK auf existierende Row (Sisters of Silence → Talons of the Emperor). |
| `valerian` | Valerian | `custodes` | 2 | W40K-0452, W40K-0453 | Custodian Companion. |

### Horusian Wars trilogy (French, batch 047) — 1 row

| id | name | primaryFactionId | freq | source | rationale |
| --- | --- | --- | --- | --- | --- |
| `inquisitor_covenant` | Inquisitor Covenant | `inquisition` | 3 | W40K-0466..0468 | Inquisitor-Protagonist der Trilogie. Eine Row pro Volume (kein Cross-Batch-Alias-Split). |

### Dark Imperium trilogy + Plague War (Haley, batch 047) — 2 rows

| id | name | primaryFactionId | freq | source | rationale |
| --- | --- | --- | --- | --- | --- |
| `mortarion` | Mortarion | `death_guard` | 3 | W40K-0463..0465 | Daemon-Primarch der Death Guard. Sowohl freq≥2 als auch lore-ikonisch (Dossier 7b spine). |
| `typhus` | Typhus | `death_guard` | 1 (lore-iconic) | W40K-0464 | Herald of Nurgle / Plague-Lord. Primarch-Tier-Antagonist; Dossier 7c lore-iconic freq=1. |

### Cadian Saga (Hill, batches 047–048) — 1 row

| id | name | primaryFactionId | freq | source | rationale |
| --- | --- | --- | --- | --- | --- |
| `minka_lesk` | Minka Lesk | `astra_militarum` | 5 | W40K-0469..0473 | Cadian POV des gesamten Arcs. Höchste Spine-Evidenz der Welle. Regiment-Grain (Cadian Shock Troops) landet faction-axis via Pass-1-Alias `Cadian Shock` → `cadian_shock_troops`; primaryFactionId hier auf `astra_militarum` (Spine-Default, kein per-Char Regiment-FK). |

### Blackstone Fortress duology + anthology (Hinks, batch 049) — 8 rows

Acht Charaktere recurrieren über `Blackstone Fortress` (W40K-0483) + `Ascension` (W40K-0485) + `Vaults of
Obsidian` (W40K-0484 Anthology). Alle freq ≥ 2.

| id | name | primaryFactionId | freq | rationale |
| --- | --- | --- | --- | --- |
| `janus_draik` | Janus Draik | `rogue_traders` | 3 | Rogue-Trader-POV. |
| `grekh` | Grekh | `kroot` | 3 | **Phase-1-FK-Bindung**: erster Charakter, der die neue `kroot`-Row als primaryFactionId nutzt (Dossier 7b: `kroot` if Phase 1 promotes; Phase 1 hat promoviert). Runbook §5 erfüllt. |
| `raus` | Raus | `ratlings` | 3 | **Phase-1-FK-Bindung**: Ratling-Twin, primaryFactionId auf die neue `ratlings`-Row. |
| `rein` | Rein | `ratlings` | 3 | **Phase-1-FK-Bindung**: Ratling-Twin (Geschwister von Raus), gleiche FK. |
| `audus` | Audus | `rogue_traders` | 2 | Draik-Retainer (Pilot). |
| `isola` | Isola | `rogue_traders` | 2 | Draik-Retainer (Seneschal). |
| `taddeus` | Taddeus | `ecclesiarchy` | 2 | Ecclesiarchy-Preacher attached to Draik. |
| `vorne` | Vorne | `rogue_traders` | 2 | Draik-Retainer (Gun-Servant). |

### Iyanden duology (Thorpe, batch 049) — 4 rows

| id | name | primaryFactionId | freq | source | rationale |
| --- | --- | --- | --- | --- | --- |
| `yvraine` | Yvraine | `ynnari` | 2 | W40K-0481, W40K-0482 | Ynnari-Prophetess. Lore-iconic Ynnari-Triumvirat-Anker. |
| `the_visarch` | The Visarch | `ynnari` | 1 (lore-iconic) | W40K-0481 | Sword of Ynnead / Yvraine's bodyguard. Dossier 7b cluster-iconic. |
| `the_yncarne` | The Yncarne | `ynnari` | 1 (lore-iconic) | W40K-0481 | Avatar of Ynnead. Ynnari-Triumvirat. |
| `iyanna_arienal` | Iyanna Arienal | `ynnari` | 1 (lore-iconic) | W40K-0481 | Iyanden Spiritseer aligned with the Ynnari; central figure of Ghost Warrior. |

### Devastation of Baal cluster (Haley, batch 048) — 1 row

| id | name | primaryFactionId | freq | source | rationale |
| --- | --- | --- | --- | --- | --- |
| `gabriel_seth` | Gabriel Seth | `flesh_tearers` | 1 (lore-iconic) | W40K-0474 | Chapter Master of the Flesh Tearers. Lore-iconic Blood-Angels-Successor. FK auf existierende `flesh_tearers`. |

### Iron Hands cluster (Guymer, batches 046–047) — 1 row

| id | name | primaryFactionId | freq | source | rationale |
| --- | --- | --- | --- | --- | --- |
| `kardan_stronos` | Kardan Stronos | `iron_hands` | 1 (lore-iconic) | W40K-0460..0462 | Iron Council Chapter Master. Dossier 7b: cluster-iconic anchor despite freq 1 — Eye of Medusa / Voice of Mars sind „his story". |

## New aliases in `scripts/seed-data/character-aliases.json` (+1)

| surface form | freq | → canonical id | rationale |
| --- | --- | --- | --- |
| `Zelia` | 1 | `zelia_lor` | **7a Case A** — Cross-Batch-Alias-Konsolidierung. `Zelia Lor` (freq 5, W40K-0486..0490) + bare given name `Zelia` (freq 1, W40K-0491 Tomb of the Necron) → eine Row + Alias. Default-Form bleibt `Zelia Lor` (Roman-Konsistenz Cavan-Scott-Serie). Konsistent mit Pass-7-Pattern (Ahriman / Abaddon / Yarrick / Farsight / Gunnlaugr). |

## Promotions-Disziplin (Dossier §7 / Runbook §4)

**freq ≥ 2 strict promotions (own row):** 16 — Talen (6), Zelia Lor (6 kombiniert), Mekki (5), Fleapit (5),
Minka Lesk (5), Erasmus Crowl (4), Luce Spinoza (4), Grekh (3), Inquisitor Covenant (3), Janus Draik (3),
Mortarion (3), Raus (3), Rein (3), Aleksei Lev Tieron (2), Audus (2), Harleen Amity (2), Isola (2), Taddeus
(2), Tanau Aleya (2), Valerian (2), Vorne (2), Yvraine (2). (22 strict — Zelia Lor zählt Kombiniert nach 7a.)

**Lore-iconic freq=1 promotions (own row):** 6 — Gabriel Seth, Iyanna Arienal, Kardan Stronos, The Visarch,
The Yncarne, Typhus.

**Alias-Adds (7a Case A):** 1 — `Zelia` → `zelia_lor`.

**Bewusst NICHT promoviert** (Dossier 7d / Evidenz-Schwäche):

- **`Naiall Fireheart` / `Nuadhu Fireheart`** (je freq 1, W40K-0482 Wild Rider) — Dossier 7d explizit:
  zwei verschiedene Charaktere (Vater verstorben, Sohn titular), **kein** Alias. Beide freq=1, ohne
  cluster-cross-batch-Recurrence, keinen lore-iconic-Anker stark genug für eine Row diese Welle. Long-tail.
- **`Inquisitor Jeremias`** (freq 1, W40K-0490 Plague of the Nurglings) — Dossier 7c als „Phase-3
  judgment". Einmaliges Auftreten, kein Cluster-Spine. Long-tail.
- **Sepulturum/Deacon-Cluster Mortisian Inquisitors** (`Morgravia Sanctus`, `Arch-Deacon Ambrose`,
  `Cardinal Lorenz` — alle freq 1) — Dossier 7b explizit: „freq 1 each, no spine here, individual Phase-3
  freq-1 decisions only (not auto-promote)". Warhammer-Horror-Stand-Alones; long-tail.
- **Lange Liste freq=1 ohne lore-iconic-Anker** (Admiral Danakan, Alabastian Valenth, Ashielle Matkosen,
  Aster Lydorran, Atraxii, Bered Davan, Bolaraphon, Chel, Cornak, Dominic Seroff, Drakul-zar, Elena
  Grayloc, General Grüber, Havisa, Helios, Heyd Calder, Iron Father Kristos, Izaak, Kavel, Lyse, Mabeth,
  Maeson Strock, Major Bendikt, Mathieu, Monika, Oblexus, Ruprekt Matkosen, Sister Superior Trishala,
  Skreech, Talicto, Teresina Sullo, The Archivist, The Broker, Theron, Turan Raakis, Warsmith Rhodaan,
  Xedro Farren, Zaeroph) — long-tail per Runbook §2 („lieber Long-Tail offen lassen als eine falsche
  Canonical-Kante schreiben").

**Bereits direct/alias vor Pass 8 (keine Aktion):**

- Direct: Roboute Guilliman, Belisarius Cawl, Abaddon the Despoiler, Mephiston, Logan Grimnar, Njal
  Stormcaller (alle in §3).
- Alias: Dante (→ commander_dante), Ursarkar Creed (→ ursarkar_e_creed).

## Cross-Axis-Konflikte (Dossier §4 — Phase-3-Hälfte)

Keine direkten Phase-3-Auswirkungen: die drei Cross-Axis-Konflikte (`Iyanden`, `Saim-Hann`, `Ziasuthra`)
sind alle faction+location, **nicht** character. Phase 1 (Factions) hat zwei davon via Alias geklärt;
Phase 2 (Locations) hat zwei davon als eigene Rows promoviert (`iyanden` existierte vorher, `saim_hann` neu)
und `Ziasuthra` long-tail gelassen. Phase 3 berührt keine dieser drei Surface Forms (Character-Axis hat sie
nicht in §3).

Hinweis aus Dossier 7d: **`Naiall Fireheart` vs `Nuadhu Fireheart`** ist KEIN Alias-Konflikt — beide bleiben
unresolved long-tail (siehe oben), die Disambiguation ist somit trivial.

## FK-Reihenfolge / Phase-1-Set (Runbook §5)

Alle 27 neuen Rows mit nicht-null `primaryFactionId` verweisen auf das **post-Phase-1-Faction-Set**:

| primaryFactionId | Anzahl neue Chars | Pre-Pass-8? | Pass-1 promoviert? |
| --- | --- | --- | --- |
| `astra_militarum` | 2 (Talen, Minka Lesk) | ✓ | — |
| `ynnari` | 4 (Yvraine, Visarch, Yncarne, Iyanna) | ✓ | — |
| `rogue_traders` | 5 (Draik, Audus, Isola, Vorne, ...) | ✓ | — |
| `inquisition` | 4 (Crowl, Spinoza, Covenant, Amity) | ✓ | — |
| `death_guard` | 2 (Mortarion, Typhus) | ✓ | — |
| `mechanicus` | 1 (Mekki) | ✓ | — |
| `imperium` | 1 (Zelia Lor) | ✓ | — |
| `ecclesiarchy` | 1 (Taddeus) | ✓ | — |
| `flesh_tearers` | 1 (Gabriel Seth) | ✓ | — |
| `iron_hands` | 1 (Kardan Stronos) | ✓ | — |
| `senatorum_imperialis` | 1 (Tieron) | — (Pass 7) | — |
| `talons_of_the_emperor` | 1 (Aleya) | ✓ | — |
| `custodes` | 1 (Valerian) | ✓ | — |
| `kroot` | 1 (Grekh) | — | **✓ Pass 8 Phase 1** |
| `ratlings` | 2 (Raus, Rein) | — | **✓ Pass 8 Phase 1** |

`fleapit` ist mit `primaryFactionId: null` (legitim per Schema; `test-resolver-data-integrity.ts` validiert
„character primaryFactionIds point at existing factions or null"). Drei der neuen Chars (Grekh, Raus, Rein)
binden explizit die Phase-1-Promotionen (`kroot`, `ratlings`) — Runbook §5 demonstriert.

## Resolver-Test-Cases (`scripts/test-resolver.ts`, +12)

Eingefügt direkt nach dem seventh-wave-Block (Gunnlaugur-Alias), vor `console.log("\nnormalizeCharacterRole")`.
≥ 5 gefordert / 12 geliefert; ≥ 2 Alias-Konsolidierung gefordert / 2 geliefert.

| # | Test (kurz) | Typ | Wave-Evidenz |
| --- | --- | --- | --- |
| 1 | `Zelia Lor` + `Zelia` collapse → `zelia_lor` | alias-consolidation | 7a Case A — neu in Pass 8 |
| 2 | `Ursarkar Creed` + `Lord Castellan Creed` collapse → `ursarkar_e_creed` | alias-consolidation | §3 wave surface `Ursarkar Creed` freq 1 alias-resolved, paart mit der Pass-3-Alias |
| 3 | `Mortarion` direct | direct | §3 freq 3 (Dark Imperium) |
| 4 | `Minka Lesk` direct | direct | §3 freq 5 (Cadian Saga) |
| 5 | `Erasmus Crowl` direct | direct | §3 freq 4 (Vaults of Terra) |
| 6 | `Janus Draik` direct | direct | §3 freq 3 (Blackstone Fortress) |
| 7 | `Grekh` direct (Phase-1-FK-Bindung) | direct | §3 freq 3 — primaryFactionId `kroot` |
| 8 | `Yvraine` direct | direct | §3 freq 2 (Iyanden duology) |
| 9 | `Talen` direct | direct | §3 freq 6 (wave-top character) |
| 10 | `Mekki` direct | direct | §3 freq 5 (Warped Galaxies) |
| 11 | `Kardan Stronos` direct (lore-iconic cluster anchor) | direct | §3 freq 1 lore-iconic — Iron Hands |
| 12 | `Typhus` direct (lore-iconic) | direct | §3 freq 1 lore-iconic — Death Guard |

## Idempotency-Check

Pre-Phase-Sets:

- `characters.json`: 297 Rows. Alle 28 neuen `id`-Slugs (`zelia_lor`, `talen`, `mekki`, `fleapit`,
  `minka_lesk`, `erasmus_crowl`, `luce_spinoza`, `grekh`, `inquisitor_covenant`, `janus_draik`, `mortarion`,
  `raus`, `rein`, `aleksei_lev_tieron`, `audus`, `harleen_amity`, `isola`, `taddeus`, `tanau_aleya`,
  `valerian`, `vorne`, `yvraine`, `gabriel_seth`, `kardan_stronos`, `the_visarch`, `the_yncarne`,
  `iyanna_arienal`, `typhus`) und alle 28 `name`-Strings sind neu — kein Konflikt (verifiziert via
  `test:resolver-data` „no duplicate ids or names in resolver reference JSONs").
- `character-aliases.json`: 39 Keys. `Zelia` ist neu (kein vorhandener Key).
- Alias-Target `zelia_lor` zeigt auf eine in derselben Phase neu angelegte Row (atomic: beide Edits in
  einem Commit; validiert durch `alias targets point at canonical ids`).

Re-Run dieser Phase auf dem post-commit-Stand wäre no-op.

## Verifikation (Runbook §10)

Code-berührende Phase 3 hält die Trias grün, vor dem Commit:

```text
npm run test:resolver            → 267 passed, 0 failed   (255 + 12 neu im eighth-wave-Block)
npm run test:resolver-data       → resolver data integrity ok (10/10 Checks: u. a.
                                    „character primaryFactionIds point at existing factions or null",
                                    „alias targets point at canonical ids", „no duplicate ids or names")
npm run test:resolver-coverage   → grand totals factions=1662/1978, locations=640/818,
                                    characters=1074→**1078**/1399 (+4 retro-resolves in 001..045 —
                                    pre-existing Mortarion/Yvraine/Typhus/… mentions in älteren Books,
                                    die jetzt eine canonical Row treffen; below-threshold rows sind
                                    data findings, not failures)
npm run test:apply-override-dry  → [apply-override-dry] ok
                                    (0 missing roster externalBookIds, 0 missing facet ids,
                                     0 invalid normalized roles, 0 invalid rating overrides,
                                     0 missing resolved FK targets, 0 dangling JSON FK/alias refs,
                                     15 forward collection refs (pre-existing Pass-6/7 carry-through
                                     under Brief-091 range-aware Guard), 0 unresolvable constituent refs)
```

Phase 3 modifiziert nur Reference-Data-JSONs + `test-resolver.ts`. Lint/typecheck nicht erforderlich
(Runbook §10: nur Phase-4a-Skript-Edits triggern lint/typecheck — Phase 3 hat keine Script-Edits).

## Touched files (Write-Scope-konform)

Strikt eine Untermenge des Phase-3-Config-Scopes (`config.phases[3].scope`):

- `scripts/seed-data/characters.json` (+28 rows)
- `scripts/seed-data/character-aliases.json` (+1 alias)
- `scripts/test-resolver.ts` (+12 check()-Cases im eighth-wave-Block, vor `console.log("\nnormalizeCharacterRole")`)
- `sessions/resolver-dossiers/resolver-pass-8-phase-3-report.md` (diese Datei)

Ready for Phase 4a (Integration / Apply).
