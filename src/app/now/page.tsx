import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import SiteBackground from "@/components/chrome/SiteBackground";
import ScrollScrim from "@/components/chrome/ScrollScrim";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";
import BtnFx from "@/components/shared/BtnFx";
import RouteScrollCue from "@/components/chrome/RouteScrollCue";
import { routeOg } from "@/lib/seo";
import {
  loadStatusImperialis,
  type NowBook,
  type NowEvent,
} from "@/lib/now/loadNow";
// Route-scoped stylesheet (S7a): Status Imperialis loads only here.
import "@/app/styles/57-now.css";

// Request-time route, like /timeline: the now-payload has no snapshot
// artifact, and a build-time prerender would read the live DB — an E4
// violation (builds render from the committed snapshot only). The tagged
// Data Cache in the loader (TTL + `now` purge) carries the load instead.
export const dynamic = "force-dynamic";

const NOW_DESCRIPTION =
  "The archive's present: where the Warhammer 40,000 story stands right now — the Era Indomitus, ~012.M42 — and which novels take place there.";

export const metadata: Metadata = {
  title: "Status Imperialis — When Is Now?",
  description: NOW_DESCRIPTION,
  alternates: { canonical: "/now" },
  openGraph: routeOg({
    title: "Status Imperialis — When Is Now?",
    description: NOW_DESCRIPTION,
  }),
};

/**
 * /now — Status Imperialis, the archive's "burning present" page.
 *
 * Hybrid by design (F1 verdict, Session 236): the era row, the Indomitus
 * event spine and the "playing out now" book list come from the DB
 * (`loadStatusImperialis`, cached under the `now` tag); the two-imperium
 * situation report and the Tempus Incertum caveat are curated prose in code,
 * kept honest by a freshness stamp computed from the data. The Weekly-Refresh
 * runbook carries a check to revisit the prose when a promoted book outdates
 * this page (F1-B1).
 */

/** Local H/M/L wording (W4 sits in the backlog and would consolidate this). */
const CONFIDENCE_WORD: Record<string, string> = {
  H: "firm",
  M: "estimated",
  L: "conjectural",
};

function EventEntry({ event }: { event: NowEvent }) {
  return (
    <li className="now-event reveal">
      {event.artworkRef ? (
        <div className="now-event__plate" aria-hidden>
          <Image
            src={event.artworkRef}
            alt=""
            fill
            sizes="(max-width: 720px) 100vw, 220px"
          />
        </div>
      ) : (
        <div className="now-event__plate now-event__plate--void" aria-hidden />
      )}
      <div className="now-event__body">
        <p className="now-event__date">{event.dateLabel}</p>
        <h3 className="now-event__title">{event.title}</h3>
        <p className="now-event__blurb">{event.blurb}</p>
        {event.media.length > 0 && (
          <ul className="now-event__media">
            {event.media.map((chip, i) => (
              <li key={`${event.id}-${i}`}>
                {chip.href ? (
                  <Link className="now-chip" href={chip.href}>
                    <span className="now-chip__kind">{chip.kind}</span>
                    <span className="now-chip__title">{chip.title}</span>
                    {chip.meta && (
                      <span className="now-chip__meta">{chip.meta}</span>
                    )}
                  </Link>
                ) : (
                  <span className="now-chip now-chip--inert">
                    <span className="now-chip__kind">{chip.kind}</span>
                    <span className="now-chip__title">{chip.title}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function BookRow({ book }: { book: NowBook }) {
  const confidence = book.confidence
    ? CONFIDENCE_WORD[book.confidence] ?? null
    : null;
  return (
    <li>
      <Link className="now-book" href={`/book/${book.slug}`}>
        <span className="now-book__date">{book.dateLabel}</span>
        <span className="now-book__main">
          <span className="now-book__title">{book.title}</span>
          {book.author && (
            <span className="now-book__author">{book.author}</span>
          )}
        </span>
        {confidence && (
          <span className="now-book__conf" title="Dating confidence">
            {confidence}
          </span>
        )}
      </Link>
    </li>
  );
}

export default async function NowPage() {
  const { era, events, books } = await loadStatusImperialis();

  return (
    <main id="main" tabIndex={-1} className="now-shell">
      <SiteBackground variant="main" position="right bottom" />
      <ScrollScrim
        className="site-scrim"
        varName="--scrim-o"
        heroSelector=".now-hero"
        maxOpacity={0.94}
      />

      {/* Masthead over the fixed art — the house fold rule (see
          42-lex-primitives.css § masthead): ~92vh act, copy docked at the
          fold, the backdrop breathes in the blank space above. */}
      <header className="now-hero">
        <p className="lx-hero__over">When is now?</p>
        <h1 className="lx-hero__heading">Status Imperialis</h1>
        <p className="lx-hero__edition">
          Every chronicle needs a last page. This one answers a single
          question:
          <em className="now-hero__edition-q">When is now?</em>
        </p>
        <RouteScrollCue
          className="route-cue--flow lx-hero__cue"
          label="Take the reading"
          target=".now-answer"
        />
      </header>

      {/* The answer act — a real-looking year first, the Imperial stamp
          prominent beneath it (nobody outside the hobby parses "012.M42"
          cold — Session 251). */}
      <section className="now-act now-answer" aria-label="When is now?">
        <p className="now-answer__line reveal">
          <span className="now-answer__plain">
            Circa the year 42,012
          </span>
          <span className="now-answer__kicker">in Imperial reckoning</span>
          <span className="now-answer__date">012.M42</span>
        </p>
        {/* The era the present hangs in — merged from the former "Current
            Era" act (Session 255): name, the era's own introduction, and the
            Chronicle hand-off, directly under the answer. */}
        {era && (
          <div className="now-answer__era reveal">
            <p className="now-answer__era-name">{era.name}</p>
            <p className="now-answer__era-intro lx-prose">{era.intro}</p>
            <p className="now-answer__era-link">
              <Link
                className="lx-btn"
                href="/timeline?era=indomitus"
                target="_blank"
                rel="noopener"
              >
                Open the chapter in the Chronicle
                <span className="lx-btn__mark" aria-hidden>
                  ›
                </span>
                <BtnFx />
              </Link>
            </p>
          </div>
        )}

        {/* The honesty box every date on this page obeys. */}
        <aside className="now-incertum reveal" aria-label="Why every date here is a guess">
          <p className="now-incertum__kicker">Why every date here is a guess</p>
          <p className="now-incertum__text">
            Since the Rift, Imperial dating is broken in-universe: ships
            arrive before they depart, worlds age decades in a year, and the
            lore deliberately leaves open whether &ldquo;M42&rdquo; is even
            the 42nd millennium. Every date on this page is a best guess
            wearing a confident face — treat it as bearing, not fact.
          </p>
        </aside>
      </section>

      {/* Situation report — curated prose, kept honest by the stamp below. */}
      <section className="now-act" aria-label="The state of the Imperium">
        <h2 className="lx-sect reveal">The Divided Imperium</h2>
        <div className="now-twin">
          <article className="now-twin__half reveal">
            <h3 className="now-twin__name">Imperivm Sanctvs</h3>
            <p className="now-twin__tag">The lit half, west of the Rift</p>
            <p className="lx-prose now-twin__text">
              Where the Astronomican still burns. Guilliman&rsquo;s reforms
              hold the machine together — barely. The Indomitus Crusade has
              formally ended at Raukos, the Plague Wars have been fought to a
              standstill in Ultramar, and now the Sanctus Line trades worlds
              for time against Leviathan&rsquo;s returning hive fleets. It is
              not victory; it is the administration of a permanent emergency.
              By Imperial standards, that counts as hope.
            </p>
          </article>
          <article className="now-twin__half reveal">
            <h3 className="now-twin__name">Imperivm Nihilvs</h3>
            <p className="now-twin__tag">The dark half, beyond the wound</p>
            <p className="lx-prose now-twin__text">
              Where the Emperor&rsquo;s light does not reach: no beacon, no
              fleet lanes, no census. Worlds fight on alone by candle-faith
              and stubbornness while Dante holds a regency from Baal, and most
              of what happens there never reaches a record at all. Nihilus is
              where this archive&rsquo;s honesty matters most — half the
              Imperium is currently living outside its own history.
            </p>
          </article>
        </div>
        {/* Deep-link raises both default-off instruments: the Astronomican's
            reach and the Nihilus shade (hash contract, src/lib/map/hash.ts). */}
        <p className="now-act__cta reveal">
          <Link
            className="lx-btn"
            href="/map#lumen=1&nihilus=1"
            target="_blank"
            rel="noopener"
          >
            Chart the divided galaxy on the map
            <span className="lx-btn__mark" aria-hidden>
              ›
            </span>
            <BtnFx />
          </Link>
        </p>
      </section>

      {/* The era's newest events, leading edge on top — the full spine stays
          the Chronicle's job (cross-link above). */}
      {events.length > 0 && (
        <section className="now-act" aria-label="The road to now">
          <h2 className="lx-sect reveal">The Road to Now</h2>
          <p className="now-act__lede lx-prose reveal">
            The five freshest entries in the era&rsquo;s record, newest
            first. The full road — from the 13th Black Crusade to the broken
            calendar — lives in the Chronicle&rsquo;s final chapter.
          </p>
          <ol className="now-events">
            {events
              .slice(-5)
              .reverse()
              .map((ev) => (
                <EventEntry key={ev.id} event={ev} />
              ))}
          </ol>
        </section>
      )}

      {/* The reading list of the moving present. */}
      <section className="now-act" aria-label="Books set in the present">
        <h2 className="lx-sect reveal">The Present in Print</h2>
        <p className="now-act__lede lx-prose reveal">
          {books.length > 0 ? (
            <>
              The {books.length} newest releases set in the moving present,
              ordered by where they fall in the timeline. The very latest
              carry a curator&rsquo;s approximate placement instead of a
              dated stamp; confidence rides each row — <em>firm</em>: stated
              in the text; <em>estimated</em>: anchored to a nearby event or
              series; <em>conjectural</em>: placed by feel.
            </>
          ) : (
            <>No dated works have reached the now-window yet.</>
          )}
        </p>
        {books.length > 0 && (
          <ol className="now-books reveal">
            {books.map((b) => (
              <BookRow key={b.id} book={b} />
            ))}
          </ol>
        )}
      </section>

      <ArchiveFooter mid="The present is a contested record" />
    </main>
  );
}
