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
      // Local design-direction exports (gitignored, reference only). ESLint
      // does not read .gitignore, so the ignore must live here too.
      "design-export/**",
    ],
  },
  ...nextCoreWebVitals,
];

export default eslintConfig;
