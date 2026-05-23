# Resolver-Loop Log

> Append-only marker for the headless Resolver-Loop (Brief 094). One H2 block per wave; six per-phase checkboxes carry commit SHAs as the resolver advances. The detector (`scripts/resolver-loop-detect.ts`) reads this file to compute `resolverProgressBatch` (highest batch with all six phases checked) and `nextPassNumber` (highest pass referenced + 1).
>
> The bootstrap block below records the pre-094 supervised state (Pässe 1..7, batches 001..045 — supervised on the old per-pass-brief rail) so the auto-detector picks up at pass 8 / the first crystallized batch above 045.
>
> Do not edit historical blocks. Append new wave blocks at the end.

## 2026-05-23 · Bootstrap (Pre-Loop-State)

Resolver-Fortschritt bei Implementierungs-Zeitpunkt: 7 Pässe komplett, Batches 001..045 resolved/applied (Pass 7 gemerged via PR #90). Pässe 1–7 wurden supervised auf der alten Schiene gefahren (per-pass Briefs 074/076/089/090/091/093). Der headless Loop setzt bei Pass 8 / der ersten ungekippten Welle auf — sobald der SSOT-Loop ein Override-File für Batch 046+ kristallisiert hat.

- [x] Pass 1..7 (Welle ssot-w40k-001..045, 450 Bücher) — vor Brief 094 supervised

## 2026-05-23 · Resolver-Pass 8 (Welle ssot-w40k-046..051, 60 Bücher)

- [x] Phase 0 (Preflight) — commit bcfdf6c
- [x] Phase 1 (Factions) — commit f7e7f85
- [x] Phase 2 (Locations) — commit 47556f6
- [x] Phase 3 (Characters) — commit 2477966
- [x] Phase 4a (Apply) — commit 4694202
- [x] Phase 4b (Verify) — commit e9a07e6
