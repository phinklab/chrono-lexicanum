# Resolver-Pass 6 — Phase 1 (Factions) report

> Done-summary. No `## Needs decision` — every promotion/alias call resolved in-phase with
> justification (dossier §7 expected zero hard blockers; confirmed). Wave `ssot-w40k-026..035`
> (W40K-0251..0350), Space-Marine-Battles- / chapter-heavy.

## What changed

- **`scripts/seed-data/factions.json`**: 154 → **162 rows** (+8).
- **`scripts/seed-data/faction-aliases.json`**: 37 → **41** (+4).
- **`scripts/seed-data/faction-policy.json`**: +1 `specialCases` note (`relictors`); **no browse-root added**.
- **`scripts/test-resolver.ts`**: +12 faction cases (8 direct, 4 alias). `npm run test:resolver` = **185 passed, 0 failed**.

## New faction rows (8)

Every freq ≥ 2 **unresolved** faction surface form from dossier §3/§7c that isn't already an
existing umbrella, + the one strictly-eponymous freq-1. ID = snake_case(name).

| id | name | parent | alignment | tone | freq | rationale |
| --- | --- | --- | --- | --- | --- | --- |
| `dragon_warriors` | Dragon Warriors | heretic_astartes | chaos | chaos | **4** | Nihilan's renegade-Salamanders warband (Kyme *Tome of Fire*, W40K-0272..0276). **[Phase-3 FK: Nihilan]** |
| `red_corsairs` | Red Corsairs | heretic_astartes | chaos | chaos | **4** | Huron Blackheart's renegades (W40K-0284/0303/0347). **[Phase-3 FK: Huron Blackheart, Variel]** |
| `white_consuls` | White Consuls | adeptus_astartes | imperium | imperial | **4** | Ultramarines successor (W40K-0266/0267/0286). |
| `relictors` | Relictors | adeptus_astartes | imperium | imperial | **3** | Radical/Excommunicate chapter (W40K-0286/0311/0324) — see policy note. |
| `blood_gorgons` | Blood Gorgons | heretic_astartes | chaos | chaos | **2** | Zou's ex-World-Eaters warband; principal of W40K-0270 *Blood Gorgons* (+ omnibus 0271). |
| `doom_eagles` | Doom Eagles | adeptus_astartes | imperium | imperial | **2** | Ultramarines successor (W40K-0299/0320). |
| `marines_errant` | Marines Errant | adeptus_astartes | imperium | imperial | **2** | Loyalist successor (W40K-0347/0349, Night Lords cluster). |
| `legion_of_the_damned` | Legion of the Damned | adeptus_astartes | imperium | imperial | 1 | **Eponymous** — principal of W40K-0285 *Legion of the Damned* (Sanders). Spectral Astartes → pragmatic adeptus_astartes/imperium. |

**Parent logic** (all parents are pre-existing rows → FK-safe): Chaos warbands →
`heretic_astartes` per its policy specialCase ("Hosts … Renegade Chapters / Warbands");
loyalist successors → `adeptus_astartes`, matching siblings `flesh_tearers` / `carcharodons` /
`silver_skulls`.

## New aliases (4)

All target **pre-existing** canonical rows — pure surface-coverage, lore-unique, no cross-axis
trap (dossier §4 conflicts = none).

| surface form | → id | freq | rationale |
| --- | --- | --- | --- |
| `Tau` | `tau` | 3 | No-apostrophe variant (dossier §7c "clearest in-wave fix"); `T'au` / `Tau Empire` / `T'au Empire` already route to `tau`. |
| `Chaos Daemons` | `daemons` | 2 | Standard army name → existing `daemons` umbrella row. |
| `Daemons of Tzeentch` | `tzeentch` | 2 | Tzeentch-specific (books W40K-0286 *Architect of Fate* / W40K-0310 *Fateweaver* = Kairos/Tzeentch). Mapped to the more-specific god-faction row, not generic `daemons`. |
| `Militarum Tempestus` | `tempestus_scions` | 1 | The `tempestus_scions` row already exists and `faction-policy.json` explicitly equates the two; coverage-only for an existing entity, not a new freq-1 promotion. |

## Faction-policy note

Added a `relictors` `specialCases` entry: loyalist-but-radical chapter declared Excommunicate
Traitoris (wields daemonic relics against Chaos), modelled `parent='adeptus_astartes'` /
`alignment='imperium'` for the authority layer — same single-parent pragmatism already
documented for `howling_griffons` / `deathwatch`. No new browse-root (none of the 8 rows is a
top-level index; all sit under existing roots).

## Idempotency

Confirmed against the full 154-row `factions.json` + 37-key `faction-aliases.json`: all 8 new ids
**and** their `name`s are absent pre-pass, and all 4 alias keys are absent. Only missing rows were
created; nothing existing was edited. Already-present parents reused (NOT recreated):
`heretic_astartes`, `adeptus_astartes`, `daemons`, `tzeentch`, `tau`, `tempestus_scions`.

## Deliberate non-promotions (per runbook §4 discipline)

freq-1 long tail left **unresolved** (not eponymous-iconic this wave): Astral Knights (defensible
via W40K-0295 *The World Engine* but the book isn't chapter-eponymous → conservatively excluded),
Excoriators, Black Dragons, Blood Drinkers, Blood Swords, Brazen Minotaurs, Crimson Sabres,
Crimson Castellans, Jade Dragons, Star Dragons, Fulminators, Legio Invigilata, Marines Malevolent,
Novamarines, Traitor Guard, Chaos Cultists, Ironclads, Daemons of Nurgle, Daemons of Slaanesh.
Already-resolving (no work): `Imperial Guard`→`astra_militarum`, `Eldar`/`Dark Eldar`→`eldar`,
`Chaos Space Marines`→`heretic_astartes`, `Sisters of Battle`→`sisters_of_battle`, `T'au`→`tau`.

## Phase-3 FK readiness (runbook §5)

Both **new** faction dependencies flagged by dossier §7b/§7d are now landed: `red_corsairs`
(Huron Blackheart, Variel the Flayer) and `dragon_warriors` (Nihilan). Every other Phase-3 spine
already points at a pre-existing faction. Phase 3 can set those `primaryFactionId`s safely.

## Verification

- `JSON.parse` valid on all three touched JSONs (loaded by `tsx` at resolver module-init).
- `npm run test:resolver` → **185 passed, 0 failed** (incl. the 12 new sixth-wave cases).
- `npm run test:resolver-data` → `resolver data integrity ok` (exit 0; alias targets point at canonical ids, no dangling FKs).
- `npm run test:resolver-coverage` → exit 0 (below-threshold rows are data findings, not failures; faction coverage rises as the wave's new forms now resolve).
- `npm run test:apply-override-dry` → `[apply-override-dry] ok` (exit 0; 0 dangling JSON FK/alias refs, 0 missing resolved FK targets).
- Grand-alignment skip (Brief 077) unaffected: all 8 new sub-factions carry explicit `alignment`, so a block tagging both `Imperium`/`Chaos` + a new sub-faction skips the redundant umbrella as before.
