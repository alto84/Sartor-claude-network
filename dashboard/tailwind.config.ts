import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nestly Brand Colors
        brand: {
          primary: {
            50: "#f0fdf4",
            100: "#dcfce7",
            200: "#bbf7d0",
            300: "#86efac",
            400: "#4ade80",
            500: "#22c55e",
            600: "#16a34a",
            700: "#15803d",
            800: "#166534",
            900: "#14532d",
            DEFAULT: "#16a34a",
          },
          secondary: {
            50: "#fff7ed",
            100: "#ffedd5",
            200: "#fed7aa",
            300: "#fdba74",
            400: "#fb923c",
            500: "#f97316",
            600: "#ea580c",
            700: "#c2410c",
            800: "#9a3412",
            900: "#7c2d12",
            DEFAULT: "#fb923c",
          },
          accent: {
            50: "#f0f9ff",
            100: "#e0f2fe",
            200: "#bae6fd",
            300: "#7dd3fc",
            400: "#38bdf8",
            500: "#0ea5e9",
            600: "#0284c7",
            700: "#0369a1",
            800: "#075985",
            900: "#0c4a6e",
            DEFAULT: "#38bdf8",
          },
          warm: {
            50: "#fefce8",
            100: "#fef9c3",
            200: "#fef08a",
            300: "#fde047",
            400: "#facc15",
            500: "#eab308",
            DEFAULT: "#fef9c3",
            cream: "#fefce8",
            sand: "#f5f5dc",
            linen: "#faf0e6",
          },
          nest: {
            light: "#d4a574",
            DEFAULT: "#8b6914",
            dark: "#5c4813",
          },
        },
      },
      fontFamily: {
        display: ["var(--font-nunito)", "var(--font-geist-sans)", "sans-serif"],
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      // Custom animation keyframes
      keyframes: {
        // Existing keyframes
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        wave: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-20deg)" },
          "75%": { transform: "rotate(20deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        heartbeat: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },

        // Fade animations
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-left": {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "fade-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },

        // Scale animations
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "scale-out": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.9)" },
        },
        "bounce-in": {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)" },
        },

        // Slide animations
        "slide-in-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-in-down": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out-up": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-100%)" },
        },
        "slide-out-down": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },

        // Shimmer/Skeleton
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "wave-skeleton": {
          "0%": { transform: "translateX(-100%)" },
          "50%, 100%": { transform: "translateX(100%)" },
        },

        // Pulse variations
        "pulse-scale": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        "heartbeat-strong": {
          "0%, 100%": { transform: "scale(1)" },
          "14%": { transform: "scale(1.3)" },
          "28%": { transform: "scale(1)" },
          "42%": { transform: "scale(1.3)" },
          "70%": { transform: "scale(1)" },
        },

        // Shake
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-5px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(5px)" },
        },

        // Glow
        glow: {
          "0%, 100%": {
            boxShadow:
              "0 0 5px rgba(59, 130, 246, 0.5), 0 0 10px rgba(59, 130, 246, 0.3), 0 0 15px rgba(59, 130, 246, 0.1)",
          },
          "50%": {
            boxShadow:
              "0 0 10px rgba(59, 130, 246, 0.8), 0 0 20px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.3)",
          },
        },

        // Spin reverse
        "spin-reverse": {
          "0%": { transform: "rotate(360deg)" },
          "100%": { transform: "rotate(0deg)" },
        },

        // Accordion
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },

        // Collapsible
        "collapsible-down": {
          from: { height: "0" },
          to: { height: "var(--radix-collapsible-content-height)" },
        },
        "collapsible-up": {
          from: { height: "var(--radix-collapsible-content-height)" },
          to: { height: "0" },
        },

        // Dialog/Modal
        "dialog-overlay-show": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "dialog-overlay-hide": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "dialog-content-show": {
          "0%": { opacity: "0", transform: "translate(-50%, -48%) scale(0.96)" },
          "100%": { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "dialog-content-hide": {
          "0%": { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
          "100%": { opacity: "0", transform: "translate(-50%, -48%) scale(0.96)" },
        },

        // Toast/Notification
        "toast-slide-in-right": {
          "0%": { transform: "translateX(calc(100% + 1rem))" },
          "100%": { transform: "translateX(0)" },
        },
        "toast-slide-out-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(calc(100% + 1rem))" },
        },
        "toast-swipe-out": {
          "0%": { transform: "translateX(var(--radix-toast-swipe-end-x))" },
          "100%": {
            transform: "translateX(calc(100% + 1rem))",
          },
        },

        // Dropdown
        "dropdown-menu-show": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "dropdown-menu-hide": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.95)" },
        },

        // Tooltip
        "tooltip-show": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "tooltip-hide": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.96)" },
        },

        // Checkmark draw
        "draw-check": {
          "0%": { strokeDashoffset: "100" },
          "100%": { strokeDashoffset: "0" },
        },

        // Ping/Notification
        ping: {
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
      },

      // Animation utilities
      animation: {
        // Existing animations
        wiggle: "wiggle 1s ease-in-out infinite",
        wave: "wave 0.5s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        heartbeat: "heartbeat 1.5s ease-in-out infinite",

        // Fade
        "fade-in": "fade-in 0.3s ease-out forwards",
        "fade-out": "fade-out 0.3s ease-out forwards",
        "fade-in-up": "fade-in-up 0.4s ease-out forwards",
        "fade-in-down": "fade-in-down 0.4s ease-out forwards",
        "fade-in-left": "fade-in-left 0.4s ease-out forwards",
        "fade-in-right": "fade-in-right 0.4s ease-out forwards",

        // Scale
        "scale-in": "scale-in 0.3s ease-out forwards",
        "scale-out": "scale-out 0.3s ease-out forwards",
        "bounce-in": "bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards",

        // Slide
        "slide-in-up": "slide-in-up 0.4s ease-out forwards",
        "slide-in-down": "slide-in-down 0.4s ease-out forwards",
        "slide-in-left": "slide-in-left 0.4s ease-out forwards",
        "slide-in-right": "slide-in-right 0.4s ease-out forwards",
        "slide-out-up": "slide-out-up 0.4s ease-out forwards",
        "slide-out-down": "slide-out-down 0.4s ease-out forwards",

        // Shimmer
        shimmer: "shimmer 2s linear infinite",
        "wave-skeleton": "wave-skeleton 1.6s linear infinite",

        // Pulse variations
        "pulse-scale": "pulse-scale 2s ease-in-out infinite",
        "heartbeat-strong": "heartbeat-strong 1.5s ease-in-out infinite",

        // Shake
        shake: "shake 0.5s ease-in-out",

        // Glow
        glow: "glow 2s ease-in-out infinite",

        // Spin
        "spin-slow": "spin 3s linear infinite",
        "spin-reverse": "spin-reverse 1s linear infinite",

        // Accordion
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",

        // Collapsible
        "collapsible-down": "collapsible-down 0.2s ease-out",
        "collapsible-up": "collapsible-up 0.2s ease-out",

        // Dialog
        "dialog-overlay-show": "dialog-overlay-show 0.15s ease-out",
        "dialog-overlay-hide": "dialog-overlay-hide 0.15s ease-in",
        "dialog-content-show": "dialog-content-show 0.2s ease-out",
        "dialog-content-hide": "dialog-content-hide 0.2s ease-in",

        // Toast
        "toast-slide-in-right": "toast-slide-in-right 0.3s ease-out",
        "toast-slide-out-right": "toast-slide-out-right 0.3s ease-in",
        "toast-swipe-out": "toast-swipe-out 0.1s ease-out",

        // Dropdown
        "dropdown-menu-show": "dropdown-menu-show 0.15s ease-out",
        "dropdown-menu-hide": "dropdown-menu-hide 0.15s ease-in",

        // Tooltip
        "tooltip-show": "tooltip-show 0.15s ease-out",
        "tooltip-hide": "tooltip-hide 0.15s ease-in",

        // Checkmark
        "draw-check": "draw-check 0.5s ease-out forwards",

        // Ping
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },

      // Custom transition timing functions
      transitionTimingFunction: {
        spring: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        bounce: "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
        smooth: "cubic-bezier(0.25, 0.1, 0.25, 1)",
        "quart-out": "cubic-bezier(0.25, 1, 0.5, 1)",
        "quart-in": "cubic-bezier(0.5, 0, 0.75, 0)",
        "expo-out": "cubic-bezier(0.19, 1, 0.22, 1)",
        "expo-in": "cubic-bezier(0.95, 0.05, 0.795, 0.035)",
      },

      // Animation delay utilities
      transitionDelay: {
        "0": "0ms",
        "75": "75ms",
        "100": "100ms",
        "150": "150ms",
        "200": "200ms",
        "300": "300ms",
        "400": "400ms",
        "500": "500ms",
        "700": "700ms",
        "1000": "1000ms",
      },

      // Custom scales for hover effects
      scale: {
        "98": ".98",
        "102": "1.02",
        "103": "1.03",
        "105": "1.05",
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
