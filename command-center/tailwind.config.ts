import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        surface2: "var(--surface2)",
        line: "var(--line)",
        line2: "var(--line2)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        emerald: "rgb(var(--emerald-rgb) / <alpha-value>)",
        blue: "rgb(var(--blue-rgb) / <alpha-value>)",
        gold: "rgb(var(--gold-rgb) / <alpha-value>)",
        violet: "rgb(var(--violet-rgb) / <alpha-value>)",
        danger: "rgb(var(--danger-rgb) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 26px rgba(110,168,254,.20)",
        card: "0 18px 50px rgba(0,0,0,.4)",
      },
      backgroundImage: {
        "radial-glow":
          "radial-gradient(50% 40% at 85% -5%, rgba(110,168,254,.08), transparent 60%), radial-gradient(45% 38% at 0% 100%, rgba(157,139,246,.05), transparent 60%)",
      },
      keyframes: {
        pulse: { "50%": { opacity: "0.35" } },
        fade: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        "pulse-dot": "pulse 1.8s infinite",
        // `both` fill-mode: holds the hidden state during delay, holds visible after.
        // Pure CSS, so content reveals even if JS never hydrates.
        fade: "fade .5s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
