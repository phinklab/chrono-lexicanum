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
      // Same case for the Chronicle/timeline prototype: CDN-React/Babel JSX
      // served verbatim from /public, reference-only for the live TSX port
      // under src/components/timeline/chronicle/. Not part of the module graph.
      "public/lab/timeline-prototype/**",
      // Cowork design-direction exports (gitignored, local reference only).
      // ESLint does not read .gitignore, so the ignore must live here too or
      // `npm run lint` (eslint .) trips over the prototype JSX.
      "design-export/**",
    ],
  },
  ...nextCoreWebVitals,
];

export default eslintConfig;
