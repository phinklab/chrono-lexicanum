# Chrono · Lexicanum

> A fan-made archive of Warhammer 40,000 novels — by era, faction, world, and mood.
> Unofficial. Warhammer 40,000 © Games Workshop. No affiliation.

Three tools, one archive:

- **Chronicle** — interactive in-universe timeline of the novels, from the Great Crusade to the Indomitus Era.
- **Cartographer** — galaxy map with sectors, worlds, and book-pins, filterable by year.
- **Ask the Archive** — five questions, then ranked recommendations for your next read.

---

## Local development

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env.local
# Fill in DATABASE_URL and Supabase keys (see ONBOARDING.md)

# 3. Migrate the database (against your Supabase project)
npm run db:generate
npm run db:migrate

# 4. Seed with the canon reference structure (eras, factions, series, sectors, locations).
# Books are intentionally empty in v1 — they arrive in Phase 4 via the ingestion pipeline.
npm run db:seed

# 5. Run
npm run dev
# → http://localhost:3000
```

If you're starting from scratch (no Supabase project, no GitHub repo, no Vercel deploy), follow `ONBOARDING.md` end-to-end.

---

## Project layout

See `CLAUDE.md` for the full repository map and conventions. Quick orientation:

```
src/app/        → Next.js App Router pages
src/components/ → React components (TSX)
src/db/         → Drizzle schema, client, migrations
scripts/        → one-off scripts (seed, ingestion glue)
archive/        → original HTML prototype (LOCAL ONLY — gitignored, kept on your disk for reference)
```

## Working with AI on this project

This codebase is built collaboratively with Claude. Two modes:

- **Cowork** (desktop app) for planning, design, data modeling.
- **Claude Code** (CLI in your terminal) for implementation work.

Both read `CLAUDE.md` first. See it for stack, conventions, and the per-session workflow.

## Roadmap

See `ROADMAP.md` for the phased plan (Phase 1 = scaffold, Phase 2 = port the three tools, Phase 3 = book detail pages, Phase 4 = ingestion pipeline, Phase 5 = community submissions).

## License

Code: MIT.
Content (synopses, curated metadata) is fan-compiled and references original copyrighted material. The site exists for non-commercial reader guidance only.
