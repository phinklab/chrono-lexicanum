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

# Entity-Graph Step 2 — In-Context-Panel

## Goal

Ein Klick auf eine Entity-Referenz *innerhalb der App* (z.B. ein Cross-Link auf einer Hub-Seite) öffnet den Entity-Hub als **In-Context-Panel/Overlay** über dem aktuellen Kontext — derselbe Inhalt wie die volle `/charakter|fraktion|welt/[slug]`-Seite, **dieselbe URL**, via intercepting routes. Wiederverwendung der Step-1-`loadEntity` + `EntityView` **ohne Fork**. Hard-Nav / Refresh / geteilter Link auf dieselbe URL rendert weiterhin die volle SSG-Seite.

## Design freedom — read before everything else

Die **gesamte Optik + Interaktions-Choreografie des Panels gehört dir** (du hast den frontend-design Skill): Panel-Form (Drawer / zentriertes Modal / Side-Sheet), Breite/Höhe, Backdrop (Blur/Dim/Vignette), Ein-/Ausblend-Timing + Easing, Scroll-Verhalten bei langem Inhalt, Close-Affordance (X / Backdrop-Klick / Swipe), Mobile-Treatment (Full-Screen-Sheet?), Fokus-Ring-Stil, und ob ein „volle Seite öffnen"-Link im Panel sitzt. Exakte px/ms/oklch/Klassen-Shapes sind deine. Halte dich an die `src/app/styles/`-Ownership-Split-Konvention (neues Ownership-File, kein `.module.css`) und an die Politur der bestehenden reworkten Oberflächen (Brief 109 Hubs, `/buch/[slug]`). Die Architektur-Bullets unten beschreiben **Outcomes**, keine Klassen.

## Context

Step 1 (Brief 109, gemergt) baute die tragende Naht: `src/lib/entity/loader.ts` (`loadEntity(type, id)`, server-only, `cache()`-memoised) + `src/components/entity/EntityView.tsx` (frame-agnostisch, **db-frei**, besitzt sein eigenes `<h1>` + Sektionen). Das 109-impl § „For next session" Punkt 2 beschreibt die Panel-Naht bereits exakt: eine intercepting route importiert **dasselbe** server-seitige `loadEntity` und **dieselbe** db-freie `<EntityView data>` und wickelt die View in ein Overlay statt `<main>` + `SiteBackground` + Decor. Weil `EntityView` nichts server-only importiert und seine Sektionen selbst besitzt, mountet es unverändert im Client-Panel — **null Fork, identischer Body in Panel und Vollseite**. `loadEntity` ist memoised, eine Soft-Navigation, die beide rendert, dedupliziert den DB-Hit.

## Constraints (architektonisch, bindend)

- **Gleiche URL via intercepting routes.** Next.js parallel/intercepting routes (`@modal`-Slot + `(.)`/`(..)`-Intercept — die genaue Punkt-Notation ist dein Implementierungs-Detail). Soft-Nav-Klick in der App → Panel; Hard-Nav / Refresh / geteilter Link / SEO-Crawler → die volle **SSG-Seite aus Step 1** (unverändert, kanonischer Fallback). Inklusive `default.tsx`-Slot-Fallback (null), damit Nicht-Modal-Routen nicht brechen.
- **Zero Fork.** Das Panel importiert `loadEntity` + `<EntityView>` unverändert. Kein zweiter Datenpfad, keine zweite View-Implementierung, kein Duplizieren der Sektions-Module.
- **Server-Grenze bleibt.** `loadEntity` bleibt server-only; der Daten-Fetch des Panels passiert server-seitig (das Intercept-Segment ist RSC). Nur die Overlay-Hülle ist `'use client'`.
- **`prefers-reduced-motion`** wird respektiert (reduzierte/keine Animation).
- **Accessibility-Outcomes** (Mechanismus/Lib wählst du): Fokus-Trap im offenen Panel, Escape schließt, Fokus-Restore auf das auslösende Element, `aria-modal` + Label, Hintergrund inert.
- **Wiring in diesem Step:** der `@modal`-Slot sitzt so (Root- bzw. geteiltes Layout), dass **bestehende In-App-`<Link>`s auf Entity-URLs** automatisch das Panel öffnen — primär die Cross-Link-Rails + Fact-Links der Hubs selbst (Entity↔Entity-Navigation) und, falls vorhanden, Entity-Chips auf `/buch/[slug]` + `/buecher`. **Keine per-Link-Umbauten** wo der Slot das automatisch erledigt.

## Out of scope

- **Timeline-/Map-/Ask-Klick-Quellen** als Panel-Auslöser — eigene Komponenten, eigener Folge-Step.
- Suche (Step 3), `/werke`-Browse (Step 4), Startseite (Step 5).
- `/aera` + `/serie`-Routen (separater near-free Follow-up aus dem 109-impl).
- `/buch`-Refactor; Grammatik-Konvergenz (`.c-chip`/`.c-section`-Primitive) — optional, nur wenn es ohne `/buch`-Umbau billig mitfällt.
- Kein Schema/DB/Resolver-Touch.

## Acceptance

Die Session ist fertig, wenn:

- [ ] Ein Soft-Nav-Klick auf einen Entity-Link in der App (z.B. ein Cross-Link-Chip auf `/charakter/horus`) öffnet ein Overlay-Panel mit **demselben** `EntityView`-Inhalt; die URL wechselt auf die Ziel-Entity.
- [ ] Direktes Laden / Refresh / geteilter Link der Ziel-URL rendert die volle SSG-Seite (unverändert ggü. Step 1).
- [ ] Escape + Backdrop-Klick + Close-Affordance schließen das Panel und stellen die darunterliegende View + den Fokus wieder her.
- [ ] `prefers-reduced-motion` wird respektiert.
- [ ] `git grep` belegt: `loadEntity` wird aus dem Intercept-Segment aufgerufen, `EntityView` unverändert importiert — **kein** zweiter Datenpfad, **kein** View-Fork.
- [ ] `npm run typecheck` + `npm run lint` + `npm run build` grün; die drei Entity-Routen rendern weiterhin als ● (SSG).

## Open questions

- Soll im Panel ein „volle Seite öffnen"-Affordance sitzen (Hard-Nav zur SSG-Seite)?
- Genestete Panels (Entity→Entity *innerhalb* eines offenen Panels) — in diesem Step zulassen oder flachhalten (Panel ersetzt Panel)?
- Reicht der eine Root-`@modal`-Slot für alle drei Typen, oder willst du per-Typ-Slots?

## Notes

Worktree **`chrono-lexicanum-product`**, Branch `codex/product-entity-panel` + PR. Die Panel-Naht ist im 109-impl § „For next session" Punkt 2 detailliert beschrieben — lies sie zuerst. CC fuhr in Step 1 nur curl-Smoke; der **Maintainer-Visual-Pass** (Desktop + ≤720px) steht für die Hubs *und* das neue Panel aus.
