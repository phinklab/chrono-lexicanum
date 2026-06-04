import type { Metadata } from "next";
import SiteBackground from "@/components/chrome/SiteBackground";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import GhostReadout from "@/components/chrono/GhostReadout";
import LetterField from "@/components/chrono/LetterField";
import WordField from "@/components/chrono/WordField";
import AskClient from "@/components/ask/AskClient";
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
  "ASK CONTRACT ONLINE",
  "FIVE QUESTIONS / FLAT PROFILE",
  "RECOMMENDATION ENGINE READY",
  "CURATION OVERLAY SEALED",
  "ANSWER SIGNALS: EXPERIENCE / FACTION / TONE",
  "ANSWER SIGNALS: LENGTH / ERA",
  "PUBLIC FUNNEL AWAITING INPUT",
  "ARCHIVE QUERY IS SERVER-SIDE",
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
      result = await recommend(answers, { limit: 5, onError: "throw" });
    } catch (error) {
      recommendationError = recommendationErrorCopy(error);
    }
  }

  return (
    <main className="ask">
      <SiteBackground variant="librarium" position="50% 30%" />

      <WordField count={5} seed={11} color="156,230,255" baseOpacity={0.08} />
      <LetterField count={16} seed={37} color="var(--cl-cyan)" baseOpacity={0.07} />

      <div className="ask-readout" aria-hidden>
        <GhostReadout
          color="var(--cl-cyan)"
          opacity={0.28}
          lineMs={5200}
          typeSpeed={78}
          max={4}
          lines={ASK_READOUT_LINES}
        />
      </div>

      <FloatingCoord
        x="42%"
        y="112px"
        label="QUERY / PUBLIC"
        delay={1.2}
        lifetime={5}
        color="var(--cl-cyan)"
        opacity={0.45}
      />
      <FloatingCoord
        x="62%"
        y="220px"
        label={`PROFILE / ${answeredCount} OF ${ASK_QUESTIONS.length}`}
        delay={3}
        lifetime={5}
        color="var(--cl-cyan)"
        opacity={0.32}
      />

      <AskClient
        questions={ASK_QUESTIONS}
        initialAnswers={answers}
        initialIsComplete={isComplete}
        result={result}
        recommendationError={recommendationError}
      />
    </main>
  );
}
