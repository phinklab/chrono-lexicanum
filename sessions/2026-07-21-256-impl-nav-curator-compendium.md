---
session: 2026-07-21-256
role: implementer
date: 2026-07-21
status: complete
slug: nav-curator-compendium
parent: none              # maintainer-prompted launch session (serial launch mode)
links: []
commits:
  - cc3f307
---

# Nav-Umbau (Ziffern raus, Library first), Burger-Hintergrund, Curator → Compendium

## Summary

Drei Blöcke in einem Product-PR (Worktree: Coordination, serieller
Launch-Modus; logischer Strang Product/UI): (1) Die römischen Registry-Ziffern
sind aus der gesamten Primärnavigation und der Home-„More to explore"-Liste
entfernt, die Nav-Reihenfolge ist neu — The Library (Archive, Compendium)
führt, dann Explore. (2) Das Burger-Overlay liegt statt auf dem blauen
Radial-Gradient auf dem geteilten Bibliotheks-Backdrop (`main-bg.webp`) unter
einer fast deckenden Void-Waschung — der „runtergescrollte" Look der
Desktop-Seiten. (3) Der Curator als eigenständige Seite ist aufgelöst: „Four
Questions" und „One Faction, One Book" leben jetzt als Guided-Pick-Tools im
Compendium (Nav-Einträge nach Authors + eigene „Guided Picks"-Bande auf der
Übersicht); `/ask`-Links überleben per 308 mit Query-Weiterleitung.

## What I did

**Block 1 — Ziffern raus + Nav-Reihenfolge**
- `src/components/chrome/navEntries.ts` — `ROMAN`-Export gelöscht;
  Gruppen-Reihenfolge: The Library (Archive, Compendium) → Explore
  (Cartographer, Chronicle, Status Imperialis). Die Timeline behält ihre
  eigene lokale Roman-Kopie (`cinematic/shared.tsx`), unberührt.
- `src/components/chrome/SiteNav.tsx` / `SiteMenu.tsx` — Ziffern-Spans +
  Zähler raus; Stagger-Index im Overlay bleibt.
- `src/components/home/HomeExplore.tsx` — `n`-Feld + Index-Spalte raus
  (Keys jetzt `row.title`).
- CSS: `46-site-nav.css` (`__num`-Regeln raus, Separator-Margin ohne
  Ziffernspalte), `43-site-menu.css` (`__num` + `::after`-Balancer + Gap
  raus), `50-hub.css` (Grid ohne Index-Spalte, Desktop + Mobile).

**Block 2 — Burger-Overlay-Hintergrund**
- `43-site-menu.css` — Ground neu: `main-bg.webp` (Crop `right bottom` wie
  die Seiten; ≤760px re-zentriert `center bottom` analog
  `MOBILE_POSITIONS.main`) unter einem Void-Verlauf 88→97 % — entspricht dem
  ScrollScrim-Peak 0.94 der gescrollten Desktop-Seiten. Default-
  `background-attachment` pinnt das Bild, wenn die Liste auf kleinen Phones
  scrollt.

**Block 3 — Curator → Compendium (Entscheid: Philipp; Ausführung nach dem
„eigene Bande"-Vorschlag aus dieser Session)**
- NEU `src/app/compendium/four-questions/page.tsx` — der Fragebogen als
  Compendium-Bürger: CompendiumNav + `cmp-cat-intro`-Header + `AskClient`;
  Antwort-/Matrix-/Deeper-Logik unverändert. Kein Landing mehr — die bare
  Route zeigt Frage 1 (`mode=profile` entfällt, Fremd-Params ignoriert
  `parseAskAnswers` ohnehin).
- NEU `src/app/compendium/one-faction-one-book/[[...segments]]/page.tsx` —
  Faction-Tool inkl. Drilldown, weiterhin `generateStaticParams`
  (voll statisch); gleiche Compendium-Grammatik.
- GELÖSCHT: `src/app/ask/**` (Page, Loading, Faction-Route; das
  Compendium-`loading.tsx` deckt die neuen Kinder ab) und
  `src/components/ask/AskToolTabs.tsx` (Landing-Doorways + Compact-Switch —
  die Kategorie-Nav übernimmt das Umschalten).
- `src/components/ask/AskClient.tsx` — nur noch Tool-Body
  (`ask-console__grid`); Section/Landing/Toolhead raus, `showLanding`-Prop
  weg; `deeperHref`/Navigation auf `FOUR_QUESTIONS_PATH`.
- `src/lib/ask/params.ts` — `FOUR_QUESTIONS_PATH` exportiert;
  `buildAskHref` zielt darauf.
- `src/lib/compendium/categories.ts` — `COMPENDIUM_TOOLS`-Vertrag (slug,
  label, blurb, cta) neben den fünf Kategorien.
- `src/components/compendium/CompendiumNav.tsx` — Tools nach Authors;
  Faction-Tool matcht per Prefix (Drilldown-Segmente).
- `src/app/compendium/page.tsx` — „Guided Picks"-Bande unter den fünf
  Türen: Door-Idiom ohne Zählwerte, CTA statt „View all".
- `src/app/compendium/layout.tsx` — Hero-Edition, Vox-Zeile, Footer-Mid
  auf Doorways + Guided Picks angepasst.
- `next.config.ts` — 308-Redirects: `/ask` → `/compendium/four-questions`
  (Query verbatim → versiegelte Antwort-Deep-Links überleben),
  `/ask/faction/:path*` → `/compendium/one-faction-one-book/:path*`,
  `/ask/fraktion/:path*` direkt aufs neue Ziel (kein Doppel-Hop).
- `src/app/sitemap.ts` — `/ask*` raus, neue Tool-Pfade inkl.
  Drilldown-Walk rein.
- `53-ask.css` auf den geteilten `ask-console__grid`-Container eingedampft
  (Curator-Threshold/Toolhead/Switch-Styles tot); `66-compendium.css`
  `+ .cmp-sect-tools`; `globals.css`-Manifest-Kommentare nachgezogen.
- Primärnav: Curator-Eintrag raus, „Services" aufgelöst — Librarium
  schließt Explore (6 Einträge, 2 Gruppen). Home „Browse by Topic" führt
  die beiden Tools nach Authors; die Curator-Zeile in „Discover More" ist
  weg.

## Decisions & rationale

- **Tools als eigene Bande, nicht als sechste/siebte Kategorie-Tür in
  Verkleidung:** Kategorien sind Register (Count + „View all"), die Tools
  sind Recommender — gleiche Door-Optik, aber eigene Überschrift + CTA,
  damit die Übersicht nicht lügt.
- **Persona bleibt Body-Copy:** „The Curator answers" (FactionPickPanel)
  und der OFOB-Blurb behalten die Stimme; nur die Marke als
  Navigationsziel/Route ist weg.
- **Redirect-Kette flach gehalten:** `/ask/fraktion` zeigt direkt auf
  `/compendium/one-faction-one-book` (Muster der bestehenden
  `/fraktionen`-Regel).

## Verification

- `tsc --noEmit` + `eslint .` grün; keine Rest-Referenzen auf `/ask`,
  `showLanding`, `AskToolTabs`, `mode=profile` (Repo-Grep).
- Dev-Server nach dem `next.config.ts`-Edit neu gestartet (Redirects laden
  nicht hot); `/` und `/compendium/four-questions` liefern 200, Log
  fehlerfrei; Tab-Titel „Four Questions — Compendium" bestätigt.
- Browser-Pane-Screenshots schlugen die ganze Session mit Renderer-Timeouts
  fehl (kein App-Fehler) — Sichtprüfung durch Philipp: Guided-Picks-Abstand
  auf der Übersicht, Intro→Tool-Rhythmus, achtteilige `cmp-nav` auf schmalen
  Viewports, `/ask`-Redirect, Burger-Overlay-Ground.

## For next session

- Optional: `SiteBackground`-Variante `oracle` (Ex-Curator-Backdrop) ist
  jetzt endgültig unbenutzt — Kandidat für einen Asset-/Varianten-Sweep.
- `docs/ui-backlog.md` blieb unberührt; kosmetische Funde aus Philipps
  Sichtprüfung landen dort.
