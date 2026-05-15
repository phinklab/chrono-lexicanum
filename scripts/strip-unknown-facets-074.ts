/**
 * Brief 074 data-hygiene patch — strip unknown facet IDs from
 * manual-overrides-ssot-w40k-011..015.json so `apply-override.ts` doesn't
 * loud-stop on the catalog FK check (scripts/apply-override.ts:486-499).
 *
 * The Loop-Driver-LLM-Subsession (Brief 071 produktiv-Run, PR #54) wrote
 * `interplanetary` / `freedom` / `discovery` / `duty` / `early_release` into
 * the 015 overrides although none exist in `facet-catalog.json`. These are
 * NOT in the Brief-074 `value_outside_vocabulary`-hand-off list — they are
 * LLM-typos against an outdated catalog snapshot, not deliberate vocabulary-
 * expansion candidates. Per Brief-074 "Keine vocabulary-Promotionen in diesem
 * Brief": strip the unknown IDs, do not extend the catalog.
 *
 * Line-based text edit (preserves the surrounding override-file formatting
 * so the diff stays surgical).
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const SEED_DIR = resolve(process.cwd(), "scripts", "seed-data");
const TARGET_BATCHES = ["011", "012", "013", "014", "015"];
const UNKNOWN_FACET_IDS = [
  "interplanetary",
  "freedom",
  "discovery",
  "duty",
  "early_release",
];

// Match a facetIds-array entry line, e.g. `          "interplanetary",`
// or the no-trailing-comma form when it is the last item. Match the entire
// line (including trailing newline) so the removal is line-exact.
function buildLineRegex(id: string): RegExp {
  // \r? for Windows line endings, [ \t]* leading whitespace
  return new RegExp(
    `^[ \\t]*"${id.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}",?[ \\t]*\\r?\\n`,
    "m",
  );
}

async function main() {
  let totalRemoved = 0;
  const removals: string[] = [];
  for (const batch of TARGET_BATCHES) {
    const path = resolve(SEED_DIR, `manual-overrides-ssot-w40k-${batch}.json`);
    let content = await readFile(path, "utf8");
    let removedHere = 0;
    for (const id of UNKNOWN_FACET_IDS) {
      const re = buildLineRegex(id);
      let m: RegExpExecArray | null;
      while ((m = re.exec(content)) !== null) {
        content = content.slice(0, m.index) + content.slice(m.index + m[0].length);
        removedHere += 1;
        removals.push(`${batch}: -"${id}"`);
        re.lastIndex = 0;
      }
    }
    if (removedHere > 0) {
      await writeFile(path, content, "utf8");
      totalRemoved += removedHere;
      console.log(`patched ${path} (-${removedHere})`);
    } else {
      console.log(`clean   ${path}`);
    }
  }
  console.log(`\ntotal removed: ${totalRemoved}`);
  for (const r of removals) console.log(`  ${r}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
