/**
 * SiteBackground — full-bleed photo + vignette + grain for a route.
 * Server component; pages opt-in by rendering it once near the top of
 * their <main>. Routes that don't render one get the plain void body bg.
 * When the photo has a registered artist credit (`src/lib/art-credits.ts`),
 * the shared <ArtCreditTag> renders bottom-right — outside the aria-hidden
 * backdrop, so the credit links stay reachable.
 *
 * Variants:
 *   - "main"       — shared library-nave backdrop (Hub, Archive, Compendium, Ask)
 *   - "vista"      — Books hero, book detail, entity pages (cathedral light)
 *   - "scriptorium" — Compendium (grand cathedral-library, scribe at a lectern)
 *   - "librarium"  — (legacy) library/scriptorium interior
 *   - "vox"        — Podcasts (cathedral nave, two scribes at vox-podiums)
 *   - "oracle"     — The Curator (gothic scriptorium, void window)
 *   - "chronicle"  — Timeline / Chronicle (cathedral timeline diagram)
 *   - "cartog"     — cartog-hall (handoff photo, currently unused)
 *   - "cartog-holo" — (unused — /map sits on a flat color without a
 *                     SiteBackground)
 *   - "login"      — /login (lightless cathedral librarium — phil kuenzler)
 *   - "none"       — just vignette + grain over the void
 */
import Image from "next/image";
import ArtCreditTag from "@/components/chrome/ArtCreditTag";
import { backgroundArtCredit } from "@/lib/art-credits";

export type SiteBgVariant =
  | "main"
  | "vista"
  | "scriptorium"
  | "librarium"
  | "vox"
  | "oracle"
  | "chronicle"
  | "cartog"
  | "cartog-holo"
  | "login"
  | "none";

const PHOTOS: Record<SiteBgVariant, string | null> = {
  main: "/img/main-bg.webp",
  vista: "/img/vista.webp",
  scriptorium: "/img/scriptorium.webp",
  librarium: "/img/librarium.webp",
  vox: "/img/vox.webp",
  oracle: "/img/oracle.webp",
  chronicle: "/img/chronicle-hall.webp",
  cartog: "/img/cartog-hall.webp",
  "cartog-holo": "/img/cartog-holo.webp",
  login: "/img/login.webp",
  none: null,
};

/* Phone-portrait override per variant: the pages pick their desktop crop
   (e.g. "right bottom" on the library nave), but a 9:19 slice of that crop
   shows only the image's right wall — portrait re-centers on the nave. Kept
   here (not per call site) so every page of a variant crops alike; the CSS
   var lands in 41-site-bg.css's ≤760px rule. */
const MOBILE_POSITIONS: Partial<Record<SiteBgVariant, string>> = {
  main: "center bottom",
};

type SiteBackgroundProps = {
  variant?: SiteBgVariant;
  position?: string;
};

export default function SiteBackground({
  variant = "vista",
  position = "center",
}: SiteBackgroundProps) {
  const photo = PHOTOS[variant];
  const credit = backgroundArtCredit(photo);
  const mobilePosition = MOBILE_POSITIONS[variant] ?? position;
  return (
    <>
      <div className="site-bg" aria-hidden>
        {photo && (
          <div
            className="site-bg__photo"
            style={{ "--bg-pos-m": mobilePosition } as React.CSSProperties}
          >
            {/* A real <img> instead of a CSS background (S7a): the preload
                scanner finds it in the HTML and `sizes` gives phones a small
                variant instead of the full ~1920px file. `priority` because
                the backdrop is by definition the first paintable viewport
                content on every page that renders one. Crop overrides
                (portrait re-center in 41-site-bg.css, /login contain-mode in
                68-login.css) target `.site-bg__photo img` with !important to
                beat the inline object-position, mirroring the old
                background-position contract. */}
            <Image
              src={photo}
              alt=""
              fill
              priority
              sizes="100vw"
              style={{ objectFit: "cover", objectPosition: position }}
            />
          </div>
        )}
        <div className="site-bg__vignette" />
        <div className="site-bg__fade" />
        <div className="site-bg__grain" />
      </div>
      {credit && <ArtCreditTag credit={credit} className="art-credit--site" />}
    </>
  );
}
