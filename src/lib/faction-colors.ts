/**
 * Per-faction accent colours, sourced from the Warhammer-Optics handoff
 * (`books.html` lines 26-32). Used by the /buecher row dots and faction tags.
 * Unknown factions fall back to `var(--cl-dim)` at the call site.
 */

const FACTION_DOT: Record<string, string> = {
  "Night Lords": "#5b6a7a",
  "Blood Angels": "#a51c1c",
  "Astra Militarum": "#5a6e3a",
  "Word Bearers": "#7a3a2a",
  "Custodes": "#c9a65a",
  "Black Templars": "#101010",
};

export function factionDot(name: string | null | undefined): string {
  if (!name) return "var(--cl-dim)";
  return FACTION_DOT[name] ?? "var(--cl-dim)";
}
