---
session: 2026-06-01-113
role: architect
date: 2026-06-01
status: open
slug: entity-graph-panel
parent: 2026-05-31-109
links:
  - 2026-06-01-109
commits: []
---

# Entity-Graph Step 2 — EntityView-Redesign + In-Context-Panel

> **Diese Session = genau EINE Phase.** Der Brief trägt zwei (notfalls drei) Phasen, die als getrennte CC-Subsessions laufen, mit `claude /clear` dazwischen, damit das Token-Fenster klein bleibt. Philipp sagt dir, welche Phase dran ist. Lies Goal + Design freedom + Mockup + Context + **die Phase, die dran ist** — die andere Phase darfst du überspringen. Der Brief bleibt `open`, bis Phase B gemergt ist.

## Goal

Zwei Outcomes, phasiert:

- **Phase A — EntityView-Redesign (geteilter Body + Vollseite).** Das schon-live geteilte `EntityView` (Vollseiten `/charakter|fraktion|welt/[slug]` aus Brief 109) bekommt das in der Design-Session vereinbarte Layout (§ Mockup): Entity-Name als `<h1>` + eine kompakte Meta-Zeile mit **1–3 bereits vorhandenen** Fakten darunter, Werke als Karten je Kind-Gruppe, eine rechte **„VERKNÜPFT"**-Cross-Link-Rail, die in schmal / im späteren Panel **unter die Hauptspalte umbricht**, und ein **Gradient-to-dark**, der den Hub über dem unruhigen `SiteBackground` lesbar macht. **Kein Bild, keine neuen Daten, kein Schema.**
- **Phase B — In-Context-Panel (Mechanik).** Ein Klick auf eine Entity-Referenz *in der App* öffnet den (jetzt redesignten) Hub als **Overlay-Panel** über dem aktuellen Kontext — **dieselbe URL** via intercepting routes, Wiederverwendung von `loadEntity` + `EntityView` **ohne Fork**. Hard-Nav / Refresh / geteilter Link rendert weiterhin die volle SSG-Seite. Plus der **Gradient-to-dark-Scrim** hinter dem Panel.

Phase B baut auf dem redesignten `EntityView` aus Phase A auf → **Phase A merged zuerst, dann `/clear`, dann Phase B.**

## Design freedom — read before everything else

Die **gesamte Optik beider Phasen gehört dir** (du hast den frontend-design Skill). Phase A: Header-Treatment (wie Name + Meta-Zeile sitzen), Karten-Shapes, Sektions-Rhythmus, Stil **und exakter Umbruch-Breakpoint** der „VERKNÜPFT"-Rail, und die **exakten Werte des Gradient-to-dark** (welche Farbe/oklch, Stops, Opacity, ob Verlauf vs. flacher Scrim vs. Vignette — Hauptsache der Hub liest sich klar über dem Decor). Phase B: Panel-Form (Drawer/Modal/Side-Sheet), Breite/Höhe, Backdrop, Ein-/Ausblend-Timing + Easing, Scroll-Verhalten, Close-Affordance, Mobile-Treatment, Fokus-Ring. Exakte px/ms/oklch/Klassen-Shapes sind deine. Das **Mockup unten ist ein Struktur-Nordstern, kein Pixel-Spec** — es legt Anordnung + welche Sektionen fest, nicht Maße/Farben/Timings. Halte dich an die `src/app/styles/`-Ownership-Split-Konvention (neues Ownership-File, kein `.module.css`) und an die Politur der bestehenden reworkten Flächen (Brief 109 Hubs, `/buch/[slug]`).

## Mockup (Struktur-Nordstern — Optik ist CC's)

Aus der Design-Session mit Philipp; zeigt einen Charakter-Hub („Magnus the Red"). **Struktur**, nicht Maße:

- **Kopfleiste:** links ein Zurück-Link „‹ <Typ-Plural>" (z.B. „‹ Charaktere"). *(Die „Suche" oben rechts im Mockup ist Step 3 — **nicht** in diesem Brief.)*
- **Header:** Entity-Name groß (`<h1>`), darunter eine **Meta-Zeile aus 1–3 Fakten, die wir schon haben** — Charakter → primäre Fraktion; Fraktion → Alignment (+ ggf. Parent); Welt → Sektor (+ ggf. Designation). **Nicht** die Mockup-Strings „Primarch / Ära M31 / Heimat: Prospero" — die brauchen Daten, die das Schema heute nicht hat, und sind **deferred** (§ Out of scope). **Kein Bild-Slot** — das Mockup zeigt „Bild" als grauen Platzhalter; wir lassen ihn jetzt ganz weg.
- **Werke:** Karten, gruppiert je Kind — heute „Bücher (n)". „Podcasts"/„Videos" erscheinen **automatisch** über `RelatedWorks`, sobald ihre Daten landen (Podcasts via Brief 114, Videos später) — in **diesem** Brief wird dafür nichts gebaut; das Layout muss die zusätzlichen Kind-Gruppen nur sauber aufnehmen können.
- **Rechte „VERKNÜPFT"-Rail:** Cross-Link-Chips (verknüpfte Entities) + eine dezente Fußnote („→ verlinkt"). **Bricht unter die Hauptspalte um** in schmal / im Panel.

Wenn du die Vorlage als Bild willst: Philipp kann den Screenshot in der CC-Session direkt mitgeben.

## Context

Step 1 (Brief 109, gemergt) baute die tragende Naht: `src/lib/entity/loader.ts` (`loadEntity(type, id)`, server-only, `cache()`-memoised) + `src/components/entity/EntityView.tsx` (frame-agnostisch, **db-frei**, besitzt sein eigenes `<h1>` + Sektionen: `EntityHeader` → `EntityFacts` → `RelatedWorks` → `CrossLinkRail`). Heute ist das eine **einspaltige** zentrierte Säule — die 109-Notiz wählte das bewusst „für sauberen Reuse im schmalen Panel". Phase A dreht das **bewusst weiter** zu Hauptspalte + rechter Rail; der **Umbruch-zurück-auf-eine-Spalte** in schmal/Panel erhält genau diese Naht.

Der Loader liefert heute pro Typ nur, was im Schema steht: Charakter → `name` + primäre Fraktion (nur „Allegiance"-Fakt); Fraktion → Alignment/Parent/Glyph/Tone; Welt → Sektor/Grid/Capital/Warp/Tags. **Keine Rolle, Ära, Heimat, kein Bild** — daher die Deferral oben. Die Header-Meta-Zeile zieht nur aus den schon gelieferten `facts`/`oneLine`.

Die Panel-Naht für Phase B ist im 109-impl § „For next session" Punkt 2 exakt beschrieben: eine intercepting route importiert **dasselbe** server-seitige `loadEntity` und **dieselbe** db-freie `<EntityView data>` und wickelt die View in ein Overlay statt `<main>` + `SiteBackground` + Decor. Null Fork, identischer Body in Panel und Vollseite; `loadEntity` ist memoised, eine Soft-Nav dedupliziert den DB-Hit.

## Phase A — EntityView-Redesign

**Constraints (architektonisch, bindend):**

- **Geteilter Body bleibt geteilt.** Das Redesign passiert in `EntityView` + seinen Sektions-Modulen + dem Entity-Ownership-CSS — **nicht** in einer Vollseiten-Sonderform. Vollseiten und das spätere Panel zeigen denselben Body.
- **Die zwei 109-Naht-Regeln bleiben:** `EntityView` ist db-frei (keine server-only-Imports) und besitzt das **einzige `<h1>`**. Sonst bricht Phase B.
- **Meta-Zeile nur aus vorhandenen Feldern.** Welche 1–3 Fakten je Typ in die Header-Meta-Zeile wandern, ist Daten-/IA-Entscheidung: Charakter → primäre Fraktion; Fraktion → Alignment (+ Parent falls vorhanden); Welt → Sektor (+ Designation falls vorhanden). **Kein neuer Loader-Datenpfad, keine Schema-Spalte, kein Bild.** Der Loader liefert die Fakten schon; die View wählt 1–3 davon.
- **Rechte Rail mit Reflow.** Die „VERKNÜPFT"-Rail rendert als Aside neben der Hauptspalte und **bricht unter die Hauptspalte** ab einem schmalen Breakpoint und im Panel-Kontext (Breakpoint = deiner). Leere Cross-Link-Gruppen rendern nichts.
- **Kind-Gruppen erweiterbar.** Das Werke-Layout nimmt zusätzliche Kind-Gruppen (Podcasts/Videos) ohne Umbau auf, sobald deren Daten existieren — gebaut wird hier **keine** neue Gruppe.
- **Gradient-to-dark auf der Hub-Fläche.** Der Hub liest sich klar über dem `SiteBackground`-Decor; `prefers-reduced-motion` beachtet. Richtung = dunkler Verlauf/Scrim; Werte deine.

**Acceptance — Phase A fertig, wenn:**

- [ ] Die drei Vollseiten (`/charakter|fraktion|welt/[slug]`) rendern das neue Layout: `<h1>` + 1–3-Fakten-Meta-Zeile (nur vorhandene Daten, kein Bild), Werke als Karten je Kind, rechte „VERKNÜPFT"-Rail.
- [ ] Die Rail bricht an einem schmalen Breakpoint unter die Hauptspalte um (per Resize/Screenshot belegt).
- [ ] Der Hub ist über dem `SiteBackground` klar lesbar (Gradient-to-dark); `prefers-reduced-motion` respektiert.
- [ ] `EntityView` weiterhin db-frei + besitzt das einzige `<h1>`; `git grep` belegt keine server-only-Imports in der View.
- [ ] `npm run typecheck` + `lint` + `build` grün; die drei Routen weiterhin ● (SSG).
- [ ] Eigener Branch + PR. Danach `/clear`.

## Phase B — In-Context-Panel

**Constraints (architektonisch, bindend):**

- **Gleiche URL via intercepting routes.** Next.js parallel/intercepting routes (`@modal`-Slot + `(.)`/`(..)`-Intercept — die Punkt-Notation ist dein Detail). Soft-Nav in der App → Panel; Hard-Nav / Refresh / geteilter Link / SEO-Crawler → die volle **SSG-Seite aus Phase A** (kanonischer Fallback). Inkl. `default.tsx`-Slot-Fallback (null), damit Nicht-Modal-Routen nicht brechen.
- **Ein geteilter `@modal`-Slot** trägt alle drei Entity-Typen — **kein** Slot pro Typ. *(Entschieden 2026-06-02 mit Philipp.)*
- **Flaches Panel-Modell.** Ein Klick auf einen Entity-Link *im* offenen Panel **ersetzt** den Panel-Inhalt und aktualisiert die URL; **keine** genesteten/gestapelten Panels. *(Entschieden 2026-06-02 mit Philipp.)*
- **Zero Fork.** Das Panel importiert `loadEntity` + die redesignte `<EntityView>` unverändert. Kein zweiter Datenpfad, keine zweite View.
- **Server-Grenze bleibt.** `loadEntity` server-only; der Panel-Daten-Fetch ist RSC. Nur die Overlay-Hülle ist `'use client'`.
- **`prefers-reduced-motion`** respektiert (reduzierte/keine Animation).
- **A11y-Outcomes** (Mechanismus/Lib deiner Wahl): Fokus-Trap im offenen Panel, Escape schließt, Fokus-Restore aufs auslösende Element, `aria-modal` + Label, Hintergrund inert.
- **Gradient-to-dark-Scrim** hinter dem Panel, damit es über dem unruhigen `SiteBackground` abhebt; Werte deine.
- **Wiring:** der `@modal`-Slot sitzt so (Root-/geteiltes Layout), dass bestehende In-App-`<Link>`s auf Entity-URLs automatisch das Panel öffnen — primär die „VERKNÜPFT"-Rails + Fact-Links der Hubs (Entity↔Entity), und falls vorhanden Entity-Chips auf `/buch/[slug]` + `/buecher`. **Keine per-Link-Umbauten**, wo der Slot das automatisch erledigt.

**Acceptance — Phase B fertig, wenn:**

- [ ] Soft-Nav-Klick auf einen Entity-Link (z.B. ein „VERKNÜPFT"-Chip auf `/charakter/horus`) öffnet ein Overlay mit **demselben** `EntityView`-Inhalt; die URL wechselt auf die Ziel-Entity.
- [ ] Direktes Laden / Refresh / geteilter Link rendert die volle SSG-Seite (= Phase-A-Layout, unverändert).
- [ ] Escape + Backdrop-Klick + Close-Affordance schließen das Panel und stellen die darunterliegende View + den Fokus wieder her.
- [ ] Panel hebt sich klar über dem `SiteBackground` ab (Scrim); `prefers-reduced-motion` respektiert.
- [ ] `git grep` belegt: `loadEntity` aus dem Intercept-Segment aufgerufen, `EntityView` unverändert importiert — **kein** zweiter Datenpfad, **kein** View-Fork.
- [ ] `npm run typecheck` + `lint` + `build` grün; die drei Entity-Routen weiterhin ● (SSG).
- [ ] Eigener Branch + PR.

> **Notfalls dritte Phase:** Wird Phase A zu groß für eine Low-Token-Session, ist die saubere Naht zum Splitten die **rechte Rail + Reflow** (→ Phase A2); Header-Meta + Karten + Gradient-to-dark zuerst (Phase A1).

## Out of scope

- **Suche** (Step 3), `/werke`-Browse (Step 4), Startseite (Step 5).
- **Bild + reichere Header-Fakten** (Rolle „Primarch", Ära, Heimat) — brauchen Schema-Spalten + Backfill, **deferred** (Maintainer-Entscheidung 2026-06-02: kein großes Fass jetzt). Kommen diese Daten je, ist das ein Batches-Schritt; die Header-Meta-Zeile nimmt sie dann zusätzlich auf.
- **Podcasts/Videos-Sektionen bauen** — sie erscheinen automatisch via `RelatedWorks`, sobald ihre Daten existieren (Podcasts: Brief 114). Hier nur „das Layout nimmt sie auf".
- **Timeline-/Map-/Ask-Klick-Quellen** als Panel-Auslöser — eigener Folge-Step.
- `/aera` + `/serie`-Routen; `/buch`-Refactor; Grammatik-Konvergenz (`.c-chip`/`.c-section`-Primitive) — optional, nur wenn ohne `/buch`-Umbau billig mitfallend.
- **Kein Schema/DB/Resolver-Touch** in beiden Phasen.

## Open questions

- **Entschieden (2026-06-02 mit Philipp):** Panel-Verschachtelung → **flach**; `@modal`-Slot → **ein geteilter**; **Bild weglassen**; Header-Meta → **nur 1–3 vorhandene Fakten**. Alle in Constraints überführt.
- Offen, CC's Wahl unter Design freedom: „volle Seite öffnen"-Affordance im Panel (Hard-Nav zur SSG-Seite)?; exakter Reflow-Breakpoint der Rail; ob „Podcasts"/„Videos" als leere Sektions-Platzhalter angedeutet oder ganz weggelassen werden, bis Daten da sind (Empfehlung: weglassen — leere Sektion rendert nichts).

## Notes

Worktree **`chrono-lexicanum-product`**. **Zwei PRs, sequenziell:** Phase A (z.B. `codex/product-entity-view-redesign`) zuerst → merge → `/clear` → Phase B (z.B. `codex/product-entity-panel`). Branch-Namen finalisierst du selbst (CC-Konvention `codex/product-<slug>`). Der Brief bleibt `open`, bis Phase B gemergt ist; flippt erst dann auf `implemented`. Die Panel-Naht ist im 109-impl § „For next session" Punkt 2 beschrieben — für Phase B zuerst lesen. CC fuhr in Step 1 nur curl-Smoke; der **Maintainer-Visual-Pass** (Desktop + ≤720px) steht für die Hubs *und* das neue Panel aus. Versionen (falls eine neue Dep nötig ist) recherchiert + pinnt CC, kein Pin im Brief.
