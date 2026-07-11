---
session: 2026-07-12-200
role: implementer
date: 2026-07-12
status: complete
slug: launch-s3a-db-hardening
parent: docs/launch-master-plan.md § Session 3a (E8-Prompt-Betrieb, kein per-Session-Brief)
links:
  - docs/launch-master-plan.md
  - scripts/runbooks/db-roles-runbook.md
  - scripts/runbooks/content-release-runbook.md
commits: []
---

# Launch S3a — DB-Rollen, Migrations-Rehearsal, Release-Revalidation

Worktree: `chrono-lexicanum` (Koordination, E8-Ausnahme) · logischer Strang:
Batch/Ingestion · Branch: `codex/ingest-batches-db-hardening` (frisch von
`origin/main` @ d5f601b, S2 gemerged).

## Summary

Least-Privilege-Runtime-Rolle `chrono_runtime` als expliziter, CI-gegateter
Allowlist-Vertrag (Skript-Pfad statt Migration — der Launch-Prompt verbietet
`src/**` im PR), Migrations-Workflow mit Environment-Approval + Fresh-Postgres-
Rehearsal als Pflicht-Vorstufe jeder Prod-Migration, und der explizite fail-loud
Post-Deploy-Revalidation-Befehl `npm run release:revalidate` (genau ein POST,
im E4-Runbook nach dem Snapshot-Deploy verankert). **Wichtigster Punkt für
Cowork/Philipp:** Rolle + Credential existieren nach dieser Session noch NICHT
in Produktion — der Bootstrap (Grants + `--create-login`) läuft bewusst erst
nach dem Merge mit explizitem Go, Ablauf in `scripts/runbooks/db-roles-runbook.md`;
das Fresh-Postgres-Rehearsal inkl. Negativtests läuft als CI-Job auf genau
diesem PR (lokal gibt es weder Docker noch psql).

## What I did

- `scripts/runtime-role.ts` — der maschinenlesbare Rollen-Vertrag: 26
  Katalogtabellen SELECT-only, `preview_invite_activations`
  SELECT/INSERT/UPDATE (kein DELETE; der `recordActivation`-Upsert braucht
  genau das), `submissions` explizit denied (PII), `statement_timeout = '15s'`.
- `scripts/apply-db-roles.ts` (`npm run db:roles`) — erzeugt aus dem Vertrag
  GRANT/REVOKE-SQL und wendet es idempotent-konvergierend an (jeder Lauf:
  `REVOKE ALL` auf alle Tabellen → Allowlist re-granten). `--print-sql` für
  Review ohne Verbindung, `--create-login` generiert das Passwort und druckt
  `RUNTIME_DATABASE_URL` genau einmal (Pooler-Username
  `chrono_runtime.<ref>` wird aus `DATABASE_URL` abgeleitet),
  `--login-password` für das CI-Rehearsal. Kein `ALTER DEFAULT PRIVILEGES`
  Richtung Runtime; `REVOKE CREATE ON SCHEMA public FROM PUBLIC` als einzige
  tolerierte Anweisung (bei Ownership-Verweigerung wird geprüft, dass PUBLIC
  real kein CREATE hält — sonst harter Fail).
- `scripts/verify-runtime-role.ts` (`npm run db:verify-runtime-role`) — die
  Negativtests als Skript (S3a Punkt 2): verbindet als `chrono_runtime`
  (Identitäts-Guard bricht bei privilegiertem Credential ab), prüft alle 26
  Allowlist-Reads, den Upsert (in `BEGIN…ROLLBACK`, rückstandsfrei),
  `SHOW statement_timeout`, und verweigerte Zugriffe: `submissions`
  SELECT/INSERT, Katalog-INSERT/UPDATE/DELETE, DELETE/TRUNCATE auf
  `preview_invite_activations`, CREATE/ALTER/DROP. Jede Probe, die bei
  fälschlich vorhandenem Recht mutieren könnte, läuft in einer zurückgerollten
  Transaktion — gefahrlos gegen Prod (Launch-Readiness Punkt 3 nutzt genau
  diesen Befehl).
- `scripts/test-runtime-role-contract.ts` — DB-freier Drift-Gate in `npm test`:
  jede `pgTable` in `src/db/schema.ts` muss in genau einer der drei
  Vertragslisten stehen; eine künftige Tabelle ohne bewusste Entscheidung macht
  CI rot ("jede neue Tabelle wird bewusst freigegeben", mechanisch erzwungen).
- `scripts/pg-ssl.ts` — geteilte SSL-Policy (3 Consumer: migrate, db:roles,
  verify): immer `ssl:"require"`; `sslmode=disable` nur für Loopback-Hosts
  (CI-Container), jedes andere Ziel wirft. Damit ist das TLS-Opt-out
  strukturell auf das Rehearsal begrenzt (S3a Punkt 4).
- `scripts/migrate.ts` — liest `MIGRATION_DATABASE_URL ?? DATABASE_URL` (loggt
  welches), nutzt den SSL-Helper, loggt `applied N migration(s)` (Zählung über
  `drizzle.__drizzle_migrations`, `to_regclass`-tolerant für frische DBs) — die
  Basis der CI-Idempotenz-Assertion.
- `.github/workflows/migrate.yml` — umgebaut: `permissions: contents: read`,
  `timeout-minutes` (10/15). Job `rehearsal` (läuft auf PRs, die
  Migrations-/Rollen-Pfade berühren, UND via `needs:` vor jeder
  Prod-Migration): `postgres:17`-Service-Container → Migration → zweiter Lauf
  mit `grep 'applied 0 migration'` → `db:roles` **zweimal** (Idempotenz) →
  `verify-runtime-role` gegen den Container. Job `migrate`: nur
  `workflow_dispatch`, Environment `production-db` (Approval), Secret
  `MIGRATION_DATABASE_URL`, Concurrency-Gruppe unverändert.
- `scripts/release-revalidate.ts` (`npm run release:revalidate`) — der
  explizite Post-Deploy-Befehl (B1): genau EIN POST an
  `${REVALIDATE_BASE_URL}/api/revalidate`, Bearer aus `REVALIDATE_TOKEN`,
  Timeout 30 s, kein Retry, kein Default-Ziel; Exit 0 nur bei HTTP 200;
  Recovery-Meldungen für 503/401/404/Timeout (Timeout explizit als AMBIGUOUS
  markiert — Endpoint ist idempotent, Wiederholung nach Klärung sicher).
- `scripts/test-release-revalidate.ts` — 8 End-to-End-Fälle gegen einen
  lokalen node:http-Mock (Subprozess-Spawn der echten CLI): 200/Trailing-Slash/
  401/503/Timeout/Connection-refused/fehlende Env ×2; zählt Requests und
  beweist damit den No-Retry-Vertrag. Läuft im `npm test`-Sweep.
- `scripts/runbooks/content-release-runbook.md` — Stufe 6 auf
  `npm run release:revalidate` umgestellt (curl bleibt als Notfall-Fallback);
  den veralteten SWR-Satz korrigiert: seit S2 ist die Invalidierung
  `{ expire: 0 }` — sichtbar alter Stand nach Revalidation ist ein echtes
  Problem, kein „zweiter Request heilt's".
- `scripts/runbooks/db-roles-runbook.md` (neu) — Rollenmodell,
  Credential-Tabelle, statement_timeout-Entscheidung, Prod-Bootstrap (mit
  DB-Write-Gate), Neue-Tabelle-Freigabe-Flow, Rotation/Not-Aus,
  Migrations-Workflow inkl. der einmaligen GitHub-Einrichtung.
- `.env.example` — tote Supabase-Vars entfernt (`NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — im Code
  nirgends referenziert, nur noch in einem historischen Brain-Snapshot);
  `DATABASE_URL` als bewusst privilegiertes Skript-Credential umdokumentiert;
  `RUNTIME_DATABASE_URL` + `REVALIDATE_BASE_URL` dokumentiert;
  `MIGRATION_DATABASE_URL` als reine Doku (GitHub-Environment-Secret, kein
  lokales Var).
- `package.json` — drei neue Scripts: `db:roles`, `db:verify-runtime-role`,
  `release:revalidate`. Keine neuen Dependencies.

## Decisions I made

- **Grants als dokumentiertes SQL-Skript, nicht als Drizzle-Migration.** Der
  Master-Plan erlaubt beides; der Launch-Prompt fixiert den PR-Inhalt auf
  `scripts/** + .github + .env.example` ohne `src/**` — eine Migration läge
  unter `src/db/migrations/`. Der Skript-Pfad ist zudem konvergierend
  wiederholbar (Grant-Entzug wirkt real), was eine einmalige Migration nicht
  leistet. Die Nachvollziehbarkeit liefert `--print-sql` + der Contract-Test.
- **Rollenmodell: eine Rolle (`chrono_runtime`), erst NOLOGIN, LOGIN kommt mit
  dem Credential-Schritt.** Kein getrenntes Group/Login-Paar — Role-Level-GUCs
  (statement_timeout) gelten nur für die Login-Identität selbst, ein
  Member-Konstrukt hätte die Einstellung verloren.
- **statement_timeout: serverseitig `15s` auf der Rolle** (S3a Punkt 6). Die
  Client-Variante scheitert am Transaction-Pooler (dokumentiert in
  `client.ts:69-71`); der Role-GUC wird beim Backend-Session-Start gesetzt und
  wirkt durch den Pooler. 15 s ≈ 15× jede legitime Katalog-Query und reapt vor
  allem Queries, deren Vercel-Aufrufer (~10 s Timeout) schon tot ist.
  `verify-runtime-role` assertet den Wert via `SHOW`.
- **`MIGRATION_DATABASE_URL` als Environment-Secret, Skript-Fallback auf
  `DATABASE_URL`.** So trägt das Secret seinen wahren Namen im Workflow,
  während `npm run db:migrate` lokal unverändert bleibt; migrate.ts loggt,
  welches Credential griff.
- **Rehearsal als `needs:`-Vorstufe der Prod-Migration** — nicht nur als
  PR-Check: jeder manuelle Dispatch beweist erst am frischen `postgres:17`,
  dass Migrationskette + zweiter Lauf + Grants + Negativtests grün sind, bevor
  das Environment-Approval überhaupt gefragt wird.
- **Negativtests heißen `verify-runtime-role.ts`, nicht `test-*.ts`** — der
  `npm test`-Sweep (run-tests.ts) strippt DATABASE_URL und sweept `test-*`;
  eine live-DB-Suite dort wäre entweder rot oder hätte einen
  Deny-List-Eintrag gebraucht. Der DB-freie Anteil (Vertrags-Drift) läuft
  stattdessen als `test-runtime-role-contract.ts` im Sweep.
- **`release-revalidate` retried nie und hat kein Default-Ziel.** „Genau ein
  POST" ist als Test-Assertion festgeschrieben (Mock zählt Requests, auch im
  Fehler-/Timeout-Fall). Ein eingebautes Produktions-Default hätte den
  „kein Produktions-POST aus Versehen"-Vertrag unterlaufen.
- **`REVOKE CREATE ON SCHEMA public FROM PUBLIC` ist tolerant, aber
  verifiziert.** Auf PG15+ Default ohnehin; falls Supabase-Ownership das
  Statement verweigert, prüft das Skript per `aclexplode`, dass PUBLIC real
  kein CREATE hält — nur dann wird toleriert, sonst harter Fail.
- **Nicht gemacht (bewusst):** kein Prod-DDL aus dieser Session (ungemergter
  Branch berührt die Produktions-DB nie — S1a-Grundsatz gilt auch für Rollen);
  kein Consumer-Wechsel in `src/db/client.ts` (S3b/B2); keine Korrektur des
  leicht veralteten Docstrings in `src/app/api/revalidate/route.ts`
  („Batches-strand apply scripts POST here" — faktisch POSTet erst jetzt das
  Release-Skript, und nur post-deploy) — `src/**` ist tabu, siehe „For next
  session".

## Verification

- `npm test` — **37/37 Suiten grün** (inkl. neu: `test-release-revalidate`
  8 Fälle, `test-runtime-role-contract` 4 Fälle).
- `npm run typecheck` — grün (nach Löschen eines stale
  `tsconfig.tsbuildinfo`; Ursache war mein zwischenzeitlich global-scoped
  Skript, siehe Lessons).
- `npm run lint` — grün.
- `npm run build` (DB-frei, CI-Env `DATABASE_URL=…127.0.0.1:9/none`) — grün.
- **Revalidation fail-loud belegt (Erfolgs- + erzwungene Fehlerfälle, gegen
  Testumgebung, kein Produktions-POST):** die 8 Mock-Server-Fälle decken
  200 (Exit 0, exakt 1 POST, korrekter Bearer), 401, 503, Timeout
  (AMBIGUOUS-Meldung), Connection-refused und fehlende Env ab; Request-Zähler
  beweist No-Retry.
- **`db:sync` löst nachweislich keine Revalidation aus:** Grep über
  `scripts/**` — `api/revalidate`/`REVALIDATE_*` erscheint nur in
  `release-revalidate.ts`, dessen Test, dem S2-Route-Test und dem Runbook;
  kein Glied der db-sync-Kette (db-sync.sh, apply-*.ts) referenziert den
  Endpoint. Der Aufruf steht ausschließlich in Runbook-Stufe 6 (nach Deploy).
- `npm run db:roles -- --print-sql` — generiertes SQL manuell reviewt
  (Allowlist vollständig, submissions ohne Grant, Timeout-GUC).
- **Fresh-Postgres-Rehearsal + Negativtests: lokal NICHT ausführbar** (kein
  Docker, kein psql auf dem Host — geprüft). Der Beweis läuft als
  `rehearsal`-Job auf diesem PR selbst (der `pull_request`-Trigger nutzt die
  Workflow-Datei des PR; die Pfadliste matcht alle hier geänderten
  Rollen-/Migrationsdateien). **Vor dem Merge im PR prüfen: `migrate /
  rehearsal` grün.**
- Gegen die echte Supabase-Rolle laufen die Negativtests erstmals beim
  Prod-Bootstrap (Runbook Schritt 5) und erneut in Launch-Readiness Punkt 3.

## Open issues / blockers

- **GitHub-Environment `production-db` existiert noch nicht.** Der
  `migrate`-Job referenziert es; beim ersten Dispatch wird es ohne
  Schutzregeln auto-erzeugt — die Approval-Wirkung entsteht erst durch die
  manuelle Einrichtung (TODO-Liste unten). Bis dahin keinen Dispatch fahren.
- Das alte Repository-Secret `DATABASE_URL` wird von keinem Workflow mehr
  gelesen (weekly-refresh braucht keins; migrate nutzt jetzt
  `MIGRATION_DATABASE_URL`) — löschen, sobald das Environment steht.
- `sessions/2026-07-11-197-impl-launch-s1a-snapshot-release.md` liegt
  untracked im Koordinations-Worktree (offenbar nie committet, plus ein
  untracked `outputs/`-Ordner). Nicht in diesen PR aufgenommen (fremde
  Session); Philipp entscheidet, ob er mitfahren soll.

## For next session

- **S3b (B2):** Consumer-Wechsel `src/db/client.ts` auf
  `RUNTIME_DATABASE_URL` mit Übergangs-Fallback; Maintainer-Haltepunkte wie im
  Plan. Bei der Gelegenheit den Docstring von
  `src/app/api/revalidate/route.ts` präzisieren (Caller ist das
  Release-Skript post-deploy, nicht die Apply-Skripte).
- **S8-CI-Zuschnitt:** der Interaktions-Hauptlauf kann jetzt das
  Read-only-Runtime-Credential aus dieser Session nutzen (Plan § S8).
- Nach dem Prod-Bootstrap gehört `RUNTIME_DATABASE_URL` in `.env.local`, damit
  `db:verify-runtime-role` jederzeit lokal gegen Prod laufen kann.

## Lessons

- `spawnSync` + In-Prozess-Mock-Server ist ein Widerspruch: der synchrone Wait
  friert die Event-Loop ein, der Mock kann nie antworten. Subprozess-Tests
  gegen eigene Server immer mit asynchronem `spawn`.
- Ein Skript ohne `import`/`export` ist unter tsc **global-scoped** und
  kollidiert mit anderen globalen Skripten (`function main` in
  `apply-override.ts`); dazu cachet `tsconfig.tsbuildinfo` (incremental) den
  Fehler über den Fix hinaus — bei „unmöglichen" tsc-Fehlern zuerst den
  Buildinfo löschen.
