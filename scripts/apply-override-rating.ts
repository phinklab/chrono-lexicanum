export type OverrideRating =
  | {
      status: "rated";
      source: "goodreads";
      value: number;
      count: number;
      evidenceUrl: string;
      note?: string;
    }
  | {
      status: "unrated";
      source: "goodreads";
      reason: string;
      evidenceUrl?: string;
      note?: string;
    };

export type RatingWrite =
  | { state: "absent" }
  | {
      state: "rated";
      rating: string;
      ratingCount: number;
      ratingSource: "goodreads";
      evidenceUrl: string;
    }
  | {
      state: "unrated";
      rating: null;
      ratingCount: null;
      ratingSource: "goodreads";
      evidenceUrl: string | null;
      reason: string;
    };

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(
  value: unknown,
  field: string,
  externalBookId: string,
): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `${externalBookId}: overrides.rating.${field} must be a non-empty string.`,
    );
  }
  return value.trim();
}

function optionalString(
  value: unknown,
  field: string,
  externalBookId: string,
): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `${externalBookId}: overrides.rating.${field} must be a non-empty string when present.`,
    );
  }
  return value.trim();
}

function requireGoodreadsSource(value: unknown, externalBookId: string): void {
  if (value !== "goodreads") {
    throw new Error(`${externalBookId}: overrides.rating.source must be "goodreads".`);
  }
}

function requireRatingValue(value: unknown, externalBookId: string): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 5
  ) {
    throw new Error(
      `${externalBookId}: overrides.rating.value must be a finite number in the 0..5 Goodreads scale.`,
    );
  }
  return value;
}

function requireRatingCount(value: unknown, externalBookId: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(
      `${externalBookId}: overrides.rating.count must be a non-negative integer.`,
    );
  }
  return value;
}

export function normalizeRatingOverride(
  rating: OverrideRating | undefined,
  externalBookId: string,
): RatingWrite {
  if (rating === undefined) return { state: "absent" };
  if (!isRecord(rating)) {
    throw new Error(`${externalBookId}: overrides.rating must be an object when present.`);
  }

  const status = rating.status;
  requireGoodreadsSource(rating.source, externalBookId);

  if (status === "rated") {
    const value = requireRatingValue(rating.value, externalBookId);
    return {
      state: "rated",
      rating: value.toFixed(2),
      ratingCount: requireRatingCount(rating.count, externalBookId),
      ratingSource: "goodreads",
      evidenceUrl: requireString(rating.evidenceUrl, "evidenceUrl", externalBookId),
    };
  }

  if (status === "unrated") {
    return {
      state: "unrated",
      rating: null,
      ratingCount: null,
      ratingSource: "goodreads",
      evidenceUrl: optionalString(rating.evidenceUrl, "evidenceUrl", externalBookId),
      reason: requireString(rating.reason, "reason", externalBookId),
    };
  }

  throw new Error(
    `${externalBookId}: overrides.rating.status must be "rated" or "unrated".`,
  );
}

export function ratingBookDetailsPatch(
  rating: OverrideRating | undefined,
  externalBookId: string,
): { rating?: string | null; ratingCount?: number | null; ratingSource?: "goodreads" } {
  const normalized = normalizeRatingOverride(rating, externalBookId);
  if (normalized.state === "absent") return {};
  return {
    rating: normalized.rating,
    ratingCount: normalized.ratingCount,
    ratingSource: normalized.ratingSource,
  };
}

export function formatRatingWrite(write: RatingWrite): string {
  if (write.state === "absent") return "rating=absent";
  if (write.state === "rated") {
    return `rating=${write.rating} count=${write.ratingCount} source=goodreads`;
  }
  return `rating=unrated source=goodreads reason="${write.reason}"`;
}
