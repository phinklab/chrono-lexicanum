/**
 * Brief 105 — the audio analogue of the byline. Renders single/duet/ensemble
 * narrators as "Narrated by …" and full-cast dramas as "Full-cast drama — …"
 * (never a lone "Narrated by", per the brief). Server component.
 */

export type AudioCreditKind = "single" | "duet" | "ensemble" | "cast";

export interface AudioCreditData {
  kind: AudioCreditKind;
  names: string[];
}

/** "A" · "A & B" · "A, B & C" · "A, B, C & 2 more" (caps the visible list). */
function joinNames(names: string[], max = 3): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length <= max) {
    return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
  }
  return `${names.slice(0, max).join(", ")} & ${names.length - max} more`;
}

export default function AudioCredit({ credit }: { credit: AudioCreditData }) {
  const text =
    credit.kind === "cast"
      ? `Full-cast drama — ${joinNames(credit.names)}`
      : `Narrated by ${joinNames(credit.names)}`;

  return (
    <p className="book-detail__audio-credit">
      <span className="book-detail__audio-credit-label">{"// AUDIOBOOK"}</span>
      <span className="book-detail__audio-credit-name">{text}</span>
    </p>
  );
}
