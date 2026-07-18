---
session: 2026-07-18-246
role: implementer
date: 2026-07-18
status: complete
slug: map-time-states-ui
parent: none
links:
  - sessions/2026-07-17-245-impl-map-flicker-fix.md
  - sessions/2026-07-13-213-impl-map-mobile-rendering.md
commits: []
---

# Drei Zeitkarten + neues Map-UI — Era-Platte, Instruments-Sektion, HH-Vorzeichnung

## Summary

W3b-B1 Session 2 von 3 (Dreiteilung laut Session 245). Der Cartographer trägt
jetzt drei diskrete Kartenzustände — `pre` (M30), `hh` (M31), `now` (M42) —
geschaltet über die **Era-Platte**, eine Glass-Segmented-Control top-center
unter der Brand (beide Viewports, Radiogroup-Semantik). Zonen tragen ein
striktes `states`-Feld und filtern an beiden Renderer-Stellen (SVG +
Canvas/Android); Imperium Nihilus ist außerhalb von `now` disabled mit
sichtbarer Begründung und Merken/Restaurieren; der Rift-Schnitt der
Lumen-Maske gilt nur in `now`; die Stufe fährt im Map-Hash (`era=pre|hh`).
Das Cartouche/Sheet-UI wurde in die Drei-Ebenen-Ordnung Basiszustand /
Instrumente / Filter umgebaut (nimmt den WM-Bau-Teil vorweg). Zusätzlich —
auf Maintainer-Zuruf aus S3 vorgezogen, in drei Feedback-Runden erweitert —
ist die **HH-Karte flächendeckend vorgezeichnet** (zone-17…29: Zone
Traitoris / Imperialis / Perditus nach der WarCom-Referenz, Ruinstorm als
Nord-Süd-Grenzwall + Imperium Secundus nach Recherche, Eye of Terror
all-era); Philipp optimiert die Shapes selbst im
Zone-Editor (S3). Alle Gates grün (typecheck, eslint, `npm test` 41 Suiten,
`next build`); UI-Abnahme durch Philipp steht aus. Kein Fahrplan-Haken
(erst nach S3).

## What I did

**Mechanik (Teil B):**

- `src/lib/map/zones.ts` — `MAP_STATES`/`MapState` (`pre|hh|now`), neuer
  Zonen-Kind **`traitoris`** („Traitor-held space"), `ZoneDef.states` mit
  strikter Validierung (nicht-leer, gültig, dublettenfrei, sonst `null`),
  **`visibleZones(era)`** als einzige Sichtbarkeits-Wahrheit (memoized pro
  Ära für den Canvas-Hot-Path).
- `src/lib/map/zones.json` — 15 Bestandszonen mechanisch getaggt: alle
  `["now"]`, außer Ultramar (zone-3) + The Maelstrom (zone-6) all-era.
  Formate unverändert (49 reine Einfügezeilen).
- `src/lib/map/hash.ts` — `era` im Hash-State; `now` wird nie geschrieben
  (bestehende Links bleiben byte-identisch). Pure `parseMapHashString()`
  extrahiert + dünner `parseMapHash()`-Wrapper (eine Parse-Logik für App und
  Test).
- `CartographerRoot.tsx` — Reducer: `era` + `nihilusStash`; `setEra` stasht
  einen aktiven Nihilus beim Verlassen von `now` und restauriert ihn bei
  Rückkehr; `toggleNihilus` defensiv geguarded. Hash-Restore + Write-Effect
  analog `world`. Era-Props an beide Renderer, Cartouche, Sheet, Editor.
- `ZonesLayer.tsx` — rendert `visibleZones(era)`.
- `canvas-renderer.ts` — `CanvasScene.era`; `ZONE_RENDER_DATA` ist jetzt
  eine per-Zone-Map (Geometrie einmal vorberechnet), `drawZones` iteriert
  `visibleZones(scene.era)`; `drawLumenNihilus` überspringt in `pre`/`hh`
  den `evenodd`-Rift-Clip, das Devoured-Light-Schwarz, die Rift-Labels und
  den Nihilus-Zweig; `zoneStyle`-Case `traitoris` (Region-Sprache in Blut).
- `LumenNihilus.tsx` — Prop `era`: in `pre`/`hh` volle Lichtscheibe (Maske
  ohne Nihilus-Fläche + RIFT_D-Strich), kein `.lm-dark`, keine
  LUX-DEVORATA-Labels, `#cg-nihilusG` nicht gemountet. `chart-geometry.ts`
  blieb unangetastet (pure Geometrie; Gates sitzen an den Verbrauchern).
- `scripts/test-map-zones.ts` — neue npm-test-Suite: zones.json-Invarianten
  (Ultramar/Maelstrom/Eye of Terror all-era, Cicatrix + Dark Empire korrekt
  getaggt), Parser-Rejections, `visibleZones`, `parseMapHashString`.

**UI (Teil A):**

- `EraPlate.tsx` (neu) — die „Editionszeile" des Charts: drei Segmente
  M30/M31/M42 + aktiver Ären-Name („The Great Crusade" / „The Horus Heresy"
  / „Era Indomitus", Chronicle-Vokabular, mit Philipp entschieden).
  `role=radiogroup`, Roving-Tabindex, Pfeiltasten (ARIA-APG). Erscheint mit
  dem Chrome nach dem Overture-Enter (inert bis condensed). Glass-Platte,
  Punkt-Marker der `.rt`-Vokabel, kein Glow. B2s Play/Stepper dockt hier an.
- `Cartouche.tsx` — `OverlayButtons` zu **`InstrumentButtons`** umgebaut
  (kein Zweitbau daneben): Lumen, Nihilus, **Zonen-Cycle + Namens-Toggle
  (aus dem Census umgezogen)** als `.rt`-Reihen. Nihilus off-`now`:
  `aria-disabled`, gedimmt (`.rt.na`), Klick tot, Tag-Zeile wechselt auf
  „not yet charted — an M42 instrument" (sichtbarer Text statt Tooltip;
  Disable-statt-Verstecken nach Recherchelage). Sektion heißt
  „Instruments"; geteilter `instrumentsNote()`-Helper (vorher wortgleich
  doppelt in Cartouche + Sheet) badged jetzt auch `zones dim/off` + `names`.
- `CartoucheSheet.tsx` — identischer Umbau über die geteilten Komponenten;
  Sektionszahl bleibt 4 (Smoke-Anker `.c-sec` unverändert gültig).
- `Census.tsx` — sortenrein Population + Klassifikation; Zonen-/Namens-
  Toggles samt Icons entfernt, Props geschrumpft.
- `55-map.css` — `.cg-eraplate`-Block (Desktop + ≤640px), `.rt.na`,
  `traitoris`-Zonenstyling, Editor-Ergänzungen; Platte in Phone-Blur-Kill,
  Reduced-Motion-Liste und 44px-Touch-Targets integriert.

**Zone-Editor (S3-Werkzeug):**

- Drei Ären-Checkboxen pro Zone (letzte nicht abwählbar — Parser verbietet
  leere `states`); neue Zonen starten `["now"]`. **Draft-Migration:** ein
  pre-246-localStorage-Draft ohne `states` wird beim Laden auf `["now"]`
  gehoben statt verworfen. **Draft-Merge** (Philipps Browser-Feedback: sein
  älterer Draft verdeckte die neu committeten Zonen komplett): committete
  Zonen, deren id der Draft nicht kennt, werden beim Laden angehängt —
  Kehrseite: das Löschen einer committeten Zone hält erst, wenn der Export
  committet ist. Shapes außerhalb der aktiven Platten-Ära rendern gedimmt
  (`.zed-era-off`, 0.18/aktiv 0.45); Zeilenliste zeigt Ären-Flags („M31",
  „M30·M31", „all").

**HH-Vorzeichnung (aus S3 vorgezogen, Maintainer-Zuruf):**

Nach der Referenz (`Downloads/horus-heresy-map-by-warhammer-comunity-…webp`)
anker-basiert von Hand gesetzt — Mitgliedswelten per gx/gy aus
`map-worlds.json`, Polygon großzügig um den Cluster, Blob-Charakter der
Referenz nachempfunden (nicht bildmechanisch abgeleitet; die Referenz hat
eine andere Projektion):

| Zone | Kind | States | Anker |
|---|---|---|---|
| zone-17 Horus' Dark Empire | traitoris | hh | Istvaan III/V, Lucius, Port Maw, Cyclothrathe, Bodt-Zunge |
| zone-18 Domain of the Night Haunter | traitoris | hh | Nostramo, Thramas-Sektor, Triplex Phall, Signus Prime am Rand |
| zone-19 The Realm of the Reaper | traitoris | hh | Barbarus, Zhao-Arkkad |
| zone-20 The Imperial Core | region | hh | Terra, Cthonia, Phaeton, Tallarn, Inwit, Graia, Nikaea; Prospero/Davin/Fenris bewusst außen |
| zone-21 Eye of Terror | storm | **pre+hh+now** | zentriert auf Katalog-Entität `eye-of-terror` (gx 260.27/gy 232.49); Cadia am inneren Rand; auf der HH-Referenz „Ocularis Malifica" |
| zone-22 The Ruinstorm | storm | hh | Nord-Süd-**Grenzwall** (Gegenstück zum Ost-West-Cicatrix in `now`): von gy ~84 bis ~778 durch die Kartenmitte-Ost, fädelt nördlich zwischen Baal Refuge und Night-Haunter-Domäne durch, südlich westlich an Ultramar/Imperium Secundus vorbei; Nuceria (605/665) innen, Maelstrom/Davin frei westlich; s. Recherche unten |
| zone-23 The Colchis Reach | traitoris | hh | Colchis (154/283) — West-Band der Referenz |
| zone-24 The Northern Bastions | region | hh | Medusa (169/228) + Caliban (282/172); als Sichel nördlich des Eye (Cadia liegt auf unserem Grid dazwischen) |
| zone-25 The Southern Bastions | region | hh | Deliverance, Kiavahr, Gryphonne IV |
| zone-26 The Orpheus Salient | region | hh | Tigrus (877/485) + Orpheus Prime (985/509) — Gold-Splitter zwischen Night-Haunter-Domäne und Ruinstorm |
| zone-27 The Baal Refuge | region | hh | Baal (673/228) — loyale Insel im Verräter-Raum |
| zone-28 The Prospero Waste | perditus | hh | das verbrannte Prospero (482/385) |
| zone-29 Imperium Secundus | region | hh | Ring um den Ultramar-Cluster (Macragge 877/676, Talassar, Konor, Iax, Espandor, Calth 910/632, Sotha); enthält zone-3 vollständig, Westkante an die Ruinstorm-Wand gedrückt; **Baal liegt NICHT drin** (Lore + Grid: 673/228) |

Für die Perditus-Flecken kam ein weiterer Zonen-Kind **`perditus`** dazu
(Referenz-Grau in Bone gesprochen; Union + Label + CSS + Canvas-Case, der
Editor-Dropdown zieht automatisch nach). Unbenannte Blob-Namen (Colchis
Reach, Northern/Southern Bastions, Orpheus Salient, Baal Refuge, Prospero
Waste) sind zurückhaltende Arbeitsnamen — die Referenz benennt diese
Flächen nicht; Philipp benennt im Editor um.

**Maelstrom/Ruinstorm-Korrektur (Philipps Browser-Feedback + Recherche,
gleiche Session):** Ein erster „riesiger HH-Maelstrom" beruhte auf einer
Verwechslung mit dem Ruinstorm und wurde ersetzt. Recherche-Befund:
(1) Der **Maelstrom existiert seit vor der Menschheit** — im Großen
Kreuzzug zur Zone Purgatus erklärt, nahe dem galaktischen Kern; nach Calth
flohen Word Bearers dorthin (Ghalmek) → zone-6 steht unverändert in
**allen drei Ären**. (2) Der **Ruinstorm** wurde bei der Battle of Calth
(007.M31) durch Erebus/Lorgar entfesselt und legte einen undurchdringlichen
Schleier um Ultramar und die **Osthälfte der Galaxis** — teilte sie in
zwei, löschte das Astronomican-Licht über der halben Galaxis (Anlass des
Imperium Secundus). **Dritte Feedback-Runde (Philipps Einwand „eher eine
Grenze wie das Cicatrix"):** bestätigt — der Ruinstorm ist eine *Teilung*,
kein Fleck, der auf dem Imperium Secundus liegt. Nachrecherche Imperium
Secundus: das zweite Imperium war das Realm of Ultramar / die Five Hundred
Worlds am Eastern Fringe (Segmentum Ultima), Zentrum Macragge; **Baal
gehörte nicht dazu** — die Blood-Angels-Legion kam nach Macragge, Baal
selbst blieb draußen (nur die „Lost Sons" zurückgelassen). Auf dem Chart
daher: zone-22 als Nord-Süd-Sturmwall (volle Kartenhöhe, das
M31-Gegenstück zum Cicatrix), zone-29 Imperium Secundus als Gold-Region
östlich dahinter, zone-27 Baal Refuge bleibt eigenständig westlich des
Walls. Quellen:
[Maelstrom (Fandom)](https://warhammer40k.fandom.com/wiki/Maelstrom) ·
[Ruinstorm (Fandom)](https://warhammer40k.fandom.com/wiki/Ruinstorm) ·
[Ruinstorm (Lexicanum)](https://wh40k.lexicanum.com/wiki/Ruinstorm) ·
[Imperium Secundus (Fandom)](https://warhammer40k.fandom.com/wiki/Imperium_Secundus) ·
[Imperium Secundus (Lexicanum)](https://wh40k.lexicanum.com/wiki/Imperium_Secundus) ·
[Ultramar (Lexicanum)](https://wh40k.lexicanum.com/wiki/Ultramar) ·
[Shadow Crusade (Lexicanum)](https://wh40k.lexicanum.com/wiki/Shadow_Crusade).

Bewusst NICHT gezeichnet (fehlende Anker bzw. Nicht-Flächen): Xana-Blob
(kein `xana` im Bestand), Mezoa-Enklave (kein Pin), Aquilus-Kern-Grau (kein
Pin; das Kern-Umfeld trägt bereits den Maelstrom),
Bastion-Omega-Bogen (Linien-Ornament), Shadow-Crusade-/Nightmare-Passage-
Pfeile (Routen), HH-Ultramar-Vergrößerung (zone-3 unverändert all-era) —
Rest-Entscheide in S3.

## Decisions I made

- **Era-Platte top-center statt Bottom-Timeline oder Cartouche-Zeile** —
  mit Philipp bei Plan-Abnahme entschieden. Recherche-Basis: Basiszustand ≠
  Overlay ≠ Filter (Leaflet/ArcGIS/Google-Maps-Konvention), diskrete
  Epochen als Segmented-Control statt Slider, Mobile-Zustands-Schalter auf
  die Karte statt ins Sheet. Bottom-Center gehört den Tour-Cards.
- **Stufe-3-Label „M42 · Era Indomitus"** (Chronicle-konsistent, Karte ist
  post-Rift) — mit Philipp entschieden; M-Werte im Code bleiben
  stufen-semantisch `pre|hh|now`.
- **Journeys-Ära-Gruppierung an B2 delegiert** (ein `mapState`-Tag pro
  Voyage, keine doppelte Tag-Wahrheit) — mit Philipp entschieden.
- **`era=now` wird nie in den Hash geschrieben** — bestehende geteilte
  Links bleiben identisch; ein `era`-Link überspringt wie ein `world`-Link
  die Overture (der Teilende meinte diesen Kartenzustand).
- **Ein neuer Kind `traitoris` statt Zweckentfremdung von `interdiction`** —
  gehaltenes Gebiet spricht Region-Sprache in Blut; Hatch + ✠ bleiben das
  Interdiction-Vokabular. Kosten: 1 Union-Member, 1 Style-Case, 1 CSS-Block.
- **Fundament statt Anbau** (Maintainer-Auflage): die drei verstreuten
  `filter(published)`-Kopien (ZonesLayer, Canvas-`PUBLISHED_ZONES`,
  Census-`zoneCount`) sind auf `visibleZones(era)` zusammengezogen;
  `OverlayButtons` wurde umgebaut statt dupliziert; `instrumentsNote` ist
  ein geteilter Helper; Hash-Parsing existiert genau einmal. Genuin neu ist
  nur `EraPlate.tsx`; der Reducer bleibt der eine Reducer (1 Action, 2
  Felder).
- **Editor-Draft-Migration statt Draft-Verwurf**: der strikte Parser hätte
  einen pre-246-Draft still verworfen — Migration injiziert `["now"]`.

## Verification

- `npx tsc --noEmit` ✓ · `npm run lint` ✓ · `npm test` — 41 Suiten grün
  (inkl. neuem `test-map-zones`) ✓ · `next build` ✓.
- Dev-Server läuft, `/map` rendert (SSR zeigt Platte + Instruments-Sektion,
  keine Konsolen-Fehler) — genau ein Is-it-up-Check, keine Headless-Loops
  (Standing Rule).
- **UI-Abnahme durch Philipp im Browser steht aus.** Parcours: Platte
  schaltet pre/hh/now (Desktop + ≤900px); `pre` zeigt nur Ultramar +
  Maelstrom + Eye of Terror; `hh` dazu die 12 HH-Flächen (zone-17…20,
  22…29); `now` die 15
  Bestandszonen + Eye of Terror; Nihilus gedimmt in pre/hh mit Restore bei
  Rückkehr; Lumen in pre/hh mit voller Scheibe; `era=hh` im Hash +
  Reload-Restore; `?mapRenderer=canvas` identische Logik;
  `/map?zones=edit` Checkboxen + Ära-Dimmung.
- e2e-Smoke nicht gefahren (Session-Zuschnitt); statisch geprüft: Sheet-
  Sektionszahl bleibt 4, Desktop-Flow (Seek/Journeys) unverändert, Hash
  ohne `era` unverändert.

## Open issues / blockers

- **Eye of Terror × Cicatrix-Westwulst überlappen in `now`** (lore-korrekt —
  der Riss entspringt dem Auge — aber die Labels sitzen nah beieinander).
  S3-Kurationskandidat, kein Code-Problem.
- Die vorgezeichneten HH-Shapes sind bewusst grob; Formen-Feinschliff ist
  ausdrücklich Philipps S3-Pass im Editor.

## For next session — S3-Prompt (vorbereitet)

```text
Werkstatt-Bau W3b-B1 · Session 3 von 3 — Zonen-Kuration der drei Zeitkarten (Product, S).

Kontext: S2 (Session 246, PR #NNN) hat die komplette Drei-Zeitkarten-Mechanik + das neue Map-UI gebaut und die HH-Karte bereits flächendeckend vorgezeichnet: zone-17…29 (Traitoris: Dark Empire, Night Haunter, Reaper, Colchis Reach · Imperialis: Imperial Core, Northern/Southern Bastions, Orpheus Salient, Baal Refuge, Imperium Secundus · Perditus: Prospero Waste · Stürme: Ruinstorm als Nord-Süd-Grenzwall hh, Eye of Terror all-era) — Anker, Recherche-Quellen (Maelstrom/Ruinstorm/Imperium Secundus) und bewusste Auslassungen im Report sessions/2026-07-18-246-impl-map-time-states-ui.md. Diese Session ist der Kurations-Pass: Ich optimiere Formen, Namen und Ären-Tags selbst im Zone-Editor (/map?zones=edit — Ära-Dimmung, Ären-Checkboxen und Draft-Merge liegen bereit); CC assistiert bei Rest-Flächen.

Umfang:
- Feinschliff aller Vorzeichnungen im Editor (Formen an meine Referenz-Lesart anpassen, Arbeitsnamen wie „Northern Bastions"/„Orpheus Salient" prüfen/umbenennen, Eye-of-Terror-Rand um Cadia, Label-Nachbarschaft Eye ↔ Cicatrix-Westwulst in now, Ruinstorm-Wall-Verlauf/-Breite in hh).
- Rest-Entscheide: Xana-Blob + Mezoa-Enklave (keine Anker-Pins — zeichnen trotzdem / weglassen?), Aquilus-Kern-Grau (redundant zum Maelstrom?), Verhältnis zone-3 Ultramar ↔ zone-29 Imperium Secundus in hh (geschachtelt lassen / zone-3 in hh ausblenden?), pre-Karte (M30): reicht Ultramar+Maelstrom+Eye oder braucht der Große Kreuzzug eigene Flächen?
- Umtaggung von Bestandszonen, falls inhaltlich nötig (Default aus S2: alles now-only außer Ultramar/Maelstrom/Eye).
- Referenzen: C:\Users\Phil\Downloads\horus-heresy-map-by-warhammer-comunity-v0-fasrq6rhw1v81.webp + die HH-Kartentranskription im lokalen Plan-File von Session 245.
- Editor-Export ersetzt src/lib/map/zones.json; npm test (test-map-zones-Invarianten bei Umbenennungen nachziehen), typecheck, lint, next build.

Formen-Abnahme durch mich im Browser, keine Headless-Loops. Branch: codex/product-map-zone-curation. Kein Commit/PR, bis ich „fertig" sage. Danach Fahrplan-Haken W3b-B1 in docs/werkstatt-roadmap.md setzen (S1-S3 komplett).
```

Anschluss danach: **W3b-B2** (Karten-Timeline + Journey-Kopplung — Play/
Stepper dockt an der Era-Platte an, `mapState`-Tag pro Voyage +
Ära-Gruppierung der Journey-Liste, `voyage=`-Hash) und **WM-Restentscheid**
(Philipp: was von der WM-Runde nach diesem UI-Umbau übrig bleibt).

## Nachtrag — Fortsetzung derselben Session (Browser-Kuration + M30-Recherche)

- **Dev-Server-Vorfall:** Der session-gebundene Hintergrund-Dev-Server starb
  mit dem Session-Ende, während Philipp im Zone-Editor zeichnete. Kein
  Datenverlust — der Editor autosavet jede Änderung in den
  Browser-localStorage. Der Server läuft jetzt **detached** in einem eigenen
  Konsolenfenster („chrono-dev", `cmd /k npm.cmd run dev`), unabhängig von
  CC-Sessions; er endet erst, wenn Philipp das Fenster schließt.
- **Draft-Sicherung:** Philipps Editor-Stand zweimal per Copy-JSON gesichert
  nach `zones-draft-backup-2026-07-18.json` (untracked, lokal, bleibt aus dem
  PR; mechanisch gegen die Pastes verifiziert).
- **M30-Recherche (zwei Web-Agenten):** Verdikt — die pre-Karte ist mit
  genau Ultramar + Maelstrom + Eye of Terror korrekt. Keiner der sieben
  M42-Stürme/Anomalien ist M30/M31-belegt (Emperor's Wrath M36, Hadex
  656.M40, Siren's Storm 001.M42; Vortex of Despair/Tendrils/Malfactus/
  Somnium undatiert, erst auf M41/M42-Karten; Malfactus + Somnium im
  Imperium Nihilus). Eye entstand beim Fall der Aeldari (frühes M30,
  Fandom; Lexicanum-Ausreißer M31); era-gerechter GC-Name laut
  Imperius-Dominatus-Karte: „Ocularis Malifica" (Namensoption für den
  Eye-Split, S3). Ultramar erst ab Mitte/Ende des Crusade — all-era-Tag
  bleibt vertretbar. Quellen: Lexicanum (Eye of Terror, Ultramar, List of
  Warp Storms, Storm of the Emperor's Wrath, Hadex, Siren's Storm,
  Rangdan Xenocides), Fandom (Fall of the Aeldari, Scourge Stars, T'au),
  Imperius-Dominatus-Scan (40k-Wiki).
- **Verworfenes Experiment:** Zehn GC-Flächen (Ghoul Stars, Halo Stars,
  Dominion of Storms, Death of Reason, Thirteen Realms, Golgotha Wastes,
  Veiled Region, Hungering Gyre, 2× Prohibited Zone) von der
  Imperius-Dominatus-Karte anker-basiert vorgezeichnet; auf Philipps
  Einwand (die Karte führt sie als Titel ohne feste Ausdehnung — Polygone
  wären Interpretation) wieder entfernt, nie committet. Die
  Ablese-Ergebnisse (Label ↔ Nachbarwelten) stehen im Chat-Protokoll,
  falls S3 sie doch braucht.
- **Editor-Draft als Folge-Commit übernommen** (Philipps Zuruf „committen
  und live anschauen"): zone-30 Traitor Space (traitoris, hh), zone-31 +
  zone-34 Zone Perditus (hh bzw. now), zone-33 Bastion Omega (region, hh),
  **Eye-Split** (zone-21 „Eye of Terror" pre+hh mit eigener Form, zone-32
  „Eye of Terror" now — das M42-Auge nach dem Fall von Cadia), zone-28
  Rename „The Prospero Waste" → „Zone Perditus", Reshapes u. a. am
  Cicatrix-Westende um Terra/Auge und an zone-29 Imperium Secundus.
- **Test-Invariante nachgezogen:** `test-map-zones` prüft das Auge jetzt
  als Namens-Summe (alle Zonen namens „Eye of Terror" decken zusammen
  pre+hh+now); Ultramar/Maelstrom bleiben strikt all-era.
- Gates Nachtrag: `test-map-zones` ✓ · `tsc --noEmit` ✓ · `eslint` ✓.
  UI-Abnahme des Gesamtstands macht Philipp nach dem Merge live.

## Nachtrag II — geführte Abnahme + Kurations-Abschluss (gleiche Fortsetzung)

- **Editor-Exit-Regression gefixt:** Das auf 34 Zonen gewachsene Panel
  (`.cg-zed`, z-index 40, max-height bis 110px über Viewport-Boden) überdeckte
  den fixed Exit-Toggle (bottom 150px, z-index 20) — bei 15 Zonen nie
  erreicht. Panel-max-height endet jetzt oberhalb des Toggles
  (`calc(100vh - 295px)`); zusätzlich zweiter Exit („✕") im Panel-Kopf
  (volle Navigation wie der Toggle, begründetes
  eslint-disable `no-html-link-for-pages`).
- **Geführte UI-Abnahme durch Philipp komplett** (Frage-für-Frage-Parcours):
  Editor-Exits, Era-Platte (Desktop + Mobile, Pfeiltasten), Karteninhalte
  pro Ära, Instruments (Nihilus-Disable + „not yet charted" + Restore,
  Lumen-Vollscheibe in pre/hh), Hash `era=hh`/`era=pre` + Reload-Restore +
  now-nie-geschrieben, Desktop-Canvas via `?mapRenderer=canvas` — alles
  abgenommen. On-Device-Android-Check folgt nach dem Merge.
- **Finale Kurationsentscheide (Philipp):** now-Auge bleibt im Cicatrix
  aufgegangen (zone-32 gelöscht; das Cicatrix-Westende umschließt die
  Auge-Gegend), zone-34 Perditus now→hh, Imperium-Secundus-Ostkante
  eingezogen; Xana/Mezoa nicht zeichnen (keine Anker-Pins); Aquilus-Grau
  redundant zum Maelstrom; Ultramar⊂Imperium-Secundus-Schachtelung in hh
  bleibt; die zehn probeweisen M30-Flächen endgültig verworfen — sie waren
  via Draft-Merge in Philipps localStorage-Draft zurückgekehrt (Löschungen
  propagieren nicht in den Draft; bereinigt via Editor-Reset nach Angleich
  Datei = Draft).
- **Renames (generische Kartensprache statt erfundener Eigennamen):**
  zone-21 → „Ocularis Malifica" (belegtes Label der Imperius-Dominatus-
  Karte, era-gerechter GC/HH-Name des Auges), zone-23 → „Traitor Space",
  zone-24/25/26/27 → „Loyalist Space" (Spiegel zu „Traitor Space"/„Zone
  Perditus"). `test-map-zones`-Invariante folgt dem Rename (Ocularis
  Malifica deckt pre+hh; kein separates now-Auge).
- **Canvas-Blur auf HiDPI** (kein `devicePixelRatio`-Scaling im
  Android-Hot-Path) → `docs/ui-backlog.md`; bewusst nicht blind gefixt,
  Fill-Rate-Kosten erst on-device prüfen.
- **Fahrplan-Haken W3b-B1 gesetzt (✔ 246)** — Kuration abgeschlossen;
  Philipp behält sich einen optischen Revisit vor. S3 als separate Session
  entfällt (in dieser Fortsetzung aufgegangen); Anschluss bleibt W3b-B2.
