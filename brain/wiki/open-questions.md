---
title: Open questions (next-brief queue)
type: overview
created: 2026-05-09
updated: 2026-05-10
sources:
  - ../../sessions/archive/2026-05/2026-05-08-047-impl-pipeline-hardening.md
  - ../../sessions/archive/2026-05/2026-05-05-045-impl-cc-vs-pipeline-comparison.md
  - ../../sessions/archive/2026-05/2026-05-05-044-impl-phase3e-batch-1.md
  - ../../sessions/archive/2026-05/2026-05-04-042-impl-phase3c-haiku-switch.md
  - ../../sessions/2026-05-09-054-arch-pipeline-v2-pilot.md
  - ../../sessions/2026-05-09-054-impl-pipeline-v2-pilot.md
  - ../../sessions/2026-05-09-055-arch-v2-voll-lauf-decision-gate.md
  - ../../sessions/2026-05-09-055-impl-v2-voll-lauf-decision-gate.md
  - ../../sessions/2026-05-10-056-arch-v2-pre-roster-fixes.md
  - ../raw/reviews/2026-05-09-codex-v2-pilot-review.md
related:
  - ./project-state.md
  - ./pipeline-state.md
  - ./deferred-questions.md
  - ./decisions/why-haiku-not-sonnet.md
confidence: high
---

# Open questions

> Items the **next** architect brief MUST address. The queue is intentionally small (3–5 items). Cowork prunes here when an item lands in a brief or is otherwise resolved. Dormant / distant items live in [`./deferred-questions.md`](./deferred-questions.md). Phase-internal backlog (3d / 3e / 3f reminders) lives in [`./pipeline-state.md`](./pipeline-state.md).
>
> **Migration history:** the original 9-item Carry-over (`sessions/README.md`) was migrated to 11 numbered items at the 049 Karpathy-Reset. Brief 051 (Brain Slim Pass, 2026-05-09) split the queue into actionable here + dormant in `deferred-questions.md` + sub-phase reminders in `pipeline-state.md`. Post-054 Session-End: ehemals OQ4 (Anthologie-Re-Test) → `deferred-questions.md` (durch *tales-of-heresy* in V2-Pilot empirisch bestanden); ehemals OQ5 (Lexicanum-Body-Lore-Pass) → `deferred-questions.md` (V2 hat Body-Year-Regex aus FIELDS-Pfad entfernt, FIELD_PRIORITY für Junctions ist effektiv `[llm]`, Body-Lore-Walker bleibt eine Optimierung ohne aktuellen Treiber). Neu OQ4 (Junction-Resolver) + OQ5 (Unresolved-Queue) aus Codex-Review + V2-Pilot-Erfahrung. **Pre-055 Add (rogue, 2026-05-09):** Neu OQ6 (Hardcover-Rating-Promotion + OL-Fallback) — Wieder-Aufnahme von Rating als deterministische Quelle nach Slim-LLM-Drop. **Post-055 Pivot (2026-05-10):** Maintainer-Direktive nach 055-Voll-Lauf-Erfahrung — Workflow wechselt von "Voll-Lauf 50-100 Bücher" auf kuratierte 10er-Batches gegen eine Master-Liste. OQ4 + OQ5 bleiben bestehen, aber rutschen in der Sequenz nach hinten — Resolver-Brief erst nach 30–50 real-prozessierten Büchern aus den 10er-Batches. Bis dahin sind OQ4/5 nicht der "next brief", sondern Datensammlungs-Targets. OQ7 (Master-Liste-Erstellung) und OQ8 (V2-Batch auf Roster) sind die nächsten echten Briefs (Brief 057 + 058) nach 056. Universe-Year-Walker (parallele Diskussion) bewusst nicht hier sondern in `deferred-questions.md`, weil Maintainer das hinten anstellt.

Format per item: **(N) <Title>** with `Owner: …` (who has to act) · `Sessions: …` (raw sources) · `Follow-up brief: …` (if known).

---

## (1) Phase-3e Modell-Entscheidung — Haiku bleiben vs. Sonnet-Upgrade

**Owner:** Cowork (architect decision, then CC implements). **Sessions:** [045-arch](../../sessions/archive/2026-05/2026-05-05-045-arch-cc-vs-pipeline-comparison.md), [045-impl](../../sessions/archive/2026-05/2026-05-05-045-impl-cc-vs-pipeline-comparison.md), [047-impl](../../sessions/archive/2026-05/2026-05-08-047-impl-pipeline-hardening.md), [054-impl](../../sessions/2026-05-09-054-impl-pipeline-v2-pilot.md), [055-impl](../../sessions/2026-05-09-055-impl-v2-voll-lauf-decision-gate.md). **Follow-up brief:** verschoben in den 10er-Batch-Zeitraum — Vokabular-Erweiterung (item 2) ist eher Treiber als Modell-Entscheidung; Haiku-Cost ist post-055 nicht mehr streitig.

Trade-off-Tabelle aus 045: Sonnet-Pipeline löst `dual` vs `imperium` (mark-of-calth-Tagging-Failure), gibt nuancierteres Plausibility-Reasoning, löst Vokabular-Drift `vengeance` semantisch. Cost ~3× Haiku. **Post-055-Update:** Web-Search-Disziplin-Härtung in 055 hat das Cost-Bild noch deutlicher verschoben — 1.06 Web-Searches/Buch (vs. Pilot 1.6) bei $0.0199/Buch fresh-Run-Cost (5-Book-Smoke; im Voll-Lauf-Diff war alles Cache-Hit, daher $0). Hochrechnung 750-Bücher-V2-Voll-Lauf ≈ **$15** auf der gemessenen Pace — vs. Sonnet hochgerechnet ~$45–60. Cost-Argument für Haiku ist erdrückend; Modell-Frage rutscht in der Priorität ab. Realistisch wird sie erst wieder relevant, wenn die 10er-Batch-Reihe Qualitäts-Pathologien zeigt, die Sonnet semantisch besser löst.

## (2) Vokabular-Erweiterung — `duty` + Faction-Dimension `legion` + `chaos`-pov_side-Pattern

**Owner:** Cowork (architect call) → CC (schema + seed + LLM prompt). **Sessions:** [044-impl](../../sessions/archive/2026-05/2026-05-05-044-impl-phase3e-batch-1.md), [045-impl](../../sessions/archive/2026-05/2026-05-05-045-impl-cc-vs-pipeline-comparison.md). **Follow-up brief:** likely bundled with item (1).

Drei separate Erkenntnisse:
- (a) `duty` ist 3-Modelle-Konsens echte Lücke (kein existierender Tag deckt die "selbstlose unpersönliche Pflicht/Stoik"-Semantik). Promotion-Kandidat zur facet_value.
- (b) `legion` als neue multi-value-Faceten-Dimension (`ultramarines`, `word_bearers`, `iron_hands`, `salamanders`, …) ODER `protagonist_class`-Erweiterung mit `heretic_astartes` + `loyalist_astartes`. Beide Optionen sind Designthema. **Querverbindung post-054:** mit V2's Junction-Resolver (item 4) wird die `legion`-Dimension teilweise redundant, weil `work_factions` bereits Legion-Granularität trägt. Vor (1)+(2) muss geklärt sein, ob `legion`-Faceten zusätzlich zur Junction nötig sind oder durch sie ersetzt werden.
- (c) `chaos`-pov_side wird auch von Sonnet nicht für `mark-of-calth` gesetzt (Word Bearers + Daemonic in Synopsis, aber kein chaos-Tag) — Modell-übergreifender Blind-Spot. Wahrscheinlich Prompt-Härtung statt Vokabular-Erweiterung.

Plus: `value_outside_vocabulary` über 70 Bücher kumulativ (042 + 044): `duty` × 5 (`praetorian-of-dorn`, `the-master-of-mankind`, `wolfsbane`, `saturnine`, `blood-of-the-emperor`), `vengeance` × 1 (`shattered-legions`), `fate` × 1 (`ruinstorm`). `duty` ist klarer Promotion-Kandidat; die anderen brauchen mehr Datenpunkte.

## (3) Hand-Check-Workflow-Brief nach Architektur-Klärung

**Owner:** Cowork. **Sessions:** [040-arch](../../sessions/archive/2026-05/2026-05-04-040-arch-phase3c-haiku-switch.md), [054-impl](../../sessions/2026-05-09-054-impl-pipeline-v2-pilot.md). **Follow-up brief:** post-Modell-Entscheidung, pre-3d-Apply.

Sequenz post-054: V2-Voll-Lauf (055) → Resolver + Unresolved-Queue (056, items 4+5) → Modell-Entscheidung + Vokabular (items 1+2) → **Hand-Check + Override-Schema** → 3d-Apply-Step (057). **Post-054-Update:** V2 hat `BookV2Record.fields.<f>.override` als Hand-Override-Slot bereits eingebaut; Hand-Check-Brief muss „nur" das CSV-/Markdown-Override-Format definieren und die Triage-Disziplin für Cowork (welcher Validation-Severity rolls auto, welcher braucht Cowork-Augen, welcher ignored). V1's `llm_flags` fallen unter V2 weg, ersetzt durch `Validation[]`.

## (4) Junction-Resolver für 3d-Apply — Faction/Location/Character Surface-Form → Canonical-ID

**Owner:** Cowork (architectural design) → CC (implementation). **Sessions:** [054-arch](../../sessions/2026-05-09-054-arch-pipeline-v2-pilot.md), [054-impl](../../sessions/2026-05-09-054-impl-pipeline-v2-pilot.md), [055-impl](../../sessions/2026-05-09-055-impl-v2-voll-lauf-decision-gate.md), [Codex-Review](../raw/reviews/2026-05-09-codex-v2-pilot-review.md). **Follow-up brief:** verschoben — kommt nach den ersten 30–50 real-prozessierten Büchern aus den 10er-Batches (Briefs 058+). Bis dahin ist die 055er Surface-Form-Top-20 Referenz-Datensatz, aber Datensammlung läuft weiter; die Resolver-Brief-Empirie wächst mit jedem 10er-Batch.

V2 schreibt Faktionen, Locations und Characters als `{ name, role }` mit Surface-Forms aus dem LLM (z. B. `{ name: "Sons of Horus", role: "primary" }`). Das ist by-design für Pilot + Voll-Lauf — die FK-Resolution gegen `factions.id` / `locations.id` / `characters.id` (alle `varchar(64)` String-IDs) kommt im Resolver. Vier Anforderungen aus Codex-Review:

- (a) **Name-Normalisierung + Direct-Match.** "Word Bearers" → `word_bearers`, "Sons of Horus" → `sons_of_horus`. Slugify + Direct-`name`-Lookup.
- (b) **Alias-Mapping** für historische / synonyme Namen: "Space Marines" / "Adeptus Astartes", "Sons of Horus" / "Luna Wolves" (alte Legion-Namen vor Horus-Heresy-Bruch), "Imperial Fists" / "VII Legion". Alias-Tabelle als checked-in Artifact (z. B. `scripts/seed-data/faction-aliases.json` oder als Resolver-Code-Konstante mit Migration-Pfad).
- (c) **Hierarchie-Rollup** über `factions.parentId`. UX-Frage: filter "Imperium" surface-t plausibel auch `ultramarines`-getaggte Bücher? Wenn ja: recursive query oder pre-computed materialized path. Architektur-Entscheidung im Brief.
- (d) **Raw-Name-Audit-Trail.** Auch nach erfolgreichem Mapping bleibt der extrahierte Surface-Form-Name in der Junction-Row gespeichert (z. B. als `work_factions.raw_name text`). Audit: „Buch sagte 'Sons of Horus', resolved wurde `sons_of_horus`."

Gilt parallel für `locations` und `characters`.

**Empirische Basis aus 055-Voll-Lauf** (`v2-batch-20260510-1109-surfaces.json`, 50 Bücher, slug-window `13th-legion → ascension`):

- **Factions:** 133 Occurrences / 60 distinct, **46.7% Direct-Match**, 3.3% Alias-Candidate, 50.0% Unknown. Klare Alias-Targets: `"Imperial Guard" / "Imperial Army" → astra_militarum`, `"Imperium of Mankind" → imperium`, `"War Hounds" → world_eaters` (pre-Heresy Legion-Name; 2× im Window), `"Prodigal Sons" → thousand_sons`, `"Last Chancers" / "13th Penal Legion"` interlinkbar. Klare Canonical-Lücken in `seed-data/factions.json`: **Iron Hands, Emperor's Children, Black Legion, Death Guard, Sisters of Silence, Ecclesiarchy** (alle real W40K-Faktionen, real benötigt). Daneben Book-narrow Cults (Cult of the Angel of Fire, Disciples of Nul, Angels of the Grail) — Unresolved-Queue-Material (item 5).
- **Locations:** 101/76, **13.2% Direct-Match**, 5.3% Alias-Candidate, 81.6% Unknown. `seed-data/locations.json` ist Cartography-Anker (Terra, Mars, Calth), nicht Lore-Welten-Bibliothek — die meisten Surface-Forms sind book-internal. Lore-Welten zum Kanonisieren: Isstvan / Isstvan V (HH-Event), Nuceria (World-Eaters-Heimatwelt), Sotha, Imperium Nihilus (post-Cicatrix-Divide), Mortal Realms (AoS-Setting; Stormcast-Appearances). **Discriminator-Problem:** Schiffe (Black Ship, Conqueror, Endeavour of Will, Fist of Iron, Titan Child) leak ins Location-Bucket — `kind: "ship" | "world" | "sector" | "structure"` Discriminator oder Pre-Resolver-Disambiguation-im-Prompt ist Resolver-Brief-Architektur-Frage.
- **Characters:** 183/146, **0% Direct-Match** — strukturell, weil `seed-data/persons.json` der Author-Roster ist (Dan Abnett, Guy Haley, …), nicht in-universe Characters. Empirie spricht für **Option C (Hybrid Top-100):** Primarchs + Ahriman + Schaeffer cluster naturally above the noise floor (Ahriman 7×, Magnus 5×, Angron / Horus / Guilliman 4×, Schaeffer / Ctesias / Stroika / Torquora 3×). Architectural Blocker: kein canonical character table existiert; der Resolver-Brief muss A (full canonical) / B (scope-out) / C (Hybrid Top-100) entscheiden. Maintainer-Vorpräferenz Option C.

## (5) Unresolved-Queue-Strategie für unbekannte Entitäten

**Owner:** Cowork (architectural call) → CC (Schema + Triage-UI/CSV). **Sessions:** [054-impl](../../sessions/2026-05-09-054-impl-pipeline-v2-pilot.md), [055-impl](../../sessions/2026-05-09-055-impl-v2-voll-lauf-decision-gate.md), [Codex-Review](../raw/reviews/2026-05-09-codex-v2-pilot-review.md). **Follow-up brief:** verschoben — gebündelt mit item 4 in einem späteren Resolver-Brief, sobald 30–50 Bücher aus den 10er-Batches durch sind. Bis dahin sammeln die 10er-Batch-Diffs Surface-Forms; Maintainer-Review zwischen den Briefs trifft Triage-Entscheidungen ad-hoc.

Wenn das LLM "Cabal of Eight" oder "House Glaw" oder "Saruthi" als Faction extrahiert, aber `factions.json` enthält keinen direkten Match und keine Alias-Resolution greift — was tun? Drei Optionen:

- **Option A — Silent Drop mit Audit-Log.** Junction wird nicht geschrieben; `work_factions.raw_name`-Audit-Eintrag entfällt. Vorteil: einfach. Nachteil: Lore-Detail geht verloren ohne Cowork-Sichtbarkeit.
- **Option B — Auto-Create mit De-Dup-Heuristik.** Pipeline erzeugt automatisch neuen `factions.id` (slugified) mit `parentId: null` + `alignment: 'neutral'`. De-Dup gegen `name`-Levenshtein. Vorteil: keine Cowork-Eingriffe nötig. Nachteil: Faction-Tabelle wird mit halb-kanonischen Einträgen polluted; Filter-UX zerfasert.
- **Option C — Staging-Tabelle mit Cowork-Triage** (Codex-Empfehlung). Neue Tabelle `unresolved_entities { id, kind: 'faction'|'location'|'character', raw_name, occurrences, first_seen_work_id, status: 'pending'|'resolved'|'ignored' }`. Pipeline schreibt dort hin; Cowork triagiert frequenz-sortiert (häufigste Unknowns zuerst); resolved Einträge spawnen seed-data-PR + alias-mapping-Entry. **Empfehlung Cowork: Option C**, weil sie die Junction-Datenintegrität bewahrt und gleichzeitig die Surface-Form-Information nicht verliert.

**Volumen-Empirie post-055** (50-Bücher-Voll-Lauf, vs. Pilot-Hochrechnung): Faction-Achse 30 Unknown von 60 distinct (50.0%); Location-Achse 62 von 76 (81.6%); Character-Achse 146 von 146 (100%, strukturell weil kein canonical Character-Table). Hochgerechnet auf 750 Bücher V2-Voll-Lauf: ~450 Faction-Unknowns, ~930 Location-Unknowns, ~2200 Character-Surface-Forms total. Long-Tail-Verteilung — Top-100 erfassen vermutlich 70–80% des Signals (siehe `surfaces.json` aus 055). Cowork-Triage einer Top-100-Liste in einer Sitzung machbar; die 10er-Batch-Reihe verteilt das natürlich auf viele kleine Triage-Inkremente.

## (6) Hardcover-Rating-Promotion + Open-Library-Fallback-Decision

**Owner:** Cowork (architectural call: Field-Slot + OL-Fallback ja/nein) → CC (Implementation, ~10–20 LOC). **Sessions:** [054-arch](../../sessions/2026-05-09-054-arch-pipeline-v2-pilot.md), [054-impl](../../sessions/2026-05-09-054-impl-pipeline-v2-pilot.md) (Slim-LLM-Entscheidung, Rating raus aus `PUBLISH_ENRICHMENT_TOOL`), Cowork-Maintainer-Diskussion 2026-05-09 (rogue, kein eigener Session-Log). **Follow-up brief:** post-055-Verifikation, entweder schlanker 055.5-Brief oder gebündelt mit Brief 056.

V2 hat `rating` aus `PUBLISH_ENRICHMENT_TOOL.input_schema.properties` rausgenommen, weil der LLM via Web-Search keinen verlässlichen Rating-Wert produziert (Slim-Prompt-Disziplin in 054). Gleichzeitig liefert Hardcover-GraphQL den Wert deterministisch und kostenlos, und V2's `discoverHardcoverClaimV2` schreibt ihn bereits in `claim.raw.audit.averageRating` (siehe `src/lib/ingestion/v2/sources/hardcover.ts` Zeile 32–40 + 117–123). Die Architektur-Lücke ist nur, dass der Wert nicht aus dem Audit-Slot in einen echten `BookV2Record.fields.rating: FieldRecord<number>` promoted wird — also nicht renderable, nicht in der Detail-Page sichtbar, nicht im Resolver-Datensatz mit drin.

Goodreads als Quelle fällt aus: Goodreads-API ist seit Ende 2020 abgekündigt, kein neuer Developer-Key-Pfad. Hardcover ist die nahste Substitution mit überlappender 40K-Demographie (post-2020 Goodreads-Refugee-Community, Series-Reader-Fokus) und besserer Sample-Size pro Titel als Open Library. OL hat zwar das größere Bibliotheks-Backbone, aber pro 40K-Titel oft 0–5 Bewertungen, was statistisch Rauschen ist.

Drei Architektur-Entscheidungen für den Brief:

- (a) **Field-Schema.** `rating: FieldRecord<number>` (0–5 mit Decimals) auf `BookV2Record.fields`. Plus optional `ratingCount: FieldRecord<number>` für Audit-Transparenz (Hardcover-GraphQL hat das nicht direkt, OL hat `ratings_count`). Cowork-Call ob ein- oder zwei-Felder.
- (b) **OL als Fallback ja/nein** — entscheidet sich nach 055-Voll-Lauf empirisch. Wenn Hardcover ≥90% der 100 Bücher trifft, ist OL-Fallback Overhead; wenn <70%, lohnt sich der zusätzliche REST-Call. OL-Endpoint: `https://openlibrary.org/works/{olid}/ratings.json` (`summary.average` + `summary.count`), kein Auth, eine Anfrage pro Buch.
- (c) **Retroactive-Strategie.** Der 055-Voll-Lauf-Diff enthält `audit.averageRating` für jedes erfolgreiche Hardcover-Match bereits. Ein simpler Promote-Pass kann den committed Diff retroaktiv um das `fields.rating` erweitern, ohne neuen V2-Lauf — alternativ ein Source-only-Re-Crawl (Hardcover + ggf. OL, kein LLM, ~Cents). Wahl der Strategie ist Aufwands-/Reproduzierbarkeits-Trade-off.

Out of scope für diesen Eintrag: Universe-Year-Walker (parallel diskutiert, in `deferred-questions.md` geparkt), `availability` (war Slim-LLM-Drop genau wie Rating, hat aber keine vergleichbare deterministische API-Quelle und bleibt offen).

## (7) Master-Liste-Erstellung — `book-roster.json` + Override-Datei

**Owner:** Cowork (architectural design) → CC (implementation). **Sessions:** Maintainer-Diskussion 2026-05-10 (post-055-Pivot). **Follow-up brief:** Brief 057.

Maintainer-Direktive nach 055-Voll-Lauf: weg vom rauschigen Discovery-Output (Wikipedia + TLBranson schreiben `about-warhammer-40k`, `above-and-beyond` etc. mit), hin zu einer kuratierten Master-Liste, gegen die die Pipeline crawlt. Architektur-Entscheidung 2026-05-10 (Maintainer-Wahl): **Auto-generiert + Override-Datei**.

- **Build-Skript** `scripts/build-book-roster.ts` crawlt drei Quellen: tlbranson Books-Seite, tlbranson Horus Heresy-Seite, Wikipedia-Master-Listen (4 Seiten wie heute). Nutzt die V2-Discovery-Module (`tlbranson/parse.ts` + `wikipedia/parse.ts`) intern, schreibt nicht direkt in `ingest/.cache/` sondern produziert ein Roster-File.
- **Output 1: `scripts/seed-data/book-roster.json`** — checked-in Datei mit Form `{ books: [{ slug, title, sources: ["tlbranson", "wikipedia"], releaseYear?, seriesHint?, authorHint? }, ...] }`. Re-Crawls produzieren Git-Diffs gegen die alte Datei.
- **Output 2: `scripts/seed-data/book-roster-overrides.json`** — Hand-Override-Datei mit drei Sektionen: `exclude` (Slugs die rauswerfen, z. B. `["about-warhammer-40k", "above-and-beyond"]`), `rename` (Slug-/Title-Korrekturen), `extra` (manuell dazugepackte Bücher die der Crawler nicht findet). Build-Pipeline: Crawl → Dedup → Override-Application → Final `book-roster.json`.

Architektur-Fragen für 057-Brief (sind im Brief zu setzen, nicht hier zu entscheiden):

- (a) **Roster-Format** mehr Felder als oben (z. B. `series`, `seriesIndex` als optional)? Pragmatik: nur Felder, die deterministisch aus den drei Crawl-Quellen extrahierbar sind.
- (b) **Override-Application-Reihenfolge** — `exclude` vor `rename` vor `extra` ist die natürliche Sequenz. CC kann begründen, falls anders.
- (c) **Slug-Konflikt-Auflösung** zwischen tlbranson und Wikipedia. Vermutlich slug-canonical aus tlbranson (kürzer, kontroller) mit Wikipedia als Confirmation; Konflikte loggen, nicht silent-merge.
- (d) **Build-Skript-Lauf-Trigger** — manuell (nur `npm run build:roster` von Maintainer) oder GH-Action (monatlich oder bei Wikipedia-Update)? Pragmatik: erstmal manuell, GH-Action ist 3f-Maintenance-Backlog.

## (8) V2-Batch-Auswahl von Slug-Sort auf Roster-Index umstellen — erster 10er-Batch

**Owner:** Cowork (architectural design) → CC (implementation). **Sessions:** [055-impl](../../sessions/2026-05-09-055-impl-v2-voll-lauf-decision-gate.md), Maintainer-Diskussion 2026-05-10. **Follow-up brief:** Brief 058 (post-Brief-057).

V2-Batch-Selektor heute (post-055) sortiert die Discovery-Output-Roster nach Slug ascending und nimmt die ersten N. Das wird in 058 abgelöst durch eine Roster-Index-basierte Auswahl: `book-roster.json` ist die Quelle, Batch-Mode wählt `books[offset:offset+limit]`. CLI-Form-Vorschlag: `--pipeline=v2 --batch=v2-tryout-3 --offset=0 --limit=10`. CC kann eine elegantere CLI vorschlagen.

In derselben Session: erster 10er-Batch wird gefahren, produziert committed Diff (Filename-Prefix bleibt `v2-batch-` — Dashboard rendert ohne Code-Änderung). Maintainer-Review danach (Surface-Forms, Validator-Trigger, Synopsis-Plausibilität); 059er-Brief je nach Befund (nächster 10er-Batch + ggf. Mini-Fixes).

Architektur-Fragen für 058-Brief: CLI-Form, Roster-Lese-Pfad (cached oder direct file-read), Verhalten bei `offset+limit > books.length` (klar fehlern oder loud-warn-und-trim?), Metadata im Diff-File über die Batch-Range (`{ rosterRange: { offset: 0, limit: 10, total: 712 } }` o. Ä.).
