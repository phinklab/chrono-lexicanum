---
session: 2026-07-18-247
role: implementer
date: 2026-07-18
status: complete
slug: map-timeline
parent: none
links:
  - sessions/2026-07-18-246-impl-map-time-states-ui.md
commits: []
---

# Karten-Timeline W3b-B2 — Journey-Ären-Kopplung mit Akt-Umbrüchen, voyage-Hash, Episoden-Anker

## Summary

W3b-B2 (Launch-Modus, logischer Strang Product, Coordination-Worktree). Die
drei Zeitkarten aus B1 sind jetzt mit den Great Journeys gekoppelt: **jede
Voyage deklariert ihre Start-Edition (`mapState`) und optionale
Ären-Umbrüche pro Akt** — die Karte folgt der Tour an jedem Schritt (Lion:
M30 → M31 ab Diamat → M42 ab The Rock), Zurückblättern schaltet zurück,
das Journey-Ende stellt immer die Vor-Journey-Karte wieder her. Dazu
**teilbare Reise-Links** (`voyage=<id>` im Map-Hash, Restore startet die
Journey an der Ouvertüre auf ihrer eigenen Ären-Sequenz) und die
WP-Triage-**Episoden-Anker im WorldPanel-Popup** (`#ep-<slug>`,
rückwärtskompatibel). Aus der Plan-Abnahme kamen drei B1-Nachträge:
Ocularis-Malifica-Split (M31 = Interdiction), früherer Nihilus-Fade und der
Ruinstorm als Lumen-Schnitt in `hh` (beide Renderer). Ein zunächst gebauter
**Play-Button auf der Era-Platte wurde auf Maintainer-Feedback wieder
entfernt** — er wird durch ein eigenes Zeitstrahl-Feature ersetzt (siehe
„For next session"). Alle Gates grün; UI-Abnahme durch Philipp im Browser
erfolgt („sieht fein aus").

## What I did

**Journey-Ären-Kopplung:**

- `voyages/types.ts` — `Voyage.mapState: MapState` (Pflicht, Start-Edition)
  + optionales `mapState` auf Station/Waypoint/ChartPoint (Ären-Umbruch ab
  diesem Akt, Carry-forward).
- `voyages/resolve.ts` — `ResolvedStation.era` (Carry-forward über die
  **authored** Sequenz, damit ein gedroppter Stop seinen Umbruch nicht
  verschluckt), `ResolvedVoyage.mapState`.
- `CartographerRoot.tsx` — Reducer: `eraStash` (Vor-Journey-Edition),
  geteilter `applyEra`-Helper (Nihilus-Stash-Transition, von `setEra`,
  `voyageStart/End` und `voyageEra` gemeinsam genutzt); `voyageStart`
  stasht beim Eintritt aus Nicht-Journey und schaltet auf die
  Start-Edition (Journey-Wechsel/Continuation behält den ursprünglichen
  Stash — die Kette restauriert am Ende auf den Zustand vor der ersten
  Journey); `voyageEnd` (und Toggle-off) restaurieren. Neue Action
  `voyageEra` (journey-getrieben, lässt den Stash stehen) + Follow-Effect:
  Ära = Edition des aktuellen Akts (Ouvertüre = Start-Edition, freies
  Tableau = Edition des letzten Akts); Reducer no-op bei gleicher Ära.
  Ein manueller Platten-Klick während der Tour ist transient (gilt bis zum
  nächsten Akt), das Ende restauriert trotzdem.
- Ären-Zuordnung (Audit aller 12 Journeys, Daten-Dateien):
  - `great-crusade` **pre** (endet 004.M31 an der Schwelle — vor dem
    Kriegszustand, den die hh-Karte zeigt; kein Umbruch).
  - `horus` **pre → hh** ab „Davin · The Fall" (c. 004.M31).
  - `lion` **pre → hh** ab Diamat (006.M31) **→ now** ab The Rock (der
    Schläfer wacht in M42 auf).
  - `guilliman` **pre → hh** ab Calth (007.M31) **→ now** ab der
    Resurrection (121.M31 → 999.M41).
  - `garro`, `warmasters-web` **hh** (kein Umbruch).
  - `abaddon`, `eisenhorn`, `gaunt`, `ghazghkull`, `yvraine`, `indomitus`
    **now** (kein Umbruch; Begründungen unter Decisions).
- `scripts/test-voyages.ts` — Gate: `mapState` ∈ MAP_STATES (Voyage +
  jeder Umbruch); Lion-Bogen als Invariante (beginnt pre, kreuzt hh,
  endet now).

**Reise-Links:**

- `src/lib/map/hash.ts` — `voyage` in Parse/Write (Reihenfolge world, era,
  voyage, cam). Das Token fährt **opak** (hash.ts bleibt frei von den
  Voyage-Daten); der Root validiert gegen den Roster. Restore startet die
  Journey an der Ouvertüre; `era=` im Hash gilt nur noch für Links ohne
  Journey (die Journey besitzt ihre Ären-Sequenz selbst).
- `scripts/test-map-zones.ts` — Parse-Fälle (vorhanden/abwesend/opak/
  Koexistenz mit world+era+cam).

**Episoden-Anker (WP-Triage-Link-Revisit — Entscheid: gebaut):**

- `loader-live.ts`/`loader.ts` — Episoden-Query + `PodcastEpisode` um
  `slug` erweitert (Show-Detail läuft immer live; Snapshot-Artefakte
  unberührt).
- `PodcastEpisodeArchive.tsx` — `#ep-<token>` matcht **id ODER slug**;
  `linkedId` bleibt die id, DOM-ids `pod-ep-<id>` unverändert — alle
  bestehenden `#ep-<id>`-Links (Suche, Chronicle, Entity-Panels)
  funktionieren weiter.
- `WorldPanel.tsx` — Popup-Episoden-Links: `/archive/podcasts/<show>#ep-<slug>`
  (der Episoden-Slug liegt im `MapWorldWork` bereits vor).

**B1-Nachträge aus der Plan-Abnahme (Philipp):**

- **Ocularis-Malifica-Split** — zone-21 bleibt Storm, `states` → `["pre"]`;
  neue zone-35 (identisches Polygon) `interdiction`/`["hh"]`.
  `test-map-zones`: Namens-Summen-Invariante hält, neuer Check „the
  Heresy-chart Eye speaks interdiction".
- **Nihilus-Fade** — `cg-nhG` von linear (auswärts steigend, bis
  Fernkreis r=2600) auf **Terra-zentriert radial** (Plateau 0.34 bis ~62 %
  von r=820, Fade auf 0) in `LumenNihilus.tsx` + `canvas-renderer.ts` —
  der Schatten endet kurz hinter den Segmentum-Platten.
- **Ruinstorm-Lumen-Schnitt** — `chart-geometry.ts`: `riftSpine` zu
  achsen-bewusster `bandSpine(zone, axis)` verallgemeinert (Cicatrix W→O =
  X-Slices, Ruinstorm N→S = Y-Slices), Fernkreis-Konstruktion als
  geteilter `shadowBeyond`-Helper (CCW-Schluss umschließt die linke Seite
  des a→b-Laufs — NE beim Rift, Ost beim Ruinstorm; numerisch verifiziert:
  Arc-Mittelpunkt ~3° = Ost). `ruinstormShadow()` aus der published Zone,
  **null-Fallback = volle Scheibe** (eine Kurations-Umbenennung kostet nie
  das Licht — gleiche Defensive wie RIFT_FALLBACK). `LumenNihilus.tsx` +
  `canvas-renderer.ts` schneiden era-getrieben (`now` Rift, `hh`
  Ruinstorm, `pre` ganze Scheibe); LUX-DEVORATA-Labels + Nihilus-Gruppe
  bleiben now-only; Canvas-Clip per-Ära gecacht.

**Gebaut und wieder entfernt:** Play-Toggle auf der Era-Platte (diskrete
3,5-s-Schritte M30→M31→M42). Maintainer-Urteil: ohne verbundenen
Zeitstrahl „totaler Quatsch" — vollständig zurückgebaut (EraPlate wieder
B1-Form, Reducer ohne `playing`, CSS raus). Ersatz siehe unten.

## Decisions I made

- **Warmasters-Web → M31** — der Prompt-Wortlaut („übrige inkl. guilliman →
  Stufe 3") hätte die Journey wörtlich auf die M42-Karte gelegt; per
  AskUserQuestion mit Philipp geklärt: hh (Tag „M31 · Horus Heresy").
- **Per-Akt-Umbrüche statt ein Tag pro Voyage** — Maintainer-Feedback
  mitten in der Session hob die v1-Grenze aus dem Prompt auf; der Contract
  ist ein optionales Feld pro Stop (drei Datenzeilen für den Lion), kein
  paralleles Break-Register.
- **Abaddon komplett now** — alle Akte sind post-Heresy (781.M31–999.M41,
  Scouring bis Gothic War); die hh-Karte (Dark Empire, Ruinstorm) würde
  diese Galaxis falscher beschreiben als die Gegenwartskarte.
- **Yvraine komplett now** — der „distant past"-Akt (Biel-Tan) ist zu vage
  datiert, um die M30-Karte zu behaupten.
- **Great Crusade ohne hh-Umbruch** — Nikaea 001.M31 und „The Great
  Crusade Ends" 004.M31 liegen vor dem Kriegszustand der hh-Karte.
- **Restore-Semantik** — `eraStash` überlebt manuelle Platten-Klicks
  während der Tour (die Journey führt ohnehin ab dem nächsten Akt); das
  Journey-Ende restauriert dadurch **immer** die Vor-Journey-Karte —
  einfacher zu erklären als eine Takeover-Regel.
- **Voyage-Link ignoriert `era=`** — die Journey besitzt ihre
  Ären-Sequenz; ein Hash-`era` gilt nur für journey-lose Links (die
  frühere Sharer-Override-Wiedergabe kollidierte mit dem Follow-Effect).
- **Episoden-Anker gebaut statt gelassen** — fertige Spec aus dem
  Map-Neubau-Plan, 4 Dateien, schließt die Lücke Popup ≠
  Planeten-Gesamtansicht, vollständig rückwärtskompatibel.
- **Ocularis-Split statt Kind-Wechsel** — Philipp nannte explizit M31;
  M30 behält die Storm-Lesart (Quarantäne ist ein imperialer
  Verwaltungsakt, den die GC-Karte nicht behauptet). M30 → Interdiction
  wäre ein Ein-Feld-Nachzug.

## Verification

- `npx tsc --noEmit` ✓ · `npm run lint` ✓ · `npm test` 41 Suiten ✓
  (test-voyages + test-map-zones erweitert) · `next build` ✓.
- Genau ein Is-it-up-Check gegen den detachten Dev-Server (200 auf /map);
  keine Headless-Loops (Standing Rule).
- **UI-Abnahme durch Philipp im Browser erfolgt** — Lion/Guilliman/
  Horus-Umbrüche, Journey-Ende-Restore, Reise-Links, Popup-Anker,
  M31-Interdiction-Auge, Nihilus-Fade, Ruinstorm-Schnitt.

## Open issues / blockers

- **Zone-Editor-Draft** — Philipps localStorage-Draft kennt den
  zone-21/35-Split nicht; beim nächsten Editor-Besuch gewinnt der alte
  Draft für zone-21 (pre+hh, storm). Vor einem künftigen Editor-Export
  Datei = Draft angleichen bzw. Editor-Reset (wie Session 246).
- **cam vs. Ouvertüre-Flug** — bei aktiver Voyage überstimmt der
  Survey-Flug eine mitgeteilte `cam` im Hash; bewusste Grenze (ein
  Reise-Link teilt die Reise, nicht die Kamerapose).
- Nihilus-Fade-Stops (r=820, Plateau bis 62 %) und die Ruinstorm-
  Schnittbreite (Spine-Stroke 30) sind Abnahme-tunebar; Philipp hat den
  aktuellen Stand abgenommen.

## For next session

- **Zeitstrahl-Feature (Maintainer-Auftrag, eigenes Feature, dockt an
  diese Session an):** Play-Steuerung verbunden mit einem sichtbaren
  laufenden Zeitstrahl — Punkte werden gehighlightet, Zonen „erscheinen"
  an den richtigen Stellen, die Karte springt an die relevanten Orte.
  Der in dieser Session entfernte nackte Play-Button war die falsche
  Abstraktion; die Era-Platte bleibt die Dock-Stelle.
- Ären-Gruppierung der Journey-Liste in Cartouche/Sheet (246-Vorschau,
  bewusst nicht in B2) — die `mapState`-Tags liegen jetzt als Datenbasis
  bereit.
