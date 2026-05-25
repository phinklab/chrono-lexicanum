---
session: 2026-05-14-073
role: implementer
date: 2026-05-14
status: complete
slug: maintainer-audit-cockpit
parent: 2026-05-14-073
links:
  - 2026-05-14-073-arch-maintainer-audit-cockpit
commits: []
---

# Maintainer-Audit-Cockpit Implementer Report

## Summary

Implemented the public/audit split for book detail pages and added a URL-driven audit mode to `/buecher`.
The maintainer cockpit is read-only, noindexed, and surfaces resolver drift, junction gaps, provenance, collection relations, facets, and external links without leaking that audit noise back into the public book view.

## What I did

- `src/lib/book-labels.ts` - extracted shared format, availability, and person-role labels so public and audit routes render labels consistently.
- `src/app/buch/[slug]/page.tsx` - made the public book page reader-lean: core metadata, synopsis, canonical relation chips, facets, and a small audit link only.
- `src/app/buch/[slug]/audit/page.tsx` - added the maintainer cockpit with work fields, book details, persons, factions, locations, characters, facets, collections in both directions, external links, provenance, and drift markers.
- `src/app/buecher/AuditPills.tsx` - added client-side URL-state controls for the audit filter pills.
- `src/app/buecher/page.tsx` - added audit-mode filtering and expanded rows with provenance, junction counts, collection counts, and direct audit links while preserving the public catalogue default.
- `src/app/globals.css` - added the cockpit, audit filter, and audit row styling.
- `sessions/2026-05-14-073-arch-maintainer-audit-cockpit.md` - marked the architect brief as implemented.

## Decisions I made

- **Used comma-separated audit URL state** (`?audit=drift,gap,ssot,collections`) because it stays compact, can be multi-selected, and coexists cleanly with `sort=title`.
- **Computed catalogue audit filters in memory** after loading the related junction rows. That is acceptable for the current 100-book surface and keeps this brief small; at 500+ books this should move to aggregate SQL or paginated queries.
- **Marked drift only when `rawName` is present and differs from the canonical reference name**. A non-null raw surface alone is not treated as drift.
- **Kept `/buch/[slug]/audit` as a Server Component with `metadata.robots` noindex/follow** because this is a maintainer surface, not public crawl material.
- **Made the visual language denser and more "cogitator ledger" than the public page**: compact mono metadata strips, amber drift rail, and sectioned audit blocks.
- **Did not add a confidence `< 0.7` filter** because the brief explicitly deferred that as a future enhancement.
- **Did not add faction parent-path or browse-root chains** because the brief required resolved name/id/raw/role surfacing, not taxonomy traversal.
- **Kept non-book works reachable on the audit route**. The route starts from `works`; book-only sections render empty when the optional detail rows are absent.

## Verification

- `npm.cmd run lint` - pass; existing warning remains in `src/app/layout.tsx` for `@next/next/no-page-custom-font`.
- `npm.cmd run typecheck` - pass.
- `npm.cmd run brain:lint -- --no-write` - pass; blocking 0, warnings 6.
- `git diff --check` - pass.
- Manual route sanity with a transient dev server:
  - `/buch/the-anarch` - 200
  - `/buch/the-anarch/audit` - 200
  - `/buecher` - 200
  - `/buecher?audit=drift` - 200
  - `/buecher?audit=gap` - 200
  - `/buecher?audit=drift,ssot` - 200
- Manual metadata check: `/buch/the-anarch/audit` returned HTML containing `noindex`.

## Open issues / blockers

None for this brief.

## For next session

- Move catalogue audit filtering to SQL aggregates before the dataset grows substantially beyond the current batch size.
- Consider a dedicated `confidence<0.7` audit filter if confidence triage becomes part of the next resolver loop.
- Consider exposing faction taxonomy context in the audit cockpit if parent-path mistakes become a recurring maintainer task.

## References

- Local architect brief: `sessions/2026-05-14-073-arch-maintainer-audit-cockpit.md`
