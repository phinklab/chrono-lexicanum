---
session: 2026-06-01-111
role: architect
date: 2026-06-01
status: open
slug: session-start-token-diet
parent: null
links: []
commits: []
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

Im **Koordinations-Worktree** (doc-only → direkt auf `main`, kein PR; Meta-Brief → `brain/**` hier schreibbar). Ziel: `sessions/`-Root auf die Archiv-Regel bringen.

- **Bleiben im Root** (offen/standing/jüngst): 061 (standing), 096 (open), 108 (answered), 109 (open), 110 (open), 104 (last-closed), dieser Brief 111, plus `_templates/` + `_drafts/`.
- **Nach `archive/2026-05/`**: die geschlossenen Brief+Impl-Paare **098, 099, 100, 101, 102, 103** (arch + impl-data + impl-ui), **105** (arch + impl-data + impl-product), **107** (arch+impl) + die `resolver-dossiers/` Pass-11..15-Reports + `consolidation-pass-2-*`-Artefakte.
- **Große Append-Logs raus aus dem Brief-Namespace** → neues `sessions/logs/`: `ssot-loop-log.md` (~161k Token!), `resolver-loop-log.md`.
- **Runbooks → neues `sessions/runbooks/`**: `ssot-loop-runbook.md`, `resolver-pass-runbook.md`, `consolidation-pass-runbook.md`, `db-rebuild-runbook.md`. **`CLAUDE.md`-Mechanical-Task-Callouts auf die neuen Pfade umschreiben** (drei `>`-Blockquotes + ggf. Index/Pipeline-State-Verweise).
- **NNN-098/099-Kollision fixen**: `2026-05-27-098-impl-map-dive-flicker-followup.md` + `2026-05-27-099-impl-map-transition-polish.md` (Product-Followups aus PR #110, reusen bereits vergebene NNN) → nächste freie NNN (Vorschlag **115 + 116** — 112–114 sind vergeben: Lint-Guardrail + Entity-/Podcast-Step-2), inkl. `parent`-Frontmatter-Anpassung + Pfad-Rewrites in `links:`/`sources:`.
- **Ref-Rewrites**: ~44 Verweise auf die verschobenen Files in `brain/wiki/**` auf die neuen Pfade umschreiben — Verteilung (Stand 2026-06-01): `log.md` ~25, `pipeline-state.md` ~6, `decisions/cross-era-identities.md` ~5, plus Einzelne in `architecture.md` / `decisions/location-policy.md` / `decisions/why-cc-direct-curation.md` / `decisions/why-sonnet-not-haiku.md` / `workflows/ingest.md` / `workflows/sessions-format.md`.

## Out of scope

- Kein Code / Daten / Config; kein Schema; keine `src/`- oder `scripts/`-Änderung.
- Die in dieser Session bereits geslimmten Files (`project-state.md` / `open-questions.md` / `README.md` / `cowork-session.md` / `CLAUDE.md` Read-order) **nicht** weiter umschreiben — nur ref-fixen, falls ein verschobener Link darin auftaucht.

## Acceptance

Die Session ist fertig, wenn:

- [ ] `sessions/`-Root nur noch offene/needs-decision/standing Briefs + die letzten 1–2 geschlossenen + Brief 111 enthält (plus `_templates/`/`_drafts/`/`archive/` + neue `logs/`/`runbooks/`).
- [ ] `ssot-loop-log.md` + `resolver-loop-log.md` liegen in `sessions/logs/`; die vier Runbooks in `sessions/runbooks/`; die `CLAUDE.md`-Callouts zeigen auf die neuen Runbook-Pfade.
- [ ] Die NNN-098/099-Kollision ist aufgelöst (zwei Files umbenannt, `parent` + alle Refs angepasst).
- [ ] Alle Refs auf verschobene Files in `brain/**` sind umgeschrieben; `npm run brain:lint -- --no-write` läuft grün.
- [ ] Ein einziger Doc-only-Commit direkt auf `main`, kein PR.

## Open questions

- Nächste freie NNN für die zwei Collision-Renames bestätigen (Vorschlag 115 / 116 — 112–114 sind vergeben).
- `resolver-dossiers/` komplett nach `archive/` oder als lebender Ordner behalten?

## Notes

Brief-099-Muster, zweite Ausführung — reine Repo-Hygiene, kein Verhaltens-Change. **Cowork-Sandbox-Hinweis:** die 9P/drvfs-Mount korrumpiert Whole-File-Reads (NUL-Byte; `wc -m`/`cat`/`grep -c ''` lieferten in dieser Token-Diet-Session falsche Größen/„binary file matches", während `head`/`tail`/`wc -l` + die Datei-Tools korrekt lasen). CC läuft nativ → kein Problem; Cowork kann den Sweep aber nicht selbst verifizieren, daher CC + native `git mv`.
