import SternwarteRings from "./SternwarteRings";

/**
 * BtnFx — the Sternwarte HUD inside an .lx-btn: the shared observatory rings
 * blooming out of the origin dot on hover, plus three survey stars that
 * radiate forward. Pure decoration, CSS-driven (42-lex-primitives.css);
 * render as the last child of the button/link.
 */
export default function BtnFx() {
  return (
    <span className="lx-btn__fx" aria-hidden>
      <SternwarteRings className="lx-btn__rings" />
      <i className="lx-btn__star lx-btn__star--1" />
      <i className="lx-btn__star lx-btn__star--2" />
      <i className="lx-btn__star lx-btn__star--3" />
    </span>
  );
}
