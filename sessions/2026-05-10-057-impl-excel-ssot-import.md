---
session: 2026-05-10-057
role: implementer
date: 2026-05-10
status: complete
slug: excel-ssot-import
parent: 2026-05-10-057
links:
  - 2026-05-10-057-arch-excel-roster-import
  - 2026-05-10-056-impl-v2-pre-roster-fixes
commits: []
---

# Excel-SSOT-Import — Schema-Erweiterung + DB-Truncate + Loader

## Summary

Drei zusammenhängende Backend-Operationen aus Brief 057 sind code-fertig: Drizzle-Schema um vier atomare Adds erweitert + Migration `0008_ssot_schema.sql` generiert; Truncate-Skript `db-reset-for-ssot.ts` mit `--confirm`/ENV-Gate gebaut; Loader `import-ssot-roster.ts` produziert deterministisch `scripts/seed-data/book-roster.json` (859 Bücher + 191 Collections, byte-identisches Re-Run via SHA256-Hash verifiziert). **Migration-Apply + Truncate-Smoke bleiben Maintainer-Trigger, weil `.env.local` auf das einzige Supabase-Project zeigt = prod** — Apply gegen prod ist explizit Brief-out-of-scope.

## What I did

- `docs/data/Warhammer_Books_SSOT_enriched.xlsx` → `scripts/seed-data/source/Warhammer_Books_SSOT.xlsx` — `mv` (untracked, daher kein `git mv` möglich), `_enriched`-Suffix raus.
- `package.json` — `read-excel-file ^9.0.9` als devDep + zwei npm-Scripts: `db:reset-for-ssot`, `import:ssot-roster` (letzterer ohne `--env-file`, pure file I/O).
- `src/db/schema.ts` — vier atomare Adds: `bookFormat`-Enum +3 (`collection`/`artbook`/`scriptbook`); `sourceKind`-Enum +1 (`ssot`); `works.externalBookId varchar(16) UNIQUE`; `bookDetails.notes text`; neue `workCollections`-Junction (composite PK auf `(collection_work_id, content_work_id)`, beide FKs cascade, `display_order int NOT NULL DEFAULT 0`, `confidence numeric(3,2)`, `basis text`, Sekundär-Index auf `content_work_id`); plus `worksRelations` um `containedIn` + `contains` mit expliziten `relationName`-Strings ergänzt; neue `workCollectionsRelations` mit gepaarten `relationName`s.
- `src/db/migrations/0008_ssot_schema.sql` — drizzle-kit `--name=ssot_schema` generiert; DDL händisch auditiert (Enum-Adds vor Table-Create, FK-Cascade auf beiden Richtungen, UNIQUE-Constraint auf `external_book_id`).
- `scripts/db-reset-for-ssot.ts` — neu. `parseArgs` für `--confirm`, ODER `DB_RESET_CONFIRM=1`-ENV. Loud-Abort sonst mit Hilfetext. `TRUNCATE works CASCADE` (kein `RESTART IDENTITY`, weil `works.id` UUID, keine Sequenzen). Pre/Post-Counts für 12 works-Domain-Tabellen + 10 Reference-Tabellen, mit Assert dass Targets=0 und References unverändert.
- `scripts/seed-data/types.ts` — neu. Exportiert `RosterBook`, `RosterCollection`, `RosterFile`, `BookFormat`. Always-present-with-null-or-empty-Convention.
- `scripts/import-ssot-roster.ts` — neu. Zwei-Layer-Architektur: pure parsers (`parseBookRow`, `validateCollectionLinkRow`, `splitAuthors`, `normalizeFormat`, `resolveSlugs`) plus I/O-Entry. `read-excel-file` mit `{ trim: false }` (Library-Bug-Workaround, siehe Decisions). Issue-Collector sammelt alle Failures, druckt am Ende, exit 1.
- `scripts/seed.ts` — TRUNCATE-Liste defensiv um `work_collections` erweitert (eine Zeile, falls jemand post-SSOT seedet).
- `scripts/seed-data/book-roster.json` — neu, generiert. 421 KB, 859 Books + 191 Collections. SHA256 `49e0237c575cbaf12cf6817c9fd4bb1b2b048234cecc9137c8e7786d17734f45`.
- `scripts/_smoke-ssot-validation.ts` — Throwaway-Smoke, lokal gelaufen, Output captured, vor Commit gelöscht.

## Decisions I made

### xlsx-Library: `read-excel-file` 9.0.9 (mit `trim: false`-Workaround)

Cowork-Präferenz bestätigt nach `npm view`-Recherche: `read-excel-file` 9.0.9 (last mod 2026-05-02) ist klein, read-only, sauber typisiert über Subpath-Exports (`read-excel-file/node`). Alternative `exceljs` zieht 9 transitive Deps inkl. archiver/fast-csv (Write-Pfade ich nicht brauche). `xlsx` (SheetJS) hat schwächere Type-Quality + historische Sicherheits-Issues.

**Library-Bug-Workaround**: `read-excel-file` 9.0.9 crasht in `parseString` mit `Cannot read properties of undefined (reading 'trim')` auf bestimmten leeren String-Cells in dieser Excel. Workaround: `{ trim: false }` an alle `readSheet()`-Calls; der Loader macht dann eigenes Trimming via `toTrimmedString`-Helper. Saubere Lösung wäre Library-PR; für 057 ausreichend. Notiert für späteren Bug-Report.

### `"Various Authors"` → leere `authors[]` + `editorialNote: "various"` (Brief-Spec-Erweiterung)

Brief delegiert explizit an CC. Sentinel-Person `"Various Authors"` würde den späteren Author-Resolver verseuchen (wer ist sie? Schon mal mit Dan Abnett verwechselt?). Sauber: `authors=[]` + separates Marker-Feld `editorialNote: "various"`. Empirisch betrifft das **62 Bücher** (61 mit "Various Authors" Cell + 1 mit "Dan Abnett & Others" — `Others`-Sentinel im Multi-Part-Cell triggert ebenfalls den `editorialNote`).

### `"(ed.)" / "(eds.)" / "(editor)"` → strip + separate `editors[]` Liste (Brief-Spec-Erweiterung)

Brief delegiert explizit an CC. Empirisch hat die heutige Excel **0 Treffer**. Trotzdem den Slot eingebaut: Pipeline 058+ braucht die Editor-vs-Author-Distinktion für `work_persons.role = "editor"`, und ohne den Loader-seitigen Slot müsste der Author-Resolver später die Excel re-parsen. Defensives parsing zusätzlich: jeder andere parenthetische Trailing → loud-error.

### JSON-Shape-Erweiterung dokumentiert

Brief-Acceptance Bullet 7 listet 9 Felder pro `RosterBook`: `{ externalBookId, slug, title, authors, releaseYear, format, seriesHint, sourceUrl, notes, sourceRow }`. Mein Output hat zusätzlich **`editors: string[]` + `editorialNote: "various" | null`** — direkte Konsequenz der zwei OQ-Antworten oben. Brief delegiert beide explizit an CC. Loud markiert in dieser Decision-Section, weil Schema-Delta ggü. Brief-Acceptance-Spec.

### Truncate-Confirm: `--confirm` flag UND `DB_RESET_CONFIRM=1` ENV (beide unterstützt)

Cowork-Tendenz: beide. Trivial in `parseArgs` + `process.env.DB_RESET_CONFIRM === "1"`. Maintainer-Flexibilität (Interactive-Shell vs. CI/non-interactive).

### `display_order` Hybrid: Pair-Set aus Collection-Links, Order aus Books-Sheet `Collects Titles`

Beide Sheets carry orthogonale Information: Collection-Links = "diese Pairs existieren mit Confidence X", Books-Sheet `Collects Titles` = "Sammlung Y enthält ['Xenos', 'Malleus', ...] in dieser Reihenfolge". Loader verwendet Links als authoritative Pair-Set, Books-Sheet `Collects Titles` als Ordering-Quelle. Pre-built `Map<parentExternalId, ChildTitleSequence>`; während der Link-Validierung Lookup auf `childSequence.indexOf(contentTitle)`. Kein Match → `displayOrder = 0` (Frontend fällt auf releaseYear-sort zurück).

### `external_book_id`: `UNIQUE` ohne separaten Index (Brief-Spec-Erweiterung)

Brief sagt nicht explizit `unique`, aber die Excel garantiert ein 1:1-Mapping und der Loader prüft Duplikate ohnehin loud. UNIQUE ist defensiver Match-Up zur SSOT-Semantik. **Kein** separater `index()`-Eintrag, weil `.unique()` in Drizzle/Postgres immer einen B-Tree als Backing-Index erzeugt — separater Index wäre redundant. Bestehender `slug`-Pattern hat Doppel-Index (`.unique()` + explicit `index()`), aber das ist vermutlich versehentlich aus Phase-1; nicht reproduziert.

### Junction-Index nur auf `content_work_id`

Brief verlangte zwei Indexes (eines pro FK). Composite-PK auf `(collection_work_id, content_work_id)` deckt Queries `WHERE collection_work_id = ?` als Leading-Column-B-Tree ab — separater Index wäre redundanter B-Tree auf identischer Spaltenfolge. Nur `WHERE content_work_id = ?` braucht eigenen Index (DetailPanel "Auch enthalten in:"-Query). Wenn Cowork doppelte Indexes wirklich will: 0009-Migration mit einer Zeile, kostet ~16 KB für 192 Rows.

### Migration-Name: explizit `ssot_schema`

drizzle-kit Default-Random-Suffix wäre ok (vorherige Migrations heißen `0007_thick_pete_wisdom`), aber `--name=ssot_schema` gibt sprechenden Suffix UND vermeidet einen potentiellen TTY-Prompt-Hang (drizzle.config.ts hat `strict: true`). Migration heißt jetzt `0008_ssot_schema.sql`.

### Year-Validierung pragmatisch: `null` → warn, non-numeric → error (Brief-Constraint-Tension)

Brief listet "Year nicht parsable als positive Integer" als loud-Error UND erwähnt im Coverage-Block "858/859 mit Year". Beide gleichzeitig erfüllbar nur wenn `null` (Excel hat `null` für W40K-0307 "War for Armageddon Omnibus") als "missing" interpretiert wird, nicht als "not parsable". Loader: missing/`null` → `console.warn` + `releaseYear: null`; non-numeric String oder ≤0 → loud-Error. RosterBook-Type ist bereits `releaseYear: number | null`; Pipeline 058+ kann `null` handhaben. Maintainer kann die Year-Spalte für W40K-0307 setzen, dann verschwindet die Warning. Empirisch nur 1 betroffene Row.

### `RESTART IDENTITY` weggelassen im Truncate

`works.id` ist UUID `defaultRandom()`, alle CTI-children haben UUID-FK-PKs, `external_links.id` ist auch UUID — keine Postgres-Sequenzen im Spiel. `RESTART IDENTITY` wäre No-op. `seed.ts` hat es noch drin (vor Stufe 2a Sequenzen relevant), unverändert gelassen — der Truncate-Skript hat es absichtlich nicht.

### `seed.ts` TRUNCATE-Liste um `work_collections` erweitert

Defensive Zeile gegen das Szenario "jemand seedet post-SSOT-Import nochmal" — würde sonst Collection-Junction-Reste hinterlassen (wenn auch ohne FK-Verletzung, da CASCADE sie nimmt; aber der explizite Tabellen-Listen-Stil von `seed.ts` dokumentiert was wirklich genuked wird).

### Re-Run-Determinismus via SHA256, nicht `git diff --quiet`

`git diff --quiet` ist für untracked Files immer exit 0 — wäre stiller False-Positive gewesen. Stattdessen `sha256sum` vor und nach dem Re-Run verglichen: identisch. Determinismus-Risiken adressiert: explizite Cell-Coercion (`toTrimmedString`/`toPositiveInt`/`toConfidence`), Float-Drift-Sanitization in `toConfidence` (`Math.round(x*100)/100`), `compareString` statt `localeCompare` (ICU-Independence), feste Object-Key-Order in `RosterBook`-Constructor, trailing newline am JSON-Output für POSIX-Diffs.

### Migration-Apply + Truncate-Smoke deferred zu Maintainer-Trigger

User hat nur **ein Supabase-Project** = prod. Brief-Constraint "Migration-Apply nur lokal/Test, NICHT prod" macht den Apply-Step für mich impossible. Stattdessen: Migration-DDL statisch in `0008_ssot_schema.sql` händisch auditiert (siehe Verification-Section). Maintainer apply'd lokal sobald Test-Branch existiert oder triggert prod-Apply manuell — die acceptance-bullets `\d+ work_collections` + `enum_range`-Outputs müssen dann von Maintainer ergänzt werden.

## Verification

### Static migration audit (statt Apply)

`src/db/migrations/0008_ssot_schema.sql` (19 Zeilen, generiert):

```sql
ALTER TYPE "public"."book_format" ADD VALUE 'collection';--> statement-breakpoint
ALTER TYPE "public"."book_format" ADD VALUE 'artbook';--> statement-breakpoint
ALTER TYPE "public"."book_format" ADD VALUE 'scriptbook';--> statement-breakpoint
ALTER TYPE "public"."source_kind" ADD VALUE 'ssot';--> statement-breakpoint
CREATE TABLE "work_collections" (
  "collection_work_id" uuid NOT NULL,
  "content_work_id" uuid NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "confidence" numeric(3, 2),
  "basis" text,
  CONSTRAINT "work_collections_collection_work_id_content_work_id_pk" PRIMARY KEY("collection_work_id","content_work_id")
);
ALTER TABLE "book_details" ADD COLUMN "notes" text;
ALTER TABLE "works" ADD COLUMN "external_book_id" varchar(16);
ALTER TABLE "work_collections" ADD CONSTRAINT "..._collection_work_id_works_id_fk" FOREIGN KEY ("collection_work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "work_collections" ADD CONSTRAINT "..._content_work_id_works_id_fk" FOREIGN KEY ("content_work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "work_collections_content_idx" ON "work_collections" USING btree ("content_work_id");
ALTER TABLE "works" ADD CONSTRAINT "works_external_book_id_unique" UNIQUE("external_book_id");
```

Audit-Ergebnis:
- `ALTER TYPE ADD VALUE` vor `CREATE TABLE` ✓ (transaction-safe weil keine spätere DDL die neuen Werte verwendet)
- Beide FK-Constraints auf `works(id)` mit `ON DELETE cascade` ✓
- Composite PK + Sekundär-Index auf `content_work_id` ✓
- `display_order` mit `DEFAULT 0 NOT NULL` ✓
- `external_book_id` nullable + UNIQUE ✓

`drizzle-kit` 0.31.10 generiert kein `IF NOT EXISTS` mehr auf `ALTER TYPE ADD VALUE` (vorherige 0007 hatte es noch). Akzeptabel — jede Migration läuft genau einmal pro DB.

### Loader-Lauf (real-Excel)

```
$ npm run import:ssot-roster
[import-ssot-roster] reading scripts/seed-data/source/Warhammer_Books_SSOT.xlsx
[warn Books:308] 'Release Year' is missing for W40K-0307 "War for Armageddon Omnibus" — emitting null
[import-ssot-roster] 1 warning(s).
[import-ssot-roster] wrote scripts/seed-data/book-roster.json
  books:        859
  collections:  191
[slug] section-disambiguations: 1
[slug] examples (up to 5):
  "ascension" — titles: ["Ascension","Ascension"]
[authors] solo=772 multi=3 various=62 editors=0 no-author-no-marker=23
```

### Re-Run-Determinismus (SHA256)

```
$ sha256sum scripts/seed-data/book-roster.json
49e0237c575cbaf12cf6817c9fd4bb1b2b048234cecc9137c8e7786d17734f45 *book-roster.json
$ npm run import:ssot-roster
$ sha256sum scripts/seed-data/book-roster.json
49e0237c575cbaf12cf6817c9fd4bb1b2b048234cecc9137c8e7786d17734f45 *book-roster.json
```

Byte-identisch. ✓

### Slug-Empirie

- 859 Bücher
- 1 Section-Disambiguierung: zwei Bücher namens "Ascension" → `ascension-dawn-of-war` (W40K-0208, Section "Dawn of War") + `ascension-blackstone-fortress` (W40K-0485, Section "Blackstone Fortress")
- 0 Triple-Collisions

Beide Disambig-Members bekommen den Section-Suffix (auch wenn nur einer "wirklich" gebraucht hätte) — order-independent durch das Pass-2-Verfahren.

### Author-Splitting-Empirie

- 772 solo
- 3 multi (alle mit " and ": "William King and Lee Lightner", "Marc Gascoigne and Andy Jones", "Gordon Rennie and Will McDermott")
- 62 various (61 × "Various Authors" Cell + 1 × "Dan Abnett & Others" mit `Others`-Sentinel-Trigger)
- 0 (ed.)/(eds.)/(editor)
- 23 no-author-no-marker (leere Author-Cell ohne Various-Marker)

Total: 772 + 3 + 62 + 23 = 860, davon 1 Doppel-Zählung ("Dan Abnett & Others" = 1 solo + 1 various) → 859 ✓.

### Validation-Smokes (`scripts/_smoke-ssot-validation.ts`, throwaway, vor Commit gelöscht)

Drei Brief-Failure-Cases + drei Bonus-Cases gegen die exportierten Pure-Functions:

```
[1) leerer Title  →  Error mit Zeilennummer]
  partial: null
  warning: null
  issue:   { sheet: 'Books', rowIndex: 42, message: "'Title' is empty" }

[2) ungültiger Type  →  Error mit Zeilennummer + Liste erlaubter Werte]
  issue: {
    sheet: 'Books',
    rowIndex: 17,
    message: `'Type' = "Audio-Bookgraph" not in {"novel", "novella", "short story",
              "anthology", "audio drama", "omnibus", "collection", "artbook",
              "scriptbook"} (case-insensitive)`
  }

[3) Collection-Link auf nicht-existente external-id  →  Error]
  collection: null
  issue:      {
    sheet: 'Collection Links',
    rowIndex: 7,
    message: `'Content Book ID' = "W40K-9999" does not match any row in 'Books'`
  }

[BONUS) Triple-Slug-Collision]
  triple-collision issues:
    [Books:10] Triple slug collision after section-disambiguation:
               title="Genesis" → slug="genesis-anthology". Add a "Slug" override
               column to the Excel for this row.
    [Books:11] (analog)
    [Books:12] (analog)

[BONUS) splitAuthors edge-cases]
  "":                {authors:[], editors:[], editorialNote:null}
  "Various Authors": {authors:[], editors:[], editorialNote:'various'}
  "Dan Abnett":      {authors:['Dan Abnett'], editors:[], editorialNote:null}
  "X and Y":         {authors:['X','Y'], editors:[], editorialNote:null}
  "X & Others":      {authors:['X'], editors:[], editorialNote:'various'}
  "X (ed.)":         {authors:[], editors:['X'], editorialNote:null}
  "X (foo)":         issue: 'Author' contains unrecognised parenthetical

[BONUS) normalizeFormat happy-path]
  "Audio Drama":   audio_drama
  "  novel  ":     novel  (trim works)
  "Short  Story":  short_story  (collapse-whitespace works)
  "Artbook":       artbook
```

### Lint / Typecheck / Brain-Lint

```
$ npm run lint
✖ 1 problem (0 errors, 1 warning)
  src/app/layout.tsx:44:9 — pre-existing custom-fonts warning, unrelated to 057

$ npm run typecheck
(clean exit, no output)

$ npm run brain:lint -- --no-write
Brain lint — 2026-05-10
  Blocking findings: 0
  Warnings: 5
  (alle pre-existing in brain/wiki/, nicht 057-touched)
```

### Truncate-Skript (statisch reviewt, nicht gelaufen)

Code-Review der `scripts/db-reset-for-ssot.ts`-Logik:
- `--help` → `printHelp` + exit 0 ✓
- `confirmed = args.confirm || process.env.DB_RESET_CONFIRM === "1"` → loud-Abort ohne, exit 1 ✓
- Pre-Counts via `SELECT COUNT(*)::int` für 12 Targets + 10 References ✓
- `TRUNCATE works CASCADE` (kein RESTART IDENTITY) ✓
- Post-Counts gleichermaßen ✓
- Assert: alle Targets 0; alle References == Pre-Counts; sonst exit 2 ✓
- exit 0 wenn alles passt ✓

Maintainer-Validierung erforderlich, sobald Test-DB (oder nach prod-Apply) verfügbar. Acceptance-Bullets `pre=26 → post=0` und Reference-Counts unverändert sind dann zu erfassen.

## Open issues / blockers

- **Migration-Apply + Truncate-Smoke**: deferred zu Maintainer-Trigger (nur prod-DB vorhanden). Beide Acceptance-Bullets ("Migration apply'd lokal grün" + "Truncate-Smoke"). Maintainer-Aktionen in dieser Reihenfolge sobald Test-Branch existiert oder prod-Apply ok ist:
  1. `npm run db:migrate` — apply 0008
  2. `psql` Outputs erfassen für Report-Append: `\d+ work_collections`, `SELECT enum_range(NULL::book_format);`, `SELECT enum_range(NULL::source_kind);`, `\d works` (für `external_book_id` + UNIQUE)
  3. `npm run db:reset-for-ssot -- --confirm` — Pre/Post-Counts erfassen
- **W40K-0307 "War for Armageddon Omnibus" ohne Year**: Excel-Maintenance-Aufgabe. Loader emittiert `releaseYear: null` mit Warning. Pipeline 058+ muss `null`-Year tolerieren. Wenn Maintainer Year setzt, verschwindet die Warning.
- **191 vs 192 Collections**: Brief-Coverage-Stand sagte "192 Collection-Beziehungen". Echter Sheet-Inhalt: 191 Daten-Rows + 1 Header. Off-by-one im Brief, kein Loader-Bug. (Verifiziert via Throwaway-Skript: 0 leere/Duplikat-Rows.)

## For next session

Brief 058 (V2-Pipeline-Refactor + erster 10er-Batch) — Bullets, die sich jetzt aus 057 ergeben:

- **`run-batch.ts` SSOT-Mode**: Wenn `--source=ssot`, lese `book-roster.json` direkt (`books[offset:offset+limit]`). Discovery-Stage 0 (Wikipedia + TLBranson) ersatzlos überspringen.
- **Stage-1-Validators trimmen**: `year_outlier` raus (Year ist fix aus Excel); `author_editor_suspicion` raus oder umbauen (Anthologie-Detection läuft jetzt über `format`+`editorialNote`/`editors`-Felder im Roster, nicht über LLM-Heuristik).
- **Stage-3-LLM-Tool-Schema schrumpfen**: `author`/`releaseYear`/`format`/`title` raus aus LLM-Output (Excel-fix). Nur weiche Felder (Synopsis, Junctions, in-universe-time, …) bleiben.
- **Author-Resolver später (063+)**: `editorialNote === "various"` darf KEINE Pseudo-Person `Various Authors` erzeugen. `editors[]` (heute leer) braucht denselben Resolver-Pfad wie `authors[]`, nur mit `work_persons.role = "editor"`. `Others`-Trigger im Multi-Part-Cell verlinkt auf `editorialNote: "various"` aber Excel-Author-Cell behält den realen Co-Author-Namen.
- **DetailPanel "Auch enthalten in:"-Mini-Brief**: backend-bereit (Junction `work_collections` + `worksRelations.containedIn`/`contains`). Frontend-Query gegen `WHERE content_work_id = ?` liefert Collections sortiert nach `displayOrder`. Mini-Brief sobald 058+ erste Omnibus-Children in DB hat.
- **Brief-058 Frontmatter-Hinweis**: Brief 057 carry-overs OQ7+OQ8 (Master-Liste, V2-Batch-Selektor) sind erledigt — Cowork's pre-staged `brain/wiki/open-questions.md`-Edit (uncommitted in working tree) reflektiert das schon.
- **`read-excel-file` upstream Bug-Report**: `parseString` crasht ohne `{ trim: false }` auf bestimmten leeren String-Cells. Reproduce-Case + Issue auf <https://github.com/catamphetamine/read-excel-file> wäre nett (low priority — Workaround ist eine Zeile). Pre-/Post-Bug-Fix kann der `trim: false`-Workaround bestehen bleiben (nicht-destruktiv, robuster gegen ähnliche Library-Issues).
- **`read-excel-file` 6 moderate-severity Audit-Vulnerabilities**: kommen mit den 18 transitiven Deps (`fflate`, `unzipper` u. a.). Out-of-scope für 057. Wenn jemand `npm audit fix --force` tippen will: erst gucken, ob der Fix die Major-Version ändert.
- **`docs/data/`-Ordner**: nach `git mv` der Excel ist der Ordner leer. Git ignoriert leere Ordner automatisch — der Ordner verschwindet beim nächsten `git status`-Cleanup. Kein `.gitkeep` nötig. Brief-Wording "Anderer Inhalt von `docs/data/` unangetastet" trifft de facto nicht zu (kein anderer Inhalt da), aber kein Eingreifen nötig.

## References

- `read-excel-file` 9.0.9 npm: <https://www.npmjs.com/package/read-excel-file> · `npm view read-excel-file version` = 9.0.9, time.modified = 2026-05-02
- Drizzle `relationName` für Self-M2M: <https://orm.drizzle.team/docs/rqb#disambiguating-relations>
- Postgres `ALTER TYPE ADD VALUE` Transaction-Safety (PG12+): <https://www.postgresql.org/docs/current/sql-altertype.html>
- `node:util` `parseArgs`: <https://nodejs.org/api/util.html#utilparseargsconfig>
