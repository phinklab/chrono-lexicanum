# CLAUDE.md — Shared project context

> **Read this first, every session, every role.**
> If you are **Cowork**, also read [`brain/wiki/workflows/cowork-session.md`](./brain/wiki/workflows/cowork-session.md) for the architect role.
> If you are **Claude Code**, also read [`brain/wiki/workflows/cc-session.md`](./brain/wiki/workflows/cc-session.md) for the implementer role.
> Both roles must read [`brain/wiki/workflows/sessions-format.md`](./brain/wiki/workflows/sessions-format.md) to understand the session log format.
>
> The legacy `docs/agents/*.md` files are now redirect stubs; brain workflows are canonical.

---

## Brain & Atlas

This project's memory is split into two stores. Engineering memory stays in the repo and is always loaded; the book domain (entity data) lives in an external Obsidian vault and is loaded only on demand.

- **Brain** ([`brain/`](./brain/CLAUDE.md)) — small, always-mitgeladen, LLM-pflegt. Contains *what the project is, how it works, what was decided, what's open*. Karpathy-style LLM Wiki (`raw/` immutable + `wiki/` synthesized + Schema-Datei + three operations Ingest/Query/Lint). Cowork is the primary Brain-editor. The atomic-commit pairing of "code change + Brain update in one commit" applies **only inside the coordination worktree** (`chrono-lexicanum`) — Brief 095, § "Parallel worktrees" → "Rollup-Ownership". In the Product- and Batches-strand worktrees `brain/**` stays untouched; substantive system facts go into the impl report, and Cowork backfills the rollup files in a post-merge coordination pass.
- **Atlas** (`chrono-atlas/`, **außerhalb dieses Repos**, default `~/chrono-atlas/`) — external Obsidian vault, mechanical mirror of Postgres. Generated via `npm run atlas:regen`. Read-only. **Never auto-loaded** — only opened on explicit "schau in den Atlas". Postgres is single-source-of-truth for the book domain; Atlas spiegelt, bestimmt nicht.

**Read-order on session start** (every Cowork-/CC-Session, before turning to the task):

1. This file (top-level CLAUDE.md) — stack, conventions, version policy
2. [`brain/CLAUDE.md`](./brain/CLAUDE.md) — Brain schema (Karpathy frame, three operations, frontmatter convention)
3. [`brain/wiki/index.md`](./brain/wiki/index.md) — master catalog of brain pages
4. [`brain/wiki/project-state.md`](./brain/wiki/project-state.md) — "Where are we now"
5. [`brain/wiki/open-questions.md`](./brain/wiki/open-questions.md) — what's queued for the next brief
6. Whatever is relevant to the actual task (decisions, workflows, pipeline state, …)

> **SSOT-Loop-Iteration?** Eine Loop-Iteration (`scripts/run-ssot-loop.sh`) ist ein mechanischer Task, **keine** normale Session: folge [`sessions/ssot-loop-runbook.md`](./sessions/ssot-loop-runbook.md) und überspringe diese Session-Start-Leseroutine (Brief 061 selbst wird **nicht** gelesen).

> **Resolver-Welle?** Eine Welle — headless via `scripts/run-resolver-loop.sh` oder einzeln via `scripts/run-resolver-pass.sh <config>` — ist ein mechanischer Task, **keine** normale Session: folge [`sessions/resolver-pass-runbook.md`](./sessions/resolver-pass-runbook.md) + der per-Welle-Config und überspringe diese Session-Start-Leseroutine. **Lies keinen Brief** — weder einen per-pass Architect-Brief (existiert seit Brief 094 nicht mehr) noch den „höchsten offenen Brief". Operative Spec ist ausschließlich das Runbook; Herkunft der Rationale steht im Runbook-Anhang.

> **Consolidation-Pass?** Ein Konsolidierungs-Pass — phase-weise gefahren über `scripts/consolidation-aggregate.ts`, `scripts/consolidation-db-snapshot.ts`, `scripts/consolidation-db-sync.ts` und den geteilten `scripts/run-phase4-apply.sh scripts/consolidation-pass.config.json` — ist ein mechanischer Task, **keine** normale Session: folge [`sessions/consolidation-pass-runbook.md`](./sessions/consolidation-pass-runbook.md) + der dedizierten `scripts/consolidation-pass.config.json` und überspringe diese Session-Start-Leseroutine. **Lies keinen Brief** — weder Brief 094 noch Brief 098. Operative Spec ist ausschließlich das Runbook; Herkunft der Rationale steht im Runbook-Anhang.

Karpathy-Reset historischer Kontext: Brief [049](./sessions/archive/2026-05/2026-05-08-049-arch-karpathy-brain-atlas-reset.md), 2026-05-08.

---

## What this project is

**Chrono · Lexicanum** is a fan-made web archive of Warhammer 40,000 novels. Three primary tools:

1. **Chronicle** — interactive in-universe timeline of every novel
2. **Cartographer** — galaxy map with sectors, worlds, and book-pins (filterable by year)
3. **Ask the Archive** — short questionnaire that ranks recommended entry points

Goal of v1: a polished, public-shareable site (Reddit launch). Long-term: community contributions for missing books, custom chapters, corrections.

The maintainer is **Philipp** (hobby project). Prefer **simple, honest tradeoffs** over speculative scaling.

---

## Stack (decided 2026-04-28, see `sessions/archive/2026-04/2026-04-28-001-arch-bootstrap.md`)

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | **Next.js 15 (App Router) + React 19 + TypeScript** | Multi-page routing, SEO for book/faction detail pages, Vercel-native |
| Styling | **Tailwind CSS** + a small `globals.css` for fonts and CSS vars | Mostly utilities; ported components keep their original CSS until refactored |
| Database | **Supabase Postgres** | Real SQL, growth headroom, free tier ample, auth ready when needed |
| ORM | **Drizzle ORM** | Type-safe, SQL-first, migrations versioned in git |
| Hosting | **Vercel** | Zero-config Next.js deploys, preview URLs per branch |
| Ingestion | **TypeScript under `src/lib/ingestion/`** (Phase 3) | Crawl Wikipedia + Lexicanum + Open Library + Hardcover; LLM-Anreicherung (Anthropic Haiku 4.5 + Web-Search). Dry-Run-Diffs unter `ingest/.last-run/`. |

> **⚠ Version policy — read this carefully.**
>
> This file lists the *family* of tools (Next.js, Tailwind, Drizzle, …), never specific version numbers. **Cowork's training cutoff is older than the latest releases of every tool in this stack.** If Cowork writes "Next.js 15.1.6" in a brief or in `package.json`, that number is almost certainly wrong by the time Claude Code reads it.
>
> The contract:
> - **Cowork must NEVER pin a version** in briefs, in `package.json`, or anywhere else. Cowork writes "Next.js" or "Tailwind CSS" or, at most, "Next.js 15+" when a major boundary actually matters for the design decision.
> - **Claude Code must research** the current stable release of every tool it installs or upgrades, choose what's appropriate, and pin the chosen version in `package.json` / `package-lock.json`. Rationale (especially for "I deliberately did NOT take the latest because…") goes in the session report.
> - When Cowork's brief asks for an upgrade ("bump to Tailwind 4"), Cowork specifies the *major* and the *intent*. Claude Code picks the exact patch.
>
> See [`brain/wiki/workflows/cowork-session.md`](./brain/wiki/workflows/cowork-session.md) (architect side) and [`brain/wiki/workflows/cc-session.md`](./brain/wiki/workflows/cc-session.md) § "Concrete version-research workflow" (implementer side) for the operational rules. The pre-051 long-form version with the don't-write/write-instead table and the bootstrap example lives in git history.

The original HTML prototype lives **outside the repo** (in `archive/` locally, gitignored). Its data has been extracted into `scripts/seed-data/*.json` which IS in the repo. Do not edit the prototype; port forward.

---

## Repository layout

```
/                          ← repo root (Vercel build root)
  package.json
  tsconfig.json
  next.config.ts
  tailwind.config.ts
  drizzle.config.ts
  .env.example             ← copy to .env.local locally
  CLAUDE.md                ← this file (shared context, auto-loaded)
  README.md                ← thin pitch + status + brain pointer + live URL
  ROADMAP.md               ← redirect → brain/wiki/roadmap.md (post-049 reset)
  ARCHITECTURE.md          ← redirect → brain/wiki/architecture.md (post-049 reset)
  ONBOARDING.md            ← redirect → brain/wiki/onboarding.md (post-049 reset)

  brain/                   ← engineering memory (Karpathy-style LLM Wiki, post-049 reset)
    CLAUDE.md              ← Brain schema (Karpathy frame, three operations, frontmatter)
    wiki/                  ← LLM-synthesized pages (read these, edit cautiously)
      index.md, log.md, project-state.md, open-questions.md, glossary.md, …
      decisions/           ← ADRs + revisit-triggers
      workflows/           ← cowork-session, cc-session, ingest, query, lint, atlas-regen, …
    raw/                   ← immutable sources (never edited by LLM)
      historical/          ← snapshots of pre-reset top-level docs
      reviews/             ← external code reviews (codex, gpt-5, …)
    outputs/
      lint/                ← lint reports YYYY-MM-DD.md (lint script TBD)

  docs/
    agents/
      COWORK.md            ← legacy redirect → brain/wiki/workflows/cowork-session.md (post-051 stub)
      CLAUDE_CODE.md       ← legacy redirect → brain/wiki/workflows/cc-session.md (post-051 stub)
      SESSIONS.md          ← legacy redirect → brain/wiki/workflows/sessions-format.md (post-051 stub)

  sessions/                ← project history (Cowork ↔ Claude Code pingpong)
    README.md
    _templates/
      architect-brief.md
      implementer-report.md
    YYYY-MM-DD-NNN-{arch|impl}-{slug}.md
    archive/               ← older sessions, moved manually after a phase wraps

  src/
    app/                   ← Next.js App Router routes
      layout.tsx, page.tsx, globals.css
      timeline/, map/, ask/
      buch/[slug]/, fraktion/[slug]/, welt/[slug]/, charakter/[slug]/
    components/            ← shared React components (PascalCase files)
    db/
      schema.ts            ← Drizzle schema (single source of truth)
      client.ts            ← cached Postgres client
      migrations/          ← generated by drizzle-kit; DO commit these
    lib/                   ← future: small utilities (slugify, recommend, mScale)

  scripts/
    seed.ts                ← loads seed-data/*.json into Postgres
    seed-data/             ← canonical JSON catalog (committed)
      README.md
      eras.json, factions.json, series.json, books.json,
      sectors.json, locations.json, ask-questions.json

  ingest/                  ← Phase 3 dry-run outputs (.last-run/ committed JSON; .llm-cache/ gitignored). Crawler code lives under src/lib/ingestion/.
```

---

## Conventions

### Code

- **TypeScript strict.** No `any`. If something genuinely needs `unknown`, write a type guard.
- **Server components by default.** Add `"use client"` only when the file uses hooks, browser APIs, or event handlers.
- **Async params in Next 15.** `params` and `searchParams` are Promises in App Router 15. Always `await` them.
- **Never read `process.env` in client components.** Use `NEXT_PUBLIC_*` vars or pass values from a server component.
- **Database access only from server code** — `src/db/client.ts` must never be imported into a `'use client'` component.

### Data

- Custom in-universe time scale: `(M-1)*1000 + year_within_M`. M30.997 → `30997.000`. Stored as `numeric(10,3)`.
- Reference tables (`eras`, `factions`, `series`, `sectors`, `locations`, `characters`) use **string IDs** (e.g. `'thousand_sons'`).
- `books` use UUIDs internally with a slug column for URLs (`/buch/eisenhorn-xenos`).
- Every scraped row carries `source_kind` and `confidence` so we can audit and override.
- User-submitted content NEVER writes directly to canonical tables — it lands in `submissions` with `status='pending'`.

### Git

> **⚠ KRITISCH — kein `git` in einer Sandbox.** Wer in einer Sandbox arbeitet (Cowork-Modus), führt **niemals** `git` in der Sandbox-Shell aus — kein `fetch` / `checkout` / `log` / `show` / `status` / `commit` / `push` — und schreibt **niemals** in `.git/`. Die Mount-Schicht (9P / drvfs) korrumpiert dabei git-Metadaten (NUL-Byte-Korruption — `.git/config` musste deshalb am 2026-05-20 manuell repariert werden, Backup `.git/config.corrupt-backup-20260520`). Working-Tree-Dateien werden ausschließlich über die Datei-Tools (Read / Edit / Write) angefasst; der Working-Tree IST der aktuelle Stand, `git show` ist nicht nötig. Den Git-Stand erfragt Cowork beim Maintainer und liefert ihm die Terminal-Kommandos zum Einfügen zurück. Alle git-Operationen laufen Windows-nativ durch Philipp (oder durch Claude Code in einem nativen, nicht-sandboxed Worktree).

- Commit messages: imperative, concise, German or English (be consistent within one commit).
  Examples: `Add Aquila component`, `Fix M-scale parsing in seed script`, `Schema: add bookLocations.atY`.
- One logical change per commit. Migrations and the schema change that produced them go together.
- Never commit `.env.local`, `node_modules/`, `.next/`, or `archive/`. (Already in `.gitignore`.)
- Session logs (`sessions/*.md`) ARE committed — they are the project's history.

#### PR policy — docs land direct on `main`, code gets a PR

A pull request is a code-review + CI mechanism. A change that touches **only documentation** carries no build risk — there is nothing for a PR to catch — so it commits **directly to `main`**, no branch, no PR. Ceremony matched to risk: a hygiene cycle of architect brief + coordination pass no longer costs three PRs. Decided 2026-05-25 with Philipp (Model 1 of three).

- **Doc-only → direct to `main`.** A diff that touches *only* Markdown / docs: architect briefs and implementer reports under `sessions/`, `sessions/README.md`, everything under `brain/**`, `docs/**`, and the top-level `*.md` files (`CLAUDE.md`, `AGENTS.md`, `README.md`, `ROADMAP.md`, …). Covers coordination passes, doc-only briefs (e.g. a repo-hygiene sweep), and pure file moves among those paths. Commit straight to `main` and push. The coordination worktree (`chrono-lexicanum`) sits on `main` for exactly this.
- **Code / data / config → branch + PR.** A diff that touches anything else — `src/`, `scripts/`, `src/db/` (incl. migrations), `package.json` / `package-lock.json`, `.github/**`, the root `*.config.*` files — goes through a task branch + PR, reviewed and merged as before. The classifier is the **file set**, not the worktree.
- **Mixed change → PR.** If one logical change genuinely touches docs *and* code, the code drags the docs along — the whole thing goes through the PR. The rule removes the *requirement* of a separate doc PR; it never forbids docs riding inside a code PR.
- **A code-handing brief.** The architect brief is doc-only → it lands on `main` directly. CC then branches from `main`, implements, and flips the brief's `status: open → implemented` as a one-line edit *inside that code PR*. No separate PR for the brief, none for the status flip.
- **CI caveat.** `.github/workflows/ci.yml` runs `on: pull_request` only, so direct-to-`main` commits currently skip `brain:lint`. Until `ci.yml` also carries a `push: branches: [main]` trigger (itself a code change → its own PR), run `npm run brain:lint -- --no-write` locally green before pushing a doc-only commit.
- **Branch-protection caveat.** This rule assumes `main` accepts direct pushes. If GitHub branch protection rejects them, relax it for this single-maintainer repo, or fall back to bundling the doc change into the next PR.

Cowork never runs `git` (sandbox — see the KRITISCH banner above): it writes the files and hands Philipp the exact `git add … && git commit … && git push origin main` line.

### Parallel worktrees

Durable local worktrees:

- `C:\Users\Phil\chrono-lexicanum` = coordination / main worktree.
- `C:\Users\Phil\chrono-lexicanum-product` = Product/UI strand: HUD, Map, design polish, app shell, music player, login/settings UI, frontend features.
- `C:\Users\Phil\chrono-lexicanum-batches` = Batch/Ingestion strand: SSOT batches, overrides, resolver, DB-apply, ingestion scripts.

`main` is read-only for **code** work — every code/data/config change goes through a task branch + PR, never a direct commit. **Doc-only changes are the deliberate exception** (§ Git → "PR policy"): they commit straight to `main`, and the coordination worktree (`chrono-lexicanum`) sits on `main` to receive them.

**Rollup-Ownership (coordination-worktree-only).** The two strand worktrees (`chrono-lexicanum-product`, `chrono-lexicanum-batches`) **never write** the following files — only the coordination worktree (`chrono-lexicanum`) does:

- `sessions/README.md`
- everything under `brain/` (`brain/**`) — wiki pages, `brain/CLAUDE.md`, `decisions/`, `workflows/`, `index.md`, `log.md`, `glossary.md`, `outputs/`.

The rule holds in normal sessions, in mechanical runbooks, and as a "short wiki note on the side" — there is no exception. A strand that would previously have updated `project-state.md` / `log.md` / `index.md` / `README.md` records the same facts in its **impl report** (a fresh per-session file — single-writer, conflict-free) instead. Cowork backfills the coordination-only set in a post-merge pass from the coordination worktree; that is the **only** path through which these files change.

What strands **do** keep writing (unchanged): their own code/data paths (Product: `src/app/**`, `src/components/**`, `public/lab/**`, `docs/ui-backlog.md`; Batches: `scripts/**`, `src/lib/{seed,resolver,ingestion}/**`, override JSONs under `scripts/seed-data/`, `sessions/ssot-loop-log.md`, `sessions/resolver-dossiers/`), plus their own new per-session impl report. All per-session files are single-writer and never collide.

The rule is bound to the **worktree path**, not to the agent — the path is pinned at session-start (below). The question "may I write `brain/`?" reduces to "am I in the coordination worktree?". CC implementing a meta/session brief in the coordination worktree (like Brief 095 itself) edits `brain/` freely; CC in a strand worktree never does.

At the start of any implementation session:

1. Run `git branch --show-current` and `git status --short --branch`.
2. Infer the strand from the current worktree path. CC always derives the strand itself — never ask the maintainer which worktree this is.
3. If the current branch is `main`, detached, a bootstrap branch, or a previously merged task branch, create a fresh task branch from `origin/main` before editing — **unless the whole session is doc-only** (§ Git → "PR policy"), in which case edit and commit on `main` directly, no branch:
   - Product/UI: `codex/product-<short-slug>`
   - Batch/Ingestion: `codex/ingest-batches-<short-slug>`
   - Meta/session-only: `codex/session-<NNN>-<short-slug>` (code-touching meta work only — doc-only meta work needs no branch)
4. Do not branch from an inflight feature branch unless Philipp explicitly says this session continues that exact branch.
5. **Before editing any files, announce the detected worktree, strand, and task-branch in one sentence** (e.g. *"Worktree: `chrono-lexicanum-batches`, Strang: Batch/Ingestion, Branch: `codex/ingest-batches-foo`."*). A wrong-folder mistake becomes visible immediately.
6. **If the task does not match the detected strand** — UI work in the Batches worktree, batch/resolver work in the Product worktree, a Brain/Rollup edit asked for from a strand worktree, or vice versa — **halt and ask back** instead of starting in the wrong place. This is a self-check, not a maintainer question; CC reads the path and decides.

When Philipp says `fertig`, `PR erstellen`, or equivalent (code/data/config work — a doc-only change never reaches this step, see § Git → "PR policy"):

1. Verify the current worktree status.
2. Stage only files changed for the current task in this worktree.
3. Commit on the current task branch.
4. Push with upstream: `git push -u origin <current-branch>`.
5. Create a PR.
6. Do not merge the PR. Philipp merges manually.

When Philipp says `PR ist gemerged, bitte aufraeumen` or equivalent:

1. Verify the PR is actually merged.
2. Verify the worktree is clean.
3. Run `git fetch --prune origin`.
4. Move the worktree back to its agent-neutral bootstrap branch (`worktree/product-bootstrap` or `worktree/batches-bootstrap`) and fast-forward it to `origin/main` when possible.
5. Delete the old local task branch only after verifying the PR was merged or the branch is otherwise preserved.
6. Do not delete worktrees.
7. Do not use `git reset --hard` unless Philipp explicitly authorizes it for that cleanup.

### Migrations

```bash
npm run db:generate        # writes a new SQL file under src/db/migrations/
git add src/db/migrations  # commit the generated SQL with the schema change
npm run db:migrate         # apply to your Supabase
```

### What NOT to do

- Don't add features that aren't in `ROADMAP.md`. New ideas go in the "Ideas Backlog" section first.
- Don't introduce a new dependency without a session-log entry justifying it.
- Don't refactor anything outside the repo (the prototype is local-only and frozen).
- Don't rename or delete files in `src/db/migrations/` after they've been committed. Generate a new migration instead.
- Don't make the dev experience slow. If a change makes `npm run dev` take >5s to hot-reload, it's wrong.

---

## Workflow at a glance

Cowork is the **architect**. Claude Code is the **implementer**. They communicate through `sessions/*.md` files committed to git. Full details in [`brain/wiki/workflows/sessions-format.md`](./brain/wiki/workflows/sessions-format.md).

```
Cowork session  →  writes  →  sessions/YYYY-MM-DD-NNN-arch-*.md  →  git push
                                                                       ↓
                                                                       git pull
                                                                       ↓
Claude Code reads brief  →  implements  →  sessions/...-NNN-impl-*.md  →  git push
                                                                       ↓
                                                                       git pull
                                                                       ↓
Cowork reads report  →  decides next step  →  next architect brief...
```

Either side may surface concerns the other should answer. A blocked session goes back across the line with `status: needs-decision`.
