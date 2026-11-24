import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const color = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

const preset: Omit<Config, "content"> = {
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: color("border"),
        input: color("input"),
        ring: color("ring"),
        background: color("background"),
        foreground: color("foreground"),
        primary: { DEFAULT: color("primary"), foreground: color("primary-foreground") },
        secondary: { DEFAULT: color("secondary"), foreground: color("secondary-foreground") },
        muted: { DEFAULT: color("muted"), foreground: color("muted-foreground") },
        accent: { DEFAULT: color("accent"), foreground: color("accent-foreground") },
        destructive: { DEFAULT: color("destructive"), foreground: color("destructive-foreground") },
        success: { DEFAULT: color("success"), foreground: color("success-foreground") },
        warning: { DEFAULT: color("warning"), foreground: color("warning-foreground") },
        info: { DEFAULT: color("info"), foreground: color("info-foreground") },
        overlay: color("overlay"),
        paper: color("paper"),
        ink: color("ink"),
        wa: {
          header: color("wa-header"), bg: color("wa-bg"),
          "bubble-in": color("wa-bubble-in"), "bubble-out": color("wa-bubble-out"),
          composer: color("wa-composer"), input: color("wa-input"),
          text: color("wa-text"), muted: color("wa-muted"), tick: color("wa-tick"),
          accent: color("wa-accent"), "accent-strong": color("wa-accent-strong"),
          green: color("wa-green"), teal: color("wa-teal"), notice: color("wa-notice"),
        },
        "serp-title": color("serp-title"),
        "serp-url": color("serp-url"),
        card: { DEFAULT: color("card"), foreground: color("card-foreground") },
        popover: { DEFAULT: color("popover"), foreground: color("popover-foreground") },
        sidebar: {
          DEFAULT: color("sidebar"),
          foreground: color("sidebar-foreground"),
          border: color("sidebar-border"),
          accent: color("sidebar-accent"),
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
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
        wave: {
          "0%, 100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        wave: "wave 0.9s ease-in-out infinite",
      },
    },
  },
  plugins: [animate],
};

export default preset;
