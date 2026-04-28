import { defineConfig } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

// Load .env.local for local dev (Vercel sets envs natively in prod).
loadEnv({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill in your Supabase credentials.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Strict mode = require explicit confirmation on destructive migrations.
  strict: true,
  verbose: true,
});
