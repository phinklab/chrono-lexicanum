# Book-reviewer conventions — Junctions: Locations + Characters (Brief 154, B11)

"Junctions" = the **locations** and **characters** edges the curation overlay
can hold. (Series/event junctions are out of scope — do not propose them.) Same
philosophy as the faction conventions: **an empty correction list is the right
answer when the data is correct.** Precision over recall — the queue is precious.

## Locations

A `work_locations` edge says a place is a **meaningful setting** of the book.
Three roles, only these:

- **primary** — a principal setting (where much of the story happens).
- **secondary** — a real but lesser setting.
- **mentioned** — named and visited/relevant, but minor.

### Finding kinds
- **add** — a missing setting, as a **surface form** ("Cadia", "Eye of Terror",
  "Macragge"). The driver resolves it.
- **remove** — a current location `id` that is not actually a setting.
- **roleFix** — right place, wrong role (a `mentioned` that is clearly the
  book's `primary` setting, or vice versa).

### Do NOT flag (locations)
- **Umbrella / non-place tags.** `Imperium`, `Chaos`, a Segmentum-wide label, or
  a faction name are **not locations**. They resolve to nothing and are
  deliberately skipped — never "add" them as a location.
- **Every planet named once.** A world mentioned in passing is not a setting.
- **Galaxy-wide framing.** "Set across the Imperium" is not a location edge.

## Characters

A `work_characters` edge says a named individual **appears or is a viewpoint** in
the book. Three roles, only these:

- **pov** — a point-of-view / narrator character.
- **appears** — on-stage in the book.
- **mentioned** — named/relevant but not on-stage.

### Finding kinds
- **add** — a missing character, as a **surface form** ("Gregor Eisenhorn",
  "Konrad Curze"). The driver resolves it.
- **remove** — a current character `id` who does not actually appear.
- **roleFix** — right character, wrong role (an `appears` who is really the
  book's `pov`, or a `mentioned` who is on-stage).

### Do NOT flag (characters)
- **Factions/titles as characters.** "The Inquisition", "the Night Lords" are
  not characters. A rank without a name ("a commissar") is not a character.
- **Name-drops.** A historical figure invoked in dialogue but never present is
  at most `mentioned`, often nothing.
- **Headcanon casting.** If the synopsis + current data do not support the
  character being in *this* book, do not add them.

## Verifier stance

Confirm a junction finding only when the synopsis or current data clearly
supports the place being a setting / the character appearing **in this book**,
at the proposed role. "Could be in it" → **refute** with a reason. Distinguish
*surface-form drift* (same entity, different spelling — fine to resolve) from a
genuinely different entity (refute).
