---
session: 2026-05-12-066
role: implementer
date: 2026-05-12
status: complete
slug: resolver-coverage-fixes
parent: 2026-05-12-063
links:
  - 2026-05-12-063
  - 2026-05-12-064
  - 2026-05-12-065
commits:
  - d7dd71c
---

# Resolver Coverage Fixes - Implementer Report

## Summary

Die fachlichen Resolver-Fixes fuer die ersten 50 W40K-Buecher sind im Worktree umgesetzt: Sector-Surface-Forms resolven, Character-Roles landen normalisiert in `work_characters`, und ein neuer Coverage-Smoke berechnet die Counts aus `manual-overrides-ssot-w40k-001..005`. Keine DB-Mutation, kein `db:migrate`, kein `db:seed-resolver-extensions`, kein `apply-override`.

## What I did

- `scripts/seed-data/locations.json` - `Scarus Sector` und `Helican Subsector` als Location/Region-Entries mit `gx: null`, `gy: null` ergaenzt; bestehende Cartographer-Pins bleiben unveraendert.
- `scripts/seed-data/location-aliases.json` - `Calixis Sector -> calixis` ergaenzt, weil `Calixis` bereits als pin-faehiger canonical Location-Entry existiert.
- `scripts/seed-data/factions.json` / `faction-aliases.json` - `Ordo Xenos`, `Ordo Malleus`, `Ordo Hereticus` als Inquisition-Subfactions canonicalisiert und die alten Alias-Collapses entfernt.
- `src/lib/resolver/roles.ts`, `src/lib/resolver/index.ts`, `scripts/apply-override.ts` - Role-Normalisierung zentralisiert; Apply schreibt normalisierte Rollen und validiert Entity-Roles vor DB-Mutation.
- `scripts/test-resolver.ts` - Sector/Calixis/Ordo-Cases und Character-Role-Normalisierung ergaenzt.
- `scripts/test-resolver-data-integrity.ts` - Data-Checks erweitert: sector-as-location, paired coords, Override-Character-Roles und Smoke-Slug-Existenz.
- `scripts/test-resolver-coverage.ts` + `package.json` - neues `test:resolver-coverage`, liest 001..005 und gibt die fuenf Smoke-Slugs mit resolved/input Counts aus.

## Decisions I made

- **Sector surface forms werden Location/Region-Entries.** `Scarus Sector` und `Helican Subsector` gehoeren in `work_locations`, aber nicht als Cartographer-Pins. Darum liegen sie in `locations.json` mit null coords; `Helican` haengt unter `scarus`, `Scarus` selbst bleibt parent-los.
- **Calixis bleibt der bestehende Pin.** `Calixis Sector` routet per Alias auf `calixis`, weil der bestehende Eintrag bereits die sinnvolle canonical Location fuer diese Surface-Form ist.
- **Ordos sind canonical Subfactions.** Fuer *Xenos* war der alte Alias-Collapse `Inquisition + Ordo Xenos -> inquisition` fachlich zu grob und brach den Smoke. Die Ordos sind stabile Inquisition-Unterorganisationen, also eigene Faction-IDs mit `parent: inquisition`.
- **Character `supporting` und `antagonist` werden `appears`.** `work_characters.role` beschreibt POV/Praesenz, nicht moralische oder plotseitige Gegnerschaft. Ein Antagonist, der als Character extrahiert wird, ist damit ein auftretender Character; `mentioned` bleibt fuer reine Erwaehnung reserviert. Unbekannte Rollen werfen vor DB-Insert.
- **Coverage-Smoke ist beobachtend.** Das Script failt nicht nur wegen `<3`, sondern meldet die Achse. `nightbringer.locations=1/1` ist ein echter Datenbefund: das Override nennt nur `Pavonis`, also habe ich keine weiteren Locations erfunden.

## Verification

- `npm.cmd run test:resolver` - pass, 53 passed / 0 failed.
- `npm.cmd run test:resolver-data` - pass.
- `npm.cmd run test:resolver-coverage` - pass. Smoke: `xenos 3/3 3/4 6/6`, `first-and-only 5/5 6/6 10/10`, `necropolis 7/7 4/4 9/9`, `nightbringer 7/7 1/1 5/5`, `the-anarch 9/9 3/3 11/11`.
- `npm.cmd run typecheck` - pass.
- `npm.cmd run lint` - pass with one known warning in `src/app/layout.tsx:44` (`@next/next/no-page-custom-font`).
- `npm.cmd run brain:lint -- --no-write` - pass, 0 blocking / 4 warnings.

## Open issues / blockers

- DB apply remains maintainer-triggered. This session deliberately did not run migrations, seed extensions, or override apply.
- `nightbringer.locations` remains below the original `>=3` smoke threshold. Current corrected acceptance should treat that axis as `1/1 resolved from supplied override data`, unless a future data pass adds sourced locations beyond Pavonis.
- The worktree was already dirty and contains unrelated archive/session/data changes. I did not revert them.

## For next session

- Maintainer-trigger path remains: `db:migrate`, `db:seed-resolver-extensions`, re-apply `ssot-w40k-001..005`, then real DB counts and Detail-Page smoke.
- If `nightbringer` needs `>=3` locations for UX rather than data truth, write a data-enrichment brief with sources instead of padding the resolver.

## References

- `sessions/2026-05-12-063-arch-resolver-50-books.md`
- `sessions/2026-05-12-063-impl-resolver-50-books.md`
- `sessions/2026-05-12-064-impl-resolver-deep-audit.md`
- `sessions/2026-05-12-065-impl-resolver-data-seed-fixes.md`
