# DB-Rollen-Runbook — Least-Privilege-Runtime, Credential-Trennung, Migrations-Workflow

> Entstanden in Launch-Session S3a (`docs/launch-master-plan.md` § Session 3a).
> Grundsatz: **explizite Allowlist statt Default-Grants, fail-closed.** Die
> Runtime-Rolle sieht genau die aufgezählten öffentlichen Katalogtabellen;
> jede künftige Tabelle ist für sie unsichtbar, bis sie bewusst freigegeben
> wird. `submissions` (PII: E-Mail, Freitext, Review-Daten) bleibt für die
> Runtime vollständig unlesbar.

---

## Rollenmodell

| Credential | Rolle | Rechte | Verwender |
|---|---|---|---|
| `DATABASE_URL` (lokal, `.env.local`) | `postgres.<ref>` (privilegiert, Owner) | alles | lokale Apply-/Ingest-/Migrations-Skripte — **bewusst** privilegiert |
| `MIGRATION_DATABASE_URL` (GitHub-Environment-Secret `production-db`) | `postgres.<ref>` | alles | ausschließlich `.github/workflows/migrate.yml` (manueller Dispatch + Approval) |
| `RUNTIME_DATABASE_URL` (Vercel + `.env.local`) | `chrono_runtime` | SELECT auf die Katalog-Allowlist · keine Schreibrechte · sonst nichts | die Next.js-Runtime — **Consumer-Wechsel in `src/db/client.ts` + Vercel-Cutover sind S3b** |

Der maschinenlesbare Vertrag ist **`scripts/runtime-role.ts`** (Allowlist,
Denied-Liste, `statement_timeout`). Drei Consumer:

- `scripts/apply-db-roles.ts` (`npm run db:roles`) — erzeugt daraus die
  GRANT/REVOKE-Statements und wendet sie an (idempotent, konvergierend:
  jeder Lauf setzt erst `REVOKE ALL` auf alle Tabellen und re-grantet dann
  die Allowlist — ein aus dem Vertrag entfernter Grant verschwindet real).
- `scripts/verify-runtime-role.ts` (`npm run db:verify-runtime-role`) — Positiv-
  UND Negativ-Proben gegen die echte Rolle (siehe unten).
- `scripts/test-runtime-role-contract.ts` (läuft in `npm test`) — der
  Drift-Gate: **jede** in `src/db/schema.ts` definierte Tabelle muss in genau
  einer der zwei Listen klassifiziert sein. Eine neue Tabelle ohne bewusste
  Entscheidung macht CI rot.

**Keine `ALTER DEFAULT PRIVILEGES` Richtung Runtime** — das ist der Kern der
Entscheidung. Zusätzlich revoked der Grants-Lauf belt-and-braces `CREATE` auf
`schema public` von `PUBLIC` (auf PG15+ ohnehin Default; scheitert das
Statement mangels Schema-Ownership, prüft das Skript, dass PUBLIC wirklich
kein CREATE hält, und toleriert nur dann).

## statement_timeout-Entscheidung (S3a Punkt 6)

**Serverseitig auf der Rolle:** `ALTER ROLE chrono_runtime SET
statement_timeout = '15s'` (Teil von `npm run db:roles`). Begründung: die
Client-Variante ist durch den Transaction-Pooler (Port 6543) unmöglich — er
lehnt `statement_timeout` als Startup-Parameter ab (dokumentiert in
`src/db/client.ts`); ein Role-Level-GUC wird dagegen vom Postgres-Backend beim
Session-Start gesetzt und wirkt damit auch durch den Pooler. 15 s ist ~15×
jede legitime Katalog-Query und reapt vor allem Queries, deren Serverless-
Aufrufer (Vercel-Timeout ≈ 10 s) schon tot ist — eine Runaway-Query blockiert
keine Pooler-Slots mehr über Minuten. Lokale Skripte (privilegierte Rolle)
sind unberührt. Ändern: Wert in `scripts/runtime-role.ts` anpassen →
`npm run db:roles` erneut (der Verify-Check prüft `SHOW statement_timeout`).

## Bootstrap Produktion (einmalig, nach Merge des S3a-PR)

> **DB-Write-Gate:** Schritte 2–4 sind Produktions-DDL — nur nach explizitem
> Go von Philipp (wie jeder Produktions-Write, § content-release-runbook).

1. **Review ohne Verbindung:** `npm run db:roles -- --print-sql` — zeigt jedes
   Statement, das gleich läuft.
2. **Grants anwenden:** `npm run db:roles` (nutzt das privilegierte
   `DATABASE_URL` aus `.env.local`; idempotent, gefahrlos wiederholbar).
3. **Login-Credential erzeugen:** `npm run db:roles -- --create-login` —
   generiert ein Passwort (hex, keine Encoding-Fallen) und druckt die fertige
   `RUNTIME_DATABASE_URL` **genau einmal** (Pooler-Username:
   `chrono_runtime.<project-ref>` — Supavisor routet über das Suffix).
4. **Credential ablegen:** in `.env.local` (`RUNTIME_DATABASE_URL=…`) und —
   als S3b-Vorbereitung — in Vercel (setzt Philipp im Dashboard; der
   Consumer-Wechsel in `src/db/client.ts` folgt erst im S3b-PR mit
   Übergangs-Fallback).
5. **Verifizieren:** `npm run db:verify-runtime-role` — verbindet als
   `chrono_runtime` (Identitäts-Guard: mit einem privilegierten Credential
   bricht das Skript sofort ab) und prüft: alle Allowlist-Tabellen lesbar ·
   `statement_timeout` greift · `submissions` weder les- noch schreibbar ·
   Katalog-DML (INSERT/UPDATE/DELETE) verweigert ·
   DDL (CREATE/ALTER/DROP/TRUNCATE) verweigert. Jede Probe, die bei
   fälschlich vorhandenem Recht etwas ändern könnte, läuft in einer
   zurückgerollten Transaktion. **Launch-Readiness Punkt 3 wiederholt genau
   diesen Befehl gegen Prod.**

Schlägt Schritt 5 an der Verbindung selbst fehl (Supavisor + Custom-Role):
Username-Format `chrono_runtime.<project-ref>` prüfen; direkt danach einmal
`npm run db:roles -- --create-login` wiederholen (setzt Passwort neu). Bleibt
der Pooler-Login unmöglich, ist das ein Stopp-Befund für S3b — nicht
improvisieren, sondern klären.

## Neue Tabelle freigeben (der Normalfall nach S3a)

1. Migration/Schema wie üblich (`npm run db:generate`, …).
2. `npm test` wird rot: `test-runtime-role-contract` verlangt eine
   Klassifikation. In `scripts/runtime-role.ts` bewusst eintragen:
   `RUNTIME_SELECT_TABLES` (öffentlicher Katalog) oder
   `RUNTIME_DENIED_TABLES` (kein Zugriff). Eine neue Runtime-Schreibfläche
   braucht eine neue, ausdrücklich reviewte Vertragskategorie.
3. Nach dem Merge + Produktions-Migration: `npm run db:roles` erneut laufen
   lassen (Grants konvergieren).

## Rotation / Revocation

`npm run db:roles -- --create-login` erneut ausführen — setzt ein neues
Passwort (alte Verbindungen laufen aus, neue Logins brauchen die neue URL) —
dann `RUNTIME_DATABASE_URL` in Vercel + `.env.local` aktualisieren und
redeployen. Not-Aus: `ALTER ROLE chrono_runtime NOLOGIN;` (privilegiert,
z. B. via Supabase SQL-Editor) trennt die Runtime sofort von der DB.

## Migrations-Workflow (`.github/workflows/migrate.yml`)

- **Rehearsal-Job** — läuft auf jedem PR, der Migrations/Rollen-Skripte
  berührt, **und** als Pflicht-Vorstufe (`needs:`) jeder Produktions-
  Migration: migriert einen frischen `postgres:17`-Service-Container,
  beweist Idempotenz (zweiter Lauf loggt `applied 0 migration(s)`), wendet
  die Rollen-Grants **zweimal** an (Idempotenz) und lässt
  `verify-runtime-role` gegen den Container laufen. TLS-Opt-out
  (`sslmode=disable`) gilt **nur** dort — `scripts/pg-ssl.ts` erzwingt
  Loopback-Hosts und wirft bei jedem anderen Ziel.
- **Migrate-Job** — nur manueller Dispatch, hinter dem GitHub-Environment
  `production-db` (Required-Reviewer-Approval), `timeout-minutes`, minimale
  `permissions: contents: read`; Credential ist das Environment-Secret
  `MIGRATION_DATABASE_URL`.

**Einmalige GitHub-Einrichtung (Philipp, Repo-Settings → Environments):**
Environment `production-db` anlegen → „Required reviewers" = Philipp →
Environment-Secret `MIGRATION_DATABASE_URL` = privilegierte Pooler-URL →
danach das alte Repository-Secret `DATABASE_URL` löschen (kein Workflow
liest es mehr).
