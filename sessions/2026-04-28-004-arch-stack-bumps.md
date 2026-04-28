---
session: 2026-04-28-004
role: architect
date: 2026-04-28
status: open
slug: stack-bumps
parent: 2026-04-28-003
links:
  - 2026-04-28-001
  - 2026-04-28-003
commits: []
---

# Stack bumps — Next major + Tailwind major, before Phase 2 starts

## Goal

Move the project to the **current stable major** of Next.js and Tailwind CSS, so Phase 2 (porting prototype CSS and components) starts on the long-term pipeline rather than on the now-superseded majors we shipped Phase 1 on.

## Context

You shipped Phase 1 on **Next 15.x backport** and **Tailwind 3.x** — both deliberate at the time, both noted in your Phase 1 report's "For next session" as candidates for upgrade. Two of the three follow-ups are now live work:

1. Tailwind major bump — **must happen before Phase 2** because Phase 2 starts porting the prototype's ~80 KB of CSS into our pipeline. Doing it on the older major and then migrating mid-port doubles the work.
2. Next major bump — less urgent, but cheap to do in the same sweep. The font-loading and lint advice in Phase 1 already anticipated the next major, so the diff should be small.
3. (`NEXT_PUBLIC_SITE_URL` on Vercel — Philipp will fix that himself in the dashboard, not part of this brief.)

Note the version policy: **the brief does not name versions.** See `docs/agents/CLAUDE_CODE.md` § "Versions are your call — always" and § "Concrete version-research workflow." You research current stable, you pick, you pin, you report.

## Constraints

- Both bumps land in the **same commit pair** (or one commit, your call) so we have one clean before/after diff.
- The bump must NOT change any rendered output. The Hub, the four stub routes, the Aquila SVG must look pixel-identical before and after on `npm run dev`. If you spot something that looks subtly different (font weight rounding, default-color shift), fix the regression in the same commit and call it out.
- Tailwind: pick the **migration path** that matches our current setup (PostCSS-based) rather than rewriting `globals.css` from scratch. The official `@tailwindcss/upgrade` codemod (or the equivalent in the version you choose) is fine as a starting point, but verify every output file by hand — codemods get edge cases wrong.
- Next: if there's a codemod (`npx @next/codemod`), use it for the mechanical parts. Read the upgrade guide for the major you're moving to and act on every applicable item.
- All env handling, all Supabase patterns from Phase 1 (transaction pooler, `prepare: false`, `--env-file`) must keep working — no schema changes, no migration changes.

## Out of scope

- Do NOT start porting prototype CSS or components. That's the next brief. This session is purely an upgrade pass.
- Do NOT migrate the API key naming (legacy `anon`/`service_role` → `publishable`/`secret`). That's a separate small brief later.
- Do NOT touch Drizzle, postgres-js, or @supabase/supabase-js versions unless something in the Next/Tailwind upgrade path actively forces a peer-dep bump. If it does, treat that bump as part of this brief and document.
- Do NOT refactor `src/app/page.tsx` or any component "while you're in there." Touch only what the upgrade requires.
- Do NOT switch from `<link>`-tag font loading to `next/font`. The previous session report noted this as a Phase-2 candidate; not now.

## Acceptance

- [ ] `package.json` shows the new majors of both Next and Tailwind, pinned to specific versions you researched and chose. The session report names them and explains why those (vs. e.g. one minor older).
- [ ] `package-lock.json` regenerated and committed.
- [ ] `npm install` clean — no peer-dependency warnings that didn't exist before.
- [ ] `npm run typecheck` — pass.
- [ ] `npm run lint` — same warning count as before (zero new warnings introduced by the upgrade).
- [ ] `npm run dev` — all 8 routes serve 200, identical-looking output to pre-bump screenshots (do at least Hub + one stub-route comparison).
- [ ] `npm run build` — green. (We didn't run a production build in Phase 1; do it now.)
- [ ] `npm run db:migrate`, `npm run db:seed` — still work end-to-end. Verify a row count probe matches Phase 1 (eras=7, factions=25, …, books=0).
- [ ] Push to `main` — Vercel auto-deploy succeeds.
- [ ] Live URL `https://chrono-lexicanum.vercel.app/` still serves the Hub identically.
- [ ] Implementer report `sessions/2026-04-28-005-impl-stack-bumps.md` committed; this brief flipped to `status: implemented`.

## Open questions for your report

1. **Did Tailwind v4's CSS-pipeline change require any deviation from the codemod's output?** If yes, what — file-by-file. This will inform the next brief (CSS porting) directly.
2. **Did Next 16 require any App Router signature changes** (e.g. async-`params` shape, `searchParams` typing) for our existing stub routes? If yes, list them — we want to know what to expect when we add real routes in Phase 2/3.
3. **Are there any peer-deps now mismatched** (React major, TypeScript, ESLint) that you intentionally did NOT bump? Why not — what would the bump cost.

## Notes

- If Next 16 or Tailwind 4 are *not* yet what you'd consider "ready for production hobby project" (e.g. the latest minor is < 1 month old, there's an open showstopper issue), say so and stay on the previous major. Document that decision and we plan a re-evaluation in 4–6 weeks. Both moves are intent-driven, not ceremony — if they'd hurt the project today, don't do them.
- Phase 2's first brief (CSS port + AnimatedStarfield + polished Hub) will reference the post-bump state. So the better your report's "what changed in CSS pipeline" section, the easier my next brief is to write.
