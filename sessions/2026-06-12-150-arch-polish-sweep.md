---
session: 2026-06-12-150
role: architect
date: 2026-06-12
status: open
slug: polish-sweep
parent: null
links:
  - 2026-06-03-121
commits: []
---

# Polish-Sweep — Content-Warnings raus, Fraktions-Icons, Loading-Transparenz, Login-BG + Credit-Slot (Board 121, Paket 4)

## Goal

Vier kleine, sichtbare Verbesserungen in einer Product-Session: die Content-Warning-Anzeige verschwindet, der generische Punkt vor Büchern wird zu einem Fraktions-Icon, der Cogitator-Loading-Zustand verliert seinen schwarzen Hintergrund, und der Login-Screen bekommt ein neues Hintergrundbild mit einem generalisierten Artist-Credit-Slot.

## Design freedom — read before everything else

Optik ist deine (frontend-design Skill): wie die vier Fraktions-Icons aussehen (Stil, Strichstärke, Größe, ob Glyphen/SVG/Unicode), Platzierung und Typo des Credit-Slots, Übergänge/Opacity des Loading-Zustands, exakte Werte überall. Die Punkte unten beschreiben **was** erreicht sein soll, nie wie es aussieht.

## Context

- Board [121](./2026-06-03-121-arch-product-board.md), Sammel-Session aus dem Backlog-Sort 2026-06-12 (Cowork-Chat). P6 ist bis auf die Content-Warning-Anzeige erledigt — die fällt hier.
- Die **Daten**-Seite der Content-Warnings entfällt parallel in Brief [149](./2026-06-12-149-arch-curation-foundation.md) (Batches). Dieser Brief entfernt nur die Anzeige; nicht auf 149 warten, die Anzeige-Entfernung muss auch mit noch vorhandenen Daten funktionieren.
- Artist-Credits existieren als Muster: per-Event-Credits + Era-Credit-Fallback unten rechts in der Cinematic-Timeline (`eraArtCredits.ts`, Sessions 145/146).
- Login-Screen: Session 145 (`/login`, `SiteBackground` Variante `login`, `public/img/login.webp`).

## Die vier Punkte

1. **Content-Warning-Anzeige raus.** Überall, wo Content-Warnings gerendert werden (Buch-Detail, Listen, Popups), verschwinden sie ersatzlos.
2. **Fraktions-Icons statt Punkt.** Der generische Punkt-Marker vor Buch-Einträgen wird zu einem kleinen Icon nach Fraktions-Zugehörigkeit in vier Klassen: **Imperium, Space Marines, Xenos, Chaos**. Mapping-Logik (welche Faction → welche Klasse, Fallback wenn keins passt) gehört in eine kleine, zentrale Stelle; das Alignment-Util `src/lib/seed/alignment.ts` existiert. Fallback-Darstellung für nicht zuordenbare Bücher ist deine Wahl (der bisherige Punkt ist okay).
3. **Cogitator-Loading transparent.** Während DB-Ladezuständen (z. B. `/compendium`) steht „Cogitator Loading" auf hartem Schwarz. Der Hintergrund soll durchscheinend sein, sodass die Seite/Vista darunter sichtbar bleibt. Gilt für alle `loading.tsx`-Routen, die das Pattern teilen.
4. **Login-BG + generalisierter Credit-Slot.** Neues Login-Hintergrundbild (Quelldatei liefert Philipp — vor Start nachfragen, wo sie liegt; Konvertierung via sharp nach dem 145/146-Muster). Unten rechts ein Artist-Credit: **„bubondubon"**, verlinkt auf den Reddit-Nutzer bubondubon. Dabei den Credit-Slot aus der Cinematic-Timeline zu einem wiederverwendbaren Mechanismus heben, sodass **jede Seite mit Hintergrund-Artwork** (Login, Hub, künftige) einen Credit unten rechts tragen kann — Map Bild-Ref → Credit(s), Rendering einheitlich.

## Constraints

- `prefers-reduced-motion`, lesbarer Kontrast, Keyboard-Erreichbarkeit der Credit-Links.
- Keine Daten-/Schema-Änderungen (Content-Warning-**Daten** sind Brief 149). Icon-Mapping lebt im Frontend.
- URL-/searchParam-Contracts unverändert.
- Keine neuen Dependencies ohne Not; Icons bevorzugt als eigene SVGs/Inline (keine Icon-Library nur dafür).

## Out of scope

- Admin-Seite, Seiten-Rückbau (`/atlas`, `/buecher`, „Open Full Page"), Gate-Ausnahmen, CSP — alles Paket 2 (separater Brief).
- URL-Migration auf Englisch + `/buch`-SSG-Refactor (Paket 5).
- Mobile-Sweep (eigene Sessions); Map unverändert.
- Brief 149s Daten-Seite.

## Acceptance

The session is done when:

- [ ] Keine Route rendert mehr Content-Warnings (auch nicht bei noch vorhandenen Daten).
- [ ] Buch-Einträge in Listen tragen das Fraktions-Icon ihrer Klasse (Imperium/Space Marines/Xenos/Chaos) bzw. den definierten Fallback; Mapping an einer Stelle.
- [ ] Loading-Zustände zeigen den Cogitator über durchscheinendem Hintergrund (Browser-Eyeballing durch Philipp auf `/compendium`).
- [ ] `/login` zeigt das neue Artwork mit Credit „bubondubon" → Reddit-Link unten rechts; der Credit-Mechanismus ist wiederverwendbar (mindestens Login nutzt ihn, bestehende Timeline-Credits unverändert oder migriert).
- [ ] `npm run lint` + `tsc --noEmit` grün; Browser-Eyeballing durch Philipp.

## Open questions

- Lohnt es, die bestehenden Era-/Event-Credits der Timeline auf den neuen Mechanismus zu migrieren, oder bleiben sie eigenständig? Kurze Einschätzung im Report reicht.

## Notes

- Strang: Product (`chrono-lexicanum-product`), stay-local-iterate, PR auf Philipps `fertig`.
- Login-Quellbild: vor Beginn bei Philipp erfragen (Pfad/Upload).
