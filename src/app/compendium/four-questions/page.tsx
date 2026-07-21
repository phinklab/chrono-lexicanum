import type { Metadata } from "next";
import { routeOg } from "@/lib/seo";
import CompendiumNav from "@/components/compendium/CompendiumNav";
import AskClient from "@/components/ask/AskClient";
import { ASK_QUESTIONS } from "@/lib/ask/questions";
import {
  isAskAnswersComplete,
  parseAskAnswers,
} from "@/lib/ask/params";
import { getAskMatrixCell } from "@/lib/ask/matrix";
import { buildAskProfile, recommend } from "@/lib/ask/recommend";
import type { AskRecommendation, AskRecommendationResult } from "@/lib/ask/types";
// Route-scoped stylesheet (S7a): the shared tool-body container.
import "@/app/styles/53-ask.css";

/**
 * Four Questions — the questionnaire, living inside the Compendium since
 * Session 256 (the standalone Curator surface at /ask is gone; a 308 carries
 * old links and sealed answer URLs here). The compendium layout owns art,
 * masthead and foot; this page is a directory-sibling: category nav, intro,
 * then the tool.
 */

const FOUR_QUESTIONS_DESCRIPTION =
  "Answer a four-question reading profile and the archive returns a ranked path through the shelves.";

// Answer/`deeper` queries are steps of the one questionnaire — canonical
// stays the bare route (URL matrix A.3).
export const metadata: Metadata = {
  title: "Four Questions — Compendium",
  description: FOUR_QUESTIONS_DESCRIPTION,
  alternates: { canonical: "/compendium/four-questions" },
  openGraph: routeOg({
    title: "Four Questions",
    description: FOUR_QUESTIONS_DESCRIPTION,
  }),
};

interface FourQuestionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * How many live ranks to pull when the reader chooses "Browse deeper". The
 * matrix cell already holds the Top-6; the deeper view ranks wider and shows
 * what comes after, deduped against the six already on screen.
 */
const DEEPER_LIMIT = 24;

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

export default async function FourQuestionsPage({
  searchParams,
}: FourQuestionsPageProps) {
  const rawParams = await searchParams;
  const answers = parseAskAnswers(rawParams);
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
    <section
      className="cmp-directory cmp-tool"
      aria-labelledby="four-questions-title"
    >
      <CompendiumNav />
      <header className="cmp-cat-intro">
        <h2 id="four-questions-title" className="cmp-cat-intro__heading">
          Four Questions
        </h2>
        <p className="cmp-cat-intro__blurb">
          Tell the archive what kind of journey you want. It will weigh the
          shelves and return a ranked reading path.
        </p>
      </header>

      <AskClient
        questions={ASK_QUESTIONS}
        initialAnswers={answers}
        initialIsComplete={isComplete}
        result={result}
        deeper={deeper}
        deeperRequested={deeperRequested}
        recommendationError={recommendationError}
      />
    </section>
  );
}
