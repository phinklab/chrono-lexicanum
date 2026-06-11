---
session: 143
date: 2026-06-11
role: impl
slug: rogue-design-session
status: done
branch: codex/product-design-polish
worktree: chrono-lexicanum-product (Product/UI)
---

# Impl 143 — Rogue Design Session: Home-HUD, Typo-Norm, Focus-Removal, Compendium-Nav, Ask-Redesign

Maintainer-gesteuerte Design-Session (kein Architect-Brief; direkte Vorgaben
von Philipp, /frontend-design-Skill geladen). Sechs Aufträge + zwei globale
Normen, mit Browser-Review-Checkpoints nach jeder Fläche.

> **Hinweis Session-Nummerierung:** „Session 142" ist in Code-Kommentaren
> breit als der Live-Restyle (PR #165) referenziert, hat aber nie eine
> Session-Datei bekommen. Diese Session nimmt deshalb 143, damit 142
> eindeutig der Restyle bleibt.

## Befunde (für künftige Sessions relevant)

1. **Die Home-HUD-Elemente waren nie weg.** PR #165 hat MainAuspex,
   FloatingCoord und GhostReadout nur cyan→gold umgefärbt; Gold bei
   Opacity 0.28/0.10 ist über der warmen Vista schlicht unsichtbar
   (verifiziert gegen `92a24c8~1`). Fix war reine Opacity-Anhebung
   (--main 0.5, --secondary 0.22, Readout 0.5, Coords 0.7/0.6/0.55)
   plus ein dritter FloatingCoord. **Lehre:** Bei Akzentfarbwechseln
   müssen Opacities mitkalibriert werden — Sichtbarkeit ist
   kontrastabhängig, nicht tokenabhängig.

2. **Site-weite Lese-Norm jetzt als Token-Leiter** (00-tokens.css),
   abgeleitet von der Timeline/Era-Intro-Referenz und zweimal mit dem
   Maintainer nachjustiert (26px Desktop → zu groß → **22px ideal**):
   - `--fs-read-xs` 16px · `--fs-read-sm` 18px ·
     `--fs-read` clamp(19px, 1.5vw, 22px) · `--fs-read-lg` clamp(21px, 1.7vw, 25px)
   - `--lh-read` 1.62 · `--fw-read` 500
   - Mono: `--fs-label-xs` 11 · `--fs-label` 12 · `--fs-label-lg` 13 ·
     **neu `--fs-label-xl` 15px** (Stepper-/Rail-Header).
   Dichte Chrome-Flächen sind explizit gepinnt (Media-Player-Bar +
   Track-Rows, BottomConsole-Cards → `-sm`), damit die Norm sie nicht sprengt.
   Chronicle behält seine eigene Skala (ist die Referenzfläche);
   ingest/atlas (interne Tools) wurden nicht angefasst.

3. **Focus-Outlines site-weit entfernt** (Maintainer-Entscheid): globaler
   Kill-Switch in 10-base.css (`:focus, :focus-visible { outline: none
   !important; }` — outline-only, box-shadow wird dekorativ gebraucht).
   ~50 per-Komponente-Outline-Regeln sind damit tot; in angefassten Dateien
   (53-ask, 58-ask-booklist, 66-compendium, 50-hub) wurden sie gleich
   entfernt, der Rest opportunistisch bei künftigen Edits. Such-Inputs
   behalten ihre Gold-Unterlinien-Affordance (border/Gradient, kein outline).

4. **„//"-Dekor-Marker entfernt** (AI-typisch, Maintainer-Auftrag): Sweep
   über ~27 Produktionsdateien — Eyebrow-Präfixe (`"// LABEL"` → `"LABEL"`)
   und Mittel-Separatoren (`PERSONA // 1011` → `PERSONA · 1011`).
   Die `/lab/*_example`-Spezimen sind eingefrorene Referenzen und blieben
   unangetastet.

## Änderungen pro Fläche

### Home (page.tsx, 50-hub.css, HomeExplore.tsx, layout.tsx)
- HUD-Boost wie oben; **ScanLine + Eck-Klammern wurden im Review verworfen**
  („extrem hässlich") und sind komplett raus — rotierende Discs bleiben.
- Untertitel neu (nennt alle vier Tools: Chronicle, Cartographer, Compendium,
  Ask the Archive), Cormorant **300** (Weight eigens in layout.tsx
  nachgeladen), dezenter Text-Shadow.
- „More to explore": Band „Browse by Topic" = die fünf
  Compendium-Kategorien, alle zehn Rows verlinken echt; SOON-Rows entfallen
  (Idiom bleibt dormant für kuratierte Seiten).

### Compendium (66-compendium.css)
- `.cmp-nav` füllt die Leiste: `justify-content: space-between`,
  unter 960px zentriertes Cluster. Fünf tote Gold-Focus-Regeln entfernt.

### Ask (AskClient.tsx, QuestionCard.tsx, 53-ask.css, 58-ask-booklist.css)
Größter Block — Single-Column-Redesign, Props/URL-Logik unverändert:
- Masthead 60vh → ~38vh (min-height statt fixer height — kollisionssicher),
  Auspex-Sweep kleiner/dezenter, Foto-Fade rampt früher ab.
- **Ein Lese-Fenster** (~900px zentriert) mit Wash 0.5 statt 0.25 — das war
  Philipps Lesbarkeits-Hauptpunkt. Stage enthält Stepper · Frage · Nav.
- **PROTOCOLLVM als horizontaler Stepper** (ersetzt die Seiten-Rail): Label
  in `--fs-label-xl`, fünf römische Marken als Revisit-Buttons, verbunden
  mit Terminus-Hairlines (hellen nach versiegeltem Schritt auf), Zustände
  ◆ gold / ◇ bone / faint; versiegelte Antwort klein kursiv darunter
  (mobil ausgeblendet). A11y: `aria-live` sitzt jetzt auf
  `.ask-stage__body`, nicht mehr um den Stepper.
- Frage beruhigt: redundante Protokoll-Zeile + Riesen-Ornament raus,
  Gold-Kicker „QVAESTIO II", Prompt bis 38px, **Ballot einspaltig**.
- Rail-Duplikate (zweiter Reset, „Complete archive"-Link) entfallen.
- Wizard-Best-Practices (Web-Research): ein Schritt pro Screen, sichtbarer
  Stepper mit klaren Zuständen, ≥16px Body — NN/g (4 principles reduce
  cognitive load), UXPin (progress trackers), Eleken (wizard pattern),
  Webstacks (multi-step forms).

### /lab/design (design.css, page.tsx)
- Typoskala konsumiert jetzt die globalen Tokens (`--lds-body: var(--fs-read)`
  usw.) statt eigener Duplikate — der Styleguide kann nicht mehr driften.
- Neue Spezimen-Rows: Body Lead / Body Kompakt / Caption / Mono XL.
- Stale Focus-Ring-Regel + veralteter „Promotion ist nur Empfehlung"-Header
  korrigiert. Seite bleibt deployt, aber in keinem Menü.

## Commits (Branch `codex/product-design-polish`)

1. `cd92605` — Foundations: Typo-Tokens, Focus-Kill-Switch, //-Sweep
2. `364e159` — Home: HUD-Boost, Subtitle, Explore-Links
3. `14414c5` — Home-Review-Fixes: ScanLine + Corners raus, Subtitle 300
4. `7d83441` — Type scale: Standard-Body bei 22px Desktop gekappt
5. `f025b1e` — Compendium-Nav: space-between + tote Focus-Regeln raus
6. `5af32df` — Ask-Redesign: Single-Column + PROTOCOLLVM-Stepper
7. `0fb66b7` — Type-Sweep: dichte Chrome gepinnt, /lab/design auf Tokens

Verifikation pro Block: `tsc --noEmit` + `eslint` grün; Browser-Review durch
Philipp nach Home, Compendium und Ask (jeweils explizit abgenommen). Dev-Server
musste zweimal nach bekanntem Muster neu gestartet werden (Node-Prozesse per
CommandLine-Match killen, `.next` löschen, EIN Server).

## Offen / Folgearbeit

- Restliche tote Outline-Regeln (~40) in nicht angefassten Partials
  opportunistisch entfernen (Kill-Switch neutralisiert sie bereits).
- Era-Intro der Chronicle (`.ei-text`) ist bewusst größer als die Norm
  (Inszenierung) — falls das doch vereinheitlicht werden soll: eigener Pass.
- `.hub-explore__soon`-Idiom + RowInner-Else-Branch bleiben dormant für
  künftige kuratierte Seiten (Hot Topics o. Ä.).
