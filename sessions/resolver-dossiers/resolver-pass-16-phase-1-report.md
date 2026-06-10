# Resolver-Pass 16 — Phase 1 (Factions) — Status

**Wave:** `ssot-w40k-058..060` (W40K-0571..W40K-0592, 22 Bücher).
**Phase:** phase-1-factions. **Ergebnis:** Done (kein `## Needs decision`-Stop).
**Quelle:** Runbook `scripts/runbooks/resolver-pass-runbook.md` §3 Phase 1 + §4; Config
`scripts/resolver-pass.config.json`; Dossier `sessions/resolver-dossiers/resolver-pass-16-dossier.md`.

## Promotions (factions.json) — 3 neue Canonical-Rows

| id | name | parent | alignment | tone | Evidenz / Schwelle |
| --- | --- | --- | --- | --- | --- |
| `leagues_of_votann` | Leagues of Votann | `null` | — | `alien` | **strict freq-2** (W40K-0577 *Darkness Eternal* + W40K-0580 *The High Kâhl's Oath*, die erste Votann-Novel). Dominante Faction-Promotion der Welle (Dossier §7c). |
| `order_pronatus` | Order Pronatus | `sisters_of_battle` | `imperium` | `archive` | **freq-1 lore-iconic** — Title-Faction von W40K-0571 *Aestred Thurga: Pyre of Faith*; per-Order-Präzedenz (`order_of_our_martyred_lady` / `order_of_the_last_candle`). |
| `exorcists` | Exorcists | `adeptus_astartes` | `imperium` | `imperial` | **freq-1 lore-iconic** — Protagonisten-Chapter von W40K-0582 *Oaths of Damnation*; single-Chapter-Row-Präzedenz (mortifactors / scythes / carcharodons …). |

Modellierungs-Notizen:

- **`leagues_of_votann`** — top-level Kin-Faction parity mit den nicht-Imperium/nicht-Chaos Army-Umbrellas
  (tau / necrons / eldar / tyranids / orks / cabal / rangdan / hrud / laer): `parent=null`, `tone='alien'`,
  **keine `alignment`** (Xenos-/Neutral-Umbrellas tragen typischerweise keine alignment). **Distinkt** von der
  bestehenden `squats`-Row (parent=`imperium`, tone=`historical_canon_layer`): Squats = historischer
  Imperialer-Abhuman-Layer, Leagues of Votann = moderne eigenständige Kin-Faction → zwei Identitäten, kein
  Row-Merge. **Browse-Root-Status deferred** — trotz Parity mit den Army-Umbrella-Browse-Roots wird **kein**
  neuer `browseRoot` ohne Maintainer-Decision angelegt (runbook §3 Phase 1).
- **`order_pronatus`** gibt Phase 3 einen feineren `primaryFactionId`-Ziel-Grain für `aestred_thurga`
  (alternativ `sisters_of_battle`).

## Aliases (faction-aliases.json) — 3 neue Einträge

| surface form | → canonical id | Begründung |
| --- | --- | --- |
| `Aeldari Harlequins` | `harlequins` | Präzise bestehende eldar-Sub-Row (`harlequins` existiert bereits). Lore-eindeutig; W40K-0578 *Saints of the Imperium*. Bevorzugt vor coarse `→ eldar`, weil eine präzise Row vorhanden ist (Dossier §7d.3). |
| `Cadian Kasrkin` | `kasrkin` | Präzise bestehende Row — Kasrkin **sind** Cadian-Elite-Stormtroopers. W40K-0591 *Soldiers of the Imperium*. Bevorzugt vor coarse `→ astra_militarum`. |
| `Kindred of the Eternal Starforge` | `leagues_of_votann` | Votann-Sub-Org (Kindred) → Umbrella. Authority-Layer-Coarseness analog `Cadian → cadian_shock_troops`. W40K-0580; setzt das `leagues_of_votann`-Row voraus (landet in dieser Phase). Dossier §7d.2. |

Hinweis: `Leagues of Votann`, `Order Pronatus`, `Exorcists` resolven **direct** (name-Match) — kein
Alias nötig.

## faction-policy.json

`specialCases`-Notizen für `leagues_of_votann`, `order_pronatus`, `exorcists` ergänzt (Parent-/Alignment-/
Tone-Rationale + „KEIN Browse-Root" bzw. „Browse-Root deferred"). **Kein** neuer `browseRoot`,
`knownTopLevelExceptions`, `redundantWhenSubPresent`-Eintrag (runbook §3 Phase 1: kein neuer Browse-Root
ohne Maintainer-Decision).

## Bewusst unresolved gelassen (kein Raten — runbook §2/§4)

- **`Vostroyan Blackbloods`** (W40K-0584, freq-1) — Identitäts-Unsicherheit, ob „Blackbloods" = die
  bestehende `vostroyan_firstborn`-Row oder ein distinktes Regiment. Kein lore-eindeutiges Ziel → unresolved
  (runbook §4 Identitäts-Unsicherheit; kein architektonischer Block, daher kein `## Needs decision`-Stop).
- **`Vraksian Renegade Militia`** (W40K-0588, freq-1) — generische Renegaten-Militia ohne lore-eindeutiges
  Canonical-Target; Aliasing auf das generische `traitor_guard` wäre debattierbarer Grain. Dossier §7c
  empfiehlt explizit „likely leave unresolved". → unresolved gelassen.

## Confirmations (kein Edit nötig — bereits direct/alias)

Adepta Sororitas → `sisters_of_battle`, Astra Militarum, Orks, Tyranids, Death Guard, Genestealer Cults,
Space Wolves, T'au Empire / T'au → `tau`, Word Bearers, Adeptus Mechanicus → `mechanicus`,
Chaos Daemons → `daemons`, Adeptus Ministorum → `ecclesiarchy`, Drukhari → `eldar`, Deathwatch, Inquisition,
Night Lords, Adeptus Astartes, Alpha Legion, Black Templars, Catachan Jungle Fighters, Death Korps of Krieg,
Emperor's Children, Hive Fleet Leviathan, Kroot, Necrons, Order of Our Martyred Lady, Ordo Malleus,
World Eaters. (Pre-Pass-16 Baseline aus Dossier §1: 202 faction-Rows / 94 Aliases.)

## Idempotenz

Pro Row/Alias geprüft gegen den Pre-Pass-16-Stand: keine der 3 neuen Rows
(`leagues_of_votann`/`order_pronatus`/`exorcists`) und keiner der 3 neuen Aliases existierte zuvor; die
Alias-Targets (`harlequins`, `kasrkin`) sind bestehende Rows. Re-Run dieser Phase legt nichts doppelt an.

## Resolver-Test-Cases — 6 neue (≥ 5 gefordert)

In `scripts/test-resolver.ts`, `resolveFaction`-Sektion (vor `resolveLocation`):

1. `Leagues of Votann` → `leagues_of_votann` (direct, strict freq-2).
2. `Kindred of the Eternal Starforge` → `leagues_of_votann` (alias).
3. `Order Pronatus` → `order_pronatus` (direct, freq-1 lore-iconic).
4. `Exorcists` → `exorcists` (direct, freq-1 lore-iconic).
5. `Aeldari Harlequins` → `harlequins` (alias).
6. `Cadian Kasrkin` → `kasrkin` (alias).

## Verifikation (runbook §10)

- `npm run test:resolver` → **479 passed, 0 failed** (inkl. der 6 neuen Cases).
- `npm run test:resolver-data` → **resolver data integrity ok** (faction parents / alias targets / alignment-Enum
  alle grün — `leagues_of_votann` ohne alignment ist konsistent mit den parent-null Xenos-Umbrellas).
- `npm run test:resolver-coverage` → exit 0 (below-threshold rows = Daten-Findings, keine Failures).
- `npm run test:apply-override-dry` → **ok** (out-of-range=0, unknown-work=0; forward-ref-Guard clean).
- JSON-Validität aller drei seed-data-Files bestätigt.

## Write-Scope

Berührt ausschließlich: `scripts/seed-data/factions.json`, `scripts/seed-data/faction-aliases.json`,
`scripts/seed-data/faction-policy.json`, `scripts/test-resolver.ts`, diese Statusdatei. Ein Commit.
