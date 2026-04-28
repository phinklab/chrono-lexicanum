---
session: YYYY-MM-DD-NNN
role: architect
date: YYYY-MM-DD
status: open
slug: short-kebab-case
parent: null            # set to prior session id if this responds to one
links: []               # other session ids this references
commits: []             # implementer fills in their commit hashes when responding
---

# <Title — same words as slug, expanded>

## Goal

<One sentence stating what this session should achieve. Then a short paragraph if needed for context.>

## Context

<What's true today that the implementer needs to know. Reference the previous session(s) by id. Link to relevant files.>

## Constraints

- <Hard rule — must hold in the resulting code>
- <Another constraint>

## Out of scope

- <Things the implementer should explicitly NOT touch in this session, even if tempted>

## Acceptance

The session is done when:

- [ ] <Concrete, checkable bullet>
- [ ] <Another one>
- [ ] <Verify command runs green: `npm run lint`, `tsc --noEmit`, etc.>

## Open questions

<Things you'd like the implementer to weigh in on in their report. Not blockers — inputs you'd value for the next architect session.>

- <Question>

## Notes

<Anything else: design sketches, links to references, snippets that illustrate the desired shape (NOT full implementations).>
