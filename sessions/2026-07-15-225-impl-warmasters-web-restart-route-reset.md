---
session: 2026-07-15-225
role: implementer
date: 2026-07-15
status: complete
slug: warmasters-web-restart-route-reset
parent: 2026-07-15-224
links:
  - sessions/2026-07-15-224-impl-warmasters-web-hover-only-highlight.md
commits:
  - 6e5f824
---

# The Warmaster's Web — restart route reset

## Summary

`RESTART JOURNEY` now restores every Legion route before returning to Legion I, so an earlier `HIDE ALL` command cannot leave the restarted tour blank. The restart again matches the journey's first-run state and reveals each Legion route step by step.

## What I did

- `src/components/cartographer/CartographerRoot.tsx` — reset the hidden-Legion set before dispatching the restart to tour step zero.

## Decisions I made

- **Reset visibility only on restart.** `BACK` still preserves the final overview's authored user state, while the explicit restart command restores the original tour state as requested.
- **Reused the existing step reset.** Selection, preview and strategic target state continue to clear through `stepVoyage(0)`; only route visibility needed an additional reset.

## Verification

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm run test:voyages` — pass, 2,406 checks across 12 journeys.
- `npx tsx scripts/test-map-renderer.ts` — pass.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings; 21 pre-existing repository warnings.
- `SITE_URL=https://example.invalid npm run build` — pass; one existing Turbopack NFT tracing warning remains.
- Manual desktop/SVG QA at `/map` — `HIDE ALL` produced `0 / 18 VISIBLE` and zero visible route segments; `RESTART JOURNEY` then returned to `Legion 1 of 18 — I · DARK ANGELS` with all 9 current route segments visible and no final-overview roster present.
- Browser console — no runtime errors during the restart regression check.

## Open issues / blockers

None.

## For next session

- No follow-up required for this restart-state fix.

## References

- `sessions/2026-07-15-224-impl-warmasters-web-hover-only-highlight.md`
