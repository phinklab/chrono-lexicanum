---
session: 2026-07-12-204
role: implementer
date: 2026-07-12
status: complete
slug: launch-s5-seo-observability
parent: docs/launch-master-plan.md § Session 5 (E8-Prompt-Betrieb, kein Architect-Brief)
links:
  - docs/launch-master-plan.md
  - scripts/runbooks/launch-runbook.md
commits: []
---

# Launch S5 — SEO, Sharing, Observability & Launch-Runbook

## Summary

Die Site ist SEO- und Launch-fertig verdrahtet: `SITE_URL` ist server-only und ein Prod-Build ohne Wert **scheitert** (CI setzt `https://example.invalid`); `noindex` und `robots.txt` hängen am einen Launch-Hebel `PREVIEW_GATE=off` (build-gebacken → Gate-off verlangt frischen Deploy, Runbook-Mechanik); `sitemap.xml` (2.277 URLs) entsteht beim Build **komplett aus dem Snapshot** — der DB-freie CI-Build beweist es; das Title-Template-Doubling ist auf allen Routen weg, jede öffentliche Route trägt Canonical + eigene OG-Daten, dazu Favicon/Manifest/Default-OG-Card und JSON-LD (WebSite/Book/PodcastSeries). Observability läuft per E6: Vercel Web Analytics + Speed Insights (v2, same-origin — CSP unangetastet) und ein **error-only Sentry-Setup** (Client: offizielles `@sentry/browser` über same-origin `/monitoring`-Tunnel; Server: schlanker `onRequestError`-Envelope-POST ohne OTel/Build-Plugin). **End-to-End belegt: erzwungener Server- UND Client-Fehler sind in Philipps Sentry-Dashboard sichtbar** (EU-Region). `public/lab/ofob/**` ist entfernt (Philipp-Entscheid), die Datenschutzerklärung deckt Analytics + Sentry im selben PR, und das Launch-Runbook mit Rollback-/Abort-Kriterien steht.

> **⚠ VOR DEM MERGE (Philipp):** `SITE_URL=https://www.chrono-lexicanum.com` in Vercel setzen — **Production UND Preview** —, sonst schlägt der nächste Vercel-Build fehl (fail-loud by design). Details unter „Maintainer-Schritte".

## What I did

**SEO-Fundament (src):**

- `src/lib/site-url.ts` (neu) — `siteOrigin()`: server-only `SITE_URL`, URL-validiert, Dev-Fallback localhost, **Prod ohne Wert wirft** (Build bricht bei der Metadata-Evaluation des Root-Layouts); `siteIndexable()`: `PREVIEW_GATE === "off"` — EIN Hebel für Gate + Indexierbarkeit, mit dokumentierter „gebacken ⇒ frischer Deploy"-Mechanik.
- `src/app/layout.tsx` — `metadataBase` von `NEXT_PUBLIC_SITE_URL` (einziger Consumer, ersetzt) auf `siteOrigin()`; `robots` env-gated statt hart `index:false`; Default-OG-Image; `<Analytics/>` + `<SpeedInsights/>` am Body-Ende.
- `src/app/robots.ts` (neu) — Gate an: blanket `Disallow: /`; Gate aus: Disallow nur `/api/`, `/ingest`, `/login`, `/healthz`, `/monitoring`, `/book/*/audit` + Sitemap-Zeile.
- `src/app/sitemap.ts` (neu) — A.3-Vertrag, komplett Snapshot-gespeist: Statics + Compendium-Kategorien + `/ask/faction`-Knoten (committetes JSON, Walk wie `generateStaticParams`) + Podcast-Shows (Loader-Phasenweiche) + alle ~900 Buch-Slugs (`book-slugs.json`, der S4b-Consumer) + ~1.300 Entity-URLs via `listEntityIds`; absorbierte Primarchen-Twins (`omegon`) ausgefiltert; bewusst ohne `lastModified` (keine ehrliche Quelle).
- `src/lib/entity/loader.ts` — `listEntityIds` bekommt die Build-Phasen-Weiche: IDs aus den vier Kompendium-Row-Artefakten (enumerieren dieselben vollen Referenztabellen wie `listEntityIdsLive` — kein Exporter-Change, kein Batches-Pfad berührt); Runtime bleibt live.
- `src/lib/seo.ts` (neu) — `routeOg()`: Nexts **shallow** Metadata-Merge ersetzt ein child-`openGraph` komplett (siteName/type/Default-Image wären still weg) — alle Routen bauen OG durch den Helper.
- Title-Template-Doubling zentral gefixt: alle Routen tragen den **nackten** Titel, das Root-Template hängt `· Chrono Lexicanum` genau einmal an (map, timeline, archive, podcasts index+show, ask, ask/faction, compendium layout+category, login, ingest ×2, book audit).
- Canonicals + routen-spezifische OG-Daten überall (A.3-Query-Policy): `/archive` (alle Filter-Queries → Basis), `/timeline` (`era`/`view` → Basis), `/ask` (Antwort-Queries → Basis), `/book/[slug]` (`?store` → Basis), `/compendium/[category]` (`q/alignment/sort` → Basis), `/ask/faction/…` (Canonical pro Knoten, `generateMetadata` statt statisch), Podcast-Show (Episoden bleiben Fragmente), Home `/`, `/map`, `/compendium`, `/artwork`, `/imprint`, `/privacy`.
- `src/lib/entity/metadata.ts` (neu) — gemeinsames `entityPageMetadata` für die vier Entity-Routen (Titel = Name, Canonical = A.1-Route, Description = kuratierter Blurb (240-Cap) oder per-Typ-Generikum, OG via Helper); die vier `generateMetadata` darauf umgestellt.
- JSON-LD via `src/components/seo/JsonLd.tsx` (neu, `<`-escaped): **WebSite** + SearchAction (`/archive?q=`) auf Home, **Book** auf `/book/[slug]` (name/author/isbn/datePublished/isPartOf BookSeries — nur echte Felder), **PodcastSeries** auf der Show-Seite.
- Favicon/Manifest/OG-Assets: `src/app/{icon.png,apple-icon.png,favicon.ico}`, `public/img/{icon-192,icon-512}.png` — aus `logo_cl_v2.svg` auf Void gerendert (sharp, One-off-Skript, nicht committed); `public/img/og-default.jpg` (95 KB, 1200×630) — Philipps eigenes Librarium-Gemälde (`main-bg.webp`), Attention-Crop + stiller Bottom-Scrim + Serif-Wordmark (kein Glow, kein Warm-Gradient); `src/app/manifest.ts` (minimal, `display: "browser"`).

**Observability (E6):**

- Dependencies (Leitplanke 5, Versionen recherchiert + gepinnt): `@vercel/analytics@^2.0.1`, `@vercel/speed-insights@^2.0.0` (v2 „Resilient Intake": Script + Beacons **same-origin** über Unique-Paths → S3b-CSP `'self'` trägt unverändert; Dev-Debug-Script von `va.vercel-scripts.com` ist dort schon dev-gated), `@sentry/browser@^10.65.0` (Release 2026-07-10).
- `src/instrumentation-client.ts` (neu) — `Sentry.init` error-only: `tunnel: "/monitoring"`, `sampleRate: 1`, `tracesSampleRate: 0`, kein Replay, kein PII; ohne `NEXT_PUBLIC_SENTRY_DSN` läuft nichts.
- `src/instrumentation.ts` (neu) — `onRequestError` → lazy `reportServerError`.
- `src/lib/observability/sentry-dsn.ts` (neu) — DSN-Parse + Envelope-URL, edge-safe, geteilt von Tunnel + Server-Reporter.
- `src/lib/observability/sentry-server.ts` (neu) — Envelope-POST direkt an den Ingest: exception + geparste Stack-Frames, `digest`-Tag (korreliert mit dem „REF · …" der Error-Page), route/runtime-Tags, `VERCEL_GIT_COMMIT_SHA` als Release; **kein** Header/Cookie/IP-Material; fail-quiet mit 3s-Timeout.
- `src/app/monitoring/route.ts` (neu) — Tunnel: nimmt nur Envelopes für **unseren** DSN (kein offenes Relay), 200-KB-Cap, reicht den Upstream-Status durch, 404 wenn DSN unset.
- `src/app/error.tsx` + `global-error.tsx` — `captureException(error)` (React-Render-Fehler erreichen die globalen Handler nicht); global-error nutzt jetzt auch sein `error`-Prop.
- `src/proxy.ts` — Matcher-Exclusions: `monitoring` (Beacons vom pre-auth `/login` dürfen nicht ins 307 laufen), `manifest.webmanifest`, `icon.png`, `apple-icon.png`.

**Drumherum:**

- `public/lab/**` entfernt (7 ofob-Prototypen; Philipp-Entscheid „Entfernen" — sie hätten öffentlich zudem Google Fonts geladen, im Widerspruch zur Datenschutzerklärung Ziffer „Externe Inhalte"). Keine Code-Referenzen auf `/lab`.
- `src/app/privacy/page.tsx` — Ziffer 06 Reichweitenmessung von „vorgesehen" auf aktiv; **neue Ziffer 07 „Fehlerdiagnose (Sentry)"** (error-only, kein Replay/Tracing/Cookie, Weiterleitung über eigene Domain — Besucher-IP erreicht Sentry nicht, EU-Datenregion, 90-Tage-Löschung, DPF/SCC, Art. 6 I f); Folgeziffern renummeriert (08–10), Stand 12. Juli 2026.
- `.env.example` — `NEXT_PUBLIC_SITE_URL` → `SITE_URL` (server-only, fail-loud dokumentiert); `NEXT_PUBLIC_SENTRY_DSN` dokumentiert (öffentlicher Submit-only-Identifier, kein Secret).
- `.github/workflows/ci.yml` — Build-Step bekommt `SITE_URL: https://example.invalid` (im S5-Plan mandatiert).
- `scripts/runbooks/launch-runbook.md` (neu) — Stufe 0 Voraussetzungen (inkl. Vercel-Env-Tabelle), Stufe 1 Gate-off + **frischer Deploy** (Zwei-Schritt-Mechanik erklärt), Stufe 2 zehn Live-Checks (Meta-Robots, robots.txt, Sitemap, Canonicals, OG, 308-Redirects inkl. Apex, vercel.app-Zweithost, Live-Crawl-Smoke), Stufe 3 Search-Console-Property (Domain-Property + DNS-TXT, Fallback URL-Prefix) + Sitemap-Submission, Stufe 4 Rollback: **Hebel A** Vercel Instant Rollback (Deployments → ⋯ → Instant Rollback / `vercel rollback <url>`), **Hebel B** `PREVIEW_GATE` zurücksetzen + Redeploy; fünf konkrete Abort-Kriterien + explizite Nicht-Kriterien.
- `.env.local` (gitignored): `SITE_URL` ersetzt die tote Var; Philipp hat `NEXT_PUBLIC_SENTRY_DSN` eingetragen.

## Decisions I made

- **Sentry ja, aber NICHT `@sentry/nextjs` auf dem Server.** Das Framework-SDK wickelt next.config, hängt OTel in jeden Server-Chunk und hat einen als „not planned" geschlossenen Fatal-Crash-Report auf Next-16-Turbopack-Prod-Builds (getsentry/sentry-javascript#19367: zwei gebundelte `@opentelemetry/api`-Kopien rekursieren → `RangeError`; 10.38.0 betroffen, kein bestätigter Fix). Error-only braucht davon nichts: Client = offizielles `@sentry/browser` (globale Handler will man nicht handrollen) über eigenen Tunnel (exakt das Muster, das die S3b-CSP festgeschrieben hat); Server = `onRequestError` + dreizeiliges Envelope-Protokoll (~100 Zeilen, inspizierbar, kein Build-Plugin, keine Source-Map-Uploads in CI). Trade-off dokumentiert: keine Server-Symbolication — Stack-Frames zeigen auf kompilierte Chunks; für Launch-Monitoring ausreichend, `@sentry/nextjs` bleibt Post-Launch-Option.
- **Envelope-Header braucht `dsn`** — beim ersten E2E-Versuch kam nur der Client-Fehler an: der direkte Ingest-POST ohne `dsn` im Envelope-Header (bzw. `X-Sentry-Auth`) wird still abgewiesen; der SDK-Tunnel-Pfad trägt ihn automatisch. Gefixt, zweiter Versuch kam an. (Im Code-Kommentar verewigt.)
- **Ein Launch-Hebel:** Indexierbarkeit = `PREVIEW_GATE === "off"`, kein zweiter Env-Schalter. CI/Previews bleiben automatisch noindex (Vercel-Previews tragen zusätzlich ihr eigenes `X-Robots-Tag`), und der lokale Launch-Zustand ist mit einem Env-Paar baubar.
- **Sitemap = volle Basissets** (~2.277 = 21 Statics + 55 Ask-Knoten + 4 Shows + 896 Bücher + ~1.301 Entities minus omegon), nicht die Kompendium-Sichtbarkeitsfilter (`hasContent`, World-Threshold): A.3 sagt „~1.300 via listEntityIds", jede Entity-Seite existiert (`dynamicParams`), und die IDs kommen ohne Exporter-Änderung aus den vorhandenen Row-Artefakten — Strand-Reinheit gewahrt.
- **`routeOg()`/`entityPageMetadata()`-Helper** statt Literale: der Metadata-Shallow-Merge ist eine echte Drift-Falle (Default-OG-Image/siteName verschwinden still), 15+/4 Consumer (Leitplanke 1 erfüllt).
- **OG-Card + Icons aus eigenem Material** (Logo-SVG, Philipps main-bg-Gemälde): kein Lizenzrisiko, Hausstil (kein Halo, kein Warm-Gradient); Generator-Skript bewusst nicht committed (One-off; Assets sind die Wahrheit).
- **`?store=`-Query bleibt aus Canonical/Sitemap draußen**, og:type `book`, Cover als OG-Image nur wo vorhanden (sonst Default-Card).
- **Kein `lastModified` in der Sitemap** — es gibt keine ehrliche per-URL-Quelle; erfundene Werte sind schlechter als keine.

## Verification (Belege)

- **Prod-Build ohne `SITE_URL` bricht:** Exit 1, Ursache im Log: `[site-url] SITE_URL must be set for a production build/runtime …`. ✔
- **Launch-Zustand** (`SITE_URL=https://www.chrono-lexicanum.com PREVIEW_GATE=off npm run build` + `next start`): Home `index, follow` + Canonical + Default-OG + WebSite-JSON-LD · `/archive?q=horus` → Canonical `/archive` · `/timeline?era=m41` → `/timeline` · `/book/ahriman-the-omnibus?store=de` → Canonical ohne Query, og:type book, vollständiges Book-JSON-LD · `/buch/…?store=de` → **308** auf `/book/…?store=de` (Query überlebt) · Podcast-Show: Canonical + PodcastSeries · `/login` noindex · robots.txt = Launch-Form mit Sitemap-Zeile · sitemap.xml = **2.277 URLs**, alle auf dem kanonischen Host, `omegon` nicht enthalten · manifest/icon/apple-icon/favicon/og-default alle 200. ✔
- **CI-/Preview-Zustand** (CI-Env nachgestellt: tote `DATABASE_URL`, `SITE_URL=https://example.invalid`, kein `PREVIEW_GATE`): Build grün **ohne DB** (Sitemap ist beweisbar snapshot-only), robots.txt = `Disallow: /`, Home-Meta `noindex, nofollow`, Sitemap-URLs auf dem Dummy-Host. ✔
- **Observability E2E:** erzwungener **Server-Fehler** (tote DB, kalte Entity `/character/agun_soric` → 500, S2-Fehlerfläche) und erzwungener **Client-Fehler** (`throw` im Browser) — **beide als Issues in Philipps Sentry-Dashboard sichtbar** (Screenshot in der Session; Projekt in der EU-Region, `ingest.de.sentry.io`); Client-Beacon lief nachweislich über `POST /monitoring → 200`; Tunnel ohne DSN → 404. Hinweis: das Server-Issue zählte 3 Events für einen Request — Next feuert `onRequestError` je Render-Quelle mehrfach; Sentry gruppiert das korrekt in ein Issue, kein Handlungsbedarf.
- **Gates:** `typecheck` ✔ · `lint` ✔ · `test` (38 Suiten) ✔ · `next build` ✔ (beide Env-Zustände) · `check:eras` ✔ · `brain:lint --no-write` ✔ (brain/** unberührt) · `npm audit --omit=dev --audit-level=high` ✔ mit den drei neuen Prod-Dependencies.

## Maintainer-Schritte (Philipp) — Reihenfolge beachten

1. **VOR dem Merge dieses PR:** In Vercel → Settings → Environment Variables: `SITE_URL = https://www.chrono-lexicanum.com` für **Production UND Preview** anlegen. (Ohne den Wert failt jeder Vercel-Build nach dem Merge — absichtlich.)
2. Ebenfalls vor/mit dem Merge sinnvoll: `NEXT_PUBLIC_SENTRY_DSN` (der Wert aus deiner `.env.local`) in Vercel setzen (mindestens Production; Preview optional — dann melden auch Previews Fehler ins selbe Projekt).
3. Nach dem Merge: die tote `NEXT_PUBLIC_SITE_URL` aus Vercel löschen.
4. Vercel-Dashboard: **Web Analytics** und **Speed Insights** Toggles aktivieren (Project → Analytics bzw. Speed Insights → Enable) — die Komponenten sind deployt, ohne Toggle sammelt Vercel nichts.
5. Alles Weitere (Gate-off, Live-Checks, Search Console, Rollback) läuft erst im Launch-Readiness-Schritt über `scripts/runbooks/launch-runbook.md`.

## For next session / offene Punkte

- **S6 (Such- & Archive-Payload)** ist die nächste Plan-Session.
- Der **Live-Crawl-Smoke** bleibt per Plan im Launch-Readiness-Gate (Runbook Stufe 2 Punkt 10).
- Optionaler Vercel-Redirect `*.vercel.app → www` (Runbook Stufe 2 Punkt 9) — Dashboard-Konfiguration, kein Code.
- Beobachtung am Rande (kein S5-Scope): `/character/omegon` rendert als statische Seite einen Meta-Refresh-Redirect mit HTTP 200 (Next-Verhalten für `redirect()` in SSG) — aus der Sitemap ist er raus; falls SEO-Puristik gewünscht, wäre ein 308 in `next.config.redirects()` der Weg.
- Post-Launch-Option: `@sentry/nextjs` für Server-Symbolication, sobald die Turbopack-Kompatibilität belegt ist (Decisions).
