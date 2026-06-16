# DB-Rebuild Runbook — `npm run db:rebuild`

> **Manueller Ops-Befehl, keine Session.** Ein voller SSOT-Rebuild ist selten und destruktiv. Dieses Runbook ist die operative Spec für **genau diesen einen Befehl** — die geordnete Sequenz, die Vorbedingungen, das Confirm-Gating und die erwartete Verify-Zahl. Kein Brief nötig; die Herkunft der Rationale (Brief 107) steht im Anhang.

## Was der Befehl tut

`npm run db:rebuild` stellt den Works-Domain-Datenbestand **deterministisch aus den committed SSOT-Artefakten wieder her**. Er ist der eine Befehl, der einen From-Reset-Rebuild **vollständig** macht — inklusive der 88 Hörbuch-Credit-Rows, des Timeline-Datensatzes (8 Eras, 144 Events, 223 `event_works`-Hooks, die `works.startY/endY/setting*`-Spalten der datierten Werke — Brief 137/152) **und** der maintainer-entschiedenen Hand-Overrides (Brief 149), die ein nackter Reset + Apply still verlieren würde.

Der Orchestrator (`scripts/db-rebuild.sh`) sitzt **über** den bestehenden Bausteinen und verkettet sie; er reimplementiert keinen davon.

## Wann ihn fahren

- Eine DB soll von Grund auf neu auf den aktuellen datenkompletten + konsolidierten + audio-Stand gebracht werden (z. B. nach einem Schema-Wechsel, einem Umzug auf eine frische Supabase-Instanz, oder zur Wiederherstellung nach einem Works-Domain-Schaden).
- **Nicht** für den Routine-Betrieb: Resolver-Wellen + SSOT-Loop laufen über ihre eigenen Runbooks; die routinemäßige Re-Apply schützt die Audio-Rows bereits (Durability-Fix, Brief 105). Der Rebuild ist die Ausnahme, nicht der Alltag.

## Vorbedingungen

1. **Migrationen angewandt.** Das Schema muss existieren — `npm run db:migrate` gegen die Ziel-DB ist gelaufen. Der Rebuild legt **keine** Tabellen an.
2. **Reference-Katalog vorhanden.** `db:reset-for-ssot` truncatet nur die **Works-Domäne** (`works` + CTI-Children + `work_*`-Junctions + `external_links`) und **bewahrt** die Reference-Tabellen (`eras`, `factions`, `series`, `persons`, `characters`, `locations`, `sectors`, `services`, `facet_categories`, `facet_values`). Der Rebuild **setzt einen vorhandenen Reference-Katalog voraus** — er baut **keine** brandneue, absolut leere DB von Null auf (Base-Reference-Seed + Migrationen sind ein separater Bootstrap, nicht Teil dieses Befehls). `seed-resolver-extensions` + `seed-facets` (innerhalb Schritt 2) erweitern den Katalog non-destruktiv um die kristallisierten Resolver-Rows.
3. **`.env.local` zeigt auf die Ziel-DB.** Jeder Sub-Schritt lädt `--env-file=.env.local`. Vor einem Rebuild prüfen, dass das die gemeinte Datenbank ist.
4. **Committed Override-Roster.** Die Re-Apply liest die committed `scripts/seed-data/manual-overrides-ssot-*.json` (alle 859) + das committed Sidecar `scripts/seed-data/audiobook-narrators.json` + die vier committed Timeline-Seed-JSONs (Brief 137/152) + das committed Hand-Override-Overlay `scripts/seed-data/curation-overlay.json` (Brief 149). Diese sind die Quelle der Wiederherstellung. Die Timeline-Seeds sind:
   - `scripts/seed-data/eras.json`
   - `scripts/seed-data/events.json`
   - `scripts/seed-data/event-works.json`
   - `scripts/seed-data/book-dates.json`

## Der Befehl (Confirm-gegatet)

Der Rebuild ist **destruktiv** (er truncatet `works`). Er verweigert ohne explizite Bestätigung; ein **nacktes** `npm run db:rebuild` truncatet **nicht**.

```
npm run db:rebuild -- --confirm
```

Äquivalent über die Umgebungsvariable:

```
DB_RESET_CONFIRM=1 npm run db:rebuild
```

Fallback, falls die npm-Shell `bash` nicht auflöst (Windows):

```
bash scripts/db-rebuild.sh --confirm
```

Hilfe (kein DB-Zugriff): `npm run db:rebuild -- --help`.

> **Shell-Hinweis (Windows).** Den Befehl aus Git Bash (MINGW64) fahren — derselbe Pfad, über den die Resolver-/Konsolidierungs-Runbooks `bash scripts/run-phase4-apply.sh …` aufrufen.

## Die Sequenz

Der Orchestrator fährt acht Schritte **strikt sequenziell**; jeder Schritt gated den nächsten (Fail-Fast):

1. **`db:reset-for-ssot --confirm`** — `TRUNCATE works CASCADE`. Die Works-Domäne wird geleert; die Reference-Tabellen bleiben unangetastet (`db-reset-for-ssot.ts` assertet das selbst). Die Bestätigung wird durchgereicht. Die FK-Kaskade leert dabei auch `event_works` und löscht die Timeline-Spalten auf `works` (`startY/endY/setting*`) — Schritt 5 stellt sie wieder her.
2. **`run-phase4-apply.sh scripts/db-rebuild.config.json`** — re-applied den **vollen kristallisierten Override-Roster** beider Domänen (`applyRanges`: W40K 1..57 + HH 1..30 = alle 859) idempotent (delete-then-insert pro Junction). Seedet vorab Resolver-Extensions + Facets non-destruktiv. Reproduziert den datenkompletten **und** konsolidierten Korpus — die adjudizierten Merges sind in die committed Reference-JSONs eingebacken, deshalb braucht der Rebuild **keinen** separaten Konsolidierungs-Schritt. Stellt `author|editor`-`work_persons` wieder her.
3. **`apply:audiobook-narrators`** (Tail) — stellt die `narrator|co_narrator|full_cast`-`work_persons`-Rows wieder her. Läuft **zuletzt**, weil er `externalBookId → works.id` über das UNIQUE `works.external_book_id` auflöst — die `works` müssen existieren. Idempotent (scoped delete-then-insert der Audio-Rollen).
4. **`apply:audiobook-narrators --verify`** — read-only Vollständigkeits-Check (siehe unten).
5. **`apply:timeline`** (Tail, Brief 137/152) — stellt den Timeline-Datensatz wieder her: Eras + Events per id upserten, `event_works` wholesale aus `event-works.json` neu aufbauen, `works.startY/endY/setting*` für die in `book-dates.json` benannten Werke neu schreiben, `book_details.primary_era_id` remappen und die retirten Eras `age_rebirth`/`long_war` löschen. Läuft **nach** dem Korpus-Re-Apply (Schritt 2), weil jeder Hook und jede book-date gegen `works.id` aufgelöst wird — die `works` müssen existieren. Läuft **vor** der Curation (Schritt 7), weil sowohl `apply:timeline` (Retirement-Remap) als auch das Curation-Overlay (`primaryEraId`-Feld-Fix) `book_details.primary_era_id` schreiben können und die **Hand-Kuration zuletzt gewinnen muss**. Idempotent (Upsert + wholesale-Rebuild).
6. **`apply:timeline --verify`** — read-only Post-Condition (siehe unten).
7. **`apply:curation-overlay`** (Tail, Brief 149) — re-assertet die maintainer-entschiedenen Hand-Overrides aus `scripts/seed-data/curation-overlay.json` (nur `final`, nie `reviewQueue`). Läuft **nach** der Auto-Re-Apply (Schritt 2) und **nach** dem Timeline-Tail (Schritt 5), weil die Auto-Edges, die das Overlay **suppress**t, erst existieren müssen, um gelöscht zu werden, die **add**-Edges nach der Welle zuletzt gewinnen sollen und sein `primaryEraId`-Feld-Fix den Timeline-Remap überschreiben können muss. Beide Richtungen, gescopt pro `(workId, entityId)` (PK jeder Junction), idempotent. Bücher, die das Overlay benennt, der Korpus aber nicht trägt, werden graceful übersprungen.
8. **`apply:curation-overlay --verify`** — read-only Post-Condition: für jedes aufgelöste `final`-Buch ist jede add-Edge präsent (mit Rolle), jede Suppression abwesend, jedes Feld gleich dem Overlay-Wert. Mismatch → Rebuild schlägt fehl.

## Verify-Schritt — Sidecar-abgeleitet, exakte Mengen-Gleichheit

Der Audio-Verify-Schritt (Schritt 4 von 8, `apply:audiobook-narrators --verify`, read-only) bestätigt, dass die DB **exakt** die aus dem Sidecar abgeleitete Menge der Audio-`work_persons`-Rows trägt — nicht bloß die richtige Gesamtzahl (eine reine Zählung false-positivt: ein Überschuss in einer Rolle könnte ein Defizit in einer anderen maskieren). Identität ist das Tripel `(workId, personId, role)` — der Primärschlüssel von `work_persons`. Der Verify ist **grün genau dann**, wenn:

- **jedes** Sidecar-Buch zu einer `works.id` auflöst (ein voller Rebuild stellt alle her),
- **jeder** Sidecar-Credit als sein exaktes `(workId, personId, role)`-Row präsent ist,
- es **keine** verwaisten Audio-Rows gibt, die das Sidecar nicht hergibt, und
- die Erwartung **nonzero** ist.

Fehlendes / verwaistes / nicht-auflösbares Row → der Rebuild schlägt fehl (Exit ≠ 0), mit Auflistung der konkreten Tripel.

**Erwartete Verify-Ausgabe (heute):**

```
=== audiobook-narrators verify [READ ONLY] ===
Sidecar:  …/scripts/seed-data/audiobook-narrators.json
Expected (sidecar-derived): 88  (narrator 63 / co_narrator 12 / full_cast 13)
Actual   (DB work_persons): 88  (narrator 63 / co_narrator 12 / full_cast 13)
Books resolved: 66/66
VERIFY OK — all 88 sidecar audio credits present as exact (work, person, role) rows; no stray rows.
```

Alle Zahlen + erwarteten Tripel werden **aus dem Sidecar berechnet**, nicht hartkodiert. Wenn der spätere 859er-Audiobook-Full-Sweep das Sidecar wachsen lässt, wächst die Erwartung automatisch mit — **kein** Verify-Edit nötig.

### Timeline-Verify (Schritt 6 von 8, Brief 152)

Der Timeline-Verify-Schritt (`apply:timeline --verify`, **read-only** — kein Write, kein `applyAll`, kein Remap) bestätigt, dass die DB **exakt** den aus den vier committed Timeline-Seed-JSONs abgeleiteten Zustand trägt. Wie beim Audio-Verify ist es **exakte Mengen-/Wert-Gleichheit, keine bloße Zählung** — der pure Vergleich liegt in `scripts/timeline-state.ts` (`diffTimelineState`) und ist DB-frei via `npm run test:timeline` getestet. Grün **genau dann**, wenn:

- **eras:** die DB-Era-ID-Menge `== eras.json`; die retirten `age_rebirth` / `long_war` sind **abwesend**.
- **events:** die DB-Event-ID-Menge `== events.json`; keine stale Rows.
- **event_works:** die DB-Menge `==` der aufgelösten Hook-Menge und **nonzero**. Identität ist das Tupel `(eventId, targetType, targetId, role)` (die UUID `id` wird ignoriert); zusätzlich werden `displayLabel` und `position` verglichen, damit Label-/Sortierdrift nicht durchrutscht.
- **book-dates:** jeder in `book-dates.json` benannte Slug trägt exakt `settingDateLabel`, `startY`, `endY`, `settingMethod`, `settingConfidence`, `settingAnchorEventId`. Nicht benannte Werke werden **nicht** gecleart und sind **kein** Fehler.
- **primary_era_id:** **keine** `book_details`-Row zeigt noch auf eine retirte Era.

Jeder Mismatch → der Rebuild schlägt fehl (Exit ≠ 0), mit nach Kategorie gruppierten, gekürzten (Counts + Beispiele) Diffs. Alle Erwartungswerte werden **aus den Seed-JSONs + der read-only DB-Auflösung berechnet**, nicht hartkodiert.

## Fail-Fast & Idempotenz

- **Fail-Fast.** Ein fehlgeschlagener Reset-/Apply-/Audio-/Timeline-/Curation-Schritt bricht mit klarem `[db-rebuild] FAILED at step: …`-Marker ab, **bevor** spätere Schritte laufen; der Lauf endet nonzero. Die Tail-Schritte (Audio, Timeline, Curation) laufen **nur** nach erfolgreichen Apply-Wellen.
- **Idempotent + re-runnable.** Zweimal `db:rebuild -- --confirm` hintereinander führt zum selben Endzustand (jeder Sub-Schritt ist delete-then-insert bzw. truncate-then-rebuild).

## Was der Rebuild NICHT tut

- **Kein From-absolutely-empty-Bootstrap.** Migrationen + Base-Reference-Seed sind Vorbedingung, nicht Teil des Befehls (siehe Vorbedingungen 1–2).
- **Kein Konsolidierungs-Lauf.** Die human-gegateten Konsolidierungs-Skripte (`consolidation-aggregate.ts` / `-db-snapshot.ts` / `-db-sync.ts`) gehören **nicht** in eine automatisierte Sequenz. Die Merges leben in den committed Reference-JSONs; die Re-Apply reproduziert den konsolidierten Korpus.
- **Kein `db:seed`.** `db:seed` ist der Legacy-V1-26-Manuals-Dev-Seed (anderer ID-Raum) und liegt **nicht** auf dem SSOT-Rebuild-Pfad. Der Rebuild fasst ihn nicht an.
- **Kein OQ-16(b)-Fix.** Der `primaryEraId`-Placeholder-Overstamp im Auto-Apply (`apply-override.ts`) bleibt unverändert — der Curation-Overlay-Tail (Schritt 7) korrigiert ihn per Hand-Fix pro Buch. Das ist ein eigener Brief, nicht Teil dieses Rebuilds.

> **Geschlossen seit Brief 152 (OQ 16a).** Der Timeline-Restore war zuvor eine bewusst offene Lücke: `TRUNCATE works CASCADE` (Schritt 1) räumt über die FK-Kaskade auch `event_works` (FK → `works.id`) leer und löscht die Timeline-Spalten auf `works`. **Jetzt** stellt der Rebuild das wieder her — `apply:timeline` ist Schritt **5/8** (Tail nach dem Korpus-Re-Apply, vor der Curation) und `apply:timeline --verify` der verify-gegatete Schritt **6/8**. `events`/`eras` (FK → `eras`) überleben den Reset zwar, werden aber trotzdem idempotent re-upserted, und die retirten Eras werden remappt + gelöscht.

## DB-Freeze-Hinweis

`db:rebuild -- --confirm` bleibt ein **destruktiver Ops-Befehl** (er truncatet `works`). Unter dem in Brief 149/151 gesetzten DB-Freeze wird er **nicht** gegen Prod gefahren — weder der Rebuild noch ein einzelnes `apply:timeline` / `apply:timeline --verify` gegen die Ziel-DB. Die Timeline-Verify-Logik ist unter dem Freeze DB-frei über `npm run test:timeline` (pure `diffTimelineState`) bewiesen; der echte `apply:timeline -- --verify` gegen die DB ist der Abschluss, sobald der Freeze aufgehoben ist.

## Wartung der Rebuild-Config

`scripts/db-rebuild.config.json` trägt die `applyRanges`-Obergrenzen (heute W40K `to: 57`, HH `to: 30`). Sie verfolgen den kristallisierten Roster — beim Crystallizing einer **neuen** Batch-Range einen Ein-Zeilen-Bump (identische Pflege wie `scripts/consolidation-pass-2.config.json`). Innerhalb der bestehenden Ranges wachsende Bücher deckt die Re-Apply automatisch ab.

## Anhang — Herkunft (überspringbar, nur Background)

Dieser Befehl + Runbook entstanden in **Brief 107** (`sessions/archive/2026-05/2026-05-30-107-arch-full-rebuild-restore-wiring.md`, Parent Brief 105). Brief 105 hatte die Hörbuch-Credits durabel gegen die **routinemäßige** Re-Apply gemacht (Override-Delete in `apply-override.ts` auf `author|editor` gescopt, Audio-Apply auf die Audio-Rollen — die zwei Pfade clobbern sich nie). Das verbleibende Loch war der **volle Rebuild**: `db-reset-for-ssot.ts` truncatet `work_persons`, und `run-phase4-apply.sh` stellt nur `author|editor` wieder her — nichts rief den Audio-Apply. Brief 107 schließt das, indem `apply:audiobook-narrators` ein fester Tail-Schritt dieses Orchestrators wird (statt eines redundant pro Resolver-Welle feuernden Tail-Schritts in der generischen `run-phase4-apply.sh`-Engine — falsche Ebene).

Der **Curation-Overlay-Tail** (Schritte 7–8) kam in **Brief 149** (`sessions/2026-06-12-149-arch-curation-foundation.md`) dazu — derselbe Tail-Modell-Gedanke, gescopt pro Edge. Der **Timeline-Tail** (Schritte 5–6) schließt **Brief 152** (`sessions/2026-06-16-152-arch-timeline-rebuild-tail.md`, OQ 16a): das Timeline-Fundament aus Brief 137 hatte `apply:timeline` idempotent, aber ohne `--verify`-Modus; Brief 149 ließ den Rebuild-Tail bewusst offen, weil `apply:timeline` erst einen Verify brauchte und mit dem Curation-`primaryEraId`-Feld eine Reihenfolge-Interaktion hat. Brief 152 ergänzt den read-only `--verify` (pure Vergleichslogik in `scripts/timeline-state.ts`, DB-frei getestet via `npm run test:timeline`) und hängt Timeline als Schritt 5/8 + 6/8 **vor** die Curation ein, damit die Hand-Kuration bei `primary_era_id` zuletzt gewinnt.
