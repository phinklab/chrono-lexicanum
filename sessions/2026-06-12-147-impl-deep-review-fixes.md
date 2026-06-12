---
session: 2026-06-12-147
role: implementer
date: 2026-06-12
status: complete
slug: deep-review-fixes
parent: 2026-06-11-144
links: []
commits:
  - f3c4404 # Welle 1 — Caching/Rendering
  - 10896ab # Welle 2 — DB-Indizes & Query-Form
  - 17af04f # Welle 3 — Dead-Code + TS-Hygiene
  - 18498cd # Welle 4 — CSS-Hygiene
  - e639194 # Welle 5 — Resilienz + Build/CI
  - 3e026bc # Welle 7 — A11y-Pass
  - bc15566 # Welle 8 — Security-Härtung
---

# Deep-Review-Fixes — Umsetzung der Brief-Kandidaten aus Report 144

## Summary

Alle sieben Wellen der „Brief-Kandidaten" aus Report 144 sind umgesetzt (Welle 6/Ingestion bewusst
ausgelassen — Batches-Strang), als sieben einzeln revertierbare Commits auf
`codex/product-deep-review-fixes`. **Wichtigster Fakt für Cowork/Philipp:** Migration 0013 (zwei neue
Indizes) ist committet, aber **nicht angewendet** — und seit Welle 5 migriert der Vercel-Build nicht mehr
automatisch. Vor/nach dem Merge muss einmalig migriert werden (Details unter „Open issues").

Die Modell-Switch-Regel kam nie zum Tragen: Auch die Security-Welle 8 lief vollständig auf Fable 5,
kein Opus-Fallback im gesamten Verlauf.

## What I did

### Welle 1 — Caching/Rendering (P.1–P.7, DB.3) — `f3c4404`

- `src/lib/db-cache.ts` — `READ_CACHE_TTL` 300 s → 3600 s (P.1); Cold-Fill jetzt selten statt 12×/h.
- `src/app/api/revalidate/route.ts` (neu) — `POST` mit Bearer-Token (`REVALIDATE_TOKEN`):
  `revalidateTag(tag, "max")` über die Catalogue-Tags + Reset der In-Memory-Caches. Schließt die Lücke
  „1h-TTL ohne Invalidierung" für Apply-/Ingest-Läufe (P.6). Ohne gesetztes Token ist die Route 503.
- `src/app/archive/loader.ts` — Synopsis-Teaser 280 Zeichen (DB.3) gegen die 16,45-MB-Page-Payload;
  `loadBrowseBooks` hinter In-Process-Memory-Cache mit Promise-Koaleszierung (P.2).
  **Gemessene Blob-Größen:** 2,60 MB (voll) / 2,21 MB (Teaser) / 1,96 MB (testweise ganz ohne Synopsis) —
  selbst die nackte Variante liegt zu knapp unter dem **2-MB-Limit des Next Data Cache**, deshalb
  Memory-Cache statt `unstable_cache` (bewusste Abweichung von der Fix-Spec, die `unstable_cache` nahelegte).
- `src/lib/book/loadBook.ts` — per-Slug-`cachedRead` (P.4) + `generateMetadata` mit OG-Card auf
  `/buch/[slug]` (P.7). SSG für `/buch` bleibt blockiert durch `searchParams`+`headers()` aus Brief 105 —
  siehe „Decisions for Philipp".
- `/ask` — `recommend(..., cacheBooks: true)` (P.3).
- `/compendium` — ISR erneut geprüft und **verworfen** (Build-Contention + Risiko, degradiertes HTML 5 min
  zu cachen; als Kommentar im Code dokumentiert); Layout-Counts hinter Suspense, damit `loading.tsx` beim
  Cold-Fill greift.
- `loading.tsx` (CogitatorLoading) auf compendium, ask, buch/[slug], timeline, map, buecher, fraktionen (P.5).
- **P.7-Recheck:** Home wird von der Root-Layout-Metadata getragen, `/compendium` von der Layout-Metadata —
  wirklich fehlend war nur `/buch/[slug]`; eine eigene Home-OG-Card bleibt optionales Polish.

### Welle 2 — DB-Indizes & Query-Form (DB.1, DB.2, DB.4, DB.5) — `10896ab`

- `src/db/schema.ts` + Migration `0013` — `works_setting_anchor_event_idx` (DB.1) und
  `event_works_work_idx` (DB.2; der Unique-Index führt mit `event_id` und trägt den Reverse-Lookup nicht).
  Rein additiv (`CREATE INDEX`), App funktioniert auch ohne. **Nicht angewendet**, siehe unten.
- `src/lib/compendium/loader.ts` — `loadPrimarchItems`: `Promise.all` statt sequenzieller Schleife (DB.4).
  **Korrektur am Report-Framing:** die Schleife erschöpfte den Pool nicht (max. 4 parallele Queries pro
  Load gegen `max:5`) — der reale Defekt ist die linear mit der Primarch-Zahl skalierende Latenz
  (~18 sequenzielle Query-Wellen). Die `cache()`-Dedup bleibt per-Request wirksam.
- `src/lib/entity/loader.ts` — `WORK_LIST_CAP` (500) auf alle Reverse-Junction-Work-Queries,
  `CROSSLINK_CAP` auf die Subfaction-Children-Query (DB.5; Growth-Guard, bindet heute nie).
- **DB.6 geprüft und NICHT umgesetzt:** `getWerkeRows` batcht containedIn/contains bereits über alle
  Buch-IDs (2 Queries gesamt); ein LIMIT würde Audit-Daten der Admin-Fläche still verwerfen.

### Welle 3 — Dead-Code + TS-Hygiene (T.1–T.5, D.1, D.2) — `17af04f`

- Dead-Code gelöscht (D.1, 0-Import-verifiziert): `timeline/DetailPanel.tsx`, `Aquila.tsx`,
  `lib/chronicle/roster.ts` (~774 Zeilen). **FilterRail bleibt bewusst dormant** (PR-#117-Entscheid).
- Dependencies (D.2): `@supabase/supabase-js` entfernt (0 Imports); `cheerio` + `fast-xml-parser` nach
  `devDependencies` (nur Ingestion/Scripts nutzen sie).
- `src/lib/atlas/queries.ts` (T.1) — `validateSqlResult()` prüft die Row-Array-Shape zur Laufzeit, ersetzt
  alle 11 `as unknown as`-Blind-Casts; wirft laut in die bestehenden try/catch-Degradationspfade.
- `coerceDate()`-Helper (T.5) ersetzt die `updatedAt`-Doppelcasts (atlas/queries.ts, buecher/page.tsx).
- `src/lib/galaxy/storage.ts` (T.3) — Zod-`safeParse` für Tweaks + GalaxyData an der
  localStorage-Vertrauensgrenze, per-Layer-Fallback; `galaxy/data.ts` `deepClone` → `structuredClone` (T.4).

### Welle 4 — CSS-Hygiene (C.1–C.3) — `18498cd`

- C.1: Void-/Cyan-Hardcodes in 18 Partials wertidentisch auf Tokens/`color-mix` umgestellt (98 Zeilen,
  reine Quell-Zentralisierung, keine sichtbare Änderung). `00-tokens.css` + Lab-Beispiele unangetastet.
- C.2: lokale `.chron`-Palette (67) als bewusster Brief-138-Prototyp-Port dokumentiert — Migration auf
  globale Tokens wäre eine Designänderung.
- C.3: kein eigener Sweep — 10-base.css trägt bereits die remove-on-touch-Policy für tote outline-Regeln.

### Welle 5 — Resilienz + Build/CI (R.4–R.6, B.1–B.3, A.1, A.3) — `e639194`

- R.4/R.5: Root-`error.tsx`, `global-error.tsx` (self-contained, inline-styled — ersetzt das Root-Layout
  und darf nicht an globals.css hängen) und `not-found.tsx` („ARCHIVE FRAGMENT LOST") im Haus-Stil; neue
  Partial `src/app/styles/69-system-pages.css`.
- R.6: `NavWithCounts` try/catch — die Compendium-Counts sind Dekoration; ohne Catch risse ein
  DB-Fehler im Suspense-Island die ganze Route in die Error-Boundary.
- B.1: **Migration vom Deploy entkoppelt** — `vercel-build` = nur `next build`; Migrationen laufen über
  den neuen manuellen GitHub-Actions-Workflow `.github/workflows/migrate.yml` (`workflow_dispatch`) oder
  lokal `npm run db:migrate`. Risikoklassen getrennt: ein Preview-Build kann nicht mehr nebenbei die
  Prod-DB migrieren.
- B.2: `ci.yml` läuft jetzt auch `on: push: branches: [main]` — Direct-to-main-Doc-Commits werden geprüft
  (Lücke aus der PR-Policy zu).
- B.3: `staticPageGenerationTimeout` 180 → 300 s.
- A.3: `experimental.staticGenerationMaxConcurrency` 8 → 3 — der richtige Hebel statt des im Report
  vorgeschlagenen `mapLimit` um `generateStaticParams` (Params-Generierung ist nicht das Rendering;
  Default 8 in `config-shared.js` verifiziert). Hält den Per-Prozess-Query-Burst nahe der Pool-Größe.
- A.1: `import "server-only"` auf den 5 DB-Loadern + `loadBook` + `db-cache`. **Bewusst ausgenommen:**
  `src/db/client.ts` und `src/lib/ask/recommend.ts` — beide sind von tsx-Scripts erreichbar, und
  `server-only` wirft unter plain node/tsx (der Bundler-Alias existiert nur unter Next).

### Welle 6 — Ingestion: übersprungen (Batches-Strang)

A.4 (Retry/Backoff), die T.4-Reststellen (`ingestion/state.ts`, `llm/cache.ts`, `load-roster.ts`) und A.5
liegen unter `src/lib/ingestion/**` bzw. `scripts/**` — Batches-Pfade, hier nicht angefasst.

### Welle 7 — A11y-Pass (Report 141 § B5) — `3e026bc`

- Reduced-Motion: globaler 0.001-ms-Clamp **behalten** (pauschales `animation: none` würde
  fill-mode-Entrance-Animationen mit Basis `opacity: 0` unsichtbar enden lassen — bewusste Abweichung von
  der Report-Spec), dazu gezielte `animation: none`-Gates für die Endlos-Ambienz: Ken Burns/scroll-hint/
  caret (67), Auspex-Drifts + Descent-Chevrons (50, Chevrons statisch auf `opacity: .7`), Holo-Flicker
  (55, auf `opacity: 0` wie der `data-anims="off"`-Zustand) + `.chrono-ambient`-Klasse für die vier
  Inline-Animation-Komponenten (ScanLine, FloatingCoord, WordField, LetterField — bleiben Server
  Components) mit Gate in 10-base.
- Kontrast: `--steel-dim` #566070 (~3,1:1) → #758ba3 (~5,9:1, AA) in 67 inkl. `ce-kicker`-Literal — trägt
  dort echten Text (Entry-Counts, Zirka-Daten, Art-Credits).
- `DetailModal` — Seite hinter dem offenen Dialog jetzt `inert` (SiteMenu-Muster; `aria-modal` behauptet
  Unerreichbarkeit nur, `inert` erzwingt sie). Release **vor** dem Fokus-Restore (Fokus in inertem
  Subtree wäre ein silent No-op); bereits-inerte Siblings werden übersprungen.
- `ProcessingPanel` — `aria-busy="true"` an der `role="status"`-Region.

### Welle 8 — Security-Härtung (Dimension S) — `bc15566`

- S.1a: `src/lib/timingSafeEqual.ts` (neu) — konstant-zeitiger String-Vergleich via SHA-256-Digest +
  XOR-Fold (Web Crypto, läuft in Proxy- und Node-Runtime gleichermaßen; Hash allein genügt nicht — ein
  leckender Digest-Vergleich ließe sich byteweise erlernen). Eingesetzt für Basic-Auth-User+Pass im Proxy
  (beide Vergleiche laufen immer, kein Short-Circuit) und den `/api/revalidate`-Bearer-Token.
- S.1b: Proxy strippt `x-atlas-admin` jetzt aus **jedem** Request, bevor verifizierte Zweige ihn setzen;
  auch der Fall-through forwardet die bereinigten Header. Vorher rendert `x-atlas-admin: 1` vom Client
  die Admin-Map-Hülle auf `/map`.
- S.2: `headers()` in `next.config.ts` — `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/microphone/geolocation/
  browsing-topics aus). Kein HSTS (setzt Vercel; nicht doppeln). **CSP = Philipp-Entscheid**, s. u.
- S.3: `/ingest` + `/buch/[slug]/audit` im Proxy hart ge-401t wie `/atlas` (`isAdminPath()`), zusätzlich
  `if (!(await getIsAdmin())) notFound()` in allen drei Pages (Defense-in-Depth) und `robots: noindex` auf
  beiden Ingest-Seiten. `/ingest`-Routen werden dadurch request-gerendert (vorher SSG) — für Admin-Seiten
  korrekt; das `generateStaticParams` auf `[runId]` bleibt stehen und bailt sauber.
- S.4 **verifiziert**: kein Schreibpfad — `db.insert|update|delete` kommt in `src/` nicht vor,
  `db.execute` nur in healthz (`select 1`) + Atlas-SELECTs, einzige Server Action ist der Login. Die
  Audit-Seite ist reines `db.select`. S.3 bleibt damit „UI-Exposition", keine Eskalation auf S0.
- S.5 war bereits erledigt (next 16.2.9, PR #167).
- S.6: `/healthz` antwortet generisch („Database connectivity failed"), das Roh-Detail (Pooler-Host/Port)
  geht nur noch ins Server-Log.
- S.7: fehlendes `ATLAS_PASS` in Prod wird beim Zugriff auf Admin-Pfade laut geloggt; 401 bleibt der
  sichere Default. **Bewusst kein Boot-Throw** — der würde die ganze öffentliche Site wegen eines
  Admin-only-Secrets lahmlegen.
- S.8: `format` gegen `FORMAT_ORDER`, `faction`/`facet` gegen Slug-Whitelist (`^[a-z0-9_-]{1,64}$`)
  analog `parseSort`; unbekannt → `null`. Kein Injection-Risiko (in-memory), aber unvalidierte Werte
  flossen in die Filter-Link-Generierung zurück.

## Decisions I made

- **Memory-Cache statt `unstable_cache` für den /archive-Blob** — gemessen 2,21 MB nach Teaser-Kürzung,
  Data-Cache-Limit ist 2 MB; selbst synopsis-frei (1,96 MB) wäre es ein Wette gegen Datenwachstum.
- **DB.6 verworfen, /compendium-ISR verworfen** — Begründungen oben bzw. im Code-Kommentar.
- **`staticGenerationMaxConcurrency` statt `mapLimit`** — der Report adressierte die falsche Stelle.
- **Reduced-Motion: Clamp behalten + gezielte Gates statt Blanket-`animation: none`** — sonst enden
  Entrance-Animationen unsichtbar.
- **`server-only` nicht auf `db/client.ts`/`recommend.ts`** — Script-erreichbar, würde tsx-Läufe crashen.
- **S.7 als Log+401 statt Fail-fast-Throw** — Verfügbarkeits-Tradeoff zugunsten der öffentlichen Site.
- **`scripts/migrate.ts`** trägt jetzt einen Zwei-Caller-Kommentar (lokal + Actions-Workflow) — das ist
  eine **Batches-eigene Datei**, Kommentar-only-Edit; bitte beim nächsten Batches-Rebase beachten.
- **MediaPlayer wird hinter offenem DetailModal inert** (spielt weiter, ist nur nicht bedienbar) —
  APG-konform und gewollt; falls es stört, wäre eine Whitelist im inert-Effect der Hebel.
- **steel-dim nur in 67 aufgehellt** — SiteMenu-Ornamente (`--sm-steel-dim`, dekorativ) und
  `/lab/design`-Referenzwert bewusst belassen; beides Philipp-Designentscheidungen, s. u.

## Verification

- `npx tsc --noEmit` — grün (nach jeder Welle und final).
- `npm run lint` — grün (eine unused-disable-Direktive in Welle 7 entdeckt und entfernt).
- `npm run build` — voller Build grün nach Welle 8; Routen-Manifest geprüft: `/ingest` + `/ingest/[runId]`
  jetzt ƒ/dynamic (Gate greift), SSG-Routen (charakter/fraktion/person/welt/podcasts) unverändert, Proxy
  kompiliert.
- Kein Dev-Server-/Browser-Harness (Memory-Regel: Philipp eyeballt selbst).
- `npm run db:migrate` — **nicht ausgeführt** (Permission-Gate der Session; Prod-DB).

## Open issues / blockers

1. **Migration 0013 ist nicht angewendet** — und seit B.1 migriert der Deploy nicht mehr automatisch.
   Einmalig nötig (additiv, gefahrlos): entweder lokal `npm run db:migrate`, oder in GitHub das
   Repo-Secret `DATABASE_URL` setzen (⚠ **Pooler-URL** verwenden — die Direct-Connection ist IPv6-only,
   GitHub-Runner haben kein IPv6) und den `migrate`-Workflow manuell dispatchen.
2. **`REVALIDATE_TOKEN`** muss in Vercel gesetzt werden, sonst bleibt `/api/revalidate` 503 (bewusst
   fail-closed). Die Batches-Apply-Scripts können den POST danach in ihren Ablauf aufnehmen.
3. **Preview-Gate vs. Maschinen-Endpunkte (Beobachtung, Session-145-Verhalten, nicht angefasst):** der
   Catch-all-Matcher schickt auch `/api/revalidate` und `/healthz` ohne Preview-Cookie auf
   `/login`-Redirect. Solange das Gate an ist, scheitern externe Monitor-/Apply-Aufrufe mit 307. Fix wäre
   eine Matcher-Ausnahme oder ein Cookie/Token-Bypass — Entscheidung fürs nächste Brief.
4. Der Login-Vergleich (`PREVIEW_PASS !==`) bleibt absichtlich simpel — die Default-Credentials sind als
   Soft-Lock ohnehin committet; Timing-Härtung wäre Theater.

## For next session — Decisions for Philipp

- **CSP-Strategie (S.2-Rest):** statische Policy mit Hash-Liste vs. Nonce via Proxy (kostet dynamisches
  Rendering der statischen Seiten) vs. erstmal ohne CSP launchen. Reddit-Launch-relevant.
- **FilterRail:** bleibt dormant (PR-#117-Entscheid bestätigt) — endgültig löschen oder reaktivieren?
- **/buecher:** redundant zu /archive (eigene Route, eigener Loader) — behalten oder 308 auf /archive?
- **TweaksPanel (/map):** rendert für Nicht-Admins nichts Persistierendes; mit S.1b ist die Spoof-Tür zu.
  Soll das Panel zusätzlich hinter `getIsAdmin()` auf Komponentenebene?
- **/buch-SSG:** blockiert durch `searchParams`+`headers()` (Brief 105). Eine Client-Insel für den
  variablen Teil würde SSG freischalten — lohnt der Umbau für die Top-Traffic-Route?
- **SiteMenu-Ornamente + /lab/design-steel-dim** auf #566070 belassen (dekorativ/Referenz) — ok so?
- Home-eigene OG-Card (P.7-Rest, optionales Polish vor Reddit).

## References

- Report 144 (`sessions/2026-06-11-144-impl-technical-deep-review.md`) — Arbeitsgrundlage, alle §-Verweise.
- Report 141 § B5 — A11y-Inventar für Welle 7.
- Next-16-Daten: Data-Cache-Limit 2 MB, `staticGenerationMaxConcurrency`-Default 8
  (`node_modules/next/dist/server/config-shared.js`), `revalidateTag(tag, "max")`-Form für Route-Handler.
