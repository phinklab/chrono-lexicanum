---
session: 2026-05-11-062
role: implementer
date: 2026-05-12
status: complete
slug: apply-override-author-fix
parent: 2026-05-11-062
links:
  - 2026-05-11-062-arch-apply-override-author-fix
  - ../archive/2026-05/2026-05-11-060-arch-ssot-w40k-001-db-apply
  - ../archive/2026-05/2026-05-11-060-impl-ssot-w40k-001-db-apply
  - 2026-05-11-061-arch-ssot-loop
commits: []
---

# Apply-Override: Author-FK-Fix + Auto-Create für fehlende Persons

## Summary

`scripts/apply-override.ts` liest jetzt `roster.authors[]` + `roster.editors[]` pro Buch statt einer hardgecodeten `dan_abnett`-Konstanten, und ein Pre-Pass legt fehlende `persons`-Rows automatisch an (mit Sync-Write auf `scripts/seed-data/persons.json` am Ende). Re-Apply von `ssot-w40k-001` + Apply von `ssot-w40k-002` produzieren idempotent identische DB-Counts (20 work_persons, 11 dan_abnett + 9 sandy_mitchell), Frontend-Smoke (Vercel) bestätigt korrektes Author-Rendering auf 6 Slugs.

**Eine Sache, die Cowork wissen sollte:** Die DB war bereits im post-002-Apply-State, als die Session startete — `ssot-w40k-002` wurde zwischen Brief 061 und Brief 062 schon mit korrekten Authors apply't (vermutlich Maintainer-Manuell oder via temporärer lokaler Patch). Die Verifikation lief daher nicht als „pre=10 vs post=20", sondern als zwei aufeinanderfolgende idempotente Updates → DB-State bleibt identisch (20/20). Mein Fix produziert dieselbe FK-Auflösung wie die wer-auch-immer-Variante davor, also kein semantischer Drift.

## What I did

- `scripts/apply-override.ts` — kanonischer Fix in einer Datei:
  - **Removed:** `AUTHOR_PERSON_ID`-Konstante (war Line 66).
  - **Added:** `slugifyPerson` (NFKD-strip → lower → non-alnum-collapse), `deriveNameSort` ("Lastname, Firstname rest", single-token-Fallback auf den Token selbst wegen NOT-NULL-Schema-Constraint), `buildAuthorshipBlock` (`---authorship---`-Marker-Block analog zu `---surfaceForms---`), `ensurePersonsExist` (Pre-Pass: dedupe → SELECT-Lookup → INSERT-missing-as-block mit `onConflictDoNothing`).
  - **Added types:** `AutoCreatedPerson`, `AuthorshipMarker`, `PersonsJsonEntry`.
  - **Modified `composeNotes`:** neuer optionaler 3. Parameter für den Authorship-Block (Resolver-Brief kann das Format später via Regex extrahieren).
  - **Modified `applyBook`:** Ersatz des Hardcode-`workPersons`-Insert-Blocks durch Loops über `roster.authors[]` (`role="author"`) und `roster.editors[]` (`role="editor"`) mit aufsteigendem `displayOrder`. Anthologie-Edge-Case-Branching: `authors=[]` + `editorialNote="various"` → kein Author-Row + `authorship`-Marker; `authors=[]` + `editorialNote=null` + `editors=[]` → loud-Warn + keine Row.
  - **Modified `main`:** Pre-Pass-Call nach `validateFacetIds`, atomarer persons.json-Write nach `applyCollections` (nur wenn `autoCreated.length > 0`), Unresolved-Authorship-Summary am Ende.
  - **Updated header docblock** für die fünf neuen Pass-Schritte (Pre-Pass + Per-Book + Collections + persons.json-Append).

## Decisions I made

- **Slugify-Regel: `\p{Mn}`-Unicode-Property-Escape statt literaler Combining-Diacritics-Range.** Erste Implementation hatte `/[̀-ͯ]/g` mit literalen U+0300/U+036F-Chars — funktional korrekt, aber unsichtbar im Code-Review. `\p{Mn}` (Mark, Nonspacing) + `u`-Flag ist semantisch präzise und review-freundlich.

- **NameSort-Single-Token-Fallback auf `name` selbst statt NULL.** Brief schlug NULL vor, aber `persons.name_sort` ist `text("name_sort").notNull()` im Schema (`src/db/schema.ts:547`). NULL würde den Insert sprengen. Praktischer Fallback: "Anonymous" → nameSort "Anonymous". Schema bleibt happy, alphabetische Sortierung bleibt sinnvoll. Heute in 001+002 nicht real getriggert (alle Roster-Autoren sind Multi-Token), aber Edge-Case ist sauber abgedeckt.

- **Editors-Stretch mitgemacht.** Brief offerierte es als Stretch oder als Marker-Workaround. Da (a) `personRole`-Enum bereits `editor` enthält, (b) die `work_persons`-PK `(work_id, person_id, role)` einen Menschen sogar als Author + Editor derselben Sammlung erlaubt, und (c) der Code-Pfad mit Authors strikt symmetrisch wird (selbes slugify+Push), habe ich die Editor-Rows direkt mitgebaut. Pre-Pass kollektiert Authors + Editors gemeinsam, `applyBook` schreibt beide Rollen mit aufsteigender `displayOrder`. Heute in 001+002 nicht real getriggert (alle Bücher haben `editors: []`), aber die Loop-Iterationen 003+ werden Anthologien treffen.

- **Pre-Pass außerhalb der Per-Buch-Transaktionen** (Cowork-Empfehlung, Brief § Reihenfolge im Lauf). `ensurePersonsExist` läuft als ein einziger Block: dedupe-Walk → SELECT-Lookup → INSERT-missing mit `onConflictDoNothing`. Pro Buch ist FK-Safety dann garantiert ohne ON-CONFLICT-Komplexität im Per-Buch-Code. `onConflictDoNothing` macht den Pre-Pass auch resilient gegen parallele Läufe (nicht das aktuelle Szenario, aber kein Aufpreis).

- **persons.json-Append: chronologisch am Ende.** Cowork-Tendenz aus dem Brief. Heute kein realer Schreibvorgang (0 auto-created), aber wenn 003+ Auto-Creates triggern: minimaler git-diff (append-only), `{ id, name, nameSort }` mit `null`-Auslassung der Optional-Felder.

- **Authorship-Marker als eigener delimitierter Block, nicht in surfaceForms-Payload.** Brief schrieb „analog zum `---surfaceForms---`-Block". Ich habe das wörtlich umgesetzt — separater `---authorship---{...}---/authorship---`-Block nach surfaceForms, derselbe JSON-Pretty-Print-Style. Resolver-Brief kann beide unabhängig regex-extracten.

- **Verifikations-Pfad für Frontend-Smoke: DB-Query-Replay + Vercel-Prod.** Localhost-Dev-Server war pre-session in einem broken Jest-Worker-State (`exit code 500` auf jedem `/buch/`-Endpoint, seit ~01:54 mit "Jest worker encountered 2 child process exceptions, exceeding retry limit"-Schleife). Restart blockt durch Sandbox-Classifier (unknown PID 6872). Ich habe zwei alternative Verifikations-Pfade gewählt: (a) Throwaway-`tsx`-Skript, das `loadBookBySlug` 1:1 replayt (gleicher Drizzle-Query-Pfad wie Server-Render), (b) Vercel-Prod-Curl auf <https://chrono-lexicanum.vercel.app/buch/$slug>. Beide grün für alle 6 Slugs. Vercel-Prod liest dieselbe Supabase wie Localhost, also identische DB-Sicht.

- **brain:lint Pre-Existing-Drift nicht gefixt.** 28 Blocking-Findings im Lint-Report, alle Pfad-Referenzen in `brain/wiki/{open-questions,project-state,pipeline-state,deferred-questions,log}.md` und `brain/wiki/decisions/why-excel-ssot-not-crawl.md` auf un-archivierte 054/055-Sessions, die im uncommitted-state-bei-Session-Start bereits ins `sessions/archive/2026-05/`-Verzeichnis gemoved waren. Mein Diff berührt **keine** `brain/`-Datei. Brief 062 § Out of scope sagt explizit "Brain-Hygiene macht Cowork separat" — ich habe das wörtlich genommen und die Pfad-Repair-Updates nicht in 062-Scope gezogen. Detail-Dump in Sektion „Open issues / blockers" unten.

## Verification

### Slugify Re-Derivation (acceptance bullet a)

Throwaway-Skript hat alle 12 bestehenden `persons.json`-Einträge geprüft: `slugifyPerson(name)` reproduziert `id` und `deriveNameSort(name)` reproduziert `nameSort` für alle 12. **0 Mismatches**, Output:

```
OK OK  Dan Abnett               id=dan_abnett               sort='Abnett, Dan'
OK OK  Guy Haley                id=guy_haley                sort='Haley, Guy'
OK OK  Aaron Dembski-Bowden     id=aaron_dembski_bowden     sort='Dembski-Bowden, Aaron'
OK OK  Graham McNeill           id=graham_mcneill           sort='McNeill, Graham'
OK OK  Sandy Mitchell           id=sandy_mitchell           sort='Mitchell, Sandy'
OK OK  Gav Thorpe               id=gav_thorpe               sort='Thorpe, Gav'
OK OK  Chris Wraight            id=chris_wraight            sort='Wraight, Chris'
OK OK  Nate Crowley             id=nate_crowley             sort='Crowley, Nate'
OK OK  Robert Rath              id=robert_rath              sort='Rath, Robert'
OK OK  Phil Kelly               id=phil_kelly               sort='Kelly, Phil'
OK OK  Rachel Harrison          id=rachel_harrison          sort='Harrison, Rachel'
OK OK  Ben Counter              id=ben_counter              sort='Counter, Ben'
Total: 12 persons, 0 mismatches
```

### Static checks

- `npm run typecheck` — pass (clean).
- `npm run lint` — 0 errors, 1 pre-existing warning (`src/app/layout.tsx:44` Custom Fonts, seit pre-060).
- `npm run brain:lint -- --no-write` — **28 Blocking, 5 Warnings (alle pre-existing, siehe „Open issues" unten)**. Mein Diff berührt keine `brain/`-Datei; die Drift stammt aus dem uncommitted Session-Archive-Move-State bei Session-Start.

### Re-Apply ssot-w40k-001 (acceptance bullet "idempotency smoke")

```
[apply-override] batch=ssot-w40k-001
[apply-override] loaded override: 10 books; createdBy=cowork-opus
[apply-override] validated 35 distinct facet ids
[apply-override] ensurePersonsExist: 1 distinct slugs in batch, 0 newly created in DB
[apply-override]   W40K-0001 xenos                  path=update facets=17 factions=2 locations=0 authors=1 editors=0
[apply-override]   W40K-0002 malleus                path=update facets=19 factions=2 locations=0 authors=1 editors=0
[apply-override]   W40K-0003 hereticus              path=update facets=20 factions=3 locations=0 authors=1 editors=0
[apply-override]   W40K-0004 eisenhorn-omnibus      path=update facets=21 factions=3 locations=0 authors=1 editors=0
[apply-override]   W40K-0005 ravenor                path=update facets=19 factions=2 locations=1 authors=1 editors=0
[apply-override]   W40K-0006 ravenor-returned       path=update facets=20 factions=2 locations=0 authors=1 editors=0
[apply-override]   W40K-0007 ravenor-rogue          path=update facets=21 factions=2 locations=0 authors=1 editors=0
[apply-override]   W40K-0008 ravenor-the-omnibus    path=update facets=20 factions=2 locations=0 authors=1 editors=0
[apply-override]   W40K-0009 pariah                 path=update facets=20 factions=2 locations=0 authors=1 editors=0
[apply-override]   W40K-0010 the-magos              path=update facets=20 factions=4 locations=0 authors=1 editors=0
[apply-override] work_collections written: 6 rows
[apply-override] DB-side counts: { works: 10, work_facets: 197, work_persons: 10, work_factions: 24, work_locations: 1, work_collections: 6 }
[apply-override] done. inserts=0 updates=10 total=10
```

Alle 10 Bücher = `path=update`. 1 distinct slug (Dan Abnett), 0 neu erstellt. Counts identisch zur Brief-060-Verifikation (197 facets, 10 persons, 24 factions, 1 location, 6 collections).

### First-Apply ssot-w40k-002 (acceptance bullet "Roster-Read real-test")

```
[apply-override] batch=ssot-w40k-002
[apply-override] loaded override: 10 books; createdBy=claude-code
[apply-override] validated 33 distinct facet ids
[apply-override] ensurePersonsExist: 2 distinct slugs in batch, 0 newly created in DB
[apply-override]   W40K-0011 penitent               path=update facets=19 factions=2 locations=0 authors=1 editors=0
[apply-override]   W40K-0012 for-the-emperor        path=update facets=19 factions=1 locations=0 authors=1 editors=0
[apply-override]   W40K-0013 caves-of-ice           path=update facets=17 factions=1 locations=0 authors=1 editors=0
[apply-override]   W40K-0014 the-traitors-hand      path=update facets=19 factions=1 locations=0 authors=1 editors=0
[apply-override]   W40K-0015 death-or-glory         path=update facets=17 factions=0 locations=0 authors=1 editors=0
[apply-override]   W40K-0016 duty-calls             path=update facets=19 factions=2 locations=0 authors=1 editors=0
[apply-override]   W40K-0017 cains-last-stand       path=update facets=20 factions=3 locations=1 authors=1 editors=0
[apply-override]   W40K-0018 the-emperors-finest    path=update facets=18 factions=1 locations=0 authors=1 editors=0
[apply-override]   W40K-0019 the-last-ditch         path=update facets=18 factions=2 locations=0 authors=1 editors=0
[apply-override]   W40K-0020 the-greater-good       path=update facets=18 factions=2 locations=0 authors=1 editors=0
[apply-override] work_collections written: 0 rows
[apply-override] DB-side counts: { works: 10, work_facets: 184, work_persons: 10, work_factions: 15, work_locations: 1, work_collections: 0 }
[apply-override] done. inserts=0 updates=10 total=10
```

**Wichtig:** Alle 10 = `path=update` (nicht `insert` wie der Brief erwartete) — DB war bereits im post-002-State bei Session-Start (siehe Summary). 2 distinct slugs (Dan Abnett + Sandy Mitchell), 0 neu erstellt. 0 unresolved authorship. 0 work_collections (das 002-Batch enthält keinen Omnibus, der einen Inhalt aus demselben Batch sammelt — der einzige Cain-Omnibus *„The Greater Good"* (W40K-0020) ist im SSOT als `novel` getaggt, also keine Collection-Beziehung).

### DB-Pre/Post-Snapshot

Pre (Session-Start) und Post (nach beiden Applies) identisch:

```
persons.count = 12
works.count = 20
work_persons by (person_id, role):
  dan_abnett        author   11
  sandy_mitchell    author    9

per-book work_persons (alle displayOrder=0):
  W40K-0001..0010   author   dan_abnett        (10 Bücher, 001-Batch)
  W40K-0011         author   dan_abnett        (Bequin Penitent, 002-Batch)
  W40K-0012..0020   author   sandy_mitchell    (9 Cain books, 002-Batch)
```

`persons.json` byte-identisch (0 auto-created → kein Write).

### Anthologie-Edge-Case (acceptance bullet)

0 Treffer in 001 und 002. Alle 20 Bücher haben mindestens einen Roster-Author. Loud-Warn-Pfad nicht aktiviert. Authorship-Marker nicht geschrieben. Liste der Treffer: leer.

### Frontend-Smoke (acceptance bullet)

Lokaler Dev-Server (PID 6872) war seit ~01:54 in einem broken Jest-Worker-Loop (siehe „Open issues" unten). Zwei alternative Pfade:

1. **DB-Query-Replay** (Throwaway-`tsx` mit identischem Drizzle-Query-Pfad wie `loadBookBySlug` in `src/app/buch/[slug]/page.tsx`):

   ```
   OK  /buch/xenos                 expected="Dan Abnett"     got="by Dan Abnett"
   OK  /buch/eisenhorn-omnibus     expected="Dan Abnett"     got="by Dan Abnett"
   OK  /buch/the-magos             expected="Dan Abnett"     got="by Dan Abnett"
   OK  /buch/for-the-emperor       expected="Sandy Mitchell" got="by Sandy Mitchell"
   OK  /buch/caves-of-ice          expected="Sandy Mitchell" got="by Sandy Mitchell"
   OK  /buch/cains-last-stand      expected="Sandy Mitchell" got="by Sandy Mitchell"
   Results: 6 ok, 0 fail (of 6)
   ```

2. **Vercel-Prod-Curl** (gleicher DB-Backend, anderer App-Build):

   ```
   HTTP 200 /buch/xenos                 Dan_count=1  Sandy_count=0
   HTTP 200 /buch/eisenhorn-omnibus     Dan_count=1  Sandy_count=0
   HTTP 200 /buch/the-magos             Dan_count=1  Sandy_count=0
   HTTP 200 /buch/for-the-emperor       Dan_count=0  Sandy_count=1
   HTTP 200 /buch/caves-of-ice          Dan_count=0  Sandy_count=1
   HTTP 200 /buch/cains-last-stand      Dan_count=0  Sandy_count=1
   ```

Beide Pfade konsistent: jeder Slug rendert genau den erwarteten Author, kein Cross-Talk.

## Open issues / blockers

- **brain:lint Pre-Existing-Drift (28 Blocking).** Alle 28 sind Pfad-Referenzen in `brain/wiki/*.md` auf un-archivierte 054/055-Session-Pfade. Im git-status bei Session-Start liegen diese Sessions bereits unter `sessions/archive/2026-05/`, aber die `sources:`-Frontmatter und Inline-Links der Brain-Wiki-Pages zeigen noch auf die un-archivierten Pfade. Datei-Liste: `brain/wiki/deferred-questions.md`, `open-questions.md`, `pipeline-state.md`, `project-state.md`, `log.md`, `decisions/why-excel-ssot-not-crawl.md`. Fix ist mechanisch (Pfad-Replace `../../sessions/<id>` → `../../sessions/archive/2026-05/<id>`), aber per Brief 062 § Out of scope „Brain-Hygiene macht Cowork separat". Hinweis für Cowork: spätestens vor dem nächsten brain:lint-CI-Run muss das gefixt sein, sonst blockt CI.

- **Localhost-Dev-Server in broken Jest-Worker-State.** PID 6872 läuft auf Port 3000 seit pre-Session, ist seit 01:54 in einer `Jest worker encountered 2 child process exceptions, exceeding retry limit`-Schleife — jeder `/buch/*`-Request returnt HTTP 500 obwohl die DB-Queries laut Server-Log sauber durchlaufen. Kill-Versuch via `taskkill /PID 6872 /F` blockt durch den Sandbox-Classifier (unknown PID). Empfehlung an den Maintainer: PID 6872 manuell killen + `npm run dev` neu starten, sobald die Iter 062 abgesessen ist; das ist keine 062-spezifische Issue (Dev-Server ist Tool-Setup, nicht Code).

- **Pre-existing post-002-Apply-DB-State.** Wie in Summary erwähnt — die DB hatte alle 20 work_persons mit korrekten Authors bei Session-Start. Ich habe keine git-history gefunden, die einen Apply von 002 nach Brief 061's Override-File-Commit nachweist (`scripts/apply-override.ts` im main hat noch den Hardcode). Vermutlich Maintainer-Manuell oder eine lokale Patch-und-Apply-Action zwischen den Sessions, deren Code nicht committed wurde. Hinweis falls Cowork da etwas Spezifisches will: ich habe die finale FK-Auflösung verifiziert, aber nicht die Genese.

## For next session

1. **Brain-Hygiene-Pass für Cowork.** 28 brain:lint-Blocking via Pfad-Repair (mechanisch). Plus die hierher noch nicht migrierten 058+060+061-Sessions ins Archiv ziehen (gitStatus zeigt sie als gelöscht in `sessions/`, aber nicht alle haben ihre `sessions/archive/2026-05/`-Counterparts — z.B. 058 fehlt komplett im Archiv).

2. **Brief 061 Loop-Iter 2 (ssot-w40k-003).** 062 ist done; Loop kann jetzt sicher weiterlaufen. Bei W40K-0021..0030 ist Coverage noch Sandy-Mitchell-stark (Emperor's Finest-Sequel) oder switch auf William King, Ben Counter — beide letztere existieren bereits in `persons.json`. Wenn ein neuer Author (z.B. James Swallow, Chris Roberson) reinkommt: das ist der erste reale Auto-Create-Trigger im Loop. Empfehlung: nach Iter 2 (oder spätestens 3) den Auto-Create-Pfad in einem 003-impl-Report bestätigen — falls die Slugify-Regel auf Edge-Cases der Iter-2-3-Autoren (Doppelnachname, Initialen, Apostrophe) was Unerwartetes produziert, ist der Moment zur Korrektur klein.

3. **Optional: nameSort-Display-Konvention.** Mein Single-Token-Fallback („Anonymous" → „Anonymous") hält die NOT-NULL-Constraint, ist aber semantisch nicht optimal (Sortierung würde es zwischen "A"-Namen einsortieren statt z.B. ganz unten als „Various/Anonymous"). Wenn der Roster jemals einen ein-Wort-Autor produziert, wäre eine Konvention wie nameSort = "z_anonymous" (Lower-Bucket-Sort-Trick) eine Folge-Brief-Frage. Heute kein Treffer; rein theoretisch.

4. **Pipeline-Stage-3-Dead-Code-Cleanup** (Brief 061 § Tracked-for-future) — bleibt valide.

## References

- Brief: `sessions/2026-05-11-062-arch-apply-override-author-fix.md`
- Schema: `src/db/schema.ts` (persons + workPersons + personRole enum)
- Roster: `scripts/seed-data/book-roster.json`
- Persons-Mirror: `scripts/seed-data/persons.json`
- Render-Pfad: `src/app/buch/[slug]/page.tsx` (loadBookBySlug)
- Brain-Lint-Report: `brain/outputs/lint/2026-05-12.md`
