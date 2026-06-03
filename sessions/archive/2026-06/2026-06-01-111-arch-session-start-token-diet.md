---
session: 2026-06-01-111
role: architect
date: 2026-06-01
status: implemented
slug: session-start-token-diet
parent: null
links: [2026-06-02-117]
commits: [2c9af45]
---

# Session-start token diet + sessions-archive-sweep

## Goal

Den Session-Start-Token-Floor drastisch senken (gemessen ~91k Token, *bevor* ein Brief gelesen wird) und die `sessions/`-Archiv-Regel durchsetzen. Der Brain-Slim-Teil ist in dieser Cowork-Session **bereits direkt angewandt** (doc-only, Cowork = Brain-Editor); der physische Archiv-Sweep ist der CC-Handoff unten.

## Context

Messung 2026-06-01 (Koordinations-Worktree): die verpflichtende Read-Order kostete ~91k Token vor dem ersten Brief — `project-state.md` allein **~58k** (1 aktueller + **12 veraltete** „Latest pipeline state"-Snapshots + eine 59.6k-Zeichen-„Recently shipped"-Liste + ~130 Zeilen Frontmatter-Changelog), `open-questions.md` **~19k** (~14 von 16 Einträgen `~~closed~~`/`-historic`), `sessions/README.md` ~12k. `sessions/`-Root: 37 lose `.md` (~324k Token, wenn je alle gelesen), darunter `ssot-loop-log.md` allein **~161k**. Diagnose: nicht die Read-Order ist zu schwer — die *immer gelesenen* Synthese-Files sind zu Append-Logs verkommen, und die Archiv-Regel (`sessions-format` § Archiving: Root = nur offene + letzte 1–2 geschlossene) ist nicht durchgesetzt.

Entscheidungen mit Philipp (2026-06-01): radikal auf „aktueller Stand" kürzen (Historie → `log.md` + git); Brain-Kürzung direkt durch Cowork; striktes Archiv inkl. Logs raus aus dem Brief-Namespace.

## Bereits direkt angewandt diese Session (Cowork, doc-only → `main`)

- **`brain/wiki/project-state.md`** neu geschrieben — nur aktueller Stand (575 → ~90 Zeilen): die 12 veralteten Snapshots, „Recently shipped" und der Frontmatter-Changelog raus; Phase / Branch+Worktrees / **eine** Latest-pipeline-state / What's running / What's open / Next likely brief bleiben.
- **`brain/wiki/open-questions.md`** neu geschrieben — nur die offenen OQ (3) + (13); alle closed/`-historic` raus.
- **`sessions/README.md`** Active-threads entschlackt — kurzer Kopf + Tabelle nur offener/standing/jüngster Sessions.
- **`brain/wiki/workflows/cowork-session.md`** — neue § „Brief scope & length discipline" (Briefs so kurz im Scope + Writing wie möglich, so ausführlich wie nötig; *one brief = one session = one PR*; **verpflichtender Scope-Recap vor der Übergabe** als Flow-Step 7) + den `&&`-Bug in der Commit-Zeile auf zeilenweise gefixt (PowerShell-5-Regel).
- **`CLAUDE.md`** § Read-order — neue Regel „Lies nur, was die Aufgabe braucht" (enge/Strang-Sessions überspringen die schwere Synthese; die Synthese-Files werden bewusst schlank gehalten).

**Resultat:** Read-Order-Floor ~91k → **~18k Token** (project-state ~59k → ~3k, open-questions ~19k → ~1.5k). ≈70k Token/Session gespart.

## For the implementer — sessions-archive-sweep (Brief-099-Muster, 2. Ausführung)

> **Scope eingedampft 2026-06-02 (Cowork, nach CC-needs-decision).** CC hat beim Implementieren entdeckt: die Logs + Runbooks sind **keine** reinen Docs, sondern last-tragende Pfade im mechanischen Tooling — `run-resolver-pass.sh:236` stirbt hart an fehlender Runbook (`if [[ ! -f "$RUNBOOK_PATH" ]]; then die`), `run-ssot-loop.sh:52` + `run-resolver-loop.sh:66` nutzen die Logs als `LOG_PATH`-Write-Target (mit striktem Diff-Shape-Check), `resolver-loop-log-update.ts:245` hardcodet den Log-Pfad; dazu `.runbook`/`.brief`-Felder in `scripts/*.config.json` (referenzieren u.a. 102, 107). Sie zu verschieben braucht `scripts/`-Edits → Code-PR, **nicht** doc-only. Der sandboxed Vor-Architekt konnte `scripts/` nicht greppen. **Konsequenz:** die Relocation (Logs, Runbooks, 102/107, `CLAUDE.md`-Callouts) ist aus diesem Brief **raus → Brief 117** (Code-PR). Hier bleibt nur die echt-doc-only-Teilmenge.

Im **Koordinations-Worktree** (doc-only → direkt auf `main`, kein PR; Meta-Brief → `brain/**` hier schreibbar). Ziel: `sessions/`-Root auf die Archiv-Regel bringen — **soweit ohne Script-Anfassen möglich**.

- **Bleiben im Root** (offen/standing/jüngst): 061 (standing), 096 (open), 108 (answered), 109 (open), 110 (open), 104 (last-closed), 112/113/114 (open), dieser Brief 111 — **plus die 6 Tooling-Files (Logs + Runbooks) und 102/107 unverändert**, die zieht erst Brief 117 um. Plus `_templates/`, `_drafts/`, `archive/`, `resolver-dossiers/`.
- **Nach `archive/2026-05/`** — nur geschlossene Paare **ohne** Script-Ref: **098** (arch+impl), **099** (arch+impl), **100** (arch+impl), **101** (arch+impl), **103** (arch + impl-data + impl-ui), **105** (arch + impl-data + impl-product), **106** (arch-only, `status: archived`). **Nicht** 102/107 (Config-`.brief`-gekoppelt → Brief 117). Beim Archivieren das stale `status: open` auf 098-arch (+ ggf. 099-arch) auf `implemented`/`archived` flippen.
- **Safety-Gate (pro Datei):** vor jedem `git mv` den Dateinamen/NNN in `scripts/` greppen (z.B. `grep -rn "2026-05-25-098" scripts/`). Trifft etwas → **nicht bewegen**, gehört in Brief 117.
- **NNN-098/099-Kollision fixen**: `2026-05-27-098-impl-map-dive-flicker-followup.md` + `2026-05-27-099-impl-map-transition-polish.md` (Product-Followups aus PR #110, reusen bereits vergebene NNN) → **115 + 116** (112–114 vergeben: Lint-Guardrail + Entity-/Podcast-Step-2), inkl. `parent`-Frontmatter-Anpassung + Pfad-Rewrites in `links:`/`sources:`. Beide sind `status: complete` → nach dem Rename ebenfalls nach `archive/2026-05/`.
- **Ref-Rewrites** — **nur für die in diesem Brief tatsächlich bewegten Files** (die 7 archivierten Paare + die 2 Renames): die Verweise darauf in `brain/wiki/**` auf die neuen `archive/`-Pfade umschreiben. **Refs auf Logs/Runbooks NICHT anfassen** — die bewegen sich erst in Brief 117, sonst zeigen die Rewrites ins Leere.

## Out of scope

- Kein Code / Daten / Config; kein Schema; **keine `src/`- oder `scripts/`-Änderung** (genau deshalb ist die Relocation raus).
- **Logs, Runbooks, 102, 107 NICHT bewegen** — das ist Brief 117 (Code-PR). Auch die `CLAUDE.md`-Mechanical-Task-Callouts hier **nicht** umschreiben; die zeigen weiter auf die alten `sessions/…`-Pfade, bis 117 sie mitzieht.
- `resolver-dossiers/` bleibt unangetastet (lebender Ordner — s. Open questions).
- Die in dieser Session bereits geslimmten Files (`project-state.md` / `open-questions.md` / `README.md` / `cowork-session.md` / `CLAUDE.md` Read-order) **nicht** weiter umschreiben — nur ref-fixen, falls ein verschobener Link darin auftaucht.

## Acceptance

Die Session ist fertig, wenn:

- [ ] Die 7 geschlossenen, ungekoppelten Paare (098, 099, 100, 101, 103, 105, 106) liegen in `archive/2026-05/`; ihr `status` ist closed (kein stale `open` mehr).
- [ ] `sessions/`-Root enthält nur noch offene/needs-decision/standing Briefs + die letzten 1–2 geschlossenen + Brief 111 — **plus** die noch nicht umgezogenen Tooling-Files (Logs/Runbooks) und 102/107; deren Relocation macht Brief 117 (hier bewusst noch nicht „rein").
- [ ] Die NNN-098/099-Kollision ist aufgelöst: die zwei `2026-05-27`-Map-Followups sind auf 115/116 umbenannt (`parent` + alle Refs angepasst) und nach `archive/2026-05/` verschoben.
- [ ] Alle Refs auf die in diesem Brief bewegten Files (7 Paare + 2 Renames) in `brain/**` sind umgeschrieben; Log-/Runbook-Refs sind **unberührt**; `npm run brain:lint -- --no-write` läuft grün.
- [ ] Ein einziger Doc-only-Commit direkt auf `main`, kein PR.

## Open questions

- ~~Nächste freie NNN für die zwei Collision-Renames~~ → **115 / 116 bestätigt** (112–114 vergeben: Lint-Guardrail + Entity-/Podcast-Step-2).
- ~~`resolver-dossiers/` nach `archive/` oder lebend behalten?~~ → **lebender Ordner, bleibt** (die aktive Wellen-Dossier-Datei ist live aus `scripts/resolver-pass.config.json` referenziert — nicht anfassen).
- Neu für Brief 117: Ziel-Layout der 6 Tooling-Files (Vorschlag `scripts/runbooks/` + `scripts/logs/`) + ob `db-rebuild`/`consolidation` als „mechanische Tasks" denselben Move kriegen.

## Notes

Brief-099-Muster, zweite Ausführung — reine Repo-Hygiene, kein Verhaltens-Change. **Cowork-Sandbox-Hinweis:** die 9P/drvfs-Mount korrumpiert Whole-File-Reads (NUL-Byte; `wc -m`/`cat`/`grep -c ''` lieferten in dieser Token-Diet-Session falsche Größen/„binary file matches", während `head`/`tail`/`wc -l` + die Datei-Tools korrekt lasen). CC läuft nativ → kein Problem; Cowork kann den Sweep aber nicht selbst verifizieren, daher CC + native `git mv`.
