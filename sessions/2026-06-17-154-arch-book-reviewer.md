---
session: 2026-06-17-154
role: architect
date: 2026-06-17
status: open
slug: book-reviewer
parent: 2026-06-03-122
links:
  - 2026-06-12-149
  - 2026-06-14-149
  - 2026-06-07-131
  - 2026-06-11-144
commits: []
---

# Großer Buch-Reviewer — Pilot (Finder + adversariale Verifier, CC-Direct) → Review-Queue (Board 122-B11)

## Goal

Baue den **Multi-Agent-Buch-Reviewer als Pilot über eine Kalibrierungs-Charge (~30–50 Bücher)**: ein automatisierter CC-Direct-Batch-Driver, der pro Buch Korrektur-Kandidaten in den Dimensionen **Factions, Junctions (Locations + Characters) und Facets** findet, jedes faktische Finding von einem **zweiten, unabhängigen Verifier adversarial bestätigen/widerlegen** lässt, und die bestätigten Findings als **Vorschläge** (nie auto-appliziert) ablegt — Faction-/Junction-Findings in der `reviewQueue` des 149er `curation-overlay.json`, Facet-Findings in einem **separaten, reinen Vorschlags-Log** (kein Apply-Pfad). Ziel des Piloten ist, **Topologie + Finding-Format + Falsch-Positiv-Rate zu validieren, bevor 889× Arbeit hineinläuft**.

## Context

- Board [122-B11](./2026-06-03-122-arch-batches-board.md): „Großer Buch-Reviewer: Multi-Agent-Review (Finder + adversariale Verifier, Muster der Deep-Reviews 140/141/144) über alle 889 Bücher — Facets, Factions, Junctions, Synopsis-Qualität; Findings landen in der 149er-Review-Queue. Durch B2/149 entsperrt." Backlog-Sort 2026-06-12: B11 ist nach P11 der nächste substanzielle Batches-Handoff; **B12 (Ask-Tuning) hängt bewusst hinter B11** (Datenqualität zuerst).
- **Synopsis-Qualität ist für diesen Piloten bewusst gestrichen** (Maintainer-Entscheid 2026-06-17). Die drei Dimensionen des Piloten sind **Factions, Junctions, Facets**.
- **Das Review-Queue-Fundament steht** ([149](./2026-06-12-149-arch-curation-foundation.md) + impl [149](./2026-06-14-149-impl-curation-foundation.md)). `scripts/seed-data/curation-overlay.json` trägt zwei Sektionen mit **identischer Buch-Form**: `final` (appliziert, voll validiert) und `reviewQueue` (nur strukturell validiert, **nie appliziert**, bis ein Mensch einen Eintrag nach `final` schiebt). Promotion = Eintrag verschieben. Format: `scripts/seed-data/curation-overlay.README.md`. **Das ist der Eingang für B11-Findings** — der Reviewer **schreibt nur `reviewQueue`, nie `final`, mutiert nie die DB.**
- **Zwei strukturelle Grenzen des Overlays, die diesen Brief formen** (aus 149-impl + README, unbedingt beachten):
  1. Die Buch-Form kennt `factions{add,remove}`, `locations{add,remove}`, `characters{add,remove}` und `fields{synopsis,format,primaryEraId}`. **„Junctions" = Locations + Characters** (was das Overlay halten kann). Series-/Event-Junctions sind **nicht** Teil des Apply-Pfads → **out of scope** dieses Piloten.
  2. **Das Overlay hat keine Facet-Sektion und der Validator weist einen `facets`-Key laut ab** (Content-Warning-Garantie aus Brief 149/150 — `work_facets` dürfen nie über diesen Pfad in die Besucher-UI zurück). Facet-Findings können also **strukturell nicht** in die `reviewQueue`. Sie brauchen einen eigenen Heimatort (s. Constraints).
- **CC-Direct ist der Ausführungspfad** (Maintainer-Entscheid 2026-06-17, Null-Kosten). Das bewährte Muster ist der automatisierte Batch-Driver aus Brief [131](./archive/2026-06/2026-06-07-131-arch-podcast-tagging-cc-direct.md) (Vorbild `scripts/run-ssot-loop.sh` / `npm run ingest:podcast:tag`): ein Bash-Driver zerlegt die Arbeit in Chunks fester Größe und spawnt **pro Chunk eine frische headless `claude -p`-Subsession** (eigener Prozess = frischer Kontext = automatisches close/reopen, **kein manuelles `/clear`**), gegen die Max-Allowance, **null metered API**. Der Driver-Prozess hält null LLM-Kontext; resumebar/idempotent über bereits erledigte Keys.
- **Das adversariale Muster ist erprobt** ([144](./archive/2026-06/2026-06-11-144-impl-technical-deep-review.md)): read-only Finder produzieren Roh-Findings, **jedes faktische Finding wird von einem zweiten, unabhängigen Agent adversarial bestätigt oder widerlegt**; im Technical-Review wurden so 89 Roh-Findings auf einen verifizierten Satz reduziert (14 widerlegt & aussortiert). Genau dieser Filter ist die Qualitätsschwelle, die den `reviewQueue` vor halluzinierten Korrekturen schützt.
- **DB-Freeze gilt weiter.** Kein Prod-`db:migrate`/`db:apply-override`/`db:rebuild`/Cleanup. Der Reviewer ist read-only gegenüber der DB; sein einziger Output sind committete Vorschlags-Dateien.

## Constraints

- **Pilot, nicht Voll-Lauf.** Diese Session baut den Driver + die Konventions-Docs + den Finder/Verifier-Contract und fährt ihn über eine **Kalibrierungs-Charge von ~30–50 Büchern** (deterministisch ausgewählt — z. B. die ersten N nach Roster-Reihenfolge, oder eine feste, im Report genannte Auswahl, die alle drei Dimensionen trifft). **Den Driver über alle 889 Bücher zu fahren ist Maintainer-Betrieb, kein Build-Schritt** (Muster: 131 taggt nur 20 Demo-Folgen, Voll-Katalog = derselbe Befehl im Betrieb).
- **Reviewer schreibt nur Vorschläge, nie Wahrheit.** Faction-/Junction-Findings landen ausschließlich in `reviewQueue` von `curation-overlay.json` (bzw. einem dem Driver gehörenden Vorschlags-Sidecar, das **mechanisch** in `reviewQueue` mündet — CCs Wahl, solange die Form 149-konform ist). **Nie** `final`, **nie** DB-Mutation.
- **Facet-Findings laufen NICHT über den Overlay-Apply-Pfad.** Sie werden in einer **separaten, ausschließlich lesbaren Vorschlags-Datei** geführt (Dateiname/Form = CCs Wahl, z. B. `scripts/seed-data/facet-review-queue.json`), die **kein** Apply-Script besitzt und **nirgends** in `curation-overlay`-Apply, `db:rebuild` oder einen DB-Write eingehängt ist. Damit bleibt die 149/150-Garantie (kein `content_warning` zurück in die Besucher-UI) **strukturell** unberührt: Facet-Findings sind reine Notizen für den Maintainer. Der `curation-overlay`-Validator und seine Stray-`facets`-Key-Ablehnung bleiben **unverändert**.
- **Finder emittiert Surface-Forms für Additionen, kanonische IDs für Suppressions.** Eine vorgeschlagene Faction-/Location-/Character-**Addition** wird als **Surface-Form** emittiert und **deterministisch über den bestehenden Alias-Index** (`resolve*`-Pfad) zu einer kanonischen ID aufgelöst — exakt die Arbeitsteilung aus dem Buch-/Podcast-Loop („Pipeline produziert Surface-Forms, Resolver crystallisiert sie"). Eine **Suppression** referenziert eine **bereits am Buch hängende kanonische Edge** (die steht im aktuellen Buch-Zustand, den der Finder sieht). Das hält jeden Subsession-Kontext klein — **kein Preload des Voll-Vokabulars** (202 Factions / 289 Worlds / 490 Characters) in den Finder-Kontext.
- **Adversariale Verifikation ist Pflicht und unabhängig.** Jedes faktische Finding (jede vorgeschlagene Addition/Suppression/Facet-Korrektur) wird von einer **separaten Subsession als der, die es gefunden hat** geprüft (frischer Prozess, frischer Kontext). Nur **bestätigte** Findings landen im Vorschlags-Output; **widerlegte** werden mit Begründung in einen Report-/Log-Abschnitt aussortiert (nicht in die Queue). Die Falsch-Positiv-/Widerlegungs-Quote steht im Report (Muster 144: Roh-Findings vs. bestätigt vs. widerlegt als Tabelle).
- **Kontext-Disziplin — harte Batch-Größe, frischer Prozess pro Batch, kein manuelles `/clear`.** Wie 131: der Maintainer startet **einen** Befehl; der Bash-Driver iteriert selbst, spawnt pro Batch eine frische `claude -p`-Subsession, validiert deren JSON gegen den Finding-Contract und merged es **sequenziell/atomar** in den Vorschlags-Output. Resumebar (überspringt bereits reviewte Buch-IDs). Batch-Größe ist hart und im Report mit Token-Rahmen belegt (klar unter ~120k pro Subsession).
- **Read-only gegenüber der DB; reproduzierbarer Eingang.** Der „aktuelle Zustand" eines Buchs (seine Factions/Locations/Characters/Facets), gegen den der Finder reviewt, wird **read-only** bezogen. Ob aus einem read-only Snapshot der committeten kanonischen Daten (Batches/Overrides — die SSOT, aus der `db:rebuild` ohnehin rekonstruiert) oder aus einem read-only Prod-Snapshot (`scripts/consolidation-db-snapshot.ts` als Kandidat) ist **CCs Wahl** — die Quelle muss reproduzierbar und ohne Mutation sein. Begründung in den Report.
- **Konventions-Doc je Dimension** (committet, menschenlesbar): was eine korrekte Faction-/Junction-/Facet-Zuordnung ausmacht, was der Reviewer **nicht** flaggen soll (z. B. legitime Mehrfach-Factions, „mentioned" vs. „primary"), und der Hinweis „leere Korrektur-Liste ist die richtige Antwort, wenn das Buch stimmt". Gleiche Philosophie wie das `EPISODE_SYSTEM_PROMPT`-Extrakt in 131 — getunte Semantik lebt in einem committeten Doc, nicht nur im Code.
- **Version-Policy:** keine Pins (CLAUDE.md § Version policy). **TypeScript strict, server-seitig.** Kein `@anthropic-ai/sdk`-Aufruf im CC-Direct-Laufpfad (Null-Kosten wie 131).

## Out of scope (explizit NICHT anfassen)

- **Synopsis-Qualitäts-Review** — für diesen Piloten gestrichen; eigener Folge-Lauf, falls Philipp ihn nach dem Piloten will.
- **Series-/Event-Junctions** — nicht im 149er-Apply-Pfad; nicht reviewen.
- **Voll-Lauf über alle 889 Bücher** — Maintainer-Betrieb nach erfolgreichem Piloten, kein Acceptance-Kriterium hier.
- **Promotion von `reviewQueue` → `final`** — bleibt Maintainer-/Codex-Hand-Schritt (Hand-Kuration läuft seit dem B14-Verwurf 2026-06-17 per normalem Codex-Auftrag an `curation-overlay.json`). Der Reviewer **promotet nichts**.
- **Änderungen am `curation-overlay`-Apply, am Validator, an `db:rebuild`, an `resolve.ts`/Alias-Index-Logik** — der Reviewer **konsumiert** den Resolver read-only und **schreibt** nur Vorschlags-Dateien. Diff an Apply-/Validator-/Rebuild-Pfaden = 0.
- **Jede DB-Mutation** (DB-Freeze).
- **Facet-Apply-Mechanik jeder Art** — Facet-Findings sind reine Notizen; ein Apply-Pfad für Facets ist eine separate, später zu entscheidende Frage (müsste die `isVisibleFacetCategory`-Garantie respektieren).

## Acceptance

The session is done when:

- [ ] Ein **automatisierter CC-Direct-Batch-Driver** existiert (ein Maintainer-Befehl, Vorbild `run-ssot-loop.sh` / `ingest:podcast:tag`): harte Batch-Größe, frische `claude -p`-Subsession pro Batch (auto close/reopen, **kein manuelles `/clear`**), validiertes sequenzielles/atomares Merge in den Vorschlags-Output, **resumebar** (überspringt bereits reviewte Buch-IDs), **null metered API**.
- [ ] Es gibt **Konventions-Docs** (committet, je Dimension Factions/Junctions/Facets) und einen maschinenlesbaren **Finding-Contract**, gegen den der Driver jedes Batch-JSON validiert.
- [ ] **Zwei-Stufen-Topologie umgesetzt:** Finder produziert Roh-Findings; eine **unabhängige Verifier-Subsession** bestätigt/widerlegt jedes faktische Finding; nur bestätigte landen im Output, widerlegte werden mit Begründung aussortiert.
- [ ] **Pilot-Lauf über ~30–50 Bücher** ist gefahren; der Report nennt die Auswahl, die Batch-Anzahl, den Token-Rahmen pro Subsession (Beleg < ~120k) und eine **Findings-Tabelle** (roh / bestätigt / widerlegt je Dimension, Muster 144).
- [ ] **Faction-/Junction-Findings** liegen 149-konform als Vorschläge in `reviewQueue` (bzw. einem mechanisch dorthin mündenden Sidecar) — **committed, nie `final`, nie appliziert, keine DB-Mutation**. Ein `apply:curation-overlay -- --dry-run` über das Ergebnis bleibt grün und appliziert **nichts** aus `reviewQueue` (Beleg im Report).
- [ ] **Facet-Findings** liegen in einer **separaten, reinen Vorschlags-Datei ohne Apply-Pfad**; der `curation-overlay`-Validator und seine Stray-`facets`-Key-Ablehnung sind **unverändert** (Diff = 0). Beleg im Report, dass kein Pfad diese Datei in einen DB-Write/`db:rebuild` einhängt.
- [ ] **Read-only-Eingang** dokumentiert (Quelle des „aktuellen Buch-Zustands", reproduzierbar, ohne Mutation).
- [ ] `npm run lint` + `tsc --noEmit` + bestehende Tests grün. **Keine** Prod-DB-Mutation. Diff an `curation-overlay`-Apply/Validator, `resolve.ts`, `db:rebuild` = 0.

## Open questions (im Report beantworten)

- Quelle des „aktuellen Buch-Zustands": read-only Projektion der committeten kanonischen Daten vs. read-only Prod-Snapshot (`consolidation-db-snapshot.ts`)? Was ist reproduzierbarer/billiger? Begründung.
- Reicht für die Faction-Additionen die bestehende `resolve*`-Alias-Auflösung, oder gibt es Buch-Review-Fälle, in denen der Finder eine kanonische ID nennen müsste, die der Alias-Index nicht trifft? (Falls ja: wie behandelt — als „unresolved"-Vorschlag in der Queue?)
- Granularität der Verifikation: ein Verifier-Batch pro Finder-Batch (Muster 144: Batch-Verifier) vs. ein Verifier pro Einzel-Finding? Was hält Kontext klein **und** die Unabhängigkeit sauber?
- Schätzung aus dem Piloten: Roh-Findings/Buch und bestätigte/Buch — hochgerechnet auf 889, wie groß wird die `reviewQueue`, und ist die Promotion (Hand/Codex) bei der Größe noch handhabbar, oder braucht der Voll-Lauf eine Priorisierung (z. B. nur Confidence ≥ x, nur Suppressions zuerst)?

## Notes

- **Strang:** Batches (`chrono-lexicanum-batches`) → Branch `codex/ingest-batches-book-reviewer` o. ä.; Code → PR. Dieser Brief ist doc-only → liegt direkt auf `main`.
- **Kein UI-Anteil** — daher kein „Design freedom"-Abschnitt; reine Daten-/Pipeline-Arbeit.
- Die zwei strukturellen Grenzen aus § Context (Junctions = nur Locations+Characters; keine Facets im Overlay) sind **Architektur, nicht Verhandlungssache** — sie schützen die 149/150-Content-Warning-Garantie. Wenn ein Facet-Apply-Pfad je gewünscht wird, ist das ein eigener Brief, der `isVisibleFacetCategory` respektieren muss.
- **ADR-Notiz (Koordinations-Pass):** Cowork faltet nach dem Report einen kurzen ADR oder log-Eintrag, der die B11-Topologie (CC-Direct Finder+Verifier → reviewQueue; Facets separat read-only) festhält. `brain/**` + `sessions/README.md` sind coordination-only → CC trägt substanzielle Fakten in den **Impl-Report**, Cowork backfillt.
- Reihenfolge im Backlog: B11 vor **B12 (Ask-Tuning)** — die bestätigten Findings sind genau die Datenqualitäts-Basis, gegen die B12 später die `recommend()`-Gewichte tunen soll.
