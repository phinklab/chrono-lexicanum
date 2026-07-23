/**
 * Runtime-role contract — the single source of truth for what the
 * least-privilege app role `chrono_runtime` may touch (Launch S3a,
 * docs/launch-master-plan.md § Session 3a Punkt 1).
 *
 * Philosophy: EXPLICIT ALLOWLIST, fail-closed.
 *  - SELECT only on the enumerated public catalogue tables below. There are
 *    deliberately NO `ALTER DEFAULT PRIVILEGES` grants towards this role: a
 *    table created by a future migration is invisible to the runtime until it
 *    is consciously added here and `npm run db:roles` is re-run.
 *  - The deployed runtime is read-only. There is no runtime write allowlist.
 *  - `submissions` is DENIED entirely — it carries PII (email, free text,
 *    review data; schema.ts). The future community-submission write path gets
 *    its own conscious INSERT-only grant when it actually ships.
 *
 * Enforcement: scripts/test-runtime-role-contract.ts (runs in `npm test`)
 * asserts that every pgTable in src/db/schema.ts is classified in exactly one
 * of the two lists — adding a table to the schema without deciding its
 * runtime visibility fails CI.
 *
 * Consumers: scripts/apply-db-roles.ts (turns this into GRANT/REVOKE SQL),
 * scripts/verify-runtime-role.ts (positive + negative probes against a live
 * role), scripts/test-runtime-role-contract.ts (schema drift gate).
 */

export const RUNTIME_ROLE = "chrono_runtime";

/**
 * Server-side per-statement timeout for the runtime role, applied via
 * `ALTER ROLE … SET statement_timeout` (S3a Punkt 6 decision). Rationale:
 * the client-side option is impossible through the transaction pooler (port
 * 6543 rejects `statement_timeout` as a startup parameter — see
 * src/db/client.ts), but a ROLE-level GUC is applied by the Postgres backend
 * at session start and therefore works through the pooler. 15s is ~15× any
 * legitimate catalogue query and, crucially, reaps queries whose serverless
 * caller (Vercel function timeout ≈ 10s) already died — a runaway query no
 * longer burns pooler slots for minutes. Local scripts connect as the
 * privileged role and are unaffected.
 */
export const RUNTIME_STATEMENT_TIMEOUT = "15s";

/** Public catalogue tables — SELECT only. */
export const RUNTIME_SELECT_TABLES = [
  "eras",
  "factions",
  "series",
  "works",
  "book_details",
  "film_details",
  "channel_details",
  "video_details",
  "podcast_details",
  "podcast_episode_details",
  "work_factions",
  "work_characters",
  "work_locations",
  "work_persons",
  "facet_categories",
  "facet_values",
  "work_facets",
  "work_collections",
  "services",
  "external_links",
  "persons",
  "sectors",
  "locations",
  "characters",
  "events",
  "event_works",
] as const;

/** Explicitly denied — no privileges whatsoever (PII). */
export const RUNTIME_DENIED_TABLES = ["submissions"] as const;
