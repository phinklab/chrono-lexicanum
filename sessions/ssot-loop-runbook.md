# SSOT-Loop Runbook — eine Iteration

> **Mechanischer Task, keine normale Session.** Dies ist die ausführbare Spec für **genau eine** SSOT-Loop-Iteration. Wer dieses Runbook, die Ausgabe von `npm run loop:next` und `scripts/seed-data/facet-catalog.json` gelesen hat, hat alles, was er braucht — sonst nichts. Das Design-Rationale (warum es den Loop gibt, die Architektur-Entscheidungen) steht in Brief 061; **für die Iteration nicht lesen.**

## 1. Was das ist

Eine Iteration baut den Authority-Layer um genau einen 10er-Batch (am Domain-Ende 5er/4er) weiter: nächsten Batch erkennen → 10 Bücher recherchieren → eine `manual-overrides-ssot-{domain}-{NNN}.json` schreiben → einen Status-Block an `sessions/ssot-loop-log.md` anhängen → **ein** Commit. Diff-only: kein DB-Apply, kein Frontend-Smoke, keine Code-Änderung. Der Apply läuft separat (`npm run db:apply-override -- --batch=<id>`).

## 2. Lese-Scope (die Anti-Bloat-Regel)

**Lies nur diese drei Dinge:**
- dieses Runbook,
- die Ausgabe von `npm run loop:next`,
- `scripts/seed-data/facet-catalog.json` (die erlaubten `facetIds`).

**Lies NICHT** — eine mechanische Iteration braucht nichts davon:
- Brief 061 oder irgendeinen anderen Brief,
- `scripts/seed-data/book-roster.json` (der Helper liefert den Slice),
- die `manual-overrides-ssot-*.json`-Files (der Helper zählt sie),
- das volle `sessions/ssot-loop-log.md` (nur anhängen — siehe §8).

**Fahre NICHT die Session-Start-Leseroutine** aus `CLAUDE.md` / `AGENTS.md` (`brain/CLAUDE.md`, `wiki/index.md`, `project-state.md`, `open-questions.md`, `cc-session.md`). Das ist eine Loop-Iteration, keine normale Session. **Kein Co-Author-Trailer** im Commit.

## 3. Schritt 1 — Detect

`npm run loop:next` ausführen. Liefert ein JSON mit:
- `cumulativeBefore` — Bücher im Authority-Layer vor diesem Batch.
- `resolverPause` (bool) — `true` ⇒ eine 50er-Resolver-Schwelle ist erreicht **und noch nicht im Log angekündigt**.
- `loopComplete` (bool) — `true` ⇒ alle 859 Roster-Bücher sind abgedeckt.
- `batch` — `{ domain, number, id }`, z. B. `ssot-w40k-021`.
- `rosterSlice` — die 10 (bzw. 5/4) Bücher, je mit `externalBookId`, `slug`, `title`, `format`, `authors`, `seriesHint`, `releaseYear`.
- `note` — menschenlesbarer Hinweis.

## 4. Schritt 2 — Verzweigung

- **`resolverPause: true`** → KEINE Override-Datei. Nur den Pause-Block (§8) an `ssot-loop-log.md` anhängen, committen, **stoppen**. (`batch`/`rosterSlice` ignorieren — sie zeigen nur, was sonst anstünde.)
- **`loopComplete: true`** → Loop-Complete-Block (§8) anhängen, committen, **stoppen**.
- **sonst** → Batch produzieren (§5).

## 5. Schritt 3 — Batch produzieren

Pro Buch aus `rosterSlice`:
1. **WebSearch** für Plot-/Lore-Kontext (Synopsis, Faktionen, Charaktere, Locations).
2. **WebFetch der Goodreads-Buchseite** für das Rating — Wert + Count von der **Seite** lesen, nie aus dem Such-Snippet (§7).

Dann `scripts/seed-data/manual-overrides-ssot-{domain}-{NNN}.json` schreiben (§6). `batch.id` aus `loop:next` ist der Dateiname-Stamm.

## 6. Override-JSON-Schema

Top-Level:
```json
{
  "$schema": "manual-overrides-v1",
  "batch": "ssot-w40k-021",
  "createdBy": "claude-code",
  "createdAt": "<ISO-Datum>",
  "model": "<tatsächliches Modell>",
  "rationale": "<2–3 Sätze: was war an dieser 10er-Welle besonders>",
  "books": [ /* ein Eintrag pro Buch */ ]
}
```
Pro Buch:
```json
{
  "externalBookId": "W40K-0201",
  "slug": "blind",
  "overrides": {
    "synopsis": "<public-reader copy, 400–1200 Zeichen>",
    "facetIds": ["book", "..."],
    "factions": [{ "name": "Adeptus Arbites", "role": "primary" }],
    "locations": [{ "name": "Hydraphur", "role": "primary" }],
    "characters": [{ "name": "Shira Calpurnia", "role": "pov" }],
    "flags": [],
    "rating": { "status": "rated", "source": "goodreads", "value": 4.12, "count": 1234, "evidenceUrl": "https://www.goodreads.com/book/show/..." }
  }
}
```
- `rating` — zwei Formen: gewertet `{ "status": "rated", "source": "goodreads", "value", "count", "evidenceUrl" }` oder geprüft-ohne-Wertung `{ "status": "unrated", "source": "goodreads", "reason", "evidenceUrl" }`.
- Rollen: `factions`/`locations` → `primary` | `supporting` | `antagonist`; `characters` → `pov` | `supporting` | `antagonist`.
- `flags` — Audit-Marker (`data_conflict`, `low_confidence`, …), normalerweise `[]`.

## 7. Die Disziplinen (operativ)

- **Public-Synopsis.** `overrides.synopsis` ist public-reader-copy für `/buch/[slug]`: plot-/premise-orientiert, lesbar, ~400–1200 Zeichen, namentliche Charaktere/Locations. **Verboten:** internes Curation-Vokabular, SSOT-IDs (`W40K-NNNN`), Brief-Verweise, Authority-Layer-/Resolver-Sprache (`authority layer`, `cumulative=`, `surface form`, `canonical entity`, `direct match`, `alias lookup`, `Resolver-Pass`), Audit-Anker (`data_conflict`, `low_confidence`, `historical_canon_layer`), Markdown (`**bold**`, `*italic*`, `_under_`), Fußnoten (`See note:`, `cf.`, `[ref]`). Der Apply-Layer wirft **hart** bei einem Treffer (Synopsis-Guard) — also sauber halten. Technisches gehört in `flags` / `book_details.notes` / den Log-Block, nicht in die Synopsis.
- **Faction-Granularity.** `factions[].name` muss Browse-Root-Granularität oder spezifischer sein. **Nie als raw_name:** `Imperium` / `Imperium of Man` / `Imperium of Mankind` (→ `Astra Militarum` / `Adeptus Astartes` / `Inquisition` / `Mechanicus` / …); generic `Chaos`, wenn eine konkrete Chaos-Sub passt (→ `Heretic Astartes` / `Word Bearers` / `Thousand Sons` / `Black Legion` / …); `Xenos` / `Aliens` (→ konkrete Xenos-Faction `Eldar` / `Tau` / `Necrons` / `Tyranids` / `Orks` oder weglassen). Grand-Alignment lebt in `factions.alignment`, nicht als Junction.
- **Locations-Granularity.** `locations[].name` muss konkret-geographisch sein (Sektor / Welt / Sub-Location). **Nie als raw_name:** `Imperium`-Varianten / `the Imperium`; `Chaos` / `Realm of Chaos` / `the Warp` / `Warp Space`; `Xenos` / `Aliens` (→ `Cadia` / `Armageddon` / `Hydraphur` / `Eye of Terror` / `T'au Empire` / …). Warp-Aspekt plot-relevant? → in die Synopsis.
- **Goodreads-Rating.** Page-Read, **nicht** Snippet. WebSearch nur zum Auffinden der Goodreads-Buchseite (`goodreads.com/book/show/...`), dann WebFetch; Wert + Count von der Seite. Edition disambiguieren: Einzelroman vs. Omnibus/Collection/Anthology nicht vermischen, richtige Ausgabe/Work-Aggregation wählen (bei Ambiguität im Log notieren, welche Seite). Keine aggregierte Wertung (junge Bücher, frische Omnibi) → `status: "unrated"` mit Grund; nicht raten.
- **Plot-Halluzinations-Disziplin.** Keine Faction / kein Charakter / keine Location ohne Source-Basis. WebSearch liefert nichts Belastbares → leer lassen oder `{ "kind": "low_confidence", "field": "characters", "reason": "limited source coverage" }`-Flag. Lieber knapp und korrekt als breit und erfunden.
- **Omnibus-/Collection-Aggregation.** Bei `format` = omnibus/collection/anthology/scriptbook aggregieren `factions`/`locations`/`characters`/`facetIds` die enthaltenen Einzelwerke (Tag-Tiefe wie das längste Constituent-Werk), nicht nur das Framing-Material.
- **Format-Compliance-Check.** Zeigt WebSearch belastbar eine Collection/Anthology, das Roster sagt aber `novel` → `data_conflict`-Flag mit `field: "format"`, `suggestion: "collection"` (bzw. `"anthology"` bei Multi-Author).
- **Inquisition-Konsistenz.** Ist ein POV-Charakter laut Synopsis ein Inquisitor → `factions[]` trägt mindestens `Inquisition` / `Ordo Xenos` / `Ordo Malleus` / `Ordo Hereticus` mit `role` ≥ `supporting`.
- **Surface-Form-Treue, kein Pre-Resolving.** Namen exakt wie in den Quellen — kein Slugify, kein Canonical-ID-Lookup. „Sons of Horus" bleibt „Sons of Horus". Resolving in canonical Reference-Tables passiert im Resolver-Pass nach 50 Büchern.
- **WebSearch-Discipline.** 1 obligatorisch (synopsis-context, wenn das Buch nicht gut aus Trainingsdaten bekannt ist), 2–3 conditional, Soft-Cap 5 pro Buch (Omnibus/Anthology darf höher — im Log begründen). Mittlere + maximale Counts im Log dokumentieren.
- **facetIds.** Typisch 15–20 IDs aus `facet-catalog.json` (weniger bei dünner Coverage); **nur** IDs, die im Katalog existieren. Neue Kandidaten als `value_outside_vocabulary` im Log sammeln — **nicht** in den Katalog schreiben (eigener Brief).

## 8. Status-Log-Block + Anhängen ohne Voll-Last

Hänge den Block an `sessions/ssot-loop-log.md` an, **ohne die Datei komplett zu lesen** (1000+ Zeilen). Shell-Append (`>>`) oder, falls Kontext nötig, nur ein Tail-Read. Status-Marker: `✅` committed | `⏸` resolver-pause | `🏁` loop-complete.

Erfolg:
```markdown
## YYYY-MM-DD · ssot-w40k-NNN · W40K-XXXX..W40K-YYYY · ✅

- **Cumulative books in authority:** N / next-50 to next resolver pause
- **CC model:** <model>
- **Pre-check:** cumulativeBefore=<…>, batch=<id>, slice=<range>
- **WebSearch:** mean=<x>, max=<y> (over N books)
- **Per-book bullets:** <1–2 Sätze je Buch: Roster-Mistag? Format-Konflikt? dünne Coverage? Vokabular-Kandidaten?>
- **value_outside_vocabulary:** [...]
- **Notable surface-forms (within this batch):** ...
```

Resolver-Pause (Heading **exakt** so — `loop:next` erkennt daran die angekündigte Schwelle; sonst Endlos-Pause):
```markdown
## YYYY-MM-DD · ⏸ Resolver-Pause bei N Büchern

- **Cumulative books:** N (in M batches: ssot-w40k-001..ssot-w40k-NNN)
- **Action required:** Maintainer schreibt Resolver-Brief. Loop pausiert bis dahin.
- **Pause-Detection:** selbst-erkennend (Brief 088) — dieser Block ist der Marker.
```

Loop-Complete:
```markdown
## YYYY-MM-DD · 🏁 Loop complete — 859 Bücher in Authority-Schicht

- **Last batch:** ssot-hh-030 (HH-0291..HH-0294)
- **Total batches:** 57 W40K + 30 HH = 87
```

## 9. Commit-Regel

- Erfolg: ein Commit = { neue `manual-overrides-ssot-{domain}-{NNN}.json`, Log-Append }.
- Pause / Complete: ein Commit = { Log-Append } (keine Override-Datei).
- **Kein Co-Author-Trailer.** Nur diese Pfade anfassen — keine sonstigen Datei-Edits.
- Commit-Message imperativ, z. B. `SSOT-Loop ssot-w40k-021 (Brief 061)`.

## 10. Verifikation

Reiner Daten-Commit (Override-JSON + Markdown-Append, kein Code): `npm run lint` / `npm run typecheck` / `npm run brain:lint -- --no-write` dürfen übersprungen werden (Brief-061-Konvention) — wenn übersprungen, im Log-Block kurz begründen.

## Pause-Marker-Vertrauensmodell (ehrlich)

Der `⏸`-Block ist sein eigener Marker für „Schwelle wurde angekündigt". Ein Loop-Re-Run nach einer Pause **ohne** zwischenzeitlichen Resolver-Pass läuft über die Schwelle hinweg — `loop:next` sieht den Block und meldet `resolverPause: false`. Das ist gewollt: eine **advisory** Pause, dasselbe Vertrauensmodell wie das frühere `--skip-initial-resolver-pause`-Flag. Wenn der Resolver wirklich fällig ist, fahre ihn, **bevor** du den Loop neu startest.
