/**
 * Brief 045 — Dump facet vocabulary as a Markdown tree, for embedding in
 * Variant-C Sonnet-Subagent-Prompts. Read-only; no Pipeline edits.
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  loadFacetVocabulary,
  type FacetCategory,
} from "@/lib/ingestion/llm/prompt";

function vocabToMarkdown(categories: FacetCategory[]): string {
  const lines: string[] = ["# Facet vocabulary (use ONLY these IDs, bare value-IDs only)\n"];
  for (const cat of categories) {
    const tag = cat.multiValue ? "multi-value" : "single-value";
    const desc = cat.description ? ` — ${cat.description}` : "";
    lines.push(`## ${cat.name} (\`${cat.id}\`, ${tag})${desc}`);
    for (const v of cat.values) {
      const vDesc = v.description ? ` — ${v.description}` : "";
      lines.push(`- \`${v.id}\` (${v.name})${vDesc}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

async function main() {
  const { categories } = await loadFacetVocabulary();
  const md = vocabToMarkdown(categories);
  const outPath = resolve(
    process.cwd(),
    "ingest/.compare/_runners/facet-vocabulary.md",
  );
  await writeFile(outPath, md, "utf8");
  console.log(`facet-vocabulary.md written (${categories.length} categories, ${md.length} chars).`);
}

main().catch((e) => {
  console.error("dump-vocab fatal:", e);
  process.exit(1);
});
