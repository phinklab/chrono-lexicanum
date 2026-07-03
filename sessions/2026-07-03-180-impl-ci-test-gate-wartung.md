---
session: 2026-07-03-180
role: implementer
date: 2026-07-03
status: complete
slug: ci-test-gate-wartung
parent: 2026-07-02-180
links: [2026-06-03-122, 2026-07-02-177]
commits: []
---

# 180 — CI-Test-Gate + Wartungsrunde: `npm test`-Aggregat, Deps, DB-Mini-Hygiene (122-Batches)

## Summary

`npm test` aggregiert jetzt 29 DB-freie Assertion-Suiten und gated PRs über den bestehenden required Check `lint-and-typecheck`; dazu Dependabot + non-blocking `npm audit`, die fällige Deps-Pflege und eine 3-Statement-DB-Hygiene-Migration. **Die eine Sache, die Cowork wissen muss: der ESLint-10-Bump ist upstream blockiert** — `eslint-config-next` bündelt `eslint-plugin-react/import/jsx-a11y`, und deren *neueste* Releases peeren alle noch kein `eslint ^10` (ESLint 10 entfernt `context.getFilename()`, das eslint-plugin-react 7.37.5 zur Laufzeit crasht). Bleibt bewusst auf ESLint 9.39.4; TypeScript **6.0.3** dagegen ist verifiziert geshippt (lint + tsc + `next build` grün).

## What I did

- `scripts/run-tests.ts` — **neu.** DB-freies Test-Aggregat für `npm test`. Auto-Discovery aller `scripts/test-*.ts` (kein Allow-List → neue Suiten sind ab Landing CI-sichtbar, die Ursache des Ursprungsproblems kann nicht wiederkehren), minus einer dokumentierten `DB_OR_NETWORK_GATED`-Denylist. Jede Suite läuft als isolierter `node --import tsx`-Subprozess mit aus dem Child-Env entferntem `DATABASE_URL` (garantiert DB-frei; verhindert versehentliche Prod-Treffer über die `??=`-Stub-Pfade in test-apply-book/test-migration-equivalence). Selbstguard: stale Denylist-Einträge (Datei existiert nicht mehr) brechen mit Exit 2.
- `package.json` — `"test": "tsx scripts/run-tests.ts"`; Deps-Bumps (siehe Decisions).
- `.github/workflows/ci.yml` — `npm test` als Step in den bestehenden required Job `lint-and-typecheck` gefaltet (gated PRs sofort, ohne Branch-Protection-Settings anzufassen, ohne zweites `npm ci`); neuer non-blocking `audit`-Job (`npm audit`, `continue-on-error: true`).
- `.github/dependabot.yml` — **neu.** npm + github-actions, wöchentlich, minor/patch gruppiert gegen PR-Rauschen.
- `.nvmrc` — **neu**, `22` (konsistent zu `engines >=22` und CI `node-version: '22'`).
- `src/db/schema.ts` — Index auf `characters.primary_faction_id` + `factions.parent_id`; `works_slug_idx` entfernt (redundant zum `.unique()`-Index).
- `src/db/migrations/0015_keen_tag.sql` (+ Journal + Snapshot) — generierte Migration: 1 DROP + 2 CREATE INDEX.
- `src/db/client.ts` — ssl-Residual-Risiko im Docblock dokumentiert (kein Code-Change).

## Decisions I made

### Test-Inventar (29 aufgenommen / 1 ausgelassen)

Methode: jede der 30 `test-*.ts` ohne `.env.local` mit 90s-Timeout laufen lassen. DB-Suiten werfen sofort „DATABASE_URL is not set" (sauberes Signal), Netz-Suiten würden hängen (Timeout). Ergebnis: **29 laufen grün DB-frei, keine hing → keine Netz-Abhängigkeit.**

| Suite | Aufgenommen? | Grund |
|---|---|---|
| test-ask-recommend.ts | **nein** | Einzige DB-gebundene Suite — liest `.env.local`, recommend-lib importiert `src/db/client` und queried Supabase. Bleibt manuell: `npm run test:ask-recommend`. |
| test-aliases, test-apply-book, test-apply-override-collections, test-ask-questions, test-audiobook-narrators, test-book-detection-guard, test-book-enrich, test-book-file, test-book-review, test-brain-lint-budgets, test-curation-overlay, test-entity-blurbs, test-loop-next-batch, test-map-worlds, test-migration-equivalence, test-podcast-apply, test-podcast-cc-direct, test-podcast-ingest, test-podcast-youtube, test-preview-token, test-refresh, test-resolver-coverage, test-resolver-data-integrity, test-resolver-loop-detect, test-resolver, test-roster-extension, test-search-index, test-synopsis-lint, test-timeline | **ja** (29) | Alle rein file-/logikbasiert. Auffällig-wirkende Fälle geprüft: `test-podcast-cc-direct` „anthropic"-Treffer sind ein Guard-Test, der Quelldateien grep't (kein LLM-Call); `test-podcast-youtube` parst Fixtures, kein Netz; `test-apply-book`/`test-migration-equivalence` stubben `DATABASE_URL` und importieren `@/db/client` dynamisch (postgres.js verbindet lazy → nie). |

Kein Framework-Umbau (brief-verifiziert unnötig) — die node:assert-Skripte bleiben, nur Aggregat + Gate fehlten. Kein separates Smoke-File fürs Aggregat: ein `test-*.ts`, das den Runner testet, würde von der Auto-Discovery selbst eingesammelt (zirkulär); stattdessen trägt der Runner den Stale-Denylist-Selbstguard eingebaut. Gate-Pfad separat verifiziert (Wegwerf-Fail-Test → Runner Exit 1, Suite-Output sichtbar).

### CI-Struktur

`npm test` **in** den bestehenden `lint-and-typecheck`-Job gefaltet statt eigener Job: der Job ist bereits der von Branch-Protection required Check (Memory: „main requires PR + lint-and-typecheck"), also gated der gefaltete Step PRs **sofort** ohne dass Philipp Branch-Protection-Settings ändern muss — ein neuer Job namens `test` liefe erst nach manueller Aufnahme in die Required-Liste. Spart zudem ein zweites `npm ci`. `audit` als eigener non-blocking Job, weil ein Vuln-Report Sichtbarkeit ohne Gate braucht.

### Deps (recherchiert & gepinnt, CLAUDE.md § Version policy)

- **ESLint: bleibt `^9.39.4` (aktuelles 9.x / „maintenance"-Tag) — Bump auf 10 upstream blockiert.** ESLint 10.6.0 ist latest; `eslint-config-next@16.2.x` peert `eslint >=9`, aber bündelt `eslint-plugin-react@7.37.5` / `eslint-plugin-import@2.32.0` / `eslint-plugin-jsx-a11y@6.10.2` — **deren neueste Releases peeren alle nur bis `^9`**, kein `^10` existiert. Empirisch bestätigt: mit eslint@10.6.0 crasht `npm run lint` zur Laufzeit (`TypeError: contextOrFilename.getFilename is not a function` in eslint-plugin-react — ESLint 10 hat die deprecte `context.getFilename()`-API entfernt). Ein `overrides` kann das nicht fixen, weil die kompatiblen Plugin-Versionen schlicht noch nicht veröffentlicht sind. EOL 2026-08-06 bedeutet nur „keine neuen Core-Patches", nicht „hört auf zu funktionieren"; der Bump ist auf ein Next-Config-Release gated, nicht auf uns. Dependabot wird die ESLint-10-PR öffnen, sobald der Plugin-Stack nachzieht.
- **TypeScript: gebumpt `^5.9.3 → ^6.0.3` (jetzt stable latest).** Über **alle** Pfade verifiziert: `tsc --noEmit` grün, `npm run lint` grün, **und `next build` grün** (BUILD_EXIT=0, voller Prod-Build inkl. SSG-Prerender — der Pfad, den CI *nicht* abdeckt, weil CI nur `tsc` läuft und Vercel baut). `typescript-eslint@8.59.1` peert `typescript <6.1.0`, deckt 6.0 also ab. Kein bewusstes Zurückbleiben nötig — sauber verifiziert.
- **Anthropic SDK: gebumpt `^0.92.0 → ^0.110.0`.** Caret crosst 0.x-Minors nicht, daher manuell. Alle 8 Nutzungsstellen (`src/lib/ingestion/podcast/*`, `scripts/*`) sind typecheck-abgedeckt (grün).
- **React/react-dom: gebumpt `19.2.5 → 19.2.7`** (2 Patches, wie im Brief vermerkt). Install + typecheck + `next build` grün.
- **.nvmrc: neu, `22`.**
- Nicht angefasst: `next` / `eslint-config-next` (16.2.9 — kein Major-Bump im Scope; eslint-config-next-Patch alleine wäre nutzlos ohne den blockierten ESLint-10).

### DB-Migration — Index-only, kein FK

- `characters_primary_faction_idx` (K19), `factions_parent_idx` (K51, Gratis-Win in derselben Migration), `works_slug_idx` gedroppt (K50 — `works.slug` ist `.unique()`, dessen `works_slug_unique`-Index Slug-Lookups schon bedient; verifiziert, dass er aus 0003 existiert → kein Verlust der Slug-Indizierung).
- **Kein FK** auf `primary_faction_id` bzw. `parent_id`: Character-Ingest kann eine Faction-ID tragen, die (noch) nicht in `factions` steht; ein FK würde das zu einem Seed-/Apply-Fehler machen. Der Index ist der eigentliche Perf-Fix (Seq-Scan pro Faction-Seiten-Request in `src/lib/entity/loader.ts`). Namenskonvention `<table>_<entity>_idx` (Suffix `_id` weg) gespiegelt.
- **Nicht ausgeführt** — die Migration reitet im PR, `db:migrate` gegen Prod ist Philipps Schritt.

### ssl-Verdikt (K54) — Residual-Risiko dokumentiert

Direkt aus postgres.js 3.4.9 bestätigt (`connection.js:283-284`): `ssl: "require"` → `rejectUnauthorized: false` (verschlüsselt, aber Cert **nicht** verifiziert). `verify-full` **nicht** aktiviert: es bräuchte den Pooler-Cert in Node's Trust-Store (oder die im Repo gepinnte Supabase-CA), und ein falscher Wert bricht *jeden* Prod-DB-Zugriff — hier ohne Live-Pooler-Handshake nicht testbar, unverhältnismäßig für einen LOW-Fund. Verdikt: Residual-Risiko + Enable-Pfad im `client.ts`-Docblock dokumentiert (Option B des Briefs).

## Verification

- `npm test` — **PASS**, 29 Suiten grün in ~5s lokal (erwartet ~10–20s CI cold; tsx-Transpile der großen Suiten dominiert). Gate-Fail-Pfad separat mit Wegwerf-Test verifiziert → Exit 1.
- `npm run lint` (eslint 9.39.4) — pass
- `npm run typecheck` (TS 6.0.3) — pass
- `npm run build` (`next build`, TS 6.0.3, Stub-DATABASE_URL) — pass (BUILD_EXIT=0, voller Route-Tree + SSG-Prerender)
- `npm run check:eras` — pass; `npm run brain:lint -- --no-write` — pass (0 blocking; die Warnings sind vorbestehend, nicht aus diesem Diff)
- `npm audit` — 9 → **8** Vulns nach den Bumps (1 low, 6 moderate, 1 high); alle transitiv/dev/build-time (esbuild via tsx+drizzle-kit, next-internes postcss, @babel/core, undici, js-yaml). `npm audit fix --force` würde drizzle-kit→0.18.1 + next→9.3.3 downgraden (inakzeptabel) → bewusst nicht angefasst, Dependabot ist der Remediation-Pfad.
- YAML beider CI-Configs mit js-yaml geparst — valid.
- `db:generate` → `0015_keen_tag.sql` reviewed (exakt 1 DROP + 2 CREATE, keine Datenänderung, kein Table-Rename → kein TTY-Rename-Prompt).

## Open issues / blockers

Keine. Alle sechs Acceptance-Punkte erfüllt. Migration ausführung (Philipps `db:migrate`) und PR-Merge stehen noch aus (Session endet hier, wartet auf „fertig").

## For next session

- **ESLint 10, wenn der Next-Config-Stack nachzieht.** Trigger: `eslint-config-next` shippt eine Version, deren gebündelte `eslint-plugin-react`/`import`/`jsx-a11y` `eslint ^10` peeren. Dependabot sollte das als PR surfacen; dort ist der Bump dann ein Ein-Zeilen-Change + `npm run lint`-Check.
- **Audit-Vulns.** Die 8 sind Dependabot-getrackt; die meisten lösen sich, sobald tsx/drizzle-kit auf esbuild-Fixes und Next auf neuere postcss-Bundles ziehen.
- **Offene Brief-Frage — DB-frei machbare Suiten?** Nur `test-ask-recommend` ist DB-gebunden. Fixture-basiert DB-frei machen wäre möglich, aber **nicht** „kleiner Aufwand": es bräuchte einen repräsentativen Snapshot der recommend-Query-Inputs (Bücher/Faktionen/Facets) und würde die Suite gegen eingefrorene Daten testen (geringere Fidelity als ein Live-Ranking-Check). Empfehlung: als manuellen DB-Check belassen.
- `test-resolver.ts`-Split (518 Cases) bleibt die dokumentierte „beim nächsten Anfassen"-Konvention (out of scope hier).

## References

- npm-Registry (autoritativ) für alle Versionen: eslint 10.6.0/9.39.4, eslint-config-next 16.2.10, typescript 6.0.3, @anthropic-ai/sdk 0.110.0, react/react-dom 19.2.7, typescript-eslint 8.59.1/8.62.1 (peer-Ranges).
- postgres.js 3.4.9 `src/connection.js:283-284` (ssl-`require`-Mapping) + README § MITM.
- ESLint 10 Breaking: Entfernung von `context.getFilename()` (Crash-Fundort eslint-plugin-react 7.37.5).
