# DB-Apply Runbook — `db:sync` (Default) · `db:drift` (Check) · `db:rebuild` (Disaster-Recovery)

> **Manuelle Ops-Befehle, keine Session.** Dieses Runbook ist die operative Spec für die drei Befehle, mit denen committete SSOT-Änderungen in die Live-DB kommen bzw. überprüft werden. Kein Brief nötig; die Herkunft der Rationale (Briefs 107 / 149 / 152 / 157) steht im Anhang.
>
> *(Dateiname bleibt `db-rebuild-runbook.md`, damit der `brain/wiki`-Querverweis nicht bricht — inhaltlich deckt es jetzt `db:sync` + `db:drift` + `db:rebuild` ab. Eine etwaige Umbenennung + Brain-Link-Fix ist ein Coordination-Pass, kein Batches-Job.)*

> **⚙ Per-Buch-Update (Brief 171 Teil B).** Der Korpus lebt jetzt ausschließlich in `scripts/seed-data/books/*.json`. Die Ketten wurden umgebaut: der **Preflight** ist `npm run book:preflight` (DB-frei: parse/eindeutig/`collects`/Prolog-Kataloge — **keine** Batch-Contiguity mehr), und der **primäre Korpus-Schritt** ist `npm run apply:book -- --all --mode post-retirement` (er fährt den Reference-/Facet-Seed-Prolog selbst). Der alte Legacy-Korpus-Schritt (`run-phase4-apply.sh` über `db:apply-override`) ist **abgelöst**; `db-apply-scope.ts` ist retired. „Roster" unten = jetzt der per-Buch-Korpus; die Tails (podcast/audiobook/timeline/curation) sind unverändert.

## Das Modell (Brief 157) — ein Handgriff für jede Änderung

Der **destruktive Full-Rebuild ist NICHT mehr der Alltag.** Er war als Recovery-Werkzeug gebaut (Brief 107) und wurde fälschlich zur Routine-Deployment-Methode gemacht; ein From-Reset-Rebuild muss *alles* in einem Schuss neu derivieren, und eine einzige Lücke reißt den ganzen `works`-Bereich um (der 96+Drukhari-Abbruch am 2026-06-18 mit halb-truncatetem Prod).

Das neue Modell:

| Befehl | Was | Wann |
|---|---|---|
| **`npm run db:sync`** | **Nicht-destruktiver Default-Apply.** Re-applied den ganzen committeten Roster + alle Tails idempotent, **ohne je zu truncaten**. | **Für JEDE Routine-Änderung.** Der dokumentierte „push meine Änderungen"-Weg. |
| **`npm run db:drift`** | **Read-only Health-Check.** Sagt, ob die DB gesund aussieht — und ob ein Rebuild überhaupt gerechtfertigt ist. Schreibt nie. | Vor einem Verdacht auf Divergenz; vor einem Rebuild. |
| **`npm run db:rebuild -- --confirm`** | **Disaster-Recovery.** `db:sync` **plus** vorangestelltes confirm-gegatetes `TRUNCATE`. | **Fast nie.** Frische/migrierte DB, oder wenn `db:drift` echte Divergenz zeigt, die ein Re-Sync nicht behebt. |

### „Wie kriege ich Änderung X rein?" — immer derselbe Handgriff

Egal welche Quelle sich ändert, der Handgriff ist **immer** `npm run db:sync`. Es gibt **keinen** Targeted-/`--only`-Modus, **kein** neues DB-Apply-Log, **keine** extra Tabelle — bei ~2k Works ist „voller Roster re-apply, aber nicht-destruktiv" die simpelste robuste Logik.

| Änderungs-Typ | Quelle (committete Datei) | Handgriff |
|---|---|---|
| 1 Buch / 3 Bücher / kleine Korrektur in einer Batch | `scripts/seed-data/manual-overrides-ssot-*.json` | Quelle ändern → PR/Merge → `npm run db:sync` |
| **Neue Batch-Range crystallized** (z. B. `ssot-w40k-061`) | neue `manual-overrides-ssot-*.json` | Datei committen → PR/Merge → `npm run db:sync` — **Scope leitet sich automatisch ab, KEIN Config-Bump** |
| **Neues Buch (Per-Buch-SSOT, Brief 170 Teil A)** | neue `scripts/seed-data/books/<slug>.json` (`$schema: "book-v1"`) | Datei committen → PR/Merge → `npm run apply:book -- --slug <slug>` (gezielt) **oder** `npm run db:sync` (der `--all`-Per-Buch-Tail fährt mit). Voller Flow + DB-Write-Gate: `scripts/runbooks/add-book-runbook.md` |
| Neue Reference-Entity (Fraktion, Person, Ort, Charakter …) | `scripts/seed-data/factions.json` / `persons.json` / … | Quelle ändern → PR/Merge → `npm run db:sync` |
| Hand-Kuration (z. B. die 96 Korrekturen) | `scripts/seed-data/curation-overlay.json` | Overlay ändern → PR/Merge → `npm run db:sync` |
| Hörbuch-Credits | `scripts/seed-data/audiobook-narrators.json` | Sidecar ändern → PR/Merge → `npm run db:sync` |
| Podcast-Folgen / -Shows | `ingest/podcasts/<slug>.json` (committetes Artefakt) | Artefakt aktualisieren → PR/Merge → `npm run db:sync` |
| Timeline (Eras / Events / Hooks / Buch-Daten) | `eras.json` / `events.json` / `event-works.json` / `book-dates.json` | Seed ändern → PR/Merge → `npm run db:sync` |

> **Der Drukhari-Fall, neu gedacht.** Eine neue Fraktion braucht **gar keinen** Rebuild — Reference-Tabellen überleben einen Truncate ohnehin. Unter dem neuen Modell ist „neue Fraktion" ein Reference-Upsert (`factions.json` → `db:sync`), „96 Korrekturen" ein Curation-Overlay-Apply (`curation-overlay.json` → `db:sync`). Beides nicht-destruktiv.

---

## `db:sync` — der nicht-destruktive Default

`scripts/db-sync.sh` ist **`db:rebuild` minus Truncate**. Er sitzt **über** den bestehenden Bausteinen und verkettet sie idempotent in der einen Reihenfolge, die auflöst; er reimplementiert keinen davon.

```
npm run db:sync
```

Hilfe (kein DB-Zugriff): `npm run db:sync -- --help`. Fallback, falls die npm-Shell `bash` nicht auflöst (Windows): `bash scripts/db-sync.sh`.

### Die Sequenz (zehn Schritte, strikt sequenziell, Fail-Fast)

1. **Preflight — `db-apply-scope.ts --emit-config`** (read-only). Leitet den Apply-Scope aus dem committeten Roster auf der Platte ab, prüft Lückenlosigkeit und schreibt die abgeleitete Config (`ingest/.state/db-apply.derived.config.json`, gitignored). **Hält hier laut an** (vor jedem Write), wenn eine Datei fehl-benannt ist oder eine Lücke klafft (siehe „Auto-Scope + Preflight-Guard").
2. **`run-phase4-apply.sh <derived cfg>`** — re-applied den vollen kristallisierten Override-Roster beider Domänen (auto-abgeleitet: heute `w40k` 1..60 + `hh` 1..30 = 90 Batches) idempotent (delete-then-insert pro Junction). Seedet vorab Resolver-Extensions + Facets non-destruktiv. Stellt `author|editor`-`work_persons` wieder her.
3. **`apply:book -- --all`** (Tail, additiv, Brief 170 Teil A) — appliziert jede committete `scripts/seed-data/books/<slug>.json` (Per-Buch-SSOT) über denselben geteilten Writer wie der Legacy-Batch-Apply (`book-apply-shared.ts`). Läuft **nach** dem Legacy-Korpus und **vor** den Podcast-/Timeline-/Curation-Tails, damit Per-Buch-`works` existieren, wenn Buch-Daten + Curation-Edges gegen `works.id` auflösen. Seedet seinen eigenen Reference-/Facet-Prolog; idempotent; ein **leerer** `books/`-Ordner ist ein sauberer No-op (Teil A liefert ihn leer aus).
4. **`apply:podcast -- --all`** (Tail) — stellt die 4 committeten Podcast-Shows + Episoden wieder her. Läuft **nach** dem Korpus (die `works` existieren) und **vor** der Timeline (Schritt 7), weil die `event_works`-Hooks mit `role=podcast` gegen diese Podcast-`works` auflösen.
5. **`apply:audiobook-narrators`** (Tail) — stellt die `narrator|co_narrator|full_cast`-`work_persons`-Rows wieder her.
6. **`apply:audiobook-narrators --verify`** — read-only Post-Condition (exakte Sidecar-Menge, siehe unten).
7. **`apply:timeline`** (Tail) — stellt Eras + Events (upsert), `event_works` (wholesale aus `event-works.json`) und die `works.startY/endY/setting*`-Spalten der datierten Werke wieder her; remappt `book_details.primary_era_id` und löscht die retirten Eras. Läuft **vor** der Curation, damit die Hand-Kuration bei `primary_era_id` zuletzt gewinnt.
8. **`apply:timeline --verify`** — read-only Post-Condition (exakte Seed-Menge, siehe unten).
9. **`apply:curation-overlay`** (Tail) — re-assertet die maintainer-entschiedenen Hand-Overrides. Läuft **zuletzt**, damit die suppress-Edges existieren (um gelöscht zu werden), die add-Edges nach der Welle gewinnen und der `primaryEraId`-Feld-Fix den Timeline-Remap überschreibt.
10. **`apply:curation-overlay --verify`** — read-only Post-Condition (jede add-Edge präsent, jede Suppression abwesend, jedes Feld gleich).

### Was `db:sync` garantiert — und was nicht

- **Garantiert:** Kein Truncate, also **nie ein halb-leerer `works`-Bereich** — die DB serviert durchgehend weiter. Idempotent: zweimal `db:sync` → selber Endzustand.
- **NICHT garantiert:** dass ein Fehlschlag **mitten im Lauf** keinen Misch-Zustand hinterlässt. Fällt Schritt 2 bei Batch 40 von 90 aus, sind 1..39 ggf. schon neu appliziert, 40+ noch alt. Das ist **sicher, weil idempotent re-runnable** (nochmal `db:sync` → sauberer Endzustand), aber es ist **nicht** „zuvor servierte Daten bleiben exakt konsistent". Fail-Fast bricht mit klarem Marker ab; einfach die Ursache fixen und neu laufen.

---

## Auto-derived Apply-Scope + Preflight-Guard (Brief 157)

Der Apply-Scope ist **nicht mehr hand-gepinnt.** Es gibt **keine** `scripts/db-rebuild.config.json` mehr (in Brief 157 gelöscht). „Sync/Rebuild = der ganze committete Roster" ist jetzt die **Definition**:

- `scripts/db-apply-scope.ts` scannt die committeten `scripts/seed-data/manual-overrides-ssot-<domain>-NNN.json`, gruppiert pro Domäne und leitet die Ranges ab (`from: 1`, `to: max committed`). Auto-Derive deckt **jede** gefundene Domäne ab — eine künftige Domäne wird ohne Edit mitgenommen.
- Die abgeleitete Config landet in `ingest/.state/db-apply.derived.config.json` (gitignored, regenerierbar, **nie** committen/editieren) und wird an `run-phase4-apply.sh` durchgereicht.

**Der Preflight-Guard** hält den Lauf **laut an, bevor irgendetwas geschrieben oder truncatet wird** (nonzero Exit, `[db-apply-scope] HALT:`-Marker), bei zwei Fehlerbildern:

1. **Stray / fehl-benannte Datei** — ein `manual-overrides-ssot-*.json`, das nicht zum strikten `ssot-<domain>-NNN`-Schema passt (eine committete Batch, die der Scope nicht klassifizieren kann).
2. **Lücke** — eine fehlende Nummer in der `1..max`-Folge einer Domäne (z. B. `ssot-w40k-041` fehlt).

Damit ist der Brief-156-Fehler (Config bei `to: 57` gepinnt, committed bis 60 → 58–60 still gedroppt) strukturell unmöglich: der Scope **ist** der committete Bestand, und alles, was nicht sauber dazu passt, stoppt den Lauf statt still zu verschwinden.

Standalone prüfbar (DB-frei): `npm run db:apply-scope` (Human-Report) bzw. `npm run db:apply-scope -- --json`.

---

## `db:drift` — read-only Health-Check

`scripts/db-drift.sh` sagt dem Maintainer, ob die DB gesund **gegenüber dem committeten SSOT** aussieht — und damit, ob ein (seltener, destruktiver) Rebuild überhaupt gerechtfertigt ist. **Schreibt nie.** Anders als `db:sync`/`db:rebuild` ist er **nicht** Fail-Fast: er fährt **jeden** Check und fasst am Ende zusammen, damit ein rotes Signal die anderen nicht verdeckt.

```
npm run db:drift
```

Er komponiert ausschließlich **bestehende** read-only Signale (keine neue Vergleichslogik):

1. **Batch-Contiguity** — `db-apply-scope` (committeter Roster lückenlos + vollständig im Scope; DB-frei).
2. **Counts** — `db-counts.ts` (Junction-/Reference-/Works-Zählung; beweist nebenbei, dass die DB erreichbar ist).
3. **Audiobook-Verify** — `apply:audiobook-narrators --verify` (exakte Sidecar-Menge == DB).
4. **Timeline-Verify** — `apply:timeline --verify` (exakter Timeline-Seed-Zustand == DB).
5. **Curation-Verify** — `apply:curation-overlay --verify` (jede Hand-Override-Edge/Feld == DB).
6. **Per-Buch-Verify** — `apply:book --verify` (jede `scripts/seed-data/books/*.json` in `works` präsent: Slug + `book_details`-Row; leerer Ordner = Pass, Brief 170 Teil A).
7. **Podcast-Artifact-Drift** — `refresh:audit-artifacts` (committete Podcast-Artefakte ↔ DB-Episode-Guids pro Show).

**Was `db:drift` bewusst NICHT tut** (Brief 157): einen exakten „DB == der KOMPLETTE SSOT"-Deep-Diff. Die Tail-`--verify`s beweisen ihre **eigenen Slices** (Audio / Timeline / Curation) exakt, und die Contiguity beweist, dass der Apply-Scope vollständig ist — aber eine **stale Korpus-Junction innerhalb einer applizierten Batch** fängt der Health-Check **nicht**. Ein voller DB==SSOT-Vergleich ist ein vertagter Follow-up. Ist ein Check rot: erst `npm run db:sync` (nicht-destruktiv); bleibt er rot, untersuchen / ggf. Rebuild.

> **Hinweis — `refresh:check` ist KEIN db:drift-Baustein.** `refresh:check` / `refresh:check:ci` detektieren **upstream-neuen** Content (Bücher/Podcast-Folgen) gegen den committeten Bestand (Ingestion-Frische) und fassen die DB **nie** an. Das ist eine andere Frage als „ist die DB im Sync mit dem committeten SSOT". `refresh:audit-artifacts` (read-only, DB-lesend) ist der relevante Podcast-Drift-Baustein und ist in `db:drift` eingebunden.

---

## `db:rebuild` — Disaster-Recovery (fast nie)

`scripts/db-rebuild.sh` ist jetzt definiert als **`db:sync` + vorangestelltes confirm-gegatetes Truncate**. Der destruktive Truncate ist das **einzige**, was er über `db:sync` hinaus tut; die ganze Restore-Kette lebt in `db-sync.sh` und wird geteilt.

> **⚠ Du brauchst das fast nie.** Der Routine-Weg ist `npm run db:sync` (kein Truncate). Nutze den Rebuild **nur** für From-Clean-Recovery: eine frische/migrierte DB, oder wenn `npm run db:drift` echte Divergenz zeigt, die ein Re-Sync nicht behebt.

### Wann ihn fahren

- Eine DB von Grund auf neu auf den aktuellen Stand bringen (Schema-Wechsel, Umzug auf eine frische Supabase-Instanz, Wiederherstellung nach einem Works-Domain-Schaden).
- **Nicht** für den Routine-Betrieb: jede committete Änderung geht über `db:sync`.

### Der Befehl (Confirm-gegatet)

Der Rebuild ist **destruktiv** (er truncatet `works`). Er verweigert ohne explizite Bestätigung; ein **nacktes** `npm run db:rebuild` truncatet **nicht**.

```
npm run db:rebuild -- --confirm
```

Äquivalent: `DB_RESET_CONFIRM=1 npm run db:rebuild`. Fallback (Windows): `bash scripts/db-rebuild.sh --confirm`. Hilfe: `npm run db:rebuild -- --help`.

### Die Sequenz (drei Schritte, Fail-Fast)

1. **Preflight — `db-apply-scope`** (read-only): validiert den Apply-Scope **vor** dem Truncate, damit ein bestätigter Rebuild nie in einen Roster truncatet, den er danach nicht voll re-applizieren kann. (`db:sync` in Schritt 3 fährt den Preflight im `--emit-config`-Modus erneut — harmlos + idempotent; dieser Lauf hier ist die harte Garantie, dass der Guard **vor** dem Truncate feuert.)
2. **`db:reset-for-ssot --confirm`** — `TRUNCATE works CASCADE`. Die Works-Domäne wird geleert (inkl. `work_persons`, Podcasts, `event_works` und der Timeline-Spalten auf `works`); die **Reference-Tabellen** (`persons`, `factions`, `characters`, `locations`, `eras`, `series`, `sectors`, `services`, `facet_*`) bleiben unangetastet.
3. **`db:sync`** — die volle nicht-destruktive Restore-Kette (Korpus + Podcast + Audiobook + Timeline + Curation, jeweils verify-gegatet). Identisch zu einem Standalone-`db:sync`; der einzige Unterschied zur Routine ist der Truncate, der davor lief.

---

## Vorbedingungen (für `db:sync` und `db:rebuild`)

1. **Migrationen angewandt.** Das Schema muss existieren — `npm run db:migrate` gegen die Ziel-DB ist gelaufen. Weder Sync noch Rebuild legt Tabellen an.
2. **Reference-Katalog vorhanden.** Beide setzen einen vorhandenen Reference-Katalog voraus (Base-Reference-Seed + Migrationen sind ein separater Bootstrap). `seed-resolver-extensions` + `seed-facets` (innerhalb des Korpus-Schritts) erweitern den Katalog non-destruktiv um die kristallisierten Resolver-Rows. Beim Rebuild **bewahrt** der Truncate die Reference-Tabellen ohnehin.
3. **`.env.local` zeigt auf die Ziel-DB.** Jeder Sub-Schritt lädt `--env-file=.env.local`. Vor einem Lauf prüfen, dass das die gemeinte Datenbank ist.
4. **Committete Quellen.** Die Re-Apply liest die committeten `scripts/seed-data/manual-overrides-ssot-*.json` (Scope auto-abgeleitet) + `audiobook-narrators.json` + die committeten Podcast-Artefakte `ingest/podcasts/<slug>.json` + die vier Timeline-Seed-JSONs (`eras.json`, `events.json`, `event-works.json`, `book-dates.json`) + das Hand-Override-Overlay `curation-overlay.json`.

> **Shell-Hinweis (Windows).** Die Befehle aus Git Bash (MINGW64) fahren — derselbe Pfad, über den die Resolver-/Konsolidierungs-Runbooks `bash scripts/run-phase4-apply.sh …` aufrufen.

---

## Verify-Schritte — Sidecar-/Seed-abgeleitet, exakte Mengen-Gleichheit

Die `--verify`-Schritte sind **read-only** und prüfen **exakte Mengen-/Wert-Gleichheit, keine bloße Zählung** (eine reine Zählung false-positivt: ein Überschuss maskiert ein Defizit).

### Audiobook-Verify (`apply:audiobook-narrators --verify`)

Bestätigt, dass die DB **exakt** die aus dem Sidecar abgeleitete Menge der Audio-`work_persons`-Rows trägt. Identität = das Tripel `(workId, personId, role)` (PK von `work_persons`). Grün **genau dann**, wenn jedes Sidecar-Buch zu einer `works.id` auflöst, jeder Credit als exaktes Tripel präsent ist, es keine verwaisten Audio-Rows gibt und die Erwartung **nonzero** ist. Alle Zahlen werden **aus dem Sidecar berechnet**, nicht hartkodiert.

**Erwartete Ausgabe (heute):**

```
=== audiobook-narrators verify [READ ONLY] ===
Expected (sidecar-derived): 88  (narrator 63 / co_narrator 12 / full_cast 13)
Actual   (DB work_persons): 88  (narrator 63 / co_narrator 12 / full_cast 13)
Books resolved: 66/66
VERIFY OK — all 88 sidecar audio credits present as exact (work, person, role) rows; no stray rows.
```

### Timeline-Verify (`apply:timeline --verify`)

Bestätigt, dass die DB **exakt** den aus den vier Timeline-Seed-JSONs abgeleiteten Zustand trägt. Pure Vergleichslogik in `scripts/timeline-state.ts` (`diffTimelineState`), DB-frei via `npm run test:timeline` getestet. Grün **genau dann**, wenn: die Era-ID-Menge `== eras.json` (retirte `age_rebirth`/`long_war` abwesend); die Event-ID-Menge `== events.json`; die `event_works`-Menge `==` der aufgelösten Hook-Menge und **nonzero** (Identität `(eventId, targetType, targetId, role)` + `displayLabel`/`position`); jeder benannte Buch-Slug exakt seine Setting-Felder; **keine** `book_details`-Row auf einer retirten Era.

> **Podcast-Hooks.** `event-works.json` trägt Hooks mit `role=podcast`, die per `(showSlug, episodeGuid)` gegen Podcast-`works` auflösen. Solange die Podcast-Shows **nicht** in der DB sind (z. B. nach einem Truncate), bleiben diese Hooks **unauflösbar** und fehlen in `event_works` → der Timeline-Verify ist rot. Genau deshalb steht `apply:podcast -- --all` als Schritt 4 **vor** der Timeline (Schritt 7): nach dem Podcast-Restore lösen die 4 Shows auf und die Hooks materialisieren.

### Curation-Verify (`apply:curation-overlay --verify`)

Für jedes aufgelöste `final`-Buch: jede add-Edge präsent (mit Rolle), jede Suppression abwesend, jedes Feld gleich dem Overlay-Wert. Mismatch → rot.

---

## Fail-Fast & Idempotenz

- **Fail-Fast** (`db:sync` + `db:rebuild`). Ein fehlgeschlagener Schritt bricht mit klarem `FAILED at step: …`-Marker ab, **bevor** spätere Schritte laufen; der Lauf endet nonzero. Die Tails laufen **nur** nach erfolgreichem Korpus-Re-Apply.
- **Aggregierend** (`db:drift`). Fährt **alle** Checks, sammelt Pass/Fail, fasst zusammen, Exit nonzero genau dann, wenn ein Check rot war.
- **Idempotent + re-runnable.** Zweimal `db:sync` (bzw. zweimal `db:rebuild -- --confirm`) führt zum selben Endzustand (jeder Sub-Schritt ist delete-then-insert bzw. truncate-then-rebuild bzw. upsert).

---

## Was die Apply-Pfade NICHT tun

- **Kein exakter DB==KOMPLETTER-SSOT-Vergleich** (Brief 157, bewusst vertagt). `db:drift` ist ein Health-Check aus Slice-Verifies + Contiguity, kein Voll-Diff.
- **Kein From-absolutely-empty-Bootstrap.** Migrationen + Base-Reference-Seed sind Vorbedingung, nicht Teil der Befehle.
- **Kein Konsolidierungs-Lauf.** Die human-gegateten Konsolidierungs-Skripte gehören nicht in eine automatisierte Sequenz. Die Merges leben in den committeten Reference-JSONs; die Re-Apply reproduziert den konsolidierten Korpus. `consolidation-pass-2.config.json` ist bewusst entkoppelt und wird vom Auto-Derive **nicht** angefasst.
- **Kein `db:seed`.** `db:seed` ist der Legacy-V1-26-Manuals-Dev-Seed (anderer ID-Raum) und liegt nicht auf dem SSOT-Pfad.
- ~~Kein OQ-16(b)-Fix~~ **Seit Launch S1a gefixt:** der Auto-Apply stempelt kein `time_ending`-Placeholder mehr, sondern bucketet `primaryEraId` mechanisch aus `book-dates.json` × `eras.json` (`scripts/era-bucket.ts`; keine Setting-Date ⇒ `NULL`). Der Curation-Overlay-Tail bleibt der letzte Schritt und gewinnt weiterhin per Hand-Fix pro Buch.
- **Kein Targeted-/`--only`-Modus** (Brief 157). Default ist Voll-Roster-Re-Apply.

---

## DB-Freeze-Hinweis

`db:rebuild -- --confirm` bleibt ein **destruktiver Ops-Befehl**. Unter einem DB-Freeze wird er **nicht** gegen Prod gefahren. `db:sync` ist nicht-destruktiv, aber ein echter Lauf gegen Prod ist trotzdem eine bewusste Ops-Entscheidung des Maintainers (keine still mitlaufende Routine). Die Verify-Logik ist unter dem Freeze DB-frei über `npm run test:timeline` (pure `diffTimelineState`) beweisbar; die echten `apply:* --verify` gegen die DB sind der Abschluss, sobald der Freeze aufgehoben ist.

---

## Anhang — Herkunft (überspringbar, nur Background)

- **Brief 107** (`sessions/archive/2026-05/2026-05-30-107-arch-full-rebuild-restore-wiring.md`, Parent 105): der ursprüngliche Rebuild-Orchestrator + dieses Runbook. Brief 105 machte die Hörbuch-Credits durabel gegen die routinemäßige Re-Apply; Brief 107 schloss das Rebuild-Loch (Audio-Tail als fester Schritt statt redundant pro Resolver-Welle).
- **Brief 149** (`sessions/2026-06-12-149-arch-curation-foundation.md`): der Curation-Overlay-Tail.
- **Brief 152** (`sessions/2026-06-16-152-arch-timeline-rebuild-tail.md`, OQ 16a): der Timeline-Tail + read-only `--verify` (pure `diffTimelineState`, DB-frei via `npm run test:timeline`).
- **Brief 157** (`sessions/2026-06-18-157-arch-incremental-apply-default.md`): die Policy-Inversion. `db:sync` (= `db:rebuild` minus Truncate) wird der Default; `db:rebuild` wird Disaster-Recovery; der Apply-Scope wird auto-abgeleitet (hand-gepinnte `db-rebuild.config.json` gelöscht) mit Preflight-Guard; `apply:podcast -- --all` wird fester Chain-Schritt vor der Timeline; `db:drift` (read-only Health-Check) kommt dazu. Faltet Brief 156 (Range-Cap + Podcast-Step) mit ein.
