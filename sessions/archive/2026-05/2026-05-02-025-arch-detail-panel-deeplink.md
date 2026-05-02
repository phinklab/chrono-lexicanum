---
session: 2026-05-02-025
role: architect
date: 2026-05-02
status: implemented
slug: detail-panel-deeplink
parent: 2026-05-02-024
links:
  - 2026-05-01-018
  - 2026-05-01-019
  - 2026-05-01-020
  - 2026-05-01-021
  - 2026-05-02-022
  - 2026-05-02-023
  - 2026-05-02-024
  - 2026-05-02-026
commits:
  - 0e0eaa59f1d2ab9877b44e86716b8c64b373189d
  - 876277511099309dad1c14f574be9f1391b5e8ad
  - 6639eb0e1960885e1283c2df637e8991fa2187b9
  - 648dae577e567ebb788a982f3f3f1bdc50efe592
---

# Stufe 2c.1 — DetailPanel + Deep-Linking (Rewrite of 018, against post-2c.0 schema)

## Goal

Click on a `BookDot` in `EraDetail` öffnet ein DetailPanel mit der vollen Buch-
Metadata, und die URL wird zu einem teilbaren Deep-Link der Form
`?era=<era_id>&book=<slug>`. Browser-Back schließt das Panel. Direkthits auf
`?book=<slug>` (ohne `?era=`) lösen serverseitig über
`book_details.primary_era_id` zur richtigen Era auf und rendern das Panel
geöffnet über EraDetail.

Das ist der Rewrite des on-ice-gelegten Briefs 018, jetzt gegen das
post-2a / post-2c.0 Schema (`works` + `book_details` CTI, `external_links`-
Tabelle, `work_factions`/`work_persons`/`work_facets`-Junctions, `primaryEraId`
als kanonische Era-Resolution für Deep-Links).

## Design freedom — read before everything else

Du hast den frontend-design Skill installiert. Nutze ihn. Visuelle
Entscheidungen für das Panel — exakte Zwei-Spalten-Proportionen,
Cover-Placeholder-Treatment, Opening-Animation-Timing und -Curve,
Backdrop-Blur-Intensität, Kicker-Typografie, Buttons, Hover-Mikroanimationen,
Focus-Indicator auf Close-Button, Series-Volume-Nav-Button-Shape,
Metadata-Grid-Layout, Tag-Chip-Styling, exakte oklch-Werte, exakte Klassen-
Shapes, Stagger-ms — sind **deine**. Brief beschreibt *was existieren soll*
und *welches Gefühl gelandet werden soll*, nicht welche Tailwind-Klasse wo
hingehört.

Konkret:

- Ich sage „DetailPanel ist ein zentriertes Hero-Modal mit Backdrop-Dimmer."
  Ich sage *nicht* `width: 880px, max-height: 86vh, border-radius: 0,
  backdrop-filter: blur(14px), opacity 0 → 1 over 320ms cubic-bezier(.2,.8,.2,1)`.
- Ich sage „Reading-Notes-Block ist visuell unterscheidbar vom narrativen
  Synopsis-Bereich." Ich sage *nicht* welche Background-Surface, welche
  Padding-Werte, welcher Border-Stil.
- Ich sage „Content-Warnings sind im Reading-Notes-Block visuell besonders
  abgesetzt — sie sind Reader-Safety-Pflicht, kein Decoration-Tag." Ich sage
  *nicht* welche Farbe, welches Icon, welche Position.
- Ich sage „Panel-Open-Transition lifts and sharpens." Ich sage *nicht* `380ms`
  oder `translateY(8px)`.

Reference points (ansehen vor dem Designen):

- **Prototype-Panel** — `archive/prototype-v1/components/DetailPanel.jsx` (das
  ist die **Shape, die wir porten**): full hero modal, two-column (cover-left
  / meta-right), ESC-handler, Backdrop-Dimmer, Series-Ribbon mit Volume-Nav,
  Metadata-Grid, Synopsis-Paragraph, Faction-Tags, Character-Tags,
  Find-Similar-CTA (out of scope hier).
- **Prototype CSS für `.detail-modal` / `.dm-*`** — `archive/prototype-v1/
  styles/detail-modal.css` (gesamte Datei). Die `.detail-panel` / `.dp-*`-
  Klassen in `archive/prototype-v1/styles/timeline.css` 466–637 sind eine
  *frühere* anchored-to-marker-Variante, die der Prototype nicht mehr nutzt
  — **nicht porten**, das ist die tote Variante. Ports `detail-modal.css`.
- **Hub-Vokabular-Touchpoints** — Corner-Bracket-Pattern aus `.mt-corner`
  (Hub-Tiles), `:focus-visible`-Corner-Brackets auf `.era-seg-brackets`
  (Session 013). Close-Button und Volume-Nav-Arrows sollen sich daran
  orientieren, nicht ein neues Vokabular erfinden.
- **Buzzy-/Glitchy-Band-Hover** — `src/components/timeline/Overview.tsx` +
  `eraGlitch`-Filter in `globals.css`. Panel-Open-Transition darf nicht mit
  diesem Effekt konkurrieren; kalibriere so, dass das page-level-Vokabular
  „der Cogitator liest dich zurück" bleibt, nicht „der Cogitator stottert bei
  jeder Interaktion."
- **`globals.css` Timeline-Block** — die `/* ===== Timeline ===== */`-Sektion
  von 011/013. Panel-CSS kann dort hin oder in eigenen Block daneben oder
  in eigene Datei (siehe Open Question).

Ästhetik (falls die Prototype-Anlehnung sie verschleiert): **grimdark
archival cogitator viewing a single dossier**. Das Panel liest sich als
Datensatz, der gezogen und projiziert wird — restrained glow, painterly oklch
surfaces, terminal-mono kickers/labels, serif title und synopsis. 0%
Glassmorphism (Backdrop-Filter auf dem Dimmer ist okay, das Panel selbst ist
opaker Cogitator-Glas, nicht frosted). 0% Material-Design-Shadow-Stacks. 0%
Rounded-Corners. Wenn ein Design-Ansatz auf einer 2026er-SaaS-Product-
Detail-Modal Sinn ergäbe, ist er für dieses Archiv vermutlich falsch.

Die architektonischen Constraints unten sind **nicht verhandelbar**. Alles
zwischen den Constraints ist deine Entscheidung.

## Context

Stufe 2a (sessions 019/020) hat die Daten-Topologie komplett umgebaut:
`books`-zentriertes Schema → `works`-zentriert mit CTI (`works` + kind-
spezifische Detail-Tabellen wie `book_details`). `bookFactions`/`bookCharacters`/
`bookCharacters` heißen jetzt `workFactions`/`workCharacters`. `goodreadsUrl`/
`lexicanumUrl`/`blackLibraryUrl` als Spalten gibt es nicht mehr — sie sind
Zeilen in der `external_links`-Tabelle (typisiert via `external_link_kind`-
Enum + `service_id`-FK auf `services`). Die alte `pubYear`-Spalte heißt jetzt
`releaseYear` und lebt auf `works`. Die alte `subtitle`-Spalte ist gestrichen.
12 Facet-Kategorien (`tone`, `theme`, `entry_point`, `length_tier`,
`content_warning`, `format`, `language`, `pov_side`, `protagonist_class`,
`scope`, `plot_type`, plus NEON-14) hängen an `works` über `work_facets`.

Stufe 2b (sessions 021/022) hat 26 vollannotierte Bücher in die DB gepumpt.
Stufe 2c.0 (sessions 023/024) hat `book_details.primary_era_id` als
editorischen Era-Anchor eingeführt. Damit existiert jetzt eine kanonische
Era-Resolution für Deep-Links: ein `?book=<slug>`-Hit wird über
`book_details.primary_era_id` aufgelöst, nicht über Midpoint-Heuristiken.

`BookDot` in `EraDetail.tsx` (Lines ~396–420) loggt heute nur `console.log`
in dev. Das ist der Swap-Point. Server/Client-Situation und Page-Komposition
heute:

- `src/app/timeline/page.tsx` ist Server-Component, awaited `searchParams`,
  fetcht eras + series + works (kind=book) via Drizzle, rendert entweder
  `<Overview>` oder `<EraDetail key={era.id}>`.
- Bücher fließen als slim `TimelineBook` (`src/lib/timeline.ts`):
  id, slug, title, authors[], startY, endY, primaryEraId, factions[]
  (id-only), series ({id, order}). Synopsis, releaseYear, factions-mit-Namen,
  Facets, externalLinks — kein Teil von `TimelineBook`. Müssen für das Panel
  neu geladen werden.
- `EraDetail.tsx` ist Client-Component, owned pan/drag-State, remounts on
  era change via parent's `key={era.id}`.
- `Overview.tsx` ist Client-Component, hat aber keine Buch-Pins mehr (013) —
  nur noch Era-Count-Badges. **Re-Introduce keine Ribbon-Level-Buch-Klicks.**
  DetailPanel ist diesen Brief nur über EraDetail's BookDots erreichbar.

Repo: `phinklab/chrono-lexicanum`. Required-Status-Check `ci /
lint-and-typecheck` (no suffix). PR-Flow wie 014/015/017. Keine Migration
in diesem Brief — Schema reicht (Stufe-2a hat alles geliefert).

## Constraints

### URL-Contract

1. Kanonische Shape wenn ein Buch offen ist:
   **`/timeline?era=<era_id>&book=<slug>`**. Beide Params präsent.
   `era_id` ist die Era, in der das Buch lebt (Strict-Match auf
   `b.primaryEraId`), `slug` ist `works.slug`.
2. **Direkthit auf `/timeline?book=<slug>` (ohne `?era=`) muss auflösen.**
   Server-side: lookup über `works.slug` + `book_details.primary_era_id`,
   server-redirect (`redirect(...)`) zu
   `/timeline?era=<primaryEraId>&book=<slug>`. Wenn `primaryEraId` aus
   irgendeinem Grund leer/null ist (sollte post-2c.0 nicht passieren, aber
   defensiv): redirect zu `/timeline` plain (kein 404, keine spekulative
   Era-Wahl).
3. **Direkthit auf `/timeline?era=<era_id>&book=<unknown_slug>`:** redirect zu
   `/timeline?era=<era_id>` (Panel öffnet einfach nicht — gleiche
   Liveness-Logik wie 018; shared-aber-stale Links nach Phase-4-Slug-Rename
   überleben).
4. **Direkthit auf `/timeline?book=<unknown_slug>` (kein era):** redirect zu
   `/timeline` plain.
5. Legacy-Redirect `?era=M30|M31|M42` aus Session 011 bleibt. Wenn `?book=…`
   im Legacy-Hit präsent ist, durch den Redirect propagieren
   (`/timeline?era=horus_heresy&book=<slug>`).
6. **BookDot-Click in EraDetail navigiert zur kanonischen URL via
   `router.push`** (nicht `replace`), damit Browser-Back das Panel natürlich
   schließt. **Close auf dem Panel** (×, ESC, Backdrop-Click) geht via
   `router.back()` zurück, falls die vorherige History-Entry der gleiche
   `/timeline`-Route ist (Standard-Fall: Nutzer hat das Panel durch Klick
   geöffnet); sonst `router.push('/timeline?era=<era_id>')` — droppt nur
   den `?book=`-Param. **Series-Prev/Next-Volume-Nav** nutzt `router.push`,
   damit jedes Volume eine eigene History-Entry bekommt (Back walkt durch).
7. Tab/Shift+Tab-Navigation zwischen BookDots gefolgt von Enter/Space muss
   ebenfalls die kanonische URL pushen (gleicher Pfad wie Click).

### Server / Client Boundaries

8. **Selected-book Detail-Fetch passiert server-side in `page.tsx`.** Wenn
   `searchParams.book` gesetzt ist und auf ein reales Buch auflöst: ein
   Drizzle-Query holt das Detail (synopsis, releaseYear, factions+names+
   alignment+tone+role, persons, facets+categoryNames+valueNames, series+
   prev/next-volume, externalLinks+services). Wird typisiert an einen
   einzigen `<DetailPanel>`-Client-Component übergeben. **Nicht aus dem
   Panel heraus fetchen.**
9. `DetailPanel` ist `"use client"` weil sie ESC-Handler, Backdrop-Click,
   Focus-Trap, Focus-Return, Opening-Animation-Lifecycle, Prev/Next-Volume-
   Buttons (router.push) own.
10. Selected-book-Detail-Type ist **separat von `TimelineBook`** —
    definiere `BookDetail` (oder Name deiner Wahl) in `src/lib/timeline.ts`
    neben `TimelineBook`. Slim `TimelineBook` bleibt die Shape, die Overview/
    EraDetail konsumieren; nur die Page reicht das schwerere `BookDetail` an
    `<DetailPanel>` durch.
11. Page komponiert `<EraDetail … />` und `<DetailPanel … />` als Geschwister
    in der Layout-Hierarchie. EraDetail bleibt gemounted (Panel unmountet
    EraDetail nicht). `DetailPanel` returns `null` wenn kein Buch ausgewählt.

### Datenshape — `BookDetail` (Sketch)

`src/lib/timeline.ts` bekommt zusätzlich (Field-Namen sind dein, Shape ist
roughly):

```ts
export interface BookDetail {
  id: string;
  slug: string;
  title: string;
  authors: string[];                  // work_persons WHERE role='author', ordered by displayOrder
  releaseYear: number | null;          // works.releaseYear (was pubYear)
  startY: number;
  endY: number;
  primaryEraId: string;
  synopsis: string | null;             // works.synopsis
  coverUrl: string | null;             // works.coverUrl — heute immer null
  factions: Array<{
    id: string;
    name: string;
    alignment: "imperium" | "chaos" | "xenos" | "neutral";
    tone: string | null;
    role: string;                       // 'primary' | 'supporting' | 'antagonist' (default 'supporting')
  }>;
  /**
   * All facet rows for the work, grouped by facet category. Render-time
   * curation lives in the panel (siehe §Facet-Curation), nicht im Query.
   */
  facets: Record<string, {
    categoryName: string;
    values: Array<{ id: string; name: string }>;
  }>;
  series: {
    id: string;
    name: string;
    totalPlanned: number | null;
    order: number | null;               // 1-based seriesIndex
    prev: { slug: string; title: string; order: number | null } | null;
    next: { slug: string; title: string; order: number | null } | null;
  } | null;
  externalLinks: Array<{
    kind: "reference" | "read" | "listen" | "watch" | "buy_print" | "trailer" | "official_page";
    serviceId: string;
    serviceName: string;
    url: string;
    label: string | null;
  }>;
}
```

Server-Fetch: ein Drizzle-Query fürs Buch (mit relationalen `bookDetails+
series`, `factions` join `factions`-Reference-Table, `persons` join `persons`-
Reference-Table mit `role='author'`, `facets` join `facetValues` join
`facetCategories`, `externalLinks` join `services`). Plus ein Query für
prev/next-Siblings in der gleichen Series (oder zero Queries wenn `seriesId`
null). N+1 ist okay bei aktueller Catalog-Größe — keine Optimierung
ausdenken.

### Facet-Curation im Panel

12. Panel rendert einen **„Reading notes"-Block** (Name deiner Wahl) mit
    **5 kuratierten Facet-Kategorien** in dieser Reihenfolge:
    `entry_point` → `length_tier` → `tone` → `theme` → `content_warning`.
    Display-Labels kommen aus `facet_categories.name`, Werte-Labels aus
    `facet_values.name`.
13. **`content_warning` ist visuell vom Rest abgesetzt** — es ist
    Reader-Safety, kein Decoration-Tag. Wenn ein Buch keine
    `content_warning`-Werte hat, wird die Sub-Sektion stillschweigend
    weggelassen (kein „— keine Triggerwarnungen —"-Placeholder).
14. Wenn eine kuratierte Kategorie für dieses Buch zero Werte hat: Sub-
    Sektion wird weggelassen. Reading-Notes-Block selbst entfällt komplett,
    wenn alle 5 kuratierten Kategorien leer sind.
15. **Die anderen 7 Facet-Kategorien** (`format`, `language`, `pov_side`,
    `protagonist_class`, `scope`, `plot_type`, NEON-14-Internals) werden
    **nicht** im Panel gerendert — sie tauchen in 2a.2 als
    FilterRail-Chips auf. Lade sie aber dennoch im Detail-Query (die
    `facets`-Property liefert alle 12 Kategorien aus); die Kuration ist
    Render-Time, nicht Query-Time. So kann ein Folge-Brief ohne Schema-/
    Datenshape-Änderung noch Kategorien sichtbar machen.

### External-Links

16. Panel rendert einen **„Sources"-Block** (Name deiner Wahl) mit **allen**
    `external_links`-Einträgen, die das Buch hat. Heute: pro Buch genau ein
    Lexicanum-Reference-Link. Phase-4-Crawling fügt später Goodreads/Audible/
    BL hinzu — dann erscheinen die automatisch.
17. **Gruppiert nach `kind`** — typische Gruppen: References (kind=reference),
    Lesen (kind=read), Hören (kind=listen), Sehen (kind=watch),
    Offizielle Seite (kind=official_page), Trailer (kind=trailer). Reihenfolge
    der Gruppen ist deine Design-Entscheidung, aber „References" sollten
    nicht über „Lesen/Hören/Sehen" stehen, falls letztere präsent sind
    (Lese/Hör-Optionen sind Action, References sind Backstop).
18. Display-Label pro Link: `external_links.label` falls non-null, sonst
    `services.name`.
19. Alle Links öffnen **in neuem Tab** (`target="_blank" rel="noopener
    noreferrer"`).
20. **`buy_print`-kind: rendert IF present, aber kein Affiliate-CTA-Framing**
    — als regulärer Link gleichgewichtig zu den anderen. Heute existieren
    keine `buy_print`-Rows; for forward-compat einfach nicht special-casen.
21. Wenn `externalLinks` leer ist: Block wird komplett weggelassen.

### Characters

22. Schema hat `work_characters` mit Reference auf `characters`. `characters`-
    Tabelle ist heute leer (0 Rows nach Seed). Detail-Query lädt
    `work_characters` *trotzdem* mit (Forward-Compat — wenn Phase-4
    Charaktere einspielt, soll das Panel sie ohne Codeänderung zeigen).
23. **Characters-Sektion rendert nur, wenn `BookDetail.characters` non-empty
    ist.** Heute: Sektion existiert nicht in der gerenderten Page. Layout
    muss sich graceful schließen (kein Empty-Block, keine Spacer-Lücke).

### Accessibility

24. `role="dialog"`, `aria-modal="true"`, `aria-labelledby` zeigt auf den
    Panel-Title.
25. ESC schließt. Backdrop-Click schließt. Close-Button (×) ist per
    Keyboard erreichbar und ist ein erster natürlicher Focus-Stop on open
    (acceptabel auch das Title-Element zu fokussieren — deine Wahl, solange
    Focus innerhalb des Panels landet on open).
26. Focus-Trap solange Panel offen ist. On close: Focus geht zurück auf den
    BookDot, der das Panel geöffnet hat (Mechanismus ist deine Wahl —
    siehe Open Question).
27. Volume-Nav-Buttons sind reale `<button>`-Elemente (keine Anchors) mit
    `aria-label="Previous volume"` / `"Next volume"`, weil ihr sichtbares
    Label nur `◂` / `▸` ist.
28. Opening-Animation gated by `prefers-reduced-motion`. Die globale
    `* { animation-duration: 0.001ms !important }`-Cascade aus 011/013 deckt
    den `animation:`-Pfad ab — wenn du `transition:` benutzt, deckt sie
    nicht. Verifiziere; wenn du explizit `@media (prefers-reduced-motion:
    reduce)` brauchst, dokumentiere im Report warum.
29. Tab/Shift+Tab cycelt nur innerhalb des Panels solange es offen ist.

### Versions and dependencies

30. **Keine neuen Dependencies.** Panel ist React + CSS. Keine Portal-
    Library, keine Headless-UI, keine Animation-Library. Wenn du eine willst,
    ist das eine Open-Question für den nächsten Brief, kein unilateraler
    Install.
31. **Keine Versions-Pins.** Stack bleibt wo er ist. Siehe
    `docs/agents/COWORK.md` § „Version pinning is forbidden" für die
    Discipline.

### Was steht und nicht angefasst wird

32. `Overview.tsx` — Buch-Pins sind weg seit 013, **nicht re-introducen**.
    Ribbon-Click-Target bleibt nur das Era-Band.
33. `EraDetail.tsx` track-packing, pan/drag, prev/next era nav, axis ticks,
    empty-state — unverändert. **Nur** der `BookDot`-`onClick`-Body ändert
    sich (und ggf. lernt `BookDot` ein `<button>`-Upgrade plus Ref-Forward
    für Focus-Return — siehe Open Question).
34. `formatM` / `formatRange` — used as-is, hazard preserved (M-vs-encoded-
    year-Diskrepanz ist eigener Cleanup-Brief).
35. Legacy `?era=M30|M31|M42`-Redirect — bleibt, propagiert `?book=` durch
    den Redirect.
36. `eraGlitch`-SVG-Filter, Focus-Bracket-Polylines — unverändert.
37. `globals.css` `:root`-Aliases — used as-is.
38. `scripts/check-eras.ts` läuft unverändert; kein Impact.
39. **Kein Schema-Change, keine Migration.** Stufe 2a + 2c.0 haben alles
    geliefert was wir brauchen.

## Out of scope

- **Affiliate / Order-CTA.** Echtes Affiliate-Setup und Goodreads/Amazon-
  Entscheidung gehören in einen Phase-5+-Monetisation-Brief. Kein
  `buy_print`-Link bekommt Primary-CTA-Treatment in diesem Panel.
- **„Find similar"-Action.** Hängt an FilterRail (2a.2). Nicht rendern.
- **Cover-Image als `<img>`-Element.** `coverUrl` ist null für die
  voraussehbare Phase-4-Strecke. Render einen designten Cover-Placeholder
  (Title-as-Cover, Faction-Glyph-as-Art, painterly-empty-frame — deine
  Wahl). **Bake aber keinen `<img>` mit fake/placeholder-URL ins Markup.**
  Wenn `coverUrl` später gesetzt wird, soll dein Placeholder-Code-Path
  die Real-Image-Variante mit-handlen können — gerendert wird heute aber
  der Placeholder.
- **Subtitle-Spalte.** Existiert nicht im neuen Schema (war auf der alten
  `books`-Tabelle). Wenn das Prototype-Markup einen Subtitle-Slot hat, lass
  ihn weg.
- **Charakter-Sektion wenn leer.** Constraint 23 — nicht rendern bis
  characters-seed landet (Phase 4).
- **Die anderen 7 Facet-Kategorien** (`format`, `language`, `pov_side`,
  `protagonist_class`, `scope`, `plot_type`, NEON-14-Internals).
  FilterRail (2a.2) macht sie sichtbar.
- **Mobile / Narrow-Viewport-Behaviour.** Panel ist desktop-first. Darf
  unter ~880px nicht crashen, muss dort aber nicht hübsch aussehen — eigene
  Mobile-Pass-Brief später. Display-none-Stub oder graceful Single-Column-
  Collapse, deine Wahl.
- **Cluster-Collapse auf der EraDetail-Standalone-Spine.** Phase-4-Ingestion-
  driven, carry-over aus 013, bleibt carry-over.
- **EntryRail / FilterRail (2a.1, 2a.2).** Eigene Briefs. Nicht pre-wiren in
  irgendeiner Form.
- **Pan-Scrubber-Click-to-Jump, Mobile-Touch-Test EraDetail-Pan/Drag,
  M39-M41-Era-Encoding-Gap, formatM-vs-Toggle-Label-Reconciliation,
  NEXT_PUBLIC_SITE_URL on Vercel** — alles Carry-overs aus früheren Briefs,
  alle explizit *nicht* dieser Brief.
- **Open-Graph-Metadata für `/timeline?book=<slug>`.** Deferred zu Phase 3
  (`/buch/[slug]` rendert dann das proper OG-Image; Timeline fällt auf
  generisches Timeline-OG zurück). Heute bleibt Page-Metadata
  `title: "Chronicle — Timeline"`.
- **Schema- oder Migration-Changes.** Keine. Wenn du beim Implementieren ein
  fehlendes Feld findest, surface im Report — füg keine Migration in
  diesem Brief hinzu.
- **Caching / `revalidate` auf `/timeline`.** Bleibt none. Hub-Footer-Count
  hat ISR (021/022), `/timeline` ist `(Dynamic) ƒ` — bleibt so.
- **`check:eras` ins CI einhängen.** Carry-over aus 024-Report; eigene
  Hygiene-Aktion.
- **Re-Introduction von Buch-Pins auf der Overview-Ribbon.** Constraint 32 —
  hard NO.

## Acceptance

The session is done when:

- [ ] Click auf einen `BookDot` in EraDetail öffnet das DetailPanel mit der
      Metadata des Buchs, und die URL wird zu `/timeline?era=<era_id>&
      book=<slug>` via `router.push`.
- [ ] ESC, Backdrop-Click, oder × schließen das Panel und bringen die URL
      zurück auf `/timeline?era=<era_id>` (via `router.back()` wenn History
      es zulässt, sonst `router.push`). Focus geht zurück auf den BookDot,
      der das Panel geöffnet hat.
- [ ] Direkthit auf `/timeline?book=horus-rising` (kein `?era=`) server-
      redirected zu `/timeline?era=horus_heresy&book=horus-rising` (Era
      aufgelöst über `book_details.primary_era_id`) und rendert das Panel
      offen.
- [ ] Direkthit auf `/timeline?era=horus_heresy&book=does-not-exist`
      redirected zu `/timeline?era=horus_heresy` (Panel zu, gerenderte
      finale URL im Report dokumentiert).
- [ ] Direkthit auf `/timeline?book=does-not-exist` redirected zu
      `/timeline` plain.
- [ ] Legacy `?era=M30&book=horus-rising`-Hit propagiert `?book=` durch den
      Redirect zu `?era=horus_heresy&book=horus-rising`.
- [ ] Panel ist `role="dialog"` mit `aria-modal="true"` und referenced
      `aria-labelledby`. ESC schließt. Tab cycelt innerhalb des Panels. Focus
      on open landet im Panel; Focus on close geht zurück auf den
      originating BookDot.
- [ ] Wenn das Buch eine `series`-Row hat: Panel rendert die Series-Ribbon
      (Name + „Vol N / Total" oder „Vol N" wenn `totalPlanned` null + ◂ ▸
      Buttons) und die Buttons `router.push` zur prev/next-Volume-URL.
      Verifiziert mit `horus-rising` (Horus Heresy Main, totalPlanned 64,
      Vol 1 → next: hh07 Legion Vol 7 — siehe seed).
- [ ] `BookDetail.factions` rendert mit Faction-Name + Alignment-Tone +
      Role. Render-Reihenfolge ist deine Wahl (Convention z.B. primary →
      supporting → antagonist), Daten sind alle da.
- [ ] **Reading-Notes-Block** rendert für Bücher mit kuratierten Facets:
      die 5 Kategorien `entry_point`, `length_tier`, `tone`, `theme`,
      `content_warning` in dieser Reihenfolge. Kategorien mit zero Values
      werden silent ausgelassen. `content_warning` ist visuell unterscheidbar.
      Verifiziert mit `horus-rising` (alle 5 Kategorien gefüllt) und einem
      Buch ohne `content_warning`-Werte (falls vorhanden — checken).
- [ ] **Sources-Block** rendert eine Liste aller `external_links`-Rows,
      gruppiert nach `kind`, in neuem Tab öffnend. Verifiziert mit
      `horus-rising` (1 Lexicanum-Reference-Link). Block wird weggelassen
      wenn leer.
- [ ] Kein Characters-Sektion-Render (charac.- Tabelle ist 0 Rows). Layout
      schließt sich graceful.
- [ ] Cover-Spalte rendert designten Placeholder (kein `<img>` mit fake-URL).
- [ ] Keine neuen Dependencies in `package.json`.
- [ ] `npm run lint` clean (1 pre-existing layout.tsx-warning bleibt).
- [ ] `npm run typecheck` clean.
- [ ] `npm run build` grün; `/timeline` bleibt `(Dynamic) ƒ`.
- [ ] PR auf `main` / `phinklab/chrono-lexicanum` geöffnet. Required-
      Status-Check `ci / lint-and-typecheck` grün. Vercel-Preview-URL-
      Comment landet; das Panel funktioniert auf der deployten Preview,
      nicht nur lokal.
- [ ] Report dokumentiert:
      (a) `BookDetail`-Type's exakte Shape die geshippt wurde,
      (b) File-Layout-Pick (Panel-CSS in `globals.css`-Timeline-Block vs.
          eigener Block vs. eigene Datei),
      (c) Prev/Next-Sibling-Query-Strategie (single-all-series-Query +
          slice; zwei targeted-`<`/`>`-Queries; in-memory aus dem timeline-
          books-prop),
      (d) Focus-Return-Mechanismus (BookDot-zu-`<button>`-Upgrade vs.
          stable-id+`getElementById` vs. ref-thread),
      (e) Animation-Timing-Calibration-Notes (welche ms-Werte wo, ggf.
          Polish-Pass-Hinweis falls EntryRail später mehr competing motion
          bringt),
      (f) `prefers-reduced-motion`-Verifikation: deckt globale Cascade dein
          Animation-/Transition-Setup, oder brauchst du explizites
          `@media`-Block?
      (g) Falls `<img>` für coverUrl in irgendeiner Form benutzt wird (auch
          conditional): warum, und wie der Placeholder-Pfad aussieht.

## Open questions

- **Panel-CSS-Organisation.** Der slim-Port (011) hat alles Timeline-bezogene
  in einen Labelled-`/* ===== Timeline ===== */`-Block in `globals.css`
  gepackt. Das DetailPanel wird vermutlich ~150–250 Zeilen CSS haben — bleibt
  es im selben Block, bekommt es einen eigenen Labelled-Block daneben, oder
  wandert es in eine co-located `detail-panel.css`, importiert vom Component?
  Pick was die Cascade lesbar hält. (011-er Report flagged genau diese
  Entscheidung als „future DetailPanel-Modal might warrant
  `detail-panel.css`".)
- **Prev/next-Sibling-Query-Strategie.** Drei reasonable Shapes:
  (1) ein Drizzle-Query der alle Same-Series-Bücher fetcht und in JS sliced,
  (2) zwei targeted Queries mit `<` / `>` auf `seriesIndex` ordered + limit 1,
  (3) Lean auf die `timeline.books`-Prop die schon im Memory ist, und
      nur den Rest des Details aus der DB holen.
  (3) ist am cheapsten bei aktueller Catalog-Scale aber koppelt den Detail-
  Loader an die anderen Page-Daten; (1) ist am simpelsten in Code; (2) ist
  am scale-friendly. Pick was aktuell am cleansten liest — Phase-4-Hundreds-
  of-Books-Scale ist hier nicht der Constraint.
- **Focus-Return-Mechanismus.** `BookDot` ist heute ein `<div>` (Click-Handler
  am div). Für sauberen Focus-Return drei Optionen:
  (a) Upgrade `BookDot` zu echtem `<button>` (semantischer Win — recommended
      wenn unter ~30 Zeilen Diff und bm-Tooltip-CSS nicht bricht),
  (b) `<div>` bleiben + `tabIndex={0}` + stabile id + `document.
      getElementById(...)` on close,
  (c) Ref von EraDetail durchthreaden.
  (a) ist der richtige Move long-term. Wenn er kaskadiert, fall back auf (b).
- **Animation-Timing-Calibration vs. existing Motion-Vocabulary.** Buzzy-
  Glitch-Hover (013) ist 420ms total, Era-Band-Hover-Lit-Transition ist
  0.3s, Hub-Tile-Rise (007) ist staggered 6-px-blur. Panel-Open soll
  daneben sitzen — nicht schneller als Band-Hover (würde jumpy wirken),
  nicht langsamer als Hub-Tile-Rise (würde sluggish wirken). Pick einen
  Wert, dokumentier ihn, und call out im Report ob er einen Polish-Pass
  braucht sobald EntryRail (2a.1) gelandet ist und mehr Motion auf der
  Page kompetitiert.
- **`prefers-reduced-motion`-Granularität.** Deckt die globale
  `* { animation-duration: 0.001ms !important }`-Cascade dein Panel-Open-
  Transition (z.B. wenn du `transition:` statt `animation:` benutzt, gilt
  die globale Regel nicht)? Verifiziere; wenn du explizites
  `@media (prefers-reduced-motion: reduce)`-Block brauchst, dokumentiere
  warum.
- **BookDot semantic upgrade.** Wenn (a) oben gewählt: irgendwas am
  bm-Tooltip-CSS, an der Clickfläche, oder am Focus-Visible-Vokabular, das
  beim `<div>`→`<button>`-Switch unerwartet bricht? Im Report flagen.
- **Was am `.dm-*`-Vokabular hat überrascht?** Der `.dm-cover-bg`'s
  `data-era={book.era}`-Attribut (era-spezifisches Background), der
  `.dm-tag-ico`'s 11-px FactionGlyph-Inline, der `.dm-vol-btn`'s
  Disabled-State (für „erstes Volume hat keinen prev") — call out wenn du
  beim Porten irgendwo bewusst divergiert hast und warum.

## Notes

- **Prototype-Reference (die Datei die du portest):**
  `archive/prototype-v1/components/DetailPanel.jsx` (~140 Zeilen JSX) +
  `archive/prototype-v1/styles/detail-modal.css` (gesamte Datei). Heavy-Lift
  ist die matching CSS und das URL-Plumbing, nicht der JSX.
- **Tote Variante NICHT porten:** `archive/prototype-v1/styles/timeline.css`
  Lines 466–637 (`.detail-panel` / `.dp-*`-Klassen) ist die *frühere*
  anchored-to-marker-Variante, die der Prototype nicht mehr nutzt.
- **Click-Path-Verifikation vor Coding:** `npm run dev`, BookDot in EraDetail
  klicken, in der Console `[EraDetail] book click: <slug>` sehen. Das ist der
  Swap-Point — diese Zeile wird durch den `router.push` ersetzt.
- **Test-Slugs für Deep-Link-Smokes** (Auswahl aus den 26 Büchern):
  - `horus-rising` → era `horus_heresy`, Series-Ribbon (Vol 1 / 64),
    Lexicanum-Link, alle 5 kuratierten Facets gefüllt.
  - `eisenhorn-xenos` → era `time_ending`, Series Eisenhorn (Vol 1 / 3 oder
    was der Seed sagt — read it, don't assume).
  - `dark-imperium` → era `indomitus`.
  - `legion` → era `great_crusade` (einziges Buch dort; testet Single-Book-
    Era-Render mit Sibling-Nav darin).
  - `the-talon-of-horus` → era `age_rebirth` (einziges Buch; ähnlich).
- **Series-Sibling-Edge-Cases:** Stand-alone-Bücher (`series: null`) haben
  keine Volume-Ribbon. Series mit nur einem Vorhandenen Buch (z.B. Legion
  als einziges hh-Buch in `great_crusade` — aber innerhalb der series ist
  Legion Vol 7 von 64, prev/next aus *derselben* series scharf — hh01 ist
  Vol 1 in `horus_heresy`-Era, also in einer *anderen* Era). Cross-Era-
  Volume-Nav ist okay — der Series-Volume `next` von Legion (Vol 7) ist
  Mechanicum (Vol 9), das in `horus_heresy` lebt. Der `router.push` zur
  next-Volume-URL muss `?era=` entsprechend setzen (lookup über `bookDetails.
  primaryEraId` der next-/prev-Volume-Row, nicht über die Era des aktuellen
  Buchs!).
- **Series mit `totalPlanned` null:** mehrere Series-Rows haben `totalPlanned`
  null im Seed (z.B. minor series). Volume-Label-String fällt dann auf „Vol N"
  (ohne Denominator) zurück — Copy-Voice-Calibration ist deine.
- **`releaseYear` (was `pubYear`):** Prototype-Markup hatte Reading-Year-Slot
  irgendwo — die Source-Spalte heißt jetzt `works.releaseYear`. Kicker-
  Treatment für die Real-World-Pub-Year („First published 2006" o.ä.) ist
  Copy-Voice deine.
- **`formatM`-Hazard:** wenn das Panel die in-universe-Datum für Horus
  Rising rendert, liest es „M31.998" (canonically Heresy startet 005.M31).
  Gleiche Hazard wie in der EraDetail-Kicker. **Nicht hier fixen.** Acceptance
  fordert Render mit existing `formatRange`; keine on-the-fly-Fix der
  zwischen Surfaces divergiert.
- **Branch-Name-Vorschlag:** `feat/2c1-detail-panel-deeplink` — nicht enforced.
- **PR-Shape-Vorschlag:** ein Branch, eine PR. Commit-Granularität deine.
  Eine saubere Aufteilung wäre: (1) URL-Contract + Server-Redirect +
  `BookDetail`-Type + Server-Detail-Query, (2) DetailPanel-Component + CSS-
  Port, (3) BookDot-Wiring + Accessibility + Focus-Return. Oder ein einziger
  Commit. Don't gold-plate.
- **`ROADMAP.md`-Cleanup:** § Phase 2a hat zwei unchecked Items „Reactivate
  session 018 (DetailPanel + deep-linking)…" und implizit den DetailPanel/
  URL-State-Item. Wenn dieser Brief erfolgreich landet, entweder beide
  Items abhaken (Cowork tut das beim Lesen des Reports) oder im Report
  notieren falls Teile bewusst nicht abgehakt werden sollen. Du musst die
  Roadmap nicht selbst editieren.

## Vorbefüllung — confirmed editorial calls (no questions outstanding)

Philipp hat in der Cowork-Session vom 2026-05-02 bestätigt:

- **External-Links rendern:** alle vorhandenen Links rendern, gruppiert nach
  `kind` (siehe Constraints 16–21).
- **Facet-Kuration im Panel:** 5 kuratierte Kategorien (`entry_point`,
  `length_tier`, `tone`, `theme`, `content_warning`), Reading-Notes-Block
  (siehe Constraints 12–15).
- **`mf01 → indomitus`, `hh14 → horus_heresy`** locked aus 2c.0 (Report 024).
- **`gg01 Gaunt's Ghosts: First and Only` startY-Typo** in der Brief-023-
  Vorbefüllungs-Tabelle (41745 vs. books.json 41760): „nichts tun". 023 ist
  archiviert (`status: implemented`), books.json/Roster sind authoritative
  bei 41760, Era-Zuweisung `time_ending` ist davon nicht betroffen.

Keine outstanding Editorial-Frage für CC. Wenn du beim Porten auf eine
Datenshape-Frage stößt (z.B. ein Buch das einen Render-Bug aufdeckt), surface
im Report.

## References

- **018 (Old, on-ice version against pre-2a schema):**
  `sessions/2026-05-01-018-arch-detail-panel-deep-linking.md` — lies es für
  visuelle/ästhetische Intent und URL-Contract-Scaffolding; ignoriere die
  Datenshape-Specifics (`subtitle`, `pubYear`, `goodreadsUrl`-als-Spalte etc.
  — die sind nicht mehr im Schema).
- **Stufe 2a Schema-Foundation:** Brief 019 / Report 020 (CTI, work_*,
  external_links, persons, facet_categories, facet_values, services).
- **Stufe 2b Rich Seed:** Brief 021 / Report 022 (26 Bücher voll annotiert,
  Roster-Doc `docs/data/2b-book-roster.md`).
- **Stufe 2c.0 Era-Anchor:** Brief 023 / Report 024 (`primaryEraId` als
  kanonische Era-Resolution, `npm run check:eras` als Drift-Guardrail).
- **Schema:** `src/db/schema.ts` (`works`, `bookDetails`, `workFactions`,
  `workPersons`, `workCharacters`, `workFacets`, `externalLinks`, `services`,
  `persons`, `facetCategories`, `facetValues`).
- **Existing `TimelineBook`:** `src/lib/timeline.ts` (`BookDetail` geht
  daneben).
- **Page-Mapping:** `src/app/timeline/page.tsx` (`loadTimeline` + Render-
  Logic; das Selected-Book-Detail-Loading wandert daneben).
- **BookDot-Click-Swap-Point:** `src/components/timeline/EraDetail.tsx`
  Lines ~396–420 (`BookDot`-Component).
- **Prototype:** `archive/prototype-v1/components/DetailPanel.jsx`,
  `archive/prototype-v1/styles/detail-modal.css`.
- **Roadmap-Entry:** `ROADMAP.md` § Phase 2a — die unchecked items zur
  Stufe 2c werden mit diesem Brief geschlossen.
- **Carry-over-Punkt 1** in `sessions/README.md` (DetailPanel-Reactivation
  als Stufe 2c.1) — wird mit diesem Brief abgeräumt.
