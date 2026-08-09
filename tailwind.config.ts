import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // "warm sitter" sky-blue palette — friendly, trustworthy, US babysitter-site feel
        sky: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        sunny: {
          // warm accent used for CTAs and the "warm" in warm sitter
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        // Deep, premium ink — for high-trust dark sections and refined text.
        ink: {
          950: "#070d1a",
          900: "#0b1324",
          800: "#122139",
          700: "#1c3055",
          600: "#274270",
        },
        // Warm off-white for a soft, upscale ground.
        cream: "#fffaf3",
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: "0 4px 24px -6px rgba(2, 132, 199, 0.18)",
        soft: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -10px rgba(15,23,42,0.12)",
        lift: "0 18px 48px -18px rgba(2,132,199,0.45)",
        glow: "0 24px 70px -24px rgba(2,132,199,0.55)",
        ring: "0 0 0 1px rgba(2,132,199,0.08), 0 10px 30px -12px rgba(2,132,199,0.25)",
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
        xl4: "2.25rem",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        floatSlow: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-16px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-500px 0" },
          "100%": { backgroundPosition: "500px 0" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both",
        float: "float 6s ease-in-out infinite",
        "float-slow": "floatSlow 9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
