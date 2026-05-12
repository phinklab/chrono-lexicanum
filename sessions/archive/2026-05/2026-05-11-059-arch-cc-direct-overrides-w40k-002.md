---
session: 2026-05-11-059
role: architect
date: 2026-05-11
status: superseded
superseded-by: 2026-05-11-061-arch-ssot-loop
slug: cc-direct-overrides-w40k-002
parent: 2026-05-11-058
links:
  - 2026-05-11-058-arch-v2-ssot-mode-first-batch
  - 2026-05-11-058-impl-v2-ssot-mode-first-batch
  - 2026-05-11-060-arch-ssot-w40k-001-db-apply
  - 2026-05-11-061-arch-ssot-loop
  - 2026-05-10-057-impl-excel-ssot-import
commits: []
supersedes: 2026-05-11-059-arch-cc-direct-ab-pilot
---

> **Superseded by [Brief 061](./2026-05-11-061-arch-ssot-loop.md) (2026-05-11).** Dieser Brief war die kanonische 1-Batch-Form mit Sed-Replace-Reuse für 003/004/005. Brief 061 ersetzt den Sed-Replace-Schritt durch eine Detection-Funktion im CC-Code-Flow und macht aus dem Brief einen Standing-Loop. Inhaltliche Constraints (Hallu-Disziplin, WebSearch-Cap, Omnibus-Aggregation, Format-Compliance, Inquisition-Konsistenz, Surface-Form-Treue) sind 1:1 in 061 übernommen. `ssot-w40k-002` entsteht jetzt in der ersten Loop-Iteration.

# CC-Direct-Overrides für ssot-w40k-002 (W40K-0011..0020)

> **Reuse-Hinweis (Maintainer):** Dieser Brief ist die kanonische Form für *einen* 10er-Batch CC-Direct-Override-Generate. Für die Folge-Batches 003, 004, 005 wird der Brief 1:1 kopiert mit angepasster Session-ID und Batch-Nummer — siehe Section "Reuse für die Folge-Batches" unten. Resolver-Brief greift, sobald insgesamt 50 Bücher in der Authority-Schicht liegen (also nach 005-Apply).

## Goal

Claude Code produziert mit WebSearch *eine* `manual-overrides-ssot-w40k-002.json`-Datei für 10 Bücher (Roster-Slice W40K-0011..W40K-0020, lex-sortierte W40K-Reihe direkt nach The Magos). Format und Disziplin identisch zur Cowork-curated Authority-Datei für `ssot-w40k-001`. Output ist diff-only — kein DB-Apply in dieser Session; das läuft separat via Apply-Skript aus Brief 060.

Strategischer Rahmen: ein 10er-Batch pro CC-Session, vier solche Sessions (002, 003, 004, 005) bringen kumulativ 40 Bücher in die Authority-Schicht. Zusammen mit den 10 aus 001 sind das 50 Bücher — die **Trigger-Schwelle für den Resolver-Brief** (OQ4 + OQ5: Surface-Form-Kristallisation, Top-K-häufige Faktionen/Locations/Charaktere werden in canonical Reference-Tables promoted, Aliases gepflegt, Re-Apply schreibt FK-Junctions statt Surface-Forms-in-Notes). Pattern für den Rest des Rosters: 10er-Batch → 10er-Batch → 10er-Batch → 10er-Batch → 50er-Crystallization → repeat.

## Context

Der ursprüngliche Brief 059 hatte einen A/B-Pilot zwischen Haiku-Standard und CC-Direct vorgesehen. Post-058-Maintainer-Review auf `ssot-w40k-001` hat die Frage strukturell entschieden:

- Haiku produziert ~3-4 plot-relevante Halluzinationen pro 10 Bücher (Emperor's Children in *Xenos*, Cherubael pre-Einführung in *Xenos*, Beta vs. Alizebeth Bequin verwechselt in *Pariah*, Valentin Drusher statt Magos Bure in *The Magos*), tagged Omnibuses systematisch unter, verfehlt offensichtliche `data_conflict`-Flags.
- Cowork-Opus mit WebSearch liefert plot-akkurate Synopsen und lore-tiefes Tagging — Maintainer hat die 10er-Welle als Override-Authority akzeptiert (in Brief 060 als ersten DB-Apply-Input genagelt).
- Maintainer-Entscheidung: A/B-Pilot entfällt vollständig. CC mit WebSearch (Sonnet-Tier statt Opus-Tier) wird als Default-Enrichment-Pfad für die Folge-Batches eingesetzt. Modell-Drift Opus → Sonnet ist real, aber die Plot-Halluzinations-Disziplin und WebSearch-Quellen-Disziplin lösen das Hauptproblem — nicht die Modell-Reasoning-Stufe.

Pipeline-Architektur post-Entscheidung: Stage 3 (Slim-LLM-Haiku-API-Call in `src/lib/ingestion/v2/llm/enrich.ts`) wird in diesem Brief **nicht angefasst**. Der Code bleibt als Tot-Pfad im Repo; ein späterer Aufräum-Brief entfernt ihn, sobald CC-Direct als Default stabil läuft. Die Brief-059-Mechanik ist: CC liest die 10 Roster-Einträge aus `scripts/seed-data/book-roster.json`, führt WebSearch nach Plot-Lore aus, produziert die Override-Felder, schreibt die JSON-Datei, committet. Kein Pipeline-CLI-Aufruf; kein neuer Stage-3-Pfad in Code.

`ssot-w40k-002` deckt die Roster-Indices 10-19 (W40K-0011..W40K-0020, lex-sortiert nach The Magos). Welche Slugs konkret drinstehen, liest CC aus `book-roster.json[10:20]` als ersten Schritt — Maintainer-Vermutung: frühe 2000er Black-Library-Titel (William King *Space Wolf*-Frühphase, Brian Craig Necromunda, James Swallow / Gav Thorpe Frühphase, plus Stand-alones). Long-Tail-Terrain, weniger Web-Density als Eisenhorn — höhere Anforderungen an saubere Source-Disziplin.

Die existing Cowork-Override-Datei für 001 (`scripts/seed-data/manual-overrides-ssot-w40k-001.json`, `createdBy: "cowork-opus"`) ist die Format-Vorlage. Schlüssel-Stellen pro Buch: `externalBookId`, `slug`, `overrides.synopsis`, `overrides.facetIds`, `overrides.factions[]`, `overrides.locations[]`, `overrides.characters[]`, `overrides.flags[]`. Top-Level: `$schema`, `batch`, `createdBy`, `createdAt`, `model`, `rationale`.

## Constraints

- **Eine Override-Datei pro Session.** `scripts/seed-data/manual-overrides-ssot-w40k-002.json` mit 10 Buch-Einträgen für W40K-0011..W40K-0020. Form identisch zur 001-Datei (Top-Level + `books[]`).

- **CC nutzt sein eigenes Reasoning + WebSearch.** Kein Haiku-API-Call, keine Anthropic-API-Inferenz für die Stage-3-Funktion. WebSearch ist das einzige externe Tool für Plot-Lore-Recherche.

- **WebSearch-Discipline pro Buch.** 1 obligatorisch (synopsis context — wenn das Buch nicht aus Trainingsdaten gut bekannt ist), 2-3 conditional (wenn Plot-Lore unzureichend, oder wenn Faktion/Charakter-Identität unklar bleibt). Soft-Cap bei 5 pro Buch — CC darf nach oben, wenn ein komplexer Omnibus oder eine HH-Style-Anthology das verlangt; im Report begründen. CC dokumentiert mittlere und maximale WebSearch-Counts.

- **Plot-Halluzinations-Disziplin.** Keine Faktion / kein Charakter / keine Location ohne Source-Basis. Wenn WebSearch nichts Belastbares liefert: leer lassen oder mit `flag: { kind: "low_confidence", field: "characters", reason: "limited source coverage" }` markieren. Lieber knapp und korrekt als breit und erfunden. Das war die zentrale Schwäche von Haiku auf 001.

- **Omnibus-/Collection-Aggregation.** Wenn das SSOT-Format `omnibus`, `collection`, `anthology` oder `scriptbook` ist: factions/locations/characters/facetIds müssen die enthaltenen Einzelwerke aggregieren, nicht nur das Framing-Material. Tag-Tiefe vergleichbar mit dem längsten Constituent-Werk. „1 Faktion, 1 Location, 2 Charaktere" für ein 1200-Seiten-Omnibus ist anti-pattern.

- **Format-Compliance-Check.** Wenn WebSearch ergibt, dass das Buch real eine Collection / Anthology ist (Source erwähnt „collects the following stories", „anthology", „short story collection", oder listet 5+ benannte Stories) und das SSOT-Format `novel` sagt: `data_conflict`-Flag emittieren mit `field: "format"`, `suggestion: "collection"` (oder `"anthology"` bei Multi-Author). Nicht still akzeptieren.

- **Inquisition-Konsistenz.** Wenn ein Charakter mit `role: "pov"` ein Inquisitor ist (basierend auf Synopsis, nicht auf Tag-Inferenz), muss `factions[]` mindestens einen `Inquisition` / `Ordo Xenos` / `Ordo Malleus` / `Ordo Hereticus`-Eintrag mit `role >= "supporting"` enthalten. Cowork-Review-Findung aus 058 — Haiku war hier inkonsistent.

- **Surface-Form-Treue, kein Pre-Resolving.** CC schreibt Faktions-/Location-/Character-Namen genau so, wie sie in den Quellen vorkommen — kein Slugify-Mapping, kein Canonical-ID-Lookup. „Sons of Horus" bleibt „Sons of Horus" (nicht `sons_of_horus`); „Ordo Xenos" bleibt „Ordo Xenos" (nicht `inquisition`). Das Resolving in canonical Reference-Tables passiert im Resolver-Brief nach 50 Büchern — hier wird nur Surface-Form-Raw-Data gesammelt.

- **Implementer-Report-Disziplin.** Pro Buch ein 1-2-Satz-Befund (z.B. „W40K-0011 *Trollslayer*: Gotrek/Felix sind Warhammer-Fantasy, nicht 40K — Roster-Fehleintrag-Verdacht; `data_conflict`-Flag mit `field: setting, suggestion: fantasy` gesetzt"). Das ist der Maintainer-Triage-Eingang.

- **`npm run lint`** + **`npm run typecheck`** + **`npm run brain:lint -- --no-write`** grün. (Keine Code-Änderungen erwartet, nur JSON-File committed — aber Lint-Discipline aus Konvention.)

## Out of scope

- **DB-Apply.** Brief 060 implementiert das Apply-Skript für ssot-w40k-001. Apply für 002 läuft als manueller Trigger nach Maintainer-Review (`npm run db:apply-override -- --batch=ssot-w40k-002`), nicht in dieser Session.

- **Andere Batches (003, 004, 005).** Eigene Sessions. Maintainer kopiert diesen Brief mit angepasster Batch-Nummer — siehe Section "Reuse für die Folge-Batches" unten.

- **Resolver / Surface-Form-Kristallisation.** OQ4 + OQ5. Eigener Brief, getriggert nach Apply von 005 (50 Bücher Total).

- **Pipeline-Stage-3-Dead-Code-Cleanup.** Der Haiku-Stage-3-Pfad in `src/lib/ingestion/v2/llm/enrich.ts` bleibt unangetastet — Aufräum-Brief später.

- **Vokabular-Erweiterung** (OQ2). Bleibt offen, wird durch CC's `value_outside_vocabulary`-Liste im Report befüttert.

- **Modell-Wechsel** (OQ1). Strukturell aufgelöst — Haiku als Stage-3-Default fällt weg. Cowork prunt in Brain-Hygiene.

- **A/B-Comparison-Artefakte** (compare.md, `/ingest/compare`-View, Loser-Archivierungs-Mechanik). Alles aus dem alten Brief 059 — entfällt.

- **`ssot-w40k-001`-Override-Update.** Cowork-Datei bleibt wie sie ist.

- **README / ROADMAP / ARCHITECTURE / Brain-Hygiene.** Cowork macht das separat nach Apply von 005.

## Acceptance

The session is done when:

- [ ] **Eine Override-Datei committed.** `scripts/seed-data/manual-overrides-ssot-w40k-002.json` mit 10 Buch-Einträgen passend zum Roster-Slice W40K-0011..W40K-0020.

- [ ] **Pro Buch enthalten:** `externalBookId`, `slug` (matched mit `book-roster.json`), `overrides.synopsis` (400-1200 Zeichen, plot-konkret, namentliche Charaktere/Locations), `overrides.facetIds` (typisch 15-20 IDs aus `facet-catalog.json`-Vokabular), `overrides.factions[]` (3-8 mit `name` + `role`), `overrides.locations[]` (3-10), `overrides.characters[]` (5-15), `overrides.flags[]` (0-mehrere; vor allem `data_conflict` bei Format-/Setting-Mismatch, `low_confidence` bei dünner Source-Coverage).

- [ ] **Top-Level der Override-Datei:** `$schema: "manual-overrides-v1"`, `batch: "ssot-w40k-002"`, `createdBy: "claude-code"`, `createdAt: <ISO-Datum>`, `model: <tatsächliches Modell>`, `rationale: <2-3 Satz-Begründung des Batches — was war besonders an dieser 10er-Welle>`.

- [ ] **WebSearch-Empirie im Report.** Mittlere und maximale WebSearch-Counts pro Buch, Erwartung 1-3, Cap weich bei 5. Welche Bücher waren schlecht abgedeckt — kurze Liste.

- [ ] **Pro-Buch-Bullet-Befund im Report.** Pro Buch (W40K-0011 bis W40K-0020) ein 1-2-Satz-Befund: was war auffällig (Roster-Fehleintrag-Verdacht, Format-Konflikt, Hauptcharakter-Identität ungewöhnlich, neuer Vokabular-Kandidat, dünne Source-Coverage). Maintainer-Triage-Eingang.

- [ ] **`value_outside_vocabulary`-Liste.** Alle Tag-Kandidaten, die CC erwogen hat aber kein passender `facetId` existiert. Empirie-Sammlung für OQ2.

- [ ] **Surface-Form-Empirie.** Kurze Zusammenfassung: wie viele distinct Faktionen / Locations / Charaktere insgesamt, wie viele davon plausibel Long-Tail (book-internal) vs. Top-K (cross-book-recurring innerhalb der 10 oder Bezug zu 001). Vorarbeit für Resolver-Brief.

- [ ] **`npm run lint`** + **`npm run typecheck`** + **`npm run brain:lint -- --no-write`** grün.

## Open questions

- **Long-Tail-Bücher ohne belastbare Web-Lore.** Wenn CC bei einem 2003er Necromunda-Titel selbst mit 5 WebSearches keine belastbare Plot-Lore findet — was tun? Cowork-Tendenz: minimale Synopsis aus Roster-Title + Format + Genre-Inferenz (max. 200 Zeichen, vorsichtig formuliert), reduzierte Tags (5-8 statt 15-20), facetIds nur die, die aus Format + Genre folgen. `flag: { kind: "low_confidence", reason: "limited source coverage" }`. Nicht raten was nicht da ist. CC's Call, ob das die richtige Ebene ist.

- **Roster-Fehleintrag-Verdacht** (Cross-Setting). Wenn CC sieht, dass ein als W40K-getaggtes Buch real ein Fantasy-Buch ist (Gotrek/Felix, Bretonnia, etc.): `data_conflict`-Flag mit `field: "setting"`, `suggestion: "fantasy"`, in der Synopsis offen kommentieren. Buch bleibt im Override-File (sonst klafft eine Lücke); Maintainer entscheidet im Excel-SSOT-Workflow später, ob es aus der W40K-Roster gestrichen wird.

- **`createdBy`-Konsistenz.** Die `001`-Datei trägt `createdBy: "cowork-opus"` + `model: "claude-opus-4-7"`. Vorschlag: CC schreibt `createdBy: "claude-code"`, `model: <tatsächliches Sonnet-Modell>`. CC's Call.

- **Subscription vs. API für WebSearch.** Wenn CC WebSearch via sein eigenes Tool aufruft: läuft das über das Anthropic-Subscription-Pool (20x-Abo) oder hat es einen anderen Abrechnungspfad? CC dokumentiert empirisch. Nicht entscheidungs-blockierend für diesen Brief.

- **Cross-Batch-Surface-Form-Hinweise.** Wenn CC „Space Wolves" 6× in den 10 Büchern sieht, ist das ein klares Top-K-Signal. Cowork-Tendenz: kurze Frequenz-Beobachtung im Report ja, aber kein Pre-Mapping, kein Alias-Vorschlag — das überlässt CC dem Resolver-Brief.

## Notes

### Reuse für die Folge-Batches (003, 004, 005)

Maintainer kopiert diesen Brief 1:1 mit angepasster Session-ID und Batch-Nummer. Konkreter Workflow:

```bash
# Für Brief 061 (ssot-w40k-003):
cp sessions/2026-05-11-059-arch-cc-direct-overrides-w40k-002.md \
   sessions/2026-05-DD-061-arch-cc-direct-overrides-w40k-003.md

# Dann mit sed (oder Editor) die folgenden Stellen ersetzen:
#   session: 2026-05-11-059       →  session: 2026-05-DD-061
#   slug: cc-direct-overrides-w40k-002  →  slug: cc-direct-overrides-w40k-003
#   ssot-w40k-002 (überall, ~12× im Brief)        →  ssot-w40k-003
#   W40K-0011..W40K-0020 (überall, ~6× im Brief)  →  W40K-0021..W40K-0030
#   book-roster.json[10:20]       →  book-roster.json[20:30]
#   Datum im frontmatter / Header anpassen
```

Strukturell identisch — die Constraints (Hallu-Disziplin, WebSearch-Cap, Omnibus-Aggregation, etc.) sind batch-unabhängig. Nur die Bezugs-Daten ändern sich.

`supersedes`-Frontmatter-Feld entfällt für 061/062/063 (nur 059 supersedet den A/B-Pilot-Brief). `reusable-as-template-for`-Frontmatter ebenfalls entfällt (nur 059 trägt das, weil es der Master-Brief ist).

Wenn nach Batch 002 ein Constraint sich als unzureichend erwiesen hat (z.B. WebSearch-Cap zu niedrig, Synopsis-Längenrange unpassend, neue `flag.kind`-Werte nötig): Maintainer editiert *diesen* Brief und alle Klone, ODER Cowork schreibt einen Mini-Update-Brief der die Konvention für alle Folge-Batches ändert. Erste Variante ist pragmatischer.

### Workflow-Pattern post-001-Apply

Sequenz für die nächsten ~50 Bücher:

1. **Brief 060** (parallel offen): erster DB-Apply für 001, implementiert das Apply-Skript.
2. **Brief 059** (dieser): CC produziert Override-File für 002. Diff-only.
3. **Maintainer-Review** zwischen 059-Generate und 002-Apply: Override-Datei wird gelesen (besonders Pro-Buch-Bullets aus dem CC-Report), bei Findings kleine Edits am JSON. Apply-Skript getriggert: `npm run db:apply-override -- --batch=ssot-w40k-002`.
4. **Brief 061** = Klon von 059 für 003. Implementer-Pendant, Maintainer-Review, Apply-Trigger.
5. **Brief 062** = Klon für 004. Analog.
6. **Brief 063** = Klon für 005. Analog.
7. **Sobald 50 Bücher in DB** (Apply von 005 fertig): Resolver-Brief (OQ4 + OQ5). Top-K-häufige Surface-Forms (≥3 occurrences cross-batch) werden in canonical Reference-Tables promoted, Alias-Tabelle gepflegt, Re-Apply auf die 50.
8. **Repeat:** nächste 4 Batches (006-009), nächste Crystallization, etc.

Vorteil dieses Pattern: jeder Crystallization-Pass arbeitet mit echter Frequenz-Empirie aus 50 Büchern, nicht auf Verdacht. Long-Tail-Surface-Forms bleiben in `bookDetails.notes` als Audit-Trail (auch wenn nie promoted). Plus: CC's Session bleibt kompakt (10 Bücher = überschaubarer Context), kein Concentration-Drift über 40 Bücher.

### Bücher in 002 (Maintainer-Vermutung)

Lex-sortierte Reihenfolge nach The Magos (W40K-0010). CC verifiziert im ersten Schritt durch Lektüre von `book-roster.json[10:20]` welche 10 Slugs konkret drin sind. Vermutete Cluster:

- William King — *Space Wolf*-Frühphase (Ragnar Blackmane)
- Brian Craig (Brian-Stableford-Pseudonym) — Necromunda-Trilogie
- James Swallow / Gav Thorpe — Frühphase Black-Library
- Stand-alones aus dem frühen 2000er-Sortiment
- Möglicher Roster-Mis-Tag: Warhammer-Fantasy-Bücher

Long-Tail-Terrain — Web-Search-Density geringer als bei Eisenhorn. Erwartung: 1-3 WebSearches pro Buch reichen meist; einige Bücher brauchen 4-5 für sichere Plot-Lore. Manche brauchen die `low_confidence`-Markierung.

### Override-File-Format (Vorlage)

CC liest `scripts/seed-data/manual-overrides-ssot-w40k-001.json` als Format-Vorlage. Notable details:

- **Top-Level-`rationale`:** in 001 ein 3-4-Satz-Block. CC schreibt einen analogen 2-3-Satz-Block über diese 10er-Welle.
- **Per-Buch `flags`:** leer wenn alles plausibel; `{ kind, field, suggestion?, reason }`-Form bei Konflikten. Bekannte `kind`-Werte: `data_conflict`, `low_confidence`, `roster_mistag`. Neue im Report begründen.
- **Synopsis-Stil:** 4-8 Sätze, plot-konkret, namentliche Charaktere/Locations, ohne Tropes wie „a thrilling adventure". Die Eisenhorn-Synopsen in 001 sind das Reference. Sprache: Englisch.
- **`facetIds`-Tiefe:** typisch 15-20 IDs für ein Standard-Buch, mehr für Doorstopper-Omnibuses. Vokabular aus `scripts/seed-data/facet-catalog.json`.
- **Roles:** für Faktionen `primary` / `supporting` / `antagonist` / `background` / `mentioned`. Für Locations zusätzlich `secondary`. Für Charaktere `pov` / `supporting`. CC bleibt nah am 001-Vokabular; neue Roles im Report begründen.

### Closes / supersedes

- **Brief 059-alt** (A/B-Pilot Haiku vs. CC-Direct): superseded. Acceptance-Bullets entfallen vollständig: kein Pfad-A, kein Pfad-B, kein A/B-Switch, kein Vergleichs-Artefakt, keine Loser-Archivierungs-Mechanik.
- **OQ1** (Modell-Entscheidung Haiku vs. Sonnet): strukturell aufgelöst. Cowork prunt in Brain-Hygiene.
- **Die zwei Prompt-Schärfungen** aus dem alten Brief (Omnibus-Aggregation + Format-Compliance-Reminder): semantisch in die Constraints dieses Briefs gewandert, nicht in `SYSTEM_PROMPT_V2`.

---

Brief 059 ist die kanonische 1-Batch-Form. Klonbar für 003-005, kompakt genug für eine CC-Session, fokussiert auf 10 Bücher. Resolver greift nach 50.
