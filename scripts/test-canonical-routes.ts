/**
 * test-canonical-routes.ts — Launch S4. DB-free smoke of the canonical-route
 * contract (launch-master-plan Anhang A):
 *
 *  1. Redirect table: every A.2 row exists in `next.config.ts` as a 308
 *     (`permanent: true`), no destination carries its own query string (the
 *     querystring rule is Next's verbatim pass-through — a destination with
 *     `?` would REPLACE the incoming query), and no destination is itself a
 *     redirect source (no double hops, e.g. /fraktionen must land directly on
 *     /compendium/factions).
 *  2. Canonical route structure: the English route folders exist (detail +
 *     audit + the two compendium guided-pick tools), the German ones AND the
 *     retired /ask surface (Session 256) are gone, and the compendium
 *     category slugs are the five English ones.
 *  3. Modal intercepts follow 1:1: `@modal/(.)book|character|faction|world|
 *     person/[slug]/page.tsx` all exist, and the pure URL contract
 *     (`TYPE_TO_ROUTE`, `TYPE_TO_COMPENDIUM`, focus hrefs) points at the new
 *     paths.
 *  4. Book-ISR contract: /book/[slug] declares `revalidate` +
 *     `generateStaticParams` and has no server dynamic driver left
 *     (`searchParams`, `headers()`, `force-dynamic`).
 *  5. No internal alt-links: no old-path literal appears anywhere under
 *     src/ (every .ts/.tsx) — the executable form of the S4 acceptance grep.
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    passed += 1;
    console.log(`ok    ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL  ${name}`);
    console.error(err);
  }
}

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(repoRoot, "src");
const appDir = path.join(srcDir, "app");

type RedirectRow = {
  source: string;
  destination: string;
  permanent?: boolean;
  has?: unknown;
};

/** The A.2 contract: source → destination, all 308, query passed through. */
const EXPECTED_REDIRECTS: ReadonlyArray<[source: string, destination: string]> = [
  // pre-S4 rows (unchanged Bestand)
  ["/buecher", "/archive"],
  ["/werke", "/archive"],
  ["/podcasts", "/archive/podcasts"],
  ["/podcasts/:slug", "/archive/podcasts/:slug"],
  // S4: German → English entity routes
  ["/buch/:slug", "/book/:slug"],
  ["/buch/:slug/audit", "/book/:slug/audit"],
  ["/charakter/:slug", "/character/:slug"],
  ["/fraktion/:slug", "/faction/:slug"],
  ["/welt/:slug", "/world/:slug"],
  ["/compendium/fraktionen", "/compendium/factions"],
  ["/compendium/primarchen", "/compendium/primarchs"],
  ["/compendium/charaktere", "/compendium/characters"],
  ["/compendium/welten", "/compendium/worlds"],
  ["/compendium/autoren", "/compendium/authors"],
  ["/fraktionen", "/compendium/factions"],
  // Session 256: the Curator's two tools moved into the Compendium; both the
  // English and the old German ask paths land directly on the new homes.
  ["/ask", "/compendium/four-questions"],
  ["/ask/faction/:path*", "/compendium/one-faction-one-book/:path*"],
  ["/ask/fraktion/:path*", "/compendium/one-faction-one-book/:path*"],
];

/** Old-path literals that must not survive anywhere in src (acceptance grep).
 *  Slash-delimited so legit non-URL identifiers (`charaktereRows` snapshot
 *  keys, the `@/app/fraktionen/*` module home of the faction guide, German
 *  legal prose) don't false-positive. */
const FORBIDDEN_LITERALS = [
  "/buch/",
  '"/buch"',
  "/charakter/",
  "/fraktion/",
  "/welt/",
  "/compendium/fraktionen",
  "/compendium/primarchen",
  "/compendium/charaktere",
  "/compendium/welten",
  "/compendium/autoren",
  "/ask/fraktion",
  // Session 256: no internal link may still target the retired /ask surface.
  // NOT the bare "/ask/faction" — that is a substring of the legit
  // `@/lib/ask/faction-starters` module path; the quoted/slash-terminated
  // forms below only match href literals.
  '"/ask"',
  "/ask/faction/",
  "/ask?",
  "(.)buch",
  "(.)charakter",
  "(.)fraktion",
  "(.)welt",
] as const;

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listSourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

async function main(): Promise<void> {
  const nextConfig = (await import("../next.config")).default;
  assert.ok(nextConfig.redirects, "next.config exports redirects()");
  const rows = (await nextConfig.redirects!()) as RedirectRow[];
  const bySource = new Map(rows.map((r) => [r.source, r]));

  await test("A.2 redirect rows exist, permanent (308), unconditional", () => {
    for (const [source, destination] of EXPECTED_REDIRECTS) {
      const row = bySource.get(source);
      assert.ok(row, `missing redirect for ${source}`);
      assert.equal(row.destination, destination, `wrong destination for ${source}`);
      assert.equal(row.permanent, true, `${source} must be permanent (308)`);
      assert.equal(row.has, undefined, `${source} must not be condition-gated`);
    }
    assert.equal(
      rows.length,
      EXPECTED_REDIRECTS.length,
      "redirect table has rows the contract does not know about",
    );
  });

  await test("querystring rule: no destination writes its own query", () => {
    for (const row of rows) {
      assert.ok(
        !row.destination.includes("?"),
        `${row.source} → ${row.destination} would override the incoming query`,
      );
    }
  });

  await test("no double hops: no destination is itself a redirect source", () => {
    for (const row of rows) {
      assert.ok(
        !bySource.has(row.destination),
        `${row.source} → ${row.destination} chains into another redirect`,
      );
    }
  });

  await test("canonical route folders exist; German ones are gone", () => {
    const mustExist = [
      "book/[slug]/page.tsx",
      "book/[slug]/audit/page.tsx",
      "character/[slug]/page.tsx",
      "faction/[slug]/page.tsx",
      "world/[slug]/page.tsx",
      "person/[slug]/page.tsx",
      "compendium/four-questions/page.tsx",
      "compendium/one-faction-one-book/[[...segments]]/page.tsx",
      "compendium/[category]/page.tsx",
    ];
    for (const rel of mustExist) {
      assert.ok(existsSync(path.join(appDir, rel)), `missing route file: src/app/${rel}`);
    }
    const mustBeGone = [
      "buch",
      "charakter",
      "fraktion",
      "welt",
      // Session 256: the whole /ask surface moved into the Compendium.
      "ask",
      // the folder stays as the faction guide's module home, but it must not
      // be routable — the /fraktionen URL is a next.config 308 now
      "fraktionen/page.tsx",
      "fraktionen/loading.tsx",
    ];
    for (const rel of mustBeGone) {
      assert.ok(!existsSync(path.join(appDir, rel)), `old route still present: src/app/${rel}`);
    }
  });

  await test("modal intercepts follow the canonical routes 1:1", () => {
    for (const name of ["book", "character", "faction", "world", "person"]) {
      const rel = `@modal/(.)${name}/[slug]/page.tsx`;
      assert.ok(existsSync(path.join(appDir, rel)), `missing intercept: src/app/${rel}`);
    }
  });

  await test("pure URL contract points at the new paths", async () => {
    const { TYPE_TO_ROUTE, TYPE_TO_COMPENDIUM, entityHref } = await import(
      "../src/lib/entity/types"
    );
    assert.deepEqual(TYPE_TO_ROUTE, {
      character: "/character",
      faction: "/faction",
      location: "/world",
      person: "/person",
    });
    assert.equal(
      entityHref({ type: "location", id: "terra", name: "Terra" }),
      "/world/terra",
    );

    const { COMPENDIUM_CATEGORIES } = await import("../src/lib/compendium/categories");
    assert.deepEqual(
      COMPENDIUM_CATEGORIES.map((c) => c.slug),
      ["factions", "primarchs", "characters", "worlds", "authors"],
    );
    // Back-links land on real category slugs (no drift between the two maps).
    const slugs = new Set(COMPENDIUM_CATEGORIES.map((c) => `/compendium/${c.slug}`));
    for (const { href } of Object.values(TYPE_TO_COMPENDIUM)) {
      assert.ok(slugs.has(href), `${href} is not a compendium category`);
    }

    const filters = await import("../src/app/archive/filters");
    assert.equal(filters.factionFocusHref("x"), "/compendium/factions?focus=x");
    assert.equal(filters.primarchFocusHref("x"), "/compendium/primarchs?focus=x");
    assert.equal(filters.characterFocusHref("x"), "/compendium/characters?focus=x");
    assert.equal(filters.worldFocusHref("x"), "/compendium/worlds?focus=x");
  });

  await test("/book/[slug] declares the SSG/ISR contract, no dynamic driver", () => {
    const raw = readFileSync(path.join(appDir, "book/[slug]/page.tsx"), "utf8");
    // The header prose legitimately narrates the retired dynamic drivers —
    // strip comments so only CODE is scanned for them.
    const code = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    assert.match(code, /export const revalidate/, "revalidate export missing");
    assert.match(code, /generateStaticParams/, "generateStaticParams missing");
    assert.doesNotMatch(code, /searchParams/, "searchParams would force dynamic");
    assert.doesNotMatch(code, /headers\(\)/, "headers() would force dynamic");
    assert.doesNotMatch(code, /force-dynamic/, "force-dynamic defeats SSG");
  });

  await test("timeline legacy ?book= redirect targets /book/", () => {
    const page = readFileSync(path.join(appDir, "timeline/page.tsx"), "utf8");
    assert.match(page, /redirect\(`\/book\/\$\{encodeURIComponent\(bookRaw\)\}`\)/);
  });

  await test("no internal alt-links: old-path literals absent from src", () => {
    const offenders: string[] = [];
    for (const file of listSourceFiles(srcDir)) {
      const text = readFileSync(file, "utf8");
      for (const literal of FORBIDDEN_LITERALS) {
        let idx = text.indexOf(literal);
        while (idx !== -1) {
          const line = text.slice(0, idx).split("\n").length;
          offenders.push(`${path.relative(repoRoot, file)}:${line} contains "${literal}"`);
          idx = text.indexOf(literal, idx + 1);
        }
      }
    }
    assert.deepEqual(offenders, []);
  });

  console.log("");
  if (failed > 0) {
    console.log(`FAIL — ${failed}/${passed + failed} canonical-route checks red`);
    process.exit(1);
  }
  console.log(`PASS — ${passed} canonical-route checks green`);
}

void main();
