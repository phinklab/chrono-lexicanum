---
session: 2026-06-28-169
role: implementer
date: 2026-06-28
status: complete
slug: faction-starters-relink
parent: 2026-06-27-169
links: [2026-06-27-167, 2026-06-26-166, 2026-06-03-121]
commits: []
---

# 169 — faction-starters neu verlinken (Teil C von A/B/C)

## Summary

Die 10 in OFOB (Brief 166) noch ungelinkten Picks sind jetzt verlinkt: die 6 in Brief 167 neu in den Korpus geholten Bücher plus 4 Re-Point-Ziele, die schon im Korpus lagen. `faction-starters.json` ist neu erzeugt — `Unlinked` fällt von 10 auf **0**, alle 10 betroffenen Picks tragen jetzt ein klickbares `book`-Slug-Feld. Damit sind A (167) / B (168) / C (169) durch.

## What I did

- `scripts/seed-data/faction-starters.overrides.json` — die 10 `""`-Einträge auf ihre Slugs gesetzt: 6 ADD (`Our Martyred Lady (Audiodrama)→our-martyred-lady`, `Rose at War→the-rose-at-war`, `Rose in Darkness→the-rose-in-darkness`, `Lelith Hesperax→lelith-hesperax-queen-of-knives`, `The long and hungry road→the-long-and-hungry-road`, `Deathworlder→deathworlder`) + 4 REPOINT (`Watchers of the Throne Series→the-emperors-legion`, `The Great Devourer Omnibus→valedor`, `Lords OF Blood: Blood Angels Omnibus→dante`, `Masters of the Hunt→hunt-for-voldorius`).
- `scripts/seed-data/faction-starters.json` — via `npm run import:faction-starters` neu generiert. Picks 70 | exact 36 | fuzzy 5 | **override 29** (war 19, +10) | **unlinked 0**.
- `scripts/seed-data/faction-starters.review.md` — neu generiert; Summary-Zeile `Unlinked` jetzt **0**, Uncertain/Not-found je 0.
- `sessions/2026-06-27-169-arch-faction-starters-relink.md` — `status: open → implemented`.

## Decisions I made

- **Keine Abweichung vom Brief.** Die autoritative Zuordnung war die explizite 10er-Liste in Step 1; alle 10 Slugs vorab gegen `book-roster.json` (origin/main, Brief 167 = #197 gemergt) verifiziert, bevor editiert wurde — der Convert-Step fail-loud't sonst.
- **`dante` und `valedor` erscheinen je 2× als `book`-Wert** in der JSON. Erwartet: diese Slugs sind zusätzlich exact-/override-Link-Ziel anderer Picks; die REPOINT-Picks zeigen korrekt darauf. Kein Konflikt.
- Branch von `origin/main` statt vom 1-behind `worktree/product-bootstrap` gezogen, damit die 167-Slugs garantiert im Working-Tree sind.

## Verification

- `npm run import:faction-starters` — wrote json + review; `picks: 70 | exact 36 | fuzzy 5 | override 29 | unlinked 0`, `review — uncertain: 0 | not-found: 0`.
- Grep der 10 Slugs gegen `faction-starters.json` — alle 10 als `"book": "<slug>"` vorhanden.
- `faction-starters.review.md` Summary `Unlinked: 0`.
- `npm run lint` — pass (eslint, keine Ausgabe).
- `npm run typecheck` — pass (`tsc --noEmit`, keine Ausgabe).

## Open issues / blockers

Keine.

## For next session

- **A/B/C sind durch** (167 #197 + 168 #198 gemergt, 169 = dieser PR). Cowork kann den Koordinations-Rollup nachziehen (brain/** + `sessions/README.md`): Brief 166 hatte die 10 OFOB-Misses als DB-Nachpflege-Liste geführt — die ist jetzt leer, das „1 Faction, 1 Book"-Tool hat keine ungelinkten Picks mehr.
- Reines Daten-PR im Product-Worktree, kein UI-/Loader-/Scoring-Touch; die Klick-/Popup-Mechanik aus Brief 166 bleibt unangetastet.

## References

- Brief 169 (`sessions/2026-06-27-169-arch-faction-starters-relink.md`).
- Brief 167 / PR #197 (6 ADD-Slugs im Korpus), Brief 166 / PR #195 (Convert-Step + Overrides-Mechanik).
