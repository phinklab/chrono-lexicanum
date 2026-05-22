/**
 * apply-override-collections.ts — pure work_collections analysis for the
 * resolver apply sweep.
 *
 * Split out of scripts/apply-override-dry.ts (Brief 091) so the forward-
 * collection-ref guard is independently unit-testable
 * (scripts/test-apply-override-collections.ts, `npm run test:collection-refs`) —
 * same shape as apply-override-synopsis-lint.ts. Pure: no DB, no FS at call
 * time. The caller passes the roster (book-roster.json) and the
 * externalBookId→batch map of the applied range.
 *
 * work_collections edges (book-roster.json `collections`: anthology/omnibus →
 * constituent) are applied by an ascending cumulative sweep
 * (apply-override.ts:applyCollections): when the content-side book's batch
 * lands, the edge to its already-applied collection book is created. So a
 * *forward ref* — the collection book in an EARLIER batch than its content — is
 * legitimate as long as the content is itself inside the applied range; the
 * sweep resolves it when the later batch lands. Verified end-to-end in
 * Resolver-Pass 6: 10 anthology→novella forward refs (Sanctus Reach W40K-0296,
 * Damocles W40K-0294, Shield of Baal W40K-0304) landed in work_collections
 * post-apply.
 *
 * The tripwire this restores (Brief 091): a forward ref whose CONSTITUENT is
 * NOT in the applied range — either a known roster book outside the cumulative
 * range ("out-of-range") or a constituent absent from the roster entirely
 * ("unknown-work", i.e. a typo or an unregistered deferred gap). Those never
 * resolve and must fail the dry. Only the constituent side is checked — the
 * direction Pass 6 exercised; the collection side is in-range by construction
 * (the filter requires it applied).
 */

export interface RosterFile {
  books: Array<{ externalBookId: string }>;
  collections: RosterCollection[];
}

export interface RosterCollection {
  contentExternalId: string;
  collectionExternalId: string;
}

export type UnresolvableReason = "out-of-range" | "unknown-work";

export interface UnresolvableConstituentRef {
  collection: RosterCollection;
  reason: UnresolvableReason;
}

export interface CollectionAnalysis {
  oldSameBatchResolvable: number;
  newResolvable: number;
  crossBatchResolvable: RosterCollection[];
  forwardRefs: RosterCollection[];
  unresolvableConstituentRefs: UnresolvableConstituentRef[];
}

export function analyzeCollections(
  roster: RosterFile,
  batchByExternalId: Map<string, string>,
): CollectionAnalysis {
  const appliedIds = new Set(batchByExternalId.keys());
  const rosterIds = new Set(roster.books.map((book) => book.externalBookId));
  const relevant = roster.collections.filter(
    (collection) =>
      appliedIds.has(collection.collectionExternalId) ||
      appliedIds.has(collection.contentExternalId),
  );
  const oldSameBatchResolvable = relevant.filter((collection) => {
    const collectionBatch = batchByExternalId.get(collection.collectionExternalId);
    const contentBatch = batchByExternalId.get(collection.contentExternalId);
    return collectionBatch !== undefined && collectionBatch === contentBatch;
  }).length;
  const newResolvable = relevant.filter(
    (collection) =>
      appliedIds.has(collection.collectionExternalId) &&
      appliedIds.has(collection.contentExternalId),
  ).length;
  const crossBatchResolvable = relevant.filter((collection) => {
    const collectionBatch = batchByExternalId.get(collection.collectionExternalId);
    const contentBatch = batchByExternalId.get(collection.contentExternalId);
    return (
      collectionBatch !== undefined &&
      contentBatch !== undefined &&
      collectionBatch !== contentBatch
    );
  });
  const forwardRefs = crossBatchResolvable.filter((collection) => {
    const collectionBatch = batchByExternalId.get(collection.collectionExternalId);
    const contentBatch = batchByExternalId.get(collection.contentExternalId);
    return collectionBatch !== undefined && contentBatch !== undefined
      ? collectionBatch < contentBatch
      : false;
  });
  // Brief 091 range-aware tripwire: a collection (anthology/omnibus) is applied
  // but its constituent is NOT in the applied range. Legit forward refs (above)
  // have BOTH endpoints applied — the ascending sweep resolves them. These do
  // not: out-of-range = constituent is a known roster book outside the
  // cumulative range; unknown-work = constituent absent from the roster (typo /
  // unregistered deferred gap).
  const unresolvableConstituentRefs = roster.collections
    .filter(
      (collection) =>
        appliedIds.has(collection.collectionExternalId) &&
        !appliedIds.has(collection.contentExternalId),
    )
    .map(
      (collection): UnresolvableConstituentRef => ({
        collection,
        reason: rosterIds.has(collection.contentExternalId)
          ? "out-of-range"
          : "unknown-work",
      }),
    );
  return {
    oldSameBatchResolvable,
    newResolvable,
    crossBatchResolvable,
    forwardRefs,
    unresolvableConstituentRefs,
  };
}
