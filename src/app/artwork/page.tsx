import type { Metadata } from "next";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";
// Route-scoped stylesheet (S7a), shared by the three legal document pages.
import "@/app/styles/71-legal.css";

/* /artwork — the site's own background paintings, offered as downloads.
   Third point of the legal row (Impressum · Datenschutz · Artwork) and,
   like those two, excluded from the preview-gate matcher so it stays
   reachable from the public /login surface; the image files under
   public/img/ are outside the gate anyway. These originals replaced the
   on-page ArtCreditTag for self-made backgrounds (src/lib/art-credits.ts
   keeps an empty registry for future third-party art). Chronicle era/event
   artwork by third parties is NOT offered here — it stays credit-only.

   Two formats per piece: the site's own WebP (same-origin, `download`
   attribute) and a high-res JPEG from the PUBLIC Supabase Storage bucket
   `artwork` — public, so unlike the signed `Audio` URLs these never expire;
   `?download=` makes Storage serve them as attachments (the `download`
   attribute is ignored cross-origin). The JPEGs are too large for the repo/
   Vercel build, hence Storage. */

export const metadata: Metadata = {
  title: "Artwork",
  description:
    "Original background artwork of Chrono · Lexicanum — free to download.",
  alternates: { canonical: "/artwork" },
};

const STORAGE =
  "https://ffdrtdrdptgmqjxgmess.supabase.co/storage/v1/object/public/artwork";

type Download = { label: string; href: string; file?: string };
type Piece = { src: string; name: string; where: string; downloads: Download[] };

const PIECES: Piece[] = [
  {
    src: "/img/main-bg.webp",
    name: "The Library Nave",
    where: "Background of the Hub, Archive, Compendium and Ask pages.",
    downloads: [
      {
        label: "WebP",
        href: "/img/main-bg.webp",
        file: "chrono-lexicanum-library-nave.webp",
      },
      {
        label: "JPEG · High-res",
        href: `${STORAGE}/library-nave.jpg?download=chrono-lexicanum-library-nave.jpg`,
      },
    ],
  },
  {
    src: "/img/login.webp",
    name: "The Lightless Librarium",
    where: "Background of the login gate.",
    downloads: [
      {
        label: "WebP",
        href: "/img/login.webp",
        file: "chrono-lexicanum-lightless-librarium.webp",
      },
      {
        label: "JPEG · High-res",
        href: `${STORAGE}/lightless-librarium.jpg?download=chrono-lexicanum-lightless-librarium.jpg`,
      },
    ],
  },
];

export default function ArtworkPage() {
  return (
    <main className="legal">
      <header className="legal__head">
        <p className="legal__eyebrow">Chrono · Lexicanum · Originals</p>
        <h1 className="legal__title">Artwork</h1>
        <div className="legal__rule" aria-hidden />
      </header>

      <div className="legal__doc">
        <section className="legal__section" aria-labelledby="aw-dl">
          <h2 className="legal__kicker" id="aw-dl">
            <span className="legal__no" aria-hidden>
              01
            </span>
            Backgrounds · free to download
          </h2>
          <div className="legal__section-rule" aria-hidden />
          <p className="legal__p">
            The painted backdrops of this archive are original works by me,
            made for the site in countless hours of trying to learn and get
            better at digital painting. There is no AI involved in creating
            these, so you can use them for your Warhammer fan projects in line
            with GW&apos;s non-AI policy. You are welcome to download them for
            any use you see fit; attribution to the Chrono Lexicanum page is
            appreciated but not needed. Book covers and the Chronicle&apos;s
            era artwork are not offered here, as those remain with their
            credited artists. I&apos;ll keep improving the existing pieces and
            adding new ones whenever this hobby wins a slice of my free time,
            so check back once in a while if you are curious.
          </p>
          <div className="legal__art">
            {PIECES.map((p) => (
              <figure key={p.src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.name} loading="lazy" />
                <figcaption>
                  <span className="legal__art-name">{p.name}</span>
                  <span className="legal__art-dls">
                    {p.downloads.map((d) => (
                      <a
                        key={d.label}
                        className="legal__art-dl"
                        href={d.href}
                        {...(d.file ? { download: d.file } : {})}
                      >
                        {d.label}
                      </a>
                    ))}
                  </span>
                </figcaption>
                <p className="legal__art-where">{p.where}</p>
              </figure>
            ))}
          </div>
        </section>
      </div>

      <ArchiveFooter mid="ARTWORK · ORIGINALS" />
    </main>
  );
}
