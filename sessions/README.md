# Sessions

This folder is the project's history. Every architect brief from Cowork and every implementer report from Claude Code is one Markdown file here.

For format, naming, status lifecycle, and archive rule, see [`brain/wiki/workflows/sessions-format.md`](../brain/wiki/workflows/sessions-format.md).

## Quick reference

- **Naming:** `YYYY-MM-DD-NNN-{arch|impl}-{slug}.md`
- **`NNN`** is monotonically increasing across the project (not reset daily)
- **Templates** live in [`_templates/`](./_templates/) — copy when starting a session
- **Drafts** go in `_drafts/` (gitignored)
- **Archive rule:** root holds only open / `needs-decision` briefs and at most the last 1–2 just-closed sessions; everything else moves to [`archive/YYYY-MM/`](./archive/) promptly. Detail in [sessions-format § Archiving](../brain/wiki/workflows/sessions-format.md#archiving).

## Pointers

- **Infrastructure log** — replaced by structured updates to [`brain/wiki/log.md`](../brain/wiki/log.md), [`brain/wiki/project-state.md`](../brain/wiki/project-state.md), and [`brain/wiki/pipeline-state.md`](../brain/wiki/pipeline-state.md). Pre-049 entries preserved at [`brain/raw/historical/sessions-readme-log-pre-2026-05-08.md`](../brain/raw/historical/sessions-readme-log-pre-2026-05-08.md).
- **Carry-over for the next architect brief** — replaced by [`brain/wiki/open-questions.md`](../brain/wiki/open-questions.md) (numbered queue) plus [`brain/wiki/deferred-questions.md`](../brain/wiki/deferred-questions.md) (dormant items).
- **Cosmetic UI polish** — lives in [`docs/ui-backlog.md`](../docs/ui-backlog.md), cleared in batched cleanup sessions.

## Active threads

> **Kopf (2026-06-01).** Korpus datenkomplett (859/859 = 565 W40K + 294 HH), konsolidiert. Zuletzt gemergt: Brief 104 (alias-aware-drift, drift_works 380→0, PR #118), Brief 105 (Cluster A buy/listen + audiobooks, PR #112+#114), Brief 107 (Full-Rebuild-Restore-Wiring, PR #115). **Step 1 beider Arcs gemergt** (Brief 109 Entity-Hubs + Brief 110 Podcast-Pilot, 2026-06-01). Aktive Linie jetzt: **Step 2 beider Arcs** — Entity-Panel (Brief 113, Product) + Podcast-Schema (Brief 114, Batches), beide geschrieben + startklar. Voller Stand: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md). Merge-Historie im Detail → [`brain/wiki/log.md`](../brain/wiki/log.md).

> **Offen aus den letzten Merges (kein Blocker):** PR-#113-Sichtung (Chronicle/Ask-Redesign, Brief-096 G+H) + 096-Status-Flip; Maintainer-Visual-Pass der Brief-104-Alias-UI (Desktop + ≤640px); `?audit=drift` jetzt dauerhaft leer → UI-Entscheidung. OQ (3) + (13) bleiben offen. Watch-Items: `project-state.md` § What's open.

Nur offene / standing / jüngst geschlossene Sessions stehen in der Tabelle; alles andere lebt in [`archive/2026-05/`](archive/2026-05/) (Archiv-Regel oben).

| Session | Role | Status | Topic |
|---|---|---|---|
| [117-arch-tooling-files-relocation](./2026-06-02-117-arch-tooling-files-relocation.md) | architect | open | **Tooling-Files raus aus dem Brief-Namespace (Code-PR).** Die 6 lebenden Tooling-Files (2 Loop-Logs + 4 Runbooks) → `scripts/runbooks/` + `scripts/logs/`, Pfad pro Runner zentralisiert, 102/107 mit-archiviert, alle `scripts/`+`brain/`+`CLAUDE.md`-Refs nachgezogen. Atomar aus dem Koordinations-Worktree (quer: scripts/ + brain/), Branch+PR. Folge zu 111. |
| [113-arch-entity-graph-panel](./2026-06-01-113-arch-entity-graph-panel.md) | architect | open | **Entity-Graph Step 2 — In-Context-Panel (Product).** Klick auf Entity-Link öffnet den Hub als Overlay (intercepting routes, reused `loadEntity`+`EntityView`, zero fork, gleiche URL; SSG-Seite = Fallback). Optik/Choreografie an CC (Design-freedom). |
| [114-arch-podcast-schema-apply](./2026-06-01-114-arch-podcast-schema-apply.md) | architect | open | **Podcast Step 2 — Schema + idempotenter Apply (Batches).** `podcast`/`podcast_episode` work-kinds + Detail-Tabellen, `episodeGuid`-keyed Apply des committeten Artefakts → `work_*`-Junctions; + Quick-alias-wins. Schema-Migration → PR. |
| [112-arch-brain-lint-always-read-budgets](./2026-06-01-112-arch-brain-lint-always-read-budgets.md) | architect | open | **brain:lint always-read budget-guardrail (Code → PR).** Erzwingt die Lean-Budgets pro always-read-File (char/token, warn + error; >5 offene OQ-Items warnt), damit die Synthese-Files nicht wieder zu Append-Logs wachsen. Paart mit Brief 111 + dem session-end „leanness contract"-Step. |
| [111-arch-session-start-token-diet](./2026-06-01-111-arch-session-start-token-diet.md) | architect | implemented | **Session-start token diet + archive-sweep — doc-only-Teilmenge gemergt (`2c9af45`, 2026-06-02).** Brain-Slim + Brief-Disziplin + Read-Order-Regel angewandt (Floor ~91k → ~18k); 7 ungekoppelte Paare (098–106) archiviert + NNN-098/099 → 115/116 + Frontmatter-Schema-Fix der always-read-Files. Logs/Runbooks-Relocation war script-gekoppelt → **Brief 117** (Code-PR, offen). |
| [096-arch-design-direction](./2026-05-23-096-arch-design-direction.md) | architect | open | **Design-Direction.** Phasen A–F gemergt (PR #110); G+H (Chronicle/Ask) via PR #113 — Cowork-Sichtung + Status-Flip offen. Läuft lokal-iterativ im Product-Worktree. |
| [061-arch-ssot-loop](./2026-05-11-061-arch-ssot-loop.md) | architect | open (standing) | **SSOT-Loop — Korpus datenkomplett.** Loop-Driver bleibt für Ad-hoc-Roster-Erweiterungen im Repo; läuft nicht mehr im Default-Cycle. |
| 104·105·107 · **109·110** | arch + impl | merged (jüngst) | Alias-aware-drift (#118) · Cluster A (#112+#114) · Full-Rebuild-Restore-Wiring (#115) · **Entity-Graph Step 1** (echte `/charakter` `/fraktion` `/welt`-Hubs, SSG) · **Podcast-Pilot Step 1** (*40k Lorecast* dry-run, 148 Folgen / 91.9% getaggt, Artefakt+Report, kein DB). Detail → `project-state.md` + `log.md`. |

For closed/older sessions: [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Latest pipeline state" + [`brain/wiki/log.md`](../brain/wiki/log.md).
