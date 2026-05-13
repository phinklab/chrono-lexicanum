---
title: Open questions (next-brief queue)
type: overview
created: 2026-05-09
updated: 2026-05-13
sources:
  - ../../sessions/archive/2026-05/2026-05-08-047-impl-pipeline-hardening.md
  - ../../sessions/archive/2026-05/2026-05-05-045-impl-cc-vs-pipeline-comparison.md
  - ../../sessions/archive/2026-05/2026-05-05-044-impl-phase3e-batch-1.md
  - ../../sessions/archive/2026-05/2026-05-04-042-impl-phase3c-haiku-switch.md
  - ../../sessions/archive/2026-05/2026-05-09-054-arch-pipeline-v2-pilot.md
  - ../../sessions/archive/2026-05/2026-05-09-054-impl-pipeline-v2-pilot.md
  - ../../sessions/archive/2026-05/2026-05-09-055-arch-v2-voll-lauf-decision-gate.md
  - ../../sessions/archive/2026-05/2026-05-09-055-impl-v2-voll-lauf-decision-gate.md
  - ../../sessions/archive/2026-05/2026-05-10-056-arch-v2-pre-roster-fixes.md
  - ../../sessions/archive/2026-05/2026-05-10-056-impl-v2-pre-roster-fixes.md
  - ../../sessions/archive/2026-05/2026-05-10-057-arch-excel-roster-import.md
  - ../../sessions/archive/2026-05/2026-05-10-057-impl-excel-ssot-import.md
  - ../../sessions/2026-05-11-061-arch-ssot-loop.md
  - ../../sessions/2026-05-12-063-arch-resolver-50-books.md
  - ../../sessions/2026-05-12-063-impl-resolver-50-books.md
  - ../../sessions/2026-05-12-067-impl-resolver-apply-readiness.md
  - ../../sessions/2026-05-12-069-impl-resolver-apply-evidence.md
  - ../../sessions/2026-05-13-070-arch-faction-policy-hygiene.md
  - ../../sessions/2026-05-13-070-impl-faction-policy-hygiene.md
  - ../raw/reviews/2026-05-09-codex-v2-pilot-review.md
related:
  - ./project-state.md
  - ./pipeline-state.md
  - ./deferred-questions.md
  - ./decisions/why-haiku-not-sonnet.md
  - ./decisions/why-excel-ssot-not-crawl.md
  - ./decisions/faction-policy.md
confidence: high
---

# Open questions

> Items the **next** architect brief MUST address. The queue is intentionally small (3–5 items). Cowork prunes here when an item lands in a brief or is otherwise resolved. Dormant / distant items live in [`./deferred-questions.md`](./deferred-questions.md). Phase-internal backlog (3d / 3e / 3f reminders) lives in [`./pipeline-state.md`](./pipeline-state.md).
>
> **Migration history (kompakt):** Initial 9-Item-Carry-over migrated 049-Reset → 11 items; 051 Slim Pass split actionable / deferred / sub-phase. Post-054 verschob Anthologie-Re-Test + Body-Lore-Walker nach `deferred-questions.md` und ersetzte sie durch OQ4 (Junction-Resolver) + OQ5 (Unresolved-Queue). Excel-SSOT-Pivot (2026-05-10, Brief 057): OQ7 (Master-Liste-Crawl-Build) + OQ8 (Roster-Index-Selektor) erledigt. Post-069 (2026-05-12): OQ4 + OQ5 **für die ersten 50 W40K-Bücher geschlossen** durch Resolver-Sidecar-JSONs, canonical Reference-Extensions, `raw_name`-Audit-Spalten, `db:seed-resolver-extensions` und Re-Apply `ssot-w40k-001..005`. Universe-Year-Walker bleibt in `deferred-questions.md` (Maintainer-Direktive: erstmal hinten anstellen). Post-070 (2026-05-13): Faction-Policy & Hierarchie-Hygiene gelandet (Browse-Root vs. Tree-Root, `factions.json` Audit-Pass mit Chaos-Rename + 14 Reparents, `seed-resolver-extensions`-Faction-Insert auf Upsert geliftet, neue `brain:lint`-Kategorie); keine OQ-Verschiebung — parallel zu OQ1/2/3/6 gelaufen. UI-Rollup-Vorarbeit ist explizit als Future-Brief markiert (Trigger: ≥100 Bücher resolved + UI-Polish-Phase aktiv).

Format per item: **(N) <Title>** with `Owner: …` (who has to act) · `Sessions: …` (raw sources) · `Follow-up brief: …` (if known).

---

## (1) Phase-3e Modell-Entscheidung — Haiku bleiben vs. Sonnet-Upgrade

**Owner:** Cowork (architect decision, then CC implements). **Sessions:** [045-arch](../../sessions/archive/2026-05/2026-05-05-045-arch-cc-vs-pipeline-comparison.md), [045-impl](../../sessions/archive/2026-05/2026-05-05-045-impl-cc-vs-pipeline-comparison.md), [047-impl](../../sessions/archive/2026-05/2026-05-08-047-impl-pipeline-hardening.md), [054-impl](../../sessions/archive/2026-05/2026-05-09-054-impl-pipeline-v2-pilot.md), [055-impl](../../sessions/archive/2026-05/2026-05-09-055-impl-v2-voll-lauf-decision-gate.md). **Follow-up brief:** verschoben in den 10er-Batch-Zeitraum — Vokabular-Erweiterung (item 2) ist eher Treiber als Modell-Entscheidung; Haiku-Cost ist post-055 nicht mehr streitig.

Trade-off-Tabelle aus 045: Sonnet-Pipeline löst `dual` vs `imperium` (mark-of-calth-Tagging-Failure), gibt nuancierteres Plausibility-Reasoning, löst Vokabular-Drift `vengeance` semantisch. Cost ~3× Haiku. **Post-055-Update:** Web-Search-Disziplin-Härtung in 055 hat das Cost-Bild noch deutlicher verschoben — 1.06 Web-Searches/Buch (vs. Pilot 1.6) bei $0.0199/Buch fresh-Run-Cost (5-Book-Smoke; im Voll-Lauf-Diff war alles Cache-Hit, daher $0). Hochrechnung 750-Bücher-V2-Voll-Lauf ≈ **$15** auf der gemessenen Pace — vs. Sonnet hochgerechnet ~$45–60. Cost-Argument für Haiku ist erdrückend; Modell-Frage rutscht in der Priorität ab. Realistisch wird sie erst wieder relevant, wenn die 10er-Batch-Reihe Qualitäts-Pathologien zeigt, die Sonnet semantisch besser löst.

## (2) Vokabular-Erweiterung — `duty` + Faction-Dimension `legion` + `chaos`-pov_side-Pattern

**Owner:** Cowork (architect call) → CC (schema + seed + LLM prompt). **Sessions:** [044-impl](../../sessions/archive/2026-05/2026-05-05-044-impl-phase3e-batch-1.md), [045-impl](../../sessions/archive/2026-05/2026-05-05-045-impl-cc-vs-pipeline-comparison.md). **Follow-up brief:** likely bundled with item (1).

Drei separate Erkenntnisse:
- (a) `duty` ist 3-Modelle-Konsens echte Lücke (kein existierender Tag deckt die "selbstlose unpersönliche Pflicht/Stoik"-Semantik). Promotion-Kandidat zur facet_value.
- (b) `legion` als neue multi-value-Faceten-Dimension (`ultramarines`, `word_bearers`, `iron_hands`, `salamanders`, …) ODER `protagonist_class`-Erweiterung mit `heretic_astartes` + `loyalist_astartes`. Beide Optionen sind Designthema. **Querverbindung post-054:** mit V2's Junction-Resolver (item 4) wird die `legion`-Dimension teilweise redundant, weil `work_factions` bereits Legion-Granularität trägt. Vor (1)+(2) muss geklärt sein, ob `legion`-Faceten zusätzlich zur Junction nötig sind oder durch sie ersetzt werden.
- (c) `chaos`-pov_side wird auch von Sonnet nicht für `mark-of-calth` gesetzt (Word Bearers + Daemonic in Synopsis, aber kein chaos-Tag) — Modell-übergreifender Blind-Spot. Wahrscheinlich Prompt-Härtung statt Vokabular-Erweiterung.

Plus: `value_outside_vocabulary` über 70 Bücher kumulativ (042 + 044): `duty` × 5 (`praetorian-of-dorn`, `the-master-of-mankind`, `wolfsbane`, `saturnine`, `blood-of-the-emperor`), `vengeance` × 1 (`shattered-legions`), `fate` × 1 (`ruinstorm`). `duty` ist klarer Promotion-Kandidat; die anderen brauchen mehr Datenpunkte.

## (3) Hand-Check-Workflow-Brief nach Architektur-Klärung

**Owner:** Cowork. **Sessions:** [040-arch](../../sessions/archive/2026-05/2026-05-04-040-arch-phase3c-haiku-switch.md), [054-impl](../../sessions/archive/2026-05/2026-05-09-054-impl-pipeline-v2-pilot.md). **Follow-up brief:** post-Modell-Entscheidung, pre-3d-Apply.

Sequenz post-054: V2-Voll-Lauf (055) → Resolver + Unresolved-Queue (056, items 4+5) → Modell-Entscheidung + Vokabular (items 1+2) → **Hand-Check + Override-Schema** → 3d-Apply-Step (057). **Post-054-Update:** V2 hat `BookV2Record.fields.<f>.override` als Hand-Override-Slot bereits eingebaut; Hand-Check-Brief muss „nur" das CSV-/Markdown-Override-Format definieren und die Triage-Disziplin für Cowork (welcher Validation-Severity rolls auto, welcher braucht Cowork-Augen, welcher ignored). V1's `llm_flags` fallen unter V2 weg, ersetzt durch `Validation[]`.

## (4) ~~Junction-Resolver für 3d-Apply~~ — closed by 063–069

Resolver für die ersten 50 W40K-Bücher ist gelandet und applied. Brief 063 entschied die Hybrid-Top-N-Richtung praktisch aus: checked-in Reference-Erweiterungen (`factions.json`, `locations.json`, neues `characters.json`), Alias-JSONs, Resolver-Modul, `raw_name`-Audit-Spalten und `work_characters`-Apply-Pfad. 065–067 härteten Alignment, Fresh-Seed, Role-Normalisierung, Coverage-Smoke und Runbook; 069 führte Migration/Seed/Re-Apply gegen die DB aus und dokumentierte die Counts. Future work ist keine offene OQ4-Architekturfrage mehr, sondern laufende Resolver-Pflege pro 50er-Schwelle und ggf. HH-spezifischer Resolver, wenn der Loop die HH-Domain erreicht.

## (5) ~~Unresolved-Queue-Strategie für unbekannte Entitäten~~ — closed by 063–069

Für die 50-Buch-Authority-Schicht wurde keine `unresolved_entities`-Staging-Tabelle gebaut. Stattdessen gilt für diesen Modus: Cowork kuratiert häufige Surface-Forms direkt in Sidecar-JSONs, Long-Tail bleibt im `book_details.notes`-Surface-Forms-Block, und Coverage-Tests (`test:resolver-coverage`, `test:apply-override-dry`) machen die Rest-Lücken sichtbar. Eine echte Staging-Tabelle bleibt eine distant/future Option, falls später ein autonomer Crawler-Apply ohne Maintainer-Override-Loop wieder relevant wird.

## (6) Hardcover-Rating-Promotion + Open-Library-Fallback-Decision

**Owner:** Cowork (architectural call: Field-Slot + OL-Fallback ja/nein) → CC (Implementation, ~10–20 LOC). **Sessions:** [054-arch](../../sessions/archive/2026-05/2026-05-09-054-arch-pipeline-v2-pilot.md), [054-impl](../../sessions/archive/2026-05/2026-05-09-054-impl-pipeline-v2-pilot.md) (Slim-LLM-Entscheidung, Rating raus aus `PUBLISH_ENRICHMENT_TOOL`), Cowork-Maintainer-Diskussion 2026-05-09 (rogue, kein eigener Session-Log). **Follow-up brief:** post-055-Verifikation, entweder schlanker 055.5-Brief oder gebündelt mit Brief 056.

V2 hat `rating` aus `PUBLISH_ENRICHMENT_TOOL.input_schema.properties` rausgenommen, weil der LLM via Web-Search keinen verlässlichen Rating-Wert produziert (Slim-Prompt-Disziplin in 054). Gleichzeitig liefert Hardcover-GraphQL den Wert deterministisch und kostenlos, und V2's `discoverHardcoverClaimV2` schreibt ihn bereits in `claim.raw.audit.averageRating` (siehe `src/lib/ingestion/v2/sources/hardcover.ts` Zeile 32–40 + 117–123). Die Architektur-Lücke ist nur, dass der Wert nicht aus dem Audit-Slot in einen echten `BookV2Record.fields.rating: FieldRecord<number>` promoted wird — also nicht renderable, nicht in der Detail-Page sichtbar, nicht im Resolver-Datensatz mit drin.

Goodreads als Quelle fällt aus: Goodreads-API ist seit Ende 2020 abgekündigt, kein neuer Developer-Key-Pfad. Hardcover ist die nahste Substitution mit überlappender 40K-Demographie (post-2020 Goodreads-Refugee-Community, Series-Reader-Fokus) und besserer Sample-Size pro Titel als Open Library. OL hat zwar das größere Bibliotheks-Backbone, aber pro 40K-Titel oft 0–5 Bewertungen, was statistisch Rauschen ist.

Drei Architektur-Entscheidungen für den Brief:

- (a) **Field-Schema.** `rating: FieldRecord<number>` (0–5 mit Decimals) auf `BookV2Record.fields`. Plus optional `ratingCount: FieldRecord<number>` für Audit-Transparenz (Hardcover-GraphQL hat das nicht direkt, OL hat `ratings_count`). Cowork-Call ob ein- oder zwei-Felder.
- (b) **OL als Fallback ja/nein** — entscheidet sich nach 055-Voll-Lauf empirisch. Wenn Hardcover ≥90% der 100 Bücher trifft, ist OL-Fallback Overhead; wenn <70%, lohnt sich der zusätzliche REST-Call. OL-Endpoint: `https://openlibrary.org/works/{olid}/ratings.json` (`summary.average` + `summary.count`), kein Auth, eine Anfrage pro Buch.
- (c) **Retroactive-Strategie.** Der 055-Voll-Lauf-Diff enthält `audit.averageRating` für jedes erfolgreiche Hardcover-Match bereits. Ein simpler Promote-Pass kann den committed Diff retroaktiv um das `fields.rating` erweitern, ohne neuen V2-Lauf — alternativ ein Source-only-Re-Crawl (Hardcover + ggf. OL, kein LLM, ~Cents). Wahl der Strategie ist Aufwands-/Reproduzierbarkeits-Trade-off.

Out of scope für diesen Eintrag: Universe-Year-Walker (parallel diskutiert, in `deferred-questions.md` geparkt), `availability` (war Slim-LLM-Drop genau wie Rating, hat aber keine vergleichbare deterministische API-Quelle und bleibt offen).

## (7) ~~Master-Liste-Erstellung~~ — closed by 057-impl

Excel-SSOT (`scripts/seed-data/source/Warhammer_Books_SSOT.xlsx`, 859 Bücher + 191 Collection-Beziehungen) ist gelandet; Loader (`scripts/import-ssot-roster.ts`) produziert deterministisch `scripts/seed-data/book-roster.json` (SHA256-verifiziert byte-identisch über Re-Runs). ADR: [`./decisions/why-excel-ssot-not-crawl.md`](./decisions/why-excel-ssot-not-crawl.md). Coverage-Maintenance bleibt extern (Maintainer-Workflow mit LLM-Assistenz).

## (8) ~~V2-Batch-Auswahl auf Roster-Index~~ — verschoben in Brief 058 (queued)

Brief 058 (V2-Pipeline-Refactor) übernimmt: SSOT-Modus in `run-batch.ts`, Discovery-Stage 0 ab, Stage-1-Validators trimmen (year_outlier raus, author_editor_suspicion raus oder umbauen), Stage-3-LLM-Tool-Schema schrumpfen (Author/Year/Format/Title raus), erster 10er-Batch als committed Diff. Die OQ-Form ("Roster-Index-Selektor") ist durch die SSOT-Form ersetzt — Pipeline liest direkt aus `book-roster.json[offset:offset+limit]`.
