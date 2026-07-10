---
session: 2026-07-10-191
role: implementer
date: 2026-07-10
status: complete
slug: mobile-cartographer-motion
parent: null
links:
  - 2026-07-09-190
commits:
  - 2186d9d
---

# Cartographer mobile: animated linework without full-chart flicker

## Summary

The Cartographer's animated SVG linework now renders in a dedicated, compositor-backed motion plane synchronized to the static chart camera. Mobile routes retain their moving dashes, but their paint invalidation is confined to a 101-node SVG instead of the 5,938-node base chart.

## What I did

- `src/components/cartographer/ChartStage.tsx` — split the chart into base and motion SVG roots; camera transform, counter-scale, zoom band and moving state are written to both in the same imperative frame.
- `src/components/cartographer/CartographerRoot.tsx` — moved Lumen/Nihilus, journey routes, Terra's auspex and selection ringwork into the isolated motion plane.
- `src/components/cartographer/RoutesLayer.tsx` — kept the mobile mask-free route but documented its new repaint boundary.
- `src/app/styles/55-map.css` — added a contained, pointer-transparent compositor boundary and restored the mobile marching-dash motion after each mask-free leg fades in.

## Decisions I made

- **Separated paint surfaces instead of suppressing animation.** The existing mobile workaround removed SVG masks and stopped dash motion, but opacity/stroke frames still lived inside the full chart SVG and could invalidate thousands of static nodes. A sibling SVG preserves the intended motion while limiting the expensive paint region.
- **Kept one camera implementation.** Both world groups receive the same transform string inside the existing imperative `apply()` frame; no second camera state, React render loop or dependency was introduced.
- **Moved all persistent animated chart linework, not only journey paths.** Route, selection, Terra and Lumen/Nihilus animations now share the lightweight plane so the same failure mode cannot reappear from another line effect.
- **Kept phone routes mask-free.** The new boundary removes whole-chart invalidation, while omitting masks still avoids unnecessary mobile paint work.

## Verification

- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm test` — pass, 30/30 DB-free suites.
- `npm run brain:lint -- --no-write` — pass, 0 blocking findings (47 existing warnings).
- `npm run build` — pass outside the restricted network sandbox; Next.js 16.2.9 compiled, typechecked and generated 158/158 static pages, `/map` remains static. The sandboxed attempt timed out waiting on network-bound prerender data.
- Mobile browser at 390×844 — base SVG 5,938 nodes, motion SVG 101 nodes; base contains 0 animated chart groups, motion contains the route/instrument groups; pointer hit-testing remains on the base chart.
- Mobile journey route — no masks; `cgRtLegIn, cgRtFly` both active; dash offset changed from `-41.0845px` to `-43.3608px` over 220 ms.
- Mobile pan with active journey — base and motion transforms remained byte-identical after the gesture; route overlay stayed pointer-transparent.

## Open issues / blockers

- None for the flicker fix.

## For next session

- The mobile Great Journey card's Begin/Next button center overlaps the closed chart-drawer grip: browser hit-testing returned `.cg-sheet-grip` at the CTA center. The button still works on its upper edge, but this separate layout bug should be fixed in a focused mobile polish pass.

## References

- `sessions/2026-07-09-190-impl-ui-refinements-great-journeys.md`
- `sessions/2026-07-09-189-impl-frontend-mobile-copy-pass.md`
