# Book-reviewer conventions — Facets (Brief 154, B11)

Facets are the **categorical metadata** that powers the "Ask the Archive"
recommender and the filter chips: format, protagonist gender, protagonist class,
POV side, tone, scale, era-feel, and so on. Each facet is a controlled
`facet_values.id` belonging to a category. **An empty correction list is the
right answer when the facets are correct.**

> **Facet findings are NOTES ONLY.** They land in `facet-review-queue.json`,
> which has **no apply path** — no script reads it into the DB. They never reach
> the visitor UI automatically. You are leaving the maintainer a note, not
> changing data. This is deliberate (Brief 149/150): facets cannot route through
> the overlay.

## The two finding kinds

- **add** — a facet the book clearly warrants that is **missing** (reference the
  facet `id`, e.g. `inquisitor`, `male`, `grimdark`). Use ids from the book's
  current facet list or the facet catalog vocabulary.
- **remove** — a current facet `id` that is **wrong** for the book.

Each facet finding needs a one-sentence `rationale` and a `confidence` in [0,1].

## What makes a correct facet

- **protagonist_gender / protagonist_class** describe the *principal* viewpoint
  character(s), not every character present. A single-POV inquisitor novel is
  `inquisitor` + the POV's gender — not every class that appears.
- **format** is the medium (book, audiobook, audio_drama …) — usually already
  correct from the roster; rarely a review target.
- **pov_side / tone / scale** describe the dominant framing, not every angle.

## Do NOT flag

- **Over-faceting.** Do not add every class/faction that appears — facets are
  about the book's *center of gravity*, like roles.
- **Headcanon.** If the synopsis does not support the facet, do not propose it.

## Content warnings — special care

Content-warning facets (category `content_warning`, the `cw_*` values) are
**retired from the visitor UI** (Brief 149/150) and have **no path back**. You
may *note* a content-warning correction for the maintainer's records, but:

- Frame it explicitly as an archival note, never as "should be shown".
- Never imply this file will surface a content warning — it will not.
- When in doubt about a `cw_*` facet, **refute / omit**; the signal that matters
  for B11 is the **visible**, Ask-relevant facets.

## Verifier stance

Confirm a facet finding only when the synopsis + current data clearly support it.
A "plausible" facet is a **refute**. For `cw_*` facets, hold an even higher bar —
these are noise for the recommender's purposes and must not crowd the signal.
