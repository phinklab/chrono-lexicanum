---
title: Buch-Reviewer-Findings haben keinen Apply-Pfad — Materialisierung ist ein Hand-Gate
type: decision
created: 2026-06-24
updated: 2026-06-24
sources:
  - ../../../sessions/archive/2026-06/2026-06-17-154-arch-book-reviewer.md
  - ../../../sessions/archive/2026-06/2026-06-17-154-impl-book-reviewer.md
  - ../../../sessions/archive/2026-06/2026-06-18-155-arch-book-review-web-pass.md
  - ../../../sessions/archive/2026-06/2026-06-18-155-impl-book-review-web-pass.md
  - ../../../sessions/archive/2026-06/2026-06-18-158-impl-gate-fl-materialize.md
related:
  - ./faction-policy.md
  - ./location-policy.md
  - ../project-state.md
confidence: high
decision-date: 2026-06-24
---

# Buch-Reviewer-Findings haben keinen Apply-Pfad

## Context

Der große Buch-Reviewer (122-B11, Briefs 154 + Stage 3 155) durchsucht den vollen
Korpus (889 Bücher) mit einem CC-Direct-Finder + adversarialen Verifier auf
Faction-/Junction-/Facet-Zugehörigkeit und reichert strukturelle Sentinels per
Web-Lookup an. Das produziert große Mengen maschinen-generierter Vorschläge:
`scripts/seed-data/book-review-queue.json` (`reviewQueue`), der Facet-Vorschlags-Log
und `scripts/seed-data/new-entity-proposals.json` (162 neue Entities + 3 Aliases
aus Stage 3). Die Frage war, ob diese Dateien direkt in den Apply-/Rebuild-Pfad
gehängt werden.

## Decision

**Reviewer-Output schreibt nie automatisch in die DB oder die kanonischen
Seed-Kataloge.** `book-review-queue.json`, der Facet-Vorschlags-Log und
`new-entity-proposals.json` sind **read-only Vorschlags-Dateien** — kein
`db:sync`/`db:rebuild`/Seed-Loader/Override-Apply liest sie (test- und
grep-bewiesen, `test:book-enrich` trägt einen No-Apply-Path-Guard). Die
Materialisierung ist ein bewusster **Hand-Gate**: Cowork/Philipp promoviert
ausgewählte Findings per Codex-Auftrag in `curation-overlay.json`
(Faction-/Junction-Findings) bzw. in `factions.json`/`locations.json` +
`*-aliases.json` (neue Entities, Gate F/L, Brief 158). Erst danach zieht der
normale `db:sync` sie in die DB.

Konkret gelandet: 96 Faction-/Junction-Findings → `curation-overlay.final`;
Gate F = 20 neue Factions + 1 Alias; Gate L = 142 neue Locations + 2 Aliases +
6 Raw-Surface-Brücken. Facet-Findings bleiben unmaterialisiert (schützt die
149/150-Content-Warning-Garantie). Neue Reference-Rows müssen **vor** dem
Korpus-Re-Apply existieren, sonst FK-Halt (Drukhari-Dry-Run, 154).

## Why

- **Adversariale LLM-Findings sind Vorschläge, keine Wahrheit.** ~4,9 % wurden vom
  Verifier widerlegt; ein Auto-Apply würde die widerlegten mitziehen, bevor ein
  Mensch draufschaut.
- **Schützt bestehende Garantien.** Ein Auto-Facet-Apply könnte die
  Content-Warning-Sichtbarkeitsregel (149/150) unterlaufen; das Hand-Gate hält
  die Datenhoheit beim Maintainer.
- **Entkoppelt vom DB-Freeze.** Weil die Pässe nur SSOT-Dateien lesen/schreiben,
  liefen sie unabhängig vom Freeze; die Materialisierung wartet auf den bewussten
  Apply.
- **Konsistent mit dem Kurations-Modell** (`why-cc-direct-curation.md`,
  B14-Verwurf): Hand-Kuration läuft per Codex-Auftrag an die Overlay-/Katalog-JSONs,
  nicht über automatische Pipelines oder ein Admin-UI.

## Revisit triggers

- Ein zukünftiger Reviewer-Lauf wird so verlässlich, dass ein
  Confidence-Schwellen-gegateter Auto-Promote (hohe Confidence + Verifier-bestätigt)
  den Hand-Aufwand rechtfertigt — dann ein expliziter, getesteter Apply-Pfad mit
  Schwelle + Audit-Bucket, nie ein stiller.
- Der Character-Long-Tail (315 geparkte Sentinels) wird angefasst (eigener Brief).
- `new-entity-proposals.json` wächst über das hand-prüfbare Volumen hinaus.
