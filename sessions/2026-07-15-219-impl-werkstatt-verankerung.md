---
session: 2026-07-15-219
role: implementer
date: 2026-07-15
status: complete
slug: werkstatt-verankerung
parent: none (direkter Maintainer-Auftrag, E8-Betrieb; kein Architect-Brief)
links:
  - docs/launch-master-plan.md
  - docs/post-launch-feature-ideas.md
commits: []
---

# Werkstatt-Phase verankern — Plan-Nachtrag, Brain-Reconcile, Artefakt-Hygiene

Worktree: `chrono-lexicanum` (Koordination, E8-Ausnahme — per dieser Session bis einschließlich Launch-Readiness verlängert) · Strang: Koordination/Meta · Branch: `codex/session-219-werkstatt-verankerung`.

## Summary

Die Werkstatt-Phase ist jetzt kanonisch verankert: der Plan-Nachtrag W1–W6 (kein Launch-Zeitdruck, Werkstatt-Triage vor dem Gate, vorgezogene Qualitätspässe, tragendes Preview-Gate, fixes Release-Endspiel, E8-Verlängerung) steht datiert in `docs/launch-master-plan.md`, die Ideenliste vom 2026-07-13 ist als `docs/post-launch-feature-ideas.md` versioniert, und Brain + sessions/README sind auf den echten main-Stand `55a8ea7` (bis Session 218 / PR #264) abgeglichen. Wichtigste Abweichung vom Auftrag: die Session-Nummer ist **219** (nicht „bis 216" — Sessions 217/218 lagen bereits gemerged auf main und sind mit-reconciled), und die 212-/map-flicker-Dateien existieren nirgends mehr — statt „committen" gibt es einen klar gekennzeichneten Tombstone.

## What I did

- `docs/launch-master-plan.md` — Nachtrag „Werkstatt-Phase" (2026-07-15) als W1–W6 in § Entscheidungen; Sequenz + Stufen-Tabelle aktualisiert (Muss-Strecke ✅, Werkstatt-Phase, Qualitätspässe vor Launch, stilles Fenster); S7b-Header auf „vor dem Launch", S10b als faktisch erledigt markiert (213-Geräteabnahme), PL1 als „nie vor dem Launch" + Invite-Maschinerie als tragende Infrastruktur, S11-Header (Code-PR vor Launch / Doku-Rollup stilles Fenster).
- `docs/post-launch-feature-ideas.md` — Ideenliste vom 2026-07-13 unverändert übernommen, plus datierter Status-Vermerk (Werkstatt-Phase ersetzt „Post-Launch-Material"-Rahmung; Einstiegsreihenfolge dokumentiert).
- `brain/wiki/roadmap.md` — Phase-7-Abschnitt auf den Werkstatt-Pfad umgeschrieben; neues **Ideas backlog** mit den Schema-Ideen 3a (`character_relations`), 5 (`episode_covers_work`), 6 (`size_entries`); Post-Launch-Sektion auf stilles Fenster korrigiert.
- `brain/wiki/project-state.md` — Rewrite auf 2026-07-15: Werkstatt-Phase, Muss-Strecke gemerged (PRs #240–#256), EN-Routen/Curator/Legal-Stand, Cartographer mit zwei Renderern + 11 Journeys / 231 Acts (64 Chart-Points, 13 Sorties), aktualisierte Zahlen (40 DB-freie Suiten, 1.293 statische Seiten, Sitemap 2.277 URLs).
- `brain/wiki/worklist.md` — §A neu (Pfad zum Launch per Nachtrag); §B nur noch Operator-Checks (0015 als Readiness-Punkt-1-Verweis, optionaler Drift-Check); §§C/D als „Perfektions-Kandidaten" der Werkstatt-Triage gekennzeichnet (Chronicle-Desktop-Restyle, BrandBeacon, Cartographer-Tails, Drukhari-Starter, Podcast-Aliasse, Galaspar/Myr, `arthas_moloch`, Charakter-Long-Tail); §F mit den neuen Auflösungen.
- `brain/wiki/open-questions.md` — stale „Next = S1a"-Zeile durch Werkstatt-Stand ersetzt; Queue bleibt leer.
- `brain/wiki/index.md` — Katalogzeilen + Datumsstände nachgezogen.
- `brain/wiki/log.md` — Ingest-Eintrag für diese Session (Nachtrag, Reconcile, Hygiene).
- `sessions/README.md` — Head auf `55a8ea7`; Muss-Strecke, Map-Welle 210–218, Curator, Werkstatt-Entscheidungen; Thread-Tabelle auf Sessions 210–219 (Launch-Welle 196–209 als eine Zeile kondensiert).
- `sessions/2026-07-13-212-impl-map-render-pipeline.md` — **Tombstone** (klar als Rekonstruktion gekennzeichnet): 212 scheiterte auf dem Gerät, wurde vollständig zurückgebaut, Original-Report + Diff + Handover-Dateien sind verloren; kanonischer Fix ist Session 213 / PR #260.
- `sessions/2026-07-15-219-impl-werkstatt-verankerung.md` — dieser Report.

## Decisions I made

- **Session-Nummer 219 statt Fortschreibung „bis 216":** Sessions 217 (`journey-lore-prototypes`) und 218 (`journey-spatial-audit`) lagen bereits als Reports vor und sind via PR #264 auf main — der Reconcile umfasst sie mit, sonst wäre der Brain-Stand sofort wieder stale. Die im Auftrag genannten „11 Journeys/194 Acts aus 215" habe ich gegen den Code präzisiert: der 215-Report selbst nennt 195 Acts (102 nach dem 214-Research-Pass + 93 neue); **aktueller main-Stand nach 217/218 sind 231 Acts** (per `heading:`-Zählung über die elf Voyage-Dateien; Abaddon allein wuchs auf 42 Stationen). Brain trägt den aktuellen Stand.
- **Cameo-/`ask-fraktion`-Prüfauftrag — Ergebnis: abgedeckt.** (a) Die statischen `public/lab/ofob/**`-Prototypen wurden bereits in S5 (Session 204, PR #251) per Philipp-Entscheid **entfernt** (sie hätten öffentlich Google Fonts geladen, im Widerspruch zur Datenschutzerklärung); (b) Sessions 214/216 lieferten die live abgenommene `/ask/faction`-Hierarchie (Stepper + permanentes Register + Kapitelwahl + eine Antwort). Die Cameo-Studie wurde als Design-Input konsumiert, nicht 1:1 umgesetzt — es bleibt kein offener Rest. So in worklist §F dokumentiert.
- **212-Dateien: Tombstone statt Commit.** `sessions/2026-07-13-212-…md`, der 212-Diff, `docs/map-flicker-handover.md` und `map-flicker-chatgpt-prompt.md` existieren nirgends mehr — nie committet (git log --all leer), nicht in Stashes, nicht in den Strand-Worktrees, nicht in Downloads/Documents/Desktop. Statt Inhalte zu erfinden, dokumentiert ein als Rekonstruktion gekennzeichneter Tombstone die belegbaren Fakten (aus dem 213-Report). Die Handover-Dateien habe ich **nicht** rekonstruiert — ihr Inhalt ist durch den gemergten Fix (213/#260) obsolet.
- **Git-Status-Rauschen: nichts zu bereinigen.** Die ~115 modified aus dem Auftrag waren zum Session-Start nicht reproduzierbar — der Tree war vollständig sauber (0 modified, 0 untracked), auch nach `git fetch`. Vermutlich hatte ein früherer Zustand (CRLF-/Mount-Effekt) sich durch Checkout/Reset erledigt. Der Branch wurde erst nach dieser Prüfung geschnitten; es ist kein Rauschen im Diff.
- **Plan-Konsistenz statt nur Nachtrag:** Der Nachtrag trägt die Klausel „bei Widerspruch gewinnt dieser Nachtrag", zusätzlich habe ich die vier direkt widersprechenden Stellen (Sequenz/Stufen-Tabelle, S7b-Header, S10b, Post-Launch-Sektion) angepasst, damit niemand eine überholte Zeile als Spec liest. Die historischen Abschnitte (Änderungslog v2, E-Entscheidungen) bleiben unangetastet.
- **F-Nummern aufgelöst:** „F2 → F1 → F3" aus dem Auftrag ist im Plan und in der Ideenliste als „Idee 2 (Doppelkauf-Warner) → Idee 1 (Status Imperialis) → Idee 3c (Statistiken)" ausgeschrieben, damit die F-Kürzel nicht als eigene Nummerierung driften.

## Verification

- `npm run brain:lint -- --no-write` — pass, 0 blocking findings; 20 Warnings (Vorbestand).
- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm test` — pass, 40 DB-freie Suiten in 9,6 s.
- `SITE_URL=https://example.invalid npm run build` — pass; 1.293 statische Seiten generiert.
- Act-Zählung: `grep -c "heading:" src/lib/map/voyages/data/*.ts` → 231 über elf Dateien.
- 212-Suche: `git log --all` (leer), `git stash list` (keine 212-Einträge), Strand-Worktrees, `Downloads/Documents/Desktop` — kein Treffer.

## Open issues / blockers

- Die verlorenen 212-Artefakte sind endgültig weg; falls Philipp lokale Kopien außerhalb der durchsuchten Orte hat, kann der Tombstone durch das Original ersetzt werden.
- `docs/launch-session-prompts.md` wurde nicht angefasst — die Werkstatt-Sessions laufen laut Auftrag über Maintainer-Prompts; falls die Prompt-Sammlung um Werkstatt-Kickoffs erweitert werden soll, ist das ein Folge-Auftrag.

## For next session

- Werkstatt-Einstieg: Bewertungsrunde **Idee 2 (Doppelkauf-Warner)** — Datenbasis vollständig (`work_collections`), fast reine UI-Arbeit; offene Fragen stehen in der Ideenliste.
- Bei den Schema-Ideen (3a, 5, 6) vor dem Brief die Ideas-Backlog-Einträge in `roadmap.md` schärfen (Kernentscheidungen sind dort notiert).

## References

- `docs/launch-master-plan.md` § Entscheidungen → „Nachtrag — Werkstatt-Phase (2026-07-15)"
- `docs/post-launch-feature-ideas.md` (Ideenliste 2026-07-13 + Status-Vermerk)
- Session-Reports 210–218 (Quellen des Reconcile)
