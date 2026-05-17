---
session: 2026-05-17-083
role: implementer
date: 2026-05-17
status: complete
slug: parallel-worktrees
parent: 2026-05-17-082
links:
  - https://github.com/phinklab/chrono-lexicanum/pull/68
commits:
  - ddc0a8a
---

# Parallel-Worktrees - Product/Batches Bootstrap

## Summary

Brief 082 ist umgesetzt und nach Phils Addendum auf den besseren Schnitt
umgestellt: dauerhafte Worktrees fuer Product/UI und Batches, Originalworktree
als Coordination/Main. Die Regeln fuer "fertig" -> commit/push/PR ohne Merge
und "PR ist gemerged, bitte aufraeumen" stehen jetzt in `CLAUDE.md` und
`AGENTS.md`, damit Claude Code und Codex sie automatisch sehen.

## What I did

- `C:\Users\Phil\chrono-lexicanum-product` - aktiver Product/UI-Worktree,
  entstanden durch Umhaengen des zuerst angelegten HUD-Worktrees
  `C:\Users\Phil\chrono-lexicanum-hud`.
- `C:\Users\Phil\chrono-lexicanum-batches` - aktiver Batch/Ingestion-Worktree.
- `CLAUDE.md` - Parallel-Worktree-Git-Protocol fuer Claude Code ergaenzt.
- `AGENTS.md` - neuer Codex/Agent-Einstieg mit Session-Start-Regeln und
  demselben Parallel-Worktree-Git-Protocol.
- `sessions/2026-05-17-082-arch-parallel-worktrees.md` - Brief auf den
  Product/Batches-Schnitt und die neuen Auto-Instruktionen aktualisiert.
- `sessions/2026-05-17-083-impl-parallel-worktrees.md` - Report auf den
  finalen Zielzustand aktualisiert.

## Commands / exact worktree operations

Initiale Bootstrap-Aufrufe aus `C:\Users\Phil\chrono-lexicanum`:

```
git fetch origin
git worktree add -b codex/chrono-hud-map ../chrono-lexicanum-hud origin/main
git worktree add -b codex/ingest-batches-bootstrap ../chrono-lexicanum-batches origin/main
git worktree list
```

Nach Phils Addendum:

```
git worktree move C:\Users\Phil\chrono-lexicanum-hud C:\Users\Phil\chrono-lexicanum-product
git -C C:\Users\Phil\chrono-lexicanum-product branch -m codex/product-bootstrap
git -C C:\Users\Phil\chrono-lexicanum-product branch -m worktree/product-bootstrap
git -C C:\Users\Phil\chrono-lexicanum-batches branch -m worktree/batches-bootstrap
git config --global --add safe.directory C:/Users/Phil/chrono-lexicanum-product
git config --global --add safe.directory C:/Users/Phil/chrono-lexicanum-batches
```

Finale Worktree-Liste:

```
C:/Users/Phil/chrono-lexicanum         ddc0a8a [session-082-parallel-worktrees]
C:/Users/Phil/chrono-batches-011-015   84a3c5f [ingest/batches-011-015]
C:/Users/Phil/chrono-lexicanum-batches 9b9a839 [worktree/batches-bootstrap]
C:/Users/Phil/chrono-lexicanum-product 9b9a839 [worktree/product-bootstrap]
```

Product- und Batch-Worktree sind clean und stehen beide auf
`9b9a839baa9c0e10a0998948024e25d607b111cf`, dem `origin/main`-Tip zum
Bootstrap-Zeitpunkt.

## Decisions I made

- **Product/UI statt HUD-only.** Drei aktive Arbeitsorte sind genug:
  Original/Coordination, Product/UI, Batches. Ein separater Design- oder
  Feature-Worktree wuerde dieselben UI-Dateien beruehren und Konflikte eher
  vermehren.
- **Bootstrap-Branches bleiben agent-neutral.** `worktree/product-bootstrap`
  und `worktree/batches-bootstrap` sind Wartepositionen. Echte Arbeit startet
  auf frischen Task-Branches von `origin/main`.
- **`main` wird read-only kodifiziert.** Der Direkt-Push-Versuch gegen `main`
  wurde von Branch-Protection blockiert. Die neue Regel verhindert, dass
  kuenftig ueberhaupt lokale Commits auf `main` entstehen.
- **PR #68 bleibt der Transport.** Branch-Protection verlangt PRs; die
  Session-Doku und Instruktionsaenderungen werden deshalb in den offenen PR
  #68 gepusht. Philipp merged haendisch.

## Verification

- `git worktree list` - zeigt Original, Legacy-Worktree, Product-Worktree und
  Batch-Worktree.
- `git -C C:\Users\Phil\chrono-lexicanum-product status --short --branch` -
  `## worktree/product-bootstrap...origin/main`, clean.
- `git -C C:\Users\Phil\chrono-lexicanum-batches status --short --branch` -
  `## worktree/batches-bootstrap...origin/main`, clean.
- `git branch -vv` - Product- und Batch-Branches zeigen auf `9b9a839`; die
  PR-Branch `session-082-parallel-worktrees` enthaelt den 082-Commit.

Nicht gelaufen: `npm run lint`, `npm run typecheck`, `npm run brain:lint`.
Diese Session aendert nur Markdown/Doku und lokale Worktree-Zuordnung; keine
App-/TypeScript-/Brain-Wiki-Codepfade.

## Open issues / blockers

- Lokales `main` ist weiterhin `1 ahead` von `origin/main`, weil der erste
  Commit vor der Branch-Protection-Erkenntnis lokal auf `main` entstanden ist.
  Nicht bereinigt, weil das nach PR-Merge ein expliziter Cleanup-Schritt sein
  soll. Nach Phils "PR ist gemerged, bitte aufraeumen" darf der Worktree sauber
  auf `origin/main` zurueckgefuehrt werden.
- `sessions/README.md` und
  `sessions/2026-05-17-081-arch-ssot-synopsis-backfill-005-019.md` gehoeren zu
  fremden/inflight Sessions und wurden nicht gestaged.

## Antworten auf die Open Questions im Brief

**`node_modules` pro Worktree?** Empfehlung: separates `npm install` je
Worktree. Junction/Symlink auf Windows ist technisch moeglich, bringt aber bei
parallelen `npm install` / `npm run build`-Laeufen Race-Conditions zurueck.
`pnpm` waere eleganter, aber ein eigener Package-Manager-Umzug ist fuer reines
Speicher-Sparen zu gross.

**`ingest`-Branch-Zustand.** Kein lokaler Branch namens schlicht `ingest`.
Der einzige Treffer ist `ingest/batches-011-015` auf
`84a3c5f338e4565370dd31db2586cb3062c3c527`, der Legacy-Worktree. Der im Brief
notierte `9b9a839...`-SHA war tatsaechlich `main`/`origin/main`.

## For next session

- Product/UI-Session in `C:\Users\Phil\chrono-lexicanum-product` starten.
  Wenn die Branch noch `worktree/product-bootstrap` ist, zuerst eine echte
  Task-Branch von `origin/main` anlegen, z. B. `codex/product-hud-map`.
- Batch-Session in `C:\Users\Phil\chrono-lexicanum-batches` starten.
  Wenn die Branch noch `worktree/batches-bootstrap` ist, zuerst eine echte
  Task-Branch von `origin/main` anlegen, z. B.
  `codex/ingest-batches-synopsis-005-019`.
- Bei "fertig": committen, `git push -u origin <branch>`, PR erstellen, nicht
  mergen.
- Nach manuellem Merge: "PR ist gemerged, bitte aufraeumen" sagen; dann wird
  der jeweilige Worktree auf die Bootstrap-Branch zurueckgefuehrt.

## References

- Brief: `sessions/2026-05-17-082-arch-parallel-worktrees.md`
- PR: https://github.com/phinklab/chrono-lexicanum/pull/68
- Git worktree docs: https://git-scm.com/docs/git-worktree
