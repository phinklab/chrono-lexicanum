# UI backlog

Visual polish items spotted across sessions but deliberately deferred — to be
cleared in a dedicated cleanup session rather than fixed piecemeal alongside
unrelated work. New items at the top; cross out / remove when the cleanup
session ships them.

Differences from neighbouring docs:

- **Carry-over** in `sessions/README.md` is for things the **next** architect
  brief MUST address — algorithm changes, data corrections, schema gaps.
- **Ideas Backlog** in `ROADMAP.md` is for future features that aren't yet
  committed to a phase.
- **UI backlog** (this file) is for cosmetic polish — labels, spacing, hover
  states, animations — that doesn't change behaviour and can wait for a
  batched touch-up.

## Open

- **Globaler Focus-Reset frisst alle Focus-Ringe** (2026-07-08, Session 185).
  `10-base.css` setzt `:focus, :focus-visible { outline: none !important; }` —
  damit sind sämtliche späteren `:focus-visible`-Overrides ohne `!important`
  tote Regeln (`main.entity`/`main.podcasts` in 59/62, die Gold-Outlines in
  56-media-player). Tastatur-Nutzer sehen keinerlei Fokus. Fix braucht eine
  Design-Entscheidung (Gold-Hairline-Ring sitewide?) und einen Sichtdurchgang,
  deshalb nicht im 185er-Sweep erledigt.
- **SiteLegal-Zeile: vorläufiger Platz unter dem MediaPlayer** (2026-07-02,
  Impl 179). Die site-weite `IMPRESSUM · DATENSCHUTZ`-Mono-Zeile (`SiteLegal.tsx`,
  fixed unten links, 9px, faint) ist ein vorläufiger Philipp-Entscheid für die
  footerlosen Desktop-Flächen (Map/Timeline/Entities). Polish-Optionen laut
  Impl-Report: gestalteter Slot im Rail-Fuß oder Entity-Footer. Beim 178er-
  Map-Neubau prüfen, ob sie mit Map-Chrome unten links kollidiert.

## Shipped in Session 185 (2026-07-08)

- ~~MediaPlayer: rAF-Tick läuft auch idle/paused~~ — rAF nur noch bei Playback
  + sichtbarem Tab; idle atmet per CSS-Opacity.
- ~~/archive: FilterSelect-Hover ohne Text-Farbantwort~~ — obsolet: der zitierte
  `body:has(main.catalogue)`-Override existiert seit dem 184er-Redesign nicht
  mehr; der Hover antwortet heute mit Bone-Text + Gold-Underline.
- ~~/archive: Filter-Controls-Wrapping auf schmalen Phones~~ — 2-Spalten-Grid
  ≤720px, Sort/Chips in voller Breite, 44px-Targets.
- ~~/archive: Empty-State-Copy in Haus-Stimme~~ — umformuliert (Werke +
  Podcasts); die Fläche war seit 184 bereits italic Serif ohne Box.
- ~~/archive/podcasts: Filter-UI bei trivialem Datensatz~~ — rendert nur noch
  bei `episodes.length > 10 || presentKinds.length > 1`.
- ~~/compendium: Eyebrow- vs. Heading-Shadow inkonsistent~~ — obsolet: seit dem
  184er-Redesign tragen Eyebrow, Heading und Edition reine Black-Drops.
- ~~Timeline: `#d8d2c2`-Magic-Value tokenisieren~~ — als scoped
  `--parchment-sel`/`--ink-on-sel` im `.chron`-Palettenblock gehoben.
- ~~MediaPlayer auf Mobile wieder einführen~~ — Vox-Stud-Konzept: 44px-Glyph
  bottom-right, expandiert zur Glass-Karte; weicht per `body.on-chron` dem
  Chronicle-Sheet und sitzt auf der Map oben links (`body.cg-on-map`).

> **Obsoleted 2026-05-31 — "Series-label crowding in EraDetail" (spotted 2026-05-02).**
> The item described the old `EraDetail` track-packing surface and its
> `.series-label` placement. Both are gone: the dormant `EraDetail`/`Overview`
> timeline components were retired in the component-retirement pass (their CSS had
> already been removed in CSS-Konsolidierung Pass 1, PR #116). The live `/timeline`
> renders the Chronicle suite (`src/components/timeline/chronicle/*`), whose lane
> layout supersedes the old track packing — any label-crowding polish for the
> Chronicle would be filed fresh against those components.
