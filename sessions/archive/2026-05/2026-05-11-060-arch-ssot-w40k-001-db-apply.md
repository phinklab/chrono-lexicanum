---
session: 2026-05-11-060
role: architect
date: 2026-05-11
status: implemented
slug: ssot-w40k-001-db-apply
parent: 2026-05-11-058
links:
  - 2026-05-11-058-arch-v2-ssot-mode-first-batch
  - 2026-05-11-058-impl-v2-ssot-mode-first-batch
  - 2026-05-11-059-arch-cc-direct-overrides-w40k-002
  - 2026-05-10-057-impl-excel-ssot-import
commits: []
---

# Erster DB-Apply: ssot-w40k-001 mit Cowork-Override-Authority

## Goal

Die 10 Bücher aus `ssot-w40k-001` (W40K-0001..W40K-0010, Eisenhorn + Ravenor + Bequin + The Magos) in die Produktions-Postgres schreiben — mit Cowork-curated Override-Daten aus `scripts/seed-data/manual-overrides-ssot-w40k-001.json` als Authority, NICHT mit dem Haiku-Output aus dem 058-Diff. Erster aktiver DB-Schreibpfad der Pipeline überhaupt; öffnet Phase 3d für den Showcase-Cluster. Die 10 Bücher sollen unter `/buch/xenos`, `/buch/malleus`, …, `/buch/the-magos` mit korrekten Synopses, Tags und resolvable Junctions erreichbar sein. Volle 3d-Sweep über alle 859 Bücher bleibt verschoben hinter Resolver-Brief (OQ4 + OQ5).

## Context

Sequenz: Brief 058 hat den SSOT-Modus aktiviert (`ssot-w40k-001` als erster 10er-Batch, $0.382, sauberer Diff). Maintainer hat anschließend einen Side-by-Side gegen einen Cowork-Opus-Lauf der selben 10 Bücher gemacht (siehe README-Active-Threads-Tabelle, Session-Logs sind in der Conversation, nicht als separate impl-Datei). Cowork-Output hatte signifikant weniger Plot-Halluzinationen als Haiku (3-4 plot-relevante Fehler bei Haiku über 10 Bücher: Emperor's Children in *Xenos*, Cherubael in *Xenos* pre-Einführung, Beta vs. Alizebeth Bequin in *Pariah*, Valentin Drusher statt Magos Bure in *The Magos*), plus systematisch dünneres Omnibus-Tagging und einen verfehlten `data_conflict`-Flag in *The Magos* (SSOT sagt `novel`, Buch ist real eine Collection). Maintainer-Entscheidung: Cowork's 10er-Datensatz wird als Authority für den ersten DB-Apply genutzt.

Brief 059 läuft parallel den A/B-Pilot (Haiku vs. CC-Direct) auf `ssot-w40k-002`, ohne DB-Apply. Brief 060 ist also der erste echte Schreibpfad, scope-limited auf 10 Bücher. Für 859-Buch-Skala (ohne Hand-Override-Authority) kommt der Resolver-Brief und dann ein 3d-Sweep — Sequenz ist: 059 (A/B Pilot diff-only) → 060 (DB-Apply 10 Cowork-Override) → 061+ (weitere 10er-Batches, Pipeline-Output direkt in DB) → 062-063 (Resolver für Surface-Forms) → 3d-Sweep für die Reste.

**Schema-Stand (verifiziert via `src/db/schema.ts`-Read post-058)**:

- `sourceKind` enum hat `wikipedia`/`open_library`/`hardcover`/`llm`/`ssot` — Migration 0007 ist **applied** (entgegen Brain post-057-Stand; siehe Brain-Update-Trigger unten).
- `bookFormat` enum hat 9 Werte inkl. `collection`/`artbook`/`scriptbook` — Migration 0008 applied.
- `works.externalBookId varchar(16) UNIQUE` existiert. Idempotenz-Anker für Re-Apply.
- `bookDetails.notes text` existiert.
- `work_collections` Junction existiert (composite PK `(collection_work_id, content_work_id)`, FK-Cascade auf beiden Seiten, `displayOrder`/`confidence`/`basis`-Spalten).
- Truncate-Skript `db-reset-for-ssot.ts` lief in 058-Verifikations-Append: alle 12 work-Domain-Tabellen sind auf 0. Reference-Tabellen unverändert.

**Was die canonical Reference-Tables abdecken / nicht abdecken** (für die 10 Bücher):

- `factions.json` (29 Einträge): hat `inquisition`, `chaos`, `mechanicus` (für Adeptus Mechanicus in *Hereticus*/*The Magos*), `necrons` (für *The Magos*). Hat NICHT `Ordo Xenos`, `Ordo Malleus`, `Ordo Hereticus` als Sub-Inquisition-Einträge. **Mapping-Regel**: `Ordo Xenos`/`Ordo Malleus`/`Ordo Hereticus` werden als `factionId = "inquisition"` mit `role: <wie im JSON>` resolved; falls die Junction-Row für `inquisition` schon belegt ist (composite PK), wird die höchste Rolle behalten (`primary` > `supporting` > `background`).
- `locations.json` (28 Einträge): Cartography-Anker (Terra, Mars, Calth, Cadia, Eye of Terror, etc.). Hat NICHT `Hubris`, `Gudrun`, `Damask`, `Thracian Primaris`, `Spaeton House`, `Eustis Majoris`, `Sancour`, `Petropolis`, `Yassilli Sarum`, `Queen Mab`, `Gershom`, `Sameter`, `Eechan`, `Durer`, `Helican Subsector`, `Scarus Sector`, `Calixis Sector`. **Mapping-Regel**: Nur `Eye of Terror` in *Ravenor* mentioned wird als FK-aufgelöste `work_locations`-Row geschrieben. Alle anderen Surface-Forms gehen in `bookDetails.notes` als JSON-Anhang (siehe unten).
- `persons.json` (12 Einträge): Dan Abnett ist enthalten als `dan-abnett` (oder gleichwertiger Slug — CC verifiziert). Alle 10 Bücher haben Abnett als Author, also nur ein einziger `work_persons.personId`-Wert wiederholt. **Mapping-Regel**: pro Buch eine `work_persons`-Row mit `role: "author"`, `displayOrder: 0`.
- `characters` Table: **leer** (0 Rows). Alle in-universe Characters in den 10 Büchern (Eisenhorn, Ravenor, Bequin, Cherubael, Glaw, etc.) haben keine canonical Row. **Mapping-Regel**: KEINE `work_characters`-Rows geschrieben. Alle Characters gehen in `bookDetails.notes` als JSON-Anhang. Resolver-Brief (062-063) entscheidet später ob (a) charakter-table mit Top-100 populated wird oder (b) Hybrid mit Surface-Forms persistent bleibt.
- `eras.json` (7 Einträge, M30-M42): alle 10 Bücher sind M41 (40K mainline pre-Indomitus). CC liest `eras.json` und identifiziert den Era-ID-String für M41 (vermutlich `m41` oder `late_m41`); setzt `bookDetails.primaryEraId` für alle 10 Bücher auf diesen Wert.
- `facet_values.json` (85 Einträge): vollständig populated. Meine Override-facetIds (`book`, `male`, `inquisitor`, `imperium`, `sector`, `series_start`, `standard`, `mystery`, `journey`, `grimdark`, `philosophical`, `hubris`, `doubt`, `cw_violence`, `cw_death`, `cw_disturbing`, `en`, plus restliche) sind alle Standard-IDs aus dem Katalog. CC verifiziert beim Apply jeden facetId gegen `facet_values.id` — falls einer fehlt (sollte nicht vorkommen), loud-Error und Halt.

**`work_collections` für die zwei Omnibuses**: `book-roster.json` hat 191 Collection-Refs total. Für die zwei W40K-Omnibuses in `ssot-w40k-001`:

- *Eisenhorn Omnibus* (W40K-0004) enthält: *Xenos* (W40K-0001), *Malleus* (W40K-0002), *Hereticus* (W40K-0003) plus "Missing in Action" + "Backcloth for a Crown Additional" (die zwei Shorts haben keine eigenen W40K-IDs im Roster — bleiben für jetzt nur in `bookDetails.notes`).
- *Ravenor: The Omnibus* (W40K-0008) enthält: *Ravenor* (W40K-0005), *Ravenor Returned* (W40K-0006), *Ravenor Rogue* (W40K-0007) plus "Thorn Wishes Talon" + "Playing Patience" (analog, ohne eigene W40K-IDs).

CC liest `book-roster.json.collections[]` und schreibt die `work_collections`-Junction-Rows mit `displayOrder` aus Excel-Reihenfolge, `confidence` und `basis` aus den Excel-Feldern. **Wichtig**: collection-FKs und content-FKs zeigen auf `works.id` (UUIDs), NICHT auf `external_book_id`. Lookup-Logik: Excel-Roster liefert `externalBookId`-Strings → `works`-Insert produziert UUIDs → mapping-table in-memory hält `externalBookId → UUID` → Junction-Rows nutzen die UUIDs.

## Constraints

- **Authority ist `scripts/seed-data/manual-overrides-ssot-w40k-001.json`.** CC liest dieses File als Single-Source-of-Truth für die weichen Felder (`synopsis`, `facetIds`, `factions`-Surface-Forms, `locations`-Surface-Forms, `characters`-Surface-Forms, `flags`). Harte Felder (`title`, `authors`, `releaseYear`, `format`, `seriesHint`) kommen weiterhin aus `book-roster.json` (SSOT-Excel). Der Haiku-Diff `ingest/.last-run/v2-batch-20260510-2227.diff.json` wird **NICHT** als Input verwendet — er bleibt im Repo als Audit-Trail, aber für die DB-Werte ist er irrelevant.

- **`data_conflict`-Flag aus dem Override-File wird angewandt.** Das Override-File hat einen `flags`-Eintrag für *The Magos*: SSOT-format ist `novel`, Suggestion ist `collection`. CC's Apply-Logik: wenn ein Override-Flag `kind: "data_conflict"`, `field: "format"`, `suggestion: <X>` enthält, wird der `bookDetails.format` auf den Suggestion-Wert (`collection`) gesetzt statt auf den SSOT-Wert (`novel`). Dokumentiert in `bookDetails.notes`-JSON-Anhang: `formatOverride: { from: "novel", to: "collection", reason: "..." }`.

- **Surface-Form-Persistierung in `bookDetails.notes`.** Alle Locations und Characters (und nicht-kanonisch-resolvable Factions wie `Ordo Xenos`) gehen in einen strukturierten JSON-Anhang nach dem Excel-`Relation Notes`-Text. Form-Vorschlag (CC darf abweichen wenn schöner):

  ```text
  {existingNotesFromExcel}\n\n---surfaceForms---\n{
    "factionsUnresolved": [{"name":"Ordo Xenos","role":"primary"}, ...],
    "locationsUnresolved": [{"name":"Hubris","role":"primary"}, ...],
    "charactersUnresolved": [{"name":"Gregor Eisenhorn","role":"pov"}, ...],
    "flags": [{"kind":"data_conflict","field":"format",...}]
  }\n---/surfaceForms---
  ```

  Begrenzer-Pattern (`---surfaceForms---` / `---/surfaceForms---`) damit Resolver-Brief später regex-extract kann. CC's Wahl ob JSON-Block, YAML, oder eine andere Form — solange Resolver in Brief 062+ darüber regex-extract kann.

- **Idempotenz.** Re-Apply darf keine Duplikate erzeugen. Idempotenz-Anker ist `works.externalBookId` (UNIQUE-Constraint). Apply-Logik pro Buch:
  1. Lookup `SELECT id FROM works WHERE external_book_id = $1`
  2. Wenn existiert: UPDATE Pfad — `bookDetails.synopsis`, `bookDetails.notes`, `work_facets`/`work_factions`/`work_persons`/`work_locations`/`work_collections`-Junctions per `DELETE WHERE work_id = $1 + INSERT` (atomar in einer Transaktion). Slug, Title, ExternalBookId bleiben unverändert.
  3. Wenn nicht existiert: INSERT Pfad — alle Tabellen.

  CC dokumentiert im Report welcher Pfad für die 10 Bücher gegriffen hat (vermutlich alle INSERT beim ersten Lauf, alle UPDATE beim zweiten).

- **CLI-Form.** Vorschlag: `npm run db:apply-override -- --batch=ssot-w40k-001`. Oder `npm run apply:ssot -- --batch=ssot-w40k-001`. CC's Wahl. Mutual-Exclusion: das Skript läuft nur wenn das Override-File existiert (loud-Error wenn nicht). Argument-Validierung: Batch-Name muss `ssot-w40k-NNN` oder `ssot-hh-NNN` matchen.

- **Transaktion pro Buch oder pro Lauf?** Vorschlag: **eine Transaktion pro Buch**. So bleibt ein Fail bei Buch 7 (z.B. FK-Constraint-Violation auf einem facetId-Typo) bei Buch 7 stehen statt den ganzen Lauf zu rollbacken. Im Report zeigt CC die committed-pro-Buch-Counts und das erste Fail klar. Alternativ: ein Big-Transaction über alle 10 — CC's Call wenn er den Pro-Buch-Approach für zu komplex hält. Cowork-Empfehlung: pro Buch.

- **Frontend-Smoke.** Nach dem Apply: `npm run dev` und manuell verifizieren dass `/buch/xenos`, `/buch/eisenhorn-omnibus`, `/buch/pariah`, `/buch/the-magos` HTTP 200 rendert mit (a) der Cowork-Synopsis, (b) den Author-Persons (Dan Abnett), (c) den resolved Factions (mind. Inquisition + Chaos für die meisten), (d) den facet-Tags (mind. ein paar visible wie `mystery`, `grimdark`). **NICHT** Acceptance: die Surface-Form-Locations/Characters müssen heute NICHT im Frontend gerendert werden — das ist Resolver-Brief-Material. Aber sie müssen in `bookDetails.notes` persistiert sein und per `select notes from book_details` auslesbar.

- **`coverUrl` bleibt NULL für die 10.** Die Excel-SSOT hat keine Cover-URLs gepflegt, Hardcover/OL-Cover-URL-Resolution ist Pipeline-Stage-1-Material aus 058's Crawl-Cache — die kann der DB-Apply mitnehmen, wenn die Stage-1-Source-Claims aus `ingest/.last-run/v2-batch-20260510-2227.diff.json` parseable sind. Cowork-Empfehlung: CC's Wahl. Mindest-Acceptance: NULL OK; Stretch-Acceptance: aus dem 058-Diff `discoveredFields.coverUrl` oder gleichwertig parsen und in `works.coverUrl` schreiben.

- **`startY`/`endY` (in-universe Years) bleiben NULL.** Eisenhorn/Ravenor-Books haben in-universe-Setting-Years (M41 etwa 36000-Era ish, je nach Quelle), aber das Override-File trägt keine `startY`-Werte. Cowork hat das bewusst weggelassen — der Validator `year_outlier` operiert auf Lex-Body-Year-Candidates, nicht auf Override-Authority. Wenn CC die Stage-1-Source-Claims aus dem 058-Diff parsen kann: `startY`/`endY` als Stretch-Acceptance aus dem Diff ziehen. Mindest-Acceptance: NULL.

- **`sourceKind`** auf `works` ist `"ssot"` für alle 10. **`confidence`** auf `1.00` (Maintainer-curated Authority).

- **`bookDetails.seriesId`/`seriesIndex`** kommen aus dem Excel-`seriesHint`-Wert (im 058-Diff verfügbar). Mapping `seriesHint → series.id` ist manuell: "Inquisitor (Eisenhorn/Ravenor/Bequin)" → vermutlich `eisenhorn` oder ein neuer Eintrag in `series.json`. Wenn `series.json` keinen passenden Eintrag hat: CC darf einen neuen Eintrag in `series.json` ergänzen (z.B. `id: "inquisitor", name: "Inquisitor (Eisenhorn/Ravenor/Bequin)"`), aber das ist Stretch-Acceptance. Mindest-Acceptance: `seriesId` NULL.

- **`npm run lint`** + **`npm run typecheck`** + **`npm run brain:lint -- --no-write`** grün.

## Out of scope

- **Resolver für unresolved Surface-Forms.** OQ4 + OQ5. Bleibt verschoben bis nach ~30-50 prozessierten Büchern. Brief 060 persistiert Surface-Forms in `bookDetails.notes`, schreibt sie aber NICHT in `work_characters` (characters-Table bleibt leer) oder zusätzliche `work_locations`-Rows.

- **Apply für Bücher anderer Batches.** Brief 060 macht NUR die 10 aus `ssot-w40k-001`. `ssot-w40k-002`-Apply (sofern wir CC-Direct-Authority oder Haiku-Authority etablieren) kommt in einem späteren Brief (vermutlich 061 nach 059-Triage).

- **Frontend-Änderungen für Surface-Forms.** Resolver-Brief-Material. Brief 060 verifiziert nur dass `/buch/[slug]` mit den standard-aufgelösten Junctions rendert (Inquisition, Dan Abnett, etc.).

- **Migration-Generation.** Schema-Stand ist post-058 stabil; CC läuft KEIN `npm run db:generate`. Wenn CC einen Schema-Drift entdeckt (z.B. dass die Brain-Lesart "0007 unapplied" doch stimmt und der Schema-Read täuscht): loud-Report und Halt.

- **Lexicanum/OL/Hardcover Source-Claims als Authority-Backup.** Brief 060 nutzt **nur** das Override-File für weiche Felder. Die Stage-1-Sources aus dem 058-Diff (Lexicanum-Body-Claims für Eisenhorn etc.) sind interessant für `coverUrl`/`startY`/`isbn13` als Stretch-Acceptance, aber nicht als Synopsis-/Tag-Backup. Wenn das Override-File einen Wert nicht enthält, bleibt das DB-Feld NULL — keine Auto-Fallback-Pipeline.

- **Haiku-Diff-Cleanup.** Der `ingest/.last-run/v2-batch-20260510-2227.diff.json` bleibt wo er ist. Optional kann er nach `ingest/.archive/v2-batch/` verschoben werden (wie der Loser-Pfad in Brief 059), aber das ist NICHT Acceptance — Audit-Trail-Wert.

- **Brain-Hygiene-Updates.** `project-state.md` ist nach 058-Apply nicht aktualisiert (Maintainer-Trigger-Lesart ist out-of-date). 060-Apply produziert weiteren Update-Bedarf. Cowork macht beides später in einem separaten Hygiene-Pass.

- **DetailPanel "Auch enthalten in"-Frontend.** Backend-Junction `work_collections` wird hier populated; die Frontend-View kommt in einem separaten Mini-Brief (vermutlich kurz nach 060 — weil jetzt die Daten da sind), aber nicht in 060 selbst. Acceptance verlangt nur `select * from work_collections where collection_work_id = (W40K-0004 UUID)` returns 3 Rows.

## Acceptance

The session is done when:

- [ ] **Schema-Status verifiziert.** CC läuft `SELECT name FROM __drizzle_migrations ORDER BY id` und meldet im Report welche Migrationen applied sind. Wenn 0007 oder 0008 fehlen (entgegen `src/db/schema.ts`-Lesart): loud-Error, Halt, Maintainer-Trigger.

- [ ] **Apply-Skript implementiert.** `scripts/apply-override.ts` (oder gleichwertiger Pfad/Name): liest `manual-overrides-ssot-w40k-001.json` + `book-roster.json`, produziert die DB-Inserts/Updates in einer Transaktion pro Buch. Idempotent. CLI-Form via `npm run db:apply-override -- --batch=ssot-w40k-001` (oder CC's Variante).

- [ ] **Alle 10 Bücher in `works`.** `select count(*) from works where external_book_id like 'W40K-000_' OR external_book_id = 'W40K-0010'` returns 10. Pro Buch: `sourceKind = 'ssot'`, `confidence = 1.00`, `kind = 'book'`, `canonicity = 'official'`, `slug` matched mit Override-File-Slug, `title` matched mit `book-roster.json`-Title.

- [ ] **Alle 10 Bücher in `book_details`.** `select count(*) from book_details bd join works w on bd.work_id = w.id where w.external_book_id like 'W40K-000_' OR w.external_book_id = 'W40K-0010'` returns 10. Synopsis ist die Cowork-Override-Synopsis (nicht NULL, 400-1200 Zeichen). `format` ist der Roster-Wert für 9 Bücher und `collection` für *The Magos* (data_conflict-Flag-Anwendung).

- [ ] **`work_facets`-Inserts pro Buch.** Pro Buch ~15-20 `work_facets`-Rows, alle FK-aufgelöst gegen `facet_values.id`. Total: zwischen 150 und 200 Rows. Loud-Error bei jedem facetId der nicht in `facet_values` existiert.

- [ ] **`work_persons`-Inserts.** Pro Buch eine Row mit `personId = "dan-abnett"` (oder dem korrekten Slug aus `persons.json`), `role = "author"`, `displayOrder = 0`. Total 10 Rows.

- [ ] **`work_factions`-Inserts pro Buch (canonical only).** Nur Faktionen die in `factions.json` als ID existieren (`inquisition`, `chaos`, `mechanicus`, `necrons`). Sub-Inquisition (Ordo Xenos/Malleus/Hereticus) wird auf `inquisition` resolved. Highest-Role-Wins bei composite-PK-Konflikt. Total: zwischen 15 und 30 Rows.

- [ ] **`work_locations`-Inserts pro Buch (canonical only).** Nur `eye_of_terror` für *Ravenor* (W40K-0005) — der einzige canonical Location-Match in den 10 Büchern. Total: 1 Row.

- [ ] **`work_collections`-Inserts.** Pro Omnibus 3 Rows: *Eisenhorn Omnibus* (W40K-0004) enthält *Xenos*/*Malleus*/*Hereticus*; *Ravenor: The Omnibus* (W40K-0008) enthält *Ravenor*/*Ravenor Returned*/*Ravenor Rogue*. Total: 6 Rows. `displayOrder` aus `book-roster.json.collections[]`-Reihenfolge, `confidence`/`basis` aus den Excel-Werten falls vorhanden, sonst `confidence = 1.00, basis = NULL`.

- [ ] **Surface-Forms in `bookDetails.notes`.** Pro Buch der JSON-Anhang mit `factionsUnresolved` / `locationsUnresolved` / `charactersUnresolved` / `flags`. Pro Buch in `notes`: existing Excel-Text (falls vorhanden) + Begrenzer `---surfaceForms---` + JSON + `---/surfaceForms---`.

- [ ] **`bookDetails.primaryEraId`** für alle 10 gesetzt auf den M41-Era-ID-String aus `eras.json` (CC verifiziert welcher).

- [ ] **Frontend-Smoke pass.** Maintainer (oder CC nach `npm run dev`) verifiziert: `/buch/xenos`, `/buch/eisenhorn-omnibus`, `/buch/pariah`, `/buch/the-magos` rendert HTTP 200 mit (a) Cowork-Synopsis, (b) "by Dan Abnett", (c) ≥2 Faction-Tags, (d) ≥5 Facet-Tags sichtbar. Screenshot oder stdout-Snippet im Report.

- [ ] **Idempotenz-Smoke.** CC läuft das Apply-Skript **zweimal hintereinander** (zweites Mal ist no-op-equivalent: gleiche Counts, kein Duplicate-Key-Error). Im Report die zwei Lauf-Outputs vergleichen.

- [ ] **`npm run lint`** + **`npm run typecheck`** + **`npm run brain:lint -- --no-write`** grün.

## Open questions

- **Migration 0007/0008 Drift-Risiko.** `src/db/schema.ts`-Lesart sagt enums sind vollständig (sourceKind 15 Werte mit `ssot`/`llm`/etc.; bookFormat 9 Werte). Brain post-057 sagt `0007 bleibt committed-but-NOT-applied`. 058-impl-Append sagt `0008 applied via Vercel-Auto-Deploy`. Vermutung: Brain-Post-057-Lesart ist out-of-date, 0007 wurde gleichzeitig mit 0008 von Vercel auto-applied. CC verifiziert empirisch via `__drizzle_migrations` query und meldet wer recht hat.

- **`series.json`-Erweiterung.** Wenn CC entscheidet, einen `inquisitor`-Series-Eintrag in `series.json` zu ergänzen (Stretch-Acceptance), schreibt er die JSON-Edit in einer separaten Commit-Sequenz: Edit `series.json` + Regenerate-Seed + Apply-Override-Brief 060. Wenn er entscheidet, dass das Brief-060-Scope-Creep ist: `seriesId` bleibt NULL für die 10, und ein separater Mini-Brief ergänzt das. Cowork-Tendenz: Stretch-mitnehmen wenn der series.json-Edit trivial bleibt (eine JSON-Row).

- **`book-roster.json.collections[]`-Format.** Brief 060 nimmt an dass das File `{collectionExternalId, contentExternalId, displayOrder, confidence, basis}`-Form trägt. CC verifiziert beim Lesen und passt den Apply-Pfad an, falls die Form anders ist (z.B. `parentId`/`childId`).

- **Frontend-Verifikation reicht stdout/curl oder braucht echten Browser?** Cowork-Empfehlung: stdout-curl von `/buch/xenos` mit grep nach Cowork-Synopsis-Substring (z.B. "Pontius Glaw") reicht. Browser-Screenshot ist Nice-to-have. CC's Call.

- **`work_factions.role`-Default bei Highest-Role-Wins-Konflikt.** Wenn ein Buch Override-Faktionen `Inquisition (primary)` + `Ordo Xenos (primary)` + `Ordo Malleus (supporting)` enthält und alle drei auf `inquisition` resolven, wird die Junction-Row `{workId, factionId: "inquisition", role: "primary"}` — höchste der drei. Algorithmus-Empfehlung: `primary > supporting > antagonist > background` (eigene Ordnung, weil `antagonist` und `background` semantisch nicht ordbar sind aber Heuristik macht Sinn). CC's Call wenn er eine andere Ordnung sinnvoller findet.

## Notes

### Apply-Skript-Skizze (illustrativ, nicht final)

```ts
// scripts/apply-override.ts (oder gleichwertiger Pfad)

import { readFile } from "node:fs/promises";
import { db } from "@/db/client";
import { works, bookDetails, workFacets, workPersons, workFactions, workLocations, workCollections } from "@/db/schema";
import { eq } from "drizzle-orm";

const FACTION_ROLE_PRIORITY = { primary: 4, supporting: 3, antagonist: 2, background: 1 };
const CANONICAL_FACTION_RESOLVE: Record<string, string> = {
  "Inquisition": "inquisition",
  "Ordo Xenos": "inquisition",
  "Ordo Malleus": "inquisition",
  "Ordo Hereticus": "inquisition",
  "Chaos": "chaos",
  "Adeptus Mechanicus": "mechanicus",
  "Necrons": "necrons",
  // alles andere → unresolved
};
const CANONICAL_LOCATION_RESOLVE: Record<string, string> = {
  "Eye of Terror": "eye_of_terror",
  // alles andere → unresolved
};

async function applyBook(override: BookOverride, roster: RosterBook): Promise<void> {
  await db.transaction(async (tx) => {
    // 1. UPSERT works
    const workRow = await tx.insert(works).values({
      kind: "book",
      slug: override.slug,
      title: roster.title,
      synopsis: override.overrides.synopsis,
      releaseYear: roster.releaseYear,
      externalBookId: override.externalBookId,
      sourceKind: "ssot",
      confidence: "1.00",
    }).onConflictDoUpdate({
      target: works.externalBookId,
      set: { synopsis: override.overrides.synopsis, updatedAt: new Date() },
    }).returning({ id: works.id });

    const workId = workRow[0].id;

    // 2. UPSERT bookDetails
    const formatOverride = override.overrides.flags?.find((f) => f.kind === "data_conflict" && f.field === "format");
    const finalFormat = formatOverride?.suggestion ?? roster.format;
    const surfaceForms = {
      factionsUnresolved: override.overrides.factions.filter((f) => !CANONICAL_FACTION_RESOLVE[f.name]),
      locationsUnresolved: override.overrides.locations.filter((l) => !CANONICAL_LOCATION_RESOLVE[l.name]),
      charactersUnresolved: override.overrides.characters,
      flags: override.overrides.flags,
    };
    const notes = `${roster.notes ?? ""}\n\n---surfaceForms---\n${JSON.stringify(surfaceForms, null, 2)}\n---/surfaceForms---`.trim();

    await tx.insert(bookDetails).values({
      workId, format: finalFormat, notes, primaryEraId: M41_ERA_ID,
    }).onConflictDoUpdate({ ... });

    // 3-7. Junctions: delete-then-insert für Idempotenz
    await tx.delete(workFacets).where(eq(workFacets.workId, workId));
    await tx.insert(workFacets).values(override.overrides.facetIds.map(id => ({ workId, facetValueId: id })));

    await tx.delete(workPersons).where(eq(workPersons.workId, workId));
    await tx.insert(workPersons).values([{ workId, personId: "dan-abnett", role: "author", displayOrder: 0 }]);

    await tx.delete(workFactions).where(eq(workFactions.workId, workId));
    const resolvedFactions = resolveFactions(override.overrides.factions); // mit Highest-Role-Wins
    await tx.insert(workFactions).values(resolvedFactions.map(f => ({ workId, factionId: f.id, role: f.role })));

    await tx.delete(workLocations).where(eq(workLocations.workId, workId));
    const resolvedLocations = override.overrides.locations
      .filter((l) => CANONICAL_LOCATION_RESOLVE[l.name])
      .map((l) => ({ workId, locationId: CANONICAL_LOCATION_RESOLVE[l.name], role: l.role }));
    if (resolvedLocations.length > 0) await tx.insert(workLocations).values(resolvedLocations);

    // (work_collections später als zweite Phase, weil alle UUIDs erst gemappt werden müssen)
  });
}

// Second pass: work_collections nach allen 10 work-Inserts
async function applyCollections(externalIdToUuid: Map<string, string>, roster: RosterFile): Promise<void> {
  await db.delete(workCollections); // Idempotenz — keine Self-M2M zwischen anderen Werken, leerer Wipe OK in 060
  const rows = roster.collections
    .filter((c) => externalIdToUuid.has(c.collectionExternalId) && externalIdToUuid.has(c.contentExternalId))
    .map((c) => ({
      collectionWorkId: externalIdToUuid.get(c.collectionExternalId)!,
      contentWorkId: externalIdToUuid.get(c.contentExternalId)!,
      displayOrder: c.displayOrder,
      confidence: c.confidence,
      basis: c.basis,
    }));
  if (rows.length > 0) await db.insert(workCollections).values(rows);
}
```

Schema-/Naming-Konventionen sind illustrativ. CC wählt finale Form.

### Brain-Update-Trigger

Post-060 muss Cowork die folgenden Pages updaten (Folgearbeit, nicht in 060-impl-Report):

- `brain/wiki/project-state.md`: 058-Apply-State, 060-DB-Apply-State, Migration 0007 als applied markieren.
- `brain/wiki/pipeline-state.md`: Phase 3d "Erste Welle" als landed eintragen, full-sweep weiter verschoben.
- `brain/wiki/open-questions.md`: OQ7/OQ8 entfernen (durch 057+058 closed). Sub-Inquisition als Sub-Resolver-Question hinzufügen wenn relevant. Cleanup-Mechanik aus 059 als neues OQ wenn nicht via Folgebrief eingearbeitet.
- `brain/wiki/log.md`: 058 + 059 + 060 + Manual-Override-Authority-Pattern eintragen.

### Tracked-for-future-briefs

Aus dem 058-Review (in Brief 059 auch erwähnt; hier nochmal weil 060 die DB-Schreibseite ergänzt):

1. **Resolver für Surface-Forms** (OQ4 + OQ5). Brief 062-063. Sobald 30-50 Bücher in `bookDetails.notes` Surface-Form-JSON haben, kann der Resolver mit echter Frequenz-Empirie starten.
2. **DetailPanel "Auch enthalten in"-Frontend**. Sobald 060-Apply die `work_collections`-Junction populated, kann ein Mini-Brief die Frontend-View bauen. Eisenhorn Omnibus → 3 Children sichtbar.
3. **Cost-Telemetrie-Recompute** (058-Loose-End). Mini-Brief später.
4. **`SlimLlmPayload.format` Dead-Code-Cleanup** (058-Loose-End).
5. **v2-tryout-2 Regression-Smoke** (058-Loose-End).
6. **`characters`-Table-Populierung-Entscheidung**. Brief 060 lässt das absichtlich offen — Resolver-Brief entscheidet ob Option A (full canonical) / B (scope-out) / C (Hybrid Top-100) gefahren wird. Maintainer-Vorpräferenz C.

---

Brief 060 ist der erste Brief, in dem die Pipeline tatsächlich was schreibt. Die Authority-Quelle ist Cowork-curated (nicht Pipeline-LLM), und das ist eine eigenständige Architektur-Entscheidung — das Modell wird nicht skaliert (nicht 859 Hand-Curated-Bücher), aber für die Showcase-10 ist es das richtige Werkzeug. Pipeline-Auto-Apply für die nächsten 10er-Batches (post-A/B-Winner aus 059) folgt in Brief 061+.
