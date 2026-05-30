/**
 * Brief 105 — the buy/listen rail rendered under the cover. Server component:
 * every href is built server-side via the geo-localized `buildStoreUrl`, so the
 * links are correct in the SSR HTML with no client JS. Amazon + Black Library
 * always render; Audible (and the audio credit) render only when the book has
 * narrator / co-narrator / full-cast credits.
 */
import { buildStoreUrl, type StoreRegion } from "@/lib/store-links";
import AudioCredit, { type AudioCreditData } from "./AudioCredit";

export interface BuyListenActionsProps {
  title: string;
  author: string | null;
  isbn: string | null;
  region: StoreRegion;
  audio: AudioCreditData | null;
}

const ARROW = "↗"; // ↗

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
      <div className="book-detail__section-label">{"// ACQUIRE"}</div>
      <div className="book-detail__actions">
        <a
          className="book-detail__action"
          href={amazonUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Buy on Amazon</span>
          <span className="book-detail__action-mark" aria-hidden>
            {ARROW}
          </span>
        </a>
        <a
          className="book-detail__action"
          href={blackLibraryUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Black Library</span>
          <span className="book-detail__action-mark" aria-hidden>
            {ARROW}
          </span>
        </a>
        {audibleUrl && (
          <a
            className="book-detail__action"
            href={audibleUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Listen on Audible</span>
            <span className="book-detail__action-mark" aria-hidden>
              {ARROW}
            </span>
          </a>
        )}
      </div>
      {audio && <AudioCredit credit={audio} />}
    </section>
  );
}
