---
title: Open questions (next-brief queue)
type: overview
created: 2026-05-09
updated: 2026-05-15
# 2026-05-15 (Brief 075): OQ6 in Brief 075 (Cockpit-Refinement + Hardcover-Rating) gefaltet — Track-B-Architektur-Calls in 075 fixiert (Hardcover-only, kein OL-Fallback, Standalone-Backfill-Script). Eintrag bleibt als strikethrough-Anker bis 075-impl gemerged ist; dann gepruned. Track-B-Sicherheitsventil: bei Unsicherheit darf CC OQ6 als saubere Folge-OQ neu öffnen statt zu zwingen.
# 2026-05-15 (Wiki-Hygiene-Pass post-074-impl): OQ1 (Phase-3e Modell) und OQ2-(c) (chaos-pov_side) beide endgültig moot post-CC-Direct-Curation; ADR decisions/why-cc-direct-curation.md geschrieben. OQ2-(c) wandert nach deferred-questions.md mit Promote-Trigger. Brief 074 + 074-impl als shipped markiert; Recently-shipped-Pointer zeigt jetzt auf project-state.md.
# 2026-05-15 (Brief 074): OQ9 fully closed (073-impl complete). OQ2-(c) chaos-pov_side reclassified as moot post-CC-Direct-Curation pipeline-shift — wandert in deferred-questions.md.
# 2026-05-14 (Brief 073): OQ9 folded into Brief 073 (Maintainer-Audit-Cockpit) and pruned.
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
  - ../../sessions/archive/2026-05/2026-05-12-063-arch-resolver-50-books.md
  - ../../sessions/archive/2026-05/2026-05-12-063-impl-resolver-50-books.md
  - ../../sessions/archive/2026-05/2026-05-12-067-impl-resolver-apply-readiness.md
  - ../../sessions/archive/2026-05/2026-05-12-069-impl-resolver-apply-evidence.md
  - ../../sessions/2026-05-13-070-arch-faction-policy-hygiene.md
  - ../../sessions/2026-05-13-070-impl-faction-policy-hygiene.md
  - ../../sessions/2026-05-14-072-arch-resolver-batch-2.md
  - ../../sessions/2026-05-14-072-impl-resolver-batch-2.md
  - ../../sessions/2026-05-15-074-arch-resolver-batch-3.md
  - ../../sessions/2026-05-15-074-impl-resolver-batch-3.md
  - ../raw/reviews/2026-05-09-codex-v2-pilot-review.md
related:
  - ./project-state.md
  - ./pipeline-state.md
  - ./deferred-questions.md
  - ./decisions/why-sonnet-not-haiku.md
  - ./decisions/why-cc-direct-curation.md
  - ./decisions/why-excel-ssot-not-crawl.md
  - ./decisions/faction-policy.md
confidence: high
---

# Open questions

> Items the **next** architect brief MUST address. The queue is intentionally small (3–5 items). Cowork prunes here when an item lands in a brief or is otherwise resolved. Dormant / distant items live in [`./deferred-questions.md`](./deferred-questions.md). Phase-internal backlog (3d / 3e / 3f reminders) lives in [`./pipeline-state.md`](./pipeline-state.md).
>
> **Migration history (kompakt):** Initial 9-Item-Carry-over migrated 049-Reset → 11 items; 051 Slim Pass split actionable / deferred / sub-phase. Post-054 verschob Anthologie-Re-Test + Body-Lore-Walker nach `deferred-questions.md` und ersetzte sie durch OQ4 (Junction-Resolver) + OQ5 (Unresolved-Queue). Excel-SSOT-Pivot (2026-05-10, Brief 057): OQ7 (Master-Liste-Crawl-Build) + OQ8 (Roster-Index-Selektor) erledigt. Post-069 (2026-05-12): OQ4 + OQ5 **für die ersten 50 W40K-Bücher geschlossen**. Universe-Year-Walker bleibt in `deferred-questions.md`. Post-070 (2026-05-13): Faction-Policy & Hierarchie-Hygiene gelandet, keine OQ-Verschiebung. Cowork-Maintainer-Diskussion 2026-05-13: **OQ1 geschlossen pro Sonnet** (ADR-Slug `why-sonnet-not-haiku.md`), **OQ2 auf (c) Prompt-Härtung reduziert**, **OQ9 Maintainer-Cockpit eingeführt**. Post-072 (2026-05-14): **OQ2-(b) geschlossen** (Mid-Knoten `heretic_astartes` existiert), **OQ9 scharfgeschaltet**. Brief 073 (2026-05-14): **OQ9 in Brief gefaltet** und geschlossen durch 073-impl. **Wiki-Hygiene-Pass 2026-05-15 (post-074-impl):** ADR [`./decisions/why-cc-direct-curation.md`](./decisions/why-cc-direct-curation.md) geschrieben. Damit ist **OQ1 endgültig superseded** — die Pipeline-Enrichment-Stage läuft nicht mehr als Default, Sonnet-vs-Haiku ist eine theoretische Wahl für eine ausgemusterte Code-Pfad-Etappe. **OQ2-(c) ist moot post-Pipeline-Shift** und wandert nach `deferred-questions.md` mit Promote-Trigger (Cockpit-Drift-Cluster oder V2-LLM-Reaktivierung). Brief 074 (Resolver-Pass 3) ist durch (PR #57); Junction-Counts `work_factions=912`, `work_locations=287`, `work_characters=522`, `work_collections=35` über 150 applied W40K-Bücher. Watson-Trilogy als historical-canon-layer behandelt (`hydra_cabal`-Knoten, Squats-`tone`-Update, retinue-`notes`-Marker). Green Tide bleibt Buch-Scope, neuer `scripts/seed-data/collection-gaps.json`-Ledger.

Format per item: **(N) <Title>** with `Owner: …` (who has to act) · `Sessions: …` (raw sources) · `Follow-up brief: …` (if known).

---

## (1) ~~Phase-3e Modell-Entscheidung~~ — closed 2026-05-13 (Sonnet) und superseded 2026-05-15 (CC-Direct-Curation)

Cowork-Maintainer-Diskussion 2026-05-13 entschied pro Sonnet (current major) statt Haiku 4.5 für die Pipeline-Enrichment-Stage (ADR [`./decisions/why-sonnet-not-haiku.md`](./decisions/why-sonnet-not-haiku.md)). **Wiki-Hygiene-Pass 2026-05-15:** Die Pipeline-Enrichment-Stage läuft seit Brief 061 (Standing-Loop) nicht mehr als Default-Pfad — eine `claude -p`-Subsession produziert die Override-Datei direkt, ohne die V2-LLM-Stage zu durchlaufen. Damit ist die Sonnet-vs-Haiku-Entscheidung eine theoretische Wahl für eine ausgemusterte Code-Pfad-Etappe. Der `why-sonnet-not-haiku`-ADR bleibt als historisches Artefakt + Promote-Trigger (falls die V2-LLM-Stage je reaktiviert wird, ist Sonnet die Default-Wahl); die operative Wahrheit lebt in [`./decisions/why-cc-direct-curation.md`](./decisions/why-cc-direct-curation.md).

## (2) ~~Vokabular-Erweiterung~~ — closed/moot 2026-05-15 (alle drei Teile abgeräumt)

OQ2-(a) Tag-Promotion: in Cockpit-Triage geschoben (kein einmaliger Architektur-Brief, laufende Maintainer-Arbeit). OQ2-(b) `legion`-/`heretic_astartes`-Dimension: durch Brief 072 in der DB-Hierarchie geschlossen (`heretic_astartes`-Mid-Knoten unter `chaos` + Reparents). OQ2-(c) `chaos`-pov_side-Prompt-Härtung: moot post-CC-Direct-Curation, wandert in [`./deferred-questions.md`](./deferred-questions.md) mit Promote-Trigger (Cockpit-Drift-Cluster ≥5 Bücher oder V2-LLM-Reaktivierung). Historische Detail-Form steht weiter unten in OQ2-historic; der Eintrag bleibt im Open-Set als geschlossen-markierter Anker, damit die Story-Continuity gegenüber Brief 074-Erratum und Cockpit-Triage-Material lesbar bleibt.

## (2-historic) Vokabular-Erweiterung — auf Prompt-Härtung geschrumpft (post-2026-05-13)

**Owner:** Cowork (Brief-Skizze) → CC (Prompt-Patch + retroaktiver Re-Apply-Pass). **Sessions:** [044-impl](../../sessions/archive/2026-05/2026-05-05-044-impl-phase3e-batch-1.md), [045-impl](../../sessions/archive/2026-05/2026-05-05-045-impl-cc-vs-pipeline-comparison.md), Cowork-Maintainer-Diskussion 2026-05-13. **Follow-up brief:** wahrscheinlich gebündelt mit Resolver-Apply-Brief für `ssot-w40k-007..010` (Brief 072).

Ursprünglicher Drei-Teiler ist nach 2026-05-13-Diskussion auf einen Teil reduziert:

- **(a) `duty`-/Heroic-Tag-Promotion** → wandert in den Cockpit-Brief (siehe (9)). Begründung: Maintainer-Punkt 2026-05-13 ist scharf — `loyalty` ist heute ubiquitär (in ~80% der Bücher) und damit als Filter wertlos. Statt jetzt einen Tag-Namen abstrakt zu wählen (`duty`/`grim_resolve`/`heroic_sacrifice`/...), entsteht die Tag-Triage am Cockpit-Datensatz: welche Tags sind ubiquitär (splitten oder kicken), welche Themen-Cluster fehlen (z. B. die 5 Belegbücher Praetorian of Dorn / Master of Mankind / Wolfsbane / Saturnine / Blood of the Emperor). Tag-Hygiene als laufende Maintainer-Arbeit, nicht als einmaliger Architektur-Brief.

- **(b) `legion`-Dimension bzw. `protagonist_class`-Erweiterung mit `heretic_astartes`/`loyalist_astartes`** → **explizit nicht implementiert** als Vokabular-Dimension. Maintainer-Punkt 2026-05-13: Reader-Filter-Bedarf ist „mehr Death Guard / Word Bearers / etc." (Sub-Faction-Granularität), nicht „Loyalist vs. Heretic" (Klassen-Abstraktion). Das `work_factions`-Junction-Schema trägt diese Granularität bereits — fehlt nur die UI-Exposure als hierarchischer Faction-Filter. Wandert in den Cockpit-Brief als `/buecher`-Filter-Anforderung. **Status post-2026-05-14: Brief 072 hat den `heretic_astartes`-Mid-Knoten unter `chaos` gepflanzt, 7 Heresy-Traitor-Legionen + optional Alpha Legion reparented, Death-Guard / Emperor's-Children / Black Legion / Crimson Slaughter / Violators / Fabius Bile's Coterie / Unfleshed als Mid-Knoten-Kinder angelegt. `faction-policy.json` trägt `heretic_astartes` als Browse-Root. OQ2-(b) damit auf der Daten-Seite geschlossen.** Das UI-Rollup-Filter-Stück (recursive parentId-Walk in `/buecher`) bleibt offen und wandert in das Cockpit-Brief (OQ9).

- **(c) `chaos`-pov_side-Blind-Spot bei Traitor-Legionen** → bleibt als einziger eigentlicher OQ2-Inhalt. System-Prompt-Patch („Word Bearers, Iron Warriors, Death Guard, Thousand Sons, Emperor's Children, World Eaters, Night Lords, Alpha Legion = chaos pov_side, auch ohne wörtliches ‚Chaos' in der Synopsis") plus retroaktiver Promote-Pass, der `chaos` als pov_side setzt wenn `work_factions` eine der Traitor-Legionen enthält (ein paar Zeilen SQL). Cost minimal, gebündelt mit Brief 072.

Plus: `value_outside_vocabulary`-Historie über 70 Bücher kumulativ (042 + 044) bleibt als Datenpunkt für die Cockpit-Triage stehen: `duty` × 5 (`praetorian-of-dorn`, `the-master-of-mankind`, `wolfsbane`, `saturnine`, `blood-of-the-emperor`), `vengeance` × 1 (`shattered-legions`), `fate` × 1 (`ruinstorm`).

## (3) Hand-Check-Workflow-Brief nach Architektur-Klärung

**Owner:** Cowork. **Sessions:** [040-arch](../../sessions/archive/2026-05/2026-05-04-040-arch-phase3c-haiku-switch.md), [054-impl](../../sessions/archive/2026-05/2026-05-09-054-impl-pipeline-v2-pilot.md). **Follow-up brief:** post-Modell-Entscheidung, pre-3d-Apply.

Sequenz post-054: V2-Voll-Lauf (055) → Resolver + Unresolved-Queue (056, items 4+5) → Modell-Entscheidung + Vokabular (items 1+2) → **Hand-Check + Override-Schema** → 3d-Apply-Step (057). **Post-054-Update:** V2 hat `BookV2Record.fields.<f>.override` als Hand-Override-Slot bereits eingebaut; Hand-Check-Brief muss „nur" das CSV-/Markdown-Override-Format definieren und die Triage-Disziplin für Cowork (welcher Validation-Severity rolls auto, welcher braucht Cowork-Augen, welcher ignored). V1's `llm_flags` fallen unter V2 weg, ersetzt durch `Validation[]`.

## (4) ~~Junction-Resolver für 3d-Apply~~ — closed by 063–069

Resolver für die ersten 50 W40K-Bücher ist gelandet und applied. Brief 063 entschied die Hybrid-Top-N-Richtung praktisch aus: checked-in Reference-Erweiterungen (`factions.json`, `locations.json`, neues `characters.json`), Alias-JSONs, Resolver-Modul, `raw_name`-Audit-Spalten und `work_characters`-Apply-Pfad. 065–067 härteten Alignment, Fresh-Seed, Role-Normalisierung, Coverage-Smoke und Runbook; 069 führte Migration/Seed/Re-Apply gegen die DB aus und dokumentierte die Counts. Future work ist keine offene OQ4-Architekturfrage mehr, sondern laufende Resolver-Pflege pro 50er-Schwelle und ggf. HH-spezifischer Resolver, wenn der Loop die HH-Domain erreicht.

## (5) ~~Unresolved-Queue-Strategie für unbekannte Entitäten~~ — closed by 063–069

Für die 50-Buch-Authority-Schicht wurde keine `unresolved_entities`-Staging-Tabelle gebaut. Stattdessen gilt für diesen Modus: Cowork kuratiert häufige Surface-Forms direkt in Sidecar-JSONs, Long-Tail bleibt im `book_details.notes`-Surface-Forms-Block, und Coverage-Tests (`test:resolver-coverage`, `test:apply-override-dry`) machen die Rest-Lücken sichtbar. Eine echte Staging-Tabelle bleibt eine distant/future Option, falls später ein autonomer Crawler-Apply ohne Maintainer-Override-Loop wieder relevant wird.

## (6) ~~Hardcover-Rating-Promotion + Open-Library-Fallback-Decision~~ — folded into Brief 075 (2026-05-15)

Brief 075 (`sessions/2026-05-15-075-arch-cockpit-drift-sort-and-rating.md`) fixiert die drei Architektur-Calls:
- (a) **Field-Schema:** `bookDetails.rating` / `ratingSource` / `ratingCount` (bestehende Spalten, keine Migration). Kein V2-`BookV2Record.fields.rating`-Slot — moot post-CC-Direct-Curation.
- (b) **OL-Fallback:** nicht in 075. Promote-Trigger: Hardcover-Hit-Rate < 70 % über die 150 W40K-Bücher → eigene Folge-OQ.
- (c) **Retroactive:** Standalone `scripts/backfill-hardcover-rating.ts` (idempotent default, `--force`-Flag). Kein `apply-override.ts`-Touch, kein V2-Pipeline-Touch.

**Sicherheitsventil:** Wenn Track B in 075-impl architektonisch unsicher wird (Hardcover-API-Schema, Hit-Rate, anderes), darf CC abbrechen — Track A landet trotzdem, und eine präzisere Folge-OQ wird in `For next session` spezifiziert. Eintrag bleibt als strikethrough-Anker bis 075-impl gemerged ist, dann gepruned (oder Folge-OQ ersetzt ihn).

## (6-historic) Hardcover-Rating-Promotion + Open-Library-Fallback-Decision

**Owner:** Cowork (architectural call: Field-Slot + OL-Fallback ja/nein) → CC (Implementation, ~10–20 LOC). **Sessions:** [054-arch](../../sessions/archive/2026-05/2026-05-09-054-arch-pipeline-v2-pilot.md), [054-impl](../../sessions/archive/2026-05/2026-05-09-054-impl-pipeline-v2-pilot.md) (Slim-LLM-Entscheidung, Rating raus aus `PUBLISH_ENRICHMENT_TOOL`), Cowork-Maintainer-Diskussion 2026-05-09 (rogue, kein eigener Session-Log). **Follow-up brief:** post-055-Verifikation, entweder schlanker 055.5-Brief oder gebündelt mit Brief 056.

V2 hat `rating` aus `PUBLISH_ENRICHMENT_TOOL.input_schema.properties` rausgenommen, weil der LLM via Web-Search keinen verlässlichen Rating-Wert produziert (Slim-Prompt-Disziplin in 054). Gleichzeitig liefert Hardcover-GraphQL den Wert deterministisch und kostenlos, und V2's `discoverHardcoverClaimV2` schreibt ihn bereits in `claim.raw.audit.averageRating` (siehe `src/lib/ingestion/v2/sources/hardcover.ts` Zeile 32–40 + 117–123). Die Architektur-Lücke ist nur, dass der Wert nicht aus dem Audit-Slot in einen echten `BookV2Record.fields.rating: FieldRecord<number>` promoted wird — also nicht renderable, nicht in der Detail-Page sichtbar, nicht im Resolver-Datensatz mit drin.

Goodreads als Quelle fällt aus: Goodreads-API ist seit Ende 2020 abgekündigt, kein neuer Developer-Key-Pfad. Hardcover ist die nahste Substitution mit überlappender 40K-Demographie (post-2020 Goodreads-Refugee-Community, Series-Reader-Fokus) und besserer Sample-Size pro Titel als Open Library. OL hat zwar das größere Bibliotheks-Backbone, aber pro 40K-Titel oft 0–5 Bewertungen, was statistisch Rauschen ist.

Drei Architektur-Entscheidungen für den Brief:

- (a) **Field-Schema.** `rating: FieldRecord<number>` (0–5 mit Decimals) auf `BookV2Record.fields`. Plus optional `ratingCount: FieldRecord<number>` für Audit-Transparenz (Hardcover-GraphQL hat das nicht direkt, OL hat `ratings_count`). Cowork-Call ob ein- oder zwei-Felder.
- (b) **OL als Fallback ja/nein** — entscheidet sich nach 055-Voll-Lauf empirisch. Wenn Hardcover ≥90% der 100 Bücher trifft, ist OL-Fallback Overhead; wenn <70%, lohnt sich der zusätzliche REST-Call. OL-Endpoint: `https://openlibrary.org/works/{olid}/ratings.json` (`summary.average` + `summary.count`), kein Auth, eine Anfrage pro Buch.
- (c) **Retroactive-Strategie.** Der 055-Voll-Lauf-Diff enthält `audit.averageRating` für jedes erfolgreiche Hardcover-Match bereits. Ein simpler Promote-Pass kann den committed Diff retroaktiv um das `fields.rating` erweitern, ohne neuen V2-Lauf — alternativ ein Source-only-Re-Crawl (Hardcover + ggf. OL, kein LLM, ~Cents). Wahl der Strategie ist Aufwands-/Reproduzierbarkeits-Trade-off.

Out of scope für diesen Eintrag: Universe-Year-Walker (parallel diskutiert, in `deferred-questions.md` geparkt), `availability` (war Slim-LLM-Drop genau wie Rating, hat aber keine vergleichbare deterministische API-Quelle und bleibt offen).

## (9) ~~Maintainer-Audit-Cockpit für Buch-Seiten~~ — folded into Brief 073 (2026-05-14)

Brief 073 (`sessions/2026-05-14-073-arch-maintainer-audit-cockpit.md`) bündelt OQ9 vollständig: Sub-Route `/buch/[slug]/audit` (Read-only, alle DB-Felder), Audit-Filter-Pillen auf `/buecher` (Drift / Junction-Lücke / SSOT / In mehreren Collections, AND-kombiniert), Default-Sort `updatedAt desc`, Audit-Route `noindex`, keine Schema-Migration. `confidence < 0.7`-Filter wurde bewusst nicht aufgenommen — wird scharf, wenn der Sonnet-Pipeline-Lauf wieder läuft (post-OQ2-(c)). Implementer-Report wird OQ9 abschließen.

## (7) ~~Master-Liste-Erstellung~~ — closed by 057-impl

Excel-SSOT (`scripts/seed-data/source/Warhammer_Books_SSOT.xlsx`, 859 Bücher + 191 Collection-Beziehungen) ist gelandet; Loader (`scripts/import-ssot-roster.ts`) produziert deterministisch `scripts/seed-data/book-roster.json` (SHA256-verifiziert byte-identisch über Re-Runs). ADR: [`./decisions/why-excel-ssot-not-crawl.md`](./decisions/why-excel-ssot-not-crawl.md). Coverage-Maintenance bleibt extern (Maintainer-Workflow mit LLM-Assistenz).

## (8) ~~V2-Batch-Auswahl auf Roster-Index~~ — verschoben in Brief 058 (queued)

Brief 058 (V2-Pipeline-Refactor) übernimmt: SSOT-Modus in `run-batch.ts`, Discovery-Stage 0 ab, Stage-1-Validators trimmen (year_outlier raus, author_editor_suspicion raus oder umbauen), Stage-3-LLM-Tool-Schema schrumpfen (Author/Year/Format/Title raus), erster 10er-Batch als committed Diff. Die OQ-Form ("Roster-Index-Selektor") ist durch die SSOT-Form ersetzt — Pipeline liest direkt aus `book-roster.json[offset:offset+limit]`.
