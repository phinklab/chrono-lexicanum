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

- **/archive: FilterSelect-Hover ohne Text-Farbantwort auf der Gold-Surface**
  (2026-06-11, Session 141). `body:has(main.catalogue)` override färbt nur die
  Border gold (`61-browse.css:529-531`), der Button-Text bleibt bone — `.is-set`
  (`:538`) zeigt das Soll. Einzeiler: `color: var(--cl-gold);` ergänzen.
- **/archive: Filter-Controls-Wrapping auf schmalen Phones** (2026-06-11, Session
  141). `.filter-select { flex: 1 1 auto }` (`61-browse.css:470`) bricht bei vielen
  Facets in unkontrolliertes Zwei-/Drei-Zeilen-Chaos; `flex: 1 1 48%` oder ein
  2-spaltiges Grid macht das Wrapping ruhig.
- **/archive: Empty-State-Copy in Haus-Stimme bringen** (2026-06-11, Session 141).
  „No books in the database yet" / „The database is empty…" (`archive/page.tsx:174-212`)
  spricht Tech-Register, während der Footer derselben Seite Latein spricht
  (`EX TENEBRIS COGNITIO`). Umformulieren ins Archiv-Register, italic Serif statt Box.
- **/archive/podcasts: Filter-UI bei trivialem Datensatz ausblenden** (2026-06-11,
  Session 141). Die `.pod-filter`-Section rendert bedingungslos
  (`PodcastEpisodeArchive.tsx:246`); bei 1 Show / 1 Kind steht ein Suchfeld + leere
  Pill-Row im Raum. Konditionalisieren (z. B. `episodes.length > 10 || presentKinds > 1`).
- **/compendium: Eyebrow- vs. Heading-Shadow inkonsistent** (2026-06-11, Session 141).
  Eyebrow hat nur den schwarzen Drop (`66-compendium.css:127`), das Heading trägt
  zusätzlich den Cyan-Halo (`:140`) — nach dem Glow-Abbau (Report § A.4) beide auf
  reinen Black-Drop vereinheitlichen.
- **Timeline: `#d8d2c2`-Magic-Value für Selected-States tokenisieren** (2026-06-11,
  Session 141). Der invertierte Parchment-Chip (`67-chronicle-cinematic.css:93`)
  lebt als Literal; bei der Token-Konsolidierung als `--parchment-invert` o. ä. heben
  (auch `/lab/design` § Bausteine nutzt den Wert dokumentiert).

- **MediaPlayer auf Mobile wieder einführen** (2026-06-11, Session 140 Follow-up).
  Der globale MediaPlayer (fixed bottom-left, z 40) ist auf Mobile (`max-width:
  760px`, `56-media-player.css`) komplett ausgeblendet — Interim-Entscheidung von
  Philipp, weil der Block mit Mobile-Flächen kollidierte (v. a. das
  Chronicle-Bottom-Sheet auf `/timeline`). Hier braucht es ein echtes
  Mobile-Konzept (Mini-Glyph? einklappbar? per-Route ausweichen?) statt des
  Hides; bis dahin gibt es auf Mobile keinen Audio-Zugang.

> **Obsoleted 2026-05-31 — "Series-label crowding in EraDetail" (spotted 2026-05-02).**
> The item described the old `EraDetail` track-packing surface and its
> `.series-label` placement. Both are gone: the dormant `EraDetail`/`Overview`
> timeline components were retired in the component-retirement pass (their CSS had
> already been removed in CSS-Konsolidierung Pass 1, PR #116). The live `/timeline`
> renders the Chronicle suite (`src/components/timeline/chronicle/*`), whose lane
> layout supersedes the old track packing — any label-crowding polish for the
> Chronicle would be filed fresh against those components.
