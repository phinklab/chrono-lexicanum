/**
 * Shared legend row for the Librarium charts — HTML (not SVG) so the labels
 * wrap and inherit the site's mono ladder. Swatch colors come as CSS custom
 * property names from the validated chart palette (60-statistics.css).
 */

export interface LegendItem {
  varName: string;
  label: string;
  /** Hollow swatch (ring instead of fill) — mirrors hollow marks. */
  hollow?: boolean;
}

export default function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="libr-legend">
      {items.map((item) => (
        <li key={item.varName + item.label} className="libr-legend__item">
          <span
            className={`libr-legend__swatch${item.hollow ? " libr-legend__swatch--hollow" : ""}`}
            style={
              item.hollow
                ? { borderColor: `var(${item.varName})` }
                : { background: `var(${item.varName})` }
            }
            aria-hidden
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
