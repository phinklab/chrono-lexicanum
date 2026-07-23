---
session: 2026-07-23-262
role: implementer
date: 2026-07-23
status: complete
slug: product-player-assets-simple
parent: null
links:
  - https://github.com/phinklab/chrono-lexicanum/pull/294
commits: []
---

# S7b — Player/Chrome/Assets, reduzierte Fassung

## Summary

Die reduzierte S7b-Fassung ist implementiert und für die Browser-Abnahme bereit:
Canvas-Pause im Hintergrund, explizite Repeat-Visit-Cache-Policy und belegte
Dead-Asset-/Dead-CSS-Hygiene. Ein anschließender Product-Nachscan entfernte
weitere unreferenzierte Hintergründe und destillierte lange Frontend-Kommentare
auf ihre operativen Verträge. Die kalte Nachmessung zeigt weiterhin keinen
belastbaren PageSpeed-Gewinn; Player-Split, Chrome-Gate und Home-SVG-Umbau
bleiben verworfen.

## What I did

- `src/components/cartographer/RouteMotionCanvas.tsx` — rAF-Arbeit bei verborgenem
  Dokument stoppen und die laufende Reveal-Zeit nach Rückkehr korrekt fortsetzen.
- `next.config.ts` — öffentliche Bilder, Timeline-Hintergründe und Audio-Assets
  vier Stunden im Browser und ein Jahr im Vercel-CDN cachen.
- `public/aquila.png`, `public/img/hub.webp` sowie sieben weitere nicht
  referenzierte Hintergründe — zusammen 1.486.933 B tote Bilddateien entfernt;
  `cartog-holo.webp` bleibt erhalten, weil die Design-Prototypen es verwenden.
- `src/lib/m-scale.ts` — unreferenzierte 2.011-B-Utility entfernt. Vier
  nachweislich ungenutzte CSS-Regelgruppen (`.lx-tag*`, `.cmp-note*`,
  `.libr-foot--center`, `.entity-view__chip-role`) entfernt.
- Lange Kommentare in Product-TS/TSX/CSS und dem Asset-Konverter auf Cache-,
  Browser-, Accessibility- und Datenverträge reduziert. Ingestion-/Resolver-
  Kommentare blieben wegen Strang-Reinheit unangetastet.
- `scripts/convert-bg-images.ts` und `docs/design-language.md` an den tatsächlich
  weiter verwendeten Hintergrundsatz angepasst.
- `docs/werkstatt-roadmap.md` nach Philipps PR-Freigabe als angenommene
  reduzierte S7b-Fassung abgehakt.

## Decisions I made

- Kein Code aus PR #294 wurde cherry-gepickt. Der neue Branch basiert direkt auf
  `origin/main`; umgesetzt wurden nur die drei im Neustart freigegebenen Kandidaten.
- Die Canvas-Pause ist eine CPU-/Akku-Korrektur, kein Ladezeitgewinn.
- Die Cache-Regel ist eine Repeat-Visit-/CDN-Policy. Öffentliche Next-Assets
  stehen standardmäßig auf `public, max-age=0`; die neue Browser-TTL bleibt wegen
  austauschbarer, nicht gehashter Artwork-URLs bewusst bei vier Stunden. Der
  separate Vercel-Header wird am Edge konsumiert.
- Keine der gelöschten Bilddateien wurde in einem Lighthouse-Lauf angefordert.
  Ihre Entfernung ist Deployment-/Repo-Hygiene, kein PageSpeed-Gewinn.
- Der Nachscan behält vermeintliche Kandidaten mit realer Nutzung: sämtliche
  Timeline-Hintergründe, `cartog-holo.webp` (Design-Prototypen),
  `logo_cl_v2.svg` (Konverter-Quelle) und `public/audio/README.md`.
- Kein Median-Delta erreicht die vereinbarte Schwelle. Es wird daher kein
  Lighthouse-/PageSpeed-Gewinn behauptet und kein weiterer Split gebaut.

## Measurement

Identische Bedingungen vor/nach der Änderung:

- Home `/` aus lokalem Production-Build, `PREVIEW_GATE=off`
- `next start` auf `127.0.0.1:3107`, Server pro Lauf frisch gestartet
- Lighthouse 13.4.1, Mobile-Defaults/simuliertes Throttling
- Chrome 150.0.7871.130, pro Lauf frisches Lighthouse-Profil
- fünf valide kalte Läufe je Zustand; Median aus den fünf Werten

| Zustand | LCP-Läufe (ms) | SI-Läufe (ms) | TBT-Läufe (ms) | Median LCP | Median SI | Median TBT |
|---|---:|---:|---:|---:|---:|---:|
| Baseline | 6819 / 6768 / 6771 / 6824 / 6920 | 1852 / 1062 / 1851 / 1811 / 1063 | 39 / 40 / 27 / 29 / 40 | 6819 ms | 1811 ms | 39 ms |
| Nachher | 6767 / 6806 / 6844 / 6767 / 6917 | 1846 / 1816 / 1063 / 1854 / 1061 | 29 / 28 / 32 / 30 / 34 | 6806 ms | 1816 ms | 30 ms |
| Final nach Nachscan | 6842 / 6768 / 6765 / 6917 / 6766 | 1062 / 1062 / 1060 / 1061 / 1784 | 31 / 39 / 30 / 39 / 38 | 6768 ms | 1062 ms | 38 ms |
| Delta Baseline → erstes Nachher | | | | −13 ms | +5 ms | −9 ms |
| Delta Baseline → final | | | | −51 ms | −749 ms* | −1 ms |

Die ursprüngliche Vorher/Nachher-Differenz ist Teststreuung, nicht Wirkung.
Der Speed Index zeigt in allen Serien zwei Cluster um etwa 1.060 und
1.800–1.850 ms. Der Filmstreifen belegt, dass die gestaffelte Hero-Copy/Cue je
nach Lauf früher oder später als visuell vollständig gewertet wird. Deshalb ist
auch der nominelle finale Median von 1.062 ms kein belastbarer Gewinn: Bei nur
fünf Läufen kippt der Median, sobald einer dieser Cluster einen Lauf mehr hat.

| Transfer-/Bundle-Messwert | Baseline | Erstes Nachher | Final nach Nachscan |
|---|---:|---:|---:|
| Initiales JS, Transfer | 336.589 B (18 Req.) | 336.679 B (18 Req.) | 335.346 B (17 Req.) |
| Initiales JS, dekodiert | 1.047.479 B | 1.047.905 B | 1.047.791 B |
| Gesamttransfer, Median | 899.594 B (58 Req.) | 900.456 B (58 Req.) | 900.811 B (57 Req.) |
| Production-Build: alle JS-Chunks, raw / gzip | 1.278.541 / 405.467 B | 1.278.967 / 405.567 B | 1.325.707 / 421.627 B |
| Production-Build: alle CSS-Chunks, raw / gzip | 287.394 / 59.572 B | 287.253 / 59.542 B | 286.420 / 58.930 B |

Der finale Home-Request spart gegenüber der Baseline nur 1.243 B komprimiertes
JS und bleibt damit klar unter der Schwelle. Der sprungartige Gesamtwert aller
Build-Chunks ist kein Initialtransfer: Der frische Turbopack-Build packt bzw.
dupliziert route-spezifische Chunks anders, während der tatsächlich angeforderte
Home-Satz praktisch gleich bleibt. Auch daraus wird kein Gewinn oder Rückschritt
abgeleitet.

Relevante Requests in einem repräsentativen finalen Lauf:

- Scripts: 17 Requests, 335.346 B Transfer
- Fonts: 8 Requests, 154.244 B Transfer
- Stylesheets: 5 Requests, 35.226 B Transfer
- `/img/main-bg.webp`: 241.660 B Transfer; optimierte 750-px-Variante:
  33.750 B
- vorab geholtes `/map?_rsc=…`: 24.901 B Transfer

Cache-Header vor/nach dem Build, jeweils lokal am Production-Server geprüft:

| Pfad | Vorher | Nachher |
|---|---|---|
| `/img/main-bg.webp` | `public, max-age=0` | `public, max-age=14400, must-revalidate` + `Vercel-CDN-Cache-Control: public, max-age=31536000` |
| `/timeline/bg/war-in-heaven.webp` | `public, max-age=0` | wie oben |
| `/audio/README.md` | `public, max-age=0` | wie oben |

Die finale Header-/S7b-Live-Messung bleibt nach Gate-off im stillen Fenster
erforderlich; der lokale Nachweis belegt nur die erzeugte Next-Konfiguration.

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm test` — 41/41 DB-freie Suites pass; eine DB-gated Suite wie vorgesehen
  nicht Teil des Sammellaufs
- `npm run brain:lint -- --no-write` — pass, 0 Blocking Findings; 20 bestehende
  Warnungen
- `npm run build` — pass; 1.293 statische Seiten
- finaler sauberer `PREVIEW_GATE=off npm run build` — pass; zwei bestehende
  Turbopack-Trace-Warnungen
- finaler Dead-Reference-Scan — keine weitere unreferenzierte Datei unter
  `public/img`; keine verwaisten gelöschten Selektoren/Module
- fünf finale kalte Lighthouse-Mobile-Reports — vollständig, ohne
  `runtimeError`; Chrome meldete erst nach dem Schreiben jeweils eine lokale
  Temp-Profil-Cleanup-Warnung (Messdaten unbeeinträchtigt)
- `git diff --check` — pass
- Abnahme / PR-Freigabe durch Philipp — erteilt am 2026-07-23

## Open issues / blockers

- Keine.

## For next session

- Nach Gate-off die im Launch-Plan vorgesehene finale Live-Messung wiederholen
  und die Vercel-Antwortheader am Produktionshost prüfen.

## References

- https://nextjs.org/docs/app/api-reference/file-conventions/public-folder
- https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
- https://vercel.com/docs/caching/cache-control-headers
