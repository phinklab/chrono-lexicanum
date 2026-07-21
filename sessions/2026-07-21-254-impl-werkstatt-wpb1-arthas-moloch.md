---
session: 2026-07-21-254
role: implementer
date: 2026-07-21
status: complete
slug: werkstatt-wpb1-arthas-moloch
parent: launch-prompt (WP-Triage Session 243; kein Architect-Brief — serielle Launch-Session aus dem Koordinations-Worktree)
links: []
commits:
  - (dieser PR)
---

# Werkstatt-Bau WP-B1 — Chart-Welt „Moloch" an `arthas_moloch` linken und umbenennen

## Summary

Die unverlinkte Chart-Welt `moloch` (Dead World, Segmentum Ultima, gx 861.84/gy 539.26) ist jetzt an die Location `arthas_moloch` gelinkt und heißt im Katalog „Arthas Moloch" — mit ihren 2 Werken (Buch *Empire of Lies* + Adeptus-Ridiculous-Farsight-Episode). Dafür hat die Map-Worlds-Pipeline einen kleinen **Opt-in-Name-Override** bekommen: eine optionale Spalte `Name-Override` im Welten-Sheet der Kurations-Excel, die ausschließlich den Anzeigenamen eines Pins ändert. Kein globales „linked ⇒ Location-Name" — Umbenennung nur per expliziter Zeile. Abdeckung 1352 → 1354 Werk-Kanten (79.2 %), Worklist 238 → 237 offene Locations. `moloch-iii` und das HH-`molech` sind unberührt.

## What I did

- `scripts/map-worlds-core.ts` — Welten-Sheet-Contract erweitert: `WELTEN_HEADERS` = `Welt-ID | locationId-Override | Name-Override | Notiz`; das alte 3-Spalten-Layout (`WELTEN_HEADERS_LEGACY`) wird beim Lesen weiter akzeptiert, damit die committete Excel ohne Migrations-Zwang parst. `CurationWorldRow.locationIdOverride` ist jetzt tri-state (`undefined` = Zelle leer, Zeile fasst den locationId-Pfad nicht an; `null` = force-unmatch; String = erzwungene locations.json-ID) — eine Zeile muss mindestens eine der beiden Override-Zellen füllen (fail-loud sonst). `buildCatalog` wendet `nameOverride` erst bei der Welt-Komposition an (`WorldDraft.name` bleibt der eingefrorene Excel-Name); Review-Report: Welten-Overrides-Tabelle mit dritter Spalte `Name-Override`, Kopf-Prosa aktualisiert.
- `scripts/import-map-worlds.ts` — `--sync-curation`-Writeback schreibt das Welten-Sheet im neuen 4-Spalten-Layout; Name-only-Zeilen behalten eine **leere** locationId-Zelle (ein `-` würde beim nächsten Parse zum force-unmatch).
- `scripts/test-map-worlds.ts` — Parser-Tests auf das neue Layout umgestellt + neue Fälle: Legacy-Header-Parse, Name-only-/Kombi-Zeilen, „weder-noch"-Fehler, und das reale WP-B1-Szenario als Katalog-Test (Rename auf einen Namen, den der Matcher kennt, plus Link auf dieselbe Welt — s. Decisions). 47/47 grün.
- `scripts/seed-data/source/map-worlds-curation.xlsx` — beide Einträge nach expliziter Freigabe von Philipp in-session per Skript eingetragen (Raw-Edit, alle 363 bestehenden Kurations-Zeilen unverändert übernommen), danach durch den offiziellen `--sync-curation`-Pfad kanonisch normalisiert: Kuration Zeile `arthas_moloch` → Aktion=`link`, Ziel=`moloch`; Welten-Sheet → `moloch | (leer) | Arthas Moloch` mit Notiz „WP-B1: Chart-Welt „Moloch" = Arthas Moloch (nicht Moloch III / Molech)".
- `scripts/seed-data/map-worlds.json` + `map-worlds.review.md` — regeneriert: `moloch` mit `name: "Arthas Moloch"`, `locationId: "arthas_moloch"`, 2 works; Review §2 ohne die arthas_moloch-Zeile, §3 mit Links (6) + Welten-Overrides (1).
- `docs/werkstatt-roadmap.md` — WP-B1 abgehakt (✔ 254).

## Decisions I made

- **Name-Override ist display-only.** Der Override greift erst bei der Welt-Komposition; ID-Vergabe, Namens-Matching und Kurations-Targeting (`sameNameInstances`) laufen weiter über den eingefrorenen Excel-Namen. Das ist im WP-B1-Fall nicht kosmetisch, sondern notwendig: „Arthas Moloch" ist der kanonische Location-Name und steht im case-insensitiven Matcher — würde der Rename ins Matching einfließen, griffe der Auto-Match und der Link-Guard („already matches location by name") würde den Convert hart abbrechen. Der Unit-Test „name-only rename is display-only" pinnt genau diese Konstellation.
- **Tri-state statt Pflicht-locationId.** Die Rename-Zeile darf den locationId-Pfad nicht anfassen (der Link aus dem Kurations-Sheet setzt ihn; ein Welten-Override auf derselben Welt würde den Link-Guard „already carries a forced locationId" auslösen). Deshalb ist die vorher verpflichtende locationId-Zelle jetzt optional, sobald ein Name-Override da ist — leer = `undefined` = „nicht angefasst", strikt getrennt von `null` = force-unmatch.
- **Legacy-Header wird gelesen, nie geschrieben.** Kein Migrations-Schritt nötig; der nächste `--sync-curation` hebt die Datei aufs 4-Spalten-Layout (hier bereits geschehen).
- **Excel-Eintrag durch CC:** Der Brief sah Philipps Hand vor; er hat in-session explizit die Skript-Variante freigegeben (Rückfrage mit beiden Optionen). Der Raw-Edit bricht ab, falls die Zielzeile schon eine Aktion trägt oder `moloch` im Welten-Sheet existiert.

## Verification

- `npm run test:map-worlds` 47/47 grün (Suite um die neuen Override-Fälle erweitert); `npx tsc --noEmit` pass; `npx eslint` auf den drei geänderten Skripten pass.
- Writeback-Roundtrip vorab in einer Sandbox-Datei verifiziert (schreiben → einlesen → parsen: Name-only-Zeile bleibt `undefined`, `-` bleibt force-unmatch, Kombi-Zeile trägt beides).
- Determinismus/Idempotenz: Vor dem Excel-Eintrag reproduzierte der Convert `map-worlds.json` byte-identisch (nur die review-Kopf-Prosa änderte sich erwartungsgemäß); nach dem Eintrag produzierte ein zweiter `import:map-worlds`-Lauf keinen weiteren Diff.
- Konsolen-Summen: 6 Links, 57 Rollups, 63 Pins, 1 Welten-Override; matched 156 Welten (149 Locations); Abdeckung 1354/1710 (79.2 %); 237 offene Medien-Locations.

## Open issues / blockers

- Keine. Die untracked `zones-draft-backup-2026-07-18.json` liegt weiter unangetastet im Tree (Bestand aus einer früheren Session, nicht Teil dieses PRs).

## For next session

- Der Name-Override steht jetzt jeder weiteren Kurations-Runde zur Verfügung (z. B. falls WP-Folgezeilen aus `map-worlds.review.md` § 2 ebenfalls Excel-Namen ≠ Location-Namen haben). Rollup-Ownership beachtet: kein `brain/**`-Edit aus dieser Session — Systemfakt für den Rollup ist der neue Welten-Sheet-Contract (Spalte `Name-Override`, tri-state locationId, Legacy-Read).
