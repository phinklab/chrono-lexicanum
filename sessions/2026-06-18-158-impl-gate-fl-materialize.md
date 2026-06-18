---
session: 2026-06-18-158
role: implementer
date: 2026-06-18
status: complete
slug: gate-fl-materialize
parent: 2026-06-18-155
links:
  - 2026-06-18-155
commits: []
---

# Gate F/L - Web-Enrichment-Proposals in Seed-Kataloge materialisieren

## Summary

Gate F und Gate L sind aus `scripts/seed-data/new-entity-proposals.json` in die Seed-Kataloge promoviert: 20 neue Factions, 142 neue Locations, 1 expliziter Faction-Alias, 2 explizite Location-Aliases plus 6 belegte Raw-Surface-Bruecken fuer `new`-Proposals mit abweichendem Canon-Namen. Die Proposal-Datei bleibt unveraendert/read-only; `Rhamiel` bleibt Sentinel und wurde nicht angelegt.

## What I did

- `scripts/seed-data/factions.json` - 20 `decision: "new"` Factions als neue Canon-Rows ergaenzt, inklusive `gardinaal` als top-level/minimal row und `legio_suturvora` mit `glyph: "Fire Masters"`.
- `scripts/seed-data/faction-aliases.json` - `Crimson Sabres -> crimson_slaughter` sowie `Fire Masters -> legio_suturvora` als Raw-Surface-Bruecke ergaenzt.
- `scripts/seed-data/locations.json` - 142 `decision: "new"` Locations als neue Canon-Rows ergaenzt; null/false Proposal-Felder wurden nicht als geratenes Seed-Feld materialisiert.
- `scripts/seed-data/location-aliases.json` - `Redemption -> candleworld`, `Vytarn -> candleworld` sowie die 5 Raw-Surface-Bruecken `Absalom`, `Aurelia`, `Gathis`, `Miral Prime`, `Styxia` ergaenzt.
- `scripts/test-resolver.ts` - Gate-F/L-Assertions fuer die explizit genannten Alias-/Sentinel-Faelle und die Raw-Surface-Bruecken hinzugefuegt.
- `sessions/2026-06-18-155-arch-book-review-web-pass.md` - Status auf `implemented` gesetzt.

## Decisions I made

- **Raw-Surface-Bruecken fuer `new`-Proposals angelegt.** Sechs `new`-Proposals haben `rawName != canonicalName`; der Resolver matched nur Canon-`name` oder Alias-Key. Ohne diese belegten `rawName -> proposedId`-Aliases waeren bestaetigte Sentinels wie `Fire Masters` und `Absalom` trotz Canon-Row weiterhin unresolved geblieben.
- **Keine Alias-Bruecken geraten.** Die Bruecken kommen ausschliesslich aus `rawName`, `canonicalName` und `proposedId` der Proposal-Datei; alle anderen `new`-Proposals loesen direkt ueber den Canon-Namen.
- **Gardinaal nicht zurueckgestellt.** Bestehende Seed-Konventionen erlauben top-level Factions mit `parent: null`; fehlendes `alignment`/`tone` ist hier kein FK- oder Enum-Risiko. Der Resolver-Guard bestaetigt `Gardinaal -> gardinaal`.
- **Location-Flags sparsam materialisiert.** `capital`, `destroyed` und `warp` wurden nur gesetzt, wenn das Proposal explizit `true` hatte; `null`/`false` bleibt im Seed-Format unausgeschrieben.
- **Kein Apply-Pfad gebaut.** `new-entity-proposals.json` wurde nicht veraendert und bleibt laut bestehendem Test unreferenziert von Apply/Rebuild/Seed-Entrypoints.
- **Kein `db:sync` vor Merge.** Der DB-Lauf gehoert nach Merge auf frischem `main`; `db:rebuild` ist fuer diese Routine weiter tabu.

## Verification

- `node -e <proposal-vs-seed sanity>` - pass; 20/1 Faction-Proposals und 142/2/1 Location-Proposals korrekt materialisiert, 6 Raw-Bruecken vorhanden, `rhamiel` nicht angelegt.
- `npm.cmd run test:resolver` - pass, 518 passed / 0 failed.
- `npm.cmd run test:aliases` - pass, 15 passed / 0 failed.
- `npm.cmd run test:resolver-data` - pass.
- `npm.cmd run test:book-enrich` - pass, 50 passed / 0 failed; No-Apply-Path fuer `new-entity-proposals.json` bestaetigt.
- `npm.cmd run test:apply-override-dry` - pass; keine missing resolved FK targets / keine dangling JSON FK/alias refs.
- `npm.cmd run test:resolver-coverage` - pass; bekannte Below-threshold-Zeilen sind datenbezogene Reports, keine Failures.
- `npm.cmd run lint` - pass.
- `npm.cmd run typecheck` - pass.
- `npm.cmd run brain:lint -- --no-write` - pass; 0 blocking, 14 warnings.

## Open issues / blockers

Keine fuer die Materialisierung. `db:sync` wurde absichtlich noch nicht ausgefuehrt, weil die Seed-Aenderung zuerst per PR nach `main` muss.

## For next session

- Nach Merge im Batches-Worktree: `git pull --ff-only`, dann `npm.cmd run db:sync`, danach optional `npm.cmd run db:drift`.
- Kein `db:rebuild` fuer diesen Routine-Pfad verwenden.

## References

- `sessions/2026-06-18-155-impl-book-review-web-pass.md`
- `scripts/seed-data/new-entity-proposals.json`
