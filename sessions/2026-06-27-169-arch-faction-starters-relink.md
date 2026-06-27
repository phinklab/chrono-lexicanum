---
session: 2026-06-27-169
role: architect
date: 2026-06-27
status: open
slug: faction-starters-relink
parent: 2026-06-27-167
links: [2026-06-27-167, 2026-06-26-166, 2026-06-03-121]
commits: []
---

# 169 — faction-starters neu verlinken (Teil C von A/B/C)

> **Teil C, letzter Teil.** A = [167](./2026-06-27-167-arch-ofob-gap-corpus.md), B = [168](./2026-06-27-168-arch-weekly-refresh-catchup.md). Eigener PR im **Product**-Worktree. Voraussetzung: Brief 167 ist gemergt (die 6 neuen Slugs müssen in `book-roster.json` stehen).

## Goal

Die in OFOB (Brief 166) noch ungelinkten Picks jetzt verlinken — die 6 neu hinzugefügten Bücher (aus Brief 167) und die 4 schon vorhandenen Re-Point-Ziele — und `faction-starters.json` neu erzeugen, damit alle Picks im „1 Faction, 1 Book"-Tool klickbar sind.

## Context

- Die offenen Picks liegen als leere (`""`) Einträge in `scripts/seed-data/faction-starters.overrides.json`. Auflösung = Wert von `""` auf einen Buch-Slug setzen, dann `npm run import:faction-starters` neu laufen lassen (Convert-Step **fail-loud't** bei unbekanntem Slug → 167 muss gemergt sein).
- **Die autoritative Zuordnung ist die explizite Liste in Step 1** (6 ADD + 4 REPOINT, mit Slugs). Sie stammt aus dem Sheet `scripts/seed-data/source/OFOB-gap-books.xlsx` (Tab `ADD`: `OFOB verbatim title` → `slug`, jetzt 6 inkl. der entschiedenen Short Story; Tab `REPOINT`: `OFOB verbatim title` → empfohlener vorhandener Slug) — das Sheet ist **nur Herkunft und wird nicht in den Product-Worktree kopiert**; CC braucht es nicht, Step 1 genügt. Damit sind alle 10 OFOB-Misses verlinkt; `faction-starters.review.md` läuft für sie leer.
- **Strang:** Product (`chrono-lexicanum-product`; Brief 166 hat `faction-starters.*` als Product-Scope etabliert).

## Steps

1. In `faction-starters.overrides.json` die `""`-Werte setzen:
   - **ADD (6, aus 167):** `Rose at War → the-rose-at-war`, `Rose in Darkness → the-rose-in-darkness`, `Our Martyred Lady (Audiodrama) → our-martyred-lady`, `Lelith Hesperax → lelith-hesperax-queen-of-knives`, `Deathworlder → deathworlder`, `The long and hungry road → the-long-and-hungry-road` (von Philipp 2026-06-27 zum ADD entschieden — als short_story in 167 angelegt).
   - **REPOINT (4, schon im Korpus):** `Watchers of the Throne Series → the-emperors-legion`, `The Great Devourer Omnibus → valedor`, `Lords OF Blood: Blood Angels Omnibus → dante`, `Masters of the Hunt → hunt-for-voldorius`.
2. `npm run import:faction-starters` → `faction-starters.json` neu; die 10 betroffenen Picks tragen jetzt ein `book`-Slug-Feld (klickbar) und fallen aus `faction-starters.review.md` + dessen `Unlinked`-Count raus.
3. Gates grün.

## Constraints

- Nur Daten: `faction-starters.overrides.json` + generierte `faction-starters.json` (+ ggf. `faction-starters.review.md`). **Kein** UI-/Scoring-/Loader-Refactor; die Klick-/Popup-Mechanik aus Brief 166 bleibt.
- Slugs müssen in `book-roster.json` existieren (167 gemergt). Version-Policy: nichts pinnen.

## Out of scope

- OFOB-Korpus (167), Weekly (168). Keine DB-Arbeit, kein `db:sync`. Keine Omnibus-Adds (es sei denn Philipp wählt die Sheet-Alternative — dann sind das neue ADD-Bücher und gehören in einen 167-artigen Batches-Lauf, nicht hierher).

## Acceptance

- [ ] `faction-starters.overrides.json` zeigt die 6 ADD- + 4 REPOINT-Titel auf ihre Slugs — **keiner der 10 betroffenen Override-Keys bleibt `""`**.
- [ ] `npm run import:faction-starters` erzeugt `faction-starters.json` neu; **alle 10 betroffenen Picks tragen dort ein `book`-Slug-Feld** (also klickbar /buch/{slug}) — nicht nur „aus dem Review raus".
- [ ] `faction-starters.review.md` enthält für diese 10 Titel keine unresolved/intentional-unlinked Einträge; die Summary-Zeile `Unlinked` ist entsprechend reduziert (von 10 herunter).
- [ ] `npm run lint` + `npm run typecheck` grün.

## Handover (commit + Abschluss)

> **Transfer:** Dieser Brief wurde im **Koordinations-Worktree** (`C:\Users\Phil\chrono-lexicanum`) erstellt. Kopiere `sessions/2026-06-27-169-arch-faction-starters-relink.md` in **diesen Product-Worktree** und committe ihn im PR mit.

1. Auf frischem Product-Task-Branch (`codex/product-faction-starters-relink`) committen (Brief + `faction-starters.overrides.json` + generierte `faction-starters.json` + ggf. `faction-starters.review.md`), PR öffnen, `status → implemented` flippen. Nicht selbst mergen.
2. Das ist der letzte Teil — **kein** Folgeprompt. Im Report kurz vermerken, dass A/B/C durch sind, damit Cowork den Koordinations-Rollup (brain/** + README) nachzieht.
