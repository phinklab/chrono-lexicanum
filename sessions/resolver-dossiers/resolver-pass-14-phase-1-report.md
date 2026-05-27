# Resolver-Pass 14 — Phase 1 (Factions) Report

> **Wave:** `ssot-hh-021..025` (50 books, HH-0201..HH-0250). **Phase:** 1 (Factions).
> **Status:** done. Operative spec: [`sessions/resolver-pass-runbook.md`](../resolver-pass-runbook.md)
> §3 Phase 1 + §4 (Promotions-/Alias-Disziplin inkl. Cross-Era-Identitäten). Dossier:
> [`resolver-pass-14-dossier.md`](./resolver-pass-14-dossier.md).

## Done summary

Five strong-curated freq-1 lore-iconic faction rows promoted + one identity-coherence alias
add (House Taranis → existing Pass-10 `knights_of_taranis` row, runbook §4 Surface-Form-Treue
override of the naïve dossier-7c row-creation recommendation). Net **+5 rows / +1 alias**.
Trias green.

### Promotion set (5 new rows)

| canonical id | parent | alignment | tone | evidence (HH-N + dossier 7c) |
| --- | --- | --- | --- | --- |
| `ordo_sinister` | `mechanicus` | `imperium` | `archive` | HH-0215 *Ordo Sinister* — Hydragyrum female pariah-princeps protagonist defending Imperial Webway. Mechanicum psi-titan sub-org analog to skitarii/adeptus_titanicus grain. **Lore-iconic strong-promotion case.** |
| `legio_audax` | `adeptus_titanicus` | `chaos` | `engine` | HH-0216 *The Ember Wolves* — POV-Legion ("traitor princeps' viewpoint" per dossier §1). Parity with `legio_mortis` / `legio_vulpa` (adeptus_titanicus parent + chaos alignment for fallen Titan Legions). **Lore-iconic strong-promotion case.** |
| `legio_castigatra` | `adeptus_titanicus` | `imperium` | `engine` | HH-0216 *The Ember Wolves* — paired loyalist antagonist to Audax in the Titan-vs-Titan duel. Parity with `legio_ignatum` / `legio_solaria`. Paired Audax/Castigatra promotion preserves the Titan-vs-Titan symmetry of the source. **Lore-iconic strong-promotion case.** |
| `legio_cybernetica` | `mechanicus` | `imperium` | `engine` | HH-0209 *Myriad* — Mars loyalist guerrilla cell with Kastelan robots, direct sequel to the *Cybernetica* novel. Mechanicum robotics sub-org parallel to adeptus_titanicus / skitarii. **Lore-iconic strong-promotion case.** |
| `blackshields` | `null` | _(none)_ | `line` | HH-0208 *Blackshield* — Crysos Morturg POV vs Khorak Death-Guard-renegade. Catch-all mixed-/renegade-Legion warband category, by definition outside the loyalist/traitor binary (no alignment property — that **is** the defining trait). Future-proof: per dossier §1, loop-log signals an Endryd-Haar Blackshields sub-arc surfacing 36 books later at HH-0286+ → promoting at first-hit prevents Pass-26-area churn. **Lore-iconic strong-promotion + future-proof case.** |

### Alias add (1 new)

| surface form | target canonical id | rationale |
| --- | --- | --- |
| `House Taranis` | `knights_of_taranis` | HH-0227 *The Lightning Hall* surfaces `House Taranis`; the existing Pass-10 `knights_of_taranis` row (per `faction-policy.specialCases.knights_of_taranis`) is described as "Mars-basierte Imperial-Knight-House aus McNeills *Mechanicum* (HH-0009)". **Same identity, two surface-form variants** (House-title form vs. Knights-plural form). Per runbook §4 ("Eine kanonische Identität = eine Canonical-Row. Era-/Form-spezifische Surface-Forms wandern in `*-aliases.json`."), the title variant is an alias add — not a new row. This overrides the naïve dossier-7c row-creation recommendation; the identity-coherence rule takes precedence. The override is noted in `faction-policy.json` under the new key `house_taranis_alias_note`. |

### Dossier 7c judgments not taken (deviation log)

The dossier 7c floor was 4 strong rows, recommended target 6, ceiling 7. Final set: **5 strong
rows + 1 identity-coherence alias** (instead of 6 strong rows + 0 aliases). Deviations:

- **`house_taranis` → routed as alias to `knights_of_taranis`** instead of new row. Reason: the
  Pass-10 `knights_of_taranis` row is documented in `faction-policy.specialCases` as
  *"Mars-basierte Imperial-Knight-House aus McNeills Mechanicum (HH-0009); zentrale Knight-House
  der Martian-Schisma-Geschichte"*. The HH-0227 *Lightning Hall* surface form `House Taranis`
  refers to the same Mars-based Knight House (the same Knight-House-vs-Mechanicum schism context,
  Kelbor-Hal-defection-arc). Two surface-form variants of one identity. Runbook §4 mandates
  alias over row-split in this case, so the dossier recommendation is overridden. **Not a
  needs-decision case** — the identity match is unambiguous from existing policy notes.
- **`adeptus_administratum` → left unresolved.** Dossier 7c-weak-promotion: lower lore-profile,
  budget conservatism. No surface evidence beyond a single HH-0224 mention.

### Cross-Era / cross-batch alias confirmations (no Phase-1 edits — listed for traceability)

Pass-10/11/12/13 aliases that re-surface in Pass 14 and continue to resolve cleanly via the
existing chain:

- `Knights-Errant → knights_errant` (Pass-11) — 6 hits across HH-0226 / HH-0228 / HH-0244 /
  HH-0246 / HH-0247 / HH-0248. Highest-frequency alias of the wave; the Garro / Knights-Errant /
  Eisenstein audio-drama bloc anchors it exhaustively.
- `Knights Errant → knights_errant` (Pass-11) — 2 hits (HH-0202 / HH-0205, non-hyphenated form).
- `Sisters of Silence → talons_of_the_emperor` (Pass-10) — 4 hits.
- `Luna Wolves → sons_of_horus` (Pass-10) — 2 hits (HH-0231 omnibus + HH-0244).
- `Mechanicum → mechanicus` (Pass-10) — 2 hits (HH-0209 / HH-0210).
- `Dark Eldar → eldar` (pre-Pass-10) — 1 hit (HH-0245).
- `Imperial Army → astra_militarum` (Pass-10) — 1 hit (HH-0202).

The Cross-Era rename chain on the faction axis catches every re-surface in this wave. No
era-rename / honor-title aliases needed.

## Idempotency check

`grep` confirmed none of `ordo_sinister`, `legio_audax`, `legio_castigatra`, `legio_cybernetica`,
`blackshields` previously existed in `factions.json`; `House Taranis` was not previously aliased
in `faction-aliases.json`. Each promotion is a first-time row/alias creation.

## Resolver test cases added (8 new — runbook §3 Phase 1 threshold: ≥5)

In `scripts/test-resolver.ts` (appended after the Pass-13 block, before
`console.log("\nresolveLocation")`):

1. `direct match - Resolver-Pass 14 Ordo Sinister` → `ordo_sinister`.
2. `direct match - Resolver-Pass 14 Legio Audax` → `legio_audax`.
3. `direct match - Resolver-Pass 14 Legio Castigatra` → `legio_castigatra`.
4. `direct match - Resolver-Pass 14 Legio Cybernetica` → `legio_cybernetica`.
5. `direct match - Resolver-Pass 14 Blackshields` → `blackshields`.
6. `alias-consolidation - Resolver-Pass 14 House Taranis routes to knights_of_taranis`.
7. `alias - Resolver-Pass 14 confirmation Knights-Errant still routes to knights_errant`.
8. `alias - Resolver-Pass 14 confirmation Mechanicum still routes to mechanicus`.

## Verification

Resolver trias (runbook §10):

- `npm run test:resolver` → **430 passed, 0 failed**.
- `npm run test:resolver-data` → all integrity checks ok.
- `npm run test:resolver-coverage` → exit 0; smoke totals factions=2512/2855, locations=1032/1328,
  characters=1816/2299 (below-threshold rows are data findings, not failures — unchanged
  trajectory).
- `npm run test:apply-override-dry` → exit 0 (`[apply-override-dry] ok`). The dry-run reports
  `forward collection refs: 50` / `unresolvable constituent refs: 3` / `by reason:
  out-of-range=3, unknown-work=0`. The 3 out-of-range refs are the new HH-0231/HH-0232/HH-0233
  omnibi pointing at HH-001..HH-0044 constituents that **will be in range** once Phase 4a expands
  the trias `batchRange` to include the new `{ domain: "hh", n: "021".."025" }` tuples. **Phase-1
  state, not a Phase-1 concern.**

## Files touched

- `scripts/seed-data/factions.json` — appended 5 rows.
- `scripts/seed-data/faction-aliases.json` — appended 1 alias entry.
- `scripts/seed-data/faction-policy.json` — appended 6 `specialCases` notes (5 new rows + 1
  `house_taranis_alias_note` documenting the §4 identity-coherence override).
- `scripts/test-resolver.ts` — 8 new test cases.
- `sessions/resolver-dossiers/resolver-pass-14-phase-1-report.md` — this report.

Trias green; ready for Phase 2 (Locations).
