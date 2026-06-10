# Resolver-Pass 16 — restbatch-extension gap (turnkey follow-up)

The detector tiles by batch number, so Pass 16's **aggregate** scope was `058..060` only. The
two **extended restbatches** carry new books whose novel surface-forms were never aggregated:
**W40K-0566..0570** (`ssot-w40k-057`) and **HH-0295..0297** (`ssot-hh-030`). The detector now
reads `all-complete` and **cannot surface this** — it must be closed by a targeted manual pass.

All 8 books are **already applied and live** with their *major* entities linked; what follows is
the **secondary long-tail** only (exact unresolved forms pulled from `book_details.notes`).
Junction counts in parentheses show each book is well-resolved already.

## Inventory (ground truth, 2026-06-10)

| book | unresolved factions | unresolved locations | unresolved characters |
|---|---|---|---|
| W40K-0566 `hive` (f1/l0/c0) | — *(unnamed Chaos cult: low_confidence, leave)* | **Sacramentus** | — *(no named POV: low_confidence)* |
| W40K-0567 `da-freebooterz-code` (f1/l0/c0) | **Freebooterz** | **Halo Stars**, Gork's Revenge | Skeeg Horntoof, Antoinette von Hume |
| W40K-0568 `world-ablaze` (f6/l1/c0) | — | — | — *(fully resolved)* |
| W40K-0569 `legends-of-the-waaagh` (f3/l1/c1) | **Valhallan Ice Warriors** | **Nusquam Fundumentibus** | — *(low_confidence)* |
| W40K-0570 `veterans-of-the-fall` (f2/l1/c0) | — *(„the Archenemy": low_confidence, leave)* | — | Sgt Kostantin Taikon |
| HH-0295 `zardu-layak-the-crimson-apostle` (f1/l0/c3) | — *(low_confidence)* | Helwain | — |
| HH-0296 `the-shattered-and-the-soulless` (f4/l3/c1) | — *(low_confidence)* | — | Branthan |
| HH-0297 `dropsite-massacre` (f7/l1/c3) | — | — | Castrmen Orth, Kaedes Nex |

## Recommended dispositions (for a future Phase-1/2/3 pass — NOT applied here)

**Promote (established, lore-clear — the actually-wanted resolutions):**
- Faction `Freebooterz` → Ork sub-type. Alias→`orks` or a `freebooterz` sub-row (match the
  established Ork-subtype precedent).
- Faction `Valhallan Ice Warriors` → Astra Militarum regiment. Alias→`astra_militarum`, or a
  `valhallans` regiment row if the regiment-row precedent (cf. `kasrkin`) applies.
- Location `Halo Stars` (rim region), `Nusquam Fundumentibus` (ice world), `Sacramentus`
  (hive world — confirm the name against final sources; *Hive* was pre-release at curation).

**Verify identity before promoting (Heresy POVs/places — don't guess):**
- `Helwain` (location vs. person?), `Branthan` (Iron Hands / Shattered Legions), `Castrmen Orth`,
  `Kaedes Nex` (Dropsite-Massacre POVs).

**Leave unresolved per runbook §4 (freq-1, non-iconic — acceptable tail):**
- Characters Skeeg Horntoof, Antoinette von Hume, Sgt Kostantin Taikon; vessel `Gork's Revenge`.

## How to run the closure
A targeted custom-config `run-resolver-pass.sh` wave (NOT the auto-loop — it's blind here):
- **W40K:** config `batches:["ssot-w40k-057"]`, `applyRange {w40k,1,57}` (or 1..60).
- **HH:** config `batches:["ssot-hh-030"]`, `applyRange {hh,1,30}`.
Each re-aggregates the full batch (already-resolved books are idempotent) and promotes only the
novel tail. **Known hazard:** the Phase-4a subsession must NOT background the apply (that is what
halted Pass 16 — see the impl report); run the apply synchronously or finish 4a/4b by hand.

## Closure (applied 2026-06-10, branch `codex/ingest-batches-resolver-gap`)

Closed as a **single manual top-up** (not a full 6-phase wave). Seed JSON edits → `db:seed-resolver-extensions` (+8 reference rows) → synchronous foreground re-apply of `ssot-w40k-057` + `ssot-hh-030`. All identity-uncertain Heresy entities were web-verified (research + adversarial-refute pass) — all five returned `confirmed / high-confidence / promote`.

**Promoted (8 reference rows + 2 aliases):**
- Faction `freebooterz` — new row, `parent=orks, alignment=xenos, tone=alien` (exact `goffs` Ork-sub-type precedent). Direct name-match (W40K-0567).
- Faction alias `Valhallan Ice Warriors → valhallan_597th` — **judgment call.** The dossier offered "alias→`astra_militarum`, or a new `valhallans` row." Chose a third path: alias to the **already-existing** `valhallan_597th` row, because (a) it is the only canonical Valhallan anchor in the corpus, (b) the tagging book (W40K-0569 *Legends of the Waaagh!*) carries the 597th via *Caves of Ice*, (c) Authority-Layer-Coarseness precedent (`Cadian → cadian_shock_troops`, `Kindred of the Eternal Starforge → leagues_of_votann`), (d) zero new rows / no `astra_militarum` coarsening that would discard the Valhallan grain. Revisit if a generic `valhallans` row is later preferred.
- Locations `halo_stars` (`tags:["region"]`, `ghoul_stars` precedent), `nusquam_fundumentibus` (ice world), `sacramentus` (hive city, `Hive` W40K-0566 — name confirmed against final GW sources), `helwain` (world, HH-0295) — all `sector/gx/gy=null`, direct name-match.
- Characters `ulrach_branthan` (Iron Hands, Sisypheum captain; override surface form `Branthan` → alias to full-name row), `castrmen_orth` (Iron Hands, Clan Avernii), `kaedes_nex` (Raven Guard Moritat-Prime) — all HH POVs, identity web-verified.

**Left unresolved per runbook §4 (acceptable freq-1 tail, confirmed in apply output):** characters Skeeg Horntoof, Antoinette von Hume (W40K-0567 `char=0`), Sgt Kostantin Taikon (W40K-0570 `char=0`); vessel `Gork's Revenge` (W40K-0567 `loc=1` = Halo Stars only). The unnamed Chaos cults (Hive, Veterans of the Fall) and `HH-0291` artbook authorship remain intentionally low-confidence/unresolved.

**Resulting junctions (all 8 gap books now fully resolved; W40K-0568 was already complete):** W40K-0566 loc=1 · W40K-0567 fac=2/loc=1 · W40K-0569 fac=4/loc=2 · HH-0295 loc=1 · HH-0296 char=2 · HH-0297 char=5. Checks green: `test:resolver` (507 pass, +10 gap cases), `test:resolver-data`, `test:resolver-coverage`, `test:apply-override-dry` (0 missing FK / 0 dangling refs), `test:collection-refs`, `lint`, `typecheck`.
