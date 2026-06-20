/**
 * Build the local preview-invite console (Brief 163).
 *
 * Reads the committed, secret-free `template.html`, substitutes the production
 * base URL, and writes the gitignored `console.html` that Philipp opens (served
 * by `serve.mjs`). The committed template is the reviewable source of truth; the
 * generated output is never committed and never deployed.
 *
 * Usage:
 *   node scripts/preview-console/build.mjs [prodBaseUrl]
 *   PREVIEW_CONSOLE_PROD_BASE=https://example.com node scripts/preview-console/build.mjs
 *
 * No secret is ever baked in — the signing secret and admin credential are
 * entered at runtime in the browser.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PROD_BASE = "https://chrono-lexicanum.vercel.app";

export function buildConsole(prodBase) {
  const base =
    prodBase ||
    process.env.PREVIEW_CONSOLE_PROD_BASE ||
    process.argv[2] ||
    DEFAULT_PROD_BASE;
  const template = readFileSync(join(HERE, "template.html"), "utf8");
  const output = template.split("__PROD_BASE_URL__").join(base);
  const target = join(HERE, "console.html");
  writeFileSync(target, output, "utf8");
  return { target, base };
}

// Run directly (not when imported by serve.mjs).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { target, base } = buildConsole();
  console.log(`[preview-console] built ${target}`);
  console.log(`[preview-console] production base: ${base}`);
}
