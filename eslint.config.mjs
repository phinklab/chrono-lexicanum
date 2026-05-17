import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "src/db/migrations/**",
      "archive/**",
      ".scratch/**",
      "next-env.d.ts",
      // Standalone Claude-Design Cartographer prototype: UMD CDN HTML app
      // served verbatim from /public. Not linted because it is not part of
      // the Next/Chrono module graph and uses CDN-React/Babel semantics.
      // The TSX port is Phase 2 — at that point this ignore goes away.
      "public/lab/cartographer-prototype/**",
    ],
  },
  ...nextCoreWebVitals,
];

export default eslintConfig;
