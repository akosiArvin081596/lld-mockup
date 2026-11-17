import type { Config } from "tailwindcss";

// Colors are CSS variables (space-separated RGB) defined in src/app/globals.css,
// following the FavFan token pattern, with LLD's own palette (brand/tokens.json).
const rgb = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      // Fluid layout that uses the whole width (Arvin: "utilize the whole width").
      // Gutters scale with the window: 20px on phones up to 96px on very wide screens.
      // Content only stops growing past 1920px. Paragraphs keep their own max line length.
      padding: "clamp(1.25rem, 4.5vw, 6rem)",
      screens: { "3xl": "1920px" },
    },
    extend: {
      colors: {
        obsidian: rgb("obsidian"),
        coal: rgb("coal"),
        char: rgb("char"),
        gold: rgb("gold"),
        gilt: rgb("gilt"),
        bronze: rgb("bronze"),
        "gold-deep": rgb("gold-deep"),
        parchment: rgb("parchment"),
        stone: rgb("stone"),
        ink: rgb("ink"),
        "ink-muted": rgb("ink-muted"),
        error: rgb("error"),
        background: rgb("obsidian"),
        foreground: rgb("parchment"),
        muted: rgb("stone"),
        border: rgb("char"),
        ring: rgb("gold"),
      },
      fontFamily: {
        // Cinzel is retired from the UI; `font-display` now resolves to the text face.
        display: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        serif: ["var(--font-serif)", "var(--font-serif-text)", "Georgia", "serif"],
        "serif-text": ["var(--font-serif-text)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "2px",
        sm: "2px",
        md: "2px",
      },
      letterSpacing: {
        label: "0.22em",
        wordmark: "0.32em",
      },
      maxWidth: {
        prose: "65ch",
      },
      transitionTimingFunction: {
        "out-quint": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
