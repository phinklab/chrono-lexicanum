import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Find Your Next Book - Chrono Lexicanum",
  description:
    "Two ways into the archive: answer four questions, or pick a faction and get a single curated Warhammer 40,000 novel to start with.",
};

interface AskPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * How many live ranks to pull when the reader chooses "Browse deeper". The
 * matrix cell already holds the Top-6; the deeper view ranks wider and shows
 * what comes after, deduped against the six already on screen (Brief 164).
 */
const DEEPER_LIMIT = 24;

const ASK_READOUT_LINES = [
  "· ARCHIVE · WHERE TO BEGIN",
  "· TWO WAYS IN · ONLINE",
  "· IV QVAESTIONES · FLAT PROFILE",
  "· VNA FACTIO · VNVS LIBER",
  "· RECOMMENDATION ENGINE READY",
  "· ARCHIVE QUERY IS SERVER-SIDE",
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
      // Hot path (Brief 164 Phase 2): the Top-6 cell is served from the
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
    <main className="ask route-snap">
      <SiteBackground variant="main" position="right bottom" />
      <ScrollScrim
        className="ask-scrim"
        varName="--ask-scrim-opacity"
        heroSelector=".ask-console__mast"
        maxOpacity={0.77}
      />

      <div className="ask-readout" aria-hidden>
        <GhostReadout
          color="var(--cl-gold)"
          opacity={0.28}
          lineMs={5200}
          typeSpeed={78}
          max={4}
          lines={ASK_READOUT_LINES}
        />
      </div>

      <FloatingCoord
        x="42%"
        y="120px"
        label="QUERY · PVBLIC"
        delay={1.2}
        lifetime={5}
        color="var(--cl-gold)"
        opacity={0.5}
      />
      <FloatingCoord
        x="58%"
        y="220px"
        label={`PROFILE · ${answeredCount} OF ${ASK_QUESTIONS.length}`}
        delay={3}
        lifetime={5}
        color="var(--cl-gold)"
        opacity={0.5}
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
        <ArchiveFooter mid="QVATTVOR QVAESTIONES" />
      </div>
    </main>
  );
}
