---
title: Open questions (next-brief queue)
type: overview
created: 2026-05-09
updated: 2026-06-07
sources:
  - ../../sessions/README.md
  - ../../sessions/2026-06-03-122-arch-batches-board.md
related:
  - ./project-state.md
  - ./deferred-questions.md
  - ./pipeline-state.md
  - ./log.md
confidence: high
---

# Open questions

> Items the **next** architect brief MUST address. The queue is intentionally small (3–5 items). Cowork prunes here when an item lands in a brief or is otherwise resolved. Dormant/distant items live in [`./deferred-questions.md`](./deferred-questions.md); phase-internal backlog (3d/3e/3f reminders) in [`./pipeline-state.md`](./pipeline-state.md).
>
> **Geschlossene OQs liegen in git + [`log.md`](./log.md).** Die durchgestrichenen/`-historic`-Einträge (OQ 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14) und die kompakte Migrations-Historie wurden 2026-06-01 ausgelagert (Token-Diet-Session: dieses File war auf ~19k Token gewachsen, ~14 von 16 Einträgen waren geschlossen). Wer die Schließungs-Begründung eines alten OQ braucht, liest `git log` oder `log.md`.

Format per item: **(N) <Title>** with `Owner: …` (who has to act) · `Sessions: …` (raw sources) · `Follow-up brief: …` (if known).

---

> **Queue leer seit 2026-06-03.** Die beiden zuletzt offenen Items sind in die
> stehenden Strang-Boards gefaltet und werden dort getrackt — die Boards sind ab
> jetzt der laufende Task-Tracker für Strang-Arbeit:
>
> - **(3) Hand-Check-Workflow / Override-Format** → Board **[122-B2](../../sessions/2026-06-03-122-arch-batches-board.md)** (Buch-Kuratierung).
> - **(13) Crawl-Simplification / Dead-Code-Retirement** → Board **[122-B6](../../sessions/2026-06-03-122-arch-batches-board.md)**.
>
> Die ausgelagerten Detailtexte stehen in `git log`. Neue Carry-over-Items aus
> Impl-Reports kommen wie gewohnt hier als nummerierte Einträge rein.

---

**(15) Compendium — Entity-Hub-Taxonomie + Tags als Türen (Bücher ∪ Podcasts)**
`Owner: Cowork` (in die P5/P9-Task-Briefings falten — kein eigener Brief) · `Sessions: Chat 2026-06-07` · `Follow-up brief: 121-P5 (Entity-Hubs) + 121-P9 (Charakter-/Primarchen-Galerie); Kurations-Schicht 129/122-B9; Cross-Podcast-Suche → 121 (Podcast-Redesign); Backend-Gate → 130/131/122-B1`

Der „Factions"-Hub wird zum **Compendium**: ein Entity-Verzeichnis mit den Top-Level-Kategorien **Factions**, **Primarchen** (eigener Top-Level-Typ, getragen vom `is_primarch`-Kurationsflag aus 122-B9/129 — erscheinen nur hier, nicht zusätzlich unter Characters), **Characters**, **Welten/Orte** und **Autoren**. Welten sind **schwellen-gegated**: ein Ort wird erst ab ~4–5 Erwähnungen über Bücher und/oder Podcasts ein Eintrag (exakte Schwelle datengetrieben; v1 evtl. ganz gecuttet). **Autoren** sind real-world — separate Achse, nicht in denselben Topf wie die In-Universe-Typen. Die `persons`-Tabelle hängt über die work-keyed `work_persons`-Junction (Rollen author/co_author/translator/narrator/…) bereits an Bücher **und** Episoden; eine Autoren-Seite zeigt Werke + Podcast-Auftritte also ohne Schema-Änderung. v1-Scope: `role=author/co_author`; Gate = nur Daten-Population der Episode-Person-Rollen. Tags in Büchern (heute nicht klickbar) und Podcasts (heute → `/werke?faction=`) öffnen das Compendium-Entity-Overlay (`@modal`-Pattern aus 113), das Bücher **und** Podcast-Episoden vereint zeigt. **Backend-Gate:** Podcast-Episoden sind heute nur faction-getaggt — Charakter-/Welt-Pivots aus Podcasts (und das Welt-Schwellen-Counting über Podcasts) setzen Episode-Tagging über Factions hinaus voraus → Podcast-Tagging-Achse (130/131/122-B1). Exakter Schwellenwert, Copy und Visuals = Design-Freiheit/CC.
