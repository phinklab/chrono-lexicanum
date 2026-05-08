# Chrono · Lexicanum

> A fan-made archive of Warhammer 40,000 novels — by era, faction, world, and mood.
> Unofficial. Warhammer 40,000 © Games Workshop. No affiliation.

**Status: Phase 3 — Ingestion pipeline (TypeScript, dry-run).** 26 hand-curated books live in the database; the pipeline crawls Wikipedia + Lexicanum + Open Library + Hardcover and enriches with an LLM (Anthropic Haiku) — apply-to-DB is the next step. **Live:** <https://chrono-lexicanum.vercel.app/>

Three tools, one archive:

- **Chronicle** — interactive in-universe timeline of the novels, from the Great Crusade to the Indomitus Era.
- **Cartographer** — galaxy map with sectors, worlds, and book-pins, filterable by year.
- **Ask the Archive** — five questions, then ranked recommendations for your next read.

## For collaborators

Engineering memory, dev workflow, architecture, roadmap, decisions and open questions live under [`brain/`](./brain/CLAUDE.md) — start there.

- New to the repo? → [`brain/wiki/onboarding.md`](./brain/wiki/onboarding.md)
- Need orientation? → [`brain/wiki/project-state.md`](./brain/wiki/project-state.md) + [`brain/wiki/index.md`](./brain/wiki/index.md)
- Working with Cowork (architect) or Claude Code (implementer)? → [`brain/wiki/workflows/cowork-session.md`](./brain/wiki/workflows/cowork-session.md), [`brain/wiki/workflows/cc-session.md`](./brain/wiki/workflows/cc-session.md)

The book domain (entity data: ~800 novels with synopses, factions, characters, sources) lives in an external Obsidian vault, [`chrono-atlas/`](./brain/wiki/workflows/atlas-regen.md) — outside this repo. Generate or refresh it with `npm run atlas:regen`.

## License

Code: MIT.
Content (synopses, curated metadata) is fan-compiled and references original copyrighted material. The site exists for non-commercial reader guidance only.
