---
session: 2026-05-23-095
role: architect
date: 2026-05-23
status: open
slug: rollup-ownership
parent: null
links:
  - 2026-05-17-082-arch-parallel-worktrees
  - 2026-05-17-083-impl-parallel-worktrees
commits: []
---

# Rollup-Ownership — konfliktfreie Parallel-Stränge

## Goal

Die beiden Implementer-Stränge (Product/UI + Batches/Ingestion) so entkoppeln, dass SSOT-Loop/Resolver und Website-Arbeit **echt parallel** laufen können — durch eine **worktree-gebundene Rollup-Ownership-Regel**: die wenigen Dateien, die Projekt-*Zustand zusammenfassen*, werden ab jetzt ausschließlich im Koordinations-Worktree geschrieben.

Brief 082/083 hat drei Worktrees etabliert, aber die Strang-Disziplin schneidet nur den *Code* sauber. Die rollup-/index-Dateien — `sessions/README.md` und alles unter `brain/` — werden von beiden Strängen angefasst und sind die einzige verbleibende Konfliktquelle, wenn zwei Stränge parallel pushen. Diese Session zieht dort eine harte Linie. Es ist eine reine Workflow-/Doku-Änderung; kein Code, kein Schema.

## Commit & PR — zuerst lesen

Dieser Brief editiert koordinations-eigene Dateien (`CLAUDE.md`, `AGENTS.md`, `brain/wiki/**`). Er wird darum **im Koordinations-Worktree** `C:\Users\Phil\chrono-lexicanum` implementiert — nicht im Product- oder Batches-Strang. Das ist konsistent mit der Regel selbst: koordinations-eigene Dateien ändert man im Koordinations-Worktree.

Der Architekten-Output (dieser Brief + der `sessions/README.md`-Edit) liegt **uncommitted** im Koordinations-Worktree. Vorgehen analog Brief 091:

1. Am Session-Start im Koordinations-Worktree die Standard-Branch-Regel anwenden: ist die aktuelle Branch `main` / detached / Bootstrap / bereits gemergt, eine frische Meta-Branch `codex/session-095-rollup-ownership` von `origin/main` anlegen.
2. **Zuerst** den Architekten-Output als eigenen Commit sichern: `sessions/2026-05-23-095-arch-rollup-ownership.md` + der `sessions/README.md`-Edit. Commit-Message z. B. `Brief 095 — Rollup-Ownership`.
3. **Dann** den Brief implementieren (ein logischer Schritt pro Commit).
4. **Am Ende** die Branch pushen und **einen** PR öffnen, der Architekten-Output + Implementierung zusammen trägt — kein zweiter PR.

Ist der Working-Tree wider Erwarten schon clean (Architekten-Output bereits vom Maintainer committet), Schritt 2 überspringen und direkt implementieren.

## Context

**Was es heute gibt.** Brief 082/083 hat drei dauerhafte Worktrees gebaut: Koordination (`chrono-lexicanum`, `main` read-only), Product/UI (`chrono-lexicanum-product`), Batches/Ingestion (`chrono-lexicanum-batches`). Die Strang-Disziplin (welcher Strang welche Code-Pfade besitzt) liegt in Brief 082; `CLAUDE.md` + `AGENTS.md` § „Parallel worktrees" tragen das Git-Protokoll.

**Wo das heute klemmt.** Die *Code*-Pfade der zwei Stränge überschneiden sich dank der Brief-082-Ownership-Regel praktisch nicht (Product → `src/app` + `src/components`, Batches → `scripts` + `src/lib`). Die einzige echte gemeinsame, konfliktanfällige Fläche sind die **Rollup-/Index-Dateien** — Dateien, die Projekt-Zustand zusammenfassen und deshalb in *jeder* Session neu geschrieben werden: `sessions/README.md` (Active-Threads + Carry-over) und die Brain-Wiki-Anker `brain/wiki/project-state.md`, `brain/wiki/log.md`, `brain/wiki/index.md`. Editieren zwei Branches dieselbe Rollup-Datei, kollidiert sie beim Merge/Rebase.

**Was den Konflikt aktiv erzeugt.** Die Atomic-Commit-Regel in `CLAUDE.md` § „Brain & Atlas" („an ‚atomic commit' pairs a code change with its Brain update") und die Sektion § „Brain updates from CC?" in `brain/wiki/workflows/cc-session.md` *fordern* den Implementer auf, Brain-Seiten gemeinsam mit dem Code zu editieren. In einer Single-Stream-Welt ist das richtig; mit zwei parallelen Strängen garantiert es Merge-Konflikte auf den Rollup-Dateien.

**Maintainer-Befund (diese Cowork-Session).** Genau dieses Aufeinandertreffen auf den README-/Brain-Dateien hat den letzten Parallel-Versuch unbrauchbar gemacht — „die READMEs wollten alle getracked werden".

**Entscheidung (AskUserQuestion, diese Session).** UI-Arbeit behält den vollen Brief↔Report-Flow — Briefs und Reports sind je *neue* Dateien und kollidieren nie. Nur die Rollup-Dateien werden single-writer. Der Maintainer hat „Zettel behalten" gewählt: kein Verzicht auf Doku, nur eine Besitz-Regel.

**Brief 094 (Resolver-Loop) folgt dieser Disziplin schon.** Der frisch implementierte Resolver-Loop ist brief-frei und schreibt ausschließlich Batches-Strang-eigene Dateien — Config, Runbook, Scripts, Dossiers, Digests, Reports. Sein § „Out of scope" verschiebt den Brain-Wiki-Update ausdrücklich in einen nachgelagerten Cowork-Pass; das Resolver-Pass-Runbook hält fest, dass eine Phase die Session-Start-Leseroutine überspringt und „normalerweise nicht ins Loop-Log schreibt". Brief 095 verallgemeinert damit ein bereits etabliertes Muster, statt es zu stören. Einzige Berührung: 094 und 095 fassen beide `CLAUDE.md` + `AGENTS.md` an — aber in verschiedenen Abschnitten (094 die Resolver-Wellen-Ausnahme; 095 § „Parallel worktrees" / § „Brain & Atlas"). Brief 094 ist **bereits gemerged**; Brief 095 branchet darum schlicht vom aktuellen `origin/main`, und die 095-Abschnitte liegen konfliktfrei neben den 094-Änderungen.

## Die Rollup-Ownership-Regel (architektonische Festlegung)

Die Regel ist an den **Worktree** gebunden, nicht an den Agenten.

**Koordinations-Worktree-only-Set.** Folgende Pfade werden ausschließlich im Koordinations-Worktree `C:\Users\Phil\chrono-lexicanum` geschrieben:

- `sessions/README.md`
- alles unter `brain/` (`brain/**`) — Wiki-Seiten, `brain/CLAUDE.md`, `decisions/`, `workflows/`, `index.md`, `log.md`, `glossary.md`, `outputs/`.

Die Worktrees `chrono-lexicanum-product` und `chrono-lexicanum-batches` schreiben **nie** eine Datei aus diesem Set — nicht in einer normalen Session, nicht in einem mechanischen Runbook, nicht als „kurze Wiki-Notiz nebenbei".

**Was die Stränge weiterhin schreiben** (unverändert ggü. Brief 082, plus Klarstellung):

- *Product-Strang:* seine Code-Pfade (`src/app/**`, `src/components/**`, `public/lab/**`), `docs/ui-backlog.md`, und seinen eigenen neuen Per-Session-Impl-Report `sessions/YYYY-MM-DD-NNN-impl-{slug}.md`.
- *Batches-Strang:* seine Code-/Daten-Pfade (`scripts/**`, `src/lib/{seed,resolver,ingestion}/**`, Override-JSONs), `sessions/ssot-loop-log.md`, die Resolver-Dossiers/-Digests unter `sessions/resolver-dossiers/`, und seinen eigenen neuen Per-Session-Impl-Report.
- Per-Session-Dateien (Briefs, Reports, Loop-Log, Dossiers) sind je neue oder Single-Writer-Dateien → sie kollidieren nie und sind **nicht** Teil des Koordinations-only-Sets.

**Wohin der Rollup-Inhalt stattdessen geht.** Ein Strang, der früher `project-state.md` / `log.md` / `index.md` / `README.md` aktualisiert hätte, hält dieselben Fakten jetzt in seinem **Impl-Report** fest (eigene Datei, konfliktfrei). Cowork zieht sie nach.

**Der nachgelagerte Brain-Catch-up.** Nachdem ein oder mehrere Strang-PRs gemerged sind, liest eine Cowork-Session im Koordinations-Worktree die gemergten Impl-Reports und gleicht das gesamte Rollup-Set in *einem* Durchgang ab (die bestehende Session-End-Routine in `cowork-session.md` — jetzt der *einzige* Pfad, über den Rollup-Dateien sich ändern). Die Kadenz (pro PR oder gebündelt über mehrere) ist Coworks/Philipps Wahl.

**Atomic-Commit-Amendment.** Die Regel „Code-Änderung + Brain-Update in einem atomic commit" gilt **nicht mehr für die Strang-Worktrees**. Ein Strang-Commit/-PR ist Code (+ eigener Report). Das Brain-Update ist entkoppelt und in den Koordinations-Worktree verschoben. Der Atomic-Commit-Gedanke überlebt nur für Arbeit, die *im* Koordinations-Worktree passiert.

**Warum worktree-gebunden.** Der Worktree-Pfad steht am Session-Start ohnehin fest (`CLAUDE.md`/`AGENTS.md`: „infer the strand from the worktree path"). Die Frage „darf ich `brain/` schreiben?" reduziert sich damit auf „bin ich im Koordinations-Worktree?" — eine helle, prüfbare Linie. CC, das einen Meta-/Session-Brief im Koordinations-Worktree implementiert (wie diesen hier), editiert `brain/` frei; CC im Product-/Batches-Strang nie.

**Ergebnis.** Die Datei-Besitzverhältnisse über die zwei Stränge + Koordination sind damit vollständig disjunkt → Strang-PRs rebasen konfliktfrei auf ein vorgerücktes `origin/main`. Die einzigen echt geteilten Dateien, die bleiben, sind `package.json`/Lockfile und `src/db/schema.ts` + Migrations — selten, und von Cowork über Briefs sequenziert (unverändert).

## Constraints

- **`CLAUDE.md` § „Parallel worktrees":** die Rollup-Ownership-Regel ergänzen — das Koordinations-only-Set (`sessions/README.md` + `brain/**`) benennen, das worktree-gebundene Verbot formulieren (Product-/Batches-Worktrees schreiben es nie).
- **`CLAUDE.md` § „Brain & Atlas":** den Atomic-Commit-Satz amendieren — Strang-Worktrees sind ausgenommen, das Brain-Update ist ein nachgelagerter Koordinations-Worktree-Pass.
- **`AGENTS.md` § „Parallel worktree git protocol":** dieselbe Regel spiegeln, wortgleich in der Absicht zu `CLAUDE.md` (Brief-082-Präzedenz — das Protokoll lebt in beiden Dateien).
- **`brain/wiki/workflows/cc-session.md` § „Brain updates from CC?":** umschreiben. In einem Product-/Batches-Strang-Worktree schreibt CC **kein** `brain/**` und **nicht** `sessions/README.md`; substantielle System-Fakten gehen in den Impl-Report; Cowork zieht sie nach. CC im Koordinations-Worktree (Meta-/Session-Briefs) editiert `brain/` weiterhin — das ist der Ort dafür.
- **`brain/wiki/workflows/cowork-session.md`:** festhalten, dass Cowork der **alleinige** Schreiber des Koordinations-only-Sets ist und der nachgelagerte Brain-Catch-up (gemergte Strang-Reports → Rollups) der einzige Pfad ist, über den diese Dateien sich ändern. An die bestehende Session-End-Routine ankern.
- **Konsistenz-Sweep:** `brain/wiki/workflows/sessions-format.md` und `brain/CLAUDE.md` auf Aussagen prüfen, die implizieren, ein Implementer/Strang editiere Rollup-Seiten; Wortlaut angleichen. Kein struktureller Rewrite — nur Konsistenz.
- Die Regel ist eine **Disziplin-Änderung.** Keine Rollup-Datei un-tracken oder gitignoren — `sessions/README.md` und `brain/**` bleiben getrackt; sie sind das Gedächtnis des Projekts.
- SSOT-Loop-Runbook und Resolver-Pass-Runbook halten die Stränge heute schon rollup-sauber (der Loop hängt nur an `ssot-loop-log.md` an; der Resolver schreibt Dossiers/Digests). Das **verifizieren**; falls ein Runbook-Schritt doch einen Koordinations-only-Pfad schreibt → als Finding im Report melden, **nicht** stillschweigend das Runbook umschreiben.
- **Brief 094 ist gemerged.** Brief 094 (Resolver-Loop) hat `CLAUDE.md` + `AGENTS.md` bereits angefasst (anderer Abschnitt — die Resolver-Wellen-Ausnahme). Brief 095 von **aktuellem `origin/main`** branchen (das 094 enthält); die 095-Abschnitte (§ „Parallel worktrees" / § „Brain & Atlas") liegen dann konfliktfrei neben den 094-Änderungen. Vor dem Branchen sicherstellen, dass der Koordinations-Worktree wirklich auf dem gemergten `origin/main` steht (`git fetch` + Fast-Forward) — sonst branchet CC von einem prä-094-Stand.
- Keine Tool-Versionen pinnen (Standard; hier irrelevant — reine Doku).
- Reine Doku-/Workflow-Änderung: kein Code, kein Schema, kein DB-Touch, keine Migration, keine Dependency.

## Out of scope

- Die **pfad-ebene** Strang-Ownership aus Brief 082 (welcher Strang welche Code-Verzeichnisse besitzt) neu schneiden — unverändert. Dieser Brief legt nur die Rollup-Schicht obendrauf.
- Das Repo in getrennte Frontend-/Backend-Repos aufspalten oder `src/` umstrukturieren — passiert ausdrücklich nicht (Maintainer-Entscheidung diese Session).
- `sessions/ssot-loop-log.md`, `docs/ui-backlog.md`, die Resolver-Dossiers anfassen — keine Rollups, nicht im Koordinations-only-Set, Ownership unverändert.
- Brief 093 (Resolver-Pass 7) und Brief 094 (Resolver-Loop) — beide gemerged — inhaltlich anfassen. Brief 095 ändert nichts an der Resolver-/SSOT-Loop-Maschinerie und hängt nicht von ihrem Inhalt ab; es branchet nur von dem `origin/main`, das beide bereits enthält (siehe Constraints).
- **OQ (3) Hand-Check-Workflow** und **OQ (13) Crawl-Simplification-Sichtung** — keine Berührung mit dieser Workflow-Änderung; bleiben in der Queue, hier **explizit verschoben**.
- Der Archivierungs-Rückstand (Session-Files 062–091 im `sessions/`-Root) — separate kleine Aufgabe, hier nicht angefasst.

## Acceptance

Die Session ist fertig, wenn:

- [ ] `CLAUDE.md` § „Parallel worktrees" die Rollup-Ownership-Regel trägt: das Koordinations-only-Set (`sessions/README.md` + `brain/**`) benannt, das worktree-gebundene Verbot formuliert (Product-/Batches-Worktrees schreiben es nie).
- [ ] `CLAUDE.md` § „Brain & Atlas" Atomic-Commit-Satz amendiert: Strang-Worktrees ausgenommen, Brain-Update als nachgelagerter Koordinations-Worktree-Pass.
- [ ] `AGENTS.md` § „Parallel worktree git protocol" trägt dieselbe Rollup-Ownership-Regel, konsistent zu `CLAUDE.md`.
- [ ] `cc-session.md` § „Brain updates from CC?" umgeschrieben: Strang-Worktrees schreiben kein `brain/**` / kein `sessions/README.md`; Fakten in den Impl-Report; Koordinations-Worktree-Meta-Sessions editieren `brain/` weiterhin.
- [ ] `cowork-session.md` hält fest: Cowork ist alleiniger Schreiber des Koordinations-only-Sets, der nachgelagerte Catch-up ist der einzige Pfad für Rollup-Änderungen.
- [ ] `sessions-format.md` + `brain/CLAUDE.md` auf widersprechende Aussagen gesweept und angeglichen.
- [ ] Keine Rollup-Datei un-getrackt oder gitignored — die Änderung ist disziplin-only.
- [ ] `npm run brain:lint -- --no-write` grün (die Workflow-Seiten-Edits halten das Wiki intern konsistent). `lint`/`typecheck` sind ohne Code nicht sinnvoll betroffen — Skip okay, im Report kurz vermerken.
- [ ] Architekten-Output (dieser Brief + der `sessions/README.md`-Edit) und die Implementierung liegen zusammen in **einem** PR auf `codex/session-095-rollup-ownership` (siehe § Commit & PR).

## Open questions

Keine Blocker — Inputs, die ich im Report gerne hätte:

- Liest sich die Numerierungs-Anweisung in `cc-session.md` („next sequential NNN — look at the latest brief, add 1") nach dieser Änderung noch sauber, wenn zwei Stränge gleichzeitig Briefs in Flight haben? Reply-Paare teilen die `NNN` des Briefs (`sessions-format.md`), Report-Dateinamen kollidieren also nicht — aber melde, falls der Wortlaut einen Strang einlädt, eine frische `NNN` zu vergeben, die optisch klemmt.
- Schreibt irgendein mechanischer Runbook-Schritt (SSOT-Loop §8, Resolver-Pass-Phasen) doch einen Koordinations-only-Pfad? Falls ja: benennen — Cowork brieft dann einen Folge-Fix.

## Notes

- Keine UI-Oberfläche — reine Workflow-/Doku-Änderung, daher **kein** `## Design freedom`-Abschnitt (Präzedenz: Brief 091).
- Eltern-Sessions: Brief 082/083 (Worktree-Bootstrap). Dieser Brief ist die zweite Schicht — 082 hat den Code geschnitten, 095 schneidet die Dokumentations-Fläche.
- Warum Briefs/Reports selbst diesen Fix nie brauchten: jede ist eine *neue* Datei. Nur die Rollup-/Index-Dateien — in jeder Session neu geschrieben — kollidieren. Der Fix ist Single-Writer-Disziplin, nicht das Streichen von Dokumentation.
- Sequenzierung: risikoarm, doku-only. Brief 094 ist gemerged — Brief 095 ist jederzeit implementierbar (von aktuellem `origin/main`) und sollte vor dem nächsten echten Parallel-Push von Product + Batches landen.
