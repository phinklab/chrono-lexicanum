# Resolver-Pass 15 — Phase 1 (Factions) Report

> **Wave:** `ssot-hh-026..030` (44 books, HH-0251..HH-0294). **Phase:** 1 (Factions).
> **Status:** done. Operative spec: [`sessions/resolver-pass-runbook.md`](../resolver-pass-runbook.md)
> §3 Phase 1 + §4 (Promotions-/Alias-Disziplin inkl. Cross-Era-Identitäten). Dossier:
> [`resolver-pass-15-dossier.md`](./resolver-pass-15-dossier.md).

## Done summary

Three strong-curated freq-1 lore-iconic faction rows promoted + one identity-equivalence
short-form alias (`Administratum → adeptus_administratum`). Net **+3 rows / +1 alias**. Counts
verified post-edit: `factions.json` 202 rows (199 → 202), `faction-aliases.json` 73 entries
(72 → 73). Trias green.

### Promotion set (3 new rows)

| canonical id | parent | alignment | tone | evidence (HH-N + dossier 7c) |
| --- | --- | --- | --- | --- |
| `officio_sigillite` | `imperium` | `imperium` | `archive` | HH-0252 *The Sigillite* — namesake audio drama (Malcador + Khalid Hassan on Terra / Gyptus). Malcador-the-Sigillite spine character surfaces freq=7 in this wave (the highest-frequency character surface of the wave), anchoring the org-tier cross-arc warrant. Imperial-civil/Intelligence-Institution-Tier parity with `inquisition` / `lectitio_divinitatus` / `senatorum_imperialis`; Parent=`imperium` (Pre-Custodes-/Pre-Inquisition-Era Malcador-Direkt-Apparat analog `knights_errant`, weil Legion-/Astartes-übergreifend — Khalid Hassan / Yasu Nagasena als mortal agents). **Lore-iconic strong-promotion case** (Dossier 7c "single most cross-arc-warranted faction promotion"). |
| `legio_praesagius` | `adeptus_titanicus` | `imperium` | `engine` | HH-0253 *Honour to the Dead* — namesake-bearing Titan Legion (Ultramarines / Word Bearers at Calth / Ithraca, Praesagius im Calth-Engagement). Parity with `legio_ignatum` / `legio_solaria` / `legio_castigatra` / `legio_cybernetica` — folgt der Pass-11/14 Titan-Legion-Grain-Konvention (parent=`adeptus_titanicus`, tone=`engine`). **Lore-iconic strong-promotion case.** |
| `adeptus_administratum` | `imperium` | `imperium` | `archive` | Cumulative cross-pass freq-2 evidence: Pass-14 HH-0224 *Abyssal* (Pass-14 dossier had recommended "leave unresolved for budget conservatism") + Pass-15 HH-0263 *Garro: Shield of Lies* (Katanoh Tallery als Administratum-Adeptra im Garro-Sigillite-Frame). The cross-pass return promotes the surface above the §4 strict-freq-2 threshold. Imperial-civilian-bureaucracy-Tier parity with `senatorum_imperialis` / `lectitio_divinitatus`. **Lore-iconic medium-strong promotion case** (Dossier 7c + 7d explicit cumulative-cross-pass recommendation). |

### Alias add (1 new)

| surface form | target canonical id | rationale |
| --- | --- | --- |
| `Administratum` | `adeptus_administratum` | The bare/short Imperial-bureaucracy surface form (HH-0263 *Garro: Shield of Lies* + Pass-14 HH-0224 *Abyssal* — both reference the same Imperial-civilian institution). The canonical row carries the formal name `Adeptus Administratum`; the short form is the routine in-text Surface-Form-Variante. Per runbook §4 Surface-Form-Treue (eine kanonische Identität = eine Canonical-Row; alternative Surface-Forms wandern in `*-aliases.json`), this is an alias add — not a second row. Parity with the Pass-10/11 `Mechanicum ↔ Mechanicus ↔ Adeptus Mechanicum`-Cluster (one row, three surface forms). |

### Dossier 7c judgments not taken (deviation log)

The dossier 7c floor was 2 strong rows, recommended target 3, ceiling 5. Final set: **3 strong
rows + 1 short-form alias** (recommended target hit exactly; the weak/ceiling additions
`fire_masters` + `imperial_court` were not taken). Deviations:

- **`fire_masters` → left unresolved.** Dossier 7c-weak-promotion ("lore-evidence-thin",
  "lower priority than Officio Sigillite / Legio Praesagius"). Single-novella surface
  (HH-0253 *Honour to the Dead*) with sub-grouping affiliation unclear from source-context
  (Word-Bearers-side supporting cast at Calth — could be Salamanders-themed, Mechanicum-themed
  or Iron-Hands-themed sub-grouping). Per runbook §4 ("Promotion nur bei Evidenz [...] bei
  Identitäts-Unsicherheit → `needs-decision`, **nicht** raten") + Dossier 7c explicit
  "Phase-1 judgment — recommendation: leave unresolved", I defer until a future wave clarifies
  the lore alignment.
- **`imperial_court` → left unresolved.** Dossier 7c-weak-promotion. Generic Imperial
  political-grain reference in a scriptbook overview (HH-0293 *Horus Heresy: The Scripts
  Volume II*); lore-thin beyond the scriptbook context. Following the dossier 7c
  recommendation ("leave unresolved").

The 5-row ceiling was deliberately not approached; the recommended-target floor of 3 rows
captures the lore-iconic core (Officio Sigillite + Legio Praesagius + Adeptus Administratum)
without spreading promotion across single-novella surface forms with weak cross-arc warrant.

### Parent-decision note (Officio Sigillite + Adeptus Administratum)

The Dossier 7c text used the shorthand "parent: empty (Imperial institution grain)" for both
`officio_sigillite` and `adeptus_administratum`. The phase implementation follows the existing
schema convention — all Imperial-civil-Institutional-Tier rows in `factions.json` use
`parent: "imperium"` (e.g. `inquisition`, `astra_militarum`, `knights_errant`,
`lectitio_divinitatus`, `senatorum_imperialis`, `commissariat`) rather than `parent: null`.
The Dossier "empty" was an informal shorthand for "no Astartes/Mechanicum sub-parent,
top-level under Imperium", not a literal null-parent instruction; the existing parent-grain
convention is honoured (also matches `faction-policy.specialCases.imperium` and the
`browseRoots` policy semantics — `imperium` is a Lore-Root, not a Browse-Root, but it remains
the parent-anchor for Imperial-civil institutions). For `legio_praesagius` I followed the
established Titan-Legion-Sub-Tier-Konvention `parent: "adeptus_titanicus"` (parity with every
existing `legio_*` row) rather than the Dossier's `parent: mechanicus` shorthand — both
ladders ultimately ground in Mechanicus, but the direct parent is `adeptus_titanicus` per
schema convention.

### Cross-Era / cross-batch alias confirmations (no Phase-1 edits — listed for traceability)

Pass-10/11/12/13/14 aliases that re-surface in Pass 15 and continue to resolve cleanly via the
existing chain (per Dossier §3 + §7a "Confirmations only"):

- `Mechanicum → mechanicus` (Pass-10) — **4 hits** across HH-0284 / HH-0286 / HH-0291 / HH-0294.
  Highest-frequency alias of the wave on the faction axis (Mechanicum succession-crisis arc +
  the Collected-Visions / Visions-of-Heresy overview-coverage in the artbooks).
- `Knights-Errant → knights_errant` (Pass-11) — **3 hits** across HH-0271 / HH-0272 / HH-0273
  (2017 Garro audio-drama re-issue trio).
- `Luna Wolves → sons_of_horus` (Pass-10 Cross-Era anchor) — **3 hits** across HH-0254 /
  HH-0291 / HH-0294 (Wolf Hunt + the two artbook overview entries).
- `Imperial Army → astra_militarum` (Pass-10) — **2 hits** across HH-0252 / HH-0255.
- `Daemons of Tzeentch → tzeentch` (pre-Pass-10) — 1 hit (HH-0280 *Children of Sicarus*).
- `High Lords of Terra → senatorum_imperialis` (pre-Pass-10) — 1 hit (HH-0284 *The Binary
  Succession*).

The Pass-10/11/12/13/14 era-rename chain on the faction axis catches every re-surface in this
wave. No era-rename / honor-title aliases needed.

### Direct-row confirmations (selected, all freq ≥ 2 Pass-10..14 rows)

Per Dossier §3 + §1 baseline: every freq ≥ 2 Legion / Primarch / sub-Legion surface in this
wave catches its existing canonical row direct — Ultramarines (11), Word Bearers (9),
Imperial Fists (7), Sons of Horus (7), Space Wolves (7), World Eaters (7), Dark Angels (6),
Night Lords (6), Alpha Legion (5), Death Guard (5), Iron Hands (5), Raven Guard (5),
Thousand Sons (5), Emperor's Children (4), Iron Warriors (4), White Scars (4), Blackshields (3 —
Pass-14 row), Blood Angels (3), Adeptus Custodes (2 — direct on `custodes`), Knights Errant (2 —
direct unhyphenated form), Salamanders (2), plus the Heretic Astartes / Cabal / Inquisition /
Sanguinary Guard / Therion Cohort / Orks freq-1 confirmations. **No new direct-row work for
freq ≥ 2 — anchor catalog from Pass-10..14 is exhaustive on the faction axis.**

## Idempotency check

`grep` confirmed none of `officio_sigillite`, `legio_praesagius`, `adeptus_administratum`
previously existed in `factions.json` (the grep for the three IDs returned no matches before
the edit). `Administratum` was not previously aliased in `faction-aliases.json` (verified by
reading the full file). Each promotion is a first-time row/alias creation. JSON validity
checked via `node -e "JSON.parse(...)"` for all three faction files post-edit — all OK.

## Resolver test cases added (7 new — runbook §3 Phase 1 threshold: ≥5)

In `scripts/test-resolver.ts` (appended after the Pass-14 block, before
`console.log("\nresolveLocation")`):

1. `direct match - Resolver-Pass 15 Officio Sigillite` → `officio_sigillite`.
2. `direct match - Resolver-Pass 15 Legio Praesagius` → `legio_praesagius`.
3. `direct match - Resolver-Pass 15 Adeptus Administratum` → `adeptus_administratum`.
4. `alias - Resolver-Pass 15 Administratum (short form) routes to adeptus_administratum`.
5. `alias - Resolver-Pass 15 confirmation Luna Wolves still routes to sons_of_horus`
   (Pass-10 chain holds — HH-0254 + HH-0291 + HH-0294).
6. `alias - Resolver-Pass 15 confirmation Imperial Army still routes to astra_militarum`
   (Pass-10 chain holds — HH-0252 + HH-0255).
7. `alias - Resolver-Pass 15 confirmation Knights-Errant still routes to knights_errant`
   (Pass-11 chain holds — 2017 Garro re-issue trio HH-0271/HH-0272/HH-0273).

Three direct-match tests for the new rows, one direct-match test for the new alias, three
Cross-Era confirmation tests for the highest-frequency Pass-10/11 aliases of the wave. The
Mechanicum-confirmation test is omitted only because Pass-14 already records a Pass-14-wave
confirmation case for the same alias (line ~568), and re-confirming each pass would bloat the
suite without adding signal — the Pass-14 confirmation continues to cover the Pass-10
`Mechanicum → mechanicus` chain.

## Verification

Resolver trias (runbook §10):

- `npm run test:resolver` → **456 passed, 0 failed** (Pass-14 baseline was 430 + 7 new = 437
  expected on faction-axis-only counts, but the test file already includes Pass-14's Locations /
  Characters / Normalizers additions which push the total to 456; the +7 new Pass-15 faction
  tests are all green).
- `npm run test:resolver-data` → all integrity checks ok (faction parent integrity, alias
  targets point at canonical ids, alignment values valid, etc.).
- `npm run test:resolver-coverage` → exit 0; smoke totals factions=2624/2967,
  locations=1088/1391, characters=1916/2422 (below-threshold rows are data findings, not
  failures — unchanged trajectory on the data-side, the trias is purely a smoke gate at this
  phase).
- `npm run test:apply-override-dry` → exit 0 (`[apply-override-dry] ok`). The dry-run reports
  `forward collection refs: 53` / `unresolvable constituent refs: 0` / `by reason:
  out-of-range=0, unknown-work=0`. **Zero out-of-range refs** — consistent with the dossier's
  §7d expectation ("Brief-091 forward-ref Guard not active this wave — clean output expected,
  §5 omnibus scan empty"). The 53 forward-collection-refs are within-range; not a Phase-1
  concern.

## Files touched (write-scope verified)

- `scripts/seed-data/factions.json` — appended 3 rows.
- `scripts/seed-data/faction-aliases.json` — appended 1 alias entry.
- `scripts/seed-data/faction-policy.json` — appended 3 `specialCases` notes (one per new row).
- `scripts/test-resolver.ts` — 7 new test cases (one block, appended after Pass-14 block).
- `sessions/resolver-dossiers/resolver-pass-15-phase-1-report.md` — this report.

Trias green; ready for Phase 2 (Locations).
