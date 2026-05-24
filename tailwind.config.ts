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
          "primary-50": "#F0FDFA",
          "primary-100": "#CCFBF1",
          accent: "#F97316",
          "accent-dark": "#EA6C0A",
          "accent-50": "#FFF7ED",
        },
        canvas: {
          DEFAULT: "#F8F6F2",
          subtle: "#FAFAF7",
          raised: "#FFFFFF",
        },
        ink: {
          DEFAULT: "#111827",
          muted: "#4B5563",
          subtle: "#6B7280",
          faint: "#9CA3AF",
        },
        line: {
          DEFAULT: "#E5E7EB",
          subtle: "#EFEDE8",
          strong: "#D1D5DB",
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
          "level-one": "#0D9488",
          "level-two": "#0F766E",
          "top-rated": "#B45309",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(17, 24, 39, 0.04)",
        "card-hover": "0 4px 16px rgba(17, 24, 39, 0.08)",
        popover: "0 8px 24px rgba(17, 24, 39, 0.10)",
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
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
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
