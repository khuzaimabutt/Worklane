import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Inter"', "system-ui", "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          primary: "#0D9488",
          "primary-dark": "#0F766E",
          accent: "#F97316",
          "accent-dark": "#EA6C0A",
        },
        neutral: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          500: "#6B7280",
          700: "#374151",
          900: "#111827",
          950: "#0A0A0A",
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",
        seller: {
          new: "#6B7280",
          "level-one": "#3B82F6",
          "level-two": "#8B5CF6",
          "top-rated": "#F59E0B",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      borderRadius: {
        xl: "12px",
        lg: "10px",
        md: "8px",
        sm: "6px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
