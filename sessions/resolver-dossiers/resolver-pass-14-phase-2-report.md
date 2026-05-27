# Resolver-Pass 14 — Phase 2 (Locations) Report

> **Wave:** `ssot-hh-021..025` (50 books, HH-0201..HH-0250). **Phase:** 2 (Locations).
> **Status:** done. Operative spec: [`sessions/resolver-pass-runbook.md`](../resolver-pass-runbook.md)
> §3 Phase 2 + §4 (Promotions-/Alias-Disziplin, Vessel-Konvention). Dossier:
> [`resolver-pass-14-dossier.md`](./resolver-pass-14-dossier.md).

## Done summary

Eight new location rows promoted (the curated freq-1 lore-iconic bloc minus `laer` + the 7d
cumulative-cross-pass `astagar` add) + one existing-row vessel-tag update + two new aliases
(bare-form `Phalanx` for the pre-existing `phalanx` row; `Laer → laeran` identity-coherence
override of the dossier-7c row-creation recommendation per runbook §4). Net **+8 rows / +2
aliases / +1 in-place tag update**. Trias green.

### Promotion set (8 new rows)

| canonical id | name | sector | tags | gx/gy | evidence (HH-N + dossier 7c/7d) |
| --- | --- | --- | --- | --- | --- |
| `chemos` | Chemos | `null` | `["emperors_children"]` | `null` | HH-0233 *The Last Phoenix* omnibus — Fulgrim's Primarch homeworld, foundational Emperor's-Children Primarch-birthworld surface. Parity with Pass-? `barbarus`/`caliban`/`colchis`/`nuceria`/`prospero` Primarch-homeworld rows (sector=null, faction-tag, gx/gy=null). **Lore-iconic strong-promotion case** (dossier 7c "the strongest lore-iconic promotion of Pass-14"). |
| `macragges_honour` | Macragge's Honour | `null` | `["vessel"]` | `null` | HH-0238 *Illyrium* — Ultramarines flagship, Guilliman's flagship throughout the Heresy and post-Heresy. Vessel-grain parity with Pass-13 `iron_blood` + `molechs_enlightenment` (sector=null, tags=["vessel"], gx/gy=null per runbook §3 Phase 2 vessel convention). **Lore-iconic strong-promotion case.** |
| `irkalla` | Irkalla | `null` | `["vessel"]` | `null` | HH-0224 *Abyssal* — Sisters-of-Silence Black Ship, civilian-POV-inside-Black-Ship namesake surface. Vessel-grain parity with `iron_blood`/`molechs_enlightenment`/`macragges_honour`. **Lore-iconic strong-promotion case.** |
| `imperial_webway` | Imperial Webway | `null` | `["imperium"]` | `null` | HH-0215 *Ordo Sinister* — Emperor's hidden Webway project under Terra, central Heresy-era Imperial mega-engineering construct that the Heresy interrupts. Construct/region grain (not planet, not vessel) → sector=null, gx/gy=null. **Lore-iconic strong-promotion case.** |
| `albia` | Albia | `solar` | `[]` | `null` | HH-0228 *Eater of Dreams* — Terran sub-region ("the Albian Land" per loop-log). Terran sub-region grain, sector=solar (Sol-segmentum), gx/gy=null (sub-locale grain, not pinned). **Lore-iconic medium-promotion case.** |
| `illyrium` | Illyrium | `ultima` | `["ultramarines"]` | `null` | HH-0238 *Illyrium* — Macragge province / Ultramar sub-locale, namesake of the audio drama. Sector=ultima (Segmentum Ultima), tags=["ultramarines"] (Ultramar-province ownership), gx/gy=null (sub-locale grain). **Lore-iconic medium-promotion case.** |
| `jupiter` | Jupiter | `solar` | `[]` | `null` | HH-0226 *The Serpent's Dance* — Sol-system planet (Jovian shipyards surface). Sector=solar parity with Pass-? `mars`/`luna`/`terra`. gx/gy=null (no map pin assigned this pass; geographical pin is a separate concern). **Lore-iconic medium-promotion case.** |
| `astagar` | Astagar | `null` | `[]` | `null` | Cumulative cross-pass freq-2 evidence — Pass-13 HH-0141 *Sedition's Gate* + Pass-14 HH-0217 *The Laurel of Defiance* (the Macragge ceremony with Astagar flashback). Dossier 7d "Astagar Pass-13-and-Pass-14 cumulative cross-batch evidence (Phase 2)" recommended promote. Sector=null, tags=[] (lore-thin faction attribution; Pass-13-arc Mechanicum/Iron-Hands frame). **Curated freq-2-cumulative cross-pass promotion case.** |

### Alias add (2 new)

| surface form | target canonical id | rationale |
| --- | --- | --- |
| `Phalanx` | `phalanx` | HH-0247 *Burden of Duty* surfaces bare-name `Phalanx` (without article). The existing canonical row `phalanx` has `name="The Phalanx"` and an existing `the Phalanx → phalanx` lowercase-article alias, but neither matches the bare-name surface form (resolver is case-sensitive, no fuzzy match). Same identity, surface-form variant → alias. **Same-row alias, no row creation needed.** |
| `Laer` | `laeran` | HH-0233 *The Last Phoenix* omnibus surfaces `Laer` (the Laer Temple of Slaanesh — the daemon-blade-corruption locale that turned Fulgrim). The existing canonical row `laeran` (`name="Laeran"`, tags=["emperors_children"]) IS this location (Laeran is the world; Laer is the species/short-form). Per runbook §4 ("Eine kanonische Identität = eine Canonical-Row. Era-/Form-spezifische Surface-Forms wandern in `*-aliases.json`."), the bare-form Laer → existing Laeran row. This **overrides the naïve dossier-7c row-creation recommendation** — same identity, two surface-form variants. |

### In-place row update (1 — tag-only, idempotent extension)

| canonical id | change | rationale |
| --- | --- | --- |
| `phalanx` | `tags: [] → ["vessel"]` | The pre-existing `phalanx` row had no vessel tag. Runbook §3 Phase 2 vessel convention requires `tags:['vessel']` + `gx/gy:null` for vessel-grain rows. `phalanx` (Imperial-Fists star-fortress / mobile fortress-monastery) is canonical vessel-grain per dossier 7c. Idempotent extension; no other field changed (sector / gx / gy already null). |

### Dossier 7c/7d judgments not taken (deviation log)

The dossier 7c recommended target was 8 strong rows (no Piamen). Final set: **8 new rows
(7 of the strong-curated set + the 7d cumulative `astagar`) + 1 alias-consolidation
(`Laer → laeran` instead of new row `laer`) + 1 in-place tag update (`phalanx`)**.

Deviations:

- **`laer` → routed as alias to existing `laeran`** instead of new row. Reason: the
  existing `laeran` canonical row (`name="Laeran"`, tags=["emperors_children"]) IS the
  Slaanesh-temple world that turned Fulgrim — Laeran is the homeworld name, Laer is a
  short-form / species-name shorthand for the same world. Per runbook §4, era-/form-specific
  surface-form variants live in `*-aliases.json`, not as duplicate rows. This deviation is the
  Phase-2 mirror of the Phase-1 `house_taranis → knights_of_taranis` deviation: identity-coherence
  override of the dossier-7c naïve row-creation recommendation.
- **`piamen` → left unresolved** (dossier 7c marked Phase-2 judgment, dossier 7d flagged
  anthology-cascade). HH-0236 *Konrad Curze: A Lesson in Darkness* surfaces `Piamen` direct;
  HH-0237 *The Lords of Terra* is an audio anthology re-issuing HH-0236 — so the strict-freq-2
  count is **effective freq-1 by independent-source evidence**. Per dossier 7d recommendation
  ("leave unresolved for budget conservatism, or promote if Phase-2 wants completionist
  Night-Lords-compliance-world grain"), this Phase 2 chooses **leave unresolved** — the
  Night-Lords-compliance-world grain warrant is thin (single-audio-drama mention), and the
  anthology-cascade caveat removes the strict-freq-2 promotion ground. **Long-tail
  unresolved.**
- **Weak-curated freq-1 long-tail rows left unresolved** per dossier 7c judgment:
  `terra_nullius` (HH-0201 single-novella, low cross-arc), `60_sixty` (HH-0231 omnibus, numeric
  Murder-system surface), `absalom` (HH-0216 single-novella Titan-duel world), `kronus`
  (HH-0207 Word Bearers Templum site, no cross-arc warrant), `thawra` (HH-0223 Malcador
  meeting site, lore-thin), `zaramund` (HH-0213 *Angels of Caliban* sequel world,
  sequel-context-dependent). Budget-conservatism — Phase 4a will surface these as `null`-FK
  for the resolver-coverage smoke checks (advisory carry-through, no apply-side failure).

### Phase-2 surface-form coverage (post-promotion)

After this phase the wave's location-axis surface forms resolve as follows (Pass-14 surface
set, freq desc):

- **freq 10 — `Terra` → `terra`** (direct; pre-existing).
- **freq 5 — `Isstvan V` → `istvaan_v`** (alias; pre-existing).
- **freq 3 — `Mars` → `mars`** (direct; pre-existing).
- **freq 2 — `Davin` → `davin`, `Isstvan III` → `istvaan_iii`, `Macragge` → `macragge`,
  `Piamen` → null (left unresolved per dossier 7d), `Prospero` → `prospero`, `Sol System` →
  `sol_system`, `Tizca` → `tizca`** (six direct + one alias + one left-unresolved).
- **freq 1 — direct on pre-existing rows:** Barbarus, Caliban, Calth, Colchis, Deliverance,
  Eye of Terror, Fenris, Imperial Palace, Iydris, Luna, Nikaea, Phall, Sotha, Tallarn,
  Ultramar (15 pre-existing direct hits).
- **freq 1 — new this pass (direct):** Chemos, Macragge's Honour, Irkalla, Imperial Webway,
  Albia, Illyrium, Jupiter, Astagar (8 new direct hits).
- **freq 1 — new aliases this pass:** Phalanx (HH-0247) → `phalanx`, Laer (HH-0233) →
  `laeran`.
- **freq 1 — left unresolved (long tail):** 60-Sixty, Absalom, Kronus, Terra Nullius,
  Thawra, Zaramund + Piamen (freq-2 anthology-cascade, see deviation log).

### Trias verification

```
$ npm run test:resolver
… 440 passed, 0 failed   # +10 new Pass-14 location test-cases inserted at the
                          # end of resolveLocation section (8 direct + 2 alias),
                          # exceeds the runbook ≥4-new-cases threshold

$ npm run test:resolver-data
ok - no duplicate ids or names in resolver reference JSONs
ok - faction parents point at existing factions
ok - location sectors point at existing sectors or null
ok - character primaryFactionIds point at existing factions or null
ok - present faction alignment values match the DB enum
ok - alias targets point at canonical ids
ok - location coordinates are paired
ok - sector surface forms resolve as non-pinned locations
ok - override character roles normalize to work_characters vocabulary
ok - coverage smoke slugs exist in w40k-001..057 + hh-001..020
resolver data integrity ok

$ npm run test:resolver-coverage
… totals: factions=2512/2855, locations=1033/1328, characters=1816/2299
… exit=0 (below-threshold rows are data findings, not automatic failures)

$ npm run test:apply-override-dry
… [apply-override-dry] ok
```

### Files touched (Phase-2 write-scope subset only)

- `scripts/seed-data/locations.json` — +8 rows (`chemos`, `macragges_honour`, `irkalla`,
  `imperial_webway`, `albia`, `illyrium`, `jupiter`, `astagar`) + 1 in-place tag update
  (`phalanx.tags: [] → ["vessel"]`).
- `scripts/seed-data/location-aliases.json` — +2 entries (`Phalanx → phalanx`, `Laer →
  laeran`).
- `scripts/seed-data/sectors.json` — **untouched** (new rows use existing sectors `solar` /
  `ultima` / `null`; no new sector needed).
- `scripts/test-resolver.ts` — +10 location test-cases (8 direct + 2 alias) appended at the
  end of the `resolveLocation` block, before `console.log("\nresolveCharacter")`.
- `sessions/resolver-dossiers/resolver-pass-14-phase-2-report.md` — this file.

### Forward-look to Phase 3 / Phase 4a

- **Phase 3 (Characters)** has no FK dependency on this Phase-2 set (characters reference
  `primaryFactionId`, not locations). Phase 3 proceeds independently per runbook §5.
- **Phase 4a (Integration/Apply)** will seed the 8 new location rows + the 2 new aliases via
  `scripts/seed-resolver-extensions.ts` and re-apply the cumulative HH 001..025 range. The
  Phase-2 surface-form coverage above means the dry-trio's `missing resolved FK targets`
  counter is expected at 0 for location-axis after Phase 4a expands the apply range — the
  long-tail `null`-FK surfaces (Piamen, Terra Nullius, 60-Sixty, Absalom, Kronus, Thawra,
  Zaramund) are advisory carry-through (resolver returns null, apply skips silently per
  Brief 084 location-umbrella-skip pattern; no apply-side failure).
- **Phase 4a forward-ref Guard:** dossier 7d expects `out-of-range=0, unknown-work=0` for the
  three roster-collection omnibi (HH-0231 / HH-0232 / HH-0233) once Phase 4a extends the
  apply range to include 021..025. The current Phase-2-stage dry-run (on the pre-existing
  001..020 range) shows `out-of-range=3, unknown-work=0` — these are pre-Phase-4a baseline
  carry-through (Phase 4a will re-verify the clean Guard outcome).
