/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        forge: {
          50: "#f3f2ff",
          100: "#e9e7ff",
          200: "#d4d0ff",
          300: "#b3aaff",
          400: "#9080ff",
          500: "#7659f6",
          600: "#6541e8",
          700: "#5533c9",
          800: "#472da5",
          900: "#3c2885",
        },
        teal: {
          400: "#2dd4bf",
          500: "#14b8a6",
        },
      },
      boxShadow: {
        card: "0 18px 55px rgba(22, 18, 44, .24)",
      },
    },
  },
  plugins: [],
};
