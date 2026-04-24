/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#177E89",
        "primary-dark": "#0f5a63",
        "deep-teal": "#1a4a4f",
        surface: "#323031",
        background: "#1e1c1d",
        "on-primary": "#ffffff",
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};