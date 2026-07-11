# Content-Release-Runbook — zweistufiger Release (E4)

> **Gilt für den Launch und JEDES spätere Content-Release.** Entstanden in
> Launch-Session S1a (`docs/launch-master-plan.md` § Session 1a Punkt 5 + E4,
> OQ-19-Preflight 2026-07-11). Grundsatz: **Postgres ist SSOT, der Snapshot ist
> ein mechanischer Abzug, und der Snapshot-PR IST der Production-Deploy.** Ein
> Daten-Merge allein deployt nichts Konsistentes — erst der committete Snapshot
> bringt den neuen Datenstand in den Build. Ungemergter Branch-Code berührt die
> Produktions-DB nie; der Produktionszustand bleibt jederzeit aus `main`
> reproduzierbar.

Der Ablauf ist **zweistufig**: Stufe 1 bringt Quell-/Code-Änderungen über
normale PRs auf `main` (ohne Produktions-Write), Stufe 2 schreibt die DB und
friert den neuen Stand als Snapshot-PR ein. Wer nur Code ändert (kein
Datenstand), braucht dieses Runbook nicht.

---

## Voraussetzungen

- Alle Quelländerungen des Releases (per-Buch-SSOT-Dateien, Overrides,
  book-dates, Podcast-Artefakte, …) sind **auf `main` gemerged** —
  source-first, DB-second (§ add-book-runbook).
- Lokales `.env.local` mit dem privilegierten `DATABASE_URL` (Pooler-URL).
- Koordinations- bzw. Batches-Worktree sauber (`git status`), auf
  `origin/main`-Stand.

## Stufe 0 — Content-Freeze

Ansage an alle Beteiligten (praktisch: an sich selbst): **ab jetzt bis zum
Abschluss keine parallelen `apply:*`-Läufe, kein zweiter `db:sync`, keine
Weekly-Refresh-Promotion.** Der Snapshot friert genau einen DB-Zustand ein;
alles, was zwischen Sync und Regen in die DB schreibt, macht den Abzug
inkonsistent.

## Stufe 1 — Read-only Preflight (kein Produktions-Write)

1. **Migrations-Head-Parität (Repo == DB):**

   ```bash
   npx tsx --env-file=.env.local scripts/build-snapshot.ts --check-migrations
   ```

   Prüft read-only, dass `drizzle.__drizzle_migrations` exakt den committeten
   Migrationsstand trägt (Anzahl, Content-Hash je Migration — zeilenenden-
   tolerant — und Journal-Timestamps). **Bei Abweichung: STOPP.** Keine
   improvisierte Migration, kein Weiterarbeiten „auf Verdacht": klären, ob eine
   committete Migration noch nicht angewandt ist (→ regulärer
   `db:migrate`-Weg / migrate-Workflow, danach Preflight wiederholen) oder die
   DB einen fremden Stand trägt (→ untersuchen, Session abbrechen).

2. Optional, aber empfohlen: `npm run db:drift` (read-only Health-Check —
   zeigt vorab, ob der Sync überhaupt etwas Neues schreiben wird).

## Stufe 2 — Explizites Go

**Philipp gibt das Go für den Produktions-Write.** Ohne explizites Go endet die
Session nach Stufe 1. (DB-Write-Gate wie in § add-book-runbook Schritt 8.)

## Stufe 3 — Genau EIN vollständig grüner db:sync

```bash
npm run db:sync
```

- `db:sync` enthält `apply:book --all` als primären Korpus-Schritt — **nicht
  zusätzlich einzeln laufen lassen.**
- **Vollständig grün heißt: jede Stufe der Kette inkl. aller `--verify`-Schritte
  exit 0.** Bricht die Kette mittendrin ab: Ursache beheben und den **ganzen**
  `db:sync` erneut laufen lassen (die Kette ist idempotent und konvergiert);
  keine Teilschritte von Hand nachziehen.
- Falls der Lauf `scripts/seed-data/persons.json` verändert hat: **STOPP und
  klären** — das heißt, der gemergte Korpus enthielt Autoren, die nie applied
  wurden (Quelle und DB waren weiter auseinander als gedacht). Die
  persons.json-Änderung muss zuerst regulär als Source-PR auf `main`.
- `db:sync` löst **keine** Revalidation aus (B1) — die kommt erst NACH dem
  Deploy (Stufe 6).

## Stufe 4 — Snapshot auf frischem Batches-Branch regenerieren

```bash
git fetch --prune origin
git checkout -b codex/ingest-batches-snapshot-<datum> origin/main
npm run snapshot:regen
```

Der Exporter ist fail-closed (Migrations-Parität, Plausibilitäts-Floors,
Era-Set-Abgleich, Hot-ID-Payload-Vollständigkeit) und deterministisch.
**Prüfen, bevor irgendetwas committet wird:**

1. `git diff` bzw. `git status` über `scripts/snapshot-data/`: ändert sich, was
   sich ändern soll — und **nur** das? (Ein Release, das nur 3 Bücher anfasst,
   darf nicht 500 Entity-Views umschreiben.)
2. `manifest.json`: Counts plausibel gegen das, was das Release inhaltlich tut;
   `sourceMigration` == erwarteter Head; `generatedAt` frisch (bzw. unverändert,
   wenn der Sync nichts geändert hat — dann gibt es auch nichts zu releasen).
3. Stichprobe von 2–3 Hot-ID-Payloads (`entities/<type>/<id>.json`) und einem
   geänderten Buch in `browse-books.json`.
4. **Determinismus-Beleg:** zweiter Lauf `npm run snapshot:regen` ⇒
   `git status` unverändert (leerer Diff; der Manifest-Timestamp wird bei
   identischem Inhalt übernommen).
5. **Era-Dateninvariante** (seit S1a) read-only verifizieren: keine gesetzte
   `primary_era_id` ohne ableitende Setting-Date — Ausnahme: Bücher, deren Wert
   das Kurationsoverlay setzt (das `apply:curation-overlay --verify` innerhalb
   des Syncs deckt diese ab). Praktisch: `book_details.primary_era_id IS NOT
   NULL` ⇒ Buch hat eine `book-dates.json`-Zeile **oder** einen
   Overlay-Field-Fix.

## Stufe 5 — Snapshot-PR = Deploy

- PR-Inhalt: **nur** `scripts/snapshot-data/**` (Batches-Release-PR, B3).
  Launch-Protokolle/Rollups fahren in separaten Koordinations-PRs; Code fährt
  nie im Snapshot-PR mit.
- Philipp merged → Vercel baut und deployt Production aus dem neuen Snapshot.
- **Bei rotem Build/Deploy: keine Revalidation, kein Stufe-6.** Ursache im
  Build-Log klären; der alte Deploy bleibt live und konsistent.

## Stufe 6 — NACH erfolgreichem Deploy: Revalidation + Live-Smoke

Erst wenn der neue Production-Deploy live ist (E4-Reihenfolge; ein POST vor dem
Deploy würde einen Stand revalidieren, den es noch gar nicht gibt):

1. **Revalidation — genau EIN Aufruf** (seit S3a das dedizierte Script):

   ```bash
   npm run release:revalidate
   ```

   Liest `REVALIDATE_BASE_URL` + `REVALIDATE_TOKEN` aus `.env.local`, sendet
   genau **einen** POST an `<base>/api/revalidate` (Timeout 30 s, kein Retry)
   und ist fail-loud: Exit 0 nur bei HTTP 200 — die Ausgabe listet die
   invalidierten Tags + Pfade. Bei Fehlschlag nennt die Ausgabe die Recovery
   (503 = `REVALIDATE_TOKEN` fehlt im Deployment, 401 = Token-Mismatch,
   Timeout = Zustand **unklar**, der POST kann verarbeitet worden sein — der
   Endpoint ist idempotent, nach Klärung genau einen erneuten POST). Notfall-
   Fallback, falls Node/tsx selbst kaputt ist (identischer Vertrag, ein POST,
   Status prüfen):

   ```bash
   curl -X POST https://<production-host>/api/revalidate \
     -H "Authorization: Bearer $REVALIDATE_TOKEN"
   ```

2. **Live-Smoke** (Browser, kalter Blick): Home lädt mit Suchvorschlägen ·
   `/archive/podcasts` zeigt die Shows · 2–3 Hot-Entities (z. B.
   `/charakter/roboute_guilliman`, `/fraktion/thousand_sons`) · ein im Release
   geändertes Buch über `/buch/<slug>`. Sichtbar alter Stand nach Revalidation
   ⇒ nicht raten: das ist seit S2 ein **echtes Problem** — die Invalidierung
   ist `revalidateTag(tag, { expire: 0 })` (sofortige Expiration, NICHT
   stale-while-revalidate), schon der erste Request muss den neuen Stand
   zeigen. Deploy-Reihenfolge, Token und Tag-Abdeckung prüfen.

## Fehlerfälle, kompakt

| Situation | Reaktion |
|---|---|
| Preflight-Parität rot | STOPP. Regulärer Migrationsweg oder Abbruch — nie improvisieren. |
| `db:sync` bricht mittendrin ab | Ursache fixen, **ganzen** Sync wiederholen (idempotent, konvergiert). Kein Snapshot aus einem halb-synchronisierten Stand. |
| Snapshot-Diff unplausibel (zu groß/zu klein/falsche Dateien) | Nicht committen. DB-Zustand + Quell-Merges untersuchen; ggf. Sync wiederholen. |
| Exporter wirft (Floors, Hot-ID-Payload, Era-Drift) | Es wurde nichts geschrieben. Befund beheben (Datenproblem!), dann neu exportieren. |
| Deploy schlägt fehl | Keine Revalidation. Alter Stand bleibt live; Build-Fehler zuerst. |
| Revalidation schlägt fehl | Deploy bleibt gültig (ISR heilt binnen TTL); Fehler beheben und den einen POST nachholen. |

---

## Erster Lauf: Session „S1a-Snapshot" (PR 2 der S1a-Zweiteilung)

Der allererste Durchlauf dieses Runbooks ist eine eigene Session nach dem Merge
des S1a-Code-PR. Zusätzlich zum Standardablauf dort verifizieren:

- Era-Invariante in der DB nach dem Sync (Stufe 4 Punkt 5) — erwartet: ~97
  Bücher mit gebucketeter `primary_era_id` (44 davon legitim `time_ending`),
  Rest `NULL` bzw. Overlay-kuratiert; **nicht mehr** pauschal 889 ×
  `time_ending`.
- Der zweite `snapshot:regen`-Lauf ⇒ leerer `git status`-Diff (byte-identisch),
  als Beleg im Impl-Report.
