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

> **Kopf (2026-06-02).** Korpus datenkomplett (859/859) und Podcast-Step-2 gemergt: Brief 113 liefert EntityView-Redesign + `@modal`-Panel; Brief 114 persistiert den 40k Lorecast als `podcast`/`podcast_episode` Works mit 149 Episoden und 519 Tags. Der neue Product-Nordstern steht in Brief 119: Medienarchiv zuerst, Kontextgraph als Navigation. Naechster ausfuehrbarer Product-Brief ist 120 (`/`, `/werke`, `/podcasts`, `/fraktionen`).

> **Offen aus den letzten Merges (kein Blocker):** Maintainer-Visual-Pass fuer Entity-Hubs/Panel; PR-#113-Sichtung (Chronicle/Ask-Redesign, Brief-096 G+H) + 096-Status-Flip; `?audit=drift` jetzt dauerhaft leer -> UI-Entscheidung. OQ (3) + (13) bleiben offen. Watch-Items: `project-state.md` What's open.

Nur offene / standing / jüngst geschlossene Sessions stehen in der Tabelle; alles andere lebt in [`archive/2026-05/`](archive/2026-05/) (Archiv-Regel oben).

| Session | Role | Status | Topic |
|---|---|---|---|
| [120-arch-public-media-ia](./2026-06-02-120-arch-public-media-ia.md) | architect | open | **Public Media IA (Product).** Home, `/werke`, `/podcasts`, `/fraktionen`; Buecher zuerst, Podcasts als zweite Medien-Saeule, Fraktionen als Guide-Index; `/atlas` aus der public Home-/Tool-Navigation raus; Facets als `/werke`-Filter. |
| [119-arch-media-archive-reframe](./2026-06-02-119-arch-media-archive-reframe.md) | architect | open | **Nordstern-Reframe zu 118.** Kein flacher Wiki-Graph: Medienarchiv zuerst, Kontextgraph als Navigation; unified detail view bedeutet nicht gleiche Produktprioritaet. |
| [117-arch-tooling-files-relocation](./2026-06-02-117-arch-tooling-files-relocation.md) | architect | implemented | **Tooling-Files raus aus dem Brief-Namespace (Code-PR) — gemergt 2026-06-02.** 6 lebende Tooling-Files (2 Loop-Logs → `scripts/logs/`, 4 Runbooks → `scripts/runbooks/`) aus `sessions/`; Pfad pro Runner zentralisiert (`scripts/lib/tooling-paths.ts` + Shell-Konstanten); 102/107 mit-archiviert; alle `scripts/`+`brain/`+`CLAUDE.md`+`AGENTS.md`-Refs nachgezogen. Folge zu 111. |
| [113-arch-entity-graph-panel](./2026-06-01-113-arch-entity-graph-panel.md) | architect | implemented | **Entity-Graph Step 2 — EntityView-Redesign + In-Context-Panel (Product), gemergt 2026-06-02.** Shared `EntityView` redesign + root `@modal` intercepts; Report: [113-impl](./2026-06-01-113-impl-entity-graph-panel.md). |
| [114-arch-podcast-schema-apply](./2026-06-01-114-arch-podcast-schema-apply.md) | architect | implemented | **Podcast Step 2 — Schema + idempotenter Apply (Batches), gemergt 2026-06-02.** `podcast`/`podcast_episode` work-kinds + Detail-Tabellen; 40k Lorecast Show + 149 Episoden + 519 Tags angewandt; Report: [114-impl](./2026-06-02-114-impl-podcast-schema-apply.md). |
| [112-arch-brain-lint-always-read-budgets](./2026-06-01-112-arch-brain-lint-always-read-budgets.md) | architect | open | **brain:lint always-read budget-guardrail (Code → PR).** Erzwingt die Lean-Budgets pro always-read-File (char/token, warn + error; >5 offene OQ-Items warnt), damit die Synthese-Files nicht wieder zu Append-Logs wachsen. Paart mit Brief 111 + dem session-end „leanness contract"-Step. |
| [111-arch-session-start-token-diet](./2026-06-01-111-arch-session-start-token-diet.md) | architect | implemented | **Session-start token diet + archive-sweep — doc-only-Teilmenge gemergt (`2c9af45`, 2026-06-02).** Brain-Slim + Brief-Disziplin + Read-Order-Regel angewandt (Floor ~91k → ~18k); 7 ungekoppelte Paare (098–106) archiviert + NNN-098/099 → 115/116 + Frontmatter-Schema-Fix der always-read-Files. Logs/Runbooks-Relocation war script-gekoppelt → **Brief 117** (Code-PR) gemergt 2026-06-02. |
| [096-arch-design-direction](./2026-05-23-096-arch-design-direction.md) | architect | open | **Design-Direction.** Phasen A–F gemergt (PR #110); G+H (Chronicle/Ask) via PR #113 — Cowork-Sichtung + Status-Flip offen. Läuft lokal-iterativ im Product-Worktree. |
| [061-arch-ssot-loop](./2026-05-11-061-arch-ssot-loop.md) | architect | open (standing) | **SSOT-Loop — Korpus datenkomplett.** Loop-Driver bleibt für Ad-hoc-Roster-Erweiterungen im Repo; läuft nicht mehr im Default-Cycle. |
| 104·105·107 · **109·110** | arch + impl | merged (jüngst) | Alias-aware-drift (#118) · Cluster A (#112+#114) · Full-Rebuild-Restore-Wiring (#115) · **Entity-Graph Step 1** (echte `/charakter` `/fraktion` `/welt`-Hubs, SSG) · **Podcast-Pilot Step 1** (*40k Lorecast* dry-run, 148 Folgen / 91.9% getaggt, Artefakt+Report, kein DB). Detail → `project-state.md` + `log.md`. |

For closed/older sessions: [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Latest pipeline state" + [`brain/wiki/log.md`](../brain/wiki/log.md).
