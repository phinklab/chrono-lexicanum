---
title: Deferred questions (dormant)
type: overview
created: 2026-05-09
updated: 2026-07-24
sources:
  - ../../sessions/2026-07-24-265-impl-dependabot-endspurt.md
  - ../../sessions/2026-07-10-193-impl-brain-launch-rollup.md
  - ../../sessions/2026-07-08-187-impl-artwork-footer-mobile-i18n.md
  - ../../sessions/2026-07-03-180-impl-ci-test-gate-wartung.md
  - ../../sessions/archive/2026-06/2026-06-20-163-arch-timed-preview-access.md
  - ../../sessions/archive/2026-06/2026-06-10-137-impl-timeline-data-foundation.md
related:
  - ./open-questions.md
  - ./worklist.md
  - ./roadmap.md
confidence: high
---

# Deferred questions

> Real work whose trigger has not fired or which is intentionally post-launch. Items promoted into the active launch programme are removed from this page; their history remains in git and [`log.md`](./log.md).

## Preview machinery removal (post-launch PL1)

**Owner:** Product + a separate migration task. **Trigger:** public launch is stable and Philipp gives explicit removal approval.

The preview gate is temporary. Launch day first sets `PREVIEW_GATE=off` and performs the new production deploy/live crawl. A later PL1 removes, rather than merely disables:

- preview branching in `src/proxy.ts` (not the Basic-Auth admin block), login/invite UI and signing/acceptance endpoints;
- local invite console/scripts;
- `preview_invite_activations` data/table via its own migration and associated grants;
- `PREVIEW_*` variables and now-obsolete privacy copy.

The Product cleanup and destructive schema/data migration must be separate strand-pure PRs.

Launch configuration that must be evidenced before gate-off:

1. production preview credentials have high-entropy overrides;
2. Vercel Deployment Protection is enabled for previews;
3. Supabase Data API/RLS exposure is explicitly checked;
4. canonical host variable is correct. Today the app uses `NEXT_PUBLIC_SITE_URL`; the launch programme plans to replace it with server-only `SITE_URL`, so the readiness check must use whichever contract has actually merged;
5. rollback target and gate-on recovery path are recorded before the flip.

## Legal/site internationalisation

**Owner:** future Product brief. **Trigger:** Philipp chooses to publish German/Russian UI or wants legal pages bilingual before launch.

Session 187 researched but did not implement i18n. Recommended first step: `next-intl` without locale routing, English default from a cookie, EN/DE legal content components and dynamic `lang`. Later site-wide EN/DE/RU can migrate to locale subpaths with `localePrefix: 'as-needed'`. UI strings stay in files; translated domain content would use sidecar translation tables rather than JSONB-per-field or language columns.

## Atlas event pages (former OQ 16c)

**Owner:** future Atlas brief. **Trigger:** Atlas is next extended or event browsing becomes an editorial need.

Timeline events are first-class curated entities, but `atlas:regen` does not yet emit one page per event or Era event indexes. This is not a launch blocker.

## Post-launch code splitting and asset pass

**Owner:** Product. **Trigger:** after launch, or earlier only if measured bundle/interaction cost breaches a budget.

The launch programme reserves a post-launch pass for the MediaPlayer advanced UI, route chrome, hidden-document map motion and asset/cache cleanup. `CinematicView` and Podcast Archive are further candidates only after measurement. Do not add a generic splitting framework.

## Secondary Era visibility

**Owner:** future Timeline/content brief. **Trigger:** a concrete UI needs one work visible in more than one Era.

Cross-millennium works may need secondary Era membership. The current schema has one nullable `primary_era_id`; no `secondary_era_ids` field exists. Revisit together with count semantics and duplicate visibility in Chronicle/Archive, not as a schema-only patch.

## Legacy Timeline redirect mechanism

**Owner:** future Product brief. **Trigger:** direct legacy-link flashes become user-visible or a crawl flags them.

Some streamed `redirect()` paths can emit a meta refresh after the loading shell instead of an immediate HTTP redirect. Moving the mapping into request middleware/proxy would avoid the flash but adds request-path complexity. Internal navigation is unaffected; leave until measured pain.

## Dependency major bumps

**Owner:** maintenance triggers, no standing brief.

- **ESLint 10:** remain on ESLint 9 until the Next-bundled plugins support ESLint 10 and the Dependabot PR's lint job is green. Plain-close incompatible PRs; do not issue a permanent ignore. Applied 2026-07-24 to PR #272 (ESLint 10.7 hard-crashes; `eslint-config-next` plugins peer-pin `eslint ^9`); the next green-lint ESLint-10 PR is the re-evaluation trigger.
- **Freeze note:** until launch a general dependency freeze holds (Session 265, 2026-07-24) — only critical security fixes land; all other Dependabot PRs wait or get closed.
- **Node types:** keep `@types/node` aligned with the actual Node 22 runtime. Upgrade runtime, `.nvmrc`, `engines`, Vercel setting and types together (next sensible target: an active LTS), never types alone.

## Promoted out of deferred on 2026-07-10

- `primaryEraId` truth → launch S0/S1a and [`open-questions.md`](./open-questions.md).
- `cachedRead` cross-request coalescing + hot-path error semantics → launch loader/cache session.
- Focus visibility, reduced motion, touch targets and Map/Chronicle accessibility → mandatory pre-gate launch sessions.

Historical V1/V2 crawler/LLM tuning questions were pruned: Brief 177 physically removed those engines, so their old triggers can no longer fire without an explicit rebuild from git history.
