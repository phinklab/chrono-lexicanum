---
session: 2026-05-08-048
role: architect
date: 2026-05-08
status: implemented
slug: doc-refresh
parent: null
links:
  - 2026-05-08-047
commits: []
---

# Top-Level-Doku-Refresh (README, ARCHITECTURE, ONBOARDING)

## Goal

Die drei Top-Level-Markdowns (`README.md`, `ARCHITECTURE.md`, `ONBOARDING.md`) bringen den aktuellen Stand des Repos wieder in Einklang mit dem, was tatsächlich passiert ist. Heute referenzieren sie eine Welt vor dem Plan-Reshuffle 2026-05-02 und vor dem 26-Bücher-Manual-Seed 2b — externe Beobachter (auch Code-Review-Tools) glauben sonst zu Recht, dass die Pipeline noch in Python-Form auf Goodreads zielt. Dieser Brief ist reine Doku-Pflege, kein Code.

> **Bundle-Hinweis:** Brief 048 wird **gemeinsam mit Brief 047** (Pipeline-Härtung) in **einer einzigen CC-Sitzung** abgearbeitet. Beide Briefs sind in einem Pull zu lesen, beide Reports werden im selben Push committed (zwei separate Commits, einer pro Brief). Empfohlene Reihenfolge: 047-Code-Arbeit zuerst, 048-Doku-Pass danach — so beschreibt die Doku den nach 047 aktuellen Stand der Pipeline (z.B. neue Junction-Felder, gehärtete Validation), nicht den prä-047-Stand.

## Context

Externer Code-Review (Codex, 2026-05-08) hat in seinem Finding 6 markiert, dass `README.md`, `ARCHITECTURE.md`, `ONBOARDING.md` noch die alte Welt beschreiben. Cowork hat verifiziert:

- `README.md:29` — „Books are intentionally empty in v1 — they arrive in Phase 4 via the ingestion pipeline." → Falsch in zwei Punkten: Phase 4 wurde durch Reshuffle 2026-05-02 zu Phase 3, und Books sind seit 2b-Seed nicht mehr leer (26 manuelle).
- `ARCHITECTURE.md:36-40` — Diagramm sagt „ingest/ (Python, Phase 4) - Lexicanum scraper - Goodreads scraper - merge + load to Postgres". → Falsch in vier Punkten: TypeScript (nicht Python); Phase 3 (nicht 4); Goodreads ist tot seit 2020 (Brief 032 hat das festgestellt); statt „merge + load" ist heute Multi-Source-Merge-Engine + LLM-Anreicherungs-Schicht + Dry-Run-only.
- `ONBOARDING.md:126` — „You should see something like `Done. Inserted 0 books.`" → Falsch: das Seed-Script lädt seit 2b 26 manuelle Bücher.

Die echte Wahrheit über den Stand steht zerstreut in `sessions/README.md` (Infrastructure-Log + Active-Threads-Tabelle). Das ist Cowork-/Claude-Code-Doku, nicht Repo-Eingangs-Doku.

Phase-3-Status zum heutigen Datum (2026-05-08):

- Phase 3 läuft (vor zugewiesenes Reshuffle: war Phase 4)
- Stack: TypeScript (`npm run ingest:backfill`), nicht Python
- Discovery: Wikipedia-Master-Liste + drei Sub-Listen
- Aktive Crawler-Quellen: Wikipedia, Lexicanum, Open Library, Hardcover; LLM-Anreicherungs-Schicht (Anthropic Haiku 4.5 mit Web-Search) on top
- Dry-Run-only — schreibt nicht in die DB. Apply-Step (3d) ist offen, kommt nach Pipeline-Härtung (Brief 047).
- Books-Seed: 26 manuell, ~700 in Wikipedia-Discovery
- Goodreads: nicht mehr Bestandteil. Hardcover.app + Open Library + Web-Search ersetzen es.

## Constraints

- **Reine Doku-Arbeit.** Kein Code, keine Migration, keine Dependency-Änderung.
- **Drei Dateien explizit:** `README.md`, `ARCHITECTURE.md`, `ONBOARDING.md`. Andere Markdowns (z.B. `ROADMAP.md`, `docs/data/2b-book-roster.md`, `docs/agents/*`) sind out-of-scope für diesen Brief — die sind aktuell oder gehören zu eigenen Eigentümern.
- **Keine neuen Versprechen.** Wenn ein Abschnitt veraltet ist, weil ein Feature noch nicht da ist (z.B. „Books are populated via the ingestion pipeline" — heute partiell wahr, da 26 manuell + Pipeline-Output noch nicht applied), den aktuellen Stand wahrheitsgemäß beschreiben, nicht eine zukünftige Welt antizipieren.
- **`sessions/README.md` ist die Detailquelle.** Wenn ein Top-Level-Doku-Eintrag tiefere Details bräuchte, in einem Satz auf `sessions/README.md` oder den relevanten Brief verweisen, statt sie zu duplizieren.
- **Kein Stilumbau.** Bestehende Tonart, Stilebene, Markdown-Struktur, Diagramm-ASCII-Form bleiben. Es geht um Wahrheits-Reparatur, nicht um Re-Design.
- **Versions-Pinning bleibt verboten.** Falls bestehende Doku-Stellen Versionen nennen, die durch CC's Installs überholt wurden: keine neuen Pin-Werte einsetzen — Versions-Aussagen entweder ganz raus oder auf „Family"-Niveau (`Next.js 15+`, `Tailwind 4`).

## Out of scope

- Inhaltliche Erweiterungen, neue Sektionen, neue Diagramme.
- `ROADMAP.md` (ist aktuell laut Reshuffle-Eintrag).
- `docs/agents/*.md` (pflegt Cowork und Claude Code selbst).
- `docs/data/*.md` (ist aktuell, siehe sessions/README.md).
- `docs/ui-backlog.md`.
- `CLAUDE.md` (ist aktuell und enthält die Versions-Disziplin).
- Code-Anpassungen jeglicher Art.

## Acceptance

Die Session ist fertig wenn:

- [ ] `README.md` referenziert nicht mehr „Phase 4" für die Ingestion. Korrekte Aussage: Phase 3, TypeScript-Pipeline, Wikipedia + Lexicanum + Open Library + Hardcover als Quellen, LLM-Anreicherungs-Schicht für Synopsen + Soft-Facets. Books-Aussage: 26 manuell geseedet, weitere ~700 via Pipeline (Dry-Run, Apply pending).
- [ ] `ARCHITECTURE.md` zeigt das Ingestion-Diagramm in der heutigen Form: TypeScript, Phase 3, Wikipedia/Lexicanum/Open Library/Hardcover/LLM, Dry-Run-Status. Das Diagramm darf seine ASCII-Form behalten — nur Inhalt korrekt.
- [ ] `ONBOARDING.md` Schritt 3-4 nennen die korrekte Books-Erwartung nach `db:seed` (26 Bücher, nicht 0). Wenn der Onboarding-Pfad einen Schritt für „Pipeline ausführen" hat: korrekt verlinken auf `npm run ingest:backfill --help` oder `sessions/2026-05-04-044-arch-phase3e-batch-1.md` als Beispiel; wenn nicht, bewusst weglassen — Onboarding ist für Erstaufsetzer, nicht für Pipeline-Operator.
- [ ] Kein Goodreads-Erwähnung mehr in keiner der drei Dateien (außer ggf. in einem History-Hinweis "Goodreads-API wurde 2020 abgeschaltet" wenn das didaktisch in den Architektur-Kontext passt — CC's Wahl, ich empfehle weglassen).
- [ ] Kein „Python"-Erwähnung mehr für die Ingestion in keiner der drei Dateien.
- [ ] `git diff` zeigt nur Änderungen an den drei Top-Level-Markdowns. Keine anderen Dateien angefasst.
- [ ] Implementer-Report unter `sessions/2026-05-08-048-impl-doc-refresh.md` mit den drei Diff-Zusammenfassungen (was ersetzt durch was) und einem kurzen „andere stale Stellen entdeckt"-Befund falls CC beim Drüberlesen welche findet (für Carry-over-Pflege durch Cowork, kein Brief).

## Open questions

Nicht-blockierend:

- Soll der Books-Status (26 manuell + ~700 in Pipeline) in `README.md` zeit-gestempelt sein („Stand 2026-05") oder zeitlos formuliert? Empfehlung: zeitlos, weil sich die Zahl ändert sobald 3d landet — dann wieder Doku-Refresh.
- Im `ARCHITECTURE.md`-Diagramm: bleibt das ASCII-Box-Format oder wäre eine knappere Prosa-Form besser? Empfehlung: ASCII-Box bleibt, nur Inhalt korrigieren — Re-Design ist nicht Scope.
- Beim Drüberlesen: gibt es weitere stale Stellen außerhalb dieser drei Files (z.B. Code-Kommentare, JSDoc-Blöcke), die im selben Atemzug aktualisiert werden sollten? CC: bitte im Report erwähnen, aber NICHT mit-fixen — Scope-Disziplin. Cowork öffnet ggf. Carry-over-Item.

## Notes

Dieser Brief und Brief 047 (Pipeline-Härtung) haben null Code-Überlappung — 047 ist Code, 048 ist Doku. Sie werden trotzdem **gemeinsam** in einer Sitzung abgearbeitet (siehe Bundle-Hinweis im Goal). Zwei klar getrennte Commits, einer pro Brief, gegenseitige Linkung in den Reports.

Wenn 047 in der gleichen Sitzung neue Begriffe oder Feldnamen einführt (z.B. „Junction-Coverage", „Format-Validation-Hardening"), darf 048 die in der Doku **nicht** im Detail erklären — Top-Level-Doku ist für Erstaufsetzer, nicht für Pipeline-Operator. Wenn ein neues Konzept zwingend erwähnt werden muss, in einem Satz auf den Brief oder `sessions/README.md` verweisen.
