/**
 * Serve the local preview-invite console on localhost (Brief 163).
 *
 * Builds the gitignored `console.html` from the committed template, then serves
 * it over http://localhost:<port>. Localhost is a SECURE CONTEXT, so the
 * browser's Web Crypto (`crypto.subtle`) works — opening the file as `file://`
 * would not, and would force the activation endpoint into a `null`-origin CORS
 * anti-pattern. The port here MUST match the endpoint's allow-origin
 * (`PREVIEW_CONSOLE_ORIGIN`, default http://localhost:4178 — see
 * src/app/api/preview-invites/route.ts).
 *
 * Usage: `npm run preview:console`  (then open the printed http://localhost URL)
 */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { buildConsole } from "./build.mjs";

const PORT = Number(process.env.PREVIEW_CONSOLE_PORT || 4178);

const { target, base } = buildConsole();

const server = createServer((req, res) => {
  // Single-file console — serve it for any path (favicon etc. get it too, fine).
  try {
    const html = readFileSync(target, "utf8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  } catch (err) {
    res.writeHead(500);
    res.end("Failed to read console.html — run the build first.\n" + String(err));
  }
});

server.listen(PORT, () => {
  console.log(`[preview-console] serving the console at http://localhost:${PORT}`);
  console.log(`[preview-console] production base baked in: ${base}`);
  console.log("[preview-console] open that URL, enter the signing secret + admin credential, then Generate links.");
  console.log("[preview-console] Ctrl-C to stop.");
});
