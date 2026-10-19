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
        heading: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        display: ['"Fraunces"', "Georgia", "serif"],
      },
      colors: {
        brand: {
          primary: "#0F5C4D",
          "primary-dark": "#0A4539",
          "primary-50": "#ECF3EF",
          "primary-100": "#D3E5DC",
          accent: "#C2410C",
          "accent-dark": "#9A3412",
          "accent-50": "#FBEEE6",
        },
        canvas: {
          DEFAULT: "#F5F2EA",
          subtle: "#FAF8F3",
          raised: "#FFFFFF",
        },
        ink: {
          DEFAULT: "#15201C",
          muted: "#46524D",
          subtle: "#5F6B66",
          faint: "#8A948F",
        },
        line: {
          DEFAULT: "#E4DFD3",
          subtle: "#EEEAE0",
          strong: "#CFC8B8",
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
        success: "#15803D",
        warning: "#B45309",
        error: "#B91C1C",
        info: "#1D4ED8",
        seller: {
          new: "#5F6B66",
          "level-one": "#0F5C4D",
          "level-two": "#0A4539",
          "top-rated": "#9A3412",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "14px",
        "2xl": "20px",
        "3xl": "28px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(21, 32, 28, 0.05)",
        "card-hover": "0 18px 40px -18px rgba(21, 32, 28, 0.28)",
        popover: "0 16px 40px -12px rgba(21, 32, 28, 0.25)",
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
