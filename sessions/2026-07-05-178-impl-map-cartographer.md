---
session: 2026-07-05-178
role: implementer
date: 2026-07-05
status: complete
slug: map-cartographer
parent: 2026-07-05-178
links:
  - design/08-cartographer/README.md
commits: []
---

# Map-Neubau „Cartographer" — Phase 2: Studie I → App (Brief 178, P14 Teil B)

## Summary

Die `/map`-Route ist neu gebaut: Studie I „Maledictum" (Runde 5, von Philipp gewählt) läuft jetzt nativ in der App auf dem vollen SSOT-Katalog `map-worlds.json` (alle 1054 Welten, DB-frei, buildzeit-gebündelt); die alte Hologramm-Disc (`src/components/map/**`, `src/lib/galaxy/**`, `/lab/cartographer`, `public/lab/cartographer-prototype/`) ist im selben Schnitt gelöscht. Wichtigster eigener Call: das Cicatrix-Raster shippt **statisch** — die ~900 einzeln CSS-animierten Zellen der Studie sind der praktisch sichere Treiber des gemeldeten „ultra laggy" und shippen nie; das billige Rift-Leben (Wort-Glitch, Blitze, Adern-Atmen) liegt hinter einem „Rift unrest"-Toggle im mitgenommenen Direction-Panel, default **aus**.

## What I did

**Datenpfad (`src/lib/map/`, neu neben der bestehenden `map-worlds-schema.ts` — die bleibt, Batches-shared):**

- `load-map-worlds.ts` — direkter JSON-Import des Katalogs (Präzedenz lib/ask/lib/blurbs), `validateMapWorlds` einmal, memoized; Kommentar-Guard „server-only".
- `payload.ts` — kompakter One-Shot-Client-Payload nach dem Muster des Studien-Extrakts (worlds.js v4): `cls`-Index (70 Primary Classifications, Häufigkeit desc), `clsKind`, `featured` (154 inkl. 13 Region-Pins, **volle** Werklisten inkl. `role`/`via`/Episode-`show`), `dust` als `[gx,gy,clsIdx]`-Tripel, `regions`, `coverage` **verbatim** aus dem Katalog (nie über `works` summiert — via-Dedup), `vbCut` (Top-100-Schwelle für den Zoom-Schleier).
- `projection.ts` — eingefrorene SSOT-Transform-Konstanten (`gx = (x−2.794)·1000/7028.206`, y-Offset 515) mit Drift-Kommentar gegen `grid.transform` im Katalog; `gridToSsot`/`ssotToGrid`; `TERRA = (333.4, 401.95)` (deckt sich mit der Katalog-Row `terra`). Koordinaten-Readout + Popup-Koordinaten sprechen damit exakt den Pixelraum der Kurations-Excel.
- `routes.ts` — die zwei Kurse (Indomitus / Path of Heresy) wortgleich aus Studie I, inkl. Akt-Texten.
- `hash.ts` — `#world=<id>&cam=<gx>,<gy>,<kr>` (Zoom relativ zu k0 → viewport-portabel), replaceState mit 80-ms-Trailing-Debounce (Muster des alten `galaxy/share.ts`).
- `pin-source.ts` — dünne `PinSource`-Naht (Entscheid 6; v1 nur `catalog`; `detail()` ist das Druckventil für späteres Lazy-Splitting der Werklisten).

**Komponenten (`src/components/cartographer/`, 17 Dateien):**

- `chart-geometry.ts` — alle deterministischen Konstruktionen der Studie 1:1 portiert (gleiche LCG-Seeds → bit-identische Streuungen): Polar-Rahmen/Keile, Segmentum-Marken, Rift-Spine per **analytischem Bézier-Arclength-Sampling** (die Studie maß ein Live-`<path>`; die S-Kommandos sind expandiert — kein DOM nötig, SSR-sicher), Cicatrix-Zellen/Runs/Zonen/Skulls/Blitze/Adern, radialer Nihilus-Pfad (Strahlen von Terra, Fernkreis r=2600), Sweep-Clip aus der Segmentkanten-Silhouette, Sturm-/Areal-/Staub-Streuungen.
- `ChartStage.tsx` + `chart-bus.ts` — Kamera `{tx,ty,k}` in Refs; pro Frame nur Transform-Write + `--cg-ik`-Counter-Scale-Var (1054 Pins konstant groß ohne React-Render); `data-band` 0–2 rein imperativ, Label-Tiers/Zoom-Schleier rein per CSS; non-passive Wheel, `setPointerCapture` (Hit wird beim pointerdown gemerkt — der Runde-2-Tooltip-Bug), Zwei-Finger-Pinch; delegierter Pin-Klick über `data-pin`. Der `ChartBus` ist die imperative Naht zu den HTML-Overlays (Popup/Kurs-Karten/Readout/Hash positionieren sich per Frame-Subscription, ohne React).
- `layers.tsx` (Staub je Klassifikation gruppiert, Werk-Pins mit Kind-Glyphen + Tier-Labels, Region-Typo klickbar), `decor.tsx` (Gradnetz, Polar, Stürme mit wirbelndem Auge, Leviathan/Sautekh, Terra-Auspex), `GreatRift.tsx` (drei Fassungen I/II/III per `data-storm`, statisches Raster, gated `RiftWords`-Engine), `LumenNihilus.tsx`, `Sweep.tsx` (Ein-Bild-Canvas-Schweif, gedithert, rotiert per rAF), `RoutesLayer.tsx`, `Selection.tsx`, `CourseCards.tsx` (Cluster < 26 Grid-Units → eine Karte mit Pager), `WorldPanel.tsx`, `Census.tsx`, `Cartouche.tsx` (+ Ouvertüre), `DirectionPanel.tsx`, `CartographerRoot.tsx` (Mount-Gate via `useSyncExternalStore`, ein kleiner Reducer, Scroll-Lock, Hash-Restore/-Write, Escape).
- Welt-Popup: Live-Site-Glasfläche; Primary + Secondary/Tertiary Classification; **volle** Werkliste mit internem Scroll, Rollen + `via`-Herkunft; Buch → `/buch/{slug}` (Kapelle-Intercept öffnet über der Karte), Episode → `/archive/podcasts/{show}`, Footer → `/welt/{locationId}`.
- Census: elf kind-Gruppen mit Zählwerk, aufklappbaren Klassifikations-Zeilen, „Linked records only", Staub-Zeile, „Reveal the full census".

**Route + CSS + Chrome:**

- `src/app/map/page.tsx` neu (Loader → Payload → `CartographerRoot`; kein `getIsAdmin` mehr → die Route ist jetzt **statisch** prerendered); `loading.tsx` unverändert (CogitatorLoading).
- `src/app/styles/55-map.css` komplett neu (cg-Präfix, Kathedrale-Tokens, Warp-Farben kartenlokal, reduced-motion-Block, <900px-Fallback). `.map-route .site-bg__photo`-Dim bleibt, jetzt `brightness(var(--cg-bright, 0.2)) saturate(0.7)`.
- `SiteBrand.tsx` — `/map` aus der Hide-Liste genommen (fixierte Anatomie „SiteBrand + Burger bleiben").
- Auf der Karte navigiert der **Burger auch auf Desktop** (`body.cg-on-map`-Override in 55-map.css): die linke Nav-Rail (fixed, vertikal zentriert) läge sonst mitten im Chart.
- `next.config.ts` — CSP-Kommentar zum gelöschten `/lab/cartographer`-iframe aktualisiert (Config selbst unverändert).
- `README.md` — Cartographer-Zeile an die Realität angepasst („filterable by year" war v1-falsch, Entscheid 3: kein Era-Filter).

**Löschpass (grep-verifiziert, einziger externer Importer war die alte `map/page.tsx`):** `src/components/map/**` (44 Dateien), `src/lib/galaxy/**`, `src/app/lab/cartographer/`, `public/lab/cartographer-prototype/`. `map-worlds-schema.ts` behalten; `@source not '../../public/lab'` in globals.css bleibt (timeline-prototype existiert weiter); Font-Aliase in 00-tokens.css unberührt.

## Decisions I made

- **Cicatrix statisch geshippt (wichtigster Call).** Philipps Lag-Report kam mit der Runde-5-Warpsturm-Iteration; deren Delta zu H sind ~900 Zellen mit je eigener Infinite-CSS-Animation + Hover-Hit-Testing + 90-ms-Wort-Engine. Per-Zellen-Animationen und Zell-Hover shippen **gar nicht** (Zellen sind je EIN `<path>`, pointer-events:none). Die billigen Anteile — Wort-Glitch (≤3 Slots × ~12 Buchstaben), zehn Blitze, Adern-/Band-Atmen, Skull-Flackern — hängen an `.cg-chart.unrest` + `<RiftWords>` hinter dem **„Rift unrest"-Toggle, default AUS**. Entscheidung, was davon live gut aussieht und flüssig bleibt, liegt bei dir im Browser.
- **Direction-Panel mitgenommen** (dein Wunsch, „ich entscheide live"): Backdrop an/aus, Veil, Brightness, Grain, Sturm I/II/III, Rift unrest. Defaults = Studien-Regler (0.82 / 0.20 / 0.09, Fassung II, Backdrop an). Das Panel + die `veil/bright/grain/bgArt`-Reducer-Felder fliegen nach dem Entscheid in einem Mini-Follow-up raus; die Gewinnerwerte werden dann Konstanten.
- **Rift-Spine analytisch gesampelt** statt DOM-Pfadmessung: die zwei `S`-Kommandos sind zu Cubics expandiert, 600 Arclength-Samples, Frames per Binärsuche. Kein `getPointAtLength` auf detached Nodes, kein SSR-Risiko; Abweichung zur Studie < Zeichenbreite.
- **Exakte Streu-Parität:** die LCG-Ströme konsumieren an den Stellen, wo die Studie Animations-Timings zog, Dummy-Draws — die Karte fällt bit-identisch zu dem, was du in Runde 5 abgenommen hast.
- **Tertiary Classification als Literal** (`TERTIARY` in payload.ts, nur `vigilus → "Genestealer Infested"`): der Convert droppt die Excel-Spalte bewusst (Brief 183, 4 Zeilen); Vigilus ist die einzige verlinkte. Wandert in den Convert, falls die Spalte je offiziell wird.
- **Episoden-Links ohne Anker:** der Anker-Kompat-Vorschritt (Loader um `slug` erweitern, Hash-Match id ODER slug) war nicht im Session-Zuschnitt; die Archive-Seite matcht heute nur `#ep-<DB-id>`, der Katalog trägt derivierte Slugs. Also linkt das Popup auf die Show-Halle (`/archive/podcasts/{show}`) statt einen toten Anker zu erzeugen. Nachziehen = Plan-§ „Episoden-Anker-Kompat", unabhängig shipbar.
- **Burger statt Rail auf /map** (eigener Call innerhalb „SiteBrand + Burger bleiben"): CSS-Override unter `body.cg-on-map`, gesetzt/aufgeräumt vom Root-Effect. Kein Eingriff in SiteNav/SiteMenu-Code.
- **Kurs-Stationen ohne rt-hi-Klassenmutation:** Route-Highlighting läuft deklarativ über ein `hiNames`-Set in `PinLayer` statt wie in der Studie per DOM-classList — gleiche Optik, React-konform.
- **Popup-Werkliste voll statt „erste 3":** Plan-Vorgabe (Rollen + via, interner Scroll, max Terra ~196) schlägt die Studien-Kürzung; sortiert primary → subject → secondary → mentioned.
- **Deferred (bewusst nicht im Zuschnitt):** Vermesser-Modus (K11) + `worklist.ts` + `outputFileTracingIncludes`; Episoden-Anker-Kompat; `public/lab`-@source-Aufräumen. Alt-localStorage-Keys der Disc-Map sterben folgenlos.

## Verification

- `rm -rf .next` → `npm run typecheck` — pass.
- `npm run lint` — pass. (Erste Runde schlug mit 46 `react-hooks/refs`-Fehlern fehl — die neuen React-Compiler-Regeln verbieten Latest-Value-Ref-Writes im Render. Umbau: Ref-Sync in Effects, `bus.setDriver()` statt Prop-Mutation, Sweep-setState deferred, WorldPanel auf das dokumentierte „previous renders"-Muster.)
- `npm run build` — pass; `/map` in der Route-Tabelle als `○ (Static)`.
  - **Ein transienter Prerender-Fehler im ersten Build-Lauf**, `/fraktion/tanith_first`: `TypeError: Cannot read properties of undefined (reading 'type')` beim Flight-Stringify. Zweiter Lauf identisch grün; mein Diff berührt den Entity-Pfad nicht. Passt zum bekannten SSG-DB-Contention-Muster (next.config-Kommentar, Report 144 § B.3) — beobachten, falls es auf Vercel wieder auftaucht.
- Dev-Server: alte node-Prozesse geprüft (keine), EIN `npm run dev`, ein Is-it-up-Check: `GET /map → 200`. Visuelles Eyeballing macht Philipp (Manual-verify-Präferenz).
- Nachtrag (Popup-Umbau): `npm run typecheck` + `npm run lint` erneut — pass; Dev-Server lief weiter (HMR).
- Manuell offen (Philipp im Browser): Pan/Zoom/Pinch, Staub-/Census-Filter, Linked-records-only, Suche, Kurse + Karten, Welt-Popup (Buch→Kapelle über der Karte, Episode→Show-Halle, `/welt/`-Link), Hash-Restore, Ouvertüre→Kartusche, Lumen/Nihilus, Direction-Panel-Proben, reduced-motion.

## Nachtrag (gleiche Session): Welt-Popup mit Blurb + Aufklapp-Werkliste

Philipps Zuruf nach dem ersten Eyeballing-Durchgang:

- **Blurb zuerst:** Das Popup öffnet jetzt mit dem kuratierten Ein-Satz-Blurb der großen Entity-Ansicht (gleiche Quelle: `scripts/seed-data/location-blurbs.json` via `@/lib/blurbs`, serverseitig in den Payload aufgelöst — `FeaturedWorld.blurb`). Fehlt einer, steht wörtlich **„empty. add later"** (gedimmt, Klasse `pp-blurb missing`) — der Platzhalter für Philipps Blurb-Agenten.
- **Werkliste eingeklappt:** Darunter die Zeile **„Literature & podcasts — N"** (Caret dreht beim Öffnen); Klick zeigt die **ersten 5** Einträge (Rollen + via bleiben), darunter **„All N records →"** — bei verlinkter Location ein Link auf `/welt/{loc}` (die große Ansicht öffnet als Modal über der Karte), ohne Location klappt er die volle Liste im Popup aus. Der alte „Open the record →"-Footer ist darin aufgegangen.
- Disclosure-State ist per Welt-id gekeyt — jede neue Selektion startet eingeklappt, ohne Effect (Lint-konforme derived-state-Muster).

**Worklist für den Blurb-Agenten** (Stand heute): 130 von 154 Werk-Welten haben einen Blurb; **24 zeigen den Filler**. 23 davon über fehlende Einträge in `location-blurbs.json` erreichbar: `cao_quo, damask, dasht_i_kevar, dulma_lin, durer, eechan, gnostes, gravalax, gryphonne_iv, halo_stars, heletine, kronus, lastrati, machorta_sound, miral, parmenio, periremunda, quadravidia, rezlan_vi, saltire_vex, vior_los, viridia, vraks_prime`. Die 24. (`badab`) hat **keine locationId** — über location-blurbs nicht anbindbar; braucht entweder eine Kurations-Verlinkung in der Excel oder bleibt Filler.

## Nachtrag 2 (2026-07-06): Referenzkarten-Vermessung, Dust klickbar, Popup-/Census-Polish

**Popup & Readout:**

- SSOT-Koordinaten sind Kurations-Interna → `pp-coords`-Zeile aus dem Welt-Popup entfernt; der Cursor-Koordinaten-Readout unten links zeigt nur noch `MAG` (ChartStage ohne `coordsRef`, `gridToSsot`-Import raus).
- Popup-Typo deutlich hochgezogen (Philipp: „WAY too small"): Breite 304→344px, Name 27→31px, Klassifikation 15→17px, Blurb 14.5→17px, Werkliste 15→16.5px, Mono-Zeilen 10→11.5px.

**Alle 1054 Kontakte klickbar:**

- `DustWorld`-Tupel um `id, name, segIdx` erweitert (`payload.segs` neu); `catalogSource(payload)` synthetisiert Dust-Details (n=0, works=[]) — Popup, Hash-Restore und Seek decken jetzt alle 1054 Welten ab (Seek-Rangfolge: exakt featured > exakt dust > partial featured > partial dust).
- DustLayer: pro Welt `<g class="cg-w dust" data-pin>` mit Hit-Halo (r 9) + `cg-lbl t2 dust`-Label (nur Band 2 / Hover — Philipp: „zero zoom fine as it is"); `dustScatter`-Ranges sichtbar angehoben (gleicher LCG-Stream, nur Output-Mapping — Studien-Parität bewusst gebrochen).
- Pin-**Namen sind klickbar**: `.cg-lbl` verliert `pointer-events:none`; die Band-Regeln, die Labels ausblenden, schalten `pointer-events` mit ab (unsichtbarer Text stiehlt keine Klicks).
- Popup n=0: Tele „Contact logged", Blurb/Filler, stille Zeile „No recorded literature yet" statt Aufklappliste.

**Census verständlicher (Philipp: Legende erklären):**

- Drei Anzeige-Schalter als Block oben unter Caption „Display", jeweils mit Erklär-Untertitel (worksOnly: „hide everything without books or podcasts"; Star-dust: „faint dots: no linked work in the archive yet"; Reveal: „show every recorded world even at wide zoom"); Gruppen unter Caption „Census — by classification", **nach Population sortiert** (Sortierung über Gesamtzählung, springt beim worksOnly-Flip nicht). Unclassified-Gruppe trägt „no classification in the source census".

**Segment-Keile + Warpstürme nach den Referenzkarten vermessen (`design/beispiele/`):**

- Messskript (Scratchpad, sharp): Registrierung der SSOT auf „wh40k galaxy map - small.jpg" per **Helligkeits-Maximierung über alle 1041 Weltpositionen** (uniforme Skalierung, keine Rotation — die Kuration wurde erkennbar auf genau dieser Karte abgenommen): `s = 3.902 px/gu`, Terra = px (1317, 1878), Score +12.7 % vs. Landmarken-Schätzung; Solar-Ring gemessen 481 px = **123.3 gu** (vorher 130 geschätzt).
- Keil-Extraktion: Farbmasken entlang 720 Strahlen, Außenkanten stufen-quantisiert (Rohprofile = flache Plateaus ±3 gu). Ergebnis in `chart-geometry.ts` (`WedgeDef` mit per-Keil-Innenradius): Pacificus 136.5°→225.3° @267.5; Obscurus 225.3°→312.8° @391/429.5; **Ultima 312.8°→406° @609.5/588.5/668/626.5/665.5**; Tempestus 406°→496.5° @400/361/302 mit Innenradius 139 (steht sichtbar vom Solar-Ring ab, wie in der Referenz). `outerR()` kachelt [136.5°, 496.5°); sweepClip + Speichen folgen der neuen Silhouette; SEGS-Wasserzeichen + Jumps auf die Referenz-Labelanker gelegt.
- Warpsturm-Feld aus „ffRmZBo (1).jpeg" (gleiche Karte, 1.08×): Karmesin-Maske → Connected Components → Kovarianz-Ellipsen — 22 gemessene + 3 handvermessene Wolken als statisches Feld. **ZURÜCKGEBAUT (Philipp-Veto, gleiche Session): sah live falsch aus** — bilderbasiertes Nachbauen von Sturm-/Gebietsformen funktioniert nicht; Auge des Terrors + Maelstrom wieder auf dem Studien-Stand (260.3/232.5 bzw. 558.2/409.9). Sturm-/Zonenformen kommen stattdessen über einen **Hand-Kurations-Zoneneditor** (→ Handover, nächste Session). Die **Segment-Keile bleiben** (vermessen, von Philipp nicht beanstandet).
- Verifikation über Debug-Overlays (Keil-Konturen + Sturm-Ellipsen aufs Referenzbild komponiert und Bild für Bild geprüft); Skript + Overlays im Session-Scratchpad (`measure-map.mjs`, `map-measure/debug{1,2}.jpg`) — bewusst nicht im Repo.

Verifikation Nachtrag 2: `npm run typecheck` + `npm run lint` — beide grün (auch nach dem Sturm-Rückbau erneut); `npm run build` vor dem PR.

## Open issues / blockers

- Keine Blocker. Direction-Panel-Rückbau + Festwerte = Mini-Follow-up nach deinem Live-Entscheid (Sturm-Fassung, Rift unrest ja/nein, Veil/Brightness/Grain).
- Der transiente `/fraktion`-Prerender-Fehler (oben) ist nicht kartenbezogen, aber unhübsch — falls er auf Vercel reproduziert, lohnt ein eigener Blick auf `loadEntity`-Robustheit bei Pool-Druck.

## For next session

- **Direction-Entscheid einbrennen:** Panel raus, Gewinnerwerte als Konstanten, ggf. `unrest` fest an/aus.
- **Episoden-Anker-Kompat** (Plan-§, unabhängig shipbar): `loader.ts` + `PodcastEpisodeArchive` um Slug-Match erweitern, dann Popup-Links auf `#ep-<slug>` heben.
- **Vermesser-Modus (K11)** + Worklist + `outputFileTracingIncludes` (Erstnutzung auf Preview-Deploy verifizieren).
- Map-A11y (W7/W8) bleibt geparkt (Entscheid im Plan).
- Mobile-Polish (<900px zeigt nur Chart + Popup; Kartusche ist ausgeblendet) → docs/ui-backlog.md-Kandidat nach dem Eyeballing.

## Rollup-Fakten (für den Koordinations-Pass; brain/** hier unangetastet)

- `/map` läuft jetzt auf `map-worlds-v2` (P14 Teil B geliefert); Alt-Disc + `src/lib/galaxy` + Lab-Prototyp entfernt; `/lab/cartographer`-Route existiert nicht mehr (CSP-Kommentar angepasst).
- Neue Module: `src/lib/map/{load-map-worlds,payload,projection,pin-source,routes,hash}.ts`, `src/components/cartographer/*` (17 Dateien), `55-map.css` neu.
- `/map` ist statisch (kein Admin-Read mehr auf der Route); SSOT-Pixelraum ⇄ Grid friert in `projection.ts` (Drift-Kommentar gegen `grid.transform`).
- SiteBrand zeigt sich wieder auf `/map`; Desktop-Nav dort per Burger.

## References

- Design-Referenz: `design/08-cartographer/i-maledictum.html` (Runde 5) + `design/08-cartographer/README.md`.
- Plan-File: `~/.claude/plans/map-neubau-cartographer-f-r-chrono-lexic-jaunty-parrot.md` (Brief 178, Phase 2).
- React 19 Compiler-Lint-Regeln (react-hooks/refs, set-state-in-effect) — Grund für die Ref-Muster-Umbauten.
