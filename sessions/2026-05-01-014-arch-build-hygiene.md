---
session: 2026-05-01-014
role: architect
date: 2026-05-01
status: implemented
slug: build-hygiene
parent: null
links:
  - 2026-04-28-003
  - 2026-04-30-013
  - 2026-05-01-015
commits:
  - d33a8d99e785d02ff942792264a810d239053b5d
  - 10507795f3272e75354ad69cd489e151b9e47ffd
  - bddf21567ea75bb74b1dfeaf9a2fc440124a5b5d
---

# Phase 1.5 — Build-Hygiene: CI, Migration-on-Deploy, /healthz, Preview-URLs

## Goal

Vier kleine, voneinander unabhängige Infrastruktur-Schritte, die das Projekt
weniger fragil machen, bevor Phase 4 (Ingestion) reale Datenflüsse einbringt:
GitHub-Action-CI, automatische Drizzle-Migrationen auf Vercel-Deploys, eine
`/healthz`-Route für späteres Uptime-Monitoring, und Verifikation/Setup der
Vercel-Preview-URL-Comments auf PRs. Kein UI-Aufwand, keine Schema-Änderung,
keine neue Dependency außer den minimal nötigen für CI.

## Context

Phase 2a slim + polish ist geschlossen (Sessions 008/011/012/013). Der Stand
ist: Build grün auf main, manuelles `npm run db:migrate` nach Schema-Änderungen,
keine CI, kein Health-Check. Das hat bisher gehalten, weil das Schema seit dem
Bootstrap stabil ist und Philipp deploys eigenhändig auslöst. Sobald Phase 4
Ingestion-Pipelines schreibt, werden Schema-Änderungen häufiger und kleinere
Fehler (vergessenes `db:generate`, `any` durchgerutscht) kommen unbemerkt durch.

Stack-relevante Punkte für diesen Brief:
- `package.json` hat `lint`, `typecheck`, `db:generate`, `db:migrate` als
  Scripts. `build` ist plain `next build` ohne Migration-Step.
- `src/db/migrations/` wird von `drizzle-kit generate` befüllt und ist
  committed.
- Vercel deployt heute auf jeden Push (main + Branches → Preview-URLs).
- Supabase-`DATABASE_URL` ist in Vercel als Env-Var gesetzt; lokal in
  `.env.local`.

## Pre-flight (Philipp, vor dem Handoff an CC)

- **`NEXT_PUBLIC_SITE_URL` in Vercel auf `https://chrono-lexicanum.vercel.app`
  setzen.** Stand seit Phase 1 noch auf `http://localhost:3000`. Carry-over aus
  Session 011, jetzt natürlicher Moment dafür weil dieser Brief ohnehin
  Vercel-Env-Vars anfasst (Migration-on-Deploy braucht `DATABASE_URL` zur
  Build-Zeit, also bietet sich die Doppel-Visite an). CC muss das nicht
  selbst machen — bitte einmal im Vercel-Dashboard durchklicken bevor du den
  Brief übergibst.

## Constraints

- **Keine neue Dependency außer minimal nötig.** CI-Workflow braucht keine
  externen Actions-Marketplace-Pakete jenseits der GitHub-offiziellen
  (`actions/checkout`, `actions/setup-node`, `actions/cache`). Healthz braucht
  null neue Pakete. Migration-Step nutzt `drizzle-kit migrate` oder Drizzle's
  programmatische Migrator-API — beides ist schon installiert.
- **Existing Drizzle-Schema und -Migrationen NICHT anfassen.** Dieser Brief
  ändert weder `src/db/schema.ts` noch was unter `src/db/migrations/`. Er
  ändert nur den *Mechanismus*, mit dem die Migrationen auf Vercel laufen.
- **CI darf `npm run build` NICHT laufen lassen.** Vercel macht den Build,
  CI dupliziert nur was Vercel nicht macht: Lint und Typecheck. Build ist
  in CI teuer und langsam, und wenn er bricht erfährst du es eh über Vercel.
- **`/healthz` NICHT cachen.** Die Route muss bei jedem Request den DB-Ping
  ausführen. `dynamic = "force-dynamic"` oder `revalidate: 0`.
- **`/healthz` NICHT auf der Hub-Footer-Count-Logik aufbauen.** Eigener,
  trivialer Query (`select 1` oder ein billiges `select count(*) from eras`).
  Die Route soll überleben können wenn Hub-Logik bricht.
- **Keine Server-Action und keine Form auf `/healthz`.** Pure Route-Handler
  mit JSON-Response. Wird von CLI-Tools / Uptime-Monitoring konsumiert,
  nicht von Browsern in einer Session.
- **CI-Fail soll Merge blocken.** GitHub Branch-Protection auf `main` ist
  Philipps manuelle Geste, aber die CI muss als Required-Check konfigurierbar
  sein — d.h. ein eindeutiger, stabiler Check-Name.

## Out of scope

- Keine E2E-Tests (Playwright/Cypress) — gehört zu Phase 6 Polish.
- Kein Sentry / Error-Tracking — eigene Entscheidung, eigener Brief.
- Keine Lighthouse-Budgets / Performance-Gates in CI.
- Kein Code-Coverage-Setup.
- Keine Refactors an `package.json`-Scripts jenseits von dem was nötig ist
  (z.B. einen `vercel-build`-Step zu addieren wenn das der gewählte
  Migration-Mechanismus wird).
- Keine Refactors am Hub oder an der Timeline. Nicht reizen lassen.
- Keine Änderung am `?era=…`-Contract oder an Timeline-Komponenten.
- Keine Reduce-Motion-Verifikation auf der Live-Preview (steht im Carry-over
  von 013, eigenes Item).
- Cluster-Collapse, EntryRail, FilterRail, DetailPanel — bleiben Phase-2a-Themen,
  separate Briefe.

## Acceptance

Die Session ist fertig wenn:

**CI**
- [ ] `.github/workflows/ci.yml` existiert. Triggert auf `pull_request` und auf
  `push` zu `main`. Concurrency-Group cancelt frühere Runs wenn neuer Push
  kommt.
- [ ] CI-Steps: checkout, Node-Setup mit npm-Cache, `npm ci`, `npm run lint`,
  `npm run typecheck`. Keine Build-Steps, keine Tests (gibt's noch keine).
- [ ] Auf einem Test-PR mit absichtlich eingeschmuggeltem `any` (CC erzeugt
  einen kleinen Demo-Branch, mergt nicht) wird der Check rot. Auf einem
  sauberen Branch wird er grün.
- [ ] Stabiler Check-Name dokumentiert (z.B. `ci / lint-and-typecheck`), damit
  Philipp ihn später als Required-Check konfigurieren kann.

**Drizzle-Migrationen auf Vercel-Deploy**
- [ ] Vercel-Build wendet pendinge Migrationen an, bevor `next build` läuft.
  Mechanismus ist CC's Wahl (`vercel-build`-Script in `package.json`,
  `vercel.json` Build-Override, oder programmatischer Migrator vor `next
  build`) — Begründung im Report.
- [ ] Test: ein dummy-Branch mit einer no-op Migration (z.B. ein
  `comment on table` oder ein Index der schon implizit existiert) wird auf
  Vercel deployed; der Build-Log zeigt die Migration ausgeführt; Preview-URL
  serviert. Migration danach in einem Aufräum-Commit zurückgenommen oder als
  saubere Migration belassen — CC entscheidet was sauberer ist.
- [ ] Wenn die Migration scheitert, scheitert auch der Build (Schema-Drift
  darf nicht silently in Production landen).

**`/healthz`**
- [ ] Route-Handler unter `src/app/healthz/route.ts` (App-Router-Route-Handler,
  nicht Page).
- [ ] Antwortet mit `200` und JSON-Body `{ ok: true, db: "up", ts: <ISO8601> }`
  wenn DB-Ping erfolgreich.
- [ ] Antwortet mit `503` und JSON-Body `{ ok: false, db: "down", error: <message> }`
  wenn DB nicht erreichbar (Timeout, Auth-Fail, etc.). Error-Message gekürzt
  auf eine Zeile, keine Stacktraces im Response.
- [ ] `curl https://chrono-lexicanum.vercel.app/healthz` liefert nach
  Production-Deploy `200` mit valide parse-barem JSON.
- [ ] Route ist nicht gecached — zwei aufeinanderfolgende Calls haben
  unterschiedliche `ts`-Werte.

**Preview-URL-Comments**
- [ ] Verifiziert: kommentiert Vercel bei einem PR die Preview-URL
  automatisch? Wenn ja → kurze Zeile in `ONBOARDING.md` dokumentieren, fertig.
  Wenn nein → minimale GitHub-Action mit `vercel/action` oder Equivalent
  setup, ohne neue Dependencies wenn möglich. Falls eine Action nötig wird,
  Begründung im Report.

**Doc**
- [ ] `ONBOARDING.md` aktualisiert: ein Absatz pro Item (CI, Migration,
  Healthz, Preview-URLs). Was erwarten, wo nachschauen wenn was rot wird.
- [ ] `ROADMAP.md` Phase-1.5-Items abgehakt (oder mit ✅-Annotation pro
  shipping Item).

**Verifikation**
- [ ] `npm run lint` lokal: 0 errors (1 vorbestehende Warning OK, Baseline).
- [ ] `npm run typecheck` lokal: clean.
- [ ] CI grün auf dem PR der diese Session shippt.
- [ ] Preview-Deploy grün; `/healthz` antwortet `200`; Migration-Step im
  Build-Log sichtbar.

## Open questions

Antworten gehören in den Implementer-Report, sind aber keine Blocker.

1. **Migration-Mechanismus.** `vercel-build`-Script in `package.json` ist die
  konventionelle Wahl. Drizzle hat eine programmatische Migrator-API
  (`drizzle-orm/postgres-js/migrator`) die ggf. besser kontrolliert werden
  kann als `drizzle-kit migrate`-CLI. Welche Variante fühlt sich für dieses
  Projekt richtig an, und warum?

2. **Vercel-Preview-URL-Comments.** Default-on bei der GitHub-Integration?
  Oder muss eine Action her? Falls Action: gibt's einen Weg ohne neuen
  Marketplace-Dependency (z.B. via `gh`-CLI in einem Inline-Script)?

3. **`/healthz` Auth.** Soll die Route public sein oder durch einen Header-Token
  gegen Scraping/Abuse geschützt? Default-Empfehlung public, weil Health-Checks
  meist von Cron-Services oder Uptime-Monitoring konsumiert werden, die keinen
  State halten. Aber wenn du anderer Meinung bist: kurz im Report.

4. **CI Node-Version.** `setup-node` braucht eine Version. Pin auf das was
  `package.json` `engines` sagt — falls `engines` fehlt: setze einen
  vernünftigen Default (Node 22 LTS), dokumentiere die Wahl, und füge ein
  `engines`-Feld hinzu damit lokale und CI-Runs nicht auseinanderlaufen.

## Notes

**Stil-Hinweis:** Dieser Brief hat *keine* Design-Freedom-Sektion, weil keine
UI-Oberfläche gerendert wird. `/healthz` ist eine JSON-Route ohne menschlichen
Reader. Falls CC Lust hat, eine HTML-Variante an `/healthz?html=1` o.ä.
auszuliefern: out of scope, kein Anlass.

**Carry-over-Status für `sessions/README.md`:**
- `NEXT_PUBLIC_SITE_URL` → in den Pre-flight-Block dieses Briefs gefoldet,
  wird nach Verifikation gestrichen.
- Hub-Novel-Count-Freshness → bleibt im Carry-over, Entscheidung für Phase 4.

**Referenz-Snippets** (illustrativ, keine vollständige Implementierung):

CI-Skelett (`.github/workflows/ci.yml`):
```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'  # oder was engines sagt
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
```

`/healthz` Route-Handler-Form (Pseudo, nicht final):
```ts
// src/app/healthz/route.ts
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, db: "up", ts: new Date().toISOString() });
  } catch (err) {
    return Response.json(
      { ok: false, db: "down", error: String(err).slice(0, 200) },
      { status: 503 }
    );
  }
}
```

Migration-Step in `package.json` (eine Variante):
```json
"vercel-build": "drizzle-kit migrate && next build"
```

— alternativ programmatisch über einen `scripts/migrate.mjs`, wenn CC das
robuster findet.
