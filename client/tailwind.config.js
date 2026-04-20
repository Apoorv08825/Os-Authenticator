/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#05070f",
        panel: "rgba(12, 19, 36, 0.65)",
        border: "rgba(126, 177, 255, 0.25)",
        accent: "#3dd5f3",
        accent2: "#42f5ad",
        danger: "#ff6b81",
        warning: "#ffb020",
        muted: "#9fb8de"
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Sora", "sans-serif"]
      },
      boxShadow: {
        glass: "0 10px 40px rgba(5, 12, 30, 0.45)"
      }
    }
  },
  plugins: []
};
