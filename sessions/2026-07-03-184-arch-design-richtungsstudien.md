---
session: 2026-07-03-184
role: architect
date: 2026-07-03
status: implemented
slug: design-richtungsstudien
parent: null
links: [2026-07-02-183, 2026-07-02-181, 2026-06-03-121]
commits: []
---

# Design-Richtungsstudien — De-Slop Phase 1 (Product)

## Goal

2–3 **deutlich verschiedene** visuelle Richtungen als lokal öffnenbare Standalone-HTML-Studien über drei Flächen (Archiv-Liste, Buch-Detail, Map-Mock), damit Philipp eine Richtung wählt — bevor der Design-Language-Pass (Brief 185, folgt) und der Map-UI-Neubau (178) geschnitten werden. Kein App-Code, reine Studien.

Anlass (Philipp, 2026-07-03): Die Site gibt trotz gelungener Einzelelemente „AI-Slop"-Vibes. Seine Diagnose, wörtlich: die verwendeten Schriftarten, die Anordnung der Schrift, „AI-Hints wie Rauten und viele solche Icons", die Darstellung der Buttons.

## Design freedom — read before everything else

Alle ästhetischen Entscheidungen gehören dir — Schriftwahl und -paarung, Typo-Skala und -Anordnung, Farben, Abstände, Button-Sprache, Icon-Politik, Textur/Ornament-Grad, Copy-Register. **Die bestehende Optik ist ausdrücklich NICHT bindend** — das ist kein Polish-Auftrag, sondern Richtungssuche; brich bewusst mit dem Ist-Stand, wo er zur Slop-Diagnose beiträgt. Die Richtungen sollen echt divergieren (verschiedene Grundhaltungen, nicht drei Varianten desselben Looks). Was aus dem Bestand erhaltenswert ist, entscheidest du pro Richtung — Philipp mag „viele Elemente", welche, sagt der Rationale-Block. Empfohlen: frontend-design-Skill; Philipp fährt die Session bewusst mit Fable.

## Context

- **Sequenz-Entscheid (Philipp, 2026-07-03):** Design-Reset **vor** 178. Kette: 184 Richtungsstudien → Philipp wählt/editiert → 185 Design-Language-Pass (Tokens/Base-Layer, global) → 178 baut die Map gleich in der neuen Sprache → 181 Prune. Nur der Language-Reset ist vorgezogen; der volle UI-Gesamt-Pass (A11y-Polish, ui-backlog, Farbsprachen-Konsolidierung) bleibt geparkt (`brain/wiki/worklist.md` § E).
- **Ist-Stand Optik:** Zweischicht-Token-System `src/app/styles/00-tokens.css` (@theme + :root-Aliases), numbered CSS `10-…71-*.css`; Fonts via next/font: Cinzel, Cormorant Garamond, IBM Plex Mono (Space Grotesk orphaned, fällt in 181). Präzedenz für Ornament-Rückbau: ◇/◆-Glyph-Rückbau in Brief 166.
- **Flächen-Inputs (echte Daten, keine Lorem-Platzhalter):** Bücher aus `scripts/seed-data/books/*.json`; Map-Mock aus `scripts/seed-data/map-worlds.json` (`map-worlds-v2`: 1054 Welten, `kind` 12 Gruppen als Icon-/Farb-Kontrakt, `works`, `coverage` — Impl 183).
- Die Studien sind Wegwerf-Arbeitsmaterial mit Lebensdauer bis nach 185; Ablage-Präzedenz für nicht-servierte Top-Level-Ordner: `timeline-workshop/`, `presentation/`.

## Constraints

- Ablage: neuer Top-Level-Ordner `design/` — **nicht** `public/`, keine Route, kein Import aus App-Code. Jede Datei per Doppelklick im Browser öffnenbar, keine Build-Abhängigkeit (Web-Font-CDN-Links okay, Betrachtung erfolgt online).
- 2–3 Richtungen × 3 Flächen (Archiv-Liste, Buch-Detail, Map-Mock); Dateiorganisation innerhalb `design/` ist deine. Jede Richtung trägt einen kurzen Rationale-Block (was sie verwirft, was sie vom Bestand behält).
- Map-Mock = statische Optik-Studie (Karten-Chrome, Marker-Sprache über die `kind`-Gruppen, Popup-/Filter-Anmutung) mit echten Koordinaten-Teilmengen; Interaktion nicht nötig.
- Philipp editiert die Dateien nach dem Merge direkt — schreib sie so, dass Hand-Edits lokal möglich sind (lesbare Struktur, keine Minifizierung).
- Grund-Sensibilität statt A11y-Audit: lesbare Kontraste, keine Bewegungs-Orgien — die gewählte Sprache muss die spätere Systemisierung inkl. reduced-motion überleben.
- Zero-Diff außerhalb `design/**` + diesem Brief-File (Statusflip im PR).

## Out of scope

- Keine Implementierung in der App, kein Token-/CSS-Refactor — das ist Brief 185.
- Keine neuen `/lab`-Routen (181 löscht das Lab gerade; Gate-Bypass-Historie K13).
- Kein Home-Redesign (Philipp hat die Fläche bewusst nicht gewählt), keine Timeline-Studie.
- Kein ui-backlog-Kleinkram, keine `brain/**`-/`sessions/README.md`-Edits (Strang-Regel).
- Keine neuen Dependencies.

## Acceptance

The session is done when:

- [ ] `design/` enthält 2–3 Richtungen × 3 Flächen als lokal öffnenbare Standalone-HTML-Studien mit echten Inhalten (Titel, Blurbs, Autoren, Map-Daten).
- [ ] Die Richtungen sind auf einen Blick unterscheidbar und tragen je einen Rationale-Block.
- [ ] `git status` zeigt nur `design/**` + Brief-File; `npm run lint` / `typecheck` laufen unverändert grün (nichts wird importiert).
- [ ] Brief reitet im PR mit `status: open → implemented`.

## Open questions

- Welche Richtung hältst du selbst für die tragfähigste — und wie würde ihr Kern als 185er-Token-Mapping aussehen (Fonts, Skala, Button-System, Icon-Politik)?
- Was vom Bestand ist über alle Richtungen hinweg erhaltenswert (Kandidaten für „bleibt" im 185er-Brief)?

## Notes

- OQ-Queue 16b/c: Batches-Domäne, bewusst nicht Teil dieses Briefs.
- Philipps Review-Loop: Dateien lokal öffnen, direkt editieren, Anmerkungen als Kommentar in die Datei; optional legt er Claude-Design-Exporte als zusätzliche Kandidaten in denselben Ordner (gleiche Regeln).
- Aufräum-Entscheid (design/ löschen oder nach `brain/raw/` archivieren) fällt nach dem 185er-Pass, nicht hier.
