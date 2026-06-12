---
session: 2026-06-11-144
role: implementer
date: 2026-06-11
status: complete
slug: technical-deep-review
parent: (kein Arch-Brief — Direktauftrag Philipp, technisches Deep-Review: Code-Qualität, Security/DB, Performance)
links: [2026-06-11-140, 2026-06-11-141]
commits:
  - 0f27a94 (doc-only, direkt auf main)
---

# Technical-Deep-Review — Code-Qualität, Security/DB-Härtung, Performance

> Worktree: `chrono-lexicanum-product`, Strang: Product/UI, Branch: `worktree/product-bootstrap` @ `d1ca6f1` (== origin/main).
> **Read-only-Review:** kein Code angefasst. Einziges Artefakt dieser Report (doc-only → direkt auf `main`).
> **Kein Design-Mandat** — das war Review 141. Hier geht es um state-of-the-art Code, Sicherheit und Tempo.
> **Empirie lokal:** 1× `next build`, ~30 Requests gegen `next start`, `npm audit`, Bundle-Analyse aus den
> Build-Manifesten. Kein Browser/CDP, kein Produktionstest. Supabase-Pooler geschont.

## Methodik

55-Agent-Workflow (effektiv 38 abgerechnete Agents): 14 read-only Finder über 5 Dimensions-Blöcke
(T Code-Qualität, S Security/DB, P Performance, R Resilienz/Build, A A11y) + 4 Web-Research-Agents,
1 Dedupe-Agent, 9 adversariale Batch-Verifier, 1 Completeness-Critic, 5 Nachzügler-Finder (je mit
eigener Verifikation). **Jedes faktische Finding wurde von einem zweiten, unabhängigen Agent adversarial
verifiziert** (Dateien selbst geöffnet, „nimm an, das Finding ist falsch", NO-DESIGN-Test, Live-Restyle-
Status, fix_sketch auf Tragfähigkeit, Zahlen nachgezählt). Plus eine eigene Orchestrator-Verifikation der
höchstrangigen Security-Spur (Header-Spoof, § S.1).

| | |
|---|---|
| Roh-Findings (14 Finder) | **89** |
| nach Dedupe | **68** + 19 Nachzügler |
| **bestätigt / mit Korrektur** | **72** (davon 19 adjusted) |
| widerlegt & aussortiert | **14** (§ „Widerlegte Findings") |
| unverifizierbar (→ Hypothese) | **1** |
| unverifiziert übernommen | **0** |

Verteilung der bestätigten Findings nach Severity: **S1 (hoch) 15 · S2 (mittel) 37 · S3 (Hygiene) 20**.
Kein S0 — es gibt keine direkt exploitable Vuln und keinen launch-blockierenden Ausfall, der nicht durch
Caching/Patch trivial zu schließen wäre. Web-Recherche: 94 zitierte Best-Practices über 4 Themen
(Next-16-Caching, Security-Header/Rate-Limiting, Supabase-Pooler/Drizzle, Bundle-Perf) — als
„Best-Practice-Raster" unten, von dem die Fix-Specs zitieren.

**Severity-Rubrik:** S0 = exploitable Vuln / launch-blockierender Ausfall · S1 = gemessener Engpass / echte
Abuse-Fläche / Sicherheits-Patch / Correctness-Bug · S2 = Best-Practice-Verstoß mit benennbaren Kosten
(KB / ms / Query-Zahl / Wartung) · S3 = Hygiene/Konsistenz. Effort: S (<1h) / M (halber Tag) / L (>1 Tag).

---

## Executive Summary

1. **Der größte einzelne Sicherheits-Hebel ist ein Punkt-Release.** `next@16.2.4` trägt eine **HIGH-CVE-
   Sammlung** — u. a. DoS über Server Components (GHSA-8h8q-6873-q5fj, fix 16.2.5) und einen
   **Middleware/Proxy-Bypass via Segment-Prefetch** (GHSA-26hh-7cqf-hhc6, fix 16.2.6), der direkt das
   Basic-Auth-Gating in `proxy.ts` aushebeln kann. `npm install next@16.2.9` ist ein Ein-Befehl-Fix ohne
   Major (§ S.5).
2. **Die Lastprobe hat die Brief-140/141-These nicht nur bestätigt, sondern verschärft.** `/compendium`
   (force-dynamic) füllte kalt in **60–120 s** und **verkeilte dabei den ganzen Pool**: ein
   gleichzeitiges `/healthz` bekam **HTTP 503**, ein gleichzeitiges `/timeline` lief in den Timeout.
   `/archive` liefert eine **16,45-MB-HTML-Payload** ungecacht pro Request; 6 parallele `/archive`-Requests
   hungerten **alle** in 30 s aus. Die Abhilfen sind billig und liegen bereit (ISR/`cachedRead`, SSG auf
   `/buch/[slug]`, `cacheBooks:true` auf `/ask`, Payload schlanken) — und **der Pool darf NICHT auf 15
   hochgedreht werden** (§ P, Caveat). Das ist der größte Launch-Risiko-Block.
3. **Security-Header fehlen komplett.** `next.config.ts` hat kein `headers()` — kein CSP, HSTS, X-Frame-
   Options, Referrer-Policy, Permissions-Policy. Für einen öffentlichen Reddit-Launch ist das eine
   Standard-Härtungslücke mit billigem Fix (§ S.2).
4. **Zwei Admin-Flächen sind öffentlich.** `/ingest` (interne Ingest-Logs + Roh-LLM-Payloads) und
   `/buch/[slug]/audit` (editierbare Provenance-Felder) stehen **nicht** im `proxy.ts`-Matcher und haben
   kein `getIsAdmin()`-Gate — bestätigt Befund 141-E.7, jetzt mit der `/audit`-Fläche dazu (§ S.3). Dazu:
   der Proxy **strippt einen vom Client gesetzten `x-atlas-admin`-Header nicht**, wodurch die Admin-UI auf
   `/map` per Header spoofbar ist (aber kein DB-Write dahinter — Orchestrator-verifiziert, § S.1).
5. **Datenbank: der Index-Boden ist solide, aber drei FK-Lookups laufen auf Seq-Scan und mehrere
   Junction-Traversierungen sind unbegrenzt.** `works.setting_anchor_event_id` und `event_works.workId`
   haben keinen Index; `loadFaction`/`loadLocation`/`loadCharacter`/`getWerkeRows` laden Junction-Rows
   ohne `LIMIT` — die Ursache sowohl der `/compendium`-Pool-Erschöpfung als auch eines latenten
   5×-Wachstums-Risikos (§ DB).
6. **Code-Qualität ist grundsolide, mit klaren, gefahrlosen Aufräum-Kandidaten.** ~774 Zeilen toter
   Komponenten-Code (`DetailPanel.tsx`, `Aquila.tsx`) + `lib/chronicle/roster.ts` (~323 Z., 0 Importe) +
   **3 fehlklassifizierte Dependencies** (`@supabase/supabase-js` ungenutzt; `cheerio`/`fast-xml-parser`
   gehören in devDependencies). **`zod` ist installiert, aber nirgends benutzt** — externe Eingaben
   (localStorage, JSON-Parse in der Ingestion) laufen über handgeschriebene Guards (§ T).
7. **27× `as unknown` ist real (nicht 152 wie ein Vorgänger-Review behauptete) und sicherheitstechnisch
   ok** — die Casts in `atlas/queries.ts` sind durch nachgelagerte `toNumber`/`String()`-Guards gekapselt.
   Das Muster skaliert aber nicht und wiederholt sich fehlerhaft anderswo; eine `validateSqlResult<T>()`-
   bzw. Zod-Schicht wäre der State-of-the-art-Ersatz (§ T.1).
8. **Resilienz-Löcher mit billigem Fix:** kein Root `error.tsx`/`not-found.tsx`/`global-error.tsx` (DB-
   Störung ⇒ ungebrandete Next-Default-Seite), `loading.tsx` auf 32 von 33 Routen fehlend (die gemessenen
   Cold-Fills treffen auf leere Screens), `/compendium/layout.tsx` lädt ohne try/catch (§ R).
9. **Build-/CI-Kopplung:** `vercel-build = "tsx scripts/migrate.ts && next build"` migriert bei **jedem
   Deploy** die Prod-DB (Deploy-Risiko); `ci.yml` läuft nur `on: pull_request`, also überspringen
   Direct-to-main-Commits `lint`/`typecheck`/`brain:lint` (§ R.2). Der Build selbst ist gesund: 1173
   Seiten in 192 s; der einzelne 180-s-Retry auf `/person/dan_abnett` war transient (Seite ist prerendert)
   — die Deadline ist knapp, aber nicht gerissen.
10. **Injection-Fläche ist sauber:** 13 `sql`-Templates vollständig parametrisiert, **0× `sql.raw`**, **0×
    `dangerouslySetInnerHTML`**, alle searchParams/Slugs gegen Whitelists validiert. Einzige Lücke: die
    `format`/`faction`/`facet`-Filter in `archive/filters.ts` haben (anders als `sort`) keine Enum-
    Whitelist — kein Injection-Risiko (in-memory-Filter), aber Validierungs-Inkonsistenz (§ S.8).

---

## Schritt 0 — Empirie (vom Orchestrator gemessen)

`next build` (Turbopack, Next 16.2.4): **192 s**, 1173 statische Seiten über 15 Worker. tsc grün (6 s),
eslint grün (8 s). **Korrektur zur Lautstärke:** der Build-Log zeigt einen 180-s-Timeout-Retry auf
`/person/dan_abnett` (attempt 1 of 3) — die Seite **ist** im finalen Prerender-Manifest, der Retry war
transient, der Build erfolgreich. Die `staticPageGenerationTimeout:180` ist knapp, aber aktuell nicht
gerissen (vgl. § R.2 / B2-02).

### Routentabelle (Ground Truth)

| Modus | Routen |
|---|---|
| ○ Static | `/` (revalidate 5 m), `/archive/podcasts` (5 m), `/ingest`, `/lab/*` (6) |
| ● SSG (`generateStaticParams`) | `/charakter/[slug]` (500), `/welt/[slug]` (300), `/fraktion/[slug]` (206), `/person/[slug]` (136), `/archive/podcasts/[slug]`, `/ingest/[runId]` (2) |
| ƒ Dynamic (pro Request, DB) | `/archive`, `/ask`, `/atlas`(+`[entity]`), **`/buch/[slug]`**(+`/audit`), `/buecher`, **`/compendium`**(+`[category]`), `/fraktionen`, `/healthz`, `/map`, `/timeline`, alle 5 `@modal`-Intercepts, `/[...catchAll]` |

### First-Load (aus prerenderten `<script>`-Tags)

~**628–640 KB JS** (8–10 Dateien) + **286 KB CSS** pro Route. Größter einzelner Chunk 224 KB. Gesamt
`.next/static/chunks` JS = 1320 KB. **Secret-Grep der Client-Chunks: sauber** — kein `DATABASE_URL`,
Pooler-Host, `ATLAS_PASS`, `sk-ant-`, `SERVICE_ROLE`, keine `NEXT_PUBLIC_*`-Literale.

### Lastprobe (`next start`, EIN Prozess, Pool max:5)

| Route | kalt | warm | Bemerkung |
|---|---|---|---|
| `/healthz` | 0,018 s | — | nach `/compendium`-Sturm: **503** |
| `/` (prerendert) | 0,012 s | — | 554 KB |
| `/welt/terra` (SSG) | 0,025 s | — | 222 KB |
| `/ingest` (static) | 0,004 s | — | 31 KB, **öffentlich** |
| `/archive/podcasts` (static) | 0,007 s | — | 478 KB |
| `/timeline` (dyn) | 0,39 s | 0,22 s | nach Sturm: Timeout |
| `/buch/first-and-only` (dyn) | 0,21 s | **TIMEOUT 90 s** | kein SSG |
| `/ask` (dyn) | 0,01 s | — | 34 KB |
| `/map` (dyn) | 0,015 s | — | 19 KB |
| `/atlas` (dyn) | **401** | — | Basic-Auth-Gate greift ✓ |
| `/archive` (dyn) | 1,17 s | 1,0 s | **16,45 MB Payload** |
| `/compendium` (force-dynamic) | **TIMEOUT 60 s** | **TIMEOUT 90 s** | Cold-Fill |
| **6× `/archive` parallel** | **alle 6 → Timeout 30 s** | | 6 Req > Pool max:5 |

**Recovery-Befund:** nach einem 120-s-`/compendium`-Cold-Fill war der ganze Pool verkeilt — `/healthz` 503,
`/timeline` Timeout. Der Server-Log zeigte **keine DB-Errors** — der Engpass ist der ungecachte dynamische
Cold-Fill gegen Pool max:5, **nicht die DB**.
**Übertragbarkeits-Caveat:** lokal = 1 Prozess / 1 Pool (Serialisierung); Vercel = N Lambdas mit je
eigenem Pool gegen den Supabase-Pooler (`default_pool_size` ~15). Die absoluten Zahlen gelten nicht, die
Richtung schon — deckungsgleich mit Brief 140/141.

### `npm audit` / `npm outdated`

**8 Vulns (1 high, 7 moderate).** HIGH: `next@16.2.4` (s. § S.5 — DoS Server Components fix 16.2.5,
Proxy-Bypass fix 16.2.6, CSP-nonce-XSS fix 16.2.5, + cache-poisoning). Moderate, **dev-only**:
`drizzle-kit→@esbuild-kit→esbuild` (GHSA-67mh-4wv8-2f99, fix nur via drizzle-kit-Major 0.18.1),
`brace-expansion` (in @typescript-eslint), `ws`. Sichere Patch-Bumps verfügbar: next→16.2.9, react/-dom
→19.2.7, supabase-js→2.108.1, tailwind→4.3.0, postcss→8.5.15. Majors (Entscheidung, nicht dringend):
zod 3→4, typescript 5→6, eslint 9→10.

### Grep-Metriken

90 Dateien mit `"use client"` · **27× `as unknown` in 11 Dateien** · 11× `!important` · **0×
`dangerouslySetInnerHTML`** · 13× `sql`-Template (nur healthz/schema/atlas-queries) · **0× `sql.raw`** ·
0× `process.env` in Client-Dateien · 5× `<img>` · **0× `next/image`** · **0× `next/dynamic`** · 0×
`React.lazy`. CSS 13.272 Zeilen / 31 Partials. Komponenten 125 Dateien / 18.257 Zeilen. `loading.tsx` nur
auf `/archive`. Kein Root `error.tsx`/`not-found.tsx`/`global-error.tsx`.

---

## Best-Practice-Raster (Web-Recherche, mit Quellen)

Maßstab für die Fix-Specs — vier Themen, 94 zitierte Regeln, die wichtigsten:

**Caching/Rendering (Next 16):** `force-dynamic` nur, wenn pro-Request-Daten zwingend; sonst ISR/`use
cache` ([nextjs.org/docs/app/getting-started/caching](https://nextjs.org/docs/app/getting-started/caching)).
`use cache` + `cacheLife()`-Profile (minutes/hours/max) + `cacheTag()` für On-Demand-Invalidierung via
`revalidateTag()` ([revalidating](https://nextjs.org/docs/app/getting-started/revalidating)). Kurz-Cache
(<5 min) fällt aus PPR heraus → wird dynamisches Hole. `<Suspense>` mit echtem Fallback statt leerer
`fallback={null}` über dem Body.

**Security-Header/Rate-Limiting (Vercel):** Header via `next.config.ts` `headers()` (plattform-portabler
als `vercel.json`) ([nextjs headers](https://nextjs.org/docs/pages/api-reference/config/next-config-js/headers)).
Vercel setzt HSTS auf Prod-Domains automatisch ([vercel response-headers](https://vercel.com/docs/headers/response-headers)) —
also Fokus auf CSP, X-Frame-Options (SAMEORIGIN), X-Content-Type-Options (nosniff), Referrer-Policy
(strict-origin-when-cross-origin), Permissions-Policy. CSP-Nonce via `proxy.ts` + `crypto`
([CSP-Guide](https://nextjs.org/docs/app/guides/content-security-policy)) — kostet aber dynamisches
Rendering; SRI ist die statik-freundliche Alternative. Rate-Limiting für teure ungeschützte GETs: Vercel
WAF/Firewall oder `@upstash/ratelimit`.

**Supabase-Pooler/postgres.js/Drizzle:** `prepare:false` ist im Transaction-Mode Pflicht (✓ bereits gesetzt)
([supabase pooler](https://supabase.com/docs/guides/database)). `default_pool_size` 3–5 für serverless —
**bestätigt `max:5` als richtig, nicht als zu klein.** Indizes explizit im Schema via `index()`/
`uniqueIndex()` deklarieren ([drizzle indexes](https://orm.drizzle.team/docs/indexes)); relationale
`db.query` + `with()` gegen N+1 ([drizzle rqb](https://orm.drizzle.team/docs/rqb)).

**Bundle/Assets:** Server Components als Default; `"use client"` so tief wie möglich (Leaf)
([server-and-client](https://nextjs.org/docs/app/getting-started/server-and-client-components)).
`next/dynamic` mit `ssr:false` für Browser-API-Komponenten / user-getriggerte Panels
([lazy-loading](https://nextjs.org/docs/app/guides/lazy-loading)). `next/image` statt rohem `<img>` (Vercel
Hobby: 5k Transformationen/Monat frei — [image limits](https://vercel.com/docs/image-optimization/limits-and-pricing)).
`next/font` mit `display:swap` (✓) + Preload.

---

## Top-Findings (severity-sortiert, IDs verlinken in die Dimensionen)

| ID | Sev | Eff | Titel |
|---|---|---|---|
| **S.5** | S1 | S | `next@16.2.4` → 16.2.9 (HIGH-CVE-Sammlung, inkl. Proxy-Bypass) |
| **P.1** | S1 | M | `/compendium` force-dynamic → 60–120 s Cold-Fill, verkeilt den Pool |
| **P.2** | S1 | M | `/archive` ungecacht, 16,45 MB Payload, 6× parallel = Stau |
| **P.4** | S1 | L | `/buch/[slug]` ohne SSG/ISR (0,21 s → 90 s) |
| **S.2** | S1 | S | Keine Security-Header (CSP/HSTS/XFO/…) in `next.config.ts` |
| **S.3** | S1 | M | `/audit` + `/ingest` ungegatet (Admin-Flächen öffentlich) |
| **S.1a** | S1 | S | Timing-unsafer Passwort-Vergleich in `proxy.ts` |
| **R.4** | S1 | S | Kein Root `error.tsx`/`global-error.tsx` |
| **B.1** | S1 | M | `vercel-build` koppelt Migration an jeden Deploy |
| **B.2** | S1 | S | CI nur `on: pull_request` → Direct-to-main ohne Checks |
| **T.1** | S1 | M | `as unknown`-Muster in `queries.ts` ohne Validierungsschicht |
| **R.1** | S1 | M | `setTimeout` ohne Cleanup (setState-after-unmount) |
| **T.3** | S1 | M | `localStorage`-Daten ohne Schema-Validierung; `zod` ungenutzt |
| **DB.4** | S1 | M | Compendium-Primarch-Kaskade (72 Queries) erschöpft den Pool |
| **S.1b** | S2 | S | Proxy strippt client-`x-atlas-admin` nicht → `/map`-UI spoofbar |

---

## Dimension T — Code-Qualität (TypeScript / React / Dead Code / CSS)

### T.1 · `as unknown`-Muster in `atlas/queries.ts` ohne Validierungsschicht — **S1 / M**
`src/lib/atlas/queries.ts:163,502,553,601,665,711,752,798,884,950,1005` (carried-over 140)
11 Raw-SQL-`db.execute()`-Aufrufe casten via `as unknown as ReadonlyArray<Record<string, unknown>>`. Die
Casts sind **sicherheitstechnisch ok** (nachgelagerte `toNumber`/`String()`-Guards), aber es fehlt eine
Validierungs-Schicht zwischen SQL-Ergebnis und Assertion. Bei Schema-Drift bricht das still.
**Fix-Spec:** Wrapper `validateSqlResult<T>(rows, guard)` der Form/Spalten prüft, ODER wo möglich auf
typsicheres Drizzle `db.select()`/relational `db.query` umstellen (das ist hier wegen `fetch_types:false`
+ Transaction-Pooler teils bewusst Raw-SQL — also Wrapper statt Umbau). Referenz: Drizzle RQB
(orm.drizzle.team/docs/rqb). **Eigener Brief; betrifft nur die Admin-Atlas-Fläche.**

### T.2 · `zod` installiert, aber nirgends genutzt — **S2 / L**
`package.json` + `src/lib/ask/curation.ts`, `src/lib/galaxy/storage.ts`, Ingestion-JSON-Parses
`zod@3.24.1` ist Dependency, **kein einziger Import** im `src/`. Externe Eingaben laufen über
handgeschriebene Guards. **Fix-Spec:** Zod-`safeParse()`-Schemas für die echten Vertrauensgrenzen —
`localStorage` (§ T.3), JSON-Parse in `ingestion/state.ts`/`llm/cache.ts`/`v2/ssot/load-roster.ts`,
Ask-Profile. Nicht flächendeckend, nur an den Grenzen. Begründung: ein installiertes, ungenutztes
Validierungs-Tool ist Wartungslast ohne Nutzen; die Guards sind dupliziert (TS-09). Bündeln mit T.1/T.3.

### T.3 · `localStorage`-Daten ohne Schema-Validierung — **S1 / M**
`src/lib/galaxy/storage.ts:45-54,73-89`
`storage.ts` liest Tweaks aus `localStorage` mit Property-Checks + `as Partial<Tweaks>`, aber ohne
Struktur-Validierung. Bei manipuliertem `localStorage` (z. B. via XSS-Folgefehler) → Type-Confusion.
**Fix-Spec:** Zod-Schema für `Tweaks` mit `.safeParse()`; bei Fehlschlag auf Defaults zurückfallen.
Referenz: BP „safeParse für localStorage/API-Response-Parsing".

### T.4 · `JSON.parse` ohne Intermediate-Guard in Ingestion-Pfaden — **S2 / S**
`src/lib/ingestion/state.ts:19`, `llm/cache.ts:87`, `v2/ssot/load-roster.ts:63`, `galaxy/data.ts:686`
Vier Stellen parsen JSON und casten direkt zum Zieltyp. Bei korrupter Datei: stiller Type-Lie.
**Fix-Spec:** `safeJsonParse<T>(raw, guard)`-Helper (try/catch + Validierung) oder Zod. Reine Ingestion-/
Tooling-Fläche, daher S2.

### T.5 · Redundante/duplizierte Type-Guards (kalibriert: gut, aber doppelt) — **S3 / S–M**
`atlas/queries.ts:453` + `buecher/page.tsx:338` (`as unknown as string` für `updatedAt`),
`ingestion/podcast/manifest.ts:150-169`, `ask/params.ts` vs. `ask/curation.ts`
Doppel-Casts und wiederholte Guard-Muster. **Fix-Spec:** `isDateLike()`-Predicate; Ask-Guards in
gemeinsame `ask/validators.ts`; `parsePgTextArray`-Muster (das vorbildlich typsicher ist,
`queries.ts:86-121`) als Vorlage für `parsePgNumeric`/`parsePgBoolean`. Niedrigprior, Hygiene.

### R.1 · `setTimeout` ohne Cleanup (setState-after-unmount) — **S1 / M**
`src/components/map/context.tsx:554-567` (`dive`/`surface`, useCallback), `map/GalaxyHologram.tsx:145-156`
(`captureAddModeClick`, plain function)
Beide starten Timeouts ohne Cleanup; feuert nach Unmount ein `setState` → React-Warning + potenzieller
State-Leak. **Fix-Spec:** Timeout-Handle in `useRef` speichern, in `useEffect`-Cleanup `clearTimeout`;
oder `AbortController`. Referenz: React-Effect-Cleanup.

### R.2 · Stale-Ref-Closure in `CinematicView.goTo` — **S2 / S**
`src/components/timeline/cinematic/CinematicView.tsx:273-280`
`goTo` hat `deps:[]`, liest aber `reducedRef.current` — die Closure altert nie, wenn sich `reduced` ändert.
**Fix-Spec:** `reducedRef` synchron via `useLayoutEffect` aktualisieren oder in die Deps aufnehmen.
(Daneben R.3, `renderCine`-Dep `[N, era.events]` redundant da `N === era.events.length` — S3, kosmetisch.)

### D.1 · Toter Komponenten-/Modul-Code (verifiziert per Import-Grep) — **S2 / S–M**
| Kandidat | Beleg | |
|---|---|---|
| `components/timeline/DetailPanel.tsx` (~401 Z.) | 0 Produkt-Importe; durch ChronicleStage ersetzt | löschen |
| `components/Aquila.tsx` (~50 Z.) | 0 Importe | löschen |
| `lib/chronicle/roster.ts` (~323 Z., 6 Exports) | 0 Importe; Pre-138-Relikt | löschen |
**Caveat (carried-over 141):** `FilterRail.tsx` + die CSS-Partials `20-timeline-shell`/`22-filter-rail`
wurden im Vorgänger-Review als toter Code geführt, sind aber laut Projektgedächtnis **bewusst dormant**
(PR #117) — und die Verifikation hat die zwei CSS-Partials hier als „bereits aufgeräumt/dormant"
**widerlegt** (§ Widerlegte Findings T4-01/02). Also: die drei TS-Dateien oben gefahrlos löschen,
FilterRail-Dormanz bleibt Philipps Entscheidung.

### D.2 · Fehlklassifizierte Dependencies — **S2 / S**
`package.json:71-73`
`@supabase/supabase-js` ist deklariert, aber **nirgends importiert** (die App nutzt postgres.js+Drizzle
direkt) → tote Runtime-Dependency, entfernen. `cheerio` + `fast-xml-parser` werden **ausschließlich** in
`lib/ingestion/*` (Build-Scripts) genutzt → in `devDependencies` verschieben (schlankeres Prod-Install,
kleinere Angriffsfläche). **Fix-Spec:** `npm uninstall @supabase/supabase-js`; `cheerio`/`fast-xml-parser`
von `dependencies` nach `devDependencies` umhängen. Mit T.6/Dep-Sweep bündeln.

### C.1 · CSS-Token-Duplikation als Wartungsdefekt (NICHT als Farbkritik) — **S2 / M**
`src/app/styles/00-tokens.css` + 13+ Partials
`rgba(2,3,10,…)` (Void) wird mit **16 Opacity-Varianten / 44 eindeutige Hardcodes** über 13+ Dateien
hartkodiert; `rgba(156,230,255,…)` (Cyan) mit 14 Opacities über mehrere Dateien — obwohl Tokens
(`--cl-cyan`, `--cl-cyan-dim`, …) existieren. **Rein als Wartungslast:** eine Farbänderung erfordert
einen Mehrdatei-Sweep. **Fix-Spec:** Opacity-Stufen als diskrete CSS-Variablen tokenisieren bzw.
`color-mix(in oklch, var(--token) X%)` nutzen; Hardcodes ersetzen. **Kein Design-Urteil** — die Werte
bleiben identisch, nur ihre Quelle wird zentral. (C.2: `67-chronicle-cinematic.css:23-32` redefiniert
`--parchment`/`--gold` lokal — auf globale Tokens migrieren oder als bewusst dokumentieren, S3.)

### C.3 · `outline`-Regeln trotz globaler `!important`-Regel — **S3 / M**
`src/app/styles/10-base.css:54-64`
`outline: none !important` global (begründet kommentiert), aber 50+ `outline`-Regeln leben noch in
Partials. **Fix-Spec:** bei der nächsten Partial-Berührung die toten `outline`-Regeln entfernen; nicht als
eigener Sweep nötig. Die 11 `!important` sind ansonsten je gerechtfertigt.

---

## Dimension S — Security & DB-Härtung

### S.1a · Timing-unsafer Passwort-Vergleich in `proxy.ts` — **S1 / S**
`src/proxy.ts:44-50`
`creds.pass === expectedPass` (und `creds.user === expectedUser`) sind nicht konstant-zeitig → theoretischer
Timing-Orakel-Pfad zum Passwort. **Fix-Spec:** `crypto.timingSafeEqual()` auf Buffer gleicher Länge (vorher
Längen-Check über einen konstanten Vergleich, da `timingSafeEqual` Längengleichheit verlangt). Edge-Runtime:
`crypto` ist in der Web-Crypto-Form verfügbar; alternativ HMAC-vergleich. Niedriges reales Risiko (ein
Passwort, HTTPS), aber Standard-Härtung.

### S.1b · Proxy strippt client-`x-atlas-admin` nicht → `/map`-Admin-UI spoofbar — **S2 / S** *(Orchestrator-verifiziert, neu)*
`src/proxy.ts:62-68`, `src/lib/atlas/auth.ts:7-9`, `src/app/map/page.tsx:20`
`getIsAdmin()` vertraut dem Request-Header `x-atlas-admin`. Der Proxy **setzt** ihn in den
authentifizierten Zweigen, **löscht aber einen vom Client mitgeschickten Header nie**. Auf der öffentlichen
`/map`-Route fällt der Proxy (prod, ohne Creds) auf `return NextResponse.next()` durch und reicht die
Original-Header unverändert weiter — ein Request mit `x-atlas-admin: 1` rendert `MapRoot
initialIsAdmin={true}`, also die Admin-Map-Hülle. **Blast Radius begrenzt:** die Map-Mutationen
persistieren **nicht** server-seitig (kein Server-Action / `db.insert|update|delete` in `components/map/**`
— selbst verifiziert); `/atlas` ist durch den 401-Zweig vor dem Render geschützt. Also: Admin-UI-Exposition
+ Export bereits öffentlicher Map-Daten, **kein DB-Write**. **Fix-Spec:** im Proxy **für jeden** Request
zuerst `forwarded.delete("x-atlas-admin")`, dann nur in den verifizierten Zweigen setzen — und den Header
auch auf nicht-gematchten Routen unmöglich machen (Matcher deckt nur `/atlas`+`/map`; ein gespoofter Header
auf anderen Routen erreicht `getIsAdmin()` nur, wenn die Route ihn liest — heute nur `/map`). Der
Vorgänger-Verifier hat das als „korrektes Design" abgetan; die Strip-Lücke ist der reale Defekt.

### S.2 · Keine Security-Header in `next.config.ts` — **S1 / S**
`next.config.ts:1-47`
Kein `headers()` → kein CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, X-Content-Type-
Options. **Fix-Spec:** `async headers()` in `next.config.ts` (plattform-portabler als `vercel.json`) mit:
`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy:
strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(),
browsing-topics=()`. HSTS setzt Vercel auf Prod-Domains automatisch (nicht doppeln). **CSP** ist der
größere Schritt: entweder statisch mit gehashten/`'self'`-Quellen, oder Nonce via `proxy.ts`+`crypto`
(kostet dynamisches Rendering — für eine überwiegend statische Site abzuwägen; SRI als statik-freundliche
Alternative). Referenzen: BP-SEC-002/004/005/006/007, CSP-Guide. **Reddit-Launch-relevant.**

### S.3 · `/audit` + `/ingest` ungegatet — **S1 / M** (carried-over 141-E.7, erweitert)
`src/proxy.ts:6-8`, `src/app/buch/[slug]/audit/page.tsx`, `src/app/ingest/page.tsx`
Beide stehen **nicht** im Matcher und haben kein `getIsAdmin()`-Gate. `/ingest` exponiert interne Ingest-
Logs + Roh-LLM-Payloads (empirisch: 200, 31 KB); `/buch/[slug]/audit` zeigt editierbare Provenance-Felder.
**Fix-Spec:** entweder `/ingest/:path*` + `/buch/:slug/audit` in den `proxy.ts`-Matcher aufnehmen, ODER in
beiden Page-Komponenten `if (!(await getIsAdmin())) notFound();` (defense-in-depth, wie `/atlas`-Pages es
bereits tun). Zusätzlich `robots: noindex` auf `/ingest` (heute fehlend). Empfehlung: **beides** (Matcher
für die harte Sperre, `notFound()` als Tiefe).

### S.4 · `/audit`-Provenance-Felder: editierbar? Persistenz prüfen — **S2 / S** (Teil von S.3)
Falls `/buch/[slug]/audit` Schreib-Aktionen hat, die hinter dem fehlenden Gate persistieren, steigt S.3 auf
S1/S0. Die Read-only-Review konnte keinen Server-Action-Write im Audit-Pfad bestätigen (analog `/map`), aber
**dieser Punkt gehört im Umsetzungs-Brief explizit verifiziert**, bevor das Gate als „nur UI-Exposition"
eingestuft wird.

### S.5 · `next@16.2.4` → 16.2.9 (HIGH-CVE-Sammlung) — **S1 / S**
`package.json:76`
HIGH-CVEs: GHSA-8h8q-6873-q5fj (DoS Server Components, fix 16.2.5), **GHSA-26hh-7cqf-hhc6 (Middleware/
Proxy-Bypass via Segment-Prefetch, fix 16.2.6 — hebelt potenziell das `proxy.ts`-Gating aus!)**,
GHSA-ffhc-5mcf-pf4q (XSS via CSP-nonce, fix 16.2.5), + 2 low cache-poisoning. **Fix-Spec:** `npm install
next@16.2.9 eslint-config-next@16.2.9`, exakt pinnen (CLAUDE.md-Version-Contract: CC wählt den Patch),
`next build` + Smoke-Test. **Kein Major, kein Breaking** — der billigste Sicherheitsgewinn des Reviews.

### S.6 · `/healthz` — Information Disclosure des DB-Fehlertexts — **S2 / S**
`src/app/healthz/route.ts:14-20`
Bis zu 200 Zeichen Roh-DB-Fehler werden ausgegeben → kann Pooler-Host/Port/Interna leaken. **Fix-Spec:**
generische Message (`"Database connectivity failed"`) nach außen, Detail nur server-seitig loggen.

### S.7 · `ATLAS_PASS`-Bypass-Logik dokumentieren/erzwingen — **S3 / S**
`src/proxy.ts:33-50`
Wenn `ATLAS_PASS` in Prod **nicht** gesetzt ist, läuft der `if (expectedPass)`-Pfad nie auf `ok=true` —
`/atlas` 401t korrekt, aber die Annahme „Pass ist immer gesetzt" ist nirgends erzwungen. **Fix-Spec:**
Fail-fast (throw beim Boot, wenn Prod && kein `ATLAS_PASS`) oder klare Deploy-Checkliste. Niedrigprior.

### S.8 · `format`/`faction`/`facet`-Filter ohne Enum-Whitelist — **S2 / S**
`src/app/archive/filters.ts:47-65`
`parseSort()` validiert gegen feste Enums, die parallelen `format`/`faction`/`facet` werden nur getrimmt.
**Kein Injection-Risiko** (in-memory-Filter, keine SQL-Berührung — von S2-Finder bestätigt), aber
Inkonsistenz + unbeschränkte Werte fließen in URL-Generierung. **Fix-Spec:** Validator-Funktionen analog
`parseSort` — `format` gegen `FORMAT_ORDER`, `faction`/`facet` gegen verfügbare IDs; unbekannt → `null`.

---

## Dimension P — Performance / Ladezeiten (empirisch belegt)

> **Pool-Caveat vorab:** Mehrere Finder schlugen „Pool-Size auf ~15 erhöhen" als Teil-Fix vor. **Das ist der
> falsche Hebel** — `src/db/client.ts:35-43` argumentiert ausführlich dagegen (höhere `max` übersubskribiert
> den Supabase-Pooler und vergrößert den Blast-Radius), und die Web-Recherche (Supabase BP-A4: 3–5 für
> serverless) bestätigt `max:5` als richtig. **Der Hebel ist Caching, nicht Pool-Größe.**

### P.1 · `/compendium` force-dynamic → 60–120 s Cold-Fill, verkeilt den Pool — **S1 / M**
`src/app/compendium/page.tsx:16-24`, `lib/db-cache.ts:30-36`
`export const dynamic = "force-dynamic"` + 5 Category-Builder gegen Pool max:5 → gemessen 60–120 s Cold-Fill,
der den **ganzen** Pool verkeilt (`/healthz` → 503). **Fix-Spec:** prüfen, ob ISR (`export const revalidate
= 3600`) statt `force-dynamic` möglich ist — die Daten ändern sich ~wöchentlich, also ja; die Category-Daten
über `cachedRead`/`use cache`+`cacheLife('hours')` cachen; `loading.tsx` mit `CogitatorLoading` als
Suspense-Fallback (§ P.5). **Nicht** den Pool erhöhen. Referenz: BP-A1/B1, Next-Caching-Guide.

### P.2 · `/archive` ungecacht, 16,45 MB Payload, 6× parallel = Stau — **S1 / M**
`src/app/archive/page.tsx:34-80`, `src/app/archive/loader.ts:54-105`
Liest `searchParams` (→ dynamic), ruft `loadBrowseBooks()` **ohne** `cachedRead`-Wrapper. Empirisch: 16,45
MB HTML/Request, 6 parallel = alle Timeout. **Fix-Spec:** (a) `loadBrowseBooks()` in `cachedRead` wrappen
**und** die Payload schlanken — der explizite `columns`-Filter selektiert `synopsis` (Text-Feld) mit;
`synopsis` rausnehmen bzw. truncaten (§ DB.3), das adressiert beide Probleme; (b)
`export const revalidate = 3600`. **Caveat (carried-over 141-D.1):** 16,45 MB nähert sich dem 2-MB-Data-
Cache-Limit von Next — daher **erst Payload schlanken, dann cachen** (sonst überschreitet der Cache-Eintrag
das Limit und wird verworfen). Referenz: BP-A2 (use cache ohne Runtime-APIs), Drizzle RQB.

### P.3 · `/ask` lädt alle Bücher pro Antwort — **S2 / S (Ein-Zeilen-Fix)**
`src/app/ask/page.tsx:54`, `src/lib/ask/recommend.ts:56,300-304` (carried-over 141-D.3)
`recommend()` hat eine `cacheBooks?: boolean`-Option (+ Cache existiert bereits), wird aber ohne sie
aufgerufen → jede Antwort lädt die Bücher neu. **Fix-Spec:** `recommend(answers, { limit: 5, onError:
'throw', cacheBooks: true })`. Ein Wort.

### P.4 · `/buch/[slug]` ohne SSG/ISR — **S1 / L**
`src/app/buch/[slug]/page.tsx:1-41` (carried-over 141-D.2)
Kein `generateStaticParams`, kein `revalidate` → pro Request DB; gemessen 0,21 s warm → 90 s unter Last.
Die Entity-Routen (charakter/fraktion/welt/person) haben `generateStaticParams` + `dynamicParams`. **Fix-
Spec:** `generateStaticParams()` für die Top-N (~200) Bücher + `dynamicParams: true` (Rest on-demand,
analog Entity-Routen); `loadBook()` in `cachedRead`. **Caveat (carried-over 141-D.2):** eine
`listBookSlugs()`-Query existiert noch nicht — kleine neue Query nötig (`listEntityIds()` kennt kein
`book`). Effort L wegen Build-Last-Abwägung (889 Bücher; Top-N statt alle, sonst Build-Timeout-Risiko § B.2).

### P.5 · `loading.tsx` fehlt auf 32 von 33 Routen — **S2 / M** (carried-over 141-B3)
nur `src/app/archive/loading.tsx` existiert
Die gemessenen Cold-Fills (compendium 60–120 s, buch bis 90 s) treffen auf **leere Screens** bis der
Server-Render endet. **Fix-Spec:** `loading.tsx` für `/compendium`, `/ask`, `/buch/[slug]`, `/timeline`,
`/map`, `/buecher`, `/fraktionen` — `CogitatorLoading` (existiert, `65-loading.css`) wiederverwenden.
Kleiner, hochwirksamer UX-Fix. Referenz: BP-D2 (echter Suspense-Fallback).

### P.6 · Keine `revalidateTag`-Integration nach Apply-Läufen — **S2 / M** (carried-over 140)
`src/lib/db-cache.ts:86-101`
Grep über `src/`: **0 Zeilen** `revalidateTag()`. Loader nutzen Tags, aber keine Route invalidiert sie nach
einem Daten-Apply → nach Ingestion bleibt der alte Cache bis TTL-Ablauf. **Fix-Spec:** nach Ingestion-/
Apply-Läufen (oder via Webhook/Route-Handler) `revalidateTag('compendium')`, `revalidateTag('factions')`
etc.; passt zur geplanten TTL-Erhöhung (300 s → länger). Referenz: BP-B2/B3/C1.

### P.7 · Metadata-Lücken — **S3 / S** (carried-over 141-B4)
`/` (Home), `/buch/[slug]` (kein `generateMetadata` → keine OG-Preview pro Buch), `/compendium/page.tsx`
(nur Layout-Metadata, Page erbt Root-Defaults). **Fix-Spec:** `generateMetadata()` auf die Top-Pageview-
Routen; Muster aus `compendium/[category]` kopieren. Reddit-Share-relevant (OG-Cards), daher trotz S3
launch-nah.

---

## Dimension DB — Schema / Indizes / Query-Form

### DB.1 · Fehlender Index auf `works.setting_anchor_event_id` — **S2 / S**
`src/db/schema.ts:263-265`
FK auf `events.id` ohne expliziten Index → Reverse-Lookups (Timeline-Chips „welche Werke verankern auf
Event X") auf Seq-Scan. **Fix-Spec:** `index('works_setting_anchor_event_idx').on(t.settingAnchorEventId)`
im Schema + generierte Migration committen. Referenz: Drizzle indexes.

### DB.2 · `event_works.workId` ohne Reverse-Lookup-Index — **S2 / S**
`src/db/schema.ts:775-810`
FK auf `works.id`; Queries „welche `event_works` für `work_id=X`" brauchen Single-Column-Index. **Fix-Spec:**
`index('event_works_work_idx').on(t.workId)`. (Falls ein Composite-Index mit führendem `workId` existiert,
entfällt es — im Brief prüfen.)

### DB.3 · `loadBrowseBooks` selektiert `synopsis` mit — **S2 / S**
`src/app/archive/loader.ts:54-105`
Der `columns`-Filter von `db.query.works.findMany` ist explizit, führt aber das `synopsis`-Text-Feld mit →
Haupttreiber der 16,45-MB-`/archive`-Payload (§ P.2). **Fix-Spec:** `synopsis` aus dem `columns`-Filter
nehmen bzw. auf 200–300 Zeichen truncaten. **Direkter Hebel gegen P.2.**

### DB.4 · Compendium-Primarch-Kaskade — 72 Queries, Pool-Erschöpfung — **S1 / M**
`src/lib/compendium/loader.ts:148-192`, `src/lib/entity/loader.ts:146-185`
`loadPrimarchItems` ruft `loadEntity("character", id)` **sequenziell** in einer Schleife über ~18 Primarchs
(18 × 4 = bis 72 Queries) → erschöpft Pool max:5 und blockiert Geschwister-Routen (`/healthz`). Mitursache
des `/compendium/[category]`-Timeouts. **Fix-Spec:** `Promise.all()` um die Primarch-Loads (die `cache()`-
Dedup gilt per-Request) ODER die Merge-Work-Counts in einer einzigen Batch-Query vorberechnen / beim Ingest
materialisieren. Referenz: Drizzle RQB, BP-B2.

### DB.5 · Unbegrenzte Junction-Traversierung in Entity-Loadern — **S2 / M** (carried-over 140-A3)
`src/lib/entity/loader.ts:240-257,306-318,398-410,475-490` (loadCharacter/Faction/Location/Person)
Junction-Queries ohne `LIMIT` → eine Entity mit N Work-Links triggert unbeschränkte Rows. Inkonsistent:
`keyCharacters` ist auf `CROSSLINK_CAP (40)` gedeckelt, die Children-Query daneben (`loadFaction:319-323`)
**nicht**. **Fix-Spec:** `.limit(CROSSLINK_CAP)` bzw. `.limit(500)` auf alle Sibling/Child/Junction-Queries;
Cap im Loader-Kommentar dokumentieren (Brief-109-Update). Heute kein Problem (kleine Datenmengen), aber
Radar für 5×-Wachstum.

### DB.6 · `getWerkeRows` lädt Collection-Relationen ohne `LIMIT` — **S2 / M**
`src/lib/atlas/queries.ts:333-348`
`containedIn`/`contains` ohne `LIMIT` → ein Buch in hunderten Collections inflationiert das Row-Set.
Admin-Atlas-Fläche, daher S2. **Fix-Spec:** `.limit(500)` auf beide Queries + „+N more"-Anzeige.

### DB.7 · `postgres.js`-Config — verifiziert korrekt — **kein Defekt**
`src/db/client.ts:32-60` · `prepare:false` ✓ (Transaction-Pooler-Pflicht), `connect_timeout:10` ✓,
`max:5` ✓ (Supabase-BP 3–5). **Bestätigt als state-of-the-art** — nicht anrühren. Einzige optionale
Feinjustierung: `idle_timeout` 20 s → die Supabase-Serverless-BP nennt 2 s; aber 20 s ist für die
1-Prozess-Topologie hier vertretbar (warme Wiederverwendung im Burst). Keine Aktion nötig.

---

## Dimension R — Resilienz & Plattform / Build

### R.4 · Kein Root `error.tsx` / `global-error.tsx` — **S1 / S** (carried-over 141-E.2)
`src/app/`
DB-Störung oder unerwarteter Server-Fehler ⇒ Next-Default-Fehlerseite (Immersionsbruch). **Fix-Spec:**
`src/app/error.tsx` (Client-Component, Reset-Button) + `src/app/global-error.tsx` (fängt Layout-Fehler) im
Haus-Stil, Tokens/Muster von `/lab/design`.

### R.5 · Kein Root `not-found.tsx` — **S2 / S** (carried-over 141-E.2)
`src/app/`
Tippfehler-URLs → Next-Default-404. **Fix-Spec:** `src/app/not-found.tsx` im Haus-Stil („ARCHIVE FRAGMENT
LOST").

### R.6 · `/compendium/layout.tsx` lädt ohne try/catch — **S2 / S**
`src/app/compendium/layout.tsx:44`
`loadCompendiumCounts()` ohne Fallback → ein Fehler reißt das ganze Compendium-Layout (alle Kinder) ab.
**Fix-Spec:** try/catch mit Fallback-Counts (0/leer) oder Error-Boundary auf Layout-Ebene.

### B.1 · `vercel-build` koppelt Migration an jeden Deploy — **S1 / M**
`package.json:9`
`vercel-build = "tsx scripts/migrate.ts && next build"` → **jeder Deploy migriert die Prod-DB**; eine
fehlerhafte Migration bricht den Deploy ab (und kann die DB in Zwischenzustand lassen). **Fix-Spec:**
Migration aus dem Build-Step lösen — separater, manuell/CI-getriggerter Migrations-Schritt (`npm run
db:migrate` in einem GitHub-Action-Step mit Approval, ODER Pre-Deploy-Hook), `vercel-build` nur noch
`next build`. Begründung: Build-Reproduzierbarkeit + DB-Migration sind unterschiedliche Risikoklassen.

### B.2 · CI nur `on: pull_request` → Direct-to-main ohne Checks — **S1 / S**
`.github/workflows/ci.yml`, CLAUDE.md §Git
Doc-only-Commits gehen direkt auf `main` (Policy), laufen aber durch **keine** CI — und das ist genau der
Pfad, auf dem auch dieser Report landet. CLAUDE.md verlangt deshalb lokales `brain:lint`. **Fix-Spec:**
`on: { pull_request: {}, push: { branches: [main] } }` in `ci.yml` (selbst ein Code-PR). Schließt die
dokumentierte CI-Lücke; `lint`/`typecheck`/`brain:lint` laufen dann auch auf Direct-to-main.

### B.3 · `staticPageGenerationTimeout:180` knapp (nicht gerissen) — **S2 / S** *(adjusted)*
`next.config.ts:10`
**Korrektur zum Erst-Eindruck:** der Build-Log-Retry auf `/person/dan_abnett` war transient — die Seite ist
prerendert, der Build erfolgreich. Die 180-s-Deadline bleibt aber knapp (ein Author mit vielen Werken +
15-Worker-Pool-Contention gegen `max:5`). **Fix-Spec:** Timeout auf 300–600 s anheben (billig, kauft
Headroom) ODER die Entity-Build-Last serialisieren (s. § DB.4 / Build-Zeit-Cache). Niedriges aktuelles
Risiko, Radar für Daten-Wachstum.

### B.4 · `noUncheckedIndexedAccess` fehlt — **kein Defekt (widerlegt)**
Der Finder schlug es als S2 vor; der Verifier hat es **widerlegt** (kein Defekt — 177 Index-Zugriffe wären
betroffen, der Flag ist eine bewusste, aufwändige Härtung, kein Versäumnis). Als optionale, große TS-
Härtung notiert, **nicht** als Finding geführt.

---

## Dimension A — Resilienz/Boundary & Ingestion (Nachzügler-Block)

### A.1 · Kein `server-only`-Guard auf Server-exklusiven Modulen — **S2 / S**
`src/lib/ingestion/types.ts`, `src/app/*/loader.ts`, `src/lib/*/loader.ts` (nur `lib/blurbs/index.ts` und `lib/store-region.ts` haben ihn)
Die Boundary ist **heute sauber** (Audit der 90 `"use client"`-Dateien: **kein** `@/db`-Import in Client-
Code — A.2/GAP1-03 bestätigt „sauber"), aber ungeschützt: ein künftiger versehentlicher Client-Import eines
Loaders würde erst zur Laufzeit/im Bundle auffallen. **Fix-Spec:** `import "server-only";` an den Kopf der
Server-only-Loader/Module — erzeugt einen Build-Time-Fehler bei Client-Import. Billige Regressions-Bremse.

### A.2 · Kein ESLint-Guard gegen Boundary-Verletzungen — **S2 / S**
`eslint.config.mjs`
Keine Lint-Regel gegen versehentliche Server-Code-Leaks in Client-Komponenten. **Fix-Spec:**
`server-only`-Guards (A.1) sind der robustere, dependency-freie Weg; ein ESLint-Plugin ist optional dazu.
Empfehlung: A.1 umsetzen, ESLint-Plugin nur, wenn das Team mehr Automatik will.

### A.3 · Build-Zeit-Entity-SSG-Contention gegen Pool max:5 — **S2 / M**
`src/app/{person,charakter}/[slug]/page.tsx`, `src/lib/entity/loader.ts`
Faction/Entity-Pages laden 4 parallele Queries pro Entity; 15 Build-Worker × 4 gegen Pool max:5 = Burst-
Contention (die plausible Ursache des `dan_abnett`-Retry, § B.3). **Fix-Spec:** Build-Zeit-Entity-Load über
die Worker serialisieren (z. B. `generateStaticParams` mit `mapLimit` concurrency 2–3) oder Merge-Counts
vorberechnen. Mit § DB.4 verwandt.

### A.4 · Ingestion-Effizienz (kein Runtime-Risiko) — **S2/S3 / S–L**
`src/lib/ingestion/diff-reader.ts:81-115` (sequenzielle `for`-Schleife statt `Promise.all` über Diff-
Dateien — IO-bound, 5–10× langsamer bei 50+ Dateien, S3); `src/lib/ingestion/v2/run-batch.ts:230-257` +
`run-engine.ts:237` (Bücher + die 3 Source-Fetches sequenziell — bewusster Resilience-Tradeoff wegen
per-Buch-Checkpoints, S2/L). **Fix-Spec:** Diff-Reader auf `Promise.all`-Batch-Read; Ingestion optional
`p-limit`/`p-queue` concurrency 5 **mit** Checkpoint-Abwägung. Reine Tooling-Geschwindigkeit, nicht
launch-kritisch — als Notiz für die Batches-Strang-Sessions.

### A.5 · `diff-reader`-Validierung oberflächlich — **S3 / M**
`src/lib/ingestion/diff-reader.ts:58-70`
`isDiffFileLike()` prüft nur Top-Level-Array-Typen, nicht die Element-Struktur. **Fix-Spec:** Sample-Check
oder Zod-Schema (passt zu § T.2). `loadDiffById()` (`:152-171`) ist dagegen **vorbildlich** — `runId` via
`/^[a-zA-Z0-9._-]+$/` gegen Path-Traversal geschützt (verifiziert sauber, kein Fix).

---

## Widerlegte Findings (14) — was der adversariale Filter aussortiert hat

Als Kalibrierhilfe, nach Todesursache:

- **Bereits gefixt / sauber (6):** `22-filter-rail.css` + `20-timeline-shell.css` als „Dead CSS" (dormant/
  aufgeräumt), `/map`-Admin-Signal-Forwarding (das *Forwarding* ist korrekt — der reale Defekt ist die
  fehlende Header-*Strippung*, separat als § S.1b geführt), `/person/[slug]`-Prerender-„blockiert Build"
  (Seite ist prerendert, Retry transient), `loadDiffById`-runId-Validierung (defensiv korrekt).
- **Haus-Stil / Policy-Konformität (5):** `@import`-Reihenfolge in `globals.css` (bewusst), Pinning-
  Strategie „gegen CLAUDE.md" (entspricht der Policy: CC pinnt), Outdated-Minor/Patch als „Defekt" (das ist
  normale Wartung, kein Defekt), `engines.node >=22` als „Vercel-Risiko" (passt zu Vercel-Node-22+),
  postcss-Lock-Drift (Patch-Range, kein Defekt).
- **Falsche Stelle (2):** Non-Null-Assertion im Timeline-Loader ohne Guard (Guard existiert),
  `SourceName`-Type-Assertion ohne Validator (validiert an anderer Stelle).
- **Kein Defekt (1):** `noUncheckedIndexedAccess` fehlt (bewusste, große Härtung — Option, kein Versäumnis;
  s. § B.4).

**Unverifizierbar → Hypothese (1):** `READ_CACHE_TTL=300 s` passe nicht zur ~wöchentlichen Datenänderung
(`db-cache.ts:36`). Plausibel und deckungsgleich mit Brief 140, aber ohne Produktionsmetrik nicht hart
belegbar — als Hypothese in die Caching-Welle (§ Brief-Kandidaten) mitnehmen: TTL 300 s → 3600 s+, gekoppelt
an `revalidateTag` (§ P.6).

---

## Grenzen / Ungeprüftes

- **Kein Browser, keine Screenshots, kein Produktionstest** (Auftrag): alles aus Code-Lektüre + lokaler
  `next start`-Probe. Visuelle Wirkung außerhalb des Mandats.
- **Lokal ≠ Vercel-Topologie:** 1 Prozess / 1 Pool vs. N Lambdas gegen den Supabase-Pooler. Die Richtung der
  Performance-Befunde ist belastbar, die absoluten Sekundenzahlen nicht. Kein Lasttest gegen Produktion.
- **1× `next build`** = ein deploy-äquivalenter Pooler-Lastpunkt (~1100 Seiten prerendert), bewusst nur
  einmal gefahren.
- **`/audit`- und `/map`-Schreibpfade:** die Read-only-Review fand keine persistierenden Server-Actions,
  konnte aber Schreibpersistenz nicht **negativ** beweisen — der Umsetzungs-Brief (§ S.3/S.4) muss das
  explizit verifizieren, bevor die Gates als „nur UI-Exposition" eingestuft werden.
- **Zwei Agent-Ausfälle** im Workflow (A1-A11y-Finder + ein Nachzügler-Verifier) auf StructuredOutput-Miss
  → die A11y-Dimension ist **dünn abgedeckt**; die 141er-A11y-Befunde (reduced-motion-Inventar, steel-dim-
  Kontrast ~3.1:1, `inert` am DetailModal) bleiben gültig und gehören in den A11y-Pass (kein Widerspruch
  gefunden, aber hier nicht re-verifiziert).
- **Betriebsnotiz:** drei gestrandete Dev-Server-Prozesse vor der Probe gekillt, `.next` frisch, ein
  `next start`-Prozess; nach der Probe sauber beendet (Port 3000 frei). Working-Tree unverändert.

---

## Brief-Kandidaten (Security bewusst zuletzt — Modell-Switch)

> **⚠ Reihenfolge — Security wird EXPLIZIT zuletzt angefasst, nicht zuerst.** Erst alle nicht-Security-
> Wellen (1–7), dann die Security-Härtung (8) als isolierter Schlussblock. Grund: sobald eine Session
> substanzielle Security-Analyse anfasst (Auth, Header-Spoof, CVE-Pfade), greift Fable 5's Dual-Use-Safety-
> Layer und der Harness switcht **automatisch auf Opus** — in dieser Session beim Übergang in die Security-
> Phase passiert und danach ~1 h „sticky" geblieben (deckte den ganzen Review-Workflow). Mittendrin
> angefasst liefe potenziell der gesamte Rest auf Opus statt Fable 5; ans Ende gelegt bleibt der Fallback
> auf den Schlussblock begrenzt.
>
> **Bei bemerktem Modell-Switch: anhalten.** Fällt während der Arbeit ein Wechsel auf Opus auf (Fallback-
> Notiz im Verlauf), **nicht stillschweigend weiterlaufen** — die Session pausieren und gemeinsam mit
> Philipp prüfen, ob sich der aktuelle Punkt mit Fable 5 umgehen/umformulieren lässt, bevor es weitergeht.

1. **Caching-/Rendering-Welle (§ P.1–P.7, DB.3, Hypothese TTL):** ISR auf `/compendium`, `/archive`-Cache +
   Payload schlanken, `/buch/[slug]`-SSG, `cacheBooks:true`, `loading.tsx`-Abdeckung, `revalidateTag`,
   Metadata. **Der messbar größte Nutzwert für den Launch.** Code-PR. (Pool **nicht** anrühren.)
2. **DB-Index- & Query-Welle (§ DB.1/DB.2/DB.4/DB.5/DB.6):** Indizes (Migration = Code-PR, committen),
   Primarch-Kaskade entstauen, Junction-`LIMIT`s. Verwandt mit Welle 1 (DB.3/DB.4 ↔ P.1/P.2).
3. **Dead-Code- + TS-Hygiene-Sweep (§ T.1–T.5, D.1, D.2):** tote TS-Dateien löschen, Dependencies
   umklassifizieren, `as unknown`-Wrapper, Zod an den Vertrauensgrenzen. FilterRail-Dormanz = Entscheidung.
4. **CSS-Hygiene-Sweep (§ C.1–C.3):** Token-Dedup (Wartung, kein Design), tote `outline`-Regeln. Niedrigprior.
5. **Resilienz + Build/CI (§ R.4/R.5/R.6/B.1/B.2/B.3, A.1/A.3):** Error-Boundaries, Migration vom Deploy
   entkoppeln, CI-Push-Trigger, `server-only`-Guards, Build-Contention. B.1/B.2 sind kleine, wichtige
   Plattform-Fixes.
6. **Ingestion-Effizienz (§ A.4/A.5):** Batches-Strang, kein Launch-Bezug — Notiz, kein Brief.
7. **A11y-Pass (nicht re-verifiziert, aus 141 übernommen):** reduced-motion-Inventar, steel-dim-Kontrast,
   `inert` — die A11y-Dimension fiel hier teilweise aus; 141er-Befunde gelten weiter.
8. **Security-Härtung (§ S.1a/S.1b/S.2/S.3/S.6/S.7/S.8) — bewusst ZULETZT (s. Reihenfolge-Hinweis oben):**
   Security-Header, `/audit`+`/ingest`-Gating (inkl. Schreibpfad-Verifikation), `x-atlas-admin`-Strip,
   timing-safe Vergleich, healthz-Disclosure, Filter-Whitelist. Reddit-Launch-kritisch. Code-PR. (§ S.5
   `next@16.2.9` + `npm audit`-Bereinigung separat bereits gelandet — PR #167.)
9. **Entscheidungen für Philipp (kein Brief, ein Nicken):** FilterRail-Dormanz beenden? CSP-Strategie
   (statisch/SRI vs. Nonce+dynamisch)? `/buecher`-Zukunft (141-E.6, unverlinkt/redundant)? TweaksPanel
   gaten (§ S.1b/141-A.6)?
