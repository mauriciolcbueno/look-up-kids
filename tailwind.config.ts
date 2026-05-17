import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(48 100% 96%)",
        foreground: "hsl(230 35% 18%)",
        card: "hsl(0 0% 100%)",
        muted: {
          DEFAULT: "hsl(220 14% 96%)",
          foreground: "hsl(230 15% 45%)",
        },
        primary: {
          DEFAULT: "hsl(45 100% 60%)",
          foreground: "hsl(230 35% 18%)",
        },
        secondary: {
          DEFAULT: "hsl(280 80% 65%)",
          foreground: "hsl(0 0% 100%)",
        },
        accent: {
          DEFAULT: "hsl(190 90% 55%)",
          foreground: "hsl(230 35% 18%)",
        },
        success: "hsl(150 70% 45%)",
        danger: "hsl(0 75% 60%)",
      },
      fontFamily: {
        sans: ["Nunito", "system-ui", "sans-serif"],
      },
      boxShadow: {
        playful: "0 8px 24px -8px hsl(280 80% 65% / 0.4)",
        soft: "0 4px 14px -4px hsl(230 35% 18% / 0.1)",
      },
      animation: {
        "pop-in": "popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "shake": "shake 0.4s ease-in-out",
        "flip": "flip 0.6s ease",
      },
      keyframes: {
        popIn: {
          "0%": { transform: "scale(0.7)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-6px)" },
          "75%": { transform: "translateX(6px)" },
        },
        flip: {
          "0%": { transform: "rotateX(0)" },
          "50%": { transform: "rotateX(90deg)" },
          "100%": { transform: "rotateX(0)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
