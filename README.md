# Chrono · Lexicanum

> A fan-made archive of Warhammer 40,000 novels, podcasts and lore paths — by era, faction, world and mood.
> Unofficial. Warhammer 40,000 © Games Workshop. No affiliation.

**Status: pre-launch hardening.** The live preview is currently access-gated while performance, accessibility, SEO and release operations are finished: <https://www.chrono-lexicanum.com/> (canonical host; the `*.vercel.app` deploy URL redirects there at launch). The launch programme itself is tracked in [`docs/launch-master-plan.md`](./docs/launch-master-plan.md).

The archive currently contains:

- **896 books** in a reviewable per-book source-of-truth corpus;
- **1,114 podcast episodes** across four shows;
- **Chronicle** — an event-backed cinematic and index timeline;
- **Cartographer** — a static chart of **1,055 worlds**, 15 hand-curated zones and eight guided Great Journeys;
- **Ask the Archive** — four questions, then ranked recommendations, plus curated faction entry points;
- searchable Archive, Podcasts, Compendium and book/entity detail pages.

Content maintenance is deterministic and human-gated: one JSON file per book, additive podcast deltas, weekly detection/review, and explicit apply/verify commands. The former Wikipedia/Lexicanum/Open Library/Hardcover crawler and LLM enrichment engines are retired.

## For collaborators

Engineering memory, architecture, decisions and open work live under [`brain/`](./brain/CLAUDE.md):

- [current project state](./brain/wiki/project-state.md)
- [active worklist](./brain/wiki/worklist.md)
- [architecture](./brain/wiki/architecture.md)
- [onboarding](./brain/wiki/onboarding.md)
- [implementer workflow](./brain/wiki/workflows/cc-session.md)

Per-work domain detail lives in Postgres and can be mirrored into the external, read-only `chrono-atlas` Obsidian vault with `npm run atlas:regen`.

## License

Code: MIT.

Content and metadata are fan-compiled and reference original copyrighted material. The site is non-commercial and exists for reader guidance.
