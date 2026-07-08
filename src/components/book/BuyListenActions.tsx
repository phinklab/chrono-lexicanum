/**
 * The buy/listen actions. Server component: every href is built
 * server-side via the geo-localized `buildStoreUrl`, so the links are correct
 * in the SSR HTML with no client JS. Amazon + Black Library always render;
 * Audible (and the audio credit) render only when the book has narrator /
 * co-narrator / full-cast credits. Buttons are the house Sternwarte.
 */
import BtnFx from "@/components/shared/BtnFx";
import { buildStoreUrl, type StoreRegion } from "@/lib/store-links";
import AudioCredit, { type AudioCreditData } from "./AudioCredit";

export interface BuyListenActionsProps {
  title: string;
  author: string | null;
  isbn: string | null;
  region: StoreRegion;
  audio: AudioCreditData | null;
}

export default function BuyListenActions({
  title,
  author,
  isbn,
  region,
  audio,
}: BuyListenActionsProps) {
  const common = { region, title, author: author ?? undefined };
  const amazonUrl = buildStoreUrl({ service: "amazon", isbn: isbn ?? undefined, ...common });
  const blackLibraryUrl = buildStoreUrl({ service: "black_library", ...common });
  const audibleUrl = audio ? buildStoreUrl({ service: "audible", ...common }) : null;

  return (
    <section className="book-detail__obtain" aria-label="Buy or listen">
      <h2 className="lx-sect book-detail__sect">Acquire</h2>
      <div className="book-detail__actions">
        <a
          className="lx-btn lx-btn--primary"
          href={amazonUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Buy on Amazon
          <span className="lx-btn__mark" aria-hidden>
            ↗
          </span>
          <BtnFx />
        </a>
        <a
          className="lx-btn"
          href={blackLibraryUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Black Library
          <span className="lx-btn__mark" aria-hidden>
            ↗
          </span>
          <BtnFx />
        </a>
        {audibleUrl && (
          <a
            className="lx-btn"
            href={audibleUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Listen on Audible
            <span className="lx-btn__mark" aria-hidden>
              ↗
            </span>
            <BtnFx />
          </a>
        )}
      </div>
      {audio && <AudioCredit credit={audio} />}
    </section>
  );
}
