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
