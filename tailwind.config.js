/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#060b1d",
          900: "#0a1128",
          850: "#0d1730",
          800: "#111d3d",
          700: "#152449",
          600: "#1b2d59",
          500: "#233a70",
        },
        ol: {
          red: "#e3082a",
          redDark: "#b8061f",
          blue: "#3b82f6",
          gold: "#f5b73d",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
}
