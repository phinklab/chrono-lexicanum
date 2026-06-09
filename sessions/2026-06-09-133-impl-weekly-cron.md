---
session: 2026-06-09-133
role: implementer
date: 2026-06-09
status: complete         # PR2 (weekly cron + rolling PR) — completes Brief 133 acceptance 5
slug: weekly-cron
parent: 2026-06-09-133
links:
  - 2026-06-09-133        # arch brief + PR1 impl (detection + book-promotion)
commits: []              # filled by the PR; this report rides inside the PR2 code branch
---

# Weekly content refresh — PR2: the weekly cron + rolling PR

## Summary

Shipped the **automation** half of Brief 133 (acceptance 5): a weekly GitHub-Action cron
that runs the detection pass unattended and maintains **one rolling pull request** with the
proposal. PR1 (detection + report + proposal + book-promotion merge) is merged on `main`;
this PR2 wires it to a schedule. Two changes, both `.github`/config — **no code path
touched**, so the detection behaviour proven in PR1 is unchanged:

- `package.json` — a CI sibling script `refresh:check:ci` (= `refresh:check` **minus**
  `--env-file=.env.local`, since CI has no `.env.local`).
- `.github/workflows/weekly-refresh.yml` — the cron (`on: schedule` Mondays 06:00 UTC +
  `workflow_dispatch`), the REFRESH_RESULT parse, and the rolling-PR / close-on-no-op wiring
  via `peter-evans/create-pull-request@v8`.

**Detection-only, by construction.** The workflow has no Anthropic or Supabase secret and
never writes the DB; `YOUTUBE_API_KEY` is the only (optional) secret. Promotion stays
conversational/maintainer-driven (no CI auto-apply — PR1 open-question #5).

## What I did

- **`package.json`:** added `"refresh:check:ci": "tsx scripts/refresh-check.ts"` right after
  `refresh:check`. The only difference from `refresh:check` is dropping `--env-file=.env.local`
  — tsx then loads no dotenv, exactly matching CI. The script reads only `process.env.YOUTUBE_API_KEY`
  (optional); it imports neither the DB client nor an LLM SDK (PR1's pure-detection design), so
  it runs green with **zero** secrets.
- **`.github/workflows/weekly-refresh.yml`:**
  - `on: schedule: cron "0 6 * * 1"` (Mondays 06:00 UTC) + `workflow_dispatch` (manual button).
  - `permissions: contents: write, pull-requests: write` (job-scoped; the create-PR action and
    the close step both run on the default `GITHUB_TOKEN`).
  - `concurrency: { group: weekly-refresh, cancel-in-progress: false }` so a manual dispatch
    queues behind a running scheduled run rather than racing it on the shared rolling branch.
  - Steps: `actions/checkout@v6` → `actions/setup-node@v6` (Node 22, `cache: npm`) → `npm ci`
    → **Run detection pass** → conditional PR open/close.
  - **Run detection pass** captures the script's stdout, reads the final `REFRESH_RESULT=` line,
    and sets step outputs. `findings` → `true`/`false`; on findings it also parses `books=`,
    `episodes=`, and the absolute `path=`, derives the repo-relative `report_path`
    (`ingest/refresh/<week>/report.md`) and a human `pr_title`. A run that emits **no**
    `REFRESH_RESULT` line, or exits non-zero (the script's exit-1 = genuine bug), fails the step
    loudly — `set -euo pipefail` + a command-substitution capture propagate the exit code.
  - **Findings →** `peter-evans/create-pull-request@v8` on the **fixed** branch
    `automation/weekly-refresh` (base `main`), `add-paths: ingest/refresh/**` (the hard
    guardrail — nothing outside that tree can ever be committed), `body-path` = the generated
    `report.md`, `title` = the parsed counts, `delete-branch: false`.
  - **No findings →** `gh pr list --head automation/weekly-refresh --state open` and, only if a
    PR exists, `gh pr close --delete-branch` with an explanatory comment. A no-op week with no
    open PR is a clean no-op.

## Decisions I made

- **Action versions — current stable majors, pinned (Version-Policy).** Researched the live
  latest via the GitHub API (not memory): `peter-evans/create-pull-request` **v8.1.1**
  (2026-04-10; the brief's "v7-era" is superseded — v8 is the Node-24 line),
  `actions/checkout` **v6.0.3** (2026-06-02), `actions/setup-node` **v6.4.0** (2026-04-20).
  Pinned to the **major tag** (`@v8`/`@v6`/`@v6`) to match the repo's existing
  `.github/workflows/ci.yml` convention (it uses major tags, not SHAs) while staying on the
  current line. setup-node v6's "caching limited to npm" change is a non-issue (we use
  `cache: npm`); checkout v6 needs only a current GitHub-hosted runner.
  - **Note / candidate follow-up:** `ci.yml` still pins `actions/checkout@v4` +
    `actions/setup-node@v4`. I deliberately did **not** bump it here (out of scope for "the
    weekly cron", and it's a separate code PR). The repo now has a v4/v6 split across the two
    workflow files — a one-line follow-up can align `ci.yml` if cross-file consistency is wanted.
- **Rolling PR on a fixed branch (PR1 open-question #4, recommended → built).** One long-lived
  `automation/weekly-refresh` branch + PR, updated in place each week; a no-op week closes it.
  One PR to watch beats weekly triage-and-close.
- **PR body = the generated `report.md` verbatim** (`body-path`), per the brief. The report
  already carries the "detection only — nothing written to the DB" banner and the Promote
  section, so the maintainer context lives in one place (no duplicated preamble to drift).
- **`add-paths: ingest/refresh/**` is the guardrail, not a convenience.** Even though the
  script only ever writes under `ingest/refresh/`, constraining the commit means a future bug
  (or an unrelated dirty file) can never push the roster, the Excel SSOT, `brain/`, or `src/`
  onto the automation branch.
- **No `labels:` input.** create-pull-request does not create labels; a missing `automation`
  label could noise/err on the first run. The fixed branch already gives the rolling PR a stable
  identity, so I dropped the label rather than add a repo-setup precondition. (Easy to re-add
  once an `automation` label exists.)
- **Capture-then-parse, not a temp file.** The detect step uses `out="$(npm run --silent
  refresh:check:ci)"` so stderr health streams live to the log while stdout is parsed for the
  contract — no stray file in the workspace for `add-paths` to worry about.

## Verification

- **CI smoke — `npm run refresh:check:ci` with `YOUTUBE_API_KEY`/`ANTHROPIC_API_KEY`/`DATABASE_URL`
  explicitly unset** (faithfully simulates CI without secrets): runs clean, books
  `ok — 61 new, 15 review`, podcasts the-40k-lorecast 1 / adeptus 0 / lorehammer 1 (40
  "(Video)" title-excluded), and **luetin09 (YouTube) fail-soft `skipped — "no YOUTUBE_API_KEY
  in env"`**. Final line `REFRESH_RESULT=findings books=61 episodes=2 path=…/ingest/refresh/2026-W24`
  (episodes=2 here because YouTube is keyless; a CI run **with** the secret yields the PR1
  count of 3). No `.env.local` was loaded — confirms the `--env-file`-free script.
- **`npm run typecheck`** (tsc strict) — pass. **`npm run lint`** (eslint) — pass. (Neither is
  affected by a YAML file or an added npm script, but both confirm nothing regressed.)
- **YAML sanity** — parsed the workflow with a YAML 1.2 parser: `on` = {schedule,
  workflow_dispatch}, cron `0 6 * * 1`, permissions contents/PR write, 6 named steps, the three
  pinned actions resolve. (No `actionlint` binary available on this host; verified structurally.)
- **`create-pull-request@v8` input names** — checked every `with:` key against the v8
  `action.yml`: `base`, `branch`, `add-paths`, `commit-message`, `title`, `body-path`,
  `delete-branch` all exist (a mistyped `with:` key fails silently, so this matters).
- Local smoke artifact (`ingest/refresh/2026-W24/`) removed — not part of this PR (PR1's
  decision: the cron produces the real weekly outputs). The pre-existing untracked
  `ingest/podcasts/luetin09-full.json` is left alone (not mine, not staged).

## Open issues / known limitations

None blocking. Operational notes:

- **Repo prerequisite (cannot be set from code):** Settings → Actions → General → Workflow
  permissions → **"Allow GitHub Actions to create and approve pull requests"** must be **ON**,
  or create-pull-request returns 403. Documented in the workflow header. **First validation
  after merge** should be a manual `workflow_dispatch` run (the workflow has no `pull_request`
  trigger, so a PR won't exercise it) — confirm it opens the rolling PR end-to-end.
- **Optional `YOUTUBE_API_KEY` secret.** Absent → luetin09 (the one YouTube show) skips
  fail-soft and its new episode is not surfaced. Add the repo secret if YouTube coverage in the
  weekly run is wanted; the workflow already passes it through `env:`.
- **A total-source-outage week reads as a no-op → closes the rolling PR** (self-healing: it
  reopens next week when sources return). The script's contract is `noop` for "no findings"
  regardless of cause; distinguishing an all-unreachable week (`REFRESH_RESULT=unreachable`,
  skip the close) is a small PR1-script follow-up if the false-close ever bites. Partial
  outages are already safe (per-source fail-soft surfaces the reachable side).
- **Mild weekly churn on the rolling PR.** The output dir is week-keyed (`ingest/refresh/<week>/`)
  and `report.md` carries a generated-at timestamp, so even an unchanged backlog produces a new
  commit each week (the timestamp-free `proposal.json` only prevents *intra-week* thrash). This
  is cosmetic — the PR always shows the current week's proposal; correctness (findings ⇒ open
  PR, no-op ⇒ closed PR) holds regardless. Pinning a fixed CI output dir is a possible
  tightening if the weekly commit ever feels noisy.

## Rollup facts for Cowork (I can't touch `brain/**` from the Batches strand)

- **Board 122-B10 ("Weekly content refresh") — PR2 (weekly cron + rolling PR) done → Brief 133
  is now fully implemented** (all 8 acceptance criteria; the arch brief's `status` is flipped
  `open → implemented` inside this PR). PR1 = detection + book-promotion merge (merged);
  PR2 = this automation.
- **New surface:** `.github/workflows/weekly-refresh.yml` (weekly cron + `workflow_dispatch`) +
  npm `refresh:check:ci`. Rolling PR identity = the fixed branch `automation/weekly-refresh`.
  Detection-only: no DB write, no LLM/Supabase secret; `YOUTUBE_API_KEY` optional.
- **One repo setting is a hard prerequisite** for the automation to function: "Allow GitHub
  Actions to create and approve pull requests" must be ON (Brief 133 / PR1 report already
  flagged this).
- **Curation model unchanged (decided 2026-06-09):** the cron is a *notifier*. Promotion
  (book-extension merge / `apply:podcast`) stays maintainer-driven; the DB write remains the
  quality boundary (`why-bulk-backfill.md`). No CI auto-apply was built, behind a flag or
  otherwise (PR1 open-question #5).

## Acceptance (Brief 133)

- [x] **1–4, 6, 8** — satisfied by PR1 (detection, Carnage Unending, no false-positive on the
  859, podcast per-show diff, fail-soft, smoke test) — unchanged.
- [x] **5 — weekly GitHub-Action cron runs detection unattended and opens/updates ONE rolling
  PR; a week with no additions opens no PR.** Built here: `on: schedule` weekly +
  `create-pull-request` on the fixed `automation/weekly-refresh` branch; no-op week closes it.
- [x] **7** — the promote path (roster-extension → `import:ssot-roster` → curate →
  `apply-override`; podcasts → `apply:podcast`) is documented in the runbook (PR1) and echoed
  in every generated `report.md`'s Promote section.

## References

- Arch brief + PR1 impl: `sessions/2026-06-09-133-{arch,impl}-weekly-content-refresh.md`.
- Runbook (PR2 sketch + REFRESH_RESULT contract): `scripts/runbooks/weekly-refresh-runbook.md`.
- Action versions verified via `gh api repos/<owner>/<repo>/releases/latest` (2026-06-09):
  create-pull-request v8.1.1, checkout v6.0.3, setup-node v6.4.0.
