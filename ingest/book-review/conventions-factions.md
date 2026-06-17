# Book-reviewer conventions — Factions (Brief 154, B11)

The committed, human-readable semantics a FINDER and a VERIFIER subsession read
before reviewing a book's **faction** edges. Tuned to keep the false-positive
rate low: **the queue is precious; an empty correction list is the correct
answer when the data is right.** Propose a change only when the current data is
clearly wrong, not merely improvable.

## What a faction edge means

A `work_factions` edge says "this faction is a *substantial presence* in the
book." It is not a trivia index. Three roles, and only these three:

- **primary** — a faction the book is centrally about (its protagonists' or
  antagonists' organisation; the lens the story is told through).
- **supporting** — present and significant, but not the book's center.
- **antagonist** — the main opposing force.

A book legitimately carries **several** factions (e.g. an Inquisition novel:
`inquisition` primary, a Chapter supporting, a Chaos cult antagonist). Multiple
factions is **normal — do not flag it as over-tagging** unless a listed faction
genuinely has no presence in the book.

## The three finding kinds

- **add** — a faction the book substantially features that is **missing**. Emit
  the **surface form** (the name a lore reader writes: "Ordo Malleus", "Word
  Bearers", "Astra Militarum"), never an id. The driver resolves it through the
  alias index; an unresolvable name is carried as an `__unresolved__` proposal,
  so a plausible name is better than silence — but still must be a *real,
  substantial* presence.
- **remove** — a current edge (reference its canonical `id` from the book data)
  that does **not** belong: the faction is absent, or only namechecked in
  passing. A removal must justify itself in the rationale.
- **roleFix** — the edge belongs but the **role is wrong** (e.g. a faction
  tagged `supporting` that is really the book's `primary`). Give the `id`, the
  `currentRole` you see, and the `proposedRole`.

## Do NOT flag (these are intentional, not errors)

- **Grand-alignment umbrellas.** `Imperium`, `Chaos`, `Xenos` as faction tags
  are deliberately suppressed when a more specific alignment-peer is present
  (e.g. a book with `space_wolves` does not also carry `imperium`). If you see a
  Chapter/Legion present but no umbrella, that is **correct** — do not "add"
  `Imperium`/`Chaos`.
- **Passing mentions.** A faction named once in a flashback or a list is not an
  edge. "Substantial presence" is the bar.
- **Sub-faction vs parent both present.** A book can carry both a Chapter and
  its broader body when both genuinely feature; do not collapse them on a hunch.
- **Your own headcanon.** Review against the book's **synopsis + current data**,
  not lore you remember from elsewhere. If the synopsis does not support it,
  refute it.

## Verifier stance

You are an independent skeptic. Confirm a faction finding only if the synopsis
or the current data clearly supports it. A finding that is merely *plausible* is
a **refute** — say why. The cost of a wrong queue entry (a maintainer must read
and reject it) is higher than the cost of a missed subtle edge.
