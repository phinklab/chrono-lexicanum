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

# Parallel-Worktrees - Product/Batches Bootstrap

## Goal

Zwei dauerhafte lokale Arbeits-Worktrees neben dem bestehenden
`C:\Users\Phil\chrono-lexicanum` etablieren, damit Batch-Arbeit (Brief 081,
danach Loop-Re-Trigger 061) und Product/UI-Arbeit (HUD/Map, Design, spaeter
Music-Player, Login/Settings, weitere Frontend-Features) parallel laufen
koennen, ohne dass sich Sessions im einzigen Worktree serialisieren.

Diese Session bleibt bewusst ein Bootstrap: kein Feature-Code, kein UI, kein
Schema/DB, keine Foundation-Branch. Nach Phils Addendum wird die minimale
Git-Disziplin aber direkt in die automatisch gelesenen Instruktionsdateien
gezogen: `CLAUDE.md` fuer Claude Code und `AGENTS.md` fuer Codex/andere
Agenten. Keine Workflow-Wiki-Seite; wenn die Praxis sich bewaehrt, kann eine
spaetere Hygiene-Session sie nach `brain/wiki/workflows/` heben.

## Context

- Originalworktree `C:\Users\Phil\chrono-lexicanum` bleibt der
  Coordination-/Main-Worktree. `main` ist read-only fuer lokale Arbeit:
  keine Commits auf `main`.
- Lokaler alter Worktree `C:\Users\Phil\chrono-batches-011-015\` (Branch
  `ingest/batches-011-015`, Altlast aus dem Brief-074/061-Zyklus) bleibt
  unberuehrt: weder loeschen noch hineinmergen.
- 079-impl hat `src/app/lab/cartographer/page.tsx` + die Iframe-Sandbox unter
  `public/lab/cartographer-prototype/` gelandet. Brief 081 ist offen fuer eine
  /clear-Loop ueber `ssot-w40k-005..019`.
- Der urspruenglich als HUD-Worktree gedachte Strang wird bewusst zum
  Product/UI-Worktree erweitert. Product/UI ist der richtige Konfliktschnitt
  fuer HUD, Map, Design, Music-Player, Login/Settings und sonstige
  Frontend-Arbeit. Separate dauerhafte `design`, `hud` und `features`
  Worktrees wuerden dieselben Dateien (`layout`, `globals`,
  `src/components/**`, `package.json`) gegeneinander laufen lassen.

## Constraints

- Beide aktiven Arbeits-Worktrees zweigen von `origin/main` ab, nicht von einer
  Inflight-Branch.
- Genau zwei aktive Arbeits-Worktrees plus Original:
  - `C:\Users\Phil\chrono-lexicanum-product` -> Branch
    `worktree/product-bootstrap` (agent-neutraler Platzhalter; spaeter per
    `git switch -c codex/product-{slug}` auf echte Aufgaben-Branches wechseln,
    z. B. `codex/product-hud-map`, `codex/product-music-player`,
    `codex/product-login-settings`).
  - `C:\Users\Phil\chrono-lexicanum-batches` -> Branch
    `worktree/batches-bootstrap` (agent-neutraler Platzhalter; spaeter per
    `git switch -c codex/ingest-batches-{slug}` auf echte Aufgaben-Branches
    wechseln, z. B. `codex/ingest-batches-synopsis-005-019` oder
    `codex/ingest-batches-021-025`).
- Der zuerst angelegte `C:\Users\Phil\chrono-lexicanum-hud`-Worktree wird per
  `git worktree move` in `C:\Users\Phil\chrono-lexicanum-product` umgehaengt;
  die Branch wird von `codex/chrono-hud-map` erst auf
  `codex/product-bootstrap`, dann agent-neutral auf
  `worktree/product-bootstrap` umbenannt. Der Batch-Bootstrap wird analog von
  `codex/ingest-batches-bootstrap` auf `worktree/batches-bootstrap` umbenannt.
  Kein vierter aktiver Product-Strang.
- Originalworktree nicht resetten. Der bereits entstandene lokale
  `main`-Ahead-Zustand aus dem Direkt-Push-Versuch wird erst nach PR-Merge auf
  expliziten Cleanup-Trigger bereinigt.
- Falls ein Zielpfad oder eine Zielbranch bereits existiert, stoppt Codex mit
  kurzer Statusmeldung; keine bestehenden Worktrees oder Branches loeschen
  oder ueberschreiben.

### Ownership-Regel

- **Product/UI-Worktree** schreibt in: `src/app/{lab,map,timeline,ask}/**`,
  `src/app/page.tsx`, `public/lab/**`, `src/components/**` (insbesondere
  `chrome/`, `timeline/`, spaeter `map/`), `src/app/layout.tsx`,
  `src/app/globals.css`, `docs/ui-backlog.md`, und kuenftige Product-Features
  wie Music-Player, Login-/Settings-UI und Design-Polish.
- **Batch-Worktree** schreibt in: `scripts/seed-data/**`,
  `scripts/apply-override*.ts`, `scripts/run-{resolver,ssot}-*.sh`,
  `scripts/{test,audit,smoke,backfill}-*.ts`,
  `src/lib/{seed,resolver,ingestion}/**`, `sessions/ssot-loop-log.md`.
- **Geteilte Dateien** (Schema/Migrations, `package.json`,
  `sessions/README.md`, Brain-Wiki-Pages) duerfen beide beruehren. Wer als
  zweiter pusht, rebased.

## Parallel Worktree Git Protocol

Diese Regeln muessen in `CLAUDE.md` und `AGENTS.md` stehen, damit sie fuer
Claude Code und Codex automatisch greifen:

- `main` ist read-only. Nie auf `main` committen.
- Am Session-Start `git branch --show-current` und
  `git status --short --branch` ausfuehren.
- Wenn die aktuelle Branch `main`, detached, eine Bootstrap-Branch oder eine
  bereits gemergte Aufgaben-Branch ist: vor Edits eine frische Aufgaben-Branch
  von `origin/main` anlegen.
- Branch-Namen:
  - Product/UI: `codex/product-<short-slug>`
  - Batch/Ingestion: `codex/ingest-batches-<short-slug>`
  - Meta/session-only: `codex/session-<NNN>-<short-slug>`
- Bei "fertig" / "PR erstellen": Status pruefen, nur Task-Dateien aus diesem
  Worktree stagen, committen, `git push -u origin <current-branch>`, PR
  erstellen, **nicht mergen**.
- Bei "PR ist gemerged, bitte aufraeumen": PR-Merge verifizieren, Worktree
  clean pruefen, `git fetch --prune origin`, Worktree auf Bootstrap-Branch
  zurueckfuehren und nach Moeglichkeit fast-forward auf `origin/main`, alte
  Task-Branch erst nach Merge-/Preservation-Check loeschen. Keine Worktrees
  loeschen, kein `git reset --hard` ohne explizite Freigabe.

## Out of scope

- Keine neue Datei unter `brain/wiki/workflows/`.
- Kein Edit in `brain/wiki/index.md`, `brain/wiki/log.md`,
  `brain/wiki/project-state.md` oder einer anderen Brain-Seite.
- Kein Aufraeumen / Entfernen des `chrono-batches-011-015`-Worktrees oder des
  lokalen `ingest/batches-011-015`-Heads.
- Keine Foundation-Branch, kein gemeinsamer Refactor-Commit.
- Kein Feature-Code, kein UI, kein Schema, kein DB-Apply, kein Override-Edit,
  kein Resolver-Lauf.
- Kein `npm install` in den neuen Worktrees. Phil installiert selbst, wenn er
  das erste Mal in einem neuen Worktree arbeitet.

## Acceptance

- [x] `git fetch origin` lief sauber; `origin/main` war zum Bootstrap-Zeitpunkt
  aktuell.
- [x] `git worktree list` zeigt vier Eintraege: Original,
  `chrono-batches-011-015` als unveraenderte Altlast,
  `chrono-lexicanum-product` auf `worktree/product-bootstrap`,
  `chrono-lexicanum-batches` auf `worktree/batches-bootstrap`.
- [x] Beide aktiven Arbeits-Worktrees existieren auf der Platte und sind clean.
- [x] `git rev-parse HEAD` aus Product- und Batch-Worktree entspricht dem
  damaligen `origin/main`-Tip `9b9a839`.
- [x] `CLAUDE.md` und `AGENTS.md` enthalten den Parallel-Worktree-Git-Protocol-
  Block fuer CC und Codex.
- [x] Implementer-Report dokumentiert die ausgefuehrten Worktree-Aufrufe,
  HEAD-Hashes, finale Worktree-Liste und die spaetere Product-Umhaengung.

## Open questions

Inputs fuer die Brief-082-Antwort, nicht implementierungsblockierend:

- **`node_modules` pro Worktree?** Empfehlung im Report: separates
  `npm install` je Worktree. Symlink/Junction-Strategien erzeugen
  Race-Conditions; `pnpm`-Umzug waere fuer reines Speicher-Sparen zu gross.
- **`ingest`-Branch-Zustand.** Kein lokaler Branch namens schlicht `ingest`;
  nur `ingest/batches-011-015` auf `84a3c5f`, bleibt unberuehrt.

## Notes

Aktiver Zielzustand:

```
C:\Users\Phil\chrono-lexicanum          # coordination/main, no local commits on main
C:\Users\Phil\chrono-lexicanum-product  # Product/UI strand, bootstrap branch worktree/product-bootstrap
C:\Users\Phil\chrono-lexicanum-batches  # Batch/Ingestion strand, bootstrap branch worktree/batches-bootstrap
```

Spickzettel fuer neue echte Aufgaben:

```
# im Product-Worktree
git fetch origin
git switch worktree/product-bootstrap
git merge --ff-only origin/main
git switch -c codex/product-<short-slug>

# im Batch-Worktree
git fetch origin
git switch worktree/batches-bootstrap
git merge --ff-only origin/main
git switch -c codex/ingest-batches-<short-slug>
```
