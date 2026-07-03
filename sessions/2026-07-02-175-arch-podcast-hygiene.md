---
session: 2026-07-02-175
role: architect
date: 2026-07-02
status: implemented
slug: podcast-hygiene
parent: null
links: [2026-06-29-172, 2026-06-27-168, 2026-06-07-131, 2026-06-08-132, 2026-06-04-128]
commits: []
---

# 175 — Podcast-Hygiene: Drift-Fix + Catchup + Alias-Backlog (122-Batches)

## Goal

Den Podcast-Bestand in einen konsistenten, test-grünen Zustand bringen: die 8 gedrifteten Artefakte reconcilen (`test:podcast-cc-direct` auf `main` ist rot), den in 168 deferred Catchup für `the-40k-lorecast` / `adeptus-ridiculous` / `luetin09` über den 172er-Delta-Pfad fahren, den Alias-Backlog (~63 Luetin- + ~212 Lorehammer-Surface-Forms) triagieren und den Lorehammer-Twin-Filter für Cold-Reingest nachrüsten.

## Context

- **Drift:** Die committeten `ingest/podcasts/{luetin09,the-40k-lorecast}.extractions.json` re-assemblen nicht mehr byte-identisch zu ihren `.json`-Artefakten (Alias-Index-Drift seit Generierung) — 8 Failures in `test:podcast-cc-direct`, bestätigt auf sauberem `origin/main` (171-/172-Impl-Reports). 172-Impl schlägt Re-Assemble (`--stage=assemble`) oder einen `migrate:extractions --check`-Pass vor.
- **Catchup:** In 168 wurden die drei Shows approved, aber die Ausführung deferred (damals gab es nur Full-Show-Retag). Ihre Cursors stehen absichtlich auf dem `2026-01-01`-Floor, damit `refresh:check` genau diese Deltas re-surfaced (Stand W26: lorecast 4 / adeptus-ridiculous 3 / luetin09 1 Episode — inzwischen vermutlich mehr). Seit Brief 172 existiert der Delta-Pfad: `prepare-delta` → CC-Direct-Tagging → `merge-delta` → assemble → `apply:podcast --show` (Runbook `scripts/runbooks/add-podcast-episode-runbook.md`).
- **Alias-Backlog:** unaufgelöste Surface-Forms aus den Voll-Läufen (Luetin09: 132-Impl; Lorehammer: früherer Voll-Lauf). Resolver-Sidecars sind die `*-aliases.json` unter `scripts/seed-data/`.
- **Twin-Filter:** Lorehammers „(Video)"-Twins wurden beim Voll-Lauf hand-dedupliziert; ein Cold-Reingest würde sie wieder hereinholen. Kontext: Session 128 (Plan-Reconciliation).
- **Interplay, wichtig:** Alias-Ergänzungen ändern den Alias-Index und damit das Assemble-Ergebnis. Sequenzierung so wählen, dass am PR-Ende Extractions + Alias-Index + Artefakte in **einem** konvergenten Zustand liegen (ein finales Re-Assemble nach der Alias-Kuration liegt nahe; Reihenfolge ist deine Entscheidung, Ergebnis zählt).

## Constraints

- **Tagging-Modus: `cc-direct`** (der bewährte Null-Kosten-Pfad, Briefs 131/132). Kein neuer metered `ANTHROPIC_API_KEY`-Pfad.
- Nur der 172er-Delta-Pfad für den Catchup — kein Full-Show-Retag, keine reaktivierte retired Maschinerie. Die Delta-Guards (no-shrink, no-retag, needs-decision bei Drift) gelten; ein legitimes Re-Assemble aus den Extractions ist davon unberührt.
- Alias-Triage: Alias nur ergänzen, wo die Ziel-Entity **eindeutig existiert**. Keine neuen Entities. Ambige oder Neu-Entity-Kandidaten → committete Review-Liste (Muster `faction-starters.review.md`), Philipp entscheidet später.
- Kein Schema-Change, kein `db:sync`-Umbau. DB-Writes (`apply:podcast --show`) nur post-merge auf Philipps explizites Go — der PR selbst bleibt DB-frei.
- Cursor-Hygiene nach 168er-Logik: Cursors nur für Shows advancen, deren Episoden tatsächlich im Artefakt gelandet sind.
- Batches-Worktree, ein PR.

## Out of scope

- **S4 YouTube-Episode-Matching** (Session 128) — bewusst nicht in diesem PR, auch wenn Platz scheint.
- Kein Retro-Umtaggen der Buch-Seite: Alias-Ergänzungen dürfen committete per-Buch-Files (`scripts/seed-data/books/*.json`) nicht anfassen.
- Kein neuer Show-Add, keine YouTube-Channel-Acquisition (eigener Follow-up laut 172-Impl).
- `db:drift` / `db:sync` / Weekly-Refresh-CI unangetastet.

## Acceptance

The session is done when:

- [ ] `npm run test:podcast-cc-direct` vollständig grün auf dem Branch (die 8 committed-data-Failures sind weg, keine neuen).
- [ ] Für alle drei Shows sind die seit dem Cursor-Floor neuen Episoden getaggt und additiv in `ingest/podcasts/<slug>.extractions.json` + Artefakt gemergt (kein Bestands-Shrink; `mode:"delta"`-Pfad).
- [ ] Alias-Backlog triagiert: eindeutige Fälle als Aliases in den Sidecars, Rest auf einer committeten Review-Liste mit Begründung je Eintrag; das Zahlenverhältnis (aufgelöst vs. Review) steht im Report.
- [ ] Cold-Reingest von Lorehammer würde die „(Video)"-Twins nicht wieder einführen (Filter + Test, der das belegt).
- [ ] Cursors der drei Shows advanced; `refresh:check` würde die verarbeiteten Episoden nicht erneut vorschlagen.
- [ ] `npm run test:refresh`, `test:podcast-apply`, `test:podcast-ingest`, `lint`, `typecheck` grün.
- [ ] Impl-Report nennt die Post-Merge-Ops für Philipp (welche `apply:podcast --show`-Aufrufe, ob `POST /api/revalidate` sinnvoll).

## Open questions

- Wie viele Episoden waren zum Ausführungszeitpunkt tatsächlich neu pro Show (vs. W26-Stand 4/3/1)?
- Hat die Alias-Kuration Assemble-Ausgaben über die 8 bekannten Drift-Fälle hinaus verändert (z. B. `adeptus-ridiculous`/`lorehammer`)? Falls ja: kurz beziffern.
- Empfehlung: lohnt ein stehender `migrate:extractions --check`-Gate in CI gegen künftigen Alias-Index-Drift, oder reicht der bestehende Test?

## Notes

- Referenz-Flow: `scripts/runbooks/add-podcast-episode-runbook.md` (7 Stationen) + `scripts/podcast-cc-tag.ts` (`prepare-delta`/`merge-delta`) + Driver `run-podcast-tag-loop.sh` (liest `batches.json`, für Deltas einfach weniger Batches).
- Backlog-Quellen: Luetin-Surface-Forms im 132-Impl-Kontext (`sessions/archive/2026-06/2026-06-08-132-impl-luetin09-full-40k-apply.md`); Lorehammer analog aus dessen Voll-Lauf. Wo die Listen physisch liegen, bitte im Report festhalten.
