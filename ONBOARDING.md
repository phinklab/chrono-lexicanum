# Onboarding — first-time setup

> Follow this once. After that, daily work is `git pull && npm run dev`.

You'll set up four things, in this order:

1. Local install (Node, npm, the repo)
2. GitHub repo (push the code)
3. Supabase project (database)
4. Vercel deploy (live URL)

Total time: ~30 minutes.

---

## 1. Local install

You need **Node.js 22 or newer** and **git**. Check what you have:

```bash
node --version
npm --version
git --version
```

If Node is missing or older than 22, install from <https://nodejs.org> (LTS).

In the project folder (`C:\Users\Phil\Warhammer Projekt`):

```bash
# Initialize git (if not already)
git init -b main
git add .
git commit -m "Phase 1: scaffold Next.js + Drizzle + Supabase"

# Install dependencies (this is the slow part — ~2 minutes)
npm install
```

You should now have a `node_modules/` folder and a `package-lock.json`. **Commit the lockfile** (it's important for reproducible installs):

```bash
git add package-lock.json
git commit -m "Add package-lock.json"
```

---

## 2. GitHub repo

1. Go to <https://github.com/new>
2. Repository name: `chrono-lexicanum` (or whatever you like)
3. Visibility: **Public** (required for free Vercel) or Private (works on Vercel's free tier too, but Public is cleaner for a fan project)
4. Do **not** add a README, .gitignore, or license — we already have those
5. Click **Create repository**

GitHub will show a "push an existing repository" snippet. Run it locally:

```bash
git remote add origin git@github.com:<your-username>/chrono-lexicanum.git
git branch -M main
git push -u origin main
```

If `git@github.com:...` complains about SSH keys, use HTTPS instead:
```bash
git remote add origin https://github.com/<your-username>/chrono-lexicanum.git
git push -u origin main
# (you'll be prompted for credentials — use a Personal Access Token, not your password)
```

To create a token: GitHub → Settings (top-right) → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic) → scope `repo`.

---

## 3. Supabase project

1. Go to <https://supabase.com> and sign up (GitHub login works fine).
2. Click **New project**.
   - Name: `chrono-lexicanum`
   - Database Password: **generate a strong one and save it in your password manager** (you'll need it once)
   - Region: pick closest to you (e.g. `eu-central-1` Frankfurt for Germany)
   - Pricing plan: **Free**
3. Wait ~2 minutes while Supabase provisions the project.
4. In the project, go to **Settings → Database → Connection string** (URI tab).
   - **Use the "Transaction pooler"** URL (port 6543), NOT the "Direct connection" URL.
   - Reason: Supabase's free tier dropped IPv4 from the direct hostname (`db.<ref>.supabase.co`) in 2024. Most home/office networks don't have IPv6, so direct doesn't reach. The pooler hostname (`aws-1-eu-central-1.pooler.supabase.com` or similar) has IPv4 records and works for both runtime *and* migrations.
   - It looks like: `postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres`
   - Replace `[YOUR-PASSWORD]` with the password you generated in step 2. URL-encode any special characters (`*` → `%2A`, `,` → `%2C`, `!` → `%21`, etc.) so postgres-js parses the URI correctly.
5. Go to **Settings → API**.
   - Copy `Project URL` (e.g. `https://xxxxxxxxxxxx.supabase.co`)
   - Copy `anon public` key (long JWT string)
   - Copy `service_role` key (also a JWT — keep this **secret**)

Now create your local env file:

```bash
cp .env.example .env.local
```

Open `.env.local` in your editor and paste in the four values:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD_HERE@db.xxxxxxxxxxxx.supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Generate the first migration and apply it:

```bash
npm run db:generate    # creates src/db/migrations/0000_*.sql
npm run db:migrate     # applies it to Supabase
```

You can verify in the Supabase dashboard → **Table Editor**: you should see `books`, `factions`, `eras`, etc.

Now seed with the canon reference structure (eras, factions, sectors, locations, series):

```bash
npm run db:seed
```

You should see something like `Done. Inserted 0 books.` — that's expected. Books are intentionally empty in v1; they'll be populated in Phase 4 by the ingestion pipeline. The reference tables ARE populated — verify in Drizzle Studio (`npm run db:studio`) that `eras`, `factions`, `sectors`, `locations` have rows.

Commit the migration:

```bash
git add src/db/migrations
git commit -m "Initial migration: schema v1"
git push
```

---

## 4. Run locally

```bash
npm run dev
# open http://localhost:3000
```

You should see the Hub page with the Aquila and three doorways.
If you see errors:
- "DATABASE_URL is not set" → check `.env.local` exists and has the right values
- "relation does not exist" → re-run `npm run db:migrate`
- Anything else → ask Claude Code in your terminal: `claude` and paste the error

---

## 5. Vercel deploy

1. Go to <https://vercel.com> and sign up with GitHub.
2. Click **Add New… → Project**.
3. Find your `chrono-lexicanum` repo and click **Import**.
4. **Framework Preset**: Vercel auto-detects Next.js. Leave defaults.
5. **Environment Variables**: paste the same four (or five) vars from `.env.local`.
   - For the production deploy, change `NEXT_PUBLIC_SITE_URL` to the URL Vercel will give you (you'll get something like `chrono-lexicanum.vercel.app`).
6. Click **Deploy**. Wait ~2 minutes.

Your site is live. Vercel will redeploy automatically on every push to `main`, and create preview URLs for every other branch / PR.

---

## Daily workflow after this

```bash
git pull                  # get latest
npm run dev               # start dev server
# ... work ...
git add . && git commit -m "..." && git push
# Vercel auto-deploys
```

When you change the schema:
```bash
# Edit src/db/schema.ts
npm run db:generate       # generates new migration SQL
npm run db:migrate        # applies to your local Supabase
git add src/db/schema.ts src/db/migrations
git commit -m "Schema: <what changed>"
git push
# Vercel runs the migration during the build (see "Operations" below);
# no manual production step is needed.
```

---

## Operations

Background guarantees the project relies on. If one of them is red, here's where to look.

### CI

Every pull request and push to `main` triggers `.github/workflows/ci.yml`, which runs `npm run lint` and `npm run typecheck` on Ubuntu / Node 22. The job is named `lint-and-typecheck`; the GitHub status check that appears on PRs is **`ci / lint-and-typecheck`** — use that name in branch-protection rules if you set them up.

CI does NOT run `next build` (Vercel does that) and there are no tests yet. If the check goes red, click into it on the PR — the failing step is either ESLint or `tsc --noEmit`, the log shows the offending file and line.

### Migrations on deploy

Vercel's build runs `vercel-build` instead of plain `next build`. That script is `tsx scripts/migrate.ts && next build`: the programmatic Drizzle migrator applies any pending migrations, then Next builds. If migrate exits non-zero (DB unreachable, migration SQL bad), the `&&` short-circuits and the build fails — no half-applied schema in production.

The same script powers `npm run db:migrate` locally, so local and Vercel run the exact same code path. To inspect the migration step on a deploy, open the Vercel build log and look for the `[migrate] starting…` and `[migrate] done in Xms` bracket lines.

### Healthz

`GET /healthz` pings the database with `select 1` and returns:
- `200 { ok: true, db: "up", ts }` if the query succeeded;
- `503 { ok: false, db: "down", error }` if it failed (error message is one line, no stack trace).

The route opts out of all caching (`force-dynamic` + `cache-control: no-store`) so monitors get a live answer. It's public — no auth — because uptime monitoring shouldn't have to manage tokens, and the body reveals nothing exploitable.

Production: `https://chrono-lexicanum.vercel.app/healthz`.

### Preview URLs

Vercel's GitHub integration comments the preview URL on every PR (one persistent comment per PR, updated as new commits land). Nothing for you to maintain. Note: previews are gated by Vercel's "Deployment Protection" by default, so curling `/healthz` on a preview URL needs auth — production is the right URL for monitors.
