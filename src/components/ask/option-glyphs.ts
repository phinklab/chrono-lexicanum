/**
 * Line-art grimdark glyphs for the faction question's option "code" slots.
 *
 * Single source of truth: consumed by `OptionGlyph` (rendered in the browser)
 * and by the `scripts/_render-glyphs.ts` QA harness (rasterised to a PNG via
 * sharp), so the shapes can be eyeballed before they ship. Each value is the
 * *inner* markup of a 24×24 viewBox SVG; stroke colour, width and joins are set
 * once on the `<svg>` wrapper in `OptionGlyph` (stroke = currentColor = cyan).
 *
 * The chaos star and xenos delta deliberately echo the map's `FactionIcon`
 * glyph language so the two surfaces speak the same visual dialect.
 */
export const OPTION_GLYPHS: Record<string, string> = {
  // Imperium — double-headed Aquila: raised spread wings, two outward heads,
  // fanned tail.
  aquila: `
    <path d="M11 10 C 8 8.2 5 7.4 2.6 8" />
    <path d="M2.6 8 C 5.2 9.4 8.2 10.6 10.6 12.4" />
    <path d="M13 10 C 16 8.2 19 7.4 21.4 8" />
    <path d="M21.4 8 C 18.8 9.4 15.8 10.6 13.4 12.4" />
    <path d="M12 11 C 11.5 8.4 10.6 6.8 9.1 6 C 8.2 5.6 7.4 5.9 7.2 6.7 L 8.4 7" />
    <path d="M12 11 C 12.5 8.4 13.4 6.8 14.9 6 C 15.8 5.6 16.6 5.9 16.8 6.7 L 15.6 7" />
    <path d="M12 11 L 12 16.6" />
    <path d="M12 16.6 L 9.5 20.6 M12 16.6 L 12 21.4 M12 16.6 L 14.5 20.6" />`,

  // Chaos — eight-pointed star (4 long cardinal + 4 short diagonal arrows).
  chaos: `
    <g transform="rotate(0 12 12)"><line x1="12" y1="12" x2="12" y2="2.6" /><path d="M9.9 4.7 L12 2.6 L14.1 4.7" /></g>
    <g transform="rotate(90 12 12)"><line x1="12" y1="12" x2="12" y2="2.6" /><path d="M9.9 4.7 L12 2.6 L14.1 4.7" /></g>
    <g transform="rotate(180 12 12)"><line x1="12" y1="12" x2="12" y2="2.6" /><path d="M9.9 4.7 L12 2.6 L14.1 4.7" /></g>
    <g transform="rotate(270 12 12)"><line x1="12" y1="12" x2="12" y2="2.6" /><path d="M9.9 4.7 L12 2.6 L14.1 4.7" /></g>
    <g transform="rotate(45 12 12)"><line x1="12" y1="12" x2="12" y2="6.2" /><path d="M10.4 7.8 L12 6.2 L13.6 7.8" /></g>
    <g transform="rotate(135 12 12)"><line x1="12" y1="12" x2="12" y2="6.2" /><path d="M10.4 7.8 L12 6.2 L13.6 7.8" /></g>
    <g transform="rotate(225 12 12)"><line x1="12" y1="12" x2="12" y2="6.2" /><path d="M10.4 7.8 L12 6.2 L13.6 7.8" /></g>
    <g transform="rotate(315 12 12)"><line x1="12" y1="12" x2="12" y2="6.2" /><path d="M10.4 7.8 L12 6.2 L13.6 7.8" /></g>
    <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />`,

  // Space Marines — bare skull (death's head): cranium, eye sockets, nasal, teeth.
  skull: `
    <path d="M6.8 11 C 6.8 6.9 9.1 4.6 12 4.6 C 14.9 4.6 17.2 6.9 17.2 11 C 17.2 13 16.3 14 15.4 14.6 L 15.4 16.7 C 15.4 17.7 14.6 18.5 13.6 18.5 L 10.4 18.5 C 9.4 18.5 8.6 17.7 8.6 16.7 L 8.6 14.6 C 7.7 14 6.8 13 6.8 11 Z" />
    <circle cx="9.7" cy="10.8" r="1.7" fill="currentColor" stroke="none" />
    <circle cx="14.3" cy="10.8" r="1.7" fill="currentColor" stroke="none" />
    <path d="M12 12.3 L 10.9 14.4 L 13.1 14.4 Z" fill="currentColor" stroke="none" />
    <line x1="10.6" y1="16.5" x2="10.6" y2="18.5" />
    <line x1="13.4" y1="16.5" x2="13.4" y2="18.5" />`,

  // Inquisition — the all-seeing eye.
  eye: `
    <path d="M3.4 12 C 7 7.5 17 7.5 20.6 12 C 17 16.5 7 16.5 3.4 12 Z" />
    <circle cx="12" cy="12" r="2.7" />
    <circle cx="12" cy="12" r="0.95" fill="currentColor" stroke="none" />`,

  // Astra Militarum — lasrifle: barrel + front sight, receiver/stock, magazine, grip.
  rifle: `
    <line x1="2.6" y1="8.8" x2="14" y2="8.8" />
    <line x1="6" y1="8.8" x2="6" y2="6.9" />
    <path d="M14 7.4 L 21.5 7.4 L 21.5 10.6 L 14 10.6 Z" />
    <path d="M10.6 8.8 L 10.6 14 L 12.7 14 L 12.7 8.8" />
    <path d="M16.8 10.6 L 18.3 13.9" />`,

  // Xenos — delta rune, the map's "alien" sigil (vertical stem + node on it).
  xenos: `
    <path d="M12 3.4 L 20.6 19.4 L 3.4 19.4 Z" />
    <line x1="12" y1="10.8" x2="12" y2="16.8" />
    <circle cx="12" cy="13.4" r="1.1" fill="currentColor" stroke="none" />`,
};
