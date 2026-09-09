import type { Config } from "tailwindcss";

// Айдентика Kungfuman: тёмная тема, чёрный + золото
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0a0a0a", // основной чёрный фон
          soft: "#141414",
          muted: "#1f1f1f",
        },
        gold: {
          DEFAULT: "#c9a227", // золото
          soft: "#e0bd4a",
          deep: "#8a6d15",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
