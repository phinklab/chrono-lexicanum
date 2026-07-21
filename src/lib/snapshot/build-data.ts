/**
 * Build-time snapshot façade (Launch S1b, plan § Session 1b Punkt 2).
 *
 * During `next build` the prerender-relevant loaders (Home / podcast index /
 * the hot entity subset) read the committed release snapshot under
 * `scripts/snapshot-data/` instead of Postgres; at runtime (ISR revalidation,
 * on-demand entities, dynamic routes, API) the same loaders lazy-import their
 * live DB module. CI proves the decoupling permanently by building against an
 * unreachable DATABASE_URL.
 *
 * Hard import rule (plan § S1b): this façade and every shared type/transform
 * stay DB-free; the live path is reached ONLY via a lazy `import()` —
 * `src/db/client.ts` throws at import when DATABASE_URL is missing, so a
 * static import chain from any prerendered route would break every DB-free
 * build.
 *
 * Fail-closed: a missing or unparsable artifact at build time THROWS and
 * fails the build. Never a silent fall-through to the live DB (that would
 * reintroduce the build-worker × `max:5` pooler stampede the snapshot
 * removed) and never a silently empty page baked into the deploy.
 */
import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  DATA_ARTIFACTS,
  SNAPSHOT_DIR,
  bookArtifactPath,
  entityArtifactPath,
} from "../../../scripts/snapshot-shared";
import type { EntityType } from "@/lib/entity/types";

/**
 * True while `next build` runs. Next sets NEXT_PHASE in the build process
 * (next/dist/build/index.js) and the static-generation workers inherit it;
 * `next dev`, `next start` and the deployed runtime report a different or
 * absent phase, so every request-time render takes the live DB path.
 */
export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function readSnapshotFile<T>(relPath: string): T {
  const abs = path.join(process.cwd(), SNAPSHOT_DIR, relPath);
  let raw: string;
  try {
    raw = readFileSync(abs, "utf8");
  } catch (err) {
    throw new Error(
      `[snapshot] build-time read of ${relPath} failed; the committed snapshot ` +
        `under ${SNAPSHOT_DIR}/ is the build's ONLY data source (regenerate via ` +
        `scripts/runbooks/content-release-runbook.md): ${String(err)}`,
    );
  }
  return JSON.parse(raw) as T;
}

/** One of the fixed data artifacts (registry: `scripts/snapshot-shared.ts`). */
export function readSnapshotArtifact<T>(name: keyof typeof DATA_ARTIFACTS): T {
  return readSnapshotFile<T>(DATA_ARTIFACTS[name]);
}

/**
 * One hot entity's prerender payload. Only ever called at build time with ids
 * from the snapshot's own hot-id list (`generateStaticParams`), so a missing
 * file means an inconsistent snapshot — throw, don't degrade.
 */
export function readSnapshotEntity<T>(type: EntityType, id: string): T {
  return readSnapshotFile<T>(entityArtifactPath(type, id));
}

/**
 * One hot book's prerender payload (Launch S4b). Only ever called at build
 * time with slugs from the snapshot's own hot-slug list
 * (`generateStaticParams`), so a missing file means an inconsistent snapshot —
 * throw, don't degrade.
 */
export function readSnapshotBook<T>(slug: string): T {
  return readSnapshotFile<T>(bookArtifactPath(slug));
}
