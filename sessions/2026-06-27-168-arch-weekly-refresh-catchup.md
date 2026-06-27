---
session: 2026-06-27-168
role: architect
date: 2026-06-27
status: open
slug: weekly-refresh-catchup
parent: 2026-06-27-167
links: [2026-06-27-167, 2026-06-18-157, 2026-06-03-122]
commits: []
---

# 168 — Weekly-Refresh-Catch-up: Bücher + Podcasts (Teil B von A/B/C)

> **Teil B des Drei-Teilers.** A = [167](./2026-06-27-167-arch-ofob-gap-corpus.md) (gemergt — Voraussetzung für die Batch-Contiguity). C = [169](./2026-06-27-169-arch-faction-starters-relink.md). Eigener PR, `/clear` davor/danach. Am Ende: commit + PR + Folgeprompt für C.

## Goal

Den seit Wochen nicht gefahrenen Weekly-Refresh **einmal sauber nachholen** — neue **Bücher und Podcasts** — und die Detection-Cursors so setzen, dass der Montags-Cron danach wieder verlässlich nur Frisches zeigt. Wieder rein additiv über `db:sync` — **kein Full-Rewrite**.

## Context

- **Maschinerie (Briefs 133 + 151):** `npm run refresh:check` ist detection-only (Track-of-Words-Sheet + Podcast-Feeds vs. committeten Bestand), schreibt nur `ingest/refresh/<WEEK>/{report.md, proposal.json}`, fasst die DB **nie** an. Promotion ist ein Hand-Gate: Bücher aus `proposal.json` → `book-roster.extension.json` → `import:ssot-roster` → Override → `db:sync`; Podcasts → `ingest:podcast` → `apply:podcast` (in `db:sync` enthalten).
- **Cursor-Stand:** die Per-Show-Cursors in `ingest/refresh/curation-state.json` stehen alle auf `2026-01-01` — **Bootstrap-Floor aus Brief 151, kein echter Lauf** (Projekt ist erst seit Ende April live); sie wurden nie advancet. Darum zeigt ein frischer `refresh:check` den **ganzen aufgelaufenen Backlog** in einem Report (gewollt). Letzter Detection-Lauf war 2026-W26 (1 Buch, ~6 Episoden) als stale Rolling-PR auf `automation/weekly-refresh`.
- **Strang:** Batches. Voraussetzung: Brief 167 gemergt (sonst kollidiert die Override-Batch-Contiguity).

## Steps

1. **Preflight:** `npm run test:refresh` (offline) und `npm run refresh:audit-artifacts` (read-only, braucht `DATABASE_URL`) grün ziehen — Letzteres fängt Artefakt↔DB-Drift.
2. **Detection:** `npm run refresh:check` → frischer `ingest/refresh/<WEEK>/`-Report.
3. **Review-Gate (Philipp):** CC legt Philipp die neuen Bücher + Episoden aus dem Report im Chat vor; Philipp entscheidet **promote / ignore / defer** pro Eintrag. CC rät nicht über Inhalte.
4. **Bücher promoten:** zugesagte Zeilen verbatim aus `proposal.json` → `book-roster.extension.json` → `npm run import:ssot-roster` → Override-Kuration in der **nächsten positional korrekten Batch**. Nummer **nicht** hart vorschreiben — sie ergibt sich aus dem Stand nach 167: `externalBookId` lückenlos ab High-Water-Mark, und die Override-Kuration füllt **zuerst die nach 167 noch offene Restbatch `ssot-w40k-060`** (Slot `0591..0600`, nach 167 bei 8/10 — freie Slots `0599..0600`) bis `W40K-0600`, **danach erst** eine neue `ssot-w40k-061` (`0601..`). Batch `N` besitzt Slot `W40K-((N-1)*10+1)..((N-1)*10+10)`; IDs niemals in eine falsch nummerierte Batch legen (Restbatch-Extension-Präzedenz, Session 136). HH analog falls nötig.
5. **Podcasts promoten:** je Show mit neuen Episoden `npm run ingest:podcast -- --show <slug>` (CC-Direct-Tagging, `PODCAST_LLM_MODEL` wie etabliert) → schreibt Episode-Artefakte. Materialisierung erst im **Post-Merge-`db:sync`** (Schritt `apply:podcast --all`) — kein Prod-DB-Write aus dem Branch.
6. **Cursors + Hygiene (im Branch, vor PR-Abschluss):** Die Cursor-/Seen-Files schreibt `refresh:mark-reviewed` lokal, fasst **keine DB** an — sie gehören also in den PR-Diff, **nicht** hinter den Post-Merge-Apply. Reihenfolge: nach Philipps Review-Entscheid (Schritt 3) und nach Erzeugung des frischen `ingest/refresh/<WEEK>/proposal.json`, aber **vor** PR-Abschluss:
   - Bücher: `npm run refresh:mark-reviewed -- --books --proposal ingest/refresh/<WEEK>/proposal.json` (`--proposal`, weil die Week-Dir noch nicht auf `main` liegt — sonst markierst du gegen ein älteres Proposal und verlierst die Funde dieser Woche; siehe Tool-Doc).
   - Shows: nur die **vollständig** reviewten Shows markieren — `--all` **nur**, wenn Philipp alle Show-Deltas reviewt hat; sonst gezielt `npm run refresh:mark-reviewed -- --show <slug>` je reviewter Show.
   - `refresh:ignore-book` für endgültige Dismissals.
   - **Stale W26-Rolling-PR (`automation/weekly-refresh`):** CC **inspiziert** sie nur und dokumentiert im Report eine Empfehlung (i.d.R. „durch den frischen Lauf ersetzt → schließen"). **Schließen nur nach Philipps ausdrücklicher Freigabe; mergen nie durch CC** — PR-Policy (§ Git): CC öffnet/empfiehlt, Philipp entscheidet über Merge/Close.

## Constraints

- **Nur nicht-destruktiv:** Post-Merge ist der Apply `npm run db:sync`. Kein `db:rebuild`/Truncate/Re-Crawl. **`db:sync`/`db:drift` sind Post-Merge-Maintainer-Ops** — CC baut/verifiziert nur den PR-Diff + Dry-Run-Gates, kein Prod-DB-Write aus dem Branch (außer Philipp autorisiert es live im Chat).
- **Contiguity:** positional korrekt — offene Restbatch `ssot-w40k-060` (`0599..0600`) zuerst füllen, dann neue `061`; lückenlos, `db:apply-scope`-Preflight grün.
- **CC entscheidet nicht über Inhalte** — Promotionen kommen aus Philipps Review (Schritt 3).
- **CC fasst keinen fremden PR-State an.** Die stale W26-Rolling-PR wird nur inspiziert + im Report empfohlen; **CC mergt keinen PR** (PR-Policy: Philipp merged), und schließt sie nur nach Philipps ausdrücklicher Freigabe.
- Net-neue Referenz-Entitäten + unresolved Surface-Forms wie üblich (resolven/flaggen). Version-Policy: nichts pinnen.

## Out of scope

- OFOB-Korpus (167) und faction-starters-Re-Link (169).
- Kein `db:rebuild`/Truncate. OQ 18(a)/18(b)/16(b/c) unberührt.
- Kein Umbau der Refresh-Maschinerie/`apply:podcast`/Resolver.
- Voller Backlog-„Einzelfall-Durcharbeiten" nur soweit Philipp im Review will; Default = frische Funde entscheiden + Cursors re-baselinen.

## Acceptance

- [ ] `refresh:check` frisch gelaufen; Philipps Review (promote/ignore/defer) eingearbeitet.
- [ ] Zugesagte Bücher promotet (Extension + positional korrekte Override-Batch: offene `060` bis `0600` auffüllen, dann `061`); Shows mit neuen Episoden via `ingest:podcast` ingestet/getaggt.
- [ ] Cursors im Branch gesetzt (vor PR-Abschluss, im Diff): `refresh:mark-reviewed --books --proposal <frischer Pfad>` + reviewte Shows (`--all` nur bei vollständig reviewten Show-Deltas, sonst `--show <slug>`).
- [ ] W26-Rolling-PR im Report inspiziert + Empfehlung dokumentiert — **nicht** durch CC gemergt; geschlossen nur, falls Philipp ausdrücklich freigibt.
- [ ] `npm run db:apply-scope` lückenlos; `npm run test:refresh` grün; `npm run lint` + `npm run typecheck` grün.
- [ ] (Maintainer-Ops nach Merge) `npm run db:sync` landet Bücher + neue Episoden nicht-destruktiv; `npm run db:drift` sauber.

## Handover (commit + Folgeprompt)

> **Transfer:** Dieser Brief wurde im **Koordinations-Worktree** (`C:\Users\Phil\chrono-lexicanum`) erstellt. Kopiere `sessions/2026-06-27-168-arch-weekly-refresh-catchup.md` in **diesen Batches-Worktree** und committe ihn im PR mit. Die `ingest/refresh/**`-Artefakte erzeugst du selbst beim Lauf.

1. Auf frischem Batches-Task-Branch (`codex/ingest-batches-weekly-refresh-catchup`) committen (Brief + Roster/Override-Edits + `ingest/refresh/**` + State-Dateien), PR öffnen, `status → implemented` flippen. Nicht selbst mergen.
2. **Folgeprompt an Philipp** (verbatim) für Teil C nach `/clear`:

   > „Teil C / Brief 169 — faction-starters-Re-Link (im **Product-Worktree** ausführen). Lies, kopiere aus dem Koordinations-Worktree und implementiere `C:\Users\Phil\chrono-lexicanum\sessions\2026-06-27-169-arch-faction-starters-relink.md`. Voraussetzung: Brief 167 ist gemergt."

3. Ops: nach Merge `npm run db:sync` (PowerShell zeilenweise).

## Open questions (für den Report)

- Wie viele neue Bücher/Episoden je Quelle? Hat `refresh:audit-artifacts` Drift gezeigt?
- W26-Rolling-PR: Inspektions-Befund + Empfehlung (durch frischen Lauf ersetzt → schließen?). CC mergt/schließt sie nicht ohne Philipps Freigabe.
