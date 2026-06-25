/**
 * DB-backed smoke for the Ask recommendation engine.
 *
 * Run with `.env.local` so `src/db/client.ts` can reach Supabase:
 *   npm run test:ask-recommend
 */
import assert from "node:assert/strict";
import process from "node:process";

import {
  ASK_CURATION,
  applyAskCuration,
  parseAskCurationOverlay,
} from "@/lib/ask/curation";
import { recommend } from "@/lib/ask/recommend";
import type {
  AskAnswers,
  AskRecommendation,
  AskRecommendationReason,
  AskWeightTag,
} from "@/lib/ask/types";

type SmokeProfile = {
  name: string;
  answers: AskAnswers;
};

const PROFILES: SmokeProfile[] = [
  {
    name: "new imperium investigator",
    answers: {
      experience: "new",
      faction_love: "imperium_of_man",
      tone: "investigative",
      length: "standalone",
    },
  },
  {
    name: "deep chaos reader",
    answers: {
      experience: "deep",
      faction_love: "heretic",
      tone: "grimdark",
      length: "trilogy",
    },
  },
  {
    name: "xenos standalone explorer",
    answers: {
      experience: "some",
      faction_love: "xenos",
      tone: "heroic",
      length: "standalone",
    },
  },
];

let pass = 0;
let fail = 0;

async function check(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`ok - ${name}`);
    pass += 1;
  } catch (e) {
    console.error(`not ok - ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
    fail += 1;
  }
}

function assertRecommendationShape(profile: string, result: Awaited<ReturnType<typeof recommend>>): void {
  // The hard gates (HH for newcomers, anchor-exclusion for deep) and the
  // single-volume length gate can legitimately leave a narrow profile with
  // fewer than the requested limit — Brief 164 guarantees ≥1 per visible combo,
  // not exactly 5. So assert a non-empty, capped list, not an exact count.
  assert.ok(
    result.recommendations.length >= 1 && result.recommendations.length <= 5,
    `${profile}: expected between 1 and 5 recommendations, got ${result.recommendations.length}`,
  );
  for (const [idx, rec] of result.recommendations.entries()) {
    const at = `${profile}.recommendations[${idx}]`;
    assert.ok(rec.slug.trim().length > 0, `${at}: slug`);
    assert.ok(rec.title.trim().length > 0, `${at}: title`);
    assert.ok(Array.isArray(rec.authors), `${at}: authors`);
    assert.ok(Number.isFinite(rec.score), `${at}: score`);
    assert.ok(rec.reasons.length > 0, `${at}: structured reasons`);
    for (const [reasonIdx, reason] of rec.reasons.entries()) {
      const reasonAt = `${at}.reasons[${reasonIdx}]`;
      assert.ok(reason.tag.trim().length > 0, `${reasonAt}: tag`);
      assert.ok(reason.label.trim().length > 0, `${reasonAt}: label`);
      assert.equal(typeof reason.matched, "boolean", `${reasonAt}: matched`);
      assert.ok(Number.isFinite(reason.points), `${reasonAt}: points`);
    }
  }
  assert.ok(result.recommendations[0]?.score ?? 0 > 0, `${profile}: top score should be positive`);
}

function reason(tag: AskWeightTag, matched = true, points = 10): AskRecommendationReason {
  return {
    tag,
    label: tag,
    matched,
    points,
  };
}

function syntheticRecommendation(
  slug: string,
  score: number,
  reasons: AskRecommendationReason[] = [],
): AskRecommendation {
  return {
    id: slug,
    slug,
    title: slug,
    authors: [],
    score,
    matchedTags: reasons.filter((r) => r.matched).map((r) => r.tag),
    reasons,
  };
}

async function main(): Promise<void> {
  console.log("ask-recommend - DB-backed smoke");

  await check("committed curation overlay is small and loadable", async () => {
    assert.equal(ASK_CURATION.version, 1);
    assert.ok(ASK_CURATION.rules.length > 0, "expected at least one example rule");
    assert.ok(ASK_CURATION.rules.length <= 10, "example overlay should stay intentionally small");
  });

  await check("curation ban removes a matching book before pin or boost", async () => {
    const overlay = parseAskCurationOverlay({
      version: 1,
      rules: [
        {
          id: "pin-alpha",
          when: { tone: "investigative" },
          action: "pin",
          book: "alpha",
          points: 80,
        },
        {
          id: "ban-alpha",
          when: { tone: "investigative" },
          action: "ban",
          book: "alpha",
        },
        {
          id: "boost-alpha",
          when: { tone: "investigative" },
          action: "boost",
          book: "alpha",
          points: 100,
        },
      ],
    });

    const result = applyAskCuration(
      [syntheticRecommendation("alpha", 20), syntheticRecommendation("beta", 10)],
      { tone: "investigative" },
      overlay,
    );

    assert.deepEqual(result.map((r) => r.slug), ["beta"]);
  });

  await check("curation pin prefers a lower-scored partial-profile match", async () => {
    const overlay = parseAskCurationOverlay({
      version: 1,
      rules: [
        {
          id: "pin-low",
          when: { faction_love: "imperium_of_man" },
          action: "pin",
          book: "low",
          points: 15,
        },
      ],
    });

    const result = applyAskCuration(
      [syntheticRecommendation("high", 100), syntheticRecommendation("low", 20)],
      { faction_love: "imperium_of_man", tone: "investigative" },
      overlay,
    );

    assert.equal(result[0]?.slug, "low");
    assert.equal(result[0]?.curation?.[0]?.action, "pin");
  });

  await check("curation boosts both book targets and matching axes", async () => {
    const overlay = parseAskCurationOverlay({
      version: 1,
      rules: [
        {
          id: "boost-book",
          when: { experience: "new" },
          action: "boost",
          book: "book-target",
          points: 30,
        },
        {
          id: "boost-axis",
          when: { experience: "new" },
          action: "boost",
          tag: "faction_imperium",
          points: 20,
        },
      ],
    });

    const result = applyAskCuration(
      [
        syntheticRecommendation("axis-target", 50, [reason("faction_imperium")]),
        syntheticRecommendation("book-target", 45),
        syntheticRecommendation("base", 60),
      ],
      { experience: "new" },
      overlay,
    );

    assert.equal(result[0]?.slug, "book-target");
    assert.equal(result[0]?.score, 75);
    assert.equal(result[1]?.slug, "axis-target");
    assert.equal(result[1]?.score, 70);
    assert.deepEqual(
      result.flatMap((r) => r.curation ?? []).map((effect) => effect.target),
      ["book", "tag"],
    );
  });

  for (const profile of PROFILES) {
    await check(`recommend ranks ${profile.name}`, async () => {
      const result = await recommend(profile.answers, { limit: 5, onError: "throw" });
      assertRecommendationShape(profile.name, result);
      const top = result.recommendations.slice(0, 3).map((r) => `${r.slug}:${r.score}`);
      console.log(`  top: ${top.join(", ")}`);
    });
  }

  await check("recommend ranking is deterministic for identical answers", async () => {
    const first = await recommend(PROFILES[0].answers, { limit: 5, onError: "throw" });
    const second = await recommend(PROFILES[0].answers, { limit: 5, onError: "throw" });
    assert.deepEqual(
      first.recommendations.map((r) => r.slug),
      second.recommendations.map((r) => r.slug),
    );
  });

  await check("recommend supports explicit no-overlay mode", async () => {
    const result = await recommend(PROFILES[0].answers, {
      limit: 5,
      onError: "throw",
      curation: null,
    });
    assertRecommendationShape("new inquisition investigator (no overlay)", result);
  });

  console.log("");
  console.log(`# pass ${pass}`);
  console.log(`# fail ${fail}`);
  if (fail > 0) process.exit(1);
  process.exit(0);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
