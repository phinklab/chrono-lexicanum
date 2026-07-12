/**
 * test-release-revalidate.ts — DB-free proof that the release-revalidation
 * command (scripts/release-revalidate.ts) is fail-loud and sends EXACTLY ONE
 * POST (Launch S3a Punkt 5, "Fertig wenn": success + forced failure against a
 * test environment — never a production POST).
 *
 * Each case spawns the real CLI as a subprocess against a local node:http
 * mock that counts requests, so exit codes, output and the no-retry contract
 * are tested end-to-end. Runs in the `npm test` sweep.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer, type Server } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const cli = path.join(scriptsDir, "release-revalidate.ts");
const TOKEN = "test-revalidate-token";

interface Received {
  method: string;
  url: string;
  auth: string | undefined;
}

interface Mock {
  server: Server;
  base: string;
  received: Received[];
  close: () => Promise<void>;
}

function startMock(
  handler: (req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse) => void,
): Promise<Mock> {
  return new Promise((resolve) => {
    const received: Received[] = [];
    const server = createServer((req, res) => {
      received.push({ method: req.method ?? "?", url: req.url ?? "?", auth: req.headers.authorization });
      handler(req, res);
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr !== null ? addr.port : 0;
      resolve({
        server,
        base: `http://127.0.0.1:${port}`,
        received,
        close: () =>
          new Promise((r) => {
            server.closeAllConnections();
            server.close(() => r());
          }),
      });
    });
  });
}

/**
 * Async spawn, NOT spawnSync: the mock server lives in THIS process, and a
 * synchronous wait would freeze the event loop — the mock could never answer
 * and every child would hang until killed.
 */
function runCli(env: Record<string, string | undefined>): Promise<{
  status: number | null;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--import", "tsx", cli], {
      env: {
        ...process.env,
        REVALIDATE_BASE_URL: undefined,
        REVALIDATE_TOKEN: undefined,
        REVALIDATE_TIMEOUT_MS: undefined,
        ...env,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    const killer = setTimeout(() => child.kill(), 20_000);
    child.on("close", (status) => {
      clearTimeout(killer);
      resolve({ status, stdout, stderr });
    });
  });
}

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    passed++;
    console.log(`ok    ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL  ${name}`);
    console.error(err);
  }
}

async function main(): Promise<void> {
  await test("200 → exit 0, exactly one POST with the bearer token, summary printed", async () => {
    const mock = await startMock((_req, res) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ revalidated: ["books", "entities"], paths: ["/character/[slug]"] }));
    });
    try {
      const r = await runCli({ REVALIDATE_BASE_URL: mock.base, REVALIDATE_TOKEN: TOKEN });
      assert.equal(r.status, 0, `stderr: ${r.stderr}`);
      assert.equal(mock.received.length, 1, "must send exactly one request");
      assert.equal(mock.received[0].method, "POST");
      assert.equal(mock.received[0].url, "/api/revalidate");
      assert.equal(mock.received[0].auth, `Bearer ${TOKEN}`);
      assert.match(r.stdout, /OK — revalidated tags: books, entities/);
    } finally {
      await mock.close();
    }
  });

  await test("trailing slash in REVALIDATE_BASE_URL is normalized", async () => {
    const mock = await startMock((_req, res) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ revalidated: [], paths: [] }));
    });
    try {
      const r = await runCli({ REVALIDATE_BASE_URL: `${mock.base}/`, REVALIDATE_TOKEN: TOKEN });
      assert.equal(r.status, 0, `stderr: ${r.stderr}`);
      assert.equal(mock.received[0].url, "/api/revalidate", "no double slash, no missing path");
    } finally {
      await mock.close();
    }
  });

  await test("401 → exit 1, exactly one POST (no retry), token-mismatch recovery hint", async () => {
    const mock = await startMock((_req, res) => {
      res.writeHead(401, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized." }));
    });
    try {
      const r = await runCli({ REVALIDATE_BASE_URL: mock.base, REVALIDATE_TOKEN: "wrong" });
      assert.equal(r.status, 1);
      assert.equal(mock.received.length, 1, "must NOT retry");
      assert.match(r.stderr, /401 — token mismatch/);
    } finally {
      await mock.close();
    }
  });

  await test("503 → exit 1, hint that REVALIDATE_TOKEN is missing on the deployment", async () => {
    const mock = await startMock((_req, res) => {
      res.writeHead(503, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Revalidation is disabled." }));
    });
    try {
      const r = await runCli({ REVALIDATE_BASE_URL: mock.base, REVALIDATE_TOKEN: TOKEN });
      assert.equal(r.status, 1);
      assert.equal(mock.received.length, 1);
      assert.match(r.stderr, /503 — REVALIDATE_TOKEN is not configured/);
    } finally {
      await mock.close();
    }
  });

  await test("timeout → exit 1, exactly one POST, ambiguity called out", async () => {
    const mock = await startMock(() => {
      /* never respond */
    });
    try {
      const r = await runCli({
        REVALIDATE_BASE_URL: mock.base,
        REVALIDATE_TOKEN: TOKEN,
        REVALIDATE_TIMEOUT_MS: "500",
      });
      assert.equal(r.status, 1);
      assert.equal(mock.received.length, 1, "must NOT retry after a timeout");
      assert.match(r.stderr, /TIMEOUT/);
      assert.match(r.stderr, /AMBIGUOUS/);
    } finally {
      await mock.close();
    }
  });

  await test("connection refused → exit 1, 'target was not reached'", async () => {
    // Bind a port, then close it, so nothing listens there.
    const mock = await startMock(() => {});
    await mock.close();
    const r = await runCli({ REVALIDATE_BASE_URL: mock.base, REVALIDATE_TOKEN: TOKEN });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /target was not reached/);
  });

  await test("missing REVALIDATE_BASE_URL → exit 1 before any request, no silent default", async () => {
    const r = await runCli({ REVALIDATE_TOKEN: TOKEN });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /REVALIDATE_BASE_URL is not set/);
    assert.match(r.stderr, /no default target/);
  });

  await test("missing REVALIDATE_TOKEN → exit 1 before any request", async () => {
    const mock = await startMock((_req, res) => {
      res.writeHead(200);
      res.end("{}");
    });
    try {
      const r = await runCli({ REVALIDATE_BASE_URL: mock.base });
      assert.equal(r.status, 1);
      assert.match(r.stderr, /REVALIDATE_TOKEN is not set/);
      assert.equal(mock.received.length, 0, "must not POST without a token");
    } finally {
      await mock.close();
    }
  });

  console.log("");
  if (failed > 0) {
    console.error(`test-release-revalidate: ${failed} failed, ${passed} passed`);
    process.exit(1);
  }
  console.log(`test-release-revalidate: all ${passed} cases passed`);
}

main().catch((err) => {
  console.error("test-release-revalidate: unexpected error:", err);
  process.exit(1);
});
