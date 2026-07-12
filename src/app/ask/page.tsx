import type { Metadata } from "next";
import { routeOg } from "@/lib/seo";
import SiteBackground from "@/components/chrome/SiteBackground";
import ScrollScrim from "@/components/chrome/ScrollScrim";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import GhostReadout from "@/components/chrono/GhostReadout";
import AskClient from "@/components/ask/AskClient";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";
import { ASK_QUESTIONS } from "@/lib/ask/questions";
import {
  countAskAnswers,
  isAskAnswersComplete,
  parseAskAnswers,
} from "@/lib/ask/params";
import { getAskMatrixCell } from "@/lib/ask/matrix";
import { buildAskProfile, recommend } from "@/lib/ask/recommend";
import type { AskRecommendation, AskRecommendationResult } from "@/lib/ask/types";

const ASK_DESCRIPTION =
  "Two ways into the archive: answer four questions, or pick a faction and get a single curated Warhammer 40,000 novel to start with.";

// Answer/`deeper` queries are steps of the one questionnaire — canonical
// stays the bare /ask (URL matrix A.3).
export const metadata: Metadata = {
  title: "Find Your Next Book",
  description: ASK_DESCRIPTION,
  alternates: { canonical: "/ask" },
  openGraph: routeOg({ title: "Find Your Next Book", description: ASK_DESCRIPTION }),
};

interface AskPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * How many live ranks to pull when the reader chooses "Browse deeper". The
 * matrix cell already holds the Top-6; the deeper view ranks wider and shows
 * what comes after, deduped against the six already on screen.
 */
const DEEPER_LIMIT = 24;

const ASK_VOX_LINES = [
  "Interrogatorivm · online",
  "IV qvaestiones · flat profile",
  "Vna factio · vnvs liber",
  "Cogitator · ranking ready",
  "Qvery is server-side",
];

function readDeeperFlag(params: Record<string, string | string[] | undefined>): boolean {
  const value = params.deeper;
  return (Array.isArray(value) ? value[0] : value) === "1";
}

function recommendationErrorCopy(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return "The archive connection failed before recommendations could be loaded.";
  }
  return "The archive returned an unknown recommendation error.";
}

export default async function AskPage({ searchParams }: AskPageProps) {
  const rawParams = await searchParams;
  const answers = parseAskAnswers(rawParams);
  const answeredCount = countAskAnswers(answers);
  const isComplete = isAskAnswersComplete(answers);
  const deeperRequested = isComplete && readDeeperFlag(rawParams);

  let result: AskRecommendationResult | null = null;
  let deeper: AskRecommendation[] | null = null;
  let recommendationError: string | null = null;

  if (isComplete) {
    try {
      // Hot path: the Top-6 cell is served from the
      // precomputed matrix — no per-request DB ranking. The matrix builds on
      // first use and is cleared via `POST /api/revalidate` after an apply run.
      const cell = await getAskMatrixCell(answers);
      result = { answers, profile: buildAskProfile(answers), recommendations: cell };

      if (deeperRequested) {
        // "Browse deeper" is the only live query: rank wider, then drop the six
        // already shown so the deeper view is purely net-new.
        const shown = new Set(cell.map((rec) => rec.slug));
        const wide = await recommend(answers, {
          limit: DEEPER_LIMIT,
          onError: "throw",
          cacheBooks: true,
        });
        deeper = wide.recommendations.filter((rec) => !shown.has(rec.slug));
      }
    } catch (error) {
      recommendationError = recommendationErrorCopy(error);
    }
  }

  return (
    <main id="main" tabIndex={-1} className="ask route-snap">
      <SiteBackground variant="main" position="right bottom" />
      <ScrollScrim
        className="site-scrim"
        varName="--scrim-o"
        heroSelector=".ask-console__mast"
        maxOpacity={0.94}
      />
      <GhostReadout lines={ASK_VOX_LINES} />
      <FloatingCoord
        x="9%"
        y="30%"
        label={`Profile · ${answeredCount} of ${ASK_QUESTIONS.length}`}
        delay={7}
      />

      <AskClient
        questions={ASK_QUESTIONS}
        initialAnswers={answers}
        initialIsComplete={isComplete}
        result={result}
        deeper={deeper}
        deeperRequested={deeperRequested}
        recommendationError={recommendationError}
      />

      <div className="ask-foot">
        <ArchiveFooter mid="Four questions · one doorway" />
      </div>
    </main>
  );
}
