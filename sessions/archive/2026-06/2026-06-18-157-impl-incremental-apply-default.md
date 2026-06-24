---
session: 2026-06-18-157
role: implementer
date: 2026-06-18
status: complete
slug: incremental-apply-default
parent: 2026-06-18-157
links:
  - 2026-05-30-107
  - 2026-06-16-152
  - 2026-06-18-156
commits: []
---

# Inkrementeller Apply wird Default — `db:rebuild` nur noch Disaster-Recovery

## Summary

`npm run db:sync` ist jetzt der nicht-destruktive Default-Apply (= der `db:rebuild`-Chain **minus Truncate**, plus Podcast-Step, mit auto-abgeleitetem Voll-Roster-Scope); `db:rebuild` ist auf Disaster-Recovery degradiert (= `db:sync` + vorangestelltes confirm-gegatetes Truncate); `db:drift` ist ein neuer read-only Health-Check aus bestehenden Bausteinen. **Der Apply-Scope ist nicht mehr hand-gepinnt** — `scripts/db-rebuild.config.json` ist gelöscht, der Scope wird aus dem committeten Roster abgeleitet (heute `w40k` 1..60 + `hh` 1..30 = 90 Batches) mit einem Preflight-Guard, der bei Lücke/Stray laut anhält, **bevor** geschrieben/truncatet wird.

## What I did

**Neu:**
- `scripts/db-apply-scope.ts` — leitet den Apply-Scope aus den committeten `manual-overrides-ssot-<domain>-NNN.json` ab (jede Domäne, `from:1`/`to:max`), assertet Lückenlosigkeit, emittiert die abgeleitete run-phase4-apply-Config nach `ingest/.state/db-apply.derived.config.json` (gitignored). **Read-only, DB-frei. Das ist der Preflight-Guard.**
- `scripts/db-sync.sh` — `db:sync`. Nicht-destruktiver 9-Schritt-Chain: Preflight → Korpus-Re-Apply → `apply:podcast --all` → Audiobook(+verify) → Timeline(+verify) → Curation(+verify). Fail-fast, idempotent, **truncatet nie**.
- `scripts/db-drift.sh` — `db:drift`. Read-only, **aggregierender** (nicht fail-fast) Health-Check: Contiguity + Counts + die drei Tail-`--verify`s + `refresh:audit-artifacts` (Podcast-Drift). Schreibt nie; Summary + healthy/unhealthy-Exit.

**Geändert:**
- `scripts/db-rebuild.sh` — neu definiert als `db:sync` + vorangestelltes confirm-gegatetes Truncate. 3 Schritte: Preflight (vor Truncate) → `db:reset-for-ssot --confirm` → `db:sync`. Confirm-Gating unverändert; Help-Text + Header markieren es explizit als Disaster-Recovery („du brauchst das fast nie — nutze `db:sync`"). Die Restore-Kette lebt jetzt **einmal** in `db-sync.sh`.
- `package.json` — `+db:sync`, `+db:drift`, `+db:apply-scope`.
- `scripts/runbooks/db-rebuild-runbook.md` — neu geschrieben: Modell-Tabelle (sync/drift/rebuild), die „Wie kriege ich Änderung X rein"-Tabelle (jeder Typ → **ein** Handgriff `db:sync`), Auto-Scope + Preflight-Guard, db:drift-Bausteine inkl. „refresh:check ist KEIN Baustein"-Hinweis, korrekte Batch-Zahl (90). Dateiname bewusst beibehalten (Brain-Querverweis, s.u.).
- `scripts/seed-data/curation-overlay.README.md` — zwei stale Verweise (Tail „in db-rebuild.sh") auf `db-sync.sh` (von beiden Pfaden gefahren) korrigiert.

**Gelöscht:**
- `scripts/db-rebuild.config.json` — die hand-gepinnte `to:57`-Obergrenze war die Brief-156-Fehlerquelle. Scope wird jetzt auto-abgeleitet; es gibt keinen Hand-Pin mehr, der driften kann.

## Decisions I made

- **Verb-Namen `db:sync` + `db:drift` übernommen.** `db:sync` sagt genau, was passiert (committete Quelle → DB in Sync bringen, idempotent) und kontrastiert sauber mit dem destruktiven `db:rebuild`. `db:drift` benennt die Frage, die es beantwortet (driftet die DB vom committeten SSOT?). Habe Alternativen (`db:apply`, `db:push`, `db:check`) verworfen: `db:apply` ist für die vertagte Plan/Diff-Stufe reserviert (Out-of-scope B); `db:push` kollidiert mental mit `git push`; `db:check` ist vager als `db:drift`. Zusätzlich `db:apply-scope` als read-only Maintainer-Utility exponiert (DB-frei, zeigt den abgeleiteten Scope).
- **`db-rebuild.config.json` gelöscht statt entkernt.** „Auto-abgeleitet, nicht hand-gepinnt" am ehrlichsten realisiert durch **Entfernen** der Hand-Pin-Datei (im Sinne des Briefs „mehr Weglassen als Draufbauen"). Die abgeleitete Config ist ein gitignored Runtime-Artefakt unter `/ingest/.state/`. `run-phase4-apply.sh` bleibt **unverändert** (liest weiter eine Config über `$1`); nur was db:sync/db:rebuild ihm reichen, ist jetzt generiert.
- **Auto-Derive deckt JEDE gefundene Domäne ab**, nicht hartkodiert `w40k`/`hh`. Eine künftige Domäne wird ohne Edit mitgenommen. Domänen alphabetisch sortiert (deterministisch); Apply-Reihenfolge ist korrektheits-irrelevant (Batches scopen delete-then-insert pro Junction, Domänen sind disjunkte Work-Sets).
- **Preflight-Guard fängt zwei Fehlerbilder:** Stray/fehl-benannte Override-Datei **und** Lücke in `1..max`. Mit Voll-Auto-Derive kann „committete Batch oberhalb des Caps" gar nicht mehr entstehen; der Guard ist die Belt-and-Suspenders gegen die *anderen* Wege, wie eine committete Batch nicht sauber im Scope landet. In `db:rebuild` läuft der Guard **vor** dem Truncate (eigener Schritt 1), zusätzlich zum Re-Run innerhalb von `db:sync` — die harte Garantie „Halt vor Truncate".
- **Podcast-Step VOR Audiobook platziert** (Reihenfolge-Skizze des Briefs gefolgt: Korpus → Podcast → Audiobook → Timeline → Curation). Harte Constraint ist nur „Podcast nach Korpus, vor Timeline"; Podcast vs. Audiobook ist beliebig (beide lösen gegen `works.id`). `apply:podcast` hat **kein** `--verify` (anders als die anderen Tails) — der Restore ist idempotent (Upsert + per-Episode delete-then-insert); die Podcast-Verifikation in `db:drift` läuft über das bestehende `refresh:audit-artifacts`.
- **`db:drift` ist aggregierend, nicht fail-fast.** Ein Health-Check soll *alle* roten Stellen zeigen, nicht beim ersten abbrechen — also läuft jeder Check, dann eine Summary. (Gegensatz zu `db:sync`/`db:rebuild`, die fail-fast sind.)
- **Runbook-Dateiname `db-rebuild-runbook.md` beibehalten.** `brain/wiki/log.md` (coordination-owned, aus dem Batches-Worktree **nicht** editierbar) verweist darauf; eine Umbenennung würde einen Dangling-Link in einer Rollup-Datei hinterlassen. Inhalt deckt jetzt alle drei Befehle ab. Umbenennung + Brain-Link-Fix wäre ein Coordination-Pass (siehe „For coordination").

## Open questions — beantwortet

- **Verb-Namen:** `db:sync` + `db:drift` — ja, übernommen (Begründung oben). Plus `db:apply-scope` als read-only Utility.
- **Health-Check-Bausteine — was geht günstig mit Bestehendem:** Alle fünf genannten Signale abgedeckt, ausschließlich aus Bestehendem:
  - **Batch-Contiguity** → neuer `db-apply-scope` (DB-frei).
  - **Counts** → `db-counts.ts` (informationell + DB-erreichbar-Probe).
  - **Tail-`--verify`** → `apply:audiobook-narrators`/`apply:timeline`/`apply:curation-overlay` `-- --verify` (exakte Mengen-Gleichheit je Slice).
  - **Podcast-Artifact-Drift** → **`refresh:audit-artifacts`** (read-only, vergleicht committete Artefakt-Episode-Guids vs. DB pro Show; war exakt dafür gebaut, Brief 151).
  - **`refresh:check`: NEIN, kein db:drift-Baustein.** `refresh:check`/`:ci` detektieren **upstream-neuen** Content gegen den committeten Bestand (Ingestion-Frische) und fassen die DB **nie** an — eine andere Frage als „DB im Sync mit committeten SSOT". Nur `refresh:audit-artifacts` aus der Familie ist DB-lesend und relevant. (Im Runbook als Hinweis dokumentiert.)
- **hh-Range:** Bestätigt — committed ist `hh` 1..30 **lückenlos**, nichts außerhalb. `db-apply-scope` liefert `hh 1..30 (30)` + `w40k 1..60 (60)` = 90, alle 90 mappen auf eine reale committete Datei (kein Phantom), keine Lücke, kein Stray.

## Verification

Alles DB-frei / non-destruktiv (Brief: kein Prod-Lauf):

- `npm run lint` — **pass** (eslint clean, inkl. neuem `db-apply-scope.ts`).
- `npm run typecheck` — **pass** (`tsc --noEmit`).
- `npm run test:timeline` — **pass** (23/23).
- `bash -n` auf allen drei Shell-Skripten — **OK**; `--help` aller drei → exit 0; nacktes `db:rebuild` (ohne `--confirm`) → refuse, exit 1 (kein Truncate).
- **Preflight-Guard** (synthetische Fixtures via `--dir`): Lücke → HALT (listet fehlende Batch); Stray-Datei → HALT (listet Datei); leer → HALT; happy → OK. Jeweils erwarteter Exit.
- **Auto-Derive → run-phase4-apply Handoff** (DB-frei, mit der *exakten* `apply_batches()`-Parselogik der Engine): die generierte Config ergibt 90 Batch-Ids (`ssot-hh-001..030` + `ssot-w40k-001..060`), inkl. `ssot-w40k-059` (`siege-of-vraks` — bestätigt in `manual-overrides-ssot-w40k-059.json`) und `-060`; alle 90 mappen auf eine reale Datei.
- **Podcast→Timeline-Resolution (DB-frei):** alle **125** Podcast-Hooks (`role=podcast`) in `event-works.json` lösen gegen die committeten Artefakt-Episode-Guids auf (0 unmatched). D. h. nach `apply:podcast --all` (Schritt 3, vor Timeline Schritt 6) sind alle 125 materialisierbar; ohne Podcasts (Truncate) sind sie unauflösbar. *(Die im Brief genannten „6 unauflösbaren Referenzen → 0" sind der Zwischenstand der separaten Live-Recovery; der statische Repo-Fakt ist 125-resolvable-after-restore. Der echte Prod-Lauf ist die getrennte Recovery, nicht dieser Brief.)*

## Open issues / blockers

Keine. Kein destruktiver Prod-Lauf gefahren (per Brief). Ein echter `db:sync` gegen Prod bleibt eine getrennte Ops-Entscheidung des Maintainers nach Merge.

## For coordination (Cowork — Rollup-Ownership)

Aus dem Batches-Worktree **nicht** angefasst (coordination-only `brain/**`), bitte im Post-Merge-Pass nachziehen:
- `brain/wiki/project-state.md` / `log.md` / `index.md` erwähnen `db:rebuild` als DB-Apply-Weg — jetzt um **`db:sync` (Default)** + **`db:drift`** ergänzen; `db:rebuild` = Disaster-Recovery.
- `brain/wiki/open-questions.md`: OQ zum „inkrementellen Apply" als erledigt markieren; die zwei vertagten Follow-ups (s. u.) als neue OQ aufnehmen.
- Optional: Runbook von `db-rebuild-runbook.md` → `db-apply-runbook.md` umbenennen **und** den `brain/wiki/log.md`-Link mitziehen (deshalb hier nicht gemacht — Dangling-Link-Risiko über die Worktree-Grenze).

## For next session

- **Vertagt (Brief, Out-of-scope B):** `db:apply` mit Plan/Diff — ein Verb, das nur das Delta upsertet. `db:sync` (Voll-Roster) ist der einfache erste Schritt.
- **Vertagt:** exakter „DB == kompletter SSOT"-Deep-Diff. `db:drift` ist bewusst ein Health-Check (Slice-Verifies + Contiguity), fängt **keine** stale Korpus-Junction *innerhalb* einer applizierten Batch. Erst bauen, wenn der Health-Check nachweislich nicht reicht.
- **Beobachtung (out of scope):** `scripts/apply-timeline-data.ts` enthält 4 literale NUL-Bytes — **kein** Fehler: bewusste `\0`-Separatoren in Template-Literal-Map-Keys (`` `${showSlug}\0${guid}` ``). tsc/tsx parsen das sauber (typecheck grün); nur Grep/`file` flaggen es als „binary". Nicht anfassen.
- OQ-16(b) `primaryEraId`-Placeholder-Fix bleibt eigener Brief (unverändert).

## References

- Brief 157 (`sessions/2026-06-18-157-arch-incremental-apply-default.md`) — dieser Brief; faltet Brief 156 ein.
- Bestehende Bausteine wiederverwendet: `run-phase4-apply.sh` (Brief 090/102), `apply:audiobook-narrators` (107), `apply:curation-overlay` (149), `apply:timeline` (137/152), `apply:podcast` (114), `refresh:audit-artifacts` (151), `db-counts.ts` (090).
