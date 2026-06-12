---
session: 2026-06-01-113
role: architect
date: 2026-06-01
status: implemented
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

Phase B baut auf dem redesignten `EntityView` aus Phase A auf → **gleiche Branch, `/clear` zwischen den Phasen** (hält das Token-Fenster klein, ganz **ohne** Zwischen-Merge — B braucht A nur im Working-Tree, nicht auf `main`); **ein PR mit A+B am Ende.**

## Design freedom — read before everything else

Die **gesamte Optik beider Phasen gehört dir** (du hast den frontend-design Skill). Phase A: Header-Treatment (wie Name + Meta-Zeile sitzen), Karten-Shapes, Sektions-Rhythmus, Stil **und exakter Umbruch-Breakpoint** der „VERKNÜPFT"-Rail, und die **exakten Werte des Gradient-to-dark** (welche Farbe/oklch, Stops, Opacity, ob Verlauf vs. flacher Scrim vs. Vignette — Hauptsache der Hub liest sich klar über dem Decor). Phase B: Panel-Form (Drawer/Modal/Side-Sheet), Breite/Höhe, Backdrop, Ein-/Ausblend-Timing + Easing, Scroll-Verhalten, Close-Affordance, Mobile-Treatment, Fokus-Ring. Exakte px/ms/oklch/Klassen-Shapes sind deine. Das **Mockup unten ist ein Struktur-Nordstern, kein Pixel-Spec** — es legt Anordnung + welche Sektionen fest, nicht Maße/Farben/Timings. Halte dich an die `src/app/styles/`-Ownership-Split-Konvention (neues Ownership-File, kein `.module.css`) und an die Politur der bestehenden reworkten Flächen (Brief 109 Hubs, `/buch/[slug]`).

## Mockup (Struktur-Nordstern — Optik ist CC's)

Aus der Design-Session mit Philipp; zeigt einen Charakter-Hub („Magnus the Red"). **Struktur**, nicht Maße:

- **Kopfleiste:** links ein Zurück-Link „‹ <Typ-Plural>" (z.B. „‹ Charaktere"). *(Die „Suche" oben rechts im Mockup ist Step 3 — **nicht** in diesem Brief.)*
- **Header:** Entity-Name groß (`<h1>`), darunter eine **Meta-Zeile aus 1–3 Fakten, die wir schon haben** — Charakter → primäre Fraktion; Fraktion → Alignment (+ ggf. Parent); Welt → Sektor (+ ggf. Designation). **Nicht** die Mockup-Strings „Primarch / Ära M31 / Heimat: Prospero" — die brauchen Daten, die das Schema heute nicht hat, und sind **deferred** (§ Out of scope). **Kein Bild-Slot** — das Mockup zeigt „Bild" als grauen Platzhalter; wir lassen ihn jetzt ganz weg.
- **Werke:** Karten, gruppiert je Kind — heute „Bücher (n)". Zusätzliche Work-Kinds erscheinen als eigene Gruppen, **sobald ihre Daten existieren** (Schema-Enum + Label, und eine Route falls die Gruppe verlinken soll): Podcasts erst mit Brief 114 (das `work_kind`-Enum kennt sie heute **nicht**), Videos später. `RelatedWorks` gruppiert schon generisch und rendert nicht-Buch-Kinds heute **inert** (kein Link, da keine Route). In **diesem** Brief wird dafür nichts gebaut; das Layout muss die zusätzlichen Gruppen nur sauber aufnehmen können.
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
- **Meta-Zeile nur aus vorhandenen Feldern.** Welche 1–3 Fakten je Typ in die Header-Meta-Zeile wandern, ist Daten-/IA-Entscheidung: Charakter → primäre Fraktion; Fraktion → Alignment (+ Parent falls vorhanden); Welt → Sektor (+ Designation falls vorhanden). **Kein neuer Loader-Datenpfad, keine Schema-Spalte, kein Bild.** Der Loader liefert die Fakten schon; die View wählt 1–3 davon. **Dedupe-Regel:** in die Meta-Zeile gehobene Fakten werden im Dossier **nicht** wiederholt — die Meta-Zeile konsumiert sie, das Dossier rendert nur die übrigen Fakten + Tags (ein leeres Dossier rendert wie heute nichts).
- **Rechte Rail mit Reflow.** Die „VERKNÜPFT"-Rail rendert als Aside neben der Hauptspalte und **bricht unter die Hauptspalte** ab einem schmalen Breakpoint und im Panel-Kontext (Breakpoint = deiner). Leere Cross-Link-Gruppen rendern nichts.
- **Kind-Gruppen erweiterbar (nicht: gebaut).** Das Werke-Layout nimmt zusätzliche Kind-Gruppen ohne Umbau auf, sobald deren Daten existieren — d.h. `work_kind`-Enum + Label, und eine Route, falls die Gruppe verlinken soll. `RelatedWorks` gruppiert heute schon generisch und rendert nicht-Buch-Kinds als **inerte** Chips (keine Route); Podcasts kennt das Enum heute **nicht** (kommen mit Brief 114), Videos später. Hier wird **keine** neue Gruppe gebaut.
- **Gradient-to-dark auf der Hub-Fläche.** Der Hub liest sich klar über dem `SiteBackground`-Decor; `prefers-reduced-motion` beachtet. Richtung = dunkler Verlauf/Scrim; Werte deine.

**Acceptance — Phase A fertig, wenn:**

- [ ] Die drei Vollseiten (`/charakter|fraktion|welt/[slug]`) rendern das neue Layout: `<h1>` + 1–3-Fakten-Meta-Zeile (nur vorhandene Daten, kein Bild), Werke als Karten je Kind, rechte „VERKNÜPFT"-Rail.
- [ ] **Keine Fakt-Dopplung:** ein Fakt, der in der Header-Meta-Zeile steht, erscheint **nicht** zusätzlich im Dossier (Meta-Zeile konsumiert ihn; ein dadurch leeres Dossier rendert nichts).
- [ ] Die Rail bricht an einem schmalen Breakpoint unter die Hauptspalte um (per Resize/Screenshot belegt).
- [ ] Der Hub ist über dem `SiteBackground` klar lesbar (Gradient-to-dark); `prefers-reduced-motion` respektiert.
- [ ] `EntityView` weiterhin db-frei + besitzt das einzige `<h1>`; `git grep` belegt keine server-only-Imports in der View.
- [ ] `npm run typecheck` + `lint` + `build` grün; die drei Routen weiterhin ● (SSG).
- [ ] Auf der gemeinsamen Branch committet; danach `/clear` — **kein Zwischen-Merge** (Phase B baut auf diesem Working-Tree-Stand auf).

## Phase B — In-Context-Panel

**Constraints (architektonisch, bindend):**

- **Gleiche URL via intercepting routes.** Next.js parallel/intercepting routes (`@modal`-Slot + `(.)`/`(..)`-Intercept — die Punkt-Notation ist dein Detail). Soft-Nav in der App → Panel; Hard-Nav / Refresh / geteilter Link / SEO-Crawler → die volle **SSG-Seite aus Phase A** (kanonischer Fallback). **Slot-Reset gehört dazu:** eine Soft-Nav auf eine Route, die der Slot **nicht** interceptet — insb. ein `/buch/[slug]`-Link aus dem offenen Panel (`RelatedWorks` verlinkt Bücher) — muss das Panel **sauber ausblenden**, nicht stehenlassen. Outcome, nicht Rezept: `default.tsx` (null) allein reicht dafür nicht immer; die passende Slot-Mechanik (z.B. zusätzlich eine Catch-all-Slot-Route, die `null` rendert) ist dein Detail. Direktladen einer solchen Nicht-Entity-Route bleibt unberührt.
- **Ein geteilter `@modal`-Slot** trägt alle drei Entity-Typen — **kein** Slot pro Typ. *(Entschieden 2026-06-02 mit Philipp.)*
- **Flaches Panel-Modell + History-/Close-Vertrag.** Ein Klick auf einen Entity-Link *im* offenen Panel **ersetzt** den Panel-Inhalt **und** die Panel-URL; **keine** genesteten/gestapelten Panels. *(Flach-Entscheid 2026-06-02 mit Philipp.)* Daraus folgt der Close-Vertrag: die Close-Affordance (Escape/Backdrop/Button) führt **immer** auf den Kontext zurück, der beim Öffnen *unter* dem Panel lag — **nicht** auf eine zwischenzeitlich im Panel besuchte Entity. Heißt: In-Panel-Entity-Hops legen **keine** gestapelte Browser-History an. Mechanik (replace- statt push-Nav für In-Panel-Hops o.ä.) ist dein Detail; das Outcome ist bindend.
- **Zero Fork.** Das Panel importiert `loadEntity` + die redesignte `<EntityView>` unverändert. Kein zweiter Datenpfad, keine zweite View.
- **Server-Grenze bleibt.** `loadEntity` server-only; der Panel-Daten-Fetch ist RSC. Nur die Overlay-Hülle ist `'use client'`.
- **`prefers-reduced-motion`** respektiert (reduzierte/keine Animation).
- **A11y-Outcomes** (Mechanismus/Lib deiner Wahl; Ziel-Bar: WAI-ARIA APG „Dialog (Modal)"): Fokus-Trap im offenen Panel (Tab **und** Shift-Tab bleiben gefangen), initialer Fokus landet im Panel, Escape schließt, Fokus-Restore aufs auslösende Element beim Schließen, `aria-modal` + Label, Hintergrund inert. Es gibt bereits ein lokales Muster (`DetailPanel`) — wo es passt, wiederverwenden statt neu erfinden.
- **Gradient-to-dark-Scrim** hinter dem Panel, damit es über dem unruhigen `SiteBackground` abhebt; Werte deine.
- **Wiring:** der `@modal`-Slot sitzt so (Root-/geteiltes Layout), dass bestehende In-App-`<Link>`s auf Entity-URLs automatisch das Panel öffnen — die „VERKNÜPFT"-Rails + Fact-Links der Hubs (Entity↔Entity), Entity-Chips auf `/buch/[slug]` + `/buecher` falls vorhanden, **und die `/atlas/{charaktere,fraktionen,welten}`-Inventory-Zeilen** (zeigen heute via `<Link>` auf die Entity-URLs → werden vom root-nahen Slot mitgefangen). Das ist **gewollt**: ein root-/layout-naher Slot fängt **alle** In-App-Entity-`<Link>`s konsistent, **keine** per-Link-Umbauten, **kein** per-Quelle-Sondering. Klick-Quellen außerhalb dieses Sets — Timeline/Map/Ask — bleiben Out of scope (eigener Step).

**Acceptance — Phase B fertig, wenn:**

- [ ] Soft-Nav-Klick auf einen Entity-Link (z.B. ein „VERKNÜPFT"-Chip auf `/charakter/horus`) öffnet ein Overlay mit **demselben** `EntityView`-Inhalt; die URL wechselt auf die Ziel-Entity.
- [ ] Direktes Laden / Refresh / geteilter Link rendert die volle SSG-Seite (= Phase-A-Layout, unverändert).
- [ ] Escape + Backdrop-Klick + Close-Affordance schließen das Panel und stellen die darunterliegende View + den Fokus wieder her.
- [ ] **Flach + Close-Vertrag:** Panel offen auf Entity A → Klick auf Entity B im Panel → Panel zeigt B, URL = B; **Close landet auf der Ursprungsseite** (die beim Öffnen darunter lag), **nicht** auf A.
- [ ] **Slot-Reset:** Panel offen → Klick auf einen `/buch/[slug]`-Link darin → Panel **schließt**, die Buchseite rendert (kein zurückbleibendes Overlay).
- [ ] **A11y belegt:** initialer Fokus im Panel, Tab/Shift-Tab bleiben gefangen, `aria-modal` + Label gesetzt, Hintergrund inert, Fokus-Restore aufs auslösende Element beim Schließen.
- [ ] Panel hebt sich klar über dem `SiteBackground` ab (Scrim); `prefers-reduced-motion` respektiert.
- [ ] `git grep` belegt: `loadEntity` aus dem Intercept-Segment aufgerufen, `EntityView` unverändert importiert — **kein** zweiter Datenpfad, **kein** View-Fork.
- [ ] `npm run typecheck` + `lint` + `build` grün; die drei Entity-Routen weiterhin ● (SSG).
- [ ] Auf derselben Branch wie Phase A; wenn A **und** B fertig → **ein PR** (beide Phasen zusammen).

> **Notfalls dritte Phase:** Wird Phase A zu groß für eine Low-Token-Session, ist die saubere Naht zum Splitten die **rechte Rail + Reflow** (→ Phase A2); Header-Meta + Karten + Gradient-to-dark zuerst (Phase A1).

## Out of scope

- **Suche** (Step 3), `/werke`-Browse (Step 4), Startseite (Step 5).
- **Bild + reichere Header-Fakten** (Rolle „Primarch", Ära, Heimat) — brauchen Schema-Spalten + Backfill, **deferred** (Maintainer-Entscheidung 2026-06-02: kein großes Fass jetzt). Kommen diese Daten je, ist das ein Batches-Schritt; die Header-Meta-Zeile nimmt sie dann zusätzlich auf.
- **Podcasts/Videos-Sektionen bauen** — das `work_kind`-Enum kennt Podcasts heute nicht (kommen mit Brief 114), Videos später; `RelatedWorks` gruppiert generisch und rendert nicht-Buch-Kinds heute inert. Hier nur „das Layout nimmt zusätzliche Gruppen sauber auf".
- **Timeline-/Map-/Ask-Klick-Quellen** als Panel-Auslöser — eigener Folge-Step (das Wiring fängt in diesem Brief nur die oben genannten In-App-Entity-`<Link>`-Quellen).
- `/aera` + `/serie`-Routen; `/buch`-Refactor; Grammatik-Konvergenz (`.c-chip`/`.c-section`-Primitive) — optional, nur wenn ohne `/buch`-Umbau billig mitfallend.
- **Kein Schema/DB/Resolver-Touch** in beiden Phasen.

## Open questions

- **Entschieden (2026-06-02 mit Philipp):** Panel-Verschachtelung → **flach**; `@modal`-Slot → **ein geteilter**; **Bild weglassen**; Header-Meta → **nur 1–3 vorhandene Fakten** (und werden im Dossier nicht gedoppelt). Alle in Constraints überführt.
- Offen, CC's Wahl unter Design freedom: „volle Seite öffnen"-Affordance im Panel (Hard-Nav zur SSG-Seite)?; exakter Reflow-Breakpoint der Rail; ob „Podcasts"/„Videos" als leere Sektions-Platzhalter angedeutet oder ganz weggelassen werden, bis Daten da sind (Empfehlung: weglassen — leere Sektion rendert nichts).

## Notes

Worktree **`chrono-lexicanum-product`**. **Eine Branch für beide Phasen** (z.B. `codex/product-entity-redesign-panel`): Phase A committen → `/clear` → Phase B auf **derselben** Branch → **ein PR mit A+B**, erst wenn beide fertig sind. **Kein Zwischen-Merge.** Branch-Name finalisierst du selbst (CC-Konvention `codex/product-<slug>`). (Phase A ist zwar eigenständig auslieferbar — willst du den Redesign doch früher live, könnte A allein mergen; Default ist aber: zusammen.) Der Brief bleibt `open`, bis der PR gemergt ist; flippt dann auf `implemented`. Die Panel-Naht ist im 109-impl § „For next session" Punkt 2 beschrieben — für Phase B zuerst lesen. CC fuhr in Step 1 nur curl-Smoke; der **Maintainer-Visual-Pass** (Desktop + ≤720px) steht für die Hubs *und* das neue Panel aus. Versionen (falls eine neue Dep nötig ist) recherchiert + pinnt CC, kein Pin im Brief.
