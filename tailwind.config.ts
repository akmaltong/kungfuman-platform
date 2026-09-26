import type { Config } from "tailwindcss";

// Айдентика: тёмный «лаковый» фон, тёплое золото, бумага, красная печать.
// Дизайн-язык перенесён с сайта мастера (PT Serif + PT Sans).
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
          DEFAULT: "#000000", // основной чёрный фон
          lacquer: "#14110d", // тёмный «лак» — карточки/выделения
          soft: "#14110d",
          muted: "#2a241a", // тонкие рамки/разделители
        },
        gold: {
          DEFAULT: "#c9a45c", // тёплое золото
          soft: "#dbb96f",
          dim: "#8a7040", // приглушённые рамки
          deep: "#8a6d15",
        },
        paper: {
          DEFAULT: "#ece4d3", // основной текст (тёплый белый)
          muted: "#a89d88", // приглушённый текст
        },
        seal: "#a8322d", // красная печать
      },
      fontFamily: {
        sans: ["var(--font-sans)", "PT Sans", "Segoe UI", "Arial", "sans-serif"],
        serif: ["var(--font-serif)", "PT Serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
