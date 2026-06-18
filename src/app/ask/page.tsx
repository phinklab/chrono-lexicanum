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
import { recommend } from "@/lib/ask/recommend";
import type { AskRecommendationResult } from "@/lib/ask/types";

export const metadata: Metadata = {
  title: "Ask the Archive - Chrono Lexicanum",
  description:
    "Answer five questions and get real Warhammer 40,000 novel recommendations from the archive.",
};

interface AskPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const ASK_READOUT_LINES = [
  "· INTERROGATORIVM · ONLINE",
  "· V QVAESTIONES · FLAT PROFILE",
  "· SIGNALS · EXPERIENCE / FACTION",
  "· SIGNALS · TONE / LENGTH / ERA",
  "· RECOMMENDATION ENGINE READY",
  "· ARCHIVE QUERY IS SERVER-SIDE",
];

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

  let result: AskRecommendationResult | null = null;
  let recommendationError: string | null = null;

  if (isComplete) {
    try {
      // `cacheBooks` keeps the full book load out of the per-answer hot path —
      // without it every completed questionnaire re-read all ~900 books from
      // the DB (Report 144 § P.3). The module-level cache is cleared via
      // `POST /api/revalidate` after ingestion runs.
      result = await recommend(answers, { limit: 5, onError: "throw", cacheBooks: true });
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
        maxOpacity={0.86}
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
        recommendationError={recommendationError}
      />

      <div className="ask-foot">
        <ArchiveFooter mid="QVINQVE QVAESTIONES" />
      </div>
    </main>
  );
}
