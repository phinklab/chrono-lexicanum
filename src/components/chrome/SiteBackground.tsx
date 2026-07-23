/**
 * Opt-in route backdrop: photo, vignette and grain. Artist credits render
 * outside the aria-hidden background so their links remain reachable.
 */
import Image from "next/image";
import ArtCreditTag from "@/components/chrome/ArtCreditTag";
import { backgroundArtCredit } from "@/lib/art-credits";

export type SiteBgVariant =
  | "main"
  | "vista"
  | "login"
  | "none";

const PHOTOS: Record<SiteBgVariant, string | null> = {
  main: "/img/main-bg.webp",
  vista: "/img/vista.webp",
  login: "/img/login.webp",
  none: null,
};

/* Portrait re-centers the shared nave instead of showing its right wall. */
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
            {/* Real image for preload discovery and responsive sizing; route
                CSS owns portrait and login crop overrides. */}
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
