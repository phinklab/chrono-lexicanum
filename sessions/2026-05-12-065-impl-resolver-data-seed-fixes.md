---
session: 2026-05-12-065
role: implementer
date: 2026-05-12
status: complete
slug: resolver-data-seed-fixes
parent: 2026-05-12-064
links:
  - 2026-05-12-063
  - 2026-05-12-064
commits: []
---

# Resolver Data/Seed Fixes - Implementer Report

## Summary

Die strukturellen Resolver-Review-Fixes sind im Worktree umgesetzt: Alignment ist DB-Enum-konsistent, Fresh-Seed laedt `characters.json`, Resolver-Seed-Extensions validieren laut vor jedem Write, und `test:resolver-data` deckt die JSON-Integritaet ab. Keine DB-Mutation, kein `db:migrate`, kein `db:seed-resolver-extensions`, kein `apply-override`.

## What I did

- `scripts/seed-data/factions.json` - neue imperiale Resolver-Factions von legacy `"imperial"` auf DB-Enum `"imperium"` normalisiert.
- `scripts/seed.ts` - `characters.json` wird direkt geladen und in `characters` geseedet; `RawLocation` erlaubt `sector/gx/gy: null`; `RawFaction.alignment` wird normalisiert/validiert; `glyph`, `lexicanumUrl`, `primaryFactionId` und `notes` werden beim Fresh-Seed nicht mehr ignoriert.
- `scripts/seed.ts` - Preflight vor dem `TRUNCATE`: Faction-Parents, Location-Sectors, Character-`primaryFactionId`, Book-Character-Refs und Alignment-Werte werden laut validiert.
- `scripts/seed-resolver-extensions.ts` - alle Resolver-JSONs plus Alias-Dateien werden vor dem ersten DB-Write geladen und validiert: duplicate IDs/Namen, dangling `parent`/`sector`/`primaryFactionId`, dangling Alias-Targets, invalid Alignment. Legacy `"imperial"` wird bewusst nach `"imperium"` gemappt; andere unbekannte Alignments werfen.
- `scripts/test-resolver-data-integrity.ts` + `package.json` - neues `npm run test:resolver-data`, DB-frei und standalone.
- `src/lib/resolver/roles.ts`, `scripts/apply-override.ts`, `scripts/test-resolver.ts` - Character/Faction/Location-Rollen normalisieren jetzt laut; unerwartete Rollen werfen vor DB-Insert. `apply-override` verwendet den normalisierten `.role`-Wert.

## Decisions I made

- **Seeder + JSON normalisiert.** Ich habe beides gemacht: JSON auf `"imperium"` gebracht und im Seeder trotzdem das Legacy-Mapping `"imperial" -> "imperium"` belassen. Das schuetzt kuenftige lokale Alt-Diffs, ohne Tippfehler still auf `neutral` fallen zu lassen.
- **Missing Alignment bleibt inferierbar.** Alte Factions ohne explizites `alignment` nutzen weiter die bestehende Parent/Tone-Inferenz. Nur explizit gesetzte unbekannte Werte sind Fehler.
- **Fresh-Seed validiert vor dem Truncate.** Das ist etwas strenger als der alte Seed-Pfad, aber wichtig: kaputte JSON-Refs sollen nicht erst nach einem leeren Dev-DB-Reset auffallen.
- **Role-Normalisierung mitgefixt.** Das war im 064-Review ein P1 und blockierte `test:resolver`; es passt zum gleichen loud-validation-Prinzip und bleibt ohne DB-Apply.

## Verification

- `npm.cmd run test:resolver` - pass, 52 passed / 0 failed.
- `npm.cmd run test:resolver-data` - pass.
- `npm.cmd run typecheck` - pass.
- `npm.cmd run lint` - pass mit 1 bekannter Warnung: `src/app/layout.tsx:44` `@next/next/no-page-custom-font`.
- `npm.cmd run brain:lint -- --no-write` - pass, 0 blocking / 4 warnings.
- Optional beobachtet: `npm.cmd run test:resolver-coverage` - pass; meldet weiter `xenos.factions=2/3` und `nightbringer.locations=1/1` als Datenbefund, nicht als Script-Failure.

## Open issues / blockers

- Kein DB-Apply ausgefuehrt. Wenn `db:seed-resolver-extensions` bereits vor diesem Fix gegen eine DB lief, koennen die 14 damals als `"imperial"` gepflegten Factions dort faelschlich als `neutral` stehen, weil der alte Seeder unbekannte Alignments still defaultete.
- Optionaler manueller Follow-up fuer existing rows, nur wenn betroffen und nach Maintainer-Entscheid:

```sql
UPDATE factions
SET alignment = 'imperium'
WHERE alignment = 'neutral'
  AND id IN (
    'tanith_first',
    'verghastite_ghosts',
    'belladon',
    'imperial_navy',
    'ecclesiarchy',
    'urdeshi',
    'adeptus_astartes',
    'valhallan_597th',
    'phantine_air_corps',
    'gereon_resistance',
    'jantine_patricians',
    'vervunhive_militia',
    'aexegarian_forces',
    'mortifactors'
  );
```

## For next session

- Migration/Seed/Re-Apply bleibt Maintainer-Trigger: `db:migrate`, `db:seed-resolver-extensions`, Re-Apply `ssot-w40k-001..005`, danach echte SQL-Counts und Detail-Page-Smoke.
- Der 064-Coverage-Befund bleibt: `nightbringer` hat im Override selbst nur 1 Location; die urspruengliche `>=3 Locations`-Smoke-Erwartung braucht Datenanreicherung oder realistische Acceptance-Anpassung.

## References

- Review: `sessions/2026-05-12-064-impl-resolver-deep-audit.md`
- Parent implementation: `sessions/2026-05-12-063-impl-resolver-50-books.md`
