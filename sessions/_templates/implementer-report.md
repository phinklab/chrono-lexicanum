---
session: YYYY-MM-DD-NNN
role: implementer
date: YYYY-MM-DD
status: complete         # complete | needs-decision | partial
slug: same-as-brief
parent: YYYY-MM-DD-NNN   # the brief id this responds to
links: []
commits:
  - <git-sha>
  - <git-sha>
---

# <Title — match the brief's title>

## Summary

<Two sentences: what shipped, and the one fact Cowork most needs to know.>

## What I did

- `path/to/file.ts` — what changed and why in one line
- `path/to/other.tsx` — …
- `src/db/migrations/0002_xxx.sql` — generated migration for <change>

## Decisions I made

<The most important section. Every place you departed from the brief, every nontrivial library/version pick, every "I almost did X but did Y because…" call.>

- **Picked X over Y** because <reason>.
- **Used version A.B.C** because it's the current stable that supports <feature>.
- **Did not implement Z** because <reason>; logged it in "For next session."

## Verification

<What you ran. Be explicit. If you didn't run it, say so.>

- `npm run lint` — pass
- `tsc --noEmit` — pass
- `npm run dev` — opened http://localhost:3000, navigated to /timeline, rendered as expected (screenshot omitted)
- `npm run db:migrate` — applied migration `0002_xxx`, verified in Drizzle Studio
- Manual: <thing checked by hand>

## Open issues / blockers

<Anything that didn't get done and why. If `status: needs-decision`, this is where the question goes.>

## For next session

Suggestions for the next architect brief. Things you noticed but didn't fix because they were out of scope:

- <Idea / observation>
- <Smaller follow-up>

## References

<Links you used while implementing — current docs for the libraries you picked, GitHub issues, etc.>
