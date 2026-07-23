---
session: 2026-07-23-261
role: implementer
date: 2026-07-23
status: partial
slug: product-player-chrome-assets
parent: null
links:
  - https://github.com/phinklab/chrono-lexicanum/pull/294
commits:
  - 43ac988edca08f332ca0153ef7b651880d068ecb
  - 04a77912d4cfbb7c1bfa72d489a3e75bcd7c12fe
  - afd278521ee19736dfbd82e4d67440c29399d6fb
  - 8b2e0e053a72c7036653013b2f5e3d2ac71b69ce
  - 3cc1c918225351a18643c777774d4df0d76c18b2
---

# Handoff — S7b Player, Chrome und Assets

## Outcome

PR #294 wurde auf Maintainer-Wunsch verworfen. Nichts aus dieser Session ist
für `main` freigegeben; für den Neustart einen frischen Branch von
`origin/main` anlegen und den alten Branch **nicht vollständig cherry-picken**.
Der Route-/Navigation-Gate-Umbau ist in `3cc1c91` zurückgebaut, weil `/login`
beim Launch ohnehin entfernt wird und sein einziger belegter Routengewinn damit
verschwindet.

## Wirkungsschätzung

| Kandidat | Gemessener/erwarteter Effekt | Empfehlung |
|---|---|---|
| Chrome-Gate | Home zunächst +8.487 B Roh-JS; Gewinn nur auf dem bald gelöschten `/login` | verwerfen |
| Player-Split | Initialer Root-Chunk 35.236 → 34.168 B (−1.068 B Roh-JS); Advanced-Chunk 2.032 B roh / 842 B gzip erst nach Klick | für Performance verwerfen; unter Wahrnehmungs- und Lighthouse-Rauschen |
| Tote Assets | 186.481 B aus Repo/Deployment entfernt, aber vorher nirgends geladen | als Hygiene okay, kein PageSpeed-Gewinn |
| Asset-Cache-Header | kein Vorteil beim kalten Lighthouse-/PageSpeed-Lauf; kann Revalidierungen bei Wiederholungsbesuchen vermeiden | nur als einfache Cache-Policy mit Live-Nachmessung behalten |
| Canvas-Visibility-Pause | kein initialer Ladezeitgewinn; spart CPU/Akku nur bei verborgenem Tab | als eigenständige, kleine Qualitätskorrektur vertretbar |
| Home-SVG-Versuch | 22.911 B Roh-HTML weniger, aber sichtbare Abschwächung des rechten Auspex | verworfen; Original bleibt |

Die realistische Erwartung für Speed Index/LCP aus dem verbleibenden S7b-Paket
ist **praktisch null**. Der Player spart initial nur rund 1 KB Roh-JS; tote
Assets wurden schon vorher nicht angefordert; Cache-Header helfen nicht beim
kalten PageSpeed-Lauf; die Canvas-Pause greift nur im Hintergrund. Ein messbarer
Score-Unterschied wäre voraussichtlich Teststreuung, kein wahrnehmbarer Gewinn.

## Empfehlung für den Neustart

1. Erst fünf vergleichbare kalte Lighthouse-Mobile-Läufe auf dem Ausgangsstand
   erheben und den Median von LCP, Speed Index, TBT/INP-Näherung sowie
   übertragenem komprimiertem Initial-JS festhalten.
2. Keine Lazy-Grenze nur für 1–2 KB Rohcode einführen. Als pragmatische
   Behalte-Schwelle: stabil mindestens etwa 100 ms Median-Gewinn oder ein klarer
   zweistelliger KB-Betrag beim komprimierten Initialpfad, ohne Interaktions-/
   Hydration-Risiko.
3. Falls weiterhin gewünscht, einen kleinen, unkomplizierten PR nur für
   Canvas-Visibility-Pause, tote Asset-Reste und bewusst bestätigte Cache-Header
   bauen. Diese Punkte als Hygiene/Batterie/Repeat-Visit-Policy benennen, nicht
   als PageSpeed-Beschleunigung.

## Verification des Rückbaus

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm test` — 41/41 DB-freie Suites pass
- `npm run build` — pass; 1.293 statische Seiten
- Chrome-Dateien nach Rückbau bytegleich zu `origin/main`; die zwei
  zwischenzeitlichen Gate-Dateien sind entfernt.
