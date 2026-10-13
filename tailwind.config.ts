import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f2f5f8",
          100: "#e6ebf1",
          700: "#1d3557",
          800: "#15263f",
          900: "#0c1a2e",
        },
        gold: {
          400: "#d4a017",
          500: "#c4920f",
          600: "#a67c0c",
        },
      },
      fontFamily: {
        sans: ["var(--font-source)", "system-ui", "sans-serif"],
        display: ["var(--font-libre)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
