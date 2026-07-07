# Map-World-Blurbs — Research-Lauf (178b Runde 8)

Mechanischer Auftrag für einen headless Claude-Lauf (Sonnet 5 auf medium
Reasoning-Effort — bewusster Step-down vom High-Default, spart Kontingent).
Ziel: Jeder klickbare Punkt des Cartographers (`/map`) bekommt einen kurzen Text
im Welt-Popup. Heute haben nur ~118 von 1041 Welten einen Text.

**Start (PowerShell, im Product-Worktree):**

```
cd C:\Users\Phil\chrono-lexicanum-product
claude --model claude-sonnet-5 --effort medium --permission-mode acceptEdits -p "Lies docs/map-world-blurbs-run.md und arbeite den Auftrag exakt ab. Stoppe nach ca. 120 neuen Eintraegen und gib den Fortschritt aus."
```

Den Befehl mehrfach laufen lassen, bis der Lauf „nichts mehr offen" meldet —
der Auftrag ist resumierbar (bereits vorhandene Einträge werden übersprungen).

---

## Auftrag

### 1. Zielliste bestimmen

Lies diese drei Dateien:

- `scripts/seed-data/map-worlds.json` — der Katalog (Feld `worlds`, je Welt: `id`, `name`, `kind`, `classification`, `segmentum`, `locationId`, `works`)
- `scripts/seed-data/location-blurbs.json` — bestehende Location-Texte (Feld `blurbs[].id` = locationId)
- `src/lib/map/world-blurbs.json` — die Zieldatei dieses Laufs (Feld `blurbs[].id` = Welt-`id`)

Eine Welt braucht einen Eintrag, wenn **alle** drei Punkte zutreffen:

1. Sie ist NICHT (`kind === "region"` UND `works.length === 0`) — solche Region-Marken sind nicht klickbar.
2. Sie hat KEINE Location-Abdeckung: `locationId` ist `null`, ODER die `locationId` fehlt in `location-blurbs.json`.
3. Ihre `id` steht noch nicht in `src/lib/map/world-blurbs.json`.

Arbeite die offenen Welten alphabetisch nach `id` ab.

### 2. Recherche pro Welt

1. Versuche zuerst das Lexicanum: `https://wh40k.lexicanum.com/wiki/<Name>` (Leerzeichen → `_`, z. B. `Istvaan_III`). WebFetch der Seite; existiert sie nicht, versuche eine WebSearch nach `wh40k lexicanum <Name>` und, falls das nichts liefert, `warhammer 40k wiki <Name>` (Fandom-Wiki als zweite Quelle).
2. Aus der Quelle: Was IST die Welt (Typ, Zugehörigkeit), wofür ist sie bekannt (1 Kernfakt). Keine Handlungs-Spoiler aus Romanen, nur etabliertes Setting-Wissen.
3. **Keine Quelle gefunden?** Trotzdem einen Eintrag schreiben — einen nüchternen Satz nur aus den Katalogfeldern (`classification`, `segmentum`, `kind`). Beispiel-Muster (variieren, nicht stur kopieren): `A hell forge of the Ruinous Powers in Segmentum Solar. Little else survives in the archive.` / `An agri-world in Segmentum Ultima, recorded in the census but otherwise undocumented.`

### 3. Text-Stil (WICHTIG)

- **Eigene Formulierung, IMMER.** Die Quelle liefert nur Fakten — der Satz wird komplett selbst geschrieben. Niemals Sätze oder Halbsätze aus dem Lexicanum/Fandom übernehmen oder nur leicht umstellen (Urheberrecht). Faustregel: Fakten merken, Quelle gedanklich zuklappen, dann frei formulieren; keine durchgehende Wortfolge von mehr als ~4 Wörtern aus der Quelle.
- **Englisch**, 1–2 Sätze, maximal ~240 Zeichen. Präsens für Bestehendes, Vergangenheit für Zerstörtes/Historisches.
- Sachlicher Archiv-Ton wie die bestehenden Einträge. Stil-Anker (echte Beispiele aus `location-blurbs.json`):
  - `The red planet of the Sol System, a sacred forge world and seat of the Adeptus Mechanicus that supplies much of the Imperium's war materiel.`
  - `A fortress world that long guarded the Cadian Gate, the most stable passage out of the Eye of Terror, until it was destroyed during the 13th Black Crusade.`
  - `The homeworld of the Thousand Sons, destroyed by the Space Wolves in the campaign known as the Burning of Prospero.`
- **Verboten:**
  - Em-Dashes (`—`) und En-Dashes (`–`). Nur Kommas, Punkte, Doppelpunkte.
  - KI-Floskeln: „nestled", „boasts", „stands as a testament", „serves as", „plays a pivotal role", „rich tapestry", „shrouded in mystery", „steeped in", „a world of contrasts". Keine Adjektiv-Ketten, kein Werbeton.
  - Meta-Formulierungen („this world", „in the lore", „according to sources").
- Variiere Satzanfänge über die Einträge hinweg (nicht 50× „A world in …").

### 4. Schreiben (resumierbar)

- Hänge neue Einträge an das `blurbs`-Array in `src/lib/map/world-blurbs.json` an. Format pro Eintrag:

```json
{ "id": "<welt-id>", "blurb": "<text>", "confidence": 0.8, "sourceUrl": "https://wh40k.lexicanum.com/wiki/..." }
```

- `confidence`: `0.8` mit Quelle, `0.3` ohne Quelle (dann KEIN `sourceUrl`-Feld).
- Schreibe die Datei nach jeweils ~20 Welten (Zwischenstand geht nie verloren) und gib den Zähler aus (`n von m offenen Welten erledigt`).
- Nach jedem Schreiben validieren: `node -e "JSON.parse(require('fs').readFileSync('src/lib/map/world-blurbs.json','utf8'))"` muss ohne Fehler laufen.
- Am Ende des Laufs zusätzlich prüfen, dass die Datei keine Em-/En-Dashes enthält (suche nach `—` und `–`) — Treffer umformulieren.

### 5. Grenzen

- Stoppe nach ~120 neuen Einträgen pro Lauf (Folge-Lauf macht weiter).
- Ändere NICHTS außer `src/lib/map/world-blurbs.json`. Kein git (kein add/commit/push) — committet wird manuell.
- Nicht rendern/testen — das Wiring im Welt-Popup existiert bereits (`src/lib/map/world-blurbs.ts`).
