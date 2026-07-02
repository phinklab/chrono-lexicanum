---
session: 2026-07-02-180
role: architect
date: 2026-07-02
status: open
slug: ci-test-gate-wartung
parent: null
links: [2026-06-03-122, 2026-07-02-177]
commits: []
---

# 180 — CI-Test-Gate + Wartungsrunde: `npm test`-Aggregat, Deps, DB-Mini-Hygiene (122-Batches)

## Goal

Die ~30 vorhandenen Assertion-Test-Skripte für CI sichtbar machen (DB-freies `npm test`-Aggregat + PR-Gate) und in derselben Session die fällige Wartungsrunde fahren: Dependency-Scanning, ESLint-10-Bump **vor dem EOL 2026-08-06**, kleinere Deps-Pflege, zwei Ein-Zeilen-DB-Hygiene-Fixes, ssl-Evaluation. Batches-Strang, kollisionsfrei zum Product-Strang; nach der Hygiene-Wave 175–177 einreihbar, parallel zu 178 fahrbar.

## Context

Quelle: Status-quo-Review 2026-07-02 (adversarial verifiziert, `main` @ `add7ab5`). Die Review-Datei ist gitignored und liegt **nicht** in deinem Worktree — die Findings stehen vollständig hier:

- **W4 · Pipeline-Testsuite ist für CI unsichtbar — MEDIUM, bestätigt 3/3; von Deps- UND Scripts-Dimension unabhängig gefunden.** Fundort: `.github/workflows/ci.yml:31`. CI führt nur lint, typecheck, check:eras, brain:lint aus. ~30 Assertion-basierte `test-*.ts` existieren (resolver, apply, podcast, refresh, …; größte: `test-resolver.ts`, 120K, 518 Cases), aber kein `npm test`-Aggregat, kein CI-Job — sie laufen nur, wenn Philipp an jeden einzelnen Befehl denkt. Regressionen in ~46K LOC Pipeline-Code können unbemerkt mergen; der Verifier fand einen dokumentierten Fall (Session 175: 8 rote `test:podcast-cc-direct`-Fälle erst nachträglich entdeckt), wo genau das passiert ist. Review-Einstufung: **das größte 12-Monats-Wartbarkeitsrisiko des Projekts** und zugleich „die höchste Wert-pro-Aufwand-Investition im ganzen Review". Die Review hat auch die Test-Strategie-Frage beantwortet: **kein Framework-Umbau** — die node:assert-Skripte sind fürs Scope richtig; es fehlt ausschließlich Aggregat + CI-Job.
- **K33/K55 · Kein npm audit / Dependabot / CodeQL — LOW.** Nichts scannt Dependencies; Session-Logs erwähnen bereits eine transitive Audit-Warnung unter drizzle-kit.
- **K31 · ESLint 9 erreicht EOL am 2026-08-06** (~5 Wochen ab Review-Datum) — Bump aufs aktuelle Major, `eslint-config-next`-Kompatibilität prüfen.
- **K68 · TypeScript ein Major hinter stable** (zum Review-Zeitpunkt 5.9 vs. 6.0) — testen; bewusstes Zurückbleiben ist okay, dann mit Rationale im Report.
- **K67 · Anthropic SDK `^0.92`** — Caret crosst 0.x-Minors nicht; zum Review-Zeitpunkt war 0.106 aktuell. Bewusst bumpen (Pfad: Ingestion-LLM).
- **K70 · React 2 Patches hinter latest** (Review-Zeitpunkt) — beim Deps-Rundgang mitnehmen.
- **K71 · Keine `.nvmrc` trotz `engines >=22`** — anlegen, konsistent zu `engines`.
- **K19 · `characters.primary_faction_id`: kein Index, kein FK — LOW, aber echte undokumentierte Inkonsistenz.** Wird auf Faction-Seiten equality-gefiltert (`src/lib/entity/loader.ts:343`) → Seq-Scan pro Request; **jede andere FK-artige Spalte im Schema IST indiziert**. Ein-Zeilen-Fix (Index; FK optional, dein Call mit Blick auf Seed-Reihenfolge).
- **K51 · `factions.parent_id` ohne Index — dokumentierter Tradeoff** (Referenztabellen bewusst schlank, Faction-Count winzig), aber als Gratis-Win freigegeben: mitnehmen, wenn ohnehin eine Migration entsteht.
- **K50 · `works_slug_idx` dupliziert den UNIQUE-Index auf `slug`** → droppen. (Die ebenfalls erwähnten Low-Selectivity-Indizes auf `works.kind`/`canonicity` nur dokumentieren, nicht anfassen.)
- **K54 · `ssl: 'require'` ohne Zertifikats-Verifikation — LOW (Polish-Grade).** postgres.js mappt `'require'` auf `rejectUnauthorized: false`; theoretisches MITM-Fenster auf der privilegierten DB-Verbindung (`src/db/client.ts`). Evaluieren, ob Zertifikatsprüfung gegen den Supabase-Pooler praktikabel ist; wenn nein, Residual-Risiko im Client-Docblock dokumentieren.

## Constraints

- **`npm test` aggregiert nur DB-freie Suiten.** Du inventarisierst, welche der `test-*.ts` ohne DB/Netz laufen (Kandidaten laut Review: test-resolver, test-aliases, test-search-index, test-book-file, …) und nimmst genau die auf; DB-gebundene Suiten bleiben manuelle Befehle und werden im Aggregat-Kommentar gelistet. Inventar (aufgenommen/ausgelassen + Grund) in den Report.
- CI-Job gated PRs (zusätzlich zu den bestehenden Checks, `brain:lint` bleibt grün). Laufzeit im Blick behalten — wenn das Aggregat den PR-Loop spürbar verlangsamt, splitte sinnvoll (z. B. schnelle Suiten gaten, langsame als nightly/dispatch) und begründe im Report.
- Dependency-Scanning: non-blocking `npm audit`-Report im CI + Dependabot-Config (oder das von dir recherchierte, heute übliche Äquivalent — dein Call, Begründung im Report).
- **Versionen recherchierst und pinnst du** (CLAUDE.md § Version policy) — dieser Brief nennt bewusst keine Zielnummern, nur Absichten: ESLint aktuelles Major vor dem EOL, TS-Major testen (Zurückbleiben mit Rationale erlaubt), SDK-Minor-Bump, React-Patches. Jeder bewusste Nicht-Bump in den Report.
- DB-Änderungen als reguläre Drizzle-Migration (`npm run db:generate`, SQL committen); kein Apply gegen Prod ohne Philipps Go — die Migration reitet im PR, Ausführung ist Philipps `db:migrate`.
- Refusal-Stubs, `db:sync`-Kette, Runbooks unangetastet. `brain/**` + `sessions/README.md` nicht anfassen (Rollup-Ownership). Batches-Worktree, ein PR (Split in zwei nur, wenn der Deps-Bump sich als riskant erweist — dann Begründung).

## Out of scope

- Kein Test-Framework (vitest/jest) einführen — Review-verifiziert unnötig.
- Kein Umbau von `db:sync`/`apply:*`/Resolver; keine neuen Tests schreiben (nur Aggregation vorhandener; Ausnahme: ein Mini-Smoke fürs Aggregat selbst ist okay).
- `test-resolver.ts`-Split (518 Cases, eine Datei) — dokumentierte „beim nächsten Anfassen"-Konvention, nicht diese Session.
- Kein CodeQL-Setup (übertrieben fürs Scope; Dependabot + audit reichen).
- Tailwind/Next/Drizzle-Major-Bumps — nur die oben gelisteten Pflege-Items.

## Acceptance

The session is done when:

- [ ] `npm test` existiert, läuft DB-frei lokal grün; Inventar-Tabelle (Suite → aufgenommen/ausgelassen + Grund) im Report.
- [ ] CI gated PRs mit dem Aggregat; bestehende Checks weiter grün; Gesamt-CI-Laufzeit im Report beziffert.
- [ ] `npm audit` (non-blocking) + Dependabot-Äquivalent im CI verdrahtet.
- [ ] ESLint auf aktuellem Major (vor EOL 2026-08-06), `eslint-config-next` kompatibel, Lint-Lauf grün; übrige Deps-Entscheidungen (TS, SDK, React, `.nvmrc`) umgesetzt oder mit Rationale vertagt.
- [ ] Migration: Index auf `characters.primary_faction_id` (+ ggf. `factions.parent_id`), `works_slug_idx` gedroppt; Schema und Migration konsistent committed.
- [ ] ssl-Verdikt (Zertifikatsprüfung aktiviert ODER Residual-Risiko im `client.ts`-Docblock dokumentiert) im Report.

## Open questions

- Siehst du beim Test-Inventar Suiten, die mit kleinem Aufwand DB-frei zu machen wären (Fixture statt Live-Query)? Nur listen, nicht umbauen.
