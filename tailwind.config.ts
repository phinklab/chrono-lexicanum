import type { Config } from "tailwindcss";

/**
 * Chrono Lexicanum — Tailwind theme.
 * The palette mirrors the original prototype's "cold" theme so existing
 * components feel at home. Extend rather than overwrite as we add modes.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx,mdx}",
    "./src/components/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background scale (deep void → near-black panels)
        void: {
          950: "#05070d",
          900: "#0a0e18",
          800: "#10162a",
          700: "#1a2238",
          600: "#26304a",
        },
        // Imperial gold accents
        aquila: {
          DEFAULT: "#d8b34c",
          50: "#fbf3d4",
          100: "#f3e3a3",
          400: "#e3c061",
          600: "#b8923a",
          900: "#5a4318",
        },
        // Cold blue accents (the "cold" palette tone)
        frost: {
          DEFAULT: "#7fb6d9",
          50: "#e8f3fb",
          400: "#9dc8e6",
          600: "#5a93b8",
          900: "#1f3e55",
        },
        // Chaos-coded warning
        heresy: {
          DEFAULT: "#c44b3a",
          400: "#d97564",
          900: "#4a1812",
        },
      },
      fontFamily: {
        // Headings, era titles
        cinzel: ["Cinzel", "serif"],
        // Body prose, synopses
        cormorant: ["'Cormorant Garamond'", "serif"],
        // UI labels, dates
        grotesk: ["'Space Grotesk'", "system-ui", "sans-serif"],
        // Numeric, inline data
        mono: ["'JetBrains Mono'", "monospace"],
        // Long-form reading
        reader: ["Newsreader", "serif"],
      },
      animation: {
        "fade-slide": "fadeSlide 0.6s ease-out both",
        "tile-rise": "tileRise 0.8s ease-out both",
        "scan": "scan 4s linear infinite",
      },
      keyframes: {
        fadeSlide: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        tileRise: {
          "0%": { opacity: "0", transform: "translateY(32px) scale(0.985)", filter: "blur(6px)" },
          "100%": { opacity: "1", transform: "none", filter: "none" },
        },
        scan: {
          "0%": { transform: "translateY(-10%)" },
          "100%": { transform: "translateY(110%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
