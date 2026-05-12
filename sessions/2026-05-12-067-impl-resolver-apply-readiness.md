---
session: 2026-05-12-067
role: implementer
date: 2026-05-12
status: complete
slug: resolver-apply-readiness
parent: 2026-05-12-063
links:
  - 2026-05-12-063
  - 2026-05-12-064
  - 2026-05-12-065
  - 2026-05-12-066
  - 2026-05-11-061
  - 2026-05-11-062
commits: []
---

# Resolver Apply Readiness

## Summary

Branch `session-063-resolver-50-books` ist code-seitig apply-ready: keine DB-Mutation durch Codex, aber Dry-Run, Runbook und Preview-Schutz sind jetzt da. Merge-Empfehlung: **needs maintainer DB apply** vor Resume von Brief 061.

## What I did

- `src/app/buch/[slug]/page.tsx` - `raw_name` aus der Detailpage-Query entfernt. Befund: vor Migration 0009 wuerde jede `/buch/[slug]`-Page mit `column ... raw_name does not exist` brechen; die Page rendert jetzt ohne Audit-Tooltip und bleibt vor/nach Migration lauffaehig.
- `src/lib/resolver/roles.ts` - gemeinsame Role-Normalisierung fuer Apply, Dry-Run und Tests. Characters normalisieren `supporting`/`antagonist` auf `appears`; Factions/Locations behalten ihre bestehenden Vokabulare.
- `scripts/apply-override.ts` - nutzt dieselbe Normalisierung und validiert Entity-Roles vor der ersten DB-schreibenden Pre-Pass-Phase.
- `scripts/apply-override-dry.ts` - DB-freie Simulation fuer `ssot-w40k-001..005`: resolved Junction-Counts, unresolved Surface-Forms, Role-Normalisierungen, invalid roles, Facet/Roster/FK-Ziele gegen JSONs.
- `package.json` - neues `test:apply-override-dry`; vorhandene Resolver-Data/Coverage-Tests sind als `test:resolver-data` und `test:resolver-coverage` verdrahtet.
- `docs/resolver-apply-runbook.md` - Maintainer-Runbook fuer `db:migrate`, `db:seed-resolver-extensions`, Apply `001..005`, SQL Counts, Smoke URLs, Recovery bei Seed/Migration-Drift.
- `sessions/2026-05-12-063-arch-resolver-50-books.md`, `sessions/2026-05-12-063-impl-resolver-50-books.md`, `sessions/README.md` - 063-Smoke-Erwartung korrigiert: `nightbringer` hat nur 1 Location; das ist Datenrealitaet, kein Apply-Fehler.

## Decisions I made

- **Fix B fuer raw_name timing.** Ich habe die Detailpage fallbackfaehig gemacht statt nur Runbook-Disziplin zu erzwingen. Lokale und Vercel-Previews koennen realistisch vor Migration 0009 aufgerufen werden; `raw_name` ist Audit, nicht User-UI.
- **Character-Rollen werden normalisiert, nicht als `supporting`/`antagonist` geschrieben.** Dry-Run zeigt 279x `supporting->appears` und 21x `antagonist->appears`; danach 0 invalid role values.
- **Dry-Run bleibt rein JSON-basiert.** FK-Targets werden gegen checked-in seed JSONs geprueft, nicht gegen prod. Damit kann Maintainer vor jedem Apply sehen, ob Seed und Resolver plausibel sind.
- **064-066 sind die direkte Readiness-Vorgeschichte.** 064 fand die P1/P2-Risiken, 065 fixte Seed-/Alignment-/Fresh-Seed-Konsistenz, 066 fixte Coverage/Sector-Surface-Forms. 067 schliesst darauf aufbauend die Apply-Dry-Simulation, das Runbook und den Preview-Timing-Fix.

## Verification

- `npm.cmd run test:resolver` - pass (53 passed)
- `npm.cmd run test:resolver-data` - pass
- `npm.cmd run test:resolver-coverage` - pass; smoke counts: xenos 3/3/6, first-and-only 5/6/10, necropolis 7/4/9, nightbringer 7/1/5, the-anarch 9/3/11
- `npm.cmd run test:apply-override-dry` - pass; resolved counts 318/129/363, unresolved surface forms listed, invalid roles 0, missing FK targets 0
- `npm.cmd run typecheck` - pass
- `npm.cmd run lint` - pass with 1 pre-existing warning in `src/app/layout.tsx:44` (`@next/next/no-page-custom-font`)
- `npm.cmd run brain:lint -- --no-write` - pass after docs/report updates

## Open issues / blockers

- Maintainer still must run the DB apply sequence. Codex did not run `db:migrate`, `db:seed-resolver-extensions`, or `db:apply-override` against prod.
- Branch should not resume Brief 061 (`ssot-w40k-006`) until the 001..005 resolver apply sweep has landed.

## For next session

- After maintainer DB apply, smoke the five detail URLs and record SQL before/after counts in either this report or a short follow-up session note.
- Then resume Brief 061 with `ssot-w40k-006`.

## References

- `docs/resolver-apply-runbook.md`
- `sessions/2026-05-12-063-arch-resolver-50-books.md`
- `sessions/2026-05-12-063-impl-resolver-50-books.md`
- `sessions/2026-05-12-064-impl-resolver-deep-audit.md`
- `sessions/2026-05-12-065-impl-resolver-data-seed-fixes.md`
- `sessions/2026-05-12-066-impl-resolver-coverage-fixes.md`
- `sessions/ssot-loop-log.md`
