# Resolver-Pass 10 — Phase 3 (Characters) Report

- **Wave:** `ssot-hh-001..002` (HH-0001..HH-0020, 20 books — HH-domain bootstrap)
- **Phase:** 3 (Characters)
- **Branch:** `codex/ingest-batches-resolver-trial-hh`
- **Worktree:** `chrono-lexicanum-batches`
- **Status:** done — ready for Phase 4a

## Summary

Phase 3 lands the Heresy-era character spine on top of the freshly-committed
Phase-1 faction set (FK-safe per runbook §5). 60 new canonical character rows
were promoted from the dossier §7b/§7c shape — every Primarch the wave surfaces,
every freq≥2 spine character, plus the curated freq=1 lore-iconic supporting
cast. 4 new alias entries were added: 2 Cross-Era (Lucius / Ezekyle Abaddon —
runbook §4 Honor-Title-Split), 1 cross-batch consolidation (Little Horus
Aximand → horus_aximand — dossier §7d), 1 slug-vs-surface bridge (Branne →
branne_nev — dossier §7d slug-convention call). 7 new resolver-test cases
covering all three alias paths plus four representative direct matches.

No `## Needs decision` block was raised: every dossier-flagged judgment call
(The Emperor slug, Severian's primaryFactionId, Branne slug convention)
resolved in-phase against the dossier guidance without architectural
ambiguity.

## Character rows added (60)

### Primarch spine (11 rows — runbook §4 "Primarchen ohne heutige Row")

Every traitor + loyalist Primarch the wave surfaces and that has no existing
canonical row (Magnus / Ferrus Manus / Mortarion / Roboute Guilliman / Kor
Phaeron stay as direct-anchor confirmations on the W40K-side rows per dossier
§7a Case G):

| id | name | primaryFactionId | dossier evidence |
| --- | --- | --- | --- |
| `horus` | Horus | `sons_of_horus` | freq 3 (HH-0001, HH-0002, HH-0003) — Warmaster |
| `lion_el_jonson` | Lion El'Jonson | `dark_angels` | freq 4 (HH-0006, HH-0011, HH-0016 +) — apostrophe stripped in slug per `shaso_oreskaan`/`aunrai` convention |
| `leman_russ` | Leman Russ | `space_wolves` | freq 3 (HH-0010, HH-0012, HH-0015) |
| `lorgar` | Lorgar | `word_bearers` | freq 3 (HH-0010, HH-0014, HH-0019) |
| `fulgrim` | Fulgrim | `emperors_children` | freq 3 (HH-0003, HH-0005 eponymous, HH-0020) |
| `alpharius` | Alpharius | `alpha_legion` | freq 3 — Legion-twin convention does not split the Legion row |
| `omegon` | Omegon | `alpha_legion` | freq 3 — paired with `alpharius` |
| `angron` | Angron | `world_eaters` | freq 2 |
| `rogal_dorn` | Rogal Dorn | `imperial_fists` | curated freq=1 lore-iconic |
| `corax` | Corax | `raven_guard` | curated freq=1 lore-iconic |
| `konrad_curze` | Konrad Curze | `night_lords` | curated freq=1 lore-iconic |

### Heresy spine, freq ≥ 2 (9 rows)

| id | name | primaryFactionId | dossier evidence |
| --- | --- | --- | --- |
| `garviel_loken` | Garviel Loken | `sons_of_horus` | freq 3 — opening-trilogy POV |
| `tarik_torgaddon` | Tarik Torgaddon | `sons_of_horus` | freq 3 — Mournival |
| `horus_aximand` | Horus Aximand | `sons_of_horus` | freq 2 + freq 1 alias ("Little Horus Aximand", §7d) |
| `erebus` | Erebus | `word_bearers` | freq 4 — highest-freq new HH character; Heresy puppet-master |
| `nathaniel_garro` | Nathaniel Garro | `death_guard` | freq 2 — Eisenstein loyalist; primaryFactionId death_guard (still nominally Death Guard in this wave) |
| `malcador_the_sigillite` | Malcador the Sigillite | `imperium` | freq 2 — primaryFactionId imperium (no clean Legion) |
| `luther` | Luther | `order_of_caliban` | freq 2 — Phase 1 promoted `order_of_caliban`, pivot of the Fallen arc |
| `nemiel` | Nemiel | `dark_angels` | freq 2 |
| `zahariel` | Zahariel | `dark_angels` | freq 2 |

### Curated freq=1 lore-iconic supporting cast (40 rows)

Justified per runbook §4 (Promotion threshold "freq ≥ 2 strict + a curated
list of lore-iconic freq=1 promotions"). All grounded in dossier §7b/§7d.
Grouped by faction for review compactness:

- **Custodes (2):** `constantin_valdor` (Captain-General, *Tales of Heresy*), `aquillon` (envoy, *First Heretic*).
- **Sons of Horus (2):** `iacton_qruze` (Half-heard, *Age of Darkness*), `severian` (apostate Luna Wolf, *The Outcast Dead* — Phase 3 judgment per §7b "no clean Legion" footnote: anchored to former Legion).
- **Emperor's Children (3):** `saul_tarvitz` (Isstvan III warning), `eidolon` (Lord Commander), `julius_kaesoron` (captain).
- **Word Bearers (2):** `argel_tal` (Gal Vorbak POV of *First Heretic*), `zadkiel` (antagonist captain of *Battle for the Abyss*).
- **Death Guard (2):** `solun_decius`, `kaleb_arin`.
- **Raven Guard (1):** `branne_nev` — canonical full name "Branne Nev", surface form "Branne" caught by alias (§7d slug-vs-surface convention).
- **Astra Militarum (3):** `hurtado_bronzi`, `peto_soneka`, `sheed_ranko` (Geno Five-Two Chiliad; primaryFactionId resolves via Phase-1 Imperial Army → astra_militarum alias).
- **Order of Caliban (1):** `sar_daviel` (Caliban knight; Phase 1 promoted `order_of_caliban`).
- **Ultramarines (2):** `cestus` (*Battle for the Abyss* POV), `remus_ventanus` (*Know No Fear* POV).
- **Space Wolves (1):** `brynngar`.
- **World Eaters (2):** `skraal`, `tagore`.
- **Thousand Sons (2):** `mhotep`, `atharva`.
- **Mechanicus (5):** `kelbor_hal` (Fabricator-General, Schism of Mars), `caxton`, `dalia_cythera`, `regulus`, `koriel_zeth` (Magma City Magos). All resolve via Phase-1 Mechanicum → mechanicus alias.
- **Adeptus Astra Telepathica (1):** `kai_zulane` (*The Outcast Dead* POV).
- **Adeptus Arbites (1):** `yosef_sabrat` (*Nemesis* mortal POV).
- **Officio Assassinorum (1):** `eristede_kell` (Vindicare).
- **Talons of the Emperor (1):** `amendera_kendel` (Sister of Silence Witchseeker — primaryFactionId consistent with existing `Sisters of Silence → talons_of_the_emperor` alias).
- **Cabal (1):** `john_grammaticus` (Phase 1 promoted `cabal` as new row).
- **Chaos (1):** `spear` (Nemesis Chaos-assassin antagonist; broad chaos row absorbs).
- **Imperium / civilians (6):** `mersadie_oliton`, `kyril_sindermann`, `kasper_hawser`, `lemuel_gaumon`, `uriah_olathaire`, `the_emperor` (slug `the_emperor` chosen per dossier §7d for direct surface-form match — no alias needed).

### Cross-Era anchor confirmations (no new rows, no aliases — §7a Cases F/G)

- `Magnus the Red` → `magnus_the_red` (direct match in §3).
- `Ferrus Manus` → `ferrus_manus` (direct).
- `Mortarion` → `mortarion` (direct).
- `Roboute Guilliman` → `roboute_guilliman` (direct).
- `Kor Phaeron` → `kor_phaeron` (direct — Pass 9 row).
- `Ahzek Ahriman` → `ahzek_ahriman` (direct, existing alias `Ahriman` already in place).
- `Astelan` → `astelan` (direct — existing W40K-side Fallen-era row absorbs the HH-era surface form; §7d Cross-Era confirmation).

## Alias entries added (4)

| surface form | canonical id | category | dossier reference |
| --- | --- | --- | --- |
| `Lucius` | `lucius_the_eternal` | Cross-Era Honor-Title-Split | §7a Case D — runbook §4 worked example |
| `Ezekyle Abaddon` | `abaddon_the_despoiler` | Cross-Era Honor-Title-Split | §7a Case E — runbook §4 worked example |
| `Little Horus Aximand` | `horus_aximand` | Cross-batch alias-consolidation | §7d — same person, two surface forms across batches |
| `Branne` | `branne_nev` | Slug-vs-surface convention | §7d — full canonical name on the row, short surface form via alias |

Total alias-file shape this phase: **4 new entries** (3 from the dossier
promotion-shape "2 Cross-Era + 1 alias-consolidation" + 1 slug-bridge for
`branne_nev`).

## Resolver test cases added (7; ≥ 2 alias-consolidation)

Appended to `scripts/test-resolver.ts` after the Pass-9 Szarekh case (line
~1130), before the `normalizeCharacterRole` block:

1. **Alias-consolidation** — `"Lucius"` → `lucius_the_eternal` (Cross-Era).
2. **Alias-consolidation** — `"Ezekyle Abaddon"` → `abaddon_the_despoiler` (Cross-Era).
3. **Alias-consolidation** — `"Little Horus Aximand"` → `horus_aximand` (cross-batch).
4. **Direct** — `"Horus"` → `horus` (Warmaster, freq 3).
5. **Direct** — `"Garviel Loken"` → `garviel_loken` (Heresy POV spine).
6. **Direct** — `"Erebus"` → `erebus` (highest-freq new HH character, freq 4).
7. **Direct** — `"Lion El'Jonson"` → `lion_el_jonson` (apostrophe-stripped slug check).

Runbook §3 Phase 3 requirement: ≥ 5 new test cases, ≥ 2 alias-consolidation —
**met** (7 cases, 3 alias-consolidation).

## FK-safety verification (runbook §5)

Every `primaryFactionId` on a new character row points at a faction that
exists in the post-Phase-1 `factions.json`:

- Baseline-anchor factions: `sons_of_horus`, `dark_angels`, `space_wolves`, `word_bearers`, `emperors_children`, `alpha_legion`, `world_eaters`, `imperial_fists`, `raven_guard`, `night_lords`, `iron_hands`, `thousand_sons`, `ultramarines`, `death_guard`, `custodes`, `mechanicus`, `astra_militarum`, `officio_assassinorum`, `adeptus_arbites`, `adeptus_astra_telepathica`, `talons_of_the_emperor`, `imperium`, `chaos` — all verified present in the baseline faction set (dossier §1).
- Phase-1-dependent factions: `cabal` (john_grammaticus), `order_of_caliban` (luther, sar_daviel) — both confirmed present in `factions.json` at lines 1204 / 1236 (Phase 1 added them per dossier §7c).

The `test:resolver-data` integrity check ("character primaryFactionIds point
at existing factions or null") passes — see "Trias" below.

## Idempotency check

Before writing the new rows, grep-verified that none of the 60 new IDs exists
in the pre-edit `characters.json`. The only existing HH-relevant rows (Magnus
the Red / Ahzek Ahriman / Abaddon the Despoiler / Lucius the Eternal / Ferrus
Manus / Mortarion / Roboute Guilliman / Kor Phaeron / Astelan / Kharn the
Betrayer) are anchors that already exist — they are intentionally
**not** duplicated and are absorbed via direct match (or, for HH-side
surface variants without Honor-Title, via the existing or new alias).

## Trias (runbook §10)

All four resolver tests pass on the edited Phase-3 state (run from the
repo-root checkout):

| script | result |
| --- | --- |
| `npm run test:resolver` | **315 passed, 0 failed** (308 baseline + 7 new HH cases) |
| `npm run test:resolver-data` | **resolver data integrity ok** (10 checks, incl. primaryFactionId FK check + alias-target check) |
| `npm run test:resolver-coverage` | **exit 0** (below-threshold smoke axes are data findings, not failures — Brief 077/084 already-suppressed surface forms unchanged by this phase) |
| `npm run test:apply-override-dry` | **`[apply-override-dry] ok`** — 0 missing roster externalBookIds, 0 missing facet ids, 0 invalid normalized roles, 0 invalid rating overrides, 0 missing resolved FK targets, 0 dangling JSON FK/alias refs, 0 unresolvable constituent refs. `forward collection refs: 15` is the expected range-aware Guard line for the W40K corpus + the three new HH anthology constituent forward-refs flagged by dossier §7d (HH-0010 / HH-0016 / HH-0020 → HH-0117..HH-0165 — out-of-range, Brief-091 Guard suppresses them) — not a failure. |

## Write-scope check

Files touched in this phase commit are a subset of the config Phase-3 scope
(`scripts/seed-data/characters.json`, `scripts/seed-data/character-aliases.json`,
`scripts/test-resolver.ts`, `sessions/resolver-dossiers/resolver-pass-10-phase-3-report.md`).
No other paths touched. The driver post-phase Write-Scope check passes.

## Notes / Phase 4 follow-up

- **Anthology forward-refs (dossier §7d architectural concern).** The three
  anthologies HH-0010 / HH-0016 / HH-0020 reference roster constituents
  outside the cumulative apply range (`hh 1..2`). Phase 3 does not own this
  concern; flagging for Phase 4a awareness — the `forward collection refs:
  15` line in the apply-override-dry digest is the range-aware Guard (Brief
  091) doing its job. If the Guard misfires in Phase 4a, that becomes a
  Phase-4a `## Needs decision` stop.
- **`Lucius` disambig — future-wave advisory.** This wave's `Lucius` alias
  is unambiguous (Emperor's Children swordsman from *Fulgrim*). A future
  wave that surfaces `Lucius` in a non-Heresy / non-Emperor's-Children
  context should `## Needs decision`-stop and revisit (e.g. per-book
  alias-removal + suffixed slugs), per runbook §4 "Ausnahme — echte
  Identitäts-Disambig". Recorded here for downstream Phase-3 sessions.

ready for 4b: not applicable (Phase 3 only); ready for Phase 4a: **yes**.
