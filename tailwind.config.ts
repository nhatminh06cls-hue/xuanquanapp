import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design system từ file HTML prototype
        primary: {
          DEFAULT: "#2D5A27",
          foreground: "#FFFFFF",
          50:  "#F0F6EF",
          100: "#D8EBD6",
          200: "#B1D7AC",
          300: "#7EBC78",
          400: "#4E9E48",
          500: "#2D5A27",
          600: "#234820",
          700: "#1A3618",
          800: "#112410",
          900: "#091208",
        },
        secondary: {
          DEFAULT: "#E8A317",
          foreground: "#1A1A1A",
        },
        surface: {
          DEFAULT: "#FDFBF7",
          dark: "#F4EFE6",
        },
        border: "#E2E8F0",
        danger: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#16A34A",
          foreground: "#FFFFFF",
        },
        info: {
          DEFAULT: "#2563EB",
          foreground: "#FFFFFF",
        },
        textMain: "#2C352D",
        textMuted: "#6B7264",
      },
      fontFamily: {
        sans:  ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
        up:   "0 -4px 12px -2px rgba(0, 0, 0, 0.03)",
        card: "0 2px 12px -2px rgba(45, 90, 39, 0.08)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to:   { transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in":  "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer:    "shimmer 1.5s infinite linear",
      },
    },
  },
  plugins: [],
};

export default config;
