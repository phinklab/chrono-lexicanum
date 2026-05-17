---
session: 2026-05-17-083
role: implementer
date: 2026-05-17
status: complete
slug: parallel-worktrees
parent: 2026-05-17-082
links: []
commits: []
---

# Parallel-Worktrees — minimaler Bootstrap

## Summary

Zwei neue Worktrees neben dem Originalworktree angelegt —
`chrono-lexicanum-hud` auf `codex/chrono-hud-map` und
`chrono-lexicanum-batches` auf `codex/ingest-batches-bootstrap`, beide
frisch von `origin/main` (`9b9a839…`) abgezweigt. Worktrees sind das
Deliverable; **keine Commits in dieser Session** — diese Report-Datei
und der Brief-082-Status-Edit liegen unstaged im Originalworktree, per
expliziter Plan-Phase-Direktive von Phil. Er committet sie später aus
dem passenden Worktree.

## What I did

Aufrufe in der Reihenfolge, jeweils aus `C:\Users\Phil\chrono-lexicanum`:

```
git fetch origin                                                                            # no-op, origin/main schon aktuell
git worktree add -b codex/chrono-hud-map ../chrono-lexicanum-hud origin/main                # → C:\Users\Phil\chrono-lexicanum-hud
git worktree add -b codex/ingest-batches-bootstrap ../chrono-lexicanum-batches origin/main  # → C:\Users\Phil\chrono-lexicanum-batches
git worktree list                                                                           # 4 Einträge
```

HEAD-Commit-Hashes (beide identisch zu `origin/main`):

- `chrono-lexicanum-hud`     → `9b9a839baa9c0e10a0998948024e25d607b111cf` (`codex/chrono-hud-map`)
- `chrono-lexicanum-batches` → `9b9a839baa9c0e10a0998948024e25d607b111cf` (`codex/ingest-batches-bootstrap`)

`git worktree list` am Ende:

```
C:/Users/Phil/chrono-lexicanum         9b9a839 [main]
C:/Users/Phil/chrono-batches-011-015   84a3c5f [ingest/batches-011-015]
C:/Users/Phil/chrono-lexicanum-batches 9b9a839 [codex/ingest-batches-bootstrap]
C:/Users/Phil/chrono-lexicanum-hud     9b9a839 [codex/chrono-hud-map]
```

Beide neuen Worktrees clean (`nothing to commit, working tree clean`),
beide auf der korrekten `codex/*`-Branch. Originalworktree unverändert
auf `main` @ `9b9a839…`.

## Decisions I made

- **Kein Commit, kein Push, kein PR.** Phils Plan-Phase-Direktive:
  „Brief 082 nur bis zur Worktree-Anlage ausführen. Kein PR, kein
  Squash-Merge, kein Branch session-083, kein Pull, kein Löschen einer
  Plan-Datei." Diese Report-Datei und der `status: open` → `implemented`-
  Edit in Brief 082 liegen unstaged im Originalworktree; Phil committet
  sie später (vermutlich aus dem passenden Worktree, wenn dort die
  erste echte Arbeit committet wird). `commits: []` im Frontmatter
  spiegelt das.
- **Plan-Datei NICHT gelöscht** — Phil hat in der Plan-Phase explizit
  gesagt, sie bleibt stehen
  (`C:\Users\Phil\.claude\plans\fahre-sessions-…-effervescent-abelson.md`).
- **`-b codex/...` mit `origin/main` als Start-Ref.** Nebeneffekt: Git
  hat die beiden neuen Branches mit `origin/main` als Upstream
  verbunden („branch 'codex/chrono-hud-map' set up to track
  'origin/main'"). Das heißt: ein nackter `git push` aus einem der
  neuen Worktrees würde mit `push.default=simple` mit Fehler
  („upstream branch name does not match") abbrechen — sicher, aber
  unschön. **Beim ersten Push aus diesen Worktrees explizit `git push
  -u origin codex/<branch>` verwenden**, um die Upstream-Verbindung
  auf die passende Remote-Branch zu setzen. Nicht jetzt repariert,
  weil der Brief jede Config-Änderung in den neuen Worktrees
  ausschließt.

## Verification

Aus dem Originalworktree:

- `git worktree list` → 4 Einträge wie oben.
- `git branch --show-current` → `main`.
- `git rev-parse HEAD` → `9b9a839baa9c0e10a0998948024e25d607b111cf`
  (unverändert).

Aus jedem neuen Worktree (per `git -C ../chrono-lexicanum-{hud,batches}`):

- `git rev-parse HEAD` → beide `9b9a839baa9c0e10a0998948024e25d607b111cf`.
- `git status` → „nothing to commit, working tree clean".
- `git branch --show-current` → `codex/chrono-hud-map` bzw.
  `codex/ingest-batches-bootstrap`.

Stop-Bedingung „Cartographer in `origin/main`?" vorab geprüft:
`git ls-tree -r --name-only origin/main` enthält
`src/app/lab/cartographer/page.tsx` — 079-impl ist gemerged, also
gefahrlos fortgesetzt.

Pfad- und Branch-Existenz vorab geprüft: keiner der vier Zielnamen
(`chrono-lexicanum-hud`, `chrono-lexicanum-batches`,
`codex/chrono-hud-map`, `codex/ingest-batches-bootstrap`) existierte
vorher; `git ls C:/Users/Phil/chrono-lexicanum-{hud,batches}` lieferte
„No such file or directory".

## Open issues / blockers

Keine.

## Antworten auf die Open Questions im Brief

**`node_modules` pro Worktree?** Empfehlung: **separates `npm install`
je Worktree.** Begründung:

- Junction/Symlink (`mklink /J node_modules ...`) auf Windows
  funktioniert technisch, erzeugt aber bei parallelen `npm install` /
  `npm run build`-Läufen in zwei Worktrees Race-Conditions, weil sich
  beide denselben Cache + dieselben `.bin/`-Stubs teilen. Das ist
  genau das Serialisierungs-Problem, das die Worktrees lösen sollen
  — würde unter dem Tisch wiederkommen.
- `pnpm` mit Workspaces wäre die eleganteste Lösung
  (Content-Addressable Store global, je Worktree ein billiges
  Symlink-Skelett), bedeutet aber Umzug `npm` → `pnpm`:
  `package.json`-Scripts-Audit, neuer Lockfile,
  Vercel-Build-Config-Anpassung. Für reines Speicher-Sparen zu groß.
- Drei `node_modules` (Original + HUD + Batches) à
  ~500 MB–1 GB sind auf Phils Maschine vermutlich problemlos. Disk
  ist billiger als ein Bugfix-Tag aus Cache-Inkonsistenzen.

Konkret: Phil läuft `npm install` einmal beim ersten Betreten eines
neuen Worktrees. Brief hat das richtigerweise schon ausgeschlossen,
dass ich es jetzt vorab tue.

**`ingest`-Branch-Zustand.** Im Repo existiert **kein** lokaler Branch
namens schlicht `ingest`. Der einzige Treffer auf `ingest/*` ist
`ingest/batches-011-015` auf
`84a3c5f338e4565370dd31db2586cb3062c3c527`, und das ist die Branch des
Alt-Worktrees `C:\Users\Phil\chrono-batches-011-015` — bleibt per
Brief unangetastet. `git log --oneline -3 ingest/batches-011-015`:

```
84a3c5f 061: ssot-w40k resolver-pause bei 150 Büchern (loop iter 16)
f8a15d4 061: ssot-w40k-015 loop iter 15
cfb8881 061: ssot-w40k-014 loop iter 14
```

Trotz des Branch-Namens (`batches-011-015`) ist der Tip aus der
**061er SSOT-Loop** (Iter 14–16) — also nicht so historisch wie der
Branchname suggeriert. Ob das noch produktiv ist oder ein
zurückgelassener Loop-Stub, entscheidet Phil.

Der SHA, den Brief 082 dem `ingest`-Head zuschreibt
(`9b9a839baa9c0e10a0998948024e25d607b111cf`), ist tatsächlich der
aktuelle `main`/`origin/main`-Tip — die Brief-Notiz dort verwechselt
vermutlich `ingest` mit `main`. Praktische Konsequenz: keine.

## For next session

- HUD-Session in `chrono-lexicanum-hud` auf `codex/chrono-hud-map`
  starten; TSX-Port aus `/lab/cartographer` kann dort beginnen, ohne
  dass Brief-081-Batch-Arbeit im anderen Worktree stört.
- Batch-Session in `chrono-lexicanum-batches`: vor der ersten echten
  Aufgabe von `codex/ingest-batches-bootstrap` auf eine
  task-spezifische Branch wechseln, z. B. `git switch -c
  codex/ingest-batches-synopsis-005-019`.
- **Erster Push in jedem neuen Worktree:** `git push -u origin
  <branch>` (siehe „Decisions I made" zum Upstream-Footgun).
- Sobald sich die Worktree-Praxis bewährt hat, kann eine Folge-Session
  die Brief-082-Ownership-Regel („HUD-Worktree schreibt in …,
  Batch-Worktree schreibt in …") nach `brain/wiki/workflows/`
  verfestigen — der Brief hat das ausdrücklich erlaubt.
- Phils dauerhafte Worktree-Workflow-Regeln aus der Plan-Phase
  (`fertig` / `PR ist gemerged, bitte aufräumen`) sind dort
  dokumentiert und werden im Anschluss als CC-`feedback`-Memory
  gespeichert, damit jede künftige Worktree-Session sie automatisch
  kennt.

## References

- Brief: [`sessions/2026-05-17-082-arch-parallel-worktrees.md`](2026-05-17-082-arch-parallel-worktrees.md)
- Verwandte Sessions: 079 (Lab-Cartographer-Prototyp), 081
  (SSOT-Synopsis-Backfill, offen).
- `git worktree add` Doku: <https://git-scm.com/docs/git-worktree>
