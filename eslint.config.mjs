import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [
      // Recursive: ephemeral worktrees under .claude/worktrees/ carry their own
      // .next build output; a root-only ".next/**" left those to the traversal
      // (904 phantom findings, minutes-long runs — Launch S1b).
      "**/.next/**",
      "node_modules/**",
      "src/db/migrations/**",
      "archive/**",
      ".scratch/**",
      "next-env.d.ts",
      // Full source copies of the repo — never lint targets.
      ".claude/worktrees/**",
      // Local design-direction exports (gitignored, reference only). ESLint
      // does not read .gitignore, so the ignores must live here too.
      "design-export/**",
      "timeline-workshop/design-export/**",
    ],
  },
  ...nextCoreWebVitals,
];

export default eslintConfig;
