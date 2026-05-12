---
session: 2026-05-11-062
role: architect
date: 2026-05-11
status: open
slug: apply-override-author-fix
parent: 2026-05-11-060
links:
  - 2026-05-11-061-arch-ssot-loop
  - ../archive/2026-05/2026-05-11-060-arch-ssot-w40k-001-db-apply
  - ../archive/2026-05/2026-05-11-060-impl-ssot-w40k-001-db-apply
commits: []
---

# Apply-Override: Author-FK-Fix + Auto-Create für fehlende Persons

## Goal

Zwei verschachtelte Bugs in `scripts/apply-override.ts` (aus Brief 060) fixen, **bevor** der Apply für den bereits existierenden `ssot-w40k-002`-Batch und alle Folge-Loop-Iterationen läuft. Bug A: hardgecodete `AUTHOR_PERSON_ID = "dan_abnett"` ignoriert den Roster komplett. Bug B: `persons.json` hat nur 12 Einträge, der Roster nennt 104 distinkte Autoren — sobald Bug A weg ist, knallt der FK-Constraint bei fast jedem nicht-trivialen Buch.

Lösungspfad: Apply liest pro Buch `roster.authors[]`, slugified zu Person-ID, lookup gegen DB, **Auto-Create** bei Miss (mit parallelem Append in `persons.json`, damit Re-Seeds konsistent bleiben). Plus saubere Behandlung der Anthologie-Edge-Cases (`authors: []` + `editorialNote: "various"`) und Multi-Author-Bücher.

Strategisch (Sequenz):

1. CC fixt `scripts/apply-override.ts`.
2. CC läuft Re-Apply von `ssot-w40k-001` als Idempotenz-Smoke (10 Bücher, alle Dan Abnett — Counts dürfen sich nicht ändern).
3. CC läuft **erstmals Apply von `ssot-w40k-002`** — das ist der echte Auto-Create-Test, weil 8 von 10 Büchern Sandy Mitchell sind (existiert in `persons.json` ✓) und 2 Dan Abnett (existiert ✓). In dieser Batch werden also keine Persons auto-created, aber die Roster-Read-Logik wird zum ersten Mal real geprüft.
4. Frontend-Smoke: `/buch/for-the-emperor` rendert „by Sandy Mitchell".

Erst nach dieser Sequenz ist Brief 061 (Loop) bereit für Iter 2 (`ssot-w40k-003`).

## Context

**Bug-Genese.** Brief 060 hatte in der „Apply-Skript-Skizze" (Notes-Section, „illustrativ, nicht final") folgenden Hardcode:

```ts
await tx.insert(workPersons).values([{ workId, personId: "dan-abnett", role: "author", displayOrder: 0 }]);
```

Cowork hatte das geschrieben, weil die 10 Bücher in `ssot-w40k-001` (Eisenhorn + Ravenor + Bequin + The Magos) alle Dan Abnett sind — der Hardcode produziert für diesen einen Batch das richtige Ergebnis. Die Acceptance-Bullet sagte zwar „pro Buch eine Row mit `personId = "dan-abnett"` (oder dem korrekten Slug aus `persons.json`)" — aber CC hat die Skizze 1:1 übernommen und das `AUTHOR_PERSON_ID = "dan_abnett"` als Modul-Konstante in `scripts/apply-override.ts` Line 66 eingebaut. Line 435-443 schreibt sie für jedes Buch.

**Lehre.** Konkrete Werte in Brief-Skizzen sind eine Falle — der „illustrativ"-Disclaimer trägt nicht weit genug. Konsequenz für künftige Briefs: Pseudocode in Briefs verwendet Marker wie `<roster-author-slug>` / `<auto-resolve>`, keine konkreten Daten-Strings. Cowork dokumentiert das in einer Brain-Hygiene-Notiz später; in diesem Brief tut Cowork dasselbe (Marker statt konkrete Slugs in der Skizze unten).

**Roster-Empirie.** `scripts/seed-data/book-roster.json` enthält für die 859 Bücher 104 distinkte `authors[]`-Werte. `scripts/seed-data/persons.json` enthält 12 Einträge: `dan_abnett`, `guy_haley`, `aaron_dembski_bowden`, `graham_mcneill`, `sandy_mitchell`, `gav_thorpe`, `chris_wraight`, `nate_crowley`, `robert_rath`, `phil_kelly`, `rachel_harrison`, `ben_counter`. Coverage-Gap: 92 von 104 Autoren fehlen — Andy Smillie, Brian Craig, C.S. Goto, Chris Roberson, David Annandale, George Mann, James Swallow, John French, Mike Lee, Nick Kyme, Steve Lyons, William King und ~80 weitere.

**Edge-Cases im Roster.** Aus dem 859-Buch-Loader-Lauf (siehe `brain/wiki/project-state.md` § 057-Empirie):

- **Solo:** 772 Bücher (~89%).
- **Multi-Author (`["X", "Y"]`):** 3 Bücher.
- **Anthologie (`authors: []` + `editorialNote: "various"`):** 62 Bücher (61× „Various Authors" + 1× „Dan Abnett & Others").
- **Leere Author-Cells ohne Various-Marker:** 23 Bücher (ungeklärt, vermutlich Roster-Datenfehler).

Multi-Author und Anthologie sind Architektur-Entscheidungen die Brief 060 still übergangen hat. Dieser Brief klärt sie.

**Editors.** Der Roster trägt `editors: string[]` neben `authors: string[]`. Für `editorialNote: "various"`-Bücher steht der Editor (z.B. „Christian Dunn") manchmal im Roster (Anthologie-Herausgeber). Aktuelles Apply-Skript ignoriert `editors[]` komplett. Dieser Brief behandelt Editors als zusätzliche `work_persons`-Rows mit `role: "editor"`.

**Was passiert mit der DB jetzt?** Die 10 Bücher aus `ssot-w40k-001` stehen in der DB mit `work_persons.personId = "dan_abnett"`. Das ist faktisch korrekt (alle 10 SIND Abnett), aber sie wurden über den Bug-Pfad geschrieben — nicht weil Apply Roster-Wahrheit gelesen hat, sondern weil der Hardcode zufällig passte. Der Re-Apply nach dem Fix sollte für die 10 identisch ausgehen (selbe `personId`, selbe Row). Wenn nicht: loud-Error, Cowork-Trigger.

## Constraints

- **AUTHOR_PERSON_ID-Konstante entfernen.** Modul-Konstante in `scripts/apply-override.ts` Line 66 raus. Die `work_persons`-Insert-Logik liest stattdessen aus `roster.authors[]` (und optional `roster.editors[]`).

- **Slugify-Regel.** CC definiert eine deterministische Slugify-Funktion für Author-Strings: Lower-Case, Unicode-NFKD-Normalize, alle Nicht-Alphanumerisch zu `_`, mehrfach-`_` collapse, Leading/Trailing-`_` trim. Beispiele: `"Dan Abnett"` → `dan_abnett`, `"C.Z. Dunn"` → `c_z_dunn` (eine sinnvolle Variante, CC's Call), `"C.S. Goto"` → `c_s_goto`. Konsistenz: die selben 12 Einträge in `persons.json` müssen mit der Regel re-derivable sein. CC verifiziert das beim ersten Lauf — falls einer der 12 mit der gewählten Slugify-Regel nicht reproduziert (z.B. wegen Sonderzeichen), passt CC die Regel an oder reportet loud.

- **Per-Author Lookup-and-Auto-Create.** Pro Roster-Author:
  1. Slugify zu `personSlug`.
  2. SELECT-Lookup gegen `persons.id` in DB.
  3. Wenn HIT: nutze die existierende `id`.
  4. Wenn MISS: INSERT in DB mit minimalem Datensatz (`{ id: personSlug, name: <original-author-string>, nameSort: <derived-or-null> }`). Nicht-required Felder (`bio`, `birthYear`, `lexicanumUrl`, `wikipediaUrl`) bleiben NULL.
  5. Parallel: Auto-Created Persons werden an `scripts/seed-data/persons.json` angehängt (atomar nach dem Apply-Lauf, ein einziger Write), damit Re-Seeds via `npm run seed` konsistent bleiben.

- **NameSort-Heuristik.** Default-Ableitung für Auto-Created Persons: split Author-String an Whitespace, letztes Token = Lastname, Rest = Firstname. `"Dan Abnett"` → `"Abnett, Dan"`. `"C.S. Goto"` → `"Goto, C.S."`. Single-Token (z.B. „Anonymous") → kein nameSort, NULL. CC's Wahl wenn er eine bessere Heuristik findet. Acceptable: NULL-Fallback bei Unsicherheit.

- **Multi-Author.** Wenn `roster.authors.length > 1`: pro Author eine `work_persons`-Row mit `role: "author"`, `displayOrder` aus Array-Reihenfolge (0, 1, 2, …). Idempotent: DELETE-then-INSERT pro `workId` (Pattern aus Brief 060 ist OK).

- **Anthologie-Edge-Case.** Wenn `roster.authors.length === 0`:
  - Wenn `roster.editorialNote === "various"`: **keine work_persons-Row für `role: "author"`**. `bookDetails.notes` bekommt einen strukturierten Marker (analog zum `---surfaceForms---`-Block aus Brief 060): z.B. `---authorship---\n{ "kind": "various", "editorialNote": "various" }\n---/authorship---`. Begrenzer-Pattern damit Resolver-Brief später regex-extract kann.
  - Wenn `roster.editorialNote === null` UND `roster.editors.length > 0`: das ist eine kuratierte Anthologie mit benannten Editors — KEINE Author-Rows, nur Editor-Rows (siehe nächster Constraint).
  - Wenn `roster.authors.length === 0` UND `roster.editorialNote === null` UND `roster.editors.length === 0`: das ist eine Roster-Datenlücke (23 Bücher laut Empirie). CC loggt loud (`unresolved_authorship: <externalBookId>`) und schreibt KEINE work_persons-Row. Apply läuft weiter, dieses Buch hat dann keine Author-Junction.

- **Editors als Stretch.** Wenn `roster.editors.length > 0`: pro Editor eine `work_persons`-Row mit `role: "editor"`, `displayOrder` aus Array-Reihenfolge. Auto-Create wie bei Authors. Stretch-Acceptance — wenn CC das nicht in diesem Brief mitmachen will, dann in einem Folge-Brief; aber dann muss der Anthologie-Edge-Case mit benannten Editors einen Marker in `bookDetails.notes` setzen statt eine Editor-Row.

- **Idempotenz erhalten.** DELETE-then-INSERT pro `workId` bleibt das Pattern. Re-Apply derselben Override-Datei produziert identische Junction-Rows.

- **Persons.json-Append: atomar pro Lauf.** Apply sammelt während des Laufs eine in-memory-Liste „neu angelegter Persons", schreibt am Ende EINMAL die erweiterte `persons.json` zurück. Kein per-Buch-Write (Race-Hazard + Performance). Wenn der Lauf abbricht: Persons.json bleibt unverändert (DB hat dann mehr Persons als JSON — Maintainer kann via SELECT die Drift erkennen und manuell mergen, oder das Skript hat einen `--sync-persons-json`-Flag der DB → JSON repliziert; CC's Wahl ob Stretch).

- **Reihenfolge im Lauf.** Author-Auto-Create läuft VOR der Buch-Transaktion, ODER innerhalb der Buch-Transaktion mit `ON CONFLICT DO NOTHING` auf `persons.id`. CC's Wahl. Wenn innerhalb: Vorteil ist Atomarität (Person + work_persons in einer Transaktion), Nachteil ist Komplexität bei mehreren Büchern mit demselben Auto-Created-Author (Race nur in echten parallelen Läufen — wir haben serialen Lauf, also unkritisch). Empfehlung: Pre-Pass durch alle Roster-Authors aller Bücher im Batch, distinct-set bilden, fehlende Persons als Block einfügen, dann pro Buch die work_persons-Rows.

- **Re-Apply der bestehenden 10 (`ssot-w40k-001`) als Idempotenz-Smoke.** Nach dem Fix-Deploy läuft CC `npm run db:apply-override -- --batch=ssot-w40k-001` und verifiziert: alle 10 work_persons-Rows weiterhin `personId = "dan_abnett"`, keine neuen Persons auto-created (weil Abnett schon in persons.json). Counts identisch zu vorher: 10 work_persons-Rows, 12 persons-Rows (unverändert).

- **Frontend-Smoke nach Fix.** `/buch/xenos`, `/buch/eisenhorn-omnibus`, `/buch/the-magos` rendern weiterhin HTTP 200 mit „by Dan Abnett". CC manuell oder via curl + grep.

- **`npm run lint`** + **`npm run typecheck`** + **`npm run brain:lint -- --no-write`** grün.

## Out of scope

- **Weitere Loop-Iterationen aus Brief 061.** 062 lässt 002 als ersten echten Author-Roster-Read-Lauf durch, stoppt dann. Iter 2 (Generate von `ssot-w40k-003`) ist erst nach 062-Complete dran — über Brief 061, nicht hier.

- **Apply für Batches > 002.** Kein Apply für `ssot-w40k-003` etc. in diesem Brief — gibt es noch nicht.

- **Bio / Lexicanum-URL / Wikipedia-URL / birthYear für Auto-Created Persons.** Bleiben NULL. Maintainer pflegt das später manuell in `persons.json` nach (oder ein Persons-Resolver-Brief promotet Top-K-Persons mit Wiki-/Lex-Scrape, analog zum Faktionen-Resolver — aber später).

- **Roster-Datenlücken (23 leere Author-Cells ohne „various"-Marker).** Loud-Logging im Apply, aber kein Fix der Roster-Daten in diesem Brief. Maintainer triagiert das im Excel-SSOT-Workflow extern (Folge des 057-Pivots).

- **`persons.json`-Sortierung.** Das File ist aktuell vermutlich nach Insertion-Reihenfolge sortiert (Maintainer-curated). Append fügt neue Einträge ans Ende an. Alphabetische Sortierung oder andere Ordnung ist Out-of-Scope; falls Maintainer das später will, separater Lint-Brief.

- **Editors-vs-Authors-Disambiguation.** Wenn der Roster für ein Buch sowohl `authors[]` als auch `editors[]` füllt: beide werden in `work_persons` geschrieben mit verschiedenen `role`-Werten. Conflict-Logik (z.B. Person ist gleichzeitig Author UND Editor für dasselbe Buch) ist Out-of-Scope — sollte im Roster nicht vorkommen, wenn doch: CC schreibt beide Rows, composite-PK auf `(workId, personId, role)` (CC verifiziert ob die Tabelle das erlaubt; wenn nicht, loud-Error, Cowork-Trigger).

- **Atlas-Regen.** Out of Loop. Maintainer triggert separat falls gewünscht.

- **Brain-Hygiene.** `project-state.md` / `log.md`-Update macht Cowork separat nach 062-Impl-Report.

## Acceptance

The session is done when:

- [ ] **`AUTHOR_PERSON_ID`-Konstante entfernt.** `scripts/apply-override.ts` Line 66 weg. Keine Spuren in `git grep -n "AUTHOR_PERSON_ID"` außer ggf. im Brief-060-Markdown (Audit-Trail).

- [ ] **Slugify-Funktion implementiert.** Deterministisch, idempotent, dokumentiert in einem JSDoc-Block. Re-Derivation der 12 bestehenden persons.json-IDs aus den `name`-Feldern reproduziert die `id`-Werte 1:1 — wenn nicht, CC reportet welche Persons abweichen und passt entweder die Regel oder die persons.json an.

- [ ] **Apply liest Roster-Authors pro Buch.** `roster.books[].authors[]` wird konsumiert. Multi-Author: mehrere Rows mit aufsteigendem `displayOrder`. Anthologie (`authors: []` + `various`): keine Author-Row, stattdessen Marker in `bookDetails.notes`.

- [ ] **Auto-Create fehlender Persons.** Pre-Pass (oder ON-CONFLICT-DO-NOTHING) legt fehlende `persons`-Rows mit minimalem Datensatz an. Auch im JSON: `scripts/seed-data/persons.json` wächst um die neu angelegten Einträge (atomar am Ende des Laufs).

- [ ] **Anthologie-Edge-Case sauber.** `bookDetails.notes` für `various`-Bücher trägt einen `---authorship---`-Marker mit `kind: "various"`, parsebar durch Resolver-Brief später. Keine `work_persons.role = "author"`-Row für diese Bücher.

- [ ] **Editors-Behandlung (Stretch).** Wenn der Roster `editors[]` füllt: zusätzliche `work_persons.role = "editor"`-Rows pro Editor. Auto-Create-Pfad identisch zu Authors. Wenn CC Editors als Stretch nicht macht: Marker in `bookDetails.notes` für editorial Anthologien.

- [ ] **Re-Apply von `ssot-w40k-001` läuft idempotent.** `npm run db:apply-override -- --batch=ssot-w40k-001` (zweimal hintereinander) produziert identische DB-Counts. Vor/nach Fix: `select count(*) from work_persons where role='author'` = 10. Alle 10 Rows haben weiterhin `personId = "dan_abnett"`. Frontend `/buch/xenos` etc. rendert weiter „by Dan Abnett".

- [ ] **Erstmaliger Apply von `ssot-w40k-002`.** `npm run db:apply-override -- --batch=ssot-w40k-002`. Die Override-Datei existiert bereits im Repo (CC's Loop-Iter 1 aus 061 hat sie geschrieben — siehe `sessions/ssot-loop-log.md`). Erwartetes Verhalten: 8 Sandy-Mitchell-Bücher + 1 Dan-Abnett-Buch (Bequin's *Penitent*, W40K-0011) + 1 Sandy-Mitchell-Buch (W40K-0014). `select count(*) from work_persons` = 20 (vorher 10). Pro Buch genau eine `role='author'`-Row mit korrektem `personId`. Loud-Error wenn `sandy_mitchell` als Slug nicht in persons.json/DB existiert — wäre sie aber, weil persons.json bereits einen Sandy-Mitchell-Eintrag hat (verifiziert). Auto-Create wird also in 002 voraussichtlich 0 neue Persons produzieren — der Auto-Create-Pfad wird erst in Folge-Batches (003+) real getestet. Im Report: pro Buch ein Bullet mit ist-Author + soll-Author, plus Counts.

- [ ] **Frontend-Smoke für 002.** Maintainer oder CC verifiziert `/buch/for-the-emperor` rendert „by Sandy Mitchell" (HTTP 200). Stichprobe für ein bis zwei weitere Cain-Slugs (z.B. `/buch/caves-of-ice`, `/buch/cains-last-stand`).

- [ ] **Loud-Logging für unresolved authorship.** Wenn ein Buch `authors: []` UND `editorialNote === null` UND `editors: []` hat: CC schreibt `console.warn` (oder gleichwertig) mit `externalBookId` + Roster-Index, schreibt KEINE work_persons-Row, läuft weiter. Im Implementer-Report eine Liste der Treffer (vermutlich 0 in der aktuellen Batch).

- [ ] **`npm run lint`** + **`npm run typecheck`** + **`npm run brain:lint -- --no-write`** grün.

- [ ] **Implementer-Report enthält:** (a) Slugify-Regel-Doku + 12-persons-Re-Derivation-Check, (b) Counts pro Auto-Create-Pre-Pass (wie viele neue Persons im 001-Re-Apply — Erwartung 0), (c) Anthologie-Edge-Case-Liste (0 Treffer im 001-Re-Apply), (d) Editors-Stretch ja/nein-Entscheidung mit Begründung, (e) das simuliert/smoke Apply gegen 002-Test-Fixture, (f) Frontend-Smoke-Output.

## Open questions

- **Slugify-Regel-Wahl** für Edge-Cases:
  - Initialen wie „C.Z. Dunn" → `c_z_dunn` oder `cz_dunn` oder `c.z._dunn`? Cowork-Tendenz: `c_z_dunn` (Punkte und Whitespace werden gleich behandelt — beide zu `_`, dann collapse).
  - Apostrophe wie „O'Brien" → `o_brien` oder `obrien`? Cowork-Tendenz: `o_brien` (selbe Regel: nicht-alphanumerisch → `_`).
  - Umlaute wie „Müller" → `muller` (NFKD strip diacritics) oder `m_ller`? Cowork-Tendenz: NFKD + diacritics-strip, also `muller`. CC's Wahl mit Begründung; das Re-Derivation-Check gegen die 12 bestehenden Persons sollte die Regel validieren.

- **`persons.json`-Append-Reihenfolge.** Am Ende anhängen (chronologisch nach Auto-Create-Zeitpunkt) oder alphabetisch nach `nameSort` einsortieren? Cowork-Tendenz: am Ende anhängen — minimaler Diff bei `git diff persons.json`, einfacher zu reviewen. Falls Maintainer alphabetisch will, separater Sort-Brief.

- **NameSort für Pseudonyme/komplexe Namen.** „Sandy Mitchell" ist ein Pseudonym (Alex Stewart). Die existierende persons.json-Row trägt `nameSort: "Mitchell, Sandy"` — also nameSort folgt dem Schreibnamen, nicht dem bürgerlichen. CC bleibt dabei: nameSort wird aus dem Roster-Author-String abgeleitet, nicht aus externer Wissensbasis. Reicht das, oder will Maintainer eine Spezial-Spalte für Pseudonyme im persons.json-Schema? Cowork-Tendenz: out-of-scope für jetzt — Pseudonym-Tracking ist Persons-Resolver-Brief-Material.

- **Multi-Author-displayOrder bei Roster-Editierung.** Wenn der Roster später für ein Buch von `["X"]` auf `["Y", "X"]` umschreibt (Maintainer-Edit im Excel), bleibt `Y` jetzt `displayOrder: 0` und `X` wird zu `displayOrder: 1`. Re-Apply hält das idempotent durch DELETE-then-INSERT. Aber: wenn der Apply-Sweep nur Bücher mit geändertem `externalBookId` re-applied, würde der displayOrder-Drift unbemerkt bleiben. Aktuell ist das kein Problem (Apply ist immer batch-weit, kein diff-mode). Cowork notiert für später.

- **Lessons-Learned-Brief.** Soll Cowork einen Mini-Brief schreiben, der die „keine konkreten Werte in Brief-Skizzen"-Lehre formalisiert (z.B. als Wiki-Page in `brain/wiki/workflows/cowork-session.md` § „Skript-Skizzen-Disziplin")? Cowork-Tendenz: ja, aber separat und nach 062-Impl-Report — nicht in 062 selbst.

## Notes

### Skript-Skizze (Marker-only, KEINE konkreten Werte)

```ts
// scripts/apply-override.ts — relevant section AFTER fix

/**
 * Slugify an author or editor string deterministically.
 * <CC-implements; documents the rule>
 */
function slugifyPerson(displayName: string): string {
  // <CC-implements>
}

/**
 * Derive a Library-of-Congress style nameSort from a display name.
 * "Dan Abnett" → "Abnett, Dan"; "C.S. Goto" → "Goto, C.S."; single-token → null.
 */
function deriveNameSort(displayName: string): string | null {
  // <CC-implements>
}

interface AutoCreatedPerson {
  id: string;
  name: string;
  nameSort: string | null;
}

async function ensurePersonsExist(
  authorStrings: string[],
  tx: PostgresTx,
): Promise<AutoCreatedPerson[]> {
  // 1. dedupe author strings, slugify each
  // 2. SELECT existing persons.id matching the slug set
  // 3. compute the missing set
  // 4. INSERT missing rows with minimal data
  // 5. return the list of *newly* created entries (for persons.json append)
}

// Inside applyBook(), replacing the hardcoded block:
const allAuthorsThisBook = override.bookRosterEntry.authors;
const allEditorsThisBook = override.bookRosterEntry.editors ?? [];

if (allAuthorsThisBook.length === 0) {
  if (override.bookRosterEntry.editorialNote === "various") {
    // append authorship marker to bookDetails.notes
  } else if (allEditorsThisBook.length === 0) {
    console.warn(`unresolved_authorship: ${override.externalBookId}`);
  }
  // else: editors-only book, handled below
} else {
  const personRows = allAuthorsThisBook.map((author, displayOrder) => ({
    workId,
    personId: slugifyPerson(author),
    role: "author" as const,
    displayOrder,
  }));
  await tx.delete(workPersons).where(eq(workPersons.workId, workId));
  await tx.insert(workPersons).values(personRows);
}

if (allEditorsThisBook.length > 0) {
  // analoge Editor-Rows — Stretch
}
```

Die Konstante `AUTHOR_PERSON_ID` weg, sowie alle Stellen die sie referenzieren.

Schema-/Naming-Konventionen oben sind illustrativ. CC wählt finale Form, insbesondere ob `ensurePersonsExist` als Pre-Pass über die ganze Batch läuft oder pro Buch im Loop. Pre-Pass ist tendenziell sauberer (eine `persons.json`-Schreibaktion am Ende), aber etwas komplexer im Code-Flow.

### Persons.json-Erweiterung

Format pro Auto-Created Entry (analog zum existierenden Schema in `persons.json`):

```json
{
  "id": "<slug>",
  "name": "<original author string from roster>",
  "nameSort": "<derived or null>"
}
```

`bio`, `birthYear`, `lexicanumUrl`, `wikipediaUrl` werden NICHT geschrieben. Diese Lücke ist Persons-Resolver-Brief-Material später.

### Idempotenz-Re-Apply-Verifikation

Vor dem Fix-Deploy, in der DB:

```sql
SELECT person_id, COUNT(*) FROM work_persons GROUP BY person_id;
-- erwartet: dan_abnett | 10
```

Nach dem Fix-Deploy + Re-Apply:

```sql
SELECT person_id, COUNT(*) FROM work_persons GROUP BY person_id;
-- erwartet weiter: dan_abnett | 10
```

Plus Frontend-Smoke `curl http://localhost:3000/buch/xenos | grep "Dan Abnett"` → Match.

### Anthologie-Marker-Format-Vorschlag

```text
{existingNotesFromExcelOrSurfaceForms}\n\n---authorship---\n{
  "kind": "various",
  "editorialNote": "various"
}\n---/authorship---
```

Analog zum `---surfaceForms---`-Pattern aus Brief 060. CC darf die exakte Form wählen, solange Resolver-Brief später regex-extracten kann.

### Closes / impacts

- **Brief 060** (`ssot-w40k-001-db-apply`): inhaltlicher Bugfix für das implementierte Skript. Brief 060 selbst bleibt im Archiv unverändert (es war zum Zeitpunkt des Apply der korrekte Brief — der Bug war im Detail der Skript-Skizze). 062-Impl-Commit referenziert 060 als parent.
- **Brief 061** (`ssot-loop`): hängt operativ an 062. Loop-Iter 1 startet erst nach 062-Implementation. Sequenz: 062 implementieren → 061-Loop-Iter 1 starten.
- **Persons-Resolver-Brief** (zukünftig): wird Auto-Created Persons mit Bio + Wiki/Lex-URLs anreichern. Trigger-Schwelle analog zum Faktionen-Resolver — nach ~50 Bücher in Authority-Schicht und entsprechender Persons-Coverage. Out of Scope für 062.

### Tracked-for-future-briefs

- **Lessons-Learned-Brief**: „Skript-Skizzen-Disziplin in Cowork-Briefs — keine konkreten Datenwerte, nur Marker-Pseudocode" als kleine Hygiene-Notiz in `brain/wiki/workflows/cowork-session.md`. Konkrete Lehre aus dem 060-Bug.
- **Persons-Resolver-Brief**: Promotion von Auto-Created Persons mit Bio/Wiki/Lex-Anreicherung. Analog zum Faktionen-Resolver.
- **Roster-Datenlücken-Triage**: die 23 Bücher mit `authors: []` + null editorialNote brauchen Maintainer-Triage im Excel-SSOT. Cowork sammelt die im 062-Impl-Report.
- **persons.json-Sortierung-Lint**: wenn das File über die Zeit chaotisch wird (Auto-Append-Reihenfolge), kann ein Lint-Pass alphabetisch sortieren. Niedrige Priorität.

---

Brief 062 fixt einen direkten Bug, der die Loop-Iterationen aus Brief 061 sonst sofort kaputt machen würde. Klein, fokussiert, mit Re-Apply-Smoke als Idempotenz-Gate. Auto-Create-Pfad macht die Lösung skalierbar für die 92 fehlenden Autoren ohne Maintainer-Handarbeit pro Batch.
