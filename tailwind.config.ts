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
        surface: "#070C16",
        surface2: "#0E1826",
        primary: "#34D0E8",
        success: "#5BD6A0",
        warning: "#F7B955",
        danger: "#F47C7C",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(34,211,238,.25)",
        "glow-sm": "0 0 18px rgba(34,211,238,.18)",
      },
      backgroundImage: {
        "radial-fade":
          "radial-gradient(ellipse at 50% -20%, rgba(34,211,238,.08), transparent 60%)",
      },
      keyframes: {
        "laser-sweep": {
          "0%": { transform: "translateX(-110%)" },
          "100%": { transform: "translateX(110%)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.06)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: ".4", boxShadow: "0 0 12px rgba(34,211,238,.3)" },
          "50%": { opacity: "1", boxShadow: "0 0 24px rgba(34,211,238,.6)" },
        },
      },
      animation: {
        "laser-sweep": "laser-sweep 1.8s ease-in-out infinite",
        breathe: "breathe 6s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        pulseGlow: "pulseGlow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
