---
session: 2026-07-23-261
role: implementer
date: 2026-07-23
status: complete
slug: product-player-chrome-assets
parent: null
links: []
commits:
  - 43ac988edca08f332ca0153ef7b651880d068ecb
  - afd278521ee19736dfbd82e4d67440c29399d6fb
---

# Qualitätspass S7b — MediaPlayer-Split, Chrome, Asset-Cleanup

## Summary

Der MediaPlayer besteht jetzt aus einer kleinen Transport-Shell und einer erst
bei der ersten Advanced-Interaktion geladenen Popover-/Playlist-UI; `/login`
lädt keine Navigation, Brand-Marker oder Player-Module mehr. Zwei tote
Bilddateien sind entfernt, der Route-Canvas pausiert in verborgenen Dokumenten
und öffentliche Medien haben einen expliziten Browser-/CDN-Cache-Vertrag.

Die bestehende Auspex-Geometrie wurde nach der visuellen Abnahme bewusst
unverändert beibehalten; die gemessenen 40.862 Bytes SVG-Markup sind hier
Design-Budget statt Optimierungsziel. Der Code und alle automatischen Gates
sind fertig; Philipp hat die Browser-Abnahme abgeschlossen und am 2026-07-23
den Git-/PR-Abschluss freigegeben.

## What I did

- `src/components/chrome/MediaPlayer.tsx`,
  `src/components/chrome/MediaPlayerAdvanced.tsx` — dauerhafte Audio- und
  Transportlogik von Volume-Popover und Playlist getrennt; der Advanced-Chunk
  wird erst nach Betätigung eines der beiden Disclosure-Buttons angefordert.
- `src/components/chrome/RouteChrome.tsx`,
  `src/components/chrome/NavigationChrome.tsx`, `src/app/layout.tsx` —
  route-aware Lazy-Gates eingeführt: `/login` behält nur die kleine Gate-Shell,
  während Navigation, Brand-Varianten und Player dort nicht importiert werden.
  Map und Timeline laden nur die jeweils tatsächlich rendernde Brand-Variante.
- `src/components/chrome/{SiteNav,SiteMenu,SiteBrand,BrandBeacon}.tsx` —
  doppelte route-interne Null-Render-Guards entfernt; die Zuständigkeit liegt
  nun an einer einzigen Importgrenze.
- `src/components/cartographer/RouteMotionCanvas.tsx` —
  `visibilitychange` stoppt Reveal- und Camera-rAFs, rechnet die verborgene
  Zeit aus dem Reveal-Fortschritt heraus und setzt beim Sichtbarwerden sauber
  fort.
- `next.config.ts` — `/img/**`, `/audio/**` und `/timeline/bg/**` erhalten
  `Cache-Control: public, max-age=14400, must-revalidate` für Browser sowie
  `Vercel-CDN-Cache-Control: public, max-age=31536000` für den Deployment-Edge.
- `public/img/hub.webp`, `public/aquila.png`,
  `src/components/chrome/SiteBackground.tsx`,
  `src/app/styles/16-shared.css` — zwei unreferenzierte Assets (zusammen
  186.481 Bytes), die tote `hub`-Variante und den unbenutzten `.aquila`-Rest
  entfernt.
- `docs/design-language.md`, `src/components/home/HubScrollReset.tsx`,
  `src/app/styles/68-login.css` — aktive Dokumentation und Kommentare auf
  `main-bg.webp`, Route-Gate und den entfernten CSS-/Asset-Stand korrigiert.

## Decisions I made

- **Die erste, vollständig auf `next/dynamic` basierende Fassung wurde
  verworfen; die sichtbare Navigation bleibt gezielt im Next-Preload-Pfad.**
  Reines `React.lazy` reduzierte die Home-Mehrlast zunächst auf 5.482 Bytes,
  ließ auf einem kalten CI-Load aber ein kurzes Fenster, in dem der schon
  sichtbare Burger noch nicht hydratisiert war und den ersten Klick verlor.
  Die finale Mischform lädt nur die sofort bedienbare Navigation über
  `next/dynamic`; Player und Brand-Deko bleiben lazy. Damit beträgt die
  Home-Mehrlast 8.487 Bytes, während `/login` weiterhin 18.848 Bytes spart.
- **Öffentliche Assets bekommen keinen `immutable`-Browservertrag.** Ihre URLs
  sind lesbar, aber nicht content-gehasht und können sich zwischen Deployments
  ändern. Vier Stunden Browser-Cache plus Revalidierung begrenzen Stale-Risiko;
  Vercels deployment-gebundener Edge darf dieselben Dateien ein Jahr halten.
- **Die versuchte Home-SVG-Komprimierung wurde vollständig verworfen.**
  Sammelpfade hätten 22.911 Bytes HTML gespart, der rechte Auspex wirkte bei
  seiner bewusst niedrigen Deckkraft von 0,22 in Philipps Abnahme aber
  schwächer. `MainAuspex.tsx` entspricht deshalb wieder bytegenau
  `origin/main`; visuelle Identität ist wichtiger als die 23-KB-Ersparnis.
- **`hub.webp` und `aquila.png` wurden gelöscht statt künstlich eingebaut.**
  Beide hatten im aktuellen `src/`-/`public/`-Graphen keinen Nutzer; die Home
  verwendet bereits `main-bg.webp`. Historische Session-Notizen und der
  Batch-Script-Kommentar zur früheren Quellenliste bleiben unangetastet.
- **Die Live-Nachmessung wurde zweigeteilt.** Vor dem Umbau wurde die aktuelle
  Produktion gemessen; nach dem Umbau wurde der fertige Production-Build lokal
  gemessen. Die finale Production-Messung kann erst nach Merge/Deployment
  erfolgen und wird laut Session-Spec einmal nach Gate-off im stillen Fenster
  wiederholt.

## Measurement

| Messpunkt | Vorher | Nachher | Differenz |
|---|---:|---:|---:|
| Home HTML | 143.325 B | 140.842 B | −2.483 B / −1,7 % |
| Home RSC | 67.453 B | 66.887 B | −566 B / −0,8 % |
| Inline-SVGs Home | 8 | 8 | unverändert |
| SVG-Markup Home | 40.862 B / 28,51 % HTML | 40.862 B / 29,01 % HTML | unverändert; +0,50 pp durch kleineres Gesamt-HTML |
| Root-/Chrome-Graph Home | 35.236 B | 43.723 B | +8.487 B / +24,1 % |
| Root-/Chrome-Graph `/login` | 35.236 B | 16.388 B | −18.848 B / −53,5 % |
| Player Advanced-UI | Teil des Monolithen | eigener 2.032-B-Chunk | bis Erstinteraktion zurückgestellt |
| Player Transport-Shell | Teil des Monolithen | eigener 8.187-B-Chunk | dauerhaft verfügbar |
| Tote Bildassets | 186.481 B | 0 B | −186.481 B |
| Live Asset-Header | `public, max-age=0, must-revalidate` | lokal: `max-age=14400`; Edge: `max-age=31536000` | final live nach Deployment offen |

Der Home-Chrome-Wert ist absichtlich als Summe der rohen, route-relevanten
Chunks ausgewiesen: Route-Shell 16.388 B, Navigation 11.603 B, Brand-Beacon
7.545 B und Player-Transport 8.187 B. Der Advanced-Chunk von 2.032 B ist darin
nicht enthalten, weil er beim initialen Home-Render weder im DOM noch im
Initialgraphen liegt.

## Verification

- Baseline vor Änderungen: `npm run build` — pass; 1.293 statische Seiten.
- `npm run typecheck` — pass auf dem finalen Stand.
- `npm run lint` — pass auf dem finalen Stand.
- `npm test` — pass; 41/41 DB-freie Suites grün, eine bestehende
  DB-/Netzwerk-Suite planmäßig ausgelassen.
- `npm run build` — pass auf dem finalen Stand; 1.293 statische Seiten. Zwei
  bestehende Turbopack-Warnungen zur Snapshot-Dateisuche/NFT-Liste bleiben.
- `npm run test:smoke -- --grep "site menu"` — die zuvor in CI fehlgeschlagene
  kalte Mobile-Menü-Interaktion ist mit dem gezielten Navigation-Preload grün.
  Der lokale Windows-Runner blieb nach der erfolgreichen Assertion beim
  Webserver-Cleanup hängen; der Pull-Request-Runner ist die maßgebliche
  vollständige Wiederholung.
- `npm run brain:lint -- --no-write` — pass; 0 Blocking Findings,
  20 bestehende Warnings.
- `git diff --check` — pass.
- Lokaler Production-Server auf `http://127.0.0.1:3107/` — Home rendert mit
  Navigation und Transport-Shell; Browser-Konsole ohne Warnings oder Errors.
- Lokale HEAD-Proben für `main-bg.webp`, Logo, Audio und Timeline-Hintergrund
  bestätigen den neuen Browser- und Vercel-CDN-Header. `/_next/image` übernimmt
  für das optimierte Home-Bild den 14.400-Sekunden-Vertrag.
- Aktuelle Live-Baseline auf `https://www.chrono-lexicanum.com` — direkte und
  optimierte Assets liefern vor dem S7b-Deploy
  `public, max-age=0, must-revalidate`; kalte Probe `MISS`, warme Probe `HIT`.
- Visuelle lokale Home-Probe — die Sammelpfad-Fassung wurde nach Philipps
  Hinweis verworfen; `MainAuspex.tsx` und seine CSS-Opacities entsprechen
  wieder exakt dem Ausgangsstand. Keine Headless-Interaktionsschleife
  ausgeführt.
- Manual (Philipp): **pass** — Browser-Abnahme abgeschlossen; Git-/PR-Abschluss
  am 2026-07-23 freigegeben.

## Open issues / blockers

- Keine Code- oder Abnahme-Blocker.
- Die finale Live-Header-/Cache-Messung ist ohne Deployment nicht möglich und
  laut Prompt nach Gate-off im stillen Fenster außerhalb dieser Session zu
  wiederholen.

## For next session

- Nach Deployment kalt und warm je ein direktes Asset sowie die zugehörige
  `/_next/image`-Variante messen; `Cache-Control`, `Age` und
  `X-Vercel-Cache` dokumentieren.
- `docs/launch-session-prompts.md` nennt S7b noch „after the mandatory launch
  sessions“, während der neuere W3-Nachtrag im Masterplan S7b vor den Launch
  zieht. Der ausgeführte Prompt folgt dem Masterplan; die ältere
  Prompt-Sammlung sollte bei der nächsten Launch-Dokumentpflege synchronisiert
  werden.

## References

- `docs/launch-master-plan.md`, Abschnitt „Session 7b“
- Maintainer-Prompt vom 2026-07-23
- https://vercel.com/docs/headers/cache-control-headers
- https://vercel.com/docs/cdn-cache
- https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
- https://nextjs.org/docs/app/api-reference/components/image#minimumcachettl
