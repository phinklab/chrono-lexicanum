---
session: 2026-06-13-150
role: implementer
date: 2026-06-13
status: complete
slug: polish-sweep
parent: 2026-06-12-150
links:
  - 2026-06-12-150
commits: []
---

# Polish-Sweep — Content-Warnings raus, Fraktions-Icons, Loading-Transparenz, Login-BG + Credit-Slot

## Summary

Alle vier Punkte sind umgesetzt: Content-Warnings sind aus jeder Besucher-Oberfläche gefiltert (zentral, eine Stelle), der Punkt-Marker vor Buch-Einträgen ist ein Fraktions-Klassen-Sigil (Aquila / Astartes-Helm / Klaue / Chaosstern), der Cogitator-Loader liegt jetzt auf durchscheinendem Grund, und `/login` trägt das neue Artwork (final: Philipps eigenes) mit einem generalisierten, wiederverwendbaren Credit-Slot. Wichtigster Fakt für Cowork: Die admin-gegateten DB-Spiegel (`/atlas/facets`, `/buch/[slug]/audit`) filtern **nicht** — Begründung unter „Decisions".

## What I did

**Punkt 1 — Content-Warnings raus**

- `src/lib/facet-visibility.ts` — NEU: zentrales `HIDDEN_FACET_CATEGORIES`-Set (`content_warning`) + `isVisibleFacetCategory()`. Die einzige Stelle, die entscheidet, welche Facet-Kategorien die UI erreichen.
- `src/lib/book/loadBook.ts` — Facet-Rows durch den Filter; deckt `/buch/[slug]` UND den `@modal/(.)buch`-Overlay (beide teilen diesen Loader).
- `src/app/archive/loader.ts` — Facets im Map-Schritt gefiltert; deckt die `/archive`-Tagrows, die Typeahead-Suggestions (`buildSearchIndex`), den Freitext-Haystack und den Active-Facet-Chip in einem (alle lesen `BrowseBook.facets`).
- `src/app/buecher/page.tsx` — gleicher Filter im Legacy-Maintainer-Katalog.
- `src/lib/timeline.ts` — veralteten Doc-Kommentar korrigiert (der dort beschriebene Facet-Loader existiert nicht mehr; kein Code-Pfad).

**Punkt 2 — Fraktions-Icons**

- `src/lib/faction-icon.ts` — NEU: zentrales Mapping `factionIconClass()` (die „kleine, zentrale Stelle" aus dem Brief). Liest `factions.alignment` + `factions.parent_id`, die die DB seit dem Seed trägt (gleiche Quelle wie `src/lib/seed/alignment.ts`): alignment `imperium` + direkt unter `adeptus_astartes` → **Space Marines**; sonst alignment `imperium` → **Imperium**, `chaos` → **Chaos** (Traitor-Legionen unter `heretic_astartes` landen hier — ein Word-Bearers-Buch liest sich als Chaos, nicht als Space Marines), `xenos` → **Xenos**, `neutral`/unbekannt → `null` = Fallback-Punkt. Dazu `primaryRowFaction()`: die `work_factions.role='primary'`-Fraktion entscheidet den Marker, sonst die erste.
- `src/components/chrome/FactionClassIcon.tsx` — NEU: vier solide Inline-SVG-Sigils (24er-ViewBox, `currentColor`), Fallback-Dot via `.fci--none`. Aria-hidden + `title`-Tooltip wie der alte Punkt.
- `src/app/archive/loader.ts` + `src/app/buecher/page.tsx` — Loader holen jetzt `role`/`alignment`/`parentId` mit (drei kleine Spalten); beide Row-Renderer ersetzen den Dot-Span durch das Icon.
- `src/app/styles/31-catalogue.css` — `.catalogue-row__dot`-Regeln durch `.fci`-Block ersetzt (15px-Zelle, Klassen-Tints: Gold / Steel `#8a9cb0` / Grün `#79a16b` / Rot `#a83a32`); die `is-audio-dim`-Schrumpfregel zielt jetzt aufs Sigil.

**Punkt 3 — Loading-Transparenz**

- `src/app/styles/65-loading.css` — `.cogitator-loading` Hintergrund von opakem `var(--cl-void)` auf `color-mix(in srgb, var(--cl-void) 45%, transparent)`. Eine Regel deckt alle acht `loading.tsx`-Routen (alle rendern `CogitatorLoading`). Auf `/compendium` scheint die Scriptorium-Vista des Layouts durch; Routen ohne Layout-Vista sitzen auf dem Void-Body und sehen aus wie vorher.

**Punkt 4 — Login-BG + Credit-Slot**

- `public/img/login.webp` — erzeugt aus `Downloads/BG_login.png` via sharp nach dem 145er-Muster (2400px, q78). Philipp hat das Artwork über die Eyeballing-Runden zweimal überarbeitet (gleicher Dateiname, 2460×1440; finale Fassung mit fast rein schwarzem linkem Drittel als Standfläche für die Konsole); committed ist die **dritte** Konvertierung → 2400×1405, **157 KB**. Quelle bleibt lokal (wie hub.webp & Co.: one-off konvertiert, WebP committed).
- `src/lib/art-credits.ts` — NEU: `ArtCredit`-Shape + Registry **Bild-Ref → Credit** (`"/img/login.webp"` → final „Philipp Künzler" → phinklabs.com, s. Nachschliff). Neue Seite mit Credit = ein Map-Eintrag, fertig.
- `src/components/chrome/ArtCreditTag.tsx` — NEU: der gehobene Credit-Slot (Label/Name/Links), von Timeline UND Site-Backgrounds gerendert.
- `src/components/chrome/SiteBackground.tsx` — schlägt sein Foto in der Registry nach und rendert den Tag mit Modifier `art-credit--site` **außerhalb** des aria-hidden-Backdrops (Links bleiben Tastatur-erreichbar).
- `src/components/timeline/cinematic/CinematicView.tsx` — lokales `EraArtCreditBlock` gelöscht, alle drei Slots nutzen den geteilten Tag (identisches DOM, `.chron`-CSS unverändert → Timeline pixelidentisch).
- `src/lib/chronicle/eraArtCredits.ts` — `EraArtCredit` ist jetzt Alias auf das geteilte `ArtCredit`-Shape.
- `src/app/styles/41-site-bg.css` — `.art-credit--site`: fixed unten rechts, Mono/Tracking-Grammatik des Timeline-Slots in Site-Tokens, Hover/Focus-Gold, `:focus-visible`-Ring, Mobile-Offsets. Keine Animation → reduced-motion-neutral; Kontrast sitzt auf dem Login-Bottom-Gradient (94% Void unten).

**Nachschliff auf Philipps Feedback (gleiche Session, Eyeballing-Runde 1)**

- **„Open full page" raus aus dem Popup** (auf Philipps explizite Anfrage aus Paket 2 vorgezogen): `DetailModal` verliert den Expand-Link samt `canonicalHref`-Prop (einziger Konsument), die fünf `@modal`-Intercepts (Buch + 4 Entities) verlieren den Prop und die jetzt unbenutzten `entityHref`-Imports, der tote `data-detail-hardnav`-Escape im Click-Capture und der `.detail-modal__expand`-CSS-Block sind mit raus. Die Bar zeigt nur noch Back + ×. **Nur das Popup-Affordance ist weg — die kanonischen Fullpages bleiben** (Einschätzung unter „Decisions").
- **Space-Marines-Sigil v2**: Frontalhelm → Seitenprofil-Silhouette (Mk-VI-„Beakie": Dome, Schnabel, schräger Augen-Lens-Cutout), Blickrichtung rechts in die Zeile. Frontal las sich bei 15px zu generisch.
- **Login-Layout v2 (Runde 2, „nicht so rangezoomed + Login links übers Dunkle")**: ab 960px zeigt `/login` das Artwork **ungecroppt** — `background-size: contain` statt `cover`, verankert **rechts-unten**, sodass die hellen Bildkanten (Boden, rechtes Regal) bündig am Viewport liegen und nur die nahschwarzen Kanten (Gewölbe oben, Regalsäule links) ins Void auslaufen. Der Restraum sammelt sich links als Void; `main.login` geht dort auf `justify-content: flex-start`. `background-position` kommt inline aus `<SiteBackground>`, daher ein scoped `!important` (kommentiert). Unter 960px unverändert Cover + zentrierte Konsole. Alles in `68-login.css`.
- **Login-Feinschliff (Runden 3–4)**: Die contain-Restkante links war Philipp zu sichtbar — statt das Bild auf 2:1 zu verbreitern, liegt jetzt ein **Links→Rechts-Void-Gradient** im Desktop-`::after`-Stack (voll bis ~22 %, ausgelaufen bei 58 % — deckt die Kante bei jedem Fensterformat von 16:9 bis Ultrawide). Dazu: Boden-Gradient auf minimal (30 % statt 94 % Void unten, Ansatz bei 72 % — der beleuchtete Marmorboden bleibt sichtbar), Titel ohne Mittelpunkt („Chrono Lexicanum"), Konsole einen Tick weiter rechts (`padding-left: clamp(64px, 12vw, 240px)`), Credit-Tag von 9/12px auf das Timeline-Maß gehoben (Label 10px, Name 14px, Links 10px).
- **Credit umgewidmet (Abweichung von der Brief-Acceptance, von Philipp selbst entschieden)**: Das finale Login-Artwork ist Philipps eigenes — der Credit lautet „Philipp Künzler" → `phinklabs.com`, nicht das im Brief genannte „bubondubon" → Reddit. Mechanismus unverändert (ein Registry-Eintrag in `art-credits.ts`).
- **Runde 5 (über den Brief hinaus, direkte Philipp-Ansagen)**: (a) `/archive`-Buchtitel 16px → **18px** (Cinzel läuft optisch klein; 16px war in den dichten Rows schwer lesbar). (b) **Cartographer-Backdrop getauscht + abgedunkelt**: `public/img/cartog-holo.webp` neu aus `Downloads/map_bg.png` (2560×1440 → 2400×1350, **73 KB**, gleiches sharp-Muster; Motiv jetzt Holo-Dais-Kammer) und via `.map-route .site-bg__photo { filter: brightness(0.55) }` in `55-map.css` deutlich gedimmt — brightness statt Void-Wash, damit der Dais-Glow lebt und das Galaxie-Hologramm das Hellste der Seite bleibt. Hinweis für Cowork: Der Brief listete „Map unverändert" unter Out of scope — das hier ist reine Backdrop-Optik ohne Map-Logik, von Philipp im Eyeballing direkt beauftragt.
- **Runde 6 — Login-Credit final + Map-Chrome in die Gold-Sprache (wieder direkte Philipp-Ansagen, Map über Brief-Scope hinaus)**:
  - **Credit**: Name jetzt **„piwireddit"**, Links **PHINKLABS** (ohne `.COM`) → phinklabs.com und neu **REDDIT** → `reddit.com/user/piwireddit` (ersetzt die Runde-4-Fassung „Philipp Künzler"; reiner Registry-Edit in `art-credits.ts`).
  - **Map-Chrome trägt jetzt die Gold-Sprache** (64-detail-modal.css / Brief 131: kein gezeichneter Rahmen, Tiefe = Schatten + Bone-Licht-Kante, einzige Linie = Terminus-Gradient-Hairline, Gold nur Text/Hover/Fokus): Die vier **Eckenornamente sind raus** (`CornerOrnament.tsx` gelöscht, `cornerStyle` aus dem `Theme`-Typ + beiden Paletten entfernt). **Borderlines entfernt** an Back-Button (jetzt transparenter Mono-Textbutton mit Hover-Gold wie `.detail-modal__back`), Zoom-Buttons (Bottom-Hairline → Hover-Grund), EraSwitcher (Box-Border weg, Era-Akzentbalken bleibt als einzige Kante; Trennlinien → Terminus-Hairlines; Coming-soon-Chip rahmenlos) und Gear-Button.
  - **Einstellungs-Popup redesignt** (`tweaks/styles.ts` komplett neu): rahmenlose Detail-Modal-Fläche, Terminus unterm Header, Cinzel-Titel, Space Grotesk raus → Plex-Mono-Labels + Cormorant-Italic-Hints, alle Controls entkantet (Select nur Bottom-Hairline, Toggle/Segmented/Buttons rahmenlos, Slider-Thumb ohne Ring).
  - **Planeten-Popup (WorldPanel) redesignt**: Drawer ohne `borderLeft` (Detail-Modal-Fläche + Licht-Kante auf der Anschlagkante), Header/Sections mit Terminus-Hairlines statt solider/gestrichelter Borders, Buchkarten rahmenlos (zarter Gold-Grund + Inset-Licht-Kante), Close-× rahmenlos mit Hover-Gold.
  - **Gelb-Wash der Ausgangskarte halbiert**: `mapDiscGrad` 0.22/0.08 → 0.10/0.04 und `mapAstronomicanGrad` 0.72/0.46/0.18 → 0.38/0.24/0.10. Diagnose: beide Washes faden beim Dive auf 0 — deshalb sahen gezoomte Sektoren gut aus, die Galaxie-Übersicht aber gelb zugekleistert. Bewegte Elemente (Radar-Sweep, Ping, Scanlines, Flicker, Motes) unverändert auf Philipps Ansage.
- **Runde 7 — Map-Nachschärfung („Gold liegt immer noch über den Segmenten, Hintergrund zu präsent, Glow am Add-Element hässlich")**:
  - **Disc-Wash ganz entfernt statt weiter gedimmt**: `mapDiscGrad`-Def + der Outer-reach-Glow-Pfad in `DiscWedges` sind gelöscht — auch halbiert las sich die Fläche noch als Goldfilm. Der Disc-Grund trägt sich jetzt über Sterne/Arme/Strokes. Dazu Wedge-Ruhefüllung 0.06 → **0.02** (Hover bleibt 0.12 — Gold nur als Hover, die Sprache) und der rotierende Sweep-Fächer 0.35/0.10 → **0.16/0.05** (die Sweep-Linie selbst unverändert präsent).
  - **Backdrop `brightness(0.55)` → `0.3`** in `55-map.css` — die Kammer ist nur noch Ahnung, das HUD steht allein vorn.
  - **Add-Element-Panel**: der `0 0 30px primarySoft`-Gold-Halo ist raus (Philipps No-Glow-Ästhetik), Border mit weg — Fläche jetzt das Gold-Sprache-Rezept (Detail-Modal-Gradient + dunkler Drop + Bone-Licht-Kante) wie Tweaks-/World-Panel.
- **Runde 8 — Solar als echtes Segment, Doppellinien weg, Necron-Rückbau, Nameplates entkernt**:
  - **Segmentum Solar ist jetzt ein vollwertiges Segment**: klickbarer `<circle>` in `DiscWedges` mit derselben Ruhe-Füllung (0.02), demselben Gold-Hover (0.12) und Stroke wie die vier Wedges — vorher war Solar nur übers kleine HTML-Label klickbar („man muss genau in die Mitte klicken"). `<circle>` statt `wedgePath`, weil der bei 0–360° degeneriert.
  - **Die „2 Linien" um Solar**: waren (a) das Akzent-Band an der Wedge-Innenkante (`wedgePath(inner, inner+0.005)`) und (b) der Boundary-Kreis der Core-Gruppe, dazu der 0.18er-Grid-Ring exakt auf der Grenze. Alle drei entfernt — die Grenze zeichnet jetzt genau eine Linie (Wedge-Outlines + Solar-Kreis, deckungsgleich). Core-Gruppe (Glow + Sol-Punkt) auf `pointerEvents: none`, damit sie den neuen Solar-Klick im Zentrum nicht abfängt.
  - **Mephrit + Nihilakh Dynasty entfernt**: aus `NECRON_DYNASTIES_BASE` gestrichen UND als `RETIRED_NECRON_IDS`-Tombstone-Filter in `loadElementsFor` (storage.ts) — /map hydratisiert Element-Snapshots aus localStorage (Read-only seit Demo-Lock 2026-05-27), ein reiner Default-Rückbau hätte sie in jedem Browser mit gespeichertem Snapshot am Leben gelassen. Sautekh bleibt.
  - **Planeten-Nameplates (PlanetTooltip) entkernt**: Fraktionsfarben-Border, vier Corner-Brackets, `0 0 18px`-Halo, Text-Glow und der umrandete Caret-Pfeil sind raus — dunkle Platte (Detail-Modal-Gradient) mit dunklem Drop + Bone-Licht-Kante, Fraktionsfarbe nur noch im Namenstext. Gilt automatisch auch für die Landmark-Tooltips (geteilte Komponente). Die ruhenden Welt-Labels tauschen ihren farbigen Text-Glow gegen einen dunklen Schlagschatten.
  - **Backdrop `brightness(0.3)` → `0.18`** — dritte Stufe, die Kammer ist jetzt reine Ahnung.

## Decisions I made

- **Admin-Flächen filtern nicht.** `/buch/[slug]/audit` und `/atlas/*` sind beide `getIsAdmin()`-gegated (404 für Besucher, Proxy-401 in Prod) und existieren als ehrliche DB-Spiegel. Content-Warnings dort auszublenden hieße, dem Maintainer den DB-Zustand zu verschweigen, den Brief 149 gerade abräumt. Lesart der Acceptance: „Keine Route rendert Content-Warnings" = keine *Besucher*-Route; sobald 149 die Daten löscht, sind auch die Admin-Spiegel leer. Falls Cowork die strikte Lesart will: ein `isVisibleFacetCategory`-Filter an zwei Stellen, fünf Minuten.
- **Filter sitzt in den Loadern, nicht in den Views** — eine Kategorie-Entscheidung, vier Konsumenten (Chips, Tagrows, Suche, Haystack) erben sie automatisch; keine View kann sie vergessen.
- **Heretic Astartes → Chaos, nicht Space Marines.** Die vier Klassen aus dem Brief decken Traitor-Legionen nicht explizit; thematisch sind sie Chaos. Der Astartes-Test greift nur bei alignment `imperium`.
- **Marker-Fraktion = role 'primary', sonst erste.** Vorher entschied die alphabetisch erste Fraktion den Dot (und die Faction-Spalte der Row); jetzt gewinnt die kuratierte primary-Rolle, wo vorhanden. Die Faction-Spalte zeigt entsprechend dieselbe Fraktion wie das Icon.
- **Solide Silhouetten statt Hairline-Strokes** bei 15px — Strokes vermatschen in der Größe; Akzent kommt aus dem Tint, kein Glow (House-Aesthetic).
- **45% Void-Tint statt voll transparent** beim Loader — über hellen Foto-Stellen (Scriptorium-Fenster) bliebe die Litanei sonst unlesbar.
- **Timeline-Credits: Rendering migriert, Daten nicht.** Antwort auf die Open Question des Briefs: die Era-/Event-Keyed-Maps bleiben eigenständig (Artwork wechselt pro Slide, Keying nach Era-Id/Event-Spalten ist dort richtig), aber das Markup ist jetzt eine gemeinsame Komponente — „Rendering einheitlich" ist damit erfüllt, Migration der Daten-Maps lohnt nicht.
- **`factionDot`/`faction-colors.ts` bleibt** — Compendium-Entity-Rows und Atlas-Tabellen nutzen es weiter; nur die Buch-Rows sind aufs Sigil umgestellt.
- **Fullpages bleiben, obwohl ihr Popup-Link weg ist** (Philipps Frage „können wir die ganzen Fullpages rausnehmen?"): Nein, solange das Popup echte URLs trägt. Die `@modal`-Intercepts greifen nur bei Soft-Nav — bei offenem Popup IST die URL `/buch/<slug>`, und F5, geteilter Link, Bookmark, Ctrl-Klick/„in neuem Tab öffnen" und jeder Crawler laden diese URL hart → ohne kanonische Route wäre das ein 404. Außerdem hängen die per-Buch-OG/Share-Metadaten (`generateMetadata`, Report 144 § P.7, launch-relevant) an der Fullpage; die Entity-Fullpages sind SSG. Die Wartungskosten sind ~null: dünne Wrapper um dieselben `BookDetailView`/`EntityView`, die auch das Popup rendert (Zero Fork). Wirklich loswerden ginge nur, wenn das Popup auf searchParam-State (`?book=…`) umzieht — das opfert saubere Share-URLs + SEO und ist eine Architect-Entscheidung für Paket 2, keine Polish-Maßnahme.

## Verification

- `npx tsc --noEmit` — grün.
- `npm run lint` — grün.
- Dev-Server sauber neu gestartet (alte Instanzen gekillt, `.next` gelöscht), `/login` → 200. Browser-Eyeballing per Konvention bei Philipp: `/archive` (Icons + keine CW-Tags in den Tagrows), `/compendium` (Loader-Transparenz, Cold-Cache am ehesten nach Server-Restart), `/login` (Artwork + Credit), `/timeline` (Credits unverändert), `/buch/<slug>` (FACETS-Zeile ohne Warnings).
- Nicht ausgeführt: kein Headless-/Route-Sweep (Konvention), kein `next build`.

## Open issues / blockers

- **Prod-Datacache:** `loadBook` cached per Slug im persistenten Data Cache (Tag `books`). Bereits gecachte Buch-Payloads tragen die CW-Facets bis zur Revalidierung — nach dem Deploy einmal `POST /api/revalidate` (Tag `books`) feuern, dann ist auch der Cache sauber.
- Deep-Links auf einen CW-Facet-Filter (`/archive?facet=<cw-id>`) zeigen jetzt korrekt „No works match" — der Chip fällt auf die rohe Id zurück, weil der Name nicht mehr im Index liegt. Bewusst so gelassen (Anzeige ersatzlos gestrichen).

## For next session

- **Map-Design: Philipp will perspektivisch nochmal ran.** Die Eyeballing-Runden 6–8 haben das /map-Chrome in die Gold-Sprache gezogen (Ornamente/Borders/Glows raus, Popups redesignt, Gelb-Washes raus, Solar klickbar, Backdrop auf 0.18) — Philipps Abnahme war „passt schonmal", explizit als Zwischenstand. Ein dedizierter Map-Design-Pass (kohärenter Look statt akkumulierter Einzel-Fixes) wäre ein eigener Brief-Kandidat.
- Die vier Sigil-Pfade sind handgezeichnet — falls Philipp beim Eyeballing eine Form nicht mag (Kandidat: die Aquila, schwierigste Form bei 15px), ist das ein reiner Pfad-Tausch in `FactionClassIcon.tsx`.
- `eras.json`-Kommentar in `SiteBackground` („gilded archive hall") war veraltet und ist mitgezogen; die übrigen Varianten-Beschreibungen stimmen noch.
- Wenn Brief 149 die CW-Daten löscht, kann `facet-visibility.ts` bleiben (kostet nichts, schützt vor Re-Ingest) — oder im Zuge des Paket-2-Rückbaus mit raus.

## References

- sharp-Konvertierung nach `scripts/convert-bg-images.ts`-Muster (2400px / q78 / effort 6).
- Fraktionsbaum: `scripts/seed-data/factions.json` (Loyalisten direkt unter `adeptus_astartes`, Traitor-Legionen unter `heretic_astartes`).
