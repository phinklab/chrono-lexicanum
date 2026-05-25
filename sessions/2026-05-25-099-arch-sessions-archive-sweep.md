---
session: 2026-05-25-099
role: architect
date: 2026-05-25
status: open
slug: sessions-archive-sweep
parent: null
links:
  - 2026-05-23-095-arch-rollup-ownership
  - 2026-05-09-051-arch-brain-slim-pass
commits: []
---

# Sessions-Archiv-Sweep — geschlossene Session-Files nach archive/2026-05/

## Goal

Den über die ganze W40K-Resolver-Kadenz angewachsenen Bestand geschlossener Session-Files aus dem `sessions/`-Root nach `sessions/archive/2026-05/` verschieben und **jede** Referenz darauf umschreiben, sodass `npm run brain:lint` grün bleibt. Reine Repo-Hygiene — kein Verhaltens-Change, kein Code-, Schema- oder DB-Touch.

Der `sessions/`-Root trägt heute rund 55 geschlossene `arch`/`impl`-Files (062–097). Die Archive-Regel ([`brain/wiki/workflows/sessions-format.md`](../brain/wiki/workflows/sessions-format.md) § Archiving) sagt: im Root liegen nur offene/`needs-decision`-Briefs samt ihrer Reports plus höchstens die letzten 1–2 gerade geschlossenen Sessions — alles andere wandert *promptly* nach `sessions/archive/YYYY-MM/`. Der Rückstand ist groß genug, dass `sessions/README.md` ihn explizit als eigene kleine CC-Aufgabe ausweist.

## Context

W40K ist datenkomplett (565 Bücher) und seit Brief 098 auch konsolidiert. Die W40K-Bootstrap-Resolver-Kadenz (Pässe 1–9) ist abgeschlossen; der nächste große Strang ist die HH-Domäne. Der `sessions/`-Root ist über diese Kadenz nie aufgeräumt worden — der letzte Archiv-Sweep war Brief 051 (Slim Pass, archivierte 031–048).

Das ist ein **Meta/Session-Task im Koordinations-Worktree** (`C:\Users\Phil\chrono-lexicanum`). Der File-Move *und* der Referenz-Rewrite fassen `sessions/README.md` und `brain/**` an — das sind Coordination-only-Writes (Brief 095, Rollup-Ownership). Erlaubt ist es hier, **weil** es der Koordinations-Worktree ist; die Regel ist an den Worktree-Pfad gebunden, nicht an den Agenten.

Präzedenz für die Mechanik: Brief 051 archivierte 031–048, der Phase-2-Abschluss 008/011–030 — jeweils `git mv` + Referenz-Rewrite + `brain:lint`-Verifikation. Form-Vorlage liegt also im Repo-Verlauf.

Der Post-Merge-Koordinations-Pass für Brief 098 (Cowork zieht Brief 098 in `project-state` / `pipeline-state` / `open-questions` / `index` / `log` / `README` nach) läuft **vor** dieser Session — der Working-Tree, den CC vorfindet, trägt die 098-Referenzen also bereits. Brief 098 (`arch` + `impl`) bleibt im Root (siehe unten), seine Referenzen brauchen daher keinen Rewrite.

## Was archiviert wird

**In Scope — `sessions/`-Root → `sessions/archive/2026-05/`:**

Jedes geschlossene `arch`/`impl`-Session-File im `sessions/`-Root — d. h. Brief auf `implemented`/`answered`, Impl-Report `complete`, und nicht Parent eines offenen Threads. Operativ heißt das: **alle Files mit NNN 062–097**. Dateinamen bleiben unverändert, nur der Ordner ändert sich. Alle tragen ein `2026-05-*`-Datumspräfix → Zielordner ist durchweg `sessions/archive/2026-05/`.

**Bleibt im Root (nicht anfassen):**

- Offene Briefs samt Reports: `2026-05-11-061-arch-ssot-loop.md` (offen, standing), `2026-05-23-096-arch-design-direction.md` (offen, Product-Strang in Arbeit), `2026-05-25-099-arch-sessions-archive-sweep.md` (dieser Brief) plus der zugehörige `099-impl`-Report.
- Die letzte gerade geschlossene Session: `2026-05-25-098-arch-w40k-consolidation-pass.md` **und** `2026-05-25-098-impl-w40k-consolidation-pass.md` — Brief 098 bleibt als „last just-closed" im Root (load-bearing für die anstehende HH- und Final-Konsolidierungs-Arbeit).
- Lebende Dateien: `README.md`, `resolver-loop-log.md`, `ssot-loop-log.md`, `resolver-pass-runbook.md`, `ssot-loop-runbook.md`, `consolidation-pass-runbook.md`.
- `_templates/`, `_drafts/`, `archive/`.

Falls der Working-Tree nach dem `git pull` ein File trägt, das diese Beschreibung nicht eindeutig einordnet (z. B. ein nachgezogener Report ohne passenden Brief im Root), entscheidet CC nach der Archive-Regel und hält die Einordnung im Report fest — kein Rateschritt.

## Vorgehen

1. **Move.** Jede der 062–097-Dateien per `git mv` von `sessions/<file>.md` nach `sessions/archive/2026-05/<file>.md`. Dateiname identisch.
2. **Referenz-Rewrite.** Jede relative Pfad-Referenz auf eine verschobene Datei umschreiben — `…/sessions/<id>.md` → `…/sessions/archive/2026-05/<id>.md`. Die Pfad-Tiefe unterscheidet sich je nach Quell-Datei (eine `brain/wiki/X.md` referenziert via `../../sessions/…`, eine `brain/wiki/decisions/Y.md` via `../../../sessions/…`) — pro Treffer die korrekte relative Tiefe wahren. Such-Oberfläche, vollständig durchgrepen:
   - `brain/**` — vor allem `sources:`-Frontmatter und Inline-Links in `brain/wiki/**`; auch `brain/CLAUDE.md`.
   - `sessions/README.md` und die lebenden Dateien in `sessions/` (Loop-Logs, Runbooks) — falls sie ein verschobenes File namentlich referenzieren.
   - Top-Level `CLAUDE.md` und `AGENTS.md`.
   - `docs/**`.
3. **Verifikation.** `npm run brain:lint -- --no-write` muss 0 broken links / 0 blocking findings melden — eine übersehene Referenz ist ein gebrochener Link und fällt hier auf. Zusätzlich `npm run lint` + `npm run typecheck` grün (es wird kein Code angefasst — der Lauf bestätigt nur, dass nichts kaputt ging).
4. **Root-Sichtprüfung.** Nach dem Sweep enthält der `sessions/`-Root nur noch die oben unter „Bleibt im Root" gelistete Menge.

## Constraints

- **Koordinations-Worktree.** Diese Session läuft in `C:\Users\Phil\chrono-lexicanum`. Frische Branch `codex/session-099-archive-sweep` aus aktuellem `origin/main`; `main` read-only. Worktree-/Strang-/Branch-Selbstprüfung am Start ansagen (CLAUDE.md). Erkennt CC, dass es **nicht** im Koordinations-Worktree sitzt → anhalten und zurückfragen (der Move fasst `brain/**` + `sessions/README.md` an, das geht nur hier).
- **Nur Move + Pfad-Rewrite.** Der Inhalt (Body) keiner Session-Datei wird editiert. In `brain/**` und den Top-Level-Docs wird **ausschließlich** die relative Pfad-Komponente verschobener Referenzen umgeschrieben — kein inhaltlicher Edit, keine Frontmatter-`updated`-Bumps, keine Umformulierung.
- **`brain:lint` grün ist das Gate.** Eine übersehene Referenz = gebrochener Link = Lint-Fail. Der Sweep ist erst fertig, wenn `brain:lint -- --no-write` sauber ist.
- **Kein `git` in einer Sandbox.** CC läuft Windows-nativ. Stop-before-push: Branch nicht pushen, kein PR, bis Philipp `fertig` / `PR erstellen` sagt.
- **Keine Tool-Versionen pinnen, keine Dependencies, kein Schema-/DB-/Script-Touch.**

## Out of scope

Implementer sind eifrig — diese Dinge bleiben **explizit unangetastet**:

- **`sessions/resolver-dossiers/`.** Das ist ein dediziertes Artefakt-Verzeichnis, kein Root-Clutter — das Resolver-Pass- und das Konsolidierungs-Pass-Runbook schreiben ihre Per-Pass-Artefakte dorthin. Per-Pass-Dossiers, die sich in einem eigenen Unterordner sammeln, sind etwas anderes als lose Files im Root. Falls das Verzeichnis später unhandlich wird, ist das ein eigener kleiner Sweep — **nicht** Teil dieser Session.
- **Die Archive-Regel selbst.** `sessions-format.md` § Archiving wird nicht umformuliert.
- **Inhalt archivierter Briefs.** Keine „Verbesserung", keine Korrektur, kein Status-Re-Write an verschobenen Files.
- **Brief 098 + die `consolidation-pass-1-*`-Artefakte.** Brief 098 bleibt im Root; seine Artefakte unter `resolver-dossiers/` werden ohnehin nicht angefasst (siehe oben).
- **Die offenen Briefs 061 und 096** und deren etwaige Reports.
- **Resolver-/SSOT-/Konsolidierungs-Pässe, App-/UI-Routen, V2-Pipeline.**

## Acceptance

Die Session ist fertig, wenn:

- [ ] Alle geschlossenen Root-Session-Files (NNN 062–097) liegen unter `sessions/archive/2026-05/`, Dateinamen unverändert.
- [ ] Der `sessions/`-Root enthält nur noch: die Session-Files zu 061 / 096 / 098 / 099, `README.md`, `resolver-loop-log.md`, `ssot-loop-log.md`, `resolver-pass-runbook.md`, `ssot-loop-runbook.md`, `consolidation-pass-runbook.md`, sowie `_templates/`, `_drafts/`, `archive/`.
- [ ] Jede Referenz auf ein verschobenes File ist umgeschrieben — über `brain/**`, `sessions/README.md` + lebende `sessions/`-Dateien, Top-Level `CLAUDE.md` + `AGENTS.md`, `docs/**` hinweg.
- [ ] `npm run brain:lint -- --no-write` meldet 0 broken links und 0 blocking findings.
- [ ] `npm run lint` und `npm run typecheck` grün.
- [ ] Der gepaarte Impl-Report liegt unter `sessions/2026-05-25-099-impl-sessions-archive-sweep.md` (bleibt im Root — Report des offenen Briefs) und listet die Zahl verschobener Files + die Zahl umgeschriebener Referenzen. Brief 099 `status` → `implemented`.
- [ ] Stop-before-push: Branch nicht gepusht, kein PR, bis Philipp es sagt.

## Open questions

Inputs für den nächsten Architekten-Schritt, keine Blocker:

- Wie viele Referenzen mussten tatsächlich umgeschrieben werden, und in welchen Dateien lagen sie konzentriert? Die Zahl ist ein Signal dafür, ob die `sources:`-Frontmatter-Konvention beim nächsten Mal früher gepflegt werden sollte (z. B. Archivierung gleich beim Session-End statt gesammelt).
- Hat `brain:lint` Referenz-Typen *nicht* erfasst (z. B. Links in Datei-Typen außerhalb seines Scans)? Falls ja: Material für einen kleinen `brain:lint`-Coverage-Punkt.

## Notes

- **Präzedenz.** Brief 051 (Slim Pass, archiviert unter `sessions/archive/2026-05/2026-05-09-051-arch-brain-slim-pass.md`) hat 031–048 nach demselben Muster archiviert; der Phase-2-Abschluss 008/011–030. Dieselbe `git mv` + Referenz-Rewrite + `brain:lint`-Disziplin.
- **Sequenzierung.** Der Post-#98-Koordinations-Pass läuft vor dieser Session — der Working-Tree trägt die 098-Rollup-Referenzen also schon. Da Brief 098 im Root bleibt, brauchen seine Referenzen keinen Rewrite; nur die 062–097-Referenzen werden umgeschrieben.
- **Open-Questions-Queue.** OQ (3) Hand-Check-Workflow und OQ (13) Crawl-Simplification-Sichtung bleiben in `open-questions.md` — Brief 099 ist reine Repo-Hygiene und adressiert sie nicht. Sie sind als sekundäre Optionen in `project-state.md` § Next likely brief vermerkt; bewusst nicht in diesen Brief gefaltet.
- **Keine UI-Oberfläche → kein „Design freedom"-Abschnitt** (analog Brief 091/093/094/098 — reine Hygiene/Maschinerie).
- **Übergabe-Modus.** Normaler Stop-before-push, ein PR auf `fertig`.
