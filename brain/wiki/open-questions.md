---
title: Open questions (next-brief queue)
type: overview
created: 2026-05-09
updated: 2026-05-17
# 2026-05-17 (Wiki-Hygiene-Pass post-076-impl + post-077-impl): Brain-Update für die beiden zusammenhängenden Sessions. project-state.md auf 200 W40K-Bücher + post-077 `work_factions=1020 (−165)` gebracht. pipeline-state.md mit Skip-Logik + axis-sliced Resolver-Workflow + Driver-Deliverable + Resolver-Dossiers ergänzt. Keine OQ-Schließung diesseits der bereits-promoted OQ (11) Locations-Axis-Hygiene-Sister-Pass (077-Hand-off). Wartung am Header: OQ-Queue ist post-Hygiene 4 Items lang (OQ (3) Hand-Check-Workflow, OQ (10) Hardcover-Hit-Rate-Härtung, OQ (11) Locations-Sister, plus die geschlossenen Anker für Story-Continuity (1)/(2)/(4)/(5)/(6)/(7)/(8)/(9) bleiben in der Datei). Reihenfolge erwartet: Loop-Re-Trigger `ssot-w40k-021..025` (kein Brief) → Resolver-Pass-5-Brief bei 250er-Pause; sekundär OQ (11), OQ (10), Cockpit-Sub-Sortierung gebündelt oder einschiebbar.
# 2026-05-17 (Cowork-Review von 077-impl): Brief 077 (Grand-Alignment-Junction-Hygiene) reviewed und akzeptiert. Counts-Delta passt (`work_factions=1185 → 1020 (−165)`, imperium 81 → 6, chaos 133 → 43, andere Axes invariant). Skip-Logik korrekt im Apply-Layer (`scripts/apply-override-skip.ts` pure helper + DI), Alignment-Helper sauber extrahiert nach `src/lib/seed/alignment.ts` und in beiden Pfaden (apply-override + seed-resolver-extensions) konsistent benutzt. Erratum-3 (factions.json explizit `"alignment": "imperium"` UND Helper-Extract) belt-and-suspenders gelöst — defensive Wahl, akzeptiert mit Hinweis "war Option A in Constraints; CC hat Option A+B gewählt, kein Problem". Loop-Discipline in 061 + run-ssot-loop.sh Heredoc gelandet. ADR-Section in faction-policy.md inkl. Revisit-Trigger für Aeldari-Splits (Alignment-Equality → Parent-Chain) sauber notiert. Brief 077 + 077-impl bleiben in den Active-Threads bis 076 → 077 → Wiki-Hygiene-Pass durchgespielt sind. **Neue OQ (11) „Locations-Axis-Hygiene"** aus 077-impl For-next-session promoted (Imperium x20 als unresolved Location). Minor 077-impl-Items (CI-Smoke, Coverage-Two-Line-Output) sind operationelle Nice-to-haves, als Note an Cockpit-Refinements gehängt statt eigener OQ.
# 2026-05-16 (Wiki-Hygiene-Pass post-075-impl): OQ6 closed (Hardcover-Rating-Promotion durch Brief 075 gelandet, 77/150 W40K-Bücher mit `bookDetails.rating`). 51.3 % Hit-Rate hat den Promote-Trigger (< 70 %) ausgelöst — neue OQ (10) „Hardcover-Hit-Rate-Härtung (Titel-Normalisierung)" eingeführt, weil 075-impl-For-next-session-Punkt 1 argumentiert, dass die Miss-Profile (40× null_result_zero_hits + 19× author_mismatch) primär Titel-Normalisierungs-Probleme sind, nicht Coverage-Lücken. OL-Fallback bleibt als sekundärer Pfad in der Erwägung, aber Hit-Rate-Härtung schlägt ihn auf erwarteten Marginal-Value pro $-Aufwand. Drift-Sort-Sub-Sortierung innerhalb der freq=2-Tie-Group (075-impl-Punkt 3) als Note an den existierenden Cockpit-Refinement-Punkt angeheftet. Brief 075 + 075-impl ausgepruned; Recently-shipped-Pointer zeigt auf project-state.md.
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
  - ../../sessions/2026-05-15-075-arch-cockpit-drift-sort-and-rating.md
  - ../../sessions/2026-05-15-075-impl-cockpit-drift-sort-and-rating.md
  - ../../sessions/2026-05-16-076-arch-resolver-batch-4-axis-sliced.md
  - ../../sessions/2026-05-16-076-impl-resolver-batch-4-axis-sliced.md
  - ../../sessions/2026-05-16-077-arch-grand-alignment-junction-hygiene.md
  - ../../sessions/2026-05-16-077-impl-grand-alignment-junction-hygiene.md
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
> **Migration history (kompakt):** Initial 9-Item-Carry-over migrated 049-Reset → 11 items; 051 Slim Pass split actionable / deferred / sub-phase. Post-054 verschob Anthologie-Re-Test + Body-Lore-Walker nach `deferred-questions.md` und ersetzte sie durch OQ4 (Junction-Resolver) + OQ5 (Unresolved-Queue). Excel-SSOT-Pivot (2026-05-10, Brief 057): OQ7 (Master-Liste-Crawl-Build) + OQ8 (Roster-Index-Selektor) erledigt. Post-069 (2026-05-12): OQ4 + OQ5 **für die ersten 50 W40K-Bücher geschlossen**. Universe-Year-Walker bleibt in `deferred-questions.md`. Post-070 (2026-05-13): Faction-Policy & Hierarchie-Hygiene gelandet, keine OQ-Verschiebung. Cowork-Maintainer-Diskussion 2026-05-13: **OQ1 geschlossen pro Sonnet** (ADR-Slug `why-sonnet-not-haiku.md`), **OQ2 auf (c) Prompt-Härtung reduziert**, **OQ9 Maintainer-Cockpit eingeführt**. Post-072 (2026-05-14): **OQ2-(b) geschlossen** (Mid-Knoten `heretic_astartes` existiert), **OQ9 scharfgeschaltet**. Brief 073 (2026-05-14): **OQ9 in Brief gefaltet** und geschlossen durch 073-impl. **Wiki-Hygiene-Pass 2026-05-15 (post-074-impl):** ADR [`./decisions/why-cc-direct-curation.md`](./decisions/why-cc-direct-curation.md) geschrieben. Damit ist **OQ1 endgültig superseded** — die Pipeline-Enrichment-Stage läuft nicht mehr als Default, Sonnet-vs-Haiku ist eine theoretische Wahl für eine ausgemusterte Code-Pfad-Etappe. **OQ2-(c) ist moot post-Pipeline-Shift** und wandert nach `deferred-questions.md` mit Promote-Trigger (Cockpit-Drift-Cluster oder V2-LLM-Reaktivierung). Brief 074 (Resolver-Pass 3) ist durch (PR #57); Junction-Counts `work_factions=912`, `work_locations=287`, `work_characters=522`, `work_collections=35` über 150 applied W40K-Bücher. Watson-Trilogy als historical-canon-layer behandelt (`hydra_cabal`-Knoten, Squats-`tone`-Update, retinue-`notes`-Marker). Green Tide bleibt Buch-Scope, neuer `scripts/seed-data/collection-gaps.json`-Ledger. **Brief 075 (2026-05-15, post-075-impl gemerged):** Cockpit-Drift-Sort + slim „Auch enthalten in:"-Public-DetailPanel gelandet (Track A), Hardcover-Rating-Backfill via Standalone-Script gelandet (Track B); 77/150 W40K-Bücher mit `bookDetails.rating` (51.3 % Hit-Rate). **OQ6 geschlossen** (durch 075). Promote-Trigger gefeuert (Hit-Rate < 70 %): **neue OQ (10) „Hardcover-Hit-Rate-Härtung (Titel-Normalisierung)"** eingeführt — 075-impl-For-next-session-Punkt 1 argumentiert, dass die Miss-Profile (40× `null_result_zero_hits` Titel-`_eq`-Mismatch + 19× `author_mismatch`) primär Normalisierungs-Probleme sind, nicht Coverage-Lücken. Sub-Sortierung innerhalb der Drift freq=2-Tie-Group (19/20 Top-Drift sind `drift_count=2 / confidence=1.00` und damit „flat") als Note an Cockpit-Refinement-Punkt angeheftet. **Brief 076 (2026-05-16, PR #62 gemerged):** Axis-sliced Resolver-Pass 4 für `ssot-w40k-016..020` (W40K-0151..0200), fünf manuell gefahrene Subsessions (Preflight/Dossier → Factions → Locations → Characters → Integration + Mini-Phase 5 Public-Synopsis-Discipline), +20 factions / +25 locations / +40 characters / 4 cross-batch alias-consolidation cases entschieden, Driver-Deliverable `scripts/run-resolver-pass.sh` + Pass-5-Config-Template gebaut. Counts `work_factions=1185`, `work_locations=417`, `work_characters=633`, `work_collections=56` über 200 W40K-Bücher. Keine OQ-Verschiebung im Hygiene-Pass für 076-Hand-off (alle Items in 076-impl-Open-Issues operationell aufgelöst). **Brief 077 (2026-05-16, PR-ready):** Grand-Alignment-Junction-Hygiene — Skip-Logik im Apply-Layer (`scripts/apply-override-skip.ts` pure helper + DI, Alignment-Util-Extract nach `src/lib/seed/alignment.ts`), Drei-Bedingungen-Skip via `redundantWhenSubPresent: ["imperium", "chaos"]` in `faction-policy.json`, geskippte Surface-Forms im neuen `factionsSkippedRedundant`-`---surfaceForms---`-Bucket, Loop-Discipline „Faction-Granularity" ab `ssot-w40k-021` in 061 + Trigger-Heredoc, ADR-Section in `faction-policy.md` mit Revisit-Trigger für Aeldari-Sub-Splits (Alignment-Equality → Parent-Chain). Re-Apply 001..020: `work_factions=1185 → 1020 (−165)`, `imperium 81 → 6`, `chaos 133 → 43`, andere Axes invariant. **Neue OQ (11) „Locations-Axis-Hygiene-Sister-Pass"** promoted (Imperium x20 als unresolved Location auf der Locations-Axis — strukturell analog 077-Faction-Lücke).

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

## (6) ~~Hardcover-Rating-Promotion + Open-Library-Fallback-Decision~~ — closed by Brief 075 (2026-05-15)

Brief 075-impl ist gemerged (Commits `61d4ff5`/`e0c7575`/`7f3f14f`). `scripts/backfill-hardcover-rating.ts` läuft idempotent (Default `bookDetails.rating IS NULL`-Filter, W40K-SSOT-eng) und mit `--force`-Overwrite-Pfad. `discoverHardcoverClaimV2` trägt jetzt einen `opts.ratingsCountField?: 'users_count' | 'ratings_count'`-Parameter; Probe gegen Hardcover hat `users_count` als deterministisch erreichbar bestätigt — alle 77 Hits haben einen `ratingCount` geschrieben. Schema-Migration nicht nötig (bestehende `bookDetails.rating` / `ratingSource` / `ratingCount`-Spalten). Endstand: **77 / 150 W40K-SSOT-Bücher** mit `bookDetails.rating + ratingSource='hardcover' + ratingCount` (51.3 %). 73 NULL: 14 `no_author` (Anthologien/Editor-only — Erratum-3-Pfad, kein API-Call), 40 `null_result_zero_hits` (Hardcover-`_eq`-Titel-Mismatch), 19 `author_mismatch`. Hit-Rate < 70 % → Promote-Trigger gefeuert → siehe neue OQ (10) unten.

## (9) ~~Maintainer-Audit-Cockpit für Buch-Seiten~~ — folded into Brief 073 (2026-05-14)

Brief 073 (`sessions/2026-05-14-073-arch-maintainer-audit-cockpit.md`) bündelt OQ9 vollständig: Sub-Route `/buch/[slug]/audit` (Read-only, alle DB-Felder), Audit-Filter-Pillen auf `/buecher` (Drift / Junction-Lücke / SSOT / In mehreren Collections, AND-kombiniert), Default-Sort `updatedAt desc`, Audit-Route `noindex`, keine Schema-Migration. `confidence < 0.7`-Filter wurde bewusst nicht aufgenommen — wird scharf, wenn der Sonnet-Pipeline-Lauf wieder läuft (post-OQ2-(c)). Implementer-Report wird OQ9 abschließen.

## (7) ~~Master-Liste-Erstellung~~ — closed by 057-impl

Excel-SSOT (`scripts/seed-data/source/Warhammer_Books_SSOT.xlsx`, 859 Bücher + 191 Collection-Beziehungen) ist gelandet; Loader (`scripts/import-ssot-roster.ts`) produziert deterministisch `scripts/seed-data/book-roster.json` (SHA256-verifiziert byte-identisch über Re-Runs). ADR: [`./decisions/why-excel-ssot-not-crawl.md`](./decisions/why-excel-ssot-not-crawl.md). Coverage-Maintenance bleibt extern (Maintainer-Workflow mit LLM-Assistenz).

## (8) ~~V2-Batch-Auswahl auf Roster-Index~~ — verschoben in Brief 058 (queued)

Brief 058 (V2-Pipeline-Refactor) übernimmt: SSOT-Modus in `run-batch.ts`, Discovery-Stage 0 ab, Stage-1-Validators trimmen (year_outlier raus, author_editor_suspicion raus oder umbauen), Stage-3-LLM-Tool-Schema schrumpfen (Author/Year/Format/Title raus), erster 10er-Batch als committed Diff. Die OQ-Form ("Roster-Index-Selektor") ist durch die SSOT-Form ersetzt — Pipeline liest direkt aus `book-roster.json[offset:offset+limit]`.

## (10) Hardcover-Hit-Rate-Härtung (Titel-Normalisierungs-Layer) — promoted aus 075-impl

**Owner:** Cowork (architectural call: Welche Normalisierungs-Regeln, in welcher Reihenfolge, abbruch wenn Confidence sinkt?) → CC (Implementation, ~30–60 LOC in `scripts/backfill-hardcover-rating.ts` oder neuer Library-Funktion in `src/lib/ingestion/v2/sources/hardcover.ts`). **Sessions:** [075-impl](../../sessions/2026-05-15-075-impl-cockpit-drift-sort-and-rating.md) "For next session" Punkt 1. **Follow-up brief:** klein, eigenständig oder mit 200er-Resolver-Pass gebündelt.

Promote-Trigger ist gefeuert: 075-Backfill hat 51.3 % Hit-Rate (77/150) ergeben, unter dem 70 %-Schwellenwert aus Brief 075. 075-impl-Argumentation: die Miss-Profile sind primär Titel-Normalisierungs-Lücken, nicht Coverage-Lücken — von den 73 NULL-Rows sind 40 `null_result_zero_hits` (Hardcover-`_eq` matcht den Titel überhaupt nicht — wahrscheinlich Subtitle-/Series-Number-/Omnibus-Suffix-Mismatch) und 19 `author_mismatch` (Hardcover hat den Titel, aber andere Edition oder anderer Author). Ein OL-Fallback würde dieselben Miss-Profile haben (OL hat ebenfalls Slug-/Title-Matching und dünne 40K-Statistik); ein Normalisierungs-Layer attackiert die strukturelle Wurzel.

Drei Architektur-Calls für den Brief:

- (a) **Normalisierungs-Strategie.** Welche Title-Varianten werden probiert, in welcher Reihenfolge? Kandidaten: (i) Subtitle nach `:` droppen (`"Eisenhorn: Xenos"` → `"Xenos"`), (ii) Suffix-Stripping (`" Omnibus"`, `" (Special Edition)"`, `" — Anniversary"`), (iii) Series-Number-Drop (`"Horus Heresy 12"` → `"Horus Heresy"`), (iv) Punctuation-Strip + Lowercase als letzter Fallback. Erste-Match-wins oder Score-basiert?
- (b) **Confidence-/Tie-Break-Strategie.** Wenn ein normalisierter Titel mehrere Hardcover-Treffer ergibt, wie diskriminiert man? Author-Match-Hint ist heute schon im Author-Match-Pfad — bleibt das hart oder weicht sich auf bei Normalisierung?
- (c) **Persistenz / Audit.** Wird der „matched-via-normalized-title"-Pfad im `bookDetails`-Audit notiert (`ratingSource = 'hardcover-normalized'` oder Notes-Eintrag) für spätere Triage? Oder unsichtbar wie ein normaler Hit?

Out of scope dieser OQ: OL-Fallback bleibt eine separate Option für später, wenn Normalisierung allein keine ≥ 70 % erreicht. Der 14-Buch-`no_author`-Bucket bleibt unabhängig — fixt sich nur über Roster-Author-Workflow (Maintainer-Excel), nicht über Normalisierung.

**Note auf laufende Cockpit-Refinements (aus 075-impl Punkt 3 + 077-impl Punkte 3-4, kein eigener OQ-Eintrag):** Die Drift-Frequenz-Sort-Pille auf `/buecher?audit=drift` rangiert die freq≥2-Bücher zuerst, aber 19 von 20 Top-Treffern liegen flat auf `drift_count=2 / confidence=1.00` und werden via `updatedAt DESC` differenziert. Innerhalb dieser Tie-Group fehlt eine Sub-Sortierung (z. B. nach (`faction-drift`, `location-drift`, `character-drift`)-Triple oder nach absoluten Junction-Counts pro Buch). Material für einen kleinen Cockpit-Folgebrief, gebündelt mit `gap`/`collections`-Pillen-Sort-Refinements oder mit der Hit-Rate-Härtung als Doppelpack. **Plus aus 077-impl:** (a) `scripts/smoke-slugs-077.ts` als `npm run test:smoke-db`-Regression-Probe gegen die DB (heute ad-hoc-Script, lohnt wenn UI-Rollup-Brief kommt); (b) `test:resolver-coverage` Two-Line-Output (`pre-skip: N/M` + `post-skip: N/M` statt der kombinierten `(post-skip, N suppressed)`-Form) als lesbarere Reporting-Variante.

## (11) Locations-Axis-Hygiene-Sister-Pass (Grand-Alignment-Filter analog 077, aber für Locations) — promoted aus 077-impl

**Owner:** Cowork (Architektur-Call: wie eng spiegelt der Locations-Pfad den Faction-Pfad — gleiche `redundantWhenSubPresent`-Konvention auf Locations-Policy-File, gleicher Skip-Helper-Shape, gleicher `factionsSkippedRedundant`-equivalent Audit-Bucket?). → CC (Implementation analog Brief 077, ~150–200 LOC). **Sessions:** [077-impl](../../sessions/2026-05-16-077-impl-grand-alignment-junction-hygiene.md) „For next session" Punkt 1. **Follow-up brief:** klein, gebündelt mit dem nächsten Resolver-Pass oder vor dem UI-Rollup-Brief.

077-impl-Beobachtung: `test:resolver-coverage`-Output hat `Imperium x20` als unresolved Location auf der Locations-Axis (Bücher taggen `Imperium` als Filter-Surface auch dort, nicht nur als Faction). Strukturell analog zur Brief-077-Lücke: „Imperium" ist keine Location, eher ein politisches Konzept — vermutlich auch andere Grand-Alignment-Begriffe wie „Chaos Space" / „Eye of Terror"-als-Umbrella vs. konkretes Galactic-Feature. Der Locations-Pfad fehlt heute (a) eine explizite Policy-File analog `faction-policy.json` und (b) den Skip-Pfad in `apply-override.ts` (`resolveLocations`-Pendant).

Drei Architektur-Calls für den Brief:

- (a) **Policy-Quelle.** Eigene `location-policy.json` analog zur Faction-Policy, oder eine Erweiterung der existierenden Datei um einen `locations`-Subbaum? Cowork-Tendenz: eigene File, weil die Konzepte (Browse-Roots, Tree-Roots, Grand-Aggregate-Concepts) nicht 1:1 zwischen Faction- und Location-Domain stehen — Locations haben Sector / Sub-Sector / World / Sub-Location als Hierarchie, nicht alignment.
- (b) **Skip-Bedingung.** Analog 077 mit Tree-Membership-Bedingung (statt Alignment-Equality, das es bei Locations nicht gibt) — z. B. „Imperium" wird übersprungen, wenn das Buch eine andere Location resolved hat, die im Imperial-Sector-Subset lebt. Das verlangt eine Sector-/Sub-Sector-Klassifizierung, die heute eventuell noch nicht voll im Schema ist. Cowork-Alternative: einfacher Allowlist-Skip — „Imperium" / „Chaos Space" / „Realm of Chaos" / „Eye of Terror" werden ALWAYS skipped wenn überhaupt eine andere Location im Block resolved ist (Audit-Bucket trägt die Surface-Form für späteres Catch-up).
- (c) **HH-Domain Pre-Heresy-Drift.** Wenn HH-Bücher dazu kommen, kann ein Block `["Terra", "Imperium"]` tragen (Terra als Throneworld-Location + Imperium als Reich-Klassifikation). Brief sollte den HH-Sweep einplanen, sobald er relevant wird.

Out of scope: UI-Filter-Layer für Locations-Hierarchie (kommt im UI-Rollup-Brief). `eldar`/`tau`/`tyranids`-Splits auf der Faction-Axis bleiben Brief-070-Out-of-Scope; auf der Locations-Axis tauchen sie ohnehin nicht 1:1 auf.
