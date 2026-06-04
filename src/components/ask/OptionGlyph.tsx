import { OPTION_GLYPHS } from "./option-glyphs";

/**
 * Renders a faction option's line-art glyph (aquila, chaos, skull, eye, rifle,
 * xenos) inside the option "code" slot. Stroke colour is inherited from the
 * slot (currentColor = cyan). Returns null for an unknown name so the caller
 * can fall back to the numeric index.
 */
export default function OptionGlyph({ name }: { name: string }) {
  const inner = OPTION_GLYPHS[name];
  if (!inner) return null;
  return (
    <svg
      className="ask-option__glyph"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
