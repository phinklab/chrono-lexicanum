---
session: 2026-05-17-082
role: architect
date: 2026-05-17
status: implemented
slug: parallel-worktrees
parent: null
links:
  - 2026-05-17-079-impl-lab-cartographer-prototype
  - 2026-05-17-081-arch-ssot-synopsis-backfill-005-019
commits: []
---

# Parallel-Worktrees — minimaler Bootstrap

## Goal

Zwei zusätzliche lokale Git-Worktrees neben dem bestehenden
`C:\Users\Phil\chrono-lexicanum` anlegen, damit Batch-Arbeit (Brief 081, danach
Loop-Re-Trigger 061) und HUD/Map-Arbeit (TSX-Port aus `/lab/cartographer`)
ab sofort parallel auf eigenen Branches laufen können, ohne dass sich
laufende Sessions gegenseitig serialisieren.

Diese Session ist bewusst *nur* der Bootstrap. Keine Workflow-Wiki-Seite, kein
`CLAUDE.md`-Edit, keine Foundation-Branch, kein Feature-Code, kein UI, kein
Schema/DB. Wenn die Worktree-Praxis sich bewährt, kann eine spätere
Hygiene-Session die Disziplin in `brain/wiki/workflows/` festschreiben — heute
nicht.

## Context

- Originalworktree `C:\Users\Phil\chrono-lexicanum` läuft auf `main` und wird
  von Phil weiterbenutzt; nicht resetten, nicht switchen.
- Lokaler alter Worktree `C:\Users\Phil\chrono-batches-011-015\` (Branch
  `ingest/batches-011-015`, Altlast aus dem Brief-074-Zyklus) bleibt
  unberührt — weder löschen noch hineinmergen.
- 079-impl hat `src/app/lab/cartographer/page.tsx` + die Iframe-Sandbox unter
  `public/lab/cartographer-prototype/` gelandet. Brief 081 ist offen für eine
  /clear-Loop über `ssot-w40k-005..019`. Beide Arbeitsstränge sollen jetzt auf
  eigenen Worktrees laufen.

## Constraints

- Beide neuen Worktrees zweigen von `origin/main` ab (nach `git fetch`), nicht
  von einer Inflight-Branch.
- Genau zwei neue Worktrees:
  - `C:\Users\Phil\chrono-lexicanum-hud` → Branch `codex/chrono-hud-map`
  - `C:\Users\Phil\chrono-lexicanum-batches` → Branch
    `codex/ingest-batches-bootstrap` (Platzhalter; Phil wechselt später per
    `git switch -c codex/ingest-batches-{slug}` auf die echte Aufgaben-Branch,
    z. B. `codex/ingest-batches-synopsis-005-019` oder `…-021-025`).
- Der bestehende `chrono-batches-011-015`-Worktree bleibt unverändert.
- Originalworktree-HEAD nicht anfassen (kein `git checkout`, kein `git
  reset`, kein `git pull` im Originalworktree).
- Falls `origin/main` keinen `src/app/lab/cartographer/page.tsx` enthält
  (sprich: 079-impl ist noch nicht in `main` gemerged), → `needs-decision`
  mit kurzer Statusmeldung statt fortzufahren.

### Kurze Ownership-Regel (für die nächsten Sessions, ohne Wiki-Seite)

- **HUD-Worktree** schreibt in: `src/app/{lab,map,timeline,ask}/**`,
  `src/app/page.tsx`, `public/lab/**`, `src/components/**` (insbesondere
  `chrome/`, `timeline/`, später `map/`), `src/app/layout.tsx`,
  `src/app/globals.css`, `docs/ui-backlog.md`.
- **Batch-Worktree** schreibt in: `scripts/seed-data/**`, `scripts/apply-
  override*.ts`, `scripts/run-{resolver,ssot}-*.sh`,
  `scripts/{test,audit,smoke,backfill}-*.ts`, `src/lib/{seed,resolver,
  ingestion}/**`, `sessions/ssot-loop-log.md`.
- **Geteilte Dateien** (Schema/Migrations, `package.json`, `sessions/README.md`,
  Brain-Wiki-Pages) dürfen beide berühren — wer als zweiter pusht, rebased.

Diese Regel lebt heute *im Brief*, nicht in einer Wiki-Seite. Späterer
Folgebrief darf sie nach `brain/wiki/workflows/` heben, wenn nötig.

## Out of scope

- Keine neue Datei unter `brain/wiki/workflows/`.
- Kein Append/Edit in `CLAUDE.md`, `brain/wiki/index.md`,
  `brain/wiki/log.md`, `brain/wiki/project-state.md` oder einer anderen
  Brain-Seite.
- Kein Aufräumen / Entfernen des `chrono-batches-011-015`-Worktrees oder des
  lokalen `ingest`-Heads.
- Keine Foundation-Branch, kein gemeinsamer Refactor-Commit.
- Kein Feature-Code, kein UI, kein Schema, kein DB-Apply, kein
  Override-Edit, kein Resolver-Lauf.
- Kein `npm install` in den neuen Worktrees. Phil installiert selbst, wenn
  er das erste Mal in einem neuen Worktree arbeitet.
- Keine Dependency-Adds, keine Config-Edits, keine Lint-/Typecheck-Läufe
  in den neuen Worktrees.

## Acceptance

- [ ] `git fetch origin` läuft sauber; `origin/main` ist aktuell.
- [ ] `git worktree list` (ausgeführt aus dem Originalworktree) zeigt vier
  Einträge: das Original (`C:/Users/Phil/chrono-lexicanum`), den bestehenden
  Alt-Worktree `C:/Users/Phil/chrono-batches-011-015` unverändert,
  `chrono-lexicanum-hud` (Branch `codex/chrono-hud-map`),
  `chrono-lexicanum-batches` (Branch `codex/ingest-batches-bootstrap`).
- [ ] Beide neuen Worktrees existieren auf der Platte und sind `clean`
  (`git status` aus dem jeweiligen Worktree → "nothing to commit, working
  tree clean").
- [ ] `git rev-parse HEAD` aus beiden neuen Worktrees entspricht exakt dem
  aktuellen `origin/main`-Tip (frisch abgezweigt, keine Extra-Commits).
- [ ] Originalworktree bleibt auf derselben Branch und demselben HEAD;
  keine Branch-Switches, kein Reset, kein Pull. Git-Status darf sich nur
  durch den 082-Implementer-Report und den Status-Edit im
  082-Architect-Brief ändern.
- [ ] Falls Zielpfad (`chrono-lexicanum-hud` oder `chrono-lexicanum-batches`)
  oder eine der Branches (`codex/chrono-hud-map`,
  `codex/ingest-batches-bootstrap`) bereits existiert, stoppt Codex mit
  kurzer Statusmeldung; keine bestehenden Worktrees oder Branches löschen
  oder überschreiben.
- [ ] Implementer-Report dokumentiert für jeden neuen Worktree den exakten
  `git worktree add`-Aufruf, den HEAD-Commit-Hash und die Ausgabe von
  `git worktree list` am Ende.

## Open questions

Inputs für die Brief-082-Antwort, nicht implementierungsblockierend:

- **`node_modules` pro Worktree?** Kurze Empfehlung im Report (`npm
  install` separat, Symlink vom Original, `pnpm`-Umzug). Phil entscheidet
  später — heute keine Aktion.
- **`ingest`-Branch-Zustand.** Lokaler Head `ingest` zeigt auf
  `9b9a839baa9c0e10a0998948024e25d607b111cf`. Ein Satz im Report, ob das
  ein historischer Stub oder noch aktiv aussieht. Keine Aktion.

## Notes

`git worktree add`-Aufrufe als Spickzettel (keine versionsspezifische
Form, nur Shape):

```
git fetch origin
git worktree add -b codex/chrono-hud-map ../chrono-lexicanum-hud origin/main
git worktree add -b codex/ingest-batches-bootstrap ../chrono-lexicanum-batches origin/main
git worktree list
```

Pfad-Hinweis: relative `../chrono-lexicanum-hud`-Form bezieht sich auf den
Originalworktree-Parent (`C:\Users\Phil\`), beide neuen Worktrees landen
also als Geschwister neben `chrono-lexicanum`.
