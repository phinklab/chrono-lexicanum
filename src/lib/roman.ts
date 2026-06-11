/* Roman numerals for the new design language's ordinal ornaments
   (QVAESTIO II, RANK III, registry rows). Small lookup — the UI never
   counts past a dozen; larger values fall back to arabic digits. */

const NUMERALS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
] as const;

export function roman(n: number): string {
  return NUMERALS[n - 1] ?? String(n);
}
