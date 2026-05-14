---
session: 2026-05-14-072
role: implementer
date: 2026-05-14
status: complete
slug: resolver-batch-2
parent: 2026-05-14-072
links:
  - 2026-05-14-072-arch-resolver-batch-2
  - 2026-05-12-063-arch-resolver-50-books
  - 2026-05-12-069-impl-resolver-apply-evidence
  - 2026-05-13-070-arch-faction-policy-hygiene
commits: []
---

# Resolver-Pass 2 - Surface-Form-Crystallization fuer ssot-w40k-006..010

## Summary

Resolver-Pass 2 ist umgesetzt: Seed-Daten, Aliase, Heretic-Astartes-Taxonomie, Cross-Batch-Collection-Aufloesung und Resolver-Tests decken nun `ssot-w40k-001..010` ab. Die DB wurde mit dem erweiterten Resolver-Set neu geseedet und alle 10 Override-Batches wurden erneut angewendet; globale Junction-Counts stehen danach bei `work_factions=650`, `work_locations=239`, `work_characters=475`, `work_collections=35`.

## What I did

- `scripts/seed-data/factions.json` - 54 neue bzw. neu strukturierte Faction-Eintraege, inklusive `heretic_astartes`-Mid-Knoten, Death Guard, Emperor's Children, Renegade Chapters, Loyalist Chapters, Mechanicus/Titanicus/Assassinorum-Ergaenzungen, Chaos-Gods, Xenos und Long-tail-Factions.
- `scripts/seed-data/locations.json` - 45 neue Locations fuer die zweite 50er-Welle; `great_rift` behaelt alte Tags und bekommt `era_frame`.
- `scripts/seed-data/characters.json` - 38 neue Characters aus freq>=2 plus Cowork-kuratierte lore-iconic freq=1-Promotionen.
- `scripts/seed-data/*-aliases.json` - neue Faction-, Location- und Character-Aliase fuer Drukhari/Aeldari, Great Rift/Cicatrix Maledictum, Kharn/Kharne-Variante, Czevak und weitere Surface-Forms.
- `scripts/seed-data/faction-policy.json` - neue Browse-Roots `heretic_astartes`, `adeptus_titanicus`, `officio_assassinorum` plus Special-Case-Notizen.
- `scripts/seed-resolver-extensions.ts` - Brief-072-tauglicher Seed-Lauf inklusive idempotentem `great_rift`-Tag-Update.
- `scripts/apply-override.ts` - `applyCollections` loest `external_book_id` jetzt batchuebergreifend gegen `works.external_book_id` auf und warnt laut bei unaufloesbaren Endpunkten.
- `scripts/test-resolver.ts` - Resolver-Testset auf 51 Cases erweitert.
- `scripts/apply-override-dry.ts`, `scripts/test-resolver-coverage.ts`, `scripts/test-resolver-data-integrity.ts` - Batch-Spanne auf `001..010`, neue Smoke-Slugs und Cross-Batch-Collection-Checks.
- `sessions/2026-05-14-072-arch-resolver-batch-2.md` - Status auf `implemented` gesetzt.
- `brain/wiki/index.md`, `brain/wiki/decisions/why-sonnet-not-haiku.md` - vorhandene Brain-Lint-Blocker aus den vorgefundenen Cowork-Aenderungen bereinigt, damit `brain:lint -- --no-write` wieder gruen laeuft.

## Decisions I made

- **Alpha Legion unter `heretic_astartes` reparented**: Der Brief nannte es optional; ich habe es fuer die W40K-Post-Heresy-Taxonomie konsistent mit den anderen Traitor Legions umgesetzt, trotz bekannter Cabal-Ambiguitaet.
- **Death Guard und Emperor's Children unter `heretic_astartes` gepflanzt**: Beide bleiben Legions-/Traitor-Astartes-Knoten, nicht direkte Chaos-God-Kinder. Die God-Beziehung bleibt implizit bzw. ueber Tags/Alignment.
- **Marginale Rows behalten**: `star_scorpions`, `celestial_lions` und `squats` wurden nicht gedroppt, weil der Brief sie als kleine, aber valide Promotionen markiert und keine Scope-Reduktion verlangt hat.
- **Black Library als `black_library_place` modelliert**: Dadurch bleibt die Location-Achse getrennt von der meta-/publishernahen Bedeutung des Namens.
- **Iyanden doppelt behandelt**: Als Ort existiert `iyanden`; faction-axis Surface-Forms `Iyanden`/`Craftworld Iyanden` aliasen defensiv auf `eldar`, weil keine eigene Craftworld-Faction im Seed eingefuehrt wurde.
- **Kein zusaetzlicher freq=1-Cast**: Ich habe nur die 22 im Brief kuratierten lore-iconic freq=1-Characters promoted. Der restliche Long-tail bleibt in Notes/Unresolved-Ausgaben sichtbar.
- **Brain-Lint-Fix eng gehalten**: Die Brain-Dateien waren beim Start bereits dirty/untracked. Ich habe nur den blockierenden Source-/Index-Zustand der neuen Decision-Datei korrigiert und keine fremden inhaltlichen Aenderungen zurueckgesetzt.

## Verification

- `npm.cmd run db:seed-resolver-extensions` - pass; Ergebnis `factions: +54 new`, `locations: +45 new`, `characters: +38 new`, `great_rift tags: updated`.
- `npm.cmd run db:apply-override -- --batch=ssot-w40k-001` bis `ssot-w40k-010` - pass; alle Batches erneut angewendet, keine neuen Persons in `persons.json`.
- DB-count SQL - pass; global danach `work_factions=650`, `work_locations=239`, `work_characters=475`, `work_collections=35`, Seeds `factions=106`, `locations=113`, `characters=103`.
- DB-smoke SQL - pass; `the-anarch=9/3/11`, `calgars-fury=7/3/1`, `the-emperors-gift=8/2/1`, `storm-of-iron=6/1/6`, `celestine=5/1/1`, `spear-of-the-emperor=8/3/2`.
- Collection spotcheck - pass; `W40K-0040` enthaelt `first-and-only`, `ghostmaker`, `necropolis`; `W40K-0061` enthaelt `storm-of-iron`, `iron-warrior`; global `work_collections=35`.
- `npm.cmd run lint` - pass mit bestehender Next.js-Warnung `src/app/layout.tsx:44 @next/next/no-page-custom-font`.
- `npm.cmd run typecheck` - pass.
- `npm.cmd run test:resolver` - pass, `51 passed, 0 failed`.
- `npm.cmd run test:resolver-data` - pass.
- `npm.cmd run test:resolver-coverage` - pass; Coverage-Summen `factions=650/657`, `locations=239/258`, `characters=475/552`; einige neue Smoke-Slugs bleiben bewusst data-thin auf einzelnen Achsen.
- `npm.cmd run test:apply-override-dry` - pass; resolved counts `work_factions=650`, `work_locations=239`, `work_characters=475`, alte same-batch Collections `17`, neue cross-batch-faehige Collections `35`, forward refs `0`.
- `npm.cmd run brain:lint -- --no-write` - pass; blocking `0`, warnings `6` (bestehende Raw-Field/Size/Stale-Claim-Warnungen).
- `git diff --check` - pass.

## Open issues / blockers

Keine Blocker fuer Brief 072.

Es bleiben erwartete Long-tail-Unresolveds in den Dry-run-Ausgaben, u.a. Factions `Cognitae`, `Reclaimers`, `Volpone Bluebloods`, 19 Location-Singletons und viele Character-Singletons. Diese wurden nicht promoted, weil der Brief die Promotion-Grenze bewusst auf freq>=2 plus kuratierte freq=1-Iconics beschraenkt.

Beim Start lagen bereits fremde/maintainernahe Aenderungen in `brain/wiki/project-state.md`, `brain/wiki/open-questions.md`, `sessions/README.md`, `brain/wiki/decisions/why-haiku-not-sonnet.md` und die untracked Brief-/Decision-Dateien vor. Ich habe sie nicht zurueckgesetzt.

## For next session

- Der SSOT-Loop aus 061 kann nach Maintainer-Go mit `ssot-w40k-011` fortgesetzt werden.
- OQ9/Cockpit kann jetzt die 100-Book-Schwelle und die Resolver-Pass-2-Counts als Trigger-Stand nutzen.
- Die verbliebenen Long-tail-Surface-Forms sollten bis zur naechsten 50er-Schwelle in Notes bleiben und dann erneut aggregiert werden.

## References

- `sessions/2026-05-14-072-arch-resolver-batch-2.md`
- `sessions/2026-05-12-063-arch-resolver-50-books.md`
- `sessions/2026-05-12-069-impl-resolver-apply-evidence.md`
- `sessions/2026-05-13-070-arch-faction-policy-hygiene.md`
- `sessions/ssot-loop-log.md`
