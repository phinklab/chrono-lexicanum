---
session: 2026-06-16-153
role: implementer
date: 2026-06-16
status: complete
slug: product-p11-rueckbau
parent: 2026-06-03-121
links:
  - 2026-06-03-121-arch-product-board
  - 2026-06-13-150-impl-polish-sweep
commits: []
---

# 121-P11 — Seiten-Rückbau + Security-Rest

## Summary

Product-Strang, Worktree `chrono-lexicanum-product`, Branch `codex/product-p11-rueckbau` (von `origin/main`). Fünf P11-Teile umgesetzt: `/atlas` als Web-Route/Subtree **wirklich entfernt** (→ 404), `/buecher` per 308 auf `/archive` umgeleitet, toter Timeline/Chronicle-Cluster + `FilterRail` gelöscht, Preview-Gate-Ausnahmen für `/healthz` + `/api/revalidate`, einfache statische CSP ergänzt. **Kein Admin-UI gebaut, keine DB-/Schema-Arbeit**. „Open Full Page" war bereits via 150 raus — nicht angefasst. `typecheck` / `lint` / `brain:lint --no-write` grün. **Update 2026-06-17:** B14 wurde nach Maintainer-Test verworfen; Hand-Kuration läuft künftig per Codex-Änderung am 149er `curation-overlay.json`.

Scope-Entscheid `/atlas` (per Chat bestätigt, „Option 4"): die **Web-Route** soll weg (nicht nur gated/env-versteckt), aber nicht blind alles mit „atlas" im Namen löschen — geteilte Loader (`lib/atlas/{auth,queries,types}`), `scripts/atlas-regen.ts`, `/ingest` und `/buch/[slug]/audit` bleiben.

## What I did

### A — `/atlas` Web-Route + Admin-UI entfernt
- **Gelöscht:** `src/app/atlas/**` (`layout.tsx`, `page.tsx`, `[entity]/page.tsx`); kompletter `src/components/atlas/**` (22 Dateien — **kein** Survivor importiert daraus, nur `lib/atlas/auth`); `src/lib/atlas/decks.ts` (nur von der Route genutzt) + `src/lib/atlas/format.ts` (nur von gelöschten Atlas-Komponenten genutzt); `src/app/styles/54-atlas.css` (alle `atlas-*`-Klassen sind atlas-only) + dessen `@import` aus `globals.css`.
- **Behalten** (geteilt, bewusst nicht gelöscht): `src/lib/atlas/auth.ts` (`getIsAdmin` — von `/ingest`, `/map`, `/buch/[slug]/audit` genutzt), `src/lib/atlas/queries.ts` (von `lib/compendium/loader` genutzt) + `src/lib/atlas/types.ts` (von `queries.ts` genutzt). `scripts/atlas-regen.ts` nicht angefasst.
- **Public-Backlinks repointet:** `TYPE_TO_ATLAS` → `TYPE_TO_COMPENDIUM` in `src/lib/entity/types.ts`, Ziele von `/atlas/{charaktere,fraktionen,welten,personen}` auf die öffentlichen `/compendium/{charaktere,fraktionen,welten,autoren}`-Kategorien (Labels Characters/Factions/Worlds/Authors bleiben); Consumer `EntityBackLink.tsx` (Breadcrumb auf den 4 Entity-Detail-Seiten) nachgezogen. Damit landet ein Besucher auf der kanonischen öffentlichen Liste statt auf einem 404.
- **`proxy.ts`:** `/atlas` aus `isAdminPath()` entfernt; Matcher-Header-Kommentar, `isAdminPath`-Docstring, der `x-atlas-admin`-Forward-Kommentar und die `ATLAS_PASS`-fehlt-`console.error`-Meldung auf die verbleibenden Admin-Routen (`/ingest`, `/buch/*/audit`) eingedampft. Header-Name `x-atlas-admin` + `REALM` **nicht** umbenannt (geteiltes Signal — out of scope, im Kommentar vermerkt).

### B — `/buecher` → 308 auf `/archive`
- Redirect `{ source: "/buecher", destination: "/archive", permanent: true }` in `next.config.ts` (neben den bestehenden `/werke`+`/podcasts`-308ern).
- `src/app/buecher/{page.tsx,loading.tsx,AuditPills.tsx,SortPills.tsx,GapAudioToggle.tsx}` gelöscht (`AuditPills`/`SortPills` waren nur noch von der gelöschten `WerkePage` + dieser Seite genutzt; `GapAudioToggle` nur hier).
- **`ScrollScrim.tsx` nach `src/components/chrome/` verschoben** (`git mv`) und die 7 Survivor-Importe (`@/app/buecher/ScrollScrim` → `@/components/chrome/ScrollScrim`: home, /archive, /archive/podcasts, /archive/podcasts/[slug], /ask, /compendium-Layout, lab/_example) umgebogen → `src/app/buecher/` ist **komplett weg** (kein route-loses Geister-Verzeichnis).

### C — Toter Timeline/Chronicle-Cluster + FilterRail
Live-Timeline läuft über `components/timeline/cinematic/**` + `lib/chronicle/**` (`/timeline/page.tsx`). Der alte Accordion-Cluster hängt an **nichts** am Live-Pfad. Gelöscht: `src/components/timeline/chronicle/**` (10 Dateien), `src/components/timeline/FilterRail.tsx`, `src/lib/timeline.ts`, `src/lib/timelineUrl.ts`, `src/lib/timelineAdapter.ts` (von nichts importiert) sowie die CSS-Partials `20-timeline-shell.css`, `22-filter-rail.css`, `57-chronicle.css` (Klassen nirgends sonst genutzt) inkl. ihrer `@import`s aus `globals.css`.

### D — Gate-Ausnahmen
`proxy.ts`-Matcher um `healthz` + `api/revalidate` erweitert. Ohne die Ausnahme hätte der Preview-Gate beide (cookie-los) auf `/login` 307-umgeleitet → Healthcheck (200/503-JSON) und der token-authentifizierte Cache-Webhook wären kaputt. `/api/revalidate` macht seine eigene Bearer-Auth, `/healthz` ist bewusst öffentlich.

### E — Einfache statische CSP
`next.config.ts` `headers()` setzt jetzt `Content-Security-Policy` (Baseline, statisch, kein Nonce → keine Dynamik-Renderingkosten). Aufbau in einem `contentSecurityPolicy`-Const oben in der Datei dokumentiert.

## Decisions I made

- **`/atlas` = echte Routen-Entfernung, geteilte Libs bleiben.** `lib/atlas/queries|types|auth` sind in Live-Loader (`compendium`, `entity`, `aliases`, `store-region`) und die überlebenden Admin-Routen verwoben — Volllöschung wäre weder fokussiert noch sicher. Route + atlas-only UI/CSS raus, Shared-Kern bleibt. `queries.ts` ist „shared, schlecht benannt" und trägt jetzt **~12 atlas-only Exports ohne Live-Consumer** (`getBridgeStats`, `getWerkeRows`, `getFraktionenRows`, `getCharaktereRows`, `getWeltenRows`, `getSektorenRows`, `getAerenRows`, `getSerienRows`, `getPersonenRows`, `getSubmissionsRows`, `getFacetsRows`, `getServicesRows`) — bewusst **nicht** geprunt/umbenannt (würde Scope sprengen, `compendium/loader` destabilisieren), im File-Header als Folge-Pass notiert.
- **Backlinks nach `/compendium` statt entfernen.** Die `/compendium`-Kategorie-Slugs bilden 1:1 auf die Entity-Typen ab (`character→charaktere`, `faction→fraktionen`, `location→welten`, `person→autoren`), Labels matchen — also Wayfinding erhalten statt Breadcrumb killen. `TYPE_TO_ATLAS` umbenannt (2 Stellen), weil der Name nach dem Repoint aktiv irreführend gewesen wäre.
- **CSP-Form: statische Baseline mit `'unsafe-inline'`/`'unsafe-eval'`, kein Nonce.** Der next.config-Kommentar hatte Nonce-vs-Hash als „den größeren Schritt" markiert; ein Nonce zwingt jede Seite in Dynamic Rendering (unerwünscht für den ISR/SSG-Katalog). Die Baseline schützt **nicht** gegen Inline-Script-XSS, aber statisch & gratis: kein externer Script-/Object-Origin injizierbar, `frame-ancestors 'self'` (Clickjacking zu, deckt X-Frame-Options), `base-uri`/`form-action 'self'`. Nonce-Härtung = expliziter Folge-Schritt.
  - `img-src`/`media-src` erlauben `https:`, weil `/archive` + `/archive/podcasts` DB-getriebene Cover-/Art-URLs als reine `<img src={…}>` von offenen externen Hosts (Open Library, Podcast-CDNs …) rendern. `http:` bewusst weggelassen — auf der https-Prod-Origin wären die ohnehin Mixed-Content-geblockt (kein Neu-Bruch).
  - `frame-src 'self'` reicht: das einzige `<iframe>` (`/lab/cartographer`) ist same-origin (`/lab/cartographer-prototype/index.html`).
  - Dev-Zweig (`NODE_ENV !== production`): `connect-src` zusätzlich `ws: wss:` für HMR/React-Refresh. `script-src` trägt `'unsafe-eval'` in beiden Envs (Next/Lib-Sicherheit; bewusst permissiv für die Baseline).
- **Gate-Ausnahmen nur exakt `healthz` + `api/revalidate`** (statt ganz `/api`) — entspricht dem Board-Wortlaut und ist die konservative Wahl; aktuell ohnehin die einzige `/api`-Route.
- **Space-Grotesk-Font in `layout.tsx` behalten.** Einziger Styling-Consumer war `57-chronicle.css` (`tlp-*`) → die Schrift ist jetzt verwaist. Font-Import + `--font-grotesk`-Token zu entfernen ist eine P7-CSS/Token-Entscheidung; Kommentar ehrlich nachgezogen, Schrift in P11 stehen gelassen.
- **Keine `/atlas`-Redirect.** Per Scope-Ansage ist 404 das gewünschte/akzeptierte Verhalten — kein Redirect angelegt.

## Verification

- `npm run typecheck` (`tsc --noEmit`) — **pass** (nach `rm -rf .next`: die 4 anfänglichen Fehler waren ausschließlich stale `.next/dev/types`-Validatoren für die gelöschten Routen, keine echten — bekannter stale-`.next`-Effekt).
- `npm run lint` (`eslint .`) — **pass**.
- `npm run brain:lint -- --no-write` — **0 blocking** (15 Warnings sind vorbestehend, brain-Wiki-Content; keine aus dieser Änderung — `brain/**` wurde nicht angefasst, Rollup-Ownership gewahrt).
- Dangling-Ref-Grep gegen alle gelöschten Module: nur noch absichtliche/historische Kommentare; alle „kept"-Datei-Kommentare, die gelöschte Routen nannten, nachgezogen (`CatalogueTelemetry`, `archive/loader`, `aliases`, `queries`, `ScrollScrim`).
- **Nicht** laufen gelassen: `next build`/Prod (kein Eyeballing-Ersatz; per Konvention prüft Philipp im Browser). CSP ist erst im Prod-Build/Preview wirklich aktiv — beim Eyeballing bitte Covers/Podcast-Art (externe `<img>`) und das `/lab/cartographer`-iframe checken; falls etwas blockt, ist `Content-Security-Policy-Report-Only` der schnelle Fallback.

## For next session

- **CSP im Vercel-Preview eyeballen** (Covers/Art laden, kein Console-CSP-Block, iframe ok). Bei Bedarf Report-Only-Phase.
- **P7-Kandidaten aufgedeckt:** (1) `lib/atlas/queries.ts` — ~12 tote atlas-only Exports + irreführender Name/Pfad (`atlas` → Katalog/Compendium); `types.ts` analog (atlas-only `DeckMeta`/`DeckId`/`DeckAccent` jetzt ungenutzt). (2) Verwaiste **Space-Grotesk**-Schrift + `--font-grotesk`-Token. (3) Rein historische Kommentar-Drift (`PodcastEpisodeArchive`, `faction-colors`) nennt noch `/buecher` als Stil-Herkunft — kosmetisch, gelassen.
- **Update 2026-06-17:** Der hier genannte nächste Schritt **B14 Local-only Curation Admin Tool** wurde verworfen. Kein Browser-Admin-Tool weiterverfolgen; Hand-Korrekturen an vorhandenen Werken laufen per normalem Codex-Auftrag an `curation-overlay.json` + Dry-Run/Verify.
- Nicht pushen/PR bis „fertig" (Stand: lokal auf `codex/product-p11-rueckbau`, nicht committet).
