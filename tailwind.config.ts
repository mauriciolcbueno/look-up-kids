import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // LookUp brand palette
        ink: "#14213D",
        sun: "#FFC83D",
        coral: "#FF6A4D",
        cream: "#FFF8EC",
        warm: "#FFE9B8",

        background: "#FFF8EC",
        foreground: "#14213D",
        card: "#FFFFFF",
        muted: {
          DEFAULT: "#FFE9B8",
          foreground: "#6B6F7C",
        },
        primary: {
          DEFAULT: "#FFC83D",
          foreground: "#14213D",
        },
        secondary: {
          DEFAULT: "#FF6A4D",
          foreground: "#FFF8EC",
        },
        accent: {
          DEFAULT: "#14213D",
          foreground: "#FFF8EC",
        },
        success: "hsl(150 70% 40%)",
        danger: "#E5523A",
      },
      fontFamily: {
        sans: ["Nunito", "system-ui", "sans-serif"],
      },
      boxShadow: {
        playful: "0 10px 28px -10px rgba(255, 106, 77, 0.45), 0 4px 12px -4px rgba(20, 33, 61, 0.12)",
        soft: "0 4px 14px -4px rgba(20, 33, 61, 0.12)",
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
