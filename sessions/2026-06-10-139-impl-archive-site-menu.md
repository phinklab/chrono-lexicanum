---
session: 2026-06-10-139
role: implementer
date: 2026-06-10
status: complete
slug: archive-site-menu
parent: none (CC-direct session, Auftrag von Philipp im Chat; berührt Brief 138)
links: []
commits:
  - d293c11 # Paket 1 — Archive-Merge
  - (Paket 2 — SiteMenu; der Commit, der diesen Report trägt)
---

# Archive-Merge (/werke + /podcasts → /archive) + globale Burger-Navigation

## Summary

Werke + Podcasts sind jetzt EIN Navigationspunkt „Archive" mit BOOKS/PODCASTS-Toggle-Pill
(`/archive` = Books, `/archive/podcasts` = Show-Index, `/archive/podcasts/[slug]` = Show-Archiv;
alte Routen 308-redirected, `#ep-`-Deeplinks und `workHref()` mitgezogen), und die
Burger-Navigation aus dem Design-Export läuft als globales App-Shell-Chrome auf Layout-Ebene.
Wichtigster Punkt für Cowork: **`/archive?focus=<workId>` existiert jetzt** (Buch-Popup über dem
Katalog, Compendium-Muster) — das ist das vorgezogene Brief-138-Deliverable; es gibt noch keine
Emitter, die Timeline-Chips aus 138 können direkt darauf verlinken.

## What I did

**Paket 1 — Archive-Merge (Commit d293c11):**

- `src/app/werke/*` → `src/app/archive/*`, `src/app/podcasts/*` → `src/app/archive/podcasts/*`
  (git mv, 87–100 % Similarity; Symbolnamen wie `WerkeFilters`/`toWerke` bewusst unangetastet).
- `next.config.ts` — `redirects()` neu: `/werke→/archive`, `/podcasts→/archive/podcasts`,
  `/podcasts/:slug→/archive/podcasts/:slug` (alle `permanent: true`). Query-Strings reicht Next
  automatisch weiter; `#ep-`-Fragmente trägt der Browser über den 308 (Server sieht sie nie) —
  Deeplink-Anforderung (a) damit auch für Hard-Loads erfüllt.
- `src/lib/entity/loader.ts` — `workHref()`: podcast → `/archive/podcasts/<slug>`,
  podcast_episode → `/archive/podcasts/<showSlug>#ep-<workId>` (Anforderung b).
- `src/app/archive/podcasts/loader.ts` — Suggestion-Hrefs (Episode + Show) auf `/archive/...`.
- Link-Sites umgezogen: `TopNav` (zwei Items → ein „Archive"-Item, Match deckt
  /archive·/buch·/werke·/podcasts), `BottomConsole`, `HomeExplore`, `HomeSearch`,
  `PodcastsSearch`, `AskClient`, `ResultCard`, `hrefWith()` in `archive/page.tsx`.
- Import-Sites auf die neuen Pfade: `src/app/page.tsx`, `BrowseSearch`, `PodcastEpisodeArchive`,
  `src/lib/compendium/loader.ts` + die verschobenen Dateien untereinander.
- `src/components/archive/ArchiveModeToggle.tsx` (neu) — Server-Komponente, zwei echte `<Link>`s
  (BOOKS/PODCASTS) mit `aria-current`, Prop `active` von der rendernden Seite. CSS-Block am Ende
  von `src/app/styles/61-browse.css` (Port der design-export mode-toggle-Pill). Gerendert auf
  allen drei Archive-Routen.
- `src/app/archive/loader.ts` — neu `bookSlugById(id)`: eigener Mini-Lookup (id→slug, kind=book,
  try/catch→null) für `?focus=` statt Suche in der gerenderten Liste (Philipps Robustheits-
  Nachtrag: übersteht künftige Filter/Limits am Katalog-Query).
- `src/app/archive/page.tsx` — liest `sp.focus`, rendert `CompendiumFocusOpener`
  (unverändert wiederverwendet) mit `/buch/<slug>`; Metadata-Titel „Works" → „Archive".

**Paket 2 — Burger + Site-Menu (dieser Commit):**

- `src/components/chrome/SiteMenu.tsx` (neu, client) — Burger oben rechts + Full-Screen-Menü;
  Neu-Bau der Export-Semantik (`body.menu-open` → komponenten-scoped `.is-open`). Overlay bleibt
  gemountet (CSS-Stagger braucht das), geschlossen `aria-hidden` + `inert` (React 19).
  Schließen: Escape (Fokus zurück auf Burger), Link-Klick, Routenwechsel. Body-Scroll-Lock +
  Tab-Wrap nach DetailModal-Muster. Gemountet in `src/app/layout.tsx` neben `<TopNav />`
  (additiv — TopNav bleibt).
- `src/app/styles/43-site-menu.css` (neu) + Import in `globals.css` zwischen 42 und 44 —
  Port von chronicle.css §burger: Hairline-Burger mit X-Morph, radialer Void-Gradient,
  Grain-Layer, scaleX-Separatoren, Serif-Namen mit Gold-Hover, Stagger nur unter
  `prefers-reduced-motion: no-preference`. Z: Menü 80, Burger 81 (über DetailModal 70).
- `.gitignore` — `/design-export/` (Ordner war noch untracked, bleibt es jetzt dauerhaft).
- `eslint.config.mjs` — `design-export/**` in `ignores`: ESLint liest kein .gitignore;
  ohne den Eintrag war `npm run lint` (eslint .) rot an 4 Fehlern im Export-JSX.

## Decisions I made

- **URL-Strategie: Routen statt `?view=`-Param.** `/archive` (Books, Default) +
  `/archive/podcasts` als Geschwister-Routen, Toggle = zwei echte Links. URL spiegelt Zustand
  nativ (shareable, Back-Button), eigene Metadata pro View, Podcast-Seiten behalten ihre
  ISR-Shells (`revalidate=3600`) — ein `?view=`-Param hätte eine Seite dynamisch gemacht und
  die Show-Detail-Route trotzdem gebraucht.
- **Books auf `/archive` root, nicht `/archive/books`.** Default-Tab-aufm-Root-Muster: kein
  Redirect-Hop für den Nav-Punkt, kürzere Share-URLs; Asymmetrie der Toggle-Ziele bewusst.
- **Burger ERGÄNZT TopNav** (nicht ersetzt) — „global einbauen" + Brief 138 markiert das Menü
  als App-Shell-Scope; TopNav-Ablösung wäre eine eigene Design-Entscheidung.
- **Toggle-Pill fixed unten rechts** (wie im Export). MediaPlayer sitzt unten LINKS (z 40) —
  Pill auf z 45: über der Player-Wave, unter TopNav (50) und Popups (70). Dunkles Glas hinter
  der Pill ergänzt (der Export schwebt über purem Void, unsere Flächen über Foto-Heroes).
- **`?focus=` löst per `bookSlugById` auf, nicht über die Browse-Liste** — Philipps Nachtrag;
  der Loader lädt heute zwar den Gesamtkatalog, aber der Lookup übersteht künftige
  Filter/Limits. Unbekannte/kaputte IDs degradieren zu No-Op.
- **Menü-Einträge:** Home, Archive, Compendium, Ask, Chronicle, Cartographer (I–VI, TopNav-
  Reihenfolge minus Podcasts). **Design-Platzhalter ohne Seite entfallen: Eras, Librarium,
  Factions, Glossarium, About the Archive** (Librarium/Factions sind konzeptionell durch
  Archive/Compendium abgedeckt).
- **Kein Wheel-Guard im Menü** (der Export hatte einen): einziger Wheel-Consumer ist die Map
  (React-`onWheel` element-scoped auf dem Hologram-Div) — Events über dem Overlay erreichen
  ihn nie; Chronicle bindet gar kein Wheel. Body-Scroll-Lock deckt den Rest.
- **Token-Bridge im Partial:** parchment→`--cl-bone`, gold→`--cl-gold` (Haus-Gold #c9a65a,
  wärmer als Export-#c9b896 — Absicht), void→`--cl-void`; die kühlen Steel-Greys
  (`#7d8799`/`#566070`) haben kein Projekt-Token → Literale, im Partial bzw. Toggle-Block
  gescoped und kommentiert.
- **Kommentar-Strings `/werke`/`/podcasts` nur in ohnehin angefassten Dateien aktualisiert**;
  Docblocks in nur-verschobenen Dateien (WerkeFilters, filters.ts, loading.tsx) bewusst
  unangetastet (Rename-Diffs bleiben 100 %-Similarity). Rest-Erwähnungen: `db-cache.ts`,
  `CogitatorLoading.tsx`, `DetailModal.tsx` (reine Kommentare).

## Verification

- `npx tsc --noEmit` — pass (nach `rm -rf .next`; Route-Moves hinterlassen stale
  `.next/types`-Validatoren, bekanntes Muster).
- `npm run lint` (eslint .) — pass (erst nach dem design-export-Ignore; vorher 4 Fehler im
  Export-JSX, die NICHT aus dieser Session stammen).
- `npm run build` — **Compile + TypeScript-Phase grün, Static-Export scheitert lokal** an
  60s-Timeouts DB-lastiger Seiten (compendium/fraktion/person, wechselnde Opfer pro Lauf).
  **Vorbestehend + umgebungsbedingt:** Kontroll-Build auf `origin/main` (771b5e0, ohne meine
  Änderungen) scheitert identisch (einmal sogar Worker-Hard-Crash 0xC0000409). Keine laufenden
  Dev-Server (geprüft); das ist lokale Maschine → Supabase-Pooler-Latenz unter 15 parallelen
  Export-Workern. Auf Vercel baut der PR in eigener Umgebung — dort beobachten.
- Dev-Server sauber neu gestartet (EIN Server), Grundrouten per HTTP geprüft (siehe unten);
  visuelle Abnahme macht Philipp im Browser.

Manuelle Checkliste für Philipp:

- `/archive`: Books + Filter (`/archive?…`), Pill unten rechts (BOOKS aktiv);
  `/archive?focus=<work-uuid>` öffnet das Buch-Popup, Filterklick droppt `focus`.
- `/archive/podcasts` + Show-Seite (PODCASTS aktiv); Suche → Episode-Pick scrollt+highlightet.
- Hard-Load `/werke?faction=…` → Query überlebt Redirect; `/podcasts/<slug>#ep-<id>` →
  Fragment überlebt + highlightet.
- Burger auf jeder Route; Menü über allem (auch über offenem Popup); Escape/Link/Routenwechsel
  schließt; Scroll-Lock; Stagger; reduced-motion ohne Transforms; Tab bleibt im offenen Menü.
- Mobile: Pill-Label weg + safe-area; Burger kollidiert nicht mit TopNav-Links.

## Open issues / blockers

- **Lokaler `next build` rot (Static-Export-Timeouts), auch auf main** — s. Verification.
  Falls es auf Vercel ebenfalls auftaucht: `staticPageGenerationTimeout` erhöhen oder
  Export-Parallelität senken wäre der Hebel (eigene Entscheidung, nicht hier hineingemischt).
- 308-Permanent-Redirects werden von Browsern aggressiv gecacht — bei einer späteren
  Umnutzung von `/podcasts` relevant; für ein echtes Rename akzeptiert.

## For next session

- Brief 138 kann `/archive?focus=<workId>` direkt als Chip-Ziel verwenden (Deliverable
  „`/werke?focus=`-Opener" ist hiermit erledigt, nur unter neuer Route).
- TopNav vs. Burger: aktuell koexistieren beide. Wenn die Design-Richtung des Exports
  (nur Burger) site-weit gelten soll, ist die TopNav-Ablösung ein eigener Brief.
- Docblock-Reste `/werke`/`/podcasts` in `WerkeFilters.tsx`/`filters.ts`/`loading.tsx`
  (nur Kommentare) — bei der nächsten inhaltlichen Berührung mitziehen.
- `/buecher` (Maintainer-Surface) bleibt bewusst unberührt und unverlinkt von der neuen IA.

## References

- Design-Quelle: `design-export/Chronicle Timeline.html` (Z. 126–158 Pill/Burger/Menü,
  165–189 Toggle-Script) + `design-export/chronicle.css` (Z. 49–64 Pill, 66–161 Burger/Menü,
  843–846 Mobile-MQ). Ordner ist gitignored — Referenz nur lokal.
- Muster wiederverwendet: `src/app/compendium/[category]/page.tsx` (?focus),
  `src/components/compendium/CompendiumFocusOpener.tsx`,
  `src/components/shared/DetailModal.tsx` (Scroll-Lock + Focus-Trap).
