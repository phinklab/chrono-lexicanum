---
session: 2026-07-23-260
role: implementer
date: 2026-07-23
status: complete
slug: preview-gate-simplify
parent: null
links:
  - 2026-06-20-163
commits:
  - 12cac3fdd6659dbfb7b70260175a896f594f71d7
---

# Preview-Gate vereinfachen

## Summary

Das Preview-Gate bleibt bis zum Launch als Shared-Credentials-Login mit
signiertem Session-Cookie bestehen; Invite-Erzeugung, Redemption, Aktivierungs-
Tracking, Console und API sind entfernt. Drizzle-Migration `0016` droppt die
Aktivierungstabelle, und der Runtime-Rollenvertrag ist wieder vollständig
read-only.

## What I did

- `src/app/login/actions.ts`, `src/app/login/page.tsx`,
  `src/app/styles/68-login.css` — `acceptInvite()` und beide Invite-Zustände
  entfernt; `/login` zeigt nur noch das Shared-Credentials-Formular.
- `src/lib/previewGate.ts` — fest im Repo hinterlegte Credential-Defaults
  entfernt; `PREVIEW_USER` und `PREVIEW_PASS` sind vollständig Env-basiert und
  unvollständige Konfiguration scheitert geschlossen.
- `src/lib/previewSession.ts`, `src/lib/previewToken.ts`, `src/proxy.ts` —
  ausschließlich signierter 30-Tage-Session-Cookie; kein unsigned
  `cl-preview="1"`-Fallback. Der Proxy behält Gate-Branching und Redirect auf
  `/login`.
- `scripts/test-preview-token.ts` — auf den Session-Cookie-Vertrag reduziert:
  Signatur, Ablauf, Manipulation, falsches Secret, historische Invite-/Session-
  Tokens und Legacy-Cookie.
- `src/app/api/preview-invites/route.ts`,
  `scripts/preview-console/**`, `.gitignore`, `package.json` — Read-API,
  lokale Console und `preview:console(:build)` vollständig entfernt.
- `src/db/schema.ts`,
  `src/db/migrations/0016_worthless_natasha_romanoff.sql`,
  `src/db/migrations/meta/**` — `preview_invite_activations` aus dem Schema
  entfernt und die Drop-Migration mit `npm run db:generate` erzeugt.
- `scripts/runtime-role.ts`, `scripts/apply-db-roles.ts`,
  `scripts/verify-runtime-role.ts`, `scripts/test-runtime-role-contract.ts` —
  frühere Upsert-Fläche entfernt; `chrono_runtime` hat nur noch die
  Katalog-SELECT-Allowlist und keine Schreibrechte.
- `.env.example`, `src/app/privacy/page.tsx`,
  `scripts/runbooks/{launch-runbook,db-roles-runbook}.md`,
  `docs/{launch-master-plan,launch-session-prompts,werkstatt-roadmap}.md` —
  Shared-Login, W4-Entscheid und das auf Proxy-/Gate-/Login-Abbau verkleinerte
  PL1 dokumentiert; Aktivierungsdaten-Prosa entfernt; Werkstatt-Posten 12b als
  Session 260 abgehakt.

## Decisions I made

- **`PREVIEW_SESSION_SECRET` ist der kanonische Name.** Er beschreibt den
  einzigen verbliebenen Zweck. `PREVIEW_INVITE_SECRET` bleibt vorübergehend als
  Fallback, damit der Code vor der Vercel-Env-Umstellung deploybar bleibt.
  Sobald `PREVIEW_SESSION_SECRET` live ist, kann die alte Variable entfernt
  werden.
- **Der feste signierte Domain-Tag `typ: "session"` bleibt im Cookie-Payload.**
  Aufrufer können ihn nicht wählen. Dadurch bleiben historisch signierte
  Session-Cookies während des Env-Übergangs gültig, frühere Invite-Tokens
  werden mit demselben Alt-Secret aber nicht als Session akzeptiert.
- **Fehlende Credentials oder fehlendes Session-Secret scheitern geschlossen.**
  Der frühere committed Soft-Lock und der unsigned Cookie-Fallback widersprachen
  dem neuen Env-only-/signed-session-Vertrag. Nutzername und Passwort werden
  weiterhin beide ohne Short-Circuit timing-safe verglichen.
- **Der Rollenvertrag wurde im selben Schnitt read-only.** Nach dem Tabellen-
  Drop wäre die Upsert-Allowlist nicht nur tot, sondern hätte den Schema-
  Contract-Test gebrochen; der Grant- und Verify-Pfad gehört deshalb zum
  notwendigen Cleanup dieser Migration.

## Verification

- `npm run db:generate` — pass; Migration
  `0016_worthless_natasha_romanoff.sql` erzeugt (`DROP TABLE ... CASCADE`).
- `npm run test:preview-token` — pass; 9 Session-/Übergangsassertions.
- `npm run db:roles -- --print-sql` — pass; nur Schema-USAGE,
  Katalog-SELECT-Allowlist und `statement_timeout`, kein Runtime-Write-Grant.
- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm test` — pass; 41/41 DB-freie Suites grün, eine bestehende
  DB-gebundene Suite planmäßig ausgelassen.
- `npm run build` — pass; 1.293 statische Seiten. Zwei bestehende
  Turbopack-Warnungen zur dynamischen Snapshot-Dateisuche/NFT-Liste bleiben.
- `npm run brain:lint -- --no-write` — pass; 0 Blocking Findings,
  20 bestehende Warnings.
- `npm run text:lint` — pass; 0 Verstöße in 253 Dateien.
- Browser-Abnahme — bewusst bei Philipp: richtige Shared Credentials müssen
  einlassen, falsche Credentials müssen auf `/login?error=1` bleiben.

## Open issues / blockers

- Kein Code-Blocker. Migration `0016` wurde nicht gegen Produktion ausgeführt;
  das bleibt der normale, maintainer-freigegebene Migrations-Workflow nach Merge.
- Vor dem nächsten Gate-on-Production-Deploy müssen `PREVIEW_USER`,
  `PREVIEW_PASS` und `PREVIEW_SESSION_SECRET` in Vercel gesetzt sein. Ohne
  vollständige Konfiguration bleibt das Gate absichtlich geschlossen.
- `brain/wiki/architecture.md`, `project-state.md`,
  `deferred-questions.md` und `log.md` enthalten noch den alten Invite-Stand.
  Sie bleiben gemäß Strand-Reinheit aus diesem Product-PR heraus und gehören
  nach Merge in einen Koordinations-Rollup.

## For next session

- Nach Merge: Migration `0016` über den freigegebenen Workflow anwenden und den
  read-only Rollenvertrag spätestens in Launch-Readiness erneut verifizieren.
- Nach erfolgreichem Vercel-Cutover die alte Variable
  `PREVIEW_INVITE_SECRET` entfernen; für einen bewussten globalen Logout
  `PREVIEW_SESSION_SECRET` rotieren und neu deployen.
- PL1 enthält künftig keine Invite-/DB-Arbeit mehr, sondern nur den nach
  Gate-off verbleibenden Proxy-/Gate-/Login-/Cookie-Code und die zugehörige
  Restdokumentation.

## References

- Maintainer-Entscheid vom 2026-07-23 (dieser Session-Prompt)
- `sessions/archive/2026-06/2026-06-20-163-impl-timed-preview-access.md`
- `docs/launch-master-plan.md`
