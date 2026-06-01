---
session: 2026-05-28-103
role: implementer
date: 2026-05-28
status: complete
slug: ui-audit-drift-gap-sweep
parent: 2026-05-27-103
links:
  - 2026-05-27-103-arch-audit-drift-gap-sweep
  - 2026-05-28-103-impl-data-audit-drift-gap-sweep
  - 2026-05-15-075-impl-cockpit-drift-sort-and-rating
commits: []
---

# Audit-Cockpit Drift/Gap-Sweep — UI-Pass (Product-Strang)

## Summary

Brief-103-UI-Pass implementiert: im Single-Gap-Modus (`?audit=gap` als *einziger* Filter) werden Audio-Dramen auf ~50 % Opacity gedämpft + mit einem schmalen Mono-`Audio`-Tag markiert, eine URL-getriebene Toggle-Pille (`?hideAudio=1`, kein localStorage) versteckt sie hart. Die flache Drift-Tie-Group (`drift_count=2 / confidence=1.00`) wird jetzt nach `driftScore` (Summe globaler Surface-Form-Häufigkeit) + Axis-Triple sub-sortiert — die Cross-Era-Alias-Cluster steigen nach oben. Kein Schema-/DB-/Daten-Touch.

Worktree: `chrono-lexicanum-product`, Strang: Product/UI, Branch: `codex/product-audit-drift-gap-sweep`.

## What I did

- `src/app/buecher/page.tsx`:
  - `CatalogueAudit` um `factionDriftCount` / `locationDriftCount` / `characterDriftCount` + `driftRawNames: string[]` erweitert; in `loadBooks()` aus den schon geladenen `*AuditRows` befüllt (neuer `collectDriftRawNames()`-Helper, gleiche `rawName !== null && !== "" && !== name`-Definition wie `countResolvedDrift`). `driftCount` bleibt = Summe der drei Achsen.
  - `parseHideAudio()` + `singleGapMode = auditFilters.length === 1 && auditFilters[0] === "gap"` + `hideAudio = singleGapMode && parseHideAudio(...)`. Filter-Wiring: `hideAudio` strippt `format === "audio_drama"` aus der Liste; sonst per-Row-`dimmed`-Flag.
  - Globaler Drift-Pre-pass (`buildGlobalDriftFreq()` über das volle `books`-Set → `driftScoreById: Map<bookId, sum(freq)>`), nur gebaut wenn Drift-Sort aktiv. `sortBooks()` nimmt `driftScoreById` als Closure-Param; der Drift-Branch-Comparator bekommt zwei neue Stufen zwischen `confidence` und `updatedAt`: `driftScore DESC`, dann Axis-Triple lex-DESC `(faction, location, character)`.
  - `topDriftSignal()` rendert im Drift-Modus pro Row `· drift «Surface-Form» ×N` (Top-Häufigkeits-Surface-Form des Buchs) in die Audit-Summary-Zeile — macht die Sub-Sort sichtbar.
  - `BookRow` um `dimmed` + `driftSignal` erweitert; `is-audio-dim`-Klasse + `Audio`-Tag im `catalogue-row__main` (nicht in den Chips — überlebt den ≤720px-Spaltenkollaps).
- `src/app/buecher/GapAudioToggle.tsx` (neu, 43 Zeilen) — Client-Island analog `AuditPills.tsx` (`useSearchParams` + `router.replace`, reuse `.audit-pills`/`.audit-pill`). Schreibt/löscht `hideAudio`, zeigt Count (`Hide · 23` / `Hidden`). Nur gerendert wenn `singleGapMode`.
- `src/app/globals.css` — gescopte Cockpit-Klassen direkt nach `.catalogue-row[open]`: `.catalogue-row.is-audio-dim { opacity:.4 }` (volle Opacity auf `:hover`/`[open]` zum Inspizieren) + `.catalogue-row.is-audio-dim .catalogue-row__dot { width:5px; height:5px; filter:saturate(.45) }` (Faction-Dot kleiner + entsättigt), `.catalogue-row__audio-tag` (faint Mono, `--cl-faint`), `.catalogue-row__drift-signal` (`--cl-bone`). Keine `:root`-Token-, Font- oder Site-weiten Design-Touches (Brief 096 out-of-scope).
- `sessions/2026-05-27-103-arch-audit-drift-gap-sweep.md` — Frontmatter `status: open → implemented` (Brief-§-Notes: UI-PR flippt final) + UI-Report in `links` aufgenommen.

## Decisions I made

- **Toggle als separater `?hideAudio=1`-Param, nicht als `audit=`-Pillen-Erweiterung** (OQ 5). `hideAudio` ist ein *Anzeige*-Toggle, kein Audit-*Filter* — ein `audit=gap,noaudio` würde `noaudio` zum `AuditFilter`-Enum-Member machen und damit `parseAudit`/`matchesAudit`-Semantik verschmutzen. Separater boolescher Param hält die Filter-Typen sauber, die URL lesbar/teilbar, und `parseHideAudio` ist 3 Zeilen. URL-only, kein localStorage (Brief-Festlegung).
- **`driftScore` als `sum`, nicht `max`** (Brief-Vorgabe, hier bestätigt). Korrelliert Cluster-Häufigkeit zusätzlich mit Drift-Volume: ein Buch mit drei Junctions auf Top-Cluster-Surface-Forms rangiert vor einem mit einer.
- **Globaler Score off `CatalogueBook`, als Closure-Param in `sortBooks`** (OQ 7). `driftRawNames` + Per-Achsen-Counts sind echte Per-Buch-Eigenschaften → die wohnen auf `CatalogueAudit`. `driftScore` ist ein Cross-Buch-Aggregat → das gehört nicht in den Per-Buch-Typ. Ein Sweep im Page-Component baut `driftScoreById`, gereicht als `ReadonlyMap` in den Comparator.
- **Dämpfung = Opacity 0.4 + kleinerer/entsättigter Faction-Dot + Mono-`Audio`-Tag, volle Opacity auf hover/open.** Gewählt nach Rückfrage mit Philipp (Variante „Dim + quiet mono tag"). Kein Glyph/Emoji (kollidiert mit Cinzel/PLEX-Mono-Imperial-Type), keine Farbe, kein zweiter Left-Rail (der Border kodiert schon enriched/stub/open). Tag sitzt im `__main`, damit er den Mobile-Spaltenkollaps überlebt. **Post-Eyeball-Nachschärfung (Philipp):** ursprüngliche `opacity:.5` las sich nicht als Dämpfung — die Gap-Sortierung clustert die Audio-Rows, also fehlt der helle Nachbar zum Kontrast. Daher `.5 → .4` *plus* den Faction-Dot (`10px → 5px`, entsättigt) als absoluten Per-Row-Cue, der nicht vom Nachbarn abhängt.
- **Sichtbares Drift-Signal in der Row** (Brief „optional"). Eingebaut, weil es die Sub-Sort direkt belegt (Acceptance-Smoke „sichtbar an unterscheidbarer Reihenfolge") und OQ 2 bedient. Cockpit-only, eine Zeile pro Row.
- **`/buch/[slug]/audit`-Detailseite nicht angefasst** (Brief „out-of-scope-fail-safe"). Alle Refinements landen in der Listenansicht.
- **Tight diff.** Ein Page-File, ein neues Client-Island, ein gescopter CSS-Block, ein Brief-Status-Flip, ein Report. Kein `brain/**`/`sessions/README.md`-Touch (Brief 095 Rollup-Ownership), kein Schema-/Daten-Touch.

## Verification

`npm run typecheck` — pass. `npm run lint` — 0 Probleme. `npm run brain:lint -- --no-write` — `Blocking findings: 0`, 28 Warnings (alle pre-existing: inline-diff=2, brain-size=4, stale-claim=16, faction-policy=6; kein `brain/**`-Touch durch diesen PR).

Browser-Smoke gegen den laufenden Dev-Server (Port 3000, DB-gestützt, SSR-Markup geprüft — Marker-Vorkommen unten sind durch den Next-RSC-Payload ~verdoppelt, Verhältnisse stimmen):

| URL | Toggle | Audio gedämpft | Drift-Signal | Verhalten |
|---|---|---|---|---|
| `?audit=gap` | ✓ sichtbar | 23 Rows (`is-audio-dim` == `audio-tag`) | — | Default-Single-Gap: dämpfen, nicht filtern |
| `?audit=gap&hideAudio=1` | ✓ (aktiv) | 0 | — | Rows 348 → 325 (= 348 − 23 Audio) |
| `?audit=drift` | — | 0 | ✓ | Tie-Group-Sub-Sort, Audio unverändert |
| `?audit=drift,gap` | — | 0 | ✓ | **AND-Kombi: keine Dämpfung, keine Toggle** |
| `?audit=ssot` | — | 0 | — | unverändert (keine Regression) |

- **AND-Semantik (Codex-Review-Kernpunkt) verifiziert**: `?audit=drift,gap` zeigt `toggle=0, is-audio-dim=0` — die `length===1 && [0]==='gap'`-Regel schließt jede Kombi korrekt aus.
- **Drift-Tie-Group-Sub-Sort verifiziert**: `DRIFT`-Counts laufen die Liste runter `4,4,4,4,4,4,3,3,…,3,2,2,2` (Primär-Key monoton); die Top-Surface-Form-Frequenzen der ersten DRIFT-4-Rows fallen `×34, ×26, ×26, ×26, ×19, ×19` — die zuvor flache Tie-Group ist jetzt nach Cluster-Häufigkeit differenziert. Caption zeigt „surface-form cluster".
- **Cross-Check Daten-Pass**: `?audit=gap&hideAudio=1` = **325 Rows** = die `audit:gap-candidates`-Kandidatenzahl (325) aus dem Daten-Pass. UI-Filter und Helper-Skript teilen dasselbe Prädikat (`hasJunctionGap && format != audio_drama`) → identisches Ergebnis.

## Open issues / blockers

- **Pixel-/Mobile-Sichtprüfung nicht automatisiert verifiziert.** In dieser Umgebung gibt es kein Headless-Browser-/Screenshot-Tool (nur curl gegen SSR-Markup). Layout-Korrektheit (kein Overlap, keine umgebrochenen Pillen-Texte, Lesbarkeit, ≤640px) habe ich aus dem CSS abgeleitet: der `Audio`-Tag liegt im `__main` (im Mobile-Grid sichtbar, während `__chips`/`__updated` ausgeblendet werden), die Toggle-Pille reused `.audit-pills` und wrappt im `catalogue-toolbar__right` via `flex-wrap: wrap`. **Bitte einmal visuell gegen :3000 bestätigen** — die vier URLs oben, Desktop + schmal. Funktional/SSR ist alles grün.

## Open-Questions-Antworten (für Cowork)

- **(2) Top globale Drift-Surface-Forms** (raw_name-Häufigkeit über alle drift_works, aus `globalDriftFreq`): **Imperial Guard ×77, Eldar ×34, Isstvan V ×26, Dark Eldar ×22, Mechanicum ×19, Horus Lupercal ×19**, dann Sisters of Silence ×16, Adeptus Ministorum ×14, Knights-Errant ×13, Tau Empire ×12, Imperial Army ×12, Lucius ×11. Klare Cluster-Typen: **Edition-Rename-Aliases** (Imperial Guard→`astra_militarum`, Eldar→`aeldari`, Dark Eldar→`drukhari`, Imperial Army→`astra_militarum`), **Honor-/Full-Name-Splits** (Horus Lupercal→`horus`), **Location-Surface-Forms** (Isstvan V). Die Edition-Rename-Top-3 sind die fettesten Reference-Layer-Alias-Kandidaten — ein einziger Alias-Eintrag pro Form deckt jeweils Dutzende Junctions. (Extrahiert aus dem Per-Row-Top-Signal dedupliziert; die `×N` ist der echte globale Count.)
- **(3) Aggregation client-side oder DB-side?** Client-side im Read-Path, **keine** zusätzliche Drizzle-Query. Die `*AuditRows` mit `rawName` lädt `loadBooks()` ohnehin; ich fülle Per-Achsen-Drift-Counts + `driftRawNames` im bestehenden `.map()`, dann ein O(n·k)-Sweep im Page-Component für `globalDriftFreq`. Eine DB-side-Aggregation wäre ein zweiter Round-Trip für Daten, die schon im Speicher liegen.
- **(5) Toggle-Param-Key**: `?hideAudio=1` (separater Param). Begründung siehe § Decisions — Anzeige-Toggle ≠ Audit-Filter, sauberer `AuditFilter`-Typ.
- **(6) Brief-096-Kollision**: keine. Ich habe das bestehende `.audit-pills`/`.audit-pill`-Vokabular wiederverwendet (PLEX-Mono, Gold-Akzent). PR #110 (Design-Direction) hat Map/Hub/Ask/Atlas-Inventory/MediaPlayer angefasst, **nicht** das `/buecher`-Cockpit — kein Überlapp zu lösen. Wenn ein späterer 096-Pass die Cockpit-Toolbar restyled, erbt die Toggle-Pille automatisch (gleiche Klassen). Kein `globals.css`-Token-Touch.
- **(7) Drift-Score-Datenfluss**: Per-Achsen-Counts + `driftRawNames` auf `CatalogueAudit`; `globalDriftFreq` + `driftScoreById` (Map<bookId,number>) im Page-Component aus einem Sweep über das volle `books`-Set; als Closure-`ReadonlyMap` in `sortBooks` gereicht. Der Cross-Buch-Aggregat-Score bleibt bewusst *off* `CatalogueBook`. Perf: Pre-pass ≈ Summe aller Drift-Junctions (wenige Tausend Ops), Sort O(n log n) über das gefilterte Set — vernachlässigbar neben dem bestehenden Junction-Mapping.

## For next session

- **Reference-Layer-Alias-Cluster aus OQ 2.** Imperial Guard (77) / Eldar (34) / Dark Eldar (22) sind reine Edition-Renames — ein Alias-Eintrag pro Form (raw→canonical) würde sie aus dem Drift-Bucket nehmen, ohne ADR-Verletzung (es sind echte Synonyme, keine Cross-Era-Identitäten). Kandidat für einen kleinen Batches-Pass.
- **`/buch/[slug]/audit`-Detail-Refinement.** Die Listenansicht zeigt jetzt Top-Surface-Form + Häufigkeit; die Detailseite könnte analog die volle Drift-Achse + die fehlende Gap-Achse anzeigen. Brief 103 ließ es bewusst aus.
- **Audio-Drama-Dämpfung evtl. site-weit.** Heute nur im Single-Gap-Cockpit. Falls die öffentliche `/buecher`-Liste (Brief 096) Audio-Dramen je markieren will, ist `book.format === 'audio_drama'` + `.catalogue-row__audio-tag` wiederverwendbar.

## References

- Brief 103 (architect): `sessions/2026-05-27-103-arch-audit-drift-gap-sweep.md` (§ Constraints/UI, § Acceptance/UI, § Design freedom).
- Daten-Pass-Report (Schwester-Strang, 325-Kandidaten-Cross-Check): `sessions/2026-05-28-103-impl-data-audit-drift-gap-sweep.md`.
- Brief 075 impl (Drift-Sort-Pille, die hier sub-sortiert wird): `sessions/2026-05-15-075-impl-cockpit-drift-sort-and-rating.md`.
- `src/app/buecher/page.tsx` — `sortBooks()` Drift-Branch, `buildGlobalDriftFreq`/`driftScore`/`topDriftSignal`, `loadBooks()` Drift-Felder.
- `src/app/buecher/GapAudioToggle.tsx` — neues Toggle-Island.
- `src/db/schema.ts:150-163` — `bookFormat`-Enum (`audio_drama`).
