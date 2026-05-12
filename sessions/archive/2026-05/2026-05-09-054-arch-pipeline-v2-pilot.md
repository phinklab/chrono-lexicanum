---
session: 2026-05-09-054
role: architect
date: 2026-05-09
status: implemented
slug: pipeline-v2-pilot
parent: null
links:
  - 2026-05-08-047
  - 2026-05-09-052
commits: []
---

# Pipeline V2 Pilot — Discovery-Spine + Validators + Slim LLM

## Goal

Eine V2-Variante der Backfill-Pipeline shippen, die auf **fünf gezielt ausgewählten Pilot-Büchern** durchläuft und ihren Diff unter `ingest/.last-run/v2-pilot-YYYYMMDD-HHMM.diff.json` produziert. V2 trennt Discovery-Spine (TLBranson + Wikipedia) von Canon-Spine, ersetzt Lexicanum's Body-Year-Regex durch Infobox-only-Parsing plus deterministische Validatoren, schlankt den LLM-Prompt um Rating und Availability ab, und führt Provenance-pro-Feld inklusive Override-Slot in den Diff-Datentyp ein.

Der Pilot ist **kein DB-Write, keine Migration**. Er ist Diff-only, im `/ingest`-Dashboard sichtbar, und produziert die Vergleichszahlen, die entscheiden, ob V2 nach Brief 055 zum Voll-Lauf-Standard wird.

## Context

047 hat die heutigen fünf Hardening-Hebel gepulled (`pickPrimarySource`, Lexicanum-URL-Suffixe, Format-Validation, OL-Reissue-Trap-Guard, Hardcover-Author-Hint). 047's 9-Buch-Lauf hat trotzdem drei akute Halluzinations- und Coverage-Probleme stehen lassen, die der heutige Diff sichtbar macht:

- **`startY` / `endY` aus Lexicanum-Body-Regex sind systematisch unzuverlässig.** *false-gods* mit `startY=39000`, *angel-exterminatus* mit `endY=40000`, *mechanicum* mit `29739–30005` — die `extractUniverseYears`-Funktion in `src/lib/ingestion/lexicanum/parse.ts` matcht beliebige `M\d{1,2}`-Erwähnungen im Article-Body. Sonnet-Pipeline flaggt das in 2037 als `year_glitch`, Haiku-Pipeline sieht es seltener. In beiden Fällen landet der falsche Wert im Diff und ginge bei naivem Apply in die DB.
- **Open Library liefert PageCount-Müll, der heute ungeprüft durchgeht.** *garro* mit `pageCount=2` in 044's Batch ist der prominente Fall. Open Library hat keine garantierte Min-Page-Schwelle; ein Metadata-Glitch kostet uns einen DB-Wert.
- **Hardcover-Author-Mismatches überschwemmen die `errors[]`-Liste.** 044 hat 47 Errors auf 50 Bücher, 14 davon Hardcover-Mismatches mit zufälligen Autorenstacks (Leo Champion, Julie Kagawa, Tia Didmon für *Legion*). Das ist heute Lese-Müll im Dashboard, weil Hardcover bei `_eq`-only-Match auf generische Titel routinemäßig Treffer aus dem allgemeinen Katalog mitliefert.

Parallel dazu zwei strukturelle Befunde aus dem 2026-05-09-Audit:

- **Wikipedia-Master-Liste hat eine Frische-Lücke ab spätem 2025.** Mindestens acht Black-Library-Releases zwischen Dezember 2025 und März 2026 (Master of Rites, Demolisher, Vaults of Terra Omnibus, Death Rider, Ghost Legion, Ghazghkull Thraka, Chem Dog, The Green Tide) sind in den heute gecrawlten Wikipedia-Listen unvollständig erfasst. TLBranson's Reading-Order-Seite (modified 2026-03-27) hat sie alle plus Series-Gruppierung als H3-Sektion. TLBranson ist nicht vollständiger als Wikipedia (~250–300 Bücher vs ~700), aber er ist frischer und liefert Series-Anker-Signal, das Wikipedia für Standalone-Reihen nicht trägt.
- **Volatile Felder (`rating`, `availability`) gehören schemabedingt nicht in den Bulk-Crawl.** Sie ändern sich monatlich, sind heute Treiber von `web_search`-Calls (≥2 obligatorisch) und bleiben trotzdem schnell veraltet. Der Refresh-Pfad (Brief 057, eigener Track) ist die richtige Heimat. Sobald Rating und Availability aus dem Bulk-Prompt fallen, sinkt Web-Search auf 1 obligatorisch und Cost pro Buch von $0.114 auf erwartete $0.04–0.06.

Voller Audit-Kontext + die zwei Code-Reviews, die diesen Brief geformt haben, liegen in `sessions/_drafts/2026-05-09-pipeline-v2-tryout-plan.md` (gitignored Working-Doc).

## Constraints

- **Kein DB-Write, keine Migration, kein 3d-Apply.** V2-Pilot produziert genau einen committed Diff-File. Bestehende Pipeline-Tabellen (`works`, `book_details`, Junctions) und Migration 0007 (`source_kind`-Enum) bleiben unangetastet.
- **Bestehender Pipeline-Code wird nicht gelöscht.** TLBranson-Discovery, Lexicanum-Refactor, Validatoren, Slim-Prompt landen als V2-Pfad parallel zum heutigen Code. CLI-Entry-Punkt: `npm run ingest:backfill -- --pipeline=v2 --slug X` als Opt-In-Flag, alte Pipeline läuft via Default unverändert weiter. Begründung: 044/047-Diff-Reproduzierbarkeit bleibt erhalten; V2 schlägt nur dann zu, wenn der Pilot-Erfolg den Code-Konsolidierungs-Brief 055 öffnet.
- **TypeScript strict bleibt strict.** Kein `any`, kein `as unknown as`. Neue Module exportieren ihre Types. Diff-Datentyp ist explizit als `BookV2Record` typisiert und an `diff-writer.ts` gehängt.
- **Cross-platform.** TLBranson-Fetch über die gleiche `node:fetch`-API wie Wikipedia (kein Cloudflare-Verdacht hier — die Seite ist Wordpress hinter WP-Rocket-Cache). Lexicanum bleibt auf `curl`-Shell-Out wie heute (Cloudflare-Bypass). Pfade in Diff-Files mit `/`-Normalisierung.
- **Provenance pro Feld, nicht pro Buch.** `BookV2Record.fields[<fieldName>]` ist ein Objekt `{ value, source, fetchedAt, override? }`, nicht ein Skalar mit nebenstehender `fieldOrigins`-Map. Das macht den Diff selbsterklärend und Override-fähig.
- **Validatoren sind deterministisch und nachvollziehbar.** Jeder Validation-Output trägt `evidence[]` mit den raw Source-Werten, eine `severity` und ein `suggested.action`. Validatoren modifizieren Stage-1-Claims **nicht** direkt; sie produzieren `Validation[]`, das Stage 4 in den finalen `BookV2Record` foldet.
- **Web-Search-Reduktion ist hart.** Slim-Prompt setzt `max_uses: 3` (statt 6) und macht nur 1 Web-Search obligatorisch (synopsis-context). Wenn das LLM mehr Calls fordert, ist das ein Prompt-Bug, kein Pipeline-Bug.
- **Pilot-Slugs sind hart.** `--pilot=v2-tryout-1` läuft genau die fünf Bücher unter `eisenhorn-xenos`, `false-gods`, `garro`, `tales-of-heresy`, `chem-dog`. Discovery für die ersten vier kommt aus Wikipedia; *chem-dog* muss aus TLBranson kommen, sonst ist die TLBranson-Discovery-Integration nicht echt verifiziert.

## Out of scope

- **DB-Migration für `book_details.override` oder Snapshot-Tabellen.** Stage-5-Refresh-Layer (`rating_snapshots`, `availability_snapshots`) ist Schema-Vorschau im Working-Doc, kein Migration-Pin in 054. 057 macht das.
- **Lexicanum-Body-Lore-Pass** (Open Question 5, Option A). V2 dropped die heutige Body-Year-Regex und schreibt explizit, dass Lexicanum für `factionNames`/`locationNames`/`characterNames` nichts beiträgt. Body-Lore-Walker ist eigener Brief, post-Pilot.
- **Vokabular-Erweiterung** (`duty`, `legion`, `chaos`-pov_side). Open Question 2 bleibt parallel offen.
- **Modell-Entscheidung Haiku vs Sonnet** (Open Question 1). V2 läuft auf Haiku 4.5 wie heute. Cost-Vergleich macht 055 nach Voll-Lauf.
- **Refresh-Button-UI** (Brief 057). Nicht in 054.
- **Atlas-Regen.** Unverändert.
- **Phase-3.5-Dashboard-Code-Änderungen.** Der `/ingest`-Read-Path muss V2-Diffs ohne Dashboard-Edit als Card rendern können — siehe Acceptance §5. Wenn das Diff-Schema das bricht, ist es ein V2-Schema-Bug, nicht ein Dashboard-Brief.
- **Hardcover-Title-Variation-Suche.** Wir verschärfen nur den defensiven Drop bei Author-Mismatch.
- **Wikipedia-Discovery-Modul refaktorieren.** Bleibt unverändert; TLBranson kommt als zweites Discovery-Modul daneben.

## Pipeline-V2 Stage-Architektur

### Stage 0 — Discovery (Wikipedia + TLBranson)

Zwei parallele Discovery-Module, gemeinsame `DiscoveredBook`-Output-Form:

```ts
type DiscoveredBook = {
  slug: string;
  title: string;
  releaseYear?: number;
  authorHint?: string;          // wenn die Quelle einen Autor explizit hat
  seriesHint?: string;          // TLBranson: H3-Sektions-Name; Wikipedia: H3-Section-Title
  seriesIndex?: number;         // explizite Listen-Nummerierung
  isEntryPoint?: boolean;       // TLBranson "Best Entry Points"-Markierung
  sourcePages: string[];        // alle Master-Listen, in denen das Buch auftaucht
};
```

**TLBranson-Modul** (neu, `src/lib/ingestion/tlbranson/{fetch,parse}.ts`):
- Fetcht zwei Seiten: `/warhammer-40k-books-in-order/` und `/horus-heresy-reading-order/`. Beide cached unter `ingest/.cache/tlbranson/<page-slug>.html` mit gleicher Cache-Strategie wie Wikipedia heute.
- Parser strippt Amazon-Affiliate-URLs aus Bullet-Texten, extrahiert `Title`, `Author` (optional), `Year` (optional, im Newest-Block ist es ein vollständiges Datum), `seriesHint` aus dem H3-Header der umgebenden Sektion.
- "Best Entry Points"-Marker setzt `isEntryPoint=true` für die fünf Reihen unter `## Where to Start? Best Entry Points`. Ankertext-Heuristik, nicht Regex auf Buchtitel.
- Output ist Array von `DiscoveredBook`. Slug-Erzeugung mit der gleichen `slugify`-Routine wie Wikipedia.

**Wikipedia-Modul** bleibt unverändert (Code-Pfad `wikipedia/parse.ts`), nur dass sein Output ab jetzt der `DiscoveredBook`-Union beigemischt wird statt einer eigenständigen `WikipediaBookEntry`-Liste. Wenn das Type-Mapping minimal ist, reicht ein Adapter-File `discovery/types.ts`.

**Dedup** in `discovery/merge.ts`: über `slug` als primären Key, mit Fallback auf Title-normalisiert + `releaseYear`-Match (Levenshtein ≤ 2 für Title-Varianten). Wenn beide Quellen dasselbe Buch mit unterschiedlichem `releaseYear` liefern, beide als `releaseYearCandidates` durchreichen — Stage 2's `year_outlier`-Validator entscheidet später.

### Stage 1 — Source-Claims-Crawl

Pro Buch parallel bis zu drei Fetcher; jeder schreibt ein `SourceClaim`:

```ts
type SourceClaim = {
  source: "lexicanum" | "open_library" | "hardcover";
  sourceUrl: string;
  fetchedAt: string;            // ISO8601
  fields: Partial<{
    title, authorNames, releaseYear, isbn13, isbn10, pageCount,
    coverUrl, startY, endY, publisher, format, editorNames
  }>;
  raw: unknown;                 // raw payload for audit
  notes: string[];              // crawler-side findings
};
```

**Lexicanum-Refactor** (`lexicanum/parse.ts`):
- `extractUniverseYears` (Body-Year-Regex) wird **gelöscht**. `M_SCALE_INLINE_RE` und `NTH_MILL_RE` und der ganze `bodyText`-Walk fliegen raus.
- Infobox-Mapping bekommt zwei neue Felder: `Editor` (separat von `Author`, schreibt `editorNames`) und `Setting` / `Date` (wenn vorhanden, schreibt `startY`/`endY` direkt aus der Infobox-Zelle, nicht aus dem Body).
- `LEXICANUM_URL_SUFFIXES` wird nochmal erweitert um klammerfreie Anthologie-Varianten und um Redirect-Resolution (wenn die Article-Page einen `<link rel="canonical">` hat, der woanders hin zeigt → der canonical wird auch geprüft). Ziel: Tales of Heresy / Shattered Legions / Tallarn / Burden of Loyalty müssen gefunden werden.

**Open Library** (`open_library/parse.ts`):
- Bestehende 047-Hardenings bleiben (`language=eng`, `RELEASE_YEAR_DRIFT_THRESHOLD=3`).
- Neue Sanity-Checks: `pageCount < 30` → Feld nicht setzen, `notes`-Eintrag "pagecount_below_threshold". `pageCount > 1500` → Feld setzen, `notes`-Eintrag "pagecount_unusually_high" (Stage 2 picks it up).

**Hardcover** (`hardcover/parse.ts`):
- Author-Mismatch bei generischen Titeln: wenn `contributorNames` mit `expectedAuthor` keine Überlappung haben → Claim wird verworfen, **kein** Eintrag in `errors[]`. Stattdessen ein `notes`-Eintrag in einem leeren `SourceClaim` oder gar nichts. `errors[]` bleibt für echte Crawler-Fehler reserviert (HTTP 5xx, Timeout, Token-Fehler).

### Stage 2 — Validators

Modul `validators/` mit fünf Validator-Funktionen, jeweils signiert `(claims: SourceClaim[], discovered: DiscoveredBook) => Validation[]`:

```ts
type Validation = {
  field: string;
  severity: "info" | "warn" | "error";
  kind:
    | "year_outlier"
    | "edition_isbn_conflict"
    | "pagecount_outlier"
    | "author_editor_suspicion"
    | "lexicanum_missing";
  evidence: { source: string; value: unknown }[];
  suggested?: { value?: unknown; action: "use" | "drop" | "flag" | "defer_to_llm" };
  reasoning: string;
};
```

**Validator 1: `year_outlier`.** Series-Position-Cross-Check für die bekannten Anker-Reihen (HH = M30/M31, Eisenhorn = M40, Ravenor = M40, Cain = M40, Dawn-of-Fire = M42). Wenn `discovered.seriesHint` einer dieser Anker ist UND ein `startY`-Claim außerhalb ±1000 vom Anker-Range liegt → `severity: error`, `suggested.action: drop`. Series-Anker-Tabelle als Const im Validator-Modul.

**Validator 2: `edition_isbn_conflict`.** Wenn Lexicanum und OL unterschiedliche `isbn13` → `severity: warn`, `suggested.value` = niedrigere ISBN (Erstausgabe-Heuristik), `suggested.action: use`.

**Validator 3: `pagecount_outlier`.** Triggert auf die `notes`-Einträge aus Stage 1. `< 30` → `severity: error`, `drop`. `> 1500` ohne explizite Anthologie/Omnibus-Klassifikation → `severity: warn`, `flag`.

**Validator 4: `author_editor_suspicion`.** Triggert wenn:
- Lexicanum-Infobox hat `Editor`-Feld gesetzt, ODER
- `authorNames.length === 1` UND der Name matcht `/various|editor|edited.by|anonymous/i`.

→ `severity: warn`, `suggested.value: { format: "anthology" }`, `suggested.action: flag`. Kein `defer_to_llm`, weil das deterministisch entscheidbar ist.

**Validator 5: `lexicanum_missing`.** Wenn der Lexicanum-Fetcher kein Article gefunden hat → `severity: info`, `kind: lexicanum_missing`, reasoning "no lexicanum article — junctions come from LLM only". Kein Drop-Signal, nur Transparenz.

### Stage 3 — Slim LLM

Prompt-Refactor in `llm/prompt.ts`:

- `availability` und `rating`-Properties fliegen aus `PUBLISH_ENRICHMENT_TOOL.input_schema.properties`. SYSTEM_PROMPT-Sektionen 2 (Format/Availability) und 5 (Rating) werden entsprechend gekürzt: `format` bleibt drin, `availability` raus, `rating` raus.
- `factionNames`, `locationNames`, `characterNames` werden zu structured arrays mit `role`/`importance`-Annotation:

```jsonc
{
  "factions": [
    { "name": "Sons of Horus", "role": "primary" },
    { "name": "Word Bearers",  "role": "antagonist" },
    { "name": "Imperium",      "role": "background" }
  ],
  "characters": [
    { "name": "Horus Lupercal", "role": "pov" },
    { "name": "Garviel Loken",  "role": "pov" },
    { "name": "Ignace Karkasy", "role": "supporting" }
  ],
  "locations": [
    { "name": "Davin", "role": "primary" },
    { "name": "Terra", "role": "mentioned" }
  ]
}
```

Role-Vokabulare matchen das DB-Schema: `work_factions.role` ∈ `{primary, supporting, antagonist, background}` (`background` ist neu — wird durch Schema-FK nicht erzwungen, da `role` ein freies `varchar(32)` ist), `work_characters.role` ∈ `{pov, supporting, appears, mentioned}`, `work_locations.role` ∈ `{primary, secondary, mentioned}`. Kein Migration-Bedarf — Junction-`role` ist heute schon `varchar`, FK-Resolution passiert im 3d-Brief.

- `WEB_SEARCH_TOOL.max_uses: 3` (statt 6), Mindest-Calls per System-Prompt: 1 (synopsis-context). Availability-Search wird explizit aus dem Mandatory-Set entfernt.
- `PROMPT_VERSION_HASH` bekommt automatisch einen neuen Wert; das invalidiert den Cache für die fünf Pilot-Bücher und verhindert Cross-Run-Interferenz.

### Stage 4 — BookV2Record + Diff-Writer

Pro Pilot-Buch entsteht ein `BookV2Record`:

```ts
type FieldRecord<T> = {
  value: T;
  source: SourceName | "validator" | "discovery" | "llm" | "validator-corrected";
  fetchedAt: string;
  override: T | null;             // human override slot, null in pilot
  evidence?: { source: string; value: unknown }[];   // for validator-corrected fields
};

type BookV2Record = {
  slug: string;
  fields: {
    title: FieldRecord<string>;
    authorNames: FieldRecord<string[]>;
    releaseYear: FieldRecord<number>;
    seriesHint: FieldRecord<string | null>;
    seriesIndex: FieldRecord<number | null>;
    isEntryPoint: FieldRecord<boolean | null>;
    isbn13: FieldRecord<string | null>;
    isbn10: FieldRecord<string | null>;
    pageCount: FieldRecord<number | null>;
    coverUrl: FieldRecord<string | null>;
    format: FieldRecord<BookFormat | null>;
    startY: FieldRecord<number | null>;
    endY: FieldRecord<number | null>;
    synopsis: FieldRecord<string | null>;
    facetIds: FieldRecord<string[]>;
    factions: FieldRecord<{ name: string; role: string }[]>;
    locations: FieldRecord<{ name: string; role: string }[]>;
    characters: FieldRecord<{ name: string; role: string }[]>;
  };
  validations: Validation[];
  rawClaims: SourceClaim[];        // audit-trail
  rawLlmPayload: unknown;          // audit-trail (no synopsis duplication)
  llmCostSummary: { tokensIn, tokensOut, webSearches, estUsdCost };
};
```

Diff-File-Form: `ingest/.last-run/v2-pilot-YYYYMMDD-HHMM.diff.json` mit:

```jsonc
{
  "ranAt": "...",
  "pipeline": "v2",
  "pilot": "v2-tryout-1",
  "discoverySource": ["wikipedia", "tlbranson"],
  "discoveryPages": [<5 wikipedia pages> + <2 tlbranson pages>],
  "activeSources": ["lexicanum", "open_library", "hardcover", "llm"],
  "discovered": <total int>,
  "added": [<5 BookV2Records>],
  "errors": [],                   // crawler errors only, not author-mismatches
  "validationSummary": { "year_outlier": N, "pagecount_outlier": N, ... },
  "llmModel": "claude-haiku-4-5",
  "llmPromptVersion": "<new hash>",
  "llmCostSummary": { ... }
}
```

## Pilot — fünf Bücher, fünf Failure-Modes

| Slug | Discovery-Quelle | Validator-Erwartung | Wesentliche Acceptance |
|---|---|---|---|
| `eisenhorn-xenos` | Wikipedia | 0 Validations | alle deterministischen Felder gesetzt, LLM liefert Synopsis + Entitäten mit Rolle |
| `false-gods` | Wikipedia | 1× `year_outlier` (severity error) | `startY` field-record `source: "validator-corrected"` mit `evidence: [{source: "lexicanum", value: 39000}]`, finaler value entweder LLM-Web-Search-derived oder leer |
| `garro` | Wikipedia | 1× `pagecount_outlier` + ggf. 1× `author_editor_suspicion` | OL-PageCount nicht im Diff oder `source: "validator"` mit `value: null` |
| `tales-of-heresy` | Wikipedia | 1× `author_editor_suspicion`; Lexicanum-Article wird gefunden (kein `lexicanum_missing`); Hardcover silent-skipped (kein `errors[]`-Eintrag) | `format = anthology` deterministisch (von Validator 4), Junctions vom LLM mit Rollen |
| `chem-dog` | **TLBranson** (kein Wikipedia-Hit) | 0–1 Validations; `seriesHint` aus TLBranson-Sektion | Discovery erfolgreich aus TLBranson; LLM-Synopsis trägt den Hauptteil |

Wenn alle fünf Erwartungen erfüllt sind, gilt der Pilot als **trägt**. Davon abweichende Befunde (z. B. Lexicanum für *tales-of-heresy* immer noch nicht findbar) werden im Implementer-Report dokumentiert; Cowork entscheidet, ob ein Korrektur-Brief vor Brief 055 nötig ist.

## Acceptance

The session is done when:

- [ ] `npm run ingest:backfill -- --pipeline=v2 --pilot=v2-tryout-1` läuft die fünf gelisteten Bücher und produziert genau einen Diff-File unter `ingest/.last-run/v2-pilot-YYYYMMDD-HHMM.diff.json`. Diff ist committed.
- [ ] Diff enthält für jedes der fünf Bücher einen vollständigen `BookV2Record` mit `fields`, `validations`, `rawClaims`, `rawLlmPayload`, `llmCostSummary`.
- [ ] `eisenhorn-xenos`-Record hat 0 Validations und Synopsis ≥ 100 Wörter.
- [ ] `false-gods`-Record hat genau eine `year_outlier`-Validation mit `evidence[0].source === "lexicanum"` und `evidence[0].value === 39000`. Der finale `startY`-Field-Record hat `source !== "lexicanum"`.
- [ ] `garro`-Record hat eine `pagecount_outlier`-Validation; finaler `pageCount`-Field-Record ist entweder `null` oder von einer anderen Source als `open_library`.
- [ ] `tales-of-heresy`-Record hat eine `author_editor_suspicion`-Validation; `format`-Field-Record ist `"anthology"` mit `source: "validator"`. Hardcover liefert keinen Eintrag in `errors[]`.
- [ ] `chem-dog`-Record hat in `sourcePages` einen `tlbranson.com`-Eintrag. (Nicht zwingend ausschließlich; wenn Wikipedia das Buch zwischenzeitlich auch aufgenommen hat, beide Pages erscheinen.)
- [ ] Diff-File rendert im Phase-3.5-Dashboard (`/ingest`) als Card ohne Layout-Bruch. Wenn das Dashboard einen unbekannten Top-Level-Key wie `pipeline` ignoriert, ist das ok; wenn es crasht, ist die V2-Diff-Schema-Form falsch und muss adaptiert werden.
- [ ] Slim-Prompt: `llmCostSummary.totalWebSearches` über alle fünf Bücher ≤ 7 (entspricht ≤ 1.4 Searches/Buch im Mittel; obligatorisch ist 1).
- [ ] Slim-Prompt: kein `rating` oder `availability` im LLM-Output, weder in `rawLlmPayload` noch in `BookV2Record.fields`.
- [ ] Bestehender Pipeline-Pfad (`--pipeline=v1` oder Default) läuft unverändert: ein `npm run ingest:backfill -- --slug=false-gods` ohne Pipeline-Flag muss den heutigen 047-Diff-Schema produzieren. Dafür reicht ein Smoke-Lauf, kein Vollvergleich.
- [ ] `npm run lint` und `tsc --noEmit` (oder das im Repo etablierte typecheck-Script) sind grün.
- [ ] Implementer-Report dokumentiert: tatsächliche Cost/Buch, Validation-Counts pro Validator, Diff zu obigen Erwartungen, etwaige Pivot-Entscheidungen.

## Open questions

- **TLBranson-Robustheit gegen Wordpress-Updates.** Aktuell sind H3-Sektion-Headers + nummerierte Bullets der Anker. Wenn Anna Marie Carroll die Seite umbaut, bricht der Parser. Muss V2 schon eine Selektor-Fallback-Strategie haben, oder reicht "wenn der Parse 0 Bücher liefert, schlägt der Discovery-Run laut Alarm" als monatliche Maintenance-Sicherung? CC-Empfehlung in Report willkommen.
- **Series-Anker-Tabelle für Validator 1.** Heute schlage ich vor: HH/Siege-of-Terra/Eisenhorn/Ravenor/Cain/Dawn-of-Fire. Ist die Liste vollständig genug für den Pilot? Wenn ein Pilot-Buch (z. B. *garro*, technisch eine HH-Story-Sammlung um Garro) aus diesem Raster fällt, was ist das Verhalten?
- **`background`-Rolle für Faktionen.** Heute hat `work_factions.role` keinen `background`-Wert (default ist `supporting`). Wenn das LLM `Imperium` als `background` markiert, soll das im Pilot-Diff stehenbleiben oder zu `supporting` umgemappt werden? Architektur-Default: stehenlassen, 3d-Apply entscheidet das Mapping. CC kann das im Report bestätigen oder dagegen argumentieren.
- **Was tun, wenn Lexicanum's Infobox `Setting`/`Date`-Feld fehlt** (häufig bei jüngeren Releases)? Bleibt `startY`/`endY` einfach `null`, oder darf das LLM hier noch nach der Hardening-Reduktion einspringen? Vorschlag Cowork: `null` lassen; in-universe-Years sind ohnehin nur für die Chronicle relevant, und Chronicle hat eine "Era"-Fallback-Anzeige für Bücher ohne harten `startY`.

## Notes

- Working-Doc mit voller Audit-Begründung: `sessions/_drafts/2026-05-09-pipeline-v2-tryout-plan.md` (gitignored, Cowork pflegt parallel; nicht maßgeblich für die Implementierung — der Brief ist authoritativ).
- Design-Freedom-Block fehlt absichtlich: dieser Brief berührt kein UI. Diff-Schema, Module-Layout und CLI-Flag-Form sind Architektur-Entscheidungen.
- **Cowork-Carry-over post-054:** Open Question 4 (Anthologie-Re-Test für 047 Hebel E) wird durch *tales-of-heresy* im Pilot empirisch getestet — wenn der Pilot trägt, wandert OQ4 als adressiert in `deferred-questions.md`. Open Question 5 (Lexicanum-Junction-Daten) wird durch V2 strukturell beantwortet (Body-Lore-Pass = eigener Brief, FIELD_PRIORITY für Junctions reduziert sich implizit auf `[llm]`). OQ1, OQ2, OQ3 bleiben offen wie heute.
- Brief 055 (V2-Voll-Lauf) wartet auf Pilot-Erfolg und liegt nicht in dieser Session.
