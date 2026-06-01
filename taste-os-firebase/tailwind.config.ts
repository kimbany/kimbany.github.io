import type { Config } from "tailwindcss";

/**
 * Taste OS design-system foundation.
 * Tokens mirror the prototype palette + motion language
 * (see taste-os/tokens.md, motion-sound.md).
 * This is an emotional atmosphere system, not a generic UI kit.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#0E0C0B",
        coal: "#1A1714",
        bone: "#443E37",
        mist: "#9A8E81",
        sand: "#C8B69B",
        beige: "#D8C7AC",
        "silver-blue": "#8FA0AC",
        rose: "#B07672",
        ember: "#D9A66C",
      },
      fontFamily: {
        // emotional display voice
        display: ["var(--font-display)", "Cormorant Garamond", "Noto Serif KR", "serif"],
        // quiet interface voice
        sans: ["var(--font-sans)", "Inter", "Pretendard", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: {
        "breath-in": "cubic-bezier(0.16, 1, 0.30, 1)",
        "breath-out": "cubic-bezier(0.70, 0, 0.84, 0)",
        settle: "cubic-bezier(0.34, 1.18, 0.64, 1)",
      },
      transitionDuration: {
        // there is no transition under 200ms in this product
        breath: "1600ms",
        atmosphere: "2400ms",
      },
      keyframes: {
        "orb-fade-in": { to: { opacity: "1" } },
        "sigil-breath": {
          "0%,100%": { opacity: "0.20" },
          "50%": { opacity: "0.36" },
        },
        "dust-rise": {
          "0%": { transform: "translateY(105vh) translateX(0)" },
          "100%": { transform: "translateY(-10vh) translateX(24px)" },
        },
      },
      animation: {
        "sigil-breath": "sigil-breath 3.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
